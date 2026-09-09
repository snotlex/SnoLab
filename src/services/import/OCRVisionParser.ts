import { ParsedMaterialDraft, SourceTracking, MaterialDraftProperty } from "./types";
import { Validator } from "./Validator";
import { MaterialDetector } from "./MaterialDetector";
import { UnitNormalizer } from "./UnitNormalizer";

export interface OCRParseResult {
  drafts: ParsedMaterialDraft[];
  success: boolean;
  message?: string;
  isOcr: boolean;
}

export class OCRVisionParser {
  /**
   * Calls the backend intelligent OCR endpoint (/api/extract-pdf-materials)
   * to extract materials from scanned PDFs, images, or raw document text.
   */
  public static async extractMaterialsFromPdfOrText(params: {
    fileName: string;
    pdfBase64?: string;
    extractedText?: string;
  }): Promise<OCRParseResult> {
    const { fileName, pdfBase64, extractedText } = params;

    try {
      const response = await fetch("/api/extract-pdf-materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName,
          pdfBase64,
          extractedText
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        return {
          drafts: [],
          success: false,
          isOcr: true,
          message: errJson.message || `خطأ من خادم المعالجة الذكية (${response.status})`
        };
      }

      const data = await response.json();
      if (!data.materials || !Array.isArray(data.materials)) {
        return {
          drafts: [],
          success: false,
          isOcr: true,
          message: "لم يتم العثور على جداول مواد قابلة للاستخراج في هذا المستند."
        };
      }

      const drafts: ParsedMaterialDraft[] = data.materials.map((item: any, idx: number) => {
        const rawName = String(item.name || item.nameAr || `مادة مستخرجة #${idx + 1}`).trim();
        const rawEnglishName = item.englishName ? String(item.englishName).trim() : undefined;
        const category = item.category || MaterialDetector.detectCategory(`${rawName} ${rawEnglishName || ""}`).category;
        const materialType = MaterialDetector.getMaterialTypeForCategory(category);

        const pageNum = item.page || 1;
        const rowNum = item.row || idx + 1;
        const confidenceScore = typeof item.confidenceScore === "number" ? item.confidenceScore : 80;
        const confidenceLevel = confidenceScore >= 85 ? "HIGH" : confidenceScore >= 65 ? "MEDIUM" : confidenceScore >= 45 ? "LOW" : "NEEDS_REVIEW";

        const sourceTracking: SourceTracking = {
          fileName,
          fileType: "pdf",
          page: pageNum,
          row: rowNum,
          column: "AI_VISION_OCR",
          extractionMethod: "OCR",
          confidence: confidenceScore / 100
        };

        const properties: Record<string, MaterialDraftProperty> = {};
        const rawProps = item.properties || {};

        Object.entries(rawProps).forEach(([key, valData]: [string, any]) => {
          let rawVal: any;
          let explicitUnit: string | undefined;

          if (typeof valData === "object" && valData !== null) {
            rawVal = valData.value !== undefined ? valData.value : valData.val;
            explicitUnit = valData.unit || valData.originalUnit;
          } else {
            rawVal = valData;
          }

          if (rawVal === null || rawVal === undefined || String(rawVal).trim() === "") {
            return;
          }

          const norm = UnitNormalizer.normalizePropertyValue(key, rawVal, explicitUnit);
          const propConfidenceScore = typeof valData?.confidence === "number" ? Math.round(valData.confidence * 100) : confidenceScore;
          const propConfidence = propConfidenceScore >= 85 ? "HIGH" : propConfidenceScore >= 65 ? "MEDIUM" : "NEEDS_REVIEW";

          properties[key] = {
            canonicalId: `PROP-${key.toUpperCase()}`,
            key,
            nameAr: valData?.nameAr || key,
            nameEn: valData?.nameEn || key,
            nameFr: valData?.nameFr || key,
            value: norm.normalizedValue,
            unit: norm.normalizedUnit,
            originalValue: norm.sourceValue,
            originalUnit: norm.sourceUnit,
            normalizedValue: norm.normalizedValue,
            normalizedUnit: norm.normalizedUnit,
            confidence: propConfidence,
            confidenceScore: propConfidenceScore,
            sourceTracking: {
              ...sourceTracking,
              rawHeader: key
            },
            status: "VALID"
          };
        });

        const extraProperties = item.extraProperties || {};
        const draftId = `USR-OCR-${category.substring(0, 3)}-${Date.now().toString(36).substr(-4)}-${idx + 1}`.toUpperCase();

        const validation = Validator.validateDraft(rawName, category, properties);
        let status: "Complete" | "Incomplete" | "Needs Review" | "Invalid" = "Complete";
        if (validation.errors.length > 0) {
          status = "Invalid";
        } else if (confidenceLevel === "NEEDS_REVIEW" || confidenceScore < 70) {
          status = "Needs Review";
        } else if (!validation.isComplete) {
          status = "Incomplete";
        }

        return {
          id: draftId,
          name: rawName,
          englishName: rawEnglishName,
          category,
          materialType,
          categoryConfidence: confidenceLevel,
          categoryNeedsReview: confidenceLevel === "NEEDS_REVIEW",
          source: item.provenance || "مستخرج من PDF عبر الذكاء الهندسي / OCR",
          sourceTracking,
          properties,
          extraProperties,
          validation,
          status,
          selectedForImport: status !== "Invalid"
        };
      });

      return {
        drafts,
        success: true,
        isOcr: true
      };
    } catch (err: any) {
      return {
        drafts: [],
        success: false,
        isOcr: true,
        message: err?.message || "فشلت معالجة OCR للمستند."
      };
    }
  }
}
