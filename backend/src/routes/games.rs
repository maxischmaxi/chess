use axum::extract::{Path, State};
use axum::Json;
use serde::Deserialize;
use uuid::Uuid;

use crate::chess;
use crate::db::models::{GameResponse, GameStatus, GameWithSecret};
use crate::db::queries;
use crate::error::AppError;
use crate::protocol::ServerMessage;
use crate::state::AppState;

pub async fn create_game(
    State(state): State<AppState>,
) -> Result<Json<GameWithSecret>, AppError> {
    let game = queries::create_game(&state.db).await?;
    Ok(Json(game.to_with_secret(game.white_secret, "white")))
}

pub async fn list_games(
    State(state): State<AppState>,
) -> Result<Json<Vec<GameResponse>>, AppError> {
    let games = queries::list_games(&state.db).await?;
    Ok(Json(games.iter().map(|g| g.to_response()).collect()))
}

pub async fn get_game(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<GameResponse>, AppError> {
    let game = queries::get_game(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Game not found".to_string()))?;
    Ok(Json(game.to_response()))
}

pub async fn join_game(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<GameWithSecret>, AppError> {
    // Check game exists and is joinable
    let existing = queries::get_game(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Game not found".to_string()))?;

    if existing.black_secret.is_some() {
        return Err(AppError::Conflict("Game already has two players".to_string()));
    }

    let game = queries::join_game(&state.db, id).await?;
    let secret = game
        .black_secret
        .ok_or_else(|| AppError::Internal("Failed to generate black secret".to_string()))?;

    // Broadcast player joined with legal moves
    let pos = chess::parse_fen(&game.fen)?;
    let legal = chess::legal_moves_uci(&pos);
    state.broadcast(
        id,
        ServerMessage::PlayerJoined {
            color: "black".to_string(),
            fen: game.fen.clone(),
            status: game.status.to_string(),
            legal_moves: legal,
        },
    );

    Ok(Json(game.to_with_secret(secret, "black")))
}

#[derive(Deserialize)]
pub struct MakeMoveRequest {
    #[serde(rename = "move")]
    pub mv: String,
    pub secret: Uuid,
}

pub async fn make_move(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(req): Json<MakeMoveRequest>,
) -> Result<Json<GameResponse>, AppError> {
    let game = queries::get_game(&state.db, id)
        .await?
        .ok_or_else(|| AppError::NotFound("Game not found".to_string()))?;

    if game.status != GameStatus::Active {
        return Err(AppError::BadRequest("Game is not active".to_string()));
    }

    // Verify player identity
    let pos = chess::parse_fen(&game.fen)?;
    let turn = chess::turn_color(&pos);
    let is_white = req.secret == game.white_secret;
    let is_black = game.black_secret.map_or(false, |s| s == req.secret);

    if !is_white && !is_black {
        return Err(AppError::Unauthorized("Invalid secret".to_string()));
    }

    let is_white_turn = turn == shakmaty::Color::White;
    if (is_white_turn && !is_white) || (!is_white_turn && !is_black) {
        return Err(AppError::BadRequest("Not your turn".to_string()));
    }

    // Apply move
    let (new_pos, san) = chess::apply_uci_move(&game.fen, &req.mv)?;
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

    let updated = queries::update_game_state(
        &state.db,
        id,
        &new_fen,
        &new_moves,
        status.clone(),
        result.as_deref(),
    )
    .await?;

    // Broadcast
    let legal = if status == GameStatus::Active {
        chess::legal_moves_uci(&new_pos)
    } else {
        vec![]
    };

    state.broadcast(
        id,
        ServerMessage::MoveMade {
            mv: req.mv,
            san,
            fen: new_fen.clone(),
            moves: new_moves.clone(),
            status: status.to_string(),
            result: result.clone(),
            legal_moves: legal,
        },
    );

    if status != GameStatus::Active {
        state.broadcast(
            id,
            ServerMessage::GameOver {
                status: status.to_string(),
                result,
            },
        );
    }

    Ok(Json(updated.to_response()))
}
