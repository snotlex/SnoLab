import React, { useMemo, useState } from "react";
import { Sliders, Droplet, Eye, HelpCircle, Activity, Layout, AlertCircle } from "lucide-react";
import { useLanguage } from "../services/localization";

interface ConcreteSlumpVisualizerProps {
  slumpValue: number; // 0 to 25 cm or more
  waterContent: number; // in L/m3
  cementWeight: number; // in kg/m3
  airContent: number; // in %
  sandRatio?: number; // optional, default to around 35-45%
  gravelRatio?: number; // optional, default to 55-65%
}

export const ConcreteSlumpVisualizer: React.FC<ConcreteSlumpVisualizerProps> = ({
  slumpValue,
  waterContent,
  cementWeight,
  airContent,
  sandRatio = 40,
  gravelRatio = 60,
}) => {
  const [showVisualGuide, setShowVisualGuide] = useState(false);
  const { language, isRtl } = useLanguage();

  const localizedLabel = (ar: string, fr: string, en: string) => {
    if (language === "ar") return ar;
    if (language === "fr") return fr;
    return en;
  };

  // Dynamic labels and callout definitions for the scientific overlay
  const visualGuideData = useMemo(() => {
    const val = slumpValue;
    if (val <= 2) {
      return {
        stateLabel: localizedLabel("جاف / غير لدن", "Ferme / Non-plastique", "Stiff / Non-Plastic"),
        coneNote: localizedLabel("ثبات كامل لقالب الإطار", "Stabilité totale du moule", "Full mold stability"),
        shearNote: localizedLabel("صلابة عالية ومقاومة قص فائقة", "Rigidité élevée et haute résistance au cisaillement", "High rigidity & superior shear resistance"),
        heightDesc: localizedLabel("هبوط متيبس (0 - 2 سم)", "Affaissement ferme (0 - 2 cm)", "Stiff slump (0 - 2 cm)"),
        cohesion: "S1 Class - Dry Slump"
      };
    }
    if (val <= 5) {
      return {
        stateLabel: localizedLabel("لدن جاف / منخفض التدفق", "Plastique-ferme / Faible écoulement", "Plastic-Stiff / Low Flow"),
        coneNote: localizedLabel("تشوه متناسق خفيف للجدران", "Légère déformation des parois", "Slight consistent wall deformation"),
        shearNote: localizedLabel("مقاومة قص ممتازة واحتكاك حركي", "Excellente résistance au cisaillement", "Excellent shear resistance"),
        heightDesc: localizedLabel("هبوط لدن خفيف (3 - 5 سم)", "Affaissement faible (3 - 5 cm)", "Low slump (3 - 5 cm)"),
        cohesion: "S2 Class - Semi-Dry"
      };
    }
    if (val <= 9) {
      return {
        stateLabel: localizedLabel("لدن مثالي", "Plastique optimal", "Optimal Plastic"),
        coneNote: localizedLabel("هبوط حقيقي نظيف (True Slump)", "Affaissement vrai et propre", "True clean slump"),
        shearNote: localizedLabel("توازن تام للزوجة ومقاومة الانفصال", "Équilibre viscosité et anti-ségrégation", "Viscosity & segregation resistance"),
        heightDesc: localizedLabel("هبوط عياري متوازن (6 - 9 سم)", "Affaissement standard (6 - 9 cm)", "Standard slump (6 - 9 cm)"),
        cohesion: "S3 Class - Target Cohesive"
      };
    }
    if (val <= 15) {
      return {
        stateLabel: localizedLabel("انسيابي / سائل", "Fluide / Écoulement", "Flowing / Fluid"),
        coneNote: localizedLabel("انحدار كبير وانزلاق جانبي", "Affaissement important", "Significant slope / side slide"),
        shearNote: localizedLabel("مخرجات سيالة ومقاومة منخفضة جداً", "Haute fluidité, faible cisaillement", "Highly fluid, very low shear resistance"),
        heightDesc: localizedLabel("هبوط مرتفع للمضخات (10 - 15 سم)", "Affaissement pour pompage (10 - 15 cm)", "High pumping slump (10 - 15 cm)"),
        cohesion: "S4 Class - High Workability"
      };
    }
    return {
      stateLabel: localizedLabel("ذاتي الرص والتسوية", "Autoplaçant", "Self-consolidating"),
      coneNote: localizedLabel("انهيار كلي مسطح منساب (Collapse)", "Affaissement total (Effondrement)", "Total collapse / flat flow"),
      shearNote: localizedLabel("انعدام التماسك البنيوي ومقاومة القص", "Zéro cohésion structurale", "Zero structural cohesion & shear resistance"),
      heightDesc: localizedLabel("انسياب تلقائي بالكامل (> 15 سم)", "Écoulement libre (> 15 cm)", "Free automatic flow (> 15 cm)"),
      cohesion: "S5 Class - Collapse Flow"
    };
  }, [slumpValue, language]);

  // Determine slump state classification
  const slumpState = useMemo(() => {
    const val = slumpValue;
    if (val <= 2) {
      return {
        level: "S1",
        nameAr: localizedLabel("قوام جاف متماسك جداً", "Consistance ferme / sèche", "Dry / Stiff consistency"),
        nameEn: "Stiff / Non-Plastic",
        desc: localizedLabel("يحافظ على شكل القالب المخروطي بالكامل عند رفعه. يتطلب رصاً ميكانيكياً قوياً واهتزازات مكثفة.", "Conserve totalement sa forme après démoulage. Nécessite un serrage mécanique vigoureux par vibration.", "Retains its complete cone shape upon lifting. Requires heavy mechanical compaction and intense vibration."),
        color: "#EF4444", // red
        glow: "rgba(239, 68, 68, 0.2)",
        shapeDesc: localizedLabel("مخروط منتصب ومتراص تماماً", "Cône intact et compacté", "Intact and fully compacted cone"),
        segregationRisk: localizedLabel("منعدم - تماسك قوي للجزيئات المترابطة", "Nul - cohésion maximale des particules", "None - high cohesive particle bonding"),
        shearBehavior: localizedLabel("صلابة عالية جداً، لا انهيار جانبي", "Rigidité extrême, aucun glissement", "Extremely stiff, no shear failure")
      };
    }
    if (val <= 5) {
      return {
        level: "S2",
        nameAr: localizedLabel("قوام لدن جاف معتدل", "Consistance plastique-ferme", "Semi-dry plastic consistency"),
        nameEn: "Low Workability / Plastic-Stiff",
        desc: localizedLabel("هبوط خفيف مع ثبات الجدران. مثالي للمدارج، الساحات، الطرق المصبوبة بآلات منزلقة.", "Léger affaissement avec parois stables. Idéal pour pistes, dallages et chaussées.", "Slight slump with stable walls. Ideal for runways, pavements, and slip-form paving."),
        color: "#F59E0B", // amber
        glow: "rgba(245, 158, 11, 0.2)",
        shapeDesc: localizedLabel("انخفاض خفيف من الأعلى مع انتفاخ طفيف للجدران", "Légère baisse au sommet avec gonflement", "Slight top sink with subtle side bulging"),
        segregationRisk: localizedLabel("منخفض جداً ونادر", "Très faible et exceptionnel", "Very low and rare"),
        shearBehavior: localizedLabel("تراجع رأسي متماسك ومتناسق", "Tassement vertical régulier", "Cohesive and uniform vertical subsidence")
      };
    }
    if (val <= 9) {
      return {
        level: "S3",
        nameAr: localizedLabel("قوام لدن انسيابي عياري متناسق", "Consistance plastique standard", "Standard plastic consistency"),
        nameEn: "Medium Workability / Optimal Plastic",
        desc: localizedLabel("هو القوام القياسي النموذجي للمنشآت العادية والأعمدة. يحقق توازناً تاماً بين السهولة والتماسك اللدن.", "La consistance de référence pour ouvrages courants. Offre un équilibre parfait entre ouvrabilité et cohésion.", "The standard reference consistency for common reinforced structures and columns. Achieves perfect balance."),
        color: "#10B981", // emerald
        glow: "rgba(16, 185, 129, 0.2)",
        shapeDesc: localizedLabel("هبوط عياري متزن مع تماسك تام للمواد دون هرب المياه", "Affaissement vrai équilibré sans ressuage", "Balanced standard slump with perfect cohesion and no bleeding"),
        segregationRisk: localizedLabel("مثالي - أفضل تماسك ميكانيكي هيدروليكي للمواد", "Idéal - cohésion granulaire optimale", "Ideal - optimal mechanical and hydraulic cohesion"),
        shearBehavior: localizedLabel("انزلاق هبوطي حقيقي نظيف (True Slump)", "Affaissement vrai et net", "True clean vertical shear slide (True Slump)")
      };
    }
    if (val <= 15) {
      return {
        level: "S4",
        nameAr: localizedLabel("قوام شديد السيولة واللانهاية للمضخات", "Consistance très fluide / pompable", "Highly fluid pumping consistency"),
        nameEn: "High Workability / Flowing",
        desc: localizedLabel("انحدار كبير لسهولة الجريان في أنابيب المضخات وتجاوز الأعمدة كثيفة التسليح. يُنصح بمراقبة العيار المائي.", "Grand affaissement idéal pour le pompage et les zones denses en armatures. Surveiller le dosage en eau.", "High slump ideal for easy pumping and dense reinforcing rebar. Careful water monitoring recommended."),
        color: "#3B82F6", // blue
        glow: "rgba(59, 130, 246, 0.2)",
        shapeDesc: localizedLabel("هبوط واسع ومنحدر مع تمدد قطري ملحوظ للكتلة", "Affaissement large avec étalement latéral", "Wide, sloped slump with noticeable lateral spreading"),
        segregationRisk: localizedLabel("متوسط - يحتاج لإضافات لدنة متطورة لمنع انفصال الحصى", "Moyen - nécessite des adjuvants stabilisants", "Medium - requires advanced stabilizers to prevent bleeding/segregation"),
        shearBehavior: localizedLabel("تشتت واسع مع ميل للانهيار الجانبي العادي", "Étalement avec tendance au cisaillement", "Broad sprawl with normal lateral shear tendency")
      };
    }
    return {
      level: "S5",
      nameAr: localizedLabel("قوام سائل ذاتي الرص", "Consistance autoplaçante", "Self-consolidating fluid consistency"),
      nameEn: "Extreme Flow / Self-Leveling",
      desc: localizedLabel("ينساب بالكامل تحت تأثير وزنه الذاتي لملء الفراغات دون اهتزاز. يتطلب مواد فائقة اللدونة لضمان عدم الانفصال.", "S'écoule sous son propre poids pour remplir les coffrages sans vibration. Exige des superplastifiants de pointe.", "Flows completely under its own weight to fill voids without vibration. Requires advanced superplasticizers."),
      color: "#8B5CF6", // purple
      glow: "rgba(139, 92, 246, 0.2)",
      shapeDesc: localizedLabel("انهيار كلي ومستوٍ تقريباً بشكل دائري مع هالة لامعة من المعجون", "Étalement circulaire complet avec auréole de pâte", "Complete circular sprawl with a glossy cement paste halo"),
      segregationRisk: localizedLabel("مرتفع - يجب ضبط الإضافات وبودرة الحجر بدقة متناهية لمنع الانفصال الحبيبي", "Élevé - formulation très rigoureuse requise", "High - strict admixture and filler dosage required to avoid granular segregation"),
      shearBehavior: localizedLabel("انهيار كلي مسطح ومستوٍ (Collapse Slump)", "Effondrement total et plan", "Complete flat sprawl collapse (Collapse Slump)")
    };
  }, [slumpValue, language]);

  // Dynamic SVG drawing paths for Slump Shapes based on slump value (0 to 25)
  const slumpPaths = useMemo(() => {
    const val = Math.min(Math.max(slumpValue, 0), 22);

    // Dynamic points for concrete shape:
    // We render a cross section of a 3D looking pile or slump cone
    // Original Cone bounds: Top width = 45, Bottom width = 90, Height = 100
    // As slump increases: Top sinks down, bottom widens, sides bulge outwards.
    
    // Normalizing slump factor from 0 to 1
    const factor = val / 22;

    // Top width goes from 50 (sharp top) -> 130 (flat sprawl)
    const topWidth = 50 + factor * 80;
    // Bottom width goes from 90 (neat base) -> 180 (sprawled pool)
    const bottomWidth = 95 + factor * 90;
    // Height goes from 100 (high heap) -> 24 (pancake heap)
    const currentHeight = 110 - factor * 85;

    const centerX = 150;
    const centerY = 160; // baseline of soil

    const topL_X = centerX - topWidth / 2;
    const topR_X = centerX + topWidth / 2;
    const topY = centerY - currentHeight;

    const botL_X = centerX - bottomWidth / 2;
    const botR_X = centerX + bottomWidth / 2;
    const botY = centerY;

    // Control point for side curvature (bulging outwards as it collapses)
    const bulgeFactor = factor * 40;
    const midL_X = (topL_X + botL_X) / 2 - bulgeFactor;
    const midR_X = (topR_X + botR_X) / 2 + bulgeFactor;
    const midY = (topY + botY) / 2;

    // Paths
    // Standard concrete pile silhouette
    const pilePath = `
      M ${topL_X} ${topY} 
      Q ${topR_X} ${topY} ${topR_X} ${topY}
      Q ${midR_X} ${midY} ${botR_X} ${botY}
      L ${botL_X} ${botY}
      Q ${midL_X} ${midY} ${topL_X} ${topY}
      Z
    `;

    // Slump Cone Outline (Reference dashed line before lift)
    // Always drawn as the standard original cone of dimensions: 100mm high, 100mm/200mm base
    const leftConeStart = centerX - 45;
    const rightConeStart = centerX + 45;
    const coneTopY = centerY - 110;
    const leftConeEnd = centerX - 90;
    const rightConeEnd = centerX + 90;

    const conePath = `
      M ${leftConeStart} ${coneTopY} 
      L ${rightConeStart} ${coneTopY} 
      L ${rightConeEnd} ${centerY} 
      L ${leftConeEnd} ${centerY} 
      Z
    `;

    return {
      pilePath,
      conePath,
      topY,
      currentHeight,
      factor
    };
  }, [slumpValue]);

  // Render randomized aggregates in the SVG concrete cross-section to show packing
  const aggregates = useMemo(() => {
    // Generate pseudo-random positions for gravel and sand inside the active concrete heap
    // Based on water content, air content, slump to simulate compaction/paste spacing
    const list = [];
    const count = 35; // 35 large stones
    const centerX = 150;

    // Seeded random helper to keep positions static during re-renders
    let seed = 42;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    for (let i = 0; i < count; i++) {
      // Relative coordinates
      const u = random(); // angle/r variable
      const r = random(); // radial distance from center
      const angle = u * Math.PI * 2;
      const radiusX = 15 + r * 60; // distribute outwards
      const radiusY = r * 35;

      const px = centerX + Math.cos(angle) * radiusX;
      // Offset Y based on heap shape
      const py = 120 + Math.sin(angle) * radiusY;

      // Decide aggregate size based on inputs (gravel size)
      const sizeList = [5, 6.5, 8, 9.5];
      const sizeIndex = Math.floor(random() * sizeList.length);
      const size = sizeList[sizeIndex];

      // Aggregate type color: light gray to dark slate gravel
      const colors = ["#94A3B8", "#64748B", "#475569", "#cbd5e1"];
      const col = colors[Math.floor(random() * colors.length)];

      list.push({ id: i, x: px, y: py, size, col });
    }

    // Generate sand fine particles and some air voids (white bubbles)
    const airBubbles = [];
    // Air content affects number of bubbles (1-10%)
    const bubbleCount = Math.round(airContent * 2.5) + 3;
    for (let i = 0; i < bubbleCount; i++) {
      const rVal = random();
      const ax = centerX + (random() - 0.5) * 120;
      const ay = 100 + random() * 50;
      airBubbles.push({
        id: `air-${i}`,
        x: ax,
        y: ay,
        size: 1.5 + rVal * 2.5
      });
    }

    return { gravels: list, airBubbles };
  }, [airContent]);

  return (
    <div className={`bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 ${isRtl ? "text-right" : "text-left"} text-slate-800 dark:text-slate-100 shadow-xl space-y-5`} id="concrete-consistency-visualizer-card">
      
      {/* Visualizer Title */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-[#64748B] font-mono uppercase tracking-widest">
          <Activity size={13} className="text-blue-500 dark:text-blue-400" />
          <span>{localizedLabel("مستشار تماسك وقوام الخرسانة الرطبة", "VISUALISATEUR DE CONSISTANCE DU BÉTON FRAIS", "CONCRETE WORKABILITY & CONSISTENCY VISUALIZER")}</span>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded text-[10px] text-blue-600 dark:text-blue-400 font-extrabold font-mono">
          {slumpState.level} {localizedLabel("فئة", "CLASSE", "CLASS")}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Interactive 2D/3D Slump Test Canvas (Occupies 5 columns) */}
        <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between relative overflow-hidden" id="slump-sculpture-board">
          
          {/* Subtle grid lines background to mimic laboratory measurement sheet */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:15px_15px]"></div>
          
          {/* Water shine layer based on flow */}
          <div 
            className="absolute top-0 left-0 right-0 h-1 bg-blue-500/80 transition-all duration-300 shadow-lg"
            style={{ width: `${Math.min(100, (waterContent / 220) * 100)}%` }}
            title={localizedLabel("مؤشر محتوى مياه الخلط بالبكسل", "Indicateur de teneur en eau", "Water Content Indicator")}
          />

          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setShowVisualGuide(prev => !prev)}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold transition-all flex items-center gap-1.5 cursor-pointer border ${
                showVisualGuide 
                  ? "bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30 dark:border-blue-500/50 shadow-md shadow-blue-500/5" 
                  : "bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-150 dark:hover:bg-slate-850"
              }`}
              id="visual-guide-toggle-btn"
            >
              <Eye size={12} className={showVisualGuide ? "animate-pulse text-blue-500 dark:text-blue-400" : ""} />
              <span>{showVisualGuide ? localizedLabel("إخفاء الدليل البصري", "Masquer le Guide Visuel", "Hide Visual Guide") : localizedLabel("إظهار الدليل البصري", "Afficher le Guide Visuel", "Show Visual Guide")}</span>
            </button>
            <div className={isRtl ? "text-right" : "text-left"}>
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase block tracking-wider font-mono">{localizedLabel("محاكاة الفحص المخبري", "SIMULATION D'ESSAI LABORATOIRE", "LAB TEST SIMULATION")}</span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white block">
                {localizedLabel("مظهر وشكل الخرسانة بعد رفع القالب", "Forme du béton après levage du cône", "Concrete appearance after mold extraction")}
              </span>
            </div>
          </div>

          {/* Dynamic Visual Guide Overlay Banner identifying Stiff, Plastic, or Flowing */}
          {showVisualGuide && (
            <div className={`bg-white/95 dark:bg-slate-900/90 border border-blue-500/30 backdrop-blur p-2.5 rounded-lg ${isRtl ? "text-right" : "text-left"} animate-fade-in relative z-10 shadow-lg shadow-blue-500/5 flex items-center justify-between gap-4 mb-2`}>
              <div className="flex items-center gap-2">
                <div className="relative flex h-2 w-2 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: slumpState.color }}></span>
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: slumpState.color }}></span>
                </div>
                <div className="mr-1">
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-mono">{localizedLabel("مستوى التماسك النشط", "NIVEAU DE CONSISTANCE ACTIF", "ACTIVE CONSISTENCY LEVEL")}</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {slumpValue <= 5 ? (
                      <span className="text-red-500 dark:text-red-400 font-extrabold">{localizedLabel("قوام متيبس (S1/S2)", "FERME (S1/S2)", "STIFF (S1/S2)")}</span>
                    ) : slumpValue <= 9 ? (
                      <span className="text-emerald-500 dark:text-emerald-400 font-extrabold">{localizedLabel("قوام لدن (S3)", "PLASTIQUE (S3)", "PLASTIC (S3)")}</span>
                    ) : (
                      <span className="text-blue-500 dark:text-blue-400 font-extrabold">{localizedLabel("قوام انسيابي (S4/S5)", "FLUIDE (S4/S5)", "FLOWING (S4/S5)")}</span>
                    )}
                  </span>
                </div>
              </div>
              <div className={`${isRtl ? "text-right" : "text-left"} font-mono text-[10px] text-slate-600 dark:text-slate-300 font-bold bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 px-2 py-1 rounded`}>
                {localizedLabel("مؤشر الهبوط:", "INDICE D'AFFAISSEMENT :", "SLUMP INDEX:")} <span style={{ color: slumpState.color }} className="font-extrabold">{Math.round(slumpValue)} cm</span>
              </div>
            </div>
          )}

          {/* Interactive SVG Animation Stage */}
          <div className="flex items-center justify-center py-2 h-44">
            <svg viewBox="0 0 300 180" className="w-full h-full" id="slump-test-svg-render">
              
              {/* Floor base line or laboratory table plate */}
              <line x1="20" y1="160" x2="280" y2="160" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
              <rect x="15" y="161" width="270" height="4" fill="#1e293b" opacity="0.5" />

              {/* Original Slump Cone reference outline (dotted yellow/gray) */}
              <polygon 
                points="105,50 195,50 240,160 60,160" 
                fill="none" 
                stroke="#475569" 
                strokeWidth="1.5" 
                strokeDasharray="4 4" 
                opacity="0.6"
              />
              
              <text x="150" y="44" fill="#64748B" fontSize="8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                {localizedLabel("قالب مخروط الهبوط (H = 30 سم)", "Moule Cône d'Abrams (H = 30 cm)", "Slump Cone Mold (H = 30 cm)")}
              </text>

              {/* Concrete Mix body shape with gradient fill depending on quality */}
              <defs>
                <linearGradient id="concrete-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#4B5563" />
                  <stop offset="60%" stopColor="#374151" />
                  <stop offset="100%" stopColor="#1F2937" />
                </linearGradient>
                <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Active collapsed concrete volume */}
              <path 
                d={slumpPaths.pilePath} 
                fill="url(#concrete-gradient)" 
                stroke="#4B5563" 
                strokeWidth="2.5" 
                strokeLinejoin="round" 
                className="transition-all duration-300"
              />

              {/* Shine highlight wrapper for wet flowing concretes */}
              {slumpValue > 11 && (
                <path 
                  d={slumpPaths.pilePath} 
                  fill="none" 
                  stroke="#3B82F6" 
                  strokeWidth="1" 
                  opacity="0.35" 
                  className="animate-pulse"
                />
              )}

              {/* Decorative Aggregate particles (Fine + Coarse) drawn in cross section */}
              {aggregates.gravels.map((stone) => {
                // Keep aggregate inside the pile bounding box approximately
                // Filter stones that overflow the dynamic height
                const isOutOfBound = stone.y < (slumpPaths.topY + 12);
                if (isOutOfBound) return null;

                return (
                  <circle
                    key={stone.id}
                    cx={stone.x}
                    cy={stone.y}
                    r={stone.size / 2}
                    fill={stone.col}
                    opacity="0.85"
                    stroke="#1E293B"
                    strokeWidth="0.5"
                    className="transition-all duration-300"
                  />
                );
              })}

              {/* White Air void circles */}
              {aggregates.airBubbles.map((bubble) => {
                if (bubble.y < (slumpPaths.topY + 18)) return null;
                return (
                  <circle
                    key={bubble.id}
                    cx={bubble.x}
                    cy={bubble.y}
                    r={bubble.size}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="0.8"
                    opacity="0.55"
                  />
                );
              })}

              {/* Dynamic Slump scale bar on the right side */}
              <g transform="translate(255, 30)">
                {/* Scale axis */}
                <line x1="0" y1="20" x2="0" y2="130" stroke="#334155" strokeWidth="1" />
                
                {/* Slump height marker limit */}
                <line x1="-5" y1="20" x2="5" y2="20" stroke="#475569" strokeWidth="1" />
                <line x1="-5" y1="130" x2="5" y2="130" stroke="#475569" strokeWidth="1" />
                
                {/* Live slump marker arrow */}
                <g transform={`translate(0, ${20 + slumpPaths.factor * 110})`} className="transition-all duration-300">
                  <polygon points="12,0 3,-5 3,5" fill={slumpState.color} />
                  <line x1="12" y1="0" x2="0" y2="0" stroke={slumpState.color} strokeWidth="2" />
                  <text x="18" y="3" fill={slumpState.color} fontSize="9" fontWeight="bold" fontFamily="monospace">
                    {Math.round(slumpValue)}cm
                  </text>
                </g>
                <text x="0" y="10" fill="#64748B" fontSize="8" textAnchor="middle" fontWeight="bold">
                  {localizedLabel("الهبوط", "TASSEMENT", "SLUMP")}
                </text>
              </g>

              {/* Sheen puddle at base for extreme fluid flows (slump > 15) */}
              {slumpValue >= 16 && (
                <ellipse 
                  cx="150" 
                  cy="160" 
                  rx={85 + (slumpValue - 15) * 3} 
                  ry="2.5" 
                  fill="#60A5FA" 
                  opacity="0.25" 
                  className="animate-pulse"
                />
              )}

              {/* Dynamic Engineering Callout Overlays when 'showVisualGuide' is active */}
              {showVisualGuide && (
                <g className="animate-fade-in transition-all duration-300">
                  {/* Left pointer callout: Original Mold Level Reference */}
                  <g>
                    <line x1="30" y1="50" x2="105" y2="50" stroke="#10B981" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.8" />
                    <circle cx="105" cy="50" r="1.8" fill="#10B981" />
                    <rect x="15" y="34" width="70" height="12" fill="#020617" rx="2" stroke="#10B981" strokeWidth="0.5" opacity="0.9" />
                    <text x="50" y="42" fill="#34D399" fontSize="6" fontWeight="bold" textAnchor="middle">
                      {localizedLabel("قالب 30 سم", "Moule 30cm", "30cm Mold")}
                    </text>
                  </g>

                  {/* Right pointer callout: Dynamic Active State & Slump Depth */}
                  <g>
                    <line x1="150" y1={slumpPaths.topY} x2="220" y2={Math.min(140, Math.max(25, slumpPaths.topY - 15))} stroke="#3B82F6" strokeWidth="0.8" opacity="0.8" />
                    <circle cx="150" cy={slumpPaths.topY} r="1.8" fill="#3B82F6" />
                    <rect x="210" y={Math.min(130, Math.max(10, slumpPaths.topY - 26))} width="85" height="24" fill="#020617" rx="2" stroke="#3B82F6" strokeWidth="0.5" opacity="0.9" />
                    <text x="252.5" y={Math.min(130, Math.max(10, slumpPaths.topY - 26)) + 9} fill="#60A5FA" fontSize="6" fontWeight="bold" textAnchor="middle">
                      {visualGuideData.stateLabel}
                    </text>
                    <text x="252.5" y={Math.min(130, Math.max(10, slumpPaths.topY - 26)) + 18} fill="#94A3B8" fontSize="5.5" textAnchor="middle">
                      {visualGuideData.heightDesc}
                    </text>
                  </g>

                  {/* Bottom-left pointer callout: Shear Stability & Dispersal characteristic */}
                  <g>
                    <line x1={Math.max(50, 150 - (95 + slumpPaths.factor * 90) / 2)} y1="150" x2="35" y2="135" stroke="#F59E0B" strokeWidth="0.8" opacity="0.8" />
                    <circle cx={Math.max(50, 150 - (95 + slumpPaths.factor * 90) / 2)} cy="150" r="1.8" fill="#F59E0B" />
                    <rect x="12" y="98" width="85" height="28" fill="#020617" rx="2" stroke="#F59E0B" strokeWidth="0.5" opacity="0.9" />
                    <text x="54.5" y="106" fill="#FBBF24" fontSize="5.5" fontWeight="bold" textAnchor="middle">
                      {visualGuideData.coneNote}
                    </text>
                    <text x="54.5" y="114" fill="#E5E7EB" fontSize="5" textAnchor="middle">
                      {visualGuideData.shearNote}
                    </text>
                    <text x="54.5" y="121" fill="#94A3B8" fontSize="5" textAnchor="middle">
                      {visualGuideData.cohesion}
                    </text>
                  </g>

                  {/* Multi-tier horizontal color-zoned scale indicator inside the scale bar */}
                  <g transform="translate(250, 30)">
                    {/* Colored level zones indicators next to axis line */}
                    {/* S1: 0-2 (y: 20-30) */}
                    <rect x="2.5" y="20" width="1.5" height="10" fill="#EF4444" opacity="0.8" />
                    {/* S2: 2-5 (y: 30-45) */}
                    <rect x="2.5" y="30" width="1.5" height="15" fill="#F59E0B" opacity="0.8" />
                    {/* S3: 5-9 (y: 45-65) */}
                    <rect x="2.5" y="45" width="1.5" height="20" fill="#10B981" opacity="0.8" />
                    {/* S4: 9-15 (y: 65-95) */}
                    <rect x="2.5" y="65" width="1.5" height="30" fill="#3B82F6" opacity="0.8" />
                    {/* S5: 15-22 (y: 95-130) */}
                    <rect x="2.5" y="95" width="1.5" height="35" fill="#8B5CF6" opacity="0.8" />
                  </g>
                </g>
              )}
            </svg>
          </div>

          {/* Dynamic caption under the preview */}
          <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg mt-1 font-mono justify-between">
            <span className="text-xs font-bold leading-none" style={{ color: slumpState.color }}>
              ▲ {slumpState.shapeDesc}
            </span>
            <span className="text-[10px] text-slate-600 dark:text-slate-500">
              {localizedLabel("سلوك القص:", "Cisaillement :", "Shear Behavior:")} {slumpState.shearBehavior}
            </span>
          </div>

        </div>

        {/* Right Column: Physical & Rheology Engineering Metrics (Occupies 7 columns) */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-4">
          
          {/* Class Title and Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">{localizedLabel("تصنيف مواصفات قوام الخرسانة الرطبة:", "Classe de consistance du béton frais :", "Fresh Concrete Consistency Class:")}</span>
              <div 
                className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold flex items-center gap-1.5"
                style={{ backgroundColor: `${slumpState.color}15`, color: slumpState.color }}
              >
                <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: slumpState.color }} />
                <span>{localizedLabel(`الصف ${slumpState.level} طبقاً للمواصفة EN 206`, `Classe ${slumpState.level} selon EN 206`, `Class ${slumpState.level} per EN 206`)}</span>
              </div>
            </div>

            <h3 className="text-base font-black text-slate-900 dark:text-white animate-pulse" style={{ color: slumpState.color }}>
              {slumpState.nameAr}
            </h3>
            <p className="text-xs text-slate-650 dark:text-slate-300 leading-relaxed">
              {slumpState.desc}
            </p>
          </div>

          {/* Key Indicators Bar block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="rheology-metrics-grid">
            
            <div className={`bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-3 rounded-xl space-y-1 ${isRtl ? "text-right" : "text-left"}`}>
              <span className="text-[10px] text-slate-500 uppercase block font-mono">{localizedLabel("معجون الإسمنت ولمعان الماء", "PÂTE DE CIMENT ET LISSAGE", "SLURRY PASTE AND WATER SHINE")}</span>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-500 dark:text-slate-300">{localizedLabel("محتوى الإسمنت والماء:", "Teneur en ciment & eau :", "Cement & water content:")}</span>
                <span className="text-xs font-semibold text-slate-900 dark:text-white font-mono">
                  {cementWeight} kg + {waterContent} L
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div 
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (waterContent / 235) * 100)}%` }}
                />
              </div>
            </div>

            <div className={`bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-3 rounded-xl space-y-1 ${isRtl ? "text-right" : "text-left"}`}>
              <span className="text-[10px] text-slate-500 uppercase block font-mono">{localizedLabel("الهواء المحبوس بالخرسانة", "AIR OCCLUS DU BÉTON", "CONCRETE AIR OCCLUSION")}</span>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-500 dark:text-slate-300">{localizedLabel("نسبة الفراغات الهوائية:", "Teneur en air occlus :", "Occluded air content:")}</span>
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400 font-mono">
                  {airContent.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div 
                  className="bg-sky-400 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (airContent / 10) * 100)}%` }}
                />
              </div>
            </div>

          </div>

          {/* Microstructure Cross-Section Indicators */}
          <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-3">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 block tracking-widest font-mono">{localizedLabel("مؤشرات البنية المجهرية الداخلية", "PROPRIÉTÉS MICROSTRUCTURALES INTERNES", "INTERNAL MICROSTRUCTURE INSIGHTS")}</span>
            
            <div className="space-y-2 text-xs">
              
              <div className="flex items-start gap-1 justify-between">
                <div className={`${isRtl ? "text-right" : "text-left"} space-y-0.5`}>
                  <span className="font-bold text-slate-900 dark:text-white block">{localizedLabel("مقاومة الانفصال الحبيبي", "Résistance à la ségrégation", "Segregation Resistance")}</span>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400">{slumpState.segregationRisk}</p>
                </div>
                <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-1.5 py-0.5 rounded shrink-0">{localizedLabel("معاير التماسك", "Cohésion", "Cohesion Metric")}</span>
              </div>

              <div className="h-px bg-slate-200 dark:bg-slate-800" />

              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-[#94A3B8] inline-block" />
                  <span className="text-slate-600 dark:text-slate-300">{localizedLabel("حصى خشن (Gravier) :", "Gros gravier (Gravel) :", "Coarse gravel (Gravel):")} {gravelRatio}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-[#64748B] inline-block" />
                  <span className="text-slate-600 dark:text-slate-300">{localizedLabel("رمل ناعم (Sable) :", "Sable fin (Sand) :", "Fine sand (Sand):")} {sandRatio}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block" />
                  <span className="text-slate-600 dark:text-slate-300">{localizedLabel("معجون إسمنتي (Pâte)", "Pâte de ciment (Paste)", "Cement paste (Paste)")}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Algerian Standard Compliance Tip */}
          <div className={`bg-blue-950/10 border border-blue-900/30 p-3 rounded-xl flex items-start gap-2.5 ${isRtl ? "text-right" : "text-left"}`}>
            <AlertCircle size={15} className="text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-[11px] font-extrabold text-blue-300 block">{localizedLabel("توجيهات الكود الجزائري للخرسانة", "Directives du Code Algérien (DTR)", "Algerian Concrete Code Guidelines (DTR)")}</span>
              <p className="text-[10.5px] text-slate-400 font-sans leading-normal">
                {localizedLabel("لتفادي انسداد أنابيب المضخة، حافظ على هبوط slump بين 8 إلى 14 سم مع رمل مصحح ذو معامل نعومة عياري (2.4 - 2.8) واستخدام مضاف فائق اللدونة.", "Pour éviter le blocage de la pompe, maintenir un affaissement de 8 à 14 cm avec un sable de module de finesse standard (2,4 - 2,8) et un superplastifiant.", "To prevent pump blockage, maintain slump between 8 and 14 cm with sand of standard fineness modulus (2.4 - 2.8) and use a superplasticizer.")}
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
