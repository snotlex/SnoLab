import { describe, expect, it } from "vitest";
import { createMaterialBatch, getActiveMaterialBatch, upsertMaterialBatch, validateMaterialBatchForConcreteType } from "../services/materialBatchService";
import { EngineeringMaterial } from "../types";

const sand: EngineeringMaterial = {
  id: "MAT-SAND-1",
  name: "رمل مغسول",
  category: "رمال",
  type: "aggregate",
  density: 2600,
  materialSource: "user",
  source: "user"
} as EngineeringMaterial;

describe("material batch service", () => {
  it("creates and updates an active batch without losing material properties", () => {
    const batch = createMaterialBatch(sand.id, { batchNumber: "LOT-01", status: "مقبولة", moisture: 2.1, absorption: 1.2, ssdDensity: 2640 });
    const updated = upsertMaterialBatch(sand, batch);
    expect(getActiveMaterialBatch(updated)?.batchNumber).toBe("LOT-01");
    expect(getActiveMaterialBatch(updated)?.moisture).toBe(2.1);
    expect(updated.name).toBe(sand.name);
  });

  it("flags missing aggregate batch properties before a calculation", () => {
    const material = upsertMaterialBatch(sand, { batchNumber: "LOT-02", status: "مقبولة" });
    const issues = validateMaterialBatchForConcreteType(material, "NSC");
    expect(issues.some(issue => issue.code === "batch_moisture_missing" && issue.severity === "error")).toBe(true);
    expect(issues.some(issue => issue.code === "batch_absorption_missing" && issue.severity === "error")).toBe(true);
  });
});
