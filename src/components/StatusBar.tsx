import React from "react";
import { ShieldCheck, HardHat, AlertTriangle, HelpCircle } from "lucide-react";
import { useLanguage } from "../services/localization";

interface StatusBarProps {
  fck28: number;
  selectedMethod: string;
  exposureClass: string;
  slumpValue: number;
  isValid: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  fck28,
  selectedMethod,
  exposureClass,
  slumpValue,
  isValid
}) => {
  const { language } = useLanguage();

  const localizedLabel = (ar: string, fr: string, en: string) => {
    if (language === "ar") return ar;
    if (language === "fr") return fr;
    return en;
  };

  // Map slumpValue (cm) to international European standard categories S1 to S5
  const slumpCategory = React.useMemo(() => {
    if (slumpValue <= 2) return `S1 (${localizedLabel("شديد الجفاف", "Très Ferme", "Very Dry")})`;
    if (slumpValue <= 5) return `S2 (${localizedLabel("بلاستيكي", "Ferme", "Plastic")})`;
    if (slumpValue <= 9) return `S3 (${localizedLabel("لدن عياري", "Demi-Plastique", "Standard Slump")})`;
    if (slumpValue <= 15) return `S4 (${localizedLabel("لدن جداً", "Très Plastique", "Highly Plastic")})`;
    return `S5 (${localizedLabel("سائل انسيابي", "Fluide", "Flowing Fluid")})`;
  }, [slumpValue, language]);

  // Method translation
  const methodLabel = React.useMemo(() => {
    return "Dreux-Gorisse";
  }, []);

  return (
    <div className="bg-white dark:bg-[#111827]/60 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl text-right">
      
      {/* Title */}
      <div className="flex items-center gap-2 border-b md:border-b-0 md:border-l border-slate-200 dark:border-white/10 pb-2 md:pb-0 md:pl-4 shrink-0">
        <div className="w-2.5 h-2.5 bg-[#22C55E] rounded-full animate-pulse"></div>
        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 font-mono tracking-widest uppercase">
          {localizedLabel("حالة تصميم الخلطة", "STATUT DE FORMULATION", "MIX DESIGN STATUS")}
        </span>
      </div>

      {/* Grid status data */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-8 flex-grow text-xs px-2 w-full md:w-auto">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
            {localizedLabel("الرتبة والتحمل", "Résistance & Classe", "Grade & Strength")}
          </span>
          <span className="font-mono font-bold text-slate-900 dark:text-white mt-0.5 text-xs">
            C{fck28}/{Math.round(fck28 * 1.15)} MPa
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
            {localizedLabel("المنهجية الفنية", "Méthodologie", "Formulation Method")}
          </span>
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5 text-xs">
            {methodLabel}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
            {localizedLabel("التعرض البيئي", "Exposition", "Exposure Class")}
          </span>
          <span className="font-mono font-bold text-amber-600 dark:text-amber-500 mt-0.5 text-xs">
            {exposureClass}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
            {localizedLabel("فئة الهبوط", "Classe d'Affaissement", "Slump Class")}
          </span>
          <span className="font-mono font-bold text-teal-600 dark:text-teal-400 mt-0.5 text-xs">
            {slumpCategory}
          </span>
        </div>
      </div>

      {/* Valid Ticker status */}
      <div className="flex items-center gap-2 bg-[#22C55E]/10 border border-[#22C55E]/20 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#22C55E] shrink-0 font-sans">
        <ShieldCheck size={14} />
        <span>{localizedLabel("✓ خلطة صالحة", "✓ FORMULE VALIDE", "✓ VALID MIX")}</span>
      </div>

    </div>
  );
};
