import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Piece, PieceSymbol } from "chess.js";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getPieceImage(piece: Piece): string {
    switch (piece.type) {
        case "p":
            return `/pawn-${piece.color}.svg`;
        case "n":
            return `/knight-${piece.color}.svg`;
        case "k":
            return `/king-${piece.color}.svg`;
        case "r":
            return `/rook-${piece.color}.svg`;
        case "b":
            return `/bishop-${piece.color}.svg`;
        case "q":
            return `/queen-${piece.color}.svg`;
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

export async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getFullPieceName(
    symbol: PieceSymbol,
): "bishop" | "king" | "knight" | "pawn" | "queen" | "rook" {
    switch (symbol) {
        case "b":
            return "bishop";
        case "k":
            return "king";
        case "n":
            return "knight";
        case "p":
            return "pawn";
        case "q":
            return "queen";
        case "r":
            return "rook";
    }
}
