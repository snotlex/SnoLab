import type { LabCategory, LabTestDefinition, MaterialTestRecord } from "../types/laboratoryTypes";
import type { LaboratoryDomainId } from "../types/laboratoryDomain";
import type { LaboratorySession } from "../types/laboratorySessionTypes";
import { OFFICIAL_CONCRETE_TEST_REGISTRY } from "./concreteLaboratoryRegistry";

export type LaboratoryMaturity = "implemented" | "verified" | "planned" | "not_configured";
export type LaboratoryPortalTab = "catalog" | "samples" | "sessions" | "results" | "equipment";
export type LaboratoryWorkspaceId = "civil_materials" | "geotechnical" | "concrete";

export interface LaboratoryWorkspaceDefinition {
  id: LaboratoryWorkspaceId;
  domainIds: readonly LaboratoryDomainId[];
  label: { ar: string; en: string; fr: string };
  description: { ar: string; en: string; fr: string };
  accent: string;
  icon: string;
}

export interface LaboratoryDomainDefinition {
  id: LaboratoryDomainId;
  label: { ar: string; en: string; fr: string };
  shortLabel: { ar: string; en: string; fr: string };
  description: { ar: string; en: string; fr: string };
  accent: string;
  icon: string;
  categories: string[];
  plannedTests: Array<{ id: string; title: { ar: string; en: string; fr: string }; category: string; maturity: LaboratoryMaturity; specimen: string; note: string; purpose?: { ar: string; en: string; fr: string } }>;
}

export const LABORATORY_DOMAINS: readonly LaboratoryDomainDefinition[] = [
  {
    id: "civil_materials",
    label: { ar: "\u0645\u062e\u062a\u0628\u0631 \u0645\u0648\u0627\u062f \u0627\u0644\u0647\u0646\u062f\u0633\u0629 \u0627\u0644\u0645\u062f\u0646\u064a\u0629", en: "Civil Engineering Materials", fr: "Matériaux de génie civil" },
    shortLabel: { ar: "\u0645\u0648\u0627\u062f \u0645\u062f\u0646\u064a\u0629", en: "Civil materials", fr: "Matériaux civils" },
    description: { ar: "\u0631\u0643\u0627\u0645\u060c \u0625\u0633\u0645\u0646\u062a\u060c \u0645\u0627\u0621\u060c \u0625\u0636\u0627\u0641\u0627\u062a \u0648\u0623\u0644\u064a\u0627\u0641 \u0645\u0648\u0627\u062f \u0627\u0644\u0628\u0646\u0627\u0621.", en: "Aggregate, cement, water, admixture and fiber material tests.", fr: "Essais des granulats, du ciment, de l'eau, des adjuvants et des fibres." },
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
      ["GT_ATTERBERG", "\u062d\u062f\u0648\u062f \u0623\u062a\u0631\u0628\u0631\u063a", "Atterberg limits", "Limites d’Atterberg", "identification", "\u062a\u0631\u0628\u0629 \u0645\u062a\u0645\u0627\u0633\u0643\u0629", "implemented — \u062a\u0634\u063a\u064a\u0644 \u062a\u0634\u062e\u064a\u0635\u064a \u0644\u0644\u0645\u062a\u0639\u062f\u062f \u0648PI \u062f\u0648\u0646 \u062a\u0635\u0646\u064a\u0641 \u0623\u0648 \u0642\u0628\u0648\u0644"],
      ["GT_PROCTOR", "\u0627\u062e\u062a\u0628\u0627\u0631 \u0628\u0631\u0648\u0643\u062a\u0648\u0631 \u0627\u0644\u0642\u064a\u0627\u0633\u064a/\u0627\u0644\u0645\u0639\u062f\u0644", "Standard/modified Proctor", "Proctor normal/modifié", "compaction", "\u062a\u0631\u0628\u0629", "planned — \u0645\u0646\u062d\u0646\u0649 \u0627\u0644\u0631\u0637\u0648\u0628\u0629 \u0648\u0627\u0644\u0643\u062b\u0627\u0641\u0629 \u064a\u062d\u062a\u0627\u062c \u0637\u0631\u064a\u0642\u0629 \u0645\u062e\u062a\u0627\u0631\u0629"],
      ["GT_CBR", "\u0646\u0633\u0628\u0629 \u0627\u0644\u062a\u062d\u0645\u0644 CBR", "CBR", "CBR", "strength", "\u062a\u0631\u0628\u0629 \u0645\u062f\u0645\u0648\u0643\u0629", "implemented — \u0646\u0633\u0628\u062a\u0627 2.54/5.08 mm \u0645\u0639 \u062a\u0648\u062b\u064a\u0642 \u0627\u0644\u0646\u0642\u0639 \u0648\u0627\u0644\u0627\u0646\u062a\u0641\u0627\u062e\u060c \u0644\u0627 \u064a\u062e\u062a\u0627\u0631 \u0642\u064a\u0645\u0629 \u0642\u0628\u0648\u0644"],
      ["GT_DIRECT_SHEAR", "\u0627\u0644\u0642\u0635 \u0627\u0644\u0645\u0628\u0627\u0634\u0631", "Direct shear", "Cis direct", "strength", "\u062a\u0631\u0628\u0629", "planned — \u0644\u0627 \u062a\u0648\u062c\u062f \u062d\u062f\u0648\u062f \u0642\u0628\u0648\u0644 \u0639\u0627\u0645\u0629"],
      ["GT_PERMEABILITY", "\u0646\u0641\u0627\u0630\u064a\u0629 \u0627\u0644\u0631\u0623\u0633 \u0627\u0644\u062b\u0627\u0628\u062a/\u0627\u0644\u0645\u062a\u0646\u0627\u0642\u0635", "Constant/falling head permeability", "Perméabilité à charge constante/décroissante", "permeability", "\u062a\u0631\u0628\u0629", "planned — \u064a\u0644\u0632\u0645 \u0627\u062a\u062c\u0627\u0647 \u0627\u0644\u062a\u062f\u0641\u0642 \u0648\u062f\u0631\u062c\u0629 \u0627\u0644\u062d\u0631\u0627\u0631\u0629"]
    ].map(([id, ar, en, fr, category, specimen, note]) => ({ id, title: { ar, en, fr }, category, maturity: ["GT_SIEVE_SOIL", "GT_PROCTOR", "GT_ATTERBERG", "GT_CBR"].includes(id) ? "implemented" : "planned", specimen, note }))
  },
  {
    id: "fresh_concrete",
    label: { ar: "مختبر الخرسانة الطازجة", en: "Fresh Concrete Laboratory", fr: "Laboratoire du béton frais" },
    shortLabel: { ar: "خرسانة طازجة", en: "Fresh concrete", fr: "Béton frais" },
    description: { ar: "اختبارات القوام والانتشار والاستقرار والكتلة الحجمية والهواء والحرارة والمردود للخرسانة قبل التصلب.", en: "Workability, flow, stability, density, air, temperature and yield before hardening.", fr: "Ouvrabilité, étalement, stabilité, masse volumique, air, température et rendement avant durcissement." },
    accent: "#ea580c",
    icon: "▱",
    categories: ["workability", "scc", "stability", "fresh_properties", "composition"],
    plannedTests: OFFICIAL_CONCRETE_TEST_REGISTRY.filter(test => test.domainId === "fresh_concrete")
  },
  {
    id: "hardened_concrete",
    label: { ar: "مختبر الخرسانة المتصلدة", en: "Hardened Concrete Laboratory", fr: "Laboratoire du béton durci" },
    shortLabel: { ar: "خرسانة متصلدة", en: "Hardened concrete", fr: "Béton durci" },
    description: { ar: "اختبارات المقاومة والخصائص الفيزيائية والمتانة والفحص غير المتلف والتحليل المجهري والكيميائي.", en: "Strength, physical properties, durability, NDT, microscopy and chemical analysis.", fr: "Résistance, propriétés physiques, durabilité, CND, microscopie et analyses chimiques." },
    accent: "#0f766e",
    icon: "▣",
    categories: ["mechanical", "physical", "durability", "ndt", "microchemical"],
    plannedTests: OFFICIAL_CONCRETE_TEST_REGISTRY.filter(test => test.domainId === "hardened_concrete")
  }
];

/**
 * User-facing laboratories. The concrete workspace deliberately groups the
 * existing fresh/hardened domain IDs instead of rewriting persisted IDs.
 */
export const LABORATORY_WORKSPACES: readonly LaboratoryWorkspaceDefinition[] = [
  {
    id: "civil_materials",
    domainIds: ["civil_materials"],
    label: { ar: "مختبر مواد الهندسة المدنية", en: "Civil Engineering Materials Laboratory", fr: "Laboratoire des matériaux de génie civil" },
    description: { ar: "اختبارات الإسمنت والركام والماء والإضافات والألياف ومواد البناء.", en: "Testing cement, aggregates, water, admixtures, fibers and construction materials.", fr: "Essais du ciment, des granulats, de l'eau, des adjuvants, des fibres et des matériaux de construction." },
    accent: "#2563eb",
    icon: "◈"
  },
  {
    id: "geotechnical",
    domainIds: ["geotechnical"],
    label: { ar: "مختبر الجيوتقني", en: "Geotechnical Laboratory", fr: "Laboratoire de géotechnique" },
    description: { ar: "اختبارات التربة والتعرف والدمك والمقاومة والنفاذية.", en: "Soil identification, compaction, strength and permeability testing.", fr: "Identification, compactage, résistance et perméabilité des sols." },
    accent: "#7c3aed",
    icon: "◇"
  },
  {
    id: "concrete",
    domainIds: ["fresh_concrete", "hardened_concrete"],
    label: { ar: "مختبر الخرسانة الطازجة والمتصلدة", en: "Fresh and Hardened Concrete Laboratory", fr: "Laboratoire du béton frais et durci" },
    description: { ar: "مختبر واحد بقسمين مستقلين: الخرسانة الطازجة والخرسانة المتصلدة.", en: "One laboratory with separate fresh-concrete and hardened-concrete sections.", fr: "Un laboratoire avec deux sections distinctes : béton frais et béton durci." },
    accent: "#0f766e",
    icon: "▣"
  }
];

export function getLaboratoryWorkspaceId(domainId: LaboratoryDomainId): LaboratoryWorkspaceId {
  return LABORATORY_WORKSPACES.find(workspace => workspace.domainIds.includes(domainId))?.id || "civil_materials";
}

export function getLaboratoryWorkspace(workspaceId: LaboratoryWorkspaceId): LaboratoryWorkspaceDefinition {
  return LABORATORY_WORKSPACES.find(workspace => workspace.id === workspaceId) || LABORATORY_WORKSPACES[0];
}

export function getLaboratoryDomain(domainId: LaboratoryDomainId): LaboratoryDomainDefinition {
  return LABORATORY_DOMAINS.find(domain => domain.id === domainId) || LABORATORY_DOMAINS[0];
}

export function inferLaboratoryDomain(value: { domainId?: LaboratoryDomainId; laboratoryArea?: "materials" | "concrete"; category?: string; testType?: string }): LaboratoryDomainId {
  if (value.domainId) return value.domainId;
  if (value.testType?.startsWith("FC_") || value.category === "workability" || value.category === "fresh_properties") return "fresh_concrete";
  if (value.testType?.startsWith("HC_") || value.category === "hardened_mechanical") return "hardened_concrete";
  return "civil_materials";
}

export function inferLaboratorySessionDomain(session: Pick<LaboratorySession, "domainId" | "tests">): LaboratoryDomainId | undefined {
  if (session.domainId) return session.domainId;
  if (!session.tests.length) return "civil_materials";
  const domains = new Set(session.tests.map(test => {
    if (test.domainId) return test.domainId;
    if (test.testType.startsWith("GT_")) return "geotechnical";
    if (test.testType.startsWith("FC_")) return "fresh_concrete";
    if (test.testType.startsWith("HC_")) return "hardened_concrete";
    return "civil_materials";
  }));
  return domains.size === 1 ? [...domains][0] : undefined;
}

export function catalogDefinitionDomain(definition: Pick<LabTestDefinition, "domainId" | "laboratoryArea">): LaboratoryDomainId {
  return definition.domainId || "civil_materials";
}
