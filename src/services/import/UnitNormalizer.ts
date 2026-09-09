import { NormalizedValue } from "./types";

/**
 * Intelligent Unit Normalization Engine for Concrete Materials Engineering
 * Supports multilingual unit notations (EN, FR, AR, mathematical symbols)
 * Preserves source values with complete traceability.
 */
export class UnitNormalizer {
  /**
   * Cleans raw string or number and extracts potential embedded unit.
   * e.g. "2650 kg/m3" -> { rawNumber: 2650, unit: "kg/m³" }
   * e.g. "1,5 %" -> { rawNumber: 1.5, unit: "%" }
   * e.g. "42.5 MPa" -> { rawNumber: 42.5, unit: "MPa" }
   */
  public static extractNumberAndUnit(raw: any): { value: number | null; unit: string | null } {
    if (raw === null || raw === undefined) return { value: null, unit: null };
    if (typeof raw === "number") {
      if (isNaN(raw)) return { value: null, unit: null };
      return { value: raw, unit: null };
    }

    const str = String(raw).trim();
    if (str === "") return { value: null, unit: null };

    // Standardize commas to dots for decimal notation (e.g., European/French 1,5 -> 1.5)
    // Be careful with thousands separators (e.g., 2,650 -> 2650)
    let cleaned = str;
    if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(cleaned)) {
      // Thousands comma: 2,650 or 1,200.5
      cleaned = cleaned.replace(/,/g, "");
    } else {
      // Decimal comma: 1,5 or 2650,5
      cleaned = cleaned.replace(/,(\d{1,4})(?!\d)/, ".$1");
    }

    // Match leading number (supports signed decimals and scientific notation like 1.5e-3)
    const match = cleaned.match(/^([+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*(.*)$/);
    if (match) {
      const num = parseFloat(match[1]);
      if (isNaN(num)) return { value: null, unit: null };
      const rawUnit = match[2]?.trim() || null;
      return { value: num, unit: rawUnit ? UnitNormalizer.standardizeUnit(rawUnit) : null };
    }

    // Try finding number embedded with unit prefix/suffix e.g. "Abs: 1.2%"
    const embeddedMatch = cleaned.match(/([+-]?\d+(?:\.\d+)?)\s*(%|kg\/m[3³]|g\/cm[3³]|mpa|n\/mm[2²]|mm|µm|um|cm[2²]\/g|m[2²]\/kg|mg\/l|ppm|dzd|da)/i);
    if (embeddedMatch) {
      const num = parseFloat(embeddedMatch[1]);
      const unit = embeddedMatch[2];
      return { value: isNaN(num) ? null : num, unit: UnitNormalizer.standardizeUnit(unit) };
    }

    return { value: null, unit: null };
  }

  /**
   * Standardizes unit notations across languages and symbol variants.
   */
  public static standardizeUnit(rawUnit: string): string {
    if (!rawUnit) return "";
    const u = rawUnit.toLowerCase().trim()
      .replace(/[\(\)\[\]]/g, "")
      .replace(/\s+/g, "");

    // Percentage
    if (u === "%" || u === "pourcent" || u === "percent" || u === "بالمئة" || u === "نسبة") {
      return "%";
    }

    // Density / Specific Gravity
    if (u === "kg/m3" || u === "kg/m³" || u === "kg/m^3" || u === "كغ/م³" || u === "كجم/م3" || u === "kgm-3") {
      return "kg/m³";
    }
    if (u === "g/cm3" || u === "g/cm³" || u === "g/cm^3" || u === "غ/سم³" || u === "غم/سم3" || u === "g/ml" || u === "kg/l" || u === "kg/dm3" || u === "kg/dm³" || u === "t/m3" || u === "t/m³") {
      return "g/cm³";
    }

    // Pressure & Strength
    if (u === "mpa" || u === "n/mm2" || u === "n/mm²" || u === "ميجاباسكال" || u === "ميغاباسكال") {
      return "MPa";
    }
    if (u === "bar" || u === "bars") {
      return "bar";
    }
    if (u === "kg/cm2" || u === "kg/cm²" || u === "kgf/cm2") {
      return "kg/cm²";
    }

    // Length / Diameter / Sieve
    if (u === "mm" || u === "مم" || u === "millimeter" || u === "millimètre") {
      return "mm";
    }
    if (u === "um" || u === "µm" || u === "micron" || u === "microns" || u === "ميكرون") {
      return "µm";
    }
    if (u === "cm" || u === "سم") {
      return "cm";
    }

    // Specific Surface Area
    if (u === "m2/kg" || u === "m²/kg" || u === "m^2/kg") {
      return "m²/kg";
    }
    if (u === "cm2/g" || u === "cm²/g" || u === "cm^2/g") {
      return "cm²/g";
    }

    // Chemical Concentration
    if (u === "mg/l" || u === "mg/litre" || u === "ملغ/ل") {
      return "mg/L";
    }
    if (u === "ppm") {
      return "ppm";
    }

    // Currency
    if (u === "dzd" || u === "da" || u === "دج" || u === "دينار") {
      return "DZD";
    }

    return rawUnit.trim();
  }

  /**
   * Normalizes a property value into SnoLab's canonical unit based on property key.
   */
  public static normalizePropertyValue(
    canonicalKey: string,
    rawValue: any,
    explicitUnit?: string
  ): NormalizedValue {
    // Check 0 explicitly: 0 is a valid measurement!
    if (rawValue === 0) {
      return {
        sourceValue: 0,
        sourceUnit: explicitUnit || undefined,
        normalizedValue: 0,
        normalizedUnit: UnitNormalizer.getCanonicalUnitForKey(canonicalKey),
        conversionFactor: 1
      };
    }

    if (rawValue === null || rawValue === undefined || rawValue === "") {
      return {
        sourceValue: rawValue,
        sourceUnit: explicitUnit || undefined,
        normalizedValue: null,
        normalizedUnit: UnitNormalizer.getCanonicalUnitForKey(canonicalKey)
      };
    }

    // Extract embedded number and unit if string
    const extracted = UnitNormalizer.extractNumberAndUnit(rawValue);
    const num = extracted.value;
    const detectedUnit = extracted.unit || (explicitUnit ? UnitNormalizer.standardizeUnit(explicitUnit) : null);

    if (num === null) {
      // Non-numeric value (text, enum, description)
      return {
        sourceValue: rawValue,
        sourceUnit: explicitUnit,
        normalizedValue: String(rawValue).trim(),
        normalizedUnit: "-"
      };
    }

    // Canonical unit for this property
    const canonicalUnit = UnitNormalizer.getCanonicalUnitForKey(canonicalKey);

    // 1. DENSITY PROPERTIES (kg/m³)
    if (["density", "ssdDensity", "bulkDensity"].includes(canonicalKey)) {
      if (detectedUnit === "g/cm³" || (num >= 0.5 && num <= 4.0 && !detectedUnit)) {
        // e.g. 2.65 g/cm³ -> 2650 kg/m³
        return {
          sourceValue: rawValue,
          sourceUnit: detectedUnit || "g/cm³",
          normalizedValue: Math.round(num * 1000 * 10) / 10,
          normalizedUnit: "kg/m³",
          conversionFactor: 1000,
          conversionNotes: "Converted from g/cm³ or Specific Gravity to kg/m³ (x1000)"
        };
      }
      return {
        sourceValue: rawValue,
        sourceUnit: detectedUnit || "kg/m³",
        normalizedValue: num,
        normalizedUnit: "kg/m³",
        conversionFactor: 1
      };
    }

    // 2. SPECIFIC GRAVITY (Dimensionless, e.g. 2.65)
    if (canonicalKey === "specificGravity") {
      if (detectedUnit === "kg/m³" || (num >= 800 && num <= 4500 && !detectedUnit)) {
        // e.g. 2650 kg/m³ -> 2.65
        const sg = Math.round((num / 1000) * 1000) / 1000;
        return {
          sourceValue: rawValue,
          sourceUnit: detectedUnit || "kg/m³",
          normalizedValue: sg,
          normalizedUnit: "-",
          conversionFactor: 0.001,
          conversionNotes: "Converted from absolute density kg/m³ to relative density (-)"
        };
      }
      return {
        sourceValue: rawValue,
        sourceUnit: detectedUnit || "-",
        normalizedValue: num,
        normalizedUnit: "-",
        conversionFactor: 1
      };
    }

    // 3. PERCENTAGES (%, e.g., absorption, moisture, sandEquivalent, losAngeles, dosage)
    if (["absorption", "moisture", "SandEquivalent", "sandEquivalent", "LosAngeles", "losAngeles", "recommendedDosage", "waterReduction", "pozzolanicIndex", "aspectRatio"].includes(canonicalKey)) {
      // If entered as ratio e.g. 0.015 instead of 1.5% for absorption or moisture
      if ((canonicalKey === "absorption" || canonicalKey === "moisture") && num > 0 && num < 0.25 && !detectedUnit) {
        return {
          sourceValue: rawValue,
          sourceUnit: "ratio",
          normalizedValue: Math.round(num * 100 * 100) / 100,
          normalizedUnit: "%",
          conversionFactor: 100,
          conversionNotes: "Detected fraction/ratio (< 0.25), normalized to percentage (x100)"
        };
      }
      return {
        sourceValue: rawValue,
        sourceUnit: detectedUnit || "%",
        normalizedValue: num,
        normalizedUnit: "%",
        conversionFactor: 1
      };
    }

    // 4. STRENGTH & PRESSURE (MPa)
    if (["strengthClass", "strength28d", "tensileStrength"].includes(canonicalKey)) {
      if (detectedUnit === "bar") {
        return {
          sourceValue: rawValue,
          sourceUnit: "bar",
          normalizedValue: Math.round(num * 0.1 * 10) / 10,
          normalizedUnit: "MPa",
          conversionFactor: 0.1,
          conversionNotes: "Converted bar to MPa (x0.1)"
        };
      }
      return {
        sourceValue: rawValue,
        sourceUnit: detectedUnit || "MPa",
        normalizedValue: num,
        normalizedUnit: "MPa",
        conversionFactor: 1
      };
    }

    // 5. LENGTH & SIEVE (mm)
    if (["dMax", "finenessModulus", "fiberLength"].includes(canonicalKey)) {
      if (detectedUnit === "µm" || detectedUnit === "um") {
        return {
          sourceValue: rawValue,
          sourceUnit: detectedUnit,
          normalizedValue: Math.round((num / 1000) * 1000) / 1000,
          normalizedUnit: "mm",
          conversionFactor: 0.001,
          conversionNotes: "Converted µm to mm (/1000)"
        };
      }
      if (detectedUnit === "cm") {
        return {
          sourceValue: rawValue,
          sourceUnit: "cm",
          normalizedValue: Math.round(num * 10 * 10) / 10,
          normalizedUnit: "mm",
          conversionFactor: 10,
          conversionNotes: "Converted cm to mm (x10)"
        };
      }
      return {
        sourceValue: rawValue,
        sourceUnit: detectedUnit || (canonicalKey === "finenessModulus" ? "-" : "mm"),
        normalizedValue: num,
        normalizedUnit: canonicalKey === "finenessModulus" ? "-" : "mm",
        conversionFactor: 1
      };
    }

    // Default fallback
    return {
      sourceValue: rawValue,
      sourceUnit: detectedUnit || canonicalUnit,
      normalizedValue: num,
      normalizedUnit: canonicalUnit,
      conversionFactor: 1
    };
  }

  public static getCanonicalUnitForKey(key: string): string {
    switch (key) {
      case "density":
      case "ssdDensity":
      case "bulkDensity":
        return "kg/m³";
      case "specificGravity":
      case "finenessModulus":
      case "pH":
        return "-";
      case "absorption":
      case "moisture":
      case "SandEquivalent":
      case "LosAngeles":
      case "waterReduction":
      case "pozzolanicIndex":
      case "recommendedDosage":
        return "%";
      case "dMax":
      case "fiberLength":
        return "mm";
      case "strength28d":
      case "tensileStrength":
        return "MPa";
      case "chlorides":
      case "sulfates":
        return "mg/L";
      case "price":
        return "DZD/kg";
      default:
        return "-";
    }
  }
}
