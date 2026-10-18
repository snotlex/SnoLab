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
    { id: "gravel-rcc", category: "AGGREGATE", materialName: "Crushed gravel" },
    { id: "water-rcc", category: "WATER", materialName: "Potable water", density: 1000 }
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
    expect(result.coarseAggregateKg).toBeCloseTo(956.8875, 4);
    expect(result.waterKg).toBeCloseTo(110.25, 4);
    // waterKg is batch water to add; W/C uses the effective design water that set the binder demand.
    expect(result.wcRatio).toBeCloseTo(130 / 325, 6);
    expect(result.ratios?.waterCementRatio).toBeCloseTo(130 / 325, 6);
    expect(result.absoluteVolumeCheck.deviationPercent).toBeLessThan(2);
    expect(result.materialSuitability?.status).toBe("approved");
  });

  it("blocks RCC when absolute-volume closure is outside tolerance", () => {
    const input = rccInput();
    // A relative aggregate density of 0.8 is not representative of these aggregates and
    // produces an absolute-volume balance far outside the method's 2% release envelope.
    input.sandRelativeDensity = 0.8;
    input.gravelRelativeDensity = 0.8;

    const result = calculateMixDesign(input);

    expect(result.calculationStatus).toBe("blocked");
    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.includes("2%"))).toBe(true);
  });

  it("blocks RCC when missing aggregate densities make volume closure non-finite", () => {
    const input = rccInput();
    delete input.sandRelativeDensity;

    const result = calculateMixDesign(input);

    expect(result.calculationStatus).toBe("blocked");
    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.includes("كثافة sand") || error.includes("كثافات المواد"))).toBe(true);
  });

  it("blocks RCC when the laboratory moisture-density inputs are missing", () => {
    const input = rccInput();
    delete input.rccMaxDryDensityKgM3;

    const result = calculateMixDesign(input);

    expect(result.calculationStatus).toBe("blocked");
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes("الكثافة الجافة القصوى"))).toBe(true);
  });

  it("blocks RCC when the declared relative compaction target is missing or outside the allowed envelope", () => {
    const missing = rccInput();
    delete missing.rccCompactionTargetPercent;
    const missingResult = calculateMixDesign(missing);
    expect(missingResult.calculationStatus).toBe("blocked");
    expect(missingResult.errors.some((e) => e.includes("هدف الرص النسبي"))).toBe(true);

    const invalid = rccInput();
    invalid.rccCompactionTargetPercent = 120;
    const invalidResult = calculateMixDesign(invalid);
    expect(invalidResult.calculationStatus).toBe("blocked");
    expect(invalidResult.errors.some((e) => e.includes("90%"))).toBe(true);
  });

  it("does not silently fall back to Dreux for an explicit RCC route", () => {
    const input = rccInput();
    input.methodId = "rcc-specialized";

    const result = calculateMixDesign(input);

    expect(result.methodId).toBe("rcc-specialized");
    expect(result.methodId).not.toBe("dreux-gorisse");
  });
});
