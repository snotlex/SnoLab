import { MixDesignInput, AggregateType, AggregateQuality } from "../types";

/**
 * Creates a fully populated MixDesignInput object for testing
 * to satisfy strict TypeScript types.
 */
export function createTestInput(fields: Partial<MixDesignInput>): MixDesignInput {
  return {
    fck28: 25,
    controlClass: "normal",
    cementType: "CEM I",
    cementClassStrength: 42.5,
    dMax: 20,
    slump: 8,
    aggregateType: AggregateType.ROULE,
    aggregateQuality: AggregateQuality.STANDARD,
    hasPumping: false,
    sandRelativeDensity: 2.65,
    gravelRelativeDensity: 2.68,
    cementDensity: 3105,
    airContent: 1.0,
    moistureSand: 0,
    moistureGravel: 0,
    sandAbsorption: 1.5,
    gravelAbsorption: 0.8,
    admixtures: [],
    dosageSuper: 0,
    dosageAir: 0,
    dosageRetarder: 0,
    dosageAccelerator: 0,
    dosageSilicaFume: 0,
    dosageFlyAsh: 0,
    dosageSlag: 0,
    selectedMethod: "dreux",
    exposureClass: "X0",
    durabilityLevel: "normal",
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
    sandType: "washed_sand",
    gravelType: "crushed_gravel",
    autoDensities: false,
    bypassSuitabilityGate: true,
    ...fields
  };
}
