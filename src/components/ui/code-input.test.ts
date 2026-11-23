import { describe, expect, it } from "vitest";
import {
  applyBackspace,
  applyInput,
  applyPaste,
  completeCode,
  digitsOnly,
  emptyDigits,
} from "./code-input";

describe("code-input", () => {
  const empty = emptyDigits(6);

  it("keeps only digits", () => {
    expect(digitsOnly(" 12-34 56a")).toBe("123456");
  });

  it("a typed digit fills the box and advances", () => {
    const r = applyInput(empty, 0, "4");
    expect(r.digits[0]).toBe("4");
    expect(r.focus).toBe(1);
  });

  it("ignores letters and clears on empty", () => {
    expect(applyInput(empty, 2, "x").digits).toEqual(empty);
    const filled = ["1", "2", "3", "", "", ""];
    expect(applyInput(filled, 1, "").digits[1]).toBe("");
  });

  it("typing over a filled box keeps the new digit", () => {
    const r = applyInput(["1", "2", "", "", "", ""], 1, "25");
    expect(r.digits[1]).toBe("5");
    expect(r.focus).toBe(2);
  });

  it("autofill of the whole code in one box fills every box", () => {
    const r = applyInput(empty, 0, "246810");
    expect(r.digits.join("")).toBe("246810");
    expect(r.focus).toBe(5);
  });

  it("a pasted full code replaces everything, wherever it lands", () => {
    const r = applyPaste(["9", "", "", "", "", ""], 3, "12 34-56");
    expect(r.digits.join("")).toBe("123456");
    expect(completeCode(r.digits)).toBe("123456");
    expect(r.focus).toBe(5);
  });

  it("a short paste fills forward from the box and is cut at the end", () => {
    const r = applyPaste(empty, 4, "789");
    expect(r.digits[3]).toBe("");
    expect(r.digits[4]).toBe("7");
    expect(r.digits[5]).toBe("8");
  });

  it("backspace clears the box, or steps back when it is empty", () => {
    const d = ["1", "2", "", "", "", ""];
    expect(applyBackspace(d, 1)).toEqual({ digits: ["1", "", "", "", "", ""], focus: 1 });
    expect(applyBackspace(d, 2)).toEqual({ digits: ["1", "", "", "", "", ""], focus: 1 });
    expect(applyBackspace(d, 0).focus).toBe(0);
  });

  it("completeCode is null until every box is filled", () => {
    expect(completeCode(["1", "2", "", "", "", ""])).toBeNull();
  });
});
