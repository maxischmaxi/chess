use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::Type;
use uuid::Uuid;

#[derive(Debug, Type, Serialize, Clone, PartialEq)]
#[sqlx(type_name = "game_status", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum GameStatus {
    Waiting,
    Active,
    Checkmate,
    Stalemate,
    Draw,
    Resigned,
}

impl std::fmt::Display for GameStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            GameStatus::Waiting => write!(f, "waiting"),
            GameStatus::Active => write!(f, "active"),
            GameStatus::Checkmate => write!(f, "checkmate"),
            GameStatus::Stalemate => write!(f, "stalemate"),
            GameStatus::Draw => write!(f, "draw"),
            GameStatus::Resigned => write!(f, "resigned"),
        }
    }
}

#[derive(Debug, sqlx::FromRow)]
pub struct GameRow {
    pub id: Uuid,
    pub white_secret: Uuid,
    pub black_secret: Option<Uuid>,
    pub fen: String,
    pub moves: Vec<String>,
    pub status: GameStatus,
    pub result: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct GameResponse {
    pub id: Uuid,
    pub fen: String,
    pub moves: Vec<String>,
    pub status: String,
    pub result: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub has_black: bool,
}

#[derive(Debug, Serialize)]
pub struct GameWithSecret {
    #[serde(flatten)]
    pub game: GameResponse,
    pub secret: Uuid,
    pub color: String,
}

impl GameRow {
    pub fn to_response(&self) -> GameResponse {
        GameResponse {
            id: self.id,
            fen: self.fen.clone(),
            moves: self.moves.clone(),
            status: self.status.to_string(),
            result: self.result.clone(),
            created_at: self.created_at,
            updated_at: self.updated_at,
            has_black: self.black_secret.is_some(),
        }
    }

    pub fn to_with_secret(&self, secret: Uuid, color: &str) -> GameWithSecret {
        GameWithSecret {
            game: self.to_response(),
            secret,
            color: color.to_string(),
        }
    }
}
