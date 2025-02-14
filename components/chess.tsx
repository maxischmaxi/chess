"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CHESSBOARD_SIZE } from "@/lib/definitions";
import { getPossibleMoves } from "@/lib/moves";
import { render as canvasRender } from "@/lib/render";
import {
    createChessboard,
    evaluationToWinProbability,
    generateCastleFen,
    generateFen,
    getActivePlayer,
    isBlackPiece,
    isCastleMove,
    isWhitePiece,
} from "@/lib/utils";
import {
    MouseEvent as ReactMouseEvent,
    use,
    useEffect,
    useRef,
    useState,
} from "react";
import { StockfishContext } from "@/components/stockfish-provider";
import { WinProbability } from "./winprobabilty";
import { ActivePiece, Piece } from "@/lib/pieces";
import { ChessAudioConext } from "./audio-provider";
import { ImagesContext } from "./images-provider";

const iAm: "w" | "b" = "w";

export function Chess() {
    const stockfish = use(StockfishContext);
    const images = use(ImagesContext);
    const fens = useRef<string[]>([
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    ]);
    const baseCanvas = useRef<HTMLCanvasElement>(null);
    const eventCanvas = useRef<HTMLCanvasElement>(null);
    const moveCanvas = useRef<HTMLCanvasElement>(null);
    const fenIndex = useRef<number>(0);
    const audio = use(ChessAudioConext);
    const [activePiece, setActivePiece] = useState<ActivePiece | null>(null);
    const [stockfishReady, setStockfishReady] = useState(false);
    const [boardSize, setBoardSize] = useState(0);
    const [score, setScore] = useState(0);
    const boardRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<HTMLDivElement>(null);
    const [mouseX, setMouseX] = useState(0);
    const [mouseY, setMouseY] = useState(0);
    const selectedFields = useRef<{ row: number; col: number }[]>([]);

    useEffect(() => {
        function onBestMove({ from, to }: { from: string; to: string }) {
            const fromRow = 8 - parseInt(from[1]);
            const fromCol = from.charCodeAt(0) - 97;
            const toRow = 8 - parseInt(to[1]);
            const toCol = to.charCodeAt(0) - 97;

            const fen = generateFen(
                fromRow,
                fromCol,
                toRow,
                toCol,
                fens.current,
                fenIndex.current,
            );

            const newFens = [...fens.current, fen];
            fens.current = newFens;
            fenIndex.current = newFens.length - 1;

            audio.play("move");

            if (iAm !== getActivePlayer(fen)) {
                stockfish.calcBestMove(fen);
            }

            canvasRender(
                stockfishReady,
                images,
                audio,
                baseCanvas,
                eventCanvas,
                moveCanvas,
                boardSize,
                fens.current,
                fenIndex.current,
                activePiece,
                0,
                0,
                selectedFields.current,
            );
        }

        function onReady() {
            setStockfishReady(true);
        }

        function onScore({ cp }: { cp: number }) {
            const s = evaluationToWinProbability(cp);
            setScore(s);
        }

        stockfish.addEventListener("bestMove", onBestMove);
        stockfish.addEventListener("ready", onReady);
        stockfish.addEventListener("score", onScore);

        return () => {
            stockfish.removeEventListener("bestMove", onBestMove);
            stockfish.removeEventListener("ready", onReady);
            stockfish.removeEventListener("score", onScore);
        };
    }, [activePiece, audio, boardSize, images, stockfish, stockfishReady]);

    useEffect(() => {
        function onSize() {
            if (!boardRef.current) return;
            if (!gameRef.current) return;

            const width = window.innerWidth;
            const height = window.innerHeight - 96;

            const boardWidth = boardRef.current.clientWidth;
            const gameHeight = gameRef.current.clientHeight;

            setBoardSize(Math.min(width, height, boardWidth, gameHeight));
        }

        function onMouseMove(event: MouseEvent) {
            if (!eventCanvas.current) return;
            const rect = eventCanvas.current.getBoundingClientRect();

            // check if mouse is outside of canvas
            if (
                event.clientX < rect.left ||
                event.clientX > rect.right ||
                event.clientY < rect.top ||
                event.clientY > rect.bottom
            ) {
                setActivePiece(null);
            }
        }

        onSize();

        window.addEventListener("resize", onSize);
        window.addEventListener("mousemove", onMouseMove);

        return () => {
            window.removeEventListener("resize", onSize);
            window.removeEventListener("mousemove", onMouseMove);
        };
    }, []);

    useEffect(() => {
        canvasRender(
            stockfishReady,
            images,
            audio,
            baseCanvas,
            eventCanvas,
            moveCanvas,
            boardSize,
            fens.current,
            fenIndex.current,
            activePiece,
            mouseX,
            mouseY,
            selectedFields.current,
        );
    }, [activePiece, audio, boardSize, images, mouseX, mouseY, stockfishReady]);

    function makeCastleMove(
        fromRow: number,
        fromCol: number,
        toRow: number,
        toCol: number,
    ) {
        const fen = generateCastleFen(
            fromRow,
            fromCol,
            toRow,
            toCol,
            fens.current,
            fenIndex.current,
        );

        console.log(fen);

        const newFens = [...fens.current, fen];
        const newIndex = newFens.length - 1;
        fens.current = newFens;
        fenIndex.current = newIndex;

        audio.play("move");

        canvasRender(
            stockfishReady,
            images,
            audio,
            baseCanvas,
            eventCanvas,
            moveCanvas,
            boardSize,
            newFens,
            newIndex,
            activePiece,
            0,
            0,
            selectedFields.current,
        );
    }

    function moveByIndex(
        fromRow: number,
        fromCol: number,
        toRow: number,
        toCol: number,
    ) {
        move(
            `${String.fromCharCode(fromCol + 97)}${8 - fromRow}`,
            `${String.fromCharCode(toCol + 97)}${8 - toRow}`,
        );

        canvasRender(
            stockfishReady,
            images,
            audio,
            baseCanvas,
            eventCanvas,
            moveCanvas,
            boardSize,
            fens.current,
            fenIndex.current,
            activePiece,
            0,
            0,
            selectedFields.current,
        );
    }

    function onMouseDown(event: ReactMouseEvent) {
        if (event.button !== 0) return;
        if (!eventCanvas.current) return;

        selectedFields.current = [];

        const rect = eventCanvas.current.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const cellSize = rect.width / CHESSBOARD_SIZE;
        const row = Math.floor(mouseY / cellSize);
        const col = Math.floor(mouseX / cellSize);
        const board = createChessboard(fens.current[fenIndex.current]);
        const piece = board[row][col].piece;

        if (
            piece &&
            ((isWhitePiece(piece) && iAm === "w") ||
                (isBlackPiece(piece) && iAm === "b"))
        ) {
            setActivePiece({
                piece,
                row,
                col,
                grabPoint: {
                    x: mouseX - col * cellSize,
                    y: mouseY - row * cellSize,
                },
            });
        }
    }

    function onMouseUp(event: ReactMouseEvent) {
        if (!baseCanvas.current) return;

        if (activePiece) {
            const rect = baseCanvas.current.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            const cellSize = rect.width / CHESSBOARD_SIZE;
            const row = Math.floor(mouseY / cellSize);
            const col = Math.floor(mouseX / cellSize);

            setActivePiece(null);

            if (activePiece?.row === row && activePiece.col === col) {
                return;
            }

            const fen = fens.current[fenIndex.current];
            const activePlayer = getActivePlayer(fen);

            if (
                (isWhitePiece(activePiece.piece) && activePlayer === "w") ||
                (isBlackPiece(activePiece.piece) && activePlayer === "b")
            ) {
                const board = createChessboard(fen);

                const possibleMoves = getPossibleMoves(
                    activePiece.piece,
                    activePiece.row,
                    activePiece.col,
                    board,
                    fens.current,
                );

                if (
                    possibleMoves.length === 0 &&
                    (activePiece.piece === Piece.WhiteKing ||
                        activePiece.piece === Piece.BlackKing)
                ) {
                    return;
                }

                if (
                    possibleMoves.some(
                        (move) =>
                            move.targetRow === row && move.targetCol === col,
                    )
                ) {
                    const isCastle = isCastleMove(
                        activePiece.row,
                        activePiece.col,
                        row,
                        col,
                    );

                    if (isCastle) {
                        makeCastleMove(
                            activePiece.row,
                            activePiece.col,
                            row,
                            col,
                        );
                    } else {
                        moveByIndex(activePiece.row, activePiece.col, row, col);
                    }
                }
            }
        }
    }

    function onMouseMove(event: ReactMouseEvent) {
        if (!eventCanvas.current) return;
        const rect = eventCanvas.current.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        setMouseX(mouseX);
        setMouseY(mouseY);

        if (activePiece) {
            eventCanvas.current.style.cursor = "grabbing";
        } else {
            const cellSize = rect.width / CHESSBOARD_SIZE;
            const row = Math.floor(mouseY / cellSize);
            const col = Math.floor(mouseX / cellSize);
            const board = createChessboard(fens.current[fenIndex.current]);
            if (!board[row] || !board[row][col]) return;
            const piece = board[row][col].piece;

            if (piece) {
                eventCanvas.current.style.cursor = "pointer";
            } else {
                eventCanvas.current.style.cursor = "default";
            }
        }
    }

    function handleCalcBestMove(fen: string) {
        stockfish.calcBestMove(fen);
    }

    function move(from: string, to: string) {
        const fromRow = 8 - parseInt(from[1]);
        const fromCol = from.charCodeAt(0) - 97;
        const toRow = 8 - parseInt(to[1]);
        const toCol = to.charCodeAt(0) - 97;

        const fen = generateFen(
            fromRow,
            fromCol,
            toRow,
            toCol,
            fens.current,
            fenIndex.current,
        );

        const newFens = [...fens.current, fen];

        fens.current = newFens;
        fenIndex.current = newFens.length - 1;

        audio.play("move");

        if (iAm !== getActivePlayer(fen)) {
            stockfish.calcBestMove(fen);
        }
    }

    function onContextMenu(event: ReactMouseEvent) {
        if (!eventCanvas.current) return;
        event.preventDefault();
        const rect = eventCanvas.current.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const cellSize = rect.width / CHESSBOARD_SIZE;
        const row = Math.floor(mouseY / cellSize);
        const col = Math.floor(mouseX / cellSize);

        selectedFields.current = [...selectedFields.current, { row, col }];
        canvasRender(
            stockfishReady,
            images,
            audio,
            baseCanvas,
            eventCanvas,
            moveCanvas,
            boardSize,
            fens.current,
            fenIndex.current,
            activePiece,
            0,
            0,
            selectedFields.current,
        );
    }

    function onClick(event: ReactMouseEvent) {
        if (event.type === "click") {
            selectedFields.current = [];
            canvasRender(
                stockfishReady,
                images,
                audio,
                baseCanvas,
                eventCanvas,
                moveCanvas,
                boardSize,
                fens.current,
                fenIndex.current,
                activePiece,
                0,
                0,
                selectedFields.current,
            );
        }
    }

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2">
                <div className="flex items-center gap-2 px-4 w-full">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Button
                        onClick={() =>
                            handleCalcBestMove(fens.current[fenIndex.current])
                        }
                    >
                        FEN errechnen
                    </Button>
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <main className="w-full h-full">
                    <div className="Game" ref={gameRef}>
                        <WinProbability score={score} />
                        <div className="GameBoard" ref={boardRef}>
                            <canvas
                                ref={baseCanvas}
                                style={{ zIndex: 1 }}
                                width={boardSize}
                                height={boardSize}
                            />
                            <canvas
                                ref={moveCanvas}
                                width={boardSize}
                                height={boardSize}
                                style={{ zIndex: 2 }}
                            />
                            <canvas
                                ref={eventCanvas}
                                onMouseDown={onMouseDown}
                                onMouseUp={onMouseUp}
                                onMouseMove={onMouseMove}
                                width={boardSize}
                                height={boardSize}
                                style={{ zIndex: 3 }}
                                onContextMenu={onContextMenu}
                                onClick={onClick}
                            />
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
