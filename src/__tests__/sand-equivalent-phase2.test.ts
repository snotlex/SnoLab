import { describe, expect, it } from "vitest";
import { calculateSandEquivalent } from "../services/sandEquivalent";
import { executeDefinedLaboratoryTest } from "../services/laboratoryTestEngine";
import { SAND_EQUIVALENT_DEFINITION } from "../services/laboratoryTestDefinitions";
import { createSandEquivalentMaterialUpdateProposals } from "../services/laboratoryMaterialUpdateProposals";
import type { EngineeringMaterial } from "../types";

const pistonInput = { totalHeightMm: 112.5, sandHeightMm: 86, method: "piston" as const };

describe("Phase 2 sand equivalent", () => {
  it("calculates a piston sand equivalent with classification and trace", () => {
    const result = calculateSandEquivalent(pistonInput);
    expect(result?.validation.valid).toBe(true);
    expect(result?.sandEquivalentPercent).toBe(76.4);
    expect(result?.method).toBe("piston");
    expect(result?.classification).toBe("Clean");
    expect(result?.trace).toHaveLength(1);
  });

  it("supports visual readings and classifies an acceptable result", () => {
    const result = calculateSandEquivalent({ totalHeightMm: 120, sandHeightMm: 85, method: "visual" });
    expect(result?.sandEquivalentPercent).toBe(70.8);
    expect(result?.method).toBe("visual");
    expect(result?.classification).toBe("Acceptable");
  });

  it("rejects invalid heights and sand height above total", () => {
    expect(calculateSandEquivalent({ ...pistonInput, totalHeightMm: 0 })).toBeUndefined();
    expect(calculateSandEquivalent({ ...pistonInput, sandHeightMm: -1 })).toBeUndefined();
    expect(calculateSandEquivalent({ ...pistonInput, sandHeightMm: 113 })).toBeUndefined();
  });

  it("runs through the shared engine and creates a pending proposal", () => {
    const run = executeDefinedLaboratoryTest(SAND_EQUIVALENT_DEFINITION, {
      runId: "RUN-SE-PHASE2",
      materialId: "MAT-SAND-1",
      sampleId: "SMP-SAND-1",
      operator: "lab-tech",
      rawData: pistonInput,
      standard: { organization: "EN", code: "EN 933-8", version: "2026", status: "Active" },
      now: "2026-09-19T00:00:00.000Z"
    });
    expect(run.status).toBe("Calculated");
    expect(run.result?.value).toBe(76.4);
    const result = calculateSandEquivalent(pistonInput);
    if (!result) throw new Error("Expected valid result");
    const proposals = createSandEquivalentMaterialUpdateProposals({
      material: { id: "MAT-SAND-1", name: "Sand", category: "رمال", sandEquivalent: 72 } as EngineeringMaterial,
      testRunId: run.id,
      result,
      proposedAt: "2026-09-19T00:00:00.000Z"
    });
    expect(proposals).toHaveLength(1);
    expect(proposals[0]).toMatchObject({ propertyKey: "sandEquivalent", oldValue: 72, newValue: 76.4, status: "Pending" });
  });
});
