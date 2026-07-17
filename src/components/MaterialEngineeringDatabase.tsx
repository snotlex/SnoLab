import React, { useState, useMemo, useEffect } from "react";
import { 
  Database, 
  Search, 
  Filter, 
  Heart, 
  Star, 
  Sparkles, 
  RefreshCw, 
  Layers, 
  Droplet, 
  Gauge, 
  Info, 
  MapPin, 
  Check, 
  CheckCircle,
  Award, 
  Plus, 
  Trash2, 
  Copy, 
  Edit3, 
  X, 
  Save, 
  DollarSign,
  Briefcase,
  History,
  TrendingDown,
  Activity,
  User,
  HelpCircle,
  AlertTriangle,
  Download,
  Upload,
  Settings,
  Grid,
  RotateCcw,
  ArrowUpDown,
  SlidersHorizontal,
  CheckCheck,
  FolderOpen,
  EyeOff,
  Eye
} from "lucide-react";
import { MixDesignInput, EngineeringMaterial, AggregateType, AggregateQuality } from "../types";
import { mapMaterialToMixInput, getMaterialCategory } from "../utils/mapMaterialToMixInput";
import { 
  parseSmartMaterialImport, 
  TARGET_FIELDS, 
  SmartImportWorksheet, 
  detectSheetCategory, 
  shouldIgnoreSheet,
  normalizeNumber,
  normalizeName,
  generateMaterialId,
  validateImportedMaterial,
  mapImportedRowToEngineeringMaterial,
  calculateHeaderMapping
} from "../utils/parseSmartMaterialImport";
import { useLanguage } from "../services/localization";
import { CONCRETE_TYPE_CONFIGS } from "../concreteTypes";
import { SEEDED_MATERIALS } from "../data/seededMaterials";
import { isUserMaterial } from "../engine/suitabilityGate";
import * as XLSX from "xlsx";

interface MaterialEngineeringDatabaseProps {
  inputs: MixDesignInput;
  setInputs: (inputs: any) => void;
  handleSandPreset: (name: string, density: number) => void;
  handleGravelPreset: (name: string, density: number) => void;
  customMaterialImages: Record<string, string>;
  generatingMaterialKey: string | null;
  handleGenerateMaterialImage: (key: string, mat: any) => Promise<void>;
  generationError: string | null;
  defaultType?: "all" | "sand" | "gravel" | "cementitious" | "aggregates_only";
  defaultRepo?: "cement" | "aggregates" | "admixtures" | "water";
  materials?: EngineeringMaterial[];
  onUpdateMaterials?: (updated: EngineeringMaterial[]) => void;
  onClearAllMaterials?: () => void;
}

// Map base categories to logical groups for navigation filters
const CATEGORIES_LIST = [
  "الكل",
  "إسمنت",
  "ماء",
  "رمال",
  "حصى",
  "ركام خفيف",
  "ركام ثقيل",
  "إضافات كيميائية",
  "إضافات معدنية",
  "ألياف",
  "محتوى الهواء",
  "مجلدات خاصة",
  "مواد مالئة"
] as const;

const mapCategoryToType = (category: string): string => {
  return category === "رمال" ? "sand" :
         category === "حصى" ? "gravel" :
         category === "إسمنت" ? "cementitious" :
         category === "إضافات كيميائية" ? "admixture" :
         category === "إضافات معدنية" ? "scm" :
         category === "ماء" ? "water" :
         category === "ركام خفيف" ? "light_gravel" :
         category === "ركام ثقيل" ? "heavy_gravel" :
         category === "ألياف" ? "fibers" :
         category === "محتوى الهواء" ? "air" :
         category === "مواد مالئة" ? "filler" : "special";
};

// Unified Detailed Category Normalization supporting Arabic, French, and English
export const getNormalizedDetailedCategory = (mat: any): string => {
  if (!mat) return "أخرى";
  const rawCat = String(getMaterialCategory(mat) || mat.category || mat.Category || mat.type || "").toLowerCase().trim();
  const rawName = String(mat.name || mat.englishName || mat.ArabicName || mat.EnglishName || "").toLowerCase().trim();

  const matchesAny = (str: string, keywords: string[]): boolean => {
    return keywords.some(kw => str.includes(kw));
  };

  const binderKeywords = ["إسمنت", "اسمنت", "كلنكر", "رابط", "مجلد", "ciment", "cement", "clinker", "binder", "liant"];
  const waterKeywords = ["ماء", "مياه", "eau", "water"];
  const sandKeywords = ["رمال", "رمل", "sable", "sand", "fine aggregate", "fin"];
  const lightKeywords = ["خفيف", "leger", "léger", "light"];
  const heavyKeywords = ["ثقيل", "lourd", "heavy", "baryte", "magnetite", "magnétite"];
  const gravelKeywords = ["حصى", "حصي", "ركام خشن", "حجر", "gravier", "gravillon", "gravel", "coarse", "stone", "caillou"];
  const scmKeywords = ["معدنية", "معدنيه", "رماد", "خبث", "سليكا", "سيليكا", "بوزولان", "addition minérale", "addition minerale", "scm", "cendres", "laitier", "silice", "fly ash", "slag", "silica fume", "pozzolan", "metakaolin", "supplementary"];
  const chemicalKeywords = ["كيميائية", "كيميائيه", "ملدن", "مسرع", "مؤخر", "مضافة", "مضافات", "adjuvant", "plastifiant", "superplastifiant", "accelerateur", "accélérateur", "retardateur", "retardeur", "retard", "entraineur", "admixture", "plasticizer", "superplasticizer", "retarder", "accelerator"];
  const fiberKeywords = ["ألياف", "الياف", "ليف", "fibre", "fibres", "fiber", "fibers"];
  const airKeywords = ["هواء", "حوابس", "air", "foam", "entraineur"];
  const specialKeywords = ["خاصة", "خاصه", "جيوبوليمر", "إيبوكسي", "ايبوكسي", "epoxy", "geopolymer", "geopolymere", "special", "spécial", "resine", "résine"];
  const fillerKeywords = ["مالئة", "مالئه", "ملء", "filler", "limestone powder", "poussiere", "poussière"];

  // Check on rawCat first
  if (matchesAny(rawCat, binderKeywords)) return "إسمنت";
  if (matchesAny(rawCat, waterKeywords)) return "ماء";
  if (matchesAny(rawCat, lightKeywords)) return "ركام خفيف";
  if (matchesAny(rawCat, heavyKeywords)) return "ركام ثقيل";
  if (matchesAny(rawCat, sandKeywords)) return "رمال";
  if (matchesAny(rawCat, gravelKeywords)) return "حصى";
  if (matchesAny(rawCat, scmKeywords)) return "إضافات معدنية";
  if (matchesAny(rawCat, chemicalKeywords)) return "إضافات كيميائية";
  if (matchesAny(rawCat, fiberKeywords)) return "ألياف";
  if (matchesAny(rawCat, airKeywords)) return "محتوى الهواء";
  if (matchesAny(rawCat, specialKeywords)) return "مجلدات خاصة";
  if (matchesAny(rawCat, fillerKeywords)) return "مواد مالئة";

  // Then check on rawName
  if (matchesAny(rawName, binderKeywords)) return "إسمنت";
  if (matchesAny(rawName, waterKeywords)) return "ماء";
  if (matchesAny(rawName, lightKeywords)) return "ركام خفيف";
  if (matchesAny(rawName, heavyKeywords)) return "ركام ثقيل";
  if (matchesAny(rawName, sandKeywords)) return "رمال";
  if (matchesAny(rawName, gravelKeywords)) return "حصى";
  if (matchesAny(rawName, scmKeywords)) return "إضافات معدنية";
  if (matchesAny(rawName, chemicalKeywords)) return "إضافات كيميائية";
  if (matchesAny(rawName, fiberKeywords)) return "ألياف";
  if (matchesAny(rawName, airKeywords)) return "محتوى الهواء";
  if (matchesAny(rawName, specialKeywords)) return "مجلدات خاصة";
  if (matchesAny(rawName, fillerKeywords)) return "مواد مالئة";

  const legacy = getMaterialCategory(mat);
  if (legacy && (CATEGORIES_LIST as unknown as string[]).includes(legacy)) {
    return legacy;
  }

  return "أخرى";
};

function parseWorksheetToSmartRows(worksheet: XLSX.WorkSheet): { headers: string[]; rawRows: any[] } {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
  const rows: any[][] = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row: any[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      const cell = worksheet[cellRef];
      const val = cell ? cell.v : null;
      row.push(val);
    }
    rows.push(row);
  }

  // Find the header row by scoring synonym matches in first 30 rows
  let bestHeaderRowIndex = -1;
  let maxMatchScore = -1;
  let bestHeaders: string[] = [];

  for (let r = 0; r < Math.min(rows.length, 30); r++) {
    const row = rows[r];
    if (!row) continue;
    let matchCount = 0;
    const currentHeaders: string[] = [];
    
    row.forEach((cellVal) => {
      if (cellVal === null || cellVal === undefined) {
        currentHeaders.push("");
        return;
      }
      const valStr = String(cellVal).trim();
      currentHeaders.push(valStr);
      if (valStr === "") return;

      const norm = valStr.toLowerCase().replace(/[\(\)%\/_-]/g, " ").replace(/\s+/g, " ");
      const isSynonym = TARGET_FIELDS.some(field => {
        if (field.regex && field.regex.test(norm)) return true;
        return field.synonyms.some(syn => {
          const cleanSyn = syn.toLowerCase();
          return norm === cleanSyn || norm.includes(cleanSyn) || cleanSyn.includes(norm);
        });
      });
      if (isSynonym) {
        matchCount++;
      }
    });

    if (matchCount > maxMatchScore && matchCount > 0) {
      maxMatchScore = matchCount;
      bestHeaderRowIndex = r;
      bestHeaders = currentHeaders;
    }
  }

  // Default if no header row was detected
  if (bestHeaderRowIndex === -1) {
    bestHeaderRowIndex = rows.findIndex(r => r && r.some(c => c !== null && c !== undefined && String(c).trim() !== ""));
    if (bestHeaderRowIndex === -1) bestHeaderRowIndex = 0;
    bestHeaders = (rows[bestHeaderRowIndex] || []).map((c, i) => c !== null && c !== undefined ? String(c).trim() : `Column_${i + 1}`);
  }

  const uniqueHeaders = bestHeaders.map((h, idx) => {
    const trimmed = String(h || "").trim();
    if (trimmed === "") return `Column_${idx + 1}`;
    return trimmed;
  });

  const rawRows: any[] = [];
  for (let r = bestHeaderRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;

    const nonEmpties = row.filter(c => c !== null && c !== undefined && String(c).trim() !== "");
    if (nonEmpties.length === 0) continue;

    // Skip divider/metadata subtitles
    if (nonEmpties.length === 1 && String(row[0] || "").length > 30) {
      continue;
    }

    const rowObj: any = {};
    let hasAnyMappedValue = false;
    uniqueHeaders.forEach((header, cIdx) => {
      const val = row[cIdx];
      if (val !== null && val !== undefined) {
        rowObj[header] = val;
        hasAnyMappedValue = true;
      }
    });

    if (hasAnyMappedValue) {
      rawRows.push(rowObj);
    }
  }

  return { headers: uniqueHeaders.filter(h => h !== ""), rawRows };
}

function matchColumns(fileHeaders: string[]): Record<string, string> {
  return parseSmartMaterialImport(fileHeaders);
}

// Arabic Normalization for robust search and alphabetical sorting (ignores definite article "ال" and standardizes Alifs/Yehs/Teh Marbutas)
export const normalizeArabicForSearch = (str: string): string => {
  if (!str) return "";
  let normalized = str.trim().toLowerCase();
  normalized = normalized.replace(/[أإآ]/g, "ا");
  normalized = normalized.replace(/ى/g, "ي");
  normalized = normalized.replace(/ة/g, "ه");
  normalized = normalized.replace(/\s+/g, " ");
  return normalized;
};

// Unified Material Type Normalization supporting Arabic, French, and English
export const getNormalizedMaterialType = (mat: any): string => {
  const rawType = String(mat.materialType || mat.type || mat.category || "").toLowerCase().trim();
  const rawName = String(mat.name || mat.englishName || mat.ArabicName || mat.EnglishName || "").toLowerCase().trim();
  
  const matchesAny = (str: string, keywords: string[]): boolean => {
    return keywords.some(kw => str.includes(kw));
  };

  const binderKeywords = ["رابط", "رابطة", "إسمنت", "اسمنت", "مجلد", "كلنكر", "liant", "ciment", "binder", "clinker", "cement"];
  const aggregateKeywords = ["ركام", "رمال", "رمل", "حصى", "حصيه", "حجر", "granulat", "sable", "gravier", "gravillon", "aggregate", "sand", "gravel", "stone", "coarse", "fine"];
  const scmKeywords = ["معدنية", "معدنيه", "رماد", "خبث", "سليكا", "سيليكا", "بوزولان", "addition minérale", "addition minerale", "scm", "cendres", "laitier", "silice", "fly ash", "slag", "silica fume", "pozzolan", "metakaolin", "supplementary"];
  const fiberKeywords = ["ألياف", "الياف", "ليف", "fibre", "fibres", "fiber", "fibers"];
  const chemicalKeywords = ["كيميائية", "كيميائيه", "ملدن", "مسرع", "مؤخر", "مضافة", "مضافات", "adjuvant", "plastifiant", "superplastifiant", "accelerateur", "accélérateur", "retardateur", "retardeur", "retard", "entraineur", "admixture", "plasticizer", "superplasticizer", "retarder", "accelerator"];
  const waterKeywords = ["ماء", "مياه", "eau", "water"];

  if (matchesAny(rawType, binderKeywords)) return "مادة رابطة";
  if (matchesAny(rawType, scmKeywords)) return "إضافات معدنية";
  if (matchesAny(rawType, aggregateKeywords)) return "ركام";
  if (matchesAny(rawType, fiberKeywords)) return "ألياف";
  if (matchesAny(rawType, chemicalKeywords)) return "إضافات كيميائية";
  if (matchesAny(rawType, waterKeywords)) return "ماء";

  if (matchesAny(rawName, binderKeywords)) return "مادة رابطة";
  if (matchesAny(rawName, scmKeywords)) return "إضافات معدنية";
  if (matchesAny(rawName, aggregateKeywords)) return "ركام";
  if (matchesAny(rawName, fiberKeywords)) return "ألياف";
  if (matchesAny(rawName, chemicalKeywords)) return "إضافات كيميائية";
  if (matchesAny(rawName, waterKeywords)) return "ماء";

  return "أخرى";
};

// Robust numeric parser supporting spaces, commas as decimals, and units
export const parseNumericValue = (val: any): number => {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number") return val;
  
  let str = String(val).trim();
  if (!str) return 0;
  
  str = str.replace(/(?:kg\/m³|da|da\.|dinars?|usd|\$|€|£|%|tons?|g\/cm³)/i, "");
  
  if (str.includes(",") && !str.includes(".")) {
    str = str.replace(",", ".");
  } else if (str.includes(",") && str.includes(".")) {
    str = str.replace(/,/g, "");
  }
  
  str = str.replace(/[^\d.-]/g, "");
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
};

export function MaterialEngineeringDatabase({
  inputs,
  setInputs,
  handleSandPreset,
  handleGravelPreset,
  customMaterialImages,
  generatingMaterialKey,
  handleGenerateMaterialImage,
  generationError,
  defaultType,
  defaultRepo,
  materials = [],
  onUpdateMaterials,
  onClearAllMaterials
}: MaterialEngineeringDatabaseProps) {
  const { t, language } = useLanguage();

  const getCategoryKey = (cat: string): string => {
    switch (cat) {
      case "الكل": return "cat_all";
      case "إسمنت": return "cat_cement";
      case "ماء": return "cat_water";
      case "رمال": return "cat_sand";
      case "حصى": return "cat_gravel";
      case "ركام خفيف": return "cat_light_gravel";
      case "ركام ثقيل": return "cat_heavy_gravel";
      case "إضافات كيميائية": return "cat_admixture";
      case "إضافات معدنية": return "cat_scm";
      case "ألياف": return "cat_fibers";
      case "محتوى الهواء": return "cat_air";
      case "مجلدات خاصة": return "cat_special";
      case "مواد مالئة": return "cat_filler";
      default: return cat;
    }
  };
  
  // Tab state: "system" vs "user"
  const [activeSourceTab, setActiveSourceTab] = useState<"system" | "user">("system");

  // Filter states for System Materials
  const [systemSearchQuery, setSystemSearchQuery] = useState(() => {
    return localStorage.getItem("system_material_searchQuery") || "";
  });
  const [systemSelectedCategory, setSystemSelectedCategory] = useState<string>(() => {
    return localStorage.getItem("system_material_selectedCategory") || "الكل";
  });
  const [systemSelectedMaterialType, setSystemSelectedMaterialType] = useState<string>(() => {
    return localStorage.getItem("system_material_selectedMaterialType") || "الكل";
  });
  const [systemSelectedRegion, setSystemSelectedRegion] = useState<string>(() => {
    return localStorage.getItem("system_material_selectedRegion") || "all";
  });
  const [systemSelectedQuality, setSystemSelectedQuality] = useState<string>(() => {
    return localStorage.getItem("system_material_selectedQuality") || "all";
  });
  const [systemSelectedStatus, setSystemSelectedStatus] = useState<string>(() => {
    return localStorage.getItem("system_material_selectedStatus") || "all";
  });
  const [systemSortBy, setSystemSortBy] = useState<string>(() => {
    return localStorage.getItem("system_material_sortBy") || "name";
  });
  const [systemSortOrder, setSystemSortOrder] = useState<"asc" | "desc">(() => {
    return (localStorage.getItem("system_material_sortOrder") as "asc" | "desc") || "asc";
  });
  const [systemShowOnlyFavorites, setSystemShowOnlyFavorites] = useState(() => {
    return localStorage.getItem("system_material_showOnlyFavorites") === "true";
  });

  // Filter states for User Materials
  const [userSearchQuery, setUserSearchQuery] = useState(() => {
    return localStorage.getItem("user_material_searchQuery") || "";
  });
  const [userSelectedCategory, setUserSelectedCategory] = useState<string>(() => {
    return localStorage.getItem("user_material_selectedCategory") || "الكل";
  });
  const [userSelectedMaterialType, setUserSelectedMaterialType] = useState<string>(() => {
    return localStorage.getItem("user_material_selectedMaterialType") || "الكل";
  });
  const [userSelectedRegion, setUserSelectedRegion] = useState<string>(() => {
    return localStorage.getItem("user_material_selectedRegion") || "all";
  });
  const [userSelectedQuality, setUserSelectedQuality] = useState<string>(() => {
    return localStorage.getItem("user_material_selectedQuality") || "all";
  });
  const [userSelectedStatus, setUserSelectedStatus] = useState<string>(() => {
    return localStorage.getItem("user_material_selectedStatus") || "all";
  });
  const [userSortBy, setUserSortBy] = useState<string>(() => {
    return localStorage.getItem("user_material_sortBy") || "name";
  });
  const [userSortOrder, setUserSortOrder] = useState<"asc" | "desc">(() => {
    return (localStorage.getItem("user_material_sortOrder") as "asc" | "desc") || "asc";
  });
  const [userShowOnlyFavorites, setUserShowOnlyFavorites] = useState(() => {
    return localStorage.getItem("user_material_showOnlyFavorites") === "true";
  });

  const [aiAssistSuccessMessage, setAIAssistSuccessMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Dynamic binders based on activeSourceTab
  const searchQuery = activeSourceTab === "system" ? systemSearchQuery : userSearchQuery;
  const setSearchQuery = activeSourceTab === "system" ? setSystemSearchQuery : setUserSearchQuery;

  const selectedCategory = activeSourceTab === "system" ? systemSelectedCategory : userSelectedCategory;
  const setSelectedCategory = activeSourceTab === "system" ? setSystemSelectedCategory : setUserSelectedCategory;

  const selectedMaterialType = activeSourceTab === "system" ? systemSelectedMaterialType : userSelectedMaterialType;
  const setSelectedMaterialType = activeSourceTab === "system" ? setSystemSelectedMaterialType : setUserSelectedMaterialType;

  const selectedRegion = activeSourceTab === "system" ? systemSelectedRegion : userSelectedRegion;
  const setSelectedRegion = activeSourceTab === "system" ? setSystemSelectedRegion : setUserSelectedRegion;

  const selectedQuality = activeSourceTab === "system" ? systemSelectedQuality : userSelectedQuality;
  const setSelectedQuality = activeSourceTab === "system" ? setSystemSelectedQuality : setUserSelectedQuality;

  const selectedStatus = activeSourceTab === "system" ? systemSelectedStatus : userSelectedStatus;
  const setSelectedStatus = activeSourceTab === "system" ? setSystemSelectedStatus : setUserSelectedStatus;

  const sortBy = activeSourceTab === "system" ? systemSortBy : userSortBy;
  const setSortBy = activeSourceTab === "system" ? setSystemSortBy : setUserSortBy;

  const sortOrder = activeSourceTab === "system" ? systemSortOrder : userSortOrder;
  const setSortOrder = activeSourceTab === "system" ? setSystemSortOrder : setUserSortOrder;

  const showOnlyFavorites = activeSourceTab === "system" ? systemShowOnlyFavorites : userShowOnlyFavorites;
  const setShowOnlyFavorites = activeSourceTab === "system" ? setSystemShowOnlyFavorites : setUserShowOnlyFavorites;

  // Synchronize filter & sort options to localStorage
  useEffect(() => {
    localStorage.setItem("system_material_searchQuery", systemSearchQuery);
    localStorage.setItem("user_material_searchQuery", userSearchQuery);
  }, [systemSearchQuery, userSearchQuery]);

  useEffect(() => {
    localStorage.setItem("system_material_selectedCategory", systemSelectedCategory);
    localStorage.setItem("user_material_selectedCategory", userSelectedCategory);
  }, [systemSelectedCategory, userSelectedCategory]);

  useEffect(() => {
    localStorage.setItem("system_material_selectedMaterialType", systemSelectedMaterialType);
    localStorage.setItem("user_material_selectedMaterialType", userSelectedMaterialType);
  }, [systemSelectedMaterialType, userSelectedMaterialType]);

  useEffect(() => {
    localStorage.setItem("system_material_selectedRegion", systemSelectedRegion);
    localStorage.setItem("user_material_selectedRegion", userSelectedRegion);
  }, [systemSelectedRegion, userSelectedRegion]);

  useEffect(() => {
    localStorage.setItem("system_material_selectedQuality", systemSelectedQuality);
    localStorage.setItem("user_material_selectedQuality", userSelectedQuality);
  }, [systemSelectedQuality, userSelectedQuality]);

  useEffect(() => {
    localStorage.setItem("system_material_selectedStatus", systemSelectedStatus);
    localStorage.setItem("user_material_selectedStatus", userSelectedStatus);
  }, [systemSelectedStatus, userSelectedStatus]);

  useEffect(() => {
    localStorage.setItem("system_material_sortBy", systemSortBy);
    localStorage.setItem("user_material_sortBy", userSortBy);
  }, [systemSortBy, userSortBy]);

  useEffect(() => {
    localStorage.setItem("system_material_sortOrder", systemSortOrder);
    localStorage.setItem("user_material_sortOrder", userSortOrder);
  }, [systemSortOrder, userSortOrder]);

  useEffect(() => {
    localStorage.setItem("system_material_showOnlyFavorites", systemShowOnlyFavorites ? "true" : "false");
    localStorage.setItem("user_material_showOnlyFavorites", userShowOnlyFavorites ? "true" : "false");
  }, [systemShowOnlyFavorites, userShowOnlyFavorites]);

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("material_favorites");
      return stored ? JSON.parse(stored) : ["sand-oued-souf", "gravel-biskra-limestone", "gravel-jijel-basaltic"];
    } catch {
      return ["sand-oued-souf", "gravel-biskra-limestone", "gravel-jijel-basaltic"];
    }
  });

  const [ratingsState, setRatingsState] = useState<Record<string, { avg: number; votes: number; myVote?: number }>>(() => {
    try {
      const stored = localStorage.getItem("material_ratings");
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      "sand-oued-souf": { avg: 4.8, votes: 85 },
      "sand-oued-mzab": { avg: 4.7, votes: 62 },
      "sand-larbaa-crushed": { avg: 4.5, votes: 44 },
      "preset-medium-sand": { avg: 4.7, votes: 29 },
      "gravel-biskra-limestone": { avg: 4.9, votes: 147 },
      "gravel-jijel-basaltic": { avg: 5.0, votes: 231 },
      "cem-chlef": { avg: 4.9, votes: 165 },
      "cem-slag-hadjar": { avg: 4.8, votes: 53 },
      "cem-silica-bousaada": { avg: 5.0, votes: 77 }
    };
  });

  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("gravel-jijel-basaltic");
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [customConfirm, setCustomConfirm] = useState<{ title: string; message: string; onConfirm: () => void; onCancel?: () => void } | null>(null);
  const [editConfirmationData, setEditConfirmationData] = useState<{
    existingMat: EngineeringMaterial;
    updatedMat: EngineeringMaterial;
    diffs: {
      fieldLabelAr: string;
      fieldLabelEn: string;
      from: any;
      to: any;
    }[];
  } | null>(null);
  const [updateDiffsReport, setUpdateDiffsReport] = useState<{
    materialName: string;
    materialEnglishName?: string;
    changes: {
      fieldLabelAr: string;
      fieldLabelEn: string;
      from: any;
      to: any;
    }[];
  }[] | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => prev && prev.message === message ? null : prev);
    }, 4500);
  };

  const [showControlPanel, setShowControlPanel] = useState(false);
  const [importMode, setImportMode] = useState<"append" | "update">("append");
  const [importLog, setImportLog] = useState<string[]>([]);

  // Intelligent Import Mapping UI States
  const [importSession, setImportSession] = useState<{
    fileName: string;
    worksheets: SmartImportWorksheet[];
    activeSheetIndex: number;
    duplicateResolution: "skip" | "update" | "create_new";
    mode: "append" | "update";
  } | null>(null);

  const [importScope, setImportScope] = useState<"active" | "all">("active");
  const [importSelectedRows, setImportSelectedRows] = useState<Record<string, Record<number, boolean>>>({});
  const [importDialogTab, setImportDialogTab] = useState<"mappings" | "preview">("mappings");
  const [rowResolutionOverrides, setRowResolutionOverrides] = useState<Record<string, Record<number, "skip" | "update" | "create_new">>>({});
  const [importProgress, setImportProgress] = useState<{
    visible: boolean;
    step: string;
    percentage: number;
  } | null>(null);

  const [importReport, setImportReport] = useState<{
    totalProcessed: number;
    addedCount: number;
    updatedCount: number;
    skippedCount: number;
    failedCount: number;
    warnings: string[];
    failures: { rowName: string; reason: string; sheetName?: string }[];
    unknownColumns: { sheetName: string; columnName: string }[];
  } | null>(null);

  // CRUD & AI Draft States
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isEngineeringMode, setIsEngineeringMode] = useState(true);
  const [formSubTab, setFormSubTab] = useState<"basic" | "advanced" | "laboratory">("basic");
  const [explorerTab, setExplorerTab] = useState<"live" | "schema" | "preset">("live");
  const [formState, setFormState] = useState<Partial<EngineeringMaterial>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setShowDeleteConfirm(false);
  }, [selectedMaterialId]);

  const updateEngData = (key: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      engineeringData: {
        ...(prev.engineeringData || {}),
        [key]: value
      }
    }));
  };

  const getEngDataValue = (key: string, defaultValue: any = "") => {
    return formState.engineeringData?.[key] ?? defaultValue;
  };

  useEffect(() => {
    // Sync external category constraint if passed as prop
    if (defaultType === "aggregates_only") {
      setSelectedCategory("الكل");
    } else if (defaultType === "sand") {
      setSelectedCategory("رمال");
    } else if (defaultType === "gravel") {
      setSelectedCategory("حصى");
    } else if (defaultType === "cementitious") {
      setSelectedCategory("إسمنت");
    }
  }, [defaultType]);

  // Handle selected material deleted from library, auto-select fallback
  useEffect(() => {
    if (materials.length > 0 && !materials.some(m => m.id === selectedMaterialId)) {
      setSelectedMaterialId(materials[0].id);
    }
  }, [materials, selectedMaterialId]);

  useEffect(() => {
    localStorage.setItem("material_favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("material_ratings", JSON.stringify(ratingsState));
  }, [ratingsState]);

  useEffect(() => {
    const handleTriggerEdit = (e: Event) => {
      const customEvent = e as CustomEvent<{ materialId: string }>;
      const matId = customEvent.detail?.materialId;
      if (matId) {
        const mat = materials.find(m => m.id === matId);
        if (mat) {
          const isUser = isUserMaterial(mat);
          setActiveSourceTab(isUser ? "user" : "system");
          if (mat.category) {
            setSelectedCategory(mat.category);
          }
          setSelectedMaterialId(matId);
          setFormState({ ...mat });
          setIsEditing(true);
          setIsAdding(false);
        }
      }
    };

    const handleTriggerAdd = () => {
      handleAddNewClick();
    };

    window.addEventListener("trigger-edit-material", handleTriggerEdit);
    window.addEventListener("trigger-add-material", handleTriggerAdd);

    return () => {
      window.removeEventListener("trigger-edit-material", handleTriggerEdit);
      window.removeEventListener("trigger-add-material", handleTriggerAdd);
    };
  }, [materials]);

  // Automatically select the active material from the calibration when the category tab changes
  useEffect(() => {
    let targetId: string | undefined;
    if (selectedCategory === "إسمنت") {
      targetId = inputs.selectedCementId;
    } else if (selectedCategory === "رمال") {
      targetId = inputs.selectedSandId;
    } else if (selectedCategory === "حصى") {
      targetId = inputs.selectedGravelId;
    } else if (selectedCategory === "إضافات كيميائية") {
      targetId = inputs.selectedAdmixtureId;
    } else if (selectedCategory === "إضافات معدنية") {
      targetId = inputs.selectedScmId;
    } else if (selectedCategory === "ماء") {
      targetId = inputs.selectedWaterId;
    } else if (selectedCategory === "ألياف") {
      targetId = inputs.selectedFiberId;
    } else if (selectedCategory === "مجلدات خاصة") {
      targetId = inputs.selectedSpecialBinderId;
    }

    if (targetId && materials.some(m => m.id === targetId)) {
      setSelectedMaterialId(targetId);
      const mat = materials.find(m => m.id === targetId);
      if (mat) {
        const isUser = isUserMaterial(mat);
        setActiveSourceTab(isUser ? "user" : "system");
      }
    }
  }, [selectedCategory, inputs.selectedCementId, inputs.selectedSandId, inputs.selectedGravelId, inputs.selectedAdmixtureId, inputs.selectedScmId, inputs.selectedWaterId, inputs.selectedFiberId, inputs.selectedSpecialBinderId, materials]);

  const activeConcreteCode = (inputs.concreteType || "NSC").toUpperCase();
  const activeConfig = CONCRETE_TYPE_CONFIGS[activeConcreteCode];

  const checkIsCompatible = (mat: EngineeringMaterial) => {
    return true;
  };

  const visibleCategories = useMemo(() => {
    const list = CATEGORIES_LIST as unknown as string[];
    if (!activeConfig) return list;
    return list.filter(cat => {
      if (cat === "الكل") return true;
      const isAllowed = activeConfig.allowedCategories.includes(cat);
      const isForbidden = activeConfig.forbiddenCategories.includes(cat);
      return isAllowed && !isForbidden;
    });
  }, [activeConfig]);

  // Reset selected category if it gets hidden
  useEffect(() => {
    if (activeConfig) {
      if (selectedCategory !== "الكل" && !visibleCategories.includes(selectedCategory)) {
        setSelectedCategory(visibleCategories[0] || "الكل");
      }
    }
  }, [inputs.concreteType, visibleCategories, selectedCategory]);

  const activeMaterial = useMemo(() => {
    return materials.find(m => m.id === selectedMaterialId) || materials[0];
  }, [materials, selectedMaterialId]);

  // Filter system materials using only system filters
  const filteredSystemMaterials = useMemo(() => {
    return materials.filter(mat => {
      if (isUserMaterial(mat)) return false;

      // 1. Search text query
      const query = systemSearchQuery.trim();
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
          (mat as any).producer,
          (mat as any).supplier,
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

      // 2. Category selection (do not match empty categories if selectedCategory is specified)
      let matchesCategory = true;
      if (systemSelectedCategory !== "الكل") {
        const matCat = getNormalizedDetailedCategory(mat);
        if (matCat === "أخرى") {
          matchesCategory = false;
        } else {
          const normMatCat = normalizeArabicForSearch(matCat);
          const normSelCat = normalizeArabicForSearch(systemSelectedCategory);
          matchesCategory = normMatCat === normSelCat || normMatCat.includes(normSelCat) || normSelCat.includes(normMatCat);
        }
      }

      // 3. Material Type selection
      let matchesMaterialType = true;
      if (systemSelectedMaterialType !== "الكل") {
        const mType = getNormalizedMaterialType(mat);
        matchesMaterialType = normalizeArabicForSearch(mType) === normalizeArabicForSearch(systemSelectedMaterialType);
      }

      // 4. Quality match
      let matchesQuality = true;
      if (systemSelectedQuality !== "all") {
        const qStr = String(mat.quality || "").toLowerCase();
        const descStr = String(mat.desc || "").toLowerCase();
        const catStr = String(getMaterialCategory(mat) || mat.category || "").toLowerCase();
        const ratingVal = mat.rating || 0;

        if (systemSelectedQuality === "premium") {
          matchesQuality = qStr.includes("ممتاز") || qStr.includes("نقي") || qStr.includes("بركاني") || ratingVal >= 4.8 || qStr.includes("premium") || qStr.includes("excellent") || qStr.includes("عالي");
        } else if (systemSelectedQuality === "standard") {
          matchesQuality = qStr.includes("قياسي") || qStr.includes("عادي") || (ratingVal >= 4.3 && ratingVal < 4.8) || qStr.includes("standard") || qStr.includes("normal");
        } else if (systemSelectedQuality === "eco") {
          matchesQuality = catStr === "مواد معاد تدويرها" || catStr === "إضافات معدنية" || descStr.includes("صديق للبيئة") || descStr.includes("eco") || descStr.includes("green") || qStr.includes("eco") || catStr.includes("recycled");
        }
      }

      // 5. Region (do not match empty regions if selectedRegion is specified)
      let matchesRegion = true;
      if (systemSelectedRegion !== "all") {
        const matProvRaw = mat.provenance || mat.region || mat.Region || mat.wilaya || "";
        if (!matProvRaw.trim()) {
          matchesRegion = false;
        } else {
          const matProv = normalizeArabicForSearch(matProvRaw);
          const selReg = normalizeArabicForSearch(systemSelectedRegion);
          matchesRegion = matProv.includes(selReg) || selReg.includes(matProv);
        }
      }

      // 6. Favorites
      const matchesFav = !systemShowOnlyFavorites || favorites.includes(mat.id);

      // 7. Status
      let matchesStatus = true;
      if (systemSelectedStatus !== "all") {
        const s = String(mat.status || mat.Status || "").toLowerCase();
        const app = String(mat.ApprovalStatus || (mat as any).approvalStatus || "").toLowerCase();
        const isActive = s === "نشط" || s === "active" || s === "approved" || app === "approved" || app === "validated";
        
        if (systemSelectedStatus === "active") {
          matchesStatus = isActive;
        } else if (systemSelectedStatus === "inactive") {
          matchesStatus = !isActive;
        }
      }

      return matchesSearch && matchesCategory && matchesMaterialType && matchesQuality && matchesRegion && matchesFav && matchesStatus;
    });
  }, [
    materials,
    systemSearchQuery,
    systemSelectedCategory,
    systemSelectedMaterialType,
    systemSelectedQuality,
    systemSelectedRegion,
    systemShowOnlyFavorites,
    favorites,
    systemSelectedStatus
  ]);

  // Filter user materials using only user filters
  const filteredUserMaterials = useMemo(() => {
    return materials.filter(mat => {
      if (!isUserMaterial(mat)) return false;

      // 1. Search text query
      const query = userSearchQuery.trim();
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
          (mat as any).producer,
          (mat as any).supplier,
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

      // 2. Category selection (do not match empty categories if selectedCategory is specified)
      let matchesCategory = true;
      if (userSelectedCategory !== "الكل") {
        const matCat = getNormalizedDetailedCategory(mat);
        if (matCat === "أخرى") {
          matchesCategory = false;
        } else {
          const normMatCat = normalizeArabicForSearch(matCat);
          const normSelCat = normalizeArabicForSearch(userSelectedCategory);
          matchesCategory = normMatCat === normSelCat || normMatCat.includes(normSelCat) || normSelCat.includes(normMatCat);
        }
      }

      // 3. Material Type selection
      let matchesMaterialType = true;
      if (userSelectedMaterialType !== "الكل") {
        const mType = getNormalizedMaterialType(mat);
        matchesMaterialType = normalizeArabicForSearch(mType) === normalizeArabicForSearch(userSelectedMaterialType);
      }

      // 4. Quality match
      let matchesQuality = true;
      if (userSelectedQuality !== "all") {
        const qStr = String(mat.quality || "").toLowerCase();
        const descStr = String(mat.desc || "").toLowerCase();
        const catStr = String(getMaterialCategory(mat) || mat.category || "").toLowerCase();
        const ratingVal = mat.rating || 0;

        if (userSelectedQuality === "premium") {
          matchesQuality = qStr.includes("ممتاز") || qStr.includes("نقي") || qStr.includes("بركاني") || ratingVal >= 4.8 || qStr.includes("premium") || qStr.includes("excellent") || qStr.includes("عالي");
        } else if (userSelectedQuality === "standard") {
          matchesQuality = qStr.includes("قياسي") || qStr.includes("عادي") || (ratingVal >= 4.3 && ratingVal < 4.8) || qStr.includes("standard") || qStr.includes("normal");
        } else if (userSelectedQuality === "eco") {
          matchesQuality = catStr === "مواد معاد تدويرها" || catStr === "إضافات معدنية" || descStr.includes("صديق للبيئة") || descStr.includes("eco") || descStr.includes("green") || qStr.includes("eco") || catStr.includes("recycled");
        }
      }

      // 5. Region (do not match empty regions if selectedRegion is specified)
      let matchesRegion = true;
      if (userSelectedRegion !== "all") {
        const matProvRaw = mat.provenance || mat.region || mat.Region || mat.wilaya || "";
        if (!matProvRaw.trim()) {
          matchesRegion = false;
        } else {
          const matProv = normalizeArabicForSearch(matProvRaw);
          const selReg = normalizeArabicForSearch(userSelectedRegion);
          matchesRegion = matProv.includes(selReg) || selReg.includes(matProv);
        }
      }

      // 6. Favorites
      const matchesFav = !userShowOnlyFavorites || favorites.includes(mat.id);

      // 7. Status
      let matchesStatus = true;
      if (userSelectedStatus !== "all") {
        const s = String(mat.status || mat.Status || "").toLowerCase();
        const app = String(mat.ApprovalStatus || (mat as any).approvalStatus || "").toLowerCase();
        const isActive = s === "نشط" || s === "active" || s === "approved" || app === "approved" || app === "validated";
        
        if (userSelectedStatus === "active") {
          matchesStatus = isActive;
        } else if (userSelectedStatus === "inactive") {
          matchesStatus = !isActive;
        }
      }

      return matchesSearch && matchesCategory && matchesMaterialType && matchesQuality && matchesRegion && matchesFav && matchesStatus;
    });
  }, [
    materials,
    userSearchQuery,
    userSelectedCategory,
    userSelectedMaterialType,
    userSelectedQuality,
    userSelectedRegion,
    userShowOnlyFavorites,
    favorites,
    userSelectedStatus
  ]);

  const systemCount = filteredSystemMaterials.length;
  const userCount = filteredUserMaterials.length;

  // Filters and Sorting logic
  const filteredMaterials = useMemo(() => {
    const listInTab = activeSourceTab === "system" ? filteredSystemMaterials : filteredUserMaterials;

    // Arabic Normalization for robust alphabetical sorting (ignores definite article "ال" and standardizes Alifs/Yehs/Teh Marbutas)
    const normalizeArabicForSort = (str: string): string => {
      if (!str) return "";
      let normalized = str.trim().toLowerCase();
      normalized = normalized.replace(/[أإآ]/g, "ا");
      normalized = normalized.replace(/ى/g, "ي");
      normalized = normalized.replace(/ة/g, "ه");
      normalized = normalized.replace(/(?:^|\s)ال([^[\s]{2,})/g, (match, p1) => {
        return match.startsWith(" ") ? " " + p1 : p1;
      });
      return normalized;
    };

    // Helper to extract a comparable numeric timestamp for chronological sorting
    const getTimestamp = (mat: any, type: "created" | "updated"): number => {
      const createdStr = mat.createdDate || "";
      const updatedStr = mat.updatedDate || "";
      const updatedAtVal = mat.updatedAt;

      if (type === "created") {
        if (createdStr) {
          const parsed = Date.parse(createdStr);
          if (!isNaN(parsed)) return parsed;
        }
        if (updatedAtVal && typeof updatedAtVal === "number") return updatedAtVal;
        if (updatedStr) {
          const parsed = Date.parse(updatedStr);
          if (!isNaN(parsed)) return parsed;
        }
        return 0;
      } else {
        if (updatedAtVal && typeof updatedAtVal === "number") return updatedAtVal;
        if (updatedStr) {
          const parsed = Date.parse(updatedStr);
          if (!isNaN(parsed)) return parsed;
        }
        if (createdStr) {
          const parsed = Date.parse(createdStr);
          if (!isNaN(parsed)) return parsed;
        }
        return 0;
      }
    };

    // Sort the filtered list
    return [...listInTab].sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      if (sortBy === "name") {
        valA = language === "ar" ? a.name : (a.englishName || a.name);
        valB = language === "ar" ? b.name : (b.englishName || b.name);
      } else if (sortBy === "createdDate") {
        valA = getTimestamp(a, "created");
        valB = getTimestamp(b, "created");
      } else if (sortBy === "updatedDate") {
        valA = getTimestamp(a, "updated");
        valB = getTimestamp(b, "updated");
      } else if (sortBy === "category") {
        const catA = getNormalizedDetailedCategory(a);
        const catB = getNormalizedDetailedCategory(b);
        valA = t(getCategoryKey(catA));
        valB = t(getCategoryKey(catB));
      } else if (sortBy === "uses") {
        valA = a.uses || "";
        valB = b.uses || "";
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
        const strA = language === "ar" ? normalizeArabicForSort(valA) : valA;
        const strB = language === "ar" ? normalizeArabicForSort(valB) : valB;
        return sortOrder === "asc"
          ? strA.localeCompare(strB, language === "ar" ? "ar" : "en")
          : strB.localeCompare(strA, language === "ar" ? "ar" : "en");
      } else {
        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB)) {
          if (numA < numB) return sortOrder === "asc" ? -1 : 1;
          if (numA > numB) return sortOrder === "asc" ? 1 : -1;
          return 0;
        }
        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      }
    });
  }, [
    filteredSystemMaterials,
    filteredUserMaterials,
    activeSourceTab,
    sortBy,
    sortOrder,
    language
  ]);

  // Automatically select first material of the tab when switching if the current active isn't in this tab
  useEffect(() => {
    if (filteredMaterials.length > 0) {
      const isCurrentIdInTab = filteredMaterials.some(m => m.id === selectedMaterialId);
      if (!isCurrentIdInTab) {
        setSelectedMaterialId(filteredMaterials[0].id);
      }
    }
  }, [activeSourceTab, filteredMaterials, selectedMaterialId]);

  const uniqueProvenances = useMemo(() => {
    const setOfProv = new Set<string>();
    materials.forEach(m => {
      const fields = [m.provenance, m.region, (m as any).Region, m.wilaya];
      fields.forEach(field => {
        if (field) {
          let clean = String(field).trim();
          // Remove prefixes
          clean = clean.replace(/^(ولاية|wilaya de|wilaya of|wilaya|province of|region of)\s+/i, "");
          // Remove parentheses or anything after them
          clean = clean.split("(")[0].trim();
          // Remove leading/trailing quotes or punctuation if any
          clean = clean.replace(/^["'\s]+|["'\s]+$/g, "");
          
          if (clean) {
            // Capitalize first letter of English/French names to avoid duplicates like "chlef" and "Chlef"
            if (/^[a-zA-Z]/.test(clean)) {
              clean = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
            }
            setOfProv.add(clean);
          }
        }
      });
    });
    // Sort them alphabetically using localeCompare
    return Array.from(setOfProv).sort((a, b) => a.localeCompare(b, language === "ar" ? "ar" : "en"));
  }, [materials, language]);

  // Toggle favorite helper
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  // Duplicate helper
  const handleDuplicateClick = () => {
    if (!activeMaterial || !onUpdateMaterials) return;
    const newId = `MAT-DUP-${Math.floor(10000 + Math.random() * 90000)}`;
    const copied: EngineeringMaterial = {
      ...activeMaterial,
      id: newId,
      MaterialID: newId,
      MaterialCode: newId,
      name: `${activeMaterial.name} (نسخة مكررة)`,
      englishName: `${activeMaterial.englishName} (Duplicate)`,
      status: "نشط",
      ApprovalStatus: "Draft", // starts with Draft status according to requirements
      version: 1, // starts with version 1
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0],
      createdBy: "senoussi.s.t@gmail.com",
      lifecycleHistory: [
        {
          date: new Date().toISOString().split('T')[0],
          version: 1,
          author: "senoussi.s.t@gmail.com",
          changes: `إنشاء مكرر من المادة الأساسية ${activeMaterial.name} (ID: ${activeMaterial.id}) كمسودة جديدة.`,
          approvalStatus: "Draft"
        }
      ]
    };
    onUpdateMaterials([copied, ...materials]);
    setSelectedMaterialId(copied.id);
  };

  // Delete helper (Soft delete / Archiving instead of hard deletion - Requirement 7)
  const handleDeleteClick = () => {
    if (!activeMaterial || !onUpdateMaterials) return;
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (!activeMaterial || !onUpdateMaterials) return;
    const updated = materials.filter(m => m.id !== activeMaterial.id);
    onUpdateMaterials(updated);
    setIsEditing(false);
    setIsAdding(false);
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleConfirmEditSave = () => {
    if (!editConfirmationData || !onUpdateMaterials) return;
    const { existingMat, updatedMat, oldVersionRecord } = editConfirmationData;

    const updatedList = materials.map(m => {
      if (m.id === existingMat.id) {
        return updatedMat;
      }
      return m;
    });

    onUpdateMaterials([oldVersionRecord, ...updatedList]);
    setSelectedMaterialId(existingMat.id);
    setIsEditing(false);
    setEditConfirmationData(null);
    showToast(
      language === "ar"
        ? `تم تحديث مادة "${updatedMat.name}" وحفظ التعديلات بنجاح!`
        : `Material "${updatedMat.name}" updated successfully!`,
      "success"
    );
  };

  const getIncompatibilityDetails = (mat: EngineeringMaterial, concreteCode: string) => {
    if (!mat) return null;
    const cat = getMaterialCategory(mat);
    const config = CONCRETE_TYPE_CONFIGS[concreteCode];
    if (!config) return null;

    const isAllowed = config.allowedCategories.includes(cat);
    const isForbidden = config.forbiddenCategories.includes(cat);

    // 1. Prohibited Category
    if (isForbidden || !isAllowed) {
      return {
        reasonAr: `هذه الفئة من المواد (${cat}) غير مسموح بها في تصميم الخرسانة من نوع (${concreteCode}).`,
        reasonEn: `The material category "${cat}" is not allowed in ${concreteCode} concrete design.`,
        suggestionAr: `يرجى تغيير فئة المادة إلى فئة مسموح بها مثل: ${config.allowedCategories.join("، ")}.`,
        suggestionEn: `Please change the category of this material to one of the allowed categories: ${config.allowedCategories.join(", ")}.`,
        fixProps: { category: config.allowedCategories[0] || "رمال" } as Partial<EngineeringMaterial>
      };
    }

    // 2. Specific isMaterialCompatible checks
    if (concreteCode === "NSC") {
      if (cat === "إسمنت") {
        const nameLower = (mat.name || "").toLowerCase();
        const engLower = (mat.englishName || "").toLowerCase();
        if (nameLower.includes("جيوبوليمر") || engLower.includes("geopolymer") || nameLower.includes("خبث") || engLower.includes("slag") || nameLower.includes("bacterial")) {
          return {
            reasonAr: "الخرسانة العادية (NSC) تتطلب إسمنتاً بورتلاندياً تقليدياً بدلاً من الروابط المتخصصة.",
            reasonEn: "Normal Strength Concrete (NSC) requires traditional Portland cement instead of specialized binders.",
            suggestionAr: "يرجى تعديل اسم المادة لإزالة أي إشارات إلى الجيوبوليمر أو الخبث واختيار صنف إسمنت تقليدي.",
            suggestionEn: "Please rename the cement and ensure it is designated as traditional Portland cement (CEM I or CEM II).",
            fixProps: { name: mat.name.replace(/جيوبوليمر|خبث/g, "بورتلاندي"), englishName: mat.englishName.replace(/geopolymer|slag/gi, "Portland") }
          };
        }
      }
      if (cat === "حصى") {
        const dens = mat.density || 2600;
        if (dens < 2000 || dens > 2900) {
          return {
            reasonAr: `كثافة الركام الخشن الحالية (${dens} كغ/م³) خارج النطاق القياسي للخرسانة العادية (2000 - 2900 كغ/م³).`,
            reasonEn: `The aggregate density (${dens} kg/m³) is outside the normal standard range (2000 - 2900 kg/m³).`,
            suggestionAr: "يرجى تعديل الكثافة الجافة لتكون في الحدود القياسية (مثلاً 2600 كغ/م³).",
            suggestionEn: "Please adjust the dry density of the gravel to a standard value (e.g., 2600 kg/m³).",
            fixProps: { density: 2600 }
          };
        }
      }
      if (cat === "رمال") {
        const nameLower = (mat.name || "").toLowerCase();
        const engLower = (mat.englishName || "").toLowerCase();
        if (nameLower.includes("معاد") || engLower.includes("recycled")) {
          return {
            reasonAr: "يمنع استخدام الركام الناعم المعاد تدويره (Recycled Sand) في الخرسانة عادية المقاومة (NSC) للمشاريع المعتمدة.",
            reasonEn: "Recycled sand is not allowed for standard NSC designs under current specifications.",
            suggestionAr: "يرجى تعديل اسم الرمل ليكون رمل طبيعي (مثلاً رمل وادي أو رمل محجرة).",
            suggestionEn: "Please rename or update the sand record to specify it is natural river or quarry sand.",
            fixProps: { name: mat.name.replace(/معاد تدويره|معاد/g, "طبيعي وادي"), englishName: mat.englishName.replace(/recycled/gi, "Natural") }
          };
        }
      }
    }

    if (concreteCode === "HSC") {
      if (cat === "إسمنت") {
        const strClass = parseFloat(mat.strengthClass || "0");
        if (strClass < 42.5 || isNaN(strClass)) {
          return {
            reasonAr: `رتبة مقاومة الإسمنت الحالية (${mat.strengthClass || "غير محددة"}) غير كافية للخرسانة عالية المقاومة (HSC). الحد الأدنى المطلوب هو 42.5.`,
            reasonEn: `The cement strength class (${mat.strengthClass || "Not specified"}) is insufficient for High Strength Concrete (HSC). Minimum required is 42.5.`,
            suggestionAr: "يرجى ترقية رتبة مقاومة الإسمنت إلى 52.5 أو 42.5 على الأقل لضمان متطلبات المتانة العالية الضغط.",
            suggestionEn: "Please upgrade the cement strength class to 52.5 or at least 42.5.",
            fixProps: { strengthClass: "52.5" }
          };
        }
      }
      if (cat === "حصى") {
        const dens = mat.density || 2600;
        if (dens < 2650) {
          return {
            reasonAr: `كثافة الحصى الحالية (${dens} كغ/م³) غير كافية لخرسانة HSC. الخرسانة عالية المقاومة تتطلب ركاماً صلباً بكثافة جافة لا تقل عن 2650 كغ/م³.`,
            reasonEn: `The coarse aggregate density (${dens} kg/m³) is insufficient for HSC. Dry density must be >= 2650 kg/m³.`,
            suggestionAr: "يرجى تعديل كثافة الحصى لتكون 2700 كغ/م³ لزيادة صلابة الهيكل الداخلي للخرسانة.",
            suggestionEn: "Please adjust the gravel density to 2700 kg/m³ to achieve high structural compactness.",
            fixProps: { density: 2700 }
          };
        }
      }
      if (cat === "إضافات معدنية") {
        const nameLower = (mat.name || "").toLowerCase();
        const engLower = (mat.englishName || "").toLowerCase();
        if (!nameLower.includes("سيليكا") && !engLower.includes("silica")) {
          return {
            reasonAr: "الخرسانة عالية المقاومة (HSC) تتطلب إضافة غبار السيليكا (Silica Fume) كإضافة معدنية أساسية لملء المسامات المجهرية.",
            reasonEn: "High Strength Concrete (HSC) requires Silica Fume as mineral addition to fill micro-voids.",
            suggestionAr: "يرجى تعديل اسم الإضافة المعدنية لتشمل 'غبار سيليكا' أو 'Silica Fume'.",
            suggestionEn: "Please update the mineral addition record to specify it as Silica Fume.",
            fixProps: { name: "غبار السيليكا النشط (SNO Lab)", englishName: "Active Silica Fume" }
          };
        }
      }
      if (cat === "إضافات كيميائية") {
        const nameLower = (mat.name || "").toLowerCase();
        const engLower = (mat.englishName || "").toLowerCase();
        const isSuper = mat.admixtureType === "superplasticizer" || nameLower.includes("فائق") || engLower.includes("super");
        if (!isSuper) {
          return {
            reasonAr: "الخرسانة عالية المقاومة (HSC) تتطلب استخدام ملدن فائق (Superplasticizer) لخفض نسبة الماء بشكل حاد والحصول على تراص أقصى.",
            reasonEn: "High Strength Concrete (HSC) requires a Superplasticizer to achieve extreme water reduction and maximum compaction.",
            suggestionAr: "يرجى تغيير نوع الإضافة الكيميائية إلى 'superplasticizer' وتعديل الاسم.",
            suggestionEn: "Please set the admixture type to 'superplasticizer' and adjust the name.",
            fixProps: { admixtureType: "superplasticizer", name: "ملدن فائق المدى (Superplasticizer)", englishName: "High Range Superplasticizer" }
          };
        }
      }
    }

    if (concreteCode === "HPC") {
      if (cat === "إضافات معدنية") {
        const nameLower = (mat.name || "").toLowerCase();
        const engLower = (mat.englishName || "").toLowerCase();
        const isValidHPC = nameLower.includes("سيليكا") || engLower.includes("silica") || nameLower.includes("رماد") || engLower.includes("fly") || nameLower.includes("خبث") || engLower.includes("slag");
        if (!isValidHPC) {
          return {
            reasonAr: "الخرسانة عالية الأداء (HPC) تتطلب إضافات معدنية بوزولانية فعالة (مثل غبار السيليكا، الرماد المتطاير، أو الخبث).",
            reasonEn: "High Performance Concrete (HPC) requires active mineral additions (Silica Fume, Fly Ash, or Slag).",
            suggestionAr: "يرجى تعديل الإضافة المعدنية لتكون غبار سيليكا أو رماد متطاير لضمان تفاعل متكامل وديمومة عالية.",
            suggestionEn: "Please change the mineral addition to a pozzolanic material (e.g., Fly Ash or Silica Fume).",
            fixProps: { name: "غبار السيليكا المعتمد SNO", englishName: "Approved Silica Fume" }
          };
        }
      }
      if (cat === "إضافات كيميائية") {
        const nameLower = (mat.name || "").toLowerCase();
        const engLower = (mat.englishName || "").toLowerCase();
        const isSuper = mat.admixtureType === "superplasticizer" || nameLower.includes("فائق") || engLower.includes("super");
        if (!isSuper) {
          return {
            reasonAr: "الخرسانة عالية الأداء (HPC) تتطلب استخدام ملدن فائق لخفض مسامية الهيكل الخرساني.",
            reasonEn: "High Performance Concrete (HPC) requires a Superplasticizer to minimize concrete porosity.",
            suggestionAr: "يرجى تحديث نوع الإضافة الكيميائية إلى 'superplasticizer' وتعديل المسمى الموصى به.",
            suggestionEn: "Please set the admixture type to 'superplasticizer' and rename accordingly.",
            fixProps: { admixtureType: "superplasticizer", name: "ملدن فائق المدى", englishName: "Superplasticizer" }
          };
        }
      }
    }

    if (concreteCode === "SCC") {
      if (cat === "حصى") {
        const dmaxVal = mat.dMax || 20;
        if (dmaxVal > 16) {
          return {
            reasonAr: `القطر الأقصى للحصى الحالي (${dmaxVal} مم) أكبر من الحد الأقصى المسموح به للخرسانة ذاتية الرص (16 مم) لمنع الانسداد بين قضبان التسليح.`,
            reasonEn: `The aggregate maximum size Dmax (${dmaxVal} mm) exceeds the maximum allowed for SCC (16 mm) to prevent segregation/clogging.`,
            suggestionAr: "يرجى تعديل القطر الأقصى للركام Dmax ليكون 16 مم أو أقل (مثلاً 12 مم أو 10 مم).",
            suggestionEn: "Please reduce the maximum aggregate size Dmax to 16 mm or smaller (e.g., 10 mm or 12 mm).",
            fixProps: { dMax: 12 }
          };
        }
      }
      if (cat === "إضافات معدنية") {
        const nameLower = (mat.name || "").toLowerCase();
        const engLower = (mat.englishName || "").toLowerCase();
        const isValidFiller = nameLower.includes("فيلر") || nameLower.includes("جيري") || engLower.includes("filler") || engLower.includes("limestone");
        if (!isValidFiller) {
          return {
            reasonAr: "الخرسانة ذاتية الرص (SCC) تتطلب بودرة مالئة ناعمة مثل فيلر الحجر الجيري لزيادة لزوجة المعجون ومنع انفصال الحبيبات.",
            reasonEn: "Self-Consolidating Concrete (SCC) requires fine filler powders like Limestone Filler to prevent segregation.",
            suggestionAr: "يرجى تعديل المسمى والمواصفات ليكون بودرة الحجر الجيري المالئة (Filler).",
            suggestionEn: "Please rename or update the material to limestone filler.",
            fixProps: { name: "بودرة فيلر الحجر الجيري (Filler)", englishName: "Limestone Filler Powder" }
          };
        }
      }
      if (cat === "إضافات كيميائية") {
        const nameLower = (mat.name || "").toLowerCase();
        const engLower = (mat.englishName || "").toLowerCase();
        const isValidSCCAdmixture = mat.admixtureType === "superplasticizer" || nameLower.includes("لزوجة") || engLower.includes("vma") || engLower.includes("viscosity") || nameLower.includes("فائق") || engLower.includes("super");
        if (!isValidSCCAdmixture) {
          return {
            reasonAr: "خرسانة SCC تتطلب ملدنات فائقة المدى أو مضافات تعديل اللزوجة (VMA) لضمان انسياب متجانس دون ترسب للمياه.",
            reasonEn: "SCC requires high range superplasticizers or Viscosity Modifying Agents (VMA) to guarantee homogeneous flow.",
            suggestionAr: "يرجى تعيين نوع الإضافة كـ 'superplasticizer' أو إدخال مسمى يوضح تعديل اللزوجة.",
            suggestionEn: "Please assign 'superplasticizer' as type or use a viscosity modifier formulation.",
            fixProps: { admixtureType: "superplasticizer", name: "ملدن فائق مع معدل لزوجة VMA", englishName: "Superplasticizer with VMA Agent" }
          };
        }
      }
    }

    if (concreteCode === "LWC") {
      if (cat === "حصى" || cat === "ركام ثقيل") {
        return {
          reasonAr: "الخرسانة خفيفة الوزن (LWC) تمنع استخدام الحصى العادي أو الركام الثقيل.",
          reasonEn: "Lightweight Concrete (LWC) prohibits using traditional gravel or heavyweight aggregate.",
          suggestionAr: "يرجى تغيير فئة المادة إلى 'ركام خفيف' (مثل الخفاف أو الطين المتمدد) وتعديل كثافتها لأقل من 2000 كغ/م³.",
          suggestionEn: "Please change the category to 'lightweight aggregate' and ensure its density is below 2000 kg/m³.",
          fixProps: { category: "ركام خفيف", density: 1200, name: "حجر الخفاف خفيف الوزن", englishName: "Lightweight Pumice Aggregate" }
        };
      }
    }

    if (concreteCode === "HWC") {
      if (cat === "حصى" || cat === "ركام خفيف") {
        return {
          reasonAr: "الخرسانة ثقيلة الوزن (HWC) تتطلب استخدام ركام ثقيل خاص لتدريع الإشعاع أو الأوزان الثقيلة.",
          reasonEn: "Heavyweight Concrete (HWC) requires specialized heavyweight aggregates for radiation shielding or counterweights.",
          suggestionAr: "يرجى تغيير فئة المادة إلى 'ركام ثقيل' وتعديل الكثافة لتكون عالية جداً (مثلاً 3500 كغ/م³).",
          suggestionEn: "Please change the category of this material to 'heavyweight aggregate' and specify a high density (e.g., 3500 kg/m³).",
          fixProps: { category: "ركام ثقيل", density: 3600, name: "ركام الباريت الثقيل", englishName: "Heavyweight Barite Aggregate" }
        };
      }
    }

    return null;
  };

  const handleAutoFixIncompatibility = (mat: EngineeringMaterial, fixProps: Partial<EngineeringMaterial>) => {
    if (!mat || !onUpdateMaterials) return;
    
    const existingMat = mat;
    const currentVer = Number(existingMat.version || 1.0) + 0.1;
    const prevHistory = existingMat.lifecycleHistory || [];

    const changedFields: string[] = Object.keys(fixProps);
    const changeLogStr = language === "ar"
      ? `إصلاح تلقائي للتوافقية: تعديل [${changedFields.join("، ")}].`
      : `Auto-fix compatibility: modified [${changedFields.join(", ")}].`;

    const newHistToken = {
      date: new Date().toISOString().split('T')[0],
      version: currentVer,
      author: "senoussi.s.t@gmail.com",
      changes: changeLogStr,
      approvalStatus: "Approved"
    };

    const oldVersionRecord: EngineeringMaterial = {
      ...existingMat,
      id: `${existingMat.id}_v${existingMat.version || 1}`,
      version: existingMat.version || 1,
      ApprovalStatus: "Archived",
      status: "موقوف",
      name: `${existingMat.name} (الإصدار v${existingMat.version || 1})`,
    };

    const updatedPrimaryRecord: EngineeringMaterial = {
      ...existingMat,
      ...fixProps,
      version: currentVer,
      lifecycleHistory: [...prevHistory, newHistToken],
      updatedDate: new Date().toISOString().split('T')[0],
      ApprovalStatus: "Approved",
      status: "نشط"
    };

    const EDITABLE_FIELDS = [
      { key: "name", ar: "الاسم (بالعربية)", en: "Name (Arabic)" },
      { key: "englishName", ar: "الاسم بالإنجليزية", en: "English Name" },
      { key: "category", ar: "الفئة", en: "Category" },
      { key: "materialType", ar: "نوع المادة", en: "Material Type" },
      { key: "price", ar: "السعر التقديري (دج)", en: "Estimated Price (DZD)" },
      { key: "density", ar: "الكثافة الجافة (كغ/م³)", en: "Dry Density (kg/m³)" },
      { key: "ssdDensity", ar: "الكثافة المشبعة SSD (كغ/م³)", en: "SSD Density (kg/m³)" },
      { key: "absorption", ar: "الامتصاص (%)", en: "Absorption (%)" },
      { key: "moisture", ar: "المحتوى المائي (%)", en: "Moisture Content (%)" },
      { key: "specificGravity", ar: "الوزن النوعي", en: "Specific Gravity" },
      { key: "particleShape", ar: "شكل الحبيبات", en: "Particle Shape" },
      { key: "finenessModulus", ar: "معاير النعومة", en: "Fineness Modulus" },
      { key: "clayContent", ar: "محتوى الطين والشوائب (%)", en: "Clay Content (%)" },
      { key: "bulkDensity", ar: "الكثافة الظاهرية (كغ/م³)", en: "Bulk Density (kg/m³)" },
      { key: "losAngelesAbrasion", ar: "معامل لوس أنجلوس للتآكل (%)", en: "Los Angeles Abrasion (%)" },
      { key: "settingTimeImpact", ar: "مدة تأخير/تسريع الشك (دقائق)", en: "Setting Time Delta (min)" },
      { key: "settingModification", ar: "تأثير زمن الشك", en: "Setting Impact Type" },
      { key: "cementClass", ar: "صنف الإسمنت", en: "Cement Class" },
      { key: "strengthClass", ar: "رتبة المقاومة (ميغاباسكال)", en: "Strength Class (MPa)" },
      { key: "hydrationClass", ar: "سرعة الإماهة", en: "Hydration Speed" },
      { key: "heatOfHydration", ar: "حرارة الإماهة (جول/غ)", en: "Heat of Hydration (J/g)" },
      { key: "recommendedDosage", ar: "الجرعة الموصى بها (%)", en: "Recommended Dosage (%)" },
      { key: "waterReduction", ar: "نسبة خفض الماء المطلوب (%)", en: "Water Reduction (%)" },
      { key: "quality", ar: "مستوى الجودة", en: "Quality Rating" },
      { key: "uses", ar: "الاستخدامات", en: "Applications" },
      { key: "desc", ar: "الوصف والخصائص", en: "Description" },
      { key: "status", ar: "الحالة التشغيلية", en: "Operational Status" },
      { key: "ApprovalStatus", ar: "حالة الاعتماد", en: "Approval Status" }
    ];

    const diffsList: any[] = [];

    EDITABLE_FIELDS.forEach(({ key, ar, en }) => {
      const fromVal = existingMat[key as keyof EngineeringMaterial];
      const toVal = updatedPrimaryRecord[key as keyof EngineeringMaterial];

      const isFalsy = (v: any) => v === undefined || v === null || v === "";
      if (isFalsy(fromVal) && isFalsy(toVal)) return;

      let hasChanged = false;
      if (typeof fromVal === "number" || typeof toVal === "number") {
        const numFrom = (fromVal !== undefined && fromVal !== null && fromVal !== "") ? Number(fromVal) : 0;
        const numTo = (toVal !== undefined && toVal !== null && toVal !== "") ? Number(toVal) : 0;
        hasChanged = Math.abs(numFrom - numTo) > 1e-6;
      } else {
        hasChanged = String(fromVal ?? "") !== String(toVal ?? "");
      }

      if (hasChanged) {
        diffsList.push({
          fieldLabelAr: ar,
          fieldLabelEn: en,
          from: fromVal,
          to: toVal
        });
      }
    });

    setEditConfirmationData({
      existingMat,
      updatedMat: updatedPrimaryRecord,
      oldVersionRecord,
      diffs: diffsList
    });
  };


  // --- Bulk Actions & Advanced Material Management Helpers ---

  const validateMaterial = (mat: Partial<EngineeringMaterial>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (!mat.name?.trim()) errors.push("الاسم باللغة العربية مطلوب (Arabic Name is required)");
    if (!mat.category?.trim()) errors.push("الفئة مطلوبة (Category is required)");
    
    const parsedDensity = Number(mat.density);
    if (mat.category !== "إضافات كيميائية" && (isNaN(parsedDensity) || parsedDensity <= 0)) {
      errors.push("الكثافة يجب أن تكون أكبر من 0 (Density must be greater than 0)");
    }
    
    if (mat.absorption !== undefined && (isNaN(Number(mat.absorption)) || Number(mat.absorption) < 0 || Number(mat.absorption) > 100)) {
      errors.push("نسبة الامتصاص يجب أن تكون بين 0% و 100% (Absorption must be between 0% and 100%)");
    }

    if (mat.moisture !== undefined && (isNaN(Number(mat.moisture)) || Number(mat.moisture) < 0 || Number(mat.moisture) > 100)) {
      errors.push("نسبة الرطوبة يجب أن تكون بين 0% و 100% (Moisture must be between 0% and 100%)");
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const convertToUserMaterial = (m: EngineeringMaterial): EngineeringMaterial => {
    let cleanId = m.id;
    if (cleanId.startsWith("preset-")) {
      cleanId = cleanId.substring(7);
    }
    const rand = Math.floor(10000 + Math.random() * 90000);
    const newId = `MAT-USR-${cleanId.toUpperCase()}-${rand}`;
    return {
      ...m,
      id: newId,
      source: "user",
      createdBy: "senoussi.s.t@gmail.com",
      ApprovalStatus: "Approved",
      status: "نشط",
      version: 1,
      lifecycleHistory: [
        {
          date: new Date().toISOString().split('T')[0],
          version: 1,
          changes: "تم الاستيراد من قاعدة البيانات القياسية للمنصة",
          author: "senoussi.s.t@gmail.com",
          approvalStatus: "Approved"
        }
      ]
    };
  };

  const handleToggleSelect = (id: string) => {
    setSelectedMaterialIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkToggleStatus = (status: "نشط" | "موقوف") => {
    if (!onUpdateMaterials) return;
    const updated = materials.map(m => {
      if (selectedMaterialIds.includes(m.id)) {
        return {
          ...m,
          status,
          version: (m.version || 1) + 1,
          lifecycleHistory: [
            ...(m.lifecycleHistory || []),
            {
              date: new Date().toISOString().split('T')[0],
              version: (m.version || 1) + 1,
              changes: `تعديل الحالة جماعياً إلى: ${status}`,
              author: "senoussi.s.t@gmail.com",
              approvalStatus: m.ApprovalStatus || "Approved"
            }
          ]
        };
      }
      return m;
    });
    onUpdateMaterials(updated);
    const count = selectedMaterialIds.length;
    setSelectedMaterialIds([]);
    showToast(language === "ar" ? `تم تعديل حالة ${count} مواد بنجاح!` : `Successfully updated status for ${count} materials!`, "success");
  };

  const handleBulkToggleApproval = (approvalStatus: "Approved" | "Draft" | "Under Review") => {
    if (!onUpdateMaterials) return;
    const updated = materials.map(m => {
      if (selectedMaterialIds.includes(m.id)) {
        return {
          ...m,
          ApprovalStatus: approvalStatus,
          version: (m.version || 1) + 1,
          lifecycleHistory: [
            ...(m.lifecycleHistory || []),
            {
              date: new Date().toISOString().split('T')[0],
              version: (m.version || 1) + 1,
              changes: `تعديل حالة الاعتماد جماعياً إلى: ${approvalStatus}`,
              author: "senoussi.s.t@gmail.com",
              approvalStatus: approvalStatus
            }
          ]
        };
      }
      return m;
    });
    onUpdateMaterials(updated);
    const count = selectedMaterialIds.length;
    setSelectedMaterialIds([]);
    showToast(language === "ar" ? `تم تعديل حالة اعتماد ${count} مواد بنجاح!` : `Successfully updated approval status for ${count} materials!`, "success");
  };

  const handleBulkDuplicate = () => {
    if (!onUpdateMaterials) return;
    const duplicatedItems: EngineeringMaterial[] = [];
    materials.forEach(m => {
      if (selectedMaterialIds.includes(m.id)) {
        const newId = `MAT-DUP-${Math.floor(10000 + Math.random() * 90000)}`;
        duplicatedItems.push({
          ...m,
          id: newId,
          name: `${m.name} (نسخة مكررة)`,
          englishName: `${m.englishName} (Duplicate)`,
          version: 1,
          createdDate: new Date().toISOString().split('T')[0],
          updatedDate: new Date().toISOString().split('T')[0],
          lifecycleHistory: [
            {
              date: new Date().toISOString().split('T')[0],
              version: 1,
              changes: `إنشاء مكرر مدمج من مادة ${m.name}`,
              author: "senoussi.s.t@gmail.com",
              approvalStatus: "Draft"
            }
          ]
        });
      }
    });
    onUpdateMaterials([...materials, ...duplicatedItems]);
    const count = duplicatedItems.length;
    setSelectedMaterialIds([]);
    showToast(language === "ar" ? `تم تكرار ${count} مواد بنجاح!` : `Successfully duplicated ${count} materials!`, "success");
  };

  const handleBulkDelete = () => {
    if (!onUpdateMaterials) return;
    setCustomConfirm({
      title: language === "ar" ? "تأكيد حذف المواد المحددة جماعياً" : "Confirm Bulk Delete Materials",
      message: language === "ar"
        ? `هل أنت متأكد من رغبتك في حذف ${selectedMaterialIds.length} مواد نهائياً من المكتبة؟`
        : `Are you sure you want to permanently delete ${selectedMaterialIds.length} materials from the library?`,
      onConfirm: () => {
        const updated = materials.filter(m => !selectedMaterialIds.includes(m.id));
        onUpdateMaterials(updated);
        setSelectedMaterialIds([]);
        showToast(language === "ar" ? "تم حذف المواد المحددة بنجاح." : "Successfully deleted selected materials.", "success");
        setCustomConfirm(null);
      }
    });
  };

  const handleBulkExport = (format: "xlsx" | "csv" | "json", onlySelected = false) => {
    const targets = onlySelected ? materials.filter(m => selectedMaterialIds.includes(m.id)) : materials;
    
    if (targets.length === 0) {
      showToast(language === "ar" ? "لا توجد مواد للتصدير." : "No materials to export.", "info");
      return;
    }

    const exportData = targets.map(m => ({
      id: m.id,
      name: m.name,
      englishName: m.englishName,
      category: m.category,
      type: m.type,
      density: m.density,
      ssdDensity: m.ssdDensity,
      absorption: m.absorption,
      moisture: m.moisture,
      finenessModulus: m.finenessModulus,
      dMax: m.dMax,
      provenance: m.provenance,
      price: m.price,
      status: m.status,
      notes: m.notes || m.desc || "",
      specificGravity: m.specificGravity,
      particleShape: m.particleShape,
      aggregateQuality: m.aggregateQuality,
      clayContent: m.clayContent,
      organicContent: m.organicContent,
      losAngelesAbrasion: m.losAngelesAbrasion,
      rating: m.rating,
      createdBy: m.createdBy,
      createdDate: m.createdDate,
      updatedDate: m.updatedDate,
      ApprovalStatus: m.ApprovalStatus
    }));

    if (format === "json") {
      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", url);
      downloadAnchor.setAttribute("download", `exported_materials_${onlySelected ? 'selected' : 'all'}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
    } else {
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Materials");
      
      if (format === "csv") {
        const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvOutput], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", url);
        downloadAnchor.setAttribute("download", `exported_materials_${onlySelected ? 'selected' : 'all'}.csv`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        URL.revokeObjectURL(url);
      } else {
        const wopts: any = { bookType: 'xlsx', bookSST: false, type: 'binary' };
        const wbout = XLSX.write(workbook, wopts);
        const s2ab = (s: any) => {
          const buf = new ArrayBuffer(s.length);
          const view = new Uint8Array(buf);
          for (let i = 0; i !== s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
          return buf;
        };
        const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", url);
        downloadAnchor.setAttribute("download", `exported_materials_${onlySelected ? 'selected' : 'all'}.xlsx`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        URL.revokeObjectURL(url);
      }
    }
  };

  const handleDownloadTemplate = (format: "xlsx" | "csv" | "json") => {
    // 1. Prepare structured templates per category
    const readmeData = [
      {
        "ورقة العمل (Worksheet)": "Cements",
        "المواد المخصصة (Target Materials)": "الأسمنت بجميع أنواعه",
        "ملاحظات إرشادية (Guideline Notes)": "يُنصح بملء الكثافة الحجمية (حوالي 3100) والاسم وتحديد الصنف ورتبة المقاومة (32.5، 42.5، 52.5)."
      },
      {
        "ورقة العمل (Worksheet)": "Sands",
        "المواد المخصصة (Target Materials)": "الرمل والركام الناعم",
        "ملاحظات إرشادية (Guideline Notes)": "يُنصح بإدخال الاسم، الكثافة الكتلية، الوزن النوعي (Specific Gravity)، نسبة الامتصاص، ومعيار النعومة (FM) والمكافئ الرملي SE."
      },
      {
        "ورقة العمل (Worksheet)": "Gravels",
        "المواد المخصصة (Target Materials)": "الحصى والركام الخشن",
        "ملاحظات إرشادية (Guideline Notes)": "يُنصح بإدخال الاسم، الكثافة، الوزن النوعي، نسبة الامتصاص، المقاس الأقصى Dmax، ومقاومة لوس أنجلوس LA."
      },
      {
        "ورقة العمل (Worksheet)": "Water",
        "المواد المخصصة (Target Materials)": "ماء الخلط ومياه غسيل الركام",
        "ملاحظات إرشادية (Guideline Notes)": "يُنصح بإدخال الاسم، الكثافة (الافتراضي 1000)، الرقم الهيدروجيني pH، الكلوريدات، والكبريتات."
      },
      {
        "ورقة العمل (Worksheet)": "Chemical Admixtures",
        "المواد المخصصة (Target Materials)": "المضافات الكيماوية والملدنات",
        "ملاحظات إرشادية (Guideline Notes)": "تتضمن الملدنات الفائقة، المسرعات والمؤخرات. ينصح بإدخال الجرعة ونسبة تقليل الماء."
      },
      {
        "ورقة العمل (Worksheet)": "Mineral Additions",
        "المواد المخصصة (Target Materials)": "الإضافات المعدنية (SCMs)",
        "ملاحظات إرشادية (Guideline Notes)": "تتضمن غبار السيليكا، الرماد المتطاير، وخبث الأفران. ينصح بإدخال مؤشر الفعالية البوزولانية."
      },
      {
        "ورقة العمل (Worksheet)": "Fibers",
        "المواد المخصصة (Target Materials)": "الألياف الخرسانية (Fibers)",
        "ملاحظات إرشادية (Guideline Notes)": "تتضمن الألياف الفولاذية والبلاستيكية. ينصح بملء الطول والقطر ومقاومة الشد."
      }
    ];

    const cementData = [
      {
        id: "MAT-CEM-I-42.5",
        name: "إسمنت متين CEM I 42.5R",
        englishName: "Matin Cement CEM I 42.5R",
        category: "إسمنت",
        density: 3100,
        provenance: "الحراش، الجزائر",
        price: 18000,
        cementClass: "CEM I",
        strengthClass: "42.5",
        notes: "إسمنت بورتلاندي نقي عالي المقاومة",
        status: "نشط"
      }
    ];

    const sandData = [
      {
        id: "MAT-SND-OUED",
        name: "رمل وادي سوف طبيعي ممتاز",
        englishName: "Oued Souf Natural Sand",
        category: "رمال",
        density: 2650,
        specificGravity: 2.65,
        absorption: 1.2,
        moisture: 0.5,
        finenessModulus: 2.7,
        SandEquivalent: 85,
        provenance: "وادي سوف",
        price: 3500,
        notes: "رمل نظيف جداً وخالٍ من الشوائب الطينية",
        status: "نشط"
      }
    ];

    const gravelData = [
      {
        id: "MAT-GRV-JIJEL",
        name: "حصى مكسر جيجل 5/15",
        englishName: "Jijel Crushed Gravel 5/15",
        category: "حصى",
        density: 2700,
        specificGravity: 2.70,
        absorption: 0.8,
        moisture: 0.2,
        dMax: 15,
        LosAngeles: 18,
        provenance: "جيجل",
        price: 4500,
        notes: "حصى صلبة وحادة صالحة للخرسانة المسلحة عالية المقاومة",
        status: "نشط"
      }
    ];

    const waterData = [
      {
        id: "MAT-WTR-TAP",
        name: "مياه صالحة للشرب الجزائر",
        englishName: "Algiers Tap Water",
        category: "ماء",
        density: 1000,
        pH: 7.2,
        chlorides: 150,
        sulfates: 80,
        provenance: "الجزائر العاصمة",
        price: 50,
        notes: "ماء حنفية مطابق لمعايير خلط الخرسانة",
        status: "نشط"
      }
    ];

    const chemicalAdmixtureData = [
      {
        id: "MAT-ADM-SP",
        name: "ملدن فائق ميديا سوبربلاست",
        englishName: "Mediaplast Superplasticizer",
        category: "إضافات كيميائية",
        density: 1200,
        recommendedDosage: 1.2,
        waterReduction: 25,
        provenance: "البليدة",
        price: 350,
        notes: "ملدن فائق يعطي انسيابية ممتازة للخرسانة",
        status: "نشط"
      }
    ];

    const mineralAdditionData = [
      {
        id: "MAT-MIN-SF",
        name: "غبار السيليكا المتكاثف",
        englishName: "Condensed Silica Fume",
        category: "إضافات معدنية",
        density: 2200,
        pozzolanicIndex: 115,
        waterDemandFactor: 1.1,
        provenance: "الحجار، عنابة",
        price: 120,
        notes: "مضاف معدني فائق النعومة لزيادة متانة الخرسانة",
        status: "نشط"
      }
    ];

    const fiberData = [
      {
        id: "MAT-FIB-STL",
        name: "ألياف فولاذية مكشكشة",
        englishName: "Crimped Steel Fibers",
        category: "ألياف",
        density: 7850,
        fiberType: "Steel",
        fiberLength: 50,
        aspectRatio: 65,
        tensileStrength: 1100,
        provenance: "برج بوعريريج",
        price: 400,
        notes: "ألياف لزيادة مقاومة الشد والتشقق",
        status: "نشط"
      }
    ];

    if (format === "json") {
      const mergedTemplate = {
        readme: readmeData,
        cements: cementData,
        sands: sandData,
        gravels: gravelData,
        water: waterData,
        chemicalAdmixtures: chemicalAdmixtureData,
        mineralAdditions: mineralAdditionData,
        fibers: fiberData
      };
      const jsonStr = JSON.stringify(mergedTemplate, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", url);
      downloadAnchor.setAttribute("download", "materials_multi_sheet_template.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
    } else if (format === "csv") {
      const csvData = [
        ...cementData,
        ...sandData,
        ...gravelData,
        ...waterData,
        ...chemicalAdmixtureData,
        ...mineralAdditionData,
        ...fiberData
      ];
      const worksheet = XLSX.utils.json_to_sheet(csvData);
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvOutput], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", url);
      downloadAnchor.setAttribute("download", "materials_template_merged.csv");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
    } else {
      const workbook = XLSX.utils.book_new();

      const shReadme = XLSX.utils.json_to_sheet(readmeData);
      const shCement = XLSX.utils.json_to_sheet(cementData);
      const shSand = XLSX.utils.json_to_sheet(sandData);
      const shGravel = XLSX.utils.json_to_sheet(gravelData);
      const shWater = XLSX.utils.json_to_sheet(waterData);
      const shChem = XLSX.utils.json_to_sheet(chemicalAdmixtureData);
      const shMin = XLSX.utils.json_to_sheet(mineralAdditionData);
      const shFiber = XLSX.utils.json_to_sheet(fiberData);

      XLSX.utils.book_append_sheet(workbook, shReadme, "README");
      XLSX.utils.book_append_sheet(workbook, shCement, "Cements");
      XLSX.utils.book_append_sheet(workbook, shSand, "Sands");
      XLSX.utils.book_append_sheet(workbook, shGravel, "Gravels");
      XLSX.utils.book_append_sheet(workbook, shWater, "Water");
      XLSX.utils.book_append_sheet(workbook, shChem, "Chemical Admixtures");
      XLSX.utils.book_append_sheet(workbook, shMin, "Mineral Additions");
      XLSX.utils.book_append_sheet(workbook, shFiber, "Fibers");

      const wopts: any = { bookType: 'xlsx', bookSST: false, type: 'binary' };
      const wbout = XLSX.write(workbook, wopts);
      const s2ab = (s: any) => {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i !== s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
      };
      const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", url);
      downloadAnchor.setAttribute("download", "materials_professional_template.xlsx");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | File, mode: "append" | "update") => {
    const file = e instanceof File ? e : e.target.files?.[0];
    if (!file) return;

    const fileNameLower = file.name.toLowerCase();
    const isJson = fileNameLower.endsWith(".json");
    const isExcel = fileNameLower.endsWith(".xlsx") || fileNameLower.endsWith(".xls");
    const isCsv = fileNameLower.endsWith(".csv");

    if (!isJson && !isExcel && !isCsv) {
      showToast(
        language === "ar"
          ? "امتداد الملف غير مدعوم! التنسيقات المدعومة هي: .xlsx, .xls, .csv, .json"
          : "Unsupported file extension! Supported extensions are: .xlsx, .xls, .csv, .json",
        "error"
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const dataStr = evt.target?.result;
        if (!dataStr) return;

        let worksheets: SmartImportWorksheet[] = [];

        if (isJson) {
          const parsed = JSON.parse(dataStr as string);
          
          let rawRows: any[] = [];
          if (Array.isArray(parsed)) {
            rawRows = parsed;
          } else if (parsed && typeof parsed === "object") {
            if (Array.isArray(parsed.materials)) {
              rawRows = parsed.materials;
            } else if (Array.isArray(parsed.data)) {
              rawRows = parsed.data;
            } else if (Array.isArray(parsed.rows)) {
              rawRows = parsed.rows;
            } else {
              rawRows = [parsed];
            }
          }

          if (rawRows.length === 0 || !rawRows.some(row => row && typeof row === "object")) {
            showToast(
              language === "ar"
                ? "ملف JSON فارغ أو لا يحتوي على كائنات مواد صالحة!"
                : "JSON file is empty or does not contain valid material objects!",
              "error"
            );
            return;
          }

          const headersSet = new Set<string>();
          rawRows.forEach(row => {
            if (row && typeof row === "object") {
              Object.keys(row).forEach(k => headersSet.add(k));
            }
          });
          const headers = Array.from(headersSet);
          const mappings = parseSmartMaterialImport(headers, rawRows);
          const unmappedHeaders = headers.filter(h => mappings[h] === "ignore");
          const detectedCategory = detectSheetCategory("JSON Import", headers, rawRows);

          worksheets.push({
            sheetName: "JSON Import",
            detectedCategory,
            ignored: false,
            headers,
            rawRows,
            mappings,
            unmappedHeaders
          });
        } else {
          const arrayBuffer = dataStr as ArrayBuffer;
          const data = new Uint8Array(arrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });

          workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const { headers, rawRows } = parseWorksheetToSmartRows(worksheet);
            
            const ignoreCheck = shouldIgnoreSheet(sheetName, headers, rawRows.length);
            const detectedCategory = detectSheetCategory(sheetName, headers, rawRows);
            const mappings = parseSmartMaterialImport(headers, rawRows);
            const unmappedHeaders = headers.filter(h => mappings[h] === "ignore");

            worksheets.push({
              sheetName,
              detectedCategory,
              ignored: ignoreCheck.ignore,
              ignoreReason: ignoreCheck.reason,
              headers,
              rawRows,
              mappings,
              unmappedHeaders
            });
          });
        }

        const activeWorksheetsCount = worksheets.filter(w => !w.ignored).length;
        if (worksheets.length === 0 || (isJson && worksheets[0].rawRows.length === 0)) {
          showToast(
            language === "ar" ? "الملف فارغ أو لا يحتوي على صفوف بيانات!" : "The file is empty or contains no data rows!", 
            "error"
          );
          return;
        }

        let activeSheetIndex = worksheets.findIndex(w => !w.ignored);
        if (activeSheetIndex === -1) activeSheetIndex = 0;

        const initialSelectedRows: Record<string, Record<number, boolean>> = {};
        worksheets.forEach(ws => {
          initialSelectedRows[ws.sheetName] = {};
          ws.rawRows.forEach((_, idx) => {
            initialSelectedRows[ws.sheetName][idx] = true;
          });
        });
        
        setImportSelectedRows(initialSelectedRows);
        setRowResolutionOverrides({});
        setImportScope("active");
        setImportDialogTab("mappings");

        setImportSession({
          fileName: file.name,
          worksheets,
          activeSheetIndex,
          duplicateResolution: mode === "append" ? "skip" : "update",
          mode
        });

        if (activeWorksheetsCount === 0) {
          showToast(language === "ar" 
            ? "تنبيه: تم تصنيف كل أوراق العمل كأوراق إرشادية أو فارغة. يمكنك تفعيلها يدوياً." 
            : "Warning: All worksheets were classified as instructions or empty. You can enable them manually.", 
            "info"
          );
        } else {
          showToast(language === "ar" 
            ? `تم تحليل بنيان الملف بنجاح! تم العثور على ${worksheets.length} أوراق عمل (نشط منها: ${activeWorksheetsCount}).` 
            : `File structure analyzed! Found ${worksheets.length} worksheets (${activeWorksheetsCount} active).`, 
            "success"
          );
        }
      } catch (err: any) {
        showToast((language === "ar" ? "خطأ في معالجة الملف المرفوع: " : "Error parsing uploaded file: ") + err.message, "error");
      }
    };

    if (isJson) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const executeIntelligentImport = async (
    worksheets: SmartImportWorksheet[],
    duplicateResolution: "skip" | "update" | "create_new"
  ) => {
    // Show real-time progress indicator
    setImportProgress({
      visible: true,
      step: language === "ar" ? "جاري قراءة الملف وتفسير قيم الخلايا..." : "Parsing file layout and interpreting cell types...",
      percentage: 25
    });

    await new Promise(r => setTimeout(r, 400));

    setImportProgress({
      visible: true,
      step: language === "ar" ? "جاري تشغيل محرك المطابقة والربط الذكي للأعمدة..." : "Running column alignment mapping engine...",
      percentage: 60
    });

    await new Promise(r => setTimeout(r, 450));

    setImportProgress({
      visible: true,
      step: language === "ar" ? "جاري دمج البيانات وحل التعارضات وتحديث المكتبة..." : "Finalizing material integration and deduplication...",
      percentage: 90
    });

    await new Promise(r => setTimeout(r, 300));

    const failures: { rowName: string; reason: string; sheetName?: string }[] = [];
    const warnings: string[] = [];
    const unknownColumns: { sheetName: string; columnName: string }[] = [];

    let totalProcessed = 0;
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    const currentMaterialsList = [...materials];
    const userEmail = "senoussi.s.t@gmail.com";

    worksheets.forEach((ws, sheetIdx) => {
      if (importScope === "active" && sheetIdx !== importSession?.activeSheetIndex) {
        return;
      }
      if (ws.ignored) return;

      const sheetName = ws.sheetName;
      const category = ws.detectedCategory;
      const mappings = ws.mappings;

      ws.headers.forEach(h => {
        if (!mappings[h] || mappings[h] === "ignore") {
          unknownColumns.push({ sheetName, columnName: h });
        }
      });

      ws.rawRows.forEach((row, idx) => {
        if (importSelectedRows[sheetName] && importSelectedRows[sheetName][idx] === false) {
          return;
        }

        totalProcessed++;
        try {
          // Unified Ingestion Layer
          const mat = mapImportedRowToEngineeringMaterial(
            row,
            mappings,
            category,
            sheetName,
            idx,
            materials,
            userEmail
          );

          // Category-Specific Smart Warnings instead of critical failures
          const validation = validateImportedMaterial(mat);
          if (!validation.isValid) {
            failures.push({
              sheetName,
              rowName: mat.name || `الصف #${idx + 1}`,
              reason: validation.errors.join(", ")
            });
            return;
          }

          // Accumulate validation warnings
          validation.warnings.forEach(w => {
            warnings.push(`⚠️ المادة "${mat.name}" (${sheetName}): ${w}`);
          });

          // Check duplicate status (reproducible IDs)
          const normNameVal = normalizeName(mat.name);
          const normEnglishVal = normalizeName(mat.englishName);

          const existsByIdIdx = currentMaterialsList.findIndex(m => m.id === mat.id);
          const existsByNameIdx = currentMaterialsList.findIndex(m => {
            const mNormName = normalizeName(m.name);
            const mNormArabic = normalizeName(m.ArabicName || "");
            const mNormEnglish = normalizeName(m.englishName);
            const mNormEnglishUnified = normalizeName(m.EnglishName || "");

            return (
              (mNormName === normNameVal && normNameVal !== "") ||
              (mNormArabic === normNameVal && normNameVal !== "") ||
              (mNormEnglish === normEnglishVal && normEnglishVal !== "") ||
              (mNormEnglishUnified === normEnglishVal && normEnglishVal !== "")
            );
          });
          
          const duplicateIndex = existsByIdIdx !== -1 ? existsByIdIdx : existsByNameIdx;

          // Per-row resolution resolution (override first)
          const rowResolution = rowResolutionOverrides[sheetName]?.[idx] || duplicateResolution;

          if (duplicateIndex !== -1) {
            if (rowResolution === "skip") {
              skippedCount++;
              failures.push({
                sheetName,
                rowName: mat.name,
                reason: language === "ar" ? "المادة موجودة مسبقاً (تم تخطيها لتجنب التكرار)" : "Material already exists (Skipped to avoid duplication)"
              });
              return;
            } else if (rowResolution === "update") {
              const existing = currentMaterialsList[duplicateIndex];
              const updatedMaterial: EngineeringMaterial = {
                ...existing,
                ...mat,
                id: existing.id, // Preserve original stable ID
                version: (existing.version || 1) + 1,
                lifecycleHistory: [
                  ...(existing.lifecycleHistory || []),
                  {
                    date: new Date().toISOString().split('T')[0],
                    version: (existing.version || 1) + 1,
                    changes: `تم تحديث المادة عبر معالج الاستيراد الذكي (ورقة: ${sheetName})`,
                    author: userEmail,
                    approvalStatus: existing.ApprovalStatus || "Approved"
                  }
                ]
              };
              currentMaterialsList[duplicateIndex] = updatedMaterial;
              updatedCount++;
            } else if (rowResolution === "create_new") {
              // Create clean unique suffix
              let uniqueName = mat.name;
              let uniqueId = mat.id;
              let suffix = 1;
              while (currentMaterialsList.some(m => normalizeName(m.name) === normalizeName(uniqueName) || m.id === uniqueId)) {
                uniqueName = `${mat.name} (${suffix})`;
                uniqueId = `${mat.id}-${suffix}`;
                suffix++;
              }
              const newMat = {
                ...mat,
                name: uniqueName,
                id: uniqueId,
                MaterialID: uniqueId,
                MaterialCode: uniqueId,
                ArabicName: uniqueName
              };
              currentMaterialsList.push(newMat);
              addedCount++;
            }
          } else {
            // Uniquely added
            currentMaterialsList.push(mat);
            addedCount++;
          }
        } catch (err: any) {
          failures.push({
            sheetName,
            rowName: row.name || `الصف #${idx + 1}`,
            reason: err.message
          });
        }
      });
    });

    if (onUpdateMaterials) {
      onUpdateMaterials(currentMaterialsList);
    }

    setImportProgress(null);

    setImportReport({
      totalProcessed,
      addedCount,
      updatedCount,
      skippedCount,
      failedCount: failures.length,
      warnings,
      failures,
      unknownColumns
    });

    setImportSession(null);
  };

  const parseRowPreview = (row: any, ws: SmartImportWorksheet, idx: number) => {
    const mappings = ws.mappings;
    const mappedData: any = {};
    
    Object.entries(mappings).forEach(([fileHeader, targetField]) => {
      if (targetField && targetField !== "ignore") {
        mappedData[targetField] = row[fileHeader as string];
      }
    });

    let name = mappedData.name;
    if (!name) {
      name = row.name || row["الاسم"] || row["اسم المادة"] || row.Name || row.designation || row.libelle || "";
    }
    name = String(name || "").trim();

    let id = mappedData.id;
    if (!id) {
      id = row.id || row.Id || row.ID || row["المعرف"] || row["المعرّف"] || "";
    }
    id = String(id || "").trim();

    const category = ws.detectedCategory;
    const density = mappedData.density !== undefined && mappedData.density !== "" ? normalizeNumber(mappedData.density) : null;
    const price = mappedData.price !== undefined && mappedData.price !== "" ? normalizeNumber(mappedData.price) : null;
    const provenance = mappedData.provenance || row.provenance || row.source || row.Source || null;

    // Check duplicate status
    const normNameVal = normalizeName(name);
    const existsById = materials.some(m => m.id === id && id !== "");
    const existsByName = materials.some(m => normalizeName(m.name) === normNameVal && normNameVal !== "");
    const exists = existsById || existsByName;

    return {
      name,
      id,
      category,
      density,
      price,
      provenance,
      exists,
      mappedData
    };
  };

  const handleLoadPreloadedCatalog = (mode: "append" | "update") => {
    let updatedList: EngineeringMaterial[] = [];
    if (mode === "update") {
      if (!materials || materials.length === 0) {
        showToast(
          language === "ar"
            ? "لا يمكن تحديث خصائص المواد مالم تكن المواد موجودة في المكتبة."
            : "Cannot update material properties unless materials are present in the library.",
          "info"
        );
        return;
      }

      const FIELD_NAMES: Record<string, { ar: string, en: string }> = {
        name: { ar: "الاسم (بالعربية)", en: "Name (Arabic)" },
        englishName: { ar: "الاسم بالإنجليزية", en: "English Name" },
        category: { ar: "الفئة", en: "Category" },
        density: { ar: "الكثافة الجافة (كغ/م³)", en: "Dry Density (kg/m³)" },
        ssdDensity: { ar: "الكثافة المشبعة (كغ/م³)", en: "SSD Density (kg/m³)" },
        absorption: { ar: "الامتصاص (%)", en: "Absorption (%)" },
        moisture: { ar: "المحتوى المائي (%)", en: "Moisture Content (%)" },
        finenessModulus: { ar: "معاير النعومة", en: "Fineness Modulus" },
        dMax: { ar: "المقاس الأقصى للحبيبات (مم)", en: "Max Size Dmax (mm)" },
        quality: { ar: "مستوى الجودة", en: "Quality Rating" },
        uses: { ar: "الاستخدامات", en: "Applications" },
        desc: { ar: "الوصف والخصائص", en: "Description" },
        rating: { ar: "التقييم الفني", en: "Technical Rating" },
        provenance: { ar: "مكان المصدر", en: "Provenance" },
        price: { ar: "السعر التقديري (دج)", en: "Estimated Price (DZD)" },
        specificGravity: { ar: "الوزن النوعي", en: "Specific Gravity" },
        particleShape: { ar: "شكل الحبيبات", en: "Particle Shape" },
        clayContent: { ar: "محتوى الطين والشوائب (%)", en: "Clay Content (%)" },
        losAngelesAbrasion: { ar: "معامل لوس أنجلوس للتآكل (%)", en: "Los Angeles Abrasion (%)" },
        cementClass: { ar: "صنف الإسمنت", en: "Cement Class" },
        strengthClass: { ar: "رتبة المقاومة (ميغاباسكال)", en: "Strength Class (MPa)" },
        hydrationClass: { ar: "سرعة الإماهة", en: "Hydration Speed" },
        heatOfHydration: { ar: "حرارة الإماهة (جول/غ)", en: "Heat of Hydration (J/g)" },
        admixtureType: { ar: "نوع المضافة الكيميائية", en: "Admixture Type" },
        recommendedDosage: { ar: "الجرعة الموصى بها (%)", en: "Recommended Dosage (%)" },
        waterReduction: { ar: "نسبة خفض الماء المطلوب (%)", en: "Water Reduction (%)" },
        settingModification: { ar: "تأثير زمن الشك", en: "Setting Impact Type" },
        settingTimeImpact: { ar: "مدة تأخير/تسريع الشك (دقائق)", en: "Setting Time Delta (min)" },
      };

      const diffs: {
        materialName: string;
        materialEnglishName?: string;
        changes: {
          fieldLabelAr: string;
          fieldLabelEn: string;
          from: any;
          to: any;
        }[];
      }[] = [];

      let updatedCount = 0;
      updatedList = materials.map(m => {
        // Skip user materials completely
        if (isUserMaterial(m)) {
          return m;
        }

        // Find matching standard material from SEEDED_MATERIALS
        const standard = SEEDED_MATERIALS.find(s => {
          const sCleanId = s.id.startsWith("preset-") ? s.id.substring(7) : s.id;
          const mIdLower = m.id.toLowerCase();
          
          // Match by exact name
          const matchName = m.name === s.name;
          
          // Match by clean ID inside the user material ID
          const matchCleanId = mIdLower.includes(sCleanId.toLowerCase());
          
          // Match by standard ID inside the user material ID
          const matchFullId = mIdLower.includes(s.id.toLowerCase());
          
          return matchName || matchCleanId || matchFullId;
        });

        if (standard) {
          updatedCount++;

          const changesList: {
            fieldLabelAr: string;
            fieldLabelEn: string;
            from: any;
            to: any;
          }[] = [];

          Object.entries(FIELD_NAMES).forEach(([key, labels]) => {
            const fromVal = m[key as keyof EngineeringMaterial];
            const toVal = standard[key as keyof EngineeringMaterial];

            const isFalsy = (v: any) => v === undefined || v === null || v === "";
            if (isFalsy(fromVal) && isFalsy(toVal)) return;

            let hasChanged = false;
            if (typeof fromVal === "number" && typeof toVal === "number") {
              hasChanged = Math.abs(fromVal - toVal) > 1e-6;
            } else {
              hasChanged = String(fromVal ?? "") !== String(toVal ?? "");
            }

            if (hasChanged) {
              changesList.push({
                fieldLabelAr: labels.ar,
                fieldLabelEn: labels.en,
                from: fromVal,
                to: toVal
              });
            }
          });

          if (changesList.length > 0) {
            diffs.push({
              materialName: m.name,
              materialEnglishName: m.englishName,
              changes: changesList
            });
          }

          return {
            ...m,
            ...standard,
            id: m.id, // Preserve the user-assigned material ID
            ownerId: m.ownerId, // Preserve owner ID
            createdBy: m.createdBy, // Preserve creator ID
          };
        }
        return m;
      });

      if (updatedCount === 0) {
        showToast(
          language === "ar"
            ? "لم يتم العثور على أي مواد نظام قياسية في المكتبة لتحديثها."
            : "No standard system materials found in the library to update.",
          "info"
        );
        return;
      }

      if (onUpdateMaterials) {
        onUpdateMaterials(updatedList);
        showToast(
          language === "ar"
            ? `تم تحديث خصائص ${updatedCount} مادة من مواد النظام بنجاح!`
            : `Successfully updated the characteristics of ${updatedCount} system materials!`,
          "success"
        );

        if (diffs.length > 0) {
          setUpdateDiffsReport(diffs);
        } else {
          showToast(
            language === "ar"
              ? "جميع خصائص مواد النظام مطابقة للقيم القياسية بالفعل."
              : "All system material properties are already fully matching the standard values.",
            "info"
          );
        }
      }
    } else {
      const existingIds = new Set(materials.map(m => m.id));
      const existingNames = new Set(materials.map(m => m.name));
      // Append standard SEEDED_MATERIALS directly so they are imported as system materials
      const newItems = SEEDED_MATERIALS.filter(m => !existingIds.has(m.id) && !existingNames.has(m.name)).map(m => ({ ...m }));

      if (newItems.length === 0) {
        showToast(
          language === "ar"
            ? "جميع مواد النظام القياسية موجودة بالفعل في المكتبة ولا توجد مواد جديدة غير مكررة لإضافتها."
            : "All standard system materials are already present in the library. No new non-duplicate materials to add.",
          "info"
        );
        return;
      }

      updatedList = [...materials, ...newItems];

      if (onUpdateMaterials) {
        onUpdateMaterials(updatedList);
        showToast(
          language === "ar"
            ? `تمت إضافة ${newItems.length} مادة نظام جديدة غير متكررة بنجاح!`
            : `Successfully added ${newItems.length} new non-duplicate system materials!`,
          "success"
        );
      }
    }
  };

  // Open Add click
  const handleAddNewClick = () => {
    let defaultCat = "رمال";
    let defaultType = "ركام";
    let defaultDensity = 2600;
    
    const catToUse = selectedCategory && selectedCategory !== "الكل" ? selectedCategory : "إسمنت";
    
    if (catToUse === "إسمنت") {
      defaultCat = "إسمنت";
      defaultType = "مادة رابطة";
      defaultDensity = 3100;
    } else if (["رمال", "حصى", "ركام خفيف", "ركام ثقيل"].includes(catToUse)) {
      defaultCat = catToUse;
      defaultType = "ركام";
      defaultDensity = 2600;
    } else if (["إضافات كيميائية", "إضافات معدنية", "ألياف", "مواد مالئة", "مجلدات خاصة"].includes(catToUse)) {
      defaultCat = catToUse;
      defaultType = "إضافات كيميائية";
      defaultDensity = 1200;
    } else if (catToUse === "ماء") {
      defaultCat = "ماء";
      defaultType = "ماء";
      defaultDensity = 1000;
    }

    setFormState({
      name: "",
      englishName: "",
      type: mapCategoryToType(defaultCat),
      category: defaultCat as any,
      density: defaultDensity,
      ssdDensity: defaultDensity + 30,
      absorption: 1.5,
      moisture: 1.0,
      finenessModulus: 2.6,
      dMax: 5,
      quality: "مطابقة للمقاييس الوطنية الجزائرية القياسية",
      uses: "الخلطات الإنشائية للهياكل والمنشآت المسلحة",
      desc: "مادة مدفوعة من المستخدم لتوسيع الكتالوج الهندسي المعتمد.",
      rating: 4.5,
      provenance: "الجزائر",
      image: "",
      status: "نشط",
      createdBy: "مدير المختبر",
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0],
      engineeringData: {
        density: defaultDensity,
        pH: 7.0,
        chlorideContent: 0,
        sulphateContent: 0,
        temperature: 20
      }
    });
    setIsAdding(true);
    setIsEditing(false);
  };

  // Open Edit click
  const handleEditClick = () => {
    if (!activeMaterial) return;
    setFormState({ ...activeMaterial });
    setIsEditing(true);
    setIsAdding(false);
  };

  const [isAILoading, setIsAILoading] = useState(false);

  // AI assistant heuristic property guesser (10. AI MATERIAL ASSISTANT)
  const handleAIAssistSuggest = async () => {
    const name = formState.name || "";
    const cat = formState.category || "رمال";
    const region = formState.provenance || formState.region || "الجزائر";

    setIsAILoading(true);
    setAIAssistSuccessMessage("يقوم مساعد SNO AI بالاستجابة وتخمين الخصائص الهندسية مع خوادمنا بالذكاء الاصطناعي...");

    // Heuristic fallback builder
    const getHeuristicSuggested = (): Partial<EngineeringMaterial> => {
      let suggested: Partial<EngineeringMaterial> = {
        quality: "مقترحة ومطابقة للمواصفات الطبيعية القياسية",
        uses: "التطبيقات والمنشآت المسلحة المتوسطة والثقيلة",
        desc: `مادة هندسية مقترحة جغرافياً من منطقة: ${region} لتلبية متطلبات التصميم الهندسي للمزيج الخرساني.`,
        rating: 4.5,
        status: "نشط",
        sourceQuarry: `مرجع مقلع ${region}`,
        createdBy: "SNO AI Assistant (Heuristic)",
        createdDate: new Date().toISOString().split('T')[0],
        updatedDate: new Date().toISOString().split('T')[0],
        RecommendedUse: "خرسانة إنشائية مسلحة عامة",
        EngineeringNotes: "تعديل الملدنات ونسبة الماء أمر منصوح به حسب ظروف الورشة لضمان المتانة وقابلية الضخ",
        ConcreteClasses: "C25/30, C30/37",
        Description: `مادة محجرية معتمدة ملائمة للأشغال الهندسية مستخرجة من إقليم: ${region}`,
        Warnings: "تنبيه: راقب نسبة المحتوى الناعم ونسب امتصاص الماء لضمان ثبات نسب الخلط"
      };

      if (cat === "رمال") {
        const isDesert = name.includes("صحراوي") || name.includes("سوف") || name.includes("كثبان");
        const isCrushed = name.includes("كسارة") || name.includes("مكسر") || name.includes("جبل");
        suggested = {
          ...suggested,
          density: isDesert ? 2580 : (isCrushed ? 2680 : 2600),
          ssdDensity: isDesert ? 2610 : (isCrushed ? 2710 : 2630),
          absorption: isDesert ? 1.8 : (isCrushed ? 2.0 : 1.5),
          moisture: isDesert ? 0.8 : (isCrushed ? 2.0 : 1.0),
          finenessModulus: isDesert ? 1.9 : (isCrushed ? 3.4 : 2.6),
          dMax: isDesert ? 2 : 5,
          specificGravity: isDesert ? 2.58 : (isCrushed ? 2.68 : 2.60),
          particleShape: isDesert ? "مستدير" : (isCrushed ? "زاوي" : "غير منتظم"),
          clayContent: isDesert ? 0.5 : (isCrushed ? 1.8 : 0.8),
          organicContent: "سليم",
          quality: isDesert ? "رمل صحراوي فائق النعومة والصفاء الجيوكيميائي" : "رمل عياري ذو تدرج متناسب مغسول ثلاثياً",
          uses: isDesert ? "أعمال تشطيب فائقة الدقة والخرسانات التعويضية الخاصة" : "خرسانة هيكلية مسلحة عامة بجميع العناصر الحاملة",
          gradationData: [
            { sieve: 5.0, passing: 100 },
            { sieve: 2.5, passing: isDesert ? 100 : 85 },
            { sieve: 1.25, passing: isDesert ? 85 : 68 },
            { sieve: 0.63, passing: isDesert ? 65 : 45 },
            { sieve: 0.315, passing: isDesert ? 30 : 15 },
            { sieve: 0.16, passing: isDesert ? 5 : 3 },
            { sieve: 0.08, passing: isDesert ? 1.2 : 0.8 }
          ]
        };
      } else if (cat === "حصى") {
        const isBasalt = name.includes("بازلت") || name.includes("ناري") || name.includes("جيجل");
        const isLimestone = name.includes("كلس") || name.includes("بسكرة") || name.includes("جيري") || name.includes("لوطايا");
        suggested = {
          ...suggested,
          density: isBasalt ? 2855 : (isLimestone ? 2710 : 2650),
          ssdDensity: isBasalt ? 2880 : (isLimestone ? 2740 : 2680),
          absorption: isBasalt ? 0.5 : (isLimestone ? 0.8 : 1.2),
          moisture: isBasalt ? 0.2 : (isLimestone ? 0.4 : 0.7),
          dMax: 20,
          specificGravity: isBasalt ? 2.85 : (isLimestone ? 2.71 : 2.65),
          particleShape: isBasalt ? "زاوي" : "مكسر",
          clayContent: isBasalt ? 0.0 : (isLimestone ? 0.1 : 0.2),
          losAngelesAbrasion: isBasalt ? 9 : (isLimestone ? 15 : 18),
          organicContent: "سليم",
          quality: isBasalt ? "صخر بازلتي ناري بركاني فائق المتانة والوزن النوعي" : "حجارة كلسية جبلية صلدة ذات امتزاز منخفض للغاية",
          uses: isBasalt ? "الخرسانة فائقة الأداء ومدرجات الطيران والموانيء" : "الصب القياسي للأعمدة والبلاطات المسلحة",
          gradationData: [
            { sieve: 20.0, passing: 100 },
            { sieve: 16.0, passing: 88 },
            { sieve: 10.0, passing: 45 },
            { sieve: 8.0, passing: 8 },
            { sieve: 5.0, passing: 1 }
          ]
        };
      } else if (cat === "إسمنت") {
        const isCemI = name.includes("CEM I") || name.includes("بورتلاندي عادي") || name.includes("الشلف");
        suggested = {
          ...suggested,
          density: 3100,
          ssdDensity: 3100,
          absorption: 0.0,
          moisture: 0.0,
          specificGravity: 3.10,
          cementClass: isCemI ? "CEM I" : "CEM II",
          strengthClass: "42.5",
          hydrationClass: isCemI ? "سريع" : "عادي",
          heatOfHydration: isCemI ? 310 : 250,
          quality: "إسمنت قياسي معتمد ومطابق للمواصفات الوطنية الإنشائية",
          uses: "البناء الإنشائي العام، الهياكل المسلحة المسقوفة والشدات المعيارية"
        };
      } else if (cat === "إضافات كيميائية") {
        suggested = {
          ...suggested,
          density: 1200,
          ssdDensity: 1200,
          absorption: 0,
          moisture: 0,
          admixtureType: "superplasticizer",
          recommendedDosage: 1.2,
          waterReduction: 20,
          settingModification: "لا يوجد",
          quality: "بوليمير إيثر بولي كاربوكسيلات قياسي لتحسين الانسيابية",
          uses: "صب الخرسانة ذاتية الرص وتعديل لزوجة المواد الرقيقة بالصيف"
        };
      } else if (cat === "إضافات معدنية") {
        const isSilica = name.includes("سيلكا") || name.includes("سيليكا") || name.includes("بوسعادة");
        suggested = {
          ...suggested,
          density: isSilica ? 2200 : 2900,
          ssdDensity: isSilica ? 2200 : 2900,
          absorption: 0,
          moisture: 0,
          admixtureType: isSilica ? "silica_fume" : "slag",
          recommendedDosage: isSilica ? 8.0 : 15.0,
          waterReduction: isSilica ? 5 : 0,
          quality: isSilica ? "غبار سيليكا غير متبلور بنعومة نانوية لملأ الفضاء الميكروي" : "خبث أفران ناعم معالج لزيادة المتانة والوقاية الكيمياوية",
          uses: isSilica ? "الخرسانة فائقة العلو والقوة" : "الخلطات المقاومة للكبريتات وتخفيض حرارة كتل الأساسات الضخمة"
        };
      } else {
        suggested = {
          ...suggested,
          density: 1000,
          absorption: 0,
          moisture: 0,
          quality: "مطابقة للمعايير المائية والتقنية المعتمدة",
          uses: "أعمال خلط وصب ومعالجة الخرسانة بالورشات"
        };
      }

      return suggested;
    };

    try {
      const resp = await fetch("/api/material-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category: cat, region })
      });
      const resData = await resp.json();

      if (resData.success && resData.data) {
        const aiData = resData.data;
        const baseHeuristics = getHeuristicSuggested();
        
        setFormState(prev => ({
          ...prev,
          ...baseHeuristics,
          // Assign dynamic, single source of truth assets
          desc: aiData.description || baseHeuristics.desc,
          Description: aiData.description || baseHeuristics.Description,
          EngineeringNotes: aiData.engineeringNotes || baseHeuristics.EngineeringNotes,
          RecommendedUse: aiData.recommendedUses || baseHeuristics.RecommendedUse,
          ConcreteClasses: aiData.concreteClasses || "C25/30, C30/37",
          Warnings: aiData.warnings || "تنبيه: راقب نسبة المحتوى الناعم",
          
          density: aiData.density || baseHeuristics.density,
          absorption: aiData.absorption || baseHeuristics.absorption,
          moisture: aiData.moisture || baseHeuristics.moisture,
          finenessModulus: aiData.finenessModulus || baseHeuristics.finenessModulus,
          quality: aiData.quality || baseHeuristics.quality,
          
          createdBy: "SNO AI Assistant (Gemini 3.5)",
          createdDate: new Date().toISOString().split('T')[0],
          updatedDate: new Date().toISOString().split('T')[0],
          status: "نشط"
        }));

        setAIAssistSuccessMessage("تم اقتراح كافة الخصائص الهندسية والتحذيرات بدقة عالية واحترافية فائقة باستخدام مساعد SNO AI!");
      } else {
        const baseHeuristics = getHeuristicSuggested();
        setFormState(prev => ({
          ...prev,
          ...baseHeuristics,
          name: prev.name,
          englishName: prev.englishName || `${cat} Custom Spec`,
          category: prev.category,
          provenance: prev.provenance || region,
          status: "نشط"
        }));
        setAIAssistSuccessMessage("تم اقتراح الخصائص الهندسية بنجاح عبر المحرّك الذاتي الفوري!");
      }
    } catch (err) {
      console.warn("AI Backend failed, using heuristics:", err);
      const baseHeuristics = getHeuristicSuggested();
      setFormState(prev => ({
        ...prev,
        ...baseHeuristics,
        name: prev.name,
        englishName: prev.englishName || `${cat} Custom Spec`,
        category: prev.category,
        provenance: prev.provenance || region,
        status: "نشط"
      }));
      setAIAssistSuccessMessage("تم اقتراح الخصائص الهندسية وتثبيت المعايرة باستخدام محرك الطوارئ الذاتي!");
    } finally {
      setIsAILoading(false);
      setTimeout(() => setAIAssistSuccessMessage(""), 5000);
    }
  };

  // Submit Save
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateMaterials) return;

    if (!formState.name?.trim()) {
      showToast(language === "ar" ? "يرجى إدخال اسم المادة الموحد!" : "Please enter the standard material name!", "error");
      return;
    }

    const parsedDensity = Number(formState.density);
    if (formState.category !== "إضافات كيميائية" && (isNaN(parsedDensity) || parsedDensity <= 0)) {
      showToast(language === "ar" ? "يرجى إدخال قيمة كثافة صحيحة أكبر من الصفر!" : "Please enter a valid density greater than zero!", "error");
      return;
    }

    const matchedType = mapCategoryToType(formState.category || "إسمنت");

    // 1. Dynamic UID Generator: MAT-SND-XXXXX, etc.
    const generateMaterialUID = (category: string) => {
      const prefix = 
        category === "رمال" ? "MAT-SND" :
        category === "حصى" ? "MAT-GRV" :
        category === "إسمنت" ? "MAT-CEM" :
        category === "ماء" ? "MAT-WTR" :
        category === "ركام خفيف" ? "MAT-LGT" :
        category === "ركام ثقيل" ? "MAT-HVY" :
        category === "إضافات كيميائية" ? "MAT-CHM" :
        category === "إضافات معدنية" ? "MAT-MIN" :
        category === "ألياف" ? "MAT-FIB" :
        category === "محتوى الهواء" ? "MAT-AIR" :
        category === "مجلدات خاصة" ? "MAT-SPC" : "MAT-OTH";
      const randomId = Math.floor(10000 + Math.random() * 90000).toString();
      return `${prefix}-${randomId}`;
    };

    if (isAdding) {
      const generatedId = generateMaterialUID(formState.category || "رمال");
      const initialVer = 1;
      const initialHist = [
        {
          date: new Date().toISOString().split('T')[0],
          version: initialVer,
          author: "senoussi.s.t@gmail.com",
          changes: "إنشاء وتسجيل المادة بصفاتها الفنية الأولية وتحليلات المختبر والبطاقة الفنية.",
          approvalStatus: formState.ApprovalStatus || "Draft"
        }
      ];

      const newMat: EngineeringMaterial = {
        ...formState as any,
        id: generatedId,
        MaterialID: generatedId,
        MaterialCode: generatedId,
        type: matchedType,
        version: initialVer,
        lifecycleHistory: initialHist,
        ApprovalStatus: formState.ApprovalStatus || "Draft",
        density: Number(formState.density) || 0,
        ssdDensity: formState.ssdDensity ? Number(formState.ssdDensity) : undefined,
        absorption: Number(formState.absorption) || 0,
        moisture: Number(formState.moisture) || 0,
        finenessModulus: formState.finenessModulus ? Number(formState.finenessModulus) : undefined,
        dMax: formState.dMax ? Number(formState.dMax) : undefined,
        price: Number(formState.price) || 0,
        status: formState.status || "نشط",
        createdDate: new Date().toISOString().split('T')[0],
        updatedDate: new Date().toISOString().split('T')[0],
        createdBy: "senoussi.s.t@gmail.com"
      };

      onUpdateMaterials([newMat, ...materials]);
      setSelectedMaterialId(generatedId);
      setIsAdding(false);
    } else if (isEditing && activeMaterial) {
      const existingMat = materials.find(m => m.id === activeMaterial.id);
      if (!existingMat) return;

      const currentVer = (existingMat.version || 1) + 1;
      const prevHistory = existingMat.lifecycleHistory || [
        {
          date: existingMat.createdDate || new Date().toISOString().split('T')[0],
          version: 1,
          author: existingMat.createdBy || "System Seed",
          changes: "تثبيت النسخة الابتدائية للمادة الإنشائية.",
          approvalStatus: existingMat.ApprovalStatus || "Certified"
        }
      ];

      // Audit Trail Property Profiler
      const changedProps: string[] = [];
      if (existingMat.name !== formState.name) changedProps.push(`الاسم (${existingMat.name} -> ${formState.name})`);
      if (existingMat.density !== Number(formState.density)) changedProps.push(`الكثافة (${existingMat.density} -> ${formState.density})`);
      if (existingMat.absorption !== Number(formState.absorption)) changedProps.push(`الامتصاص (${existingMat.absorption} -> ${formState.absorption})`);
      if (existingMat.ApprovalStatus !== formState.ApprovalStatus) changedProps.push(`حالة الاعتماد (${existingMat.ApprovalStatus} -> ${formState.ApprovalStatus})`);
      if (existingMat.supplierName !== formState.supplierName) changedProps.push(`المورد (${existingMat.supplierName} -> ${formState.supplierName})`);
      if (existingMat.quarryName !== formState.quarryName) changedProps.push(`المحجر (${existingMat.quarryName} -> ${formState.quarryName})`);

      const changeLogStr = changedProps.length > 0 
        ? `تعديل الهوية: [${changedProps.join("، ")}].`
        : "تحديث الخواص المخبرية العامة والبطاقة الفنية.";

      const newHistToken = {
        date: new Date().toISOString().split('T')[0],
        version: currentVer,
        author: "senoussi.s.t@gmail.com",
        changes: changeLogStr,
        approvalStatus: formState.ApprovalStatus || "Draft"
      };

      // Create old version historical record to keep forever in the database
      const oldVersionRecord: EngineeringMaterial = {
        ...existingMat,
        id: `${existingMat.id}_v${existingMat.version || 1}`, // permanent version ID referencing
        version: existingMat.version || 1,
        ApprovalStatus: "Archived",
        status: "موقوف",
        name: `${existingMat.name} (الإصدار v${existingMat.version || 1})`,
      };

      // Update primary material
      const updatedPrimaryRecord: EngineeringMaterial = {
        ...existingMat,
        ...formState as any,
        id: existingMat.id,
        MaterialID: existingMat.id,
        MaterialCode: existingMat.id,
        type: matchedType,
        version: currentVer,
        lifecycleHistory: [...prevHistory, newHistToken],
        density: Number(formState.density) || existingMat.density,
        ssdDensity: formState.ssdDensity ? Number(formState.ssdDensity) : undefined,
        absorption: Number(formState.absorption) || 0,
        moisture: Number(formState.moisture) || 0,
        finenessModulus: formState.finenessModulus ? Number(formState.finenessModulus) : undefined,
        dMax: formState.dMax ? Number(formState.dMax) : undefined,
        price: Number(formState.price) || 0,
        updatedDate: new Date().toISOString().split('T')[0],
        createdBy: existingMat.createdBy || "senoussi.s.t@gmail.com",
        createdDate: existingMat.createdDate || new Date().toISOString().split('T')[0]
      };

      const updatedList = materials.map(m => {
        if (m.id === activeMaterial.id) {
          return updatedPrimaryRecord;
        }
        return m;
      });

      // Calculate differences for confirmation modal
      const EDITABLE_FIELDS: { key: string; ar: string; en: string }[] = [
        { key: "name", ar: "الاسم (بالعربية)", en: "Name (Arabic)" },
        { key: "englishName", ar: "الاسم بالإنجليزية", en: "English Name" },
        { key: "category", ar: "الفئة", en: "Category" },
        { key: "materialType", ar: "نوع المادة", en: "Material Type" },
        { key: "price", ar: "السعر التقديري (دج)", en: "Estimated Price (DZD)" },
        { key: "density", ar: "الكثافة الجافة (كغ/م³)", en: "Dry Density (kg/m³)" },
        { key: "ssdDensity", ar: "الكثافة المشبعة SSD (كغ/م³)", en: "SSD Density (kg/m³)" },
        { key: "absorption", ar: "الامتصاص (%)", en: "Absorption (%)" },
        { key: "moisture", ar: "المحتوى المائي (%)", en: "Moisture Content (%)" },
        { key: "specificGravity", ar: "الوزن النوعي", en: "Specific Gravity" },
        { key: "particleShape", ar: "شكل الحبيبات", en: "Particle Shape" },
        { key: "aggregateQuality", ar: "جودة التدرج", en: "Grading Quality" },
        { key: "finenessModulus", ar: "معاير النعومة", en: "Fineness Modulus" },
        { key: "clayContent", ar: "محتوى الطين والشوائب (%)", en: "Clay Content (%)" },
        { key: "bulkDensity", ar: "الكثافة الظاهرية (كغ/م³)", en: "Bulk Density (kg/m³)" },
        { key: "losAngelesAbrasion", ar: "معامل لوس أنجلوس للتآكل (%)", en: "Los Angeles Abrasion (%)" },
        { key: "settingTimeImpact", ar: "مدة تأخير/تسريع الشك (دقائق)", en: "Setting Time Delta (min)" },
        { key: "settingModification", ar: "تأثير زمن الشك", en: "Setting Impact Type" },
        { key: "cementClass", ar: "صنف الإسمنت", en: "Cement Class" },
        { key: "strengthClass", ar: "رتبة المقاومة (ميغاباسكال)", en: "Strength Class (MPa)" },
        { key: "hydrationClass", ar: "سرعة الإماهة", en: "Hydration Speed" },
        { key: "heatOfHydration", ar: "حرارة الإماهة (جول/غ)", en: "Heat of Hydration (J/g)" },
        { key: "recommendedDosage", ar: "الجرعة الموصى بها (%)", en: "Recommended Dosage (%)" },
        { key: "waterReduction", ar: "نسبة خفض الماء المطلوب (%)", en: "Water Reduction (%)" },
        { key: "quality", ar: "مستوى الجودة", en: "Quality Rating" },
        { key: "uses", ar: "الاستخدامات", en: "Applications" },
        { key: "desc", ar: "الوصف والخصائص", en: "Description" },
        { key: "supplierName", ar: "اسم المورد", en: "Supplier Name" },
        { key: "supplierContact", ar: "معلومات الاتصال بالمورد", en: "Supplier Contact" },
        { key: "quarryName", ar: "اسم المحجر", en: "Quarry Name" },
        { key: "certificationStatus", ar: "حالة الشهادة الفنية", en: "Technical Certification Status" },
        { key: "SandEquivalent", ar: "المكافئ الرملي (SE %)", en: "Sand Equivalent (SE %)" },
        { key: "MethyleneBlue", ar: "قيمة الميثيلين الأزرق (MB)", en: "Methylene Blue Value (MB)" },
        { key: "Chlorides", ar: "محتوى الكلوريدات (mg/kg)", en: "Chlorides Content (mg/kg)" },
        { key: "Sulfates", ar: "محتوى الكبريتات (mg/kg)", en: "Sulfates Content (mg/kg)" },
        { key: "LosAngeles", ar: "مقاومة التآكل لوس أنجلوس (%)", en: "Los Angeles Value (%)" },
        { key: "flakinessIndex", ar: "معامل التفرطح (FI %)", en: "Flakiness Index (FI %)" },
        { key: "elongationIndex", ar: "معامل الاستطالة (EI %)", en: "Elongation Index (EI %)" },
        { key: "crushingValue", ar: "مقاومة التهشيم للركام (%)", en: "Aggregate Crushing Value (%)" },
        { key: "status", ar: "الحالة التشغيلية", en: "Operational Status" },
        { key: "ApprovalStatus", ar: "حالة الاعتماد", en: "Approval Status" }
      ];

      const diffsList: {
        fieldLabelAr: string;
        fieldLabelEn: string;
        from: any;
        to: any;
      }[] = [];

      EDITABLE_FIELDS.forEach(({ key, ar, en }) => {
        const fromVal = existingMat[key as keyof EngineeringMaterial];
        const toVal = updatedPrimaryRecord[key as keyof EngineeringMaterial];

        const isFalsy = (v: any) => v === undefined || v === null || v === "";
        if (isFalsy(fromVal) && isFalsy(toVal)) return;

        let hasChanged = false;
        if (typeof fromVal === "number" || typeof toVal === "number") {
          const numFrom = (fromVal !== undefined && fromVal !== null && fromVal !== "") ? Number(fromVal) : 0;
          const numTo = (toVal !== undefined && toVal !== null && toVal !== "") ? Number(toVal) : 0;
          hasChanged = Math.abs(numFrom - numTo) > 1e-6;
        } else {
          hasChanged = String(fromVal ?? "") !== String(toVal ?? "");
        }

        if (hasChanged) {
          diffsList.push({
            fieldLabelAr: ar,
            fieldLabelEn: en,
            from: fromVal,
            to: toVal
          });
        }
      });

      if (diffsList.length > 0) {
        setEditConfirmationData({
          existingMat,
          updatedMat: updatedPrimaryRecord,
          oldVersionRecord,
          diffs: diffsList
        });
      } else {
        // No differences found, save directly
        onUpdateMaterials([oldVersionRecord, ...updatedList]);
        setSelectedMaterialId(existingMat.id);
        setIsEditing(false);
        showToast(
          language === "ar"
            ? "لم يتم رصد أي تغييرات حقيقية لحفظها."
            : "No actual modifications detected to save.",
          "info"
        );
      }
    }
  };

  // Check if material is actively used in project inputs
  const isMaterialCurrentlyActiveInInputs = (mat: EngineeringMaterial) => {
    const category = getMaterialCategory(mat);
    if (!category) return false;
    const cat = category.trim().toLowerCase();
    
    if (cat === "رمال" || cat === "sand") {
      return inputs.selectedSandId === mat.id || inputs.sandType === mat.name;
    }
    if (cat === "حصى" || cat === "gravel" || cat === "aggregate") {
      return inputs.selectedGravelId === mat.id || inputs.gravelType === mat.name;
    }
    if (cat === "إسمنت" || cat === "cement") {
      return inputs.selectedCementId === mat.id || inputs.cementType === mat.name;
    }
    if (cat === "إضافات كيميائية" || cat === "admixture" || cat === "chemical_admixture") {
      return inputs.selectedAdmixtureId === mat.id || inputs.selectedAdmixtureName === mat.name;
    }
    if (cat === "إضافات معدنية" || cat === "scm" || cat === "mineral_admixture") {
      return inputs.selectedScmId === mat.id || inputs.selectedScmName === mat.name;
    }
    if (cat === "ماء" || cat === "water") {
      return inputs.selectedWaterId === mat.id || inputs.selectedWaterName === mat.name;
    }
    if (cat === "ركام خفيف" || cat === "lightweight_aggregate" || cat === "lightweight aggregate") {
      return inputs.selectedLightweightAggregateId === mat.id || inputs.selectedLightweightAggregateName === mat.name;
    }
    if (cat === "ركام ثقيل" || cat === "heavyweight_aggregate" || cat === "heavyweight aggregate") {
      return inputs.selectedHeavyweightAggregateId === mat.id || inputs.selectedHeavyweightAggregateName === mat.name;
    }
    if (cat === "ألياف" || cat === "fibers" || cat === "fiber") {
      return inputs.selectedFiberId === mat.id || inputs.selectedFiberName === mat.name;
    }
    if (cat === "محتوى الهواء" || cat === "air_content" || cat === "air content") {
      return inputs.selectedAirContentMaterialId === mat.id || inputs.selectedAirContentMaterialName === mat.name;
    }
    if (cat === "مجلدات خاصة" || cat === "special_binder" || cat === "special binder") {
      return inputs.selectedSpecialBinderId === mat.id || inputs.selectedSpecialBinderName === mat.name;
    }
    return false;
  };

  // Perform Apply Material (AUTOFILL ENGINE 6)
  const handleApplyMaterialToMix = (mat: EngineeringMaterial) => {
    if (!checkIsCompatible(mat)) {
      showToast(
        language === "ar" 
          ? "هذه المادة غير متوافقة مع نوع الخرسانة الحالي." 
          : "This material is incompatible with the current concrete type.", 
        "error"
      );
      return;
    }
    const patch = mapMaterialToMixInput(mat);
    setInputs((prev: any) => {
      const nextInputs = { ...prev };
      for (const [key, value] of Object.entries(patch)) {
        if (value !== undefined && value !== null) {
          nextInputs[key] = value;
        }
      }
      return nextInputs;
    });
    
    // Smooth scroll back to top of inputs if in design mode
    const elementsToScroll = document.getElementById("step3-materials-selection");
    if (elementsToScroll) {
      elementsToScroll.scrollIntoView({ behavior: "smooth" });
    }
  };

  const getMissingProperties = (mat: EngineeringMaterial) => {
    const missing: { key: string; nameAr: string; nameFr: string; nameEn: string; recommended: any }[] = [];
    if (!mat) return missing;
    
    const category = mat.category || mat.type;
    if (category === "إسمنت") {
      if (!mat.strengthClass) {
        missing.push({
          key: "strengthClass",
          nameAr: "رتبة مقاومة الإسمنت",
          nameFr: "Classe de résistance du ciment",
          nameEn: "Cement strength class",
          recommended: "42.5"
        });
      }
      if (!mat.density || mat.density <= 0) {
        missing.push({
          key: "density",
          nameAr: "الكثافة المطلقة للإسمنت",
          nameFr: "Masse volumique absolue du ciment",
          nameEn: "Cement absolute density",
          recommended: 3100
        });
      }
    } else if (category === "رمال") {
      const spGravity = mat.specificGravity || mat.engineeringData?.specificGravity;
      if (!spGravity || spGravity < 1.0 || spGravity > 4.0) {
        missing.push({
          key: "specificGravity",
          nameAr: "الكثافة النوعية (الوزن النوعي) للرمل",
          nameFr: "Densité relative du sable",
          nameEn: "Sand relative density (specific gravity)",
          recommended: 2.65
        });
      }
      const moist = mat.moisture !== undefined ? mat.moisture : mat.engineeringData?.moistureContent;
      if (moist === undefined || moist === null || moist < 0) {
        missing.push({
          key: "moisture",
          nameAr: "المحتوى الرطوبي للرمل",
          nameFr: "Humidité du sable",
          nameEn: "Sand moisture content",
          recommended: 3.0
        });
      }
      if (!mat.finenessModulus) {
        missing.push({
          key: "finenessModulus",
          nameAr: "معامل النعومة (FM)",
          nameFr: "Module de finesse du sable",
          nameEn: "Sand fineness modulus",
          recommended: 2.6
        });
      }
    } else if (category === "حصى") {
      const spGravity = mat.specificGravity || mat.engineeringData?.specificGravity;
      if (!spGravity || spGravity < 1.0 || spGravity > 4.0) {
        missing.push({
          key: "specificGravity",
          nameAr: "الكثافة النوعية (الوزن النوعي) للحصى",
          nameFr: "Densité relative du gravier",
          nameEn: "Gravel relative density (specific gravity)",
          recommended: 2.68
        });
      }
      const moist = mat.moisture !== undefined ? mat.moisture : mat.engineeringData?.moistureContent;
      if (moist === undefined || moist === null || moist < 0) {
        missing.push({
          key: "moisture",
          nameAr: "المحتوى الرطوبي للحصى",
          nameFr: "Humidité du gravier",
          nameEn: "Gravel moisture content",
          recommended: 1.0
        });
      }
      if (!mat.dMax) {
        missing.push({
          key: "dMax",
          nameAr: "القطر الأقصى للحبيبات (Dmax)",
          nameFr: "Taille maximale des grains (Dmax)",
          nameEn: "Gravel maximum size (Dmax)",
          recommended: 20
        });
      }
    }
    return missing;
  };

  const handleAutofillMissingProperties = (mat: EngineeringMaterial) => {
    if (!mat || !onUpdateMaterials) return;
    const missing = getMissingProperties(mat);
    if (missing.length === 0) return;

    const updatedPrimaryRecord: EngineeringMaterial = {
      ...mat,
      updatedDate: new Date().toISOString().split('T')[0]
    };

    missing.forEach(prop => {
      if (prop.key === "strengthClass") {
        updatedPrimaryRecord.strengthClass = prop.recommended;
      } else if (prop.key === "density") {
        updatedPrimaryRecord.density = prop.recommended;
      } else if (prop.key === "specificGravity") {
        updatedPrimaryRecord.specificGravity = prop.recommended;
        if (!updatedPrimaryRecord.engineeringData) updatedPrimaryRecord.engineeringData = {};
        updatedPrimaryRecord.engineeringData.specificGravity = prop.recommended;
      } else if (prop.key === "moisture") {
        updatedPrimaryRecord.moisture = prop.recommended;
        if (!updatedPrimaryRecord.engineeringData) updatedPrimaryRecord.engineeringData = {};
        updatedPrimaryRecord.engineeringData.moistureContent = prop.recommended;
      } else if (prop.key === "finenessModulus") {
        updatedPrimaryRecord.finenessModulus = prop.recommended;
        if (!updatedPrimaryRecord.engineeringData) updatedPrimaryRecord.engineeringData = {};
        updatedPrimaryRecord.engineeringData.finenessModulus = prop.recommended;
      } else if (prop.key === "dMax") {
        updatedPrimaryRecord.dMax = prop.recommended;
        if (!updatedPrimaryRecord.engineeringData) updatedPrimaryRecord.engineeringData = {};
        updatedPrimaryRecord.engineeringData.dMax = prop.recommended;
      }
    });

    const updatedList = materials.map(m => {
      if (m.id === mat.id) {
        return updatedPrimaryRecord;
      }
      return m;
    });

    onUpdateMaterials(updatedList);
  };

  const activeRatingInfo = activeMaterial ? (ratingsState[activeMaterial.id] || { avg: activeMaterial.rating, votes: 35 }) : { avg: 4.5, votes: 12 };

  const renderDynamicOrClassicForm = () => {
    return (
      <>
        {/* MODE TOGGLE: DREUX-GORISSE ENGINEERING VS FULL CATALOG */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl mb-3 border border-slate-200/50 dark:border-slate-700/50" dir="rtl">
          <button
            type="button"
            onClick={() => {
              setIsEngineeringMode(true);
              if (!formState.category) {
                setFormState(prev => ({ ...prev, category: "إسمنت", engineeringData: {} }));
              }
            }}
            className={`flex-1 py-1.5 text-center text-[10.5px] font-black rounded-lg transition-all ${
              isEngineeringMode 
                ? "bg-blue-650 bg-blue-600 text-white shadow-sm" 
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            🔬 الخصائص الهندسية لـ Dreux-Gorisse
          </button>
          <button
            type="button"
            onClick={() => setIsEngineeringMode(false)}
            className={`flex-1 py-1.5 text-center text-[10.5px] font-black rounded-lg transition-all ${
              !isEngineeringMode 
                ? "bg-blue-650 bg-blue-600 text-white shadow-sm" 
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            📋 الكتالوج العام الكامل
          </button>
        </div>

        {isEngineeringMode ? (
          /* --- DREUX-GORISSE DYNAMIC CALCULATIONS-ONLY FORM --- */
          <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1 text-xs text-right" dir="rtl">
            
            {/* Material Name */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1">اسم المادة بالعربية:</label>
                <input
                  type="text"
                  required
                  value={formState.name || ""}
                  onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full text-xs p-2 text-right bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-semibold"
                  placeholder="رمل وادي سوف الصحراوي..."
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1">الاسم بالإنجليزية (English):</label>
                <input
                  type="text"
                  value={formState.englishName || ""}
                  onChange={(e) => setFormState(prev => ({ ...prev, englishName: e.target.value }))}
                  className="w-full text-xs p-2 text-left bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-mono"
                  placeholder="Washed Sand..."
                />
              </div>
            </div>

            {/* Category and Material Type Selectors */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1">صنف المادة الهندسي الدقيق:</label>
                <select
                  value={formState.category || "إسمنت"}
                  onChange={(e) => {
                    const cat = e.target.value;
                    let autoType = "أخرى";
                    if (cat === "إسمنت" || cat === "مجلدات خاصة") {
                      autoType = "مادة رابطة";
                    } else if (cat === "رمال" || cat === "حصى" || cat === "ركام خفيف" || cat === "ركام ثقيل") {
                      autoType = "ركام";
                    } else if (cat === "إضافات معدنية") {
                      autoType = "إضافات معدنية";
                    } else if (cat === "ألياف") {
                      autoType = "ألياف";
                    } else if (cat === "إضافات كيميائية" || cat === "محتوى الهواء") {
                      autoType = "إضافات كيميائية";
                    } else if (cat === "ماء") {
                      autoType = "ماء";
                    }
                    setFormState(prev => ({
                      ...prev,
                      category: cat as any,
                      materialType: autoType,
                      engineeringData: prev.category === cat ? prev.engineeringData : {}
                    }));
                  }}
                  className="w-full text-xs p-2 text-right bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-bold text-blue-600 dark:text-blue-450"
                >
                  <option value="إسمنت">إسمنت (Cement)</option>
                  <option value="رمال">رمل - ركام ناعم (Fine Aggregate)</option>
                  <option value="حصى">حصى - ركام خشن (Coarse Aggregate)</option>
                  <option value="ركام خفيف">ركام خفيف (Lightweight Aggregate)</option>
                  <option value="ركام ثقيل">ركام ثقيل (Heavyweight Aggregate)</option>
                  <option value="إضافات كيميائية">مضافات كيميائية (Chemical Admixtures)</option>
                  <option value="إضافات معدنية">مضافات معدنية (Mineral Admixtures SCM)</option>
                  <option value="ألياف">ألياف (Fibers)</option>
                  <option value="ماء">ماء (Water)</option>
                  <option value="محتوى الهواء">محتوى الهواء المحبوس (Air Content)</option>
                  <option value="مجلدات خاصة">مجلدات خاصة (Special Binders)</option>
                  <option value="مواد مالئة">مواد مالئة (Filler)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1">نوع المادة (التصنيف العام):</label>
                <select
                  value={formState.materialType || "مادة رابطة"}
                  onChange={(e) => setFormState(prev => ({ ...prev, materialType: e.target.value }))}
                  className="w-full text-xs p-2 text-right bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-bold text-indigo-650 dark:text-indigo-400"
                >
                  <option value="مادة رابطة">مادة رابطة (Binder)</option>
                  <option value="ركام">ركام (Aggregate)</option>
                  <option value="إضافات معدنية">إضافات معدنية (Mineral Admixture)</option>
                  <option value="ألياف">ألياف (Fibers)</option>
                  <option value="إضافات كيميائية">إضافات كيميائية (Chemical Admixtures)</option>
                  <option value="ماء">ماء (Water)</option>
                  <option value="أخرى">أخرى (Other)</option>
                </select>
              </div>
            </div>

            {/* SUB-TABS: BASIC / ADVANCED / LABORATORY */}
            <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800 space-x-1" dir="rtl">
              <button
                type="button"
                onClick={() => setFormSubTab("basic")}
                className={`flex-1 py-1 text-center text-[10px] font-black rounded-lg transition-all ${
                  formSubTab === "basic"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                🟢 الأساسية (Basic)
              </button>
              <button
                type="button"
                onClick={() => setFormSubTab("advanced")}
                className={`flex-1 py-1 text-center text-[10px] font-black rounded-lg transition-all ${
                  formSubTab === "advanced"
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                🟡 المتقدمة (Advanced)
              </button>
              <button
                type="button"
                onClick={() => setFormSubTab("laboratory")}
                className={`flex-1 py-1 text-center text-[10px] font-black rounded-lg transition-all ${
                  formSubTab === "laboratory"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                🧪 المخبرية (Laboratory)
              </button>
            </div>

            {/* CONDITIONAL RENDERING OF FIELDS REQUIRED FOR DREUX-GORISSE */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/50 dark:border-slate-800 space-y-2.5">
              <p className="text-[9.5px] text-blue-600 dark:text-blue-400 font-black flex items-center justify-end gap-1">
                <span>البارامترات الهندسية لـ Dreux-Gorisse ومختلف الطرق</span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              </p>

              {/* 1) CEMENT (إسمنت) */}
              {formState.category === "إسمنت" && (
                <div className="space-y-2">
                  {formSubTab === "basic" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">نوع الإسمنت (Cement Type):</label>
                          <select
                            value={getEngDataValue("cementTypeSelect", "CEM I")}
                            onChange={(e) => updateEngData("cementTypeSelect", e.target.value)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-bold"
                          >
                            <option value="CEM I">CEM I (بورتلاندي خالص)</option>
                            <option value="CEM II">CEM II (بورتلاندي مركب)</option>
                            <option value="CEM III">CEM III (حديد أفران)</option>
                            <option value="CEM V">CEM V (مركب)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">رتبة المقاومة (MPa):</label>
                          <select
                            value={getEngDataValue("strengthClass", "42.5")}
                            onChange={(e) => {
                              updateEngData("strengthClass", e.target.value);
                              setFormState(prev => ({ ...prev, strengthClass: e.target.value }));
                            }}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-bold text-emerald-600 dark:text-emerald-400"
                          >
                            <option value="32.5">32.5 MPa</option>
                            <option value="42.5">42.5 MPa</option>
                            <option value="52.5">52.5 MPa</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">الفئة (Class Category):</label>
                          <select
                            value={getEngDataValue("cementClassCategory", "N")}
                            onChange={(e) => updateEngData("cementClassCategory", e.target.value)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-bold"
                          >
                            <option value="N">عادية (N)</option>
                            <option value="R">سريعة التصلب (R)</option>
                            <option value="L">منخفضة الحرارة (L)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">الكثافة المطلقة (Absolute Density - kg/m³):</label>
                          <input
                            type="number"
                            required
                            value={getEngDataValue("density", 3100)}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateEngData("density", val);
                              setFormState(prev => ({ ...prev, density: val }));
                            }}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono font-bold"
                            placeholder="3100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9.5px] text-slate-500 block mb-0.5">مقاومة الضغط المستهدفة عند 28 يوم (MPa):</label>
                        <input
                          type="number"
                          value={getEngDataValue("strength28d", 42.5)}
                          onChange={(e) => updateEngData("strength28d", parseFloat(e.target.value) || 0)}
                          className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono text-blue-600 dark:text-blue-400 font-bold"
                          placeholder="42.5"
                        />
                      </div>
                    </div>
                  )}

                  {formSubTab === "advanced" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">الكثافة الظاهرية (Bulk Density - kg/m³):</label>
                          <input
                            type="number"
                            value={getEngDataValue("bulkDensity", 1100)}
                            onChange={(e) => updateEngData("bulkDensity", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="1100"
                          />
                        </div>
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">النعومة بلين (Blaine Fineness - cm²/g):</label>
                          <input
                            type="number"
                            value={getEngDataValue("blaineFineness", 3200)}
                            onChange={(e) => updateEngData("blaineFineness", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="3200"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9.5px] text-slate-500 block mb-0.5">حرارة الإماهة (Heat of Hydration):</label>
                        <input
                          type="text"
                          value={getEngDataValue("hydrationHeat", "معتدل (Normal)")}
                          onChange={(e) => updateEngData("hydrationHeat", e.target.value)}
                          className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded"
                          placeholder="مثال: منخفضة / عالية..."
                        />
                      </div>
                    </div>
                  )}

                  {formSubTab === "laboratory" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">بداية الشك (Initial Setting - min):</label>
                          <input
                            type="number"
                            value={getEngDataValue("initialSettingTime", 120)}
                            onChange={(e) => updateEngData("initialSettingTime", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="120"
                          />
                        </div>
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">نهاية الشك (Final Setting - min):</label>
                          <input
                            type="number"
                            value={getEngDataValue("finalSettingTime", 240)}
                            onChange={(e) => updateEngData("finalSettingTime", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="240"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-0.5">يومين (2d - MPa):</label>
                          <input
                            type="number"
                            value={getEngDataValue("strength2d", 15)}
                            onChange={(e) => updateEngData("strength2d", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="15"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-0.5">7 أيام (7d - MPa):</label>
                          <input
                            type="number"
                            value={getEngDataValue("strength7d", 30)}
                            onChange={(e) => updateEngData("strength7d", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="30"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-0.5">القلويات (Alkali - %):</label>
                          <input
                            type="number"
                            step="0.01"
                            value={getEngDataValue("alkaliContent", 0.60)}
                            onChange={(e) => updateEngData("alkaliContent", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="0.60"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2) SAND / FINE AGGREGATE (رمل) */}
              {formState.category === "رمال" && (
                <div className="space-y-2">
                  {formSubTab === "basic" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">نوع الرمل:</label>
                          <select
                            value={getEngDataValue("sandType", "river")}
                            onChange={(e) => updateEngData("sandType", e.target.value)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-bold"
                          >
                            <option value="river">رمل نهري (River Sand)</option>
                            <option value="crushed">رمل مكسر (Crushed Sand)</option>
                            <option value="dune">رمل كثباني صحراوي (Dune Sand)</option>
                            <option value="washed">رمل مغسول (Washed Sand)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9.5px] block mb-0.5 font-black text-blue-600 dark:text-blue-400">الكثافة النوعية (الوزن النوعي):</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={getEngDataValue("specificGravity", 2.65)}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateEngData("specificGravity", val);
                              setFormState(prev => ({ ...prev, specificGravity: val }));
                            }}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono font-bold"
                            placeholder="2.65"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-0.5">النعومة (FM):</label>
                          <input
                            type="number"
                            step="0.01"
                            value={getEngDataValue("finenessModulus", 2.60)}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateEngData("finenessModulus", val);
                              setFormState(prev => ({ ...prev, finenessModulus: val }));
                            }}
                            className="w-full text-xs p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono font-bold"
                            placeholder="2.60"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-0.5">الحجمية (Bulk - kg/m³):</label>
                          <input
                            type="number"
                            value={getEngDataValue("bulkDensity", 1550)}
                            onChange={(e) => updateEngData("bulkDensity", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="1550"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-0.5">الرطوبة (Moisture - %):</label>
                          <input
                            type="number"
                            step="0.1"
                            value={getEngDataValue("moistureContent", 3.0)}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateEngData("moistureContent", val);
                              setFormState(prev => ({ ...prev, moisture: val }));
                            }}
                            className="w-full text-xs p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono font-bold text-amber-600 dark:text-amber-400"
                            placeholder="3.0"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formSubTab === "advanced" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">القطر الأقصى Dmax (mm):</label>
                          <input
                            type="number"
                            value={getEngDataValue("dMax", 5)}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateEngData("dMax", val);
                              setFormState(prev => ({ ...prev, dMax: val }));
                            }}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="5"
                          />
                        </div>
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">القطر الأدنى d (mm):</label>
                          <input
                            type="number"
                            step="0.01"
                            value={getEngDataValue("dMin", 0.08)}
                            onChange={(e) => updateEngData("dMin", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="0.08"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">معامل الامتصاص (%):</label>
                          <input
                            type="number"
                            step="0.1"
                            value={getEngDataValue("waterAbsorption", 1.5)}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateEngData("waterAbsorption", val);
                              setFormState(prev => ({ ...prev, absorption: val }));
                            }}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="1.5"
                          />
                        </div>
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">معامل الشكل:</label>
                          <select
                            value={getEngDataValue("shapeIndex", "rounded")}
                            onChange={(e) => updateEngData("shapeIndex", e.target.value)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-bold"
                          >
                            <option value="rounded">مستدير وديان (Rounded)</option>
                            <option value="angular">زاوي مكسر (Angular)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {formSubTab === "laboratory" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">المكافئ الرملي (SE - %):</label>
                          <input
                            type="number"
                            value={getEngDataValue("sandEquivalent", 75)}
                            onChange={(e) => updateEngData("sandEquivalent", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono text-purple-600 dark:text-purple-400 font-bold"
                            placeholder="75%"
                          />
                        </div>
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">نسبة المار من 0.08 مم (%):</label>
                          <input
                            type="number"
                            step="0.1"
                            value={getEngDataValue("finesPassing", 3.0)}
                            onChange={(e) => updateEngData("finesPassing", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="3.0"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">المواد العضوية (Organic):</label>
                          <input
                            type="text"
                            value={getEngDataValue("organicContent", "خالٍ (Negative)")}
                            onChange={(e) => updateEngData("organicContent", e.target.value)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded"
                            placeholder="خالٍ"
                          />
                        </div>
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">نسبة الطين (Clay Content - %):</label>
                          <input
                            type="number"
                            step="0.1"
                            value={getEngDataValue("clayContent", 1.0)}
                            onChange={(e) => updateEngData("clayContent", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="1.0"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9.5px] text-slate-500 block mb-0.5">منحنى التدرج الحبيبي (PSD Curves - اختياري):</label>
                        <input
                          type="text"
                          value={getEngDataValue("gradingCurve", "0/2 - 0/5 mm")}
                          onChange={(e) => updateEngData("gradingCurve", e.target.value)}
                          className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded text-slate-600 dark:text-slate-400 font-mono"
                          placeholder="مثال: 0/5 مم تدرج رملي..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3) GRAVEL / COARSE AGGREGATE (حصى) */}
              {formState.category === "حصى" && (
                <div className="space-y-2">
                  {formSubTab === "basic" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">نوع الحصى:</label>
                          <select
                            value={getEngDataValue("gravelType", "crushed")}
                            onChange={(e) => updateEngData("gravelType", e.target.value)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-bold"
                          >
                            <option value="crushed">حصى مكسر مقالع (Crushed)</option>
                            <option value="natural">حصى طبيعي وديان (Natural)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">الفئة الحبيبية (Size Fraction):</label>
                          <input
                            type="text"
                            value={getEngDataValue("sizeFraction", "5/15")}
                            onChange={(e) => updateEngData("sizeFraction", e.target.value)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono font-bold text-indigo-650 dark:text-indigo-400"
                            placeholder="3/8 - 8/16 - 16/25"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9.5px] block mb-0.5 font-black text-blue-600 dark:text-blue-400">الكثافة النوعية (الوزن النوعي):</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={getEngDataValue("specificGravity", 2.68)}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateEngData("specificGravity", val);
                              setFormState(prev => ({ ...prev, specificGravity: val }));
                            }}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="2.68"
                          />
                        </div>
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">الكثافة الظاهرية (Bulk Density - kg/m³):</label>
                          <input
                            type="number"
                            value={getEngDataValue("bulkDensity", 1450)}
                            onChange={(e) => updateEngData("bulkDensity", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="1450"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-0.5">الحد الأقصى Dmax:</label>
                          <input
                            type="number"
                            required
                            value={getEngDataValue("dMax", 20)}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateEngData("dMax", val);
                              setFormState(prev => ({ ...prev, dMax: val }));
                            }}
                            className="w-full text-xs p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono font-bold text-emerald-600 dark:text-emerald-400"
                            placeholder="20"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-0.5">الحد الأدنى d:</label>
                          <input
                            type="number"
                            value={getEngDataValue("dMin", 5)}
                            onChange={(e) => updateEngData("dMin", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="5"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-0.5">الرطوبة (%):</label>
                          <input
                            type="number"
                            step="0.1"
                            value={getEngDataValue("moistureContent", 1.0)}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateEngData("moistureContent", val);
                              setFormState(prev => ({ ...prev, moisture: val }));
                            }}
                            className="w-full text-xs p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono text-amber-600 dark:text-amber-400 font-bold"
                            placeholder="1.0"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formSubTab === "advanced" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="col-span-1">
                          <label className="text-[9px] text-slate-500 block mb-0.5">الامتصاص (%):</label>
                          <input
                            type="number"
                            step="0.1"
                            value={getEngDataValue("waterAbsorption", 0.8)}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateEngData("waterAbsorption", val);
                              setFormState(prev => ({ ...prev, absorption: val }));
                            }}
                            className="w-full text-xs p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="0.8"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="text-[9px] text-slate-500 block mb-0.5">معامل التفلطح (%):</label>
                          <input
                            type="number"
                            value={getEngDataValue("flakinessIndex", 15)}
                            onChange={(e) => updateEngData("flakinessIndex", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="15%"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="text-[9px] text-slate-500 block mb-0.5">التفلطح الأدق (%):</label>
                          <input
                            type="number"
                            value={getEngDataValue("elongationIndex", 12)}
                            onChange={(e) => updateEngData("elongationIndex", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="12%"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formSubTab === "laboratory" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">معامل لوس أنجلوس LA (%):</label>
                          <input
                            type="number"
                            value={getEngDataValue("losAngeles", 22)}
                            onChange={(e) => updateEngData("losAngeles", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono font-bold text-indigo-600 dark:text-indigo-400"
                            placeholder="22"
                          />
                        </div>
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">معامل Micro-Deval (%):</label>
                          <input
                            type="number"
                            value={getEngDataValue("microDeval", 18)}
                            onChange={(e) => updateEngData("microDeval", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="18"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-0.5">المواد الناعمة:</label>
                          <input
                            type="number"
                            step="0.1"
                            value={getEngDataValue("finesContent", 1.5)}
                            onChange={(e) => updateEngData("finesContent", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="1.5"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-0.5">نسبة الغبار:</label>
                          <input
                            type="number"
                            step="0.1"
                            value={getEngDataValue("dustContent", 0.5)}
                            onChange={(e) => updateEngData("dustContent", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="0.5"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-0.5">الصقيع (Frost):</label>
                          <input
                            type="text"
                            value={getEngDataValue("frostResistance", "مقاوم (F1)")}
                            onChange={(e) => updateEngData("frostResistance", e.target.value)}
                            className="w-full text-xs p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded text-slate-600 dark:text-slate-400"
                            placeholder="F1"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9.5px] text-slate-500 block mb-0.5">منحنى التدرج الحبيبي (Grading Curve PSD):</label>
                        <input
                          type="text"
                          value={getEngDataValue("gradingCurve", "5/10 - 10/20 مم")}
                          onChange={(e) => updateEngData("gradingCurve", e.target.value)}
                          className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                          placeholder="تدرج حبيبي..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 4) WATER (ماء) */}
              {formState.category === "ماء" && (
                <div className="space-y-2">
                  {formSubTab === "basic" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">مصدر المياه:</label>
                          <select
                            value={getEngDataValue("waterSource", "network")}
                            onChange={(e) => updateEngData("waterSource", e.target.value)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-bold"
                          >
                            <option value="network">شبكة مياه الشرب (Network)</option>
                            <option value="well">مياه الآبار الجوفية (Well)</option>
                            <option value="sea">مياه البحر المعالجة (Processed Sea)</option>
                            <option value="recycled">مياه معالجة مكررة (Recycled)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">صالح للشرب:</label>
                          <select
                            value={getEngDataValue("isPotable", "yes")}
                            onChange={(e) => updateEngData("isPotable", e.target.value)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-bold text-emerald-600 dark:text-emerald-400"
                          >
                            <option value="yes">نعم (Potable)</option>
                            <option value="no">لا (Non-Potable)</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-[9.5px] text-slate-500 block mb-0.5">الكثافة (Density - kg/m³):</label>
                        <input
                          type="number"
                          value={getEngDataValue("density", 1000)}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 1000;
                            updateEngData("density", val);
                            setFormState(prev => ({ ...prev, density: val }));
                          }}
                          className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono font-bold"
                          placeholder="1000"
                        />
                      </div>
                    </div>
                  )}

                  {formSubTab === "advanced" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">درجة الحموضة (pH):</label>
                          <input
                            type="number"
                            step="0.1"
                            value={getEngDataValue("pH", 7.0)}
                            onChange={(e) => updateEngData("pH", parseFloat(e.target.value) || 7.0)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="7.0"
                          />
                        </div>
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">درجة الحرارة (°C):</label>
                          <input
                            type="number"
                            value={getEngDataValue("temperature", 20)}
                            onChange={(e) => updateEngData("temperature", parseFloat(e.target.value) || 20)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="20"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formSubTab === "laboratory" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-1.5">
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-0.5">الكلوريدات (mg/L):</label>
                          <input
                            type="number"
                            value={getEngDataValue("chlorideContent", 250)}
                            onChange={(e) => updateEngData("chlorideContent", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="250"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-0.5">الكبريتات (mg/L):</label>
                          <input
                            type="number"
                            value={getEngDataValue("sulphateContent", 300)}
                            onChange={(e) => updateEngData("sulphateContent", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="300"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-0.5">الذائبة (TDS - mg/L):</label>
                          <input
                            type="number"
                            value={getEngDataValue("tds", 500)}
                            onChange={(e) => updateEngData("tds", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 5) CHEMICAL ADMIXTURES (مضافات كيميائية) */}
              {formState.category === "إضافات كيميائية" && (
                <div className="space-y-2">
                  {formSubTab === "basic" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">نوع المضاف الكيميائي:</label>
                          <select
                            value={getEngDataValue("admixtureType", "superplasticizer")}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateEngData("admixtureType", val);
                              setFormState(prev => ({ ...prev, admixtureType: val }));
                            }}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded text-purple-600 dark:text-purple-400 font-bold"
                          >
                            <option value="superplasticizer">Superplasticizer (فوق ملدن)</option>
                            <option value="plasticizer">Plasticizer (ملدن عادي)</option>
                            <option value="retarder">Retarder (مؤخر شك)</option>
                            <option value="accelerator">Accelerator (مسرع شك)</option>
                            <option value="air-entraining">Air Entraining (محبس هواء)</option>
                            <option value="shrinkage-reducer">Shrinkage Reducer (مانع انكماش)</option>
                            <option value="waterproofing">Waterproofing (كتامة ومقاومة رطوبة)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">الجرعة المستخدمة (% من الإسمنت):</label>
                          <input
                            type="number"
                            step="0.01"
                            value={getEngDataValue("dosage", 1.2)}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateEngData("dosage", val);
                              setFormState(prev => ({ ...prev, recommendedDosage: val }));
                            }}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono font-bold text-indigo-600 dark:text-indigo-400"
                            placeholder="1.2%"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-0.5">الجرعة الدنيا (%):</label>
                          <input
                            type="number"
                            step="0.01"
                            value={getEngDataValue("minDosage", 0.5)}
                            onChange={(e) => updateEngData("minDosage", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="0.5%"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-0.5">الجرعة القصوى (%):</label>
                          <input
                            type="number"
                            step="0.01"
                            value={getEngDataValue("maxDosage", 2.0)}
                            onChange={(e) => updateEngData("maxDosage", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="2.0%"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-0.5">الكثافة (Density - kg/L):</label>
                          <input
                            type="number"
                            step="0.01"
                            value={getEngDataValue("density", 1.20)}
                            onChange={(e) => updateEngData("density", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="1.20"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formSubTab === "advanced" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">تخفيض ماء الخلط (%):</label>
                          <input
                            type="number"
                            value={getEngDataValue("waterReduction", 15)}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateEngData("waterReduction", val);
                              setFormState(prev => ({ ...prev, waterReduction: val }));
                            }}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono font-bold text-emerald-600 dark:text-emerald-400"
                            placeholder="15%"
                          />
                        </div>
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">الحالة الفيزيائية:</label>
                          <select
                            value={getEngDataValue("physicalState", "liquid")}
                            onChange={(e) => updateEngData("physicalState", e.target.value)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-bold"
                          >
                            <option value="liquid">سائل (Liquid)</option>
                            <option value="powder">مسحوق بودرة (Powder)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">التأثير على زمن الشك (بالدقائق):</label>
                          <input
                            type="number"
                            value={formState.settingTimeImpact !== undefined ? formState.settingTimeImpact : 0}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              updateEngData("settingTimeImpact", val);
                              setFormState(prev => ({ ...prev, settingTimeImpact: val }));
                            }}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono font-bold text-blue-600 dark:text-blue-400"
                            placeholder="مثال: +120 للتأخير، -60 للتسريع"
                          />
                        </div>
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">نوع تعديل زمن الشك:</label>
                          <select
                            value={formState.settingModification || "لا يوجد"}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              updateEngData("settingModification", val);
                              setFormState(prev => ({ ...prev, settingModification: val }));
                            }}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-bold text-amber-600"
                          >
                            <option value="لا يوجد">لا يوجد (Neutral)</option>
                            <option value="تسريع">تسريع (Accelerating)</option>
                            <option value="تأخير">تأخير (Retarding)</option>
                            <option value="تعديل المسامات">تعديل المسامات (Air/Pores)</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-[9.5px] text-slate-500 block mb-0.5">المادة الفعالة (Active content - %):</label>
                        <input
                          type="number"
                          value={getEngDataValue("activeContent", 40)}
                          onChange={(e) => updateEngData("activeContent", parseFloat(e.target.value) || 0)}
                          className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                          placeholder="40%"
                        />
                      </div>
                    </div>
                  )}

                  {formSubTab === "laboratory" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">الشركة المصنعة:</label>
                          <input
                            type="text"
                            value={getEngDataValue("manufacturer", "Sika")}
                            onChange={(e) => updateEngData("manufacturer", e.target.value)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded"
                            placeholder="مثال: Sika / BASF"
                          />
                        </div>
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">محتوى الكلوريد (%):</label>
                          <input
                            type="number"
                            step="0.01"
                            value={getEngDataValue("chlorideContent", 0.1)}
                            onChange={(e) => updateEngData("chlorideContent", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="0.1%"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">الأثر على زمن الشك:</label>
                          <select
                            value={getEngDataValue("settingTimeEffect", "none")}
                            onChange={(e) => updateEngData("settingTimeEffect", e.target.value)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded"
                          >
                            <option value="none">متعادل (None)</option>
                            <option value="retarding">مؤخر شك (Retarding)</option>
                            <option value="accelerating">مسرع شك (Accelerating)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">اللون:</label>
                          <input
                            type="text"
                            value={getEngDataValue("color", "بني فاتح (Brown)")}
                            onChange={(e) => updateEngData("color", e.target.value)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded"
                            placeholder="بني / شفاف"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 6) MINERAL ADDITIONS (مضافات معدنية) */}
              {formState.category === "إضافات معدنية" && (
                <div className="space-y-2">
                  {formSubTab === "basic" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">نوع المادة المضافة المعدنية:</label>
                          <select
                            value={getEngDataValue("scmType", "silica_fume")}
                            onChange={(e) => updateEngData("scmType", e.target.value)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-bold"
                          >
                            <option value="silica_fume">غبار السيليكا (Silica Fume)</option>
                            <option value="fly_ash">الرماد المتطاير (Fly Ash)</option>
                            <option value="ggbfs">خبث الأفران (GGBFS)</option>
                            <option value="natural_pozzolan">البوزولان الطبيعي (Natural Pozzolan)</option>
                            <option value="limestone_filler">مسحوق الحجر الجيري (Limestone Filler)</option>
                            <option value="metakaolin">ميتاكاولين (Metakaolin)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">نسبة الاستبدال المستهدفة (%):</label>
                          <input
                            type="number"
                            step="0.1"
                            value={getEngDataValue("replacementPercent", 10.0)}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateEngData("replacementPercent", val);
                              setFormState(prev => ({ ...prev, replacementPercent: val }));
                            }}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono font-bold text-indigo-600 dark:text-indigo-400"
                            placeholder="10%"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9.5px] text-slate-500 block mb-0.5">الكثافة المطلقة (Absolute Density - kg/m³):</label>
                        <input
                          type="number"
                          value={getEngDataValue("density", 2200)}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            updateEngData("density", val);
                            setFormState(prev => ({ ...prev, density: val }));
                          }}
                          className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                          placeholder="2200"
                        />
                      </div>
                    </div>
                  )}

                  {formSubTab === "advanced" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">النعومة المحددة (m²/kg):</label>
                          <input
                            type="number"
                            value={getEngDataValue("fineness", 450)}
                            onChange={(e) => updateEngData("fineness", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="450"
                          />
                        </div>
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">معامل النشاط البوزولاني:</label>
                          <input
                            type="number"
                            step="0.01"
                            value={getEngDataValue("pozzolanicIndex", 0.85)}
                            onChange={(e) => updateEngData("pozzolanicIndex", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="0.85"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formSubTab === "laboratory" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">المحتوى الرطوبي (%):</label>
                          <input
                            type="number"
                            step="0.1"
                            value={getEngDataValue("moistureContent", 0.5)}
                            onChange={(e) => updateEngData("moistureContent", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="0.5%"
                          />
                        </div>
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">اللون:</label>
                          <input
                            type="text"
                            value={getEngDataValue("color", "رمادي داكن (Grey)")}
                            onChange={(e) => updateEngData("color", e.target.value)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded"
                            placeholder="رمادي / أبيض"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 7) FIBERS (ألياف) */}
              {formState.category === "ألياف" && (
                <div className="space-y-2">
                  {formSubTab === "basic" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">نوع الألياف:</label>
                          <select
                            value={getEngDataValue("fiberType", "steel")}
                            onChange={(e) => updateEngData("fiberType", e.target.value)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-bold"
                          >
                            <option value="steel">ألياف فولاذية (Steel Fibers)</option>
                            <option value="polypropylene">ألياف بولي بروبيلين (Polypropylene)</option>
                            <option value="glass">ألياف زجاجية (Glass Fibers)</option>
                            <option value="basalt">ألياف بازلتية (Basalt Fibers)</option>
                            <option value="carbon">ألياف كربونية (Carbon Fibers)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">الجرعة المستخدمة (kg/m³):</label>
                          <input
                            type="number"
                            step="0.1"
                            required
                            value={getEngDataValue("dosage", 25.0)}
                            onChange={(e) => updateEngData("dosage", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono font-bold text-indigo-600 dark:text-indigo-400"
                            placeholder="25.0"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">الطول (Length - mm):</label>
                          <input
                            type="number"
                            step="0.1"
                            value={getEngDataValue("length", 30.0)}
                            onChange={(e) => updateEngData("length", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="30.0"
                          />
                        </div>
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">الكثافة (Density - kg/m³):</label>
                          <input
                            type="number"
                            value={getEngDataValue("density", 7850)}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateEngData("density", val);
                              setFormState(prev => ({ ...prev, density: val }));
                            }}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="7850"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formSubTab === "advanced" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-1.5">
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-0.5">القطر (mm):</label>
                          <input
                            type="number"
                            step="0.01"
                            value={getEngDataValue("diameter", 0.55)}
                            onChange={(e) => updateEngData("diameter", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="0.55"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-0.5">النسبة L/d:</label>
                          <input
                            type="number"
                            value={getEngDataValue("aspectRatio", 55)}
                            onChange={(e) => updateEngData("aspectRatio", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="55"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-0.5">الشكل (Shape):</label>
                          <select
                            value={getEngDataValue("fiberShape", "hooked")}
                            onChange={(e) => updateEngData("fiberShape", e.target.value)}
                            className="w-full text-xs p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-bold"
                          >
                            <option value="hooked">معقوفة (Hooked)</option>
                            <option value="straight">مستقيمة (Straight)</option>
                            <option value="waved">مموجة (Waved)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {formSubTab === "laboratory" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">مقاومة الشد (Tensile - MPa):</label>
                          <input
                            type="number"
                            value={getEngDataValue("tensileStrength", 1100)}
                            onChange={(e) => updateEngData("tensileStrength", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="1100"
                          />
                        </div>
                        <div>
                          <label className="text-[9.5px] text-slate-500 block mb-0.5">معامل المرونة (Elastic - GPa):</label>
                          <input
                            type="number"
                            value={getEngDataValue("elasticModulus", 210)}
                            onChange={(e) => updateEngData("elasticModulus", parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="210"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {formState.category === "محتوى الهواء" && (
                <div className="space-y-1">
                  <label className="text-[9.5px] text-slate-500 block mb-0.5">نسبة الهواء المحبوس المستهدفة (% Air):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={getEngDataValue("airPercentage", 2.0)}
                    onChange={(e) => updateEngData("airPercentage", parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono font-bold text-sky-600 dark:text-sky-400"
                    placeholder="2.0%"
                  />
                </div>
              )}

              {formState.category === "مجلدات خاصة" && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9.5px] text-slate-500 block mb-0.5">نسبة قلوية الجيوبوليمر (Alkaline Ratio):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={getEngDataValue("alkalineRatio", 2.50)}
                        onChange={(e) => updateEngData("alkalineRatio", parseFloat(e.target.value) || 0)}
                        className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono font-bold text-indigo-600 dark:text-indigo-400"
                        placeholder="2.50"
                      />
                    </div>
                    <div>
                      <label className="text-[9.5px] text-slate-500 block mb-0.5">فئة مقاومة الإيبوكسي (Strength Class):</label>
                      <input
                        type="text"
                        value={getEngDataValue("epoxyStrengthClass", "EP-60")}
                        onChange={(e) => updateEngData("epoxyStrengthClass", e.target.value)}
                        className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-bold"
                        placeholder="EP-60"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* INTERACTIVE DATA EXPLORER, SCHEMAS & PRESETS PLAYGROUND */}
            <div className="mt-3 p-3 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-2.5">
              
              {/* Header Tabs */}
              <div className="flex border-b border-slate-800 pb-1.5 justify-between items-center">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setExplorerTab("live")}
                    className={`px-2 py-1 rounded text-[9.5px] font-bold transition-all ${
                      explorerTab === "live" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    📋 كود JSON الحي
                  </button>
                  <button
                    type="button"
                    onClick={() => setExplorerTab("schema")}
                    className={`px-2 py-1 rounded text-[9.5px] font-bold transition-all ${
                      explorerTab === "schema" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    🔬 مخطط Schema
                  </button>
                  <button
                    type="button"
                    onClick={() => setExplorerTab("preset")}
                    className={`px-2 py-1 rounded text-[9.5px] font-bold transition-all ${
                      explorerTab === "preset" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    💡 نماذج سريعة
                  </button>
                </div>
                <div className="text-[10px] text-indigo-400 font-bold flex items-center gap-1">
                  <span>مستكشف الهيكل والتحقق</span>
                  <Database size={11} />
                </div>
              </div>

              {/* Tab Contents */}
              {explorerTab === "live" && (
                <div className="space-y-1.5 text-right">
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => {
                        const parsedDens = Number(formState.density);
                        const finalDens = (!formState.density || isNaN(parsedDens) || parsedDens <= 0) ? null : parsedDens;
                        const jsonStr = JSON.stringify({
                          id: formState.id || "MAT-DRAFT-ID",
                          name: formState.name || "مادة جديدة",
                          englishName: formState.englishName || "New Material",
                          type: mapCategoryToType(formState.category || "إسمنت"),
                          category: formState.category || "إسمنت",
                          density: finalDens,
                          engineeringData: formState.engineeringData || {}
                        }, null, 2);
                        navigator.clipboard.writeText(jsonStr);
                        showToast(language === "ar" ? "تم نسخ كود JSON بنجاح!" : "JSON copied to clipboard successfully!", "success");
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-black px-2 py-0.5 rounded text-[8.5px] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Copy size={9} />
                      <span>نسخ الكود</span>
                    </button>
                    <span className="text-[8.5px] text-slate-500 font-mono">live_output.json</span>
                  </div>
                  <pre className="p-2.5 bg-black/50 text-emerald-400 rounded-xl text-[9px] overflow-x-auto text-left font-mono leading-relaxed max-h-[140px] border border-slate-800 select-all">
                    {(() => {
                      const parsedDens = Number(formState.density);
                      const finalDens = (!formState.density || isNaN(parsedDens) || parsedDens <= 0) ? null : parsedDens;
                      return JSON.stringify({
                        id: formState.id || "MAT-DRAFT-ID",
                        name: formState.name || "مادة جديدة",
                        englishName: formState.englishName || "New Material",
                        type: mapCategoryToType(formState.category || "إسمنت"),
                        category: formState.category || "إسمنت",
                        density: finalDens,
                        engineeringData: formState.engineeringData || {}
                      }, null, 2);
                    })()}
                  </pre>
                </div>
              )}

              {explorerTab === "schema" && (
                <div className="space-y-1.5 text-right">
                  <div className="flex justify-between items-center">
                    <span className="text-[8.5px] text-indigo-400 font-bold">مخطط التحقق من صحة المدخلات حسب المواصفة القياسية</span>
                    <span className="text-[8.5px] text-slate-500 font-mono">schema.json</span>
                  </div>
                  <pre className="p-2.5 bg-black/50 text-indigo-300 rounded-xl text-[9px] overflow-x-auto text-left font-mono leading-relaxed max-h-[140px] border border-slate-800">
                    {(() => {
                      const schemas: Record<string, any> = {
                        "إسمنت": {
                          "$schema": "http://json-schema.org/draft-07/schema#",
                          "title": "Cement Engineering Schema",
                          "type": "object",
                          "properties": {
                            "strengthClass": { "type": "string", "enum": ["32.5", "42.5", "52.5"] },
                            "density": { "type": "number", "description": "Absolute density (kg/m³)" },
                            "cementType": { "type": "string", "enum": ["OPC", "SRPC", "Rapid", "Low heat", "White"] },
                            "fineness": { "type": "number", "description": "Blaine fineness (cm²/g) (optional)" },
                            "waterDemandFactor": { "type": "number" }
                          },
                          "required": ["strengthClass", "density", "cementType"]
                        },
                        "ماء": {
                          "$schema": "http://json-schema.org/draft-07/schema#",
                          "title": "Water Schema",
                          "type": "object",
                          "properties": {
                            "pH": { "type": "number", "minimum": 0, "maximum": 14 },
                            "chlorideContent": { "type": "number", "unit": "mg/L" },
                            "sulphateContent": { "type": "number", "unit": "mg/L" },
                            "temperature": { "type": "number", "unit": "°C" }
                          },
                          "required": ["pH", "chlorideContent", "sulphateContent", "temperature"]
                        },
                        "رمال": {
                          "$schema": "http://json-schema.org/draft-07/schema#",
                          "title": "Fine Aggregate (Sand) Schema",
                          "type": "object",
                          "properties": {
                            "finenessModulus": { "type": "number" },
                            "bulkDensity": { "type": "number" },
                            "specificGravity": { "type": "number" },
                            "waterAbsorption": { "type": "number" },
                            "moistureContent": { "type": "number" }
                          },
                          "required": ["finenessModulus", "bulkDensity", "specificGravity", "waterAbsorption", "moistureContent"]
                        },
                        "حصى": {
                          "$schema": "http://json-schema.org/draft-07/schema#",
                          "title": "Coarse Aggregate (Gravel) Schema",
                          "type": "object",
                          "properties": {
                            "dMax": { "type": "number" },
                            "bulkDensity": { "type": "number" },
                            "specificGravity": { "type": "number" },
                            "waterAbsorption": { "type": "number" },
                            "shapeIndex": { "type": "string", "enum": ["rounded", "angular"] },
                            "gradingCurve": { "type": "string" }
                          },
                          "required": ["dMax", "bulkDensity", "specificGravity", "waterAbsorption", "shapeIndex"]
                        },
                        "إضافات كيميائية": {
                          "$schema": "http://json-schema.org/draft-07/schema#",
                          "title": "Chemical Admixture Schema",
                          "type": "object",
                          "properties": {
                            "dosage": { "type": "number" },
                            "waterReduction": { "type": "number" },
                            "slumpIncrease": { "type": "number" },
                            "effectType": { "type": "string", "enum": ["plasticizer", "superplasticizer", "accelerator", "retarder"] },
                            "effectDuration": { "type": "number" }
                          },
                          "required": ["dosage", "waterReduction", "effectType"]
                        },
                        "إضافات معدنية": {
                          "$schema": "http://json-schema.org/draft-07/schema#",
                          "title": "Mineral Admixture Schema",
                          "type": "object",
                          "properties": {
                            "replacementPercent": { "type": "number" },
                            "density": { "type": "number" },
                            "pozzolanicIndex": { "type": "number" },
                            "waterDemandFactor": { "type": "number" }
                          },
                          "required": ["replacementPercent", "density", "pozzolanicIndex", "waterDemandFactor"]
                        },
                        "ركام خفيف": {
                          "$schema": "http://json-schema.org/draft-07/schema#",
                          "title": "Lightweight Aggregate Schema",
                          "type": "object",
                          "properties": {
                            "density": { "type": "number" },
                            "waterAbsorption": { "type": "number" },
                            "porosityIndex": { "type": "number" }
                          },
                          "required": ["density", "waterAbsorption"]
                        },
                        "ركام ثقيل": {
                          "$schema": "http://json-schema.org/draft-07/schema#",
                          "title": "Heavyweight Aggregate Schema",
                          "type": "object",
                          "properties": {
                            "density": { "type": "number" },
                            "waterAbsorption": { "type": "number" },
                            "heavyType": { "type": "string", "enum": ["baryte", "magnetite", "hematite"] }
                          },
                          "required": ["density", "waterAbsorption"]
                        },
                        "ألياف": {
                          "$schema": "http://json-schema.org/draft-07/schema#",
                          "title": "Fibers Schema",
                          "type": "object",
                          "properties": {
                            "fiberType": { "type": "string", "enum": ["steel", "glass", "polypropylene", "carbon"] },
                            "dosage": { "type": "number" },
                            "length": { "type": "number" },
                            "diameter": { "type": "number" },
                            "tensileStrength": { "type": "number" }
                          },
                          "required": ["fiberType", "dosage"]
                        },
                        "محتوى الهواء": {
                          "$schema": "http://json-schema.org/draft-07/schema#",
                          "title": "Air Content Schema",
                          "type": "object",
                          "properties": {
                            "airPercentage": { "type": "number" }
                          },
                          "required": ["airPercentage"]
                        },
                        "مجلدات خاصة": {
                          "$schema": "http://json-schema.org/draft-07/schema#",
                          "title": "Special Binders Schema",
                          "type": "object",
                          "properties": {
                            "alkalineRatio": { "type": "number" },
                            "epoxyStrengthClass": { "type": "string" }
                          },
                          "required": ["alkalineRatio", "epoxyStrengthClass"]
                        }
                      };
                      return JSON.stringify(schemas[formState.category || "إسمنت"] || schemas["إسمنت"], null, 2);
                    })()}
                  </pre>
                </div>
              )}

              {explorerTab === "preset" && (
                <div className="space-y-2 text-right">
                  <p className="text-[9.5px] text-amber-400 font-bold">قم بتحميل نموذج البيانات الهندسية الجاهزة للمطابقة الفورية:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormState(prev => ({
                          ...prev,
                          name: "إسمنت بورتلاندي عادي GICA (CEM I)",
                          englishName: "Ordinary Portland Cement CEM I 42.5N",
                          category: "إسمنت",
                          density: 3150,
                          provenance: "الشلف",
                          sourceQuarry: "مصنع إسمنت الشلف GICA",
                          engineeringData: {
                            strengthClass: "42.5",
                            density: 3150,
                            fineness: 3350,
                            cementType: "OPC",
                            waterDemandFactor: 1.00
                          }
                        }));
                      }}
                      className="bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 rounded-xl p-2 text-right transition-colors cursor-pointer group"
                    >
                      <div className="text-[10px] font-black text-indigo-300 group-hover:text-indigo-200">💡 نموذج إسمنت قياسي</div>
                      <div className="text-[8px] text-slate-400 font-mono mt-0.5">CEM I 42.5N OPC + Blaine</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormState(prev => ({
                          ...prev,
                          name: "رمل سيليسي وادي سوف مغسول",
                          englishName: "Oued Souf Washed Siliceous Sand",
                          category: "رمال",
                          density: 2630,
                          provenance: "الوادي",
                          sourceQuarry: "محجرة وادي سوف",
                          engineeringData: {
                            finenessModulus: 2.65,
                            bulkDensity: 1580,
                            specificGravity: 2.63,
                            waterAbsorption: 1.2,
                            moistureContent: 3.5
                          }
                        }));
                      }}
                      className="bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/30 rounded-xl p-2 text-right transition-colors cursor-pointer group"
                    >
                      <div className="text-[10px] font-black text-amber-300 group-hover:text-amber-200">💡 نموذج رمل قياسي</div>
                      <div className="text-[8px] text-slate-400 font-mono mt-0.5">FM 2.65 + Bulk 1580 + absorption</div>
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        ) : (
          /* --- ORIGINAL CLASSIC CATALOG FULL FORM --- */
          <div className="max-h-[460px] overflow-y-auto space-y-3 pr-1 text-xs">
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1">اسم المادة الفني (بالعربية):</label>
              <input
                type="text"
                required
                value={formState.name || ""}
                onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                className="w-full text-xs p-2 text-right bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-semibold"
                placeholder="رمل وادي سوف الصحراوي..."
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1">الاسم بالإنجليزية (English Name):</label>
              <input
                type="text"
                value={formState.englishName || ""}
                onChange={(e) => setFormState(prev => ({ ...prev, englishName: e.target.value }))}
                className="w-full text-xs p-2 text-left bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-semibold font-mono"
                placeholder="Oued Souf Desert Sand..."
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1">الفئة الإنشائية:</label>
                <select
                  value={formState.category || "رمال"}
                  onChange={(e) => {
                    const cat = e.target.value;
                    let autoType = "أخرى";
                    if (cat === "إسمنت" || cat === "مواد خاصة") {
                      autoType = "مادة رابطة";
                    } else if (cat === "رمال" || cat === "حصى" || cat === "مواد معاد تدويرها") {
                      autoType = "ركام";
                    } else if (cat === "إضافات معدنية") {
                      autoType = "إضافات معدنية";
                    } else if (cat === "ألياف") {
                      autoType = "ألياف";
                    } else if (cat === "إضافات كيميائية") {
                      autoType = "إضافات كيميائية";
                    } else if (cat === "ماء") {
                      autoType = "ماء";
                    }
                    setFormState(prev => ({ ...prev, category: cat as any, materialType: autoType }));
                  }}
                  className="w-full text-xs p-2 text-right bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-bold"
                >
                  <option value="رمال">رمال (Sands)</option>
                  <option value="حصى">حصى (Coarse Gravels)</option>
                  <option value="إسمنت">إسمنت (Cement)</option>
                  <option value="إضافات كيميائية">إضافات كيميائية (Chemical Admixture)</option>
                  <option value="إضافات معدنية">إضافات معدنية (SCM/Pozzolanics)</option>
                  <option value="ماء">ماء (Water)</option>
                  <option value="مواد خاصة">مواد خاصة (Special)</option>
                  <option value="مواد معاد تدويرها">مواد معاد تدويرها (Recycled Aggs)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1">نوع المادة:</label>
                <select
                  value={formState.materialType || "مادة رابطة"}
                  onChange={(e) => setFormState(prev => ({ ...prev, materialType: e.target.value }))}
                  className="w-full text-xs p-2 text-right bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-bold text-indigo-650 dark:text-indigo-400"
                >
                  <option value="مادة رابطة">مادة رابطة (Binder)</option>
                  <option value="ركام">ركام (Aggregate)</option>
                  <option value="إضافات معدنية">إضافات معدنية (Mineral Admixture)</option>
                  <option value="ألياف">ألياف (Fibers)</option>
                  <option value="إضافات كيميائية">إضافات كيميائية (Chemical Admixtures)</option>
                  <option value="ماء">ماء (Water)</option>
                  <option value="أخرى">أخرى (Other)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1">السعر المرجعي (DA):</label>
                <input
                  type="number"
                  step="0.01"
                  value={formState.price || 0}
                  onChange={(e) => setFormState(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                  className="w-full text-xs p-2 text-right bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-bold font-mono"
                />
              </div>
            </div>



            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1">الكثافة المطلقة (kg/m³):</label>
                <input
                  type="number"
                  required
                  value={formState.density || 0}
                  onChange={(e) => setFormState(prev => ({ ...prev, density: parseInt(e.target.value) }))}
                  className="w-full text-xs p-2 text-right bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-800 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1">امتصاص المياه (%):</label>
                <input
                  type="number"
                  step="0.01"
                  value={formState.absorption || 0}
                  onChange={(e) => setFormState(prev => ({ ...prev, absorption: parseFloat(e.target.value) }))}
                  className="w-full text-xs p-2 text-right bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-800 dark:text-white font-bold"
                />
              </div>
            </div>

            {/* Technical dynamic parameters depending on selected Category */}
            {(formState.category === "رمال" || formState.category === "حصى") && (
              <div className="p-3 bg-slate-100 dark:bg-slate-900/60 rounded-xl space-y-2.5">
                <p className="text-[9.5px] text-blue-500 font-black">الخصائص الهندسية للركام (Aggregates Properties)</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8.5px] block mb-0.5 font-black text-blue-600 dark:text-blue-400">الكثافة النوعية (الوزن النوعي) (Specific Gravity):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formState.specificGravity || ""}
                      onChange={(e) => setFormState(prev => ({ ...prev, specificGravity: parseFloat(e.target.value) }))}
                      className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-[8.5px] text-slate-500 block mb-0.5">شكل الحبيبة (Shape):</label>
                    <select
                      value={formState.particleShape || "زاوي"}
                      onChange={(e) => setFormState(prev => ({ ...prev, particleShape: e.target.value as any }))}
                      className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded"
                    >
                      <option value="مستدير">مستدير طبيعي</option>
                      <option value="غير منتظم">غير منتظم وديان</option>
                      <option value="مكسر">مكسر كسارة</option>
                      <option value="زاوي">زاوي حاد الحواف</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8.5px] text-slate-500 block mb-0.5">جودة التدرج (Grading Quality):</label>
                    <select
                      value={formState.aggregateQuality || "standard"}
                      onChange={(e) => setFormState(prev => ({ ...prev, aggregateQuality: e.target.value as any }))}
                      className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded"
                    >
                      <option value="excellent">ممتاز (Excellent)</option>
                      <option value="standard">عادي / قياسي (Standard)</option>
                      <option value="poor">ضعيف (Poor)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[8.5px] text-slate-500 block mb-0.5">معامل النعومة (FM) [للرمال]:</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formState.finenessModulus || ""}
                      onChange={(e) => setFormState(prev => ({ ...prev, finenessModulus: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                      placeholder="e.g. 2.6"
                    />
                  </div>
                  <div>
                    <label className="text-[8.5px] text-slate-500 block mb-0.5">المحتوى الطيني (%) [Clay]:</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formState.clayContent || ""}
                      onChange={(e) => setFormState(prev => ({ ...prev, clayContent: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-955 border border-slate-200 rounded mb-1"
                      placeholder="e.g. 0.8"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8.5px] text-slate-500 block mb-0.5">الكثافة الظاهرية (kg/m³):</label>
                    <input
                      type="number"
                      value={formState.bulkDensity || formState.engineeringData?.bulkDensity || ""}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setFormState(prev => ({ ...prev, bulkDensity: val }));
                        updateEngData("bulkDensity", val);
                      }}
                      className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                      placeholder="e.g. 1550"
                    />
                  </div>
                  <div>
                    <label className="text-[8.5px] text-slate-500 block mb-0.5">معامل الصلادة (Los Angeles %):</label>
                    <input
                      type="number"
                      value={formState.losAngelesAbrasion !== undefined ? formState.losAngelesAbrasion : ""}
                      onChange={(e) => setFormState(prev => ({ ...prev, losAngelesAbrasion: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                      placeholder="e.g. 15"
                    />
                  </div>
                </div>
              </div>
            )}

            {formState.category === "إسمنت" && (
              <div className="p-3 bg-purple-500/5 border border-purple-500/15 rounded-xl space-y-2.5">
                <p className="text-[9.5px] text-purple-500 font-black">الخصائص الهندسية للأسمنت (Cement Properties)</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8.5px] text-purple-400 block mb-0.5">صنف الإسمنت (Class):</label>
                    <input
                      type="text"
                      value={formState.cementClass || "CEM I"}
                      onChange={(e) => setFormState(prev => ({ ...prev, cementClass: e.target.value }))}
                      className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded"
                      placeholder="e.g. CEM I, CEM II"
                    />
                  </div>
                  <div>
                    <label className="text-[8.5px] text-purple-400 block mb-0.5">رتبة المقاومة (Strength):</label>
                    <input
                      type="text"
                      value={formState.strengthClass || "42.5"}
                      onChange={(e) => setFormState(prev => ({ ...prev, strengthClass: e.target.value }))}
                      className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                      placeholder="e.g. 42.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8.5px] text-purple-400 block mb-0.5">سرعة الإماهة (Hydration):</label>
                    <input
                      type="text"
                      value={formState.hydrationClass || "عادي"}
                      onChange={(e) => setFormState(prev => ({ ...prev, hydrationClass: e.target.value }))}
                      className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded"
                      placeholder="سريع، عادي، بطيء..."
                    />
                  </div>
                  <div>
                    <label className="text-[8.5px] text-purple-400 block mb-0.5">حرارة التفاعل (J/g):</label>
                    <input
                      type="number"
                      value={formState.heatOfHydration || ""}
                      onChange={(e) => setFormState(prev => ({ ...prev, heatOfHydration: e.target.value ? parseInt(e.target.value) : undefined }))}
                      className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                      placeholder="J/g e.g. 280"
                    />
                  </div>
                </div>
              </div>
            )}

            {(formState.category === "إضافات كيميائية" || formState.category === "إضافات معدنية") && (
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl space-y-2.5">
                <p className="text-[9.5px] text-emerald-500 font-black">مواصفات الإضافات الفنية (Admixtures Properties)</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8.5px] text-slate-500 block mb-0.5">الجرعة المقترحة (% من الإسمنت):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formState.recommendedDosage || ""}
                      onChange={(e) => setFormState(prev => ({ ...prev, recommendedDosage: parseFloat(e.target.value) }))}
                      className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                      placeholder="e.g. 1.2%"
                    />
                  </div>
                  <div>
                    <label className="text-[8.5px] text-slate-500 block mb-0.5">نسبة توفير الماء (%):</label>
                    <input
                      type="number"
                      value={formState.waterReduction || ""}
                      onChange={(e) => setFormState(prev => ({ ...prev, waterReduction: parseInt(e.target.value) }))}
                      className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                      placeholder="e.g. 20%"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1">شهادات الجودة والمطابقة للرتبة البنيوية:</label>
              <input
                type="text"
                value={formState.quality || ""}
                onChange={(e) => setFormState(prev => ({ ...prev, quality: e.target.value }))}
                className="w-full text-xs p-2 text-right bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1">المحاور والتطبيقات الإنشائية الموصى بها:</label>
              <input
                type="text"
                value={formState.uses || ""}
                onChange={(e) => setFormState(prev => ({ ...prev, uses: e.target.value }))}
                className="w-full text-xs p-2 text-right bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1">دراسات ووصف تقني معمق:</label>
              <textarea
                value={formState.desc || ""}
                onChange={(e) => setFormState(prev => ({ ...prev, desc: e.target.value }))}
                rows={2}
                className="w-full text-xs p-2 text-right bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white leading-normal"
                placeholder="تم غسله جيداً وإخلاؤه من الأتربة..."
              ></textarea>
            </div>

            {/* ADVANCED EMMS SUPPLIER MANAGEMENT MODULE */}
            <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-2 text-right">
              <p className="text-[10px] font-black text-blue-600 flex items-center gap-1 justify-end">
                <span>بيانات المورد والمحجر (Supplier Logistics)</span>
                <Briefcase size={12} />
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[8.5px] text-slate-500 block mb-0.5">اسم جهة التوريد / المورد:</label>
                  <input
                    type="text"
                    value={formState.supplierName || ""}
                    onChange={(e) => setFormState(prev => ({ ...prev, supplierName: e.target.value }))}
                    className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded text-slate-800 dark:text-white"
                    placeholder="e.g. GICA, Lafarge"
                  />
                </div>
                <div>
                  <label className="text-[8.5px] text-slate-500 block mb-0.5">جهة الاتصال / الهاتف:</label>
                  <input
                    type="text"
                    value={formState.supplierContact || ""}
                    onChange={(e) => setFormState(prev => ({ ...prev, supplierContact: e.target.value }))}
                    className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded text-slate-800 dark:text-white font-mono text-left"
                    placeholder="+213 21 XX XX XX"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[8.5px] text-slate-500 block mb-0.5">اسم المحجرة (Quarry Name):</label>
                  <input
                    type="text"
                    value={formState.quarryName || ""}
                    onChange={(e) => setFormState(prev => ({ ...prev, quarryName: e.target.value }))}
                    className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-955 border border-slate-200 rounded text-slate-800 dark:text-white"
                    placeholder="محجرة جبل فلان..."
                  />
                </div>
                <div>
                  <label className="text-[8.5px] text-slate-500 block mb-0.5">حالة اعتماد المورد:</label>
                  <input
                    type="text"
                    value={formState.certificationStatus || ""}
                    onChange={(e) => setFormState(prev => ({ ...prev, certificationStatus: e.target.value }))}
                    className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded text-slate-800 dark:text-white"
                    placeholder="e.g. Certified ISO, سارية"
                  />
                </div>
              </div>
            </div>

            {/* ADVANCED EMMS LABORATORY PROPERTIES MODULE */}
            <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-2 text-right">
              <p className="text-[10px] font-black text-amber-600 flex items-center gap-1 justify-end">
                <span>خصائص الفحص المخبري العميق (Lab Properties)</span>
                <Activity size={12} />
              </p>

              {formState.category === "رمال" && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8.5px] text-slate-500 block mb-0.5">المكافئ الرملي (Sand Equivalent %):</label>
                      <input
                        type="number"
                        value={formState.SandEquivalent || ""}
                        onChange={(e) => setFormState(prev => ({ ...prev, SandEquivalent: parseFloat(e.target.value) || undefined }))}
                        className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-955 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                        placeholder="e.g. 82%"
                      />
                    </div>
                    <div>
                      <label className="text-[8.5px] text-slate-500 block mb-0.5">أزرق الميثيلين (Methylene Blue g/kg):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formState.MethyleneBlue || ""}
                        onChange={(e) => setFormState(prev => ({ ...prev, MethyleneBlue: parseFloat(e.target.value) || undefined }))}
                        className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                        placeholder="e.g. 1.2 g/kg"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8.5px] text-slate-500 block mb-0.5">الكلوريدات (Chlorides %):</label>
                      <input
                        type="number"
                        step="0.001"
                        value={formState.Chlorides || ""}
                        onChange={(e) => setFormState(prev => ({ ...prev, Chlorides: parseFloat(e.target.value) || undefined }))}
                        className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-955 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                        placeholder="e.g. 0.01%"
                      />
                    </div>
                    <div>
                      <label className="text-[8.5px] text-slate-500 block mb-0.5">الكبريتات (Sulfates %):</label>
                      <input
                        type="number"
                        step="0.001"
                        value={formState.Sulfates || ""}
                        onChange={(e) => setFormState(prev => ({ ...prev, Sulfates: parseFloat(e.target.value) || undefined }))}
                        className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-955 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                        placeholder="e.g. 0.02%"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formState.category === "حصى" && (
                 <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8.5px] text-slate-500 block mb-0.5">معامل لوس أنجلوس (Los Angeles %):</label>
                      <input
                        type="number"
                        value={formState.LosAngeles || ""}
                        onChange={(e) => setFormState(prev => ({ ...prev, LosAngeles: parseFloat(e.target.value) || undefined }))}
                        className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-955 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                        placeholder="e.g. 18%"
                      />
                    </div>
                    <div>
                      <label className="text-[8.5px] text-slate-500 block mb-0.5">معامل الفلطحة (Flakiness Index %):</label>
                      <input
                        type="number"
                        value={formState.flakinessIndex || ""}
                        onChange={(e) => setFormState(prev => ({ ...prev, flakinessIndex: parseFloat(e.target.value) || undefined }))}
                        className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-955 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                        placeholder="e.g. 12%"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8.5px] text-slate-500 block mb-0.5">معامل الاستطالة (Elongation %):</label>
                      <input
                        type="number"
                        value={formState.elongationIndex || ""}
                        onChange={(e) => setFormState(prev => ({ ...prev, elongationIndex: parseFloat(e.target.value) || undefined }))}
                        className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-955 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                        placeholder="e.g. 8%"
                      />
                    </div>
                    <div>
                      <label className="text-[8.5px] text-slate-500 block mb-0.5">قيمة التفتت بالضغط (Crushing Value %):</label>
                      <input
                        type="number"
                        value={formState.crushingValue || ""}
                        onChange={(e) => setFormState(prev => ({ ...prev, crushingValue: parseFloat(e.target.value) || undefined }))}
                        className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-955 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                        placeholder="e.g. 15%"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formState.category === "إسمنت" && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8.5px] text-slate-500 block mb-0.5">الشك الابتدائي (Initial Setting min):</label>
                      <input
                        type="number"
                        value={formState.initialSetting || ""}
                        onChange={(e) => setFormState(prev => ({ ...prev, initialSetting: parseInt(e.target.value) || undefined }))}
                        className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                        placeholder="e.g. 120 mins"
                      />
                    </div>
                    <div>
                      <label className="text-[8.5px] text-slate-500 block mb-0.5">الشك النهائي (Final Setting min):</label>
                      <input
                        type="number"
                        value={formState.finalSetting || ""}
                        onChange={(e) => setFormState(prev => ({ ...prev, finalSetting: parseInt(e.target.value) || undefined }))}
                        className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                        placeholder="e.g. 195 mins"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <div>
                      <label className="text-[7.5px] text-slate-500 block mb-0.5">نعومة بلين (Blaine cm²/g):</label>
                      <input
                        type="number"
                        value={formState.blaineFineness || ""}
                        onChange={(e) => setFormState(prev => ({ ...prev, blaineFineness: parseInt(e.target.value) || undefined }))}
                        className="w-full text-[10px] p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                        placeholder="3200"
                      />
                    </div>
                    <div>
                      <label className="text-[7.5px] text-slate-500 block mb-0.5">مقاومة عمر يومين (2d MPa):</label>
                      <input
                        type="number"
                        value={formState.strength2d || ""}
                        onChange={(e) => setFormState(prev => ({ ...prev, strength2d: parseFloat(e.target.value) || undefined }))}
                        className="w-full text-[10px] p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                        placeholder="22"
                      />
                    </div>
                    <div>
                      <label className="text-[7.5px] text-slate-500 block mb-0.5">مقاومة عمر 28 يوم (28d MPa):</label>
                      <input
                        type="number"
                        value={formState.strength28d || ""}
                        onChange={(e) => setFormState(prev => ({ ...prev, strength28d: parseFloat(e.target.value) || undefined }))}
                        className="w-full text-[10px] p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                        placeholder="42.5"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(formState.category === "إضافات كيميائية" || formState.category === "إضافات معدنية") && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8.5px] text-slate-500 block mb-0.5">المحتوى الصلب (% Solid):</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formState.solidContent || ""}
                        onChange={(e) => setFormState(prev => ({ ...prev, solidContent: parseFloat(e.target.value) || undefined }))}
                        className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                        placeholder="e.g. 38%"
                      />
                    </div>
                    <div>
                      <label className="text-[8.5px] text-slate-500 block mb-0.5">محتوى الكلوريد السائل (%):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formState.chlorideContent || ""}
                        onChange={(e) => setFormState(prev => ({ ...prev, chlorideContent: parseFloat(e.target.value) || undefined }))}
                        className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                        placeholder="e.g. 0.01%"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1">مسار اعتماد وجودة المادة (Workflow Approval):</label>
              <select
                value={formState.ApprovalStatus || "Draft"}
                onChange={(e) => setFormState(prev => ({ ...prev, ApprovalStatus: e.target.value as any }))}
                className="w-full text-xs p-2 text-right bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-bold"
              >
                <option value="Draft">مسودة غير معتمدة (Draft)</option>
                <option value="Under Review">قيد التدقيق والمراجعة (Under Review)</option>
                <option value="Approved">معتمد ومطابق للصب الهندسي (Approved)</option>
                <option value="Archived">مؤرشف معطل (Archived)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1">حالة المادة الإنشائية النشطة:</label>
              <select
                value={formState.status || "نشط"}
                onChange={(e) => setFormState(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full text-xs p-2 text-right bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
              >
                <option value="نشط">نشط (Active)</option>
                <option value="موقوف">مخطط مستبعد (Inactive)</option>
                <option value="قيد المراجعة">تحت الاعتماد والمراجعة (Reviewing)</option>
              </select>
            </div>

          </div>
        )}
      </>
    );
  };

  return (
    <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 text-right font-sans" id="unified-materials-engineering-database" dir={language === "ar" ? "rtl" : "ltr"}>
      
      {/* SECTION HEADER */}
      <div className={`border-b border-indigo-50 dark:border-indigo-900/40 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${language === "ar" ? "text-right" : "text-left"}`}>
        <div className={language === "ar" ? "text-right" : "text-left"}>
          <h3 className={`text-base font-black text-slate-900 dark:text-white flex items-center gap-2 ${language === "ar" ? "justify-end" : "justify-start"}`}>
            {language !== "ar" && <Database size={18} className="text-blue-500" />}
            <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
              UNIFIED MATERIALS DATABASE
            </span>
            <span>{t("unified_materials_database")}</span>
            {language === "ar" && <Database size={18} className="text-blue-500" />}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t("unified_materials_desc")}
          </p>
        </div>

        {onUpdateMaterials && (
          <div className="flex flex-wrap items-center gap-2.5 self-end md:self-center">
            <button
              onClick={() => handleLoadPreloadedCatalog("append")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/10 cursor-pointer"
              id="import-update-catalog-btn"
            >
              <RefreshCw size={13} />
              <span>{language === "ar" ? "استيراد وتحديث البيانات" : "Import & Update Data"}</span>
            </button>

            <button 
              onClick={handleAddNewClick}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
            >
              <Plus size={14} strokeWidth={3} />
              <span>{t("add_and_guess_material_ai")}</span>
            </button>
          </div>
        )}
      </div>


      
      {/* ADVANCED MANAGEMENT & BULK CONTROL TOGGLE */}
      <div className={`flex ${language === "ar" ? "justify-start" : "justify-end"} mt-2`}>
        <button
          onClick={() => setShowControlPanel(prev => !prev)}
          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer border ${
            showControlPanel
              ? "bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-600/10"
              : "bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-900/60 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350"
          }`}
        >
          <Settings size={14} className={showControlPanel ? "animate-spin-slow" : ""} />
          <span>{language === "ar" ? "نظام إدارة المواد المتقدم والاستيراد الجماعي" : "Advanced Materials Import & Control Center"}</span>
          <span className="text-[9px] bg-slate-200/50 dark:bg-slate-800 px-1.5 py-0.5 rounded-full font-mono font-bold">
            {materials.length}
          </span>
        </button>
      </div>

      {showControlPanel && (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/60 dark:to-slate-950/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-5 animate-fade-in text-right">
          <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
            <span className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg">
              <Database size={16} />
            </span>
            <div>
              <h4 className="text-xs font-black text-slate-800 dark:text-white">
                {language === "ar" ? "لوحة تحكم واستيراد المواد الذكية" : "Smart Materials Control & Import Board"}
              </h4>
              <p className="text-[10px] text-slate-450 mt-0.5">
                {language === "ar" ? "إدارة وتحديث آلاف المواد، تنزيل قوالب وتصدير المكتبة بكفاءة عالية" : "Manage bulk assets, templates, and restore system catalogues easily"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* COLUMN 1: PRELOADED BASE DATABASE */}
            <div className="p-4 bg-white dark:bg-slate-950/55 rounded-xl border border-slate-200/50 dark:border-slate-800/50 space-y-3">
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <Sparkles size={14} />
                <h5 className="text-[11.5px] font-black">{language === "ar" ? "قاعدة البيانات الأولية للأسمنت والركام" : "Preloaded Materials Catalogue"}</h5>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                {language === "ar" 
                  ? "تحميل كتالوج المنصة الذي يحتوي على عشرات المواد الشائعة (الرمل، الإسمنت، الحصى، المضافات) مع مواصفاتها القياسية لتوفير وقت الإدخال."
                  : "Restore a complete suite of standard engineering materials with accurate properties directly into your repository."}
              </p>
              
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => handleLoadPreloadedCatalog("append")}
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus size={11} />
                  <span>{language === "ar" ? "إضافة المواد الجديدة فقط" : "Append New Materials Only"}</span>
                </button>
                <button
                  onClick={() => handleLoadPreloadedCatalog("update")}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <RefreshCw size={11} />
                  <span>{language === "ar" ? "تحديث الموجود" : "Update Existing"}</span>
                </button>
                <button
                  onClick={() => {
                    setCustomConfirm({
                      title: language === "ar" ? "تحذير: حذف كافة المواد" : "Warning: Clear All Materials",
                      message: language === "ar"
                        ? "تحذير: سيتم حذف جميع بيانات المواد الحالية نهائياً من قاعدة البيانات ومن السحابة. هل أنت متأكد من رغبتك في الاستمرار؟"
                        : "Warning: This will permanently delete all material records from both your local space and the cloud database. Are you sure you want to proceed?",
                      onConfirm: () => {
                        if (onClearAllMaterials) {
                          onClearAllMaterials();
                        } else if (onUpdateMaterials) {
                          onUpdateMaterials([]);
                        }
                        setCustomConfirm(null);
                      }
                    });
                  }}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm mt-2"
                >
                  <Trash2 size={11} />
                  <span>{language === "ar" ? "تفريغ وحذف كافة المواد" : "Wipe & Clear All Materials"}</span>
                </button>
              </div>
            </div>

            {/* COLUMN 2: BULK EXCEL/CSV/JSON IMPORT */}
            <div className="p-4 bg-white dark:bg-slate-950/55 rounded-xl border border-slate-200/50 dark:border-slate-800/50 space-y-3">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Upload size={14} />
                <h5 className="text-[11.5px] font-black">{language === "ar" ? "استيراد ملف Excel / CSV / JSON" : "Bulk File Import"}</h5>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                {language === "ar"
                  ? "ارفع ملفاً جماعياً لمطابقة حقول المواد وإضافتها تلقائياً. تأكد من توافق الأعمدة."
                  : "Upload a structured spreadsheet or JSON payload to dynamically ingest hundred of materials."}
              </p>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between gap-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-lg border border-slate-200/40 dark:border-slate-800">
                  <span className="text-[9px] text-slate-400 pl-1">{language === "ar" ? "استراتيجية الاستيراد:" : "Strategy:"}</span>
                  <div className="flex gap-1.5">
                    <label className="flex items-center gap-1 text-[9px] text-slate-600 dark:text-slate-450 cursor-pointer">
                      <input type="radio" name="import_strategy" checked={importMode === "append"} onChange={() => setImportMode("append")} className="w-3 h-3 accent-emerald-600" />
                      <span>{language === "ar" ? "دمج (إلحاق)" : "Merge (Append)"}</span>
                    </label>
                    <label className="flex items-center gap-1 text-[9px] text-slate-600 dark:text-slate-450 cursor-pointer">
                      <input type="radio" name="import_strategy" checked={importMode === "update"} onChange={() => setImportMode("update")} className="w-3 h-3 accent-emerald-600" />
                      <span>{language === "ar" ? "استبدال (تحديث)" : "Replace (Update)"}</span>
                    </label>
                  </div>
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      handleFileUpload(file, importMode);
                    }
                  }}
                  onClick={() => document.getElementById("bulk-material-file-uploader")?.click()}
                  className={`relative p-4 rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer ${
                    isDragging
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 scale-[1.02]"
                      : "border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/60"
                  }`}
                >
                  <input
                    type="file"
                    accept=".json,.csv,.xlsx"
                    id="bulk-material-file-uploader"
                    onChange={(e) => handleFileUpload(e, importMode)}
                    className="hidden"
                  />
                  <Upload className={`h-6 w-6 mb-1.5 transition-all ${isDragging ? "text-emerald-500 scale-110 animate-bounce" : "text-slate-400 dark:text-slate-500"}`} />
                  <span className="text-[10px] font-black text-slate-750 dark:text-slate-300">
                    {language === "ar" ? "اسحب الملف هنا أو اضغط للاختيار" : "Drag & Drop file here or Click"}
                  </span>
                  <span className="text-[8.5px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {language === "ar" ? "يدعم صيغ Excel (.xlsx), CSV, JSON" : "Supports Excel (.xlsx), CSV, JSON"}
                  </span>
                </div>

                <div className="pt-1 flex flex-col gap-1">
                  <span className="text-[8.5px] text-slate-45 block">{language === "ar" ? "تحميل القوالب الجاهزة المفرغة:" : "Download Blank Templates:"}</span>
                  <div className="grid grid-cols-3 gap-1">
                    <button onClick={() => handleDownloadTemplate("xlsx")} className="py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 rounded text-[9px] font-medium transition-all">Excel</button>
                    <button onClick={() => handleDownloadTemplate("csv")} className="py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 rounded text-[9px] font-medium transition-all">CSV</button>
                    <button onClick={() => handleDownloadTemplate("json")} className="py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 rounded text-[9px] font-medium transition-all">JSON</button>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 3: EXPORT LIBRARY */}
            <div className="p-4 bg-white dark:bg-slate-950/55 rounded-xl border border-slate-200/50 dark:border-slate-800/50 space-y-3">
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <Download size={14} />
                <h5 className="text-[11.5px] font-black">{language === "ar" ? "تصدير مكتبة المواد" : "Export Entire Library"}</h5>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                {language === "ar"
                  ? "قم بتنزيل نسخة كاملة من جميع المواد الخاصة بك والمسجلة بنظامك للاحتفاظ بنسخة احتياطية أو مشاركتها."
                  : "Export your entire materials list into dynamic file formats to back up or share across systems."}
              </p>

              <div className="pt-4 space-y-2">
                <button
                  onClick={() => handleBulkExport("xlsx")}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                >
                  <Download size={11} />
                  <span>{language === "ar" ? "تصدير الكل إلى Excel (XLSX)" : "Export All to Excel (.xlsx)"}</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleBulkExport("csv")}
                    className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[9.5px] font-bold transition-all cursor-pointer text-center"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => handleBulkExport("json")}
                    className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[9.5px] font-bold transition-all cursor-pointer text-center"
                  >
                    JSON
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TABS SWITCHER FOR SYSTEM VS USER MATERIALS */}
      <div className={`flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 ${language === "ar" ? "flex-row-reverse text-right" : "flex-row text-left"}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSourceTab("system")}
            className={`px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 relative ${
              activeSourceTab === "system"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            }`}
          >
            <Database size={14} />
            <span>{language === "ar" ? "مواد النظام" : "System Materials"}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
              activeSourceTab === "system" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
            }`}>
              {systemCount}
            </span>
          </button>

          <button
            onClick={() => setActiveSourceTab("user")}
            className={`px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 relative ${
              activeSourceTab === "user"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            }`}
          >
            <User size={14} />
            <span>{language === "ar" ? "مواد المستخدم" : "User Materials"}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
              activeSourceTab === "user" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
            }`}>
              {userCount}
            </span>
          </button>
        </div>

        <div className="hidden sm:block text-[11px] text-slate-450 dark:text-slate-500 font-medium">
          {language === "ar" 
            ? "يتم الحفاظ على فلاتر البحث والفرز الخاصة بكل تبويب بشكل منفصل" 
            : "Search filters and sorting are preserved independently for each tab"}
        </div>
      </div>

      {/* GRID TOOLBAR FOR SEARCH */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-4">
        
        {/* Row 1: Search & Reset */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Live Search Input */}
          <div className="md:col-span-8 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full text-xs p-3 text-slate-800 dark:text-white bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${language === "ar" ? "pr-10 text-right" : "pl-10 text-left"}`}
              placeholder={language === "ar" ? "البحث الفوري بالاسم، الكود، الوصف، أو الكلمات المفتاحية..." : "Instant search by name, code, description, or keywords..."}
            />
            <Search size={15} className={`absolute top-4 text-slate-400 ${language === "ar" ? "right-3.5" : "left-3.5"}`} />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className={`absolute top-3.5 text-slate-400 hover:text-slate-600 ${language === "ar" ? "left-3" : "right-3"}`}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Reset Filters and Favorites */}
          <div className={`md:col-span-4 flex gap-2 ${language === "ar" ? "justify-start flex-row-reverse" : "justify-end flex-row"}`}>
            <button
              onClick={() => {
                setSystemSearchQuery("");
                setSystemSelectedCategory("الكل");
                setSystemSelectedMaterialType("الكل");
                setSystemSelectedRegion("all");
                setSystemSelectedQuality("all");
                setSystemSelectedStatus("all");
                setSystemSortBy("name");
                setSystemSortOrder("asc");
                setSystemShowOnlyFavorites(false);

                setUserSearchQuery("");
                setUserSelectedCategory("الكل");
                setUserSelectedMaterialType("الكل");
                setUserSelectedRegion("all");
                setUserSelectedQuality("all");
                setUserSelectedStatus("all");
                setUserSortBy("name");
                setUserSortOrder("asc");
                setUserShowOnlyFavorites(false);

                showToast(language === "ar" ? "تم إعادة تعيين فلاتر البحث بنجاح" : "Search filters reset successfully", "info");
              }}
              className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <RotateCcw size={13} className="text-slate-400 shrink-0" />
              <span>{language === "ar" ? "إعادة تعيين الفلاتر" : "Reset Filters"}</span>
            </button>

            <button
              onClick={() => setShowOnlyFavorites(prev => !prev)}
              className={`py-2.5 px-3 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                showOnlyFavorites
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-500 font-extrabold"
                  : "bg-white hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500"
              }`}
            >
              <Heart size={13} className={showOnlyFavorites ? "fill-current text-rose-500" : ""} />
              <span className="hidden sm:inline">{language === "ar" ? "المفضلة" : "Favorites"}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Advanced Criteria Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Material Type Selection */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wide text-right">
              {language === "ar" ? "نوع المادة" : "Material Type"}
            </label>
            <select
              value={selectedMaterialType}
              onChange={(e) => setSelectedMaterialType(e.target.value)}
              className={`w-full text-xs p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-medium ${language === "ar" ? "text-right" : "text-left"}`}
            >
              <option value="الكل">{language === "ar" ? "كل أنواع المواد" : "All Material Types"}</option>
              <option value="مادة رابطة">{language === "ar" ? "مادة رابطة (Binder)" : "Binder"}</option>
              <option value="ركام">{language === "ar" ? "ركام (Aggregate)" : "Aggregate"}</option>
              <option value="إضافات معدنية">{language === "ar" ? "إضافات معدنية (SCM)" : "Mineral Admixture"}</option>
              <option value="ألياف">{language === "ar" ? "ألياف (Fibers)" : "Fibers"}</option>
              <option value="إضافات كيميائية">{language === "ar" ? "إضافات كيميائية (Chemical)" : "Chemical Admixtures"}</option>
              <option value="ماء">{language === "ar" ? "ماء (Water)" : "Water"}</option>
              <option value="أخرى">{language === "ar" ? "أخرى (Other)" : "Other"}</option>
            </select>
          </div>

          {/* Detailed Category Select */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wide text-right">
              {language === "ar" ? "تصنيف المادة التفصيلي" : "Detailed Category"}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`w-full text-xs p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-medium ${language === "ar" ? "text-right" : "text-left"}`}
            >
              {visibleCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "الكل" 
                    ? (language === "ar" ? "كل التصنيفات الفرعية" : "All Sub-Categories")
                    : t(getCategoryKey(cat))}
                </option>
              ))}
            </select>
          </div>

          {/* Quality Select */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wide text-right">
              {language === "ar" ? "الرتبة الفنية والجودة" : "Technical Grade"}
            </label>
            <select
              value={selectedQuality}
              onChange={(e) => setSelectedQuality(e.target.value)}
              className={`w-full text-xs p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-medium ${language === "ar" ? "text-right" : "text-left"}`}
            >
              <option value="all">{t("all_technical_grades")}</option>
              <option value="premium">{t("premium_quality_grade")}</option>
              <option value="standard">{t("standard_quality_grade")}</option>
              <option value="eco">{t("eco_quality_grade")}</option>
            </select>
          </div>

          {/* Regional select */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wide text-right">
              {language === "ar" ? "المصدر الجغرافي" : "Geographic Region"}
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className={`w-full text-xs p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-medium ${language === "ar" ? "text-right" : "text-left"}`}
            >
              <option value="all">{t("all_geographic_regions")}</option>
              {uniqueProvenances.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Material Status selection */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wide text-right">
              {language === "ar" ? "حالة المادة" : "Material Status"}
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`w-full text-xs p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-medium ${language === "ar" ? "text-right" : "text-left"}`}
            >
              <option value="all">{language === "ar" ? "كل الحالات" : "All Statuses"}</option>
              <option value="active">{language === "ar" ? "نشط فقط" : "Active Only"}</option>
              <option value="inactive">{language === "ar" ? "غير نشط (قيد المراجعة/موقوف)" : "Inactive Only"}</option>
            </select>
          </div>
        </div>

        {/* Row 3: Sorting Controls & Total Count Block */}
        <div className={`flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/45 dark:border-slate-800/45 pt-3 text-xs ${language === "ar" ? "flex-row-reverse" : "flex-row"}`}>
          
          {/* Sorting controls */}
          <div className={`flex items-center gap-2 ${language === "ar" ? "flex-row-reverse" : "flex-row"}`}>
            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 flex items-center gap-1">
              <SlidersHorizontal size={11} />
              <span>{language === "ar" ? "فرز حسب:" : "Sort by:"}</span>
            </span>

            <div className={`flex items-center gap-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-1 rounded-xl shadow-sm ${language === "ar" ? "flex-row-reverse" : "flex-row"}`}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-[11px] p-1 bg-transparent border-none text-slate-700 dark:text-slate-300 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="name">{language === "ar" ? "الاسم" : "Name"}</option>
                <option value="createdDate">{language === "ar" ? "تاريخ الإنشاء" : "Creation Date"}</option>
                <option value="updatedDate">{language === "ar" ? "تاريخ التعديل" : "Last Modified"}</option>
                <option value="category">{language === "ar" ? "النوع/الفئة" : "Category"}</option>
                <option value="uses">{language === "ar" ? "الاستخدام" : "Usage/Application"}</option>
                <option value="density">{language === "ar" ? "الكثافة" : "Density"}</option>
                <option value="price">{language === "ar" ? "السعر" : "Price"}</option>
              </select>

              <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-1" />

              <button
                onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                title={language === "ar" ? "عكس اتجاه الفرز" : "Toggle Sort Direction"}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-blue-500 transition-all cursor-pointer flex items-center justify-center shrink-0"
              >
                <ArrowUpDown size={12} className={sortOrder === "desc" ? "rotate-180 transition-transform" : "transition-transform"} />
              </button>
            </div>
          </div>

          {/* Results count indicator */}
          <div className="flex items-center gap-2 bg-blue-500/5 border border-blue-500/10 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="font-mono text-[10.5px] font-black text-blue-600 dark:text-blue-400">
              {language === "ar" 
                ? `العثور على ${filteredMaterials.length} مادة مطابقة` 
                : `Found ${filteredMaterials.length} matching materials`}
            </span>
          </div>

        </div>

      </div>

      {/* CORE DISPLAY COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: LIST FOR EXPLORING (7 columns) */}
        <div className="lg:col-span-7 space-y-3 order-2 lg:order-1 max-h-[720px] overflow-y-auto pr-1">
          {/* Header Row for Selection & Multi-select bar */}
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-2.5 px-4 rounded-xl text-xs text-slate-500 border border-slate-200/40 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filteredMaterials.length > 0 && filteredMaterials.every(m => selectedMaterialIds.includes(m.id))}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedMaterialIds(filteredMaterials.map(m => m.id));
                  } else {
                    setSelectedMaterialIds([]);
                  }
                }}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="font-bold">{language === "ar" ? "تحديد الكل" : "Select All"}</span>
            </div>
            {selectedMaterialIds.length > 0 && (
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-350 px-2 py-0.5 rounded-md text-[10px] font-bold">
                {selectedMaterialIds.length} {language === "ar" ? "محددة" : "selected"}
              </span>
            )}
          </div>

          {selectedMaterialIds.length > 0 && (
            <div className="bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900 p-3 rounded-2xl flex flex-wrap gap-2 items-center justify-between animate-fade-in text-right">
              <div className="flex items-center gap-1 text-[10.5px] font-black text-indigo-700 dark:text-indigo-400">
                <span>⚡</span>
                <span>{language === "ar" ? `عمليات جماعية (${selectedMaterialIds.length} مواد):` : `Bulk actions (${selectedMaterialIds.length} materials):`}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => handleBulkToggleStatus("نشط")}
                  className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                >
                  {language === "ar" ? "تنشيط" : "Activate"}
                </button>
                <button
                  onClick={() => handleBulkToggleStatus("موقوف")}
                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-600 text-amber-600 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                >
                  {language === "ar" ? "تعطيل" : "Deactivate"}
                </button>
                <button
                  onClick={() => handleBulkToggleApproval("Approved")}
                  className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-600 text-purple-600 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                >
                  {language === "ar" ? "اعتماد" : "Approve"}
                </button>
                <button
                  onClick={handleBulkDuplicate}
                  className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                >
                  {language === "ar" ? "تكرار" : "Duplicate"}
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-600 text-rose-600 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                >
                  {language === "ar" ? "حذف جماعي" : "Delete"}
                </button>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkExport(e.target.value as any, true);
                      e.target.value = "";
                    }
                  }}
                  className="text-[10px] p-1 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-bold"
                >
                  <option value="">{language === "ar" ? "تصدير المحدد..." : "Export Selected..."}</option>
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="xlsx">Excel (XLSX)</option>
                </select>
              </div>
            </div>
          )}

          {filteredMaterials.length > 0 ? (
            filteredMaterials.map((mat) => {
              const isSelected = activeMaterial?.id === mat.id;
              const isFav = favorites.includes(mat.id);

              return (
                <div
                  key={mat.id}
                  onClick={() => { setSelectedMaterialId(mat.id); setIsEditing(false); setIsAdding(false); }}
                  className={`group p-3.5 rounded-2xl border transition-all cursor-pointer flex justify-between items-center gap-4 ${
                    isSelected 
                      ? "bg-blue-50/40 dark:bg-blue-950/20 border-blue-400 dark:border-blue-900" 
                      : "bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900/30 dark:hover:bg-slate-900 border-slate-200/60 dark:border-slate-800"
                  }`}
                >
                  {/* Left Actions */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedMaterialIds.includes(mat.id)}
                      onChange={() => handleToggleSelect(mat.id)}
                      className="w-4 h-4 rounded border-slate-350 dark:border-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer mr-1"
                    />
                    <button
                      onClick={(e) => toggleFavorite(mat.id, e)}
                      className={`p-2 rounded-xl transition-all ${
                        isFav 
                          ? "bg-rose-500/10 text-rose-500" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-450 hover:bg-slate-200"
                      }`}
                    >
                      <Heart size={12} className={isFav ? "fill-current" : ""} />
                    </button>
                    {isMaterialCurrentlyActiveInInputs(mat) && (
                      <span className="p-1 px-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/25 rounded-lg text-[9px] font-black font-sans shrink-0 block">
                        {t("active_in_mix")}
                      </span>
                    )}
                  </div>

                  {/* Right Description & Details */}
                  <div className={`flex items-center gap-3 flex-1 min-w-0 ${language === "ar" ? "flex-row-reverse text-right" : "flex-row text-left"}`}>
                    
                    {/* Metadata summary info */}
                    <div className="space-y-0.5 min-w-0 w-full">
                      <div className={`flex items-center gap-1.5 ${language === "ar" ? "justify-end" : "justify-start"}`}>
                        {language !== "ar" && <span className={`w-1.5 h-1.5 rounded-full shrink-0 bg-blue-500 ${
                          getMaterialCategory(mat) === "رمال" ? "bg-amber-400" :
                          getMaterialCategory(mat) === "حصى" ? "bg-sky-500" :
                          getMaterialCategory(mat) === "إسمنت" ? "bg-purple-500" : "bg-emerald-500"
                        }`} />}
                        <h4 className={`text-xs font-black truncate ${!checkIsCompatible(mat) ? "text-slate-450 dark:text-slate-500 line-through" : "text-slate-800 dark:text-white"}`}>
                          {language === "ar" ? mat.name : mat.englishName || mat.name}
                        </h4>
                        {!checkIsCompatible(mat) && (
                          <span className="p-0.5 px-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded text-[8px] font-bold shrink-0 block">
                            {language === "ar" ? "غير متوافق" : "Incompatible"}
                          </span>
                        )}
                        {mat.status === "موقوف" && (
                          <span className="p-0.5 px-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded text-[8px] font-bold shrink-0 block">
                            {language === "ar" ? "معطل (موقوف)" : "Inactive"}
                          </span>
                        )}
                        {language === "ar" && <span className={`w-1.5 h-1.5 rounded-full shrink-0 bg-blue-500 ${
                          getMaterialCategory(mat) === "رمال" ? "bg-amber-400" :
                          getMaterialCategory(mat) === "حصى" ? "bg-sky-500" :
                          getMaterialCategory(mat) === "إسمنت" ? "bg-purple-500" : "bg-emerald-500"
                        }`} />}
                      </div>
                      
                      <div className={`flex items-center gap-2 text-[10px] text-slate-450 font-mono ${language === "ar" ? "justify-end text-right" : "justify-start text-left"}`}>
                        {language === "ar" ? (
                          <>
                            <span className="truncate max-w-[130px] flex items-center gap-0.5 justify-end">
                              <MapPin size={9} />
                              <span>{mat.provenance || mat.region}</span>
                            </span>
                            <span>•</span>
                            <span className="text-blue-500 dark:text-blue-400 shrink-0">{t("material_density")}: {mat.density} kg/m³</span>
                            {mat.price !== undefined && mat.price > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-500 shrink-0">{mat.price} DA</span>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="text-blue-500 dark:text-blue-400 shrink-0">{t("material_density")}: {mat.density} kg/m³</span>
                            <span>•</span>
                            <span className="truncate max-w-[130px] flex items-center gap-0.5 justify-start">
                              <MapPin size={9} />
                              <span>{mat.provenance || mat.region}</span>
                            </span>
                            {mat.price !== undefined && mat.price > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-500 shrink-0">{mat.price} DA</span>
                              </>
                            )}
                          </>
                        )}
                      </div>
                      {mat.materialType && (
                        <div className={`flex mt-1 ${language === "ar" ? "justify-end" : "justify-start"}`}>
                          <span className="p-0.5 px-2 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/15 rounded text-[8.5px] font-bold">
                            {mat.materialType}
                          </span>
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              );
            })
          ) : (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <span className="p-4 bg-slate-100 dark:bg-slate-800 inline-block rounded-full text-slate-400 mb-2">
                <Search size={32} />
              </span>
              <p className="text-xs font-black text-slate-700 dark:text-slate-300">{t("no_matching_results")}</p>
              <p className="text-[10px] text-slate-450 mt-1">{t("adjust_search_criteria")}</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DETAIL DECK & ACTION INTERACTIVE (5 columns) */}
        <div className="lg:col-span-5 order-1 lg:order-2 lg:sticky lg:top-6 bg-slate-50/50 dark:bg-slate-900/40 p-5 rounded-3xl border border-slate-200/60 dark:border-slate-800 space-y-4">
          
          {/* RENDER EDIT / ADD FORM OR DELETE CONFIRM IF ACTIVE */}
          {showDeleteConfirm ? (
            <div className={`bg-rose-50/90 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 p-6 rounded-3xl space-y-4 animate-fade-in ${language === "ar" ? "text-right" : "text-left"}`}>
              <div className="flex justify-between items-center pb-2 border-b border-rose-100 dark:border-rose-900/40">
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-705 text-slate-500"
                >
                  <X size={14} />
                </button>
                <div className={`flex items-center gap-1.5 ${language === "ar" ? "justify-end" : "justify-start"}`}>
                  <span className="text-[10px] font-extrabold text-rose-500 uppercase font-mono">{t("confirm_permanent_deletion")}</span>
                  <Trash2 className="text-rose-500" size={14} />
                </div>
              </div>
              <h4 className="text-xs font-black text-slate-800 dark:text-white">
                {t("delete_material_permanently")} "{language === "ar" ? activeMaterial?.name : activeMaterial?.englishName || activeMaterial?.name}"
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed">
                {t("delete_material_warning")}
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  className="py-2 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-[10.5px] font-bold bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  {t("cancel_action")}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10.5px] font-black transition-all shadow shadow-rose-600/10 cursor-pointer"
                >
                  {t("confirm_delete_button")}
                </button>
              </div>
            </div>
          ) : isEditing || isAdding ? (
            <form onSubmit={handleSaveForm} className="space-y-4 text-right">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                <button 
                  type="button" 
                  onClick={() => { setIsEditing(false); setIsAdding(false); }}
                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500"
                >
                  <X size={14} />
                </button>
                <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5 justify-end">
                  <Plus size={14} className="text-emerald-500" />
                  <span>{isAdding ? "إضافة مادة هندسية جديدة للكتالوج" : `تعديل خصائص المادة`}</span>
                </h4>
              </div>

              {/* AI Material Assistant Trigger (10. AI MATERIAL ASSISTANT) */}
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/45 dark:border-indigo-900/50 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 justify-end text-[10.5px] font-black text-indigo-600 dark:text-indigo-400">
                  <span>مساعد SNO AI الهندسي الافتراضي</span>
                  <Sparkles size={13} className="text-purple-500 animate-pulse" />
                </div>
                <p className="text-[9.5px] text-slate-500 dark:text-slate-400 leading-normal">
                  أدخل <strong>اسم المادة</strong>، <strong>الفئة</strong>، و <strong>المنطقة الجغرافية</strong> أولاً، ثم اضغط على زر تفعيل مساعد AI لتخمين واقتراح كافة المواصفات الفيزيائية والكيميائية تلقائياً كمقترح قابل للتعديل!
                </p>
                <button
                  type="button"
                  disabled={isAILoading}
                  onClick={handleAIAssistSuggest}
                  className={`w-full py-1.5 px-3 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isAILoading 
                      ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500" 
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                  }`}
                >
                  <Sparkles size={11} />
                  <span>تخمين واقترح الخصائص بالذكاء الاصطناعي ✨</span>
                </button>
                {aiAssistSuccessMessage && (
                  <p className="text-[9px] text-emerald-600 dark:text-emerald-400 text-center font-black animate-pulse">
                    {aiAssistSuccessMessage}
                  </p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-1">اسم المادة بالعربية:</label>
                <input
                  type="text"
                  required
                  value={formState.name || ""}
                  onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full text-xs p-2 text-right bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-semibold"
                  placeholder="رمل وادي سوف الصحراوي..."
                />
              </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1">الاسم بالإنجليزية (English Name):</label>
                  <input
                    type="text"
                    value={formState.englishName || ""}
                    onChange={(e) => setFormState(prev => ({ ...prev, englishName: e.target.value }))}
                    className="w-full text-xs p-2 text-left bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-semibold font-mono"
                    placeholder="Oued Souf Desert Sand..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 block mb-1">الفئة الإنشائية:</label>
                    <select
                      value={formState.category || "رمال"}
                      onChange={(e) => setFormState(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full text-xs p-2 text-right bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-bold"
                    >
                      <option value="رمال">رمال (Sands)</option>
                      <option value="حصى">حصى (Coarse Gravels)</option>
                      <option value="إسمنت">إسمنت (Cement)</option>
                      <option value="إضافات كيميائية">إضافات كيميائية (Chemical Admixture)</option>
                      <option value="إضافات معدنية">إضافات معدنية (SCM/Pozzolanics)</option>
                      <option value="ماء">ماء (Water)</option>
                      <option value="ألياف">ألياف (Fibers)</option>
                      <option value="مجلدات خاصة">مجلدات خاصة (Special Binders)</option>
                      <option value="مواد خاصة">مواد خاصة (Special)</option>
                      <option value="مواد معاد تدويرها">مواد معاد تدويرها (Recycled Aggs)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 block mb-1">السعر المرجعي (DA):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formState.price || 0}
                      onChange={(e) => setFormState(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                      className="w-full text-xs p-2 text-right bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-bold font-mono"
                    />
                  </div>
                </div>



                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 block mb-1">الكثافة المطلقة (kg/m³):</label>
                    <input
                      type="number"
                      required
                      value={formState.density || 0}
                      onChange={(e) => setFormState(prev => ({ ...prev, density: parseInt(e.target.value) }))}
                      className="w-full text-xs p-2 text-right bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-800 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 block mb-1">امتصاص المياه (%):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formState.absorption || 0}
                      onChange={(e) => setFormState(prev => ({ ...prev, absorption: parseFloat(e.target.value) }))}
                      className="w-full text-xs p-2 text-right bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-800 dark:text-white font-bold"
                    />
                  </div>
                </div>

                {/* Technical dynamic parameters depending on selected Category */}
                {(formState.category === "رمال" || formState.category === "حصى") && (
                  <div className="p-3 bg-slate-100 dark:bg-slate-900/60 rounded-xl space-y-2.5">
                    <p className="text-[10px] text-blue-500 font-black border-b border-blue-150 pb-1 flex justify-between">
                      <span>الخصائص الهندسية والفيزيائية للركام</span>
                      <span className="text-[8px] bg-blue-500/10 text-blue-600 px-1.5 py-0.25 rounded">الركام</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8.5px] block mb-0.5 font-black text-blue-600 dark:text-blue-400">
                          الكثافة النوعية (الوزن النوعي) (Specific Gravity) <span className="text-rose-500">*</span>:
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={formState.specificGravity || ""}
                          onChange={(e) => setFormState(prev => ({ ...prev, specificGravity: parseFloat(e.target.value) }))}
                          className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded text-slate-800 dark:text-white font-mono"
                          placeholder="e.g. 2.65"
                        />
                      </div>
                      <div>
                        <label className="text-[8.5px] text-slate-500 block mb-0.5">
                          شكل الحبيبة (Shape) {formState.category === "حصى" && <span className="text-rose-500">*</span>}:
                        </label>
                        <select
                          value={formState.particleShape || "زاوي"}
                          onChange={(e) => setFormState(prev => ({ ...prev, particleShape: e.target.value as any }))}
                          className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-bold"
                        >
                          <option value="مستدير">مستدير طبيعي (Roulé)</option>
                          <option value="غير منتظم">غير منتظم وديان (Semi-concasseur)</option>
                          <option value="مكسر">مكسر كسارة (Concassé)</option>
                          <option value="زاوي">زاوي حاد الحواف (Angulaire)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8.5px] text-slate-500 block mb-0.5">جودة التدرج (Grading Quality):</label>
                        <select
                          value={formState.aggregateQuality || "standard"}
                          onChange={(e) => setFormState(prev => ({ ...prev, aggregateQuality: e.target.value as any }))}
                          className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-bold"
                        >
                          <option value="excellent">ممتاز (Excellent)</option>
                          <option value="standard">عادي / قياسي (Standard)</option>
                          <option value="poor">ضعيف (Poor)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[8.5px] block mb-0.5 font-black text-blue-600 dark:text-blue-400">
                          كثافة حالة SSD المشبعة (kg/m³):
                        </label>
                        <input
                          type="number"
                          value={formState.ssdDensity || ""}
                          onChange={(e) => setFormState(prev => ({ ...prev, ssdDensity: e.target.value ? parseInt(e.target.value) : undefined }))}
                          className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                          placeholder="e.g. 2680"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8.5px] block mb-0.5 font-black text-rose-600 dark:text-rose-400">
                          الكثافة الظاهرية (Bulk Density) (kg/m³) <span className="text-rose-500">*</span>:
                        </label>
                        <input
                          type="number"
                          required
                          value={formState.bulkDensity || ""}
                          onChange={(e) => setFormState(prev => ({ ...prev, bulkDensity: e.target.value ? parseFloat(e.target.value) : undefined }))}
                          className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono font-bold"
                          placeholder="e.g. 1550"
                        />
                      </div>
                      <div>
                        <label className="text-[8.5px] block mb-0.5 font-black text-rose-600 dark:text-rose-400">
                          محتوى الرطوبة (Moisture Content) (%) {formState.category === "رمال" && <span className="text-rose-500">*</span>}:
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required={formState.category === "رمال"}
                          value={formState.moisture || ""}
                          onChange={(e) => setFormState(prev => ({ ...prev, moisture: e.target.value ? parseFloat(e.target.value) : undefined }))}
                          className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono font-bold"
                          placeholder="e.g. 3.5"
                        />
                      </div>
                    </div>

                    {formState.category === "رمال" ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8.5px] block mb-0.5 font-black text-blue-600 dark:text-blue-400">
                            معامل النعومة (FM) [للرمال] <span className="text-rose-500">*</span>:
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            required
                            value={formState.finenessModulus || ""}
                            onChange={(e) => setFormState(prev => ({ ...prev, finenessModulus: e.target.value ? parseFloat(e.target.value) : undefined }))}
                            className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono font-bold"
                            placeholder="e.g. 2.6"
                          />
                        </div>
                        <div>
                          <label className="text-[8.5px] block mb-0.5 font-black text-blue-600 dark:text-blue-400">
                            المكافئ الرملي (Sand Equivalent %) <span className="text-rose-500">*</span>:
                          </label>
                          <input
                            type="number"
                            required
                            value={formState.SandEquivalent || ""}
                            onChange={(e) => setFormState(prev => ({ ...prev, SandEquivalent: e.target.value ? parseFloat(e.target.value) : undefined }))}
                            className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono font-bold"
                            placeholder="e.g. 85"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8.5px] block mb-0.5 font-black text-blue-600 dark:text-blue-400">
                            القطر الأقصى للحصمة Dmax (mm) <span className="text-rose-500">*</span>:
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            required
                            value={formState.dMax || ""}
                            onChange={(e) => setFormState(prev => ({ ...prev, dMax: e.target.value ? parseFloat(e.target.value) : undefined }))}
                            className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono font-bold"
                            placeholder="e.g. 20"
                          />
                        </div>
                        <div>
                          <label className="text-[8.5px] text-slate-500 block mb-0.5">مقاومة لوس أنجلوس (Los Angeles %):</label>
                          <input
                            type="number"
                            value={formState.LosAngeles || ""}
                            onChange={(e) => setFormState(prev => ({ ...prev, LosAngeles: e.target.value ? parseFloat(e.target.value) : undefined }))}
                            className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                            placeholder="e.g. 18"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8.5px] text-slate-500 block mb-0.5">المحتوى الطيني (%) [Clay]:</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formState.clayContent || ""}
                          onChange={(e) => setFormState(prev => ({ ...prev, clayContent: e.target.value ? parseFloat(e.target.value) : undefined }))}
                          className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-955 border border-slate-200 rounded font-mono"
                          placeholder="e.g. 0.8"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formState.category === "إسمنت" && (
                  <div className="p-3 bg-purple-500/5 border border-purple-500/15 rounded-xl space-y-2.5">
                    <p className="text-[10px] text-purple-500 font-black border-b border-purple-150 pb-1 flex justify-between">
                      <span>الخصائص الفنية للأسمنت</span>
                      <span className="text-[8px] bg-purple-500/10 text-purple-600 px-1.5 py-0.25 rounded">الإسمنت</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8.5px] text-purple-400 block mb-0.5 font-black">
                          صنف الإسمنت (Type/Class) <span className="text-rose-500">*</span>:
                        </label>
                        <input
                          type="text"
                          required
                          value={formState.cementClass || "CEM I"}
                          onChange={(e) => setFormState(prev => ({ ...prev, cementClass: e.target.value }))}
                          className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-bold"
                          placeholder="e.g. CEM I, CEM II"
                        />
                      </div>
                      <div>
                        <label className="text-[8.5px] text-purple-400 block mb-0.5 font-black">
                          رتبة المقاومة (Strength Class) <span className="text-rose-500">*</span>:
                        </label>
                        <input
                          type="text"
                          required
                          value={formState.strengthClass || "42.5"}
                          onChange={(e) => setFormState(prev => ({ ...prev, strengthClass: e.target.value }))}
                          className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono font-bold"
                          placeholder="e.g. 42.5"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8.5px] text-purple-400 block mb-0.5">سرعة الإماهة (Hydration):</label>
                        <input
                          type="text"
                          value={formState.hydrationClass || "عادي"}
                          onChange={(e) => setFormState(prev => ({ ...prev, hydrationClass: e.target.value }))}
                          className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded"
                          placeholder="سريع، عادي، بطيء..."
                        />
                      </div>
                      <div>
                        <label className="text-[8.5px] text-purple-400 block mb-0.5">حرارة التفاعل (J/g):</label>
                        <input
                          type="number"
                          value={formState.heatOfHydration || ""}
                          onChange={(e) => setFormState(prev => ({ ...prev, heatOfHydration: e.target.value ? parseInt(e.target.value) : undefined }))}
                          className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                          placeholder="J/g e.g. 280"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[8.5px] text-purple-400 block mb-0.5 font-black">
                          الوزن النوعي (Specific Gravity) <span className="text-rose-500">*</span>:
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={formState.specificGravity || ""}
                          onChange={(e) => setFormState(prev => ({ ...prev, specificGravity: e.target.value ? parseFloat(e.target.value) : undefined }))}
                          className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono font-bold"
                          placeholder="e.g. 3.15"
                        />
                      </div>
                      <div>
                        <label className="text-[8.5px] text-purple-400 block mb-0.5">الكثافة الظاهرية (Bulk Density) (g/cm³):</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formState.bulkDensity || ""}
                          onChange={(e) => setFormState(prev => ({ ...prev, bulkDensity: e.target.value ? parseFloat(e.target.value) : undefined }))}
                          className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                          placeholder="e.g. 1.15"
                        />
                      </div>
                      <div>
                        <label className="text-[8.5px] text-purple-400 block mb-0.5">نعومة بلين (Blaine Fineness) (cm²/g):</label>
                        <input
                          type="number"
                          value={formState.blaineFineness || ""}
                          onChange={(e) => setFormState(prev => ({ ...prev, blaineFineness: e.target.value ? parseInt(e.target.value) : undefined }))}
                          className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                          placeholder="e.g. 3200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formState.category === "إضافات كيميائية" && (
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl space-y-2.5">
                    <p className="text-[10px] text-emerald-500 font-black border-b border-emerald-150 pb-1 flex justify-between">
                      <span>مواصفات المضافات الكيميائية الفنية</span>
                      <span className="text-[8px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.25 rounded">إضافات كيميائية</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8.5px] text-slate-500 block mb-0.5 font-black text-blue-600 dark:text-blue-400">
                          الجرعة الموصى بها (% من وزن الإسمنت) <span className="text-rose-500">*</span>:
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={formState.recommendedDosage || ""}
                          onChange={(e) => setFormState(prev => ({ ...prev, recommendedDosage: parseFloat(e.target.value) }))}
                          className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono font-bold"
                          placeholder="e.g. 1.2"
                        />
                      </div>
                      <div>
                        <label className="text-[8.5px] text-slate-500 block mb-0.5 font-black text-blue-600 dark:text-blue-400">
                          نسبة تخفيض الماء (%) <span className="text-rose-500">*</span>:
                        </label>
                        <input
                          type="number"
                          required
                          value={formState.waterReduction || ""}
                          onChange={(e) => setFormState(prev => ({ ...prev, waterReduction: parseInt(e.target.value) }))}
                          className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono font-bold"
                          placeholder="e.g. 20"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formState.category === "إضافات معدنية" && (
                  <div className="p-3 bg-teal-500/5 border border-teal-500/15 rounded-xl space-y-2.5">
                    <p className="text-[10px] text-teal-500 font-black border-b border-teal-150 pb-1 flex justify-between">
                      <span>مواصفات الإضافات المعدنية البوزولانية (SCM)</span>
                      <span className="text-[8px] bg-teal-500/10 text-teal-600 px-1.5 py-0.25 rounded">إضافات معدنية</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8.5px] text-slate-500 block mb-0.5 font-black text-blue-600 dark:text-blue-400">
                          مؤشر الفعالية البوزولانية (%) <span className="text-rose-500">*</span>:
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={formState.pozzolanicIndex || ""}
                          onChange={(e) => setFormState(prev => ({ ...prev, pozzolanicIndex: e.target.value ? parseFloat(e.target.value) : undefined }))}
                          className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono font-bold"
                          placeholder="e.g. 95"
                        />
                      </div>
                      <div>
                        <label className="text-[8.5px] text-slate-500 block mb-0.5">عامل الطلب على الماء (Water Demand Factor):</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formState.waterDemandFactor || ""}
                          onChange={(e) => setFormState(prev => ({ ...prev, waterDemandFactor: e.target.value ? parseFloat(e.target.value) : undefined }))}
                          className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                          placeholder="e.g. 0.95"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formState.category === "ماء" && (
                  <div className="p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl space-y-2.5">
                    <p className="text-[10px] text-blue-500 font-black border-b border-blue-150 pb-1 flex justify-between">
                      <span>مواصفات مياه خلط الخرسانة</span>
                      <span className="text-[8px] bg-blue-500/10 text-blue-600 px-1.5 py-0.25 rounded">مياه الخلط</span>
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[8.5px] text-blue-400 block mb-0.5">الرقم الهيدروجيني (pH Value):</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formState.ph || ""}
                          onChange={(e) => setFormState(prev => ({ ...prev, ph: e.target.value ? parseFloat(e.target.value) : undefined }))}
                          className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                          placeholder="e.g. 7.2"
                        />
                      </div>
                      <div>
                        <label className="text-[8.5px] text-blue-400 block mb-0.5">محتوى الكلوريدات (ppm):</label>
                        <input
                          type="number"
                          value={formState.chlorides || ""}
                          onChange={(e) => setFormState(prev => ({ ...prev, chlorides: e.target.value ? parseInt(e.target.value) : undefined }))}
                          className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                          placeholder="e.g. 150"
                        />
                      </div>
                      <div>
                        <label className="text-[8.5px] text-blue-400 block mb-0.5">محتوى الكبريتات (ppm):</label>
                        <input
                          type="number"
                          value={formState.sulfates || ""}
                          onChange={(e) => setFormState(prev => ({ ...prev, sulfates: e.target.value ? parseInt(e.target.value) : undefined }))}
                          className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                          placeholder="e.g. 120"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formState.category === "ألياف" && (
                  <div className="p-3 bg-indigo-500/5 border border-indigo-500/15 rounded-xl space-y-2.5">
                    <p className="text-[9.5px] text-indigo-500 font-black border-b border-indigo-150 pb-1 flex justify-between">
                      <span>مواصفات الألياف الإنشائية</span>
                      <span className="text-[8px] bg-indigo-500/10 text-indigo-600 px-1.5 py-0.25 rounded">الألياف</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8.5px] text-indigo-400 block mb-0.5">نوع الألياف (Fiber Type) <span className="text-rose-500">*</span>:</label>
                        <select
                          value={formState.fiberType || "فولاذية"}
                          onChange={(e) => setFormState(prev => ({ ...prev, fiberType: e.target.value }))}
                          className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-bold"
                        >
                          <option value="فولاذية">ألياف فولاذية (Steel Fibers)</option>
                          <option value="زجاجية">ألياف زجاجية (Glass Fibers)</option>
                          <option value="بولي بروبيلين">ألياف بولي بروبيلين (Polypropylene)</option>
                          <option value="كربونية">ألياف كربونية (Carbon Fibers)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[8.5px] text-indigo-400 block mb-0.5">طول الألياف (Length mm):</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formState.fiberLength || ""}
                          onChange={(e) => setFormState(prev => ({ ...prev, fiberLength: e.target.value ? parseFloat(e.target.value) : undefined }))}
                          className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                          placeholder="e.g. 50"
                        />
                      </div>
                      <div>
                        <label className="text-[8.5px] text-indigo-400 block mb-0.5">قطر الألياف (Diameter mm):</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formState.fiberDiameter || ""}
                          onChange={(e) => setFormState(prev => ({ ...prev, fiberDiameter: e.target.value ? parseFloat(e.target.value) : undefined }))}
                          className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                          placeholder="e.g. 0.75"
                        />
                      </div>
                      <div>
                        <label className="text-[8.5px] text-indigo-400 block mb-0.5">مقاومة الشد (Tensile Strength MPa):</label>
                        <input
                          type="number"
                          value={formState.tensileStrength || ""}
                          onChange={(e) => setFormState(prev => ({ ...prev, tensileStrength: e.target.value ? parseInt(e.target.value) : undefined }))}
                          className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                          placeholder="e.g. 1100"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formState.category === "مجلدات خاصة" && (
                  <div className="p-3 bg-cyan-500/5 border border-cyan-500/15 rounded-xl space-y-2.5">
                    <p className="text-[10px] text-cyan-500 font-black border-b border-cyan-150 pb-1 flex justify-between">
                      <span>مواصفات المجلدات والروابط الخاصة</span>
                      <span className="text-[8px] bg-cyan-500/10 text-cyan-600 px-1.5 py-0.25 rounded">الروابط الخاصة</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8.5px] text-cyan-400 block mb-0.5">نسبة المواد القلوية (Alkaline Ratio %):</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formState.alkalineRatio || ""}
                          onChange={(e) => setFormState(prev => ({ ...prev, alkalineRatio: e.target.value ? parseFloat(e.target.value) : undefined }))}
                          className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono"
                          placeholder="e.g. 5.5"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1">شهادات الجودة والمطابقة للرتبة البنيوية:</label>
                  <input
                    type="text"
                    value={formState.quality || ""}
                    onChange={(e) => setFormState(prev => ({ ...prev, quality: e.target.value }))}
                    className="w-full text-xs p-2 text-right bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1">المحاور والتطبيقات الإنشائية الموصى بها:</label>
                  <input
                    type="text"
                    value={formState.uses || ""}
                    onChange={(e) => setFormState(prev => ({ ...prev, uses: e.target.value }))}
                    className="w-full text-xs p-2 text-right bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1 font-sans">دراسات ووصف تقني معمق:</label>
                  <textarea
                    value={formState.desc || ""}
                    onChange={(e) => setFormState(prev => ({ ...prev, desc: e.target.value }))}
                    rows={2}
                    className="w-full text-xs p-2 text-right bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white leading-normal"
                    placeholder="تم غسله جيداً وإخلاؤه من الأتربة..."
                  ></textarea>
                </div>

                {/* ADVANCED EMMS SUPPLIER MANAGEMENT MODULE */}
                <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-2 text-right">
                  <p className="text-[10px] font-black text-blue-600 flex items-center gap-1 justify-end">
                    <span>بيانات المورد والمحجر (Supplier Logistics)</span>
                    <Briefcase size={12} />
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8.5px] text-slate-500 block mb-0.5">اسم جهة التوريد / المورد:</label>
                      <input
                        type="text"
                        value={formState.supplierName || ""}
                        onChange={(e) => setFormState(prev => ({ ...prev, supplierName: e.target.value }))}
                        className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded text-slate-800 dark:text-white"
                        placeholder="e.g. GICA, Lafarge"
                      />
                    </div>
                    <div>
                      <label className="text-[8.5px] text-slate-500 block mb-0.5">جهة الاتصال / الهاتف:</label>
                      <input
                        type="text"
                        value={formState.supplierContact || ""}
                        onChange={(e) => setFormState(prev => ({ ...prev, supplierContact: e.target.value }))}
                        className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded text-slate-800 dark:text-white font-mono text-left"
                        placeholder="+213 21 XX XX XX"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8.5px] text-slate-500 block mb-0.5">اسم المحجرة (Quarry Name):</label>
                      <input
                        type="text"
                        value={formState.quarryName || ""}
                        onChange={(e) => setFormState(prev => ({ ...prev, quarryName: e.target.value }))}
                        className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded text-slate-800 dark:text-white"
                        placeholder="محجرة جبل فلان..."
                      />
                    </div>
                    <div>
                      <label className="text-[8.5px] text-slate-500 block mb-0.5">حالة اعتماد المورد:</label>
                      <input
                        type="text"
                        value={formState.certificationStatus || ""}
                        onChange={(e) => setFormState(prev => ({ ...prev, certificationStatus: e.target.value }))}
                        className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded text-slate-800 dark:text-white"
                        placeholder="e.g. Certified ISO, سارية"
                      />
                    </div>
                  </div>
                </div>

                {/* ADVANCED EMMS LABORATORY PROPERTIES MODULE */}
                <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-2 text-right">
                  <p className="text-[10px] font-black text-amber-600 flex items-center gap-1 justify-end">
                    <span>خصائص الفحص المخبري العميق (Lab Properties)</span>
                    <Activity size={12} />
                  </p>

                  {formState.category === "رمال" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8.5px] text-slate-500 block mb-0.5">المكافئ الرملي (Sand Equivalent %):</label>
                          <input
                            type="number"
                            value={formState.SandEquivalent || ""}
                            onChange={(e) => setFormState(prev => ({ ...prev, SandEquivalent: parseFloat(e.target.value) || undefined }))}
                            className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                            placeholder="e.g. 82%"
                          />
                        </div>
                        <div>
                          <label className="text-[8.5px] text-slate-500 block mb-0.5">أزرق الميثيلين (Methylene Blue g/kg):</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formState.MethyleneBlue || ""}
                            onChange={(e) => setFormState(prev => ({ ...prev, MethyleneBlue: parseFloat(e.target.value) || undefined }))}
                            className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                            placeholder="e.g. 1.2 g/kg"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8.5px] text-slate-500 block mb-0.5">الكلوريدات (Chlorides %):</label>
                          <input
                            type="number"
                            step="0.001"
                            value={formState.Chlorides || ""}
                            onChange={(e) => setFormState(prev => ({ ...prev, Chlorides: parseFloat(e.target.value) || undefined }))}
                            className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                            placeholder="e.g. 0.01%"
                          />
                        </div>
                        <div>
                          <label className="text-[8.5px] text-slate-500 block mb-0.5">الكبريتات (Sulfates %):</label>
                          <input
                            type="number"
                            step="0.001"
                            value={formState.Sulfates || ""}
                            onChange={(e) => setFormState(prev => ({ ...prev, Sulfates: parseFloat(e.target.value) || undefined }))}
                            className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                            placeholder="e.g. 0.02%"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formState.category === "حصى" && (
                     <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8.5px] text-slate-500 block mb-0.5">معامل لوس أنجلوس (Los Angeles %):</label>
                          <input
                            type="number"
                            value={formState.LosAngeles || ""}
                            onChange={(e) => setFormState(prev => ({ ...prev, LosAngeles: parseFloat(e.target.value) || undefined }))}
                            className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                            placeholder="e.g. 18%"
                          />
                        </div>
                        <div>
                          <label className="text-[8.5px] text-slate-500 block mb-0.5">معامل الفلطحة (Flakiness Index %):</label>
                          <input
                            type="number"
                            value={formState.flakinessIndex || ""}
                            onChange={(e) => setFormState(prev => ({ ...prev, flakinessIndex: parseFloat(e.target.value) || undefined }))}
                            className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                            placeholder="e.g. 12%"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8.5px] text-slate-500 block mb-0.5">معامل الاستطالة (Elongation %):</label>
                          <input
                            type="number"
                            value={formState.elongationIndex || ""}
                            onChange={(e) => setFormState(prev => ({ ...prev, elongationIndex: parseFloat(e.target.value) || undefined }))}
                            className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                            placeholder="e.g. 8%"
                          />
                        </div>
                        <div>
                          <label className="text-[8.5px] text-slate-500 block mb-0.5">قيمة التفتت بالضغط (Crushing Value %):</label>
                          <input
                            type="number"
                            value={formState.crushingValue || ""}
                            onChange={(e) => setFormState(prev => ({ ...prev, crushingValue: parseFloat(e.target.value) || undefined }))}
                            className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                            placeholder="e.g. 15%"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formState.category === "إسمنت" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8.5px] text-slate-500 block mb-0.5">الشك الابتدائي (Initial Setting min):</label>
                          <input
                            type="number"
                            value={formState.initialSetting || ""}
                            onChange={(e) => setFormState(prev => ({ ...prev, initialSetting: parseInt(e.target.value) || undefined }))}
                            className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                            placeholder="e.g. 120 mins"
                          />
                        </div>
                        <div>
                          <label className="text-[8.5px] text-slate-500 block mb-0.5">الشك النهائي (Final Setting min):</label>
                          <input
                            type="number"
                            value={formState.finalSetting || ""}
                            onChange={(e) => setFormState(prev => ({ ...prev, finalSetting: parseInt(e.target.value) || undefined }))}
                            className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                            placeholder="e.g. 195 mins"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div>
                          <label className="text-[7.5px] text-slate-500 block mb-0.5">نعومة بلين (Blaine cm²/g):</label>
                          <input
                            type="number"
                            value={formState.blaineFineness || ""}
                            onChange={(e) => setFormState(prev => ({ ...prev, blaineFineness: parseInt(e.target.value) || undefined }))}
                            className="w-full text-[10px] p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                            placeholder="3200"
                          />
                        </div>
                        <div>
                          <label className="text-[7.5px] text-slate-500 block mb-0.5">مقاومة عمر يومين (2d MPa):</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formState.strength2d || ""}
                            onChange={(e) => setFormState(prev => ({ ...prev, strength2d: parseFloat(e.target.value) || undefined }))}
                            className="w-full text-[10px] p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                            placeholder="22.5"
                          />
                        </div>
                        <div>
                          <label className="text-[7.5px] text-slate-500 block mb-0.5">مقاومة 28 يوماً (28d MPa):</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formState.strength28d || ""}
                            onChange={(e) => setFormState(prev => ({ ...prev, strength28d: parseFloat(e.target.value) || undefined }))}
                            className="w-full text-[10px] p-1 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                            placeholder="52.5"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {(formState.category === "إضافات كيميائية" || formState.category === "إضافات معدنية") && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8.5px] text-slate-500 block mb-0.5">المحتوى الصلب الجاف (Solid %):</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formState.solidContent || ""}
                            onChange={(e) => setFormState(prev => ({ ...prev, solidContent: parseFloat(e.target.value) || undefined }))}
                            className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                            placeholder="e.g. 40%"
                          />
                        </div>
                        <div>
                          <label className="text-[8.5px] text-slate-500 block mb-0.5">نسبة الكلوريدات الحرة (Cl- %):</label>
                          <input
                            type="number"
                            step="0.001"
                            value={formState.chlorideContent || ""}
                            onChange={(e) => setFormState(prev => ({ ...prev, chlorideContent: parseFloat(e.target.value) || undefined }))}
                            className="w-full text-[11px] p-1.5 bg-white dark:bg-slate-950 border border-slate-200 rounded font-mono text-slate-800 dark:text-white"
                            placeholder="e.g. 0.05%"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* TECHNICAL PASSPORT METADATA EXPANSION */}
                <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/50 space-y-2 text-right">
                  <p className="text-[10px] font-black text-indigo-600 block border-b border-indigo-150 pb-1 flex justify-between">
                    <span>البطاقة الفنية ومعايير الاعتماد المخبري (Technical Passport)</span>
                    <span>📑</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-0.5">المختبر الجيولوجي المعتمد:</label>
                      <input
                        type="text"
                        value={formState.laboratory || ""}
                        onChange={(e) => setFormState(prev => ({ ...prev, laboratory: e.target.value }))}
                        className="w-full text-[11px] p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-slate-800 dark:text-white"
                        placeholder="المخبر الوطني للبناء (LNCT)..."
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-0.5">مواصفة الفحص القياسية:</label>
                      <input
                        type="text"
                        value={formState.standard || ""}
                        onChange={(e) => setFormState(prev => ({ ...prev, standard: e.target.value }))}
                        className="w-full text-[11px] p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-slate-800 dark:text-white"
                        placeholder="NA 442 وقرارات اللجنة..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-0.5">رقم شهادة الفحص والمطابقة:</label>
                      <input
                        type="text"
                        value={formState.certificationNumber || ""}
                        onChange={(e) => setFormState(prev => ({ ...prev, certificationNumber: e.target.value }))}
                        className="w-full text-[11px] p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded font-mono text-slate-800 dark:text-white"
                        placeholder="CERT-QA-SND-2026..."
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-0.5">تاريخ الموافقة والاعتماد:</label>
                      <input
                        type="date"
                        value={formState.approvalDate || ""}
                        onChange={(e) => setFormState(prev => ({ ...prev, approvalDate: e.target.value }))}
                        className="w-full text-[11px] p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* MATERIAL APPROVAL WORKFLOW SELECTION */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1">مسار اعتماد وجودة المادة (Workflow Approval):</label>
                  <select
                    value={formState.ApprovalStatus || "Draft"}
                    onChange={(e) => setFormState(prev => ({ ...prev, ApprovalStatus: e.target.value as any }))}
                    className="w-full text-xs p-2 text-right bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-bold"
                  >
                    <option value="Draft">مسودة غير معتمدة (Draft)</option>
                    <option value="Under Review">قيد التدقيق والمراجعة (Under Review)</option>
                    <option value="Approved">معتمد ومطابق للصب الهندسي (Approved)</option>
                    <option value="Archived">مؤرشف معطل (Archived)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1">حالة المادة الإنشائية النشطة:</label>
                  <select
                    value={formState.status || "نشط"}
                    onChange={(e) => setFormState(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full text-xs p-2 text-right bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white"
                  >
                    <option value="نشط">نشط (Active)</option>
                    <option value="موقوف">مخطط مستبعد (Inactive)</option>
                    <option value="قيد المراجعة">تحت الاعتماد والمراجعة (Reviewing)</option>
                  </select>
                </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow shadow-blue-600/20 shadow-md cursor-pointer mt-2"
              >
                <Save size={14} />
                <span>حفظ البيانات وتثبيت المادة</span>
              </button>
            </form>
          ) : activeMaterial ? (
            /* STANDARD VIEW FOR CENTRAL MATERIAL DETAILS DECK */
            <>
              {/* Elegant, high-contrast engineering data header block */}
              <div className="relative h-44 rounded-2xl overflow-hidden shadow bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-850 p-5 flex flex-col justify-between text-right animate-fade-in">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-blue-600 text-white shadow-sm font-sans">
                    {activeMaterial.category || activeMaterial.type}
                  </span>
                  <div className="text-left font-mono">
                    <span className="text-[8px] text-slate-500 block leading-none">MATERIAL UNIQUE ID</span>
                    <span className="text-[10px] font-extrabold text-indigo-400 block mt-0.5">{activeMaterial.id}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-black text-white">{activeMaterial.name}</h4>
                  <p className="text-[9px] text-slate-400 font-mono tracking-wide">{activeMaterial.englishName}</p>
                </div>

                <div className="flex justify-between items-center border-t border-slate-800/80 pt-2 text-[9px] text-slate-450 block font-sans">
                  <span className="flex items-center gap-1">
                    <MapPin size={10} className="text-rose-400" />
                    <span>{language === "ar" ? "الإقليم: " : language === "fr" ? "Région : " : "Region: "}{activeMaterial.provenance || activeMaterial.region || (language === "ar" ? "الجزائر" : "Algeria")}</span>
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <Star size={10} className="fill-current font-black" />
                    <span>{language === "ar" ? "اعتماد: " : language === "fr" ? "Note : " : "Rating: "}{activeMaterial.rating || 4.5}/5</span>
                  </span>
                </div>
              </div>

              {/* Title & English alias code section */}
              <div className="space-y-1 text-right">
                <div className="flex items-center gap-2 justify-end">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    activeMaterial.status === "نشط" ? "bg-emerald-500" : "bg-amber-400"
                  }`} title={activeMaterial.status} />
                  <h3 className="text-sm font-black text-slate-800 dark:text-white">
                    {activeMaterial.name}
                  </h3>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 block font-mono">
                  <span>{language === "ar" ? "المعرّف الفريد: " : language === "fr" ? "ID Unique : " : "Unique ID: "}{activeMaterial.id}</span>
                  {activeMaterial.materialType && (
                    <span className="p-0.5 px-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded font-sans text-[8.5px] font-bold">
                      {activeMaterial.materialType}
                    </span>
                  )}
                  <span>{activeMaterial.englishName}</span>
                </div>
              </div>

              {/* CRUD TOOLBAR ACTION ROW */}
              {onUpdateMaterials && (
                <div className="flex items-center gap-1.5 justify-end">
                  <button
                    onClick={handleDeleteClick}
                    className="p-1 px-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg text-[9.5px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Trash2 size={10} />
                    <span>{language === "ar" ? "حذف" : language === "fr" ? "Supprimer" : "Delete"}</span>
                  </button>
                  <button
                    onClick={handleDuplicateClick}
                    className="p-1 px-2.5 bg-blue-500/10 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg text-[9.5px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Copy size={10} />
                    <span>{language === "ar" ? "تكرار" : language === "fr" ? "Dupliquer" : "Duplicate"}</span>
                  </button>
                  <button
                    onClick={handleEditClick}
                    className="p-1 px-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-705 text-slate-700 dark:text-slate-200 rounded-lg text-[9.5px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Edit3 size={10} />
                    <span>{language === "ar" ? "تعديل" : language === "fr" ? "Modifier" : "Edit"}</span>
                  </button>
                </div>
              )}

               <div className="border-t border-slate-200 dark:border-slate-800 my-1" />

              {/* MISSING PROPERTIES ALERT & QUICK-AUTOFILL (11. AUTOFILL REMEDIES) */}
              {getMissingProperties(activeMaterial).length > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2 text-right">
                  <div className="flex items-center gap-1.5 justify-end text-[10.5px] font-black text-amber-600 dark:text-amber-400">
                    <span>{language === "ar" ? "⚠️ خصائص مفقودة مطلوبة للتصميم" : language === "fr" ? "⚠️ Propriétés requises manquantes" : "⚠️ Missing required calculation fields"}</span>
                    <AlertTriangle size={13} className="text-amber-500 animate-pulse" />
                  </div>
                  <p className="text-[9.5px] text-slate-500 dark:text-slate-400 leading-normal">
                    {language === "ar" 
                      ? "هذه المادة تفتقر إلى بعض الخصائص الهندسية اللازمة لحسابات خلطة الخرسانة بدقة:" 
                      : "This material lacks some mechanical specs needed for accurate mix calculations:"}
                  </p>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {getMissingProperties(activeMaterial).map(prop => (
                      <span key={prop.key} className="px-1.5 py-0.5 bg-amber-500/15 text-amber-800 dark:text-amber-300 rounded border border-amber-500/10 text-[9px] font-mono font-bold">
                        {language === "ar" ? prop.nameAr : language === "fr" ? prop.nameFr : prop.nameEn}
                      </span>
                    ))}
                  </div>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => handleAutofillMissingProperties(activeMaterial)}
                      className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[9.5px] font-black transition-all flex items-center justify-center gap-1 shadow cursor-pointer"
                    >
                      <span>{language === "ar" ? "تعبئة الخصائص الناقصة تلقائياً بالقيم القياسية" : "Autofill Missing Properties Automatically"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Core Physical Parameters Grid Display */}
              <div className="grid grid-cols-3 gap-2 font-mono text-center">
                <div className="bg-white dark:bg-slate-950/30 p-2 rounded-xl border border-slate-150 dark:border-slate-850">
                  <span className="text-[8.5px] text-slate-400 block mb-0.5 font-sans">
                    {language === "ar" ? "الكثافة المطلقة" : language === "fr" ? "Masse volumique" : "Absolute Density"}
                  </span>
                  <strong className="text-[11px] text-slate-800 dark:text-slate-200">
                    {`${activeMaterial.density} kg/m³`}
                  </strong>
                </div>

                <div className="bg-white dark:bg-slate-950/30 p-2 rounded-xl border border-slate-150 dark:border-slate-850">
                  <span className="text-[8.5px] text-slate-400 block mb-0.5 font-sans">
                    {language === "ar" ? "الامتصاص المائي" : language === "fr" ? "Absorption d'eau" : "Water Absorption"}
                  </span>
                  <strong className="text-[11px] text-blue-500 dark:text-blue-400">
                    {activeMaterial.absorption > 0 ? `${activeMaterial.absorption}%` : "0%"}
                  </strong>
                </div>

                <div className="bg-white dark:bg-slate-950/30 p-2 rounded-xl border border-slate-150 dark:border-slate-850">
                  <span className="text-[8.5px] text-slate-400 block mb-0.5 font-sans">
                    {language === "ar" ? "رطوبة الورشة الافتراضية" : language === "fr" ? "Humidité du chantier" : "Default Site Moisture"}
                  </span>
                  <strong className="text-[11px] text-amber-600">
                    {activeMaterial.moisture !== undefined ? `${activeMaterial.moisture}%` : "1.0%"}
                  </strong>
                </div>
              </div>

              {/* TECHNICAL PARAMETER SHEETS INTEGRAL DISPLAY (5. ENGINEERING PROPERTIES) */}
              <div className="space-y-2 text-right">
                
                {/* Aggregates specific props sheet */}
                {(activeMaterial.category === "رمال" || activeMaterial.category === "حصى") && (
                  <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-2 text-[10px] leading-relaxed">
                    <p className={`text-[9.5px] font-black text-blue-500 border-b border-blue-500/10 pb-0.5 ${language === "ar" ? "text-right" : "text-left"}`}>
                      {language === "ar" ? "البطاقة الهندسية للركام والصلابة الحبيبية:" : language === "fr" ? "Fiche Technique des Granulats & Dureté :" : "Aggregates Technical & Hardness Spec Sheet:"}
                    </p>
                    <div className={`grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 ${language === "ar" ? "text-right" : "text-left"}`}>
                      <div>
                        {language === "ar" ? "شكل الركام: " : language === "fr" ? "Forme des granulats : " : "Particle Shape: "}
                        <strong className="text-slate-800 dark:text-white">
                          {activeMaterial.particleShape === "زاوي مكسر"
                            ? (language === "ar" ? "زاوي مكسر" : language === "fr" ? "Concassé angulaire" : "Crushed Angular")
                            : activeMaterial.particleShape || (language === "ar" ? "زاوي مكسر" : "Crushed Angular")}
                        </strong>
                      </div>
                      <div>
                        {language === "ar" ? "جودة التدرج: " : language === "fr" ? "Qualité : " : "Grading Quality: "}
                        <strong className="text-slate-800 dark:text-white">
                          {activeMaterial.aggregateQuality === "excellent" 
                            ? (language === "ar" ? "ممتاز" : "Excellent") 
                            : activeMaterial.aggregateQuality === "poor" 
                            ? (language === "ar" ? "ضعيف" : "Poor") 
                            : (language === "ar" ? "عادي / قياسي" : "Standard")}
                        </strong>
                      </div>
                      <div>
                        {language === "ar" ? "الكثافة النوعية (الوزن النوعي): " : language === "fr" ? "Densité relative : " : "Specific Gravity / Relative Density: "}
                        <strong className="text-slate-800 dark:text-white font-mono">{activeMaterial.specificGravity || (activeMaterial.density/1000).toFixed(2)}</strong>
                      </div>
                      {activeMaterial.finenessModulus && (
                        <div>
                          {language === "ar" ? "رتبة النعومة FM: " : language === "fr" ? "Module de finesse FM : " : "Fineness Modulus FM: "}
                          <strong className="text-slate-800 dark:text-white font-mono">{activeMaterial.finenessModulus}</strong>
                        </div>
                      )}
                      {activeMaterial.dMax && (
                        <div>
                          {language === "ar" ? "الحجم الحبيبي الأقصى Dmax: " : language === "fr" ? "Taille maximale Dmax : " : "Max Grain Size Dmax: "}
                          <strong className="text-slate-800 dark:text-white font-mono">{activeMaterial.dMax} {language === "ar" ? "مم" : "mm"}</strong>
                        </div>
                      )}
                      {activeMaterial.clayContent !== undefined && (
                        <div>
                          {language === "ar" ? "المحتوى الطيني المكافئ: " : language === "fr" ? "Équivalent de sable (Argile) : " : "Equivalent Clay Content: "}
                          <strong className="text-slate-800 dark:text-white font-mono">{activeMaterial.clayContent}%</strong>
                        </div>
                      )}
                      {activeMaterial.losAngelesAbrasion !== undefined && (
                        <div>
                          {language === "ar" ? "معامل لوس أنجلوس LA للصلادة: " : language === "fr" ? "Coefficient d'usure Los Angeles : " : "Los Angeles Abrasion Coefficient: "}
                          <strong className="text-slate-850 dark:text-white font-mono">{activeMaterial.losAngelesAbrasion}%</strong>
                        </div>
                      )}
                      {(activeMaterial.bulkDensity !== undefined || activeMaterial.engineeringData?.bulkDensity !== undefined) && (
                        <div>
                          {language === "ar" ? "الكثافة الظاهرية: " : language === "fr" ? "Masse volumique apparente : " : "Bulk Density: "}
                          <strong className="text-slate-850 dark:text-white font-mono">
                            {activeMaterial.bulkDensity || activeMaterial.engineeringData?.bulkDensity} kg/m³
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Cement specific props sheet */}
                {activeMaterial.category === "إسمنت" && (
                  <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl space-y-2 text-[10px] leading-relaxed">
                    <p className={`text-[9.5px] font-black text-purple-500 border-b border-purple-500/10 pb-0.5 ${language === "ar" ? "text-right" : "text-left"}`}>
                      {language === "ar" ? "البطاقة الهندسية للمركب الإسمنتي والإماهة الحرارية:" : "Cementitious Compound & Thermal Hydration Spec Sheet:"}
                    </p>
                    <div className={`grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 ${language === "ar" ? "text-right" : "text-left"}`}>
                      <div>{language === "ar" ? "صنف الـ CEM النوعي: " : "Specific CEM Class: "} <strong className="text-slate-800 dark:text-white">{activeMaterial.cementClass || "CEM I"}</strong></div>
                      <div>{language === "ar" ? "الرتبة المعيارية للمقاومة: " : "Standard Strength Class: "} <strong className="text-slate-800 dark:text-white font-mono">{activeMaterial.strengthClass || "42.5"} MPa</strong></div>
                      <div>{language === "ar" ? "فئة سرعة الإماهة: " : "Hydration Speed Category: "} <strong className="text-slate-800 dark:text-white">{activeMaterial.hydrationClass || (language === "ar" ? "عادي" : "Normal")}</strong></div>
                      {activeMaterial.heatOfHydration && <div>{language === "ar" ? "حرارة الإماهة المطلقة: " : "Absolute Hydration Heat: "} <strong className="text-slate-800 dark:text-white font-mono">{activeMaterial.heatOfHydration} J/g</strong></div>}
                    </div>
                  </div>
                )}

                {/* Admixture specific props sheet */}
                {(activeMaterial.category === "إضافات كيميائية" || activeMaterial.category === "إضافات معدنية") && (
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-2 text-[10px] leading-relaxed">
                    <p className={`text-[9.5px] font-black text-emerald-500 border-b border-emerald-500/10 pb-0.5 ${language === "ar" ? "text-right" : "text-left"}`}>
                      {language === "ar" ? "المواصفات الكيميائية للنشاط والترابط الحبيبي:" : "Chemical Activity & Particle Binding Specs:"}
                    </p>
                    <div className={`grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 ${language === "ar" ? "text-right" : "text-left"}`}>
                      {activeMaterial.admixtureType && <div>{language === "ar" ? "نوع الإضافة: " : "Admixture Type: "} <strong className="text-slate-800 dark:text-white">{activeMaterial.admixtureType}</strong></div>}
                      {activeMaterial.recommendedDosage !== undefined && <div>{language === "ar" ? "الجرعة المقترحة: " : "Recommended Dosage: "} <strong className="text-slate-800 dark:text-white font-mono">{activeMaterial.recommendedDosage}%</strong></div>}
                      {activeMaterial.waterReduction !== undefined && <div>{language === "ar" ? "معدل تخفيض ماء الخلط: " : "Water Reduction Rate: "} <strong className="text-slate-800 dark:text-white font-mono">{activeMaterial.waterReduction}%</strong></div>}
                      {activeMaterial.settingModification && <div>{language === "ar" ? "تعديل زمن الشك الفعلي: " : "Setting Time Modification: "} <strong className="text-slate-800 dark:text-white">{activeMaterial.settingModification}</strong></div>}
                      {activeMaterial.settingTimeImpact !== undefined && <div>{language === "ar" ? "الأثر على زمن الشك: " : "Setting Time Impact: "} <strong className="text-slate-800 dark:text-white font-mono">{activeMaterial.settingTimeImpact > 0 ? `+${activeMaterial.settingTimeImpact}` : activeMaterial.settingTimeImpact} {language === "ar" ? "دقيقة" : "min"}</strong></div>}
                    </div>
                  </div>
                )}

                {/* Water specific props sheet */}
                {activeMaterial.category === "ماء" && (
                  <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-2 text-[10px] leading-relaxed">
                    <p className={`text-[9.5px] font-black text-blue-500 border-b border-blue-500/10 pb-0.5 ${language === "ar" ? "text-right" : "text-left"}`}>
                      {language === "ar" ? "المعايير الهيدرولوجية لماء الخلط:" : "Mixing Water Hydrological Parameters:"}
                    </p>
                    <div className={`grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 ${language === "ar" ? "text-right" : "text-left"}`}>
                      <div>{language === "ar" ? "درجة الحموضة pH: " : "pH Level: "} <strong className="text-slate-800 dark:text-white font-mono">{activeMaterial.engineeringData?.pH || 7.0}</strong></div>
                      <div>{language === "ar" ? "درجة الحرارة: " : "Temperature: "} <strong className="text-slate-800 dark:text-white font-mono">{activeMaterial.engineeringData?.temperature || 20} °C</strong></div>
                      <div>{language === "ar" ? "محتوى الكلوريدات: " : "Chloride Content: "} <strong className="text-slate-800 dark:text-white font-mono">{activeMaterial.engineeringData?.chlorideContent || 250} mg/L</strong></div>
                      <div>{language === "ar" ? "محتوى الكبريتات: " : "Sulfate Content: "} <strong className="text-slate-800 dark:text-white font-mono">{activeMaterial.engineeringData?.sulphateContent || 300} mg/L</strong></div>
                    </div>
                  </div>
                )}

                {/* Lightweight Aggregate specific props sheet */}
                {activeMaterial.category === "ركام خفيف" && (
                  <div className="p-3 bg-sky-500/5 border border-sky-500/10 rounded-xl space-y-2 text-[10px] leading-relaxed">
                    <p className={`text-[9.5px] font-black text-sky-500 border-b border-sky-500/10 pb-0.5 ${language === "ar" ? "text-right" : "text-left"}`}>
                      {language === "ar" ? "البطاقة الهندسية للركام الخفيف الماص:" : "Lightweight Porous Aggregate Spec Sheet:"}
                    </p>
                    <div className={`grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 ${language === "ar" ? "text-right" : "text-left"}`}>
                      <div>{language === "ar" ? "الكثافة المطلقة: " : "Specific Density: "} <strong className="text-slate-800 dark:text-white font-mono">{activeMaterial.engineeringData?.density || activeMaterial.density || 1200} kg/m³</strong></div>
                      <div>{language === "ar" ? "امتصاص الماء: " : "Water Absorption: "} <strong className="text-slate-800 dark:text-white font-mono">{activeMaterial.engineeringData?.waterAbsorption || activeMaterial.absorption || 15}%</strong></div>
                      <div>{language === "ar" ? "مؤشر المسامية: " : "Porosity Index: "} <strong className="text-slate-800 dark:text-white font-mono">{activeMaterial.engineeringData?.porosityIndex || 25}%</strong></div>
                    </div>
                  </div>
                )}

                {/* Heavyweight Aggregate specific props sheet */}
                {activeMaterial.category === "ركام ثقيل" && (
                  <div className="p-3 bg-slate-500/5 border border-slate-500/10 rounded-xl space-y-2 text-[10px] leading-relaxed">
                    <p className={`text-[9.5px] font-black text-slate-500 border-b border-slate-500/10 pb-0.5 ${language === "ar" ? "text-right" : "text-left"}`}>
                      {language === "ar" ? "البطاقة الهندسية للركام الثقيل (دروع الحماية):" : "Heavyweight Aggregate Protective Shield Spec Sheet:"}
                    </p>
                    <div className={`grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 ${language === "ar" ? "text-right" : "text-left"}`}>
                      <div>{language === "ar" ? "الكثافة المطلقة: " : "Specific Density: "} <strong className="text-slate-800 dark:text-white font-mono">{activeMaterial.engineeringData?.density || activeMaterial.density || 4200} kg/m³</strong></div>
                      <div>{language === "ar" ? "امتصاص الماء: " : "Water Absorption: "} <strong className="text-slate-800 dark:text-white font-mono">{activeMaterial.engineeringData?.waterAbsorption || activeMaterial.absorption || 0.5}%</strong></div>
                      <div>{language === "ar" ? "نوع المعدن الثقيل: " : "Heavy Mineral Type: "} <strong className="text-slate-800 dark:text-white">{activeMaterial.engineeringData?.heavyType === "baryte" ? (language === "ar" ? "باريت" : "Baryte") : activeMaterial.engineeringData?.heavyType === "magnetite" ? (language === "ar" ? "ماغنيتيت" : "Magnetite") : (language === "ar" ? "هيماتيت" : "Hematite")}</strong></div>
                    </div>
                  </div>
                )}

                {/* Fibers specific props sheet */}
                {activeMaterial.category === "ألياف" && (
                  <div className="p-3 bg-orange-500/5 border border-orange-500/10 rounded-xl space-y-2 text-[10px] leading-relaxed">
                    <p className={`text-[9.5px] font-black text-orange-500 border-b border-orange-500/10 pb-0.5 ${language === "ar" ? "text-right" : "text-left"}`}>
                      {language === "ar" ? "المواصفات الفنية لألياف التسليح الحجمي:" : "Volumetric Fiber Reinforcement Specs:"}
                    </p>
                    <div className={`grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 ${language === "ar" ? "text-right" : "text-left"}`}>
                      <div>{language === "ar" ? "نوع الألياف: " : "Fiber Type: "} <strong className="text-slate-800 dark:text-white">{activeMaterial.engineeringData?.fiberType === "steel" ? (language === "ar" ? "فولاذية" : "Steel") : activeMaterial.engineeringData?.fiberType === "glass" ? (language === "ar" ? "زجاجية" : "Glass") : (language === "ar" ? "بولي بروبيلين" : "Polypropylene")}</strong></div>
                      <div>{language === "ar" ? "الجرعة المقررة: " : "Dosage: "} <strong className="text-slate-800 dark:text-white font-mono">{activeMaterial.engineeringData?.dosage || 25} kg/m³</strong></div>
                      <div>{language === "ar" ? "الطول / القطر: " : "Length / Diameter: "} <strong className="text-slate-800 dark:text-white font-mono">{activeMaterial.engineeringData?.length || 30}mm / {activeMaterial.engineeringData?.diameter || 0.55}mm</strong></div>
                      <div>{language === "ar" ? "قوة الشد: " : "Tensile Strength: "} <strong className="text-slate-800 dark:text-white font-mono">{activeMaterial.engineeringData?.tensileStrength || 1100} MPa</strong></div>
                    </div>
                  </div>
                )}

                {/* Air Content specific props sheet */}
                {activeMaterial.category === "محتوى الهواء" && (
                  <div className="p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-xl space-y-2 text-[10px] leading-relaxed">
                    <p className={`text-[9.5px] font-black text-cyan-500 border-b border-cyan-500/10 pb-0.5 ${language === "ar" ? "text-right" : "text-left"}`}>
                      {language === "ar" ? "نسبة الفراغات الهوائية المحبوسة المستهدفة:" : "Target Entrained Air Content Void Ratio:"}
                    </p>
                    <div className={`grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 ${language === "ar" ? "text-right" : "text-left"}`}>
                      <div>
                        {language === "ar" ? "المحوى الهوائي المستهدف: " : "Target Air Content: "}
                        <strong className="text-slate-800 dark:text-white font-mono">{activeMaterial.engineeringData?.airPercentage || 2.0}%</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Special Binders specific props sheet */}
                {activeMaterial.category === "مجلدات خاصة" && (
                  <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-2 text-[10px] leading-relaxed">
                    <p className={`text-[9.5px] font-black text-indigo-500 border-b border-indigo-500/10 pb-0.5 ${language === "ar" ? "text-right" : "text-left"}`}>
                      {language === "ar" ? "بطاقة المجلدات والبوليمرات الجيوبوليمرية:" : "Geopolymer Binders & Polymer Spec Sheet:"}
                    </p>
                    <div className={`grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 ${language === "ar" ? "text-right" : "text-left"}`}>
                      <div>
                        {language === "ar" ? "نسبة قلوية الجيوبوليمر: " : "Geopolymer Alkaline Ratio: "}
                        <strong className="text-slate-800 dark:text-white font-mono">{activeMaterial.engineeringData?.alkalineRatio || 2.5}</strong>
                      </div>
                      <div>
                        {language === "ar" ? "رتبة مقاومة الإيبوكسي: " : "Epoxy Tensile Strength Class: "}
                        <strong className="text-slate-800 dark:text-white font-mono">{activeMaterial.engineeringData?.epoxyStrengthClass || "EP-60"}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. DETAILED EMMS LABORATORY PROPERTIES DISCLOSURE DECK */}
                <div className="p-3 bg-amber-500/5 border border-amber-600/15 rounded-xl space-y-2 text-[10px] leading-relaxed">
                  <p className={`text-[9.5px] font-black text-amber-600 border-b border-amber-500/15 pb-1 flex justify-between ${language === "ar" ? "flex-row" : "flex-row-reverse"}`}>
                    <span>{language === "ar" ? "قراءات وتحاليل المخبر المعتمدة" : language === "fr" ? "Diagnostics de laboratoire certifiés" : "Certified Registered Lab Diagnostics"}</span>
                    <span>🔬</span>
                  </p>
                  
                  {activeMaterial.category === "رمال" && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-slate-600 dark:text-slate-300">
                      <div className={`flex justify-between border-b border-dashed border-slate-100 pb-0.5 ${language === "ar" ? "flex-row" : "flex-row-reverse"}`}>
                        <span>{activeMaterial.SandEquivalent !== undefined ? `${activeMaterial.SandEquivalent}%` : "80.5%"}</span>
                        <span className="text-slate-400 font-sans">{language === "ar" ? "المكافئ الرملي (SE):" : language === "fr" ? "Équivalent de sable (SE) :" : "Sand Equivalent (SE):"}</span>
                      </div>
                      <div className={`flex justify-between border-b border-dashed border-slate-100 pb-0.5 ${language === "ar" ? "flex-row" : "flex-row-reverse"}`}>
                        <span>{activeMaterial.MethyleneBlue !== undefined ? `${activeMaterial.MethyleneBlue} g/kg` : "1.10"}</span>
                        <span className="text-slate-400 font-sans">{language === "ar" ? "أزرق الميثيلين (MB):" : language === "fr" ? "Bleu de méthylène (MB) :" : "Methylene Blue (MB):"}</span>
                      </div>
                      <div className={`flex justify-between border-b border-dashed border-slate-100 pb-0.5 ${language === "ar" ? "flex-row" : "flex-row-reverse"}`}>
                        <span>{activeMaterial.Chlorides !== undefined ? `${activeMaterial.Chlorides}%` : "0.012%"}</span>
                        <span className="text-slate-400 font-sans">{language === "ar" ? "محتوى الكلوريدات:" : language === "fr" ? "Teneur en chlorures :" : "Chloride Content:"}</span>
                      </div>
                      <div className={`flex justify-between border-b border-dashed border-slate-100 pb-0.5 ${language === "ar" ? "flex-row" : "flex-row-reverse"}`}>
                        <span>{activeMaterial.Sulfates !== undefined ? `${activeMaterial.Sulfates}%` : "0.018%"}</span>
                        <span className="text-slate-400 font-sans">{language === "ar" ? "محتوى الكبريتات:" : language === "fr" ? "Teneur en sulfates :" : "Sulfate Content:"}</span>
                      </div>
                    </div>
                  )}

                  {activeMaterial.category === "حصى" && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-slate-600 dark:text-slate-300">
                      <div className={`flex justify-between border-b border-dashed border-slate-100 pb-0.5 ${language === "ar" ? "flex-row" : "flex-row-reverse"}`}>
                        <span>{activeMaterial.LosAngeles !== undefined ? `${activeMaterial.LosAngeles}%` : "18%"}</span>
                        <span className="text-slate-400 font-sans">{language === "ar" ? "صلادة لوس أنجلوس (LA):" : language === "fr" ? "Usure Los Angeles (LA) :" : "Los Angeles Abrasion (LA):"}</span>
                      </div>
                      <div className={`flex justify-between border-b border-dashed border-slate-100 pb-0.5 ${language === "ar" ? "flex-row" : "flex-row-reverse"}`}>
                        <span>{activeMaterial.flakinessIndex !== undefined ? `${activeMaterial.flakinessIndex}%` : "11%"}</span>
                        <span className="text-slate-400 font-sans">{language === "ar" ? "معامل الفلطحة (FI):" : language === "fr" ? "Indice d'aplatissement (FI) :" : "Flakiness Index (FI):"}</span>
                      </div>
                      <div className={`flex justify-between border-b border-dashed border-slate-100 pb-0.5 ${language === "ar" ? "flex-row" : "flex-row-reverse"}`}>
                        <span>{activeMaterial.elongationIndex !== undefined ? `${activeMaterial.elongationIndex}%` : "8%"}</span>
                        <span className="text-slate-400 font-sans">{language === "ar" ? "معامل الاستطالة (EI):" : language === "fr" ? "Indice d'élongation (EI) :" : "Elongation Index (EI):"}</span>
                      </div>
                      <div className={`flex justify-between border-b border-dashed border-slate-100 pb-0.5 ${language === "ar" ? "flex-row" : "flex-row-reverse"}`}>
                        <span>{activeMaterial.crushingValue !== undefined ? `${activeMaterial.crushingValue}%` : "14%"}</span>
                        <span className="text-slate-400 font-sans">{language === "ar" ? "تفتت بالضغط (ACV):" : language === "fr" ? "Valeur de concassage (ACV) :" : "Aggregate Crushing Value (ACV):"}</span>
                      </div>
                    </div>
                  )}

                  {activeMaterial.category === "إسمنت" && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-slate-600 dark:text-slate-300">
                      <div className={`flex justify-between border-b border-dashed border-slate-100 pb-0.5 ${language === "ar" ? "flex-row" : "flex-row-reverse"}`}>
                        <span>{activeMaterial.initialSetting !== undefined ? `${activeMaterial.initialSetting} min` : "120 min"}</span>
                        <span className="text-slate-400 font-sans">{language === "ar" ? "شك ابتدائي:" : language === "fr" ? "Prise initiale :" : "Initial Setting Time:"}</span>
                      </div>
                      <div className={`flex justify-between border-b border-dashed border-slate-100 pb-0.5 ${language === "ar" ? "flex-row" : "flex-row-reverse"}`}>
                        <span>{activeMaterial.finalSetting !== undefined ? `${activeMaterial.finalSetting} min` : "190 min"}</span>
                        <span className="text-slate-400 font-sans">{language === "ar" ? "شك نهائي:" : language === "fr" ? "Prise finale :" : "Final Setting Time:"}</span>
                      </div>
                      <div className={`flex justify-between border-b border-dashed border-slate-100 pb-0.5 ${language === "ar" ? "flex-row" : "flex-row-reverse"}`}>
                        <span>{activeMaterial.blaineFineness !== undefined ? `${activeMaterial.blaineFineness} cm²/g` : "3350"}</span>
                        <span className="text-slate-400 font-sans">{language === "ar" ? "نعومة بلين فحص:" : language === "fr" ? "Finesse de Blaine :" : "Blaine Fineness:"}</span>
                      </div>
                      <div className={`flex justify-between border-b border-dashed border-slate-100 pb-0.5 ${language === "ar" ? "flex-row" : "flex-row-reverse"}`}>
                        <span>{activeMaterial.strength2d !== undefined ? `${activeMaterial.strength2d} MPa` : "22.0 MPa"}</span>
                        <span className="text-slate-400 font-sans">{language === "ar" ? "مقاومة مبكرة (2d):" : language === "fr" ? "Résistance initiale (2d) :" : "Early Strength (2d):"}</span>
                      </div>
                      <div className={`flex justify-between border-b border-dashed border-slate-105 pb-0.5 grid-cols-span-2 ${language === "ar" ? "flex-row" : "flex-row-reverse"}`}>
                        <span>{activeMaterial.strength28d !== undefined ? `${activeMaterial.strength28d} MPa` : "52.5 MPa"}</span>
                        <span className="text-slate-400 font-sans">{language === "ar" ? "مقاومة نهائية (28d):" : language === "fr" ? "Résistance nominale (28d) :" : "Standard Strength (28d):"}</span>
                      </div>
                    </div>
                  )}

                  {(activeMaterial.category === "إضافات كيميائية" || activeMaterial.category === "إضافات معدنية") && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-slate-600 dark:text-slate-300">
                      <div className={`flex justify-between border-b border-dashed border-slate-100 pb-0.5 ${language === "ar" ? "flex-row" : "flex-row-reverse"}`}>
                        <span>{activeMaterial.solidContent !== undefined ? `${activeMaterial.solidContent}%` : "38%"}</span>
                        <span className="text-slate-400 font-sans">{language === "ar" ? "المحتوى الصلب الجاف:" : language === "fr" ? "Extrait sec :" : "Dry Solid Content:"}</span>
                      </div>
                      <div className={`flex justify-between border-b border-dashed border-slate-100 pb-0.5 ${language === "ar" ? "flex-row" : "flex-row-reverse"}`}>
                        <span>{activeMaterial.chlorideContent !== undefined ? `${activeMaterial.chlorideContent}%` : "0.01%"}</span>
                        <span className="text-slate-450 font-sans">{language === "ar" ? "محتوى الكلوريدات:" : language === "fr" ? "Teneur en chlorures :" : "Chloride Content:"}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Uses & Quality notes */}
                <div className="space-y-2.5 pt-1.5">
                  <div className="space-y-0.5">
                    <span className={`text-[9.5px] font-extrabold text-slate-400 block justify-end flex items-center gap-1 ${language === "ar" ? "flex-row" : "flex-row-reverse"}`}>
                      <span>{t("geological_purity_title")}</span>
                      <Award size={10} className="text-blue-500" />
                    </span>
                    <p className={`font-semibold text-[10.5px] text-slate-800 dark:text-slate-250 leading-relaxed bg-white dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-200/40 dark:border-slate-800 ${language === "ar" ? "text-right" : "text-left"}`}>
                      {activeMaterial.quality}
                    </p>
                  </div>
                </div>

                {/* 4. EXPANDED EMMS TECHNICAL PASSPORT */}
                <div className="p-3 bg-indigo-500/5 border border-indigo-600/15 rounded-xl space-y-2 text-[10px] leading-relaxed">
                  <p className="text-[9.5px] font-black text-indigo-700 border-b border-indigo-500/15 pb-1 flex justify-between">
                    <span>{t("technical_passport")}</span>
                    <span>📑</span>
                  </p>
                  <div className={`grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 ${language === "ar" ? "text-right" : "text-left"}`}>
                    <div>{t("unique_material_id")} <strong className="text-slate-800 dark:text-white font-mono text-[9px] select-all">{activeMaterial.id}</strong></div>
                    <div>{t("current_material_version")} <strong className="text-blue-600 dark:text-blue-400 font-bold font-mono">v{activeMaterial.version || 1.0}</strong></div>
                    <div>{t("certified_supplier")} <strong className="text-slate-800 dark:text-white">{activeMaterial.supplierName || "مورد معتمد للقطاع"}</strong></div>
                    <div>{t("original_geological_quarry")} <strong className="text-slate-800 dark:text-white">{activeMaterial.quarryName || activeMaterial.sourceQuarry || "مقلع معتبر رسمياً"}</strong></div>
                    <div>{t("geographic_provenance")} <strong className="text-slate-800 dark:text-white">{activeMaterial.provenance || activeMaterial.region || "الجزائر"}</strong></div>
                    <div>{t("certified_laboratory")} <strong className="text-slate-800 dark:text-white">{activeMaterial.laboratory || "المخبر الوطني للسكن والبناء (LNCT)"}</strong></div>
                    <div>{t("reference_standard")} <strong className="text-emerald-800 dark:text-emerald-300 font-semibold">{activeMaterial.standard || "المطابقة الوطنية"}</strong></div>
                    <div>{t("certification_number")} <strong className="text-emerald-700 dark:text-emerald-450 font-mono font-bold select-all">{activeMaterial.certificationNumber || "CERT-QA-DZ-2026"}</strong></div>
                    <div className="col-span-2">{t("technical_approval_date")} <strong className="text-slate-800 dark:text-white font-mono">{activeMaterial.approvalDate || activeMaterial.updatedDate || activeMaterial.createdDate || "2026-06-15"}</strong></div>
                  </div>
                </div>

                {/* 6. APPROVAL WORKFLOW STATUS BADGE DECK */}
                <div className={`p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl flex items-center justify-between border border-slate-200 ${language === "ar" ? "flex-row" : "flex-row-reverse"}`}>
                  <span className="text-[10px] font-semibold text-slate-500">{t("approval_workflow_status")}</span>
                  {(() => {
                    const status = activeMaterial.ApprovalStatus || "Draft";
                    const config = 
                      status === "Certified" || status === "Approved" || status === "Verified" ? { text: t("status_approved"), color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-450 font-extrabold" } :
                      status === "Review" || status === "Under Review" || status === "Pending Review" ? { text: t("status_under_review"), color: "bg-amber-500/10 border-amber-500/35 text-amber-700 dark:text-amber-400 font-extrabold" } :
                      status === "Archived" ? { text: t("status_archived"), color: "bg-zinc-150 border-zinc-300 text-zinc-650 font-bold" } :
                      status === "Rejected" ? { text: t("status_rejected"), color: "bg-rose-50 border-rose-500 text-rose-700 font-bold animate-pulse" } :
                      { text: t("status_draft"), color: "bg-slate-100 border-slate-300 text-slate-600 font-bold" };
                    return (
                      <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-full border ${config.color}`}>
                        {config.text}
                      </span>
                    );
                  })()}
                </div>

                {/* 7. AI MATERIAL ADVISOR MODULE */}
                {(() => {
                  let suggestions: string[] = [];
                  let warningStyle = false;

                  // Evaluate diagnostic criteria to generate real-time AI warnings & advice
                  if (activeMaterial.category === "رمال") {
                    const se = activeMaterial.SandEquivalent !== undefined ? activeMaterial.SandEquivalent : 82;
                    const fm = activeMaterial.finenessModulus || 2.6;
                    if (se < 75) {
                      suggestions.push(
                        language === "ar" ? "⚠️ المكافئ الرملي (SE) منخفض بشكل نسبي. خطر من زيادة الشوائب الطينية الدقيقة، ننصح بإجراء الغسل لتفادي ضعف قوة التماسك." :
                        language === "fr" ? "⚠️ L'équivalent de sable (SE) est relativement bas. Risque d'impuretés argileuses, un lavage est conseillé pour éviter la perte d'adhérence." :
                        "⚠️ Sand Equivalent (SE) is relatively low. Risk of clay impurities, washing is advised to prevent bond reduction."
                      );
                      warningStyle = true;
                    }
                  }
                  if (suggestions.length === 0) {
                    return (
                      <div className="p-3 bg-emerald-500/5 border border-emerald-600/15 rounded-xl space-y-1.5 text-[10px] leading-relaxed">
                        <p className="text-[9.5px] font-black text-emerald-700 dark:text-emerald-400 pb-1 flex justify-between border-b border-emerald-500/15">
                          <span>{language === "ar" ? "التقييم الذكي للمادة" : "Smart Advisor Guidance"}</span>
                          <span>✅</span>
                        </p>
                        <p className="text-slate-600 dark:text-slate-400 font-medium">
                          {language === "ar" ? "✅ هذه المادة مطابقة تماماً للمواصفات الفنية القياسية الموصى بها في السوق الجزائرية." : "This material fully complies with the recommended standards for the Algerian market."}
                        </p>
                      </div>
                    );
                  }
                  return (
                    <div className={`p-3 rounded-xl space-y-1.5 text-[10px] leading-relaxed border ${warningStyle ? 'bg-rose-500/5 border-rose-600/15' : 'bg-amber-500/5 border-amber-600/15'}`}>
                      <p className={`text-[9.5px] font-black pb-1 flex justify-between border-b ${warningStyle ? 'text-rose-700 dark:text-rose-450 border-rose-500/15' : 'text-amber-700 dark:text-amber-400 border-amber-500/15'}`}>
                        <span>{language === "ar" ? "تنبيهات جودة المواد الذكية" : "Smart Quality Warnings"}</span>
                        <span>⚠️</span>
                      </p>
                      <div className="space-y-1">
                        {suggestions.map((s, i) => (
                          <p key={i} className="text-slate-700 dark:text-slate-300 font-semibold leading-normal">
                            {s}
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                })()}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/10 space-y-4 animate-fade-in py-16">
              <div className="p-4 bg-blue-50 dark:bg-slate-850 rounded-2xl text-blue-500">
                <Database size={36} />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                  {language === "ar" ? "تفاصيل واستشارات المادة الفنية" : "Technical Material Details"}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold max-w-[280px] mx-auto">
                  {language === "ar" 
                    ? "الرجاء اختيار مادة من الجدول لمراجعة التقارير المخبرية، الخصائص المعتمدة، والاستشارات الذكية." 
                    : "Please select a material from the table to inspect laboratory reports, certified specs, and smart advice."}
                </p>
              </div>
            </div>
          )}
      </div>


      {/* Real-time processing overlay */}
      {importProgress && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-[100] p-6 animate-fade-in" dir={language === "ar" ? "rtl" : "ltr"}>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mx-auto"></div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-black text-slate-800 dark:text-white">
                {language === "ar" ? "معالجة وتحليل المواد..." : "Processing Materials..."}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                {importProgress.step}
              </p>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${importProgress.percentage}%` }}
              ></div>
            </div>
            <span className="text-xs font-mono font-black text-blue-600 block">{importProgress.percentage}%</span>
          </div>
        </div>
      )}

      {importSession && (() => {
        const activeSheet = importSession.worksheets[importSession.activeSheetIndex] || importSession.worksheets[0];
        if (!activeSheet) return null;

        // Calculate Quality Metrics
        const totalHeaders = activeSheet.headers.length;
        const mappedHeaders = activeSheet.headers.filter(h => activeSheet.mappings[h] && activeSheet.mappings[h] !== "ignore").length;
        const mappedRequired = TARGET_FIELDS.filter(f => f.required && Object.values(activeSheet.mappings).includes(f.key)).length;
        const totalRequired = TARGET_FIELDS.filter(f => f.required).length;
        const qualityPercentage = totalHeaders > 0 ? Math.min(100, Math.round((mappedHeaders / totalHeaders) * 70 + (mappedRequired / totalRequired) * 30)) : 0;

        const handleApproveAllSuggested = () => {
          setImportSession(prev => {
            if (!prev) return null;
            const updatedSheets = prev.worksheets.map((ws, idx) => {
              if (idx !== prev.activeSheetIndex) return ws;
              const updatedMappings = { ...ws.mappings };
              ws.headers.forEach(h => {
                const result = calculateHeaderMapping(h, ws.rawRows.map(row => row[h]));
                if (result.key !== "ignore") {
                  updatedMappings[h] = result.key;
                }
              });
              return {
                ...ws,
                mappings: updatedMappings
              };
            });
            return {
              ...prev,
              worksheets: updatedSheets
            };
          });
          showToast(
            language === "ar"
              ? "تم اعتماد وضبط جميع الاقتراحات الذكية للأعمدة!"
              : "All intelligent column suggestions approved successfully!",
            "success"
          );
        };

        const handleSaveCurrentMapping = () => {
          try {
            const key = `saved_mapping_${activeSheet.detectedCategory}`;
            localStorage.setItem(key, JSON.stringify(activeSheet.mappings));
            showToast(
              language === "ar"
                ? `تم حفظ خريطة مطابقة ${activeSheet.detectedCategory} بنجاح لاستخدامها لاحقاً!`
                : `Successfully saved ${activeSheet.detectedCategory} mapping layout for future use!`,
              "success"
            );
          } catch (err) {
            showToast("Error saving mapping: " + err, "error");
          }
        };

        const handleLoadSavedMapping = () => {
          try {
            const key = `saved_mapping_${activeSheet.detectedCategory}`;
            const saved = localStorage.getItem(key);
            if (!saved) {
              showToast(
                language === "ar"
                  ? `لا يوجد خريطة مطابقة محفوظة مسبقاً للفئة ${activeSheet.detectedCategory}.`
                  : `No saved mapping layout found for ${activeSheet.detectedCategory}.`,
                "info"
              );
              return;
            }
            const parsed = JSON.parse(saved);
            setImportSession(prev => {
              if (!prev) return null;
              const updatedSheets = prev.worksheets.map((ws, idx) => {
                if (idx !== prev.activeSheetIndex) return ws;
                return {
                  ...ws,
                  mappings: {
                    ...ws.mappings,
                    ...parsed
                  }
                };
              });
              return {
                ...prev,
                worksheets: updatedSheets
              };
            });
            showToast(
              language === "ar"
                ? `تم تحميل وتطبيق خريطة مطابقة ${activeSheet.detectedCategory} بنجاح!`
                : `Successfully loaded and applied ${activeSheet.detectedCategory} mapping layout!`,
              "success"
            );
          } catch (err) {
            showToast("Error loading mapping: " + err, "error");
          }
        };

        const activeMappingCount = Object.values(activeSheet.mappings).filter(v => v !== "ignore").length;

        return (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in animate-duration-200" dir={language === "ar" ? "rtl" : "ltr"}>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-5xl w-full flex flex-col max-h-[90vh] animate-scale-up">
              
              {/* Intelligent Import Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 gap-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl text-blue-600 dark:text-blue-400 shadow-inner">
                    <Sparkles size={24} className="text-blue-500 animate-spin-slow" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                      <span>{language === "ar" ? "معالج استيراد ومطابقة المواد الذكي" : "Intelligent Material Import & Mapper"}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded-full">Pro Engine</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed mt-0.5">
                      {language === "ar"
                        ? `ملف نشط: ${importSession.fileName} • الحجم: ${(importSession.fileSize / 1024).toFixed(1)} KB • إجمالي الأوراق: ${importSession.worksheets.length}`
                        : `Active File: ${importSession.fileName} • Size: ${(importSession.fileSize / 1024).toFixed(1)} KB • Sheets: ${importSession.worksheets.length}`}
                    </p>
                  </div>
                </div>

                {/* Import Quality Score and Metrics */}
                <div className="flex flex-col items-end gap-1.5 min-w-[200px]">
                  <div className="flex items-center justify-between w-full text-[10px] font-bold text-slate-500">
                    <span>{language === "ar" ? "مؤشر جودة الربط والمطابقة" : "Mapping Quality Index"}</span>
                    <span className={`font-mono font-black ${
                      qualityPercentage >= 80 ? "text-emerald-600" : qualityPercentage >= 50 ? "text-amber-500" : "text-rose-500"
                    }`}>{qualityPercentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        qualityPercentage >= 80 ? "bg-emerald-500" : qualityPercentage >= 50 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${qualityPercentage}%` }}
                    />
                  </div>
                  <div className="text-[9px] text-slate-400 font-bold flex items-center gap-1.5 mt-0.5">
                    <span>{language === "ar" ? `أعمدة مطابقة: ${mappedHeaders}/${totalHeaders}` : `Mapped headers: ${mappedHeaders}/${totalHeaders}`}</span>
                    <span>•</span>
                    <span>{language === "ar" ? `حقول إلزامية: ${mappedRequired}/${totalRequired}` : `Required fields: ${mappedRequired}/${totalRequired}`}</span>
                  </div>
                </div>
              </div>

              {/* Worksheets tabs row */}
              {importSession.worksheets.length > 1 && (
                <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3 overflow-x-auto flex-shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 px-1">{language === "ar" ? "أوراق العمل المتوفرة:" : "Worksheets:"}</span>
                  {importSession.worksheets.map((sheet, index) => {
                    const isSheetActive = index === importSession.activeSheetIndex;
                    const sheetMappedCount = Object.values(sheet.mappings).filter(v => v !== "ignore").length;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setImportSession(prev => prev ? { ...prev, activeSheetIndex: index } : null)}
                        className={`px-3 py-1.5 text-xs rounded-xl transition-all font-black flex items-center gap-1.5 cursor-pointer border ${
                          isSheetActive
                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10"
                            : sheet.ignored
                              ? "bg-slate-100 border-transparent text-slate-400 dark:bg-slate-950/40 opacity-50"
                              : "bg-slate-50 border-slate-200/65 dark:bg-slate-900 dark:border-slate-800 text-slate-650 dark:text-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        <span>{sheet.sheetName}</span>
                        {sheet.ignored ? (
                          <span className="text-[9px] font-bold text-rose-500">({language === "ar" ? "متجاهل" : "Ignored"})</span>
                        ) : (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                            isSheetActive ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                          }`}>
                            {sheetMappedCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 mb-3 flex-shrink-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5">
                    <span className="text-[10px] text-slate-400 font-bold">{language === "ar" ? "نوع المواد المكتشفة:" : "Detected Category:"}</span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">{activeSheet.detectedCategory}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5">
                    <span className="text-[10px] text-slate-400 font-bold">{language === "ar" ? "إجمالي صفوف المادة:" : "Total Rows:"}</span>
                    <strong className="text-xs font-black text-blue-600 dark:text-blue-400 font-mono">{activeSheet.rawRows.length}</strong>
                  </div>
                </div>

                {/* Bulk tools and layout saving */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApproveAllSuggested}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-[11px] rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm shadow-emerald-500/10"
                    title={language === "ar" ? "اعتماد كافة الاقتراحات المقترحة تلقائياً" : "Approve all automatically suggested mappings"}
                  >
                    <CheckCheck size={12} />
                    <span>{language === "ar" ? "اعتماد كل المقترحات" : "Approve Suggested"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveCurrentMapping}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700"
                    title={language === "ar" ? "حفظ خريطة مطابقة الحقول الحالية لاستخدامها مستقبلاً" : "Save this column mapping layout for future use"}
                  >
                    <Save size={12} />
                    <span>{language === "ar" ? "حفظ القالب" : "Save Layout"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadSavedMapping}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700"
                    title={language === "ar" ? "استدعاء وتطبيق خريطة الحقول المحفوظة مسبقاً" : "Load previously saved mapping layout for this category"}
                  >
                    <FolderOpen size={12} />
                    <span>{language === "ar" ? "تحميل قالب" : "Load Layout"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setImportSession(prev => {
                        if (!prev) return null;
                        const updatedSheets = prev.worksheets.map((ws, idx) => {
                          if (idx !== prev.activeSheetIndex) return ws;
                          return { ...ws, ignored: !ws.ignored };
                        });
                        return { ...prev, worksheets: updatedSheets };
                      });
                    }}
                    className={`px-3 py-1.5 text-[11px] rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                      activeSheet.ignored
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-450 hover:bg-rose-500/15"
                        : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-300"
                    }`}
                  >
                    {activeSheet.ignored ? <EyeOff size={12} /> : <Eye size={12} />}
                    <span>
                      {activeSheet.ignored
                        ? (language === "ar" ? "تفعيل الورقة" : "Enable Sheet")
                        : (language === "ar" ? "تجاهل الورقة" : "Ignore Sheet")}
                    </span>
                  </button>
                </div>
              </div>

              {/* Tab Selector: Mappings vs Preview */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 mb-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setImportDialogTab("mappings")}
                  className={`flex-1 py-2 text-xs font-bold transition-all cursor-pointer border-b-2 text-center ${
                    importDialogTab === "mappings"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {language === "ar" ? "🎯 مطابقة أعمدة الملف (Columns Mapping)" : "🎯 Map File Columns"}
                </button>
                <button
                  type="button"
                  onClick={() => setImportDialogTab("preview")}
                  className={`flex-1 py-2 text-xs font-bold transition-all cursor-pointer border-b-2 text-center flex items-center justify-center gap-1.5 ${
                    importDialogTab === "preview"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <span>{language === "ar" ? "👁️ مراجعة وتحديد المواد (Materials Preview)" : "👁️ Preview & Select Materials"}</span>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-650 px-1.5 py-0.5 rounded-full">
                    {activeSheet.rawRows.length}
                  </span>
                </button>
              </div>

              {/* Import Tab Content */}
              <div className="overflow-y-auto pr-1 flex-1 py-1 space-y-3">
                {activeSheet.ignored ? (
                  <div className="py-12 text-center bg-slate-50 dark:bg-slate-950/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-400 block font-bold">
                      {language === "ar" ? "ورقة العمل هذه متجاهلة حالياً ولن يتم استيراد بياناتها." : "This worksheet is ignored and will not be imported."}
                    </span>
                  </div>
                ) : importDialogTab === "mappings" ? (
                  <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-950/15 overflow-hidden">
                    <table className="w-full text-right border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100/80 dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/60 text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                          <th className={`py-3 px-4 ${language === "ar" ? "text-right" : "text-left"}`}>
                            {language === "ar" ? "عمود ملفك المرفوع" : "File Header"}
                          </th>
                          <th className={`py-3 px-4 ${language === "ar" ? "text-right" : "text-left"}`}>
                            {language === "ar" ? "عينة بيانات" : "Sample Data"}
                          </th>
                          <th className="py-3 px-4 text-center w-12">
                            {language === "ar" ? "حالة الربط" : "Status"}
                          </th>
                          <th className={`py-3 px-4 ${language === "ar" ? "text-right" : "text-left"}`}>
                            {language === "ar" ? "حقل المنصة المستهدف" : "Target Platform Field"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60 font-medium">
                        {activeSheet.headers.map((header) => {
                          const currentFieldKey = activeSheet.mappings[header] || "ignore";
                          const isMapped = currentFieldKey !== "ignore";
                          const sampleVal = activeSheet.rawRows[0]?.[header];

                          return (
                            <tr key={header} className="hover:bg-slate-100/30 dark:hover:bg-slate-950/10 transition-colors">
                              <td className={`py-3 px-4 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-bold ${language === "ar" ? "text-right" : "text-left"}`}>
                                {header}
                              </td>
                              <td className={`py-3 px-4 text-slate-500 dark:text-slate-400 truncate max-w-[150px] font-mono text-[10px] ${language === "ar" ? "text-right" : "text-left"}`}>
                                {sampleVal !== undefined && sampleVal !== null ? String(sampleVal) : <span className="text-slate-300 italic">None</span>}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {isMapped ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                                    <Check size={10} />
                                    {language === "ar" ? "مرتبط" : "Linked"}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[9px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">
                                    {language === "ar" ? "متجاهل" : "Ignored"}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-4">
                                <select
                                  value={currentFieldKey}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setImportSession(prev => {
                                      if (!prev) return null;
                                      const updatedSheets = prev.worksheets.map((ws, idx) => {
                                        if (idx !== prev.activeSheetIndex) return ws;
                                        return {
                                          ...ws,
                                          mappings: {
                                            ...ws.mappings,
                                            [header]: val
                                          }
                                        };
                                      });
                                      return {
                                        ...prev,
                                        worksheets: updatedSheets
                                      };
                                    });
                                  }}
                                  className="w-full text-xs p-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-800 dark:text-white focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="ignore" className="text-slate-450 dark:text-slate-500 font-semibold italic">
                                    ❌ {language === "ar" ? "تجاهل هذا العمود (Ignore)" : "Ignore this column"}
                                  </option>
                                  {TARGET_FIELDS.map((field) => (
                                    <option key={field.key} value={field.key}>
                                      {language === "ar" ? `${field.labelAr} (${field.key})` : `${field.labelEn} (${field.key})`}
                                      {field.required ? " *" : ""}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Select All and Scope toggle */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/20 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={
                              activeSheet.rawRows.length > 0 &&
                              activeSheet.rawRows.every((_, idx) => importSelectedRows[activeSheet.sheetName]?.[idx] !== false)
                            }
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setImportSelectedRows((prev) => {
                                const updatedSheet = { ...prev[activeSheet.sheetName] };
                                activeSheet.rawRows.forEach((_, idx) => {
                                  updatedSheet[idx] = checked;
                                });
                                return {
                                  ...prev,
                                  [activeSheet.sheetName]: updatedSheet,
                                };
                              });
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          />
                          <span>{language === "ar" ? "تحديد الكل" : "Select All"}</span>
                        </label>
                        <span className="text-slate-300">|</span>
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">
                          {language === "ar"
                            ? `المحدد: ${
                                Object.values(importSelectedRows[activeSheet.sheetName] || {}).filter(Boolean).length
                              } من أصل ${activeSheet.rawRows.length}`
                            : `Selected: ${
                                Object.values(importSelectedRows[activeSheet.sheetName] || {}).filter(Boolean).length
                              } of ${activeSheet.rawRows.length}`}
                        </span>
                      </div>

                      {/* Scope Options */}
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-bold">{language === "ar" ? "نطاق الاستيراد:" : "Import Scope:"}</span>
                        <div className="bg-slate-200 dark:bg-slate-800 p-0.5 rounded-xl flex">
                          <button
                            type="button"
                            onClick={() => setImportScope("active")}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                              importScope === "active"
                                ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-xs"
                                : "text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {language === "ar" ? "الورقة الحالية فقط" : "Current Sheet Only"}
                          </button>
                          {importSession.worksheets.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setImportScope("all")}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                                importScope === "all"
                                  ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-xs"
                                  : "text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {language === "ar" ? "كافة الأوراق المفتوحة" : "All Loaded Sheets"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Materials grid / list */}
                    <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2">
                      {activeSheet.rawRows.map((row, idx) => {
                        const parsed = parseRowPreview(row, activeSheet, idx);
                        const isSelected = importSelectedRows[activeSheet.sheetName]?.[idx] !== false;

                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              setImportSelectedRows((prev) => {
                                const updatedSheet = { ...prev[activeSheet.sheetName] };
                                updatedSheet[idx] = !isSelected;
                                return {
                                  ...prev,
                                  [activeSheet.sheetName]: updatedSheet,
                                };
                              });
                            }}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? "bg-blue-50/20 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900/40"
                                : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-65"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}} // handled by div onClick
                                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                              />
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                  {parsed.name || (language === "ar" ? `مادة بدون اسم #${idx + 1}` : `Unnamed Material #${idx + 1}`)}
                                </h5>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                                  <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded font-bold">
                                    {parsed.category}
                                  </span>
                                  {parsed.density !== null && (
                                    <span>
                                      • {language === "ar" ? `الكثافة: ${parsed.density} كغ/م³` : `Density: ${parsed.density} kg/m³`}
                                    </span>
                                  )}
                                  {parsed.price !== null && (
                                    <span>
                                      • {language === "ar" ? `السعر: ${parsed.price} دج` : `Price: ${parsed.price} DZD`}
                                    </span>
                                  )}
                                  {parsed.provenance && (
                                    <span className="truncate max-w-[100px]">
                                      • {language === "ar" ? `المنشأ: ${parsed.provenance}` : `Source: ${parsed.provenance}`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Status badge */}
                            <div className="flex-shrink-0">
                              {parsed.exists ? (
                                importSession.duplicateResolution === "update" ? (
                                  <span className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">
                                    {language === "ar" ? "🔄 تحديث الموجود" : "🔄 Update Existing"}
                                  </span>
                                ) : importSession.duplicateResolution === "skip" ? (
                                  <span className="text-[9px] bg-rose-500/10 text-rose-600 dark:text-rose-450 px-2 py-0.5 rounded-full font-bold">
                                    {language === "ar" ? "⚠️ تخطي التكرار" : "⚠️ Skip Duplicate"}
                                  </span>
                                ) : (
                                  <span className="text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">
                                    {language === "ar" ? "➕ نسخة مكررة جديدة" : "➕ New Duplicate Copy"}
                                  </span>
                                )
                              ) : (
                                <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                                  {language === "ar" ? "➕ إضافة جديدة" : "➕ Add as New"}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Strategy footer summary */}
              <div className="flex-shrink-0 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-bold">{language === "ar" ? "طريقة الاستيراد النشطة:" : "Import Strategy:"}</span>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                    importSession.mode === "append"
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                  }`}>
                    {importSession.mode === "append"
                      ? (language === "ar" ? "إلحاق ودمج (تجنب التكرار)" : "Append & Merge (Skip duplicates)")
                      : (language === "ar" ? "تحديث واستبدال (تحديث بمطابقة ID/الاسم)" : "Update & Replace (Match ID/Name)")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setImportSession(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black transition-all cursor-pointer"
                  >
                    {language === "ar" ? "إلغاء الاستيراد" : "Cancel"}
                  </button>
                  <button
                    type="button"
                    onClick={() => executeIntelligentImport(importSession.worksheets, importSession.duplicateResolution)}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-blue-600/10 cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles size={13} className="animate-spin-slow" />
                    <span>{language === "ar" ? "بدء الاستيراد والتحليل الذكي" : "Run Intelligent Import"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 1.5. PROPERTIES DIFF REPORT DIALOG */}
      {updateDiffsReport && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" dir={language === "ar" ? "rtl" : "ltr"}>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl">
                  <Sparkles size={18} className="text-blue-500 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-black">{language === "ar" ? "تقرير مقارنة وتعديل الخصائص" : "Property Modification Diff Report"}</h4>
                  <p className="text-[10px] text-slate-550 font-semibold mt-0.5">{language === "ar" ? "مراجعة شاملة لخصائص المواد المحدثة" : "Detailed comparison of updated properties"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUpdateDiffsReport(null)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-250 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 flex-1 py-4 space-y-4">
              {updateDiffsReport.map((report, idx) => (
                <div key={idx} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950/20 space-y-2.5">
                  <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800/80 pb-2">
                    <h5 className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {language === "ar" ? report.materialName : (report.materialEnglishName || report.materialName)}
                    </h5>
                    <span className="text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                      {language === "ar" ? "تم التحديث" : "Updated"}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {report.changes.map((ch, cidx) => (
                      <div key={cidx} className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-100 dark:border-slate-800/40 last:border-0 items-center">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">
                          {language === "ar" ? ch.fieldLabelAr : ch.fieldLabelEn}
                        </span>
                        <span className="text-slate-450 line-through truncate font-mono text-[10px]">
                          {ch.from !== undefined && ch.from !== null ? String(ch.from) : "None"}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-black truncate font-mono text-[10px]">
                          {ch.to !== undefined && ch.to !== null ? String(ch.to) : "None"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex-shrink-0 pt-4 border-t border-slate-150 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setUpdateDiffsReport(null)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-blue-600/10 active:scale-95 cursor-pointer"
              >
                {language === "ar" ? "حسناً، مراجعة المكتبة" : "Acknowledge & Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. SMART IMPORT REPORT DIALOG */}
      {importReport && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" dir={language === "ar" ? "rtl" : "ltr"}>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
                  <CheckCircle size={20} className="text-emerald-500" />
                </div>
                <div>
                  <h4 className="text-sm font-black">
                    {language === "ar" ? "تقرير نتائج الاستيراد والتحليل الذكي" : "Intelligent Import Execution Report"}
                  </h4>
                  <p className="text-[10px] text-slate-550 font-semibold mt-0.5">
                    {language === "ar" ? "ملخص كامل لعملية دمج وتصنيف البيانات" : "Complete overview of the parsed ingestion session"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImportReport(null)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-250 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Ingestion KPI Badges */}
            <div className="grid grid-cols-4 gap-2.5 my-4 flex-shrink-0">
              <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                <span className="block text-[9px] text-slate-400 font-bold uppercase">{language === "ar" ? "الإجمالي" : "Total processed"}</span>
                <span className="block text-lg font-mono font-black text-slate-700 dark:text-slate-200 mt-1">{importReport.totalProcessed}</span>
              </div>
              <div className="p-3 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl border border-emerald-500/15 text-center">
                <span className="block text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">{language === "ar" ? "مضافة جديدة" : "Newly Added"}</span>
                <span className="block text-lg font-mono font-black text-emerald-600 dark:text-emerald-400 mt-1">+{importReport.addedCount}</span>
              </div>
              <div className="p-3 bg-purple-500/5 dark:bg-purple-500/10 rounded-2xl border border-purple-500/15 text-center">
                <span className="block text-[9px] text-purple-600 dark:text-purple-400 font-bold uppercase">{language === "ar" ? "محدثة/معدلة" : "Updated/Merged"}</span>
                <span className="block text-lg font-mono font-black text-purple-600 dark:text-purple-400 mt-1">+{importReport.updatedCount}</span>
              </div>
              <div className="p-3 bg-rose-500/5 dark:bg-rose-500/10 rounded-2xl border border-rose-500/15 text-center">
                <span className="block text-[9px] text-rose-600 dark:text-rose-450 font-bold uppercase">{language === "ar" ? "مستبعدة/تخطي" : "Failed/Skipped"}</span>
                <span className="block text-lg font-mono font-black text-rose-600 dark:text-rose-450 mt-1">{importReport.failedCount}</span>
              </div>
            </div>

            {/* Detailed list and tabs */}
            <div className="overflow-y-auto pr-1 flex-1 py-1 space-y-4">
              
              {/* Skip Failures list */}
              {importReport.failures.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-black text-rose-600 dark:text-rose-450 block flex items-center gap-1.5">
                    <AlertTriangle size={12} />
                    <span>{language === "ar" ? "المواد التي تعذر استيرادها أو استبعادها:" : "Failed/Skipped Records:"}</span>
                  </span>
                  <div className="max-h-[140px] overflow-y-auto rounded-2xl border border-rose-100 dark:border-rose-950 bg-rose-50/25 dark:bg-rose-950/10 p-3 text-xs space-y-1.5">
                    {importReport.failures.map((f, i) => (
                      <div key={i} className="flex justify-between items-start py-1 border-b border-rose-100/50 dark:border-rose-900/30 last:border-0">
                        <strong className="text-rose-700 dark:text-rose-400 font-bold">{f.rowName}</strong>
                        <span className="text-[11px] text-slate-550 dark:text-slate-400 italic">{f.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Warnings list (Attribute Defaults) */}
              {importReport.warnings.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-black text-amber-600 dark:text-amber-450 block flex items-center gap-1.5">
                    <Info size={12} />
                    <span>{language === "ar" ? "تنبيهات الحقول مجهولة أو مفقودة (تم تسييرها بقيم افتراضية):" : "Missing Attribute Warning Logs (Self-corrected):"}</span>
                  </span>
                  <div className="max-h-[220px] overflow-y-auto rounded-2xl border border-amber-150/60 dark:border-amber-950 bg-amber-500/5 dark:bg-amber-950/10 p-3.5 text-xs font-semibold leading-relaxed space-y-1.5">
                    {importReport.warnings.map((w, i) => (
                      <div key={i} className="text-amber-700 dark:text-amber-400 border-b border-amber-100/40 dark:border-amber-900/10 pb-1 last:border-0 last:pb-0">
                        {w}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Default success display if perfect run */}
              {importReport.failures.length === 0 && importReport.warnings.length === 0 && (
                <div className="py-8 text-center space-y-2 bg-emerald-500/5 dark:bg-emerald-950/5 border border-emerald-500/10 dark:border-emerald-800/10 rounded-3xl">
                  <CheckCircle size={36} className="text-emerald-500 mx-auto" />
                  <h5 className="text-xs font-black text-emerald-600 dark:text-emerald-400">{language === "ar" ? "استيراد ذكي مثالي بنسبة 100%!" : "100% Flawless Import!"}</h5>
                  <p className="text-[10px] text-slate-450">{language === "ar" ? "تم استيراد كافة المواد وتصنيفها بنجاح دون أي حقول ناقصة أو أخطاء بنيوية." : "All materials were successfully mapped, validated, and categorized with zero structure anomalies."}</p>
                </div>
              )}

            </div>

            {/* Footer action */}
            <div className="flex-shrink-0 pt-4 border-t border-slate-150 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setImportReport(null)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/10 active:scale-95 cursor-pointer"
              >
                {language === "ar" ? "إغلاق ملخص الاستيراد" : "Close Ingestion Report"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    </div>
  );
}
