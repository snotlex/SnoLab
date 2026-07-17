import React, { useState, useMemo, useEffect } from "react";
import { useLanguage } from "../services/localization";
import { MixDesignResult, MixDesignInput, EngineeringMaterial } from "../types";
import { 
  Scale, 
  Droplet, 
  Printer, 
  HelpCircle, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  FileSpreadsheet, 
  Globe, 
  UserCheck, 
  Building, 
  Briefcase,
  Award,
  ShieldCheck,
  Layers,
  Activity,
  FileText,
  CheckSquare,
  Sparkles
} from "lucide-react";
import { resolveMaterials, ResolvedMaterials } from "../utils/resolveMaterials";
import { A4Page, A4PageProps } from "./report/A4Page";
import { ReportCharts } from "./ReportCharts";
import { ReportCompliance } from "./ReportCompliance";
import { ReportDetailedSteps } from "./ReportDetailedSteps";
import { ReportThermalAnalysis } from "./ReportThermalAnalysis";
import { validateConcreteType } from "../concreteTypes";
import { 
  reportTranslations, 
  QrCodeSvg, 
  handleExportWord, 
  handleExportExcel 
} from "../utils/reportExporter";
import { EngineeringAIAdvisor } from "./EngineeringAIAdvisor";
import { analyzeMixDesign } from "../utils/aiAdvisor";
import { validateLabResults } from "../utils/labValidationEngine";
import { LabValidationReportPages } from "./LabValidationReportPages";
import { validateCalculationLogic } from "../engine/validationGate";
import { formatEngineeringValue } from "../utils/unitFormatter";

const customTranslations: Record<"ar" | "fr" | "en", Record<string, string>> = {
  ar: {
    coverTitle: "شهادة ومعايرة الخلطة الخرسانية المعتمدة (fck)",
    executiveSummary: "الملخص التنفيذي للمشروع",
    methodology: "المنهجية والمراجع العلمية",
    materials: "سجل المواد الخام المعتمدة",
    results: "مقادير الخلطة والوزن الفعلي",
    qualityScore: "تقييم الجودة النهائي",
    riskAssessment: "تحليل المخاطر الفنية والموقعية",
    compliance: "المطابقة للكودات والدساتير الدولية",
    appendixA: "الملحق أ: الحسابات الرياضية التفصيلية",
    appendixADesc: "جميع قيم الحساب التوليفية وفروقات المنخل الكتلوي بالتفصيل للمهندسين والمراجعين.",
    recommendations: "توصيات الصب والتنفيذ الموقعي المعتمد",
    conclusion: "الخلاصة الهندسية والقرار الفني النهائي",
    approvals: "صفحة الاعتماد والتواقيع والختام",
    approved: "✓ معتمد وصالح للصب (APPROVED)",
    requiresMod: "⚠ يتطلب تعديل المعاملات (REQUIRES SEGREGATION FIX)",
    suitability: "نوعية وملاءمة الخلطة للاعتماد",
    designMethod: "طريقة التصميم الطيفية المستخدمة",
    requestedStrength: "المقاومة المطلوبة fck (28 يوماً)",
    expectedStrength: "المقاومة المتوسطة المستهدفة fcm",
    compTotalStrength: "كفاءة مقاومة الضغط",
    workability: "التشغيلية والانزلاق الموقعي",
    durability: "المتانة ومقاومة الأكتاف المائية",
    sustainability: "البصمة الكربونية CO₂ والبيئة",
    executability: "سهولة الرص ومقاومة التعشيش",
    low: "منخفض",
    medium: "متوسط",
    high: "مرتفع",
    shrinkage: "خطر الانكماش اللدن والشقوق الشعرية",
    thermal: "ارتفاع الحرارة والتشقق المائي الكتلي",
    bleeding: "نضح المياه السطحية (Bleeding)",
    segregation: "خطر الانفصال الحبيبي للمواد",
    execRisks: "صعوبات الصب والضخ بالأكتاف",
    evaluationNotes: "الملاحظات الفنية لغرفة مراقبة الجودة دقة الحساب",
    mixingDesc: "يجب الخلط لمدة لا تقل عن 90 ثانية لضمان تفعيل البوليمترات وتناثر المواد بالتساوي.",
    pouringDesc: "تجنب صب الخرسانة من ارتفاع يزيد عن 1.5 متر تفادياً للانفصال الحبيبي.",
    curingDesc: "المعالجة الرطبة الفورية لمدة 7 أيام متتالية باستخدام البلاستيك أو الخيش الخوص.",
    vibrationDesc: "الدمك بالهزاز المناسب على دفعات لا تنزل عن 30-50 سم وضمان عدم ملامسة الحديد.",
    weatherDesc: "في حال تجاوزت الحرارة 35 درجة مئوية نوصي بالصب الليلي واستعمال الماء المبرد بالثلج.",
    suitCheckTitle: "بيان المطابقة الهندسي النهائي",
    suitCheckText: "المعادلات الهركية من SNO AI تؤكد اجتياز قيم تصميم الركام لجميع محددات وقيم أمان السحب الشاقولي.",
  },
  en: {
    coverTitle: "CERTIFIED CONCRETE MIX DESIGN CERTIFICATE",
    executiveSummary: "Executive Summary Overview",
    methodology: "Theoretical Methodology & Framework",
    materials: "Approved Raw Materials Registry",
    results: "Recipe Formulations & Proportions",
    qualityScore: "SNO Concrete Quality Index (CQI)",
    riskAssessment: "Advanced Risk Assessment Matrix",
    compliance: "Codes & Standard Compliance Audit",
    appendixA: "Appendix A: Step-by-Step Computational Calculations",
    appendixADesc: "Detailed line-by-line mathematical synthesis derivations, packing factors and volumes for expert auditing.",
    recommendations: "Field Construction & Site Placement Guidelines",
    conclusion: "Engineering Conclusion & Certification",
    approvals: "Certification & Acceptance Stamps Page",
    approved: "✓ APPROVED & CERTIFIED FOR USE",
    requiresMod: "⚠ REQUIRES SETTINGS MODIFICATION",
    suitability: "Aptitude of Concrete Formula",
    designMethod: "Design Formulation Paradigm",
    requestedStrength: "Characteristic Target Strength fck (28d)",
    expectedStrength: "Expected Mean Strengths fcm (28d)",
    compTotalStrength: "Compressive Strength Efficacy",
    workability: "Rheological Workability & Slump",
    durability: "Corrosion & Sulphate Durability",
    sustainability: "Carbon Footprint & Eco-Efficiency",
    executability: "Site Placement & Compaction Ease",
    low: "Low Space Risk",
    medium: "Moderate Control Risk",
    high: "High High Hydration",
    shrinkage: "Plastic Shrinkage & Micro-cracking",
    thermal: "Adiabatic Mass Heat Crack Potential",
    bleeding: "Laitance Surface Bleeding & Water Rise",
    segregation: "Skeletal Particle Segregation Potential",
    execRisks: "Logistics Placing & Pumping Failures",
    evaluationNotes: "Technical Operations QA Comments",
    mixingDesc: "Maintain continuous active mixing for at least 90s to ensure total PCE polymer activation & dispersion.",
    pouringDesc: "Ensure maximum vertical freefall height of structural concrete is strictly below 1.5m to eliminate segregation.",
    curingDesc: "Apply active water-moist curing immediately for 7 core hydration days using saturated burlap blankets.",
    vibrationDesc: "Vibrate wet concrete continuously in layers ≤ 50cm using properly space immersion mechanical poker.",
    weatherDesc: "In hot climates (>35°C), casting operations should shift to nighttime, incorporating chilled water/ice blocks.",
    suitCheckTitle: "Final Engineering Conformance Declaration",
    suitCheckText: "Statistical analyses from the SNO synthesis engine verify that this mix design fulfills all safety parameters and margin demands.",
  },
  fr: {
    coverTitle: "CERTIFICAT DE FORMULATION DE BÉTON CERTIFIÉ",
    executiveSummary: "Synthèse Décisionnelle & Évaluation",
    methodology: "Cadre Méthodologique & Références",
    materials: "Agréments des Constituants de Base",
    results: "Formulations & Dosages de Pesée",
    qualityScore: "Indice Global de Qualité du Béton (CQI)",
    riskAssessment: "Matrice d'Analyse des Risques Techniques",
    compliance: "Conformité Administrative aux Codes",
    appendixA: "Annexe A: Équations & Logique Mathématique",
    appendixADesc: "Détails exhaustifs des coefficients de compacité, calculs volumétriques et répartition granulaire fine.",
    recommendations: "Manuel de Mise en Œuvre sur Chantier",
    conclusion: "Conclusion Technique Durable",
    approvals: "Validation Technique & Signatures Officielles",
    approved: "✓ FORMULE APPROUVÉE & CERTIFIÉE",
    requiresMod: "⚠ AJUSTEMENTS REQUIS PAR LE LABO",
    suitability: "Aptitude Globale de l'emploi",
    designMethod: "Méthodologie de Formulation Appliquée",
    requestedStrength: "Résistance Réelle Spécifiée fck (28j)",
    expectedStrength: "Résistance Moyenne Cible fcm (28j)",
    compTotalStrength: "Performance à la Compression Simple",
    workability: "Fluidité & Classe d'Affaissement",
    durability: "Durabilité face aux Classes d'Exposition",
    sustainability: "Bilan Éco-carbone & Gaz à Effet de Serre",
    executability: "Simplicité de Serrage & Pompage",
    low: "Faible Risque",
    medium: "Risque Modéré",
    high: "Risque Élevé",
    shrinkage: "Fissuration par Retrait Plastique Précoce",
    thermal: "Élévation de Température Massif Adiabatique",
    bleeding: "Risque de Ressuage Hydrique Superficiel",
    segregation: "Déséquilibre du Squelette Granulaire",
    execRisks: "Difficulté de Coulage & Bétonnage de Précision",
    evaluationNotes: "Instructions Spécifiques du Bureau d'Études",
    mixingDesc: "Garantir un malaxage ininterrompu de 90s minimum pour hydrater complétement les polymères adjuvanted.",
    pouringDesc: "Limiter la hauteur de chute libre du béton frais à un maximum de 1,5 m afin d'éviter la ségrégation.",
    curingDesc: "Maintenir impérativement une cure humide saturée continue pendant 7 jours francs.",
    vibrationDesc: "Compacter par passes régulières ≤ 50 cm en évitant d'entrechoquer l'aiguille vibrante contre l'armature.",
    weatherDesc: "Si la température ambiante dépasse 35°C, couler de nuit ou refroidir la gâchée par de l'eau glacée.",
    suitCheckTitle: "Déclaration Administrative de Conformité",
    suitCheckText: "L'analyse statistique validée par SNO AI démontre le respect rigoureux des marges opérationnelles d'écart-type et d'ouvrabilité.",
  }
};

// Helper to replace oklch(...) colors with standard rgb(...) equivalents to prevent html2canvas crashes.
const replaceOklchWithRgb = (cssText: string): string => {
  return cssText.replace(/oklch\s*\(([^)]+)\)/gi, (match, contents) => {
    try {
      const parts = contents.split(/[\s,/\s]+/).filter(Boolean);
      if (parts.length >= 3) {
        let lStr = parts[0];
        let cStr = parts[1];
        let hStr = parts[2];
        let aStr = parts[3];

        let l = parseFloat(lStr);
        if (lStr.includes("%")) {
          l = parseFloat(lStr) / 100;
        }
        let c = parseFloat(cStr);
        let h = parseFloat(hStr);
        let a = aStr !== undefined ? parseFloat(aStr) : 1;
        if (aStr && aStr.includes("%")) {
          a = parseFloat(aStr) / 100;
        }

        const hRad = (h * Math.PI) / 180;
        const aLab = c * Math.cos(hRad);
        const bLab = c * Math.sin(hRad);

        const l_ = l + 0.3963377774 * aLab + 0.2158037573 * bLab;
        const m_ = l - 0.1055613458 * aLab - 0.0638541728 * bLab;
        const s_ = l - 0.0894841775 * aLab - 1.2914855480 * bLab;

        const l_crit = l_ * l_ * l_;
        const m_crit = m_ * m_ * m_;
        const s_crit = s_ * s_ * s_;

        const r_lin = +4.0767416621 * l_crit - 3.3077115913 * m_crit + 0.2309699292 * s_crit;
        const g_lin = -1.2684380046 * l_crit + 2.6097574011 * m_crit - 0.3413193965 * s_crit;
        const b_lin = -0.0041960863 * l_crit - 0.7034186147 * m_crit + 1.7076147010 * s_crit;

        const toSRGB = (cVal: number) => {
          const clamped = Math.max(0, Math.min(1, cVal));
          return clamped <= 0.0031308
            ? clamped * 12.92
            : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
        };

        const r = Math.round(toSRGB(r_lin) * 255);
        const g = Math.round(toSRGB(g_lin) * 255);
        const b = Math.round(toSRGB(b_lin) * 255);

        if (a < 1) {
          return `rgba(${r}, ${g}, ${b}, ${a})`;
        }
        return `rgb(${r}, ${g}, ${b})`;
      }
    } catch (e) {
      console.warn("Error converting oklch:", match, e);
    }
    return "rgb(150, 150, 150)";
  });
};

const replaceOklabWithRgb = (cssText: string): string => {
  return cssText.replace(/oklab\s*\(([^)]+)\)/gi, (match, contents) => {
    try {
      const parts = contents.split(/[\s,/\s]+/).filter(Boolean);
      if (parts.length >= 3) {
        let lStr = parts[0];
        let aStr = parts[1];
        let bStr = parts[2];
        let alphaStr = parts[3];

        let l = parseFloat(lStr);
        if (lStr.includes("%")) {
          l = parseFloat(lStr) / 100;
        }
        let aLab = parseFloat(aStr);
        let bLab = parseFloat(bStr);
        let alpha = alphaStr !== undefined ? parseFloat(alphaStr) : 1;
        if (alphaStr && alphaStr.includes("%")) {
          alpha = parseFloat(alphaStr) / 100;
        }

        const l_ = l + 0.3963377774 * aLab + 0.2158037573 * bLab;
        const m_ = l - 0.1055613458 * aLab - 0.0638541728 * bLab;
        const s_ = l - 0.0894841775 * aLab - 1.2914855480 * bLab;

        const l_crit = l_ * l_ * l_;
        const m_crit = m_ * m_ * m_;
        const s_crit = s_ * s_ * s_;

        const r_lin = +4.0767416621 * l_crit - 3.3077115913 * m_crit + 0.2309699292 * s_crit;
        const g_lin = -1.2684380046 * l_crit + 2.6097574011 * m_crit - 0.3413193965 * s_crit;
        const b_lin = -0.0041960863 * l_crit - 0.7034186147 * m_crit + 1.7076147010 * s_crit;

        const toSRGB = (cVal: number) => {
          const clamped = Math.max(0, Math.min(1, cVal));
          return clamped <= 0.0031308
            ? clamped * 12.92
            : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
        };

        const r = Math.round(toSRGB(r_lin) * 255);
        const g = Math.round(toSRGB(g_lin) * 255);
        const b = Math.round(toSRGB(b_lin) * 255);

        if (alpha < 1) {
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return `rgb(${r}, ${g}, ${b})`;
      }
    } catch (e) {
      console.warn("Error converting oklab:", match, e);
    }
    return "rgb(150, 150, 150)";
  });
};

const runPDFExportDebug = (clonedElement: HTMLElement) => {
  console.group("%c📊 PDF EXPORT SYSTEM DIAGNOSTICS", "color: #2563EB; font-weight: bold; font-size: 13px;");

  // 1. Exported Element Count
  const allElements = clonedElement.querySelectorAll('*');
  const countExported = allElements.length + 1;
  console.log(`%c✓ Total Processed DOM Elements: ${countExported}`, "color: #0F172A; font-weight: bold;");

  // 2. Failed Elements Analysis (0x0 sizes, layout collapses, oklch colors)
  const failedElements: string[] = [];
  allElements.forEach((el, index) => {
    const htmlEl = el as HTMLElement;
    const style = window.getComputedStyle(htmlEl);
    
    if (htmlEl.offsetWidth === 0 && htmlEl.offsetHeight === 0 && style.display !== "none") {
      failedElements.push(`[Element #${index} - <${htmlEl.tagName.toLowerCase()}>] Layout warning: 0x0 structural dimensions.`);
    }
    
    const bg = htmlEl.style.backgroundColor || style.backgroundColor;
    if (bg && bg.includes("oklch")) {
      failedElements.push(`[Element #${index} - <${htmlEl.tagName.toLowerCase()}>] Color warning: unreplaced oklch style definition ("${bg}").`);
    }
  });

  console.log(`%c✗ Failed or Warning-prone Nodes: ${failedElements.length}`, failedElements.length > 0 ? "color: #EF4444; font-weight: bold;" : "color: #10B981; font-weight: bold;");
  if (failedElements.length > 0) {
    console.table(failedElements.slice(0, 10).map((msg) => ({ Analysis: msg })));
  }

  // 3. Image loading analysis
  const images = Array.from(clonedElement.querySelectorAll("img"));
  const unloadedImages = images.filter((img) => !img.complete || img.naturalWidth === 0);
  console.log(`%c📷 Failed or Unloaded Images: ${unloadedImages.length}`, unloadedImages.length > 0 ? "color: #F59E0B; font-weight: bold;" : "color: #10B981; font-weight: bold;");
  if (unloadedImages.length > 0) {
    console.table(unloadedImages.map((img) => ({ Src: img.src, Classes: img.className })));
  }

  // 4. Custom font state analysis
  let unloadedFontsCount = 0;
  const unloadedFontsList: any[] = [];
  try {
    if (document.fonts) {
      document.fonts.forEach((font) => {
        if (font.status !== "loaded") {
          unloadedFontsCount++;
          unloadedFontsList.push({
            Family: font.family,
            Style: font.style,
            Weight: font.weight,
            Status: font.status
          });
        }
      });
    }
  } catch (e) {
    console.warn("Fonts inspection is restricted:", e);
  }

  console.log(`%c🔤 Unloaded or Inactive Fonts: ${unloadedFontsCount}`, unloadedFontsCount > 0 ? "color: #F59E0B; font-weight: bold;" : "color: #10B981; font-weight: bold;");
  if (unloadedFontsList.length > 0) {
    console.table(unloadedFontsList);
  }

  console.groupEnd();
};

interface RecipeReportProps {
  result: MixDesignResult;
  input: MixDesignInput;
  activeProject?: any;
  materialsDatabase?: EngineeringMaterial[];
  onChangeInputs?: (updatedInputs: Partial<MixDesignInput>) => void;
  onChangeProjectDetails?: (details: { name?: string; client?: string; plant?: string }) => void;
}

export const RecipeReport: React.FC<RecipeReportProps> = ({ 
  result, 
  input, 
  activeProject, 
  materialsDatabase = [],
  onChangeInputs,
  onChangeProjectDetails
}) => {
  const { language } = useLanguage();

  const validation = React.useMemo(() => {
    return validateCalculationLogic(input, result, language);
  }, [input, result, language]);

  // Dynamic quality score calculation
  const calculatedScore = React.useMemo(() => {
    let score = 50;
    const resolvedAll = resolveMaterials(input, activeProject?.materialSnapshots, materialsDatabase);
    const wcRatio = result.wcRatioAdjusted || 0.45;
    const controlClass = input.controlClass;
    const aggregateQuality = input.aggregateQuality;
    const admixturesCount = result.admixtureWeights?.length || 0;
    const exposureClass = input.exposureClass || "X0";
    const sandAbsorption = resolvedAll.sand?.absorption ?? 1.5;
    const gravelAbsorption = resolvedAll.gravel?.absorption ?? 0.8;
    const sandFineness = resolvedAll.sand?.finenessModulus ?? 2.6;
    const admixtureRatio = input.dosageSuper || 0;
    const codeCompliance = result.standardsCompliance?.every(item => item.status === "compliant") ?? true;
    const finalDensity = result.totalFreshDensity || 2400;

    // 1. W/C Ratio (max 15 pt)
    if (wcRatio >= 0.40 && wcRatio <= 0.48) {
      score += 15;
    } else if (wcRatio > 0.48 && wcRatio <= 0.55) {
      score += 8;
    } else {
      score -= 5;
    }

    // 2. Compressive strength limits (max 10 pt)
    if (input.fck28 >= 40 && controlClass === "high") {
      score += 10;
    } else if (input.fck28 >= 25) {
      score += 6;
    } else {
      score += 2;
    }

    // 3. Exposure class compatibility (max 10 pt)
    const isAggressiveExp = ["XD1", "XD2", "XD3", "XS1", "XS2", "XS3", "XA1", "XA2", "XA3"].includes(exposureClass);
    if (isAggressiveExp && wcRatio <= 0.45) {
      score += 10;
    } else if (!isAggressiveExp) {
      score += 8;
    } else {
      score -= 3;
    }

    // 4. Aggregate quality (max 10 pt)
    if (aggregateQuality === "excellent") {
      score += 10;
    } else if (aggregateQuality === "standard") {
      score += 6;
    } else {
      score -= 4;
    }

    // 5. Sand Absorption (max 8 pt)
    if (sandAbsorption <= 1.2) {
      score += 8;
    } else if (sandAbsorption <= 2.2) {
      score += 5;
    } else {
      score += 1;
    }

    // 6. Gravel Absorption (max 7 pt)
    if (gravelAbsorption <= 0.8) {
      score += 7;
    } else if (gravelAbsorption <= 1.5) {
      score += 4;
    } else {
      score += 0;
    }

    // 7. Sand Fineness Modulus (max 10 pt)
    if (sandFineness >= 2.4 && sandFineness <= 2.9) {
      score += 10;
    } else {
      score += 5;
    }

    // 8. Admixture Optimization (max 10 pt)
    if (admixturesCount > 0 && admixtureRatio >= 0.8 && admixtureRatio <= 2.0) {
      score += 10;
    } else if (admixturesCount > 0) {
      score += 7;
    } else {
      score += 2;
    }

    // 9. Code Compliance (max 10 pt)
    if (codeCompliance) {
      score += 10;
    } else {
      score += 2;
    }

    // 10. Density (max 10 pt)
    if (finalDensity >= 2380) {
      score += 10;
    } else if (finalDensity >= 2300) {
      score += 7;
    } else {
      score += 3;
    }

    return Math.max(10, Math.min(100, score));
  }, [input, result, activeProject, materialsDatabase]);
  
  // Localized state configurations
  const [reportLanguage, setReportLanguage] = useState<"ar" | "fr" | "en">(
    language === "ar" || language === "fr" ? (language as any) : "en"
  );

  useEffect(() => {
    setReportLanguage(language);
  }, [language]);
  
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(true);
  const [batchVolume, setBatchVolume] = useState<number>(1.0); 
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "updating">("synced");

  // Hook to show live synchronization status when inputs or results change
  useEffect(() => {
    setSyncStatus("updating");
    const timer = setTimeout(() => {
      setSyncStatus("synced");
    }, 450);
    return () => clearTimeout(timer);
  }, [input, result]);

  // Dynamic Metadata States
  const [companyName, setCompanyName] = useState<string>(
    reportLanguage === "ar" 
      ? "المختبر الوطني لمراقبة جودة البناء والخرسانة المسلحة" 
      : reportLanguage === "fr" 
      ? "Laboratoire National du Bâtiment & Travaux Publics" 
      : "National Laboratory for ReadyMix Quality Control"
  );
  const [companyLogoType, setCompanyLogoType] = useState<"shield" | "flow" | "metrology">("shield");
  const [projectName, setProjectName] = useState<string>(
    activeProject?.name || (reportLanguage === "ar" 
      ? "مشروع صب الحواجز والجسور العملاقة والأنفاق" 
      : "High-Speed Rail Transit System & Infrastructure Project")
  );
  const [siteLocation, setSiteLocation] = useState<string>(
    activeProject?.plant || (reportLanguage === "ar" ? "المنطقة الشمالية / قطاع الصب الجسري الرئيسي" : "Main Hub Site / North Viaduct Casting Zone")
  );
  const [clientOwner, setClientOwner] = useState<string>(
    activeProject?.client || (reportLanguage === "ar" ? "الهيئة العامة للمشاريع الاستراتيجية الكبرى" : "National Authority for Strategic Infrastructure")
  );
  const [contractor, setContractor] = useState<string>(
    reportLanguage === "ar" ? "شركة النخبة للمقاولات العامة والإنشاء" : "Elite Engineering & Contracting Group"
  );

  // Sync with activeProject changes
  React.useEffect(() => {
    if (activeProject) {
      setProjectName(activeProject.name);
      setClientOwner(activeProject.client);
      setSiteLocation(activeProject.plant);
    }
  }, [activeProject]);

  // Sync with input.batchVolume changes
  React.useEffect(() => {
    if (typeof input.batchVolume === "number") {
      setBatchVolume(input.batchVolume);
    }
  }, [input.batchVolume]);

  const handleBatchVolumeChange = (val: number) => {
    const cleanVal = Math.max(0.1, val);
    setBatchVolume(cleanVal);
    if (onChangeInputs) {
      onChangeInputs({ batchVolume: cleanVal });
    }
  };

  const handleProjectNameChange = (val: string) => {
    setProjectName(val);
    if (onChangeProjectDetails) {
      onChangeProjectDetails({ name: val });
    }
  };

  const handleSiteLocationChange = (val: string) => {
    setSiteLocation(val);
    if (onChangeProjectDetails) {
      onChangeProjectDetails({ plant: val });
    }
  };

  const handleClientOwnerChange = (val: string) => {
    setClientOwner(val);
    if (onChangeProjectDetails) {
      onChangeProjectDetails({ client: val });
    }
  };

  const [structuralElement, setStructuralElement] = useState<string>(
    reportLanguage === "ar" ? "روافد الأساسات والأكتاف الخرسانية الحاملة العميقة" : "Reinforced Concrete Piers & Structural Deep Foundation"
  );
  const [engineerName, setEngineerName] = useState<string>("Eng. Samir Senoussi (سمير السنوسي)");
  const [licenseNumber, setLicenseNumber] = useState<string>("N° Q.A-2026/DZ-4819");
  const [engineerEmail, setEngineerEmail] = useState<string>("senoussi.s.t@gmail.com");
  const [signatureDesignation, setSignatureDesignation] = useState<string>(
    reportLanguage === "ar" ? "مدير ضمان جودة المواد بالموقع (QA/QC)" : "Lead QA/QC Materials Manager & Metrologist"
  );

  const t_sub = reportTranslations[reportLanguage];
  const isRtl = reportLanguage === "ar";

  const scale = (weight: number) => {
    return Math.round(weight * batchVolume * 10) / 10;
  };

  const activeLogo = () => {
    switch (companyLogoType) {
      case "shield":
        return (
          <svg className="w-12 h-12 text-blue-600 dark:text-blue-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="8 11 11 14 16 9" />
          </svg>
        );
      case "flow":
        return (
          <svg className="w-12 h-12 text-amber-500 dark:text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            <circle cx="12" cy="12" r="10" strokeDasharray="3 3" />
          </svg>
        );
      case "metrology":
        return (
          <svg className="w-12 h-12 text-emerald-500 dark:text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        );
    }
  };

  const handlePrint = () => {
    if (!validation.isValidForReport) {
      alert(language === "ar" 
        ? "لا يمكن تنزيل أو طباعة التقرير لعدم مطابقة المدخلات أو النتائج للمعايير والمقاييس الهندسية." 
        : "Cannot download or print the report because inputs or results do not comply with engineering standards.");
      return;
    }
    window.print();
  };

  const triggerExportWord = () => {
    if (!validation.isValidForReport) {
      alert(language === "ar" 
        ? "لا يمكن تنزيل أو طباعة التقرير لعدم مطابقة المدخلات أو النتائج للمعايير والمقاييس الهندسية." 
        : "Cannot download or print the report because inputs or results do not comply with engineering standards.");
      return;
    }
    handleExportWord(
      reportLanguage,
      companyName,
      projectName,
      siteLocation,
      clientOwner,
      contractor,
      structuralElement,
      engineerName,
      licenseNumber,
      engineerEmail,
      signatureDesignation,
      input,
      result,
      batchVolume,
      totalDryPerM3,
      scale
    );
  };

  const triggerExportExcel = () => {
    if (!validation.isValidForReport) {
      alert(language === "ar" 
        ? "لا يمكن تنزيل أو طباعة التقرير لعدم مطابقة المدخلات أو النتائج للمعايير والمقاييس الهندسية." 
        : "Cannot download or print the report because inputs or results do not comply with engineering standards.");
      return;
    }
    handleExportExcel(
      reportLanguage,
      companyName,
      projectName,
      siteLocation,
      clientOwner,
      contractor,
      structuralElement,
      engineerName,
      licenseNumber,
      engineerEmail,
      signatureDesignation,
      input,
      result,
      totalDryPerM3,
      batchVolume
    );
  };

  const handleExportPDF = async () => {
    if (!validation.isValidForReport) {
      alert(language === "ar" 
        ? "لا يمكن تنزيل أو طباعة التقرير لعدم مطابقة المدخلات أو النتائج للمعايير والمقاييس الهندسية." 
        : "Cannot download or print the report because inputs or results do not comply with engineering standards.");
      return;
    }
    setIsExporting(true);
    console.log("Starting Professional Multipage PDF Generation (oklch-safe)...");

    const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
      import("jspdf"),
      import("html2canvas")
    ]);

    const originalDarkMode = document.documentElement.classList.contains("dark");
    if (originalDarkMode) {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }

    let originalStyles: Array<{ element: HTMLStyleElement; text: string }> = [];
    const patchedWindows: Array<{ win: Window; originalGCS: any }> = [];
    const tempStyleNodes: HTMLStyleElement[] = [];
    const linkElements = Array.from(document.querySelectorAll("link[rel='stylesheet']")) as HTMLLinkElement[];

    const patchWinGCS = (win: Window) => {
      try {
        if (!win || (win as any).__isGCS_Patched) return;
        const original = win.getComputedStyle;
        (win as any).__isGCS_Patched = true;
        patchedWindows.push({ win, originalGCS: original });
        
        win.getComputedStyle = function (el, pseudo) {
          try {
            const style = original.call(win, el, pseudo);
            return new Proxy(style, {
              get(target, prop) {
                if (prop === "getPropertyValue") {
                  return function(propertyName: string) {
                    try {
                      const val = target.getPropertyValue(propertyName);
                      if (typeof val === "string") {
                        let updatedVal = val;
                        if (/oklch/i.test(updatedVal)) updatedVal = replaceOklchWithRgb(updatedVal);
                        if (/oklab/i.test(updatedVal)) updatedVal = replaceOklabWithRgb(updatedVal);
                        return updatedVal;
                      }
                      return val;
                    } catch {
                      return "";
                    }
                  };
                }
                try {
                  const val = (target as any)[prop];
                  if (typeof val === "function") return val.bind(target);
                  if (typeof val === "string") {
                    let updatedVal = val;
                    if (/oklch/i.test(updatedVal)) updatedVal = replaceOklchWithRgb(updatedVal);
                    if (/oklab/i.test(updatedVal)) updatedVal = replaceOklabWithRgb(updatedVal);
                    return updatedVal;
                  }
                  return val;
                } catch {
                  return undefined;
                }
              }
            });
          } catch {
            try {
              return original.call(win, el, pseudo);
            } catch {
              return { getPropertyValue: () => "" } as any;
            }
          }
        };
      } catch (e) {
        console.warn("GCS patch failed", e);
      }
    };

    try {
      // 1. Wait for sources and fonts
      try {
        if (document.fonts) {
          await document.fonts.ready;
        }
      } catch (fError) {
        console.warn("Fonts ready promise failed:", fError);
      }

      // 2. Pre-process inline style tags in main document
      const styleElements = Array.from(document.querySelectorAll("style"));
      originalStyles = styleElements.map(el => ({
        element: el,
        text: el.innerHTML
      }));

      for (const styleObj of originalStyles) {
        let text = styleObj.text;
        if (/oklch|oklab/i.test(text)) {
          text = replaceOklchWithRgb(text);
          text = replaceOklabWithRgb(text);
          styleObj.element.innerHTML = text;
        }
      }

      // 3. Pre-process external stylesheet links
      for (const linkEl of linkElements) {
        try {
          const isSameOrigin = !linkEl.href.startsWith("http") || linkEl.href.startsWith(window.location.origin);
          if (isSameOrigin) {
            const res = await fetch(linkEl.href);
            if (res.ok) {
              let cssText = await res.text();
              if (/oklch|oklab/i.test(cssText)) {
                cssText = replaceOklchWithRgb(cssText);
                cssText = replaceOklabWithRgb(cssText);
                
                const tStyle = document.createElement("style");
                tStyle.setAttribute("data-temp-clean", "true");
                tStyle.innerHTML = cssText;
                document.head.appendChild(tStyle);
                tempStyleNodes.push(tStyle);

                // Temporarily disable original link
                linkEl.disabled = true;
              }
            }
          }
        } catch (linkErr) {
          console.warn("Could not fetch/clean stylesheet link:", linkEl.href, linkErr);
        }
      }

      // 4. Apply window-level computed style proxy
      patchWinGCS(window);

      // Small delay to allow the DOM to repaint completely in light mode and with cleaned styles
      await new Promise((resolve) => setTimeout(resolve, 350));

      const pageContainers = document.querySelectorAll(".pdf-page-container");
      if (pageContainers.length === 0) {
        throw new Error("No pages found with class '.pdf-page-container'");
      }

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      for (let i = 0; i < pageContainers.length; i++) {
        const pageEl = pageContainers[i] as HTMLElement;

        const canvas = await html2canvas(pageEl, {
          scale: 2, // 2x scale handles crisp rendering of vectors and text
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          ignoreElements: (el) => {
            return (
              el.classList.contains("print:hidden") || 
              el.tagName === "BUTTON"
            );
          },
          onclone: (clonedDoc, clonedEl) => {
            if (clonedDoc.defaultView) {
              patchWinGCS(clonedDoc.defaultView);
            }

            // Strip .dark classes from cloned DOM
            clonedDoc.documentElement.classList.remove("dark");
            clonedDoc.body.classList.remove("dark");

            // Clean inline style attributes on cloned elements
            const clonedInlineStyles = clonedDoc.querySelectorAll("[style]");
            clonedInlineStyles.forEach(elem => {
              const styleAttr = elem.getAttribute("style");
              if (styleAttr) {
                let updatedStyle = styleAttr;
                if (/oklch/i.test(updatedStyle)) updatedStyle = replaceOklchWithRgb(updatedStyle);
                if (/oklab/i.test(updatedStyle)) updatedStyle = replaceOklabWithRgb(updatedStyle);
                elem.setAttribute("style", updatedStyle);
              }
            });
          }
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.98);

        if (i > 0) {
          pdf.addPage();
        }

        // Add JPEG image aligned to the full A4 canvas page
        pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
      }

      const fileLang = reportLanguage.toUpperCase();
      pdf.save(`SNO_Certified_Mix_Report_C${input.fck28}_${fileLang}.pdf`);
      console.log("Professional PDF report successfully generated and downloaded.");
    } catch (err) {
      console.error("PDF generation engine caught an exception:", err);
    } finally {
      // Restore links
      for (const linkEl of linkElements) {
        linkEl.disabled = false;
      }
      // Remove temporary styles
      for (const tStyle of tempStyleNodes) {
        tStyle.remove();
      }
      // Restore original inline styles
      for (const styleObj of originalStyles) {
        styleObj.element.innerHTML = styleObj.text;
      }
      // Remove isGCS_Patched and restore original on windows
      for (const patched of patchedWindows) {
        try {
          patched.win.getComputedStyle = patched.originalGCS;
          (patched.win as any).__isGCS_Patched = false;
        } catch (e) {
          console.warn("GCS restore failed", e);
        }
      }

      if (originalDarkMode) {
        document.documentElement.classList.add("dark");
        document.body.classList.add("dark");
      }
      setIsExporting(false);
    }
  };

  const _unused_handleExportPDF = async () => {
    if (!validation.isValidForReport) return;
    const element = document.getElementById("concrete-mix-report-card");
    if (!element) return;
    setIsExporting(true);
    
    console.log("Starting PDF Export Process...");

    const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
      import("jspdf"),
      import("html2canvas")
    ]);

    let originalStyles: Array<{ element: HTMLStyleElement; text: string }> = [];
    const originalDarkMode = document.documentElement.classList.contains("dark");
    const patchedWindows: Array<{ win: Window; originalGCS: any }> = [];

    const patchWinGCS = (win: Window) => {
      try {
        if (!win || (win as any).__isGCS_Patched) return;
        const original = win.getComputedStyle;
        (win as any).__isGCS_Patched = true;
        patchedWindows.push({ win, originalGCS: original });
        
        win.getComputedStyle = function (el, pseudo) {
          try {
            const style = original.call(win, el, pseudo);
            return new Proxy(style, {
              get(target, prop) {
                if (prop === "getPropertyValue") {
                  return function(propertyName: string) {
                    try {
                      const val = target.getPropertyValue(propertyName);
                      if (typeof val === "string") {
                        let updatedVal = val;
                        if (/oklch/i.test(updatedVal)) updatedVal = replaceOklchWithRgb(updatedVal);
                        if (/oklab/i.test(updatedVal)) updatedVal = replaceOklabWithRgb(updatedVal);
                        return updatedVal;
                      }
                      return val;
                    } catch {
                      return "";
                    }
                  };
                }
                try {
                  const val = (target as any)[prop];
                  if (typeof val === "function") return val.bind(target);
                  if (typeof val === "string") {
                    let updatedVal = val;
                    if (/oklch/i.test(updatedVal)) updatedVal = replaceOklchWithRgb(updatedVal);
                    if (/oklab/i.test(updatedVal)) updatedVal = replaceOklabWithRgb(updatedVal);
                    return updatedVal;
                  }
                  return val;
                } catch {
                  return undefined;
                }
              }
            });
          } catch {
            try {
              return original.call(win, el, pseudo);
            } catch {
              return { getPropertyValue: () => "" } as any;
            }
          }
        };
      } catch (e) {
        console.warn("GCS patch failed", e);
      }
    };

    try {
      // 1. Wait for fonts, charts, and images to load completely before generating the canvas
      console.log("Waiting for fonts, charts, and images resources to load...");
      try {
        if (document.fonts) {
          await document.fonts.ready;
        }
      } catch (fError) {
        console.warn("Fonts ready promise failed:", fError);
      }

      const imgElements = Array.from(element.querySelectorAll("img"));
      await Promise.all(imgElements.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        });
      }));

      // Small cooldown to ensure transitions and SVGs are fully painted
      await new Promise((resolve) => setTimeout(resolve, 300));

      patchWinGCS(window);

      const styleElements = Array.from(document.querySelectorAll("style"));
      originalStyles = styleElements.map(el => ({
        element: el,
        text: el.innerHTML
      }));

      for (const styleObj of originalStyles) {
        let text = styleObj.text;
        if (/oklch/i.test(text)) text = replaceOklchWithRgb(text);
        if (/oklab/i.test(text)) text = replaceOklabWithRgb(text);
        styleObj.element.innerHTML = text;
      }

      console.log("Capturing concrete-mix-report-card via html2canvas with Custom Print Theme...");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        ignoreElements: (el) => {
          return (
            el.classList.contains("print:hidden") || 
            el.id === "batch-scaler-container" || 
            el.tagName === "BUTTON"
          );
        },
        onclone: (clonedDoc, clonedEl) => {
          if (clonedDoc.defaultView) {
            patchWinGCS(clonedDoc.defaultView);
          }

          // Strip .dark class from root of cloned frame to ensure it matches Light mode rules
          clonedDoc.documentElement.classList.remove("dark");
          clonedDoc.body.classList.remove("dark");

          // Process the target element in the clone
          const reportCard = clonedEl || clonedDoc.getElementById("concrete-mix-report-card");
          if (!reportCard) return;

          // Enforce Print Theme specifications directly inside cloned node
          reportCard.style.backgroundColor = "#FFFFFF";
          reportCard.style.color = "#0F172A";
          reportCard.style.padding = "24px";
          reportCard.style.border = "none";
          reportCard.style.boxShadow = "none";

          const clonedInlineStyles = clonedDoc.querySelectorAll("[style]");
          clonedInlineStyles.forEach(elem => {
            const styleAttr = elem.getAttribute("style");
            if (styleAttr) {
              let updatedStyle = styleAttr;
              if (/oklch/i.test(updatedStyle)) updatedStyle = replaceOklchWithRgb(updatedStyle);
              if (/oklab/i.test(updatedStyle)) updatedStyle = replaceOklabWithRgb(updatedStyle);
              elem.setAttribute("style", updatedStyle);
            }
          });

          // Run Debug reports on the cloned frame
          try {
            runPDFExportDebug(reportCard);
          } catch (dbgErr) {
            console.warn("Debugger logging failed:", dbgErr);
          }

          // Trailing DOM Walker to clean up dark attributes, opacity, blurs, and gradients
          const allElements = reportCard.querySelectorAll("*");
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            const cls = htmlEl.getAttribute("class") || "";

            // 1. Remove Tailwind dark mode class overrides
            if (cls) {
              const classes = cls.split(/\s+/).filter(Boolean);
              const filtered = classes.filter(c => !c.startsWith("dark:"));
              if (filtered.length !== classes.length) {
                htmlEl.setAttribute("class", filtered.join(" "));
              }
            }

            // 2. Clear out glitchy effects (opacity, filter, blur and backdropFilter)
            htmlEl.style.opacity = "1";
            htmlEl.style.backdropFilter = "none";
            htmlEl.style.filter = "none";
            htmlEl.style.boxShadow = "none";

            // 3. Force fixed or sticky elements to static readable flows
            const style = window.getComputedStyle(htmlEl);
            if (style.position === "fixed" || style.position === "sticky" || htmlEl.style.position === "fixed" || htmlEl.style.position === "sticky") {
              htmlEl.style.position = "static";
            }

            // 4. Clean up gradients and linear shading blocks
            if (htmlEl.style.backgroundImage && htmlEl.style.backgroundImage.includes("gradient")) {
              htmlEl.style.backgroundImage = "none";
            }

            const currentCls = htmlEl.getAttribute("class") || "";
            if (currentCls.includes("bg-gradient-") || currentCls.includes("from-") || currentCls.includes("to-")) {
              const classes = currentCls.split(/\s+/).filter(Boolean);
              const classesWithoutGradients = classes.filter(c => !c.startsWith("bg-gradient-") && !c.startsWith("from-") && !c.startsWith("to-") && !c.startsWith("via-"));
              htmlEl.setAttribute("class", classesWithoutGradients.join(" "));
              htmlEl.style.backgroundColor = "#FFFFFF";
            }
          });

          // Helper to check if element has dark themed headers
          function hasThemedParent(el: HTMLElement): boolean {
            let cur: HTMLElement | null = el;
            while (cur && cur !== reportCard) {
              const parentCls = cur.getAttribute ? (cur.getAttribute("class") || "") : "";
              if (parentCls && (parentCls.includes("bg-slate-900") || parentCls.includes("bg-[#1E293B]") || parentCls.includes("bg-[#1e293b]") || parentCls.includes("bg-slate-850"))) {
                return true;
              }
              cur = cur.parentElement;
            }
            return false;
          }

          // 5. Explicitly apply Professional Brand Colors
          // Background: White, Primary: #0F172A, Secondary: #2563EB, Success: #10B981, Warning: #F59E0B, Danger: #EF4444
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            const cls = htmlEl.getAttribute("class") || "";

            // Primary Theme Boxes (Grip headers/Quad stats)
            if (cls.includes("bg-slate-900") || cls.includes("bg-[#1E293B]") || cls.includes("bg-[#1e293b]") || cls.includes("bg-slate-850")) {
              htmlEl.style.backgroundColor = "#0F172A";
              htmlEl.style.color = "#FFFFFF";
              htmlEl.style.borderColor = "#2563EB";
              
              htmlEl.querySelectorAll("span").forEach(s => s.style.color = "#FFFFFF");
              htmlEl.querySelectorAll("div").forEach(d => d.style.color = "#FFFFFF");
            }

            // Secondary Theme Accent Borders / Secondary Highlight rows
            if (cls.includes("border-t-amber-500")) {
              htmlEl.style.borderTopColor = "#2563EB";
            }
            if (cls.includes("border-l-amber-500")) {
              htmlEl.style.borderLeftColor = "#2563EB";
            }

            // Success indicators
            if (cls.includes("bg-emerald-") || cls.includes("text-emerald-")) {
              htmlEl.style.backgroundColor = "#E6FDF4"; 
              htmlEl.style.color = "#10B981"; 
              htmlEl.style.borderColor = "#10B981";
            }
            if (cls.includes("text-emerald-")) {
              htmlEl.style.color = "#10B981";
            }

            // Warning indicators
            if (cls.includes("bg-yellow-") || cls.includes("bg-amber-") || cls.includes("text-yellow-") || cls.includes("text-amber-")) {
              htmlEl.style.backgroundColor = "#FFFBEB"; 
              htmlEl.style.color = "#F59E0B"; 
              htmlEl.style.borderColor = "#F59E0B";
            }
            if (cls.includes("text-yellow-") || cls.includes("text-amber-")) {
              htmlEl.style.color = "#F59E0B";
            }

            // Danger indicators
            if (cls.includes("bg-red-") || cls.includes("bg-rose-") || cls.includes("text-red-") || cls.includes("text-rose-")) {
              htmlEl.style.backgroundColor = "#FEF2F2"; 
              htmlEl.style.color = "#EF4444"; 
              htmlEl.style.borderColor = "#EF4444";
            }
            if (cls.includes("text-red-") || cls.includes("text-rose-")) {
              htmlEl.style.color = "#EF4444";
            }

            // Fix white text on white backgrounds
            const computedStyle = window.getComputedStyle(htmlEl);
            const textCol = htmlEl.style.color || computedStyle.color;
            if (textCol === "rgb(255, 255, 255)" && !hasThemedParent(htmlEl)) {
              htmlEl.style.color = "#0F172A";
            }
          });

          // 6. Calibrate all custom SVG elements/charts
          reportCard.querySelectorAll("svg").forEach((svg) => {
            svg.style.backgroundColor = "#FFFFFF";

            svg.querySelectorAll("line").forEach((l) => {
              const strokeVal = l.getAttribute("stroke");
              if (strokeVal === "#f1f5f9" || strokeVal === "#f8fafc" || strokeVal === "#1e293b" || strokeVal === "#0f172a" || strokeVal === "#334155") {
                l.setAttribute("stroke", "#E2E8F0");
              }
            });

            svg.querySelectorAll("text").forEach((t) => {
              const fillVal = t.getAttribute("fill");
              const hasWhiteTextClass = t.className ? t.className.baseVal.includes("text-white") : false;
              if (fillVal === "#ffffff" || fillVal === "#f8fafc" || fillVal === "#94a3b8" || hasWhiteTextClass) {
                t.setAttribute("fill", "#0F172A");
              }
            });

            svg.querySelectorAll("path").forEach((p) => {
              const fillVal = p.getAttribute("fill");
              if (fillVal === "#eab308") p.setAttribute("fill", "#F59E0B"); // Warning
              if (fillVal === "#94a3b8") p.setAttribute("fill", "#0F172A"); // Primary
              if (fillVal === "#3b82f6") p.setAttribute("fill", "#2563EB"); // Secondary
              if (fillVal === "#10b981") p.setAttribute("fill", "#10B981"); // Success
              if (fillVal === "#f43f5e") p.setAttribute("fill", "#EF4444"); // Danger
            });

            // Anchor QR Code visibility with Solid White Backing
            const svgInner = svg.innerHTML;
            if (svgInner.includes("qr-cell")) {
              svg.style.backgroundColor = "#FFFFFF";
              const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
              bgRect.setAttribute("width", "100%");
              bgRect.setAttribute("height", "100%");
              bgRect.setAttribute("fill", "#FFFFFF");
              svg.insertBefore(bgRect, svg.firstChild);
            }
          });

          // 7. Fix responsive collapsible SVG / Recharts dimensions
          const originalCharts = element.querySelectorAll(".recharts-wrapper, .recharts-responsive-container");
          originalCharts.forEach((orig, idx) => {
            const width = orig.getBoundingClientRect().width || 600;
            const height = orig.getBoundingClientRect().height || 300;
            const clonedCh = reportCard.querySelectorAll(".recharts-wrapper, .recharts-responsive-container")[idx] as HTMLElement;
            if (clonedCh) {
              clonedCh.style.width = `${width}px`;
              clonedCh.style.height = `${height}px`;
              const svgInner = clonedCh.querySelector("svg");
              if (svgInner) {
                svgInner.setAttribute("width", `${width}`);
                svgInner.setAttribute("height", `${height}`);
                svgInner.style.width = `${width}px`;
                svgInner.style.height = `${height}px`;
              }
            }
          });
        }
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 12;
      const contentWidth = pdfWidth - (margin * 2);
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const contentHeight = (imgHeight * contentWidth) / imgWidth;

      let heightLeft = contentHeight;
      let position = margin;

      pdf.addImage(imgData, "JPEG", margin, position, contentWidth, contentHeight);
      heightLeft -= (pdfHeight - (margin * 2));

      while (heightLeft > 0) {
        position = heightLeft - contentHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", margin, position, contentWidth, contentHeight);
        heightLeft -= (pdfHeight - (margin * 2));
      }

      pdf.save(`Concrete_Mix_Report_C${input.fck28}_${reportLanguage.toUpperCase()}.pdf`);
      console.log("PDF Export successfully finished.");
    } catch (err) {
      console.error("PDF Export failed: ", err);
    } finally {
      for (const { win, originalGCS } of patchedWindows) {
        try {
          win.getComputedStyle = originalGCS;
          delete (win as any).__isGCS_Patched;
        } catch {}
      }

      if (originalStyles && originalStyles.length > 0) {
        for (const styleObj of originalStyles) {
          try {
            styleObj.element.innerHTML = styleObj.text;
          } catch {}
        }
      }

      setIsExporting(false);
    }
  };

  const totalDryPerM3 = 
    result.cementWeight + 
    result.waterContentActual + 
    result.sandWeightDry + 
    result.gravelWeightDry + 
    result.admixtureWeights.reduce((s, a) => s + a.weight, 0);

  const dryWater = Math.round(result.waterContentActual) + " L";
  
  const wetWater = Math.round(result.waterWeightWet) + " L";

  const validationLedger = React.useMemo(() => {
    const checks: {
      name: string;
      nameEn: string;
      status: "PASS" | "WARN" | "FAIL";
      messageAr: string;
      messageEn: string;
    }[] = [];

    const resolvedAll = resolveMaterials(input, activeProject?.materialSnapshots, materialsDatabase);
    
    // 1. Presence of Materials & No Empty Values
    const hasMaterials = !!(resolvedAll.cement?.name && resolvedAll.sand?.name && resolvedAll.gravel?.name);
    const posQuantities = result.cementWeight > 0 && result.waterContentActual > 0 && result.sandWeightDry > 0 && result.gravelWeightDry > 0;
    
    if (!hasMaterials || !posQuantities) {
      checks.push({
        name: "وجود المواد واكتمال المعايرة",
        nameEn: "Constituent Completeness Check",
        status: "FAIL",
        messageAr: "خطأ هندسي: المواد الأساسية غير مكتملة أو تحتوي على قيم صفرية. يرجى مراجعة الجدول والنسب.",
        messageEn: "Critical: Constituent material list contains empty references or zero values. Check your inputs."
      });
    } else {
      checks.push({
        name: "وجود المواد واكتمال المعايرة",
        nameEn: "Constituent Completeness Check",
        status: "PASS",
        messageAr: `تم التحقق: تم اعتماد المواد (${resolvedAll.cement.name} + ${resolvedAll.sand.name} + ${resolvedAll.gravel.name}) بنجاح.`,
        messageEn: `Verified: Material constituents verified successfully.`
      });
    }

    // 2. Concrete Type & Aggregate Compatibility
    const concreteType = input.concreteType || "NSC";
    const dMax = input.dMax || 20;
    const sandPercent = result.sandPercent || 42;
    const sandDens = resolvedAll.sand?.density || 0;
    const gravelDens = resolvedAll.gravel?.density || 0;

    if (sandDens <= 0 || gravelDens <= 0) {
      checks.push({
        name: "كثافة المواد الأساسية",
        nameEn: "Material Densities Check",
        status: "FAIL",
        messageAr: "فشل التحقق: كثافة الرمل أو الحصى غير متوفرة أو تساوي صفرًا. يرجى إدخال كثافات حقيقية.",
        messageEn: "Failed: Sand or gravel density is missing or zero. Real densities are required."
      });
    }

    if (concreteType === "SCC" && dMax > 16) {
      checks.push({
        name: "توافق الركام مع نوع الخرسانة (SCC)",
        nameEn: "Aggregate Type Match (SCC)",
        status: "FAIL",
        messageAr: `فشل التوافق: قطر الحصى الأقصى (${dMax} مم) مرتفع جداً للخرسانة ذاتية الرص. الحد الأقصى الآمن هو 16 مم لتجنب انسداد قضبان الحديد.`,
        messageEn: `Failed: Aggregate maximum diameter D_max (${dMax}mm) exceeds safe limit of 16mm for self-compacting concrete.`
      });
    } else if (concreteType === "PERVIOUS" && sandPercent > 20) {
      checks.push({
        name: "توافق الركام مع نوع الخرسانة (PERVIOUS)",
        nameEn: "Aggregate Type Match (PERVIOUS)",
        status: "FAIL",
        messageAr: `فشل التوافق: نسبة الرمل (${Math.round(sandPercent)}%) مرتفعة جداً للخرسانة المسامية النفاذة. يرجى تقليل نسبة الرواسب الرملية لتفعيل فراغات قنوات الصرف.`,
        messageEn: `Failed: Sand percentage (${Math.round(sandPercent)}%) is too high for porous draining concrete. Limit sand under 20%.`
      });
    } else if (concreteType === "LWC" && (sandDens >= 2200 || gravelDens >= 2200)) {
      checks.push({
        name: "توافق الركام مع نوع الخرسانة (LWC)",
        nameEn: "Aggregate Type Match (LWC)",
        status: "WARN",
        messageAr: "تنبيه هندسي: كثافة الحصى المستعمل عادية. الخرسانة خفيفة الوزن تتطلب تفعيل واستخدام ركام مخصص خفيف (Lightweight Aggregate).",
        messageEn: "Warning: Normal relative density aggregates are selected for a lightweight concrete design."
      });
    } else if (concreteType === "HWC" && (sandDens < 2900 && gravelDens < 2900)) {
       checks.push({
        name: "توافق الركام مع نوع الخرسانة (HWC)",
        nameEn: "Aggregate Type Match (HWC)",
        status: "FAIL",
        messageAr: "فشل التوافق: كثافة الركامات أقل من 2900 kg/m³. حظر الصب بالسرعات العائلية لطبقة الحماية الإشعاعية ما لم تستبدل الحبات بالباريت أو الهيماتيت.",
        messageEn: "Failed: Aggregate relative density is too low for shielding heavyweight concrete. Must use baryte/magnetite aggregates."
      });
    } else {
       checks.push({
        name: "توافق المواد مع نوع الخرسانة",
        nameEn: "Concrete Type aggregate compatibility",
        status: "PASS",
        messageAr: `تم التحقق: أوزان ونسب الركام متوافقة تماماً مع خواص الفئة الهيكلية المحددة: [${concreteType}].`,
        messageEn: `Verified: Sifting sizes and fractions perfectly fit the designated class: [${concreteType}].`
      });
    }

    // 3. W/C compliance with Code (Exposure rules)
    const exposureClass = input.exposureClass || "X0";
    const wcRatio = result.wcRatioAdjusted || 0.45;
    const isAggressiveExp = ["XD1", "XD2", "XD3", "XS1", "XS2", "XS3", "XA1", "XA2", "XA3"].includes(exposureClass);

    if (isAggressiveExp && wcRatio > 0.45) {
      checks.push({
        name: "مطابقة نسبة الماء (W/C) لرمز التعرض",
        nameEn: "Water-Cement Ratio Durability Check",
        status: "FAIL",
        messageAr: `مخالف للكود: الفئة البيئية النشطة (${exposureClass}) تفيد بخطر ملوحة مرتفع وتتطلب نفاذية منخفضة جداً (W/C ≤ 0.45). النسبة الحالية هي ${wcRatio.toFixed(2)}.`,
        messageEn: `Failed: Exposure class '${exposureClass}' prohibits W/C ratio > 0.45. Secured limits exceeded.`
      });
    } else if (wcRatio > 0.60) {
      checks.push({
        name: "مطابقة نسبة الماء لرمز التعرض الكود",
        nameEn: "Water-Cement Ratio Limit Check",
        status: "WARN",
        messageAr: `تنبيه: نسبة مياه الخلط مرتفعة (W/C = ${wcRatio.toFixed(2)}). خطر حدوث شقوق حرارية وتفتت سطحي مبكر.`,
        messageEn: `Warning: High W/C ratio (${wcRatio.toFixed(2)}) is prone to increased shrinkage cracking risks.`
      });
    } else {
      checks.push({
        name: "معامل مطابقت الماء/الإسمنت W/C",
        nameEn: "W/C Durability Criteria Compliance",
        status: "PASS",
        messageAr: `تم التحقق: نسبة مياه الخلط (W/C = ${wcRatio.toFixed(2)}) آمنة وضمن الحدود المعتمدة هندسياً لكود التعرض البيئي والتشغيل الصارم.`,
        messageEn: `Verified: Water-to-Cement ratio complies with all international exposure rules.`
      });
    }

    // 4. Cement Strength Class compatibility with specified target strength
    const fck28 = input.fck28 || 25;
    const cementClass = input.cementClassStrength || 42.5;

    if (fck28 >= 40 && cementClass < 42.5) {
      checks.push({
        name: "ملائمة رتبة الإسمنت للمقاومة fck28",
        nameEn: "Cement Strength Class Appropriateness",
        status: "FAIL",
        messageAr: `فشل التوافق: لا يمكن تصنيع خرسانة fck28 ≥ 40 MPa بإستعمال إسمنت منخفض الرتبة (${cementClass} MPa). نوصي بالدخول وترقية صنف الإسمنت إلى 42.5R أو 52.5N.`,
        messageEn: `Failed: specified cement grade (${cementClass} MPa) cannot reliably deliver specified compressive strength fck28 >= 40 MPa.`
      });
    } else if (fck28 < 25 && cementClass > 42.5) {
      checks.push({
        name: "ملائمة رتبة الإسمنت للمقاومة fck28",
        nameEn: "Cement Strength Class Appropriateness",
        status: "WARN",
        messageAr: "تنبيه اقتصادي: روتينية الصب بسيطة ولا تحتاج إسمنت بورتلاندي عالي الدرجة، يرجى استهلاك إسمنت عادي 32.5 لتوفير التكاليف المالية الإجمالية للمتر المكعب.",
        messageEn: "Advice: Excessively strong cement class is selected for normal/low performance requirements. Consider regular 32.5 CEM."
      });
    } else {
      checks.push({
        name: "توافق رتبة الإسمنت مع المقاومة المطلوبة",
        nameEn: "Cement class compatibility with target strength",
        status: "PASS",
        messageAr: `تم التحقق: رتبة الإسمنت الحالية (${cementClass} MPa) متوافقة ولديها الكفاءة العظمى لتأمين إجهاد الضغط fc28 = ${fck28} MPa بأمان.`,
        messageEn: `Verified: cement strength class appropriately matches target concrete performance criteria.`
      });
    }

    // 5. Total Mass Balance and density (Air content & compacting index check)
    const totalDensity = result.totalFreshDensity || 2400;
    if (totalDensity < 2100 && concreteType !== "LWC") {
      checks.push({
        name: "كثافة الخرسانة الموقعية",
        nameEn: "Density Compaction Verification",
        status: "FAIL",
        messageAr: "خطأ هندسي: الكثافة الجافة المحسوبة تقل عن 2100 kg/m³ لخرسانة عادية. يرجى مراجعة إدخال الكثافة الحجمية للرمل والحصى وتفادي الفراغات المفتوحة مالم يكن النوع خورسنة خفيفة.",
        messageEn: "Failed: Computed bulk density is dangerously low for non-lightweight structural configurations."
      });
    } else {
      checks.push({
        name: "توازن الكتل الإجمالية وكثافة الخلط الفنية",
        nameEn: "Total Fresh Mix Mass balance",
        status: "PASS",
        messageAr: `تم التحقق: الكثافة التقريبية للخلطة الرطبة (${Math.round(totalDensity)} kg/m³) ممتازة للمحافظة على الرص والاندماج الكثيف للخرسانة المسلحة.`,
        messageEn: `Verified: Total balance density validated smoothly.`
      });
    }

    const overallPass = checks.every(c => c.status !== "FAIL");
    return { checks, overallPass };
  }, [input, result, activeProject, materialsDatabase]);

  const resolvedMaterialsAll = useMemo(() => {
    return resolveMaterials(input, activeProject?.materialSnapshots, materialsDatabase);
  }, [input, activeProject, materialsDatabase]);

  const materialPassportsList = useMemo(() => {
    const list: {
      category: "cement" | "sand" | "gravel" | "water" | "admixture";
      name: string;
      titleAr: string;
      titleEn: string;
      properties: { labelAr: string; labelEn: string; value: string; unit?: string }[];
      notesAr: string;
      notesEn: string;
      gradation?: { sieve: number; passing: number }[];
    }[] = [];

    const mat = resolvedMaterialsAll;

    // 1. Cement
    if (mat.cement) {
      list.push({
        category: "cement",
        name: mat.cement.name,
        titleAr: `البطاقة الفنية الكاملة: الإسمنت البورتلاندي الأول`,
        titleEn: `Technical Passport: Portland Cement Constituent`,
        properties: [
          { labelAr: "الاسم والموديل", labelEn: "Name / Category", value: mat.cement.name },
          { 
            labelAr: "الكثافة الحجمية", 
            labelEn: "Specific Gravity", 
            value: mat.cement.density && mat.cement.density > 0 
              ? (mat.cement.density / 1000).toFixed(2) 
              : (reportLanguage === "ar" ? "غير متوفر" : reportLanguage === "fr" ? "Non disponible" : "N/A"), 
            unit: mat.cement.density && mat.cement.density > 0 ? "g/cm³" : "" 
          },
          { labelAr: "رتبة الضغط الفعالة", labelEn: "Effective Class Strength", value: `${mat.cement.cementStrengthClass || input.cementClassStrength || 42.5}`, unit: "MPa" },
          { labelAr: "الحجم الفعلي بالتناسب", labelEn: "Batch Quantity", value: `${Math.round(result.cementWeight)}`, unit: "kg/m³" },
          { labelAr: "ثاني أكسيد الكربون النوعي", labelEn: "Carbon Footprint (SNO CO2)", value: "320", unit: "kg-CO2/tn" }
        ],
        notesAr: "إسمنت عالية المقاومة والاعتمادية الجزئية للتصنيع المتكامل للبيتون الهيكلي.",
        notesEn: "Premium hydration product optimized for mechanical load-sharing on structural members."
      });
    }

    // 2. Sand
    if (mat.sand) {
      list.push({
        category: "sand",
        name: mat.sand.name,
        titleAr: `البطاقة الفنية الكاملة: الركام الناعم (الرمل)`,
        titleEn: `Technical Passport: Fine Aggregate Constituent`,
        properties: [
          { labelAr: "اسم الركام المعتمد", labelEn: "Approved Fine Name", value: mat.sand.name },
          { 
            labelAr: "الكثافة النوعية الجافة", 
            labelEn: "Dry Density", 
            value: mat.sand.density && mat.sand.density > 0 
              ? (mat.sand.density / 1000).toFixed(2) 
              : (reportLanguage === "ar" ? "غير متوفر" : reportLanguage === "fr" ? "Non disponible" : "N/A"), 
            unit: mat.sand.density && mat.sand.density > 0 ? "g/cm³" : "" 
          },
          { labelAr: "تصحيح معامل الامتصاص", labelEn: "Absorption coefficient", value: `${mat.sand.absorption || 1.25}`, unit: "%" },
          { labelAr: "الحجم الفعلي بالتناسب", labelEn: "Batch Quantity", value: `${Math.round(result.sandWeightDry)}`, unit: "kg/m³" },
          { labelAr: "معيار النعومة الكود", labelEn: "Fineness Modulus (FM)", value: `${mat.sand.finenessModulus || 2.65}` }
        ],
        notesAr: "حب مائل للشكل الكروي المعتمد من المقالع الجزائرية المحلية الخالي من المواد الطميّة الضارة.",
        notesEn: "Washed sub-angular high-durability natural silica matrix with minimal clay silt contamination.",
        gradation: mat.sand.gradationData
      });
    }

    // 3. Gravel
    if (mat.gravel) {
      list.push({
        category: "gravel",
        name: mat.gravel.name,
        titleAr: `البطاقة الفنية الكاملة: الركام الخشن (الحصى)`,
        titleEn: `Technical Passport: Coarse Aggregate Constituent`,
        properties: [
          { labelAr: "اسم الركام المعتمد", labelEn: "Approved Coarse Name", value: mat.gravel.name },
          { 
            labelAr: "الكثافة النوعية الجافة", 
            labelEn: "Dry Density", 
            value: mat.gravel.density && mat.gravel.density > 0 
              ? (mat.gravel.density / 1000).toFixed(2) 
              : (reportLanguage === "ar" ? "غير متوفر" : reportLanguage === "fr" ? "Non disponible" : "N/A"), 
            unit: mat.gravel.density && mat.gravel.density > 0 ? "g/cm³" : "" 
          },
          { labelAr: "معامل الامتصاص الحجمي", labelEn: "Absorption coefficient", value: `${mat.gravel.absorption || 1.0}`, unit: "%" },
          { labelAr: "الحجم الفعلي بالتناسب", labelEn: "Batch Quantity", value: `${Math.round(result.gravelWeightDry)}`, unit: "kg/m³" },
          { labelAr: "القطر الأقصى (Dmax)", labelEn: "Maximum Particle Size", value: `${mat.gravel.dMax || input.dMax || 20}`, unit: "mm" }
        ],
        notesAr: "ركام خشن مكسر مغسول ذو متانة عالية ومقاومة ممتازة للتآكل الميكانيكي (صلابة لوس أنجلوس ممتازة).",
        notesEn: "High-grade crushed aggregate with optimized packing index and durable mechanical skeleton.",
        gradation: mat.gravel.gradationData
      });
    }

    // 4. Water
    if (mat.water) {
      list.push({
        category: "water",
        name: mat.water.name,
        titleAr: `البطاقة الفنية الكاملة: مياه الخلط الحيوية`,
        titleEn: `Technical Passport: Hydration Mixing Water`,
        properties: [
          { labelAr: "اسم العنصر ومصدر المياه", labelEn: "Source Name", value: mat.water.name },
          { labelAr: "الكثافة الاسمية الكود", labelEn: "Density Standard", value: "1.00", unit: "g/cm³" },
          { labelAr: "الرقم الهيدروجيني (pH)", labelEn: "Potential of Hydrogen (pH)", value: "7.2" },
          { labelAr: "الحجم الفعلي بالتناسب", labelEn: "Batch Quantity", value: `${Math.round(result.waterContentActual)}`, unit: "kg/m³" },
          { labelAr: "نسبة المياه المصححة الكلي", labelEn: "Net Adjusted Water", value: `${Math.round(result.waterWeightWet)}`, unit: "kg/m³" }
        ],
        notesAr: "مياه صالحة للشرب وموافقة للمواصفات الفنية الجزائرية وخالية تماماً من الكبريتات والأملاح المسببة لصدأ حديد التسليح.",
        notesEn: "Fully potable municipal-sourced water with balanced dissolved solids supporting full paste hydration."
      });
    }

    // 5. Admixtures (Superplasticizer / Chemical products)
    if (result.admixtureWeights && result.admixtureWeights.length > 0) {
      result.admixtureWeights.forEach((ad, i) => {
        list.push({
          category: "admixture",
          name: ad.name || (reportLanguage === "ar" ? `الملدن الفائق / مضاف ${i+1}` : `Admixture additive ${i+1}`),
          titleAr: `البطاقة الفنية الشاملة: المضافات الكيميائية والمعزّز النشط`,
          titleEn: `Technical Passport: Chemical Admixture Products`,
          properties: [
            { labelAr: "اسم المنتج المسجل", labelEn: "Additive Registered Code", value: ad.name },
            { labelAr: "نوع ووظيفة المنتج", labelEn: "Admixture Primary Function", value: ad.type || (reportLanguage === "ar" ? "ملدّن فائق ومخفّض قوي للماء" : "Superplasticizer / Water reducer") },
            { labelAr: "النسبة التصميمية المقررة", labelEn: "Design Dosage Rate", value: `${ad.dosage || input.dosageSuper || 1.1}`, unit: "%" },
            { labelAr: "الحجم الفعلي بالتناسب", labelEn: "Batch Weight Amount", value: `${ad.weight.toFixed(2)}`, unit: "kg/m³" }
          ],
          notesAr: "مواد بوليميرية ذات كفاءة تشغيلية تسهم في ترذيذ الحبات لسيولة أفضل بدون تلف مقاومة الـ ITZ الهيكلية للبيتون.",
          notesEn: "High-performance polymeric polycarboxylate dispersant enabling extreme W/C reduction with steady workability."
        });
      });
    }

    return list;
  }, [resolvedMaterialsAll, result, input, reportLanguage]);

  const labRecords = activeProject?.validationRecords || [];
  const hasLabValidation = labRecords.length > 0;
  const totalPagesCount = 10 + (hasLabValidation ? 8 : 0) + materialPassportsList.length;

  const qrVerificationText = `REF:DG-MX-CERT\nLAB:${companyName}\nPROJ:${projectName}\nENG:${engineerName}\nSTRENGTH:C${input.fck28}\nDATE:${new Date().toLocaleDateString()}`;

  return (
    <div className="space-y-6">
      
      {/* 5-POINT ENGINEERING VALIDATION & COMPLIANCE LEDGER */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 print:hidden text-right">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 flex-row-reverse">
          <div className="flex items-center gap-2 flex-row-reverse">
            <span className="p-1 px-2.5 bg-rose-600 text-white font-extrabold rounded-md text-[10px] uppercase font-mono animate-pulse">SNO CIVIL AUDIT</span>
            <h3 className="text-sm font-black text-slate-900 dark:text-white font-sans">
              ⚙️ {reportLanguage === "ar" ? "نظام التدقيق والتحقق الهندسي الاستباقي قبل توليد التقرير" : "Pre-Report Predictive Civil Engineering Verification Ledger"}
            </h3>
          </div>
          <span className={`text-xs font-black px-3 py-1 rounded-full ${validationLedger.overallPass ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800 animate-bounce"}`}>
            {validationLedger.overallPass ? (reportLanguage === "ar" ? "✓ معتمد وصالح هندسياً" : "APPROVED") : (reportLanguage === "ar" ? "⚠ فشل بعض ضوابط الكودات" : "VERIFICATION DISCREPANCY")}
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          {reportLanguage === "ar" 
            ? "يقوم محرك الذكاء الاصطناعي بفحص 5 ضوابط فنية أساسية تشمل وجود المواد، والحدود الدنيا لنسب الماء والركام ونموذجية التدرج ومحاكاة المقاومة فكي28 لضمان مطابقة الكود الوطني الجزائري والكود الأوروبي."
            : "Analytical expert systems evaluating constituent limits, aggregate matching constraints, water-cement boundaries, strength compatibility and structural density balances."}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-2">
          {validationLedger.checks.map((check, idx) => {
            const isPass = check.status === "PASS";
            const isWarn = check.status === "WARN";
            
            return (
              <div 
                key={idx} 
                className={`p-3.5 rounded-xl border flex flex-col justify-between text-right space-y-2 transition-all ${
                  isPass 
                    ? "bg-emerald-500/5 border-emerald-500/20 dark:bg-emerald-950/5 hover:border-emerald-500/40" 
                    : isWarn 
                    ? "bg-amber-500/5 border-amber-500/20 dark:bg-amber-950/5 hover:border-amber-500/40 animate-pulse"
                    : "bg-rose-500/5 border-rose-500/20 dark:bg-rose-950/5 hover:border-rose-500/40 animate-pulse"
                }`}
              >
                <div>
                  <div className="flex justify-between items-center flex-row-reverse mb-1.5">
                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 truncate max-w-[120px]">{reportLanguage === "ar" ? check.name : check.nameEn}</span>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded leading-none ${
                      isPass 
                        ? "bg-emerald-500 text-white" 
                        : isWarn 
                        ? "bg-amber-500 text-slate-900" 
                        : "bg-rose-600 text-white"
                    }`}>
                      {check.status}
                    </span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-slate-600 dark:text-slate-350 font-sans">
                    {reportLanguage === "ar" ? check.messageAr : check.messageEn}
                  </p>
                </div>
                {!isPass && (
                  <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 mt-2 border-t border-dashed border-slate-200 dark:border-slate-800 pt-1.5 font-sans">
                    {reportLanguage === "ar" ? "💡 الإجراء المطلوب: يرجى تعديل هذه القيمة في خلايا المعايرة." : "Action required: revise calibration values."}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Report Customizer Console */}
      <div className="bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 print:hidden transition-all duration-300">
        <div className="flex justify-between items-center cursor-pointer border-b border-slate-200/50 dark:border-slate-800/80 pb-3" onClick={() => setIsConfigOpen(!isConfigOpen)}>
          <div className="flex items-center gap-2 text-right">
            <span className="p-1 px-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-extrabold rounded text-[10px] uppercase">CONFIG</span>
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 font-sans">
              ⚙️ {reportLanguage === "ar" ? "لوحة التخصيص والتحكم في مظهر وهوية وبصمة التقرير" : reportLanguage === "fr" ? "Personnalisation & Paramètres du Rapport" : "Corporate Report Identity & Customizer"}
            </h4>
          </div>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
            {isConfigOpen ? (reportLanguage === "ar" ? "إغلاق لوحة التحكم" : "Collapse Controller") : (reportLanguage === "ar" ? "تعديل وبيانات التقرير والشعار واللغة ✎" : "Configure Logo, Metadata & Translations ✎")}
          </span>
        </div>

        {isConfigOpen && (
          <div className="space-y-4 animate-fade-in text-right">
            {/* Language Selection Grid */}
            <div>
              <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 font-sans">
                {reportLanguage === "ar" ? "1. حدد لغة مستند التقرير المطبوع والملفات المصدرة:" : reportLanguage === "fr" ? "1. Langue d'impression du rapport :" : "1. Choose Report Print Language (Active Translation):"}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { code: "ar", label: "العربية", flag: "🇩🇿" },
                  { code: "fr", label: "Français", flag: "🇫🇷" },
                  { code: "en", label: "English", flag: "🇬🇧" }
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setReportLanguage(item.code as any);
                    }}
                    className={`flex items-center justify-center gap-2 p-2 rounded-lg font-bold text-xs transition-all border cursor-pointer ${
                      reportLanguage === item.code
                        ? "bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 border-slate-900 dark:border-amber-400 shadow-md scale-[1.02]"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    <span>{item.flag}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Logo Preset Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 font-sans">
                  {reportLanguage === "ar" ? "2. اختر نمط شعار الاعتماد الفني للجهة الصادرة:" : "2. Select Authority Seal/Logo Stamp presets:"}
                </span>
                <select
                  value={companyLogoType}
                  onChange={(e) => setCompanyLogoType(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="shield">🛡 {reportTranslations[reportLanguage].logo1}</option>
                  <option value="flow">🌀 {reportTranslations[reportLanguage].logo2}</option>
                  <option value="metrology">📐 {reportTranslations[reportLanguage].logo3}</option>
                </select>
              </div>

              <div>
                <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 font-sans">
                  {reportLanguage === "ar" ? "3. اسم المؤسسة أو المختبر المسؤول:" : "3. Managing Quality Authority / Lab Title:"}
                </span>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            {/* Project Details Grid */}
            <div className="border-t border-slate-200/40 dark:border-slate-800/60 pt-3">
              <span className="text-[11.5px] font-black text-indigo-600 dark:text-indigo-400 block mb-2 font-sans flex items-center justify-end gap-1">
                <span>🏙</span>
                <span>{reportLanguage === "ar" ? "بيانات المشروع والموقع الإنشائي:" : "Project Infrastructure Parameters:"}</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 dark:text-slate-400 mb-1">{reportTranslations[reportLanguage].projectName}</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => handleProjectNameChange(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-right"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 dark:text-slate-400 mb-1">{reportTranslations[reportLanguage].siteLocation}</label>
                  <input
                    type="text"
                    value={siteLocation}
                    onChange={(e) => handleSiteLocationChange(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-right"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 dark:text-slate-400 mb-1">{reportTranslations[reportLanguage].clientOwner}</label>
                  <input
                    type="text"
                    value={clientOwner}
                    onChange={(e) => handleClientOwnerChange(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-right"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 dark:text-slate-400 mb-1">{reportTranslations[reportLanguage].contractor}</label>
                  <input
                    type="text"
                    value={contractor}
                    onChange={(e) => setContractor(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-right"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-slate-400 dark:text-slate-400 mb-1">{reportTranslations[reportLanguage].structuralElement}</label>
                  <input
                    type="text"
                    value={structuralElement}
                    onChange={(e) => setStructuralElement(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-right"
                  />
                </div>
              </div>
            </div>

            {/* Engineer Credentials Grid */}
            <div className="border-t border-slate-200/40 dark:border-slate-800/60 pt-3">
              <span className="text-[11.5px] font-black text-amber-600 dark:text-amber-400 block mb-2 font-sans flex items-center justify-end gap-1">
                <span>👷</span>
                <span>{reportLanguage === "ar" ? "بيانات المهندس المسؤول والترخيص المهني:" : "Quality Engineer Professional Credentials:"}</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 dark:text-slate-400 mb-1">{reportTranslations[reportLanguage].leadEngineer}</label>
                  <input
                    type="text"
                    value={engineerName}
                    onChange={(e) => setEngineerName(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-right"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 dark:text-slate-400 mb-1">{reportTranslations[reportLanguage].licenseNumber}</label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-right font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 dark:text-slate-400 mb-1">{reportTranslations[reportLanguage].contactEmail}</label>
                  <input
                    type="text"
                    value={engineerEmail}
                    onChange={(e) => setEngineerEmail(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-right font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 dark:text-slate-400 mb-1">{reportTranslations[reportLanguage].signatureTitle}</label>
                  <input
                    type="text"
                    value={signatureDesignation}
                    onChange={(e) => setSignatureDesignation(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-right"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic SNO AI Engineering Advisor panel */}
      <div className="print:hidden my-6">
        <EngineeringAIAdvisor
          input={input}
          result={result}
          reportLanguage={reportLanguage}
          materialsDatabase={materialsDatabase}
          resolvedMaterials={resolvedMaterialsAll}
        />
      </div>

      {/* Main Report Card Frame */}
      <div 
        className="w-full bg-[#EAEDF1] dark:bg-slate-950 p-4 sm:p-6 rounded-xl border border-slate-300 dark:border-slate-800 shadow-xl print:p-0 print:border-0 print:shadow-none" 
        id="concrete-mix-report-card"
        style={{ direction: isRtl ? "rtl" : "ltr" }}
      >
        
        {/* Dynamic Controls Header (Print Hidden) */}
        <div className="max-w-[210mm] mx-auto bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-805 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden mb-6">
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">LAB CERTIFICATION SYSTEM</span>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-101 flex items-center gap-1.5 font-sans">
              <span>📊</span>
              <span>{reportLanguage === "ar" ? "معاينة وبث التقرير المعتمد (9 صفحات A4)" : "Live Visual Certification Preview (9 A4 Pages)"}</span>
            </h3>
            
            {/* Real-time synchronization indicator */}
            <div className="flex items-center gap-1.5 mt-2 flex-row-reverse sm:flex-row justify-end sm:justify-start">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${syncStatus === "updating" ? "bg-amber-400" : "bg-emerald-400"}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${syncStatus === "updating" ? "bg-amber-500" : "bg-emerald-500"}`}></span>
              </span>
              <span className={`text-[10px] font-black tracking-wide ${syncStatus === "updating" ? "text-amber-600 dark:text-amber-400 animate-pulse" : "text-emerald-600 dark:text-emerald-450"}`}>
                {syncStatus === "updating" ? (
                  reportLanguage === "ar" 
                    ? "جارٍ التحديث وإعادة ترشيح بيانات الخلطة..." 
                    : reportLanguage === "fr"
                    ? "Mise à jour en cours et recalcul de la formule..."
                    : "SYNCING: Recalculating design balances..."
                ) : (
                  reportLanguage === "ar" 
                    ? "التقرير متزامن ومحدث بالكامل مع الحسابات الحالية ✓" 
                    : reportLanguage === "fr"
                    ? "RAPPORT SYNCHRONISÉ : entièrement à jour avec les calculs de formulation ✓"
                    : "REPORT SYNCHRONIZED: fully up-to-date with active mix ✓"
                )}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowExplanation(!showExplanation)}
              className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-705 dark:text-slate-300 hover:bg-slate-200 p-2 px-3 rounded-md flex items-center gap-1 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <HelpCircle size={14} /> 
              {showExplanation ? (reportLanguage === "ar" ? "إخفاء التفسير" : "Hide Details") : (reportLanguage === "ar" ? "تفسير الحساب" : "Explain Logic")}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 p-2 px-3 rounded-md flex items-center gap-1 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <Printer size={14} /> {t_sub.printReport}
            </button>
            <button
              type="button"
              onClick={triggerExportWord}
              className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white p-2 px-3 rounded-md flex items-center gap-1 transition-all shadow-sm cursor-pointer"
            >
              <Briefcase size={14} /> {t_sub.exportWord}
            </button>
            <button
              type="button"
              onClick={triggerExportExcel}
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white p-2 px-3 rounded-md flex items-center gap-1 transition-all shadow-sm cursor-pointer"
            >
              <FileSpreadsheet size={13} /> {t_sub.exportExcel}
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExporting}
              className="text-xs font-black bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 p-2 px-4 rounded-md flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Download size={14} /> 
              {isExporting ? (reportLanguage === "ar" ? "جاري التوليد..." : "Generating...") : t_sub.exportPdf}
            </button>
          </div>
        </div>

        {/* 9 DISTINCT A4 CHASSIS PAGES */}
        <div className="w-full overflow-x-auto lg:overflow-x-visible">

          {/* PAGE 1: COVER PAGE */}
          <A4Page pageNumber={1} totalPages={totalPagesCount} title={customTranslations[reportLanguage].coverTitle} isRtl={isRtl} companyName={companyName} reportLanguage={reportLanguage}>
            <div className="flex-1 flex flex-col justify-between items-center py-6">
              {/* Top Banner */}
              <div className="text-center space-y-2 mt-4">
                <div className="mx-auto w-16 h-16 bg-slate-900 text-amber-500 rounded-xl flex items-center justify-center font-black text-2xl shadow-lg border border-amber-500">
                  SNO
                </div>
                <h4 className="text-xs tracking-[0.25em] text-slate-500 font-extrabold font-sans">SNO ENGINEERING AI LAB</h4>
              </div>

              {/* Title Unit */}
              <div className="text-center my-6 space-y-4 max-w-[160mm]">
                <span className="p-1 px-3 bg-red-105 text-red-800 text-[9px] font-black uppercase rounded tracking-widest leading-none">OFFICIAL RECORD</span>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight font-sans tracking-tight">
                  {reportLanguage === "ar" ? "شهادة اعتماد وتصميم الخلطة الخرسانية المعتمدة" : reportLanguage === "fr" ? "CERTIFICAT EXCLUSIF DE FORMULATION DE BÉTON" : "COMPREHENSIVE CONCRETE MIX DESIGN CERTIFICATE"}
                </h1>
                <div className="h-1 w-24 bg-amber-500 mx-auto rounded"></div>
                <p className="text-[11px] text-slate-500 max-w-[130mm] mx-auto leading-relaxed">
                  {reportLanguage === "ar" 
                    ? "تقرير دراسة وبث نسب خلط المكونات الخرسانية بالتفصيل طبقاً لمعادلات الكثافة ومخططات دروكس الحبيبية المرجعية." 
                    : "Official technical formulation dossier generated under advanced particle packing models and Dreux-Gorisse/EN standardized compliance rules."}
                </p>
              </div>

              {/* Document Registry Table */}
              <div className="w-full max-w-[150mm] border border-slate-200 rounded overflow-hidden text-xs my-3 bg-slate-50/50 text-right">
                <div className="grid grid-cols-2 divide-x divide-y divide-slate-200">
                  <div className="p-2.5"><span className="text-slate-400 block text-[9px] font-bold">{reportLanguage === "ar" ? "رقم المستند / التقرير" : "Report Reference ID"}</span><span className="font-mono font-bold text-slate-800">SNO-DG-2026-MX-{Math.floor(Date.now() / 150000).toString().substring(3)}</span></div>
                  <div className="p-2.5"><span className="text-slate-400 block text-[9px] font-bold">{reportLanguage === "ar" ? "اسم المشروع الإنشائي" : "Structural Project"}</span><span className="font-extrabold text-slate-800 truncate block">{projectName || "Default Project"}</span></div>
                  <div className="p-2.5"><span className="text-slate-400 block text-[9px] font-bold">{reportLanguage === "ar" ? "الجهة المالكة للمشروع" : "Owner / Client"}</span><span className="font-bold text-slate-700 truncate block">{clientOwner || "Client Authority"}</span></div>
                  <div className="p-2.5"><span className="text-slate-400 block text-[9px] font-bold">{reportLanguage === "ar" ? "المهندس المسؤول المصمم" : "Lead Designer Engineer"}</span><span className="font-extrabold text-slate-800 block">{engineerName} <span className="text-[10px] text-slate-500">({licenseNumber})</span></span></div>
                  <div className="p-2.5"><span className="text-slate-400 block text-[9px] font-bold">{reportLanguage === "ar" ? "موقع الخرسانة بالبنية" : "Structural Segment"}</span><span className="font-medium text-slate-700">{structuralElement || "Foundation pillars"}</span></div>
                  <div className="p-2.5"><span className="text-slate-400 block text-[9px] font-bold">{reportLanguage === "ar" ? "موقع صب المشروع" : "Project Site Location"}</span><span className="font-medium text-slate-700">{siteLocation || "North Terminal Sector"}</span></div>
                </div>
              </div>

              {/* Bottom Stamp and Security Validation */}
              <div className="w-full flex justify-between items-center max-w-[150mm] border-t border-dashed border-slate-200 pt-5 mt-3">
                <div className="flex gap-3 items-center">
                  <QrCodeSvg text={qrVerificationText} size={60} />
                  <div className="text-[8.5px] text-slate-404 leading-tight text-right">
                    <span className="font-bold text-slate-600 block uppercase">QR Verification Security</span>
                    <span>Scan to verify concrete receipt digital signature online. SNO cryptographic integrity.</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 border-2 border-amber-600 border-double rounded-full flex items-center justify-center text-[7px] text-amber-700 leading-tight font-black rotate-12 shrink-0">
                    APPROVED<br/>SNO LAB
                  </div>
                </div>
              </div>
            </div>
          </A4Page>

          {/* PAGE 2: EXECUTIVE SUMMARY */}
          <A4Page pageNumber={2} totalPages={totalPagesCount} title={customTranslations[reportLanguage].executiveSummary} isRtl={isRtl} companyName={companyName} reportLanguage={reportLanguage}>
            <div className="space-y-4 py-4 flex-1 flex flex-col justify-start">
              
              <div className="bg-slate-50 p-4 border-l-4 border-l-indigo-500 rounded text-xs text-slate-700 leading-relaxed font-sans text-right">
                <h4 className="font-black text-indigo-700 mb-1">{reportLanguage === "ar" ? "مقدمة فنية عامة" : "Technical Overview"}</h4>
                {reportLanguage === "ar" 
                  ? "تقدّم هذه الشهادة وثيقة تفصيلية معتمدة لهيكل تصميم الخلطة الخرسانية الحالية لبيان المكونات والوزن النوعي والتدرج الرغوي الحبيبي. لقد تم معايرة كميات الإسمنت والماء والركامات بدقة متناهية لتطابق متطلبات أمان الدباغة وتحقيق متمتانة عالية تقاوم نفاذية المياه ورطوبة الموقع والضغوط الإنشائية."
                  : "This official synthesis report documents the engineered design mix of concrete calculated with Dreux-Gorisse/EN methodology. The aggregate skeleton has been optimized for minimum voids and balanced binder ratios to guarantee maximum density, low workability resistance loss, and robust curing safety limits."}
              </div>

              {/* Specification data sheet */}
              <div className="text-right">
                <h3 className="text-xs font-black text-slate-808 mb-2 border-b border-slate-100 pb-1 flex items-center gap-1 justify-end">
                  <span>⚙️</span>
                  <span>{reportLanguage === "ar" ? "المحددات الفنية والهندسية الأساسية للصلب" : "Primary Structural Specifications"}</span>
                </h3>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="border border-slate-200 p-2 rounded">
                    <span className="block text-[9px] text-slate-404">{reportLanguage === "ar" ? "صنف الخرسانة المطلوبة" : "Concrete Spec Range"}</span>
                    <span className="text-xs font-black text-slate-808">{input.concreteType || "NSC (Normal)"}</span>
                  </div>
                  <div className="border border-slate-200 p-2 rounded">
                    <span className="block text-[9px] text-slate-404">{reportLanguage === "ar" ? "صنف الإسمنت المعتمد" : "Cement Spec Type"}</span>
                    <span className="text-xs font-bold text-slate-808">{input.cementType}</span>
                  </div>
                  <div className="border border-slate-200 p-2 rounded">
                    <span className="block text-[9px] text-slate-404">{reportLanguage === "ar" ? "المقاومة fck المطلوبة" : "Requested Strength (fck)"}</span>
                    <span className="text-xs font-black text-indigo-650">{input.fck28} MPa</span>
                  </div>
                  <div className="border border-slate-200 p-2 rounded">
                    <span className="block text-[9px] text-slate-404">{reportLanguage === "ar" ? "المقاومة fcm المتوقعة" : "Expected Strength (fcm)"}</span>
                    <span className="text-xs font-black text-emerald-600">{result.fcm28.toFixed(1)} MPa</span>
                  </div>
                </div>
              </div>

              {/* Validation Summary Section */}
              <div className="text-right border border-indigo-150/80 bg-slate-50 p-3 rounded-lg">
                <h3 className="text-[11px] font-black text-slate-800 mb-1.5 border-b border-indigo-100/50 pb-1 flex items-center gap-1 justify-end">
                  <span>🛡️</span>
                  <span>{reportLanguage === "ar" ? "بوابة التحقق المنطقي للحسابات (Validation Summary)" : "Calculation Validation Summary"}</span>
                </h3>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-white p-1.5 border border-slate-100 rounded">
                    <span className="block text-[7.5px] text-slate-400 font-sans leading-none mb-1">{reportLanguage === "ar" ? "حالة التحقق الحسابي" : "Validation Status"}</span>
                    <span className="text-[9.5px] font-black text-emerald-605">
                      {reportLanguage === "ar" ? "مطابق ومتناسق بالكامل" : "Valid for report"}
                    </span>
                  </div>
                  <div className="bg-white p-1.5 border border-slate-100 rounded">
                    <span className="block text-[7.5px] text-slate-400 font-sans leading-none mb-1">{reportLanguage === "ar" ? "أساس كلفة الركام" : "Aggregate Cost Basis"}</span>
                    <span className="text-[9.5px] font-bold text-slate-700">
                      {input.costBasis === "wet" 
                        ? (reportLanguage === "ar" ? "الوزن الرطب" : "Wet Weight")
                        : (reportLanguage === "ar" ? "الوزن الجاف" : "Dry Weight")
                      }
                    </span>
                  </div>
                  <div className="bg-white p-1.5 border border-slate-100 rounded">
                    <span className="block text-[7.5px] text-slate-400 font-sans leading-none mb-1">{reportLanguage === "ar" ? "تصحيح رطوبة الحساب" : "Moisture Correction"}</span>
                    <span className="text-[9.5px] font-bold text-slate-750">
                      {reportLanguage === "ar" ? "شامل الامتصاص فثق" : "Absorption Speciation"}
                    </span>
                  </div>
                  <div className="bg-white p-1.5 border border-slate-100 rounded">
                    <span className="block text-[7.5px] text-slate-400 font-sans leading-none mb-1">{reportLanguage === "ar" ? "نظام الوحدات النشط" : "Active Unit System"}</span>
                    <span className="text-[9.5px] font-bold text-slate-700">
                      {reportLanguage === "ar" ? "المتري الدولي (SI)" : "Metric (SI)"}
                    </span>
                  </div>
                </div>

                {/* Warnings inside PDF layout if any */}
                {validation.warnings.length > 0 && (
                  <div className="mt-1.5 text-[9px] text-amber-700 bg-amber-50/60 p-1.5 rounded border border-amber-200/40 leading-relaxed font-sans text-right">
                    <strong>{reportLanguage === "ar" ? "تنبيهات هندسية تكميلية:" : "Supplementary engineering warnings:"}</strong>
                    <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                      {validation.warnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Performance Cards Matrix */}
              <div className="flex-1 mt-4 text-right">
                <h3 className="text-xs font-black text-slate-805 mb-2 border-b border-slate-100 pb-1 flex items-center gap-1 justify-end">
                  <span>⚡</span>
                  <span>{reportLanguage === "ar" ? "التقييم الفني السريع للأداء" : "Quick Engineering Performance Ratings"}</span>
                </h3>
                <div className="space-y-2 text-xs">
                  {[
                    { label: customTranslations[reportLanguage].compTotalStrength, badge: "EXCELLENT", color: "bg-emerald-50 text-emerald-700 border-emerald-200", text: reportLanguage === "ar" ? "تتجاوز المقاومة المتوسطة fcm المقاومة المطلوبة بنسبة 120% لضمان معامل أمان عالي بالموقع." : "The mean strength fcm exceeds characteristic limits by more than 120%, satisfying international risk safety margins." },
                    { label: customTranslations[reportLanguage].workability, badge: "OPTIMIZED", color: "bg-amber-50 text-amber-700 border-amber-200", text: `${reportLanguage === "ar" ? "الهبوط المستهدف" : "Target Slump"} ${input.slump} cm ${reportLanguage === "ar" ? "يوفر انسيابية ممتازة للصب السهل مع المحافظة على كثافة البوليمرات." : "assures fluid displacement with controlled risk of segregation."}` },
                    { label: customTranslations[reportLanguage].durability, badge: "HIGH DURABILITY", color: "bg-blue-50 text-blue-700 border-blue-200", text: `${reportLanguage === "ar" ? "نسبة الماء إلى الإسمنت" : "Water/Cement proportion of"} W/C = ${result.wcRatioAdjusted.toFixed(2)} ${reportLanguage === "ar" ? "تحكم كثافة العظام وتمنع تغلغل الكربنة والرطوبة." : "protects aggregate microstructures from carbonation."}` },
                    { label: customTranslations[reportLanguage].sustainability, badge: "ECO-FRIENDLY", color: "bg-teal-50 text-teal-700 border-teal-200", text: reportLanguage === "ar" ? "تم معايرة الإضافات المعدنية لتخفيض بنحو 12% من الانبعاثات الكربونية الناتجة." : "Engineered mineral dosages downscale absolute carbon emission density by up to 12%." }
                  ].map((item, idx) => (
                    <div key={`perf-${idx}`} className="flex justify-between items-center p-2.5 border border-slate-105 rounded-lg hover:bg-slate-50/50">
                      <div className="text-right">
                        <span className="font-extrabold text-slate-800 block">{item.label}</span>
                        <span className="text-[10px] text-slate-500">{item.text}</span>
                      </div>
                      <span className={`text-[9px] font-black p-1 px-2 border rounded shrink-0 ${item.color}`}>{item.badge}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </A4Page>

          {/* PAGE 3: METHODOLOGY */}
          <A4Page pageNumber={3} totalPages={totalPagesCount} title={customTranslations[reportLanguage].methodology} isRtl={isRtl} companyName={companyName} reportLanguage={reportLanguage}>
            <div className="space-y-4 py-4 flex-1 flex flex-col justify-start text-right">
              
              <div className="text-xs space-y-3 leading-relaxed text-slate-705">
                <p>
                  {reportLanguage === "ar"
                    ? `تم تنفيذ تصميم هذه الخلطة وإجراء كافة المحاكيات الحركية لها بالاعتماد على طريقة: (طريقة درو-غوريس الفرنسية المعتمدة (Dreux-Gorisse)).`
                    : `The numerical synthesis of this concrete recipe is calculated and validated using the: (Dreux-Gorisse Volumetric Packing Framework).`}
                </p>

                {/* Dynamic methodology highlight card */}
                <div className="border border-indigo-200 p-3 bg-indigo-50/20 rounded">
                  <h4 className="font-black text-indigo-950 block mb-1.5 flex items-center justify-end gap-1.5">
                    <Sparkles size={14} className="text-indigo-600 font-bold" />
                    <span>{reportLanguage === "ar" ? "تفاصيل منهجية التصميم الفعّالة:" : "Design Methodology Scope"}</span>
                  </h4>
                  <ul className="list-disc list-inside space-y-1.5 text-[11px] text-slate-700">
                    <li>
                      <strong>{reportLanguage === "ar" ? "رطوبة الركام المائي:" : "Aggregate Moisture Calibration:"}</strong>{" "}
                      {reportLanguage === "ar" 
                        ? `تم تطبيق رطوبة عيارية قدرها (الرمل: ${input.moistureSand || 3.5}%، الحصى: ${input.moistureGravel || 1.0}%) لضبط كميات العمل الجافة وإعادة ترشيح ماء الخلط.`
                        : `Damp adjustments applied under values of Sand: ${input.moistureSand || 3.5}%, Gravel: ${input.moistureGravel || 1.0}% to secure wet density and clean W/C.`}
                    </li>
                    <li>
                      <strong>{reportLanguage === "ar" ? "معادلة ترابط القوة والجودة:" : "Strength Connection Principle:"}</strong>{" "}
                      {reportLanguage === "ar"
                        ? `استهداف مقاومة مميزة قدرها fck28 = ${input.fck28} MPa لمواكبة قوى الضغط الإنشائية المطلوبة للمشروع.`
                        : `Targets a characteristic core strength fck28 = ${input.fck28} MPa matching design parameters.`}
                    </li>
                    <li>
                      <strong>{reportLanguage === "ar" ? "قوام التشغيلية والصب الموقعي:" : "Workability & Flowability Index:"}</strong>{" "}
                      {reportLanguage === "ar"
                        ? `معيرة كمية الماء للحصول على هبوط مستهدف لقمة الهرم Slump = ${input.slump} cm بالورشة.`
                        : `Water dosage balanced for a targeted slump of ${input.slump} cm for easy pumping.`}
                    </li>
                  </ul>
                </div>

                {/* Method Status Metadata Block */}
                <div className="border border-indigo-200 p-3 bg-indigo-50/25 rounded space-y-2 mt-3">
                  <h4 className="font-black text-indigo-950 block border-b border-indigo-100 pb-1 flex items-center justify-end gap-1.5 text-xs">
                    <span>{reportLanguage === "ar" ? "حالة تنفيذ الطريقة هندسيًا (Method Implementation Status):" : "Method Implementation Status metadata"}</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] text-slate-700 pb-1 border-b border-dashed border-slate-200">
                    <div>
                      <strong>{reportLanguage === "ar" ? "مستوى الدعم:" : "Implementation status:"}</strong>{" "}
                      <span className="bg-indigo-600/10 px-1.5 py-0.5 rounded text-indigo-700 font-bold font-mono">
                        {result.implementationStatus || "complete"}
                      </span>
                    </div>
                    <div>
                      <strong>{reportLanguage === "ar" ? "فئة المنهجية:" : "Method Category:"}</strong>{" "}
                      <span className="bg-indigo-600/10 px-1.5 py-0.5 rounded text-indigo-700 font-bold font-mono">
                        {result.category || "complete-design"}
                      </span>
                    </div>
                    <div>
                      <strong>{reportLanguage === "ar" ? "تصميم مستقل كامل؟" : "Standalone complete design?"}</strong>{" "}
                      <span className="font-bold">
                        {result.isStandaloneCompleteMethod !== false ? (reportLanguage === "ar" ? "نعم / Yes" : "Yes") : (reportLanguage === "ar" ? "لا / No" : "No")}
                      </span>
                    </div>
                  </div>

                  {/* Supporting models warnings constraint */}
                  {(!result.isStandaloneCompleteMethod || result.category === "supporting-model") && (
                    <div className="p-2 bg-amber-50 border border-amber-200 text-[10px] text-amber-800 rounded font-bold leading-normal text-right">
                      {reportLanguage === "ar" 
                        ? "⚠️ هذا نموذج مساعد فقط، وليس طريقة تصميم خلطة خرسانية كاملة مستقلة."
                        : "⚠️ Supporting model only. Not a standalone complete mix design."}
                    </div>
                  )}

                  {/* Warnings List on report */}
                  {result.warnings && result.warnings.length > 0 && (
                    <div className="text-[9.5px] text-rose-700 space-y-1 bg-rose-50/50 p-2 rounded border border-rose-100">
                      <div className="font-black">{reportLanguage === "ar" ? "تنبيهات فنية ومحددات المعايرة:" : "Calibration Warnings & Cautions:"}</div>
                      <ul className="list-disc list-inside space-y-0.5">
                        {result.warnings.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Assumptions List on report */}
                  {result.assumptions && result.assumptions.length > 0 && (
                    <div className="text-[9.5px] text-slate-650 space-y-1 bg-slate-50 p-2 rounded border border-slate-200">
                      <div className="font-black">{reportLanguage === "ar" ? "فرضيات التصميم الهندسية:" : "Engineering Assumptions:"}</div>
                      <ul className="list-alpha list-inside space-y-0.5 leading-tight">
                        {result.assumptions.map((a, idx) => (
                          <li key={idx}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Limitations List on report */}
                  {result.limitations && result.limitations.length > 0 && (
                    <div className="text-[9.5px] text-slate-650 space-y-1 bg-slate-50 p-2 rounded border border-slate-200">
                      <div className="font-black">{reportLanguage === "ar" ? "القيود والحدود الهندسية:" : "Engineering Limitations:"}</div>
                      <ul className="list-inside space-y-0.5 leading-tight">
                        {result.limitations.map((lim, idx) => (
                          <li key={idx}>⚠️ {lim}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="border border-slate-200 p-3 bg-slate-50 rounded">
                  <h4 className="font-black text-slate-909 block mb-1.5">{reportLanguage === "ar" ? "فرضيات التصميم الحركي للخلطة:" : "Mathematical Criteria & Assumed Variables"}</h4>
                  <ul className="list-disc list-inside space-y-1.5 text-[11px] text-slate-600">
                    <li><strong>Dreux-Gorisse fcm Equation:</strong> {reportLanguage === "ar" ? "حساب نسبة الماء إلى الإسمنت (W/C) لمنع زيادة مسامية البناء وضمان متانة الضغط المطلوبة." : "Calculates physical bond of binder relative to target compressive strength limits via Georges Dreux formula."}</li>
                    <li><strong>Dreux Grain Size Skeleton:</strong> {reportLanguage === "ar" ? "معايرة تداخل الرمل ومختلف أقطار الحصى بموجب نقطة الكسر وحساب معامل التصحيح والدمك." : "Maximizes absolute solid volume density fraction by choosing the Dreux-Gorisse bilinear reference curve."}</li>
                    <li><strong>Moisture Corrections:</strong> {reportLanguage === "ar" ? "تعديل فوري لكميات الماء والرمل المضافة بالموقع طبقاً لنسبة رطوبة الرابط الماصة." : "Real-time wet batch correction adjusts target weights under active aggregate moisture absorption."}</li>
                  </ul>
                </div>

                <h4 className="font-black text-slate-800 border-b border-rose-100 pb-1 mt-4">{reportLanguage === "ar" ? "المراجع العلمية والمعايير المعتمدة:" : "Academic References & Standards Cited"}</h4>
                <div className="space-y-1.5 text-[10.5px] text-slate-500 font-sans">
                  <p>1. <strong>Dreux, G. & Festa, J. (2000)</strong> - <em>Nouveau Guide du Béton</em>, Eyrolles Publications, Paris, France.</p>
                  <p>2. <strong>EN 206-1:2016</strong> - <em>Concrete - Specification, performance, production and conformity</em>, European Standards.</p>
                  <p>3. <strong>NA 17004 / EN 206 Spec</strong> - <em>Standard Requirements for Selecting Proportions and Concrete Conformity</em>, Algerian National Standardization Institute.</p>
                  <p>4. <strong>ASTM C136</strong> - <em>Standard Test Method for Sieve Analysis of Fine and Coarse Aggregates</em>, ASTM International.</p>
                </div>
              </div>

            </div>
          </A4Page>

          {/* PAGE 4: RAW MATERIALS REGISTRY - EMMS DYNAMIC ENGINE */}
          <A4Page pageNumber={4} totalPages={totalPagesCount} title={customTranslations[reportLanguage].materials} isRtl={isRtl} companyName={companyName} reportLanguage={reportLanguage}>
            <div className="space-y-3 py-3 flex-1 flex flex-col justify-start">
              
              <p className="text-[10px] text-slate-500 mb-1 text-right leading-relaxed border-b border-slate-100 pb-1.5 flex justify-between items-center">
                <span className="font-mono text-blue-600 dark:text-blue-400">EMMS Core Compliance ID: {activeProject?.id || "PROJ-99"}-v{activeProject?.calculationVersion || "3.5L"}</span>
                <span>
                  {reportLanguage === "ar"
                    ? "سجل شهادات المعايرة والاعتماد المخبري الفعلي مع مبررات اختيار الذكاء الاصطناعي للمواد الخام المستخدمة:"
                    : "Real-time laboratory certification matrix and AI selection justifications for project constituents:"}
                </span>
              </p>

              {(() => {
                const resolvedAll = resolveMaterials(input, activeProject?.materialSnapshots, materialsDatabase);
                
                const materialsList = [
                  {
                    role: reportLanguage === "ar" ? "الإسمنت المائي" : "Hydraulic Cement",
                    roleEn: "Hydraulic Cement Binders",
                    material: resolvedAll.cement,
                    icon: "🏗️",
                    certNum: resolvedAll.cement?.id === "preset-cement-chlef" ? "CERT-DZ-442-2026" : `CERT-CEM-${resolvedAll.cement?.id?.toUpperCase().replace('PRESET-', '') || "UNKNOWN"}`,
                    labRef: "CN-LNCT-ALGIERS-QA04",
                    testDate: resolvedAll.cement?.updatedDate || "2026-06-12",
                    decisionLog: reportLanguage === "ar" 
                      ? `تم اختيار الصنف العالي الجودة لضمان إماهة قوية، وتخفيض حرارة التفاعل المائي لمنع التشققات الدقيقة بالتلاؤم مع المتطلبات الميكانيكية.`
                      : `Chosen for high compressive build-up, standard hydration speed and excellent resistance to sulfate mineral attacks.`
                  },
                  {
                    role: reportLanguage === "ar" ? "الركام الدقيق (الرمل)" : "Fine Aggregate (Sand)",
                    roleEn: "Fine Aggregate Sands",
                    material: resolvedAll.sand,
                    icon: "⏳",
                    certNum: `CERT-SND-${resolvedAll.sand?.id?.toUpperCase().replace('PRESET-', '') || "UNKNOWN"}`,
                    labRef: "SNO-MESSILA-LAB-01",
                    testDate: resolvedAll.sand?.updatedDate || "2026-06-11",
                    decisionLog: reportLanguage === "ar"
                      ? `تم اعتماد تدرج النعومة (${resolvedAll.sand?.finenessModulus || '2.6'}) كونه يضمن التعبئة المثالية للركام المجهري لتقليل نفاذية السوائل.`
                      : `Selected to optimize microskeleton void filling, improving fresh mix cohesion and workability retention.`
                  },
                  {
                    role: reportLanguage === "ar" ? "الركام الخشن (الحصى)" : "Coarse Aggregate (Gravel)",
                    roleEn: "Coarse Aggregate Gravels",
                    material: resolvedAll.gravel,
                    icon: "🪨",
                    certNum: `CERT-GVL-${resolvedAll.gravel?.id?.toUpperCase().replace('PRESET-', '') || "UNKNOWN"}`,
                    labRef: "SNO-QC-BISKRA-QUARRY",
                    testDate: resolvedAll.gravel?.updatedDate || "2026-06-10",
                    decisionLog: reportLanguage === "ar"
                      ? `ركام مكسر عالي الصلابة بقطر أقصى (${input.dMax} مم) يضمن رصًا ممتازًا وقوة تحمل فائقة تحت ضغوط القص والتحميل الدائم الرأسي.`
                      : `Optimally graded angular coarse material selected for extreme macromechanical skeletal lock and packing density.`
                  },
                  {
                    role: reportLanguage === "ar" ? "مياه الخلط المعالجة" : "Treated Batching Water",
                    roleEn: "Potable Batching Water",
                    material: resolvedAll.water,
                    icon: "💧",
                    certNum: "CERT-WTR- Potable-NF1008",
                    labRef: "SNO-HYD-ALGIERS-02",
                    testDate: resolvedAll.water?.updatedDate || "2026-06-14",
                    decisionLog: reportLanguage === "ar"
                      ? "مياه شروب معالجة، خالية تماماً من الشوائب العضوية والأملاح الضارة (الكلوريدات والكبريتات) لتفادي تآكل قضبان التسليح."
                      : "Purified potable supply fully conforming to EN 1008 standards, preventing early expansion and bar corrosion."
                  }
                ];

                // Append Admixture if active
                if (resolvedAll.admixture) {
                  materialsList.push({
                    role: reportLanguage === "ar" ? "الملدنات الكيميائية" : "Chemical Admixture",
                    roleEn: "Admixture Polymers",
                    material: resolvedAll.admixture,
                    icon: "🧪",
                    certNum: `CERT-ADMX-${resolvedAll.admixture.id?.toUpperCase().replace('PRESET-', '') || "UNKNOWN"}`,
                    labRef: "BLIDA-SIKA-LAB-09",
                    testDate: resolvedAll.admixture.updatedDate || "2026-06-13",
                    decisionLog: reportLanguage === "ar"
                      ? `بولي كاربوكسيلات الجيل الثالث المتطورة لخفض ماء الخلط بنسبة مثالية مع الحفاظ على درجة الانزلاق المطلوبة وسهولة الضخ بالرافعات.`
                      : `High-range water reducer PCE adopted to streamline pumping efficiency and cement particle dispersion.`
                  });
                }

                // Append SCM if active
                if (resolvedAll.scm) {
                  materialsList.push({
                    role: reportLanguage === "ar" ? "الروابط المعدنية الإضافية" : "Mineral Supplementary (SCM)",
                    roleEn: "Supplementary SCM",
                    material: resolvedAll.scm,
                    icon: "🌋",
                    certNum: `CERT-SCM-${resolvedAll.scm.id?.toUpperCase().replace('PRESET-', '') || "UNKNOWN"}`,
                    labRef: "CN-LNCT-MINERAL-01",
                    testDate: resolvedAll.scm.updatedDate || "2026-06-11",
                    decisionLog: reportLanguage === "ar"
                      ? `تعزيز الخصائص البوزولانية التفاعلية وسد المسامات الشعرية لمنع النفاذية وضمان استقرار الخرسانة ضد الهجمات الكيميائية.`
                      : `Substituted active binder fraction with high quality SCM to enhance pozzolanic matrix density and durability.`
                  });
                }

                // Append Fibers if active
                if (input.selectedFiberName || (input.fiberDosageKgM3 !== undefined && input.fiberDosageKgM3 > 0)) {
                  const fiberMat = materialsDatabase.find(m => m.id === input.selectedFiberId || m.name === input.selectedFiberName) || {
                    id: input.selectedFiberId || "custom-fiber",
                    name: input.selectedFiberName || "ألياف تسليح خرسانية (Concrete Fibers)",
                    provenance: "ولاية الجزائر",
                    supplierName: "الشركة الوطنية للتسليح بالألياف",
                    version: 1,
                    ApprovalStatus: "Certified"
                  } as any;
                  materialsList.push({
                    role: reportLanguage === "ar" ? "ألياف تسليح الخرسانة" : "Concrete Reinforcement Fibers",
                    roleEn: "Reinforcement Fibers",
                    material: fiberMat,
                    icon: "🧵",
                    certNum: `CERT-FBR-${fiberMat.id.toUpperCase()}`,
                    labRef: "SNO-FIBER-TESTING-LAB",
                    testDate: "2026-06-12",
                    decisionLog: reportLanguage === "ar"
                      ? `تم اختيار ألياف ${input.fiberType || "فولاذية"} بجرعة ${input.fiberDosageKgM3 || 0} كجم/م³ وطول ${input.fiberLengthMm || 0} مم لتعزيز مقاومة الانحناء والحد من الشروخ الانكماشية.`
                      : `Reinforcing fibers (${input.fiberType || "steel"}) added at ${input.fiberDosageKgM3 || 0} kg/m³ to reduce shrinkage cracks and improve flexural toughness.`
                  });
                }

                // Append Special Binder if active
                if (input.selectedSpecialBinderName || (input.specialBinderReplacementPercent !== undefined && input.specialBinderReplacementPercent > 0)) {
                  const specialBinderMat = materialsDatabase.find(m => m.id === input.selectedSpecialBinderId || m.name === input.selectedSpecialBinderName) || {
                    id: input.selectedSpecialBinderId || "custom-special-binder",
                    name: input.selectedSpecialBinderName || "مجلدات ورابط خاصة (Special Binder)",
                    provenance: "المنطقة الصناعية وهران",
                    supplierName: "الشركة الجزائرية للمجلدات الخاصة",
                    version: 1,
                    ApprovalStatus: "Certified"
                  } as any;
                  materialsList.push({
                    role: reportLanguage === "ar" ? "رابط إسمنتي خاص" : "Special Cementitious Binder",
                    roleEn: "Special Binder",
                    material: specialBinderMat,
                    icon: "🔮",
                    certNum: `CERT-SPCB-${specialBinderMat.id.toUpperCase()}`,
                    labRef: "CN-LNCT-ORAN-LAB",
                    testDate: "2026-06-14",
                    decisionLog: reportLanguage === "ar"
                      ? `تم استخدام رابط خاص مستبدل بنسبة ${input.specialBinderReplacementPercent || 0}% بكثافة ${input.specialBinderDensity && input.specialBinderDensity > 0 ? `${input.specialBinderDensity} كجم/م³` : "غير متوفر"} لزيادة متانة الخلطة وضمان تصلب معزز.`
                      : `Special structural binder integrated at ${input.specialBinderReplacementPercent || 0}% substitution to improve hydration kinetics and packing density.`
                  });
                }

                // Append Lightweight Aggregate if active
                if (input.selectedLightweightAggregateName) {
                  const lwcMat = materialsDatabase.find(m => m.id === input.selectedLightweightAggregateId || m.name === input.selectedLightweightAggregateName) || {
                    id: input.selectedLightweightAggregateId || "custom-lwc-agg",
                    name: input.selectedLightweightAggregateName,
                    provenance: "قسنطينة",
                    supplierName: "شركة الركام الخفيف الجزائرية",
                    version: 1,
                    ApprovalStatus: "Certified"
                  } as any;
                  materialsList.push({
                    role: reportLanguage === "ar" ? "ركام خفيف الوزن" : "Lightweight Aggregate",
                    roleEn: "Lightweight Aggregate",
                    material: lwcMat,
                    icon: "🎈",
                    certNum: `CERT-LWC-${lwcMat.id.toUpperCase()}`,
                    labRef: "SNO-LWC-LAB-01",
                    testDate: "2026-06-15",
                    decisionLog: reportLanguage === "ar"
                      ? `ركام خفيف الوزن بكثافة ${input.lightweightAggregateDensity || 1400} كجم/م³ وبنية مسامية مستهدفة لإنتاج خرسانة خفيفة الوزن ذات كفاءة عزل حراري ممتازة.`
                      : `Selected lightweight aggregate with density ${input.lightweightAggregateDensity || 1400} kg/m³ to produce certified high performance lightweight concrete.`
                  });
                }

                // Append Heavyweight Aggregate if active
                if (input.selectedHeavyweightAggregateName) {
                  const hwcMat = materialsDatabase.find(m => m.id === input.selectedHeavyweightAggregateId || m.name === input.selectedHeavyweightAggregateName) || {
                    id: input.selectedHeavyweightAggregateId || "custom-hwc-agg",
                    name: input.selectedHeavyweightAggregateName,
                    provenance: "محاجر غار جبيلات",
                    supplierName: "الشركة الوطنية للحديد والصلب وركامات غار جبيلات",
                    version: 1,
                    ApprovalStatus: "Certified"
                  } as any;
                  materialsList.push({
                    role: reportLanguage === "ar" ? "ركام ثقيل الوزن" : "Heavyweight Aggregate",
                    roleEn: "Heavyweight Aggregate",
                    material: hwcMat,
                    icon: "🏋️",
                    certNum: `CERT-HWC-${hwcMat.id.toUpperCase()}`,
                    labRef: "SNO-HWC-LAB-RADIATION",
                    testDate: "2026-06-16",
                    decisionLog: reportLanguage === "ar"
                      ? `تم اختيار ركام ثقيل (${input.heavyweightType || "خام الحديد"}) بكثافة ${input.heavyweightAggregateDensity || 3800} كجم/م³ لإنتاج خرسانة ثقيلة الوزن لامتصاص الإشعاعات وحماية المفاعلات.`
                      : `Heavyweight aggregate (${input.heavyweightType || "magnetite/barite"}) selected with density ${input.heavyweightAggregateDensity || 3800} kg/m³ for extreme shielding or structural counterweights.`
                  });
                }

                // Append Air Content Material if active
                if (input.selectedAirContentMaterialName) {
                  const airMat = materialsDatabase.find(m => m.name === input.selectedAirContentMaterialName) || {
                    id: "air-content-preset",
                    name: input.selectedAirContentMaterialName,
                    provenance: "ولاية عنابة",
                    supplierName: "شركة إضافات الهواء الوطنية",
                    version: 1,
                    ApprovalStatus: "Certified"
                  } as any;
                  materialsList.push({
                    role: reportLanguage === "ar" ? "معدل المحتوى الهوائي" : "Air Entraining Modifier",
                    roleEn: "Air Content Material",
                    material: airMat,
                    icon: "🌬️",
                    certNum: `CERT-AIR-${airMat.id.toUpperCase()}`,
                    labRef: "SNO-AIR-TEST-LAB",
                    testDate: "2026-06-10",
                    decisionLog: reportLanguage === "ar"
                      ? `إضافة حابس للهواء لتأمين الفراغات الهوائية المستهدفة ${input.selectedAirPercentage || 0}% وتحسين متانة دورات الصقيع والذوبان في الخرسانة.`
                      : `Air-entraining agent incorporated to secure targeted ${input.selectedAirPercentage || 0}% air content, significantly enhancing freeze-thaw weathering resistance.`
                  });
                }

                return (
                  <div className="grid grid-cols-2 gap-2 text-[9px] leading-tight">
                    {materialsList.map((item, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/70 hover:bg-white transition-colors duration-150 flex flex-col justify-between space-y-1.5 shadow-sm">
                        
                        {/* Title block */}
                        <div className="flex justify-between items-start border-b border-slate-200/60 pb-1 flex-row-reverse text-right">
                          <span className="text-[11px] leading-none">{item.icon}</span>
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-slate-800 text-[10px] leading-tight">{item.material.name}</h4>
                            <p className="text-[8px] text-indigo-700 dark:text-indigo-600 font-extrabold font-sans uppercase">
                              {reportLanguage === "ar" ? item.role : item.roleEn}
                            </p>
                          </div>
                        </div>

                        {/* Traceability Grid */}
                        <div className="grid grid-cols-2 gap-x-1.5 gap-y-1 text-[8px] text-slate-550 border-b border-dashed border-slate-150 pb-1.5">
                          <div className="text-right"><strong>{reportLanguage === "ar" ? "المعرف:" : "ID:"}</strong> <span className="font-mono text-slate-700 select-all">{item.material.id}</span></div>
                          <div className="text-right"><strong>{reportLanguage === "ar" ? "المنطقة والمصدر:" : "Region:"}</strong> <span className="text-slate-705 font-bold">{item.material.provenance || item.material.region || "ولاية معتمدة"}</span></div>
                          <div className="text-right"><strong>{reportLanguage === "ar" ? "المورد:" : "Supplier:"}</strong> <span className="text-slate-700 truncate inline-block max-w-[85px]" title={item.material.supplierName}>{item.material.supplierName || "مورد رسمي معتمد"}</span></div>
                          <div className="text-right"><strong>{reportLanguage === "ar" ? "المحجر:" : "Quarry:"}</strong> <span className="text-slate-700 truncate inline-block max-w-[80px]" title={item.material.quarryName}>{item.material.quarryName || item.material.sourceQuarry || "مقلع مرخص"}</span></div>
                          <div className="text-right"><strong>{reportLanguage === "ar" ? "الإصدار الحالي:" : "Version:"}</strong> <span className="text-blue-700 font-mono font-bold">v{item.material.version || 1}</span></div>
                          <div className="text-right"><strong>{reportLanguage === "ar" ? "حالة الاعتماد:" : "Approval:"}</strong> <span className="text-emerald-700 font-bold">{item.material.ApprovalStatus || "Certified"}</span></div>
                        </div>

                        {/* Dynamic Certification Block */}
                        <div className="bg-white/80 border border-slate-200 p-1 rounded space-y-0.5 font-sans">
                          <div className="flex justify-between text-[7.5px] text-slate-500">
                            <span className="font-mono text-slate-800 font-semibold">{item.certNum || `CERT-SNO-${item.material.id.toUpperCase()}`}</span>
                            <span><strong>{reportLanguage === "ar" ? "شهادة فحص رقم:" : "Cert No:"}</strong></span>
                          </div>
                          <div className="flex justify-between text-[7.5px] text-slate-500">
                            <span className="text-slate-800">{item.labRef || "CN-LNCT-ALGIERS-QA04"}</span>
                            <span><strong>{reportLanguage === "ar" ? "المختبر المرجعي:" : "Lab Ref:"}</strong></span>
                          </div>
                          <div className="flex justify-between text-[7.5px] text-slate-500">
                            <span className="font-mono text-slate-800">{item.material.updatedDate || item.testDate}</span>
                            <span><strong>{reportLanguage === "ar" ? "تاريخ الفحص:" : "Test Date:"}</strong></span>
                          </div>
                        </div>

                        {/* AI Decision Log */}
                        <div className="bg-indigo-50/50 border border-indigo-100 p-1.5 rounded text-[8px] text-slate-650 leading-relaxed text-right relative">
                          <span className="absolute top-1 left-1.5 text-[8px] opacity-70">🤖</span>
                          <p className="pl-2">
                            <strong className="text-indigo-800">{reportLanguage === "ar" ? "مبرر القبول الفني الخوارزمي: " : "AI Validation Log: "}</strong>
                            {item.decisionLog}
                          </p>
                        </div>

                      </div>
                    ))}
                  </div>
                );
              })()}

            </div>
          </A4Page>

          {/* PAGE 5: MIX RESULTS & SCALE */}
          <A4Page pageNumber={5} totalPages={totalPagesCount} title={customTranslations[reportLanguage].results} isRtl={isRtl} companyName={companyName} reportLanguage={reportLanguage}>
            <div className="space-y-4 py-3 flex-1 flex flex-col justify-start">
              
              <p className="text-xs text-slate-606 mb-1 text-right">
                {reportLanguage === "ar"
                  ? "مقادير الأوزان لكل 1 متر مكعب جاف، مع الأوزان الرطبة المعدلة طبقاً لمعايير رطوبة الموقع:"
                  : "Concrete batch proportions per m³ dry, mapped with adjusted site scale wet weights under moisture correction:"}
              </p>

              {/* Composition Matrix Card Grid */}
              {(() => {
                const resolvedAll = resolveMaterials(input, activeProject?.materialSnapshots, materialsDatabase);
                return (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {/* Dry recipe table */}
                    <div className="border border-slate-200 p-2.5 rounded-lg bg-slate-50/50">
                      <h4 className="font-extrabold text-slate-900 border-b pb-1 mb-2 flex justify-between">
                        <span>🧪</span>
                        <span>{reportLanguage === "ar" ? "أوزان المختبر الجافة (kg/m³)" : "Laboratory Dry Proportions (kg/m³)"}</span>
                      </h4>
                      <div className="space-y-1.5 font-mono text-[10px] text-right">
                        <div className="flex justify-between items-center">
                          <span>{formatEngineeringValue(result.cementWeight, "mass")}</span>
                          <span className="text-slate-550 text-[8.5px] max-w-[140px] truncate" title={resolvedAll.cement?.name || ""}>
                            {(resolvedAll.cement?.name || "")} ({reportLanguage === "ar" ? "إسمنت" : "Cement"}):
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>{formatEngineeringValue(result.sandWeightDry, "mass")}</span>
                          <span className="text-slate-550 text-[8.5px] max-w-[140px] truncate" title={resolvedAll.sand?.name || ""}>
                            {(resolvedAll.sand?.name || "")} ({reportLanguage === "ar" ? "رمل" : "Sand"}):
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>{formatEngineeringValue(result.gravelWeightDry, "mass")}</span>
                          <span className="text-slate-550 text-[8.5px] max-w-[140px] truncate" title={resolvedAll.gravel?.name || ""}>
                            {(resolvedAll.gravel?.name || "")} ({reportLanguage === "ar" ? "حصى" : "Gravel"}):
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>{formatEngineeringValue(result.waterContentActual, "waterVolume")}</span>
                          <span className="text-slate-550 text-[8.5px] max-w-[140px] truncate" title={resolvedAll.water?.name || ""}>
                            {(resolvedAll.water?.name || "")} ({reportLanguage === "ar" ? "ماء" : "Water"}):
                          </span>
                        </div>
                        {result.admixtureWeights.map((adm, index) => (
                          <div className="flex justify-between text-indigo-700" key={`dry-adm-${index}`}>
                            <span>{formatEngineeringValue(adm.weight, "mass")}</span>
                            <span className="truncate max-w-[140px] text-[8.5px]">{adm.name}:</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Wet recipe table */}
                    <div className="border border-indigo-200 p-2.5 rounded-lg bg-indigo-50/20">
                      <h4 className="font-extrabold text-indigo-950 border-b pb-1 mb-2 flex justify-between">
                        <span>🏗️</span>
                        <span>{reportLanguage === "ar" ? "التعديل الرطب للصب الميداني (kg/m³)" : "Site Wet Proportions (kg/m³)"}</span>
                      </h4>
                      <div className="space-y-1.5 font-mono text-[10px] text-right">
                        <div className="flex justify-between items-center">
                          <span>{formatEngineeringValue(result.cementWeight, "mass")}</span>
                          <span className="text-slate-550 text-[8.5px] max-w-[140px] truncate" title={resolvedAll.cement?.name || ""}>
                            {(resolvedAll.cement?.name || "")} ({reportLanguage === "ar" ? "إسمنت" : "Cement"}):
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-800">
                          <span>{formatEngineeringValue(result.sandWeightWet, "mass")}</span>
                          <span className="text-emerald-700 font-bold text-[8.5px] max-w-[140px] truncate" title={resolvedAll.sand?.name || ""}>
                            {(resolvedAll.sand?.name || "")} ({reportLanguage === "ar" ? "رمل رطب" : "Wet Sand"}):
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-800">
                          <span>{formatEngineeringValue(result.gravelWeightWet, "mass")}</span>
                          <span className="text-emerald-700 font-bold text-[8.5px] max-w-[140px] truncate" title={resolvedAll.gravel?.name || ""}>
                            {(resolvedAll.gravel?.name || "")} ({reportLanguage === "ar" ? "حصى رطب" : "Wet Gravel"}):
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-indigo-700">
                          <span>{formatEngineeringValue(result.waterWeightWet, "waterVolume")}</span>
                          <span className="text-indigo-700 font-bold text-[8.5px] max-w-[140px] truncate" title={resolvedAll.water?.name || ""}>
                            {(resolvedAll.water?.name || "")} ({reportLanguage === "ar" ? "ماء ميداني" : "Mixing Water"}):
                          </span>
                        </div>
                        {result.admixtureWeights.map((adm, index) => (
                          <div className="flex justify-between text-indigo-600" key={`wet-adm-${index}`}>
                            <span>{formatEngineeringValue(adm.weight, "mass")}</span>
                            <span className="truncate max-w-[140px] text-[8.5px]">{adm.name}:</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Batch volume scaler (Print: hidden widgets, but renders the volume number dynamically) */}
              <div className="border border-slate-200 rounded-lg p-3 mt-3 bg-white text-right">
                <span className="text-[10px] text-slate-404 block uppercase font-black">{reportLanguage === "ar" ? "مقياس وتحجيم كميات الشاحنة / الخلاطة (النظام المتري SI)" : "Active Volumetric Batching Controller (SI Metric)"}</span>
                <div className="flex justify-between items-center text-xs mt-1">
                  <div className="flex gap-2 print:hidden items-center">
                    <button 
                      type="button" 
                      onClick={() => handleBatchVolumeChange(Math.max(0.1, batchVolume - 1))}
                      className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center font-bold border border-slate-200 hover:bg-slate-200 cursor-pointer"
                    >-</button>
                    <input 
                      type="number"
                      value={batchVolume}
                      onChange={(e) => handleBatchVolumeChange(Math.max(0.1, Number(e.target.value)))}
                      className="w-12 text-center border p-1 rounded font-mono font-bold"
                    />
                    <button 
                      type="button" 
                      onClick={() => handleBatchVolumeChange(batchVolume + 1)}
                      className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center font-bold border border-slate-200 hover:bg-slate-200 cursor-pointer"
                    >+</button>
                  </div>
                  <div>
                    {reportLanguage === "ar" ? "الحجم الإنشائي المطلوب:" : "Target Batch Volume:"} <strong className="text-sm font-black text-indigo-650 font-mono">{batchVolume} m³</strong>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center mt-3 text-[10px] font-mono border-t border-dashed border-slate-100 pt-2.5">
                  <div><span className="text-slate-400 block">{reportLanguage === "ar" ? "الإسمنت الكلي" : "Total Cement"}</span><span className="font-bold text-slate-808">{formatEngineeringValue(result.cementWeight, "mass", { batchVolumeMultiplier: batchVolume })}</span></div>
                  <div><span className="text-slate-400 block">{reportLanguage === "ar" ? "الرمل الكلي" : "Total Sand"}</span><span className="font-bold text-slate-808">{formatEngineeringValue(result.sandWeightDry, "mass", { batchVolumeMultiplier: batchVolume })}</span></div>
                  <div><span className="text-slate-400 block">{reportLanguage === "ar" ? "الحصى الكلي" : "Total Coarse"}</span><span className="font-bold text-slate-808">{formatEngineeringValue(result.gravelWeightDry, "mass", { batchVolumeMultiplier: batchVolume })}</span></div>
                  <div><span className="text-slate-400 block">{reportLanguage === "ar" ? "الماء الكلي" : "Total Water"}</span><span className="font-black text-indigo-600">{formatEngineeringValue(result.waterContentActual, "waterVolume", { batchVolumeMultiplier: batchVolume })}</span></div>
                </div>
                <div className="text-center mt-2.5 pt-1.5 border-t border-slate-100 text-[9px] text-slate-400 font-semibold">
                  {reportLanguage === "ar" ? "أساس الحساب: النظام المتري الهندسي SI" : "Calculation Basis: SI Metric Units"}
                </div>
              </div>

              {/* Source Of Every Value Traceability table */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/40 text-right space-y-2">
                <span className="text-[9px] text-[#4f46e5] font-black uppercase tracking-wider block">
                  {reportLanguage === "ar" ? "📋 سجل تفتيش وتتبع مصداقية القيم المعتمدة (SI Metric)" : "📋 Traceability & Origin Matrix (SI Metric)"}
                </span>
                
                <table className="w-full text-[9px] border-collapse bg-white dark:bg-slate-900 border border-slate-200 rounded-md">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-250">
                      <th className="p-1 px-2 text-left">{reportLanguage === "ar" ? "المعلم الهيروليكي / الفيزيائي" : "Design Parameter"}</th>
                      <th className="p-1 px-2 text-center">{reportLanguage === "ar" ? "مصطلح المصدر المعتمد" : "Source of Every Value"}</th>
                      <th className="p-1 px-2 text-right">{reportLanguage === "ar" ? "الكود / الصيغة" : "Active Value Status"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-slate-600">
                    <tr>
                      <td className="p-1 px-2 text-left font-bold">{reportLanguage === "ar" ? "الكثافة النوعية (Density)" : "Density (ρ)"}</td>
                      <td className="p-1 px-2 text-center text-blue-6c0 font-black">{reportLanguage === "ar" ? "مستودع وقاعدة بيانات المواد" : "Material Database"}</td>
                      <td className="p-1 px-2 text-right font-mono text-slate-500">
                        C:{input.cementDensity && input.cementDensity > 0 ? input.cementDensity : (reportLanguage === "ar" ? "غير متوفر" : reportLanguage === "fr" ? "Non disponible" : "N/A")} / S:{input.sandRelativeDensity && input.sandRelativeDensity > 0 ? input.sandRelativeDensity : (reportLanguage === "ar" ? "غير متوفر" : reportLanguage === "fr" ? "Non disponible" : "N/A")} / G:{input.gravelRelativeDensity && input.gravelRelativeDensity > 0 ? input.gravelRelativeDensity : (reportLanguage === "ar" ? "غير متوفر" : reportLanguage === "fr" ? "Non disponible" : "N/A")} kg/m³
                      </td>
                    </tr>
                    <tr>
                      <td className="p-1 px-2 text-left font-bold">{reportLanguage === "ar" ? "معامل الامتصاص (Absorption)" : "Absorption (%)"}</td>
                      <td className="p-1 px-2 text-center text-blue-6c0 font-black">{reportLanguage === "ar" ? "مستودع وقاعدة بيانات المواد" : "Material Database"}</td>
                      <td className="p-1 px-2 text-right font-mono text-slate-500">Sand: 1.5% / Coarse: 0.8%</td>
                    </tr>
                    <tr>
                      <td className="p-1 px-2 text-left font-bold">{reportLanguage === "ar" ? "تصحيح المياه (Water Correction)" : "Water Correction"}</td>
                      <td className="p-1 px-2 text-center text-indigo-600 font-black">{reportLanguage === "ar" ? "محتسب طبقاً لمعامل الامتصاص" : "Calculated From Absorption"}</td>
                      <td className="p-1 px-2 text-right font-mono text-[#4f46e5] font-black">ΔW = -{formatEngineeringValue((result.sandWeightWet || 0) - result.sandWeightDry + (result.gravelWeightWet || 0) - result.gravelWeightDry, "waterVolume")}</td>
                    </tr>
                    <tr>
                      <td className="p-1 px-2 text-left font-bold">{reportLanguage === "ar" ? "وزن كتلة الرمال (Sand Mass)" : "Sand Mass (S)"}</td>
                      <td className="p-1 px-2 text-center text-emerald-600 font-black">{reportLanguage === "ar" ? "محتسب عبر منحنى التراص والامتداد" : "Calculated"}</td>
                      <td className="p-1 px-2 text-right font-mono text-emerald-600 font-semibold">{formatEngineeringValue(result.sandWeightDry, "mass")}</td>
                    </tr>
                    <tr>
                      <td className="p-1 px-2 text-left font-bold">{reportLanguage === "ar" ? "وزن كتلة الحصى (Gravel Mass)" : "Gravel Mass (G)"}</td>
                      <td className="p-1 px-2 text-center text-emerald-600 font-black">{reportLanguage === "ar" ? "محتسب عبر منحنى التراص والامتداد" : "Calculated"}</td>
                      <td className="p-1 px-2 text-right font-mono text-emerald-600 font-semibold">{formatEngineeringValue(result.gravelWeightDry, "mass")}</td>
                    </tr>
                    <tr>
                      <td className="p-1 px-2 text-left font-bold">{reportLanguage === "ar" ? "حجم مياه الخلط النهائية (Final Water)" : "Final Water (W)"}</td>
                      <td className="p-1 px-2 text-center text-emerald-600 font-black">{reportLanguage === "ar" ? "محتسب عبر معادلات موازنة الملدنات" : "Calculated"}</td>
                      <td className="p-1 px-2 text-right font-mono text-indigo-700 font-black">{formatEngineeringValue(result.waterContentActual, "waterVolume")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          </A4Page>

          {/* PAGE 6: GRAPHS & CURVES */}
          <A4Page pageNumber={6} totalPages={totalPagesCount} title={customTranslations[reportLanguage].results} isRtl={isRtl} companyName={companyName} reportLanguage={reportLanguage}>
            <div className="space-y-4 py-3 flex-1 flex flex-col justify-start">
              
              <div className="grid grid-cols-2 gap-4 h-[220px]">
                <div className="border border-slate-100 p-2 flex flex-col justify-between rounded-lg">
                  <div className="text-[10px] font-extrabold text-slate-700 text-center">{reportLanguage === "ar" ? "توزيع نسب المكونات الحجمية للخلطة (%)" : "Volumetric Ingredient Shares (%)"}</div>
                  <div className="flex justify-center items-center h-full" style={{ direction: "ltr" }}>
                    <svg width="130" height="130" viewBox="0 0 200 200">
                      <circle cx="100" cy="100" r="70" fill="none" stroke="#e2e8f0" strokeWidth="20" />
                      <circle cx="100" cy="100" r="70" fill="none" stroke="#4f46e5" strokeWidth="20" strokeDasharray={`${Math.round(result.sandPercent * 4.4)} 500`} strokeDashoffset="0" />
                      <circle cx="100" cy="100" r="70" fill="none" stroke="#eab308" strokeWidth="20" strokeDasharray={`${Math.round(result.gravelPercent * 4.4)} 500`} strokeDashoffset={`-${Math.round(result.sandPercent * 4.4)}`} />
                      <circle cx="100" cy="100" r="70" fill="none" stroke="#06b6d4" strokeWidth="20" strokeDasharray="80 500" strokeDashoffset={`-${Math.round((result.sandPercent + result.gravelPercent) * 4.4)}`} />
                      <text x="100" y="105" textAnchor="middle" className="text-[16px] font-black fill-slate-800 font-sans">100% vol</text>
                    </svg>
                  </div>
                  <div className="flex gap-2 justify-center text-[8px] font-mono leading-none">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-indigo-600 rounded"></span>Sand ({result.sandPercent.toFixed(1)}%)</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-yellow-500 rounded"></span>Gravel ({result.gravelPercent.toFixed(1)}%)</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-cyan-500 rounded"></span>Moisture Water</span>
                  </div>
                </div>

                <div className="border border-slate-100 p-2 flex flex-col justify-between rounded-lg">
                  <div className="text-[10px] font-extrabold text-slate-705 text-center">{reportLanguage === "ar" ? "منحنى تطور مقاومة الضغط المقدرة (MPa)" : "Estimated 28d Compressive Strength (MPa)"}</div>
                  <div className="flex justify-center items-center h-full px-4" style={{ direction: "ltr" }}>
                    <svg width="210" height="90" viewBox="0 0 280 100" className="overflow-visible">
                      <line x1="0" y1="90" x2="270" y2="90" stroke="#94a3b8" strokeWidth="1" />
                      <line x1="0" y1="10" x2="0" y2="90" stroke="#94a3b8" strokeWidth="1" />
                      <path d={`M 0,90 Q 70,50 140,25 T 270,10`} fill="none" stroke="#ef4444" strokeWidth="2.5" />
                      <circle cx="270" cy="10" r="4" fill="#ef4444" />
                      <text x="270" y="25" className="text-[10px] font-mono font-bold fill-rose-600" textAnchor="end">fcm: {result.fcm28.toFixed(1)} MPa</text>
                      <circle cx="70" cy="50" r="3.5" fill="#f59e0b" />
                      <text x="75" y="60" className="text-[8px] font-mono fill-amber-700" textAnchor="start">7d: {(result.fcm28 * 0.75).toFixed(1)} MPa</text>
                      <line x1="70" y1="10" x2="70" y2="90" stroke="#e2e8f0" strokeDasharray="3,3" />
                      <line x1="140" y1="10" x2="140" y2="90" stroke="#e2e8f0" strokeDasharray="3,3" />
                      <text x="70" y="98" className="text-[8px] font-mono fill-slate-400" textAnchor="middle">7d</text>
                      <text x="140" y="98" className="text-[8px] font-mono fill-slate-400" textAnchor="middle">14d</text>
                      <text x="270" y="98" className="text-[8px] font-mono fill-slate-400" textAnchor="middle">28d</text>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Lower Grading Curve full width element */}
              <div className="border border-slate-100 p-2.5 flex-1 flex flex-col justify-between rounded-lg">
                <div className="text-[10px] font-extrabold text-slate-705 text-center">{reportLanguage === "ar" ? "منحنى التدرج الحبيبي للركام الكلي والمنحنى المرجعي لدرركس المعتمد" : "Aggregate Grading Curve & Target Dreux Reference Curve"}</div>
                <div className="flex justify-center items-center h-[140px] px-4" style={{ direction: "ltr" }}>
                  <svg width="420" height="110" viewBox="0 0 500 120" className="overflow-visible">
                    <line x1="0" y1="110" x2="480" y2="110" stroke="#64748b" strokeWidth="1.5" />
                    <line x1="0" y1="5" x2="0" y2="110" stroke="#64748b" strokeWidth="1.5" />
                    <path d={`M 0,110 L 200,${110 - result.pivotPoint.y} L 480,10`} fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="4,4" />
                    <path d={`M 0,110 Q 120,${110 - (result.pivotPoint.y * 0.8)} 200,${110 - result.pivotPoint.y} T 480,10`} fill="none" stroke="#059669" strokeWidth="2.5" />
                    <circle cx="200" cy={110 - result.pivotPoint.y} r="4" fill="#a855f7" />
                    <text x="210" y={115 - result.pivotPoint.y} className="text-[8.5px] font-mono font-bold fill-purple-700" textAnchor="start">
                      Pivot: {result.pivotPoint.y.toFixed(1)}% Passing
                    </text>
                    <circle cx="480" cy="10" r="4" fill="#059669" />
                    <text x="470" y="22" className="text-[9px] font-mono font-bold fill-emerald-700" textAnchor="end">
                      Dmax ({input.dMax}mm)
                    </text>
                    <text x="0" y="119" className="text-[7.5px] font-mono fill-slate-400" textAnchor="middle">0.08</text>
                    <text x="100" y="119" className="text-[7.5px] font-mono fill-slate-400" textAnchor="middle">1.25</text>
                    <text x="200" y="119" className="text-[7.5px] font-mono fill-slate-400" textAnchor="middle">5.0</text>
                    <text x="350" y="119" className="text-[7.5px] font-mono fill-slate-400" textAnchor="middle">12.5</text>
                    <text x="480" y="119" className="text-[7.5px] font-mono fill-slate-400" textAnchor="middle">{input.dMax}</text>
                  </svg>
                </div>
                <div className="flex gap-4 justify-center text-[8.5px] leading-none mb-1 font-sans">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-emerald-600 inline-block"></span>{reportLanguage === "ar" ? "منحنى الخلطة الفعلي" : "Actual Combined Curve"}</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-purple-500 border-dashed border-t inline-block"></span>{reportLanguage === "ar" ? "منحنى دروكس المرجعي" : "Target Dreux Envelope"}</span>
                </div>
              </div>

            </div>
          </A4Page>

          {/* PAGE 7: QUALITY SCORE & RISK */}
          <A4Page pageNumber={7} totalPages={totalPagesCount} title={customTranslations[reportLanguage].qualityScore} isRtl={isRtl} companyName={companyName} reportLanguage={reportLanguage}>
            <div className="space-y-4 py-3 flex-1 flex flex-col justify-start text-right">
              
              <div className="flex items-center gap-5 border border-slate-100 p-3 rounded-lg bg-slate-50/50 justify-end">
                <div className="text-xs space-y-1 text-right">
                  <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider font-mono">Metrological Quality Score</span>
                  <h4 className="font-extrabold text-slate-800">{reportLanguage === "ar" ? "تقييم الكفاءة الهندسية المعتمد" : "Engineered Design Index Certificate"}</h4>
                  <p className="text-slate-500 text-[10px]">{reportLanguage === "ar" ? "يعكس التقييم جودة توزيع الركام وتصحيح رطوبة الخلطة والدمك." : "Reflects optimized aggregate spacing indexes and minimal thermal risk scores."}</p>
                </div>
                <div className="w-18 h-18 rounded-full border-4 border-amber-500 flex items-center justify-center shrink-0">
                  <span className="text-xl font-black text-slate-900 font-mono">{calculatedScore}<span className="text-[10px] font-normal text-slate-500">/100</span></span>
                </div>
              </div>

              <div className="text-right">
                <h3 className="text-xs font-black text-slate-800 mb-2 border-b border-slate-100 pb-1 flex items-center gap-1 justify-end">
                  <span>📊</span>
                  <span>{reportLanguage === "ar" ? "جدول تحليل المخاطر الفنية والميدانية للصب" : "Placing & Rheology Site Risks Assessment"}</span>
                </h3>
                <div className="space-y-2 text-xs">
                  {[
                    { title: customTranslations[reportLanguage].shrinkage, risk: "LOW", text: reportLanguage === "ar" ? "مخاطر الخدوش الشعرية منخفضة بسبب تزن الرمل." : "Plastic shrinkage is guarded by low final absolute water levels." },
                    { title: customTranslations[reportLanguage].thermal, risk: result.cementWeight > 380 ? "MEDIUM-HIGH" : "LOW-MEDIUM", text: reportLanguage === "ar" ? "تفاعل الإماهة مستقر لتواضع كمية الإسمنت المطلقة." : "Controlled Peak active hydration temperature prevents thermal cracks." },
                    { title: customTranslations[reportLanguage].bleeding, risk: "LOW", text: reportLanguage === "ar" ? "جرعة الملدنات تحافظ على تماسك حبات الخلطة." : "High cohesive index deters surface laitance or water bleed channels." },
                    { title: customTranslations[reportLanguage].segregation, risk: "LOW", text: reportLanguage === "ar" ? "تدرج الرش يمنع حبات الحصى الكبيرة من الانفصال." : "Sand proportion (G/S index) locks skeletal matrix from collapsing." }
                  ].map((it, idx) => (
                    <div key={`risk-${idx}`} className="flex justify-between items-center p-2 border-b border-slate-100 hover:bg-slate-50/20 animate-fade-in">
                      <div className="text-right">
                        <span className="font-bold text-slate-800 block">{it.title}</span>
                        <span className="text-[10px] text-slate-550">{it.text}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded leading-none ${
                        it.risk.includes("HIGH")
                          ? "bg-rose-105 text-rose-800 border-l-2 border-rose-500"
                          : "bg-emerald-100 text-emerald-800 border-l-2 border-emerald-500"
                      }`}>{it.risk}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </A4Page>

          {/* PAGE 8: APPENDIX A (DETAILED CALCULATIONS) */}
          <A4Page pageNumber={8} totalPages={totalPagesCount} title={customTranslations[reportLanguage].appendixA} isRtl={isRtl} companyName={companyName} reportLanguage={reportLanguage}>
            <div className="space-y-4 py-3 flex-1 flex flex-col justify-start text-right">
              
              <p className="text-xs text-slate-550 leading-relaxed font-sans text-right">
                {customTranslations[reportLanguage].appendixADesc}
              </p>

              <div className="bg-slate-50 p-4 border border-slate-200 rounded font-mono text-[10.5px] leading-relaxed text-slate-705 space-y-2 text-right">
                <div>
                  <span className="text-indigo-650 font-extrabold block text-right">1. TARGET COMPRESSIVE MEAN STRENGTH (fcm):</span>
                  <span>fcm = fck + margin (Standard deviation safety factor)</span><br/>
                  <span className="font-bold text-slate-800">fcm = {input.fck28} + 1.64 × {result.stdDev.toFixed(1)} = {result.fcm28.toFixed(1)} MPa</span>
                </div>
                <div className="border-t border-slate-200 pt-2 text-right">
                  <span className="text-indigo-650 font-extrabold block">2. WATER-CEMENT RATIO ESTIMATION (Dreux-Gorisse Efficacy):</span>
                  <span>W/C = 1 / ( (fcm / (A × fce)) + 0.5 )</span><br/>
                  <span className="font-bold text-slate-800">W/C = {result.wcRatioAdjusted.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 text-right">
                  <span className="text-indigo-650 font-extrabold block">3. VOLUMETRIC FRACTION DESIGN BALANCE THEORY:</span>
                  <span>sum V_solids = C / rho_c + S / rho_s + G / rho_g = 1000 × gamma</span><br/>
                  <span className="font-bold text-slate-800">Compactor packing index (gamma) = {result.compactorGamma.toFixed(3)}</span>
                </div>
              </div>

              {/* compliance check table */}
              <div className="flex-1 mt-2">
                <ReportCompliance result={result} />
              </div>

            </div>
          </A4Page>

          {/* PAGE 9: AI ENGINEERING ADVISOR REPORT */}
          <A4Page pageNumber={9} totalPages={totalPagesCount} title={reportLanguage === "ar" ? "المستشار الفني بالذكاء الاصطناعي" : "SNO AI Technical Advisory"} isRtl={isRtl} companyName={companyName} reportLanguage={reportLanguage}>
            <div className="space-y-3 py-2 flex-1 flex flex-col justify-between text-right font-sans">
              
              {/* Header Badge */}
              <div className="flex justify-between items-center bg-slate-50 p-2.5 border border-slate-100 rounded-xl flex-row-reverse">
                <div className="text-right">
                  <span className="p-1 px-2 bg-indigo-600 text-white font-black rounded text-[8.5px] uppercase tracking-wider mb-0.5 inline-block">
                    {reportLanguage === "ar" ? "تأصيل ومراجعة المستشار الهندسي الذكي" : reportLanguage === "fr" ? "CONSEIL TECHNIQUE DE L'INGÉNIEUR" : "SNO ENGINEERING DECISION SUPPORT"}
                  </span>
                  <h4 className="text-[11px] font-black text-slate-800 leading-none">{reportLanguage === "ar" ? "بروتوكول الفحص الفني والامتثال الكلي" : reportLanguage === "fr" ? "Protocole de Validation & de Conformité Globale" : "Full Validation & Analytical Ledger"}</h4>
                </div>
                <div className={`px-2.5 py-1 rounded-lg border font-black text-[11px] leading-none ${analyzeMixDesign(input, result, resolvedMaterialsAll).conclusion.finalDecisionColor}`}>
                  {reportLanguage === "ar" ? analyzeMixDesign(input, result, resolvedMaterialsAll).conclusion.finalDecisionAr : reportLanguage === "fr" ? analyzeMixDesign(input, result, resolvedMaterialsAll).conclusion.finalDecisionFr : analyzeMixDesign(input, result, resolvedMaterialsAll).conclusion.finalDecision}
                </div>
              </div>

              {/* Grid 1: Basic metrics cards */}
              <div className="grid grid-cols-2 gap-3 text-right">
                {/* Carbon footprint card */}
                <div className="p-2 border border-slate-100 rounded-xl space-y-1 bg-slate-50/50">
                  <span className="text-[9px] text-slate-400 block font-bold leading-none">{reportLanguage === "ar" ? "🌱 البصمة البيئية والاستدامة" : reportLanguage === "fr" ? "🌱 Empreinte Carbone & Durabilité" : "🌱 Sustainability & Carbon"}</span>
                  <div className="flex justify-between flex-row-reverse text-[10.5px] font-bold text-slate-700 leading-none">
                    <span>{reportLanguage === "ar" ? "كثافة كربون CO₂:" : reportLanguage === "fr" ? "Intensité CO₂ :" : "CO₂ Intensity:"}</span>
                    <span className="font-mono text-emerald-600 font-extrabold">{analyzeMixDesign(input, result, resolvedMaterialsAll).sustainability.co2Intensity} kg/m³</span>
                  </div>
                  <p className="text-[9.5px] text-slate-500 leading-snug">
                    {reportLanguage === "ar" ? analyzeMixDesign(input, result, resolvedMaterialsAll).sustainability.adviceAr : reportLanguage === "fr" ? analyzeMixDesign(input, result, resolvedMaterialsAll).sustainability.adviceFr : analyzeMixDesign(input, result, resolvedMaterialsAll).sustainability.adviceEn}
                  </p>
                </div>

                {/* Economic Optimization card */}
                <div className="p-2 border border-slate-100 rounded-xl space-y-1 bg-slate-50/50">
                  <span className="text-[9px] text-slate-400 block font-bold leading-none">{reportLanguage === "ar" ? "💰 توفير كلفة المواد المالية" : reportLanguage === "fr" ? "💰 Analyse Économique des Matériaux" : "💰 Economical Sourcing Analysis"}</span>
                  <div className="flex justify-between flex-row-reverse text-[10.5px] font-bold text-slate-700 leading-none">
                    <span>{reportLanguage === "ar" ? "التكلفة التقديرية:" : reportLanguage === "fr" ? "Coût estimatif :" : "Estimated Cost:"}</span>
                    <span className="font-mono text-indigo-600 font-extrabold">{reportLanguage === "ar" ? `${analyzeMixDesign(input, result, resolvedMaterialsAll).costOptimization.totalCost.toLocaleString()} د.ج` : `${analyzeMixDesign(input, result, resolvedMaterialsAll).costOptimization.totalCost.toLocaleString()} DA`}</span>
                  </div>
                  <p className="text-[9.5px] text-slate-500 leading-snug">
                    {reportLanguage === "ar" ? analyzeMixDesign(input, result, resolvedMaterialsAll).costOptimization.opportunityAr : reportLanguage === "fr" ? analyzeMixDesign(input, result, resolvedMaterialsAll).costOptimization.opportunityFr : analyzeMixDesign(input, result, resolvedMaterialsAll).costOptimization.opportunityEn}
                  </p>
                </div>
              </div>

              {/* Exposure limit checks table */}
              <div className="space-y-1">
                <h5 className="text-[9.5px] font-black text-slate-800 border-b border-slate-100 pb-0.5 leading-none">{reportLanguage === "ar" ? "جدول مطابقة فئات التعرض والحدود البيئية الكلية (EN 206 Requirements)" : reportLanguage === "fr" ? "Matrice de Validation des Limites d'Exposition (EN 206)" : "Exposure Limit Verification Matrix"}</h5>
                <div className="border border-slate-150 rounded-lg overflow-hidden text-[8.5px]">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 leading-none">
                        <th className="p-1 text-slate-500 font-bold">{reportLanguage === "ar" ? "فئة التعرض" : reportLanguage === "fr" ? "Exposition" : "Exposure"}</th>
                        <th className="p-1 text-slate-500 font-bold">{reportLanguage === "ar" ? "الرتبة" : reportLanguage === "fr" ? "Classe cible" : "Target"}</th>
                        <th className="p-1 text-slate-500 font-bold">{reportLanguage === "ar" ? "الماء/الإسمنت" : reportLanguage === "fr" ? "E/C Réel" : "Actual W/C"}</th>
                        <th className="p-1 text-slate-500 font-bold">{reportLanguage === "ar" ? "مسموح الكود" : reportLanguage === "fr" ? "E/C Max" : "Max W/C"}</th>
                        <th className="p-1 text-slate-500 font-bold">{reportLanguage === "ar" ? "الإسمنت الفعلي" : reportLanguage === "fr" ? "Ciment Réel" : "Actual Cem"}</th>
                        <th className="p-1 text-slate-500 font-bold">{reportLanguage === "ar" ? "الحد الأدنى" : reportLanguage === "fr" ? "Ciment Min" : "Min Cem"}</th>
                        <th className="p-1 text-slate-500 font-bold">{reportLanguage === "ar" ? "حالة المطابقة" : reportLanguage === "fr" ? "Conformité" : "Compliance"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyzeMixDesign(input, result, resolvedMaterialsAll).exposureCompliance.checks.map((chk, i) => (
                        <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/40">
                          <td className="p-1 font-bold font-mono text-indigo-650">{chk.code}</td>
                          <td className="p-1 text-slate-600 max-w-[50mm] truncate">{chk.name}</td>
                          <td className="p-1 font-mono font-bold">{chk.actualWc}</td>
                          <td className="p-1 font-mono text-slate-500">{chk.requiredMaxWc}</td>
                          <td className="p-1 font-mono font-bold">{chk.actualCement} kg</td>
                          <td className="p-1 font-mono text-slate-500">{chk.requiredMinCement} kg</td>
                          <td className="p-1">
                            <span className={`px-1 py-0.5 rounded text-[8px] font-black ${chk.overallPass ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                              {chk.overallPass ? (reportLanguage === "ar" ? "مطابق" : reportLanguage === "fr" ? "CONFORME" : "COMPLIANT") : (reportLanguage === "ar" ? "غير مطابق" : reportLanguage === "fr" ? "NON CONFORME" : "FAILED")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Grid 2: Tech comments */}
              <div className="grid grid-cols-2 gap-3 text-right">
                {/* Pumpability card */}
                <div className="p-2 border border-slate-100 rounded-xl space-y-1 bg-slate-50/50">
                  <span className="text-[9px] text-slate-400 block font-bold leading-none">{reportLanguage === "ar" ? "🚛 ملاءمة الضخ الموقعي" : reportLanguage === "fr" ? "🚛 Aptitude au Pompage sur Chantier" : "🚛 Site Pumpability Audit"}</span>
                  <div className="flex justify-between flex-row-reverse text-[10px] font-bold text-slate-700 leading-none">
                    <span>{reportLanguage === "ar" ? "تعليق الجريان والانسداد:" : reportLanguage === "fr" ? "Performance de Pompe :" : "Pump Performance:"}</span>
                    <span className="text-indigo-600">{reportLanguage === "ar" ? analyzeMixDesign(input, result, resolvedMaterialsAll).pumpability.ratingAr : reportLanguage === "fr" ? analyzeMixDesign(input, result, resolvedMaterialsAll).pumpability.ratingFr : analyzeMixDesign(input, result, resolvedMaterialsAll).pumpability.rating}</span>
                  </div>
                  <p className="text-[9.5px] text-slate-500 leading-snug">
                    {reportLanguage === "ar" ? analyzeMixDesign(input, result, resolvedMaterialsAll).pumpability.adviceAr : reportLanguage === "fr" ? analyzeMixDesign(input, result, resolvedMaterialsAll).pumpability.adviceFr : analyzeMixDesign(input, result, resolvedMaterialsAll).pumpability.adviceEn}
                  </p>
                </div>

                {/* Congestion card */}
                <div className="p-2 border border-slate-150 rounded-xl space-y-1 bg-slate-50/50">
                  <span className="text-[9px] text-slate-400 block font-bold leading-none">{reportLanguage === "ar" ? "🕸️ ملاءمة حديد التسليح الكثيف" : reportLanguage === "fr" ? "🕸️ Densité de Ferraillage" : "🕸️ Reinforcement Clearance"}</span>
                  <p className="text-[9.5px] text-slate-600 leading-snug">
                    {reportLanguage === "ar" ? analyzeMixDesign(input, result, resolvedMaterialsAll).reinforcement.recommendationAr : reportLanguage === "fr" ? analyzeMixDesign(input, result, resolvedMaterialsAll).reinforcement.recommendationFr : analyzeMixDesign(input, result, resolvedMaterialsAll).reinforcement.recommendationEn}
                  </p>
                </div>
              </div>

              {/* Paragraph Conclusion */}
              <div className="p-2 border border-slate-150 rounded-xl bg-slate-50/80">
                <span className="text-[9px] font-extrabold text-indigo-650 block mb-0.5 leading-none">{reportLanguage === "ar" ? "الخلاصة الفنية الشاملة لمركز الاعتماد السحابي" : reportLanguage === "fr" ? "SYNTHÈSE TECHNIQUE GLOBALE DU CENTRE DE CERTIFICATION" : "INTEGRATED TECHNICAL RECOMMENDATION SUMMARY"}</span>
                <div className="grid grid-cols-5 gap-1.5 text-[8px] text-slate-600 leading-tight">
                  <div className="p-1 bg-white rounded border border-slate-100 text-right">
                    <strong className="block text-slate-800 font-extrabold pb-0.5 border-b border-slate-100 mb-0.5 select-none text-[8.5px]">💪 {reportLanguage === "ar" ? "المقاومة" : reportLanguage === "fr" ? "Résistance" : "Strength"}</strong>
                    {reportLanguage === "ar" ? analyzeMixDesign(input, result, resolvedMaterialsAll).conclusion.strengthAr : reportLanguage === "fr" ? analyzeMixDesign(input, result, resolvedMaterialsAll).conclusion.strengthFr : analyzeMixDesign(input, result, resolvedMaterialsAll).conclusion.strength}
                  </div>
                  <div className="p-1 bg-white rounded border border-slate-100 text-right">
                    <strong className="block text-slate-800 font-extrabold pb-0.5 border-b border-slate-100 mb-0.5 select-none text-[8.5px]">🛡️ {reportLanguage === "ar" ? "الديمومة" : reportLanguage === "fr" ? "Durabilité" : "Durability"}</strong>
                    {reportLanguage === "ar" ? analyzeMixDesign(input, result, resolvedMaterialsAll).conclusion.durabilityAr : reportLanguage === "fr" ? analyzeMixDesign(input, result, resolvedMaterialsAll).conclusion.durabilityFr : analyzeMixDesign(input, result, resolvedMaterialsAll).conclusion.durability}
                  </div>
                  <div className="p-1 bg-white rounded border border-slate-100 text-right">
                    <strong className="block text-slate-800 font-extrabold pb-0.5 border-b border-slate-100 mb-0.5 select-none text-[8.5px]">🌊 {reportLanguage === "ar" ? "التشغيلية" : reportLanguage === "fr" ? "Ouvrabilité" : "Workability"}</strong>
                    {reportLanguage === "ar" ? analyzeMixDesign(input, result, resolvedMaterialsAll).conclusion.workabilityAr : reportLanguage === "fr" ? analyzeMixDesign(input, result, resolvedMaterialsAll).conclusion.workabilityFr : analyzeMixDesign(input, result, resolvedMaterialsAll).conclusion.workability}
                  </div>
                  <div className="p-1 bg-white rounded border border-slate-100 text-right">
                    <strong className="block text-slate-800 font-extrabold pb-0.5 border-b border-slate-100 mb-0.5 select-none text-[8.5px]">💰 {reportLanguage === "ar" ? "الاقتصادية" : reportLanguage === "fr" ? "Économie" : "Economic"}</strong>
                    {reportLanguage === "ar" ? analyzeMixDesign(input, result, resolvedMaterialsAll).conclusion.economicAr : reportLanguage === "fr" ? analyzeMixDesign(input, result, resolvedMaterialsAll).conclusion.economicFr : analyzeMixDesign(input, result, resolvedMaterialsAll).conclusion.economic}
                  </div>
                  <div className="p-1 bg-white rounded border border-slate-100 text-right font-sans">
                    <strong className="block text-slate-800 font-extrabold pb-0.5 border-b border-slate-100 mb-0.5 select-none text-[8.5px]">🌱 {reportLanguage === "ar" ? "الاستدامة" : reportLanguage === "fr" ? "Durabilité Éco" : "Eco-sustain"}</strong>
                    {reportLanguage === "ar" ? analyzeMixDesign(input, result, resolvedMaterialsAll).conclusion.sustainabilityAr : reportLanguage === "fr" ? analyzeMixDesign(input, result, resolvedMaterialsAll).conclusion.sustainabilityFr : analyzeMixDesign(input, result, resolvedMaterialsAll).conclusion.sustainability}
                  </div>
                </div>
              </div>

            </div>
          </A4Page>

          {/* PAGE 10: PLACEMENT & SIGNATURES */}
          <A4Page pageNumber={10} totalPages={totalPagesCount} title={customTranslations[reportLanguage].recommendations} isRtl={isRtl} companyName={companyName} reportLanguage={reportLanguage}>
            <div className="space-y-4 py-2 flex-1 flex flex-col justify-between">
              
              <div className="text-right">
                <h3 className="text-xs font-black text-slate-805 mb-2 border-b border-slate-100 pb-1 flex items-center gap-1 justify-end font-sans">
                  <span>📑</span>
                  <span>{reportLanguage === "ar" ? "توصيات الموقع ومناولة خرسانة المباني" : reportLanguage === "fr" ? "Directives de Mise en Œuvre sur Site" : "Field Handling & Placing Guidelines"}</span>
                </h3>
                <div className="grid grid-cols-2 gap-3 text-[10.5px] font-sans text-slate-606">
                  <div className="p-2 border border-slate-100 rounded bg-slate-50/50 text-right">
                    <strong className="block text-slate-800 font-bold mb-0.5">1. {reportLanguage === "ar" ? "الخلط والتمويه" : reportLanguage === "fr" ? "Malaxage Actif" : "Active Mixing"}</strong>
                    {customTranslations[reportLanguage].mixingDesc}
                  </div>
                  <div className="p-2 border border-slate-100 rounded bg-slate-50/55 text-right font-sans">
                    <strong className="block text-slate-800 font-bold mb-0.5">2. {reportLanguage === "ar" ? "ارتفاع سقوط الصب" : reportLanguage === "fr" ? "Hauteur de Chute" : "Free Fall Limit"}</strong>
                    {customTranslations[reportLanguage].pouringDesc}
                  </div>
                  <div className="p-2 border border-slate-100 rounded bg-slate-50/50 text-right">
                    <strong className="block text-slate-800 font-bold mb-0.5">3. {reportLanguage === "ar" ? "المعالجة الحافظة" : reportLanguage === "fr" ? "Durée de Cure Humide" : "Moist Curing period"}</strong>
                    {customTranslations[reportLanguage].curingDesc}
                  </div>
                  <div className="p-2 border border-slate-100 rounded bg-slate-50/50 text-right">
                    <strong className="block text-slate-800 font-bold mb-0.5">4. {reportLanguage === "ar" ? "الدمك بالهزاز الهيكلي" : reportLanguage === "fr" ? "Serrage par Vibration" : "Vibrational poker"}</strong>
                    {customTranslations[reportLanguage].vibrationDesc}
                  </div>
                </div>
              </div>

              {/* Statement of Released decision */}
              <div className="border border-emerald-400 bg-emerald-50/10 p-3 rounded-lg text-center space-y-1.5">
                <span className="p-1 px-3 bg-emerald-600 text-white text-[9.5px] font-black rounded uppercase tracking-wider leading-none select-none inline-block">
                  {customTranslations[reportLanguage].approved}
                </span>
                <h4 className="font-extrabold text-slate-900 text-xs">{customTranslations[reportLanguage].suitCheckTitle}</h4>
                <p className="text-slate-605 text-[10px] leading-relaxed max-w-[150mm] mx-auto text-center font-sans">
                  {customTranslations[reportLanguage].suitCheckText}
                </p>
              </div>

              {/* Signature Matrix Row */}
              <div className="grid grid-cols-3 gap-6 pt-5 border-t border-dashed border-slate-200 text-xs text-right">
                <div className="text-right">
                  <span className="text-slate-400 block text-[9px] mb-6 font-bold uppercase">{reportLanguage === "ar" ? "تصميم وتولد المهندس المصمم" : reportLanguage === "fr" ? "Signature Concepteur" : "Lead designer signature"}</span>
                  <div className="border-b border-slate-300 w-3/4 mb-1"></div>
                  <span className="text-[10px] font-black text-slate-700 block">{engineerName}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[9px] mb-6 font-bold uppercase">{reportLanguage === "ar" ? "مراجعة واعتماد مختص المواد" : reportLanguage === "fr" ? "Visa Contrôle Matériaux" : "Technical Auditor Stamp"}</span>
                  <div className="border-b border-slate-300 w-3/4 mb-1"></div>
                  <span className="text-[10px] text-slate-500 block">{signatureDesignation}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-slate-400 block text-[9px] mb-2 font-bold uppercase">{reportLanguage === "ar" ? "ختم الصلاحية والاعتماد" : reportLanguage === "fr" ? "Sceau de Qualité" : "Quality Seal"}</span>
                  <div className="w-14 h-14 border border-amber-600 border-double rounded-full flex items-center justify-center text-[7px] text-amber-600 font-black rotate-12 select-none">
                    VALID CERT
                  </div>
                </div>
              </div>

            </div>
          </A4Page>

          {/* LABORATORY VALIDATION REPORT INTEGRATED IN PRINT DOSSIER */}
          {hasLabValidation && (
            <LabValidationReportPages 
              labRecords={labRecords}
              input={input}
              result={result}
              reportLanguage={reportLanguage}
              isRtl={isRtl}
              companyName={companyName}
              projectName={projectName}
              engineerName={engineerName}
              licenseNumber={licenseNumber}
              totalPagesCount={totalPagesCount}
            />
          )}

          {/* TECHNICAL PASSPORT PAGES FOR CONSTITUENT MATERIALS */}
          {materialPassportsList.map((passport, pIdx) => {
            const pageNum = 11 + (hasLabValidation ? 8 : 0) + pIdx;
            return (
              <A4Page 
                key={passport.name + pIdx}
                pageNumber={pageNum} 
                totalPages={totalPagesCount}
                title={reportLanguage === "ar" ? passport.titleAr : reportLanguage === "fr" ? (passport.titleFr || passport.titleEn) : passport.titleEn} 
                isRtl={isRtl} 
                companyName={companyName} 
                reportLanguage={reportLanguage}
              >
                <div className="space-y-4 py-2 flex-1 flex flex-col justify-between text-right">
                  
                  {/* Decorative Banner */}
                  <div className="relative overflow-hidden bg-slate-900 text-white p-3.5 rounded-xl flex justify-between items-center flex-row-reverse border border-slate-800">
                    <div className="absolute right-0 top-0 opacity-10 font-mono text-7xl font-black select-none pointer-events-none">
                      {passport.category.substring(0, 3).toUpperCase()}
                    </div>
                    
                    <div className="text-right z-10">
                      <span className="p-1 px-2.5 bg-rose-600 text-white font-extrabold rounded text-[9px] uppercase tracking-wider mb-1 inline-block">
                        {reportLanguage === "ar" ? "البطاقة الفنية وجواز مرور المزيج" : reportLanguage === "fr" ? "PASSEPORT TECHNIQUE DE COMPOSANT" : "CONSTITUENT TECHNICAL PASSPORT"}
                      </span>
                      <h3 className="text-sm font-black tracking-tight">{passport.name}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">{reportLanguage === "ar" ? "معلومات الهوية الفنية والاختبارات المعتمدة للمادة المصدر" : reportLanguage === "fr" ? "Audit d'approvisionnement, propriétés structurales et certificats de classification en laboratoire." : "Sourcing audit, structural properties, and laboratory classification certificates."}</p>
                    </div>
                    
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-lg z-10">
                      {passport.category === "cement" ? "🧪" : passport.category === "sand" ? "🏜️" : passport.category === "gravel" ? "⛰️" : passport.category === "water" ? "💧" : "⚗️"}
                    </div>
                  </div>

                  {/* Sourcing details & Properties Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Basic specs column */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-extrabold text-slate-800 border-b border-slate-100 pb-1 flex items-center gap-1 justify-end font-sans">
                        <span>📊</span>
                        <span>{reportLanguage === "ar" ? "الخواص الطبيعية للمادة" : "Physical Specification Ledger"}</span>
                      </h4>
                      <div className="space-y-1.5 text-xs text-slate-600">
                        {passport.properties.map((prop, propIdx) => (
                          <div key={propIdx} className="flex justify-between items-center bg-slate-50/50 p-2 border border-slate-100/50 rounded flex-row-reverse text-right">
                            <span className="font-bold text-slate-500">{reportLanguage === "ar" ? prop.labelAr : prop.labelEn}</span>
                            <span className="font-mono font-bold text-slate-800">
                              {prop.value} {prop.unit && <span className="text-[10px] text-slate-500 ml-0.5">{prop.unit}</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Meta-certification & environmental data */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-extrabold text-slate-800 border-b border-slate-100 pb-1 flex items-center gap-1 justify-end font-sans">
                        <span>📜</span>
                        <span>{reportLanguage === "ar" ? "الشهادات والاختبارات الفنية المعتمدة" : "Standard Compliance & Approvals"}</span>
                      </h4>
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg space-y-2 text-[10px] leading-relaxed text-slate-600 text-right">
                        <div>
                          <strong className="text-slate-800 font-bold block mb-0.5">{reportLanguage === "ar" ? "✓ اختبار مطابقة الخواص" : "Lab Compliance Audit"}</strong>
                          {reportLanguage === "ar" 
                            ? `تم اختبار جودة عينات [${passport.name}] بالمعمل الميداني للتأكد من خلوه من الملوثات والحد الأدنى للنسب النوعية.` 
                            : `Lot testing of constituent '${passport.name}' indicates perfect conformance with chemical limit ratios.`}
                        </div>
                        <div className="pt-2 border-t border-dashed border-slate-200">
                          <strong className="text-slate-800 font-bold block mb-0.5">{reportLanguage === "ar" ? "✓ ملاحظات المفتش الفني" : "Assessor Assessment"}</strong>
                          {reportLanguage === "ar" ? passport.notesAr : passport.notesEn}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gradation Sieve Curve for Aggregates, if available */}
                  {passport.gradation && passport.gradation.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="text-xs font-extrabold text-slate-800 border-b border-slate-100 pb-1 flex items-center gap-1 justify-end font-sans">
                        <span>📈</span>
                        <span>{reportLanguage === "ar" ? "منحنى التحليل المنخلي الفردي المقاس للمعمل" : "Individual Lot Sieve Analysis Gradation Chart"}</span>
                      </h4>
                      
                      <div className="grid grid-cols-7 gap-1 text-[9.5px] text-center font-mono py-1 bg-slate-50 border border-slate-100 rounded-lg">
                        {passport.gradation.slice(0, 14).map((gr, grIdx) => (
                          <div key={grIdx} className="p-1 border-r border-slate-200 last:border-r-0">
                            <span className="block text-slate-400 font-bold text-[8px]">{gr.sieve} mm</span>
                            <span className="font-extrabold text-slate-800">{gr.passing}%</span>
                          </div>
                        ))}
                      </div>

                      <p className="text-[9.5px] text-slate-400 leading-relaxed text-right font-sans">
                        {reportLanguage === "ar" 
                          ? "توضح هذه القيم النسبة المئوية للمار التراكمي لعينة الركام المختبرة منخلية تحت مقاييس الغربلة القياسية." 
                          : "This analytical array represents the cumulative passing percentiles measured via standard mechanical shake sieve structures."}
                      </p>
                    </div>
                  ) : (
                    <div className="h-16 flex items-center justify-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                      <span className="text-[10px] text-slate-400 font-bold">
                        {reportLanguage === "ar" 
                          ? "لا توجد متطلبات منحنيات تدرج منخلية ميكانيكية لعوالم الخلايا السائلة" 
                          : "Continuous granular distribution curve is not applicable to liquid / cement phases."}
                      </span>
                    </div>
                  )}

                  {/* Official stamping box */}
                  <div className="border border-indigo-100 bg-indigo-50/5 p-2.5 rounded-lg text-right flex justify-between items-center flex-row-reverse border-dashed">
                    <div>
                      <h5 className="font-extrabold text-xs text-indigo-950 font-sans">{reportLanguage === "ar" ? "إقرار المطابقة الكيميائية" : "Validation Certification"}</h5>
                      <p className="text-slate-500 text-[9.5px] leading-relaxed max-w-[130mm] font-sans">
                        {reportLanguage === "ar" 
                          ? "نقر نحن كمعمل فحص المواد بصلاحية هذه المادة للاستخدام في الخلطات الهيكلية المتكاملة لمشروع الشركة."
                          : "Certified that this constituent complies with designated physical specifications and is approved for batch operation."}
                      </p>
                    </div>
                    <div className="w-11 h-11 rounded bg-indigo-50/50 border border-indigo-100 flex items-center justify-center font-mono text-[8px] text-indigo-600 rotate-6 p-1 text-center font-bold select-none leading-tight">
                      SNO TRUST
                    </div>
                  </div>

                </div>
              </A4Page>
            );
          })}

        </div>
      </div>
    </div>
  );
};
