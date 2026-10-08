import { describe, expect, it } from "vitest";
import { evaluateProductionRelease } from "./productionReleaseGate";

const project = (status?: "PASSED" | "FAILED", lifecycleStatus?: string, reviewed = false) => ({
  id: "P-1", name: "Project", client: "Client", plant: "Plant", createdDate: "2026-01-01",
  inputs: {}, validationRecords: status ? [{ status, ...(reviewed ? { review: { decision: "APPROVED", reviewerId: "reviewer-1", reviewerName: "Reviewer", reviewedAt: "2026-01-01T01:00:00.000Z" } } : {}) } as any] : [], mixLifecycleStatus: lifecycleStatus
} as any);

const valid = { isValidForReport: true, criticalErrors: [], warnings: [] };
const result = { valid: true, isValid: true } as any;

describe("production release gate", () => {
  it("blocks a numerically valid mix without a passed trial mix", () => {
    const decision = evaluateProductionRelease(project(), result, valid);
    expect(decision.canRelease).toBe(false);
    expect(decision.reasons).toContain("passed_trial_mix_missing");
  });

  it("blocks unresolved engineering warnings", () => {
    const decision = evaluateProductionRelease(project("PASSED"), result, { ...valid, warnings: ["moisture"] });
    expect(decision.canRelease).toBe(false);
    expect(decision.reasons).toContain("unresolved_engineering_warnings");
  });

  it("allows production release only after all gates and trial mix pass", () => {
    expect(evaluateProductionRelease(project("PASSED", "performance-verified", true), result, valid)).toEqual({ canRelease: true, reasons: [] });
  });

  it("blocks a passed trial mix until a laboratory reviewer approves it", () => {
    const decision = evaluateProductionRelease(project("PASSED", "performance-verified"), result, valid);
    expect(decision.canRelease).toBe(false);
    expect(decision.reasons).toContain("laboratory_review_missing");
  });
});
