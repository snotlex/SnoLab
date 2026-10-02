import { describe, expect, it } from "vitest";
import { MASTER_TEST_CATALOG } from "../services/materialsLabEngine";
import { executePhase4CatalogTest, PHASE4_CATALOG_BRIDGE } from "../services/phase4CatalogBridge";

describe("Phase 4 catalog bridge", () => {
  it("maps every unified Phase 4 definition to an existing laboratory catalog item", () => {
    const catalogIds = new Set(MASTER_TEST_CATALOG.map(test => test.id));
    expect(PHASE4_CATALOG_BRIDGE).toHaveLength(8);
    for (const entry of PHASE4_CATALOG_BRIDGE) expect(catalogIds.has(entry.catalogId), entry.catalogId).toBe(true);
  });

  it("runs legacy water catalog input through the unified calculation lifecycle", () => {
    const run = executePhase4CatalogTest({
      legacyId: "WATER_CHLORIDES",
      inputs: { chloridesMgPerL: 210, concreteApplication: "reinforced" },
      runId: "BRIDGE-W-1",
      materialId: "WATER-1",
      sampleId: "SAMPLE-1",
      operator: "tech"
    });
    expect(run.testDefinitionId).toBe("WATER_CHLORIDES_PHASE4");
    expect(run.result).toMatchObject({ value: 210, unit: "mg/L" });
    expect(run.calculationTrace).toHaveLength(1);
  });

  it("normalizes legacy dry-extract inputs without changing the recorded catalog identity", () => {
    const run = executePhase4CatalogTest({
      legacyId: "ADM_SOLID_CONTENT",
      inputs: { emptyDishMassG: 22.45, dishPlusWetAdmixtureMassG: 32.45, dishPlusDryResidueMassG: 25.95 },
      runId: "BRIDGE-A-1",
      materialId: "ADM-1",
      sampleId: "SAMPLE-1",
      operator: "tech"
    });
    expect(run.result?.value).toBeCloseTo(35, 10);
    expect(run.testDefinitionRevision).toBe(1);
  });
});
