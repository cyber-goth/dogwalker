import { describe, expect, it } from "vitest";
import { todayInJerusalem, monthGrid, formatSummary } from "./dates";

describe("dates", () => {
  it("todayInJerusalem maps 2026-10-01T21:30:00Z to 2026-10-02 (IDT UTC+3)", () => {
    expect(todayInJerusalem(new Date("2026-10-01T21:30:00Z"))).toBe("2026-10-02");
  });
  it("monthGrid starts Oct 2026 on Thursday (Mon-first, null pads)", () => {
    const g = monthGrid(2026, 10);
    expect(g[0].slice(0, 3)).toEqual([null, null, null]);
    expect(g[0][3]).toBe("2026-10-01");
  });
  it("formatSummary counts and lists days", () => {
    expect(formatSummary(2026, 10, ["2026-10-01", "2026-10-03"])).toBe(
      "October 2026: 2 visits — 1, 3"
    );
  });
});
