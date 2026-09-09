import { describe, it, expect } from "vitest";
import { CompletenessChecker } from "../services/import/CompletenessChecker";
import { BulkCompletionService } from "../services/import/BulkCompletionService";
import { EngineeringMaterial } from "../types";

describe("Post-Import Completeness Checker & Audit Engine", () => {
  it("detects missing Dreux-required properties on sand material", () => {
    const incompleteSand = {
      id: "user_sand_1",
      name: "رمل وادي الصومام",
      category: "رمال",
      materialType: "Sand",
      density: 2650,
      source: "user"
      // Missing: finenessModulus, absorption, moisture
    } as any as EngineeringMaterial;

    const audit = CompletenessChecker.inspectMaterial(incompleteSand, "dreux");

    expect(audit.overallStatus).toBe("INCOMPLETE");
    expect(audit.requiresAttention).toBe(true);
    expect(audit.calculationBlockers.length).toBeGreaterThan(0);
    expect(audit.calculationBlockers[0]).toContain("معامل النعومة");

    const fmProp = audit.properties.find(p => p.key === "finenessModulus");
    expect(fmProp).toBeDefined();
    expect(fmProp?.status).toBe("MISSING");
    expect(fmProp?.priority).toBe("DREUX_REQUIRED");
  });

  it("distinguishes between EMPTY and MISSING status", () => {
    const emptyPropMaterial = {
      id: "user_gravel_1",
      name: "حصى مكسر 15/25",
      category: "حصى",
      materialType: "Gravel",
      density: 2680,
      dMax: "" as any, // explicitly empty string
      source: "user"
    } as any as EngineeringMaterial;

    const audit = CompletenessChecker.inspectMaterial(emptyPropMaterial, "dreux");
    const dMaxProp = audit.properties.find(p => p.key === "dMax");
    expect(dMaxProp?.status).toBe("EMPTY");
  });

  it("detects INVALID values outside engineering physical ranges", () => {
    const invalidMaterial = {
      id: "user_cement_bad",
      name: "إسمنت بورتلاندي فاسد",
      category: "إسمنت",
      materialType: "Cement",
      density: -1500, // physically impossible negative density
      source: "user"
    } as any as EngineeringMaterial;

    const audit = CompletenessChecker.inspectMaterial(invalidMaterial, "dreux");
    expect(audit.overallStatus).toBe("INVALID");

    const densityProp = audit.properties.find(p => p.key === "density");
    expect(densityProp?.status).toBe("INVALID");
    expect(densityProp?.validationError).toContain("سالب");
  });

  it("flags OCR or low confidence properties as NEEDS_REVIEW", () => {
    const ocrMaterial = {
      id: "user_admixture_ocr",
      name: "ملدن فائق Medaflow 30",
      category: "إضافات كيميائية",
      materialType: "Admixture",
      density: 1200,
      solidContent: 30,
      dosagePercent: 1.2,
      waterReduction: 20,
      propertyMetadata: {
        solidContent: {
          key: "solidContent",
          value: 30,
          sourceType: "imported",
          status: "needs_review",
          confidence: "Low",
          notes: "Extracted via OCR from lab certificate"
        }
      },
      source: "user"
    } as any as EngineeringMaterial;

    const audit = CompletenessChecker.inspectMaterial(ocrMaterial, "dreux");
    expect(audit.overallStatus).toBe("NEEDS_REVIEW");

    const solidProp = audit.properties.find(p => p.key === "solidContent");
    expect(solidProp?.status).toBe("NEEDS_REVIEW");
    expect(solidProp?.requiresConfirmation).toBe(true);
  });

  it("returns READY when all required properties are complete and valid", () => {
    const completeCement = {
      id: "user_cement_perfect",
      name: "إسمنت متين CEM II/A-L 42.5 N",
      category: "إسمنت",
      materialType: "Cement",
      density: 3100,
      specificGravity: 3.1,
      strength28d: 42.5,
      source: "user"
    } as any as EngineeringMaterial;

    const audit = CompletenessChecker.inspectMaterial(completeCement, "dreux");
    expect(audit.overallStatus).toBe("READY");
    expect(audit.requiresAttention).toBe(false);
    expect(audit.calculationBlockers.length).toBe(0);
  });

  it("inspectLibrary generates correct multi-material audit summary", () => {
    const library: EngineeringMaterial[] = [
      {
        id: "mat_1",
        name: "إسمنت كامل",
        category: "إسمنت",
        density: 3100,
        specificGravity: 3.1,
        strength28d: 42.5,
        source: "user"
      } as any,
      {
        id: "mat_2",
        name: "رمل ناقص معامل النعومة",
        category: "رمال",
        density: 2600,
        source: "user"
      } as any
    ];

    const report = CompletenessChecker.inspectLibrary(library);
    expect(report.totalInspected).toBe(2);
    expect(report.readyCount).toBe(1);
    expect(report.incompleteCount).toBe(1);
    expect(report.requiresAttentionCount).toBe(1);
  });
});

describe("BulkCompletionService", () => {
  it("safely applies valid updates and calculates linked properties", () => {
    const initialSand = {
      id: "user_sand_fill",
      name: "رمل سيليسي",
      category: "رمال",
      source: "user"
    } as any as EngineeringMaterial;

    const result = BulkCompletionService.applyBulkCompletion(
      [initialSand],
      [
        { materialId: "user_sand_fill", propertyKey: "density", value: 2650 },
        { materialId: "user_sand_fill", propertyKey: "finenessModulus", value: 2.6 }
      ],
      "engineer@snolab.dz"
    );

    expect(result.success).toBe(true);
    expect(result.savedCount).toBe(2);
    expect(result.updatedMaterials.length).toBe(1);

    const updated = result.updatedMaterials[0];
    expect(updated.density).toBe(2650);
    expect(updated.finenessModulus).toBe(2.6);
    // Automatic linked sync
    expect(updated.specificGravity).toBe(2.65);

    // Provenance history
    expect(updated.propertyMetadata?.density?.history?.[0]?.user).toBe("engineer@snolab.dz");
  });

  it("rejects invalid inputs without losing other valid fields", () => {
    const initialGravel = {
      id: "user_gravel_safe",
      name: "حصى مكسر",
      category: "حصى",
      density: 2650,
      source: "user"
    } as any as EngineeringMaterial;

    const result = BulkCompletionService.applyBulkCompletion(
      [initialGravel],
      [
        { materialId: "user_gravel_safe", propertyKey: "dMax", value: 20 }, // valid
        { materialId: "user_gravel_safe", propertyKey: "dMin", value: -5 }  // invalid negative
      ]
    );

    expect(result.savedCount).toBe(1); // dMax saved
    expect(result.errorCount).toBe(1); // dMin failed
    expect(result.success).toBe(false); // Has validation errors

    const updated = result.updatedMaterials[0];
    expect(updated.dMax).toBe(20);
    expect(updated.dMin).toBeUndefined(); // Bad value was not applied!
  });

  it("retrieves available properties and checks compatibility per material role", () => {
    const sandSpecs = CompletenessChecker.getAvailablePropertiesForRole("sand");
    expect(sandSpecs.length).toBeGreaterThanOrEqual(7);
    expect(sandSpecs.some(s => s.key === "finenessModulus")).toBe(true);
    expect(sandSpecs.some(s => s.key === "absorption")).toBe(true);

    const cementSpecs = CompletenessChecker.getAvailablePropertiesForRole("cement");
    expect(cementSpecs.some(s => s.key === "strength28d")).toBe(true);
    expect(cementSpecs.some(s => s.key === "finenessModulus")).toBe(false);

    // Compatibility check
    expect(CompletenessChecker.isPropertyCompatibleWithRole("finenessModulus", "sand")).toBe(true);
    expect(CompletenessChecker.isPropertyCompatibleWithRole("finenessModulus", "cement")).toBe(false);
    expect(CompletenessChecker.isPropertyCompatibleWithRole("strength28d", "cement")).toBe(true);
    expect(CompletenessChecker.isPropertyCompatibleWithRole("strength28d", "sand")).toBe(false);
  });

  it("accurately detects property existence with hasPropertyKey", () => {
    const mat = {
      id: "mat_1",
      name: "رمل",
      density: 2600,
      engineeringData: {
        absorption: 1.5
      },
      extraProperties: {
        moisture: 3.2
      }
    } as any as EngineeringMaterial;

    expect(CompletenessChecker.hasPropertyKey(mat, "density")).toBe(true);
    expect(CompletenessChecker.hasPropertyKey(mat, "absorption")).toBe(true);
    expect(CompletenessChecker.hasPropertyKey(mat, "moisture")).toBe(true);
    expect(CompletenessChecker.hasPropertyKey(mat, "finenessModulus")).toBe(false);
  });

  it("tracks provenance with manual source for added property and manually_corrected for updated property", () => {
    const mat = {
      id: "mat_prov_test",
      name: "إسمنت بورتلاندي",
      category: "إسمنت",
      density: 3100, // existing value
      source: "user"
    } as any as EngineeringMaterial;

    // 1. Add missing property (strength28d) and update existing (density: 3100 -> 3150)
    const result = BulkCompletionService.applyBulkCompletion(
      [mat],
      [
        { materialId: "mat_prov_test", propertyKey: "strength28d", value: 42.5 },
        { materialId: "mat_prov_test", propertyKey: "density", value: 3150 }
      ],
      "lab_engineer@snolab.dz"
    );

    expect(result.success).toBe(true);
    const updated = result.updatedMaterials[0];

    // Added property: source = "manual"
    expect(updated.propertySources?.strength28d?.source).toBe("manual");
    expect((updated.propertyMetadata?.strength28d as any)?.source).toBe("manual");
    expect(updated.propertyMetadata?.strength28d?.history?.[0]?.note).toContain("استكمال");

    // Corrected property: source = "manually_corrected"
    expect(updated.propertySources?.density?.source).toBe("manually_corrected");
    expect((updated.propertyMetadata?.density as any)?.source).toBe("manually_corrected");
    expect(updated.propertyMetadata?.density?.history?.[0]?.previousValue).toBe(3100);
    expect(updated.propertyMetadata?.density?.history?.[0]?.note).toContain("تصحيح");
  });
});

