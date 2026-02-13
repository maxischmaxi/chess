import { useCreateGame } from "@/api/hooks";
import { useNavigate } from "@tanstack/react-router";

export function CreateGameButton() {
  const createGame = useCreateGame();
  const navigate = useNavigate();

  return (
    <button
      onClick={() => {
        createGame.mutate(undefined, {
          onSuccess: (data) => {
            navigate({ to: "/game/$gameId", params: { gameId: data.id } });
          },
        });
      }}
      disabled={createGame.isPending}
      style={{
        padding: "12px 24px",
        background: "#4caf50",
        color: "white",
        border: "none",
        borderRadius: 8,
        cursor: createGame.isPending ? "not-allowed" : "pointer",
        fontSize: 16,
        fontWeight: "bold",
      }}
    >
      {createGame.isPending ? "Creating..." : "New Game"}
    </button>
  );
}
