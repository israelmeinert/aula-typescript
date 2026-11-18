import { defineConfig } from "vite";

export default defineConfig({
  root: "frontend",
  server: { port: 5173, proxy: { "/api": "http://127.0.0.1:3001" } },
  build: { outDir: "../dist-web", emptyOutDir: true },
});
