import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { MixDesignMethodId } from "../mix-design-methods/types";
import { METHODS_REGISTRY } from "../mix-design-methods/methodRegistry";
import { validateMethodInputs } from "../mix-design-methods/validateMethodInputs";
import { EngineeringMaterial } from "../types";

interface MethodReadinessChecklistProps {
  methodId: MixDesignMethodId;
  inputs: Record<string, any>;
  language: "ar" | "fr" | "en";
  materialsDatabase?: EngineeringMaterial[];
  setActiveSidebarTab?: (tab: string) => void;
}

const FIELD_TO_STEP_MAP: Record<string, { stepId: string; labelAr: string; labelFr: string; labelEn: string }> = {
  fck28: {
    stepId: "step1-project-requirements",
    labelAr: "تحديد المقاومة المطلوبة (fck28)",
    labelFr: "Saisir la Résistance (fck28)",
    labelEn: "Enter Strength (fck28)"
  },
  slump: {
    stepId: "step1-project-requirements",
    labelAr: "تحديد قوام الهبوط المطلوبة",
    labelFr: "Définir l'Affaissement",
    labelEn: "Set Slump Value"
  },
  cementClassStrength: {
    stepId: "step3-materials-selection",
    labelAr: "إكمال رتبة مقاومة الإسمنت",
    labelFr: "Préciser la classe du ciment",
    labelEn: "Set Cement Strength Class"
  },
  aggregateType: {
    stepId: "step3-materials-selection",
    labelAr: "تحديد تضاريس الركام",
    labelFr: "Choisir le type d'agrégat",
    labelEn: "Choose Aggregate Shape Type"
  },
  selectedCementId: {
    stepId: "step3-materials-selection",
    labelAr: "تحديد مادة الإسمنت",
    labelFr: "Choisir le Ciment",
    labelEn: "Select Cement Material"
  },
  selectedSandId: {
    stepId: "step3-materials-selection",
    labelAr: "تحديد مادة الرمل",
    labelFr: "Choisir le Sable",
    labelEn: "Select Sand Material"
  },
  selectedGravelId: {
    stepId: "step3-materials-selection",
    labelAr: "تحديد مادة الحصى",
    labelFr: "Choisir le Gravier",
    labelEn: "Select Gravel Material"
  },
  selectedWaterId: {
    stepId: "step3-materials-selection",
    labelAr: "تحديد مادة الماء",
    labelFr: "Choisir l'Eau",
    labelEn: "Select Water Source"
  },
  moistureSand: {
    stepId: "step5-field-conditions",
    labelAr: "ضبط رطوبة الرمل",
    labelFr: "Régler l'humidité du sable",
    labelEn: "Adjust Sand Moisture"
  },
  moistureGravel: {
    stepId: "step5-field-conditions",
    labelAr: "ضبط رطوبة الحصى",
    labelFr: "Régler l'humidité du gravier",
    labelEn: "Adjust Gravel Moisture"
  },
  sandRelativeDensity: {
    stepId: "step4-material-properties",
    labelAr: "ضبط الكثافة النوعية للرمل",
    labelFr: "Régler la densité du sable",
    labelEn: "Adjust Sand Density"
  },
  gravelRelativeDensity: {
    stepId: "step4-material-properties",
    labelAr: "ضبط الكثافة النوعية للحصى",
    labelFr: "Régler la densité du gravier",
    labelEn: "Adjust Gravel Density"
  },
  internalWcOverride: {
    stepId: "step6-design-coefficients",
    labelAr: "ضبط نسبة الماء/الإسمنت",
    labelFr: "Ajuster le rapport E/C",
    labelEn: "Adjust W/C Ratio"
  },
  packingFactor: {
    stepId: "step6-design-coefficients",
    labelAr: "ضبط معامل الرص / التعبئة",
    labelFr: "Ajuster le coefficient de compacité",
    labelEn: "Adjust Packing Index"
  },
  airContent: {
    stepId: "step6-design-coefficients",
    labelAr: "تحديد نسبة الهواء المحبوس",
    labelFr: "Saisir le taux d'air",
    labelEn: "Set Air Content"
  },
  admixtureDosage: {
    stepId: "step7-chemical-additions",
    labelAr: "تحديد جرعة المضاف الكيميائي",
    labelFr: "Saisir le dosage adjuvant",
    labelEn: "Set Admixture Dosage"
  }
};

const FIELD_TO_MATERIAL_MAP: Record<string, {
  materialIdKey: string;
  propertyKey: string;
  labelAr: string;
  labelFr: string;
  labelEn: string;
}> = {
  sandRelativeDensity: {
    materialIdKey: "selectedSandId",
    propertyKey: "specificGravity",
    labelAr: "الكثافة النوعية للرمل",
    labelFr: "Densité relative du sable",
    labelEn: "Sand relative density"
  },
  gravelRelativeDensity: {
    materialIdKey: "selectedGravelId",
    propertyKey: "specificGravity",
    labelAr: "الكثافة النوعية للحصى",
    labelFr: "Densité relative du gravier",
    labelEn: "Gravel relative density"
  },
  moistureSand: {
    materialIdKey: "selectedSandId",
    propertyKey: "moisture",
    labelAr: "نسبة رطوبة الرمل",
    labelFr: "Humidité du sable",
    labelEn: "Sand moisture content"
  },
  moistureGravel: {
    materialIdKey: "selectedGravelId",
    propertyKey: "moisture",
    labelAr: "نسبة رطوبة الحصى",
    labelFr: "Humidité du gravier",
    labelEn: "Gravel moisture content"
  },
  dMax: {
    materialIdKey: "selectedGravelId",
    propertyKey: "dMax",
    labelAr: "القطر الأقصى للحصى (Dmax)",
    labelFr: "Dmax du gravier",
    labelEn: "Gravel maximum size (Dmax)"
  },
  cementClassStrength: {
    materialIdKey: "selectedCementId",
    propertyKey: "strengthClass",
    labelAr: "رتبة مقاومة الإسمنت",
    labelFr: "Classe de résistance du ciment",
    labelEn: "Cement strength class"
  }
};

export const MethodReadinessChecklist: React.FC<MethodReadinessChecklistProps> = ({
  methodId,
  inputs,
  language,
  materialsDatabase = [],
  setActiveSidebarTab
}) => {
  const definition = METHODS_REGISTRY[methodId];
  if (!definition) return null;

  const validation = validateMethodInputs(methodId, inputs);

  const handleScrollToElement = (stepId: string, fieldKey?: string) => {
    const element = document.getElementById(stepId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      
      // Add a pulsing visual ring
      element.classList.add("ring-4", "ring-indigo-500", "dark:ring-indigo-400", "scale-[1.01]", "transition-all", "duration-500");
      setTimeout(() => {
        element.classList.remove("ring-4", "ring-indigo-500", "dark:ring-indigo-400", "scale-[1.01]");
      }, 2500);

      // Try focusing an input inside the step container
      if (fieldKey) {
        setTimeout(() => {
          const inputsList = element.querySelectorAll("input, select, textarea");
          for (let i = 0; i < inputsList.length; i++) {
            const item = inputsList[i] as HTMLElement;
            if (item.getAttribute("name") === fieldKey || item.id?.includes(fieldKey) || item.outerHTML.toLowerCase().includes(fieldKey.toLowerCase())) {
              item.focus();
              item.classList.add("ring-2", "ring-rose-500", "dark:ring-rose-400");
              setTimeout(() => {
                item.classList.remove("ring-2", "ring-rose-500", "dark:ring-rose-400");
              }, 2000);
              break;
            }
          }
        }, 500);
      }
    }
  };

  const handleCorrectMaterialProperty = (fieldKey: string): boolean => {
    const mapping = FIELD_TO_MATERIAL_MAP[fieldKey];
    if (!mapping) return false;

    const materialId = inputs[mapping.materialIdKey];
    if (!materialId) {
      const msg = language === "ar" 
        ? "⚠️ لم يتم تحديد مادة لهذه الخاصية بعد. يرجى اختيار المادة أولاً." 
        : language === "fr" 
        ? "⚠️ Aucun matériau sélectionné. Veuillez d'abord choisir le matériau." 
        : "⚠️ No material selected. Please select the material first.";
      alert(msg);
      return true;
    }

    const material = materialsDatabase.find(m => m.id === materialId);
    if (!material) {
      const msg = language === "ar" 
        ? `⚠️ المادة المحددة غير موجودة في المستودع.` 
        : language === "fr" 
        ? `⚠️ Le matériau sélectionné n'existe pas dans la base de données.` 
        : `⚠️ Selected material not found in the repository.`;
      alert(msg);
      return true;
    }

    // Check if property exists in material settings
    let propertyExists = false;
    if (mapping.propertyKey === "specificGravity") {
      if (material.specificGravity !== undefined && material.specificGravity !== null) propertyExists = true;
      else if (material.density !== undefined && material.density !== null) propertyExists = true;
      else if (material.SpecificGravity !== undefined && material.SpecificGravity !== null) propertyExists = true;
      else if (material.Density !== undefined && material.Density !== null) propertyExists = true;
    } else if (mapping.propertyKey === "moisture") {
      if (material.moisture !== undefined && material.moisture !== null) propertyExists = true;
      else if (material.MoistureContent !== undefined && material.MoistureContent !== null) propertyExists = true;
      else if (material.moistureContent !== undefined && material.moistureContent !== null) propertyExists = true;
    } else if (mapping.propertyKey === "dMax") {
      if (material.dMax !== undefined && material.dMax !== null) propertyExists = true;
      else if (material.DMax !== undefined && material.DMax !== null) propertyExists = true;
    } else {
      if (material[mapping.propertyKey as keyof EngineeringMaterial] !== undefined && material[mapping.propertyKey as keyof EngineeringMaterial] !== null) {
        propertyExists = true;
      }
    }

    if (!propertyExists) {
      const msg = language === "ar" 
        ? "⚠️ عذراً، هذه الخصائص المطلوبة غير موجودة في إعدادات المادة." 
        : language === "fr" 
        ? "⚠️ Désolé, ces propriétés requises n'existent pas dans les paramètres du matériau." 
        : "⚠️ Sorry, these required properties do not exist in the material's settings.";
      alert(msg);
      return true;
    }

    if (setActiveSidebarTab) {
      setActiveSidebarTab("materials_library");
      setTimeout(() => {
        const triggerEdit = new CustomEvent("trigger-edit-material", { detail: { materialId: material.id } });
        window.dispatchEvent(triggerEdit);
      }, 150);
    } else {
      const triggerEdit = new CustomEvent("trigger-edit-material", { detail: { materialId: material.id } });
      window.dispatchEvent(triggerEdit);
    }
    return true;
  };

  const handleActionClick = (fieldKey: string, stepId: string) => {
    const handled = handleCorrectMaterialProperty(fieldKey);
    if (!handled) {
      handleScrollToElement(stepId, fieldKey);
    }
  };

  const getReadinessMessage = () => {
    if (!validation.isValid || validation.errors.length > 0) {
      if (language === "ar") return "❌ نقص مدخلات التصميم الإلزامية المطلوبة (Missing inputs)";
      if (language === "fr") return "❌ Intrants obligatoires de base manquants";
      return "❌ Missing required inputs";
    }

    const implStatus = definition.implementationStatus || "complete";

    if (implStatus === "complete") {
      if (language === "ar") return "✓ جاهز لحساب تصميم الخلطة الكاملة المستقلة (Ready to calculate complete mix)";
      if (language === "fr") return "✓ Prêt à calculer la formulation complète et autonome";
      return "✓ Ready to calculate complete mix";
    }

    if (implStatus === "partial-adapter") {
      if (language === "ar") return "⚡ جاهز لحساب التقدير الرياضي المشترك مبني على محول لـ Dreux (Ready to calculate adapter-based estimate)";
      if (language === "fr") return "⚡ Prêt à calculer l'estimation via l'adaptateur Dreux-Gorisse";
      return "⚡ Ready to calculate adapter-based estimate";
    }

    if (implStatus === "supporting-only") {
      if (language === "ar") return "📊 جاهز لتحليل المنحنيات والنماذج المساعدة فقط (Ready for supporting analysis only)";
      if (language === "fr") return "📊 Prêt pour l'analyse d'appui uniquement";
      return "📊 Ready for supporting analysis only";
    }

    if (implStatus === "needs-engineering-review") {
      if (language === "ar") return "⚠️ يتطلب مراجعة هندسية دقيقة ومعايرة معملية (Needs engineering review)";
      if (language === "fr") return "⚠️ Nécessite une révision technique et un étalonnage";
      return "⚠️ Needs engineering review";
    }

    return "Ready";
  };

  const getReadinessClass = () => {
    if (!validation.isValid || validation.errors.length > 0) {
      return "p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-bold rounded-lg text-xs text-center";
    }
    const implStatus = definition.implementationStatus || "complete";
    if (implStatus === "complete") {
      return "p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg text-xs text-center";
    }
    if (implStatus === "partial-adapter") {
      return "p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold rounded-lg text-xs text-center";
    }
    return "p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-450 font-bold rounded-lg text-xs text-center";
  };

  const isRtl = language === "ar";

  return (
    <div 
      className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 text-right font-sans"
      id="method-readiness-checklist"
    >
      <div className={`flex justify-between items-center border-b border-slate-250 dark:border-slate-800 pb-2 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
        <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2.5 py-0.5 rounded font-black">
          STATUS CHECK
        </span>
        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
          {language === "ar" ? "فحص جاهزية مدخلات التصميم" : language === "fr" ? "Vérification de la préparation des intrants" : "Design Inputs Readiness Check"}
        </h4>
      </div>

      <div className="space-y-2">
        {definition.requiredInputs.map(field => {
          const value = inputs[field.key];
          const hasValue = value !== undefined && value !== null && value !== "";
          const label = language === "fr" ? field.labelFr : language === "en" ? field.labelEn : field.labelAr;
          const mapped = FIELD_TO_STEP_MAP[field.key];
          
          return (
            <div key={field.key} className={`flex flex-col space-y-1 py-1 border-b border-slate-100 dark:border-slate-800/40 last:border-0 ${isRtl ? "text-right" : "text-left"}`}>
              <div className={`flex justify-between items-center text-xs ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                <span className="font-mono text-[11px] text-slate-400">
                  {hasValue ? (
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <span>{value} {field.unit || ""}</span>
                      <CheckCircle2 size={13} />
                    </span>
                  ) : (
                    <span className="text-rose-500 font-bold flex items-center gap-1">
                      <span>{language === "ar" ? "مطلوب" : language === "fr" ? "Requis" : "Required"}</span>
                      <AlertCircle size={13} />
                    </span>
                  )}
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  {label}
                </span>
              </div>
              {!hasValue && mapped && (
                <div className={`flex ${isRtl ? "justify-start" : "justify-end"} pt-1`}>
                  <button
                    type="button"
                    onClick={() => handleScrollToElement(mapped.stepId, field.key)}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 bg-indigo-500/5 hover:bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/10 cursor-pointer"
                  >
                    ⚡ {language === "ar" ? "إكمال المتغير" : language === "fr" ? "Remplir le champ" : "Complete Criteria"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {validation.errors.length > 0 && (
        <div className="p-2.5 bg-rose-500/5 border border-rose-500/10 rounded-lg text-xs space-y-1.5">
          <span className={`text-rose-500 font-black flex items-center gap-1 ${isRtl ? "justify-end" : "justify-start"}`}>
            <span>{language === "ar" ? "أخطاء يجب تصحيحها لصب آمن:" : language === "fr" ? "Erreurs à corriger:" : "Blocking Errors to Fix:"}</span>
            <AlertCircle size={13} />
          </span>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400 text-[11px] list-none p-0 m-0">
            {validation.errors.map((err, i) => {
              const mapped = FIELD_TO_STEP_MAP[err.field];
              return (
                <li key={i} className={`flex flex-col gap-1 items-start ${isRtl ? "text-right" : "text-left"}`}>
                  <span className="leading-tight">⚠️ {language === "fr" ? err.messageFr : language === "en" ? err.messageEn : err.messageAr}</span>
                  {mapped && (
                    <button
                      type="button"
                      onClick={() => handleActionClick(err.field, mapped.stepId)}
                      className="text-[9.5px] font-extrabold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/15 px-2 py-0.5 rounded border border-rose-500/10 cursor-pointer"
                    >
                      ✏️ {language === "ar" ? mapped.labelAr : language === "fr" ? mapped.labelFr : mapped.labelEn}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-lg text-xs space-y-1.5">
          <span className={`text-amber-500 font-black flex items-center gap-1 ${isRtl ? "justify-end" : "justify-start"}`}>
            <span>{language === "ar" ? "تحذيرات هندسية مرجعية:" : language === "fr" ? "Avertissements techniques:" : "Technical Warnings:"}</span>
            <AlertTriangle size={13} />
          </span>
          <ul className="space-y-2 text-slate-600 dark:text-slate-450 text-[11px] list-none p-0 m-0">
            {validation.warnings.map((warn, i) => {
              const mapped = FIELD_TO_STEP_MAP[warn.field];
              return (
                <li key={i} className={`flex flex-col gap-1 items-start ${isRtl ? "text-right" : "text-left"}`}>
                  <span className="leading-tight">⚠️ {language === "fr" ? warn.messageFr : language === "en" ? warn.messageEn : warn.messageAr}</span>
                  {mapped && (
                    <button
                      type="button"
                      onClick={() => handleActionClick(warn.field, mapped.stepId)}
                      className="text-[9.5px] font-extrabold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/10 cursor-pointer"
                    >
                      ⚙️ {language === "ar" ? mapped.labelAr : language === "fr" ? mapped.labelFr : mapped.labelEn}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className={getReadinessClass()}>
        {getReadinessMessage()}
      </div>
    </div>
  );
};
