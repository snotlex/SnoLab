import { describe, expect, it } from "vitest";
import { calculateDreuxGorisse } from "../../utils";
import { validateCalculationLogic } from "../validationGate";
import { createTestInput } from "../../__tests__/testHelper";

const userMaterials: any[] = [
  {
    id: "cem-legacy-link",
    name: "CEM I 42.5",
    englishName: "CEM I 42.5",
    category: "إسمنت",
    type: "cementitious",
    ApprovalStatus: "Approved",
    status: "نشط",
    source: "user",
    ownerId: "u1",
    createdBy: "user",
    density: 3100,
    specificGravity: 3.1,
    strengthClass: "42.5",
  },
  {
    id: "sand-legacy-link",
    name: "Sand 0/4",
    englishName: "Sand 0/4",
    category: "رمال",
    type: "sand",
    ApprovalStatus: "Approved",
    status: "نشط",
    source: "user",
    ownerId: "u1",
    createdBy: "user",
    density: 2600,
    specificGravity: 2.6,
    absorption: 1.5,
    moisture: 3.5,
    finenessModulus: 2.6,
  },
  {
    id: "grav-legacy-link",
    name: "Gravel 4/20",
    englishName: "Gravel 4/20",
    category: "حصى",
    type: "gravel",
    ApprovalStatus: "Approved",
    status: "نشط",
    source: "user",
    ownerId: "u1",
    createdBy: "user",
    density: 2650,
    specificGravity: 2.65,
    absorption: 0.8,
    moisture: 1,
    dMax: 20,
    particleShape: "مستدير",
  },
  {
    id: "water-legacy-link",
    name: "Mixing Water",
    englishName: "Mixing Water",
    category: "ماء",
    type: "water",
    ApprovalStatus: "Approved",
    status: "نشط",
    source: "user",
    ownerId: "u1",
    createdBy: "user",
    density: 1000,
    specificGravity: 1,
  },
];

function validInput(overrides: Record<string, any> = {}) {
  return createTestInput({
    bypassSuitabilityGate: false,
    concreteType: "NSC",
    fck28: 25,
    slump: 8,
    dMax: 20,
    cementType: "CEM I 42.5",
    sandType: "Sand 0/4",
    gravelType: "Gravel 4/20",
    selectedWaterName: "Mixing Water",
    materialsDatabase: userMaterials,
    ...overrides,
  });
}

describe("Dreux calculation and diagnostic regression checks", () => {
  it("re-links a migrated name-only material selection to the real library IDs", () => {
    const result = calculateDreuxGorisse(
      validInput({
        selectedCementId: undefined,
        selectedSandId: undefined,
        selectedGravelId: undefined,
        selectedWaterId: undefined,
      })
    ) as any;

    expect(result.cementWeight).toBeGreaterThan(0);
    expect(result.sandWeightDry).toBeGreaterThan(0);
    expect(result.gravelWeightDry).toBeGreaterThan(0);
    expect(result.resolvedMaterialIds).toEqual({
      selectedCementId: "cem-legacy-link",
      selectedSandId: "sand-legacy-link",
      selectedGravelId: "grav-legacy-link",
      selectedWaterId: "water-legacy-link",
    });
    expect(result.materialSuitability?.status).toBe("approved");
  });

  it("does not invalidate a valid mix only because granular optimization has not been approved", () => {
    const result = calculateDreuxGorisse(
      validInput({ isGranularOptimizedApproved: false })
    ) as any;

    const gate = validateCalculationLogic(validInput({ isGranularOptimizedApproved: false }), result);

    expect(gate.criticalErrors).not.toContain("granular_optimization_not_approved");
    expect(gate.isValidForReport).toBe(true);
  });

  it("reports fresh density from as-batched masses, not dry aggregates plus effective water", () => {
    const input = validInput({
      moistureSand: 3.5,
      moistureGravel: 1,
    });
    const result = calculateDreuxGorisse(input) as any;

    const expected =
      result.cementWeight +
      (result.flyAshKg || 0) +
      (result.slagKg || 0) +
      (result.silicaFumeKg || 0) +
      (result.designSSD?.specialBinderKg || 0) +
      result.sandWeightWet +
      result.gravelWeightWet +
      result.waterToAdd +
      (result.admixtureWeights || []).reduce((sum: number, row: any) => sum + (row.weight || 0), 0) +
      (result.fiberKg || input.fiberDosageKgM3 || 0);

    expect(result.totalFreshDensity).toBeCloseTo(expected, 6);
    expect(result.totalBatchWeight).toBeCloseTo(expected, 6);
  });

  it("does not apply the normal 25% minimum sand fraction to pervious concrete", () => {
    const input = validInput({
      concreteType: "PERVIOUS",
      slump: 2,
      fck28: 15,
    });

    const baseResult = calculateDreuxGorisse(input) as any;
    const perviousResult = {
      ...baseResult,
      concreteType: "PERVIOUS",
      valid: true,
      isValid: true,
      sandWeightDry: 100,
      gravelWeightDry: 1200,
      sandWeightWet: 100,
      gravelWeightWet: 1200,
      waterToAdd: 140,
      waterContentActual: 140,
      effectiveWater: 140,
      waterCementRatio: 0.42,
      totalBatchWeight: 2000,
      totalCost: 100,
      sandTotalMoistureWater: 0,
      gravelTotalMoistureWater: 0,
      sandAbsorptionWater: 0,
      gravelAbsorptionWater: 0,
      totalFreeSurfaceWater: 0,
      totalAbsorptionDeficit: 0,
    };

    const gate = validateCalculationLogic(
      { ...input, concreteType: "PERVIOUS", slump: 2 },
      perviousResult
    );

    expect(gate.criticalErrors).not.toContain("sand_ratio");
  });
});
