import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Chessfield, Piece } from "./definitions";
import { IUseImages } from "@/components/images-provider";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function isEnemyPiece(myPiece: Piece, theirPiece?: Piece): boolean {
    if (theirPiece === undefined) return false;
    return (
        (isWhitePiece(myPiece) && isBlackPiece(theirPiece)) ||
        (isBlackPiece(myPiece) && isWhitePiece(theirPiece))
    );
}

export function isSameColor(myPiece: Piece, theirPiece?: Piece): boolean {
    if (theirPiece === undefined) return false;
    return (
        (isWhitePiece(myPiece) && isWhitePiece(theirPiece)) ||
        (isBlackPiece(myPiece) && isBlackPiece(theirPiece))
    );
}

export function isWhitePiece(piece: Piece): boolean {
    return (
        piece === Piece.WhitePawn ||
        piece === Piece.WhiteKnight ||
        piece === Piece.WhiteBishop ||
        piece === Piece.WhiteRook ||
        piece === Piece.WhiteQueen ||
        piece === Piece.WhiteKing
    );
}

export function isBlackPiece(piece: Piece): boolean {
    return (
        piece === Piece.BlackPawn ||
        piece === Piece.BlackKnight ||
        piece === Piece.BlackBishop ||
        piece === Piece.BlackRook ||
        piece === Piece.BlackQueen ||
        piece === Piece.BlackKing
    );
}

export function isOnBoard(r: number, c: number): boolean {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
}

export function getActivePlayer(fen: string): "w" | "b" {
    return fen.split(" ")[1] === "w" ? "w" : "b";
}

export function createChessboard(fen: string): Chessfield[][] {
    const boardLayout = fen.split(" ")[0];
    const ranks = boardLayout.split("/");
    if (ranks.length !== 8) {
        throw new Error(
            "FEN ungültig oder unvollständig (es müssen 8 Ranks sein).",
        );
    }

    const board: Chessfield[][] = [[], [], [], [], [], [], [], []];

    for (let row = 7; row >= 0; row--) {
        let col = 0;
        for (let i = 0; i < ranks[row].length; i++) {
            const ch = ranks[row][i];
            if (ch >= "1" && ch <= "8") {
                const emptySquares = parseInt(ch, 10);
                for (let j = 0; j < emptySquares; j++) {
                    board[row].push(
                        createField(
                            row,
                            col++,
                            `${String.fromCharCode("a".charCodeAt(0) + col - 1)}${8 - row}`,
                        ),
                    );
                }
            } else {
                const piece = parseFenChar(ch);
                if (piece === undefined) {
                    throw new Error(
                        `Ungültiges Zeichen in FEN: ${ch} in Rank ${row}`,
                    );
                }
                board[row].push(
                    createField(
                        row,
                        col++,
                        `${String.fromCharCode("a".charCodeAt(0) + col - 1)}${8 - row}`,
                        piece,
                    ),
                );
            }
        }
    }

    return board;
}

function createField(
    row: number,
    col: number,
    numberLabel: string,
    piece?: Piece,
): Chessfield {
    const color = (row + col) % 2 === 0 ? "white" : "black";

    return {
        color,
        numberLabel,
        piece,
    };
}

function parseFenChar(ch: string): Piece | undefined {
    switch (ch) {
        case "P":
            return Piece.WhitePawn;
        case "N":
            return Piece.WhiteKnight;
        case "B":
            return Piece.WhiteBishop;
        case "R":
            return Piece.WhiteRook;
        case "Q":
            return Piece.WhiteQueen;
        case "K":
            return Piece.WhiteKing;
        case "p":
            return Piece.BlackPawn;
        case "n":
            return Piece.BlackKnight;
        case "b":
            return Piece.BlackBishop;
        case "r":
            return Piece.BlackRook;
        case "q":
            return Piece.BlackQueen;
        case "k":
            return Piece.BlackKing;

        default:
            return undefined;
    }
}

export function getPieceColor(piece: Piece): "w" | "b" {
    return isWhitePiece(piece) ? "w" : "b";
}

export function getPieceImage(piece: Piece): string {
    switch (piece) {
        case Piece.WhitePawn:
            return "/pawn-w.svg";
        case Piece.WhiteKnight:
            return "/knight-w.svg";
        case Piece.WhiteBishop:
            return "/bishop-w.svg";
        case Piece.WhiteRook:
            return "/rook-w.svg";
        case Piece.WhiteQueen:
            return "/queen-w.svg";
        case Piece.WhiteKing:
            return "/king-w.svg";
        case Piece.BlackPawn:
            return "/pawn-b.svg";
        case Piece.BlackKnight:
            return "/knight-b.svg";
        case Piece.BlackBishop:
            return "/bishop-b.svg";
        case Piece.BlackRook:
            return "/rook-b.svg";
        case Piece.BlackQueen:
            return "/queen-b.svg";
        case Piece.BlackKing:
            return "/king-b.svg";
        default:
            return "";
    }
}

export function isMouseOverCell(
    row: number,
    col: number,
    cellSize: number,
    mouseX: number,
    mouseY: number,
): boolean {
    const x = col * cellSize;
    const y = row * cellSize;

    return (
        mouseX >= x &&
        mouseX <= x + cellSize &&
        mouseY >= y &&
        mouseY <= y + cellSize
    );
}

export function evaluationToWinProbability(evalCp: number) {
    const MAX_EVAL = 10000;
    if (evalCp > MAX_EVAL) {
        evalCp = MAX_EVAL;
    }
    if (evalCp < -MAX_EVAL) {
        evalCp = -MAX_EVAL;
    }

    const exponent = -evalCp / 400;
    return 1 / (1 + Math.pow(10, exponent));
}

export function getImageByPiece(piece: Piece, images: IUseImages) {
    switch (piece) {
        case Piece.BlackBishop:
            return images.bishopB.image;
        case Piece.WhiteBishop:
            return images.bishopW.image;
        case Piece.BlackKing:
            return images.kingB.image;
        case Piece.WhiteKing:
            return images.kingW.image;
        case Piece.BlackKnight:
            return images.knightB.image;
        case Piece.WhiteKnight:
            return images.knightW.image;
        case Piece.BlackPawn:
            return images.pawnB.image;
        case Piece.WhitePawn:
            return images.pawnW.image;
        case Piece.BlackQueen:
            return images.queenB.image;
        case Piece.WhiteQueen:
            return images.queenW.image;
        case Piece.BlackRook:
            return images.rookB.image;
        case Piece.WhiteRook:
            return images.rookW.image;
        default:
            return null;
    }
}

export function isCastleMove(
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
): boolean {
    return (
        (fromRow === 0 && fromCol === 4 && toRow === 0 && toCol === 6) ||
        (fromRow === 0 && fromCol === 4 && toRow === 0 && toCol === 2) ||
        (fromRow === 7 && fromCol === 4 && toRow === 7 && toCol === 7) ||
        (fromRow === 7 && fromCol === 4 && toRow === 7 && toCol === 0)
    );
}

export function moveToUciNotation(
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
    isCastle: boolean,
    piece: string = "",
): string {
    if (isCastle) {
        if (fromRow === 0 && fromCol === 4 && toRow === 0 && toCol === 6) {
            return "e8g8";
        }
        if (fromRow === 0 && fromCol === 4 && toRow === 0 && toCol === 2) {
            return "e8c8";
        }
        if (fromRow === 7 && fromCol === 4 && toRow === 7 && toCol === 7) {
            return "e1g1";
        }
        if (fromRow === 7 && fromCol === 4 && toRow === 7 && toCol === 0) {
            return "e1c1";
        }
    }

    const colString = String.fromCharCode("a".charCodeAt(0) + fromCol);
    const targetColString = String.fromCharCode("a".charCodeAt(0) + toCol);
    const targetString = `${targetColString}${8 - toRow}`;
    const move = `${colString}${8 - fromRow}${targetString}`;
    return move + piece;
}
