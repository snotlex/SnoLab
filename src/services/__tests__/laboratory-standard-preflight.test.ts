import { describe, expect, it } from "vitest";
import { executeDefinedLaboratoryTest } from "../laboratoryTestEngine";
import { FRESH_CONCRETE_SLUMP_DEFINITION } from "../concreteTestDefinitions";
import { preflightStandard, standardPreflightIssueMessages } from "../laboratoryRegistry";

describe("laboratory standard preflight", () => {
  it("rejects draft, unknown-version, expired, and unconfigured standards", () => {
    const preflight = preflightStandard({
      organization: "EN",
      code: "EN 12350-2",
      version: "configured by laboratory",
      status: "Draft",
      acceptanceCriteriaConfigured: false,
      effectiveTo: "2025-12-31",
    } as any, new Date("2026-10-01"));

    expect(preflight.ready).toBe(false);
    expect(preflight.errors).toEqual(expect.arrayContaining([
      "STANDARD_VERSION_UNKNOWN",
      "STANDARD_STATUS_DRAFT",
      "ACCEPTANCE_CRITERIA_NOT_CONFIGURED",
      "STANDARD_EXPIRED",
    ]));
    expect(standardPreflightIssueMessages(preflight)).toHaveLength(preflight.errors.length);
  });

  it("blocks an official run before calculation when the definition standard is Draft", () => {
    const run = executeDefinedLaboratoryTest(FRESH_CONCRETE_SLUMP_DEFINITION, {
      runId: "OFFICIAL-DRAFT-1",
      materialId: "CONCRETE-1",
      sampleId: "SAMPLE-1",
      operator: "tech",
      rawData: { coneHeightMm: 300, measuredHeightMm: 220 },
      official: true,
      now: "2026-10-01T00:00:00.000Z",
    });

    expect(run.status).toBe("Blocked");
    expect(run.result).toBeUndefined();
    expect(run.calculationTrace).toHaveLength(0);
    expect(run.validation.valid).toBe(false);
    expect(run.validation.issues.map(issue => issue.code)).toContain("STANDARD_STATUS_DRAFT");
  });

  it("allows an official run with a configured active standard revision", () => {
    const run = executeDefinedLaboratoryTest(FRESH_CONCRETE_SLUMP_DEFINITION, {
      runId: "OFFICIAL-ACTIVE-1",
      materialId: "CONCRETE-1",
      sampleId: "SAMPLE-1",
      operator: "tech",
      rawData: { coneHeightMm: 300, measuredHeightMm: 220 },
      official: true,
      standard: {
        organization: "EN",
        code: "EN 12350-2",
        version: "2026",
        status: "Active",
        source: "laboratory-registry",
        acceptanceCriteriaConfigured: true,
        acceptanceRule: "project-approved-range",
        units: ["mm"],
        coveredTestIds: ["FRESH_SLUMP_PHASE2"],
      } as any,
      now: "2026-10-01T00:00:00.000Z",
    });

    expect(run.status).toBe("Calculated");
    expect(run.result).toMatchObject({ value: 80, unit: "mm" });
  });
});
