export class Cursor {
  #line = 0;
  #col = 0;
  width = 0;

  height = 0;
  x = 0;
  y = 0;

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
      this.col = this.editor.lines[this.#line]?.length || 0;
    }
  }

  colNext() {
    const currentLineLength = this.editor.lines[this.#line]?.length || 0;
    if (currentLineLength > this.#col) {
      this.col++;
    } else if (this.editor.lines.length - 1 > this.#line) {
      this.line++;
      this.col = 0;
    }
  }

  linePrevious() {
    // Convert current logical position to wrapped position
    const wrappedPos = this.editor.logicalToWrappedPosition(this.#line, this.#col);

    if (wrappedPos.wrappedLine > 0) {
      const prevWrappedLine = wrappedPos.wrappedLine - 1;
      const prevWrappedInfo = this.editor.wrappedToLineMap[prevWrappedLine];

      // Try to maintain the same column position on the previous wrapped line
      const targetCol = Math.min(wrappedPos.wrappedCol, this.editor.wrappedLines[prevWrappedLine].text.length);
      const newLogicalPos = this.editor.wrappedToLogicalPosition(prevWrappedLine, targetCol);

      this.line = newLogicalPos.logicalLine;
      this.col = newLogicalPos.logicalCol;
    }
  }

  lineNext() {
    // Convert current logical position to wrapped position
    const wrappedPos = this.editor.logicalToWrappedPosition(this.#line, this.#col);

    if (wrappedPos.wrappedLine < this.editor.wrappedLines.length - 1) {
      const nextWrappedLine = wrappedPos.wrappedLine + 1;

      // Try to maintain the same column position on the next wrapped line
      const targetCol = Math.min(wrappedPos.wrappedCol, this.editor.wrappedLines[nextWrappedLine].text.length);
      const newLogicalPos = this.editor.wrappedToLogicalPosition(nextWrappedLine, targetCol);

      this.line = newLogicalPos.logicalLine;
      this.col = newLogicalPos.logicalCol;
    }
  }

  position() {
    // Fallback to simple positioning if wrapped lines aren't ready
    if (!this.editor.wrappedLines || this.editor.wrappedLines.length === 0) {
      const text = this.editor.lines[this.#line] || "";
      const before = text.slice(0, this.#col);
      this.x = this.#col === 0 ? 0 : this.editor.ctx.measureText(before).width;
      this.y = (this.#line * this.height) - (this.editor.visibleLines?.offset || 0);
      return;
    }

    // Convert logical position to wrapped position for rendering
    const wrappedPos = this.editor.logicalToWrappedPosition(this.#line, this.#col);
    const wrappedLineIndex = wrappedPos.wrappedLine;
    const wrappedCol = wrappedPos.wrappedCol;

    if (wrappedLineIndex < this.editor.wrappedLines.length) {
      const wrappedLineText = this.editor.wrappedLines[wrappedLineIndex].text;
      const beforeCursor = wrappedLineText.slice(0, wrappedCol);

      this.x = wrappedCol === 0 ? 0 : this.editor.ctx.measureText(beforeCursor).width;
      this.y = (wrappedLineIndex * this.height) - this.editor.visibleLines.offset;
    } else {
      this.x = 0;
      this.y = 0;
    }

    console.log(">>> Cursor moved: ", this.x, this.y, "logical:", this.#line, this.#col, "wrapped:", wrappedLineIndex, wrappedCol);
  }
}
