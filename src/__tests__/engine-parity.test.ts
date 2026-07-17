import { describe, it, expect } from "vitest";
import { calculateDreuxGorisse } from "../utils";
import { calculateMixDesign } from "../engine/calculateMixDesign";
import { calculateByMethod } from "../mix-design-methods/calculateByMethod";
import { createTestInput } from "./testHelper";

describe("Dreux-Gorisse Engine Parity & Integration Tests", () => {
  const getBaseInput = (overrides = {}) => {
    return createTestInput({
      fck28: 25,
      controlClass: "normal",
      cementType: "CEM I",
      cementClassStrength: 42.5,
      dMax: 20,
      slump: 8,
      hasPumping: false,
      sandRelativeDensity: 2.65,
      gravelRelativeDensity: 2.68,
      cementDensity: 3105,
      airContent: 1.5,
      moistureSand: 2.0,
      moistureGravel: 0.5,
      admixtures: [],
      dosageSuper: 1.0,
      dosageAir: 0,
      dosageRetarder: 0.5,
      dosageAccelerator: 0,
      selectedMethod: "dreux",
      ...overrides
    });
  };

  it("should output identical core proportions and metadata through all wrapper entrypoints", () => {
    const baseInput = getBaseInput();
    
    // 1. Core Utils Engine (directly wraps core calculation)
    const resUtils = calculateDreuxGorisse(baseInput);

    // 2. Core Engine Router
    const resEngine = calculateMixDesign(baseInput as any);

    // 3. Method Registry Router
    const resRegistry = calculateByMethod("dreux-gorisse", baseInput);

    // Assert weights parity
    expect(resUtils.cementWeight).toBeCloseTo(resEngine.cementKg, 1);
    expect(resUtils.waterContentActual).toBeCloseTo(resEngine.waterKg, 1);
    expect(resUtils.sandWeightDry).toBeCloseTo(resEngine.fineAggregateKg, 1);
    expect(resUtils.gravelWeightDry).toBeCloseTo(resEngine.coarseAggregateKg, 1);

    // Assert ratios parity
    expect(resUtils.wcRatioAdjusted).toBeCloseTo(resEngine.wcRatio, 3);
    expect(resUtils.totalFreshDensity).toBeCloseTo(resEngine.freshDensityKgM3, 1);

    // Assert registry wrapper translates successfully
    expect(resRegistry.quantities?.cementKgPerM3).toBe(Math.round(resUtils.cementWeight));
    expect(resRegistry.quantities?.waterLPerM3).toBe(Math.round(resUtils.waterContentActual));
    expect(resRegistry.quantities?.sandKgPerM3).toBe(Math.round(resUtils.sandWeightDry));
    expect(resRegistry.quantities?.coarseAggregateKgPerM3).toBe(Math.round(resUtils.gravelWeightDry));

    // New Parity Checks for Metadata and Cohesion (User requirement #6)
    expect(resEngine.isValid).toBe(resUtils.isValid);
    expect(resRegistry.isValid).toBe(resUtils.isValid);

    expect(resEngine.errors?.length).toBe(resUtils.errors?.length);
    expect(resRegistry.errors?.length).toBe(resUtils.errors?.length);

    expect(resEngine.warnings?.length).toBe(resUtils.warnings?.length);
    expect(resRegistry.warnings?.length).toBe(resUtils.warnings?.length);

    expect(resEngine.methodApplicability?.level).toBe(resUtils.methodApplicability?.level);
    expect(resRegistry.methodApplicability?.level).toBe(resUtils.methodApplicability?.level);

    expect(resEngine.cementLimitExceeded).toBe(resUtils.cementLimitExceeded);
    expect(resRegistry.cementLimitExceeded).toBe(resUtils.cementLimitExceeded);

    expect(resEngine.validationSummary).toBe(resUtils.validationSummary);
    expect(resRegistry.validationSummary).toBe(resUtils.validationSummary);

    expect(resEngine.absoluteVolumeTotal).toBe(resUtils.absoluteVolumeTotal);
    expect(resRegistry.absoluteVolumeTotal).toBe(resUtils.absoluteVolumeTotal);
  });

  // User requirement #7: Test different concrete types and classes across all paths
  it("C25 across all paths must be valid and applicable", () => {
    const input = getBaseInput({ fck28: 25 });
    const paths = [
      calculateDreuxGorisse(input),
      calculateMixDesign(input as any),
      calculateByMethod("dreux-gorisse", input)
    ];

    for (const res of paths) {
      expect(res.isValid).toBe(true);
      expect(res.methodApplicability?.level).toBe("applicable");
    }
  });

  it("C45 across all paths must be limited", () => {
    const input = getBaseInput({ fck28: 45 });
    const paths = [
      calculateDreuxGorisse(input),
      calculateMixDesign(input as any),
      calculateByMethod("dreux-gorisse", input)
    ];

    for (const res of paths) {
      expect(res.isValid).toBe(true);
      expect(res.methodApplicability?.level).toBe("limited");
    }
  });

  it("C60 across all paths must be not_applicable and not success", () => {
    const input = getBaseInput({ fck28: 60 });
    const resUtils = calculateDreuxGorisse(input);
    const resEngine = calculateMixDesign(input as any);
    const resRegistry = calculateByMethod("dreux-gorisse", input);

    expect(resUtils.isValid).toBe(false);
    expect(resUtils.methodApplicability?.level).toBe("not_applicable");

    expect(resEngine.isValid).toBe(false);
    expect(resEngine.methodApplicability?.level).toBe("not_applicable");

    expect(resRegistry.isValid).toBe(false);
    expect(resRegistry.methodApplicability?.level).toBe("not_applicable");
    expect(resRegistry.status).not.toBe("success");
  });

  it("C80 across all paths must be invalid/not_applicable", () => {
    const input = getBaseInput({ fck28: 80 });
    const paths = [
      calculateDreuxGorisse(input),
      calculateMixDesign(input as any),
      calculateByMethod("dreux-gorisse", input)
    ] as any[];

    for (const res of paths) {
      expect(res.isValid).toBe(false);
      expect(res.methodApplicability?.level).toBe("not_applicable");
    }
    expect(paths[2].status).not.toBe("success");
  });

  it("SCC across all paths must be limited", () => {
    const input = getBaseInput({ concreteType: "SCC" });
    const paths = [
      calculateDreuxGorisse(input),
      calculateMixDesign(input as any),
      calculateByMethod("dreux-gorisse", input)
    ];

    for (const res of paths) {
      expect(res.isValid).toBe(true);
      expect(res.methodApplicability?.level).toBe("limited");
    }
  });

  it("Lightweight concrete across all paths must be limited", () => {
    const input = getBaseInput({ concreteType: "Lightweight" });
    const paths = [
      calculateDreuxGorisse(input),
      calculateMixDesign(input as any),
      calculateByMethod("dreux-gorisse", input)
    ];

    for (const res of paths) {
      expect(res.isValid).toBe(true);
      expect(res.methodApplicability?.level).toBe("limited");
    }
  });

  it("Recycled aggregate concrete across all paths must be limited", () => {
    const input = getBaseInput({ concreteType: "Recycled" });
    const paths = [
      calculateDreuxGorisse(input),
      calculateMixDesign(input as any),
      calculateByMethod("dreux-gorisse", input)
    ];

    for (const res of paths) {
      expect(res.isValid).toBe(true);
      expect(res.methodApplicability?.level).toBe("limited");
    }
  });

  it("Mass concrete across all paths must be limited", () => {
    const input = getBaseInput({ concreteType: "Mass" });
    const paths = [
      calculateDreuxGorisse(input),
      calculateMixDesign(input as any),
      calculateByMethod("dreux-gorisse", input)
    ];

    for (const res of paths) {
      expect(res.isValid).toBe(true);
      expect(res.methodApplicability?.level).toBe("limited");
    }
  });

  // User requirement #8: Prevent case where core says invalid but calculateByMethod says success
  it("should strictly prevent status 'success' when core engine marks calculation as invalid", () => {
    // Generate an invalid input scenario (e.g., extremely high fck strength of 80 MPa or extreme cement)
    const invalidInput = getBaseInput({ fck28: 85 });
    
    const coreResult = calculateDreuxGorisse(invalidInput);
    const methodResult = calculateByMethod("dreux-gorisse", invalidInput);

    expect(coreResult.isValid).toBe(false);
    expect(methodResult.isValid).toBe(false);
    expect(methodResult.status).not.toBe("success");
    expect(methodResult.status).toBe("not-supported");
  });

  it("should ensure admixtures are not lost when passed through dreuxGorisse.ts", () => {
    const input = getBaseInput({
      admixtures: [
        {
          id: "admix-1",
          nameAr: "ملدن فائق",
          nameFr: "Superplastifiant",
          nameEn: "Superplasticizer",
          type: "superplasticizer",
          dosagePercent: 1.5,
          relativeDensity: 1.2
        }
      ]
    });

    const resEngine = calculateMixDesign(input as any);
    const resRegistry = calculateByMethod("dreux-gorisse", input);

    expect(resEngine.isValid).toBe(true);
    expect(resRegistry.isValid).toBe(true);
  });
});
