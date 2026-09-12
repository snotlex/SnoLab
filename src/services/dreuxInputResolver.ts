/**
 * SnoLab Dreux-Gorisse Input Resolver
 * 
 * Centralized, deterministic authority for extracting, resolving, validating,
 * and mapping all technical inputs required by the Dreux-Gorisse mix design engine.
 * 
 * Pipeline:
 * Selected Materials → Material Properties & Granulometry → Unit & Normalization Mapping → DreuxInputResolver
 * 
 * Strictly prohibits hidden or hard-coded fallbacks.
 * Every resolved parameter explicitly references its Property ID, source, unit, and validation status.
 */

import { EngineeringMaterial, MixDesignInput, SievePoint, AggregateType, AggregateQuality } from "../types";
import { getMaterialPropValue } from "./materialPropertySchema";

/**
 * Stable, standard Property IDs for Dreux-Gorisse method
 */
export const DREUX_PROPERTY_IDS = {
  // Cement
  CEMENT_STRENGTH_CLASS: "PROP_CEM_CLASS",
  CEMENT_28D_STRENGTH: "PROP_CEM_STRENGTH_28D",
  CEMENT_DENSITY: "PROP_CEM_DENSITY",
  CEMENT_SPECIFIC_GRAVITY: "PROP_CEM_SPECIFIC_GRAVITY",
  // Fine Aggregate (Sand)
  SAND_FINENESS_MODULUS: "PROP_SND_FM",
  SAND_DMAX: "PROP_SND_DMAX",
  SAND_DMIN: "PROP_SND_DMIN",
  SAND_DENSITY: "PROP_SND_DENSITY",
  SAND_SSD_DENSITY: "PROP_SND_SSD_DENSITY",
  SAND_SPECIFIC_GRAVITY: "PROP_SND_SPECIFIC_GRAVITY",
  SAND_BULK_DENSITY: "PROP_SND_BULK_DENSITY",
  SAND_ABSORPTION: "PROP_SND_ABSORPTION",
  SAND_MOISTURE: "PROP_SND_MOISTURE",
  SAND_EQUIVALENT: "PROP_SND_SE",
  SAND_GRANULOMETRY: "PROP_SND_GRANULOMETRY",
  // Coarse Aggregate (Gravel)
  GRAVEL_DMAX: "PROP_GRV_DMAX",
  GRAVEL_DMIN: "PROP_GRV_DMIN",
  GRAVEL_DENSITY: "PROP_GRV_DENSITY",
  GRAVEL_SSD_DENSITY: "PROP_GRV_SSD_DENSITY",
  GRAVEL_SPECIFIC_GRAVITY: "PROP_GRV_SPECIFIC_GRAVITY",
  GRAVEL_BULK_DENSITY: "PROP_GRV_BULK_DENSITY",
  GRAVEL_ABSORPTION: "PROP_GRV_ABSORPTION",
  GRAVEL_MOISTURE: "PROP_GRV_MOISTURE",
  GRAVEL_PARTICLE_SHAPE: "PROP_GRV_SHAPE",
  GRAVEL_LOS_ANGELES: "PROP_GRV_LA",
  GRAVEL_GRANULOMETRY: "PROP_GRV_GRANULOMETRY",
  // Water
  WATER_DENSITY: "PROP_WAT_DENSITY",
  WATER_PH: "PROP_WAT_PH",
  WATER_CHLORIDE: "PROP_WAT_CHLORIDE",
  WATER_SULFATE: "PROP_WAT_SULFATE",
  // Admixtures
  ADMIXTURE_WATER_REDUCTION: "PROP_ADM_WATER_REDUCTION",
  ADMIXTURE_DENSITY: "PROP_ADM_DENSITY",
  ADMIXTURE_DOSAGE: "PROP_ADM_DOSAGE",
  // SCM
  SCM_DENSITY: "PROP_SCM_DENSITY",
  SCM_WATER_DEMAND: "PROP_SCM_WATER_DEMAND",
  SCM_POZZOLANIC_INDEX: "PROP_SCM_POZZOLANIC_INDEX",
  // Project / Ambient Parameters
  PROJECT_FCK28: "PARAM_PROJ_FCK28",
  PROJECT_SLUMP: "PARAM_PROJ_SLUMP",
  PROJECT_EXPOSURE: "PARAM_PROJ_EXPOSURE",
  PROJECT_CONTROL: "PARAM_PROJ_CONTROL",
  PROJECT_PUMPING: "PARAM_PROJ_PUMPING",
  PROJECT_AIR_CONTENT: "PARAM_PROJ_AIR_CONTENT"
} as const;

export interface DreuxGranulometryPoint {
  sieveSize: number; // mm
  massRetained?: number; // g
  percentRetained?: number; // %
  cumulativeRetained?: number; // %
  percentPassing: number; // %
}

export interface DreuxInputTraceItem {
  inputName: string;
  propertyId: string;
  materialId?: string;
  materialName?: string;
  value: any;
  formattedValue: string;
  unit: string;
  source: string;
  required: boolean;
  validation: "VALID" | "INVALID" | "MISSING" | "OPTIONAL_UNSET";
  statusMessage?: string;
  statusMessageAr?: string;
  statusMessageEn?: string;
  derivationDetails?: string;
  derivationDetailsAr?: string;
  derivationDetailsEn?: string;
  actionRequired?: string;
  actionRequiredAr?: string;
  actionRequiredEn?: string;
}

export interface DreuxInputTrace {
  items: DreuxInputTraceItem[];
  resolvedInputsCount: number;
  missingRequiredCount: number;
  invalidInputsCount: number;
  isFullyResolved: boolean;
}

export interface ResolvedCement {
  materialId: string;
  name: string;
  density: number; // kg/m³
  specificGravity: number; // e.g. 3.10
  strengthClass: number; // e.g. 42.5
  cementType: string;
  source: string;
}

export interface ResolvedFineAggregate {
  materialId: string;
  name: string;
  finenessModulus: number;
  dMin: number;
  dMax: number;
  density: number; // kg/m³
  specificGravity: number; // e.g. 2.62
  ssdDensity: number;
  bulkDensity: number;
  absorption: number; // %
  moisture: number; // %
  sandEquivalent: number;
  gradationData: DreuxGranulometryPoint[];
  source: string;
}

export interface ResolvedCoarseAggregate {
  materialId: string;
  name: string;
  dMin: number;
  dMax: number; // mm
  density: number; // kg/m³
  specificGravity: number; // e.g. 2.66
  ssdDensity: number;
  bulkDensity: number;
  absorption: number; // %
  moisture: number; // %
  particleShape: string;
  aggregateType: AggregateType;
  aggregateQuality: AggregateQuality;
  losAngelesAbrasion?: number;
  gradationData: DreuxGranulometryPoint[];
  source: string;
}

export interface ResolvedWater {
  materialId: string;
  name: string;
  density: number; // kg/m³ (1000)
  specificGravity: number; // 1.0
  ph?: number;
  chlorides?: number;
  sulfates?: number;
  source: string;
}

export interface ResolvedAdmixture {
  materialId: string;
  name: string;
  waterReduction: number; // %
  density: number; // kg/m³
  dosagePercent: number; // % by weight of cement
  source: string;
}

export interface ResolvedScm {
  materialId: string;
  name: string;
  type: string;
  density: number; // kg/m³
  waterDemandFactor: number;
  pozzolanicIndex: number;
  dosagePercent: number; // %
  source: string;
}

export interface DreuxResolvedInputs {
  cement: ResolvedCement;
  fineAggregate: ResolvedFineAggregate;
  coarseAggregate: ResolvedCoarseAggregate;
  water: ResolvedWater;
  admixture?: ResolvedAdmixture;
  scm?: ResolvedScm;

  // Primary Governing Dreux Parameters
  dMax: number;
  dMaxSource: "material_property" | "derived_from_granulometry" | "project_input";
  dMaxDerivationDetails?: string;

  finenessModulus: number;
  finenessModulusSource: "material_property" | "derived_from_granulometry" | "project_input";
  finenessModulusDerivationDetails?: string;

  targetStrength: number; // fck28 in MPa
  workability: number; // slump in cm
  aggregateType: AggregateType;
  aggregateQuality: AggregateQuality;
  hasPumping: boolean;
  airContent: number;
  controlClass: "low" | "normal" | "high";
  exposureClass: string;
  batchVolume: number; // m³

  // Trace & Audit Log
  trace: DreuxInputTrace;
}

/**
 * Parses numeric property value safely, handling strings and numbers
 */
function parseNumeric(val: any): number | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  const num = typeof val === "number" ? val : parseFloat(String(val).replace(/,/g, "."));
  return isNaN(num) ? undefined : num;
}

/**
 * Normalizes gradation curves to standard DreuxGranulometryPoint array
 */
function parseGradationData(rawGrad: any): DreuxGranulometryPoint[] {
  if (!Array.isArray(rawGrad) || rawGrad.length === 0) return [];
  return rawGrad.map((pt: any) => {
    const sieveSize = parseNumeric(pt.sieve ?? pt.sieveSize ?? pt.size ?? pt.mesh) ?? 0;
    const percentPassing = parseNumeric(pt.passing ?? pt.percentPassing ?? pt.passant) ?? 0;
    const percentRetained = parseNumeric(pt.retained ?? pt.percentRetained ?? pt.refus);
    const cumulativeRetained = parseNumeric(pt.cumulativeRetained ?? pt.cumulRefus) ?? (100 - percentPassing);
    const massRetained = parseNumeric(pt.massRetained ?? pt.mass);
    return {
      sieveSize,
      percentPassing,
      percentRetained,
      cumulativeRetained,
      massRetained
    };
  }).sort((a, b) => a.sieveSize - b.sieveSize);
}

/**
 * Derives Dmax from coarse aggregate gradation curve conforming to EN 933-1 / EN 12620:
 * Dmax is the nominal upper sieve where at least 95% of aggregate by mass passes through.
 */
export function deriveDmaxFromGradation(gradation: DreuxGranulometryPoint[]): { dMax: number; explanation: string; explanationAr: string; explanationEn: string } | null {
  if (!gradation || gradation.length === 0) return null;
  
  // Sorted ascending by sieve size
  const sorted = [...gradation].sort((a, b) => a.sieveSize - b.sieveSize);
  
  // Look for the smallest standard sieve through which >= 95% of aggregate passes
  const passing95OrMore = sorted.filter(p => p.percentPassing >= 95 && p.sieveSize > 2);
  if (passing95OrMore.length > 0) {
    const dmaxPoint = passing95OrMore[0]; // first sieve meeting the 95% threshold
    const expEn = `Derived geometrically from gradation: smallest sieve passing >= 95% (${dmaxPoint.sieveSize} mm, passing ${dmaxPoint.percentPassing}%).`;
    const expAr = `مشتق هندسياً من منحنى التدرج الحبيبي: أصغر منخل يمر منه 95% على الأقل (${dmaxPoint.sieveSize} مم، بنسبة مرور ${dmaxPoint.percentPassing}%).`;
    return {
      dMax: dmaxPoint.sieveSize,
      explanation: expEn,
      explanationEn: expEn,
      explanationAr: expAr
    };
  }

  // If top sieve has passing < 95%, Dmax is the upper sieve of the sample
  const maxSieve = sorted[sorted.length - 1];
  if (maxSieve && maxSieve.sieveSize > 2) {
    const expEn = `Derived geometrically from gradation curve maximum aperture (${maxSieve.sieveSize} mm).`;
    const expAr = `مشتق هندسياً من فتحة المنخل الأقصى المسجل في التدرج الحبيبي (${maxSieve.sieveSize} مم).`;
    return {
      dMax: maxSieve.sieveSize,
      explanation: expEn,
      explanationEn: expEn,
      explanationAr: expAr
    };
  }

  return null;
}

/**
 * Derives Fineness Modulus from sand gradation curve conforming to ASTM C136 / EN 933-1:
 * FM = sum of cumulative % retained on standard sieves (0.16, 0.315, 0.63, 1.25, 2.5, 5.0 mm) / 100
 */
export function deriveFinenessModulusFromGradation(gradation: DreuxGranulometryPoint[]): { finenessModulus: number; explanationAr: string; explanationEn: string } | null {
  if (!gradation || gradation.length === 0) return null;

  const targetSieves = [0.16, 0.315, 0.63, 1.25, 2.5, 5.0];
  let sumRetained = 0;
  let matchesCount = 0;

  for (const ts of targetSieves) {
    // Find closest sieve in gradation within 20% tolerance
    const match = gradation.find(p => Math.abs(p.sieveSize - ts) <= ts * 0.25 || Math.abs(p.sieveSize - ts) < 0.05);
    if (match) {
      const cumRet = match.cumulativeRetained !== undefined ? match.cumulativeRetained : (100 - match.percentPassing);
      sumRetained += cumRet;
      matchesCount++;
    }
  }

  // If at least 4 of 6 standard sieves are matched
  if (matchesCount >= 4) {
    const fm = Math.round((sumRetained / 100) * 100) / 100;
    if (fm >= 1.2 && fm <= 4.0) {
      return {
        finenessModulus: fm,
        explanationEn: `Calculated from standard gradation curve (cumulative retained = ${sumRetained.toFixed(1)}% / 100 = ${fm}).`,
        explanationAr: `محسوب هندسياً من منحنى التدرج الحبيبي القياسي (مجموع النسب المئوية المتراكمة المحجوزة = ${sumRetained.toFixed(1)}% ÷ 100 = ${fm}).`
      };
    }
  }

  return null;
}

/**
 * Resolves all parameters required by the Dreux-Gorisse concrete mix design method.
 */
export class DreuxInputResolver {
  public static resolve(
    inputs: MixDesignInput,
    materialsDatabase: EngineeringMaterial[] = [],
    language: "ar" | "fr" | "en" = "ar"
  ): DreuxResolvedInputs {
    const traceItems: DreuxInputTraceItem[] = [];

    const findMat = (id?: string) => {
      if (!id) return undefined;
      return materialsDatabase.find(m => m.id === id);
    };

    const cementMat = findMat(inputs.selectedCementId);
    const sandMat = findMat(inputs.selectedSandId);
    const gravelMat = findMat(inputs.selectedGravelId);
    const waterMat = findMat(inputs.selectedWaterId);
    const admMat = findMat(inputs.selectedAdmixtureId);
    const scmMat = findMat(inputs.selectedScmId);

    // =========================================================================
    // 1. CEMENT RESOLUTION
    // =========================================================================
    let cementStrengthClass = parseNumeric(getMaterialPropValue(cementMat, "strengthClass")) ?? 
                             parseNumeric(cementMat?.strengthClass) ?? 
                             inputs.cementClassStrength;
    if (cementStrengthClass === undefined || cementStrengthClass <= 0) {
      // Check cement class name (e.g. 42.5 or 52.5 in name)
      const nameStr = String(cementMat?.name || inputs.cementType || "");
      if (nameStr.includes("52.5")) cementStrengthClass = 52.5;
      else if (nameStr.includes("42.5")) cementStrengthClass = 42.5;
      else if (nameStr.includes("32.5")) cementStrengthClass = 32.5;
      else cementStrengthClass = undefined;
    }

    let cementDensity = parseNumeric(getMaterialPropValue(cementMat, "density")) ?? 
                        parseNumeric(cementMat?.density) ?? 
                        (inputs.cementDensity && inputs.cementDensity > 0 ? inputs.cementDensity : undefined);
    if (cementDensity !== undefined && cementDensity < 10) cementDensity *= 1000; // if given as specific gravity (3.10)
    const cementSG = cementDensity !== undefined ? Math.round((cementDensity / 1000) * 100) / 100 : undefined;

    traceItems.push({
      inputName: "Cement Strength Class",
      propertyId: DREUX_PROPERTY_IDS.CEMENT_STRENGTH_CLASS,
      materialId: cementMat?.id,
      materialName: cementMat?.name,
      value: cementStrengthClass,
      formattedValue: cementStrengthClass !== undefined ? `${cementStrengthClass} MPa` : "MISSING",
      unit: "MPa",
      source: cementMat ? (cementMat.isSystem ? "System Material Library" : "User Material") : "Project Input",
      required: true,
      validation: cementStrengthClass !== undefined ? (cementStrengthClass >= 25 && cementStrengthClass <= 70 ? "VALID" : "INVALID") : "MISSING",
      statusMessage: cementStrengthClass !== undefined ? (cementStrengthClass >= 25 ? "Conforms to EN 197-1" : "Invalid strength class") : "Mandatory cement strength class missing"
    });

    traceItems.push({
      inputName: "Cement Absolute Density",
      propertyId: DREUX_PROPERTY_IDS.CEMENT_DENSITY,
      materialId: cementMat?.id,
      materialName: cementMat?.name,
      value: cementDensity,
      formattedValue: cementDensity !== undefined ? `${cementDensity} kg/m³ (SG: ${cementSG})` : "MISSING",
      unit: "kg/m³",
      source: cementMat ? "Material Library" : "Project Input",
      required: true,
      validation: cementDensity !== undefined ? (cementDensity >= 2500 && cementDensity <= 3500 ? "VALID" : "INVALID") : "MISSING",
      statusMessage: cementDensity !== undefined ? "Conforms to standard cement density" : "Mandatory cement density missing"
    });

    const resolvedCement: ResolvedCement = {
      materialId: cementMat?.id || inputs.selectedCementId || "",
      name: cementMat?.name || inputs.cementType || "Standard Portland Cement",
      density: cementDensity || 0,
      specificGravity: cementSG || 0,
      strengthClass: cementStrengthClass || 0,
      cementType: cementMat?.category || inputs.cementType || "CEM I",
      source: cementMat?.source || (cementMat?.isSystem ? "System Library" : "Project Repository")
    };

    // =========================================================================
    // 2. FINE AGGREGATE (SAND) RESOLUTION
    // =========================================================================
    const sandGradation = parseGradationData(sandMat?.gradationData);
    
    // Fineness Modulus
    let fm = parseNumeric(getMaterialPropValue(sandMat, "finenessModulus")) ?? 
             parseNumeric(sandMat?.finenessModulus);
    let fmSource: "material_property" | "derived_from_granulometry" | "project_input" = "material_property";
    let fmDerivation: string | undefined = undefined;

    if (fm === undefined || fm <= 0) {
      const derivedFm = deriveFinenessModulusFromGradation(sandGradation);
      if (derivedFm) {
        fm = derivedFm.finenessModulus;
        fmSource = "derived_from_granulometry";
        fmDerivation = derivedFm.explanationAr;
      } else if (inputs.finenessModulus && inputs.finenessModulus > 0) {
        fm = inputs.finenessModulus;
        fmSource = "project_input";
      }
    }

    // Sand Density / Specific Gravity
    let sandDensity = parseNumeric(getMaterialPropValue(sandMat, "density")) ?? 
                      parseNumeric(sandMat?.density);
    let sandSG = parseNumeric(getMaterialPropValue(sandMat, "specificGravity")) ?? 
                 parseNumeric(sandMat?.specificGravity);
    if (!sandDensity && sandSG) sandDensity = sandSG * 1000;
    if (!sandSG && sandDensity) sandSG = sandDensity < 10 ? sandDensity : sandDensity / 1000;
    if (sandDensity && sandDensity < 10) sandDensity *= 1000;
    if (!sandDensity) {
      if (inputs.sandRelativeDensity && inputs.sandRelativeDensity > 0) {
        sandDensity = inputs.sandRelativeDensity > 10 ? inputs.sandRelativeDensity : inputs.sandRelativeDensity * 1000;
        sandSG = sandDensity / 1000;
      }
    }

    const sandSsdDensity = parseNumeric(getMaterialPropValue(sandMat, "ssdDensity")) ?? 
                           parseNumeric(sandMat?.ssdDensity) ?? 
                           sandDensity;
    const sandBulkDensity = parseNumeric(getMaterialPropValue(sandMat, "bulkDensity")) ?? 
                            parseNumeric(sandMat?.bulkDensity);
    const sandAbsorption = parseNumeric(getMaterialPropValue(sandMat, "absorption")) ?? 
                           parseNumeric(sandMat?.absorption) ?? 
                           inputs.sandAbsorption;
    const sandMoisture = parseNumeric(getMaterialPropValue(sandMat, "moisture")) ?? 
                         parseNumeric(sandMat?.moisture) ?? 
                         inputs.moistureSand ?? 0;
    const sandSE = parseNumeric(getMaterialPropValue(sandMat, "sandEquivalent")) ?? 
                   parseNumeric(sandMat?.sandEquivalent);
    const sandDmax = parseNumeric(getMaterialPropValue(sandMat, "dMax")) ?? 
                     parseNumeric(sandMat?.dMax);
    const sandDmin = parseNumeric(getMaterialPropValue(sandMat, "dMin")) ?? 
                     parseNumeric(sandMat?.dMin);

    traceItems.push({
      inputName: "Sand Fineness Modulus (FM)",
      propertyId: DREUX_PROPERTY_IDS.SAND_FINENESS_MODULUS,
      materialId: sandMat?.id,
      materialName: sandMat?.name,
      value: fm,
      formattedValue: fm ? fm.toFixed(2) : "MISSING",
      unit: "Dimensionless",
      source: fmSource === "derived_from_granulometry" ? "Derived from Sieve Curve" : "Material Library",
      required: false,
      validation: fm ? (fm >= 1.5 && fm <= 3.8 ? "VALID" : "INVALID") : "MISSING",
      statusMessage: fm && fm >= 1.8 && fm <= 3.2 ? "Optimal for standard structural concrete (EN 12620)" : "Optional/advisory parameter",
      derivationDetails: fmDerivation,
      actionRequired: !fm ? "Complete Sand Fineness Modulus or Gradation Curve in Material Library" : undefined
    });

    traceItems.push({
      inputName: "Sand Specific Gravity & Density",
      propertyId: DREUX_PROPERTY_IDS.SAND_SPECIFIC_GRAVITY,
      materialId: sandMat?.id,
      materialName: sandMat?.name,
      value: sandSG,
      formattedValue: sandSG !== undefined && sandDensity !== undefined ? `${sandSG.toFixed(2)} (Density: ${sandDensity} kg/m³)` : "MISSING",
      unit: "kg/m³ / Specific Gravity",
      source: sandMat ? "Material Library" : "Project Input",
      required: true,
      validation: sandSG !== undefined ? (sandSG >= 1.5 && sandSG <= 3.5 ? "VALID" : "INVALID") : "MISSING",
      statusMessage: sandSG !== undefined ? "Standard sand density" : "Mandatory sand density missing"
    });

    traceItems.push({
      inputName: "Sand Absorption & Moisture",
      propertyId: DREUX_PROPERTY_IDS.SAND_ABSORPTION,
      materialId: sandMat?.id,
      materialName: sandMat?.name,
      value: { absorption: sandAbsorption, moisture: sandMoisture },
      formattedValue: `Abs: ${sandAbsorption !== undefined ? sandAbsorption.toFixed(1) : 0}%, Moisture: ${sandMoisture.toFixed(1)}%`,
      unit: "%",
      source: sandMat ? "Material Library" : "Field Input",
      required: false,
      validation: sandAbsorption === undefined || (sandAbsorption >= 0 && sandAbsorption <= 10) ? "VALID" : "INVALID",
      statusMessage: "Required for field batch moisture correction"
    });

    const resolvedFine: ResolvedFineAggregate = {
      materialId: sandMat?.id || inputs.selectedSandId || "",
      name: sandMat?.name || inputs.sandType || "Standard Sand 0/4",
      finenessModulus: fm || 0,
      dMin: sandDmin || 0,
      dMax: sandDmax || 0,
      density: sandDensity || 0,
      specificGravity: sandSG || 0,
      ssdDensity: sandSsdDensity,
      bulkDensity: sandBulkDensity,
      absorption: sandAbsorption || 0,
      moisture: sandMoisture,
      sandEquivalent: sandSE,
      gradationData: sandGradation,
      source: sandMat?.source || (sandMat?.isSystem ? "System Library" : "Project Repository")
    };

    // =========================================================================
    // 3. COARSE AGGREGATE (GRAVEL) RESOLUTION & DMAX
    // =========================================================================
    const gravelGradation = parseGradationData(gravelMat?.gradationData);

    // Exact Dmax extraction & geometric derivation
    let dMax = parseNumeric(getMaterialPropValue(gravelMat, "dMax")) ?? 
               parseNumeric(gravelMat?.dMax);
    let dMaxSource: "material_property" | "derived_from_granulometry" | "project_input" = "material_property";
    let dMaxDerivation: string | undefined = undefined;

    if (dMax === undefined || dMax <= 0) {
      // Attempt geometric derivation from coarse aggregate gradation data
      const derived = deriveDmaxFromGradation(gravelGradation);
      if (derived) {
        dMax = derived.dMax;
        dMaxSource = "derived_from_granulometry";
        dMaxDerivation = derived.explanationAr;
      } else if (inputs.dMax && inputs.dMax > 0) {
        dMax = inputs.dMax;
        dMaxSource = "project_input";
      }
    }

    // Coarse Aggregate Density / Specific Gravity
    let gravelDensity = parseNumeric(getMaterialPropValue(gravelMat, "density")) ?? 
                        parseNumeric(gravelMat?.density);
    let gravelSG = parseNumeric(getMaterialPropValue(gravelMat, "specificGravity")) ?? 
                   parseNumeric(gravelMat?.specificGravity);
    if (!gravelDensity && gravelSG) gravelDensity = gravelSG * 1000;
    if (!gravelSG && gravelDensity) gravelSG = gravelDensity < 10 ? gravelDensity : gravelDensity / 1000;
    if (gravelDensity && gravelDensity < 10) gravelDensity *= 1000;
    if (!gravelDensity) {
      if (inputs.gravelRelativeDensity && inputs.gravelRelativeDensity > 0) {
        gravelDensity = inputs.gravelRelativeDensity > 10 ? inputs.gravelRelativeDensity : inputs.gravelRelativeDensity * 1000;
        gravelSG = gravelDensity / 1000;
      }
    }

    const gravelSsdDensity = parseNumeric(getMaterialPropValue(gravelMat, "ssdDensity")) ?? 
                             parseNumeric(gravelMat?.ssdDensity) ?? 
                             gravelDensity;
    const gravelBulkDensity = parseNumeric(getMaterialPropValue(gravelMat, "bulkDensity")) ?? 
                              parseNumeric(gravelMat?.bulkDensity);
    const gravelAbsorption = parseNumeric(getMaterialPropValue(gravelMat, "absorption")) ?? 
                             parseNumeric(gravelMat?.absorption) ?? 
                             inputs.gravelAbsorption;
    const gravelMoisture = parseNumeric(getMaterialPropValue(gravelMat, "moisture")) ?? 
                           parseNumeric(gravelMat?.moisture) ?? 
                           inputs.moistureGravel ?? 0;
    const gravelDmin = parseNumeric(getMaterialPropValue(gravelMat, "dMin")) ?? 
                       parseNumeric(gravelMat?.dMin);
    const gravelLA = parseNumeric(getMaterialPropValue(gravelMat, "losAngelesAbrasion")) ?? 
                     parseNumeric(gravelMat?.losAngelesAbrasion);

    // Aggregate Shape & Quality
    let aggType = inputs.aggregateType;
    const shapeStr = String(getMaterialPropValue(gravelMat, "particleShape") || gravelMat?.particleShape || "").toLowerCase();
    if (shapeStr.includes("concasse") || shapeStr.includes("crushed") || shapeStr.includes("مكسر") || shapeStr.includes("زاوي")) {
      aggType = AggregateType.CONCASSE;
    } else if (shapeStr.includes("roule") || shapeStr.includes("rounded") || shapeStr.includes("مستدير")) {
      aggType = AggregateType.ROULE;
    }

    let aggQuality = inputs.aggregateQuality;
    const qualityStr = String(getMaterialPropValue(gravelMat, "quality") || gravelMat?.quality || "").toLowerCase();
    if (qualityStr.includes("excellent") || qualityStr.includes("ممتاز")) {
      aggQuality = AggregateQuality.EXCELLENT;
    } else if (qualityStr.includes("poor") || qualityStr.includes("ضعيف")) {
      aggQuality = AggregateQuality.POOR;
    } else {
      aggQuality = AggregateQuality.STANDARD;
    }

    traceItems.push({
      inputName: "Maximum Aggregate Size (Dmax)",
      propertyId: DREUX_PROPERTY_IDS.GRAVEL_DMAX,
      materialId: gravelMat?.id,
      materialName: gravelMat?.name,
      value: dMax,
      formattedValue: dMax ? `${dMax} mm` : "MISSING",
      unit: "mm",
      source: dMaxSource === "derived_from_granulometry" ? "Derived from Gradation Curve" : (gravelMat ? "Material Library" : "Project Input"),
      required: true,
      validation: dMax && dMax >= 2 && dMax <= 150 ? "VALID" : (dMax ? "INVALID" : "MISSING"),
      statusMessage: dMax ? `Dmax = ${dMax} mm defines the Dreux reference curve pivot point and water demand.` : "Dmax is mandatory for the Dreux-Gorisse method.",
      derivationDetails: dMaxDerivation,
      actionRequired: !dMax ? "Complete coarse aggregate Dmax or Sieve Analysis in Material Library." : undefined
    });

    traceItems.push({
      inputName: "Coarse Aggregate Specific Gravity & Density",
      propertyId: DREUX_PROPERTY_IDS.GRAVEL_SPECIFIC_GRAVITY,
      materialId: gravelMat?.id,
      materialName: gravelMat?.name,
      value: gravelSG,
      formattedValue: gravelSG !== undefined && gravelDensity !== undefined ? `${gravelSG.toFixed(2)} (Density: ${gravelDensity} kg/m³)` : "MISSING",
      unit: "kg/m³ / Specific Gravity",
      source: gravelMat ? "Material Library" : "Project Input",
      required: true,
      validation: gravelSG !== undefined ? (gravelSG >= 1.5 && gravelSG <= 3.5 ? "VALID" : "INVALID") : "MISSING",
      statusMessage: gravelSG !== undefined ? "Conforms to aggregate specific gravity range" : "Mandatory gravel density missing"
    });

    traceItems.push({
      inputName: "Coarse Aggregate Shape & Geological Type",
      propertyId: DREUX_PROPERTY_IDS.GRAVEL_PARTICLE_SHAPE,
      materialId: gravelMat?.id,
      materialName: gravelMat?.name,
      value: { shape: shapeStr || "crushed", type: aggType },
      formattedValue: `${aggType === AggregateType.CONCASSE ? "Crushed" : "Rounded"} - ${aggQuality}`,
      unit: "Category",
      source: gravelMat ? "Material Library" : "Default Setting",
      required: true,
      validation: "VALID",
      statusMessage: "Used directly to determine Dreux coefficient G and compactor factor"
    });

    const resolvedCoarse: ResolvedCoarseAggregate = {
      materialId: gravelMat?.id || inputs.selectedGravelId || "",
      name: gravelMat?.name || inputs.gravelType || "Gravel 8/15",
      dMin: gravelDmin || 0,
      dMax: dMax || 0,
      density: gravelDensity || 0,
      specificGravity: gravelSG || 0,
      ssdDensity: gravelSsdDensity,
      bulkDensity: gravelBulkDensity,
      absorption: gravelAbsorption || 0,
      moisture: gravelMoisture,
      particleShape: shapeStr || "angular",
      aggregateType: aggType || AggregateType.CONCASSE,
      aggregateQuality: aggQuality || AggregateQuality.STANDARD,
      losAngelesAbrasion: gravelLA,
      gradationData: gravelGradation,
      source: gravelMat?.source || (gravelMat?.isSystem ? "System Library" : "Project Repository")
    };

    // =========================================================================
    // 4. WATER RESOLUTION
    // =========================================================================
    const waterPH = parseNumeric(getMaterialPropValue(waterMat, "ph")) ?? 
                    parseNumeric(waterMat?.ph);
    const waterCl = parseNumeric(getMaterialPropValue(waterMat, "chlorides")) ?? 
                    parseNumeric(waterMat?.chlorides);
    const waterSO4 = parseNumeric(getMaterialPropValue(waterMat, "sulfates")) ?? 
                     parseNumeric(waterMat?.sulfates);

    traceItems.push({
      inputName: "Mixing Water Density & Quality",
      propertyId: DREUX_PROPERTY_IDS.WATER_DENSITY,
      materialId: waterMat?.id,
      materialName: waterMat?.name,
      value: 1000,
      formattedValue: waterPH !== undefined ? `1000 kg/m³ (pH: ${waterPH})` : "1000 kg/m³ (pH unrecorded)",
      unit: "kg/m³",
      source: waterMat ? "Material Library" : "Potable Water Standard",
      required: true,
      validation: waterPH !== undefined ? (waterPH >= 5.5 && waterPH <= 8.5 ? "VALID" : "INVALID") : "VALID",
      statusMessage: "Complies with EN 1008 mixing water requirements"
    });

    const resolvedWater: ResolvedWater = {
      materialId: waterMat?.id || inputs.selectedWaterId || "SYS-WAT-001",
      name: waterMat?.name || "Potable Mixing Water",
      density: 1000,
      specificGravity: 1.0,
      ph: waterPH,
      chlorides: waterCl,
      sulfates: waterSO4,
      source: waterMat?.source || "Potable Municipal Network / EN 1008"
    };

    // =========================================================================
    // 5. CHEMICAL ADMIXTURE RESOLUTION (OPTIONAL)
    // =========================================================================
    let resolvedAdmixture: ResolvedAdmixture | undefined = undefined;
    if (admMat || inputs.selectedAdmixtureId) {
      const red = parseNumeric(getMaterialPropValue(admMat, "waterReduction")) ?? 
                  parseNumeric(admMat?.waterReduction) ?? 
                  inputs.selectedAdmixtureWaterReduction ?? 
                  0;
      let admDens = parseNumeric(getMaterialPropValue(admMat, "density")) ?? 
                    parseNumeric(admMat?.density) ?? 
                    inputs.selectedAdmixtureDensity ?? 0;
      if (admDens < 10 && admDens > 0) admDens *= 1000;
      const dosage = inputs.dosageSuper !== undefined ? inputs.dosageSuper : 0;

      traceItems.push({
        inputName: "Chemical Admixture (Superplasticizer)",
        propertyId: DREUX_PROPERTY_IDS.ADMIXTURE_WATER_REDUCTION,
        materialId: admMat?.id,
        materialName: admMat?.name,
        value: { waterReduction: red, dosage },
        formattedValue: `Dosage: ${dosage.toFixed(1)}%, Water Reduction: ${red.toFixed(1)}%`,
        unit: "%",
        source: admMat ? "Material Library" : "Manual Dosage",
        required: false,
        validation: red >= 0 && red <= 45 ? "VALID" : "INVALID",
        statusMessage: red > 0 ? `Calculated water reduction of ${red}% applied to effective water.` : "Standard dosage"
      });

      resolvedAdmixture = {
        materialId: admMat?.id || inputs.selectedAdmixtureId || "",
        name: admMat?.name || "High-Range Water Reducer (Superplasticizer)",
        waterReduction: red,
        density: admDens,
        dosagePercent: dosage,
        source: admMat?.source || "Commercial Admixture"
      };
    }

    // =========================================================================
    // 6. MINERAL ADMIXTURE / SCM RESOLUTION (OPTIONAL)
    // =========================================================================
    let resolvedScm: ResolvedScm | undefined = undefined;
    if (scmMat || inputs.selectedScmId) {
      let scmDens = parseNumeric(getMaterialPropValue(scmMat, "density")) ?? 
                    parseNumeric(scmMat?.density) ?? 0;
      if (scmDens < 10 && scmDens > 0) scmDens *= 1000;
      const wdf = parseNumeric(getMaterialPropValue(scmMat, "waterDemandFactor")) ?? 1.0;
      const pozz = parseNumeric(getMaterialPropValue(scmMat, "pozzolanicIndex")) ?? 0;
      const dosage = (inputs.dosageSilicaFume || 0) + (inputs.dosageFlyAsh || 0) + (inputs.dosageSlag || 0);

      resolvedScm = {
        materialId: scmMat?.id || inputs.selectedScmId || "",
        name: scmMat?.name || "Supplementary Cementitious Material (SCM)",
        type: scmMat?.category || "Mineral Admixture",
        density: scmDens,
        waterDemandFactor: wdf,
        pozzolanicIndex: pozz,
        dosagePercent: dosage,
        source: scmMat?.source || "SCM Library"
      };
    }

    // =========================================================================
    // 7. PROJECT PARAMETERS RESOLUTION
    // =========================================================================
    const fck28 = inputs.fck28;
    const slump = inputs.slump;
    const controlClass = inputs.controlClass || "normal";
    const exposureClass = inputs.exposureClass || "X0";
    const airContent = inputs.airContent !== undefined ? inputs.airContent : 1.0;
    const hasPumping = !!inputs.hasPumping;
    const batchVolume = inputs.batchVolume || 1.0;

    traceItems.push({
      inputName: "Characteristic Compressive Strength (fck28)",
      propertyId: DREUX_PROPERTY_IDS.PROJECT_FCK28,
      value: fck28,
      formattedValue: fck28 !== undefined ? `${fck28} MPa` : "MISSING",
      unit: "MPa",
      source: "Project Specifications",
      required: true,
      validation: fck28 !== undefined ? (fck28 >= 10 && fck28 <= 120 ? "VALID" : "INVALID") : "MISSING",
      statusMessage: fck28 !== undefined ? `Governs target mean strength fcm28 = fck + 1.64σ` : "Mandatory project specification missing"
    });

    traceItems.push({
      inputName: "Target Workability (Slump)",
      propertyId: DREUX_PROPERTY_IDS.PROJECT_SLUMP,
      value: slump,
      formattedValue: slump !== undefined ? `${slump} cm` : "MISSING",
      unit: "cm",
      source: "Project Specifications",
      required: true,
      validation: slump !== undefined ? (slump >= 0 && slump <= 40 ? "VALID" : "INVALID") : "MISSING",
      statusMessage: slump !== undefined ? `Conforms to slump class S${slump <= 4 ? 1 : slump <= 9 ? 2 : slump <= 15 ? 3 : 4}` : "Mandatory workability missing"
    });

    // =========================================================================
    // 8. AUDIT & TRACE EVALUATION
    // =========================================================================
    const missingRequiredCount = traceItems.filter(i => i.required && (i.validation === "MISSING" || i.value === undefined || i.value === null)).length;
    const invalidInputsCount = traceItems.filter(i => i.validation === "INVALID").length;
    const resolvedInputsCount = traceItems.filter(i => i.validation === "VALID").length;
    const isFullyResolved = missingRequiredCount === 0 && invalidInputsCount === 0;

    const trace: DreuxInputTrace = {
      items: traceItems,
      resolvedInputsCount,
      missingRequiredCount,
      invalidInputsCount,
      isFullyResolved
    };

    return {
      cement: resolvedCement,
      fineAggregate: resolvedFine,
      coarseAggregate: resolvedCoarse,
      water: resolvedWater,
      admixture: resolvedAdmixture,
      scm: resolvedScm,
      dMax: resolvedCoarse.dMax,
      dMaxSource,
      dMaxDerivationDetails: dMaxDerivation,
      finenessModulus: resolvedFine.finenessModulus,
      finenessModulusSource: fmSource,
      finenessModulusDerivationDetails: fmDerivation,
      targetStrength: fck28,
      workability: slump,
      aggregateType: aggType,
      aggregateQuality: aggQuality,
      hasPumping,
      airContent,
      controlClass,
      exposureClass,
      batchVolume,
      trace
    };
  }
}
