import { chess, playSound, saveLocalGame } from "@/components/chessboard";
import { render } from "./render";
import { sendMove } from "./websocket";
import { evaluationToWinProbability } from "./utils";

const worker = new window.Worker("/stockfish.js");
let aiShouldMove = false;
let againstAi = false;
let gameId = "";
let player: "w" | "b" = "w";
let iAm: "w" | "b" = "w";
let scoreListeners: ((score: number) => void)[] = [];
let outcomeListeners: ((
    outcome: "win" | "draw" | "loss",
    winner: "w" | "b",
) => void)[] = [];

worker.addEventListener("message", (event) => {
    const readyMatch = event.data.match(/readyok/);
    if (readyMatch) {
        if (aiShouldMove) {
            worker.postMessage(`position fen ${chess.fen()}`);
            worker.postMessage("go depth 15");
            return;
        }
    }

    const moveMatch = event.data.match(/bestmove (\w+)/);
    if (moveMatch && aiShouldMove) {
        aiShouldMove = false;
        const move = chess.move(moveMatch[1]);
        playSound(move);
        requestAnimationFrame(render);

        if (!againstAi && player !== iAm) {
            sendMove(gameId, move.lan, player);
        } else {
            saveLocalGame(gameId);
        }

        if (chess.isGameOver()) {
            const outcome = chess.isDraw()
                ? "draw"
                : chess.isCheckmate()
                  ? "loss"
                  : "win";
            const winner = chess.turn() === "w" ? "b" : "w";
            outcomeListeners.forEach((listener) => listener(outcome, winner));
        }
    }

    const scoreMatch = event.data.match(/score cp (-?\d+)/);
    if (scoreMatch) {
        const score = parseInt(scoreMatch[1], 10);
        scoreListeners.forEach((listener) =>
            listener(evaluationToWinProbability(score)),
        );
    }
});

export function addOutcomeListener(
    listener: (outcome: "win" | "draw" | "loss", winner: "w" | "b") => void,
) {
    outcomeListeners.push(listener);
}

export function removeOutcomeListener(
    listener: (outcome: "win" | "draw" | "loss", winner: "w" | "b") => void,
) {
    outcomeListeners = outcomeListeners.filter((l) => l !== listener);
}

export function addScoreListener(listener: (score: number) => void) {
    scoreListeners.push(listener);
}

export function removeScoreListener(listener: (score: number) => void) {
    scoreListeners = scoreListeners.filter((l) => l !== listener);
}

export const getBestMove = (
    _gameId: string,
    _againstAi: boolean,
    _player: "w" | "b",
    _iAm: "w" | "b",
): void => {
    aiShouldMove = false;
    gameId = _gameId;
    againstAi = _againstAi;
    player = _player;
    iAm = _iAm;

    worker.postMessage("stop");
    worker.postMessage("ucinewgame");
    worker.postMessage("isready");
    aiShouldMove = true;
};
