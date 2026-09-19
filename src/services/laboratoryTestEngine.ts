import type {
  LaboratoryTestDefinition,
  ValidationIssue,
  ValidationReport,
  LaboratoryTestRun,
  LaboratoryStandardReference
} from "../types/laboratoryDomain";

function issue(
  level: ValidationIssue["level"],
  severity: ValidationIssue["severity"],
  code: string,
  message: string,
  field?: string
): ValidationIssue {
  return { level, severity, code, message, field };
}

export function validateTestInputs<TData extends Record<string, unknown>>(
  definition: LaboratoryTestDefinition<TData>,
  data: TData
): ValidationReport {
  const issues: ValidationIssue[] = [];
  for (const input of definition.inputs) {
    const value = data[input.key];
    const missing = value === undefined || value === null || value === "";
    if (input.required && missing) {
      issues.push(issue("data", "error", "REQUIRED_INPUT_MISSING", `${input.label} is required.`, input.key));
      continue;
    }
    if (missing) continue;
    if (input.numeric && (typeof value !== "number" || !Number.isFinite(value))) {
      issues.push(issue("data", "error", "NUMERIC_INPUT_REQUIRED", `${input.label} must be a finite number.`, input.key));
      continue;
    }
    if (typeof value === "number" && input.min !== undefined && value < input.min) {
      issues.push(issue("physical", "error", "VALUE_BELOW_MINIMUM", `${input.label} is below the allowed minimum.`, input.key));
    }
    if (typeof value === "number" && input.max !== undefined && value > input.max) {
      issues.push(issue("physical", "error", "VALUE_ABOVE_MAXIMUM", `${input.label} is above the allowed maximum.`, input.key));
    }
  }
  if (definition.standard && definition.standard.status !== "Active") {
    issues.push(issue("engineering", "warning", "STANDARD_NOT_ACTIVE", `The selected standard is ${definition.standard.status}.`));
  }
  return { valid: !issues.some(item => item.severity === "error"), issues };
}

export function executeDefinedLaboratoryTest<TData extends Record<string, unknown>>(
  definition: LaboratoryTestDefinition<TData>,
  params: {
    runId: string;
    materialId: string;
    sampleId: string;
    operator: string;
    rawData: TData;
    projectId?: string;
    standard?: LaboratoryStandardReference;
    equipmentIds?: string[];
    now?: string;
  }
): LaboratoryTestRun<TData> {
  const now = params.now || new Date().toISOString();
  const inputValidation = validateTestInputs({ ...definition, standard: params.standard || definition.standard }, params.rawData);
  if (!inputValidation.valid) {
    return {
      id: params.runId,
      projectId: params.projectId,
      materialId: params.materialId,
      sampleId: params.sampleId,
      testDefinitionId: definition.id,
      testDefinitionRevision: definition.revision,
      standard: params.standard || definition.standard,
      equipmentIds: params.equipmentIds,
      operator: params.operator,
      rawData: params.rawData,
      calculationTrace: [],
      validation: inputValidation,
      status: inputValidation.issues.some(item => item.code === "REQUIRED_INPUT_MISSING") ? "Incomplete" : "Invalid",
      createdAt: now,
      updatedAt: now
    };
  }

  const engineeringIssues = definition.validateEngineering ? definition.validateEngineering(params.rawData) : [];
  const validation: ValidationReport = {
    valid: !engineeringIssues.some(item => item.severity === "error"),
    issues: [...inputValidation.issues, ...engineeringIssues]
  };
  if (!validation.valid) {
    return {
      id: params.runId,
      projectId: params.projectId,
      materialId: params.materialId,
      sampleId: params.sampleId,
      testDefinitionId: definition.id,
      testDefinitionRevision: definition.revision,
      standard: params.standard || definition.standard,
      equipmentIds: params.equipmentIds,
      operator: params.operator,
      rawData: params.rawData,
      calculationTrace: [],
      validation,
      status: "Invalid",
      createdAt: now,
      updatedAt: now
    };
  }

  try {
    const calculation = definition.calculate(params.rawData);
    const resultIsFinite = typeof calculation.result !== "number" || Number.isFinite(calculation.result);
    if (!resultIsFinite) {
      const mathematical = issue("mathematical", "error", "NON_FINITE_RESULT", "Calculation produced a non-finite result.");
      return {
        id: params.runId,
        projectId: params.projectId,
        materialId: params.materialId,
        sampleId: params.sampleId,
        testDefinitionId: definition.id,
        testDefinitionRevision: definition.revision,
        standard: params.standard || definition.standard,
        equipmentIds: params.equipmentIds,
        operator: params.operator,
        rawData: params.rawData,
        calculationTrace: calculation.trace,
        validation: { valid: false, issues: [...validation.issues, mathematical] },
        status: "Invalid",
        createdAt: now,
        updatedAt: now
      };
    }
    const warning = validation.issues.some(item => item.severity === "warning");
    return {
      id: params.runId,
      projectId: params.projectId,
      materialId: params.materialId,
      sampleId: params.sampleId,
      testDefinitionId: definition.id,
      testDefinitionRevision: definition.revision,
      standard: params.standard || definition.standard,
      equipmentIds: params.equipmentIds,
      operator: params.operator,
      rawData: params.rawData,
      calculationTrace: calculation.trace,
      result: { value: calculation.result, unit: calculation.unit || definition.resultUnit },
      validation,
      status: warning ? "Warning" : "Calculated",
      createdAt: now,
      updatedAt: now
    };
  } catch (error) {
    const mathematical = issue("mathematical", "error", "CALCULATION_FAILED", error instanceof Error ? error.message : "Calculation failed.");
    return {
      id: params.runId,
      projectId: params.projectId,
      materialId: params.materialId,
      sampleId: params.sampleId,
      testDefinitionId: definition.id,
      testDefinitionRevision: definition.revision,
      standard: params.standard || definition.standard,
      equipmentIds: params.equipmentIds,
      operator: params.operator,
      rawData: params.rawData,
      calculationTrace: [],
      validation: { valid: false, issues: [...validation.issues, mathematical] },
      status: "Invalid",
      createdAt: now,
      updatedAt: now
    };
  }
}

export function approveLaboratoryTestRun<TData extends Record<string, unknown>>(
  run: LaboratoryTestRun<TData>,
  reviewer: string,
  decision: "Approved" | "Rejected",
  reason?: string,
  now = new Date().toISOString()
): LaboratoryTestRun<TData> {
  if (run.status !== "Calculated" && run.status !== "Warning" && run.status !== "Under Review") {
    throw new Error(`Only calculated or reviewable runs can be approved; current status is ${run.status}.`);
  }
  const auditEntryId = `AUDIT-${run.id}-${Date.now().toString(36).toUpperCase()}`;
  return {
    ...run,
    reviewer,
    status: decision === "Approved" ? "Approved" : "Rejected",
    approval: { approvedBy: reviewer, approvedAt: now, decision, reason, auditEntryId },
    updatedAt: now
  };
}
