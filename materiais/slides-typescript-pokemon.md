---
marp: true
theme: default
size: 16:9
paginate: true
lang: pt-BR
title: TypeScript depois do básico — PokéLab
description: Tipagem aplicada ao backend e ao React, recursos modernos e TypeScript 7
author: Israel
style: |
  section {
    background: #0b1220;
    color: #e9f0fb;
    font-family: "DejaVu Sans", sans-serif;
    font-size: 29px;
    padding: 48px 60px;
    justify-content: center;
  }
  h1 { color: #73c9ff; font-size: 46px; margin-bottom: 26px; }
  h2 { color: #9ce7dd; font-size: 34px; }
  strong { color: #9ce7dd; }
  a { color: #73c9ff; }
  code { font-family: "DejaVu Sans Mono", monospace; background: #14243c; color: #ecf3ff; }
  pre { background: #14243c; color: #ecf3ff; border: 0; padding: 18px 22px; }
  pre code { font-size: 23px; line-height: 1.25; }
  .hljs-keyword, .hljs-selector-tag, .hljs-literal { color: #c5a2ff; }
  .hljs-string, .hljs-attr { color: #a0e8b7; }
  .hljs-type, .hljs-title, .hljs-name { color: #80d5ff; }
  .hljs-comment { color: #9ab0c9; }
  .hljs-number, .hljs-built_in { color: #ffce84; }
  .hljs-variable, .hljs-params { color: #ecf3ff; }
  table { font-size: 25px; width: 100%; }
  th { background: #17375e; color: #ffffff; }
  td { background: #101e32; color: #e9f0fb; }
  th, td { border-color: #34506c; padding: 12px 16px; }
  blockquote { color: #bacde1; border-color: #73c9ff; font-size: 26px; }
  section::after { color: #99afc8; font-size: 17px; }
  section.cover h1 { font-size: 64px; line-height: 1.12; }
  section.cover h2 { font-size: 36px; }
  section.compact table { font-size: 22px; }
  section.references { font-size: 25px; }
---

<!-- _class: cover -->
<!-- _paginate: false -->

# TypeScript depois do básico

## Tipagem aplicada com Pokémon

Backend, React e o compilador nativo do TypeScript 7

<!--
Slide 1. Público: turma com tipos básicos, funções, objetos e arrays já introduzidos.
Apresentação preparada em 17/11/2026. Núcleo de 90 minutos, com extensão para 120.
Abra o PokéLab já funcionando. O objetivo é tomar decisões melhores sobre contratos e dados.
-->

---

# O PokéLab do treinador

Um sistema para **consultar o time e editar apelido e nível**.

- A API recebe JSON e devolve dados públicos.
- A interface React exibe carregamento, sucesso e falha.
- O contrato permite algumas alterações e bloqueia outras.

**Ao final:** cada escolha de tipo deverá evitar um erro concreto.

<!--
Slide 2. Os registros representam Pokémon de um treinador. O modelo usa um único tipo elemental por Pokémon para reduzir o domínio.
Não reproduz todas as regras da franquia. Dados locais deixam a aula independente de APIs externas.
A aplicação de demonstração usa Node HTTP + React/Vite. A mesma modelagem se aplica a Express, NestJS e outros frameworks.
-->

---

# Três bugs para investigar

```ts
const pokemon = JSON.parse(texto) as Pokemon;
pokemon.name.toUpperCase();

type Atualizacao = Partial<Pokemon>;
const mudanca: Atualizacao = { trainerId: "outro" };

type Tela = {
  loading: boolean;
  data?: PokemonDto[];
  error?: string;
};
```

**Pergunta:** quais desses problemas o compilador consegue enxergar?

<!--
Slide 3. Trechos intencionalmente problemáticos, não uma recomendação.
A asserção confia no JSON sem validar. Partial da entidade inclui campos que a operação não deveria alterar.
Três propriedades independentes aceitam combinações ambíguas. Dependendo da UX, dados antigos + loading podem ser válidos, mas precisam de uma modelagem intencional.
-->

---

# Verificação estática e execução

| Situação | Garantia necessária |
| --- | --- |
| Chave inexistente no nosso código | Checagem de tipos |
| Estado de tela sem os dados exigidos | União discriminada |
| JSON com nível igual a 500 | Validação em execução |
| Alterar Pokémon de outro treinador | Autenticação e autorização |
| Campo interno aparecendo na resposta | Projeção real do objeto |

Os tipos descrevem o código. **A fronteira HTTP recebe valores.**

<!--
Slide 4. A autorização real está fora do escopo do pequeno projeto e precisa existir numa aplicação de produção.
Interfaces, aliases e asserções de tipo são apagados. Nenhum deles inspeciona sozinho um JSON.
Fonte: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions
-->

---

# Valores que também definem tipos

```ts
const pokemonTypes =
  ["fire", "water", "grass", "electric"] as const;

type PokemonType = (typeof pokemonTypes)[number];

type Pokemon = {
  id: number; name: string; type: PokemonType;
  level: number;
  nickname: string | null;
  trainerId: string;
};
```

`typeof` consulta o tipo. `[number]` extrai os itens da tupla.

<!--
Slide 5. as const existe desde TS 3.4, não é novidade do TS 7.
Sem as const, este array é normalmente string[]. Com ele, cada posição conserva um literal e a tupla é readonly no sistema de tipos.
Fonte: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions
Fonte: https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html
-->

---

# Um contrato para cada uso

```ts
type PokemonDto = Pick<Pokemon,
  "id" | "name" | "type" | "level" | "nickname"
>;

type PokemonCardData =
  Pick<PokemonDto, "id" | "name" | "type">;

type SemTreinador = Omit<Pokemon, "trainerId">;
```

`Pick` escolhe campos. `Omit` exclui campos **do tipo**.

<!--
Slide 6. O DTO seleciona uma lista explícita de propriedades públicas.
Se alguém adicionar um novo campo interno à entidade, a lista de Pick não o incorpora automaticamente.
SemTreinador demonstra Omit, mas ambos continuam sendo transformações estáticas. Não fazem serialização.
Fonte: https://www.typescriptlang.org/docs/handbook/utility-types.html
-->

---

# Atualização parcial com limite claro

```ts
type PokemonPatch =
  Partial<Pick<Pokemon, "nickname" | "level">>;

const permitido: PokemonPatch = {
  nickname: "Faísca", level: 30
};

const proibido: PokemonPatch = {
  trainerId: "outro" // erro esperado neste literal
};
```

Primeiro selecionamos os campos. Depois os tornamos opcionais.

<!--
Slide 7. A última atribuição é intencionalmente inválida. No projeto, exemplos de falha usam @ts-expect-error.
A checagem de propriedades extras em literais não torna o tipo exato: um objeto armazenado em variável pode ter propriedades adicionais por tipagem estrutural.
O parser da API deve rejeitar chaves extras. Partial não valida autorização e não representa necessariamente todos os formatos de PATCH.
Fonte: https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype
Fonte: https://www.typescriptlang.org/docs/handbook/2/objects.html#excess-property-checks
-->

---

# O DTO precisa existir como objeto

```ts
function toPokemonDto(p: Pokemon): PokemonDto {
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    level: p.level,
    nickname: p.nickname,
  };
}
```

Somente anotar `const dto: PokemonDto = p` mantém os campos de `p`.

<!--
Slide 8. Demonstre JSON.stringify(p) e JSON.stringify(toPokemonDto(p)).
Uma anotação não apaga trainerId do valor original. A construção explícita do objeto define o que será enviado.
Fonte: https://www.typescriptlang.org/docs/handbook/type-compatibility.html
-->

---

# Ausente, null e undefined

```ts
const manterApelido: PokemonPatch = { level: 30 };
const remover: PokemonPatch = { nickname: null };
const renomear: PokemonPatch = { nickname: "Faísca" };

// Com exactOptionalPropertyTypes: true
const ambiguo: PokemonPatch = { nickname: undefined };
// erro: undefined não foi declarado como valor aceito
```

A API documenta: **ausente mantém, null remove, string substitui**.

<!--
Slide 9. Esse significado de null é uma decisão do contrato desta API, não regra universal de PATCH.
O tipo também aceita {}, mas o parser da demo rejeita um PATCH vazio. Mais um exemplo de regra de negócio além da checagem de tipos.
JSON não representa undefined. JSON.stringify costuma omitir propriedades de objetos com esse valor.
exactOptionalPropertyTypes distingue propriedade opcional de propriedade que aceita explicitamente undefined.
Fonte: https://www.typescriptlang.org/tsconfig/exactOptionalPropertyTypes.html
-->

---

# Configuração completa com satisfies

```ts
const typeLabels = {
  fire: "Fogo",
  water: "Água",
  grass: "Planta",
  electric: "Elétrico",
} as const satisfies Record<PokemonType, string>;

type RotuloEletrico = typeof typeLabels.electric;
// "Elétrico"
```

Adicionar `"ice"` ao domínio exige decidir seu rótulo.

<!--
Slide 10. Record exige as chaves da união finita. satisfies verifica compatibilidade, conservando informação específica do valor.
as const mantém os valores literais nesta declaração. Não diga que satisfies sozinho sempre conserva todo literal ou nunca influencia inferência: há contextual typing.
satisfies chegou no TS 4.9, e não no TS 7.
Fonte: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator
-->

---

# Readonly e as const têm limites

```ts
type Ficha = Readonly<{
  name: string;
  stats: { hp: number };
}>;

const ficha: Ficha = {
  name: "Pikachu", stats: { hp: 35 }
};
ficha.stats.hp = 40; // permitido: Readonly é raso
```

`readonly` e `as const` não congelam objetos em execução.

<!--
Slide 11. as const em literal aninhado pode inferir readonly também nas partes literais internas, mas não congela o objeto e não torna todo objeto previamente referenciado profundamente imutável.
Readonly é uma transformação de propriedades do nível atual. Object.freeze também é raso em runtime.
A anotação define o contrato, satisfies verifica compatibilidade, as afirma uma visão do valor sem validá-lo.
Fonte: https://www.typescriptlang.org/docs/handbook/utility-types.html#readonlytype
Fonte: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions
-->

---

# Dados externos começam como unknown

```ts
function parseLevel(input: unknown): number {
  if (
    typeof input !== "number" ||
    !Number.isInteger(input) ||
    input < 1 || input > 100
  ) {
    throw new Error("Nível deve ser inteiro de 1 a 100");
  }
  return input;
}
```

O `if` verifica o valor e permite o **narrowing**.

<!--
Slide 12. number não significa número inteiro no intervalo do negócio. O exemplo também rejeita NaN e Infinity por Number.isInteger.
A implementação completa de parsePokemonPatch no projeto valida objeto, campos extras e nickname, depois reconstrói apenas os campos permitidos.
Type guards escritos manualmente precisam ser corretos; o compilador não prova que um predicado is valida tudo que promete.
Fonte: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
-->

---

# O backend encadeia as garantias

```ts
// Fluxo reduzido do handler de PATCH
const body: unknown = await readJson(req);
const patch = parsePokemonPatch(body);
const atual = findPokemon(id);
if (!atual) return respondNotFound(res);

const atualizado = { ...atual, ...patch };
savePokemon(atualizado);
return respondJson(res, toPokemonDto(atualizado));
```

Na aplicação completa, a identidade do usuário também limita o acesso.

<!--
Slide 13. Pseudocódigo de integração: os nomes de transporte foram reduzidos para caber no slide. Abra o handler real do projeto.
O spread é seguro para os campos desta operação porque patch foi reconstruído por um parser que rejeita propriedades extras.
Não use {...atual, ...body} com uma asserção no body. Validação e projeção precisam ocorrer antes.
O projeto demonstra um treinador fixo, sem autenticação de produção.
-->

---

# Demonstração: o contrato em ação

| Payload do PATCH | Resultado esperado |
| --- | --- |
| `{"nickname":"Faísca"}` | Atualiza apelido |
| `{"nickname":null}` | Remove apelido |
| `{"level":500}` | Rejeita valor |
| `{"level":"30"}` | Rejeita tipo |
| `{"trainerId":"outro"}` | Rejeita campo extra |

**Pergunta:** qual linha compila como `PokemonPatch`, mas ainda falha na API?

<!--
Slide 14. level:500 compila porque 500 é number, mas o parser o rejeita.
Envie os payloads no terminal ou em um cliente HTTP. Valide também que trainerId não aparece na resposta.
O projeto possui comandos de demonstração no README. Dedique tempo à observação dos erros, não a escrever o servidor do zero.
-->

---

# Generics preservam relações

```ts
type Page<T> = {
  items: T[];
  total: number;
};

type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

type ListaPokemon = Page<PokemonDto>;
type RespostaPokemon = ApiResult<PokemonDto>;
```

O `T` conecta o conteúdo do contrato ao dado que ele transporta.

<!--
Slide 15. Page é um tipo didático; a rota pequena da demo pode devolver uma lista direta.
A união ApiResult deve ser refinada por ok antes de ler data ou error.
Um generic útil preserva relações. fetchJson<T> com um cast no retorno deixa o chamador inventar um tipo sem verificar o JSON.
Fonte: https://www.typescriptlang.org/docs/handbook/2/generics.html
-->

---

# keyof e T[K] no código reutilizável

```ts
function getProperty<T, K extends keyof T>(
  item: T, key: K
): T[K] {
  return item[key];
}

const nome = getProperty(pikachu, "name");  // string
const nivel = getProperty(pikachu, "level"); // number
getProperty(pikachu, "power"); // erro: chave inexistente
```

Uma chave válida determina **o tipo exato do retorno**.

<!--
Slide 16. pikachu é uma variável tipada como Pokemon no exemplo completo.
keyof obtém as chaves; extends limita K a elas; T[K] acessa o tipo da propriedade selecionada.
Aplicações: helpers de formulário, tabelas, ordenação por campos permitidos. Não criar uma abstração genérica quando acesso direto já for suficiente.
Fonte: https://www.typescriptlang.org/docs/handbook/2/keyof-types.html
Fonte: https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html
-->

---

# Estados explícitos no React

```ts
type RemoteData<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; message: string };

const estado: RemoteData<PokemonDto[]> = {
  status: "success",
  data: [],
};
```

Sucesso exige dados. Falha exige mensagem.

<!--
Slide 17. Uma lista vazia pode ser sucesso; criar empty é uma escolha de apresentação, não obrigação da modelagem.
Para manter dados anteriores durante refetch, modele explicitamente refreshing com data, por exemplo. Não force toda UX a quatro estados.
Fonte: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions
-->

---

# never encontra estados esquecidos

```tsx
function Result({ state }: {
  state: RemoteData<PokemonDto[]>
}) {
  switch (state.status) {
    case "idle": return <p>Consulte seu time.</p>;
    case "loading": return <p>Carregando...</p>;
    case "error": return <p>{state.message}</p>;
    case "success": return <p>{state.data.length} Pokémon</p>;
    default: return assertNever(state);
  }
}
```

`assertNever(value: never): never` lança um erro se for chamado.

<!--
Slide 18. Implementação: function assertNever(value: never): never { throw new Error("Estado não tratado"); }.
Acrescente {status:"empty"} à união. O default passa a receber um valor diferente de never e o compilador aponta a ramificação que falta.
Exhaustividade vale para a união conhecida no código. Dados em runtime ainda precisam ser confiáveis.
Fonte: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking
-->

---

# Props que acompanham o modo do card

```ts
type PokemonCardProps = { pokemon: PokemonDto } & (
  | { mode: "view"; onSave?: never }
  | {
      mode: "edit";
      onSave: (patch: PokemonPatch) => Promise<void>;
    }
);
```

- Em edição, o callback é obrigatório.
- Em visualização, a prop `onSave` não é aceita.
- O componente refina `props.mode` antes de usar o callback.

<!--
Slide 19. Exemplo de interseção com união discriminada. exactOptionalPropertyTypes reforça a intenção de onSave?: never.
Evite separar propriedades correlacionadas de maneira que perca o narrowing; usar props.mode e props.onSave mantém o exemplo claro.
Fonte: https://www.typescriptlang.org/docs/handbook/2/objects.html#intersection-types
Fonte: https://react.dev/learn/typescript
-->

---

# O frontend também valida a resposta

```ts
async function getPokemon(id: number): Promise<PokemonDto> {
  const response = await fetch(`/api/pokemon/${id}`);
  if (!response.ok) {
    throw new Error("Falha ao consultar Pokémon");
  }
  const body: unknown = await response.json();
  return parsePokemonDto(body);
}
```

`Promise<PokemonDto>` documenta o retorno; o parser confere os dados.

<!--
Slide 20. Trecho didático de consulta individual: o cliente da demo implementa listPokemon e updatePokemon com DTOs diretos. ApiResult é um exemplo de modelagem separado, não o formato das rotas desta demo.
Um backend separado, cache, proxy ou outra versão pode devolver um formato inesperado.
A validação manual deixa o mecanismo visível. Em projetos maiores, bibliotecas de schema ajudam a manter as regras e a inferência juntas.
Fonte: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
-->

---

# Tipos úteis derivados de funções

```ts
type Retorno = ReturnType<typeof getPokemon>;
// Promise<PokemonDto>

type Dado = Awaited<Retorno>;
// PokemonDto

type Argumentos = Parameters<typeof getPokemon>;
// [id: number]
```

Útil em adaptadores e hooks internos. Contratos públicos pedem estabilidade.

<!--
Slide 21. Evitar acoplar consumidores externos diretamente ao retorno de serviços internos.
Outros utilitários ficam na consulta: Required, NonNullable, Extract e Exclude. Não transformar a aula em memorização de uma lista.
Fonte: https://www.typescriptlang.org/docs/handbook/utility-types.html
-->

---

# TS 5.5: inferência em filtros

```ts
const porId = new Map<number, PokemonDto>([
  [pikachu.id, pikachu]
]);

const encontrados = [25, 999]
  .map(id => porId.get(id))
  .filter(pokemon => pokemon !== undefined);

// encontrados: PokemonDto[]
```

A condição elimina `undefined` e informa isso ao compilador.

<!--
Slide 22. Demonstre o hover. TS 5.5 infere predicados em funções que atendem condições específicas.
filter(Boolean) não é uma substituição universal. !!valor pode eliminar zero e esconder uma decisão de negócio.
Não anotar o callback como retorno boolean se o objetivo é observar a inferência automática desse predicado.
Fonte: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html#inferred-type-predicates
-->

---

# TS 5.6: condições suspeitas

```ts
// Erro detectado: uma RegExp é sempre truthy.
if (/pikachu/i) {
  console.log("Encontrado");
}

// A intenção exige executar o teste.
if (/pikachu/i.test(nome)) {
  console.log("Encontrado");
}
```

O compilador reconhece alguns erros sintáticos comuns em condições.

<!--
Slide 23. O primeiro trecho é intencionalmente inválido.
Essa checagem não prova toda regra lógica nem substitui testes. O diagnóstico é útil para erros como esquecer .test.
Fonte: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-6.html#disallowed-nullish-and-truthy-checks
-->

---

# TS 5.8: sintaxe que pode ser apagada

```json
{
  "compilerOptions": {
    "erasableSyntaxOnly": true
  }
}
```

O compilador sinaliza construções que exigem transformação,
como `enum` e propriedades declaradas no construtor.

**Uso:** projetos cujo executor remove os tipos diretamente.

<!--
Slide 24. Não ativar indiscriminadamente em aplicações que dependem dessas construções.
Essa opção não executa arquivos, não valida suporte do runtime a todo JavaScript e não faz typecheck em nome do executor.
A demo principal compila o backend e faz typecheck separado do bundler; não depende desse modo.
Fonte: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-8.html#the---erasablesyntaxonly-option
-->

---

# Outras mudanças que afetam projetos

| Versão | Recurso | Pergunta prática |
| --- | --- | --- |
| 5.7 | `rewriteRelativeImportExtensions` | Quem converte `./x.ts` em `./x.js`? |
| 5.9 | `module: "node20"` | Preciso de modelo de módulos fixo? |
| 5.9 | `import defer` | Runtime e bundler entendem a sintaxe? |
| 6.0 | Novos padrões do compilador | Minha configuração está explícita? |

Declarar uma API em `lib` **não instala a API no runtime**.

<!--
Slide 25. rewriteRelativeImportExtensions reescreve extensões relativas elegíveis, não resolve qualquer alias.
node20 é o nome do modelo de módulos; não recomenda instalar uma versão antiga de Node para esta aula.
import defer adia a avaliação e não significa por si só lazy loading de rede; não fazer demo sem suporte confirmado.
TS 6 altera defaults como strict e types. Detalhes de migração ficam no roteiro.
Fontes: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-7.html
https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html
https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html
-->

---

# TypeScript 7 e o compilador em Go

| Parte | Papel |
| --- | --- |
| Nosso código TypeScript | Continua sendo a linguagem do projeto |
| Compilador nativo em Go | Analisa tipos e pode emitir JavaScript |
| Node e navegador | Executam o JavaScript da aplicação |

**TS 7.0 estável: 8 de julho de 2026.**

O ganho está nas ferramentas de desenvolvimento.

<!--
Slide 26. Corrige a premissa de que TS 7 ainda seria um lançamento futuro na data desta aula, 17/11/2026.
Go é a implementação do compilador. A aplicação não é traduzida para Go nem passa a precisar de um runtime Go.
A justificativa da equipe inclui adequação ao port fiel do compilador existente, gerenciamento automático de memória e paralelismo.
Fonte: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
Fonte: https://github.com/microsoft/typescript-go/discussions/411
-->

---

# Onde o desempenho melhora

| Build completo | TypeScript 6 | TypeScript 7 |
| --- | ---: | ---: |
| VS Code | 125,7 s | 10,6 s |
| Sentry | 139,8 s | 15,7 s |
| Playwright | 12,8 s | 1,47 s |

Resultados publicados pela equipe do TypeScript.

**O tempo de uma requisição Node precisa de outra medição.**

<!--
Slide 27. Fonte dos valores: tabela do anúncio oficial do TS 7.0, configuração padrão do benchmark.
Esses valores não foram medidos no PokéLab e não são promessa para qualquer máquina ou projeto.
Não confundir build completo com cada operação do editor, bundle do Vite ou desempenho em execução.
Fonte: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
-->

---

# Configuração explícita no projeto

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true
  }
}
```

Backend: `NodeNext` + tipos Node. Frontend: `Bundler` + DOM/React.

<!--
Slide 28. Este é o fragmento compartilhado, não um tsconfig completo.
As opções noUncheckedIndexedAccess e exactOptionalPropertyTypes precisam ser ativadas explicitamente.
Explique que lista[0] pode ser undefined, e que o modo de resolução precisa acompanhar o runtime ou bundler.
TS 6 passou a usar strict true e types [] como defaults; ainda mantemos escolhas explícitas para documentar a intenção.
Fonte: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html
Fonte: https://www.typescriptlang.org/tsconfig/noUncheckedIndexedAccess.html
-->

---

# Instalação e migração para o TS 7

```bash
npm install -D typescript@7.0.2
npx tsc --version
npm run typecheck
```

- Revisar descontinuações e a resolução de módulos.
- Conferir ferramentas que importam a API do compilador.
- Comparar diagnósticos e tempos com a mesma base de código.

**O TS 7.0 não fornece a antiga API JavaScript do compilador.**

<!--
Slide 29. O exemplo fixa 7.0.2 para reprodutibilidade. O lockfile registra dependências exatas.
A instalação estável usa typescript e tsc. tsgo e @typescript/native-preview pertencem ao fluxo histórico da prévia.
Ferramentas dependentes da API antiga podem precisar de TS 6 em paralelo. O roteiro apresenta o arranjo de aliases do anúncio oficial.
Fontes: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
https://github.com/microsoft/typescript-go/blob/main/README.md
-->

---

# O que acompanhar no TS 7.1

**Beta anunciada em 20 de outubro de 2026.**

- Nova API programática para ferramentas.
- Integração de formatos que incorporam TypeScript.
- Ampliação do suporte a módulos e APIs do JavaScript.

O código da aula usa **7.0.2 estável**.

<!--
Slide 30. Situação verificada em 17/11/2026. O anúncio localizado é beta; não apresentar 7.1 como versão estável.
Content mappers ajudam o ecossistema, mas sua existência não significa suporte pronto de todos os frameworks.
As novas entradas de API incluem typescript/sync, typescript/async e typescript/ast. API nova não equivale a compatibilidade automática com a antiga.
Fonte: https://devblogs.microsoft.com/typescript/announcing-typescript-7-1-beta/
-->

---

# Tipos mapeados em um formulário

```ts
type EditPokemonForm = {
  nickname: string;
  level: number;
};

type FieldErrors<T> = {
  [K in keyof T]?: string;
};

const errors: FieldErrors<EditPokemonForm> = {
  level: "Use um inteiro de 1 a 100",
};
```

As chaves do formulário também definem as chaves dos erros.

<!--
Slide 31. Aprofundamento para a versão de 120 minutos. Pular no percurso de 90 minutos.
Mapped types percorrem propriedades de um tipo. O modificador ? torna cada propriedade opcional.
No exercício estendido, erros específicos ajudam a interface. O utilitário descreve o resultado; a validação ainda precisa produzir as mensagens.
Fonte: https://www.typescriptlang.org/docs/handbook/2/mapped-types.html
-->

---

# Tipos condicionais e infer

```ts
type PageItem<T> =
  T extends Page<infer Item> ? Item : never;

type ItemDoCatalogo = PageItem<Page<PokemonDto>>;
// PokemonDto

type ForaDoContrato = PageItem<string>;
// never
```

Se o tipo tem formato de página, `infer` captura o tipo do item.

<!--
Slide 32. Aprofundamento. infer declara uma variável de tipo dentro do padrão avaliado no extends.
Para um formato já conhecido, Page<PokemonDto>["items"][number] resolve diretamente. Não usar conditional types só para tornar o código sofisticado.
Conditional types podem distribuir sobre uniões quando o parâmetro aparece diretamente à esquerda do extends. Esse detalhe fica no roteiro, sem aprofundamento em recursão.
Fonte: https://www.typescriptlang.org/docs/handbook/2/conditional-types.html
-->

---

# Template literal types para eventos

```ts
type EditableField = keyof PokemonPatch;
type ChangedEvent = `${EditableField}Changed`;
// "nicknameChanged" | "levelChanged"

type FieldEvents<T> = {
  [K in keyof T & string as `${K}Changed`]:
    (value: T[K]) => void;
};
```

O nome do evento pode acompanhar o campo que ele representa.

<!--
Slide 33. Aprofundamento. O remapeamento de chaves usa as dentro de um mapped type, diferente de uma asserção de valor.
Usar EditPokemonForm como parâmetro de FieldEvents evita propagar a opcionalidade do PATCH nesta demonstração.
Isso verifica strings no código. Eventos externos continuam precisando de validação.
Fonte: https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html
Fonte: https://www.typescriptlang.org/docs/handbook/2/mapped-types.html#key-remapping-via-as
-->

---

# TS 5.4: NoInfer controla a escolha

```ts
function chooseStarter<T extends string>(
  allowed: readonly T[], selected: NoInfer<T>
): T {
  return selected;
}

chooseStarter(["Bulbasaur", "Charmander"], "Bulbasaur");
chooseStarter(["Bulbasaur", "Charmander"], "Pikachu");
// erro: a segunda entrada não pode ampliar T
```

A lista permitida determina o conjunto aceito.

<!--
Slide 34. Aprofundamento. NoInfer bloqueia aquela posição como fonte de inferência, sem alterar a checagem de compatibilidade com T.
Se a lista já foi alargada para string[], a precisão se perdeu. O tipo não valida strings vindas de um formulário ou HTTP.
Fonte: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-4.html#the-noinfer-utility-type
-->

---

# TS 5.0: parâmetros de tipo const

```ts
function defineTeam<const T extends readonly string[]>(
  members: T
): T {
  return members;
}

const team = defineTeam(["Pikachu", "Squirtle"]);
// readonly ["Pikachu", "Squirtle"]
```

A função preserva literais da entrada quando consegue inferi-los.

<!--
Slide 35. Aprofundamento. Útil para helpers de configuração e APIs de biblioteca.
Não recupera literais que já foram alargados numa variável string[].
O const está no parâmetro de tipo. Não congela o array em runtime.
Fonte: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#const-type-parameters
-->

---

# Oficina: edição com erros por campo

O formulário precisa exibir o motivo da rejeição **perto do campo**.

1. Definir `FieldErrors<EditPokemonForm>`.
2. Validar apelido e nível sem aceitar campos extras.
3. Modelar sucesso ou falha de validação com uma união.
4. Tratar o resultado no React e preservar o DTO público.

**Aceite:** nível 500 falha; apelido null remove; dono nunca muda.

<!--
Slide 36. Aprofundamento, oficina de 15 minutos, para completar a versão de 120 minutos.
O código principal já possui validação e união de resultado. A evolução é carregar fieldErrors no erro de validação e renderizar por campo.
Aplicar à mesma funcionalidade, sem criar outro sistema. Detalhes e gabarito conceitual no roteiro.
-->

---

# Desafio: o domínio mudou

Chegaram Pokémon do tipo **ice** e a UX quer um estado **empty**.

1. Acrescentar o novo tipo e seu rótulo.
2. Adicionar `{ status: "empty" }` à união.
3. Corrigir os pontos que o compilador encontrar.
4. Enviar `{"level":500}` e explicar por que a API rejeita.

**Entrega:** distinguir um erro de tipo de um erro de negócio.

<!--
Slide 37. Percurso principal: 6 minutos em dupla e 2 minutos de correção/discussão.
Na versão de 90 minutos, vir diretamente do slide 30. Na de 120, vir depois da oficina.
O estado empty deve ser produzido quando a lista for vazia, e não apenas adicionado ao tipo.
A união pode continuar usando sucesso com [] se essa for a UX desejada. Aqui empty serve como mudança deliberada de contrato.
-->

---

# O que a correção deve mostrar

| Alteração ou teste | Evidência |
| --- | --- |
| Novo tipo elemental | `Record` pede o rótulo ausente |
| Novo estado de tela | `assertNever` aponta o caso esquecido |
| Resposta com lista vazia | Código produz e renderiza `empty` |
| Nível 500 | Compila como número e falha na validação |
| Campo interno | Nunca aparece no DTO serializado |

<!--
Slide 38. Não aceitar como correção o uso de any ou as para silenciar o erro.
O novo tipo elemental também precisa ser aceito pelo parser do domínio. Quando o parser compartilha pokemonTypes, essa regra já acompanha o valor novo.
O gabarito deve demonstrar resultado, não só ausência de diagnósticos.
-->

---

# Qual recurso resolve qual problema?

| Problema | Recurso |
| --- | --- |
| Contrato de uma operação | `Pick`, `Omit`, `Partial` |
| Configuração com todas as opções | `Record` + `satisfies` |
| Estados e modos válidos | União discriminada + `never` |
| Relação entre entrada e retorno | Generics + `keyof` + `T[K]` |
| Dados de fora do programa | `unknown` + validação |
| Espera por build e diagnóstico | Ferramentas nativas do TS 7 |

<!--
Slide 39. Fechamento: o objetivo não é aumentar a complexidade dos tipos. É expressar uma decisão que o compilador possa ajudar a manter.
Peça um exemplo de aplicação no produto em que os alunos trabalham.
-->

---

<!-- _class: references -->

# Referências e continuidade

- [Handbook e tipos auxiliares](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [Narrowing e uniões discriminadas](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Notas das versões](https://www.typescriptlang.org/docs/handbook/release-notes/overview.html)
- [TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- [TypeScript 7.1 Beta](https://devblogs.microsoft.com/typescript/announcing-typescript-7-1-beta/)
- [React com TypeScript](https://react.dev/learn/typescript)

Roteiro, exercícios e código acompanham a apresentação.

<!--
Slide 40. Fontes adicionais aparecem nas notas dos slides e no roteiro do professor.
Informações de versão verificadas em 17/11/2026. Antes de reapresentar, conferir release notes e compatibilidade de ferramentas.
-->
