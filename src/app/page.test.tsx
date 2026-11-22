import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home page", () => {
  it("renders the placeholder headline and button", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /shiftly is \[loading\]/i,
      }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: /get started/i })).toBeTruthy();
  });
});
