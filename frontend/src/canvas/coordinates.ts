export const BOARD_SIZE = 8;

export function squareSize(canvasSize: number): number {
  return canvasSize / BOARD_SIZE;
}

export function pixelToSquare(
  x: number,
  y: number,
  canvasSize: number,
  flipped: boolean,
): { file: number; rank: number } | null {
  const sq = squareSize(canvasSize);
  let file = Math.floor(x / sq);
  let rank = Math.floor(y / sq);

  if (flipped) {
    file = 7 - file;
    rank = 7 - rank;
  }

  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
  return { file, rank };
}

export function squareToPixel(
  file: number,
  rank: number,
  canvasSize: number,
  flipped: boolean,
): { x: number; y: number } {
  const sq = squareSize(canvasSize);
  const f = flipped ? 7 - file : file;
  const r = flipped ? 7 - rank : rank;
  return { x: f * sq, y: r * sq };
}
