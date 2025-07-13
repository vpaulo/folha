export class App {
  canvas;
  ctx;
  dpi = window.devicePixelRatio || 1;// Change to 1 on retina screens to see blurry canvas.

  element;
  elRect;
  observer;

  text = [''];


  constructor(options = {}) {
    console.log(">>> APP Options: ", options);
    this.element = document.querySelector("#app");
    this.elRect = this.element.getBoundingClientRect();
    this.canvas = document.querySelector("canvas");
    this.ctx = this.canvas.getContext("2d");

    window.addEventListener("keydown", (e) => {
      console.log(">>> keydown: ", e);
      if (e.key === 'Backspace' && this.text.length && this.text[0].length) {
        let txt = this.text[this.text.length - 1];
        txt = txt.slice(0, txt.length - 1);
        this.text[this.text.length - 1] = txt;
        if (!txt.length && this.text.length > 1) {
          this.text = this.text.slice(0, this.text.length - 1);
        }
      } else if (e.key === 'Enter') {
        this.text.push('');
      } else {
        this.text[this.text.length - 1] += e.key;
      }
    });
  }

  load() {
    console.log(">>> APP Load: ", this.canvas, this.ctx, this.dpi);
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
    this.ctx.font = "18px Arial";

    let offset = 0;
    let totalHeight = 0;
    let height = (18 * 1.5); // font * line height

    let items = this.text.map(txt => {
      let width = this.ctx.measureText(txt).width;
      let item = {
        txt,
        width,
        offset
      };
      offset = offset + height;
      totalHeight += height;
      return item;
    });

    let cY = (window.innerHeight / 2) - (totalHeight / 2);
    items.forEach(item => {
      let x = window.innerWidth / 2 - item.width / 2;
      let y = item.offset + height;
      this.ctx.fillText(item.txt, 0, y);
    });
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

