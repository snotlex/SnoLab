import { describe, it, expect } from "vitest";
import { formatEngineeringValue } from "../utils/unitFormatter";
import { validateCalculationLogic } from "../engine/validationGate";

describe("Unit Consistency SI Metric-Only Tests", () => {
  // Scenario 1: Metric units are correct
  it("1. should format SI metric values correctly with expected Arabic & standard SI symbols", () => {
    expect(formatEngineeringValue(350, "mass")).toBe("350 kg/m³");
    expect(formatEngineeringValue(350, "mass", { batchVolumeMultiplier: 2 })).toBe("700 kg");
    expect(formatEngineeringValue(180, "waterVolume")).toBe("180 L/m³");
    expect(formatEngineeringValue(180, "waterVolume", { batchVolumeMultiplier: 2.5 })).toBe("450 L");
    expect(formatEngineeringValue(1.5, "concreteVolume")).toBe("1.5 m³");
    expect(formatEngineeringValue(35, "strength")).toBe("35 MPa");
    expect(formatEngineeringValue(20, "aggregateSize")).toBe("20 mm");
  });

  // Scenario 2: Zero trace of Imperial keywords produced from formatter
  it("2. formatEngineeringValue must never produce lb, gal, psi, inch, yd³ or ft³", () => {
    const values = [0, 1, 15.5, 350, 2300];
    const types: any[] = ["mass", "absoluteMass", "massPerConcreteVolume", "waterVolume", "waterPerConcreteVolume", "concreteVolume", "strength", "aggregateSize", "density"];
    
    for (const val of values) {
      for (const t of types) {
        const formatted = formatEngineeringValue(val, t);
        const lower = formatted.toLowerCase();
        
        expect(lower).not.toContain("lb");
        expect(lower).not.toContain("gal");
        expect(lower).not.toContain("psi");
        expect(lower).not.toContain("inch");
        expect(lower).not.toContain("yd");
        expect(lower).not.toContain("ft");
      }
    }
  });

  // Scenario 3: Dreux-Gorisse engine validation gate acts only on SI Metric values
  it("3. validationGate should validate pure SI Metric inputs and results flawlessly", () => {
    const inputsSI = {
      fck28: 30,
      slump: 8,
      dMax: 20,
      cementClassStrength: 42.5,
      moistureSand: 5,
      moistureGravel: 2,
      sandAbsorption: 1.5,
      gravelAbsorption: 0.8
    };

    const resultsSI = {
      cementWeight: 350,
      designWater: 180,
      waterContentActual: 180,
      waterKg: 180,
      sandWeightDry: 700,
      gravelWeightDry: 1050,
      sandWeightWet: 735,
      gravelWeightWet: 1071,
      totalFreeSurfaceWater: 37.1,
      totalAbsorptionDeficit: 0,
      waterToAdd: 142.9,
      totalBatchWeight1m3: 2301.9,
      effectiveWater: 180,
      waterCementRatio: 180 / 350,
      admixtureWeights: []
    };

    const report = validateCalculationLogic(inputsSI, resultsSI);
    expect(report.isValidForReport).toBe(true);
    expect(report.warnings).toBeDefined();
    expect(report.criticalErrors).toHaveLength(0);
  });

  // Scenario 4: ratio remains dimensionless
  it("4. waterCementRatio should be formatted unitless without units ALWAYS", () => {
    const ratioVal = 0.514;
    const formatted = formatEngineeringValue(ratioVal, "ratio");

    expect(formatted).toBe("0.51");
    expect(formatted).not.toContain("kg");
    expect(formatted).not.toContain("L");
  });

  // Scenario 5: cost displays only currency without mass units
  it("5. costBreakdown / cost displays should only show numeric/currency representation", () => {
    const rawCost = 2500;
    const formattedCost = formatEngineeringValue(rawCost, "cost");

    expect(formattedCost).toBe("2,500");
    expect(formattedCost).not.toContain("kg");
    expect(formattedCost).not.toContain("L");
  });
});
