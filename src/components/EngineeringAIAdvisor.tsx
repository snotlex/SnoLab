import React from "react";
import { MixDesignInput, MixDesignResult, EngineeringMaterial } from "../types";
import { analyzeMixDesign, AdvisorAnalysis } from "../utils/aiAdvisor";
import { 
  Sparkles, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Coins, 
  Leaf, 
  ShieldAlert, 
  Activity, 
  Wrench,
  HelpCircle,
  FileCheck2,
  AlertCircle
} from "lucide-react";

interface EngineeringAIAdvisorProps {
  input: MixDesignInput;
  result: MixDesignResult;
  reportLanguage?: "ar" | "en";
  materialsDatabase?: EngineeringMaterial[];
  resolvedMaterials?: any;
}

export const EngineeringAIAdvisor: React.FC<EngineeringAIAdvisorProps> = ({
  input,
  result,
  reportLanguage = "ar",
  materialsDatabase = [],
  resolvedMaterials
}) => {
  const analysis: AdvisorAnalysis = React.useMemo(() => {
    return analyzeMixDesign(input, result, resolvedMaterials);
  }, [input, result, resolvedMaterials]);

  const isAr = reportLanguage === "ar";

  // Formatter for cost in Dinar Algérien
  const formatCost = (val: number) => {
    return isAr ? `${val.toLocaleString()} د.ج` : `${val.toLocaleString()} DA`;
  };

  const c = analysis.conclusion;

  return (
    <div id="engineering-ai-advisor-panel" className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950/40 rounded-3xl p-6 shadow-xl space-y-6 text-right">
      
      {/* HEADER SECTION WITH DESIGNER SPARKS */}
      <div className="flex flex-row-reverse items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white select-none">
              {isAr ? "مساعد AI الهندسي الاستشاري" : "SNO AI Engineering Advisor"}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isAr 
                ? "تحليل تلقائي متواصل للمواصفات الفيزيائية وجودة المتانة ومحددات البيئة" 
                : "Real-time verification of durability, physical metrics & environmental limits"}
            </p>
          </div>
        </div>
        
        {/* FINAL DECISION BADGE */}
        <div className={`px-4 py-2 rounded-2xl border ${c.finalDecisionColor} flex items-center gap-2 font-black text-xs md:text-sm`}>
          {c.finalDecision === "APPROVED" && <CheckCircle className="w-5 h-5" />}
          {c.finalDecision === "APPROVED WITH OPTIMIZATION" && <AlertTriangle className="w-5 h-5 shrink-0" />}
          {c.finalDecision === "NOT RECOMMENDED" && <XCircle className="w-5 h-5 shrink-0 animate-bounce" />}
          <span>{isAr ? c.finalDecisionAr : c.finalDecision}</span>
        </div>
      </div>

      {/* BLOCK 1: ADVISORY LAYERS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Cement Eco Efficiency */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-2 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex justify-between items-center flex-row-reverse">
              <span className="p-1.5 bg-sky-500/15 text-sky-600 dark:text-sky-400 rounded-lg text-xs">
                <TrendingDown className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isAr ? "كفاءة الإسمنت" : "Cement Efficiency"}</span>
            </div>
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">
              {isAr ? `الجرعة: ${Math.round(result.cementWeight)} كجم/م³` : `Content: ${Math.round(result.cementWeight)} kg/m³`}
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed text-right">
              {isAr ? analysis.cementEfficiency.adviceArabic : analysis.cementEfficiency.adviceEnglish}
            </p>
          </div>
          {analysis.cementEfficiency.excessive && (
            <div className="pt-2 border-t border-slate-150 dark:border-slate-900 mt-2 text-right">
              <div className="text-[10px] text-emerald-600 font-extrabold flex items-center justify-end gap-1 flex-row-reverse">
                <span>{isAr ? `توفير مالي: ${formatCost(analysis.cementEfficiency.costSaving)}` : `Savings: ${formatCost(analysis.cementEfficiency.costSaving)}`}</span>
                <CheckCircle className="w-3 h-3" />
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Water-Cement Durability */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-2 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex justify-between items-center flex-row-reverse">
              <span className={`p-1.5 rounded-lg text-xs ${
                analysis.wcRatio.rating === "optimal" ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"
              }`}>
                <Activity className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isAr ? "نسبة الماء للاسمنت" : "W/C Quality"}</span>
            </div>
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">
              W/C = {analysis.wcRatio.ratio} 
              <span className="text-[10px] text-slate-400 mr-2">
                ({analysis.wcRatio.rating === "optimal" ? (isAr ? "مثالي" : "Optimal") : (isAr ? "انتبه" : "Check")})
              </span>
            </h4>
            <div className="space-y-1 pt-1 text-right">
              {analysis.wcRatio.warningsAr.length > 0 ? (
                analysis.wcRatio.warningsAr.map((w, idx) => (
                  <p key={idx} className="text-[10px] text-amber-600 font-semibold flex items-center justify-end gap-1 flex-row-reverse">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>{isAr ? w : analysis.wcRatio.warnings[idx]}</span>
                  </p>
                ))
              ) : (
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {isAr ? "نسبة خلط متوازنة للماء الحر تضمن تبلور مصفوفة الخرسانة." : "Perfect water proportions to complete full hydration."}
                </p>
              )}
            </div>
          </div>
          <div className="pt-2 border-t border-slate-150 dark:border-slate-900 mt-2 text-right">
            <span className="text-[9.5px] font-bold text-slate-500 block">
              {isAr ? `مسامية الهيكل: ${analysis.wcRatio.durabilityRiskAr}` : `Porosity Risks: ${analysis.wcRatio.durabilityRisk}`}
            </span>
          </div>
        </div>

        {/* Card 3: Aggregate Quality Layer */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-2 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex justify-between items-center flex-row-reverse">
              <span className="p-1.5 bg-teal-500/15 text-teal-600 dark:text-teal-400 rounded-lg text-xs">
                <Wrench className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isAr ? "جودة الركام" : "Aggregate Quality"}</span>
            </div>
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">
              {isAr ? `رقم النعومة للرمل: ${analysis.aggregateQuality.sandFM}` : `Sand FM: ${analysis.aggregateQuality.sandFM}`}
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed text-right">
              {isAr ? analysis.aggregateQuality.gradationAdviceAr : analysis.aggregateQuality.gradationAdviceEn}
            </p>
            {analysis.aggregateQuality.absorptionWarningsAr.map((w, idx) => (
              <p key={idx} className="text-[9.5px] text-indigo-600 dark:text-indigo-400 font-semibold leading-relaxed flex items-center justify-end gap-1 flex-row-reverse">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{isAr ? w : analysis.aggregateQuality.absorptionWarnings[idx]}</span>
              </p>
            ))}
          </div>
          <div className="pt-2 border-t border-slate-150 dark:border-slate-900 mt-2 text-right">
            <span className="text-[10px] text-slate-500">
              {isAr ? `تدرج الركام: ${analysis.aggregateQuality.sandRating}` : `Gradation state: ${analysis.aggregateQuality.sandRating}`}
            </span>
          </div>
        </div>

        {/* Card 4: Sustainability & CO2 Footprint */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-2 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex justify-between items-center flex-row-reverse">
              <span className={`p-1.5 rounded-lg text-[10px] font-black ${analysis.sustainability.scoreColor}`}>
                {isAr ? `الدرجة ${analysis.sustainability.score}` : `Score ${analysis.sustainability.score}`}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isAr ? "الاستدامة والبيئة" : "Sustainability"}</span>
            </div>
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex justify-between flex-row-reverse">
              <span>{isAr ? "انبعاث الكربون:" : "CO2 Intensity:"}</span>
              <span className="font-mono text-emerald-600">{analysis.sustainability.co2Intensity} kg/m³</span>
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed text-right">
              {isAr ? analysis.sustainability.adviceAr : analysis.sustainability.adviceEn}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-150 dark:border-slate-900 mt-2 flex justify-between flex-row-reverse items-center">
            <span className="text-[9.5px] font-bold text-slate-500">{isAr ? "توفير غازات هباء:" : "CO2 Saved:"}</span>
            <span className="text-[10px] font-black text-emerald-600 font-mono">+{analysis.sustainability.co2SavingPercent}%</span>
          </div>
        </div>

      </div>

      {/* BLOCK 2: EXPOSURE & COMPLIANCE PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-right">
        
        {/* Compliance checklist */}
        <div className="lg:col-span-2 space-y-3">
          <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            {isAr ? "المطابقة البيئية والفيزيائية للكود (EN 206 Durability Rules)" : "EN 206 Durability & Exposure Compliance Checks"}
          </h4>
          <div className="space-y-2">
            {analysis.exposureCompliance.checks.map((chk, i) => (
              <div key={i} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center flex-row-reverse">
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md font-mono font-bold text-[10px]">
                      {chk.code}
                    </span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">{chk.name}</span>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    chk.overallPass ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                  }`}>
                    {chk.overallPass ? (isAr ? "مطابق" : "PASSED") : (isAr ? "غير مطابق" : "FAILED")}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-[11px] text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between flex-row-reverse border-l border-slate-200/40 pl-2">
                    <span>{isAr ? "نسبة الماء/الإسمنت:" : "W/C Ratio:"}</span>
                    <span className={`font-mono font-bold ${chk.maxWcPass ? "text-emerald-600" : "text-rose-600"}`}>
                      {chk.actualWc} / {chk.requiredMaxWc} {isAr ? "الأقصى" : "Max"}
                    </span>
                  </div>
                  <div className="flex justify-between flex-row-reverse">
                    <span>{isAr ? "الحد الأدنى للإسمنت:" : "Min Cement:"}</span>
                    <span className={`font-mono font-bold ${chk.minCementPass ? "text-emerald-600" : "text-rose-600"}`}>
                      {chk.actualCement} / {chk.requiredMinCement} {isAr ? "الأدنى" : "Min"} kg/m³
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] font-bold text-slate-500">
            {isAr ? analysis.exposureCompliance.passDetailsAr : analysis.exposureCompliance.passDetailsEn}
          </p>
        </div>

        {/* Pumpability & Reinforcement clearance */}
        <div className="space-y-4">
          {/* Pumpability card */}
          <div className="p-4 bg-indigo-500/5 dark:bg-indigo-950/20 border border-indigo-150/40 rounded-2xl space-y-2.5">
            <h5 className="text-xs font-black text-indigo-700 dark:text-indigo-400 flex items-center justify-end gap-1.5 flex-row-reverse">
              <Activity className="w-4 h-4" />
              <span>{isAr ? "ملاءمة الضخ الهيدروليكي" : "Pumpability Evaluation"}</span>
            </h5>
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between flex-row-reverse">
                <span>{isAr ? "كفاءة التدفق بالطلمبة:" : "Pumping Suitability:"}</span>
                <strong className="text-indigo-600 dark:text-indigo-400">{analysis.pumpability.ratingAr}</strong>
              </div>
              <div className="flex justify-between flex-row-reverse">
                <span>{isAr ? "خطر انسداد الأنبوب:" : "Blockage Risk:"}</span>
                <span className={`font-bold ${analysis.pumpability.blockageRisk === "High" ? "text-rose-600" : "text-emerald-600"}`}>
                  {isAr ? analysis.pumpability.blockageRiskAr : analysis.pumpability.blockageRisk}
                </span>
              </div>
              <div className="flex justify-between flex-row-reverse">
                <span>{isAr ? "مخاطر الانفصال بالدفع:" : "Segregation Risk:"}</span>
                <span className="font-bold">{isAr ? analysis.pumpability.segregationRiskAr : analysis.pumpability.segregationRisk}</span>
              </div>
            </div>
            <p className="text-[10.5px] leading-relaxed text-slate-500 bg-white/40 dark:bg-slate-950/40 p-2 rounded-lg">
              {isAr ? analysis.pumpability.adviceAr : analysis.pumpability.adviceEn}
            </p>
          </div>

          {/* Reinforcement clearance card */}
          <div className="p-4 bg-amber-500/5 dark:bg-amber-950/20 border border-amber-150/40 rounded-2xl space-y-2">
            <h5 className="text-xs font-black text-amber-700 dark:text-amber-400 flex items-center justify-end gap-1.5 flex-row-reverse">
              <ShieldAlert className="w-4 h-4" />
              <span>{isAr ? "مطابقة وتكثيف التسليح" : "Reinforcement Compatibility"}</span>
            </h5>
            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
              {isAr ? analysis.reinforcement.recommendationAr : analysis.reinforcement.recommendationEn}
            </p>
          </div>
        </div>

      </div>

      {/* BLOCK 3: ECONOMIC ANALYSIS & COST OPTIMICALS */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-right space-y-3">
        <h4 className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center justify-end gap-1 flex-row-reverse">
          <Coins className="w-4 h-4" />
          <span>{isAr ? "التحليل المالي لمركبات الخلطة والتكلفة المثلى" : "Mix Constituent Commercial Costing"}</span>
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl">
            <span className="text-[9.5px] text-slate-400 block mb-0.5">{isAr ? "تكلفة الإسمنت والمضاف الإسمنتي" : "Cementitious Cost"}</span>
            <strong className="text-sm font-mono text-slate-800 dark:text-white">
              {formatCost(analysis.costOptimization.cementCost)}
            </strong>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl">
            <span className="text-[9.5px] text-slate-400 block mb-0.5">{isAr ? "تكلفة الركام الكلي (رمل وحصى)" : "Aggregate Cost"}</span>
            <strong className="text-sm font-mono text-slate-800 dark:text-white">
              {formatCost(analysis.costOptimization.aggregateCost)}
            </strong>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl">
            <span className="text-[9.5px] text-slate-400 block mb-0.5">{isAr ? "تكلفة الإضافات الكيميائية" : "Admixture Cost"}</span>
            <strong className="text-sm font-mono text-slate-800 dark:text-white">
              {formatCost(analysis.costOptimization.admixtureCost)}
            </strong>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-xl">
            <span className="text-[9.5px] text-indigo-500 block mb-0.5">{isAr ? "تكلفة المتر المكعب الكلية:" : "Total Cost / m³:"}</span>
            <strong className="text-sm font-mono text-indigo-700 dark:text-indigo-400 font-black">
              {formatCost(analysis.costOptimization.totalCost)}
            </strong>
          </div>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/65 p-3 rounded-2xl">
          {isAr ? analysis.costOptimization.opportunityAr : analysis.costOptimization.opportunityEn}
        </p>
      </div>

      {/* BLOCK 4: REASSURING CONCLUSION & SUMMARY */}
      <div className="pt-4 border-t border-indigo-50 dark:border-slate-800/60 text-right space-y-3">
        <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center justify-end gap-1 flex-row-reverse">
          <FileCheck2 className="w-4 h-4" />
          <span>{isAr ? "الخلاصة التقييمية الهندسية النهائية (AI Recommendation)" : "Final AI Advisory Technical Conclusions"}</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="font-black text-indigo-600 block mb-1">💪 {isAr ? "تقييم المقاومة" : "Strength"}</span>
            <p className="text-[10.5px] text-slate-550">{isAr ? c.strengthAr : c.strength}</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="font-black text-indigo-600 block mb-1">🛡️ {isAr ? "تقييم الديمومة" : "Durability"}</span>
            <p className="text-[10.5px] text-slate-550">{isAr ? c.durabilityAr : c.durability}</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="font-black text-indigo-600 block mb-1">🌊 {isAr ? "قوام الشغل" : "Workability"}</span>
            <p className="text-[10.5px] text-slate-550">{isAr ? c.workabilityAr : c.workability}</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="font-black text-indigo-600 block mb-1">💰 {isAr ? "الجدوى الاقتصادية" : "Economical"}</span>
            <p className="text-[10.5px] text-slate-550">{isAr ? c.economicAr : c.economic}</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="font-black text-emerald-600 block mb-1">🌱 {isAr ? "معايرة الاستدامة" : "Sustainability"}</span>
            <p className="text-[10.5px] text-slate-550">{isAr ? c.sustainabilityAr : c.sustainability}</p>
          </div>
        </div>
      </div>
      
    </div>
  );
};
