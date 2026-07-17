import { describe, it, expect } from "vitest";
import { SEEDED_MATERIALS } from "../data/seededMaterials";
import { 
  normalizeArabicForSearch, 
  getNormalizedMaterialType, 
  getNormalizedDetailedCategory,
  parseNumericValue 
} from "../components/MaterialEngineeringDatabase";

// A simulated runner mimicking the exact filtering logic of MaterialEngineeringDatabase component
function filterMaterials(
  list: any[],
  options: {
    searchQuery: string;
    selectedCategory: string;
    selectedMaterialType: string;
    selectedRegion: string;
    selectedQuality: string;
    selectedStatus: string;
    showOnlyFavorites?: boolean;
    favorites?: string[];
  }
) {
  const {
    searchQuery,
    selectedCategory,
    selectedMaterialType,
    selectedRegion,
    selectedQuality,
    selectedStatus,
    showOnlyFavorites = false,
    favorites = []
  } = options;

  return list.filter(mat => {
    // 1. Search text query
    const query = searchQuery.trim();
    const normalizedQuery = normalizeArabicForSearch(query);
    
    let matchesSearch = true;
    if (normalizedQuery !== "") {
      const fieldsToSearch = [
        mat.name,
        mat.englishName,
        mat.ArabicName,
        mat.EnglishName,
        mat.id,
        mat.MaterialCode,
        mat.MaterialID,
        mat.category,
        mat.SubCategory,
        mat.Category,
        mat.materialType,
        mat.type,
        mat.producer,
        mat.supplier,
        mat.Supplier,
        mat.source,
        mat.sourceQuarry,
        mat.provenance,
        mat.region,
        mat.wilaya,
        mat.createdBy,
        mat.desc,
        mat.uses,
        mat.notes,
        mat.quality
      ].map(val => normalizeArabicForSearch(String(val || "")));

      matchesSearch = fieldsToSearch.some(fieldVal => fieldVal.includes(normalizedQuery));
    }

    // 2. Category selection
    let matchesCategory = true;
    if (selectedCategory !== "الكل") {
      const matCat = getNormalizedDetailedCategory(mat);
      if (matCat === "أخرى") {
        matchesCategory = false;
      } else {
        const normMatCat = normalizeArabicForSearch(matCat);
        const normSelCat = normalizeArabicForSearch(selectedCategory);
        matchesCategory = normMatCat === normSelCat || normMatCat.includes(normSelCat) || normSelCat.includes(normMatCat);
      }
    }

    // 3. Material Type selection
    let matchesMaterialType = true;
    if (selectedMaterialType !== "الكل") {
      const mType = getNormalizedMaterialType(mat);
      matchesMaterialType = normalizeArabicForSearch(mType) === normalizeArabicForSearch(selectedMaterialType);
    }

    // 4. Quality match
    let matchesQuality = true;
    if (selectedQuality !== "all") {
      const qStr = String(mat.quality || "").toLowerCase();
      const descStr = String(mat.desc || "").toLowerCase();
      const catStr = String(mat.category || "").toLowerCase();
      const ratingVal = mat.rating || 0;

      if (selectedQuality === "premium") {
        matchesQuality = qStr.includes("ممتاز") || qStr.includes("نقي") || qStr.includes("بركاني") || ratingVal >= 4.8 || qStr.includes("premium") || qStr.includes("excellent") || qStr.includes("عالي");
      } else if (selectedQuality === "standard") {
        matchesQuality = qStr.includes("قياسي") || qStr.includes("عادي") || (ratingVal >= 4.3 && ratingVal < 4.8) || qStr.includes("standard") || qStr.includes("normal");
      } else if (selectedQuality === "eco") {
        matchesQuality = catStr === "مواد معاد تدويرها" || catStr === "إضافات معدنية" || descStr.includes("صديق للبيئة") || descStr.includes("eco") || descStr.includes("green") || qStr.includes("eco") || catStr.includes("recycled");
      }
    }

    // 5. Region
    let matchesRegion = true;
    if (selectedRegion !== "all") {
      const matProvRaw = mat.provenance || mat.region || mat.Region || mat.wilaya || "";
      if (!matProvRaw.trim()) {
        matchesRegion = false;
      } else {
        const matProv = normalizeArabicForSearch(matProvRaw);
        const selReg = normalizeArabicForSearch(selectedRegion);
        matchesRegion = matProv.includes(selReg) || selReg.includes(matProv);
      }
    }

    // 6. Favorites
    const matchesFav = !showOnlyFavorites || favorites.includes(mat.id);

    // 7. Status
    let matchesStatus = true;
    if (selectedStatus !== "all") {
      const s = String(mat.status || mat.Status || "").toLowerCase();
      const app = String(mat.ApprovalStatus || mat.approvalStatus || "").toLowerCase();
      const isActive = s === "نشط" || s === "active" || s === "approved" || app === "approved" || app === "validated";
      
      if (selectedStatus === "active") {
        matchesStatus = isActive;
      } else if (selectedStatus === "inactive") {
        matchesStatus = !isActive;
      }
    }

    return matchesSearch && matchesCategory && matchesMaterialType && matchesQuality && matchesRegion && matchesFav && matchesStatus;
  });
}

// Simulated sorting logic mimicking MaterialEngineeringDatabase component
function sortMaterials(list: any[], sortBy: string, sortOrder: "asc" | "desc", language: "ar" | "en" = "ar") {
  return [...list].sort((a, b) => {
    let valA: any = "";
    let valB: any = "";

    if (sortBy === "name") {
      valA = language === "ar" ? a.name : (a.englishName || a.name);
      valB = language === "ar" ? b.name : (b.englishName || b.name);
    } else if (sortBy === "category") {
      valA = getNormalizedDetailedCategory(a);
      valB = getNormalizedDetailedCategory(b);
    } else if (sortBy === "density") {
      const rawA = a.density !== undefined ? a.density : (a.Density !== undefined ? a.Density : 0);
      const rawB = b.density !== undefined ? b.density : (b.Density !== undefined ? b.Density : 0);
      valA = parseNumericValue(rawA);
      valB = parseNumericValue(rawB);
    } else if (sortBy === "price") {
      const rawA = a.price !== undefined ? a.price : (a.Price !== undefined ? a.Price : 0);
      const rawB = b.price !== undefined ? b.price : (b.Price !== undefined ? b.Price : 0);
      valA = parseNumericValue(rawA);
      valB = parseNumericValue(rawB);
    }

    if (typeof valA === "string" && typeof valB === "string") {
      return sortOrder === "asc"
        ? valA.localeCompare(valB, language)
        : valB.localeCompare(valA, language);
    } else {
      const numA = Number(valA);
      const numB = Number(valB);
      return sortOrder === "asc" ? numA - numB : numB - numA;
    }
  });
}

describe("Material Engineering Database UI Flow Integration Tests", () => {
  const testMaterials = [
    ...SEEDED_MATERIALS,
    // Add custom French & English test materials to prove multilingual flows are seamlessly bound
    {
      id: "mat-french-cement",
      name: "Ciment Haute Résistance",
      englishName: "High Strength Cement",
      type: "cementitious",
      category: "Ciment",
      density: "3,15", // decimal comma format
      price: "3500 DA", // currency format
      provenance: "Oran",
      quality: "excellent",
      status: "active"
    },
    {
      id: "mat-english-sand",
      name: "Sable de Dune Oued Souf",
      englishName: "Oued Souf Dune Sand",
      type: "sand",
      category: "Sand",
      density: "2 650 kg/m³", // space and unit format
      price: "1200 DA",
      provenance: "Oued Souf",
      quality: "premium",
      status: "active"
    }
  ];

  it("should support combining search query with multiple active filters (AND logic) and update result count correctly", () => {
    const initialCount = testMaterials.length;
    expect(initialCount).toBeGreaterThan(0);

    // Filter 1: Search query "Ciment"
    const step1 = filterMaterials(testMaterials, {
      searchQuery: "Ciment",
      selectedCategory: "الكل",
      selectedMaterialType: "الكل",
      selectedRegion: "all",
      selectedQuality: "all",
      selectedStatus: "all"
    });
    // Should match "Ciment Haute Résistance" or any other cement with Ciment keyword
    expect(step1.length).toBeLessThan(initialCount);
    expect(step1.some(m => m.id === "mat-french-cement")).toBe(true);

    // Filter 2: Add category "إسمنت" (multilingual "Ciment" matches "إسمنت")
    const step2 = filterMaterials(testMaterials, {
      searchQuery: "Ciment",
      selectedCategory: "إسمنت",
      selectedMaterialType: "الكل",
      selectedRegion: "all",
      selectedQuality: "all",
      selectedStatus: "all"
    });
    expect(step2.length).toBeGreaterThan(0);
    expect(step2.some(m => m.id === "mat-french-cement")).toBe(true);

    // Filter 3: Add Region filter "Oran"
    const step3 = filterMaterials(testMaterials, {
      searchQuery: "Ciment",
      selectedCategory: "إسمنت",
      selectedMaterialType: "الكل",
      selectedRegion: "Oran",
      selectedQuality: "all",
      selectedStatus: "all"
    });
    // High Strength Cement is from Oran, so it should match!
    expect(step3.length).toBeGreaterThan(0);
    expect(step3.some(m => m.id === "mat-french-cement")).toBe(true);

    // Filter 4: Add Quality filter "premium" (High Strength Cement has quality "excellent" which maps to premium)
    const step4 = filterMaterials(testMaterials, {
      searchQuery: "Ciment",
      selectedCategory: "إسمنت",
      selectedMaterialType: "الكل",
      selectedRegion: "Oran",
      selectedQuality: "premium",
      selectedStatus: "all"
    });
    expect(step4.length).toBe(1);
    expect(step4[0].id).toBe("mat-french-cement");
  });

  it("should sort results correctly by density and price with diverse unit formats", () => {
    // We want to sort our test materials by density and price
    const subset = [
      { id: "M1", name: "Material A", density: "2 650 kg/m³", price: "3500 DA" },
      { id: "M2", name: "Material B", density: "2,65", price: "1200 DA" },
      { id: "M3", name: "Material C", density: "3,15", price: "2400 DA" }
    ];

    // Note: 2,65 is parsed to 2.65, 3,15 is parsed to 3.15, 2 650 is 2650.
    // 1. Sort by density ASC
    const sortedDensityAsc = sortMaterials(subset, "density", "asc");
    expect(sortedDensityAsc[0].id).toBe("M2"); // 2.65
    expect(sortedDensityAsc[1].id).toBe("M3"); // 3.15
    expect(sortedDensityAsc[2].id).toBe("M1"); // 2650

    // 2. Sort by density DESC
    const sortedDensityDesc = sortMaterials(subset, "density", "desc");
    expect(sortedDensityDesc[0].id).toBe("M1"); // 2650
    expect(sortedDensityDesc[1].id).toBe("M3"); // 3.15
    expect(sortedDensityDesc[2].id).toBe("M2"); // 2.65

    // 3. Sort by price ASC
    const sortedPriceAsc = sortMaterials(subset, "price", "asc");
    expect(sortedPriceAsc[0].id).toBe("M2"); // 1200
    expect(sortedPriceAsc[1].id).toBe("M3"); // 2400
    expect(sortedPriceAsc[2].id).toBe("M1"); // 3500
  });

  it("should simulate a reset filters action, restoring default selections and returning count to initial list size", () => {
    // 1. Apply multiple restrictive filters
    const filtered = filterMaterials(testMaterials, {
      searchQuery: "XYZ Non Existent Query",
      selectedCategory: "ألياف",
      selectedMaterialType: "ألياف",
      selectedRegion: "Nowhere",
      selectedQuality: "eco",
      selectedStatus: "inactive"
    });
    
    expect(filtered.length).toBe(0);

    // 2. Perform mock reset action
    const defaultOptions = {
      searchQuery: "",
      selectedCategory: "الكل",
      selectedMaterialType: "الكل",
      selectedRegion: "all",
      selectedQuality: "all",
      selectedStatus: "all"
    };

    const resetFiltered = filterMaterials(testMaterials, defaultOptions);
    expect(resetFiltered.length).toBe(testMaterials.length);
  });
});
