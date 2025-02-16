export const CHESSBOARD_SIZE = 8;

export type Chessfield = {
    color: "black" | "white";
    numberLabel: string;
    piece?: Piece;
};

export type Move = { targetRow: number; targetCol: number };

export enum Piece {
    WhitePawn = "P",
    WhiteKnight = "N",
    WhiteBishop = "B",
    WhiteRook = "R",
    WhiteQueen = "Q",
    WhiteKing = "K",
    BlackPawn = "p",
    BlackKnight = "n",
    BlackBishop = "b",
    BlackRook = "r",
    BlackQueen = "q",
    BlackKing = "k",
}

export type ActivePiece = {
    piece: Piece;
    row: number;
    col: number;
    grabPoint: { x: number; y: number };
};

export const palette = {
    dark: "hsl(0 0% 3.9%)", // "#769656",
    light: "hsl(240 5.9% 10%)", // "#eeeed2",
    active: "#424242", // "#baca44",
    white: "#ffffff",
    black: "#000000",
    selected: "#ff0000",
};

export type WebsocketMessage = {
    type: "fen" | "move" | "join" | "leave";
    payload: string;
};
