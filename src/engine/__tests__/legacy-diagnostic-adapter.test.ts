import { describe, expect, it } from "vitest";
import { calculateDreuxGorisse } from "../../utils";
import { validateCalculationLogic } from "../validationGate";
import { createTestInput } from "../../__tests__/testHelper";

describe("legacy diagnostic adapter boundary", () => {
  it("marks legacy output as diagnostic-only and blocks the report gate", () => {
    const input = createTestInput({
      fck28: 25,
      cementDensity: 3105,
      sandRelativeDensity: 2.65,
      gravelRelativeDensity: 2.68,
      moistureSand: 2,
      moistureGravel: 0.5,
      sandAbsorption: 1.5,
      gravelAbsorption: 0.8,
    });
    const result = calculateDreuxGorisse(input);
    const gate = validateCalculationLogic(input, result, "en");

    expect((result as any).legacyDiagnosticOnly).toBe(true);
    expect((result as any).diagnosticReasonCode).toBe("LEGACY_DIAGNOSTIC_ADAPTER");
    expect((result as any).releaseEligibility).toBe("blocked");
    expect(gate.isValidForReport).toBe(false);
    expect(gate.criticalErrors).toContain("legacy_diagnostic_only");
  });
});
