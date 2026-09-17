import { describe, it, expect } from "vitest";
import {
  calculateSpecificGravityAndAbsorption,
  calculateFiberProperties,
  calculateSieveAnalysis
} from "../utils/materialTestingCalculators";
import { evaluateMaterialCompatibility } from "../services/materialCompatibilityEngine";
import { determineMaterialRequirements } from "../services/materialRequirementEngine";
import { applyRecommendedMaterialToInputs } from "../services/materialRecommendationEngine";
import { validateLabResults } from "../utils/labValidationEngine";
import { EngineeringMaterial, MixDesignInput, MixDesignResult } from "../types";

describe("Phase 2 Final Surgical Closure: Zero Unauthorized Fallbacks Regression Suite", () => {
  describe("Material Testing Calculators", () => {
    it("calculateSpecificGravityAndAbsorption: returns undefined for missing or zero volume without fabricating zeros or defaults", () => {
      // Missing inputs (ovenDry = 0)
      const resMissing = calculateSpecificGravityAndAbsorption(0, 100, 100);
      expect(resMissing.status).toBe("FAIL");
      expect(resMissing.dataState).toBe("missing");
      expect(resMissing.ovenDryRelativeDensity).toBeUndefined();
      expect(resMissing.ssdRelativeDensity).toBeUndefined();
      expect(resMissing.waterAbsorptionPercent).toBeUndefined();
      expect(resMissing.realDensityKgM3).toBeUndefined();
      expect(resMissing.ssdDensityKgM3).toBeUndefined();

      // Physically invalid inputs (apparent weight in water >= ssd weight)
      const resInvalid = calculateSpecificGravityAndAbsorption(100, 100, 110);
      expect(resInvalid.status).toBe("FAIL");
      expect(resInvalid.dataState).toBe("invalid");
      expect(resInvalid.ovenDryRelativeDensity).toBeUndefined();
      expect(resInvalid.waterAbsorptionPercent).toBeUndefined();

      // Valid non-porous aggregate: preserves valid measured zero for water absorption
      const resValidZero = calculateSpecificGravityAndAbsorption(1000, 1000, 600);
      expect(resValidZero.status).toBe("PASS");
      expect(resValidZero.dataState).toBe("valid");
      expect(resValidZero.waterAbsorptionPercent).toBe(0); // Valid measured zero
      expect(resValidZero.realDensityKgM3).toBe(2500);
    });

    it("calculateFiberProperties: does not fabricate aspect ratio 50 when diameter is zero or negative", () => {
      const res = calculateFiberProperties("steel", 50, 0, 1000, 200, 7.85, 25);
      const aspectDetail = res.compliance.find(c => c.parameter.includes("Aspect Ratio"));
      expect(aspectDetail?.measured).toBe("0");
    });

    it("calculateSieveAnalysis: does not fabricate dMax or fines content when data is absent or incomplete", () => {
      // Missing sieve rows
      const emptyRes = calculateSieveAnalysis(0, [], "sand");
      expect(emptyRes.status).toBe("FAIL");
      expect(emptyRes.dataState).toBe("missing");
      expect(emptyRes.dMax).toBeUndefined();
      expect(emptyRes.finesContent).toBeUndefined();
      expect(emptyRes.finenessModulus).toBeUndefined();

      // Sieve rows without fines sieve (<0.08) and without sieve with >=95% passing
      const sieveData = [
        { sieve: 10, retained: 20 },
        { sieve: 8, retained: 30 }
      ];
      const res = calculateSieveAnalysis(50, sieveData, "sand");
      expect(res.dataState).toBe("valid");
      expect(res.finesContent).toBeUndefined(); // fines sieve was not tested
      expect(res.dMax).toBeUndefined(); // no sieve has >=95% passing
      expect(res.finenessModulus).toBeUndefined(); // sand sieve coverage insufficient
      
      const finesCompliance = res.compliance.find(c => c.parameter.includes("المواد الناعمة"));
      expect(finesCompliance?.measured).toContain("غير متوفر");
      expect(finesCompliance?.status).toBe("WARNING");

      const dMaxCompliance = res.compliance.find(c => c.parameter.includes("Dmax"));
      expect(dMaxCompliance?.measured).toContain("غير محدد");

      const fmCompliance = res.compliance.find(c => c.parameter.includes("FM"));
      expect(fmCompliance?.measured).toContain("غير متوفر");
    });

    it("calculateSieveAnalysis: correctly computes valid results and preserves measured zeros", () => {
      // Complete sand sieve test with valid data and 0% fines
      const completeSand = [
        { sieve: 4.0, retained: 5 },    // 95% passing -> Dmax = 4.0
        { sieve: 2.0, retained: 10 },
        { sieve: 1.0, retained: 15 },
        { sieve: 0.5, retained: 20 },
        { sieve: 0.25, retained: 30 },
        { sieve: 0.125, retained: 20 },
        { sieve: 0.063, retained: 0 }   // 0% passing 0.063 (100% retained before pan)
      ];
      const res = calculateSieveAnalysis(100, completeSand, "sand");
      expect(res.status).toBe("PASS");
      expect(res.dataState).toBe("valid");
      expect(res.dMax).toBe(4.0);
      expect(res.finesContent).toBe(0); // Valid measured zero
      expect(typeof res.finenessModulus).toBe("number");
      expect(res.finenessModulus).toBeGreaterThan(0);
    });
  });

  describe("Material Compatibility and Requirement Engines", () => {
    it("materialCompatibilityEngine: does not default undefined exposure class to X0", () => {
      const material: EngineeringMaterial = {
        id: "cem-1",
        name: "CEM I 42.5 N",
        category: "cement",
        source: "user",
        status: "نشط",
        ApprovalStatus: "Approved",
        density: 3150
      } as any;

      const req = {
        role: "cement" as any,
        requirementType: "mandatory" as any,
        reasons: { ar: "", en: "" }
      };

      const contextWithoutExposure = {
        targetStrength: 30,
        concreteType: "NSC" as any,
        method: "dreux-gorisse" as any,
        mixDesignMethod: "dreux-gorisse" as any,
        exposureClass: undefined
      };

      const evalResult = evaluateMaterialCompatibility(material, "cement", req as any, contextWithoutExposure);
      const durFactor = evalResult.factors.find(f => f.category === "durability_exposure");
      expect(durFactor?.detailsEn).toBe("Exposure class not specified.");
    });

    it("materialRequirementEngine: does not default undefined exposure class to X0", () => {
      const inputs: any = {
        concreteType: "NSC",
        targetStrength: 30,
        method: "dreux-gorisse",
        exposureClass: undefined
      };

      const plan = determineMaterialRequirements(inputs);
      expect(plan).toBeDefined();
      expect(plan.roles).toBeDefined();
      const cementRole = plan.roles.find(r => r.role === "cement");
      expect(cementRole).toBeDefined();
    });
  });

  describe("Material Recommendation Engine", () => {
    it("applyRecommendedMaterialToInputs: preserves undefined when material lacks absorption or moisture", () => {
      const prevInputs: MixDesignInput = {
        concreteType: "NSC",
        fck28: 25,
        sandAbsorption: undefined,
        moistureSand: undefined
      } as any;

      const sandMat: EngineeringMaterial = {
        id: "sand-no-abs",
        name: "رمل بدون خواص ثانوية",
        category: "sand",
        density: 2600,
        source: "user",
        status: "نشط",
        ApprovalStatus: "Approved"
      } as any;

      const updated = applyRecommendedMaterialToInputs(prevInputs, "sand", sandMat);
      expect(updated.sandAbsorption).toBeUndefined();
      expect(updated.moistureSand).toBeUndefined();
    });
  });

  describe("Lab Validation Engine", () => {
    it("validateLabResults: handles missing theoretical density and air content without 2400 or 1.5 defaults", () => {
      const input: Partial<MixDesignInput> = {
        fck28: 30,
        airContent: undefined,
        slump: 10
      };

      const result: Partial<MixDesignResult> = {
        totalFreshDensity: undefined,
        fcm28: 38.5
      };

      const labInputs = {
        freshDensity: 2350,
        airContent: 2.0,
        specimens1d: [],
        specimens3d: [],
        specimens7d: [],
        specimens28d: []
      };

      const evalMetrics = validateLabResults(
        input as MixDesignInput,
        result as MixDesignResult,
        labInputs as any,
        "en"
      );

      // Verify no evaluation was done using fabricated 2400 density
      const densityMetric = evalMetrics.metrics.find(m => m.key === "freshDensity");
      expect(densityMetric).toBeUndefined();

      // Verify no evaluation was done using fabricated 1.5 air content
      const airMetric = evalMetrics.metrics.find(m => m.key === "airContent");
      expect(airMetric).toBeUndefined();
    });
  });
});
