import { useRef, useEffect, useState } from "react";
import { parseFen, fenTurn, type Piece } from "@/lib/chess";
import { usePieceImages } from "@/hooks/usePieceImages";
import { drawBoard, drawDragPiece, type RenderState } from "@/canvas/boardRenderer";
import { createInteractionHandler } from "@/canvas/interactionHandler";
import type { DragState } from "@/canvas/types";

const BOARD_CSS_SIZE = 640;

function getCanvasSize() {
  return BOARD_CSS_SIZE * (window.devicePixelRatio || 1);
}

function setupHiDpiCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
) {
  const dpr = window.devicePixelRatio || 1;
  const size = BOARD_CSS_SIZE * dpr;
  canvas.width = size;
  canvas.height = size;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

interface ChessBoardProps {
  fen: string;
  legalMoves: string[];
  lastMove: { from: string; to: string } | null;
  flipped: boolean;
  isMyTurn: boolean;
  onMove: (from: string, to: string) => void;
}

export function ChessBoard({
  fen,
  legalMoves,
  lastMove,
  flipped,
  isMyTurn,
  onMove,
}: ChessBoardProps) {
  const boardCanvasRef = useRef<HTMLCanvasElement>(null);
  const dragCanvasRef = useRef<HTMLCanvasElement>(null);
  const pieceImages = usePieceImages();

  const [selectedSquare, setSelectedSquare] = useState<{
    file: number;
    rank: number;
  } | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const boardRef = useRef<(Piece | null)[][]>([]);
  const legalMovesRef = useRef<string[]>([]);
  const selectedRef = useRef(selectedSquare);
  const isMyTurnRef = useRef(isMyTurn);
  const flippedRef = useRef(flipped);

  boardRef.current = parseFen(fen);
  legalMovesRef.current = legalMoves;
  selectedRef.current = selectedSquare;
  isMyTurnRef.current = isMyTurn;
  flippedRef.current = flipped;

  // Find king in check
  const kingInCheck = (() => {
    const turn = fenTurn(fen);
    const board = boardRef.current;
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank]?.[file];
        if (piece && piece.type === "K" && piece.color === turn) {
          return null;
        }
      }
    }
    return null;
  })();

  // Draw board canvas
  useEffect(() => {
    if (!pieceImages) return;
    const canvas = boardCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setupHiDpiCanvas(canvas, ctx);

    const state: RenderState = {
      board: boardRef.current,
      selectedSquare,
      legalMoves,
      lastMove,
      kingInCheck,
      flipped,
    };

    drawBoard(
      ctx,
      BOARD_CSS_SIZE,
      state,
      pieceImages,
      dragState ? { file: dragState.fromFile, rank: dragState.fromRank } : null,
    );
  }, [fen, selectedSquare, legalMoves, lastMove, flipped, pieceImages, dragState, kingInCheck]);

  // Draw drag canvas
  useEffect(() => {
    const canvas = dragCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setupHiDpiCanvas(canvas, ctx);

    if (dragState && pieceImages) {
      drawDragPiece(
        ctx,
        BOARD_CSS_SIZE,
        dragState.piece,
        dragState.x,
        dragState.y,
        pieceImages,
      );
    }
  }, [dragState, pieceImages]);

  // Set up interaction handler — uses CSS-space coordinates
  useEffect(() => {
    const canvas = dragCanvasRef.current;
    if (!canvas) return;

    const cleanup = createInteractionHandler(
      canvas,
      () => BOARD_CSS_SIZE,
      {
        onMoveAttempt: (from, to) => onMove(from, to),
        getBoard: () => boardRef.current,
        getLegalMoves: () => legalMovesRef.current,
        setSelected: setSelectedSquare,
        setDrag: setDragState,
        isMyTurn: () => isMyTurnRef.current,
        isFlipped: () => flippedRef.current,
      },
    );

    return cleanup;
  }, [onMove]);

  // Reset selection when it's no longer our turn
  useEffect(() => {
    if (!isMyTurn) {
      setSelectedSquare(null);
      setDragState(null);
    }
  }, [isMyTurn]);

  if (!pieceImages) {
    return <div style={{ width: BOARD_CSS_SIZE, height: BOARD_CSS_SIZE, background: "#b58863", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>Loading pieces...</div>;
  }

  return (
    <div style={{ position: "relative", width: BOARD_CSS_SIZE, height: BOARD_CSS_SIZE, maxWidth: "100%" }}>
      <canvas
        ref={boardCanvasRef}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
      />
      <canvas
        ref={dragCanvasRef}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", cursor: isMyTurn ? "pointer" : "default" }}
      />
    </div>
  );
}
