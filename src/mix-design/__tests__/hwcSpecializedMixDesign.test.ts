import { describe, expect, it } from "vitest";
import { calculateMixDesign } from "../../engine/calculateMixDesign";
import { createTestInput } from "../../__tests__/testHelper";

const hwcMaterials: any[] = [
  {
    id: "cem-hwc",
    name: "CEM I 42.5",
    englishName: "Portland Cement",
    category: "إسمنت",
    type: "cementitious",
    density: 3150,
    status: "نشط",
    approvalStatus: "Approved"
  },
  {
    id: "sand-hwc",
    name: "Washed Sand 0/4",
    englishName: "Washed Sand",
    category: "رمال",
    type: "sand",
    density: 2650,
    absorption: 1,
    moisture: 1,
    status: "نشط",
    approvalStatus: "Approved"
  },
  {
    id: "hwa-01",
    name: "Barite Heavyweight Aggregate 4/25",
    englishName: "Barite Heavyweight Aggregate",
    category: "ركام ثقيل",
    type: "heavyweight_aggregate",
    density: 4500,
    absorption: 2,
    moisture: 0.5,
    dMax: 25,
    status: "نشط",
    approvalStatus: "Approved"
  },
  {
    id: "water-hwc",
    name: "Mixing Water",
    englishName: "Mixing Water",
    category: "ماء",
    type: "water",
    density: 1000,
    status: "نشط",
    approvalStatus: "Approved"
  },
  {
    id: "sp-hwc",
    name: "PCE Superplasticizer",
    englishName: "Polycarboxylate Superplasticizer",
    category: "إضافات كيميائية",
    type: "superplasticizer",
    admixtureType: "superplasticizer",
    density: 1080,
    status: "نشط",
    approvalStatus: "Approved"
  }
];

function hwcInput(overrides: Record<string, any> = {}) {
  return createTestInput({
    concreteType: "HWC",
    fck28: 30,
    slump: 8,
    dMax: 25,
    cementType: "CEM I 42.5",
    sandType: "Washed Sand 0/4",
    selectedCementId: "cem-hwc",
    selectedSandId: "sand-hwc",
    selectedWaterId: "water-hwc",
    selectedWaterName: "Mixing Water",
    selectedHeavyweightAggregateId: "hwa-01",
    selectedHeavyweightAggregateName: "Barite Heavyweight Aggregate 4/25",
    selectedAdmixtureId: "sp-hwc",
    selectedAdmixtureName: "PCE Superplasticizer",
    dosageSuper: 1.0,
    materialsDatabase: hwcMaterials,
    hwcTargetDensityKgM3: 3200,
    hwcWaterKgM3: 150,
    hwcWaterBinderRatio: 0.42,
    ...overrides
  });
}

describe("HWC specialized mix-design engine", () => {
  it("routes HWC automatically to a dedicated high-density engine", () => {
    const result: any = calculateMixDesign(hwcInput());

    expect(result.methodId).toBe("heavyweight-specialized");
    expect(result.status).toBe("success");
    expect(result.isValid).toBe(true);
    expect(result.calculationStatus).toBe("needs_trial_mix");

    expect(result.cementKg).toBeGreaterThan(0);
    expect(result.sandWeightDry).toBeGreaterThan(0);
    expect(result.heavyweightAggregateKg).toBeGreaterThan(0);
    expect(result.heavyweightAggregateDensity).toBeCloseTo(4500, 6);

    expect(result.targetFreshDensityKgM3).toBeCloseTo(3200, 0);
    expect(result.achievedFreshDensityKgM3).toBeCloseTo(3200, 0);
    expect(result.batchFreshDensityKgM3).toBeGreaterThan(result.achievedFreshDensityKgM3);
    expect(result.engineeringAudit?.specializedMethod).toBe("HWC");
  });

  it("uses the selected heavyweight aggregate density instead of normal-gravel fallbacks", () => {
    const base: any = calculateMixDesign(hwcInput());
    const changed: any = calculateMixDesign(hwcInput({
      heavyweightAggregateDensity: 4200
    }));

    expect(base.isValid).toBe(true);
    expect(changed.isValid).toBe(true);
    expect(base.heavyweightAggregateDensity).toBeCloseTo(4500, 6);
    expect(changed.heavyweightAggregateDensity).toBeCloseTo(4200, 6);
    expect(base.heavyweightAggregateKg).not.toBeCloseTo(changed.heavyweightAggregateKg, 2);
    expect(base.heavyweightAggregateVolumeFraction).not.toBeCloseTo(changed.heavyweightAggregateVolumeFraction, 4);
  });

  it("blocks HWC when a validated heavyweight aggregate is missing from repository mode", () => {
    const result: any = calculateMixDesign(hwcInput({
      selectedHeavyweightAggregateId: undefined,
      selectedHeavyweightAggregateName: undefined
    }));

    expect(result.isValid).toBe(false);
    expect(result.status).toBe("not-supported");
    expect(result.calculationStatus).toBe("blocked");
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  it("does not silently route HWC through Dreux-Gorisse", () => {
    const result: any = calculateMixDesign(hwcInput());
    expect(result.methodId).toBe("heavyweight-specialized");
    expect(result.methodId).not.toBe("dreux-gorisse");
  });
});