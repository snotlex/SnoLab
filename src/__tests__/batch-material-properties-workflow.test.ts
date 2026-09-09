import { describe, it, expect } from "vitest";
import { 
  inspectMixMaterialProperties, 
  applyBatchMaterialProperties, 
  validateNumericRange,
  MATERIAL_PROPERTY_SCHEMAS,
  BatchUpdatePayload
} from "../services/materialPropertySchema";
import { EngineeringMaterial, MixDesignInput } from "../types";

describe("Batch Material Properties Engine & Workflow", () => {
  const sampleCement: EngineeringMaterial = {
    id: "cem-001",
    name: "CPJ 42.5 Portland Cement",
    category: "إسمنت",
    density: 3100,
    strengthClass: "42.5",
    cementClass: "CEM I 42.5",
    ApprovalStatus: "Approved"
  } as any;

  const sampleSandMissing: EngineeringMaterial = {
    id: "sand-001",
    name: "Washed Oued Sand 0/4",
    category: "رمال",
    // Missing density, bulkDensity, moisture, absorption, finenessModulus, sandEquivalent
    ApprovalStatus: "Approved"
  } as any;

  const sampleGravelMissing: EngineeringMaterial = {
    id: "grv-001",
    name: "Crushed Limestone 4/20",
    category: "حصى",
    // Missing density, bulkDensity, absorption, moisture, particleShape, dMax
    ApprovalStatus: "Approved"
  } as any;

  const sampleAdmixture: EngineeringMaterial = {
    id: "adm-001",
    name: "High Range Superplasticizer Polycarboxylate",
    category: "إضافات كيميائية",
    admixtureType: "superplasticizer",
    density: 1080,
    recommendedDosage: 1.2,
    waterReduction: 25,
    ApprovalStatus: "Approved"
  } as any;

  const sampleWater: EngineeringMaterial = {
    id: "wat-001",
    name: "Potable Mixing Water",
    category: "ماء",
    density: 1000,
    ApprovalStatus: "Approved"
  } as any;

  const sampleInputs: MixDesignInput = {
    selectedCementId: "cem-001",
    selectedSandId: "sand-001",
    selectedGravelId: "grv-001",
    selectedAdmixtureId: "adm-001",
    selectedWaterId: "wat-001",
    concreteType: "NSC",
    fck28: 30,
    slump: 10,
    dMax: 20
  } as any;

  it("should inspect and detect all missing required properties accurately", () => {
    const activeMaterials = [
      { role: "cement", material: sampleCement },
      { role: "sand", material: sampleSandMissing },
      { role: "gravel", material: sampleGravelMissing },
      { role: "admixture", material: sampleAdmixture },
      { role: "water", material: sampleWater }
    ];

    const summary = inspectMixMaterialProperties(activeMaterials, "dreux", "standard", "ar");

    expect(summary.groups.length).toBe(5);
    expect(summary.totalMissingRequired).toBeGreaterThan(0);

    // Cement has density, cementClass, and strengthClass -> missingRequiredCount is 0
    const cementGroup = summary.groups.find(g => g.material.id === "cem-001");
    expect(cementGroup?.missingRequiredCount).toBe(0);

    // Sand has missing properties
    const sandGroup = summary.groups.find(g => g.material.id === "sand-001");
    expect(sandGroup?.missingRequiredCount).toBeGreaterThanOrEqual(5);

    // Gravel has missing properties
    const gravelGroup = summary.groups.find(g => g.material.id === "grv-001");
    expect(gravelGroup?.missingRequiredCount).toBeGreaterThanOrEqual(4);
  });

  it("should enforce strict physical and engineering plausibility validation", () => {
    // Density validation
    const validDensity = validateNumericRange(2650, { min: 1800, max: 3500, nameAr: "الكثافة", nameFr: "Masse volumique", nameEn: "Density", unit: "kg/m³" });
    expect(validDensity.isValid).toBe(true);

    const negativeDensity = validateNumericRange(-500, { min: 1800, max: 3500, nameAr: "الكثافة", nameFr: "Masse volumique", nameEn: "Density", unit: "kg/m³" });
    expect(negativeDensity.isValid).toBe(false);

    const extremeDensity = validateNumericRange(99999, { min: 1800, max: 3500, nameAr: "الكثافة", nameFr: "Masse volumique", nameEn: "Density", unit: "kg/m³" });
    expect(extremeDensity.isValid).toBe(false);

    // Fineness Modulus validation (typically 1.5 to 4.0)
    const fmSchema = MATERIAL_PROPERTY_SCHEMAS.sand.find(p => p.key === "finenessModulus");
    expect(fmSchema).toBeDefined();

    const validFM = fmSchema!.validate(2.65, sampleSandMissing, "dreux");
    expect(validFM.isValid).toBe(true);

    const invalidLowFM = fmSchema!.validate(0.5, sampleSandMissing, "dreux");
    expect(invalidLowFM.isValid).toBe(false);

    const invalidHighFM = fmSchema!.validate(6.0, sampleSandMissing, "dreux");
    expect(invalidHighFM.isValid).toBe(false);
  });

  it("should apply batch properties updates cleanly, update MixDesignInput, and retain user edit provenance", () => {
    const materialsList = [
      sampleCement,
      sampleSandMissing,
      sampleGravelMissing,
      sampleAdmixture,
      sampleWater
    ];

    const updates: BatchUpdatePayload[] = [
      // Sand updates
      { materialId: "sand-001", propertyKey: "density", newValue: 2650 },
      { materialId: "sand-001", propertyKey: "bulkDensity", newValue: 1550 },
      { materialId: "sand-001", propertyKey: "moisture", newValue: 3.5 },
      { materialId: "sand-001", propertyKey: "absorption", newValue: 1.2 },
      { materialId: "sand-001", propertyKey: "finenessModulus", newValue: 2.7 },
      { materialId: "sand-001", propertyKey: "sandEquivalent", newValue: 80 },

      // Gravel updates
      { materialId: "grv-001", propertyKey: "density", newValue: 2700 },
      { materialId: "grv-001", propertyKey: "bulkDensity", newValue: 1500 },
      { materialId: "grv-001", propertyKey: "absorption", newValue: 0.8 },
      { materialId: "grv-001", propertyKey: "moisture", newValue: 1.0 },
      { materialId: "grv-001", propertyKey: "dMax", newValue: 20 },
      { materialId: "grv-001", propertyKey: "particleShape", newValue: "angular" }
    ];

    const { updatedMaterials, updatedInputs, errors } = applyBatchMaterialProperties(
      materialsList,
      sampleInputs,
      updates,
      "eng-user-123"
    );

    expect(errors).toHaveLength(0);

    // Verify Sand is fully populated
    const updatedSand = updatedMaterials.find(m => m.id === "sand-001");
    expect(updatedSand).toBeDefined();
    expect(updatedSand?.density).toBe(2650);
    expect(updatedSand?.bulkDensity).toBe(1550);
    expect(updatedSand?.moisture).toBe(3.5);
    expect(updatedSand?.absorption).toBe(1.2);
    expect(updatedSand?.finenessModulus).toBe(2.7);
    expect((updatedSand as any)?.sandEquivalent).toBe(80);
    expect((updatedSand as any)?.lastModifiedBy).toBe("eng-user-123");

    // Verify Gravel is fully populated
    const updatedGravel = updatedMaterials.find(m => m.id === "grv-001");
    expect(updatedGravel).toBeDefined();
    expect(updatedGravel?.density).toBe(2700);
    expect(updatedGravel?.bulkDensity).toBe(1500);
    expect(updatedGravel?.absorption).toBe(0.8);
    expect(updatedGravel?.moisture).toBe(1.0);
    expect(updatedGravel?.dMax).toBe(20);
    expect(updatedGravel?.particleShape).toBe("angular");

    // Verify MixDesignInput received synchronization
    expect((updatedInputs as any).sandDensity).toBe(2650);
    expect((updatedInputs as any).gravelDensity).toBe(2700);
    expect((updatedInputs as any).sandMoisture).toBe(3.5);
    expect((updatedInputs as any).sandAbsorption).toBe(1.2);
    expect((updatedInputs as any).gravelAbsorption).toBe(0.8);
    expect((updatedInputs as any).sandFinenessModulus).toBe(2.7);
    expect(updatedInputs.dMax).toBe(20);
  });

  it("should verify that reinspecting after applying batch properties results in 0 missing properties", () => {
    const materialsList = [
      sampleCement,
      sampleSandMissing,
      sampleGravelMissing,
      sampleAdmixture,
      sampleWater
    ];

    const updates: BatchUpdatePayload[] = [
      { materialId: "sand-001", propertyKey: "density", newValue: 2650 },
      { materialId: "sand-001", propertyKey: "bulkDensity", newValue: 1550 },
      { materialId: "sand-001", propertyKey: "moisture", newValue: 3.5 },
      { materialId: "sand-001", propertyKey: "absorption", newValue: 1.2 },
      { materialId: "sand-001", propertyKey: "finenessModulus", newValue: 2.7 },
      { materialId: "sand-001", propertyKey: "sandEquivalent", newValue: 80 },
      { materialId: "grv-001", propertyKey: "density", newValue: 2700 },
      { materialId: "grv-001", propertyKey: "bulkDensity", newValue: 1500 },
      { materialId: "grv-001", propertyKey: "absorption", newValue: 0.8 },
      { materialId: "grv-001", propertyKey: "moisture", newValue: 1.0 },
      { materialId: "grv-001", propertyKey: "dMax", newValue: 20 },
      { materialId: "grv-001", propertyKey: "particleShape", newValue: "angular" }
    ];

    const { updatedMaterials, updatedInputs } = applyBatchMaterialProperties(
      materialsList,
      sampleInputs,
      updates
    );

    const reInspectedActive = [
      { role: "cement", material: updatedMaterials.find(m => m.id === "cem-001")! },
      { role: "sand", material: updatedMaterials.find(m => m.id === "sand-001")! },
      { role: "gravel", material: updatedMaterials.find(m => m.id === "grv-001")! },
      { role: "admixture", material: updatedMaterials.find(m => m.id === "adm-001")! },
      { role: "water", material: updatedMaterials.find(m => m.id === "wat-001")! }
    ];

    const newSummary = inspectMixMaterialProperties(reInspectedActive, "dreux", "standard", "ar");
    expect(newSummary.totalMissingRequired).toBe(0);
  });
});
