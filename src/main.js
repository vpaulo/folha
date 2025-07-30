window.addEventListener("load", (event) => {
  console.log(">> LOADED: ");
  const app = new App();
  app.load(`;(function(root) {
    'use strict';

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
}(window));`);
});

class App {
  canvas;
  ctx;
  dpi = window.devicePixelRatio || 1;// Change to 1 on retina screens to see blurry canvas.

  element;
  elRect;
  observer;

  options;
  defaultOptions = {
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 2,
    // padding: 10,
    // gutterWidth: 50,
    // theme: 'dark',
  };
  text = "";
  lines = [];
  charWidth = 0;
  cursor = { line: 0, col: 0 };

  segLines = new Intl.Segmenter("en", { granularity: "sentence" });
  segWords = new Intl.Segmenter("en", { granularity: "word" });
  segChars = new Intl.Segmenter("en", { granularity: "grapheme" });

  constructor(options) {
    console.log(">>> APP Options: ", options);

    this.options = { ...this.defaultOptions, ...options };

    this.element = document.querySelector("#app");
    this.elRect = this.element.getBoundingClientRect();
    this.canvas = document.querySelector("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.charWidth = this.ctx.measureText("M").width;

    window.addEventListener("keydown", (e) => {
      console.log(">>> keydown: ", e, this.lines.length);
      switch (e.key) {
        case "ArrowLeft": // TODO: shift + arrow for text selection
          if (this.cursor.col > 0) {
            this.cursor.col--;
          } else if (this.cursor.col >= 0 && this.cursor.line > 0) {
            this.cursor.line--;
            this.cursor.col = this.lines[this.cursor.line].length;
          }
          break;
        case "ArrowRight":
          if (this.lines[this.cursor.line] && this.lines[this.cursor.line].length > this.cursor.col) {
            this.cursor.col++;
          } else if (this.lines.length - 1 > this.cursor.line) {
            this.cursor.line++;
            this.cursor.col = 0;
          }
          break;
        case "ArrowUp":
          if (this.cursor.line > 0) {
            this.cursor.line--;
            this.cursor.col = this.lines[this.cursor.line].length < this.cursor.col ? this.lines[this.cursor.line].length : this.cursor.col;
          }
          break;
        case "ArrowDown":
          if (this.lines.length - 1 > this.cursor.line) {
            this.cursor.line++;
            this.cursor.col = this.lines[this.cursor.line].length < this.cursor.col ? this.lines[this.cursor.line].length : this.cursor.col;
          }
          break;
        case "Backspace": // TODO ctrl + backspace to delete word
          if (this.cursor.col > 0) {
            const line = this.lines[this.cursor.line];
            this.lines[this.cursor.line] = line.slice(0, this.cursor.col - 1) + line.slice(this.cursor.col);
            this.cursor.col--;
          } else if (this.cursor.col === 0 && this.cursor.line > 0) {
            const before = this.lines[this.cursor.line - 1];
            this.lines[this.cursor.line - 1] += this.lines[this.cursor.line];
            this.lines.splice(this.cursor.line, 1); // remove line
            this.cursor.line--;
            this.cursor.col = before.length;
          }
          break;
        case "Delete":
          if (this.lines[this.cursor.line].length > this.cursor.col) {
            this.lines[this.cursor.line] = this.lines[this.cursor.line].slice(0, this.cursor.col) + this.lines[this.cursor.line].slice(this.cursor.col + 1);
          } else if (this.lines[this.cursor.line + 1] !== undefined && this.lines[this.cursor.line + 1] !== null) {
            const next = this.lines[this.cursor.line + 1];
            this.lines.splice(this.cursor.line + 1, 1); // remove line
            this.lines[this.cursor.line] += next; // append removed line contents
          }
          break;
        case "Enter":
          {
            const line = this.lines[this.cursor.line];
            const before = line.slice(0, this.cursor.col);
            const after = line.slice(this.cursor.col);
            this.lines[this.cursor.line] = before;
            this.lines.splice(this.cursor.line + 1, 0, after); // new line
            this.cursor.line++;
            this.cursor.col = 0;
          }
          break;
        case "Tab": this.insertChar("  "); break; // TODO: shift + tab
        default:
          if (e.key.length < 2) {
            this.insertChar(e.key);
          }
          break;
      }
      this.loop();
      console.log(">>>> cursor: ", this.cursor);
      e.preventDefault();
    });
  }

  load(txt = "") {
    this.lines = [...this.segLines.segment(txt)].map(l => l.segment.replaceAll("\n", ""));
    if (this.lines.length === 0) {
      this.lines.push("");
    }

    console.log(">>> APP Load: ", this.canvas, this.ctx, this.dpi, this.lines);


    this.observer = new ResizeObserver(() => {
      this.elRect = this.element.getBoundingClientRect();
      this.updateCanvasSize();
      this.loop();
    });
    this.observer.observe(this.element);

    this.loop();
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

  loop() {
    // requestAnimationFrame(this.loop.bind(this));

    this.update();
    this.render();
  }

  update() { }
  render() {
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    this.ctx.font = `${this.options.fontSize}px Arial`;
    this.ctx.letterSpacing = `${this.options.letterSpacing}px`;
    this.ctx.textBaseline = "bottom";
    this.ctx.fillStyle = "#000000";

    this.drawSelectedLine();

    let offset = 0;

    this.lines.forEach((line, i) => {
      offset = i === 0 ? this.options.lineHeight : offset + this.options.lineHeight;

      this.wrapText(line, offset)?.forEach((item) => {
        this.ctx.fillText(item[0], 0, item[1]);
        offset = item[1];
      });
    });
    this.drawCursor();
  }

  wrapText(ln, offset) {
    let line = ''; // This will store the text of the current line
    let testLine = ''; // This will store the text when we add a word, to test if it's too long
    let lineArray = []; // This is an array of lines, which the function will return

    const words = [...this.segWords.segment(ln)].map((word, i) => {
      return {
        value: word.segment,
        width: this.ctx.measureText(word.segment).width,
      };
    });

    // Lets iterate over each word
    for (var n = 0; n < words.length; n++) {
      // Create a test line, and measure it..
      testLine += words[n].value;
      // If the width of this test line is more than the max width
      if (this.ctx.measureText(testLine).width > this.canvas.width && n > 0) {
        // Then the line is finished, push the current line into "lineArray"
        lineArray.push([line, offset]);
        // Increase the line height, so a new line is started
        offset += this.options.lineHeight;
        // Update line and test line to use this word as the first word on the next line
        line = words[n].value;
        testLine = words[n].value;
      }
      else {
        // If the test line is still less than the max width, then add the word to the current line
        line += words[n].value;
      }
      // If we never reach the full max width, then there is only one line.. so push it into the lineArray so we return something
      if (n === words.length - 1) {
        lineArray.push([line, offset]);
      }
    }
    // Return the line array
    return lineArray;
  }

  drawCursor() {
    const { line, col } = this.cursor;
    const text = this.lines[line].slice(0, col);
    const y = line * this.options.lineHeight;
    const x = col === 0 ? 0 : this.ctx.measureText(text).width - this.options.letterSpacing;

    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(x, y, 2, this.options.lineHeight);
  }

  drawSelectedLine() {
    this.ctx.save();
    this.ctx.globalAlpha = 0.5;
    this.ctx.fillStyle = "#cccccc";
    this.ctx.fillRect(0, this.cursor.line * this.options.lineHeight, this.canvas.width, this.options.lineHeight);
    this.ctx.restore();

  }

  insertChar(ch) {
    const line = this.lines[this.cursor.line];
    this.lines[this.cursor.line] = line.slice(0, this.cursor.col) + ch + line.slice(this.cursor.col);
    this.cursor.col += ch.length;
  }
}
