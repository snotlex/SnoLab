import { describe, expect, it } from "vitest";
import { calculateMixDesign } from "../../engine/calculateMixDesign";
import { createTestInput } from "../../__tests__/testHelper";
import { validateHscHpcInputs } from "../methods/hsc-hpc/hscHpcMixDesign";

describe("HSC/HPC specialized mix-design engine", () => {
  it("routes HSC automatically to the high-strength engine", () => {
    const result: any = calculateMixDesign(createTestInput({
      concreteType: "HSC",
      fck28: 55,
      slump: 8,
      dMax: 20,
      dosageSuper: 1.2,
      dosageSilicaFume: 7.5
    }));

    expect(result.methodId).toBe("hsc-hpc-specialized");
    expect(result.status).toBe("success");
    expect(result.isValid).toBe(true);
    expect(result.calculationStatus).toBe("needs_trial_mix");
    expect(result.cementKg).toBeGreaterThan(0);
    expect(result.scmKg).toBeGreaterThan(0);
    expect(result.quantities?.totalBinder).toBeGreaterThanOrEqual(420);
    expect(result.quantities?.totalBinder).toBeLessThanOrEqual(650);
    expect(result.wcRatio).toBeGreaterThanOrEqual(0.22);
    expect(result.wcRatio).toBeLessThanOrEqual(0.36);
    expect(result.engineeringAudit?.specializedMethod).toBe("HSC");
  });

  it("routes HPC automatically to the high-performance engine", () => {
    const result: any = calculateMixDesign(createTestInput({
      concreteType: "HPC",
      fck28: 45,
      slump: 10,
      dMax: 16,
      dosageSuper: 1.1,
      dosageSilicaFume: 8,
      dosageFlyAsh: 7,
      dosageSlag: 0
    }));

    expect(result.methodId).toBe("hsc-hpc-specialized");
    expect(result.status).toBe("success");
    expect(result.isValid).toBe(true);
    expect(result.calculationStatus).toBe("needs_trial_mix");
    expect(result.cementKg).toBeGreaterThan(0);
    expect(result.scmKg).toBeGreaterThan(0);
    expect(result.quantities?.totalBinder).toBeGreaterThanOrEqual(400);
    expect(result.quantities?.totalBinder).toBeLessThanOrEqual(650);
    expect(result.engineeringAudit?.specializedMethod).toBe("HPC");
  });

  it("reports theoretical density on the design-water basis when aggregate moisture is corrected", () => {
    const result: any = calculateMixDesign(createTestInput({
      concreteType: "HSC",
      fck28: 55,
      slump: 8,
      dMax: 20,
      dosageSuper: 1.2,
      dosageSilicaFume: 7.5,
      moistureSand: 5,
      sandAbsorption: 1,
      moistureGravel: 4,
      gravelAbsorption: 1
    }));
    const designedMass =
      result.cementKg + (result.scmKg || 0) + result.fineAggregateKg +
      result.coarseAggregateKg + result.waterKg + result.admixtureKg;
    expect(result.freshDensityKgM3).toBeCloseTo(designedMass, 6);
    expect(result.waterToAdd).not.toBeCloseTo(result.waterKg, 3);
  });

  it("blocks HSC when required silica-fume and superplasticizer inputs are missing", () => {
    const result: any = calculateMixDesign(createTestInput({
      concreteType: "HSC",
      fck28: 55,
      slump: 8,
      dMax: 20,
      dosageSuper: 0,
      dosageSilicaFume: 0
    }));

    expect(result.isValid).toBe(false);
    expect(result.status).toBe("not-supported");
    expect(result.calculationStatus).toBe("blocked");
  });


  it("validates HPC selected SCM replacement using the same value as the calculation", () => {
    const validation = validateHscHpcInputs(createTestInput({
      concreteType: "HPC",
      fck28: 55,
      dMax: 16,
      hpcWaterKgM3: 160,
      hpcWaterBinderRatio: 0.30,
      dosageSuper: 1.2,
      dosageSilicaFume: 5,
      dosageFlyAsh: 5,
      dosageSlag: 0,
      selectedScmReplacementPercent: 45,
      airContent: 1
    }));

    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((error) => error.code === "scm_total")).toBe(true);
  });

  it("does not route UHPC into the HSC/HPC engine", () => {
    const result: any = calculateMixDesign(createTestInput({
      concreteType: "UHPC",
      fck28: 100,
      dMax: 8,
      dosageSuper: 2,
      dosageSilicaFume: 15
    }));

    expect(result.methodId).toBe("uhpc-specialized");
    expect(result.isValid).toBe(false);
    expect(result.status).toBe("not-supported");
  });
});
