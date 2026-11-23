// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock server-only before importing index
vi.mock("server-only", () => ({}));

// Mock db
const mockUserFindUnique = vi.fn();
const mockCoachNoteFindUnique = vi.fn();
const mockCoachNoteUpsert = vi.fn();
const mockCoachNoteCreate = vi.fn();
const mockCoachNoteUpdate = vi.fn();
const mockActivityEventFindMany = vi.fn();

vi.mock("@/server/db", () => ({
  db: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
    coachNote: {
      findUnique: (...args: unknown[]) => mockCoachNoteFindUnique(...args),
      upsert: (...args: unknown[]) => mockCoachNoteUpsert(...args),
      create: (...args: unknown[]) => mockCoachNoteCreate(...args),
      update: (...args: unknown[]) => mockCoachNoteUpdate(...args),
    },
    activityEvent: {
      findMany: (...args: unknown[]) => mockActivityEventFindMany(...args),
    },
  },
}));

// Mock ai module
const mockGenerateCoachNote = vi.fn();
vi.mock("./ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./ai")>();
  return {
    ...actual,
    generateCoachNote: (...args: unknown[]) => mockGenerateCoachNote(...args),
  };
});

import { getCoachNote, resetCoachAttemptsForTests } from "./index";

describe("getCoachNote", () => {
  const validUserId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
    resetCoachAttemptsForTests();
    delete process.env.AI_MODE;

    // Default: user exists
    mockUserFindUnique.mockResolvedValue({ id: validUserId });
    mockActivityEventFindMany.mockResolvedValue([]);
  });

  it("throws an error when user is unknown", async () => {
    mockUserFindUnique.mockResolvedValue(null);

    await expect(getCoachNote("non-existent-user")).rejects.toThrow(
      "User not found: non-existent-user",
    );
  });

  it("returns cached ai note immediately without calling AI generation", async () => {
    const existingAiRow = {
      id: "note-1",
      userId: validUserId,
      isoWeek: "2026-W48",
      text: "Line 1\nLine 2\nLine 3",
      source: "ai",
      createdAt: new Date("2026-11-23T10:00:00.000Z"),
    };

    mockCoachNoteFindUnique.mockResolvedValue(existingAiRow);

    const note = await getCoachNote(validUserId);

    expect(note.source).toBe("ai");
    expect(note.lines).toEqual(["Line 1", "Line 2", "Line 3"]);
    expect(mockGenerateCoachNote).not.toHaveBeenCalled();
  });

  it("upgrades a rules note to ai when AI succeeds", async () => {
    // Existing rules note from yesterday
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingRulesRow = {
      id: "note-2",
      userId: validUserId,
      isoWeek: "2026-W48",
      text: "Rules 1\nRules 2\nRules 3",
      source: "rules",
      createdAt: yesterday,
    };

    mockCoachNoteFindUnique.mockResolvedValue(existingRulesRow);
    mockGenerateCoachNote.mockResolvedValue({
      lines: ["AI Line 1", "AI Line 2", "AI Line 3"],
      source: "ai",
    });

    mockCoachNoteUpsert.mockImplementation(({ create }: { create: { text: string; source: string; isoWeek: string } }) =>
      Promise.resolve({
        id: "note-2",
        userId: validUserId,
        isoWeek: create.isoWeek,
        text: create.text,
        source: "ai",
        createdAt: new Date(),
      }),
    );

    const note = await getCoachNote(validUserId);

    expect(note.source).toBe("ai");
    expect(note.lines).toEqual(["AI Line 1", "AI Line 2", "AI Line 3"]);
    expect(mockCoachNoteUpsert).toHaveBeenCalled();
  });

  it("falls back to rules note when AI generation fails and no row exists", async () => {
    mockCoachNoteFindUnique.mockResolvedValue(null);

    // AI fails and returns rules note
    mockGenerateCoachNote.mockResolvedValue({
      lines: ["Fallback 1", "Fallback 2", "Fallback 3"],
      source: "rules",
    });

    mockCoachNoteCreate.mockImplementation(({ data }: { data: { text: string; source: string; isoWeek: string } }) =>
      Promise.resolve({
        id: "note-new",
        userId: validUserId,
        isoWeek: data.isoWeek,
        text: data.text,
        source: "rules",
        createdAt: new Date(),
      }),
    );

    const note = await getCoachNote(validUserId);

    expect(note.source).toBe("rules");
    expect(note.lines).toEqual(["Fallback 1", "Fallback 2", "Fallback 3"]);
    expect(mockCoachNoteCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source: "rules",
        }),
      }),
    );
  });

  it("enforces the once-per-day attempt limit: does not call AI if attempted today", async () => {
    // Existing rules note created earlier today
    const existingRulesRowToday = {
      id: "note-3",
      userId: validUserId,
      isoWeek: "2026-W48",
      text: "Rules line 1\nRules line 2\nRules line 3",
      source: "rules",
      createdAt: new Date(), // today!
    };

    mockCoachNoteFindUnique.mockResolvedValue(existingRulesRowToday);

    const note = await getCoachNote(validUserId);

    // Should return existing rules note without attempting AI
    expect(note.source).toBe("rules");
    expect(note.lines).toEqual([
      "Rules line 1",
      "Rules line 2",
      "Rules line 3",
    ]);
    expect(mockGenerateCoachNote).not.toHaveBeenCalled();
  });

  it("returns rules when AI_MODE=mock", async () => {
    process.env.AI_MODE = "mock";
    mockCoachNoteFindUnique.mockResolvedValue(null);

    // AI returns rules in mock mode
    mockGenerateCoachNote.mockResolvedValue({
      lines: ["Mock 1", "Mock 2", "Mock 3"],
      source: "rules",
    });

    mockCoachNoteCreate.mockImplementation(({ data }: { data: { text: string; source: string; isoWeek: string } }) =>
      Promise.resolve({
        id: "note-mock",
        userId: validUserId,
        isoWeek: data.isoWeek,
        text: data.text,
        source: "rules",
        createdAt: new Date(),
      }),
    );

    const note = await getCoachNote(validUserId);

    expect(note.source).toBe("rules");
    expect(note.lines).toEqual(["Mock 1", "Mock 2", "Mock 3"]);
  });
});
