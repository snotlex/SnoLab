import { describe, it, expect } from "vitest";
import { checkMaterialSuitability, isApprovedAndActive, isUserMaterial } from "../engine/suitabilityGate";
import { calculateDreuxGorisseCore } from "../engine/dreuxGorisseCore";
import { MixDesignInput, EngineeringMaterial } from "../types";

describe("Strict Fallback Densities and Materials Selection Final Audit", () => {
  // Mock standard user materials
  const validUserCement: EngineeringMaterial = {
    id: "user-cement-123",
    name: "إسمنت بورتلاندي مستخدم",
    category: "إسمنت",
    density: 3150,
    source: "user",
    status: "نشط",
    ApprovalStatus: "Approved"
  } as any;

  const validUserSand: EngineeringMaterial = {
    id: "user-sand-123",
    name: "رمل مغسول مستخدم",
    category: "رمل",
    density: 2620,
    source: "user",
    status: "نشط",
    ApprovalStatus: "Approved"
  } as any;

  const validUserGravel: EngineeringMaterial = {
    id: "user-gravel-123",
    name: "حصى كلسية مستخدمة",
    category: "حصى",
    density: 2700,
    source: "user",
    status: "نشط",
    ApprovalStatus: "Approved"
  } as any;

  const validUserWater: EngineeringMaterial = {
    id: "user-water-123",
    name: "مياه صالحة للشرب",
    category: "مياه الخلط",
    density: 1000,
    source: "user",
    status: "نشط",
    ApprovalStatus: "Approved"
  } as any;

  const db = [validUserCement, validUserSand, validUserGravel, validUserWater];

  it("1. should block calculation if authentic user materials are missing (no user material = no calculation)", () => {
    // If we use system materials or empty list, it must be flagged as invalid or blocked
    const systemMat: EngineeringMaterial = {
      id: "preset-cement-1",
      name: "إسمنت مصنعي",
      category: "إسمنت",
      density: 3100,
      source: "system",
      status: "نشط",
      ApprovalStatus: "Certified"
    } as any;

    const input: MixDesignInput = {
      selectedCementId: "preset-cement-1",
      selectedSandId: "user-sand-123",
      selectedGravelId: "user-gravel-123",
      selectedWaterId: "user-water-123",
      concreteType: "NSC",
      fck28: 25,
      slump: 8,
      dosageSuper: 0,
      dosageAir: 0,
      dosageRetarder: 0,
      dosageAccelerator: 0,
      dosageSilicaFume: 0,
      dosageFlyAsh: 0,
      dosageSlag: 0,
      batchVolume: 1.0,
      autoDensities: false
    } as any;

    const suitabilityResult = checkMaterialSuitability(input, [systemMat, validUserSand, validUserGravel, validUserWater]);
    expect(suitabilityResult.status).toBe("blocked");
    expect(suitabilityResult.reason).toBe("non_user_material_source");
  });

  it("2. should fail suitability and make results invalid if a primary material density is missing (no fallback densities)", () => {
    const gravelNoDensity: EngineeringMaterial = {
      id: "user-gravel-no-dens",
      name: "حصى بدون كثافة",
      category: "حصى",
      source: "user",
      status: "نشط",
      ApprovalStatus: "Approved"
    } as any;

    const inputLwc: MixDesignInput = {
      selectedCementId: "user-cement-123",
      selectedSandId: "user-sand-123",
      selectedGravelId: "user-gravel-no-dens",
      selectedWaterId: "user-water-123",
      concreteType: "LWC", // Lightweight Concrete
      fck28: 25,
      slump: 8,
      materialsDatabase: [validUserCement, validUserSand, gravelNoDensity, validUserWater],
      dosageSuper: 0,
      dosageAir: 0,
      dosageRetarder: 0,
      dosageAccelerator: 0,
      dosageSilicaFume: 0,
      dosageFlyAsh: 0,
      dosageSlag: 0,
      batchVolume: 1.0,
      autoDensities: false
    } as any;

    // Suitability Check should block LWC due to missing gravel density
    const suitability = checkMaterialSuitability(inputLwc, [validUserCement, validUserSand, gravelNoDensity, validUserWater]);
    expect(suitability.status).toBe("blocked");
    expect(suitability.reason).toBe("missing_material_property");
    expect(suitability.missingMaterials).toContain("gravel_density");

    // Calculation Result should be invalid
    const calcResult = calculateDreuxGorisseCore(inputLwc);
    expect(calcResult.isValid).toBe(false);
  });

  it("3. should not use standard cement fallback (3100) for special binder if density is missing or zero", () => {
    const inputSpecialNoDens: MixDesignInput = {
      selectedCementId: "user-cement-123",
      selectedSandId: "user-sand-123",
      selectedGravelId: "user-gravel-123",
      selectedWaterId: "user-water-123",
      concreteType: "NSC",
      fck28: 25,
      slump: 8,
      specialBinderReplacementPercent: 10,
      specialBinderDensity: 0, // Missing/Zero density
      dosageSuper: 0,
      dosageAir: 0,
      dosageRetarder: 0,
      dosageAccelerator: 0,
      dosageSilicaFume: 0,
      dosageFlyAsh: 0,
      dosageSlag: 0,
      batchVolume: 1.0,
      autoDensities: false
    } as any;

    // Must block under suitability checks
    const suitability = checkMaterialSuitability(inputSpecialNoDens, db);
    expect(suitability.status).toBe("blocked");
    expect(suitability.reason).toBe("missing_material_property");
    expect(suitability.missingMaterials).toContain("special_binder_density");

    // Calculation must be invalid
    const calcResult = calculateDreuxGorisseCore(inputSpecialNoDens);
    expect(calcResult.isValid).toBe(false);
  });

  it("4. should guarantee that preset, seeded, default, or system materials are rejected as active user materials", () => {
    const seededMaterial: EngineeringMaterial = {
      id: "seeded-sand-boussaada",
      name: "رمل بوسعادة",
      category: "رمال",
      density: 2650,
      source: "system",
      status: "نشط",
      ApprovalStatus: "Approved",
      createdBy: "System Seed"
    } as any;

    // Both helper checks must mark it as false
    expect(isUserMaterial(seededMaterial)).toBe(false);
    expect(isApprovedAndActive(seededMaterial)).toBe(false);
  });

  it("5. should guarantee that only authentic user/project/lab, approved/certified, and active materials are approved", () => {
    const perfectUserMaterial: EngineeringMaterial = {
      id: "usr-mat-ok",
      name: "رمل وادي الصومام",
      category: "رمل",
      density: 2600,
      source: "user",
      status: "نشط",
      ApprovalStatus: "Approved",
      createdBy: "senoussi.s.t@gmail.com",
      ownerId: "user-profile-id"
    } as any;

    expect(isUserMaterial(perfectUserMaterial)).toBe(true);
    expect(isApprovedAndActive(perfectUserMaterial)).toBe(true);

    const draftUserMaterial: EngineeringMaterial = {
      ...perfectUserMaterial,
      ApprovalStatus: "Draft"
    };
    expect(isApprovedAndActive(draftUserMaterial)).toBe(false);

    const inactiveUserMaterial: EngineeringMaterial = {
      ...perfectUserMaterial,
      status: "موقوف"
    };
    expect(isApprovedAndActive(inactiveUserMaterial)).toBe(false);
  });
});
