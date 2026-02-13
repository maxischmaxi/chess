import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type { Game, GameWithSecret } from "./types";
import { saveSecret } from "@/lib/storage";

export function useGames() {
  return useQuery<Game[]>({
    queryKey: ["games"],
    queryFn: () => api.listGames() as Promise<Game[]>,
    refetchInterval: 5000,
  });
}

export function useGame(id: string) {
  return useQuery<Game>({
    queryKey: ["game", id],
    queryFn: () => api.getGame(id) as Promise<Game>,
  });
}

export function useCreateGame() {
  const queryClient = useQueryClient();
  return useMutation<GameWithSecret>({
    mutationFn: () => api.createGame() as Promise<GameWithSecret>,
    onSuccess: (data) => {
      saveSecret(data.id, data.secret, data.color);
      queryClient.invalidateQueries({ queryKey: ["games"] });
    },
  });
}

export function useJoinGame() {
  const queryClient = useQueryClient();
  return useMutation<GameWithSecret, Error, string>({
    mutationFn: (id) => api.joinGame(id) as Promise<GameWithSecret>,
    onSuccess: (data) => {
      saveSecret(data.id, data.secret, data.color);
      queryClient.invalidateQueries({ queryKey: ["games"] });
      queryClient.invalidateQueries({ queryKey: ["game", data.id] });
    },
  });
}
