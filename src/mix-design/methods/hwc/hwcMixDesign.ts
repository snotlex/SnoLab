import {
  MixDesignInput,
  MixDesignResult,
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

function isHwc(input: MixDesignInput): boolean {
  return String(input.concreteType || "").trim().toUpperCase() === "HWC";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function checkHwcApplicability(input: MixDesignInput): ApplicabilityResult {
  if (!isHwc(input)) {
    return {
      level: "not_applicable",
      reasons: ["The heavyweight concrete engine requires concreteType = HWC."],
      recommendations: ["Select HWC before running the heavyweight concrete engine."]
    };
  }

  const density = Number((input as any).hwcTargetDensityKgM3 ?? 3200);
  const strength = Number(input.fck28 || 0);
  const reasons: string[] = [];
  const recommendations: string[] = [];

  if (density < 2600 || density > 5000) {
    reasons.push("Target density " + density + " kg/m3 is outside the current HWC calculation envelope.");
    recommendations.push("Use a target density between 2600 and 5000 kg/m3 and verify the application-specific density requirement.");
  }
  if (strength > 60) {
    reasons.push("fck28 = " + strength + " MPa is above the current HWC engine envelope.");
    recommendations.push("Use the appropriate high-strength/heavyweight specialized workflow for strengths above 60 MPa.");
  }

  return {
    level: reasons.length > 0 ? "limited" : "applicable",
    reasons,
    recommendations
  };
}

export function validateHwcInputs(
  input: MixDesignInput,
  language: "ar" | "fr" | "en" = "ar"
): ValidationResult {
  const errors: any[] = [];
  const warnings: any[] = [];
  const resolved = resolveSpecializedMaterials(input, language, false, false, false);

  errors.push(...resolved.errors.map((message) => ({
    code: "material_resolution",
    severity: "error",
    field: "materialsDatabase",
    message
  })));

  const density = Number((input as any).hwcTargetDensityKgM3 ?? NaN);
  const fck = Number(input.fck28);
  const dMax = Number(input.dMax);
  const wb = Number((input as any).hwcWaterBinderRatio ?? NaN);

  const heavyDensity =
    Number((input as any).heavyweightAggregateDensity) ||
    Number(materialProperty(resolved.materials.heavyweightAggregate, ["density", "ssdDensity", "specificGravity"], 0) || 0);

  const heavyAbsorption =
    Number((input as any).heavyweightAggregateAbsorption) ||
    Number(materialProperty(resolved.materials.heavyweightAggregate, ["absorption", "Absorption"], 0) || 0);

  if (!Number.isFinite(density) || density < 2600 || density > 5000) {
    errors.push({
      code: "target_density",
      severity: "error",
      field: "hwcTargetDensityKgM3",
      message: "HWC target fresh density must be between 2600 and 5000 kg/m3 in the current engine."
    });
  }

  if (!Number.isFinite(fck) || fck <= 0 || fck > 60) {
    errors.push({
      code: "strength_envelope",
      severity: "error",
      field: "fck28",
      message: "The current HWC engine supports target strengths >0 and <=60 MPa."
    });
  }

  if (!Number.isFinite(dMax) || dMax <= 0 || dMax > 40) {
    errors.push({
      code: "dmax",
      severity: "error",
      field: "dMax",
      message: "HWC Dmax must be within 0-40 mm in the current engine."
    });
  }

  if (Number.isFinite(wb) && (wb < 0.30 || wb > 0.50)) {
    errors.push({
      code: "water_binder",
      severity: "error",
      field: "hwcWaterBinderRatio",
      message: "HWC W/B must be between 0.30 and 0.50 in the current engine."
    });
  }

  if (!Number.isFinite(heavyDensity) || heavyDensity <= 2650 || heavyDensity > 5000) {
    errors.push({
      code: "heavyweight_density",
      severity: "error",
      field: "heavyweightAggregateDensity",
      message: "A validated heavyweight aggregate density above 2650 kg/m3 and no more than 5000 kg/m3 is required."
    });
  }

  if (!Number.isFinite(heavyAbsorption) || heavyAbsorption < 0 || heavyAbsorption > 15) {
    errors.push({
      code: "heavyweight_absorption",
      severity: "error",
      field: "heavyweightAggregateAbsorption",
      message: "Heavyweight-aggregate absorption must be between 0 and 15% in the current engine."
    });
  }

  warnings.push({
    code: "segregation",
    severity: "warning",
    field: "trial_mix",
    message: "Heavyweight concrete requires trial-batch verification of uniform density and segregation control because dense aggregates can settle during handling."
  });

  return { isValid: errors.length === 0, errors, warnings };
}

export function calculateHwcMix(
  input: MixDesignInput,
  language: "ar" | "fr" | "en" = "ar"
): MixDesignResult {
  const validation = validateHwcInputs(input, language);
  const materials = resolveSpecializedMaterials(input, language, false, false, false);
  const heavyMaterial = materials.materials.heavyweightAggregate;

  if (Array.isArray(input.materialsDatabase) && input.materialsDatabase.length > 0 && !heavyMaterial) {
    return makeSpecializedResult(input, {
      methodId: "heavyweight-specialized",
      methodName: "Heavyweight Concrete",
      version: VERSION,
      cementKg: 0,
      waterKg: 0,
      fineAggregateKg: 0,
      coarseAggregateKg: 0,
      admixtureKg: 0,
      waterBinderRatio: 0,
      freshDensityKgM3: 0,
      absoluteVolumeL: 0,
      warnings: [],
      assumptions: [],
      recommendations: ["Select an approved heavyweight aggregate from the material library before HWC calculation."],
      trace: [],
      complianceChecks: [{
        parameter: "heavyweight_material",
        requirement: "Approved heavyweight aggregate",
        actual: "Missing",
        status: "non_compliant"
      }],
      lifecycle: "blocked"
    });
  }

  if (
    heavyMaterial &&
    Array.isArray(input.materialsDatabase) &&
    input.materialsDatabase.length > 0 &&
    String(heavyMaterial.category || "").trim() !== "ركام ثقيل"
  ) {
    return makeSpecializedResult(input, {
      methodId: "heavyweight-specialized",
      methodName: "Heavyweight Concrete",
      version: VERSION,
      cementKg: 0,
      waterKg: 0,
      fineAggregateKg: 0,
      coarseAggregateKg: 0,
      admixtureKg: 0,
      waterBinderRatio: 0,
      freshDensityKgM3: 0,
      absoluteVolumeL: 0,
      warnings: [],
      assumptions: [],
      recommendations: ["Select a material whose library category is 'ركام ثقيل' for the HWC aggregate role."],
      trace: [],
      complianceChecks: [{
        parameter: "heavyweight_material_category",
        requirement: "ركام ثقيل",
        actual: String(heavyMaterial.category || "unknown"),
        status: "non_compliant"
      }],
      lifecycle: "blocked"
    });
  }

  if (!validation.isValid || materials.errors.length > 0) {
    return makeSpecializedResult(input, {
      methodId: "heavyweight-specialized",
      methodName: "Heavyweight Concrete",
      version: VERSION,
      cementKg: 0,
      waterKg: 0,
      fineAggregateKg: 0,
      coarseAggregateKg: 0,
      admixtureKg: 0,
      waterBinderRatio: 0,
      freshDensityKgM3: 0,
      absoluteVolumeL: 0,
      warnings: validation.warnings.map((w) => w.message),
      assumptions: [],
      recommendations: [
        ...validation.errors.map((e) => e.message),
        ...materials.errors,
        "Complete and validate heavyweight aggregate properties before running the HWC design."
      ],
      trace: [],
      complianceChecks: [
        ...validation.errors.map((e) => ({
          parameter: e.code,
          requirement: "Valid HWC input",
          actual: e.message,
          status: "non_compliant" as const
        })),
        ...materials.errors.map((message) => ({
          parameter: "materials",
          requirement: "Material library integrity",
          actual: message,
          status: "non_compliant" as const
        }))
      ],
      lifecycle: "blocked"
    });
  }

  const cementDensity = materialDensityKgM3(materials.materials.cement, Number(input.cementDensity || 3150));
  const sandDensity = materialDensityKgM3(materials.materials.sand, Number(input.sandRelativeDensity || 2.65) * 1000);
  const heavyweightDensity =
    Number((input as any).heavyweightAggregateDensity) ||
    materialDensityKgM3(heavyMaterial, 3600);

  const admixtureDensity = materialDensityKgM3(
    materials.materials.admixture,
    Number(input.selectedAdmixtureDensity || 1080)
  );

  const fck = Number(input.fck28);
  const slump = Number(input.slump || 8);

  const targetDensity = clamp(
    Number((input as any).hwcTargetDensityKgM3 ?? 3200),
    2600,
    5000
  );

  const defaultWater = clamp(150 + Math.max(0, slump - 8) * 1.5, 135, 190);
  const water = clamp(
    Number((input as any).hwcWaterKgM3 ?? defaultWater),
    135,
    190
  );

  const requestedWb = Number((input as any).hwcWaterBinderRatio);
  const defaultWb = clamp(
    0.42 - Math.max(0, fck - 30) * 0.002,
    0.32,
    0.45
  );

  const wb = clamp(
    Number.isFinite(requestedWb) ? requestedWb : defaultWb,
    0.30,
    0.50
  );

  const binder = water / wb;
  const binderOutOfRange = binder < 300 || binder > 600;

  const scmPercent = clamp(
    Number(input.dosageFlyAsh || 0) +
    Number(input.dosageSlag || 0) +
    Number(input.dosageSilicaFume || 0),
    0,
    30
  );

  const scmKg = binder * scmPercent / 100;
  const cementKg = binder - scmKg;

  const superDosage = clamp(
    Number(input.dosageSuper || 0),
    0,
    2.5
  );
  const admixtureKg = binder * superDosage / 100;

  const airPercent = clamp(Number(input.airContent || 1.0), 0.5, 5.0);

  const cementVolumeM3 = cementKg / cementDensity;
  const scmVolumeM3 = scmKg / Number(input.selectedScmDensity || 2200);
  const waterVolumeM3 = water / 1000;
  const admixtureVolumeM3 = admixtureKg / admixtureDensity;
  const airVolumeM3 = airPercent / 100;

  const fixedMass = cementKg + scmKg + water + admixtureKg;

  const fixedVolumeM3 =
    cementVolumeM3 +
    scmVolumeM3 +
    waterVolumeM3 +
    admixtureVolumeM3 +
    airVolumeM3;

  const aggregateVolumeM3 = 1 - fixedVolumeM3;

  const denominator = aggregateVolumeM3 * (sandDensity - heavyweightDensity);

  const sandVolumeFraction =
    denominator !== 0
      ? (targetDensity - fixedMass - aggregateVolumeM3 * heavyweightDensity) / denominator
      : NaN;

  const sandVolumeM3 = aggregateVolumeM3 * sandVolumeFraction;
  const heavyweightVolumeM3 = aggregateVolumeM3 - sandVolumeM3;

  const fineAggregateKg = Math.max(0, sandVolumeM3 * sandDensity);
  const heavyweightDryKg = Math.max(0, heavyweightVolumeM3 * heavyweightDensity);

  const densityFeasible =
    Number.isFinite(sandVolumeFraction) &&
    sandVolumeFraction >= 0 &&
    sandVolumeFraction <= 1 &&
    aggregateVolumeM3 > 0;

  const heavyAggregateFraction =
    aggregateVolumeM3 > 0
      ? heavyweightVolumeM3 / aggregateVolumeM3
      : 0;

  const heavyAbsorption = Number(
    (input as any).heavyweightAggregateAbsorption ??
    materialProperty(heavyMaterial, ["absorption", "Absorption"], 0) ??
    0
  );

  const heavyMoisture = Number(
    (input as any).heavyweightAggregateMoisture ??
    input.moistureGravel ??
    materialProperty(heavyMaterial, ["moisture", "Moisture"], 0) ??
    0
  );

  const sandCorrection = computeMoistureBatch(
    fineAggregateKg,
    Number(input.moistureSand || 0),
    Number(input.sandAbsorption || materialProperty(materials.materials.sand, ["absorption", "Absorption"], 0) || 0)
  );

  const heavyCorrection = computeMoistureBatch(
    heavyweightDryKg,
    heavyMoisture,
    heavyAbsorption
  );

  const waterToAdd = Math.max(
    0,
    water -
      sandCorrection.freeSurfaceWater -
      heavyCorrection.freeSurfaceWater +
      sandCorrection.absorptionDeficit +
      heavyCorrection.absorptionDeficit
  );

  const filledVolumeL =
    fixedVolumeM3 * 1000 +
    sandVolumeM3 * 1000 +
    heavyweightVolumeM3 * 1000;

  const designFreshDensity =
    cementKg +
    scmKg +
    fineAggregateKg +
    heavyweightDryKg +
    water +
    admixtureKg;

  const batchFreshDensity =
    cementKg +
    scmKg +
    sandCorrection.wetKg +
    heavyCorrection.wetKg +
    waterToAdd +
    admixtureKg;

  const densityError = designFreshDensity - targetDensity;
  const segregationWarning = heavyAggregateFraction > 0.75 || heavyAggregateFraction < 0.35;

  const lifecycle =
    !densityFeasible ||
    binderOutOfRange ||
    fineAggregateKg <= 0 ||
    heavyweightDryKg <= 0 ||
    Math.abs(filledVolumeL - 1000) > 2
      ? "blocked" as const
      : "needs_trial_mix" as const;

  const complianceChecks: any[] = [
    {
      parameter: "target_density",
      requirement: "2600-5000 kg/m3",
      actual: designFreshDensity.toFixed(1) + " kg/m3 (batch " + batchFreshDensity.toFixed(1) + " kg/m3 after moisture correction)",
      status:
        designFreshDensity >= 2600 &&
        designFreshDensity <= 5000 &&
        Math.abs(densityError) <= 75
          ? "compliant"
          : "non_compliant"
    },
    {
      parameter: "water_binder",
      requirement: "0.30-0.50",
      actual: wb.toFixed(3),
      status: wb >= 0.30 && wb <= 0.50 ? "compliant" : "non_compliant"
    },
    {
      parameter: "binder",
      requirement: "300-600 kg/m3",
      actual: binder.toFixed(1),
      status: binderOutOfRange ? "non_compliant" : "compliant"
    },
    {
      parameter: "heavyweight_density",
      requirement: ">2650 and <=5000 kg/m3",
      actual: heavyweightDensity.toFixed(0) + " kg/m3",
      status:
        heavyweightDensity > 2650 && heavyweightDensity <= 5000
          ? "compliant"
          : "non_compliant"
    },
    {
      parameter: "heavyweight_aggregate_fraction",
      requirement: "35-75% of aggregate volume preferred",
      actual: (heavyAggregateFraction * 100).toFixed(1) + "%",
      status: segregationWarning ? "warning" : "compliant"
    },
    {
      parameter: "volume_closure",
      requirement: "constituent volume = 1000 L/m3",
      actual: filledVolumeL.toFixed(2) + " L/m3",
      status: Math.abs(filledVolumeL - 1000) <= 2 ? "compliant" : "non_compliant"
    },
    {
      parameter: "trial_mix",
      requirement: "density uniformity and segregation control verification",
      actual: "Required",
      status: "warning"
    }
  ];

  const warnings = [
    "Heavyweight concrete must be controlled for uniform density and segregation during batching, transport and placement.",
    "Heavyweight aggregate volume fraction = " + (heavyAggregateFraction * 100).toFixed(1) + "%.",
    "The reported mix is a starting proportioning result and requires trial-batch calibration with the actual heavyweight aggregate."
  ];

  if (!densityFeasible) {
    warnings.push(
      "The requested target density is not reachable with the selected paste volume and aggregate densities without an unphysical negative sand or heavyweight-aggregate volume fraction."
    );
  }

  const assumptions = [
    "Target fresh density = " + targetDensity.toFixed(0) + " kg/m3.",
    "Effective water = " + water.toFixed(1) + " kg/m3.",
    "Water/binder ratio = " + wb.toFixed(3) + ".",
    "Total binder = " + binder.toFixed(1) + " kg/m3; SCM replacement = " + scmPercent.toFixed(1) + "%.",
    "Heavyweight aggregate density = " + heavyweightDensity.toFixed(0) + " kg/m3.",
    "Solved aggregate volume split: " + (sandVolumeFraction * 100).toFixed(1) + "% sand / " + (heavyAggregateFraction * 100).toFixed(1) + "% heavyweight aggregate.",
    "Heavyweight aggregate absorption = " + heavyAbsorption.toFixed(1) + "%; moisture = " + heavyMoisture.toFixed(1) + "%."
  ];

  const recommendations = [
    "Verify fresh density on representative trial batches and compare with the project-specific required density.",
    "Use stockpile moisture and absorption measurements immediately before batching.",
    "Control placement/consolidation to limit density stratification and segregation.",
    "For radiation shielding or counterweight applications, perform application-specific performance verification beyond mix proportioning."
  ];

  const result: any = makeSpecializedResult(input, {
    methodId: "heavyweight-specialized",
    methodName: "Heavyweight Concrete",
    version: VERSION,
    cementKg,
    waterKg: water,
    fineAggregateKg,
    coarseAggregateKg: heavyweightDryKg,
    admixtureKg,
    admixtureName: String(materials.materials.admixture?.name || input.selectedAdmixtureName || "Superplasticizer"),
    scmKg,
    waterBinderRatio: wb,
    freshDensityKgM3: designFreshDensity,
    absoluteVolumeL: filledVolumeL,
    warnings,
    assumptions,
    recommendations,
    trace: [
      {
        stepId: "hwc-1",
        label: "Select target fresh density.",
        formula: "rho_target = application target density",
        inputs: { targetDensity },
        output: targetDensity,
        unit: "kg/m3"
      },
      {
        stepId: "hwc-2",
        label: "Determine effective water and W/B.",
        formula: "B = W/(W/B)",
        inputs: { water, wb },
        output: binder,
        unit: "kg/m3"
      },
      {
        stepId: "hwc-3",
        label: "Split binder into cement and SCM.",
        formula: "SCM = B·replacement%",
        inputs: { scmPercent },
        output: scmKg,
        unit: "kg/m3"
      },
      {
        stepId: "hwc-4",
        label: "Solve fine/heavy aggregate volume split from target density.",
        formula: "rho_target = M_fixed + Vagg·[(1-k)rho_H + k rho_S]",
        inputs: {
          aggregateVolumeM3,
          sandDensity,
          heavyweightDensity,
          fixedMass
        },
        output: {
          sandVolumeFraction,
          sandVolumeM3,
          heavyweightVolumeM3
        },
        unit: "fraction / m3"
      },
      {
        stepId: "hwc-5",
        label: "Correct batching water for aggregate moisture and absorption.",
        formula: "Wadd = W - Wfree + Wdeficit",
        inputs: {
          sandFreeWater: sandCorrection.freeSurfaceWater,
          heavyweightFreeWater: heavyCorrection.freeSurfaceWater,
          sandAbsorptionDeficit: sandCorrection.absorptionDeficit,
          heavyweightAbsorptionDeficit: heavyCorrection.absorptionDeficit
        },
        output: waterToAdd,
        unit: "kg/m3"
      }
    ],
    complianceChecks,
    lifecycle
  });

  result.waterToAdd = waterToAdd;
  result.batchWaterToAdd = waterToAdd;
  result.waterWeightWet = waterToAdd;
  result.heavyweightAggregateKg = heavyweightDryKg;
  result.heavyweightAggregateDensity = heavyweightDensity;
  result.heavyweightAggregateAbsorption = heavyAbsorption;
  result.heavyweightAggregateMoisture = heavyMoisture;
  result.heavyweightAggregateVolumeFraction = heavyAggregateFraction;
  result.targetFreshDensityKgM3 = targetDensity;
  result.achievedFreshDensityKgM3 = designFreshDensity;
  result.batchFreshDensityKgM3 = batchFreshDensity;
  result.sandWeightDry = fineAggregateKg;
  result.gravelWeightDry = heavyweightDryKg;
  result.sandWeightWet = sandCorrection.wetKg;
  result.gravelWeightWet = heavyCorrection.wetKg;
  result.sandTotalMoistureWater = sandCorrection.moistureWater;
  result.gravelTotalMoistureWater = heavyCorrection.moistureWater;
  result.totalFreeSurfaceWater = sandCorrection.freeSurfaceWater + heavyCorrection.freeSurfaceWater;
  result.totalAbsorptionDeficit = sandCorrection.absorptionDeficit + heavyCorrection.absorptionDeficit;

  result.engineeringAudit = {
    specializedMethod: "HWC",
    framework: "ACI PRC-304.3 / ACI 211.1-oriented heavyweight concrete proportioning",
    targetFreshDensityKgM3: targetDensity,
    achievedFreshDensityKgM3: designFreshDensity,
    batchFreshDensityKgM3: batchFreshDensity,
    waterBinderRatio: wb,
    binderKgM3: binder,
    heavyweightAggregateDensityKgM3: heavyweightDensity,
    heavyweightAggregateFractionOfAggregateVolume: heavyAggregateFraction
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