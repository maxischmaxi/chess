"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CHESSBOARD_SIZE } from "@/lib/definitions";
import { Chessfield } from "@/lib/field";
import { getPossibleMoves } from "@/lib/moves";
import { ActivePiece, Piece } from "@/lib/pieces";
import {
    boardToFen,
    createChessboard,
    getActivePlayer,
    getPieceImage,
    isBlackPiece,
    isWhitePiece,
} from "@/lib/utils";
import Image from "next/image";
import { MouseEvent, useEffect, useRef, useState } from "react";

const wasmSupported =
    typeof WebAssembly === "object" &&
    WebAssembly.validate(
        Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x1, 0x0, 0x0, 0x0),
    );

export default function Home() {
    const workerRef = useRef<Worker | null>(null);
    const baseCanvas = useRef<HTMLCanvasElement>(null);
    const eventCanvas = useRef<HTMLCanvasElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [fen, setFen] = useState<string[]>([
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    ]);
    const [currentFen, setCurrentFen] = useState(fen[0]);
    const [board, setBoard] = useState<Chessfield[][]>(
        createChessboard(currentFen),
    );
    const [activePlayer, setActivePlayer] = useState<"white" | "black">(
        getActivePlayer(currentFen),
    );
    const [activePiece, setActivePiece] = useState<ActivePiece | null>(null);
    const [mousePosition, setMousePosition] = useState<{
        x: number;
        y: number;
    }>({ x: 0, y: 0 });
    const [importFen, setImportFen] = useState("");

    useEffect(() => {
        let worker: Worker;

        if (wasmSupported) {
            worker = new Worker(
                new URL("http://localhost:3000/stockfish.wasm"),
            );
        } else {
            worker = new Worker(new URL("http://localhost:3000/stockfish.js"));
        }

        workerRef.current = worker;

        worker.onmessage = function (event: MessageEvent) {
            const line = event.data ? event.data : event;
            const match = line.match(/bestmove\s+(\S+)/);
            if (match) {
                const bestMove = match[1];
                console.log("Best move:", bestMove);
            }
        };

        return () => {
            if (typeof worker.terminate === "function") {
                worker.terminate();
            }
        };
    }, []);

    function handleCalcBestMove() {
        if (!workerRef.current) return;

        if (currentFen === "startpos") {
            workerRef.current.postMessage(`position startpos`);
        } else {
            workerRef.current.postMessage(`position fen ${currentFen}`);
        }

        // Engine starten - z.B. Depth 15
        workerRef.current.postMessage("go depth 15");
    }

    useEffect(() => {
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

        const { width: displayedWidth, height: displayedHeight } =
            baseCanvas.current.getBoundingClientRect();

        baseCanvas.current.width = displayedWidth;
        baseCanvas.current.height = displayedHeight;
        eventCanvas.current.width = displayedWidth;
        eventCanvas.current.height = displayedHeight;

        const cellSize = displayedWidth / CHESSBOARD_SIZE;

        for (let r = 0; r < CHESSBOARD_SIZE; r++) {
            for (let c = 0; c < CHESSBOARD_SIZE; c++) {
                const isBlackField = (r + c) % 2 === 0;
                baseContext.fillStyle = isBlackField ? "#769656" : "#eeeed2";
                baseContext.fillRect(
                    c * cellSize,
                    r * cellSize,
                    cellSize,
                    cellSize,
                );

                const piece = board[r][c].piece;

                if (piece) {
                    if (
                        activePiece?.piece === piece &&
                        activePiece.row === r &&
                        activePiece.col === c &&
                        mousePosition.x !== undefined &&
                        mousePosition.y !== undefined
                    ) {
                        if (isWhitePiece(piece) && activePlayer === "black") {
                        } else if (
                            isBlackPiece(piece) &&
                            activePlayer === "white"
                        ) {
                        } else {
                            const possibleMoves = getPossibleMoves(
                                piece,
                                r,
                                c,
                                board,
                            );

                            eventContext.strokeStyle = "rgba(0,0,0,0.5)";
                            eventContext.lineWidth = 2;
                            let nearest: number[] = [];

                            for (const [row, col] of possibleMoves) {
                                eventContext.beginPath();
                                const x = col * cellSize;
                                const y = row * cellSize;

                                eventContext.arc(
                                    x + cellSize / 2,
                                    y + cellSize / 2,
                                    cellSize / 3.5,
                                    0,
                                    2 * Math.PI,
                                );
                                eventContext.stroke();

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
                                eventContext.lineWidth = 4;
                                eventContext.beginPath();
                                const x = nearest[1] * cellSize;
                                const y = nearest[0] * cellSize;
                                eventContext.arc(
                                    x + cellSize / 2,
                                    y + cellSize / 2,
                                    cellSize / 3.5,
                                    0,
                                    2 * Math.PI,
                                );
                                eventContext.stroke();
                            }
                        }

                        const id = `piece-${piece}`;
                        const pieceImage = document.getElementById(id) as
                            | HTMLImageElement
                            | undefined;
                        if (pieceImage) {
                            eventContext.drawImage(
                                pieceImage,
                                mousePosition.x - activePiece.grabPoint.x,
                                mousePosition.y - activePiece.grabPoint.y,
                                cellSize,
                                cellSize,
                            );
                        }
                    } else {
                        const id = `piece-${piece}`;
                        const pieceImage = document.getElementById(id) as
                            | HTMLImageElement
                            | undefined;
                        if (pieceImage) {
                            baseContext.drawImage(
                                pieceImage,
                                c * cellSize,
                                r * cellSize,
                                cellSize,
                                cellSize,
                            );
                        }
                    }
                }

                baseContext.fillStyle = "black";
                baseContext.font = "12px sans-serif";
                baseContext.fillText(
                    `${c},${r}`,
                    c * cellSize + 10,
                    r * cellSize + 20,
                );

                baseContext.fillText(
                    `${board[r][c].letterLabel}${board[r][c].numberLabel}`,
                    c * cellSize + 10,
                    r * cellSize + 35,
                );
            }
        }
    }, [activePiece, activePlayer, board, mousePosition]);

    useEffect(() => {
        function keyDown(event: KeyboardEvent) {
            if (event.key === "ArrowRight") {
                if (fen.indexOf(currentFen) < fen.length - 1) {
                    setCurrentFen(fen[fen.indexOf(currentFen) + 1]);
                }
            }
            if (event.key === "ArrowLeft") {
                if (fen.indexOf(currentFen) > 0) {
                    setCurrentFen(fen[fen.indexOf(currentFen) - 1]);
                }
            }
        }

        window.addEventListener("keydown", keyDown);

        return () => {
            window.removeEventListener("keydown", keyDown);
        };
    }, [currentFen, fen]);

    function onMouseDown(event: MouseEvent) {
        if (!baseCanvas.current) return;
        const rect = baseCanvas.current.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        setMousePosition({ x: mouseX, y: mouseY });

        const cellSize = rect.width / CHESSBOARD_SIZE;
        const row = Math.floor(mouseY / cellSize);
        const col = Math.floor(mouseX / cellSize);
        const piece = board[row][col].piece;

        if (piece) {
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

    function onMouseUp(event: MouseEvent) {
        if (activePiece && baseCanvas.current) {
            const rect = baseCanvas.current.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            setMousePosition({ x: mouseX, y: mouseY });

            const cellSize = rect.width / CHESSBOARD_SIZE;
            const row = Math.floor(mouseY / cellSize);
            const col = Math.floor(mouseX / cellSize);

            if (activePiece.row === row && activePiece.col === col) {
                setActivePiece(null);
                return;
            }

            if (
                (isWhitePiece(activePiece.piece) && activePlayer === "white") ||
                (isBlackPiece(activePiece.piece) && activePlayer === "black")
            ) {
                const possibleMoves = getPossibleMoves(
                    activePiece.piece,
                    activePiece.row,
                    activePiece.col,
                    board,
                );

                if (possibleMoves.some(([r, c]) => r === row && c === col)) {
                    const newBoard = structuredClone(board);
                    newBoard[row][col].piece = activePiece.piece;
                    newBoard[activePiece.row][activePiece.col].piece =
                        undefined;
                    setBoard(newBoard);
                    const newFen = boardToFen(
                        newBoard,
                        activePlayer === "white" ? "b" : "w",
                    );
                    setFen([...fen, newFen]);
                    setCurrentFen(newFen);
                    setActivePlayer(
                        activePlayer === "white" ? "black" : "white",
                    );
                }
            }
            setActivePiece(null);
        }
    }

    function onMouseMove(event: MouseEvent) {
        if (activePiece && baseCanvas.current) {
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
            const piece = board[row][col].piece;

            if (piece) {
                baseCanvas.current.style.cursor = "pointer";
            } else {
                baseCanvas.current.style.cursor = "default";
            }
        }
    }

    function handleImport() {
        const newBoard = createChessboard(importFen);
        setBoard(newBoard);
        setFen([importFen]);
        setCurrentFen(importFen);
        setActivePlayer(getActivePlayer(importFen));
    }

    return (
        <main>
            <div className="flex flex-row flex-nowrap gap-4 justify-start items-center w-[1000px]">
                <Input
                    type="text"
                    value={importFen}
                    placeholder="FEN"
                    onChange={(e) => setImportFen(e.currentTarget.value)}
                />
                <Button onClick={handleImport}>Importieren</Button>
                <Button onClick={handleCalcBestMove}>FEN errechnen</Button>
            </div>
            <div className="Game" ref={wrapperRef}>
                <canvas ref={baseCanvas} style={{ zIndex: 1 }} />
                <canvas
                    ref={eventCanvas}
                    onMouseDown={onMouseDown}
                    onMouseUp={onMouseUp}
                    onMouseMove={onMouseMove}
                    style={{ zIndex: 2 }}
                />
                {Object.values(Piece).map((key) => (
                    <Image
                        src={getPieceImage(key)}
                        alt={key}
                        key={key}
                        width={1000 / 8}
                        height={1000 / 8}
                        id={`piece-${key}`}
                    />
                ))}
            </div>
        </main>
    );
}
