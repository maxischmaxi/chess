"use client";

import { createContext, useEffect, useRef } from "react";

type EventDetailMap = {
    bestMove: { from: string; to: string };
    ready: undefined;
    score: { cp: number };
};

type IUseStockfish = {
    calcBestMove(fen: string): void;
    newGame(): void;
    addEventListener<T extends keyof EventDetailMap>(
        type: T,
        listener: (event: EventDetailMap[T]) => void,
    ): void;
    removeEventListener<K extends keyof EventDetailMap>(
        type: K,
        listener: (event: EventDetailMap[K]) => void,
    ): void;
};

type ListenerMap = {
    [K in keyof EventDetailMap]: Array<(event: EventDetailMap[K]) => void>;
};

export const StockfishContext = createContext<IUseStockfish>({
    calcBestMove() {},
    removeEventListener() {},
    addEventListener() {},
    newGame() {},
});

export function StockfishProvider({ children }: { children: React.ReactNode }) {
    const workerRef = useRef<Worker | null>(null);
    const listeners = useRef<ListenerMap>({
        score: [],
        ready: [],
        bestMove: [],
    });

    useEffect(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
        }

        const worker = new Worker("/stockfish.js");
        workerRef.current = worker;

        worker.onmessage = function (event: MessageEvent) {
            if (event.data === "readyok") {
                for (const listener of listeners.current.ready || []) {
                    listener(undefined);
                }
            }

            const bestMoveMatch = event.data.match(/bestmove\s+(\S+)/);
            if (bestMoveMatch) {
                const from = bestMoveMatch[1].slice(0, 2);
                const to = bestMoveMatch[1].slice(2, 4);

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
        workerRef.current.postMessage("go depth 10");
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

    function newGame() {
        if (!workerRef.current) {
            return;
        }

        workerRef.current.postMessage("ucinewgame");
        workerRef.current.postMessage("isready");
    }

    return (
        <StockfishContext.Provider
            value={{
                newGame,
                calcBestMove,
                addEventListener,
                removeEventListener,
            }}
        >
            {children}
        </StockfishContext.Provider>
    );
}
