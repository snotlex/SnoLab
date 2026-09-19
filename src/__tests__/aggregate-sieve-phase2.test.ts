import { describe, expect, it } from "vitest";
import { calculateSieveAnalysis } from "../services/aggregateSieveAnalysis";
import { executeDefinedLaboratoryTest } from "../services/laboratoryTestEngine";
import { SIEVE_ANALYSIS_DEFINITION } from "../services/laboratoryTestDefinitions";

const validInput = {
  totalSampleMassG: 1000,
  finesSieveMm: 0.063,
  massBalanceToleranceG: 1,
  sieves: [
    { sieveMm: 4, retainedMassG: 20 },
    { sieveMm: 2, retainedMassG: 130 },
    { sieveMm: 1, retainedMassG: 210 },
    { sieveMm: 0.5, retainedMassG: 290 },
    { sieveMm: 0.25, retainedMassG: 220 },
    { sieveMm: 0.125, retainedMassG: 90 },
    { sieveMm: 0.063, retainedMassG: 30 },
    { sieveMm: 0, retainedMassG: 10 }
  ]
};

describe("Phase 2A aggregate sieve analysis", () => {
  it("calculates rows, mass balance, fineness modulus and fines without fallbacks", () => {
    const result = calculateSieveAnalysis(validInput);
    expect(result.validation.valid).toBe(true);
    expect(result.massBalanceValid).toBe(true);
    expect(result.massBalanceErrorG).toBe(0);
    expect(result.finenessModulus).toBe(3.01);
    expect(result.finesContentPercent).toBe(1);
    expect(result.rows).toHaveLength(8);
    expect(result.trace.length).toBeGreaterThanOrEqual(3);
  });

  it("blocks a mass-balance failure instead of normalizing it away", () => {
    const result = calculateSieveAnalysis({
      ...validInput,
      sieves: validInput.sieves.map(row => row.sieveMm === 0 ? { ...row, retainedMassG: 40 } : row)
    });
    expect(result.massBalanceValid).toBe(false);
    expect(result.validation.valid).toBe(false);
    expect(result.validation.issues.map(item => item.code)).toContain("MASS_BALANCE_FAILED");
  });

  it("reports missing fines and characteristic sizes as warnings, not fabricated values", () => {
    const result = calculateSieveAnalysis({
      ...validInput,
      sieves: [
        { sieveMm: 14, retainedMassG: 200 },
        { sieveMm: 10, retainedMassG: 800 }
      ],
      massBalanceToleranceG: 0
    });
    expect(result.validation.valid).toBe(true);
    expect(result.finesContentPercent).toBeUndefined();
    expect(result.finenessModulus).toBeUndefined();
    expect(result.dMaxMm).toBeUndefined();
    expect(result.validation.issues.map(item => item.code)).toEqual(expect.arrayContaining([
      "FM_INCOMPLETE_SIEVE_SERIES",
      "FINES_RESULT_UNAVAILABLE",
      "DMAX_UNAVAILABLE"
    ]));
  });

  it("runs through the shared Phase 1 engine with a trace", () => {
    const run = executeDefinedLaboratoryTest(SIEVE_ANALYSIS_DEFINITION, {
      runId: "RUN-SIEVE-PHASE2",
      materialId: "MAT-SAND-1",
      sampleId: "SMP-SAND-1",
      operator: "lab-tech",
      rawData: validInput,
      standard: { organization: "EN", code: "EN 933-1", version: "2026", status: "Active" },
      now: "2026-09-19T00:00:00.000Z"
    });
    expect(run.status).toBe("Calculated");
    expect(run.calculationTrace.length).toBeGreaterThanOrEqual(3);
    expect(run.result?.value).toBe(3.01);
  });
});
