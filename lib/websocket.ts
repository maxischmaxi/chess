"use client";

import { WebsocketMessage } from "./definitions";
import { sleep } from "./utils";

type WebsocketDetailMap = {
    onMove: string;
    onAgainst: { id: string; color: "w" | "b" };
    onConnect: undefined;
    onDisconnect: undefined;
    onClose: undefined;
    onError: { message: string };
    onHello: { id: string };
};

type WebsocketListenerMap = {
    [K in keyof WebsocketDetailMap]: Array<
        (event: WebsocketDetailMap[K]) => void
    >;
};

const protocol = process.env.NODE_ENV === "development" ? "ws" : "wss";
const baseUrl = `${protocol}://${process.env.NEXT_PUBLIC_API_GATEWAY}/ws`;
const socket = new WebSocket(
    `${baseUrl}?id=${localStorage.getItem("id") || ""}`,
);
let listeners: WebsocketListenerMap = {
    onMove: [],
    onConnect: [],
    onDisconnect: [],
    onError: [],
    onClose: [],
    onAgainst: [],
    onHello: [],
};

socket.onopen = () => {
    listeners.onConnect.forEach((listener) => listener(undefined));
};

socket.onclose = () => {
    listeners.onDisconnect.forEach((listener) => listener(undefined));
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
socket.onerror = (event: any) => {
    const message = event.message || "An error occurred";
    listeners.onError.forEach((listener) => listener({ message }));
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const type = data.type;
    if (!type) return;

    const payload = JSON.parse(data.payload);
    if (!payload) {
        return;
    }

    switch (type) {
        case "against": {
            const { id, color } = payload;
            listeners.onAgainst.forEach((listener) => listener({ id, color }));
            break;
        }
        case "hello": {
            const { id } = payload;
            listeners.onHello.forEach((listener) => listener({ id }));
            break;
        }
        case "move": {
            const { move } = payload;
            listeners.onMove.forEach((listener) => listener(move));
            break;
        }
        default:
            break;
    }
};

export const sendMove = async (
    gameId: string,
    move: string,
    color: "w" | "b",
) => {
    await sleep(1000);

    const message: WebsocketMessage = {
        type: "move",
        payload: JSON.stringify({ gameId, color, move }),
    };

    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
    }
};

export function addWebsocketListener<K extends keyof WebsocketDetailMap>(
    type: K,
    listener: (event: WebsocketDetailMap[K]) => void,
) {
    listeners = {
        ...listeners,
        [type]: [...(listeners[type] || []), listener],
    };
}

export function removeWebsocketListener<K extends keyof WebsocketDetailMap>(
    type: K,
    listener: (event: WebsocketDetailMap[K]) => void,
) {
    listeners = {
        ...listeners,
        [type]: (listeners[type] || []).filter((l) => l !== listener),
    };
}

export const sayHello = (gameId: string) => {
    const message: WebsocketMessage = {
        type: "join",
        payload: JSON.stringify({ gameId }),
    };

    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
    }
};
