import { describe, it, expect } from "vitest";
import { calculateDreuxGorisse } from "../../utils";
import { MixDesignInput } from "../../types";

describe("Dreux-Gorisse Engineering Rigor & Formulation Audit Checks", () => {
  const getC25Input = (): MixDesignInput => ({
    bypassSuitabilityGate: true,
    fck28: 25, // C25/30
    controlClass: "normal",
    cementType: "CEM_II",
    cementClassStrength: 42.5,
    dMax: 20,
    slump: 8,
    aggregateType: "concasse" as any,
    aggregateQuality: "standard" as any,
    hasPumping: false,
    sandRelativeDensity: 2.65,
    gravelRelativeDensity: 2.68,
    cementDensity: 3100,
    airContent: 1.5,
    moistureSand: 4.5,
    moistureGravel: 1.2,
    sandAbsorption: 1.5,
    gravelAbsorption: 0.8,
    admixtures: [],
    dosageSuper: 1.0,
    dosageAir: 0.0,
    dosageRetarder: 0.0,
    dosageAccelerator: 0.0,
    dosageSilicaFume: 0.0,
    dosageFlyAsh: 0.0,
    dosageSlag: 0.0,
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
    sandType: "Standard Sand",
    gravelType: "Standard Gravel",
    autoDensities: true
  });

  const getC30Input = (): MixDesignInput => ({
    ...getC25Input(),
    fck28: 30, // C30/37
    cementClassStrength: 42.5,
    dosageSuper: 1.2,
    moistureSand: 3.5,
    moistureGravel: 1.0
  });

  const getC35Input = (): MixDesignInput => ({
    ...getC25Input(),
    fck28: 35, // C35/45
    cementClassStrength: 52.5,
    dosageSuper: 1.5,
    moistureSand: 2.0,
    moistureGravel: 0.5
  });

  const auditResultStructure = (res: any, input: MixDesignInput) => {
    // 1. Volume closure verification (Sum of absolute volumes of all components = 1000 Liters)
    const cementVolL = res.cementWeight / (input.cementDensity / 1000);
    const sandVolL = res.sandWeightDry / input.sandRelativeDensity;
    const gravelVolL = res.gravelWeightDry / input.gravelRelativeDensity;
    const waterVolL = res.waterContentActual;
    const airVolL = (input.airContent || 0) * 10;
    
    // Admixtures volume
    const totalAdmixWeight = res.admixtureWeights.reduce((s: number, a: any) => s + a.weight, 0);
    const admixVolL = totalAdmixWeight / 1.15;

    const totalCalculatedVolumeL = cementVolL + sandVolL + gravelVolL + waterVolL + airVolL + admixVolL;

    // Must close around 1000L with 0.1% tolerance
    expect(totalCalculatedVolumeL).toBeCloseTo(1000.0, 1);

    // 2. Fresh density check (Standard concrete lies within 2200 to 2500 kg/m³)
    expect(res.totalFreshDensity).toBeGreaterThanOrEqual(2200);
    expect(res.totalFreshDensity).toBeLessThanOrEqual(2500);

    // 3. W/C checks (verify W/C is exactly effective water divided by net cement weight)
    const expectedWc = res.waterContentActual / res.cementWeight;
    expect(res.wcRatioAdjusted).toBeCloseTo(expectedWc, 4);

    // 4. SSD moisture & absorption accuracy verification
    const sandAbs = input.sandAbsorption || 1.5;
    const gravelAbs = input.gravelAbsorption || 0.8;

    const sandFreeMoistureDecimal = (input.moistureSand - sandAbs) / 100;
    const gravelFreeMoistureDecimal = (input.moistureGravel - gravelAbs) / 100;

    const expectedSandWet = res.sandWeightDry * (1 + input.moistureSand / 100);
    const expectedGravelWet = res.gravelWeightDry * (1 + input.moistureGravel / 100);

    expect(res.sandWeightWet).toBeCloseTo(expectedSandWet, 2);
    expect(res.gravelWeightWet).toBeCloseTo(expectedGravelWet, 2);

    const expectedFreeWaterContribution = (res.sandWeightDry * sandFreeMoistureDecimal) + (res.gravelWeightDry * gravelFreeMoistureDecimal);
    const expectedWaterWet = res.waterContentActual - expectedFreeWaterContribution;

    expect(res.waterWeightWet).toBeCloseTo(expectedWaterWet, 1);
  };

  it("should validate C25/30 referential mix design parameters", () => {
    const input = getC25Input();
    const res = calculateDreuxGorisse(input);
    expect(res).toBeDefined();
    expect(res.cementWeight).toBeGreaterThan(280); // NSC standard minimums
    auditResultStructure(res, input);
  });

  it("should validate C30/37 referential mix design parameters", () => {
    const input = getC30Input();
    const res = calculateDreuxGorisse(input);
    expect(res).toBeDefined();
    expect(res.cementWeight).toBeGreaterThan(310);
    auditResultStructure(res, input);
  });

  it("should validate C35/45 referential mix design parameters", () => {
    const input = getC35Input();
    const res = calculateDreuxGorisse(input);
    expect(res).toBeDefined();
    expect(res.cementWeight).toBeGreaterThan(320);
    auditResultStructure(res, input);
  });

  it("should verify that even dry/under-saturated aggregate conditions are correctly compensated with increased mixer water", () => {
    const base = getC25Input();
    const dryInput: MixDesignInput = {
      ...base,
      moistureSand: 0.5,   // sand is drier than absorption (0.5% < 1.5% abs) -> sand absorbs 1% water
      moistureGravel: 0.2, // gravel is drier than absorption (0.2% < 0.8% abs) -> gravel absorbs 0.6% water
    };

    const res = calculateDreuxGorisse(dryInput);
    
    // Water added at the mixer must exceed the target pure water Content to satisfy aggregate dry pores absorption
    expect(res.waterWeightWet).toBeGreaterThan(res.waterContentActual);
    auditResultStructure(res, dryInput);
  });

  it("should safeguard against unacceptable or illogical negative volumes or densities", () => {
    const base = getC25Input();
    // extreme nonsensical slump or strength input
    const extremeInput = {
      ...base,
      fck28: 150, // unrealistic for standard Dreux without heavy superplasticizers
      slump: 30   // extreme collapse slump
    };

    const res = calculateDreuxGorisse(extremeInput);
    expect(res.cementWeight).toBeLessThanOrEqual(550); // capped at maximum safe dosage
    expect(res.totalFreshDensity).toBeGreaterThan(2000); // density remains physically sound
    expect(res.sandWeightDry).toBeGreaterThan(100);
    expect(res.gravelWeightDry).toBeGreaterThan(100);
  });
});
