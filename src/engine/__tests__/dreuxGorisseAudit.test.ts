import { describe, it, expect } from "vitest";
import { calculateDreuxGorisse } from "../../utils";
import { MixDesignInput } from "../../types";

describe("Dreux-Gorisse Engineering Rigor & Formulation Audit Checks", () => {
  const getC25Input = (): MixDesignInput => ({
    bypassSuitabilityGate: true,
    fck28: 25,
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
    selectedAdmixtureWaterReduction: 18,
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

  const getC30Input = (): MixDesignInput => ({ ...getC25Input(), fck28: 30, dosageSuper: 1.2, selectedAdmixtureWaterReduction: 21 });
  const getC35Input = (): MixDesignInput => ({ ...getC25Input(), fck28: 35, cementClassStrength: 52.5, dosageSuper: 1.5, selectedAdmixtureWaterReduction: 25 });

  const auditResultStructure = (res: any, input: MixDesignInput) => {
    const cementVolL = res.cementWeight / (input.cementDensity / 1000);
    const sandVolL = res.sandWeightDry / input.sandRelativeDensity;
    const gravelVolL = res.gravelWeightDry / input.gravelRelativeDensity;
    const waterVolL = res.waterContentActual;
    const airVolL = (input.airContent || 0) * 10;
    const totalAdmixWeight = res.admixtureWeights.reduce((s: number, a: any) => s + a.weight, 0);
    const admixVolL = totalAdmixWeight / 1.15;
    const totalCalculatedVolumeL = cementVolL + sandVolL + gravelVolL + waterVolL + airVolL + admixVolL;

    expect(totalCalculatedVolumeL).toBeCloseTo(1000.0, 1);
    expect(res.totalFreshDensity).toBeGreaterThanOrEqual(2000);
    expect(res.totalFreshDensity).toBeLessThanOrEqual(2600);
    const expectedWc = res.waterContentActual / res.cementWeight;
    expect(res.wcRatioAdjusted).toBeCloseTo(expectedWc, 4);

    const sandAbs = input.sandAbsorption || 1.5;
    const gravelAbs = input.gravelAbsorption || 0.8;
    const expectedSandWet = res.sandWeightDry * (1 + input.moistureSand / 100);
    const expectedGravelWet = res.gravelWeightDry * (1 + input.moistureGravel / 100);
    expect(res.sandWeightWet).toBeCloseTo(expectedSandWet, 2);
    expect(res.gravelWeightWet).toBeCloseTo(expectedGravelWet, 2);

    const expectedFreeWaterContribution =
      (res.sandWeightDry * Math.max(0, input.moistureSand - sandAbs) / 100) +
      (res.gravelWeightDry * Math.max(0, input.moistureGravel - gravelAbs) / 100);
    const expectedWaterAdded = Math.max(0, res.waterContentActual - expectedFreeWaterContribution +
      (input.moistureSand < sandAbs ? res.sandWeightDry * (sandAbs - input.moistureSand) / 100 : 0) +
      (input.moistureGravel < gravelAbs ? res.gravelWeightDry * (gravelAbs - input.moistureGravel) / 100 : 0));
    expect(res.waterWeightWet).toBeCloseTo(expectedWaterAdded, 1);
  };

  it("validates C25/30 referential mix design parameters", () => {
    const input = getC25Input();
    const res = calculateDreuxGorisse(input);
    expect(res).toBeDefined();
    expect(res.cementWeight).toBeGreaterThan(280);
    auditResultStructure(res, input);
  });

  it("validates C30/37 referential mix design parameters", () => {
    const input = getC30Input();
    const res = calculateDreuxGorisse(input);
    expect(res).toBeDefined();
    expect(res.cementWeight).toBeGreaterThan(300);
    auditResultStructure(res, input);
  });

  it("validates C35/45 referential mix design parameters", () => {
    const input = getC35Input();
    const res = calculateDreuxGorisse(input);
    expect(res).toBeDefined();
    expect(res.cementWeight).toBeGreaterThan(300);
    auditResultStructure(res, input);
  });

  it("compensates dry aggregate conditions with increased mixer water", () => {
    const dryInput: MixDesignInput = {
      ...getC25Input(),
      moistureSand: 0.5,
      moistureGravel: 0.2,
    };
    const res = calculateDreuxGorisse(dryInput);
    expect(res.waterWeightWet).toBeGreaterThan(res.waterContentActual);
    auditResultStructure(res, dryInput);
  });

  it("does not silently cap impossible high-strength cement demand", () => {
    const extremeInput = {
      ...getC25Input(),
      fck28: 150,
      slump: 30,
      dosageSuper: 2.0,
      selectedAdmixtureWaterReduction: 35
    };
    const res = calculateDreuxGorisse(extremeInput);
    expect(res).toBeDefined();
    expect(res.isValid).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });
});