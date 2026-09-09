import React, { useState, useMemo } from "react";
import { 
  Sparkles, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Layers, 
  ArrowRight, 
  Sliders, 
  Edit2, 
  Save, 
  HelpCircle,
  Award,
  ChevronDown,
  ChevronUp,
  FlaskConical
} from "lucide-react";
import { MaterialCoreRecord, MaterialCategoryUnified } from "../../types/materialCoreTypes";
import { MixDesignInput, EngineeringMaterial } from "../../types";
import { MaterialService } from "../../services/MaterialService";
import { PropertyService } from "../../services/PropertyService";
import { RecommendationService, CategoryRecommendationReport } from "../../services/RecommendationService";
import { MixDesignContext } from "../../services/EligibilityService";

interface MixPreparationRecommendationsPanelProps {
  inputs: MixDesignInput;
  setInputs: (inputs: any) => void;
  materials: EngineeringMaterial[];
  onUpdateMaterials?: (updated: EngineeringMaterial[]) => void;
  language?: string;
  onOpenLabTest?: (material: EngineeringMaterial) => void;
}

export const MixPreparationRecommendationsPanel: React.FC<MixPreparationRecommendationsPanelProps> = ({
  inputs,
  setInputs,
  materials,
  onUpdateMaterials,
  language = "ar",
  onOpenLabTest
}) => {
  const isAr = language === "ar";

  // Selected category to inspect
  const [activeCategory, setActiveCategory] = useState<MaterialCategoryUnified>("CEMENT");
  const [expandedMaterialId, setExpandedMaterialId] = useState<string | null>(null);

  // Quick edit modal / inline completion state
  const [completingMaterial, setCompletingMaterial] = useState<MaterialCoreRecord | null>(null);
  const [missingPropsValues, setMissingPropsValues] = useState<Record<string, any>>({});
  const [decisionFeedback, setDecisionFeedback] = useState<string | null>(null);

  // Convert application materials into MaterialCoreRecord
  const coreMaterials = useMemo(() => {
    return materials.map(m => MaterialService.fromEngineeringMaterial(m));
  }, [materials]);

  // Mix context derived from inputs
  const mixContext: MixDesignContext = useMemo(() => {
    return {
      concreteType: inputs.concreteType || "NORMAL",
      mixDesignMethod: inputs.method || "dreux",
      targetStrength: inputs.targetStrength28d || 25,
      exposureClass: inputs.exposureClass || "XC1",
      workability: inputs.slumpClass || "S3",
      dMax: inputs.gravelDmax || 20
    };
  }, [inputs]);

  // Compute recommendation report for each key category
  const recommendationReports: Record<MaterialCategoryUnified, CategoryRecommendationReport> = useMemo(() => {
    const cats: MaterialCategoryUnified[] = ["CEMENT", "SAND", "GRAVEL", "ADMIXTURES", "WATER"];
    const res: any = {};
    for (const c of cats) {
      res[c] = RecommendationService.recommendForCategory(coreMaterials, c, mixContext);
    }
    return res;
  }, [coreMaterials, mixContext]);

  const currentReport = recommendationReports[activeCategory];

  // Action: Accept Recommendation
  const handleAcceptRecommendation = (material: MaterialCoreRecord) => {
    RecommendationService.recordDecision(material.id, "ACCEPTED", mixContext);

    // Apply material to mix input based on category
    if (material.category === "CEMENT") {
      const sg = MaterialService.getMaterialPropertyValue(material, "PROP-SPECIFIC-GRAVITY") || 3100;
      setInputs((prev: any) => ({
        ...prev,
        cementDensity: sg,
        cementClass: MaterialService.getMaterialPropertyValue(material, "PROP-CEM-CLASS") || prev.cementClass
      }));
    } else if (material.category === "SAND") {
      const sg = MaterialService.getMaterialPropertyValue(material, "PROP-SPECIFIC-GRAVITY") || 2650;
      const abs = MaterialService.getMaterialPropertyValue(material, "PROP-ABSORPTION") ?? 1.5;
      const fm = MaterialService.getMaterialPropertyValue(material, "PROP-FM") ?? 2.6;
      setInputs((prev: any) => ({
        ...prev,
        sandRelativeDensity: sg > 10 ? sg / 1000 : sg,
        sandAbsorption: abs,
        sandFinenessModulus: fm
      }));
    } else if (material.category === "GRAVEL") {
      const sg = MaterialService.getMaterialPropertyValue(material, "PROP-SPECIFIC-GRAVITY") || 2650;
      const abs = MaterialService.getMaterialPropertyValue(material, "PROP-ABSORPTION") ?? 1.0;
      const dmax = MaterialService.getMaterialPropertyValue(material, "PROP-DMAX") ?? 20;
      setInputs((prev: any) => ({
        ...prev,
        gravelRelativeDensity: sg > 10 ? sg / 1000 : sg,
        gravelAbsorption: abs,
        gravelDmax: dmax
      }));
    }

    setDecisionFeedback(
      isAr 
        ? `تم قبول وتطبيق المادة (${material.name}) بنجاح على معطيات الخلطة.` 
        : `Accepted and applied (${material.name}) to mix parameters.`
    );
    setTimeout(() => setDecisionFeedback(null), 4000);
  };

  // Action: Reject Recommendation
  const handleRejectRecommendation = (material: MaterialCoreRecord) => {
    RecommendationService.recordDecision(material.id, "REJECTED", mixContext);
    setDecisionFeedback(
      isAr 
        ? `تم رفض الاقتراح للمادة (${material.name}) مع الاحتفاظ بمعطيات المشروع كما هي.` 
        : `Rejected recommendation for (${material.name}). Project state preserved.`
    );
    setTimeout(() => setDecisionFeedback(null), 3000);
  };

  // Inline property completion save
  const handleSaveMissingProperties = () => {
    if (!completingMaterial) return;

    for (const [propId, val] of Object.entries(missingPropsValues)) {
      if (PropertyService.hasMeaningfulValue(val)) {
        MaterialService.setMaterialProperty(
          completingMaterial.id,
          propId,
          val,
          "USER_ENTERED"
        );
      }
    }

    // Refresh application materials
    if (onUpdateMaterials) {
      const all = MaterialService.getAllMaterials().map(m => MaterialService.toEngineeringMaterial(m));
      onUpdateMaterials(all);
    }

    setCompletingMaterial(null);
    setMissingPropsValues({});
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4" dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              {isAr ? "نظام الاقتراح الهندسي الذكي للمواد (Smart Recommendation)" : "Smart Engineering Material Recommendation"}
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                {isAr ? "اقتراح بدون إجبار" : "Advisory Engine"}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr 
                ? "تحليل هندسي قطعي يربط رتبة الخرسانة وفئة التعرض وطريقة التصميم بأفضل المواد المطابقة" 
                : "Deterministic engineering analysis matching concrete class, exposure & method to eligible materials"}
            </p>
          </div>
        </div>

        {/* Categories Tab Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
          {[
            { key: "CEMENT", label: isAr ? "الإسمنت" : "Cement" },
            { key: "SAND", label: isAr ? "الرمل" : "Sand" },
            { key: "GRAVEL", label: isAr ? "الحصى" : "Gravel" },
            { key: "ADMIXTURES", label: isAr ? "المضافات" : "Admixtures" }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key as any)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeCategory === tab.key 
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-bold" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Decision Feedback Toast */}
      {decisionFeedback && (
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-200 flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>{decisionFeedback}</span>
        </div>
      )}

      {/* Content */}
      {currentReport && (
        <div className="space-y-4">
          {/* 1. TOP RECOMMENDED MATERIAL CARD */}
          {currentReport.recommended ? (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 to-teal-50/40 dark:from-emerald-950/30 dark:to-slate-900 border border-emerald-200 dark:border-emerald-900/60 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-600 text-white flex items-center gap-1 shadow-sm">
                      <Award className="w-3 h-3" />
                      {isAr ? "الخيار الأنسب هندسياً (Recommended)" : "Top Recommended Choice"}
                    </span>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100/70 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200">
                      {isAr ? "درجة المطابقة:" : "Score:"} {currentReport.recommended.evaluation.score}%
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">
                    {currentReport.recommended.material.name}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <span>{isAr ? "المصدر:" : "Source:"} {currentReport.recommended.material.source}</span>
                    <span>•</span>
                    <span>{isAr ? "النوع:" : "Type:"} {currentReport.recommended.material.type}</span>
                  </p>

                  {/* Engineering Explanation */}
                  <div className="mt-2 p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-emerald-100 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                      {isAr ? "التعليل الهندسي للاقتراح:" : "Engineering Rationale:"}
                    </span>
                    <p className="leading-relaxed">
                      {currentReport.recommended.summaryReasonAr}
                    </p>
                  </div>
                </div>

                {/* Accept / Reject Buttons */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleAcceptRecommendation(currentReport.recommended!.material)}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 justify-center"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isAr ? "قبول الاقتراح" : "Accept Recommendation"}</span>
                  </button>

                  <button
                    onClick={() => handleRejectRecommendation(currentReport.recommended!.material)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all flex items-center gap-1.5 justify-center"
                  >
                    <X className="w-4 h-4" />
                    <span>{isAr ? "رفض" : "Reject"}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {isAr ? "لا توجد مادة مؤهلة بالكامل حالياً لهذا الصنف" : "No fully eligible material found for this category"}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {isAr 
                  ? "قد تحتاج المواد الموجودة إلى استكمال خصائصها الإلزامية لتصبح جاهزة للاستخدام في الحسابات." 
                  : "Existing materials might require completing missing mandatory properties before they can be used."}
              </p>
            </div>
          )}

          {/* 2. ALTERNATIVES LIST */}
          {currentReport.alternatives.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isAr ? "البدائل الصالحة المتاحة:" : "Available Eligible Alternatives:"}
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentReport.alternatives.map((alt) => (
                  <div key={alt.material.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{alt.material.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-mono">
                          {alt.evaluation.score}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                        {alt.summaryReasonAr}
                      </p>
                    </div>

                    <button
                      onClick={() => handleAcceptRecommendation(alt.material)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950 border border-slate-200 dark:border-slate-600 rounded-lg transition-colors"
                    >
                      {isAr ? "اختيار" : "Select"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. INELIGIBLE / INCOMPLETE MATERIALS & INLINE COMPLETION */}
          {currentReport.notEligible.length > 0 && (
            <div className="space-y-2 pt-2">
              <h5 className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {isAr ? "مواد غير مؤهلة أو تحتاج استكمال بيانات (Ineligible / Needs Data):" : "Ineligible / Missing Data Materials:"}
              </h5>
              <div className="space-y-2">
                {currentReport.notEligible.map((item) => (
                  <div key={item.material.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-700 dark:text-slate-300">{item.material.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                            {isAr ? "غير مؤهل" : "Ineligible"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {item.evaluation.reasonsAr.join(" • ") || (isAr ? "بيانات هندسية غير مكتملة" : "Incomplete data")}
                        </p>
                      </div>

                      {/* Complete Missing Properties Action Button */}
                      {item.evaluation.missingRequiredProperties.length > 0 && (
                        <button
                          onClick={() => {
                            setCompletingMaterial(item.material);
                            const initial: Record<string, any> = {};
                            item.evaluation.missingRequiredProperties.forEach(pId => {
                              initial[pId] = "";
                            });
                            setMissingPropsValues(initial);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 flex-shrink-0"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>{isAr ? "استكمال الخصائص الناقصة" : "Complete Missing Data"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inline Material Completion Modal / Dialog */}
      {completingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {isAr ? `استكمال خصائص المادة: ${completingMaterial.name}` : `Complete Properties for: ${completingMaterial.name}`}
              </h4>
              <button onClick={() => setCompletingMaterial(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {isAr 
                ? "أدخل القيم الناقصة مباشرة لتأهيل المادة للحسابات دون مغادرة صفحة تحضير الخلطة:" 
                : "Fill in missing values to qualify this material for calculations without leaving this page:"}
            </p>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {Object.keys(missingPropsValues).map((propId) => {
                const def = PropertyService.getDefinition(propId);
                return (
                  <div key={propId} className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>{def?.nameAr || propId}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{def?.canonicalUnit || "-"}</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder={`مثال: ${def?.validation?.warningMin ?? 0}`}
                      value={missingPropsValues[propId]}
                      onChange={(e) => {
                        setMissingPropsValues({
                          ...missingPropsValues,
                          [propId]: e.target.value
                        });
                      }}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setCompletingMaterial(null)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={handleSaveMissingProperties}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isAr ? "حفظ وتأهيل المادة" : "Save & Qualify"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
