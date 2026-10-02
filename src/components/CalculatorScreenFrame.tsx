import React from "react";

type Language = "ar" | "fr" | "en";

export const CalculatorScreenFrame: React.FC<{
  language: Language;
  isRtl: boolean;
  children: React.ReactNode;
}> = ({ language, isRtl, children }) => (
  <section className="space-y-6 animate-fade-in" id="mixwizard-calculator-screen" dir={isRtl ? "rtl" : "ltr"} aria-label={language === "ar" ? "شاشة الحساب والتصميم" : language === "fr" ? "Calcul et formulation" : "Mix calculation and design"}>
    {children}
  </section>
);
