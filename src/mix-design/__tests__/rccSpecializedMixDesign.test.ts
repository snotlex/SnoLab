import { describe, expect, it } from "vitest";
import { calculateMixDesign } from "../../engine/calculateMixDesign";
import { createTestInput } from "../../__tests__/testHelper";

const rccMaterials: any[] = [
  {
    id: "cem-rcc",
    name: "CEM I 42.5",
    englishName: "Portland Cement",
    category: "إسمنت",
    type: "cementitious",
    density: 3150,
    status: "نشط",
    approvalStatus: "Approved"
  },
  {
    id: "sand-rcc",
    name: "Washed Sand 0/4",
    englishName: "Washed Sand",
    category: "رمال",
    type: "sand",
    density: 2650,
    absorption: 1,
    moisture: 2,
    status: "نشط",
    approvalStatus: "Approved"
  },
  {
    id: "gravel-rcc",
    name: "Crushed Aggregate 4/25",
    englishName: "Crushed Aggregate",
    category: "حصى",
    type: "gravel",
    density: 2650,
    absorption: 0.8,
    moisture: 1,
    dMax: 25,
    status: "نشط",
    approvalStatus: "Approved"
  },
  {
    id: "water-rcc",
    name: "Mixing Water",
    englishName: "Mixing Water",
    category: "ماء",
    type: "water",
    density: 1000,
    status: "نشط",
    approvalStatus: "Approved"
  }
];

function rccInput(overrides: Record<string, any> = {}) {
  return createTestInput({
    concreteType: "RCC",
    fck28: 25,
    slump: 0,
    dMax: 25,
    cementType: "CEM I 42.5",
    sandType: "Washed Sand 0/4",
    gravelType: "Crushed Aggregate 4/25",
    selectedCementId: "cem-rcc",
    selectedSandId: "sand-rcc",
    selectedGravelId: "gravel-rcc",
    selectedWaterId: "water-rcc",
    materialsDatabase: rccMaterials,
    rccOptimumMoisturePercent: 5.3,
    rccMaxDryDensityKgM3: 2300,
    rccCementContentKgM3: 250,
    rccSandFractionPercent: 52,
    rccCompactionTargetPercent: 98,
    ...overrides
  });
}

describe("RCC specialized mix-design engine", () => {
  it("routes RCC automatically to a moisture-density-driven engine", () => {
    const result: any = calculateMixDesign(rccInput());

    expect(result.methodId).toBe("rcc-specialized");
    expect(result.status).toBe("success");
    expect(result.isValid).toBe(true);
    expect(result.calculationStatus).toBe("needs_trial_mix");

    expect(result.rccOptimumMoisturePercent).toBeCloseTo(5.3, 6);
    expect(result.rccMaxDryDensityKgM3).toBeCloseTo(2300, 6);
    expect(result.rccCementContentKgM3).toBeCloseTo(250, 6);
    expect(result.sandWeightDry).toBeGreaterThan(0);
    expect(result.gravelWeightDry).toBeGreaterThan(0);
    expect(result.rccWaterKgM3).toBeGreaterThan(0);
    expect(result.rccWaterBinderRatio).toBeGreaterThan(0.3);
    expect(result.rccWaterBinderRatio).toBeLessThan(0.5);
    expect(result.engineeringAudit?.specializedMethod).toBe("RCC");
  });

  it("changes batch water when the laboratory OMC changes", () => {
    const dry: any = calculateMixDesign(rccInput({ rccOptimumMoisturePercent: 4.8 }));
    const wet: any = calculateMixDesign(rccInput({ rccOptimumMoisturePercent: 5.8 }));

    expect(dry.isValid).toBe(true);
    expect(wet.isValid).toBe(true);
    expect(wet.rccWaterKgM3).toBeGreaterThan(dry.rccWaterKgM3);
    expect(wet.waterToAdd).toBeGreaterThan(dry.waterToAdd);
  });

  it("blocks RCC when the validated moisture-density curve inputs are missing", () => {
    const result: any = calculateMixDesign(rccInput({
      rccOptimumMoisturePercent: undefined,
      rccMaxDryDensityKgM3: undefined
    }));

    expect(result.isValid).toBe(false);
    expect(result.status).toBe("not-supported");
    expect(result.calculationStatus).toBe("blocked");
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  it("does not silently route RCC through Dreux-Gorisse", () => {
    const result: any = calculateMixDesign(rccInput());
    expect(result.methodId).toBe("rcc-specialized");
    expect(result.methodId).not.toBe("dreux-gorisse");
  });
});