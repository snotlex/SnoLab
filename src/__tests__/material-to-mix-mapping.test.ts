import { describe, it, expect } from "vitest";
import { mapMaterialToMixInput } from "../utils/mapMaterialToMixInput";
import { AggregateType, AggregateQuality } from "../types";
import { calculateDreuxGorisse } from "../utils";
import { createTestInput } from "./testHelper";
import { DEFAULT_EXPANDED_MATERIALS } from "../data/expandedMaterials";

describe("Material to Mix Mapping Utility Tests", () => {
  it("A) Sand mapping", () => {
    const material = {
      id: "mat-sand-1",
      name: "رمل عياري وادي الصومام",
      category: "رمال",
      density: 2620,
      absorption: 2.4,
      moisture: 5.1,
      finenessModulus: 2.7,
      price: 2.5,
    };

    const patch = mapMaterialToMixInput(material);

    expect(patch.sandType).toBe("رمل عياري وادي الصومام");
    expect(patch.selectedSandId).toBe("mat-sand-1");
    expect(patch.sandRelativeDensity).toBe(2620);
    expect(patch.moistureSand).toBe(5.1);
    expect(patch.sandAbsorption).toBe(2.4);
    expect(patch.finenessModulus).toBe(2.7);
    expect(patch.priceSand).toBe(2.5);
  });

  it("B) Gravel mapping", () => {
    const material = {
      id: "mat-gravel-1",
      name: "حصى جبلية مكسرة",
      category: "حصى",
      density: 2680,
      absorption: 0.9,
      moisture: 1.2,
      dMax: 20,
      particleShape: "مكسر",
      price: 3,
    };

    const patch = mapMaterialToMixInput(material);

    expect(patch.gravelType).toBe("حصى جبلية مكسرة");
    expect(patch.selectedGravelId).toBe("mat-gravel-1");
    expect(patch.gravelRelativeDensity).toBe(2680);
    expect(patch.moistureGravel).toBe(1.2);
    expect(patch.gravelAbsorption).toBe(0.9);
    expect(patch.dMax).toBe(20);
    expect(patch.aggregateType).toBe(AggregateType.CONCASSE);
    expect(patch.priceGravel).toBe(3);
  });

  it("C) Cement mapping", () => {
    const material = {
      id: "mat-cement-1",
      name: "إسمنت الشلف الشامل",
      category: "إسمنت",
      density: 3100,
      strengthClass: "42.5",
      price: 17,
    };

    const patch = mapMaterialToMixInput(material);

    expect(patch.cementType).toBe("إسمنت الشلف الشامل");
    expect(patch.selectedCementId).toBe("mat-cement-1");
    expect(patch.cementDensity).toBe(3100);
    expect(patch.cementClassStrength).toBe(42.5);
    expect(patch.priceCement).toBe(17);
  });

  it("D) Superplasticizer mapping", () => {
    const material = {
      id: "mat-super-1",
      name: "Medaplast SP40",
      category: "إضافات كيميائية",
      admixtureType: "superplasticizer",
      recommendedDosage: 1.1,
      waterReduction: 22,
      density: 1100,
      price: 120,
    };

    const patch = mapMaterialToMixInput(material);

    expect(patch.selectedAdmixtureId).toBe("mat-super-1");
    expect(patch.dosageSuper).toBe(1.1);
    expect(patch.selectedAdmixtureWaterReduction).toBe(22);
    expect(patch.selectedAdmixtureDensity).toBe(1100);
    expect(patch.priceSuper).toBe(120);
  });

  it("E) EngineeringData fallback", () => {
    const material = {
      id: "mat-fallback-1",
      name: "رمل سيليسي خاص",
      category: "رمال",
      engineeringData: {
        density: 2650,
        absorption: 1.7,
        moistureContent: 3.2,
        finenessModulus: 2.6,
      },
    };

    const patch = mapMaterialToMixInput(material);

    expect(patch.sandRelativeDensity).toBe(2650);
    expect(patch.sandAbsorption).toBe(1.7);
    expect(patch.moistureSand).toBe(3.2);
    expect(patch.finenessModulus).toBe(2.6);
  });

  it("F) Uppercase EMMS fallback", () => {
    const material = {
      id: "mat-fallback-emms",
      name: "رمل عياري EMMS",
      Category: "رمال",
      Density: 2600,
      SpecificGravity: 2.6,
      Absorption: 1.5,
      MoistureContent: 4.2,
      FinenessModulus: 2.8,
    };

    const patch = mapMaterialToMixInput(material);

    expect(patch.sandRelativeDensity).toBe(2600);
    expect(patch.sandAbsorption).toBe(1.5);
    expect(patch.moistureSand).toBe(4.2);
    expect(patch.finenessModulus).toBe(2.8);
  });

  it("G) Admixture water reduction engine effect test", () => {
    // 1. Base input without selectedAdmixtureWaterReduction (dosageSuper = 1.0)
    // Old logic: dosageSuper * 18 = 18% water reduction
    const inputNoOverride = createTestInput({
      dosageSuper: 1.0,
      dosageAir: 0,
      dosageFlyAsh: 0,
      dosageSilicaFume: 0,
    });
    const resNoOverride = calculateDreuxGorisse(inputNoOverride);

    // 2. Base input with selectedAdmixtureWaterReduction = 20 (dosageSuper = 1.0)
    // Override logic: 20% water reduction
    const inputWithOverride = createTestInput({
      dosageSuper: 1.0,
      dosageAir: 0,
      dosageFlyAsh: 0,
      dosageSilicaFume: 0,
      selectedAdmixtureWaterReduction: 20,
    });
    const resWithOverride = calculateDreuxGorisse(inputWithOverride);

    expect(resWithOverride.waterContentActual).toBeDefined();
    
    // Assert that water with 20% reduction is strictly less than 18% reduction
    expect(resWithOverride.waterContentActual).toBeLessThan(resNoOverride.waterContentActual);
  });

  it("H) DEFAULT_EXPANDED_MATERIALS classification test", () => {
    DEFAULT_EXPANDED_MATERIALS.forEach((material) => {
      const isCatalogOnly = material.catalogOnly === true || material.calculationInfluence === "none";
      const patch = mapMaterialToMixInput(material);
      const isEmptyPatch = Object.keys(patch).length === 0;

      if (isCatalogOnly) {
        expect(isEmptyPatch, `Material ${material.id} (${material.category}) is catalogOnly but produced non-empty patch`).toBe(true);
      } else {
        expect(isEmptyPatch, `Material ${material.id} (${material.category}) is NOT catalogOnly but produced empty patch`).toBe(false);
      }
    });
  });
});
