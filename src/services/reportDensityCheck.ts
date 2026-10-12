/**
 * Classifies report density without inventing a plausible value when it is missing.
 * This is a report safety gate, not a replacement for engineering validation.
 */
export type ReportDensityStatus = "unavailable" | "below-minimum" | "pass";

export function classifyReportDensity(value: unknown, concreteType: string): ReportDensityStatus {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "unavailable";
  }
  if (value < 2100 && concreteType.toUpperCase() !== "LWC") {
    return "below-minimum";
  }
  return "pass";
}
