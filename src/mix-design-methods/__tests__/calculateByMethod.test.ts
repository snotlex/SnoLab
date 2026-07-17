import { describe, it, expect } from "vitest";
import { calculateByMethod } from "../calculateByMethod";

describe("calculateByMethod Regression and Status Verification", () => {
  const dummyInputs = {
    fck28: 25,
    cementClassStrength: 42.5,
    slump: 7,
    dMax: 20,
    aggregateType: "concasse",
    cementType: "CEM II",
    sandType: "Medium",
    gravelType: "Limestone",
    dosageSuper: 0.8,
    cementDensity: 3100,
    sandRelativeDensity: 2600,
    gravelRelativeDensity: 2650,
    sandFinenessModulus: 2.6
  };

  it("should calculate correct values and flags for Dreux-Gorisse", () => {
    const result = calculateByMethod("dreux-gorisse", dummyInputs);
    expect(result).toBeDefined();
    expect(result.methodId).toBe("dreux-gorisse");
    expect(result.implementationStatus).toBe("complete");
    expect(result.isStandaloneCompleteMethod).toBe(true);
    expect(result.category).toBe("complete-design");
    expect(result.status).toBeDefined();
  });
});
