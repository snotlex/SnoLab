import { describe, it, expect } from "vitest";
import { 
  calculateMixDesign, 
  calculateAbsoluteVolume, 
  checkFreshDensity, 
  applyMoistureCorrection, 
  checkEN206Compliance,
  MixDesignInput
} from "../index";

describe("Unified Concrete Engineering Engine Checks", () => {
  const baseInput: MixDesignInput = {
    bypassSuitabilityGate: true,
    fck28: 25,
    controlClass: "high",
    cementType: "CEM II",
    cementClassStrength: 42.5,
    dMax: 20,
    slump: 7,
    aggregateType: "roule",
    aggregateQuality: "standard",
    hasPumping: false,
    sandRelativeDensity: 2.65,
    gravelRelativeDensity: 2.68,
    cementDensity: 3100,
    airContent: 1.0,
    moistureSand: 4.5,
    moistureGravel: 1.2,
    selectedMethod: "dreux"
  };

  it("should match accurate route output based on selectedMethod", () => {
    const resDreux = calculateMixDesign({ ...baseInput, selectedMethod: "dreux" });
    expect(resDreux.methodName).toBe("Dreux-Gorisse");
    expect(resDreux.cementKg).toBeGreaterThan(0);
  });

  it("should compute absolute volumes with high mathematical precision", () => {
    const vol = calculateAbsoluteVolume({
      cementKg: 350,
      waterKg: 175,
      fineAggregateKg: 700,
      coarseAggregateKg: 1100,
      admixtureKg: 2,
      airContentPercent: 2.0,
      cementDensityKgM3: 3100,
      sandRelativeDensity: 2.65,
      gravelRelativeDensity: 2.68
    });

    expect(vol.cementVolL).toBeCloseTo((350 / 3100) * 1000, 2);
    expect(vol.waterVolL).toBe(175);
    expect(vol.sandVolL).toBeCloseTo(700 / 2.65, 2);
    expect(vol.gravelVolL).toBeCloseTo(1100 / 2.68, 2);
    expect(vol.totalAbsVolumeL).toBeGreaterThan(900);
  });

  it("should evaluate and flag unhealthy fresh density weights", () => {
    const normalDensity = checkFreshDensity({
      cementKg: 350,
      waterKg: 180,
      fineAggregateKg: 650,
      coarseAggregateKg: 1150
    });
    expect(normalDensity.freshDensityKgM3).toBe(2330);
    expect(normalDensity.isHealthy).toBe(true);
    expect(normalDensity.warnings.length).toBe(0);

    const lowDensity = checkFreshDensity({
      cementKg: 250,
      waterKg: 150,
      fineAggregateKg: 500,
      coarseAggregateKg: 800
    });
    expect(lowDensity.isHealthy).toBe(false);
    expect(lowDensity.warnings.some(w => w.includes("Low fresh density"))).toBe(true);
  });

  it("should calculate correct scale batch with aggregate moisture corrections", () => {
    const correction = applyMoistureCorrection({
      sandDryKg: 680,
      gravelDryKg: 1200,
      waterPureKg: 190,
      sandMoisturePercent: 5.0,
      gravelMoisturePercent: 1.0
    });

    expect(correction.sandWetKg).toBe(680 * 1.05);
    expect(correction.gravelWetKg).toBe(1200 * 1.01);
    
    const anticipatedWaterContribution = (680 * 0.05) + (1200 * 0.01);
    expect(correction.waterAddedKg).toBe(190 - anticipatedWaterContribution);
  });

  it("should test EN 206 local exposure standard thresholds", () => {
    const compXC1 = checkEN206Compliance({
      exposureClass: "XC1",
      cementType: "CEM II",
      cementKg: 280,
      waterKg: 170,
      wcRatio: 170 / 280
    });
    expect(compXC1.isCompliant).toBe(true);

    const nonCompXC1 = checkEN206Compliance({
      exposureClass: "XC1",
      cementType: "CEM II",
      cementKg: 240, // standard minimum is 260
      waterKg: 180,
      wcRatio: 180 / 240 // 0.75 > 0.65
    });
    expect(nonCompXC1.isCompliant).toBe(false);
  });
});
