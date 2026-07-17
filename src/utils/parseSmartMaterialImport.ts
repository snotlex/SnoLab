import { EngineeringMaterial } from "../types";

export interface SchemaField {
  key: string;
  labelAr: string;
  labelEn: string;
  labelFr: string;
  type: "string" | "number" | "boolean";
  required?: boolean;
  synonyms: string[];
  regex?: RegExp;
}

export const TARGET_FIELDS: SchemaField[] = [
  {
    key: "name",
    labelAr: "اسم المادة (العربية)",
    labelEn: "Material Name (Arabic)",
    labelFr: "Nom du matériau (Arabe)",
    type: "string",
    required: true,
    synonyms: ["اسم", "اسم المادة", "الاسم", "nom", "name", "material", "designation", "désignation", "libelle", "libellé", "product", "المنتج", "libellé arabe", "اسم بالعربية", "ar_name", "arabicname", "arabic name", "nom du matériau"],
    regex: /^(اسم|الاسم|nom|name|designation|désignation|libelle|libellé|product|المنتج|arabicname|ar_name)$/i
  },
  {
    key: "englishName",
    labelAr: "الاسم بالإنجليزية",
    labelEn: "English Name",
    labelFr: "Nom en anglais",
    type: "string",
    synonyms: ["الاسم بالانجليزية", "الاسم بالإنجليزية", "english name", "nom anglais", "englishname", "name_en", "nom_en", "libellé anglais", "designation english", "en_name", "english_name"],
    regex: /(english|anglais|en_name|_en|englishname)/i
  },
  {
    key: "category",
    labelAr: "التصنيف / الفئة",
    labelEn: "Category",
    labelFr: "Catégorie",
    type: "string",
    synonyms: ["الفئة", "التصنيف", "النوع", "الصنف", "category", "type", "catégorie", "classement", "genre", "groupe", "classification", "nature", "subclass", "subcategory"],
    regex: /^(category|catégorie|classification|classification_type|تصنيف|صنف|فئة)$/i
  },
  {
    key: "density",
    labelAr: "الكثافة (كغ/م³)",
    labelEn: "Density (kg/m³)",
    labelFr: "Masse Volumique (kg/m³)",
    type: "number",
    synonyms: ["الكثافة", "density", "densité", "masse volumique", "mv", "density_kg_m3", "densite", "الكتلة الحجمية", "masse_volumique", "bulk density", "bulkdensity", "apparent density"],
    regex: /^(density|densit|volumique|mv|كثافة|الكتلة الحجمية|masse_volumique)$/i
  },
  {
    key: "absorption",
    labelAr: "امتصاص الماء (%)",
    labelEn: "Water Absorption (%)",
    labelFr: "Absorption d'eau (%)",
    type: "number",
    synonyms: ["الامتصاص", "امتصاص", "absorption", "water absorption", "absorption d'eau", "abs", "water_absorption", "taux d'absorption", "امتصاص الماء", "absorbance"],
    regex: /(absorp|abs|امتصاص)/i
  },
  {
    key: "moisture",
    labelAr: "محتوى الرطوبة (%)",
    labelEn: "Moisture Content (%)",
    labelFr: "Teneur en eau / Humidité (%)",
    type: "number",
    synonyms: ["الرطوبة", "محتوى الرطوبة", "moisture", "moisture content", "humidité", "teneur en eau", "w", "moisture_content", "humidity", "نسبة الرطوبة", "moisturecontent"],
    regex: /(moist|humid|teneur.*eau|رطوب|w_content|humidity)/i
  },
  {
    key: "provenance",
    labelAr: "المنشأ / المصدر",
    labelEn: "Provenance / Source",
    labelFr: "Provenance / Source",
    type: "string",
    synonyms: ["المنشأ", "المصدر", "الحقل", "provenance", "source", "origin", "gisement", "carrière", "lieu", "carriere", "المورد", "مصدر", "supplier", "wilaya", "الولاية", "ولاية"],
    regex: /(provenance|source|origin|gisement|carri|lieu|منشأ|مصدر|حقل|مورد|wilaya|ولاية)/i
  },
  {
    key: "price",
    labelAr: "السعر (دج/طن أو دج/م³)",
    labelEn: "Price (DZD)",
    labelFr: "Prix (DZD)",
    type: "number",
    synonyms: ["السعر", "التكلفة", "سعر", "price", "cost", "prix", "tarif", "cout", "coût", "السعر بالدينار", "unitprice", "unit price"],
    regex: /(price|cost|prix|tarif|cout|coût|سعر|تكلفة)/i
  },
  {
    key: "status",
    labelAr: "الحالة (نشط/موقوف)",
    labelEn: "Status",
    labelFr: "Statut",
    type: "string",
    synonyms: ["الحالة", "الوضعية", "status", "état", "etat", "statut", "actif", "active", "الموقف", "approvalstatus", "approval status"],
    regex: /^(status|statut|etat|état|حالة|وضعية|approvalstatus)$/i
  },
  {
    key: "notes",
    labelAr: "الملاحظات / الوصف",
    labelEn: "Notes / Description",
    labelFr: "Remarques / Description",
    type: "string",
    synonyms: ["ملاحظات", "ملاحظة", "وصف", "الوصف", "notes", "description", "desc", "remarques", "remarque", "details", "détails", "تفاصيل", "remark"],
    regex: /(note|desc|remarque|detail|وصف|ملاحظ)/i
  },
  {
    key: "specificGravity",
    labelAr: "الوزن النوعي",
    labelEn: "Specific Gravity",
    labelFr: "Densité relative / SG",
    type: "number",
    synonyms: ["الوزن النوعي", "الكثافة النوعية", "specific gravity", "sg", "densité relative", "densite relative", "specific_gravity", "الوزن الحجمي النوعي", "relative density"],
    regex: /(specific\s*grav|sg|relative\s*dens|وزن.*نوعي|كثافة.*نوعية)/i
  },
  {
    key: "finenessModulus",
    labelAr: "معيار النعومة (FM)",
    labelEn: "Fineness Modulus (FM)",
    labelFr: "Module de finesse (MF)",
    type: "number",
    synonyms: ["معاير النعومة", "معامل النعومة", "معيار النعومة", "fineness modulus", "fm", "module de finesse", "mdf", "mf", "fineness_modulus", "نعومة", "module de finesse mf"],
    regex: /(fineness|modulus|fm|module.*finesse|mf|نعومة|معاير.*نعومة)/i
  },
  {
    key: "dMax",
    labelAr: "القطر الأقصى Dmax (مم)",
    labelEn: "Dmax size (mm)",
    labelFr: "Taille maximale Dmax (mm)",
    type: "number",
    synonyms: ["القطر الأقصى", "الحجم الأقصى", "القطر الاعظمي", "dmax", "d_max", "max size", "taille maximale", "diametre max", "diamètre max", "d_maximum", "max_size", "الحجم الحبيبي الأقصى", "d max"],
    regex: /(dmax|d_max|max.*size|taille.*max|diametre.*max|أقصى.*قطر|أعظمي.*قطر|حجم.*أقصى)/i
  },
  {
    key: "bulkDensity",
    labelAr: "الكثافة الظاهرية (كغ/م³)",
    labelEn: "Bulk Density (kg/m³)",
    labelFr: "Masse Volumique Apparente",
    type: "number",
    synonyms: ["الكثافة الظاهرية", "الكثافة الجافة", "الكثافة السائبة", "bulk density", "masse volumique apparente", "mva", "bulk_density", "كثافة ظاهرية"],
    regex: /(bulk.*dens|apparente|mva|كثافة.*ظاهرية|كثافة.*سائبة)/i
  },
  {
    key: "ssdDensity",
    labelAr: "الكثافة المشبعة SSD (كغ/م³)",
    labelEn: "SSD Density (kg/m³)",
    labelFr: "Masse Volumique SSD",
    type: "number",
    synonyms: ["الكثافة المشبعة", "كثافة ssd", "ssd density", "ssd_density", "masse volumique ssd", "ssd", "كثافة مشبعة جافة السطح"],
    regex: /(ssd|مشبعة|كثافة.*ssd)/i
  },
  {
    key: "SandEquivalent",
    labelAr: "المكافئ الرملي (%)",
    labelEn: "Sand Equivalent (%)",
    labelFr: "Équivalent de sable (%)",
    type: "number",
    synonyms: ["المكافئ الرملي", "مكافئ الرمل", "sand equivalent", "se", "équivalent de sable", "equivalent de sable", "sand_equivalent", "es", "مكافئ رملي", "equivalent de sable es"],
    regex: /(sand\s*equiv|se|sable\s*equiv|es|équivalent.*sable|مكافئ.*رمل)/i
  },
  {
    key: "LosAngeles",
    labelAr: "مقاومة لوس أنجلوس (%)",
    labelEn: "Los Angeles (%)",
    labelFr: "Coefficient Los Angeles (%)",
    type: "number",
    synonyms: ["لوس انجلوس", "لوس أنجلوس", "مقاومة لوس انجلوس", "los angeles", "la", "coefficient los angeles", "los_angeles", "معامل لوس أنجلوس", "los angeles la", "coefficient los angeles la"],
    regex: /(los\s*angel|la\s*coef|coefficient\s*los|لوس.*أنجل|لوس.*انجل)/i
  },
  {
    key: "cementClass",
    labelAr: "صنف الإسمنت",
    labelEn: "Cement Class",
    labelFr: "Classe de ciment",
    type: "string",
    synonyms: ["صنف الاسمنت", "صنف الإسمنت", "نوع الإسمنت", "cement class", "cement type", "classe de ciment", "type de ciment", "cement_class", "رتبة الإسمنت"],
    regex: /(cement\s*class|cement\s*type|ciment.*class|صنف.*اسمنت|نوع.*اسمنت)/i
  },
  {
    key: "strengthClass",
    labelAr: "رتبة مقاومة الإسمنت",
    labelEn: "Strength Class",
    labelFr: "Classe de résistance",
    type: "string",
    synonyms: ["رتبة المقاومة", "المقاومة", "رتبة مقاومة الاسمنت", "strength class", "strength", "classe de résistance", "classe de resistance", "strength_class", "مقاومة الإسمنت", "strength rating"],
    regex: /(strength\s*class|resistance\s*class|رتبة.*مقاومة|مقاومة.*اسمنت)/i
  },
  {
    key: "recommendedDosage",
    labelAr: "الجرعة الموصى بها (%)",
    labelEn: "Recommended Dosage (%)",
    labelFr: "Dosage recommandé (%)",
    type: "number",
    synonyms: ["الجرعة", "الجرعة المقترحة", "الجرعة الموصى بها", "recommended dosage", "dosage", "dose", "recommended_dosage", "نسبة الجرعة", "admixture dosage"],
    regex: /(dosage|dose|جرعة|الجرعة)/i
  },
  {
    key: "waterReduction",
    labelAr: "نسبة تخفيض الماء (%)",
    labelEn: "Water Reduction (%)",
    labelFr: "Réduction d'eau (%)",
    type: "number",
    synonyms: ["توفير الماء", "تخفيض الماء", "نسبة توفير الماء", "water reduction", "réduction d'eau", "reduction d'eau", "water_reduction", "تقليل الماء"],
    regex: /(water.*reduc|reduction.*eau|تخفيض.*ماء|تقليل.*ماء)/i
  },
  {
    key: "pozzolanicIndex",
    labelAr: "مؤشر الفعالية البوزولانية (%)",
    labelEn: "Pozzolanic Index (%)",
    labelFr: "Indice d'activité pouzzolanique",
    type: "number",
    synonyms: ["الفعالية البوزولانية", "مؤشر الفعالية", "pozzolanic index", "activité pouzzolanique", "activite pouzzolanique", "pozzolanic_index", "مؤشر البوزولان"],
    regex: /(pozzolan|pouzzolan|بوزولان)/i
  },
  {
    key: "waterDemandFactor",
    labelAr: "عامل طلب الماء",
    labelEn: "Water Demand Factor",
    labelFr: "Facteur de demande d'eau",
    type: "number",
    synonyms: ["طلب الماء", "عامل الطلب", "عامل الطلب على الماء", "water demand factor", "facteur de demande d'eau", "water_demand_factor", "عامل الماء"],
    regex: /(water.*demand|demande.*eau|طلب.*ماء)/i
  },
  {
    key: "pH",
    labelAr: "الرقم الهيدروجيني pH",
    labelEn: "pH Value",
    labelFr: "Valeur pH",
    type: "number",
    synonyms: ["الرقم الهيدروجيني", "ph", "ph value", "potentiel hydrogène", "valeur ph", "حموضة", "الأس الهيدروجيني"],
    regex: /^(ph|ph\s*value|الرقم\s*الهيدروجيني|الأس\s*الهيدروجيني)$/i
  },
  {
    key: "chlorides",
    labelAr: "محتوى الكلوريدات (ppm)",
    labelEn: "Chlorides (ppm)",
    labelFr: "Teneur en chlorures (ppm)",
    type: "number",
    synonyms: ["الكلوريدات", "محتوى الكلوريدات", "chlorides", "chlorure", "chloride", "chlorures", "نسبة الكلوريدات"],
    regex: /(chloride|chlorure|كلوريد)/i
  },
  {
    key: "sulfates",
    labelAr: "محتوى الكبريتات (ppm)",
    labelEn: "Sulfates (ppm)",
    labelFr: "Teneur en sulfates (ppm)",
    type: "number",
    synonyms: ["الكبريتات", "محتوى الكبريتات", "sulfates", "sulfate", "sulfates_ppm", "كبريتات"],
    regex: /(sulfate|كبريتات)/i
  },
  {
    key: "fiberType",
    labelAr: "نوع الألياف",
    labelEn: "Fiber Type",
    labelFr: "Type de fibre",
    type: "string",
    synonyms: ["نوع الالياف", "نوع الألياف", "fiber type", "type de fibre", "fiber_type", "مادة الألياف"],
    regex: /(fiber.*type|fibre.*type|نوع.*الياف|نوع.*ألياف)/i
  },
  {
    key: "fiberLength",
    labelAr: "طول الألياف (مم)",
    labelEn: "Fiber Length (mm)",
    labelFr: "Longueur de fibre (mm)",
    type: "number",
    synonyms: ["طول الالياف", "طول الألياف", "fiber length", "longueur de fibre", "fiber_length", "longueur_fibre", "مقاس الألياف"],
    regex: /(fiber.*length|fibre.*length|longueur.*fibre|طول.*الياف|طول.*ألياف)/i
  },
  {
    key: "aspectRatio",
    labelAr: "نسبة الأبعاد / النحافة",
    labelEn: "Aspect Ratio",
    labelFr: "Élancement / Aspect Ratio",
    type: "number",
    synonyms: ["عامل النحافة", "نسبة الابعاد", "نسبة الأبعاد", "aspect ratio", "élancement", "elancement", "aspect_ratio", "النحافة"],
    regex: /(aspect.*ratio|élancement|elancement|نسبة.*أبعاد|نسبة.*ابعاد|نحافة|عامل.*نحافة)/i
  },
  {
    key: "tensileStrength",
    labelAr: "مقاومة الشد (MPa)",
    labelEn: "Tensile Strength (MPa)",
    labelFr: "Résistance à la traction (MPa)",
    type: "number",
    synonyms: ["مقاومة الشد", "tensile strength", "résistance à la traction", "resistance a la traction", "tensile_strength", "قوة الشد"],
    regex: /(tensile|traction|مقاومة.*شد|شد)/i
  },
  {
    key: "id",
    labelAr: "المعرف الفريد (ID)",
    labelEn: "Unique Identifier (ID)",
    labelFr: "Identifiant Unique (ID)",
    type: "string",
    synonyms: ["المعرف", "المعرّف", "id", "identifier", "identifiant", "reference", "référence", "code", "رمز", "رقم التعريف", "materialid", "materialcode"],
    regex: /^(id|identifier|identifiant|code|رمز|معرف|معرّف|الرقم|numéro|numero|materialid|materialcode)$/i
  }
];

/**
 * Parses and cleans numbers written in Algerian/French formats or containing text/units.
 */
export function normalizeNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number") {
    if (isNaN(value)) return undefined;
    return value;
  }
  
  let str = String(value).trim();
  if (str === "") return undefined;

  // Normalize Arabic-Indic and Farsi digits to standard Western digits
  str = str.replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632));
  str = str.replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776));

  // 1. Strip common units and suffixes
  let clean = str.replace(/(kg\/m³|kg\/m3|%|da|dzd|m³|m3|ppm|mpa|mm|g\/cm³|g\/cm3|dinars|dinar|دج)/gi, "");
  
  // 2. Replace French/Arabic commas with dots
  clean = clean.replace(/,/g, ".");
  
  // 3. Remove spaces used as thousand separators (e.g. "2 650" -> "2650")
  clean = clean.replace(/(?<=\d)\s+(?=\d)/g, "");
  
  clean = clean.trim();

  // 4. Match the first valid numeric segment
  const match = clean.match(/^[-+]?[0-9]*\.?[0-9]+/);
  if (match) {
    const val = parseFloat(match[0]);
    if (!isNaN(val)) return val;
  }
  
  return undefined;
}

/**
 * Normalizes material names to a consistent key for robust duplication matching.
 * Cleans Harakat, Yeh/Alef variations, and spaces.
 */
export function normalizeName(name: string): string {
  return String(name || "")
    .trim()
    .toLowerCase()
    // Remove Arabic diacritics (Harakat)
    .replace(/[\u064B-\u0652]/g, "")
    // Normalize Alef (أ، إ، آ -> ا)
    .replace(/[أإآ]/g, "ا")
    // Normalize Teh Marbuta (ة -> ه)
    .replace(/ة/g, "ه")
    // Normalize Yeh (ي، ى -> ي)
    .replace(/ى/g, "ي")
    // Replace all punctuation or spacing with nothing
    .replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, " ")
    .replace(/\s+/g, "");
}

/**
 * Generates an unique, reproducible ID for imported materials to prevent duplication.
 */
export function generateMaterialId(row: any, category: string, sheetName: string, index: number): string {
  // Check if a valid user ID is in the record
  const rowId = row.id || row.Id || row.ID || row["المعرف"] || row["المعرّف"] || row.MaterialID || row.MaterialCode || row.code || row.Code;
  if (rowId && String(rowId).trim() !== "") {
    return String(rowId).trim().replace(/[^a-zA-Z0-9_-]/g, "");
  }

  // Generate prefix by category
  let prefix = "MAT";
  const cat = String(category || "").trim().toLowerCase();
  if (cat.includes("اسمنت") || cat.includes("إسمنت") || cat.includes("cement")) {
    prefix = "MAT-CEMENT";
  } else if (cat.includes("رمل") || cat.includes("رمال") || cat.includes("sand")) {
    prefix = "MAT-SAND";
  } else if (cat.includes("حصى") || cat.includes("حصمة") || cat.includes("gravel") || cat.includes("aggregate")) {
    prefix = "MAT-GRAVEL";
  } else if (cat.includes("كيميائية") || cat.includes("admixture")) {
    prefix = "MAT-ADMIX-CHEM";
  } else if (cat.includes("معدنية") || cat.includes("scm") || cat.includes("mineral")) {
    prefix = "MAT-ADMIX-MIN";
  } else if (cat.includes("ماء") || cat.includes("water")) {
    prefix = "MAT-WATER";
  } else if (cat.includes("الياف") || cat.includes("ألياف") || cat.includes("fiber")) {
    prefix = "MAT-FIBER";
  } else if (cat.includes("معاد") || cat.includes("recycled")) {
    prefix = "MAT-RECYCLED";
  }

  // Suffix from english/arabic letters
  const rowName = row.name || row["الاسم"] || row["اسم المادة"] || row.Name || "";
  let nameSuffix = String(rowName)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (nameSuffix === "") {
    const sheetSlug = String(sheetName)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, "")
      .substring(0, 10);
    nameSuffix = `${sheetSlug || "item"}-${index}`;
  }

  return `${prefix}-${nameSuffix}`.toUpperCase();
}

/**
 * Validates properties for imported materials specifically according to material category constraints.
 * Generates warning indicators rather than critical errors.
 */
export function isMaterialIncomplete(mat: EngineeringMaterial): boolean {
  const cat = (mat.category || "").trim();
  if (cat === "رمال") {
    return (
      mat.density === undefined ||
      mat.density <= 0 ||
      mat.specificGravity === undefined ||
      mat.specificGravity <= 0 ||
      mat.absorption === undefined
    );
  } else if (cat === "حصى") {
    return (
      mat.density === undefined ||
      mat.density <= 0 ||
      mat.specificGravity === undefined ||
      mat.specificGravity <= 0 ||
      mat.absorption === undefined ||
      mat.dMax === undefined ||
      mat.dMax <= 0
    );
  } else if (cat === "إسمنت") {
    return mat.density === undefined || mat.density <= 0;
  } else if (cat === "ماء") {
    return mat.density === undefined || mat.density <= 0;
  }
  return false;
}

export function validateImportedMaterial(mat: EngineeringMaterial): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!mat.name || mat.name.trim() === "") {
    errors.push("اسم المادة مطلوب (Name is required).");
  }

  const cat = (mat.category || "").trim();

  if (cat === "رمال") {
    if (mat.density === undefined || mat.density <= 0) {
      warnings.push("الكثافة الكتلية للرمل (كغ/م³) غير متوفرة.");
    }
    if (mat.specificGravity === undefined || mat.specificGravity <= 0) {
      warnings.push("الوزن النوعي للرمل (Specific Gravity) غير متوفر.");
    }
    if (mat.absorption === undefined) {
      warnings.push("نسبة امتصاص الماء للرمل غير متوفرة.");
    }
  } else if (cat === "حصى") {
    if (mat.density === undefined || mat.density <= 0) {
      warnings.push("الكثافة الكتلية للحصى (كغ/م³) غير متوفرة.");
    }
    if (mat.specificGravity === undefined || mat.specificGravity <= 0) {
      warnings.push("الوزن النوعي للحصى غير متوفر.");
    }
    if (mat.absorption === undefined) {
      warnings.push("نسبة امتصاص الماء للحصى غير متوفرة.");
    }
    if (mat.dMax === undefined || mat.dMax <= 0) {
      warnings.push("المقاس الأقصى للحصى Dmax (مم) غير متوفر.");
    }
  } else if (cat === "إسمنت") {
    if (mat.density === undefined || mat.density <= 0) {
      warnings.push("الكثافة الحجمية للإسمنت غير متوفرة.");
    }
  } else if (cat === "ماء") {
    if (mat.density === undefined || mat.density <= 0) {
      warnings.push("الكثافة للماء غير متوفرة.");
    }
  } else if (cat === "إضافات كيميائية") {
    if (mat.recommendedDosage === undefined) {
      warnings.push("الجرعة الموصى بها (%) لوزن الإسمنت غير متوفرة.");
    }
  } else if (cat === "إضافات معدنية") {
    if (mat.density === undefined || mat.density <= 0) {
      warnings.push("الكثافة للإضافات المعدنية SCM غير متوفرة.");
    }
  } else if (cat === "ألياف") {
    if (mat.density === undefined || mat.density <= 0) {
      warnings.push("كثافة الألياف غير متوفرة.");
    }
  }

  if (isMaterialIncomplete(mat)) {
    warnings.push("الخصائص الأساسية ناقصة! لن تعتمد المادة للحساب حتى تكتمل بياناتها.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function mapImportedRowToEngineeringMaterial(
  row: any,
  mappings: Record<string, string>,
  category: string,
  sheetName: string,
  index: number,
  materials: EngineeringMaterial[],
  currentUserEmail?: string
): EngineeringMaterial {
  const mappedData: any = {};

  Object.entries(mappings).forEach(([fileHeader, targetField]) => {
    if (targetField && targetField !== "ignore") {
      mappedData[targetField] = row[fileHeader];
    }
  });

  const name = String(mappedData.name || row.name || row["الاسم"] || row["اسم المادة"] || row.Name || "").trim();
  const englishName = String(mappedData.englishName || row.englishName || row.EnglishName || row.designation || "").trim();
  
  const id = generateMaterialId(row, category, sheetName, index);

  const density = normalizeNumber(mappedData.density !== undefined ? mappedData.density : row.density || row.Density);
  const ssdDensity = normalizeNumber(mappedData.ssdDensity !== undefined ? mappedData.ssdDensity : row.ssdDensity || row.SSDDensity);
  const absorption = normalizeNumber(mappedData.absorption !== undefined ? mappedData.absorption : row.absorption || row.Absorption);
  const moisture = normalizeNumber(mappedData.moisture !== undefined ? mappedData.moisture : row.moisture || row.Moisture || row.MoistureContent);
  const specificGravity = normalizeNumber(mappedData.specificGravity !== undefined ? mappedData.specificGravity : row.specificGravity || row.SpecificGravity);
  const finenessModulus = normalizeNumber(mappedData.finenessModulus !== undefined ? mappedData.finenessModulus : row.finenessModulus || row.FinenessModulus);
  const dMax = normalizeNumber(mappedData.dMax !== undefined ? mappedData.dMax : row.dMax || row.Dmax || row.DMax);
  const bulkDensity = normalizeNumber(mappedData.bulkDensity !== undefined ? mappedData.bulkDensity : row.bulkDensity || row.BulkDensity);
  const SandEquivalent = normalizeNumber(mappedData.SandEquivalent !== undefined ? mappedData.SandEquivalent : row.SandEquivalent || row.sandEquivalent);
  const LosAngeles = normalizeNumber(mappedData.LosAngeles !== undefined ? mappedData.LosAngeles : row.LosAngeles || row.losAngeles || row.losAngelesAbrasion);
  const recommendedDosage = normalizeNumber(mappedData.recommendedDosage !== undefined ? mappedData.recommendedDosage : row.recommendedDosage || row.dosage);
  const waterReduction = normalizeNumber(mappedData.waterReduction !== undefined ? mappedData.waterReduction : row.waterReduction || row.water_reduction);
  const pozzolanicIndex = normalizeNumber(mappedData.pozzolanicIndex !== undefined ? mappedData.pozzolanicIndex : row.pozzolanicIndex || row.pozzolanic_index);
  const waterDemandFactor = normalizeNumber(mappedData.waterDemandFactor !== undefined ? mappedData.waterDemandFactor : row.waterDemandFactor || row.water_demand_factor);
  const pH = normalizeNumber(mappedData.pH !== undefined ? mappedData.pH : row.pH || row.ph || row.PH);
  const chlorides = normalizeNumber(mappedData.chlorides !== undefined ? mappedData.chlorides : row.chlorides || row.chlorides_ppm);
  const sulfates = normalizeNumber(mappedData.sulfates !== undefined ? mappedData.sulfates : row.sulfates || row.sulfates_ppm);
  const fiberLength = normalizeNumber(mappedData.fiberLength !== undefined ? mappedData.fiberLength : row.fiberLength || row.length);
  const aspectRatio = normalizeNumber(mappedData.aspectRatio !== undefined ? mappedData.aspectRatio : row.aspectRatio || row.aspect_ratio);
  const tensileStrength = normalizeNumber(mappedData.tensileStrength !== undefined ? mappedData.tensileStrength : row.tensileStrength || row.tensile_strength);
  const price = normalizeNumber(mappedData.price !== undefined ? mappedData.price : row.price || row.Price || row.cost);
  const rating = normalizeNumber(mappedData.rating !== undefined ? mappedData.rating : row.rating || row.stars) || 5;

  const provenance = String(mappedData.provenance || row.provenance || row.source || row.Source || row.Provenance || "").trim();
  const statusStr = String(mappedData.status || row.status || row.Status || "نشط").trim();
  const notes = String(mappedData.notes || row.notes || row.Notes || row.desc || row.Description || "").trim();
  const cementClass = String(mappedData.cementClass || row.cementClass || "").trim();
  const strengthClass = String(mappedData.strengthClass || row.strengthClass || "").trim();
  const fiberType = String(mappedData.fiberType || row.fiberType || "").trim();

  // Extract all extra/unmapped properties so we retain user data
  const extraProperties: Record<string, any> = {};
  Object.keys(row).forEach((key) => {
    if (!mappings[key] || mappings[key] === "ignore") {
      extraProperties[key] = row[key];
    }
  });

  // Category to standard materialType (Arabic names matching SnoLab standard)
  let materialType = "أخرى";
  if (category === "إسمنت" || category === "مجلدات خاصة") {
    materialType = "مادة رابطة";
  } else if (category === "رمال" || category === "حصى" || category === "ركام خفيف" || category === "ركام ثقيل") {
    materialType = "ركام";
  } else if (category === "إضافات كيميائية") {
    materialType = "إضافات كيميائية";
  } else if (category === "إضافات معدنية") {
    materialType = "إضافات معدنية";
  } else if (category === "ألياف") {
    materialType = "ألياف";
  } else if (category === "ماء") {
    materialType = "ماء";
  }

  let status: "نشط" | "موقوف" | "قيد المراجعة" | "Incomplete" = "نشط";
  if (statusStr === "موقوف" || statusStr.toLowerCase() === "inactive" || statusStr.toLowerCase() === "archived") {
    status = "موقوف";
  } else if (statusStr === "قيد المراجعة" || statusStr.toLowerCase() === "pending" || statusStr.toLowerCase() === "draft") {
    status = "قيد المراجعة";
  }

  let approvalStatus: "Draft" | "Under Review" | "Pending Review" | "Approved" | "Archived" | "Rejected" | "Validated" | "Incomplete" | "Not Verified" = "Approved";
  if (status === "موقوف") {
    approvalStatus = "Archived";
  } else if (status === "قيد المراجعة") {
    approvalStatus = "Pending Review";
  }

  const createdBy = currentUserEmail && currentUserEmail !== "" ? currentUserEmail : "local-user";

  const material: EngineeringMaterial = {
    id,
    name,
    englishName: englishName || name,
    type: category,
    category,
    density, // NO DEFAULT
    ssdDensity,
    absorption, // NO DEFAULT
    moisture,
    finenessModulus,
    dMax,
    quality: notes || "معياري",
    uses: notes || "عام",
    desc: notes || "تم الاستيراد بواسطة النظام الذكي",
    rating,
    provenance: provenance || "غير محدد",
    image: "",
    wilaya: provenance,
    source: provenance,
    notes,
    price,
    ownerId: "local",
    materialType,
    
    region: provenance,
    sourceQuarry: provenance,
    status,
    createdBy,
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString(),
    updatedAt: Date.now(),

    specificGravity, // NO DEFAULT
    particleShape: "زاوي",
    aggregateQuality: "standard",
    clayContent: 0,
    organicContent: "سليم",
    losAngelesAbrasion: LosAngeles,
    gradationData: [],

    cementClass,
    strengthClass,
    hydrationClass: "عادي",
    heatOfHydration: 0,

    recommendedDosage,
    waterReduction,
    settingModification: "لا يوجد",
    settingTimeImpact: 0,

    MaterialID: id,
    MaterialCode: id,
    ArabicName: name,
    EnglishName: englishName || name,
    Category: mapCategoryToUnified(category),
    SubCategory: cementClass || fiberType || "",
    Region: provenance,
    Source: provenance,
    Supplier: provenance,
    Status: approvalStatus,

    Density: density,
    SpecificGravity: specificGravity,
    Absorption: absorption,
    MoistureContent: moisture,

    FinenessModulus: finenessModulus,
    SandEquivalent: SandEquivalent,
    LosAngeles: LosAngeles,
    MethyleneBlue: 0,

    Chlorides: chlorides,
    Sulfates: sulfates,
    OrganicImpurities: "سليم",

    RecommendedUse: notes || "عام",
    EngineeringNotes: notes,
    Description: notes || "تم الاستيراد بواسطة النظام الذكي",
    ConcreteClasses: "C25/30, C30/37",
    Warnings: "",

    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
    CreatedBy: createdBy,
    ApprovalStatus: approvalStatus,

    // Retain all extra properties
    extraProperties,
    engineeringData: {
      ...(mappedData.engineeringData || {}),
      extraProperties
    }
  };

  // Check if essential characteristics are missing, then demote to Incomplete
  if (isMaterialIncomplete(material)) {
    material.status = "موقوف";
    material.Status = "Draft";
    material.ApprovalStatus = "Incomplete";
  }

  return material;
}

function mapCategoryToUnified(category: string): "SAND" | "GRAVEL" | "CEMENT" | "ADMIXTURE" | "SCM" | "WATER" {
  const cat = category.toLowerCase();
  if (cat.includes("رمل") || cat.includes("sand")) return "SAND";
  if (cat.includes("حصى") || cat.includes("gravel")) return "GRAVEL";
  if (cat.includes("اسمنت") || cat.includes("cement")) return "CEMENT";
  if (cat.includes("كيميائية") || cat.includes("admixture")) return "ADMIXTURE";
  if (cat.includes("معدنية") || cat.includes("scm")) return "SCM";
  if (cat.includes("ماء") || cat.includes("water")) return "WATER";
  return "CEMENT";
}

/**
 * Uses Regex & semantic matching to match arbitrary files' column headers to our schema targets.
 */
export function calculateHeaderMapping(header: string, sampleValues?: any[]): { key: string; score: number; explanation: string } {
  const cleanHeader = header.trim().toLowerCase()
    .replace(/[\(\)%\/_-]/g, " ")
    .replace(/\s+/g, " ");

  let matchedField: string = "ignore";
  let maxScore = 0;
  let explanation = "";

  // 1. Direct synonym matching (regex priority)
  for (const field of TARGET_FIELDS) {
    if (field.regex && field.regex.test(cleanHeader)) {
      matchedField = field.key;
      maxScore = 99;
      explanation = `تم ربط هذا العمود مع "${field.labelAr}" لتطابق التسمية مع المعايير بنسبة 99%.`;
      break;
    }
  }

  // 2. Synonym list matching
  if (maxScore === 0) {
    TARGET_FIELDS.forEach(field => {
      field.synonyms.forEach(synonym => {
        const cleanSynonym = synonym.toLowerCase();
        
        if (cleanHeader === cleanSynonym) {
          if (95 > maxScore) {
            maxScore = 95;
            matchedField = field.key;
            explanation = `تم ربط هذا العمود مع "${field.labelAr}" لتطابقه التام مع المترادف المعتمد "${synonym}".`;
          }
        } else if (cleanHeader.includes(cleanSynonym) && cleanSynonym.length > 3) {
          const score = Math.round((cleanSynonym.length / cleanHeader.length) * 85);
          if (score > maxScore) {
            maxScore = score;
            matchedField = field.key;
            explanation = `تم ربط هذا العمود مع "${field.labelAr}" لتشابهه مع المترادف "${synonym}" بنسبة ثقة ${score}%.`;
          }
        } else if (cleanSynonym.includes(cleanHeader) && cleanHeader.length > 3) {
          const score = Math.round((cleanHeader.length / cleanSynonym.length) * 75);
          if (score > maxScore) {
            maxScore = score;
            matchedField = field.key;
            explanation = `تم ربط هذا العمود مع "${field.labelAr}" لتشابهه مع المترادف "${synonym}" بنسبة ثقة ${score}%.`;
          }
        }
      });
    });
  }

  // Double-check validations for common false positives
  if (matchedField === "category" && (cleanHeader.includes("type") || cleanHeader.includes("genre") || cleanHeader.includes("nature"))) {
    maxScore = Math.max(30, maxScore - 20);
    explanation += " (تم تخفيض درجة الثقة لضمان عدم الخلط بين نوع المادة وتصنيفها العامة).";
  }
  if (matchedField === "specificGravity" && (cleanHeader === "density" || cleanHeader === "densité" || cleanHeader === "mv")) {
    matchedField = "density";
    maxScore = 95;
    explanation = "تم تعيين الحقل كـ (الكثافة) بدلاً من الكثافة النوعية للتطابق الصريح.";
  }
  if (matchedField === "density" && (cleanHeader.includes("relative") || cleanHeader.includes("sg") || cleanHeader.includes("specific"))) {
    matchedField = "specificGravity";
    maxScore = 90;
    explanation = "تم تعيين الحقل كـ (الوزن النوعي / Specific Gravity) للتطابق الصريح.";
  }
  if (matchedField === "absorption" && (cleanHeader.includes("moisture") || cleanHeader.includes("humid") || cleanHeader.includes("رطوبة"))) {
    matchedField = "moisture";
    maxScore = 90;
    explanation = "تم تعيين محتوى الرطوبة بدلاً من الامتصاص لتطابق اللفظ الصريح للرطوبة.";
  }
  if (matchedField === "moisture" && (cleanHeader.includes("absorp") || cleanHeader.includes("abs") || cleanHeader.includes("امتصاص"))) {
    matchedField = "absorption";
    maxScore = 90;
    explanation = "تم تعيين امتصاص الماء بدلاً من محتوى الرطوبة لتطابق اللفظ الصريح للامتصاص.";
  }
  if (matchedField === "LosAngeles" && cleanHeader.includes("coeff") && !cleanHeader.includes("la") && !cleanHeader.includes("los") && !cleanHeader.includes("angel")) {
    matchedField = "ignore";
    maxScore = 15;
    explanation = "تم التراجع عن مطابقة لوس أنجلوس لضعف الثقة بين المعامل والمقاومة العامة.";
  }
  if (matchedField === "SandEquivalent" && cleanHeader.includes("sand") && !cleanHeader.includes("equiv") && !cleanHeader.includes("se") && !cleanHeader.includes("مكافئ")) {
    matchedField = "ignore";
    maxScore = 15;
    explanation = "تم التراجع عن مطابقة المكافئ الرملي لتجنب الخلط بين الرمل والمكافئ.";
  }

  // 3. Values heuristic checking (Range evaluation)
  if (sampleValues && sampleValues.length > 0 && matchedField !== "ignore") {
    const parsedNumbers = sampleValues.map(v => normalizeNumber(v)).filter(v => v !== undefined) as number[];
    if (parsedNumbers.length > 0) {
      const avg = parsedNumbers.reduce((a, b) => a + b, 0) / parsedNumbers.length;
      if (matchedField === "density") {
        if (avg > 100 && avg < 4000) {
          maxScore = Math.min(100, maxScore + 5);
          explanation += ` (تأكيد النطاق الكثافة: متوسط ${Math.round(avg)} كغ/م³).`;
        } else if (avg > 0 && avg < 5) {
          matchedField = "specificGravity";
          maxScore = 90;
          explanation = `تم التحويل إلى الوزن النوعي لأن قيم عينة الملف تقع في نطاق [1.0 - 3.5] بمتوسط ${avg.toFixed(2)}.`;
        }
      } else if (matchedField === "specificGravity") {
        if (avg >= 1.0 && avg <= 4.0) {
          maxScore = Math.min(100, maxScore + 5);
          explanation += ` (تأكيد النطاق للوزن النوعي: متوسط ${avg.toFixed(2)}).`;
        } else if (avg > 100) {
          matchedField = "density";
          maxScore = 90;
          explanation = `تم التحويل إلى الكثافة لأن قيم عينة الملف تقع في نطاق الكثافة الكتلية (>100) بمتوسط ${Math.round(avg)} كغ/م³.`;
        }
      } else if (matchedField === "absorption" || matchedField === "moisture") {
        if (avg >= 0 && avg <= 30) {
          maxScore = Math.min(100, maxScore + 5);
          explanation += ` (تأكيد النطاق المئوي: متوسط ${avg.toFixed(1)}%).`;
        }
      }
    }
  }

  if (maxScore < 35) {
    matchedField = "ignore";
    maxScore = 15;
    explanation = "غير معروف: لم نتمكن من مطابقة هذا العمود بشكل تلقائي، يحتاج تفعيله وتعيينه يدوياً.";
  }

  return { key: matchedField, score: maxScore, explanation };
}

export function parseSmartMaterialImport(fileHeaders: string[], sampleRows?: any[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  fileHeaders.forEach(header => {
    const sampleValues = sampleRows ? sampleRows.map(row => row[header]).filter(v => v !== undefined && v !== null) : undefined;
    const result = calculateHeaderMapping(header, sampleValues);
    mapping[header] = result.key;
  });
  return mapping;
}

/**
 * Automatically detects the material category of a sheet based on name, headers, and row contents.
 */
export function detectSheetCategory(sheetName: string, headers: string[], sampleRows?: any[]): string {
  const normName = sheetName.trim().toLowerCase();
  
  // 1. Detect by sheet name
  if (normName.includes("cement") || normName.includes("ciment") || normName.includes("إسمنت") || normName.includes("اسمنت") || normName.includes("cem") || normName.includes("binder") || normName.includes("liant")) {
    return "إسمنت";
  }
  if (normName.includes("sand") || normName.includes("fine") || normName.includes("رمل") || normName.includes("رمال") || normName.includes("sable")) {
    return "رمال";
  }
  if (normName.includes("coarse") || normName.includes("gravel") || normName.includes("gravier") || normName.includes("aggregate") || normName.includes("حصى") || normName.includes("حصمة") || normName.includes("ركام")) {
    return "حصى";
  }
  if (normName.includes("admixture") || normName.includes("chemical") || normName.includes("chem") || normName.includes("adjuvant") || normName.includes("plast") || normName.includes("إضافات كيميائية") || normName.includes("مضاف") || normName.includes("ملدن")) {
    return "إضافات كيميائية";
  }
  if (normName.includes("mineral") || normName.includes("scm") || normName.includes("pozzolan") || normName.includes("pouzzolan") || normName.includes("flyash") || normName.includes("slag") || normName.includes("silica") || normName.includes("fume") || normName.includes("إضافات معدنية")) {
    return "إضافات معدنية";
  }
  if (normName.includes("water") || normName.includes("eau") || normName.includes("ماء") || normName.includes("مياه")) {
    return "ماء";
  }
  if (normName.includes("fiber") || normName.includes("fibre") || normName.includes("ألياف") || normName.includes("الياف")) {
    return "ألياف";
  }
  if (normName.includes("recycled") || normName.includes("معاد") || normName.includes("اعادة")) {
    return "مواد معاد تدويرها";
  }
  if (normName.includes("special") || normName.includes("خاصة") || normName.includes("مجلد")) {
    return "مجلدات خاصة";
  }

  // 2. Detect by columns content
  const lowerHeaders = headers.map(h => h.trim().toLowerCase());
  
  if (lowerHeaders.some(h => h.includes("cementclass") || h.includes("strengthclass") || h.includes("ciment") || h.includes("cement") || h.includes("اسمنت") || h.includes("إسمنت"))) {
    return "إسمنت";
  }
  if (lowerHeaders.some(h => h.includes("fm") || h.includes("fineness") || h.includes("sand") || h.includes("se") || h.includes("equivalent") || h.includes("رمل"))) {
    return "رمال";
  }
  if (lowerHeaders.some(h => h.includes("dmax") || h.includes("losangeles") || h.includes("gravel") || h.includes("حصى") || h.includes("ركام") || h.includes("حصمة"))) {
    return "حصى";
  }
  if (lowerHeaders.some(h => h.includes("dosage") || h.includes("waterreduction") || h.includes("admixture") || h.includes("adjuvant") || h.includes("إضافة") || h.includes("مضاف"))) {
    return "إضافات كيميائية";
  }
  if (lowerHeaders.some(h => h.includes("pozzolanic") || h.includes("flyash") || h.includes("silica") || h.includes("slag") || h.includes("بوزولان") || h.includes("معدنية"))) {
    return "إضافات معدنية";
  }
  if (lowerHeaders.some(h => h.includes("fiber") || h.includes("fibre") || h.includes("tensile") || h.includes("aspectratio") || h.includes("ألياف") || h.includes("الياف"))) {
    return "ألياف";
  }

  // 3. Inspect first few rows' values for specific heuristics
  if (sampleRows && sampleRows.length > 0) {
    // Check if we can find typical columns with data
    for (const row of sampleRows) {
      for (const [key, val] of Object.entries(row)) {
        const keyLower = key.toLowerCase();
        const num = normalizeNumber(val);
        if (num !== undefined) {
          if (keyLower.includes("dmax") && num > 4 && num <= 40) return "حصى";
          if (keyLower.includes("fm") && num > 1.5 && num < 4) return "رمال";
          if (keyLower.includes("dosage") && num > 0 && num < 10) return "إضافات كيميائية";
          if (keyLower.includes("se") && num > 50 && num <= 100) return "رمال";
        }
      }
    }
  }

  return "مواد خاصة";
}

/**
 * Automatically filters out metadata/instructions sheets.
 */
export function shouldIgnoreSheet(sheetName: string, headers: string[], rowCount: number): { ignore: boolean; reason?: string } {
  const normName = sheetName.trim().toLowerCase();
  
  if (/readme|instruction|note|help|info|guide|about|index|contents|intro|tutorial|تعليمات|ملاحظات|مساعدة|دليل|template/i.test(normName)) {
    return { ignore: true, reason: "ورقة معلومات/إرشادات (Information/Instruction sheet)" };
  }

  if (headers.length <= 1) {
    return { ignore: true, reason: "لا تحتوي على أعمدة كافية (Too few columns)" };
  }
  if (rowCount === 0) {
    return { ignore: true, reason: "ورقة فارغة بدون بيانات (Empty sheet)" };
  }

  return { ignore: false };
}

export interface SmartImportWorksheet {
  sheetName: string;
  detectedCategory: string;
  ignored: boolean;
  ignoreReason?: string;
  headers: string[];
  rawRows: any[];
  mappings: Record<string, string>;
  unmappedHeaders: string[];
}
