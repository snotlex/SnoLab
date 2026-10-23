import { describe, expect, it } from "vitest";
import { executeConcreteLegacyTest } from "./concreteLaboratoryEngine";

describe("concrete laboratory engine facade", () => {
  it("routes fresh-concrete tests and preserves legacy result semantics", () => {
    const slump = executeConcreteLegacyTest("FC_SLUMP", { slumpMm: 120, targetSlumpMm: 100, toleranceMm: 10, batchId: "B-F-1" });
    expect(slump).toMatchObject({ status: "FAIL", results: { slumpMm: 120, deviationMm: 20 }, syncedProperties: { slumpMm: 120 } });
    const temperature = executeConcreteLegacyTest("FC_TEMPERATURE", { measuredTemperatureC: 24, batchId: "B-F-2" });
    expect(temperature).toMatchObject({ status: "WARNING", results: { temperatureC: 24 }, syncedProperties: { temperatureC: 24 } });
  });

  it("routes hardened-concrete tests without moving their acceptance decisions", () => {
    const compression = executeConcreteLegacyTest("HC_COMPRESSIVE_STRENGTH", { failureLoadKN: 720, loadedAreaMm2: 22500, ageDays: 28, targetStrengthMpa: 30, specimenId: "C-1", batchId: "B-H-1" });
    expect(compression).toMatchObject({ status: "PASS", results: { compressiveStrengthMpa: 32 }, syncedProperties: { compressiveStrengthMpa: 32 } });
    const splitTensile = executeConcreteLegacyTest("HC_SPLIT_TENSILE", { failureLoadKN: 176.714, cylinderDiameterMm: 150, cylinderLengthMm: 300, ageDays: 28, targetStrengthMpa: 2.4, specimenId: "T-1", batchId: "B-H-1" });
    expect(splitTensile?.results.splitTensileStrengthMpa).toBeCloseTo(2.5, 2);
    expect(splitTensile?.status).toBe("PASS");
  });

  it("does not claim ownership of civil-material or unregistered concrete tests", () => {
    expect(executeConcreteLegacyTest("AGG_SIEVE", {})).toBeUndefined();
    expect(executeConcreteLegacyTest("FC_SLUMP_FLOW", {})).toBeUndefined();
  });
});
