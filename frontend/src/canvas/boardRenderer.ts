import type { Piece } from "@/lib/chess";
import { squareSize, squareToPixel, BOARD_SIZE } from "./coordinates";
import { DEFAULT_THEME, type BoardTheme } from "./types";
import { algebraicToSquare, squareToAlgebraic } from "@/lib/chess";

export interface RenderState {
  board: (Piece | null)[][];
  selectedSquare: { file: number; rank: number } | null;
  legalMoves: string[];
  lastMove: { from: string; to: string } | null;
  kingInCheck: { file: number; rank: number } | null;
  flipped: boolean;
}

export function drawBoard(
  ctx: CanvasRenderingContext2D,
  canvasSize: number,
  state: RenderState,
  pieceImages: Map<string, HTMLImageElement>,
  dragFrom: { file: number; rank: number } | null,
  theme: BoardTheme = DEFAULT_THEME,
) {
  const sq = squareSize(canvasSize);

  // Draw squares
  for (let rank = 0; rank < BOARD_SIZE; rank++) {
    for (let file = 0; file < BOARD_SIZE; file++) {
      const { x, y } = squareToPixel(file, rank, canvasSize, state.flipped);
      const isLight = (file + rank) % 2 === 0;
      ctx.fillStyle = isLight ? theme.lightSquare : theme.darkSquare;
      ctx.fillRect(x, y, sq, sq);
    }
  }

  // Draw last move highlight
  if (state.lastMove) {
    const from = algebraicToSquare(state.lastMove.from);
    const to = algebraicToSquare(state.lastMove.to);
    ctx.fillStyle = theme.lastMoveHighlight;
    for (const s of [from, to]) {
      const { x, y } = squareToPixel(s.file, s.rank, canvasSize, state.flipped);
      ctx.fillRect(x, y, sq, sq);
    }
  }

  // Draw selected square
  if (state.selectedSquare) {
    const { x, y } = squareToPixel(
      state.selectedSquare.file,
      state.selectedSquare.rank,
      canvasSize,
      state.flipped,
    );
    ctx.fillStyle = theme.selectedSquare;
    ctx.fillRect(x, y, sq, sq);
  }

  // Draw king in check
  if (state.kingInCheck) {
    const { x, y } = squareToPixel(
      state.kingInCheck.file,
      state.kingInCheck.rank,
      canvasSize,
      state.flipped,
    );
    ctx.fillStyle = theme.checkHighlight;
    ctx.fillRect(x, y, sq, sq);
  }

  // Draw legal move indicators
  if (state.selectedSquare) {
    const fromSq = squareToAlgebraic(
      state.selectedSquare.file,
      state.selectedSquare.rank,
    );
    for (const move of state.legalMoves) {
      if (move.startsWith(fromSq)) {
        const toSq = move.substring(2, 4);
        const target = algebraicToSquare(toSq);
        const { x, y } = squareToPixel(
          target.file,
          target.rank,
          canvasSize,
          state.flipped,
        );
        const piece = state.board[target.rank]?.[target.file];
        if (piece) {
          // Capture indicator: ring around square
          ctx.strokeStyle = theme.legalMoveIndicator;
          ctx.lineWidth = sq * 0.08;
          ctx.beginPath();
          ctx.arc(x + sq / 2, y + sq / 2, sq * 0.45, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Empty square: small dot
          ctx.fillStyle = theme.legalMoveIndicator;
          ctx.beginPath();
          ctx.arc(x + sq / 2, y + sq / 2, sq * 0.15, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // Draw pieces (skip dragged piece)
  for (let rank = 0; rank < BOARD_SIZE; rank++) {
    for (let file = 0; file < BOARD_SIZE; file++) {
      if (dragFrom && dragFrom.file === file && dragFrom.rank === rank)
        continue;
      const piece = state.board[rank]?.[file];
      if (!piece) continue;
      const key = `${piece.color}${piece.type}`;
      const img = pieceImages.get(key);
      if (img) {
        const { x, y } = squareToPixel(file, rank, canvasSize, state.flipped);
        ctx.drawImage(img, x, y, sq, sq);
      }
    }
  }

  // Draw file/rank labels
  ctx.font = `bold ${sq * 0.18}px sans-serif`;
  ctx.textBaseline = "top";
  for (let i = 0; i < 8; i++) {
    const file = state.flipped ? 7 - i : i;
    const rank = state.flipped ? 7 - i : i;
    const isLight = (i + 7) % 2 === 0;
    ctx.fillStyle = isLight ? theme.darkSquare : theme.lightSquare;
    // File labels on bottom
    ctx.textAlign = "right";
    ctx.fillText(
      String.fromCharCode(97 + file),
      (i + 1) * sq - sq * 0.05,
      7 * sq + sq * 0.8,
    );
    // Rank labels on left
    ctx.textAlign = "left";
    const rankIsLight = (0 + rank) % 2 === 0;
    ctx.fillStyle = rankIsLight ? theme.darkSquare : theme.lightSquare;
    ctx.fillText(String(8 - rank), sq * 0.05, i * sq + sq * 0.05);
  }
}

export function drawDragPiece(
  ctx: CanvasRenderingContext2D,
  canvasSize: number,
  piece: Piece,
  x: number,
  y: number,
  pieceImages: Map<string, HTMLImageElement>,
) {
  const sq = squareSize(canvasSize);
  const key = `${piece.color}${piece.type}`;
  const img = pieceImages.get(key);
  if (img) {
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    ctx.drawImage(img, x - sq / 2, y - sq / 2, sq, sq);
  }
}
