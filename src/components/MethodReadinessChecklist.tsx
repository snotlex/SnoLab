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
  onOpenBatchModal?: () => void;
}

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
  setActiveSidebarTab,
  onOpenBatchModal
}) => {
  const definition = METHODS_REGISTRY[methodId];
  if (!definition) return null;

  const validation = validateMethodInputs(methodId, inputs);

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
  const hasMaterialPropertyGaps = onOpenBatchModal && validation.errors.some(e => FIELD_TO_MATERIAL_MAP[e.field]);

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
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {label}
                </span>
              </div>
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
          <ul className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px] list-disc list-inside p-0 m-0">
            {validation.errors.map((err, i) => (
              <li key={i} className={isRtl ? "text-right" : "text-left"}>
                <span className="leading-tight">{language === "fr" ? err.messageFr : language === "en" ? err.messageEn : err.messageAr}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-lg text-xs space-y-1.5">
          <span className={`text-amber-500 font-black flex items-center gap-1 ${isRtl ? "justify-end" : "justify-start"}`}>
            <span>{language === "ar" ? "تحذيرات هندسية مرجعية:" : language === "fr" ? "Avertissements techniques:" : "Technical Warnings:"}</span>
            <AlertTriangle size={13} />
          </span>
          <ul className="space-y-1 text-slate-600 dark:text-slate-450 text-[11px] list-disc list-inside p-0 m-0">
            {validation.warnings.map((warn, i) => (
              <li key={i} className={isRtl ? "text-right" : "text-left"}>
                <span className="leading-tight">{language === "fr" ? warn.messageFr : language === "en" ? warn.messageEn : warn.messageAr}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasMaterialPropertyGaps && (
        <div className="pt-1">
          <button
            type="button"
            onClick={onOpenBatchModal}
            className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
          >
            <span>⚡</span>
            <span>{language === "ar" ? "إكمال خصائص المواد الناقصة" : language === "fr" ? "Compléter les caractéristiques manquantes" : "Complete Missing Material Properties"}</span>
          </button>
        </div>
      )}

      <div className={getReadinessClass()}>
        {getReadinessMessage()}
      </div>
    </div>
  );
};
