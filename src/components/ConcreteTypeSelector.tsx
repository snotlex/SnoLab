import React from "react";
import { CONCRETE_TYPES_CATALOG, getConcreteTypeDetails } from "../concreteTypes";

type Language = "ar" | "fr" | "en";

export const ConcreteTypeSelector: React.FC<{
  language: Language;
  value: string;
  translate: (key: string) => string;
  onChange: (value: string) => void;
  isRtl: boolean;
}> = ({ language, value, translate, onChange, isRtl }) => {
  const meta = CONCRETE_TYPES_CATALOG.find((item) => item.code === value) || CONCRETE_TYPES_CATALOG.find((item) => item.code === "NSC");
  const details = meta ? getConcreteTypeDetails(meta.code, language) : null;
  const options = [
    ["NSC", translate("type_NSC")], ["RC", language === "ar" ? "الخرسانة المسلحة (RC)" : language === "fr" ? "Béton armé (RC)" : "Reinforced Concrete (RC)"], ["PUMPED", language === "ar" ? "الخرسانة القابلة للضخ (PUMPED)" : language === "fr" ? "Béton pompable (PUMPED)" : "Pumped Concrete (PUMPED)"], ["MASS", language === "ar" ? "الخرسانة الكتلية (MASS)" : language === "fr" ? "Béton de masse (MASS)" : "Mass Concrete (MASS)"], ["MARINE", language === "ar" ? "الخرسانة البحرية (MARINE)" : language === "fr" ? "Béton marin (MARINE)" : "Marine Concrete (MARINE)"], ["PRECAST", language === "ar" ? "الخرسانة مسبقة الصب (PRECAST)" : language === "fr" ? "Béton préfabriqué (PRECAST)" : "Precast Concrete (PRECAST)"], ["PRESTRESSED", language === "ar" ? "الخرسانة سابقة الإجهاد (PRESTRESSED)" : language === "fr" ? "Béton précontraint (PRESTRESSED)" : "Prestressed Concrete (PRESTRESSED)"], ["HSC", translate("type_HSC")], ["HPC", translate("type_HPC")], ["SCC", translate("type_SCC")], ["FRC", translate("type_FRC")], ["LWC", translate("type_LWC")], ["HWC", translate("type_HWC")], ["RCC", translate("type_RCC")], ["SHOTCRETE", translate("type_SHOTCRETE")], ["GPC", translate("type_GPC")], ["SHC", translate("type_SHC")], ["RAC", translate("type_RAC")], ["PERVIOUS", translate("type_PERVIOUS")], ["UHPC", translate("type_UHPC")], ["BFUP", translate("type_BFUP")],
  ];
  return <div id="step1-concrete-type" className={`space-y-1.5 rounded-xl border border-amber-500/10 bg-amber-500/5 p-3.5 font-sans ${isRtl ? "text-right" : "text-left"}`}>
    <label className="block text-xs font-black text-slate-850 dark:text-slate-200">{translate("concrete_type_label")}</label>
    <select value={value || "NSC"} onChange={(event) => onChange(event.target.value.toUpperCase())} className="w-full cursor-pointer rounded border border-amber-300/30 bg-white p-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-amber-700/40 dark:bg-slate-900/50 dark:text-white">{options.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select>
    {details && <div className="mt-3 space-y-2 rounded-lg border border-amber-500/10 bg-white p-3 text-right text-xs leading-relaxed shadow-sm dark:bg-slate-900/60"><div className="flex flex-row-reverse items-center gap-1.5 font-extrabold text-amber-600 dark:text-amber-400"><span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" /><span>{language === "ar" ? "خصائص ومميزات صنف الخرسانة المحدد:" : "Characteristics of selected concrete type:"}</span></div><div className="space-y-2"><div><strong className="mb-0.5 block text-[11px] font-black text-slate-800 dark:text-slate-200">{language === "ar" ? "✦ بماذا تتميز:" : "✦ Key Features:"}</strong><p className="text-[11px] text-slate-600 dark:text-slate-400">{details.description}</p></div>{details.usage && <div className="border-t border-slate-100 pt-2 dark:border-slate-800/80"><strong className="mb-0.5 block text-[11px] font-black text-slate-800 dark:text-slate-200">{language === "ar" ? "✦ أين تُستعمل:" : "✦ Standard Applications:"}</strong><p className="text-[11px] text-slate-600 dark:text-slate-400">{details.usage}</p></div>}{details.materials && <div className="border-t border-slate-100 pt-2 dark:border-slate-800/80"><strong className="mb-0.5 block text-[11px] font-black text-slate-800 dark:text-slate-200">{language === "ar" ? "✦ المواد المستخدمة:" : "✦ Materials Used:"}</strong><p className="text-[11px] text-slate-600 dark:text-slate-400">{details.materials}</p></div>}{details.mixing && <div className="border-t border-slate-100 pt-2 dark:border-slate-800/80"><strong className="mb-0.5 block text-[11px] font-black text-slate-800 dark:text-slate-200">{language === "ar" ? "✦ طريقة التحضير والخلط:" : "✦ Preparation & Mixing:"}</strong><p className="text-[11px] text-slate-600 dark:text-slate-400">{details.mixing}</p></div>}</div></div>}
  </div>;
};
