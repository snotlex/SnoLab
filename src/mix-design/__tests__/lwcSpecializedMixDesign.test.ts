import { describe, expect, it } from "vitest";
import { calculateMixDesign } from "../../engine/calculateMixDesign";
import { createTestInput } from "../../__tests__/testHelper";

const lwcMaterials = [
  {
    id: "cem-lwc",
    name: "CEM I 42.5",
    englishName: "Portland Cement",
    category: "إسمنت",
    type: "cementitious",
    density: 3150,
    strengthClass: "42.5",
    status: "نشط",
    approvalStatus: "Approved"
  },
  {
    id: "sand-lwc",
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
    id: "lwa-01",
    name: "Expanded Clay Lightweight Aggregate 4/16",
    englishName: "Expanded Clay Lightweight Aggregate",
    category: "ركام خفيف",
    type: "lightweight_aggregate",
    density: 1200,
    absorption: 15,
    moisture: 2,
    dMax: 16,
    status: "نشط",
    approvalStatus: "Approved"
  },
  {
    id: "water-lwc",
    name: "Mixing Water",
    englishName: "Mixing Water",
    category: "ماء",
    type: "water",
    density: 1000,
    status: "نشط",
    approvalStatus: "Approved"
  },
  {
    id: "sp-lwc",
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

function lwcInput(overrides: Record<string, any> = {}) {
  return createTestInput({
    concreteType: "LWC",
    fck28: 25,
    slump: 8,
    dMax: 16,
    cementType: "CEM I 42.5",
    sandType: "Washed Sand 0/4",
    selectedCementId: "cem-lwc",
    selectedSandId: "sand-lwc",
    selectedWaterId: "water-lwc",
    selectedWaterName: "Mixing Water",
    selectedLightweightAggregateId: "lwa-01",
    selectedLightweightAggregateName: "Expanded Clay Lightweight Aggregate 4/16",
    selectedAdmixtureId: "sp-lwc",
    selectedAdmixtureName: "PCE Superplasticizer",
    dosageSuper: 1.0,
    materialsDatabase: lwcMaterials,
    lwcTargetDensityKgM3: 1750,
    lwcWaterKgM3: 155,
    lwcWaterBinderRatio: 0.44,
    lwcPrewetDegreePercent: 75,
    ...overrides
  });
}

describe("LWC specialized mix-design engine", () => {
  it("routes LWC automatically to a dedicated lightweight aggregate engine", () => {
    const result: any = calculateMixDesign(lwcInput());

    expect(result.methodId).toBe("lightweight-specialized");
    expect(result.status).toBe("success");
    expect(result.isValid).toBe(true);
    expect(result.calculationStatus).toBe("needs_trial_mix");

    expect(result.cementKg).toBeGreaterThan(0);
    expect(result.scmKg).toBe(0);
    expect(result.sandWeightDry).toBeGreaterThan(0);
    expect(result.lightweightAggregateKg).toBeGreaterThan(0);

    expect(result.targetFreshDensityKgM3).toBeCloseTo(1750, 0);
    expect(result.achievedFreshDensityKgM3).toBeCloseTo(1750, 0);
    expect(result.batchFreshDensityKgM3).toBeGreaterThan(result.achievedFreshDensityKgM3);

    expect(result.lightweightAggregateAbsorption).toBeCloseTo(15, 6);
    expect(result.lightweightPrewetDegreePercent).toBeCloseTo(75, 6);
    expect(result.lightweightPrewetWaterKgM3).toBeGreaterThan(0);
    expect(result.engineeringAudit?.specializedMethod).toBe("LWC");
  });

  it("uses the selected lightweight material density and absorption instead of normal-gravel fallbacks", () => {
    const base: any = calculateMixDesign(lwcInput({
      lightweightAggregateDensity: 1100,
      lightweightAggregateAbsorption: 12,
      lwcPrewetDegreePercent: 50
    }));
    const changed: any = calculateMixDesign(lwcInput({
      lightweightAggregateDensity: 1450,
      lightweightAggregateAbsorption: 20,
      lwcPrewetDegreePercent: 90
    }));

    expect(base.isValid).toBe(true);
    expect(changed.isValid).toBe(true);
    expect(base.lightweightAggregateDensity).toBeCloseTo(1100, 6);
    expect(changed.lightweightAggregateDensity).toBeCloseTo(1450, 6);
    expect(base.lightweightAggregateAbsorption).toBeCloseTo(12, 6);
    expect(changed.lightweightAggregateAbsorption).toBeCloseTo(20, 6);
    expect(base.lightweightAggregateKg).not.toBeCloseTo(changed.lightweightAggregateKg, 3);
    expect(base.lightweightPrewetWaterKgM3).not.toBeCloseTo(changed.lightweightPrewetWaterKgM3, 3);
  });

  it("blocks LWC when a validated lightweight aggregate is missing from repository mode", () => {
    const result: any = calculateMixDesign(lwcInput({
      selectedLightweightAggregateId: undefined,
      selectedLightweightAggregateName: undefined
    }));

    expect(result.isValid).toBe(false);
    expect(result.status).toBe("not-supported");
    expect(result.calculationStatus).toBe("blocked");
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  it("does not silently route LWC through Dreux-Gorisse", () => {
    const result: any = calculateMixDesign(lwcInput());

    expect(result.methodId).not.toBe("dreux-gorisse");
    expect(result.methodId).toBe("lightweight-specialized");
  });
});
