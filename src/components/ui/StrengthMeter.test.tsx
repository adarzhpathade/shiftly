import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StrengthMeter } from "./StrengthMeter";

describe("StrengthMeter", () => {
  afterEach(cleanup);

  it("exposes the level and the friendly text", () => {
    render(<StrengthMeter level={2} text="Good. Add numbers or symbols to make it stronger." />);
    const meter = screen.getByRole("meter", { name: "Password strength" });
    expect(meter.getAttribute("aria-valuenow")).toBe("2");
    expect(meter.getAttribute("aria-valuetext")).toContain("Good");
    expect(screen.getByText(/Good\. Add numbers/).getAttribute("aria-live")).toBe("polite");
  });

  it("fills further at higher levels", () => {
    const { container, rerender } = render(<StrengthMeter level={1} text="x" />);
    const fill = () => (container.querySelector("span[style*='width']") as HTMLElement).style.width;
    expect(fill()).toBe("34%");
    rerender(<StrengthMeter level={3} text="x" />);
    expect(fill()).toBe("100%");
  });
});
