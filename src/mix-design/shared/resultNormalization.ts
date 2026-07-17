/**
 * Shared utility for rounding values and ensuring consistent output properties.
 */
export function roundToPrecision(val: number, decimalPlaces = 0): number {
  if (val === undefined || val === null || isNaN(val)) return 0;
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(val * factor) / factor;
}

export function formatResultLanguage(
  messages: Record<string, string>,
  language: "ar" | "fr" | "en"
): string {
  return messages[language] || messages["ar"] || "";
}
