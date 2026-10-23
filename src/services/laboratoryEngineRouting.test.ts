import { describe, expect, it } from "vitest";
import type { EngineeringMaterial } from "../types";
import { executeLaboratoryTest } from "./materialsLabEngine";

const soil = { id: "SOIL-1", name: "Soil sample", category: "تربة", type: "soil", materialType: "soil" } as EngineeringMaterial;
const concrete = { id: "CONCRETE-1", name: "Concrete batch", category: "CONCRETE", type: "concrete", materialType: "CONCRETE" } as EngineeringMaterial;

describe("legacy laboratory engine routing guard", () => {
  it("blocks geotechnical definitions from falling through to the legacy PASS default", () => {
    const result = executeLaboratoryTest("GT_PROCTOR", { moldVolumeCm3: 1000, points: [] }, soil);
    expect(result.status).toBe("BLOCKED");
    expect(result.results).toEqual({});
    expect(result.syncedProperties).toEqual({});
  });

  it("blocks planned concrete IDs that have no executable legacy definition", () => {
    const result = executeLaboratoryTest("FC_SLUMP_FLOW", { slumpFlowMm: 650 }, concrete);
    expect(result.status).toBe("BLOCKED");
    expect(result.complianceDetails[0].parameter).toBe("Domain engine routing");
  });
});
