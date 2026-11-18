// Um tipo por Pokémon é uma simplificação didática: alguns têm dois no jogo.
export const pokemonTypes = ["fire", "water", "grass", "electric"] as const;
export type PokemonType = (typeof pokemonTypes)[number];

export type Pokemon = {
  id: number;
  name: string;
  type: PokemonType;
  level: number;
  nickname: string | null;
  trainerId: string;
};

export type PokemonDto = Pick<Pokemon, "id" | "name" | "type" | "level" | "nickname">;
export type PokemonPatch = Partial<Pick<Pokemon, "nickname" | "level">>;

// Pick/Omit mudam tipos; esta função é que remove o campo em execução.
export function toPokemonDto(pokemon: Pokemon): PokemonDto {
  return {
    id: pokemon.id, name: pokemon.name, type: pokemon.type,
    level: pokemon.level, nickname: pokemon.nickname,
  };
}

export class ValidationError extends Error {}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isPokemonType(value: unknown): value is PokemonType {
  return pokemonTypes.some((type) => type === value);
}

export function parseLevel(input: unknown): number {
  if (typeof input !== "number" || !Number.isInteger(input) || input < 1 || input > 100) {
    throw new ValidationError("level deve ser inteiro de 1 a 100.");
  }
  return input;
}

export function parseNickname(input: unknown): string | null {
  if (input === null) return null;
  if (typeof input !== "string" || input.trim().length === 0 || input.length > 20) {
    throw new ValidationError("nickname deve ter 1 a 20 caracteres, ou null.");
  }
  return input;
}

export function parsePokemonPatch(input: unknown): PokemonPatch {
  if (!isObject(input)) throw new ValidationError("Envie um objeto JSON.");
  const keys = Object.keys(input);
  if (keys.length === 0) throw new ValidationError("Informe nickname ou level.");
  if (keys.some((key) => key !== "nickname" && key !== "level")) {
    throw new ValidationError("Somente nickname e level podem ser alterados.");
  }
  const patch: PokemonPatch = {};
  if ("nickname" in input) {
    patch.nickname = parseNickname(input.nickname);
  }
  if ("level" in input) {
    patch.level = parseLevel(input.level);
  }
  return patch;
}

export function parsePokemonDto(input: unknown): PokemonDto {
  if (!isObject(input) || typeof input.id !== "number" ||
      !Number.isInteger(input.id) || input.id < 1 ||
      typeof input.name !== "string" || input.name.trim().length === 0 ||
      !isPokemonType(input.type)) {
    throw new ValidationError("Resposta da API fora do contrato PokemonDto.");
  }
  try {
    return {
      id: input.id, name: input.name, type: input.type,
      level: parseLevel(input.level), nickname: parseNickname(input.nickname),
    };
  } catch {
    throw new ValidationError("Resposta da API fora do contrato PokemonDto.");
  }
}

export function parsePokemonList(input: unknown): PokemonDto[] {
  if (!Array.isArray(input)) throw new ValidationError("A API deveria retornar uma lista.");
  return input.map((item: unknown) => parsePokemonDto(item));
}

export function assertNever(value: never): never {
  throw new Error(`Estado inesperado: ${JSON.stringify(value)}`);
}
