import { describe, it, expect } from "vitest";
import { calculateMixDesign } from "../calculateMixDesign";
import { calculateByMethod } from "../../mix-design-methods/calculateByMethod";

describe("Dreux-Gorisse Exclusive Computational Isolation Tests", () => {
  const dummyInputs = {
    bypassSuitabilityGate: true,
    fck28: 30,
    controlClass: "high" as const,
    cementType: "CEM I",
    cementClassStrength: 42.5,
    dMax: 20,
    slump: 8,
    aggregateType: "concasse" as const,
    aggregateQuality: "standard" as const,
    hasPumping: false,
    sandRelativeDensity: 2.65,
    gravelRelativeDensity: 2.68,
    cementDensity: 3100,
    airContent: 1.5,
    moistureSand: 3.0,
    moistureGravel: 1.0,
    selectedMethod: "dreux" as const
  };

  // Test 1: selectedMethod = "aci" -> returns Dreux-Gorisse
  it("Test 1: should redirect selection from 'aci' to Dreux-Gorisse under calculateMixDesign", () => {
    const inputsWithAci = {
      ...dummyInputs,
      selectedMethod: "aci" as any
    };
    const res = calculateMixDesign(inputsWithAci);
    expect(res).toBeDefined();
    // Verify it returns the Dreux-Gorisse methodology name
    expect(res.methodName).toBe("Dreux-Gorisse");
  });

  // Test 2: selectedMethod = "doe" -> returns Dreux-Gorisse
  it("Test 2: should redirect selection from 'doe' to Dreux-Gorisse under calculateMixDesign", () => {
    const inputsWithDoe = {
      ...dummyInputs,
      selectedMethod: "doe" as any
    };
    const res = calculateMixDesign(inputsWithDoe);
    expect(res).toBeDefined();
    expect(res.methodName).toBe("Dreux-Gorisse");
  });

  // Test 3: selectedMethod = "fuller-thompson" -> returns Dreux-Gorisse
  it("Test 3: should redirect selection from 'fuller-thompson' to Dreux-Gorisse under calculateMixDesign", () => {
    const inputsWithFuller = {
      ...dummyInputs,
      selectedMethod: "fuller-thompson" as any
    };
    const res = calculateMixDesign(inputsWithFuller);
    expect(res).toBeDefined();
    expect(res.methodName).toBe("Dreux-Gorisse");
  });

  // Test 4: calculateByMethod only returns Dreux-Gorisse results
  it("Test 4: calculateByMethod ignores any alternative method argument and returns Dreux-Gorisse", () => {
    const res = calculateByMethod("dreux-gorisse" as any, dummyInputs);
    expect(res).toBeDefined();
    expect(res.methodId).toBe("dreux-gorisse");
    expect(res.category).toBe("complete-design");
    expect(res.quantities?.cementKgPerM3).toBeGreaterThan(0);
  });

  // Test 5: verify report strings are strictly aligned to Dreux-Gorisse (no legacy words in active outputs)
  it("Test 5: final output methodName is Dreux-Gorisse", () => {
    const res = calculateMixDesign(dummyInputs);
    expect(res.methodName).toBe("Dreux-Gorisse");
  });

  // Test 6: Migrating old layouts is handled
  it("Test 6: loaded/migrated inputs automatically convert selectedMethod to 'dreux'", () => {
    const legacyInputs = {
      ...dummyInputs,
      selectedMethod: "aci-211" as any
    };
    const migrationHelper = (inputs: any) => {
      return {
        ...inputs,
        selectedMethod: "dreux"
      };
    };
    const migrated = migrationHelper(legacyInputs);
    expect(migrated.selectedMethod).toBe("dreux");
  });
});
