import {
  MixDesignInput,
  MixDesignResult,
  CalculationContext,
  ValidationResult,
  ApplicabilityResult
} from "../../core/types";
import {
  computeMoistureBatch,
  makeSpecializedResult,
  materialDensityKgM3,
  materialProperty,
  resolveSpecializedMaterials
} from "../shared/specializedMixDesignUtils";

const VERSION = "1.0.0";

export function checkSccApplicability(input: MixDesignInput): ApplicabilityResult {
  const reasons: string[] = [];
  const recommendations: string[] = [];
  const type = String(input.concreteType || "SCC").toUpperCase();

  if (type !== "SCC") {
    return {
      level: "not_applicable",
      reasons: ["SCC specialized method requires concreteType = SCC."],
      recommendations: ["Select SCC before running the SCC mix-design engine."]
    };
  }

  const dMax = Number(input.dMax || 0);
  if (dMax > 20) {
    reasons.push(`Dmax = ${dMax} mm is high for the current SCC calculation envelope.`);
    recommendations.push("Use Dmax <= 20 mm and verify passing ability with L-box/J-ring testing.");
  }

  return {
    level: "applicable",
    reasons,
    recommendations
  };
}

export function validateSccInputs(
  input: MixDesignInput,
  language: "ar" | "fr" | "en" = "ar"
): ValidationResult {
  const errors: any[] = [];
  const warnings: any[] = [];
  const resolved = resolveSpecializedMaterials(input, language, true);
  errors.push(...resolved.errors.map((message) => ({
    code: "material_resolution",
    severity: "error",
    field: "materialsDatabase",
    message
  })));

  const fck = Number(input.fck28);
  const dMax = Number(input.dMax);
  const flow = Number((input as any).sccTargetSlumpFlowMm ?? (input as any).slumpFlowMm ?? 650);
  const powder = Number((input as any).sccPowderKgM3 ?? 500);
  const wpv = Number((input as any).sccWaterPowderRatioByVolume ?? 0.90);
  const waterExplicit = Number((input as any).sccWaterKgM3 ?? NaN);

  if (!Number.isFinite(fck) || fck <= 0) errors.push({ code: "fck", severity: "error", field: "fck28", message: "SCC target strength must be > 0 MPa." });
  if (!Number.isFinite(dMax) || dMax <= 0 || dMax > 20) errors.push({ code: "dmax", severity: "error", field: "dMax", message: "SCC Dmax must be in the specialized calculation envelope (<= 20 mm)." });
  if (!Number.isFinite(flow) || flow < 500 || flow > 850) errors.push({ code: "slump_flow", severity: "error", field: "sccTargetSlumpFlowMm", message: "Target slump flow must be within the supported SCC input envelope (500-850 mm)." });
  if (!Number.isFinite(powder) || powder < 380 || powder > 600) errors.push({ code: "powder", severity: "error", field: "sccPowderKgM3", message: "SCC total powder must be between 380 and 600 kg/m3 for the initial EFNARC-oriented composition." });
  if (!Number.isFinite(wpv) || wpv < 0.80 || wpv > 1.10) errors.push({ code: "water_powder_volume", severity: "error", field: "sccWaterPowderRatioByVolume", message: "SCC water/powder ratio by volume must be between 0.80 and 1.10 for the initial composition." });
  if (Number.isFinite(waterExplicit) && Number.isFinite(wpv) && Number.isFinite(powder) && Math.abs(waterExplicit / powder - wpv) > 0.02) errors.push({ code: "water_powder_conflict", severity: "error", field: "sccWaterKgM3", message: "Explicit SCC water conflicts with the declared water/powder ratio by more than ±0.02." });

  const slump = Number(input.slump || 0);
  if (slump > 0 && slump > 30) {
    warnings.push({ code: "legacy_slump", severity: "warning", field: "slump", message: "SCC uses slump-flow in mm; the legacy slump field is ignored for the specialized SCC calculation." });
  }

  return { isValid: errors.length === 0, errors, warnings };
}

export function calculateSccMix(
  input: MixDesignInput,
  language: "ar" | "fr" | "en" = "ar"
): MixDesignResult {
  const validation = validateSccInputs(input, language);
  const resolved = resolveSpecializedMaterials(input, language, true);
  if (resolved.errors.length > 0 || !validation.isValid) {
    return makeSpecializedResult(input, {
      methodId: "scc-specialized",
      methodName: "SCC / Self-Compacting Concrete",
      version: VERSION,
      cementKg: 0, waterKg: 0, fineAggregateKg: 0, coarseAggregateKg: 0, admixtureKg: 0,
      waterBinderRatio: 0, freshDensityKgM3: 0, absoluteVolumeL: 0,
      warnings: [...resolved.errors, ...validation.warnings.map(w => w.message)],
      assumptions: [],
      recommendations: ["Complete the approved SCC material selections before calculation."],
      trace: [],
      complianceChecks: [...resolved.errors.map(message => ({ parameter: "materials", requirement: "Required SCC materials resolved from library", actual: message, status: "non_compliant" as const })), ...validation.errors.map(e => ({ parameter: e.code, requirement: "Valid SCC specialized input", actual: e.message, status: "non_compliant" as const }))],
      lifecycle: "blocked"
    });
  }

  const cementMaterial = resolved.materials.cement;
  const sandMaterial = resolved.materials.sand;
  const gravelMaterial = resolved.materials.gravel;
  const admixtureMaterial = resolved.materials.admixture;

  // EFNARC-oriented initial proportioning is volumetric. The guidelines do
  // not define a unique SCC mix-design equation; the initial composition is
  // refined by laboratory trials for filling, passing and segregation.
  const powderKg = Number((input as any).sccPowderKgM3 ?? 500);
  const powderVolumeTargetL = Number((input as any).sccPowderVolumeL ?? NaN);
  const powderDensityFallback = Number(input.cementDensity || 3150);
  const cementDensity = materialDensityKgM3(cementMaterial, powderDensityFallback);
  const scmDensity = Number(input.selectedScmDensity || 2200);
  const sandDensity = materialDensityKgM3(sandMaterial, Number(input.sandRelativeDensity || 2.65) * 1000);
  const gravelDensity = materialDensityKgM3(gravelMaterial, Number(input.gravelRelativeDensity || 2.65) * 1000);
  const admixtureDensity = materialDensityKgM3(admixtureMaterial, Number(input.selectedAdmixtureDensity || 1100));

  const scmPct = Math.max(0, Math.min(60,
    Number((input as any).sccScmReplacementPercent ??
      input.selectedScmReplacementPercent ??
      Number(input.dosageFlyAsh || 0) + Number(input.dosageSlag || 0) + Number(input.dosageSilicaFume || 0))
  ));
  const scmKg = powderKg * scmPct / 100;
  if (scmKg > 0 && Array.isArray(input.materialsDatabase) && input.materialsDatabase.length > 0 && !resolved.materials.scm) {
    return makeSpecializedResult(input, {
      methodId: "scc-specialized",
      methodName: "SCC / Self-Compacting Concrete",
      version: VERSION,
      cementKg: 0, waterKg: 0, fineAggregateKg: 0, coarseAggregateKg: 0, admixtureKg: 0,
      waterBinderRatio: 0, freshDensityKgM3: 0, absoluteVolumeL: 0,
      warnings: ["SCM replacement was requested but no approved SCM was resolved from the material library."],
      assumptions: [],
      recommendations: ["Select an approved SCM material or set SCC SCM replacement to 0%."],
      trace: [],
      complianceChecks: [{
        parameter: "scm_material",
        requirement: "Approved SCM from material library when SCM replacement > 0%",
        actual: "SCM material missing",
        status: "non_compliant"
      }],
      lifecycle: "blocked"
    });
  }
  const cementKg = powderKg - scmKg;
  const powderVolumeL = Number.isFinite(powderVolumeTargetL) && powderVolumeTargetL > 0
    ? powderVolumeTargetL
    : cementKg / cementDensity * 1000 + scmKg / scmDensity * 1000;

  const requestedWpv = Number((input as any).sccWaterPowderRatioByVolume ?? NaN);
  const wpv = Number.isFinite(requestedWpv) ? requestedWpv : 0.90;
  const waterRequested = Number((input as any).sccWaterKgM3 ?? NaN);
  const water = Number.isFinite(waterRequested) ? waterRequested : wpv * powderVolumeL;
  const actualWpv = water / powderVolumeL;
  const waterBinderRatio = water / powderKg;

  const coarseFractionRequested = Number((input as any).sccCoarseAggregateVolumeFraction ?? 0.32);
  const coarseVolumeFraction = coarseFractionRequested;
  const coarseVolumeL = coarseVolumeFraction * 1000;
  const coarseKg = coarseVolumeL / 1000 * gravelDensity;

  const superDosage = Number((input as any).sccSuperplasticizerDosage ?? input.dosageSuper ?? 1.0);
  const admixtureKg = powderKg * Math.max(0, superDosage) / 100;
  const admixtureVolumeL = admixtureKg / admixtureDensity * 1000;
  const airPercent = Number(input.airContent ?? 1.0);
  const airVolumeL = airPercent * 10;
  const waterVolumeL = water;

  // The remaining absolute volume is assigned to sand. This is the EFNARC
  // "balance the remaining volume with sand" starting composition, rather
  // than an empirical strength-to-water equation.
  const fineVolumeL = 1000 - powderVolumeL - waterVolumeL - admixtureVolumeL - coarseVolumeL - airVolumeL;
  const fineKg = fineVolumeL > 0 ? fineVolumeL / 1000 * sandDensity : 0;

  const sandCorrection = computeMoistureBatch(
    fineKg,
    Number(input.moistureSand || 0),
    Number(input.sandAbsorption || materialProperty(sandMaterial, ["absorption", "Absorption"], 0) || 0)
  );
  const gravelCorrection = computeMoistureBatch(
    coarseKg,
    Number(input.moistureGravel || 0),
    Number(input.gravelAbsorption || materialProperty(gravelMaterial, ["absorption", "Absorption"], 0) || 0)
  );

  const waterToAdd = Math.max(
    0,
    water - sandCorrection.freeSurfaceWater - gravelCorrection.freeSurfaceWater +
    sandCorrection.absorptionDeficit + gravelCorrection.absorptionDeficit
  );

  const totalVolumeL =
    powderVolumeL + waterVolumeL + fineVolumeL + coarseVolumeL + admixtureVolumeL + airVolumeL;

  const totalAggregateKg = fineKg + coarseKg;
  const sandMassShare = totalAggregateKg > 0 ? fineKg / totalAggregateKg : 0;
  const pasteVolumeL = powderVolumeL + waterVolumeL + admixtureVolumeL + airVolumeL;
  const errors: string[] = [];

  if (!Number.isFinite(powderKg) || powderKg < 380 || powderKg > 600) {
    errors.push("Total SCC powder must be within the 380-600 kg/m3 initial design envelope.");
  }
  if (!Number.isFinite(actualWpv) || actualWpv < 0.80 || actualWpv > 1.10) {
    errors.push("SCC water/powder ratio by volume must be within 0.80-1.10 for the EFNARC-oriented initial composition.");
  }
  if (!Number.isFinite(coarseVolumeFraction) || coarseVolumeFraction < 0.28 || coarseVolumeFraction > 0.35) {
    errors.push("SCC coarse aggregate volume fraction must be within 28-35% of concrete volume.");
  }
  if (fineVolumeL <= 0) errors.push("Absolute-volume balance leaves no positive fine-aggregate volume.");
  if (Math.abs(totalVolumeL - 1000) > 1) errors.push("Absolute-volume closure is outside the 1 L/m3 calculation tolerance.");

  const flow = Number((input as any).sccTargetSlumpFlowMm ?? (input as any).slumpFlowMm ?? 650);
  if (!Number.isFinite(flow) || flow < 500 || flow > 850) {
    errors.push("Target slump-flow must be a positive value within the supported SCC input envelope (500-850 mm).");
  }

  const complianceChecks: any[] = [
    { parameter: "powder", requirement: "380-600 kg/m3 initial SCC envelope", actual: powderKg.toFixed(1) + " kg/m3", status: powderKg >= 380 && powderKg <= 600 ? "compliant" : "non_compliant" },
    { parameter: "water_powder_volume", requirement: "0.80-1.10 by volume", actual: actualWpv.toFixed(3), status: actualWpv >= 0.80 && actualWpv <= 1.10 ? "compliant" : "non_compliant" },
    { parameter: "coarse_aggregate_volume", requirement: "28-35% of concrete volume", actual: (coarseVolumeFraction * 100).toFixed(1) + "%", status: coarseVolumeFraction >= 0.28 && coarseVolumeFraction <= 0.35 ? "compliant" : "non_compliant" },
    { parameter: "sand_share", requirement: "Typically about 48-55% of total aggregate mass", actual: (sandMassShare * 100).toFixed(1) + "%", status: sandMassShare >= 0.48 && sandMassShare <= 0.55 ? "compliant" : "warning" },
    { parameter: "paste_volume", requirement: "Check initial paste-volume envelope against selected materials", actual: pasteVolumeL.toFixed(1) + " L/m3", status: pasteVolumeL >= 300 && pasteVolumeL <= 400 ? "compliant" : "warning" },
    { parameter: "volume_closure", requirement: "1000 L/m3", actual: totalVolumeL.toFixed(2) + " L/m3", status: Math.abs(totalVolumeL - 1000) <= 1 ? "compliant" : "non_compliant" },
    { parameter: "fresh_scc_tests", requirement: "Slump-flow, viscosity, passing ability and segregation resistance", actual: "Laboratory verification required", status: "warning" }
  ];

  const warnings = [
    "This is an EFNARC-oriented initial SCC proportioning, not a production certification.",
    "Fresh SCC performance must be confirmed by laboratory tests for filling ability, passing ability and segregation resistance.",
    `Target slump-flow input = ${flow.toFixed(0)} mm.`
  ];

  const assumptions = [
    `Total powder = ${powderKg.toFixed(1)} kg/m3; powder volume = ${powderVolumeL.toFixed(1)} L/m3.`,
    `Water/powder ratio by volume = ${actualWpv.toFixed(3)}.`,
    `Coarse aggregate volume fraction = ${(coarseVolumeFraction * 100).toFixed(1)}%.`,
    `Sand fills the remaining absolute volume after powder, water, coarse aggregate, air and admixture.`,
    `SCM replacement of total powder = ${scmPct.toFixed(1)}%.`
  ];

  const recommendations = [
    "Verify the actual cement/SCM-water compatibility and superplasticizer response with the selected material lots.",
    "Use slump-flow, T500/V-funnel, L-box or J-ring, and segregation-resistance tests to refine the trial mix.",
    "Check hardened strength and EN 206 durability requirements separately; the SCC initial proportioning does not predict strength by an unsupported empirical equation."
  ];

  const result: any = makeSpecializedResult(input, {
    methodId: "scc-specialized",
    methodName: "SCC / Self-Compacting Concrete",
    version: VERSION,
    cementKg,
    waterKg: water,
    fineAggregateKg: fineKg,
    coarseAggregateKg: coarseKg,
    admixtureKg,
    admixtureName: String(admixtureMaterial?.name || input.selectedAdmixtureName || "Superplasticizer"),
    scmKg,
    waterBinderRatio,
    freshDensityKgM3: cementKg + scmKg + sandCorrection.wetKg + gravelCorrection.wetKg + waterToAdd + admixtureKg,
    absoluteVolumeL: totalVolumeL,
    warnings,
    assumptions,
    recommendations,
    trace: [
      { stepId: "scc-1", label: "Select total powder content.", formula: "P = user target or 500 kg/m3 initial value", inputs: { requested: (input as any).sccPowderKgM3 }, output: powderKg, unit: "kg/m3" },
      { stepId: "scc-2", label: "Compute powder absolute volume.", formula: "Vp = Vc + Vscm", inputs: { cementKg, scmKg, cementDensity, scmDensity }, output: powderVolumeL, unit: "L/m3" },
      { stepId: "scc-3", label: "Determine effective water from W/P by volume or explicit water.", formula: "W = (Vw/Vp)·Vp or user water", inputs: { requestedWpv, waterRequested }, output: water, unit: "kg/m3" },
      { stepId: "scc-4", label: "Set coarse aggregate volume fraction.", formula: "Vca = 0.28-0.35·1000 L/m3", inputs: { coarseVolumeFraction }, output: coarseVolumeL, unit: "L/m3" },
      { stepId: "scc-5", label: "Balance remaining volume with fine aggregate.", formula: "Vfa = 1000 - Vp - Vw - Vad - Vair - Vca", inputs: { powderVolumeL, waterVolumeL, admixtureVolumeL, airVolumeL, coarseVolumeL }, output: fineVolumeL, unit: "L/m3" },
      { stepId: "scc-6", label: "Correct batch water for aggregate moisture/absorption.", formula: "Wadd = W - Wfree + Wdeficit", inputs: { freeSurfaceWater: sandCorrection.freeSurfaceWater + gravelCorrection.freeSurfaceWater, absorptionDeficit: sandCorrection.absorptionDeficit + gravelCorrection.absorptionDeficit }, output: waterToAdd, unit: "kg/m3" }
    ],
    complianceChecks,
    lifecycle: errors.length > 0 ? "blocked" : "needs_trial_mix"
  });

  // Keep SCC W/P and W/C semantically distinct in the returned result.
  // W/P is the SCC proportioning control; W/C remains a reporting ratio only.
  result.waterCementRatio = cementKg > 0 ? water / cementKg : 0;
  result.wcRatio = result.waterCementRatio;
  result.ratios.waterCementRatio = result.waterCementRatio;
  result.ratios.waterBinderRatio = waterBinderRatio;

  result.batchWaterToAdd = waterToAdd;
  result.waterToAdd = waterToAdd;
  result.waterWeightWet = waterToAdd;
  result.sandTotalMoistureWater = sandCorrection.moistureWater;
  result.gravelTotalMoistureWater = gravelCorrection.moistureWater;
  result.totalFreeSurfaceWater = sandCorrection.freeSurfaceWater + gravelCorrection.freeSurfaceWater;
  result.totalAbsorptionDeficit = sandCorrection.absorptionDeficit + gravelCorrection.absorptionDeficit;
  result.engineeringAudit = {
    specializedMethod: "SCC",
    framework: "EFNARC-oriented initial composition",
    targetSlumpFlowMm: flow,
    totalPowderKgM3: powderKg,
    waterPowderVolumeRatio: actualWpv,
    coarseVolumeFraction,
    coarseAggregateVolumeFraction: coarseVolumeFraction,
    pasteVolumeL,
    sandMassShare
  };
  result.materialSuitability = {
    status: "approved",
    missingMaterials: [],
    invalidMaterials: [],
    incompatibleMaterials: [],
    warnings: [],
    recommendations
  };

  return result as MixDesignResult;
}
