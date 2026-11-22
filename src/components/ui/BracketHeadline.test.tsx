import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BracketHeadline } from "./BracketHeadline";

describe("BracketHeadline", () => {
  it("wraps [word] segments in the highlight span", () => {
    const { container } = render(
      <BracketHeadline>{"Calm the [angry] caller"}</BracketHeadline>,
    );
    const span = container.querySelector("[data-bracket]");
    expect(span?.textContent).toBe("[angry]");
    expect(span?.className).toContain("text-lav-ink");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Calm the [angry] caller",
    );
  });

  it("supports the paper highlight tone and line breaks", () => {
    const { container } = render(
      <BracketHeadline size="display" highlightTone="paper">
        {"LEVEL\n[5]"}
      </BracketHeadline>,
    );
    expect(container.querySelector("br")).not.toBeNull();
    expect(container.querySelector("[data-bracket]")?.className).toContain(
      "text-paper",
    );
  });
});
