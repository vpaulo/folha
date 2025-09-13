import { ClipboardGetText, EventsOn, LogInfo } from "../../wailsjs/runtime/runtime";

export class KeyPressMonitor {
  constructor(editor) {
    this.editor = editor;

    this.listen();
  }

  listen() {
    window.addEventListener("keydown", (e) => {
      console.log(">>> keydown: ", e, this.editor.lines.length);
      switch (e.key) {
        case "ArrowLeft": // TODO: shift + arrow for text selection
          this.editor.cursor.colPrevious();
          break;
        case "ArrowRight":
          this.editor.cursor.colNext();
          break;
        case "ArrowUp":
          this.editor.cursor.linePrevious();
          break;
        case "ArrowDown":
          this.editor.cursor.lineNext();
          break;
        case "Backspace": // TODO ctrl + backspace to delete word
          if (this.editor.cursor.col > 0) {
            const line = this.editor.lines[this.editor.cursor.line];
            this.editor.lines[this.editor.cursor.line] =
              line.slice(0, this.editor.cursor.col - 1) + line.slice(this.editor.cursor.col);
            this.editor.cursor.col--;
          } else if (this.editor.cursor.col === 0 && this.editor.cursor.line > 0) {
            const before = this.editor.lines[this.editor.cursor.line - 1];
            this.editor.lines[this.editor.cursor.line - 1] += this.editor.lines[this.editor.cursor.line];
            this.editor.lines.splice(this.editor.cursor.line, 1); // remove line
            this.editor.cursor.line--;
            this.editor.cursor.col = before.length;
          }
          break;
        case "Delete":
          if (this.editor.lines[this.editor.cursor.line].length > this.editor.cursor.col) {
            this.editor.lines[this.editor.cursor.line] =
              this.editor.lines[this.editor.cursor.line].slice(0, this.editor.cursor.col) +
              this.editor.lines[this.editor.cursor.line].slice(this.editor.cursor.col + 1);
          } else if (
            this.editor.lines[this.editor.cursor.line + 1] !== undefined &&
            this.editor.lines[this.editor.cursor.line + 1] !== null
          ) {
            const next = this.editor.lines[this.editor.cursor.line + 1];
            this.editor.lines.splice(this.editor.cursor.line + 1, 1); // remove line
            this.editor.lines[this.editor.cursor.line] += next; // append removed line contents
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
          }
          break;
        case "Tab":
          this.editor.insertChar("  ");
          break; // TODO: shift + tab
        // case "c":
        //   if (e.ctrlKey) {
        //     const selectedLine = lines[cursor.line];
        //     navigator.clipboard.writeText(selectedLine);
        //   }
        //   break;
        case "v":
          if (e.ctrlKey) {
            ClipboardGetText().then((text) => {
              this.editor.insertChar(text);
              this.editor.render();
            });
          }
          break;
        default:
          if (e.key.length < 2) {
            this.editor.insertChar(e.key);
          }
          break;
      }
      this.editor.render();
      console.log(">>>> cursor: ", this.editor.cursor);
      e.preventDefault();
    });
  }
}
