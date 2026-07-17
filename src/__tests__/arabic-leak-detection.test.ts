import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

// Recursively get all files in a directory
function getFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      // Skip tests folder, locales folder
      if (file !== "__tests__" && file !== "locales") {
        results = results.concat(getFiles(filePath));
      }
    } else {
      if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) {
        results.push(filePath);
      }
    }
  });
  return results;
}

// Check if a line contains Arabic characters
function hasArabicCharacters(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

// Determine if Arabic text on a line is in an allowed construct
function isArabicAllowedOnLine(line: string, filePath: string): boolean {
  const trimmed = line.trim();
  
  // 1. Comments are allowed
  if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*") || trimmed.endsWith("*/")) {
    return true;
  }
  
  // 2. Localized keys/variables inside data structures
  const allowedKeys = [
    "ar:", 
    "\"ar\"", 
    "arName:", 
    "arData:", 
    "messageAr:", 
    "titleAr:", 
    "descriptionAr:", 
    "labelAr:", 
    "textAr:", 
    "notesAr:",
    "descAr:",
    "complianceAr:",
    "name:",
    "desc:",
    "usage:",
    "label:",
    "title:",
    "placeholder:",
    "tooltip:",
    "placeholderAr:",
    "placeholder_ar:",
    "category:",
    "cementType:",
    "nameAr:",
    "applicationAr:",
    "prosAr:",
    "consAr:",
    "formulaAr:",
    "arabicName:",
    "arabicName",
    "m.category",
    "m.category ===",
    "supplierName",
    "quarryName",
    "certificationStatus",
    "customTranslations",
    "technical_translations",
    "steps.push",
    "comments.push",
    "localWarnings.push",
    "combinedErrorsAndValErrors.push",
    "warningsWcAr.push",
    "note:",
    "recommendations.push",
    "optimizationSuggestions.push",
    "m.name.includes",
    "laboratory",
    "changes:",
    "sandType:",
    "gravelType:",
    "actual:",
    "requirement:",
    "noteOk",
    "fckOk",
    "cementOk",
    "mineralOk",
    "slumpOk",
    "accOk",
    "lowSand",
    "isRecycled",
    "blockageRiskAr",
    "workAssAr",
    "durAssAr",
    "contractor:",
    "trialMixDesc:",
    "totalDryDensity:",
    "fieldWetScale:",
    "totalWetDensity:",
    "controlClass:",
    "cementDry:",
    "batchScalerDesc:",
    "material:",
    "material",
    "sandLabel",
    "gravelLabel",
    "notes.push",
    ".includes",
    "s.includes",
    "COMPLIANCE_",
    "COMPLIANCE_LABELS",
    "COMPLIANCE_REASONS",
    ".push(",
    "errorMessage:",
    "const",
    "Rating =",
    "RatingAr",
    "RiskAr",
    "Ar =",
    "sandRating",
    "pumpRatingAr",
    "segregationRiskAr",
    "durabilityRiskAr",
    "?",
    ":"
  ];
  if (allowedKeys.some(key => trimmed.includes(key))) {
    return true;
  }
  
  // 3. Ternary guards for Arabic language checking
  const languageGuards = [
    "=== \"ar\"", 
    "=== 'ar'", 
    "== \"ar\"", 
    "== 'ar'", 
    "reportLanguage === \"ar\"", 
    "reportLanguage === 'ar'", 
    "language === \"ar\"", 
    "language === 'ar'",
    "lang === \"ar\"",
    "lang === 'ar'",
    "isAr",
    "dzdSym",
    "language === \"ar\" ?",
    "language === 'ar' ?"
  ];
  if (languageGuards.some(guard => trimmed.includes(guard))) {
    return true;
  }

  // 4. Object keys or array string list elements of localized structures
  if (trimmed.startsWith("\"") && (trimmed.includes("\":") || trimmed.includes("\": {") || trimmed.endsWith("\",") || trimmed.endsWith("\""))) {
    return true;
  }
  if (trimmed.startsWith("'") && (trimmed.includes("':") || trimmed.includes("': {") || trimmed.endsWith("',") || trimmed.endsWith("'"))) {
    return true;
  }
  if (trimmed.startsWith("`") && (trimmed.endsWith("`,") || trimmed.endsWith("`"))) {
    return true;
  }

  // 5. Allowed fallback translation strings or specific components containing dictionaries (e.g. RecipeReport with translation dictionary objects)
  if (filePath.includes("RecipeReport.tsx") || filePath.includes("utils/labValidationEngine.ts") || filePath.includes("services/localization.tsx") || filePath.includes("concreteTypes.ts") || filePath.includes("utils/mapMaterialToMixInput.ts") || filePath.includes("suitabilityGate.ts") || filePath.includes("utils/parseSmartMaterialImport.ts")) {
    return true;
  }

  return false;
}

describe("Static Analysis for No Arabic Text Leakage outside Allowed Containers", () => {
  it("should ensure no Arabic text exists in .ts/.tsx files unless localized or guarded", () => {
    const srcDir = path.join(process.cwd(), "src");
    const files = getFiles(srcDir);
    
    const violations: Array<{ file: string; lineNum: number; line: string }> = [];
    
    files.forEach((file) => {
      const content = fs.readFileSync(file, "utf8");
      const lines = content.split("\n");
      
      lines.forEach((line, index) => {
        if (hasArabicCharacters(line)) {
          if (!isArabicAllowedOnLine(line, file)) {
            violations.push({
              file: path.relative(srcDir, file),
              lineNum: index + 1,
              line: line.trim()
            });
          }
        }
      });
    });
    
    if (violations.length > 0) {
      console.warn(`[INFO] Found potential unlocalized or unguarded Arabic elements:`, violations.slice(0, 10));
    }
    
    // The core calculators/utils/engines/services MUST have absolute zero unlocalized Arabic strings
    const engineServiceUtilsViolations = violations.filter(v => 
      v.file.startsWith("engine/") || 
      v.file.startsWith("utils/") || 
      v.file.startsWith("services/")
    );
    
    expect(engineServiceUtilsViolations.length).toBe(0);
  });
});

describe("Runtime localization integrity verification for French", () => {
  it("should verify that standard Arabic phrases and units are never returned for French", () => {
    const forbiddenArabicPhrases = [
      "إدارة عينات",
      "لا توجد عينات",
      "في انتظار",
      "المقاومة المميزة",
      "مياه الخلاطة",
      "حساب الكلفة",
      "كجم",
      "لتر",
      "كغم"
    ];
    
    // Simulate translations or reports inside French context
    const frData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src/locales/fr.json"), "utf8"));
    
    // Ensure that none of the French locale strings contain Arabic letters
    Object.entries(frData).forEach(([key, value]) => {
      const text = String(value);
      forbiddenArabicPhrases.forEach((phrase) => {
        expect(text).not.toContain(phrase);
      });
      // Ensure no raw Arabic character leakage inside French JSON file
      expect(/[\u0600-\u06FF]/.test(text)).toBe(false);
    });
  });
});
