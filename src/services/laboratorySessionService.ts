import type { EngineeringMaterial } from "../types";
import type { MaterialTestRecord } from "../types/laboratoryTypes";
import {
  LaboratoryReplicate,
  LaboratoryRequestStatus,
  LaboratorySession,
  LaboratorySessionAuditEntry,
  LaboratorySessionCreateInput,
  LaboratorySessionSample,
  LaboratorySessionSummary,
  LaboratorySessionSyncPlanItem,
  LaboratorySessionTestItem,
  LaboratorySessionTestStatus,
  LaboratorySessionValidationResult,
  SessionRunResult,
  SessionTestRunner,
  TEST_STATUS_TO_SESSION_STATUS
} from "../types/laboratorySessionTypes";

const nowIso = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
// A coefficient of variation above 3% is flagged for review; individual values remain visible.
export const HIGH_VARIANCE_CV_THRESHOLD = 0.03;

function audit(
  action: string,
  entityType: LaboratorySessionAuditEntry["entityType"],
  entityId: string,
  actor = "system",
  reason?: string,
  before?: unknown,
  after?: unknown
): LaboratorySessionAuditEntry {
  return { id: id("AUD"), action, entityType, entityId, actor, timestamp: nowIso(), reason, before, after };
}

export function createLaboratorySession(input: LaboratorySessionCreateInput = {}): LaboratorySession {
  const timestamp = nowIso();
  const sessionId = input.id || id("LAB");
  const requestNumber = input.requestNumber?.trim() || `LAB-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  return {
    id: sessionId,
    requestNumber,
    projectId: input.projectId,
    projectName: input.projectName,
    client: input.client,
    site: input.site,
    supplier: input.supplier,
    requestOwner: input.requestOwner,
    requestedAt: input.requestedAt || timestamp,
    priority: input.priority || "NORMAL",
    reason: input.reason,
    notes: input.notes,
    status: "DRAFT",
    parentSampleIds: [],
    samples: [],
    tests: [],
    auditLog: [audit("SESSION_CREATED", "session", sessionId)],
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function touch(session: LaboratorySession, entry: LaboratorySessionAuditEntry): LaboratorySession {
  return { ...session, auditLog: [...session.auditLog, entry], updatedAt: nowIso() };
}

export function addSessionSample(session: LaboratorySession, sample: Omit<LaboratorySessionSample, "id">, actor = "operator"): LaboratorySession {
  const number = sample.sampleNumber.trim();
  const code = sample.sampleCode.trim();
  if (!number || !code) throw new Error("Sample number and unique sample code are required.");
  if (session.samples.some(item => item.sampleNumber === number || item.sampleCode === code)) {
    throw new Error(`Duplicate sample number or code: ${number}/${code}`);
  }
  const created = { ...sample, id: id("SMP"), sampleNumber: number, sampleCode: code };
  const next = {
    ...session,
    samples: [...session.samples, created],
    parentSampleIds: [...session.parentSampleIds, created.id],
    status: session.status === "DRAFT" ? "IN_PROGRESS" as LaboratoryRequestStatus : session.status
  };
  return touch(next, audit("SAMPLE_ADDED", "sample", created.id, actor, undefined, created));
}

export function addSessionTest(
  session: LaboratorySession,
  test: Omit<LaboratorySessionTestItem, "id" | "sequence" | "replicates" | "auditEntryIds" | "completionPercent">,
  actor = "operator"
): LaboratorySession {
  if (!session.samples.some(sample => sample.id === test.sampleId)) throw new Error("Test must reference a sample in the same laboratory session.");
  if (!test.materialId.trim() || !test.testType.trim()) throw new Error("Test material and test type are required.");
  const created: LaboratorySessionTestItem = {
    ...test,
    id: id("TST"),
    sequence: session.tests.length + 1,
    status: test.status || "DRAFT",
    completionPercent: 0,
    replicates: [],
    auditEntryIds: []
  };
  const next = { ...session, tests: [...session.tests, created] };
  return touch(next, audit("TEST_ADDED", "test", created.id, actor, undefined, created));
}

export function addTestReplicate(
  session: LaboratorySession,
  testId: string,
  input: Omit<LaboratoryReplicate, "id" | "sequence">,
  actor = "operator"
): LaboratorySession {
  const target = session.tests.find(test => test.id === testId);
  if (!target) throw new Error(`Unknown test item: ${testId}`);
  const specimenCode = input.specimenCode?.trim();
  if (specimenCode && target.replicates.some(replicate => replicate.specimenCode === specimenCode)) {
    throw new Error(`Duplicate replicate specimen code: ${specimenCode}`);
  }
  if (!session.samples.some(sample => sample.id === input.sampleId)) throw new Error("Replicate must reference a sample in the same session.");
  const replicate: LaboratoryReplicate = { ...input, id: id("REP"), sequence: target.replicates.length + 1 };
  const tests = session.tests.map(test => test.id === testId
    ? { ...test, replicates: [...test.replicates, replicate], status: test.status === "DRAFT" && replicate.status !== "EMPTY" ? "READY" as LaboratorySessionTestStatus : test.status }
    : test);
  return touch({ ...session, tests }, audit("REPLICATE_ADDED", "replicate", replicate.id, actor, undefined, replicate));
}

function validReplicates(test: LaboratorySessionTestItem): LaboratoryReplicate[] {
  return test.replicates.filter(replicate => replicate.status === "VALID" && typeof replicate.numericResult === "number" && Number.isFinite(replicate.numericResult));
}

export function summarizeReplicates(test: LaboratorySessionTestItem): LaboratorySessionTestItem["resultSummary"] {
  const valid = validReplicates(test).map(replicate => replicate.numericResult as number);
  if (!valid.length) return { individualValues: [], validCount: 0, excludedCount: test.replicates.filter(item => item.status === "EXCLUDED").length };
  const mean = valid.reduce((sum, value) => sum + value, 0) / valid.length;
  const variance = valid.length > 1 ? valid.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (valid.length - 1) : undefined;
  const standardDeviation = variance === undefined ? undefined : Math.sqrt(variance);
  const range = Math.max(...valid) - Math.min(...valid);
  return {
    individualValues: valid,
    validCount: valid.length,
    excludedCount: test.replicates.filter(item => item.status === "EXCLUDED").length,
    mean,
    standardDeviation,
    range,
    highVariance: standardDeviation !== undefined && mean !== 0 && Math.abs(standardDeviation / mean) > HIGH_VARIANCE_CV_THRESHOLD
  };
}

export function validateLaboratorySession(session: LaboratorySession): LaboratorySessionValidationResult {
  const issues: LaboratorySessionValidationResult["issues"] = [];
  if (!session.requestNumber.trim()) issues.push({ code: "REQUEST_NUMBER_REQUIRED", level: "error", entityType: "session", message: "Laboratory request number is required." });
  if (!session.tests.length) issues.push({ code: "TEST_REQUIRED", level: "error", entityType: "session", message: "At least one laboratory test is required." });
  const sampleNumbers = new Set<string>();
  const sampleCodes = new Set<string>();
  for (const sample of session.samples) {
    if (sampleNumbers.has(sample.sampleNumber)) issues.push({ code: "DUPLICATE_SAMPLE_NUMBER", level: "error", entityType: "sample", entityId: sample.id, message: `Duplicate sample number: ${sample.sampleNumber}` });
    if (sampleCodes.has(sample.sampleCode)) issues.push({ code: "DUPLICATE_SAMPLE_CODE", level: "error", entityType: "sample", entityId: sample.id, message: `Duplicate sample code: ${sample.sampleCode}` });
    sampleNumbers.add(sample.sampleNumber);
    sampleCodes.add(sample.sampleCode);
    if (sample.collectedAt && sample.receivedAt && sample.receivedAt < sample.collectedAt) issues.push({ code: "INVALID_SAMPLE_DATES", level: "error", entityType: "sample", entityId: sample.id, message: "Sample receipt cannot precede collection." });
  }
  let readyTestCount = 0;
  let errorTestCount = 0;
  let inProgressTestCount = 0;
  for (const test of session.tests) {
    if (!session.samples.some(sample => sample.id === test.sampleId)) issues.push({ code: "TEST_SAMPLE_MISSING", level: "error", entityType: "test", entityId: test.id, message: "Test sample is not part of this session." });
    const invalidReplicate = test.replicates.some(replicate => replicate.status === "INVALID");
    const hasValidReplicate = test.replicates.some(replicate => replicate.status === "VALID");
    if (test.status === "READY") readyTestCount += 1;
    if (["RUNNING"].includes(test.status)) inProgressTestCount += 1;
    if (test.status === "BLOCKED" || invalidReplicate) errorTestCount += 1;
    if (test.status === "READY" && !hasValidReplicate) issues.push({ code: "REPLICATE_REQUIRED", level: "error", entityType: "test", entityId: test.id, message: "At least one valid replicate is required before running." });
  }
  return { valid: !issues.some(issue => issue.level === "error"), issues, readyTestCount, errorTestCount, inProgressTestCount };
}

export function summarizeLaboratorySession(session: LaboratorySession): LaboratorySessionSummary {
  const totalTests = session.tests.length;
  const completedTests = session.tests.filter(test => ["PASS", "WARNING", "FAIL"].includes(test.status)).length;
  const passedTests = session.tests.filter(test => test.status === "PASS").length;
  const warningTests = session.tests.filter(test => test.status === "WARNING").length;
  const failedTests = session.tests.filter(test => test.status === "FAIL").length;
  const blockedTests = session.tests.filter(test => test.status === "BLOCKED").length;
  const readyTests = session.tests.filter(test => test.status === "READY").length;
  const runningTests = session.tests.filter(test => test.status === "RUNNING").length;
  const incompleteTests = session.tests.filter(test => ["DRAFT", "CANCELLED"].includes(test.status)).length;
  const completionPercent = totalTests ? Math.round((completedTests / totalTests) * 100) : 0;
  let status: LaboratoryRequestStatus = "DRAFT";
  if (!totalTests) status = session.samples.length ? "IN_PROGRESS" : "DRAFT";
  else if (session.status === "CLOSED" || session.status === "CANCELLED") status = session.status;
  else if (completedTests === totalTests) status = session.status === "UNDER_REVIEW" || session.status === "APPROVED" ? session.status : "COMPLETED";
  else if (completedTests > 0) status = "PARTIALLY_COMPLETED";
  else if (readyTests === totalTests) status = "READY";
  else if (runningTests > 0) status = "IN_PROGRESS";
  else status = "IN_PROGRESS";
  return { totalTests, completedTests, passedTests, warningTests, failedTests, blockedTests, readyTests, runningTests, incompleteTests, completionPercent, status };
}

export function canApproveLaboratorySession(session: LaboratorySession): { allowed: boolean; reasons: string[] } {
  const reasons: string[] = [];
  for (const test of session.tests) {
    if (!["PASS", "WARNING"].includes(test.status)) reasons.push(`${test.testType}: status ${test.status} is not approvable.`);
    if (test.replicates.some(replicate => replicate.status === "INVALID")) reasons.push(`${test.testType}: invalid replicate data.`);
    if (test.requiredReplicates && validReplicates(test).length < test.requiredReplicates) reasons.push(`${test.testType}: required replicate count not met.`);
  }
  return { allowed: session.tests.length > 0 && reasons.length === 0, reasons };
}

export function approveLaboratorySession(session: LaboratorySession, reviewer: string, notes?: string): LaboratorySession {
  const approval = canApproveLaboratorySession(session);
  if (!approval.allowed) throw new Error(`Session cannot be approved: ${approval.reasons.join(" ")}`);
  const review = { reviewer, reviewedAt: nowIso(), decision: "APPROVED" as const, notes };
  return touch({ ...session, status: "APPROVED", review }, audit("SESSION_APPROVED", "approval", session.id, reviewer, notes, session.review, review));
}

function isSyncableValue(value: unknown): value is number | string | boolean {
  return (typeof value === "number" && Number.isFinite(value)) || typeof value === "string" || typeof value === "boolean";
}

export function buildLaboratorySessionSyncPlan(session: LaboratorySession): LaboratorySessionSyncPlanItem[] {
  const plan: LaboratorySessionSyncPlanItem[] = [];
  for (const test of session.tests) {
    if (!["PASS", "WARNING"].includes(test.status)) continue;
    const result = test.result || {};
    for (const propertyKey of test.sourceProperties || []) {
      const value = result[propertyKey];
      if (!isSyncableValue(value)) continue;
      plan.push({ sessionId: session.id, requestNumber: session.requestNumber, testItemId: test.id, testType: test.testType, materialId: test.materialId, propertyKey, value, measuredAt: test.completedAt });
    }
  }
  return plan;
}

export function findLaboratorySessionSyncConflicts(plan: LaboratorySessionSyncPlanItem[]): Array<{ propertyKey: string; materialId: string; values: Array<number | string | boolean>; testItemIds: string[] }> {
  const groups = new Map<string, LaboratorySessionSyncPlanItem[]>();
  for (const item of plan) {
    const key = `${item.materialId}::${item.propertyKey}`;
    groups.set(key, [...(groups.get(key) || []), item]);
  }
  return Array.from(groups.values()).filter(items => new Set(items.map(item => JSON.stringify(item.value))).size > 1).map(items => ({
    propertyKey: items[0].propertyKey,
    materialId: items[0].materialId,
    values: items.map(item => item.value),
    testItemIds: items.map(item => item.testItemId)
  }));
}

export async function runReadyLaboratoryTests(session: LaboratorySession, runner: SessionTestRunner): Promise<{ session: LaboratorySession; results: SessionRunResult[] }> {
  const results: SessionRunResult[] = [];
  let next: LaboratorySession = { ...session, status: "IN_PROGRESS", updatedAt: nowIso() };
  for (const item of session.tests) {
    if (item.status !== "READY") continue;
    const readyReplicates = item.replicates.filter(replicate => replicate.status !== "EXCLUDED");
    if (!readyReplicates.length) {
      const skipped = { testId: item.id, status: "DRAFT" as LaboratorySessionTestStatus, error: "No replicate is ready." };
      results.push(skipped);
      continue;
    }
    next = { ...next, tests: next.tests.map(test => test.id === item.id ? { ...test, status: "RUNNING", startedAt: nowIso() } : test) };
    let itemStatus: LaboratorySessionTestStatus = "PASS";
    for (const replicate of readyReplicates) {
      try {
        const result = await runner(item, replicate);
        results.push(result);
        if (result.status === "FAIL" || result.status === "BLOCKED") itemStatus = result.status;
        else if (result.status === "WARNING" && itemStatus === "PASS") itemStatus = "WARNING";
        next = {
          ...next,
          tests: next.tests.map(test => test.id !== item.id ? test : {
            ...test,
            replicates: test.replicates.map(current => current.id === replicate.id
              ? { ...current, status: result.status === "PASS" || result.status === "WARNING" ? "VALID" : "INVALID", completedAt: nowIso(), result: result.record?.results, numericResult: typeof result.record?.score === "number" ? result.record.score : current.numericResult }
              : current)
          })
        };
      } catch (error) {
        const failed = { testId: item.id, status: "FAIL" as LaboratorySessionTestStatus, error: error instanceof Error ? error.message : "Test runner failed." };
        results.push(failed);
        itemStatus = "FAIL";
      }
    }
    next = {
      ...next,
      tests: next.tests.map(test => test.id === item.id ? { ...test, status: itemStatus, completedAt: nowIso(), completionPercent: 100, resultSummary: summarizeReplicates(test) } : test)
    };
  }
  return { session: { ...next, status: summarizeLaboratorySession(next).status, updatedAt: nowIso() }, results };
}

export function legacyRecordToLaboratorySession(record: MaterialTestRecord): LaboratorySession {
  const timestamp = record.updatedAt || nowIso();
  const sample: LaboratorySessionSample = {
    id: `LEGACY-SAMPLE-${record.id}`,
    sampleNumber: record.sampleId || `LEGACY-${record.id}`,
    sampleCode: record.sampleId || `LEGACY-${record.id}`,
    materialId: record.materialId,
    materialName: record.materialName,
    materialCategory: record.materialCategory,
    description: record.sampleDescription,
    source: record.sampleSource,
    collectedAt: record.sampleDate,
    receivedAt: record.sampleDate
  };
  const sessionTest: LaboratorySessionTestItem = {
    id: `LEGACY-TEST-${record.id}`,
    sequence: 1,
    testType: record.testType,
    testTitleAr: record.testTitleAr,
    testTitleFr: record.testTitleFr,
    testTitleEn: record.testTitleEn,
    standard: record.standard,
    materialId: record.materialId,
    sampleId: sample.id,
    operator: record.operator,
    status: TEST_STATUS_TO_SESSION_STATUS[record.status],
    sourceRecordId: record.id,
    completionPercent: record.status === "DRAFT" || record.status === "READY" ? 0 : 100,
    replicates: [{
      id: `LEGACY-REPLICATE-${record.id}`,
      sequence: 1,
      sampleId: sample.id,
      status: record.status === "DRAFT" || record.status === "READY" ? "IN_PROGRESS" : record.status === "FAIL" || record.status === "BLOCKED" ? "INVALID" : "VALID",
      rawInputs: record.inputs,
      result: record.results,
      notes: record.notes
    }],
    result: record.results,
    sourceProperties: Object.keys(record.syncedProperties || {}),
    notes: record.notes,
    auditEntryIds: []
  };
  return {
    id: `LEGACY-SESSION-${record.id}`,
    requestNumber: `LEGACY-${record.id}`,
    projectId: record.projectId,
    projectName: record.projectName,
    requestOwner: record.operator,
    requestedAt: record.createdAt || timestamp,
    status: "COMPLETED",
    parentSampleIds: [sample.id],
    samples: [sample],
    tests: [sessionTest],
    auditLog: [audit("LEGACY_RECORD_WRAPPED", "session", `LEGACY-SESSION-${record.id}`, "system", "Non-destructive compatibility view", undefined, { legacyRecordId: record.id })],
    legacyRecordId: record.id,
    createdAt: record.createdAt || timestamp,
    updatedAt: timestamp
  };
}

export function resolveSessionMaterial(session: LaboratorySession, materials: EngineeringMaterial[]): EngineeringMaterial | undefined {
  const materialId = session.tests[0]?.materialId || session.samples[0]?.materialId;
  return materials.find(material => material.id === materialId);
}
