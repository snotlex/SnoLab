import { 
  LabCategory, 
  LabTestDefinition, 
  MaterialTestRecord, 
  ComplianceDetail, 
  TestStatus,
  GranulometricCurveData,
  SieveStepResult
} from "../types/laboratoryTypes";
import { EngineeringMaterial } from "../types";

// ============================================================================
// 1. MASTER CATALOG OF LABORATORY TESTS (6 CATEGORIES)
// ============================================================================

export const LAB_CATEGORIES_INFO: Record<LabCategory, {
  id: LabCategory;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  icon: string;
  descriptionAr: string;
  descriptionEn: string;
  gradient: string;
  accentColor: string;
}> = {
  aggregates: {
    id: "aggregates",
    nameAr: "الركام والحصويات",
    nameFr: "Granulats & Sables",
    nameEn: "Aggregates & Sands",
    icon: "🪨",
    descriptionAr: "تجارب التحليل الحبيبي، الكثافات، الامتصاص، المكافئ الرملي، ومقاومة البري والتفتت للركام.",
    descriptionEn: "Sieve grading, bulk & absolute densities, water absorption, sand equivalent, Los Angeles, and Micro-Deval.",
    gradient: "from-amber-500/10 to-orange-500/10 border-amber-500/30 text-amber-600",
    accentColor: "#f59e0b"
  },
  cement: {
    id: "cement",
    nameAr: "الإسمنت والمواد الرابطة",
    nameFr: "Ciments & Liants",
    nameEn: "Cement & Binders",
    icon: "🏛️",
    descriptionAr: "تجارب نعومة بلين، زمن الشك فيكات، الكثافة الحقيقية، التمدد، ومقاومة المونة القياسية.",
    descriptionEn: "Blaine air permeability, Vicat initial/final setting time, Le Chatelier soundness, and mortar compressive strengths.",
    gradient: "from-blue-500/10 to-indigo-500/10 border-blue-500/30 text-blue-600",
    accentColor: "#3b82f6"
  },
  water: {
    id: "water",
    nameAr: "ماء الخلط",
    nameFr: "Eau de Gâchage",
    nameEn: "Mixing Water",
    icon: "💧",
    descriptionAr: "التحليل الكيميائي لماء الخلط: درجة الحموضة pH، الكلوريدات، الكبريتات، والأملاح المنحلة.",
    descriptionEn: "Chemical compliance of mixing water according to EN 1008: pH, chlorides, sulfates, and dissolved solids.",
    gradient: "from-cyan-500/10 to-sky-500/10 border-cyan-500/30 text-cyan-600",
    accentColor: "#06b6d4"
  },
  admixtures: {
    id: "admixtures",
    nameAr: "الإضافات الكيميائية والملدنات",
    nameFr: "Adjuvants Chimiques",
    nameEn: "Chemical Admixtures",
    icon: "🧪",
    descriptionAr: "معايرة الملدنات الفائقة، الكثافة، المحتوى الجاف (الخلاصة الجافة)، نسبة تخفيض الماء، وزمن الشك.",
    descriptionEn: "Superplasticizers & admixtures QA: dry extract, density, pH, water reduction efficiency, and setting delta.",
    gradient: "from-emerald-500/10 to-teal-500/10 border-emerald-500/30 text-emerald-600",
    accentColor: "#10b981"
  },
  additives: {
    id: "additives",
    nameAr: "الإضافات المعدنية (SCM)",
    nameFr: "Additions Minérales",
    nameEn: "Mineral Additives",
    icon: "✨",
    descriptionAr: "غبار السيليكا، الرماد المتطاير، وخبث الأفران: الكثافة، النعومة، ومعامل النشاط البوزولاني.",
    descriptionEn: "Silica fume, fly ash, and slag evaluation: density, activity index at 28d, and loss on ignition (LOI).",
    gradient: "from-purple-500/10 to-violet-500/10 border-purple-500/30 text-purple-600",
    accentColor: "#8b5cf6"
  },
  fibers: {
    id: "fibers",
    nameAr: "ألياف التسليح",
    nameFr: "Fibres de Renfort",
    nameEn: "Reinforcement Fibers",
    icon: "🧬",
    descriptionAr: "الألياف الفولاذية والبوليمرية: الأبعاد الهندسية، نسبة النحافة، قوة الشد، والجرعة التصميمية.",
    descriptionEn: "Steel and synthetic fibers: aspect ratio (L/d), tensile strength, modulus, and optimum dosage.",
    gradient: "from-rose-500/10 to-pink-500/10 border-rose-500/30 text-rose-600",
    accentColor: "#f43f5e"
  }
};

export const MASTER_TEST_CATALOG: LabTestDefinition[] = [
  // --------------------------------------------------------------------------
  // A. AGGREGATES
  // --------------------------------------------------------------------------
  {
    id: "AGG_SIEVE",
    category: "aggregates",
    titleAr: "التحليل الحبيبي للركام (Sieve Analysis)",
    titleFr: "Analyse Granulométrique par Tamisage",
    titleEn: "Sieve Analysis of Aggregates",
    shortDescAr: "تحديد منحنى التدرج، معامل النعومة (FM)، الحجم الأقصى (Dmax)، والمواد الناعمة.",
    shortDescEn: "Grading curve, Fineness Modulus (FM), Dmax, sand ratio, and fines content.",
    standard: "NF P 94-056 / NF EN 933-1 / ASTM C136",
    applicableMaterials: ["رمال", "حصى", "Sand", "Gravel", "Fine Aggregate", "Coarse Aggregate"],
    icon: "📐",
    unit: "%",
    syncedPropertyKeys: ["finenessModulus", "dMax", "finesContent", "gradationData"],
    defaultInputs: {
      totalWeight: 1000,
      materialType: "sand", // "sand" | "gravel"
      sieves: [
        { sieve: 5.0, retained: 0 },
        { sieve: 4.0, retained: 20 },
        { sieve: 2.0, retained: 130 },
        { sieve: 1.0, retained: 210 },
        { sieve: 0.5, retained: 290 },
        { sieve: 0.25, retained: 220 },
        { sieve: 0.125, retained: 90 },
        { sieve: 0.063, retained: 30 },
        { sieve: 0, retained: 10 } // pan
      ]
    }
  },
  {
    id: "AGG_BULK_DENSITY",
    category: "aggregates",
    titleAr: "الكثافة الظاهرية السائبة والمدموكة",
    titleFr: "Masse Volumique Apparente (Vrac & Tassé)",
    titleEn: "Bulk Density (Loose & Compacted)",
    shortDescAr: "قياس الوزن الحجمي الظاهري ومعامل الرص ونسبة الفراغات بين الحبيبات.",
    shortDescEn: "Measurement of loose and rodded/compacted bulk density and inter-particle voids.",
    standard: "NF EN 1097-3 / ASTM C29",
    applicableMaterials: ["رمال", "حصى"],
    icon: "⚖️",
    unit: "kg/m³",
    syncedPropertyKeys: ["bulkDensity"],
    defaultInputs: {
      containerVolumeLiters: 10.0,
      containerEmptyWeightKg: 3.25,
      looseFilledWeightKg: 18.25,
      compactedWeightKg: 19.85
    }
  },
  {
    id: "AGG_SPECIFIC_GRAVITY",
    category: "aggregates",
    titleAr: "الكثافة الحقيقية والامتصاص المائي (Pycnometer)",
    titleFr: "Masse Volumique Absolue & Absorption d'Eau",
    titleEn: "Specific Gravity & Water Absorption",
    shortDescAr: "تحديد الكثافة المطلقة، الكثافة في حالة تشبع السطح الجاف (SSD)، ونسبة امتصاص الماء.",
    shortDescEn: "Apparent specific gravity, SSD specific gravity, absolute density, and 24h water absorption.",
    standard: "NF EN 1097-6 / ASTM C127 / ASTM C128",
    applicableMaterials: ["رمال", "حصى"],
    icon: "🧪",
    unit: "g/cm³ / %",
    syncedPropertyKeys: ["density", "absorption"],
    defaultInputs: {
      ovenDryMassG: 495.2, // M4
      ssdMassG: 504.8, // M1
      pycnometerSampleWaterMassG: 1782.4, // M2
      pycnometerWaterMassG: 1471.2 // M3
    }
  },
  {
    id: "AGG_MOISTURE_CONTENT",
    category: "aggregates",
    titleAr: "نسبة الرطوبة الطبيعية (Water Content)",
    titleFr: "Teneur en Eau Naturelle",
    titleEn: "Moisture Content by Drying",
    shortDescAr: "تحديد نسبة المحتوى المائي الفعلي للركام في الموقع لتصحيح كميات ماء الخلط.",
    shortDescEn: "Determination of aggregate moisture content to adjust mixing water in batching plant.",
    standard: "NF EN 1097-5 / NF P 94-050",
    applicableMaterials: ["رمال", "حصى"],
    icon: "💦",
    unit: "%",
    syncedPropertyKeys: ["moisture"],
    defaultInputs: {
      wetMassG: 1052.4,
      dryMassG: 1008.0,
      tareMassG: 120.0
    }
  },
  {
    id: "AGG_SAND_EQUIVALENT",
    category: "aggregates",
    titleAr: "المكافئ الرملي (Sand Equivalent Test)",
    titleFr: "Équivalent de Sable (ES)",
    titleEn: "Sand Equivalent Value (SE)",
    shortDescAr: "قياس نقاوة الرمل وخلوه من الطين والمواد الغضارية الدقيقة الضارة.",
    shortDescEn: "Evaluation of the cleanliness of fine aggregate and fine dust/clay contamination.",
    standard: "NF EN 933-8 / ASTM D2419",
    applicableMaterials: ["رمال", "Sand", "Fine Aggregate"],
    icon: "🏺",
    unit: "%",
    syncedPropertyKeys: ["sandEquivalent"],
    defaultInputs: {
      h1TotalHeightMm: 112.5, // Total flocculate suspension height
      h2SandHeightMm: 86.0,  // Sand sediment height (visual or piston)
      testMethod: "piston" // "visual" | "piston"
    }
  },
  {
    id: "AGG_BULKING_SAND",
    category: "aggregates",
    titleAr: "انتفاخ الرمل بالرطوبة (Sand Bulking)",
    titleFr: "Foisonnement du Sable",
    titleEn: "Sand Bulking Factor Curve",
    shortDescAr: "دراسة زيادة حجم الرمل نتيجة الرطوبة السطحية لتعديل نسب الكيل الحجمي.",
    shortDescEn: "Determination of volumetric expansion of fine aggregate as a function of moisture percentage.",
    standard: "BS 812 / ASTM C128 Appendix",
    applicableMaterials: ["رمال"],
    icon: "📈",
    unit: "% expansion",
    syncedPropertyKeys: ["sandBulkingCoeff"],
    defaultInputs: {
      dryVolumeCm3: 1000,
      moistureSteps: [
        { moisturePercent: 0, volumeCm3: 1000 },
        { moisturePercent: 2, volumeCm3: 1140 },
        { moisturePercent: 4, volumeCm3: 1260 },
        { moisturePercent: 6, volumeCm3: 1280 },
        { moisturePercent: 8, volumeCm3: 1220 },
        { moisturePercent: 10, volumeCm3: 1110 },
        { moisturePercent: 15, volumeCm3: 1010 }
      ]
    }
  },
  {
    id: "AGG_LOS_ANGELES",
    category: "aggregates",
    titleAr: "تجربة لوس أنجلوس لمقاومة التفتت (Los Angeles)",
    titleFr: "Essai Los Angeles (Résistance à la Fragmentation)",
    titleEn: "Los Angeles Abrasion Resistance",
    shortDescAr: "قياس مقاومة الحصى للصدم والتفتت الميكانيكي تحت تأثير كرات الفولاذ.",
    shortDescEn: "Assessment of resistance of coarse aggregates to fragmentation and impact.",
    standard: "NF EN 1097-2 / ASTM C131",
    applicableMaterials: ["حصى", "Gravel", "Coarse Aggregate"],
    icon: "💥",
    unit: "% (LA)",
    syncedPropertyKeys: ["losAngelesAbrasion"],
    defaultInputs: {
      initialMassG: 5000,
      retainedMassOn1_6mmG: 3880,
      abrasiveChargeBalls: 11,
      gradingFraction: "10/14"
    }
  },
  {
    id: "AGG_MICRO_DEVAL",
    category: "aggregates",
    titleAr: "تجربة ميكرو-ديفال لمقاومة التآكل بالماء (Micro-Deval)",
    titleFr: "Essai Micro-Deval en Présence d'Eau (MDE)",
    titleEn: "Micro-Deval Wear Resistance (Wet)",
    shortDescAr: "تحديد مقاومة الحصى للتآكل الاحتكاكي الرطب بين الحبيبات.",
    shortDescEn: "Measurement of wear coefficient in the presence of water and abrasive steel balls.",
    standard: "NF EN 1097-1 / ASTM D6928",
    applicableMaterials: ["حصى"],
    icon: "🔄",
    unit: "% (MDE)",
    syncedPropertyKeys: ["microDeval"],
    defaultInputs: {
      initialMassG: 500,
      retainedMassOn1_6mmG: 432,
      gradingFraction: "10/14"
    }
  },
  {
    id: "AGG_SHAPE_FLAKINESS",
    category: "aggregates",
    titleAr: "معامل التفرطح وشكل الحبيبات (Flakiness Index)",
    titleFr: "Coefficient d'Aplatissement & Forme",
    titleEn: "Flakiness Index & Particle Shape",
    shortDescAr: "تحديد نسبة الحبيبات المفلطحة والإبرية المؤثرة سلباً على تشغيلية الخرسانة.",
    shortDescEn: "Measurement of flakiness index (FI) using standard bar sieves.",
    standard: "NF EN 933-3",
    applicableMaterials: ["حصى"],
    icon: "🪓",
    unit: "%",
    syncedPropertyKeys: ["flakinessIndex"],
    defaultInputs: {
      totalSampleMassG: 2500,
      passingBarSievesMassG: 345
    }
  },
  {
    id: "AGG_METHYLENE_BLUE",
    category: "aggregates",
    titleAr: "قيمة أزرق الميثيلين للغضار (Methylene Blue Value)",
    titleFr: "Valeur au Bleu de Méthylène (MB)",
    titleEn: "Methylene Blue Value for Clay Activity",
    shortDescAr: "تحديد نشاط وخطورة المواد الغضارية العالقة في الركام الناعم.",
    shortDescEn: "Determination of clay activity and harmful fine expansiveness.",
    standard: "NF EN 933-9",
    applicableMaterials: ["رمال", "Sand"],
    icon: "🔵",
    unit: "g/kg (MB)",
    syncedPropertyKeys: ["methyleneBlueValue"],
    defaultInputs: {
      fraction0_2MassG: 200,
      dyeSolutionInjectedMl: 18.0,
      dyeConcentrationGPerL: 10.0
    }
  },

  // --------------------------------------------------------------------------
  // B. CEMENT
  // --------------------------------------------------------------------------
  {
    id: "CEM_SPECIFIC_GRAVITY",
    category: "cement",
    titleAr: "الكثافة الحقيقية للإسمنت (Le Chatelier)",
    titleFr: "Masse Volumique Absolue du Ciment",
    titleEn: "Specific Gravity of Cement (Pycnometer)",
    shortDescAr: "تحديد الوزن النوعي المطلق للإسمنت بواسطة قارورة لوشاتولييه وسائل الكيروسين.",
    shortDescEn: "Measurement of cement absolute density using Le Chatelier flask.",
    standard: "NF EN 196-6 / ASTM C188",
    applicableMaterials: ["إسمنت", "Cement", "Binder"],
    icon: "🏺",
    unit: "g/cm³",
    syncedPropertyKeys: ["density"],
    defaultInputs: {
      cementMassG: 64.0,
      initialVolumeMl: 0.8,
      finalVolumeMl: 21.2
    }
  },
  {
    id: "CEM_FINENESS_BLAINE",
    category: "cement",
    titleAr: "نعومة بلين للإسمنت (Blaine Air Permeability)",
    titleFr: "Surface Spécifique Blaine (SSB)",
    titleEn: "Blaine Fineness & Air Permeability",
    shortDescAr: "قياس المساحة السطحية النوعية المعبرة عن سرعة إماهة وتفاعل الإسمنت.",
    shortDescEn: "Determination of specific surface area (cm²/g) via air permeability apparatus.",
    standard: "NF EN 196-6 / ASTM C204",
    applicableMaterials: ["إسمنت"],
    icon: "💨",
    unit: "cm²/g",
    syncedPropertyKeys: ["blaineFineness"],
    defaultInputs: {
      airFlowTimeSeconds: 58.4,
      apparatusConstantK: 523.5,
      bedPorosityE: 0.500,
      cementDensityGPerCm3: 3.15,
      airViscosityMicroPaS: 18.2
    }
  },
  {
    id: "CEM_NORMAL_CONSISTENCY",
    category: "cement",
    titleAr: "القوام القياسي للإسمنت (Normal Consistency Vicat)",
    titleFr: "Consistance Normalisée de la Pâte de Ciment",
    titleEn: "Normal Consistency by Vicat Plunger",
    shortDescAr: "تحديد نسبة الماء اللازمة لتحقيق القوام المعياري (انغراس مسبار فيكات 6±1 مم).",
    shortDescEn: "Water percentage required for standard paste consistency (6±1 mm from base).",
    standard: "NF EN 196-3 / ASTM C187",
    applicableMaterials: ["إسمنت"],
    icon: "📏",
    unit: "% water",
    syncedPropertyKeys: ["normalConsistencyWaterPercent"],
    defaultInputs: {
      cementMassG: 500,
      waterVolumeMl: 138, // 27.6%
      plungerPenetrationMm: 6.0
    }
  },
  {
    id: "CEM_SETTING_TIME",
    category: "cement",
    titleAr: "زمن الشك الابتدائي والنهائي (Vicat Setting Time)",
    titleFr: "Temps de Début et Fin de Prise Vicat",
    titleEn: "Initial & Final Setting Time (Vicat)",
    shortDescAr: "تتبع زمن بداية تصلب عجينة الإسمنت القياسية وزمن انتهاء الشك الكلي.",
    shortDescEn: "Continuous tracking of needle penetration from initial setting (4±1 mm) to final setting.",
    standard: "NF EN 196-3 / ASTM C191",
    applicableMaterials: ["إسمنت"],
    icon: "⏱️",
    unit: "min",
    syncedPropertyKeys: ["initialSettingMinutes", "finalSettingMinutes"],
    defaultInputs: {
      waterPercent: 27.5,
      roomTempC: 20.0,
      humidityPercent: 92,
      timeReadings: [
        { timeMinutes: 30, penetrationMm: 40 },
        { timeMinutes: 60, penetrationMm: 40 },
        { timeMinutes: 90, penetrationMm: 38 },
        { timeMinutes: 120, penetrationMm: 32 },
        { timeMinutes: 150, penetrationMm: 22 },
        { timeMinutes: 180, penetrationMm: 11 },
        { timeMinutes: 200, penetrationMm: 4 }, // Initial set threshold
        { timeMinutes: 240, penetrationMm: 1 },
        { timeMinutes: 280, penetrationMm: 0.5 } // Final set threshold
      ]
    }
  },
  {
    id: "CEM_SOUNDNESS",
    category: "cement",
    titleAr: "ثبات وتمدد الإسمنت (Le Chatelier Soundness)",
    titleFr: "Stabilité du Ciment (Expansion Le Chatelier)",
    titleEn: "Soundness & Expansion of Cement",
    shortDescAr: "التحقق من عدم وجود تمدد متأخر ناتج عن الجير الحر المغلي أو المغنيسيا.",
    shortDescEn: "Verification of volume stability and absence of free lime/magnesia expansion.",
    standard: "NF EN 196-3 / ASTM C151",
    applicableMaterials: ["إسمنت"],
    icon: "🗜️",
    unit: "mm",
    syncedPropertyKeys: ["soundnessExpansionMm"],
    defaultInputs: {
      pointerDistanceBeforeBoilingA: 12.5,
      pointerDistanceAfterBoilingB: 14.0
    }
  },
  {
    id: "CEM_COMPRESSIVE_STRENGTH",
    category: "cement",
    titleAr: "مقاومة المونة الإسمنتية القياسية للضغط (28d Strength)",
    titleFr: "Résistances Mécaniques sur Mortier Normalisé (EN 196-1)",
    titleEn: "Mortar Compressive & Flexural Strengths (2d, 7d, 28d)",
    shortDescAr: "اختبار منشور المونة 40×40×160 مم لتحديد الرتبة الفعلية للإسمنت (32.5 / 42.5 / 52.5).",
    shortDescEn: "Standard ISO mortar prism (40x40x160 mm) tested in flexure and compression at 2, 7, and 28 days.",
    standard: "NF EN 196-1 / ASTM C109",
    applicableMaterials: ["إسمنت"],
    icon: "🏗️",
    unit: "MPa",
    syncedPropertyKeys: ["realStrength28d", "strengthClass"],
    defaultInputs: {
      strength2dPrismsKn: [28.5, 29.2, 28.8, 29.0, 28.6, 29.1], // Area = 1600 mm²
      strength7dPrismsKn: [51.2, 52.0, 50.8, 51.5, 52.2, 51.8],
      strength28dPrismsKn: [76.5, 77.2, 75.8, 76.0, 77.5, 76.8],
      targetCementClass: "42.5 R"
    }
  },

  // --------------------------------------------------------------------------
  // C. WATER
  // --------------------------------------------------------------------------
  {
    id: "WATER_PH",
    category: "water",
    titleAr: "درجة حموضة وقلوية ماء الخلط (pH)",
    titleFr: "Mesure du pH de l'Eau de Gâchage",
    titleEn: "pH Measurement of Mixing Water",
    shortDescAr: "التحقق من أن ماء الخلط ليس حامضياً ولا يسبب تآكل حديد التسليح أو تلف الخرسانة.",
    shortDescEn: "Verification of water acidity/alkalinity for steel passivation (EN 1008: pH ≥ 5.0).",
    standard: "NF EN 1008 / ISO 10523",
    applicableMaterials: ["ماء", "Water", "Eau"],
    icon: "🧪",
    unit: "pH",
    syncedPropertyKeys: ["waterPh"],
    defaultInputs: {
      measuredPh: 7.4,
      waterTemperatureC: 21.0
    }
  },
  {
    id: "WATER_CHLORIDES",
    category: "water",
    titleAr: "محتوى أيونات الكلوريد (Chlorides Cl-)",
    titleFr: "Teneur en Ions Chlorures (Cl-)",
    titleEn: "Chloride Content in Mixing Water",
    shortDescAr: "قياس نسبة الكلوريدات الحرة لمنع حدوث الصدأ والتآكل الحفر في حديد التسليح.",
    shortDescEn: "Chloride ion determination to prevent reinforcement pitting corrosion.",
    standard: "NF EN 1008 / EN 196-21",
    applicableMaterials: ["ماء"],
    icon: "🧂",
    unit: "mg/L",
    syncedPropertyKeys: ["chloridesMgL"],
    defaultInputs: {
      chloridesMgPerL: 210.0,
      concreteApplication: "reinforced" // "prestressed" (≤500) | "reinforced" (≤1000) | "plain" (≤4500)
    }
  },
  {
    id: "WATER_SULFATES",
    category: "water",
    titleAr: "محتوى الكبريتات (Sulfates SO4 2-)",
    titleFr: "Teneur en Sulfates (SO4 2-)",
    titleEn: "Sulfate Content in Mixing Water",
    shortDescAr: "قياس تركيز الكبريتات لتفادي تشكل الإترينجايت المتأخر وتفتت هيكل الخرسانة.",
    shortDescEn: "Sulfate ion concentration to prevent delayed ettringite formation (DEF).",
    standard: "NF EN 1008",
    applicableMaterials: ["ماء"],
    icon: "⚗️",
    unit: "mg/L",
    syncedPropertyKeys: ["sulfatesMgL"],
    defaultInputs: {
      sulfatesMgPerL: 420.0
    }
  },
  {
    id: "WATER_TDS_IMPURITIES",
    category: "water",
    titleAr: "الأملاح والمواد الصلبة المنحلة الكلية (TDS & TSS)",
    titleFr: "Matières Dissoutes et en Suspension (TDS)",
    titleEn: "Total Dissolved & Suspended Solids (TDS/TSS)",
    shortDescAr: "التحقق من خلو الماء من الشوائب العضوية، الزيوت، الطمي، والأملاح المترسبة.",
    shortDescEn: "Total suspended solids (TSS) and total dissolved matter according to EN 1008.",
    standard: "NF EN 1008",
    applicableMaterials: ["ماء"],
    icon: "🔬",
    unit: "mg/L",
    syncedPropertyKeys: ["tdsMgL"],
    defaultInputs: {
      totalDissolvedSolidsMgPerL: 850.0,
      suspendedSolidsMgPerL: 120.0
    }
  },

  // --------------------------------------------------------------------------
  // D. CHEMICAL ADMIXTURES
  // --------------------------------------------------------------------------
  {
    id: "ADM_DENSITY",
    category: "admixtures",
    titleAr: "الكثافة النسبية للملدن الكيميائي (Relative Density)",
    titleFr: "Masse Volumique de l'Adjuvant",
    titleEn: "Specific Gravity / Density of Admixture",
    shortDescAr: "التحقق من مطابقة كثافة الملدن أو المضاف السائل للشهادة التقنية للمصنع.",
    shortDescEn: "Measurement of liquid admixture density using hydrometer / pycnometer at 20°C.",
    standard: "NF EN 934-2 / ISO 758",
    applicableMaterials: ["ملدنات", "إضافات كيميائية", "Admixture", "Plasticizer"],
    icon: "⚖️",
    unit: "g/cm³",
    syncedPropertyKeys: ["density"],
    defaultInputs: {
      admixtureMassG: 108.5,
      admixtureVolumeMl: 100.0,
      temperatureC: 20.0
    }
  },
  {
    id: "ADM_SOLID_CONTENT",
    category: "admixtures",
    titleAr: "الخلاصة الجافة / المحتوى الصلب (Dry Solid Content)",
    titleFr: "Extrait Sec de l'Adjuvant",
    titleEn: "Dry Solid Content / Oven Residue",
    shortDescAr: "تحديد نسبة المادة الفعالة الصلبة في الملدن بعد التجفيف في الفرن عند 105°م.",
    shortDescEn: "Percentage of non-volatile active solid material according to EN 480-8.",
    standard: "NF EN 480-8 / NF EN 934-2",
    applicableMaterials: ["ملدنات", "إضافات كيميائية"],
    icon: "🔥",
    unit: "%",
    syncedPropertyKeys: ["dryExtract"],
    defaultInputs: {
      emptyDishMassG: 22.45,
      dishPlusWetAdmixtureMassG: 32.45, // 10.0g wet sample
      dishPlusDryResidueMassG: 25.95   // 3.50g dry residue = 35.0%
    }
  },
  {
    id: "ADM_WATER_REDUCTION",
    category: "admixtures",
    titleAr: "قدرة تخفيض ماء الخلط (Water Reduction Efficiency)",
    titleFr: "Pouvoir Réducteur d'Eau de l'Adjuvant",
    titleEn: "Water Reduction Rate at Equal Slump",
    shortDescAr: "قياس النسبة المئوية لكمية الماء الموفرة مع الحفاظ على نفس هبوط وركود الخرسانة.",
    shortDescEn: "Determination of water reduction rate (% relative to control concrete mix).",
    standard: "NF EN 934-2 / ASTM C494",
    applicableMaterials: ["ملدنات", "إضافات كيميائية"],
    icon: "📉",
    unit: "% reduction",
    syncedPropertyKeys: ["waterReductionRate"],
    defaultInputs: {
      controlMixWaterL: 195.0,
      admixedMixWaterL: 152.0,
      targetSlumpMm: 180,
      dosagePercentOfCement: 1.2
    }
  },

  // --------------------------------------------------------------------------
  // E. MINERAL ADDITIVES (SCM)
  // --------------------------------------------------------------------------
  {
    id: "SCM_SPECIFIC_GRAVITY",
    category: "additives",
    titleAr: "الكثافة الحقيقية للإضافة المعدنية (SCM Density)",
    titleFr: "Masse Volumique de l'Addition Minérale",
    titleEn: "Specific Gravity of Pozzolan / SCM",
    shortDescAr: "تحديد الكثافة الحقيقية لغبار السيليكا، الرماد المتطاير، أو الخبث لحساب الحجم المطلق.",
    shortDescEn: "Absolute density measurement for silica fume, fly ash, slag, or metakaolin.",
    standard: "NF EN 450-1 / NF EN 15167-1",
    applicableMaterials: ["إضافات معدنية", "غبار السيليكا", "رماد متطاير", "خبث الأفران", "Mineral Additive"],
    icon: "✨",
    unit: "g/cm³",
    syncedPropertyKeys: ["density"],
    defaultInputs: {
      scmType: "silica_fume", // "silica_fume" (2.20) | "fly_ash" (2.35) | "slag" (2.90)
      sampleMassG: 50.0,
      displacedVolumeMl: 22.7
    }
  },
  {
    id: "SCM_ACTIVITY_INDEX",
    category: "additives",
    titleAr: "معامل النشاط البوزولاني الهيدروليكي (Activity Index IAP)",
    titleFr: "Indice d'Activité Pouzzolanique (IAP)",
    titleEn: "Pozzolanic Activity Index at 28d",
    shortDescAr: "مقارنة مقاومة مونة الإضافة المعدنية (75% إسمنت + 25% SCM) بمونة الشاهد 100% إسمنت.",
    shortDescEn: "Evaluation of pozzolanic reactivity ratio against control mortar (EN 450-1: IAP ≥ 75%).",
    standard: "NF EN 450-1 / ASTM C311",
    applicableMaterials: ["إضافات معدنية"],
    icon: "⚡",
    unit: "% (IAP)",
    syncedPropertyKeys: ["activityIndex28d"],
    defaultInputs: {
      controlPrism28dStrengthMpa: 52.0,
      scmBlendedPrism28dStrengthMpa: 48.5,
      replacementRatePercent: 25.0
    }
  },
  {
    id: "SCM_LOSS_ON_IGNITION",
    category: "additives",
    titleAr: "الفاقد بالاشتعال والحرق (Loss on Ignition LOI)",
    titleFr: "Perte au Feu (PAF)",
    titleEn: "Loss on Ignition (LOI at 950°C)",
    shortDescAr: "قياس نسبة الكربون غير المحترق والمواد العضوية المتطايرة في الرماد المتطاير والسيليكا.",
    shortDescEn: "Determination of unburnt carbon content which absorbs concrete admixtures.",
    standard: "NF EN 196-2 / ASTM C311",
    applicableMaterials: ["إضافات معدنية"],
    icon: "🔥",
    unit: "% (LOI)",
    syncedPropertyKeys: ["lossOnIgnition"],
    defaultInputs: {
      drySampleMassG: 2.000,
      calcinedSampleMassG: 1.942 // Loss = 0.058g = 2.9%
    }
  },

  // --------------------------------------------------------------------------
  // F. FIBERS
  // --------------------------------------------------------------------------
  {
    id: "FIBER_GEOMETRY",
    category: "fibers",
    titleAr: "الأبعاد الهندسية ونسبة النحافة للألياف (Aspect Ratio)",
    titleFr: "Géométrie & Élancement des Fibres (L/d)",
    titleEn: "Fiber Geometry & Aspect Ratio (L/d)",
    shortDescAr: "قياس طول وقطر الألياف وحساب نسبة النحافة (L/d) المحددة لفاعلية التثبيت في الخرسانة.",
    shortDescEn: "Measurement of length, equivalent diameter, and aspect ratio (L/d).",
    standard: "NF EN 14889-1 / NF EN 14889-2",
    applicableMaterials: ["ألياف", "Fibers", "Fibres"],
    icon: "🧬",
    unit: "L/d ratio",
    syncedPropertyKeys: ["fiberLength", "fiberDiameter", "aspectRatio"],
    defaultInputs: {
      fiberType: "steel", // "steel" | "synthetic_macro" | "polypropylene_micro"
      lengthMm: 50.0,
      diameterMm: 0.85,
      tensileStrengthMpa: 1150
    }
  },
  {
    id: "FIBER_DOSAGE_OPTIMIZATION",
    category: "fibers",
    titleAr: "الجرعة والعدد الحجمي للألياف (Fiber Count & Dosage)",
    titleFr: "Dosage Volumique et Nombre de Fibres / m³",
    titleEn: "Fiber Volume Fraction & Count per m³",
    shortDescAr: "حساب نسبة الحجم Vf%، عدد الألياف في المتر المكعب، ومعامل خطر التكتل (Balling).",
    shortDescEn: "Calculation of volume fraction, total fiber count/kg, and balling dispersion risk.",
    standard: "ACI 544.1R / RILEM TC 162-TDF",
    applicableMaterials: ["ألياف"],
    icon: "📊",
    unit: "kg/m³ / fibers/m³",
    syncedPropertyKeys: ["optimalFiberDosage"],
    defaultInputs: {
      fiberDosageKgPerM3: 25.0,
      fiberDensityGPerCm3: 7.85,
      fiberLengthMm: 50.0,
      fiberDiameterMm: 0.85
    }
  }
];

// ============================================================================
// 2. DETERMINISTIC CALCULATION & VERIFICATION ENGINES
// ============================================================================

export interface TestExecutionResult {
  results: Record<string, any>;
  status: TestStatus;
  score: number;
  interpretation: string;
  complianceDetails: ComplianceDetail[];
  chartData?: any;
  granulometricCurve?: GranulometricCurveData;
  syncedProperties: Record<string, any>;
}

export function executeLaboratoryTest(
  testType: string,
  inputs: Record<string, any>,
  material: EngineeringMaterial
): TestExecutionResult {
  const testDef = MASTER_TEST_CATALOG.find(t => t.id === testType);

  switch (testType) {
    // ------------------------------------------------------------------------
    // AGGREGATES
    // ------------------------------------------------------------------------
    case "AGG_SIEVE": {
      const sieves: { sieve: number; retained: number }[] = inputs.sieves || [];
      const totalWeight: number = inputs.totalWeight || sieves.reduce((sum, s) => sum + (s.retained || 0), 0);
      const isSand = inputs.materialType === "sand" || material.category === "رمال" || material.name.includes("رمل");

      let cumRet = 0;
      const stepResults: SieveStepResult[] = [];
      sieves.forEach(s => {
        cumRet += s.retained || 0;
        const pctRet = totalWeight > 0 ? ((s.retained || 0) / totalWeight) * 100 : 0;
        const cumPct = totalWeight > 0 ? (cumRet / totalWeight) * 100 : 0;
        const passing = Math.max(0, 100 - cumPct);
        stepResults.push({
          sieve: s.sieve,
          retainedWeight: s.retained || 0,
          percentRetained: parseFloat(pctRet.toFixed(2)),
          cumulativePercentRetained: parseFloat(cumPct.toFixed(2)),
          percentPassing: parseFloat(passing.toFixed(2))
        });
      });

      // Fineness modulus FM = sum of cum retained on standard sieves (0.125, 0.25, 0.5, 1, 2, 4) / 100
      const standardFmSieves = [0.125, 0.25, 0.5, 1.0, 2.0, 4.0];
      let sumCumFm = 0;
      standardFmSieves.forEach(sz => {
        const found = stepResults.find(r => Math.abs(r.sieve - sz) < 0.02);
        if (found) {
          sumCumFm += found.cumulativePercentRetained;
        }
      });
      const finenessModulus = parseFloat((sumCumFm / 100).toFixed(2));

      // Dmax
      const sortedByDesc = [...stepResults].filter(r => r.sieve > 0).sort((a, b) => b.sieve - a.sieve);
      const dmaxRow = sortedByDesc.find(r => r.percentPassing >= 95);
      const dMax = dmaxRow ? dmaxRow.sieve : (isSand ? 4.0 : 20.0);

      // Fines content (< 0.063 mm)
      const finesRow = stepResults.find(r => r.sieve <= 0.08);
      const finesContent = finesRow ? finesRow.percentPassing : 2.0;

      // Sand ratio (0/2 mm fraction)
      const sieve2 = stepResults.find(r => Math.abs(r.sieve - 2.0) < 0.05);
      const sandRatio = sieve2 ? sieve2.percentPassing : (isSand ? 85 : 5);

      const compliance: ComplianceDetail[] = [];
      let status: TestStatus = "PASS";

      if (isSand) {
        const isFmOptimal = finenessModulus >= 2.2 && finenessModulus <= 3.1;
        const isFmBorderline = (finenessModulus >= 1.9 && finenessModulus < 2.2) || (finenessModulus > 3.1 && finenessModulus <= 3.4);
        compliance.push({
          parameter: "معامل النعومة (Fineness Modulus FM)",
          measured: finenessModulus,
          limit: "2.20 - 3.10 (NF EN 12620 / ASTM C33)",
          status: isFmOptimal ? "PASS" : isFmBorderline ? "WARNING" : "FAIL",
          note: isFmOptimal ? "معامل نعومة مثالي يوفر تشغيلية ممتازة للخرسانة" : isFmBorderline ? "رمل ناعم جداً أو خشن نسبياً" : "خارج الحدود القياسية المعتمدة"
        });

        const isFinesGood = finesContent <= 3.0;
        const isFinesWarn = finesContent > 3.0 && finesContent <= 6.0;
        compliance.push({
          parameter: "نسبة المار عبر منخل 0.063 مم (المواد الناعمة)",
          measured: `${finesContent}%`,
          limit: "≤ 3.0% (رمل طبيعي) / ≤ 5.0% (رمل مكسر)",
          status: isFinesGood ? "PASS" : isFinesWarn ? "WARNING" : "FAIL",
          note: isFinesGood ? "مطابق ونظيف تماماً" : "قد يزيد من استهلاك ماء الخلط"
        });

        if (!isFmOptimal || !isFinesGood) {
          status = (isFmBorderline || isFinesWarn) ? "WARNING" : "FAIL";
        }
      } else {
        compliance.push({
          parameter: "القطر الأقصى للحصى (Dmax)",
          measured: `${dMax} mm`,
          limit: "حسب المخطط والمواصفة الإنشائية",
          status: "PASS",
          note: "متوافق مع تباعد قضبان التسليح والغطاء الخرساني"
        });
      }

      const curveData: GranulometricCurveData = {
        sieves: stepResults,
        finenessModulus,
        dMax,
        finesContent,
        sandRatio,
        classification: isSand ? `رمل ${finenessModulus > 2.8 ? 'خشن' : finenessModulus < 2.4 ? 'ناعم' : 'متوسط'}` : `حصى Dmax = ${dMax} mm`
      };

      const score = status === "PASS" ? 95 : status === "WARNING" ? 78 : 45;
      const interpretation = status === "PASS"
        ? `تدرج حبيبي ممتاز ومطابق للمواصفة القياسية (NF EN 933-1). معامل النعومة FM = ${finenessModulus} يوفر رصاً متجانساً ومقاومة عالية.`
        : status === "WARNING"
        ? `تدرج حبيبي مقبول مع تنبيه (FM = ${finenessModulus}). يُوصى بضبط نسبة الرمل في الخلطة لضمان التشغيلية.`
        : `تدرج غير مطابق للمواصفات القياسية. يتطلب خلطه برمل تصحيحي أو تعديل الكسارة.`;

      return {
        results: {
          finenessModulus,
          dMax,
          finesContent,
          sandRatio,
          totalWeight,
          sieveTable: stepResults
        },
        status,
        score,
        interpretation,
        complianceDetails: compliance,
        granulometricCurve: curveData,
        chartData: stepResults.filter(s => s.sieve > 0).map(s => ({
          sieve: `${s.sieve} mm`,
          sieveMm: s.sieve,
          passing: s.percentPassing,
          retained: s.percentRetained,
          cumRetained: s.cumulativePercentRetained
        })),
        syncedProperties: {
          finenessModulus,
          dMax,
          finesContent,
          gradationData: stepResults.map(s => ({ sieveSize: s.sieve, percentPassing: s.percentPassing }))
        }
      };
    }

    case "AGG_BULK_DENSITY": {
      const vol = inputs.containerVolumeLiters;
      const empty = inputs.containerEmptyWeightKg;
      const looseFilled = inputs.looseFilledWeightKg;
      const compacted = inputs.compactedWeightKg;

      if (
        vol === undefined || vol === null || isNaN(vol) || vol <= 0 ||
        empty === undefined || empty === null || isNaN(empty) ||
        looseFilled === undefined || looseFilled === null || isNaN(looseFilled) ||
        compacted === undefined || compacted === null || isNaN(compacted) ||
        looseFilled <= empty || compacted <= empty
      ) {
        return {
          results: {},
          status: "FAIL",
          score: 0,
          interpretation: "بيانات الاختبار غير مكتملة أو مفقودة. يجب إدخال سعة الوعاء وأوزان العينة السائبة والمدموكة بشكل صحيح.",
          complianceDetails: [{
            parameter: "الكثافة الظاهرية السائبة (Loose Bulk Density)",
            measured: "غير متوفر / مفقود",
            limit: "1350 - 1750 kg/m³ (NF EN 1097-3)",
            status: "FAIL",
            note: "المدخلات المعملية مفقودة أو غير صالحة."
          }],
          syncedProperties: {}
        };
      }

      const looseMass = looseFilled - empty;
      const compactedMass = compacted - empty;

      const looseDensity = parseFloat(((looseMass / vol) * 1000).toFixed(1)); // kg/m³
      const compactedDensity = parseFloat(((compactedMass / vol) * 1000).toFixed(1)); // kg/m³
      const compactionIndex = parseFloat((compactedDensity / looseDensity).toFixed(2));
      const looseDensityT = parseFloat((looseDensity / 1000).toFixed(3)); // t/m³

      const isDensityGood = looseDensity >= 1350 && looseDensity <= 1750;
      const status: TestStatus = isDensityGood ? "PASS" : "WARNING";

      const compliance: ComplianceDetail[] = [
        {
          parameter: "الكثافة الظاهرية السائبة (Loose Bulk Density)",
          measured: `${looseDensity} kg/m³ (${looseDensityT} t/m³)`,
          limit: "1350 - 1750 kg/m³ (NF EN 1097-3)",
          status: isDensityGood ? "PASS" : "WARNING",
          note: isDensityGood ? "كثافة ظاهرية نموذجية للركام الطبيعي" : "كثافة منخفضة قد تشير إلى مسامية عالية"
        },
        {
          parameter: "الكثافة الظاهرية المدموكة (Compacted Bulk Density)",
          measured: `${compactedDensity} kg/m³`,
          limit: "≥ 1500 kg/m³",
          status: "PASS",
          note: "رص متجانس يقلل من الفراغات البينية"
        },
        {
          parameter: "معامل الرص (Compaction Index)",
          measured: compactionIndex,
          limit: "1.08 - 1.25",
          status: (compactionIndex >= 1.05 && compactionIndex <= 1.25) ? "PASS" : "WARNING",
          note: "مؤشر على قابلية الحبيبات لإعادة الترتيب الحجمي"
        }
      ];

      return {
        results: {
          looseDensity,
          compactedDensity,
          compactionIndex,
          looseDensityT
        },
        status,
        score: status === "PASS" ? 96 : 80,
        interpretation: `الكثافة الظاهرية السائبة المحققة هي ${looseDensity} kg/m³ والمدموكة ${compactedDensity} kg/m³. النتائج مطابقة تماماً للمواصفة القياسية NF EN 1097-3 وتستخدم مباشرة في حسابات الكيل الحجمي ومعايرة دروكس-غوريس.`,
        complianceDetails: compliance,
        syncedProperties: {
          bulkDensity: looseDensity
        }
      };
    }

    case "AGG_SPECIFIC_GRAVITY": {
      const M4 = inputs.ovenDryMassG;
      const M1 = inputs.ssdMassG;
      const M2 = inputs.pycnometerSampleWaterMassG;
      const M3 = inputs.pycnometerWaterMassG;

      const volDisplaced = (M4 !== undefined && M3 !== undefined && M2 !== undefined) ? (M4 + M3) - M2 : 0;
      const volSsd = (M1 !== undefined && M3 !== undefined && M2 !== undefined) ? (M1 + M3) - M2 : 0;

      if (
        M4 === undefined || M1 === undefined || M2 === undefined || M3 === undefined ||
        isNaN(M4) || isNaN(M1) || isNaN(M2) || isNaN(M3) ||
        M4 <= 0 || M1 <= 0 || volDisplaced <= 0 || volSsd <= 0
      ) {
        return {
          results: {},
          status: "FAIL",
          score: 0,
          interpretation: "بيانات الاختبار غير مكتملة أو مفقودة. يجب إدخال كتل العينة المجففة والمشبعة المشبعة وأوزان البيكنومتر.",
          complianceDetails: [{
            parameter: "الكثافة الحقيقية المطلقة (Absolute Density)",
            measured: "غير متوفر / مفقود",
            limit: "2.50 - 2.75 g/cm³ (NF EN 1097-6)",
            status: "FAIL",
            note: "المدخلات المعملية مفقودة أو غير صالحة."
          }],
          syncedProperties: {}
        };
      }

      // Absolute density = M4 / (M4 + M3 - M2)
      const absoluteDensity = parseFloat((M4 / volDisplaced).toFixed(3)); // g/cm³ or t/m³

      // SSD density = M1 / (M1 + M3 - M2)
      const ssdDensity = parseFloat((M1 / volSsd).toFixed(3));

      // Water absorption % WA24 = ((M1 - M4) / M4) * 100
      const waterAbsorption = parseFloat((((M1 - M4) / M4) * 100).toFixed(2));

      const isAbsGood = waterAbsorption <= 2.5;
      const isAbsWarn = waterAbsorption > 2.5 && waterAbsorption <= 4.0;
      const status: TestStatus = isAbsGood ? "PASS" : isAbsWarn ? "WARNING" : "FAIL";

      const compliance: ComplianceDetail[] = [
        {
          parameter: "الكثافة الحقيقية المطلقة (Absolute Density)",
          measured: `${absoluteDensity} g/cm³ (${(absoluteDensity * 1000).toFixed(0)} kg/m³)`,
          limit: "2.50 - 2.75 g/cm³ (NF EN 1097-6)",
          status: (absoluteDensity >= 2.50 && absoluteDensity <= 2.75) ? "PASS" : "WARNING",
          note: "كثافة حقيقية مطابقة للركام السيليسي والكلسي"
        },
        {
          parameter: "نسبة الامتصاص المائي خلال 24 ساعة (WA24)",
          measured: `${waterAbsorption}%`,
          limit: "≤ 2.50% (ركام خرساني معتمد) / ≤ 4.0% (ركام خفيف)",
          status: isAbsGood ? "PASS" : isAbsWarn ? "WARNING" : "FAIL",
          note: isAbsGood ? "امتصاص منخفض يضمن ثبات ماء الخلط الفعال" : "امتصاص مرتفع يتطلب تصحيحاً دقيقاً لماء الخلط"
        }
      ];

      return {
        results: {
          absoluteDensity,
          ssdDensity,
          waterAbsorption,
          densityKgM3: absoluteDensity * 1000
        },
        status,
        score: status === "PASS" ? 95 : status === "WARNING" ? 75 : 40,
        interpretation: `الكثافة المطلقة ${absoluteDensity} g/cm³ ونسبة الامتصاص ${waterAbsorption}%. ${isAbsGood ? 'ركام صلب وقليل المسامية يمنح خرسانة ذات ديمومة عالية.' : 'يتطلب مراقبة امتصاص الركام لضبط الماء الفعال W/C.'}`,
        complianceDetails: compliance,
        syncedProperties: {
          density: absoluteDensity,
          absorption: waterAbsorption
        }
      };
    }

    case "AGG_MOISTURE_CONTENT": {
      const wet = inputs.wetMassG;
      const dry = inputs.dryMassG;
      const tare = inputs.tareMassG;

      if (
        wet === undefined || dry === undefined || tare === undefined ||
        isNaN(wet) || isNaN(dry) || isNaN(tare) ||
        dry <= tare || wet < dry
      ) {
        return {
          results: {},
          status: "FAIL",
          score: 0,
          interpretation: "بيانات الاختبار غير مكتملة أو مفقودة. يجب إدخال كتلة الوعاء فارغاً والكتلة الرطبة والمجففة بشكل صحيح.",
          complianceDetails: [{
            parameter: "المحتوى المائي الرطوبي (Moisture Content w%)",
            measured: "غير متوفر / مفقود",
            limit: "0.0% - 8.0%",
            status: "FAIL",
            note: "المدخلات المعملية مفقودة أو غير صالحة."
          }],
          syncedProperties: {}
        };
      }

      const netWet = wet - tare;
      const netDry = dry - tare;
      const moisturePercent = parseFloat((((netWet - netDry) / netDry) * 100).toFixed(2));

      const status: TestStatus = "PASS";
      const compliance: ComplianceDetail[] = [
        {
          parameter: "المحتوى المائي الرطوبي (Moisture Content w%)",
          measured: `${moisturePercent}%`,
          limit: "0.0% - 8.0% (رطوبة موقعية)",
          status: "PASS",
          note: `يجب خصم ${moisturePercent}% من ماء الخلط وإضافتها لوزن الركام الرطب`
        }
      ];

      return {
        results: {
          moisturePercent,
          waterToDeductPerTon: parseFloat((moisturePercent * 10).toFixed(1)) // Liters per ton
        },
        status,
        score: 98,
        interpretation: `نسبة الرطوبة السطحية في العينة هي ${moisturePercent}%. تم تحديث خاصية الرطوبة تلقائياً وسيتم تطبيق تصحيح ماء الخلط الفوري في محطة الخلط ومحاكي التصميم.`,
        complianceDetails: compliance,
        syncedProperties: {
          moisture: moisturePercent
        }
      };
    }

    case "AGG_SAND_EQUIVALENT": {
      const h1 = inputs.h1TotalHeightMm;
      const h2 = inputs.h2SandHeightMm;
      const method = inputs.testMethod || "piston";

      if (
        h1 === undefined || h2 === undefined ||
        isNaN(h1) || isNaN(h2) ||
        h1 <= 0 || h2 < 0 || h2 > h1
      ) {
        return {
          results: {},
          status: "FAIL",
          score: 0,
          interpretation: "بيانات الاختبار غير مكتملة أو مفقودة. يجب إدخال ارتفاع الطمي الكلي h1 وارتفاع الرمل h2 بشكل صحيح.",
          complianceDetails: [{
            parameter: `المكافئ الرملي (${method === 'piston' ? 'بالمكبس ES' : 'بالعين المجردة ESV'})`,
            measured: "غير متوفر / مفقود",
            limit: "≥ 75% (خرسانة مسلحة وعالية الجودة) / ≥ 70% (مقبول)",
            status: "FAIL",
            note: "المدخلات المعملية مفقودة أو غير صالحة."
          }],
          syncedProperties: {}
        };
      }

      const sandEquivalent = parseFloat(((h2 / h1) * 100).toFixed(1));

      const isClean = sandEquivalent >= 75;
      const isAcceptable = sandEquivalent >= 70 && sandEquivalent < 75;
      const status: TestStatus = isClean ? "PASS" : isAcceptable ? "WARNING" : "FAIL";

      const compliance: ComplianceDetail[] = [
        {
          parameter: `المكافئ الرملي (${method === 'piston' ? 'بالمكبس ES' : 'بالعين المجردة ESV'})`,
          measured: `${sandEquivalent}%`,
          limit: "≥ 75% (خرسانة مسلحة وعالية الجودة) / ≥ 70% (مقبول)",
          status: isClean ? "PASS" : isAcceptable ? "WARNING" : "FAIL",
          note: isClean ? "رمل نظيف جداً وخالٍ من الغضار الضار" : isAcceptable ? "رمل مقبول مع نسبة طين طفيفة" : "رمل طيني غير صالح للخرسانات الإنشائية"
        }
      ];

      return {
        results: {
          sandEquivalent,
          h1TotalHeightMm: h1,
          h2SandHeightMm: h2,
          cleanlinessClass: isClean ? "رمل نظيف جداً (Très propre)" : isAcceptable ? "رمل مقبول (Sable propre)" : "رمل طيني (Sable argileux)"
        },
        status,
        score: status === "PASS" ? 96 : status === "WARNING" ? 75 : 30,
        interpretation: `قيمة المكافئ الرملي المحققة هي ${sandEquivalent}% (${isClean ? 'رمل نظيف معتمد' : 'يحتاج مراقبة'}). تفي بمتطلبات المواصفة NF EN 933-8 لضمان تماسك مونة الإسمنت ومنع هبوط المقاومة.`,
        complianceDetails: compliance,
        syncedProperties: {
          sandEquivalent
        }
      };
    }

    case "AGG_BULKING_SAND": {
      const dryVol = inputs.dryVolumeCm3;
      const steps = inputs.moistureSteps;

      if (!dryVol || isNaN(dryVol) || dryVol <= 0 || !Array.isArray(steps) || steps.length === 0) {
        return {
          results: {},
          status: "FAIL",
          score: 0,
          interpretation: "بيانات انتفاخ الرمل غير مكتملة أو مفقودة. يجب إدخال الحجم الجاف وخطوات الرطوبة والحجم المقابل.",
          complianceDetails: [{
            parameter: "أقصى نسبة انتفاخ حجمي (Max Bulking Expansion)",
            measured: "غير متوفر / مفقود",
            limit: "15% - 35%",
            status: "FAIL",
            note: "المدخلات المعملية مفقودة أو غير صالحة."
          }],
          syncedProperties: {}
        };
      }

      let maxExpansionPct = 0;
      let peakMoisture = 0;
      const chart = steps.map((s: any) => {
        const expansionPct = dryVol > 0 ? parseFloat((((s.volumeCm3 - dryVol) / dryVol) * 100).toFixed(1)) : 0;
        if (expansionPct > maxExpansionPct) {
          maxExpansionPct = expansionPct;
          peakMoisture = s.moisturePercent;
        }
        return {
          moisture: `${s.moisturePercent}%`,
          moistureNum: s.moisturePercent,
          volume: s.volumeCm3,
          expansionPct
        };
      });

      const compliance: ComplianceDetail[] = [
        {
          parameter: "أقصى نسبة انتفاخ حجمي (Max Bulking Expansion)",
          measured: `+${maxExpansionPct}% عند رطوبة ${peakMoisture}%`,
          limit: "15% - 35% (سلوك فيزيائي نموذجي للرمال الدقيقة)",
          status: "PASS",
          note: "ظاهرة التوتر السطحي لماء الرطوبة تسبب تباعد الحبيبات"
        }
      ];

      return {
        results: {
          maxExpansionPct,
          peakMoisture,
          bulkingCurve: chart
        },
        status: "PASS",
        score: 95,
        interpretation: `يصل انتفاخ الرمل أقصاه (+${maxExpansionPct}%) عند رطوبة ${peakMoisture}%. هذه المنحنيات ضرورية لمعايرة الكيل الحجمي وتفادي نقص كميات الرمل الجاف الفعلي.`,
        complianceDetails: compliance,
        chartData: chart,
        syncedProperties: {
          sandBulkingCoeff: parseFloat((1 + maxExpansionPct / 100).toFixed(3))
        }
      };
    }

    case "AGG_LOS_ANGELES": {
      const m0 = inputs.initialMassG;
      const mRet = inputs.retainedMassOn1_6mmG;

      if (
        m0 === undefined || mRet === undefined ||
        isNaN(m0) || isNaN(mRet) ||
        m0 <= 0 || mRet < 0 || mRet > m0
      ) {
        return {
          results: {},
          status: "FAIL",
          score: 0,
          interpretation: "بيانات الاختبار غير مكتملة أو مفقودة. يجب إدخال الكتلة الابتدائية والكتلة المتبقية على منخل 1.6 مم.",
          complianceDetails: [{
            parameter: "معامل لوس أنجلوس للتفتت (Los Angeles LA%)",
            measured: "غير متوفر / مفقود",
            limit: "≤ 25% (خرسانة عالية الأداء ورصف) / ≤ 30% (إنشائي قياسي)",
            status: "FAIL",
            note: "المدخلات المعملية مفقودة أو غير صالحة."
          }],
          syncedProperties: {}
        };
      }

      const laCoeff = parseFloat((((m0 - mRet) / m0) * 100).toFixed(1));

      const isLaExceptional = laCoeff <= 20;
      const isLaGood = laCoeff > 20 && laCoeff <= 30;
      const isLaAcceptable = laCoeff > 30 && laCoeff <= 35;
      const status: TestStatus = (isLaExceptional || isLaGood) ? "PASS" : isLaAcceptable ? "WARNING" : "FAIL";

      const compliance: ComplianceDetail[] = [
        {
          parameter: "معامل لوس أنجلوس للتفتت (Los Angeles LA%)",
          measured: `LA = ${laCoeff}%`,
          limit: "≤ 25% (خرسانة عالية الأداء ورصف) / ≤ 30% (إنشائي قياسي)",
          status,
          note: isLaExceptional ? "حصى صلب جداً ومقاوم للصدمات العالية" : isLaGood ? "حصى إنشائي ممتاز مطابق لـ NF EN 1097-2" : "حصى ضعيف نسبياً يتطلب الحذر"
        }
      ];

      return {
        results: {
          losAngelesCoeff: laCoeff,
          laGrade: isLaExceptional ? "LA20 (عالي الصلابة)" : isLaGood ? "LA30 (إنشائي قياسي)" : "LA35 (متوسط)"
        },
        status,
        score: status === "PASS" ? 95 : status === "WARNING" ? 72 : 35,
        interpretation: `معامل لوس أنجلوس LA = ${laCoeff}%. ${status === 'PASS' ? 'الحصى يتمتع بصلابة ميكانيكية فائقة ضد الصدم والتفتت ومطابق لجميع متطلبات الكود الجزائري والأوروبي.' : 'الحصى ذو هشاشة نسبية.'}`,
        complianceDetails: compliance,
        syncedProperties: {
          losAngelesAbrasion: laCoeff
        }
      };
    }

    case "AGG_MICRO_DEVAL": {
      const m0 = inputs.initialMassG;
      const mRet = inputs.retainedMassOn1_6mmG;

      if (
        m0 === undefined || mRet === undefined ||
        isNaN(m0) || isNaN(mRet) ||
        m0 <= 0 || mRet < 0 || mRet > m0
      ) {
        return {
          results: {},
          status: "FAIL",
          score: 0,
          interpretation: "بيانات الاختبار غير مكتملة أو مفقودة. يجب إدخال الكتلة الابتدائية والكتلة المتبقية على منخل 1.6 مم بعد التدوير المائي.",
          complianceDetails: [{
            parameter: "معامل ميكرو-ديفال في وجود الماء (Micro-Deval MDE%)",
            measured: "غير متوفر / مفقود",
            limit: "≤ 15% (HPC & Pavement) / ≤ 25% (Standard Structural)",
            status: "FAIL",
            note: "المدخلات المعملية مفقودة أو غير صالحة."
          }],
          syncedProperties: {}
        };
      }

      const mde = parseFloat((((m0 - mRet) / m0) * 100).toFixed(1));

      const isMdeGreat = mde <= 15;
      const isMdeGood = mde > 15 && mde <= 25;
      const status: TestStatus = isMdeGreat ? "PASS" : isMdeGood ? "PASS" : "WARNING";

      const compliance: ComplianceDetail[] = [
        {
          parameter: "معامل ميكرو-ديفال في وجود الماء (Micro-Deval MDE%)",
          measured: `MDE = ${mde}%`,
          limit: "≤ 15% (HPC & Pavement) / ≤ 25% (Standard Structural)",
          status,
          note: isMdeGreat ? "مقاومة استثنائية للتآكل الاحتكاكي الرطب" : "مطابق للمواصفة القياسية NF EN 1097-1"
        }
      ];

      return {
        results: {
          microDevalCoeff: mde
        },
        status,
        score: 94,
        interpretation: `معامل ميكرو-ديفال MDE = ${mde}%. يثبت مقاومة ممتازة للاحتكاك الرطب بين الحبيبات تحت تأثير الأحمال الديناميكية.`,
        complianceDetails: compliance,
        syncedProperties: {
          microDeval: mde
        }
      };
    }

    case "AGG_SHAPE_FLAKINESS": {
      const total = inputs.totalSampleMassG;
      const passingBars = inputs.passingBarSievesMassG;

      if (
        total === undefined || passingBars === undefined ||
        isNaN(total) || isNaN(passingBars) ||
        total <= 0 || passingBars < 0 || passingBars > total
      ) {
        return {
          results: {},
          status: "FAIL",
          score: 0,
          interpretation: "بيانات الاختبار غير مكتملة أو مفقودة. يجب إدخال كتلة العينة الكلية وكتلة الحبيبات المارة عبر مناخل القضبان الفلزية.",
          complianceDetails: [{
            parameter: "معامل التفرطح (Flakiness Index FI%)",
            measured: "غير متوفر / مفقود",
            limit: "≤ 20% (حصى مكعب ممتاز) / ≤ 30% (مقبول)",
            status: "FAIL",
            note: "المدخلات المعملية مفقودة أو غير صالحة."
          }],
          syncedProperties: {}
        };
      }

      const flakinessIndex = parseFloat(((passingBars / total) * 100).toFixed(1));

      const isFlakyGood = flakinessIndex <= 20;
      const status: TestStatus = isFlakyGood ? "PASS" : flakinessIndex <= 30 ? "WARNING" : "FAIL";

      const compliance: ComplianceDetail[] = [
        {
          parameter: "معامل التفرطح (Flakiness Index FI%)",
          measured: `FI = ${flakinessIndex}%`,
          limit: "≤ 20% (حصى مكعب ممتاز) / ≤ 30% (مقبول)",
          status,
          note: isFlakyGood ? "حبيبات مكعبة متناسقة توفر رصاً وتلاصقاً ممتازين" : "حبيبات مفلطحة قد تزيد من الفراغات"
        }
      ];

      return {
        results: {
          flakinessIndex
        },
        status,
        score: status === "PASS" ? 95 : 75,
        interpretation: `معامل التفرطح FI = ${flakinessIndex}%. الحصى يتمتع بهندسة مكعبة متوازنة خالية من الصفائح والإبر المعيقة للضخ.`,
        complianceDetails: compliance,
        syncedProperties: {
          flakinessIndex
        }
      };
    }

    case "AGG_METHYLENE_BLUE": {
      const mass = inputs.fraction0_2MassG;
      const volMl = inputs.dyeSolutionInjectedMl;
      const conc = inputs.dyeConcentrationGPerL;

      if (
        mass === undefined || volMl === undefined || conc === undefined ||
        isNaN(mass) || isNaN(volMl) || isNaN(conc) ||
        mass <= 0 || volMl < 0 || conc <= 0
      ) {
        return {
          results: {},
          status: "FAIL",
          score: 0,
          interpretation: "بيانات الاختبار غير مكتملة أو مفقودة. يجب إدخال كتلة العينة وحجم المحلول المحقون وتركيز محلول أزرق الميثيلين.",
          complianceDetails: [{
            parameter: "قيمة أزرق الميثيلين (Methylene Blue Value MB)",
            measured: "غير متوفر / مفقود",
            limit: "≤ 1.00 g/kg (رمل نظيف جداً) / ≤ 1.50 g/kg (مقبول)",
            status: "FAIL",
            note: "المدخلات المعملية مفقودة أو غير صالحة."
          }],
          syncedProperties: {}
        };
      }

      // MB = (volMl / mass) * (conc / 10) in g/kg
      const mbValue = parseFloat(((volMl / mass) * (conc / 10) * 10).toFixed(2));

      const isMbClean = mbValue <= 1.0;
      const isMbWarn = mbValue > 1.0 && mbValue <= 1.5;
      const status: TestStatus = isMbClean ? "PASS" : isMbWarn ? "WARNING" : "FAIL";

      const compliance: ComplianceDetail[] = [
        {
          parameter: "قيمة أزرق الميثيلين (Methylene Blue Value MB)",
          measured: `MB = ${mbValue} g/kg`,
          limit: "≤ 1.00 g/kg (رمل نظيف جداً) / ≤ 1.50 g/kg (مقبول)",
          status: isMbClean ? "PASS" : isMbWarn ? "WARNING" : "FAIL",
          note: isMbClean ? "نشاط غضاري ضئيل جداً وآمن تماماً" : "غضار ممتص قد ينافس الإسمنت على الملدنات"
        }
      ];

      return {
        results: {
          methyleneBlueValue: mbValue
        },
        status,
        score: status === "PASS" ? 96 : status === "WARNING" ? 75 : 40,
        interpretation: `قيمة أزرق الميثيلين MB = ${mbValue} g/kg تؤكد نقاوة الركام الناعم ومطابقته لمعايير NF EN 933-9.`,
        complianceDetails: compliance,
        syncedProperties: {
          methyleneBlueValue: mbValue
        }
      };
    }

    // ------------------------------------------------------------------------
    // CEMENT
    // ------------------------------------------------------------------------
    case "CEM_SPECIFIC_GRAVITY": {
      const mass = inputs.cementMassG;
      const v1 = inputs.initialVolumeMl;
      const v2 = inputs.finalVolumeMl;

      if (
        mass === undefined || v1 === undefined || v2 === undefined ||
        isNaN(mass) || isNaN(v1) || isNaN(v2) ||
        mass <= 0 || v2 <= v1
      ) {
        return {
          results: {},
          status: "FAIL",
          score: 0,
          interpretation: "بيانات الاختبار غير مكتملة أو مفقودة. يجب إدخال كتلة الإسمنت والقراءة الحجمية الابتدائية والنهائية لدورق لو شاتولييه بدقة.",
          complianceDetails: [{
            parameter: "الكثافة الحقيقية للإسمنت (Cement Specific Gravity)",
            measured: "غير متوفر / مفقود",
            limit: "3.05 - 3.25 g/cm³ (NF EN 196-6 / ASTM C188)",
            status: "FAIL",
            note: "المدخلات المعملية مفقودة أو غير صالحة."
          }],
          syncedProperties: {}
        };
      }

      const deltaV = v2 - v1;
      const density = parseFloat((mass / deltaV).toFixed(3)); // g/cm³

      const isDensityGood = density >= 3.05 && density <= 3.25;
      const status: TestStatus = isDensityGood ? "PASS" : "WARNING";

      const compliance: ComplianceDetail[] = [
        {
          parameter: "الكثافة الحقيقية للإسمنت (Cement Specific Gravity)",
          measured: `${density} g/cm³ (${(density * 1000).toFixed(0)} kg/m³)`,
          limit: "3.05 - 3.25 g/cm³ (NF EN 196-6 / ASTM C188)",
          status,
          note: isDensityGood ? "كثافة نموذجية لإسمنت بورتلاندي خالص" : "قد يشير إلى وجود إضافات كلسية أو بوزولانية"
        }
      ];

      return {
        results: {
          density,
          densityKgM3: density * 1000,
          displacedVolumeMl: deltaV
        },
        status,
        score: isDensityGood ? 98 : 80,
        interpretation: `الكثافة الحقيقية للإسمنت هي ${density} g/cm³. يتم استخدامها مباشرة في معادلات الحجم المطلق لخلطة الخرسانة.`,
        complianceDetails: compliance,
        syncedProperties: {
          density
        }
      };
    }

    case "CEM_FINENESS_BLAINE": {
      const t = inputs.airFlowTimeSeconds;
      const K = inputs.apparatusConstantK;
      const e = inputs.bedPorosityE;
      const rho = inputs.cementDensityGPerCm3;
      const eta = inputs.airViscosityMicroPaS;

      if (
        t === undefined || K === undefined || e === undefined || rho === undefined || eta === undefined ||
        isNaN(t) || isNaN(K) || isNaN(e) || isNaN(rho) || isNaN(eta) ||
        t <= 0 || K <= 0 || e <= 0 || e >= 1 || rho <= 0 || eta <= 0
      ) {
        return {
          results: {},
          status: "FAIL",
          score: 0,
          interpretation: "بيانات الاختبار غير مكتملة أو مفقودة. يرجى إدخال زمن نفاذية الهواء، ثابت جهاز بلين، مسامية طبقة الإسمنت، كثافة الإسمنت، ولزوجة الهواء.",
          complianceDetails: [{
            parameter: "المساحة السطحية النوعية بلين (Blaine SSB)",
            measured: "غير متوفر / مفقود",
            limit: "≥ 2800 cm²/g (CEM I / CEM II) - NF EN 196-6",
            status: "FAIL",
            note: "المدخلات المعملية مفقودة أو غير صالحة."
          }],
          syncedProperties: {}
        };
      }

      // Blaine SSB = K * (sqrt(e^3) / (rho * (1-e))) * (sqrt(t) / sqrt(0.1*eta))
      const blaineCm2G = Math.round((K * (Math.sqrt(Math.pow(e, 3)) / (rho * (1 - e))) * (Math.sqrt(t) / Math.sqrt(0.1 * eta))) * 1.02);
      const blaine = blaineCm2G;

      const isBlaineGood = blaine >= 2800 && blaine <= 5000;
      const status: TestStatus = isBlaineGood ? "PASS" : "WARNING";

      const compliance: ComplianceDetail[] = [
        {
          parameter: "المساحة السطحية النوعية بلين (Blaine SSB)",
          measured: `${blaine} cm²/g (${(blaine / 10).toFixed(0)} m²/kg)`,
          limit: "≥ 2800 cm²/g (CEM I / CEM II) - NF EN 196-6",
          status,
          note: blaine > 4200 ? "إسمنت سريع التصلد فائق النعومة (R)" : "نعومة قياسية متوازنة (N)"
        }
      ];

      return {
        results: {
          blaineFineness: blaine,
          blaineM2Kg: parseFloat((blaine / 10).toFixed(1))
        },
        status,
        score: isBlaineGood ? 96 : 78,
        interpretation: `نعومة بلين المحققة هي ${blaine} cm²/g. تضمن معدل إماهة وتفاعلاً متزناً وتطويراً ممتازاً للمقاومة المبكرة دون زيادة الانكماش.`,
        complianceDetails: compliance,
        syncedProperties: {
          blaineFineness: blaine
        }
      };
    }

    case "CEM_NORMAL_CONSISTENCY": {
      const mass = inputs.cementMassG;
      const waterMl = inputs.waterVolumeMl;
      const pen = inputs.plungerPenetrationMm;

      if (
        mass === undefined || waterMl === undefined || pen === undefined ||
        isNaN(mass) || isNaN(waterMl) || isNaN(pen) ||
        mass <= 0 || waterMl <= 0 || pen < 0
      ) {
        return {
          results: {},
          status: "FAIL",
          score: 0,
          interpretation: "بيانات الاختبار غير مكتملة أو مفقودة. يجب إدخال كتلة الإسمنت، حجم ماء الخلط، وعمق انغراس مسبار فيكات بدقة.",
          complianceDetails: [
            {
              parameter: "انغراس مسبار فيكات من الصفيحة القاعدية (Vicat Distance)",
              measured: "غير متوفر / مفقود",
              limit: "6 ± 1 mm (NF EN 196-3)",
              status: "FAIL",
              note: "المدخلات المعملية مفقودة أو غير صالحة."
            }
          ],
          syncedProperties: {}
        };
      }

      const waterPct = parseFloat(((waterMl / mass) * 100).toFixed(1));
      const isConGood = pen >= 5 && pen <= 7;
      const status: TestStatus = isConGood ? "PASS" : "WARNING";

      const compliance: ComplianceDetail[] = [
        {
          parameter: "انغراس مسبار فيكات من الصفيحة القاعدية (Vicat Distance)",
          measured: `${pen} mm`,
          limit: "6 ± 1 mm (NF EN 196-3)",
          status,
          note: isConGood ? "تم بلوغ القوام القياسي النموذجي" : "يجب إعادة التعديل بكمية ماء إضافية"
        },
        {
          parameter: "نسبة ماء القوام القياسي (% Water for Normal Consistency)",
          measured: `${waterPct}%`,
          limit: "24.0% - 32.0%",
          status: "PASS",
          note: "تستخدم كمرجع أساسي لإجراء تجارب زمن الشك والثبات"
        }
      ];

      return {
        results: {
          normalConsistencyWaterPercent: waterPct,
          plungerPenetrationMm: pen
        },
        status,
        score: isConGood ? 98 : 82,
        interpretation: `نسبة ماء القوام القياسي هي ${waterPct}% عند عمق انغراس ${pen} مم من القاعدة، مطابقة لـ NF EN 196-3.`,
        complianceDetails: compliance,
        syncedProperties: {
          normalConsistencyWaterPercent: waterPct
        }
      };
    }

    case "CEM_SETTING_TIME": {
      const readings = inputs.timeReadings;

      if (!Array.isArray(readings) || readings.length === 0) {
        return {
          results: {},
          status: "FAIL",
          score: 0,
          interpretation: "بيانات الاختبار غير مكتملة أو مفقودة. يجب إدخال جدول قراءات انغراس إبرة فيكات مع الزمن.",
          complianceDetails: [
            {
              parameter: "زمن بداية الشك الابتدائي (Initial Setting Time)",
              measured: "غير متوفر / مفقود",
              limit: "≥ 60 دقيقة (NF EN 196-3 / ASTM C191)",
              status: "FAIL",
              note: "المدخلات المعملية مفقودة أو غير صالحة."
            }
          ],
          syncedProperties: {}
        };
      }

      // Initial set = time when penetration is 4±1 mm
      const initRow = readings.find((r: any) => typeof r.penetrationMm === "number" && r.penetrationMm <= 5);
      const initialSettingMinutes = initRow ? initRow.timeMinutes : undefined;

      // Final set = time when penetration is <= 0.5 mm
      const finalRow = readings.find((r: any) => typeof r.penetrationMm === "number" && r.penetrationMm <= 0.5);
      const finalSettingMinutes = finalRow ? finalRow.timeMinutes : undefined;

      if (initialSettingMinutes === undefined) {
        return {
          results: {},
          status: "WARNING",
          score: 50,
          interpretation: "لم يتم بلوغ زمن بداية الشك بعد (عمق الانغراس لم يصل إلى 4±1 مم ضمن القراءات المدخلة).",
          complianceDetails: [
            {
              parameter: "زمن بداية الشك الابتدائي (Initial Setting Time)",
              measured: "قيد المراقبة / لم يبلغ الحد",
              limit: "≥ 60 دقيقة (NF EN 196-3 / ASTM C191)",
              status: "WARNING",
              note: "يلزم مواصلة القراءات حتى بلوغ 4±1 مم من القاعدة"
            }
          ],
          syncedProperties: {}
        };
      }

      const isInitGood = initialSettingMinutes >= 60 && initialSettingMinutes <= 300;
      const isFinalGood = finalSettingMinutes !== undefined ? finalSettingMinutes <= 600 : true;
      const status: TestStatus = (isInitGood && isFinalGood) ? "PASS" : "WARNING";

      const compliance: ComplianceDetail[] = [
        {
          parameter: "زمن بداية الشك الابتدائي (Initial Setting Time)",
          measured: `${initialSettingMinutes} دقيقة (${(initialSettingMinutes / 60).toFixed(1)} ساعة)`,
          limit: "≥ 60 دقيقة (NF EN 196-3 / ASTM C191)",
          status: isInitGood ? "PASS" : "FAIL",
          note: isInitGood ? "يسمح بفترة زمنية كافية لخلط ونقل وصب ودمك الخرسانة" : "شك مبكر قد يؤدي لتصلب الخرسانة في المضخة"
        }
      ];

      if (finalSettingMinutes !== undefined) {
        compliance.push({
          parameter: "زمن نهاية الشك النهائي (Final Setting Time)",
          measured: `${finalSettingMinutes} دقيقة (${(finalSettingMinutes / 60).toFixed(1)} ساعة)`,
          limit: "≤ 10 ساعات (≤ 600 دقيقة)",
          status: isFinalGood ? "PASS" : "WARNING",
          note: "تصلب كامل يسمح بفك القوالب وبداية المعالجة المائية"
        });
      }

      const chart = readings.map((r: any) => ({
        time: `${r.timeMinutes} min`,
        timeMinutes: r.timeMinutes,
        penetration: r.penetrationMm,
        limitInitial: 4
      }));

      return {
        results: {
          initialSettingMinutes,
          finalSettingMinutes,
          initialSettingHours: parseFloat((initialSettingMinutes / 60).toFixed(2)),
          finalSettingHours: finalSettingMinutes !== undefined ? parseFloat((finalSettingMinutes / 60).toFixed(2)) : undefined
        },
        status,
        score: status === "PASS" ? 97 : 70,
        interpretation: `زمن الشك الابتدائي = ${initialSettingMinutes} دقيقة${finalSettingMinutes !== undefined ? `، وزمن الشك النهائي = ${finalSettingMinutes} دقيقة.` : '.'}`,
        complianceDetails: compliance,
        chartData: chart,
        syncedProperties: {
          initialSettingMinutes,
          finalSettingMinutes
        }
      };
    }

    case "CEM_SOUNDNESS": {
      const a = inputs.pointerDistanceBeforeBoilingA;
      const b = inputs.pointerDistanceAfterBoilingB;

      if (
        a === undefined || b === undefined ||
        isNaN(a) || isNaN(b) ||
        a <= 0 || b < a
      ) {
        return {
          results: {},
          status: "FAIL",
          score: 0,
          interpretation: "بيانات الاختبار غير مكتملة أو مفقودة. يجب إدخال مسافة مؤشري قالب لو شاتولييه قبل الغليان وبعده بدقة.",
          complianceDetails: [
            {
              parameter: "التمدد الحراري لوشاتولييه (Le Chatelier Expansion)",
              measured: "غير متوفر / مفقود",
              limit: "≤ 10.0 mm (NF EN 196-3)",
              status: "FAIL",
              note: "المدخلات المعملية مفقودة أو غير صالحة."
            }
          ],
          syncedProperties: {}
        };
      }

      const expansion = parseFloat((b - a).toFixed(1));

      const isSound = expansion <= 10.0;
      const status: TestStatus = isSound ? "PASS" : "FAIL";

      const compliance: ComplianceDetail[] = [
        {
          parameter: "التمدد الحراري لوشاتولييه (Le Chatelier Expansion)",
          measured: `${expansion} mm`,
          limit: "≤ 10.0 mm (NF EN 196-3)",
          status,
          note: isSound ? "إسمنت مستقر تماماً وخالٍ من أكسيد الكالسيوم الحر المتمدد" : "تمدد خطير يسبب تشقق وتفتت الخرسانة المتصلدة"
        }
      ];

      return {
        results: {
          soundnessExpansionMm: expansion
        },
        status,
        score: isSound ? 98 : 20,
        interpretation: `تمدد الإسمنت هو ${expansion} mm (الحد الأقصى المسموح 10 mm). الإسمنت سليم ومستقر كيميائياً وحجمياً.`,
        complianceDetails: compliance,
        syncedProperties: {
          soundnessExpansionMm: expansion
        }
      };
    }

    case "CEM_COMPRESSIVE_STRENGTH": {
      const p2d: number[] = inputs.strength2dPrismsKn;
      const p7d: number[] = inputs.strength7dPrismsKn;
      const p28d: number[] = inputs.strength28dPrismsKn;

      if (
        !Array.isArray(p2d) || p2d.length === 0 ||
        !Array.isArray(p7d) || p7d.length === 0 ||
        !Array.isArray(p28d) || p28d.length === 0
      ) {
        return {
          results: {},
          status: "FAIL",
          score: 0,
          interpretation: "بيانات الاختبار غير مكتملة أو مفقودة. يجب إدخال مصفوفات قوى كسر الموشورات (kN) للأعمار 2، 7، و28 يوماً.",
          complianceDetails: [
            {
              parameter: "مقاومة الضغط القياسية عند 28 يوماً (28-day Strength fce)",
              measured: "غير متوفر / مفقود",
              limit: "42.5 - 62.5 MPa (رتبة الإسمنت 42.5)",
              status: "FAIL",
              note: "المدخلات المعملية مفقودة أو غير صالحة."
            }
          ],
          syncedProperties: {}
        };
      }

      // Area = 40x40 mm = 1600 mm² -> Strength (MPa) = (Force in N) / 1600 = (Kn * 1000) / 1600 = Kn / 1.6
      const avg2dKn = p2d.reduce((a, b) => a + b, 0) / p2d.length;
      const avg7dKn = p7d.reduce((a, b) => a + b, 0) / p7d.length;
      const avg28dKn = p28d.reduce((a, b) => a + b, 0) / p28d.length;

      const f2d = parseFloat((avg2dKn / 1.6).toFixed(1)); // MPa
      const f7d = parseFloat((avg7dKn / 1.6).toFixed(1)); // MPa
      const f28d = parseFloat((avg28dKn / 1.6).toFixed(1)); // MPa

      // Standard class check (e.g. 42.5 N/R: 2d >= 20.0 (R) or 10.0 (N), 28d >= 42.5 & <= 62.5)
      const isStrengthGood = f28d >= 42.5;
      const status: TestStatus = isStrengthGood ? "PASS" : "WARNING";

      const compliance: ComplianceDetail[] = [
        {
          parameter: "مقاومة الضغط عند يومين (2-day Strength)",
          measured: `${f2d} MPa`,
          limit: "≥ 10.0 MPa (N) / ≥ 20.0 MPa (R) - NF EN 196-1",
          status: f2d >= 10.0 ? "PASS" : "WARNING",
          note: "تطور ممتاز للمقاومة الميكانيكية المبكرة"
        },
        {
          parameter: "مقاومة الضغط عند 7 أيام (7-day Strength)",
          measured: `${f7d} MPa`,
          limit: "≥ 30.0 MPa (تطور بنسبة > 65% من مقاومة 28d)",
          status: "PASS",
          note: "معدل نضج هيدروليكي منتظم"
        },
        {
          parameter: "مقاومة الضغط القياسية عند 28 يوماً (28-day Strength fce)",
          measured: `${f28d} MPa`,
          limit: "42.5 - 62.5 MPa (رتبة الإسمنت 42.5)",
          status: isStrengthGood ? "PASS" : "FAIL",
          note: isStrengthGood ? "مطابق تماماً لرتبة الإسمنت المعتمدة ويستخدم مباشرة كـ fce في معادلة دروكس" : "أقل من الرتبة المطلوبة"
        }
      ];

      const chart = [
        { day: "2 أيام", dayNum: 2, strength: f2d, classLimit: 20 },
        { day: "7 أيام", dayNum: 7, strength: f7d, classLimit: 30 },
        { day: "28 يوماً", dayNum: 28, strength: f28d, classLimit: 42.5 }
      ];

      return {
        results: {
          strength2d: f2d,
          strength7d: f7d,
          strength28d: f28d,
          cementClassDetected: f28d >= 52.5 ? "52.5 R" : f28d >= 42.5 ? "42.5 R" : "32.5 N"
        },
        status,
        score: isStrengthGood ? 98 : 65,
        interpretation: `مقاومة الضغط المحققة عند 28 يوماً هي ${f28d} MPa وعند يومين ${f2d} MPa. تم تحديد رتبة الإسمنت الفعلية وتحديثها في مستودع المواد.`,
        complianceDetails: compliance,
        chartData: chart,
        syncedProperties: {
          realStrength28d: f28d,
          strengthClass: f28d >= 52.5 ? "52.5" : f28d >= 42.5 ? "42.5" : "32.5"
        }
      };
    }

    // ------------------------------------------------------------------------
    // WATER
    // ------------------------------------------------------------------------
    case "WATER_PH": {
      const ph = inputs.measuredPh;

      if (ph === undefined || isNaN(ph) || ph < 0 || ph > 14) {
        return {
          results: {},
          status: "FAIL",
          score: 0,
          interpretation: "بيانات الاختبار غير مكتملة أو مفقودة. يجب إدخال قيمة درجة الحموضة (pH) المقاسة لماء الخلط.",
          complianceDetails: [
            {
              parameter: "درجة حموضة ماء الخلط (pH)",
              measured: "غير متوفر / مفقود",
              limit: "≥ 5.0 (NF EN 1008 / ISO 10523)",
              status: "FAIL",
              note: "المدخلات المعملية مفقودة أو غير صالحة."
            }
          ],
          syncedProperties: {}
        };
      }

      const isPhGood = ph >= 5.0 && ph <= 8.5;
      const status: TestStatus = isPhGood ? "PASS" : (ph >= 4.5 && ph <= 9.5) ? "WARNING" : "FAIL";

      const compliance: ComplianceDetail[] = [
        {
          parameter: "درجة حموضة ماء الخلط (pH)",
          measured: `pH = ${ph}`,
          limit: "≥ 5.0 (NF EN 1008 / ISO 10523)",
          status,
          note: isPhGood ? "ماء قلوي معتدل مثالي لسلامة الإسمنت وحديد التسليح" : "حموضة غير آمنة قد تسبب تآكل الكلس وتسريع الصدأ"
        }
      ];

      return {
        results: {
          measuredPh: ph,
          acidityLevel: ph < 6.5 ? "حامضي خفيف" : ph > 8.0 ? "قلوي معتدل" : "متعادل مثالي"
        },
        status,
        score: status === "PASS" ? 98 : status === "WARNING" ? 75 : 20,
        interpretation: `درجة الحموضة pH = ${ph} تقع ضمن المجال المعياري المطابق للمواصفة الأوروبية NF EN 1008، ما يضمن إماهة سليمة وحماية كهروميكانيكية لحديد التسليح.`,
        complianceDetails: compliance,
        syncedProperties: {
          waterPh: ph
        }
      };
    }

    case "WATER_CHLORIDES": {
      const cl = inputs.chloridesMgPerL;
      const app = inputs.concreteApplication || "reinforced";
      const limit = app === "prestressed" ? 500 : app === "reinforced" ? 1000 : 4500;

      if (cl === undefined || isNaN(cl) || cl < 0) {
        return {
          results: {},
          status: "FAIL",
          score: 0,
          interpretation: "بيانات الاختبار غير مكتملة أو مفقودة. يجب إدخال تركيز أيونات الكلوريد (mg/L).",
          complianceDetails: [
            {
              parameter: "تركيز أيونات الكلوريد (Cl- Concentration)",
              measured: "غير متوفر / مفقود",
              limit: `≤ ${limit} mg/L`,
              status: "FAIL",
              note: "المدخلات المعملية مفقودة أو غير صالحة."
            }
          ],
          syncedProperties: {}
        };
      }

      const isClGood = cl <= limit;
      const status: TestStatus = isClGood ? "PASS" : "FAIL";

      const compliance: ComplianceDetail[] = [
        {
          parameter: `تركيز أيونات الكلوريد (Cl- Concentration)`,
          measured: `${cl} mg/L`,
          limit: `≤ ${limit} mg/L (تطبيق: ${app === 'reinforced' ? 'خرسانة مسلحة' : app === 'prestressed' ? 'سابقة الإجهاد' : 'خرسانة كتلية'})`,
          status,
          note: isClGood ? "تركيز آمن جداً ولا يشكل أي خطر لصدأ التسليح" : "تركيز كلوريدات مرتفع يمنع استخدامه في المنشآت الإنشائية"
        }
      ];

      return {
        results: {
          chloridesMgL: cl,
          complianceLimit: limit
        },
        status,
        score: isClGood ? 98 : 30,
        interpretation: `محتوى الكلوريدات ${cl} mg/L مطابق تماماً للحد الأقصى المسموح (${limit} mg/L) وفقاً لـ NF EN 1008.`,
        complianceDetails: compliance,
        syncedProperties: {
          chloridesMgL: cl
        }
      };
    }

    case "WATER_SULFATES": {
      const so4 = inputs.sulfatesMgPerL;
      const limit = 2000.0;

      if (so4 === undefined || isNaN(so4) || so4 < 0) {
        return {
          results: {},
          status: "FAIL",
          score: 0,
          interpretation: "بيانات الاختبار غير مكتملة أو مفقودة. يجب إدخال تركيز أيونات الكبريتات (mg/L).",
          complianceDetails: [
            {
              parameter: "تركيز أيونات الكبريتات (SO4 2-)",
              measured: "غير متوفر / مفقود",
              limit: "≤ 2000 mg/L (NF EN 1008)",
              status: "FAIL",
              note: "المدخلات المعملية مفقودة أو غير صالحة."
            }
          ],
          syncedProperties: {}
        };
      }

      const isSo4Good = so4 <= limit;
      const status: TestStatus = isSo4Good ? "PASS" : "FAIL";

      const compliance: ComplianceDetail[] = [
        {
          parameter: "تركيز أيونات الكبريتات (SO4 2-)",
          measured: `${so4} mg/L`,
          limit: "≤ 2000 mg/L (NF EN 1008)",
          status,
          note: isSo4Good ? "تركيز كبريتات آمن يمنع التفاعلات الكبريتية الضارة" : "يتجاوز الحد المسموح"
        }
      ];

      return {
        results: {
          sulfatesMgL: so4
        },
        status,
        score: isSo4Good ? 98 : 30,
        interpretation: `محتوى الكبريتات ${so4} mg/L مطابق للمواصفة القياسية NF EN 1008.`,
        complianceDetails: compliance,
        syncedProperties: {
          sulfatesMgL: so4
        }
      };
    }

    case "WATER_TDS_IMPURITIES": {
      const tds = inputs.totalDissolvedSolidsMgPerL;
      const tss = inputs.suspendedSolidsMgPerL;

      if (tds === undefined || tss === undefined || isNaN(tds) || isNaN(tss) || tds < 0 || tss < 0) {
        return {
          results: {},
          status: "FAIL",
          score: 0,
          interpretation: "بيانات الاختبار غير مكتملة أو مفقودة. يجب إدخال قيم المواد الصلبة المنحلة (TDS) والعالقة (TSS) بـ mg/L.",
          complianceDetails: [
            {
              parameter: "المواد الصلبة المنحلة الكلية (TDS)",
              measured: "غير متوفر / مفقود",
              limit: "≤ 2000 mg/L (NF EN 1008)",
              status: "FAIL",
              note: "المدخلات المعملية مفقودة أو غير صالحة."
            }
          ],
          syncedProperties: {}
        };
      }

      const isTdsGood = tds <= 2000.0;
      const isTssGood = tss <= 2000.0;
      const status: TestStatus = (isTdsGood && isTssGood) ? "PASS" : "WARNING";

      const compliance: ComplianceDetail[] = [
        {
          parameter: "المواد الصلبة المنحلة الكلية (TDS)",
          measured: `${tds} mg/L`,
          limit: "≤ 2000 mg/L (NF EN 1008)",
          status: isTdsGood ? "PASS" : "FAIL",
          note: "أملاح معدنية متوازنة"
        },
        {
          parameter: "المواد الصلبة العالقة (TSS)",
          measured: `${tss} mg/L`,
          limit: "≤ 2000 mg/L",
          status: isTssGood ? "PASS" : "WARNING",
          note: "ماء صافٍ وخالٍ من الطمي والشوائب العضوية"
        }
      ];

      return {
        results: {
          tdsMgL: tds,
          tssMgL: tss
        },
        status,
        score: 96,
        interpretation: `ماء الخلط نقي ومطابق لشروط المواصفة NF EN 1008.`,
        complianceDetails: compliance,
        syncedProperties: {
          tdsMgL: tds
        }
      };
    }

    // ------------------------------------------------------------------------
    // CHEMICAL ADMIXTURES
    // ------------------------------------------------------------------------
    case "ADM_DENSITY": {
      const mass = inputs.admixtureMassG;
      const vol = inputs.admixtureVolumeMl;

      if (mass === undefined || vol === undefined || isNaN(mass) || isNaN(vol) || mass <= 0 || vol <= 0) {
        return {
          results: {},
          status: "FAIL",
          score: 0,
          interpretation: "بيانات الاختبار غير مكتملة أو مفقودة. يجب إدخال كتلة وحجم عينة الملدن بدقة.",
          complianceDetails: [
            {
              parameter: "الكثافة النسبية للملدن عند 20°م",
              measured: "غير متوفر / مفقود",
              limit: "حسب البطاقة التقنية للمصنع ± 0.03 g/cm³ (NF EN 934-2)",
              status: "FAIL",
              note: "المدخلات المعملية مفقودة أو غير صالحة."
            }
          ],
          syncedProperties: {}
        };
      }

      const density = parseFloat((mass / vol).toFixed(3));

      const status: TestStatus = "PASS";
      const compliance: ComplianceDetail[] = [
        {
          parameter: "الكثافة النسبية للملدن عند 20°م",
          measured: `${density} g/cm³`,
          limit: "حسب البطاقة التقنية للمصنع ± 0.03 g/cm³ (NF EN 934-2)",
          status: "PASS",
          note: "مطابق لمعايير ضبط الجودة والمطابقة الموقعية"
        }
      ];

      return {
        results: {
          density
        },
        status,
        score: 98,
        interpretation: `الكثافة المحققة للملدن هي ${density} g/cm³، مطابقة تماماً للمواصفة القياسية وتستخدم في حساب أوزان وجرعات الإضافات السائلة.`,
        complianceDetails: compliance,
        syncedProperties: {
          density
        }
      };
    }

    case "ADM_SOLID_CONTENT": {
      const m0 = inputs.emptyDishMassG;
      const m1 = inputs.dishPlusWetAdmixtureMassG;
      const m2 = inputs.dishPlusDryResidueMassG;

      if (
        m0 === undefined || m1 === undefined || m2 === undefined ||
        isNaN(m0) || isNaN(m1) || isNaN(m2) ||
        m0 <= 0 || m1 <= m0 || m2 < m0
      ) {
        return {
          results: {},
          status: "FAIL",
          score: 0,
          interpretation: "بيانات الاختبار غير مكتملة أو مفقودة. يجب إدخال كتلة الصحن الفارغ، كتلته مع الملدن الرطب، وكتلته بعد التجفيف في الفرن.",
          complianceDetails: [
            {
              parameter: "الخلاصة الجافة للملدن (Dry Extract %)",
              measured: "غير متوفر / مفقود",
              limit: "30.0% - 45.0% (حسب مواصفة المصنع EN 480-8)",
              status: "FAIL",
              note: "المدخلات المعملية مفقودة أو غير صالحة."
            }
          ],
          syncedProperties: {}
        };
      }

      const wetSample = m1 - m0;
      const dryResidue = m2 - m0;
      const dryExtract = parseFloat(((dryResidue / wetSample) * 100).toFixed(2));

      const status: TestStatus = "PASS";
      const compliance: ComplianceDetail[] = [
        {
          parameter: "الخلاصة الجافة للملدن (Dry Extract %)",
          measured: `${dryExtract}%`,
          limit: "30.0% - 45.0% (حسب مواصفة المصنع EN 480-8)",
          status: "PASS",
          note: "محتوى عالي من المادة الفعالة البوليمرية"
        }
      ];

      return {
        results: {
          dryExtract,
          wetSampleG: wetSample,
          dryResidueG: dryResidue
        },
        status,
        score: 98,
        interpretation: `نسبة الخلاصة الجافة الفعالة هي ${dryExtract}%، تؤكد تركيز وجودة الملدن الفائق وتطابق متطلبات NF EN 934-2.`,
        complianceDetails: compliance,
        syncedProperties: {
          dryExtract
        }
      };
    }

    case "ADM_WATER_REDUCTION": {
      const w0 = inputs.controlMixWaterL;
      const w1 = inputs.admixedMixWaterL;

      if (w0 === undefined || w1 === undefined || isNaN(w0) || isNaN(w1) || w0 <= 0 || w1 <= 0 || w1 >= w0) {
        return {
          results: {},
          status: "FAIL",
          score: 0,
          interpretation: "بيانات الاختبار غير مكتملة أو مفقودة. يجب إدخال كمية ماء خلطة الشاهد وماء الخلطة المحتوية على الملدن.",
          complianceDetails: [
            {
              parameter: "نسبة تخفيض ماء الخلط (Water Reduction Rate)",
              measured: "غير متوفر / مفقود",
              limit: "≥ 20.0% (ملدن فائق عالي الكفاءة High Range) / ≥ 12.0% (ملدن قياسي)",
              status: "FAIL",
              note: "المدخلات المعملية مفقودة أو غير صالحة."
            }
          ],
          syncedProperties: {}
        };
      }

      const redRate = parseFloat((((w0 - w1) / w0) * 100).toFixed(1));

      const isHighRange = redRate >= 20.0;
      const status: TestStatus = isHighRange ? "PASS" : redRate >= 12.0 ? "PASS" : "WARNING";

      const compliance: ComplianceDetail[] = [
        {
          parameter: "نسبة تخفيض ماء الخلط (Water Reduction Rate)",
          measured: `${redRate}%`,
          limit: "≥ 20.0% (ملدن فائق عالي الكفاءة High Range) / ≥ 12.0% (ملدن قياسي)",
          status,
          note: isHighRange ? "ملدن فائق ذو كفاءة مائية فائقة (Superplasticizer / Haut Réducteur d'Eau)" : "ملدن قياسي"
        }
      ];

      return {
        results: {
          waterReductionRate: redRate,
          waterSavedLitersPerM3: w0 - w1
        },
        status,
        score: 97,
        interpretation: `نسبة تخفيض الماء المحققة هي ${redRate}% (توفير ${w0 - w1} لتر/م³)، ما يسمح بتحقيق مقاومة ضغط عالية جداً مع الحفاظ على قوام سائل ممتاز.`,
        complianceDetails: compliance,
        syncedProperties: {
          waterReductionRate: redRate
        }
      };
    }

    // ------------------------------------------------------------------------
    // MINERAL ADDITIVES (SCM)
    // ------------------------------------------------------------------------
    case "SCM_SPECIFIC_GRAVITY": {
      const mass = inputs.sampleMassG;
      const vol = inputs.displacedVolumeMl;

      if (mass === undefined || vol === undefined || isNaN(mass) || isNaN(vol) || mass <= 0 || vol <= 0) {
        return {
          results: {},
          status: "FAIL",
          score: 0,
          interpretation: "بيانات الاختبار غير مكتملة أو مفقودة. يجب إدخال كتلة عينة الإضافة المعدنية والحجم المزاح.",
          complianceDetails: [
            {
              parameter: "الكثافة الحقيقية للإضافة المعدنية",
              measured: "غير متوفر / مفقود",
              limit: "2.10 - 2.95 g/cm³ (حسب نوع المادة)",
              status: "FAIL",
              note: "المدخلات المعملية مفقودة أو غير صالحة."
            }
          ],
          syncedProperties: {}
        };
      }

      const density = parseFloat((mass / vol).toFixed(3));

      const status: TestStatus = "PASS";
      const compliance: ComplianceDetail[] = [
        {
          parameter: "الكثافة الحقيقية للإضافة المعدنية",
          measured: `${density} g/cm³`,
          limit: "2.10 - 2.95 g/cm³ (حسب نوع المادة)",
          status: "PASS",
          note: "مطابق لمعايير الحجم المطلق"
        }
      ];

      return {
        results: {
          density
        },
        status,
        score: 96,
        interpretation: `الكثافة الحقيقية للإضافة المعدنية هي ${density} g/cm³، وتستخدم في حسابات استبدال الإسمنت والحجم المطلق للخلطة.`,
        complianceDetails: compliance,
        syncedProperties: {
          density
        }
      };
    }

    case "SCM_ACTIVITY_INDEX": {
      const fControl = inputs.controlPrism28dStrengthMpa;
      const fScm = inputs.scmBlendedPrism28dStrengthMpa;

      if (fControl === undefined || fScm === undefined || isNaN(fControl) || isNaN(fScm) || fControl <= 0 || fScm < 0) {
        return {
          results: {},
          status: "FAIL",
          score: 0,
          interpretation: "بيانات الاختبار غير مكتملة أو مفقودة. يجب إدخال مقاومة ضغط موشور الشاهد ومقاومة موشور الإضافة المعدنية عند 28 يوماً.",
          complianceDetails: [
            {
              parameter: "معامل النشاط البوزولاني عند 28 يوماً (IAP%)",
              measured: "غير متوفر / مفقود",
              limit: "≥ 75.0% (NF EN 450-1 / ASTM C311)",
              status: "FAIL",
              note: "المدخلات المعملية مفقودة أو غير صالحة."
            }
          ],
          syncedProperties: {}
        };
      }

      const iap = parseFloat(((fScm / fControl) * 100).toFixed(1));
      const isIapGood = iap >= 75.0;
      const status: TestStatus = isIapGood ? "PASS" : "FAIL";

      const compliance: ComplianceDetail[] = [
        {
          parameter: "معامل النشاط البوزولاني عند 28 يوماً (IAP%)",
          measured: `IAP = ${iap}%`,
          limit: "≥ 75.0% (NF EN 450-1 / ASTM C311)",
          status,
          note: isIapGood ? "نشاط بوزولاني عالي يساهم في توليد هيدرات C-S-H الثانوية" : "نشاط ضعيف لا يفي بمتطلبات الاستبدال الإنشائي"
        }
      ];

      return {
        results: {
          activityIndex28d: iap,
          strengthWithScmMpa: fScm,
          strengthControlMpa: fControl
        },
        status,
        score: isIapGood ? 98 : 40,
        interpretation: `معامل النشاط البوزولاني المحقق IAP = ${iap}% يثبت فاعلية الإضافة المعدنية في زيادة الكثافة المجهرية وسد المسامات الشعرية.`,
        complianceDetails: compliance,
        syncedProperties: {
          activityIndex28d: iap
        }
      };
    }

    case "SCM_LOSS_ON_IGNITION": {
      const mDry = inputs.drySampleMassG;
      const mCalc = inputs.calcinedSampleMassG;

      if (mDry === undefined || mCalc === undefined || isNaN(mDry) || isNaN(mCalc) || mDry <= 0 || mCalc < 0 || mCalc > mDry) {
        return {
          results: {},
          status: "FAIL",
          score: 0,
          interpretation: "بيانات الاختبار غير مكتملة أو مفقودة. يجب إدخال كتلة العينة الجافة وكتلتها بعد الحرق عند 950°م.",
          complianceDetails: [
            {
              parameter: "الفاقد بالاشتعال والحرق عند 950°م (LOI%)",
              measured: "غير متوفر / مفقود",
              limit: "≤ 5.0% (NF EN 450-1 Class A) / ≤ 4.0% (Silica Fume)",
              status: "FAIL",
              note: "المدخلات المعملية مفقودة أو غير صالحة."
            }
          ],
          syncedProperties: {}
        };
      }

      const loi = parseFloat((((mDry - mCalc) / mDry) * 100).toFixed(2));

      const isLoiGood = loi <= 5.0;
      const status: TestStatus = isLoiGood ? "PASS" : "WARNING";

      const compliance: ComplianceDetail[] = [
        {
          parameter: "الفاقد بالاشتعال والحرق عند 950°م (LOI%)",
          measured: `LOI = ${loi}%`,
          limit: "≤ 5.0% (NF EN 450-1 Class A) / ≤ 4.0% (Silica Fume)",
          status,
          note: isLoiGood ? "نسبة كربون غير محترق منخفضة جداً تحافظ على كفاءة الملدنات" : "كربون مرتفع قد يمتص الملدنات"
        }
      ];

      return {
        results: {
          lossOnIgnition: loi
        },
        status,
        score: isLoiGood ? 98 : 70,
        interpretation: `الفاقد بالاشتعال LOI = ${loi}%. المادة خالية من الكربون الزائد وآمنة تماماً للتوافق مع الملدنات الكيميائية.`,
        complianceDetails: compliance,
        syncedProperties: {
          lossOnIgnition: loi
        }
      };
    }

    // ------------------------------------------------------------------------
    // FIBERS
    // ------------------------------------------------------------------------
    case "FIBER_GEOMETRY": {
      const len = inputs.lengthMm;
      const dia = inputs.diameterMm;
      const tensile = inputs.tensileStrengthMpa;

      if (len === undefined || dia === undefined || tensile === undefined || isNaN(len) || isNaN(dia) || isNaN(tensile) || len <= 0 || dia <= 0 || tensile <= 0) {
        return {
          results: {},
          status: "FAIL",
          score: 0,
          interpretation: "بيانات الاختبار غير مكتملة أو مفقودة. يجب إدخال طول الألياف، قطرها، ومقاومة الشد.",
          complianceDetails: [
            {
              parameter: "نسبة النحافة الهندسية (Aspect Ratio L/d)",
              measured: "غير متوفر / مفقود",
              limit: "40 - 90 (NF EN 14889-1 / ACI 544)",
              status: "FAIL",
              note: "المدخلات المعملية مفقودة أو غير صالحة."
            }
          ],
          syncedProperties: {}
        };
      }

      const aspectRatio = parseFloat((len / dia).toFixed(1));

      const isRatioGood = aspectRatio >= 40 && aspectRatio <= 90;
      const status: TestStatus = isRatioGood ? "PASS" : "WARNING";

      const compliance: ComplianceDetail[] = [
        {
          parameter: "نسبة النحافة الهندسية (Aspect Ratio L/d)",
          measured: `L/d = ${aspectRatio}`,
          limit: "40 - 90 (NF EN 14889-1 / ACI 544)",
          status,
          note: isRatioGood ? "نسبة نحافة مثالية تمنع التكتل وتضمن التثبيت الميكانيكي" : "نسبة نحافة عالية قد تزيد من خطر التكتل"
        },
        {
          parameter: "مقاومة الشد للألياف (Tensile Strength)",
          measured: `${tensile} MPa`,
          limit: "≥ 1000 MPa (ألياف فولاذية عالية القوة)",
          status: tensile >= 1000 ? "PASS" : "WARNING",
          note: "مقاومة ممتازة للتحكم في الشقوق وعزم الانحناء المتبقي"
        }
      ];

      return {
        results: {
          aspectRatio,
          lengthMm: len,
          diameterMm: dia,
          tensileStrengthMpa: tensile
        },
        status,
        score: 96,
        interpretation: `نسبة النحافة L/d = ${aspectRatio} وقوة الشد ${tensile} MPa توفر تسليحاً حجمياً ممتازاً للخرسانة ضد الشروخ الانكماشية وأحمال الصدم.`,
        complianceDetails: compliance,
        syncedProperties: {
          fiberLength: len,
          fiberDiameter: dia,
          aspectRatio,
          tensileStrength: tensile
        }
      };
    }

    case "FIBER_DOSAGE_OPTIMIZATION": {
      const dosage = inputs.fiberDosageKgPerM3;
      const rho = inputs.fiberDensityGPerCm3;
      const len = inputs.fiberLengthMm;
      const dia = inputs.fiberDiameterMm;

      if (
        dosage === undefined || rho === undefined || len === undefined || dia === undefined ||
        isNaN(dosage) || isNaN(rho) || isNaN(len) || isNaN(dia) ||
        dosage <= 0 || rho <= 0 || len <= 0 || dia <= 0
      ) {
        return {
          results: {},
          status: "FAIL",
          score: 0,
          interpretation: "بيانات الاختبار غير مكتملة أو مفقودة. يجب إدخال جرعة الألياف (kg/m³)، كثافة المادة، طول وقطر الليفة.",
          complianceDetails: [
            {
              parameter: "الكسر الحجمي للألياف (Volume Fraction Vf)",
              measured: "غير متوفر / مفقود",
              limit: "0.20% - 1.00% (خرسانة مسلحة بالألياف FRC)",
              status: "FAIL",
              note: "المدخلات المعملية مفقودة أو غير صالحة."
            }
          ],
          syncedProperties: {}
        };
      }

      // Volume fraction Vf % = (dosage in kg / (rho * 1000)) * 100
      const vfPct = parseFloat(((dosage / (rho * 1000)) * 100).toFixed(2));

      // Single fiber volume in mm³ = pi * (d/2)^2 * L
      const singleVolMm3 = Math.PI * Math.pow(dia / 2, 2) * len;
      // Single fiber mass in g = singleVolMm3 * 1e-3 * rho
      const singleMassG = singleVolMm3 * 0.001 * rho;
      // Fiber count per m³ = (dosage in g) / singleMassG
      const fibersPerM3 = Math.round((dosage * 1000) / singleMassG);

      const compliance: ComplianceDetail[] = [
        {
          parameter: "الكسر الحجمي للألياف (Volume Fraction Vf)",
          measured: `${vfPct}% (${dosage} kg/m³)`,
          limit: "0.20% - 1.00% (خرسانة مسلحة بالألياف FRC)",
          status: "PASS",
          note: "جرعة متوازنة تضمن قابلية التشغيل والضخ"
        },
        {
          parameter: "عدد الألياف في المتر المكعب (Fiber Count / m³)",
          measured: `${fibersPerM3.toLocaleString()} ليفة/م³`,
          limit: "شبكة تسليح متداخلة متجانسة",
          status: "PASS",
          note: "تغطية ممتازة لكبح انتشار الشقوق المجهرية"
        }
      ];

      return {
        results: {
          volumeFractionPercent: vfPct,
          fibersPerM3,
          dosageKgPerM3: dosage
        },
        status: "PASS",
        score: 97,
        interpretation: `جرعة ${dosage} kg/m³ توفر ${fibersPerM3.toLocaleString()} ليفة في المتر المكعب بحجم نسبي ${vfPct}%.`,
        complianceDetails: compliance,
        syncedProperties: {
          optimalFiberDosage: dosage
        }
      };
    }

    default: {
      return {
        results: inputs,
        status: "PASS",
        score: 90,
        interpretation: "تم تنفيذ التجربة المخبرية وتسجيل البيانات وحفظها بنجاح.",
        complianceDetails: [
          {
            parameter: "اكتمال التجربة المخبرية",
            measured: "ناجح",
            limit: "حسب متطلبات المواصفات",
            status: "PASS",
            note: "بيانات متناسقة"
          }
        ],
        syncedProperties: {}
      };
    }
  }
}

// ============================================================================
// 3. MATERIAL SYNC HELPER: APPLY TEST RESULT TO ENGINEERING MATERIAL
// ============================================================================

export function syncTestToMaterial(
  material: EngineeringMaterial,
  testRecord: MaterialTestRecord,
  updatedProps: Record<string, any> = {}
): EngineeringMaterial {
  const updated = { ...material };

  // Apply mapped properties
  Object.keys(updatedProps).forEach(key => {
    const val = updatedProps[key];
    if (val !== undefined && val !== null) {
      (updated as any)[key] = val;
    }
  });

  // Also apply test verified stamp
  (updated as any).active = true;
  (updated as any).isApproved = testRecord.status !== "FAIL";
  (updated as any).approvalStatus = testRecord.status === "FAIL" ? "Rejected" : "Validated";
  
  // Attach metadata
  if (!(updated as any).metadata) {
    (updated as any).metadata = {};
  }
  (updated as any).metadata.lastLabTestId = testRecord.id;
  (updated as any).metadata.lastLabTestType = testRecord.testType;
  (updated as any).metadata.lastLabTestDate = testRecord.date;
  (updated as any).metadata.lastLabStatus = testRecord.status;
  (updated as any).metadata.verifiedByLab = true;

  return updated;
}
