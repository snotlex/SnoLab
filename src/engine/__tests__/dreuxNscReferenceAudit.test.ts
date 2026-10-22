import { describe, expect, it } from "vitest";
import { calculateDreuxGorisse } from "../../utils";
import { createTestInput } from "../../__tests__/testHelper";

/**
 * Audit characterization only — not an engineering acceptance test.
 *
 * University of Tlemcen Dreux-Gorisse worksheet, PDF page P5:
 * C/E = 1.9 and slump = 8 cm -> Copt = 385 kg/m3.
 * https://elearn.univ-tlemcen.dz/pluginfile.php/270030/mod_resource/content/1/formulation-des-betons-methode-de-dreux-gorisse.pdf
 *
 * With Dmax=20, SnoLab's current water table gives 200 L/m3 and, using the
 * explicit same W/C (= 1/1.9) and no admixture water reduction, the present
 * implementation returns 380 kg/m3. The observed 5 kg/m3 shortfall is tracked
 * as an open method-sequence discrepancy: the classical source requires
 * selecting Copt from the C/E-slump abacus and retaining C >= Copt.
 *
 * Keep this test as a characterization until the governing method edition and
 * the Copt calculation are formally reconciled. Do not interpret it as proof
 * that the current engine is engineering-verified.
 */
describe("Dreux-Gorisse NSC — source reference audit characterization", () => {
  it("reproduces the known Copt comparison case without silently hiding the difference", () => {
    const cementWaterRatio = 1.9;
    const publishedCoptKgM3 = 385;

    const input = createTestInput({
      fck28: 25,
      dMax: 20,
      slump: 8,
      aggregateType: "concasse" as any,
      aggregateQuality: "standard" as any,
      dosageSuper: 0,
      useManualWcOverride: true,
      internalWcOverride: 1 / cementWaterRatio,
      exposureClass: "X0",
      moistureSand: 0,
      moistureGravel: 0
    });

    const result = calculateDreuxGorisse(input);

    // Implementation arithmetic: water=200 L/m3, W/C=1/1.9 => cement=380 kg/m3.
    expect(result.cementWeight).toBeCloseTo(380, 5);
    expect(result.wcRatioAdjusted).toBeCloseTo(1 / cementWaterRatio, 5);

    // The reference discrepancy is intentionally explicit, not a conformance pass.
    expect(Math.abs(publishedCoptKgM3 - result.cementWeight)).toBeCloseTo(5, 5);
    expect(result.cementWeight).toBeLessThan(publishedCoptKgM3);
  });
});
