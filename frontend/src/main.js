import "./styles/style.css";
import "./styles/app.css";

import { Greet } from "../wailsjs/go/main/App";
import { ClipboardGetText, EventsOn, LogInfo } from "../wailsjs/runtime/runtime";

import { KeyPressMonitor } from "./monitors/keyPress";
import { Cursor } from "./cursor/cursor";

// INFO: using event "loaded" not always triggers on app reload
window.addEventListener("load", (event) => {
  LogInfo(">> LOADED: ");
  const app = new Editor(document.querySelector("#app"));
  app.load(`;(function(root) {
    'use strict';
    qwerty uiop asd fgjkjhliuwqeq nmnv zcgbviu mdsjkfn sdkfhs dfsndfs difus fshdfisduf sifs fnjsdnfsidfu sifs dnfjsndfsiduf sdfjsndf sidfhj sfnsdifhjsdifhsdihf 👉

    var KeyDownMonitor = function() {
        this.keysDown = {};
        var that = this;
        window.addEventListener('keydown', function(e) {
            that.keysDown[e.which || e.keyCode] = true;
        });

        window.addEventListener('keyup', function(e) {
            that.keysDown[e.which || e.keyCode] = false;
        });
    };

    KeyDownMonitor.prototype.isKeyDown = function(code) {
        return this.keysDown[code];
    };

    root.KeyDownMonitor = KeyDownMonitor;
}(window));
qwerty uiop asd fgjkjhliuwqeq nmnv zcgbviu mdsjkfn sdkfhs dfsndfs difus fshdfisduf sifs fnjsdnfsidfu sifs dnfjsndfsiduf sdfjsndf sidfhj sfnsdifhjsdifhsdihf 👉`);
});

// Setup the greet function
// window.greet = function () {
//   // Get name
//   let name = nameElement.value;

//   // Check if the input is empty
//   if (name === "") return;

//   // Call App.Greet(name)
//   try {
//     Greet(name)
//       .then((result) => {
//         // Update result with data back from App.Greet()
//         resultElement.innerText = result;
//       })
//       .catch((err) => {
//         console.error(err);
//       });
//   } catch (err) {
//     console.error(err);
//   }
// };

export class Editor {
  canvas;
  ctx;
  dpi = window.devicePixelRatio || 1; // Change to 1 on retina screens to see blurry canvas.

  element;
  elRect;
  observer;

  options;
  defaultOptions = {
    fontSize: 16,
    // lineHeight: 20, // TODO: maybe change value to be 1.25 of font size, ex: 16 * 1.25 = 20
    letterSpacing: 2,
    wordSpacing: 4,
    // padding: 10,
    // gutterWidth: 50,
    // theme: 'dark',
  };
  lines = [];
  cursor = { line: 0, col: 0 };

  segLines = new Intl.Segmenter("en", { granularity: "sentence" });
  segWords = new Intl.Segmenter("en", { granularity: "word" });
  segChars = new Intl.Segmenter("en", { granularity: "grapheme" });

  constructor(element, options) {
    this.options = {
      ...this.defaultOptions,
      ...options,
      lineHeight: (options?.fontSize ?? this.defaultOptions.fontSize) * 1.25,
    };

    this.element = element;
    this.elRect = this.element.getBoundingClientRect();
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");

    this.element.replaceChildren(this.canvas);

    this.observer = new ResizeObserver(() => {
      this.elRect = this.element.getBoundingClientRect();
      this.updateCanvasSize();
      this.render();
    });
    this.observer.observe(this.element);

    this.cursor = new Cursor(this, this.options.letterSpacing, this.options.lineHeight);
    new KeyPressMonitor(this);
  }

  updateCanvasSize() {
    // Set the "actual" size of the canvas
    this.canvas.width = this.elRect.width * this.dpi;
    this.canvas.height = this.elRect.height * this.dpi;

    // Set the "drawn" size of the canvas
    this.canvas.style.width = `${this.elRect.width}px`;
    this.canvas.style.height = `${this.elRect.height}px`;

    // Scale the context to ensure correct drawing operations
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset any previous transform
    this.ctx.scale(this.dpi, this.dpi);
  }

  load(txt = "") {
    this.lines = [...this.segLines.segment(txt)].map((l) => l.segment.replaceAll("\n", ""));
    if (this.lines.length === 0) {
      this.lines.push("");
    }

    this.render();
  }

  render() {
    // TODO: Only render necessary lines ??
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    this.ctx.font = `${this.options.fontSize}px Arial`;
    this.ctx.letterSpacing = `${this.options.letterSpacing}px`;
    this.ctx.wordSpacing = `${this.options.wordSpacing}px`;
    this.ctx.textBaseline = "bottom";
    this.ctx.fillStyle = "#000000";

    this.drawSelectedLine(0);
    this.lines.forEach((line, i) => {
      this.ctx.fillText(line, 0, this.options.lineHeight * (i + 1));
    });
    this.drawCursor();
  }

  drawCursor() {
    const { width, height } = this.cursor;
    const { x, y } = this.cursor.position();
    this.ctx.save();
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(x, y, width, height);
    this.ctx.restore();
  }

  drawSelectedLine(y) {
    this.ctx.save();
    this.ctx.globalAlpha = 0.5;
    this.ctx.fillStyle = "#cccccc";
    this.ctx.fillRect(0, y, this.canvas.width, this.options.lineHeight);
    this.ctx.restore();
  }

  insertChar(ch) {
    const line = this.lines[this.cursor.line];
    const before = line.slice(0, this.cursor.col);
    const after = line.slice(this.cursor.col);
    // Normalise inserted characters
    const newLines = [...this.segLines.segment(ch)].map((l) => l.segment.replaceAll("\n", ""));

    if (newLines.length > 1) {
      const last = (newLines.at(-1) ?? "") + after;
      newLines[newLines.length - 1] = last;
      this.lines.splice(this.cursor.line, 0, ...newLines);
      this.cursor.line += newLines.length - 1;
      this.cursor.col = last.length - after.length;
    } else {
      this.lines[this.cursor.line] = before + ch + after;
      this.cursor.col += ch.length;
    }
  }
}
