import { describe, expect, it } from "vitest";
import { executeLaboratoryTest, MASTER_TEST_CATALOG } from "../services/materialsLabEngine";
import {
  AGGREGATE_CLAY_LUMPS_DEFINITION,
  AGGREGATE_CRUSHING_VALUE_DEFINITION,
  AGGREGATE_ELONGATION_INDEX_DEFINITION,
  AGGREGATE_IMPACT_VALUE_DEFINITION,
  CEMENT_FALSE_SET_DEFINITION,
  CEMENT_SPECIFIC_GRAVITY_DEFINITION
} from "../services/laboratoryTestDefinitions";
import { executeDefinedLaboratoryTest } from "../services/laboratoryTestEngine";
import type { EngineeringMaterial } from "../types";

const water = {
  id: "MAT-WATER-DIAGNOSTIC",
  name: "Mixing water",
  type: "water",
  category: "ماء",
  materialType: "ماء",
  quality: "standard",
  uses: "test",
  desc: "test fixture",
  rating: 3,
  provenance: "test",
  status: "نشط"
} as unknown as EngineeringMaterial;

describe("water laboratory results remain diagnostic without configured method and limits", () => {
  it.each([
    ["WATER_PH", { measuredPh: 7.4 }],
    ["WATER_CHLORIDES", { chloridesMgPerL: 210, concreteApplication: "reinforced" }],
    ["WATER_SULFATES", { sulfatesMgPerL: 420 }],
    ["WATER_TDS_IMPURITIES", { totalDissolvedSolidsMgPerL: 2500, suspendedSolidsMgPerL: 2200 }]
  ])("does not issue acceptance for %s", (testId, inputs) => {
    const result = executeLaboratoryTest(testId, inputs, water);
    expect(result.status).toBe("WARNING");
    expect(result.complianceDetails.length).toBeGreaterThan(0);
    expect(result.complianceDetails.every(detail => detail.status === "WARNING")).toBe(true);
  });
});

describe("audited standard references remain explicitly unapproved", () => {
  it("uses an appropriate candidate or an explicit method-selection placeholder", () => {
    const legacyCementDensity = MASTER_TEST_CATALOG.find(test => test.id === "CEM_SPECIFIC_GRAVITY");
    expect(legacyCementDensity?.standard).toContain("ASTM C188");
    expect(legacyCementDensity?.standard).not.toContain("EN 196-6");
    expect(CEMENT_SPECIFIC_GRAVITY_DEFINITION.standard).toMatchObject({ organization: "ASTM", code: "C188", status: "Draft" });
    expect(AGGREGATE_CLAY_LUMPS_DEFINITION.standard).toMatchObject({ organization: "ASTM", code: "C142/C142M", status: "Draft" });
    expect(AGGREGATE_CRUSHING_VALUE_DEFINITION.standard).toMatchObject({ organization: "Other", code: "ACV_METHOD_SELECTION_REQUIRED", status: "Draft" });
    expect(AGGREGATE_IMPACT_VALUE_DEFINITION.standard).toMatchObject({ organization: "Other", code: "AIV_METHOD_SELECTION_REQUIRED", status: "Draft" });
    expect(AGGREGATE_ELONGATION_INDEX_DEFINITION.standard).toMatchObject({ organization: "Other", code: "ELONGATION_METHOD_SELECTION_REQUIRED", status: "Draft" });
    expect(CEMENT_FALSE_SET_DEFINITION.standard).toMatchObject({ organization: "Other", code: "FALSE_SET_METHOD_REVIEW_REQUIRED", status: "Draft" });
  });

  it("blocks official runs while the audited candidate method is still Draft", () => {
    const run = executeDefinedLaboratoryTest(AGGREGATE_CLAY_LUMPS_DEFINITION, {
      runId: "RUN-CLAY-LUMPS-DRAFT",
      materialId: "MAT-AGGREGATE-1",
      sampleId: "SAMPLE-AGGREGATE-1",
      operator: "lab-tech",
      rawData: { drySampleMassG: 100, clayLumpsMassG: 5 },
      official: true,
      now: "2026-10-23T00:00:00.000Z"
    });
    expect(run.status).toBe("Blocked");
    expect(run.result).toBeUndefined();
    expect(run.validation.issues.map(issue => issue.code)).toContain("STANDARD_STATUS_DRAFT");
  });
});
