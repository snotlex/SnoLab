import { describe, expect, it } from "vitest";
import { calculateDreuxGorisse } from "../../utils";
import { createTestInput } from "../../__tests__/testHelper";

function base() {
  return createTestInput({
    bypassSuitabilityGate: true,
    fck28: 25,
    controlClass: "normal",
    cementType: "CEM I",
    cementClassStrength: 42.5,
    dMax: 20,
    slump: 8,
    sandRelativeDensity: 2.65,
    gravelRelativeDensity: 2.68,
    cementDensity: 3100,
    airContent: 1.5,
    moistureSand: 4.0,
    moistureGravel: 1.0,
    sandAbsorption: 1.5,
    gravelAbsorption: 0.8,
    finenessModulus: 2.6,
    dosageSuper: 0,
    dosageAir: 0,
    dosageRetarder: 0,
    dosageAccelerator: 0,
    dosageSilicaFume: 0,
    dosageFlyAsh: 0,
    dosageSlag: 0,
    admixtures: [],
    selectedMethod: "dreux",
    exposureClass: "X0",
    durabilityLevel: "standard",
    carbonationLevel: "none",
    chloridesLevel: "none",
    sulfatesLevel: "none",
    priceCement: 17,
    priceSand: 2.5,
    priceGravel: 2.8,
    priceSuper: 120,
    priceAir: 95,
    priceRetarder: 85,
    priceAccelerator: 110,
    priceSilicaFume: 60,
    priceFlyAsh: 35,
    priceSlag: 30,
    priceLabor: 0,
    priceWater: 0,
    sandType: "Sand 0/4",
    gravelType: "Gravel 4/20",
    autoDensities: true
  });
}

describe("Dreux-Gorisse corrected calculation layer", () => {
  it("returns true W/C in all W/C result fields", () => {
    const result: any = calculateDreuxGorisse(base());

    const expected = result.waterContentActual / result.cementWeight;
    expect(result.wcRatioAdjusted).toBeCloseTo(expected, 8);
    expect(result.waterCementRatio).toBeCloseTo(expected, 8);
    expect(result.ratios?.waterCementRatio ?? expected).toBeCloseTo(expected, 8);

    const binderRatio = result.waterContentActual / (result.totalBinder || result.cementWeight);
    expect(result.waterBinderRatio).toBeCloseTo(binderRatio, 8);
    expect(result.wcRatioAdjusted).not.toBeCloseTo(binderRatio, 6);
  });

  it("does not silently activate a legacy W/C override", () => {
    const regular: any = calculateDreuxGorisse({
      ...(base() as any),
      internalWcOverride: 0.60
    } as any);

    const explicit: any = calculateDreuxGorisse({
      ...(base() as any),
      internalWcOverride: 0.60,
      useManualWcOverride: true
    } as any);

    expect(regular.calculationMode).toBe("strengthBased");
    expect(explicit.calculationMode).toBe("manualWBR");
    expect(regular.cementWeight).not.toBeCloseTo(explicit.cementWeight, 3);
  });

  it("uses selected material grading to solve the sand/coarse aggregate split", () => {
    const input: any = {
      ...(base() as any),
      selectedSandId: "sand-1",
      selectedGravelId: "grav-1",
      materialsDatabase: [
        {
          id: "sand-1",
          name: "Sand 0/4",
          category: "رمال",
          type: "sand",
          ApprovalStatus: "Approved",
          status: "نشط",
          density: 2650,
          specificGravity: 2.65,
          absorption: 1.5,
          moisture: 4,
          finenessModulus: 2.6,
          gradationData: [
            { sieve: 0.08, passing: 2 },
            { sieve: 0.315, passing: 20 },
            { sieve: 0.63, passing: 45 },
            { sieve: 1.25, passing: 70 },
            { sieve: 2.5, passing: 92 },
            { sieve: 4.75, passing: 100 }
          ]
        },
        {
          id: "grav-1",
          name: "Gravel 4/20",
          category: "حصى",
          type: "gravel",
          ApprovalStatus: "Approved",
          status: "نشط",
          density: 2680,
          specificGravity: 2.68,
          absorption: 0.8,
          moisture: 1,
          dMax: 20,
          particleShape: "مكسر",
          gradationData: [
            { sieve: 0.08, passing: 0 },
            { sieve: 0.315, passing: 0 },
            { sieve: 0.63, passing: 2 },
            { sieve: 1.25, passing: 3 },
            { sieve: 2.5, passing: 8 },
            { sieve: 4.75, passing: 15 },
            { sieve: 10, passing: 55 },
            { sieve: 20, passing: 100 }
          ]
        },
        {
          id: "cem-1",
          name: "CEM I 42.5",
          category: "إسمنت",
          type: "cementitious",
          ApprovalStatus: "Approved",
          status: "نشط",
          density: 3100,
          strengthClass: "42.5"
        },
        {
          id: "wat-1",
          name: "Mixing Water",
          category: "ماء",
          type: "water",
          ApprovalStatus: "Approved",
          status: "نشط",
          density: 1000
        }
      ],
      selectedCementId: "cem-1",
      selectedWaterId: "wat-1",
      aggregateType: "concasse",
      aggregateQuality: "standard"
    };

    const result: any = calculateDreuxGorisse(input);
    expect(result.engineeringAudit?.granularOptimization.source).toBe("material-grading");
    expect(result.engineeringAudit?.granularOptimization.sampleCount).toBeGreaterThanOrEqual(3);
    expect(result.actualGradingCurve?.length).toBeGreaterThan(0);
    expect(result.engineeringAudit?.granularOptimization.rmse).toBeFinite();
    expect(result.sandPercent + result.gravelPercent).toBeCloseTo(100, 6);
  });

  it("never reports a hard cement cap as a valid final design", () => {
    const result: any = calculateDreuxGorisse({
      ...(base() as any),
      fck28: 150,
      slump: 8
    } as any);

    expect(result.theoreticalCementDemand).toBeGreaterThan(550);
    expect(result.cementLimitExceeded).toBe(true);
    expect(result.isValid).toBe(false);
    expect(result.engineStatus).toBe("blocked");
    expect(result.cementWeight).toBeGreaterThan(550);
  });

  it("applies the classical Dreux K corrections and correct pivot X for Dmax", () => {
    const mf25: any = calculateDreuxGorisse(base());
    const mf28: any = calculateDreuxGorisse({
      ...(base() as any),
      finenessModulus: 2.8
    } as any);

    const y25 = mf25.gradingCurve.find((p: any) => Math.abs(p.size - 10) < 1e-6)?.targetPassing;
    const y28 = mf28.gradingCurve.find((p: any) => Math.abs(p.size - 10) < 1e-6)?.targetPassing;

    expect(y25).toBeDefined();
    expect(y28).toBeDefined();
    // Ks = 6 Mf - 15, therefore changing Mf 2.5 -> 2.8 raises Y by 1.8 points.
    expect(y28 - y25).toBeCloseTo(1.8, 6);

    const d8: any = calculateDreuxGorisse({
      ...(base() as any),
      dMax: 8
    } as any);
    expect(d8.gradingCurve.some((p: any) => Math.abs(p.size - 4) < 1e-6)).toBe(true);

    const d25: any = calculateDreuxGorisse({
      ...(base() as any),
      dMax: 25
    } as any);
    const expectedX = Math.sqrt(5 * 25);
    expect(
      d25.gradingCurve.some((p: any) => Math.abs(p.size - expectedX) < 1e-6)
    ).toBe(true);
  });

  it("honours multiple structured admixture rows", () => {
    const result: any = calculateDreuxGorisse({
      ...(base() as any),
      admixtures: [
        {
          id: "sp-1",
          name: "Superplasticizer A",
          type: "superplasticizer",
          dosage: 0.8,
          waterReduction: 20,
          effect: "water reduction"
        },
        {
          id: "sp-2",
          name: "Superplasticizer B",
          type: "superplasticizer",
          dosage: 0.4,
          waterReduction: 30,
          effect: "water reduction"
        }
      ]
    } as any);

    expect(result.calculationMode).toBe("strengthBased");
    expect(result.admixtureWeights.length).toBeGreaterThan(0);
    expect(result.waterFromAdmixtures).toBeGreaterThan(0);
    expect(result.admixtureWeights.reduce((s: number, a: any) => s + a.weight, 0)).toBeGreaterThan(0);
  });
});
