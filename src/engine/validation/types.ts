export type ValidationSeverity = "info" | "warning" | "error";

export type ValidationStatus = "valid" | "warning" | "invalid";

export interface ValidationMessage {
  code: string;
  severity: ValidationSeverity;
  messageAr: string;
  messageFr?: string;
  messageEn?: string;
  value?: number | string;
  limit?: number | string;
  unit?: string;
}

export interface CheckResult {
  code: string;
  labelAr: string;
  status: ValidationStatus;
  value?: number | string;
  expected?: number | string;
  tolerance?: number;
  unit?: string;
  messages: ValidationMessage[];
}

export interface MixValidationResult {
  valid: boolean;
  status: ValidationStatus;
  score: number;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
  infos: ValidationMessage[];
  recommendations: string[];
  checks: {
    volumeClosure: CheckResult;
    wcRatio: CheckResult;
    cementContent: CheckResult;
    waterContent: CheckResult;
    freshDensity: CheckResult;
    aggregateMoisture: CheckResult;
    admixtureDosage: CheckResult;
    exposureClass: CheckResult;
    workability: CheckResult;
  };
}
