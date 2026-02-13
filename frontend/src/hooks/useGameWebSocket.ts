import { useEffect, useRef, useCallback, useState } from "react";
import type { ServerMessage, ClientMessage } from "@/api/types";

interface UseGameWebSocketOptions {
  gameId: string;
  onMessage: (msg: ServerMessage) => void;
}

export function useGameWebSocket({
  gameId,
  onMessage,
}: UseGameWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  const [connected, setConnected] = useState(false);
  onMessageRef.current = onMessage;

  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout>;
    let attempts = 0;
    let disposed = false;

    function connect() {
      if (disposed) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(
        `${protocol}//${window.location.host}/ws/games/${gameId}`,
      );
      wsRef.current = ws;

      ws.onopen = () => {
        attempts = 0;
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg: ServerMessage = JSON.parse(event.data);
          onMessageRef.current(msg);
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (!disposed) {
          const delay = Math.min(1000 * 2 ** attempts, 10000);
          attempts++;
          reconnectTimeout = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      disposed = true;
      clearTimeout(reconnectTimeout);
      wsRef.current?.close();
    };
  }, [gameId]);

  const sendMessage = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { sendMessage, connected };
}
