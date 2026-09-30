import { describe, expect, it } from "vitest";
import { EXPANDED_REFERENCE_MATERIALS, MATERIAL_BUNDLES_BY_CONCRETE_TYPE, getMaterialBundle } from "../data/materialLibraryExpansion";
import { SEEDED_MATERIALS } from "../data/seededMaterials";
import { auditMaterial } from "../services/materialAuditEngine";
import { applyBatchMaterialProperties } from "../services/materialPropertySchema";

describe("Expanded editable material library", () => {
  it("ships unique, schema-ready reference records", () => {
    const ids = EXPANDED_REFERENCE_MATERIALS.map(material => material.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(EXPANDED_REFERENCE_MATERIALS.length).toBeGreaterThanOrEqual(20);
    for (const material of EXPANDED_REFERENCE_MATERIALS) {
      const audit = auditMaterial(material);
      expect(audit.missingRequiredProperties, material.id).toEqual([]);
      expect(audit.invalidProperties, material.id).toEqual([]);
      expect(material.propertyMetadata).toBeDefined();
      expect(material.propertyMetadata?.density?.isEditable).toBe(true);
    }
  });

  it("resolves every published concrete-type bundle to library materials", () => {
    const allIds = new Set(SEEDED_MATERIALS.map(material => material.id));
    for (const [concreteType, bundle] of Object.entries(MATERIAL_BUNDLES_BY_CONCRETE_TYPE)) {
      expect(bundle.materialIds.length, concreteType).toBeGreaterThanOrEqual(3);
      expect(bundle.materialIds.every(id => allIds.has(id)), concreteType).toBe(true);
      expect(getMaterialBundle(concreteType).length, concreteType).toBe(bundle.materialIds.length);
    }
  });

  it("persists a user property edit in the direct record, engineering data and metadata", () => {
    const source = EXPANDED_REFERENCE_MATERIALS.find(material => material.id === "SYS-ADM-SP-001")!;
    const result = applyBatchMaterialProperties(
      [source],
      [{ materialId: source.id, propertyKey: "recommendedDosage", newValue: 1.8, userNote: "نتيجة الخلطة التجريبية" }]
    );
    const updated = result.updatedMaterials[0] as any;
    expect(updated.recommendedDosage).toBe(1.8);
    expect(updated.engineeringData.recommendedDosage).toBe(1.8);
    expect(updated.propertyMetadata.recommendedDosage.value).toBe(1.8);
    expect(updated.propertyMetadata.recommendedDosage.status).toBe("user_edited");
    expect(updated.propertyMetadata.recommendedDosage.history.length).toBeGreaterThan(0);
  });
});
