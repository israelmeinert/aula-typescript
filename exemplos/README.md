# PokéLab: TypeScript depois do básico

Um sistema pequeno para editar o time de um treinador: backend Node HTTP, frontend React e contratos compartilhados. Todos os Pokémon vêm de uma carga local em memória. Um único tipo elemental por Pokémon simplifica o exercício.

## Execução

Use Node **22.12 ou superior**; Node 24 é adequado. O projeto fixa TypeScript **7.0.2**. O compilador está implementado em Go, mas o backend e o frontend continuam executando JavaScript.

```bash
npm ci
npm run typecheck
npm test
```

Abra dois terminais na pasta `exemplos`:

```bash
# Terminal 1: compila a API e inicia o servidor Node.
npm run dev:api
```

```bash
# Terminal 2: inicia o frontend React.
npm run dev:web
```

Acesse **http://localhost:5173**. O Vite encaminha `/api` para **http://127.0.0.1:3001**. Edite apelido e nível e clique em “Salvar”, ou use “Treinar +1”. Um apelido vazio envia `null` para removê-lo. Reiniciar a API restaura os dados.

`dev:api` compila antes de iniciar. Após editar TypeScript do backend, rode `npm run build:api` em outro terminal ou reinicie `npm run dev:api`. O `node --watch` observa o JavaScript emitido, não recompila os arquivos `.ts`.

```bash
# Verificação de tipos e geração das duas aplicações.
npm run build
```

O Vite gera `dist-web/`; o compilador gera a API em `dist/`. O servidor da aula não serve a build estática. Em produção seria necessário definir hospedagem do frontend e o endereço/proxy da API.

## Ordem sugerida para demonstrar

| Arquivo | O que observar |
| --- | --- |
| `shared/pokemon.ts` | `as const`, união derivada, `Pick`, `Partial`, validação de `unknown` e DTO real |
| `lessons/advanced.ts` | `satisfies`, generics, `keyof`, `T[K]`, mapped types, conditional types, `infer`, `NoInfer` |
| `lessons/type-errors.ts` | Remova um `@ts-expect-error` para mostrar o diagnóstico esperado |
| `backend/app.ts` | Entrada externa desconhecida, validação e atualização de campos permitidos |
| `frontend/src/api.ts` | `response.json()` tratado como `unknown`; `Awaited<ReturnType<...>>` |
| `frontend/src/App.tsx` | União discriminada e exaustividade com `never` |
| `frontend/src/PokemonCard.tsx` | Props diferentes em modo leitura e edição; `onSave(patch): Promise<void>` |
| `frontend/src/type-errors.tsx` | O compilador recusa combinações inválidas de props |
| `exercises/atividade.ts` | Atividade para a turma, com solução em `gabarito.ts` |

## Requisições para a demonstração

Os comandos abaixo funcionam em Bash. No PowerShell, use `curl.exe` e ajuste a forma de passar JSON, ou use um cliente HTTP.

```bash
curl http://127.0.0.1:3001/api/pokemon

curl -X PATCH http://127.0.0.1:3001/api/pokemon/25 \
  -H 'Content-Type: application/json' \
  -d '{"nickname":"Faísca","level":20}'

# null remove o apelido. A ausência de nickname mantém o valor atual.
curl -X PATCH http://127.0.0.1:3001/api/pokemon/25 \
  -H 'Content-Type: application/json' -d '{"nickname":null}'

# Deve responder 400: alterar identidade não faz parte do contrato.
curl -i -X PATCH http://127.0.0.1:3001/api/pokemon/25 \
  -H 'Content-Type: application/json' -d '{"id":999}'

# Deve responder 400: number no tipo não expressa o intervalo de negócio.
curl -i -X PATCH http://127.0.0.1:3001/api/pokemon/25 \
  -H 'Content-Type: application/json' -d '{"level":101}'
```

## Decisões didáticas

- `PokemonDto` seleciona campos públicos no sistema de tipos. **`toPokemonDto` é quem constrói o objeto público em execução.** Atribuir um objeto completo a uma variável `PokemonDto` não remove propriedades extras.
- `PokemonPatch` permite alterar apenas `nickname` e `level`. O parser rejeita campos adicionais e um objeto vazio. Em um sistema real, valide também autorização e demais regras de negócio.
- A identidade `trainer-ash` é fixa. O filtro de acesso demonstra a regra, mas não implementa login, sessão ou autenticação. O registro de outro treinador serve para mostrar um `404`.
- `nickname` ausente significa “manter”, `null` significa “remover”. `undefined` explícito é rejeitado pelo tipo com `exactOptionalPropertyTypes`; JSON não representa `undefined`.
- O backend responde com DTOs e erros `{ message }`. `ApiResult<T>` em `lessons/advanced.ts` demonstra uma alternativa com envelope; ele não é o formato HTTP desta demo.
- `Readonly`, `as const` e utilitários só afetam os tipos. `Readonly`/`Partial` são superficiais. Nenhum deles congela ou valida dados em execução.
- Há uma chamada de leitura após cada PATCH para manter o fluxo fácil de seguir. Cache, atualização otimista e concorrência de múltiplos editores ficam fora do recorte.
- `typecheck` é uma etapa explícita. Transpilar com Vite não substitui verificar tipos.
- `FieldErrors<T>` permite um erro por campo; `Partial<Record<...>>` representa ausência com clareza. Evite `Record<string, T>` para fingir que toda chave externa existe.

## Atividade de 10 a 15 minutos

1. Implemente `applyPatch` em `exercises/atividade.ts`.
2. Escreva uma função `getProperty` cujo retorno dependa da chave recebida.
3. Acrescente o estado `empty` à união `RemoteData` e observe a falha de exaustividade. Trate o estado no `switch` e na conversão da resposta vazia.
4. Explique por que enviar `id` via HTTP exige validação mesmo quando `PokemonPatch` não contém esse campo.

Os TODOs estão isolados e não são executados pela aplicação. `npm run typecheck` verifica os exemplos com `@ts-expect-error`: se um erro esperado deixar de existir, o compilador sinaliza isso. Os testes de runtime verificam validação, remoção de campos privados e fluxo HTTP.

## Referências oficiais

- [TypeScript 7.0, lançamento de 08/07/2026](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- [Utility types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [Narrowing e uniões discriminadas](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript 5.5: predicados inferidos](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html)
- [TypeScript 5.4: NoInfer](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-4.html)
- [React com TypeScript](https://react.dev/learn/typescript)
- [Vite: TypeScript](https://vite.dev/guide/features.html#typescript)
