import { 
  MaterialCoreRecord, 
  MaterialPropertyValue, 
  MaterialCategoryUnified, 
  MaterialSourceType,
  PropertySourceProvenance,
  PropertyValidationStatus
} from "../types/materialCoreTypes";
import { EngineeringMaterial } from "../types";
import { PropertyService } from "./PropertyService";
import { ValidationService } from "./ValidationService";

/**
 * Central Material Management Service for SnoLab
 * Handles CRUD, SYSTEM vs MY_MATERIALS separation, ID allocation, and
 * bi-directional bridging with the application-level EngineeringMaterial.
 */
export class MaterialService {
  private static STORAGE_KEY_MY_MATERIALS = "snolab_my_materials_vault_v2";
  private static myMaterials: Map<string, MaterialCoreRecord> = new Map();
  private static systemMaterials: Map<string, MaterialCoreRecord> = new Map();

  static {
    MaterialService.loadMyMaterialsFromStorage();
  }

  /**
   * Initializes or refreshes System Materials from application defaults.
   * System Materials are protected and read-only.
   */
  public static initializeSystemMaterials(rawSystemMaterials: EngineeringMaterial[]): void {
    MaterialService.systemMaterials.clear();
    for (const raw of rawSystemMaterials) {
      const core = MaterialService.fromEngineeringMaterial(raw, "SYSTEM");
      MaterialService.systemMaterials.set(core.id, core);
    }
  }

  /**
   * Returns all active System Materials (Read-Only).
   */
  public static getSystemMaterials(): MaterialCoreRecord[] {
    return Array.from(MaterialService.systemMaterials.values());
  }

  /**
   * Returns all user-owned "My Materials".
   */
  public static getMyMaterials(): MaterialCoreRecord[] {
    return Array.from(MaterialService.myMaterials.values());
  }

  /**
   * Returns a merged list with My Materials prioritized over System Materials.
   */
  public static getAllMaterials(): MaterialCoreRecord[] {
    const list: MaterialCoreRecord[] = [];
    // User materials first
    for (const m of MaterialService.myMaterials.values()) {
      list.push(m);
    }
    // Then system materials
    for (const s of MaterialService.systemMaterials.values()) {
      if (!MaterialService.myMaterials.has(s.id)) {
        list.push(s);
      }
    }
    return list;
  }

  /**
   * Finds a material by its permanent unique ID.
   */
  public static getMaterialById(id: string): MaterialCoreRecord | undefined {
    if (!id) return undefined;
    return MaterialService.myMaterials.get(id) || MaterialService.systemMaterials.get(id);
  }

  /**
   * Generates a new unique material ID based on category and provenance.
   */
  public static generateMaterialId(category: MaterialCategoryUnified, prefix = "MAT"): string {
    const catCode = category.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomHex = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `${prefix}-${catCode}-${timestamp}-${randomHex}`;
  }

  /**
   * Saves or updates a My Material. Cannot mutate System Materials!
   */
  public static saveMyMaterial(material: MaterialCoreRecord): MaterialCoreRecord {
    // Force sourceType to MY_MATERIAL
    const now = new Date().toISOString();
    const toSave: MaterialCoreRecord = {
      ...material,
      sourceType: "MY_MATERIAL",
      updatedAt: now,
      createdAt: material.createdAt || now
    };

    MaterialService.myMaterials.set(toSave.id, toSave);
    MaterialService.persistMyMaterialsToStorage();
    return toSave;
  }

  /**
   * Clones a System Material into My Materials so the user can freely edit it.
   */
  public static cloneSystemMaterialToMyMaterials(systemMaterialId: string): MaterialCoreRecord | null {
    const sysMat = MaterialService.systemMaterials.get(systemMaterialId);
    if (!sysMat) return null;

    const newId = MaterialService.generateMaterialId(sysMat.category, "MAT-USR");
    const now = new Date().toISOString();

    const clone: MaterialCoreRecord = {
      ...sysMat,
      id: newId,
      name: `${sysMat.name} (نسخة مخصصة)`,
      englishName: sysMat.englishName ? `${sysMat.englishName} (Custom Copy)` : undefined,
      sourceType: "MY_MATERIAL",
      dataSource: "USER_ENTERED",
      createdAt: now,
      updatedAt: now,
      properties: {}
    };

    // Clone properties with updated materialId and USER_ENTERED provenance
    for (const [propId, pVal] of Object.entries(sysMat.properties)) {
      clone.properties[propId] = {
        ...pVal,
        materialId: newId,
        source: "USER_ENTERED",
        updatedAt: now
      };
    }

    MaterialService.myMaterials.set(newId, clone);
    MaterialService.persistMyMaterialsToStorage();
    return clone;
  }

  /**
   * Deletes a material from My Materials. System Materials cannot be deleted.
   */
  public static deleteMyMaterial(id: string): boolean {
    if (MaterialService.systemMaterials.has(id)) {
      // Protected
      return false;
    }
    const deleted = MaterialService.myMaterials.delete(id);
    if (deleted) {
      MaterialService.persistMyMaterialsToStorage();
    }
    return deleted;
  }

  /**
   * Updates a single property value on a material with provenance tracking.
   */
  public static setMaterialProperty(
    materialId: string,
    propertyId: string,
    value: any,
    source: PropertySourceProvenance = "USER_ENTERED",
    unit?: string
  ): MaterialPropertyValue {
    let mat = MaterialService.getMaterialById(materialId);
    if (!mat) {
      throw new Error(`Material with ID '${materialId}' not found.`);
    }

    // If attempting to edit a System Material, clone it first
    if (mat.sourceType === "SYSTEM") {
      const cloned = MaterialService.cloneSystemMaterialToMyMaterials(materialId);
      if (!cloned) throw new Error(`Cannot modify system material '${materialId}'.`);
      mat = cloned;
    }

    const assess = ValidationService.validatePropertyValue(propertyId, value, mat);
    const existing = mat.properties[propertyId];
    const now = new Date().toISOString();

    const propRecord: MaterialPropertyValue = {
      materialId: mat.id,
      propertyId,
      value: assess.value,
      unit: unit || assess.canonicalUnit,
      source,
      status: assess.status,
      updatedAt: now,
      isExplicitNull: assess.status === "INCOMPLETE",
      isNotApplicable: assess.status === "NOT_APPLICABLE",
      history: existing ? [
        ...(existing.history || []),
        {
          value: existing.value,
          unit: existing.unit,
          source: existing.source,
          updatedAt: existing.updatedAt
        }
      ] : []
    };

    mat.properties[propertyId] = propRecord;
    mat.updatedAt = now;

    MaterialService.saveMyMaterial(mat);
    return propRecord;
  }

  /**
   * Reads a property value safely, recognizing 0 as a valid numeric value.
   */
  public static getMaterialPropertyValue(material: MaterialCoreRecord, propertyId: string): any {
    const p = material.properties[propertyId];
    if (!p) return undefined;
    if (p.isNotApplicable) return "NOT_APPLICABLE";
    return p.value;
  }

  /**
   * Converts legacy or application-level EngineeringMaterial to standard MaterialCoreRecord.
   */
  public static fromEngineeringMaterial(
    legacy: EngineeringMaterial,
    sourceType?: MaterialSourceType
  ): MaterialCoreRecord {
    const now = new Date().toISOString();
    const determinedSourceType: MaterialSourceType = sourceType || 
      (legacy.isSystem || legacy.isDemo || legacy.sourceType === "system_demo" ? "SYSTEM" : "MY_MATERIAL");

    const category = MaterialService.mapLegacyCategory(legacy.category || legacy.type);

    const properties: Record<string, MaterialPropertyValue> = {};

    const addProp = (propId: string, val: any, unit?: string, source: PropertySourceProvenance = "REFERENCE") => {
      if (PropertyService.hasMeaningfulValue(val) || PropertyService.isNotApplicable(val)) {
        properties[propId] = PropertyService.createPropertyValue(legacy.id, propId, val, source, "VALID", unit);
      }
    };

    // Specific Gravity & Densities
    const sg = legacy.specificGravity ?? legacy.SpecificGravity ?? legacy.density ?? legacy.Density;
    addProp("PROP-SPECIFIC-GRAVITY", sg, "kg/m³");
    addProp("PROP-SSD-DENSITY", legacy.ssdDensity, "kg/m³");
    addProp("PROP-BULK-DENSITY", legacy.bulkDensity, "kg/m³");

    // Absorption & Moisture
    addProp("PROP-ABSORPTION", legacy.absorption ?? legacy.Absorption, "%");
    addProp("PROP-MOISTURE", legacy.moisture ?? legacy.MoistureContent, "%");

    // Granulometry metrics
    addProp("PROP-FM", legacy.finenessModulus ?? legacy.FinenessModulus, "-");
    addProp("PROP-DMAX", legacy.dMax, "mm");
    addProp("PROP-DMIN", legacy.dMin, "mm");
    addProp("PROP-SAND-EQUIVALENT", legacy.sandEquivalent ?? legacy.SandEquivalent, "%");
    addProp("PROP-METHYLENE-BLUE", legacy.methyleneBlue ?? legacy.MethyleneBlue, "g/kg");
    addProp("PROP-LOS-ANGELES", legacy.losAngelesAbrasion ?? legacy.LosAngeles, "%");
    addProp("PROP-MICRO-DEVAL", legacy.microDeval, "%");
    addProp("PROP-CLAY-CONTENT", legacy.clayContent ?? legacy.finesContent, "%");
    addProp("PROP-FLAKINESS-INDEX", legacy.flakinessIndex, "%");
    addProp("PROP-ELONGATION-INDEX", legacy.elongationIndex, "%");

    // Cement
    addProp("PROP-CEM-CLASS", legacy.cementClass);
    addProp("PROP-CEM-STRENGTH-28D", legacy.strength28d ?? legacy.strengthClass, "MPa");
    addProp("PROP-CEM-STRENGTH-2D", legacy.strength2d, "MPa");
    addProp("PROP-CEM-STRENGTH-7D", legacy.strength7d, "MPa");
    addProp("PROP-CEM-BLAINE", legacy.blaineFineness, "cm²/g");
    addProp("PROP-CEM-INITIAL-SETTING", legacy.initialSetting, "min");
    addProp("PROP-CEM-FINAL-SETTING", legacy.finalSetting, "min");
    addProp("PROP-CEM-SOUNDNESS", legacy.soundness, "mm");
    addProp("PROP-CEM-LOI", legacy.lossOnIgnition, "%");
    addProp("PROP-CEM-SO3", legacy.sulfateContent ?? legacy.sulfates ?? legacy.Sulfates, "%");
    addProp("PROP-CEM-CHLORIDE", legacy.chlorides ?? legacy.Chlorides, "%");

    // Admixtures
    addProp("PROP-ADM-TYPE", legacy.admixtureType);
    addProp("PROP-ADM-DOSAGE", legacy.recommendedDosage, "%");
    addProp("PROP-ADM-WATER-REDUCTION", legacy.waterReduction, "%");
    addProp("PROP-ADM-SOLID-CONTENT", legacy.solidContent, "%");
    addProp("PROP-ADM-PH", legacy.pH ?? legacy.ph, "-");

    // Mineral Additions
    addProp("PROP-SCM-TYPE", legacy.type);
    addProp("PROP-SCM-ACTIVITY-INDEX", legacy.pozzolanicIndex, "%");
    addProp("PROP-SCM-MAX-REPLACEMENT", legacy.maxReplacementPercent, "%");

    // Fibers
    addProp("PROP-FIBER-TYPE", legacy.fiberType);
    addProp("PROP-FIBER-LENGTH", legacy.fiberLength, "mm");
    addProp("PROP-FIBER-DIAMETER", legacy.fiberDiameter, "mm");
    addProp("PROP-FIBER-TENSILE", legacy.tensileStrength, "MPa");

    // Price
    addProp("PROP-PRICE", legacy.price, "DZD/kg");

    return {
      id: legacy.id || legacy.MaterialID || MaterialService.generateMaterialId(category),
      name: legacy.name || legacy.ArabicName || "مادة غير مسماة",
      englishName: legacy.englishName || legacy.EnglishName,
      category,
      type: legacy.type || legacy.SubCategory || "عام",
      source: legacy.provenance || legacy.sourceQuarry || legacy.Supplier || legacy.Source || "غير محدد",
      region: legacy.region || legacy.Region || legacy.wilaya,
      sourceType: determinedSourceType,
      status: legacy.status === "موقوف" ? "SUSPENDED" : legacy.status === "قيد المراجعة" ? "PENDING_REVIEW" : "ACTIVE",
      createdAt: legacy.createdDate || legacy.CreatedAt || now,
      updatedAt: legacy.updatedDate || legacy.UpdatedAt || now,
      dataSource: determinedSourceType === "SYSTEM" ? "REFERENCE" : (legacy.sourceType === "imported" ? "IMPORTED" : "USER_ENTERED"),
      validationStatus: legacy.ApprovalStatus === "Approved" ? "APPROVED" : "VALID",
      properties,
      granulometry: legacy.gradationData || legacy.sieveAnalysisDetail?.points,
      laboratoryTestIds: legacy.laboratoryTests,
      extraProperties: legacy.extraProperties || {},
      notes: legacy.notes || legacy.desc || legacy.Description,
      price: legacy.price,
      rating: legacy.rating
    };
  }

  /**
   * Converts a MaterialCoreRecord back to an EngineeringMaterial
   * ensuring 100% backward compatibility with all UI panels, calculators, and reports.
   */
  public static toEngineeringMaterial(core: MaterialCoreRecord): EngineeringMaterial {
    const getNum = (pId: string): number | undefined => {
      const p = core.properties[pId];
      if (!p || !PropertyService.hasMeaningfulValue(p.value)) return undefined;
      const n = typeof p.value === "number" ? p.value : parseFloat(p.value);
      return isNaN(n) ? undefined : n;
    };

    const getStr = (pId: string): string | undefined => {
      const p = core.properties[pId];
      if (!p || !PropertyService.hasMeaningfulValue(p.value)) return undefined;
      return String(p.value);
    };

    const sg = getNum("PROP-SPECIFIC-GRAVITY") || 2650;
    const abs = getNum("PROP-ABSORPTION") ?? 1.2;
    const moist = getNum("PROP-MOISTURE") ?? 0;
    const fm = getNum("PROP-FM") ?? 2.6;
    const dmax = getNum("PROP-DMAX") ?? 20;

    return {
      id: core.id,
      name: core.name,
      englishName: core.englishName || core.name,
      category: MaterialService.toLegacyCategoryName(core.category),
      type: core.type,
      density: sg,
      ssdDensity: getNum("PROP-SSD-DENSITY") || sg,
      bulkDensity: getNum("PROP-BULK-DENSITY"),
      absorption: abs,
      moisture: moist,
      finenessModulus: fm,
      dMax: dmax,
      dMin: getNum("PROP-DMIN") || 0,
      sandEquivalent: getNum("PROP-SAND-EQUIVALENT") || 75,
      methyleneBlue: getNum("PROP-METHYLENE-BLUE"),
      losAngelesAbrasion: getNum("PROP-LOS-ANGELES") || 25,
      microDeval: getNum("PROP-MICRO-DEVAL"),
      clayContent: getNum("PROP-CLAY-CONTENT"),
      flakinessIndex: getNum("PROP-FLAKINESS-INDEX"),
      elongationIndex: getNum("PROP-ELONGATION-INDEX"),

      // Cement
      cementClass: getStr("PROP-CEM-CLASS") || "CEM II/A",
      strengthClass: getNum("PROP-CEM-STRENGTH-28D") || 42.5,
      strength28d: getNum("PROP-CEM-STRENGTH-28D") || 42.5,
      strength2d: getNum("PROP-CEM-STRENGTH-2D"),
      strength7d: getNum("PROP-CEM-STRENGTH-7D"),
      blaineFineness: getNum("PROP-CEM-BLAINE"),
      initialSetting: getNum("PROP-CEM-INITIAL-SETTING"),
      finalSetting: getNum("PROP-CEM-FINAL-SETTING"),
      soundness: getNum("PROP-CEM-SOUNDNESS"),
      lossOnIgnition: getNum("PROP-CEM-LOI"),
      sulfateContent: getNum("PROP-CEM-SO3"),
      chlorides: getNum("PROP-CEM-CHLORIDE"),

      // Admixtures
      admixtureType: getStr("PROP-ADM-TYPE") || "superplasticizer",
      recommendedDosage: getNum("PROP-ADM-DOSAGE") || 1.2,
      waterReduction: getNum("PROP-ADM-WATER-REDUCTION") || 15,
      solidContent: getNum("PROP-ADM-SOLID-CONTENT"),
      pH: getNum("PROP-ADM-PH"),

      // Fibers
      fiberType: getStr("PROP-FIBER-TYPE"),
      fiberLength: getNum("PROP-FIBER-LENGTH"),
      fiberDiameter: getNum("PROP-FIBER-DIAMETER"),
      tensileStrength: getNum("PROP-FIBER-TENSILE"),

      // Mineral Additions
      pozzolanicIndex: getNum("PROP-SCM-ACTIVITY-INDEX"),
      maxReplacementPercent: getNum("PROP-SCM-MAX-REPLACEMENT"),

      // General & Metadata
      quality: "مطابق للمواصفات",
      uses: "أعمال الخرسانة المسلحة والمسبقة الإجهاد",
      desc: core.notes || "",
      rating: core.rating || 5,
      provenance: core.source,
      sourceQuarry: core.source,
      region: core.region || "الجزائر",
      wilaya: core.region,
      price: core.price || getNum("PROP-PRICE") || 0,
      isSystem: core.sourceType === "SYSTEM",
      isDemo: core.sourceType === "SYSTEM",
      sourceType: core.sourceType === "SYSTEM" ? "system_demo" : "user_created",
      status: core.status === "SUSPENDED" ? "موقوف" : core.status === "PENDING_REVIEW" ? "قيد المراجعة" : "نشط",
      ApprovalStatus: core.validationStatus === "APPROVED" ? "Approved" : "Validated",
      approvalStatus: core.validationStatus === "APPROVED" ? "Approved" : "Validated",
      gradationData: core.granulometry || [],
      laboratoryTests: core.laboratoryTestIds || [],
      extraProperties: core.extraProperties || {},
      createdDate: core.createdAt,
      updatedDate: core.updatedAt
    };
  }

  public static mapLegacyCategory(cat: string): MaterialCategoryUnified {
    if (!cat) return "OTHER";
    const c = cat.toLowerCase();
    if (c.includes("sand") || c.includes("رمال") || c.includes("رمل") || c.includes("sable")) return "SAND";
    if (c.includes("gravel") || c.includes("حصى") || c.includes("gravier") || c.includes("ركام")) return "GRAVEL";
    if (c.includes("cement") || c.includes("إسمنت") || c.includes("اسمنت") || c.includes("ciment") || c.includes("مادة رابطة")) return "CEMENT";
    if (c.includes("water") || c.includes("ماء") || c.includes("مياه") || c.includes("eau")) return "WATER";
    if (c.includes("admix") || c.includes("مضاف") || c.includes("إضافات كيميائية") || c.includes("adjuvant")) return "ADMIXTURES";
    if (c.includes("mineral") || c.includes("معدنية") || c.includes("scm") || c.includes("فيلر") || c.includes("سيليكا")) return "MINERAL_ADDITIONS";
    if (c.includes("fiber") || c.includes("ألياف") || c.includes("الياف") || c.includes("fibre")) return "FIBERS";
    if (c.includes("soil") || c.includes("تربة") || c.includes("sol")) return "SOILS";
    if (c.includes("bitumen") || c.includes("إسفلت") || c.includes("بيتومين") || c.includes("asphalt")) return "BITUMINOUS";
    if (c.includes("masonry") || c.includes("بناء") || c.includes("بلوك")) return "MASONRY";
    return "OTHER";
  }

  public static toLegacyCategoryName(cat: MaterialCategoryUnified): string {
    switch (cat) {
      case "SAND": return "رمال";
      case "GRAVEL": return "حصى";
      case "CEMENT": return "إسمنت";
      case "WATER": return "ماء";
      case "ADMIXTURES": return "إضافات كيميائية";
      case "MINERAL_ADDITIONS": return "إضافات معدنية";
      case "FIBERS": return "ألياف";
      case "SOILS": return "تربة";
      case "BITUMINOUS": return "مواد بيتومينية";
      case "MASONRY": return "مواد بناء";
      default: return "أخرى";
    }
  }

  private static persistMyMaterialsToStorage(): void {
    try {
      if (typeof window === "undefined" || !window.localStorage) return;
      const array = Array.from(MaterialService.myMaterials.values());
      window.localStorage.setItem(MaterialService.STORAGE_KEY_MY_MATERIALS, JSON.stringify(array));
    } catch (e) {
      console.warn("Could not save My Materials to localStorage:", e);
    }
  }

  private static loadMyMaterialsFromStorage(): void {
    try {
      if (typeof window === "undefined" || !window.localStorage) return;
      const raw = window.localStorage.getItem(MaterialService.STORAGE_KEY_MY_MATERIALS);
      if (!raw) return;
      const array = JSON.parse(raw);
      if (Array.isArray(array)) {
        MaterialService.myMaterials.clear();
        for (const item of array) {
          if (item && item.id) {
            MaterialService.myMaterials.set(item.id, item);
          }
        }
      }
    } catch (e) {
      console.warn("Could not load My Materials from localStorage:", e);
    }
  }
}
