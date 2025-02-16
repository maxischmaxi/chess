import { useEffect, useRef, useState } from "react";

type EventDetailMap = {
    bestMove: { from: string; to: string };
    score: { cp: number };
};

type ListenerMap = {
    [K in keyof EventDetailMap]: Array<(event: EventDetailMap[K]) => void>;
};

export function useStockfish() {
    const workerRef = useRef<Worker | null>(null);
    const listeners = useRef<ListenerMap>({
        score: [],
        bestMove: [],
    });
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
        }

        const worker = new Worker("/stockfish.js");
        workerRef.current = worker;

        worker.onmessage = function (event: MessageEvent) {
            if (event.data === "readyok") {
                setReady(true);
            }

            const bestMoveMatch = event.data.match(/bestmove\s+(\S+)/);
            if (bestMoveMatch) {
                const from = bestMoveMatch[1].slice(0, 2);
                const to = bestMoveMatch[1].slice(2, bestMoveMatch[1].length);

                for (const listener of listeners.current.bestMove || []) {
                    listener({ from, to });
                }
            }

            const scoreMatch = event.data.match(/score cp (-?\d+)/);
            if (scoreMatch) {
                for (const listener of listeners.current.score || []) {
                    listener({ cp: parseInt(scoreMatch[1]) });
                }
            }
        };

        worker.postMessage("uci");
        worker.postMessage("ucinewgame");
        worker.postMessage("isready");

        return () => {
            if (typeof worker.terminate === "function") {
                worker.terminate();
            }

            workerRef.current = null;
        };
    }, []);

    function calcBestMove(fen: string) {
        if (!workerRef.current) {
            return;
        }

        workerRef.current.postMessage(`position fen ${fen}`);
        workerRef.current.postMessage("go depth 1");
    }

    function addEventListener<K extends keyof EventDetailMap>(
        type: K,
        listener: (event: EventDetailMap[K]) => void,
    ) {
        listeners.current = {
            ...listeners.current,
            [type]: [...(listeners.current[type] || []), listener],
        };
    }

    function removeEventListener<K extends keyof EventDetailMap>(
        type: K,
        listener: (event: EventDetailMap[K]) => void,
    ) {
        listeners.current = {
            ...listeners.current,
            [type]: (listeners.current[type] || []).filter(
                (l) => l !== listener,
            ),
        };
    }

    return {
        calcBestMove,
        addEventListener,
        removeEventListener,
        ready,
    };
}
