import React, { useState } from "react";
import { HelpCircle, Info } from "lucide-react";
import { ENCYCLOPEDIA_TERMS } from "../data/engineeringEncyclopedia";
import { AnimatePresence, motion } from "motion/react";

interface InteractiveTooltipProps {
  termKey: string;
  language?: "ar" | "en" | "fr";
  children?: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export const InteractiveTooltip: React.FC<InteractiveTooltipProps> = ({
  termKey,
  language = "ar",
  children,
  position = "top"
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const term = ENCYCLOPEDIA_TERMS.find((t) => t.key === termKey);

  if (!term) {
    // Fallback if key doesn't match any encyclopedia term
    return <>{children}</>;
  }

  const title = language === "ar" ? term.termAr : language === "fr" ? term.termFr : term.termEn;
  const definition = language === "ar" ? term.definitionAr : language === "fr" ? term.definitionFr : term.definitionEn;
  
  // Custom category labels for the tooltip header
  const categoryLabels: Record<string, Record<string, string>> = {
    mix_design: { ar: "تصميم الخلطة", en: "Mix Design", fr: "Formulation" },
    aggregate_physics: { ar: "فيزياء الركام", en: "Aggregate Physics", fr: "Physique des granulats" },
    chemicals: { ar: "الكيميائيات والمضافات", en: "Admixtures", fr: "Adjuvants" },
    mechanical_properties: { ar: "الخواص الميكانيكية", en: "Mechanical Properties", fr: "Propriétés" },
    durability: { ar: "المتانة والديمومة", en: "Durability", fr: "Durabilité" }
  };

  const catLabel = categoryLabels[term.category]?.[language] || term.category;

  // Placement class mappings
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2"
  };

  const handleToggle = () => {
    setIsVisible(!isVisible);
  };

  return (
    <span 
      className="relative inline-flex items-center gap-1 group/tooltip"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children ? (
        <span 
          onClick={handleToggle}
          className="cursor-help border-b border-dashed border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {children}
        </span>
      ) : (
        <span 
          onClick={handleToggle}
          className="cursor-help text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors inline-flex p-0.5"
        >
          <Info size={11} className="inline-block" />
        </span>
      )}

      {/* TOOLTIP CONTENT BOX */}
      <AnimatePresence>
        {isVisible && (
          <motion.span
            initial={{ opacity: 0, y: position === "top" ? 4 : -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 w-64 p-3.5 bg-slate-900 dark:bg-slate-950 text-white rounded-xl shadow-xl text-right flex flex-col gap-1.5 pointer-events-none border border-slate-800/80 ${positionClasses[position]}`}
            dir={language === "ar" ? "rtl" : "ltr"}
          >
            <span className="flex items-center justify-between gap-1.5 border-b border-slate-800 pb-1.5 flex-wrap">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-tight">
                {title}
              </span>
              <span className="text-[8px] px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-bold font-mono">
                {term.standard}
              </span>
            </span>
            <span className="text-[10px] text-slate-300 leading-relaxed font-sans font-medium">
              {definition}
            </span>
            <span className="flex items-center justify-between text-[8px] text-slate-400 font-mono mt-1 pt-1 border-t border-slate-800/60">
              <span>{language === "ar" ? "التصنيف:" : "Cat:"} {catLabel}</span>
              {term.formula && (
                <span className="text-blue-400 font-bold truncate max-w-[120px]">{term.formula}</span>
              )}
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
};
