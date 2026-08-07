import React, { useState, useMemo } from "react";
import { 
  BookOpen, 
  Search, 
  Calculator, 
  TrendingUp, 
  Database, 
  Maximize2, 
  Download, 
  Info, 
  Layers, 
  Sliders, 
  HelpCircle, 
  Award, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Compass,
  ArrowLeftRight,
  Scale,
  Activity,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { DREUX_KNOWLEDGE_BASE } from "../engine/dreuxKnowledgeBase";
import { MixDesignInput, MixDesignResult } from "../types";
import { ENCYCLOPEDIA_TERMS, EncyclopediaTerm } from "../data/engineeringEncyclopedia";
import { DreuxEncyclopediaPdfContainer } from "./DreuxEncyclopediaPdfContainer";
import { sanitizeDocumentForPdf, patchWinGCS, replaceOklchWithRgb, replaceOklabWithRgb } from "../utils/pdfColorSanitizer";

interface EngineeringKnowledgeCenterProps {
  inputs: MixDesignInput;
  results: MixDesignResult;
  setActiveSidebarTab: (tab: any) => void;
  language?: "ar" | "en" | "fr";
}

export const EngineeringKnowledgeCenter: React.FC<EngineeringKnowledgeCenterProps> = ({
  inputs,
  results,
  setActiveSidebarTab,
  language = "ar"
}) => {
  // Navigation states inside the knowledge center
  const [activeMethod, setActiveMethod] = useState<"dreux" | "aci" | "doe" | "en206">("dreux");
  const [activeSection, setActiveSection] = useState<
    "intro" | "equations" | "tables" | "charts" | "materials" | "worked_examples" | "standards" | "faq" | "encyclopedia"
  >("intro");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [encyclopediaSearch, setEncyclopediaSearch] = useState("");
  const [encyclopediaCategory, setEncyclopediaCategory] = useState<string>("all");
  const [equationSandboxInputs, setEquationSandboxInputs] = useState<Record<string, number>>({
    fck28: 25,
    sigma: 6,
    cementClass: 42.5,
    dmax: 20,
    K: 0,
    packingDelta: 0,
    moisturePercent: 4.5,
    dryWeight: 850
  });

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [zoomedTable, setZoomedTable] = useState<string | null>(null);
  const [tableSearch, setTableSearch] = useState("");

  // PDF Export State
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfStatusMsg, setPdfStatusMsg] = useState("");

  // Handler to generate and download full Dreux-Gorisse Encyclopedia PDF
  const handleDownloadDreuxEncyclopediaPDF = async () => {
    try {
      setIsGeneratingPdf(true);
      setPdfProgress(10);
      setPdfStatusMsg(
        language === "ar" 
          ? "جاري تهيئة محرك المعالجة والمستندات القياسية..." 
          : "Initializing document rendering engine & libraries..."
      );

      const [html2canvasModule, jsPdfModule] = await Promise.all([
        import("html2canvas"),
        import("jspdf")
      ]);

      const html2canvas = html2canvasModule.default || html2canvasModule;
      const jsPDF = jsPdfModule.jsPDF || jsPdfModule.default || jsPdfModule;

      setPdfProgress(25);
      setPdfStatusMsg(
        language === "ar"
          ? "جاري معالجة صفحات موسوعة دروغوريس الشاملة (7 صفحات A4)..."
          : "Processing Dreux-Gorisse Encyclopedia pages (7 A4 pages)..."
      );

      await sanitizeDocumentForPdf(document);
      await new Promise(res => setTimeout(res, 350));

      const pdfRoot = document.getElementById("dreux-encyclopedia-pdf-export-root");
      const pageContainers = pdfRoot ? pdfRoot.querySelectorAll(".dreux-pdf-page") : [];

      if (!pageContainers || pageContainers.length === 0) {
        throw new Error("Dreux PDF page containers not found in DOM.");
      }

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      for (let i = 0; i < pageContainers.length; i++) {
        const pageEl = pageContainers[i] as HTMLElement;
        const pageNum = i + 1;
        setPdfProgress(25 + Math.round((i / pageContainers.length) * 65));
        setPdfStatusMsg(
          language === "ar"
            ? `جاري معالجة وتحويل الصفحة ${pageNum} من ${pageContainers.length} إلى PDF...`
            : `Rendering page ${pageNum} of ${pageContainers.length} to PDF...`
        );

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          onclone: (clonedDoc) => {
            if (clonedDoc.defaultView) {
              patchWinGCS(clonedDoc.defaultView);
            }
            // Sanitize style attributes in cloned document
            const clonedInlineStyles = clonedDoc.querySelectorAll("[style]");
            clonedInlineStyles.forEach(elem => {
              const styleAttr = elem.getAttribute("style");
              if (styleAttr && /oklch|oklab/i.test(styleAttr)) {
                let updatedStyle = replaceOklchWithRgb(styleAttr);
                updatedStyle = replaceOklabWithRgb(updatedStyle);
                elem.setAttribute("style", updatedStyle);
              }
            });
          }
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.98);

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
      }

      setPdfProgress(95);
      setPdfStatusMsg(
        language === "ar"
          ? "جاري حفظ وتنزيل ملف PDF..."
          : "Saving & downloading complete Dreux Encyclopedia PDF..."
      );

      pdf.save("Mousooat_Dreux_Gorisse_Complete_Encyclopedia.pdf");

      setPdfProgress(100);
      await new Promise(res => setTimeout(res, 400));
    } catch (err) {
      console.error("Failed to generate Dreux Encyclopedia PDF:", err);
      alert(language === "ar" ? "حدث خطأ أثناء تصدير ملف PDF، يرجى إعادة المحاولة." : "Error exporting PDF, please try again.");
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress(0);
      setPdfStatusMsg("");
    }
  };

  // Translate text according to language selection
  const t = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      title: {
        ar: "📚 مركز المعرفة الهندسي لبناء الخرسانة",
        en: "📚 Concrete Engineering Knowledge Center",
        fr: "📚 Centre de Connaissances en Génie Civil"
      },
      subtitle: {
        ar: "الدليل العلمي التفاعلي الموحد والمحرك الديناميكي لتركيب الخرسانة بطريقة دروكس-غوريس والكودات العالمية",
        en: "Dynamic scientific reference & interactive companion for the Georges Dreux-Gorisse concrete formulation method and international standards",
        fr: "Le guide scientifique interactif unifié pour la méthode Dreux-Gorisse et les normes de formulation du béton"
      },
      searchPlaceholder: {
        ar: "ابحث عن معادلة، جدول، متغير هندسي، أو قاعدة تصميم...",
        en: "Search for an equation, table, engineering variable, design rule...",
        fr: "Rechercher une équation, un tableau, une variable de génie civil..."
      }
    };
    return translations[key]?.[language] || translations[key]?.["en"] || key;
  };

  // Helper to trigger interactive equation calculations
  const calculateSandboxValue = (eqId: string) => {
    const { fck28, sigma, cementClass, dmax, K, packingDelta, moisturePercent, dryWeight } = equationSandboxInputs;
    switch (eqId) {
      case "target_strength":
        return (fck28 + 1.64 * sigma).toFixed(2) + " MPa";
      case "cement_strength_approx":
        return (cementClass * 1.1).toFixed(2) + " MPa";
      case "water_cement_ratio":
        const fce = cementClass * 1.1;
        const fcm = fck28 + 1.64 * sigma;
        const G = dmax <= 12.5 ? 0.40 : dmax <= 25 ? 0.50 : 0.55; // standard standard deviation factor
        const cw = (fcm / (G * fce)) + 0.5;
        const wc = 1 / cw;
        return `C/W = ${cw.toFixed(2)} (W/C = ${wc.toFixed(2)})`;
      case "pivot_point_y":
        return (50 - Math.sqrt(dmax) + K - (packingDelta * 40)).toFixed(1) + " %";
      case "moisture_adjustment":
        return (dryWeight * (1 + moisturePercent / 100)).toFixed(1) + " kg/m³";
      default:
        return "N/A";
    }
  };

  // Export Table Data to JSON Helper
  const handleExportTable = (tableName: string, data: any) => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `${tableName}_lookup_table.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // SVG-based dynamic Water Demand chart values generator
  const waterDemandChartData = useMemo(() => {
    return DREUX_KNOWLEDGE_BASE.lookupTables.baseWaterDemand.data.map((item: any) => ({
      x: item.dMaxLimit === 999 ? 100 : item.dMaxLimit,
      y: item.water,
      label: item.dMaxLimit === 999 ? "Dmax > 80" : `${item.dMaxLimit}mm`
    }));
  }, []);

  // Filtered equations
  const filteredEquations = useMemo(() => {
    const eqs = Object.values(DREUX_KNOWLEDGE_BASE.equations);
    if (!searchQuery) return eqs;
    return eqs.filter(
      eq => 
        eq.nameAr.includes(searchQuery) || 
        eq.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.formula.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.description.includes(searchQuery)
    );
  }, [searchQuery]);

  // FAQs Database
  const faqs = [
    {
      qAr: "ما هو مبدأ الرص الأقصى في طريقة دروكس-غوريس؟",
      qEn: "What is the maximum packing density principle in the Dreux-Gorisse method?",
      aAr: "تعتمد الطريقة على مبدأ تعبئة الفراغات بحدها الأقصى (Maximizing Packing Density). تسعى الطريقة لتقليل حجم الفراغات البينية بين حبيبات الركام عن طريق استخدام منحنى حبيبي مرجعي مثالي ينكسر عند نقطة انعطاف محددة (Pivot Point). تضمن هذه الطريقة توفير خرسانة متراصة للغاية، مما يحسن من مقاومتها الميكانيكية ومتانتها ويقلل من نفاذية المياه عبر الفراغات الشعرية الخفية.",
      aEn: "The method is based on the principle of maximizing the packing density of the combined aggregate framework. It aims to minimize void volume between aggregate particles by using an ideal reference grading curve with a specific pivot point. This ensures a highly compact, dense concrete matrix, enhancing mechanical strength, water tightness, and durability against chemical attacks.",
      ref: "Georges Dreux (Nouveau guide de la formulation des bétons), Chapter 4"
    },
    {
      qAr: "كيف يتم تقدير مقاومة الإسمنت الفعلية fce؟",
      qEn: "How is the actual cement strength (fce) approximated?",
      aAr: "في التصاميم الهندسية الدقيقة، تكون المقاومة الحقيقية للإسمنت المستخدم بعمر 28 يوماً أعلى عادةً من الرتبة الاسمية بمقدار 10% إلى 15% لتعويض تباين جودة التصنيع. لذا تقترح طريقة دروكس معادلة التقريب: fce = 1.1 * fcem. حيث أن fcem هي الرتبة الاسمية للإسمنت (مثلاً 42.5 ميجاباسكال) مما يجعل المقاومة الحقيقية المقدرة fce تساوي 46.75 ميجاباسكال.",
      aEn: "In precise mix design, the actual 28-day strength of cement is usually higher than its nominal grade class by 10% to 15% to account for manufacturer quality margins. Georges Dreux proposed the approximation fce = 1.1 * fcem. For a CEM 42.5 grade, the estimated actual strength used in Bolomey's formula becomes 46.75 MPa.",
      ref: "Georges Dreux, Chapter 2 (Bolomey Equation Adaptations)"
    },
    {
      qAr: "ما هو دور معامل النعومة (FM) للرمل وما هي الحدود المثالية له؟",
      qEn: "What is the role of Sand Fineness Modulus (FM) and what are its ideal limits?",
      aAr: "معامل النعومة (Fineness Modulus) هو مؤشر يعبر عن متوسط حجم حبيبات الرمل. القيمة المثالية لخرسانة عالية الجودة تقع بين 2.2 و 2.8. إذا كان المعامل أقل من 2.2 (رمل ناعم جداً)، تزداد المساحة السطحية النوعية للركام مما يرفع بشدة طلب المياه والموثق الإسمنتي ويزيد من مخاطر الانكماش. أما إذا كان أكبر من 2.8 (رمل خشن جداً)، تصبح الخرسانة قاسية وصعبة التشغيل وعرضة للانفصال الحبيبي ونضح الماء السطحي.",
      aEn: "Fineness Modulus (FM) represents the weighted average size of sand grains. For high-quality structural concrete, the ideal range is between 2.2 and 2.8. An FM below 2.2 (excessively fine sand) increases aggregate surface area, requiring more mixing water and cement to maintain workability, which raises shrinkage risks. An FM above 2.8 (coarse sand) makes concrete harsh, unworkable, and prone to aggregate segregation and bleeding.",
      ref: "NF EN 12620 (Aggregates for Concrete Standard)"
    },
    {
      qAr: "لماذا تختلف قيم معامل التماسك الحبيبي K في طريقة دروكس؟",
      qEn: "Why do the values of the granular constant K vary in the Dreux method?",
      aAr: "المعامل K هو قيمة تصحيحية مستخدمة لحساب إحداثي نقطة الانعطاف العمودية Y. يعبر هذا المعامل عن تأثير جودة ونوع الدمك والاهتزاز المستخدم، ونعومة الرمل المستخدم، وكمية الأسمنت الموثق الإضافية. فمثلاً، الاهتزاز القوي والمقاس الأكبر Dmax يقلل من الطلب الكلي على الرمل الناعم، في حين أن الرمل الناعم جداً والصب اليدوي يتطلب زيادة الرمل الناعم في الخلطة لملء الفراغات.",
      aEn: "The constant K is a correction parameter used to adjust the pivot point's Y coordinate. It encapsulates the physical impact of the vibration energy, the sand fineness modulus, and the cement dosage content. Powerful mechanical vibration and larger Dmax reduce the fine sand requirement (decreasing K), while manual compaction and higher cement content increase the fine-aggregate volume requirement (increasing K).",
      ref: "Georges Dreux (Nouveau guide de la formulation des bétons), Table 4.2"
    }
  ];

  return (
    <div className="bg-white dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-850 shadow-2xl space-y-8 select-none font-sans" id="snolab-knowledge-center" dir={language === "ar" ? "rtl" : "ltr"}>
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800 animate-fade-in">
        <div className="space-y-2 text-right">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-black uppercase font-mono tracking-wider">
            <Award size={12} />
            {language === "ar" ? "قاعدة معرفة هندسية حية" : "Live Engineering Knowledge Portal"}
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-950 dark:text-slate-50 tracking-tight leading-tight">
            {t("title")}
          </h1>
          <p className="text-xs text-slate-505 dark:text-slate-400 font-sans max-w-3xl leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* HEADER RIGHT CONTROLS: PDF DOWNLOAD BUTTON & METHOD STANDARD TABS */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* DOWNLOAD COMPLETE DREUX ENCYCLOPEDIA PDF BUTTON */}
          <button
            onClick={handleDownloadDreuxEncyclopediaPDF}
            disabled={isGeneratingPdf}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-xs rounded-2xl shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-2 border border-blue-400/30 disabled:opacity-50 active:scale-95"
            title={language === "ar" ? "تحميل موسوعة دروغوريس الكاملة بصيغة PDF (7 صفحات A4)" : "Download Complete Dreux Encyclopedia PDF"}
          >
            <Download size={15} className={isGeneratingPdf ? "animate-bounce text-blue-200" : "text-white"} />
            <span>
              {isGeneratingPdf
                ? (language === "ar" ? "جاري تجهيز PDF..." : "Generating PDF...")
                : (language === "ar" ? "تحميل الموسوعة (PDF)" : language === "fr" ? "Télécharger L'Encyclopédie (PDF)" : "Download Encyclopedia (PDF)")}
            </span>
            <span className="text-[9.5px] bg-white/20 text-white font-mono px-1.5 py-0.5 rounded-md font-bold border border-white/20">
              7 A4
            </span>
          </button>

          {/* METHOD STANDARD TABS SELECTOR */}
          <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-1.5 rounded-2xl flex items-center gap-1 shrink-0">
            <button
              onClick={() => setActiveMethod("dreux")}
              className={`px-3 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${activeMethod === "dreux" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-450 shadow-md" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}`}
            >
              <span>🇫🇷</span>
              <span>{language === "ar" ? "دروكس-غوريس" : "Dreux-Gorisse"}</span>
            </button>
            <button
              onClick={() => setActiveMethod("aci")}
              className={`px-3 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${activeMethod === "aci" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-450 shadow-md" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-60"}`}
            >
              <span>🇺🇸</span>
              <span>ACI 211.1</span>
              <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1 py-0.5 rounded text-[8px]">قريباً</span>
            </button>
            <button
              onClick={() => setActiveMethod("doe")}
              className={`px-3 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${activeMethod === "doe" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-450 shadow-md" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-60"}`}
            >
              <span>🇬🇧</span>
              <span>DOE UK</span>
              <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1 py-0.5 rounded text-[8px]">قريباً</span>
            </button>
          </div>
        </div>
      </div>

      {activeMethod !== "dreux" ? (
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-10 text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto text-2xl">
            🏗️
          </div>
          <h3 className="text-lg font-black">
            {language === "ar" ? "قاعدة البيانات الخاصة بهذا المعيار قيد التهيئة" : "International Standard Standardizing Under Construction"}
          </h3>
          <p className="text-xs text-slate-505 max-w-md mx-auto leading-relaxed">
            {language === "ar"
              ? "يقوم مهندسو SnoLab حالياً ببناء وترميز قواعد البيانات التفاعلية الخاصة بـ ACI 211.1 و DOE لتندمج مباشرة في مركز المعرفة ومحرك الحساب الذكي."
              : "SnoLab engineers are currently compiling and structuring the digital knowledge assets for ACI 211.1 and the British DOE method. They will be dynamically wired into both the Calculator and Knowledge Center."}
          </p>
          <button
            onClick={() => setActiveMethod("dreux")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            {language === "ar" ? "العودة لطريقة دروكس" : "Back to Georges Dreux"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT LATERAL SECTION TABS */}
          <div className="lg:col-span-3 flex flex-row lg:flex-col overflow-x-auto gap-2 p-1 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/40 rounded-2xl shrink-0 scrollbar-none">
            <button
              onClick={() => setActiveSection("intro")}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all text-right whitespace-nowrap cursor-pointer ${activeSection === "intro" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-750" : "text-slate-505 hover:text-slate-800 dark:hover:text-slate-200"}`}
            >
              <BookOpen size={14} className={activeSection === "intro" ? "text-blue-500" : "text-slate-400"} />
              <span>{language === "ar" ? "📖 مقدمة وتاريخ الطريقة" : "Introduction & History"}</span>
            </button>
            <button
              onClick={() => setActiveSection("equations")}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all text-right whitespace-nowrap cursor-pointer ${activeSection === "equations" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-750" : "text-slate-505 hover:text-slate-800 dark:hover:text-slate-200"}`}
            >
              <Calculator size={14} className={activeSection === "equations" ? "text-blue-500" : "text-slate-400"} />
              <span>{language === "ar" ? "🧮 المعادلات الهندسية الحية" : "Engineering Equations"}</span>
            </button>
            <button
              onClick={() => setActiveSection("tables")}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all text-right whitespace-nowrap cursor-pointer ${activeSection === "tables" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-750" : "text-slate-505 hover:text-slate-800 dark:hover:text-slate-200"}`}
            >
              <Database size={14} className={activeSection === "tables" ? "text-blue-500" : "text-slate-400"} />
              <span>{language === "ar" ? "📊 جداول دروكس الأصلية" : "Original Design Tables"}</span>
            </button>
            <button
              onClick={() => setActiveSection("charts")}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all text-right whitespace-nowrap cursor-pointer ${activeSection === "charts" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-750" : "text-slate-505 hover:text-slate-800 dark:hover:text-slate-200"}`}
            >
              <TrendingUp size={14} className={activeSection === "charts" ? "text-blue-500" : "text-slate-400"} />
              <span>{language === "ar" ? "📈 المنحنيات التفاعلية" : "Interactive Curves"}</span>
            </button>
            <button
              onClick={() => setActiveSection("materials")}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all text-right whitespace-nowrap cursor-pointer ${activeSection === "materials" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-750" : "text-slate-505 hover:text-slate-800 dark:hover:text-slate-200"}`}
            >
              <Layers size={14} className={activeSection === "materials" ? "text-blue-500" : "text-slate-400"} />
              <span>{language === "ar" ? "🧱 خصائص الركام والمواد" : "Material Characterization"}</span>
            </button>
            <button
              onClick={() => setActiveSection("worked_examples")}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all text-right whitespace-nowrap cursor-pointer ${activeSection === "worked_examples" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-750" : "text-slate-505 hover:text-slate-800 dark:hover:text-slate-200"}`}
            >
              <Sparkles size={14} className={activeSection === "worked_examples" ? "text-blue-500" : "text-slate-400"} />
              <span>{language === "ar" ? "🧪 أمثلة تصميمية كاملة" : "Worked Design Examples"}</span>
            </button>
            <button
              onClick={() => setActiveSection("standards")}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all text-right whitespace-nowrap cursor-pointer ${activeSection === "standards" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-750" : "text-slate-505 hover:text-slate-800 dark:hover:text-slate-200"}`}
            >
              <ArrowLeftRight size={14} className={activeSection === "standards" ? "text-blue-500" : "text-slate-400"} />
              <span>{language === "ar" ? "🌐 مقارنة الأكواد العالمية" : "Codes & Standards"}</span>
            </button>
            <button
              onClick={() => setActiveSection("encyclopedia")}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all text-right whitespace-nowrap cursor-pointer ${activeSection === "encyclopedia" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-750" : "text-slate-505 hover:text-slate-800 dark:hover:text-slate-200"}`}
            >
              <BookOpen size={14} className={activeSection === "encyclopedia" ? "text-blue-500" : "text-slate-400"} />
              <span>{language === "ar" ? "📚 موسوعة المصطلحات الهندسية" : language === "fr" ? "📚 Encyclopédie Technique" : "📚 Engineering Encyclopedia"}</span>
            </button>
            <button
              onClick={() => setActiveSection("faq")}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all text-right whitespace-nowrap cursor-pointer ${activeSection === "faq" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-750" : "text-slate-505 hover:text-slate-800 dark:hover:text-slate-200"}`}
            >
              <HelpCircle size={14} className={activeSection === "faq" ? "text-blue-500" : "text-slate-400"} />
              <span>{language === "ar" ? "❓ الأسئلة الشائعة" : "FAQ"}</span>
            </button>
          </div>

          {/* MAIN ACTIVE SCREEN CONTENT */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* SEARCH BOX (Visible on some sections like equations, tables & encyclopedia) */}
            {(activeSection === "equations" || activeSection === "tables" || activeSection === "encyclopedia") && (
              <div className="relative animate-fade-in">
                <Search size={16} className={`absolute ${language === "ar" ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 text-slate-400`} />
                <input
                  type="text"
                  placeholder={
                    activeSection === "encyclopedia"
                      ? (language === "ar" ? "ابحث في موسوعة المصطلحات الهندسية..." : language === "fr" ? "Rechercher dans l'encyclopédie technique..." : "Search the engineering encyclopedia...")
                      : t("searchPlaceholder")
                  }
                  value={
                    activeSection === "equations" 
                      ? searchQuery 
                      : activeSection === "tables" 
                        ? tableSearch 
                        : encyclopediaSearch
                  }
                  onChange={(e) => {
                    if (activeSection === "equations") setSearchQuery(e.target.value);
                    else if (activeSection === "tables") setTableSearch(e.target.value);
                    else setEncyclopediaSearch(e.target.value);
                  }}
                  className={`w-full py-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${language === "ar" ? "pl-4 pr-11 text-right" : "pr-4 pl-11 text-left"}`}
                />
              </div>
            )}

            {/* 1. SECTION: INTRO */}
            {activeSection === "intro" && (
              <div className="space-y-6 animate-fade-in text-right">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/20 dark:to-slate-900 border border-blue-100/60 dark:border-slate-850 p-6 rounded-3xl space-y-4">
                  <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    {language === "ar" ? "مقدمة علمية في طريقة Georges Dreux-Gorisse" : "Scientific Introduction to the Georges Dreux-Gorisse Method"}
                  </h2>
                  <p className="text-xs text-slate-505 dark:text-slate-400 leading-relaxed font-sans">
                    {language === "ar"
                      ? "تعتبر طريقة دروكس-غوريس (Georges Dreux & Marc-André Gorisse) الصادرة بفرنسا واحدة من أدق الطرق العلمية والرياضية في صياغة وتصميم الخلطات الخرسانية، وهي الطريقة المعتمدة رسمياً في الكود الفرنسي والأوروبي (NF EN 206). تتميز الطريقة بتركيزها على التدرج الحبيبي المستمر والأمثل للركام لتقليل الفراغات البينية للحد الأدنى (Maximizing Granular Compacity)."
                      : "The Georges Dreux-Gorisse method is a premier scientific approach to concrete mix design, widely standardized across European and French engineering norms (NF EN 206). The core philosophy centers on granular physics: achieving maximum dry packing density of aggregates to minimize aggregate void ratio, which drastically reduces the required paste content while boosting concrete mechanical durability and resistance."}
                  </p>
                  <p className="text-xs text-slate-505 dark:text-slate-400 leading-relaxed font-sans">
                    {language === "ar"
                      ? "على عكس الطرق التقليدية التي تفترض نسباً ثابتة للركام، يقوم محرك دروكس بحساب نقطة انحراف حرجة (Pivot Point) على منحنى الغرابيل لكل خلطة بناءً على القطر الأقصى للركام Dmax ونوع الإسمنت وقابلية التشغيل المطلوبة، ليتم توزيع الركام الناعم والخشن بحسابات رياضية بالغة الدقة."
                      : "Unlike empirical methods, Dreux-Gorisse maps out a customized ideal grading curve using a dynamic pivot point. This point is mathematically adjusted depending on Dmax, cement content, compaction energy, and targeted slump, providing an optimized aggregate skeleton specific to each project."}
                  </p>
                </div>

                {/* History & Pioneers Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-850 rounded-2xl p-5 space-y-3">
                    <span className="text-2xl">👨‍🔬</span>
                    <h3 className="text-xs font-black text-slate-800 dark:text-slate-100">
                      {language === "ar" ? "المؤلفون والتطوير التاريخي" : "The Pioneers & Authors"}
                    </h3>
                    <p className="text-[11px] text-slate-505 leading-relaxed font-sans">
                      {language === "ar"
                        ? "وضع جورج دروكس (Georges Dreux) الأسس النظرية للطريقة في السبعينات، وصدرت في كتابه الشهير (Nouveau guide de la formulation des bétons). لاحقاً، قام المهندس مارك-أندريه غوريس (Marc-André Gorisse) بتحديث هذه القواعد والتحقق منها مخبرياً لتتلاءم مع الخرسانات الحديثة ذات المقاومة العالية والمضافات الكيميائية الدقيقة."
                        : "Georges Dreux established the structural mathematics of the method in the 1970s. Marc-André Gorisse later updated these formulas to account for modern high-performance concrete, plasticizing admixtures, and silica fume, aligning it with EN 206-1 standards."}
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-850 rounded-2xl p-5 space-y-3">
                    <span className="text-2xl">🏗️</span>
                    <h3 className="text-xs font-black text-slate-800 dark:text-slate-100">
                      {language === "ar" ? "الفلسفة الهندسية للطريقة" : "Core Engineering Philosophy"}
                    </h3>
                    <p className="text-[11px] text-slate-505 leading-relaxed font-sans">
                      {language === "ar"
                        ? "تقوم الفلسفة الهندسية على أن الخرسانة تتكون من جزأين رئيسيين: الهيكل الصلب (الركام) والملاط الإسمنتي المالئ. كلما كان الهيكل الصلب متراصاً بشكل طبيعي وله معامل فراغات void ratio منخفض، كلما قلّت كمية الملاط اللازمة لملء هذه الفراغات، مما ينتج خرسانة اقتصادية للغاية ذات انكماش وتشققات حرارية شبه منعدمة ومقاومة فائقة للمياه المالحة وعوامل التعرية."
                        : "The engineering core is structured around two phases: the granular aggregate skeleton and the cement paste. By optimizing the combined grading curve to achieve minimal dry voids, the cement paste required is minimized, resulting in exceptional structural integrity, lower shrinkage cracking, and cost-optimized mixes."}
                    </p>
                  </div>
                </div>

                {/* Scope & Advantages/Limitations */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full border-collapse text-xs" dir="rtl">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                        <th className="p-3 text-right font-black text-slate-700 dark:text-slate-300 w-1/3">{language === "ar" ? "الميزة الهندسية" : "Engineering Metric"}</th>
                        <th className="p-3 text-right font-black text-slate-700 dark:text-slate-300">{language === "ar" ? "التوضيح العلمي والتطبيقي" : "Scientific Clarification"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
                      <tr>
                        <td className="p-3 font-bold text-slate-700 dark:text-slate-300">{language === "ar" ? "نطاق التطبيق العلمي" : "Applicability Range"}</td>
                        <td className="p-3 text-slate-505 leading-relaxed font-sans">{language === "ar" ? "الخرسانة العادية والمسلحة ذات المقاومات من 15 إلى 80 ميجاباسكال، الخرسانة خفيفة وثقيلة الوزن، وصب الأساسات العميقة." : "Structural and plain concrete from 15 to 80 MPa, including lightweight, heavyweight, and underwater tremie concretes."}</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-700 dark:text-slate-300">{language === "ar" ? "المزايا الرئيسية" : "Key Advantages"}</td>
                        <td className="p-3 text-slate-505 leading-relaxed font-sans">{language === "ar" ? "توفير الإسمنت دون المساس بالمقاومة، ثبات حجمي ممتاز ومقاومة للزحف، تماسك فائق يمنع انفصال حبيبات الحصى تماماً." : "High cement efficiency, reduced thermal shrink, prevention of aggregate segregation, and superior hydration kinematics."}</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-700 dark:text-slate-300">{language === "ar" ? "محددات الطريقة" : "Limitations"}</td>
                        <td className="p-3 text-slate-505 leading-relaxed font-sans">{language === "ar" ? "تطلب فحوصات مخبرية دقيقة تدرجاً حبيبياً للرمل والحصى، وتعتمد بشدة على معايرة معامل النعومة الحقلية بانتظام." : "Requires rigorous and complete sieve analysis of aggregates, and regular laboratory tracking of sand fineness modulus (FM)."}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. SECTION: EQUATIONS */}
            {activeSection === "equations" && (
              <div className="space-y-6 animate-fade-in text-right">
                <div className="grid grid-cols-1 gap-6">
                  {filteredEquations.map((eq) => (
                    <div 
                      key={eq.id} 
                      className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md hover:shadow-lg transition-all space-y-4"
                    >
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h3 className="text-xs font-black text-slate-900 dark:text-slate-50 flex items-center gap-2">
                          <span className="w-1.5 h-6 bg-blue-600 dark:bg-blue-500 rounded-full"></span>
                          {language === "ar" ? eq.nameAr : eq.nameEn}
                        </h3>
                        <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-500/10 px-2.5 py-1 rounded-lg">
                          ID: {eq.id}
                        </span>
                      </div>

                      {/* LaTeX representation block */}
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl flex items-center justify-center border border-slate-150/60 dark:border-slate-800/40 text-sm md:text-base font-serif text-slate-800 dark:text-slate-100 overflow-x-auto select-all" dir="ltr">
                        <code className="text-blue-600 dark:text-blue-400 font-black">{eq.formula}</code>
                      </div>

                      <p className="text-[11px] text-slate-505 dark:text-slate-400 leading-relaxed font-sans">
                        {eq.description}
                      </p>

                      {/* SANDBOX BLOCK FOR EACH EQUATION */}
                      <div className="bg-blue-50/30 dark:bg-blue-950/10 border border-blue-150/20 dark:border-blue-900/20 rounded-2xl p-4 mt-2 text-right">
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 block mb-3 uppercase tracking-wider font-mono">
                          ⚡ {language === "ar" ? "المحاكاة الهندسية التفاعلية (Sandbox)" : "Interactive Computational Sandbox"}
                        </span>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center mb-3">
                          {eq.id === "target_strength" && (
                            <>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-1">fck28 (MPa)</label>
                                <input
                                  type="number"
                                  value={equationSandboxInputs.fck28}
                                  onChange={(e) => setEquationSandboxInputs(prev => ({ ...prev, fck28: parseFloat(e.target.value) || 0 }))}
                                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-1">σ (Sigma)</label>
                                <input
                                  type="number"
                                  value={equationSandboxInputs.sigma}
                                  onChange={(e) => setEquationSandboxInputs(prev => ({ ...prev, sigma: parseFloat(e.target.value) || 0 }))}
                                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center"
                                />
                              </div>
                            </>
                          )}

                          {eq.id === "cement_strength_approx" && (
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">f_cem (Grade)</label>
                              <input
                                type="number"
                                value={equationSandboxInputs.cementClass}
                                onChange={(e) => setEquationSandboxInputs(prev => ({ ...prev, cementClass: parseFloat(e.target.value) || 0 }))}
                                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center"
                              />
                            </div>
                          )}

                          {eq.id === "water_cement_ratio" && (
                            <>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-1">fck28 (MPa)</label>
                                <input
                                  type="number"
                                  value={equationSandboxInputs.fck28}
                                  onChange={(e) => setEquationSandboxInputs(prev => ({ ...prev, fck28: parseFloat(e.target.value) || 0 }))}
                                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-1">f_cem (Grade)</label>
                                <input
                                  type="number"
                                  value={equationSandboxInputs.cementClass}
                                  onChange={(e) => setEquationSandboxInputs(prev => ({ ...prev, cementClass: parseFloat(e.target.value) || 0 }))}
                                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-1">Dmax (mm)</label>
                                <input
                                  type="number"
                                  value={equationSandboxInputs.dmax}
                                  onChange={(e) => setEquationSandboxInputs(prev => ({ ...prev, dmax: parseFloat(e.target.value) || 0 }))}
                                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center"
                                />
                              </div>
                            </>
                          )}

                          {eq.id === "pivot_point_y" && (
                            <>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-1">Dmax (mm)</label>
                                <input
                                  type="number"
                                  value={equationSandboxInputs.dmax}
                                  onChange={(e) => setEquationSandboxInputs(prev => ({ ...prev, dmax: parseFloat(e.target.value) || 0 }))}
                                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-1">K (Granular)</label>
                                <input
                                  type="number"
                                  value={equationSandboxInputs.K}
                                  onChange={(e) => setEquationSandboxInputs(prev => ({ ...prev, K: parseFloat(e.target.value) || 0 }))}
                                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-1">Δγ (Reflect)</label>
                                <input
                                  type="number"
                                  value={equationSandboxInputs.packingDelta}
                                  onChange={(e) => setEquationSandboxInputs(prev => ({ ...prev, packingDelta: parseFloat(e.target.value) || 0 }))}
                                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center"
                                />
                              </div>
                            </>
                          )}

                          {eq.id === "moisture_adjustment" && (
                            <>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-1">W_dry (kg)</label>
                                <input
                                  type="number"
                                  value={equationSandboxInputs.dryWeight}
                                  onChange={(e) => setEquationSandboxInputs(prev => ({ ...prev, dryWeight: parseFloat(e.target.value) || 0 }))}
                                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-1">w (%)</label>
                                <input
                                  type="number"
                                  value={equationSandboxInputs.moisturePercent}
                                  onChange={(e) => setEquationSandboxInputs(prev => ({ ...prev, moisturePercent: parseFloat(e.target.value) || 0 }))}
                                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center"
                                />
                              </div>
                            </>
                          )}
                        </div>

                        <div className="flex items-center justify-between bg-white dark:bg-[#0B0F19] p-3 rounded-xl border border-blue-500/10">
                          <span className="text-[10px] font-bold text-slate-400">
                            {language === "ar" ? "النتيجة الرياضية المحسوبة:" : "Computational Result:"}
                          </span>
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            {calculateSandboxValue(eq.id)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. SECTION: TABLES */}
            {activeSection === "tables" && (
              <div className="space-y-6 animate-fade-in text-right">
                
                {/* GRID OF DIGITALIZED LOOKUP TABLES */}
                <div className="grid grid-cols-1 gap-6">
                  {Object.entries(DREUX_KNOWLEDGE_BASE.lookupTables).map(([key, table]: [string, any]) => {
                    const isMatched = tableSearch 
                      ? table.nameAr.includes(tableSearch) || table.nameEn.toLowerCase().includes(tableSearch.toLowerCase()) || table.description.includes(tableSearch)
                      : true;
                    if (!isMatched) return null;

                    return (
                      <div 
                        key={key} 
                        className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-md hover:shadow-lg transition-all space-y-4"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                          <div className="space-y-1">
                            <h3 className="text-xs font-black text-slate-900 dark:text-slate-50">
                              {language === "ar" ? table.nameAr : table.nameEn}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                              {table.description}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleExportTable(key, table.data)}
                              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-505 rounded-xl cursor-pointer transition-colors"
                              title={language === "ar" ? "تصدير الملف الرقمي JSON" : "Export JSON metadata"}
                            >
                              <Download size={12} />
                            </button>
                            <button
                              onClick={() => setZoomedTable(zoomedTable === key ? null : key)}
                              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-505 rounded-xl cursor-pointer transition-colors"
                              title={language === "ar" ? "تكبير وعرض كامل" : "Full zoom preview"}
                            >
                              <Maximize2 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* RENDER TABLE DATA DYNAMICALLY */}
                        <div className="overflow-x-auto rounded-2xl border border-slate-150/60 dark:border-slate-850/60 font-sans text-xs">
                          {Array.isArray(table.data) ? (
                            <table className="w-full border-collapse" dir="rtl">
                              <thead>
                                <tr className="bg-slate-50/60 dark:bg-slate-900/60 text-slate-505 border-b border-slate-150 dark:border-slate-850">
                                  {Object.keys(table.data[0] || {}).map((col) => (
                                    <th key={col} className="p-2.5 text-right font-black font-mono">
                                      {col === "dMaxLimit" ? (language === "ar" ? "القطر الأقصى Dmax" : "Dmax Limit") :
                                       col === "water" ? (language === "ar" ? "محتوى الماء (لتر/م³)" : "Water (L/m³)") :
                                       col === "slumpLimit" ? (language === "ar" ? "هبوط قمع أبرامز" : "Slump Limit") :
                                       col === "factor" ? (language === "ar" ? "المعامل التصحيحي" : "Factor") :
                                       col === "gamma" ? (language === "ar" ? "معامل الارتصاص γ0" : "Compactness γ0") :
                                       col === "adjustment" ? (language === "ar" ? "التصحيح الجبري" : "Adjustment") :
                                       col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
                                {table.data.map((row: any, i: number) => (
                                  <tr key={i} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                                    {Object.entries(row).map(([k, val]: [string, any]) => (
                                      <td key={k} className="p-2.5 text-right font-mono font-bold text-slate-700 dark:text-slate-350">
                                        {val === 999 ? "∞" : val}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="p-4 bg-slate-50/40 dark:bg-slate-900/10 text-[11px] text-slate-550 leading-relaxed max-h-40 overflow-y-auto">
                              <pre className="font-mono text-[10px] text-blue-600 dark:text-blue-400">{JSON.stringify(table.data, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. SECTION: CHARTS */}
            {activeSection === "charts" && (
              <div className="space-y-6 animate-fade-in text-right">
                <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-6">
                  
                  {/* CHART 1: WATER DEMAND VS DMAX */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                      {language === "ar" ? "منحنى طلب المياه الصافي W0 بدلالة المقاس الأقصى Dmax" : "Water Demand W0 vs Maximum Aggregate Size Dmax"}
                    </h3>
                    <p className="text-[10px] text-slate-450 leading-relaxed font-sans">
                      {language === "ar"
                        ? "يوضح هذا المنحنى كيف يقل الطلب الكلي للخرسانة على الماء كلما زاد مقاس الحصويات المستخدمة Dmax بسبب صغر المساحة السطحية النوعية للركامات الكلية."
                        : "This physical curve dictates that as maximum aggregate size Dmax increases, the specific surface area of aggregates drops, lowering the design water requirements W0 per cubic meter."}
                    </p>

                    {/* RENDER BEAUTIFUL SVG DYNAMIC CHART */}
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 h-64 flex items-center justify-center relative font-mono text-[10px]">
                      <svg viewBox="0 0 500 220" className="w-full h-full overflow-visible">
                        {/* Grid lines */}
                        <line x1="40" y1="20" x2="480" y2="20" stroke="#E2E8F0" strokeDasharray="3,3" className="dark:stroke-slate-800" />
                        <line x1="40" y1="70" x2="480" y2="70" stroke="#E2E8F0" strokeDasharray="3,3" className="dark:stroke-slate-800" />
                        <line x1="40" y1="120" x2="480" y2="120" stroke="#E2E8F0" strokeDasharray="3,3" className="dark:stroke-slate-800" />
                        <line x1="40" y1="170" x2="480" y2="170" stroke="#E2E8F0" strokeDasharray="3,3" className="dark:stroke-slate-800" />
                        
                        {/* Axes */}
                        <line x1="40" y1="20" x2="40" y2="180" stroke="#94A3B8" className="dark:stroke-slate-700" strokeWidth="1.5" />
                        <line x1="40" y1="180" x2="480" y2="180" stroke="#94A3B8" className="dark:stroke-slate-700" strokeWidth="1.5" />
                        
                        {/* Curve Path */}
                        <path 
                          d="M 50,20 C 100,60 180,120 300,150 L 470,170" 
                          fill="none" 
                          stroke="#2563EB" 
                          strokeWidth="3.5" 
                          strokeLinecap="round"
                        />
                        
                        {/* Points of lookup table */}
                        {waterDemandChartData.map((pt: any, i: number) => {
                          const cx = 40 + (pt.x / 100) * 400;
                          const cy = 180 - ((pt.y - 120) / 190) * 150;
                          if (cx > 480 || cy < 10) return null;
                          return (
                            <g key={i} className="group cursor-pointer">
                              <circle 
                                cx={cx} 
                                cy={cy} 
                                r="4.5" 
                                className="fill-blue-600 stroke-white dark:stroke-slate-900 hover:fill-amber-500 hover:scale-125 transition-all" 
                              />
                              <title>{`${pt.label}: ${pt.y} L/m³`}</title>
                            </g>
                          );
                        })}
                        
                        {/* Labels */}
                        <text x="35" y="25" textAnchor="end" className="fill-slate-400">300</text>
                        <text x="35" y="75" textAnchor="end" className="fill-slate-400">240</text>
                        <text x="35" y="125" textAnchor="end" className="fill-slate-400">180</text>
                        <text x="35" y="175" textAnchor="end" className="fill-slate-400">120</text>
                        
                        <text x="50" y="195" textAnchor="middle" className="fill-slate-400">5</text>
                        <text x="130" y="195" textAnchor="middle" className="fill-slate-400">20</text>
                        <text x="210" y="195" textAnchor="middle" className="fill-slate-400">40</text>
                        <text x="330" y="195" textAnchor="middle" className="fill-slate-400">63</text>
                        <text x="450" y="195" textAnchor="middle" className="fill-slate-400">80+</text>

                        {/* Title of axes */}
                        <text x="260" y="212" textAnchor="middle" className="fill-slate-500 font-bold">{language === "ar" ? "المقاس الأقصى للركام Dmax (ملم)" : "Dmax (mm)"}</text>
                        <text x="12" y="100" textAnchor="middle" transform="rotate(-90 12 100)" className="fill-slate-500 font-bold">{language === "ar" ? "الماء W0 (لتر/م³)" : "Water W0 (L)"}</text>
                      </svg>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 5. SECTION: MATERIALS */}
            {activeSection === "materials" && (
              <div className="space-y-6 animate-fade-in text-right">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Cement Characterization */}
                  <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3 shadow-sm text-right">
                    <span className="text-2xl">🧱</span>
                    <h3 className="text-xs font-black text-slate-900 dark:text-slate-100">
                      {language === "ar" ? "خصائص الإسمنت والروابط الإسمنتية" : "Cementitious Binder Specifications"}
                    </h3>
                    <ul className="text-[11px] text-slate-505 dark:text-slate-400 leading-relaxed font-sans space-y-2 list-disc list-inside">
                      <li>
                        <strong>{language === "ar" ? "الكثافة المطلقة:" : "Absolute Density:"}</strong> 3100 kg/m³ to 3150 kg/m³.
                      </li>
                      <li>
                        <strong>{language === "ar" ? "تأثير الصنف الميكانيكي:" : "Nominal Grade Factor:"}</strong> {language === "ar" ? "رتبة الإسمنت (32.5، 42.5، 52.5) تشكل المقاومة المميزة الحقيقية fcem للصلابة." : "Nominal grades like 42.5 or 52.5 dictate early kinetic strength."}
                      </li>
                      <li>
                        <strong>{language === "ar" ? "المواد البوزولانية والمثبتات:" : "Supplementary Materials (SCMs):"}</strong> {language === "ar" ? "إضافة رماد السيليكا أو الفحم الحجري تعدل الكثافة المطلقة (بين 2200 و 2600 كغم/م³)." : "Silica fume (2200 kg/m³) or fly ash (2300 kg/m³) modify volume calculations."}
                      </li>
                    </ul>
                  </div>

                  {/* Sand Characterization */}
                  <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3 shadow-sm text-right">
                    <span className="text-2xl">🏖️</span>
                    <h3 className="text-xs font-black text-slate-900 dark:text-slate-100">
                      {language === "ar" ? "الركام الناعم (الرمل)" : "Fine Aggregates (Sand)"}
                    </h3>
                    <ul className="text-[11px] text-slate-505 dark:text-slate-400 leading-relaxed font-sans space-y-2 list-disc list-inside">
                      <li>
                        <strong>{language === "ar" ? "معامل النعومة (FM):" : "Fineness Modulus (FM):"}</strong> {language === "ar" ? "المجال الأمثل لـ FM يقع بين 2.2 و 2.8 لضمان خلطة خرسانية متزنة." : "Ideal structural concrete uses sand with an FM between 2.2 and 2.8."}
                      </li>
                      <li>
                        <strong>{language === "ar" ? "الكثافة النوعية المطلقة:" : "Absolute Relative Density:"}</strong> 2600 kg/m³ to 2650 kg/m³.
                      </li>
                      <li>
                        <strong>{language === "ar" ? "أهمية امتصاص الرطوبة:" : "Moisture Deficit & Absorption:"}</strong> {language === "ar" ? "تتم تصحيح الأوزان بدقة لتجنب تغيير نسب الماء الفعلي." : "Moisture adaptation prevents critical shifts in the net batch water content."}
                      </li>
                    </ul>
                  </div>

                </div>
              </div>
            )}

            {/* 6. SECTION: WORKED EXAMPLES */}
            {activeSection === "worked_examples" && (
              <div className="space-y-6 animate-fade-in text-right">
                <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-6 text-right">
                  <h2 className="text-lg font-black text-slate-950 dark:text-slate-50 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                    <span className="p-1.5 bg-blue-500/10 text-blue-500 rounded-xl">🧪</span>
                    {language === "ar" ? "مثال تصميم خلطة كامل خطوة بخطوة" : "Comprehensive Worked Concrete Design Example"}
                  </h2>

                  <div className="space-y-4 text-xs leading-relaxed font-sans text-slate-600 dark:text-slate-350">
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl space-y-2">
                      <span className="font-extrabold text-slate-800 dark:text-slate-100 block">{language === "ar" ? "1. معطيات الإدخال الأساسية:" : "1. Initial Design Inputs:"}</span>
                      <ul className="list-disc list-inside space-y-1 pr-4">
                        <li>{language === "ar" ? "المقاومة المستهدفة fc28:" : "Target 28-day strength fc28:"} 25 MPa</li>
                        <li>{language === "ar" ? "جودة الرقابة بالموقع:" : "Site Quality Control:"} Normal (Sigma = 6 MPa)</li>
                        <li>{language === "ar" ? "رتبة الإسمنت المستخدم:" : "Nominal Cement Class:"} CEM II 42.5</li>
                        <li>{language === "ar" ? "شكل الركام:" : "Aggregate Shape:"} Crushed (مكسر)</li>
                        <li>{language === "ar" ? "القطر الأقصى Dmax:" : "Maximum Sieve Size Dmax:"} 20 mm</li>
                        <li>{language === "ar" ? "الهبوط المستهدف (Slump):" : "Target slump:"} 8 cm</li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <span className="font-extrabold text-slate-800 dark:text-slate-100 block">
                        {language === "ar" ? "الخطوة الأولى: حساب المقاومة المتوسطة fcm28" : "Step 1: Calculate Target Mean Strength fcm28"}
                      </span>
                      <p className="pr-4">
                        {language === "ar" ? "المقاومة المستهدفة = 25 + 1.64 × 6 = 34.84 ميغاباسكال." : "fcm28 = fck28 + 1.64 * sigma = 25 + 1.64 * 6 = 34.84 MPa."}
                      </p>

                      <span className="font-extrabold text-slate-800 dark:text-slate-100 block">
                        {language === "ar" ? "الخطوة الثانية: تقدير مقاومة الإسمنت الحقيقية fce" : "Step 2: Estimate True Cement Compressive Strength fce"}
                      </span>
                      <p className="pr-4">
                        {language === "ar" ? "مقاومة الإسمنت المقدرة = 42.5 × 1.1 = 46.75 ميغاباسكال." : "fce = 1.1 * f_cem = 42.5 * 1.1 = 46.75 MPa."}
                      </p>

                      <span className="font-extrabold text-slate-800 dark:text-slate-100 block">
                        {language === "ar" ? "الخطوة الثالثة: حساب نسبة الماء إلى الإسمنت باستخدام علاقة بولومي" : "Step 3: Solve for C/W and W/C using Bolomey Equation"}
                      </span>
                      <p className="pr-4">
                        {language === "ar" ? "بما أن الركام مكسر و Dmax = 20، نحدد المعامل G = 0.45." : "For crushed aggregates with Dmax = 20mm, aggregate factor G = 0.45."}
                        <br />
                        {language === "ar" ? "معادلة بولومي: C/W = (34.84 / (0.45 × 46.75)) + 0.5 = 2.16." : "Bolomey: C/W = (34.84 / (0.45 * 46.75)) + 0.5 = 1.66 + 0.5 = 2.16."}
                        <br />
                        {language === "ar" ? "وبالتالي نسبة الماء/الإسمنت W/C = 1 / 2.16 = 0.46." : "Hence, net Water/Cement ratio W/C = 1 / 2.16 = 0.46."}
                      </p>

                      <span className="font-extrabold text-slate-800 dark:text-slate-100 block">
                        {language === "ar" ? "الخطوة الرابعة: تحديد كمية مياه التصميم الأساسية W" : "Step 4: Determine Water Demand W"}
                      </span>
                      <p className="pr-4">
                        {language === "ar" ? "من جدول مياه التصميم لقطر Dmax = 20، نجد كمية مياه التصميم الأساسية W0 = 200 لتر/م³." : "From the Water lookup table, for Dmax = 20mm, base water demand W0 = 200 L/m³."}
                        <br />
                        {language === "ar" ? "المعامل التصحيحي للهبوط 8 سم هو 1.00. فتكون كمية المياه الصافية W = 200 لتر/م³." : "With 8cm slump, the slump adjustment factor is 1.00. Effective water W = 200 L/m³."}
                      </p>

                      <span className="font-extrabold text-slate-800 dark:text-slate-100 block">
                        {language === "ar" ? "الخطوة الخامسة: حساب محتوى الإسمنت الكلي C" : "Step 5: Calculate Cement Content C"}
                      </span>
                      <p className="pr-4">
                        {language === "ar" ? "محتوى الإسمنت C = 200 × 2.16 = 432 كغم/م³." : "Cement Content C = W * (C/W) = 200 * 2.16 = 432 kg/m³."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 7. SECTION: STANDARDS COMPARISON */}
            {activeSection === "standards" && (
              <div className="space-y-6 animate-fade-in text-right">
                <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm text-right space-y-4">
                  <h3 className="text-xs font-black text-slate-900 dark:text-slate-100">
                    {language === "ar" ? "المقارنة الفنية بين أكواد تصميم الخرسانة العالمية" : "Technical Comparison Across International Concrete Standards"}
                  </h3>
                  <p className="text-[11px] text-slate-505 dark:text-slate-400 font-sans leading-relaxed">
                    {language === "ar"
                      ? "يوضح الجدول أدناه الفروقات الجوهرية والفيزيائية في صياغة خلطات الخرسانة بين الكود الفرنسي-الأوروبي (Dreux-Gorisse)، الكود الأمريكي (ACI 211.1)، والكود البريطاني (DOE)."
                      : "The technical comparison below highlights the primary physical and empirical variances between Dreux-Gorisse (EN 206), the American ACI 211.1 standard, and the British DOE method."}
                  </p>

                  <div className="overflow-x-auto rounded-2xl border border-slate-150 dark:border-slate-800 font-sans text-xs">
                    <table className="w-full border-collapse" dir="rtl">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                          <th className="p-3 text-right font-black">{language === "ar" ? "المعيار" : "Metric"}</th>
                          <th className="p-3 text-right font-black">🇫🇷 Dreux-Gorisse (SnoLab)</th>
                          <th className="p-3 text-right font-black">🇺🇸 ACI 211.1</th>
                          <th className="p-3 text-right font-black">🇬🇧 DOE Method</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 dark:divide-slate-850 text-slate-505 dark:text-slate-400 leading-relaxed">
                        <tr>
                          <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{language === "ar" ? "الفلسفة الأساسية" : "Primary Philosophy"}</td>
                          <td className="p-3">{language === "ar" ? "الرص الأقصى وتكامل التدرج الحبيبي المستمر" : "Maximum packing density & skeletal grading curves"}</td>
                          <td className="p-3">{language === "ar" ? "الحجم المطلق لركام الحصى الجاف المتراص" : "Dry rodded volume of coarse aggregates"}</td>
                          <td className="p-3">{language === "ar" ? "المحتوى المائي الثابت ومكافئ ركامات الرمل" : "Fixed water/cement ratio targets & aggregate ratio factors"}</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{language === "ar" ? "المقاومة المستهدفة" : "Target Strength"}</td>
                          <td className="p-3">fcm28 = fck28 + 1.64 * σ</td>
                          <td className="p-3">fcr = fc' + k * s (ASTM standard)</td>
                          <td className="p-3">fcr = fc + Margin (British margin)</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{language === "ar" ? "علاقة الماء/الإسمنت" : "W/C Equation"}</td>
                          <td className="p-3">{language === "ar" ? "علاقة بولومي المعدلة هندسياً" : "Bolomey Modified equation"}</td>
                          <td className="p-3">{language === "ar" ? "جداول الامتلاء التجريبية للمقاومة والتبخر" : "Empirical lookup tables (air-entrained vs plain)"}</td>
                          <td className="p-3">{language === "ar" ? "منحنيات جودة ونوع الإسمنت الإنجليزي" : "Strength curves of UK cement types"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 9. SECTION: ENGINEERING ENCYCLOPEDIA */}
            {activeSection === "encyclopedia" && (
              <div className="space-y-6 animate-fade-in text-right" dir={language === "ar" ? "rtl" : "ltr"}>
                {/* Banner / Header with PDF Download Action */}
                <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 md:p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-blue-500/20 shadow-xl relative overflow-hidden">
                  <div className="space-y-1.5 text-right relative z-10">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                      <BookOpen size={11} />
                      {language === "ar" ? "موسوعة دروغوريس الشاملة M-DREUX-2026" : "Dreux Formulation Reference"}
                    </div>
                    <h3 className="text-base md:text-lg font-black text-white tracking-tight">
                      {language === "ar" ? "تحميل موسوعة دروغوريس الكاملة (PDF 7 صفحات)" : language === "fr" ? "Télécharger l'Encyclopédie Complète en PDF" : "Download Full Dreux Encyclopedia (PDF Manual)"}
                    </h3>
                    <p className="text-xs text-slate-300/90 max-w-2xl font-sans leading-relaxed">
                      {language === "ar" 
                        ? "تحتوي على الدستور العلمي الكامل لطريقة دروكس-غوريس، المعادلات الرياضية، جداول المعايرة الفرنسية (NF EN 206)، قاموس المصطلحات، ومثال تطبيقي كامل محلول خطوة بخطوة."
                        : language === "fr"
                        ? "Guide complet de la méthode Dreux-Gorisse, équations, tableaux NF EN 206, dictionnaire technique et exemple d'application entièrement résolu."
                        : "Complete handbook covering Dreux-Gorisse concrete formulation principles, NF EN 206 calibration tables, equations, terms dictionary, and step-by-step solved example."}
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadDreuxEncyclopediaPDF}
                    disabled={isGeneratingPdf}
                    className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs rounded-2xl shadow-xl hover:shadow-emerald-500/20 transition-all flex items-center gap-2.5 shrink-0 cursor-pointer disabled:opacity-50 active:scale-95 border border-emerald-300/40 relative z-10"
                  >
                    <Download size={16} className={isGeneratingPdf ? "animate-bounce" : ""} />
                    <span>{language === "ar" ? "تحميل الموسوعة الكاملة PDF" : "Download Complete Encyclopedia PDF"}</span>
                  </button>
                </div>

                {/* Categories Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
                  {[
                    { id: "all", ar: "الكل", en: "All", fr: "Tout" },
                    { id: "mix_design", ar: "🧪 تصميم الخلطة", en: "🧪 Mix Design", fr: "🧪 Formulation" },
                    { id: "aggregate_physics", ar: "🧱 فيزياء الركام", en: "🧱 Aggregate Physics", fr: "🧱 Physique des granulats" },
                    { id: "chemicals", ar: "🧪 الكيميائيات والمضافات", en: "🧪 Admixtures", fr: "🧪 Adjuvants" },
                    { id: "mechanical_properties", ar: "💪 الخواص الميكانيكية", en: "💪 Mechanical", fr: "💪 Propriétés" },
                    { id: "durability", ar: "🛡️ المتانة والديمومة", en: "🛡️ Durability", fr: "🛡️ Durabilité" }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setEncyclopediaCategory(cat.id)}
                      className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                        encyclopediaCategory === cat.id
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-100 dark:bg-slate-900 text-slate-505 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-800"
                      }`}
                    >
                      {language === "ar" ? cat.ar : language === "fr" ? cat.fr : cat.en}
                    </button>
                  ))}
                </div>

                {/* Terms Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(() => {
                    const filtered = ENCYCLOPEDIA_TERMS.filter((term) => {
                      // Category Filter
                      if (encyclopediaCategory !== "all" && term.category !== encyclopediaCategory) return false;
                      // Search Query
                      if (!encyclopediaSearch) return true;
                      const q = encyclopediaSearch.toLowerCase();
                      return (
                        term.termAr.includes(q) ||
                        term.termEn.toLowerCase().includes(q) ||
                        term.termFr.toLowerCase().includes(q) ||
                        term.definitionAr.includes(q) ||
                        term.definitionEn.toLowerCase().includes(q) ||
                        term.definitionFr.toLowerCase().includes(q) ||
                        term.standard.toLowerCase().includes(q)
                      );
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="col-span-2 py-10 text-center text-slate-405 dark:text-slate-500 font-medium text-xs">
                          {language === "ar" ? "لم يتم العثور على مصطلحات تطابق بحثك." : "No terms found matching your search."}
                        </div>
                      );
                    }

                    return filtered.map((term) => {
                      const title = language === "ar" ? term.termAr : language === "fr" ? term.termFr : term.termEn;
                      const definition = language === "ar" ? term.definitionAr : language === "fr" ? term.definitionFr : term.definitionEn;
                      const subtitle = language === "ar" ? `${term.termEn} / ${term.termFr}` : language === "fr" ? `${term.termEn} / ${term.termAr}` : `${term.termFr} / ${term.termAr}`;

                      // Badge styles based on category
                      const catBadgeStyles: Record<string, string> = {
                        mix_design: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
                        aggregate_physics: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                        chemicals: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
                        mechanical_properties: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                        durability: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
                      };

                      return (
                        <div
                          key={term.key}
                          id={`term-${term.key}`}
                          className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-3 relative group overflow-hidden hover:border-blue-500/30 dark:hover:border-blue-400/30"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${catBadgeStyles[term.category] || "bg-slate-100 text-slate-505"}`}>
                                {term.category.replace("_", " ")}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono tracking-tight bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-150 dark:border-slate-850">
                                {term.standard}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {title}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-sans font-medium select-all">
                                {subtitle}
                              </p>
                            </div>

                            <p className="text-[11px] text-slate-505 dark:text-slate-400 leading-relaxed font-sans pt-1">
                              {definition}
                            </p>
                          </div>

                          {term.formula && (
                            <div className="pt-2">
                              <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl text-center border border-slate-150/60 dark:border-slate-850 text-[10px] font-mono text-blue-600 dark:text-blue-400 overflow-x-auto select-all" dir="ltr">
                                <code>{term.formula}</code>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* 8. SECTION: FAQ */}
            {activeSection === "faq" && (
              <div className="space-y-6 animate-fade-in text-right">
                
                {/* INTERACTIVE ACCORDION FAQ */}
                <div className="space-y-3">
                  {faqs.map((faq, index) => (
                    <div 
                      key={index} 
                      className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                        className="w-full px-5 py-4 flex items-center justify-between text-right font-black text-slate-850 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        <span className="text-xs">
                          {language === "ar" ? faq.qAr : faq.qEn}
                        </span>
                        {expandedFaq === index ? <ChevronUp size={14} className="text-blue-500" /> : <ChevronDown size={14} className="text-slate-400" />}
                      </button>

                      {expandedFaq === index && (
                        <div className="px-5 pb-5 pt-1 text-[11px] text-slate-505 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/40 space-y-3 animate-fade-in">
                          <p className="font-sans">
                            {language === "ar" ? faq.aAr : faq.aEn}
                          </p>
                          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono flex items-center gap-1">
                            <Info size={10} />
                            <span>{language === "ar" ? "المرجع العلمي:" : "Scientific Reference:"} {faq.ref}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* SCIENTIFIC BIBLIOGRAPHY CARD */}
                <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-850 rounded-2xl p-5 space-y-3 text-right">
                  <h3 className="text-xs font-black text-slate-900 dark:text-slate-100">
                    📚 {language === "ar" ? "المراجع العلمية والبيبليوغرافيا الأصلية" : "Scientific Bibliography & Primary References"}
                  </h3>
                  <div className="text-[11px] text-slate-505 dark:text-slate-400 font-mono space-y-2 leading-relaxed">
                    <p>• Georges Dreux, Marc-André Gorisse (2004). <strong>Nouveau guide de la formulation des bétons</strong>. Éditions Eyrolles, Chapter 2-5.</p>
                    <p>• NF EN 206 (European Standard for Concrete Specification, Performance, Production and Conformity).</p>
                    <p>• NF P 18-541 (French National Standard for Aggregate Grading Curve Specifications).</p>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ZOOMED TABLE MODAL VIEW */}
      {zoomedTable && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setZoomedTable(null)}
        >
          <div 
            className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <button 
                onClick={() => setZoomedTable(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-lg cursor-pointer"
              >
                {language === "ar" ? "إغلاق" : "Close"}
              </button>
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-50">
                {language === "ar" ? DREUX_KNOWLEDGE_BASE.lookupTables[zoomedTable as any]?.nameAr : DREUX_KNOWLEDGE_BASE.lookupTables[zoomedTable as any]?.nameEn}
              </h2>
            </div>

            {/* Modal Body */}
            <div className="overflow-x-auto rounded-xl border border-slate-150 dark:border-slate-800 font-sans text-xs">
              {Array.isArray(DREUX_KNOWLEDGE_BASE.lookupTables[zoomedTable as any]?.data) ? (
                <table className="w-full border-collapse" dir="rtl">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-mono font-black">
                      {Object.keys(DREUX_KNOWLEDGE_BASE.lookupTables[zoomedTable as any]?.data[0] || {}).map((col) => (
                        <th key={col} className="p-3 text-right">
                          {col === "dMaxLimit" ? (language === "ar" ? "القطر الأقصى Dmax" : "Dmax Limit") :
                           col === "water" ? (language === "ar" ? "محتوى الماء (لتر/م³)" : "Water (L/m³)") :
                           col === "slumpLimit" ? (language === "ar" ? "هبوط قمع أبرامز" : "Slump Limit") :
                           col === "factor" ? (language === "ar" ? "المعامل التصحيحي" : "Factor") :
                           col === "gamma" ? (language === "ar" ? "معامل الارتصاص γ0" : "Compactness γ0") :
                           col === "adjustment" ? (language === "ar" ? "التصحيح الجبري" : "Adjustment") :
                           col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 dark:divide-slate-850 font-mono font-bold text-slate-800 dark:text-slate-200">
                    {DREUX_KNOWLEDGE_BASE.lookupTables[zoomedTable as any]?.data.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                        {Object.entries(row).map(([k, val]: [string, any]) => (
                          <td key={k} className="p-3 text-right">
                            {val === 999 ? "∞" : val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-4">
                  <pre className="font-mono text-xs text-blue-600 dark:text-blue-400">{JSON.stringify(DREUX_KNOWLEDGE_BASE.lookupTables[zoomedTable as any]?.data, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PDF GENERATION PROGRESS MODAL OVERLAY */}
      {isGeneratingPdf && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F172A] border border-blue-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-5 animate-fade-in" dir={language === "ar" ? "rtl" : "ltr"}>
            <div className="w-16 h-16 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto text-3xl animate-bounce">
              📘
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                {language === "ar" ? "جاري تحضير وتحزيم موسوعة دروغوريس PDF..." : "Preparing Dreux Encyclopedia PDF..."}
              </h3>
              <p className="text-xs text-slate-500 font-sans leading-relaxed">
                {pdfStatusMsg}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                <div 
                  className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${pdfProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 font-bold">
                <span>M-DREUX-ENC-2026</span>
                <span className="text-blue-600 dark:text-blue-400">{pdfProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN PRINTABLE A4 DREUX ENCYCLOPEDIA TEMPLATE */}
      <DreuxEncyclopediaPdfContainer language={language} />

    </div>
  );
};
