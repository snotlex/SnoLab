import React from "react";
import { MixDesignResult, MixDesignInput } from "../types";
import { GradingChart } from "./GradingChart";
import { useLanguage } from "../services/localization";

interface ReportChartsProps {
  result: MixDesignResult;
  input: MixDesignInput;
}

export const ReportCharts: React.FC<ReportChartsProps> = ({ result, input }) => {
  const { language } = useLanguage();

  // --- STRENGTH EVOLUTION CURVE SVG CALCS ---
  const strengthGraphMax = (() => {
    if (!result.strengthEvolution || result.strengthEvolution.length === 0) return 60;
    const maxVal = Math.max(...result.strengthEvolution.map(p => p.strength));
    return Math.ceil(maxVal / 10) * 10 + 10;
  })();

  const strengthGetX = (index: number) => {
    const left = 35;
    const right = 15;
    const chartWidth = 320 - left - right;
    return left + index * (chartWidth / 4);
  };

  const strengthGetY = (strVal: number) => {
    const top = 10;
    const bottom = 25;
    const chartHeight = 160 - top - bottom;
    const clamped = Math.max(0, Math.min(strengthGraphMax, strVal));
    return top + (1 - clamped / strengthGraphMax) * chartHeight;
  };

  const strengthLinePath = (() => {
    if (!result.strengthEvolution || result.strengthEvolution.length === 0) return "";
    return result.strengthEvolution
      .map((pt, index) => {
        const x = strengthGetX(index);
        const y = strengthGetY(pt.strength);
        return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  })();

  const strengthAreaPath = (() => {
    if (!result.strengthEvolution || result.strengthEvolution.length === 0) return "";
    const startX = strengthGetX(0);
    const startY = strengthGetY(result.strengthEvolution[0].strength);
    const endX = strengthGetX(result.strengthEvolution.length - 1);
    
    const lines = result.strengthEvolution
      .map((pt, index) => {
        const x = strengthGetX(index);
        const y = strengthGetY(pt.strength);
        return `L ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
      
    return `M ${startX.toFixed(1)} 135 L ${startX.toFixed(1)} ${startY.toFixed(1)} ${lines} L ${endX.toFixed(1)} 135 Z`;
  })();

  // --- DONUT VOLUMETRIC SHARE SVG CALCS ---
  const hasRealDensities = !!(
    input.cementDensity && input.cementDensity > 0 &&
    input.sandRelativeDensity && input.sandRelativeDensity > 0 &&
    input.gravelRelativeDensity && input.gravelRelativeDensity > 0
  );

  const isBlockedOrInvalid = 
    result?.valid === false || 
    result?.isValid === false || 
    result?.materialSuitability?.status === "blocked" ||
    !hasRealDensities;

  const cementDensityVal = input.cementDensity || 1;
  const sandDensityVal = (input.sandRelativeDensity > 10 ? input.sandRelativeDensity : input.sandRelativeDensity * 1000) || 1;
  const gravelDensityVal = (input.gravelRelativeDensity > 10 ? input.gravelRelativeDensity : input.gravelRelativeDensity * 1000) || 1;

  const cVol = result.cementWeight / (cementDensityVal / 1000);
  const wVol = result.waterContentActual;
  const sVol = result.sandWeightDry / (sandDensityVal / 1000);
  const gVol = result.gravelWeightDry / (gravelDensityVal / 1000);
  const aVol = result.admixtureWeights.reduce((s, a) => s + a.weight, 0) / 1.1; // estimate chemistry density as 1.1 kg/L
  const airVol = 10 * (input.airContent || 1.5);

  const totalVolShared = cVol + wVol + sVol + gVol + aVol + airVol;

  const pieSlices = (() => {
    const segments = [
      { 
        name: language === "ar" ? "خرسانة خشنة (حصى مكسر)" : language === "fr" ? "Gros Gravier Concassé" : "Coarse Aggregate (Gravel)", 
        size: gVol, color: "#475569", label: "Gravel" 
      },
      { 
        name: language === "ar" ? "رمل ناعم معاير" : language === "fr" ? "Sable Fin Calibré" : "Fine Sand (Calibrated)", 
        size: sVol, color: "#eab308", label: "Sand" 
      },
      { 
        name: language === "ar" ? "وجبة إسمنت بورتلاندي" : language === "fr" ? "Ciment Portland Pur" : "Portland Cement", 
        size: cVol, color: "#94a3b8", label: "Cement" 
      },
      { 
        name: language === "ar" ? "مياه الخلط الصافية" : language === "fr" ? "Eau d'Apport Net" : "Net Water Content", 
        size: wVol, color: "#3b82f6", label: "Water" 
      },
      { 
        name: language === "ar" ? "إضافات كيميائية فعالة" : language === "fr" ? "Adjuvants Actifs" : "Chemical Admixtures", 
        size: aVol, color: "#10b981", label: "Admix" 
      },
      { 
        name: language === "ar" ? "حجم الهواء الفراغي" : language === "fr" ? "Volume d'Air Occlus" : "Entrained Air Vol", 
        size: airVol, color: "#f43f5e", label: "Air" 
      }
    ].filter(s => s.size > 0);

    let accumulatedAngle = 0;
    return segments.map((slice) => {
      const fraction = slice.size / (totalVolShared || 1);
      const angle = fraction * 360;
      
      const r = 70;
      const cx = 80;
      const cy = 80;
      
      const startAngle = accumulatedAngle;
      const endAngle = accumulatedAngle + angle;
      accumulatedAngle = endAngle;
      
      const dRadStart = (startAngle - 90) * Math.PI / 180;
      const dRadEnd = (endAngle - 90) * Math.PI / 180;
      
      const x1 = cx + r * Math.cos(dRadStart);
      const y1 = cy + r * Math.sin(dRadStart);
      const x2 = cx + r * Math.cos(dRadEnd);
      const y2 = cy + r * Math.sin(dRadEnd);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      const pathData = `M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
      
      return {
        ...slice,
        pathData,
        percent: (fraction * 100).toFixed(1)
      };
    });
  })();

  return (
    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-right">
      <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-4 font-sans flex items-center gap-1.5 justify-end">
        <span>{language === "ar" ? "المخططات والمنحنيات الهندسية المعتمدة (Graphical Analysis curves)" : language === "fr" ? "Courbes d'Analyses Graphiques Homologuées" : "Approved Engineering Analysis Curves"}</span>
        <span className="text-amber-500 font-bold">📈</span>
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Chart A: Volumetric Component Shares Donut Chart */}
        <div className="bg-white dark:bg-slate-950 p-4 border border-slate-150 dark:border-slate-800 rounded-none shadow-xs text-right">
          <h5 className="text-xs font-black text-slate-850 dark:text-slate-200 mb-0.5 font-sans">
            {language === "ar" ? "• التوزيع الحجمي الكلي لمواد المتر المكعب (Volumetric Shares)" : language === "fr" ? "• Répartition Volumétrique des Composants (Donut)" : "• Volumetric Composition Breakdown per m³"}
          </h5>
          <p className="text-[10px] text-slate-400 mb-4 font-sans">
            {language === "ar" ? "التناسبات الحجمية النسبية المطلقة لـ 1,000 لتر من الخرسانة المتراصة" : language === "fr" ? "Volumes absolus pour 1 000 litres de béton frais" : "Relative absolute volumes for 1,000 Liters of compacted concrete"}
          </p>
          
          {isBlockedOrInvalid ? (
            <div className="flex items-center justify-center h-44 border border-dashed border-slate-200 dark:border-slate-800 p-4 text-center rounded mt-3">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                {language === "ar" 
                  ? "لا يمكن عرض التحليل الحجمي قبل إدخال مواد مستخدم حقيقية بكثافات معتمدة."
                  : language === "fr"
                    ? "Le graphique volumétrique ne peut pas être affiché avant d'avoir saisi de vrais matériaux d'utilisateur avec des densités certifiées."
                    : "The volumetric chart cannot be displayed before entering real user materials with certified densities."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-around gap-4 mt-3">
              {/* Donut SVG rendering */}
              <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 160 160" className="w-full h-full transform -rotate-90">
                  {/* Base Circle */}
                  <circle cx="80" cy="80" r="70" fill="none" stroke="#e2e8f0" strokeWidth="15" className="dark:stroke-slate-820" />
                  
                  {/* Dynamic Donut Slices */}
                  {pieSlices.map((slice, index) => (
                    <path
                      key={`donut-slice-${index}`}
                      d={slice.pathData}
                      fill={slice.color}
                      className="transition-all hover:opacity-90 cursor-pointer"
                    >
                      <title>{slice.name}: {slice.percent}% ({slice.size.toFixed(1)}L)</title>
                    </path>
                  ))}
                  
                  {/* Inner Ring to mask and make it a Donut */}
                  <circle cx="80" cy="80" r="45" fill="white" className="dark:fill-slate-950" />
                </svg>
                {/* Center text overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-sm font-black font-mono text-slate-900 dark:text-white leading-none">1,000 L</span>
                  <span className="text-[8px] text-slate-405 mt-1 font-sans">{language === "ar" ? "الحجم الكلي" : language === "fr" ? "Vol Total" : "Total Vol"}</span>
                </div>
              </div>

              {/* Legend checklist */}
              <div className="flex-1 text-right text-[10px] space-y-1.5 leading-tight font-sans">
                {pieSlices.map((slice, index) => (
                  <div key={`pie-legend-${index}`} className="flex items-center justify-between gap-2">
                    <span className="font-mono text-slate-500 font-semibold">{slice.percent}% ({slice.size.toFixed(0)}L)</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-700 dark:text-slate-300 font-bold">{slice.name}</span>
                      <span className="w-2.5 h-2.5 shrink-0 inline-block" style={{ backgroundColor: slice.color }}></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chart B: Compressive Strength Development Log Chart */}
        <div className="bg-white dark:bg-slate-950 p-4 border border-slate-150 dark:border-slate-800 rounded-none shadow-xs text-right">
          <h5 className="text-xs font-black text-slate-850 dark:text-slate-200 mb-0.5 font-sans">
            {language === "ar" ? "• منحنى تطور مقاومة الضغط بالزمن للخرسانة (Strength Evolution)" : language === "fr" ? "• Évolution de la Résistance en Compression" : "• Compressive Strength Growth Curve"}
          </h5>
          <p className="text-[10px] text-slate-400 mb-4 font-sans">
            {language === "ar" ? "توقع نضوج الإماهة الإسمنتية من عمر 3 أيام حتى 90 يوماً (MPa)" : language === "fr" ? "Durcissement estimé de la cure (3 j à 90 j) en MPa" : "Predicted hydration hardening from 3 to 90 days (MPa)"}
          </p>
          
          <div className="w-full mt-2">
            <svg viewBox="0 0 320 160" className="w-full h-auto select-none font-sans text-[8px]">
              {/* Background gridlines */}
              {[0, 20, 40, 60, 80, 100].map((percentPct, i) => {
                const strengthAtVal = (percentPct / 100) * strengthGraphMax;
                const y = strengthGetY(strengthAtVal);
                return (
                  <g key={`strength-hgrid-${i}`}>
                    <line x1="35" y1={y} x2="310" y2={y} stroke="#f1f5f9" className="dark:stroke-slate-850" strokeWidth="0.8" strokeDasharray="3,3" />
                    <text x="28" y={y + 3} textAnchor="end" className="fill-slate-400 dark:fill-slate-500">{strengthAtVal.toFixed(0)}</text>
                  </g>
                );
              })}
              
              {/* Vertical time markers */}
              {result.strengthEvolution?.map((pt, index) => {
                const x = strengthGetX(index);
                return (
                  <g key={`strength-vgrid-${index}`}>
                    <line x1={x} y1="10" x2={x} y2="135" stroke="#f1f5f9" className="dark:stroke-slate-850" strokeWidth="0.8" />
                    <text x={x} y="145" textAnchor="middle" className="fill-slate-500 dark:fill-slate-450 font-bold">{pt.age} {language === "ar" ? "يوم" : language === "fr" ? "j" : "d"}</text>
                  </g>
                );
              })}

              {/* X and Y baseline */}
              <line x1="35" y1="135" x2="310" y2="135" stroke="#94a3b8" strokeWidth="1" />
              <line x1="35" y1="10" x2="35" y2="135" stroke="#94a3b8" strokeWidth="1" />

              {/* Shaded Area under strength curve */}
              {strengthAreaPath && (
                <path d={strengthAreaPath} fill="url(#strength-area-grad)" opacity="0.15" />
              )}

              {/* Gradient Definition */}
              <defs>
                <linearGradient id="strength-area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Plotted Line Path */}
              {strengthLinePath && (
                <path d={strengthLinePath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              )}

              {/* Bullet Points and Text overlays */}
              {result.strengthEvolution?.map((pt, index) => {
                const x = strengthGetX(index);
                const y = strengthGetY(pt.strength);
                return (
                  <g key={`strength-dots-${index}`}>
                    <circle cx={x} cy={y} r="3.5" fill="#3b82f6" stroke="white" className="dark:stroke-slate-950" strokeWidth="1" />
                    <rect x={x - 18} y={y - 12} width="36" height="10" rx="2" fill="#1e293b" className="dark:fill-slate-800" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                    <text x={x} y={y - 4} textAnchor="middle" fill="#22c55e" className="font-bold font-mono text-[7px]" style={{ fontSize: '6.5px' }}>{pt.strength.toFixed(1)}</text>
                  </g>
                );
              })}
            </svg>
          </div>
          
          <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 text-right leading-relaxed font-sans bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2.5">
            <span>💡 {language === "ar" ? "الموصف المقدر:" : language === "fr" ? "Estimation de la cure :" : "Estimated cure:"}</span> {language === "ar" ? "تصل القوة بعمر 7 أيام إلى " : language === "fr" ? "La résistance à 7 jours atteint " : "Strength at 7 days reaches "} <strong className="text-blue-500">{( (result.strengthEvolution?.[1]?.strength || 1) / input.fck28 * 100 ).toFixed(0)}%</strong> {language === "ar" ? " من القوة المميزة المطلوبة، ثم تنضج كلياً لتبلغ " : language === "fr" ? " de la cible caractéristique, puis mûrit pour valider " : " of target characteristic fck, then fully matures to "} <strong className="text-emerald-500">100%</strong> {language === "ar" ? " بعمر 28 يوماً، مع تطور بوزولاني إضافي ملحوظ في المدى البعيد." : language === "fr" ? " à 28 jours, avec un gain pouzzolanique prolongé." : " at 28 days, showing noticeable prolonged hydration gain."}
          </div>
        </div>
      </div>

      {/* Sieve analysis grading logarithmic curve */}
      <div className="mt-6">
        <GradingChart
          gradingCurve={result.gradingCurve}
          pivotPoint={result.pivotPoint}
          dMax={input.dMax}
        />
      </div>
    </div>
  );
};
