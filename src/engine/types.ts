import { MixDesignMethodId } from "../mix-design-methods/types";

export interface MixDesignInput {
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
