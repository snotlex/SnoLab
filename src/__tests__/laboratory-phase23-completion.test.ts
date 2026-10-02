import { describe, expect, it } from "vitest";
import { executeDefinedLaboratoryTest } from "../services/laboratoryTestEngine";
import { FRESH_CONCRETE_SLUMP_DEFINITION, HARDENED_COMPRESSIVE_STRENGTH_DEFINITION, MORTAR_FLOW_DEFINITION, PHASE2_CONCRETE_TEST_DEFINITIONS } from "../services/concreteTestDefinitions";
import { allRequiredEquipmentReady, canUseStandard, deriveEquipmentStatus, registerEquipment, registerStandard } from "../services/laboratoryRegistry";

describe("Phase 2 concrete, hardened concrete and mortar definitions", () => {
  it("registers the required fresh, hardened and mortar definitions", () => {
    expect(PHASE2_CONCRETE_TEST_DEFINITIONS.map(item => item.category)).toEqual([
      "fresh-concrete", "fresh-concrete", "fresh-concrete", "hardened-concrete", "mortar", "mortar"
    ]);
  });

  it("calculates slump through the shared lifecycle", () => {
    const run = executeDefinedLaboratoryTest(FRESH_CONCRETE_SLUMP_DEFINITION, {
      runId: "SLUMP-1", materialId: "CONCRETE-1", sampleId: "SAMPLE-1", operator: "tech",
      rawData: { coneHeightMm: 300, measuredHeightMm: 220 }, now: "2026-10-01T00:00:00.000Z"
    });
    expect(run.status).toBe("Warning");
    expect(run.result).toMatchObject({ value: 80, unit: "mm" });
    expect(run.calculationTrace).toHaveLength(1);
  });

  it("blocks impossible hardened-strength input before calculation", () => {
    const run = executeDefinedLaboratoryTest(HARDENED_COMPRESSIVE_STRENGTH_DEFINITION, {
      runId: "HARD-1", materialId: "CONCRETE-1", sampleId: "SAMPLE-1", operator: "tech",
      rawData: { failureLoadKN: 100, loadedAreaMm2: 0 }
    } as any);
    expect(run.status).toBe("Invalid");
    expect(run.result).toBeUndefined();
  });

  it("retains warnings for mortar review instead of silently approving", () => {
    const run = executeDefinedLaboratoryTest(MORTAR_FLOW_DEFINITION, {
      runId: "MORTAR-1", materialId: "MORTAR-1", sampleId: "SAMPLE-1", operator: "tech",
      rawData: { referenceDiameterMm: 100, measuredDiameterMm: 90 }
    });
    expect(run.status).toBe("Warning");
    expect(run.validation.issues.map(issue => issue.code)).toContain("MORTAR_FLOW_BELOW_REFERENCE");
  });
});

describe("Phase 3 standards and equipment registries", () => {
  it("only permits active standards with configured criteria", () => {
    const registry = registerStandard({ id: "EN-123", organization: "EN", code: "EN 12350-2", version: "2024", status: "Active", acceptanceCriteriaConfigured: true });
    expect(canUseStandard(registry[0], new Date("2026-10-01"))).toBe(true);
    expect(canUseStandard({ ...registry[0], acceptanceCriteriaConfigured: false })).toBe(false);
  });

  it("marks expired equipment unavailable and keeps required equipment explicit", () => {
    const registry = registerEquipment({ id: "EQ-1", equipmentId: "EQ-1", name: "Press", status: "Active", nextCalibrationDate: "2026-01-01" }, [], new Date("2026-10-01"));
    expect(deriveEquipmentStatus(registry[0], new Date("2026-10-01"))).toBe("Expired");
    expect(allRequiredEquipmentReady(["EQ-1"], registry, new Date("2026-10-01"))).toBe(false);
  });
});
