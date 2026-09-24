import { describe, expect, it } from "vitest";
import { executeLaboratoryTest } from "../services/materialsLabEngine";
import { validateTestMaterialCompatibility } from "../services/laboratoryMaterialCompatibility";
import type { EngineeringMaterial } from "../types";

const material = (overrides: Partial<EngineeringMaterial>): EngineeringMaterial => ({
  id: "MAT-TEST", name: "اختبار", englishName: "Test", type: "other", category: "other", quality: "standard", uses: "test", desc: "test", rating: 3, provenance: "test", status: "نشط", ...overrides
});

describe("Laboratory test–material compatibility", () => {
  it.each([
    ["AGG_BULKING_SAND", material({ category: "رمال", materialType: "ركام", type: "sand" }), true],
    ["AGG_BULKING_SAND", material({ category: "إسمنت", materialType: "مادة رابطة", type: "cement" }), false],
    ["AGG_BULKING_SAND", material({ category: "حصى", materialType: "ركام", type: "gravel" }), false],
    ["AGG_SIEVE", material({ category: "الركام الناعم", materialType: "ركام", type: "sand" }), true],
    ["AGG_SIEVE", material({ category: "إسمنت", materialType: "مادة رابطة", type: "cement" }), false],
    ["AGG_LOS_ANGELES", material({ category: "الركام الخشن", materialType: "ركام", type: "gravel" }), true],
    ["AGG_LOS_ANGELES", material({ category: "رمال", materialType: "ركام", type: "sand" }), false],
    ["CEM_FINENESS_BLAINE", material({ category: "إسمنت", materialType: "مادة رابطة", type: "cement" }), true],
    ["CEM_FINENESS_BLAINE", material({ category: "رمال", materialType: "ركام", type: "sand" }), false]
  ])("%s compatibility is %s", (testId, candidate, expected) => {
    expect(validateTestMaterialCompatibility(testId, candidate).compatible).toBe(expected);
  });

  it("blocks incompatible calculations before the switch executes", () => {
    const result = executeLaboratoryTest("AGG_BULKING_SAND", { dryVolumeCm3: 1000 }, material({ category: "إسمنت", materialType: "مادة رابطة", type: "cement" }));
    expect(result.status).toBe("FAIL");
    expect(result.score).toBe(0);
    expect(result.results).toEqual({});
    expect(result.syncedProperties).toEqual({});
    expect(result.interpretation).toContain("حظر");
  });

  it("fails closed for an unregistered test or unclassified material", () => {
    expect(validateTestMaterialCompatibility("UNKNOWN_TEST", material({ category: "غير معروف" })).compatible).toBe(false);
    expect(validateTestMaterialCompatibility("AGG_SIEVE", material({ category: "غير معروف" })).compatible).toBe(false);
  });
});
