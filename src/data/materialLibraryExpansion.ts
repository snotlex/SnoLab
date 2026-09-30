import { EngineeringMaterial } from "../types";
import { MATERIAL_PROPERTY_SCHEMAS, normalizeMaterialRole } from "../services/materialPropertySchema";
import { ADDITIONAL_APPROVED_MATERIALS } from "./additionalApprovedMaterials";

/**
 * Reference-only records for the most common specialized concrete workflows.
 * Values are editable project starting points, not supplier certificates.
 * Every record is hydrated from the active role schema so the editor can expose
 * a complete, auditable property profile without inventing missing fields later.
 */
function referenceMaterial(
  id: string,
  name: string,
  englishName: string,
  type: string,
  category: string,
  overrides: Record<string, any> = {},
  extra: Partial<EngineeringMaterial> = {}
): EngineeringMaterial {
  const role = normalizeMaterialRole({ type, category });
  const definitions = MATERIAL_PROPERTY_SCHEMAS[role] || [];
  const defaults = Object.fromEntries(
    definitions
      .filter((definition: any) => definition.defaultVal !== undefined)
      .map((definition: any) => [definition.key, definition.defaultVal])
  );
  const values = { ...defaults, ...overrides };
  const propertyMetadata = Object.fromEntries(
    definitions
      .filter((definition: any) => values[definition.key] !== undefined)
      .map((definition: any) => [definition.key, {
        key: definition.key,
        propertyId: definition.propertyId,
        value: values[definition.key],
        unit: definition.unit || "",
        sourceType: "reference",
        sourceLabel: "REFERENCE / EDITABLE",
        status: "default_reference",
        isEditable: true,
        originalDefaultValue: values[definition.key],
        testStandard: definition.testStandard,
        history: []
      }])
  );
  return {
    id,
    name,
    englishName,
    type,
    category,
    materialType: category,
    ...values,
    engineeringData: { ...values },
    propertyMetadata,
    quality: "قيمة مرجعية قابلة للتعديل والتحقق بالموقع",
    uses: "تستخدم كنقطة بداية لحسابات الخلطات المتخصصة",
    desc: "سجل مرجعي هندسي؛ يجب استبدال القيم بشهادة المورد ونتائج مختبر المشروع قبل الاعتماد النهائي.",
    rating: 4.4,
    provenance: "SnoLab Reference Library",
    status: "نشط",
    approvalStatus: "Approved",
    sourceType: "system",
    materialSource: "system",
    sourceLabel: "Editable System Reference",
    isSystem: true,
    isDemo: false,
    readOnly: false,
    requiredPropertiesComplete: true,
    validationStatus: "VALIDATED",
    readinessStatus: "READY",
    ...extra
  } as EngineeringMaterial;
}

export const EXPANDED_REFERENCE_MATERIALS: EngineeringMaterial[] = [
  referenceMaterial("SYS-CEM-SULFATE-001", "إسمنت مقاوم للكبريتات CEM I SR 42.5", "Sulfate-Resisting Cement CEM I SR 42.5", "cement", "إسمنت", {
    cementClass: "CEM I 42.5", strengthClass: 42.5, density: 3150, specificGravity: 3.15, bulkDensity: 1150,
    strength2d: 20, strength7d: 34, strength28d: 49, sulfateContent: 2.2, chlorideContent: 0.02, heatOfHydration: 280
  }, { uses: "Marine وXA وXD والأساسات المعرضة للمياه الكبريتية" }),
  referenceMaterial("SYS-CEM-EARLY-001", "إسمنت عالي المقاومة المبكرة CEM I 52.5 R", "Early-Strength Cement CEM I 52.5 R", "cement", "إسمنت", {
    cementClass: "CEM I 52.5", strengthClass: 52.5, density: 3150, specificGravity: 3.15, bulkDensity: 1180,
    strength2d: 32, strength7d: 48, strength28d: 62, initialSetting: 90, finalSetting: 180
  }, { uses: "Precast وPrestressed وShotcrete وأعمال الإصلاح السريعة" }),
  referenceMaterial("SYS-CEM-LOWALKALI-001", "إسمنت منخفض القلوية CEM I 42.5 LA", "Low-Alkali Cement CEM I 42.5 LA", "cement", "إسمنت", {
    cementClass: "CEM I 42.5", strengthClass: 42.5, density: 3120, specificGravity: 3.12, alkaliEquivalent: 0.45,
    strength2d: 20, strength7d: 32, strength28d: 48, chlorideContent: 0.02
  }, { uses: "الركام التفاعلي وخرسانة المنشآت الحساسة لتفاعل القلويات" }),
  referenceMaterial("SYS-CEM-WHITE-001", "إسمنت أبيض عالي المقاومة CEM I 52.5", "White Portland Cement CEM I 52.5", "cement", "إسمنت", {
    cementClass: "White CEM I 52.5", strengthClass: 52.5, density: 3050, specificGravity: 3.05, bulkDensity: 1120,
    strength2d: 30, strength7d: 46, strength28d: 60, lossOnIgnition: 1.0, insolubleResidue: 0.5
  }, { uses: "الخرسانة المعمارية والواجهات والعناصر مسبقة الصب" }),
  referenceMaterial("SYS-ADM-SP-001", "ملدن فائق عالي المدى PCE", "Polycarboxylate High-Range Water Reducer", "superplasticizer", "إضافات كيميائية", {
    admixtureType: "superplasticizer", recommendedDosage: 1.2, waterReduction: 32, density: 1080, solidContent: 40,
    settingTimeImpact: 15, airPercentage: 1, ph: 6.5, chlorideContent: 0.01, alkaliContent: 1.0
  }, { uses: "HSC وHPC وSCC وUHPC وBFUP والخرسانة المضخوخة" }),
  referenceMaterial("SYS-ADM-SHOT-ACC-001", "مسرع شك للخرسانة المرشوشة", "Alkali-Free Shotcrete Accelerator", "accelerator", "إضافات كيميائية", {
    admixtureType: "accelerator", recommendedDosage: 6, waterReduction: 0, density: 1350, solidContent: 50,
    settingTimeImpact: -8, airPercentage: 0, ph: 6, chlorideContent: 0.01, alkaliContent: 0.5
  }, { uses: "Shotcrete بالطريقة الرطبة والجافة؛ تضبط الجرعة حسب زمن الشك" }),
  referenceMaterial("SYS-ADM-AIR-001", "حابس هواء ميكروي", "Micro Air-Entraining Admixture", "air_entraining", "إضافات كيميائية", {
    admixtureType: "air_entraining", recommendedDosage: 0.08, waterReduction: 0, density: 1010, solidContent: 12,
    settingTimeImpact: 0, airPercentage: 5, ph: 7, chlorideContent: 0.01, alkaliContent: 0.2
  }, { uses: "XF والدورات الحرارية والخرسانة المقاومة للصقيع" }),
  referenceMaterial("SYS-ADM-RET-001", "مبطئ شك ومحتفظ بالهبوط", "Set Retarder and Slump Retention Admixture", "retarder", "إضافات كيميائية", {
    admixtureType: "retarder", recommendedDosage: 0.6, waterReduction: 12, density: 1120, solidContent: 30,
    settingTimeImpact: 45, airPercentage: 1, ph: 7, chlorideContent: 0.01, alkaliContent: 0.8
  }, { uses: "الصبات الكبيرة والطقس الحار والخرسانة المضخوخة لمسافات طويلة" }),
  referenceMaterial("SYS-SCM-SILICA-001", "غبار السيليكا المكثف", "Densified Silica Fume", "silica_fume", "إضافات معدنية", {
    scmType: "silica_fume", density: 2200, specificGravity: 2.2, bulkDensity: 550, blaineFineness: 20000,
    pozzolanicIndex: 115, replacementPercent: 8, waterDemandFactor: 1.15, silicaContent: 94, lossOnIgnition: 3
  }, { uses: "HPC وUHPC وBFUP وShotcrete والخرسانة البحرية" }),
  referenceMaterial("SYS-SCM-FLYASH-001", "رماد متطاير منخفض الكالسيوم Class F", "Class F Low-Calcium Fly Ash", "fly_ash", "إضافات معدنية", {
    scmType: "fly_ash", density: 2300, specificGravity: 2.3, bulkDensity: 950, blaineFineness: 3600,
    pozzolanicIndex: 85, replacementPercent: 25, waterDemandFactor: 0.95, lossOnIgnition: 3, sulfateContent: 2
  }, { uses: "GPC وMASS وMarine وتقليل حرارة الإماهة" }),
  referenceMaterial("SYS-SCM-GGBS-001", "خبث الأفران الحبيبي المطحون GGBS", "Ground Granulated Blast Furnace Slag", "slag", "إضافات معدنية", {
    scmType: "slag", density: 2900, specificGravity: 2.9, bulkDensity: 1050, blaineFineness: 4200,
    pozzolanicIndex: 100, replacementPercent: 45, waterDemandFactor: 0.98, sulfateContent: 2.5
  }, { uses: "GPC وMarine وXA وMASS والخرسانة منخفضة النفاذية" }),
  referenceMaterial("SYS-SCM-METAKAOLIN-001", "ميتاكاولين عالي النشاط", "High-Reactivity Metakaolin", "metakaolin", "إضافات معدنية", {
    scmType: "metakaolin", density: 2550, specificGravity: 2.55, bulkDensity: 650, blaineFineness: 12000,
    pozzolanicIndex: 125, replacementPercent: 12, waterDemandFactor: 1.12, lossOnIgnition: 1.5
  }, { uses: "HPC والخرسانة البحرية ومقاومة النفاذية" }),
  referenceMaterial("SYS-FIB-STEEL-MACRO-001", "ألياف فولاذية ماكرو معقوفة", "Hooked-End Macro Steel Fibers", "fiber", "ألياف", {
    fiberType: "steel_hooked", density: 7850, fiberDensity: 7850, fiberDosageKgM3: 35, fiberLengthMm: 50,
    fiberDiameterMm: 0.75, aspectRatio: 67, elasticModulus: 200, tensileStrength: 1100, fiberTensileStrengthMPa: 1100
  }, { uses: "FRC وRCC وShotcrete والأرضيات الصناعية" }),
  referenceMaterial("SYS-FIB-PP-MACRO-001", "ألياف بوليمرية ماكرو هيكلية", "Macro Synthetic Polypropylene Fibers", "fiber", "ألياف", {
    fiberType: "synthetic_macro", density: 910, fiberDensity: 910, fiberDosageKgM3: 5, fiberLengthMm: 54,
    fiberDiameterMm: 0.65, aspectRatio: 83, elasticModulus: 8, tensileStrength: 600, fiberTensileStrengthMPa: 600
  }, { uses: "FRC وShotcrete ومقاومة التشققات والانكماش" }),
  referenceMaterial("SYS-FIB-PP-MICRO-FIRE-001", "ألياف بولي بروبيلين دقيقة مضادة للتشظي", "Micro Polypropylene Fire-Spalling Fibers", "fiber", "ألياف", {
    fiberType: "synthetic_micro", density: 910, fiberDensity: 910, fiberDosageKgM3: 2, fiberLengthMm: 12,
    fiberDiameterMm: 0.018, aspectRatio: 667, elasticModulus: 5, tensileStrength: 450, fiberTensileStrengthMPa: 450
  }, { uses: "UHPC وShotcrete والعناصر المعرضة للحريق" }),
  referenceMaterial("SYS-FIB-ARGLASS-001", "ألياف زجاجية مقاومة للقلويات AR", "Alkali-Resistant Glass Fibers", "fiber", "ألياف", {
    fiberType: "glass", density: 2680, fiberDensity: 2680, fiberDosageKgM3: 5, fiberLengthMm: 18,
    fiberDiameterMm: 0.02, aspectRatio: 800, elasticModulus: 72, tensileStrength: 1700, fiberTensileStrengthMPa: 1700
  }, { uses: "العناصر الرقيقة والواجهات والخرسانة المعمارية" }),
  referenceMaterial("SYS-AGG-SIZE-4-8-001", "ركام بازلتي 4/8 مم", "Basalt Coarse Aggregate 4/8 mm", "gravel", "حصى", {
    dMax: 8, density: 2850, specificGravity: 2.85, bulkDensity: 1500, absorption: 0.7, moisture: 1,
    nominalSize: 6, losAngelesAbrasion: 16, microDeval: 10, finesContent: 1, chlorideContent: 0.01, sulfateContent: 0.05
  }, { uses: "SCC وUHPC وShotcrete والتدرجات الدقيقة" }),
  referenceMaterial("SYS-AGG-SIZE-16-22-001", "ركام بازلتي 16/22 مم", "Basalt Coarse Aggregate 16/22 mm", "gravel", "حصى", {
    dMax: 22, density: 2850, specificGravity: 2.85, bulkDensity: 1520, absorption: 0.7, moisture: 1,
    nominalSize: 19, losAngelesAbrasion: 16, microDeval: 10, finesContent: 1, chlorideContent: 0.01, sulfateContent: 0.05
  }, { uses: "NSC وHSC وRCC والخرسانة الكتلية" }),
  referenceMaterial("SYS-AGG-RCA-WASHED-001", "ركام خرساني معاد تدويره مغسول SSD", "Washed Recycled Concrete Aggregate SSD", "recycled_aggregate", "ركام معاد تدويره", {
    dMax: 20, density: 2420, specificGravity: 2.42, bulkDensity: 1320, absorption: 4.5, moisture: 4,
    masonryContent: 2, losAngelesAbrasion: 30, finesContent: 1.5, chlorideContent: 0.02, sulfateContent: 0.5
  }, { uses: "RAC بعد التحقق من الامتصاص والمونة الملتصقة" }),
  referenceMaterial("SYS-AGG-PUMICE-001", "ركام خفاف خفيف الوزن", "Lightweight Pumice Aggregate", "lightweight_aggregate", "ركام خفيف", {
    dMax: 16, density: 900, specificGravity: 0.9, bulkDensity: 520, absorption: 18, moisture: 5,
    crushingResistance: 3.5
  }, { uses: "LWC والعزل الحراري وتقليل الوزن" }),
  referenceMaterial("SYS-AGG-PERLITE-001", "ركام بيرلايت ممدد فائق الخفة", "Expanded Perlite Lightweight Aggregate", "lightweight_aggregate", "ركام خفيف", {
    dMax: 8, density: 650, specificGravity: 0.65, bulkDensity: 320, absorption: 25, moisture: 4,
    crushingResistance: 2.5
  }, { uses: "LWC وطبقات الميول والعزل الحراري غير الإنشائي" }),
  referenceMaterial("SYS-ADM-CORROSION-001", "مثبط تآكل حديد التسليح نيتريت الكالسيوم", "Calcium Nitrite Corrosion Inhibitor", "custom", "إضافات كيميائية", {
    admixtureType: "custom", recommendedDosage: 2, waterReduction: 0, density: 1300, solidContent: 40,
    settingTimeImpact: 10, airPercentage: 0, ph: 10, chlorideContent: 0, alkaliContent: 1
  }, { uses: "Marine وXD والمنشآت المعرضة للكلوريدات" }),
  referenceMaterial("SYS-ADM-CRYSTAL-WP-001", "مضاف بلوري مانع للنفاذية", "Crystalline Permeability-Reducing Admixture", "custom", "إضافات كيميائية", {
    admixtureType: "custom", recommendedDosage: 2, waterReduction: 0, density: 1100, solidContent: 60,
    settingTimeImpact: 0, airPercentage: 0, ph: 9, chlorideContent: 0, alkaliContent: 1
  }, { uses: "Marine والخزانات والأنفاق والمنشآت المائية" })
];

export const MATERIAL_BUNDLES_BY_CONCRETE_TYPE: Record<string, { labelAr: string; materialIds: string[]; notesAr: string }> = {
  SCC: { labelAr: "حزمة الخرسانة ذاتية الرص", materialIds: ["SYS-CEM-EARLY-001", "SYS-SND-UHPC-001", "SYS-AGG-SIZE-4-8-001", "SYS-FIL-SCC-001", "SYS-ADM-SP-001", "SYS-ADM-VMA-001"], notesAr: "اضبط Slump Flow وV-funnel وL-box بالمختبر قبل الاعتماد." },
  UHPC: { labelAr: "حزمة الخرسانة فائقة الأداء", materialIds: ["SYS-CEM-EARLY-001", "SYS-SCM-SILICA-001", "SYS-SND-UHPC-001", "SYS-ADM-SP-001", "SYS-FIB-MICRO-STEEL-001"], notesAr: "تتطلب تعبئة حبيبية وخلطة تجريبية وقياس المقاومة بعد المعالجة." },
  BFUP: { labelAr: "حزمة BFUP", materialIds: ["SYS-CEM-EARLY-001", "SYS-SCM-SILICA-001", "SYS-SND-UHPC-001", "SYS-ADM-SP-001", "SYS-FIB-MICRO-STEEL-001"], notesAr: "تحقق من توزيع الألياف والمقاومة بعد التشقق." },
  SHOTCRETE: { labelAr: "حزمة الخرسانة المرشوشة", materialIds: ["SYS-CEM-EARLY-001", "SYS-SND-UHPC-001", "SYS-AGG-SIZE-4-8-001", "SYS-ADM-SHOT-ACC-001", "SYS-ADM-SP-001", "SYS-FIB-PP-MICRO-FIRE-001"], notesAr: "اختبر زمن الشك والارتداد والطريقة الرطبة/الجافة." },
  GPC: { labelAr: "حزمة الخرسانة الجيوبوليمرية", materialIds: ["SYS-SCM-FLYASH-001", "SYS-SCM-GGBS-001", "SYS-ADM-GPC-ACT-001", "SYS-SND-UHPC-001", "SYS-AGG-SIZE-16-22-001"], notesAr: "وثق المولارية ونسب Si/Al وNa2O/SiO2 والمعالجة." },
  SHC: { labelAr: "حزمة الخرسانة ذاتية المعالجة", materialIds: ["SYS-CEM-SULFATE-001", "SYS-AGG-SIZE-16-22-001", "SYS-SND-UHPC-001", "SYS-ADM-SP-001", "SYS-ADM-SHC-001"], notesAr: "تحقق من كفاءة غلق الشروخ والاحتفاظ بالمقاومة." },
  RAC: { labelAr: "حزمة الركام المعاد تدويره", materialIds: ["SYS-CEM-SULFATE-001", "SYS-AGG-RCA-WASHED-001", "SYS-SND-UHPC-001", "SYS-ADM-SP-001"], notesAr: "أدخل الامتصاص والرطوبة وحالة SSD لكل دفعة." },
  MARINE: { labelAr: "حزمة الخرسانة البحرية", materialIds: ["SYS-CEM-SULFATE-001", "SYS-SCM-GGBS-001", "SYS-SCM-SILICA-001", "SYS-AGG-SIZE-16-22-001", "SYS-ADM-CORROSION-001"], notesAr: "تحقق من فئة التعرض XS/XD وحدود الكلوريدات والنفاذية." },
  MASS: { labelAr: "حزمة الخرسانة الكتلية", materialIds: ["SYS-CEM-MASS-001", "SYS-SCM-FLYASH-001", "SYS-AGG-SIZE-16-22-001", "SYS-ADM-RET-001"], notesAr: "استخدم نموذج الحرارة ومراقبة الفروقات الحرارية بالموقع." },
  LWC: { labelAr: "حزمة الخرسانة خفيفة الوزن", materialIds: ["SYS-CEM-EARLY-001", "SYS-AGG-PUMICE-001", "SYS-SND-UHPC-001", "SYS-ADM-SP-001"], notesAr: "اضبط pre-wetting والامتصاص وحالة SSD للركام الخفيف." },
  FRC: { labelAr: "حزمة الخرسانة المسلحة بالألياف", materialIds: ["SYS-CEM-EARLY-001", "SYS-AGG-SIZE-16-22-001", "SYS-SND-UHPC-001", "SYS-FIB-STEEL-MACRO-001", "SYS-ADM-SP-001"], notesAr: "اعتمد الجرعة من اختبار ما بعد التشقق والسحب." }
};

export function getMaterialBundle(concreteType: string): EngineeringMaterial[] {
  const ids = MATERIAL_BUNDLES_BY_CONCRETE_TYPE[String(concreteType || "").toUpperCase()]?.materialIds || [];
  const available = [...EXPANDED_REFERENCE_MATERIALS, ...ADDITIONAL_APPROVED_MATERIALS];
  const unique = new Map(available.map(material => [material.id, material]));
  return ids.map(id => unique.get(id)).filter((material): material is EngineeringMaterial => Boolean(material));
}
