import React from "react";
import { InteractiveTooltip } from "./InteractiveTooltip";

type Language = "ar" | "fr" | "en";

export const BasicMixConditionsFields: React.FC<{
  language: Language;
  isRtl: boolean;
  translate: (key: string) => string;
  slump: number;
  dMax: number;
  controlClass: string;
  slumpDisabled: boolean;
  dMaxDisabled: boolean;
  labOverride?: { originalMaterialValue: number; reason: string };
  onSlumpChange: (value: number) => void;
  onDmaxChange: (value: number) => void;
  onControlClassChange: (value: string) => void;
  onOpenDmaxOverride: () => void;
  onRemoveDmaxOverride: () => void;
}> = ({ language, isRtl, translate, slump, dMax, controlClass, slumpDisabled, dMaxDisabled, labOverride, onSlumpChange, onDmaxChange, onControlClassChange, onOpenDmaxOverride, onRemoveDmaxOverride }) => {
  const card = (disabled: boolean) => `rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-850 dark:bg-slate-900/50 ${isRtl ? "text-right" : "text-left"} ${disabled ? "pointer-events-none select-none opacity-35 grayscale" : ""}`;
  const fieldClass = "w-full cursor-pointer rounded border border-slate-300 bg-white p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";

  return <>
    <div className={card(slumpDisabled)}>
      <InteractiveTooltip termKey="slump" language={language}>
        <label htmlFor="mix-slump" className="mb-1 block cursor-help text-xs font-bold text-slate-700 dark:text-slate-300">{translate("slump_label")}</label>
      </InteractiveTooltip>
      <select id="mix-slump" value={slump} disabled={slumpDisabled} aria-describedby="mix-slump-hint" aria-invalid={!Number.isFinite(slump) || slump <= 0} onChange={(event) => onSlumpChange(parseInt(event.target.value, 10))} className={fieldClass}>
        <option value="2">{language === "fr" ? "Terre Humide (0-20 mm - Béton démoulé immédiat)" : language === "en" ? "Very Dry (0-20 mm - precast/road paving)" : "جاف متماسك جداً (0-20 mm - دك ميكانيكي مسبق الصنع)"}</option>
        <option value="4">{language === "fr" ? "Ferme (30-50 mm - fondations et dalles)" : language === "en" ? "Semi-dry / Abram's (30-50 mm - bridges / base)" : "بلاستيكي معتدل (30-50 mm - لدن عادي صب الجسور)"}</option>
        <option value="8">{language === "fr" ? "Plastique (60-90 mm - structures courantes)" : language === "en" ? "Standard Plastic (60-90 mm - general columns / slabs)" : "لدن انسيابي عياري (60-90 mm - صب الهياكل العادية بالأعمدة)"}</option>
        <option value="12">{language === "fr" ? "Très Plastique (100-150 mm - bétonnage par pompe)" : language === "en" ? "Very Plastic / Pumpable (100-150 mm - pump concrete)" : "لدن جداً / للتوصيل بالمضخة (100-150 mm - صب خرسانة بمضخة)"}</option>
        <option value="17">{language === "fr" ? "Fluide (≥160 mm - béton autoplaçant)" : language === "en" ? "Fluid / Self-Leveling (≥160 mm - highly reinforced / no vibration)" : "سائل ذاتي التسوية (≥160 mm - صب مكثف حديدي بلا هزاز)"}</option>
      </select>
      <p id="mix-slump-hint" className="mt-1 text-[9px] text-slate-500 dark:text-slate-400">{language === "ar" ? "اختر فئة الهطول المستهدفة بالسنتمتر." : language === "fr" ? "Sélectionnez la classe d'affaissement cible." : "Select the target slump class."}</p>
    </div>

    <div className={card(dMaxDisabled)}>
      <div className="mb-1 flex items-center justify-between">
        <InteractiveTooltip termKey="dmax" language={language}>
          <label htmlFor="mix-dmax" className="block cursor-help text-xs font-bold text-slate-700 dark:text-slate-300">{translate("dmax_dropdown_label")}</label>
        </InteractiveTooltip>
        {labOverride ? <button type="button" onClick={onRemoveDmaxOverride} className="text-[10px] text-red-500 hover:underline">{language === "ar" ? "إلغاء التجاوز" : "Cancel Override"}</button> : <button type="button" onClick={onOpenDmaxOverride} className="text-[10px] text-amber-600 hover:underline">{language === "ar" ? "تجاوز مخبري" : "Lab Override"}</button>}
      </div>
      <select id="mix-dmax" value={dMax} disabled={dMaxDisabled} aria-describedby={labOverride ? "mix-dmax-hint mix-dmax-override" : "mix-dmax-hint"} aria-invalid={!Number.isFinite(dMax) || dMax <= 0} onChange={(event) => onDmaxChange(parseFloat(event.target.value))} className={`${fieldClass} ${!labOverride ? "bg-slate-100 opacity-75 dark:bg-slate-800" : ""}`}>
        <option value="8">{translate("dmax_8")}</option><option value="12.5">12.5 mm</option><option value="16">16 mm</option><option value="20">{translate("dmax_20")}</option><option value="25">25 mm</option><option value="31.5">31.5 mm</option><option value="40">{translate("dmax_40")}</option>
      </select>
      <p id="mix-dmax-hint" className="mt-1 text-[9px] text-slate-500 dark:text-slate-400">{language === "ar" ? "حدد أكبر مقاس اسمي للركام بالملليمتر." : language === "fr" ? "Sélectionnez la dimension nominale maximale des granulats." : "Select the nominal maximum aggregate size."}</p>
      {labOverride && <div id="mix-dmax-override" className="mt-1 rounded border border-amber-500/10 bg-amber-500/5 p-1 text-[9px] leading-normal text-amber-600" role="status">⚠️ {language === "ar" ? `معدل مخبرياً: الأصل (${labOverride.originalMaterialValue} mm). السبب: ${labOverride.reason}` : `Overridden: Original (${labOverride.originalMaterialValue} mm). Reason: ${labOverride.reason}`}</div>}
    </div>

    <div className={card(false)}>
      <label htmlFor="mix-control-class" className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">{translate("control_class_label")}</label>
      <select id="mix-control-class" value={controlClass} onChange={(event) => onControlClassChange(event.target.value)} className="w-full rounded border border-slate-300 bg-white p-2.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="high">{translate("qc_high")}</option><option value="normal">{translate("qc_normal")}</option><option value="low">{translate("qc_low")}</option></select>
    </div>
  </>;
};
