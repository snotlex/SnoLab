import { describe, expect, it } from "vitest";
import { calculateMixDesign } from "../calculateMixDesign";
import { createTestInput } from "../../__tests__/testHelper";

describe("specialized result/UI compatibility", () => {
  it("keeps numeric legacy display fields finite for every routed concrete type", () => {
    const concreteTypes = [
      "NSC", "HSC", "HPC", "SCC", "LWC", "HWC", "PERVIOUS", "UHPC", "BFUP",
      "FRC", "GPC", "RAC", "SHC", "SHOTCRETE", "RCC", "MASS", "MARINE", "PRECAST"
    ];

    for (const concreteType of concreteTypes) {
      const result: any = calculateMixDesign(createTestInput({
        concreteType,
        dMax: concreteType === "SCC" ? 16 : 20,
        slump: concreteType === "SCC" ? 2 : 8,
        fck28: concreteType === "UHPC" || concreteType === "BFUP" ? 100 : 30
      }));

      for (const field of [
        "fcm28", "stdDev", "wcRatio", "wcRatioAdjusted", "cementWeight",
        "waterContentActual", "waterWeightWet", "sandWeightDry", "sandWeightWet",
        "gravelWeightDry", "gravelWeightWet", "sandPercent", "gravelPercent",
        "totalFreshDensity"
      ]) {
        expect(Number.isFinite(result[field]), `${concreteType}.${field}`).toBe(true);
      }
      expect(() => result.fcm28.toFixed(1)).not.toThrow();
      expect(() => result.wcRatioAdjusted.toFixed(2)).not.toThrow();
      expect(Array.isArray(result.admixtureWeights)).toBe(true);
    }
  });

  it("renders blocked or unsupported results without undefined numeric fields", () => {
    const result: any = calculateMixDesign(createTestInput({ concreteType: "Experimental-Concrete-X" }));
    expect(result.calculationStatus).toBe("blocked");
    expect(() => result.fcm28.toFixed(1)).not.toThrow();
    expect(() => result.wcRatioAdjusted.toFixed(2)).not.toThrow();
    expect(Array.isArray(result.admixtureWeights)).toBe(true);
  });
});
