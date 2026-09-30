import { describe, expect, it } from "vitest";
import { getSpecializedInputDefinition, validateSpecializedInputValue, specializedInputErrorMessage } from "../specializedInputDefinitions";

describe("specialized concrete input definitions", () => {
  it("provides localized labels and engineering limits", () => {
    const definition = getSpecializedInputDefinition("sccTargetSlumpFlowMm");
    expect(definition.label.ar).toContain("انتشار");
    expect(definition.label.fr).toContain("Étalement");
    expect(definition.label.en).toContain("slump flow");
    expect(definition.min).toBe(500);
    expect(definition.max).toBe(850);
  });

  it("rejects values outside the supported envelope", () => {
    expect(validateSpecializedInputValue("hscWaterBinderRatio", 0.1)).toBe("below_min");
    expect(validateSpecializedInputValue("hscWaterBinderRatio", 0.4)).toBe("above_max");
    expect(validateSpecializedInputValue("hscWaterBinderRatio", 0.3)).toBeNull();
  });

  it("localizes validation feedback", () => {
    expect(specializedInputErrorMessage("sccTargetSlumpFlowMm", "below_min", "ar")).toContain("500");
    expect(specializedInputErrorMessage("sccTargetSlumpFlowMm", "above_max", "fr")).toContain("850");
  });
});
