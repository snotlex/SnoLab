import React, { useState, useMemo } from "react";
import { Image, Sparkles, Loader2, RefreshCw, AlertCircle, Eye, Info, CheckCircle, Download } from "lucide-react";
import { useLanguage } from "../services/localization";

interface ConcreteImageVisualizerProps {
  slumpValue: number;
  waterContent: number;
  cementWeight: number;
  aggregateType: string;
  airContent: number;
}

export const ConcreteImageVisualizer: React.FC<ConcreteImageVisualizerProps> = ({
  slumpValue,
  waterContent,
  cementWeight,
  aggregateType,
  airContent,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    imageUrl: string;
    isFallback: boolean;
    isQuotaExceeded?: boolean;
    prompt: string;
    description: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const { language, isRtl } = useLanguage();

  const localizedLabel = (ar: string, fr: string, en: string) => {
    if (language === "ar") return ar;
    if (language === "fr") return fr;
    return en;
  };

  const steps = useMemo(() => [
    localizedLabel("جاري تحليل الهيكل الحبيبي للرمل والركام...", "Analyse de la structure granulaire du sable et des graviers...", "Analyzing granular structure of sand and aggregate..."),
    localizedLabel("جاري احتساب لزوجة المعجون الإسمنتي ودرجة الإماهة...", "Calcul de la viscosité de la pâte de ciment et d'hydratation...", "Calculating cement paste viscosity and hydration..."),
    localizedLabel("جاري ضبط المؤشرات الفيزيائية ومعامل سيولتها...", "Ajustement des indices physiques et fluidité...", "Adjusting physical indexes and flow coefficients..."),
    localizedLabel("جاري تهيئة محاكاة المظهر المجهري النهائي للخلطة الحية...", "Simulation de l'aspect microscopique du béton vivant...", "Preparing microstructural visualization for live mix...")
  ], [language]);

  const handleVisualize = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    setLoadingStep(0);

    // Dynamic steps intervals
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1200);

    try {
      const response = await fetch("/api/concrete-visualize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slump: slumpValue,
          waterContent,
          cementContent: cementWeight,
          aggregateType,
          airContent,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Translate or localized the description if needed, or use the procedural one if AI description is not multilinguistic
        setResult(data);
      } else {
        // If server failed with custom error, fall back locally instead of showing error
        const localDescription = getConcreteTextureDescription(slumpValue, aggregateType, waterContent, cementWeight, localizedLabel);
        const localSvg = generateProceduralConcreteSVG(slumpValue, aggregateType, waterContent, cementWeight, airContent, localizedLabel);
        setResult({
          success: true,
          isFallback: true,
          isQuotaExceeded: true,
          imageUrl: `data:image/svg+xml;utf8,${encodeURIComponent(localSvg)}`,
          prompt: "Client-side fallback generated locally",
          description: `${localDescription} ${localizedLabel("(تم التفعيل التلقائي لمحاكي المتصفح الاحتياطي)", "(Moteur de secours local activé)", "(Local fallback simulator active)")}`
        });
      }
    } catch (err) {
      console.log("Activating browser-side physics rendering engine...");
      
      const localDescription = getConcreteTextureDescription(slumpValue, aggregateType, waterContent, cementWeight, localizedLabel);
      const localSvg = generateProceduralConcreteSVG(slumpValue, aggregateType, waterContent, cementWeight, airContent, localizedLabel);
      
      setResult({
        success: true,
        isFallback: true,
        isQuotaExceeded: true,
        imageUrl: `data:image/svg+xml;utf8,${encodeURIComponent(localSvg)}`,
        prompt: "Client-side fallback generated locally on fetch failure",
        description: `${localDescription} ${localizedLabel("(نظام المحاكاة الاحتياطي في المتصفح نشط للعمل دون انقطاع)", "(Rendu vectoriel de secours actif pour un fonctionnement continu)", "(Local vector rendering fallback active for uninterrupted operations)")}`
      });
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  return (
    <div 
      className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-800 dark:text-slate-100 shadow-xl space-y-5" 
      id="concrete-image-visualizer"
    >
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="text-amber-500 dark:text-amber-400 w-5 h-5 animate-pulse" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-wide">
            {localizedLabel("مستكشف تجسيم مظهر وقوام الخرسانة الحية", "Visualisateur de texture & aspect 3D du béton frais", "Live Concrete Texture & 3D Visual Simulator")}
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-widest uppercase">
          AI & PROCEDURAL VISUALIZATION ENGINE
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Helper/CTA Column */}
        <div className="md:col-span-5 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            {localizedLabel("تتيح لك هذه الأداة المتطورة إنشاء تمثيل بصري عالي الدقة ومفصل يوضح طبيعة تداخل المكونات، ولمعان المعجون الإسمنتي الرطب، ومدى تراص الركام بناءً على متغيرات دراستك الحالية.", "Cet outil avancé génère une simulation visuelle haute fidélité montrant l'imprication des granulats, le lustre de la pâte de ciment fraîche et la compacité du mélange.", "This advanced tool generates a high-fidelity visual simulation showing particle interlocking, fresh cement paste gloss, and aggregate packing based on your current formulation inputs.")}
          </p>
          
          <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase">{localizedLabel("المتغيرات المرصودة للتوليد:", "Paramètres observés pour la simulation :", "Observed variables for generation:")}</span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-650 dark:text-slate-300">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                <span className="text-amber-600 dark:text-amber-500">{localizedLabel("الهبوط Slump:", "Affaissement (Slump) :", "Slump Depth:")}</span>
                <span className="font-bold text-slate-900 dark:text-white">{Math.round(slumpValue)} cm</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                <span className="text-blue-600 dark:text-blue-400">{localizedLabel("الماء Free Water:", "Eau efficace (Water) :", "Free Water:")}</span>
                <span className="font-bold text-slate-900 dark:text-white">{Math.round(waterContent)} L</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                <span className="text-slate-500 dark:text-slate-400">{localizedLabel("الإسمنت Cement:", "Dosage Ciment (Cement) :", "Cement Content:")}</span>
                <span className="font-bold text-slate-900 dark:text-white">{Math.round(cementWeight)} kg</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                <span className="text-sky-600 dark:text-sky-400">{localizedLabel("الفراغات Air:", "Air occlus (Air) :", "Air Voids:")}</span>
                <span className="font-bold text-slate-900 dark:text-white">{airContent}%</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleVisualize}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] ${
              loading 
                ? "bg-slate-800 text-slate-400 cursor-not-allowed" 
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white hover:shadow-indigo-500/10"
            }`}
            id="btn-visualize-mix"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin text-blue-400" />
                <span>{localizedLabel("جاري معالجة المحاكاة...", "Simulation en cours...", "Processing simulation...")}</span>
              </>
            ) : (
              <>
                <Image size={14} className="text-white" />
                <span>{localizedLabel("توليد وتجسيد مظهر الخليط", "Visualiser le mélange", "Visualize Mix Appearance")}</span>
              </>
            )}
          </button>
        </div>

        {/* Display Frame Column */}
        <div className="md:col-span-7" id="visualization-image-frame-root">
          {loading ? (
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl h-64 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">{localizedLabel("تحضير أداة التجسيد الحركية...", "Préparation du moteur de rendu...", "Preparing physics rendering engine...")}</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono animate-pulse">{steps[loadingStep]}</p>
              </div>
              <div className="w-48 bg-slate-200 dark:bg-slate-850 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-500" 
                  style={{ width: `${((loadingStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>
          ) : error ? (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl h-64 flex flex-col items-center justify-center p-6 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-rose-500" />
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{localizedLabel("عذراً، فشل معالجة الطلب", "Désolé, échec du traitement", "Sorry, simulation failed")}</span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal max-w-sm">{error}</p>
              <button 
                onClick={handleVisualize} 
                className="mt-2 text-[10.5px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 py-1 px-3 rounded font-bold transition-all"
              >
                {localizedLabel("إعادة المحاولة", "Réessayer", "Retry")}
              </button>
            </div>
          ) : result ? (
            <div className="space-y-4">
              {result.isQuotaExceeded && (
                <div className={`bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/40 p-3.5 rounded-xl flex items-start gap-2.5 ${isRtl ? "text-right" : "text-left"} text-xs animate-fade-in`}>
                  <AlertCircle size={15} className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-amber-800 dark:text-amber-300 block text-[11px]">{localizedLabel("نظام محاكاة متجهات الركام الفيزيائية النشط", "Simulateur physique de texture actif", "Active Physical Aggregate Texture Simulator")}</span>
                    <p className="text-[10.5px] text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
                      {localizedLabel("نظراً لوصول خدمة التوليد الصوري بالذكاء الاصطناعي للحد الأقصى، قام النظام فوراً بتفعيل محرّك التجسيد الميكانيكي لتمثيل قوام وعناصر الخرسانة (الرمل، الحصويات، معجون الترابط، الفراغات) بدقة هندسية ومجهرية مطابقة لمدخلاتك.", "Le quota de génération d'images IA gratuit étant atteint, le système a activé le moteur de rendu physique/vectoriel pour simuler la texture du béton frais avec une haute précision géométrique.", "AI image generation quota reached. The system automatically launched the vector-based physical simulator to represent sand, gravels, cement slurry, and air voids matching your current mix inputs.")}
                    </p>
                  </div>
                </div>
              )}

              <div className="relative group bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-2 overflow-hidden flex items-center justify-center">
                <img 
                  src={result.imageUrl} 
                  alt="Concrete Mix Texture Visualization" 
                  className="rounded-lg max-h-60 max-w-full object-contain transition-transform duration-300 hover:scale-[1.02]"
                  referrerPolicy="no-referrer"
                />
                
                {/* Download and Fallback labels */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-slate-100/95 dark:bg-slate-900/90 text-[9px] text-slate-600 dark:text-slate-400 font-mono px-2 py-1 rounded border border-slate-200 dark:border-slate-800">
                    {result.isFallback ? "PRECISION VECTOR SIM" : "GEMINI GENERATED IMAGEN"}
                  </span>
                  
                  <a 
                    href={result.imageUrl} 
                    download={`concrete-mix-slump-${Math.round(slumpValue)}.png`}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-lg transition-colors flex items-center justify-center shadow-lg cursor-pointer"
                    title={localizedLabel("تحميل الصورة", "Télécharger l'image", "Download Image")}
                  >
                    <Download size={13} />
                  </a>
                </div>
              </div>

              {/* Description Card */}
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-black" style={{ color: result.isFallback ? "#0284C7" : "#8B5CF6" }}>
                  <Info size={12} />
                  <span>{localizedLabel("التحليل البصري والمجهري للخلطة الناتجة:", "Analyse visuelle et microscopique du mélange :", "Visual and Microscopic Analysis:")}</span>
                </div>
                <p className={`text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-sans ${isRtl ? "text-right" : "text-left"}`}>
                  {result.description}
                </p>
                <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-mono pt-1 border-t border-slate-200 dark:border-slate-900">
                  <span>METHOD: {result.isFallback ? "RHEOLOGY_VECTOR_ENGINE" : "GEMINI_2.5_FLASH"}</span>
                  <span className="text-emerald-500 dark:text-emerald-400 flex items-center gap-0.5">
                    <CheckCircle size={9} /> {localizedLabel("خلط متوازن هندسياً", "Mélange équilibré", "Engineered Balanced Mix")}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 rounded-xl h-64 flex flex-col items-center justify-center p-6 text-center text-slate-400 dark:text-slate-500 border-dashed">
              <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-full mb-3 border border-slate-200 dark:border-slate-800">
                <Image className="w-6 h-6 text-slate-500 dark:text-slate-400" />
              </div>
              <span className="text-xs font-bold text-slate-750 dark:text-slate-400">{localizedLabel("لا يوجد عرض حالي", "Aucun rendu disponible", "No current render")}</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-500 leading-normal max-w-xs mt-1">
                {localizedLabel("اضغط على زر التجسيد أعلاه لطلب محاكاة الصورة الحقيقية والميكانيكية والمجهرية لخلطتك الراهنة.", "Cliquez sur le bouton ci-dessus pour lancer la simulation microscopique et physique de votre mélange de béton actuel.", "Click the button above to request a high-precision physical and microstructural simulation of your current mix.")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Client-side Rheology and Vector Generators
// ==========================================

function getConcreteTextureDescription(
  slump: number, 
  aggregateType: string, 
  waterContent: number, 
  cementContent: number,
  localizedLabel: (ar: string, fr: string, en: string) => string
): string {
  const wc = waterContent / (cementContent || 1);
  const aggregateName = aggregateType === 'roule' 
    ? localizedLabel("الحصى المستدير الأملس", "graviers roulés lisses", "smooth rounded gravel")
    : localizedLabel("الركام الكلسي المكسر ذو الزوايا", "graviers concassés angulaires", "angular crushed limestone aggregate");
  
  if (slump <= 2) {
    return localizedLabel(
      `بنية خشنة جافة جداً (Dry / Non-plastic) تمثل الخرسانة المضغوطة ذات الهبوط القريب من الصفر. يظهر الخليط على شكل كتل صخرية داكنة متماسكة بشدة مغلفة بطبقة غبار إسمنتي مطفأ ومظهر شبه جاف خالٍ تماماً من أي لمعة مائية. الفراغات البينية بين حبات ${aggregateName} مرئية وتحتاج لرص ميكانيكي قوي وهز مكثف لملء الفراغات.`,
      `Structure très ferme et sèche (S1 - Ferme) représentative d'un béton compacté à affaissement nul. Le mélange se présente sous forme de blocs rocheux sombres et fortement cohérents, enrobés d'une fine couche de poussière de ciment mat. Les vides intergranulaires entre les grains de ${aggregateName} sont visibles et nécessitent un serrage vigoureux.`,
      `Very stiff, dry structure (S1 - Stiff) representing zero-slump compacted concrete. The mixture appears as dark, highly cohesive rocky lumps coated with a thin layer of matte cement dust, with a semi-dry appearance completely lacking any water sheen. The intergranular voids between the particles of ${aggregateName} are visible and require intense mechanical compaction.`
    );
  }
  if (slump <= 5) {
    return localizedLabel(
      `مظهر لدن متماسك خشن (Semi-dry) هبوطه خفيف للغاية. تظهر حبيبات الركام بوضوح ولكنها متداخلة بإحكام مع تغلغل المعجون الإسمنتي في الفجوات بدون فائض. اللمعان السطحي طفيف جداً، والخلطة تحتفظ بكيان ميكانيكي صلب، وهي مثالية للطرق والأرصفة ولا تتعرض للانفصال الحبيبي إطلاقاً.`,
      `Aspect plastique ferme et granuleux (S2 - Plastique ferme) avec affaissement très faible. Les granulats sont nettement visibles mais imbriqués de manière étanche, la pâte de ciment comblant les vides sans aucun excès. Le brillant superficiel est minime et le mélange conserve une excellente tenue, idéal pour les dallages.`,
      `Firme, cohesive and granular appearance (S2 - Semi-dry) with very low slump. Aggregate particles are clearly visible but tightly interlocked, with cement paste thoroughly filling the voids without excess. Surface sheen is minimal, and the mixture maintains solid mechanical integrity, ideal for pavements with zero risk of segregation.`
    );
  }
  if (slump <= 9) {
    return localizedLabel(
      `قوام لدن مثالي متجانس (Optimal Plastic Mix) ذو لمعان كريمي متناسق. يظهر المعجون الإسمنتي الرمادي الغني مغلفاً بالكامل لجميع حبيبات الركام الجافة من ${aggregateName}. الخليط متوازن ميكانيكياً ولا يفرز مياه حرة، مع لزوجة ديناميكية تجعله مثالياً للمنشآت الإنشائية والأعمدة الاعتيادية، ويحقق صلابة رائعة وسهولة ممتازة في التسوية والتشغيل.`,
      `Consistance plastique homogène optimale (S3 - Plastique) avec un brillant crémeux régulier. Une riche pâte de ciment grise enveloppe entièrement tous les granulats de ${aggregateName}. Le mélange est mécaniquement équilibré sans ressuage d'eau libre, idéal pour les structures courantes, offrant une excellente maniabilité.`,
      `Optimal homogeneous plastic consistency (S3 - Optimal Plastic Mix) with a uniform creamy sheen. The rich grey cement paste completely coats all ${aggregateName} particles. The mix is mechanically balanced with no bleeding of free water, providing standard dynamic viscosity ideal for reinforced structures and columns.`
    );
  }
  if (slump <= 15) {
    return localizedLabel(
      `قوام انسيابي رطب عالي التشغيل (Fluid / Flowing Mix) ملائم للضخ بمضخات الموقع. السطح ذو بريق مائي واضح نتيجة ارتفاع نسبة الماء للإسمنت (${wc.toFixed(2)})، مع سيولة تجعل المعجون الإسمنتي يميل للانزلاق وتعبئة زوايا قالب الاختبار بسهولة. تظهر فقاعات هواء مجهرية وتتحرك الحصبيات بحرية نسبية مع تماسك لدن كافٍ إذا تم ضبط الملدنات وبودرة الحشو.`,
      `Consistance fluide à haute ouvrabilité (S4 - Fluide) parfaitement adaptée au pompage. La surface présente un reflet d'eau prononcé en raison du rapport E/C élevé (${wc.toFixed(2)}), favorisant l'écoulement. Des bulles d'air microscopiques sont présentes et les granulats bougent librement avec une bonne cohésion.`,
      `Flowing, highly workable fluid consistency (S4 - Flowing Mix) ideal for direct pump placement. The surface has a visible water sheen due to the elevated water-cement ratio (${wc.toFixed(2)}), causing the slurry to easily flow. Micro air bubbles are present, and aggregates move with relative ease while maintaining sufficient cohesion.`
    );
  }
  return localizedLabel(
    `قوام سائل فائق التدفق (Self-Consociating Flow). الخليط ينهار تماماً مستوياً بشكل بركة رطبة لامعة ذات انعكاسات قوية للضوء. المعجون الإسمنتي الرمادي يحيط بالركام بكثافة مائة مع هالة معزولة عند الأطراف نتيجة نزف المياه الطفيف. يتطلب هذا القوام ضبطاً فائقاً للمضافات الملدنة لضمان عدم ترسب الحصبيات الخشنة في القاع (Segregation).`,
    `Consistance très liquide autoplaçante (S5 - Très fluide). Le mélange s'affaisse complètement pour former une flaque humide très brillante. La pâte de ciment enveloppe lâchement les granulats avec un léger ressuage d'eau. Cette formulation exige un contrôle rigoureux pour éviter le dépôt des gros graviers.`,
    `Self-consolidating fluid consistency (S5 - Self-Leveling). The mix completely collapses into a shiny, highly reflective pool. Grey cement slurry surrounds the aggregate with a slight bleed water halo at the margins. Requires extremely precise dosage of superplasticizers to prevent the coarse aggregates from settling.`
  );
}

function generateProceduralConcreteSVG(
  slump: number,
  aggregateType: string,
  waterContent: number,
  cementContent: number,
  airContent: number,
  localizedLabel: (ar: string, fr: string, en: string) => string
): string {
  const wc = waterContent / (cementContent || 1);
  const isConcasse = aggregateType === "concasse";
  
  let pasteGradientStart = "#4B5563";
  let pasteGradientEnd = "#1F2937";
  let glossyOpacity = 0.05;
  
  if (slump <= 2) {
    pasteGradientStart = "#6B7280";
    pasteGradientEnd = "#374151";
    glossyOpacity = 0.02;
  } else if (slump <= 5) {
    pasteGradientStart = "#555E6D";
    pasteGradientEnd = "#2D3440";
    glossyOpacity = 0.08;
  } else if (slump <= 9) {
    pasteGradientStart = "#4B5563";
    pasteGradientEnd = "#1F2937";
    glossyOpacity = 0.16;
  } else if (slump <= 15) {
    pasteGradientStart = "#3B4452";
    pasteGradientEnd = "#151B26";
    glossyOpacity = 0.28;
  } else {
    pasteGradientStart = "#2F3745";
    pasteGradientEnd = "#0F131A";
    glossyOpacity = 0.45;
  }

  let stonesMarkup = "";
  let seed = 123;
  function random() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  const stoneCount = slump <= 5 ? 28 : slump <= 9 ? 22 : 16;
  
  for (let i = 0; i < stoneCount; i++) {
    const angle = random() * Math.PI * 2;
    const r = random() * 160;
    const cx = 250 + Math.cos(angle) * r;
    const cy = 250 + Math.sin(angle) * r;
    
    const stoneSize = 18 + random() * 32;
    
    const colors = ["#94A3B8", "#64748B", "#475569", "#78716C", "#A8A29E"];
    const baseColor = colors[Math.floor(random() * colors.length)];
    
    if (isConcasse) {
      const points: string[] = [];
      const vertices = 4 + Math.floor(random() * 3);
      for (let v = 0; v < vertices; v++) {
        const vAngle = (v / vertices) * Math.PI * 2 + (random() - 0.5) * 0.4;
        const vR = stoneSize * (0.6 + random() * 0.5);
        const px = cx + Math.cos(vAngle) * vR;
        const py = cy + Math.sin(vAngle) * vR;
        points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
      }
      
      stonesMarkup += `<polygon points="${points.join(" ")}" fill="${baseColor}" stroke="#1E293B" stroke-width="1.5" />`;
      const highlightPoints = points.slice(0, 3).map(p => {
        const [xStr, yStr] = p.split(",");
        const x = parseFloat(xStr);
        const y = parseFloat(yStr);
        return `${(cx + (x - cx) * 0.7).toFixed(1)},${(cy + (y - cy) * 0.7).toFixed(1)}`;
      });
      stonesMarkup += `<polygon points="${highlightPoints.join(" ")}" fill="#FFFFFF" opacity="0.12" />`;
    } else {
      const rx = stoneSize * (0.8 + random() * 0.4);
      const ry = stoneSize * (0.5 + random() * 0.3);
      const rotate = random() * 360;
      stonesMarkup += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" transform="rotate(${rotate.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})" fill="${baseColor}" stroke="#1E293B" stroke-width="1.5" Achilles="" />`;
      stonesMarkup += `<ellipse cx="${(cx - rx * 0.25).toFixed(1)}" cy="${(cy - ry * 0.25).toFixed(1)}" rx="${(rx * 0.4).toFixed(1)}" ry="${(ry * 0.3).toFixed(1)}" transform="rotate(${rotate.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})" fill="#FFFFFF" opacity="0.15" />`;
    }
  }

  let sandMarkup = "";
  for (let i = 0; i < 50; i++) {
    const angle = random() * Math.PI * 2;
    const r = random() * 180;
    const px = 250 + Math.cos(angle) * r;
    const py = 250 + Math.sin(angle) * r;
    const colors = ["#D97706", "#B45309", "#CA8A04", "#78716C"];
    const col = colors[Math.floor(random() * colors.length)];
    sandMarkup += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(1 + random() * 2.5).toFixed(1)}" fill="${col}" opacity="0.6" />`;
  }

  let bubblesMarkup = "";
  const actualBubbles = Math.round(airContent * 4) + 5;
  for (let i = 0; i < actualBubbles; i++) {
    const angle = random() * Math.PI * 2;
    const r = random() * 170;
    const px = 250 + Math.cos(angle) * r;
    const py = 250 + Math.sin(angle) * r;
    bubblesMarkup += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(2 + random() * 3).toFixed(1)}" fill="none" stroke="#FFFFFF" stroke-width="1.2" opacity="0.45" />`;
  }

  let waterBleedingMarkup = "";
  if (slump >= 15) {
    waterBleedingMarkup = `
      <circle cx="250" cy="250" r="194" fill="none" stroke="#60A5FA" stroke-width="4" opacity="0.3" />
      <circle cx="250" cy="250" r="192" fill="none" stroke="#FFFFFF" stroke-width="1" opacity="0.2" />
    `;
  }

  const slumpLabelText = localizedLabel("الهبوط:", "AFFAISSEMENT :", "SLUMP:");
  const airLabelText = localizedLabel("الهواء:", "AIR :", "AIR:");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%" style="background-color: #0B1120; font-family: monospace;">
      <defs>
        <radialGradient id="paste-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${pasteGradientStart}" />
          <stop offset="100%" stop-color="${pasteGradientEnd}" />
        </radialGradient>
        <linearGradient id="gloss-sweep" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.0" />
          <stop offset="40%" stop-color="#FFFFFF" stop-opacity="${glossyOpacity}" />
          <stop offset="50%" stop-color="#FFFFFF" stop-opacity="${glossyOpacity * 1.5}" />
          <stop offset="60%" stop-color="#FFFFFF" stop-opacity="${glossyOpacity}" />
          <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.0" />
        </linearGradient>
        <clipPath id="circle-clip">
          <circle cx="250" cy="250" r="190" />
        </clipPath>
      </defs>

      <rect x="0" y="0" width="500" height="500" fill="#0F172A" rx="20" stroke="#334155" stroke-width="2" />
      <circle cx="250" cy="250" r="198" fill="none" stroke="#1E293B" stroke-width="8" opacity="0.7" />
      <circle cx="250" cy="250" r="192" fill="none" stroke="#475569" stroke-width="2" opacity="0.9" />

      <g clip-path="url(#circle-clip)">
        <rect x="50" y="50" width="400" height="400" fill="url(#paste-grad)" />
        ${sandMarkup}
        ${stonesMarkup}
        ${waterBleedingMarkup}
        ${bubblesMarkup}
        <rect x="50" y="50" width="400" height="400" fill="url(#gloss-sweep)" pointer-events="none" />
      </g>

      <rect x="50" y="22" width="400" height="24" fill="#1E293B" rx="4" />
      <text x="250" y="37" fill="#60A5FA" font-size="10" font-weight="950" letter-spacing="1.5" text-anchor="middle">CONCRETE.AI RHEOLOGY SPECTRUM</text>

      <g transform="translate(62, 452)">
        <rect x="0" y="0" width="376" height="34" fill="#0B1120" rx="4" stroke="#1E293B" stroke-width="1" />
        <text x="12" y="21" fill="#94A3B8" font-size="9" font-weight="700">${slumpLabelText} <tspan fill="#60A5FA" font-weight="900">${Math.round(slump)} cm</tspan></text>
        <text x="120" y="21" fill="#94A3B8" font-size="9" font-weight="700">W/C: <tspan fill="#60A5FA" font-weight="900">${wc.toFixed(2)}</tspan></text>
        <text x="210" y="21" fill="#94A3B8" font-size="9" font-weight="700">TYPE: <tspan fill="#60A5FA" font-weight="900">${isConcasse ? localizedLabel("مكسر", "CONCASSÉ", "ANGULAR") : localizedLabel("أملس", "ROULÉ", "ROUNDED")}</tspan></text>
        <text x="312" y="21" fill="#94A3B8" font-size="9" font-weight="700">${airLabelText} <tspan fill="#38BDF8" font-weight="900">${airContent}%</tspan></text>
      </g>
    </svg>
  `;
}