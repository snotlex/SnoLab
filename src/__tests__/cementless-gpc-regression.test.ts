import { describe, expect, it } from "vitest";
import { validateMixInputs } from "../engine/validateInputs";
import { calculateDreuxGorisseCore } from "../engine/dreuxGorisseCore";
import { checkMaterialSuitability } from "../engine/suitabilityGate";

const gpcBase: any = {
  concreteType: "GPC", fck28: 40, controlClass: "normal", dMax: 20, slump: 8,
  aggregateType: "concasse", aggregateQuality: "standard", hasPumping: false,
  sandRelativeDensity: 2.65, gravelRelativeDensity: 2.68, airContent: 1.5,
  moistureSand: 2, moistureGravel: 1, sandAbsorption: 1.2, gravelAbsorption: 0.8,
  dosageSuper: 1.5, dosageAir: 0, dosageRetarder: 0, dosageAccelerator: 0,
  dosageSilicaFume: 0, dosageFlyAsh: 60, dosageSlag: 40,
  specialBinderStrengthClass: 42.5, selectedSpecialBinderId: "user-activator",
  specialBinderReplacementPercent: 0, selectedMethod: "dreux", exposureClass: "X0",
  durabilityLevel: "standard", carbonationLevel: "none", chloridesLevel: "none", sulfatesLevel: "none",
  admixtures: [], bypassSuitabilityGate: true
};

const userMaterials: any[] = [
  { id: "user-sand", category: "رمال", type: "sand", name: "User sand", englishName: "User sand", density: 2650, absorption: 1.2, moisture: 2, finenessModulus: 2.6, status: "نشط", approvalStatus: "Approved", materialSource: "user", ownerId: "project-1" },
  { id: "user-gravel", category: "حصى", type: "gravel", name: "User gravel", englishName: "User gravel", density: 2680, absorption: 0.8, moisture: 1, dMax: 20, status: "نشط", approvalStatus: "Approved", materialSource: "user", ownerId: "project-1" },
  { id: "user-water", category: "ماء", type: "water", name: "Test water", englishName: "Test water", density: 1000, status: "نشط", approvalStatus: "Approved", materialSource: "user", ownerId: "project-1" },
  { id: "user-flyash", category: "إضافات معدنية", type: "fly_ash", name: "Fly ash", englishName: "Fly ash", density: 2300, status: "نشط", approvalStatus: "Approved", materialSource: "user", ownerId: "project-1" },
  { id: "user-activator", category: "مجلدات خاصة", type: "special_binder", name: "Alkaline activator", englishName: "Alkaline activator", density: 1500, status: "نشط", approvalStatus: "Approved", materialSource: "user", ownerId: "project-1" }
];

describe("Cementless GPC regression", () => {
  it("does not require cement class or cement density", () => {
    const result = validateMixInputs({ ...gpcBase, cementClassStrength: undefined, cementDensity: undefined });
    expect(result.errors).not.toContain("رتبة مقاومة الإسمنت (Cement Strength Class) مطلوبة لحساب نسبة الماء إلى الإسمنت.");
    expect(result.errors).not.toContain("الكثافة المطلقة للإسمنت (Cement Density) مطلوبة لحساب الحجم المطلق.");
  });

  it("does not report cement as missing when GPC has alternative binders", () => {
    const input = { ...gpcBase, selectedSandId: "user-sand", selectedGravelId: "user-gravel", selectedWaterId: "user-water", selectedSpecialBinderId: "user-activator", materialsDatabase: userMaterials };
    const suitability = checkMaterialSuitability(input, userMaterials);
    expect(suitability.missingMaterials).not.toContain("cement");
  });

  it("calculates GPC without selected cement", () => {
    const result = calculateDreuxGorisseCore({ ...gpcBase, cementClassStrength: undefined, cementDensity: undefined });
    expect(result.errors).toEqual([]);
    expect(result.cementWeight).toBe(0);
    expect(result.totalBinder).toBeGreaterThan(0);
    expect(result.designSSD?.cementKg).toBe(0);
    expect(result.absoluteVolumeCheck?.isValid).toBe(true);
  });
});
