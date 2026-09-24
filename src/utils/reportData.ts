import { MixDesignInput, MixDesignResult, SievePoint } from "../types";

export interface ReportDataRow {
  key: string;
  label: string;
  value: string | number | boolean;
  path?: string;
}

export interface ReportCurvePoint {
  size: number;
  targetPassing: number;
  actualPassing?: number;
}

const UNIT_HINTS: Record<string, string> = {
  fck28: "MPa",
  fcm28: "MPa",
  slump: "cm",
  dMax: "mm",
  airContent: "%",
  finenessModulus: "",
  moistureSand: "%",
  moistureGravel: "%",
  sandAbsorption: "%",
  gravelAbsorption: "%",
  cementDensity: "kg/m³",
  sandRelativeDensity: "",
  gravelRelativeDensity: "",
  waterContentActual: "kg/m³",
  waterCementRatio: "",
  waterBinderRatio: "",
  wcRatioAdjusted: "",
  cementWeight: "kg/m³",
  sandWeightDry: "kg/m³",
  gravelWeightDry: "kg/m³",
  sandWeightWet: "kg/m³",
  gravelWeightWet: "kg/m³",
  waterWeightWet: "kg/m³",
  totalFreshDensity: "kg/m³",
  theoreticalCementDemand: "kg/m³",
  actualCementUsed: "kg/m³",
  aggregateAbsorptionDeficit: "kg/m³",
  volumeClosureError: "%",
  rmse: "%",
  batchVolume: "m³"
};

export function humanizeReportKey(key: string): string {
  const cleaned = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const map: Record<string, string> = {
    fck28: "Characteristic compressive strength fck,28",
    fcm28: "Target mean compressive strength fcm,28",
    dMax: "Maximum aggregate size Dmax",
    wcRatioAdjusted: "Effective W/C ratio",
    waterCementRatio: "Water/Cement ratio",
    waterBinderRatio: "Water/Binder ratio",
    totalFreshDensity: "Fresh concrete density",
    compactorGamma: "Compaction coefficient γ",
    sandPercent: "Fine aggregate percentage",
    gravelPercent: "Coarse aggregate percentage",
    finenessModulus: "Sand fineness modulus",
    moistureSand: "Sand moisture content",
    moistureGravel: "Gravel moisture content",
    batchVolume: "Calculation batch volume",
    structuralElement: "Target structural element",
    exposureClass: "Exposure class",
    controlClass: "Quality control class",
    concreteType: "Concrete type",
    hasPumping: "Pumping condition",
    isGranularOptimizedApproved: "Approved aggregate optimization",
    engineeringAudit: "Engineering audit metadata",
    calculationTrace: "Calculation trace",
    standardsCompliance: "Standards compliance checks",
    batchCorrection: "Batch moisture correction",
    batchQuantities: "Batch quantities"
  };
  const label = map[key] || cleaned;
  const unit = UNIT_HINTS[key];
  return unit && !label.includes(unit) ? `${label} [${unit}]` : label;
}

function scalarToText(value: unknown): string | number | boolean {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? Number(value.toFixed(8)) : String(value);
  if (typeof value === "boolean") return value;
  return String(value);
}

function flattenValue(
  value: unknown,
  path: string,
  labelPrefix: string,
  rows: ReportDataRow[],
  depth: number,
  maxDepth = 4
): void {
  if (value === undefined || value === null) return;

  if (typeof value !== "object") {
    const scalar = scalarToText(value);
    if (scalar !== "") {
      const key = path.split(".").pop() || path;
      rows.push({
        key,
        path,
        label: labelPrefix || humanizeReportKey(key),
        value: scalar
      });
    }
    return;
  }

  if (depth >= maxDepth) {
    rows.push({
      key: path.split(".").pop() || path,
      path,
      label: labelPrefix || humanizeReportKey(path.split(".").pop() || path),
      value: JSON.stringify(value)
    });
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      flattenValue(
        item,
        `${path}[${index}]`,
        `${labelPrefix || humanizeReportKey(path.split(".").pop() || path)} #${index + 1}`,
        rows,
        depth + 1,
        maxDepth
      );
    });
    return;
  }

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const nextPath = path ? `${path}.${key}` : key;
    const label = labelPrefix
      ? `${labelPrefix} — ${humanizeReportKey(key)}`
      : humanizeReportKey(key);
    flattenValue(child, nextPath, label, rows, depth + 1, maxDepth);
  }
}

export function flattenReportObject(value: unknown, maxDepth = 4): ReportDataRow[] {
  const rows: ReportDataRow[] = [];
  flattenValue(value, "", "", rows, 0, maxDepth);
  return rows.filter(row => row.value !== "");
}

export function getCompleteInputRows(input: MixDesignInput): ReportDataRow[] {
  return flattenReportObject(input, 4);
}

export function getCompleteResultRows(result: MixDesignResult): ReportDataRow[] {
  return flattenReportObject(result, 5);
}

export function getGradingSeries(result: MixDesignResult): ReportCurvePoint[] {
  const target = Array.isArray(result.gradingCurve) ? result.gradingCurve : [];
  const actual = Array.isArray((result as any).actualGradingCurve)
    ? (result as any).actualGradingCurve as Array<{ size: number; passing: number; targetPassing: number }>
    : [];

  const bySize = new Map<number, ReportCurvePoint>();

  for (const point of target) {
    const size = Number((point as SievePoint).size);
    const targetPassing = Number((point as SievePoint).targetPassing);
    if (Number.isFinite(size) && size > 0 && Number.isFinite(targetPassing)) {
      bySize.set(size, { size, targetPassing });
    }
  }

  for (const point of actual) {
    const size = Number(point.size);
    const targetPassing = Number(point.targetPassing);
    const actualPassing = Number(point.passing);
    if (!Number.isFinite(size) || size <= 0) continue;
    const current = bySize.get(size);
    bySize.set(size, {
      size,
      targetPassing: current?.targetPassing ?? (Number.isFinite(targetPassing) ? targetPassing : 0),
      actualPassing: Number.isFinite(actualPassing) ? actualPassing : undefined
    });
  }

  return Array.from(bySize.values()).sort((a, b) => a.size - b.size);
}

export function getStrengthSeries(result: MixDesignResult): Array<{ age: number; strength: number }> {
  return Array.isArray(result.strengthEvolution)
    ? result.strengthEvolution
        .map(point => ({ age: Number(point.age), strength: Number(point.strength) }))
        .filter(point => Number.isFinite(point.age) && Number.isFinite(point.strength))
        .sort((a, b) => a.age - b.age)
    : [];
}

export function getCalculationStatusLabel(status: unknown, lang: "ar" | "fr" | "en"): string {
  const s = String(status || "valid_with_warnings");
  const labels = {
    ar: {
      valid: "صالح حسابياً",
      valid_with_warnings: "صالح مع تنبيهات",
      needs_data: "بحاجة إلى بيانات",
      needs_trial_mix: "بحاجة إلى خلطة تجريبية",
      blocked: "محجوب هندسياً"
    },
    fr: {
      valid: "Valide pour calcul",
      valid_with_warnings: "Valide avec avertissements",
      needs_data: "Données manquantes",
      needs_trial_mix: "Essai de convenance requis",
      blocked: "Bloqué par contrôle technique"
    },
    en: {
      valid: "Calculation valid",
      valid_with_warnings: "Valid with warnings",
      needs_data: "Data required",
      needs_trial_mix: "Trial mix required",
      blocked: "Engineering gate blocked"
    }
  } as const;
  return labels[lang][s as keyof typeof labels[typeof lang]] || s;
}

export function formatReportValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") return Number.isFinite(value) ? String(Number(value.toFixed(6))) : String(value);
  if (Array.isArray(value)) return value.map(formatReportValue).join(", ");
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "[object]";
    }
  }
  return String(value);
}

export function buildReportFileName(
  prefix: string,
  input: MixDesignInput,
  lang: "ar" | "fr" | "en",
  extension: string
): string {
  const strength = Number(input.fck28);
  const code = Number.isFinite(strength) ? `C${Math.round(strength)}` : "MIX";
  return `SnoLab_${prefix}_${code}_${lang.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.${extension}`;
}
