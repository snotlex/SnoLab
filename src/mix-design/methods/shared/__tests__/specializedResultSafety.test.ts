import { describe, expect, it } from "vitest";
import { makeSpecializedResult } from "../specializedMixDesignUtils";

const baseInput: any = {
  moistureSand: 0,
  moistureGravel: 0,
  sandAbsorption: 0,
  gravelAbsorption: 0,
  airContent: 1
};

function resultData(overrides: Record<string, unknown> = {}) {
  return {
    methodId: "test-specialized",
    methodName: "Test specialized mix",
    version: "test",
    cementKg: 300,
    waterKg: 120,
    fineAggregateKg: 900,
    coarseAggregateKg: 1000,
    admixtureKg: 0,
    waterBinderRatio: 0.4,
    freshDensityKgM3: 2320,
    absoluteVolumeL: 1000,
    warnings: [],
    assumptions: [],
    recommendations: [],
    trace: [],
    complianceChecks: [],
    lifecycle: "needs_trial_mix" as const,
    ...overrides
  };
}

describe("shared specialized result safety gates", () => {
  it("blocks a result whose batch-water requirement is negative", () => {
    const result: any = makeSpecializedResult(baseInput, resultData({
      batchWaterKg: -4
    }) as any);

    expect(result.status).toBe("not-supported");
    expect(result.calculationStatus).toBe("blocked");
    expect(result.isValid).toBe(false);
    expect(result.validation.errors.some((error: any) => error.code === "batch_water")).toBe(true);
  });

  it("blocks a result when its filled-volume closure misses the reference by more than 2 L", () => {
    const result: any = makeSpecializedResult(baseInput, resultData({
      absoluteVolumeL: 980
    }) as any);

    expect(result.status).toBe("not-supported");
    expect(result.calculationStatus).toBe("blocked");
    expect(result.isValid).toBe(false);
    expect(result.validation.errors.some((error: any) => error.code === "absolute_volume")).toBe(true);
  });

  it("uses the explicit filled-volume target for pervious concrete rather than requiring 1000 L", () => {
    const result: any = makeSpecializedResult(baseInput, resultData({
      methodId: "pervious-specialized",
      absoluteVolumeL: 800,
      referenceFilledVolumeL: 800
    }) as any);

    expect(result.calculationStatus).toBe("needs_trial_mix");
    expect(result.isValid).toBe(true);
    expect(result.absoluteVolumeCheck.isValid).toBe(true);
  });
});
