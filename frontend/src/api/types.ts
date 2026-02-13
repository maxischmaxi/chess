export interface Game {
  id: string;
  fen: string;
  moves: string[];
  status: string;
  result: string | null;
  created_at: string;
  updated_at: string;
  has_black: boolean;
}

export interface GameWithSecret extends Game {
  secret: string;
  color: "white" | "black";
}

export type ServerMessage =
  | {
      type: "game_state";
      id: string;
      fen: string;
      moves: string[];
      status: string;
      result: string | null;
      legal_moves: string[];
      white_connected: boolean;
      black_connected: boolean;
    }
  | {
      type: "move_made";
      move: string;
      san: string;
      fen: string;
      moves: string[];
      status: string;
      result: string | null;
      legal_moves: string[];
    }
  | {
      type: "player_joined";
      color: string;
      fen: string;
      status: string;
      legal_moves: string[];
    }
  | {
      type: "game_over";
      status: string;
      result: string | null;
    }
  | {
      type: "error";
      message: string;
    };

export interface ClientMakeMove {
  type: "make_move";
  move: string;
  secret: string;
}

export interface ClientResign {
  type: "resign";
  secret: string;
}

export type ClientMessage = ClientMakeMove | ClientResign;
