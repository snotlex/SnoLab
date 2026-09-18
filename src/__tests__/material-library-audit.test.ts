import { describe, it, expect } from "vitest";
import { SEEDED_MATERIALS } from "../data/seededMaterials";
import { 
  MATERIAL_PROPERTY_SCHEMAS, 
  normalizeMaterialRole, 
  validateNumericRange,
  getMaterialPropValue
} from "../services/materialPropertySchema";
import { 
  auditMaterial, 
  auditMaterialLibrary, 
  safeNormalizeMaterial,
  safeNormalizeLibrary 
} from "../services/materialAuditEngine";
import { EngineeringMaterial } from "../types";

describe("Material Property Schema & Completeness System", () => {
  it("should have valid schemas defined for all 13 supported material roles", () => {
    const roles = [
      "cement", "sand", "gravel", "admixture", "scm", 
      "filler", "water", "fiber", "lightweightAggregate", 
      "heavyweightAggregate", "specialBinder", "recycledAggregate", "airContent"
    ];

    for (const role of roles) {
      const schemas = MATERIAL_PROPERTY_SCHEMAS[role as any];
      expect(schemas, `Schema for role ${role} should be defined`).toBeDefined();
      expect(schemas.length).toBeGreaterThan(0);

      // Verify each property definition has required fields
      for (const prop of schemas) {
        expect(prop.key).toBeTruthy();
        expect(prop.labelAr).toBeTruthy();
        expect(prop.labelFr).toBeTruthy();
        expect(prop.labelEn).toBeTruthy();
        expect(typeof prop.isRequired).toBe("function");
        expect(typeof prop.validate).toBe("function");
      }
    }
  });

  it("should accurately identify missing properties in an incomplete material", () => {
    const incompleteSand: Partial<EngineeringMaterial> = {
      id: "user-sand-test-1",
      name: "رمل مستخدم تجريبي",
      category: "رمال",
      density: 2600,
      // Missing finenessModulus, absorption, moisture, bulkDensity
      status: "نشط"
    };

    const audit = auditMaterial(incompleteSand as EngineeringMaterial);
    expect(audit.readinessStatus).toBe("incomplete");
    expect(audit.completenessScore).toBeLessThan(100);
    expect(audit.missingRequiredCount).toBeGreaterThan(0);
    expect(audit.missingRequiredProperties.some(p => p.key === "finenessModulus")).toBe(true);
    expect(audit.missingRequiredProperties.some(p => p.key === "absorption")).toBe(true);
  });

  it("should mark out-of-range values as invalid / needs review without deleting them", () => {
    const invalidCement: Partial<EngineeringMaterial> = {
      id: "user-cement-test-2",
      name: "إسمنت غير صالح هندسياً",
      category: "إسمنت",
      cementClass: "CEM I 42.5",
      strengthClass: "150" as any, // Implausible (max is 80 MPa)
      density: 1200, // Implausible for cement (min is 2500 kg/m³)
      status: "نشط"
    };

    const audit = auditMaterial(invalidCement as EngineeringMaterial);
    expect(audit.readinessStatus).toBe("needs_review");
    expect(audit.invalidProperties.length).toBeGreaterThan(0);
    expect(audit.invalidProperties.some(p => p.definition.key === "strengthClass")).toBe(true);
    expect(audit.invalidProperties.some(p => p.definition.key === "density")).toBe(true);
  });

  it("should evaluate a 100% complete material as ready", () => {
    const completeGravel: Partial<EngineeringMaterial> = {
      id: "preset-complete-gravel",
      name: "حصى عياري مكتمل",
      category: "حصى",
      dMax: 20,
      density: 2650,
      bulkDensity: 1480,
      absorption: 1.2,
      moisture: 0.8,
      particleShape: "مكسر",
      status: "نشط",
      source: "system"
    };

    const audit = auditMaterial(completeGravel as EngineeringMaterial);
    expect(audit.readinessStatus).toBe("ready");
    expect(audit.completenessScore).toBe(100);
    expect(audit.missingRequiredCount).toBe(0);
    expect(audit.invalidRequiredCount).toBe(0);
  });

  it("should audit the entire material library and compute comprehensive stats", () => {
    const report = auditMaterialLibrary(SEEDED_MATERIALS);
    expect(report.totalMaterials).toBe(SEEDED_MATERIALS.length);
    expect(report.categoryStats.length).toBeGreaterThan(0);
    expect(report.auditTimestamp).toBeTruthy();
    expect(Array.isArray(report.results)).toBe(true);
  });

  it("should safely normalize materials without deleting user data or inventing fake numbers", () => {
    const rawMaterial: Partial<EngineeringMaterial> = {
      id: "user-mat-custom",
      name: "رمل مستورد",
      category: "رمال",
      specificGravity: "2.65" as any, // Alias for density
      finenessModulus: 2.7,
      status: "قيد المراجعة"
    };

    const normalized = safeNormalizeMaterial(rawMaterial as EngineeringMaterial);
    expect(normalized.id).toBe("user-mat-custom");
    expect(normalized.name).toBe("رمل مستورد");
    expect(normalized.finenessModulus).toBe(2.7);
    expect(normalized.specificGravity).toBe(2.65);
    // Should have derived density from specificGravity
    expect(normalized.density).toBe(2650);
    // Should preserve user provenance
    expect(normalized.propertySources?.finenessModulus?.source).toBe("user_entered");
  });

  it("should classify recycled aggregate from its combined category and type", () => {
    expect(normalizeMaterialRole({ category: "ركام معاد التدوير", type: "recycled_aggregate" })).toBe("recycledAggregate");
  });

  it("should accept zero water reduction for an accelerator while requiring it for a superplasticizer", () => {
    const admixtureSchema = MATERIAL_PROPERTY_SCHEMAS.admixture.find(p => p.key === "waterReduction")!;
    expect(admixtureSchema.validate(0).isValid).toBe(true);
    expect(admixtureSchema.isRequired({ admixtureType: "accelerator" } as EngineeringMaterial)).toBe(false);
    expect(admixtureSchema.isRequired({ admixtureType: "superplasticizer" } as EngineeringMaterial)).toBe(true);
  });
});
