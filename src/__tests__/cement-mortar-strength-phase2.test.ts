import { describe, expect, it } from "vitest";
import { calculateCementMortarStrength } from "../services/cementMortarStrength";
import { executeDefinedLaboratoryTest } from "../services/laboratoryTestEngine";
import { CEMENT_MORTAR_STRENGTH_DEFINITION } from "../services/laboratoryTestDefinitions";
import { createCementMortarStrengthMaterialUpdateProposals } from "../services/laboratoryMaterialUpdateProposals";
import type { EngineeringMaterial } from "../types";

const validInput = {
  strength2dPrismsKn: [28.5, 29.2, 28.8, 29.0, 28.6, 29.1],
  strength7dPrismsKn: [51.2, 52.0, 50.8, 51.5, 52.2, 51.8],
  strength28dPrismsKn: [76.5, 77.2, 75.8, 76.0, 77.5, 76.8],
  prismWidthMm: 40,
  prismDepthMm: 40
};

describe("Phase 2 cement mortar strength", () => {
  it("converts prism forces to mean strengths at 2, 7 and 28 days", () => {
    const result = calculateCementMortarStrength(validInput);
    expect(result?.validation.valid).toBe(true);
    expect(result?.strength2dMPa).toBe(18.04);
    expect(result?.strength7dMPa).toBe(32.24);
    expect(result?.strength28dMPa).toBe(47.9);
    expect(result?.strengthClass).toBe("42.5");
    expect(result?.compressionAreaMm2).toBe(1600);
    expect(result?.trace).toHaveLength(3);
  });

  it("rejects insufficient force series, invalid forces and non-standard dimensions", () => {
    expect(calculateCementMortarStrength({ ...validInput, strength28dPrismsKn: [70, 71] })).toBeUndefined();
    expect(calculateCementMortarStrength({ ...validInput, strength2dPrismsKn: [28, 0, 29] })).toBeUndefined();
    expect(calculateCementMortarStrength({ ...validInput, prismWidthMm: 50 })).toBeUndefined();
  });

  it("retains a valid result with a warning for non-monotonic curing strength", () => {
    const result = calculateCementMortarStrength({ ...validInput, strength7dPrismsKn: [20, 20, 20] });
    expect(result?.validation.valid).toBe(true);
    expect(result?.validation.issues.map(item => item.code)).toContain("NON_MONOTONIC_STRENGTH");
  });

  it("runs through the shared engine and creates pending strength proposals", () => {
    const run = executeDefinedLaboratoryTest(CEMENT_MORTAR_STRENGTH_DEFINITION, {
      runId: "RUN-STRENGTH-PHASE2",
      materialId: "MAT-CEMENT-1",
      sampleId: "SMP-CEMENT-1",
      operator: "lab-tech",
      rawData: validInput,
      standard: { organization: "EN", code: "EN 196-1", version: "2026", status: "Active" },
      now: "2026-09-19T00:00:00.000Z"
    });
    expect(run.status).toBe("Calculated");
    expect(run.result?.value).toBe(47.9);
    const result = calculateCementMortarStrength(validInput);
    if (!result) throw new Error("Expected valid result");
    const proposals = createCementMortarStrengthMaterialUpdateProposals({
      material: { id: "MAT-CEMENT-1", name: "Cement", category: "إسمنت", strength2d: 17, strength7d: 31, strength28d: 46 } as unknown as EngineeringMaterial,
      testRunId: run.id,
      result,
      proposedAt: "2026-09-19T00:00:00.000Z"
    });
    expect(proposals).toHaveLength(3);
    expect(proposals).toEqual(expect.arrayContaining([
      expect.objectContaining({ propertyKey: "strength2d", oldValue: 17, newValue: 18.04, status: "Pending" }),
      expect.objectContaining({ propertyKey: "strength7d", oldValue: 31, newValue: 32.24, status: "Pending" }),
      expect.objectContaining({ propertyKey: "strength28d", oldValue: 46, newValue: 47.9, status: "Pending" })
    ]));
  });
});
