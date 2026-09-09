import { 
  PropertyDefinition, 
  MaterialPropertyValue, 
  PropertySourceProvenance,
  PropertyValidationStatus
} from "../types/materialCoreTypes";

/**
 * Central Property Registry & Management Service
 * Single Source of Truth for Property Definitions across SnoLab
 */
export class PropertyService {
  private static definitionsMap: Map<string, PropertyDefinition> = new Map();
  private static aliasMap: Map<string, string> = new Map(); // normalized alias -> propertyId

  static {
    PropertyService.initializeDefaultDefinitions();
  }

  /**
   * Initializes all standard engineering property definitions.
   * Every property is defined ONCE with a permanent canonical ID.
   */
  private static initializeDefaultDefinitions(): void {
    const list: PropertyDefinition[] = [
      // ==========================================
      // PHYSICAL & GENERAL PROPERTIES
      // ==========================================
      {
        id: "PROP-SPECIFIC-GRAVITY",
        code: "ρ_s",
        name: "Specific Gravity (Relative Density)",
        nameAr: "الكثافة الحقيقية / الوزن النوعي",
        nameFr: "Masse volumique absolue / Densité réelle",
        dataType: "decimal",
        canonicalUnit: "kg/m³",
        applicableCategories: ["AGGREGATES", "SAND", "GRAVEL", "CEMENT", "MINERAL_ADDITIONS", "SOILS", "BITUMINOUS", "MASONRY"],
        categoryGroup: "physical",
        defaultRequirementLevel: "required",
        associatedStandard: "EN 1097-6 / ASTM C127 / ASTM C128",
        associatedLabTestId: "TEST-AGGR-DENSITY-ABSORPTION",
        validation: { min: 800, max: 5500, warningMin: 2200, warningMax: 3300, step: 1 },
        descriptionAr: "الكثافة الحبيبية الحقيقية للمادة (المعبر عنها بـ kg/m³)",
        descriptionEn: "Absolute particle density in kg/m³"
      },
      {
        id: "PROP-SSD-DENSITY",
        code: "ρ_ssd",
        name: "SSD Density (Saturated Surface-Dry)",
        nameAr: "الكثافة السطحية المشبعة الجافة (SSD)",
        nameFr: "Masse volumique saturée surface sèche",
        dataType: "decimal",
        canonicalUnit: "kg/m³",
        applicableCategories: ["AGGREGATES", "SAND", "GRAVEL"],
        categoryGroup: "physical",
        defaultRequirementLevel: "required",
        associatedStandard: "EN 1097-6 / ASTM C128",
        associatedLabTestId: "TEST-AGGR-DENSITY-ABSORPTION",
        validation: { min: 800, max: 4500, warningMin: 2300, warningMax: 3200, step: 1 },
        descriptionAr: "كثافة الركام في حالة التشبع السطحي الجاف",
        descriptionEn: "Saturated surface-dry relative density"
      },
      {
        id: "PROP-BULK-DENSITY",
        code: "ρ_b",
        name: "Bulk Density (Loose Apparent)",
        nameAr: "الكثافة الظاهرية السائبة",
        nameFr: "Masse volumique apparente",
        dataType: "decimal",
        canonicalUnit: "kg/m³",
        applicableCategories: ["AGGREGATES", "SAND", "GRAVEL", "CEMENT", "MINERAL_ADDITIONS", "SOILS"],
        categoryGroup: "physical",
        defaultRequirementLevel: "optional",
        associatedStandard: "EN 1097-3 / ASTM C29",
        validation: { min: 500, max: 3000, warningMin: 1200, warningMax: 2000, step: 1 },
        descriptionAr: "الكثافة الحجمية مع الفراغات بين الحبيبات",
        descriptionEn: "Loose bulk apparent density"
      },
      {
        id: "PROP-ABSORPTION",
        code: "Abs",
        name: "Water Absorption",
        nameAr: "نسبة الامتصاص المائي",
        nameFr: "Absorption d'eau",
        dataType: "percentage",
        canonicalUnit: "%",
        applicableCategories: ["AGGREGATES", "SAND", "GRAVEL", "MASONRY"],
        categoryGroup: "durability",
        defaultRequirementLevel: "required",
        associatedStandard: "EN 1097-6 / ASTM C127 / ASTM C128",
        associatedLabTestId: "TEST-AGGR-DENSITY-ABSORPTION",
        validation: { min: 0, max: 35, warningMin: 0.1, warningMax: 5.0, step: 0.01 },
        descriptionAr: "النسبة المئوية لكتلة الماء الممتصة بالنسبة لكتلة الحبيبات الجافة (0 هي قيمة صالحة ومقبولة)",
        descriptionEn: "Percentage water absorbed relative to dry aggregate mass"
      },
      {
        id: "PROP-MOISTURE",
        code: "w",
        name: "Moisture Content",
        nameAr: "محتوى الرطوبة الطبيعي",
        nameFr: "Teneur en eau",
        dataType: "percentage",
        canonicalUnit: "%",
        applicableCategories: ["AGGREGATES", "SAND", "GRAVEL", "SOILS"],
        categoryGroup: "physical",
        defaultRequirementLevel: "required",
        associatedStandard: "EN 1097-5 / ASTM C566",
        associatedLabTestId: "TEST-AGGR-MOISTURE",
        validation: { min: 0, max: 30, warningMin: 0, warningMax: 12.0, step: 0.1 },
        descriptionAr: "نسبة الرطوبة الحالية في الركام في الموقع أو المخبر (0% مقبولة وصالحة)",
        descriptionEn: "Moisture content percentage"
      },
      {
        id: "PROP-FM",
        code: "FM",
        name: "Fineness Modulus",
        nameAr: "معامل النعومة",
        nameFr: "Module de finesse",
        dataType: "decimal",
        canonicalUnit: "-",
        applicableCategories: ["AGGREGATES", "SAND"],
        categoryGroup: "granulometric",
        defaultRequirementLevel: "required",
        associatedStandard: "ASTM C136 / EN 933-1",
        associatedLabTestId: "TEST-AGGR-SIEVE-ANALYSIS",
        validation: { min: 1.0, max: 4.5, warningMin: 2.0, warningMax: 3.4, step: 0.01 },
        descriptionAr: "مؤشر نعومة الرمل المحسوب من التحليل الحبيبي",
        descriptionEn: "Fineness modulus calculated from sieve analysis"
      },
      {
        id: "PROP-DMAX",
        code: "D_max",
        name: "Maximum Aggregate Size",
        nameAr: "المقاس الأقصى للحبيبات",
        nameFr: "Diamètre maximal des granulats",
        dataType: "decimal",
        canonicalUnit: "mm",
        applicableCategories: ["AGGREGATES", "SAND", "GRAVEL", "SOILS"],
        categoryGroup: "granulometric",
        defaultRequirementLevel: "required",
        associatedStandard: "EN 933-1 / ASTM C136",
        validation: { min: 0.5, max: 150, warningMin: 2, warningMax: 40, step: 0.5 },
        descriptionAr: "أكبر فتحة منخل يمر منها 100% أو 95% من الركام",
        descriptionEn: "Maximum nominal aggregate grain size"
      },
      {
        id: "PROP-DMIN",
        code: "d_min",
        name: "Minimum Aggregate Size",
        nameAr: "المقاس الأدنى للحبيبات",
        nameFr: "Diamètre minimal des granulats",
        dataType: "decimal",
        canonicalUnit: "mm",
        applicableCategories: ["AGGREGATES", "SAND", "GRAVEL"],
        categoryGroup: "granulometric",
        defaultRequirementLevel: "optional",
        validation: { min: 0, max: 50, warningMin: 0, warningMax: 20, step: 0.1 },
        descriptionAr: "المقاس الأدنى لحبيبات الركام (مثال: 0 في الرمل 0/4)",
        descriptionEn: "Minimum aggregate grain size"
      },
      {
        id: "PROP-SAND-EQUIVALENT",
        code: "SE",
        name: "Sand Equivalent",
        nameAr: "المكافئ الرملي",
        nameFr: "Équivalent de sable",
        dataType: "percentage",
        canonicalUnit: "%",
        applicableCategories: ["AGGREGATES", "SAND", "SOILS"],
        categoryGroup: "durability",
        defaultRequirementLevel: "required",
        associatedStandard: "EN 933-8 / ASTM D2419",
        associatedLabTestId: "TEST-AGGR-SAND-EQUIVALENT",
        validation: { min: 40, max: 100, warningMin: 60, warningMax: 95, step: 0.5 },
        descriptionAr: "نسبة نظافة الرمل وخلوه من المواد الغضارية الناعمة",
        descriptionEn: "Sand equivalent cleanliness rating"
      },
      {
        id: "PROP-METHYLENE-BLUE",
        code: "MB",
        name: "Methylene Blue Value",
        nameAr: "قيمة أزرق الميثيلين",
        nameFr: "Valeur au bleu de méthylène",
        dataType: "decimal",
        canonicalUnit: "g/kg",
        applicableCategories: ["AGGREGATES", "SAND", "SOILS", "MINERAL_ADDITIONS"],
        categoryGroup: "durability",
        defaultRequirementLevel: "optional",
        associatedStandard: "EN 933-9",
        associatedLabTestId: "TEST-AGGR-METHYLENE-BLUE",
        validation: { min: 0, max: 15, warningMin: 0, warningMax: 2.5, step: 0.1 },
        descriptionAr: "نشاط الغضار والطين في الحبيبات الناعمة",
        descriptionEn: "Methylene blue value for clay activity"
      },
      {
        id: "PROP-LOS-ANGELES",
        code: "LA",
        name: "Los Angeles Abrasion Loss",
        nameAr: "معامل لوس أنجلوس للتآكل",
        nameFr: "Coefficient Los Angeles",
        dataType: "percentage",
        canonicalUnit: "%",
        applicableCategories: ["AGGREGATES", "GRAVEL"],
        categoryGroup: "mechanical",
        defaultRequirementLevel: "optional",
        associatedStandard: "EN 1097-2 / ASTM C131",
        associatedLabTestId: "TEST-AGGR-LOS-ANGELES",
        validation: { min: 5, max: 60, warningMin: 12, warningMax: 35, step: 0.5 },
        descriptionAr: "مقاومة الحصى للتفتت والتآكل الميكانيكي بالصدم",
        descriptionEn: "Resistance to fragmentation and abrasion"
      },
      {
        id: "PROP-MICRO-DEVAL",
        code: "MDE",
        name: "Micro-Deval Wear Coefficient",
        nameAr: "معامل ميكرو-ديفال للاحتكاك الرطب",
        nameFr: "Coefficient Micro-Deval",
        dataType: "percentage",
        canonicalUnit: "%",
        applicableCategories: ["AGGREGATES", "GRAVEL"],
        categoryGroup: "mechanical",
        defaultRequirementLevel: "optional",
        associatedStandard: "EN 1097-1",
        associatedLabTestId: "TEST-AGGR-MICRO-DEVAL",
        validation: { min: 5, max: 50, warningMin: 10, warningMax: 25, step: 0.5 },
        descriptionAr: "مقاومة الحصى للاحتكاك والتآكل الرطب",
        descriptionEn: "Micro-Deval wet wear resistance coefficient"
      },
      {
        id: "PROP-CLAY-CONTENT",
        code: "f",
        name: "Clay & Fines Under 63µm",
        nameAr: "نسبة المواد الناعمة والغضار (< 0.063 مم)",
        nameFr: "Teneur en fines inférieures à 63 µm",
        dataType: "percentage",
        canonicalUnit: "%",
        applicableCategories: ["AGGREGATES", "SAND", "GRAVEL"],
        categoryGroup: "physical",
        defaultRequirementLevel: "optional",
        associatedStandard: "EN 933-1",
        validation: { min: 0, max: 20, warningMin: 0, warningMax: 4.0, step: 0.1 },
        descriptionAr: "النسبة المئوية للحبيبات العابرة لمنخل 0.063 مم",
        descriptionEn: "Fines content passing 0.063 mm sieve"
      },
      {
        id: "PROP-FLAKINESS-INDEX",
        code: "FI",
        name: "Flakiness Index",
        nameAr: "معامل التفلطح",
        nameFr: "Indice d'aplatissement",
        dataType: "percentage",
        canonicalUnit: "%",
        applicableCategories: ["AGGREGATES", "GRAVEL"],
        categoryGroup: "physical",
        defaultRequirementLevel: "optional",
        associatedStandard: "EN 933-3",
        validation: { min: 0, max: 50, warningMin: 5, warningMax: 25, step: 0.5 },
        descriptionAr: "نسبة الحبيبات المسطحة التي تؤثر على قابلية التشغيل",
        descriptionEn: "Flakiness index for aggregate particles"
      },
      {
        id: "PROP-ELONGATION-INDEX",
        code: "EI",
        name: "Elongation Index",
        nameAr: "معامل الاستطالة",
        nameFr: "Indice d'élongation",
        dataType: "percentage",
        canonicalUnit: "%",
        applicableCategories: ["AGGREGATES", "GRAVEL"],
        categoryGroup: "physical",
        defaultRequirementLevel: "optional",
        associatedStandard: "BS 812-105",
        validation: { min: 0, max: 50, warningMin: 5, warningMax: 30, step: 0.5 },
        descriptionAr: "نسبة الحبيبات الطولية",
        descriptionEn: "Elongation index of aggregate"
      },

      // ==========================================
      // CEMENT & BINDERS
      // ==========================================
      {
        id: "PROP-CEM-CLASS",
        code: "CEM_Type",
        name: "Cement Classification Type",
        nameAr: "صنف الإسمنت القياسي",
        nameFr: "Type de ciment normalisé",
        dataType: "enum",
        canonicalUnit: "-",
        applicableCategories: ["CEMENT"],
        categoryGroup: "composition",
        defaultRequirementLevel: "required",
        associatedStandard: "EN 197-1 / NA 442",
        options: [
          { value: "CEM I", labelAr: "CEM I (بورتلاندي نقي)", labelEn: "CEM I (Pure Portland)" },
          { value: "CEM II/A", labelAr: "CEM II/A (مركب بورتلاندي A)", labelEn: "CEM II/A (Portland Composite)" },
          { value: "CEM II/B", labelAr: "CEM II/B (مركب بورتلاندي B)", labelEn: "CEM II/B (Portland Composite)" },
          { value: "CEM III", labelAr: "CEM III (إسمنت أفران صهر)", labelEn: "CEM III (Blastfurnace)" },
          { value: "CEM IV", labelAr: "CEM IV (بوزولاني)", labelEn: "CEM IV (Pozzolanic)" },
          { value: "CEM V", labelAr: "CEM V (مركب)", labelEn: "CEM V (Composite)" },
          { value: "CRS", labelAr: "إسمنت مقاوم للكبريتات (CRS)", labelEn: "Sulfate Resistant Cement (SRC)" }
        ],
        descriptionAr: "الرمز القياسي للنوع الكيميائي للإسمنت",
        descriptionEn: "Standard cement chemical classification"
      },
      {
        id: "PROP-CEM-STRENGTH-28D",
        code: "f_c28",
        name: "Standard Compressive Strength (28 Days)",
        nameAr: "مقاومة الإسمنت المعيارية في 28 يوماً",
        nameFr: "Résistance normalisée à 28 jours",
        dataType: "decimal",
        canonicalUnit: "MPa",
        applicableCategories: ["CEMENT"],
        categoryGroup: "mechanical",
        defaultRequirementLevel: "required",
        associatedStandard: "EN 196-1 / ASTM C109",
        associatedLabTestId: "TEST-CEM-COMPRESSIVE-STRENGTH",
        validation: { min: 20, max: 90, warningMin: 32.5, warningMax: 65, step: 0.5 },
        descriptionAr: "المقاومة الانضغاطية المعيارية لمونة الإسمنت في 28 يوماً",
        descriptionEn: "Standard mortar prism compressive strength at 28 days"
      },
      {
        id: "PROP-CEM-STRENGTH-2D",
        code: "f_c2",
        name: "Early Compressive Strength (2 Days)",
        nameAr: "المقاومة المبكرة في يومين",
        nameFr: "Résistance à jeune âge (2 jours)",
        dataType: "decimal",
        canonicalUnit: "MPa",
        applicableCategories: ["CEMENT"],
        categoryGroup: "mechanical",
        defaultRequirementLevel: "optional",
        associatedStandard: "EN 196-1",
        associatedLabTestId: "TEST-CEM-COMPRESSIVE-STRENGTH",
        validation: { min: 5, max: 50, warningMin: 10, warningMax: 35, step: 0.5 },
        descriptionAr: "المقاومة الميكانيكية المبكرة في عمر يومين",
        descriptionEn: "Early compressive strength at 2 days"
      },
      {
        id: "PROP-CEM-STRENGTH-7D",
        code: "f_c7",
        name: "Intermediate Strength (7 Days)",
        nameAr: "المقاومة المتوسطة في 7 أيام",
        nameFr: "Résistance à 7 jours",
        dataType: "decimal",
        canonicalUnit: "MPa",
        applicableCategories: ["CEMENT"],
        categoryGroup: "mechanical",
        defaultRequirementLevel: "optional",
        associatedStandard: "EN 196-1",
        associatedLabTestId: "TEST-CEM-COMPRESSIVE-STRENGTH",
        validation: { min: 10, max: 65, warningMin: 20, warningMax: 50, step: 0.5 },
        descriptionAr: "مقاومة المونة في عمر 7 أيام",
        descriptionEn: "Mortar strength at 7 days"
      },
      {
        id: "PROP-CEM-BLAINE",
        code: "SSB",
        name: "Blaine Specific Surface",
        nameAr: "المساحة السطحية النوعية (بلين)",
        nameFr: "Surface spécifique Blaine",
        dataType: "integer",
        canonicalUnit: "cm²/g",
        applicableCategories: ["CEMENT", "MINERAL_ADDITIONS"],
        categoryGroup: "physical",
        defaultRequirementLevel: "optional",
        associatedStandard: "EN 196-6 / ASTM C204",
        associatedLabTestId: "TEST-CEM-BLAINE-FINENESS",
        validation: { min: 2000, max: 12000, warningMin: 2800, warningMax: 5500, step: 50 },
        descriptionAr: "مقياس درجة نعومة طحن حبيبات الإسمنت",
        descriptionEn: "Specific surface area measured via air permeability"
      },
      {
        id: "PROP-CEM-INITIAL-SETTING",
        code: "t_ini",
        name: "Initial Setting Time",
        nameAr: "زمن الشك الابتدائي",
        nameFr: "Temps de début de prise",
        dataType: "integer",
        canonicalUnit: "min",
        applicableCategories: ["CEMENT"],
        categoryGroup: "hydration",
        defaultRequirementLevel: "optional",
        associatedStandard: "EN 196-3 / ASTM C191",
        associatedLabTestId: "TEST-CEM-SETTING-TIME",
        validation: { min: 30, max: 600, warningMin: 60, warningMax: 240, step: 5 },
        descriptionAr: "الزمن اللازم لبداية تماسك عجينة الإسمنت القياسية بـ Vicat",
        descriptionEn: "Initial setting time of standard paste"
      },
      {
        id: "PROP-CEM-FINAL-SETTING",
        code: "t_fin",
        name: "Final Setting Time",
        nameAr: "زمن الشك النهائي",
        nameFr: "Temps de fin de prise",
        dataType: "integer",
        canonicalUnit: "min",
        applicableCategories: ["CEMENT"],
        categoryGroup: "hydration",
        defaultRequirementLevel: "optional",
        associatedStandard: "EN 196-3 / ASTM C191",
        associatedLabTestId: "TEST-CEM-SETTING-TIME",
        validation: { min: 60, max: 900, warningMin: 120, warningMax: 480, step: 5 },
        descriptionAr: "الزمن اللازم لتصلب العجينة التام",
        descriptionEn: "Final setting time of standard paste"
      },
      {
        id: "PROP-CEM-SOUNDNESS",
        code: "Exp",
        name: "Le Chatelier Soundness",
        nameAr: "ثبات الحجم (لوشاتولييه)",
        nameFr: "Stabilité (Le Chatelier)",
        dataType: "decimal",
        canonicalUnit: "mm",
        applicableCategories: ["CEMENT"],
        categoryGroup: "durability",
        defaultRequirementLevel: "optional",
        associatedStandard: "EN 196-3",
        validation: { min: 0, max: 20, warningMin: 0, warningMax: 10, step: 0.1 },
        descriptionAr: "التمدد الحجمي الحر لعجينة الإسمنت تحت الغليان",
        descriptionEn: "Expansion test for cement volume stability"
      },
      {
        id: "PROP-CEM-LOI",
        code: "LOI",
        name: "Loss on Ignition",
        nameAr: "الفاقد في الحرق (LOI)",
        nameFr: "Perte au feu",
        dataType: "percentage",
        canonicalUnit: "%",
        applicableCategories: ["CEMENT", "MINERAL_ADDITIONS"],
        categoryGroup: "chemical",
        defaultRequirementLevel: "optional",
        associatedStandard: "EN 196-2 / ASTM C114",
        validation: { min: 0, max: 15, warningMin: 0.2, warningMax: 5.0, step: 0.1 },
        descriptionAr: "نسبة الفاقد الكيميائي عند التسخين إلى 950°C",
        descriptionEn: "Loss on ignition percentage"
      },
      {
        id: "PROP-CEM-SO3",
        code: "SO3",
        name: "Sulfate Content (SO3)",
        nameAr: "محتوى الكبريتات (SO3)",
        nameFr: "Teneur en sulfates (SO3)",
        dataType: "percentage",
        canonicalUnit: "%",
        applicableCategories: ["CEMENT", "MINERAL_ADDITIONS", "WATER"],
        categoryGroup: "chemical",
        defaultRequirementLevel: "optional",
        associatedStandard: "EN 196-2",
        validation: { min: 0, max: 6.0, warningMin: 1.0, warningMax: 4.0, step: 0.05 },
        descriptionAr: "نسبة ثالث أكسيد الكبريت في الإسمنت",
        descriptionEn: "Sulfate content (SO3) percentage"
      },
      {
        id: "PROP-CEM-CHLORIDE",
        code: "Cl-",
        name: "Chloride Ion Content",
        nameAr: "محتوى الكلوريدات (Cl-)",
        nameFr: "Teneur en chlorures (Cl-)",
        dataType: "percentage",
        canonicalUnit: "%",
        applicableCategories: ["CEMENT", "AGGREGATES", "MINERAL_ADDITIONS", "ADMIXTURES"],
        categoryGroup: "chemical",
        defaultRequirementLevel: "optional",
        associatedStandard: "EN 196-2 / EN 480-10",
        validation: { min: 0, max: 2.0, warningMin: 0, warningMax: 0.10, step: 0.001 },
        descriptionAr: "نسبة أيونات الكلور القابلة للذوبان",
        descriptionEn: "Chloride ion content percentage"
      },

      // ==========================================
      // CHEMICAL ADMIXTURES
      // ==========================================
      {
        id: "PROP-ADM-TYPE",
        code: "Adm_Type",
        name: "Admixture Functional Function",
        nameAr: "الوظيفة القياسية للمضاف",
        nameFr: "Fonction de l'adjuvant",
        dataType: "enum",
        canonicalUnit: "-",
        applicableCategories: ["ADMIXTURES"],
        categoryGroup: "composition",
        defaultRequirementLevel: "required",
        associatedStandard: "EN 934-2 / ASTM C494",
        options: [
          { value: "superplasticizer", labelAr: "ملدن فائق ومخفض قوي للمياه (Superplasticizer)", labelEn: "High-Range Water Reducer" },
          { value: "plasticizer", labelAr: "ملدن مخفض عادي للمياه (Plasticizer)", labelEn: "Water Reducer" },
          { value: "retarder", labelAr: "مؤخر للشك (Retarder)", labelEn: "Set Retarder" },
          { value: "accelerator", labelAr: "مسرع للشك والتصلب (Accelerator)", labelEn: "Set Accelerator" },
          { value: "air_entraining", labelAr: "عامل هواء محبوس (Air-Entraining Agent)", labelEn: "Air-Entraining Agent" },
          { value: "waterproofing", labelAr: "مانع لنفاذية المياه (Waterproofer)", labelEn: "Waterproofer" },
          { value: "viscosity_modifying", labelAr: "معدل لزوجة وركود (VMA)", labelEn: "Viscosity Modifying Agent" }
        ],
        descriptionAr: "الدور الوظيفي الرئيسي للمضاف الكيميائي",
        descriptionEn: "Main functional classification under EN 934-2"
      },
      {
        id: "PROP-ADM-DOSAGE",
        code: "Dosage",
        name: "Recommended Dosage Range",
        nameAr: "الجرعة الموصى بها بالنسبة لكتلة الإسمنت",
        nameFr: "Dosage recommandé (% du ciment)",
        dataType: "percentage",
        canonicalUnit: "%",
        applicableCategories: ["ADMIXTURES"],
        categoryGroup: "rheology",
        defaultRequirementLevel: "required",
        validation: { min: 0.05, max: 10.0, warningMin: 0.3, warningMax: 3.5, step: 0.05 },
        descriptionAr: "النسبة المئوية المقترحة من كتلة الإسمنت والمواد الرابطة",
        descriptionEn: "Recommended dosage by mass of cementitious materials"
      },
      {
        id: "PROP-ADM-WATER-REDUCTION",
        code: "WR",
        name: "Water Reduction Capacity",
        nameAr: "قدرة تخفيض مياه الخلط",
        nameFr: "Réduction d'eau",
        dataType: "percentage",
        canonicalUnit: "%",
        applicableCategories: ["ADMIXTURES"],
        categoryGroup: "rheology",
        defaultRequirementLevel: "required",
        validation: { min: 0, max: 45, warningMin: 5, warningMax: 35, step: 0.5 },
        descriptionAr: "النسبة المئوية لكمية المياه التي يمكن تقليصها مع الحفاظ على القوام",
        descriptionEn: "Water reduction efficiency percentage"
      },
      {
        id: "PROP-ADM-DENSITY",
        code: "ρ_adm",
        name: "Admixture Density / Specific Gravity",
        nameAr: "الكثافة النوعية للمضاف السائل",
        nameFr: "Densité de l'adjuvant",
        dataType: "decimal",
        canonicalUnit: "g/cm³",
        applicableCategories: ["ADMIXTURES"],
        categoryGroup: "physical",
        defaultRequirementLevel: "required",
        associatedStandard: "EN 480-1",
        validation: { min: 0.9, max: 1.6, warningMin: 1.02, warningMax: 1.25, step: 0.01 },
        descriptionAr: "الكثافة السائلة لجرعات الحساب الحجمي والوزني",
        descriptionEn: "Density of liquid admixture for volumetric batching"
      },
      {
        id: "PROP-ADM-SOLID-CONTENT",
        code: "ES",
        name: "Solid Content",
        nameAr: "محتوى المواد الصلبة (المستخلص الجاف)",
        nameFr: "Extrait sec",
        dataType: "percentage",
        canonicalUnit: "%",
        applicableCategories: ["ADMIXTURES"],
        categoryGroup: "chemical",
        defaultRequirementLevel: "optional",
        associatedStandard: "EN 480-8",
        validation: { min: 5, max: 70, warningMin: 15, warningMax: 45, step: 0.5 },
        descriptionAr: "نسبة المواد الفعالة الجافة في المضاف",
        descriptionEn: "Dry solid content percentage"
      },
      {
        id: "PROP-ADM-PH",
        code: "pH",
        name: "Admixture pH Value",
        nameAr: "درجة الحموضة (pH)",
        nameFr: "Valeur de pH",
        dataType: "decimal",
        canonicalUnit: "-",
        applicableCategories: ["ADMIXTURES", "WATER"],
        categoryGroup: "chemical",
        defaultRequirementLevel: "optional",
        associatedStandard: "ISO 4316 / EN 1008",
        validation: { min: 3.0, max: 14.0, warningMin: 4.5, warningMax: 10.0, step: 0.1 },
        descriptionAr: "مؤشر الحموضة / القلوية",
        descriptionEn: "Admixture or mixing water pH"
      },

      // ==========================================
      // MINERAL ADDITIONS (SCM, Silica Fume, Fly Ash, Slag, Limestone Filler)
      // ==========================================
      {
        id: "PROP-SCM-TYPE",
        code: "SCM_Type",
        name: "Mineral Addition Type",
        nameAr: "نوع الإضافة المعدنية",
        nameFr: "Type d'addition minérale",
        dataType: "enum",
        canonicalUnit: "-",
        applicableCategories: ["MINERAL_ADDITIONS"],
        categoryGroup: "composition",
        defaultRequirementLevel: "required",
        options: [
          { value: "silica_fume", labelAr: "غبار السيليكا (Silica Fume)", labelEn: "Silica Fume" },
          { value: "fly_ash", labelAr: "الرماد المتطاير (Fly Ash)", labelEn: "Fly Ash" },
          { value: "slag", labelAr: "خبث الأفران المحبب (GGBS)", labelEn: "Ground Granulated Blast-Furnace Slag" },
          { value: "limestone_filler", labelAr: "فيلر كلسي ناعم (Limestone Filler)", labelEn: "Limestone Filler" },
          { value: "metakaolin", labelAr: "ميتاكاولين (Metakaolin)", labelEn: "Metakaolin" },
          { value: "pozzolan", labelAr: "بوزولانا طبيعية (Natural Pozzolan)", labelEn: "Natural Pozzolan" }
        ],
        descriptionAr: "تصنيف الإضافة المعدنية المعوضة أو المحسنة للإسمنت",
        descriptionEn: "Mineral addition type for pozzolanic or filler action"
      },
      {
        id: "PROP-SCM-ACTIVITY-INDEX",
        code: "I_act",
        name: "Pozzolanic / Activity Index (28 Days)",
        nameAr: "معامل النشاط البوزولاني في 28 يوماً",
        nameFr: "Indice d'activité pouzzolanique",
        dataType: "percentage",
        canonicalUnit: "%",
        applicableCategories: ["MINERAL_ADDITIONS"],
        categoryGroup: "mechanical",
        defaultRequirementLevel: "optional",
        associatedStandard: "EN 450-1 / ASTM C311",
        validation: { min: 40, max: 150, warningMin: 65, warningMax: 120, step: 0.5 },
        descriptionAr: "نسبة مقاومة العينة بالإسمنت والإضافة مقارنة بعينة الإسمنت المرجعية",
        descriptionEn: "Activity index relative to reference control mortar"
      },
      {
        id: "PROP-SCM-MAX-REPLACEMENT",
        code: "Rep_max",
        name: "Max Recommended Cement Replacement",
        nameAr: "النسبة القصوى الموصى بها للتعويض",
        nameFr: "Taux de substitution maximal",
        dataType: "percentage",
        canonicalUnit: "%",
        applicableCategories: ["MINERAL_ADDITIONS"],
        categoryGroup: "composition",
        defaultRequirementLevel: "optional",
        validation: { min: 2, max: 80, warningMin: 5, warningMax: 60, step: 1 },
        descriptionAr: "أعلى نسبة إحلال للإسمنت مسموحة مع الحفاظ على الديمومة",
        descriptionEn: "Maximum recommended replacement ratio of cement"
      },

      // ==========================================
      // FIBERS
      // ==========================================
      {
        id: "PROP-FIBER-TYPE",
        code: "Fib_Type",
        name: "Structural Fiber Type",
        nameAr: "نوع الألياف الإنشائية",
        nameFr: "Type de fibres",
        dataType: "enum",
        canonicalUnit: "-",
        applicableCategories: ["FIBERS"],
        categoryGroup: "composition",
        defaultRequirementLevel: "required",
        associatedStandard: "EN 14889-1 / EN 14889-2",
        options: [
          { value: "steel", labelAr: "ألياف فولاذية (Steel Fibers)", labelEn: "Steel Fibers" },
          { value: "polypropylene", labelAr: "ألياف بولي بروبيلين (Polypropylene)", labelEn: "Polypropylene Fibers" },
          { value: "glass", labelAr: "ألياف زجاجية مقاومة للقلويات (AR-Glass)", labelEn: "Alkali-Resistant Glass Fibers" },
          { value: "carbon", labelAr: "ألياف الكربون (Carbon Fibers)", labelEn: "Carbon Fibers" },
          { value: "basalt", labelAr: "ألياف البازلت (Basalt Fibers)", labelEn: "Basalt Fibers" }
        ],
        descriptionAr: "التصنيف الإنشائي للألياف المسلحة للخرسانة",
        descriptionEn: "Structural reinforcement fiber classification"
      },
      {
        id: "PROP-FIBER-LENGTH",
        code: "L_fib",
        name: "Fiber Length",
        nameAr: "طول الألياف",
        nameFr: "Longueur des fibres",
        dataType: "decimal",
        canonicalUnit: "mm",
        applicableCategories: ["FIBERS"],
        categoryGroup: "physical",
        defaultRequirementLevel: "required",
        validation: { min: 3, max: 100, warningMin: 6, warningMax: 60, step: 0.5 },
        descriptionAr: "الطول الاسمي للألياف بالمليمتر",
        descriptionEn: "Nominal fiber length in mm"
      },
      {
        id: "PROP-FIBER-DIAMETER",
        code: "d_fib",
        name: "Fiber Diameter / Equivalent Diameter",
        nameAr: "قطر الألياف",
        nameFr: "Diamètre des fibres",
        dataType: "decimal",
        canonicalUnit: "mm",
        applicableCategories: ["FIBERS"],
        categoryGroup: "physical",
        defaultRequirementLevel: "optional",
        validation: { min: 0.01, max: 2.0, warningMin: 0.02, warningMax: 1.2, step: 0.01 },
        descriptionAr: "القطر الاسمي أو المكافئ",
        descriptionEn: "Nominal or equivalent diameter of single fiber"
      },
      {
        id: "PROP-FIBER-TENSILE",
        code: "f_t_fib",
        name: "Fiber Tensile Strength",
        nameAr: "مقاومة الشد للألياف",
        nameFr: "Résistance à la traction des fibres",
        dataType: "integer",
        canonicalUnit: "MPa",
        applicableCategories: ["FIBERS"],
        categoryGroup: "mechanical",
        defaultRequirementLevel: "optional",
        associatedStandard: "EN 14889",
        validation: { min: 200, max: 4000, warningMin: 400, warningMax: 2600, step: 50 },
        descriptionAr: "مقاومة الشد للقطع لمادة الألياف",
        descriptionEn: "Ultimate tensile strength of fiber material"
      },

      // ==========================================
      // WATER
      // ==========================================
      {
        id: "PROP-WATER-PH",
        code: "pH_w",
        name: "Mixing Water pH",
        nameAr: "الرقم الهيدروجيني لماء الخلط",
        nameFr: "pH de l'eau de gâchage",
        dataType: "decimal",
        canonicalUnit: "-",
        applicableCategories: ["WATER"],
        categoryGroup: "chemical",
        defaultRequirementLevel: "required",
        associatedStandard: "EN 1008 / ASTM C1602",
        validation: { min: 4.0, max: 10.0, warningMin: 6.0, warningMax: 8.5, step: 0.1 },
        descriptionAr: "درجة حموضة أو قلوية ماء الخلط (الحد الأدنى 4 والأنسب بين 6 و 8)",
        descriptionEn: "pH level of mixing water"
      },
      {
        id: "PROP-WATER-CHLORIDES",
        code: "Cl-_w",
        name: "Chloride Content in Water",
        nameAr: "محتوى الكلوريدات في الماء",
        nameFr: "Chlorures dans l'eau",
        dataType: "integer",
        canonicalUnit: "mg/L",
        applicableCategories: ["WATER"],
        categoryGroup: "chemical",
        defaultRequirementLevel: "required",
        associatedStandard: "EN 1008",
        validation: { min: 0, max: 5000, warningMin: 0, warningMax: 500, step: 10 },
        descriptionAr: "تركيز أيونات الكلور القابلة للتفاعل مع التسليح",
        descriptionEn: "Chloride concentration in mg per liter"
      },
      {
        id: "PROP-WATER-SULFATES",
        code: "SO4_w",
        name: "Sulfate Content in Water",
        nameAr: "محتوى الكبريتات في الماء",
        nameFr: "Sulfates dans l'eau",
        dataType: "integer",
        canonicalUnit: "mg/L",
        applicableCategories: ["WATER"],
        categoryGroup: "chemical",
        defaultRequirementLevel: "required",
        associatedStandard: "EN 1008",
        validation: { min: 0, max: 5000, warningMin: 0, warningMax: 1000, step: 10 },
        descriptionAr: "تركيز الكبريتات الذائبة في ماء الخلط",
        descriptionEn: "Sulfate concentration in mg per liter"
      },

      // ==========================================
      // COMMERCIAL & LOGISTICS
      // ==========================================
      {
        id: "PROP-PRICE",
        code: "Price",
        name: "Unit Price",
        nameAr: "سعر الوحدة",
        nameFr: "Prix unitaire",
        dataType: "decimal",
        canonicalUnit: "DZD/kg",
        applicableCategories: ["CEMENT", "AGGREGATES", "SAND", "GRAVEL", "ADMIXTURES", "MINERAL_ADDITIONS", "FIBERS", "WATER", "SOILS", "BITUMINOUS", "MASONRY"],
        categoryGroup: "composition",
        defaultRequirementLevel: "optional",
        validation: { min: 0, max: 100000, step: 0.1 },
        descriptionAr: "السعر التقديري للكيلوغرام أو الوحدة للحسابات الاقتصادية",
        descriptionEn: "Unit price for cost estimation"
      }
    ];

    for (const def of list) {
      PropertyService.registerDefinition(def);
    }
  }

  /**
   * Registers a single property definition and populates alias lookup index.
   */
  public static registerDefinition(def: PropertyDefinition): void {
    PropertyService.definitionsMap.set(def.id, def);

    // Register canonical IDs and codes
    PropertyService.indexAlias(def.id, def.id);
    PropertyService.indexAlias(def.code, def.id);
    PropertyService.indexAlias(def.name, def.id);
    PropertyService.indexAlias(def.nameAr, def.id);
    PropertyService.indexAlias(def.nameFr, def.id);

    // Custom common aliases mapping for Excel imports
    if (def.id === "PROP-SPECIFIC-GRAVITY") {
      ["specific gravity", "specificgravity", "density", "relative density", "الكثافة", "الوزن النوعي", "الكثافة الحقيقية", "masse volumique", "densite reelle"].forEach(a => PropertyService.indexAlias(a, def.id));
    } else if (def.id === "PROP-SSD-DENSITY") {
      ["ssd density", "ssddensity", "densite ssd", "كثافة ssd", "كثافة مشبعة"].forEach(a => PropertyService.indexAlias(a, def.id));
    } else if (def.id === "PROP-BULK-DENSITY") {
      ["bulk density", "bulkdensity", "الكثافة الظاهرية", "الكثافة السائبة", "masse volumique apparente"].forEach(a => PropertyService.indexAlias(a, def.id));
    } else if (def.id === "PROP-ABSORPTION") {
      ["absorption", "water absorption", "الامتصاص", "نسبة الامتصاص", "امتصاص الماء", "absorption d'eau"].forEach(a => PropertyService.indexAlias(a, def.id));
    } else if (def.id === "PROP-MOISTURE") {
      ["moisture", "moisture content", "water content", "الرطوبة", "نسبة الرطوبة", "محتوى الرطوبة", "teneur en eau"].forEach(a => PropertyService.indexAlias(a, def.id));
    } else if (def.id === "PROP-FM") {
      ["fineness modulus", "finenessmodulus", "fm", "معامل النعومة", "module de finesse"].forEach(a => PropertyService.indexAlias(a, def.id));
    } else if (def.id === "PROP-DMAX") {
      ["dmax", "d_max", "max aggregate size", "المقاس الأقصى", "قطر أكبر حبة"].forEach(a => PropertyService.indexAlias(a, def.id));
    } else if (def.id === "PROP-SAND-EQUIVALENT") {
      ["sand equivalent", "sandequivalent", "se", "المكافئ الرملي", "equivalent de sable"].forEach(a => PropertyService.indexAlias(a, def.id));
    } else if (def.id === "PROP-LOS-ANGELES") {
      ["los angeles", "losangeles", "la", "لوس أنجلوس", "معامل لوس انجلوس"].forEach(a => PropertyService.indexAlias(a, def.id));
    } else if (def.id === "PROP-CEM-STRENGTH-28D") {
      ["cement strength", "cement strength 28d", "strength28d", "مقاومة الإسمنت", "مقاومة 28 يوم", "fck28", "f_c28", "classe de resistance"].forEach(a => PropertyService.indexAlias(a, def.id));
    } else if (def.id === "PROP-CEM-CLASS") {
      ["cement class", "cementclass", "cement type", "صنف الإسمنت", "نوع الإسمنت"].forEach(a => PropertyService.indexAlias(a, def.id));
    }
  }

  private static indexAlias(rawText: string, propertyId: string): void {
    if (!rawText) return;
    const normalized = PropertyService.normalizeString(rawText);
    PropertyService.aliasMap.set(normalized, propertyId);
  }

  public static normalizeString(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[\s_\-\/\\()[\].]/g, "")
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ي/g, "ى");
  }

  /**
   * Retrieves definition by canonical property ID.
   */
  public static getDefinition(propertyId: string): PropertyDefinition | undefined {
    return PropertyService.definitionsMap.get(propertyId);
  }

  /**
   * Resolves a property definition from ID, shorthand, code, name, or synonym.
   */
  public static resolveProperty(identifier: string): PropertyDefinition | undefined {
    return PropertyService.findDefinitionByAnyIdentifier(identifier);
  }

  /**
   * Finds property definition matching an ID, shorthand, name or alias.
   */
  public static findDefinitionByAnyIdentifier(input: string): PropertyDefinition | undefined {
    if (!input) return undefined;
    const direct = PropertyService.definitionsMap.get(input);
    if (direct) return direct;

    const normalized = PropertyService.normalizeString(input);
    const mappedId = PropertyService.aliasMap.get(normalized);
    if (mappedId) {
      return PropertyService.definitionsMap.get(mappedId);
    }

    // Try finding by prefix / suffix match
    for (const [id, def] of PropertyService.definitionsMap.entries()) {
      if (PropertyService.normalizeString(def.name) === normalized ||
          PropertyService.normalizeString(def.nameAr) === normalized ||
          PropertyService.normalizeString(def.nameFr) === normalized ||
          PropertyService.normalizeString(def.code) === normalized) {
        return def;
      }
    }

    return undefined;
  }

  /**
   * Returns all registered property definitions.
   */
  public static getAllDefinitions(): PropertyDefinition[] {
    return Array.from(PropertyService.definitionsMap.values());
  }

  /**
   * Checks if a raw value represents a valid meaningful property value.
   * STRICT RULE: 0 is a VALID number! Never treat 0 as missing!
   */
  public static hasMeaningfulValue(val: any): boolean {
    if (val === 0) return true; // 0 is 100% valid!
    if (val === null || val === undefined) return false;
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed === "" || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") return false;
      if (trimmed.toUpperCase() === "N/A" || trimmed.toUpperCase() === "NOT_APPLICABLE") return false;
      return true;
    }
    if (typeof val === "number") {
      return !Number.isNaN(val) && Number.isFinite(val);
    }
    if (typeof val === "boolean") return true;
    if (Array.isArray(val)) return val.length > 0;
    return true;
  }

  /**
   * Identifies if a property is marked as NOT_APPLICABLE.
   */
  public static isNotApplicable(val: any): boolean {
    if (typeof val === "string") {
      const upper = val.trim().toUpperCase();
      return upper === "NOT_APPLICABLE" || upper === "N/A" || upper === "NA" || upper === "غير منطبق";
    }
    return false;
  }

  /**
   * Normalizes raw value to the property's canonical data type and unit.
   */
  public static normalizeValue(val: any, def: PropertyDefinition): {
    normalizedValue: any;
    isValid: boolean;
    error?: string;
  } {
    if (!PropertyService.hasMeaningfulValue(val)) {
      if (PropertyService.isNotApplicable(val)) {
        return { normalizedValue: "NOT_APPLICABLE", isValid: true };
      }
      return { normalizedValue: null, isValid: false, error: "Empty value" };
    }

    switch (def.dataType) {
      case "number":
      case "integer":
      case "decimal":
      case "percentage": {
        if (typeof val === "number") {
          if (isNaN(val) || !isFinite(val)) {
            return { normalizedValue: null, isValid: false, error: "Invalid numeric value (NaN or Infinite)" };
          }
          const num = def.dataType === "integer" ? Math.round(val) : val;
          return { normalizedValue: num, isValid: true };
        }
        if (typeof val === "string") {
          const cleaned = val.replace(/,/g, ".").replace(/[%kg/m³MPa\-]/g, "").trim();
          const parsed = parseFloat(cleaned);
          if (isNaN(parsed) || !isFinite(parsed)) {
            return { normalizedValue: null, isValid: false, error: `Cannot parse '${val}' as number` };
          }
          const num = def.dataType === "integer" ? Math.round(parsed) : parsed;
          return { normalizedValue: num, isValid: true };
        }
        return { normalizedValue: null, isValid: false, error: "Non-numeric input type" };
      }

      case "boolean": {
        if (typeof val === "boolean") return { normalizedValue: val, isValid: true };
        const s = String(val).toLowerCase().trim();
        if (s === "true" || s === "1" || s === "yes" || s === "نعم" || s === "oui") {
          return { normalizedValue: true, isValid: true };
        }
        if (s === "false" || s === "0" || s === "no" || s === "لا" || s === "non") {
          return { normalizedValue: false, isValid: true };
        }
        return { normalizedValue: false, isValid: false, error: "Invalid boolean value" };
      }

      case "enum": {
        const s = String(val).trim();
        if (def.options && def.options.length > 0) {
          const matched = def.options.find(
            opt => opt.value.toLowerCase() === s.toLowerCase() ||
                   PropertyService.normalizeString(opt.labelAr) === PropertyService.normalizeString(s) ||
                   PropertyService.normalizeString(opt.labelEn) === PropertyService.normalizeString(s)
          );
          if (matched) {
            return { normalizedValue: matched.value, isValid: true };
          }
        }
        return { normalizedValue: s, isValid: true };
      }

      default:
        return { normalizedValue: String(val).trim(), isValid: true };
    }
  }

  /**
   * Creates a formal MaterialPropertyValue record with full provenance.
   */
  public static createPropertyValue(
    materialId: string,
    propertyId: string,
    value: any,
    source: PropertySourceProvenance = "USER_ENTERED",
    status: PropertyValidationStatus = "VALID",
    unit?: string
  ): MaterialPropertyValue {
    const def = PropertyService.getDefinition(propertyId);
    const canonicalUnit = unit || def?.canonicalUnit || "-";
    const isNA = PropertyService.isNotApplicable(value);
    const isNull = !PropertyService.hasMeaningfulValue(value) && !isNA;

    return {
      materialId,
      propertyId,
      value: isNA ? "NOT_APPLICABLE" : value,
      unit: canonicalUnit,
      source,
      status: isNA ? "NOT_APPLICABLE" : (isNull ? "INCOMPLETE" : status),
      updatedAt: new Date().toISOString(),
      isExplicitNull: isNull,
      isNotApplicable: isNA
    };
  }
}
