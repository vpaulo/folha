window.addEventListener("load", (event) => {
  console.log(">> LOADED: ");
  const app = new App();
  app.load();
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

    this.options = {...this.defaultOptions, ...options};

    this.element = document.querySelector("#app");
    this.elRect = this.element.getBoundingClientRect();
    this.canvas = document.querySelector("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.charWidth = this.ctx.measureText("M").width;

    window.addEventListener("keydown", (e) => {
      console.log(">>> keydown: ", e, this.lines.length);
      switch (e.key) {
        case "ArrowLeft": 
          if (this.cursor.col > 0) {
            this.cursor.col--;
          } else if (this.cursor.col >= 0 && this.cursor.line > 0){
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
        case "Backspace":
          if (this.cursor.col > 0) {
            const line = this.lines[this.cursor.line];
            this.lines[this.cursor.line] = line.slice(0, this.cursor.col - 1) + line.slice(this.cursor.col);
            this.cursor.col--;
          } else if (this.lines.length > 1){
            this.lines = this.lines.slice(0, this.lines.length - 1);
            this.cursor.line--;
            this.cursor.col = this.lines[this.cursor.line].length;
          } 
          break;
        case "Delete":
          if (this.lines[this.cursor.line].length > this.cursor.col) {
            this.lines[this.cursor.line] = this.lines[this.cursor.line].slice(0, this.cursor.col) + this.lines[this.cursor.line].slice(this.cursor.col + 1);
          } else if (this.lines[this.cursor.line + 1]) {
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
        default: this.insertChar(e.key);
      }
      console.log(">>>> cursor: ", this.cursor);
      e.preventDefault();
    });
  }

  load(txt = "") {
    this.lines = [...this.segLines.segment(txt)];
    if (this.lines.length === 0) {
      this.lines.push("");
    }

    console.log(">>> APP Load: ", this.canvas, this.ctx, this.dpi, this.lines, this.segLines.segment(txt));
    this.observer = new ResizeObserver(() => {
      this.elRect = this.element.getBoundingClientRect();
      this.updateCanvasSize();
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
    requestAnimationFrame(this.loop.bind(this));

    this.update();
    this.render();
  }

  update() { }
  render() {
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    this.ctx.font = `${this.options.fontSize}px Arial`;
    this.ctx.textBaseline = "bottom";
    this.ctx.fillStyle = "#000000";

    const visibleLines = Math.floor(this.canvas.height / this.options.lineHeight);
    const maxColumns = Math.floor(this.canvas.width / this.charWidth);

    let height = this.options.lineHeight;

    let items = this.lines.map(txt => {
      let width = this.ctx.measureText(txt).width;
      let item = {
        txt,
        width,
      };
      return item;
    });

    items.forEach((item, i) => {
      let y = height * (i + 1);
      this.ctx.fillText(item.txt, 0, y);
    });
    this.drawCursor();
  }

  drawCursor() {
    const { line, col } = this.cursor;
    const y = line * this.options.lineHeight;
    const x = col * this.charWidth;
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(x, y, 2, this.options.lineHeight);

    this.ctx.globalAlpha = 0.5;
    this.ctx.fillStyle = "#cccccc";
    this.ctx.fillRect(x, y, this.canvas.width, this.options.lineHeight);
  }

  insertChar(ch) {
    const line = this.lines[this.cursor.line];
    this.lines[this.cursor.line] = line.slice(0, this.cursor.col) + ch + line.slice(this.cursor.col);
    this.cursor.col += ch.length;
  }
}


// use Path2d objects , test it to see if it's going to work


// main.js 
// const canvas = document.getElementById('canvas');
// const dpr = window.devicePixelRatio || 1;
// const worker = new Worker('renderer.js');
//
// // Resize canvas and transfer control to worker
// function resizeCanvas() {
//   const width = window.innerWidth;
//   const height = window.innerHeight;
//
//   canvas.width = width * dpr;
//   canvas.height = height * dpr;
//   canvas.style.width = width + "px";
//   canvas.style.height = height + "px";
//
//   const offscreen = canvas.transferControlToOffscreen();
//   worker.postMessage({
//     type: 'init',
//     canvas: offscreen,
//     width,
//     height,
//     dpr
//   }, [offscreen]);
// }
//
// window.addEventListener('resize', () => {
//   const width = window.innerWidth;
//   const height = window.innerHeight;
//   worker.postMessage({ type: 'resize', width, height });
// });
//
// resizeCanvas();
//
// renderer.js
// let canvas, ctx, width, height, dpr;
// let img = new Image();
// img.src = 'assets/example.png';
//
// onmessage = (e) => {
//   const data = e.data;
//
//   if (data.type === 'init') {
//     canvas = data.canvas;
//     ctx = canvas.getContext('2d');
//     width = data.width;
//     height = data.height;
//     dpr = data.dpr;
//
//     ctx.scale(dpr, dpr);
//
//     loop();
//   }
//
//   if (data.type === 'resize') {
//     width = data.width;
//     height = data.height;
//     canvas.width = width * dpr;
//     canvas.height = height * dpr;
//     ctx.scale(dpr, dpr);
//   }
// };
//
// function render() {
//   ctx.clearRect(0, 0, width, height);
//
//   // Draw text
//   ctx.fillStyle = '#0f0';
//   ctx.font = `${Math.floor(width / 20)}px Arial`;
//   ctx.fillText("OffscreenCanvas Worker", 50, 100);
//
//   // Draw image when ready
//   if (img.complete) {
//     const imgWidth = width / 4;
//     const imgHeight = img.height * (imgWidth / img.width);
//     ctx.drawImage(img, width - imgWidth - 20, 20, imgWidth, imgHeight);
//   }
// }
//
// function loop() {
//   render();
//   requestAnimationFrame(loop);
// }
//

