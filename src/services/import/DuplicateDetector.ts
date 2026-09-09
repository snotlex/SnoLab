import { DuplicateMatch, DuplicateResolutionStrategy } from "./types";
import { EngineeringMaterial } from "../../types";

export class DuplicateDetector {
  /**
   * Standardizes name for collision matching (removes accents, punctuation, normalize Arabic alifs/yehs).
   */
  public static normalizeNameForMatching(name: string): string {
    if (!name) return "";
    return name
      .toLowerCase()
      .trim()
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/[يى]/g, "ي")
      .replace(/[\s_\-()\/\\.,;:]/g, "");
  }

  /**
   * Compares an imported draft against an existing library of materials.
   */
  public static findDuplicate(
    draftId: string,
    draftName: string,
    draftCategory: string,
    draftOrigin: string | undefined,
    existingMaterials: EngineeringMaterial[]
  ): DuplicateMatch | null {
    const normDraftName = DuplicateDetector.normalizeNameForMatching(draftName);
    if (!normDraftName) return null;

    for (const existing of existingMaterials) {
      // 1. Exact ID match
      if (existing.id === draftId || existing.MaterialID === draftId) {
        const isSys = existing.isSystem || existing.materialSource === "system" || existing.sourceType === "system_demo";
        return {
          importedDraftId: draftId,
          importedName: draftName,
          existingId: existing.id,
          existingName: existing.name,
          matchReason: "EXACT_ID",
          existingSourceType: isSys ? "SYSTEM" : "USER",
          suggestedResolution: isSys ? "IMPORT_NEW" : "REPLACE",
          chosenResolution: isSys ? "IMPORT_NEW" : "REPLACE"
        };
      }

      // 2. Name match (Arabic or English or canonical Name)
      const normExistingName = DuplicateDetector.normalizeNameForMatching(existing.name);
      const normExistingAr = DuplicateDetector.normalizeNameForMatching(existing.ArabicName || "");
      const normExistingEn = DuplicateDetector.normalizeNameForMatching(existing.englishName || existing.EnglishName || "");

      const isNameMatched =
        normDraftName === normExistingName ||
        (normExistingAr && normDraftName === normExistingAr) ||
        (normExistingEn && normDraftName === normExistingEn);

      if (isNameMatched) {
        const isSys = existing.isSystem || existing.materialSource === "system" || existing.sourceType === "system_demo";
        return {
          importedDraftId: draftId,
          importedName: draftName,
          existingId: existing.id,
          existingName: existing.name,
          matchReason: "NORMALIZED_NAME",
          existingSourceType: isSys ? "SYSTEM" : "USER",
          suggestedResolution: isSys ? "IMPORT_NEW" : "REPLACE",
          chosenResolution: isSys ? "IMPORT_NEW" : "REPLACE"
        };
      }
    }

    return null;
  }

  /**
   * Generates a collision-free name and ID when strategy is IMPORT_NEW.
   */
  public static generateUniqueNameAndId(
    baseName: string,
    baseId: string,
    existingMaterials: EngineeringMaterial[]
  ): { uniqueName: string; uniqueId: string } {
    let uniqueName = `${baseName} (مستورد)`;
    let cleanId = baseId.startsWith("USR-") ? baseId : `USR-${baseId.replace(/^(sys-|sys_|preset-)/i, "")}`;
    let uniqueId = cleanId;

    let counter = 1;
    const exists = (name: string, id: string) => {
      const normN = DuplicateDetector.normalizeNameForMatching(name);
      return existingMaterials.some(m => DuplicateDetector.normalizeNameForMatching(m.name) === normN || m.id === id);
    };

    while (exists(uniqueName, uniqueId)) {
      counter++;
      uniqueName = `${baseName} (${counter})`;
      uniqueId = `${cleanId}-${counter}`;
    }

    return { uniqueName, uniqueId };
  }
}
