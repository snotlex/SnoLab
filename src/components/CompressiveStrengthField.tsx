import React from "react";
import { InteractiveTooltip } from "./InteractiveTooltip";

type Language = "ar" | "fr" | "en";

export const CompressiveStrengthField: React.FC<{
  language: Language;
  value: number | undefined;
  concreteType?: string;
  disabled: boolean;
  translate: (key: string) => string;
  onChange: (value: number) => void;
}> = ({ language, value, concreteType, disabled, translate, onChange }) => {
  const fckVal = Number(value);
  const ranges: Record<string, [number, number, string, string]> = {
    NSC: [10, 35, "عادية المقاومة (NSC)", "Normal Strength Concrete (NSC)"],
    HSC: [40, 100, "عالية المقاومة (HSC)", "High Strength Concrete (HSC)"],
    HPC: [40, 100, "عالية الأداء (HPC)", "High Performance Concrete (HPC)"],
    SCC: [25, 60, "ذاتية الرص (SCC)", "Self-Consolidating Concrete (SCC)"],
    LWC: [15, 35, "خفيفة الوزن (LWC)", "Lightweight Concrete (LWC)"],
    HWC: [25, 60, "ثقيلة الوزن (HWC)", "Heavyweight Concrete (HWC)"],
    FRC: [20, 60, "المسلحة بالألياف (FRC)", "Fiber-Reinforced Concrete (FRC)"],
    UHPC: [100, 250, "فائقة الأداء (UHPC)", "Ultra-High Performance Concrete (UHPC)"],
    BFUP: [100, 250, "فائقة الأداء (BFUP)", "Ultra-High Performance Concrete (BFUP)"],
  };
  const [minRec, maxRec, arLabel, enLabel] = ranges[String(concreteType || "NSC").toUpperCase()] || ranges.NSC;
  const typeLabel = language === "ar" ? arLabel : enLabel;
  const isMissing = !Number.isFinite(fckVal) || fckVal <= 0;
  const isOutsideRecommendedRange = !isMissing && (fckVal < minRec || fckVal > maxRec);
  const messageId = "mix-fck28-message";
  const message = isMissing
    ? language === "ar" ? "المقاومة المطلوبة غير مدخلة؛ لا توجد قيمة افتراضية وسيبقى الحساب محظوراً." : language === "fr" ? "La résistance cible est manquante ; aucune valeur par défaut n'est utilisée et le calcul reste bloqué." : "Target strength is missing; no hidden default is used and calculation remains blocked."
    : language === "ar" ? `تنبيه: المقاومة الموصى بها لخرسانة ${typeLabel} هي بين ${minRec} و ${maxRec} MPa.` : `Note: Recommended strength range for ${typeLabel} is ${minRec} to ${maxRec} MPa.`;

  return (
    <div className={`space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-900/50 ${disabled ? "pointer-events-none select-none opacity-35 grayscale" : ""}`}>
      <div className="flex items-center justify-between text-xs"><InteractiveTooltip termKey="fck28" language={language}><label htmlFor="mix-fck28" className="cursor-help font-extrabold text-slate-700 dark:text-slate-200">{translate("fck28_label")}</label></InteractiveTooltip><span className="font-mono text-xs font-bold text-blue-500">{language === "ar" ? "ميجاباسكال (MPa)" : "MPa"}</span></div>
      <div className="relative flex items-center"><input id="mix-fck28" type="number" step="0.1" value={value ?? ""} disabled={disabled} aria-invalid={isMissing} aria-describedby={messageId} onChange={(event) => onChange(event.target.value === "" ? Number.NaN : parseFloat(event.target.value))} className={`w-full rounded-xl border ${isMissing ? "border-rose-500 ring-1 ring-rose-300" : "border-slate-200"} bg-white p-2 px-3 text-xs font-bold text-slate-800 outline-none transition-colors focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white ${language === "ar" ? "pl-14 text-right" : "pr-14 text-left"}`} placeholder="e.g. 30" /><span className={`absolute font-mono text-[10px] font-extrabold text-blue-500 ${language === "ar" ? "left-3" : "right-3"}`}>MPa</span></div>
      {isMissing ? <p id={messageId} role="alert" className="rounded-lg border border-rose-500/10 bg-rose-500/5 p-1.5 text-[9.5px] leading-snug text-rose-600 dark:text-rose-300">⚠ {message}</p> : isOutsideRecommendedRange ? <p id={messageId} role="status" className="rounded-lg border border-amber-500/10 bg-amber-500/5 p-1.5 text-right text-[9.5px] leading-snug text-amber-600 dark:text-amber-400">⚠ {message}</p> : <p id={messageId} className="text-right text-[9px] text-slate-500">✓ {language === "ar" ? `ضمن النطاق الموصى به لـ ${typeLabel} (${minRec} - ${maxRec} MPa).` : `Within recommended range for ${typeLabel} (${minRec} - ${maxRec} MPa).`}</p>}
    </div>
  );
};
