import type { Piece } from "@/lib/chess";

export interface BoardTheme {
  lightSquare: string;
  darkSquare: string;
  selectedSquare: string;
  legalMoveIndicator: string;
  lastMoveHighlight: string;
  checkHighlight: string;
}

export const DEFAULT_THEME: BoardTheme = {
  lightSquare: "#f0d9b5",
  darkSquare: "#b58863",
  selectedSquare: "rgba(20, 85, 30, 0.5)",
  legalMoveIndicator: "rgba(20, 85, 30, 0.4)",
  lastMoveHighlight: "rgba(155, 199, 0, 0.41)",
  checkHighlight: "rgba(255, 0, 0, 0.5)",
};

export interface DragState {
  piece: Piece;
  fromFile: number;
  fromRank: number;
  x: number;
  y: number;
}
