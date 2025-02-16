function getUrl(path: string) {
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

    return `${protocol}://${process.env.API_GATEWAY}/${path}`;
}

export const api = {
    async createGame(
        player1: string,
        player2: string,
        preferredColor: string,
    ): Promise<string> {
        const data = await fetch(getUrl("game"), {
            method: "POST",
            body: JSON.stringify({
                player1,
                player2,
                preferredColor,
            }),
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (!data.ok) {
            throw new Error("Game creation failed");
        }
        if (data.status !== 200) {
            throw new Error("Game creation failed");
        }
        const game = await data.json();
        return game.id;
    },
    async getBoard(gameId: string): Promise<string[]> {
        const data = await fetch(getUrl(`game/${gameId}`));
        if (!data.ok) {
            throw new Error("Game not found");
        }
        if (data.status !== 200) {
            throw new Error("Game not found");
        }
        return await data.json();
    },
};
