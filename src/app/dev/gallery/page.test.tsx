import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GalleryPage from "./page";

describe("Dev gallery page", () => {
  it("renders every section without crashing", () => {
    const { container } = render(<GalleryPage />);
    expect(container.querySelectorAll("section").length).toBeGreaterThan(8);
    // Gradient ids stay unique across repeated objects.
    const ids = Array.from(container.querySelectorAll("[id]")).map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
