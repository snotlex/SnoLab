import type { LaboratoryIdentity, LaboratoryResultStatus, LaboratoryTestRun } from "../types/laboratoryDomain";

export interface LaboratoryLifecycleContext {
  standardReady?: boolean;
  equipmentReady?: boolean;
  rawDataComplete?: boolean;
  tracePresent?: boolean;
  verificationStatus?: LaboratoryTestRun["verificationStatus"];
  reviewerIdentity?: LaboratoryIdentity;
  creatorIdentity?: LaboratoryIdentity;
}

const transitions: Record<LaboratoryResultStatus, LaboratoryResultStatus[]> = {
  Draft: ["Incomplete", "Invalid", "Calculated", "Blocked"],
  Incomplete: ["Draft", "Invalid", "Calculated", "Blocked"],
  Invalid: ["Draft", "Incomplete", "Blocked"],
  Calculated: ["Verified", "Under Review", "Rejected", "Blocked"],
  Verified: ["Under Review", "Approved", "Rejected", "Blocked"],
  "Under Review": ["Verified", "Approved", "Rejected", "Blocked"],
  Warning: ["Under Review", "Rejected", "Blocked"],
  Approved: ["Archived", "Superseded"],
  Rejected: ["Draft", "Archived"],
  Blocked: ["Draft", "Archived"],
  Passed: ["Under Review", "Approved", "Archived"],
  Failed: ["Draft", "Archived"],
  Superseded: ["Archived"],
  Archived: [],
};

export function allowedLaboratoryStatusTransitions(from: LaboratoryResultStatus): LaboratoryResultStatus[] {
  return [...transitions[from]];
}

export function canTransitionLaboratoryStatus(
  from: LaboratoryResultStatus,
  to: LaboratoryResultStatus,
  context: LaboratoryLifecycleContext = {}
): boolean {
  if (!transitions[from]?.includes(to)) return false;
  if (to === "Calculated" && (context.rawDataComplete === false || context.tracePresent === false)) return false;
  if (to === "Verified" && context.verificationStatus !== "VERIFIED") return false;
  if (to === "Approved") {
    if (context.standardReady !== true || context.equipmentReady !== true || context.rawDataComplete !== true || context.tracePresent !== true || context.verificationStatus !== "VERIFIED") return false;
    if (!context.reviewerIdentity || !context.reviewerIdentity.userId) return false;
    if (context.creatorIdentity?.userId && context.creatorIdentity.userId === context.reviewerIdentity.userId) return false;
  }
  return true;
}

export function transitionLaboratoryStatus<TData extends Record<string, unknown>>(
  run: LaboratoryTestRun<TData>,
  to: LaboratoryResultStatus,
  context: LaboratoryLifecycleContext = {}
): LaboratoryTestRun<TData> {
  const effectiveContext: LaboratoryLifecycleContext = {
    rawDataComplete: Object.keys(run.rawData || {}).length > 0,
    tracePresent: run.calculationTrace.length > 0,
    verificationStatus: run.verificationStatus,
    reviewerIdentity: run.reviewerIdentity,
    creatorIdentity: run.createdByIdentity,
    ...context,
  };
  if (!canTransitionLaboratoryStatus(run.status, to, effectiveContext)) {
    throw new Error(`Invalid laboratory lifecycle transition: ${run.status} -> ${to}.`);
  }
  return { ...run, status: to, updatedAt: new Date().toISOString() };
}
