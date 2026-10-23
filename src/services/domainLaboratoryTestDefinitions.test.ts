import { describe, expect, it } from "vitest";
import { calculateSoilSieve, validateProctorInput } from "./geotechnicalTestEngine";
import { calculateFreshConcreteSlump, calculateFreshConcreteTemperature } from "./freshConcreteTestEngine";
import { DOMAIN_LABORATORY_TEST_DEFINITIONS, GT_PROCTOR_DEFINITION } from "./domainLaboratoryTestDefinitions";
import { evaluateAcceptance } from "./laboratoryAcceptanceEngine";

describe("domain laboratory diagnostic engines", () => {
  it("calculates soil passing percentages and exposes mass-balance error", () => {
    const result = calculateSoilSieve({ totalSampleMassG: 1000, rows: [{ sieveMm: 2, retainedMassG: 200 }, { sieveMm: 0.063, retainedMassG: 700 }, { sieveMm: 0, retainedMassG: 100 }] });
    expect(result.rows[0].percentPassing).toBe(80);
    expect(result.finesPercent).toBe(10);
    expect(result.massBalanceErrorG).toBe(0);
  });

  it("requires multiple measured Proctor points", () => {
    expect(validateProctorInput({ moldVolumeCm3: 1000, points: [{ waterContentPercent: 10, wetSampleMassG: 1800 }] }).some(issue => issue.code === "PROCTOR_POINTS_INSUFFICIENT")).toBe(true);
  });

  it("calculates Proctor peak without assigning a layer acceptance verdict", async () => {
    const definition = DOMAIN_LABORATORY_TEST_DEFINITIONS.find(item => item.id === "GT_PROCTOR");
    expect(definition?.domainId).toBe("geotechnical");
    const result = GT_PROCTOR_DEFINITION.calculate({ moldVolumeCm3: 1000, points: [{ waterContentPercent: 8, wetSampleMassG: 1800 }, { waterContentPercent: 12, wetSampleMassG: 1950 }, { waterContentPercent: 16, wetSampleMassG: 1900 }] });
    expect(result?.result).toBeGreaterThan(0);
    expect(result?.trace.length).toBeGreaterThan(0);
  });

  it("keeps fresh concrete measurements tied to a batch", () => {
    expect(calculateFreshConcreteTemperature({ measuredTemperatureC: 24, batchId: "B-001" }).temperatureC).toBe(24);
    expect(calculateFreshConcreteSlump({ slumpMm: 120, targetSlumpMm: 100, batchId: "B-001" }).deviationMm).toBe(20);
  });

  it("does not invent an acceptance decision without an active profile", () => {
    expect(evaluateAcceptance(120, undefined).decision).toBe("NEEDS_REVIEW");
    expect(evaluateAcceptance(120, { id: "P-1", domainId: "fresh_concrete", testDefinitionId: "FC_SLUMP", standardId: "SPEC-1", parameter: "slumpMm", operator: "target_with_tolerance", unit: "mm", targetValue: 120, tolerance: 20, appliesWhen: {}, sourceDocumentId: "DOC-1", status: "Active" }).decision).toBe("PASS");
  });
});
