import type { LabCategory, LabTestDefinition, MaterialTestRecord } from "../types/laboratoryTypes";
import type { LaboratoryDomainId } from "../types/laboratoryDomain";

export type LaboratoryMaturity = "implemented" | "verified" | "planned" | "not_configured";
export type LaboratoryPortalTab = "catalog" | "samples" | "sessions" | "results" | "equipment";

export interface LaboratoryDomainDefinition {
  id: LaboratoryDomainId;
  label: { ar: string; en: string; fr: string };
  shortLabel: { ar: string; en: string; fr: string };
  description: { ar: string; en: string; fr: string };
  accent: string;
  icon: string;
  categories: string[];
  plannedTests: Array<{ id: string; title: { ar: string; en: string; fr: string }; category: string; maturity: LaboratoryMaturity; specimen: string; note: string }>;
}

export const LABORATORY_DOMAINS: readonly LaboratoryDomainDefinition[] = [
  {
    id: "civil_materials",
    label: { ar: "\u0645\u062e\u062a\u0628\u0631 \u0645\u0648\u0627\u062f \u0627\u0644\u0647\u0646\u062f\u0633\u0629 \u0627\u0644\u0645\u062f\u0646\u064a\u0629", en: "Civil Engineering Materials", fr: "Matériaux de génie civil" },
    shortLabel: { ar: "\u0645\u0648\u0627\u062f \u0645\u062f\u0646\u064a\u0629", en: "Civil materials", fr: "Matériaux civils" },
    description: { ar: "\u0631\u0643\u0627\u0645\u060c \u0625\u0633\u0645\u0646\u062a\u060c \u0645\u0627\u0621\u060c \u0625\u0636\u0627\u0641\u0627\u062a\u060c \u0623\u0644\u064a\u0627\u0641\u060c \u0648\u062e\u0631\u0633\u0627\u0646\u0629 \u0645\u062a\u0635\u0644\u062f\u0629 \u0636\u0645\u0646 \u0627\u0644\u0643\u062a\u0627\u0644\u0648\u062c \u0627\u0644\u062d\u0627\u0644\u064a.", en: "Aggregates, cement, water, admixtures, fibers and hardened concrete in the current catalog.", fr: "Granulats, ciment, eau, adjuvants, fibres et béton durci du catalogue actuel." },
    accent: "#2563eb",
    icon: "◈",
    categories: ["aggregates", "cement", "water", "admixtures", "additives", "fibers"],
    plannedTests: []
  },
  {
    id: "geotechnical",
    label: { ar: "\u0627\u0644\u0645\u062e\u062a\u0628\u0631 \u0627\u0644\u062c\u064a\u0648\u062a\u0642\u0646\u064a", en: "Geotechnical Laboratory", fr: "Laboratoire géotechnique" },
    shortLabel: { ar: "\u062c\u064a\u0648\u062a\u0642\u0646\u064a", en: "Geotechnical", fr: "Géotechnique" },
    description: { ar: "\u062a\u0639\u0631\u064a\u0641 \u0648\u062a\u0635\u0646\u064a\u0641 \u0627\u0644\u062a\u0631\u0628\u0629\u060c \u0627\u0644\u062f\u0645\u0643 \u0648\u0627\u0644\u062a\u062d\u0645\u0644\u060c \u0627\u0644\u0645\u0642\u0627\u0648\u0645\u0629\u060c \u0627\u0644\u0627\u0646\u0636\u063a\u0627\u0637 \u0648\u0627\u0644\u0646\u0641\u0627\u0630\u064a\u0629.", en: "Soil identification, compaction, bearing, strength, consolidation and permeability.", fr: "Identification, compactage, portance, résistance, consolidation et perméabilité des sols." },
    accent: "#7c3aed",
    icon: "◇",
    categories: ["identification", "physical", "compaction", "strength", "consolidation", "permeability", "rock"],
    plannedTests: [
      ["GT_SIEVE_SOIL", "\u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0645\u0646\u062e\u0644\u064a \u0644\u0644\u062a\u0631\u0628\u0629", "Soil sieve analysis", "Analyse granulométrique des sols", "identification", "\u062a\u0631\u0628\u0629", "\u064a\u062a\u0637\u0644\u0628 \u062a\u0639\u0631\u064a\u0641 \u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u062a\u0631\u0628\u0629 \u0648\u0645\u062f\u062e\u0644\u0627\u062a\u0647\u0627 \u0642\u0628\u0644 \u0627\u0644\u062a\u0634\u063a\u064a\u0644"],
      ["GT_HYDROMETER", "\u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u0628\u0627\u0644\u0647\u064a\u062f\u0631\u0648\u0645\u062a\u0631", "Soil hydrometer analysis", "Analyse hydrométrique", "identification", "\u062a\u0631\u0628\u0629 \u0646\u0627\u0639\u0645\u0629", "planned — \u0644\u0627 \u064a\u0648\u062c\u062f \u0645\u062d\u0631\u0643 \u0645\u0648\u0635\u0648\u0644 \u0628\u0639\u062f"],
      ["GT_ATTERBERG", "\u062d\u062f\u0648\u062f \u0623\u062a\u0631\u0628\u0631\u063a", "Atterberg limits", "Limites d’Atterberg", "identification", "\u062a\u0631\u0628\u0629 \u0645\u062a\u0645\u0627\u0633\u0643\u0629", "planned — \u0644\u0627 \u062a\u0639\u0631\u0636 \u062a\u0635\u0646\u064a\u0641\u064b\u0627 \u062a\u0644\u0642\u0627\u0626\u064a\u064b\u0627"],
      ["GT_PROCTOR", "\u0627\u062e\u062a\u0628\u0627\u0631 \u0628\u0631\u0648\u0643\u062a\u0648\u0631 \u0627\u0644\u0642\u064a\u0627\u0633\u064a/\u0627\u0644\u0645\u0639\u062f\u0644", "Standard/modified Proctor", "Proctor normal/modifié", "compaction", "\u062a\u0631\u0628\u0629", "planned — \u0645\u0646\u062d\u0646\u0649 \u0627\u0644\u0631\u0637\u0648\u0628\u0629 \u0648\u0627\u0644\u0643\u062b\u0627\u0641\u0629 \u064a\u062d\u062a\u0627\u062c \u0637\u0631\u064a\u0642\u0629 \u0645\u062e\u062a\u0627\u0631\u0629"],
      ["GT_CBR", "\u0646\u0633\u0628\u0629 \u0627\u0644\u062a\u062d\u0645\u0644 CBR", "CBR", "CBR", "compaction", "\u062a\u0631\u0628\u0629 \u0645\u062f\u0645\u0648\u0643\u0629", "planned — \u064a\u0633\u062c\u0644 \u0627\u0644\u0646\u0642\u0639 \u0648\u0627\u0644\u0627\u0646\u062a\u0641\u0627\u062e \u0642\u0628\u0644 \u0627\u0639\u062a\u0645\u0627\u062f \u0627\u0644\u0637\u0631\u064a\u0642\u0629"],
      ["GT_DIRECT_SHEAR", "\u0627\u0644\u0642\u0635 \u0627\u0644\u0645\u0628\u0627\u0634\u0631", "Direct shear", "Cis direct", "strength", "\u062a\u0631\u0628\u0629", "planned — \u0644\u0627 \u062a\u0648\u062c\u062f \u062d\u062f\u0648\u062f \u0642\u0628\u0648\u0644 \u0639\u0627\u0645\u0629"],
      ["GT_PERMEABILITY", "\u0646\u0641\u0627\u0630\u064a\u0629 \u0627\u0644\u0631\u0623\u0633 \u0627\u0644\u062b\u0627\u0628\u062a/\u0627\u0644\u0645\u062a\u0646\u0627\u0642\u0635", "Constant/falling head permeability", "Perméabilité à charge constante/décroissante", "permeability", "\u062a\u0631\u0628\u0629", "planned — \u064a\u0644\u0632\u0645 \u0627\u062a\u062c\u0627\u0647 \u0627\u0644\u062a\u062f\u0641\u0642 \u0648\u062f\u0631\u062c\u0629 \u0627\u0644\u062d\u0631\u0627\u0631\u0629"]
    ].map(([id, ar, en, fr, category, specimen, note]) => ({ id, title: { ar, en, fr }, category, maturity: ["GT_SIEVE_SOIL", "GT_PROCTOR"].includes(id) ? "implemented" : "planned", specimen, note }))
  },
  {
    id: "fresh_concrete",
    label: { ar: "\u0645\u062e\u062a\u0628\u0631 \u0627\u0644\u062e\u0631\u0633\u0627\u0646\u0629 \u0627\u0644\u0637\u0627\u0632\u062c\u0629", en: "Fresh Concrete Laboratory", fr: "Laboratoire du béton frais" },
    shortLabel: { ar: "\u062e\u0631\u0633\u0627\u0646\u0629 \u0637\u0627\u0632\u062c\u0629", en: "Fresh concrete", fr: "Béton frais" },
    description: { ar: "\u0647\u0648\u064a\u0629 \u0627\u0644\u062e\u0644\u0637\u0629 \u0648\u0627\u0644\u062f\u0641\u0639\u0629 \u0648\u0645\u0648\u0642\u0639 \u0627\u0644\u0635\u0628\u060c \u0627\u0644\u0642\u0648\u0627\u0645\u060c \u0627\u0644\u062d\u0631\u0627\u0631\u0629\u060c \u0627\u0644\u0647\u0648\u0627\u0621 \u0648\u0627\u0644\u0643\u062b\u0627\u0641\u0629 \u0648\u0627\u0644\u062a\u062c\u0627\u0646\u0633.", en: "Mix/batch identity, placement context, workability, temperature, air, density and uniformity.", fr: "Identité de gâchée, contexte de coulage, ouvrabilité, température, air, masse volumique et homogénéité." },
    accent: "#ea580c",
    icon: "▱",
    categories: ["identity", "workability", "fresh_properties", "scc"],
    plannedTests: [
      ["FC_SLUMP", "\u0627\u062e\u062a\u0628\u0627\u0631 \u0627\u0644\u0647\u0628\u0648\u0637", "Slump", "Affaissement", "workability", "\u062e\u0631\u0633\u0627\u0646\u0629 \u0637\u0627\u0632\u062c\u0629", "planned — \u064a\u062c\u0628 \u0631\u0628\u0637 \u0627\u0644\u062e\u0644\u0637\u0629 \u0648\u0627\u0644\u062f\u0641\u0639\u0629 \u0648\u0648\u0642\u062a \u0627\u0644\u0642\u064a\u0627\u0633"],
      ["FC_SLUMP_FLOW", "\u0627\u0646\u062a\u0634\u0627\u0631 \u0627\u0644\u0647\u0628\u0648\u0637 \u0648T500", "Slump flow and T500", "Étalement et T500", "workability", "\u062e\u0631\u0633\u0627\u0646\u0629 \u0630\u0627\u062a\u064a\u0629 \u0627\u0644\u062f\u0645\u0643", "planned — \u0645\u062c\u0645\u0648\u0639\u0629 \u0642\u064a\u0627\u0633\u0627\u062a \u0632\u0645\u0646\u064a\u0629 \u0648\u0644\u064a\u0633\u062a \u0642\u064a\u0645\u0629 \u0648\u062d\u064a\u062f\u0629"],
      ["FC_TEMPERATURE", "\u062f\u0631\u062c\u0629 \u062d\u0631\u0627\u0631\u0629 \u0627\u0644\u062e\u0631\u0633\u0627\u0646\u0629 \u0627\u0644\u0637\u0627\u0632\u062c\u0629", "Fresh concrete temperature", "Température du béton frais", "fresh_properties", "\u062e\u0631\u0633\u0627\u0646\u0629 \u0637\u0627\u0632\u062c\u0629", "planned — \u064a\u0633\u062c\u0644 \u062d\u0631\u0627\u0631\u0629 \u0627\u0644\u062c\u0648 \u0648\u0627\u0644\u062e\u0631\u0633\u0627\u0646\u0629"],
      ["FC_AIR_CONTENT", "\u0645\u062d\u062a\u0648\u0649 \u0627\u0644\u0647\u0648\u0627\u0621", "Air content", "Teneur en air", "fresh_properties", "\u062e\u0631\u0633\u0627\u0646\u0629 \u0637\u0627\u0632\u062c\u0629", "planned — \u0627\u0644\u0637\u0631\u064a\u0642\u0629 \u0648\u0627\u0644\u062c\u0647\u0627\u0632 \u063a\u064a\u0631 \u0645\u0647\u064a\u0626\u064a\u0646"],
      ["FC_DENSITY_YIELD", "\u0627\u0644\u0643\u062b\u0627\u0641\u0629 \u0648\u0627\u0644\u0639\u0627\u0626\u062f/\u0627\u0644\u0645\u0631\u062f\u0648\u062f", "Density and yield", "Masse volumique et rendement", "fresh_properties", "\u062e\u0631\u0633\u0627\u0646\u0629 \u0637\u0627\u0632\u062c\u0629", "planned — \u0644\u0627 \u062a\u0633\u062a\u062e\u062f\u0645 \u0643\u062b\u0627\u0641\u0629 \u0627\u0644\u0631\u0643\u0627\u0645 \u0643\u0628\u062f\u064a\u0644"],
      ["FC_BLEEDING", "\u0627\u0644\u0646\u0632\u0641 \u0648\u0645\u0639\u062f\u0644 \u0627\u0644\u0646\u0632\u0641", "Bleeding rate", "Ressuage", "fresh_properties", "\u062e\u0631\u0633\u0627\u0646\u0629 \u0637\u0627\u0632\u062c\u0629", "planned — \u064a\u0644\u0632\u0645 \u0633\u062c\u0644 \u0632\u0645\u0646\u064a \u0644\u0644\u062d\u062c\u0645"],
      ["FC_SCC_JRING", "\u0627\u062e\u062a\u0628\u0627\u0631 J-Ring", "J-Ring", "J-Ring", "scc", "\u062e\u0631\u0633\u0627\u0646\u0629 \u0630\u0627\u062a\u064a\u0629 \u0627\u0644\u062f\u0645\u0643", "planned — \u0637\u0631\u064a\u0642\u0629 \u0645\u062e\u062a\u0627\u0631\u0629 \u063a\u064a\u0631 \u0645\u0648\u0635\u0648\u0644\u0629"]
    ].map(([id, ar, en, fr, category, specimen, note]) => ({ id, title: { ar, en, fr }, category, maturity: ["FC_TEMPERATURE", "FC_SLUMP"].includes(id) ? "implemented" : "planned", specimen, note }))
  }
];

export function getLaboratoryDomain(domainId: LaboratoryDomainId): LaboratoryDomainDefinition {
  return LABORATORY_DOMAINS.find(domain => domain.id === domainId) || LABORATORY_DOMAINS[0];
}

export function inferLaboratoryDomain(value: Pick<MaterialTestRecord, "domainId" | "laboratoryArea" | "category"> | { domainId?: LaboratoryDomainId; category?: string }): LaboratoryDomainId {
  if (value.domainId) return value.domainId;
  return "civil_materials";
}

export function catalogDefinitionDomain(definition: Pick<LabTestDefinition, "domainId" | "laboratoryArea">): LaboratoryDomainId {
  return definition.domainId || "civil_materials";
}
