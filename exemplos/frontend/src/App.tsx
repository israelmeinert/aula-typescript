import { useEffect, useState } from "react";
import { assertNever } from "../../shared/pokemon.js";
import type { PokemonPatch } from "../../shared/pokemon.js";
import { listPokemon, updatePokemon } from "./api.js";
import type { LoadedTeam } from "./api.js";
import { PokemonCard } from "./PokemonCard.js";

export type RemoteData<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; message: string };

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Falha inesperada.";
}

export function App() {
  const [state, setState] = useState<RemoteData<LoadedTeam>>({ status: "idle" });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    void listPokemon(controller.signal).then(
      (data) => { if (!controller.signal.aborted) setState({ status: "success", data }); },
      (error: unknown) => {
        if (!controller.signal.aborted) setState({ status: "error", message: messageOf(error) });
      },
    );
    return () => controller.abort();
  }, [retry]);

  async function save(id: number, patch: PokemonPatch): Promise<void> {
    await updatePokemon(id, patch);
    setState({ status: "success", data: await listPokemon() });
  }

  function content() {
    switch (state.status) {
      case "idle": return <p>Preparando a consulta…</p>;
      case "loading": return <p role="status">Carregando o time…</p>;
      case "error": return <section role="alert">
        <p>{state.message}</p><button onClick={() => setRetry((n) => n + 1)}>Tentar novamente</button>
      </section>;
      case "success": return <section className="team">{state.data.map((pokemon) =>
        <PokemonCard key={pokemon.id} pokemon={pokemon} mode="edit"
          onSave={(patch) => save(pokemon.id, patch)} />,
      )}</section>;
      default: return assertNever(state);
    }
  }
  return <main><p className="eyebrow">Laboratório de TypeScript</p>
    <h1>PokéLab</h1><p>Um contrato entre a API e a tela do treinador.</p>
    {content()}<footer>Dados em memória. Reiniciar a API restaura o time.</footer>
  </main>;
}
