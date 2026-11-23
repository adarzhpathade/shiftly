import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Button } from "./Button";
import { ShiftLoader } from "./ShiftLoader";
import { SHIFT_TIMING, afterCross, panelPair, themeColorFor, wordAt } from "./shift-loader-timing";
import { useShiftStages } from "./useShiftStages";

afterEach(cleanup);

const { showDelayMs, inMs, holdMs, exitMs, cycleMs } = SHIFT_TIMING;

describe("shift loader timing rules", () => {
  it("rotates panel pairs through lime, lavender and maroon", () => {
    expect(panelPair(0)).toEqual(["lime", "lav"]);
    expect(panelPair(1)).toEqual(["lav", "ink"]);
    expect(panelPair(2)).toEqual(["ink", "lime"]);
    expect(panelPair(3)).toEqual(["lime", "lav"]);
    expect(themeColorFor(1)).toBe("lav");
  });

  it("swaps the bracket word per cross and wraps", () => {
    const w = ["learn", "build", "level up"];
    expect([0, 1, 2, 3].map((n) => wordAt(w, n))).toEqual(["learn", "build", "level up", "learn"]);
  });

  it("exits only when ready, at the end of the cross", () => {
    expect(afterCross(true)).toBe("exit");
    expect(afterCross(false)).toBe("out");
  });
});

describe("useShiftStages", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("never shows when the page is ready before the delay", () => {
    const onExited = vi.fn();
    const { result, rerender } = renderHook((p: { ready: boolean }) => useShiftStages({ ...p, onExited }), {
      initialProps: { ready: false },
    });
    act(() => vi.advanceTimersByTime(showDelayMs - 50));
    expect(result.current.visible).toBe(false);
    rerender({ ready: true });
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.visible).toBe(false);
    expect(onExited).toHaveBeenCalledTimes(1);
  });

  it("shows after the delay and loops while not ready", () => {
    const { result } = renderHook(() => useShiftStages({ ready: false }));
    act(() => vi.advanceTimersByTime(showDelayMs + 1));
    expect(result.current.visible).toBe(true);
    expect(result.current.cycle).toBe(0);
    act(() => vi.advanceTimersByTime(cycleMs));
    expect(result.current.cycle).toBe(1);
    expect(result.current.crosses).toBeGreaterThanOrEqual(1);
  });

  it("finishes the current cross before the curtain exit", () => {
    const onExited = vi.fn();
    const { result, rerender } = renderHook((p: { ready: boolean }) => useShiftStages({ ...p, onExited }), {
      initialProps: { ready: false },
    });
    act(() => vi.advanceTimersByTime(showDelayMs + 100));
    expect(result.current.stage).toBe("in");
    rerender({ ready: true });
    act(() => vi.advanceTimersByTime(inMs - 100 + 10));
    expect(result.current.stage).toBe("hold");
    expect(onExited).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(holdMs));
    expect(result.current.stage).toBe("exit");
    act(() => vi.advanceTimersByTime(exitMs + 5));
    expect(result.current.visible).toBe(false);
    expect(onExited).toHaveBeenCalledTimes(1);
  });

  it("fades instead of cutting when ready arrives during the slide-out", () => {
    const onExited = vi.fn();
    const { result, rerender } = renderHook((p: { ready: boolean }) => useShiftStages({ ...p, onExited }), {
      initialProps: { ready: false },
    });
    act(() => vi.advanceTimersByTime(showDelayMs + inMs + holdMs + 50));
    expect(result.current.stage).toBe("out");
    rerender({ ready: true });
    act(() => vi.advanceTimersByTime(cycleMs - inMs - holdMs));
    expect(result.current.stage).toBe("fade");
    expect(onExited).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(SHIFT_TIMING.fadeMs + 5));
    expect(result.current.visible).toBe(false);
    expect(onExited).toHaveBeenCalledTimes(1);
  });

  it("uses one still panel with reduced motion and no sweeping stages", () => {
    const { result } = renderHook(() => useShiftStages({ ready: false, reduced: true }));
    act(() => vi.advanceTimersByTime(showDelayMs + 1));
    expect(result.current.stage).toBe("hold");
    act(() => vi.advanceTimersByTime(cycleMs));
    expect(result.current.stage).toBe("hold");
    expect(result.current.cycle).toBe(1);
  });
});

describe("ShiftLoader", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("renders the reduced-motion branch as a status with a still panel", () => {
    render(<ShiftLoader reducedMotion buddy="buddy-2" />);
    expect(screen.queryByRole("status")).toBeNull();
    act(() => vi.advanceTimersByTime(showDelayMs + 1));
    const status = screen.getByRole("status");
    expect(status.getAttribute("data-shift-loader")).toBe("reduced");
    expect(status.getAttribute("aria-busy")).toBe("true");
    expect(status.textContent).toContain("Loading");
    expect(status.textContent).toContain("[learn]");
  });

  it("renders the full sweep when motion is allowed", () => {
    render(<ShiftLoader reducedMotion={false} buddy="buddy-1" />);
    act(() => vi.advanceTimersByTime(showDelayMs + 1));
    expect(screen.getByRole("status").getAttribute("data-shift-loader")).toBe("full");
  });
});

describe("Button loading", () => {
  it("disables, sets aria-busy and keeps the label for width", () => {
    render(<Button loading>Save</Button>);
    const btn = screen.getByRole("button");
    expect(btn.hasAttribute("disabled")).toBe(true);
    expect(btn.getAttribute("aria-busy")).toBe("true");
    expect(btn.textContent).toContain("Save");
  });

  it("is a normal button when not loading", () => {
    render(<Button>Save</Button>);
    const btn = screen.getByRole("button");
    expect(btn.hasAttribute("disabled")).toBe(false);
    expect(btn.getAttribute("aria-busy")).toBeNull();
  });
});
