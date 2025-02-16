"use client";

import { WebsocketMessage } from "@/lib/definitions";
import { useParams } from "next/navigation";
import { createContext, ReactNode, useEffect, useRef, useState } from "react";

type EventDetailMap = {
    onMove: string;
    onAgainst: { id: string; color: "w" | "b" };
    onPossibleMoves: string[];
    onConnect: undefined;
    onDisconnect: undefined;
    onClose: undefined;
    onError: { message: string };
    onOutcome: { outcome: string; winner: string };
    onCapturedPieces: { white: string[]; black: string[] };
    onShouldStart: undefined;
};

type ListenerMap = {
    [K in keyof EventDetailMap]: Array<(event: EventDetailMap[K]) => void>;
};

type IUseWebsocket = {
    addEventListener<K extends keyof EventDetailMap>(
        event: K,
        listener: (event: EventDetailMap[K]) => void,
    ): void;
    removeEventListener<K extends keyof EventDetailMap>(
        event: K,
        listener: (event: EventDetailMap[K]) => void,
    ): void;
    sendMove(gameId: string, move: string, color: "w" | "b"): void;
};

type WebsocketProviderProps = {
    children?: ReactNode;
};

const protocol = process.env.NODE_ENV === "development" ? "ws" : "wss";
const baseUrl = `${protocol}://${process.env.NEXT_PUBLIC_API_GATEWAY}/ws`;

export const WebsocketContext = createContext<IUseWebsocket>({
    addEventListener() {},
    removeEventListener() {},
    sendMove() {},
});

export function WebsocketProvider({ children }: WebsocketProviderProps) {
    const socket = useRef<WebSocket | null>(null);
    const listeners = useRef<ListenerMap>({
        onMove: [],
        onShouldStart: [],
        onPossibleMoves: [],
        onCapturedPieces: [],
        onOutcome: [],
        onConnect: [],
        onDisconnect: [],
        onError: [],
        onClose: [],
        onAgainst: [],
    });
    const { gameId = "" } = useParams();
    const [connected, setConnected] = useState(false);
    const [gotHello, setGotHello] = useState(false);

    useEffect(() => {
        if (!connected) return;
        if (!gotHello) return;

        if (gameId) {
            const message: WebsocketMessage = {
                type: "join",
                payload: JSON.stringify({ gameId }),
            };

            if (socket.current?.readyState === WebSocket.OPEN) {
                socket.current?.send(JSON.stringify(message));
            }
            return;
        }

        const message: WebsocketMessage = {
            type: "leave",
            payload: "",
        };

        if (socket.current?.readyState === WebSocket.OPEN) {
            socket.current?.send(JSON.stringify(message));
        }
    }, [connected, gameId, gotHello]);

    useEffect(() => {
        console.log("Connecting to websocket");
        socket.current = new WebSocket(
            `${baseUrl}?id=${localStorage.getItem("id") || ""}`,
        );

        socket.current.onopen = () => {
            listeners.current.onConnect.forEach((listener) =>
                listener(undefined),
            );
            setConnected(true);
        };

        socket.current.onclose = () => {
            listeners.current.onDisconnect.forEach((listener) =>
                listener(undefined),
            );
            setConnected(false);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        socket.current.onerror = (event: any) => {
            const message = event.message || "An error occurred";
            listeners.current.onError.forEach((listener) =>
                listener({ message }),
            );
        };

        socket.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const type = data.type;
            if (!type) return;

            const payload = JSON.parse(data.payload);
            if (!payload) {
                return;
            }

            switch (type) {
                case "outcome": {
                    const { outcome, winner } = payload;
                    listeners.current.onOutcome.forEach((listener) =>
                        listener({ outcome, winner }),
                    );
                    break;
                }
                case "possibleMoves": {
                    const { moves } = payload;
                    listeners.current.onPossibleMoves.forEach((listener) =>
                        listener(moves),
                    );
                    break;
                }
                case "against": {
                    const { id, color } = payload;
                    listeners.current.onAgainst.forEach((listener) =>
                        listener({ id, color }),
                    );

                    if (color === "w") {
                        listeners.current.onShouldStart.forEach((listener) =>
                            listener(undefined),
                        );
                    }
                    break;
                }
                case "capturedPieces": {
                    const { white, black } = payload;
                    listeners.current.onCapturedPieces.forEach((listener) =>
                        listener({ white, black }),
                    );
                    break;
                }
                case "hello": {
                    const { id } = payload;
                    localStorage.setItem("id", id);
                    setGotHello(true);

                    break;
                }
                case "move": {
                    const { fen } = payload;
                    listeners.current.onMove.forEach((listener) =>
                        listener(fen),
                    );
                    break;
                }
                default:
                    break;
            }
        };

        return () => {
            socket.current?.close();
        };
    }, []);

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

    function sendMove(gameId: string, move: string, color: "w" | "b") {
        if (!socket.current) return;

        const message: WebsocketMessage = {
            type: "move",
            payload: JSON.stringify({ gameId, color, move }),
        };

        if (socket.current.readyState === WebSocket.OPEN) {
            socket.current?.send(JSON.stringify(message));
        }
    }

    return (
        <WebsocketContext.Provider
            value={{
                addEventListener,
                removeEventListener,
                sendMove,
            }}
        >
            {children}
        </WebsocketContext.Provider>
    );
}
