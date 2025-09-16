export class Cursor {
  #line = 0;
  #col = 0;
  width = 0;
  height = 0;

  constructor(editor, width, height) {
    this.editor = editor;
    this.width = width;
    this.height = height;
  }

  get line() {
    return this.#line;
  }

  set line(value) {
    this.#line = value;
  }

  get col() {
    return this.#col;
  }

  set col(value) {
    this.#col = value;
  }

  colPrevious() {
    if (this.#col > 0) {
      this.col--;
    } else if (this.#col === 0 && this.#line > 0) {
      this.line--;
      this.col = this.editor.lines[this.#line]?.length;
    }
    // this.position();
  }

  colNext() {
    if (this.editor.lines[this.#line]?.length > this.#col) {
      this.col++;
    } else if (this.editor.lines.length - 1 > this.#line) {
      this.line++;
      this.col = 0;
    }
    // this.position();
  }

  linePrevious() {
    if (this.#line > 0) {
      this.line--;
      this.col = this.editor.lines[this.#line]?.length < this.#col ? this.editor.lines[this.#line]?.length : this.#col;
      // this.position();
    }
  }

  lineNext() {
    if (this.editor.lines.length - 1 > this.#line) {
      this.line++;
      this.col = this.editor.lines[this.#line]?.length < this.#col ? this.editor.lines[this.#line]?.length : this.#col;
      // this.position();
    }
  }

  position() {
    const text = this.editor.lines[this.#line];
    const before = text.slice(0, this.#col);
    // const after = text.slice(this.#col);

    const x =
      (this.#col === 0 ? 0 : this.editor.ctx.measureText(before).width - this.width) >> 0;
    const y = (this.#line * this.height) - this.editor.visibleLines.offset;
    console.log(">>> Cursor moved: ", x, y);

    return { x, y };
  }
}
