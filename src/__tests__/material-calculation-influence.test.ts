import { describe, it, expect } from "vitest";
import { calculateDreuxGorisse } from "../utils";
import { createTestInput } from "./testHelper";
import { SEEDED_MATERIALS } from "../data/seededMaterials";
import { mapMaterialToMixInput } from "../utils/mapMaterialToMixInput";

describe("Material Calculation Influence Layer - Dreux-Gorisse Engine Tests", () => {
  it("1. Water quality warnings (pH, Chloride, Sulphate)", () => {
    // A) Safe water values (no warnings)
    const inputSafe = createTestInput({
      selectedWaterName: "مياه النيل المفلترة",
      selectedWaterPH: 7.2,
      selectedWaterChlorideContent: 150,
      selectedWaterSulphateContent: 200,
    });
    const resultSafe = calculateDreuxGorisse(inputSafe) as any;
    const hasWaterWarning = resultSafe.warnings.some((w: string) => w.includes("مياه") && (w.includes("حموضة") || w.includes("كلوريد") || w.includes("كبريتات")));
    expect(hasWaterWarning).toBe(false);

    // B) Dangerous pH (< 5.5)
    const inputAcidic = createTestInput({
      selectedWaterName: "مياه حمضية صناعية",
      selectedWaterPH: 4.5,
    });
    const resultAcidic = calculateDreuxGorisse(inputAcidic) as any;
    expect(resultAcidic.warnings.some((w: string) => w.includes("pH") || w.includes("حموضة"))).toBe(true);

    // C) High Chloride (> 500 ppm)
    const inputChloride = createTestInput({
      selectedWaterName: "مياه مالحة",
      selectedWaterChlorideContent: 600,
    });
    const resultChloride = calculateDreuxGorisse(inputChloride) as any;
    expect(resultChloride.warnings.some((w: string) => w.includes("كلوريد"))).toBe(true);

    // D) High Sulphate (> 2000 ppm)
    const inputSulphate = createTestInput({
      selectedWaterName: "مياه كبريتية عالية",
      selectedWaterSulphateContent: 2200,
    });
    const resultSulphate = calculateDreuxGorisse(inputSulphate) as any;
    expect(resultSulphate.warnings.some((w: string) => w.includes("كبريتات"))).toBe(true);
  });

  it("2. Lightweight aggregate influence (LWC mode, absorption, moisture, density)", () => {
    const inputLwc = createTestInput({
      selectedLightweightAggregateId: "mat-lwc-1",
      selectedLightweightAggregateName: "ركام الطين المنفوخ خفيف الوزن",
      lightweightAggregateDensity: 1200,
      lightweightAggregateAbsorption: 15.0,
      lightweightAggregateMoisture: 4.5,
    });

    const result = calculateDreuxGorisse(inputLwc) as any;

    // The core overrides gravelRelativeDensity, gravelAbsorption, and moistureGravel
    expect(result.totalFreshDensity).toBeLessThan(2100); // Standard is ~2350
    expect(result.warnings.some((w: string) => w.includes("خفيفة الوزن") || w.includes("LWC"))).toBe(true);
  });

  it("3. Heavyweight aggregate influence (HWC mode, density override)", () => {
    const inputHwc = createTestInput({
      selectedHeavyweightAggregateId: "mat-hwc-1",
      selectedHeavyweightAggregateName: "ركام الماجنتيت الثقيل",
      heavyweightAggregateDensity: 3900,
      heavyweightType: "حديد المغناطيسي",
    });

    const result = calculateDreuxGorisse(inputHwc) as any;

    expect(result.totalFreshDensity).toBeGreaterThan(2600); // Standard is ~2350
    expect(result.warnings.some((w: string) => w.includes("ثقيلة الوزن") || w.includes("HWC"))).toBe(true);
  });

  it("4. Fibers influence (dosage, density, warnings, totalFreshDensity, costing, steps)", () => {
    const inputFiber = createTestInput({
      selectedFiberName: "ألياف فولاذية مقاومة",
      fiberType: "steel",
      fiberDosageKgM3: 45, // High dosage (> 40 kg/m3) triggers warning
      fiberDensity: 7850,
      priceFiber: 15, // Cost per kg
    });

    const result = calculateDreuxGorisse(inputFiber) as any;

    // Assert warning for high fiber dosage
    expect(result.warnings.some((w: string) => w.includes("ألياف") || w.includes("الألياف"))).toBe(true);

    // Assert fresh density is increased by fiber weight
    expect(result.totalFreshDensity).toBeGreaterThan(2300);

    // Costing check
    expect(result.totalCost).toBeGreaterThan(0);
    expect(result.costBreakdown.some((b: any) => b.material.includes("Fibers"))).toBe(true);

    // Detailed steps log fiber
    expect(result.detailedSteps.some((s: string) => s.includes("ألياف") && s.includes("45"))).toBe(true);
  });

  it("5. SCM selectedScmDensity mapping & absolute volume influence", () => {
    // Without SCM density override, Fly Ash density is 2.2 g/cm3
    const inputNoOverride = createTestInput({
      dosageFlyAsh: 15,
    });
    const resultNoOverride = calculateDreuxGorisse(inputNoOverride) as any;

    // With heavy SCM density override (e.g. 3.0 g/cm3)
    const inputOverride = createTestInput({
      dosageFlyAsh: 15,
      selectedScmName: "رماد متطاير ثقيل مخصص",
      selectedScmDensity: 3000,
    });
    const resultOverride = calculateDreuxGorisse(inputOverride) as any;

    // SCM of higher density occupies less volume, so more aggregate absolute volume is left
    expect(resultOverride.gravelWeightDry).toBeGreaterThan(resultNoOverride.gravelWeightDry);
  });

  it("6. Special binder influence (replacement, weight, volume, warnings, costing)", () => {
    const inputSpecial = createTestInput({
      selectedSpecialBinderId: "mat-special-binder-1",
      selectedSpecialBinderName: "رابط جيو-بوليمري صديق للبيئة",
      specialBinderDensity: 2900,
      specialBinderReplacementPercent: 20,
      specialBinderStrengthClass: "C50",
      priceSpecialBinder: 25,
    });

    const result = calculateDreuxGorisse(inputSpecial) as any;

    // Special binder should trigger a warning/note
    expect(result.warnings.some((w: string) => w.includes("رابط خاص") || w.includes("رابط مخصص") || w.includes("المجلد") || w.includes("مجلد"))).toBe(true);

    // Verify costing breakdown includes special binder
    expect(result.costBreakdown.some((b: any) => b.material.includes("Special Binder"))).toBe(true);

    // Detailed steps log special binder
    expect(result.detailedSteps.some((s: string) => s.includes("المجلد") && s.includes("20"))).toBe(true);
  });

  it("7. Proves that applying each seeded material category produces either a calculation change or validation/report trace", () => {
    const categoriesTested = new Set<string>();

    for (const mat of SEEDED_MATERIALS) {
      const category = mat.category || mat.type;
      if (!category) continue;

      const patch = mapMaterialToMixInput(mat);
      
      // If the material category/type isn't mapped to a property, skip checking
      if (Object.keys(patch).length === 0) {
        continue;
      }

      const baselineInput = createTestInput({
        selectedScmReplacementPercent: 10,
        dosageSlag: 10,
        dosageFlyAsh: 10,
        dosageSilicaFume: 10,
        dosageSuper: 1.5,
      });
      const patchedInput = createTestInput({
        selectedScmReplacementPercent: 10,
        dosageSlag: 10,
        dosageFlyAsh: 10,
        dosageSilicaFume: 10,
        dosageSuper: 1.5,
        ...patch
      });

      const baselineResult = calculateDreuxGorisse(baselineInput) as any;
      const patchedResult = calculateDreuxGorisse(patchedInput) as any;

      // Prove that it either changes the numerical output, or produces warnings/traces, or alters costing
      const hasNumericalChange = 
        patchedResult.totalFreshDensity !== baselineResult.totalFreshDensity ||
        patchedResult.sandWeightDry !== baselineResult.sandWeightDry ||
        patchedResult.gravelWeightDry !== baselineResult.gravelWeightDry ||
        patchedResult.totalCost !== baselineResult.totalCost;

      const hasTraceOrWarningChange = 
        patchedResult.warnings.length !== baselineResult.warnings.length ||
        patchedResult.detailedSteps.length !== baselineResult.detailedSteps.length ||
        JSON.stringify(patchedResult.warnings) !== JSON.stringify(baselineResult.warnings) ||
        JSON.stringify(patchedResult.detailedSteps) !== JSON.stringify(baselineResult.detailedSteps);

      if (!(hasNumericalChange || hasTraceOrWarningChange)) {
        console.log("FAILING MATERIAL DETAILS:", {
          name: mat.name,
          category,
          patch,
          baselineDensity: baselineResult.totalFreshDensity,
          patchedDensity: patchedResult.totalFreshDensity,
          baselineCost: baselineResult.totalCost,
          patchedCost: patchedResult.totalCost,
        });
      }

      // Verify that at least one form of influence is registered
      expect(hasNumericalChange || hasTraceOrWarningChange).toBe(true);
      
      categoriesTested.add(category);
    }

    // Ensure we covered all standard 11 distinct categories present in SEEDED_MATERIALS
    expect(categoriesTested.size).toBeGreaterThanOrEqual(11);
  });
});
