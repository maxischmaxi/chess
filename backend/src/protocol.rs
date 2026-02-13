use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Clone)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ServerMessage {
    GameState {
        id: Uuid,
        fen: String,
        moves: Vec<String>,
        status: String,
        result: Option<String>,
        legal_moves: Vec<String>,
        white_connected: bool,
        black_connected: bool,
    },
    MoveMade {
        #[serde(rename = "move")]
        mv: String,
        san: String,
        fen: String,
        moves: Vec<String>,
        status: String,
        result: Option<String>,
        legal_moves: Vec<String>,
    },
    PlayerJoined {
        color: String,
        fen: String,
        status: String,
        legal_moves: Vec<String>,
    },
    GameOver {
        status: String,
        result: Option<String>,
    },
    Error {
        message: String,
    },
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ClientMessage {
    MakeMove {
        #[serde(rename = "move")]
        mv: String,
        secret: Uuid,
    },
    Resign {
        secret: Uuid,
    },
}
