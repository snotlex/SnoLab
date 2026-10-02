import React from "react";

type Language = "ar" | "fr" | "en";

export const CalculatorSectionHeader: React.FC<{ language: Language }> = ({ language }) => (
  <header className="rounded-2xl border border-blue-500/15 bg-blue-500/5 px-4 py-3">
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xs font-black text-white">03</span>
      <div>
        <h3 className="text-sm font-black text-slate-900 dark:text-white">{language === "ar" ? "تحضير الخلطة — جميع الأقسام متتابعة في صفحة واحدة" : language === "fr" ? "Préparation du mélange — toutes les sections sur une seule page" : "Mix preparation — all sections in one continuous page"}</h3>
        <p className="mt-1 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">{language === "ar" ? "ابدأ بمتطلبات المشروع، ثم المواد وخصائصها، فظروف الورشة والتحقق والنتائج." : language === "fr" ? "Commencez par les exigences, puis les matériaux, les conditions du chantier, la validation et les résultats." : "Start with project requirements, then materials, site conditions, validation and results."}</p>
      </div>
    </div>
  </header>
);
