interface GameInfoProps {
  status: string;
  result: string | null;
  turn: "w" | "b";
  myColor: "white" | "black" | null;
  connected: boolean;
  onResign: () => void;
}

export function GameInfo({
  status,
  result,
  turn,
  myColor,
  connected,
  onResign,
}: GameInfoProps) {
  const isActive = status === "active";
  const isWaiting = status === "waiting";
  const isOver = !isActive && !isWaiting;

  const turnText = turn === "w" ? "White" : "Black";
  const myTurn = myColor && ((turn === "w" && myColor === "white") || (turn === "b" && myColor === "black"));

  return (
    <div style={{ padding: "16px", background: "#16213e", borderRadius: 8, minWidth: 200 }}>
      <h3 style={{ margin: "0 0 12px", color: "#e0e0e0" }}>Game Info</h3>

      <div style={{ marginBottom: 8 }}>
        <span style={{ color: "#888" }}>Status: </span>
        <span style={{ color: isActive ? "#4caf50" : isWaiting ? "#ff9800" : "#f44336", fontWeight: "bold" }}>
          {status}
        </span>
      </div>

      {isActive && (
        <div style={{ marginBottom: 8 }}>
          <span style={{ color: "#888" }}>Turn: </span>
          <span style={{ fontWeight: "bold", color: myTurn ? "#4caf50" : "#e0e0e0" }}>
            {turnText} {myTurn ? "(You)" : ""}
          </span>
        </div>
      )}

      {myColor && (
        <div style={{ marginBottom: 8 }}>
          <span style={{ color: "#888" }}>Playing as: </span>
          <span style={{ fontWeight: "bold" }}>{myColor}</span>
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <span style={{ color: "#888" }}>Connection: </span>
        <span style={{ color: connected ? "#4caf50" : "#f44336" }}>
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>

      {isOver && result && (
        <div style={{ padding: 12, background: "#1a1a2e", borderRadius: 4, marginBottom: 12, textAlign: "center" }}>
          <div style={{ fontWeight: "bold", fontSize: 18, color: "#ff9800" }}>
            Game Over
          </div>
          <div style={{ color: "#e0e0e0", marginTop: 4 }}>
            {status === "checkmate" && `Checkmate! ${result} wins`}
            {status === "stalemate" && "Stalemate - Draw"}
            {status === "draw" && "Draw"}
            {status === "resigned" && `${result} wins by resignation`}
          </div>
        </div>
      )}

      {isActive && myColor && (
        <button
          onClick={onResign}
          style={{
            width: "100%",
            padding: "8px 16px",
            background: "#c62828",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Resign
        </button>
      )}
    </div>
  );
}
