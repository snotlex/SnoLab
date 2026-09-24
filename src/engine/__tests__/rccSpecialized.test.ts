import { describe, expect, it } from "vitest";
import { calculateMixDesign } from "../calculateMixDesign";
import { MixDesignInput } from "../types";

const rccInput = (): MixDesignInput => ({
  fck28: 35,
  controlClass: "normal",
  cementType: "CEM I 42.5",
  cementClassStrength: 42.5,
  dMax: 20,
  slump: 0,
  aggregateType: "concasse",
  aggregateQuality: "standard",
  hasPumping: false,
  sandRelativeDensity: 2.65,
  gravelRelativeDensity: 2.68,
  cementDensity: 3100,
  airContent: 1,
  moistureSand: 2,
  moistureGravel: 2,
  sandAbsorption: 1,
  gravelAbsorption: 1,
  finenessModulus: 2.7,
  selectedMethod: "dreux",
  methodId: "auto",
  concreteType: "RCC",
  rccWaterKgM3: 130,
  rccWaterBinderRatio: 0.40,
  rccOptimumMoisturePercent: 5.65,
  rccMaxDryDensityKgM3: 2300,
  rccFineAggregatePercent: 52.5,
  rccCompactionTargetPercent: 98,
  materialsDatabase: [
    { id: "cement-rcc", category: "CEMENT", materialName: "CEM I 42.5" },
    { id: "sand-rcc", category: "AGGREGATE", materialName: "Crushed sand" },
    { id: "gravel-rcc", category: "AGGREGATE", materialName: "Crushed gravel" }
  ]
});

describe("RCC specialized mix design", () => {
  it("routes RCC away from Dreux and calculates a moisture-density starting mix", () => {
    const result = calculateMixDesign(rccInput());

    expect(result.methodId).toBe("rcc-specialized");
    expect(result.methodName).toContain("RCC");
    expect(result.calculationStatus).toBe("needs_trial_mix");
    expect(result.cementKg).toBeCloseTo(325, 6);
    expect(result.fineAggregateKg).toBeCloseTo(1057.6125, 4);
    expect(result.coarseAggregateKg).toBeCloseTo(957.3625, 4);
    expect(result.waterKg).toBeCloseTo(110.25, 4);
    expect(result.wcRatio).toBeCloseTo(110.25 / 325, 6);
    expect(result.absoluteVolumeCheck.deviationPercent).toBeLessThan(2);
  });

  it("blocks RCC when the laboratory moisture-density inputs are missing", () => {
    const input = rccInput();
    delete input.rccMaxDryDensityKgM3;

    const result = calculateMixDesign(input);

    expect(result.calculationStatus).toBe("blocked");
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes("الكثافة الجافة القصوى"))).toBe(true);
  });

  it("does not silently fall back to Dreux for an explicit RCC route", () => {
    const input = rccInput();
    input.methodId = "rcc-specialized";

    const result = calculateMixDesign(input);

    expect(result.methodId).toBe("rcc-specialized");
    expect(result.methodId).not.toBe("dreux-gorisse");
  });
});
