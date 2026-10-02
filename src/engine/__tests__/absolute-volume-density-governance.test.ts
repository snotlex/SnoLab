import { describe, expect, it } from "vitest";
import { calculateAbsoluteVolume } from "../absoluteVolume";

const validBase = {
  cementKg: 350,
  waterKg: 175,
  fineAggregateKg: 720,
  coarseAggregateKg: 1150,
  airContentPercent: 2,
  cementDensityKgM3: 3150,
  sandRelativeDensity: 2.65,
  gravelRelativeDensity: 2.68,
};

describe("absolute-volume density governance", () => {
  it("blocks missing primary density inputs instead of substituting engineering defaults", () => {
    const result = calculateAbsoluteVolume({
      ...validBase,
      cementDensityKgM3: undefined as any,
    });

    expect(result.isValid).toBe(false);
    expect(result.calculationStatus).toBe("blocked");
    expect(result.densitySources.cement).toBe("missing");
    expect(result.usedDefaults).not.toContain("cement");
    expect(result.validationErrors.join(" ")).toContain("الإسمنت");
    expect(result.components.find(component => component.name.startsWith("الإسمنت"))?.densityKgM3).toBe(0);
  });

  it("records a diagnostic default for an optional active material instead of hiding it", () => {
    const result = calculateAbsoluteVolume({
      ...validBase,
      silicaFumeKg: 35,
      silicaFumeDensityKgM3: undefined,
    });

    expect(result.isValid).toBe(false);
    expect(result.calculationStatus).toBe("blocked");
    expect(result.densitySources.silicaFume).toBe("default");
    expect(result.usedDefaults).toContain("silicaFume");
    expect(result.validationErrors.some(error => error.includes("غبار السيليكا") && error.includes("diagnostic default"))).toBe(true);
    expect(result.components.find(component => component.name.startsWith("غبار السيليكا"))?.densityKgM3).toBe(2200);
  });

  it("marks supplied densities as input-sourced", () => {
    const result = calculateAbsoluteVolume(validBase);

    expect(result.densitySources).toMatchObject({
      cement: "input",
      sand: "input",
      gravel: "input",
    });
    expect(result.usedDefaults).toEqual([]);
    expect(result.validationErrors).toEqual([]);
  });
});
