import { parsePokemonDto, parsePokemonList } from "../../shared/pokemon.js";
import type { PokemonPatch } from "../../shared/pokemon.js";

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(path, init);
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof data === "object" && data !== null &&
      "message" in data && typeof data.message === "string"
      ? data.message : `Falha na API: HTTP ${response.status}.`;
    throw new Error(message);
  }
  return data;
}

export async function listPokemon(signal?: AbortSignal) {
  const options: RequestInit = signal ? { signal } : {};
  return parsePokemonList(await request("/api/pokemon", options));
}

export async function updatePokemon(id: number, patch: PokemonPatch) {
  return parsePokemonDto(await request(`/api/pokemon/${id}`, {
    method: "PATCH", headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  }));
}

// O retorno real da função é a fonte, sem duplicar um tipo de lista.
export type LoadedTeam = Awaited<ReturnType<typeof listPokemon>>;
