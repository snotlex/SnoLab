import { MixDesignInput, MixDesignResult, ValidationResult, ApplicabilityResult } from "../../core/types";
import {
  computeMoistureBatch,
  makeSpecializedResult,
  materialDensityKgM3,
  materialProperty,
  resolveSpecializedMaterials
} from "../shared/specializedMixDesignUtils";

const VERSION = "1.0.0";

function fiberMaterial(input: MixDesignInput): Record<string, any> | undefined {
  const db = Array.isArray(input.materialsDatabase) ? input.materialsDatabase : [];
  if (input.selectedFiberId) return db.find((m: any) => String(m?.id) === String(input.selectedFiberId));
  const name = String(input.selectedFiberName || "").trim().toLowerCase();
  if (!name) return undefined;
  return db.find((m: any) =>
    [m?.name, m?.englishName, m?.frenchName].filter(Boolean)
      .some((v: any) => String(v).trim().toLowerCase() === name)
  );
}

export function checkFrcApplicability(input: MixDesignInput): ApplicabilityResult {
  const type = String(input.concreteType || "").trim().toUpperCase();
  if (type !== "FRC") {
    return { level: "not_applicable", reasons: ["FRC specialized method requires concreteType = FRC."], recommendations: ["Select FRC before running this engine."] };
  }
  return { level: "applicable", reasons: [], recommendations: ["Use laboratory flexural/residual-strength testing to validate the selected fiber dosage."] };
}

export function validateFrcInputs(input: MixDesignInput, language: "ar" | "fr" | "en" = "ar"): ValidationResult {
  const errors: any[] = [];
  const warnings: any[] = [];
  const resolved = resolveSpecializedMaterials(input, language, false);
  errors.push(...resolved.errors.map((message) => ({ code: "material_resolution", severity: "error", field: "materialsDatabase", message })));

  const fiber = fiberMaterial(input);
  const db = Array.isArray(input.materialsDatabase) ? input.materialsDatabase : [];
  const hasRepo = db.length > 0;
  const wb = Number((input as any).frcWaterBinderRatio ?? 0.40);
  const water = Number((input as any).frcWaterKgM3 ?? 160);
  const fiberVol = Number(
    (input as any).frcFiberVolumePercent ??
      (Number(input.fiberDosageKgM3 || 0) > 0 && Number(input.fiberDensity || 0) > 0
        ? (Number(input.fiberDosageKgM3) / Number(input.fiberDensity)) * 100
        : 0)
  );
  if (!Number.isFinite(wb) || wb <= 0 || wb > 0.70) errors.push({ code: "water_binder", severity: "error", field: "frcWaterBinderRatio", message: "FRC water/binder ratio must be > 0 and <= 0.70 for the current initial design envelope." });
  if (!Number.isFinite(water) || water <= 0 || water > 220) errors.push({ code: "water", severity: "error", field: "frcWaterKgM3", message: "FRC effective water must be within 0-220 kg/m3 for the current initial proportioning envelope." });
  if (!Number.isFinite(fiberVol) || fiberVol < 0 || fiberVol > 5) errors.push({ code: "fiber_volume", severity: "error", field: "frcFiberVolumePercent", message: "Fiber volume must be between 0 and 5% for the current initial FRC proportioning envelope." });
  if (hasRepo && !fiber) errors.push({ code: "fiber_material", severity: "error", field: "selectedFiberId", message: "An approved fiber material is required for FRC calculation." });
  if (!input.selectedFiberId && !input.selectedFiberName && fiberVol > 0) warnings.push({ code: "fiber_selection", severity: "warning", field: "selectedFiberId", message: "Fiber volume was provided without a library fiber selection; production use requires an identified fiber." });
  return { isValid: errors.length === 0, errors, warnings };
}

export function calculateFrcMix(input: MixDesignInput, language: "ar" | "fr" | "en" = "ar"): MixDesignResult {
  const resolved = resolveSpecializedMaterials(input, language, true);
  const fiber = fiberMaterial(input);
  const db = Array.isArray(input.materialsDatabase) ? input.materialsDatabase : [];
  const hasRepo = db.length > 0;
  if (hasRepo && Number((input as any).frcSuperplasticizerDosage ?? input.dosageSuper ?? 0) > 0 && !resolved.materials.admixture) {
    return makeSpecializedResult(input, {
      methodId: "fiber-reinforced-specialized", methodName: "Fiber-Reinforced Concrete", version: VERSION,
      cementKg: 0, waterKg: 0, fineAggregateKg: 0, coarseAggregateKg: 0, admixtureKg: 0, fiberKg: 0,
      waterBinderRatio: 0, freshDensityKgM3: 0, absoluteVolumeL: 0,
      warnings: ["An approved superplasticizer is required when FRC admixture dosage is greater than zero."],
      assumptions: [], recommendations: ["Select an approved superplasticizer or set the FRC superplasticizer dosage to zero."], trace: [],
      complianceChecks: [{ parameter: "admixture", requirement: "Approved superplasticizer when dosage > 0", actual: "Material missing", status: "non_compliant" }], lifecycle: "blocked"
    });
  }
  const fiberVolPercent = Number((input as any).frcFiberVolumePercent ?? (
    Number(input.fiberDosageKgM3 || 0) > 0 && Number(input.fiberDensity || 0) > 0
      ? Number(input.fiberDosageKgM3) / Number(input.fiberDensity) * 100
      : 0
  ));
  if (resolved.errors.length || (hasRepo && !fiber)) {
    return makeSpecializedResult(input, {
      methodId: "fiber-reinforced-specialized", methodName: "Fiber-Reinforced Concrete", version: VERSION,
      cementKg: 0, waterKg: 0, fineAggregateKg: 0, coarseAggregateKg: 0, admixtureKg: 0, fiberKg: 0,
      waterBinderRatio: 0, freshDensityKgM3: 0, absoluteVolumeL: 0, warnings: [...resolved.errors, "Approved FRC fiber material is required."],
      assumptions: [], recommendations: ["Select approved cement, aggregates, water, admixture and fiber materials."],
      trace: [], complianceChecks: [{ parameter: "materials", requirement: "Approved FRC materials resolved from library", actual: "Material resolution failed", status: "non_compliant" }],
      lifecycle: "blocked"
    });
  }

  const cement = resolved.materials.cement;
  const sand = resolved.materials.sand;
  const gravel = resolved.materials.gravel;
  const admixture = resolved.materials.admixture;
  const cementDensity = materialDensityKgM3(cement, Number(input.cementDensity || 3150));
  const sandDensity = materialDensityKgM3(sand, Number(input.sandRelativeDensity || 2.65) * 1000);
  const gravelDensity = materialDensityKgM3(gravel, Number(input.gravelRelativeDensity || 2.68) * 1000);
  const admixtureDensity = materialDensityKgM3(admixture, Number(input.selectedAdmixtureDensity || 1100));
  const fiberDensity = materialDensityKgM3(fiber, Number(input.fiberDensity || 7850));

  const water = Number((input as any).frcWaterKgM3 ?? 160);
  const wb = Number((input as any).frcWaterBinderRatio ?? 0.40);
  const binderKg = water / wb;
  const cementKg = binderKg;
  const coarseFraction = Math.min(0.45, Math.max(0.25, Number((input as any).frcCoarseAggregateVolumeFraction ?? 0.34)));
  const coarseVolumeL = coarseFraction * 1000;
  const coarseKg = coarseVolumeL / 1000 * gravelDensity;
  const fiberVolumeL = Math.max(0, fiberVolPercent) * 10;
  const fiberKg = fiberVolumeL / 1000 * fiberDensity;
  const superDosage = Math.max(0, Number((input as any).frcSuperplasticizerDosage ?? input.dosageSuper ?? 0));
  const admixtureKg = binderKg * superDosage / 100;
  const admixtureVolumeL = admixtureKg / admixtureDensity * 1000;
  const airPercent = Math.max(0, Number(input.airContent || 1));
  const airVolumeL = airPercent * 10;
  const binderVolumeL = cementKg / cementDensity * 1000;
  const waterVolumeL = water;
  const remainingFineVolumeL = 1000 - binderVolumeL - waterVolumeL - coarseVolumeL - fiberVolumeL - admixtureVolumeL - airVolumeL;
  const fineKg = remainingFineVolumeL > 0 ? remainingFineVolumeL / 1000 * sandDensity : 0;

  const sandCorrection = computeMoistureBatch(fineKg, Number(input.moistureSand || 0), Number(input.sandAbsorption || materialProperty(sand, ["absorption", "Absorption"], 0) || 0));
  const gravelCorrection = computeMoistureBatch(coarseKg, Number(input.moistureGravel || 0), Number(input.gravelAbsorption || materialProperty(gravel, ["absorption", "Absorption"], 0) || 0));
  const waterToAdd = Math.max(0, water - sandCorrection.freeSurfaceWater - gravelCorrection.freeSurfaceWater + sandCorrection.absorptionDeficit + gravelCorrection.absorptionDeficit);
  const totalVolumeL = binderVolumeL + waterVolumeL + fineKg / sandDensity * 1000 + coarseVolumeL + fiberVolumeL + admixtureVolumeL + airVolumeL;

  const checks: any[] = [
    { parameter: "water_binder", requirement: "0 < W/B <= 0.70", actual: wb.toFixed(3), status: wb > 0 && wb <= 0.70 ? "compliant" : "non_compliant" },
    { parameter: "fiber_volume", requirement: "0-5% initial fiber volume", actual: fiberVolPercent.toFixed(3) + "%", status: fiberVolPercent >= 0 && fiberVolPercent <= 5 ? "compliant" : "non_compliant" },
    { parameter: "absolute_volume", requirement: "1000 L/m3", actual: totalVolumeL.toFixed(2) + " L/m3", status: Math.abs(totalVolumeL - 1000) <= 2 ? "compliant" : "non_compliant" },
    { parameter: "fiber_verification", requirement: "Residual/flexural performance verified in laboratory", actual: "Trial testing required", status: "warning" }
  ];
  const blocked = checks.some((c) => c.status === "non_compliant") || fineKg <= 0;
  if (fineKg <= 0) checks.push({ parameter: "fine_aggregate", requirement: "Positive remaining fine aggregate volume", actual: fineKg.toFixed(1) + " kg/m3", status: "non_compliant" });

  return makeSpecializedResult(input, {
    methodId: "fiber-reinforced-specialized", methodName: "Fiber-Reinforced Concrete", version: VERSION,
    cementKg, waterKg: water, fineAggregateKg: fineKg, coarseAggregateKg: coarseKg, admixtureKg, fiberKg,
    admixtureName: String(admixture?.name || input.selectedAdmixtureName || "Superplasticizer"),
    waterBinderRatio: wb,
    freshDensityKgM3: cementKg + fineKg + coarseKg + waterToAdd + admixtureKg + fiberKg,
    absoluteVolumeL: totalVolumeL,
    warnings: [
      "FRC is an initial matrix/fiber proportioning result; fiber distribution and residual performance require laboratory verification.",
      "Fiber dosage is modeled by volume/mass and is not converted into a residual tensile-strength prediction without test data."
    ],
    assumptions: [
      `Water = ${water.toFixed(1)} kg/m3 and W/B = ${wb.toFixed(3)}.`,
      `Fiber volume = ${fiberVolPercent.toFixed(3)}% (${fiberKg.toFixed(1)} kg/m3).`,
      `Coarse aggregate volume fraction = ${(coarseFraction * 100).toFixed(1)}%.`,
      "Fine aggregate occupies the remaining absolute volume."
    ],
    recommendations: [
      "Verify slump/workability and fiber dispersion on a trial batch.",
      "Measure flexural/residual performance using the applicable laboratory procedure before structural use.",
      "Check crack-control/structural design separately; this engine does not infer residual strength from fiber dosage alone."
    ],
    trace: [
      { stepId: "frc-1", label: "Determine total binder from selected W/B.", formula: "B = W / (W/B)", inputs: { water, wb }, output: binderKg, unit: "kg/m3" },
      { stepId: "frc-2", label: "Set coarse aggregate volume fraction.", formula: "Vca = fraction × 1000", inputs: { coarseFraction }, output: coarseVolumeL, unit: "L/m3" },
      { stepId: "frc-3", label: "Convert fiber volume to mass.", formula: "mf = Vf × ρf", inputs: { fiberVolumeL, fiberDensity }, output: fiberKg, unit: "kg/m3" },
      { stepId: "frc-4", label: "Balance remaining absolute volume with fine aggregate.", formula: "Vfa = 1000 - Vb - Vw - Vca - Vf - Vad - Vair", inputs: { binderVolumeL, waterVolumeL, coarseVolumeL, fiberVolumeL, admixtureVolumeL, airVolumeL }, output: remainingFineVolumeL, unit: "L/m3" },
      { stepId: "frc-5", label: "Correct batch water for aggregate moisture and absorption.", formula: "Wadd = W - Wfree + Wdeficit", inputs: {}, output: waterToAdd, unit: "kg/m3" }
    ],
    complianceChecks: checks,
    lifecycle: blocked ? "blocked" : "needs_trial_mix"
  });
}
