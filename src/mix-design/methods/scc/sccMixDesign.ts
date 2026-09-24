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
  const flow = Number((input as any).sccTargetSlumpFlowMm ?? ((input as any).slumpFlowMm) ?? 650);
  const wb = Number((input as any).sccWaterBinderRatio ?? 0.38);
  const water = Number((input as any).sccWaterKgM3 ?? 170);

  if (!Number.isFinite(fck) || fck <= 0) errors.push({ code: "fck", severity: "error", field: "fck28", message: "SCC target strength must be > 0 MPa." });
  if (!Number.isFinite(dMax) || dMax <= 0 || dMax > 20) errors.push({ code: "dmax", severity: "error", field: "dMax", message: "SCC Dmax must be in the specialized calculation envelope (<= 20 mm)." });
  if (!Number.isFinite(flow) || flow < 550 || flow > 850) errors.push({ code: "slump_flow", severity: "error", field: "sccTargetSlumpFlowMm", message: "Target slump flow must be between 550 and 850 mm for this SCC engine." });
  if (!Number.isFinite(wb) || wb < 0.30 || wb > 0.45) errors.push({ code: "water_binder", severity: "error", field: "sccWaterBinderRatio", message: "SCC water/binder ratio must be between 0.30 and 0.45 in the current engine." });
  if (!Number.isFinite(water) || water < 140 || water > 210) errors.push({ code: "water", severity: "error", field: "sccWaterKgM3", message: "SCC effective water must be between 140 and 210 kg/m3 in the current engine." });

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
  const resolved = resolveSpecializedMaterials(input, language, true);
  if (resolved.errors.length > 0) {
    return makeSpecializedResult(input, {
      methodId: "scc-specialized",
      methodName: "SCC / Self-Compacting Concrete",
      version: VERSION,
      cementKg: 0,
      waterKg: 0,
      fineAggregateKg: 0,
      coarseAggregateKg: 0,
      admixtureKg: 0,
      waterBinderRatio: 0,
      freshDensityKgM3: 0,
      absoluteVolumeL: 0,
      warnings: resolved.errors,
      assumptions: [],
      recommendations: ["Complete the approved material-library selections before SCC calculation."],
      trace: [],
      complianceChecks: [{
        parameter: "materials",
        requirement: "All required SCC materials",
        actual: resolved.errors.join(" | "),
        status: "non_compliant"
      }],
      lifecycle: "blocked"
    });
  }

  const cementMaterial = resolved.materials.cement;
  const sandMaterial = resolved.materials.sand;
  const gravelMaterial = resolved.materials.gravel;
  const admixtureMaterial = resolved.materials.admixture;

  const cementDensity = materialDensityKgM3(cementMaterial, Number(input.cementDensity || 3150));
  const sandDensity = materialDensityKgM3(sandMaterial, Number(input.sandRelativeDensity || 2.65) * 1000);
  const gravelDensity = materialDensityKgM3(gravelMaterial, Number(input.gravelRelativeDensity || 2.65) * 1000);
  const admixtureDensity = materialDensityKgM3(admixtureMaterial, Number(input.selectedAdmixtureDensity || 1100));

  const fck = Number(input.fck28);
  const flow = Number((input as any).sccTargetSlumpFlowMm ?? (input as any).slumpFlowMm ?? 650);
  const requestedWb = Number((input as any).sccWaterBinderRatio ?? NaN);
  const water = Number((input as any).sccWaterKgM3 ?? (165 + Math.min(30, Math.max(0, flow - 550) * 0.08)));
  const wb = Number.isFinite(requestedWb)
    ? Math.min(0.45, Math.max(0.30, requestedWb))
    : Math.min(0.45, Math.max(0.30, 0.45 - Math.max(0, fck - 25) * 0.003));

  let binder = water / wb;
  binder = Math.min(500, Math.max(380, binder));

  const scmPct = Math.min(
    50,
    Math.max(
      0,
      Number(input.dosageFlyAsh || 0) +
      Number(input.dosageSlag || 0) +
      Number(input.dosageSilicaFume || 0)
    )
  );
  const scmKg = binder * scmPct / 100;
  const cementKg = binder - scmKg;

  const coarseVolumeFraction = Math.min(
    0.35,
    Math.max(0.28, Number((input as any).sccCoarseAggregateVolumeFraction ?? 0.30))
  );
  const coarseVolumeL = coarseVolumeFraction * 1000;
  const coarseKg = coarseVolumeL / 1000 * gravelDensity;

  const superDosage = Math.min(
    3.0,
    Math.max(
      0.4,
      Number((input as any).sccSuperplasticizerDosage ?? input.dosageSuper ?? 1.2)
    )
  );
  const admixtureKg = binder * superDosage / 100;

  const airPercent = Math.min(5, Math.max(0.5, Number(input.airContent || 2)));
  const binderVolumeL = cementKg / cementDensity * 1000 + scmKg / Number(input.selectedScmDensity || 2200) * 1000;
  const waterVolumeL = water;
  const admixtureVolumeL = admixtureKg / admixtureDensity * 1000;
  const airVolumeL = airPercent * 10;

  const fineVolumeL = 1000 - binderVolumeL - waterVolumeL - admixtureVolumeL - airVolumeL - coarseVolumeL;
  const errors: string[] = [];
  if (fineVolumeL <= 0) {
    errors.push("The absolute-volume balance leaves no positive fine-aggregate volume.");
  }
  const fineKg = Math.max(0, fineVolumeL / 1000 * sandDensity);

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

  const actualWaterToBinder = water / binder;
  const totalVolumeL =
    binderVolumeL +
    waterVolumeL +
    coarseVolumeL +
    fineVolumeL +
    admixtureVolumeL +
    airVolumeL;

  const estimatedFreshDensity =
    cementKg + scmKg + sandCorrection.wetKg + gravelCorrection.wetKg + waterToAdd + admixtureKg;

  const warnings = [
    "SCC requires confirmation by slump-flow, T500, V-funnel, L-box/J-ring and segregation testing.",
    `Target slump-flow = ${flow.toFixed(0)} mm.`
  ];

  const assumptions = [
    `SCC target slump-flow = ${flow.toFixed(0)} mm.`,
    `Effective water/binder ratio = ${actualWaterToBinder.toFixed(3)}.`,
    `Total binder = ${binder.toFixed(1)} kg/m3; SCM replacement = ${scmPct.toFixed(1)}%.`,
    `Coarse aggregate volume fraction = ${(coarseVolumeFraction * 100).toFixed(1)}% of concrete volume.`,
    "Fine aggregate is solved by absolute-volume closure after binder, water, coarse aggregate, air and admixture volumes."
  ];

  const recommendations = [
    "Run the SCC fresh-concrete laboratory verification before production approval.",
    "Adjust superplasticizer dosage with the actual product performance and compatibility test.",
    "Do not certify SCC conformity from the numerical calculation alone."
  ];

  const complianceChecks: any[] = [
    { parameter: "slump_flow", requirement: "550-850 mm calculation envelope", actual: `${flow.toFixed(0)} mm`, status: flow >= 550 && flow <= 850 ? "compliant" : "non_compliant" },
    { parameter: "water_binder", requirement: "0.30-0.45", actual: actualWaterToBinder.toFixed(3), status: actualWaterToBinder >= 0.30 && actualWaterToBinder <= 0.45 ? "compliant" : "non_compliant" },
    { parameter: "binder", requirement: "380-500 kg/m3", actual: `${binder.toFixed(1)} kg/m3`, status: binder >= 380 && binder <= 500 ? "compliant" : "non_compliant" },
    { parameter: "dmax", requirement: "<=20 mm", actual: `${Number(input.dMax).toFixed(1)} mm`, status: Number(input.dMax) <= 20 ? "compliant" : "non_compliant" },
    { parameter: "volume_closure", requirement: "absolute volume = 1000 L/m3", actual: `${totalVolumeL.toFixed(2)} L/m3`, status: Math.abs(totalVolumeL - 1000) <= 2 ? "compliant" : "non_compliant" },
    { parameter: "trial_mix", requirement: "laboratory verification required", actual: "Required", status: "warning" }
  ];

  if (errors.length > 0) {
    complianceChecks.push({
      parameter: "fine_aggregate_volume",
      requirement: ">0 L/m3",
      actual: errors.join(" | "),
      status: "non_compliant"
    });
  }

  const result = makeSpecializedResult(input, {
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
    waterBinderRatio: actualWaterToBinder,
    freshDensityKgM3: estimatedFreshDensity,
    absoluteVolumeL: totalVolumeL,
    warnings,
    assumptions,
    recommendations,
    trace: [
      { stepId: "scc-1", label: "Select effective water from target slump-flow.", formula: "W = f(slump-flow)", inputs: { flow }, output: water, unit: "kg/m3" },
      { stepId: "scc-2", label: "Determine water/binder ratio.", formula: "W/B = clamp(0.45 - 0.003·max(fck-25,0), 0.30, 0.45)", inputs: { fck }, output: actualWaterToBinder, unit: "-" },
      { stepId: "scc-3", label: "Calculate total binder.", formula: "B = W / (W/B), constrained to 380-500 kg/m3", inputs: { water, requestedWb }, output: binder, unit: "kg/m3" },
      { stepId: "scc-4", label: "Allocate SCM replacement.", formula: "SCM = B·replacement%", inputs: { scmPct }, output: scmKg, unit: "kg/m3" },
      { stepId: "scc-5", label: "Set coarse aggregate volume fraction.", formula: "Vca = Vc·fraction", inputs: { coarseVolumeFraction }, output: coarseVolumeL, unit: "L/m3" },
      { stepId: "scc-6", label: "Close absolute volume with fine aggregate.", formula: "Vfa = 1000 - Vb - Vw - Vca - Va - Vad", inputs: { binderVolumeL, waterVolumeL, coarseVolumeL, airVolumeL, admixtureVolumeL }, output: fineVolumeL, unit: "L/m3" },
      { stepId: "scc-7", label: "Correct batching water for aggregate moisture.", formula: "Wadd = W - Wfree + Wdeficit", inputs: { freeSurfaceWater: sandCorrection.freeSurfaceWater + gravelCorrection.freeSurfaceWater, absorptionDeficit: sandCorrection.absorptionDeficit + gravelCorrection.absorptionDeficit }, output: waterToAdd, unit: "kg/m3" }
    ],
    complianceChecks,
    lifecycle: errors.length > 0 ? "blocked" : "needs_trial_mix"
  });

  result.batchWaterToAdd = waterToAdd;
  result.waterToAdd = waterToAdd;
  result.waterWeightWet = waterToAdd;
  result.sandTotalMoistureWater = sandCorrection.moistureWater;
  result.gravelTotalMoistureWater = gravelCorrection.moistureWater;
  result.totalFreeSurfaceWater = sandCorrection.freeSurfaceWater + gravelCorrection.freeSurfaceWater;
  result.totalAbsorptionDeficit = sandCorrection.absorptionDeficit + gravelCorrection.absorptionDeficit;
  result.engineeringAudit = {
    specializedMethod: "SCC",
    framework: "EFNARC-oriented proportioning workflow",
    targetSlumpFlowMm: flow,
    waterBinderRatio: actualWaterToBinder,
    binderKgM3: binder,
    coarseVolumeFraction
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
