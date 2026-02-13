import type { Game } from "@/api/types";

interface GameCardProps {
  game: Game;
  onClick: () => void;
}

export function GameCard({ game, onClick }: GameCardProps) {
  const statusColors: Record<string, string> = {
    waiting: "#ff9800",
    active: "#4caf50",
    checkmate: "#f44336",
    stalemate: "#9e9e9e",
    draw: "#9e9e9e",
    resigned: "#f44336",
  };

  return (
    <div
      onClick={onClick}
      style={{
        padding: 16,
        background: "#16213e",
        borderRadius: 8,
        cursor: "pointer",
        border: "1px solid #2a2a4a",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#4a4a8a")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2a2a4a")}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontFamily: "monospace", fontSize: 12, color: "#888" }}>
          {game.id.substring(0, 8)}
        </span>
        <span
          style={{
            padding: "2px 8px",
            borderRadius: 4,
            fontSize: 12,
            fontWeight: "bold",
            background: `${statusColors[game.status] ?? "#9e9e9e"}22`,
            color: statusColors[game.status] ?? "#9e9e9e",
          }}
        >
          {game.status}
        </span>
      </div>
      <div style={{ color: "#e0e0e0", fontSize: 14 }}>
        {game.moves.length} move{game.moves.length !== 1 ? "s" : ""}
        {game.status === "waiting" && !game.has_black && " — waiting for opponent"}
      </div>
    </div>
  );
}
