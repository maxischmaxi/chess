import { Chessfield, Move } from "./field";
import { Piece } from "./pieces";
import {
    createChessboard,
    isBlackPiece,
    isEnemyPiece,
    isOnBoard,
    isWhitePiece,
} from "./utils";

export function getPossibleMoves(
    piece: Piece,
    row: number,
    col: number,
    fields: Chessfield[][],
    fens: string[],
): Move[] {
    switch (piece) {
        case Piece.WhitePawn:
        case Piece.BlackPawn:
            return getPossiblePawnMoves(piece, row, col, fields);

        case Piece.WhiteKnight:
        case Piece.BlackKnight:
            return getPossibleKnightMoves(piece, row, col, fields);

        case Piece.WhiteBishop:
        case Piece.BlackBishop:
            return getPossibleBishopMoves(piece, row, col, fields);

        case Piece.WhiteRook:
        case Piece.BlackRook:
            return getPossibleRookMoves(piece, row, col, fields);

        case Piece.WhiteQueen:
        case Piece.BlackQueen:
            return getPossibleQueenMoves(piece, row, col, fields);

        case Piece.WhiteKing:
        case Piece.BlackKing:
            return getPossibleKingMoves(piece, row, col, fields, fens);

        default:
            return [];
    }
}

function getRayMoves(
    piece: Piece,
    row: number,
    col: number,
    fields: Chessfield[][],
    directions: [number, number][], // z.B. für Läufer: [(-1,-1), (-1,1), (1,-1), (1,1)]
): Move[] {
    const possibleMoves: Move[] = [];

    for (const [dr, dc] of directions) {
        let r = row;
        let c = col;

        while (true) {
            r += dr;
            c += dc;
            if (!isOnBoard(r, c)) {
                // Außerhalb des Bretts -> abbrechen
                break;
            }
            const targetPiece = fields[r][c].piece;
            if (!targetPiece) {
                // Leer -> wir können hinziehen und weiter "strahlen"
                possibleMoves.push({ targetRow: r, targetCol: c });
            } else {
                // Da steht ein Stück - entweder gegnerisch (dann capture möglich) oder eigenes
                if (isEnemyPiece(piece, targetPiece)) {
                    possibleMoves.push({ targetRow: r, targetCol: c });
                }
                // In beiden Fällen: Wir können nicht weiter, Richtung blockiert
                break;
            }
        }
    }

    return possibleMoves;
}

function getPossibleCastles(
    fens: string[],
    nextPlayer: "w" | "b",
): { targetRow: number; targetCol: number }[] {
    const parts = fens[fens.length - 1].split(" ");
    const currentPlayer = parts[1];
    const castles = parts[2];
    const possibleCastles: { targetRow: number; targetCol: number }[] = [];

    if (currentPlayer !== nextPlayer) {
        return [];
    }

    if (castles === "-") {
        return [];
    }

    const board = createChessboard(fens[fens.length - 1]);

    if (nextPlayer === "w") {
        if (castles.includes("K")) {
            if (
                board[7][5].piece === undefined &&
                board[7][6].piece === undefined
            ) {
                possibleCastles.push({
                    targetRow: 7,
                    targetCol: 7,
                });
            }
        }

        if (castles.includes("Q")) {
            if (
                board[7][1].piece === undefined &&
                board[7][2].piece === undefined &&
                board[7][3].piece === undefined
            ) {
                possibleCastles.push({
                    targetRow: 7,
                    targetCol: 0,
                });
            }
        }
    } else {
        if (castles.includes("k")) {
            if (
                board[0][5].piece === undefined &&
                board[0][6].piece === undefined
            ) {
                possibleCastles.push({
                    targetRow: 0,
                    targetCol: 7,
                });
            }
        }

        if (castles.includes("q")) {
            if (
                board[0][1].piece === undefined &&
                board[0][2].piece === undefined &&
                board[0][3].piece === undefined
            ) {
                possibleCastles.push({
                    targetRow: 0,
                    targetCol: 0,
                });
            }
        }
    }

    return possibleCastles;
}

function getPossibleKingMoves(
    piece: Piece,
    row: number,
    col: number,
    fields: Chessfield[][],
    fens: string[],
): { targetRow: number; targetCol: number }[] {
    const possibleMoves: { targetRow: number; targetCol: number }[] = [];

    // 8 Nachbarfelder
    const kingSteps = [
        [row - 1, col - 1],
        [row - 1, col],
        [row - 1, col + 1],
        [row, col - 1],
        [row, col + 1],
        [row + 1, col - 1],
        [row + 1, col],
        [row + 1, col + 1],
    ];

    for (const [r, c] of kingSteps) {
        if (isOnBoard(r, c)) {
            const targetPiece = fields[r][c].piece;

            if (!targetPiece) {
                possibleMoves.push({ targetRow: r, targetCol: c });
            }

            if (isEnemyPiece(piece, targetPiece)) {
                possibleMoves.push({ targetRow: r, targetCol: c });
            }
        }
    }

    const possibleCastles = getPossibleCastles(
        fens,
        isWhitePiece(piece) ? "w" : "b",
    );

    for (const { targetRow, targetCol } of possibleCastles) {
        possibleMoves.push({ targetRow, targetCol });
    }

    return possibleMoves;
}

function getPossibleQueenMoves(
    piece: Piece,
    row: number,
    col: number,
    fields: Chessfield[][],
): Move[] {
    // 8 Richtungen (diagonale + orthogonale)
    const queenDirections: [number, number][] = [
        [-1, -1],
        [-1, +1],
        [+1, -1],
        [+1, +1],
        [0, +1],
        [0, -1],
        [+1, 0],
        [-1, 0],
    ];
    return getRayMoves(piece, row, col, fields, queenDirections);
}

function getPossibleRookMoves(
    piece: Piece,
    row: number,
    col: number,
    fields: Chessfield[][],
): Move[] {
    const rookDirections: [number, number][] = [
        [0, +1],
        [0, -1],
        [+1, 0],
        [-1, 0],
    ];
    return getRayMoves(piece, row, col, fields, rookDirections);
}

function getPossibleBishopMoves(
    piece: Piece,
    row: number,
    col: number,
    fields: Chessfield[][],
): Move[] {
    const bishopDirections: [number, number][] = [
        [-1, -1],
        [-1, +1],
        [+1, -1],
        [+1, +1],
    ];
    return getRayMoves(piece, row, col, fields, bishopDirections);
}

function getPossibleKnightMoves(
    piece: Piece,
    row: number,
    col: number,
    fields: Chessfield[][],
): Move[] {
    const possibleMoves: Move[] = [];

    const knightMoves = [
        [row - 2, col - 1],
        [row - 2, col + 1],
        [row - 1, col - 2],
        [row - 1, col + 2],
        [row + 1, col - 2],
        [row + 1, col + 2],
        [row + 2, col - 1],
        [row + 2, col + 1],
    ];

    for (const [r, c] of knightMoves) {
        if (isOnBoard(r, c)) {
            const targetPiece = fields[r][c].piece;
            // Springer kann auf leeres Feld oder gegnerisches Feld
            if (!targetPiece || isEnemyPiece(piece, targetPiece)) {
                possibleMoves.push({ targetRow: r, targetCol: c });
            }
        }
    }

    return possibleMoves;
}

function getPossiblePawnMoves(
    piece: Piece,
    row: number,
    col: number,
    fields: Chessfield[][],
): Move[] {
    const possibleMoves: Move[] = [];
    const isWhite = isWhitePiece(piece);
    const direction = isWhite ? -1 : 1;
    const checkOpponent = isWhite ? isBlackPiece : isWhitePiece;
    const startingRow = isWhite ? 6 : 1;
    const singleStepRow = row + direction;

    if (isOnBoard(singleStepRow, col) && !fields[singleStepRow][col].piece) {
        possibleMoves.push({ targetRow: singleStepRow, targetCol: col });
    }

    if (row === startingRow) {
        const doubleStepRow = row + 2 * direction;
        if (
            isOnBoard(doubleStepRow, col) &&
            !fields[singleStepRow][col].piece &&
            !fields[doubleStepRow][col].piece
        ) {
            possibleMoves.push({ targetRow: doubleStepRow, targetCol: col });
        }
    }

    for (const dc of [-1, +1]) {
        const captureRow = row + direction;
        const captureCol = col + dc;
        if (isOnBoard(captureRow, captureCol)) {
            const targetPiece = fields[captureRow][captureCol].piece;
            if (targetPiece && checkOpponent(targetPiece)) {
                possibleMoves.push({
                    targetRow: captureRow,
                    targetCol: captureCol,
                });
            }
        }
    }

    return possibleMoves;
}
