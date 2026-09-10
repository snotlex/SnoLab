import { EngineeringMaterial } from "../../types";
import { MaterialService } from "../MaterialService";
import { CompletenessChecker, MaterialCompletenessAudit, PropertyInspectionItem } from "./CompletenessChecker";

export interface BulkPropertyEntry {
  materialId: string;
  propertyKey: string;
  value: any;
  unit?: string;
  notes?: string;
  isConfirmed?: boolean;
  detectedValue?: any;
}

export interface BulkSaveResult {
  success: boolean;
  savedCount: number;
  errorCount: number;
  updatedMaterials: EngineeringMaterial[];
  audits: Record<string, MaterialCompletenessAudit>;
  errors: { materialId: string; materialName: string; propertyKey: string; message: string }[];
}

export class BulkCompletionService {
  /**
   * Applies a batch of completed property entries to existing materials safely.
   */
  public static applyBulkCompletion(
    allMaterials: EngineeringMaterial[],
    entries: BulkPropertyEntry[],
    userEmail?: string
  ): BulkSaveResult {
    const updatedMaterials: EngineeringMaterial[] = [...allMaterials];
    const errors: { materialId: string; materialName: string; propertyKey: string; message: string }[] = [];
    let savedCount = 0;

    // Group entries by materialId
    const entriesByMat = new Map<string, BulkPropertyEntry[]>();
    for (const entry of entries) {
      if (!entriesByMat.has(entry.materialId)) {
        entriesByMat.set(entry.materialId, []);
      }
      entriesByMat.get(entry.materialId)!.push(entry);
    }

    const todayIso = new Date().toISOString().split("T")[0];
    const nowIso = new Date().toISOString();

    for (const [matId, matEntries] of entriesByMat.entries()) {
      const matIdx = updatedMaterials.findIndex(m => m.id === matId);
      if (matIdx === -1) {
        continue;
      }

      const existing = updatedMaterials[matIdx];
      const updatedCopy: EngineeringMaterial = {
        ...existing,
        lastModified: todayIso,
        engineeringData: { ...(existing.engineeringData || {}) },
        propertyMetadata: { ...(existing.propertyMetadata || {}) },
        propertySources: { ...(existing.propertySources || {}) },
        extraProperties: { ...(existing.extraProperties || {}) }
      };

      for (const entry of matEntries) {
        const { propertyKey, value, isConfirmed } = entry;

        // Verify that the value is provided
        if (!CompletenessChecker.hasMeaningfulValue(value)) {
          // If empty and not confirmed, skip without counting as error unless user explicitly tried to enter invalid text
          continue;
        }

        // Validate value against physical ranges for the property
        const auditBefore = CompletenessChecker.inspectMaterial(updatedCopy);
        let propDef = auditBefore.properties.find(p => p.key === propertyKey);
        if (!propDef) {
          const availableSpecs = CompletenessChecker.getAvailablePropertiesForRole(auditBefore.role);
          const foundSpec = availableSpecs.find(s => s.key === propertyKey);
          if (foundSpec) {
            propDef = {
              ...foundSpec,
              isRequiredForCalculation: foundSpec.priority === "DREUX_REQUIRED",
              isRequiredForCategory: foundSpec.priority === "CATEGORY_REQUIRED" || foundSpec.priority === "DREUX_REQUIRED",
              status: "MISSING",
              expectedType: "number"
            } as any;
          }
        }

        const valRes = CompletenessChecker.validateNumericProperty(
          value,
          propDef?.min,
          propDef?.max,
          propDef?.warningMin,
          propDef?.warningMax,
          true // allowZero for absorption/moisture
        );

        if (!valRes.isValid) {
          errors.push({
            materialId: matId,
            materialName: existing.name,
            propertyKey,
            message: valRes.messageAr || "قيمة غير صالحة"
          });
          continue;
        }

        const numVal = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
        const finalVal = isNaN(numVal) ? value : numVal;

        const previousVal = CompletenessChecker.getMaterialValue(existing, propertyKey);
        const hadPreviousVal = CompletenessChecker.hasMeaningfulValue(previousVal);
        const isCorrection = hadPreviousVal && previousVal !== finalVal;
        const sourceLabel = isCorrection ? "manually_corrected" : "manual";
        const sourceText = isCorrection ? "تصحيح قيمة الخاصية يدوياً" : "استكمال وإضافة خاصية ناقصة يدوياً";

        // 1. Update direct property
        (updatedCopy as any)[propertyKey] = finalVal;

        // 2. Update engineeringData and extraProperties
        if (updatedCopy.engineeringData) {
          updatedCopy.engineeringData[propertyKey] = finalVal;
        }
        if (updatedCopy.extraProperties) {
          updatedCopy.extraProperties[propertyKey] = finalVal;
        }

        // 3. Update metadata & provenance
        const existingMeta: any = updatedCopy.propertyMetadata?.[propertyKey] || {};
        const history = [...(existingMeta.history || [])];
        history.push({
          timestamp: nowIso,
          value: finalVal,
          previousValue: hadPreviousVal ? previousVal : undefined,
          sourceType: "user_entered",
          user: userEmail || "المهندس",
          note: sourceText
        });

        if (!updatedCopy.propertyMetadata) updatedCopy.propertyMetadata = {};
        updatedCopy.propertyMetadata[propertyKey] = {
          ...existingMeta,
          key: propertyKey,
          value: finalVal,
          sourceType: "user_entered",
          sourceLabel: isCorrection ? "تصحيح يدوي معتمد" : "استكمال يدوي معتمد",
          source: sourceLabel,
          status: "user_edited",
          confidence: "High",
          requiresConfirmation: false,
          lastUpdated: nowIso,
          history
        };

        if (!updatedCopy.propertySources) updatedCopy.propertySources = {};
        updatedCopy.propertySources[propertyKey] = {
          source: sourceLabel,
          timestamp: nowIso
        };

        // Linked property syncing (e.g. density <-> specificGravity)
        if (propertyKey === "density" && typeof finalVal === "number") {
          const calculatedSg = +(finalVal / 1000).toFixed(3);
          updatedCopy.specificGravity = calculatedSg;
          if (updatedCopy.engineeringData) updatedCopy.engineeringData.specificGravity = calculatedSg;
        } else if (propertyKey === "specificGravity" && typeof finalVal === "number") {
          const calculatedDensity = Math.round(finalVal * 1000);
          updatedCopy.density = calculatedDensity;
          if (updatedCopy.engineeringData) updatedCopy.engineeringData.density = calculatedDensity;
        }

        savedCount++;
      }

      // Re-inspect material to determine new status
      const postAudit = CompletenessChecker.inspectMaterial(updatedCopy);
      const isReady = postAudit.overallStatus === "READY";
      const isSys = updatedCopy.materialSource === "system" || updatedCopy.isSystem === true;

      updatedCopy.status = isReady ? "نشط" : "قيد المراجعة";
      updatedCopy.validationStatus = isReady ? "VALID" : "PENDING";

      // Engineering Governance: READY IS NOT APPROVED (Requirement 6).
      // System materials are pre-certified standards.
      // User materials becoming complete transition to "Pending Review", requiring explicit engineer review.
      if (isSys) {
        updatedCopy.Status = "Approved";
        updatedCopy.ApprovalStatus = "Approved";
      } else {
        const wasApproved = updatedCopy.ApprovalStatus === "Approved" || updatedCopy.engineerApproval?.status === "approved";
        if (wasApproved) {
          updatedCopy.Status = "Approved";
          updatedCopy.ApprovalStatus = "Approved";
        } else {
          updatedCopy.Status = isReady ? "Pending Review" : "Draft";
          updatedCopy.ApprovalStatus = isReady ? "Pending Review" : "Incomplete";
        }
      }

      updatedMaterials[matIdx] = updatedCopy;
      // Persist in local storage via MaterialService
      try {
        MaterialService.saveMyMaterial(MaterialService.fromEngineeringMaterial(updatedCopy));
      } catch (err) {
        console.warn("Failed to persist material in MaterialService vault:", err);
      }
    }

    // Build final audits map
    const audits: Record<string, MaterialCompletenessAudit> = {};
    for (const m of updatedMaterials) {
      audits[m.id] = CompletenessChecker.inspectMaterial(m);
    }

    return {
      success: errors.length === 0,
      savedCount,
      errorCount: errors.length,
      updatedMaterials,
      audits,
      errors
    };
  }
}
