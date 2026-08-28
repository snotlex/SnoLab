import { describe, expect, it } from "vitest";
import { validateProductionMaterialSet } from "../engine/productionMaterialGate";
import type { EngineeringMaterial, MixDesignInput } from "../types";

const baseInput: MixDesignInput = {
  fck28: 25,
  controlClass: "normal",
  cementType: "CEM I",
  cementClassStrength: 42.5,
  dMax: 20,
  slump: 8,
  aggregateType: "concasse" as any,
  aggregateQuality: "standard" as any,
  hasPumping: false,
  sandRelativeDensity: 2600,
  gravelRelativeDensity: 2700,
  cementDensity: 3150,
  airContent: 2,
  moistureSand: 2,
  moistureGravel: 1,
  selectedMethod: "dreux",
  priceCement: 0,
  priceSand: 0,
  priceGravel: 0,
  priceSuper: 0,
  priceAir: 0,
  priceRetarder: 0,
  priceAccelerator: 0,
  priceSilicaFume: 0,
  priceFlyAsh: 0,
  priceSlag: 0,
  priceLabor: 0,
  priceWater: 0,
  dosageSuper: 0,
  dosageAir: 0,
  dosageRetarder: 0,
  dosageAccelerator: 0,
  dosageSilicaFume: 0,
  dosageFlyAsh: 0,
  dosageSlag: 0,
  sandType: "Sand",
  gravelType: "Gravel",
  autoDensities: false,
};

function material(partial: Partial<EngineeringMaterial>): EngineeringMaterial {
  return {
    id: "mat",
    name: "Material",
    englishName: "Material",
    type: "base",
    category: "sand",
    quality: "standard",
    uses: "concrete",
    desc: "test",
    rating: 5,
    provenance: "lab",
    image: "",
    source: "user",
    sourceType: "user_created",
    ownerId: "uid-1",
    status: "نشط",
    ApprovalStatus: "Approved",
    ...partial,
  } as EngineeringMaterial;
}

const cement = material({ id: "cement-1", category: "إسمنت", strengthClass: "42.5", cementClass: "CEM I", density: 3150 });
const sand = material({ id: "sand-1", category: "رمال", density: 2600, absorption: 1.5, moisture: 2, finenessModulus: 2.7 });
const gravel = material({ id: "gravel-1", category: "حصى", density: 2700, absorption: 0.8, moisture: 1, dMax: 20, particleShape: "مكسر" });
const water = material({ id: "water-1", category: "ماء", density: 1000 });

function withIds(overrides: Partial<MixDesignInput> = {}, materials: EngineeringMaterial[] = [cement, sand, gravel, water]): MixDesignInput {
  return {
    ...baseInput,
    selectedCementId: "cement-1",
    selectedSandId: "sand-1",
    selectedGravelId: "gravel-1",
    selectedWaterId: "water-1",
    materialsDatabase: materials,
    ...overrides,
  } as MixDesignInput;
}

describe("validateProductionMaterialSet", () => {
  it("accepts a complete, approved, active material set", () => {
    const result = validateProductionMaterialSet(withIds(), [cement, sand, gravel, water]);
    expect(result.status).toBe("approved");
    expect(result.invalidMaterials).toHaveLength(0);
    expect(result.missingMaterials).toHaveLength(0);
  });

  it("blocks a system/demo material even when it is present in the database", () => {
    const systemCement = { ...cement, id: "preset-cement-1", source: "system", sourceType: "system_demo" };
    const result = validateProductionMaterialSet(withIds({ selectedCementId: systemCement.id }, [systemCement, sand, gravel, water]), [systemCement, sand, gravel, water]);
    expect(result.status).toBe("blocked");
    expect(result.invalidMaterials).toContain("cement:system_source");
  });

  it("blocks a material with missing engineering properties", () => {
    const incompleteSand = { ...sand, id: "sand-incomplete", absorption: undefined, finenessModulus: undefined };
    const result = validateProductionMaterialSet(withIds({ selectedSandId: incompleteSand.id }, [cement, incompleteSand, gravel, water]), [cement, incompleteSand, gravel, water]);
    expect(result.status).toBe("blocked");
    expect(result.invalidMaterials.some(item => item.startsWith("sand:missing_properties:"))).toBe(true);
  });

  it("blocks a material that is approved but inactive", () => {
    const inactiveGravel = { ...gravel, id: "gravel-inactive", status: "موقوف" as const };
    const result = validateProductionMaterialSet(withIds({ selectedGravelId: inactiveGravel.id }, [cement, sand, inactiveGravel, water]), [cement, sand, inactiveGravel, water]);
    expect(result.status).toBe("blocked");
    expect(result.invalidMaterials).toContain("gravel:not_approved_or_inactive");
  });
});
