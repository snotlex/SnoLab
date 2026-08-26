import { MaterialTestRecord } from "../types/laboratoryTypes";

export const SEEDED_MATERIAL_TESTS: MaterialTestRecord[] = [
  {
    id: "TEST-AGG-2026-001",
    testType: "AGG_SIEVE",
    testTitleAr: "التحليل الحبيبي بالغربلة (Sieve Analysis)",
    testTitleFr: "Analyse granulométrique par tamisage",
    testTitleEn: "Sieve Analysis of Aggregates",
    category: "aggregates",
    materialId: "sand_medium_01",
    materialName: "رمل سيليسي واد سوف 0/4 (Oued Souf Sand)",
    materialCategory: "رمال",
    sampleId: "SMP-SND-2026-088",
    sampleDescription: "عينة رمل سيليسي طبيعي مغسول ومجفف مخبرياً",
    projectId: "proj_alger_metro",
    projectName: "مشروع توسعة مترو الجزائر - محطة الحراش",
    operator: "Ing. Senoussi S.T.",
    laboratoryName: "SnoLab Central Materials Laboratory",
    date: "2026-08-20",
    standard: "NF EN 933-1 / ASTM C136",
    inputs: {
      totalWeight: 1000,
      sieves: [
        { sieve: 5.0, retained: 0 },
        { sieve: 4.0, retained: 20 },
        { sieve: 2.0, retained: 140 },
        { sieve: 1.0, retained: 210 },
        { sieve: 0.5, retained: 280 },
        { sieve: 0.25, retained: 220 },
        { sieve: 0.125, retained: 100 },
        { sieve: 0.063, retained: 20 },
        { sieve: 0.0, retained: 10 }
      ]
    },
    results: {
      finenessModulus: 2.65,
      dMax: 4.0,
      finesContent: 1.8,
      passingPercentages: {
        "5.0": 100,
        "4.0": 98,
        "2.0": 84,
        "1.0": 63,
        "0.5": 35,
        "0.25": 13,
        "0.125": 3,
        "0.063": 1
      }
    },
    status: "PASS",
    approvalStatus: "Validated",
    isDemo: true,
    sourceType: "system_demo",
    sourceLabel: "Demo Data",
    score: 98,
    interpretation: "رمل سيليسي ممتاز بمعامل نعومة مثالي FM = 2.65. تدرج حبيبي متوازن يوفر تشغيلية ممتازة وكثافة رص عالية مع استهلاك اقتصادي للإسمنت.",
    complianceDetails: [
      {
        parameter: "معامل النعومة (FM)",
        measured: 2.65,
        limit: "2.20 - 3.10 (NF EN 12620)",
        status: "PASS",
        note: "معامل نعومة مثالي للخرسانات المضخوخة والإنشائية"
      },
      {
        parameter: "نسبة المواد الناعمة (<0.063 مم)",
        measured: "1.8%",
        limit: "≤ 3.0%",
        status: "PASS",
        note: "نقاء عالي من الغضار والأتربة"
      }
    ],
    notes: "تمت المعايرة بواسطة موازين رقمية معتمدة وفق ISO 17025.",
    syncedToMaterial: true,
    syncedProperties: {
      finenessModulus: 2.65,
      dMax: 4.0
    },
    createdAt: "2026-08-20T10:30:00Z",
    updatedAt: "2026-08-20T10:30:00Z"
  },
  {
    id: "TEST-AGG-2026-002",
    testType: "AGG_SAND_EQUIVALENT",
    testTitleAr: "المكافئ الرملي (Sand Equivalent)",
    testTitleFr: "Équivalent de sable (ES & ESV)",
    testTitleEn: "Sand Equivalent Test",
    category: "aggregates",
    materialId: "sand_medium_01",
    materialName: "رمل سيليسي واد سوف 0/4 (Oued Souf Sand)",
    materialCategory: "رمال",
    sampleId: "SMP-SND-2026-089",
    sampleDescription: "فحص نسبة الطمي والمواد الغضارية في الرمل",
    projectId: "proj_alger_metro",
    projectName: "مشروع توسعة مترو الجزائر - محطة الحراش",
    operator: "Ing. Senoussi S.T.",
    laboratoryName: "SnoLab Central Materials Laboratory",
    date: "2026-08-21",
    standard: "NF EN 933-8 / NF P 18-598",
    inputs: {
      h1VisualMm: 112,
      h2SandMm: 92,
      h2PistonMm: 88
    },
    results: {
      esVisual: 82.1,
      esPiston: 78.6,
      sandCategory: "رمل نقي مطابق للخرسانات الإنشائية القياسية"
    },
    status: "PASS",
    approvalStatus: "Validated",
    isDemo: true,
    sourceType: "system_demo",
    sourceLabel: "Demo Data",
    score: 95,
    interpretation: "المكافئ الرملي بالمكبس 78.6% والبصري 82.1%. الرمل نقي ومطابق للحدود القياسية لخرسانات المنشآت الهندسية الكبرى.",
    complianceDetails: [
      {
        parameter: "المكافئ الرملي بالمكبس (ES Piston)",
        measured: "78.6%",
        limit: "≥ 75%",
        status: "PASS",
        note: "مطابق تماماً لمواصفات NF EN 933-8"
      }
    ],
    syncedToMaterial: true,
    createdAt: "2026-08-21T11:15:00Z",
    updatedAt: "2026-08-21T11:15:00Z"
  },
  {
    id: "TEST-AGG-2026-003",
    testType: "AGG_MOISTURE_CONTENT",
    testTitleAr: "نسبة الرطوبة الطبيعية (Moisture Content)",
    testTitleFr: "Teneur en eau des granulats",
    testTitleEn: "Moisture Content of Aggregates",
    category: "aggregates",
    materialId: "sand_medium_01",
    materialName: "رمل سيليسي واد سوف 0/4 (Oued Souf Sand)",
    materialCategory: "رمال",
    sampleId: "SMP-MOIST-2026-012",
    sampleDescription: "تحديد الرطوبة الفعلية لتصحيح ماء الخلط في المحطة",
    projectId: "proj_alger_metro",
    projectName: "مشروع توسعة مترو الجزائر - محطة الحراش",
    operator: "Technicien Labo SnoLab",
    laboratoryName: "SnoLab Central Materials Laboratory",
    date: "2026-08-24",
    standard: "NF EN 1097-5 / ASTM C566",
    inputs: {
      wetSampleWeightG: 1045,
      drySampleWeightG: 1000,
      tareWeightG: 0
    },
    results: {
      moisturePercent: 4.5
    },
    status: "PASS",
    approvalStatus: "Validated",
    isDemo: true,
    sourceType: "system_demo",
    sourceLabel: "Demo Data",
    score: 100,
    interpretation: "نسبة الرطوبة 4.5%. تم تطبيق تصحيح ماء الخلط الفوري في محطة الخلط المركزية لضمان نسبة W/C مطابقة للتصميم.",
    complianceDetails: [
      {
        parameter: "نسبة الرطوبة الحقلية w (%)",
        measured: "4.5%",
        limit: "0 - 8%",
        status: "PASS",
        note: "تستوجب خصم 4.5% من وزن الرمل ماءً من مياه الخلط وإضافتها لوزن الرمل الرطب"
      }
    ],
    syncedToMaterial: true,
    syncedProperties: {
      moisture: 4.5
    },
    createdAt: "2026-08-24T08:00:00Z",
    updatedAt: "2026-08-24T08:00:00Z"
  },
  {
    id: "TEST-AGG-2026-004",
    testType: "AGG_LOS_ANGELES",
    testTitleAr: "معامل لوس أنجلوس للتفتت (Los Angeles Abrasion)",
    testTitleFr: "Essai Los Angeles des gravillons",
    testTitleEn: "Los Angeles Abrasion Test",
    category: "aggregates",
    materialId: "gravel_15_25_01",
    materialName: "حصى كلسي مكسر 8/15 (Crushed Limestone Gravel)",
    materialCategory: "حصى",
    sampleId: "SMP-GRV-LA-001",
    sampleDescription: "عينة حصى مكسر خشن لاختبار الصلابة ومقاومة التفتت",
    projectId: "proj_highway_eastwest",
    projectName: "مشروع صيانة منشآت الطريق السيار شرق-غرب",
    operator: "Ing. Senoussi S.T.",
    laboratoryName: "SnoLab Central Materials Laboratory",
    date: "2026-08-18",
    standard: "NF EN 1097-2 / ASTM C131",
    inputs: {
      initialWeightG: 5000,
      retainedOn1_6mmG: 3950
    },
    results: {
      laPercent: 21.0,
      laClass: "LA25 (ممتاز للخرسانات الإنشائية والجسور)"
    },
    status: "PASS",
    approvalStatus: "Validated",
    isDemo: true,
    sourceType: "system_demo",
    sourceLabel: "Demo Data",
    score: 96,
    interpretation: "معامل لوس أنجلوس LA = 21.0% (تصنيف LA25). الحصى يتميز بصلابة صخرية عالية ومقاومة فائقة للصدم الميكانيكي.",
    complianceDetails: [
      {
        parameter: "معامل التفتت LA (%)",
        measured: "21.0%",
        limit: "≤ 25% (NF EN 1097-2)",
        status: "PASS",
        note: "صخر كلسي دولوميتي عالي المتانة"
      }
    ],
    syncedToMaterial: true,
    syncedProperties: {
      losAngelesAbrasion: 21.0
    },
    createdAt: "2026-08-18T14:00:00Z",
    updatedAt: "2026-08-18T14:00:00Z"
  },
  {
    id: "TEST-CEM-2026-001",
    testType: "CEM_MECHANICAL_STRENGTH",
    testTitleAr: "فحص مقاومة الإسمنت المعيارية (Cement Strength)",
    testTitleFr: "Résistance mécanique du ciment EN 196-1",
    testTitleEn: "Cement Standard Mortar Strength",
    category: "cement",
    materialId: "cement_cem_ii_425",
    materialName: "إسمنت بورتلاندي مركب CEM II/A-L 42.5N (Lafarge M'Sila)",
    materialCategory: "إسمنت",
    sampleId: "SMP-CEM-MSILA-042",
    sampleDescription: "عينات مواشير المونة المعيارية 40×40×160 مم",
    projectId: "proj_alger_metro",
    projectName: "مشروع توسعة مترو الجزائر - محطة الحراش",
    operator: "Ing. Senoussi S.T.",
    laboratoryName: "SnoLab Central Materials Laboratory",
    date: "2026-08-15",
    standard: "NF EN 196-1 / NF EN 197-1",
    inputs: {
      strengthClass: "42.5",
      strength2d: 22.4,
      strength7d: 36.8,
      strength28d: 48.5,
      blaineCm2G: 3650,
      normalConsistencyPercent: 27.2,
      initialSettingMin: 145,
      finalSettingMin: 230,
      soundnessExpansionMm: 1.2
    },
    results: {
      strength2d: 22.4,
      strength7d: 36.8,
      strength28d: 48.5,
      blaineCm2G: 3650,
      normalConsistencyPercent: 27.2,
      initialSettingMin: 145,
      soundnessExpansionMm: 1.2
    },
    status: "PASS",
    approvalStatus: "Validated",
    isDemo: true,
    sourceType: "system_demo",
    sourceLabel: "Demo Data",
    score: 99,
    interpretation: "إسمنت عالي الجودة CEM II/A-L 42.5N يحقق مقاومة 48.5 MPa عند 28 يوماً (الحد الأدنى 42.5 MPa) وزمن شك ابتدائي 145 دقيقة مع ثبات حجمي مثالي 1.2 مم.",
    complianceDetails: [
      {
        parameter: "مقاومة الضغط 28 يوم",
        measured: "48.5 MPa",
        limit: "≥ 42.5 MPa (NF EN 197-1)",
        status: "PASS",
        note: "فائض أمان +6.0 MPa فوق الصنف المعياري"
      },
      {
        parameter: "زمن الشك الابتدائي",
        measured: "145 دقيقة",
        limit: "≥ 60 دقيقة",
        status: "PASS",
        note: "وقت كافٍ للتشغيل والضخ"
      },
      {
        parameter: "النعومة السطحية لبلين",
        measured: "3650 cm²/g",
        limit: "≥ 2800 cm²/g",
        status: "PASS",
        note: "توزيع حبيبي ناعم يسرع الإماهة"
      }
    ],
    syncedToMaterial: true,
    syncedProperties: {
      strengthClass: "42.5"
    },
    createdAt: "2026-08-15T09:00:00Z",
    updatedAt: "2026-08-15T09:00:00Z"
  },
  {
    id: "TEST-WAT-2026-001",
    testType: "WATER_QUALITY",
    testTitleAr: "فحص جودة مياه الخلط (Water Quality Analysis)",
    testTitleFr: "Analyse de conformité de l'eau de gâchage EN 1008",
    testTitleEn: "Mixing Water Quality Analysis",
    category: "water",
    materialId: "water_tap_01",
    materialName: "مياه شبكة الشرب المعالجة (Treated Potable Water)",
    materialCategory: "ماء",
    sampleId: "SMP-WAT-NET-01",
    sampleDescription: "عينة مياه من خزان محطة الخرسانة الجاهزة",
    projectId: "proj_alger_metro",
    projectName: "مشروع توسعة مترو الجزائر - محطة الحراش",
    operator: "Chimiste Labo SnoLab",
    laboratoryName: "SnoLab Central Materials Laboratory",
    date: "2026-08-22",
    standard: "NF EN 1008 / ISO 10523",
    inputs: {
      pH: 7.4,
      chloridesMgL: 140,
      sulfatesMgL: 210,
      tdsMgL: 480,
      organicMatterMgL: 12
    },
    results: {
      pH: 7.4,
      chloridesMgL: 140,
      sulfatesMgL: 210,
      tdsMgL: 480
    },
    status: "PASS",
    approvalStatus: "Validated",
    isDemo: true,
    sourceType: "system_demo",
    sourceLabel: "Demo Data",
    score: 100,
    interpretation: "مياه الخلط نقية ومعتدلة الحموضة (pH 7.4) ونسب الكلوريدات والكبريتات منخفضة جداً وضمن حدود الأمان التام لمواصفة NF EN 1008.",
    complianceDetails: [
      {
        parameter: "درجة الحموضة (pH)",
        measured: 7.4,
        limit: "5.5 - 9.0 (NF EN 1008)",
        status: "PASS",
        note: "وسط معتدل مثالي"
      },
      {
        parameter: "محتوى الكلوريدات (Cl⁻)",
        measured: "140 mg/L",
        limit: "≤ 500 mg/L",
        status: "PASS",
        note: "آمن تماماً للتسليح المعدني"
      },
      {
        parameter: "محتوى الكبريتات (SO₄²⁻)",
        measured: "210 mg/L",
        limit: "≤ 2000 mg/L",
        status: "PASS",
        note: "خالٍ من مسببات التآكل الكبريتي"
      }
    ],
    syncedToMaterial: true,
    createdAt: "2026-08-22T13:00:00Z",
    updatedAt: "2026-08-22T13:00:00Z"
  },
  {
    id: "TEST-ADM-2026-001",
    testType: "ADMIX_PERFORMANCE",
    testTitleAr: "فحص الملدن الفائق وتخفيض الماء (Superplasticizer Test)",
    testTitleFr: "Caractérisation du Superplastifiant EN 934-2",
    testTitleEn: "Superplasticizer Performance Characterization",
    category: "admixtures",
    materialId: "admixture_sika_viscocrete",
    materialName: "ملدن فائق بولي كربوكسيل Sika ViscoCrete 20-HE",
    materialCategory: "إضافات كيميائية",
    sampleId: "SMP-ADM-SIKA-09",
    sampleDescription: "مضاف عالي الكفاءة لتخفيض المياه وزيادة الهبوط والمقاومة المبكرة",
    projectId: "proj_alger_metro",
    projectName: "مشروع توسعة مترو الجزائر - محطة الحراش",
    operator: "Ing. Senoussi S.T.",
    laboratoryName: "SnoLab Central Materials Laboratory",
    date: "2026-08-19",
    standard: "NF EN 934-2 / NF EN 480",
    inputs: {
      densityGPerCm3: 1.08,
      pH: 5.8,
      solidContentPercent: 32.0,
      waterReductionPercent: 24.5,
      settingTimeDiffMin: 15
    },
    results: {
      densityGPerCm3: 1.08,
      pH: 5.8,
      solidContentPercent: 32.0,
      waterReductionPercent: 24.5,
      settingTimeDiffMin: 15
    },
    status: "PASS",
    approvalStatus: "Validated",
    isDemo: true,
    sourceType: "system_demo",
    sourceLabel: "Demo Data",
    score: 97,
    interpretation: "ملدن فائق مطابق لمواصفات NF EN 934-2 جدول 3.1. يحقق تخفيض ماء قياسي بنسبة 24.5% مع احتفاظ ممتاز بالسيولة والتشغيلية.",
    complianceDetails: [
      {
        parameter: "قدرة تخفيض الماء",
        measured: "24.5%",
        limit: "≥ 12% (NF EN 934-2)",
        status: "PASS",
        note: "تخفيض عالي جداً يرفع المقاومة"
      },
      {
        parameter: "المحتوى الصلب (Dry Extract)",
        measured: "32.0%",
        limit: "32.0 ± 1.5%",
        status: "PASS",
        note: "تركيز بوليميري ثابت وموثوق"
      }
    ],
    syncedToMaterial: true,
    syncedProperties: {
      waterReduction: 24.5,
      recommendedDosage: 1.2
    },
    createdAt: "2026-08-19T15:30:00Z",
    updatedAt: "2026-08-19T15:30:00Z"
  }
];

export const INITIAL_MATERIAL_TESTS = SEEDED_MATERIAL_TESTS;
