import { describe, expect, it } from "vitest";
import {
  calculateProctor,
  calculateSoilSieve,
  validateProctorInput,
  validateSoilSieveInput
} from "./geotechnicalTestEngine";
import type { ProctorInput, SoilSieveInput } from "./geotechnicalTestEngine";

describe("geotechnical calculation engine input safety", () => {
  it("returns validation issues for non-array Sieve rows instead of throwing", () => {
    const input = { totalSampleMassG: 100, rows: "not-an-array" } as unknown as SoilSieveInput;
    expect(validateSoilSieveInput(input).map(issue => issue.code)).toContain("SOIL_SIEVE_ROWS_INSUFFICIENT");
    expect(() => calculateSoilSieve(input)).toThrow("SOIL_SIEVE_ROWS_INSUFFICIENT");
  });

  it("reports malformed Sieve row objects and continues validating the other rows", () => {
    const input = {
      totalSampleMassG: 100,
      rows: [null, { sieveMm: 1, retainedMassG: 20 }]
    } as unknown as SoilSieveInput;
    const issues = validateSoilSieveInput(input);
    expect(issues.map(issue => issue.code)).toContain("SOIL_SIEVE_ROW_INVALID");
    expect(issues.some(issue => issue.code === "SOIL_SIEVE_MASS_INVALID")).toBe(false);
  });

  it("returns validation issues for non-array Proctor points instead of throwing", () => {
    const input = { moldVolumeCm3: 100, points: {} } as unknown as ProctorInput;
    expect(validateProctorInput(input).map(issue => issue.code)).toContain("PROCTOR_POINTS_INSUFFICIENT");
    expect(() => calculateProctor(input)).toThrow("PROCTOR_POINTS_INSUFFICIENT");
  });

  it("reports malformed Proctor points without aborting validation", () => {
    const input = {
      moldVolumeCm3: 100,
      points: [null, { waterContentPercent: 10, wetSampleMassG: 120 }, { waterContentPercent: 15, wetSampleMassG: 130 }]
    } as unknown as ProctorInput;
    expect(validateProctorInput(input).map(issue => issue.code)).toContain("PROCTOR_POINT_INVALID");
  });

  it("detects empty slots in sparse Sieve and Proctor arrays", () => {
    const sieve = { totalSampleMassG: 100, rows: new Array(2) } as unknown as SoilSieveInput;
    const proctor = { moldVolumeCm3: 100, points: new Array(3) } as unknown as ProctorInput;
    expect(validateSoilSieveInput(sieve).filter(issue => issue.code === "SOIL_SIEVE_ROW_INVALID")).toHaveLength(2);
    expect(validateProctorInput(proctor).filter(issue => issue.code === "PROCTOR_POINT_INVALID")).toHaveLength(3);
  });
});

describe("geotechnical calculation invariants", () => {
  it("sorts sieve rows by aperture and computes measured retained, cumulative, and passing percentages", () => {
    const result = calculateSoilSieve({
      totalSampleMassG: 1100,
      washLossMassG: 100,
      rows: [
        { sieveMm: 0, retainedMassG: 100 },
        { sieveMm: 0.063, retainedMassG: 700 },
        { sieveMm: 2, retainedMassG: 200 }
      ]
    });

    expect(result.rows.map(row => row.sieveMm)).toEqual([2, 0.063, 0]);
    expect(result.rows[0].percentRetained).toBeCloseTo(200 / 1100 * 100);
    expect(result.rows[1].percentRetained).toBeCloseTo(700 / 1100 * 100);
    expect(result.rows[2].percentRetained).toBeCloseTo(100 / 1100 * 100);
    expect(result.rows[0].cumulativePercentRetained).toBeCloseTo(200 / 1100 * 100);
    expect(result.rows[1].cumulativePercentRetained).toBeCloseTo(900 / 1100 * 100);
    expect(result.rows[2].cumulativePercentRetained).toBeCloseTo(1000 / 1100 * 100);
    expect(result.rows[0].percentPassing).toBeCloseTo(100 - 200 / 1100 * 100);
    expect(result.rows[1].percentPassing).toBeCloseTo(100 - 900 / 1100 * 100);
    expect(result.rows[2].percentPassing).toBeCloseTo(100 - 1000 / 1100 * 100);
    expect(result.finesPercent).toBeCloseTo(100 - 900 / 1100 * 100);
    expect(result.massBalanceErrorG).toBe(0);
  });

  it("keeps Proctor optimum moisture tied to the measured point with maximum dry density", () => {
    const result = calculateProctor({
      moldVolumeCm3: 1000,
      points: [
        { waterContentPercent: 8, wetSampleMassG: 1800 },
        { waterContentPercent: 12, wetSampleMassG: 1950 },
        { waterContentPercent: 16, wetSampleMassG: 1900 }
      ]
    });

    expect(result.points.map(point => point.dryDensityGPerCm3)).toEqual([
      1800 / 1000 / 1.08,
      1950 / 1000 / 1.12,
      1900 / 1000 / 1.16
    ]);
    expect(result.maximumDryDensityGPerCm3).toBe(result.points[1].dryDensityGPerCm3);
    expect(result.optimumMoisturePercent).toBe(12);
  });

  it("does not invent a fines value when the 0.063 mm sieve was not measured", () => {
    const result = calculateSoilSieve({
      totalSampleMassG: 100,
      rows: [{ sieveMm: 2, retainedMassG: 40 }, { sieveMm: 0.5, retainedMassG: 60 }]
    });
    expect(result.finesPercent).toBeUndefined();
  });
});
