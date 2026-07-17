import { describe, it, expect } from "vitest";
import { 
  normalizeArabicForSearch, 
  getNormalizedMaterialType, 
  parseNumericValue,
  getNormalizedDetailedCategory
} from "../components/MaterialEngineeringDatabase";

describe("Material Engineering Database Helper Tests", () => {
  describe("Arabic Search Normalization", () => {
    it("should standardize Alifs, Yehs, and Teh Marbutas", () => {
      expect(normalizeArabicForSearch("إسمنت")).toBe("اسمنت");
      expect(normalizeArabicForSearch("حصى")).toBe("حصي");
      expect(normalizeArabicForSearch("بورتلاندية")).toBe("بورتلانديه");
      expect(normalizeArabicForSearch("  ماء مصفى  ")).toBe("ماء مصفي");
    });

    it("should handle empty or null values gracefully", () => {
      expect(normalizeArabicForSearch("")).toBe("");
      expect(normalizeArabicForSearch(null as any)).toBe("");
    });
  });

  describe("Detailed Category Multilingual Normalization (Arabic, French, English)", () => {
    it("should map cementitious variations to 'إسمنت'", () => {
      expect(getNormalizedDetailedCategory({ category: "Cement" })).toBe("إسمنت");
      expect(getNormalizedDetailedCategory({ type: "Ciment" })).toBe("إسمنت");
      expect(getNormalizedDetailedCategory({ name: "Liant" })).toBe("إسمنت");
      expect(getNormalizedDetailedCategory({ Category: "اسمنت" })).toBe("إسمنت");
    });

    it("should map sand variations to 'رمال'", () => {
      expect(getNormalizedDetailedCategory({ category: "Sand" })).toBe("رمال");
      expect(getNormalizedDetailedCategory({ type: "Sable" })).toBe("رمال");
      expect(getNormalizedDetailedCategory({ name: "Fine Aggregate" })).toBe("رمال");
    });

    it("should map gravel variations to 'حصى'", () => {
      expect(getNormalizedDetailedCategory({ category: "Gravel" })).toBe("حصى");
      expect(getNormalizedDetailedCategory({ type: "Gravier" })).toBe("حصى");
      expect(getNormalizedDetailedCategory({ name: "Coarse Aggregate" })).toBe("حصى");
      expect(getNormalizedDetailedCategory({ name: "Gravillon" })).toBe("حصى");
    });

    it("should map water variations to 'ماء'", () => {
      expect(getNormalizedDetailedCategory({ category: "Water" })).toBe("ماء");
      expect(getNormalizedDetailedCategory({ type: "Eau" })).toBe("ماء");
    });

    it("should map chemical admixture variations to 'إضافات كيميائية'", () => {
      expect(getNormalizedDetailedCategory({ category: "Admixture" })).toBe("إضافات كيميائية");
      expect(getNormalizedDetailedCategory({ type: "Adjuvant" })).toBe("إضافات كيميائية");
      expect(getNormalizedDetailedCategory({ name: "Superplastifiant" })).toBe("إضافات كيميائية");
    });

    it("should map supplementary mineral additions to 'إضافات معدنية'", () => {
      expect(getNormalizedDetailedCategory({ category: "SCM" })).toBe("إضافات معدنية");
      expect(getNormalizedDetailedCategory({ type: "Addition minérale" })).toBe("إضافات معدنية");
      expect(getNormalizedDetailedCategory({ name: "Fly ash" })).toBe("إضافات معدنية");
    });

    it("should map fibers to 'ألياف'", () => {
      expect(getNormalizedDetailedCategory({ category: "Fibers" })).toBe("ألياف");
      expect(getNormalizedDetailedCategory({ type: "Fibres" })).toBe("ألياف");
    });
  });

  describe("Material Type Normalization (Arabic, French, English)", () => {
    it("should normalize binder and cement inputs to 'مادة رابطة'", () => {
      expect(getNormalizedMaterialType({ materialType: "Cement CEM I" })).toBe("مادة رابطة");
      expect(getNormalizedMaterialType({ category: "إسمنت" })).toBe("مادة رابطة");
      expect(getNormalizedMaterialType({ name: "Liant hydraulique" })).toBe("مادة رابطة");
    });

    it("should normalize aggregate inputs to 'ركام'", () => {
      expect(getNormalizedMaterialType({ materialType: "fine aggregate" })).toBe("ركام");
      expect(getNormalizedMaterialType({ category: "sable" })).toBe("ركام");
      expect(getNormalizedMaterialType({ name: "gravier de concassage" })).toBe("ركام");
      expect(getNormalizedMaterialType({ name: "حجر مكسر" })).toBe("ركام");
    });

    it("should normalize SCM inputs to 'إضافات معدنية'", () => {
      expect(getNormalizedMaterialType({ materialType: "SCM" })).toBe("إضافات معدنية");
      expect(getNormalizedMaterialType({ category: "addition minérale" })).toBe("إضافات معدنية");
      expect(getNormalizedMaterialType({ name: "fly ash" })).toBe("إضافات معدنية");
      expect(getNormalizedMaterialType({ name: "رماد متطاير" })).toBe("إضافات معدنية");
    });

    it("should normalize fiber inputs to 'ألياف'", () => {
      expect(getNormalizedMaterialType({ materialType: "Fibers" })).toBe("ألياف");
      expect(getNormalizedMaterialType({ name: "fibres d'acier" })).toBe("ألياف");
      expect(getNormalizedMaterialType({ name: "ألياف زجاجية" })).toBe("ألياف");
    });

    it("should normalize chemical admixture inputs to 'إضافات كيميائية'", () => {
      expect(getNormalizedMaterialType({ materialType: "admixture" })).toBe("إضافات كيميائية");
      expect(getNormalizedMaterialType({ category: "superplastifiant" })).toBe("إضافات كيميائية");
      expect(getNormalizedMaterialType({ name: "retardeur de prise" })).toBe("إضافات كيميائية");
      expect(getNormalizedMaterialType({ name: "ملدن متفوق" })).toBe("إضافات كيميائية");
    });

    it("should normalize water inputs to 'ماء'", () => {
      expect(getNormalizedMaterialType({ materialType: "water" })).toBe("ماء");
      expect(getNormalizedMaterialType({ name: "eau de gâchage" })).toBe("ماء");
      expect(getNormalizedMaterialType({ name: "مياه جوفية" })).toBe("ماء");
    });
  });

  describe("Robust Numeric Parsing (Density and Price)", () => {
    it("should handle standard integers and decimals", () => {
      expect(parseNumericValue(2650)).toBe(2650);
      expect(parseNumericValue(2.65)).toBe(2.65);
    });

    it("should handle European decimal commas", () => {
      expect(parseNumericValue("2,65")).toBe(2.65);
    });

    it("should handle space-separated thousands", () => {
      expect(parseNumericValue("2 650")).toBe(2650);
    });

    it("should handle units like kg/m³ and DA", () => {
      expect(parseNumericValue("2650 kg/m³")).toBe(2650);
      expect(parseNumericValue("3500 DA")).toBe(3500);
      expect(parseNumericValue("3500 da.")).toBe(3500);
    });

    it("should handle complex noisy inputs", () => {
      expect(parseNumericValue(" 2 650 , 5  kg/m³ ")).toBe(2650.5);
      expect(parseNumericValue("Price: 12,500.00 $")).toBe(12500);
    });

    it("should handle empty or invalid inputs gracefully", () => {
      expect(parseNumericValue("")).toBe(0);
      expect(parseNumericValue(null)).toBe(0);
      expect(parseNumericValue(undefined)).toBe(0);
    });
  });

  describe("Density and Price sorting behavior based on parsed numeric values", () => {
    it("should correctly sort list based on parsed numeric values", () => {
      const items = [
        { name: "A", density: "2 650 kg/m³" },
        { name: "B", density: "3100 kg/m³" },
        { name: "C", density: "2,65" }
      ];
      
      const parsed = items.map(item => ({
        ...item,
        parsedDensity: parseNumericValue(item.density)
      }));

      parsed.sort((a, b) => a.parsedDensity - b.parsedDensity);

      expect(parsed[0].name).toBe("C"); // 2.65
      expect(parsed[1].name).toBe("A"); // 2650
      expect(parsed[2].name).toBe("B"); // 3100
    });
  });
});
