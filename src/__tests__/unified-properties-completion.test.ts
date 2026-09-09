import { describe, it, expect } from "vitest";
import { 
  categorizeMixMaterialDeficiencies, 
  getEngineeringPropertyReference,
  applyBatchMaterialProperties,
  inspectMixMaterialProperties
} from "../services/materialPropertySchema";
import { EngineeringMaterial, MixDesignInput } from "../types";

describe("Unified Material Properties Completion System", () => {
  const sampleIncompleteSand: EngineeringMaterial = {
    id: "sand-test-01",
    name: "Wadi Sand 0/4",
    category: "رمال",
    type: "sand",
    materialSource: "user",
    isSystem: false,
    ApprovalStatus: "Incomplete"
  } as any;

  const sampleIncompleteGravel: EngineeringMaterial = {
    id: "gravel-test-01",
    name: "Crushed Aggregate 8/15",
    category: "حصى",
    type: "gravel",
    materialSource: "user",
    isSystem: false,
    ApprovalStatus: "Incomplete"
  } as any;

  const sampleCompleteCement: EngineeringMaterial = {
    id: "cement-test-01",
    name: "Portland Cement CPJ 42.5",
    category: "إسمنت",
    type: "cement",
    density: 3100,
    strengthClass: 42.5,
    cementClass: "CEM I 42.5",
    bulkDensity: 1150,
    blaineFineness: 3450,
    initialSettingTime: 135,
    soundness: 1.5,
    materialSource: "user",
    isSystem: false,
    ApprovalStatus: "Approved"
  } as any;

  it("should categorize deficiencies into autoCompletable, userInput, needsReview, and valid", () => {
    const activeMaterials = [
      { role: "sand", material: sampleIncompleteSand },
      { role: "gravel", material: sampleIncompleteGravel },
      { role: "cement", material: sampleCompleteCement }
    ];

    const breakdowns = categorizeMixMaterialDeficiencies(activeMaterials, {}, "dreux", "NSC");
    expect(breakdowns.length).toBe(3);

    const sandBreakdown = breakdowns.find(b => b.material.id === "sand-test-01");
    expect(sandBreakdown).toBeDefined();
    // Auto-completable (density, finenessModulus, bulkDensity, sandEquivalent)
    expect(sandBreakdown?.autoCompletable.length).toBeGreaterThan(0);
    // User input (moisture)
    expect(sandBreakdown?.userInput.some(p => p.key === "moisture")).toBe(true);

    const cementBreakdown = breakdowns.find(b => b.material.id === "cement-test-01");
    expect(cementBreakdown).toBeDefined();
    expect(cementBreakdown?.valid.length).toBeGreaterThan(0);
    expect(cementBreakdown?.autoCompletable.length).toBe(0);
    expect(cementBreakdown?.totalDeficiencies).toBe(0);
  });

  it("should provide authentic, norm-backed engineering values without inventing random numbers", () => {
    const cementRef = getEngineeringPropertyReference(sampleCompleteCement, "cement", "density");
    expect(cementRef.value).toBe(3100);
    expect(cementRef.source).toContain("EN 197-1");

    const sandRef = getEngineeringPropertyReference(sampleIncompleteSand, "sand", "density");
    expect(sandRef.value).toBe(2650);
    expect(sandRef.source).toContain("EN 1097-6");

    // Gravel with fraction 8/15 in name should deduce dMax = 15, dMin = 8
    const gravelDmaxRef = getEngineeringPropertyReference(sampleIncompleteGravel, "gravel", "dMax");
    expect(gravelDmaxRef.value).toBe(15);

    const gravelDminRef = getEngineeringPropertyReference(sampleIncompleteGravel, "gravel", "dMin");
    expect(gravelDminRef.value).toBe(8);
  });

  it("should flag invalid and illogical values for engineering review", () => {
    // Sand with impossible density of 9999 kg/m³
    const invalidSand: EngineeringMaterial = {
      id: "sand-invalid",
      name: "Bad Sand",
      category: "رمال",
      type: "sand",
      density: 9999, // out of bounds
      ApprovalStatus: "Incomplete"
    } as any;

    const breakdowns = categorizeMixMaterialDeficiencies(
      [{ role: "sand", material: invalidSand }],
      {},
      "dreux",
      "NSC"
    );

    const breakdown = breakdowns[0];
    const reviewItem = breakdown.needsReview.find(p => p.key === "density");
    expect(reviewItem).toBeDefined();
    expect(reviewItem?.status).toBe("invalid");
    expect(reviewItem?.suggestedValue).toBe(2650);
  });

  it("should apply batch properties atomically and update material status", () => {
    const initialInputs: MixDesignInput = {
      selectedSandId: "sand-test-01",
      concreteType: "NSC"
    } as any;

    const updates = [
      { materialId: "sand-test-01", propertyKey: "density", newValue: 2650 },
      { materialId: "sand-test-01", propertyKey: "finenessModulus", newValue: 2.5 },
      { materialId: "sand-test-01", propertyKey: "sandEquivalent", newValue: 82 },
      { materialId: "sand-test-01", propertyKey: "bulkDensity", newValue: 1550 },
      { materialId: "sand-test-01", propertyKey: "moisture", newValue: 3.0 }
    ];

    const { updatedMaterials, updatedInputs, errors } = applyBatchMaterialProperties(
      [sampleIncompleteSand],
      initialInputs,
      updates,
      "engineer@snolab.dz"
    );

    expect(errors.length).toBe(0);
    const updatedSand = updatedMaterials.find(m => m.id === "sand-test-01");
    expect(updatedSand).toBeDefined();
    expect(updatedSand?.density).toBe(2650);
    expect(updatedSand?.finenessModulus).toBe(2.5);
    expect(updatedSand?.engineeringData?.density).toBe(2650);
    expect(updatedSand?.propertyMetadata?.density?.status).toBe("user_edited");
    expect(updatedInputs.sandDensity).toBe(2650);
    expect(updatedInputs.sandFinenessModulus).toBe(2.5);
  });
});
