import { describe, expect, it } from "vitest";
import { EngineeringCore } from "../EngineeringCore";
import { calculateMixDesign } from "../calculateMixDesign";
import { MixDesignInput } from "../../types";

const baseInput: MixDesignInput = {
  fck28: 30,
  controlClass: "normal",
  cementType: "CEM II/A-L 42.5 N",
  cementClassStrength: 42.5,
  cementDensity: 3100,
  dMax: 20,
  slump: 8,
  aggregateType: "concasse" as any,
  aggregateQuality: "standard" as any,
  hasPumping: false,
  sandRelativeDensity: 2.65,
  sandAbsorption: 1.2,
  moistureSand: 0,
  finenessModulus: 2.6,
  gravelRelativeDensity: 2.68,
  gravelAbsorption: 0.8,
  moistureGravel: 0,
  airContent: 1.5,
  admixtures: [],
  dosageSuper: 0,
  dosageAir: 0,
  dosageRetarder: 0,
  dosageAccelerator: 0,
  dosageSilicaFume: 0,
  dosageFlyAsh: 0,
  dosageSlag: 0,
  concreteType: "NSC",
  selectedMethod: "dreux-gorisse",
  exposureClass: "XC1",
  durabilityLevel: "Standard",
  carbonationLevel: "Low",
  chloridesLevel: "None",
  sulfatesLevel: "None",
  priceCement: 0,
  priceSand: 0,
  priceGravel: 0,
  priceSuper: 0,
  priceAir: 0,
  priceRetarder: 0,
  priceAccelerator: 0,
  priceSilicaFume: 0,
  priceFlyAsh: 0,
  priceSlag: 0,
  priceLabor: 0,
  priceWater: 0,
  costBasis: "dry",
  batchVolume: 1,
  areaM2: 0,
  thicknessCm: 0,
  volumeInputMode: "volume"
};

describe("EngineeringCore unified calculation boundary", () => {
  it("uses the same governed Dreux route as calculateMixDesign", () => {
    const direct = calculateMixDesign(baseInput);
    const session = EngineeringCore.createSession(
      {
        id: "unified-engine-regression",
        name: "Regression",
        client: "test",
        plant: "test",
        createdDate: new Date().toISOString(),
        inputs: { ...baseInput }
      } as any,
      []
    );

    expect(session.mixDesignState.results?.methodId).toBe(direct.methodId);
    expect(session.mixDesignState.results?.method?.version).toBe(direct.method?.version);
    expect(session.mixDesignState.results?.calculationStatus).toBe(direct.calculationStatus);
  });

  it("does not advertise placeholder ACI/DOE/EN-206 engines from the legacy registry", () => {
    const session = EngineeringCore.createSession(
      {
        id: "registry-hygiene",
        name: "Registry",
        client: "test",
        plant: "test",
        createdDate: new Date().toISOString(),
        inputs: { ...baseInput }
      } as any,
      []
    );

    const ids = session.mixDesignState.availableMethods.map(method => method.id);
    expect(ids).not.toContain("aci-211");
    expect(ids).not.toContain("doe");
    expect(ids).not.toContain("en-206");
    expect(ids).toContain("dreux-gorisse");
  });
});
