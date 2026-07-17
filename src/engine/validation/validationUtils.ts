import { ValidationSeverity, ValidationStatus, ValidationMessage, CheckResult } from "./types";

export function isFiniteNumber(value: any): value is number {
  return typeof value === "number" && !isNaN(value) && isFinite(value);
}

export function makeMessage(
  code: string,
  severity: ValidationSeverity,
  messageAr: string,
  options?: Partial<ValidationMessage>
): ValidationMessage {
  return {
    code,
    severity,
    messageAr,
    ...options
  };
}

export function makeCheckResult(
  code: string,
  labelAr: string,
  status: ValidationStatus,
  messages: ValidationMessage[],
  options?: Partial<CheckResult>
): CheckResult {
  return {
    code,
    labelAr,
    status,
    messages,
    ...options
  };
}

export function combineStatus(statuses: ValidationStatus[]): ValidationStatus {
  if (statuses.includes("invalid")) return "invalid";
  if (statuses.includes("warning")) return "warning";
  return "valid";
}

export function computeScore(errorsCount: number, warningsCount: number): number {
  const score = 100 - (errorsCount * 20) - (warningsCount * 5);
  return Math.max(0, score);
}

export function extractNumericResult(value: any): number | undefined {
  if (typeof value === "number" && !isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

export function approximatelyEqual(val1: number, val2: number, tolerance: number = 0.5): boolean {
  return Math.abs(val1 - val2) <= tolerance;
}
