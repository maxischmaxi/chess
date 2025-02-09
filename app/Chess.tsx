"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CHESSBOARD_SIZE } from "@/lib/definitions";
import { Board } from "@/lib/field";
import { getPossibleMoves } from "@/lib/moves";
import { ActivePiece } from "@/lib/pieces";
import {
    boardToFen,
    createChessboard,
    drawArrow,
    drawCell,
    drawCircle,
    drawDebugInfos,
    drawImage,
    drawStartCell,
    drawThrow,
    getActivePlayer,
    isBlackPiece,
    isOnBoard,
    isWhitePiece,
} from "@/lib/utils";
import {
    MouseEvent as ReactMouseEvent,
    useEffect,
    useRef,
    useState,
} from "react";

const iAm: "w" | "b" = "w";

export function Chess() {
    const workerRef = useRef<Worker | null>(null);
    const baseCanvas = useRef<HTMLCanvasElement>(null);
    const eventCanvas = useRef<HTMLCanvasElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [board, setBoard] = useState<Board>({
        fields: createChessboard(
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        ),
        fens: ["rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"],
        activePlayer: "w",
        fenIndex: 0,
    });
    const [activePiece, setActivePiece] = useState<ActivePiece | null>(null);
    const [mousePosition, setMousePosition] = useState<{
        x: number;
        y: number;
    }>({ x: 0, y: 0 });
    const [importFen, setImportFen] = useState("");
    const [bestMove, setBestMove] = useState<string | null>(null);
    const [workerIndicator, setWorkerIndicator] = useState<string>("");

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            console.log(event.key);

            if (
                event.key === "Enter" &&
                bestMove &&
                board.activePlayer != iAm
            ) {
                const from = bestMove.slice(0, 2);
                const to = bestMove.slice(2, 4);
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

                setBoard({
                    fields,
                    activePlayer,
                    fens,
                    fenIndex: fens.length - 1,
                });

                setBestMove(null);
            }

            if (event.key === "ArrowLeft" && board.fens.length > 0) {
                setBestMove(null);
                const fenIndex = board.fenIndex - 1;
                if (fenIndex < 0) return;

                const newBoard = structuredClone(board);
                newBoard.fenIndex = fenIndex;
                newBoard.fields = createChessboard(newBoard.fens[fenIndex]);
                newBoard.activePlayer = getActivePlayer(
                    newBoard.fens[fenIndex],
                );
                setBoard(newBoard);

                if (iAm !== newBoard.activePlayer) {
                    handleCalcBestMove(newBoard.fens[fenIndex]);
                }
            }

            if (event.key === "ArrowRight" && board.fens.length > 0) {
                setBestMove(null);
                const fenIndex = Math.min(
                    board.fenIndex + 1,
                    board.fens.length - 1,
                );
                const newBoard = structuredClone(board);
                newBoard.fenIndex = fenIndex;
                newBoard.fields = createChessboard(newBoard.fens[fenIndex]);
                newBoard.activePlayer = getActivePlayer(
                    newBoard.fens[fenIndex],
                );
                setBoard(newBoard);

                if (iAm !== newBoard.activePlayer) {
                    handleCalcBestMove(newBoard.fens[fenIndex]);
                }
            }
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

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("keydown", onKeyDown);

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("mousemove", onMouseMove);
        };
    }, [bestMove, board, board.activePlayer, board.fens, board.fields]);

    useEffect(() => {
        const worker = new Worker("/api/stockfish");

        workerRef.current = worker;

        worker.onmessage = function (event: MessageEvent) {
            const line = event.data ? event.data : event;

            if (String(line).startsWith("Stockfish")) {
                setWorkerIndicator("Stockfish ready");
            }

            const bestMoveMatch = line.match(/bestmove\s+(\S+)/);
            if (bestMoveMatch) {
                setBestMove(bestMoveMatch[1]);
            }

            const infoMatch = line.match(/info\s+depth\s+(\d+)/);
            if (infoMatch) {
                setWorkerIndicator(`Depth: ${infoMatch[1]}`);
            }
        };

        return () => {
            if (typeof worker.terminate === "function") {
                worker.terminate();
            }
        };
    }, []);

    function handleCalcBestMove(fen: string) {
        if (!workerRef.current) return;

        workerRef.current.postMessage(`position fen ${fen}`);
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

        if (bestMove) {
            const from = bestMove.slice(0, 2);
            const to = bestMove.slice(2, 4);
            const fromRow = 8 - parseInt(from[1]);
            const fromCol = from.charCodeAt(0) - 97;
            const toRow = 8 - parseInt(to[1]);
            const toCol = to.charCodeAt(0) - 97;

            const fromX = fromCol * cellSize + cellSize / 2;
            const fromY = fromRow * cellSize + cellSize / 2;
            const toX = toCol * cellSize + cellSize / 2;
            const toY = toRow * cellSize + cellSize / 2;

            drawArrow(eventContext, fromX, fromY, toX, toY);
        }

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

                    drawImage(
                        eventContext,
                        piece,
                        mousePosition.x,
                        mousePosition.y,
                        cellSize,
                        activePiece,
                    );
                } else {
                    drawImage(
                        baseContext,
                        piece,
                        c * cellSize,
                        r * cellSize,
                        cellSize,
                    );
                }
            }
        }
    }, [
        activePiece,
        bestMove,
        board.activePlayer,
        board.fields,
        mousePosition.x,
        mousePosition.y,
    ]);

    function onMouseDown(event: ReactMouseEvent) {
        if (!baseCanvas.current) return;
        const rect = baseCanvas.current.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        setMousePosition({ x: mouseX, y: mouseY });

        const cellSize = rect.width / CHESSBOARD_SIZE;
        const row = Math.floor(mouseY / cellSize);
        const col = Math.floor(mouseX / cellSize);
        const piece = board.fields[row][col].piece;

        if (
            piece &&
            iAm === board.activePlayer &&
            ((isWhitePiece(piece) && board.activePlayer === "w") ||
                (isBlackPiece(piece) && board.activePlayer === "b"))
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
                (isWhitePiece(activePiece.piece) &&
                    board.activePlayer === "w") ||
                (isBlackPiece(activePiece.piece) && board.activePlayer === "b")
            ) {
                const possibleMoves = getPossibleMoves(
                    activePiece.piece,
                    activePiece.row,
                    activePiece.col,
                    board.fields,
                );

                if (possibleMoves.some(([r, c]) => r === row && c === col)) {
                    const fields = structuredClone(board.fields);
                    fields[row][col].piece =
                        fields[activePiece.row][activePiece.col].piece;
                    fields[activePiece.row][activePiece.col].piece = undefined;

                    const activePlayer = board.activePlayer === "w" ? "b" : "w";

                    const fens = structuredClone(board.fens);
                    fens.push(boardToFen(fields, activePlayer));

                    setBoard({
                        fields,
                        activePlayer,
                        fens,
                        fenIndex: fens.length - 1,
                    });

                    handleCalcBestMove(fens[fens.length - 1]);
                }
            }
            setActivePiece(null);
            setBestMove(null);
        }
    }

    function onMouseMove(event: ReactMouseEvent) {
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

            if (isOnBoard(row, col)) {
                const piece = board.fields[row][col].piece;

                if (piece) {
                    baseCanvas.current.style.cursor = "pointer";
                } else {
                    baseCanvas.current.style.cursor = "default";
                }
            }
        }
    }

    function handleImport() {
        setBoard({
            fields: createChessboard(importFen),
            activePlayer: getActivePlayer(importFen),
            fens: [importFen],
            fenIndex: 0,
        });
    }

    return (
        <main>
            <div className="GameWrapper">
                <div className="GameHeader">
                    <Input
                        type="text"
                        value={importFen}
                        placeholder="FEN"
                        onChange={(e) => setImportFen(e.currentTarget.value)}
                    />
                    <Button onClick={handleImport}>Importieren</Button>
                    <span className="px-4">{workerIndicator}</span>
                    <Button
                        onClick={() =>
                            handleCalcBestMove(board.fens[board.fenIndex])
                        }
                    >
                        FEN errechnen
                    </Button>
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
                </div>
            </div>
            <div className="Sidebar">
                <div className="flex flex-row gap-4 flex-nowrap">
                    <Button
                        variant={
                            board.activePlayer === "w" ? "default" : "outline"
                        }
                    >
                        Weiß
                    </Button>
                    <Button
                        variant={
                            board.activePlayer === "b" ? "default" : "outline"
                        }
                    >
                        Schwarz
                    </Button>
                </div>
            </div>
        </main>
    );
}
