import { describe, it, expect } from "vitest";
import { normalizeDensity } from "../densityNormalization";
import { applyMoistureCorrection } from "../moistureCorrection";
import { calculateAbsoluteVolume } from "../absoluteVolume";
import { getEN206ExposureLimits } from "../en206Compliance";
import { calculateDreuxGorisseCore, DreuxGorisseInput } from "../dreuxGorisseCore";
import { AggregateType, AggregateQuality } from "../../types";

describe("Concrete Mix Calculation Engine Refactor Suite", () => {
  describe("1. Density Normalization", () => {
    it("should correctly interpret g/cm³ as specific gravity", () => {
      const norm = normalizeDensity(3.15, "cement");
      expect(norm.isValid).toBe(true);
      expect(norm.specificGravity).toBeCloseTo(3.15, 3);
      expect(norm.densityKgM3).toBeCloseTo(3150, 1);
      expect(norm.densityKgL).toBeCloseTo(3.15, 3);
      expect(norm.sourceUnit).toBe("relative");
    });

    it("should correctly interpret kg/m³ as absolute density", () => {
      const norm = normalizeDensity(3100, "cement");
      expect(norm.isValid).toBe(true);
      expect(norm.specificGravity).toBeCloseTo(3.1, 3);
      expect(norm.densityKgM3).toBe(3100);
      expect(norm.densityKgL).toBeCloseTo(3.1, 3);
      expect(norm.sourceUnit).toBe("kg/m3");
    });

    it("should correctly handle sand specific gravity", () => {
      const norm = normalizeDensity(2.65, "sand");
      expect(norm.isValid).toBe(true);
      expect(norm.specificGravity).toBeCloseTo(2.65, 3);
      expect(norm.densityKgM3).toBeCloseTo(2650, 1);
      expect(norm.densityKgL).toBeCloseTo(2.65, 3);
    });

    it("should reject unphysical or negative densities", () => {
      const normNeg = normalizeDensity(-5, "cement");
      expect(normNeg.isValid).toBe(false);
      const normZero = normalizeDensity(0, "gravel");
      expect(normZero.isValid).toBe(false);
    });
  });

  describe("2. Moisture & SSD Corrections", () => {
    it("should handle dry aggregates with absorption deficit (M < A)", () => {
      const res = applyMoistureCorrection({
        sandDryKg: 700,
        gravelDryKg: 1100,
        effectiveWaterKg: 180,
        sandMoisturePercent: 0.5,
        sandAbsorptionPercent: 1.5,
        gravelMoisturePercent: 0.2,
        gravelAbsorptionPercent: 0.8
      });

      // Deficit = (1.5 - 0.5)% of 700 = 7 kg, (0.8 - 0.2)% of 1100 = 6.6 kg
      expect(res.fineAggregate.moistureState).toBe("dryOfSSD");
      expect(res.coarseAggregate.moistureState).toBe("dryOfSSD");
      expect(res.totalAbsorptionDeficitKg).toBeGreaterThan(0);
      expect(res.waterToAddKg).toBeGreaterThan(180);
    });

    it("should handle wet aggregates with free surface water (M > A)", () => {
      const res = applyMoistureCorrection({
        sandDryKg: 700,
        gravelDryKg: 1100,
        effectiveWaterKg: 180,
        sandMoisturePercent: 4.0,
        sandAbsorptionPercent: 1.5,
        gravelMoisturePercent: 1.5,
        gravelAbsorptionPercent: 0.8
      });

      expect(res.fineAggregate.moistureState).toBe("wetOfSSD");
      expect(res.totalFreeSurfaceWaterKg).toBeGreaterThan(0);
      expect(res.waterToAddKg).toBeLessThan(180);
    });

    it("should cap waterToAdd at 0 when rawWaterToAdd is negative and log warning", () => {
      const res = applyMoistureCorrection({
        sandDryKg: 1000,
        gravelDryKg: 1200,
        effectiveWaterKg: 30, // artificially low water
        sandMoisturePercent: 8.0,
        sandAbsorptionPercent: 1.0,
        gravelMoisturePercent: 3.0,
        gravelAbsorptionPercent: 0.5
      });

      expect(res.rawWaterToAddKg).toBeLessThan(0);
      expect(res.waterToAddKg).toBe(0);
      expect(res.warnings.some(w => w.includes("تحذير حرج") || w.includes("الركام رطب جداً"))).toBe(true);
    });
  });

  describe("3. Absolute Volume Closure", () => {
    it("should compute absolute volumes with rigorous conservation of mass/density", () => {
      const res = calculateAbsoluteVolume({
        cementKg: 350,
        waterKg: 175,
        fineAggregateKg: 720,
        coarseAggregateKg: 1150,
        airContentPercent: 2.0,
        cementDensityKgM3: 3150,
        sandRelativeDensity: 2.65,
        gravelRelativeDensity: 2.68
      });

      expect(res.cementVolL).toBeCloseTo(350 / 3.15, 2);
      expect(res.waterVolL).toBe(175);
      expect(res.airVolL).toBe(20);
      expect(res.totalAbsVolumeL).toBeGreaterThan(950);
      expect(res.totalAbsVolumeL).toBeLessThan(1050);
    });
  });

  describe("4. EN 206 Compliance Engine", () => {
    it("should retrieve valid exposure limits for standard classes", () => {
      const xc1 = getEN206ExposureLimits("XC1");
      expect(xc1).toBeDefined();
      expect(xc1?.maxWcRatio).toBe(0.65);
      expect(xc1?.minCementKg).toBe(260);

      const xs3 = getEN206ExposureLimits("XS3");
      expect(xs3).toBeDefined();
      expect(xs3?.maxWcRatio).toBe(0.45);
      expect(xs3?.minCementKg).toBe(340);
    });
  });

  describe("5. Dreux-Gorisse Core Engine Orchestration & Structured Outputs", () => {
    const baseInput: DreuxGorisseInput = {
      bypassSuitabilityGate: true,
      fck28: 25,
      controlClass: "high",
      cementType: "CEM II",
      cementClassStrength: 42.5,
      cementDensity: 3100, // kg/m³
      slump: 8,
      dMax: 20,
      aggregateType: AggregateType.CONCASSE,
      aggregateQuality: AggregateQuality.STANDARD,
      hasPumping: false,
      sandRelativeDensity: 2.65,
      gravelRelativeDensity: 2.68,
      finenessModulus: 2.6,
      sandAbsorption: 1.5,
      gravelAbsorption: 0.8,
      moistureSand: 3.0,
      moistureGravel: 1.0,
      airContent: 2.0,
      batchVolume: 2.5
    };

    it("should return the new 3-layer structured outputs and calculation trace", () => {
      const result = calculateDreuxGorisseCore(baseInput);

      // Status check
      expect(result.valid).toBe(true);
      expect(result.engineStatus).toBeDefined();
      expect(["valid", "valid_with_warnings"]).toContain(result.engineStatus);

      // Layer 1: designSSD
      expect(result.designSSD).toBeDefined();
      expect(result.designSSD.cementKg).toBeGreaterThan(200);
      expect(result.designSSD.fineAggregateSSDKg).toBeGreaterThan(result.sandWeightDry);
      expect(result.designSSD.effectiveWaterKg).toBe(result.effectiveWater);
      expect(result.designSSD.waterCementRatio).toBeCloseTo(result.waterCementRatio, 3);

      // Layer 2: batchCorrection
      expect(result.batchCorrection).toBeDefined();
      expect(result.batchCorrection.aggregates.length).toBe(2);
      expect(result.batchCorrection.fineAggregate.fractionName).toContain("Fine Aggregate");
      expect(result.batchCorrection.waterToAddKg).toBe(result.waterToAdd);

      // Layer 3: batchQuantities
      expect(result.batchQuantities).toBeDefined();
      expect(result.batchQuantities.batchVolumeM3).toBe(2.5);
      expect(result.batchQuantities.cementKg).toBeCloseTo(result.designSSD.cementKg * 2.5, 2);
      expect(result.batchQuantities.fineAggregateWetKg).toBeCloseTo(result.sandWeightWet * 2.5, 2);
      expect(result.batchQuantities.totalBatchWeightKg).toBeGreaterThan(5000);

      // Calculation Trace
      expect(result.calculationTrace).toBeDefined();
      expect(result.calculationTrace.length).toBeGreaterThanOrEqual(8);
      expect(result.calculationTrace[0].name).toContain("Target Compressive Strength");

      // Backward compatibility aliases
      expect(result.cementWeight).toBe(result.designSSD.cementKg);
      expect(result.actualCementUsed).toBe(result.designSSD.cementKg);
      expect(result.waterDemand).toBe(result.effectiveWater);
      expect(result.waterWeightWet).toBe(result.batchWaterToAdd);
      expect(result.absoluteVolumeTotal).toBeDefined();
    });

    it("should guarantee no NaN or Infinity across all outputs", () => {
      const result = calculateDreuxGorisseCore(baseInput);

      const checkNoNaNOrInf = (obj: any, path = "") => {
        if (obj === null || obj === undefined) return;
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          if (typeof value === "number") {
            expect(isNaN(value), `Found NaN at ${currentPath}`).toBe(false);
            expect(isFinite(value), `Found Infinity at ${currentPath}`).toBe(true);
          } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            checkNoNaNOrInf(value, currentPath);
          }
        }
      };

      checkNoNaNOrInf(result.designSSD, "designSSD");
      checkNoNaNOrInf(result.batchCorrection, "batchCorrection");
      checkNoNaNOrInf(result.batchQuantities, "batchQuantities");
    });
  });
});
