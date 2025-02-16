"use client";

import { ActivePiece, CHESSBOARD_SIZE } from "@/lib/definitions";
import { render } from "@/lib/render";
import {
    createChessboard,
    evaluationToWinProbability,
    getActivePlayer,
    isBlackPiece,
    isCastleMove,
    isWhitePiece,
    moveToUciNotation,
} from "@/lib/utils";
import {
    MouseEvent as ReactMouseEvent,
    use,
    useEffect,
    useRef,
    useState,
} from "react";
import { WinProbability } from "./winprobabilty";
import { ChessAudioConext } from "./audio-provider";
import { ImagesContext } from "./images-provider";
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

export function Chessboard(props: Props) {
    const images = use(ImagesContext);
    const fens = useRef<string[]>(props.fens);
    const baseCanvas = useRef<HTMLCanvasElement>(null);
    const eventCanvas = useRef<HTMLCanvasElement>(null);
    const moveCanvas = useRef<HTMLCanvasElement>(null);
    const fenIndex = useRef<number>(props.fens.length - 1);
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
    const possibleMoves = useRef<string[]>([]);
    const [winner, setWinner] = useState<string | null>(null);
    const [outcome, setOutcome] = useState<string | null>(null);
    const [capturedPieces, setCapturedPieces] = useState<{
        white: string[];
        black: string[];
    }>({ white: [], black: [] });
    const flipped = useRef(false);

    useEffect(() => {
        function onMove(fen: string) {
            audio.play("move");
            fens.current = [...fens.current, fen];
            fenIndex.current = fens.current.length - 1;

            render(
                images,
                audio,
                baseCanvas,
                eventCanvas,
                moveCanvas,
                boardSize,
                fens.current,
                fenIndex.current,
                activePiece.current,
                mouseX.current,
                mouseY.current,
                selectedFields.current,
                iAm.current,
                possibleMoves.current,
                flipped.current,
            );

            if (againstAi) {
                const activePlayer = getActivePlayer(fen);
                if (!activePlayer) return;

                if (activePlayer !== iAm.current) {
                    stockfish.calcBestMove(fen);
                }
            }
        }

        function onAgainst({ id, color }: { id: string; color: "w" | "b" }) {
            if (id === "ai") {
                setAgainstAi(true);
            } else {
                setAgainstAi(false);
            }

            if (color === "w") {
                iAm.current = "b";
            } else {
                iAm.current = "w";
            }
        }

        function onPossibleMoves(moves: string[]) {
            possibleMoves.current = moves;
        }

        function onOutcome({
            outcome,
            winner,
        }: {
            outcome: string;
            winner: string;
        }) {
            if (winner) {
                setWinner(winner);
            } else {
                setWinner(null);
            }
            setOutcome(outcome);
        }

        function onCapturedPieces({
            white,
            black,
        }: {
            white: string[];
            black: string[];
        }) {
            setCapturedPieces({
                white,
                black,
            });
        }

        function onShouldStart() {
            if (fens.current.length === 1) {
                stockfish.calcBestMove(fens.current[fenIndex.current]);
            }
        }

        websocket.addEventListener("onMove", onMove);
        websocket.addEventListener("onAgainst", onAgainst);
        websocket.addEventListener("onPossibleMoves", onPossibleMoves);
        websocket.addEventListener("onOutcome", onOutcome);
        websocket.addEventListener("onCapturedPieces", onCapturedPieces);
        websocket.addEventListener("onShouldStart", onShouldStart);

        return () => {
            websocket.removeEventListener("onMove", onMove);
            websocket.removeEventListener("onAgainst", onAgainst);
            websocket.removeEventListener("onPossibleMoves", onPossibleMoves);
            websocket.removeEventListener("onOutcome", onOutcome);
            websocket.removeEventListener("onCapturedPieces", onCapturedPieces);
            websocket.removeEventListener("onShouldStart", onShouldStart);
        };
    }, [againstAi, audio, boardSize, images, stockfish, websocket]);

    useEffect(() => {
        if (!againstAi) {
            return;
        }

        function onBestMove({ from, to }: { from: string; to: string }) {
            console.log(`${from}${to}`);
            const fromRow = 8 - parseInt(from[1]);
            const fromCol = from.charCodeAt(0) - 97;
            const toRow = 8 - parseInt(to[1]);
            const toCol = to.charCodeAt(0) - 97;

            const fen = fens.current[fenIndex.current];
            if (!fen) return;

            const activePlayer = getActivePlayer(fen);
            let extra = "";
            if (to.length === 3) {
                extra = to[2];
            }

            if (activePlayer !== iAm.current) {
                websocket.sendMove(
                    props.gameId,
                    moveToUciNotation(
                        fromRow,
                        fromCol,
                        toRow,
                        toCol,
                        false,
                        extra,
                    ),
                    activePlayer,
                );
            }
        }

        function onScore({ cp }: { cp: number }) {
            const s = evaluationToWinProbability(cp);
            setScore(s);
        }

        stockfish.addEventListener("bestMove", onBestMove);
        stockfish.addEventListener("score", onScore);

        return () => {
            stockfish.removeEventListener("bestMove", onBestMove);
            stockfish.removeEventListener("score", onScore);
        };
    }, [againstAi, props.gameId, stockfish, websocket]);

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

    useEffect(() => {
        if (fenIndex.current < 0) {
            return;
        }

        render(
            images,
            audio,
            baseCanvas,
            eventCanvas,
            moveCanvas,
            boardSize,
            fens.current,
            fenIndex.current,
            activePiece.current,
            mouseX.current,
            mouseY.current,
            selectedFields.current,
            iAm.current,
            possibleMoves.current,
            flipped.current,
        );
    }, [activePiece, audio, boardSize, images]);

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

        const fen = fens.current[fenIndex.current];
        if (!fen) return;

        const board = createChessboard(fen);
        const displayRow = iAm.current === "w" ? row : 7 - row;
        const displayCol = iAm.current === "w" ? col : 7 - col;
        const piece = board[displayRow][displayCol].piece;

        if (!piece) return;

        const white = isWhitePiece(piece) && iAm.current === "w";
        const black = isBlackPiece(piece) && iAm.current === "b";

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
                images,
                audio,
                baseCanvas,
                eventCanvas,
                moveCanvas,
                boardSize,
                fens.current,
                fenIndex.current,
                activePiece.current,
                x,
                y,
                selectedFields.current,
                iAm.current,
                possibleMoves.current,
                flipped.current,
            );
        }
    }

    function onMouseUp(event: ReactMouseEvent) {
        if (!baseCanvas.current) return;
        if (!eventCanvas.current) return;
        if (!moveCanvas.current) return;

        if (activePiece.current) {
            const rect = baseCanvas.current.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            mouseX.current = x;
            mouseY.current = y;

            const cellSize = rect.width / CHESSBOARD_SIZE;
            const row = Math.floor(y / cellSize);
            const col = Math.floor(x / cellSize);
            const displayRow = iAm.current === "w" ? row : 7 - row;
            const displayCol = iAm.current === "w" ? col : 7 - col;

            if (
                activePiece.current.row === displayRow &&
                activePiece.current.col === displayCol
            ) {
                activePiece.current = null;
                return;
            }

            const fen = fens.current[fenIndex.current];
            if (!fen) return;

            const activePlayer = getActivePlayer(fen);

            if (possibleMoves.current.length === 0) {
                activePiece.current = null;
                return;
            }

            const white =
                isWhitePiece(activePiece.current.piece) && activePlayer === "w";
            const black =
                isBlackPiece(activePiece.current.piece) && activePlayer === "b";

            if (white || black) {
                const currentPiecePosition = `${String.fromCharCode(
                    97 + activePiece.current.col,
                )}${8 - activePiece.current.row}${String.fromCharCode(
                    97 + displayCol,
                )}${8 - displayRow}`;

                for (const pMove of possibleMoves.current) {
                    if (pMove === currentPiecePosition) {
                        const isCastle = isCastleMove(
                            activePiece.current.row,
                            activePiece.current.col,
                            displayRow,
                            displayCol,
                        );

                        move(pMove.slice(0, 2), pMove.slice(2, 4), isCastle);
                    }
                }
            }

            activePiece.current = null;
        }
    }

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
                images,
                audio,
                baseCanvas,
                eventCanvas,
                moveCanvas,
                boardSize,
                fens.current,
                fenIndex.current,
                activePiece.current,
                x,
                y,
                selectedFields.current,
                iAm.current,
                possibleMoves.current,
                flipped.current,
            );
        } else {
            const cellSize = rect.width / CHESSBOARD_SIZE;
            const row = Math.floor(y / cellSize);
            const col = Math.floor(x / cellSize);
            const displayRow = iAm.current === "w" ? row : 7 - row;
            const displayCol = iAm.current === "w" ? col : 7 - col;

            const fen = fens.current[fenIndex.current];
            if (!fen) return;

            const board = createChessboard(fen);
            if (!board[displayRow] || !board[displayRow][displayCol]) return;
            const piece = board[displayRow][displayCol].piece;

            if (piece) {
                eventCanvas.current.style.cursor = "pointer";
            } else {
                eventCanvas.current.style.cursor = "default";
            }
        }
    }

    function move(from: string, to: string, isCastle: boolean = false) {
        const fromRow = 8 - parseInt(from[1]);
        const fromCol = from.charCodeAt(0) - 97;
        const toRow = 8 - parseInt(to[1]);
        const toCol = to.charCodeAt(0) - 97;
        websocket.sendMove(
            props.gameId,
            moveToUciNotation(fromRow, fromCol, toRow, toCol, isCastle),
            getActivePlayer(fens.current[fenIndex.current]),
        );
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
            images,
            audio,
            baseCanvas,
            eventCanvas,
            moveCanvas,
            boardSize,
            fens.current,
            fenIndex.current,
            activePiece.current,
            0,
            0,
            selectedFields.current,
            iAm.current,
            possibleMoves.current,
            flipped.current,
        );
    }

    function onClick(event: ReactMouseEvent) {
        if (event.type === "click") {
            selectedFields.current = [];
            render(
                images,
                audio,
                baseCanvas,
                eventCanvas,
                moveCanvas,
                boardSize,
                fens.current,
                fenIndex.current,
                activePiece.current,
                0,
                0,
                selectedFields.current,
                iAm.current,
                possibleMoves.current,
                flipped.current,
            );
        }
    }

    function onFlip() {
        flipped.current = !flipped.current;
        render(
            images,
            audio,
            baseCanvas,
            eventCanvas,
            moveCanvas,
            boardSize,
            fens.current,
            fenIndex.current,
            activePiece.current,
            mouseX.current,
            mouseY.current,
            selectedFields.current,
            iAm.current,
            possibleMoves.current,
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
                    <Button
                        onClick={() =>
                            stockfish.calcBestMove(
                                fens.current[fenIndex.current],
                            )
                        }
                    >
                        Calculate best move
                    </Button>
                    <Button onClick={onFlip}>Flip</Button>
                    <CreateGameButton />
                    <div className="py-4">
                        <p>Weiß</p>
                        <p className="pb-4">
                            {" "}
                            {capturedPieces.white.map((p, i) => (
                                <span key={i}>{p}</span>
                            ))}
                        </p>
                        <p>Schwarz</p>
                        <p>
                            {capturedPieces.black.map((p, i) => (
                                <span key={i}>{p}</span>
                            ))}
                        </p>
                    </div>
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
