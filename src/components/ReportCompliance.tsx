import React from "react";
import { useLanguage } from "../services/localization";
import { MixDesignResult } from "../types";

interface ReportComplianceProps {
  result: MixDesignResult;
}

export const ReportCompliance: React.FC<ReportComplianceProps> = ({ result }) => {
  const { language, isRtl } = useLanguage();
  if (!result.standardsCompliance || result.standardsCompliance.length === 0) return null;

  return (
    <div className={`mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 ${isRtl ? "text-right" : "text-left"}`}>
      <h4 className={`text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-4 font-sans flex items-center gap-1.5 ${isRtl ? "justify-end flex-row" : "justify-start flex-row-reverse"}`}>
        <span>
          {language === "ar"
            ? "معايير المطابقة والدساتير الهندسية الدولية"
            : language === "fr"
            ? "Conformité aux Normes & Codes Internationaux"
            : "Compliance with International Standards & Codes"}
        </span>
        <span className="text-emerald-500 font-bold">🛡️</span>
      </h4>
      <div className="border border-slate-200 dark:border-slate-800 rounded-none overflow-hidden shadow-xs bg-white dark:bg-slate-900">
        <table className={`w-full text-xs ${isRtl ? "text-right" : "text-left"}`}>
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 text-slate-650 dark:text-slate-300 text-[10px] border-b border-slate-200 dark:border-slate-800">
              <th className="p-3 font-sans font-bold text-slate-800 dark:text-slate-200">
                {language === "ar" ? "الكود المرجعي الدولي" : language === "fr" ? "Norme de Référence" : "Reference Standard"}
              </th>
              <th className="p-3 font-sans font-bold text-center text-slate-800 dark:text-slate-200">
                {language === "ar" ? "المقادير والشرط" : language === "fr" ? "Critère / Limite" : "Requirement"}
              </th>
              <th className="p-3 font-sans font-bold text-center text-slate-800 dark:text-slate-200">
                {language === "ar" ? "قيمة الخلطة الحالية" : language === "fr" ? "Valeur Réelle" : "Actual Value"}
              </th>
              <th className="p-3 font-sans font-bold text-center text-slate-800 dark:text-slate-200">
                {language === "ar" ? "الحالة" : language === "fr" ? "Statut" : "Status"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {result.standardsCompliance.map((std, index) => (
              <tr key={`standards-row-${index}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                <td className={`p-3 font-sans ${isRtl ? "text-right" : "text-left"}`}>
                  <div className="font-extrabold text-slate-900 dark:text-slate-100">{std.standardName}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans mt-0.5">{std.note}</div>
                </td>
                <td className="p-3 text-center text-slate-800 dark:text-slate-200 font-mono">{std.requirement}</td>
                <td className="p-3 text-center text-slate-900 dark:text-slate-100 font-mono font-bold">{std.actual}</td>
                <td className="p-3 text-center">
                  <span className={`inline-block text-[10px] font-black p-1 px-2.5 rounded-none ${
                    std.status === "compliant"
                      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/50"
                      : std.status === "warning"
                      ? "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-300 dark:border-amber-800/50"
                      : "bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-300 dark:border-rose-800/50"
                  }`}>
                    {std.status === "compliant"
                      ? (language === "ar" ? "مطابق ✓" : language === "fr" ? "Conforme ✓" : "Compliant ✓")
                      : std.status === "warning"
                      ? (language === "ar" ? "تنبيه ⚠" : language === "fr" ? "Avertissement ⚠" : "Warning ⚠")
                      : (language === "ar" ? "غير مطابق ✗" : language === "fr" ? "Non Conforme ✗" : "Non Compliant ✗")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
