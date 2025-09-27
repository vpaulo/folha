import "./styles/style.css";
import "./styles/app.css";

import { Greet, OpenFile, SaveFile, SaveToFile } from "../wailsjs/go/main/App";
import { ClipboardGetText, EventsOn, LogInfo } from "../wailsjs/runtime/runtime";

import { KeyPressMonitor } from "./monitors/keyPress";
import { Cursor } from "./cursor/cursor";

// INFO: using event "loaded" not always triggers on app reload
window.addEventListener("load", (event) => {
  LogInfo(">> LOADED: ");
  const app = new Editor(document.querySelector("#app"));
});

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
    // wordSpacing: 4,
    // padding: 10,
    // gutterWidth: 50,
    // theme: 'dark',
  };
  lines = [];
  wrappedLines = []; // Visual lines for display (includes wrapped portions)
  lineToWrappedMap = []; // Maps logical line index to wrapped line ranges
  wrappedToLineMap = []; // Maps wrapped line index to logical line index

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
      this.wrapLines(); // Re-wrap lines when window resizes
      this.render();
    });
    this.observer.observe(this.element);

    EventsOn("open_file", (content) => {
      if (content !== null && content !== "") {
        this.load(content);
      }
    });

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

    // Set font before calculating line width
    this.ctx.font = `${this.options.fontSize}px monospace`;
    this.ctx.letterSpacing = `${this.options.letterSpacing}px`;

    this.totalLines = (this.canvas.height / this.options.lineHeight) >> 0;
    this.maxLineWidth = this.elRect.width - 20; // Account for padding
    this.visibleLines = { from: 0, to: this.totalLines, offset: 0 };
  }

  load(txt = "") {
    this.lines = [...this.segLines.segment(txt)].map((l) => l.segment.replaceAll("\n", ""));
    if (this.lines.length === 0) {
      this.lines.push("");
    }

    this.totalLines = (this.canvas.height / this.options.lineHeight) >> 0;
    this.maxLineWidth = this.elRect.width - 20; // Account for padding
    this.visibleLines = { from: 0, to: this.totalLines, offset: 0 };
    this.selection = {
      isActive: false,
      start: { line: 0, col: 0 }, // Selection start position (logical coordinates)
      end: { line: 0, col: 0 }, // Selection end position (logical coordinates)
      anchor: { line: 0, col: 0 }, // Initial selection point (doesn't move during selection)
    };

    this.wrapLines();
    this.render();
  }

  wrapLines() {
    this.wrappedLines = [];
    this.lineToWrappedMap = [];
    this.wrappedToLineMap = [];

    this.lines.forEach((line, lineIndex) => {
      const wrappedStartIndex = this.wrappedLines.length;
      const wrappedPortions = this.wrapSingleLine(line);

      this.lineToWrappedMap[lineIndex] = {
        start: wrappedStartIndex,
        end: wrappedStartIndex + wrappedPortions.length - 1,
      };

      wrappedPortions.forEach((portion, portionIndex) => {
        this.wrappedLines.push({
          text: portion,
          logicalLine: lineIndex,
          portionIndex: portionIndex,
          totalPortions: wrappedPortions.length,
        });
        this.wrappedToLineMap.push({
          logicalLine: lineIndex,
          portionIndex: portionIndex,
          charStart: this.getCharStartForPortion(line, wrappedPortions, portionIndex),
          charEnd: this.getCharEndForPortion(line, wrappedPortions, portionIndex),
        });
      });
    });
  }

  wrapSingleLine(line) {
    if (!line || line.length === 0) return [""];

    // Ensure font is set for accurate measurements
    this.ctx.font = `${this.options.fontSize}px monospace`;
    this.ctx.letterSpacing = `${this.options.letterSpacing}px`;

    const charWidth = this.ctx.measureText("M").width;
    const maxCharsPerLine = Math.max(10, Math.floor(this.maxLineWidth / charWidth));

    if (line.length <= maxCharsPerLine) {
      return [line];
    }

    const wrappedPortions = [];
    let currentIndex = 0;

    while (currentIndex < line.length) {
      let endIndex = Math.min(currentIndex + maxCharsPerLine, line.length);

      // Try to break at word boundaries if possible
      if (endIndex < line.length) {
        let breakPoint = endIndex;
        for (let i = endIndex - 1; i > currentIndex; i--) {
          if (line[i] === " " || line[i] === "\t") {
            breakPoint = i;
            break;
          }
        }
        // If we found a good break point and it's not too far back, use it
        if (breakPoint !== endIndex && endIndex - breakPoint < maxCharsPerLine * 0.3) {
          endIndex = breakPoint;
        }
      }

      const portion = line.slice(currentIndex, endIndex);
      if (portion.length > 0) {
        wrappedPortions.push(portion);
      }
      currentIndex = endIndex;

      // Skip leading whitespace on continuation lines
      while (currentIndex < line.length && line[currentIndex] === " ") {
        currentIndex++;
      }
    }

    return wrappedPortions.length > 0 ? wrappedPortions : [""];
  }

  getCharStartForPortion(line, portions, portionIndex) {
    // Simple approach: calculate based on cumulative lengths
    let start = 0;
    for (let i = 0; i < portionIndex; i++) {
      start += portions[i].length;
    }
    return Math.min(start, line.length);
  }

  getCharEndForPortion(line, portions, portionIndex) {
    const start = this.getCharStartForPortion(line, portions, portionIndex);
    const end = start + portions[portionIndex].length;
    return Math.min(end, line.length);
  }

  logicalToWrappedPosition(logicalLine, logicalCol) {
    if (!this.lineToWrappedMap || logicalLine >= this.lineToWrappedMap.length) {
      return { wrappedLine: Math.max(0, this.wrappedLines.length - 1), wrappedCol: 0 };
    }

    const wrappedRange = this.lineToWrappedMap[logicalLine];
    if (!wrappedRange) {
      return { wrappedLine: 0, wrappedCol: 0 };
    }

    for (let wrappedIndex = wrappedRange.start; wrappedIndex <= wrappedRange.end; wrappedIndex++) {
      const wrappedInfo = this.wrappedToLineMap[wrappedIndex];
      if (!wrappedInfo) continue;

      if (logicalCol >= wrappedInfo.charStart && logicalCol <= wrappedInfo.charEnd) {
        return {
          wrappedLine: wrappedIndex,
          wrappedCol: logicalCol - wrappedInfo.charStart,
        };
      }
    }

    // If not found, place at end of last wrapped line for this logical line
    const lastWrappedIndex = wrappedRange.end;
    const lastWrappedInfo = this.wrappedToLineMap[lastWrappedIndex];
    if (!lastWrappedInfo) {
      return { wrappedLine: lastWrappedIndex, wrappedCol: 0 };
    }

    return {
      wrappedLine: lastWrappedIndex,
      wrappedCol: Math.min(
        logicalCol - lastWrappedInfo.charStart,
        this.wrappedLines[lastWrappedIndex]?.text.length || 0,
      ),
    };
  }

  wrappedToLogicalPosition(wrappedLine, wrappedCol) {
    if (wrappedLine >= this.wrappedToLineMap.length) {
      return { logicalLine: this.lines.length - 1, logicalCol: this.lines[this.lines.length - 1].length };
    }

    const wrappedInfo = this.wrappedToLineMap[wrappedLine];
    return {
      logicalLine: wrappedInfo.logicalLine,
      logicalCol: wrappedInfo.charStart + wrappedCol,
    };
  }

  render() {
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    this.ctx.font = `${this.options.fontSize}px monospace`;
    this.ctx.letterSpacing = `${this.options.letterSpacing}px`;
    this.ctx.textBaseline = "bottom";
    this.ctx.fillStyle = "#000000";

    this.updateVisibleLines();
    this.cursor.position();

    // Use wrapped lines for rendering
    const wrappedLns = [...this.wrappedLines]
      .slice(this.visibleLines.from, this.visibleLines.to)
      .map((wrappedLine) => wrappedLine.text);

    this.drawSelectedLine(this.cursor.y);
    this.drawSelection(); // Draw selection before text
    wrappedLns.forEach((line, i) => {
      this.ctx.fillText(line, 0, this.options.lineHeight * (i + 1));
    });
    this.drawCursor();
  }

  updateVisibleLines() {
    // Convert logical cursor position to wrapped line position
    const wrappedPos = this.logicalToWrappedPosition(this.cursor.line, this.cursor.col);
    const wrappedLine = wrappedPos.wrappedLine;

    if (this.visibleLines.from > wrappedLine) {
      this.visibleLines.from = wrappedLine;
      this.visibleLines.to = Math.min(this.visibleLines.from + this.totalLines, this.wrappedLines.length);
      this.visibleLines.offset = this.visibleLines.from * this.options.lineHeight;
    }

    if (this.visibleLines.to <= wrappedLine) {
      this.visibleLines.to = wrappedLine + 1;
      this.visibleLines.from = Math.max(0, this.visibleLines.to - this.totalLines);
      this.visibleLines.offset = this.visibleLines.from * this.options.lineHeight;
    }
  }

  drawCursor() {
    const { width, height, x, y } = this.cursor;
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

  drawSelection() {
    if (!this.hasSelection()) return;

    this.ctx.save();
    this.ctx.fillStyle = "#3390ff"; // Selection highlight color
    this.ctx.globalAlpha = 0.3;

    const start = this.selection.start;
    const end = this.selection.end;

    // Convert logical positions to wrapped positions for rendering
    const startWrapped = this.logicalToWrappedPosition(start.line, start.col);
    const endWrapped = this.logicalToWrappedPosition(end.line, end.col);

    if (startWrapped.wrappedLine === endWrapped.wrappedLine) {
      // Single wrapped line selection
      this.drawSingleLineSelection(startWrapped, endWrapped);
    } else {
      // Multi-line selection
      this.drawMultiLineSelection(startWrapped, endWrapped);
    }

    this.ctx.restore();
  }

  drawSingleLineSelection(startWrapped, endWrapped) {
    const wrappedLineIndex = startWrapped.wrappedLine;

    // Check if this wrapped line is visible
    if (wrappedLineIndex < this.visibleLines.from || wrappedLineIndex >= this.visibleLines.to) {
      return;
    }

    const visibleLineIndex = wrappedLineIndex - this.visibleLines.from;
    const y = visibleLineIndex * this.options.lineHeight;

    const wrappedLine = this.wrappedLines[wrappedLineIndex];
    if (!wrappedLine) return;

    const beforeSelection = wrappedLine.text.slice(0, startWrapped.wrappedCol);
    const selectedText = wrappedLine.text.slice(startWrapped.wrappedCol, endWrapped.wrappedCol);

    const startX = beforeSelection.length > 0 ? this.ctx.measureText(beforeSelection).width : 0;
    const selectionWidth = selectedText.length > 0 ? this.ctx.measureText(selectedText).width : 0;

    this.ctx.fillRect(startX, y, selectionWidth, this.options.lineHeight);
  }

  drawMultiLineSelection(startWrapped, endWrapped) {
    for (
      let wrappedLineIndex = startWrapped.wrappedLine;
      wrappedLineIndex <= endWrapped.wrappedLine;
      wrappedLineIndex++
    ) {
      // Check if this wrapped line is visible
      if (wrappedLineIndex < this.visibleLines.from || wrappedLineIndex >= this.visibleLines.to) {
        continue;
      }

      const visibleLineIndex = wrappedLineIndex - this.visibleLines.from;
      const y = visibleLineIndex * this.options.lineHeight;

      const wrappedLine = this.wrappedLines[wrappedLineIndex];
      if (!wrappedLine) continue;

      let startX = 0;
      let width = 0;

      if (wrappedLineIndex === startWrapped.wrappedLine) {
        // First line of selection
        const beforeSelection = wrappedLine.text.slice(0, startWrapped.wrappedCol);
        const selectedText = wrappedLine.text.slice(startWrapped.wrappedCol);

        startX = beforeSelection.length > 0 ? this.ctx.measureText(beforeSelection).width : 0;
        width = selectedText.length > 0 ? this.ctx.measureText(selectedText).width : 0;
      } else if (wrappedLineIndex === endWrapped.wrappedLine) {
        // Last line of selection
        const selectedText = wrappedLine.text.slice(0, endWrapped.wrappedCol);

        startX = 0;
        width = selectedText.length > 0 ? this.ctx.measureText(selectedText).width : 0;
      } else {
        // Middle lines - select entire line
        startX = 0;
        width = wrappedLine.text.length > 0 ? this.ctx.measureText(wrappedLine.text).width : 0;
      }

      this.ctx.fillRect(startX, y, width, this.options.lineHeight);
    }
  }

  // Selection utility methods
  startSelection(line = this.cursor.line, col = this.cursor.col) {
    this.selection.isActive = true;
    this.selection.anchor = { line, col };
    this.selection.start = { line, col };
    this.selection.end = { line, col };
  }

  updateSelection(line = this.cursor.line, col = this.cursor.col) {
    if (!this.selection.isActive) return;

    const anchor = this.selection.anchor;
    const current = { line, col };

    // Determine start and end based on anchor and current position
    if (this.comparePositions(anchor, current) <= 0) {
      this.selection.start = { ...anchor };
      this.selection.end = { ...current };
    } else {
      this.selection.start = { ...current };
      this.selection.end = { ...anchor };
    }
  }

  endSelection() {
    // Keep selection if there's actually something selected
    if (!this.hasSelection()) {
      this.clearSelection();
    }
  }

  clearSelection() {
    this.selection.isActive = false;
    this.selection.start = { line: 0, col: 0 };
    this.selection.end = { line: 0, col: 0 };
    this.selection.anchor = { line: 0, col: 0 };
  }

  hasSelection() {
    return this.selection.isActive && this.comparePositions(this.selection.start, this.selection.end) !== 0;
  }

  comparePositions(pos1, pos2) {
    if (pos1.line !== pos2.line) {
      return pos1.line - pos2.line;
    }
    return pos1.col - pos2.col;
  }

  getSelectedText() {
    if (!this.hasSelection()) return "";

    const start = this.selection.start;
    const end = this.selection.end;

    if (start.line === end.line) {
      // Single line selection
      return this.lines[start.line].slice(start.col, end.col);
    } else {
      // Multi-line selection
      let text = "";
      for (let lineIndex = start.line; lineIndex <= end.line; lineIndex++) {
        const line = this.lines[lineIndex];

        if (lineIndex === start.line) {
          text += line.slice(start.col);
        } else if (lineIndex === end.line) {
          text += line.slice(0, end.col);
        } else {
          text += line;
        }
        if (lineIndex < end.line) {
          text += "\n";
        }
      }
      return text;
    }
  }

  deleteSelection() {
    if (!this.hasSelection()) return;

    const start = this.selection.start;
    const end = this.selection.end;

    if (start.line === end.line) {
      // Single line deletion
      const line = this.lines[start.line];
      this.lines[start.line] = line.slice(0, start.col) + line.slice(end.col);
    } else {
      // Multi-line deletion
      const firstLine = this.lines[start.line].slice(0, start.col);
      const lastLine = this.lines[end.line].slice(end.col);

      // Remove the lines in between
      this.lines.splice(start.line, end.line - start.line + 1, firstLine + lastLine);
    }

    // Move cursor to selection start
    this.cursor.line = start.line;
    this.cursor.col = start.col;

    this.clearSelection();
    this.wrapLines();
  }

  insertChar(ch) {
    // Delete selected text first if there's a selection
    if (this.hasSelection()) {
      this.deleteSelection();
    }

    const line = this.lines[this.cursor.line];
    const before = line.slice(0, this.cursor.col);
    const after = line.slice(this.cursor.col);
    // Normalise inserted characters
    const newLines = [...this.segLines.segment(ch)].map((l) => l.segment);

    this.lines[this.cursor.line] = before + ch + after;

    if (newLines.length > 1) {
      const last = (newLines.at(-1) ?? "") + after;

      this.lines = [...this.segLines.segment(this.getText())].map((l) => l.segment.replaceAll("\n", ""));

      this.cursor.line += newLines.length - 1;
      this.cursor.col = last.length - after.length;
    } else {
      this.cursor.col += ch.length;
    }

    // Re-wrap lines after text change
    this.wrapLines();
  }

  // TIP: with the app menu this is not necessary anymore
  // async openFile() {
  //   try {
  //     const content = await OpenFile();
  //     if (content !== null && content !== "") {
  //       this.load(content);
  //     }
  //   } catch (error) {
  //     console.error("Error opening file:", error);
  //   }
  // }

  async saveFile() {
    try {
      const content = this.getText();
      await SaveFile(content);
    } catch (error) {
      console.error("Error saving file:", error);
    }
  }

  async saveToFile(filePath) {
    try {
      const content = this.getText();
      await SaveToFile(filePath, content);
    } catch (error) {
      console.error("Error saving to file:", error);
    }
  }

  getText() {
    return this.lines.join("\n");
  }
}
