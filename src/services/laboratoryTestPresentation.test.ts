import { describe, expect, it } from "vitest";
import { MASTER_TEST_CATALOG } from "./materialsLabEngine";
import { LABORATORY_DOMAINS } from "./laboratoryDomains";
import { getLaboratoryTestPurpose, LABORATORY_TEST_PURPOSES } from "./laboratoryTestPresentation";

describe("laboratory test presentation coverage", () => {
  it("has an explicit purpose for every civil and domain catalog test", () => {
    const ids = [
      ...MASTER_TEST_CATALOG.map(test => test.id),
      ...LABORATORY_DOMAINS.flatMap(domain => domain.plannedTests.map(test => test.id)),
    ];
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(LABORATORY_TEST_PURPOSES[id], `${id} is missing a purpose`).toBeDefined();
      for (const language of ["ar", "fr", "en"] as const) {
        expect(getLaboratoryTestPurpose(id, language), `${id}/${language}`).toBeTruthy();
      }
    }
  });
});
