import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { parsePokemonPatch } from "../../shared/pokemon.js";
import type { PokemonDto, PokemonPatch } from "../../shared/pokemon.js";
import { typeLabels } from "../../lessons/advanced.js";

export type PokemonCardProps = { pokemon: PokemonDto } & (
  | { mode: "view"; onSave?: never }
  | { mode: "edit"; onSave: (patch: PokemonPatch) => Promise<void> }
);

export function PokemonCard(props: PokemonCardProps) {
  const { pokemon } = props;
  const [nickname, setNickname] = useState(pokemon.nickname ?? "");
  const [level, setLevel] = useState(String(pokemon.level));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setNickname(pokemon.nickname ?? "");
    setLevel(String(pokemon.level));
  }, [pokemon.nickname, pokemon.level]);

  async function save(patch: PokemonPatch) {
    if (props.mode !== "edit") return;
    setSaving(true);
    setMessage("");
    try {
      await props.onSave(patch);
      setMessage("Alterações salvas.");
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const patch = parsePokemonPatch({ nickname: nickname.trim() || null, level: Number(level) });
      void save(patch);
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Revise os campos.");
    }
  }

  return <article>
    <p className="kind">#{props.pokemon.id} · {typeLabels[props.pokemon.type]}</p>
    <h2>{props.pokemon.nickname ?? props.pokemon.name}</h2>
    <p>{props.pokemon.name} · Nível {props.pokemon.level}</p>
    {props.mode === "edit" && <form onSubmit={submit}>
      <fieldset disabled={saving}>
        <label>Apelido <input value={nickname} maxLength={20}
          placeholder="Vazio remove o apelido" onChange={(event) => setNickname(event.target.value)} /></label>
        <label>Nível <input type="number" min={1} max={100} required value={level}
          onChange={(event) => setLevel(event.target.value)} /></label>
        <div className="actions"><button type="submit">{saving ? "Salvando…" : "Salvar"}</button>
          <button type="button" disabled={pokemon.level >= 100}
            onClick={() => { void save({ level: pokemon.level + 1 }); }}>Treinar +1</button></div>
      </fieldset>
      <p role="status" className="feedback">{message}</p>
    </form>}
  </article>;
}
