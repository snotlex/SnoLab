import { describe, expect, it } from "vitest";
import { calculateMethyleneBlue } from "../services/methyleneBlue";
import { executeDefinedLaboratoryTest } from "../services/laboratoryTestEngine";
import { METHYLENE_BLUE_DEFINITION } from "../services/laboratoryTestDefinitions";
import { createMethyleneBlueMaterialUpdateProposals } from "../services/laboratoryMaterialUpdateProposals";
import type { EngineeringMaterial } from "../types";

const validInput = {
  fraction0_2MassG: 200,
  dyeSolutionInjectedMl: 20,
  dyeConcentrationGPerL: 10,
  endpointConfirmed: true
};

describe("Phase 2 methylene blue value", () => {
  it("calculates dye mass and MB value in g/kg", () => {
    const result = calculateMethyleneBlue(validInput);
    expect(result?.validation.valid).toBe(true);
    expect(result?.dyeMassG).toBe(0.2);
    expect(result?.methyleneBlueValueGPerKg).toBe(1);
    expect(result?.classification).toBe("Clean");
    expect(result?.trace).toHaveLength(3);
  });

  it("rejects invalid mass, concentration or unconfirmed endpoint", () => {
    expect(calculateMethyleneBlue({ ...validInput, fraction0_2MassG: 0 })).toBeUndefined();
    expect(calculateMethyleneBlue({ ...validInput, dyeConcentrationGPerL: 0 })).toBeUndefined();
    expect(calculateMethyleneBlue({ ...validInput, endpointConfirmed: false })).toBeUndefined();
  });

  it("classifies high dye demand as fail without inventing a fallback", () => {
    const result = calculateMethyleneBlue({ ...validInput, dyeSolutionInjectedMl: 40 });
    expect(result?.validation.valid).toBe(true);
    expect(result?.methyleneBlueValueGPerKg).toBe(2);
    expect(result?.classification).toBe("Fail");
  });

  it("runs through the shared engine and creates a pending MB proposal", () => {
    const run = executeDefinedLaboratoryTest(METHYLENE_BLUE_DEFINITION, {
      runId: "RUN-MBV-PHASE2",
      materialId: "MAT-SAND-1",
      sampleId: "SMP-SAND-1",
      operator: "lab-tech",
      rawData: validInput,
      standard: { organization: "EN", code: "EN 933-9", version: "2026", status: "Active" },
      now: "2026-09-19T00:00:00.000Z"
    });
    expect(run.status).toBe("Calculated");
    expect(run.result?.value).toBe(1);
    const result = calculateMethyleneBlue(validInput);
    if (!result) throw new Error("Expected valid result");
    const proposals = createMethyleneBlueMaterialUpdateProposals({
      material: { id: "MAT-SAND-1", name: "Sand", category: "رمال", methyleneBlue: 1.4 } as unknown as EngineeringMaterial,
      testRunId: run.id,
      result,
      proposedAt: "2026-09-19T00:00:00.000Z"
    });
    expect(proposals).toHaveLength(1);
    expect(proposals[0]).toMatchObject({ propertyKey: "methyleneBlue", oldValue: 1.4, newValue: 1, status: "Pending" });
  });
});
