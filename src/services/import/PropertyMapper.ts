import { ConfidenceLevel, PropertyMappingMatch } from "./types";
import { UnitNormalizer } from "./UnitNormalizer";

export interface PropertyTargetDefinition {
  key: string;
  canonicalId: string;
  labelAr: string;
  labelEn: string;
  labelFr: string;
  expectedType: "number" | "string" | "boolean";
  expectedUnit?: string;
  synonyms: string[];
  regex?: RegExp;
  typicalValueRange?: { min: number; max: number };
  applicableCategories?: string[];
}

export const CANONICAL_TARGET_PROPERTIES: PropertyTargetDefinition[] = [
  {
    key: "name",
    canonicalId: "PROP-NAME",
    labelAr: "اسم المادة",
    labelEn: "Material Name",
    labelFr: "Nom du matériau",
    expectedType: "string",
    synonyms: [
      "name", "material name", "material", "designation", "désignation", "libelle", "libellé", "product", "item",
      "اسم", "اسم المادة", "الاسم", "المادة", "المنتج", "العنصر", "nom", "nom du produit", "désignation du matériau"
    ],
    regex: /^(name|material|designation|désignation|libelle|libellé|اسم|الاسم|المادة)$/i
  },
  {
    key: "englishName",
    canonicalId: "PROP-ENGLISH-NAME",
    labelAr: "الاسم بالإنجليزية",
    labelEn: "English Name",
    labelFr: "Nom en anglais",
    expectedType: "string",
    synonyms: [
      "english name", "englishname", "name_en", "nom anglais", "designation en", "en_name",
      "الاسم بالانجليزية", "الاسم بالإنجليزية", "الاسم العلمي", "english"
    ],
    regex: /(english|anglais|name_en|_en)/i
  },
  {
    key: "category",
    canonicalId: "PROP-CATEGORY",
    labelAr: "التصنيف / الفئة",
    labelEn: "Category",
    labelFr: "Catégorie",
    expectedType: "string",
    synonyms: [
      "category", "catégorie", "type", "classification", "nature", "famille", "genre", "groupe",
      "الفئة", "التصنيف", "النوع", "الصنف", "نوع المادة", "تصنيف المادة"
    ],
    regex: /^(category|catégorie|type|classification|فئة|صنف|تصنيف)$/i
  },
  {
    key: "specificGravity",
    canonicalId: "PROP-SPECIFIC-GRAVITY",
    labelAr: "الوزن النوعي / الكثافة الحقيقية",
    labelEn: "Specific Gravity / Relative Density",
    labelFr: "Densité relative / Masse volumique absolue",
    expectedType: "number",
    expectedUnit: "-",
    synonyms: [
      "specific gravity", "specificgravity", "sg", "relative density", "relativedensity", "rel density", "g_s", "rho_s", "ρ_s",
      "densité relative", "densite relative", "masse volumique absolue", "densité absolue", "mv absolue", "d_s",
      "الوزن النوعي", "الكثافة الحقيقية", "الكثافة المطلقة", "الكثافة النسبية", "الوزن الحجمي المطلق"
    ],
    regex: /(specific.*grav|relative.*dens|densit.*relat|densit.*absol|masse.*volumique.*absol|وزن.*نوعي|كثافة.*حقيقية|كثافة.*مطلقة|\bsg\b)/i,
    typicalValueRange: { min: 1.0, max: 4.5 }
  },
  {
    key: "density",
    canonicalId: "PROP-BULK-DENSITY",
    labelAr: "الكثافة الكلية (كغ/م³)",
    labelEn: "Density (kg/m³)",
    labelFr: "Masse volumique (kg/m³)",
    expectedType: "number",
    expectedUnit: "kg/m³",
    synonyms: [
      "density", "bulk density", "bulkdensity", "apparent density", "density kg/m3", "mv", "mva",
      "masse volumique", "masse volumique apparente", "densité", "densite", "densité apparente",
      "الكثافة", "الكثافة الظاهرية", "الكتلة الحجمية", "كثافة الركام", "الكتلة الحجمية الظاهرية"
    ],
    regex: /(^density|bulk.*density|masse.*volumique|كثافة|الكتلة.*الحجمية|\bmv\b|\bmva\b)/i,
    typicalValueRange: { min: 600, max: 3500 }
  },
  {
    key: "ssdDensity",
    canonicalId: "PROP-SSD-DENSITY",
    labelAr: "كثافة التشبع السطحي الجاف (SSD)",
    labelEn: "SSD Density (kg/m³)",
    labelFr: "Masse volumique SSD (kg/m³)",
    expectedType: "number",
    expectedUnit: "kg/m³",
    synonyms: [
      "ssd density", "ssddensity", "density ssd", "saturated surface dry", "mv ssd", "densité ssd",
      "الكثافة المشبعة الجافة", "كثافة ssd", "الكتلة الحجمية ssd"
    ],
    regex: /(ssd|saturated.*surface.*dry|مشبع.*سطح)/i,
    typicalValueRange: { min: 1500, max: 3500 }
  },
  {
    key: "absorption",
    canonicalId: "PROP-ABSORPTION",
    labelAr: "امتصاص الماء (%)",
    labelEn: "Water Absorption (%)",
    labelFr: "Absorption d'eau (%)",
    expectedType: "number",
    expectedUnit: "%",
    synonyms: [
      "water absorption", "absorption", "abs", "water_absorption", "absorption rate", "wa",
      "absorption d'eau", "taux d'absorption", "coef d'absorption", "absorption eau",
      "امتصاص الماء", "الامتصاص", "نسبة الامتصاص", "امتصاصية", "امتصاص"
    ],
    regex: /(absorp|taux.*absorp|امتصاص|\babs\b|\bwa\b)/i,
    typicalValueRange: { min: 0, max: 25 }
  },
  {
    key: "moisture",
    canonicalId: "PROP-MOISTURE",
    labelAr: "محتوى الرطوبة (%)",
    labelEn: "Moisture Content (%)",
    labelFr: "Teneur en eau / Humidité (%)",
    expectedType: "number",
    expectedUnit: "%",
    synonyms: [
      "moisture", "moisture content", "water content", "humidity", "moisture_%", "w",
      "teneur en eau", "humidité", "humidite", "taux d'humidité",
      "الرطوبة", "محتوى الرطوبة", "نسبة الرطوبة", "المحتوى المائي"
    ],
    regex: /(moist|humid|teneur.*eau|رطوبة|المحتوى.*المائي)/i,
    typicalValueRange: { min: 0, max: 30 }
  },
  {
    key: "finenessModulus",
    canonicalId: "PROP-FM",
    labelAr: "معامل النعومة (FM)",
    labelEn: "Fineness Modulus (FM)",
    labelFr: "Module de finesse (Mf)",
    expectedType: "number",
    expectedUnit: "-",
    synonyms: [
      "fineness modulus", "finenessmodulus", "fm", "fineness", "modulus", "mf",
      "module de finesse", "module finesse",
      "معامل النعومة", "معيار النعومة", "نعومة الرمل", "موديول النعومة"
    ],
    regex: /(fineness.*modul|module.*finesse|معامل.*النعومة|معيار.*النعومة|\bfm\b|\bmf\b)/i,
    typicalValueRange: { min: 1.0, max: 4.5 }
  },
  {
    key: "dMax",
    canonicalId: "PROP-DMAX",
    labelAr: "المقاس الأقصى للركام Dmax (مم)",
    labelEn: "Maximum Aggregate Size Dmax (mm)",
    labelFr: "Diamètre maximal Dmax (mm)",
    expectedType: "number",
    expectedUnit: "mm",
    synonyms: [
      "dmax", "d_max", "max aggregate size", "maximum size", "aggregate size", "nominal max size",
      "diamètre maximal", "diametre maximal", "diamètre max", "d max", "taille max",
      "المقاس الأقصى", "قطر أكبر حبة", "أكبر مقاس حبيبي", "الحجم الأقصى للحصى", "دي ماكس"
    ],
    regex: /(dmax|d_max|max.*size|diam[eè]tre.*max|المقاس.*الأقصى|قطر.*أكبر)/i,
    typicalValueRange: { min: 1.0, max: 63.0 }
  },
  {
    key: "SandEquivalent",
    canonicalId: "PROP-SAND-EQUIVALENT",
    labelAr: "المكافئ الرملي (SE %)",
    labelEn: "Sand Equivalent (SE %)",
    labelFr: "Équivalent de sable (ES %)",
    expectedType: "number",
    expectedUnit: "%",
    synonyms: [
      "sand equivalent", "sandequivalent", "se", "es", "cleanliness",
      "équivalent de sable", "equivalent de sable", "equivalent sable",
      "المكافئ الرملي", "مكافئ الرمل", "نقاء الرمل"
    ],
    regex: /(sand.*equiv|equiv.*sable|المكافئ.*الرملي|\bse\b|\bes\b)/i,
    typicalValueRange: { min: 40, max: 100 }
  },
  {
    key: "LosAngeles",
    canonicalId: "PROP-LOS-ANGELES",
    labelAr: "معامل لوس أنجلوس (LA %)",
    labelEn: "Los Angeles Abrasion (LA %)",
    labelFr: "Coefficient Los Angeles (LA %)",
    expectedType: "number",
    expectedUnit: "%",
    synonyms: [
      "los angeles", "losangeles", "la", "los angeles abrasion", "la abrasion",
      "coefficient los angeles", "essai los angeles",
      "معامل لوس أنجلوس", "لوس انجلوس", "مقاومة التفتت بالصدم"
    ],
    regex: /(los.*angeles|لوس.*انجلوس|\bla\b)/i,
    typicalValueRange: { min: 5, max: 55 }
  },
  {
    key: "strength28d",
    canonicalId: "PROP-CEM-STRENGTH-28D",
    labelAr: "مقاومة الإسمنت المعيارية 28 يوماً (MPa)",
    labelEn: "Standard Cement Strength 28 Days (MPa)",
    labelFr: "Résistance normale à 28 jours (MPa)",
    expectedType: "number",
    expectedUnit: "MPa",
    synonyms: [
      "strength", "compressive strength", "cement strength", "strength 28d", "fck28", "fc28", "f_c28",
      "résistance 28j", "resistance 28 jours", "classe de résistance",
      "مقاومة 28 يوم", "مقاومة الإسمنت", "مقاومة الضغط", "رتبة المقاومة"
    ],
    regex: /(strength.*28|fc28|fck28|résistance.*28|مقاومة.*28)/i,
    typicalValueRange: { min: 20, max: 80 }
  },
  {
    key: "cementClass",
    canonicalId: "PROP-CEM-CLASS",
    labelAr: "صنف الإسمنت (CEM)",
    labelEn: "Cement Classification",
    labelFr: "Type / Classe de ciment",
    expectedType: "string",
    synonyms: [
      "cement class", "cement type", "cem class", "cem type", "cement classification",
      "type de ciment", "classe de ciment", "catégorie ciment",
      "صنف الإسمنت", "نوع الإسمنت", "رتبة الإسمنت"
    ],
    regex: /(cem.*type|cement.*class|type.*ciment|صنف.*الإسمنت)/i
  },
  {
    key: "recommendedDosage",
    canonicalId: "PROP-ADMIX-DOSAGE",
    labelAr: "الجرعة الموصى بها (%)",
    labelEn: "Recommended Dosage (%)",
    labelFr: "Dosage recommandé (%)",
    expectedType: "number",
    expectedUnit: "%",
    synonyms: [
      "dosage", "recommended dosage", "dosage range", "admixture dosage",
      "dosage recommandé", "dosage admissible", "taux de dosage",
      "الجرعة", "الجرعة الموصى بها", "نسبة الإضافة", "عيار الإضافة"
    ],
    regex: /(dosage|dose|جرعة)/i,
    typicalValueRange: { min: 0.1, max: 10 }
  },
  {
    key: "waterReduction",
    canonicalId: "PROP-WATER-REDUCTION",
    labelAr: "نسبة تخفيض الماء (%)",
    labelEn: "Water Reduction (%)",
    labelFr: "Réduction d'eau (%)",
    expectedType: "number",
    expectedUnit: "%",
    synonyms: [
      "water reduction", "water reducing", "wr", "water cut",
      "réduction d'eau", "pouvoir réducteur d'eau",
      "تخفيض الماء", "نسبة تخفيض الماء", "توفير المياه"
    ],
    regex: /(water.*reduc|r[eé]duction.*eau|تخفيض.*الماء)/i,
    typicalValueRange: { min: 2, max: 40 }
  },
  {
    key: "pozzolanicIndex",
    canonicalId: "PROP-SCM-ACTIVITY-INDEX",
    labelAr: "معامل النشاط البوزولاني (%)",
    labelEn: "Pozzolanic / Activity Index (%)",
    labelFr: "Indice d'activité pouzzolanique (%)",
    expectedType: "number",
    expectedUnit: "%",
    synonyms: [
      "pozzolanic index", "activity index", "sai", "pozzolanic activity",
      "indice d'activité", "indice pouzzolanique", "indice d'activite",
      "معامل النشاط البوزولاني", "النشاط البوزولاني", "معامل الفعالية"
    ],
    regex: /(pozzolan.*index|activity.*index|indice.*activit|نشاط.*بوزولان)/i,
    typicalValueRange: { min: 50, max: 150 }
  },
  {
    key: "pH",
    canonicalId: "PROP-WATER-PH",
    labelAr: "الرقم الهيدروجيني (pH)",
    labelEn: "pH Value",
    labelFr: "Valeur pH",
    expectedType: "number",
    expectedUnit: "-",
    synonyms: [
      "ph", "ph value", "ph_w", "potential hydrogen", "valeur ph",
      "الرقم الهيدروجيني", "درجة الحموضة", "حموضة الماء"
    ],
    regex: /(^ph$|\bph.*val|الرقم.*الهيدروجيني|درجة.*الحموضة)/i,
    typicalValueRange: { min: 1, max: 14 }
  },
  {
    key: "chlorides",
    canonicalId: "PROP-WATER-CHLORIDES",
    labelAr: "محتوى الكلوريدات (mg/L)",
    labelEn: "Chloride Content (mg/L)",
    labelFr: "Teneur en chlorures (mg/L)",
    expectedType: "number",
    expectedUnit: "mg/L",
    synonyms: [
      "chlorides", "chloride", "cl-", "chlorides_ppm", "chlorures",
      "الكلوريدات", "نسبة الكلور", "أيونات الكلور"
    ],
    regex: /(chlorid|chlorur|كلوريد|\bcl-\b)/i,
    typicalValueRange: { min: 0, max: 5000 }
  },
  {
    key: "sulfates",
    canonicalId: "PROP-WATER-SULFATES",
    labelAr: "محتوى الكبريتات (mg/L)",
    labelEn: "Sulfate Content (mg/L)",
    labelFr: "Teneur en sulfates (mg/L)",
    expectedType: "number",
    expectedUnit: "mg/L",
    synonyms: [
      "sulfates", "sulphates", "so4", "so4--", "sulfates_ppm",
      "الكبريتات", "نسبة الكبريتات", "سلفات"
    ],
    regex: /(sulfat|sulphat|كبريتات|\bso4\b)/i,
    typicalValueRange: { min: 0, max: 5000 }
  },
  {
    key: "provenance",
    canonicalId: "PROP-SOURCE",
    labelAr: "المصدر / المنشأ",
    labelEn: "Source / Provenance",
    labelFr: "Provenance / Source",
    expectedType: "string",
    synonyms: [
      "source", "provenance", "origin", "gisement", "carrière", "quarry", "supplier", "location",
      "المصدر", "المنشأ", "المحجر", "المورد", "الموقع", "مكان الاستخراج"
    ],
    regex: /(source|provenance|origin|gisement|carri|quarry|منشأ|مصدر|محجر)/i
  },
  {
    key: "price",
    canonicalId: "PROP-PRICE",
    labelAr: "السعر (دج/طن أو دج/كغ)",
    labelEn: "Price (DZD)",
    labelFr: "Prix (DZD)",
    expectedType: "number",
    expectedUnit: "DZD",
    synonyms: [
      "price", "cost", "unit price", "unit cost", "prix", "cout", "coût", "tarif",
      "السعر", "التكلفة", "سعر الوحدة", "السعر بالدينار"
    ],
    regex: /(price|cost|prix|co[uû]t|tarif|سعر|تكلفة)/i,
    typicalValueRange: { min: 0, max: 500000 }
  },
  {
    key: "notes",
    canonicalId: "PROP-NOTES",
    labelAr: "ملاحظات / وصف",
    labelEn: "Notes / Description",
    labelFr: "Notes / Remarques",
    expectedType: "string",
    synonyms: [
      "notes", "note", "description", "remarks", "comments", "remarques", "commentaires",
      "ملاحظات", "الوصف", "الملاحظات", "تعليق"
    ],
    regex: /(notes?|description|remarques?|ملاحظ)/i
  },
  {
    key: "fiberType",
    canonicalId: "PROP-FIBER-TYPE",
    labelAr: "نوع الألياف",
    labelEn: "Fiber Type",
    labelFr: "Type de fibre",
    expectedType: "string",
    synonyms: [
      "fiber type", "fiber_type", "fibre type", "type de fibre", "type fibre", "fiber material",
      "نوع الألياف", "نوع الالياف", "صنف الألياف", "صنف الالياف", "مادة الألياف", "ألياف فولاذية", "ألياف بولي بروبيلين"
    ],
    regex: /(fiber.*type|fibre.*type|type.*fibre|نوع.*الياف|نوع.*ألياف|صنف.*الياف)/i
  },
  {
    key: "fiberLength",
    canonicalId: "PROP-FIBER-LENGTH",
    labelAr: "طول الألياف (مم)",
    labelEn: "Fiber Length (mm)",
    labelFr: "Longueur des fibres (mm)",
    expectedType: "number",
    expectedUnit: "mm",
    synonyms: [
      "fiber length", "fiber_length", "length of fiber", "longueur des fibres", "longueur fibre", "fibre length",
      "طول الألياف", "طول الالياف", "طول الليف", "مقاس الألياف"
    ],
    regex: /(fiber.*length|fibre.*length|longueur.*fibre|طول.*الياف|طول.*ألياف)/i,
    typicalValueRange: { min: 3, max: 80 }
  },
  {
    key: "aspectRatio",
    canonicalId: "PROP-FIBER-ASPECT-RATIO",
    labelAr: "عامل النحافة / نسبة الأبعاد (L/d)",
    labelEn: "Aspect Ratio (L/d)",
    labelFr: "Élancement / Aspect Ratio (L/d)",
    expectedType: "number",
    expectedUnit: "-",
    synonyms: [
      "aspect ratio", "aspectratio", "aspect_ratio", "l/d", "l_d", "élancement", "elancement",
      "عامل النحافة", "نسبة الأبعاد", "نسبة الابعاد", "النحافة", "نسبة الطول إلى القطر"
    ],
    regex: /(aspect.*ratio|[eé]lancement|\bl\/d\b|عامل.*نحافة|نسبة.*أبعاد|نسبة.*ابعاد)/i,
    typicalValueRange: { min: 10, max: 150 }
  },
  {
    key: "tensileStrength",
    canonicalId: "PROP-TENSILE-STRENGTH",
    labelAr: "مقاومة الشد (MPa)",
    labelEn: "Tensile Strength (MPa)",
    labelFr: "Résistance à la traction (MPa)",
    expectedType: "number",
    expectedUnit: "MPa",
    synonyms: [
      "tensile strength", "tensilestrength", "tensile", "résistance à la traction", "resistance traction",
      "مقاومة الشد", "قوة الشد", "مقاومة الشد للألياف", "إجهاد الشد"
    ],
    regex: /(tensile.*strength|r[eé]sistance.*traction|مقاومة.*شد|قوة.*الشد)/i,
    typicalValueRange: { min: 100, max: 3500 }
  },
  {
    key: "waterDemandFactor",
    canonicalId: "PROP-WATER-DEMAND-FACTOR",
    labelAr: "عامل طلب الماء للإضافة",
    labelEn: "Water Demand Factor",
    labelFr: "Facteur de demande d'eau",
    expectedType: "number",
    expectedUnit: "-",
    synonyms: [
      "water demand factor", "water demand", "demande en eau", "facteur de demande d'eau",
      "عامل طلب الماء", "معامل الاحتياج المائي", "طلب الماء"
    ],
    regex: /(water.*demand|demande.*eau|طلب.*ماء|احتياج.*مائي)/i,
    typicalValueRange: { min: 0.7, max: 1.5 }
  },
  {
    key: "finenessBlaine",
    canonicalId: "PROP-SCM-FINENESS",
    labelAr: "المساحة النوعية بلين (m²/kg)",
    labelEn: "Blaine Fineness (m²/kg)",
    labelFr: "Surface spécifique Blaine (m²/kg)",
    expectedType: "number",
    expectedUnit: "m²/kg",
    synonyms: [
      "blaine fineness", "blaine", "specific surface area", "surface spécifique blaine", "ssb",
      "نعومة بلين", "المساحة النوعية بلين", "سطح بلين", "معيار بلين"
    ],
    regex: /(blaine|surface.*sp[eé]cifique|\bssb\b|نعومة.*بلين|مساحة.*نوعية)/i,
    typicalValueRange: { min: 200, max: 3000 }
  }
];

export class PropertyMapper {
  /**
   * Normalizes raw header text for robust lexical matching.
   */
  public static normalizeHeader(str: string): string {
    if (!str) return "";
    return str
      .toLowerCase()
      .trim()
      .replace(/[\(\)\[\]{}_,;:\/\\-]/g, " ")
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ي/g, "ى")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Evaluates mapping match for a given header, sample values, and context.
   * Returns a match with ConfidenceLevel: HIGH, MEDIUM, LOW, or NEEDS_REVIEW.
   */
  public static matchHeader(
    rawHeader: string,
    sampleValues?: any[],
    contextCategory?: string
  ): PropertyMappingMatch {
    const normalized = PropertyMapper.normalizeHeader(rawHeader);

    // 1. Direct Ignore check for standard row numbers, empty columns, indices
    if (!normalized || /^(id|index|#|no|num|n°|col|column|الرقم|رقم|تسلسل)$/i.test(normalized)) {
      return {
        canonicalPropertyId: "PROP-IGNORE",
        canonicalKey: "ignore",
        propertyLabelAr: "تخطي العمود",
        propertyLabelEn: "Ignore Column",
        propertyLabelFr: "Ignorer",
        confidence: "HIGH",
        confidenceScore: 95,
        matchedVia: "EXACT_SYNONYM",
        explanation: "عمود ترقيم أو معرف تقني لا يحتوي على خاصية هندسية.",
        isNeedsReview: false
      };
    }

    let bestField: PropertyTargetDefinition | null = null;
    let highestScore = 0;
    let matchMethod: "EXACT_SYNONYM" | "FUZZY_ALIAS" | "UNIT_HEURISTIC" | "VALUE_RANGE" | "MANUAL" = "FUZZY_ALIAS";
    let explanation = "";

    for (const field of CANONICAL_TARGET_PROPERTIES) {
      let score = 0;

      // A. Exact Synonym check
      const hasExactSynonym = field.synonyms.some(s => {
        const normSyn = PropertyMapper.normalizeHeader(s);
        return normSyn === normalized;
      });

      if (hasExactSynonym) {
        score = 98;
        matchMethod = "EXACT_SYNONYM";
        explanation = `تطابق تام مع الاسم المعياري "${field.labelAr}".`;
      } else if (field.regex && field.regex.test(normalized)) {
        score = 88;
        matchMethod = "FUZZY_ALIAS";
        explanation = `تطابق نمطي (Regex) مع "${field.labelAr}".`;
      } else {
        // Substring / Token containment
        const tokens = normalized.split(" ");
        const matchToken = field.synonyms.some(s => {
          const normSyn = PropertyMapper.normalizeHeader(s);
          return normSyn.length > 2 && (normalized.includes(normSyn) || tokens.includes(normSyn));
        });
        if (matchToken) {
          score = 72;
          matchMethod = "FUZZY_ALIAS";
          explanation = `تطابق جزئي للكلمات المفتاحية مع "${field.labelAr}".`;
        }
      }

      // B. Unit alignment check (if header contains e.g. "kg/m³" or "%")
      if (field.expectedUnit) {
        const extracted = UnitNormalizer.extractNumberAndUnit(rawHeader);
        if (extracted.unit === field.expectedUnit) {
          score += 15;
          explanation += ` (الوحدة المكتشفة ${extracted.unit} متطابقة).`;
        }
      }

      // C. Context Category bonus (e.g. finenessModulus makes more sense for sand)
      if (contextCategory && field.applicableCategories) {
        if (field.applicableCategories.includes(contextCategory)) {
          score += 5;
        }
      }

      // D. Sample values numeric distribution check
      if (sampleValues && sampleValues.length > 0 && field.typicalValueRange && field.expectedType === "number") {
        const numbers = sampleValues
          .map(v => UnitNormalizer.extractNumberAndUnit(v).value)
          .filter((v): v is number => v !== null && !isNaN(v));

        if (numbers.length > 0) {
          const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
          const inRange = avg >= field.typicalValueRange.min && avg <= field.typicalValueRange.max;
          if (inRange) {
            score += 10;
            explanation += ` (القيم النموذجية في النطاق: ${avg.toFixed(1)}).`;
          } else {
            // Significant mismatch with expected physical range penalizes the score
            if (avg < field.typicalValueRange.min / 3 || avg > field.typicalValueRange.max * 3) {
              score = Math.max(0, score - 25);
            }
          }
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestField = field;
      }
    }

    // Determine confidence level
    let confidence: ConfidenceLevel = "NEEDS_REVIEW";
    let isNeedsReview = true;

    if (highestScore >= 85) {
      confidence = "HIGH";
      isNeedsReview = false;
    } else if (highestScore >= 65) {
      confidence = "MEDIUM";
      isNeedsReview = false;
    } else if (highestScore >= 45) {
      confidence = "LOW";
      isNeedsReview = true;
    } else {
      confidence = "NEEDS_REVIEW";
      isNeedsReview = true;
    }

    if (!bestField || highestScore < 35) {
      return {
        canonicalPropertyId: "PROP-UNKNOWN",
        canonicalKey: "ignore",
        propertyLabelAr: "غير معروف (Needs Review)",
        propertyLabelEn: "Unmapped / Needs Review",
        propertyLabelFr: "Non mappé / À vérifier",
        confidence: "NEEDS_REVIEW",
        confidenceScore: Math.min(25, highestScore),
        matchedVia: "MANUAL",
        explanation: "لم نتمكن من مطابقة هذا العمود بموثوقية عالية، يرجى اختياره يدوياً.",
        isNeedsReview: true
      };
    }

    return {
      canonicalPropertyId: bestField.canonicalId,
      canonicalKey: bestField.key,
      propertyLabelAr: bestField.labelAr,
      propertyLabelEn: bestField.labelEn,
      propertyLabelFr: bestField.labelFr,
      confidence,
      confidenceScore: Math.min(100, highestScore),
      matchedVia: matchMethod,
      explanation,
      isNeedsReview,
      expectedUnit: bestField.expectedUnit
    };
  }

  /**
   * Helper to map an array of headers simultaneously.
   */
  public static mapHeaders(
    headers: string[],
    sampleRows?: any[],
    contextCategory?: string
  ): Record<string, PropertyMappingMatch> {
    const results: Record<string, PropertyMappingMatch> = {};
    headers.forEach(h => {
      const sampleVals = sampleRows ? sampleRows.map(r => r[h]).filter(v => v !== undefined && v !== null) : undefined;
      results[h] = PropertyMapper.matchHeader(h, sampleVals, contextCategory);
    });
    return results;
  }
}
