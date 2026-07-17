export type MethodImplementationStatus =
  | "complete"
  | "partial-adapter"
  | "supporting-only"
  | "needs-engineering-review";

export type MixDesignMethodId =
  | "dreux-gorisse";

export type MethodCategory =
  | "complete-design"
  | "supporting-model";

export interface MethodInputField {
  key: string;
  labelAr: string;
  labelFr: string;
  labelEn: string;
  type: "number" | "select" | "boolean" | "text";
  unit?: string;
  required: boolean;
  min?: number;
  max?: number;
  options?: { value: string; labelAr: string; labelFr: string; labelEn: string }[];
  helpTextAr?: string;
  helpTextFr?: string;
  helpTextEn?: string;
}

export interface MixDesignMethodDefinition {
  id: MixDesignMethodId;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  category: MethodCategory;
  implementationStatus: MethodImplementationStatus;
  descriptionAr: string;
  descriptionFr: string;
  descriptionEn: string;
  useCasesAr: string[];
  useCasesFr: string[];
  useCasesEn: string[];
  requiredInputs: MethodInputField[];
  optionalInputs: MethodInputField[];
  limitationsAr: string[];
  limitationsFr: string[];
  limitationsEn: string[];
  outputType: "complete-mix" | "grading-analysis" | "strength-model" | "supporting-analysis";
}

export interface MixDesignResult {
  methodId: MixDesignMethodId;
  status: "success" | "warning" | "incomplete" | "not-supported";
  category: "complete-design" | "supporting-model";
  implementationStatus?: MethodImplementationStatus;
  isStandaloneCompleteMethod?: boolean;
  quantities?: {
    cementKgPerM3?: number;
    waterLPerM3?: number;
    sandKgPerM3?: number;
    coarseAggregateKgPerM3?: number;
    admixtureKgOrLPerM3?: number;
  };
  ratios?: {
    waterCementRatio?: number;
    sandAggregateRatio?: number;
  };
  grading?: {
    sieveSizes?: number[];
    targetPassing?: number[];
    actualPassing?: number[];
    deviation?: number[];
  };
  strength?: {
    targetStrength?: number;
    predictedStrength?: number;
    characteristicStrength?: number;
  };
  warnings: string[];
  assumptions: string[];
  calculationSteps: string[];
  limitations: string[];

  // Preservation fields to prevent information loss between layers
  isValid?: boolean;
  valid?: boolean;
  errors?: string[];
  recommendations?: string[];
  methodApplicability?: {
    level: "applicable" | "limited" | "not_applicable";
    reasons: string[];
  };
  theoreticalCementDemand?: number;
  actualCementUsed?: number;
  cementLimitExceeded?: boolean;
  waterDemand?: number;
  waterCementRatio?: number;
  absoluteVolumeTotal?: number;
  volumeClosureError?: number;
  calculationNotes?: string[];
  validationSummary?: string;
  absoluteVolumeCheck?: any;
  compliance?: any;
  standardsCompliance?: any;
  materialSuitability?: any;
}
