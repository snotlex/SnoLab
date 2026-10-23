import { describe, expect, it } from "vitest";
import { calculateAtterberg, calculateCbr, calculateSoilSieve, validateCbrInput, validateProctorInput, validateSoilSieveInput } from "./geotechnicalTestEngine";
import { calculateFreshConcreteSlump, calculateFreshConcreteTemperature, validateFreshConcreteSlumpInput } from "./freshConcreteTestEngine";
import { CONCRETE_DOMAIN_TEST_DEFINITIONS, DOMAIN_LABORATORY_TEST_DEFINITIONS, GT_ATTERBERG_DEFINITION, GT_CBR_DEFINITION, GT_PROCTOR_DEFINITION } from "./domainLaboratoryTestDefinitions";
import { evaluateAcceptance } from "./laboratoryAcceptanceEngine";

describe("domain laboratory diagnostic engines", () => {
  it("keeps the concrete and geotechnical domain definitions distinct and uniquely registered", () => {
    expect(CONCRETE_DOMAIN_TEST_DEFINITIONS.map(definition => definition.id)).toEqual([
      "FC_SLUMP",
      "FC_TEMPERATURE",
      "HC_COMPRESSIVE_STRENGTH",
      "HC_SPLIT_TENSILE"
    ]);
    expect(DOMAIN_LABORATORY_TEST_DEFINITIONS.filter(definition => definition.domainId === "geotechnical").map(definition => definition.id).sort()).toEqual(["GT_ATTERBERG", "GT_CBR", "GT_PROCTOR", "GT_SIEVE_SOIL"]);
    expect(new Set(DOMAIN_LABORATORY_TEST_DEFINITIONS.map(definition => definition.id)).size).toBe(DOMAIN_LABORATORY_TEST_DEFINITIONS.length);
  });

  it("calculates soil passing percentages and exposes mass-balance error", () => {
    const result = calculateSoilSieve({ totalSampleMassG: 1000, rows: [{ sieveMm: 2, retainedMassG: 200 }, { sieveMm: 0.063, retainedMassG: 700 }, { sieveMm: 0, retainedMassG: 100 }] });
    expect(result.rows[0].percentPassing).toBe(80);
    expect(result.finesPercent).toBe(10);
    expect(result.massBalanceErrorG).toBe(0);
  });

  it("requires multiple measured Proctor points", () => {
    expect(validateProctorInput({ moldVolumeCm3: 1000, points: [{ waterContentPercent: 10, wetSampleMassG: 1800 }] }).some(issue => issue.code === "PROCTOR_POINTS_INSUFFICIENT")).toBe(true);
  });

  it("fits the multipoint liquid-limit curve at 25 blows, averages PL trials, and calculates PI", () => {
    const result = calculateAtterberg({ liquidLimitStatus: "measured", liquidLimitPoints: [15, 25, 35].map(blows => ({ blows, waterContentPercent: 60 - 10 * Math.log(blows) })), plasticLimitStatus: "measured", plasticLimitWaterContentsPercent: [19, 21], samplePassing425Micron: true });
    expect(result.liquidLimitPercent).toBeCloseTo(60 - 10 * Math.log(25), 8);
    expect(result.plasticLimitPercent).toBe(20);
    expect(result.plasticityIndex).toBeCloseTo(60 - 10 * Math.log(25) - 20, 8);
    expect(result.plasticityStatus).toBe("PLASTIC");
    expect(GT_ATTERBERG_DEFINITION.calculate({ liquidLimitStatus: "not_determined", liquidLimitPoints: [], plasticLimitStatus: "not_determined", plasticLimitWaterContentsPercent: [], samplePassing425Micron: true }).result).toBe("NP");
  });

  it("calculates separate CBR ratios at exact measured penetrations and rejects missing reference points", () => {
    const input = { referenceMethod: "AASHTO_T193" as const, condition: "soaked" as const, penetrationPoints: [{ penetrationMm: 2.54, loadKN: 1935 * 6.895 / 1000 / 2 }, { penetrationMm: 5.08, loadKN: 1935 * 10.342 / 1000 / 2 }], pistonAreaMm2: 1935, soakDurationHours: 96, swellPercent: 0.4, moldingWaterContentPercent: 12, dryDensityGPerCm3: 1.82 };
    const result = calculateCbr(input);
    expect(result.cbrAt254Percent).toBeCloseTo(50, 8);
    expect(result.cbrAt508Percent).toBeCloseTo(50, 8);
    expect(result.swellPercent).toBe(0.4);
    expect(validateCbrInput({ ...input, penetrationPoints: [{ penetrationMm: 2.54, loadKN: 4 }, { penetrationMm: 4, loadKN: 5 }] }).some(issue => issue.code === "CBR_508MM_POINT_REQUIRED")).toBe(true);
    expect(GT_CBR_DEFINITION.calculate(input).trace).toHaveLength(3);
  });

  it("rejects duplicate Proctor moisture points and impossible sieve mass balance", () => {
    expect(validateProctorInput({ moldVolumeCm3: 1000, points: [{ waterContentPercent: 10, wetSampleMassG: 1800 }, { waterContentPercent: 10, wetSampleMassG: 1850 }, { waterContentPercent: 15, wetSampleMassG: 1900 }] }).some(issue => issue.code === "PROCTOR_DUPLICATE_WATER_CONTENT")).toBe(true);
    expect(validateSoilSieveInput({ totalSampleMassG: 1000, rows: [{ sieveMm: 2, retainedMassG: 700 }, { sieveMm: 1, retainedMassG: 400 }] }).some(issue => issue.code === "SOIL_SIEVE_MASS_BALANCE_EXCEEDS_TOTAL")).toBe(true);
    expect(validateSoilSieveInput({ totalSampleMassG: 1000, rows: [{ sieveMm: 2, retainedMassG: 300 }, { sieveMm: 2, retainedMassG: 200 }] }).some(issue => issue.code === "SOIL_SIEVE_DUPLICATE_APERTURE")).toBe(true);
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

  it("blocks physically impossible fresh concrete temperatures", () => {
    expect(() => calculateFreshConcreteTemperature({ measuredTemperatureC: -1, batchId: "B-001" })).toThrow("FRESH_TEMPERATURE_OUT_OF_RANGE");
    expect(() => calculateFreshConcreteTemperature({ measuredTemperatureC: 101, batchId: "B-001" })).toThrow("FRESH_TEMPERATURE_OUT_OF_RANGE");
  });

  it("blocks slump values above the standard cone height", () => {
    expect(validateFreshConcreteSlumpInput({ slumpMm: 301, batchId: "B-001" }).some(issue => issue.code === "SLUMP_EXCEEDS_CONE_HEIGHT")).toBe(true);
  });

  it("does not invent an acceptance decision without an active profile", () => {
    expect(evaluateAcceptance(120, undefined).decision).toBe("NEEDS_REVIEW");
    expect(evaluateAcceptance(120, { id: "P-1", domainId: "fresh_concrete", testDefinitionId: "FC_SLUMP", standardId: "SPEC-1", parameter: "slumpMm", operator: "target_with_tolerance", unit: "mm", targetValue: 120, tolerance: 20, appliesWhen: {}, sourceDocumentId: "DOC-1", status: "Active" }).decision).toBe("PASS");
  });
});
