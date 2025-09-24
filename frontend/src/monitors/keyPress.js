import { ClipboardGetText, EventsOn, LogInfo } from "../../wailsjs/runtime/runtime";

export class KeyPressMonitor {
  constructor(editor) {
    this.editor = editor;

    this.listen();
  }

  listen() {
    // Mouse selection support
    let isMouseDown = false;

    this.editor.canvas.addEventListener("mousedown", (e) => {
      isMouseDown = true;
      const pos = this.getMousePosition(e);
      if (pos) {
        this.editor.cursor.line = pos.logicalLine;
        this.editor.cursor.col = pos.logicalCol;
        this.editor.startSelection(pos.logicalLine, pos.logicalCol);
        this.editor.render();
      }
      e.preventDefault();
    });

    this.editor.canvas.addEventListener("mousemove", (e) => {
      if (isMouseDown) {
        const pos = this.getMousePosition(e);
        if (pos) {
          this.editor.cursor.line = pos.logicalLine;
          this.editor.cursor.col = pos.logicalCol;
          this.editor.updateSelection(pos.logicalLine, pos.logicalCol);
          this.editor.render();
        }
      }
    });

    this.editor.canvas.addEventListener("mouseup", (e) => {
      if (isMouseDown) {
        isMouseDown = false;
        this.editor.endSelection();
        this.editor.render();
      }
    });

    // Prevent text selection on canvas
    this.editor.canvas.addEventListener("selectstart", (e) => {
      e.preventDefault();
    });

    window.addEventListener("keydown", (e) => {
      console.log(">>> keydown: ", e);
      switch (e.key) {
        case "ArrowLeft":
          if (e.shiftKey) {
            if (!this.editor.selection.isActive) {
              this.editor.startSelection();
            }
            this.editor.cursor.colPrevious();
            this.editor.updateSelection();
          } else {
            if (this.editor.hasSelection()) {
              // Move cursor to start of selection and clear it
              this.editor.cursor.line = this.editor.selection.start.line;
              this.editor.cursor.col = this.editor.selection.start.col;
              this.editor.clearSelection();
            } else {
              this.editor.cursor.colPrevious();
            }
          }
          break;
        case "ArrowRight":
          if (e.shiftKey) {
            if (!this.editor.selection.isActive) {
              this.editor.startSelection();
            }
            this.editor.cursor.colNext();
            this.editor.updateSelection();
          } else {
            if (this.editor.hasSelection()) {
              // Move cursor to end of selection and clear it
              this.editor.cursor.line = this.editor.selection.end.line;
              this.editor.cursor.col = this.editor.selection.end.col;
              this.editor.clearSelection();
            } else {
              this.editor.cursor.colNext();
            }
          }
          break;
        case "ArrowUp":
          if (e.shiftKey) {
            if (!this.editor.selection.isActive) {
              this.editor.startSelection();
            }
            this.editor.cursor.linePrevious();
            this.editor.updateSelection();
          } else {
            if (this.editor.hasSelection()) {
              // Move cursor to start of selection and clear it
              this.editor.cursor.line = this.editor.selection.start.line;
              this.editor.cursor.col = this.editor.selection.start.col;
              this.editor.clearSelection();
            } else {
              this.editor.cursor.linePrevious();
            }
          }
          break;
        case "ArrowDown":
          if (e.shiftKey) {
            if (!this.editor.selection.isActive) {
              this.editor.startSelection();
            }
            this.editor.cursor.lineNext();
            this.editor.updateSelection();
          } else {
            if (this.editor.hasSelection()) {
              // Move cursor to end of selection and clear it
              this.editor.cursor.line = this.editor.selection.end.line;
              this.editor.cursor.col = this.editor.selection.end.col;
              this.editor.clearSelection();
            } else {
              this.editor.cursor.lineNext();
            }
          }
          break;
        case "Backspace": // TODO ctrl + backspace to delete word
          if (this.editor.hasSelection()) {
            this.editor.deleteSelection();
          } else if (this.editor.cursor.col > 0) {
            const line = this.editor.lines[this.editor.cursor.line];
            this.editor.lines[this.editor.cursor.line] =
              line.slice(0, this.editor.cursor.col - 1) + line.slice(this.editor.cursor.col);
            this.editor.cursor.col--;
            // Re-wrap lines after deletion
            this.editor.wrapLines();
          } else if (this.editor.cursor.col === 0 && this.editor.cursor.line > 0) {
            const before = this.editor.lines[this.editor.cursor.line - 1];
            this.editor.lines[this.editor.cursor.line - 1] += this.editor.lines[this.editor.cursor.line];
            this.editor.lines.splice(this.editor.cursor.line, 1); // remove line
            this.editor.cursor.line--;
            this.editor.cursor.col = before.length;
            // Re-wrap lines after deletion
            this.editor.wrapLines();
          }
          break;
        case "Delete":
          if (this.editor.hasSelection()) {
            this.editor.deleteSelection();
          } else if (this.editor.lines[this.editor.cursor.line].length > this.editor.cursor.col) {
            this.editor.lines[this.editor.cursor.line] =
              this.editor.lines[this.editor.cursor.line].slice(0, this.editor.cursor.col) +
              this.editor.lines[this.editor.cursor.line].slice(this.editor.cursor.col + 1);
            // Re-wrap lines after deletion
            this.editor.wrapLines();
          } else if (
            this.editor.lines[this.editor.cursor.line + 1] !== undefined &&
            this.editor.lines[this.editor.cursor.line + 1] !== null
          ) {
            const next = this.editor.lines[this.editor.cursor.line + 1];
            this.editor.lines.splice(this.editor.cursor.line + 1, 1); // remove line
            this.editor.lines[this.editor.cursor.line] += next; // append removed line contents
            // Re-wrap lines after deletion
            this.editor.wrapLines();
          }
          break;
        case "Enter":
          {
            const line = this.editor.lines[this.editor.cursor.line];
            const before = line.slice(0, this.editor.cursor.col);
            const after = line.slice(this.editor.cursor.col);
            this.editor.lines[this.editor.cursor.line] = before;
            this.editor.lines.splice(this.editor.cursor.line + 1, 0, after); // new line
            this.editor.cursor.line++;
            this.editor.cursor.col = 0;
            // Re-wrap lines after adding new line
            this.editor.wrapLines();
          }
          break;
        case "Tab":
          this.editor.insertChar("  ");
          break; // TODO: shift + tab
        case "a":
          if (e.ctrlKey) {
            // Select all text
            this.editor.selection.isActive = true;
            this.editor.selection.start = { line: 0, col: 0 };
            this.editor.selection.end = {
              line: this.editor.lines.length - 1,
              col: this.editor.lines[this.editor.lines.length - 1].length,
            };
            this.editor.selection.anchor = { ...this.editor.selection.start };
          } else {
            this.editor.insertChar(e.key);
          }
          break;
        case "c":
          if (e.ctrlKey) {
            if (this.editor.hasSelection()) {
              const selectedText = this.editor.getSelectedText();
              navigator.clipboard.writeText(selectedText);
            }
          } else {
            this.editor.insertChar(e.key);
          }
          break;
        case "x":
          if (e.ctrlKey) {
            if (this.editor.hasSelection()) {
              const selectedText = this.editor.getSelectedText();
              navigator.clipboard.writeText(selectedText);
              this.editor.deleteSelection();
            }
          } else {
            this.editor.insertChar(e.key);
          }
          break;
        case "v":
          if (e.ctrlKey) {
            ClipboardGetText().then((text) => {
              this.editor.insertChar(text);
              this.editor.render();
            });
          } else {
            this.editor.insertChar(e.key);
          }
          break;
        case "o":
          if (e.ctrlKey) {
            this.editor.openFile();
          } else {
            this.editor.insertChar(e.key);
          }
          break;
        case "s":
          if (e.ctrlKey) {
            this.editor.saveFile();
          } else {
            this.editor.insertChar(e.key);
          }
          break;
        default:
          if (e.key.length < 2) {
            this.editor.insertChar(e.key);
          }
          break;
      }
      this.editor.render();
      e.preventDefault();
    });
  }

  getMousePosition(e) {
    const x = e.clientX - this.editor.elRect.left;
    const y = e.clientY - this.editor.elRect.top;

    // Convert y coordinate to wrapped line index
    const wrappedLineIndex = Math.floor(y / this.editor.options.lineHeight) + this.editor.visibleLines.from;

    if (wrappedLineIndex < 0 || wrappedLineIndex >= this.editor.wrappedLines.length) {
      return null;
    }

    const wrappedLine = this.editor.wrappedLines[wrappedLineIndex];
    if (!wrappedLine) {
      return null;
    }

    // Find the column position by measuring text width
    let col = 0;
    let currentWidth = 0;
    const text = wrappedLine.text;

    for (let i = 0; i <= text.length; i++) {
      const charWidth = i === 0 ? 0 : this.editor.ctx.measureText(text.slice(0, i)).width;

      if (x <= charWidth + (i === text.length ? 0 : this.editor.ctx.measureText(text[i]).width / 2)) {
        col = i;
        break;
      }
      col = i + 1;
    }

    // Convert wrapped position back to logical position
    const logicalPos = this.editor.wrappedToLogicalPosition(wrappedLineIndex, col);
    return logicalPos;
  }
}
