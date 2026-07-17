import React from "react";
import { 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Compass, 
  Layers, 
  Globe 
} from "lucide-react";

interface MethodInfo {
  name: string;
  fullName: string;
  origin: string;
  concept: string;
  pros: string[];
  cons: string[];
  suitability: string;
  formula?: string;
}

interface MethodInfoCardProps {
  methodId: "dreux";
}

const methodsData: Record<string, MethodInfo> = {
  dreux: {
    name: "مـنهـج درو-غـوريـس",
    fullName: "Dreux-Gorisse Method",
    origin: "منهاج فرنسي ريادي طوره Georges Dreux والمختص Gorisse في السبعينات. معتمد على نطاق واسع في المواصفات القياسية الجزائرية (CRA) والفرنسية (NF).",
    concept: "يعتمد على رسم منحنى تدرج حبيبي مثالي ذي نقطة انكسار (Point de brisure) تجمع حبيبات الرمل الخشن والحصى بدقة، مع ضرب الحسابات بمعامل تصحيح يراعي طريقة دمك الخرسانة ومقاس الحصويات لضمان الكثافة الرصية العظمى.",
    pros: [
      "دقة متناهية تحت ظروف دمك الموقع المتغيرة واختلاف مقاس حديد التسليح.",
      "الحصول على خرسانة متراصة ذات فراغات شعرية ضئيلة ونفاذية ماء منخفضة جداً.",
      "ملاءمة ومطابقة كاملة للركامات والرمال المتوفرة محلياً في الجزائر وشمال إفريقيا."
    ],
    cons: [
      "يتطلب حسابات يدوية ورسوماً بيانية معقدة لتقاطع تدرج الرمل والحصى.",
      "حساس لتغير جودة الركام ونوعية التكسير بالمقالع الحجرية مما يتطلب إعادة المعايرة رسمياً."
    ],
    suitability: "المنشآت الإنشائية العامة، الأعمدة، الجدران الاستنادية، والخرسانة المسلحة التقليدية ذات الكثافة العالية والديمومة المضمونة.",
    formula: "P = 50 + (Dmx / 2) + K + F (معادلة تحديد نقطة التقاطع وتوزيع الرمل والحجر)"
  }
};

export const MethodInfoCard: React.FC<MethodInfoCardProps> = ({ methodId }) => {
  const info = methodsData[methodId] || methodsData.dreux;

  return (
    <div 
      className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 text-right font-sans transition-all duration-350 animate-fade-in"
      id={`method-info-card-${methodId}`}
    >
      
      {/* Title Header with Icon */}
      <div className="flex justify-between items-start gap-4 flex-row-reverse border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5 flex-row-reverse">
          <div className="p-2 bg-indigo-600/10 rounded-lg text-indigo-500">
            <BookOpen size={18} />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center justify-end gap-1.5 leading-snug">
              <span>{info.name}</span>
              <span className="text-[10px] text-indigo-500 font-mono font-bold tracking-wider uppercase bg-indigo-100 dark:bg-indigo-950/50 p-0.5 px-1.5 rounded">
                {info.fullName}
              </span>
            </h4>
            <p className="text-[9.5px] text-slate-400 mt-0.5">شرح فني لتاريخ وآلية العمل ومميزات الاستخدام الموقعي</p>
          </div>
        </div>
        <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold p-1 px-2.5 rounded-full">
          الدليل الهندسي للمهندسين
        </span>
      </div>

      {/* Grid: Context & Concept */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Origin block */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 flex items-center justify-end gap-1">
            <span>المنشأ والأصل التاريخي</span>
            <Globe size={11} className="text-indigo-400" />
          </span>
          <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200/50 dark:border-slate-700">
            {info.origin}
          </p>
        </div>

        {/* Theoretical Concept */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 flex items-center justify-end gap-1">
            <span>الفكرة النظرية للمعادلة وآلية الحساب</span>
            <Compass size={11} className="text-indigo-400" />
          </span>
          <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200/50 dark:border-slate-700">
            {info.concept}
          </p>
        </div>

      </div>

      {/* Formula foundation if exists */}
      {info.formula && (
        <div className="bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 border border-indigo-500/10 rounded-lg p-3 flex justify-between items-center flex-row-reverse text-right">
          <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">النموذج الرياضي المنظم:</span>
          <code className="text-xs font-black font-mono text-cyan-600 dark:text-cyan-400 tracking-wider">
            {info.formula}
          </code>
        </div>
      )}

      {/* Pros & Cons grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        
        {/* Pros card list */}
        <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg space-y-1.5 text-right">
          <span className="text-[10.5px] font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
            <span>المميزات والفوائد الفنية</span>
            <CheckCircle2 size={13} />
          </span>
          <ul className="space-y-1 text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans list-none">
            {info.pros.map((pro, index) => (
              <li key={`pro-${index}`} className="flex items-start gap-1 justify-end text-right">
                <span className="text-slate-700 dark:text-slate-300">{pro}</span>
                <span className="text-emerald-500 shrink-0 select-none mt-0.5">•</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cons catalog */}
        <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-lg space-y-1.5 text-right">
          <span className="text-[10.5px] font-black text-rose-600 dark:text-rose-450 flex items-center justify-end gap-1">
            <span>السلبيات والمحاذير بالموقع</span>
            <XCircle size={13} />
          </span>
          <ul className="space-y-1 text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
            {info.cons.map((con, index) => (
              <li key={`con-${index}`} className="flex items-start gap-1 justify-end text-right">
                <span className="text-slate-700 dark:text-slate-300">{con}</span>
                <span className="text-rose-400 shrink-0 select-none mt-0.5">•</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Suitability Footer summary row */}
      <div className="p-3 bg-blue-500/5 dark:bg-blue-950/15 border border-blue-500/10 rounded-lg text-right flex flex-col gap-1">
        <span className="text-[10.5px] font-black text-blue-600 dark:text-blue-400 flex items-center justify-end gap-1">
          <span>أفضل ملاءمة للتطبيق العملي (Best Application Match)</span>
          <Layers size={13} />
        </span>
        <span className="text-[10.5px] text-slate-700 dark:text-slate-300 leading-normal font-sans">
          {info.suitability}
        </span>
      </div>

    </div>
  );
};
