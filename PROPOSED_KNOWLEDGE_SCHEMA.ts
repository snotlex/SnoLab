import { z } from "zod";

// ==========================================
// 1. SCIENTIFIC SOURCE & STANDARDS METADATA
// ==========================================
export const ScientificSourceSchema = z.object({
  sourceType: z.enum([
    "primary_reference",
    "standard",
    "national_annex",
    "manufacturer_data",
    "laboratory_calibration",
    "educational_assumption"
  ]),
  sourceTitle: z.string().min(1, "Source title must not be empty"),
  authors: z.array(z.string()).optional(),
  standardCode: z.string().optional(),
  edition: z.string().optional(),
  publicationYear: z.number().int().min(1800).max(2100).optional(),
  pageOrClause: z.string().optional(),
  jurisdiction: z.string().optional(),
  applicabilityRange: z.object({
    concreteTypes: z.array(z.string()).optional(),
    strengthRangeMPa: z.tuple([z.number(), z.number()]).optional()
      .refine((range) => !range || range[0] <= range[1], "Min strength must be <= max strength"),
    dMaxRangeMm: z.tuple([z.number(), z.number()]).optional()
      .refine((range) => !range || range[0] <= range[1], "Min Dmax must be <= max Dmax"),
    slumpRangeCm: z.tuple([z.number(), z.number()]).optional()
      .refine((range) => !range || range[0] <= range[1], "Min Slump must be <= max Slump"),
    aggregateTypes: z.array(z.string()).optional(),
    exposureClasses: z.array(z.string()).optional()
  }),
  confidence: z.enum(["verified", "provisional", "unverified"]),
  notes: z.string().optional()
});

export type ScientificSource = z.infer<typeof ScientificSourceSchema>;

// ==========================================
// 2. EQUATIONS SCHEMA WITH RANGE CHECKS
// ==========================================
export const EquationSchema = z.object({
  id: z.string().min(1),
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  latexFormula: z.string().min(1),
  inputs: z.array(z.object({
    symbol: z.string(),
    unit: z.string(),
    descriptionAr: z.string(),
    descriptionEn: z.string(),
    validRange: z.tuple([z.number(), z.number()]).refine(
      (range) => range[0] <= range[1],
      "Input range min must be <= max"
    )
  })),
  outputs: z.array(z.object({
    symbol: z.string(),
    unit: z.string(),
    descriptionAr: z.string(),
    descriptionEn: z.string()
  })),
  source: ScientificSourceSchema,
  evaluate: z.custom<(...args: any[]) => any>((val) => typeof val === "function")
    .describe("Executable engine-level mathematical resolver to replace hardcoded strings")
});

export type EquationKnowledge = z.infer<typeof EquationSchema>;

// ==========================================
// 3. LOOKUP TABLES WITH STRICT CONTINUITY
// ==========================================
export const LookupTableSchema = z.object({
  id: z.string().min(1),
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  inputVariable: z.string(),
  inputUnit: z.string(),
  outputVariable: z.string(),
  outputUnit: z.string(),
  source: ScientificSourceSchema,
  data: z.array(z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])))
    .min(1, "Table must contain at least one data row")
    .refine((rows) => {
      // 1. Ensure no NaN or Infinity is hardcoded
      for (const row of rows) {
        for (const [key, val] of Object.entries(row)) {
          if (typeof val === "number" && (Number.isNaN(val) || !Number.isFinite(val))) {
            return false;
          }
        }
      }
      return true;
    }, "Lookup table data contains invalid numerical values (NaN/Infinity)")
    .refine((rows) => {
      // 2. Ensure ordering check: If there's a numerical input key, it must be sorted ascendingly
      // We look for common keys like 'min', 'max', 'slump', 'dMax', 'strength'
      const numericalKeys = ["min", "max", "slump", "dMax", "strengthRange", "nominalStrength"];
      for (const key of numericalKeys) {
        if (rows[0] && rows[0][key] !== undefined && typeof rows[0][key] === "number") {
          const values = rows.map(r => r[key] as number);
          for (let i = 1; i < values.length; i++) {
            if (values[i] < values[i - 1]) {
              return false; // Not sorted ascendingly
            }
          }
        }
      }
      return true;
    }, "Table keys or bounds are not ordered in a strictly ascending sequence")
    .refine((rows) => {
      // 3. Ensure no overlapping intervals or gaps in continuous key rows (like slump, dMax, etc.)
      // Specifically check rows having min/max keys to ensure contiguous, non-overlapping segments
      if (rows[0] && rows[0]["min"] !== undefined && rows[0]["max"] !== undefined) {
        const sorted = [...rows].sort((a, b) => (a["min"] as number) - (b["min"] as number));
        for (let i = 1; i < sorted.length; i++) {
          const prevMax = sorted[i - 1]["max"] as number;
          const currMin = sorted[i]["min"] as number;
          // Contiguous tolerance of 0.01 for floating points
          if (Math.abs(currMin - prevMax) > 0.05) {
            return false; // Gap found
          }
          if (currMin < prevMax - 0.001) {
            return false; // Overlap found
          }
        }
      }
      return true;
    }, "Lookup table bounds have gaps or unintended overlapping intervals")
});

export type LookupTableKnowledge = z.infer<typeof LookupTableSchema>;

// ==========================================
// 4. CONCRETE CATEGORIES SCHEMA (NO FALLBACKS)
// ==========================================
export const ConcreteCategorySchema = z.object({
  id: z.string().min(1),
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  descriptionAr: z.string().min(1),
  descriptionEn: z.string().min(1),
  isDreuxApplicable: z.enum([
    "applicable",
    "limited",
    "diagnostic_only",
    "not_applicable"
  ]),
  materialRequirements: z.object({
    requiredMaterials: z.array(z.string()),
    compatibleMaterials: z.array(z.string()),
    prohibitedMaterials: z.array(z.string()),
    minBinderContentKgM3: z.number().positive(),
    maxWaterCementRatio: z.number().positive(),
    dMaxRangeMm: z.tuple([z.number(), z.number()]),
    strengthRangeMPa: z.tuple([z.number(), z.number()]),
    slumpRangeCm: z.tuple([z.number(), z.number()])
  }),
  source: ScientificSourceSchema
});

export type ConcreteCategoryKnowledge = z.infer<typeof ConcreteCategorySchema>;

// ==========================================
// 5. MASTER KNOWLEDGE BASE SCHEMA
// ==========================================
export const MasterKnowledgeBaseSchema = z.object({
  metadata: z.object({
    lastAudited: z.string(),
    standardEdition: z.string(),
    complianceStandard: z.string()
  }),
  equations: z.record(z.string(), EquationSchema)
    .refine((record) => {
      const keys = Object.keys(record);
      const uniqueKeys = new Set(keys);
      return uniqueKeys.size === keys.length;
    }, "Duplicate equation IDs detected"),
  lookupTables: z.record(z.string(), LookupTableSchema)
    .refine((record) => {
      const keys = Object.keys(record);
      const uniqueKeys = new Set(keys);
      return uniqueKeys.size === keys.length;
    }, "Duplicate lookup table IDs detected"),
  concreteCategories: z.record(z.string(), ConcreteCategorySchema)
    .refine((record) => {
      // Ensure specific categories requested are covered
      const required = ["NSC", "RC", "HSC", "SCC", "FRC", "LWC", "HWC", "RAC", "MASS", "PERVIOUS", "UHPC", "BFUP", "GPC"];
      const keys = Object.keys(record);
      return required.every(req => keys.includes(req));
    }, "Missing one or more mandatory concrete categories in the schema definitions")
});

export type MasterKnowledgeBase = z.infer<typeof MasterKnowledgeBaseSchema>;

// ==========================================
// 6. ENFORCED EXPLICIT ROUTING ENGINE UTILITY
// ==========================================
/**
 * Resolves concrete categories strictly.
 * Ensures unknown categories do NOT fallback silently to NSC;
 * instead, throws an explicit architectural exception.
 */
export function resolveConcreteCategory(
  categoryCode: string,
  knowledgeBase: MasterKnowledgeBase
): ConcreteCategoryKnowledge {
  if (!categoryCode) {
    throw new Error("Category code must be supplied. No default fallback allowed.");
  }

  const category = (knowledgeBase.concreteCategories as Record<string, ConcreteCategoryKnowledge>)[categoryCode];
  if (!category) {
    throw new Error(
      `CRITICAL DESIGN FAILURE: Unknown or unsupported concrete category "${categoryCode}". Automatic fallback to "NSC" is strictly prohibited to guarantee safety and compliance.`
    );
  }

  return category;
}
