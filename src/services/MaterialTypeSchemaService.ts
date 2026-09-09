import { 
  MaterialTypeSchema, 
  MaterialCategoryUnified, 
  MaterialCoreRecord 
} from "../types/materialCoreTypes";

/**
 * Material-Type Schema Service
 * Central registry for material schemas: defines required, optional, and conditional properties
 * as well as applicable lab tests per material type.
 */
export class MaterialTypeSchemaService {
  private static schemas: Map<string, MaterialTypeSchema> = new Map();

  static {
    MaterialTypeSchemaService.initializeSchemas();
  }

  private static initializeSchemas(): void {
    const list: MaterialTypeSchema[] = [
      // 1. FINE AGGREGATE (الرمال)
      {
        typeKey: "FINE_AGGREGATE",
        category: "SAND",
        labelAr: "الرمل والركام الناعم",
        labelEn: "Fine Aggregate (Sand)",
        labelFr: "Granulat fin (Sable)",
        requiredPropertyIds: [
          "PROP-SPECIFIC-GRAVITY",
          "PROP-ABSORPTION",
          "PROP-MOISTURE",
          "PROP-FM",
          "PROP-DMAX",
          "PROP-SAND-EQUIVALENT"
        ],
        optionalPropertyIds: [
          "PROP-SSD-DENSITY",
          "PROP-BULK-DENSITY",
          "PROP-DMIN",
          "PROP-METHYLENE-BLUE",
          "PROP-CLAY-CONTENT",
          "PROP-PRICE"
        ],
        conditionalPropertyIds: [
          {
            propertyId: "PROP-METHYLENE-BLUE",
            conditionAr: "مطلوب إذا كان الرمل مصنعاً / مكسراً ونسبة الناعم مرتفعة",
            conditionEn: "Required for manufactured/crushed sand with high fines",
            predicate: (mat: MaterialCoreRecord) => mat.type.toLowerCase().includes("crushed") || mat.type.includes("مكسر")
          }
        ],
        applicableTestIds: [
          "TEST-AGGR-SIEVE-ANALYSIS",
          "TEST-AGGR-DENSITY-ABSORPTION",
          "TEST-AGGR-SAND-EQUIVALENT",
          "TEST-AGGR-MOISTURE",
          "TEST-AGGR-METHYLENE-BLUE"
        ]
      },

      // 2. COARSE AGGREGATE (الحصى)
      {
        typeKey: "COARSE_AGGREGATE",
        category: "GRAVEL",
        labelAr: "الحصى والركام الخشن",
        labelEn: "Coarse Aggregate (Gravel)",
        labelFr: "Granulat gros (Gravillon)",
        requiredPropertyIds: [
          "PROP-SPECIFIC-GRAVITY",
          "PROP-ABSORPTION",
          "PROP-MOISTURE",
          "PROP-DMAX",
          "PROP-DMIN"
        ],
        optionalPropertyIds: [
          "PROP-SSD-DENSITY",
          "PROP-BULK-DENSITY",
          "PROP-LOS-ANGELES",
          "PROP-MICRO-DEVAL",
          "PROP-FLAKINESS-INDEX",
          "PROP-ELONGATION-INDEX",
          "PROP-CLAY-CONTENT",
          "PROP-PRICE"
        ],
        conditionalPropertyIds: [
          {
            propertyId: "PROP-LOS-ANGELES",
            conditionAr: "إلزامي للخرسانات عالية المقاومة والطرق",
            conditionEn: "Required for high-strength concrete or pavement mixes",
            predicate: (mat: MaterialCoreRecord, ctx?: any) => ctx?.targetStrength >= 35 || ctx?.concreteType === "PAVEMENT"
          }
        ],
        applicableTestIds: [
          "TEST-AGGR-SIEVE-ANALYSIS",
          "TEST-AGGR-DENSITY-ABSORPTION",
          "TEST-AGGR-LOS-ANGELES",
          "TEST-AGGR-MICRO-DEVAL",
          "TEST-AGGR-FLAKINESS"
        ]
      },

      // 3. CEMENT (الإسمنت)
      {
        typeKey: "CEMENT",
        category: "CEMENT",
        labelAr: "الإسمنت والمواد الرابطة",
        labelEn: "Cement & Binders",
        labelFr: "Ciment et Liants",
        requiredPropertyIds: [
          "PROP-SPECIFIC-GRAVITY",
          "PROP-CEM-CLASS",
          "PROP-CEM-STRENGTH-28D"
        ],
        optionalPropertyIds: [
          "PROP-BULK-DENSITY",
          "PROP-CEM-STRENGTH-2D",
          "PROP-CEM-STRENGTH-7D",
          "PROP-CEM-BLAINE",
          "PROP-CEM-INITIAL-SETTING",
          "PROP-CEM-FINAL-SETTING",
          "PROP-CEM-SOUNDNESS",
          "PROP-CEM-LOI",
          "PROP-CEM-SO3",
          "PROP-CEM-CHLORIDE",
          "PROP-PRICE"
        ],
        conditionalPropertyIds: [
          {
            propertyId: "PROP-CEM-INITIAL-SETTING",
            conditionAr: "مطلوب للصب في الأجواء الحارة أو الباردة",
            conditionEn: "Required for hot/cold weather concreting",
            predicate: (mat: MaterialCoreRecord, ctx?: any) => ctx?.temperature > 32 || ctx?.temperature < 5
          }
        ],
        applicableTestIds: [
          "TEST-CEM-COMPRESSIVE-STRENGTH",
          "TEST-CEM-BLAINE-FINENESS",
          "TEST-CEM-SETTING-TIME",
          "TEST-CEM-SOUNDNESS"
        ]
      },

      // 4. WATER (الماء)
      {
        typeKey: "WATER",
        category: "WATER",
        labelAr: "ماء الخلط والمعالجة",
        labelEn: "Mixing Water",
        labelFr: "Eau de gâchage",
        requiredPropertyIds: [
          "PROP-WATER-PH",
          "PROP-WATER-CHLORIDES",
          "PROP-WATER-SULFATES"
        ],
        optionalPropertyIds: [
          "PROP-SPECIFIC-GRAVITY",
          "PROP-PRICE"
        ],
        conditionalPropertyIds: [],
        applicableTestIds: [
          "TEST-WATER-PH-CHLORIDES"
        ]
      },

      // 5. CHEMICAL ADMIXTURE (المضافات الكيميائية)
      {
        typeKey: "CHEMICAL_ADMIXTURE",
        category: "ADMIXTURES",
        labelAr: "المضافات الكيميائية",
        labelEn: "Chemical Admixtures",
        labelFr: "Adjuvants chimiques",
        requiredPropertyIds: [
          "PROP-ADM-TYPE",
          "PROP-ADM-DOSAGE",
          "PROP-ADM-WATER-REDUCTION",
          "PROP-ADM-DENSITY"
        ],
        optionalPropertyIds: [
          "PROP-ADM-SOLID-CONTENT",
          "PROP-ADM-PH",
          "PROP-CEM-CHLORIDE",
          "PROP-PRICE"
        ],
        conditionalPropertyIds: [],
        applicableTestIds: [
          "TEST-ADM-DENSITY-SOLIDS"
        ]
      },

      // 6. MINERAL ADDITION (الإضافات المعدنية - السليكا، الرماد، الخبث)
      {
        typeKey: "MINERAL_ADDITION",
        category: "MINERAL_ADDITIONS",
        labelAr: "الإضافات المعدنية ومواد الإحلال",
        labelEn: "Mineral Additions (SCM)",
        labelFr: "Additions minérales",
        requiredPropertyIds: [
          "PROP-SPECIFIC-GRAVITY",
          "PROP-SCM-TYPE"
        ],
        optionalPropertyIds: [
          "PROP-BULK-DENSITY",
          "PROP-SCM-ACTIVITY-INDEX",
          "PROP-SCM-MAX-REPLACEMENT",
          "PROP-CEM-BLAINE",
          "PROP-CEM-LOI",
          "PROP-PRICE"
        ],
        conditionalPropertyIds: [],
        applicableTestIds: [
          "TEST-SCM-ACTIVITY-INDEX"
        ]
      },

      // 7. FIBER (الألياف)
      {
        typeKey: "FIBER",
        category: "FIBERS",
        labelAr: "الألياف الإنشائية",
        labelEn: "Structural Fibers",
        labelFr: "Fibres de renfort",
        requiredPropertyIds: [
          "PROP-FIBER-TYPE",
          "PROP-FIBER-LENGTH"
        ],
        optionalPropertyIds: [
          "PROP-FIBER-DIAMETER",
          "PROP-FIBER-TENSILE",
          "PROP-SPECIFIC-GRAVITY",
          "PROP-PRICE"
        ],
        conditionalPropertyIds: [],
        applicableTestIds: []
      },

      // 8. SOIL (التربة)
      {
        typeKey: "SOIL",
        category: "SOILS",
        labelAr: "التربة والمواد الجيوتقنية",
        labelEn: "Soils & Geotechnical",
        labelFr: "Sols et géotechnique",
        requiredPropertyIds: [
          "PROP-SPECIFIC-GRAVITY",
          "PROP-MOISTURE"
        ],
        optionalPropertyIds: [
          "PROP-BULK-DENSITY",
          "PROP-METHYLENE-BLUE",
          "PROP-SAND-EQUIVALENT"
        ],
        conditionalPropertyIds: [],
        applicableTestIds: [
          "TEST-SOIL-PROCTOR",
          "TEST-SOIL-ATTERBERG"
        ]
      },

      // 9. BITUMINOUS (المواد البيتومينية والإسفلت)
      {
        typeKey: "BITUMINOUS",
        category: "BITUMINOUS",
        labelAr: "المواد الإسفلتية والبيتومينية",
        labelEn: "Bituminous Materials",
        labelFr: "Matériaux bitumineux",
        requiredPropertyIds: [
          "PROP-SPECIFIC-GRAVITY"
        ],
        optionalPropertyIds: [
          "PROP-PRICE"
        ],
        conditionalPropertyIds: [],
        applicableTestIds: []
      },

      // 10. MASONRY (مواد البناء والبلوك)
      {
        typeKey: "MASONRY",
        category: "MASONRY",
        labelAr: "مواد البناء ووحدات البلوك",
        labelEn: "Masonry Materials",
        labelFr: "Matériaux de maçonnerie",
        requiredPropertyIds: [
          "PROP-SPECIFIC-GRAVITY",
          "PROP-ABSORPTION"
        ],
        optionalPropertyIds: [
          "PROP-BULK-DENSITY",
          "PROP-PRICE"
        ],
        conditionalPropertyIds: [],
        applicableTestIds: []
      }
    ];

    for (const s of list) {
      MaterialTypeSchemaService.schemas.set(s.typeKey, s);
      // Map category to schema as well
      MaterialTypeSchemaService.schemas.set(s.category, s);
    }
  }

  /**
   * Retrieves schema for a given material type or category.
   */
  public static getSchema(typeOrCategory: string): MaterialTypeSchema | undefined {
    if (!typeOrCategory) return undefined;
    const key = typeOrCategory.toUpperCase().trim();
    if (MaterialTypeSchemaService.schemas.has(key)) {
      return MaterialTypeSchemaService.schemas.get(key);
    }

    // Heuristics for Arabic/English common terms
    if (key.includes("SAND") || key.includes("رمل") || key.includes("SABLE")) {
      return MaterialTypeSchemaService.schemas.get("FINE_AGGREGATE");
    }
    if (key.includes("GRAVEL") || key.includes("حصى") || key.includes("GRAVIER") || key.includes("AGGR")) {
      return MaterialTypeSchemaService.schemas.get("COARSE_AGGREGATE");
    }
    if (key.includes("CEMENT") || key.includes("إسمنت") || key.includes("CIMENT") || key.includes("BINDER")) {
      return MaterialTypeSchemaService.schemas.get("CEMENT");
    }
    if (key.includes("WATER") || key.includes("ماء") || key.includes("EAU")) {
      return MaterialTypeSchemaService.schemas.get("WATER");
    }
    if (key.includes("ADMIX") || key.includes("مضاف") || key.includes("إضافات كيميائية")) {
      return MaterialTypeSchemaService.schemas.get("CHEMICAL_ADMIXTURE");
    }
    if (key.includes("SCM") || key.includes("MINERAL") || key.includes("معدنية") || key.includes("SILICA")) {
      return MaterialTypeSchemaService.schemas.get("MINERAL_ADDITION");
    }
    if (key.includes("FIBER") || key.includes("ألياف") || key.includes("FIBRE")) {
      return MaterialTypeSchemaService.schemas.get("FIBER");
    }
    if (key.includes("SOIL") || key.includes("تربة") || key.includes("SOL")) {
      return MaterialTypeSchemaService.schemas.get("SOIL");
    }

    return undefined;
  }

  /**
   * Returns all required property IDs for a specific material and context.
   */
  public static getRequiredPropertiesForMaterial(
    material: MaterialCoreRecord,
    context?: any
  ): string[] {
    const schema = MaterialTypeSchemaService.getSchema(material.category) || 
                   MaterialTypeSchemaService.getSchema(material.type);
    if (!schema) return [];

    const req = new Set<string>(schema.requiredPropertyIds);

    // Evaluate conditional properties
    for (const cond of schema.conditionalPropertyIds) {
      if (cond.predicate(material, context)) {
        req.add(cond.propertyId);
      }
    }

    return Array.from(req);
  }

  /**
   * Returns all schemas.
   */
  public static getAllSchemas(): MaterialTypeSchema[] {
    const uniqueKeys = new Set<string>();
    const result: MaterialTypeSchema[] = [];
    for (const schema of MaterialTypeSchemaService.schemas.values()) {
      if (!uniqueKeys.has(schema.typeKey)) {
        uniqueKeys.add(schema.typeKey);
        result.push(schema);
      }
    }
    return result;
  }
}
