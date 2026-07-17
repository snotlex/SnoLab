/**
 * Shared utility for robust parsing and sanitization of numeric fields.
 */
export function parseNumericValue(val: any): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  
  // Convert localized Arabic/French commas to dots
  const str = String(val).replace(/,/g, ".").trim();
  
  // Extract first floating-point number if mixed with text (e.g., "2650 kg/m³")
  const match = str.match(/-?\d+(\.\d+)?/);
  if (match) {
    const parsed = parseFloat(match[0]);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}
