import type { PokemonDto, PokemonPatch } from "../shared/pokemon.js";

export function applyPatch(pokemon: PokemonDto, patch: PokemonPatch): PokemonDto {
  return { ...pokemon, ...patch };
}

export function getProperty<T, K extends keyof T>(object: T, key: K): T[K] {
  return object[key];
}

// TODO 3: case "empty": return <p>Seu time está vazio.</p>;
// Também trate data.length === 0 ao converter a resposta para estado.
// TODO 4: um cliente externo não executa o compilador do servidor.
// parsePokemonPatch rejeita a chave id e a API responde HTTP 400.
