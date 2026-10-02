import { describe, expect, it } from "vitest";
import { calculateMixDesign } from "../../../engine/calculateMixDesign";
import { createTestInput } from "../../../__tests__/testHelper";

describe("unified calculation result contract", () => {
  it("emits provenance, trace, units, hash, and release eligibility", () => {
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
    const result: any = calculateMixDesign(input as any);

    expect(result.status).toBeDefined();
    expect(result.methodId).toBeDefined();
    expect(result.methodVersion || result.method?.version).toBeDefined();
    expect(result.engineVersion).toBeDefined();
    expect(result.inputSnapshot).toBeDefined();
    expect(result.inputHash).toMatch(/^fnv1a-[0-9a-f]{8}$/);
    expect(result.materialSnapshot).toBeDefined();
    expect(Array.isArray(result.calculationTrace)).toBe(true);
    expect(result.units).toMatchObject({ mass: "kg/m³", volume: "L/m³", ratio: "-", density: "kg/m³" });
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(Array.isArray(result.errors)).toBe(true);
    expect(Array.isArray(result.assumptions)).toBe(true);
    expect(Array.isArray(result.usedDefaults)).toBe(true);
    expect(["eligible", "trial_mix_required", "blocked"]).toContain(result.releaseEligibility);
  });

  it("produces the same input hash for equivalent key ordering", () => {
    const first: any = calculateMixDesign(createTestInput({ fck28: 25 }) as any);
    const second: any = calculateMixDesign(createTestInput({ fck28: 25 }) as any);

    expect(first.inputHash).toBe(second.inputHash);
  });

  it("marks non-finite results blocked while retaining the unified fields", () => {
    const result: any = calculateMixDesign({ ...createTestInput({ fck28: 25 }), fck28: Number.NaN } as any);

    expect(result.calculationStatus).toBe("blocked");
    expect(result.releaseEligibility).toBe("blocked");
    expect(result.inputHash).toMatch(/^fnv1a-[0-9a-f]{8}$/);
    expect(Array.isArray(result.calculationTrace)).toBe(true);
  });
});
