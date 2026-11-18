# Atividades: TypeScript aplicado no PokéLab

Este material complementa os slides e o projeto em `exemplos`. As mudanças são pequenas para que a turma pratique modelagem, não configuração de ambiente.

## Atividade 1: novo tipo elemental e novo estado de tela

**Tempo sugerido:** 6 minutos de trabalho e 2 minutos de correção.

### Contexto

O sistema passará a aceitar Pokémon de gelo. A interface também terá uma mensagem específica quando o time estiver vazio.

### Tarefas

1. Acrescentar `"ice"` à constante `pokemonTypes`.
2. Corrigir a configuração de rótulos.
3. Acrescentar `{ status: "empty" }` à união `RemoteData<T>`.
4. Tratar o novo estado na renderização.
5. Produzir esse estado quando a API devolver uma lista vazia.
6. Explicar por que `{ level: 500 }` continua aceito pelo tipo `PokemonPatch`.

Não resolver diagnósticos usando any, uma asserção arbitrária ou removendo assertNever.

### Critérios de aceite

- O novo tipo aparece no domínio e no catálogo de rótulos.
- O parser de tipo elemental acompanha a lista compartilhada.
- O switch trata todos os estados.
- A resposta vazia realmente gera o estado empty.
- A explicação distingue número de número válido para o negócio.

### Gabarito comentado

O domínio deriva a união da constante:

```ts
export const pokemonTypes =
  ["fire", "water", "grass", "electric", "ice"] as const;
```

A configuração passa a incluir o novo rótulo:

```ts
const typeLabels = {
  fire: "Fogo",
  water: "Água",
  grass: "Planta",
  electric: "Elétrico",
  ice: "Gelo",
} as const satisfies Record<PokemonType, string>;
```

O estado acrescenta uma variante:

```ts
type RemoteData<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "empty" }
  | { status: "success"; data: T }
  | { status: "error"; message: string };
```

No caminho de sucesso da consulta:

```ts
setState(data.length === 0
  ? { status: "empty" }
  : { status: "success", data });
```

Na renderização:

```tsx
case "empty":
  return <p>Seu time ainda não tem Pokémon.</p>;
```

Aplicar a mesma transformação em todo ponto que carrega uma nova lista, inclusive após atualização, se esse fluxo puder produzir uma lista vazia. Se houver repetição, um helper simples pode concentrar a decisão.

A variante empty é uma escolha de UX. Também seria válido manter success com uma lista vazia e renderizar a mensagem dentro desse caso. Nesta atividade, a mudança explícita exercita a exaustividade.

`level: 500` é number. A regra de 1 a 100 pertence ao parser. Atribuir esse valor a PokemonPatch não executa o parser.

## Atividade 2: uma edição que não troca o dono

**Uso:** prática complementar ou exercício entre aulas. A versão em código está em `exemplos/exercises`.

### Tarefa

Implementar uma função que receba um Pokémon existente e um corpo desconhecido, valide a alteração, aplique os campos permitidos e devolva o DTO público.

Assinatura:

```ts
function applyPatch(pokemon: Pokemon, input: unknown): PokemonDto;
```

### Casos de aceite

| Entrada | Resultado |
| --- | --- |
| `{ nickname: "Faísca" }` | Apelido atualizado |
| `{ nickname: null }` | Apelido removido |
| `{ level: 30 }` | Nível atualizado e apelido mantido |
| `{ trainerId: "outro" }` | Rejeição |
| `{ level: 500 }` | Rejeição |
| `{ level: "30" }` | Rejeição |
| `{}` | Rejeição conforme a regra desta demo |

### Gabarito

```ts
function applyPatch(pokemon: Pokemon, input: unknown): PokemonDto {
  const patch = parsePokemonPatch(input);
  const updated: Pokemon = { ...pokemon, ...patch };
  return toPokemonDto(updated);
}
```

O spread usa o objeto validado e reconstruído. Se usasse input com uma asserção, a lista de campos do tipo não impediria propriedades extras em execução.

A checagem de identidade do treinador pertence à camada que localiza o recurso e conhece o usuário autenticado. Esta função não recebe essa identidade e não deve fingir que implementa autorização.

## Atividade 3: oficina com erros por campo

**Tempo sugerido:** 15 minutos. Usar no percurso de duas horas.

### Requisito

Hoje a API responde uma mensagem de falha. O formulário deverá mostrar erros associados aos campos de edição.

Manter o recorte:

```ts
type EditPokemonForm = {
  nickname: string;
  level: number;
};

type FieldErrors<T> = { [K in keyof T]?: string };

type PatchValidation =
  | { ok: true; value: PokemonPatch }
  | {
      ok: false;
      message: string;
      fields: FieldErrors<EditPokemonForm>;
    };
```

### Tarefas

1. Criar uma função que valide um input unknown e retorne PatchValidation.
2. Produzir uma mensagem em fields.level quando o nível for inválido.
3. Produzir uma mensagem em fields.nickname quando o apelido for inválido.
4. Rejeitar campos extras com uma mensagem geral.
5. No React, ler value apenas no caso de sucesso.
6. Exibir os erros ao lado dos campos.

### Gabarito de referência

Este gabarito é uma função independente para a oficina. Na aplicação, o contrato de erro HTTP e seu parser também precisam acompanhar a evolução.

```ts
function validatePatch(input: unknown): PatchValidation {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, message: "Envie um objeto.", fields: {} };
  }

  const keys = Object.keys(input);
  if (keys.length === 0 ||
      keys.some(key => key !== "nickname" && key !== "level")) {
    return { ok: false, message: "Envie apenas nickname e/ou level.", fields: {} };
  }

  const fields: FieldErrors<EditPokemonForm> = {};
  const value: PokemonPatch = {};

  if ("level" in input) {
    const level = input.level;
    if (typeof level !== "number" || !Number.isInteger(level) ||
        level < 1 || level > 100) {
      fields.level = "Use um inteiro de 1 a 100.";
    } else {
      value.level = level;
    }
  }

  if ("nickname" in input) {
    const nickname = input.nickname;
    if (nickname === null) {
      value.nickname = null;
    } else if (typeof nickname === "string" &&
               nickname.trim().length > 0 && nickname.length <= 20) {
      value.nickname = nickname;
    } else {
      fields.nickname = "Use de 1 a 20 caracteres, ou null.";
    }
  }

  if (Object.keys(fields).length > 0) {
    return { ok: false, message: "Revise os campos.", fields };
  }
  return { ok: true, value };
}
```

No consumidor:

```ts
const result = validatePatch(payload);
if (!result.ok) {
  setErrors(result.fields);
  setMessage(result.message);
  return;
}
await updatePokemon(id, result.value);
```

Essa checagem no cliente melhora a experiência. O backend precisa repetir a validação porque requisições podem chegar sem passar pela interface.

Para não manter duas regras divergentes no projeto final, o parser do servidor pode consumir a mesma função de validação e transformar a falha no formato HTTP escolhido. Esse ajuste de integração pode ficar como continuação, se a turma gastar os 15 minutos compreendendo a união e o mapped type.

## Perguntas de revisão

### 1. Por que um objeto com campos extras às vezes compila?

TypeScript usa compatibilidade estrutural. A verificação de excesso de propriedades é mais estrita em certos literais. Um tipo com menos campos não é um filtro de valores em execução.

### 2. Readonly impede qualquer alteração dentro de um objeto?

Readonly transforma as propriedades do nível atual. Não congela valores em execução e, sozinho, não torna todo objeto aninhado imutável.

### 3. satisfies substitui validação de JSON?

Não. Ele verifica uma expressão no código durante a análise de tipos. O JSON recebido exige verificações em execução.

### 4. Por que usar unknown em vez de any no body?

unknown exige evidência antes de acessar ou usar o valor. any permite operações sem essas verificações, propagando ausência de garantias para o restante do código.

### 5. O compilador do TS 7 em Go acelera um endpoint Node?

O endpoint executa JavaScript. Ganhos na análise de tipos e build são medidas diferentes do tempo de execução da requisição.

## Fontes para os conceitos

- [Utility types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [Narrowing e exaustividade](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Compatibilidade estrutural](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)
- [Mapped types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
- [React com TypeScript](https://react.dev/learn/typescript)
