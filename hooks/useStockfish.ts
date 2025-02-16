import { Chess } from "chess.js";
import { useEffect, useRef } from "react";

export function useStockfish() {
    const worker = useRef<Worker>(null);

    useEffect(() => {
        worker.current = new Worker("/stockfish.js");
        return () => {
            worker.current?.terminate();
        };
    }, []);

    async function getBestMove(chess: Chess): Promise<string> {
        if (!worker.current) {
            return Promise.reject("Worker not ready");
        }

        const fen = chess.fen();
        worker.current.postMessage("stop");
        worker.current.postMessage("ucinewgame");
        worker.current.postMessage("isready");

        await new Promise<void>((resolve, reject) => {
            function onReady(event: MessageEvent) {
                if (event.data.trim() === "readyok") {
                    worker.current?.removeEventListener("message", onReady);
                    resolve();
                }
            }

            worker.current?.addEventListener("message", onReady);

            setTimeout(() => {
                worker.current?.removeEventListener("message", onReady);
                reject("Ready timeout");
            }, 10000);
        });

        worker.current.postMessage(`position fen ${fen}`);
        worker.current.postMessage("go depth 15");

        return new Promise((resolve, reject) => {
            function onMessage(event: MessageEvent) {
                const bestMoveMatch = event.data.match(/bestmove (\w+)/);
                if (bestMoveMatch) {
                    worker.current?.removeEventListener("message", onMessage);
                    resolve(bestMoveMatch[1]);
                }
            }

            worker.current?.addEventListener("message", onMessage);

            setTimeout(() => {
                worker.current?.removeEventListener("message", onMessage);
                reject("onMessage timeout");
            }, 5000);
        });
    }

    async function getScore(chess: Chess): Promise<number> {
        if (!worker.current) {
            return Promise.reject("Worker not ready");
        }

        const fen = chess.fen();
        worker.current.postMessage("stop");
        worker.current.postMessage("ucinewgame");
        worker.current.postMessage("isready");

        await new Promise<void>((resolve, reject) => {
            function onReady(event: MessageEvent) {
                if (event.data.trim() === "readyok") {
                    worker.current?.removeEventListener("message", onReady);
                    resolve();
                }
            }
            worker.current?.addEventListener("message", onReady);

            setTimeout(() => {
                worker.current?.removeEventListener("message", onReady);
                reject("Ready Timeout");
            }, 5000);
        });

        worker.current.postMessage(`position fen ${fen}`);
        worker.current.postMessage("go depth 15");

        return new Promise((resolve, reject) => {
            function onMessage(event: MessageEvent) {
                const scoreMatch = event.data.match(/score cp (-?\d+)/);
                if (scoreMatch) {
                    worker.current?.removeEventListener("message", onMessage);
                    resolve(parseInt(scoreMatch[1], 10));
                }
            }

            worker.current?.addEventListener("message", onMessage);

            setTimeout(() => {
                worker.current?.removeEventListener("message", onMessage);
                reject("OnMessage Timeout");
            }, 5000);
        });
    }

    return {
        getScore,
        getBestMove,
    };
}
