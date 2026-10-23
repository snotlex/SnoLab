import { describe, expect, it } from "vitest";
import type { EngineeringMaterial } from "../types";
import { executeLaboratoryTest } from "./materialsLabEngine";
import { addSessionSample, addSessionTest, addTestReplicate, createLaboratorySession, recordLaboratoryTestResult } from "./laboratorySessionService";

const concrete: EngineeringMaterial = { id: "CONCRETE-001", name: "Fresh concrete batch", category: "CONCRETE", type: "concrete", materialType: "CONCRETE" } as EngineeringMaterial;

describe("fresh concrete execution and session integration", () => {
  it("executes slump with a physical guard and preserves a warning when no acceptance profile is supplied", () => {
    const result = executeLaboratoryTest("FC_SLUMP", { slumpMm: 120, batchId: "B-001" }, concrete);
    expect(result.status).toBe("WARNING");
    expect(result.results.slumpMm).toBe(120);
    expect(result.syncedProperties.slumpMm).toBe(120);
    expect(() => executeLaboratoryTest("FC_SLUMP", { slumpMm: 301, batchId: "B-001" }, concrete)).toThrow("SLUMP_EXCEEDS_CONE_HEIGHT");
  });

  it("executes temperature, creates a traceable session, and records the replicate result", () => {
    const result = executeLaboratoryTest("FC_TEMPERATURE", { measuredTemperatureC: 24, ambientTemperatureC: 21, batchId: "B-002" }, concrete);
    let session = createLaboratorySession({ domainId: "fresh_concrete", requestNumber: "REQ-FC-002", projectId: "P-1" });
    session = addSessionSample(session, { domainId: "fresh_concrete", sampleNumber: "S-002", sampleCode: "S-002-A", materialId: concrete.id, materialName: concrete.name, materialCategory: concrete.category });
    session = addSessionTest(session, { domainId: "fresh_concrete", testType: "FC_TEMPERATURE", testTitleAr: "درجة حرارة الخرسانة الطازجة", testTitleFr: "Température du béton frais", testTitleEn: "Fresh concrete temperature", standard: "FRESH_TEMPERATURE_METHOD", materialId: concrete.id, sampleId: session.samples[0].id, status: "RUNNING", requiredReplicates: 1 });
    const item = session.tests[0];
    session = addTestReplicate(session, item.id, { sampleId: session.samples[0].id, status: "IN_PROGRESS", rawInputs: { measuredTemperatureC: 24, ambientTemperatureC: 21, batchId: "B-002" } });
    session = recordLaboratoryTestResult(session, item.id, session.tests[0].replicates[0].id, { status: result.status, results: result.results, score: result.score, interpretation: result.interpretation }, "operator-1");
    expect(session.domainId).toBe("fresh_concrete");
    expect(session.tests[0].result?.temperatureC).toBe(24);
    expect(session.tests[0].replicates[0].status).toBe("VALID");
    expect(session.auditLog.some(entry => entry.action === "TEST_RESULT_RECORDED")).toBe(true);
  });
});
