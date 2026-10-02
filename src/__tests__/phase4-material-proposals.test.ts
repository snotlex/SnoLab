import { describe, expect, it } from "vitest";
import { executeDefinedLaboratoryTest } from "../services/laboratoryTestEngine";
import { FIBER_DIMENSIONS_DEFINITION, WATER_CHLORIDES_DEFINITION } from "../services/phase4AdvancedTestDefinitions";
import { createPhase4MaterialUpdateProposals, isPhase4Definition } from "../services/phase4MaterialUpdateProposals";
import type { EngineeringMaterial } from "../types";

const water = { id: "water-1", chloridesMgL: 100 } as unknown as EngineeringMaterial;

describe("Phase 4 material update proposals", () => {
  it("creates a pending chloride proposal without mutating the material", () => {
    const run = executeDefinedLaboratoryTest(WATER_CHLORIDES_DEFINITION, { runId: "W-1", materialId: water.id, sampleId: "S-1", operator: "tech", rawData: { analyteMassMg: 210, sampleVolumeL: 1 } });
    const proposals = createPhase4MaterialUpdateProposals({ material: water, run, proposedAt: "2026-10-02T00:00:00.000Z" });
    expect(proposals).toMatchObject([{ propertyKey: "chloridesMgL", oldValue: 100, newValue: 210, status: "Pending" }]);
    expect(water.chloridesMgL).toBe(100);
  });

  it("creates no proposal for an invalid run", () => {
    const run = executeDefinedLaboratoryTest(FIBER_DIMENSIONS_DEFINITION, { runId: "F-1", materialId: "fiber-1", sampleId: "S-1", operator: "tech", rawData: { lengthMm: 10, diameterMm: 0 } } as any);
    expect(createPhase4MaterialUpdateProposals({ material: { id: "fiber-1" } as EngineeringMaterial, run })).toEqual([]);
  });

  it("recognizes only registered Phase 4 definition ids", () => {
    expect(isPhase4Definition("WATER_CHLORIDES_PHASE4")).toBe(true);
    expect(isPhase4Definition("AGG_SIEVE_PHASE2")).toBe(false);
  });
});
