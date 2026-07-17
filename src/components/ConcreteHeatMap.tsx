import React, { useMemo, useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import { 
  Building, 
  Flame, 
  Trash2, 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Layers,
  Thermometer,
  ShieldAlert,
  Compass,
  Tv
} from "lucide-react";
import { useLanguage } from "../services/localization";

interface ConcreteHeatMapProps {
  cementWeight: number; // in kg/m³
  cementType: string;   // e.g. CEM_I, CEM_II, CEM_III, SRC
}

// Cement hydration and thermal coefficients
const CEMENT_THERMAL_PROPERTIES: Record<string, { heat: number; rate: number; nameAr: string; nameFr: string; nameEn: string }> = {
  "CEM_I": { 
    heat: 350, 
    rate: 0.040, 
    nameAr: "إسمنت بورتلاندي عادي (CEM I) - حرارة إماهة مرتفعة", 
    nameFr: "Ciment Portland Ordinaire (CEM I) - Chaleur d'hydratation élevée",
    nameEn: "Portland Cement (CEM I) - High Hydration Heat" 
  },
  "CEM_II": { 
    heat: 280, 
    rate: 0.028, 
    nameAr: "إسمنت بورتلاندي مركب (CEM II) - حرارة معتدلة", 
    nameFr: "Ciment Portland Composé (CEM II) - Chaleur modérée",
    nameEn: "Composite Cement (CEM II) - Moderate Hydration Heat" 
  },
  "CEM_III": { 
    heat: 190, 
    rate: 0.015, 
    nameAr: "إسمنت الأفران العالية (CEM III) - منخفض الحرارة جداً", 
    nameFr: "Ciment de haut fourneau (CEM III) - Très faible chaleur",
    nameEn: "Blast Furnace Slag (CEM III) - Very Low Heat" 
  },
  "SRC": { 
    heat: 240, 
    rate: 0.022, 
    nameAr: "إسمنت مقاوم للكبريتات (SRC) - حرارة منخفضة", 
    nameFr: "Ciment résistant aux sulfates (SRC) - Faible chaleur",
    nameEn: "Sulfate Resistant Cement (SRC) - Low Heat" 
  }
};

export const ConcreteHeatMap: React.FC<ConcreteHeatMapProps> = ({
  cementWeight = 350,
  cementType = "CEM_I"
}) => {
  const { language, isRtl } = useLanguage();

  const localizedLabel = (ar: string, fr: string, en: string) => {
    if (language === "ar") return ar;
    if (language === "fr") return fr;
    return en;
  };

  // 1. Interactive dimensions & parameters configuration
  const [thickness, setThickness] = useState<number>(1.5); // element thickness in meters (0.5 to 5.0m)
  const [width, setWidth] = useState<number>(3.0);         // width in meters (1.0 to 10.0m)
  const [initialTemp, setInitialTemp] = useState<number>(25); // concrete pouring temperature in °C (10 to 40°C)
  const [ambientTemp, setAmbientTemp] = useState<number>(22); // ambient curing temperature in °C (5 to 45°C)
  const [timeStep, setTimeStep] = useState<number>(36);      // elapsed time in hours (0 to 240 hours)
  const [insulation, setInsulation] = useState<"none" | "wood" | "blanket">("wood"); // insulation material type

  // 3D Visualizer States:
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [yRotation, setYRotation] = useState<number>(-35);
  const [xRotation, setXRotation] = useState<number>(-20);
  const [showCutaway, setShowCutaway] = useState<boolean>(true);

  const d3GridRef = useRef<SVGSVGElement | null>(null);

  const resolveCementKey = (typeStr: string): string => {
    if (!typeStr) return "CEM_I";
    const upper = typeStr.toUpperCase();
    if (upper.includes("CEM I") || upper.includes("CEM_I")) return "CEM_I";
    if (upper.includes("CEM II") || upper.includes("CEM_II") || upper.includes("مركب")) return "CEM_II";
    if (upper.includes("CEM III") || upper.includes("CEM_III") || upper.includes("الأفران")) return "CEM_III";
    if (upper.includes("SRC") || upper.includes("SULFATE") || upper.includes("مقاوم للكبريتات")) return "SRC";
    return "CEM_I";
  };

  // Normalized thermal properties
  const thermalProps = useMemo(() => {
    const key = resolveCementKey(cementType);
    return CEMENT_THERMAL_PROPERTIES[key] || CEMENT_THERMAL_PROPERTIES["CEM_I"];
  }, [cementType]);

  const cementLabel = useMemo(() => {
    if (language === "ar") return thermalProps.nameAr;
    if (language === "fr") return thermalProps.nameFr;
    return thermalProps.nameEn;
  }, [thermalProps, language]);

  // Mass concrete thermal safety factor calculation
  // Computes peak temperature, surface temperature, gradient, cracking probability
  const thermalAnalysis = useMemo(() => {
    // 1. Adiabatic temperature rise
    // Delta T_adiab = (C * H) / (c * rho)
    // Specific heat of concrete c = 1.05 kJ/kg·K; density rho = 2400 kg/m³
    const specificHeat = 1.05; 
    const density = 2400;
    const maxAdiabaticRise = (cementWeight * thermalProps.heat) / (specificHeat * density);

    // 2. Heat dissipation factor based on block geometry and boundary conditions
    // Large thickness means slow dissipation and higher heat retention (adiabatic)
    const shapeAreaRatio = (2 * (width + thickness)) / (width * thickness);
    
    // Insulation coefficient
    const insulationValue = insulation === "blanket" ? 0.90 : insulation === "wood" ? 0.60 : 0.15;
    
    // Dissipation rate constant (representing 2D cooling speed)
    const k_dissipation = 0.0003 * (1 - insulationValue * 0.7) * (shapeAreaRatio * shapeAreaRatio);

    // Calculate core temperature over time axis (Jonasson/Rastrup concept modified)
    const points: Array<{ t: number; core: number; surf: number; diff: number }> = [];
    let peakCore = initialTemp;
    let peakDiff = 0;
    let peakTime = 24;

    for (let h = 0; h <= 240; h += 2) {
      const g_hydration = 1 - Math.exp(-thermalProps.rate * h);
      const thermalLossMod = Math.exp(-k_dissipation * h);
      
      const coreRise = maxAdiabaticRise * g_hydration * thermalLossMod;
      const coreT = initialTemp + coreRise;

      // Surface temperature gets cooled down to ambient, buffered by insulation
      const surfT = ambientTemp + (coreT - ambientTemp) * insulationValue;
      const diffT = Math.max(0, coreT - surfT);

      points.push({ t: h, core: coreT, surf: surfT, diff: diffT });

      if (coreT > peakCore) {
        peakCore = coreT;
      }
      if (diffT > peakDiff) {
        peakDiff = diffT;
        peakTime = h;
      }
    }

    // Active state values at current selected timeStep
    const activeData = points.find(p => p.t >= timeStep) || points[points.length - 1];
    
    // Cracking risk metrics
    // Rule of thumb: gradient (T_core - T_surface) > 20°C represents critical tension cracking risk
    const currentGradient = activeData.diff;
    const criticalThreshold = 20.0; // Standard threshold
    const riskFactor = currentGradient / criticalThreshold;
    
    let riskLevel: "low" | "medium" | "high" = "low";
    let riskLabelAr = "آمن - خطر تشقق منخفض جداً";
    let riskLabelFr = "Sécurisé - Risque de fissuration très faible";
    let riskLabelEn = "Safe - Low Cracking Risk";
    let riskColor = "#10B981"; // Emerald

    if (currentGradient >= 25) {
      riskLevel = "high";
      riskLabelAr = "خطر مرتفع جداً لظهور شروخ إنشائية حرارية كبرى";
      riskLabelFr = "RISQUE CRITIQUE - Fissuration thermique structurelle imminente";
      riskLabelEn = "CRITICAL RISK - Impending Structural Thermal Cracking";
      riskColor = "#EF4444"; // Red
    } else if (currentGradient >= 18) {
      riskLevel = "medium";
      riskLabelAr = "مستوى متوسط - يُنصح بتحسين معالجة السطح أو التبريد";
      riskLabelFr = "Risque modéré - Protection de surface ou refroidissement conseillés";
      riskLabelEn = "Moderate Risk - Surface protection or cooling advised";
      riskColor = "#F59E0B"; // Amber
    }

    return {
      maxAdiabaticRise,
      peakCoreTemp: peakCore,
      peakGradient: peakDiff,
      peakGradientTime: peakTime,
      activeCoreTemp: activeData.core,
      activeSurfaceTemp: activeData.surf,
      activeGradient: currentGradient,
      riskLevel,
      riskLabelAr,
      riskLabelFr,
      riskLabelEn,
      riskColor,
      riskFactor,
      timelinePoints: points
    };
  }, [cementWeight, thermalProps, thickness, width, initialTemp, ambientTemp, insulation, timeStep]);

  // 2. D3 Heat Map Grid Rendering Implementation
  useEffect(() => {
    if (!d3GridRef.current) return;

    // Clear previous elements
    const svgEl = d3.select(d3GridRef.current);
    svgEl.selectAll("*").remove();

    const svgWidth = 360;
    const svgHeight = 220;
    const margin = { top: 15, right: 15, bottom: 25, left: 25 };
    const chartW = svgWidth - margin.left - margin.right;
    const chartH = svgHeight - margin.top - margin.bottom;

    // Create container
    const g = svgEl.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Resolution of grid details (2D representation)
    const cols = 15;
    const rows = 11;
    const cellW = chartW / cols;
    const cellH = chartH / rows;

    // Custom scientific multi-stage color scale
    // Interpolates from ambient cooling block to peak hot central core
    const minCalculatedTemp = Math.min(ambientTemp, initialTemp) - 2;
    const maxCalculatedTemp = Math.max(thermalAnalysis.peakCoreTemp, 50);

    const tempColorScale = d3.scaleSequential()
      .domain([minCalculatedTemp, maxCalculatedTemp])
      .interpolator(d3.interpolateRgbBasis([
        "#1e293b", // Slate (cold boundary)
        "#3b82f6", // Blue (cool ambient)
        "#10b981", // Emerald (temperate cement paste)
        "#eab308", // Yellow (hydration warming)
        "#f97316", // Orange (moderate heat peak)
        "#ef4444", // Red (critical core heat)
        "#881337"  // Deep maroon (extreme thermal boundary)
      ]));

    // Generate grid coordinates representing block symmetry matching boundary limits
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Normalized coordinate distance from core/center (0 is center, 1 is surface boundary)
        const nx = Math.abs((c - (cols - 1) / 2) / ((cols - 1) / 2));
        const ny = Math.abs((r - (rows - 1) / 2) / ((rows - 1) / 2));
        
        // Combine rectangular boundaries for parabolic thermal gradient dispersion
        const combinedBoundaryVal = Math.max(nx * nx, ny * ny);

        // Core to surface calculated gradient temperature
        const T_core = thermalAnalysis.activeCoreTemp;
        const T_surf = thermalAnalysis.activeSurfaceTemp;
        
        const cellTemp = T_surf + (T_core - T_surf) * (1 - combinedBoundaryVal);

        const xPos = c * cellW;
        const yPos = r * cellH;

        // Render solid color element cell
        const rect = g.append("rect")
          .attr("x", xPos)
          .attr("y", yPos)
          .attr("width", cellW - 0.5)
          .attr("height", cellH - 0.5)
          .attr("fill", tempColorScale(cellTemp))
          .attr("rx", 1.5)
          .attr("class", "cursor-crosshair transition-all duration-300 hover:stroke-white hover:stroke-1 hover:brightness-125")
          .style("pointer-events", "all");

        // Simple interactive tooltip anchor points via HTML attribute description
        const formCoordX = ((c - (cols - 1) / 2) * (width / cols)).toFixed(2);
        const formCoordY = (((rows - 1) / 2 - r) * (thickness / rows)).toFixed(2);
        
        const tooltipText = language === "ar"
          ? `الإحداثي: أفقي ${formCoordX}م، عمودي ${formCoordY}م\nدرجة الحرارة: ${cellTemp.toFixed(1)}°C`
          : language === "fr"
          ? `Coordonnées : X=${formCoordX}m, Y=${formCoordY}m\nTempérature : ${cellTemp.toFixed(1)}°C`
          : `Coordinate: X=${formCoordX}m, Y=${formCoordY}m\nTemp: ${cellTemp.toFixed(1)}°C`;

        rect.append("title")
          .text(tooltipText);
      }
    }

    // Add visual block outline frame
    g.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", chartW)
      .attr("height", chartH)
      .attr("fill", "none")
      .attr("stroke", "#475569")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.82);

    // Draw central hot core boundary line indicator
    g.append("rect")
      .attr("x", chartW * 0.3)
      .attr("y", chartH * 0.3)
      .attr("width", chartW * 0.4)
      .attr("height", chartH * 0.4)
      .attr("fill", "none")
      .attr("stroke", "#f97316")
      .attr("stroke-width", 0.8)
      .attr("stroke-dasharray", "4 4")
      .attr("opacity", 0.6);

    // Center focal label
    g.append("circle")
      .attr("cx", chartW / 2)
      .attr("cy", chartH / 2)
      .attr("r", 3)
      .attr("fill", "#ffffff")
      .attr("class", "animate-pulse");

    const coreLabelText = localizedLabel("القلب", "Cœur", "Core");
    g.append("text")
      .attr("x", chartW / 2)
      .attr("y", chartH / 2 - 8)
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .attr("font-size", "7.5px")
      .attr("font-weight", "bold")
      .text(`${coreLabelText}: ${thermalAnalysis.activeCoreTemp.toFixed(1)}°C`);

    // Surface focal labels
    const surfLabelText = localizedLabel("السطح", "Surface", "Surface");
    g.append("text")
      .attr("x", 8)
      .attr("y", chartH - 8)
      .attr("fill", "#94a3b8")
      .attr("font-size", "7px")
      .text(`${surfLabelText}: ${thermalAnalysis.activeSurfaceTemp.toFixed(1)}°C`);

    // Boundaries indicator labels
    // X Axis metrics
    const widthLabelText = localizedLabel(`عرض الكتلة: ${width.toFixed(1)} م`, `Largeur : ${width.toFixed(1)} m`, `Block Width: ${width.toFixed(1)} m`);
    g.append("text")
      .attr("x", chartW / 2)
      .attr("y", chartH + 16)
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b")
      .attr("font-size", "8px")
      .text(widthLabelText);

    // Y Axis vertical alignment
    const thickLabelText = localizedLabel(`ارتفاع الكتلة: ${thickness.toFixed(1)} م`, `Épaisseur : ${thickness.toFixed(1)} m`, `Block Thickness: ${thickness.toFixed(1)} m`);
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -chartH / 2)
      .attr("y", -14)
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b")
      .attr("font-size", "8px")
      .text(thickLabelText);

  }, [thermalAnalysis, width, thickness, ambientTemp, initialTemp]);

  const progressPercent = (timeStep / 240) * 100;

  return (
    <div className={`bg-[#111827]/40 backdrop-blur-md rounded-2xl border border-white/5 p-5 shadow-xl ${isRtl ? "text-right" : "text-left"}`} id="concrete-thermal-heatmap-container">
      {/* Container Header */}
      <div className="border-b border-white/10 pb-4 mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className={`order-2 md:order-1 ${isRtl ? "text-right" : "text-left"} flex-1`}>
          <div className="flex items-center gap-2">
            <span className="bg-orange-500/10 text-orange-400 text-[10px] px-2 py-0.5 rounded font-black font-mono uppercase tracking-wider">
              {localizedLabel("محرك محاكاة الخرسانة الكتلية", "Moteur de simulation de béton massif", "Mass Concrete Simulation Engine")}
            </span>
            <Flame className="text-orange-400 shrink-0 animated-pulse" size={16} />
          </div>
          <h3 className="text-sm font-bold text-white mt-1.5 font-sans">
            {localizedLabel("🔥 محاكاة التوزيع الحراري والتنبؤ بالتشققات الإنشائية (Heat Map)", "🔥 Simulation thermique et prévision des fissures (Heat Map)", "🔥 Thermal Hydration & Cracking Prediction (Heat Map)")}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {localizedLabel("تنبؤ فوري دقيق لدرجات حرارة قلب الصبة وسطحها لتجنب تصدع الكتل الضخمة", "Prévisions précises du cœur et de la surface pour éviter les fissures de retrait", "Real-time core and surface temperature curves to prevent massive thermal cracking")}
          </p>
        </div>
        <div className="order-1 md:order-2 self-start flex gap-1.5 items-center">
          <div className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: thermalAnalysis.riskColor }}></span>
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: thermalAnalysis.riskColor }}></span>
          </div>
          <span className="text-xs font-black px-2.5 py-1 rounded-md" style={{ backgroundColor: `${thermalAnalysis.riskColor}15`, color: thermalAnalysis.riskColor }}>
            {language === "ar" ? thermalAnalysis.riskLabelAr : language === "fr" ? thermalAnalysis.riskLabelFr : thermalAnalysis.riskLabelEn}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls Layout column - 5 cols */}
        <div className={`lg:col-span-5 bg-slate-950/45 border border-slate-900 rounded-2xl p-4.5 space-y-4 ${isRtl ? "text-right" : "text-left"}`}>
          <div className="border-b border-slate-900 pb-2 mb-2">
            <span className="text-[10.5px] font-black text-slate-500 uppercase block font-mono tracking-wide">
              {localizedLabel("المعطيات والبارامترات الفيزيائية", "PARAMÈTRES D'HYDRATION & PHYSIQUES", "HYDRATION & PHYSICAL PARAMETERS")}
            </span>
            <p className="text-[11.5px] text-slate-400 mt-0.5">
              {localizedLabel("المعطيات الحرارية وعناصر البيئة المغلفة للقالب", "Facteurs thermiques et environnement de coffrage", "Hydration factors & formwork environment boundary")}
            </p>
          </div>

          {/* Active cement information report */}
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-850 flex items-center justify-between text-xs">
            <div className={isRtl ? "text-right" : "text-left"}>
              <span className="text-[9px] text-slate-500 block uppercase font-mono">
                {localizedLabel("نوع الإسمنت المحدد", "CIMENT SÉLECTIONNÉ", "SELECTED CEMENT")}
              </span>
              <span className="text-[11px] font-bold text-slate-300 block">{cementLabel}</span>
            </div>
            <span className="text-[#60A5FA] font-black font-sans bg-[#3b82f6]/10 px-2 py-0.5 rounded">
              {cementWeight} {localizedLabel("كجم/م³", "kg/m³", "kg/m³")}
            </span>
          </div>

          {/* Sliders Input list */}
          <div className="space-y-3.5">
            {/* Height/Thickness */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <label className="text-slate-300 font-bold flex items-center gap-1">
                  {localizedLabel("📐 الارتفاع (السمك):", "📐 Épaisseur (Thickness) :", "📐 Element Thickness:")}
                </label>
                <span className="font-mono text-blue-400 font-bold">
                  {thickness.toFixed(1)} {localizedLabel("متر", "m", "m")}
                </span>
              </div>
              <input 
                type="range"
                min="0.5" 
                max="5.0" 
                step="0.1"
                value={thickness}
                onChange={(e) => setThickness(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {localizedLabel("تعتبر الصبة كتلية عندما يتجاوز سمكها 0.8 متر.", "Le béton est massif si l'épaisseur dépasse 0,8m.", "An element is considered massive when thickness exceeds 0.8m.")}
              </span>
            </div>

            {/* Width */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <label className="text-slate-300 font-bold">
                  {localizedLabel("↔ العرض:", "↔ Largeur (Width) :", "↔ Element Width:")}
                </label>
                <span className="font-mono text-blue-400 font-bold">
                  {width.toFixed(1)} {localizedLabel("متر", "m", "m")}
                </span>
              </div>
              <input 
                type="range"
                min="1.0" 
                max="10.0" 
                step="0.5"
                value={width}
                onChange={(e) => setWidth(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Placement Temp */}
              <div>
                <label className="text-[10.5px] text-slate-400 block mb-1">
                  {localizedLabel("🌡 حرارة الخليط الأولية:", "🌡 Temp. de coulage initiale :", "🌡 Initial Mix Temp:")}
                </label>
                <div className="relative">
                  <input 
                    type="number"
                    min="10" 
                    max="45"
                    value={initialTemp}
                    onChange={(e) => setInitialTemp(Math.max(10, Math.min(45, parseInt(e.target.value) || 20)))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-left font-bold text-slate-100"
                  />
                  <span className="absolute right-2.5 top-1.5 text-xs text-slate-500 font-medium">°C</span>
                </div>
              </div>

              {/* Ambient Curing Temp */}
              <div>
                <label className="text-[10.5px] text-slate-400 block mb-1">
                  {localizedLabel("❄ حرارة الخارج المحيطة:", "❄ Température ambiante :", "❄ Ambient Temp:")}
                </label>
                <div className="relative">
                  <input 
                    type="number"
                    min="5" 
                    max="50"
                    value={ambientTemp}
                    onChange={(e) => setAmbientTemp(Math.max(5, Math.min(50, parseInt(e.target.value) || 20)))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-left font-bold text-slate-100"
                  />
                  <span className="absolute right-2.5 top-1.5 text-xs text-slate-500 font-medium">°C</span>
                </div>
              </div>
            </div>

            {/* Insulation type SELECT */}
            <div>
              <label className="text-[11px] text-slate-300 block font-bold mb-1">
                {localizedLabel("🛡 نوع تغليف القالب ومعالجة الحرارة السطحية:", "🛡 Type de coffrage et isolation de surface :", "🛡 Formwork Type & Surface Insulation Casing:")}
              </label>
              <select
                value={insulation}
                onChange={(e) => setInsulation(e.target.value as any)}
                className={`w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs ${isRtl ? "text-right" : "text-left"} font-semibold text-slate-200 focus:border-blue-500 focus:outline-none`}
              >
                <option value="none">
                  {localizedLabel("قوالب حديدية مكشوفة بتهوية (سرعة تبريد وتدرج حاد)", "Coffrage métallique nu ventilé (refroidissement rapide, gradient aigu)", "Exposed steel formwork with ventilation (rapid cooling, high gradient)")}
                </option>
                <option value="wood">
                  {localizedLabel("قوالب خشبية مقاومة سماكة 18 مم (عزل حراري تقليدي)", "Coffrage en bois standard de 18 mm (isolation classique)", "18mm standard wood formwork (traditional thermal insulation)")}
                </option>
                <option value="blanket">
                  {localizedLabel("أغطية معالجة خيش مشبع مع غلاف عازل (توازن ممتاز للسطح)", "Bâche isolante humide (excellent équilibre superficiel)", "Damp burlap sheets with insulated curing blanket (excellent surface balance)")}
                </option>
              </select>
            </div>

            {/* Time Slider */}
            <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-900/60">
              <div className="flex justify-between items-center text-xs mb-1">
                <label className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Clock size={12} className="text-orange-400" />
                  {localizedLabel("زمن عمر الإماهة المنقضي:", "Âge de cure d'hydratation écoulé :", "Elapsed Hydration Curing Time:")}
                </label>
                <span className="font-mono text-orange-400 font-black">
                  {timeStep} {localizedLabel("ساعة", "heures", "hours")} ({ (timeStep / 24).toFixed(1) } {localizedLabel("يوم", "jours", "days")})
                </span>
              </div>
              <input 
                type="range"
                min="0" 
                max="240" 
                step="2"
                value={timeStep}
                onChange={(e) => setTimeStep(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                <span>{localizedLabel("10 أيام (240 س)", "10 jours (240 h)", "10 days (240h)")}</span>
                <span>{localizedLabel("5 أيام (120 س)", "5 jours (120 h)", "5 days (120h)")}</span>
                <span>{localizedLabel("بداية الصب", "Début de coulage", "Pouring start")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Heat Map D3/3D Render block - 7 cols */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#020617] border border-slate-900 rounded-2xl p-4 flex flex-col items-center justify-center relative min-h-[350px]">
            
            {/* View Selection Toggles */}
            <div className="absolute top-3 left-3 flex gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl z-20">
              <button
                type="button"
                onClick={() => setIs3DMode(false)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                  !is3DMode 
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>{localizedLabel("شبكة ثنائية الأبعاد", "Grille 2D", "2D Grid")}</span>
              </button>
              <button
                type="button"
                onClick={() => setIs3DMode(true)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                  is3DMode 
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>{localizedLabel("مختبر ثلاثي الأبعاد", "Labo interactif 3D", "3D Interactive Lab")}</span>
              </button>
            </div>

            <span className="absolute top-3 right-3 text-[10px] text-slate-400 font-bold flex items-center gap-1 font-mono z-25">
              {localizedLabel("عمر الصبة :", "Âge :", "Age:")} {timeStep}h / {Math.round(timeStep/24)}d
            </span>

            {/* Display of 3D volumetric model */}
            {is3DMode ? (
              <div className="w-full flex flex-col items-center justify-center pt-8 pb-3 relative select-none">
                
                {/* 3D Action Description */}
                <div className="text-center mb-6 z-10">
                  <span className="text-[10px] text-amber-500 font-bold block uppercase tracking-wider font-mono">
                    {localizedLabel("رؤية التدرج الحجمي النسبي", "VUE DU GRADIENT VOLUMÉTRIQUE PROPORTIONNEL", "PROPORTIONAL VOLUMETRIC GRADIENT VIEW")}
                  </span>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {localizedLabel("قم بجر الأشرطة أدناه لتدوير الصبة الخرسانية ثلاثية الأبعاد ومعاينة وهج الحرارة بالداخل", "Faites glisser les curseurs pour faire pivoter le bloc 3D et voir la chaleur interne", "Drag the sliders below to rotate the 3D concrete block and preview core heat distribution")}
                  </div>
                </div>

                {/* 3D Viewport Box Container wrapper */}
                <div className="h-48 w-full flex items-center justify-center overflow-visible mb-6" style={{ perspective: "800px" }}>
                  <div 
                    className="relative transition-all duration-300 ease-out" 
                    style={{ 
                      transformStyle: "preserve-3d",
                      transform: `rotateX(${xRotation}deg) rotateY(${yRotation}deg)`,
                      width: `${Math.min(220, width * 40)}px`,
                      height: `${Math.min(130, thickness * 50)}px`,
                    }}
                  >
                    {/* Concrete Outer Translucent Glass Face (represented by 6 CSS sides) */}
                    {/* SIDES MATRICES */}
                    {/* Front face (Z translated) */}
                    <div 
                      className="absolute inset-0 bg-slate-500/10 border border-slate-400/30 flex items-center justify-center rounded-sm backdrop-blur-[1px]"
                      style={{ 
                        transform: `translateZ(${Math.min(100, width * 20)}px)`,
                        transformStyle: "preserve-3d",
                        backfaceVisibility: showCutaway ? "hidden" : "visible"
                      }}
                    >
                      <span className="text-[8px] text-slate-500/80 font-bold absolute bottom-1 right-2">
                        {localizedLabel("قشرة الصبة (Skin)", "Surface (Peau)", "Front (Skin)")}
                      </span>
                    </div>

                    {/* Back face */}
                    <div 
                      className="absolute inset-0 bg-slate-500/5 border border-slate-700/20"
                      style={{ transform: `rotateY(180deg) translateZ(${Math.min(100, width * 20)}px)` }}
                    />

                    {/* Left Face */}
                    <div 
                      className="absolute top-0 bottom-0 bg-slate-600/10 border border-slate-400/25"
                      style={{ 
                        width: `${Math.min(200, width * 40)}px`,
                        left: `-${Math.min(100, width * 20)}px`,
                        transform: `rotateY(-90deg) translateZ(${Math.min(100, width * 20) - Math.min(100, width * 20) / 2}deg)`,
                        transformOrigin: "center right"
                      }}
                    />

                    {/* Right Face */}
                    <div 
                      className="absolute top-0 bottom-0 bg-slate-600/15 border border-slate-400/25"
                      style={{ 
                        width: `${Math.min(200, width * 40)}px`,
                        right: `-${Math.min(100, width * 20)}px`,
                        transform: `rotateY(90deg) translateZ(${Math.min(100, width * 20) - Math.min(100, width * 20) / 2}deg)`,
                        transformOrigin: "center left"
                      }}
                    />

                    {/* Top Face */}
                    <div 
                      className="absolute left-0 right-0 bg-slate-400/10 border border-slate-350/20"
                      style={{ 
                        height: `${Math.min(200, width * 40)}px`,
                        top: `-${Math.min(100, width * 20)}px`,
                        transform: `rotateX(90deg) translateZ(${Math.min(100, width * 20) - Math.min(65, thickness * 25) / 2}deg)`,
                        transformOrigin: "bottom center"
                      }}
                    />

                    {/* Bottom Face */}
                    <div 
                      className="absolute left-0 right-0 bg-slate-700/20 border border-slate-800/50"
                      style={{ 
                        height: `${Math.min(200, width * 40)}px`,
                        bottom: `-${Math.min(100, width * 20)}px`,
                        transform: `rotateX(-90deg) translateZ(${Math.min(100, width * 20) - Math.min(65, thickness * 25) / 2}deg)`,
                        transformOrigin: "top center"
                      }}
                    />

                    {/* INNER GLOWING THERMAL HYDRATION CORE GRADIENT BUBBLE */}
                    <div 
                      className="absolute rounded-full transition-all duration-500 ease-out"
                      style={{
                        left: "25%",
                        top: "25%",
                        width: "50%",
                        height: "50%",
                        background: `radial-gradient(circle, ${
                          thermalAnalysis.activeCoreTemp >= 55 
                            ? "rgba(239, 68, 68, 0.85) 0%, rgba(249, 115, 22, 0.6) 40%, rgba(234, 179, 8, 0.05) 80%" 
                            : thermalAnalysis.activeCoreTemp >= 40 
                            ? "rgba(245, 158, 11, 0.8) 0%, rgba(234, 179, 8, 0.5) 45%, rgba(16, 185, 129, 0.05) 85%"
                            : "rgba(16, 185, 129, 0.7) 0%, rgba(59, 130, 246, 0.3) 50%, rgba(30, 41, 59, 0) 80%"
                        })`,
                        transform: `translateZ(${showCutaway ? "0px" : "10px"})`,
                        boxShadow: `0 0 ${Math.min(45, thermalAnalysis.activeGradient * 1.5)}px ${
                          thermalAnalysis.activeCoreTemp >= 55 
                            ? "rgba(239, 68, 68, 0.6)" 
                            : thermalAnalysis.activeCoreTemp >= 40 
                            ? "rgba(245, 158, 11, 0.4)"
                            : "rgba(16, 185, 129, 0.2)"
                        }`,
                        animation: "pulse 2s infinite ease-in-out"
                      }}
                    >
                      {/* Central Core Hotspot temperature label */}
                      <div className="absolute inset-0 flex items-center justify-center font-mono font-black text-[9px] text-white select-none whitespace-nowrap bg-black/40 backdrop-blur-[0.5px] rounded-full px-2 py-0.5 max-w-[80px] mx-auto h-6 self-center my-auto shadow">
                        {thermalAnalysis.activeCoreTemp.toFixed(1)}°C
                      </div>
                    </div>

                    {/* Slicing mesh grid lines (when showCutaway is active) */}
                    {showCutaway && (
                      <div 
                        className="absolute inset-x-0 h-0.5 bg-dashed border-t border-rose-500/70 z-10"
                        style={{ 
                          top: "50%",
                          transform: "translateZ(10px)",
                          transformStyle: "preserve-3d" 
                        }}
                      >
                        <span className={`absolute -top-3.5 ${isRtl ? "right-2" : "left-2"} bg-rose-950/90 border border-rose-800 text-[8px] text-rose-300 font-bold px-1 rounded`}>
                          {localizedLabel("مقطع القطع المركزي (Cutaway)", "Coupe centrale (Cutaway)", "Central Cutaway Section")}
                        </span>
                      </div>
                    )}

                  </div>
                </div>

                {/* 3D Joypad Orbit Controls */}
                <div className="flex flex-wrap items-center justify-center gap-4 w-full bg-slate-950/80 p-2.5 rounded-xl border border-slate-900 z-10">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500 font-bold">
                      {localizedLabel("زاوية الدوران الأفقي (Y):", "Rotation horizontale (Y) :", "Horizontal rotation (Y):")}
                    </span>
                    <input 
                      type="range" 
                      min="-180" 
                      max="180" 
                      value={yRotation} 
                      onChange={(e) => setYRotation(parseInt(e.target.value))} 
                      className="w-16 h-1 bg-slate-850 rounded appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500 font-bold">
                      {localizedLabel("زاوية الدوران العمودي (X):", "Rotation verticale (X) :", "Vertical rotation (X):")}
                    </span>
                    <input 
                      type="range" 
                      min="-90" 
                      max="90" 
                      value={xRotation} 
                      onChange={(e) => setXRotation(parseInt(e.target.value))} 
                      className="w-16 h-1 bg-slate-850 rounded appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                  
                  {/* Slicing toggle */}
                  <button
                    type="button"
                    onClick={() => setShowCutaway(prev => !prev)}
                    className={`px-2.5 py-1 rounded text-[9.5px] font-bold border transition-all cursor-pointer ${
                      showCutaway 
                        ? "bg-rose-500/10 border-rose-500 text-rose-400" 
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {showCutaway 
                      ? localizedLabel("إخفاء المقطع الحشوي", "Masquer la coupe", "Hide cutaway")
                      : localizedLabel("إظهار المقطع الحشوي (Cutaway)", "Afficher la coupe (Cutaway)", "Show Cutaway Section")}
                  </button>
                </div>

              </div>
            ) : (
              <div className="w-full flex flex-col items-center">
                {/* D3 SVG Container */}
                <svg 
                  ref={d3GridRef} 
                  width="360" 
                  height="220" 
                  className="max-w-full my-1.5 rounded-xl border border-slate-900/75 bg-[#030712] z-10"
                ></svg>
              </div>
            )}

            {/* Multi-tier gradient color bar scale legend */}
            <div className="w-full flex flex-col mt-2 px-1 z-10">
              <div className="h-2 rounded-full w-full bg-gradient-to-r from-[#1e293b] via-[#3b82f6] via-[#10b981] via-[#eab308] via-[#f97316] to-[#ef4444]" />
              <div className={`flex justify-between text-[9px] text-slate-400 font-mono font-bold mt-1 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                <span>{localizedLabel("بارد", "Froid", "Cold")} / {Math.min(ambientTemp, initialTemp) - 2}°C</span>
                <span>{localizedLabel("معتدل / 35°C", "Tempéré / 35°C", "Moderate / 35°C")}</span>
                <span>{localizedLabel("ساخن جداً", "Très chaud", "Very hot")} / {thermalAnalysis.peakCoreTemp.toFixed(0)}°C</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics display row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Core Temp */}
            <div className={`bg-slate-950/50 border border-slate-900 p-3 rounded-xl block ${isRtl ? "text-right" : "text-left"}`}>
              <span className="text-[10px] text-slate-500 uppercase block font-mono tracking-wide">
                {localizedLabel("حرارة قلب الصبة", "TEMPÉRATURE DU CŒUR", "CORE CORE TEMP")}
              </span>
              <span className={`text-xl font-extrabold text-white font-mono mt-0.5 block flex items-center ${isRtl ? "justify-end" : "justify-start"} gap-1.5`}>
                <Thermometer size={16} className="text-red-500" />
                {thermalAnalysis.activeCoreTemp.toFixed(1)}°C
              </span>
            </div>

            {/* Surface Temp */}
            <div className={`bg-slate-950/50 border border-slate-900 p-3 rounded-xl block ${isRtl ? "text-right" : "text-left"}`}>
              <span className="text-[10px] text-slate-500 uppercase block font-mono tracking-wide">
                {localizedLabel("حرارة السطح الخارجي", "TEMPÉRATURE DE SURFACE", "SURFACE TEMP")}
              </span>
              <span className={`text-xl font-extrabold text-[#60A5FA] font-mono mt-0.5 block flex items-center ${isRtl ? "justify-end" : "justify-start"} gap-1.5`}>
                <Thermometer size={16} className="text-[#3b82f6]" />
                {thermalAnalysis.activeSurfaceTemp.toFixed(1)}°C
              </span>
            </div>

            {/* Thermal Gradient */}
            <div className={`bg-slate-950/50 border border-slate-900 p-3 rounded-xl block ${isRtl ? "text-right" : "text-left"}`}>
              <span className="text-[10px] text-slate-500 uppercase block font-mono tracking-wide">
                {localizedLabel("التدرج (فرق الحرارة)", "GRADIENT THERMIQUE", "THERMAL GRADIENT")}
              </span>
              <span className={`text-xl font-extrabold font-mono mt-0.5 block flex items-center ${isRtl ? "justify-end" : "justify-start"} gap-1.5`} style={{ color: thermalAnalysis.activeGradient >= 20 ? "#ef4444" : "#10b981" }}>
                <AlertTriangle size={15} />
                {thermalAnalysis.activeGradient.toFixed(1)}°C
              </span>
            </div>
          </div>

          {/* Detailed analysis summary card */}
          <div className={`bg-[#020617]/50 border border-slate-900 rounded-2xl p-4 space-y-2 ${isRtl ? "text-right" : "text-left"}`}>
            <span className="text-[10px] text-slate-400 font-bold block uppercase font-mono tracking-wider">
              {localizedLabel("👷 تفاصيل وقواعد التنبؤ بالتشققات والسيطرة عليها:", "👷 Analyse thermique et directives de prévention :", "👷 Thermal Cracking Prediction & Prevention Analysis:")}
            </span>
            <div className="text-xs text-slate-300 leading-relaxed space-y-1.5 font-sans">
              <p>
                {localizedLabel(
                  `• الحد الأقصى الآمن للفارق الحراري المقر في الأكواد العالمية هو 20°C. الفارق الحالي يبلغ ${thermalAnalysis.activeGradient.toFixed(1)}°C.`,
                  `• La limite de sécurité pour le gradient thermique selon les normes est de 20°C. Le gradient actuel est de ${thermalAnalysis.activeGradient.toFixed(1)}°C.`,
                  `• The maximum safe thermal gradient specified by international codes is 20°C. Your current calculated gradient is ${thermalAnalysis.activeGradient.toFixed(1)}°C.`
                )}
              </p>
              
              {thermalAnalysis.riskLevel === "high" ? (
                <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-3 text-red-300 space-y-1 mt-2">
                  <div className={`font-black text-[12px] flex items-center gap-1.5 ${isRtl ? "justify-end" : "justify-start"}`}>
                    <span>
                      {localizedLabel("تحذير: فارق مجهد حرج وعالي المخاطر (Severe Gradient Risk)", "DANGER : Risque de gradient thermique élevé (Severe Gradient)", "WARNING: Critical Thermal Gradient Tension Risk (Severe Gradient)")}
                    </span>
                    <ShieldAlert size={14} className="text-red-400" />
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {localizedLabel(
                      "من المؤكد حدوث التصدعات في الأسطح الخارجية المكشوفة. لحل هذه المعضلة: يجب تغطية الخرسانة بطبقات عازلة إضافية لمنع تسرب حرارة السطح الخارج بسرعة، أو خفض درجة حرارة صب الخرسانة الأولية برش الركام بالمياه الباردة أو إقحام رقاقات الجليد في ماء الخلط.",
                      "Des fissures de surface sont très probables. Pour y remédier : couvrez le béton avec des bâches isolantes supplémentaires pour ralentir le refroidissement superficiel, ou baissez la température initiale en refroidissant les granulats à l'eau ou en ajoutant de la glace.",
                      "Surface thermal cracking is highly likely. Solution: cover the concrete with additional curing blankets to prevent rapid heat loss from the surface, or reduce initial pouring temperature by spraying aggregates with cold water or adding chipped ice to the mixing water."
                    )}
                  </p>
                </div>
              ) : thermalAnalysis.riskLevel === "medium" ? (
                <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-3 text-amber-300 space-y-1 mt-2">
                  <div className={`font-black text-[12px] flex items-center gap-1.5 ${isRtl ? "justify-end" : "justify-start"}`}>
                    <span>
                      {localizedLabel("تنبيه: فارق حراري متوسط القيد (Moderate Gradient Risk)", "ATTENTION : Risque thermique modéré (Moderate Gradient)", "CAUTION: Moderate Thermal Gradient Risk (Moderate Gradient)")}
                    </span>
                    <AlertTriangle size={14} className="text-amber-400" />
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {localizedLabel(
                      "هناك احتمالية لتشقق السطح إذا لم ينعم بالوقاية الكافية. يُنصح بإبقاء الألواح الخشبية للقالب مدة لا تقل عن 4 إلى 5 أيام لتقليل الصدمات الحرارية المفاجئة.",
                      "Il existe un risque de fissuration superficielle sans protection adéquate. Il est conseillé de laisser le coffrage en bois en place pendant au moins 4 à 5 jours pour amortir le choc thermique.",
                      "There is a minor risk of surface cracking without proper protection. Leaving the wooden formwork in place for at least 4 to 5 days is highly recommended to prevent sudden thermal shock."
                    )}
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 text-emerald-300 space-y-1 mt-2">
                  <div className={`font-black text-[12px] flex items-center gap-1.5 ${isRtl ? "justify-end" : "justify-start"}`}>
                    <span>
                      {localizedLabel("✓ مستويات فارق الإجهاد الحراري آمنة ومطابقة (Safe Thermals)", "✓ Gradient thermique sûr (Safe Thermals)", "✓ Thermal gradient levels are safe (Safe Thermals)")}
                    </span>
                    <CheckCircle size={14} className="text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {localizedLabel(
                      "الفوارق الحرارية الحالية تحت سقف العزل الحرج. يستطيع الرص الحبيبي تحمله وتوزيعه بالمرونة الطبيعية للخرسانة دون تشققات ظاهرية.",
                      "Le gradient thermique est bien en dessous de la limite critique. Le béton peut absorber les contraintes par sa flexibilité naturelle sans fissuration.",
                      "The thermal gradient is well below the critical cracking limit. The concrete can withstand these internal stresses through its natural elastic tensile capacity without cracking."
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
