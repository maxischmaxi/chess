"use client";

import { useAudio } from "@/hooks/useAudio";
import { StockfishContext } from "@/components/stockfish-provider";
import { Board } from "@/lib/field";
import {
    boardToFen,
    createChessboard,
    getActivePlayer,
    getPieceColor,
    isMouseOverCell,
} from "@/lib/utils";
import { drawCell, drawImage, drawCastleCell, drawCircle } from "@/lib/drawing";
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
        "https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-self.mp3",
    );
    const notify = useAudio(
        "https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/notify.mp3",
    );
    const capture = useAudio(
        "https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/capture.mp3",
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

    function renderCell(
        baseContext: CanvasRenderingContext2D,
        eventContext: CanvasRenderingContext2D,
        row: number,
        col: number,
        cellSize: number,
        mouseX: number,
        mouseY: number,
    ): void {
        const piece = board.fields[row][col].piece;

        drawCell(
            baseContext,
            row,
            col,
            cellSize,
            board.fields[row][col],
            activePiece,
            true,
        );

        if (!piece) return;

        const isActivePiece =
            activePiece?.row === row && activePiece?.col === col;

        if (isActivePiece) {
            renderActivePiece(
                baseContext,
                eventContext,
                piece,
                row,
                col,
                cellSize,
                mouseX,
                mouseY,
            );
        } else {
            renderStaticPiece(baseContext, piece, row, col, cellSize);
        }
    }

    function renderStaticPiece(
        context: CanvasRenderingContext2D,
        piece: Piece,
        row: number,
        col: number,
        cellSize: number,
    ) {
        const image = getImageByPiece(piece);
        drawImage(context, image!, col * cellSize, row * cellSize, cellSize);
    }

    function renderBoard(
        baseContext: CanvasRenderingContext2D,
        eventContext: CanvasRenderingContext2D,
        cellSize: number,
        mouseX: number,
        mouseY: number,
    ) {
        for (let row = 0; row < CHESSBOARD_SIZE; row++) {
            for (let col = 0; col < CHESSBOARD_SIZE; col++) {
                renderCell(
                    baseContext,
                    eventContext,
                    row,
                    col,
                    cellSize,
                    mouseX,
                    mouseY,
                );
            }
        }
    }

    function renderMoveCell(
        baseContext: CanvasRenderingContext2D,
        eventContext: CanvasRenderingContext2D,
        row: number,
        col: number,
        cellSize: number,
    ) {
        const targetPiece = board.fields[row][col].piece;

        if (!targetPiece) {
            drawCircle(
                baseContext,
                col * cellSize,
                row * cellSize,
                cellSize,
                3,
            );
            return;
        }

        if (board.activePlayer === getPieceColor(targetPiece)) {
            drawCastleCell(eventContext, row, col, cellSize);
        } else {
            drawCircle(
                baseContext,
                col * cellSize,
                row * cellSize,
                cellSize,
                5,
                "rgba(255,0,0,0.5)",
            );
        }
    }

    function clearCanvases(
        baseContext: CanvasRenderingContext2D,
        eventContext: CanvasRenderingContext2D,
    ) {
        baseContext.clearRect(
            0,
            0,
            baseContext.canvas.width,
            baseContext.canvas.height,
        );
        eventContext.clearRect(
            0,
            0,
            eventContext.canvas.width,
            eventContext.canvas.height,
        );
    }

    function renderPossibleMoves(
        baseContext: CanvasRenderingContext2D,
        eventContext: CanvasRenderingContext2D,
        piece: Piece,
        row: number,
        col: number,
        cellSize: number,
        mouseX: number,
        mouseY: number,
    ) {
        const possibleMoves = getPossibleMoves(piece, row, col, board.fields);
        let nearest: number[] = [];

        for (const [moveRow, moveCol] of possibleMoves) {
            renderMoveCell(
                baseContext,
                eventContext,
                moveRow,
                moveCol,
                cellSize,
            );

            if (isMouseOverCell(moveRow, moveCol, cellSize, mouseX, mouseY)) {
                nearest = [moveRow, moveCol];
            }
        }

        return nearest;
    }

    function renderActivePiece(
        baseContext: CanvasRenderingContext2D,
        eventContext: CanvasRenderingContext2D,
        piece: Piece,
        row: number,
        col: number,
        cellSize: number,
        mouseX: number,
        mouseY: number,
    ) {
        const nearest = renderPossibleMoves(
            baseContext,
            eventContext,
            piece,
            row,
            col,
            cellSize,
            mouseX,
            mouseY,
        );

        if (nearest.length) {
            const [nearsetRow, nearestCol] = nearest;
            drawCircle(
                baseContext,
                nearestCol * cellSize,
                nearsetRow * cellSize,
                cellSize,
                4,
            );
        }

        const image = getImageByPiece(piece);
        drawImage(eventContext, image!, mouseX, mouseY, cellSize, activePiece);
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

        const cellSize = boardSize / CHESSBOARD_SIZE;

        clearCanvases(baseContext, eventContext);
        renderBoard(
            baseContext,
            eventContext,
            cellSize,
            mousePosition.x,
            mousePosition.y,
        );
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
