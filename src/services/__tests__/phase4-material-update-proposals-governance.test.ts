import { describe, expect, it } from "vitest";
import { createPhase4MaterialUpdateProposals } from "../phase4MaterialUpdateProposals";
import type { EngineeringMaterial } from "../../types";
import type { LaboratoryTestRun } from "../../types/laboratoryDomain";

const material = { id: "water-1", name: "Water", category: "ماء" } as EngineeringMaterial;
const standard = { organization: "EN" as const, code: "EN 934", version: "2026", status: "Active" as const };
function run(overrides: Partial<LaboratoryTestRun> = {}): LaboratoryTestRun {
  return {
    id: "RUN-P4-1", materialId: material.id, sampleId: "S-1", testDefinitionId: "WATER_CHLORIDES_PHASE4", testDefinitionRevision: 1,
    operator: "tech", rawData: { value: 1 }, calculationTrace: [{ stepNumber: 1, label: "result", formula: "x", substitution: "1", result: 1, inputs: { value: 1 } }],
    result: { value: 120, unit: "mg/L" }, validation: { valid: true, issues: [] }, status: "Verified", verificationStatus: "VERIFIED",
    standard, createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z", ...overrides,
  };
}

describe("phase4 material proposal governance", () => {
  it("creates proposals only from verified, active-standard runs and stores source snapshot", () => {
    const proposals = createPhase4MaterialUpdateProposals({ material, run: run() });
    expect(proposals).toHaveLength(1);
    expect(proposals[0].sourceSnapshot).toMatchObject({ status: "Verified", verificationStatus: "VERIFIED", standardVersion: "2026" });
  });

  it("rejects calculated runs that have not been independently verified", () => {
    expect(createPhase4MaterialUpdateProposals({ material, run: run({ status: "Calculated", verificationStatus: "NEEDS_REVIEW" }) })).toEqual([]);
    expect(createPhase4MaterialUpdateProposals({ material, run: run({ standard: { ...standard, status: "Draft" } }) })).toEqual([]);
  });
});
