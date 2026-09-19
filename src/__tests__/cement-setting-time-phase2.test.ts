import { describe, expect, it } from "vitest";
import { calculateCementSettingTime } from "../services/cementSettingTime";
import { executeDefinedLaboratoryTest } from "../services/laboratoryTestEngine";
import { CEMENT_SETTING_TIME_DEFINITION } from "../services/laboratoryTestDefinitions";
import { createCementSettingTimeMaterialUpdateProposals } from "../services/laboratoryMaterialUpdateProposals";
import type { EngineeringMaterial } from "../types";

const validInput = {
  waterPercent: 27.5,
  roomTempC: 20,
  humidityPercent: 92,
  timeReadings: [
    { timeMinutes: 30, penetrationMm: 40 },
    { timeMinutes: 60, penetrationMm: 40 },
    { timeMinutes: 90, penetrationMm: 38 },
    { timeMinutes: 120, penetrationMm: 32 },
    { timeMinutes: 150, penetrationMm: 22 },
    { timeMinutes: 180, penetrationMm: 11 },
    { timeMinutes: 200, penetrationMm: 4 },
    { timeMinutes: 240, penetrationMm: 1 },
    { timeMinutes: 280, penetrationMm: 0.5 }
  ]
};

describe("Phase 2 cement setting time", () => {
  it("identifies first and final setting from ordered Vicat readings", () => {
    const result = calculateCementSettingTime(validInput);
    expect(result?.validation.valid).toBe(true);
    expect(result?.initialSettingMinutes).toBe(200);
    expect(result?.finalSettingMinutes).toBe(280);
    expect(result?.trace).toHaveLength(2);
  });

  it("rejects unordered readings and missing setting thresholds", () => {
    expect(calculateCementSettingTime({ ...validInput, timeReadings: [{ timeMinutes: 60, penetrationMm: 40 }, { timeMinutes: 30, penetrationMm: 4 }] })).toBeUndefined();
    expect(calculateCementSettingTime({ ...validInput, timeReadings: [{ timeMinutes: 30, penetrationMm: 40 }, { timeMinutes: 60, penetrationMm: 20 }] })).toBeUndefined();
    expect(calculateCementSettingTime({ ...validInput, waterPercent: 0 })).toBeUndefined();
  });

  it("retains a valid result with a warning when initial set is early", () => {
    const result = calculateCementSettingTime({ ...validInput, timeReadings: [{ timeMinutes: 30, penetrationMm: 4 }, { timeMinutes: 60, penetrationMm: 0.5 }] });
    expect(result?.validation.valid).toBe(true);
    expect(result?.validation.issues.map(item => item.code)).toContain("INITIAL_SET_BELOW_STANDARD_SCREEN");
  });

  it("runs through the shared engine and creates pending setting-time proposals", () => {
    const run = executeDefinedLaboratoryTest(CEMENT_SETTING_TIME_DEFINITION, {
      runId: "RUN-SETTING-TIME-PHASE2",
      materialId: "MAT-CEMENT-1",
      sampleId: "SMP-CEMENT-1",
      operator: "lab-tech",
      rawData: validInput,
      standard: { organization: "EN", code: "EN 196-3", version: "2026", status: "Active" },
      now: "2026-09-19T00:00:00.000Z"
    });
    expect(run.status).toBe("Calculated");
    expect(run.result?.value).toBe(200);
    const result = calculateCementSettingTime(validInput);
    if (!result) throw new Error("Expected valid result");
    const proposals = createCementSettingTimeMaterialUpdateProposals({
      material: { id: "MAT-CEMENT-1", name: "Cement", category: "إسمنت", initialSettingMinutes: 180, finalSettingMinutes: 260 } as unknown as EngineeringMaterial,
      testRunId: run.id,
      result,
      proposedAt: "2026-09-19T00:00:00.000Z"
    });
    expect(proposals).toHaveLength(2);
    expect(proposals).toEqual(expect.arrayContaining([
      expect.objectContaining({ propertyKey: "initialSettingMinutes", oldValue: 180, newValue: 200, status: "Pending" }),
      expect.objectContaining({ propertyKey: "finalSettingMinutes", oldValue: 260, newValue: 280, status: "Pending" })
    ]));
  });
});
