import type { Pokemon, PokemonDto, PokemonType } from "../shared/pokemon.js";

// satisfies verifica o contrato e preserva inferência mais específica.
export const typeLabels = {
  fire: "Fogo", water: "Água", grass: "Planta", electric: "Elétrico",
} as const satisfies Record<PokemonType, string>;

// K relaciona a chave aceita ao tipo do retorno.
export function getProperty<T, K extends keyof T>(object: T, key: K): T[K] {
  return object[key];
}

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

// Uma versão explícita de mapped type. Para esta regra, os dois tipos equivalem.
export type MappedErrors<T> = { [K in keyof T]?: string };

export type ArrayItem<T> = T extends readonly (infer Item)[] ? Item : never;
export type TeamMember = ArrayItem<readonly PokemonDto[]>;

export type Page<T> = { items: T[]; total: number };
export type PageItem<T> = T extends Page<infer Item> ? Item : never;
export type PokemonPageItem = PageItem<Page<PokemonDto>>;

// Const type parameters (TS 5.0) mantêm a tupla literal na chamada.
export function defineTeam<const T extends readonly string[]>(members: T): T {
  return members;
}
export const starterTeam = defineTeam(["Pikachu", "Squirtle"]);

// Alternativa de contrato com envelope. A API desta demo usa DTO bruto.
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: "VALIDATION" | "NOT_FOUND"; message: string } };
export type SuccessData<T> = T extends { ok: true; data: infer Data } ? Data : never;
export type SuccessfulPokemon = SuccessData<ApiResult<PokemonDto>>;

export type PokemonEvent = `${PokemonType}:selected`;
export type PublicFields = Exclude<keyof Pokemon, "trainerId">;

// NoInfer (5.4): somente options define quais valores são aceitos.
export function chooseType<T extends string>(options: readonly T[], initial: NoInfer<T>): T {
  if (!options.includes(initial)) throw new Error("Valor fora das opções.");
  return initial;
}

// TS 5.5 infere o predicado: o resultado é PokemonDto[], sem as/!.
export function removeMissing(items: (PokemonDto | undefined)[]) {
  return items.filter((pokemon) => pokemon !== undefined);
}

// Um dicionário aberto precisa admitir ausência em runtime.
export function findPokemon(index: Partial<Record<number, PokemonDto>>, id: number) {
  return index[id]; // PokemonDto | undefined.
}

// Readonly protege atribuições no tipo, sem congelar o objeto em runtime.
export type TeamSnapshot = Readonly<{ members: readonly PokemonDto[] }>;
