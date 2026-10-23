import { describe, expect, it } from "vitest";
import { MASTER_TEST_CATALOG } from "./materialsLabEngine";
import { LABORATORY_DOMAINS } from "./laboratoryDomains";
import { getLaboratoryTestPurpose, LABORATORY_TEST_PURPOSES } from "./laboratoryTestPresentation";
import { OFFICIAL_CONCRETE_TEST_REGISTRY } from "./concreteLaboratoryRegistry";

describe("laboratory test presentation coverage", () => {
  it("has an explicit purpose for every civil and domain catalog test", () => {
    const ids = [
      ...MASTER_TEST_CATALOG.filter(test => !["FC_SLUMP", "FC_TEMPERATURE", "HC_COMPRESSIVE_STRENGTH", "HC_SPLIT_TENSILE"].includes(test.id)).map(test => test.id),
      ...LABORATORY_DOMAINS.filter(domain => domain.id === "geotechnical").flatMap(domain => domain.plannedTests.map(test => test.id)),
      ...OFFICIAL_CONCRETE_TEST_REGISTRY.map(test => test.id),
    ];
    expect(OFFICIAL_CONCRETE_TEST_REGISTRY).toHaveLength(61);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(LABORATORY_TEST_PURPOSES[id] || OFFICIAL_CONCRETE_TEST_REGISTRY.find(test => test.id === id)?.purpose, `${id} is missing a purpose`).toBeDefined();
      for (const language of ["ar", "fr", "en"] as const) {
        expect(getLaboratoryTestPurpose(id, language), `${id}/${language}`).toBeTruthy();
      }
    }
  });
});
