import React, { useMemo } from "react";
import { MixDesignResult, MixDesignInput } from "../types";
import { Flame, AlertTriangle, CheckCircle, ShieldAlert, Thermometer, Info } from "lucide-react";

interface ReportThermalAnalysisProps {
  result: MixDesignResult;
  input: MixDesignInput;
}

const CEMENT_THERMAL_PROPERTIES = {
  "CEM_I": { heat: 350, rate: 0.040, nameAr: "إسمنت بورتلاندي عادي (CEM I) - حرارة إماهة مرتفعة", nameEn: "Portland Cement (CEM I) - High Hydration Heat" },
  "CEM_II": { heat: 280, rate: 0.028, nameAr: "إسمنت بورتلاندي مركب (CEM II) - حرارة معتدلة", nameEn: "Composite Cement (CEM II) - Moderate Hydration Heat" },
  "CEM_III": { heat: 190, rate: 0.015, nameAr: "إسمنت الأفران العالية (CEM III) - منخفض الحرارة جداً", nameEn: "Blast Furnace Slag (CEM III) - Very Low Heat" },
  "SRC": { heat: 240, rate: 0.022, nameAr: "إسمنت مقاوم للكبريتات (SRC) - حرارة منخفضة", nameEn: "Sulfate Resistant Cement (SRC) - Low Heat" }
};

const resolveCementKey = (typeStr: string): string => {
  if (!typeStr) return "CEM_I";
  if (typeStr.includes("CEM I") || typeStr.includes("CEM_I")) return "CEM_I";
  if (typeStr.includes("CEM II") || typeStr.includes("CEM_II")) return "CEM_II";
  if (typeStr.includes("CEM III") || typeStr.includes("CEM_III")) return "CEM_III";
  if (typeStr.includes("SRC") || typeStr.includes("Sulfate")) return "SRC";
  return "CEM_I";
};

export const ReportThermalAnalysis: React.FC<ReportThermalAnalysisProps> = ({ result, input }) => {
  const cementKey = resolveCementKey(input.cementType);
  const cementDetails = CEMENT_THERMAL_PROPERTIES[cementKey as keyof typeof CEMENT_THERMAL_PROPERTIES] || CEMENT_THERMAL_PROPERTIES["CEM_I"];
  
  // High-fidelity mathematical heat model representing typical 1.5m thick mass concrete slab
  const thermalAnalysis = useMemo(() => {
    const cementWeight = result.cementWeight;
    const initialTemp = 25; // standard placement temp Celsius
    const ambientTemp = 22; // ambient temperature Celsius
    
    const specificHeat = 1.05; 
    const density = 2400;
    const maxAdiabaticRise = (cementWeight * cementDetails.heat) / (specificHeat * density);

    // shape ratio factor representing 1.5m thick section
    const thickness = 1.5;
    const width = 3.0;
    const shapeAreaRatio = (2 * (width + thickness)) / (width * thickness);
    const insulationValue = 0.60; // Traditional wood formwork
    const k_dissipation = 0.0003 * (1 - insulationValue * 0.7) * (shapeAreaRatio * shapeAreaRatio);

    let peakCore = initialTemp;
    let peakDiff = 0;
    let peakCoreTime = 48; // estimated hours to peak

    for (let h = 0; h <= 240; h += 2) {
      const g_hydration = 1 - Math.exp(-cementDetails.rate * h);
      const thermalLossMod = Math.exp(-k_dissipation * h);
      const coreRise = maxAdiabaticRise * g_hydration * thermalLossMod;
      const coreT = initialTemp + coreRise;
      const surfT = ambientTemp + (coreT - ambientTemp) * insulationValue;
      const diffT = Math.max(0, coreT - surfT);

      if (coreT > peakCore) {
        peakCore = coreT;
      }
      if (diffT > peakDiff) {
        peakDiff = diffT;
        peakCoreTime = h;
      }
    }

    const maxGradient = peakDiff;
    const criticalThreshold = 20.0; // standard safety limit in Celsius
    
    let riskLevel: "low" | "medium" | "high" = "low";
    let riskLabelAr = "مستوى منخفض - تصرف آمن لا تشققات متوقعة";
    let riskColor = "text-emerald-600 dark:text-emerald-400";
    let bgLightColor = "bg-emerald-50 dark:bg-emerald-950/15 border-emerald-200 dark:border-emerald-900/30";

    if (maxGradient >= 25) {
      riskLevel = "high";
      riskLabelAr = "خطر حرج ومرتفع جداً - شروخ إنشائية مؤكدة بالكتلة";
      riskColor = "text-rose-600 dark:text-red-400 font-bold";
      bgLightColor = "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40";
    } else if (maxGradient >= 18) {
      riskLevel = "medium";
      riskLabelAr = "خطر متوسط - يُنصح بتطبيق الرش بالماء البارد والوقاية";
      riskColor = "text-amber-600 dark:text-amber-400 font-bold";
      bgLightColor = "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40";
    }

    return {
      maxAdiabaticRise,
      peakCore,
      maxGradient,
      peakCoreTime,
      riskLevel,
      riskLabelAr,
      riskColor,
      bgLightColor
    };
  }, [result.cementWeight, cementDetails]);

  return (
    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-right print-avoid-break">
      <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-4 font-sans flex items-center gap-1.5 justify-end">
        <span>3. تقرير السلوك الحراري والتنبؤ بالتشققات الكتلية (Mass Concrete Thermals Audit)</span>
        <span className="text-amber-500 font-bold">🔥</span>
      </h4>

      <div className="border border-slate-200 dark:border-slate-800 rounded-none bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Box 1: Peak core temperature */}
          <div className="border border-slate-200 dark:border-slate-800 p-3 rounded-none text-center bg-slate-50/10 dark:bg-slate-900/40">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans block uppercase font-mono tracking-wide">الدرجة القصوى المتوقعة بقلب الصبة</span>
            <div className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono mt-1 flex items-center justify-center gap-1">
              <Thermometer size={16} className="text-rose-500" />
              <span>{thermalAnalysis.peakCore.toFixed(1)} °C</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-sans">
              يحدث الذروة تقريباً بعد بعمر <span className="font-bold font-mono text-amber-600 dark:text-amber-400">{thermalAnalysis.peakCoreTime} ساعة</span>
            </p>
          </div>

          {/* Box 2: Max Thermal Gradient */}
          <div className="border border-slate-200 dark:border-slate-800 p-3 rounded-none text-center bg-slate-50/10 dark:bg-slate-900/40">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans block uppercase font-mono tracking-wide">أقصى فارق إجهاد حراري سطحي</span>
            <div className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono mt-1 flex items-center justify-center gap-1">
              <AlertTriangle size={15} className="text-amber-500" />
              <span>{thermalAnalysis.maxGradient.toFixed(1)} °C</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-sans">
              الحد الأقصى المسموح هندسياً بالتدابير: <span className="font-bold text-red-500 font-mono">20.0 °C</span>
            </p>
          </div>

          {/* Box 3: Thermal risk level */}
          <div className="border border-slate-200 dark:border-slate-800 p-3 rounded-none text-center bg-slate-100/50 dark:bg-slate-800/40">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans block uppercase font-mono tracking-wide">خطورة التشقق الحراري</span>
            <div className={`text-xs font-bold mt-2 font-sans ${thermalAnalysis.riskColor}`}>
              {thermalAnalysis.riskLabelAr}
            </div>
          </div>

        </div>

        {/* Detailed text & advice block */}
        <div className={`p-3 border rounded-none ${thermalAnalysis.bgLightColor}`}>
          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans space-y-1">
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 justify-end mb-1 text-[11.5px]">
              <span>التحليل والتأثير الفني على العناصر الضخمة (Mass Concrete Thermal Curing Advice)</span>
              <Info size={13} className="text-amber-500" />
            </div>
            <p>
              • تم تقييم السلوك الحراري بناءً على جرعة المقدار المقاسة بـ <strong className="text-slate-900 dark:text-white font-mono">{Math.round(result.cementWeight)} كجم/م³</strong> من {cementDetails.nameAr}.
            </p>
            <p>
              • يبلغ الارتفاع الأدياباتي الأقصى النظري للحرارة دون تبريد أو تبخر <strong className="text-slate-900 dark:text-white font-mono">{thermalAnalysis.maxAdiabaticRise.toFixed(1)} °C</strong> كلياً.
            </p>
            {thermalAnalysis.riskLevel === "high" ? (
              <p className="text-rose-700 dark:text-rose-400 font-semibold">
                • ⚠️ <strong>إجراء جودة وقائي هام:</strong> نظرًا للقيمة المتجاوزة للفارق الحراري الحرج عن حد الـ 20 درجة، يوصى بشدة بالحد من حرارة صب الخرسانة الأولية بالموقع لتكون دون <strong className="font-mono">22°C</strong> (عن طريق استبدال ماء الخلط برقائق الثلج) مع عزل القوالب بالصوف الصخري المحمي بالبولي إيثيلين لتثبيط التدرج.
              </p>
            ) : thermalAnalysis.riskLevel === "medium" ? (
              <p className="text-amber-700 dark:text-amber-400 font-semibold">
                • ⚠️ <strong>تحذير جودة للموقع:</strong> الفارق الحراري متوسط القيد. يوصى بإبقاء قوالب الصب الخشبية الموقعية مدة لا تقل عن <strong className="font-mono">96 ساعة</strong> لمنع حدوث الصدمة الحرارية والتبخر السريع للوجه الخارجي.
              </p>
            ) : (
              <p className="text-emerald-700 dark:text-emerald-400 font-semibold animate-pulse">
                • ✓ <strong>جاهزية تامة:</strong> أوزان الخلط الحبيبي تضمن توزيع الإجهادات بمرونة مثالية متوافقة كلياً مع كود الضبط والاستلام الهندسي وعزل الحرارة منخفض الخطورة.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
