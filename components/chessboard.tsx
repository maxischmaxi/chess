"use client";

import { Chess, Move } from "chess.js";
import {
    ActivePiece,
    CHESSBOARD_SIZE,
    ChessImages,
    defaultChessImages,
} from "@/lib/definitions";
import { render } from "@/lib/render";
import {
    MouseEvent as ReactMouseEvent,
    use,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { WinProbability } from "./winprobabilty";
import { ChessAudioConext } from "./audio-provider";
import { useStockfish } from "@/hooks/useStockfish";
import { Button } from "./ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";
import { CreateGameButton } from "./create-game-button";
import { WebsocketContext } from "./websocket-provider";

type Props = {
    fens: string[];
    gameId: string;
};

const pieces = ["pawn", "knight", "bishop", "rook", "queen", "king"];
const colors = ["w", "b"];

export function Chessboard(props: Props) {
    const chess = useRef(new Chess(props.fens[props.fens.length - 1]));
    const baseCanvas = useRef<HTMLCanvasElement>(null);
    const eventCanvas = useRef<HTMLCanvasElement>(null);
    const moveCanvas = useRef<HTMLCanvasElement>(null);
    const selectedFields = useRef<{ row: number; col: number }[]>([]);
    const boardRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<HTMLDivElement>(null);
    const activePiece = useRef<ActivePiece | null>(null);
    const [boardSize, setBoardSize] = useState(0);
    const [score, setScore] = useState(0);
    const mouseX = useRef(0);
    const mouseY = useRef(0);
    const audio = use(ChessAudioConext);
    const stockfish = useStockfish();
    const websocket = use(WebsocketContext);
    const [againstAi, setAgainstAi] = useState(false);
    const iAm = useRef<"w" | "b">("w");
    const [winner, setWinner] = useState<string | null>(null);
    const [outcome, setOutcome] = useState<string | null>(null);
    const flipped = useRef(false);
    const images = useRef<ChessImages>(defaultChessImages);
    const [imagesReady, setImagesReady] = useState(false);

    const playSound = useCallback(
        (move: Move) => {
            if (move.isPromotion()) {
                audio.play("promotion");
                return;
            }

            if (move.isKingsideCastle() || move.isQueensideCastle()) {
                audio.play("castle");
                return;
            }

            if (move.isCapture()) {
                audio.play("capture");
                return;
            }

            if (chess.current.isCheck() || chess.current.isCheckmate()) {
                audio.play("move-check");
                return;
            }

            audio.play("move-self");
        },
        [audio],
    );

    const executeAiMove = useCallback(() => {
        stockfish.getBestMove(chess.current).then((stockfishMove) => {
            const player = chess.current.turn();

            let move: Move | null = null;

            for (const m of chess.current.moves({ verbose: true })) {
                if (m.from + m.to === stockfishMove) {
                    chess.current.move(m);
                    playSound(m);
                    move = m;
                    break;
                }
            }

            if (!move) {
                return;
            }

            if (player !== iAm.current) {
                websocket.sendMove(props.gameId, move.lan, player);
            }

            if (chess.current.isGameOver()) {
                const result = chess.current.isCheckmate()
                    ? "Checkmate!"
                    : "Stalemate!";
                const winner = chess.current.turn() === "w" ? "b" : "w";
                setWinner(winner);
                setOutcome(result);
            }

            render(
                chess.current,
                images.current,
                baseCanvas,
                eventCanvas,
                moveCanvas,
                boardSize,
                activePiece.current,
                mouseX.current,
                mouseY.current,
                selectedFields.current,
                iAm.current,
                flipped.current,
            );
        });
        stockfish.getScore(chess.current).then((score) => setScore(score));
    }, [boardSize, playSound, props.gameId, stockfish, websocket]);

    useEffect(() => {
        const maxCount = pieces.length * 2;
        let loadedCount = 0;

        for (let i = 0; i < pieces.length; i++) {
            for (let x = 0; x < colors.length; x++) {
                const img = new Image();
                img.src = `/pieces/${pieces[i]}-${colors[x]}.svg`;

                img.onload = () => {
                    loadedCount++;
                    const key =
                        `${pieces[i]}-${colors[x]}` as keyof ChessImages;
                    images.current = { ...images.current, [key]: img };

                    if (loadedCount == maxCount) {
                        setImagesReady(true);
                    }
                };
            }
        }
    }, []);

    useEffect(() => {
        if (!imagesReady) return;
        render(
            chess.current,
            images.current,
            baseCanvas,
            eventCanvas,
            moveCanvas,
            boardSize,
            activePiece.current,
            mouseX.current,
            mouseY.current,
            selectedFields.current,
            iAm.current,
            flipped.current,
        );
    }, [boardSize, imagesReady]);

    useEffect(() => {
        function onMove(serverMove: string) {
            for (const move of chess.current.moves({ verbose: true })) {
                if (move.lan === serverMove) {
                    chess.current.move(move);
                    playSound(move);
                    render(
                        chess.current,
                        images.current,
                        baseCanvas,
                        eventCanvas,
                        moveCanvas,
                        boardSize,
                        activePiece.current,
                        mouseX.current,
                        mouseY.current,
                        selectedFields.current,
                        iAm.current,
                        flipped.current,
                    );
                    return;
                }
            }
        }

        function onAgainst({ id, color }: { id: string; color: "w" | "b" }) {
            if (id === "ai") {
                setAgainstAi(true);

                if (chess.current.turn() !== iAm.current) {
                    executeAiMove();
                }
            } else {
                setAgainstAi(false);
            }

            if (color === "w") {
                iAm.current = "b";
            } else {
                iAm.current = "w";
            }
        }

        websocket.addEventListener("onMove", onMove);
        websocket.addEventListener("onAgainst", onAgainst);

        return () => {
            websocket.removeEventListener("onMove", onMove);
            websocket.removeEventListener("onAgainst", onAgainst);
        };
    }, [audio, boardSize, executeAiMove, playSound, websocket]);

    useEffect(() => {
        function onSize() {
            if (!boardRef.current) return;
            if (!gameRef.current) return;

            const width = window.innerWidth;
            const height = window.innerHeight - 32;

            const boardWidth = boardRef.current.clientWidth;
            const gameHeight = gameRef.current.clientHeight;

            setBoardSize(Math.min(width, height, boardWidth, gameHeight));
        }

        function onMouseMove(event: MouseEvent) {
            if (!eventCanvas.current) return;
            const rect = eventCanvas.current.getBoundingClientRect();

            if (
                event.clientX < rect.left ||
                event.clientX > rect.right ||
                event.clientY < rect.top ||
                event.clientY > rect.bottom
            ) {
                activePiece.current = null;
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

    function onMouseDown(event: ReactMouseEvent) {
        if (event.button !== 0) return;
        if (!eventCanvas.current) return;

        selectedFields.current = [];

        const rect = eventCanvas.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        mouseX.current = x;
        mouseY.current = y;

        const cellSize = rect.width / CHESSBOARD_SIZE;
        const row = Math.floor(y / cellSize);
        const col = Math.floor(x / cellSize);

        const board = chess.current.board();
        const displayRow = iAm.current === "w" ? row : 7 - row;
        const displayCol = iAm.current === "w" ? col : 7 - col;
        const piece = board[displayRow][displayCol];

        if (!piece) return;

        const white = piece.color === "w" && iAm.current === "w";
        const black = piece.color === "b" && iAm.current === "b";

        if (white || black) {
            const grabX = x - col * cellSize;
            const grabY = y - row * cellSize;

            activePiece.current = {
                piece,
                row: displayRow,
                col: displayCol,
                grabPoint: {
                    x: grabX,
                    y: grabY,
                },
            };

            render(
                chess.current,
                images.current,
                baseCanvas,
                eventCanvas,
                moveCanvas,
                boardSize,
                activePiece.current,
                x,
                y,
                selectedFields.current,
                iAm.current,
                flipped.current,
            );
        }
    }

    const onMouseUp = useCallback(
        (event: ReactMouseEvent) => {
            if (!baseCanvas.current) return;
            if (!eventCanvas.current) return;
            if (!moveCanvas.current) return;
            if (!activePiece.current) return;

            const rect = baseCanvas.current.getBoundingClientRect();
            mouseX.current = event.clientX - rect.left;
            mouseY.current = event.clientY - rect.top;

            const cellSize = rect.width / CHESSBOARD_SIZE;
            const row = Math.floor(mouseY.current / cellSize);
            const col = Math.floor(mouseX.current / cellSize);
            const displayRow = iAm.current === "w" ? row : 7 - row;
            const displayCol = iAm.current === "w" ? col : 7 - col;

            if (
                activePiece.current.row === displayRow &&
                activePiece.current.col === displayCol
            ) {
                activePiece.current = null;
                return;
            }

            const player = chess.current.turn();
            const moves = chess.current.moves();

            if (moves.length === 0) {
                activePiece.current = null;
                return;
            }

            const white =
                activePiece.current.piece.color === "w" && player === "w";
            const black =
                activePiece.current.piece.color === "b" && player === "b";

            if (white || black) {
                const currentPiecePosition = `${String.fromCharCode(
                    97 + activePiece.current.col,
                )}${8 - activePiece.current.row}${String.fromCharCode(
                    97 + displayCol,
                )}${8 - displayRow}`;
                const moves = chess.current.moves({ verbose: true });

                const move = moves.find(
                    (m) => m.from + m.to === currentPiecePosition,
                );

                if (!move) {
                    activePiece.current = null;
                    audio.play("illegal");
                    return;
                }

                chess.current.move(move);
                playSound(move);

                websocket.sendMove(props.gameId, move.lan, player);

                if (chess.current.isGameOver()) {
                    const result = chess.current.isCheckmate()
                        ? "Checkmate!"
                        : "Stalemate!";
                    const winner = chess.current.turn() === "w" ? "b" : "w";
                    setWinner(winner);
                    setOutcome(result);
                }

                render(
                    chess.current,
                    images.current,
                    baseCanvas,
                    eventCanvas,
                    moveCanvas,
                    boardSize,
                    activePiece.current,
                    mouseX.current,
                    mouseY.current,
                    selectedFields.current,
                    iAm.current,
                    flipped.current,
                );

                if (againstAi) {
                    executeAiMove();
                }
            }
        },
        [
            againstAi,
            audio,
            boardSize,
            executeAiMove,
            playSound,
            props.gameId,
            websocket,
        ],
    );

    function onMouseMove(event: ReactMouseEvent) {
        if (!eventCanvas.current) return;
        const rect = eventCanvas.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        mouseX.current = x;
        mouseY.current = y;

        if (activePiece.current) {
            eventCanvas.current.style.cursor = "grabbing";
            render(
                chess.current,
                images.current,
                baseCanvas,
                eventCanvas,
                moveCanvas,
                boardSize,
                activePiece.current,
                x,
                y,
                selectedFields.current,
                iAm.current,
                flipped.current,
            );
        } else {
            const cellSize = rect.width / CHESSBOARD_SIZE;
            const row = Math.floor(y / cellSize);
            const col = Math.floor(x / cellSize);
            const displayRow = iAm.current === "w" ? row : 7 - row;
            const displayCol = iAm.current === "w" ? col : 7 - col;

            const board = chess.current.board();
            if (!board[displayRow] || !board[displayRow][displayCol]) return;
            const piece = board[displayRow][displayCol];

            if (piece) {
                eventCanvas.current.style.cursor = "pointer";
            } else {
                eventCanvas.current.style.cursor = "default";
            }
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
        render(
            chess.current,
            images.current,
            baseCanvas,
            eventCanvas,
            moveCanvas,
            boardSize,
            activePiece.current,
            mouseX,
            mouseY,
            selectedFields.current,
            iAm.current,
            flipped.current,
        );
    }

    function onClick(event: ReactMouseEvent) {
        if (event.type === "click") {
            selectedFields.current = [];
            render(
                chess.current,
                images.current,
                baseCanvas,
                eventCanvas,
                moveCanvas,
                boardSize,
                activePiece.current,
                mouseX.current,
                mouseY.current,
                selectedFields.current,
                iAm.current,
                flipped.current,
            );
        }
    }

    function onFlip() {
        flipped.current = !flipped.current;
        render(
            chess.current,
            images.current,
            baseCanvas,
            eventCanvas,
            moveCanvas,
            boardSize,
            activePiece.current,
            mouseX.current,
            mouseY.current,
            selectedFields.current,
            iAm.current,
            flipped.current,
        );
    }

    return (
        <main className="w-screen h-screen p-8">
            <div
                className="flex flex-col lg:flex-row flex-nowrap gap-4 w-full h-full"
                ref={gameRef}
            >
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
                <div className="flex flex-col-reverse lg:flex-col gap-4">
                    <Button onClick={executeAiMove}>Calculate best move</Button>
                    <Button onClick={onFlip}>Flip</Button>
                    <CreateGameButton />
                </div>
            </div>
            <Dialog open={winner != null || outcome === "draw"}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {winner
                                ? `${winner === "b" ? "Black" : "White"} wins!`
                                : "Draw!"}
                        </DialogTitle>
                        <DialogDescription>{outcome}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <CreateGameButton />
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}
