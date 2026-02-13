export type PieceColor = "w" | "b";
export type PieceType = "K" | "Q" | "R" | "B" | "N" | "P";
export type Piece = { color: PieceColor; type: PieceType };

export type Square = { file: number; rank: number };

const PIECE_CHARS: Record<string, PieceType> = {
  k: "K",
  q: "Q",
  r: "R",
  b: "B",
  n: "N",
  p: "P",
};

export function parseFen(fen: string): (Piece | null)[][] {
  const board: (Piece | null)[][] = Array.from({ length: 8 }, () =>
    Array(8).fill(null),
  );
  const [placement] = fen.split(" ");
  if (!placement) return board;
  const ranks = placement.split("/");

  for (let rankIdx = 0; rankIdx < 8; rankIdx++) {
    const rankStr = ranks[rankIdx];
    if (!rankStr) continue;
    let fileIdx = 0;
    for (const ch of rankStr) {
      if (ch >= "1" && ch <= "8") {
        fileIdx += parseInt(ch, 10);
      } else {
        const color: PieceColor = ch === ch.toUpperCase() ? "w" : "b";
        const type = PIECE_CHARS[ch.toLowerCase()];
        if (type) {
          board[rankIdx]![fileIdx] = { color, type };
        }
        fileIdx++;
      }
    }
  }

  return board;
}

export function fenTurn(fen: string): PieceColor {
  const parts = fen.split(" ");
  return parts[1] === "b" ? "b" : "w";
}

export function squareToAlgebraic(file: number, rank: number): string {
  return String.fromCharCode(97 + file) + (8 - rank);
}

export function algebraicToSquare(sq: string): Square {
  return {
    file: sq.charCodeAt(0) - 97,
    rank: 8 - parseInt(sq[1]!, 10),
  };
}

/** Apply a UCI move locally and return the new board + a rough new FEN. */
export function applyLocalMove(
  fen: string,
  uciMove: string,
): { board: (Piece | null)[][]; fen: string } {
  const board = parseFen(fen);
  const fromSq = algebraicToSquare(uciMove.substring(0, 2));
  const toSq = algebraicToSquare(uciMove.substring(2, 4));
  const promotion = uciMove.length > 4 ? uciMove[4]! : null;

  const piece = board[fromSq.rank]![fromSq.file];
  if (!piece) return { board, fen };

  // Move piece
  board[fromSq.rank]![fromSq.file] = null;

  // Handle promotion
  if (promotion) {
    const promoType = PIECE_CHARS[promotion.toLowerCase()];
    board[toSq.rank]![toSq.file] = {
      color: piece.color,
      type: promoType ?? "Q",
    };
  } else {
    board[toSq.rank]![toSq.file] = piece;
  }

  // Castling: king moves 2 files
  if (piece.type === "K" && Math.abs(toSq.file - fromSq.file) === 2) {
    if (toSq.file > fromSq.file) {
      // Kingside
      const rook = board[fromSq.rank]![7];
      board[fromSq.rank]![7] = null;
      board[fromSq.rank]![5] = rook;
    } else {
      // Queenside
      const rook = board[fromSq.rank]![0];
      board[fromSq.rank]![0] = null;
      board[fromSq.rank]![3] = rook;
    }
  }

  // En passant: pawn captures diagonally to empty square
  if (piece.type === "P" && fromSq.file !== toSq.file) {
    const capturedRank = fromSq.rank; // captured pawn is on same rank as source
    if (
      !board[toSq.rank]![toSq.file] ||
      board[toSq.rank]![toSq.file] === piece
    ) {
      // The target was empty before we placed our piece — en passant
      board[capturedRank]![toSq.file] = null;
    }
  }

  // Build rough FEN: piece placement + flipped turn
  const newTurn = piece.color === "w" ? "b" : "w";
  const placement = board
    .map((rank) => {
      let row = "";
      let empty = 0;
      for (const sq of rank) {
        if (!sq) {
          empty++;
        } else {
          if (empty > 0) {
            row += empty;
            empty = 0;
          }
          const ch = sq.color === "w" ? sq.type : sq.type.toLowerCase();
          row += ch;
        }
      }
      if (empty > 0) row += empty;
      return row;
    })
    .join("/");

  return { board, fen: `${placement} ${newTurn} - - 0 1` };
}
