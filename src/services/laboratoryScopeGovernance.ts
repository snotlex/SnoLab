import type { LabCategory, LabTestDefinition } from "../types/laboratoryTypes";

export type LaboratoryArea = "materials" | "concrete";
export type MaterialsLabSection =
  | "cementPhysical"
  | "cementMechanical"
  | "cementChemical"
  | "cementHydrationPozzolanicity"
  | "fineAggregateGranulometry"
  | "fineAggregatePhysical"
  | "fineAggregateFinesClay"
  | "fineAggregateShape"
  | "fineAggregateMechanical"
  | "fineAggregateChemical"
  | "fineAggregateDurability"
  | "fineAggregateReactivity"
  | "coarseAggregateGranulometry"
  | "coarseAggregatePhysical"
  | "coarseAggregateShape"
  | "coarseAggregateMechanical"
  | "coarseAggregateChemical"
  | "coarseAggregateDurability"
  | "coarseAggregateReactivity"
  | "admixtureCharacterization"
  | "admixturePerformanceQualification"
  | "mineralAdditions"
  | "mixingWater";
export type ConcreteLabSection =
  | "freshConcrete"
  | "scc"
  | "hardenedConcrete"
  | "deformation"
  | "durability"
  | "specialConcrete"
  | "inSituNdt";

export interface LaboratorySectionDefinition<TSection extends string> {
  id: TSection;
  area: LaboratoryArea;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
}

const materialSection = <T extends MaterialsLabSection>(definition: Omit<LaboratorySectionDefinition<T>, "area">): LaboratorySectionDefinition<T> => ({ ...definition, area: "materials" });
const concreteSection = <T extends ConcreteLabSection>(definition: Omit<LaboratorySectionDefinition<T>, "area">): LaboratorySectionDefinition<T> => ({ ...definition, area: "concrete" });

export const MATERIALS_LAB_SECTIONS: readonly LaboratorySectionDefinition<MaterialsLabSection>[] = [
  materialSection({ id: "cementPhysical", nameAr: "فيزيائية الإسمنت", nameFr: "Physique du ciment", nameEn: "Cement Physical", descriptionAr: "الكثافة والنعومة والقوام والشك والثبات الحجمي.", descriptionEn: "Density, fineness, consistency, setting and soundness." }),
  materialSection({ id: "cementMechanical", nameAr: "مقاومة الإسمنت", nameFr: "Résistance du ciment", nameEn: "Cement Strength", descriptionAr: "مقاومة المونة القياسية بالضغط والانحناء وتطورها مع العمر.", descriptionEn: "Standard mortar flexural and compressive strength development." }),
  materialSection({ id: "cementChemical", nameAr: "كيمياء الإسمنت", nameFr: "Chimie du ciment", nameEn: "Cement Chemical", descriptionAr: "الأكاسيد والكلوريدات والكبريتات والمكافئ القلوي وCr(VI).", descriptionEn: "Oxides, chlorides, sulfates, alkali equivalent and Cr(VI)." }),
  materialSection({ id: "cementHydrationPozzolanicity", nameAr: "إماهة وبوزولانية الإسمنت", nameFr: "Hydratation et pouzzolanicité", nameEn: "Hydration and Pozzolanicity", descriptionAr: "حرارة الإماهة والبوزولانية وتفاعل مكونات الإسمنت.", descriptionEn: "Heat of hydration, pozzolanicity and constituent reactivity." }),
  materialSection({ id: "fineAggregateGranulometry", nameAr: "تدرج الركام الناعم", nameFr: "Granulométrie des sables", nameEn: "Fine Aggregate Granulometry", descriptionAr: "التحليل المنخلي والتدرج والحشوات.", descriptionEn: "Sieve grading, particle-size distribution and filler grading." }),
  materialSection({ id: "fineAggregatePhysical", nameAr: "فيزيائية الركام الناعم", nameFr: "Physique des sables", nameEn: "Fine Aggregate Physical", descriptionAr: "الكثافة والرطوبة والامتصاص والفراغات.", descriptionEn: "Density, moisture, absorption and voids." }),
  materialSection({ id: "fineAggregateFinesClay", nameAr: "الناعم والطين", nameFr: "Fines et argile", nameEn: "Fines and Clay", descriptionAr: "المكافئ الرملي وأزرق الميثيلين وكتل الطين.", descriptionEn: "Sand equivalent, methylene blue and clay lumps." }),
  materialSection({ id: "fineAggregateShape", nameAr: "شكل الركام الناعم", nameFr: "Formes des granulats fins", nameEn: "Fine Aggregate Shape", descriptionAr: "معامل النعومة والشكل والأسطح المكسرة والقواقع.", descriptionEn: "Shape, crushed particles and shell content." }),
  materialSection({ id: "fineAggregateMechanical", nameAr: "ميكانيكية الركام الناعم", nameFr: "Mécanique des granulats fins", nameEn: "Fine Aggregate Mechanical", descriptionAr: "التفتت والتآكل عندما ينطبق الاختبار.", descriptionEn: "Fragmentation and abrasion where applicable." }),
  materialSection({ id: "fineAggregateChemical", nameAr: "كيمياء الركام الناعم", nameFr: "Chimie des granulats fins", nameEn: "Fine Aggregate Chemical", descriptionAr: "الكلوريدات والكبريتات والمواد العضوية والمركبات الضارة.", descriptionEn: "Chlorides, sulfates, organics and harmful constituents." }),
  materialSection({ id: "fineAggregateDurability", nameAr: "متانة الركام الناعم", nameFr: "Durabilité des granulats fins", nameEn: "Fine Aggregate Durability", descriptionAr: "التجمد والذوبان والكبريتات والعوامل الحرارية.", descriptionEn: "Freeze-thaw, sulfate and thermal durability." }),
  materialSection({ id: "fineAggregateReactivity", nameAr: "تفاعلية الركام الناعم", nameFr: "Réactivité des granulats fins", nameEn: "Fine Aggregate Reactivity", descriptionAr: "ASR وACR واختبارات التأهيل الكيميائي.", descriptionEn: "ASR, ACR and aggregate qualification tests." }),
  materialSection({ id: "coarseAggregateGranulometry", nameAr: "تدرج الركام الخشن", nameFr: "Granulométrie des gros granulats", nameEn: "Coarse Aggregate Granulometry", descriptionAr: "التدرج وDmax ومقاسات d/D.", descriptionEn: "Grading, Dmax and d/D size designation." }),
  materialSection({ id: "coarseAggregatePhysical", nameAr: "فيزيائية الركام الخشن", nameFr: "Physique des gros granulats", nameEn: "Coarse Aggregate Physical", descriptionAr: "الكثافة والامتصاص والرطوبة والفراغات.", descriptionEn: "Density, absorption, moisture and voids." }),
  materialSection({ id: "coarseAggregateShape", nameAr: "شكل الركام الخشن", nameFr: "Forme des gros granulats", nameEn: "Coarse Aggregate Shape", descriptionAr: "التفلطح والاستطالة والأسطح المكسرة.", descriptionEn: "Flakiness, elongation and crushed surfaces." }),
  materialSection({ id: "coarseAggregateMechanical", nameAr: "ميكانيكية الركام الخشن", nameFr: "Mécanique des gros granulats", nameEn: "Coarse Aggregate Mechanical", descriptionAr: "Los Angeles وMicro-Deval وPSV والتآكل بالنوردك.", descriptionEn: "Los Angeles, Micro-Deval, PSV and Nordic abrasion." }),
  materialSection({ id: "coarseAggregateChemical", nameAr: "كيمياء الركام الخشن", nameFr: "Chimie des gros granulats", nameEn: "Coarse Aggregate Chemical", descriptionAr: "الكبريتيدات والكلوريدات والرشح والمعادن.", descriptionEn: "Sulfides, chlorides, leaching and minerals." }),
  materialSection({ id: "coarseAggregateDurability", nameAr: "متانة الركام الخشن", nameFr: "Durabilité des gros granulats", nameEn: "Coarse Aggregate Durability", descriptionAr: "التجمد والذوبان والتفكك والصدمة الحرارية.", descriptionEn: "Freeze-thaw, disintegration and thermal shock." }),
  materialSection({ id: "coarseAggregateReactivity", nameAr: "تفاعلية الركام الخشن", nameFr: "Réactivité des gros granulats", nameEn: "Coarse Aggregate Reactivity", descriptionAr: "ASR وACR ومنشور الخرسانة كاختبار تأهيل للركام.", descriptionEn: "ASR, ACR and concrete-prism aggregate qualification." }),
  materialSection({ id: "admixtureCharacterization", nameAr: "توصيف الإضافات الكيميائية", nameFr: "Caractérisation des adjuvants", nameEn: "Admixture Characterization", descriptionAr: "الكثافة وpH والمادة الصلبة والماء والكلوريدات والقلويات.", descriptionEn: "Density, pH, solids, water, chlorides and alkalis." }),
  materialSection({ id: "admixturePerformanceQualification", nameAr: "تأهيل أداء الإضافات", nameFr: "Qualification des performances", nameEn: "Admixture Performance Qualification", descriptionAr: "فعالية الإضافة داخل مونة أو خرسانة مرجعية، وليست خاصية للمادة وحدها.", descriptionEn: "Admixture efficacy in reference mortar or concrete, not standalone material characterization." }),
  materialSection({ id: "mineralAdditions", nameAr: "الإضافات المعدنية", nameFr: "Additions minérales", nameEn: "Mineral Additions", descriptionAr: "الرماد المتطاير والخبث والسيليكا فيوم والحشوات.", descriptionEn: "Fly ash, slag, silica fume and limestone/fillers." }),
  materialSection({ id: "mixingWater", nameAr: "ماء الخلط", nameFr: "Eau de gâchage", nameEn: "Mixing Water", descriptionAr: "التحليل البصري والكيميائي وملاءمة الماء للخرسانة.", descriptionEn: "Visual and chemical analysis and suitability for concrete." })
];

export const CONCRETE_LAB_SECTIONS: readonly LaboratorySectionDefinition<ConcreteLabSection>[] = [
  concreteSection({ id: "freshConcrete", nameAr: "الخرسانة الطازجة", nameFr: "Béton frais", nameEn: "Fresh Concrete", descriptionAr: "القوام والكثافة والهواء والنزف والانفصال.", descriptionEn: "Consistence, density, air, bleeding and segregation." }),
  concreteSection({ id: "scc", nameAr: "الخرسانة ذاتية الدمك", nameFr: "Béton autoplaçant", nameEn: "Self-Compacting Concrete", descriptionAr: "Slump Flow وT500 وV-Funnel وL-Box وJ-Ring.", descriptionEn: "Slump Flow, T500, V-Funnel, L-Box and J-Ring." }),
  concreteSection({ id: "hardenedConcrete", nameAr: "الخرسانة المتصلبة", nameFr: "Béton durci", nameEn: "Hardened Concrete", descriptionAr: "المقاومة والكثافة والمسامية والمرونة.", descriptionEn: "Strength, density, porosity and elasticity." }),
  concreteSection({ id: "deformation", nameAr: "تشوهات الخرسانة", nameFr: "Déformations du béton", nameEn: "Concrete Deformation", descriptionAr: "الانكماش والزحف والتمدد وتغير الطول.", descriptionEn: "Shrinkage, creep, expansion and length change." }),
  concreteSection({ id: "durability", nameAr: "متانة الخرسانة", nameFr: "Durabilité du béton", nameEn: "Concrete Durability", descriptionAr: "الكلوريدات والكربنة والتجمد والنفاذية والتعرضات العدوانية.", descriptionEn: "Chlorides, carbonation, freeze-thaw, penetration and exposure." }),
  concreteSection({ id: "specialConcrete", nameAr: "الخرسانة الخاصة", nameFr: "Bétons spéciaux", nameEn: "Special Concrete", descriptionAr: "SCC وHPC وUHPC وFRC.", descriptionEn: "SCC, HPC, UHPC and FRC." }),
  concreteSection({ id: "inSituNdt", nameAr: "خرسانة المنشآت والفحوص غير المتلفة", nameFr: "Béton in situ / END", nameEn: "In-Situ and NDT", descriptionAr: "اللبات وشميدت وUPV وPull-Out وتقييم المقاومة الموضعية.", descriptionEn: "Cores, Schmidt, UPV, Pull-Out and in-situ strength assessment." })
];

export interface BoundaryPlacementRule {
  test: string;
  area: LaboratoryArea;
  section: MaterialsLabSection | ConcreteLabSection;
  rationaleAr: string;
  rationaleEn: string;
}

export const BOUNDARY_PLACEMENT_RULES: readonly BoundaryPlacementRule[] = [
  { test: "Cement mortar compressive strength", area: "materials", section: "cementMechanical", rationaleAr: "اختبار توصيف واعتماد للإسمنت بمونة معيارية.", rationaleEn: "Cement characterization and conformity using standard mortar." },
  { test: "Pozzolanicity", area: "materials", section: "cementHydrationPozzolanicity", rationaleAr: "خاصية للمادة وليست أداء خرسانة منتجة.", rationaleEn: "Material property, not produced-concrete performance." },
  { test: "ASR mortar bar", area: "materials", section: "fineAggregateReactivity", rationaleAr: "تأهيل لتفاعلية الركام حتى عند استخدام مونة اختبار.", rationaleEn: "Aggregate reactivity qualification even when mortar is the test medium." },
  { test: "Concrete prism ASR", area: "materials", section: "coarseAggregateReactivity", rationaleAr: "اختبار تأهيل للركام وليس فحص خرسانة منشأة.", rationaleEn: "Aggregate qualification, not an assessment of placed concrete." },
  { test: "Water reduction of admixture", area: "materials", section: "admixturePerformanceQualification", rationaleAr: "أداء إضافة داخل خرسانة أو مونة مرجعية.", rationaleEn: "Admixture performance in reference concrete or mortar." },
  { test: "Slump", area: "concrete", section: "freshConcrete", rationaleAr: "خاصية للخرسانة بعد دمج المواد.", rationaleEn: "Property of concrete after materials are combined." },
  { test: "Compressive strength 28 d", area: "concrete", section: "hardenedConcrete", rationaleAr: "أداء الخلطة الخرسانية المتصلبة.", rationaleEn: "Performance of hardened concrete mix." },
  { test: "UPV", area: "concrete", section: "inSituNdt", rationaleAr: "فحص خرسانة متصلبة أو موجودة بالمنشأ.", rationaleEn: "Assessment of hardened or in-situ concrete." }
];

const MATERIAL_CATEGORY_TO_AREA: Readonly<Record<LabCategory, LaboratoryArea>> = {
  aggregates: "materials", cement: "materials", water: "materials", admixtures: "materials", additives: "materials", fibers: "materials"
};

export function getCatalogTestArea(definition: Pick<LabTestDefinition, "category"> | { category: string }): LaboratoryArea {
  const area = MATERIAL_CATEGORY_TO_AREA[definition.category as LabCategory];
  if (!area) throw new Error(`Unknown laboratory category: ${definition.category}. Register its lab area before use.`);
  return area;
}

export function assertCatalogTestScope(definition: Pick<LabTestDefinition, "id" | "category"> | { id: string; category: string }, expectedArea: LaboratoryArea = "materials"): void {
  const actualArea = getCatalogTestArea(definition);
  if (actualArea !== expectedArea) throw new Error(`Test ${definition.id} belongs to ${actualArea} lab, not ${expectedArea} lab.`);
}

export function isMaterialTestCategory(category: LabCategory): boolean {
  return getCatalogTestArea({ category }) === "materials";
}

export const LABORATORY_SCOPE_VERSION = "2026.09-materials-concrete-boundary-v1";
