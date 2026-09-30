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
  },
  {
    id: "SYS-FIL-SCC-001", name: "فيلر حجر جيري فائق النعومة لـ SCC", englishName: "Ultra-Fine Limestone Filler for SCC", type: "filler", category: "مواد مالئة", materialType: "مواد مالئة", density: 2700, bulkDensity: 980, blaineFineness: 5200, finesUnder63um: 96, calciumCarbonate: 97, methyleneBlue: 0.45,
    quality: "مرجع نموذجي وفق EN 12620 وEN 1097-3", uses: "SCC وBAP، زيادة محتوى المسحوق وضبط اللزوجة ومقاومة الانفصال", desc: "مسحوق كلسي مضبوط التدرج يرفع حجم العجينة ويحسن الاستقرار والانسياب في الخرسانة ذاتية الرص.", rating: 4.7, provenance: "مرجع مواد مالئة كلسية", status: "نشط", materialSource: "system", isSystem: true, approvalStatus: "Approved", engineeringData: { density: 2700, bulkDensity: 980, finesUnder63um: 96, calciumCarbonate: 97, recommendedUse: "SCC" }
  },
  {
    id: "SYS-ADM-VMA-001", name: "معدل لزوجة VMA مانع للانفصال", englishName: "Viscosity Modifying Agent VMA", type: "vma", category: "إضافات كيميائية", materialType: "إضافات كيميائية", density: 1050, admixtureType: "superplasticizer", recommendedDosage: 0.35, waterReduction: 0, solidContent: 20, settingTimeImpact: 10, airPercentage: 0, ph: 7, chlorideContent: 0.01, alkaliContent: 0.5,
    quality: "مرجع نموذجي لمضافات ضبط اللزوجة", uses: "SCC وBAP والخرسانة المضخوخة ومنع الانفصال والنزف", desc: "معدل لزوجة سائل يرفع تماسك العجينة ويحافظ على تجانس الركام أثناء التدفق، ويستخدم بعد اختبار التوافق مع الملدن الفائق.", rating: 4.5, provenance: "مرجع EN 934-2 / EFNARC", status: "نشط", materialSource: "system", isSystem: true, approvalStatus: "Approved", compatibilityNotes: "لا يستبدل الملدن الفائق؛ تضبط الجرعة مع اختبار Slump Flow وV-funnel.", engineeringData: { density: 1050, admixtureType: "vma", recommendedDosage: 0.35 }
  },
  {
    id: "SYS-ADM-GPC-ACT-001", name: "محلول منشط قلوي سيليكات الصوديوم وهيدروكسيد الصوديوم", englishName: "Sodium-Silicate Sodium-Hydroxide Alkaline Activator", type: "alkaline_activator", category: "إضافات كيميائية", materialType: "منشط قلوي", density: 1380, admixtureType: "alkaline_activator", recommendedDosage: 4.5, waterReduction: 0, solidContent: 48, settingTimeImpact: 0, airPercentage: 0, ph: 10, chlorideContent: 0, alkaliContent: 5.5,
    quality: "مرجع تركيبي لخرسانة GPC؛ يلزم اعتماد التركيب الفعلي", uses: "GPC والخرسانة الجيوبوليمرية الخالية من الإسمنت البورتلاندي", desc: "سائل تنشيط قلوي يضاف إلى الرماد المتطاير أو الخبث لتكوين الرابط الجيوبوليمري، وتحدد نسبة السيليكات/الهيدروكسيد والماء في المختبر.", rating: 4.4, provenance: "مرجع GPC تجريبي", status: "نشط", materialSource: "system", isSystem: true, approvalStatus: "Approved", compatibilityNotes: "مادة كاوية؛ يجب توثيق المولارية ونسبة SiO2/Na2O وإجراء اختبار معالجة حرارية.", engineeringData: { density: 1380, activatorToPrecursorRatio: 0.45, alkalineRatio: 13.5, actualPH: 13.5 }
  },
  {
    id: "SYS-ADM-SHC-001", name: "مضاف بلوري للمعالجة الذاتية للشروخ", englishName: "Crystalline Self-Healing Concrete Admixture", type: "self_healing", category: "إضافات كيميائية", materialType: "عامل معالجة ذاتية", density: 1200, admixtureType: "self_healing", recommendedDosage: 2, waterReduction: 0, solidContent: 50, settingTimeImpact: 0, airPercentage: 0, ph: 10, chlorideContent: 0, alkaliContent: 0.2, healingAgentDosageKgM3: 7, healingAgentDensityKgM3: 1200, healingAgentType: "crystalline_capillary_waterproofing",
    quality: "مرجع تقني تجريبي؛ لا يغني عن تحقق كفاءة الالتئام", uses: "SHC والمنشآت المائية والخزانات والأنفاق والعناصر التي يصعب صيانتها", desc: "مركب بلوري يتفاعل مع الرطوبة لتكوين بلورات تسد المسارات الشعرية؛ تدخل كتلته وحجمه صراحة في حساب الخلطة.", rating: 4.2, provenance: "مرجع مواد المعالجة الذاتية", status: "نشط", materialSource: "system", isSystem: true, approvalStatus: "Approved", compatibilityNotes: "يجب قياس عرض الشرخ وكفاءة الغلق والاحتفاظ بالمقاومة بعد دورات البلل والجفاف.", engineeringData: { density: 1200, dosageKgM3: 7, dosagePercentOfCement: 2, healingAgentType: "crystalline_capillary_waterproofing" }
  },
  {
    id: "SYS-SND-UHPC-001", name: "رمل كوارتزي نقي متدرج لـ UHPC/BFUP", englishName: "High-Purity Graded Quartz Sand for UHPC/BFUP", type: "sand", category: "رمال", materialType: "ركام ناعم", density: 2650, specificGravity: 2.65, bulkDensity: 1550, absorption: 0.3, moisture: 0.2, finenessModulus: 2.15, dMax: 1.0, dMin: 0.063, sandEquivalent: 98, methyleneBlue: 0.2, finesContent: 1, clayContent: 0.2, foisonnement: 4, organicImpurities: "سليم", chlorideContent: 0.01, sulfateContent: 0.05, particleShape: "مستدير",
    quality: "رمل سيليسي عالي النقاوة لخلطات UHPC/BFUP", uses: "UHPC وBFUP والملاط عالي الكثافة والوصلات الرقيقة سابقة الإجهاد", desc: "رمل كوارتزي منخفض الامتصاص وثابت التدرج لتقليل الفراغات وتحقيق تعبئة حبيبية دقيقة دون ركام خشن.", rating: 4.9, provenance: "مرجع رمل كوارتزي عالي النقاوة", status: "نشط", materialSource: "system", isSystem: true, approvalStatus: "Approved", engineeringData: { density: 2650, finenessModulus: 2.15, dMax: 1, silicaContent: 99 }
  },
  {
    id: "SYS-FIB-MICRO-STEEL-001", name: "ألياف فولاذية ميكروية عالية الشد", englishName: "High-Tensile Micro Steel Fibers for UHPC/BFUP", type: "fiber", category: "ألياف", materialType: "ألياف", density: 7850, fiberDensity: 7850, fiberDosageKgM3: 156, fiberType: "steel", fiberLengthMm: 13, fiberDiameterMm: 0.20, fiberDiameter: 0.20, aspectRatio: 65, elasticModulus: 200, tensileStrength: 2500, fiberTensileStrengthMPa: 2500,
    quality: "مرجع ألياف ميكروية لرفع المطيلية بعد التشقق", uses: "BFUP وUHPC والعناصر الرقيقة والوصلات عالية المقاومة", desc: "ألياف فولاذية دقيقة عالية الشد تضاف تدريجياً بعد اكتمال تجانس العجينة لمنع التكتل، وتحدد الجرعة بالحجم أو الكتلة.", rating: 4.9, provenance: "مرجع صناعي لألياف UHPC", status: "نشط", materialSource: "system", isSystem: true, approvalStatus: "Approved", engineeringData: { density: 7850, dosageKgM3: 156, volumePercent: 2, tensileStrengthMPa: 2500 }
  },
  {
    id: "SYS-AGG-PERVIOUS-001", name: "حصى بازلتي أحادي التدرج 8/16 مم للخرسانة النفاذة", englishName: "Single-Size Basalt Aggregate 8/16 mm for Pervious Concrete", type: "gravel", category: "حصى", materialType: "ركام خشن", density: 2850, specificGravity: 2.85, ssdDensity: 2850, bulkDensity: 1550, absorption: 0.8, moisture: 1, dMax: 16, dMin: 8, nominalSize: 12, losAngelesAbrasion: 16, microDeval: 10, crushingValue: 18, flakinessIndex: 12, elongationIndex: 15, finesContent: 1, chlorideContent: 0.01, sulfateContent: 0.05, particleShape: "مكسر", aggregateQuality: "excellent",
    quality: "ركام أحادي المقاس منخفض التآكل للخرسانة النفاذة", uses: "PERVIOUS وتصريف مياه الأمطار والمواقف والممرات والأرصفة", desc: "ركام خشن متجانس يحافظ على الفراغات المتصلة، مع كثافة سائبة مسجلة لحساب المسامية وحجم العجينة.", rating: 4.8, provenance: "مرجع ركام بازلتي", status: "نشط", materialSource: "system", isSystem: true, approvalStatus: "Approved", engineeringData: { density: 2850, bulkDensity: 1550, dMax: 16, targetVoidContent: 20 }
  },
  {
    id: "SYS-CEM-MASS-001", name: "إسمنت منخفض حرارة الإماهة للخرسانة الكتلية", englishName: "Low-Heat Cement for Mass Concrete", type: "cement", category: "إسمنت", materialType: "مادة رابطة", cementClass: "CEM III/A 42.5 N LH", strengthClass: 42.5, density: 3000, specificGravity: 3.0, bulkDensity: 1080, blaineFineness: 3950, standardConsistency: 29, initialSetting: 165, finalSetting: 240, soundness: 0.8, heatOfHydration: 210, strength2d: 15, strength7d: 28, strength28d: 46, lossOnIgnition: 1.5, insolubleResidue: 0.8, sulfateContent: 2.8, chlorideContent: 0.02, alkaliEquivalent: 0.65,
    quality: "مرجع منخفض الحرارة وفق EN 197-1؛ يعتمد التصنيف النهائي على شهادة المصنع", uses: "MASS وRCC والسدود والقواعد والحصائر والكتل الخرسانية السميكة", desc: "رابط إسمنتي منخفض حرارة الإماهة يحد من الذروة الحرارية والتدرجات الحرارية في الصبات الكبيرة، مع ضرورة محاكاة الحرارة بالموقع.", rating: 4.7, provenance: "مرجع EN 197-1 / CEM III", status: "نشط", materialSource: "system", isSystem: true, approvalStatus: "Approved", engineeringData: { density: 3000, heatOfHydration: 210, lowHeat: true }
  }
];
