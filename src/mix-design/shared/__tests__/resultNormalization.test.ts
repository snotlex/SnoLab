import { describe, expect, it } from "vitest";
import { normalizeMixDesignResult, roundToPrecision } from "../resultNormalization";

describe("result normalization safety", () => {
  it("blocks non-finite final and intermediate values without replacing them with zero", () => {
    const result: any = {
      methodId: "test-method",
      cementWeight: Number.NaN,
      calculationTrace: [{ stepId: "volume", output: { absoluteVolume: Number.POSITIVE_INFINITY } }],
      validation: { isValid: true, errors: [], warnings: [] },
    };

    const normalized: any = normalizeMixDesignResult(result, { fck28: 30 });

    expect(normalized.status).toBe("blocked");
    expect(normalized.calculationStatus).toBe("blocked");
    expect(normalized.engineStatus).toBe("blocked");
    expect(normalized.isValid).toBe(false);
    expect(normalized.valid).toBe(false);
    expect(normalized.nonFiniteFields).toEqual([
      "cementWeight",
      "calculationTrace[0].output.absoluteVolume",
    ]);
    expect(normalized.cementWeight).toBe(0);
    expect(normalized.rawResult.cementWeight).toBeNaN();
    expect(normalized.rawResult.calculationTrace[0].output.absoluteVolume).toBe(Infinity);
    expect(normalized.validation.errors[0]).toMatchObject({
      code: "NON_FINITE_RESULT",
      field: "cementWeight",
    });
  });

  it("preserves non-finite values when rounding instead of converting them to zero", () => {
    expect(roundToPrecision(Number.NaN)).toBeNaN();
    expect(roundToPrecision(Number.POSITIVE_INFINITY)).toBe(Infinity);
    expect(roundToPrecision(12.345, 2)).toBe(12.35);
  });
});
