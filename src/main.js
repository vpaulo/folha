import './style.css';
import './app.css';

import { App } from "./app.js";
// import {Greet} from '../wailsjs/go/main/App';


window.addEventListener("load", (event) => {
  console.log(">> LOADED: ");
  const app = new App();
  app.load();
});
