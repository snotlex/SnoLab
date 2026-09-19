export type LaboratoryUnit =
  | "mg" | "g" | "kg"
  | "mm" | "cm" | "m"
  | "mm2" | "cm2" | "m2"
  | "cm3" | "ml" | "l" | "m3"
  | "pa" | "kpa" | "mpa"
  | "n" | "kn"
  | "g/cm3" | "kg/m3"
  | "%";

const FACTORS: Partial<Record<LaboratoryUnit, { dimension: string; toBase: number }>> = {
  mg: { dimension: "mass", toBase: 0.000001 }, g: { dimension: "mass", toBase: 0.001 }, kg: { dimension: "mass", toBase: 1 },
  mm: { dimension: "length", toBase: 0.001 }, cm: { dimension: "length", toBase: 0.01 }, m: { dimension: "length", toBase: 1 },
  mm2: { dimension: "area", toBase: 0.000001 }, cm2: { dimension: "area", toBase: 0.0001 }, m2: { dimension: "area", toBase: 1 },
  cm3: { dimension: "volume", toBase: 0.000001 }, ml: { dimension: "volume", toBase: 0.000001 }, l: { dimension: "volume", toBase: 0.001 }, m3: { dimension: "volume", toBase: 1 },
  pa: { dimension: "pressure", toBase: 1 }, kpa: { dimension: "pressure", toBase: 1000 }, mpa: { dimension: "pressure", toBase: 1000000 },
  n: { dimension: "force", toBase: 1 }, kn: { dimension: "force", toBase: 1000 },
  "%": { dimension: "ratio", toBase: 1 }
};

export class UnitConversionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnitConversionError";
  }
}

export function convertLaboratoryUnit(value: number, from: LaboratoryUnit, to: LaboratoryUnit): number {
  if (!Number.isFinite(value)) throw new UnitConversionError("Unit conversion requires a finite numeric value.");
  if (from === to) return value;
  if (from === "g/cm3" && to === "kg/m3") return value * 1000;
  if (from === "kg/m3" && to === "g/cm3") return value / 1000;
  const fromDef = FACTORS[from];
  const toDef = FACTORS[to];
  if (!fromDef || !toDef || fromDef.dimension !== toDef.dimension) {
    throw new UnitConversionError(`Cannot convert ${from} to ${to}: dimensions are incompatible.`);
  }
  return (value * fromDef.toBase) / toDef.toBase;
}

export function assertLaboratoryUnit(value: number, unit: LaboratoryUnit, expectedDimension?: string): void {
  if (!Number.isFinite(value)) throw new UnitConversionError("Value must be finite.");
  const definition = FACTORS[unit];
  if (!definition) throw new UnitConversionError(`Unsupported laboratory unit: ${unit}.`);
  if (expectedDimension && definition.dimension !== expectedDimension) {
    throw new UnitConversionError(`Unit ${unit} does not match expected dimension ${expectedDimension}.`);
  }
}
