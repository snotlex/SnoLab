import { describe, expect, it } from "vitest";
import { executeConcreteLaboratoryTest } from "./concreteLaboratoryEngine";
import { executeConcreteLegacyTest } from "./concreteLegacyAdapter";
import { CONCRETE_DOMAIN_TEST_DEFINITIONS } from "./concreteLaboratoryTestDefinitions";

const executeDomainRun = (testId: string, rawData: Record<string, unknown>, official = false) => executeConcreteLaboratoryTest(testId, {
  runId: `RUN-${testId}`,
  projectId: "PROJECT-1",
  materialId: "CONCRETE-1",
  sampleId: "SAMPLE-1",
  operator: "operator-1",
  rawData,
  official,
  now: "2026-10-23T10:00:00.000Z"
});

describe("concrete laboratory engine domain contract", () => {
  it("registers exactly the four currently executable legacy concrete tests", () => {
    expect(CONCRETE_DOMAIN_TEST_DEFINITIONS.map(definition => definition.id)).toEqual([
      "FC_SLUMP",
      "FC_TEMPERATURE",
      "HC_COMPRESSIVE_STRENGTH",
      "HC_SPLIT_TENSILE"
    ]);
    expect(new Set(CONCRETE_DOMAIN_TEST_DEFINITIONS.map(definition => definition.id)).size).toBe(4);
    expect(CONCRETE_DOMAIN_TEST_DEFINITIONS.every(definition => definition.standard?.status === "Draft")).toBe(true);
  });

  it("executes fresh concrete tests as domain runs without making acceptance decisions", () => {
    const slump = executeDomainRun("FC_SLUMP", { slumpMm: 120, targetSlumpMm: 100, toleranceMm: 10, batchId: "B-F-1" });
    expect(slump).toMatchObject({ domainId: "fresh_concrete", testDefinitionId: "FC_SLUMP", status: "Warning", result: { value: 120, unit: "mm" } });
    expect(slump?.calculationTrace).toHaveLength(1);
    expect(slump?.acceptanceEvaluation).toBeUndefined();

    const temperature = executeDomainRun("FC_TEMPERATURE", { measuredTemperatureC: 24, batchId: "B-F-2" });
    expect(temperature).toMatchObject({ domainId: "fresh_concrete", status: "Warning", result: { value: 24, unit: "°C" } });
    expect(temperature?.acceptanceEvaluation).toBeUndefined();
  });

  it("executes hardened concrete tests with the modern result shape and trace", () => {
    const compression = executeDomainRun("HC_COMPRESSIVE_STRENGTH", { failureLoadKN: 720, loadedAreaMm2: 22500, ageDays: 28, specimenId: "C-1", batchId: "B-H-1", targetStrengthMpa: 30 });
    expect(compression).toMatchObject({ domainId: "hardened_concrete", status: "Warning", result: { value: 32, unit: "MPa" } });
    expect(compression?.calculationTrace[0].formula).toContain("failure load / loaded area");
    expect(compression?.acceptanceEvaluation).toBeUndefined();

    const split = executeDomainRun("HC_SPLIT_TENSILE", { failureLoadKN: 176.714, cylinderDiameterMm: 150, cylinderLengthMm: 300, ageDays: 28, specimenId: "T-1", batchId: "B-H-1", targetStrengthMpa: 2.4 });
    expect(split?.domainId).toBe("hardened_concrete");
    expect(split?.result?.value as number).toBeCloseTo(2.5, 2);
    expect(split?.status).toBe("Warning");
    expect(split?.acceptanceEvaluation).toBeUndefined();
  });

  it("returns validation and official-preflight states instead of using a legacy PASS/FAIL verdict", () => {
    const invalid = executeDomainRun("HC_COMPRESSIVE_STRENGTH", { failureLoadKN: -1, loadedAreaMm2: 22500, ageDays: 28, specimenId: "C-1", batchId: "B-H-1" });
    expect(invalid?.status).toBe("Invalid");
    expect(invalid?.validation.valid).toBe(false);

    const officialDraft = executeDomainRun("FC_SLUMP", { slumpMm: 120, batchId: "B-F-3" }, true);
    expect(officialDraft?.status).toBe("Blocked");
    expect(officialDraft?.calculationTrace).toEqual([]);
    expect(officialDraft?.validation.issues.some(issue => issue.code.includes("STANDARD"))).toBe(true);
  });

  it("does not claim planned, Phase2-only, or non-concrete IDs", () => {
    expect(executeConcreteLaboratoryTest("FC_SLUMP_FLOW", { runId: "R", materialId: "M", sampleId: "S", operator: "op", rawData: {} })).toBeUndefined();
    expect(executeConcreteLaboratoryTest("FRESH_SLUMP_PHASE2", { runId: "R", materialId: "M", sampleId: "S", operator: "op", rawData: {} })).toBeUndefined();
    expect(executeConcreteLaboratoryTest("GT_PROCTOR", { runId: "R", materialId: "M", sampleId: "S", operator: "op", rawData: {} })).toBeUndefined();
  });
});

describe("concrete legacy compatibility adapter", () => {
  it("preserves fresh-concrete legacy result semantics", () => {
    const slump = executeConcreteLegacyTest("FC_SLUMP", { slumpMm: 120, targetSlumpMm: 100, toleranceMm: 10, batchId: "B-F-1" });
    expect(slump).toMatchObject({ status: "FAIL", results: { slumpMm: 120, deviationMm: 20 }, syncedProperties: { slumpMm: 120 } });
    const temperature = executeConcreteLegacyTest("FC_TEMPERATURE", { measuredTemperatureC: 24, batchId: "B-F-2" });
    expect(temperature).toMatchObject({ status: "WARNING", results: { temperatureC: 24 }, syncedProperties: { temperatureC: 24 } });
  });

  it("preserves hardened-concrete legacy acceptance results", () => {
    const compression = executeConcreteLegacyTest("HC_COMPRESSIVE_STRENGTH", { failureLoadKN: 720, loadedAreaMm2: 22500, ageDays: 28, targetStrengthMpa: 30, specimenId: "C-1", batchId: "B-H-1" });
    expect(compression).toMatchObject({ status: "PASS", results: { compressiveStrengthMpa: 32 }, syncedProperties: { compressiveStrengthMpa: 32 } });
    const splitTensile = executeConcreteLegacyTest("HC_SPLIT_TENSILE", { failureLoadKN: 176.714, cylinderDiameterMm: 150, cylinderLengthMm: 300, ageDays: 28, targetStrengthMpa: 2.4, specimenId: "T-1", batchId: "B-H-1" });
    expect(splitTensile?.results.splitTensileStrengthMpa).toBeCloseTo(2.5, 2);
    expect(splitTensile?.status).toBe("PASS");
  });

  it("preserves inclusive slump tolerance and review status when a strength target is absent", () => {
    expect(executeConcreteLegacyTest("FC_SLUMP", { slumpMm: 110, targetSlumpMm: 100, toleranceMm: 10, batchId: "B-F-4" })?.status).toBe("PASS");
    expect(executeConcreteLegacyTest("FC_SLUMP", { slumpMm: 110.01, targetSlumpMm: 100, toleranceMm: 10, batchId: "B-F-5" })?.status).toBe("FAIL");
    expect(executeConcreteLegacyTest("HC_COMPRESSIVE_STRENGTH", { failureLoadKN: 720, loadedAreaMm2: 22500, ageDays: 28, specimenId: "C-2", batchId: "B-H-2" })?.status).toBe("WARNING");
  });

  it("does not capture civil-material or unregistered concrete tests", () => {
    expect(executeConcreteLegacyTest("AGG_SIEVE", {})).toBeUndefined();
    expect(executeConcreteLegacyTest("FC_SLUMP_FLOW", {})).toBeUndefined();
  });
});
