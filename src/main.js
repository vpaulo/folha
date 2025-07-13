import { App } from "./app.js";

window.addEventListener("load", (event) => {
  console.log(">> LOADED: ");
  const app = new App();
  app.load();
});
