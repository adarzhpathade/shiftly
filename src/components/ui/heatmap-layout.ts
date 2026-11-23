/** Pure layout and level helpers for `Heatmap`. No React. */

export type HeatCell = {
  /** "YYYY-MM-DD". */
  date: string;
  count: number;
};

/** ISO weekday of a "YYYY-MM-DD" date: 1 (Mon) to 7 (Sun). */
export function isoWeekday(date: string): number {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const js = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return js === 0 ? 7 : js;
}

/** 0 = nothing, 1 = once, 2 = twice, 3 = three or more. */
export function heatLevel(count: number): 0 | 1 | 2 | 3 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  return 3;
}

export type GridSlot = HeatCell | null;

/**
 * Cells laid out column per week, Monday first: blanks pad the first week so every cell sits
 * on its real weekday row.
 */
export function gridLayout(cells: readonly HeatCell[]): { slots: GridSlot[]; columns: number } {
  if (cells.length === 0) return { slots: [], columns: 0 };
  const pad = isoWeekday((cells[0] as HeatCell).date) - 1;
  const slots: GridSlot[] = [...Array.from({ length: pad }, () => null), ...cells];
  const columns = Math.ceil(slots.length / 7);
  while (slots.length < columns * 7) slots.push(null);
  return { slots, columns };
}

export function activeDays(cells: readonly HeatCell[]): number {
  return cells.filter((c) => c.count > 0).length;
}
