import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { createApp } from "../backend/app.js";
import { parsePokemonDto, parsePokemonPatch, toPokemonDto } from "../shared/pokemon.js";
import { getProperty, removeMissing } from "../lessons/advanced.js";

test("PATCH aceita null, rejeita campos privados e limites inválidos", () => {
  assert.deepEqual(parsePokemonPatch({ nickname: null, level: 100 }), { nickname: null, level: 100 });
  for (const body of [null, [], {}, { trainerId: "outro" }, { id: 1 }, { level: 0 },
    { level: 101 }, { level: 1.5 }, { level: "20" }, { nickname: " " }, { nickname: undefined }]) {
    assert.throws(() => parsePokemonPatch(body));
  }
});

test("DTO remove campo privado em execução e parser valida retorno remoto", () => {
  const dto = toPokemonDto({ id: 25, name: "Pikachu", type: "electric", level: 10,
    nickname: null, trainerId: "secreto" });
  assert.equal("trainerId" in dto, false);
  assert.deepEqual(parsePokemonDto(dto), dto);
  assert.throws(() => parsePokemonDto({ ...dto, level: "10" }));
  assert.equal(getProperty(dto, "level"), 10);
  assert.deepEqual(removeMissing([undefined, dto]), [dto]);
});

test("API aplica PATCH validado e não expõe Pokémon de outro treinador", async () => {
  const app = createApp();
  app.listen(0, "127.0.0.1");
  await once(app, "listening");
  const address = app.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api/pokemon`;
  try {
    const initial: unknown = await (await fetch(`${base}/25`)).json();
    assert.equal(parsePokemonDto(initial).level, 18);
    const invalid = await fetch(`${base}/25`, { method: "PATCH", body: '{"id":999}' });
    assert.equal(invalid.status, 400);
    const valid = await fetch(`${base}/25`, { method: "PATCH", body: '{"level":19,"nickname":null}' });
    assert.equal(valid.status, 200);
    const changed: unknown = await valid.json();
    assert.equal(parsePokemonDto(changed).level, 19);
    assert.equal((await fetch(`${base}/37`)).status, 404);
  } finally {
    await new Promise<void>((resolve, reject) => app.close((error) => error ? reject(error) : resolve()));
  }
});
