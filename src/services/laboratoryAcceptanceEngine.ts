import type { LaboratoryDomainId, LaboratoryTestRun } from "../types/laboratoryDomain";

export type AcceptanceOperator = "min" | "max" | "between" | "target_with_tolerance" | "informational";
export type AcceptanceDecision = "PASS" | "FAIL" | "WARNING" | "NOT_APPLICABLE" | "NEEDS_REVIEW";
export interface AcceptanceProfile { id: string; projectId?: string; domainId: LaboratoryDomainId; testDefinitionId: string; standardId: string; parameter: string; operator: AcceptanceOperator; unit: string; lowerLimit?: number; upperLimit?: number; targetValue?: number; tolerance?: number; appliesWhen: Record<string, string | number | boolean>; sourceDocumentId: string; status: "Draft" | "Active" | "Superseded"; reviewedBy?: string; reviewedAt?: string; reviewNote?: string; }
export interface AcceptanceEvaluation { decision: AcceptanceDecision; profileId?: string; observedValue: number | string; expected?: string; reason: string; }

export function evaluateAcceptance(value: number | string | undefined, profile: AcceptanceProfile | undefined): AcceptanceEvaluation {
  if (value === undefined || value === null || value === "") return { decision: "NEEDS_REVIEW", observedValue: "missing", reason: "Observed value is missing." };
  if (!profile) return { decision: "NEEDS_REVIEW", observedValue: value, reason: "No acceptance profile is configured for this test and project context." };
  if (profile.status !== "Active") return { decision: "NEEDS_REVIEW", profileId: profile.id, observedValue: value, reason: `Acceptance profile is ${profile.status}.` };
  if (typeof value !== "number" || !Number.isFinite(value)) return { decision: "NEEDS_REVIEW", profileId: profile.id, observedValue: value, reason: "Observed value is not a finite numeric value." };
  let pass = false;
  let expected = "";
  switch (profile.operator) {
    case "min": pass = profile.lowerLimit !== undefined && value >= profile.lowerLimit; expected = `>= ${profile.lowerLimit} ${profile.unit}`; break;
    case "max": pass = profile.upperLimit !== undefined && value <= profile.upperLimit; expected = `<= ${profile.upperLimit} ${profile.unit}`; break;
    case "between": pass = profile.lowerLimit !== undefined && profile.upperLimit !== undefined && value >= profile.lowerLimit && value <= profile.upperLimit; expected = `${profile.lowerLimit}–${profile.upperLimit} ${profile.unit}`; break;
    case "target_with_tolerance": pass = profile.targetValue !== undefined && profile.tolerance !== undefined && Math.abs(value - profile.targetValue) <= profile.tolerance; expected = `${profile.targetValue} ± ${profile.tolerance} ${profile.unit}`; break;
    case "informational": return { decision: "NOT_APPLICABLE", profileId: profile.id, observedValue: value, reason: "Profile is informational and does not issue a compliance verdict." };
  }
  if (!expected) return { decision: "NEEDS_REVIEW", profileId: profile.id, observedValue: value, reason: "Acceptance profile is incomplete." };
  return { decision: pass ? "PASS" : "FAIL", profileId: profile.id, observedValue: value, expected, reason: pass ? "Observed value satisfies the active project profile." : "Observed value is outside the active project profile." };
}

export function attachAcceptanceEvaluation<TData extends Record<string, unknown>>(
  run: LaboratoryTestRun<TData>,
  observedValue: number | string | undefined,
  profile: AcceptanceProfile | undefined,
  evaluatedAt = new Date().toISOString()
): LaboratoryTestRun<TData> {
  const evaluation = evaluateAcceptance(observedValue, profile);
  return { ...run, acceptanceProfileId: profile?.id, acceptanceEvaluation: { ...evaluation, evaluatedAt } };
}
