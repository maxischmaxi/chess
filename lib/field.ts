import { Piece } from "./pieces";

export type Chessfield = {
    color: "black" | "white";
    numberLabel: string;
    letterLabel: string;
    piece?: Piece;
};

export type Board = {
    fields: Chessfield[][];
    fens: string[];
    activePlayer: "w" | "b";
    fenIndex: number;
};
