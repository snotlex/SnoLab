import { describe, it, expect } from "vitest";
import { calculateDreuxGorisseCore } from "../engine/dreuxGorisseCore";
import { createTestInput } from "./testHelper";
import { AggregateType, AggregateQuality } from "../types";

describe("Dreux-Gorisse Absolute Volume Closure", () => {
  const getBaseInput = (fck: number) => createTestInput({
    bypassSuitabilityGate: true,
    fck28: fck,
    controlClass: "normal",
    cementType: "CEM II",
    cementClassStrength: 42.5,
    dMax: 20,
    slump: 10,
    aggregateType: AggregateType.CONCASSE,
    aggregateQuality: AggregateQuality.STANDARD,
    hasPumping: false,
    sandRelativeDensity: 2.65,
    gravelRelativeDensity: 2.68,
    cementDensity: 3105,
    airContent: 1.0,
    moistureSand: 0,
    moistureGravel: 0,
    admixtures: [],
    dosageSuper: 0.8,
    dosageAir: 0,
    dosageRetarder: 0,
    dosageAccelerator: 0,
    selectedMethod: "dreux"
  });

  const runClosureTest = (fck: number) => {
    const input = getBaseInput(fck);
    const result = calculateDreuxGorisseCore(input);

    expect(result.isValid).toBe(true);

    // Calculate absolute volumes of all components in Liters
    const cDensityKgL = (input.cementDensity || 3105) / 1000;
    const sDensityKgL = input.sandRelativeDensity;
    const gDensityKgL = input.gravelRelativeDensity;

    const vCement = result.cementWeight / cDensityKgL;
    const vWater = result.waterContentActual; // 1 kg = 1 L
    const vSand = result.sandWeightDry / sDensityKgL;
    const vGravel = result.gravelWeightDry / gDensityKgL;
    const vAir = (input.airContent || 0) * 10; // 1% of 1m3 (1000L) is 10L

    const activeAdmixWeight = result.admixtureWeights.reduce((s, a) => s + a.weight, 0);
    const vAdmix = activeAdmixWeight / 1.15; // density 1.15 kg/L

    const totalVolumeL = vCement + vWater + vSand + vGravel + vAir + vAdmix;

    // Strict tolerance of ±0.5 L
    const deviationL = Math.abs(totalVolumeL - 1000);
    
    expect(deviationL).toBeLessThanOrEqual(0.5);
  };

  it("should enforce volume closure for C20 Concrete (fck = 20 MPa)", () => {
    runClosureTest(20);
  });

  it("should enforce volume closure for C25 Concrete (fck = 25 MPa)", () => {
    runClosureTest(25);
  });

  it("should enforce volume closure for C30 Concrete (fck = 30 MPa)", () => {
    runClosureTest(30);
  });

  it("should enforce volume closure for C40 Concrete (fck = 40 MPa)", () => {
    runClosureTest(40);
  });

  it("should calculate volume closure correctly without NaN for FlyAsh, Slag, and SilicaFume dosages", () => {
    const input = createTestInput({
      ...getBaseInput(30),
      dosageFlyAsh: 15,
      dosageSlag: 20,
      dosageSilicaFume: 8,
    });
    const result = calculateDreuxGorisseCore(input);

    expect(result.isValid).toBe(true);
    expect(result.absoluteVolumeCheck.totalAbsVolumeL).not.toBeNaN();
    expect(isFinite(result.absoluteVolumeCheck.totalAbsVolumeL)).toBe(true);

    // Ensure SCM values are explicitly filled in
    expect(result.flyAshKg).toBeGreaterThan(0);
    expect(result.slagKg).toBeGreaterThan(0);
    expect(result.silicaFumeKg).toBeGreaterThan(0);
    expect(result.totalBinder).toBeGreaterThan(0);
    expect(result.activeCementWeight).toBeGreaterThan(0);

    // Deviation check
    const absDev = Math.abs(result.absoluteVolumeCheck.totalAbsVolumeL - 1000);
    expect(absDev).toBeLessThanOrEqual(5.0); // Safe threshold including SCM compaction density models
  });
});
