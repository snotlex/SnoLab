import { describe, it, expect } from "vitest";
import { evaluateEngineeringGate } from "../services/engineeringVerificationEngine";
import { EngineeringMaterial, MixDesignInput } from "../types";

describe("Dynamic Engineering Verification Gate Engine", () => {
  const baseInput: any = {
    concreteType: "NSC",
    selectedMethod: "dreux",
    dMax: 20,
    targetStrength28d: 30,
    targetSlump: 80,
    sandType: "Medium",
    gravelType: "8/15"
  };

  it("1. Should dynamically evaluate requirements without hardcoding library dependencies", () => {
    // Empty database - gate should evaluate input context, not library existence
    const result = evaluateEngineeringGate(baseInput, "calculator", []);
    
    // In calculator (Mix Preparation), screen is never blocked
    expect(result.isBlocked).toBe(false);
    expect(result.gateState).toBe("NEEDS_ATTENTION");
    
    // Fine aggregate and Coarse aggregate are listed with their dynamic reasons
    const sandRole = result.roles.find(r => r.role === "sand");
    const gravelRole = result.roles.find(r => r.role === "gravel");
    
    expect(sandRole).toBeDefined();
    expect(sandRole?.isRequired).toBe(true);
    expect(gravelRole).toBeDefined();
    expect(gravelRole?.isRequired).toBe(true);
  });

  it("2. Should NOT require coarse aggregate (gravel) for MORTAR or GROUT concrete types", () => {
    const mortarInput: MixDesignInput = {
      ...baseInput,
      concreteType: "MORTAR",
      dMax: 4
    };

    const result = evaluateEngineeringGate(mortarInput, "calculator", []);
    const gravelRole = result.roles.find(r => r.role === "gravel");
    
    // Gravel should not be present or not required
    if (gravelRole) {
      expect(gravelRole.isRequired).toBe(false);
    } else {
      expect(gravelRole).toBeUndefined();
    }
  });

  it("3. Should require chemical admixture for SCC (Self-Compacting Concrete)", () => {
    const sccInput: MixDesignInput = {
      ...baseInput,
      concreteType: "SCC"
    };

    const result = evaluateEngineeringGate(sccInput, "calculator", []);
    const admixtureRole = result.roles.find(r => r.role === "admixture");
    
    expect(admixtureRole).toBeDefined();
    expect(admixtureRole?.isRequired).toBe(true);
    expect(admixtureRole?.sourceReasonEn.toLowerCase()).toContain("self-compacting");
  });

  it("4. Should require fibers for FIBER concrete type", () => {
    const fiberInput: MixDesignInput = {
      ...baseInput,
      concreteType: "FIBER"
    };

    const result = evaluateEngineeringGate(fiberInput, "calculator", []);
    const fiberRole = result.roles.find(r => r.role === "fiber");
    
    expect(fiberRole).toBeDefined();
    expect(fiberRole?.isRequired).toBe(true);
  });

  it("5. Should be READY when all required materials are selected and eligible", () => {
    const sampleCement: EngineeringMaterial = {
      id: "user-cem-1",
      name: "User Cement CEM I",
      englishName: "User Cement CEM I",
      quality: "Standard",
      uses: "General",
      desc: "User sample cement",
      rating: 5,
      provenance: "Local",
      category: "إسمنت",
      type: "cementitious",
      strengthClass: "42.5",
      density: 3100,
      specificGravity: 3.1,
      ssdDensity: 3100,
      approvalStatus: "Approved",
      status: "نشط",
      ownerId: "user-123",
      source: "user",
      createdBy: "Engineer"
    };

    const sampleSand: EngineeringMaterial = {
      id: "user-sand-1",
      name: "User Sand 0/4",
      englishName: "User Sand 0/4",
      quality: "Standard",
      uses: "General",
      desc: "User sample sand",
      rating: 5,
      provenance: "Local",
      category: "رمال",
      type: "sand",
      ssdDensity: 2630,
      density: 2600,
      specificGravity: 2.6,
      bulkDensity: 1500,
      absorption: 1.5,
      moisture: 3.5,
      finenessModulus: 2.6,
      sandEquivalent: 78,
      approvalStatus: "Approved",
      status: "نشط",
      ownerId: "user-123",
      source: "user",
      createdBy: "Engineer"
    };

    const sampleGravel: EngineeringMaterial = {
      id: "user-gravel-1",
      name: "User Gravel 4/20",
      englishName: "User Gravel 4/20",
      quality: "Standard",
      uses: "General",
      desc: "User sample gravel",
      rating: 5,
      provenance: "Local",
      category: "حصى",
      type: "gravel",
      ssdDensity: 2680,
      density: 2650,
      specificGravity: 2.65,
      bulkDensity: 1550,
      absorption: 0.8,
      moisture: 1.0,
      dMax: 20,
      particleShape: "مكسر",
      approvalStatus: "Approved",
      ApprovalStatus: "Approved",
      status: "نشط",
      ownerId: "user-123",
      source: "user",
      createdBy: "Engineer"
    };

    const sampleWater: EngineeringMaterial = {
      id: "user-water-1",
      name: "User Water",
      englishName: "User Water",
      quality: "Standard",
      uses: "General",
      desc: "User sample water",
      rating: 5,
      provenance: "Local",
      category: "ماء",
      type: "water",
      density: 1000,
      specificGravity: 1.0,
      approvalStatus: "Approved",
      status: "نشط",
      ownerId: "user-123",
      source: "user",
      createdBy: "Engineer"
    };

    const db = [sampleCement, sampleSand, sampleGravel, sampleWater];

    const fullInput: MixDesignInput = {
      ...baseInput,
      selectedCementId: "user-cem-1",
      selectedSandId: "user-sand-1",
      selectedGravelId: "user-gravel-1",
      selectedWaterId: "user-water-1"
    };

    const result = evaluateEngineeringGate(fullInput, "reports", db);
    
    expect(result.gateState).toBe("READY");
    expect(result.isBlocked).toBe(false);
    expect(result.missingCount).toBe(0);
    expect(result.readyCount).toBe(4);
  });

  it("6. Should block calculations in reports tab if a required material is missing", () => {
    const missingInput: MixDesignInput = {
      ...baseInput,
      selectedCementId: "mat-cem-1",
      selectedSandId: undefined, // Missing sand
      selectedGravelId: "mat-gravel-1",
      selectedWaterId: "mat-water-1"
    };

    const result = evaluateEngineeringGate(missingInput, "reports", []);
    
    expect(result.gateState).toBe("BLOCKED");
    expect(result.isBlocked).toBe(true);
    expect(result.missingCount).toBeGreaterThan(0);
  });
});
