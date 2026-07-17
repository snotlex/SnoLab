/**
 * Central Engineering Unit Formatter - 100% Metric-only (SI System)
 */

export type QuantityType =
  | "mass"                    // kg/m³ or kg (for total batch weight based on context)
  | "absoluteMass"            // always kg
  | "massPerConcreteVolume"   // always kg/m³
  | "waterVolume"             // L/m³ or L (for total water based on context)
  | "waterPerConcreteVolume"  // always L/m³
  | "concreteVolume"          // m³
  | "strength"                // MPa
  | "aggregateSize"           // mm
  | "density"                 // kg/m³
  | "cost"                    // plain currency label
  | "ratio";                  // water-cement ratio (dimensionless)

/**
 * Centrally formats engineering values based on metric/SI quantity types.
 * All non-metric conversions have been completely removed.
 */
export function formatEngineeringValue(
  value: number,
  quantityType: QuantityType,
  options?: {
    decimals?: number;
    includeUnit?: boolean;
    batchVolumeMultiplier?: number; // if set, gets the total batch weight/volume instead of per-m³
  }
): string {
  if (value === undefined || value === null || isNaN(value)) {
    return "-";
  }

  const decimals = options?.decimals !== undefined 
    ? options.decimals 
    : (quantityType === "waterVolume" || quantityType === "waterPerConcreteVolume" || quantityType === "aggregateSize" || quantityType === "concreteVolume" || quantityType === "strength"
       ? 1 
       : quantityType === "ratio"
         ? 2
         : 0);
  const includeUnit = options?.includeUnit !== undefined ? options.includeUnit : true;
  const multiplier = options?.batchVolumeMultiplier ?? 1;

  let converted = value * multiplier;
  let unit = "";

  switch (quantityType) {
    case "mass":
      unit = options?.batchVolumeMultiplier !== undefined ? "kg" : "kg/m³";
      break;

    case "absoluteMass":
      unit = "kg";
      break;

    case "massPerConcreteVolume":
      unit = "kg/m³";
      break;

    case "density":
      unit = "kg/m³";
      break;

    case "waterVolume":
      unit = options?.batchVolumeMultiplier !== undefined ? "L" : "L/m³";
      break;

    case "waterPerConcreteVolume":
      unit = "L/m³";
      break;

    case "concreteVolume":
      unit = "m³";
      break;

    case "strength":
      unit = "MPa";
      // strength shouldn't be multiplied by batch volume
      converted = value;
      break;

    case "aggregateSize":
      unit = "mm";
      // aggregate size shouldn't be multiplied by batch volume
      converted = value;
      break;

    case "cost":
      unit = "";
      break;

    case "ratio":
      unit = "";
      // W/C ratio shouldn't be multiplied by batch volume
      converted = value;
      break;
  }

  const formattedNum = parseFloat(converted.toFixed(decimals)).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });

  return includeUnit && unit ? `${formattedNum} ${unit}` : formattedNum;
}
