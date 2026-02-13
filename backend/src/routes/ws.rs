use axum::extract::ws::{Message, WebSocket};
use axum::extract::{Path, State, WebSocketUpgrade};
use axum::response::IntoResponse;
use futures_util::{SinkExt, StreamExt};
use uuid::Uuid;

use crate::chess;
use crate::db::models::GameStatus;
use crate::db::queries;
use crate::error::AppError;
use crate::protocol::{ClientMessage, ServerMessage};
use crate::state::AppState;

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    Path(game_id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let game = queries::get_game(&state.db, game_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Game not found".to_string()))?;

    // Send initial state upon connection
    let pos = chess::parse_fen(&game.fen)?;
    let legal = if game.status == GameStatus::Active {
        chess::legal_moves_uci(&pos)
    } else {
        vec![]
    };

    let initial_state = ServerMessage::GameState {
        id: game.id,
        fen: game.fen,
        moves: game.moves,
        status: game.status.to_string(),
        result: game.result,
        legal_moves: legal,
        white_connected: true,
        black_connected: game.black_secret.is_some(),
    };

    Ok(ws.on_upgrade(move |socket| handle_socket(socket, state, game_id, initial_state)))
}

async fn handle_socket(
    socket: WebSocket,
    state: AppState,
    game_id: Uuid,
    initial_state: ServerMessage,
) {
    let (mut ws_tx, mut ws_rx) = socket.split();

    // Subscribe to broadcast channel
    let tx = state.get_or_create_channel(game_id);
    let mut rx = tx.subscribe();

    // Send initial state
    let msg = serde_json::to_string(&initial_state).unwrap();
    if ws_tx.send(Message::Text(msg.into())).await.is_err() {
        return;
    }

    // Task to forward broadcast messages to WebSocket
    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            let text = serde_json::to_string(&msg).unwrap();
            if ws_tx.send(Message::Text(text.into())).await.is_err() {
                break;
            }
        }
    });

    // Task to handle incoming WebSocket messages
    let state_clone = state.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = ws_rx.next().await {
            if let Message::Text(text) = msg {
                handle_client_message(&state_clone, game_id, &text).await;
            }
        }
    });

    // Wait for either task to complete
    tokio::select! {
        _ = &mut send_task => recv_task.abort(),
        _ = &mut recv_task => send_task.abort(),
    }
}

async fn handle_client_message(state: &AppState, game_id: Uuid, text: &str) {
    let msg: ClientMessage = match serde_json::from_str(text) {
        Ok(m) => m,
        Err(e) => {
            tracing::warn!("Invalid WS message: {e}");
            return;
        }
    };

    match msg {
        ClientMessage::MakeMove { mv, secret } => {
            if let Err(e) = handle_make_move(state, game_id, &mv, secret).await {
                state.broadcast(
                    game_id,
                    ServerMessage::Error {
                        message: e.to_string(),
                    },
                );
            }
        }
        ClientMessage::Resign { secret } => {
            if let Err(e) = handle_resign(state, game_id, secret).await {
                state.broadcast(
                    game_id,
                    ServerMessage::Error {
                        message: e.to_string(),
                    },
                );
            }
        }
    }
}

async fn handle_make_move(
    state: &AppState,
    game_id: Uuid,
    uci_move: &str,
    secret: Uuid,
) -> Result<(), AppError> {
    let game = queries::get_game(&state.db, game_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Game not found".to_string()))?;

    if game.status != GameStatus::Active {
        return Err(AppError::BadRequest("Game is not active".to_string()));
    }

    let pos = chess::parse_fen(&game.fen)?;
    let turn = chess::turn_color(&pos);
    let is_white = secret == game.white_secret;
    let is_black = game.black_secret.map_or(false, |s| s == secret);

    if !is_white && !is_black {
        return Err(AppError::Unauthorized("Invalid secret".to_string()));
    }

    let is_white_turn = turn == shakmaty::Color::White;
    if (is_white_turn && !is_white) || (!is_white_turn && !is_black) {
        return Err(AppError::BadRequest("Not your turn".to_string()));
    }

    let (new_pos, san) = chess::apply_uci_move(&game.fen, uci_move)?;
    let new_fen = chess::position_to_fen(&new_pos);

    let mut new_moves = game.moves.clone();
    new_moves.push(san.clone());

    let (status, result) = chess::game_outcome(&new_pos)
        .map(|(s, r)| {
            let gs = match s {
                "checkmate" => GameStatus::Checkmate,
                "stalemate" => GameStatus::Stalemate,
                _ => GameStatus::Draw,
            };
            (gs, r.map(|r| r.to_string()))
        })
        .unwrap_or((GameStatus::Active, None));

    queries::update_game_state(
        &state.db,
        game_id,
        &new_fen,
        &new_moves,
        status.clone(),
        result.as_deref(),
    )
    .await?;

    let legal = if status == GameStatus::Active {
        chess::legal_moves_uci(&new_pos)
    } else {
        vec![]
    };

    state.broadcast(
        game_id,
        ServerMessage::MoveMade {
            mv: uci_move.to_string(),
            san,
            fen: new_fen,
            moves: new_moves,
            status: status.to_string(),
            result: result.clone(),
            legal_moves: legal,
        },
    );

    if status != GameStatus::Active {
        state.broadcast(
            game_id,
            ServerMessage::GameOver {
                status: status.to_string(),
                result,
            },
        );
    }

    Ok(())
}

async fn handle_resign(state: &AppState, game_id: Uuid, secret: Uuid) -> Result<(), AppError> {
    let game = queries::get_game(&state.db, game_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Game not found".to_string()))?;

    if game.status != GameStatus::Active {
        return Err(AppError::BadRequest("Game is not active".to_string()));
    }

    let is_white = secret == game.white_secret;
    let is_black = game.black_secret.map_or(false, |s| s == secret);

    if !is_white && !is_black {
        return Err(AppError::Unauthorized("Invalid secret".to_string()));
    }

    let winner = if is_white { "black" } else { "white" };

    queries::update_game_state(
        &state.db,
        game_id,
        &game.fen,
        &game.moves,
        GameStatus::Resigned,
        Some(winner),
    )
    .await?;

    state.broadcast(
        game_id,
        ServerMessage::GameOver {
            status: "resigned".to_string(),
            result: Some(winner.to_string()),
        },
    );

    Ok(())
}
