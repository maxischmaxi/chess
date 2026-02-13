import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useGames, useJoinGame } from "@/api/hooks";
import { GameCard } from "@/components/GameCard";
import { CreateGameButton } from "@/components/CreateGameButton";
import { getSecret } from "@/lib/storage";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { data: games, isLoading } = useGames();
  const joinGame = useJoinGame();
  const navigate = useNavigate();

  function handleGameClick(gameId: string, status: string, hasBlack: boolean) {
    const secret = getSecret(gameId);
    if (secret) {
      navigate({ to: "/game/$gameId", params: { gameId } });
      return;
    }

    if (status === "waiting" && !hasBlack) {
      joinGame.mutate(gameId, {
        onSuccess: (data) => {
          navigate({ to: "/game/$gameId", params: { gameId: data.id } });
        },
      });
    } else {
      navigate({ to: "/game/$gameId", params: { gameId } });
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h1 style={{ color: "#e0e0e0" }}>Games</h1>
        <CreateGameButton />
      </div>

      {isLoading && <div style={{ color: "#888" }}>Loading games...</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {games?.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onClick={() =>
              handleGameClick(game.id, game.status, game.has_black)
            }
          />
        ))}
        {games?.length === 0 && (
          <div style={{ color: "#888", textAlign: "center", padding: 40 }}>
            No games yet. Create one to get started!
          </div>
        )}
      </div>
    </div>
  );
}
