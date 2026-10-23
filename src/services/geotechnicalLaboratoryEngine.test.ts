import { describe, expect, it } from "vitest";
import { executeGeotechnicalLaboratoryTest, listGeotechnicalTestDefinitions } from "./geotechnicalLaboratoryEngine";

const runParams = {
  runId: "GT-RUN-1",
  materialId: "SOIL-1",
  sampleId: "SAMPLE-1",
  operator: "tech-1",
  rawData: {}
};

describe("geotechnical laboratory engine facade", () => {
  it("registers only geotechnical definitions and preserves the full soil sieve result", () => {
    const definitions = listGeotechnicalTestDefinitions();
    expect(definitions.map(definition => definition.id).sort()).toEqual(["GT_ATTERBERG", "GT_CBR", "GT_PROCTOR", "GT_SIEVE_SOIL"]);
    expect(definitions.every(definition => definition.domainId === "geotechnical")).toBe(true);
    expect(definitions.every(definition => definition.active && definition.standard?.status === "Draft")).toBe(true);

    const run = executeGeotechnicalLaboratoryTest("GT_SIEVE_SOIL", {
      ...runParams,
      rawData: { totalSampleMassG: 1000, rows: [{ sieveMm: 2, retainedMassG: 200 }, { sieveMm: 0.063, retainedMassG: 700 }, { sieveMm: 0, retainedMassG: 100 }] }
    });
    expect(run).toMatchObject({
      id: "GT-RUN-1",
      domainId: "geotechnical",
      testDefinitionId: "GT_SIEVE_SOIL",
      status: "Warning",
      verificationStatus: "NEEDS_REVIEW",
      result: { value: 10, unit: "% passing at 0.063 mm" }
    });
    expect(run.calculationDetails).toMatchObject({ finesPercent: 10, massBalanceErrorG: 0 });
    expect((run.calculationDetails as { rows: unknown[] }).rows).toHaveLength(3);
    expect(run.calculationTrace.length).toBeGreaterThan(0);
    expect(run.standard?.status).toBe("Draft");
  });

  it("preserves Proctor observations while labeling the maximum as a measured peak, not a compliance verdict", () => {
    const run = executeGeotechnicalLaboratoryTest("GT_PROCTOR", {
      ...runParams,
      rawData: { moldVolumeCm3: 1000, points: [{ waterContentPercent: 8, wetSampleMassG: 1800 }, { waterContentPercent: 12, wetSampleMassG: 1950 }, { waterContentPercent: 16, wetSampleMassG: 1900 }] }
    });
    expect(run.domainId).toBe("geotechnical");
    expect(run.status).toBe("Warning");
    expect(run.verificationStatus).toBe("NEEDS_REVIEW");
    expect(run.result?.value).toBe(1950 / 1000 / 1.12);
    expect((run.calculationDetails as { points: unknown[] }).points).toHaveLength(3);
    expect(run.approval).toBeUndefined();
  });

  it("returns validation failure rather than calculating invalid geotechnical input", () => {
    const run = executeGeotechnicalLaboratoryTest("GT_PROCTOR", {
      ...runParams,
      rawData: { moldVolumeCm3: 0, points: [{ waterContentPercent: 8, wetSampleMassG: 1800 }] }
    });
    expect(run.status).toBe("Invalid");
    expect(run.validation.valid).toBe(false);
    expect(run.calculationTrace).toEqual([]);
  });

  it("returns an Invalid run for malformed row arrays instead of throwing out of the engine", () => {
    const run = executeGeotechnicalLaboratoryTest("GT_SIEVE_SOIL", {
      ...runParams,
      rawData: { totalSampleMassG: 100, rows: "not-an-array" }
    });
    expect(run.status).toBe("Invalid");
    expect(run.validation.valid).toBe(false);
    expect(run.validation.issues.map(issue => issue.code)).toContain("SOIL_SIEVE_ROWS_INSUFFICIENT");
    expect(run.calculationTrace).toEqual([]);
  });

  it("blocks official execution while only draft geotechnical methods are registered", () => {
    const run = executeGeotechnicalLaboratoryTest("GT_SIEVE_SOIL", {
      ...runParams,
      official: true,
      rawData: { totalSampleMassG: 1000, rows: [{ sieveMm: 2, retainedMassG: 200 }, { sieveMm: 1, retainedMassG: 800 }] }
    });
    expect(run.status).toBe("Blocked");
    expect(run.calculationTrace).toEqual([]);
  });

  it("rejects identifiers outside the geotechnical engine registry", () => {
    expect(() => executeGeotechnicalLaboratoryTest("AGG_SIEVE", { ...runParams, rawData: {} })).toThrow("GEOTECHNICAL_TEST_NOT_REGISTERED:AGG_SIEVE");
  });
});
