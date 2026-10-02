import React from "react";

type Language = "ar" | "fr" | "en";
type DesignerMode = "normal" | "expert";

export const CalculatorModeSelector: React.FC<{
  language: Language;
  mode: DesignerMode;
  onModeChange: (mode: DesignerMode) => void;
  translate: (key: string) => string;
}> = ({ language, mode, onModeChange, translate }) => (
  <section className="flex flex-col items-center justify-between gap-4 rounded-xl border border-blue-500/20 bg-gradient-to-l from-blue-500/10 to-transparent p-4 sm:flex-row" aria-label={language === "ar" ? "وضع تشغيل الحساب" : language === "fr" ? "Mode de calcul" : "Calculation mode"}>
    <div className="text-right"><span className="block font-mono text-[10px] font-black uppercase text-blue-500">SYSTEM CONFIGURATION MODE</span><h4 className="mt-0.5 text-xs font-black text-slate-800 dark:text-white">{translate("calculator.systemModeTitle")}</h4><p className="mt-1 text-[10px] text-slate-500">{translate("calculator.systemModeDescription")}</p></div>
    <div className="flex gap-1.5 rounded-lg border border-slate-200 bg-white p-1 shadow-inner dark:border-slate-800 dark:bg-slate-900"><button type="button" onClick={() => onModeChange("normal")} className={`rounded-md px-4 py-1.5 text-xs font-black transition-all ${mode === "normal" ? "bg-blue-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}>{translate("calculator.autoMode")}</button><button type="button" onClick={() => onModeChange("expert")} className={`rounded-md px-4 py-1.5 text-xs font-black transition-all ${mode === "expert" ? "bg-amber-500 text-slate-950 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}>{translate("calculator.manualExpertMode")}</button></div>
  </section>
);
