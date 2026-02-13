use sqlx::PgPool;
use uuid::Uuid;

use super::models::{GameRow, GameStatus};

pub async fn create_game(pool: &PgPool) -> Result<GameRow, sqlx::Error> {
    sqlx::query_as::<_, GameRow>(
        "INSERT INTO games DEFAULT VALUES RETURNING *"
    )
    .fetch_one(pool)
    .await
}

pub async fn get_game(pool: &PgPool, id: Uuid) -> Result<Option<GameRow>, sqlx::Error> {
    sqlx::query_as::<_, GameRow>("SELECT * FROM games WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn list_games(pool: &PgPool) -> Result<Vec<GameRow>, sqlx::Error> {
    sqlx::query_as::<_, GameRow>(
        "SELECT * FROM games ORDER BY created_at DESC LIMIT 50"
    )
    .fetch_all(pool)
    .await
}

pub async fn join_game(pool: &PgPool, id: Uuid) -> Result<GameRow, sqlx::Error> {
    sqlx::query_as::<_, GameRow>(
        "UPDATE games SET black_secret = gen_random_uuid(), status = 'active', updated_at = NOW() \
         WHERE id = $1 AND black_secret IS NULL \
         RETURNING *"
    )
    .bind(id)
    .fetch_one(pool)
    .await
}

pub async fn update_game_state(
    pool: &PgPool,
    id: Uuid,
    fen: &str,
    moves: &[String],
    status: GameStatus,
    result: Option<&str>,
) -> Result<GameRow, sqlx::Error> {
    sqlx::query_as::<_, GameRow>(
        "UPDATE games SET fen = $2, moves = $3, status = $4, result = $5, updated_at = NOW() \
         WHERE id = $1 RETURNING *"
    )
    .bind(id)
    .bind(fen)
    .bind(moves)
    .bind(status)
    .bind(result)
    .fetch_one(pool)
    .await
}
