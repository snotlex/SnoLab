import React, { useState, useMemo } from "react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from "recharts";
import { 
  Droplet, 
  Thermometer, 
  Flame, 
  Info, 
  TrendingUp, 
  Award,
  AlertTriangle,
  Lightbulb,
  Wind,
  Sun,
  Shield,
  Activity,
  ArrowRight,
  TrendingDown,
  RefreshCw
} from "lucide-react";
import { MixDesignInput, MixDesignResult } from "../types";

interface StrengthSimulationPanelProps {
  input: MixDesignInput;
  result: MixDesignResult;
}

// Weather Preset Definition
interface WeatherPreset {
  id: string;
  nameAr: string;
  nameEn: string;
  temp: number; // °C
  rh: number; // %
  wind: number; // km/h
  concreteTemp: number; // °C
  descAr: string;
  descEn: string;
}

export const StrengthSimulationPanel: React.FC<StrengthSimulationPanelProps> = ({ 
  input, 
  result 
}) => {
  // Base target design characteristic strength is fully synchronized from parent inputs
  const fck28Override = input.fck28 || 25;

  // Weather States
  const [ambientTemp, setAmbientTemp] = useState<number>(32); // Summer daytime default
  const [humidity, setHumidity] = useState<number>(30); // Dry default
  const [windSpeed, setWindSpeed] = useState<number>(20); // Normal breeze
  const [concreteTemp, setConcreteTemp] = useState<number>(28); // Concrete temperature state
  const [cementTypeSelect, setCementTypeSelect] = useState<string>("CEM I");

  // Automatically detect cement class from parent inputs to ensure synchronized predictions
  const detectCementTypeClass = (name: string): string => {
    if (!name) return "CEM I";
    const upper = name.toUpperCase();
    if (upper.includes("CEM III") || upper.includes("CEM_III") || upper.includes("الأفران")) return "CEM III";
    if (upper.includes("CEM IV") || upper.includes("CEM_IV") || upper.includes("بوزولاني مركب") || upper.includes("بوزولانا")) return "CEM IV";
    if (upper.includes("CEM V") || upper.includes("CEM_V")) return "CEM V";
    if (upper.includes("CEM II") || upper.includes("CEM_II") || upper.includes("مركب")) return "CEM II";
    return "CEM I";
  };

  // Sync cement type selection with parent inputs
  React.useEffect(() => {
    if (input.cementType) {
      setCementTypeSelect(detectCementTypeClass(input.cementType));
    }
  }, [input.cementType]);

  // Weather Presets in Algeria
  const weatherPresets: WeatherPreset[] = [
    {
      id: "sahara",
      nameAr: "الصحراء الكبرى (أدرار / عين صالح)",
      nameEn: "Sahara Heat (Adrar / In Salah)",
      temp: 42,
      rh: 15,
      wind: 25,
      concreteTemp: 34,
      descAr: "حرارة مفرطة، رطوبة شبه منعدمة، ورياح مستمرة تسرع الجفاف والتشققات.",
      descEn: "Extremely hot and arid desert conditions. Evaporation-driven structural risk."
    },
    {
      id: "high_plateaus",
      nameAr: "شتاء الهضاب العليا (سطيف / باتنة)",
      nameEn: "High Plateaus Winter (Setif / Batna)",
      temp: 6,
      rh: 85,
      wind: 15,
      concreteTemp: 12,
      descAr: "طقس شتوي بارد ورطب. يبطئ تفاعل الصلابة بدرجة كبيرة لكنه يقلل التبخر.",
      descEn: "Cold mountain air. Minimizes evaporation but severely stunts early strength."
    },
    {
      id: "coastal",
      nameAr: "الربيع الساحلي (الجزائر العاصمة / وهران)",
      nameEn: "Coastal Spring (Algiers / Oran)",
      temp: 24,
      rh: 70,
      wind: 12,
      concreteTemp: 22,
      descAr: "ظروف معتدلة متوازنة قريبة من معايير المعامل الهندسية النموذجية.",
      descEn: "Temperate marine climate. Excellent balance for standard concrete hydration."
    },
    {
      id: "standard_lab",
      nameAr: "ظروف معملية قياسية (Standard Lab)",
      nameEn: "Standard Laboratory Conditions",
      temp: 20,
      rh: 50,
      wind: 0,
      concreteTemp: 20,
      descAr: "الظروف المعيارية للتشغيل وحساب تطور المقاومة (20 درجة مئوية وبدون هواء).",
      descEn: "Perfect ISO reference environment for compression benchmark test."
    }
  ];

  // Apply quick weather presets
  const handleApplyWeatherPreset = (presetId: string) => {
    const p = weatherPresets.find(wp => wp.id === presetId);
    if (p) {
      setAmbientTemp(p.temp);
      setHumidity(p.rh);
      setWindSpeed(presetId === "standard_lab" ? 0 : p.wind);
      setConcreteTemp(p.concreteTemp);
    }
  };

  // Cement hydration speed models based on selected cement type or CEM class
  const getCementParams = (type: string) => {
    switch(type) {
      case "CEM I":
        return { s: 0.20, label: "CEM I - إسمنت بورتلاندي عادي (سريع الإماهة)", desc: "محتوى مرتفع من C3S يمنح تصلبًا مبكرًا سريعًا ومثاليًا للأشغال السريعة." };
      case "CEM II":
        return { s: 0.25, label: "CEM II - إسمنت بوزولاني مركب (معتدل التفاعل)", desc: "تفاعل هيدروليكي هادئ مع تطور متزن ومقاومة جيدة للكبريتات." };
      case "CEM III":
        return { s: 0.38, label: "CEM III - إسمنت خبث الأفران (بطيء التفاعل المستمر)", desc: "يتأخر نضوجه الأولي بوجود خبث الحجار بعنابة لكنه يعطي كثافة هائلة بعمر 90 يوماً." };
      case "CEM IV":
        return { s: 0.45, label: "CEM IV - إسمنت بوزولاني ناعم (تصلب مديد)", desc: "تفاعل ممتد بطيء يحتاج رطوبة مستمرة لأسابيع لتفعيل مركبات السيليكا اللاحقة." };
      case "CEM V":
        return { s: 0.40, label: "CEM V - إسمنت مركب مستدام (خبث وبوزولانا)", desc: "حرارة إماهة منخفضة جداً مثالي للكتل العريضة والسدود لتفادي التصدعات الحرارية." };
      default:
        return { s: 0.25, label: "مركب قياسي", desc: "تدرج نضوج عادي." };
    }
  };

  const selectedCement = getCementParams(cementTypeSelect);

  // Re-calculate Standard Evaporation Rate (kg/m²/hour)
  // E = 5 * [ (Tc+18)^2.5 - r * (Ta+18)^2.5 ] * (V+4) * 10^-6
  const evaporationRate = useMemo(() => {
    const rhFraction = humidity / 100;
    const term1 = Math.pow(concreteTemp + 18, 2.5);
    const term2 = rhFraction * Math.pow(ambientTemp + 18, 2.5);
    const windFactor = windSpeed + 4;
    const rate = 5 * (term1 - term2) * windFactor * 0.000001;
    return Math.max(0, parseFloat(rate.toFixed(3)));
  }, [ambientTemp, humidity, windSpeed, concreteTemp]);

  // Evaporation risk and message
  const evaporationRisk = useMemo(() => {
    if (evaporationRate >= 1.0) {
      return { level: "critical", label: "حرجة للغاية (تشقق مؤكد)", bg: "bg-red-550/10 border-red-500 text-red-600 dark:text-red-400" };
    } else if (evaporationRate >= 0.5) {
      return { level: "moderate", label: "متوسطة الخطورة (تتطلب حماية)", bg: "bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400" };
    } else {
      return { level: "safe", label: "منخفضة / آمنة (تبخر معتدل)", bg: "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400" };
    }
  }, [evaporationRate]);

  // Metric string helpers
  const unitStr = "MPa";
  const toUnit = (valMpa: number) => {
    return parseFloat(valMpa.toFixed(1));
  };

  // High-fidelity predictive engine for the 3 curing scenarios (Good, Medium, Poor) in parallel.
  // Age points: 1, 3, 7, 14, 28, 90 days.
  const chartData = useMemo(() => {
    const { s } = selectedCement;
    const ages = [1, 3, 7, 14, 28, 90];
    
    // Temperature maturity equivalent (Arrhenius rate model based on CEB equivalent age at standard 20°C)
    // Absolute Temperature integration:
    const activationFactor = Math.exp((4000 * (1 / 293.15 - 1 / (273.15 + ambientTemp))));
    const t_eq_1 = Math.max(0.05, 1 * activationFactor);
    const t_eq_3 = Math.max(0.05, 3 * activationFactor);
    const t_eq_7 = Math.max(0.05, 7 * activationFactor);
    const t_eq_14 = Math.max(0.05, 14 * activationFactor);
    const t_eq_28 = Math.max(0.05, 28 * activationFactor);
    const t_eq_90 = Math.max(0.05, 90 * activationFactor);

    const t_eq_map: Record<number, number> = {
      1: t_eq_1,
      3: t_eq_3,
      7: t_eq_7,
      14: t_eq_14,
      28: t_eq_28,
      90: t_eq_90
    };

    return ages.map((age) => {
      const teq = t_eq_map[age];
      
      // CEB-FIP base age coefficient (beta_cc)
      const beta_cc = Math.exp(s * (1 - Math.sqrt(28 / teq)));

      // 1. Good Curing Strategy (💧 معالجة مائية ممتازة ومثالية)
      // Water cures continuously for 14+ days. Full moisture retention.
      // High placement or curing temp slightly caps ultimate strength (100% hydration but coarser crystalline network)
      let gamma_good = 1.0;
      if (ambientTemp > 38) {
        gamma_good = Math.max(0.94, 1.0 - 0.05 * ((ambientTemp - 35) / 15));
      }

      // 2. Medium Curing Strategy (🩹 معالجة متوسطة / ورقية مؤقتة)
      // Moistened burlap or sealing for first 3 days, then left exposed.
      // Dries progressively based on ambient wind and heat (evaporationRate)
      let gamma_medium = 1.0;
      if (age > 3) {
        const dryFactor = 1 - Math.exp(-0.35 * evaporationRate * ((age - 3) / 28));
        gamma_medium = Math.max(0.80, 1.0 - 0.16 * dryFactor);
      }

      // 3. Poor Curing Strategy (🏜️ معالجة ضعيفة وبدون رش مائي)
      // Left entirely exposed from day 1 to sun, sand, and wind.
      // Severe rapid cement reaction locking & drying.
      let gamma_poor = 1.0;
      if (age >= 1) {
        const dryFactor = Math.min(1.0, age / 7);
        gamma_poor = Math.exp(-0.18 * evaporationRate * Math.log(age + 1));
        // Clamp lower bounding
        gamma_poor = Math.max(0.50, gamma_poor);
      }

      // Final simulated strength in MPa
      const f_good = fck28Override * beta_cc * gamma_good;
      const f_medium = fck28Override * beta_cc * gamma_medium;
      const f_poor = fck28Override * beta_cc * gamma_poor;

      return {
        age,
        ageLabel: `${age} يوم`,
        // Good Curing
        goodMpa: Math.round(f_good * 10) / 10,
        goodDisplay: toUnit(f_good),
        goodPercent: Math.round((f_good / fck28Override) * 100),
        
        // Medium Curing
        mediumMpa: Math.round(f_medium * 10) / 10,
        mediumDisplay: toUnit(f_medium),
        mediumPercent: Math.round((f_medium / fck28Override) * 100),

        // Poor Curing
        poorMpa: Math.round(f_poor * 10) / 10,
        poorDisplay: toUnit(f_poor),
        poorPercent: Math.round((f_poor / fck28Override) * 100),

        // Percent difference / Lost opportunities
        lossPercent: Math.max(0, Math.round(((f_good - f_poor) / f_good) * 100))
      };
    });
  }, [fck28Override, ambientTemp, humidity, windSpeed, concreteTemp, cementTypeSelect]);

  // Extract reference points for summary
  const day28Data = useMemo(() => {
    return chartData.find(d => d.age === 28) || { goodDisplay: 0, mediumDisplay: 0, poorDisplay: 0, lossPercent: 0, goodPercent: 0, poorPercent: 0 };
  }, [chartData]);

  const maxStrengthLoss = day28Data.lossPercent;

  return (
    <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 text-right" id="integrated-prediction-engine" dir="rtl">
      
      {/* HEADER BANNER */}
      <div className="border-b border-indigo-50 dark:border-indigo-900/40 pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 justify-end">
            <span className="bg-amber-500 text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
              PREDICTION ENGINE v3.0
            </span>
            <span>محرك التنبؤ بمقاومة الضغط وسيناريوهات المعالجة الموقعية</span>
            <TrendingUp size={18} className="text-blue-500 animate-pulse" />
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            أداة هندسية لمحاكاة تصلد الهياكل وعلاجه حرارياً وكيميائياً على مدى 90 يوماً متواصلة. يتم التنبؤ بالاعتماد الكلي على المعايير العالمية وتفاعل الإماهة المتأثر بطقس الصب الفعلي.
          </p>
        </div>
        
        {/* Unit Display Info */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl text-[10.5px] shrink-0 self-end lg:self-auto font-sans font-black text-slate-550 dark:text-slate-400">
          <span>وحدة العرض:</span>
          <span className="text-emerald-600 dark:text-emerald-400">ميجا باسكال (MPa)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
        
        {/* RIGHT COLUMN: CONTROLS & WEATHER SIMULATOR (5 columns) */}
        <div className="lg:col-span-5 space-y-4 order-2 lg:order-1">
          
          {/* CEMENT KINETICS SELECTOR */}
          <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[9.5px] font-bold text-blue-500 dark:text-blue-400 font-mono">B-1: CEMENT HYDROLOGY</span>
              <span className="text-xs font-black text-slate-800 dark:text-white">نوع الإسمنت وسرعة حركته الكيميائية</span>
            </div>
            
            <div className="grid grid-cols-5 gap-1.5 bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-850">
              {["CEM I", "CEM II", "CEM III", "CEM IV", "CEM V"].map((type) => (
                <button
                  key={type}
                  onClick={() => setCementTypeSelect(type)}
                  className={`py-1.5 text-[10.5px] font-black rounded-lg transition-colors cursor-pointer ${
                    cementTypeSelect === type 
                      ? "bg-blue-600 text-white shadow-sm" 
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="p-2.5 bg-white/50 dark:bg-slate-950/30 rounded-xl border border-slate-150 dark:border-slate-850">
              <strong className="text-[11.5px] text-slate-800 dark:text-slate-100 block">
                {selectedCement.label}
              </strong>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {selectedCement.desc} معامل النضوج النموذجي: <span className="font-mono text-blue-500 font-bold">s = {selectedCement.s}</span>
              </p>
            </div>
          </div>

          {/* WEATHER IMPACT SIMULATION */}
          <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-4" id="weather-simulation-panel">
            
            <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-2">
              <span className="text-[9.5px] font-bold text-amber-500 font-mono">B-2: CLIMATE WEATHER DYNAMICS</span>
              <span className="text-xs font-black text-slate-800 dark:text-white">محاكاة تأثير الطقس والبيئة المحيطة</span>
            </div>

            {/* PRESETS BUTTONS */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 block">أيقونات المناخ الجزائري (Environmental Profiles):</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyWeatherPreset("sahara")}
                  className={`p-2 rounded-xl text-[10px] font-black border text-right transition cursor-pointer flex items-center justify-between gap-1 ${
                    ambientTemp === 42 
                      ? "bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400" 
                      : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-350 hover:bg-slate-50"
                  }`}
                >
                  <span>الصحراء (أدرار/صالح)</span>
                  <Sun size={13} className="text-amber-500" />
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyWeatherPreset("high_plateaus")}
                  className={`p-2 rounded-xl text-[10px] font-black border text-right transition cursor-pointer flex items-center justify-between gap-1 ${
                    ambientTemp === 6 
                      ? "bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-400" 
                      : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-355 hover:bg-slate-50"
                  }`}
                >
                  <span>الهضاب (سطيف/باتنة)</span>
                  <Thermometer size={13} className="text-blue-500" />
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyWeatherPreset("coastal")}
                  className={`p-2 rounded-xl text-[10px] font-black border text-right transition cursor-pointer flex items-center justify-between gap-1 ${
                    ambientTemp === 24 && windSpeed === 12
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400" 
                      : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-355 hover:bg-slate-50"
                  }`}
                >
                  <span>الساحل (الجزائر/وهران)</span>
                  <Droplet size={13} className="text-emerald-500" />
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyWeatherPreset("standard_lab")}
                  className={`p-2 rounded-xl text-[10px] font-black border text-right transition cursor-pointer flex items-center justify-between gap-1 ${
                    ambientTemp === 20 && windSpeed === 0
                      ? "bg-purple-500/10 border-purple-500 text-purple-700 dark:text-purple-400" 
                      : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-355 hover:bg-slate-50"
                  }`}
                >
                  <span>المخبر القياسي (Standard)</span>
                  <Award size={13} className="text-purple-500" />
                </button>
              </div>
            </div>

            <div className="border-t border-slate-200/60 dark:border-slate-800/80 my-2" />

            {/* DYNAMIC METEOROLOGY SLIDERS */}
            <div className="space-y-3 text-xs">
              
              {/* Sliders 1: Ambient Temperature */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <strong className="font-mono text-amber-500">{ambientTemp}°C</strong>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">حرارة الجو المحيط (Ambient Temp):</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="50"
                  step="1"
                  value={ambientTemp}
                  onChange={(e) => setAmbientTemp(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded accent-amber-500"
                />
              </div>

              {/* Sliders 2: Humidity */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <strong className="font-mono text-blue-500">{humidity}%</strong>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">الرطوبة النسبية للجو (Relative Humidity):</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={humidity}
                  onChange={(e) => setHumidity(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded accent-blue-500"
                />
              </div>

              {/* Sliders 3: Wind speed */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <strong className="font-mono text-teal-500">{windSpeed} كم/ساعة</strong>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">سرعة الرياح الموقعية (Wind Speed):</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="2"
                  value={windSpeed}
                  onChange={(e) => setWindSpeed(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded accent-teal-500"
                />
              </div>

              {/* Sliders 4: Concrete Temperature */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <strong className="font-mono text-orange-600 dark:text-orange-400">{concreteTemp}°C</strong>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">درجة حرارة صب الخرسانة (Placement Temp):</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="45"
                  step="1"
                  value={concreteTemp}
                  onChange={(e) => setConcreteTemp(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded accent-orange-550"
                />
              </div>

            </div>

            {/* STANDARDIZED EVAPORATION & CRACKING RISK RESULTS GAUGE */}
            <div className={`p-3 rounded-2xl border text-right space-y-2 transition-colors ${evaporationRisk.bg}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase font-mono tracking-wider">Dreux Evaporation Metric</span>
                <span className="text-xs font-black flex items-center gap-1">
                  <span>مستوى خطورة التشقق اللدن</span>
                  <AlertTriangle size={12} className="animate-pulse" />
                </span>
              </div>
              <div className="flex items-baseline justify-between font-mono">
                <span className="text-[10px] font-semibold font-sans text-slate-500">معدل التبخر المقدر للمياه:</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-black">{evaporationRate}</span>
                  <span className="text-[9px] font-sans">كجم/م²/ساعة</span>
                </div>
              </div>
              <div className="flex justify-between items-center gap-2 pt-1 border-t border-slate-300/20">
                <span className="text-[10.5px] font-bold">{evaporationRisk.label}</span>
                <div className="w-24 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
                  <div 
                    className={`h-full rounded-full ${
                      evaporationRisk.level === "critical" 
                        ? "bg-red-500 w-full" 
                        : evaporationRisk.level === "moderate" 
                        ? "bg-amber-500 w-2/3" 
                        : "bg-emerald-500 w-1/3"
                    }`}
                  />
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* LEFT COLUMN: SCENARIO COMPARISON & RECHARTS & DATA TABLE (7 columns) */}
        <div className="lg:col-span-7 space-y-4 order-1 lg:order-2">
          
          {/* THE MAIN GRAPH: 3 SCENARIOS IN ONE CHART */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-3xl border border-slate-250 dark:border-slate-800 space-y-4">
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center text-right gap-2">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold text-[9px] px-1.5 py-0.5 rounded font-mono">
                  3 SCENARIOS ACTIVE
                </span>
                <h4 className="text-xs font-black text-slate-800 dark:text-white">مقارنة سيناريوهات الترطيب والمعالجة بالتزامن (Scenario Comparison)</h4>
              </div>
              <span className="text-[9px] text-slate-400 font-mono self-end sm:self-auto block">الأعمار المقدرة: 1، 3، 7، 14، 28، 90 يوماً</span>
            </div>

            {/* Recharts responsive graph container */}
            <div className="h-64 w-full text-left" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 15, right: 15, left: -22, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#253043" opacity={0.3} />
                  <XAxis 
                    dataKey="age" 
                    stroke="#475569" 
                    tickFormatter={(v) => `${v} يوم`} 
                    tick={{ fontSize: 9, fill: '#64748b' }} 
                  />
                  <YAxis 
                    stroke="#475569" 
                    tickFormatter={(v) => `${v} ${unitStr}`}
                    tick={{ fontSize: 9, fill: '#64748b' }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#0f172a', 
                      border: '1px solid #1e293b', 
                      borderRadius: '12px',
                      color: '#f8fafc',
                      direction: 'rtl',
                      textAlign: 'right'
                    }}
                    labelStyle={{ fontSize: 10, fill: '#cbd5e1', fontWeight: "bold" }}
                    itemStyle={{ fontSize: 10 }}
                    formatter={(value: any, name, props) => {
                      return [`${value} ${unitStr}`, name];
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: 9, direction: 'rtl', textAlign: 'center' }}
                  />
                  
                  {/* Reference line showing 100% Target Lab fcm28 */}
                  <ReferenceLine 
                    y={toUnit(fck28Override)} 
                    stroke="#94a3b8" 
                    strokeWidth="1.5" 
                    strokeDasharray="4 4" 
                    label={{ 
                      value: `مقاومة الكود المستهدفة: ${toUnit(fck28Override)} ${unitStr}`, 
                      position: 'top', 
                      fill: '#64748b', 
                      fontSize: 8,
                      fontWeight: 'bold'
                    }} 
                  />

                  {/* Line 1: Excellent Curing (💧 معالجة ممتازة) */}
                  <Line 
                    name="معالجة ممتازة [غمر/تغطية كاملة]"
                    type="monotone" 
                    dataKey="goodDisplay" 
                    stroke="#10b981" 
                    strokeWidth={2.5} 
                    activeDot={{ r: 6 }} 
                    dot={{ r: 3, fill: '#10b981' }}
                  />

                  {/* Line 2: Medium Curing (🩹 معالجة متوسطة) */}
                  <Line 
                    name="معالجة متوسطة [رش 3 أيام]"
                    type="monotone" 
                    dataKey="mediumDisplay" 
                    stroke="#f59e0b" 
                    strokeWidth={1.8} 
                    strokeDasharray="4 3"
                    activeDot={{ r: 5 }} 
                    dot={{ r: 2.5, fill: '#f59e0b' }}
                  />

                  {/* Line 3: Poor Curing (🏜️ بدون معالجة) */}
                  <Line 
                    name="معالجة ضعيفة [تعريض مباشر للطقس]"
                    type="monotone" 
                    dataKey="poorDisplay" 
                    stroke="#f43f5e" 
                    strokeWidth={1.8} 
                    activeDot={{ r: 5 }} 
                    dot={{ r: 2.5, fill: '#f43f5e' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Micro alert about lost mechanical capability */}
            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl flex items-start gap-2 text-xs text-rose-700 dark:text-rose-400">
              <TrendingDown size={16} className="shrink-0 mt-0.5 animate-bounce" />
              <div className="leading-relaxed flex-1">
                <strong>الفجوة الميكانيكية المهدورة:</strong> سيتعرض المبنى لخسارة مقاومة تتراوح بين <strong>{maxStrengthLoss}%</strong> جراء الجفاف الكامل لقلب الخرسانة في ظروف الطقس الحالية عند إهمال الترطيب!
              </div>
            </div>

          </div>

          {/* DYNAMIC SCENARIO COMPARISON TABLE */}
          <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md">
            
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[9.5px] font-mono text-slate-400">6-Age Multi-Variable Report</span>
              <h5 className="text-xs font-black text-slate-800 dark:text-white">جدول تحليل وتوزيع المقاومة التفصيلية عبر الأعمار (MPa / % Target)</h5>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-slate-950/40 text-[10px] font-black text-slate-400 border-b border-slate-200 dark:border-slate-800 font-mono">
                    <th className="p-3 text-right">عمر الخرسانة</th>
                    <th className="p-3">معالجة ممتازة (Good)</th>
                    <th className="p-3">معالجة متوسطة (Medium)</th>
                    <th className="p-3">معالجة ضعيفة (Poor)</th>
                    <th className="p-3 text-center">نسبة عجز الجفاف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800 font-medium">
                  {chartData.map((row) => (
                    <tr 
                      key={row.age} 
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors font-mono ${
                        row.age === 28 ? "bg-emerald-500/5 border-y border-emerald-505/20" : ""
                      }`}
                    >
                      <td className="p-3 text-right">
                        <div>
                          <span className="font-extrabold text-slate-800 dark:text-slate-100 text-xs font-sans">
                            {row.age === 1 ? "1 يوم (مبكر جداً)" : row.age === 3 ? "3 أيام" : row.age === 7 ? "7 أيام" : row.age === 14 ? "14 يوماً" : row.age === 28 ? "28 يوماً (المرجع)" : "90 يوماً (ممتد)"}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-0.5">
                          <strong className="text-emerald-600 dark:text-emerald-400 text-xs">
                            {row.goodDisplay} <span className="text-[9px] font-sans pr-0.5">{unitStr}</span>
                          </strong>
                          <span className="text-[10px] text-slate-400 block">({row.goodPercent}%)</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-0.5">
                          <strong className="text-amber-550 dark:text-amber-400 text-xs">
                            {row.mediumDisplay} <span className="text-[9px] font-sans pr-0.5">{unitStr}</span>
                          </strong>
                          <span className="text-[10px] text-slate-400 block">({row.mediumPercent}%)</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-0.5">
                          <strong className="text-rose-600 dark:text-rose-450 text-xs">
                            {row.poorDisplay} <span className="text-[9px] font-sans pr-0.5">{unitStr}</span>
                          </strong>
                          <span className="text-[10px] text-slate-400 block">({row.poorPercent}%)</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {row.lossPercent > 0 ? (
                          <span className="inline-block px-2 py-0.5 bg-rose-500/10 text-rose-550 dark:text-rose-400 text-[10px] font-black rounded-full">
                            - {row.lossPercent}% خسارة
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 bg-emerald-500/10 text-emerald-600 text-[10px] font-black rounded-full">
                            منعدم
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="p-3 text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-950 font-sans leading-relaxed text-right">
              <strong>ملاحظة الكود (Code Note):</strong> القبول الفعلي للهياكل الخرسانية المسلحة يتم بالدرجة الأولى على مقاومة الـ 28 يوماً. بينما يفيد مؤشر الـ 90 يوماً في قياس المتانة الطويلة الأجل وتأثير خبث وعيدان مركب الحجار بعنابة الذي يتصف بالتفاعل الصلب والبطيء الممتد.
            </p>

          </div>

          {/* SCIENTIFIC METRIC EXPLAINER / HYDROLOGICAL CELLULAR REACTION */}
          <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl text-right space-y-3 font-sans">
            <h5 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 justify-end">
              <span>تفسير الكيمياء الإنشائية - تبلور غراء السيليكات (C-S-H Gel Microstructure)</span>
              <Lightbulb size={13} className="text-amber-500" />
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
              <div className="p-3 bg-white/70 dark:bg-slate-950/20 rounded-xl space-y-1">
                <span className="font-extrabold text-blue-500 text-[11px] block">🧬 تفاعل الإذابة والتبلور المساند:</span>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-normal">
                  يحتاج سيليكات الكالسيوم ثنائي الكالسيوم (<span className="font-mono text-[9px] bg-slate-100 p-0.5">C2S</span>) وثلاثي الكالسيوم (<span className="font-mono text-[9px] bg-slate-100 p-0.5">C3S</span>) إلى تلامس جزئي دائم بالماء لتوليد بلورات <strong>Calcium Silicate Hydrate Gel (C-S-H)</strong> الصلبة، وأي تبخر سريع يقطع المياه يوقف هذا النمو المجهري بشكل نهائي وغير مبرم.
                </p>
              </div>
              <div className="p-3 bg-white/70 dark:bg-slate-950/20 rounded-xl space-y-1">
                <span className="font-extrabold text-emerald-500 text-[11px] block text-right">🔍 تفاعل النواضج الحراري (Arrhenius Theory):</span>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-normal">
                  تتسارع الكيمياء بزيادة حرارة الصب (Maturity Age) كبلورة مائية مبكرة، لكن في المقابل فإن النمو المتسارع العشوائي يؤدي لبناء غير مرتب وممتلئ بالفراغات الهوائية الدقيقة (Pore Network) عكس الهيدرات المتكونة بهدوء في حرارة معتدلة (20°C).
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
