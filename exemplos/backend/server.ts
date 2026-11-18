import { createApp } from "./app.js";

createApp().listen(3001, "127.0.0.1", () => {
  console.log("PokéLab API: http://127.0.0.1:3001/api/pokemon");
});
