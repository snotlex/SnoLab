import { describe, expect, it } from "vitest";
import { SAND_EQUIVALENT_DEFINITION } from "../services/laboratoryTestDefinitions";
import { compareIndependentResults, convertUnit, verifyLaboratoryCalculation } from "../services/laboratoryVerification";
import { executeDefinedLaboratoryTest } from "../services/laboratoryTestEngine";

describe("Independent laboratory verification", () => {
  it("compares independent numeric results with an explicit tolerance", () => {
    expect(compareIndependentResults(23.4, 23.4000000001, 1e-6).status).toBe("VERIFIED");
    expect(compareIndependentResults(23.4, 23.6, 1e-6).status).toBe("INCORRECT");
  });
  it("performs explicit unit conversions without accepting non-finite values", () => {
    expect(convertUnit(1500, "g↔kg")).toBe(1.5);
    expect(convertUnit(2.4, "g/cm³↔kg/m³")).toBe(2400);
    expect(() => convertUnit(Number.NaN, "g↔kg")).toThrow();
  });
  it("rejects incomplete input and missing independent verification", () => {
    const result = verifyLaboratoryCalculation(
      SAND_EQUIVALENT_DEFINITION,
      { totalHeightMm: 100 } as never,
      { result: 80, unit: "%" },
      []
    );
    expect(result.status).toBe("INCOMPLETE");
    expect(result.issues.some(issue => issue.code === "REQUIRED_INPUT_MISSING")).toBe(true);
  });
  it("accepts a traceable result only when the independent result agrees", () => {
    const data = { totalHeightMm: 100, sandHeightMm: 80, method: "piston" as const };
    const result = verifyLaboratoryCalculation(
      SAND_EQUIVALENT_DEFINITION,
      data,
      { result: 80, unit: "%" },
      [{ stepNumber: 1, label: "Sand equivalent", formula: "sand height / total height × 100", substitution: "80 / 100 × 100", result: 80, unit: "%", inputs: data }],
      { independentCalculate: input => ({ result: (Number(input.sandHeightMm) / Number(input.totalHeightMm)) * 100, unit: "%" }) }
    );
    expect(result.status).toBe("VERIFIED");
    expect(result.absoluteDifference).toBe(0);
  });
  it("marks governed results for review when no independent calculator is registered", () => {
    const run = executeDefinedLaboratoryTest(SAND_EQUIVALENT_DEFINITION, {
      runId: "RUN-AUDIT-1", materialId: "MAT-1", sampleId: "S-1", operator: "lab",
      rawData: { totalHeightMm: 100, sandHeightMm: 80, method: "piston" }
    });
    expect(run.status).toBe("Warning");
    expect(run.verificationStatus).toBe("NEEDS_REVIEW");
    expect(run.verificationIssues?.some(issue => issue.code === "INDEPENDENT_VERIFIER_MISSING")).toBe(true);
  });
});
