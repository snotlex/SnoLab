import { describe, expect, it } from "vitest";
import { executeConcreteLaboratoryTest } from "./concreteLaboratoryEngine";
import { concreteDomainRunToWizardResult } from "./concreteLegacyAdapter";
import { buildLaboratorySessionReport } from "./laboratorySessionReport";
import {
  addSessionSample,
  addSessionTest,
  addTestReplicate,
  buildLaboratorySessionSyncPlan,
  concreteLaboratoryRunSessionStatus,
  createLaboratorySession,
  recordConcreteTestRun,
  runReadyLaboratoryTests
} from "./laboratorySessionService";
import type { LaboratoryTestRun } from "../types/laboratoryDomain";
import type { LaboratorySession } from "../types/laboratorySessionTypes";

function createConcreteReadySession(
  testType: "FC_SLUMP" | "HC_COMPRESSIVE_STRENGTH",
  domainId: "fresh_concrete" | "hardened_concrete",
  rawInputs: Record<string, unknown>,
  sourceProperties?: string[]
): LaboratorySession {
  let session = createLaboratorySession({ domainId, requestNumber: `REQ-${testType}`, projectId: "P-CONCRETE-1" });
  session = addSessionSample(session, {
    domainId,
    sampleNumber: "CONC-001",
    sampleCode: "CONC-001-A",
    materialId: "CONC-MAT-1",
    materialName: "Concrete batch",
    materialCategory: "concrete",
    source: "Batch B-1"
  });
  session = addSessionTest(session, {
    domainId,
    testType,
    testTitleAr: testType,
    testTitleFr: testType,
    testTitleEn: testType,
    standard: "Draft diagnostic method",
    materialId: "CONC-MAT-1",
    sampleId: session.samples[0].id,
    operator: "tech-1",
    status: "READY",
    requiredReplicates: 1,
    sourceProperties,
    result: { legacyValue: "preserve" },
    notes: "Existing operator note"
  });
  session = addTestReplicate(session, session.tests[0].id, { sampleId: session.samples[0].id, status: "IN_PROGRESS", rawInputs, result: { legacyReplicateValue: "preserve" } });
  return session;
}

function createRun(testType: "FC_SLUMP" | "HC_COMPRESSIVE_STRENGTH", sampleId = "CONC-001-A"): LaboratoryTestRun<Record<string, unknown>> {
  const rawData = testType === "FC_SLUMP"
    ? { slumpMm: 120, targetSlumpMm: 100, toleranceMm: 10, batchId: "B-1" }
    : { failureLoadKN: 720, loadedAreaMm2: 22500, ageDays: 28, specimenId: "C-1", batchId: "B-1", targetStrengthMpa: 30 };
  const run = executeConcreteLaboratoryTest(testType, {
    runId: `RUN-${testType}-1`,
    projectId: "P-CONCRETE-1",
    materialId: "CONC-MAT-1",
    sampleId,
    operator: "tech-1",
    rawData,
    now: "2026-10-23T12:00:00.000Z"
  });
  if (!run) throw new Error(`No concrete definition for ${testType}`);
  return run;
}

describe("concrete domain run UI and session integration", () => {
  it("maps domain runs to a warning-only wizard display with no syncable properties", () => {
    const run = createRun("FC_SLUMP");
    const display = concreteDomainRunToWizardResult(run);
    expect(display).toMatchObject({ status: "WARNING", results: { slumpMm: 120, deviationMm: 20 }, syncedProperties: {} });
    expect(display.interpretation).toContain("Acceptance is not assessed");
    expect(display.complianceDetails.every(item => item.status !== "PASS")).toBe(true);
    const runWithDecision: LaboratoryTestRun<Record<string, unknown>> = {
      ...run,
      acceptanceEvaluation: { decision: "PASS", observedValue: 120, reason: "test-only guard", evaluatedAt: "2026-10-23T12:00:00.000Z" }
    };
    expect(concreteDomainRunToWizardResult(runWithDecision).status).toBe("BLOCKED");
    expect(concreteLaboratoryRunSessionStatus(runWithDecision)).toBe("BLOCKED");
  });

  it("stores the complete concrete run in test and replicate and retains prior legacy fields", () => {
    const run = createRun("FC_SLUMP");
    let session = createConcreteReadySession("FC_SLUMP", "fresh_concrete", run.rawData, ["slumpMm"]);
    const test = session.tests[0];
    const replicate = test.replicates[0];
    session = recordConcreteTestRun(session, test.id, replicate.id, run, "tech-1");

    expect(session.tests[0].status).toBe("WARNING");
    expect(session.tests[0].domainRun).toEqual(run);
    expect(session.tests[0].replicates[0].domainRun).toEqual(run);
    expect(session.tests[0].result).toMatchObject({ legacyValue: "preserve", value: 120, unit: "mm" });
    expect(session.tests[0].notes).toBe("Existing operator note");
    expect(session.tests[0].replicates[0]).toMatchObject({ status: "VALID", numericResult: 120, rawInputs: run.rawData, result: { legacyReplicateValue: "preserve", legacyValue: "preserve", value: 120, unit: "mm" } });
    expect(session.review).toBeUndefined();
    expect(buildLaboratorySessionSyncPlan(session)).toEqual([]);

    const reloaded = JSON.parse(JSON.stringify(session)) as LaboratorySession;
    expect(reloaded.tests[0].domainRun).toEqual(run);
    expect(reloaded.tests[0].replicates[0].domainRun).toEqual(run);
    const report = buildLaboratorySessionReport(reloaded, { language: "ar" });
    expect(report.tests[0].domainRun).toEqual(run);
    expect(report.tests[0].replicates[0].domainRun).toEqual(run);
    expect(report.metadata.integrityHash).toBeTruthy();
  });

  it("persists each run returned by runReadyLaboratoryTests on its own replicate without PASS", async () => {
    const run = createRun("HC_COMPRESSIVE_STRENGTH");
    let session = createConcreteReadySession("HC_COMPRESSIVE_STRENGTH", "hardened_concrete", run.rawData);
    const testId = session.tests[0].id;
    const replicateId = session.tests[0].replicates[0].id;
    const execution = await runReadyLaboratoryTests(session, () => ({
      testId,
      status: concreteLaboratoryRunSessionStatus(run),
      domainRun: run
    }));
    session = execution.session;
    expect(session.tests[0].status).toBe("WARNING");
    expect(session.tests[0].domainRun).toEqual(run);
    expect(session.tests[0].replicates[0].domainRun).toEqual(run);
    expect(session.tests[0].replicates[0].id).toBe(replicateId);
    expect(session.tests[0].resultSummary?.mean).toBe(32);
    expect(execution.results[0].status).not.toBe("PASS");
  });

  it("keeps repeated measurements as separate concrete replicates and retains each full run", () => {
    const firstRun = createRun("FC_SLUMP");
    let session = createConcreteReadySession("FC_SLUMP", "fresh_concrete", firstRun.rawData);
    const testId = session.tests[0].id;
    const firstReplicateId = session.tests[0].replicates[0].id;
    session = recordConcreteTestRun(session, testId, firstReplicateId, firstRun);
    session = addTestReplicate(session, testId, {
      sampleId: session.tests[0].sampleId,
      status: "IN_PROGRESS",
      rawInputs: { slumpMm: 130, targetSlumpMm: 100, toleranceMm: 10, batchId: "B-1" }
    });
    expect(session.tests[0].status).toBe("READY");
    const secondReplicate = session.tests[0].replicates[1];
    const secondRun = executeConcreteLaboratoryTest("FC_SLUMP", {
      runId: "RUN-FC_SLUMP-2",
      projectId: "P-CONCRETE-1",
      materialId: "CONC-MAT-1",
      sampleId: "CONC-001-A",
      operator: "tech-1",
      rawData: secondReplicate.rawInputs,
      now: "2026-10-23T12:05:00.000Z"
    });
    if (!secondRun) throw new Error("No concrete definition for FC_SLUMP");
    session = recordConcreteTestRun(session, testId, secondReplicate.id, secondRun);

    expect(session.tests[0].replicates).toHaveLength(2);
    expect(session.tests[0].replicates[0].domainRun?.id).toBe(firstRun.id);
    expect(session.tests[0].replicates[1].domainRun?.id).toBe(secondRun.id);
    expect(session.tests[0].domainRun?.id).toBe(secondRun.id);
    expect(session.tests[0].resultSummary?.mean).toBe(125);
    expect(session.tests[0].status).toBe("WARNING");
  });

  it("records invalid calculations as BLOCKED, and rejects mismatched domain/sample references", () => {
    const validRun = createRun("FC_SLUMP");
    let session = createConcreteReadySession("FC_SLUMP", "fresh_concrete", validRun.rawData);
    const invalidRun: LaboratoryTestRun<Record<string, unknown>> = { ...validRun, status: "Invalid", validation: { valid: false, issues: [] }, result: undefined };
    session = recordConcreteTestRun(session, session.tests[0].id, session.tests[0].replicates[0].id, invalidRun);
    expect(session.tests[0].status).toBe("BLOCKED");
    expect(session.tests[0].replicates[0].status).toBe("INVALID");
    expect(session.tests[0].domainRun?.acceptanceEvaluation).toBeUndefined();

    const wrongSampleRun = createRun("FC_SLUMP", "OTHER-SAMPLE");
    const cleanSession = createConcreteReadySession("FC_SLUMP", "fresh_concrete", validRun.rawData);
    expect(() => recordConcreteTestRun(cleanSession, cleanSession.tests[0].id, cleanSession.tests[0].replicates[0].id, wrongSampleRun)).toThrow("CONCRETE_RUN_SESSION_REFERENCE_MISMATCH");

    const hardenedSession = createConcreteReadySession("HC_COMPRESSIVE_STRENGTH", "hardened_concrete", { failureLoadKN: 720, loadedAreaMm2: 22500, ageDays: 28, specimenId: "C-1", batchId: "B-1" });
    expect(() => recordConcreteTestRun(hardenedSession, hardenedSession.tests[0].id, hardenedSession.tests[0].replicates[0].id, validRun)).toThrow("CONCRETE_SESSION_DOMAIN_MISMATCH");
  });
});
