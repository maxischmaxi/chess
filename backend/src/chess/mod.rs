use shakmaty::{fen::Fen, san::San, uci::UciMove, CastlingMode, Chess, Color, EnPassantMode, Outcome, Position};

use crate::error::AppError;

pub fn parse_fen(fen: &str) -> Result<Chess, AppError> {
    let fen: Fen = fen
        .parse()
        .map_err(|e| AppError::BadRequest(format!("Invalid FEN: {e}")))?;
    let chess: Chess = fen
        .into_position(CastlingMode::Standard)
        .map_err(|e| AppError::BadRequest(format!("Invalid position: {e}")))?;
    Ok(chess)
}

pub fn apply_uci_move(fen: &str, uci_move: &str) -> Result<(Chess, String), AppError> {
    let pos = parse_fen(fen)?;
    let uci: UciMove = uci_move
        .parse()
        .map_err(|e| AppError::BadRequest(format!("Invalid UCI move: {e}")))?;
    let mv = uci
        .to_move(&pos)
        .map_err(|e| AppError::BadRequest(format!("Illegal move: {e}")))?;

    // Get SAN notation before applying
    let san = San::from_move(&pos, &mv);
    let san_str = san.to_string();

    let mut new_pos = pos.clone();
    new_pos.play_unchecked(&mv);

    // Append check/checkmate symbols
    let san_str = if new_pos.is_checkmate() {
        format!("{san_str}#")
    } else if new_pos.is_check() {
        format!("{san_str}+")
    } else {
        san_str
    };

    Ok((new_pos, san_str))
}

pub fn legal_moves_uci(pos: &Chess) -> Vec<String> {
    let moves = pos.legal_moves();
    moves
        .iter()
        .map(|m| UciMove::from_move(m, CastlingMode::Standard).to_string())
        .collect()
}

pub fn position_to_fen(pos: &Chess) -> String {
    let setup = pos.clone().into_setup(EnPassantMode::Legal);
    let fen: Fen = setup.into();
    fen.to_string()
}

pub fn game_outcome(pos: &Chess) -> Option<(&'static str, Option<&'static str>)> {
    if let Some(outcome) = pos.outcome() {
        match outcome {
            Outcome::Decisive { winner } => {
                let result = match winner {
                    Color::White => "white",
                    Color::Black => "black",
                };
                Some(("checkmate", Some(result)))
            }
            Outcome::Draw => Some(("draw", None)),
        }
    } else if pos.is_stalemate() {
        Some(("stalemate", None))
    } else {
        None
    }
}

pub fn turn_color(pos: &Chess) -> Color {
    pos.turn()
}
