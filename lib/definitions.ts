import { Color, Piece, PieceSymbol } from "chess.js";

export const CHESSBOARD_SIZE = 8;

export type Chessfield = {
    color: "black" | "white";
    numberLabel: string;
    piece?: Piece;
};

export type ActivePiece = {
    piece: Piece & { square: string };
    row: number;
    col: number;
    grabPoint: { x: number; y: number };
};

export const palette = {
    dark: "rgb(30, 30, 46)",
    light: "rgb(88, 91, 112)",
    active: "rgb(180, 190, 254)",
    white: "rgb(205, 214, 244)",
    black: "rgb(17, 17, 27)",
    selected: "rgb(243, 139, 168)",
};

export type WebsocketMessage = {
    type: "fen" | "move" | "join" | "leave";
    payload: string;
};

export type Board = ({
    square: string;
    type: PieceSymbol;
    color: Color;
} | null)[][];

export type ChessImages = {
    "bishop-b": HTMLImageElement | null;
    "bishop-w": HTMLImageElement | null;
    "king-b": HTMLImageElement | null;
    "king-w": HTMLImageElement | null;
    "knight-b": HTMLImageElement | null;
    "knight-w": HTMLImageElement | null;
    "pawn-b": HTMLImageElement | null;
    "pawn-w": HTMLImageElement | null;
    "queen-b": HTMLImageElement | null;
    "queen-w": HTMLImageElement | null;
    "rook-b": HTMLImageElement | null;
    "rook-w": HTMLImageElement | null;
};

export const defaultChessImages: ChessImages = {
    "pawn-b": null,
    "pawn-w": null,
    "bishop-b": null,
    "bishop-w": null,
    "knight-b": null,
    "knight-w": null,
    "rook-b": null,
    "rook-w": null,
    "queen-b": null,
    "king-b": null,
    "queen-w": null,
    "king-w": null,
};

export type LocalGame = {
    id: string;
    color: "w" | "b";
    player1: string;
    player2: string;
    fen: string;
    moves: string[];
};
