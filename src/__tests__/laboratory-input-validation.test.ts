import { describe, expect, it } from "vitest";
import { executeLaboratoryTest, MASTER_TEST_CATALOG, syncTestToMaterial } from "../services/materialsLabEngine";
import { applyTestToMaterial, extractPropertiesFromTest } from "../services/materialLabSync";
import { createBlankLaboratoryInputs, getLaboratoryFieldLabel, localizeLaboratoryIssue, validateLaboratoryInputs } from "../services/laboratoryInputValidation";
import { validateTestMaterialCompatibility } from "../services/laboratoryMaterialCompatibility";
import type { MaterialTestRecord } from "../types/laboratoryTypes";

const definition = (id: string) => {
  const found = MASTER_TEST_CATALOG.find(item => item.id === id);
  if (!found) throw new Error(`Missing catalog definition: ${id}`);
  return found;
};

const collectNumbers = (value: any, path = ""): Array<[string, any]> => {
  if (Array.isArray(value)) return value.flatMap((item, index) => collectNumbers(item, `${path}.${index}`));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([key, item]) => collectNumbers(item, path ? `${path}.${key}` : key));
  return typeof value === "number" ? [[path, value]] : [];
};
const collectFieldKeys = (value: any, keys = new Set<string>()): Set<string> => {
  if (Array.isArray(value)) value.forEach(item => collectFieldKeys(item, keys));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, item]) => { keys.add(key); collectFieldKeys(item, keys); });
  return keys;
};

describe("laboratory input safety and blank measurement templates", () => {
  it("removes all example measurements from every catalog test while retaining sieve apertures", () => {
    expect(MASTER_TEST_CATALOG).toHaveLength(28);
    for (const test of MASTER_TEST_CATALOG) {
      const blank = createBlankLaboratoryInputs(test);
      for (const [path] of collectNumbers(test.defaultInputs)) {
        if (/^sieves\.\d+\.sieve$/.test(path)) continue;
        const targetPath = path.split(".").reduce<any>((current, part) => current?.[part], blank);
        expect(targetPath, `${test.id} ${path}`).toBeUndefined();
      }
    }
    const sieveInputs = createBlankLaboratoryInputs(definition("AGG_SIEVE"));
    expect(sieveInputs.sieves[0].sieve).toBe(5);
    expect(sieveInputs.sieves[0].retained).toBeUndefined();
  });

  it("distinguishes a measured zero from a missing field", () => {
    const def = definition("AGG_SIEVE");
    const inputs = createBlankLaboratoryInputs(def);
    inputs.totalWeight = 1000;
    inputs.sieves = inputs.sieves.map((row: any) => ({ ...row, retained: 0 }));
    expect(validateLaboratoryInputs(def.id, def, inputs).some(issue => issue.code === "required")).toBe(false);
    inputs.sieves[0].retained = undefined;
    expect(validateLaboratoryInputs(def.id, def, inputs).some(issue => issue.path === "sieves.0.retained" && issue.code === "required")).toBe(true);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])("rejects non-finite values (%s)", value => {
    const def = definition("AGG_SIEVE");
    const inputs = createBlankLaboratoryInputs(def);
    inputs.totalWeight = value;
    inputs.sieves = inputs.sieves.map((row: any) => ({ ...row, retained: 0 }));
    expect(validateLaboratoryInputs(def.id, def, inputs).some(issue => issue.path === "totalWeight" && issue.code === "not_finite")).toBe(true);
  });

  it("accepts decimal-comma text and rejects negative masses", () => {
    const def = definition("AGG_SIEVE");
    const inputs = createBlankLaboratoryInputs(def);
    inputs.totalWeight = "1000,5";
    inputs.sieves = inputs.sieves.map((row: any) => ({ ...row, retained: 0 }));
    expect(validateLaboratoryInputs(def.id, def, inputs).some(issue => issue.path === "totalWeight")).toBe(false);
    inputs.totalWeight = 1000;
    inputs.sieves[0].retained = -1;
    expect(validateLaboratoryInputs(def.id, def, inputs).some(issue => issue.path === "sieves.0.retained" && issue.code === "below_minimum")).toBe(true);
  });

  it("rejects contradictory bulk density, moisture, and water-volume relationships", () => {
    const bulk = definition("AGG_BULK_DENSITY");
    const bulkInputs = { containerVolumeLiters: 10, containerEmptyWeightKg: 3, looseFilledWeightKg: 2, compactedWeightKg: 4 };
    expect(validateLaboratoryInputs(bulk.id, bulk, bulkInputs).some(issue => issue.path === "looseFilledWeightKg" && issue.code === "relationship")).toBe(true);

    const moisture = definition("AGG_MOISTURE_CONTENT");
    const moistureInputs = { wetMassG: 90, dryMassG: 100, tareMassG: 10 };
    expect(validateLaboratoryInputs(moisture.id, moisture, moistureInputs).some(issue => issue.path === "wetMassG" && issue.code === "relationship")).toBe(true);

    const micro = definition("AGG_MICRO_DEVAL");
    const microInputs = { initialMassG: 500, retainedMassOn1_6mmG: 400, gradingFraction: "10/14" };
    expect(validateLaboratoryInputs(micro.id, micro, microInputs).some(issue => issue.path === "waterVolumeMl" && issue.code === "required")).toBe(true);
  });

  it("rejects repeated and unordered time readings", () => {
    const def = definition("CEM_SETTING_TIME");
    const inputs = createBlankLaboratoryInputs(def);
    inputs.waterPercent = 27;
    inputs.roomTempC = 20;
    inputs.humidityPercent = 80;
    inputs.timeReadings = [
      { timeMinutes: 60, penetrationMm: 35 },
      { timeMinutes: 60, penetrationMm: 25 },
      { timeMinutes: 30, penetrationMm: 5 },
      ...inputs.timeReadings.slice(3)
    ];
    const issues = validateLaboratoryInputs(def.id, def, inputs);
    expect(issues.some(issue => issue.code === "duplicate")).toBe(true);
    expect(issues.some(issue => issue.code === "order")).toBe(true);
  });
});

describe("localized laboratory validation messages", () => {
  const requiredIssue = { path: "totalWeight", code: "required" as const, message: "A measured value is required." };

  it("uses Arabic, French, and English field labels", () => {
    expect(getLaboratoryFieldLabel("totalWeight", "ar")).toBe("وزن العينة الكلي");
    expect(getLaboratoryFieldLabel("totalWeight", "fr")).toBe("Masse totale de l'échantillon");
    expect(getLaboratoryFieldLabel("totalWeight", "en")).toBe("Total sample mass");
  });

  it("keeps French and English validation errors free of Arabic text", () => {
    const french = localizeLaboratoryIssue(requiredIssue, "fr");
    const english = localizeLaboratoryIssue(requiredIssue, "en");
    expect(french).toContain("est requis");
    expect(english).toContain("is required");
    expect(/[\u0600-\u06FF]/.test(french)).toBe(false);
    expect(/[\u0600-\u06FF]/.test(english)).toBe(false);
  });

  it("provides French and English labels for every field in the current catalog", () => {
    const keys = new Set<string>();
    MASTER_TEST_CATALOG.forEach(test => collectFieldKeys(test.defaultInputs, keys));
    for (const language of ["fr", "en"] as const) {
      for (const key of keys) expect(getLaboratoryFieldLabel(key, language), `${language}: ${key}`).not.toBe(key);
    }
    expect(getLaboratoryFieldLabel("sieves[].sieve", "fr")).not.toBe("sieves[].sieve");
    expect(getLaboratoryFieldLabel("timeReadings[].penetrationMm", "en")).not.toBe("timeReadings[].penetrationMm");
  });
});

describe("material sync safety", () => {
  const record = (status: MaterialTestRecord["status"]): MaterialTestRecord => ({
    id: "test-1", testType: "AGG_SIEVE", testTitleAr: "غربلة", testTitleFr: "Tamisage", testTitleEn: "Sieve", category: "aggregates",
    materialId: "m1", materialName: "Sand", materialCategory: "رمال", sampleId: "s1", operator: "Tech", laboratoryName: "Lab", date: "2026-01-01", standard: "EN 933-1",
    inputs: {}, results: {}, status, score: 0, interpretation: "", complianceDetails: [], createdAt: "2026-01-01", updatedAt: "2026-01-01"
  });

  it("never changes material metadata or properties for a failed test", () => {
    const material: any = { id: "m1", name: "Sand", finenessModulus: 2.4, metadata: { keep: true } };
    expect(syncTestToMaterial(material, record("FAIL"), { finenessModulus: 2.8, dMax: 4 })).toBe(material);
    expect(material.finenessModulus).toBe(2.4);
    expect(material.metadata).toEqual({ keep: true });
  });

  it("applies only actual finite properties after explicit validation without approving the material", () => {
    const metadata = { keep: true };
    const material: any = { id: "m1", finenessModulus: 2.4, dMax: 8, metadata, isApproved: false, approvalStatus: "Pending Review" };
    expect(syncTestToMaterial(material, record("PASS"), { finenessModulus: 2.8 })).toBe(material);
    expect(syncTestToMaterial(material, record("DRAFT"), { finenessModulus: 2.8 })).toBe(material);
    const validatedRecord = { ...record("PASS"), approvalStatus: "Validated" as const };
    const updated: any = syncTestToMaterial(material, validatedRecord, { finenessModulus: 2.8, dMax: undefined, finesContent: Number.NaN });
    expect(updated.finenessModulus).toBe(2.8);
    expect(updated.dMax).toBe(8);
    expect(updated.finesContent).toBeUndefined();
    expect(material.finenessModulus).toBe(2.4);
    expect(updated.isApproved).toBe(false);
    expect(updated.approvalStatus).toBe("Pending Review");
    expect(updated.metadata).not.toBe(metadata);
    expect(metadata).toEqual({ keep: true });
    expect(updated.metadata.lastLabTestId).toBe(validatedRecord.id);
  });

  it("does not alter another library material", () => {
    const target: any = { id: "m1", name: "Sand", finenessModulus: 2.4 };
    const other: any = { id: "m2", name: "Cement", specificGravity: 3.15 };
    const snapshot = structuredClone(other);
    syncTestToMaterial(target, record("PASS"), { finenessModulus: 2.8 });
    expect(other).toEqual(snapshot);
  });

  it("requires explicit validation in the history sync service and never applies failed tests", () => {
    const material: any = { id: "m1", name: "Sand", finenessModulus: 2.4 };
    const pending = { ...record("PASS"), results: { finenessModulus: 2.8 } };
    const pendingResult = applyTestToMaterial(material, pending);
    expect(pendingResult.updatedMaterial).toBe(material);
    expect(pendingResult.appliedProperties).toEqual([]);
    const failed = { ...pending, status: "FAIL" as const, approvalStatus: "Validated" as const };
    expect(applyTestToMaterial(material, failed).updatedMaterial).toBe(material);
    const validated = { ...pending, approvalStatus: "Validated" as const };
    const validatedResult = applyTestToMaterial(material, validated);
    expect(validatedResult.updatedMaterial.finenessModulus).toBe(2.8);
    expect(validatedResult.isAppliedToActiveProps).toBe(true);
  });

  it("does not derive sieve grading from an invented total weight or zero retained mass", () => {
    const incompleteRecord = {
      ...record("PASS"),
      inputs: { totalWeight: undefined, sieves: [{ sieve: 5, retained: undefined }] },
      results: {}
    };
    const extracted = extractPropertiesFromTest(incompleteRecord);
    expect(extracted.gradationData).toBeUndefined();
    expect(extracted.sieveAnalysisDetail).toBeUndefined();
  });
});

describe("catalog execution coverage", () => {
  it("validates and executes all 28 current tests with compatible materials", () => {
    expect(MASTER_TEST_CATALOG).toHaveLength(28);
    for (const test of MASTER_TEST_CATALOG) {
      const category = test.id.startsWith("AGG_")
        ? ["AGG_LOS_ANGELES", "AGG_MICRO_DEVAL", "AGG_SHAPE_FLAKINESS"].includes(test.id) ? "حصى" : "رمال"
        : test.id.startsWith("CEM_") ? "إسمنت"
          : test.id.startsWith("WATER_") ? "ماء"
            : test.id.startsWith("ADM_") ? "إضافات كيميائية"
              : test.id.startsWith("SCM_") ? "إضافات معدنية" : "ألياف";
      const material: any = { id: `material-${test.id}`, name: "Compatible fixture", category, type: category === "رمال" ? "sand" : category === "حصى" ? "gravel" : category };
      const inputs = structuredClone(test.defaultInputs);
      if (test.id === "AGG_MICRO_DEVAL") inputs.waterVolumeMl = 10000;
      expect(validateTestMaterialCompatibility(test.id, material).compatible, test.id).toBe(true);
      expect(validateLaboratoryInputs(test.id, test, inputs), test.id).toEqual([]);
      const result = executeLaboratoryTest(test.id, inputs, material);
      expect(result.status, test.id).not.toBe("FAIL");
      expect(Object.keys(result.results).length, test.id).toBeGreaterThan(0);
    }
  });

  it("blocks an incompatible material before execution", () => {
    const test = definition("CEM_SPECIFIC_GRAVITY");
    const incompatible: any = { id: "sand-1", name: "Sand", category: "رمال", type: "sand" };
    expect(validateTestMaterialCompatibility(test.id, incompatible).compatible).toBe(false);
  });
});
