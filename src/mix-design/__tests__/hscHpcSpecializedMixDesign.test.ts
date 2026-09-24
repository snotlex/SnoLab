import { describe, expect, it } from "vitest";
import { calculateMixDesign } from "../../engine/calculateMixDesign";
import { createTestInput } from "../../__tests__/testHelper";

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
