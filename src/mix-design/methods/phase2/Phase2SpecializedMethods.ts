import { MixDesignMethod } from "../../core/MixDesignMethod";
import {
  MixDesignInput,
  CalculationContext,
  MixDesignMethodMetadata,
  ApplicabilityResult,
  ValidationResult,
  MixDesignResult,
  ValidationError
} from "../../core/types";
import {
  makeSpecializedResult,
  materialDensityKgM3,
  materialProperty,
  resolveSpecializedMaterials
} from "../shared/specializedMixDesignUtils";

const VERSION = "1.0.0";
const EPS = 1e-9;

function num(input: MixDesignInput, key: string, fallback = 0): number {
  const value = Number((input as any)[key]);
  return Number.isFinite(value) ? value : fallback;
}

function required(value: number, field: string, label: string, errors: ValidationError[]) {
  if (!Number.isFinite(value) || value <= EPS) {
    errors.push({ code: "REQUIRED_POSITIVE", severity: "error", field, message: `${label} must be a positive value.` });
  }
}

function languageMessage(language: "ar" | "fr" | "en", ar: string, fr: string, en: string) {
  return language === "fr" ? fr : language === "en" ? en : ar;
}

function commonMaterials(input: MixDesignInput, language: "ar" | "fr" | "en", requireAdmixture = false, requireScm = false) {
  return resolveSpecializedMaterials(input, language, requireAdmixture, requireScm, true);
}

function materialValidation(
  resolved: ReturnType<typeof commonMaterials>,
  field = "materialsDatabase"
): ValidationResult {
  return {
    isValid: resolved.errors.length === 0,
    errors: resolved.errors.map((message) => ({
      code: "MATERIAL_RESOLUTION",
      severity: "error" as const,
      field,
      message
    })),
    warnings: resolved.warnings.map((message) => ({
      code: "MATERIAL_WARNING",
      severity: "warning" as const,
      field,
      message
    }))
  };
}

function baseVolume(
  cementKg: number,
  cementDensity: number,
  binderOtherKg: number,
  binderOtherDensity: number,
  waterKg: number,
  admixtureKg: number,
  admixtureDensity: number,
  sandKg: number,
  sandDensity: number,
  coarseKg: number,
  coarseDensity: number,
  airPercent: number
) {
  return (
    cementKg / cementDensity * 1000 +
    binderOtherKg / binderOtherDensity * 1000 +
    waterKg +
    admixtureKg / admixtureDensity * 1000 +
    sandKg / sandDensity * 1000 +
    coarseKg / coarseDensity * 1000 +
    airPercent * 10
  );
}

function solveSand(
  fixedVolumeL: number,
  coarseKg: number,
  sandDensity: number
): number {
  const remainingL = 1000 - fixedVolumeL;
  return Math.max(0, remainingL / 1000 * sandDensity);
}

function blocked(
  input: MixDesignInput,
  methodId: string,
  methodName: string,
  recommendations: string[],
  errors: string[]
): MixDesignResult {
  return makeSpecializedResult(input, {
    methodId,
    methodName,
    version: VERSION,
    cementKg: 0,
    waterKg: 0,
    fineAggregateKg: 0,
    coarseAggregateKg: 0,
    admixtureKg: 0,
    waterBinderRatio: 0,
    freshDensityKgM3: 0,
    absoluteVolumeL: 0,
    warnings: errors,
    assumptions: [],
    recommendations,
    trace: [],
    complianceChecks: [{
      parameter: "input_validation",
      requirement: "All required specialized inputs and approved materials",
      actual: errors.join(" | "),
      status: "non_compliant"
    }],
    lifecycle: "blocked"
  });
}

/* -------------------- Geopolymer concrete -------------------- */

export function checkGpcApplicability(input: MixDesignInput): ApplicabilityResult {
  return String(input.concreteType || "").toUpperCase() === "GPC"
    ? { level: "applicable", reasons: [], recommendations: ["Confirm precursor/activator chemistry and curing with laboratory trials."] }
    : { level: "not_applicable", reasons: ["GPC method requires concreteType = GPC."], recommendations: ["Select GPC before calculation."] };
}

export function validateGpcInputs(input: MixDesignInput, language: "ar" | "fr" | "en" = "ar"): ValidationResult {
  const errors: ValidationError[] = [];
  const resolved = commonMaterials(input, language, true, true);
  errors.push(...materialValidation(resolved).errors);
  required(num(input, "gpcPrecursorKgM3"), "gpcPrecursorKgM3", languageMessage(language, "كتلة المادة الأولية", "masse de précurseur", "precursor mass"), errors);
  required(num(input, "gpcActivatorLiquidKgM3"), "gpcActivatorLiquidKgM3", languageMessage(language, "كتلة المنشط السائل", "masse d'activateur liquide", "liquid activator mass"), errors);
  required(num(input, "gpcWaterKgM3"), "gpcWaterKgM3", "GPC effective water", errors);
  const ratio = num(input, "gpcActivatorToPrecursorRatio");
  if (ratio <= 0 || ratio > 1.5) errors.push({ code: "GPC_ACTIVATOR_RATIO", severity: "error", field: "gpcActivatorToPrecursorRatio", message: "GPC activator-to-precursor ratio must be >0 and <=1.5." });
  const wb = num(input, "gpcWaterBinderRatio");
  if (wb <= 0 || wb > 0.60) errors.push({ code: "GPC_WB", severity: "error", field: "gpcWaterBinderRatio", message: "GPC water-to-binder ratio must be >0 and <=0.60." });
  return { isValid: errors.length === 0, errors, warnings: [] };
}

export function calculateGpcMix(input: MixDesignInput, language: "ar" | "fr" | "en" = "ar"): MixDesignResult {
  const validation = validateGpcInputs(input, language);
  const resolved = commonMaterials(input, language, true, true);
  if (!validation.isValid || resolved.errors.length) {
    return blocked(input, "geopolymer-specialized", "Geopolymer Concrete", ["Complete validated precursor, activator, aggregate and water inputs."], [...validation.errors.map(e => e.message), ...resolved.errors]);
  }

  const precursor = num(input, "gpcPrecursorKgM3");
  const activator = num(input, "gpcActivatorLiquidKgM3");
  const water = num(input, "gpcWaterKgM3");
  const wb = num(input, "gpcWaterBinderRatio");
  const cementDensity = materialDensityKgM3(resolved.materials.cement, 3150);
  const precursorDensity = materialDensityKgM3(resolved.materials.scm, 2200);
  const sandDensity = materialDensityKgM3(resolved.materials.sand, 2650);
  const gravelDensity = materialDensityKgM3(resolved.materials.gravel, 2650);
  const activatorDensity = materialDensityKgM3(resolved.materials.admixture, 1400);
  const air = Math.max(0.5, Math.min(5, num(input, "airContent", 2)));
  const coarseFraction = Math.max(0.25, Math.min(0.50, num(input, "gpcCoarseAggregateVolumeFraction", 0.35)));
  const coarseKg = coarseFraction * gravelDensity;
  const fixedVolume = precursor / precursorDensity * 1000 + water + activator / activatorDensity * 1000 + coarseFraction * 1000 + air * 10;
  const sandKg = solveSand(fixedVolume, coarseKg, sandDensity);
  const volume = baseVolume(0, cementDensity, precursor, precursorDensity, water, activator, activatorDensity, sandKg, sandDensity, coarseKg, gravelDensity, air);
  const density = precursor + activator + water + sandKg + coarseKg;
  const ratio = water / precursor;

  return makeSpecializedResult(input, {
    methodId: "geopolymer-specialized",
    methodName: "Geopolymer Concrete",
    version: VERSION,
    cementKg: 0,
    scmKg: precursor,
    waterKg: water,
    fineAggregateKg: sandKg,
    coarseAggregateKg: coarseKg,
    admixtureKg: activator,
    admixtureName: String(resolved.materials.admixture?.name || input.selectedAdmixtureName || "Alkaline activator"),
    waterBinderRatio: ratio,
    freshDensityKgM3: density,
    absoluteVolumeL: volume,
    warnings: ["GPC is not a Portland-cement Dreux calculation.", "Activator chemistry, setting, workability, curing and strength must be verified experimentally."],
    assumptions: [
      `Precursor = ${precursor.toFixed(1)} kg/m3.`,
      `Liquid activator = ${activator.toFixed(1)} kg/m3.`,
      `Effective water/precursor ratio = ${ratio.toFixed(3)}.`,
      `Coarse aggregate volume fraction = ${(coarseFraction * 100).toFixed(1)}%.`,
      "Fine aggregate is obtained by absolute-volume closure."
    ],
    recommendations: ["Verify Si/Al and alkali chemistry from the actual precursor/activator certificates.", "Run fresh-state, curing and 7/28/56-day strength trials before production use."],
    trace: [
      { stepId: "gpc-1", label: "Set precursor and activator masses from project/laboratory inputs.", formula: "Mprecursor, Mactivator = validated project inputs", inputs: { precursor, activator }, output: { precursor, activator }, unit: "kg/m3" },
      { stepId: "gpc-2", label: "Calculate effective water-to-binder ratio.", formula: "W/B = W/Mprecursor", inputs: { water, precursor }, output: ratio, unit: "-" },
      { stepId: "gpc-3", label: "Set coarse aggregate volume fraction.", formula: "Vca = Vc · fca", inputs: { coarseFraction }, output: coarseFraction * 1000, unit: "L/m3" },
      { stepId: "gpc-4", label: "Close absolute volume with fine aggregate.", formula: "Vfa = 1000 - Vprecursor - Vwater - Vactivator - Vca - Va", inputs: { volume }, output: sandKg, unit: "kg/m3" }
    ],
    complianceChecks: [
      { parameter: "water_binder", requirement: ">0 and <=0.60", actual: ratio.toFixed(3), status: ratio > 0 && ratio <= 0.60 ? "compliant" : "non_compliant" },
      { parameter: "absolute_volume", requirement: "1000 L/m3 ±2 L", actual: `${volume.toFixed(2)} L/m3`, status: Math.abs(volume - 1000) <= 2 ? "compliant" : "non_compliant" },
      { parameter: "trial_mix", requirement: "Laboratory verification", actual: "Required", status: "warning" }
    ],
    lifecycle: Math.abs(volume - 1000) <= 2 ? "needs_trial_mix" : "blocked"
  });
}

/* -------------------- Recycled aggregate concrete -------------------- */

export function checkRacApplicability(input: MixDesignInput): ApplicabilityResult {
  return String(input.concreteType || "").toUpperCase() === "RAC"
    ? { level: "applicable", reasons: [], recommendations: ["Verify recycled aggregate source quality and absorption by laboratory testing."] }
    : { level: "not_applicable", reasons: ["RAC method requires concreteType = RAC."], recommendations: ["Select RAC before calculation."] };
}

export function validateRacInputs(input: MixDesignInput, language: "ar" | "fr" | "en" = "ar"): ValidationResult {
  const errors: ValidationError[] = [];
  const resolved = commonMaterials(input, language);
  errors.push(...materialValidation(resolved).errors);
  required(num(input, "racCoarseAggregateKgM3"), "racCoarseAggregateKgM3", "RAC coarse aggregate mass", errors);
  const replacement = num(input, "racReplacementPercent");
  const absorption = num(input, "racRecycledAbsorptionPercent");
  const preSat = num(input, "racPreSaturationPercent");
  if (replacement <= 0 || replacement > 100) errors.push({ code: "RAC_REPLACEMENT", severity: "error", field: "racReplacementPercent", message: "RAC recycled coarse aggregate replacement must be >0 and <=100%." });
  if (absorption < 0 || absorption > 20) errors.push({ code: "RAC_ABSORPTION", severity: "error", field: "racRecycledAbsorptionPercent", message: "Recycled aggregate absorption must be between 0 and 20%." });
  if (preSat < 0 || preSat > 100) errors.push({ code: "RAC_PRESAT", severity: "error", field: "racPreSaturationPercent", message: "Pre-saturation degree must be between 0 and 100%." });
  const wb = num(input, "racWaterBinderRatio");
  if (wb <= 0 || wb > 0.65) errors.push({ code: "RAC_WB", severity: "error", field: "racWaterBinderRatio", message: "RAC water-to-binder ratio must be >0 and <=0.65." });
  return { isValid: errors.length === 0, errors, warnings: [] };
}

export function calculateRacMix(input: MixDesignInput, language: "ar" | "fr" | "en" = "ar"): MixDesignResult {
  const validation = validateRacInputs(input, language);
  const resolved = commonMaterials(input, language);
  if (!validation.isValid || resolved.errors.length) {
    return blocked(input, "recycled-aggregate-specialized", "Recycled Aggregate Concrete", ["Complete recycled aggregate replacement, absorption and pre-saturation inputs."], [...validation.errors.map(e => e.message), ...resolved.errors]);
  }
  const cement = num(input, "racCementKgM3", num(input, "cementWeight", 350));
  const water = num(input, "racWaterKgM3", 160);
  const wb = num(input, "racWaterBinderRatio");
  const totalCoarse = num(input, "racCoarseAggregateKgM3");
  const replacement = num(input, "racReplacementPercent") / 100;
  const absorption = num(input, "racRecycledAbsorptionPercent");
  const preSat = num(input, "racPreSaturationPercent") / 100;
  const cementDensity = materialDensityKgM3(resolved.materials.cement, 3150);
  const sandDensity = materialDensityKgM3(resolved.materials.sand, 2650);
  const virginDensity = materialDensityKgM3(resolved.materials.gravel, 2650);
  const recycledDensity = num(input, "racRecycledAggregateDensityKgM3", materialDensityKgM3(resolved.materials.gravel, 2350));
  const recycledKg = totalCoarse * replacement;
  const virginKg = totalCoarse - recycledKg;
  const admixtureKg = Math.max(0, num(input, "racSuperplasticizerDosage") / 100 * cement);
  const admixtureDensity = materialDensityKgM3(resolved.materials.admixture, 1100);
  const air = Math.max(0.5, Math.min(6, num(input, "airContent", 2)));
  const volume = baseVolume(cement, cementDensity, 0, 2200, water, admixtureKg, admixtureDensity, 0, sandDensity, virginKg, virginDensity, air)
    + recycledKg / recycledDensity * 1000;
  const sandKg = solveSand(volume - recycledKg / recycledDensity * 1000, virginKg, sandDensity);
  const finalVolume = baseVolume(cement, cementDensity, 0, 2200, water, admixtureKg, admixtureDensity, sandKg, sandDensity, virginKg, virginDensity, air) + recycledKg / recycledDensity * 1000;
  const absorptionCapacity = recycledKg * absorption / 100;
  const prewetWater = absorptionCapacity * preSat;
  const moisture = num(input, "moistureGravel");
  const freeSurface = recycledKg * Math.max(0, moisture - absorption) / 100;
  const waterToAdd = Math.max(0, water + prewetWater - freeSurface);
  const density = cement + water + sandKg + virginKg + recycledKg + admixtureKg;

  return makeSpecializedResult(input, {
    methodId: "recycled-aggregate-specialized",
    methodName: "Recycled Aggregate Concrete",
    version: VERSION,
    cementKg: cement,
    waterKg: water,
    fineAggregateKg: sandKg,
    coarseAggregateKg: totalCoarse,
    admixtureKg,
    admixtureName: "Superplasticizer",
    waterBinderRatio: wb,
    freshDensityKgM3: density,
    absoluteVolumeL: finalVolume,
    warnings: ["RAC requires source-specific recycled aggregate quality and moisture conditioning.", "The calculated mix is a starting proportion and requires trial batching."],
    assumptions: [
      `Recycled coarse aggregate replacement = ${(replacement * 100).toFixed(1)}%.`,
      `Recycled aggregate absorption = ${absorption.toFixed(2)}%.`,
      `Pre-saturation degree = ${(preSat * 100).toFixed(1)}% of absorption capacity.`,
      `Additional prewet water = ${prewetWater.toFixed(1)} kg/m3.`
    ],
    recommendations: ["Determine absorption/SSD condition on the actual recycled aggregate.", "Verify fresh workability and strength after moisture conditioning."],
    trace: [
      { stepId: "rac-1", label: "Split total coarse aggregate into recycled and virgin fractions.", formula: "MRA = Mca·R; MVA = Mca-MRA", inputs: { totalCoarse, replacement }, output: { recycledKg, virginKg }, unit: "kg/m3" },
      { stepId: "rac-2", label: "Calculate recycled aggregate absorption capacity.", formula: "Wabs = MRA·Abs/100", inputs: { recycledKg, absorption }, output: absorptionCapacity, unit: "kg/m3" },
      { stepId: "rac-3", label: "Calculate pre-saturation water.", formula: "Wpre = Wabs·S", inputs: { absorptionCapacity, preSat }, output: prewetWater, unit: "kg/m3" },
      { stepId: "rac-4", label: "Close absolute volume with fine aggregate.", formula: "Vfa = 1000 - Vcement - Vwater - Vair - Vad - Vvirgin - Vrecycled", inputs: { finalVolume }, output: sandKg, unit: "kg/m3" },
      { stepId: "rac-5", label: "Correct batch water for surface moisture and pre-saturation.", formula: "Wadd = W + Wpre - Wfree", inputs: { prewetWater, freeSurface }, output: waterToAdd, unit: "kg/m3" }
    ],
    complianceChecks: [
      { parameter: "replacement", requirement: ">0 and <=100%", actual: `${(replacement * 100).toFixed(1)}%`, status: "compliant" },
      { parameter: "water_binder", requirement: ">0 and <=0.65", actual: wb.toFixed(3), status: wb > 0 && wb <= 0.65 ? "compliant" : "non_compliant" },
      { parameter: "absolute_volume", requirement: "1000 L/m3 ±2 L", actual: `${finalVolume.toFixed(2)} L/m3`, status: Math.abs(finalVolume - 1000) <= 2 ? "compliant" : "non_compliant" },
      { parameter: "trial_mix", requirement: "Laboratory verification", actual: "Required", status: "warning" }
    ],
    lifecycle: Math.abs(finalVolume - 1000) <= 2 ? "needs_trial_mix" : "blocked"
  });
}

/* -------------------- Self-healing concrete -------------------- */

export function checkShcApplicability(input: MixDesignInput): ApplicabilityResult {
  return String(input.concreteType || "").toUpperCase() === "SHC"
    ? { level: "applicable", reasons: [], recommendations: ["Validate healing mechanism, compatibility and retained mechanical performance experimentally."] }
    : { level: "not_applicable", reasons: ["Self-healing concrete method requires concreteType = SHC."], recommendations: ["Select SHC before calculation."] };
}

export function validateShcInputs(input: MixDesignInput, language: "ar" | "fr" | "en" = "ar"): ValidationResult {
  const errors: ValidationError[] = [];
  const resolved = commonMaterials(input, language);
  errors.push(...materialValidation(resolved).errors);
  required(num(input, "shcHealingAgentDosageKgM3"), "shcHealingAgentDosageKgM3", "self-healing agent dosage", errors);
  required(num(input, "shcHealingAgentDensityKgM3"), "shcHealingAgentDensityKgM3", "self-healing agent density", errors);
  const wb = num(input, "shcWaterBinderRatio");
  if (wb <= 0 || wb > 0.65) errors.push({ code: "SHC_WB", severity: "error", field: "shcWaterBinderRatio", message: "SHC water-to-binder ratio must be >0 and <=0.65." });
  return { isValid: errors.length === 0, errors, warnings: [] };
}

export function calculateShcMix(input: MixDesignInput, language: "ar" | "fr" | "en" = "ar"): MixDesignResult {
  const validation = validateShcInputs(input, language);
  const resolved = commonMaterials(input, language);
  if (!validation.isValid || resolved.errors.length) {
    return blocked(input, "self-healing-specialized", "Self-Healing Concrete", ["Specify the healing-agent type, dosage and validated density together with the base mix materials."], [...validation.errors.map(e => e.message), ...resolved.errors]);
  }
  const cement = num(input, "shcCementKgM3", num(input, "cementWeight", 350));
  const water = num(input, "shcWaterKgM3", 160);
  const wb = num(input, "shcWaterBinderRatio");
  const agent = num(input, "shcHealingAgentDosageKgM3");
  const agentDensity = num(input, "shcHealingAgentDensityKgM3");
  const cementDensity = materialDensityKgM3(resolved.materials.cement, 3150);
  const sandDensity = materialDensityKgM3(resolved.materials.sand, 2650);
  const gravelDensity = materialDensityKgM3(resolved.materials.gravel, 2650);
  const admixtureDensity = materialDensityKgM3(resolved.materials.admixture, 1100);
  const superplasticizer = Math.max(0, num(input, "shcSuperplasticizerDosage") / 100 * cement);
  const totalAdmixture = agent + superplasticizer;
  const air = Math.max(0.5, Math.min(6, num(input, "airContent", 2)));
  const coarseFraction = Math.max(0.25, Math.min(0.55, num(input, "shcCoarseAggregateVolumeFraction", 0.40)));
  const coarseKg = coarseFraction * gravelDensity;
  const fixedVolume = cement / cementDensity * 1000 + water + superplasticizer / admixtureDensity * 1000 + agent / agentDensity * 1000 + coarseFraction * 1000 + air * 10;
  const sandKg = solveSand(fixedVolume, coarseKg, sandDensity);
  const volume = cement / cementDensity * 1000 + water + superplasticizer / admixtureDensity * 1000 + agent / agentDensity * 1000 + sandKg / sandDensity * 1000 + coarseKg / gravelDensity * 1000 + air * 10;
  const density = cement + water + superplasticizer + agent + sandKg + coarseKg;
  return makeSpecializedResult(input, {
    methodId: "self-healing-specialized",
    methodName: "Self-Healing Concrete",
    version: VERSION,
    cementKg: cement,
    waterKg: water,
    fineAggregateKg: sandKg,
    coarseAggregateKg: coarseKg,
    admixtureKg: totalAdmixture,
    admixtureName: "Superplasticizer + self-healing agent",
    waterBinderRatio: wb,
    freshDensityKgM3: density,
    absoluteVolumeL: volume,
    warnings: ["Self-healing performance cannot be inferred from dosage alone.", "Crack-width control, healing efficiency and retained mechanical properties require dedicated laboratory verification."],
    assumptions: [`Healing agent dosage = ${agent.toFixed(1)} kg/m3.`, `Healing-agent density = ${agentDensity.toFixed(0)} kg/m3.`, "Healing-agent volume is explicitly included in the absolute-volume balance."],
    recommendations: ["Record the exact healing mechanism and supplier formulation in the material library.", "Verify compatibility with cement/admixture system and quantify healing efficiency under the intended exposure condition."],
    trace: [
      { stepId: "shc-1", label: "Set base cement and effective water.", formula: "W/B = W/C for Portland-cement base mix", inputs: { cement, water }, output: wb, unit: "-" },
      { stepId: "shc-2", label: "Convert healing-agent dosage to absolute volume.", formula: "Vh = Mh/rhoh", inputs: { agent, agentDensity }, output: agent / agentDensity * 1000, unit: "L/m3" },
      { stepId: "shc-3", label: "Set coarse aggregate volume fraction.", formula: "Vca = Vc·fca", inputs: { coarseFraction }, output: coarseFraction * 1000, unit: "L/m3" },
      { stepId: "shc-4", label: "Close absolute volume with fine aggregate.", formula: "Vfa = 1000 - Vcement - Vwater - Vsp - Vheal - Vca - Va", inputs: { volume }, output: sandKg, unit: "kg/m3" }
    ],
    complianceChecks: [
      { parameter: "healing_agent", requirement: ">0 kg/m3 and validated density", actual: `${agent.toFixed(1)} kg/m3 @ ${agentDensity.toFixed(0)} kg/m3`, status: "compliant" },
      { parameter: "water_binder", requirement: ">0 and <=0.65", actual: wb.toFixed(3), status: wb > 0 && wb <= 0.65 ? "compliant" : "non_compliant" },
      { parameter: "absolute_volume", requirement: "1000 L/m3 ±2 L", actual: `${volume.toFixed(2)} L/m3`, status: Math.abs(volume - 1000) <= 2 ? "compliant" : "non_compliant" },
      { parameter: "healing_verification", requirement: "Healing efficiency + mechanical retention testing", actual: "Required", status: "warning" }
    ],
    lifecycle: Math.abs(volume - 1000) <= 2 ? "needs_trial_mix" : "blocked"
  });
}

/* -------------------- Shotcrete -------------------- */

export function checkShotcreteApplicability(input: MixDesignInput): ApplicabilityResult {
  return String(input.concreteType || "").toUpperCase() === "SHOTCRETE"
    ? { level: "applicable", reasons: [], recommendations: ["Verify wet/dry process, accelerator compatibility and rebound with project-specific trials."] }
    : { level: "not_applicable", reasons: ["Shotcrete method requires concreteType = SHOTCRETE."], recommendations: ["Select shotcrete before calculation."] };
}

export function validateShotcreteInputs(input: MixDesignInput, language: "ar" | "fr" | "en" = "ar"): ValidationResult {
  const errors: ValidationError[] = [];
  const resolved = commonMaterials(input, language, true, false);
  errors.push(...materialValidation(resolved).errors);
  required(num(input, "shotcreteWaterKgM3"), "shotcreteWaterKgM3", "shotcrete effective water", errors);
  const wb = num(input, "shotcreteWaterBinderRatio");
  if (wb <= 0 || wb > 0.55) errors.push({ code: "SHOTCRETE_WB", severity: "error", field: "shotcreteWaterBinderRatio", message: "Shotcrete water-to-binder ratio must be >0 and <=0.55." });
  const accelerator = num(input, "shotcreteAcceleratorPercent");
  if (accelerator < 0 || accelerator > 15) errors.push({ code: "SHOTCRETE_ACCELERATOR", severity: "error", field: "shotcreteAcceleratorPercent", message: "Shotcrete accelerator dosage must be between 0 and 15% of binder mass." });
  return { isValid: errors.length === 0, errors, warnings: [] };
}

export function calculateShotcreteMix(input: MixDesignInput, language: "ar" | "fr" | "en" = "ar"): MixDesignResult {
  const validation = validateShotcreteInputs(input, language);
  const resolved = commonMaterials(input, language, true, false);
  if (!validation.isValid || resolved.errors.length) {
    return blocked(input, "shotcrete-specialized", "Shotcrete", ["Complete approved shotcrete materials and process-specific inputs."], [...validation.errors.map(e => e.message), ...resolved.errors]);
  }
  const water = num(input, "shotcreteWaterKgM3");
  const wb = num(input, "shotcreteWaterBinderRatio");
  const binder = water / wb;
  const cementFraction = Math.max(0, Math.min(1, num(input, "shotcreteCementFraction", 1)));
  const cement = binder * cementFraction;
  const scm = binder - cement;
  const cementDensity = materialDensityKgM3(resolved.materials.cement, 3150);
  const scmDensity = materialDensityKgM3(resolved.materials.scm, 2200);
  const sandDensity = materialDensityKgM3(resolved.materials.sand, 2650);
  const gravelDensity = materialDensityKgM3(resolved.materials.gravel, 2650);
  const accelerator = binder * num(input, "shotcreteAcceleratorPercent") / 100;
  const sp = Math.max(0, binder * num(input, "shotcreteSuperplasticizerPercent") / 100);
  const admixture = accelerator + sp;
  const air = Math.max(1, Math.min(8, num(input, "airContent", 4)));
  const coarseFraction = Math.max(0.10, Math.min(0.45, num(input, "shotcreteCoarseAggregateVolumeFraction", 0.25)));
  const coarseKg = coarseFraction * gravelDensity;
  const fixedVolume = cement / cementDensity * 1000 + scm / scmDensity * 1000 + water + admixture / materialDensityKgM3(resolved.materials.admixture, 1100) * 1000 + coarseFraction * 1000 + air * 10;
  const sandKg = solveSand(fixedVolume, coarseKg, sandDensity);
  const volume = baseVolume(cement, cementDensity, scm, scmDensity, water, admixture, materialDensityKgM3(resolved.materials.admixture, 1100), sandKg, sandDensity, coarseKg, gravelDensity, air);
  const density = binder + water + admixture + sandKg + coarseKg;
  return makeSpecializedResult(input, {
    methodId: "shotcrete-specialized",
    methodName: "Shotcrete",
    version: VERSION,
    cementKg: cement,
    scmKg: scm,
    waterKg: water,
    fineAggregateKg: sandKg,
    coarseAggregateKg: coarseKg,
    admixtureKg: admixture,
    admixtureName: "Accelerator + superplasticizer",
    waterBinderRatio: wb,
    freshDensityKgM3: density,
    absoluteVolumeL: volume,
    warnings: ["Shotcrete design requires process-specific control of rebound, accelerator dosage, pumpability and sprayed in-place properties."],
    assumptions: [`Binder = W/(W/B) = ${binder.toFixed(1)} kg/m3.`, `Accelerator = ${accelerator.toFixed(1)} kg/m3.`, "Fine aggregate is solved by absolute-volume closure."],
    recommendations: ["Verify accelerator compatibility and setting time with the actual cement/admixture system.", "Measure rebound and in-place thickness/density; verify hardened strength on cores or project-required specimens."],
    trace: [
      { stepId: "shotcrete-1", label: "Determine binder from effective water and W/B.", formula: "B = W/(W/B)", inputs: { water, wb }, output: binder, unit: "kg/m3" },
      { stepId: "shotcrete-2", label: "Split binder into cement and SCM.", formula: "C = B·fc; SCM = B-C", inputs: { cementFraction }, output: { cement, scm }, unit: "kg/m3" },
      { stepId: "shotcrete-3", label: "Calculate accelerator dosage.", formula: "Macc = B·pacc/100", inputs: { binder, acceleratorPercent: num(input, "shotcreteAcceleratorPercent") }, output: accelerator, unit: "kg/m3" },
      { stepId: "shotcrete-4", label: "Close absolute volume with aggregates.", formula: "Vfa = 1000 - Vbinder - Vwater - Vad - Vca - Va", inputs: { volume }, output: sandKg, unit: "kg/m3" }
    ],
    complianceChecks: [
      { parameter: "water_binder", requirement: ">0 and <=0.55", actual: wb.toFixed(3), status: wb > 0 && wb <= 0.55 ? "compliant" : "non_compliant" },
      { parameter: "accelerator", requirement: "0-15% binder", actual: `${num(input, "shotcreteAcceleratorPercent").toFixed(2)}%`, status: "compliant" },
      { parameter: "absolute_volume", requirement: "1000 L/m3 ±2 L", actual: `${volume.toFixed(2)} L/m3`, status: Math.abs(volume - 1000) <= 2 ? "compliant" : "non_compliant" },
      { parameter: "sprayed_trial", requirement: "Spray/pump/rebound/setting verification", actual: "Required", status: "warning" }
    ],
    lifecycle: Math.abs(volume - 1000) <= 2 ? "needs_trial_mix" : "blocked"
  });
}

abstract class Phase2MethodBase implements MixDesignMethod {
  abstract metadata: MixDesignMethodMetadata;
  abstract isApplicable(input: MixDesignInput, context: CalculationContext): ApplicabilityResult;
  abstract validateInputs(input: MixDesignInput, context: CalculationContext): ValidationResult;
  abstract calculate(input: MixDesignInput, context: CalculationContext): MixDesignResult;
}

export class GpcSpecializedMethod extends Phase2MethodBase {
  public readonly metadata: MixDesignMethodMetadata = {
    id: "geopolymer-specialized", name: "Geopolymer Concrete", shortName: "GPC", version: VERSION,
    description: "Activator/precursor and absolute-volume starting proportioning for geopolymer concrete.", references: ["ACI 232.2R", "ASTM C618"], supportedLanguages: ["ar", "fr", "en"], status: "active"
  };
  isApplicable(i: MixDesignInput): ApplicabilityResult { return checkGpcApplicability(i); }
  validateInputs(i: MixDesignInput): ValidationResult { return validateGpcInputs(i); }
  calculate(i: MixDesignInput): MixDesignResult { return calculateGpcMix(i); }
}
export class RacSpecializedMethod extends Phase2MethodBase {
  public readonly metadata: MixDesignMethodMetadata = {
    id: "recycled-aggregate-specialized", name: "Recycled Aggregate Concrete", shortName: "RAC", version: VERSION,
    description: "Recycled coarse aggregate replacement with source-specific absorption and pre-saturation correction.", references: ["EN 206", "EN 12620"], supportedLanguages: ["ar", "fr", "en"], status: "active"
  };
  isApplicable(i: MixDesignInput): ApplicabilityResult { return checkRacApplicability(i); }
  validateInputs(i: MixDesignInput): ValidationResult { return validateRacInputs(i); }
  calculate(i: MixDesignInput): MixDesignResult { return calculateRacMix(i); }
}
export class ShcSpecializedMethod extends Phase2MethodBase {
  public readonly metadata: MixDesignMethodMetadata = {
    id: "self-healing-specialized", name: "Self-Healing Concrete", shortName: "SHC", version: VERSION,
    description: "Healing-agent explicit proportioning with volume closure and mandatory healing/mechanical verification.", references: ["RILEM TC 221-SHC", "EN 206"], supportedLanguages: ["ar", "fr", "en"], status: "active"
  };
  isApplicable(i: MixDesignInput): ApplicabilityResult { return checkShcApplicability(i); }
  validateInputs(i: MixDesignInput): ValidationResult { return validateShcInputs(i); }
  calculate(i: MixDesignInput): MixDesignResult { return calculateShcMix(i); }
}
export class ShotcreteSpecializedMethod extends Phase2MethodBase {
  public readonly metadata: MixDesignMethodMetadata = {
    id: "shotcrete-specialized", name: "Shotcrete", shortName: "Shotcrete", version: VERSION,
    description: "Process-aware starting proportioning for wet/dry shotcrete with accelerator and spray verification.", references: ["EN 14487", "ACI 506R"], supportedLanguages: ["ar", "fr", "en"], status: "active"
  };
  isApplicable(i: MixDesignInput): ApplicabilityResult { return checkShotcreteApplicability(i); }
  validateInputs(i: MixDesignInput): ValidationResult { return validateShotcreteInputs(i); }
  calculate(i: MixDesignInput): MixDesignResult { return calculateShotcreteMix(i); }
}

export const gpcSpecializedMethod = new GpcSpecializedMethod();
export const racSpecializedMethod = new RacSpecializedMethod();
export const shcSpecializedMethod = new ShcSpecializedMethod();
export const shotcreteSpecializedMethod = new ShotcreteSpecializedMethod();
