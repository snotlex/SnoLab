import { EngineeringMaterial } from "../types";

/**
 * System reference materials with typical engineering properties.
 * These are catalog references, not project-specific laboratory certificates;
 * project use still requires local verification and engineer sign-off.
 */
export const ADDITIONAL_APPROVED_MATERIALS: EngineeringMaterial[] = [
  {
    id: "SYS-CEM-106", name: "إسمنت مركب CEM II/B-L 42.5 N", englishName: "Blended Limestone Cement CEM II/B-L 42.5 N",
    type: "cement", category: "إسمنت", materialType: "مادة رابطة", cementClass: "CEM II/B-L 42.5 N", strengthClass: 42.5,
    density: 3050, quality: "مرجع نظامي نموذجي وفق EN 197-1", uses: "الخرسانة الإنشائية العامة والعناصر مسبقة الصب",
    desc: "إسمنت مركب يحتوي على حجر جيري مطحون لتحسين قابلية التشغيل وخفض البصمة الكربونية.", rating: 4.5, provenance: "مرجع EN 197-1", status: "نشط", materialSource: "system", isSystem: true,
    bulkDensity: 1120, specificGravity: 3.05, blaineFineness: 4100, standardConsistency: 28, initialSetting: 150, finalSetting: 225, soundness: 1.0, strength2d: 18, strength7d: 31, strength28d: 47, lossOnIgnition: 4.2, insolubleResidue: 1.2, sulfateContent: 3.0, chlorideContent: 0.03, alkaliEquivalent: 0.75, engineeringData: { cementClass: "CEM II/B-L 42.5 N", strengthClass: 42.5, density: 3050, heatOfHydration: 270 }
  },
  {
    id: "SYS-CEM-107", name: "إسمنت خبثي CEM III/A 42.5 N", englishName: "Blast Furnace Slag Cement CEM III/A 42.5 N",
    type: "cement", category: "إسمنت", materialType: "مادة رابطة", cementClass: "CEM III/A 42.5 N", strengthClass: 42.5,
    density: 3000, quality: "مرجع نظامي نموذجي وفق EN 197-1", uses: "الخرسانة الكتلية والبيئات الكبريتية والكلوريدية",
    desc: "إسمنت ذو حرارة إماهة منخفضة ومتانة محسنة بفضل محتوى الخبث المحبب.", rating: 4.6, provenance: "مرجع EN 197-1", status: "نشط", materialSource: "system", isSystem: true,
    bulkDensity: 1080, specificGravity: 3.0, blaineFineness: 3950, standardConsistency: 29, initialSetting: 165, finalSetting: 240, soundness: 0.8, strength2d: 15, strength7d: 28, strength28d: 46, lossOnIgnition: 1.5, insolubleResidue: 0.8, sulfateContent: 2.8, chlorideContent: 0.02, alkaliEquivalent: 0.65, engineeringData: { cementClass: "CEM III/A 42.5 N", strengthClass: 42.5, density: 3000, heatOfHydration: 210 }
  },
  {
    id: "SYS-SCM-SF-001", name: "غبار السيليكا المكثف", englishName: "Densified Silica Fume",
    type: "silica_fume", category: "إضافات معدنية", materialType: "إضافات معدنية", density: 2200, maxReplacementPercent: 15,
    quality: "مرجع نظامي نموذجي وفق EN 13263-1", uses: "HSC وHPC وUHPC وتحسين مقاومة النفاذية",
    desc: "مادة بوزولانية شديدة النعومة لخفض النفاذية وتحسين المقاومة، وتحتاج إلى ملدن فائق.", rating: 4.8, provenance: "مرجع EN 13263-1", status: "نشط", materialSource: "system", isSystem: true,
    admixtureType: "silica_fume", recommendedDosage: 8, waterReduction: 0, bulkDensity: 650, blaineFineness: 18000, pozzolanicIndex: 125, waterDemandFactor: 1.10, silicaContent: 94, calciumOxide: 0.8, lossOnIgnition: 2.0, chlorideContent: 0.01, compatibilityNotes: "تتطلب ضبط الماء والملدن الفائق وتجارب توافق.", engineeringData: { density: 2200, maxReplacementPercent: 15 }
  },
  {
    id: "SYS-SCM-QP-001", name: "مسحوق كوارتز فائق النعومة", englishName: "Ultra-Fine Quartz Powder",
    type: "quartz_powder", category: "إضافات معدنية", materialType: "مسحوق معدني", density: 2650, maxReplacementPercent: 30,
    quality: "مرجع صناعي نموذجي لخلطات UHPC/BFUP", uses: "UHPC وBFUP والخلطات الدقيقة عالية الأداء",
    desc: "مسحوق كوارتزي ناعم لملء الفراغات بين حبيبات الرمل والسيليكا وتحسين تراص المصفوفة الدقيقة.",
    rating: 4.6, provenance: "مرجع صناعي UHPC", status: "نشط", materialSource: "system", isSystem: true,
    bulkDensity: 1050, blaineFineness: 6500, pozzolanicIndex: 0, waterDemandFactor: 0.95,
    silicaContent: 99, calciumOxide: 0.2, lossOnIgnition: 0.2, chlorideContent: 0.01,
    engineeringData: { density: 2650, maxReplacementPercent: 30, particleSizeMicronMax: 150 }
  },
  {
    id: "SYS-SCM-FA-001", name: "الرماد المتطاير فئة F", englishName: "Class F Fly Ash",
    type: "fly_ash", category: "إضافات معدنية", materialType: "إضافات معدنية", density: 2300, maxReplacementPercent: 30,
    quality: "مرجع نظامي نموذجي وفق EN 450-1", uses: "الخرسانة الكتلية والخرسانة المستدامة وتحسين التشغيلية",
    desc: "رماد بوزولاني منخفض الكالسيوم يحسن التشغيلية ويخفض حرارة الإماهة على حساب المقاومة المبكرة.", rating: 4.4, provenance: "مرجع EN 450-1", status: "نشط", materialSource: "system", isSystem: true,
    admixtureType: "fly_ash", recommendedDosage: 20, waterReduction: 5, bulkDensity: 900, blaineFineness: 3800, pozzolanicIndex: 85, waterDemandFactor: 0.90, silicaContent: 55, calciumOxide: 5, lossOnIgnition: 3, chlorideContent: 0.02, engineeringData: { density: 2300, maxReplacementPercent: 30 }
  },
  {
    id: "SYS-SCM-GGBS-001", name: "خبث الأفران المحبب المطحون", englishName: "Ground Granulated Blast Furnace Slag",
    type: "slag", category: "إضافات معدنية", materialType: "إضافات معدنية", density: 2900, maxReplacementPercent: 60,
    quality: "مرجع نظامي نموذجي وفق EN 15167-1", uses: "البيئات البحرية والكبريتات والخرسانة الكتلية",
    desc: "مادة رابطة كامنة هيدروليكيًا تحسن المتانة وتخفض حرارة الإماهة والبصمة الكربونية.", rating: 4.7, provenance: "مرجع EN 15167-1", status: "نشط", materialSource: "system", isSystem: true,
    admixtureType: "slag", recommendedDosage: 35, waterReduction: 3, bulkDensity: 1200, blaineFineness: 4200, pozzolanicIndex: 95, waterDemandFactor: 0.95, silicaContent: 35, calciumOxide: 40, lossOnIgnition: 1, chlorideContent: 0.02, engineeringData: { density: 2900, maxReplacementPercent: 60 }
  },
  {
    id: "SYS-ADM-SP-001", name: "ملدن فائق بولي كربوكسيلات", englishName: "Polycarboxylate Ether Superplasticizer",
    type: "superplasticizer", category: "إضافات كيميائية", materialType: "إضافات كيميائية", density: 1080, recommendedDosage: 1.2,
    quality: "مرجع نظامي نموذجي وفق EN 934-2", uses: "HSC وHPC وSCC والخرسانة القابلة للضخ",
    desc: "ملدن فائق طويل الاحتفاظ بالهبوط لخفض ماء الخلط مع الحفاظ على التشغيلية.", rating: 4.8, provenance: "مرجع EN 934-2", status: "نشط", materialSource: "system", isSystem: true,
    admixtureType: "superplasticizer", waterReduction: 25, solidContent: 40, settingTimeImpact: 30, airPercentage: 2, ph: 6.5, chlorideContent: 0.01, alkaliContent: 1.0, compatibilityNotes: "يجب اختبار توافقه مع الإسمنت وSCM وزمن الخلط.", engineeringData: { density: 1080, waterReduction: 25 }
  },
  {
    id: "SYS-ADM-RET-001", name: "مضاف مؤخر للشك", englishName: "Set Retarding Admixture",
    type: "retarder", category: "إضافات كيميائية", materialType: "إضافات كيميائية", density: 1150, recommendedDosage: 0.5,
    quality: "مرجع نظامي نموذجي وفق EN 934-2", uses: "الطقس الحار والنقل الطويل والخرسانة الكتلية",
    desc: "مضاف يؤخر بداية الشك مع ضرورة ضبط الجرعة ودرجة الحرارة.", rating: 4.2, provenance: "مرجع EN 934-2", status: "نشط", materialSource: "system", isSystem: true,
    admixtureType: "retarder", waterReduction: 5, solidContent: 30, settingTimeImpact: 90, airPercentage: 2, ph: 7, chlorideContent: 0.01, alkaliContent: 1.0, settingModification: "تأخير", engineeringData: { density: 1150 }
  },
  {
    id: "SYS-ADM-ACC-001", name: "مضاف مسرع للشك", englishName: "Set Accelerating Admixture",
    type: "accelerator", category: "إضافات كيميائية", materialType: "إضافات كيميائية", density: 1400, recommendedDosage: 2,
    quality: "مرجع نظامي نموذجي وفق EN 934-2", uses: "Shotcrete والإصلاحات والطقس البارد",
    desc: "مضاف مسرع لبدء الشك واكتساب المقاومة المبكرة، ويجب التحقق من تأثيره على التسليح.", rating: 4.1, provenance: "مرجع EN 934-2", status: "نشط", materialSource: "system", isSystem: true,
    admixtureType: "accelerator", waterReduction: 0, solidContent: 45, settingTimeImpact: -60, airPercentage: 2, ph: 9, chlorideContent: 0.01, alkaliContent: 1.0, settingModification: "تسريع", engineeringData: { density: 1400 }
  },
  {
    id: "SYS-ADM-AE-001", name: "مضاف حابس للهواء", englishName: "Air Entraining Admixture",
    type: "air_entraining", category: "إضافات كيميائية", materialType: "إضافات كيميائية", density: 1020, recommendedDosage: 0.08,
    quality: "مرجع نظامي نموذجي وفق EN 934-2", uses: "خرسانة مقاومة للتجمد والذوبان والطرق",
    desc: "مضاف يولد فقاعات هواء دقيقة ومتوزعة لتحسين مقاومة دورات التجمد والذوبان.", rating: 4.3, provenance: "مرجع EN 934-2", status: "نشط", materialSource: "system", isSystem: true,
    admixtureType: "air_entraining", airPercentage: 5, waterReduction: 2, solidContent: 10, settingTimeImpact: 0, ph: 7, chlorideContent: 0.01, alkaliContent: 0.5, engineeringData: { density: 1020, targetAirPercent: 5 }
  },
  {
    id: "SYS-FIB-STEEL-001", name: "ألياف فولاذية مستقيمة", englishName: "Straight Steel Fibers",
    type: "fiber", category: "ألياف", materialType: "ألياف", density: 7850, fiberDensity: 7850, fiberDosageKgM3: 30,
    fiberType: "steel", fiberLengthMm: 35, fiberDiameterMm: 0.55, fiberDiameter: 0.55, aspectRatio: 64, elasticModulus: 200, tensileStrength: 1100, fiberTensileStrengthMPa: 1100,
    quality: "مرجع صناعي نموذجي", uses: "FRC وBFUP والأرضيات الصناعية والأنفاق", desc: "ألياف فولاذية لتحسين مقاومة الشد بعد التشقق والسيطرة على عرض الشروخ.",
    rating: 4.7, provenance: "مرجع صناعي", status: "نشط", materialSource: "system", isSystem: true, engineeringData: { density: 7850, dosageKgM3: 30 }
  },
  {
    id: "SYS-AGG-LWA-001", name: "ركام خفيف طيني ممدد", englishName: "Expanded Clay Lightweight Aggregate",
    type: "lightweight_aggregate", category: "ركام خفيف", materialType: "ركام", density: 1650, specificGravity: 1.65, bulkDensity: 850, absorption: 8, moisture: 4, dMax: 16, crushingResistance: 4.5,
    quality: "مرجع نظامي نموذجي وفق EN 13055", uses: "LWC وتقليل الوزن وتحسين العزل الحراري", desc: "ركام خفيف مسامي يحتاج ضبطًا صريحًا للماء والامتصاص قبل الخلط.",
    rating: 4.2, provenance: "مرجع EN 13055", status: "نشط", materialSource: "system", isSystem: true, aggregateQuality: "standard", engineeringData: { density: 1650, absorption: 8, dMax: 16 }
  },
  {
    id: "SYS-AGG-HWA-001", name: "ركام باريتي ثقيل", englishName: "Baryte Heavyweight Aggregate",
    type: "heavyweight_aggregate", category: "ركام ثقيل", materialType: "ركام", density: 4100, specificGravity: 4.10, bulkDensity: 2350, absorption: 1, moisture: 0.5, dMax: 20, bariumSulfate: 85,
    quality: "مرجع نظامي نموذجي للخرسانة الثقيلة", uses: "HWC والحماية من الإشعاع والمنشآت الطبية", desc: "ركام عالي الكثافة لرفع الكثافة الطازجة، ويتطلب مسار HWC متخصصًا.",
    rating: 4.3, provenance: "مرجع ASTM C637 نموذجي", status: "نشط", materialSource: "system", isSystem: true, aggregateQuality: "standard", engineeringData: { density: 4100, absorption: 1, dMax: 20, heavyweightType: "baryte" }
  },
  {
    id: "SYS-AGG-RCA-001", name: "ركام خشن معاد التدوير", englishName: "Recycled Coarse Aggregate",
    type: "recycled_aggregate", category: "ركام معاد التدوير", materialType: "ركام", density: 2450, specificGravity: 2.45, bulkDensity: 1350, absorption: 5, moisture: 4, dMax: 20, masonryContent: 8, losAngelesAbrasion: 35, finesContent: 2.5,
    quality: "مرجع نظامي نموذجي وفق EN 12620", uses: "RAC والطرق والمنشآت غير الحرجة بعد التحقق", desc: "ركام ناتج عن تكسير خرسانة سابقة مع امتصاص أعلى وتفاوت يحتاج توصيفًا مخبريًا.",
    rating: 4.0, provenance: "مرجع EN 12620", status: "نشط", materialSource: "system", isSystem: true, aggregateQuality: "standard", engineeringData: { density: 2450, absorption: 5, dMax: 20 }
  },
  {
    id: "SYS-WATER-POT-002", name: "ماء خلط مفحوص", englishName: "Tested Mixing Water",
    type: "water", category: "ماء", materialType: "ماء", density: 1000, quality: "مرجع نظامي نموذجي وفق EN 1008", uses: "جميع أنواع الخرسانة بعد التحقق الكيميائي", desc: "ماء خلط مطابق نموذجيًا مع حدود للكلوريدات والكبريتات والمواد الصلبة الذائبة.",
    rating: 4.8, provenance: "مرجع EN 1008", status: "نشط", materialSource: "system", isSystem: true, temperature: 20, suspendedSolids: 20, organicMatter: 2, engineeringData: { density: 1000, pH: 7, chlorideContent: 150, sulfateContent: 200, totalDissolvedSolids: 1000 }
  }
];
