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

export function checkPerviousApplicability(input: MixDesignInput): ApplicabilityResult {
  const type = String(input.concreteType || "PERVIOUS").toUpperCase();
  if (type !== "PERVIOUS") {
    return {
      level: "not_applicable",
      reasons: ["Pervious specialized method requires concreteType = PERVIOUS."],
      recommendations: ["Select PERVIOUS before running the pervious mix-design engine."]
    };
  }
  return {
    level: "applicable",
    reasons: [],
    recommendations: [
      "Fresh void content and fresh density must be verified on trial batches.",
      "Permeability and hardened void content must be verified on the final trial mixture."
    ]
  };
}

export function validatePerviousInputs(
  input: MixDesignInput,
  language: "ar" | "fr" | "en" = "ar"
): ValidationResult {
  const errors: any[] = [];
  const warnings: any[] = [];
  const resolved = resolveSpecializedMaterials(input, language, false);
  errors.push(...resolved.errors.map((message) => ({
    code: "material_resolution",
    severity: "error",
    field: "materialsDatabase",
    message
  })));

  const targetVoid = Number((input as any).perviousTargetVoidContent ?? input.approvedVoidRatio ?? 20);
  const dMax = Number(input.dMax);
  const wb = Number((input as any).perviousWaterBinderRatio ?? NaN);

  if (!Number.isFinite(targetVoid) || targetVoid < 15 || targetVoid > 30) {
    errors.push({ code: "void_content", severity: "error", field: "perviousTargetVoidContent", message: "Target pervious void content must be between 15% and 30%." });
  }
  if (!Number.isFinite(dMax) || dMax <= 0 || dMax > 25) {
    errors.push({ code: "dmax", severity: "error", field: "dMax", message: "Pervious Dmax must be within 0-25 mm in the current engine." });
  }
  if (Number(input.slump || 0) > 3) {
    errors.push({ code: "slump", severity: "error", field: "slump", message: "Pervious concrete requires near-zero slump; use 0-3 cm." });
  }
  if (Number.isFinite(wb) && (wb < 0.30 || wb > 0.35)) {
    errors.push({ code: "water_binder", severity: "error", field: "perviousWaterBinderRatio", message: "Pervious water/binder ratio must be between 0.30 and 0.35 in the current engine." });
  }

  warnings.push({
    code: "pervious_acceptance",
    severity: "warning",
    field: "trial_mix",
    message: "Pervious concrete must be verified by fresh density/void content and hardened permeability/void testing before production."
  });

  return { isValid: errors.length === 0, errors, warnings };
}

export function calculatePerviousMix(
  input: MixDesignInput,
  language: "ar" | "fr" | "en" = "ar"
): MixDesignResult {
  const resolved = resolveSpecializedMaterials(input, language, false);
  if (resolved.errors.length > 0) {
    return makeSpecializedResult(input, {
      methodId: "pervious-specialized",
      methodName: "Pervious Concrete",
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
      recommendations: ["Complete the approved material-library selections before pervious calculation."],
      trace: [],
      complianceChecks: [{
        parameter: "materials",
        requirement: "Required pervious materials",
        actual: resolved.errors.join(" | "),
        status: "non_compliant"
      }],
      lifecycle: "blocked"
    });
  }

  const cementMaterial = resolved.materials.cement;
  const sandMaterial = resolved.materials.sand;
  const gravelMaterial = resolved.materials.gravel;

  const cementDensity = materialDensityKgM3(cementMaterial, Number(input.cementDensity || 3150));
  const sandDensity = materialDensityKgM3(sandMaterial, Number(input.sandRelativeDensity || 2.65) * 1000);
  const gravelDensity = materialDensityKgM3(gravelMaterial, Number(input.gravelRelativeDensity || 2.65) * 1000);
  const aggregateBulkDensity =
    Number((input as any).approvedCompactedBulkDensity || 0) ||
    Number((gravelMaterial as any)?.compactedBulkDensity || 0) ||
    Number((input as any).approvedBulkDensity || 0) ||
    Number((gravelMaterial as any)?.bulkDensity || 0);

  const targetVoid = Math.min(
    30,
    Math.max(15, Number((input as any).perviousTargetVoidContent ?? input.approvedVoidRatio ?? 20))
  );

  const aggregateBulk = aggregateBulkDensity > 0 ? aggregateBulkDensity : 1450;
  const aggregateVoidFraction = Math.max(0.10, Math.min(0.60, 1 - aggregateBulk / gravelDensity));
  const targetPasteVolumeFraction = Math.min(
    0.35,
    Math.max(0.12, aggregateVoidFraction - targetVoid / 100)
  );
  const fineFraction = Math.min(
    0.15,
    Math.max(0, Number((input as any).perviousFineAggregateFraction ?? 0.05))
  );

  const fck = Number(input.fck28 || 12);
  const requestedWb = Number((input as any).perviousWaterBinderRatio ?? NaN);
  const wb = Number.isFinite(requestedWb)
    ? Math.min(0.35, Math.max(0.30, requestedWb))
    : Math.min(0.35, Math.max(0.30, 0.35 - Math.max(0, fck - 5.5) * 0.004));

  const scmPct = Math.min(
    30,
    Math.max(
      0,
      Number(input.dosageFlyAsh || 0) +
      Number(input.dosageSlag || 0) +
      Number(input.dosageSilicaFume || 0)
    )
  );

  const binderDensity = cementDensity;
  const pasteVolumeL = targetPasteVolumeFraction * 1000;
  const binderKg = pasteVolumeL / (1000 / binderDensity + wb);
  const waterKg = binderKg * wb;
  const scmKg = binderKg * scmPct / 100;
  const cementKg = binderKg - scmKg;

  const coarseKg = aggregateBulk * (1 - fineFraction);
  const fineKg = aggregateBulk * fineFraction;

  const admixtureDosage = Math.min(
    2.0,
    Math.max(0, Number((input as any).perviousAdmixtureDosage ?? 0))
  );
  const admixtureKg = binderKg * admixtureDosage / 100;

  const airPercent = 0;
  const pasteComponentVolumeL =
    cementKg / cementDensity * 1000 +
    scmKg / Number(input.selectedScmDensity || 2200) * 1000 +
    waterKg +
    (admixtureKg / 1100 * 1000);

  const coarseSolidVolumeL = coarseKg / gravelDensity * 1000;
  const fineSolidVolumeL = fineKg / sandDensity * 1000;
  const totalVolumeL = pasteComponentVolumeL + coarseSolidVolumeL + fineSolidVolumeL;
  const estimatedVoid = 100 * (1 - (
    coarseSolidVolumeL +
    fineSolidVolumeL +
    cementKg / cementDensity * 1000 +
    scmKg / Number(input.selectedScmDensity || 2200) * 1000 +
    waterKg +
    admixtureKg / 1100 * 1000
  ) / 1000);

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
    waterKg - sandCorrection.freeSurfaceWater - gravelCorrection.freeSurfaceWater +
    sandCorrection.absorptionDeficit + gravelCorrection.absorptionDeficit
  );

  const estimatedFreshDensity =
    cementKg + scmKg + fineKg + coarseKg + waterToAdd + admixtureKg;

  const warnings = [
    "Pervious concrete is controlled by connected void structure and permeability, not slump-based conventional concrete criteria.",
    `Target total void content = ${targetVoid.toFixed(1)}%.`
  ];

  const assumptions = [
    `Target total void content = ${targetVoid.toFixed(1)}%.`,
    `Coarse aggregate bulk density used = ${aggregateBulk.toFixed(0)} kg/m3.`,
    `Estimated aggregate void fraction = ${(aggregateVoidFraction * 100).toFixed(1)}%.`,
    `Calculated paste volume fraction = ${(targetPasteVolumeFraction * 100).toFixed(1)}%.`,
    `Water/binder ratio = ${(waterKg / binderKg).toFixed(3)}.`,
    `Fine aggregate fraction = ${(fineFraction * 100).toFixed(1)}% of aggregate mass.`
  ];

  const recommendations = [
    "Verify fresh density and void content on a laboratory trial batch.",
    "Verify hardened permeability and in-place density/void content for the actual application.",
    "Do not use conventional slump or normal-concrete compressive-strength gates as the primary acceptance criterion."
  ];

  const complianceChecks: any[] = [
    { parameter: "void_content", requirement: "15-30% target envelope", actual: `${targetVoid.toFixed(1)}%`, status: targetVoid >= 15 && targetVoid <= 30 ? "compliant" : "non_compliant" },
    { parameter: "water_binder", requirement: "0.30-0.35 calculation envelope", actual: (waterKg / binderKg).toFixed(3), status: waterKg / binderKg >= 0.30 && waterKg / binderKg <= 0.35 ? "compliant" : "non_compliant" },
    { parameter: "slump", requirement: "0-3 cm", actual: `${Number(input.slump || 0).toFixed(1)} cm`, status: Number(input.slump || 0) <= 3 ? "compliant" : "non_compliant" },
    { parameter: "paste_volume", requirement: "positive and derived from aggregate voids", actual: `${pasteVolumeL.toFixed(1)} L/m3`, status: pasteVolumeL > 0 ? "compliant" : "non_compliant" },
    { parameter: "trial_mix", requirement: "fresh density/void and permeability verification", actual: "Required", status: "warning" }
  ];

  const result = makeSpecializedResult(input, {
    methodId: "pervious-specialized",
    methodName: "Pervious Concrete",
    version: VERSION,
    cementKg,
    waterKg,
    fineAggregateKg: fineKg,
    coarseAggregateKg: coarseKg,
    admixtureKg,
    scmKg,
    waterBinderRatio: waterKg / binderKg,
    freshDensityKgM3: estimatedFreshDensity,
    absoluteVolumeL: totalVolumeL,
    targetVoidContentPercent: targetVoid,
    estimatedVoidContentPercent: estimatedVoid,
    referenceFilledVolumeL: 1000 - targetVoid * 10,
    warnings,
    assumptions,
    recommendations,
    trace: [
      { stepId: "pervious-1", label: "Determine aggregate void structure from dry bulk density.", formula: "Vvoid,agg = 1 - rho_bulk/rho_particle", inputs: { aggregateBulk, gravelDensity }, output: aggregateVoidFraction, unit: "fraction" },
      { stepId: "pervious-2", label: "Determine paste volume required to leave target connected voids.", formula: "Vp = Vvoid,agg - Vvoid,target", inputs: { aggregateVoidFraction, targetVoid }, output: targetPasteVolumeFraction, unit: "fraction" },
      { stepId: "pervious-3", label: "Solve binder mass from paste volume and W/B.", formula: "B = Vp / (1/rho_b + W/B/1000)", inputs: { pasteVolumeL, wb }, output: binderKg, unit: "kg/m3" },
      { stepId: "pervious-4", label: "Split binder into cement and SCM.", formula: "SCM = B·replacement%", inputs: { scmPct }, output: scmKg, unit: "kg/m3" },
      { stepId: "pervious-5", label: "Split aggregate mass into coarse and limited fine aggregate.", formula: "Msand = Mtotal·fines", inputs: { aggregateBulk, fineFraction }, output: { fineKg, coarseKg }, unit: "kg/m3" },
      { stepId: "pervious-6", label: "Correct batching water for aggregate moisture.", formula: "Wadd = W - Wfree + Wdeficit", inputs: { freeSurfaceWater: sandCorrection.freeSurfaceWater + gravelCorrection.freeSurfaceWater, absorptionDeficit: sandCorrection.absorptionDeficit + gravelCorrection.absorptionDeficit }, output: waterToAdd, unit: "kg/m3" }
    ],
    complianceChecks,
    lifecycle: "needs_trial_mix"
  });

  result.batchWaterToAdd = waterToAdd;
  result.waterToAdd = waterToAdd;
  result.waterWeightWet = waterToAdd;
  result.sandTotalMoistureWater = sandCorrection.moistureWater;
  result.gravelTotalMoistureWater = gravelCorrection.moistureWater;
  result.totalFreeSurfaceWater = sandCorrection.freeSurfaceWater + gravelCorrection.freeSurfaceWater;
  result.totalAbsorptionDeficit = sandCorrection.absorptionDeficit + gravelCorrection.absorptionDeficit;
  result.engineeringAudit = {
    specializedMethod: "PERVIOUS",
    framework: "NRMCA/ACI-oriented void-structure proportioning workflow",
    targetVoidContentPercent: targetVoid,
    estimatedVoidContentPercent: estimatedVoid,
    aggregateBulkDensityKgM3: aggregateBulk,
    pasteVolumeFraction: targetPasteVolumeFraction,
    waterBinderRatio: waterKg / binderKg
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
