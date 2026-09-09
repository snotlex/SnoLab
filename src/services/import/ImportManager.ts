import {
  ParsedMaterialDraft,
  ImportPipelineReport,
  DuplicateMatch,
  DuplicateResolutionStrategy,
  UnmappedHeaderEntry
} from "./types";
import { ExcelParser } from "./ExcelParser";
import { PDFParser } from "./PDFParser";
import { DuplicateDetector } from "./DuplicateDetector";
import { EngineeringMaterial } from "../../types";
import { MaterialService } from "../MaterialService";

export class ImportManager {
  /**
   * Analyzes an uploaded file (Excel, CSV, JSON, or PDF) and generates
   * a comprehensive validation and preview report with duplicate detection.
   */
  public static async analyzeFile(
    file: File | { name: string; arrayBuffer: () => Promise<ArrayBuffer> },
    existingMaterials: EngineeringMaterial[],
    onProgress?: (message: string, percent: number) => void
  ): Promise<ImportPipelineReport> {
    const startTime = Date.now();
    const fileName = file.name;
    const lowerName = fileName.toLowerCase();
    const buffer = await file.arrayBuffer();

    let drafts: ParsedMaterialDraft[] = [];
    let sheetsOrPages: string[] = [];
    let unmappedHeaders: UnmappedHeaderEntry[] = [];
    let fileType: "EXCEL" | "PDF" | "CSV" | "JSON" = "EXCEL";
    let hasOcrItems = false;

    if (lowerName.endsWith(".pdf")) {
      fileType = "PDF";
      const pdfResult = await PDFParser.parsePdf(buffer, fileName, onProgress);
      drafts = pdfResult.drafts;
      hasOcrItems = pdfResult.hasOcrItems;
      sheetsOrPages = Array.from({ length: pdfResult.pagesProcessed }, (_, i) => `صفحة ${i + 1}`);
      unmappedHeaders = pdfResult.unmappedColumns;
    } else if (lowerName.endsWith(".csv")) {
      fileType = "CSV";
      if (onProgress) onProgress("جاري تحليل ملف CSV وقراءة الأعمدة...", 30);
      const excelResult = await ExcelParser.parseWorkbook(buffer, fileName);
      drafts = excelResult.drafts;
      sheetsOrPages = excelResult.sheetsProcessed;
      unmappedHeaders = excelResult.unmappedColumns;
    } else if (lowerName.endsWith(".json")) {
      fileType = "JSON";
      if (onProgress) onProgress("جاري قراءة ملف JSON...", 40);
      try {
        const text = new TextDecoder().decode(buffer);
        const jsonContent = JSON.parse(text);
        const rawArray = Array.isArray(jsonContent) ? jsonContent : jsonContent.materials || [jsonContent];
        // Parse simple JSON objects into drafts
        drafts = rawArray.map((item: any, idx: number) => {
          const draftName = String(item.name || item.ArabicName || `مادة JSON #${idx + 1}`).trim();
          const draftCat = item.category || "أخرى";
          return {
            id: item.id || `USR-JSON-${Date.now().toString(36)}-${idx + 1}`,
            name: draftName,
            englishName: item.englishName,
            category: draftCat,
            materialType: item.materialType || "أخرى",
            categoryConfidence: "HIGH",
            categoryNeedsReview: false,
            source: item.provenance || "مستورد من JSON",
            sourceTracking: {
              fileName,
              fileType: "json",
              row: idx + 1,
              column: "ALL",
              extractionMethod: "EXCEL",
              confidence: 1.0
            },
            properties: {},
            extraProperties: item,
            validation: {
              isComplete: true,
              isEligibleForDreuxGorisse: true,
              missingRequiredForCategory: [],
              missingRequiredForDreux: [],
              errors: [],
              warnings: []
            },
            status: "Complete",
            selectedForImport: true
          };
        });
      } catch (e) {
        drafts = [];
      }
    } else {
      // Standard Excel (.xlsx, .xls)
      fileType = "EXCEL";
      if (onProgress) onProgress("جاري فحص أوراق العمل وتحليل الجداول الهندسية...", 30);
      const excelResult = await ExcelParser.parseWorkbook(buffer, fileName);
      drafts = excelResult.drafts;
      sheetsOrPages = excelResult.sheetsProcessed;
      unmappedHeaders = excelResult.unmappedColumns;
    }

    if (onProgress) onProgress("جاري مطابقة المواد مع المكتبة الحالية وفحص التكرار...", 85);

    // Duplicate detection
    const duplicates: DuplicateMatch[] = [];
    for (const draft of drafts) {
      const dup = DuplicateDetector.findDuplicate(
        draft.id,
        draft.name,
        draft.category,
        draft.source,
        existingMaterials
      );
      if (dup) {
        duplicates.push(dup);
      }
    }

    // Tally stats
    let completeCount = 0;
    let incompleteCount = 0;
    let needsReviewCount = 0;
    let invalidCount = 0;

    for (const d of drafts) {
      if (d.status === "Complete") completeCount++;
      else if (d.status === "Incomplete") incompleteCount++;
      else if (d.status === "Needs Review") needsReviewCount++;
      else if (d.status === "Invalid") invalidCount++;
    }

    if (onProgress) onProgress("اكتمل تجهيز تقرير الاستيراد والمراجعة!", 100);

    return {
      fileName,
      fileType,
      totalDetected: drafts.length,
      completeCount,
      incompleteCount,
      needsReviewCount,
      invalidCount,
      duplicateCount: duplicates.length,
      drafts,
      duplicates,
      unmappedHeaders,
      sheetsOrPages,
      processingTimeMs: Date.now() - startTime,
      hasOcrItems
    };
  }

  /**
   * Executes the import of approved drafts and integrates them cleanly into the user's materials.
   * STRICT ENFORCEMENT: All imported materials belong to 'user', never overwriting protected system materials.
   */
  public static executeImport(params: {
    drafts: ParsedMaterialDraft[];
    duplicates: DuplicateMatch[];
    existingMaterials: EngineeringMaterial[];
    userEmail?: string;
  }): {
    updatedMaterialsList: EngineeringMaterial[];
    importedCount: number;
    updatedCount: number;
    skippedCount: number;
  } {
    const { drafts, duplicates, existingMaterials, userEmail } = params;
    const currentMaterials = [...existingMaterials];

    const duplicateMap = new Map<string, DuplicateMatch>();
    duplicates.forEach(d => {
      duplicateMap.set(d.importedDraftId, d);
    });

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const draft of drafts) {
      if (!draft.selectedForImport || draft.status === "Invalid") {
        continue;
      }

      const dupMatch = duplicateMap.get(draft.id);
      const resolution: DuplicateResolutionStrategy = dupMatch ? dupMatch.chosenResolution : "IMPORT_NEW";

      if (dupMatch && resolution === "SKIP") {
        skippedCount++;
        continue;
      }

      // Convert draft properties to standard EngineeringMaterial properties
      const propMap: Record<string, any> = {};
      Object.entries(draft.properties).forEach(([key, p]) => {
        propMap[key] = p.normalizedValue !== undefined ? p.normalizedValue : p.value;
      });

      let finalId = draft.id;
      let finalName = draft.name;

      if (dupMatch) {
        if (resolution === "IMPORT_NEW") {
          const unique = DuplicateDetector.generateUniqueNameAndId(draft.name, draft.id, currentMaterials);
          finalName = unique.uniqueName;
          finalId = unique.uniqueId;
        } else if (resolution === "REPLACE" || resolution === "CREATE_VERSION") {
          const existingIdx = currentMaterials.findIndex(m => m.id === dupMatch.existingId);
          if (existingIdx !== -1) {
            const existingMat = currentMaterials[existingIdx];
            const isSystem = existingMat.isSystem || existingMat.materialSource === "system" || existingMat.sourceType === "system_demo";

            if (isSystem) {
              // System materials cannot be mutated. Fork into a customized User Material!
              const unique = DuplicateDetector.generateUniqueNameAndId(draft.name, `USR-${draft.id}`, currentMaterials);
              finalName = unique.uniqueName;
              finalId = unique.uniqueId;
            } else {
              // Update user material
              const updated: EngineeringMaterial = {
                ...existingMat,
                ...propMap,
                name: finalName,
                id: existingMat.id, // preserve stable ID
                englishName: draft.englishName || existingMat.englishName,
                category: draft.category as any,
                materialType: draft.materialType,
                materialSource: "user",
                isSystem: false,
                isCustom: true,
                source: "user_import",
                sourceType: "imported",
                sourceLabel: draft.sourceTracking.fileType === "pdf" ? "User Import (PDF)" : "User Import (Excel)",
                version: (existingMat.version || 1) + 1,
                lastModified: new Date().toISOString().split("T")[0],
                notes: draft.extraProperties.notes || existingMat.notes,
                provenance: draft.source || existingMat.provenance,
                extraProperties: {
                  ...(existingMat.extraProperties || {}),
                  ...draft.extraProperties
                },
                lifecycleHistory: [
                  ...(existingMat.lifecycleHistory || []),
                  {
                    date: new Date().toISOString().split("T")[0],
                    version: (existingMat.version || 1) + 1,
                    changes: `تم تحديث المادة عبر معالج الاستيراد المتقدم (${draft.sourceTracking.fileType.toUpperCase()})`,
                    author: userEmail || "مستخدم",
                    approvalStatus: existingMat.ApprovalStatus || "Approved"
                  }
                ]
              };

              currentMaterials[existingIdx] = updated;
              MaterialService.saveMyMaterial(MaterialService.fromEngineeringMaterial(updated));
              updatedCount++;
              continue;
            }
          }
        }
      }

      // New material insertion
      const catNorm = (draft.category || "").toLowerCase();
      const isWater = catNorm.includes("ماء") || catNorm.includes("مياه") || catNorm.includes("water");
      const isSCM = catNorm.includes("معدنية") || catNorm.includes("scm") || catNorm.includes("بوزولان") || catNorm.includes("خبث") || catNorm.includes("سيليكا");
      const isFiber = catNorm.includes("ألياف") || catNorm.includes("الياف") || catNorm.includes("fiber") || catNorm.includes("fibre");
      const isCement = catNorm.includes("إسمنت") || catNorm.includes("اسمنت") || catNorm.includes("cement");
      const isSteelFiber = isFiber && (draft.name.toLowerCase().includes("فولاذ") || draft.name.toLowerCase().includes("حديد") || draft.name.toLowerCase().includes("steel"));

      let defaultDensity = 2650;
      let defaultSg = 2.65;
      if (isWater) {
        defaultDensity = 1000;
        defaultSg = 1.0;
      } else if (isCement) {
        defaultDensity = 3100;
        defaultSg = 3.1;
      } else if (isSCM) {
        defaultDensity = 2800;
        defaultSg = 2.8;
      } else if (isFiber) {
        defaultDensity = isSteelFiber ? 7850 : 910;
        defaultSg = isSteelFiber ? 7.85 : 0.91;
      } else if (catNorm.includes("حصى") || catNorm.includes("gravel")) {
        defaultDensity = 2680;
        defaultSg = 2.68;
      }

      const calculatedDensity = propMap.density !== undefined ? propMap.density : (propMap.specificGravity ? propMap.specificGravity * 1000 : defaultDensity);
      const calculatedSg = propMap.specificGravity !== undefined ? propMap.specificGravity : (propMap.density ? propMap.density / 1000 : defaultSg);

      // Water, SCM, and Fiber are fully recognized, approved, and verified
      const isAutoApprovedCategory = isWater || isSCM || isFiber;
      const finalStatus: "نشط" | "قيد المراجعة" = (isAutoApprovedCategory || draft.status !== "Incomplete") ? "نشط" : "قيد المراجعة";
      const finalApprovalStatus: "Approved" | "Incomplete" = (isAutoApprovedCategory || draft.status !== "Incomplete") ? "Approved" : "Incomplete";

      const newMaterial: EngineeringMaterial = {
        id: finalId,
        MaterialID: finalId,
        MaterialCode: finalId,
        name: finalName,
        ArabicName: finalName,
        englishName: draft.englishName || finalName,
        EnglishName: draft.englishName || finalName,
        category: draft.category as any,
        materialType: draft.materialType,
        type: draft.category || "عام",
        quality: "قياسي",
        uses: isWater ? "ماء خلط ومعالجة الخرسانة" : isSCM ? "مادة رابطة إضافية ومحسنة للمتانة" : isFiber ? "تسليح الألياف لتقليل الشروخ وزيادة المتانة" : "استخدامات إنشائية عامة",
        desc: draft.extraProperties.description || `مادة مستوردة من ${draft.sourceTracking.fileName}`,
        provenance: draft.source || (isWater ? "شبكة مياه الشرب العمومية" : "مستورد"),
        density: calculatedDensity,
        ssdDensity: propMap.ssdDensity,
        specificGravity: calculatedSg,
        absorption: propMap.absorption !== undefined ? propMap.absorption : (isWater ? 0 : 0),
        moisture: propMap.moisture !== undefined ? propMap.moisture : 0,
        finenessModulus: propMap.finenessModulus,
        dMax: propMap.dMax,
        bulkDensity: propMap.bulkDensity,
        SandEquivalent: propMap.SandEquivalent,
        LosAngeles: propMap.LosAngeles,
        recommendedDosage: propMap.recommendedDosage !== undefined ? propMap.recommendedDosage : (isFiber ? (isSteelFiber ? 25 : 0.9) : undefined),
        waterReduction: propMap.waterReduction,
        pozzolanicIndex: propMap.pozzolanicIndex !== undefined ? propMap.pozzolanicIndex : (isSCM ? 85 : undefined),
        waterDemandFactor: propMap.waterDemandFactor !== undefined ? propMap.waterDemandFactor : (isSCM ? 1.0 : undefined),
        finenessBlaine: propMap.finenessBlaine !== undefined ? propMap.finenessBlaine : (isSCM ? 450 : undefined),
        strengthClass: propMap.strengthClass || (propMap.strength28d ? String(propMap.strength28d) : undefined),
        cementClass: propMap.cementClass,
        fiberType: propMap.fiberType || (isFiber ? (isSteelFiber ? "ألياف فولاذية" : "ألياف بولي بروبيلين") : undefined),
        fiberLength: propMap.fiberLength !== undefined ? propMap.fiberLength : (isFiber ? (isSteelFiber ? 35 : 18) : undefined),
        aspectRatio: propMap.aspectRatio !== undefined ? propMap.aspectRatio : (isFiber ? (isSteelFiber ? 55 : 65) : undefined),
        tensileStrength: propMap.tensileStrength !== undefined ? propMap.tensileStrength : (isFiber ? (isSteelFiber ? 1100 : 400) : undefined),
        pH: propMap.pH !== undefined ? propMap.pH : (isWater ? 7.2 : undefined),
        chlorides: propMap.chlorides !== undefined ? propMap.chlorides : (isWater ? 120 : undefined),
        sulfates: propMap.sulfates !== undefined ? propMap.sulfates : (isWater ? 80 : undefined),
        price: propMap.price || 0,
        rating: 5,
        status: finalStatus,
        ApprovalStatus: finalApprovalStatus,
        materialSource: "user",
        isSystem: false,
        isCustom: true,
        source: "user_import",
        sourceType: "imported",
        sourceLabel: draft.sourceTracking.fileType === "pdf" ? "User Import (PDF)" : "User Import (Excel)",
        version: 1,
        createdDate: new Date().toISOString().split("T")[0],
        lastModified: new Date().toISOString().split("T")[0],
        notes: draft.extraProperties.notes || `تم استيراد المادة من ملف ${draft.sourceTracking.fileName}`,
        extraProperties: draft.extraProperties,
        lifecycleHistory: [
          {
            date: new Date().toISOString().split("T")[0],
            version: 1,
            changes: `إنشاء واستيراد أولي معتمد عبر محرك الاستيراد الذكي (${draft.sourceTracking.fileType.toUpperCase()})`,
            author: userEmail || "مستخدم",
            approvalStatus: finalApprovalStatus
          }
        ]
      };

      currentMaterials.push(newMaterial);
      MaterialService.saveMyMaterial(MaterialService.fromEngineeringMaterial(newMaterial));
      importedCount++;
    }

    return {
      updatedMaterialsList: currentMaterials,
      importedCount,
      updatedCount,
      skippedCount
    };
  }
}
