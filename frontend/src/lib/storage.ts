const SECRETS_KEY = "chess_secrets";

interface GameSecrets {
  [gameId: string]: { secret: string; color: "white" | "black" };
}

function getSecrets(): GameSecrets {
  try {
    const raw = localStorage.getItem(SECRETS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveSecret(
  gameId: string,
  secret: string,
  color: "white" | "black",
) {
  const secrets = getSecrets();
  secrets[gameId] = { secret, color };
  localStorage.setItem(SECRETS_KEY, JSON.stringify(secrets));
}

export function getSecret(
  gameId: string,
): { secret: string; color: "white" | "black" } | null {
  const secrets = getSecrets();
  return secrets[gameId] ?? null;
}
