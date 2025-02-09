import { Piece } from "./pieces";

export type Chessfield = {
    color: "black" | "white";
    numberLabel: string;
    letterLabel: string;
    piece?: Piece;
};
