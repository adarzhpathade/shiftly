import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ME_ID, resetMockState } from "@/data/mock";
import { mockTrainingRepo } from "@/data/mock/training";
import { ScenarioPlayer } from "./ScenarioPlayer";

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  const mockMotion = new Proxy(actual.motion, {
    get(_target, prop: string) {
      return ({ children, ...rest }: ComponentPropsWithoutRef<ElementType>) => {
        const Tag = prop as ElementType;
        const validProps: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(rest)) {
          if (
            ![
              "initial",
              "animate",
              "exit",
              "transition",
              "whileTap",
              "whileHover",
            ].includes(key)
          ) {
            validProps[key] = val;
          }
        }
        return <Tag {...validProps}>{children}</Tag>;
      };
    },
  });

  return {
    ...actual,
    AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
    motion: mockMotion,
  };
});

beforeAll(() => {
  if (typeof window !== "undefined" && !window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }
});

describe("ScenarioPlayer", () => {
  afterEach(() => {
    cleanup();
    resetMockState();
  });

  it("executes the full scenario flow through onStart, onAnswer, onFinish to result and replay", async () => {
    const scenario = await mockTrainingRepo.getGuidedScenario("sc-hc-3");
    expect(scenario.steps).toHaveLength(2);

    const onStart = vi.fn(async (scenarioId: string) => {
      const res = await mockTrainingRepo.startAttempt(ME_ID, scenarioId);
      return { ok: true as const, attemptId: res.attemptId, firstStepId: res.firstStepId };
    });

    const onAnswer = vi.fn(async (attemptId: string, stepId: string, choiceId: string) => {
      const res = await mockTrainingRepo.answerStep(ME_ID, attemptId, stepId, choiceId);
      return { ok: true as const, result: res };
    });

    const onFinish = vi.fn(async (attemptId: string) => {
      const res = await mockTrainingRepo.finishAttempt(ME_ID, attemptId);
      return { ok: true as const, result: res };
    });

    render(
      <ScenarioPlayer
        scenario={scenario}
        categoryName="Customer Queries"
        colorToken="sky"
        backHref="/training/customer-queries"
        replayHref="/training/customer-queries/3"
        nextHref="/training/customer-queries/4"
        onStart={onStart}
        onAnswer={onAnswer}
        onFinish={onFinish}
      />,
    );

    // 1. Shows first customer message
    const firstStep = scenario.steps[0]!;
    expect(await screen.findByText(firstStep.customerMessage)).toBeDefined();
    await waitFor(() => expect(onStart).toHaveBeenCalledWith(scenario.id));

    // 2. Click first choice on step 1 -> feedback appears + "Continue" button
    const firstChoice = firstStep.choices[0]!;
    const choice1Btn = screen.getByText(firstChoice.text).closest("button");
    expect(choice1Btn).not.toBeNull();
    fireEvent.click(choice1Btn!);

    const continueBtn = await screen.findByRole("button", { name: /continue/i });
    expect(continueBtn).toBeDefined();
    await waitFor(() => expect(onAnswer).toHaveBeenCalledTimes(1));

    // 3. Click Continue -> loads step 2
    fireEvent.click(continueBtn);

    const secondStep = scenario.steps[1]!;
    expect(await screen.findByText(secondStep.customerMessage)).toBeDefined();

    // 4. Click choice on step 2 -> feedback appears + "See result" button
    const secondChoice = secondStep.choices[0]!;
    const choice2Btn = screen.getByText(secondChoice.text).closest("button");
    expect(choice2Btn).not.toBeNull();
    fireEvent.click(choice2Btn!);

    const seeResultBtn = await screen.findByRole("button", { name: /see result/i });
    expect(seeResultBtn).toBeDefined();
    await waitFor(() => expect(onAnswer).toHaveBeenCalledTimes(2));

    // 5. Click "See result" -> finishes and displays result section
    fireEvent.click(seeResultBtn);
    await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));

    // Result section shows "XP earned", star label, Replay button
    expect(await screen.findByText(/XP earned/i)).toBeDefined();
    expect(screen.getByRole("img", { name: /\d of 3 stars/i })).toBeDefined();

    const replayBtn = screen.getByRole("button", { name: /replay/i });
    expect(replayBtn).toBeDefined();

    // 6. Click Replay -> restarts the scenario
    fireEvent.click(replayBtn);
    expect(await screen.findByText(firstStep.customerMessage)).toBeDefined();
    expect(onStart).toHaveBeenCalledTimes(2);
  });

  it("shows error alert when onStart fails, and retries successfully when Try again is clicked", async () => {
    const scenario = await mockTrainingRepo.getGuidedScenario("sc-hc-1");
    let attemptCount = 0;

    const onStart = vi.fn(async () => {
      attemptCount += 1;
      if (attemptCount === 1) {
        return { ok: false as const, error: "Network error starting scenario." };
      }
      return { ok: true as const, attemptId: "att-retry", firstStepId: scenario.steps[0]!.id };
    });

    const onAnswer = vi.fn();
    const onFinish = vi.fn();

    render(
      <ScenarioPlayer
        scenario={scenario}
        categoryName="Handling Complaints"
        colorToken="peach"
        backHref="/training/handling-complaints"
        replayHref="/training/handling-complaints/1"
        nextHref="/training/handling-complaints/2"
        onStart={onStart}
        onAnswer={onAnswer}
        onFinish={onFinish}
      />,
    );

    // Alert appears with error message
    const alert = await screen.findByRole("alert");
    expect(alert).toBeDefined();
    expect(screen.getByText("Network error starting scenario.")).toBeDefined();

    const tryAgainBtn = screen.getByRole("button", { name: /try again/i });
    expect(tryAgainBtn).toBeDefined();

    // Click "Try again"
    fireEvent.click(tryAgainBtn);

    // Retries successfully and renders first customer message
    expect(await screen.findByText(scenario.steps[0]!.customerMessage)).toBeDefined();
    expect(onStart).toHaveBeenCalledTimes(2);
  });
});
