import { describe, expect, it } from "vitest";
import { calculateDreuxGorisseCore } from "../dreuxGorisseCore";
import type { EngineeringMaterial, MixDesignInput } from "../../types";

function material(partial: Partial<EngineeringMaterial>): EngineeringMaterial {
  return {
    id: "mat",
    name: "Material",
    englishName: "Material",
    type: "base",
    category: "رمال",
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

const cement = material({ id: "cement-1", category: "إسمنت", density: 3150, strengthClass: "42.5" });
const sand = material({ id: "sand-1", category: "رمال", density: 2600, absorption: 1.5, moisture: 2, finenessModulus: 2.7 });
const gravel = material({ id: "gravel-1", category: "حصى", density: 2700, absorption: 0.8, moisture: 1, dMax: 20, particleShape: "مكسر" });
const water = material({ id: "water-1", category: "ماء", density: 1000 });

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
  sandRelativeDensity: 2.6,
  gravelRelativeDensity: 2.7,
  cementDensity: 3150,
  airContent: 2,
  moistureSand: 2,
  moistureGravel: 1,
  sandAbsorption: 1.5,
  gravelAbsorption: 0.8,
  selectedCementId: "cement-1",
  selectedSandId: "sand-1",
  selectedGravelId: "gravel-1",
  selectedWaterId: "water-1",
  selectedMethod: "dreux",
  concreteType: "NSC",
  materialsDatabase: [cement, sand, gravel, water],
  dosageSuper: 0,
  dosageAir: 0,
  dosageRetarder: 0,
  dosageAccelerator: 0,
  dosageSilicaFume: 0,
  dosageFlyAsh: 0,
  dosageSlag: 0,
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
  sandType: "Sand",
  gravelType: "Gravel",
  autoDensities: false,
};

describe("Dreux core production gate integration", () => {
  it("blocks a selected preset material at the calculation boundary", () => {
    const preset = { ...cement, id: "preset-cement-1", source: "system", sourceType: "system_demo" };
    const result = calculateDreuxGorisseCore({ ...baseInput, selectedCementId: preset.id, materialsDatabase: [preset, sand, gravel, water] });
    expect(result.isValid).toBe(false);
    expect(result.materialSuitability.invalidMaterials).toContain("cement:system_source");
    expect(result.cementWeight).toBe(0);
  });

  it("blocks an incomplete production material before any mix quantities are produced", () => {
    const incompleteSand = { ...sand, absorption: undefined, finenessModulus: undefined };
    const result = calculateDreuxGorisseCore({ ...baseInput, selectedSandId: incompleteSand.id, materialsDatabase: [cement, incompleteSand, gravel, water] });
    expect(result.isValid).toBe(false);
    expect(result.cementWeight).toBe(0);
    expect(result.materialSuitability.invalidMaterials.some((v: string) => v.startsWith("sand:missing_properties:"))).toBe(true);
  });

  it("accepts a fully populated approved active production set", () => {
    const result = calculateDreuxGorisseCore(baseInput);
    expect(result.isValid).toBe(true);
    expect(result.cementWeight).toBeGreaterThan(0);
    expect(result.sandWeightDry).toBeGreaterThan(0);
    expect(result.gravelWeightDry).toBeGreaterThan(0);
  });
});
