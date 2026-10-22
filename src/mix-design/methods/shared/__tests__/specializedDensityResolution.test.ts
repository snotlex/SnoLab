import { describe, expect, it } from "vitest";
import { resolveSpecializedMaterials } from "../specializedMixDesignUtils";

function input(overrides: Record<string, unknown> = {}) {
  return {
    selectedCementId: "cement-1",
    selectedSandId: "sand-1",
    selectedGravelId: "gravel-1",
    selectedWaterId: "water-1",
    cementDensity: 3100,
    materialsDatabase: [
      { id: "cement-1", category: "CEMENT", name: "CEM I 42.5", density: 3100 },
      { id: "sand-1", category: "AGGREGATE", name: "Test sand" },
      { id: "gravel-1", category: "AGGREGATE", name: "Test gravel" },
      { id: "water-1", category: "WATER", name: "Water", density: 1000 }
    ],
    ...overrides
  } as any;
}

describe("specialized material density resolution", () => {
  it("reports missing sand and gravel density when their fallback values are not finite", () => {
    const resolved = resolveSpecializedMaterials(input(), "en");

    expect(resolved.errors).toContain("Required material not found: sand density / كثافة sand.");
    expect(resolved.errors).toContain("Required material not found: gravel density / كثافة gravel.");
  });

  it("accepts explicit positive relative-density fallbacks when provided", () => {
    const resolved = resolveSpecializedMaterials(input({
      sandRelativeDensity: 2.65,
      gravelRelativeDensity: 2.68
    }), "en");

    expect(resolved.errors.some((error) => /sand density|gravel density/.test(error))).toBe(false);
  });

  it("does not accept zero, negative, or infinite fallback densities", () => {
    const cases = [
      { sandRelativeDensity: 0, gravelRelativeDensity: -2.68 },
      { sandRelativeDensity: Number.POSITIVE_INFINITY, gravelRelativeDensity: Number.NaN }
    ];

    for (const fallback of cases) {
      const resolved = resolveSpecializedMaterials(input(fallback), "en");
      expect(resolved.errors.some((error) => /sand density/.test(error))).toBe(true);
      expect(resolved.errors.some((error) => /gravel density/.test(error))).toBe(true);
    }
  });
});
