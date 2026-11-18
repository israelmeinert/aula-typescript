import type { PokemonDto, PokemonPatch } from "../shared/pokemon.js";

// TODO 1: implemente a atualização, mantendo id, name e type.
export function applyPatch(pokemon: PokemonDto, patch: PokemonPatch): PokemonDto {
  void pokemon; void patch;
  throw new Error("TODO: implementar applyPatch");
}

// TODO 2: use a chave K para fazer o retorno depender de T[K].
// Comece escrevendo a assinatura no lugar deste comentário.

// TODO 3: adicione {status:'empty'} à união RemoteData do App.
// Veja assertNever acusar o caso faltante e implemente a renderização.

// TODO 4: envie {id:999} para PATCH pela API. Por que o tipo sozinho não impede?
