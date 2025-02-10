"use client";

import { useAudio } from "@/hooks/useAudio";
import { StockfishContext } from "@/components/stockfish-provider";
import { Board } from "@/lib/field";
import {
    boardToFen,
    createChessboard,
    drawCell,
    drawCircle,
    drawDebugInfos,
    drawImage,
    drawStartCell,
    drawThrow,
    getActivePlayer,
    isBlackPiece,
    isWhitePiece,
} from "@/lib/utils";
import {
    createContext,
    Dispatch,
    RefObject,
    SetStateAction,
    use,
    useCallback,
    useEffect,
    useState,
} from "react";
import { ImagesContext } from "@/components/images-provider";
import { CHESSBOARD_SIZE } from "@/lib/definitions";
import { ActivePiece, Piece } from "@/lib/pieces";
import { getPossibleMoves } from "@/lib/moves";

type IUseChess = {
    board: Board;
    move: (from: string, to: string) => void;
    jumpForward: () => void;
    jumpBackward: () => void;
    importFen: (fen: string) => void;
    iAm: "w" | "b";
    moveByIndex: (
        fromRow: number,
        fromCol: number,
        toRow: number,
        toCol: number,
    ) => void;
    render: (
        baseCanvas: RefObject<HTMLCanvasElement | null>,
        eventCanvas: RefObject<HTMLCanvasElement | null>,
        boardSize: number,
        mousePosition: { x: number; y: number },
    ) => void;
    activePiece: ActivePiece | null;
    setActivePiece: Dispatch<SetStateAction<ActivePiece | null>>;
};

export const ChessContext = createContext<IUseChess>({
    activePiece: null,
    setActivePiece: () => {},
    render: () => {},
    board: {
        fields: [],
        fens: [],
        activePlayer: "w",
        fenIndex: 0,
    },
    importFen: () => {},
    move: () => {},
    jumpBackward: () => {},
    jumpForward: () => {},
    iAm: "w",
    moveByIndex: () => {},
});

const iAm = "w";

export function ChessProvider({ children }: { children: React.ReactNode }) {
    const stockfish = use(StockfishContext);
    const images = use(ImagesContext);
    const [board, setBoard] = useState<Board>({
        fields: createChessboard(
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        ),
        fens: ["rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"],
        activePlayer: "w",
        fenIndex: 0,
    });
    const moveSelf = useAudio(
        "http://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-self.mp3",
    );
    const notify = useAudio(
        "http://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/notify.mp3",
    );
    const capture = useAudio(
        "http://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/capture.mp3",
    );
    const [activePiece, setActivePiece] = useState<ActivePiece | null>(null);

    const move = useCallback(
        (from: string, to: string) => {
            const fromRow = 8 - parseInt(from[1]);
            const fromCol = from.charCodeAt(0) - 97;
            const toRow = 8 - parseInt(to[1]);
            const toCol = to.charCodeAt(0) - 97;

            const fields = structuredClone(board.fields);
            fields[toRow][toCol].piece = fields[fromRow][fromCol].piece;
            fields[fromRow][fromCol].piece = undefined;

            const activePlayer = board.activePlayer === "w" ? "b" : "w";

            const fens = structuredClone(board.fens);
            fens.push(boardToFen(fields, activePlayer));

            moveSelf.audio?.play();
            setBoard({
                fields,
                activePlayer,
                fens,
                fenIndex: fens.length - 1,
            });
        },
        [board, moveSelf],
    );

    useEffect(() => {
        function onBestMove(event: CustomEvent) {
            const { from, to } = event.detail;
            move(from, to);
        }

        stockfish.addEventListener("bestMove", onBestMove);

        return () => {
            stockfish.removeEventListener("bestMove", onBestMove);
        };
    }, [move, stockfish]);

    function moveByIndex(
        fromRow: number,
        fromCol: number,
        toRow: number,
        toCol: number,
    ) {
        const fields = structuredClone(board.fields);
        fields[toRow][toCol].piece = fields[fromRow][fromCol].piece;
        fields[fromRow][fromCol].piece = undefined;

        const activePlayer = board.activePlayer === "w" ? "b" : "w";

        const fens = structuredClone(board.fens);
        fens.push(boardToFen(fields, activePlayer));

        moveSelf.audio?.play();

        setBoard({
            fields,
            activePlayer,
            fens,
            fenIndex: fens.length - 1,
        });

        stockfish.calcBestMove(boardToFen(fields, activePlayer));
    }

    function jumpForward() {
        const fenIndex = Math.min(board.fenIndex + 1, board.fens.length - 1);
        const newBoard = structuredClone(board);
        newBoard.fenIndex = fenIndex;
        newBoard.fields = createChessboard(newBoard.fens[fenIndex]);
        newBoard.activePlayer = getActivePlayer(newBoard.fens[fenIndex]);
        setBoard(newBoard);

        if (iAm !== newBoard.activePlayer) {
            stockfish.calcBestMove(newBoard.fens[fenIndex]);
        }
    }

    function jumpBackward() {
        const fenIndex = board.fenIndex - 1;
        if (fenIndex < 0) return;

        const newBoard = structuredClone(board);
        newBoard.fenIndex = fenIndex;
        newBoard.fields = createChessboard(newBoard.fens[fenIndex]);
        newBoard.activePlayer = getActivePlayer(newBoard.fens[fenIndex]);
        setBoard(newBoard);

        if (iAm !== newBoard.activePlayer) {
            stockfish.calcBestMove(newBoard.fens[fenIndex]);
        }
    }

    function importFen(fen: string) {
        setBoard({
            fields: createChessboard(fen),
            activePlayer: getActivePlayer(fen),
            fens: [fen],
            fenIndex: 0,
        });
    }

    function getImageByPiece(piece: Piece) {
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

    function render(
        baseCanvas: RefObject<HTMLCanvasElement | null>,
        eventCanvas: RefObject<HTMLCanvasElement | null>,
        boardSize: number,
        mousePosition: { x: number; y: number },
    ) {
        if (!images.ready) return;
        if (!moveSelf.ready) return;
        if (!capture.ready) return;
        if (!notify.ready) return;

        if (!baseCanvas.current) return;
        if (!eventCanvas.current) return;

        const baseContext = baseCanvas.current.getContext("2d");
        const eventContext = eventCanvas.current.getContext("2d");

        if (!baseContext) return;
        if (!eventContext) return;

        eventContext.clearRect(
            0,
            0,
            eventCanvas.current.width,
            eventCanvas.current.height,
        );

        baseContext.clearRect(
            0,
            0,
            baseCanvas.current.width,
            baseCanvas.current.height,
        );

        const cellSize = boardSize / CHESSBOARD_SIZE;

        for (let r = 0; r < CHESSBOARD_SIZE; r++) {
            for (let c = 0; c < CHESSBOARD_SIZE; c++) {
                drawCell(baseContext, r, c, cellSize);
                drawDebugInfos(baseContext, r, c, cellSize, board.fields[r][c]);

                const piece = board.fields[r][c].piece;

                if (!piece) {
                    continue;
                }

                if (
                    activePiece?.piece === piece &&
                    activePiece?.row === r &&
                    activePiece?.col === c &&
                    mousePosition.x !== undefined &&
                    mousePosition.y !== undefined &&
                    ((isWhitePiece(piece) && board.activePlayer === "w") ||
                        (isBlackPiece(piece) && board.activePlayer === "b"))
                ) {
                    console.log(
                        "DRAGMOVE PIECE",
                        piece,
                        r,
                        c,
                        mousePosition.x,
                        mousePosition.y,
                    );
                    drawStartCell(eventContext, r, c, cellSize);

                    const possibleMoves = getPossibleMoves(
                        piece,
                        r,
                        c,
                        board.fields,
                    );

                    let nearest: number[] = [];

                    for (const [row, col] of possibleMoves) {
                        const x = col * cellSize;
                        const y = row * cellSize;
                        drawCircle(eventContext, x, y, cellSize, 2);

                        if (board.fields[row][col].piece) {
                            drawThrow(eventContext, x, y, cellSize);
                        }

                        if (
                            mousePosition.x >= x &&
                            mousePosition.x <= x + cellSize &&
                            mousePosition.y >= y &&
                            mousePosition.y <= y + cellSize
                        ) {
                            nearest = [row, col];
                        }
                    }

                    if (nearest.length) {
                        const x = nearest[1] * cellSize;
                        const y = nearest[0] * cellSize;
                        drawCircle(eventContext, x, y, cellSize, 4);
                        drawThrow(eventContext, x, y, cellSize, 4);
                    }

                    const image = getImageByPiece(piece);
                    drawImage(
                        eventContext,
                        image!,
                        mousePosition.x,
                        mousePosition.y,
                        cellSize,
                        activePiece,
                    );
                } else {
                    const image = getImageByPiece(piece);
                    drawImage(
                        baseContext,
                        image!,
                        c * cellSize,
                        r * cellSize,
                        cellSize,
                    );
                }
            }
        }
    }

    return (
        <ChessContext.Provider
            value={{
                importFen,
                board,
                moveByIndex,
                move,
                iAm,
                jumpBackward,
                render,
                jumpForward,
                activePiece,
                setActivePiece,
            }}
        >
            {children}
        </ChessContext.Provider>
    );
}
