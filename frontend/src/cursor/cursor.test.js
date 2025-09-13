import { beforeEach, describe, expect, test } from "vitest";
import { Cursor } from "./cursor.js";

describe("Cursor", () => {
  let cursor;

  beforeEach(() => {
    const mockEditor = {
      lines: [],
    };
    cursor = new Cursor(mockEditor, 2, 20);
  });

  test("cursor is defined", () => {
    expect(cursor).toBeDefined();
  });

  describe("Cursor.colPrevious", () => {
    test("cursor does not move if in start line and column", () => {
      expect(cursor.col).toEqual(0);
      expect(cursor.line).toEqual(0);

      cursor.colPrevious();

      expect(cursor.col).toEqual(0);
      expect(cursor.line).toEqual(0);
    });
    test("Move cursor to previous column", () => {
      cursor.col = 3;

      cursor.colPrevious();

      expect(cursor.col).toEqual(2);
    });
    test("Move cursor to previous line last column", () => {
      cursor.editor.lines = ["0000000000", ""];
      cursor.col = 0;
      cursor.line = 1;

      cursor.colPrevious();

      expect(cursor.col).toEqual(10);
      expect(cursor.line).toEqual(0);
    });
  });

  describe("Cursor.colNext", () => {
    test("cursor does not move if no lines exist", () => {
      expect(cursor.col).toEqual(0);
      expect(cursor.line).toEqual(0);

      cursor.colNext();

      expect(cursor.col).toEqual(0);
      expect(cursor.line).toEqual(0);
    });
    test("cursor does not move if last line and column is last", () => {
      cursor.col = 11;
      cursor.line = 1;

      cursor.colNext();

      expect(cursor.col).toEqual(11);
      expect(cursor.line).toEqual(1);
    });
    test("Move cursor to next column", () => {
      cursor.editor.lines = ["0000000000"];
      cursor.col = 0;

      cursor.colNext();

      expect(cursor.col).toEqual(1);
    });
    test("Move cursor to next line first column", () => {
      cursor.editor.lines = ["0000000000", "0000000000", ""];
      cursor.col = 11;
      cursor.line = 1;

      cursor.colNext();

      expect(cursor.col).toEqual(0);
      expect(cursor.line).toEqual(2);
    });
  });

  describe("Cursor.linePrevious", () => {
    test("cursor does not move if first line", () => {
      cursor.line = 0;

      cursor.linePrevious();

      expect(cursor.col).toEqual(0);
      expect(cursor.line).toEqual(0);
    });
    test("Move cursor to previous line", () => {
      cursor.editor.lines = ["000", "0000000000", ""];
      cursor.col = 11;
      cursor.line = 1;

      cursor.linePrevious();

      expect(cursor.col).toEqual(3);
      expect(cursor.line).toEqual(0);

      cursor.editor.lines = ["0000000000000", "0000000000", ""];
      cursor.col = 11;
      cursor.line = 1;

      cursor.linePrevious();

      expect(cursor.col).toEqual(11);
      expect(cursor.line).toEqual(0);
    });
  });

  describe("Cursor.lineNext", () => {
    test("cursor does not move if last line", () => {
      cursor.line = 0;
      cursor.col = 0;

      cursor.lineNext(1, 10);

      expect(cursor.col).toEqual(0);
      expect(cursor.line).toEqual(0);
    });
    test("Move cursor to next line", () => {
      cursor.editor.lines = ["00000000000", "0000000000"];
      cursor.col = 11;
      cursor.line = 0;

      cursor.lineNext();

      expect(cursor.col).toEqual(10);
      expect(cursor.line).toEqual(1);

      cursor.editor.lines = ["00000000000", "000000000000"];
      cursor.col = 11;
      cursor.line = 0;

      cursor.lineNext();

      expect(cursor.col).toEqual(11);
      expect(cursor.line).toEqual(1);
    });
  });

  describe("Cursor.position", () => {
    test("Update position", () => {
      expect(cursor).toBeDefined();
    });
  });
});
