import { describe, expect, it } from "vitest";
import type { EngineeringMaterial } from "../types";
import { executeLaboratoryTest } from "./materialsLabEngine";
import { addSessionSample, addSessionTest, addTestReplicate, createLaboratorySession, recordLaboratoryTestResult } from "./laboratorySessionService";

const concrete: EngineeringMaterial = { id: "HARDENED-001", name: "Hardened concrete specimen", category: "CONCRETE", type: "concrete", materialType: "CONCRETE" } as EngineeringMaterial;

function buildSession(testType: "HC_COMPRESSIVE_STRENGTH" | "HC_SPLIT_TENSILE") {
  let session = createLaboratorySession({ domainId: "hardened_concrete", requestNumber: `REQ-${testType}`, projectId: "P-1" });
  session = addSessionSample(session, { domainId: "hardened_concrete", sampleNumber: "S-H-001", sampleCode: "S-H-001-A", materialId: concrete.id, materialName: concrete.name, materialCategory: concrete.category });
  session = addSessionTest(session, { domainId: "hardened_concrete", testType, testTitleAr: testType === "HC_COMPRESSIVE_STRENGTH" ? "مقاومة الضغط" : "مقاومة الشد بالانشطار", testTitleFr: testType, testTitleEn: testType, standard: testType === "HC_COMPRESSIVE_STRENGTH" ? "EN 12390-3" : "EN 12390-6", materialId: concrete.id, sampleId: session.samples[0].id, status: "RUNNING", requiredReplicates: 1 });
  session = addTestReplicate(session, session.tests[0].id, { sampleId: session.samples[0].id, status: "IN_PROGRESS", rawInputs: {} });
  return session;
}

describe("hardened concrete execution and session integration", () => {
  it("calculates compression and applies a supplied minimum target", () => {
    const pass = executeLaboratoryTest("HC_COMPRESSIVE_STRENGTH", { failureLoadKN: 720, loadedAreaMm2: 22500, ageDays: 28, targetStrengthMpa: 30, specimenId: "C-001", batchId: "B-H-001" }, concrete);
    expect(pass.results.compressiveStrengthMpa).toBe(32);
    expect(pass.status).toBe("PASS");
    expect(() => executeLaboratoryTest("HC_COMPRESSIVE_STRENGTH", { failureLoadKN: -1, loadedAreaMm2: 22500, ageDays: 28, specimenId: "C-001", batchId: "B-H-001" }, concrete)).toThrow("COMPRESSIVE_LOAD_INVALID");
  });

  it("calculates splitting tensile strength and records it in the hardened session", () => {
    const result = executeLaboratoryTest("HC_SPLIT_TENSILE", { failureLoadKN: 176.714, cylinderDiameterMm: 150, cylinderLengthMm: 300, ageDays: 28, targetStrengthMpa: 2.4, specimenId: "T-001", batchId: "B-H-002" }, concrete);
    expect(result.results.splitTensileStrengthMpa).toBeCloseTo(2.5, 2);
    expect(result.status).toBe("PASS");
    let session = buildSession("HC_SPLIT_TENSILE");
    session = recordLaboratoryTestResult(session, session.tests[0].id, session.tests[0].replicates[0].id, { status: result.status, results: result.results, score: result.score, interpretation: result.interpretation }, "operator-1");
    expect(session.domainId).toBe("hardened_concrete");
    expect(session.tests[0].result?.splitTensileStrengthMpa).toBeCloseTo(2.5, 2);
    expect(session.tests[0].replicates[0].status).toBe("VALID");
    expect(session.auditLog.some(entry => entry.action === "TEST_RESULT_RECORDED")).toBe(true);
  });
});
