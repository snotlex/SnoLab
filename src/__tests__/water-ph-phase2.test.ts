import { describe, expect, it } from "vitest";
import { calculateWaterPh } from "../services/waterPh";
import { executeDefinedLaboratoryTest } from "../services/laboratoryTestEngine";
import { WATER_PH_DEFINITION } from "../services/laboratoryTestDefinitions";
import { createWaterPhMaterialUpdateProposals } from "../services/laboratoryMaterialUpdateProposals";
import type { EngineeringMaterial } from "../types";

const validInput = { measuredPh: 7.4, waterTemperatureC: 21 };

describe("Phase 2 water pH", () => {
  it("records a valid pH and classifies normal mixing water", () => {
    const result = calculateWaterPh(validInput);
    expect(result?.validation.valid).toBe(true);
    expect(result?.waterPh).toBe(7.4);
    expect(result?.classification).toBe("Pass");
    expect(result?.trace).toHaveLength(1);
  });

  it("rejects readings outside the physical pH scale", () => {
    expect(calculateWaterPh({ ...validInput, measuredPh: -0.1 })).toBeUndefined();
    expect(calculateWaterPh({ ...validInput, measuredPh: 14.1 })).toBeUndefined();
    expect(calculateWaterPh({ ...validInput, waterTemperatureC: 70 })).toBeUndefined();
  });

  it("classifies acidic or strongly alkaline water as fail", () => {
    expect(calculateWaterPh({ ...validInput, measuredPh: 4 })).toMatchObject({ classification: "Fail" });
    expect(calculateWaterPh({ ...validInput, measuredPh: 10 })).toMatchObject({ classification: "Fail" });
  });

  it("runs through the shared engine and creates a pending water-pH proposal", () => {
    const run = executeDefinedLaboratoryTest(WATER_PH_DEFINITION, {
      runId: "RUN-WATER-PH-PHASE2",
      materialId: "MAT-WATER-1",
      sampleId: "SMP-WATER-1",
      operator: "lab-tech",
      rawData: validInput,
      standard: { organization: "EN", code: "EN 1008", version: "2026", status: "Active" },
      now: "2026-09-19T00:00:00.000Z"
    });
    expect(run.status).toBe("Calculated");
    expect(run.result?.value).toBe(7.4);
    const result = calculateWaterPh(validInput);
    if (!result) throw new Error("Expected valid result");
    const proposals = createWaterPhMaterialUpdateProposals({
      material: { id: "MAT-WATER-1", name: "Mixing water", category: "ماء", waterPh: 7 } as unknown as EngineeringMaterial,
      testRunId: run.id,
      result,
      proposedAt: "2026-09-19T00:00:00.000Z"
    });
    expect(proposals).toHaveLength(1);
    expect(proposals[0]).toMatchObject({ propertyKey: "waterPh", oldValue: 7, newValue: 7.4, status: "Pending" });
  });
});
