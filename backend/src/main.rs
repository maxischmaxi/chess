mod chess;
mod db;
mod error;
mod protocol;
mod routes;
mod state;

use axum::routing::{get, post};
use axum::Router;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing_subscriber::EnvFilter;

use state::AppState;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .init();

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = db::pool::create_pool(&database_url)
        .await
        .expect("Failed to create DB pool");

    tracing::info!("Connected to database");

    let state = AppState::new(pool);

    let app = Router::new()
        .route("/api/games", post(routes::games::create_game))
        .route("/api/games", get(routes::games::list_games))
        .route("/api/games/{id}", get(routes::games::get_game))
        .route("/api/games/{id}/join", post(routes::games::join_game))
        .route("/api/games/{id}/moves", post(routes::games::make_move))
        .route("/ws/games/{id}", get(routes::ws::ws_handler))
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::permissive())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
        .await
        .expect("Failed to bind");

    tracing::info!("Server listening on http://0.0.0.0:3000");

    axum::serve(listener, app).await.expect("Server failed");
}
