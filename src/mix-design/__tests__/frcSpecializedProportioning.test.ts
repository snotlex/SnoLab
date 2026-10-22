import { describe, expect, it } from "vitest";
import { calculateMixDesign } from "../../engine/calculateMixDesign";
import { createTestInput } from "../../__tests__/testHelper";

describe("FRC specialized proportioning", () => {
  it("routes FRC away from Dreux and closes absolute volume with explicit fibers", () => {
    const result: any = calculateMixDesign(createTestInput({
      concreteType: "FRC",
      dMax: 16,
      frcWaterKgM3: 160,
      frcWaterBinderRatio: 0.40,
      frcFiberVolumePercent: 1.0,
      fiberType: "steel",
      fiberDensity: 7850,
      selectedFiberName: "Steel Fiber"
    }));
    expect(result.methodId).toBe("fiber-reinforced-specialized");
    expect(result.calculationStatus).toBe("needs_trial_mix");
    expect(result.fiberKg).toBeGreaterThan(0);
    expect(result.absoluteVolumeTotal).toBeCloseTo(1000, 2);
    expect(result.quantities.totalBinder).toBeCloseTo(400, 6);
  });

  it("keeps theoretical design density on the effective-water basis under aggregate moisture correction", () => {
    const result: any = calculateMixDesign(createTestInput({
      concreteType: "FRC",
      dMax: 16,
      frcWaterKgM3: 160,
      frcWaterBinderRatio: 0.40,
      frcFiberVolumePercent: 1.0,
      fiberType: "steel",
      fiberDensity: 7850,
      selectedFiberName: "Steel Fiber",
      moistureSand: 5,
      sandAbsorption: 1,
      moistureGravel: 4,
      gravelAbsorption: 1
    }));

    const designedMass =
      result.cementKg + (result.scmKg || 0) + result.fineAggregateKg +
      result.coarseAggregateKg + result.waterKg + result.admixtureKg +
      (result.fiberKg || 0) + (result.quartzPowderKg || 0);
    expect(result.freshDensityKgM3).toBeCloseTo(designedMass, 6);
    expect(result.waterToAdd).not.toBeCloseTo(result.waterKg, 3);
  });

  it("blocks an out-of-envelope fiber volume instead of inventing a result", () => {
    const result: any = calculateMixDesign(createTestInput({
      concreteType: "FRC",
      frcWaterKgM3: 160,
      frcWaterBinderRatio: 0.40,
      frcFiberVolumePercent: 6.0,
      fiberDensity: 7850,
      selectedFiberName: "Steel Fiber"
    }));
    expect(result.calculationStatus).toBe("blocked");
    expect(result.isValid).toBe(false);
  });
});
