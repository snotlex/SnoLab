import React, { useState, useMemo } from "react";
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Save, 
  Search, 
  Sparkles, 
  Check, 
  Clock, 
  ShieldCheck, 
  HelpCircle,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from "lucide-react";
import { EngineeringMaterial } from "../../types";
import { 
  CompletenessChecker, 
  MaterialCompletenessAudit, 
  PropertyInspectionItem 
} from "../../services/import/CompletenessChecker";
import { BulkCompletionService, BulkPropertyEntry } from "../../services/import/BulkCompletionService";

interface MaterialBulkCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: EngineeringMaterial[];
  onMaterialsUpdated: (updatedMaterials: EngineeringMaterial[]) => void;
  language?: "ar" | "en" | "fr";
  filterToMaterialId?: string;
  initialMaterialId?: string;
  importedOnly?: boolean;
}

export const MaterialBulkCompletionModal: React.FC<MaterialBulkCompletionModalProps> = ({
  isOpen,
  onClose,
  materials,
  onMaterialsUpdated,
  language = "ar",
  filterToMaterialId,
  initialMaterialId,
  importedOnly = false
}) => {
  const isAr = language === "ar";
  const targetMaterialId = initialMaterialId || filterToMaterialId;

  // Track the active material being inspected/completed
  const [activeMaterialId, setActiveMaterialId] = useState<string>(() => {
    if (targetMaterialId && materials.some(m => m.id === targetMaterialId)) {
      return targetMaterialId;
    }
    // Find first material with missing properties, or first material
    const firstIncomplete = materials.find(m => {
      const audit = CompletenessChecker.inspectMaterial(m);
      return audit.unresolvedProperties.length > 0;
    });
    return firstIncomplete ? firstIncomplete.id : (materials[0]?.id || "");
  });

  // Form input values: key format: `${materialId}::${propertyKey}` -> string value
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  // Track newly registered property keys per material
  const [addedProperties, setAddedProperties] = useState<Record<string, string[]>>({});
  
  // Feedback and toast notification states
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "info" | "warning";
    text: string;
  } | null>(null);

  // Search filter across materials if multiple materials exist
  const [searchQuery, setSearchQuery] = useState<string>("");
  // Toggle to view already completed valid properties
  const [showCompletedProperties, setShowCompletedProperties] = useState<boolean>(false);

  // Derive virtual materials incorporating uncommitted form values & added properties for real-time validation
  const virtualMaterials = useMemo(() => {
    return materials.map(mat => {
      const addedKeys = addedProperties[mat.id] || [];
      const copy: EngineeringMaterial = {
        ...mat,
        engineeringData: { ...(mat.engineeringData || {}) },
        extraProperties: { ...(mat.extraProperties || {}) },
        propertyMetadata: { ...(mat.propertyMetadata || {}) }
      };

      // Ensure added keys are visible to CompletenessChecker
      for (const k of addedKeys) {
        if (!CompletenessChecker.hasPropertyKey(copy, k)) {
          (copy as any)[k] = "";
          copy.extraProperties[k] = "";
        }
      }

      // Inject current form values into the virtual material
      for (const [compoundKey, valStr] of Object.entries(formValues)) {
        if (compoundKey.startsWith(`${mat.id}::`)) {
          const propKey = compoundKey.split("::")[1];
          const trimmed = String(valStr ?? "").trim();
          if (trimmed !== "") {
            const num = parseFloat(trimmed.replace(",", "."));
            const finalVal = isNaN(num) ? trimmed : num;
            (copy as any)[propKey] = finalVal;
            copy.engineeringData[propKey] = finalVal;
            copy.extraProperties[propKey] = finalVal;
          } else {
            (copy as any)[propKey] = "";
          }
        }
      }

      return copy;
    });
  }, [materials, addedProperties, formValues]);

  // Compute live audits for all materials in library
  const audits = useMemo(() => {
    return virtualMaterials.map(m => CompletenessChecker.inspectMaterial(m));
  }, [virtualMaterials]);

  // If a target material was specified, lock onto it
  const currentMaterial = useMemo(() => {
    return materials.find(m => m.id === activeMaterialId) || materials[0] || null;
  }, [materials, activeMaterialId]);

  const currentAudit = useMemo(() => {
    if (!currentMaterial) return null;
    return audits.find(a => a.materialId === currentMaterial.id) || CompletenessChecker.inspectMaterial(currentMaterial);
  }, [audits, currentMaterial]);

  // Partition properties for current material into the required categories:
  // 1. Deficiencies that CAN be automatically completed by system
  // 2. Deficiencies that REQUIRE user input
  // 3. Deficiencies that NEED REVIEW (invalid or dubious values)
  // 4. Already valid / completed properties
  const {
    autoCompletableProps,
    userInputProps,
    needsReviewProps,
    validCompletedProps,
    totalDeficiencies
  } = useMemo(() => {
    if (!currentAudit) {
      return {
        autoCompletableProps: [],
        userInputProps: [],
        needsReviewProps: [],
        validCompletedProps: [],
        totalDeficiencies: 0
      };
    }

    const auto: PropertyInspectionItem[] = [];
    const manual: PropertyInspectionItem[] = [];
    const review: PropertyInspectionItem[] = [];
    const valid: PropertyInspectionItem[] = [];

    currentAudit.properties.forEach(prop => {
      if (prop.status === "VALID") {
        valid.push(prop);
      } else if (prop.status === "INVALID" || prop.status === "NEEDS_REVIEW") {
        review.push(prop);
      } else if (prop.canAutoComplete) {
        auto.push(prop);
      } else {
        manual.push(prop);
      }
    });

    const total = auto.length + manual.length + review.length;

    return {
      autoCompletableProps: auto,
      userInputProps: manual,
      needsReviewProps: review,
      validCompletedProps: valid,
      totalDeficiencies: total
    };
  }, [currentAudit]);

  if (!isOpen || !currentMaterial || !currentAudit) return null;

  // Handle single property input change
  const handleInputChange = (matId: string, propKey: string, value: string) => {
    const compoundKey = `${matId}::${propKey}`;
    setFormValues(prev => ({
      ...prev,
      [compoundKey]: value
    }));
    if (feedbackMessage) setFeedbackMessage(null);
  };

  // Set suggested value for a single property
  const handleSetSinglePropertyValue = (matId: string, propKey: string, value: string) => {
    const compoundKey = `${matId}::${propKey}`;
    setFormValues(prev => ({
      ...prev,
      [compoundKey]: value
    }));
    // Also track as added if not already
    setAddedProperties(prev => {
      const existing = prev[matId] || [];
      if (!existing.includes(propKey)) {
        return { ...prev, [matId]: [...existing, propKey] };
      }
      return prev;
    });
  };

  // 15. PRIMARY ACTION 1: "إكمال القيم تلقائيًا" (Autofill all completable values into input fields for review)
  const handleAutoCompleteValues = () => {
    if (!currentMaterial) return;
    const newFormVals = { ...formValues };
    const currentAdded = addedProperties[currentMaterial.id] || [];
    const newAdded = [...currentAdded];
    let filledCount = 0;

    // 1. Fill all auto-completable properties
    autoCompletableProps.forEach(prop => {
      const compKey = `${currentMaterial.id}::${prop.key}`;
      const suggested = prop.suggestedValue !== undefined
        ? prop.suggestedValue
        : CompletenessChecker.getLogicalDefaultValue(currentMaterial, prop.key);
      
      newFormVals[compKey] = String(suggested);
      if (!newAdded.includes(prop.key)) {
        newAdded.push(prop.key);
      }
      filledCount++;
    });

    // 2. Also populate suggested values for any review/invalid properties if available
    needsReviewProps.forEach(prop => {
      const compKey = `${currentMaterial.id}::${prop.key}`;
      const suggested = prop.suggestedValue !== undefined
        ? prop.suggestedValue
        : CompletenessChecker.getLogicalDefaultValue(currentMaterial, prop.key);
      
      if (suggested !== undefined && suggested !== null) {
        newFormVals[compKey] = String(suggested);
        if (!newAdded.includes(prop.key)) {
          newAdded.push(prop.key);
        }
        filledCount++;
      }
    });

    // 3. For manual properties, if empty, set their logical reference default so user can quickly review & approve
    userInputProps.forEach(prop => {
      const compKey = `${currentMaterial.id}::${prop.key}`;
      if (!newFormVals[compKey] || newFormVals[compKey].trim() === "") {
        const suggested = prop.suggestedValue !== undefined
          ? prop.suggestedValue
          : CompletenessChecker.getLogicalDefaultValue(currentMaterial, prop.key);
        
        if (suggested !== undefined && suggested !== null && suggested !== 0) {
          newFormVals[compKey] = String(suggested);
          if (!newAdded.includes(prop.key)) {
            newAdded.push(prop.key);
          }
        }
      }
    });

    setFormValues(newFormVals);
    setAddedProperties(prev => ({
      ...prev,
      [currentMaterial.id]: newAdded
    }));

    setFeedbackMessage({
      type: "success",
      text: isAr 
        ? `✓ تم ملء ${filledCount} قيمة تلقائياً بالمعايير الهندسية القياسية! يرجى مراجعة الحقول أدناه ثم الضغط على "حفظ جميع التعديلات".`
        : `✓ Autofilled ${filledCount} properties with standard engineering specifications! Please review values below and click "Save All Changes".`
    });
  };

  // 16. PRIMARY ACTION 2: "حفظ جميع التعديلات" (Atomic batch commit to material)
  const handleSaveAllChanges = () => {
    if (!currentMaterial) return;

    const entriesToSave: BulkPropertyEntry[] = [];
    const matId = currentMaterial.id;

    // Collect all entered values from the form for this material
    Object.entries(formValues).forEach(([compoundKey, valRaw]) => {
      if (!compoundKey.startsWith(`${matId}::`)) return;
      const propKey = compoundKey.split("::")[1];
      const valStr = String(valRaw ?? "").trim();
      if (valStr === "") return;

      const numVal = parseFloat(valStr.replace(",", "."));
      const finalVal = isNaN(numVal) ? valStr : numVal;

      entriesToSave.push({
        materialId: matId,
        propertyKey: propKey,
        value: finalVal
      });
    });

    // Also collect any auto-completable properties that have suggested values even if not typed
    autoCompletableProps.forEach(prop => {
      const compKey = `${matId}::${prop.key}`;
      if (!(compKey in formValues) || String(formValues[compKey] ?? "").trim() === "") {
        const suggested = prop.suggestedValue !== undefined
          ? prop.suggestedValue
          : CompletenessChecker.getLogicalDefaultValue(currentMaterial, prop.key);
        
        const numVal = typeof suggested === "number" ? suggested : parseFloat(String(suggested).replace(",", "."));
        const finalVal = isNaN(numVal) ? suggested : numVal;

        entriesToSave.push({
          materialId: matId,
          propertyKey: prop.key,
          value: finalVal
        });
      }
    });

    if (entriesToSave.length === 0) {
      setFeedbackMessage({
        type: "warning",
        text: isAr ? "لم يتم إدخال أو تعديل أي قيم جديدة للحفظ." : "No new or modified values to save."
      });
      return;
    }

    // Protect system materials: if current material is system, clone into a user material
    const isSystem = currentMaterial.isSystem === true || 
                     currentMaterial.source === "system" || 
                     (currentMaterial as any).materialSource === "system";

    let workingMaterials = [...materials];
    let effectiveTargetId = matId;

    if (isSystem) {
      const clonedUserMat: EngineeringMaterial = {
        ...currentMaterial,
        id: `user-mat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: `${currentMaterial.name} (معدلة)`,
        englishName: currentMaterial.englishName ? `${currentMaterial.englishName} (Custom)` : undefined,
        isSystem: false,
        source: "user",
        materialSource: "user",
        originalSystemMaterialId: currentMaterial.id,
        engineeringData: { ...(currentMaterial.engineeringData || {}) },
        extraProperties: { ...(currentMaterial.extraProperties || {}) },
        propertyMetadata: { ...(currentMaterial.propertyMetadata || {}) }
      };

      workingMaterials.push(clonedUserMat);
      effectiveTargetId = clonedUserMat.id;

      // Update entries to point to the cloned material
      entriesToSave.forEach(e => {
        e.materialId = effectiveTargetId;
      });
    }

    // Apply batch updates using BulkCompletionService
    const result = BulkCompletionService.applyBulkCompletion(
      workingMaterials,
      entriesToSave,
      "المهندس"
    );

    // Commit updated materials to parent application state immediately
    onMaterialsUpdated(result.updatedMaterials);

    // Clear form entries for this material as they are now persisted in the material object
    setFormValues(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        if (k.startsWith(`${matId}::`) || k.startsWith(`${effectiveTargetId}::`)) {
          delete next[k];
        }
      });
      return next;
    });

    setAddedProperties(prev => {
      const next = { ...prev };
      delete next[matId];
      delete next[effectiveTargetId];
      return next;
    });

    if (effectiveTargetId !== matId) {
      setActiveMaterialId(effectiveTargetId);
    }

    // Re-audit the updated material
    const updatedTarget = result.updatedMaterials.find(m => m.id === effectiveTargetId);
    const postAudit = updatedTarget ? CompletenessChecker.inspectMaterial(updatedTarget) : null;

    if (postAudit && postAudit.overallStatus === "READY") {
      setFeedbackMessage({
        type: "success",
        text: isAr
          ? `✓ أصبحت المادة "${updatedTarget?.name}" مكتملة بنسبة 100% ومؤهلة تماماً لحسابات خلطة الخرسانة وفق طريقة درو-غوريس!`
          : `✓ Material "${updatedTarget?.name}" is now 100% complete and fully ready for Dreux-Gorisse mix calculations!`
      });
    } else {
      const remainingCount = postAudit ? postAudit.unresolvedProperties.length : 0;
      setFeedbackMessage({
        type: "info",
        text: isAr
          ? `✓ تم حفظ ${result.savedCount} خاصية بنجاح! ما تزال هناك ${remainingCount} خصائص متبقية للاكتمال التام.`
          : `✓ Successfully saved ${result.savedCount} properties! ${remainingCount} properties remaining for full readiness.`
      });
    }
  };

  // Render an individual property row/card inside the unified view
  const renderPropertyRow = (
    prop: PropertyInspectionItem,
    categoryType: "AUTO" | "MANUAL" | "REVIEW" | "VALID"
  ) => {
    const compoundKey = `${currentMaterial.id}::${prop.key}`;
    const valInForm = formValues[compoundKey] !== undefined 
      ? formValues[compoundKey] 
      : (prop.currentValue !== undefined && prop.currentValue !== null && prop.currentValue !== "" ? String(prop.currentValue) : "");

    const isAuto = categoryType === "AUTO";
    const isManual = categoryType === "MANUAL";
    const isReview = categoryType === "REVIEW";
    const isValid = categoryType === "VALID";

    // Validate form value if user typed
    let inputError: string | undefined;
    if (valInForm.trim() !== "") {
      const check = CompletenessChecker.validateNumericProperty(
        valInForm,
        prop.min,
        prop.max,
        prop.warningMin,
        prop.warningMax,
        true
      );
      if (!check.isValid) {
        inputError = check.messageAr;
      }
    }

    return (
      <div 
        key={prop.key}
        className={`p-3.5 rounded-xl border transition-all text-xs space-y-2.5 ${
          isValid 
            ? "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/10 dark:bg-emerald-950/10"
            : isReview 
              ? "border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20"
              : isAuto
                ? "border-amber-200 dark:border-amber-900/50 bg-white dark:bg-slate-800/60 shadow-sm"
                : "border-blue-200 dark:border-blue-900/50 bg-white dark:bg-slate-800/60 shadow-sm"
        }`}
      >
        {/* Row Header: Name, Keys, Unit, Status Badge */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
              {isAr ? prop.nameAr : prop.nameEn}
            </span>
            <span className="text-[11px] text-slate-400 font-sans">
              ({isAr ? prop.nameEn : prop.nameAr})
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 font-mono text-[9px]">
              {prop.key}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {prop.unit && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700">
                {isAr ? "الوحدة:" : "Unit:"} {prop.unit}
              </span>
            )}

            {/* Status Badge */}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isValid
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/40"
                : prop.status === "MISSING"
                  ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-300/40"
                  : prop.status === "EMPTY"
                    ? "bg-orange-100 text-orange-900 dark:bg-orange-950/60 dark:text-orange-200 border border-orange-300/40"
                    : prop.status === "INVALID"
                      ? "bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200 border border-rose-300/40"
                      : "bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200 border border-blue-300/40"
            }`}>
              {isValid && (isAr ? "مكتملة وصالحة ✓" : "Valid ✓")}
              {!isValid && prop.status === "MISSING" && (isAr ? "غير موجودة أصلًا" : "Not Defined")}
              {!isValid && prop.status === "EMPTY" && (isAr ? "موجودة وقيمتها فارغة" : "Empty Field")}
              {!isValid && prop.status === "INVALID" && (isAr ? "قيمة غير صالحة" : "Invalid Value")}
              {!isValid && prop.status === "NEEDS_REVIEW" && (isAr ? "تحتاج مراجعة" : "Needs Review")}
            </span>
          </div>
        </div>

        {/* Issue Warning Banner (For Section 3 / Needs Review) */}
        {isReview && (
          <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <div>
                <span className="font-bold">{isAr ? "المشكلة المرصودة: " : "Issue: "}</span>
                <span>{prop.validationError || (isAr ? "القيمة الحالية خارج الحدود الهندسية المسموح بها." : "Value out of bounds.")}</span>
              </div>
            </div>
            {prop.suggestedValue !== undefined && (
              <button
                type="button"
                onClick={() => handleSetSinglePropertyValue(currentMaterial.id, prop.key, String(prop.suggestedValue))}
                className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold shrink-0 cursor-pointer shadow-sm"
              >
                {isAr ? `قبول المقترح (${prop.suggestedValue})` : `Accept (${prop.suggestedValue})`}
              </button>
            )}
          </div>
        )}

        {/* Property Values Grid: Current Value, Suggested Value, and Approved Input Field */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs items-center bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
          {/* 1. Current Value */}
          <div>
            <span className="text-[10px] text-slate-400 block mb-0.5">
              {isAr ? "القيمة الحالية بالسجل:" : "Current Value in Record:"}
            </span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
              {prop.currentValueDisplay || "—"}
            </span>
          </div>

          {/* 2. Suggested Value */}
          <div>
            <span className="text-[10px] text-slate-400 block mb-0.5">
              {isAr ? "القيمة المقترحة هندسياً:" : "Recommended Value:"}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {prop.suggestedValue !== undefined ? `${prop.suggestedValue} ${prop.unit}` : "—"}
              </span>
              {prop.suggestedValue !== undefined && !isValid && (
                <button
                  type="button"
                  onClick={() => handleSetSinglePropertyValue(currentMaterial.id, prop.key, String(prop.suggestedValue))}
                  className="px-1.5 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold cursor-pointer transition-colors"
                  title={isAr ? "تطبيق هذه القيمة المقترحة في حقل الإدخال" : "Use this suggested value"}
                >
                  {isAr ? "استخدام" : "Use"}
                </button>
              )}
            </div>
          </div>

          {/* 3. Input Field */}
          <div>
            <span className="text-[10px] text-slate-400 block mb-0.5">
              {isAr ? "القيمة المعتمدة (حقل الإدخال):" : "Approved Value (Input):"}
            </span>
            <div className="relative">
              <input
                type="text"
                value={valInForm}
                onChange={(e) => handleInputChange(currentMaterial.id, prop.key, e.target.value)}
                placeholder={prop.suggestedValue !== undefined ? String(prop.suggestedValue) : (isAr ? "أدخل القيمة..." : "Enter value...")}
                className={`w-full py-1.5 px-2.5 text-xs font-mono font-bold rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${
                  inputError 
                    ? "border-rose-400 ring-1 ring-rose-400" 
                    : "border-slate-300 dark:border-slate-700"
                }`}
              />
              {prop.unit && (
                <span className={`absolute top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none font-mono ${
                  isAr ? "left-2" : "right-2"
                }`}>
                  {prop.unit}
                </span>
              )}
            </div>
            {inputError && (
              <span className="text-[10px] text-rose-500 block mt-0.5 font-medium">{inputError}</span>
            )}
          </div>
        </div>

        {/* Line 3: Source if automatic, or Reason if manual */}
        <div className="text-[10.5px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap pt-0.5">
          {prop.canAutoComplete ? (
            <>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {isAr ? "مصدر القيمة التلقائية:" : "Automatic Standard Source:"}
              </span>
              <span>{isAr ? (prop.sourceAr || "المعايير الهندسية القياسية") : (prop.sourceEn || "Standard specifications")}</span>
            </>
          ) : (
            <>
              <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                {isAr ? "سبب طلب الإدخال اليدوي:" : "Reason for Manual Input:"}
              </span>
              <span>{isAr ? (prop.reasonAr || "خاصية تتطلب قياساً حقلياً موثقاً للموقع") : (prop.reasonEn || "Requires on-site test result")}</span>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* ============================================================
            TOP HEADER: Window title, Deficiencies Badge & Primary Action
            ============================================================ */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/80 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {isAr ? "إظهار الخصائص الناقصة واستكمالها" : "Show and Complete Missing Properties"}
                </h2>
                <span className="text-xs text-slate-400 font-medium">
                  • {currentMaterial.name}
                </span>
                {/* Missing Count Badge */}
                {totalDeficiencies > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/40 animate-pulse">
                    {isAr ? `تم العثور على ${totalDeficiencies} خصائص ناقصة` : `Found ${totalDeficiencies} missing properties`}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isAr ? "مكتملة ✓" : "Complete ✓"}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr 
                  ? "فحص المادة مقابل اشتراطات الصنف وطريقة درو-غوريس واستكمال جميع النواقص والحقول دفعة واحدة."
                  : "Audit material against category standards and Dreux-Gorisse rules, completing all deficiencies in batch."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Prominent Primary Button: "إكمال جميع الخصائص الناقصة" (shown only if there are deficiencies) */}
            {totalDeficiencies > 0 && (
              <button
                id="btn-complete-all-missing-properties"
                type="button"
                onClick={handleAutoCompleteValues}
                className="px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white shadow-md shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer border border-amber-400/40"
                title={isAr ? "إكمال جميع الخصائص والحقول والقيم الناقصة دفعة واحدة" : "Complete all missing properties in batch"}
              >
                <Sparkles className="w-4 h-4 text-amber-100" />
                <span>{isAr ? "إكمال جميع الخصائص الناقصة" : "Complete All Missing Properties"}</span>
              </button>
            )}

            <button 
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isAr ? "إغلاق" : "Close"}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Material Switcher Tabs if multiple materials are in database */}
        {materials.length > 1 && !targetMaterialId && (
          <div className="px-5 py-2 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="font-bold text-slate-500 text-[11px] shrink-0 ml-1">
              {isAr ? "المواد:" : "Materials:"}
            </span>
            {materials.map(m => {
              const audit = audits.find(a => a.materialId === m.id);
              const hasDeficiencies = audit && audit.unresolvedProperties.length > 0;
              const isCurr = m.id === currentMaterial.id;

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveMaterialId(m.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isCurr
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <span>{m.name}</span>
                  {hasDeficiencies ? (
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Notification Feedback Toast */}
        {feedbackMessage && (
          <div className={`px-5 py-2.5 text-xs flex items-center justify-between border-b ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
              : feedbackMessage.type === "warning"
                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200"
                : "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200"
          }`}>
            <div className="flex items-center gap-2 font-medium">
              {feedbackMessage.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
              <span>{feedbackMessage.text}</span>
            </div>
            <button 
              type="button"
              onClick={() => setFeedbackMessage(null)} 
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ============================================================
            SUMMARY & ACTION BAR (Requirements 13 & 14)
            - "تم العثور على X خصائص ناقصة"
            - "Y يمكن إكمالها تلقائيًا"
            - "Z تحتاج إلى إدخال المستخدم"
            - TWO main action buttons: "إكمال القيم تلقائيًا" and "حفظ جميع التعديلات"
            ============================================================ */}
        <div className="px-5 sm:px-6 py-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Summary Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {isAr ? "ملخص النواقص:" : "Deficiencies Summary:"}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-bold border border-amber-300/40 font-mono">
              {isAr ? `تم العثور على ${totalDeficiencies} خصائص ناقصة` : `Found ${totalDeficiencies} missing properties`}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold border border-emerald-300/40 font-mono">
              {isAr ? `${autoCompletableProps.length} يمكن إكمالها تلقائيًا` : `${autoCompletableProps.length} auto-completable`}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 font-bold border border-blue-300/40 font-mono">
              {isAr ? `${userInputProps.length} تحتاج إلى إدخال المستخدم` : `${userInputProps.length} requires user input`}
            </span>
            {needsReviewProps.length > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 font-bold border border-rose-300/40 font-mono">
                {isAr ? `${needsReviewProps.length} تحتاج إلى مراجعة` : `${needsReviewProps.length} needs review`}
              </span>
            )}
          </div>

          {/* TWO Primary Action Buttons (Requirement 14) */}
          <div className="flex items-center gap-2">
            <button
              id="btn-autocomplete-all-modal"
              type="button"
              onClick={handleAutoCompleteValues}
              className="px-3.5 py-2 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
              title={isAr ? "إكمال القيم تلقائيًا لجميع الخصائص القابلة للإكمال دفعة واحدة للمراجعة" : "Auto-complete values for review"}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? "إكمال القيم تلقائيًا" : "Auto-complete Values"}</span>
            </button>

            <button
              id="btn-save-all-changes-modal"
              type="button"
              onClick={handleSaveAllChanges}
              className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer transition-all"
              title={isAr ? "حفظ جميع الخصائص والقيم والتعديلات دفعة واحدة للمادة" : "Save all changes in batch"}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isAr ? "حفظ جميع التعديلات" : "Save All Changes"}</span>
            </button>
          </div>
        </div>

        {/* ============================================================
            MAIN BODY: 3 Categorized Deficiency Sections (Requirements 5, 6, 7, 11)
            ============================================================ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Scenario A: Material is 100% complete */}
          {totalDeficiencies === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shadow-inner">
                <ShieldCheck className="w-9 h-9" />
              </div>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                {isAr ? "جميع خصائص المادة مكتملة وصالحة بنسبة 100% ✓" : "All Material Properties Complete & Valid 100% ✓"}
              </h3>
              <p className="text-xs max-w-lg leading-relaxed text-slate-500">
                {isAr 
                  ? "المادة مستوفية لكافة المواصفات والمعايير الهندسية المطلوبة ومؤهلة تماماً لحسابات الخلطة الخرسانية وفق طريقة درو-غوريس دون أي عوائق."
                  : "The material meets all engineering specifications and is fully eligible for Dreux-Gorisse concrete mix design."}
              </p>

              {validCompletedProps.length > 0 && (
                <div className="pt-4 w-full max-w-xl">
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-2">
                      {isAr ? `الخصائص المسجلة والصالحة (${validCompletedProps.length}):` : `Valid Recorded Properties (${validCompletedProps.length}):`}
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {validCompletedProps.map(p => (
                        <div key={p.key} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-right">
                          <span className="text-[10px] text-slate-400 block font-sans">{isAr ? p.nameAr : p.nameEn}</span>
                          <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">{p.currentValueDisplay}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* SECTION 1: ⚡ خصائص يمكن للنظام إكمالها تلقائيًا (Auto-completable) */}
              {autoCompletableProps.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-amber-200/60 dark:border-amber-900/40">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                        ⚡
                      </div>
                      <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <span>{isAr ? "خصائص يمكن للنظام إكمالها تلقائيًا" : "Properties Auto-Completable by System"}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200/70 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-mono">
                          {autoCompletableProps.length}
                        </span>
                      </h4>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {isAr ? "مستخلصة وموثقة من المعايير والمواصفات" : "Derived from standard specifications"}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {autoCompletableProps.map(prop => renderPropertyRow(prop, "AUTO"))}
                  </div>
                </div>
              )}

              {/* SECTION 2: ✍️ خصائص تحتاج إلى إدخال المستخدم (User Input Required) */}
              {userInputProps.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between pb-1 border-b border-blue-200/60 dark:border-blue-900/40">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                        ✍️
                      </div>
                      <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                        <span>{isAr ? "خصائص تحتاج إلى إدخال المستخدم" : "Properties Requiring User Input"}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-200/70 dark:bg-blue-950 text-blue-900 dark:text-blue-200 font-mono">
                          {userInputProps.length}
                        </span>
                      </h4>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {isAr ? "قيم متغيرة حقلية تتطلب إدخالاً واعتماداً هندسياً" : "Field-variable site measurements"}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {userInputProps.map(prop => renderPropertyRow(prop, "MANUAL"))}
                  </div>
                </div>
              )}

              {/* SECTION 3: ⚠️ خصائص تحتاج إلى مراجعة بسبب قيمة غير منطقية أو غير مؤكدة (Needs Review) */}
              {needsReviewProps.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between pb-1 border-b border-rose-200/60 dark:border-rose-900/40">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs">
                        ⚠️
                      </div>
                      <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                        <span>{isAr ? "خصائص تحتاج إلى مراجعة بسبب قيمة غير منطقية أو غير مؤكدة" : "Properties Requiring Review"}</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-200/70 dark:bg-rose-950 text-rose-900 dark:text-rose-200 font-mono">
                          {needsReviewProps.length}
                        </span>
                      </h4>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {isAr ? "قيم خارج الحدود أو مستخلصة بالمسح تحتاج تأكيداً" : "Values requiring validation or confirmation"}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {needsReviewProps.map(prop => renderPropertyRow(prop, "REVIEW"))}
                  </div>
                </div>
              )}

              {/* Optional Section: Already valid completed properties (Collapsible) */}
              {validCompletedProps.length > 0 && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCompletedProperties(!showCompletedProperties)}
                    className="flex items-center justify-between w-full py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer font-bold"
                  >
                    <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isAr ? `الخصائص المكتملة مسبقاً (${validCompletedProps.length})` : `Previously Completed Properties (${validCompletedProps.length})`}</span>
                    </span>
                    {showCompletedProperties ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showCompletedProperties && (
                    <div className="space-y-2 mt-2 pt-2">
                      {validCompletedProps.map(prop => renderPropertyRow(prop, "VALID"))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between text-xs">
          <div className="text-slate-500 text-[11px]">
            {isAr 
              ? "ملاحظة: يتم حفظ البيانات في السجل المحلي المعتمد وتطبيق اشتراطات التحقق تلقائياً." 
              : "Note: Properties are saved locally with automatic engineering validation."}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer transition-colors"
          >
            {isAr ? "إغلاق" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};
