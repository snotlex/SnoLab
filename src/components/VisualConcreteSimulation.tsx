import React, { useState, useEffect } from "react";
import { 
  Droplet, 
  Layers, 
  Sliders, 
  Play, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Sparkles,
  Zap,
  Activity,
  FileText
} from "lucide-react";

// Types for simulation inputs
interface SimulationInputs {
  slump: number;          // in cm (2 to 25)
  waterContent: number;   // L/m3 (100 to 250)
  cementContent: number;  // kg/m3 (200 to 550)
  aggregateRatio: number; // Fine aggregate % (30 to 70)
}

// Structural element types
type StructuralElement = "column" | "beam" | "slab" | "foundation";

export function VisualConcreteSimulation() {
  // 1. Initial State
  const [inputs, setInputs] = useState<SimulationInputs>({
    slump: 12,
    waterContent: 175,
    cementContent: 350,
    aggregateRatio: 45,
  });

  const [activeElement, setActiveElement] = useState<StructuralElement>("column");
  const [isPouring, setIsPouring] = useState<boolean>(false);
  const [pourProgress, setPourProgress] = useState<number>(100);
  const [isVibrating, setIsVibrating] = useState<boolean>(false);

  // 2. Determine Mix State Categorization (Dry, Optimal, Wet)
  const determineMixState = (): "dry" | "optimal" | "wet" => {
    const wcRatio = inputs.waterContent / inputs.cementContent;
    
    // Very low water, low slump = Dry Mix
    if (wcRatio < 0.42 || inputs.slump <= 6) {
      return "dry";
    }
    // High water, high slump = Wet Mix
    if (wcRatio > 0.63 || inputs.slump >= 18) {
      return "wet";
    }
    // Perfect sweet spot
    return "optimal";
  };

  const mixState = determineMixState();

  // 3. Preset Selectors
  const applyPreset = (type: "dry" | "optimal" | "wet") => {
    setIsPouring(false);
    setPourProgress(0);
    if (type === "dry") {
      setInputs({
        slump: 4,
        waterContent: 130,
        cementContent: 370,
        aggregateRatio: 38,
      });
    } else if (type === "optimal") {
      setInputs({
        slump: 12,
        waterContent: 175,
        cementContent: 350,
        aggregateRatio: 44,
      });
    } else {
      setInputs({
        slump: 22,
        waterContent: 225,
        cementContent: 310,
        aggregateRatio: 52,
      });
    }
    
    // Auto-trigger a brief animation pour
    setTimeout(() => {
      setIsPouring(true);
      setPourProgress(0);
    }, 100);
  };

  // 4. Handle Pouring Animation
  useEffect(() => {
    let interval: any;
    if (isPouring && pourProgress < 100) {
      interval = setInterval(() => {
        setPourProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsPouring(false);
            return 100;
          }
          return prev + 4;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPouring, pourProgress]);

  const triggerPour = () => {
    setPourProgress(0);
    setIsPouring(true);
    setIsVibrating(true);
    setTimeout(() => setIsVibrating(false), 2000);
  };

  // Live Calculations for Diagnostics
  const wcRatio = inputs.waterContent / inputs.cementContent;
  const estimatedStrength28d = Math.round(
    28 * (inputs.cementContent / (inputs.waterContent + 10)) - 8
  );

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl" id="visual-simulation-panel">
      
      {/* 2.1 Hero Header */}
      <div className="backdrop-blur-md bg-gradient-to-l from-slate-900 via-[#1E293B] to-[#0F172A] border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Abstract blueprint background lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 justify-end md:justify-start">
              <span className="bg-blue-500/10 text-blue-400 text-[10px] font-sans font-black tracking-widest px-2.5 py-1 rounded-full uppercase border border-blue-500/20">
                AISTUDIO PREVIEW BUILD
              </span>
              <span className="bg-amber-400 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <Sparkles size={10} /> جديد
              </span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">
              المحاكاة الهندسية البصرية لصب واستجابة الخرسانة
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              محرك ديناميكي متطور لمحاكاة قوام الخلطة الخرسانية وسلوك تدفقها داخل قوالب الصب المختلفة حسب كود البناء وعوامل التشغيلية، مع تشخيص مباشر للعيوب والملاحظات الهندسية الفورية.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => applyPreset("dry")}
              className={`px-4 py-2 text-xs font-black rounded-xl border transition-all ${
                mixState === "dry" 
                  ? "bg-amber-500/20 text-amber-400 border-amber-500" 
                  : "bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800"
              }`}
            >
              خلطة جافة (Dry Mix)
            </button>
            <button
              onClick={() => applyPreset("optimal")}
              className={`px-4 py-2 text-xs font-black rounded-xl border transition-all ${
                mixState === "optimal" 
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500" 
                  : "bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800"
              }`}
            >
              خلطة مثالية (Optimal)
            </button>
            <button
              onClick={() => applyPreset("wet")}
              className={`px-4 py-2 text-xs font-black rounded-xl border transition-all ${
                mixState === "wet" 
                  ? "bg-cyan-500/20 text-cyan-400 border-cyan-500" 
                  : "bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800"
              }`}
            >
              خلطة رطبة (Wet Mix)
            </button>
          </div>
        </div>
      </div>

      {/* 2.2 Dashboard Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Control Panel Column (4 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-[#111827]/30 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-5">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-black">Adjust Variables</span>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5 direction-rtl">
                <Sliders size={16} className="text-blue-500" />
                <span>عوامل التحكم التفاعلية</span>
              </h3>
            </div>

            {/* SLIDER 1: SLUMP */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-black text-blue-500">
                  {inputs.slump} سم
                </span>
                <span className="font-extrabold text-slate-700 dark:text-slate-350 flex items-center gap-1">
                  هبوط القوام (Slump Value)
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="25"
                step="1"
                value={inputs.slump}
                onChange={(e) => setInputs(prev => ({ ...prev, slump: parseInt(e.target.value) }))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>تصلب مرتفع (S1)</span>
                <span>متوسط (S3)</span>
                <span>سائل جداً (S5)</span>
              </div>
            </div>

            {/* SLIDER 2: WATER CONTENT */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-black text-cyan-500">
                  {inputs.waterContent} لتر/م³
                </span>
                <span className="font-extrabold text-slate-700 dark:text-slate-350 flex items-center gap-1">
                  <Droplet size={12} className="text-cyan-500" /> محتوى الماء الحر (Water Content)
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="250"
                step="5"
                value={inputs.waterContent}
                onChange={(e) => setInputs(prev => ({ ...prev, waterContent: parseInt(e.target.value) }))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>100 لتر (شديد الصلابة)</span>
                <span>175 لتر</span>
                <span>250 لتر (ميوعة عالية)</span>
              </div>
            </div>

            {/* SLIDER 3: CEMENT CONTENT */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-black text-indigo-500">
                  {inputs.cementContent} كجم/م³
                </span>
                <span className="font-extrabold text-slate-700 dark:text-slate-350 flex items-center gap-1">
                  <Layers size={12} className="text-indigo-500" /> محتوى الأسمنت الصافي (Cement Content)
                </span>
              </div>
              <input
                type="range"
                min="200"
                max="550"
                step="10"
                value={inputs.cementContent}
                onChange={(e) => setInputs(prev => ({ ...prev, cementContent: parseInt(e.target.value) }))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>200 كجم (خلطة فقيرة)</span>
                <span>350 كجم (معياري)</span>
                <span>550 كجم (محتوى مرتفع للغاية)</span>
              </div>
            </div>

            {/* SLIDER 4: AGGREGATE % */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-black text-amber-500 font-mono">
                  {inputs.aggregateRatio}% رمل / {100 - inputs.aggregateRatio}% بحص
                </span>
                <span className="font-extrabold text-slate-700 dark:text-slate-350 flex items-center gap-1">
                  نسبة تدرج الركام (Aggregate Fine ratio)
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="70"
                step="2"
                value={inputs.aggregateRatio}
                onChange={(e) => setInputs(prev => ({ ...prev, aggregateRatio: parseInt(e.target.value) }))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>30% رمل (بحص خشن كثير)</span>
                <span>مناصفة 50%</span>
                <span>70% رمل (خلطة رملية ناعمة)</span>
              </div>
            </div>

            {/* Quick Math KPI Panel */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-right">
              <div>
                <span className="text-[10px] font-black text-slate-400 block font-mono">WATER / CEMENT RATIO</span>
                <span className="text-xl font-black font-mono block text-blue-600 dark:text-blue-400 mt-1">
                  {wcRatio.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {wcRatio < 0.4 ? "نسبة منخفضة مجهدة للصب" : wcRatio > 0.6 ? "نسبة مرتفعة تضعف المقاومة" : "نسبة مثالية ممتازة"}
                </span>
              </div>
              <div className="border-r border-slate-200 dark:border-slate-800 pr-4">
                <span className="text-[10px] font-black text-slate-400 block font-mono">EST. 28-DAY STRENGTH</span>
                <span className="text-xl font-black font-mono block text-emerald-600 dark:text-emerald-400 mt-1">
                  ~ {estimatedStrength28d} MPa
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  قوة الضغظ التقريبية المقدرة
                </span>
              </div>
            </div>

          </div>

          {/* Quick Guidance Card */}
          <div className="bg-slate-100/50 dark:bg-slate-900/20 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-4 space-y-2.5">
            <h4 className="text-xs font-black text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
              <Info size={14} className="text-amber-500" />
              <span>معلومة هندسية حول التشغيلية</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
              يُنصح هندسياً باستخدام **الملدنات الفائقة (Superplasticizers)** لرفع قيمة هبوط الخرسانة (التميع والتشغيلية) بدلاً من صب كميات مياه إضافية لضمان سلامة مقاومة الخرسانة ومقاومة ظهور شقوق الانكماش اللدن.
            </p>
          </div>
        </div>

        {/* Right Simulation Sandbox (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-[#111827]/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl relative flex flex-col justify-between">
            
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setActiveElement("column"); setPourProgress(100); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeElement === "column" 
                      ? "bg-blue-600 text-white shadow"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  عمود (Column)
                </button>
                <button
                  onClick={() => { setActiveElement("beam"); setPourProgress(100); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeElement === "beam" 
                      ? "bg-blue-600 text-white shadow"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  جسر/كمرة (Beam)
                </button>
                <button
                  onClick={() => { setActiveElement("slab"); setPourProgress(100); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeElement === "slab" 
                      ? "bg-blue-600 text-white shadow"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  بلاطة (Slab)
                </button>
                <button
                  onClick={() => { setActiveElement("foundation"); setPourProgress(100); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeElement === "foundation" 
                      ? "bg-blue-600 text-white shadow"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  أساس (Foundation)
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={triggerPour}
                  disabled={isPouring}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-1.5 pointer-events-auto cursor-pointer shadow-md shadow-emerald-600/10"
                >
                  <Play size={12} className="fill-current" />
                  <span>محاكاة الصب والهز</span>
                </button>
                <button
                  onClick={() => setPourProgress(100)}
                  className="p-1.5 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 rounded-lg text-slate-500"
                  title="إعادة ضبط الصب"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            {/* Interactive SVG Animation Frame */}
            <div className="relative h-[280px] bg-slate-950 dark:bg-black/40 rounded-2xl overflow-hidden mt-4 border border-slate-850 flex items-center justify-center">
              
              {/* Dynamic vibrating filter or effect */}
              <div className={`absolute inset-0 flex items-center justify-center transition-all ${
                isVibrating ? "animate-[bounce_0.2s_infinite_alternate]" : ""
              }`}>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent pointer-events-none z-10"></div>
                
                {/* SVG Visualizations of structures & concrete behavior */}
                <svg viewBox="0 0 500 240" className="w-full h-full max-w-[440px] px-2" xmlns="http://www.w3.org/2000/svg">
                  
                  {/* DRAW STRUCTURE 1: COLUMN */}
                  {activeElement === "column" && (
                    <g>
                      {/* Formwork Outlines (قوالب الخشب) */}
                      <line x1="170" y1="10" x2="170" y2="230" stroke="#a16207" strokeWidth="4" strokeDasharray="3 3" />
                      <line x1="330" y1="10" x2="330" y2="230" stroke="#a16207" strokeWidth="4" strokeDasharray="3 3" />
                      
                      {/* Vertical Rebars (حديد التسليح الطولي) */}
                      <line x1="195" y1="10" x2="195" y2="230" stroke="#64748b" strokeWidth="3" />
                      <line x1="250" y1="10" x2="250" y2="230" stroke="#475569" strokeWidth="1.5" strokeDasharray="5 5" />
                      <line x1="305" y1="10" x2="305" y2="230" stroke="#64748b" strokeWidth="3" />
                      
                      {/* Stirrups (الكانات الأفقية) */}
                      <line x1="195" y1="40" x2="305" y2="40" stroke="#64748b" strokeWidth="1.5" />
                      <line x1="195" y1="80" x2="305" y2="80" stroke="#64748b" strokeWidth="1.5" />
                      <line x1="195" y1="120" x2="305" y2="120" stroke="#64748b" strokeWidth="1.5" />
                      <line x1="195" y1="160" x2="305" y2="160" stroke="#64748b" strokeWidth="1.5" />
                      <line x1="195" y1="200" x2="305" y2="200" stroke="#64748b" strokeWidth="1.5" />

                      {/* CONCRETE FILLING PATHS */}
                      <path
                        d={`M 172 228 
                            L 172 ${230 - (220 * pourProgress / 100)} 
                            ${mixState === "dry" 
                              ? "Q 250 " + (215 - (220 * pourProgress / 100)) + " 328 " + (230 - (220 * pourProgress / 100)) 
                              : "L 328 " + (230 - (220 * pourProgress / 100))} 
                            L 328 228 Z`}
                        fill={
                          mixState === "dry" ? "url(#dryConcreteGradient)" :
                          mixState === "wet" ? "url(#wetConcreteGradient)" :
                          "url(#optimalConcreteGradient)"
                        }
                        opacity="0.9"
                      />

                      {/* STIFF AND AIR HOLES FOR DRY MIX (تعشيش) */}
                      {mixState === "dry" && pourProgress > 30 && (
                        <g>
                          {/* Honeycombing symbols near reinforcement */}
                          <circle cx="185" cy="190" r="11" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="3 3" />
                          <circle cx="315" cy="110" r="13" fill="none" stroke="#ea580c" strokeWidth="2" strokeDasharray="4 2" />
                          <circle cx="210" cy="70" r="10" fill="none" stroke="#ea580c" strokeWidth="3" />
                          {/* Aggregate piles */}
                          <circle cx="318" cy="195" r="4" fill="#64748b" />
                          <circle cx="323" cy="202" r="6" fill="#475569" />
                          <circle cx="312" cy="208" r="5" fill="#334155" />
                          
                          <circle cx="183" cy="140" r="5" fill="#64748b" />
                          <circle cx="178" cy="147" r="6" fill="#475569" />
                          
                          <text x="250" y="160" fill="#f59e0b" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
                            خطر تعشيش (Honeycombing)
                          </text>
                        </g>
                      )}

                      {/* SEGREGATION & BLEEDING FOR WET MIX (انفصال حركي ونزيف الماء) */}
                      {mixState === "wet" && pourProgress > 40 && (
                        <g>
                          {/* Water bleeding line on top */}
                          <rect x="172" y={Math.max(12, 222 - (220 * pourProgress / 100))} width="156" height="6" fill="#38bdf8" opacity="0.6" />
                          {/* Water droplets symbol up the forms */}
                          <circle cx="210" cy={232 - (220 * pourProgress / 100)} r="2" fill="#0ea5e9" />
                          <circle cx="250" cy={228 - (220 * pourProgress / 100)} r="2" fill="#38bdf8" />
                          <circle cx="290" cy={233 - (220 * pourProgress / 100)} r="1.5" fill="#0ea5e9" />
                          
                          {/* Bottom aggregate deposition (coarse sinking) */}
                          <circle cx="200" cy="215" r="6" fill="#475569" />
                          <circle cx="225" cy="220" r="8" fill="#334155" />
                          <circle cx="250" cy="212" r="7" fill="#64748b" />
                          <circle cx="275" cy="222" r="9" fill="#1e293b" />
                          <circle cx="300" cy="216" r="6" fill="#475569" />

                          <text x="250" y="175" fill="#38bdf8" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
                            قوام رخو / انفصال ركام حاد
                          </text>
                        </g>
                      )}

                      {/* PERFECT MONOLITHIC MASS FOR OPTIMAL MIX */}
                      {mixState === "optimal" && pourProgress > 60 && (
                        <g>
                          <circle cx="250" cy="110" r="14" fill="#10b981" fillOpacity="0.1" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" />
                          <path d="M 242 110 L 248 116 L 258 106" stroke="#10b981" strokeWidth="2.5" fill="none" />
                          <text x="250" y="86" fill="#10b981" fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
                            صب متجانس مثالي (Homogeneous)
                          </text>
                        </g>
                      )}
                    </g>
                  )}

                  {/* DRAW STRUCTURE 2: BEAM */}
                  {activeElement === "beam" && (
                    <g>
                      {/* Horizontal span formwork */}
                      <line x1="30" y1="180" x2="470" y2="180" stroke="#a16207" strokeWidth="4" strokeDasharray="4 4" />
                      <line x1="30" y1="70" x2="470" y2="70" stroke="#a16207" strokeWidth="4" strokeDasharray="4 4" />

                      {/* Reinforcement steel Cage (أرجل حديد مع الكانات الأفقية) */}
                      <line x1="45" y1="85" x2="455" y2="85" stroke="#64748b" strokeWidth="3" />
                      <line x1="45" y1="165" x2="455" y2="165" stroke="#64748b" strokeWidth="3" />
                      
                      {/* Vertical Stirrup hooks (الأساور الطوقية) */}
                      <line x1="80" y1="85" x2="80" y2="165" stroke="#475569" strokeWidth="2" />
                      <line x1="160" y1="85" x2="160" y2="165" stroke="#475569" strokeWidth="2" />
                      <line x1="240" y1="85" x2="240" y2="165" stroke="#475569" strokeWidth="2" />
                      <line x1="320" y1="85" x2="320" y2="165" stroke="#475569" strokeWidth="2" />
                      <line x1="400" y1="85" x2="400" y2="165" stroke="#475569" strokeWidth="2" />

                      {/* CONCRETE FULL LEVEL MASS */}
                      <path
                        d={`M 30 178 
                            L 30 ${180 - (105 * pourProgress / 100)} 
                            ${mixState === "dry" 
                              ? "Q 250 " + (165 - (105 * pourProgress / 100)) + " 470 " + (180 - (105 * pourProgress / 100)) 
                              : "L 470 " + (180 - (105 * pourProgress / 100))} 
                            L 470 178 Z`}
                        fill={
                          mixState === "dry" ? "url(#dryConcreteGradient)" :
                          mixState === "wet" ? "url(#wetConcreteGradient)" :
                          "url(#optimalConcreteGradient)"
                        }
                        opacity="0.9"
                      />

                      {/* SHEAR CRACK RISK OR HONEYCOMBING IN BEAMS */}
                      {mixState === "dry" && pourProgress > 40 && (
                        <g>
                          <path d="M 120 180 L 140 120" stroke="#f97316" strokeWidth="2" />
                          <path d="M 360 180 L 340 120" stroke="#f97316" strokeWidth="2" />
                          <circle cx="240" cy="120" r="14" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeDasharray="3 3" />
                          <text x="240" y="152" fill="#f59e0b" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
                            ضعف تغطية كمرات وجسور (Voids)
                          </text>
                        </g>
                      )}

                      {/* BLEEDING IN BEAM */}
                      {mixState === "wet" && pourProgress > 40 && (
                        <g>
                          <rect x="30" y={178 - (105 * pourProgress / 100)} width="440" height="4" fill="#38bdf8" opacity="0.6" />
                          <text x="240" y="145" fill="#38bdf8" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
                            ظاهرة النزف السطحي وطبقة اللباني الضعيفة (Laitance)
                          </text>
                        </g>
                      )}

                      {/* GREEN CHECK IN BEAM */}
                      {mixState === "optimal" && pourProgress > 65 && (
                        <g>
                          <path d="M 235 125 L 242 132 L 258 118" stroke="#10b981" strokeWidth="3" fill="none" />
                          <text x="240" y="105" fill="#10b981" fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
                            التحام مثالي وتغطية كاملة للحديد السفلي والعلوي
                          </text>
                        </g>
                      )}
                    </g>
                  )}

                  {/* DRAW STRUCTURE 3: SLAB */}
                  {activeElement === "slab" && (
                    <g>
                      {/* Slab base formwork */}
                      <line x1="20" y1="190" x2="480" y2="190" stroke="#a16207" strokeWidth="4" />
                      
                      {/* Double Layer Reinforcement mesh (شبكة حديد علوية وسفلية) */}
                      <line x1="30" y1="175" x2="470" y2="175" stroke="#4b5563" strokeWidth="2" />
                      <line x1="30" y1="140" x2="470" y2="140" stroke="#4b5563" strokeWidth="2" />

                      {/* Spacer supports (كراسي الحديد) */}
                      <path d="M 80 175 L 90 140 M 180 175 L 190 140 M 280 175 L 290 140 M 380 175 L 390 140" stroke="#6b7280" strokeWidth="1.5" />

                      {/* Slab Solid concrete pour */}
                      <path
                        d={`M 20 188 
                            L 20 ${188 - (75 * pourProgress / 100)} 
                            L 480 ${188 - (75 * pourProgress / 100)} 
                            L 480 188 Z`}
                        fill={
                          mixState === "dry" ? "url(#dryConcreteGradient)" :
                          mixState === "wet" ? "url(#wetConcreteGradient)" :
                          "url(#optimalConcreteGradient)"
                        }
                        opacity="0.9"
                      />

                      {/* CRACKS IN SLABS */}
                      {mixState === "dry" && pourProgress > 50 && (
                        <g>
                          {/* Shrinkage cracks */}
                          <path d="M 150 113 L 155 125 L 152 135" stroke="#f97316" strokeWidth="2" fill="none" />
                          <path d="M 320 113 L 325 122 L 321 138" stroke="#f97316" strokeWidth="2" fill="none" />
                          <text x="240" y="125" fill="#f59e0b" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
                            شقوق انكماش جاف مبكرة
                          </text>
                        </g>
                      )}

                      {/* BLEEDING IN SLABS (نزيف مياه صاعد) */}
                      {mixState === "wet" && pourProgress > 50 && (
                        <g>
                          <rect x="20" y={188 - (75 * pourProgress / 100)} width="460" height="4" fill="#38bdf8" opacity="0.6" />
                          <text x="240" y="130" fill="#38bdf8" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
                            صعود الماء الحر للأعلى وتبرقش السطح (Shrinkage Map)
                          </text>
                        </g>
                      )}

                      {/* OPTIMAL RESULTS SLABS */}
                      {mixState === "optimal" && pourProgress > 65 && (
                        <g>
                          <text x="240" y="130" fill="#10b981" fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
                            انضغاط مستو وتوزيع متوازن للرطوبة دون تسرب
                          </text>
                        </g>
                      )}
                    </g>
                  )}

                  {/* DRAW STRUCTURE 4: FOUNDATION */}
                  {activeElement === "foundation" && (
                    <g>
                      {/* Heavy trench formwork sides */}
                      <path d="M 40 50 L 40 210 L 460 210 L 460 50" fill="none" stroke="#a16207" strokeWidth="4" />
                      
                      {/* Concrete Cover Blocks (بسكويت الخرسانية الحامية) */}
                      <rect x="100" y="200" width="12" height="8" fill="#475569" />
                      <rect x="244" y="200" width="12" height="8" fill="#475569" />
                      <rect x="388" y="200" width="12" height="8" fill="#475569" />

                      {/* Heavy rib mesh for foundations */}
                      <line x1="50" y1="190" x2="450" y2="190" stroke="#4b5563" strokeWidth="4" />
                      <line x1="50" y1="160" x2="450" y2="160" stroke="#4b5563" strokeWidth="3" />

                      {/* Pour level filling */}
                      <path
                        d={`M 42 208 
                            L 42 ${208 - (150 * pourProgress / 100)} 
                            ${mixState === "dry" 
                              ? "Q 250 " + (190 - (150 * pourProgress / 100)) + " 458 " + (208 - (150 * pourProgress / 100)) 
                              : "L 458 " + (208 - (150 * pourProgress / 100))} 
                            L 458 208 Z`}
                        fill={
                          mixState === "dry" ? "url(#dryConcreteGradient)" :
                          mixState === "wet" ? "url(#wetConcreteGradient)" :
                          "url(#optimalConcreteGradient)"
                        }
                        opacity="0.9"
                      />

                      {/* EXTREME HONEYCOMBING UNDER REBAR SEAT */}
                      {mixState === "dry" && pourProgress > 40 && (
                        <g>
                          <circle cx="250" cy="175" r="16" fill="none" stroke="#ea580c" strokeWidth="3" strokeDasharray="3 3" />
                          <text x="250" y="145" fill="#f59e0b" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
                            غياب التربيط بالهز وتكتل كتل صخرية بالأساس
                          </text>
                        </g>
                      )}

                      {/* WATER SEEPAGE OR COLD JOINT RISK FOR WET */}
                      {mixState === "wet" && pourProgress > 40 && (
                        <g>
                          <rect x="42" y={208 - (150 * pourProgress / 100)} width="416" height="5" fill="#38bdf8" opacity="0.6" />
                          <text x="250" y="140" fill="#38bdf8" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
                            نزح مائي ونضح يؤدي إلى ضعف شديد في قاع الأساس
                          </text>
                        </g>
                      )}

                      {/* OPTIMAL RESULTS IN FOUNDATION */}
                      {mixState === "optimal" && pourProgress > 60 && (
                        <g>
                          <text x="250" y="120" fill="#10b981" fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
                            رص مثالي يغلف جدران حديد التسليح الضخم تماماً
                          </text>
                        </g>
                      )}
                    </g>
                  )}

                  {/* DEFINITION & GRADIENTS FOR DIFFERENT MIX LOOKS */}
                  <defs>
                    {/* Optimal Mix Color: Flat Dense Professional Slate/Charcoal Gray */}
                    <linearGradient id="optimalConcreteGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#828b94" />
                      <stop offset="50%" stopColor="#6C757D" />
                      <stop offset="100%" stopColor="#495057" />
                    </linearGradient>

                    {/* Dry Mix Color: Dusty Light Gray, Gritty with Sand feel */}
                    <linearGradient id="dryConcreteGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#B3B8BC" />
                      <stop offset="60%" stopColor="#9CA1A5" />
                      <stop offset="100%" stopColor="#7B8084" />
                    </linearGradient>

                    {/* Wet Mix Color: Very Dark Slate/Gray with separation hint */}
                    <linearGradient id="wetConcreteGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#4A4E51" />
                      <stop offset="40%" stopColor="#3D4144" />
                      <stop offset="100%" stopColor="#2D3032" />
                    </linearGradient>
                  </defs>

                </svg>

              </div>

              {/* Float Diagnostics Overlay */}
              <div className="absolute top-3 right-3 bg-slate-900/90 border border-slate-700/50 px-3 py-1.5 rounded-lg text-[9.5px] text-slate-100 font-mono flex items-center gap-1.5 z-20">
                <span className={`w-2 h-2 rounded-full ${
                  mixState === "optimal" ? "bg-emerald-500 animate-pulse" :
                  mixState === "dry" ? "bg-amber-500" :
                  "bg-cyan-400"
                }`}></span>
                <span className="font-extrabold">
                  {mixState === "optimal" ? "فئة الخلطة: مثالية ومتماسكة" :
                   mixState === "dry" ? "فئة الخلطة: جافة وشديدة الجساوة" :
                   "فئة الخلطة: رخوة جداً ومعرضة للانفصال"}
                </span>
              </div>
              
              {/* Dynamic Pouring Loader message */}
              {isPouring && (
                <div className="absolute bottom-3 left-3 bg-blue-950/95 border border-blue-800 px-3 py-1 rounded-md text-[9px] text-blue-300 font-sans tracking-wide z-20 flex items-center gap-1">
                  <Activity size={10} className="animate-spin" />
                  <span>جاري صب المزيج واستجابة الهز الميكانيكي... {pourProgress}%</span>
                </div>
              )}
            </div>

            {/* Bottom State Checklist Indicator Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              
              {/* Box 1: Cohesion */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800">
                <span className="text-[9px] text-slate-500 block">التماسك الكلي واللزوجة</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] font-black dark:text-white">
                    {mixState === "optimal" ? "عالي جداً ومترابط" :
                     mixState === "dry" ? "معدوم (حبيبات متفتتة)" :
                     "ضعيف (انفصالConstituents)"}
                  </span>
                  {mixState === "optimal" ? (
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  ) : (
                    <AlertTriangle size={14} className={mixState === "dry" ? "text-amber-500" : "text-cyan-550"} />
                  )}
                </div>
              </div>

              {/* Box 2: Pumpability */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800">
                <span className="text-[9px] text-slate-500 block">قابلية الضخ الميكانيكي (Pumpability)</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] font-black dark:text-white">
                    {mixState === "optimal" ? "ممتاز (انسيابية تامة)" :
                     mixState === "dry" ? "مستحيل (انسداد المضخة)" :
                     "ممكن (لكن خطر حظر الركام)"}
                  </span>
                  {mixState === "optimal" ? (
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  ) : (
                    <AlertTriangle size={14} className="text-red-500" />
                  )}
                </div>
              </div>

              {/* Box 3: Compaction Need */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800">
                <span className="text-[9px] text-slate-500 block">الحاجة إلى الاهتزاز والدمك</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] font-black dark:text-white">
                    {mixState === "optimal" ? "معتدل (30 ثانية هز)" :
                     mixState === "dry" ? "فائق (دمك ميكانيكي خاص)" :
                     "معدوم (قد يسيل لوحده)"}
                  </span>
                  <Zap size={14} className={mixState === "optimal" ? "text-emerald-500" : "text-amber-500"} />
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* 2.3 Detailed Engineering Diagnostics Tabs */}
      <div className="bg-white dark:bg-[#111827]/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            <FileText size={16} className="text-indigo-500" />
            <span>التقرير والتحليل الهندسي المفصل لحالة الخلطة الحالية</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            مبني على كود الممارسات ومؤشرات عيارية للمقاومة والمتانة ودراسات الهبوط وقابلية التشغيل.
          </p>
        </div>

        {mixState === "dry" && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-extrabold text-[13px]">
              <AlertTriangle size={16} />
              <span>تحذير: الخلطة تعاني من جفاف شديد وضعف تشغيلية (Dry stiff Mix Defects)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <div className="space-y-1.5">
                <span className="font-extrabold block text-slate-900 dark:text-slate-100">الأثر الهندسي والمخاطر:</span>
                <ul className="list-disc list-inside space-y-1">
                  <li>ظهور **التعشيش (Honeycombing)** المكثف في المفاصل الرئيسية للصب والزوايا الضيقة.</li>
                  <li>فراغات هوائية غير مرغوبة حول قضبان حديد التسليح تقلل من تماسك الصلب بالخرسانة.</li>
                  <li>صعوبة بالغة ومجهدة جداً في الفرد اليدوي وسحب الخرسانة، مما يتطلب وقتاً أطول للانتهاء.</li>
                </ul>
              </div>
              <div className="space-y-1.5">
                <span className="font-extrabold block text-slate-900 dark:text-slate-100">التوصيات والإجراءات التصحيحية:</span>
                <ul className="list-disc list-inside space-y-1 text-emerald-600 dark:text-emerald-400">
                  <li>قم بإضافة ملدن فائق لرفع الانسيابية بشكل آمن دون زيادة نسبة الماء الكلية.</li>
                  <li>تأكد من فحص المحتوى الرطوبي للركام وتصحيحه لتشغيل أفضل.</li>
                  <li>زيادة نسبة الرمل الناعم (Fine ratio) قليلاً لتحسين لزوجة وحركة الحبيبات.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {mixState === "optimal" && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-emerald-605 dark:text-emerald-400 font-extrabold text-[13px]">
              <CheckCircle2 size={16} />
              <span>شهادة امتثال: خلطة متزنة وممتازة هندسياً (Balanced & Durable Design Compliance)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <div className="space-y-1.5">
                <span className="font-extrabold block text-slate-900 dark:text-slate-100">الأثر الهندسي والإيجابيات:</span>
                <ul className="list-disc list-inside space-y-1">
                  <li>وصول تام ومالئ للخرسانة لجميع جوانب قوالب الصب وتغليف مثالي للحديد.</li>
                  <li>مقاومة ممتازة تضمن حماية متينة للمنشأ من تسرب المياه الكبريتية وعوامل التآكل.</li>
                  <li>التصاق صلب تماسك مثالي وخروج فقاعات الهواء المزعجة بكفاءة تامة أثناء الاهتزاز الخفيف.</li>
                </ul>
              </div>
              <div className="space-y-1.5">
                <span className="font-extrabold block text-slate-900 dark:text-slate-100">تحسين الخلطة المستقبلي:</span>
                <ul className="list-disc list-inside space-y-1">
                  <li>استمر على هذه المقادير الموصى بها في الوثائق التجريبية للموقع.</li>
                  <li>راقب التغيرات في رطوبة الرمال الناتجة عن تغييرات حرارة النهار.</li>
                  <li>حافظ على نسبة الماء/الرابط (W/C) حول المستويات المحصورة بين **0.42 و 0.55**.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {mixState === "wet" && (
          <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-extrabold text-[13px]">
              <AlertTriangle size={16} />
              <span>تحذير: الخلطة رخوة جداً وغير مستقرة هندسياً (Bleeding & Segregation Defects)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <div className="space-y-1.5">
                <span className="font-extrabold block text-slate-900 dark:text-slate-100">الأثر الهندسي والمخاطر:</span>
                <ul className="list-disc list-inside space-y-1">
                  <li>**الانفصال الحبيبي (Segregation)** حيث يغوص الركام الخشن بينما يعلو معجون الإسمنت المخفف.</li>
                  <li>ظهور مشكلة **نزيف الماء (Bleeding)** الذي يشكل مسامات وتجاويف مجهرية تنتهي بتشققات سريعة.</li>
                  <li>ضعف فادح في مقاومة الضغط النهائية بـ 28 يوماً قد يهبط بالمقاومة بأكثر من **30%** عن المطلوب.</li>
                </ul>
              </div>
              <div className="space-y-1.5">
                <span className="font-extrabold block text-slate-900 dark:text-slate-100">التوصيات والإجراءات التصحيحية:</span>
                <ul className="list-disc list-inside space-y-1 text-red-500">
                  <li>خفض كمية مياه الخلط الحرة على الفور وحافظ على نسب الأسمنت.</li>
                  <li>أضف بودرة السيليكا فيوم أو الرماد المتطاير لزيادة كثافة المعجون وتماسكه.</li>
                  <li>في حال الرغبة في زيادة التميع من أجل الضخ لمستويات شاهقة، استعض بمثبطات أو ملدنات مناسبة الفعالية.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
