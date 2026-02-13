use dashmap::DashMap;
use sqlx::PgPool;
use std::sync::Arc;
use tokio::sync::broadcast;
use uuid::Uuid;

use crate::protocol::ServerMessage;

pub type GameChannels = Arc<DashMap<Uuid, broadcast::Sender<ServerMessage>>>;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub channels: GameChannels,
}

impl AppState {
    pub fn new(db: PgPool) -> Self {
        Self {
            db,
            channels: Arc::new(DashMap::new()),
        }
    }

    pub fn get_or_create_channel(&self, game_id: Uuid) -> broadcast::Sender<ServerMessage> {
        self.channels
            .entry(game_id)
            .or_insert_with(|| broadcast::channel(64).0)
            .clone()
    }

    pub fn broadcast(&self, game_id: Uuid, msg: ServerMessage) {
        if let Some(tx) = self.channels.get(&game_id) {
            let _ = tx.send(msg);
        }
    }
}
