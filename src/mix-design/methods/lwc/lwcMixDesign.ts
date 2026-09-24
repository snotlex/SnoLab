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

function isLwc(input: MixDesignInput): boolean {
  return String(input.concreteType || "").trim().toUpperCase() === "LWC";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function checkLwcApplicability(input: MixDesignInput): ApplicabilityResult {
  if (!isLwc(input)) {
    return {
      level: "not_applicable",
      reasons: ["The lightweight concrete engine requires concreteType = LWC."],
      recommendations: ["Select LWC before running the lightweight concrete engine."]
    };
  }

  const density = Number((input as any).lwcTargetDensityKgM3 ?? (input as any).targetDensity ?? 1750);
  const strength = Number(input.fck28 || 0);
  const reasons: string[] = [];
  const recommendations: string[] = [];

  if (density < 1400 || density > 2000) {
    reasons.push(`Target fresh density ${density} kg/m3 is outside the current structural-LWC calculation envelope.`);
    recommendations.push("Use a target density between 1400 and 2000 kg/m3, then verify the oven-dry and equilibrium density on trial batches.");
  }
  if (strength > 50) {
    reasons.push(`fck28 = ${strength} MPa is above the current LWC engine envelope.`);
    recommendations.push("Use a specialized high-performance/lightweight structural design workflow for strengths above 50 MPa.");
  }

  return {
    level: reasons.length > 0 ? "limited" : "applicable",
    reasons,
    recommendations
  };
}

export function validateLwcInputs(
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

  const density = Number((input as any).lwcTargetDensityKgM3 ?? (input as any).targetDensity ?? NaN);
  const fck = Number(input.fck28);
  const dMax = Number(input.dMax);
  const wb = Number((input as any).lwcWaterBinderRatio ?? NaN);
  const prewet = Number((input as any).lwcPrewetDegreePercent ?? 75);
  const lwcDensity =
    Number((input as any).lightweightAggregateDensity) ||
    Number(materialProperty(resolved.materials.lightweightAggregate, ["density", "ssdDensity", "specificGravity"], 0) || 0);
  const lwcAbsorption =
    Number((input as any).lightweightAggregateAbsorption) ||
    Number(materialProperty(resolved.materials.lightweightAggregate, ["absorption", "Absorption"], 0) || 0);

  if (!Number.isFinite(density) || density < 1400 || density > 2000) {
    errors.push({
      code: "target_density",
      severity: "error",
      field: "lwcTargetDensityKgM3",
      message: "LWC target fresh density must be between 1400 and 2000 kg/m3 in the current engine."
    });
  }
  if (!Number.isFinite(fck) || fck <= 0 || fck > 50) {
    errors.push({
      code: "strength_envelope",
      severity: "error",
      field: "fck28",
      message: "The current LWC engine supports target strengths >0 and <=50 MPa."
    });
  }
  if (!Number.isFinite(dMax) || dMax <= 0 || dMax > 20) {
    errors.push({
      code: "dmax",
      severity: "error",
      field: "dMax",
      message: "LWC Dmax must be within 0-20 mm in the current engine."
    });
  }
  if (Number.isFinite(wb) && (wb < 0.30 || wb > 0.50)) {
    errors.push({
      code: "water_binder",
      severity: "error",
      field: "lwcWaterBinderRatio",
      message: "LWC W/B must be between 0.30 and 0.50 in the current engine."
    });
  }
  if (!Number.isFinite(lwcDensity) || lwcDensity <= 0 || lwcDensity >= 2000) {
    errors.push({
      code: "lightweight_density",
      severity: "error",
      field: "lightweightAggregateDensity",
      message: "A validated lightweight-aggregate density below 2000 kg/m3 is required."
    });
  }
  if (!Number.isFinite(lwcAbsorption) || lwcAbsorption < 0 || lwcAbsorption > 30) {
    errors.push({
      code: "lightweight_absorption",
      severity: "error",
      field: "lightweightAggregateAbsorption",
      message: "Lightweight-aggregate absorption must be between 0 and 30% in the current engine."
    });
  }
  if (!Number.isFinite(prewet) || prewet < 0 || prewet > 100) {
    errors.push({
      code: "prewet_degree",
      severity: "error",
      field: "lwcPrewetDegreePercent",
      message: "Prewetting degree must be between 0 and 100% of the validated absorption capacity."
    });
  }

  if (!input.selectedLightweightAggregateId && !input.selectedLightweightAggregateName) {
    warnings.push({
      code: "lightweight_material",
      severity: "warning",
      field: "selectedLightweightAggregateId",
      message: "Select the actual lightweight aggregate from the material library so density and absorption remain synchronized."
    });
  }

  return { isValid: errors.length === 0, errors, warnings };
}

export function calculateLwcMix(
  input: MixDesignInput,
  language: "ar" | "fr" | "en" = "ar"
): MixDesignResult {
  const validation = validateLwcInputs(input, language);
  const materials = resolveSpecializedMaterials(input, language, false, false, false);
  const lightweightMaterial = materials.materials.lightweightAggregate;

  if (Array.isArray(input.materialsDatabase) && input.materialsDatabase.length > 0 && !lightweightMaterial) {
    return makeSpecializedResult(input, {
      methodId: "lightweight-specialized",
      methodName: "Structural Lightweight Concrete",
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
      recommendations: ["Select an approved lightweight aggregate from the material library before LWC calculation."],
      trace: [],
      complianceChecks: [{
        parameter: "lightweight_material",
        requirement: "Approved lightweight aggregate",
        actual: "Missing",
        status: "non_compliant"
      }],
      lifecycle: "blocked"
    });
  }

  if (
    lightweightMaterial &&
    Array.isArray(input.materialsDatabase) &&
    input.materialsDatabase.length > 0 &&
    String(lightweightMaterial.category || "").trim() !== "ركام خفيف"
  ) {
    return makeSpecializedResult(input, {
      methodId: "lightweight-specialized",
      methodName: "Structural Lightweight Concrete",
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
      recommendations: ["Select a material whose library category is 'ركام خفيف' for the LWC aggregate role."],
      trace: [],
      complianceChecks: [{
        parameter: "lightweight_material_category",
        requirement: "ركام خفيف",
        actual: String(lightweightMaterial.category || "unknown"),
        status: "non_compliant"
      }],
      lifecycle: "blocked"
    });
  }

  if (!validation.isValid || materials.errors.length > 0) {
    return makeSpecializedResult(input, {
      methodId: "lightweight-specialized",
      methodName: "Structural Lightweight Concrete",
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
        "Complete and validate the lightweight aggregate properties before running the LWC design."
      ],
      trace: [],
      complianceChecks: [
        ...validation.errors.map((e) => ({
          parameter: e.code,
          requirement: "Valid LWC input",
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
  const lightweightDensity = materialDensityKgM3(
    lightweightMaterial,
    Number((input as any).lightweightAggregateDensity || 1200)
  );
  const admixtureDensity = materialDensityKgM3(
    materials.materials.admixture,
    Number(input.selectedAdmixtureDensity || 1080)
  );

  const fck = Number(input.fck28);
  const slump = Number(input.slump || 8);
  const targetDensity = clamp(
    Number((input as any).lwcTargetDensityKgM3 ?? (input as any).targetDensity ?? 1750),
    1400,
    2000
  );

  const defaultWater = clamp(155 + Math.max(0, slump - 8) * 1.5, 135, 190);
  const water = clamp(
    Number((input as any).lwcWaterKgM3 ?? defaultWater),
    135,
    190
  );

  const requestedWb = Number((input as any).lwcWaterBinderRatio);
  const defaultWb = clamp(
    0.44 - Math.max(0, fck - 20) * 0.003,
    0.32,
    0.44
  );
  const wb = clamp(
    Number.isFinite(requestedWb) ? requestedWb : defaultWb,
    0.30,
    0.50
  );

  const binder = water / wb;
  const binderOutOfRange = binder < 300 || binder > 550;
  const scmPercent = clamp(
    Number(input.dosageFlyAsh || 0) +
    Number(input.dosageSlag || 0) +
    Number(input.dosageSilicaFume || 0),
    0,
    30
  );

  const scmKg = binder * scmPercent / 100;
  const cementKg = binder - scmKg;

  const superDosage = Math.max(
    0,
    Math.min(2.5, Number(input.dosageSuper || 0))
  );
  const admixtureKg = binder * superDosage / 100;

  const airPercent = clamp(Number(input.airContent || 1.5), 1.0, 8.0);
  const airVolumeL = airPercent * 10;

  const cementVolumeL = cementKg / cementDensity * 1000;
  const scmVolumeL = scmKg / Number(input.selectedScmDensity || 2200) * 1000;
  const waterVolumeL = water;
  const admixtureVolumeL = admixtureKg / admixtureDensity * 1000;

  // ACI 211.2-style mass/volume coupling:
  // solve sand mass so the remaining volume can be filled with lightweight aggregate
  // while the resulting fresh mass targets the selected density.
  const fixedMass = cementKg + scmKg + water + admixtureKg;
  const fixedVolumeM3 =
    cementVolumeL / 1000 +
    scmVolumeL / 1000 +
    waterVolumeL / 1000 +
    admixtureVolumeL / 1000 +
    airPercent / 100;

  const denominator = 1 - lightweightDensity / sandDensity;
  const sandKg = denominator !== 0
    ? (targetDensity - fixedMass - lightweightDensity * (1 - airPercent / 100 - fixedVolumeM3)) / denominator
    : 0;

  const fineAggregateKg = Math.max(0, sandKg);
  const fineVolumeM3 = fineAggregateKg / sandDensity;
  const remainingVolumeM3 =
    1 -
    fixedVolumeM3 -
    fineVolumeM3;

  const lightweightDryKg = Math.max(0, remainingVolumeM3 * lightweightDensity);

  const sandAbsorption = Number(input.sandAbsorption || materialProperty(materials.materials.sand, ["absorption", "Absorption"], 0) || 0);
  const sandMoisture = Number(input.moistureSand || 0);
  const lwcAbsorption = Number(
    (input as any).lightweightAggregateAbsorption ??
    materialProperty(lightweightMaterial, ["absorption", "Absorption"], 0) ??
    0
  );
  const lwcMoisture = Number(
    (input as any).lightweightAggregateMoisture ??
    (input.moistureGravel || 0) ??
    materialProperty(lightweightMaterial, ["moisture", "Moisture"], 0) ??
    0
  );
  const prewetDegree = clamp(
    Number((input as any).lwcPrewetDegreePercent ?? 75),
    0,
    100
  );

  const sandCorrection = computeMoistureBatch(
    fineAggregateKg,
    sandMoisture,
    sandAbsorption
  );
  const lightweightCorrection = computeMoistureBatch(
    lightweightDryKg,
    lwcMoisture,
    lwcAbsorption
  );

  const absorptionCapacityWater = lightweightDryKg * lwcAbsorption / 100;
  const prewetTargetWater = absorptionCapacityWater * prewetDegree / 100;
  const prewetWaterToAdd = Math.max(
    0,
    prewetTargetWater - lightweightCorrection.moistureWater
  );

  const effectiveWaterToBatch =
    water -
    sandCorrection.freeSurfaceWater -
    lightweightCorrection.freeSurfaceWater +
    sandCorrection.absorptionDeficit +
    Math.max(0, prewetTargetWater - lightweightCorrection.moistureWater);

  const waterToAdd = Math.max(0, effectiveWaterToBatch);

  const totalFilledVolumeL =
    cementVolumeL +
    scmVolumeL +
    waterVolumeL +
    admixtureVolumeL +
    airVolumeL +
    fineVolumeM3 * 1000 +
    lightweightDryKg / lightweightDensity * 1000;

  const designFreshDensity =
    cementKg +
    scmKg +
    fineAggregateKg +
    lightweightDryKg +
    water +
    admixtureKg;

  const batchFreshDensity =
    cementKg +
    scmKg +
    sandCorrection.wetKg +
    lightweightCorrection.wetKg +
    waterToAdd +
    admixtureKg +
    prewetWaterToAdd;

  const densityError = designFreshDensity - targetDensity;
  const lifecycle =
    binderOutOfRange ||
    fineAggregateKg <= 0 ||
    lightweightDryKg <= 0 ||
    Math.abs(densityError) > 75 ||
    Math.abs(totalFilledVolumeL - 1000) > 2
      ? "blocked" as const
      : "needs_trial_mix" as const;

  const complianceChecks: any[] = [
    {
      parameter: "target_density",
      requirement: "1400-2000 kg/m3",
      actual: `${designFreshDensity.toFixed(1)} kg/m3 (batch ${batchFreshDensity.toFixed(1)} kg/m3 after moisture/prewetting)`,
      status: achievedFreshDensity >= 1400 && achievedFreshDensity <= 2000 && Math.abs(densityError) <= 75
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
      requirement: "300-550 kg/m3",
      actual: binder.toFixed(1),
      status: binderOutOfRange ? "non_compliant" : "compliant"
    },
    {
      parameter: "lightweight_density",
      requirement: "<2000 kg/m3",
      actual: `${lightweightDensity.toFixed(0)} kg/m3`,
      status: lightweightDensity < 2000 ? "compliant" : "non_compliant"
    },
    {
      parameter: "lightweight_absorption",
      requirement: "0-30%",
      actual: `${lwcAbsorption.toFixed(1)}%`,
      status: lwcAbsorption >= 0 && lwcAbsorption <= 30 ? "compliant" : "non_compliant"
    },
    {
      parameter: "prewetting",
      requirement: "0-100% of validated absorption capacity",
      actual: `${prewetDegree.toFixed(1)}%`,
      status: "compliant"
    },
    {
      parameter: "volume_closure",
      requirement: "constituent volume = 1000 L/m3",
      actual: `${totalFilledVolumeL.toFixed(2)} L/m3`,
      status: Math.abs(totalFilledVolumeL - 1000) <= 2 ? "compliant" : "non_compliant"
    },
    {
      parameter: "trial_mix",
      requirement: "fresh density, oven-dry density, strength and workability verification",
      actual: "Required",
      status: "warning"
    }
  ];

  const warnings = [
    "LWC requires lightweight-aggregate moisture conditioning; absorption is not treated like normal aggregate moisture.",
    `Prewetting target = ${prewetDegree.toFixed(1)}% of validated lightweight-aggregate absorption capacity.`,
    "The reported mix is a starting proportioning result and requires trial-batch calibration with the actual lightweight aggregate."
  ];

  const assumptions = [
    `Target fresh density = ${targetDensity.toFixed(0)} kg/m3.`,
    `Effective water = ${water.toFixed(1)} kg/m3.`,
    `Water/binder ratio = ${wb.toFixed(3)}.`,
    `Total binder = ${binder.toFixed(1)} kg/m3; SCM replacement = ${scmPercent.toFixed(1)}%.`,
    `Lightweight aggregate particle density = ${lightweightDensity.toFixed(0)} kg/m3.`,
    `Lightweight aggregate absorption = ${lwcAbsorption.toFixed(1)}%; prewetting target = ${prewetDegree.toFixed(1)}%.`,
    `Solved fine aggregate mass = ${fineAggregateKg.toFixed(1)} kg/m3.`,
    `Solved lightweight aggregate dry mass = ${lightweightDryKg.toFixed(1)} kg/m3.`
  ];

  const recommendations = [
    "Use the actual lightweight aggregate stockpile moisture and a controlled prewetting procedure.",
    "Verify fresh density and oven-dry density separately; equilibrium/conditioned moisture state must be recorded.",
    "Verify compressive strength, splitting/flexural performance where required, and workability after mixing.",
    "Calibrate the first trial mixture from laboratory measurements before production release."
  ];

  const result: any = makeSpecializedResult(input, {
    methodId: "lightweight-specialized",
    methodName: "Structural Lightweight Concrete",
    version: VERSION,
    cementKg,
    waterKg: water,
    fineAggregateKg,
    coarseAggregateKg: lightweightDryKg,
    admixtureKg,
    admixtureName: String(materials.materials.admixture?.name || input.selectedAdmixtureName || "Superplasticizer"),
    scmKg,
    waterBinderRatio: wb,
    freshDensityKgM3: designFreshDensity,
    absoluteVolumeL: totalFilledVolumeL,
    warnings,
    assumptions,
    recommendations,
    trace: [
      {
        stepId: "lwc-1",
        label: "Select target fresh density.",
        formula: "rho_target = project target density or controlled LWC default",
        inputs: { targetDensity },
        output: targetDensity,
        unit: "kg/m3"
      },
      {
        stepId: "lwc-2",
        label: "Determine effective water and W/B.",
        formula: "B = W/(W/B)",
        inputs: { water, wb },
        output: binder,
        unit: "kg/m3"
      },
      {
        stepId: "lwc-3",
        label: "Split binder into cement and SCM.",
        formula: "SCM = B·replacement%",
        inputs: { scmPercent },
        output: scmKg,
        unit: "kg/m3"
      },
      {
        stepId: "lwc-4",
        label: "Solve sand mass from target fresh density and constituent volumes.",
        formula: "rho_target = Sum(m_i) with Vsum = 1 m3",
        inputs: {
          targetDensity,
          fixedMass,
          fixedVolumeM3,
          lightweightDensity
        },
        output: fineAggregateKg,
        unit: "kg/m3"
      },
      {
        stepId: "lwc-5",
        label: "Solve lightweight aggregate dry mass from remaining volume.",
        formula: "M_LWA = V_remaining·rho_LWA",
        inputs: { remainingVolumeM3, lightweightDensity },
        output: lightweightDryKg,
        unit: "kg/m3"
      },
      {
        stepId: "lwc-6",
        label: "Calculate lightweight aggregate prewetting requirement.",
        formula: "W_prewet = M_LWA·Abs·prewet%",
        inputs: { lightweightDryKg, lwcAbsorption, prewetDegree },
        output: prewetWaterToAdd,
        unit: "kg/m3"
      },
      {
        stepId: "lwc-7",
        label: "Correct batch water for moisture, surface water, absorption deficit and prewetting.",
        formula: "Wadd = W - Wfree + Wdeficit + Wprewet,target",
        inputs: {
          sandFreeWater: sandCorrection.freeSurfaceWater,
          lightweightFreeWater: lightweightCorrection.freeSurfaceWater,
          sandAbsorptionDeficit: sandCorrection.absorptionDeficit,
          lightweightPrewetWater: prewetWaterToAdd
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
  result.waterWeightWet = waterToAdd + prewetWaterToAdd;
  result.lightweightAggregateKg = lightweightDryKg;
  result.lightweightAggregateDensity = lightweightDensity;
  result.lightweightAggregateAbsorption = lwcAbsorption;
  result.lightweightAggregateMoisture = lwcMoisture;
  result.lightweightPrewetDegreePercent = prewetDegree;
  result.lightweightPrewetWaterKgM3 = prewetWaterToAdd;
  result.targetFreshDensityKgM3 = targetDensity;
  result.achievedFreshDensityKgM3 = designFreshDensity;
  result.batchFreshDensityKgM3 = batchFreshDensity;
  result.sandWeightDry = fineAggregateKg;
  result.gravelWeightDry = lightweightDryKg;
  result.sandWeightWet = sandCorrection.wetKg;
  result.gravelWeightWet = lightweightCorrection.wetKg;
  result.sandTotalMoistureWater = sandCorrection.moistureWater;
  result.gravelTotalMoistureWater = lightweightCorrection.moistureWater;
  result.totalFreeSurfaceWater = sandCorrection.freeSurfaceWater + lightweightCorrection.freeSurfaceWater;
  result.totalAbsorptionDeficit = sandCorrection.absorptionDeficit;
  result.engineeringAudit = {
    specializedMethod: "LWC",
    framework: "ACI 211.2-oriented weight/volume proportioning with lightweight-aggregate moisture/prewetting control",
    targetFreshDensityKgM3: targetDensity,
    achievedFreshDensityKgM3: designFreshDensity,
    batchFreshDensityKgM3: batchFreshDensity,
    waterBinderRatio: wb,
    binderKgM3: binder,
    lightweightAggregateDensityKgM3: lightweightDensity,
    lightweightAggregateAbsorptionPercent: lwcAbsorption,
    prewetDegreePercent: prewetDegree,
    prewetWaterKgM3: prewetWaterToAdd,
    lightweightAggregateDryKgM3: lightweightDryKg
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
