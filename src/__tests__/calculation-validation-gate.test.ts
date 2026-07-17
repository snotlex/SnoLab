import { describe, it, expect } from "vitest";
import { validateCalculationLogic } from "../engine/validationGate";

describe("Calculation Validation Gate Tests", () => {
  // Base inputs and results for standard valid concrete mix design
  const validInputs = {
    fck28: 30,
    slump: 8,
    dMax: 20,
    cementClassStrength: 42.5,
    moistureSand: 5.0,
    moistureGravel: 2.0,
    sandAbsorption: 1.5,
    gravelAbsorption: 0.8
  };

  const validResults = {
    cementWeight: 350,
    designWater: 180,
    waterContentActual: 180,
    waterKg: 180,
    waterToAdd: 142.9,
    sandWeightDry: 700,
    sandWeightWet: 735,
    gravelWeightDry: 1050,
    gravelWeightWet: 1071,
    totalFreeSurfaceWater: 37.1,
    effectiveWater: 180,
    admixtureWeights: [{ admixtureId: "super", name: "Superplasticizer", weight: 3 }],
    totalCost: 15300,
    costBreakdown: [
      { material: "Cement", cost: 7000 },
      { material: "Sand", cost: 3500 },
      { material: "Gravel", cost: 4000 },
      { material: "Water", cost: 300 },
      { material: "Admixture", cost: 500 }
    ]
  };

  it("1. should allow report for a valid mix", () => {
    const report = validateCalculationLogic(validInputs, validResults);
    expect(report.isValidForReport).toBe(true);
    expect(report.criticalErrors.length).toBe(0);
  });

  it("2. should block report if waterToAdd is negative", () => {
    const badResults = {
      ...validResults,
      waterToAdd: -10
    };
    const report = validateCalculationLogic(validInputs, badResults);
    expect(report.isValidForReport).toBe(false);
    expect(report.criticalErrors).toContain("negative");
  });

  it("3. should block report if W/C ratio is extremely high (> 0.75)", () => {
    const badResults = {
      ...validResults,
      effectiveWater: 270, // W/C = 270 / 350 = 0.77
      waterContentActual: 270
    };
    const report = validateCalculationLogic(validInputs, badResults);
    expect(report.isValidForReport).toBe(false);
    expect(report.criticalErrors).toContain("wc_ratio");
  });

  it("4. should raise warning but not block if W/C is high (0.60 to 0.75)", () => {
    const warningResults = {
      ...validResults,
      effectiveWater: 220, // W/C = 220 / 350 = 0.63
      waterContentActual: 220
    };
    const report = validateCalculationLogic(validInputs, warningResults);
    expect(report.isValidForReport).toBe(true);
    expect(report.warnings).toContain("wc_high");
  });

  it("5. should block report if cement weight is less than 150 kg/m3", () => {
    const lowCementResults = {
      ...validResults,
      cementWeight: 140
    };
    const report = validateCalculationLogic(validInputs, lowCementResults);
    expect(report.isValidForReport).toBe(false);
    expect(report.criticalErrors).toContain("cement_range");
  });

  it("6. should block report if total batch weight is less than 1800 kg/m3", () => {
    const lightResults = {
      ...validResults,
      cementWeight: 160,
      sandWeightDry: 400,
      sandWeightWet: 420,
      gravelWeightDry: 600,
      gravelWeightWet: 612,
      designWater: 100,
      waterContentActual: 100
    }; // Total batch weight = ~1300 kg/m3
    const report = validateCalculationLogic(validInputs, lightResults);
    expect(report.isValidForReport).toBe(false);
    expect(report.criticalErrors).toContain("weight_range");
  });

  it("7. should block report if sand moisture exceeds 20%", () => {
    const superWetInputs = {
      ...validInputs,
      moistureSand: 25.0
    };
    const report = validateCalculationLogic(superWetInputs, validResults);
    expect(report.isValidForReport).toBe(false);
    expect(report.criticalErrors).toContain("moisture_range");
  });

  it("8. should block report if sandWeightWet < sandWeightDry even though moisture is positive", () => {
    const contradictoryResults = {
      ...validResults,
      sandWeightDry: 700,
      sandWeightWet: 680 // Wet weight is less than dry weight
    };
    const report = validateCalculationLogic(validInputs, contradictoryResults);
    expect(report.isValidForReport).toBe(false);
    expect(report.criticalErrors).toContain("contradiction");
  });

  it("9. should block report if totalCost does not match costBreakdown items sum", () => {
    const mismatchResults = {
      ...validResults,
      totalCost: 20000 // Does not equal sum = 15300
    };
    const report = validateCalculationLogic(validInputs, mismatchResults);
    expect(report.isValidForReport).toBe(false);
    expect(report.criticalErrors).toContain("cost_sum");
  });

  it("10. dummy mock simulated guard for PDF generation", () => {
    const report = validateCalculationLogic(validInputs, { ...validResults, waterToAdd: -5 });
    
    // Simulate a PDF function which checks validation
    let wasGenerated = false;
    const exportPDF = () => {
      if (!report.isValidForReport) {
        return "blocked";
      }
      wasGenerated = true;
      return "success";
    };

    const res = exportPDF();
    expect(res).toBe("blocked");
    expect(wasGenerated).toBe(false);
  });

  it("11. dummy mock simulated guard for AI Advisor session", () => {
    const report = validateCalculationLogic({ ...validInputs, moistureSand: 30 }, validResults);

    // Simulate SNO AI Advisor query
    let aiAnalyzed = false;
    const sendToAiAdvisor = () => {
      if (!report.isValidForReport) {
        return "blocked";
      }
      aiAnalyzed = true;
      return "analysis_results";
    };

    const res = sendToAiAdvisor();
    expect(res).toBe("blocked");
    expect(aiAnalyzed).toBe(false);
  });

  it("12. should allow report with only warnings, bypassing critical blocks", () => {
    const warningsInputs = {
      ...validInputs
    };
    const warningOnlyResults = {
      ...validResults,
      cementWeight: 220, // will trigger cement < 250 warning, but >= 150 (allow report)
      effectiveWater: 110,
      designWater: 110,
      waterContentActual: 110,
      waterKg: 110,
      waterToAdd: 72.9
    };
    const report = validateCalculationLogic(warningsInputs, warningOnlyResults);
    expect(report.isValidForReport).toBe(true);
    expect(report.criticalErrors.length).toBe(0);
    expect(report.warnings).toContain("cement_low");
  });

  describe("Arithmetic Consistency Checks", () => {
    const baseInputs = {
      fck28: 30,
      slump: 8,
      dMax: 20,
      cementClassStrength: 42.5,
      moistureSand: 5,
      moistureGravel: 2,
      sandAbsorption: 1.5,
      gravelAbsorption: 0.8
    };

    const baseResults = {
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
      admixtureWeights: [{ admixtureId: "super", name: "Superplasticizer", weight: 3 }]
    };

    it("13. should allow perfectly matching correct mix design values", () => {
      const report = validateCalculationLogic(baseInputs, baseResults);
      expect(report.isValidForReport).toBe(true);
      expect(report.criticalErrors.length).toBe(0);
    });

    it("14. should reject if sandWeightWet is wrong even though moisture is positive", () => {
      const resultsWithWrongSandWet = {
        ...baseResults,
        sandWeightWet: 720 // Should be 735
      };
      const report = validateCalculationLogic(baseInputs, resultsWithWrongSandWet);
      expect(report.isValidForReport).toBe(false);
      expect(report.criticalErrors).toContain("sand_wet_moisture_mismatch");
    });

    it("15. should reject if gravelWeightWet is wrong even though moisture is positive", () => {
      const resultsWithWrongGravelWet = {
        ...baseResults,
        gravelWeightWet: 1050 // Should be 1071
      };
      const report = validateCalculationLogic(baseInputs, resultsWithWrongGravelWet);
      expect(report.isValidForReport).toBe(false);
      expect(report.criticalErrors).toContain("gravel_wet_moisture_mismatch");
    });

    it("16. should reject if totalFreeSurfaceWater is wrong", () => {
      const resultsWithWrongFreeWater = {
        ...baseResults,
        totalFreeSurfaceWater: 5 // Should be 37.1
      };
      const report = validateCalculationLogic(baseInputs, resultsWithWrongFreeWater);
      expect(report.isValidForReport).toBe(false);
      expect(report.criticalErrors).toContain("aggregate_free_water_mismatch");
    });

    it("17. should reject if waterToAdd is wrong but within typical boundaries (e.g. 200)", () => {
      const resultsWithWrongWaterToAdd = {
        ...baseResults,
        waterToAdd: 200 // Should be 142.9
      };
      const report = validateCalculationLogic(baseInputs, resultsWithWrongWaterToAdd);
      expect(report.isValidForReport).toBe(false);
      expect(report.criticalErrors).toContain("actual_water_added_mismatch");
    });

    it("18. should reject if totalBatchWeight is incorrect but within logical bounds (e.g. 2250)", () => {
      const resultsWithWrongTotalBatchWeight = {
        ...baseResults,
        totalBatchWeight1m3: 2250 // Should be 2301.9
      };
      const report = validateCalculationLogic(baseInputs, resultsWithWrongTotalBatchWeight);
      expect(report.isValidForReport).toBe(false);
      expect(report.criticalErrors).toContain("total_batch_weight_mismatch");
    });

    it("19. should reject if waterCementRatio doesn't match effectiveWater / cementWeight", () => {
      const resultsWithWrongRatio = {
        ...baseResults,
        waterCementRatio: 0.45 // Should be 180 / 350 = 0.514
      };
      const report = validateCalculationLogic(baseInputs, resultsWithWrongRatio);
      expect(report.isValidForReport).toBe(false);
      expect(report.criticalErrors).toContain("water_cement_ratio_mismatch");
    });
  });

  describe("Regression Safety & EN206 Report Gating Tests", () => {
    it("should block report if result has NaN in any field", () => {
      const nanResults = {
        ...validResults,
        cementWeight: NaN
      };
      const report = validateCalculationLogic(validInputs, nanResults);
      expect(report.isValidForReport).toBe(false);
      expect(report.criticalErrors).toContain("contains_nan_or_infinity");
    });

    it("should block report if result is marked with valid: false", () => {
      const invalidResults = {
        ...validResults,
        valid: false
      };
      const report = validateCalculationLogic(validInputs, invalidResults);
      expect(report.isValidForReport).toBe(false);
      expect(report.criticalErrors).toContain("result_invalid");
    });

    it("should block report if compliance fails (isCompliant: false)", () => {
      const nonCompliantResults = {
        ...validResults,
        compliance: {
          isCompliant: false,
          checks: []
        }
      };
      const report = validateCalculationLogic(validInputs, nonCompliantResults);
      expect(report.isValidForReport).toBe(false);
      expect(report.criticalErrors).toContain("en206_non_compliant");
    });

    it("should block report if any compliance checks are marked non_compliant", () => {
      const nonCompliantResults = {
        ...validResults,
        compliance: {
          isCompliant: true,
          checks: [
            {
              parameter: "W/C Max",
              requirement: "0.55",
              actual: "0.62",
              status: "non_compliant" as const
            }
          ]
        }
      };
      const report = validateCalculationLogic(validInputs, nonCompliantResults);
      expect(report.isValidForReport).toBe(false);
      expect(report.criticalErrors).toContain("en206_non_compliant");
    });
  });
});
