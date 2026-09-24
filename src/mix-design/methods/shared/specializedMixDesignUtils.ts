import { MixDesignInput, MixDesignResult } from "../../core/types";

type MaterialRecord = Record<string, any>;

export interface ResolvedSpecializedMaterials {
  cement?: MaterialRecord;
  sand?: MaterialRecord;
  gravel?: MaterialRecord;
  water?: MaterialRecord;
  admixture?: MaterialRecord;
  scm?: MaterialRecord;
}

export interface SpecializedMaterialResolution {
  materials: ResolvedSpecializedMaterials;
  errors: string[];
  warnings: string[];
}

function normalizeDensity(value: unknown): number | undefined {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n < 20 ? n * 1000 : n;
}

function byIdOrName(database: MaterialRecord[], id?: string, name?: string): MaterialRecord | undefined {
  if (!Array.isArray(database)) return undefined;
  if (id) {
    const exact = database.find((m) => String(m?.id || "") === String(id));
    if (exact) return exact;
  }
  if (name) {
    const normalized = String(name).trim().toLowerCase();
    return database.find((m) =>
      [m?.name, m?.englishName, m?.frenchName]
        .filter(Boolean)
        .some((candidate: unknown) => String(candidate).trim().toLowerCase() === normalized)
    );
  }
  return undefined;
}

function roleMessage(role: string, language: "ar" | "fr" | "en"): string {
  if (language === "fr") return `Matériau requis introuvable: ${role}.`;
  if (language === "en") return `Required material not found: ${role}.`;
  return `المادة المطلوبة غير موجودة: ${role}.`;
}

export function resolveSpecializedMaterials(
  input: MixDesignInput,
  language: "ar" | "fr" | "en" = "ar",
  requireAdmixture = false,
  requireScm = false
): SpecializedMaterialResolution {
  const database = Array.isArray(input.materialsDatabase) ? input.materialsDatabase as MaterialRecord[] : [];
  const hasRepository = database.length > 0;
  const errors: string[] = [];
  const warnings: string[] = [];

  const materials: ResolvedSpecializedMaterials = {
    cement: byIdOrName(database, input.selectedCementId, input.cementType),
    sand: byIdOrName(database, input.selectedSandId, input.sandType),
    gravel: byIdOrName(database, input.selectedGravelId, input.gravelType),
    water: byIdOrName(database, input.selectedWaterId, input.selectedWaterName),
    admixture: byIdOrName(database, input.selectedAdmixtureId, input.selectedAdmixtureName),
    scm: byIdOrName(database, input.selectedScmId, input.selectedScmName)
  };

  if (hasRepository) {
    if (!materials.cement) errors.push(roleMessage("cement / إسمنت", language));
    if (!materials.sand) errors.push(roleMessage("fine aggregate / رمال", language));
    if (!materials.gravel) errors.push(roleMessage("coarse aggregate / حصى", language));
    if (!materials.water) errors.push(roleMessage("water / ماء", language));
    if (requireAdmixture && !materials.admixture) errors.push(roleMessage("superplasticizer / ملدن فائق", language));
    if (requireScm && !materials.scm) errors.push(roleMessage("SCM / إضافة معدنية", language));
  }

  const checkDensity = (material: MaterialRecord | undefined, role: string, fallback?: number) => {
    const density = normalizeDensity(material?.density ?? material?.ssdDensity ?? material?.specificGravity);
    if (density === undefined && fallback === undefined && hasRepository) {
      errors.push(roleMessage(`${role} density / كثافة ${role}`, language));
    }
    return density ?? fallback;
  };

  checkDensity(materials.cement, "cement", input.cementDensity);
  checkDensity(materials.sand, "sand", Number(input.sandRelativeDensity) * 1000);
  checkDensity(materials.gravel, "gravel", Number(input.gravelRelativeDensity) * 1000);
  checkDensity(materials.water, "water", 1000);

  return { materials, errors, warnings };
}

export function materialProperty(material: MaterialRecord | undefined, keys: string[], fallback?: number): number | undefined {
  for (const key of keys) {
    const raw = material?.[key];
    if (raw !== undefined && raw !== null && raw !== "") {
      const n = Number(raw);
      if (Number.isFinite(n)) return n;
    }
  }
  return fallback;
}

export function materialDensityKgM3(material: MaterialRecord | undefined, fallback: number): number {
  const value = materialProperty(material, ["density", "ssdDensity", "specificGravity", "SpecificGravity"]);
  if (value === undefined) return fallback;
  return value < 20 ? value * 1000 : value;
}

export function computeMoistureBatch(
  dryKg: number,
  moisturePercent: number,
  absorptionPercent: number
) {
  const moistureWater = dryKg * Math.max(0, moisturePercent) / 100;
  const absorptionWater = dryKg * Math.max(0, absorptionPercent) / 100;
  const freeSurfaceWater = dryKg * Math.max(0, moisturePercent - absorptionPercent) / 100;
  const absorptionDeficit = dryKg * Math.max(0, absorptionPercent - moisturePercent) / 100;
  const wetKg = dryKg + moistureWater;
  return { wetKg, moistureWater, absorptionWater, freeSurfaceWater, absorptionDeficit };
}

export function makeSpecializedResult(
  input: MixDesignInput,
  data: {
    methodId: string;
    methodName: string;
    version: string;
    cementKg: number;
    waterKg: number;
    fineAggregateKg: number;
    coarseAggregateKg: number;
    admixtureKg: number;
    admixtureName?: string;
    scmKg?: number;
    fiberKg?: number;
    waterBinderRatio: number;
    freshDensityKgM3: number;
    absoluteVolumeL: number;
    targetVoidContentPercent?: number;
    estimatedVoidContentPercent?: number;
    warnings: string[];
    assumptions: string[];
    recommendations: string[];
    trace: Array<{ stepId: string; label: string; formula?: string; inputs: Record<string, any>; output: any; unit?: string }>;
    complianceChecks: Array<{ parameter: string; requirement: string; actual: string; status: "compliant" | "warning" | "non_compliant" }>;
    lifecycle?: "valid" | "valid_with_warnings" | "needs_trial_mix" | "blocked";
    referenceFilledVolumeL?: number;
  }
): MixDesignResult {
  const referenceFilledVolumeL = data.referenceFilledVolumeL ?? 1000;
  const absoluteVolumeError = Math.abs(data.absoluteVolumeL - referenceFilledVolumeL);
  const status = data.lifecycle === "blocked" ? "not-supported" : "success";
  const fiberWeight = data.fiberKg || 0;
  const totalBinder = data.cementKg + (data.scmKg || 0);
  const totalFresh = data.cementKg + (data.scmKg || 0) + data.fineAggregateKg + data.coarseAggregateKg + data.admixtureKg + fiberWeight + data.waterKg;

  const result: any = {
    methodId: data.methodId,
    methodName: data.methodName,
    method: { id: data.methodId, name: data.methodName, version: data.version },
    status,
    category: "specialized-concrete-design",
    implementationStatus: "complete",
    isStandaloneCompleteMethod: true,
    cementKg: data.cementKg,
    scmKg: data.scmKg || 0,
    fiberKg: data.fiberKg || 0,
    waterKg: data.waterKg,
    fineAggregateKg: data.fineAggregateKg,
    coarseAggregateKg: data.coarseAggregateKg,
    admixtureKg: data.admixtureKg,
    admixtureWeights: data.admixtureKg > 0 ? [{
      admixtureId: input.selectedAdmixtureId || "specialized-admixture",
      name: data.admixtureName || input.selectedAdmixtureName || "Superplasticizer",
      weight: data.admixtureKg
    }] : [],
    airContentPercent: input.airContent || 0,
    wcRatio: data.waterBinderRatio,
    waterCementRatio: data.waterBinderRatio,
    freshDensityKgM3: data.freshDensityKgM3,
    totalFreshDensity: totalFresh,
    totalBatchWeight: totalFresh,
    totalBinder,
    activeCementWeight: data.cementKg,
    sandWeightDry: data.fineAggregateKg,
    gravelWeightDry: data.coarseAggregateKg,
    waterContentActual: data.waterKg,
    waterContentNeeded: data.waterKg,
    waterToAdd: data.waterKg,
    sandWeightWet: data.fineAggregateKg * (1 + (input.moistureSand || 0) / 100),
    gravelWeightWet: data.coarseAggregateKg * (1 + (input.moistureGravel || 0) / 100),
    batchWaterToAdd: data.waterKg,
    absoluteVolumeTotal: data.absoluteVolumeL,
    volumeClosureError: absoluteVolumeError,
    physicalProperties: {
      theoreticalFreshDensity: data.freshDensityKgM3,
      absoluteVolume: data.absoluteVolumeL,
      volumeClosureError: absoluteVolumeError
    },
    quantities: {
      cement: data.cementKg,
      supplementaryCementitiousMaterials: data.scmKg || 0,
      totalBinder,
      effectiveWater: data.waterKg,
      addedWater: data.waterKg,
      fineAggregates: data.fineAggregateKg,
      coarseAggregates: data.coarseAggregateKg,
      admixtures: data.admixtureKg > 0 ? [{
        id: input.selectedAdmixtureId || "specialized-admixture",
        name: data.admixtureName || input.selectedAdmixtureName || "Superplasticizer",
        type: "superplasticizer",
        weight: data.admixtureKg
      }] : [],
      fibers: fiberWeight > 0 ? [{
        id: input.selectedFiberId || "fiber-specialized",
        name: input.selectedFiberName || "Fiber",
        type: "fiber",
        weight: fiberWeight
      }] : []
    },
    ratios: {
      waterCementRatio: data.waterBinderRatio,
      waterBinderRatio: data.waterBinderRatio,
      sandAggregateRatio:
        data.fineAggregateKg + data.coarseAggregateKg > 0
          ? data.fineAggregateKg / (data.fineAggregateKg + data.coarseAggregateKg)
          : 0
    },
    absoluteVolumeCheck: {
      isValid: absoluteVolumeError <= 2,
      totalAbsVolumeL: data.absoluteVolumeL,
      deviationPercent: absoluteVolumeError / 10
    },
    compliance: {
      standardName: "Specialized concrete engineering framework",
      isCompliant: data.complianceChecks.every((c) => c.status !== "non_compliant"),
      checks: data.complianceChecks
    },
    validation: {
      isValid: data.lifecycle !== "blocked" && absoluteVolumeError <= 2 && data.complianceChecks.every((c) => c.status !== "non_compliant"),
      errors: data.complianceChecks.filter((c) => c.status === "non_compliant").map((c) => ({
        code: c.parameter,
        severity: "error",
        field: c.parameter,
        message: c.actual
      })),
      warnings: data.complianceChecks.filter((c) => c.status === "warning").map((c) => ({
        code: c.parameter,
        severity: "warning",
        field: c.parameter,
        message: c.actual
      }))
    },
    warnings: data.warnings,
    errors: data.complianceChecks.filter((c) => c.status === "non_compliant").map((c) => c.actual),
    assumptions: data.assumptions,
    recommendations: data.recommendations,
    calculationNotes: data.assumptions,
    calculationSteps: data.trace.map((s) => s.label),
    trace: data.trace,
    calculatedAt: new Date().toISOString(),
    calculationStatus: data.lifecycle || "needs_trial_mix",
    engineStatus: data.lifecycle || "needs_trial_mix",
    confidenceLevel: "medium",
    methodApplicability: {
      applicable: data.lifecycle !== "blocked",
      level: data.lifecycle === "blocked" ? "not_applicable" : "applicable",
      reasons: [],
      recommendations: data.recommendations
    },
    valid: data.lifecycle !== "blocked" && absoluteVolumeError <= 2,
    isValid: data.lifecycle !== "blocked" && absoluteVolumeError <= 2
  };

  result.warnings = [
    ...data.warnings,
    "Preliminary specialized proportioning: laboratory trial-mix verification is required before production use."
  ];

  if (data.targetVoidContentPercent !== undefined) result.targetVoidContentPercent = data.targetVoidContentPercent;
  if (data.estimatedVoidContentPercent !== undefined) result.estimatedVoidContentPercent = data.estimatedVoidContentPercent;

  return result as MixDesignResult;
}
