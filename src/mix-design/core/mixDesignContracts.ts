import type { MixDesignInput } from "./types";

export type ConcreteTypeCode =
  | "NSC" | "RC" | "PUMPED" | "MASS" | "MARINE" | "PRECAST" | "PRESTRESSED"
  | "HSC" | "HPC" | "SCC" | "FRC" | "LWC" | "HWC" | "RCC" | "SHOTCRETE"
  | "GPC" | "SHC" | "RAC" | "PERVIOUS" | "UHPC" | "BFUP";

export type RequiredInputKey = keyof MixDesignInput;

export interface MixDesignInputContract {
  concreteType: ConcreteTypeCode;
  methodId: string;
  requiredInputs: RequiredInputKey[];
  engineeringFramework: string;
  trialMixRequired: boolean;
}

const COMMON: RequiredInputKey[] = [
  "fck28", "dMax", "cementType", "cementClassStrength", "cementDensity",
  "moistureSand", "moistureGravel", "airContent"
];

export const MIX_DESIGN_CONTRACTS: Record<ConcreteTypeCode, MixDesignInputContract> = {
  NSC: { concreteType: "NSC", methodId: "dreux-gorisse", requiredInputs: [...COMMON, "slump", "aggregateType", "sandRelativeDensity", "gravelRelativeDensity"], engineeringFramework: "Dreux-Gorisse + EN 206", trialMixRequired: true },
  RC: { concreteType: "RC", methodId: "dreux-gorisse", requiredInputs: [...COMMON, "slump", "aggregateType"], engineeringFramework: "Dreux-Gorisse + structural verification", trialMixRequired: true },
  PUMPED: { concreteType: "PUMPED", methodId: "dreux-gorisse", requiredInputs: [...COMMON, "slump", "aggregateType"], engineeringFramework: "Dreux-Gorisse + pumpability verification", trialMixRequired: true },
  MASS: { concreteType: "MASS", methodId: "dreux-gorisse", requiredInputs: [...COMMON, "slump", "aggregateType"], engineeringFramework: "Dreux-Gorisse + thermal verification", trialMixRequired: true },
  MARINE: { concreteType: "MARINE", methodId: "dreux-gorisse", requiredInputs: [...COMMON, "slump", "aggregateType"], engineeringFramework: "Dreux-Gorisse + durability verification", trialMixRequired: true },
  PRECAST: { concreteType: "PRECAST", methodId: "dreux-gorisse", requiredInputs: [...COMMON, "slump", "aggregateType"], engineeringFramework: "Dreux-Gorisse + precast verification", trialMixRequired: true },
  PRESTRESSED: { concreteType: "PRESTRESSED", methodId: "dreux-gorisse", requiredInputs: [...COMMON, "slump", "aggregateType"], engineeringFramework: "Dreux-Gorisse + prestressed verification", trialMixRequired: true },
  HSC: { concreteType: "HSC", methodId: "hsc-hpc-specialized", requiredInputs: [...COMMON, "dosageSuper", "dosageSilicaFume", "hscWaterKgM3", "hscWaterBinderRatio"], engineeringFramework: "HSC specialized binder/W-B design", trialMixRequired: true },
  HPC: { concreteType: "HPC", methodId: "hsc-hpc-specialized", requiredInputs: [...COMMON, "dosageSuper", "hpcWaterKgM3", "hpcWaterBinderRatio"], engineeringFramework: "HPC binder/SCM/durability design", trialMixRequired: true },
  SCC: { concreteType: "SCC", methodId: "scc-specialized", requiredInputs: [...COMMON, "sccTargetSlumpFlowMm", "sccPowderKgM3", "sccWaterPowderRatioByVolume", "sccCoarseAggregateVolumeFraction"], engineeringFramework: "EFNARC SCC proportioning", trialMixRequired: true },
  FRC: { concreteType: "FRC", methodId: "fiber-reinforced-specialized", requiredInputs: [...COMMON, "frcWaterBinderRatio", "frcFiberVolumePercent", "fiberType", "fiberDensity"], engineeringFramework: "FRC base mix + fiber performance design", trialMixRequired: true },
  LWC: { concreteType: "LWC", methodId: "lightweight-specialized", requiredInputs: [...COMMON, "lwcTargetDensityKgM3", "lwcWaterKgM3", "lwcWaterBinderRatio", "lightweightAggregateDensity", "lightweightAggregateAbsorption"], engineeringFramework: "Lightweight aggregate SSD/pre-wetting design", trialMixRequired: true },
  HWC: { concreteType: "HWC", methodId: "heavyweight-specialized", requiredInputs: [...COMMON, "hwcTargetDensityKgM3", "hwcWaterKgM3", "hwcWaterBinderRatio", "heavyweightAggregateDensity"], engineeringFramework: "Heavyweight aggregate volumetric/density design", trialMixRequired: true },
  RCC: { concreteType: "RCC", methodId: "rcc-specialized", requiredInputs: [...COMMON, "rccWaterKgM3", "rccWaterBinderRatio", "rccOptimumMoisturePercent", "rccMaxDryDensityKgM3", "rccCompactionTargetPercent"], engineeringFramework: "RCC moisture-density/compaction design", trialMixRequired: true },
  SHOTCRETE: { concreteType: "SHOTCRETE", methodId: "shotcrete-specialized", requiredInputs: [...COMMON, "shotcreteWaterKgM3", "shotcreteWaterBinderRatio", "shotcreteAcceleratorPercent"], engineeringFramework: "Wet/dry shotcrete rebound and accelerator design", trialMixRequired: true },
  GPC: { concreteType: "GPC", methodId: "geopolymer-specialized", requiredInputs: [...COMMON, "gpcPrecursorKgM3", "gpcActivatorLiquidKgM3", "gpcWaterKgM3", "gpcWaterBinderRatio", "gpcActivatorToPrecursorRatio"], engineeringFramework: "Alkali-activated geopolymer design", trialMixRequired: true },
  SHC: { concreteType: "SHC", methodId: "self-healing-specialized", requiredInputs: [...COMMON, "shcCementKgM3", "shcWaterKgM3", "shcWaterBinderRatio", "shcHealingAgentDosageKgM3", "shcHealingAgentDensityKgM3", "shcHealingAgentType"], engineeringFramework: "Base mix + self-healing agent volume/compatibility design", trialMixRequired: true },
  RAC: { concreteType: "RAC", methodId: "recycled-aggregate-specialized", requiredInputs: [...COMMON, "racCementKgM3", "racWaterKgM3", "racWaterBinderRatio", "racCoarseAggregateKgM3", "racReplacementPercent", "racRecycledAggregateDensityKgM3", "racRecycledAbsorptionPercent", "racPreSaturationPercent"], engineeringFramework: "Recycled aggregate absorption/SSD correction design", trialMixRequired: true },
  PERVIOUS: { concreteType: "PERVIOUS", methodId: "pervious-specialized", requiredInputs: [...COMMON, "perviousTargetVoidContentPercent", "perviousTargetPermeabilityMmPerS", "perviousPasteVolumePercent", "perviousWaterBinderRatio"], engineeringFramework: "Pervious void/permeability design", trialMixRequired: true },
  UHPC: { concreteType: "UHPC", methodId: "uhpc-specialized", requiredInputs: [...COMMON, "uhpcWaterBinderRatio", "uhpcFiberVolumePercent", "uhpcQuartzPowderKgM3", "dosageSuper"], engineeringFramework: "UHPC fine-powder packing and fiber design", trialMixRequired: true },
  BFUP: { concreteType: "BFUP", methodId: "uhpc-specialized", requiredInputs: [...COMMON, "bfupWaterBinderRatio", "bfupFiberVolumePercent", "bfupQuartzPowderKgM3", "dosageSuper", "fiberType", "fiberDensity"], engineeringFramework: "UHPC/BFUP powder packing and fiber design", trialMixRequired: true }
};

export function getMixDesignContract(concreteType: unknown): MixDesignInputContract | undefined {
  const code = typeof concreteType === "string"
    ? concreteType.trim().toUpperCase() as ConcreteTypeCode
    : String((concreteType as any)?.code || "").trim().toUpperCase() as ConcreteTypeCode;
  return MIX_DESIGN_CONTRACTS[code];
}

export function missingContractInputs(input: MixDesignInput, contract: MixDesignInputContract): string[] {
  return contract.requiredInputs.filter((key) => {
    const value = input[key];
    return value === undefined || value === null || value === "" || (typeof value === "number" && !Number.isFinite(value));
  }).map(String);
}
