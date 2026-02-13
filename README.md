# Chess

Real-time two-player chess application with a Rust backend and React frontend.

## Prerequisites

- **Rust** (stable toolchain) — [rustup.rs](https://rustup.rs)
- **Node.js** (v20+) and npm
- **PostgreSQL** database (e.g. [Neon](https://neon.tech) for serverless Postgres)

## Setup

```bash
# Install development tools (watchexec for hot reload, sqlx-cli for migrations)
make setup

# Configure database connection
cp backend/.env.example backend/.env
# Edit backend/.env with your DATABASE_URL

# Run database migrations
make db-migrate
```

## Development

```bash
make dev
```

This starts both services in parallel:
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend**: http://localhost:3000 (Axum, auto-restarts on file changes via watchexec)

The Vite dev server proxies `/api` and `/ws` requests to the backend.

## How to Play

1. Open http://localhost:5173
2. Click "Create Game" — you play as White
3. Copy the game URL and open it in another browser tab/window
4. Click "Join as Black" in the second tab
5. Make moves by dragging pieces

No accounts or login required. Player identity is managed via random secrets stored in your browser's localStorage.

## Project Structure

```text
├── Makefile              # Build & dev commands
├── backend/              # Rust (Axum) API server
│   ├── migrations/       # SQL migrations (sqlx)
│   └── src/
│       ├── main.rs       # Server entry point
│       ├── chess/        # shakmaty wrapper (move validation, legal moves)
│       ├── db/           # Database pool, models, queries
│       └── routes/       # REST endpoints + WebSocket handler
└── frontend/             # React (Vite) SPA
    ├── public/pieces/    # Chess piece SVGs
    └── src/
        ├── api/          # HTTP client & React Query hooks
        ├── canvas/       # Board rendering & interaction (Canvas 2D)
        ├── components/   # React components
        ├── hooks/        # WebSocket & piece loading hooks
        ├── lib/          # Chess utilities & localStorage helpers
        └── routes/       # TanStack Router file-based routes
```

## Tech Stack

| | Technology |
|-|------------|
| Backend | Rust, Axum, Tokio, shakmaty |
| Database | PostgreSQL, sqlx |
| Frontend | React 19, TypeScript, Vite, TanStack Router & Query |
| Board | Canvas 2D with HiDPI support |
| Real-time | WebSocket with broadcast channels |

## API Overview

### REST

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/games` | Create a new game |
| GET | `/api/games` | List recent games |
| GET | `/api/games/{id}` | Get game state |
| POST | `/api/games/{id}/join` | Join as black |
| POST | `/api/games/{id}/moves` | Submit a move |

### WebSocket

Connect to `/ws/games/{id}` for real-time updates. Messages are JSON with a `type` field:

- **Server -> Client**: `game_state`, `move_made`, `player_joined`, `game_over`, `error`
- **Client -> Server**: `make_move`, `resign`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `RUST_LOG` | No | Log level filter (default: `info`) |
