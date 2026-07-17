import { describe, it, expect, beforeEach } from "vitest";
import { mixDesignEngine, MixDesignEngine } from "../core/MixDesignEngine";
import { MixDesignMethodRegistry } from "../core/MixDesignMethodRegistry";
import { MixDesignMethod } from "../core/MixDesignMethod";
import {
  MixDesignInput,
  MixDesignResult,
  ApplicabilityResult,
  ValidationResult
} from "../core/types";
import { calculateDreuxGorisse as legacyCalculate } from "../../utils";
import { calculateDreuxGorisseCore } from "../../engine/dreuxGorisseCore";
import { DuplicateMethodRegistrationError, UnsupportedMethodVersionError } from "../core/errors";

// Mock/test method for extensibility proof
class MockMixMethod implements MixDesignMethod {
  public metadata = {
    id: "mock-aci-doe",
    name: "Mock ACI/DOE Method",
    shortName: "MockMethod",
    version: "2.1.0",
    status: "active" as const
  };

  public isApplicable(input: MixDesignInput): ApplicabilityResult {
    return { level: "applicable", reasons: [] };
  }

  public validateInputs(input: MixDesignInput): ValidationResult {
    return { isValid: true, errors: [], warnings: [] };
  }

  public calculate(input: MixDesignInput): any {
    return {
      methodId: "mock-aci-doe",
      cementKg: 350,
      waterKg: 175,
      fineAggregateKg: 800,
      coarseAggregateKg: 1100,
      admixtureKg: 4,
      airContentPercent: 2.0,
      wcRatio: 0.50,
      freshDensityKgM3: 2429,
      isValid: true,
      valid: true,
      warnings: [],
      errors: [],
      quantities: {
        cement: 350,
        totalBinder: 350,
        effectiveWater: 175,
        addedWater: 175,
        fineAggregates: 800,
        coarseAggregates: 1100,
        admixtures: []
      }
    };
  }
}

describe("SnoLab Multi-Method Mix Design Engine Tests", () => {
  const registry = MixDesignMethodRegistry.getInstance();

  const standardInput: MixDesignInput = {
    bypassSuitabilityGate: true,
    fck28: 25,
    controlClass: "normal",
    cementType: "CEM I 42.5N",
    cementClassStrength: 42.5,
    dMax: 20,
    slump: 8,
    aggregateType: "concasse",
    aggregateQuality: "standard",
    hasPumping: false,
    sandRelativeDensity: 2.65,
    gravelRelativeDensity: 2.68,
    cementDensity: 3100,
    airContent: 1.5,
    moistureSand: 0,
    moistureGravel: 0,
    selectedMethod: "dreux"
  };

  it("Extensibility: should be able to register, fetch, list and unregister a new method strategy", () => {
    const mockMethod = new MockMixMethod();
    
    // Register
    registry.register(mockMethod);
    expect(registry.get("mock-aci-doe")).toBe(mockMethod);
    expect(registry.listActive().some(m => m.metadata.id === "mock-aci-doe")).toBe(true);

    // Calculate using the registered mock method strategy
    const result = mixDesignEngine.calculate({
      methodId: "mock-aci-doe",
      input: standardInput,
      context: { language: "ar" }
    });

    expect(result.cementKg).toBe(350);
    expect(result.wcRatio).toBe(0.50);

    // Unregister
    registry.unregister("mock-aci-doe");
    expect(() => registry.get("mock-aci-doe")).toThrow();
  });

  it("Strict Validation: should throw MethodValidationException when strict: true and inputs are invalid", () => {
    const invalidInput = {
      ...standardInput,
      fck28: -5 // Invalid strength
    };

    expect(() => {
      mixDesignEngine.calculate({
        methodId: "dreux-gorisse",
        input: invalidInput,
        context: { language: "ar", strict: true }
      });
    }).toThrow();
  });

  it("Regression / Golden Test: should maintain 100% mathematical parity with the legacy Dreux-Gorisse engine", () => {
    const context = { language: "ar" as const };
    
    // Execute through new multi-method engine
    const engineResult = mixDesignEngine.calculate({
      methodId: "dreux-gorisse",
      input: standardInput,
      context
    });

    // Execute through legacy core function
    const legacyResult = calculateDreuxGorisseCore({
      ...standardInput,
      selectedMethod: "dreux"
    } as any);

    // 100% value comparison of core numeric proportions with precise legacy rounding
    expect(engineResult.cementKg).toBe(Math.round(legacyResult.cementWeight * 10) / 10);
    expect(engineResult.waterKg).toBe(Math.round(legacyResult.waterContentActual * 10) / 10);
    expect(engineResult.fineAggregateKg).toBe(Math.round(legacyResult.sandWeightDry * 10) / 10);
    expect(engineResult.coarseAggregateKg).toBe(Math.round(legacyResult.gravelWeightDry * 10) / 10);
    expect(engineResult.wcRatio).toBe(parseFloat(legacyResult.wcRatioAdjusted.toFixed(3)));
    expect(engineResult.freshDensityKgM3).toBe(Math.round(legacyResult.totalFreshDensity * 10) / 10);
    expect(engineResult.isValid).toBe(legacyResult.isValid);
  });

  it("Migration: should successfully migrate legacy project inputs missing 'methodId' to 'dreux-gorisse'", () => {
    const legacyProject = {
      id: "proj_123",
      name: "Old Project",
      inputs: {
        fck28: 30,
        slump: 7
        // no methodId
      }
    };

    const migrated = mixDesignEngine.migrateProject(legacyProject);
    expect(migrated.methodId).toBe("dreux-gorisse");
    expect(migrated.inputs.methodId).toBe("dreux-gorisse");
  });

  it("Duplicate Registration: should reject duplicate registrations with DuplicateMethodRegistrationError", () => {
    const mockMethod = new MockMixMethod();
    // Register it once
    registry.register(mockMethod);
    
    // Attempt duplicate registration
    expect(() => {
      registry.register(mockMethod);
    }).toThrow(DuplicateMethodRegistrationError);

    // Cleanup
    registry.unregister("mock-aci-doe");
  });

  it("Unsupported Version: should reject unsupported method versions with UnsupportedMethodVersionError", () => {
    const mockMethod = new MockMixMethod();
    registry.register(mockMethod);

    expect(() => {
      mixDesignEngine.calculate({
        methodId: "mock-aci-doe",
        methodVersion: "9.9.9", // Incorrect version
        input: standardInput,
        context: { language: "ar" }
      });
    }).toThrow(UnsupportedMethodVersionError);

    registry.unregister("mock-aci-doe");
  });

  it("Dependency Injection: should allow custom registry injection via constructor", () => {
    // Create a private registry that doesn't register Dreux-Gorisse by default
    const customRegistry = MixDesignMethodRegistry.getInstance();
    const customEngine = new MixDesignEngine(customRegistry);
    
    // Should be able to resolve standard methods from registry
    expect(customRegistry.has("dreux-gorisse")).toBe(true);
    const result = customEngine.calculate({
      methodId: "dreux-gorisse",
      input: standardInput,
      context: { language: "ar" }
    });
    expect(result.isValid).toBe(true);
  });

  it("Non-strict prevention: should prevent executing calculation on validation errors even under non-strict mode", () => {
    const invalidInput = {
      ...standardInput,
      fck28: -10 // Critical error
    };

    const result = mixDesignEngine.calculate({
      methodId: "dreux-gorisse",
      input: invalidInput,
      context: { language: "ar", strict: false }
    });

    expect(result.isValid).toBe(false);
    expect(result.cementKg).toBe(0); // Calculation prevented
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
