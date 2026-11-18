import { chooseType, getProperty, typeLabels } from "./advanced.js";
import type { PokemonDto, PokemonPatch, PokemonType } from "../shared/pokemon.js";

// Não execute este arquivo. Ele usa erros esperados como documentação verificável.
export function compileTimeExamples(pokemon: PokemonDto) {
  const name: string = getProperty(pokemon, "name");
  const level: number = getProperty(pokemon, "level");
  // @ts-expect-error A propriedade não existe no DTO público.
  getProperty(pokemon, "trainerId");
  // @ts-expect-error PATCH não permite mudar identidade.
  const invalidPatch: PokemonPatch = { id: 25 };
  // @ts-expect-error Ausência é diferente de fornecer undefined.
  const undefinedPatch: PokemonPatch = { nickname: undefined };
  // @ts-expect-error NoInfer impede que initial amplie a união inferida.
  chooseType(["fire", "water"] as const, "dragon");
  // @ts-expect-error O mapa deve cobrir todos os tipos do domínio.
  const missingLabel = { fire: "Fogo" } satisfies Record<PokemonType, string>;
  return { name, level, invalidPatch, undefinedPatch, missingLabel, typeLabels };
}
