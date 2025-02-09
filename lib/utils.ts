import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Piece } from "./pieces";
import { Chessfield } from "./field";

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

export function getActivePlayer(fen: string): "white" | "black" {
    return fen.split(" ")[1] === "w" ? "white" : "black";
}

export function createChessboard(fen: string): Chessfield[][] {
    // Nur den Board-Teil extrahieren (vor erstem Leerzeichen)
    const [boardLayout] = fen.split(" ");
    // Aufteilen nach '/' => jede der 8 Reihen (Rank 8 bis Rank 1)
    const ranks = boardLayout.split("/");
    if (ranks.length !== 8) {
        throw new Error(
            "FEN ungültig oder unvollständig (es müssen 8 Ranks sein).",
        );
    }

    // Unser resultierendes 8x8-Array
    const board: Chessfield[][] = [];

    for (let row = 0; row < 8; row++) {
        const rankStr = ranks[row];
        // In FEN entspricht row=0 dem 8. Rang, row=7 dem 1. Rang => numberLabel = 8 - row
        const numberLabelForRow = (8 - row).toString();
        const rankFields: Chessfield[] = [];

        let col = 0; // Spaltenindex 0..7
        for (const ch of rankStr) {
            if (/\d/.test(ch)) {
                // Ist es eine Ziffer => so viele leere Felder
                const emptyCount = parseInt(ch, 10);
                for (let i = 0; i < emptyCount; i++) {
                    rankFields.push(
                        createField(row, col, numberLabelForRow, undefined),
                    );
                    col++;
                }
            } else {
                // Muss ein Figuren-Zeichen sein
                const piece = parseFenChar(ch);
                rankFields.push(
                    createField(row, col, numberLabelForRow, piece),
                );
                col++;
            }
            // Falls col über 7 hinausgeht, ist das FEN fehlerhaft
            if (col > 8) {
                throw new Error(`FEN Zeile ${row + 1} hat zu viele Spalten.`);
            }
        }

        if (col !== 8) {
            throw new Error(
                `FEN Zeile ${row + 1} hat zu wenige Spalten (Spalten=${col}).`,
            );
        }

        board.push(rankFields);
    }

    return board;
}

function createField(
    row: number,
    col: number,
    numberLabel: string,
    piece?: Piece,
): Chessfield {
    // letterLabel = 'a' + col
    const letterLabel = String.fromCharCode("a".charCodeAt(0) + col);

    // Farbzuweisung: Wir wollen "a1" als schwarzes Feld:
    //  => "a1" = row=7, col=0 => sum=7 => ungerade => black
    //  => => (row + col) % 2 === 0 => "white", sonst "black".
    const color = (row + col) % 2 === 0 ? "white" : "black";

    return {
        color,
        numberLabel,
        letterLabel,
        piece,
    };
}

function parseFenChar(ch: string): Piece | undefined {
    switch (ch) {
        // Weiße Figuren (Großbuchstaben)
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

        // Schwarze Figuren (Kleinbuchstaben)
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

export function boardToFen(
    board: Chessfield[][],
    nextPlayer: "w" | "b",
): string {
    const fenRanks = [];

    // Wir iterieren von oben (row=0 => Rang 8) nach unten (row=7 => Rang 1)
    for (let row = 0; row < 8; row++) {
        let emptyCount = 0;
        let fenRank = "";

        for (let col = 0; col < 8; col++) {
            // Eintrag im Board
            const cell = board[row][col];
            // Hat die Zelle ein piece?
            if (!cell || !cell.piece) {
                // Leeres Feld => Leerzählung hochzählen
                emptyCount++;
            } else {
                // Falls wir zuvor leere Felder hatten, diese zuerst niederschreiben
                if (emptyCount > 0) {
                    fenRank += emptyCount;
                    emptyCount = 0;
                }
                // Figurenbuchstabe ermitteln (z.B. "p", "P", "r" etc.)
                fenRank += cell.piece;
            }
        }

        // Am Ende der Zeile: Falls noch leere Felder übrig sind, anhängen
        if (emptyCount > 0) {
            fenRank += emptyCount;
        }

        fenRanks.push(fenRank);
    }

    // "rnbqkbnr/..." Teil fertig => Zusammenfassen
    const boardPart = fenRanks.join("/");

    // FEN-Teile zusammenbauen.
    // Minimalvariante (kein Castling "-", kein En-Passant "-", Halbzug-Zähler "0", Zugnummer "1"):
    const fen = `${boardPart} ${nextPlayer} - - 0 1`;

    return fen;
}
