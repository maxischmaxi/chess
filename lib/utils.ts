import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ActivePiece, Piece } from "./pieces";
import { Chessfield } from "./field";
import { IUseImages } from "@/components/useImages";

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

export function getActivePlayer(fen: string): "w" | "b" {
    return fen.split(" ")[1] === "w" ? "w" : "b";
}

export function createChessboard(fen: string): Chessfield[][] {
    const boardLayout = fen.split(" ")[0];
    const ranks = boardLayout.split("/");
    if (ranks.length !== 8) {
        throw new Error(
            "FEN ungültig oder unvollständig (es müssen 8 Ranks sein).",
        );
    }
    const board: Chessfield[][] = [];

    for (let row = 0; row < 8; row++) {
        const rankStr = ranks[row];
        const numberLabelForRow = (8 - row).toString();
        const rankFields: Chessfield[] = [];

        let col = 0;
        for (const ch of rankStr) {
            if (/\d/.test(ch)) {
                const emptyCount = parseInt(ch, 10);
                for (let i = 0; i < emptyCount; i++) {
                    rankFields.push(
                        createField(row, col, numberLabelForRow, undefined),
                    );
                    col++;
                }
            } else {
                const piece = parseFenChar(ch);
                rankFields.push(
                    createField(row, col, numberLabelForRow, piece),
                );
                col++;
            }

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
    const letterLabel = String.fromCharCode("a".charCodeAt(0) + col);
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

export function getPieceColor(piece: Piece): "w" | "b" {
    return isWhitePiece(piece) ? "w" : "b";
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

export function canExecuteMove(
    activePiece: ActivePiece | null,
    piece: Piece,
    activePlayer: "w" | "b",
): boolean {
    if (activePiece?.piece !== piece) {
        return false;
    }

    if (isWhitePiece(piece) && activePlayer === "w") {
        return true;
    }

    if (isBlackPiece(piece) && activePlayer === "b") {
        return true;
    }

    return false;
}

export function capturedPiece(
    prevFields: Chessfield[][],
    nextFields: Chessfield[][],
): Piece | null {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const prevPiece = prevFields[row][col].piece;
            const nextPiece = nextFields[row][col].piece;

            if (prevPiece && !nextPiece) {
                return prevPiece;
            }
        }
    }

    return null;
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

export function generateCastleFen(
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
    fens: string[],
    fenIndex: number,
): string {
    // 1. Altes FEN aus dem Array holen
    const currentFen = fens[fenIndex];
    const activePlayer = getActivePlayer(currentFen);

    // Ein FEN besteht normalerweise aus 6 Teilen:
    // [0]: Stellung der Figuren (8 Reihen, durch '/' getrennt)
    // [1]: Seite am Zug ("w" oder "b")
    // [2]: Rochaderechte (z.B. "KQkq" oder "-")
    // [3]: En-passant-Feld (z.B. "e3" oder "-")
    // [4]: Halbzüge seit letztem Bauernzug/Schlag (Number)
    // [5]: Vollzugzähler (Number)
    const fenParts = currentFen.split(" ");
    if (fenParts.length !== 6) {
        throw new Error("Ungültiges FEN-Format");
    }

    const [
        piecePlacement,
        activeColor,
        castling,
        enPassant,
        halfmoveClock,
        fullmoveNumber,
    ] = fenParts;

    // 2. Board aus dem 'piecePlacement' in ein 2D-Array (8x8) umwandeln
    //    Reihenfolge in FEN: Reihe 8 (oben) bis Reihe 1 (unten)
    //    -> piecePlacement.split('/')[0] = oberste Reihe
    const rows = piecePlacement.split("/");
    if (rows.length !== 8) {
        throw new Error("Ungültige Anzahl von Reihen im FEN");
    }

    // Parsing jeder FEN-Reihe: Ziffern stehen für Anzahl leerer Felder, Buchstaben für Figuren
    const board = rows.map((row) => {
        const expandedRow: string[] = [];
        for (const char of row) {
            if (/\d/.test(char)) {
                const emptyCount = parseInt(char, 10);
                for (let i = 0; i < emptyCount; i++) {
                    expandedRow.push(""); // leeres Feld
                }
            } else {
                expandedRow.push(char); // Figur-Symbol (z.B. 'p', 'P', 'r', etc.)
            }
        }
        if (expandedRow.length !== 8) {
            throw new Error("Ungültige Reihenlänge nach Parsing");
        }
        return expandedRow;
    });

    if (fromRow === 0 && fromCol === 4 && toRow === 0 && toCol === 6) {
        board[0][7] = "";
        board[0][5] = activePlayer === "w" ? "R" : "r";
    } else if (fromRow === 0 && fromCol === 4 && toRow === 0 && toCol === 2) {
        board[0][0] = "";
        board[0][3] = activePlayer === "w" ? "R" : "r";
    } else if (fromRow === 7 && fromCol === 4 && toRow === 7 && toCol === 7) {
        board[7][7] = "";
        board[7][4] = "";
        board[7][5] = activePlayer === "w" ? "R" : "r";
        board[7][6] = activePlayer === "w" ? "K" : "k";
    } else if (fromRow === 7 && fromCol === 4 && toRow === 7 && toCol === 0) {
        board[7][0] = "";
        board[7][1] = "";
        board[7][2] = activePlayer === "w" ? "K" : "k";
        board[7][3] = activePlayer === "w" ? "R" : "r";
        board[7][4] = "";
    } else {
        throw new Error("Ungültiger Rochade-Zug");
    }

    // 4. Aktualisierung der Rochaderechte
    let newCastling = castling;
    if (activeColor === "w") {
        newCastling = newCastling.replace("K", "");
        newCastling = newCastling.replace("Q", "");
    } else {
        newCastling = newCastling.replace("k", "");
        newCastling = newCastling.replace("q", "");
    }

    // 5. Neues Piece-Placement als FEN-Teil generieren
    const newPiecePlacement = board
        .map((row) => {
            let fenRow = "";
            let emptyCount = 0;
            for (let col = 0; col < 8; col++) {
                const cell = row[col];
                if (cell === "") {
                    emptyCount++;
                } else {
                    if (emptyCount > 0) {
                        fenRow += emptyCount;
                        emptyCount = 0;
                    }
                    fenRow += cell;
                }
            }
            // Falls am Ende der Reihe noch Leerfelder offen sind, anhängen
            if (emptyCount > 0) {
                fenRow += emptyCount;
            }
            return fenRow;
        })
        .join("/");

    // 6. Kompletter FEN-String zusammenbauen
    const newFen = [
        newPiecePlacement,
        activeColor,
        newCastling,
        enPassant,
        halfmoveClock,
        fullmoveNumber,
    ].join(" ");

    return newFen;
}

export function generateFen(
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
    fens: string[],
    fenIndex: number,
): string {
    // 1. Altes FEN aus dem Array holen
    const currentFen = fens[fenIndex];

    // Ein FEN besteht normalerweise aus 6 Teilen:
    // [0]: Stellung der Figuren (8 Reihen, durch '/' getrennt)
    // [1]: Seite am Zug ("w" oder "b")
    // [2]: Rochaderechte (z.B. "KQkq" oder "-")
    // [3]: En-passant-Feld (z.B. "e3" oder "-")
    // [4]: Halbzüge seit letztem Bauernzug/Schlag (Number)
    // [5]: Vollzugzähler (Number)
    const fenParts = currentFen.split(" ");
    if (fenParts.length !== 6) {
        throw new Error("Ungültiges FEN-Format");
    }

    const [
        piecePlacement,
        activeColor,
        castling,
        enPassant,
        halfmoveClock,
        fullmoveNumber,
    ] = fenParts;

    // 2. Board aus dem 'piecePlacement' in ein 2D-Array (8x8) umwandeln
    //    Reihenfolge in FEN: Reihe 8 (oben) bis Reihe 1 (unten)
    //    -> piecePlacement.split('/')[0] = oberste Reihe
    const rows = piecePlacement.split("/");
    if (rows.length !== 8) {
        throw new Error("Ungültige Anzahl von Reihen im FEN");
    }

    // Parsing jeder FEN-Reihe: Ziffern stehen für Anzahl leerer Felder, Buchstaben für Figuren
    const board = rows.map((row) => {
        const expandedRow: string[] = [];
        for (const char of row) {
            if (/\d/.test(char)) {
                const emptyCount = parseInt(char, 10);
                for (let i = 0; i < emptyCount; i++) {
                    expandedRow.push(""); // leeres Feld
                }
            } else {
                expandedRow.push(char); // Figur-Symbol (z.B. 'p', 'P', 'r', etc.)
            }
        }
        if (expandedRow.length !== 8) {
            throw new Error("Ungültige Reihenlänge nach Parsing");
        }
        return expandedRow;
    });

    // 3. Zug ausführen: Figur von (fromRow, fromCol) nach (toRow, toCol) verschieben
    //    Beachte, dass fromRow=0 die oberste Reihe (board[0]) ist und fromCol=0 die linke Spalte.
    const piece = board[fromRow][fromCol];
    if (!piece) {
        throw new Error("Keine Figur auf dem angegebenen Startfeld vorhanden");
    }

    // Um festzustellen, ob ein Schlag oder Bauer-Zug stattfindet, merken wir uns vorher den Inhalt des Zielfeldes:
    const targetSquareBeforeMove = board[toRow][toCol];

    // Figur verschieben
    board[fromRow][fromCol] = "";
    board[toRow][toCol] = piece;

    // 4. Aktualisierung der Schach-Uhr-Felder
    //    a) Halbzugzähler (halfmoveClock):
    //       - reset auf 0, wenn ein Bauer zieht oder eine Figur geschlagen wird
    //       - sonst +1
    let newHalfmoveClock = parseInt(halfmoveClock, 10);
    const isPawnMove = piece.toLowerCase() === "p";
    const isCapture = targetSquareBeforeMove !== "";
    if (isPawnMove || isCapture) {
        newHalfmoveClock = 0;
    } else {
        newHalfmoveClock++;
    }

    //    b) Vollzugzähler (fullmoveNumber) wird inkrementiert, sobald Schwarz gezogen hat
    let newFullmoveNumber = parseInt(fullmoveNumber, 10);
    // Wenn gerade "w" am Zug war und jetzt "b" wird, wird der Vollzugzähler NICHT inkrementiert
    // Wenn gerade "b" am Zug war und es wird wieder "w", dann +1
    if (activeColor === "b") {
        newFullmoveNumber++;
    }

    // 5. Seite am Zug wechseln
    const newActiveColor = activeColor === "w" ? "b" : "w";

    // 6. Neues Piece-Placement als FEN-Teil generieren
    const newPiecePlacement = board
        .map((row) => {
            let fenRow = "";
            let emptyCount = 0;
            for (let col = 0; col < 8; col++) {
                const cell = row[col];
                if (cell === "") {
                    emptyCount++;
                } else {
                    if (emptyCount > 0) {
                        fenRow += emptyCount;
                        emptyCount = 0;
                    }
                    fenRow += cell;
                }
            }
            // Falls am Ende der Reihe noch Leerfelder offen sind, anhängen
            if (emptyCount > 0) {
                fenRow += emptyCount;
            }
            return fenRow;
        })
        .join("/");

    // 7. Kompletter FEN-String zusammenbauen
    const newFen = [
        newPiecePlacement,
        newActiveColor,
        castling,
        enPassant,
        newHalfmoveClock,
        newFullmoveNumber,
    ].join(" ");

    return newFen;
}

export function getImageByPiece(piece: Piece, images: IUseImages) {
    switch (piece) {
        case Piece.BlackBishop:
            return images.bishopB.image;
        case Piece.WhiteBishop:
            return images.bishopW.image;
        case Piece.BlackKing:
            return images.kingB.image;
        case Piece.WhiteKing:
            return images.kingW.image;
        case Piece.BlackKnight:
            return images.knightB.image;
        case Piece.WhiteKnight:
            return images.knightW.image;
        case Piece.BlackPawn:
            return images.pawnB.image;
        case Piece.WhitePawn:
            return images.pawnW.image;
        case Piece.BlackQueen:
            return images.queenB.image;
        case Piece.WhiteQueen:
            return images.queenW.image;
        case Piece.BlackRook:
            return images.rookB.image;
        case Piece.WhiteRook:
            return images.rookW.image;
        default:
            return null;
    }
}

export function isCastleMove(
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
): boolean {
    return (
        (fromRow === 0 && fromCol === 4 && toRow === 0 && toCol === 6) ||
        (fromRow === 0 && fromCol === 4 && toRow === 0 && toCol === 2) ||
        (fromRow === 7 && fromCol === 4 && toRow === 7 && toCol === 7) ||
        (fromRow === 7 && fromCol === 4 && toRow === 7 && toCol === 0)
    );
}
