import React from "react";
import { Sparkles, Layers, ShieldCheck, HelpCircle } from "lucide-react";
import { useLanguage } from "../services/localization";

interface WelcomeBannerProps {
  fck28: number;
  onStartDesign: () => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ fck28, onStartDesign }) => {
  const { language, isRtl } = useLanguage();

  const localizedLabel = (ar: string, fr: string, en: string) => {
    if (language === "ar") return ar;
    if (language === "fr") return fr;
    return en;
  };

  return (
    <div className="bg-white dark:bg-[#111827]/30 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-xl">
      {/* Dynamic matrix grid overlay for blueprint feel */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
        
        {/* Texts Info (7 cols) */}
        <div className={`md:col-span-7 space-y-4 ${isRtl ? "text-right" : "text-left"}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-550 dark:text-blue-400 font-extrabold">
            <Sparkles size={13} className="text-blue-500" />
            <span>{localizedLabel("منصة الهندسة الحركية للمواد", "Plateforme d'Ingénierie des Matériaux", "Kinetic Materials Engineering Platform")}</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight font-sans">
            {localizedLabel("مرحباً بك في ", "Bienvenue sur ", "Welcome to ")}
            <span className="text-[#2563EB]">MixWizard</span> 
            {localizedLabel(" للجرعات الخرسانية", " Formulation du Béton", " Concrete Formulator")}
          </h2>

          <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed max-w-xl font-sans">
            {localizedLabel(
              "منهاج تصميم علمي ريادي يهدف لتحقيق الكثافة التراصية العظمى (Aggregate Packing Density) لتقليل حجم الفراغات داخل خرسانة الموقع، ومن ثم توفير نسبة الإسمنت لإنتاج خرسانة اقتصادية وبالمواصفات المطلوبة.",
              "Une méthode scientifique d'avant-garde visant à maximiser la compacité granulaire (Aggregate Packing Density) pour minimiser les vides intergranulaires, économisant ainsi le ciment pour un béton abordable et performant.",
              "A pioneering scientific formulation framework designed to maximize Aggregate Packing Density to minimize void volume, saving cement to produce cost-effective concrete meeting design criteria."
            )}
          </p>

          <div className={`flex flex-wrap gap-3 pt-1 ${isRtl ? "justify-start" : "justify-start"}`}>
            <button
              onClick={onStartDesign}
              className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-600 active:translate-y-px text-white font-extrabold text-xs rounded-xl transition-all shadow-lg hover:shadow-blue-500/20 cursor-pointer"
            >
              {localizedLabel("افتح لوحة الحاسبة التفاعلية", "Ouvrir le Calculateur Interactif", "Open Interactive Calculator")}
            </button>
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5">
              <span>{localizedLabel("الفئة الحالية للاختبار:", "Classe d'essai actuelle :", "Active Strength Class:")}</span>
              <strong className="text-[#22C55E] font-mono text-sm leading-none">C{fck28} MPa</strong>
            </div>
          </div>
        </div>

        {/* 3D Aggregate packing blueprint (5 cols) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-white/5 relative shadow-inner overflow-hidden">
          
          <span className={`text-[9px] font-mono text-blue-600 dark:text-blue-500 block font-black absolute top-3 ${isRtl ? "right-3" : "left-3"}`}>
            BLUEPRINT: PARTICLE PACKING
          </span>

          {/* Interactive CSS and SVG-built 3D granular column representation */}
          <div className="w-full h-32 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 160 120" className="w-full max-w-[180px] h-full drop-shadow-lg">
              {/* Grading background tube */}
              <rect x="50" y="10" width="60" height="100" rx="4" className="fill-slate-200/50 dark:fill-slate-800/40 stroke-slate-300 dark:stroke-white/10" strokeWidth="1.5" />
              
              {/* Coarse aggregates - large particles (3D spheres with gradients) */}
              <defs>
                <radialGradient id="aggregate-grad-lg" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#475569" />
                  <stop offset="70%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#1e293b" />
                </radialGradient>
                <radialGradient id="aggregate-grad-md" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="75%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#92400e" />
                </radialGradient>
                <radialGradient id="cement-grad" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="85%" stopColor="#64748b" />
                  <stop offset="100%" stopColor="#475569" />
                </radialGradient>
              </defs>

              {/* Large stone spheres */}
              <circle cx="68" cy="85" r="10" fill="url(#aggregate-grad-lg)" />
              <circle cx="92" cy="88" r="9" fill="url(#aggregate-grad-lg)" />
              <circle cx="78" cy="65" r="11" fill="url(#aggregate-grad-lg)" />
              <circle cx="88" cy="42" r="9.5" fill="url(#aggregate-grad-lg)" />
              <circle cx="65" cy="45" r="9" fill="url(#aggregate-grad-lg)" />
              <circle cx="78" cy="28" r="10.5" fill="url(#aggregate-grad-lg)" />

              {/* Sand intermediate aggregates filling spaces */}
              <circle cx="60" cy="74" r="5" fill="url(#aggregate-grad-md)" />
              <circle cx="98" cy="74" r="4.5" fill="url(#aggregate-grad-md)" />
              <circle cx="62" cy="98" r="4" fill="url(#aggregate-grad-md)" />
              <circle cx="82" cy="98" r="5" fill="url(#aggregate-grad-md)" />
              <circle cx="99" cy="97" r="4" fill="url(#aggregate-grad-md)" />
              <circle cx="78" cy="48" r="4.5" fill="url(#aggregate-grad-md)" />
              <circle cx="92" cy="58" r="4.5" fill="url(#aggregate-grad-md)" />
              <circle cx="64" cy="32" r="5" fill="url(#aggregate-grad-md)" />

              {/* Microscopic Cement & hydration gel packing */}
              <circle cx="60" cy="62" r="2" fill="url(#cement-grad)" />
              <circle cx="88" cy="75" r="2" fill="url(#cement-grad)" />
              <circle cx="70" cy="35" r="1.8" fill="url(#cement-grad)" />
              <circle cx="94" cy="31" r="2.2" fill="url(#cement-grad)" />
              <circle cx="71" cy="52" r="1.8" fill="url(#cement-grad)" />
              <circle cx="86" cy="20" r="1.9" fill="url(#cement-grad)" />

              {/* Laser dimensional lines */}
              <line x1="30" y1="85" x2="68" y2="85" stroke="#2563EB" strokeWidth="1" strokeDasharray="2,2" />
              <line x1="126" y1="28" x2="88" y2="28" stroke="#22C55E" strokeWidth="1" strokeDasharray="2,2" />
            </svg>
          </div>

          <div className="absolute bottom-2 left-3 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-[#2563EB] rounded-full inline-block"></span>
            <span className="text-[8px] text-slate-500 dark:text-slate-400 font-mono">STONE MATRICES</span>
            <span className="w-1.5 h-1.5 bg-[#22C55E] rounded-full inline-block ml-1"></span>
            <span className="text-[8px] text-slate-500 dark:text-slate-400 font-mono">HYDRATION</span>
          </div>
          
          <div className="text-[9px] font-sans text-center text-slate-500 dark:text-slate-400 mt-1 leading-normal font-bold">
            {localizedLabel("تراص حبيبي مدمج ثلاثي الأبعاد لتقليل المسامات", "Squelette granulaire 3D optimisé", "Dense 3D granular packing for void reduction")}
          </div>

        </div>

      </div>
    </div>
  );
};
