"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CHESSBOARD_SIZE } from "@/lib/definitions";
import { getPossibleMoves } from "@/lib/moves";
import { isBlackPiece, isOnBoard, isWhitePiece } from "@/lib/utils";
import {
    MouseEvent as ReactMouseEvent,
    KeyboardEvent,
    use,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useSize } from "@/hooks/useSize";
import { useScreen } from "@/hooks/useScreen";
import { ChessContext } from "@/components/chess-provider";
import { StockfishContext } from "@/components/stockfish-provider";

export function Chess() {
    const baseCanvas = useRef<HTMLCanvasElement>(null);
    const eventCanvas = useRef<HTMLCanvasElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const chess = use(ChessContext);
    const stockfish = use(StockfishContext);
    const [mousePosition, setMousePosition] = useState<{
        x: number;
        y: number;
    }>({ x: 0, y: 0 });
    const [importFen, setImportFen] = useState("");
    const gameSize = useSize(wrapperRef);
    const screen = useScreen();

    const boardSize = useMemo(() => {
        let width = gameSize.width;

        if (width > screen.height - 100) {
            width = screen.height - 100;
        }

        return width;
    }, [gameSize.width, screen.height]);

    function handleCalcBestMove(fen: string) {
        stockfish.calcBestMove(fen);
    }

    useEffect(() => {
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
                chess.setActivePiece(null);
            }
        }

        if (typeof window === undefined) {
            return;
        }

        window.addEventListener("mousemove", onMouseMove);

        return () => {
            if (typeof window === undefined) {
                return;
            }

            window.removeEventListener("mousemove", onMouseMove);
        };
    }, [chess]);

    function onKeyDown(event: KeyboardEvent) {
        if (event.key === "ArrowLeft" && chess.board.fens.length > 0) {
            chess.jumpBackward();
        }

        if (event.key === "ArrowRight" && chess.board.fens.length > 0) {
            chess.jumpForward();
        }
    }

    useEffect(() => {
        chess.render(baseCanvas, eventCanvas, boardSize, mousePosition);
    }, [boardSize, chess, mousePosition]);

    function onMouseDown(event: ReactMouseEvent) {
        if (!baseCanvas.current) return;
        const rect = baseCanvas.current.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        setMousePosition({ x: mouseX, y: mouseY });

        const cellSize = rect.width / CHESSBOARD_SIZE;
        const row = Math.floor(mouseY / cellSize);
        const col = Math.floor(mouseX / cellSize);
        const piece = chess.board.fields[row][col].piece;

        if (
            piece &&
            chess.iAm === chess.board.activePlayer &&
            ((isWhitePiece(piece) && chess.board.activePlayer === "w") ||
                (isBlackPiece(piece) && chess.board.activePlayer === "b"))
        ) {
            chess.setActivePiece({
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
        if (chess.activePiece && baseCanvas.current) {
            const rect = baseCanvas.current.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            setMousePosition({ x: mouseX, y: mouseY });

            const cellSize = rect.width / CHESSBOARD_SIZE;
            const row = Math.floor(mouseY / cellSize);
            const col = Math.floor(mouseX / cellSize);

            if (
                chess.activePiece.row === row &&
                chess.activePiece.col === col
            ) {
                chess.setActivePiece(null);
                return;
            }

            if (
                (isWhitePiece(chess.activePiece.piece) &&
                    chess.board.activePlayer === "w") ||
                (isBlackPiece(chess.activePiece.piece) &&
                    chess.board.activePlayer === "b")
            ) {
                const possibleMoves = getPossibleMoves(
                    chess.activePiece.piece,
                    chess.activePiece.row,
                    chess.activePiece.col,
                    chess.board.fields,
                );

                if (possibleMoves.some(([r, c]) => r === row && c === col)) {
                    chess.moveByIndex(
                        chess.activePiece.row,
                        chess.activePiece.col,
                        row,
                        col,
                    );
                }
            }
            chess.setActivePiece(null);
        }
    }

    function onMouseMove(event: ReactMouseEvent) {
        if (chess.activePiece && baseCanvas.current) {
            const rect = baseCanvas.current.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            setMousePosition({ x: mouseX, y: mouseY });

            baseCanvas.current.style.cursor = "grabbing";
        } else {
            if (!baseCanvas.current) return;
            const rect = baseCanvas.current.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            const cellSize = rect.width / CHESSBOARD_SIZE;
            const row = Math.floor(mouseY / cellSize);
            const col = Math.floor(mouseX / cellSize);

            if (isOnBoard(row, col)) {
                const piece = chess.board.fields[row][col].piece;

                if (piece) {
                    baseCanvas.current.style.cursor = "pointer";
                } else {
                    baseCanvas.current.style.cursor = "default";
                }
            }
        }
    }

    function handleImport() {
        chess.importFen(importFen);
    }

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2">
                <div className="flex items-center gap-2 px-4 w-full">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Input
                        type="text"
                        className="w-auto"
                        value={importFen}
                        placeholder="FEN"
                        onChange={(e) => setImportFen(e.currentTarget.value)}
                    />
                    <Button onClick={handleImport}>Importieren</Button>
                    <Button
                        onClick={() =>
                            handleCalcBestMove(
                                chess.board.fens[chess.board.fenIndex],
                            )
                        }
                    >
                        FEN errechnen
                    </Button>
                    <Button
                        variant={
                            chess.board.activePlayer === "w"
                                ? "default"
                                : "outline"
                        }
                    >
                        Weiß
                    </Button>
                    <Button
                        variant={
                            chess.board.activePlayer === "b"
                                ? "default"
                                : "outline"
                        }
                    >
                        Schwarz
                    </Button>
                    <span className="ml-auto px-4">
                        {stockfish.workerIndicator}
                    </span>
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <main className="w-full h-full">
                    <div className="Game" ref={wrapperRef}>
                        <div
                            className="GameBoard"
                            style={{ width: boardSize, height: boardSize }}
                        >
                            <canvas
                                onKeyDown={onKeyDown}
                                ref={baseCanvas}
                                style={{ zIndex: 1 }}
                                width={boardSize}
                                height={boardSize}
                            />
                            <canvas
                                ref={eventCanvas}
                                onKeyDown={onKeyDown}
                                width={boardSize}
                                height={boardSize}
                                onMouseDown={onMouseDown}
                                onMouseUp={onMouseUp}
                                onMouseMove={onMouseMove}
                                style={{ zIndex: 2 }}
                            />
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
