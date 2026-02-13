const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || res.statusText);
  }

  return res.json();
}

export const api = {
  createGame: () => request("/games", { method: "POST" }),
  listGames: () => request("/games"),
  getGame: (id: string) => request(`/games/${id}`),
  joinGame: (id: string) => request(`/games/${id}/join`, { method: "POST" }),
  makeMove: (id: string, mv: string, secret: string) =>
    request(`/games/${id}/moves`, {
      method: "POST",
      body: JSON.stringify({ move: mv, secret }),
    }),
};
