import { MixDesignMethodId } from "../mix-design-methods/types";

export interface MixDesignInput {
  enforceInputContract?: boolean;      // User-facing strict gate; legacy unit tests may omit it
  bypassSuitabilityGate?: boolean;   // Bypass suitability check for legacy math unit tests
  fck28: number;                     // Target compressive strength in MPa
  controlClass: "high" | "normal" | "low";  // Site control class
  cementType: string;                 // Cement type
  cementClassStrength: number;       // Nominal strength rating of cement (MPa)
  dMax: number;                      // Max aggregate size in mm
  slump: number;                     // Target slump in cm
  aggregateType: "roule" | "concasse"; // Round or Crushed
  aggregateQuality: "excellent" | "standard" | "poor";
  hasPumping: boolean;               // Wet/dry/pumped adjustment
  sandRelativeDensity: number;       // e.g. 2.65
  gravelRelativeDensity: number;     // e.g. 2.68
  cementDensity: number;             // e.g. 3100 kg/m3
  airContent: number;                // e.g. 1.0 (percent)
  moistureSand: number;              // moisture sand (percent)
  moistureGravel: number;            // moisture gravel (percent)
  sandAbsorption?: number;           // sand absorption (percent)
  gravelAbsorption?: number;         // gravel absorption (percent)
  finenessModulus?: number;          // sand fineness modulus (percent)
  
  // Custom dosages
  dosageSuper?: number;
  dosageAir?: number;
  dosageRetarder?: number;
  dosageAccelerator?: number;
  dosageSilicaFume?: number;
  dosageFlyAsh?: number;
  dosageSlag?: number;

  selectedMethod: "dreux";
  methodId?: string;
  exposureClass?: string;
  durabilityLevel?: string;
  carbonationLevel?: string;
  chloridesLevel?: string;
  sulfatesLevel?: string;
  
  // Custom prices
  priceCement?: number;
  priceSand?: number;
  priceGravel?: number;
  priceSuper?: number;
  priceAir?: number;
  priceRetarder?: number;
  priceAccelerator?: number;
  priceSilicaFume?: number;
  priceFlyAsh?: number;
  priceSlag?: number;
  priceLabor?: number;
  priceWater?: number;
  costBasis?: "dry" | "wet";

  concreteType?: string;
  sandType?: string;
  gravelType?: string;
  autoDensities?: boolean;
  hydrationStrengthRatio?: number;
  selectedAdmixtureWaterReduction?: number;
  selectedAdmixtureDensity?: number;
  selectedAdmixtureName?: string;
  selectedSandId?: string;
  selectedGravelId?: string;
  selectedCementId?: string;
  selectedAdmixtureId?: string;
  selectedScmId?: string;
  selectedWaterId?: string;

  // Material Calculation Influence Layer properties
  selectedWaterName?: string;
  selectedWaterPH?: number;
  selectedWaterChlorideContent?: number;
  selectedWaterSulphateContent?: number;
  selectedWaterTemperature?: number;
  selectedLightweightAggregateId?: string;
  selectedLightweightAggregateName?: string;
  lightweightAggregateDensity?: number;
  lightweightAggregateAbsorption?: number;
  lightweightAggregateMoisture?: number;
  lightweightPorosityIndex?: number;
  selectedHeavyweightAggregateId?: string;
  selectedHeavyweightAggregateName?: string;
  heavyweightAggregateDensity?: number;
  heavyweightAggregateAbsorption?: number;
  heavyweightAggregateMoisture?: number;
  heavyweightType?: string;
  selectedFiberId?: string;
  selectedFiberName?: string;
  fiberType?: string;
  fiberDosageKgM3?: number;
  fiberDensity?: number;
  fiberLengthMm?: number;
  fiberDiameterMm?: number;
  fiberTensileStrengthMPa?: number;
  selectedAirContentMaterialId?: string;
  selectedAirContentMaterialName?: string;
  selectedAirPercentage?: number;
  selectedSpecialBinderId?: string;
  selectedSpecialBinderName?: string;
  specialBinderDensity?: number;
  specialBinderReplacementPercent?: number;
  specialBinderAlkalineRatio?: number;
  specialBinderStrengthClass?: string;
  selectedScmDensity?: number;
  selectedScmName?: string;
  selectedScmReplacementPercent?: number;
  selectedScmWaterDemandFactor?: number;
  selectedScmPozzolanicIndex?: number;
  selectedQuartzPowderId?: string;
  selectedQuartzPowderName?: string;
  quartzPowderDensity?: number;

  // Specialized SCC / self-compacting concrete initial proportioning inputs.
  sccPowderKgM3?: number;
  sccPowderVolumeL?: number;
  sccWaterKgM3?: number;
  sccWaterPowderRatioByVolume?: number;
  sccCoarseAggregateVolumeFraction?: number;
  sccTargetSlumpFlowMm?: number;
  sccT500Seconds?: number;
  sccVFunnelSeconds?: number;
  sccLBoxRatio?: number;
  sccJRingDifferenceMm?: number;
  sccSegregationResistancePercent?: number;
  sccVmaDosage?: number;
  sccSuperplasticizerDosage?: number;
  sccScmReplacementPercent?: number;
  // SCC fresh-property / EFNARC-oriented proportioning controls.

  // Specialized lightweight concrete proportioning inputs.
  targetDensity?: number;
  lwcTargetDensityKgM3?: number;
  lwcWaterKgM3?: number;
  lwcWaterBinderRatio?: number;
  lwcPrewetDegreePercent?: number;

  // Specialized UHPC / BFUP proportioning inputs.
  uhpcWaterBinderRatio?: number;
  bfupWaterBinderRatio?: number;
  uhpcFiberVolumePercent?: number;
  bfupFiberVolumePercent?: number;
  uhpcQuartzPowderKgM3?: number;
  bfupQuartzPowderKgM3?: number;
  hscWaterKgM3?: number;
  hscWaterBinderRatio?: number;
  hpcWaterKgM3?: number;
  hpcWaterBinderRatio?: number;
  hpcCoarseAggregateVolumeFraction?: number;

  // Specialized roller-compacted concrete (RCC/BCR) proportioning inputs.
  // These are intentionally laboratory/project inputs: RCC water is governed by
  // the moisture-density relationship rather than conventional slump design.
  rccWaterKgM3?: number;
  rccWaterBinderRatio?: number;
  rccOptimumMoisturePercent?: number;
  rccMaxDryDensityKgM3?: number;
  rccFineAggregatePercent?: number;
  rccCompactionTargetPercent?: number;
  rccCompactionEnergyKJm3?: number;
  rccVebeTimeSeconds?: number;
  rccCombinedVoidPercent?: number;

  // Specialized heavyweight concrete proportioning inputs.
  hwcTargetDensityKgM3?: number;
  hwcWaterKgM3?: number;
  hwcWaterBinderRatio?: number;

  // Phase-2 specialized concrete proportioning inputs.
  gpcPrecursorKgM3?: number;
  gpcActivatorLiquidKgM3?: number;
  gpcWaterKgM3?: number;
  gpcWaterBinderRatio?: number;
  gpcActivatorToPrecursorRatio?: number;
  gpcCoarseAggregateVolumeFraction?: number;
  racCementKgM3?: number;
  racWaterKgM3?: number;
  racWaterBinderRatio?: number;
  racCoarseAggregateKgM3?: number;
  racReplacementPercent?: number;
  racRecycledAggregateDensityKgM3?: number;
  racRecycledAbsorptionPercent?: number;
  racPreSaturationPercent?: number;
  racSuperplasticizerDosage?: number;
  shcCementKgM3?: number;
  shcWaterKgM3?: number;
  shcWaterBinderRatio?: number;
  shcHealingAgentDosageKgM3?: number;
  shcHealingAgentDensityKgM3?: number;
  shcHealingAgentType?: string;
  shcCoarseAggregateVolumeFraction?: number;
  shcSuperplasticizerDosage?: number;
  shotcreteWaterKgM3?: number;
  shotcreteWaterBinderRatio?: number;
  shotcreteCementFraction?: number;
  shotcreteAcceleratorPercent?: number;
  shotcreteSuperplasticizerPercent?: number;
  shotcreteCoarseAggregateVolumeFraction?: number;
  shotcreteExecutionMethod?: "wet" | "dry";
  shotcreteReboundPercent?: number;
  shotcreteEarlyStrengthMPa?: number;

  // Specialized fiber-reinforced concrete proportioning inputs.
  frcWaterBinderRatio?: number;
  frcWaterKgM3?: number;
  frcFiberVolumePercent?: number;
  frcCoarseAggregateVolumeFraction?: number;
  frcSuperplasticizerDosage?: number;

  // Pervious concrete void/permeability design inputs.
  perviousTargetVoidContentPercent?: number;
  perviousTargetPermeabilityMmPerS?: number;
  perviousPasteVolumePercent?: number;
  perviousWaterBinderRatio?: number;
  perviousCompactionMethod?: string;

  priceFiber?: number;
  priceSpecialBinder?: number;
  admixtures?: any[];
  materialsDatabase?: any[];
}

export interface MethodApplicability {
  applicable: boolean;
  level: "applicable" | "limited" | "not_applicable";
  reasons: string[];
  recommendations: string[];
}

export interface MixDesignResult {
  methodName: string;
  calculationMethod?: string;
  engineVersion?: string;
  engineeringFramework?: string;
  trialMixRequired?: boolean;
  cementKg: number;
  waterKg: number;
  fineAggregateKg: number;
  coarseAggregateKg: number;
  admixtureKg: number;
  airContentPercent: number;
  wcRatio: number;
  freshDensityKgM3: number;
  absoluteVolumeCheck: {
    isValid: boolean;
    totalAbsVolumeL: number;
    cementVolL: number;
    waterVolL: number;
    sandVolL: number;
    gravelVolL: number;
    airVolL: number;
    admixtureVolL: number;
    deviationPercent: number;
  };
  warnings: string[];
  errors: string[];
  assumptions: string[];
  flyAshKg?: number;
  slagKg?: number;
  silicaFumeKg?: number;
  totalBinder?: number;
  activeCementWeight?: number;
  compliance: {
    standardName: string;
    isCompliant: boolean;
    checks: {
      parameter: string;
      requirement: string;
      actual: string;
      status: "compliant" | "warning" | "non_compliant";
    }[];
  };
  methodApplicability?: MethodApplicability;
  recommendations?: string[];
  theoreticalCementDemand?: number;
  actualCementUsed?: number;
  cementLimitExceeded?: boolean;
  waterDemand?: number;
  waterCementRatio?: number;
  absoluteVolumeTotal?: number;
  volumeClosureError?: number;
  calculationNotes?: string[];
  validationSummary?: string;
  inputSnapshot?: MixDesignInput;
  status?: "success" | "warning" | "incomplete" | "not-supported" | "needs-data" | "needs-trial-mix" | "blocked";
  calculationStatus?: "valid" | "valid_with_warnings" | "needs_data" | "needs_trial_mix" | "blocked";
  engineStatus?: "valid" | "valid_with_warnings" | "needs_data" | "needs_trial_mix" | "blocked";
  reasonCode?: string;
  calculationSteps?: unknown[];
  materialSuitability?: {
    status: "approved" | "warning" | "blocked" | "diagnostic_only";
    missingMaterials: string[];
    invalidMaterials: string[];
    incompatibleMaterials: string[];
    warnings: string[];
    recommendations: string[];
  };
  isValid?: boolean;
  valid?: boolean;
  standardsCompliance?: any;
}
