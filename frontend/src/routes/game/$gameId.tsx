import { createFileRoute } from "@tanstack/react-router";
import React, { useCallback, useState, useRef } from "react";
import { useGame, useJoinGame } from "@/api/hooks";
import { useGameWebSocket } from "@/hooks/useGameWebSocket";
import { ChessBoard } from "@/components/ChessBoard";
import { GameInfo } from "@/components/GameInfo";
import { MoveHistory } from "@/components/MoveHistory";
import { getSecret } from "@/lib/storage";
import { fenTurn, applyLocalMove } from "@/lib/chess";
import type { ServerMessage } from "@/api/types";

export const Route = createFileRoute("/game/$gameId")({
  component: GamePage,
});

function GamePage() {
  const { gameId } = Route.useParams();
  const { data: initialGame } = useGame(gameId);
  const joinGame = useJoinGame();

  // Server-confirmed state
  const [serverFen, setServerFen] = useState(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  );
  const [moves, setMoves] = useState<string[]>([]);
  const [status, setStatus] = useState("waiting");
  const [result, setResult] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{
    from: string;
    to: string;
  } | null>(null);

  // Optimistic state: applied immediately on move, cleared on server confirm
  const [optimisticFen, setOptimisticFen] = useState<string | null>(null);
  const [optimisticLastMove, setOptimisticLastMove] = useState<{
    from: string;
    to: string;
  } | null>(null);

  const initializedRef = useRef(false);
  const playerInfo = getSecret(gameId);

  const onMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case "game_state":
          setServerFen(msg.fen);
          setMoves(msg.moves);
          setStatus(msg.status);
          setResult(msg.result);
          setLegalMoves(msg.legal_moves);
          initializedRef.current = true;
          break;
        case "move_made":
          // Server confirmed — clear optimistic state, apply real state
          setOptimisticFen(null);
          setOptimisticLastMove(null);
          setServerFen(msg.fen);
          setMoves(msg.moves);
          setStatus(msg.status);
          setResult(msg.result);
          setLegalMoves(msg.legal_moves);
          setLastMove({
            from: msg.move.substring(0, 2),
            to: msg.move.substring(2, 4),
          });
          break;
        case "player_joined":
          setStatus(msg.status);
          setServerFen(msg.fen);
          setLegalMoves(msg.legal_moves);
          break;
        case "game_over":
          setOptimisticFen(null);
          setOptimisticLastMove(null);
          setStatus(msg.status);
          setResult(msg.result);
          setLegalMoves([]);
          break;
        case "error":
          // Rollback optimistic state on error
          setOptimisticFen(null);
          setOptimisticLastMove(null);
          console.error("Game error:", msg.message);
          break;
      }
    },
    [status],
  );

  const { sendMessage, connected } = useGameWebSocket({
    gameId,
    onMessage,
  });

  // Sync initial game data from REST response
  const initialGameId = initialGame?.id;
  const initialGameFen = initialGame?.fen;
  const initialGameMoves = initialGame?.moves;
  const initialGameStatus = initialGame?.status;
  const initialGameResult = initialGame?.result;

  React.useEffect(() => {
    if (initialGameFen && !initializedRef.current) {
      initializedRef.current = true;
      setServerFen(initialGameFen);
      setMoves(initialGameMoves ?? []);
      setStatus(initialGameStatus ?? "waiting");
      setResult(initialGameResult ?? null);
    }
  }, [initialGameId, initialGameFen, initialGameMoves, initialGameStatus, initialGameResult]);

  // Display state: optimistic if pending, otherwise server-confirmed
  const displayFen = optimisticFen ?? serverFen;
  const displayLastMove = optimisticLastMove ?? lastMove;

  const turn = fenTurn(displayFen);
  const myColor = playerInfo?.color ?? null;
  const flipped = myColor === "black";

  // Can't move if we have a pending optimistic move (waiting for server)
  const isMyTurn =
    optimisticFen === null &&
    myColor !== null &&
    status === "active" &&
    ((turn === "w" && myColor === "white") ||
      (turn === "b" && myColor === "black"));

  const handleMove = useCallback(
    (from: string, to: string) => {
      if (!playerInfo) return;
      const uciMove = from + to;

      // Apply optimistically: update board + FEN locally
      const { fen: newFen } = applyLocalMove(serverFen, uciMove);
      setOptimisticFen(newFen);
      setOptimisticLastMove({ from, to: to.substring(0, 2) });

      // Send to server
      sendMessage({
        type: "make_move",
        move: uciMove,
        secret: playerInfo.secret,
      });
    },
    [playerInfo, sendMessage, serverFen],
  );

  const handleResign = useCallback(() => {
    if (!playerInfo) return;
    if (!window.confirm("Are you sure you want to resign?")) return;
    sendMessage({
      type: "resign",
      secret: playerInfo.secret,
    });
  }, [playerInfo, sendMessage]);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      {status === "waiting" && !playerInfo && (
        <div
          style={{
            padding: 16,
            background: "#16213e",
            borderRadius: 8,
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          <p style={{ color: "#e0e0e0", marginBottom: 12 }}>
            This game is waiting for a second player.
          </p>
          <button
            onClick={() => joinGame.mutate(gameId)}
            disabled={joinGame.isPending}
            style={{
              padding: "8px 24px",
              background: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            {joinGame.isPending ? "Joining..." : "Join as Black"}
          </button>
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 24,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <ChessBoard
          fen={displayFen}
          legalMoves={legalMoves}
          lastMove={displayLastMove}
          flipped={flipped}
          isMyTurn={isMyTurn}
          onMove={handleMove}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <GameInfo
            status={status}
            result={result}
            turn={turn}
            myColor={myColor}
            connected={connected}
            onResign={handleResign}
          />
          <MoveHistory moves={moves} />
        </div>
      </div>
    </div>
  );
}
