import { describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({ coreResult: {} as Record<string, any> }));

vi.mock("../../../engine/dreuxGorisseCorrected", () => ({
  calculateDreuxGorisseCorrected: () => mockState.coreResult
}));

vi.mock("./dreuxGorisseValidation", () => ({
  validateDreuxGorisseInputs: () => ({ isValid: false, errors: [], warnings: [] })
}));

vi.mock("./dreuxGorisseApplicability", () => ({
  checkDreuxGorisseApplicability: () => ({ level: "applicable", reasons: [], recommendations: [] })
}));

import { calculateDreuxGorisse } from "./dreuxGorisseCalculation";

describe("Dreux result adapter fail-closed behavior", () => {
  it("does not turn zero/blocked engine output into plausible density, volume, or added-water values", () => {
    mockState.coreResult = {
      isValid: false,
      valid: false,
      engineStatus: "blocked",
      calculationStatus: "blocked",
      cementWeight: 0,
      waterContentActual: 150,
      effectiveWater: 150,
      batchWaterToAdd: 0,
      waterToAdd: 0,
      totalBinder: 0,
      totalFreshDensity: 0,
      absoluteVolumeTotal: 0,
      volumeClosureError: undefined,
      waterCementRatio: 0,
      waterBinderRatio: 0,
      wcRatio: 0,
      wcRatioAdjusted: 0,
      sandWeightDry: 0,
      gravelWeightDry: 0,
      sandPercent: 0,
      admixtureWeights: [],
      detailedSteps: [],
      warnings: ["Missing/invalid inputs"],
      errors: ["Core calculation blocked"],
      fcm28: 0,
      stdDev: 0,
      dreuxAggregateFactor: 0,
      compactorGamma: 0
    };

    const result = calculateDreuxGorisse({ concreteType: "NSC" } as any);

    expect(result.status).toBe("not-supported");
    expect(result.quantities.addedWater).toBe(0);
    expect(result.freshDensityKgM3).toBe(0);
    expect(result.physicalProperties.theoreticalFreshDensity).toBe(0);
    expect(result.physicalProperties.absoluteVolume).toBe(0);
    expect(result.physicalProperties.volumeClosureError).toBe(1000);
  });
});
