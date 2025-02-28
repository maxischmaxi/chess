"use client";

import { Chess, Move } from "chess.js";
import {
    ActivePiece,
    CHESSBOARD_SIZE,
    ChessImages,
    defaultChessImages,
    LocalGame,
} from "@/lib/definitions";
import { cleanup, init } from "@/lib/render";
import {
    MouseEvent as ReactMouseEvent,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { WinProbability } from "./winprobabilty";
import { play } from "./audio-provider";
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
import {
    addWebsocketListener,
    removeWebsocketListener,
    sendMove,
} from "@/lib/websocket";
import {
    addOutcomeListener,
    addScoreListener,
    getBestMove,
    removeOutcomeListener,
    removeScoreListener,
} from "@/lib/stockfish";
import { useParams } from "next/navigation";

export const chess = new Chess();
export let mouseDown = false;
export let isFocused = true;
export let selectedFields: { row: number; col: number }[] = [];
export let activePiece: ActivePiece | null = null;
export let boardSize: number = 0;
export let mouseX = 0;
export let mouseY = 0;
export let iAm: "w" | "b" = "w";
export let flipped = false;
export let moveBuffer: string[] = [];
export let images: ChessImages = defaultChessImages;
export let imagesReady = false;

const pieces = ["pawn", "knight", "bishop", "rook", "queen", "king"];
const colors = ["w", "b"];

let imagesToLoad = pieces.length * colors.length;
let mouseDownX = 0;
let mouseDownY = 0;

for (let i = 0; i < pieces.length; i++) {
    for (let x = 0; x < colors.length; x++) {
        const img = new Image();
        img.src = `/pieces/${pieces[i]}-${colors[x]}.svg`;

        img.onload = () => {
            imagesToLoad--;
            const key = `${pieces[i]}-${colors[x]}` as keyof ChessImages;
            images = { ...images, [key]: img };

            if (imagesToLoad === 0) {
                imagesReady = true;
            }
        };
    }
}

type Props = {
    fens?: string[];
    againstAi: boolean;
};

export function getBoard() {
    if (iAm === "b") {
        return chess
            .board()
            .reverse()
            .map((row) => row.reverse());
    }
    return chess.board();
}

const loadLocalGames = (): Array<LocalGame> => {
    const localGames = JSON.parse(localStorage.getItem("games") || "[]");

    if (!Array.isArray(localGames)) {
        localStorage.setItem("games", "[]");
        return [];
    }

    return localGames;
};

export const saveLocalGame = (gameId: string): void => {
    const localGames = loadLocalGames();
    for (let i = 0; i < localGames.length; i++) {
        const game = localGames[i];
        if (game.id === gameId) {
            const fen = chess.fen();
            game.fen = fen;
            const moves = chess.history({ verbose: true });
            game.moves = moves.map((m) => m.lan);

            localStorage.setItem("games", JSON.stringify(localGames));
            return;
        }
    }
};

export const playSound = (move: Move) => {
    if (move.isPromotion()) {
        if (chess.isCheck() || chess.isCheckmate()) {
            play("move-check");
        } else {
            play("promotion");
        }
        return;
    }

    if (move.isKingsideCastle() || move.isQueensideCastle()) {
        if (chess.isCheck() || chess.isCheckmate()) {
            play("move-check");
        } else {
            play("castle");
        }
        return;
    }

    if (move.isCapture()) {
        if (chess.isCheck() || chess.isCheckmate()) {
            play("move-check");
        } else {
            play("capture");
        }
        return;
    }

    if (chess.isCheck() || chess.isCheckmate()) {
        play("move-check");
        return;
    }

    play("move-self");
};

export function Chessboard(props: Props) {
    const [score, setScore] = useState(0);
    const [winner, setWinner] = useState<string | null>(null);
    const [outcome, setOutcome] = useState<string | null>(null);
    const board = useRef<HTMLDivElement>(null);
    const game = useRef<HTMLDivElement>(null);
    const eventCanvas = useRef<HTMLCanvasElement>(null);
    const { gameId = "" } = useParams() as { gameId: string };

    useEffect(() => {
        function onSize() {
            if (!board.current) return;
            if (!game.current) return;

            const width = window.innerWidth;
            const height = window.innerHeight - 32;

            const boardWidth = board.current.clientWidth;
            const gameHeight = game.current.clientHeight;

            boardSize = Math.min(width, height, boardWidth, gameHeight);
        }

        function onVisibilityChange() {
            isFocused = document.visibilityState === "visible";
        }

        function onScore(score: number) {
            setScore(score);
        }

        function onOutcome(
            outcome: "win" | "draw" | "loss",
            winner: "w" | "b",
        ) {
            setWinner(winner);
            setOutcome(outcome);
        }

        function onFocusIn() {
            isFocused = true;
        }

        function onFocusOut() {
            isFocused = false;
        }

        onSize();
        onVisibilityChange();

        addScoreListener(onScore);
        window.addEventListener("resize", onSize);
        window.addEventListener("visibilitychange", onVisibilityChange);
        window.addEventListener("blur", onFocusOut);
        window.addEventListener("focus", onFocusIn);
        addOutcomeListener(onOutcome);

        return () => {
            window.removeEventListener("resize", onSize);
            window.removeEventListener("visibilitychange", onVisibilityChange);
            window.removeEventListener("blur", onFocusOut);
            window.removeEventListener("focus", onFocusIn);
            removeScoreListener(onScore);
            removeOutcomeListener(onOutcome);
        };
    }, []);

    useEffect(() => {
        init();

        return () => {
            cleanup();
        };
    }, []);

    useEffect(() => {
        function onMove(serverMove: string) {
            for (const move of chess.moves({ verbose: true })) {
                if (move.lan === serverMove) {
                    chess.move(move);
                    playSound(move);
                    return;
                }
            }
        }

        function onAgainst({ id, color }: { id: string; color: "w" | "b" }) {
            if (id === "ai") {
                if (chess.turn() !== iAm) {
                    getBestMove(gameId, props.againstAi, chess.turn(), iAm);
                }
            }

            if (color === "w") {
                iAm = "b";
            } else {
                iAm = "w";
            }
        }

        function onHello({ id }: { id: string }) {
            localStorage.setItem("id", id);
        }

        addWebsocketListener("onMove", onMove);
        addWebsocketListener("onAgainst", onAgainst);
        addWebsocketListener("onHello", onHello);

        return () => {
            removeWebsocketListener("onMove", onMove);
            removeWebsocketListener("onAgainst", onAgainst);
            removeWebsocketListener("onHello", onHello);
        };
    }, [props.againstAi, gameId]);

    useEffect(() => {
        if (props.againstAi) {
            const localGames = loadLocalGames();

            for (let i = 0; i < localGames.length; i++) {
                const game = localGames[i];
                if (game.id === gameId) {
                    iAm = game.color;
                    chess.load(
                        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                    );

                    for (let i = 0; i < game.moves.length; i++) {
                        chess.move(game.moves[i]);
                    }

                    if (game.moves.length === 0) {
                        play("game-start");
                    }

                    if (iAm !== chess.turn()) {
                        getBestMove(gameId, props.againstAi, chess.turn(), iAm);
                    }

                    if (chess.isGameOver()) {
                        const result = chess.isCheckmate()
                            ? "Checkmate!"
                            : "Stalemate!";
                        const winner = chess.turn() === "w" ? "b" : "w";
                        setWinner(winner);
                        setOutcome(result);
                    }

                    return;
                }
            }
        }
    }, [props.againstAi, gameId]);

    const onMouseDown = useCallback((event: ReactMouseEvent) => {
        if (event.button !== 0) return;
        if (!eventCanvas.current) return;

        eventCanvas.current.style.cursor = "grabbing";

        mouseDown = true;
        selectedFields = [];

        const rect = eventCanvas.current.getBoundingClientRect();
        const cellSize = rect.width / CHESSBOARD_SIZE;

        mouseX = event.clientX - rect.left;
        mouseY = event.clientY - rect.top;

        mouseDownX = mouseX;
        mouseDownY = mouseY;

        const row = Math.floor(mouseY / cellSize);
        const col = Math.floor(mouseX / cellSize);

        const board = getBoard();

        const piece = board[row][col];

        if (!piece) {
            if (activePiece) {
                const moves = chess.moves({ verbose: true });
                const file = String.fromCharCode(97 + col);
                const rank = 8 - row;
                const move = moves.find(
                    (m) =>
                        m.from === activePiece?.piece.square &&
                        m.to === `${file}${rank}`,
                );
                eventCanvas.current.style.cursor = "grab";
                if (!move) {
                    activePiece = null;
                }
            }

            return;
        }

        const white = piece.color === "w" && iAm === "w";
        const black = piece.color === "b" && iAm === "b";

        if (white || black) {
            const grabX = mouseX - col * cellSize;
            const grabY = mouseY - row * cellSize;

            activePiece = {
                piece,
                row,
                col,
                grabPoint: {
                    x: grabX,
                    y: grabY,
                },
            };
        }
    }, []);

    const onMouseUp = useCallback(
        (event: ReactMouseEvent) => {
            if (!eventCanvas.current) return;
            if (!activePiece) return;
            mouseDown = false;

            eventCanvas.current.style.cursor = "grab";

            const rect = eventCanvas.current.getBoundingClientRect();
            mouseX = event.clientX - rect.left;
            mouseY = event.clientY - rect.top;

            const cellSize = rect.width / CHESSBOARD_SIZE;
            const row = Math.floor(mouseY / cellSize);
            const col = Math.floor(mouseX / cellSize);

            if (mouseDownX == mouseX && mouseDownY == mouseY) {
                const board = getBoard();
                const piece = board[row][col];
                if (piece) {
                    activePiece = {
                        row,
                        col,
                        piece,
                        grabPoint: {
                            x: 0,
                            y: 0,
                        },
                    };
                    return;
                }
            }

            if (activePiece.row === row && activePiece.col === col) {
                activePiece = null;
                return;
            }

            const player = chess.turn();
            const moves = chess.moves();

            if (moves.length === 0) {
                activePiece = null;
                return;
            }

            const white = activePiece.piece.color === "w" && player === "w";
            const black = activePiece.piece.color === "b" && player === "b";

            if (white || black) {
                let currentPiecePosition: string;
                if (iAm === "w") {
                    currentPiecePosition = `${String.fromCharCode(
                        97 + activePiece.col,
                    )}${8 - activePiece.row}${String.fromCharCode(
                        97 + col,
                    )}${8 - row}`;
                } else {
                    currentPiecePosition = `${String.fromCharCode(
                        104 - activePiece.col,
                    )}${activePiece.row + 1}${String.fromCharCode(
                        104 - col,
                    )}${row + 1}`;
                }

                const moves = chess.moves({ verbose: true });
                const move = moves.find(
                    (m) => m.from + m.to === currentPiecePosition,
                );

                if (!move) {
                    moveBuffer = [...moveBuffer, currentPiecePosition];
                    activePiece = null;
                    return;
                }

                chess.move(move);
                playSound(move);

                if (!props.againstAi) {
                    sendMove(gameId, move.lan, player);
                } else {
                    saveLocalGame(gameId);
                }

                if (chess.isGameOver()) {
                    const result = chess.isCheckmate()
                        ? "Checkmate!"
                        : "Stalemate!";
                    const winner = chess.turn() === "w" ? "b" : "w";
                    setWinner(winner);
                    setOutcome(result);
                }

                if (props.againstAi) {
                    getBestMove(gameId, props.againstAi, player, iAm);
                }

                activePiece = null;
            }
        },
        [props.againstAi, gameId],
    );

    const onMouseMove = useCallback((event: ReactMouseEvent) => {
        if (!eventCanvas.current) return;
        const rect = eventCanvas.current.getBoundingClientRect();
        mouseX = event.clientX - rect.left;
        mouseY = event.clientY - rect.top;
    }, []);

    const onContextMenu = useCallback((event: ReactMouseEvent) => {
        if (!eventCanvas.current) return;
        event.preventDefault();
        const rect = eventCanvas.current.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const cellSize = rect.width / CHESSBOARD_SIZE;
        const row = Math.floor(mouseY / cellSize);
        const col = Math.floor(mouseX / cellSize);

        const index = selectedFields.findIndex(
            (f) => f.row === row && f.col === col,
        );

        if (index === -1) {
            selectedFields = [...selectedFields, { row, col }];
            return;
        }

        selectedFields = selectedFields.filter(
            (f) => f.row !== row || f.col !== col,
        );
    }, []);

    const onFlip = useCallback(() => {
        flipped = !flipped;
    }, []);

    return (
        <main className="w-screen h-screen p-8">
            <div
                className="flex flex-col lg:flex-row flex-nowrap gap-4 w-full h-full"
                ref={game}
            >
                <WinProbability score={score} />
                <div className="GameBoard" ref={board}>
                    <canvas
                        style={{ zIndex: 1 }}
                        width={boardSize}
                        height={boardSize}
                        id="base-canvas"
                    />
                    <canvas
                        width={boardSize}
                        height={boardSize}
                        style={{ zIndex: 2 }}
                        id="move-canvas"
                    />
                    <canvas
                        ref={eventCanvas}
                        onMouseDown={onMouseDown}
                        onMouseUp={onMouseUp}
                        onMouseMove={onMouseMove}
                        width={boardSize}
                        height={boardSize}
                        style={{ zIndex: 3, cursor: "grab" }}
                        onContextMenu={onContextMenu}
                        id="event-canvas"
                    />
                </div>
                <div className="flex flex-col-reverse lg:flex-col gap-4">
                    <Button
                        onClick={() =>
                            getBestMove(
                                gameId,
                                props.againstAi,
                                chess.turn(),
                                iAm,
                            )
                        }
                    >
                        Calculate best move
                    </Button>
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
