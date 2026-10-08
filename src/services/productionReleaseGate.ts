import { ActiveProject, MixDesignResult } from "../types";

export interface ProductionReleaseDecision {
  canRelease: boolean;
  reasons: string[];
}

/** A numerical calculation is not, by itself, a production release. */
export function evaluateProductionRelease(
  project: ActiveProject | undefined,
  result: Partial<MixDesignResult> | undefined,
  validation: { isValidForReport?: boolean; criticalErrors?: unknown[]; warnings?: unknown[] }
): ProductionReleaseDecision {
  const reasons: string[] = [];
  if (!project) reasons.push("project_missing");
  if (!result || result.valid === false || result.isValid === false) reasons.push("calculation_invalid");
  if (validation.isValidForReport !== true) reasons.push("engineering_gate_not_passed");
  if ((validation.criticalErrors?.length || 0) > 0) reasons.push("critical_validation_errors");
  if ((validation.warnings?.length || 0) > 0) reasons.push("unresolved_engineering_warnings");
  const passedTrial = (project?.validationRecords || []).some(record => record.status === "PASSED");
  if (!passedTrial) reasons.push("passed_trial_mix_missing");
  const approvedLaboratoryReview = (project?.validationRecords || []).some(record => record.status === "PASSED" && record.review?.decision === "APPROVED")
    || Boolean((project as any)?.laboratorySessions?.some((session: any) => session.status === "APPROVED" && session.review?.decision === "APPROVED"));
  if (!approvedLaboratoryReview) reasons.push("laboratory_review_missing");
  if (project?.mixLifecycleStatus !== "performance-verified" && project?.mixLifecycleStatus !== "approved") reasons.push("performance_verification_required");
  return { canRelease: reasons.length === 0, reasons };
}
