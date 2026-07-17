import { describe, it, expect } from "vitest";
import { calculateDreuxGorisseCore } from "../engine/dreuxGorisseCore";
import { createTestInput } from "./testHelper";
import { AggregateType, AggregateQuality } from "../types";

describe("Dreux-Gorisse Failure Mode Validation Tests", () => {
  const baseInput = createTestInput({
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
    admixtures: [],
    dosageSuper: 0,
    dosageAir: 0,
    dosageRetarder: 0,
    dosageAccelerator: 0,
    selectedMethod: "dreux"
  });

  it("should fail when target strength fck is outside the structural limits", () => {
    const input = createTestInput({
      ...baseInput,
      fck28: 200 // impossible strength out of range (5 - 120 MPa)
    });

    const result = calculateDreuxGorisseCore(input);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("fck");
  });

  it("should fail when aggregate size Dmax is physically out of boundaries", () => {
    const input = createTestInput({
      ...baseInput,
      dMax: 300 // impossible aggregate size limit (2 - 150 mm)
    });

    const result = calculateDreuxGorisseCore(input);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("Dmax");
  });

  it("should fail when target slump is physically excessive", () => {
    const input = createTestInput({
      ...baseInput,
      slump: 50 // slump out of standard range (0 - 40 cm)
    });

    const result = calculateDreuxGorisseCore(input);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("Slump");
  });

  it("should fail when aggregate volume is insufficient due to excessive air content", () => {
    const input = createTestInput({
      ...baseInput,
      airContent: 85 // 85% air leaves zero volume for aggregates!
    });

    const result = calculateDreuxGorisseCore(input);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors).toContain("الحجم المتبقي للركام غير كافٍ، الخلطة غير قابلة للإغلاق الحجمي.");
  });
});
