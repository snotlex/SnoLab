import { describe, expect, it } from "vitest";
import { validateSccInputs } from "./sccMixDesign";
import { getSpecializedInputDefinition } from "../../core/specializedInputDefinitions";

function sccInput(extra: Record<string, unknown> = {}) {
  return {
    concreteType: "SCC",
    fck28: 35,
    dMax: 16,
    sccTargetSlumpFlowMm: 650,
    sccPowderKgM3: 500,
    sccWaterPowderRatioByVolume: 0.90,
    sccWaterKgM3: (500 / 3150 * 1000) * 0.90,
    cementDensity: 3150,
    airContent: 1,
    materialsDatabase: [],
    ...extra
  } as any;
}

describe("SCC water-to-powder volume ratio units", () => {
  it("accepts explicit water consistent with the declared volume ratio", () => {
    const result = validateSccInputs(sccInput());
    expect(result.errors.map((error) => error.code)).not.toContain("water_powder_conflict");
  });

  it("rejects a water value that matches the ratio only by mass, not volume", () => {
    const result = validateSccInputs(sccInput({ sccWaterKgM3: 0.90 * 500 }));
    expect(result.errors.map((error) => error.code)).toContain("water_powder_conflict");
  });

  it("labels coarse aggregate volume as a fraction rather than a percent", () => {
    const definition = getSpecializedInputDefinition("sccCoarseAggregateVolumeFraction");
    expect(definition.unit?.en).toBe("volume fraction (0–1)");
    expect(definition.min).toBe(0.2);
    expect(definition.max).toBe(0.5);
  });
});
