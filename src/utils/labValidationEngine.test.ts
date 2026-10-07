import { describe, expect, it } from "vitest";
import { validateLabResults } from "./labValidationEngine";

const input = {
  slump: 8,
  fck28: 30,
  airContent: 1.5
} as any;

const result = {
  fcm28: 38.5,
  totalFreshDensity: 2400
} as any;

describe("lab validation status separation", () => {
  it("keeps an empty report unevaluated and pending approval", () => {
    const report = validateLabResults(input, result, {} as any, "en");

    expect(report.dataCompleteness).toBe("WAITING_FOR_DATA");
    expect(report.verificationStatus).toBe("NOT_EVALUATED");
    expect(report.approvalStatus).toBe("PENDING_TECHNICAL_REVIEW");
    expect(report.completenessStatus).not.toBe("Fully Validated");
  });

  it("does not turn complete required data into official approval", () => {
    const report = validateLabResults(input, result, {
      slump: 80,
      freshDensity: 2400,
      strength28d: 40,
      waterAbsorption: 2.5
    } as any, "en");

    expect(report.dataCompleteness).toBe("COMPLETE");
    expect(report.completenessStatus).toBe("Complete Data — Review Pending");
    expect(report.verificationStatus).toBe("WITHIN_CONFIGURED_LIMITS");
    expect(report.approvalStatus).toBe("PENDING_TECHNICAL_REVIEW");
    expect(report.statusAr).not.toMatch(/approved|approval/i);
    expect(report.engineeringComments.join(" ")).toMatch(/official approval is not inferred|technical review remains required/i);
  });

  it("separates a failed configured-limit check from approval state", () => {
    const report = validateLabResults(input, result, {
      slump: 80,
      freshDensity: 2400,
      strength28d: 20,
      waterAbsorption: 2.5
    } as any, "en");

    expect(report.dataCompleteness).toBe("COMPLETE");
    expect(report.verificationStatus).toBe("OUTSIDE_CONFIGURED_LIMITS");
    expect(report.approvalStatus).toBe("PENDING_TECHNICAL_REVIEW");
  });
});
