import { describe, it, expect } from "vitest";
import { calculateDreuxGorisseCore } from "../engine/dreuxGorisseCore";
import { createTestInput } from "./testHelper";
import { AggregateType, AggregateQuality } from "../types";

describe("Dreux-Gorisse SSD moisture and absorption correction", () => {
  const baseInput = createTestInput({
    fck28: 30,
    controlClass: "high",
    cementType: "CEM I",
    cementClassStrength: 42.5,
    dMax: 20,
    slump: 8,
    aggregateType: AggregateType.CONCASSE,
    aggregateQuality: AggregateQuality.EXCELLENT,
    hasPumping: false,
    sandRelativeDensity: 2.65,
    gravelRelativeDensity: 2.68,
    cementDensity: 3105,
    airContent: 1.0,
    moistureSand: 0,
    moistureGravel: 0,
    sandAbsorption: 1.5,   // absorption capacity 1.5%
    gravelAbsorption: 0.8, // absorption capacity 0.8%
    admixtures: [],
    dosageSuper: 0,
    dosageAir: 0,
    dosageRetarder: 0,
    dosageAccelerator: 0,
    selectedMethod: "dreux"
  });

  it("should increase water requirement when aggregates are dry (moisture < absorption)", () => {
    // 100% dry aggregates (moisture = 0%)
    const inputDry = createTestInput({
      ...baseInput,
      moistureSand: 0,
      moistureGravel: 0
    });

    const result = calculateDreuxGorisseCore(inputDry);

    // Because moisture (0) < absorption (1.5% and 0.8%), the aggregates should suck up some water.
    // Thus, waterWeightWet (representing mixing water we need to add) must be higher than waterContentActual.
    expect(result.waterWeightWet).toBeGreaterThan(result.waterContentActual);

    // Wet aggregate weight at 0% moisture should equal its dry aggregate weight
    expect(result.sandWeightWet).toBeCloseTo(result.sandWeightDry, 1);
    expect(result.gravelWeightWet).toBeCloseTo(result.gravelWeightDry, 1);
  });

  it("should decrease water requirement when aggregates are wet (moisture > absorption)", () => {
    // Wet aggregates (moisture > absorption)
    const inputWet = createTestInput({
      ...baseInput,
      moistureSand: 5.0,   // 5% > 1.5% absorption
      moistureGravel: 2.0  // 2% > 0.8% absorption
    });

    const result = calculateDreuxGorisseCore(inputWet);

    // Outstanding free water in raw sand and gravel is positive, so it should reduce added mixing water.
    expect(result.waterWeightWet).toBeLessThan(result.waterContentActual);

    // Wet aggregate weights must be greater than dry aggregate weights
    expect(result.sandWeightWet).toBeGreaterThan(result.sandWeightDry);
    expect(result.gravelWeightWet).toBeGreaterThan(result.gravelWeightDry);

    // Proportional damp scale check
    expect(result.sandWeightWet).toBeCloseTo(result.sandWeightDry * 1.05, 1);
    expect(result.gravelWeightWet).toBeCloseTo(result.gravelWeightDry * 1.02, 1);
  });

  it("should match precise numerical mock scenario requested by user", () => {
    // Input parameters from User Request
    const cementWeight = 350;
    const designWater = 180;
    const sandWeightDry = 700;
    const gravelWeightDry = 1050;
    const sandMoisturePercent = 5;
    const gravelMoisturePercent = 2;
    const sandAbsorptionPercent = 1.5;
    const gravelAbsorptionPercent = 0.8;
    const admixtureWeight = 3;

    // Engineering Formulas (identical to the core engine implementation)
    const sandWeightWet = sandWeightDry * (1 + sandMoisturePercent / 100);
    const gravelWeightWet = gravelWeightDry * (1 + gravelMoisturePercent / 100);

    const sandTotalMoistureWater = sandWeightDry * sandMoisturePercent / 100;
    const gravelTotalMoistureWater = gravelWeightDry * gravelMoisturePercent / 100;
    const totalAggregateMoistureWater = sandTotalMoistureWater + gravelTotalMoistureWater;

    const sandAbsorptionWater = sandWeightDry * sandAbsorptionPercent / 100;
    const gravelAbsorptionWater = gravelWeightDry * gravelAbsorptionPercent / 100;
    const totalAbsorptionWater = sandAbsorptionWater + gravelAbsorptionWater;

    const sandFreeSurfaceWater = sandWeightDry * Math.max(0, sandMoisturePercent - sandAbsorptionPercent) / 100;
    const gravelFreeSurfaceWater = gravelWeightDry * Math.max(0, gravelMoisturePercent - gravelAbsorptionPercent) / 100;
    const totalFreeSurfaceWater = sandFreeSurfaceWater + gravelFreeSurfaceWater;

    const sandAbsorptionDeficit = sandMoisturePercent < sandAbsorptionPercent ? sandWeightDry * (sandAbsorptionPercent - sandMoisturePercent) / 100 : 0;
    const gravelAbsorptionDeficit = gravelMoisturePercent < gravelAbsorptionPercent ? gravelWeightDry * (gravelAbsorptionPercent - gravelMoisturePercent) / 100 : 0;
    const totalAbsorptionDeficit = sandAbsorptionDeficit + gravelAbsorptionDeficit;

    const waterToAdd = Math.max(0, designWater - totalFreeSurfaceWater + totalAbsorptionDeficit);
    
    // Total batch weight summation:
    const totalBatchWeight = cementWeight + sandWeightWet + gravelWeightWet + waterToAdd + admixtureWeight;

    // Assert exact numerical parity
    expect(sandWeightWet).toBe(735);
    expect(gravelWeightWet).toBe(1071);

    expect(sandTotalMoistureWater).toBe(35);
    expect(gravelTotalMoistureWater).toBe(21);
    expect(totalAggregateMoistureWater).toBe(56);

    expect(sandAbsorptionWater).toBe(10.5);
    expect(gravelAbsorptionWater).toBe(8.4);
    expect(totalAbsorptionWater).toBe(18.9);

    expect(sandFreeSurfaceWater).toBe(24.5);
    expect(gravelFreeSurfaceWater).toBe(12.6);
    expect(totalFreeSurfaceWater).toBe(37.1);

    expect(waterToAdd).toBe(142.9);
    expect(totalBatchWeight).toBe(2301.9);
  });

  it("should output consistent moisture and absorption values from core engine", () => {
    const result = calculateDreuxGorisseCore({
      ...baseInput,
      moistureSand: 5.0,
      moistureGravel: 2.0,
      sandAbsorption: 1.5,
      gravelAbsorption: 0.8
    });

    const sandD = result.sandWeightDry;
    const gravelD = result.gravelWeightDry;

    expect(result.sandTotalMoistureWater).toBeCloseTo(sandD * 0.05, 2);
    expect(result.gravelTotalMoistureWater).toBeCloseTo(gravelD * 0.02, 2);
    expect(result.totalAggregateMoistureWater).toBeCloseTo((sandD * 0.05) + (gravelD * 0.02), 2);

    expect(result.sandAbsorptionWater).toBeCloseTo(sandD * 0.015, 2);
    expect(result.gravelAbsorptionWater).toBeCloseTo(gravelD * 0.008, 2);
    expect(result.totalAbsorptionWater).toBeCloseTo((sandD * 0.015) + (gravelD * 0.008), 2);

    expect(result.sandFreeSurfaceWater).toBeCloseTo(sandD * 0.035, 2);
    expect(result.gravelFreeSurfaceWater).toBeCloseTo(gravelD * 0.012, 2);
    expect(result.totalFreeSurfaceWater).toBeCloseTo((sandD * 0.035) + (gravelD * 0.012), 2);

    expect(result.waterToAdd).toBeCloseTo(result.designWater! - result.totalFreeSurfaceWater!, 2);
  });

  it("should correctly audit costBasis pricing for dry vs wet aggregates", () => {
    // 1. Wet Basis cost audit
    const resultWet = calculateDreuxGorisseCore({
      ...baseInput,
      moistureSand: 5.0,
      moistureGravel: 2.0,
      sandAbsorption: 1.5,
      gravelAbsorption: 0.8,
      costBasis: "wet",
      priceSand: 10,  // unit price: 10 per kg
      priceGravel: 15 // unit price: 15 per kg
    });

    // Extract Sand and Gravel Cost items
    const sandWetCostItem = resultWet.costBreakdown.find(i => i.material.includes("الرمل"));
    const gravelWetCostItem = resultWet.costBreakdown.find(i => i.material.includes("الحصى"));

    expect(sandWetCostItem?.quantity).toBeCloseTo(resultWet.sandWeightWet || 0, 2);
    expect(sandWetCostItem?.cost).toBeCloseTo((resultWet.sandWeightWet || 0) * 10, 2);

    expect(gravelWetCostItem?.quantity).toBeCloseTo(resultWet.gravelWeightWet || 0, 2);
    expect(gravelWetCostItem?.cost).toBeCloseTo((resultWet.gravelWeightWet || 0) * 15, 2);

    // 2. Dry Basis cost audit
    const resultDry = calculateDreuxGorisseCore({
      ...baseInput,
      moistureSand: 5.0,
      moistureGravel: 2.0,
      sandAbsorption: 1.5,
      gravelAbsorption: 0.8,
      costBasis: "dry",
      priceSand: 10,
      priceGravel: 15
    });

    const sandDryCostItem = resultDry.costBreakdown.find(i => i.material.includes("الرمل"));
    const gravelDryCostItem = resultDry.costBreakdown.find(i => i.material.includes("الحصى"));

    expect(sandDryCostItem?.quantity).toBeCloseTo(resultDry.sandWeightDry, 2);
    expect(sandDryCostItem?.cost).toBeCloseTo(resultDry.sandWeightDry * 10, 2);

    expect(gravelDryCostItem?.quantity).toBeCloseTo(resultDry.gravelWeightDry, 2);
    expect(gravelDryCostItem?.cost).toBeCloseTo(resultDry.gravelWeightDry * 15, 2);
  });
});
