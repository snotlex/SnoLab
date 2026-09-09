import React, { useState, useMemo, useEffect } from "react";
import { 
  X, 
  Check, 
  AlertTriangle, 
  Save, 
  Layers, 
  Sliders, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Edit3, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Wand2,
  SlidersHorizontal
} from "lucide-react";
import { EngineeringMaterial, MixDesignInput } from "../types";
import { 
  inspectMixMaterialProperties, 
  applyBatchMaterialProperties, 
  categorizeMixMaterialDeficiencies,
  CategorizedPropertyItem,
  MaterialDeficienciesBreakdown,
  BatchPropertiesSummary,
  EvaluatedProperty,
  BatchUpdatePayload
} from "../services/materialPropertySchema";

interface BatchMaterialPropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: EngineeringMaterial[];
  inputs: MixDesignInput;
  activeMaterials: { role: string; material: EngineeringMaterial }[];
  onSaveSuccess: (updatedMaterials: EngineeringMaterial[], updatedInputs: MixDesignInput) => void;
  language: "ar" | "fr" | "en";
  userId?: string;
}

export const BatchMaterialPropertiesModal: React.FC<BatchMaterialPropertiesModalProps> = ({
  isOpen,
  onClose,
  materials,
  inputs,
  activeMaterials,
  onSaveSuccess,
  language,
  userId
}) => {
  const isRtl = language === "ar";

  // Mode: unified deficiency completion mode vs full table view
  const [isUnifiedMode, setIsUnifiedMode] = useState<boolean>(true);
  // Form values state: key format `${materialId}_${propertyKey}` -> string / number
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [autoCompletedFields, setAutoCompletedFields] = useState<Record<string, boolean>>({});
  const [showExistingProps, setShowExistingProps] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedMaterials, setCollapsedMaterials] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [globalErrorBanner, setGlobalErrorBanner] = useState<string[]>([]);
  const [autoCompleteSuccessToast, setAutoCompleteSuccessToast] = useState<string | null>(null);
  const [saveSuccessNotification, setSaveSuccessNotification] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize and inspect properties when modal opens
  const propertiesSummary: BatchPropertiesSummary = useMemo(() => {
    return inspectMixMaterialProperties(
      activeMaterials,
      inputs.selectedMethod || (inputs as any).method || "dreux",
      inputs.concreteType || "NSC",
      language
    );
  }, [activeMaterials, inputs.selectedMethod, (inputs as any).method, inputs.concreteType, language]);

  // Categorize deficiencies into 3 groups per user requirements
  const deficienciesBreakdowns: MaterialDeficienciesBreakdown[] = useMemo(() => {
    return categorizeMixMaterialDeficiencies(
      activeMaterials,
      formValues,
      inputs.selectedMethod || (inputs as any).method || "dreux",
      inputs.concreteType || "NSC"
    );
  }, [activeMaterials, formValues, inputs.selectedMethod, (inputs as any).method, inputs.concreteType]);

  // Aggregate deficiency metrics
  const totalAutoCompletable = useMemo(() => {
    return deficienciesBreakdowns.reduce((acc, b) => acc + b.autoCompletable.length, 0);
  }, [deficienciesBreakdowns]);

  const totalUserInput = useMemo(() => {
    return deficienciesBreakdowns.reduce((acc, b) => acc + b.userInput.length, 0);
  }, [deficienciesBreakdowns]);

  const totalNeedsReview = useMemo(() => {
    return deficienciesBreakdowns.reduce((acc, b) => acc + b.needsReview.length, 0);
  }, [deficienciesBreakdowns]);

  const totalDeficiencies = totalAutoCompletable + totalUserInput + totalNeedsReview;

  // Reset form values on open
  useEffect(() => {
    if (isOpen) {
      const initialVals: Record<string, any> = {};
      propertiesSummary.groups.forEach(group => {
        group.properties.forEach(prop => {
          const fieldKey = `${group.material.id}_${prop.key}`;
          if (prop.currentValue !== undefined && prop.currentValue !== null) {
            initialVals[fieldKey] = prop.currentValue;
          } else {
            initialVals[fieldKey] = "";
          }
        });
      });
      setFormValues(initialVals);
      setAutoCompletedFields({});
      setValidationErrors({});
      setGlobalErrorBanner([]);
      setAutoCompleteSuccessToast(null);
      setSaveSuccessNotification(null);
      setIsUnifiedMode(propertiesSummary.totalMissingRequired > 0);
    }
  }, [isOpen, propertiesSummary]);

  if (!isOpen) return null;

  // Localization labels
  const t = {
    modalTitle: language === "ar" ? "إكمال خصائص المواد" : language === "fr" ? "Compléter les caractéristiques des matériaux" : "Complete Material Properties",
    modalSubtitle: language === "ar" 
      ? "نظام احترافي موحد لإكمال وفحص خصائص المواد المستخدمة في الخلطة بدقة علمية وفق اشتراطات درو-غوريس والمواصفات القياسية."
      : language === "fr"
      ? "Système unifié pour compléter et vérifier les caractéristiques des matériaux de formulation selon Dreux-Gorisse."
      : "Unified engineering workflow to complete and audit material properties for Dreux-Gorisse concrete formulations.",
    btnCompleteAll: language === "ar" ? "إكمال جميع الخصائص الناقصة" : language === "fr" ? "Compléter toutes les propriétés manquantes" : "Complete All Missing Properties",
    btnAutoComplete: language === "ar" ? "إكمال القيم تلقائيًا" : language === "fr" ? "Compléter automatiquement" : "Auto-Complete Values",
    btnSaveAll: language === "ar" ? "حفظ جميع التعديلات" : language === "fr" ? "Enregistrer toutes les modifications" : "Save All Changes",
    btnCancel: language === "ar" ? "إلغاء" : language === "fr" ? "Annuler" : "Cancel",
    showExisting: language === "ar" ? "إظهار الخصائص الحالية" : language === "fr" ? "Afficher les propriétés existantes" : "Show existing properties",
    searchPlaceholder: language === "ar" ? "بحث عن مادة أو خاصية..." : language === "fr" ? "Rechercher un matériau ou une propriété..." : "Search material or property...",
    collapseAll: language === "ar" ? "طي الكل" : language === "fr" ? "Tout replier" : "Collapse all",
    expandAll: language === "ar" ? "توسيع الكل" : language === "fr" ? "Tout déplier" : "Expand all",
    modeUnified: language === "ar" ? "معالج إكمال النواقص الموحد" : language === "fr" ? "Assistant unifié d'achèvement" : "Unified Completion Wizard",
    modeTable: language === "ar" ? "جدول الخصائص التفصيلي" : language === "fr" ? "Tableau détaillé" : "Detailed Properties Table",
    missingCountBadge: (count: number) => language === "ar" ? `${count} خصائص ناقصة` : language === "fr" ? `${count} propriété(s) manquante(s)` : `${count} missing properties`,
    allValidBadge: language === "ar" ? "جميع الخصائص مكتملة ✓" : language === "fr" ? "Toutes les caractéristiques sont complètes ✓" : "All properties complete ✓",
    colProperty: language === "ar" ? "الخاصية الهندسية" : language === "fr" ? "Propriété" : "Property",
    colCurrent: language === "ar" ? "القيمة الحالية" : language === "fr" ? "Valeur actuelle" : "Current Value",
    colNewInput: language === "ar" ? "القيمة الجديدة" : language === "fr" ? "Nouvelle valeur" : "New Value",
    colUnit: language === "ar" ? "الوحدة" : language === "fr" ? "Unité" : "Unit",
    colStatus: language === "ar" ? "الحالة" : language === "fr" ? "Statut" : "Status",
    statusMissing: language === "ar" ? "مفقودة" : language === "fr" ? "Manquante" : "Missing",
    statusValid: language === "ar" ? "صالحة" : language === "fr" ? "Valide" : "Valid",
    statusInvalid: language === "ar" ? "غير صالحة" : language === "fr" ? "Invalide" : "Invalid",
    statusModified: language === "ar" ? "معدلة" : language === "fr" ? "Modifiée" : "Modified",
    requiredBadge: language === "ar" ? "مطلوبة" : language === "fr" ? "Requise" : "Required",
    optionalBadge: language === "ar" ? "اختيارية" : language === "fr" ? "Optionnelle" : "Optional",
    noMaterialsFound: language === "ar" ? "لم يتم العثور على مواد أو خصائص مطابقة." : language === "fr" ? "Aucun matériau ou propriété correspondante." : "No matching materials or properties found."
  };

  const handleInputChange = (material: EngineeringMaterial, prop: EvaluatedProperty | CategorizedPropertyItem, rawVal: any) => {
    const fieldKey = `${material.id}_${prop.key}`;
    setFormValues(prev => ({
      ...prev,
      [fieldKey]: rawVal
    }));

    if (globalErrorBanner.length > 0) {
      setGlobalErrorBanner([]);
    }

    // Live validation
    if (rawVal === "" || rawVal === undefined || rawVal === null) {
      if (prop.isRequired) {
        setValidationErrors(prev => ({
          ...prev,
          [fieldKey]: language === "ar" ? "هذه الخاصية إلزامية للخلطة." : language === "fr" ? "Cette propriété est requise." : "This property is required."
        }));
      } else {
        setValidationErrors(prev => {
          const next = { ...prev };
          delete next[fieldKey];
          return next;
        });
      }
      return;
    }

    let parsedVal = rawVal;
    const inputType = "definition" in prop ? prop.definition.inputType : prop.inputType;
    if (inputType === "number") {
      parsedVal = typeof rawVal === "number" ? rawVal : parseFloat(String(rawVal).replace(",", "."));
    }

    const currentMethod = inputs.selectedMethod || (inputs as any).method || "dreux";
    let valResult: { isValid: boolean; errorAr?: string; errorFr?: string; errorEn?: string } = { isValid: true };
    
    if ("definition" in prop) {
      valResult = prop.definition.validate(parsedVal, material, currentMethod);
    }

    if (!valResult.isValid) {
      setValidationErrors(prev => ({
        ...prev,
        [fieldKey]: language === "ar" ? (valResult.errorAr || "قيمة غير صالحة") : language === "fr" ? (valResult.errorFr || "Valeur invalide") : (valResult.errorEn || "Invalid value")
      }));
    } else {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
    }
  };

  // 1. Action: Auto-complete all auto-completable and suggested values
  const handleAutoCompleteAll = () => {
    const newFormVals = { ...formValues };
    const newAutoCompleted = { ...autoCompletedFields };
    let completedCount = 0;

    deficienciesBreakdowns.forEach(b => {
      // Auto-completable
      b.autoCompletable.forEach(prop => {
        const fieldKey = `${prop.materialId}_${prop.key}`;
        if (newFormVals[fieldKey] === "" || newFormVals[fieldKey] === undefined || newFormVals[fieldKey] === null) {
          newFormVals[fieldKey] = prop.suggestedValue;
          newAutoCompleted[fieldKey] = true;
          completedCount++;
        }
      });
      // Needs review suggested corrections
      b.needsReview.forEach(prop => {
        const fieldKey = `${prop.materialId}_${prop.key}`;
        if (prop.suggestedValue !== undefined && !newAutoCompleted[fieldKey]) {
          newFormVals[fieldKey] = prop.suggestedValue;
          newAutoCompleted[fieldKey] = true;
          completedCount++;
        }
      });
      // User input properties - auto-fill with safe standard default if empty
      b.userInput.forEach(prop => {
        const fieldKey = `${prop.materialId}_${prop.key}`;
        if (newFormVals[fieldKey] === "" || newFormVals[fieldKey] === undefined || newFormVals[fieldKey] === null) {
          const val = prop.suggestedValue !== undefined 
            ? prop.suggestedValue 
            : ((prop as any).referenceStandardValue !== undefined 
              ? (prop as any).referenceStandardValue 
              : (prop.key === "moisture" ? 1.5 : (prop.key === "absorption" ? 1.2 : (prop.key === "particleShape" ? "مكسر" : ""))));
          if (val !== "") {
            newFormVals[fieldKey] = val;
            newAutoCompleted[fieldKey] = true;
            completedCount++;
          }
        }
      });
    });

    setFormValues(newFormVals);
    setAutoCompletedFields(newAutoCompleted);
    setValidationErrors({});
    setGlobalErrorBanner([]);

    setAutoCompleteSuccessToast(
      language === "ar"
        ? `✓ تم إكمال ${completedCount} خاصية ناقصة بالقيم المرجعية القياسية. يمكنك مراجعتها أو تعديلها الآن قبل الحفظ.`
        : `✓ Automatically filled ${completedCount} missing properties with standard reference values. You can review them before saving.`
    );
    setTimeout(() => setAutoCompleteSuccessToast(null), 5000);
  };

  // 2. Action: Apply single suggestion
  const handleApplySingleSuggestion = (materialId: string, propertyKey: string, suggestedVal: any) => {
    const fieldKey = `${materialId}_${propertyKey}`;
    setFormValues(prev => ({
      ...prev,
      [fieldKey]: suggestedVal
    }));
    setAutoCompletedFields(prev => ({
      ...prev,
      [fieldKey]: true
    }));
    setValidationErrors(prev => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  // 3. Action: Handle Save All (Batch & Atomic)
  const handleSaveAll = async () => {
    setIsSaving(true);
    const errorsList: string[] = [];
    const updatesList: BatchUpdatePayload[] = [];

    // Check all visible / modified fields
    for (const group of propertiesSummary.groups) {
      for (const prop of group.properties) {
        const fieldKey = `${group.material.id}_${prop.key}`;
        const rawVal = formValues[fieldKey];

        const isProvided = rawVal !== undefined && rawVal !== null && rawVal !== "";
        const isModified = isProvided && rawVal !== prop.currentValue;

        if (prop.isRequired && !isProvided) {
          errorsList.push(
            language === "ar" 
              ? `مطلوب إدخال [${prop.labelAr}] لمادة (${group.material.name}).`
              : language === "fr"
              ? `[${prop.labelFr}] est requis pour (${group.material.name}).`
              : `[${prop.labelEn}] is required for (${group.material.name}).`
          );
          continue;
        }

        if (isProvided && (isModified || !prop.hasCurrentValue)) {
          let parsedVal = rawVal;
          if (prop.definition.inputType === "number") {
            parsedVal = typeof rawVal === "number" ? rawVal : parseFloat(String(rawVal).replace(",", "."));
          }

          const currentMethod = inputs.selectedMethod || (inputs as any).method || "dreux";
          const valResult = prop.definition.validate(parsedVal, group.material, currentMethod);
          if (!valResult.isValid) {
            errorsList.push(
              `${group.material.name} - ${language === "ar" ? prop.labelAr : prop.labelEn}: ${valResult.errorAr || valResult.errorEn}`
            );
          } else {
            updatesList.push({
              materialId: group.material.id,
              propertyKey: prop.key,
              newValue: parsedVal
            });
          }
        }
      }
    }

    if (errorsList.length > 0) {
      setGlobalErrorBanner(errorsList);
      setIsSaving(false);
      return;
    }

    try {
      const { updatedMaterials, updatedInputs, errors } = applyBatchMaterialProperties(
        materials,
        inputs,
        updatesList,
        userId
      );

      if (errors.length > 0) {
        setGlobalErrorBanner(errors);
        setIsSaving(false);
        return;
      }

      // Live update without refresh
      onSaveSuccess(updatedMaterials, updatedInputs);

      // Re-evaluate if any deficiencies remain
      const remainingDeficiencies = propertiesSummary.totalMissingRequired - updatesList.length;
      if (remainingDeficiencies <= 0) {
        setSaveSuccessNotification(
          language === "ar"
            ? "✓ اكتملت جميع خصائص المواد بنجاح! تم اعتماد المواد بحالة (مكتملة ✓) وأصبحت مؤهلة بالكامل لحسابات الخلطة."
            : "✓ All material properties completed successfully! Materials are now (Complete ✓) and ready for calculations."
        );
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setSaveSuccessNotification(
          language === "ar"
            ? `✓ تم حفظ التعديلات بنجاح. تبقى ${remainingDeficiencies} خصائص غير مكتملة.`
            : `✓ Changes saved successfully. ${remainingDeficiencies} properties remain incomplete.`
        );
      }
    } catch (err: any) {
      setGlobalErrorBanner([err?.message || "Failed to save material properties."]);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCollapse = (matId: string) => {
    setCollapsedMaterials(prev => ({
      ...prev,
      [matId]: !prev[matId]
    }));
  };

  const toggleAllCollapse = () => {
    const allCollapsed = propertiesSummary.groups.every(g => collapsedMaterials[g.material.id]);
    const newState: Record<string, boolean> = {};
    propertiesSummary.groups.forEach(g => {
      newState[g.material.id] = !allCollapsed;
    });
    setCollapsedMaterials(newState);
  };

  // Filter groups and properties based on showExistingProps and searchQuery
  const filteredGroups = propertiesSummary.groups.map(group => {
    const isMaterialMatch = group.material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            group.categoryAr.includes(searchQuery) ||
                            group.categoryEn.toLowerCase().includes(searchQuery.toLowerCase());

    const filteredProps = group.properties.filter(prop => {
      const fieldKey = `${group.material.id}_${prop.key}`;
      const currentVal = formValues[fieldKey];
      
      if (!showExistingProps && prop.hasCurrentValue && !formValues[`${group.material.id}_${prop.key}_dirty`]) {
        if (!prop.status || prop.status === "valid") {
          return false;
        }
      }

      if (!searchQuery.trim()) return true;
      if (isMaterialMatch) return true;

      const propText = `${prop.labelAr} ${prop.labelFr} ${prop.labelEn} ${prop.key}`.toLowerCase();
      return propText.includes(searchQuery.toLowerCase());
    });

    return {
      ...group,
      properties: filteredProps
    };
  }).filter(group => group.properties.length > 0);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in"
      id="batch-material-properties-modal"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-up">
        
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-transparent dark:from-blue-950/20 dark:via-indigo-950/10">
          <div className="space-y-1.5 text-right w-full">
            <div className="flex items-center gap-3 justify-start flex-wrap">
              <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                <Sliders size={22} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white">
                    {t.modalTitle}
                  </h3>
                  
                  {propertiesSummary.totalMissingRequired > 0 ? (
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                      <AlertTriangle size={13} />
                      {t.missingCountBadge(propertiesSummary.totalMissingRequired)}
                    </span>
                  ) : (
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                      <CheckCircle2 size={13} />
                      {t.allValidBadge}
                    </span>
                  )}

                  {/* PRIMARY HEADER BUTTON: COMPLETE ALL MISSING PROPERTIES */}
                  {propertiesSummary.totalMissingRequired > 0 && (
                    <button
                      id="btn-complete-all-missing-properties"
                      type="button"
                      onClick={() => {
                        handleAutoCompleteAll();
                        setIsUnifiedMode(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer border border-amber-400/40"
                      title={language === "ar" ? "إكمال جميع الخصائص والحقول والقيم الناقصة دفعة واحدة" : "Complete all missing properties in batch"}
                    >
                      <Sparkles size={14} className="animate-pulse text-amber-200" />
                      <span>{t.btnCompleteAll}</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl mt-1 leading-relaxed">
                  {t.modalSubtitle}
                </p>
              </div>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title={t.btnCancel}
          >
            <X size={20} />
          </button>
        </div>

        {/* WORKSPACE MODE SWITCHER & SEARCH BAR */}
        <div className="px-5 sm:px-6 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setIsUnifiedMode(true)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isUnifiedMode 
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Sparkles size={14} />
              <span>{t.modeUnified}</span>
              {totalDeficiencies > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-black">
                  {totalDeficiencies}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsUnifiedMode(false)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                !isUnifiedMode 
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <SlidersHorizontal size={14} />
              <span>{t.modeTable}</span>
            </button>
          </div>

          {/* Quick Search & Controls */}
          <div className="flex items-center gap-3 flex-1 justify-end max-w-lg">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className={`absolute ${isRtl ? "right-3" : "left-3"} top-2 text-slate-400`} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className={`w-full ${isRtl ? "pr-8 pl-3" : "pl-8 pr-3"} py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>

            {!isUnifiedMode && (
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700 dark:text-slate-300 select-none whitespace-nowrap">
                <input 
                  type="checkbox"
                  checked={showExistingProps}
                  onChange={(e) => setShowExistingProps(e.target.checked)}
                  className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span>{t.showExisting}</span>
              </label>
            )}

            {!isUnifiedMode && (
              <button 
                type="button"
                onClick={toggleAllCollapse}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer whitespace-nowrap"
              >
                {propertiesSummary.groups.every(g => collapsedMaterials[g.material.id]) ? t.expandAll : t.collapseAll}
              </button>
            )}
          </div>
        </div>

        {/* FEEDBACK & NOTIFICATION BANNERS */}
        {autoCompleteSuccessToast && (
          <div className="mx-5 sm:mx-6 mt-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span>{autoCompleteSuccessToast}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setAutoCompleteSuccessToast(null)}
              className="text-emerald-600 hover:text-emerald-800"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {saveSuccessNotification && (
          <div className="mx-5 sm:mx-6 mt-4 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5 font-black animate-scale-up">
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
            <span>{saveSuccessNotification}</span>
          </div>
        )}

        {globalErrorBanner.length > 0 && (
          <div className="mx-5 sm:mx-6 mt-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs space-y-1.5 animate-shake">
            <div className="flex items-center gap-2 font-black">
              <AlertCircle size={16} />
              <span>
                {language === "ar" 
                  ? `يرجى تصحيح الأخطاء التالية قبل الحفظ (${globalErrorBanner.length} خطأ):`
                  : `Please correct the following errors before saving (${globalErrorBanner.length} errors):`}
              </span>
            </div>
            <ul className="list-disc list-inside space-y-1 pr-2 font-medium">
              {globalErrorBanner.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* MODAL MAIN BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* ============================================================== */}
          {/* MODE 1: UNIFIED COMPLETION WORKSPACE (THE REQUESTED SYSTEM)    */}
          {/* ============================================================== */}
          {isUnifiedMode ? (
            <div className="space-y-6" id="unified-completion-workspace">
              
              {/* TOP SUMMARY & ACTION CONTROLS PANEL */}
              <div className="p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Wand2 size={18} className="text-amber-400" />
                      <h4 className="text-base font-black text-white">
                        {language === "ar" ? "لوحة المعالجة الموحدة لنواقص المواد" : "Unified Material Deficiencies Control Panel"}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                      {language === "ar"
                        ? "يتم فحص النواقص مقابل مخطط الخصائص المعتمد (Schema). يتم استنتاج القيم القياسية بدقة فيزيائية دون أرقام عشوائية."
                        : "Deficiencies are audited against standardized property schemas. Standard parameters are applied logically without fictitious numbers."}
                    </p>
                  </div>

                  {/* THE TWO PRIMARY ACTION BUTTONS */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      id="btn-auto-complete-values"
                      type="button"
                      onClick={handleAutoCompleteAll}
                      disabled={totalAutoCompletable === 0 && totalNeedsReview === 0 && totalUserInput === 0 && propertiesSummary.totalMissingRequired === 0}
                      className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 cursor-pointer border border-amber-400/30"
                      title={language === "ar" ? "إكمال جميع الخصائص القابلة للاستنتاج القياسي مرة واحدة" : "Auto-fill all standard inferable properties"}
                    >
                      <Wand2 size={15} className="animate-pulse" />
                      <span>{t.btnAutoComplete}</span>
                      {totalAutoCompletable > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-white/25 text-[10px]">
                          {totalAutoCompletable}
                        </span>
                      )}
                    </button>

                    <button
                      id="btn-save-all-unified-changes"
                      type="button"
                      onClick={handleSaveAll}
                      disabled={isSaving}
                      className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      title={language === "ar" ? "حفظ جميع القيم والتعديلات وإعادة فحص المادة كـ (مكتملة ✓)" : "Save all properties atomically and validate status"}
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save size={15} />
                      )}
                      <span>{t.btnSaveAll}</span>
                    </button>
                  </div>
                </div>

                {/* METRICS COUNTERS STRIP */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2.5 text-xs">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 font-bold flex items-center gap-2">
                    <span className="text-slate-400">{language === "ar" ? "إجمالي النواقص المكتشفة:" : "Total Deficiencies:"}</span>
                    <span className="font-mono text-white text-sm font-black">{totalDeficiencies}</span>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span>
                      {totalAutoCompletable} {language === "ar" ? "يمكن للنظام إكمالها تلقائيًا" : "Auto-completable by system"}
                    </span>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-amber-950/40 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-amber-400" />
                    <span>
                      {totalUserInput} {language === "ar" ? "تحتاج إلى إدخال المستخدم" : "Require user input"}
                    </span>
                  </div>

                  {totalNeedsReview > 0 && (
                    <div className="px-3 py-1.5 rounded-xl bg-rose-950/40 text-rose-300 border border-rose-500/30 font-bold flex items-center gap-1.5">
                      <AlertCircle size={14} className="text-rose-400" />
                      <span>
                        {totalNeedsReview} {language === "ar" ? "تحتاج مراجعة (قيمة غير منطقية)" : "Require review (Illogical)"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* DEFICIENCY SECTIONS BY MATERIAL */}
              {totalDeficiencies === 0 ? (
                <div className="p-12 text-center border border-emerald-500/30 rounded-3xl bg-emerald-500/5 dark:bg-emerald-950/20 space-y-3">
                  <CheckCircle2 size={44} className="mx-auto text-emerald-500" />
                  <h4 className="text-base font-black text-emerald-800 dark:text-emerald-300">
                    {language === "ar" ? "جميع خصائص المواد مكتملة وصالحة 100%!" : "All material properties are 100% complete and valid!"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    {language === "ar" 
                      ? "لا توجد أي خصائص ناقصة أو غير صالحة. المواد جاهزة ومعتمدة تماماً لحسابات الخلطة الخرسانية وفق طريقة درو-غوريس."
                      : "No missing or invalid properties found. Materials are fully approved and ready for concrete mix calculations."}
                  </p>
                </div>
              ) : (
                deficienciesBreakdowns.map(breakdown => {
                  if (breakdown.totalDeficiencies === 0 && !showExistingProps) return null;

                  return (
                    <div 
                      key={breakdown.material.id} 
                      className="border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm space-y-4 p-5 sm:p-6"
                    >
                      {/* MATERIAL HEADER IN UNIFIED VIEW */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Layers size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                                {breakdown.material.name}
                              </h4>
                              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {breakdown.material.category || breakdown.role}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              ID: {breakdown.material.id}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {breakdown.totalDeficiencies} {language === "ar" ? "نواقص بحاجة لمعالجة" : "deficiencies"}
                          </span>
                        </div>
                      </div>

                      {/* SECTION 1: AUTO-COMPLETABLE BY SYSTEM */}
                      {breakdown.autoCompletable.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-xs font-black text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 size={16} />
                            <span>
                              {language === "ar" ? "1. خصائص يمكن للنظام إكمالها تلقائيًا (قيم قياسية معتمدة):" : "1. Auto-completable Properties (Standard References):"}
                            </span>
                            <span className="px-2 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono text-[10px]">
                              {breakdown.autoCompletable.length}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            {breakdown.autoCompletable.map(item => {
                              const fieldKey = `${item.materialId}_${item.key}`;
                              const currentVal = formValues[fieldKey];
                              const isFilled = currentVal !== "" && currentVal !== undefined && currentVal !== null;
                              const isAutoFilled = autoCompletedFields[fieldKey];

                              return (
                                <div 
                                  key={item.key}
                                  className={`p-4 rounded-2xl border transition-all ${
                                    isFilled 
                                      ? "bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-950/15" 
                                      : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800"
                                  }`}
                                >
                                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                    <div className="space-y-1 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                                          {item.labelAr} ({item.labelEn})
                                        </span>
                                        <code className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold">
                                          {item.key}
                                        </code>
                                        {item.unit && (
                                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-bold">
                                            [{item.unit}]
                                          </span>
                                        )}
                                        {isAutoFilled ? (
                                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                            {language === "ar" ? "✓ تم الملء تلقائيًا" : "✓ Auto-filled"}
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
                                            {language === "ar" ? "فارغة / غير مسجلة" : "Empty / Missing"}
                                          </span>
                                        )}
                                      </div>

                                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                                        <span>
                                          <strong className="text-slate-700 dark:text-slate-300">{language === "ar" ? "المصدر:" : "Source:"}</strong> {item.valueSource}
                                        </span>
                                        <span>
                                          <strong className="text-slate-700 dark:text-slate-300">{language === "ar" ? "القيمة المقترحة:" : "Suggested:"}</strong> <span className="font-bold text-blue-600 dark:text-blue-400">{item.suggestedValue} {item.unit}</span>
                                        </span>
                                      </div>
                                    </div>

                                    {/* VALUE INPUT & QUICK APPLY */}
                                    <div className="flex items-center gap-2 min-w-[240px]">
                                      <input 
                                        type="number"
                                        step="any"
                                        placeholder={String(item.suggestedValue)}
                                        value={currentVal ?? ""}
                                        onChange={(e) => handleInputChange(breakdown.material, item, e.target.value)}
                                        className="w-28 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleApplySingleSuggestion(item.materialId, item.key, item.suggestedValue)}
                                        className="px-3 py-2 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer whitespace-nowrap"
                                        title={language === "ar" ? "تطبيق القيمة القياسية المقترحة" : "Apply suggested value"}
                                      >
                                        {language === "ar" ? "تطبيق المقترح" : "Apply"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* SECTION 2: REQUIRE USER INPUT */}
                      {breakdown.userInput.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center gap-2 text-xs font-black text-amber-700 dark:text-amber-400">
                            <AlertTriangle size={16} />
                            <span>
                              {language === "ar" ? "2. خصائص تحتاج إلى إدخال المستخدم (فحوصات حقلية أو موقعية):" : "2. Properties Requiring User Input (Field / Site Tests):"}
                            </span>
                            <span className="px-2 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono text-[10px]">
                              {breakdown.userInput.length}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            {breakdown.userInput.map(item => {
                              const fieldKey = `${item.materialId}_${item.key}`;
                              const currentVal = formValues[fieldKey];
                              const errorMsg = validationErrors[fieldKey];

                              return (
                                <div 
                                  key={item.key}
                                  className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/15 space-y-2"
                                >
                                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                    <div className="space-y-1 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                                          {item.labelAr} ({item.labelEn})
                                        </span>
                                        <code className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold">
                                          {item.key}
                                        </code>
                                        {item.unit && (
                                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-bold">
                                            [{item.unit}]
                                          </span>
                                        )}
                                      </div>

                                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                                        <strong className="text-amber-700 dark:text-amber-400">{language === "ar" ? "سبب طلب القيمة:" : "Reason Required:"}</strong> {item.requiredReason}
                                      </p>
                                    </div>

                                    {/* INPUT FIELD WITH QUICK VALUE */}
                                    <div className="flex items-center gap-2 min-w-[260px]">
                                      <input 
                                        type="number"
                                        step="any"
                                        placeholder={item.placeholder || String(item.suggestedValue)}
                                        value={currentVal ?? ""}
                                        onChange={(e) => handleInputChange(breakdown.material, item, e.target.value)}
                                        className={`w-28 p-2 bg-white dark:bg-slate-800 border rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 text-center ${
                                          errorMsg ? "border-rose-500 focus:ring-rose-500" : "border-amber-300 dark:border-amber-700 focus:ring-amber-500"
                                        }`}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleApplySingleSuggestion(item.materialId, item.key, item.suggestedValue)}
                                        className="px-3 py-2 rounded-xl text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all cursor-pointer whitespace-nowrap"
                                        title={language === "ar" ? `استخدام القيمة الاسترشادية المعتادة (${item.suggestedValue})` : "Use guidance value"}
                                      >
                                        {language === "ar" ? `استخدام (${item.suggestedValue})` : `Use (${item.suggestedValue})`}
                                      </button>
                                    </div>
                                  </div>

                                  {errorMsg && (
                                    <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                      <AlertTriangle size={11} />
                                      <span>{errorMsg}</span>
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* SECTION 3: REQUIRE REVIEW (ILLOGICAL OR OUT OF RANGE) */}
                      {breakdown.needsReview.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center gap-2 text-xs font-black text-rose-700 dark:text-rose-400">
                            <AlertCircle size={16} />
                            <span>
                              {language === "ar" ? "3. خصائص تحتاج إلى مراجعة بسبب قيمة غير منطقية أو غير مقبولة:" : "3. Properties Requiring Review (Illogical / Out of Bounds):"}
                            </span>
                            <span className="px-2 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-mono text-[10px]">
                              {breakdown.needsReview.length}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            {breakdown.needsReview.map(item => {
                              const fieldKey = `${item.materialId}_${item.key}`;
                              const currentVal = formValues[fieldKey];

                              return (
                                <div 
                                  key={item.key}
                                  className="p-4 rounded-2xl border border-rose-500/40 bg-rose-500/5 dark:bg-rose-950/20 space-y-2"
                                >
                                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                    <div className="space-y-1 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                                          {item.labelAr} ({item.labelEn})
                                        </span>
                                        <code className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-300 font-bold">
                                          {item.key}
                                        </code>
                                      </div>

                                      <div className="text-[11px] space-y-0.5">
                                        <p className="text-rose-700 dark:text-rose-400 font-semibold">
                                          <strong>{language === "ar" ? "المشكلة:" : "Issue:"}</strong> {item.validationIssue || (language === "ar" ? "القيمة خارج الحدود الهندسية المسموح بها." : "Value out of bounds.")}
                                        </p>
                                        <p className="text-slate-500 dark:text-slate-400">
                                          <strong>{language === "ar" ? "القيمة الحالية المسجلة:" : "Current:"}</strong> <span className="line-through font-mono font-bold text-rose-600">{item.currentValueDisplay}</span>
                                          {" • "}
                                          <strong>{language === "ar" ? "القيمة المقترحة المصححة:" : "Suggested:"}</strong> <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{item.suggestedValue} {item.unit}</span>
                                        </p>
                                      </div>
                                    </div>

                                    {/* ACCEPT CORRECTION ACTION */}
                                    <div className="flex items-center gap-2 min-w-[260px]">
                                      <input 
                                        type="number"
                                        step="any"
                                        placeholder={String(item.suggestedValue)}
                                        value={currentVal ?? ""}
                                        onChange={(e) => handleInputChange(breakdown.material, item, e.target.value)}
                                        className="w-28 p-2 bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 text-center"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleApplySingleSuggestion(item.materialId, item.key, item.suggestedValue)}
                                        className="px-3 py-2 rounded-xl text-[11px] font-black bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer whitespace-nowrap shadow-sm"
                                        title={language === "ar" ? "قبول وتطبيق القيمة المصححة" : "Accept corrected value"}
                                      >
                                        {language === "ar" ? `قبول التصحيح (${item.suggestedValue})` : `Accept (${item.suggestedValue})`}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })
              )}

            </div>
          ) : (
            
            /* ============================================================== */
            /* MODE 2: DETAILED PROPERTY TABLES VIEW                           */
            /* ============================================================== */
            <div className="space-y-6" id="detailed-property-tables-view">
              {filteredGroups.length === 0 ? (
                <div className="p-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
                  <Info size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-bold">{t.noMaterialsFound}</p>
                  {!showExistingProps && (
                    <p className="text-xs text-slate-400">
                      {language === "ar" ? "جميع الخصائص المطلوبة مسجلة وصالحة. يمكنك تفعيل 'إظهار الخصائص الحالية' لتعديلها." : "All required properties are filled and valid. Toggle 'Show existing properties' to modify."}
                    </p>
                  )}
                </div>
              ) : (
                filteredGroups.map(group => {
                  const isCollapsed = !!collapsedMaterials[group.material.id];
                  return (
                    <div 
                      key={group.material.id}
                      className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/80 overflow-hidden shadow-sm"
                      id={`batch-group-${group.material.id}`}
                    >
                      {/* MATERIAL HEADER */}
                      <div 
                        onClick={() => toggleCollapse(group.material.id)}
                        className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Layers size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                {group.material.name}
                              </h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {language === "ar" ? group.categoryAr : group.categoryEn}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              ID: {group.material.id}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {group.missingRequiredCount > 0 ? (
                            <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                              {group.missingRequiredCount} {language === "ar" ? "ناقصة" : "missing"}
                            </span>
                          ) : (
                            <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                              ✓ {language === "ar" ? "مكتملة" : "complete"}
                            </span>
                          )}
                          {isCollapsed ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronUp size={18} className="text-slate-400" />}
                        </div>
                      </div>

                      {/* PROPERTIES TABLE */}
                      {!isCollapsed && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-right text-xs">
                            <thead className="bg-slate-100/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                              <tr>
                                <th className="p-3 w-1/4">{t.colProperty}</th>
                                <th className="p-3 w-1/6">{t.colCurrent}</th>
                                <th className="p-3 w-1/3">{t.colNewInput}</th>
                                <th className="p-3 w-1/12">{t.colUnit}</th>
                                <th className="p-3 w-1/6">{t.colStatus}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                              {group.properties.map(prop => {
                                const fieldKey = `${group.material.id}_${prop.key}`;
                                const currentInputVal = formValues[fieldKey] !== undefined ? formValues[fieldKey] : "";
                                const errorMsg = validationErrors[fieldKey];
                                const isModified = currentInputVal !== "" && currentInputVal !== prop.currentValue;

                                return (
                                  <tr 
                                    key={prop.key}
                                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${!prop.hasCurrentValue ? "bg-amber-500/5" : ""}`}
                                  >
                                    <td className="p-3 align-top">
                                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                        <span>{language === "ar" ? prop.labelAr : language === "fr" ? prop.labelFr : prop.labelEn}</span>
                                        {prop.isRequired ? (
                                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                            * {t.requiredBadge}
                                          </span>
                                        ) : (
                                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                            {t.optionalBadge}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                        {prop.key}
                                      </div>
                                    </td>

                                    <td className="p-3 align-top">
                                      <span className={`font-mono ${prop.hasCurrentValue ? "text-slate-700 dark:text-slate-300" : "text-amber-500 font-bold"}`}>
                                        {prop.hasCurrentValue ? prop.currentValueDisplay : t.statusMissing}
                                      </span>
                                    </td>

                                    <td className="p-3 align-top space-y-1">
                                      {prop.definition.inputType === "select" ? (
                                        <select
                                          value={currentInputVal}
                                          onChange={(e) => handleInputChange(group.material, prop, e.target.value)}
                                          className={`w-full p-2 bg-white dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-slate-100 font-sans focus:outline-none focus:ring-2 ${
                                            errorMsg 
                                              ? "border-rose-500 focus:ring-rose-500" 
                                              : "border-slate-200 dark:border-slate-700 focus:ring-blue-500"
                                          }`}
                                        >
                                          <option value="">{language === "ar" ? "-- اختر القيمة --" : "-- Select value --"}</option>
                                          {prop.definition.options?.map(opt => (
                                            <option key={opt.value} value={opt.value}>
                                              {language === "ar" ? opt.labelAr : language === "fr" ? opt.labelFr : opt.labelEn}
                                            </option>
                                          ))}
                                        </select>
                                      ) : (
                                        <div className="relative">
                                          <input 
                                            type="number"
                                            step={prop.definition.step || "any"}
                                            min={prop.definition.min}
                                            max={prop.definition.max}
                                            placeholder={prop.definition.placeholder || (prop.hasCurrentValue ? String(prop.currentValue) : "")}
                                            value={currentInputVal}
                                            onChange={(e) => handleInputChange(group.material, prop, e.target.value)}
                                            className={`w-full p-2 bg-white dark:bg-slate-800 border rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 ${
                                              errorMsg 
                                                ? "border-rose-500 focus:ring-rose-500" 
                                                : isModified
                                                ? "border-blue-500 ring-1 ring-blue-500/30"
                                                : "border-slate-200 dark:border-slate-700 focus:ring-blue-500"
                                            }`}
                                          />
                                        </div>
                                      )}
                                      
                                      {errorMsg && (
                                        <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 animate-fade-in">
                                          <AlertTriangle size={11} />
                                          <span>{errorMsg}</span>
                                        </p>
                                      )}
                                    </td>

                                    <td className="p-3 align-top font-mono text-slate-500">
                                      {prop.unit || "—"}
                                    </td>

                                    <td className="p-3 align-top">
                                      {errorMsg ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[10px]">
                                          <AlertCircle size={10} />
                                          {t.statusInvalid}
                                        </span>
                                      ) : isModified ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[10px]">
                                          <Edit3 size={10} />
                                          {t.statusModified}
                                        </span>
                                      ) : prop.hasCurrentValue ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                                          <Check size={10} />
                                          {t.statusValid}
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                                          <AlertTriangle size={10} />
                                          {t.statusMissing}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Info size={14} className="text-blue-500" />
            <span>
              {language === "ar" 
                ? "يتم حفظ كافة الخصائص ذرّياً (Atomic) في مستودع المواد وقواعد المعطيات الهندسية المعتمدة."
                : "All material properties are saved atomically to the engineering material repository."}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
            >
              {t.btnCancel}
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-black shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={15} />
              )}
              <span>{t.btnSaveAll}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
