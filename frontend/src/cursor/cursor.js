export class Cursor {
  #line = 0;
  #col = 0;
  width = 0;
  height = 0;
  x = 0;
  y = 0;

  isWrapped = false;
  wrappedOffset = 0;

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
    this.position();
  }

  colNext() {
    const line = this.editor.processedLines[this.#line];
    if (
      this.isWrapped &&
      line.length - 1 !== this.wrappedOffset &&
      line[this.wrappedOffset][0].length - 1 < this.#col
    ) {
      console.log(">>> PORRA: ", line[this.wrappedOffset][0].length, this.wrappedOffset, this.#col);
      this.wrappedOffset++;
      this.#col++;
      this.position();
      return;
    }
    if (this.editor.lines[this.#line]?.length > this.#col) {
      this.col++;
    } else if (this.editor.lines.length - 1 > this.#line) {
      this.line++;
      this.col = 0;
    }
    this.position();
  }

  linePrevious() {
    if (this.isWrapped && this.wrappedOffset > 0) {
      this.wrappedOffset--;
      this.position();
      return;
    }
    if (this.#line > 0) {
      this.line--;
      if (this.editor.processedLines[this.#line].length > 1) {
        this.wrappedOffset = this.editor.processedLines[this.#line].length - 1;
      }
      this.col = this.editor.lines[this.#line]?.length < this.#col ? this.editor.lines[this.#line]?.length : this.#col;
      this.position();
    }
  }

  lineNext() {
    if (this.isWrapped && this.editor.processedLines[this.#line].length - 1 !== this.wrappedOffset) {
      this.col = this.editor.processedLines[this.#line][this.wrappedOffset][0].length + this.#col;
      this.wrappedOffset++;
      this.position();
      return;
    }
    if (this.editor.lines.length - 1 > this.#line) {
      this.line++;
      this.col = this.editor.lines[this.#line]?.length < this.#col ? this.editor.lines[this.#line]?.length : this.#col;
      this.position();
    }
  }

  position() {
    // const text = this.editor.lines[this.#line];
    // const before = text.slice(0, this.#col);
    // const after = text.slice(this.#col);
    const lines = this.editor.processedLines[this.#line];

    this.isWrapped = lines.length > 1 && lines.length - 1 >= this.wrappedOffset;
    this.wrappedOffset = this.isWrapped ? this.wrappedOffset : 0;

    const lineOffset = lines[this.wrappedOffset];
    let colOffset = this.#col;

    console.log(">>>>> COL: ", colOffset, this.wrappedOffset, this.wrappedOffset && lines[this.wrappedOffset - 1][0].length);

    if (this.wrappedOffset > 0 && lines[this.wrappedOffset - 1][0].length <= colOffset) {
      colOffset -= lines[this.wrappedOffset - 1][0].length;
      console.log(">>>>> PQP", this.#col, lines[this.wrappedOffset][0].length, colOffset);
    }

    this.x =
      (colOffset === 0 ? 0 : this.editor.ctx.measureText(lineOffset[0].slice(0, colOffset)).width - this.width) >> 0;
    this.y = (lineOffset[1] - this.height) >> 0;
    console.log(">>> Cursor moved: ", this.x, this.y, this.wrappedOffset, lineOffset[0]);
  }
}
