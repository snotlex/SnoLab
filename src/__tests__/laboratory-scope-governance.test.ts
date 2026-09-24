import { describe, expect, it } from "vitest";
import { MASTER_TEST_CATALOG } from "../services/materialsLabEngine";
import {
  BOUNDARY_PLACEMENT_RULES,
  CONCRETE_LAB_SECTIONS,
  LABORATORY_SCOPE_VERSION,
  MATERIALS_LAB_SECTIONS,
  assertCatalogTestScope,
  getCatalogTestArea
} from "../services/laboratoryScopeGovernance";

describe("Laboratory scope governance", () => {
  it("defines separate materials and concrete lab hierarchies", () => {
    expect(MATERIALS_LAB_SECTIONS.length).toBeGreaterThanOrEqual(20);
    expect(CONCRETE_LAB_SECTIONS.map(section => section.id)).toEqual([
      "freshConcrete", "scc", "hardenedConcrete", "deformation", "durability", "specialConcrete", "inSituNdt"
    ]);
    expect(new Set(MATERIALS_LAB_SECTIONS.map(section => section.id)).size).toBe(MATERIALS_LAB_SECTIONS.length);
    expect(new Set(CONCRETE_LAB_SECTIONS.map(section => section.id)).size).toBe(CONCRETE_LAB_SECTIONS.length);
  });

  it("keeps every existing Materials Lab catalog test in the materials area", () => {
    expect(MASTER_TEST_CATALOG.length).toBeGreaterThan(0);
    for (const definition of MASTER_TEST_CATALOG) {
      expect(getCatalogTestArea(definition)).toBe("materials");
      expect(() => assertCatalogTestScope(definition, "materials")).not.toThrow();
    }
  });

  it("preserves boundary placement rules", () => {
    expect(BOUNDARY_PLACEMENT_RULES.find(rule => rule.test === "Cement mortar compressive strength")?.area).toBe("materials");
    expect(BOUNDARY_PLACEMENT_RULES.find(rule => rule.test === "Slump")?.section).toBe("freshConcrete");
    expect(BOUNDARY_PLACEMENT_RULES.find(rule => rule.test === "UPV")?.section).toBe("inSituNdt");
    expect(() => assertCatalogTestScope({ id: "SLUMP", category: "concrete" }, "materials")).toThrow(/Unknown laboratory category/);
    expect(LABORATORY_SCOPE_VERSION).toBe("2026.09-materials-concrete-boundary-v1");
  });
});
