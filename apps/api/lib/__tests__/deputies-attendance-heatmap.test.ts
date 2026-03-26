import { describe, it, expect } from "vitest";
import { computeScoreAndStatus } from "../attendance-scoring";

describe("computeScoreAndStatus", () => {
  it("returns NO_ACTIVITY when parliament is closed", () => {
    const result = computeScoreAndStatus({
      acteur_ref: "PA1",
      date: "2026-01-01",
      total_sittings: 0,
      attended_sittings: 0,
      total_votes: 0,
      participated_votes: 0,
      has_excused_absence: false,
      parliament_open: false
    });
    expect(result.status).toBe("NO_ACTIVITY");
    expect(result.score).toBe(0);
  });

  it("returns FULL for 100% attendance and votes", () => {
    const result = computeScoreAndStatus({
      acteur_ref: "PA1",
      date: "2026-01-01",
      total_sittings: 2,
      attended_sittings: 2,
      total_votes: 10,
      participated_votes: 10,
      has_excused_absence: false,
      parliament_open: true
    });
    expect(result.status).toBe("FULL");
    expect(result.score).toBe(100);
  });

  it("returns PARTIAL for mixed attendance", () => {
    const result = computeScoreAndStatus({
      acteur_ref: "PA1",
      date: "2026-01-01",
      total_sittings: 2,
      attended_sittings: 1,
      total_votes: 10,
      participated_votes: 5,
      has_excused_absence: false,
      parliament_open: true
    });
    expect(result.status).toBe("PARTIAL");
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(95);
  });

  it("returns ABSENT when no sittings or votes despite parliament open", () => {
    const result = computeScoreAndStatus({
      acteur_ref: "PA1",
      date: "2026-01-01",
      total_sittings: 1,
      attended_sittings: 0,
      total_votes: 3,
      participated_votes: 0,
      has_excused_absence: false,
      parliament_open: true
    });
    expect(result.status).toBe("ABSENT");
  });

  it("returns EXCUSED when only excused absences", () => {
    const result = computeScoreAndStatus({
      acteur_ref: "PA1",
      date: "2026-01-01",
      total_sittings: 1,
      attended_sittings: 0,
      total_votes: 0,
      participated_votes: 0,
      has_excused_absence: true,
      parliament_open: true
    });
    expect(result.status).toBe("EXCUSED");
  });
});

