import { Chessfield } from "./field";
import { Piece } from "./pieces";
import {
    canCastleByBoard,
    getPieceColor,
    isEnemyPiece,
    isOnBoard,
    isWhitePiece,
} from "./utils";

export function getPossibleMoves(
    piece: Piece,
    row: number,
    col: number,
    board: Chessfield[][],
): number[][] {
    switch (piece) {
        case Piece.WhitePawn:
        case Piece.BlackPawn:
            return getPossiblePawnMoves(piece, row, col, board);

        case Piece.WhiteKnight:
        case Piece.BlackKnight:
            return getPossibleKnightMoves(piece, row, col, board);

        case Piece.WhiteBishop:
        case Piece.BlackBishop:
            return getPossibleBishopMoves(piece, row, col, board);

        case Piece.WhiteRook:
        case Piece.BlackRook:
            return getPossibleRookMoves(piece, row, col, board);

        case Piece.WhiteQueen:
        case Piece.BlackQueen:
            return getPossibleQueenMoves(piece, row, col, board);

        case Piece.WhiteKing:
        case Piece.BlackKing:
            return getPossibleKingMoves(piece, row, col, board);

        default:
            return [];
    }
}

function getRayMoves(
    piece: Piece,
    row: number,
    col: number,
    board: Chessfield[][],
    directions: [number, number][], // z.B. für Läufer: [(-1,-1), (-1,1), (1,-1), (1,1)]
): number[][] {
    const possibleMoves: number[][] = [];

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
            const targetPiece = board[r][c].piece;
            if (!targetPiece) {
                // Leer -> wir können hinziehen und weiter "strahlen"
                possibleMoves.push([r, c]);
            } else {
                // Da steht ein Stück - entweder gegnerisch (dann capture möglich) oder eigenes
                if (isEnemyPiece(piece, targetPiece)) {
                    possibleMoves.push([r, c]);
                }
                // In beiden Fällen: Wir können nicht weiter, Richtung blockiert
                break;
            }
        }
    }

    return possibleMoves;
}

function getPossibleKingMoves(
    piece: Piece,
    row: number,
    col: number,
    board: Chessfield[][],
): number[][] {
    const possibleMoves: number[][] = [];

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
            const targetPiece = board[r][c].piece;
            // König darf auf ein leeres Feld oder ein gegnerisches Feld ziehen
            if (!targetPiece || isEnemyPiece(piece, targetPiece)) {
                possibleMoves.push([r, c]);
            }
        }
    }

    const color = getPieceColor(piece);

    console.log(
        canCastleByBoard(board, color, "k"),
        canCastleByBoard(board, color, "q"),
    );

    if (canCastleByBoard(board, color, "k")) {
        possibleMoves.push([row, col + 3]);
    }

    if (canCastleByBoard(board, color, "q")) {
        possibleMoves.push([row, col - 4]);
    }

    return possibleMoves;
}

function getPossibleQueenMoves(
    piece: Piece,
    row: number,
    col: number,
    board: Chessfield[][],
): number[][] {
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
    return getRayMoves(piece, row, col, board, queenDirections);
}

function getPossibleRookMoves(
    piece: Piece,
    row: number,
    col: number,
    board: Chessfield[][],
): number[][] {
    const rookDirections: [number, number][] = [
        [0, +1],
        [0, -1],
        [+1, 0],
        [-1, 0],
    ];
    return getRayMoves(piece, row, col, board, rookDirections);
}

function getPossibleBishopMoves(
    piece: Piece,
    row: number,
    col: number,
    board: Chessfield[][],
): number[][] {
    const bishopDirections: [number, number][] = [
        [-1, -1],
        [-1, +1],
        [+1, -1],
        [+1, +1],
    ];
    return getRayMoves(piece, row, col, board, bishopDirections);
}

function getPossibleKnightMoves(
    piece: Piece,
    row: number,
    col: number,
    board: Chessfield[][],
): number[][] {
    const possibleMoves: number[][] = [];

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
            const targetPiece = board[r][c].piece;
            // Springer kann auf leeres Feld oder gegnerisches Feld
            if (!targetPiece || isEnemyPiece(piece, targetPiece)) {
                possibleMoves.push([r, c]);
            }
        }
    }

    return possibleMoves;
}

function getPossiblePawnMoves(
    piece: Piece,
    row: number,
    col: number,
    board: Chessfield[][],
): number[][] {
    const possibleMoves: number[][] = [];
    const isWhite = isWhitePiece(piece);

    const direction = isWhite ? -1 : 1;

    const startingRow = isWhite ? 6 : 1;

    const stepRow = row + direction;
    if (isOnBoard(stepRow, col) && board[stepRow][col].piece === undefined) {
        possibleMoves.push([stepRow, col]);
    }

    if (row === startingRow) {
        const doubleStepRow = row + 2 * direction;
        if (
            isOnBoard(doubleStepRow, col) &&
            board[stepRow][col].piece === undefined &&
            board[doubleStepRow][col].piece === undefined
        ) {
            possibleMoves.push([doubleStepRow, col]);
        }
    }

    for (const dc of [-1, +1]) {
        const captureRow = row + direction;
        const captureCol = col + dc;
        if (isOnBoard(captureRow, captureCol)) {
            const targetPiece = board[captureRow][captureCol].piece;
            if (targetPiece !== undefined && isEnemyPiece(piece, targetPiece)) {
                possibleMoves.push([captureRow, captureCol]);
            }
        }
    }
    return possibleMoves;
}
