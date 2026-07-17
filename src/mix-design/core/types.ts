import { MixDesignInput as LegacyInput, MixDesignResult as LegacyResult } from "../../engine/types";

export type MixDesignInput = LegacyInput;

export interface CalculationContext {
  language: "ar" | "fr" | "en";
  [key: string]: any;
}

export interface MixDesignRequest {
  methodId: string;
  methodVersion?: string;
  input: MixDesignInput;
  context: CalculationContext;
}

export interface MixDesignMethodMetadata {
  id: string;
  name: string;
  shortName: string;
  version: string;
  description?: string;
  references?: string[];
  supportedLanguages?: string[];
  status: "active" | "experimental" | "deprecated";
}

export interface ValidationError {
  code: string;
  severity: "error" | "warning";
  field: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface ApplicabilityResult {
  level: "applicable" | "limited" | "not_applicable";
  reasons: string[];
}

export interface MaterialQuantity {
  id: string;
  name: string;
  type: string;
  weight: number;
}

export interface CalculationMessage {
  code: string;
  severity: "error" | "warning" | "info";
  field: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface CalculationTraceStep {
  stepId: string;
  label: string;
  formula?: string;
  inputs: Record<string, any>;
  output: Record<string, any> | number | string;
  unit?: string;
}

export interface MixDesignResult extends LegacyResult {
  method: {
    id: string;
    name: string;
    version: string;
  };

  inputSnapshot: MixDesignInput;

  quantities: {
    cement?: number;
    supplementaryCementitiousMaterials?: number;
    totalBinder: number;
    effectiveWater: number;
    addedWater: number;
    fineAggregates: number;
    coarseAggregates: number;
    admixtures: MaterialQuantity[];
    fibers?: MaterialQuantity[];
  };

  ratios: {
    waterCementRatio?: number;
    waterBinderRatio: number;
    sandAggregateRatio?: number;
  };

  physicalProperties: {
    theoreticalFreshDensity: number;
    absoluteVolume: number;
    volumeClosureError: number;
  };

  validation: ValidationResult;
  warnings: string[]; // Keep as string[] for compatibility, but can map internal messages
  internalWarnings?: CalculationMessage[];
  trace: CalculationTraceStep[];
  calculatedAt: string;
}
