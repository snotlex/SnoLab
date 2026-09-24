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

type HighPerformanceConcreteType = "HSC" | "HPC";
const VERSION = "1.0.0";

function concreteCode(input: MixDesignInput): HighPerformanceConcreteType | null {
  const code = String(input.concreteType || "").trim().toUpperCase();
  return code === "HSC" || code === "HPC" ? code : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isSilicaFume(material: any): boolean {
  const haystack = [
    material?.name,
    material?.englishName,
    material?.frenchName,
    material?.type,
    material?.materialType
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes("silica") || haystack.includes("silice") || haystack.includes("سيليكا") || haystack.includes("microsilica");
}

function isSuperplasticizer(material: any): boolean {
  const haystack = [
    material?.name,
    material?.englishName,
    material?.frenchName,
    material?.type,
    material?.materialType,
    material?.admixtureType
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return material?.admixtureType === "superplasticizer" ||
    haystack.includes("superplasticizer") ||
    haystack.includes("super plasticizer") ||
    haystack.includes("ملدن فائق") ||
    haystack.includes("superplastifiant");
}

export function checkHscHpcApplicability(input: MixDesignInput): ApplicabilityResult {
  const type = concreteCode(input);
  if (!type) {
    return {
      level: "not_applicable",
      reasons: ["The specialized high-performance engine requires concreteType = HSC or HPC."],
      recommendations: ["Select HSC or HPC before running this engine."]
    };
  }

  const reasons: string[] = [];
  const recommendations: string[] = [];
  const fck = Number(input.fck28 || 0);

  if (type === "HSC" && fck < 50) {
    reasons.push(`HSC target strength fck28 = ${fck} MPa is below the engine's high-strength envelope.`);
    recommendations.push("Use NSC for conventional-strength concrete or select the target strength required for HSC.");
  }

  if (fck > 80) {
    reasons.push(`fck28 = ${fck} MPa is beyond the current HSC/HPC engine envelope.`);
    recommendations.push("Use the UHPC/BFUP specialized route for very high strength targets above 80 MPa.");
  }

  return {
    level: reasons.length > 0 ? "limited" : "applicable",
    reasons,
    recommendations
  };
}

export function validateHscHpcInputs(
  input: MixDesignInput,
  language: "ar" | "fr" | "en" = "ar"
): ValidationResult {
  const type = concreteCode(input);
  const errors: any[] = [];
  const warnings: any[] = [];

  if (!type) {
    errors.push({
      code: "concrete_type",
      severity: "error",
      field: "concreteType",
      message: language === "fr"
        ? "Le moteur HSC/HPC exige le type HSC ou HPC."
        : language === "en"
          ? "The HSC/HPC engine requires concreteType HSC or HPC."
          : "محرك HSC/HPC يتطلب نوع خرسانة HSC أو HPC."
    });
    return { isValid: false, errors, warnings };
  }

  const fck = Number(input.fck28);
  const dMax = Number(input.dMax);
  const slump = Number(input.slump || 0);
  const wb = Number((input as any)[type === "HSC" ? "hscWaterBinderRatio" : "hpcWaterBinderRatio"] ?? NaN);
  const water = Number((input as any)[type === "HSC" ? "hscWaterKgM3" : "hpcWaterKgM3"] ?? NaN);
  const superDosage = Number(input.dosageSuper || 0);
  const silicaDosage = Number(input.dosageSilicaFume || 0);
  const scmTotal =
    silicaDosage +
    Number(input.dosageFlyAsh || 0) +
    Number(input.dosageSlag || 0);

  if (!Number.isFinite(fck) || fck <= 0) {
    errors.push({ code: "fck", severity: "error", field: "fck28", message: "Target strength must be > 0 MPa." });
  } else if (type === "HSC" && fck < 50) {
    errors.push({ code: "hsc_strength", severity: "error", field: "fck28", message: "The HSC engine requires fck28 >= 50 MPa." });
  } else if (fck > 80) {
    errors.push({ code: "strength_envelope", severity: "error", field: "fck28", message: "The current HSC/HPC engine is limited to fck28 <= 80 MPa; use UHPC/BFUP above this range." });
  }

  if (!Number.isFinite(dMax) || dMax <= 0 || dMax > 20) {
    errors.push({ code: "dmax", severity: "error", field: "dMax", message: "HSC/HPC Dmax must be within 0-20 mm in the current specialized engine." });
  }

  const wbMin = type === "HSC" ? 0.22 : 0.25;
  const wbMax = type === "HSC" ? 0.36 : 0.38;
  if (Number.isFinite(wb) && (wb < wbMin || wb > wbMax)) {
    errors.push({ code: "water_binder", severity: "error", field: type === "HSC" ? "hscWaterBinderRatio" : "hpcWaterBinderRatio", message: `W/B must be between ${wbMin.toFixed(2)} and ${wbMax.toFixed(2)} in the current ${type} calculation envelope.` });
  }

  if (Number.isFinite(water) && (water < 125 || water > 190)) {
    errors.push({ code: "water", severity: "error", field: type === "HSC" ? "hscWaterKgM3" : "hpcWaterKgM3", message: "Effective water must be between 125 and 190 kg/m3 in the current HSC/HPC engine." });
  }

  if (superDosage <= 0) {
    errors.push({
      code: "superplasticizer",
      severity: "error",
      field: "dosageSuper",
      message: "HSC/HPC requires a high-range water-reducing admixture dosage greater than zero."
    });
  } else if (superDosage < 0.8 || superDosage > 3.0) {
    errors.push({
      code: "superplasticizer_range",
      severity: "error",
      field: "dosageSuper",
      message: "Superplasticizer dosage must be between 0.8% and 3.0% of binder in the current engine."
    });
  }

  if (type === "HSC") {
    if (silicaDosage < 5 || silicaDosage > 15) {
      errors.push({
        code: "silica_fume",
        severity: "error",
        field: "dosageSilicaFume",
        message: "The HSC engine requires silica-fume replacement between 5% and 15% of binder."
      });
    }
    if (scmTotal > 25) {
      errors.push({
        code: "scm_total",
        severity: "error",
        field: "dosageSilicaFume",
        message: "Total SCM replacement must not exceed 25% in the current HSC engine."
      });
    }
  } else {
    if (scmTotal < 5 || scmTotal > 30) {
      errors.push({
        code: "scm_total",
        severity: "error",
        field: "dosageSilicaFume",
        message: "The HPC engine requires total SCM replacement between 5% and 30% of binder."
      });
    }
  }

  if (slump > 20) {
    warnings.push({
      code: "slump",
      severity: "warning",
      field: "slump",
      message: "High slump must be achieved primarily through admixture control rather than uncontrolled water addition."
    });
  }

  return { isValid: errors.length === 0, errors, warnings };
}

export function calculateHscHpcMix(
  input: MixDesignInput,
  language: "ar" | "fr" | "en" = "ar"
): MixDesignResult {
  const type = concreteCode(input);
  if (!type) {
    return makeSpecializedResult(input, {
      methodId: "hsc-hpc-specialized",
      methodName: "HSC / HPC Specialized Mix Design",
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
      recommendations: ["Select HSC or HPC."],
      trace: [],
      complianceChecks: [{
        parameter: "concrete_type",
        requirement: "HSC or HPC",
        actual: "Unsupported concrete type",
        status: "non_compliant"
      }],
      lifecycle: "blocked"
    });
  }

  const validation = validateHscHpcInputs(input, language);
  const materials = resolveSpecializedMaterials(input, language, true, true);

  if (materials.errors.length > 0 || !validation.isValid) {
    return makeSpecializedResult(input, {
      methodId: "hsc-hpc-specialized",
      methodName: type === "HSC" ? "High-Strength Concrete (HSC)" : "High-Performance Concrete (HPC)",
      version: VERSION,
      cementKg: 0,
      waterKg: 0,
      fineAggregateKg: 0,
      coarseAggregateKg: 0,
      admixtureKg: 0,
      waterBinderRatio: 0,
      freshDensityKgM3: 0,
      absoluteVolumeL: 0,
      warnings: [...validation.warnings.map((w) => w.message), ...materials.warnings],
      assumptions: [],
      recommendations: [
        ...validation.errors.map((e) => e.message),
        ...materials.errors,
        "Complete the approved material-library selections and engineering inputs before HSC/HPC calculation."
      ],
      trace: [],
      complianceChecks: [
        ...validation.errors.map((e) => ({
          parameter: e.code,
          requirement: "Valid specialized HSC/HPC input",
          actual: e.message,
          status: "non_compliant" as const
        })),
        ...materials.errors.map((message) => ({
          parameter: "materials",
          requirement: "Approved material-library selection",
          actual: message,
          status: "non_compliant" as const
        }))
      ],
      lifecycle: "blocked"
    });
  }

  if (Array.isArray(input.materialsDatabase) && input.materialsDatabase.length > 0) {
    if (type === "HSC" && !isSilicaFume(materials.materials.scm)) {
      return makeSpecializedResult(input, {
        methodId: "hsc-hpc-specialized",
        methodName: "High-Strength Concrete (HSC)",
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
        recommendations: ["Select an approved silica-fume SCM material for HSC."],
        trace: [],
        complianceChecks: [{
          parameter: "scm_compatibility",
          requirement: "Silica fume SCM",
          actual: "Selected SCM is not identified as silica fume.",
          status: "non_compliant"
        }],
        lifecycle: "blocked"
      });
    }

    if (!isSuperplasticizer(materials.materials.admixture)) {
      return makeSpecializedResult(input, {
        methodId: "hsc-hpc-specialized",
        methodName: type === "HSC" ? "High-Strength Concrete (HSC)" : "High-Performance Concrete (HPC)",
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
        recommendations: ["Select an approved superplasticizer material for HSC/HPC."],
        trace: [],
        complianceChecks: [{
          parameter: "admixture_compatibility",
          requirement: "Superplasticizer",
          actual: "Selected chemical admixture is not identified as a superplasticizer.",
          status: "non_compliant"
        }],
        lifecycle: "blocked"
      });
    }
  }

  const cementDensity = materialDensityKgM3(materials.materials.cement, Number(input.cementDensity || 3150));
  const sandDensity = materialDensityKgM3(materials.materials.sand, Number(input.sandRelativeDensity || 2.65) * 1000);
  const gravelDensity = materialDensityKgM3(materials.materials.gravel, Number(input.gravelRelativeDensity || 2.65) * 1000);
  const scmDensity = materialDensityKgM3(materials.materials.scm, Number(input.selectedScmDensity || 2200));
  const admixtureDensity = materialDensityKgM3(materials.materials.admixture, Number(input.selectedAdmixtureDensity || 1080));

  const fck = Number(input.fck28);
  const slump = Number(input.slump || (type === "HSC" ? 8 : 10));
  const waterField = type === "HSC" ? "hscWaterKgM3" : "hpcWaterKgM3";
  const wbField = type === "HSC" ? "hscWaterBinderRatio" : "hpcWaterBinderRatio";
  const requestedWb = Number((input as any)[wbField]);
  const defaultWater = clamp(
    (type === "HSC" ? 150 : 155) + Math.max(0, slump - (type === "HSC" ? 8 : 10)) * 1.5,
    130,
    180
  );
  const water = clamp(
    Number.isFinite(Number((input as any)[waterField])) ? Number((input as any)[waterField]) : defaultWater,
    125,
    190
  );

  const defaultWb = type === "HSC"
    ? clamp(0.34 - Math.max(0, fck - 50) * 0.0025, 0.24, 0.34)
    : clamp(0.36 - Math.max(0, fck - 45) * 0.002, 0.26, 0.36);

  const wb = clamp(
    Number.isFinite(requestedWb) ? requestedWb : defaultWb,
    type === "HSC" ? 0.22 : 0.25,
    type === "HSC" ? 0.36 : 0.38
  );

  const binder = water / wb;
  const binderMin = type === "HSC" ? 420 : 400;
  const binderMax = 650;
  const binderOutOfRange = binder < binderMin || binder > binderMax;

  const scmPercent = clamp(
    type === "HSC"
      ? Number(input.dosageSilicaFume || 7.5)
      : Number(
          Number(input.dosageSilicaFume || 0) +
          Number(input.dosageFlyAsh || 0) +
          Number(input.dosageSlag || 0) ||
          15
        ),
    type === "HSC" ? 5 : 5,
    type === "HSC" ? 25 : 30
  );

  const scmKg = binder * scmPercent / 100;
  const cementKg = binder - scmKg;

  const superDosage = clamp(
    Number(input.dosageSuper || (type === "HSC" ? 1.2 : 1.0)),
    0.8,
    3.0
  );
  const admixtureKg = binder * superDosage / 100;

  const defaultCoarseFraction = type === "HSC" ? 0.35 : 0.33;
  const coarseFraction = clamp(
    Number((input as any)[type === "HSC" ? "hscCoarseAggregateVolumeFraction" : "hpcCoarseAggregateVolumeFraction"] ?? defaultCoarseFraction),
    0.28,
    0.40
  );
  const coarseVolumeL = coarseFraction * 1000;
  const coarseKg = coarseVolumeL / 1000 * gravelDensity;

  const airPercent = clamp(Number(input.airContent || 1.5), 0.5, 4.0);
  const cementVolumeL = cementKg / cementDensity * 1000;
  const scmVolumeL = scmKg / scmDensity * 1000;
  const waterVolumeL = water;
  const admixtureVolumeL = admixtureKg / admixtureDensity * 1000;
  const airVolumeL = airPercent * 10;

  const fineVolumeL = 1000 - cementVolumeL - scmVolumeL - waterVolumeL - admixtureVolumeL - airVolumeL - coarseVolumeL;
  const fineKg = Math.max(0, fineVolumeL / 1000 * sandDensity);

  const sandCorrection = computeMoistureBatch(
    fineKg,
    Number(input.moistureSand || 0),
    Number(input.sandAbsorption || materialProperty(materials.materials.sand, ["absorption", "Absorption"], 0) || 0)
  );
  const gravelCorrection = computeMoistureBatch(
    coarseKg,
    Number(input.moistureGravel || 0),
    Number(input.gravelAbsorption || materialProperty(materials.materials.gravel, ["absorption", "Absorption"], 0) || 0)
  );

  const waterToAdd = Math.max(
    0,
    water - sandCorrection.freeSurfaceWater - gravelCorrection.freeSurfaceWater +
    sandCorrection.absorptionDeficit + gravelCorrection.absorptionDeficit
  );

  const filledVolumeL =
    cementVolumeL +
    scmVolumeL +
    waterVolumeL +
    admixtureVolumeL +
    airVolumeL +
    coarseVolumeL +
    fineVolumeL;

  const estimatedFreshDensity =
    cementKg +
    scmKg +
    sandCorrection.wetKg +
    gravelCorrection.wetKg +
    waterToAdd +
    admixtureKg;

  const complianceChecks: any[] = [
    {
      parameter: "water_binder",
      requirement: `${type === "HSC" ? "0.22-0.36" : "0.25-0.38"}`,
      actual: wb.toFixed(3),
      status: wb >= (type === "HSC" ? 0.22 : 0.25) && wb <= (type === "HSC" ? 0.36 : 0.38) ? "compliant" : "non_compliant"
    },
    {
      parameter: "binder",
      requirement: `${binderMin}-${binderMax} kg/m3`,
      actual: binder.toFixed(1),
      status: binderOutOfRange ? "non_compliant" : "compliant"
    },
    {
      parameter: "scm",
      requirement: type === "HSC" ? "Silica fume 5-25% of binder" : "Total SCM 5-30% of binder",
      actual: `${scmPercent.toFixed(1)}%`,
      status: "compliant"
    },
    {
      parameter: "superplasticizer",
      requirement: "0.8-3.0% of binder",
      actual: `${superDosage.toFixed(2)}%`,
      status: superDosage >= 0.8 && superDosage <= 3 ? "compliant" : "non_compliant"
    },
    {
      parameter: "dmax",
      requirement: "<=20 mm",
      actual: `${Number(input.dMax).toFixed(1)} mm`,
      status: Number(input.dMax) <= 20 ? "compliant" : "non_compliant"
    },
    {
      parameter: "volume_closure",
      requirement: "filled constituent volume = 1000 L/m3",
      actual: `${filledVolumeL.toFixed(2)} L/m3`,
      status: Math.abs(filledVolumeL - 1000) <= 2 ? "compliant" : "non_compliant"
    },
    {
      parameter: "trial_mix",
      requirement: "laboratory trial batches and performance verification",
      actual: "Required",
      status: "warning"
    }
  ];

  if (fineVolumeL <= 0) {
    complianceChecks.push({
      parameter: "fine_aggregate_volume",
      requirement: ">0 L/m3",
      actual: "Absolute-volume balance leaves no positive fine aggregate volume.",
      status: "non_compliant"
    });
  }

  const lifecycle = binderOutOfRange || fineVolumeL <= 0
    ? "blocked" as const
    : "needs_trial_mix" as const;

  const warnings = [
    `${type} uses a specialized high-performance proportioning framework, not the Dreux-Gorisse equations.`,
    "Trial batches are mandatory for confirmation of strength, workability, stability, durability and material compatibility.",
    `Starting water/binder ratio = ${wb.toFixed(3)}.`,
    `SCM replacement = ${scmPercent.toFixed(1)}% of total binder.`
  ];

  const assumptions = [
    `Concrete family = ${type}; target fck28 = ${fck.toFixed(1)} MPa.`,
    `Effective water = ${water.toFixed(1)} kg/m3.`,
    `Total binder = ${binder.toFixed(1)} kg/m3.`,
    `Coarse aggregate volume fraction = ${(coarseFraction * 100).toFixed(1)}%.`,
    "Fine aggregate mass is solved by absolute-volume closure using the selected material densities.",
    "Aggregate moisture and absorption corrections are applied to batching water."
  ];

  const recommendations = [
    "Prepare and test trial batches using the actual cement, SCM, aggregate and superplasticizer products.",
    "Verify compressive strength at the project-specified ages and fresh workability after the intended transport/retention period.",
    "Use laboratory response data to refine W/B, SCM replacement, coarse/fine aggregate balance and admixture dosage.",
    "Do not treat the numerical starting mix as certification or production release."
  ];

  const result: any = makeSpecializedResult(input, {
    methodId: "hsc-hpc-specialized",
    methodName: type === "HSC" ? "High-Strength Concrete (HSC)" : "High-Performance Concrete (HPC)",
    version: VERSION,
    cementKg,
    waterKg: water,
    fineAggregateKg: fineKg,
    coarseAggregateKg: coarseKg,
    admixtureKg,
    admixtureName: String(materials.materials.admixture?.name || input.selectedAdmixtureName || "Superplasticizer"),
    scmKg,
    waterBinderRatio: water / binder,
    freshDensityKgM3: estimatedFreshDensity,
    absoluteVolumeL: filledVolumeL,
    warnings,
    assumptions,
    recommendations,
    trace: [
      {
        stepId: `${type.toLowerCase()}-1`,
        label: "Select effective water for the required high-performance workability.",
        formula: `W = selected ${waterField} or controlled starting water demand`,
        inputs: { slump, requestedWater: (input as any)[waterField] },
        output: water,
        unit: "kg/m3"
      },
      {
        stepId: `${type.toLowerCase()}-2`,
        label: "Determine starting water/binder ratio.",
        formula: type === "HSC"
          ? "W/B = clamp(0.34 - 0.0025·max(fck-50,0), 0.24, 0.34)"
          : "W/B = clamp(0.36 - 0.002·max(fck-45,0), 0.26, 0.36)",
        inputs: { fck, requestedWb },
        output: wb,
        unit: "-"
      },
      {
        stepId: `${type.toLowerCase()}-3`,
        label: "Calculate total binder from W/B.",
        formula: "B = W / (W/B)",
        inputs: { water, wb },
        output: binder,
        unit: "kg/m3"
      },
      {
        stepId: `${type.toLowerCase()}-4`,
        label: "Allocate supplementary cementitious materials.",
        formula: "SCM = B·replacement%",
        inputs: { scmPercent },
        output: scmKg,
        unit: "kg/m3"
      },
      {
        stepId: `${type.toLowerCase()}-5`,
        label: "Set coarse aggregate volume fraction.",
        formula: "Vca = 1000·fraction",
        inputs: { coarseFraction },
        output: coarseVolumeL,
        unit: "L/m3"
      },
      {
        stepId: `${type.toLowerCase()}-6`,
        label: "Solve fine aggregate by absolute-volume closure.",
        formula: "Vfa = 1000 - Vcement - Vscm - Vwater - Vad - Vair - Vca",
        inputs: { cementVolumeL, scmVolumeL, waterVolumeL, admixtureVolumeL, airVolumeL, coarseVolumeL },
        output: fineVolumeL,
        unit: "L/m3"
      },
      {
        stepId: `${type.toLowerCase()}-7`,
        label: "Correct batching water for aggregate moisture and absorption.",
        formula: "Wadd = W - Wfree + Wdeficit",
        inputs: {
          freeSurfaceWater: sandCorrection.freeSurfaceWater + gravelCorrection.freeSurfaceWater,
          absorptionDeficit: sandCorrection.absorptionDeficit + gravelCorrection.absorptionDeficit
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
  result.sandTotalMoistureWater = sandCorrection.moistureWater;
  result.gravelTotalMoistureWater = gravelCorrection.moistureWater;
  result.totalFreeSurfaceWater = sandCorrection.freeSurfaceWater + gravelCorrection.freeSurfaceWater;
  result.totalAbsorptionDeficit = sandCorrection.absorptionDeficit + gravelCorrection.absorptionDeficit;
  result.engineeringAudit = {
    specializedMethod: type,
    framework: "ACI 211.4 / FHWA-oriented high-strength/high-performance starting proportioning",
    targetStrengthMPa: fck,
    waterBinderRatio: water / binder,
    binderKgM3: binder,
    scmReplacementPercent: scmPercent,
    superplasticizerDosagePercent: superDosage,
    coarseAggregateVolumeFraction: coarseFraction,
    filledVolumeL
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
