import { pixelToSquare } from "./coordinates";
import { squareToAlgebraic, type Piece } from "@/lib/chess";
import type { DragState } from "./types";

export interface InteractionCallbacks {
  onMoveAttempt: (from: string, to: string) => void;
  getBoard: () => (Piece | null)[][];
  getLegalMoves: () => string[];
  setSelected: (sq: { file: number; rank: number } | null) => void;
  setDrag: (
    drag: DragState | null | ((prev: DragState | null) => DragState | null),
  ) => void;
  isMyTurn: () => boolean;
  isFlipped: () => boolean;
}

export function createInteractionHandler(
  canvas: HTMLCanvasElement,
  getCanvasSize: () => number,
  callbacks: InteractionCallbacks,
) {
  let isDragging = false;
  let dragFrom: { file: number; rank: number } | null = null;

  function getSquare(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = getCanvasSize() / rect.width;
    const scaleY = getCanvasSize() / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    return pixelToSquare(x, y, getCanvasSize(), callbacks.isFlipped());
  }

  function getCoords(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = getCanvasSize() / rect.width;
    const scaleY = getCanvasSize() / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function handleMouseDown(e: MouseEvent) {
    if (!callbacks.isMyTurn()) return;
    const sq = getSquare(e);
    if (!sq) return;

    const board = callbacks.getBoard();
    const piece = board[sq.rank]?.[sq.file];

    if (piece) {
      // Start drag
      dragFrom = sq;
      callbacks.setSelected(sq);
      isDragging = true;
      const { x, y } = getCoords(e);
      callbacks.setDrag({
        piece,
        fromFile: sq.file,
        fromRank: sq.rank,
        x,
        y,
      });
    } else {
      // Clicked empty square — deselect
      dragFrom = null;
      callbacks.setSelected(null);
      callbacks.setDrag(null);
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging) return;
    const { x, y } = getCoords(e);
    callbacks.setDrag((prev: DragState | null) =>
      prev ? { ...prev, x, y } : null,
    );
  }

  function handleMouseUp(e: MouseEvent) {
    if (!isDragging) return;
    isDragging = false;

    const sq = getSquare(e);

    if (
      sq &&
      dragFrom &&
      (sq.file !== dragFrom.file || sq.rank !== dragFrom.rank)
    ) {
      const fromSq = squareToAlgebraic(dragFrom.file, dragFrom.rank);
      const toSq = squareToAlgebraic(sq.file, sq.rank);
      const legalMoves = callbacks.getLegalMoves();
      const matchingMoves = legalMoves.filter((m) =>
        m.startsWith(fromSq + toSq),
      );
      if (matchingMoves.length > 0) {
        const move =
          matchingMoves.find((m) => m.endsWith("q")) ?? matchingMoves[0]!;
        callbacks.onMoveAttempt(fromSq, move.substring(2));
        callbacks.setSelected(null);
      }
    }

    // Dropped on same square or invalid — just deselect
    dragFrom = null;
    callbacks.setSelected(null);
    callbacks.setDrag(null);
  }

  // Click outside canvas deselects
  function handleDocumentMouseDown(e: MouseEvent) {
    if (!canvas.contains(e.target as Node)) {
      callbacks.setSelected(null);
      callbacks.setDrag(null);
    }
  }

  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("mouseleave", () => {
    if (isDragging) {
      isDragging = false;
      dragFrom = null;
      callbacks.setDrag(null);
    }
  });
  document.addEventListener("mousedown", handleDocumentMouseDown);

  return () => {
    canvas.removeEventListener("mousedown", handleMouseDown);
    canvas.removeEventListener("mousemove", handleMouseMove);
    canvas.removeEventListener("mouseup", handleMouseUp);
    document.removeEventListener("mousedown", handleDocumentMouseDown);
  };
}
