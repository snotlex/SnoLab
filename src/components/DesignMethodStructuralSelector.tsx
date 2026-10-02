import React from "react";
import { STRUCTURAL_ELEMENTS, getStructuralElementById } from "../data/structuralElements";
import { MethodReadinessChecklist } from "./MethodReadinessChecklist";

type Language = "ar" | "fr" | "en";

export const DesignMethodStructuralSelector: React.FC<{
  language: Language;
  isRtl: boolean;
  translate: (key: string) => string;
  structuralElement: string;
  onStructuralElementChange: (elementId: string) => void;
  normalizedInputs: any;
  materialsDatabase: any[];
  onNavigateToTab: (tab: string) => void;
  onOpenBatchModal: () => void;
}> = ({ language, isRtl, translate, structuralElement, onStructuralElementChange, normalizedInputs, materialsDatabase, onNavigateToTab, onOpenBatchModal }) => {
  const current = getStructuralElementById(structuralElement || "column");
  return <div className={`space-y-2 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 font-sans ${isRtl ? "text-right" : "text-left"}`}>
    <label className="block border-b border-indigo-500/10 pb-1.5 text-xs font-black text-slate-855 dark:text-slate-200">{translate("selected_method_label")}</label>
    <p className="text-[11px] leading-relaxed text-slate-650 dark:text-slate-350">{translate("selected_method_desc")}</p>
    <div className={`mt-3 space-y-2 rounded-xl border border-sky-500/15 bg-sky-500/5 p-3.5 font-sans ${isRtl ? "text-right" : "text-left"}`}>
      <div className="flex items-center justify-between"><label className="block text-xs font-black text-slate-800 dark:text-slate-200">{language === "ar" ? "العنصر الإنشائي المراد صبه:" : language === "fr" ? "Élément Structural :" : "Target Structural Element:"}</label><span className="rounded bg-sky-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-600 dark:text-sky-400">{STRUCTURAL_ELEMENTS.length} {language === "ar" ? "عناصر معتمدة" : "Elements"}</span></div>
      <select value={structuralElement || "column"} onChange={(event) => onStructuralElementChange(event.target.value)} className="w-full cursor-pointer rounded border border-sky-300/30 bg-white p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-sky-700/40 dark:bg-slate-900/50 dark:text-white">{STRUCTURAL_ELEMENTS.map((element) => <option key={element.id} value={element.id}>{language === "ar" ? element.nameAr : language === "fr" ? element.nameFr : element.nameEn}</option>)}</select>
      {current && <div className="space-y-2 rounded-lg border border-sky-500/20 bg-white p-3 text-right text-xs dark:bg-slate-900/70"><div className="flex items-center justify-between text-[11px] font-bold text-sky-700 dark:text-sky-300"><span>{language === "ar" ? current.nameAr : current.nameEn}</span><span className="rounded bg-sky-500/10 px-2 py-0.5 font-mono text-[10px] text-sky-600">{language === "ar" ? "المواصفات الموصى بها" : "Recommended Specs"}</span></div><p className="text-[10.5px] leading-snug text-slate-600 dark:text-slate-400">{current.descriptionAr}</p><div className="grid grid-cols-3 gap-1.5 border-t border-slate-100 pt-1 text-center font-mono text-[10px] dark:border-slate-800"><div className="rounded bg-sky-50 p-1.5 dark:bg-slate-800"><span className="block font-sans text-[9px] text-slate-400">{language === "ar" ? "الهبوط Slump" : "Slump"}</span><span className="font-bold text-sky-600">{current.recommendedSlump.min}-{current.recommendedSlump.max} cm</span></div><div className="rounded bg-sky-50 p-1.5 dark:bg-slate-800"><span className="block font-sans text-[9px] text-slate-400">{language === "ar" ? "الركام Dmax" : "Dmax"}</span><span className="font-bold text-sky-600">{current.recommendedDmax} mm</span></div><div className="rounded bg-sky-50 p-1.5 dark:bg-slate-800"><span className="block font-sans text-[9px] text-slate-400">{language === "ar" ? "أدنى إسمنت" : "Min Cement"}</span><span className="font-bold text-sky-600">{current.minCementKgM3} kg/m³</span></div></div><div className="rounded border border-amber-500/20 bg-amber-500/10 p-2 text-[10px] text-amber-700 dark:bg-amber-500/5 dark:text-amber-400"><strong>💡 {language === "ar" ? "توصية هندسية:" : "Advice:"}</strong> {current.engineeringAdviceAr}</div></div>}
    </div>
    <div className="mt-2.5"><MethodReadinessChecklist methodId="dreux-gorisse" inputs={normalizedInputs} language={language} materialsDatabase={materialsDatabase} setActiveSidebarTab={onNavigateToTab} onOpenBatchModal={onOpenBatchModal} /></div>
  </div>;
};
