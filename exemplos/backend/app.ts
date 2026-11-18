import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { parsePokemonPatch, toPokemonDto, ValidationError } from "../shared/pokemon.js";
import type { Pokemon } from "../shared/pokemon.js";

// Identidade fixa para a aula. Autenticação real está fora deste exemplo.
const demoTrainerId = "trainer-ash";

function createSeed(): Pokemon[] {
  return [
    { id: 25, name: "Pikachu", type: "electric", level: 18, nickname: null, trainerId: demoTrainerId },
    { id: 4, name: "Charmander", type: "fire", level: 12, nickname: "Chama", trainerId: demoTrainerId },
    { id: 7, name: "Squirtle", type: "water", level: 14, nickname: null, trainerId: demoTrainerId },
    { id: 1, name: "Bulbasaur", type: "grass", level: 15, nickname: null, trainerId: demoTrainerId },
    { id: 37, name: "Vulpix", type: "fire", level: 17, nickname: null, trainerId: "trainer-brock" },
  ];
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of request) {
    const buffer: Buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > 16_384) throw new ValidationError("Corpo da requisição muito grande.");
    chunks.push(buffer);
  }
  try {
    const value: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    return value;
  } catch {
    throw new ValidationError("JSON inválido.");
  }
}

function json(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

export function createApp() {
  const pokemonById = new Map(createSeed().map((pokemon) => [pokemon.id, pokemon]));
  return createServer(async (request, response) => {
    try {
      const path = new URL(request.url ?? "/", "http://localhost").pathname;
      if (request.method === "GET" && path === "/api/pokemon") {
        const team = [...pokemonById.values()].filter((p) => p.trainerId === demoTrainerId);
        return json(response, 200, team.map(toPokemonDto));
      }
      const match = /^\/api\/pokemon\/(\d+)$/.exec(path);
      const id = Number(match?.[1]);
      const pokemon = Number.isSafeInteger(id) ? pokemonById.get(id) : undefined;
      if (!match || !pokemon || pokemon.trainerId !== demoTrainerId) {
        return json(response, 404, { message: "Pokémon não encontrado." });
      }
      if (request.method === "GET") return json(response, 200, toPokemonDto(pokemon));
      if (request.method !== "PATCH") {
        return json(response, 405, { message: "Método não permitido." });
      }
      const input: unknown = await readJson(request);
      const patch = parsePokemonPatch(input);
      const updated: Pokemon = { ...pokemon, ...patch };
      pokemonById.set(id, updated);
      return json(response, 200, toPokemonDto(updated));
    } catch (error: unknown) {
      if (error instanceof ValidationError) return json(response, 400, { message: error.message });
      console.error(error);
      return json(response, 500, { message: "Erro interno." });
    }
  });
}
