# Aula de TypeScript com Pokémon

Material para uma turma que já teve a base de TypeScript introduzida. O roteiro oferece 90 minutos de conteúdo principal e uma extensão até 120 minutos.

## Apresentação

- `materiais/index.html`: abrir no navegador e navegar com as setas.
- `materiais/slides-typescript-pokemon.md`: fonte Marp editável.
- `materiais/slides-typescript-pokemon.pptx`: 40 slides editáveis, com notas do professor.
- `materiais/slides-typescript-pokemon.pdf`: cópia de consulta com texto selecionável.
- `materiais/roteiro-professor.md`: sequência, tempos, demonstrações e referências.
- `materiais/atividades-e-gabarito.md`: desafios e correções.

No percurso de 90 minutos, pular os slides 31–36. Eles acrescentam aprofundamento e oficina na versão de duas horas.

## Projeto

Em `exemplos` há uma aplicação Node + React com dados locais de Pokémon. O treinador consulta o time e edita apelido e nível.

```bash
cd exemplos
npm ci
npm run typecheck
npm test
```

Usar dois terminais:

```bash
npm run dev:api
```

```bash
npm run dev:web
```

Abrir `http://localhost:5173`. O README dentro de exemplos detalha requisitos, rotas, recompilação do backend e comandos HTTP.

O pacote não inclui node_modules nem os arquivos de build. O lockfile acompanha o código para registrar as versões.

## Recorte técnico

O material usa TypeScript 7.0.2 e distingue recursos atuais de recursos mais antigos ainda úteis. Em 17/11/2026, o lançamento oficial de TS 7.0 já havia ocorrido e TS 7.1 era apresentado nas fontes consultadas como beta.

O compilador nativo usa Go. O backend e o frontend da aplicação continuam executando JavaScript.

Os dados ficam em memória e a identidade de um treinador é fixa para a demonstração. Reiniciar a API restaura o time.

As fontes oficiais estão nas notas dos slides e no roteiro.
