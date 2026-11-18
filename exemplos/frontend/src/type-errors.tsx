import { PokemonCard } from "./PokemonCard.js";
import type { PokemonDto } from "../../shared/pokemon.js";

// Este módulo não é importado na aplicação. O compilador verifica os exemplos.
export function propsExamples(pokemon: PokemonDto) {
  const readOnly = <PokemonCard mode="view" pokemon={pokemon} />;
  // @ts-expect-error O modo edit exige callback.
  const missingCallback = <PokemonCard mode="edit" pokemon={pokemon} />;
  // @ts-expect-error O modo view proíbe callback.
  const wrongCallback = <PokemonCard mode="view" pokemon={pokemon} onSave={async () => {}} />;
  return { readOnly, missingCallback, wrongCallback };
}
