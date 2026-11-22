import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import OfflinePage from "./page";

describe("Offline page", () => {
  it("renders the headline and retry button", () => {
    render(<OfflinePage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /you're \[offline\]/i }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: /try again/i })).toBeTruthy();
  });
});
