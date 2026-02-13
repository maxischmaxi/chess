CREATE TYPE game_status AS ENUM ('waiting','active','checkmate','stalemate','draw','resigned');

CREATE TABLE games (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    white_secret UUID NOT NULL DEFAULT gen_random_uuid(),
    black_secret UUID,
    fen         TEXT NOT NULL DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    moves       TEXT[] NOT NULL DEFAULT '{}',
    status      game_status NOT NULL DEFAULT 'waiting',
    result      TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
