import { describe, expect, it } from "vitest";
import { applyMoistureCorrection } from "../moistureCorrection";

const validInput = {
  sandDryKg: 700,
  gravelDryKg: 1000,
  effectiveWaterKg: 160,
  sandMoisturePercent: 3,
  gravelMoisturePercent: 1,
  sandAbsorptionPercent: 1.5,
  gravelAbsorptionPercent: 0.8,
};

describe("moisture correction governance", () => {
  it.each([
    ["negative moisture", { sandMoisturePercent: -1 }, "Sand moisture"],
    ["negative absorption", { gravelAbsorptionPercent: -0.5 }, "Gravel absorption"],
    ["NaN moisture", { sandMoisturePercent: Number.NaN }, "Sand moisture"],
    ["Infinity water", { effectiveWaterKg: Number.POSITIVE_INFINITY }, "Effective water"],
  ])("blocks %s instead of clamping it silently", (_label, patch, errorText) => {
    const result = applyMoistureCorrection({ ...validInput, ...patch });

    expect(result.isValid).toBe(false);
    expect(result.calculationStatus).toBe("blocked");
    expect(result.validationErrors.some(error => error.includes(errorText))).toBe(true);
  });

  it("preserves a negative water requirement in engineering mode", () => {
    const result = applyMoistureCorrection({
      ...validInput,
      effectiveWaterKg: 10,
      sandMoisturePercent: 12,
      gravelMoisturePercent: 12,
    });

    expect(result.rawWaterToAddKg).toBeLessThan(0);
    expect(result.waterToAddKg).toBe(result.rawWaterToAddKg);
    expect(result.calculationStatus).toBe("blocked");
  });

  it("allows clamping only when diagnostic mode is explicitly requested", () => {
    const result = applyMoistureCorrection({
      ...validInput,
      effectiveWaterKg: 10,
      sandMoisturePercent: 12,
      gravelMoisturePercent: 12,
      mode: "diagnostic",
    });

    expect(result.rawWaterToAddKg).toBeLessThan(0);
    expect(result.waterToAddKg).toBe(0);
    expect(result.calculationStatus).toBe("blocked");
  });

  it("retains the three physical moisture states", () => {
    const dry = applyMoistureCorrection({ ...validInput, sandMoisturePercent: 0, gravelMoisturePercent: 0 });
    const ssd = applyMoistureCorrection({ ...validInput, sandMoisturePercent: 1.5, gravelMoisturePercent: 0.8 });
    const wet = applyMoistureCorrection({ ...validInput, sandMoisturePercent: 5, gravelMoisturePercent: 2 });

    expect(dry.fineAggregate.moistureState).toBe("dryOfSSD");
    expect(ssd.fineAggregate.moistureState).toBe("SSD");
    expect(wet.fineAggregate.moistureState).toBe("wetOfSSD");
  });
});
