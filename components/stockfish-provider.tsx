"use client";

import { createContext, useEffect, useRef, useState } from "react";

type IUseStockfish = {
    calcBestMove(fen: string): void;
    workerIndicator: string;
    addEventListener(
        type: "bestMove",
        listener: (event: CustomEvent) => void,
    ): void;
    removeEventListener(
        type: "bestMove",
        listener: (event: CustomEvent) => void,
    ): void;
};

export const StockfishContext = createContext<IUseStockfish>({
    calcBestMove() {},
    workerIndicator: "",
    removeEventListener() {},
    addEventListener() {},
});

let eventListeners: Record<string, ((event: CustomEvent) => void)[]> = {};

export function StockfishProvider({ children }: { children: React.ReactNode }) {
    const workerRef = useRef<Worker | null>(null);
    const [workerIndicator, setWorkerIndicator] = useState<string>("");

    useEffect(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
        }

        const worker = new Worker("/api/stockfish");
        workerRef.current = worker;

        worker.onmessage = function (event: MessageEvent) {
            const line = event.data ? event.data : event;

            if (String(line).startsWith("Stockfish")) {
                setWorkerIndicator("Stockfish ready");
            }

            const bestMoveMatch = line.match(/bestmove\s+(\S+)/);
            if (bestMoveMatch) {
                const from = bestMoveMatch[1].slice(0, 2);
                const to = bestMoveMatch[1].slice(2, 4);

                for (const listener of eventListeners["bestMove"] || []) {
                    listener(
                        new CustomEvent("bestMove", { detail: { from, to } }),
                    );
                }
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

            workerRef.current = null;
        };
    }, []);

    function calcBestMove(fen: string) {
        if (!workerRef.current) {
            return;
        }

        workerRef.current.postMessage(`position fen ${fen}`);
        workerRef.current.postMessage("go depth 15");
    }

    function addEventListener(
        type: "bestMove",
        listener: (event: CustomEvent) => void,
    ) {
        eventListeners = {
            ...eventListeners,
            [type]: [...(eventListeners[type] || []), listener],
        };
    }

    function removeEventListener(
        type: "bestMove",
        listener: (event: CustomEvent) => void,
    ) {
        eventListeners = {
            ...eventListeners,
            [type]: (eventListeners[type] || []).filter((l) => l !== listener),
        };
    }

    return (
        <StockfishContext.Provider
            value={{
                calcBestMove,
                workerIndicator,
                addEventListener,
                removeEventListener,
            }}
        >
            {children}
        </StockfishContext.Provider>
    );
}
