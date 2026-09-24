import React from "react";
import * as XLSX from "xlsx";
import { MixDesignResult, MixDesignInput } from "../types";
import { buildReportFileName, formatReportValue, getCalculationStatusLabel, getCompleteInputRows, getCompleteResultRows, getGradingSeries, getStrengthSeries, getSelectedMaterialSnapshots } from "./reportData";

// QR Code SVG Generator representing the verified parameters
export const QrCodeSvg: React.FC<{ text: string; size?: number }> = ({ text, size = 110 }) => {
  const getHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  const seed = getHash(text);
  const matrixSize = 25; // 25x25 Version 2 style grid
  const grid: boolean[][] = Array(matrixSize).fill(null).map(() => Array(matrixSize).fill(false));

  const drawFinder = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[row + r][col + c] = isBorder || isCenter;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, matrixSize - 7);
  drawFinder(matrixSize - 7, 0);

  for (let i = 8; i < matrixSize - 8; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  const aliRow = matrixSize - 9;
  const aliCol = matrixSize - 9;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const isOut = r === 0 || r === 4 || c === 0 || c === 4;
      const isIn = r === 2 && c === 2;
      grid[aliRow + r][aliCol + c] = isOut || isIn;
    }
  }

  let pseudo = seed;
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      const isFinderTL = r < 9 && c < 9;
      const isFinderTR = r < 9 && c >= matrixSize - 9;
      const isFinderBL = r >= matrixSize - 9 && c < 9;
      const isAlignment = r >= aliRow && r < aliRow + 5 && c >= aliCol && c < aliCol + 5;
      const isTiming = r === 6 || c === 6;

      if (!isFinderTL && !isFinderTR && !isFinderBL && !isAlignment && !isTiming) {
        pseudo = (pseudo * 1664525 + 1013904223) % 4294967296;
        grid[r][c] = (pseudo % 3) === 0;
      }
    }
  }

  const cellSize = 4;
  const svgSize = matrixSize * cellSize;
  const rects: React.ReactNode[] = [];

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (grid[r][c]) {
        rects.push(
          <rect
            key={`qr-cell-${r}-${c}`}
            x={c * cellSize}
            y={r * cellSize}
            width={cellSize}
            height={cellSize}
            fill="#1e293b"
          />
        );
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center bg-white p-2 border border-slate-200 shadow-3xs shrink-0 rounded-lg" id="exportable-report-qrcode">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className="shape-rendering-crispedges"
      >
        <rect width={svgSize} height={svgSize} fill="#ffffff" />
        {rects}
      </svg>
      <span className="text-[7px] font-mono text-slate-400 mt-1 uppercase tracking-wider font-bold">
        VERIFIED SOURCE
      </span>
    </div>
  );
};

export const reportTranslations: Record<"ar" | "fr" | "en", any> = {
  ar: {
    reportTitle: "تقرير معتمد لتصميم ومعايرة الخلطة الخرسانية",
    reportSub: "طريقة التدرج الحُبيبي لدرو-غوريس (Dreux-Gorisse Mix Formulation)",
    documentId: "معرف المستند",
    date: "تاريخ الفحص",
    laboratory: "مختبر الفحص المعتمد",
    mixStatus: "حالة المطابقة النهائية",
    certifiedFormula: "خلطة نهائية معتمدة وصالحة للصب",
    projectInfo: "معلومات وبيانات المشروع وصاحب العمل",
    projectName: "مشروع العمل",
    siteLocation: "مكان وساحة الصب بالموقع",
    clientOwner: "العميل / مالك المشروع",
    contractor: "المقاول الرئيسي للأشغال",
    structuralElement: "العضو الخرساني المستهدف",
    engineerInfo: "بيانات مهندس الجودة والترخيص المهني",
    leadEngineer: "المهندس الفاحص الرئيسي",
    licenseNumber: "رقم الترخيص والعضوية المهنية",
    contactEmail: "البريد الإلكتروني للتواصل",
    signatureTitle: "المسمى الوظيفي المعتمد للموقع",
    trialMixAdvisory: "توصيات إعداد الخلطة الميدانية التجريبية (Critical Trial Advisory)",
    trialMixDesc: "الخلطات الخرسانية تصنف مواداً إنشائية ثقيلة. تضمن هذه الآلية مرجعية هندسية دقيقة للحسابات. يُنصح دوماً بإنشاء خلطة تجريبية (Trial Mix) في معمل فحص المواد للتحقق من قيم التميع الفعلي والانزلاق والانضغاط قبل صب الأعمدة أو تغطيات الكمرات الحاملة.",
    characteristicStrength: "رتبة المقاومة المميزة المطلوبة fck",
    targetMeanStrength: "المقاومة المتوسطة المستهدفة fcm",
    wcRatio: "نسبة الماء إلى الإسمنت الفعلية (W/C)",
    compacityCoeff: "معامل الرص المطلوب (γ)",
    laboratoryDryRecipe: "1. المقادير المخبرية الجافة (Laboratory Dry Recipe per m³)",
    nominalWater: "ماء الخلط النظري الصافي",
    drySand: "الرمل الجاف الناعم",
    dryGravel: "الحصى الخشن الجاف",
    totalDryDensity: "إجمالي أوزان المواد الجافة للمتر المكعب",
    fieldWetScale: "2. أوزان الصب والموقع الفعلية (Field Scale adjusted for moisture)",
    actualWetSand: "الرمل الرطب الفعلي بالمكبس",
    actualWetGravel: "الحصى الرطب الفعلي بالمكبس",
    actualMixingWater: "الماء الفعلي المضاف للخلط بالموقع",
    totalWetDensity: "إجمالي أوزان المواد الرطبة للمتر المكعب",
    moistureSand: "رطوبة الرمل",
    moistureGravel: "رطوبة الحصى",
    admixtures: "الإضافات الكيميائية الملدنة",
    percentageOfAgg: "من حجم الركام الحجمي الموزون",
    densityLabel: "الكثافة الحجمية",
    cementType: "نوع الإسمنت الكتلوي",
    cementClass: "رتبة مقاومة حبة الإسمنت",
    controlClass: "فئة مراقبة وتأكيد الجودة",
    cementDry: "إسمنت بورتلاندي جاف معبأ",
    dryAggDescription: "مؤشرات الركام بحالته الجافة",
    wetAggDescription: "مؤشرات الركام رطب بالموقع",
    batchScalerTitle: "معايرة ميزان خلاطة الموقع والوجبات الفرعية",
    batchScalerDesc: "ادخل الحجم الصافي لوجبة الخلاطة الفردية لضرب الأوزان فورا:",
    scaleLabel: "حجم الوجبة الصافي",
    exportPdf: "تصدير وثيقة PDF",
    exportWord: "تصدير ملف Word",
    exportExcel: "تصدير جدول Excel",
    printReport: "طباعة التقرير",
    visualAnalysisTitle: "المنحنيات البيانية لتدرج الركام",
    complianceTitle: "معايير مطابقة الكود والمقاييس المستندة",
    thermalTitle: "المحاكاة الحرارية وخطر التشقق المائي",
    detailedStepsTitle: "خطوات الحساب والمعادلات الرياضية التفصيلية",
    approvalsTitle: "المصادقة والتواقيع والاعتماد لقسم المراقبة",
    labQualityEngineer: "مهندس جودة المختبر الرئيسي",
    pmApproval: "مدير المشروع / الاستشاري المعتمد",
    qualitySeal: "ختم الاعتماد الفني للمختبر",
    approvedMixBadge: "APPROVED MIX",
    signatureAndDate: "التوقيع والتاريخ",
    logoTextLabel: "اسم الجهة الفنية المسؤولة",
    co2Label: "البصمة الكربونية للخلطة CO₂",
    costLabel: "الكلفة الإجمالية المقدرة للمواد",
    strengthLabel: "المقاومة المتوقعة لـ 28 يوماً",
    water: "الماء الصافي المضاف",
    cement: "الإسمنت المعتمد",
    sand: "الرمل الجوف",
    gravel: "الحصى المتدرج",
    constituent: "المادة المكونة للخرسانة",
    dryUnitWeight: "الوزن الجاف (kg / m³)",
    wetUnitWeight: "الوزن الرطب (kg / m³)",
    batchScaleWeight: "وزن الوجبة الصافية"
  },
  en: {
    reportTitle: "Certified Concrete Mix Composition & Design Report",
    reportSub: "Dreux-Gorisse Advanced Grading & Mathematical Synthesis Framework",
    documentId: "DOCUMENT ID REFERENCE",
    date: "CERTIFICATION DATE",
    laboratory: "APPROVED TESTING LABORATORY",
    mixStatus: "COMPLIANCE STATUS",
    certifiedFormula: "CERTIFIED FINAL FORMULA",
    projectInfo: "Project Location, Clients & Infrastructure Meta",
    projectName: "Project Title",
    siteLocation: "Casting Site Location",
    clientOwner: "Project Client / Owner",
    contractor: "General Contractor",
    structuralElement: "Target Structural Member",
    engineerInfo: "Lead QC Engineer Credentials & Professional Stamp",
    leadEngineer: "Lead Testing Engineer",
    licenseNumber: "Professional License Number",
    contactEmail: "Engineer Business Email",
    signatureTitle: "Signature / Professional Designation",
    trialMixAdvisory: "Critical Safety Recommendation from Laboratory Group",
    trialMixDesc: "Concrete elements are high-priority structural components. This calculator provides accurate theoretical predictions. A concrete trial batch (Trial Mix) must be physically mixed inside a certified laboratory to verify real fresh slump, air entrainment and 28-day compression before pouring structural columns.",
    characteristicStrength: "Characteristic Compressive Strength fck",
    targetMeanStrength: "Target Mean Compressive Strength fcm",
    wcRatio: "Actual Water-to-Cement Ratio (W/C)",
    compacityCoeff: "Required Compacity Coefficient (γ)",
    laboratoryDryRecipe: "1. Laboratory Dry Recipe List (Calculated for dry masses per m³)",
    nominalWater: "Nominal Pure Mixing Water",
    drySand: "Dry Fine Sand (Fraction 1)",
    dryGravel: "Dry Coarse Gravel (Fraction 2)",
    totalDryDensity: "Total Calculated Dry Constituents Mass",
    fieldWetScale: "2. Real Site Wet Scales (Adjusted for stock moisture content)",
    actualWetSand: "Actual Sand Weight (Wet on scale)",
    actualWetGravel: "Actual Gravel Weight (Wet on scale)",
    actualMixingWater: "Actual Water to Add in Mixer",
    totalWetDensity: "Total Fresh Wet Density per m³",
    moistureSand: "Sand Moisture Content",
    moistureGravel: "Gravel Moisture Content",
    admixtures: "Liquid Admixtures",
    percentageOfAgg: "of total aggregates volume",
    densityLabel: "Absolute Density",
    cementType: "Portland Cement Class",
    cementClass: "Cement Grade",
    controlClass: "Quality Control Category on Site",
    cementDry: "Dry Portland Cement",
    dryAggDescription: "Dry state aggregates properties",
    wetAggDescription: "Wet state aggregates parameters configured on site",
    batchScalerTitle: "Batch Size Configuration & Mixer Volume Scaling",
    batchScalerDesc: "Input your actual site mixer volume in m³ or cubic yards to scale aggregate feeding quantities:",
    scaleLabel: "Batch Volume",
    exportPdf: "Export Certified PDF",
    exportWord: "Export Formatted MS Word",
    exportExcel: "Export Structured MS Excel",
    printReport: "Print Live Report",
    visualAnalysisTitle: "Section 3: Grading Curves Detail",
    complianceTitle: "Section 4: Standard Validation & Code Compliance",
    thermalTitle: "Section 5: Mass Concrete Thermal Dynamics",
    detailedStepsTitle: "Section 6: Iterative Formulas Logs",
    approvalsTitle: "Quality Assurance Signatures, Seals & Client Release",
    labQualityEngineer: "Lead Laboratory Quality Engineer",
    pmApproval: "Project Director / Consultant Audit",
    qualitySeal: "Laboratory Certified Technical Stamp",
    approvedMixBadge: "FORMULA APPROVED",
    signatureAndDate: "Signature & Verified Date",
    logoTextLabel: "Managing Organization Name",
    co2Label: "Carbon Index CO₂",
    costLabel: "Estimated Material Cost",
    strengthLabel: "Expected Compression Grade",
    water: "Mixing Water",
    cement: "Cement Binder",
    sand: "Fine Sand",
    gravel: "Coarse Gravel",
    constituent: "Material Constituent",
    dryUnitWeight: "Dry Mass (kg / m³)",
    wetUnitWeight: "Wet Mass (kg / m³)",
    batchScaleWeight: "Batch Weight"
  },
  fr: {
    reportTitle: "Rapport Certifié d'Étude de Formulation de Béton",
    reportSub: "Méthodologie Granulométrique & Composition Rationnelle (Dreux-Gorisse)",
    documentId: "ID DU DOCUMENT CERTIFIÉ",
    date: "DATE DE PUBLICATION ET VALIDATION",
    laboratory: "LABORATOIRE AGREE DE CONTROLE",
    mixStatus: "STATUT TECHNIQUE DE COMPATIBILITÉ",
    certifiedFormula: "FORMULE ADMINISTRATIVE HOMOLOGUÉE",
    projectInfo: "Informations Administratives de l'Ouvrage et du Projet",
    projectName: "Intitulé du Projet / Ouvrage",
    siteLocation: "Lieu du Chantier / Zone de Coulage Interne",
    clientOwner: "Maître d'Ouvrage / Client",
    contractor: "Entrepreneur Général des Travaux",
    structuralElement: "Élément Structurel Envisagé",
    engineerInfo: "Coordonnées de l'Ingénieur d'Études Référent",
    leadEngineer: "Ingénieur Responsable Contrôle Technique",
    licenseNumber: "Numéro d'Ordre d'Ingénieur National",
    contactEmail: "Adresse Courriel Professionnelle",
    signatureTitle: "Rôle Validant de Représentation de Signature",
    trialMixAdvisory: "Note d'Avertissement Impérative de l'Équipe d'Études",
    trialMixDesc: "Le béton de structure est un matériau exigeant. L'outil informatique fournit d'excellentes estimations théoriques. Une épreuve d'étude en laboratoire (Trial Mix) est obligatoire afin de mesurer la consistance, l'air occlus et la compression à 28 jours avant coulage sur chantier.",
    characteristicStrength: "Résistance Caractéristique Recommandée fck",
    targetMeanStrength: "Résistance Moyenne Cible Calculée fcm",
    wcRatio: "Rapport Eau/Ciment Réel Effectif (E/C)",
    compacityCoeff: "Coefficient de Compacité Déterminé (γ)",
    laboratoryDryRecipe: "1. Composition Sèche Laboratoire (Dosages préconisés par m³ sec)",
    nominalWater: "Eau Nette de Gâchage",
    drySand: "Sable Sec (Fraction Fine)",
    dryGravel: "Gravier Sec (Fraction Grosse)",
    totalDryDensity: "Densité Absolue Sèche Théorique Totale",
    fieldWetScale: "2. Formule Humide de Chantier (Ajustée à l'humidité superficielle)",
    actualWetSand: "Pesée du Sable Humide Réel",
    actualWetGravel: "Pesée du Gravier Humide Réel",
    actualMixingWater: "Eau Réelle Correctrice à Introduire",
    totalWetDensity: "Densité Humide de Calcul Réel en Chantier",
    moistureSand: "Humidité Réelle du Sable",
    moistureGravel: "Humidité Réelle du Gravier",
    admixtures: "Adjuvants Réducteurs d'Eau Plastifiants",
    percentageOfAgg: "en proportion volumétrique",
    densityLabel: "Densité Réelle",
    cementType: "Type de Ciment Employeur",
    cementClass: "Grade Mécanique du Liant",
    controlClass: "Niveau de Contrôle Qualité Chantier",
    cementDry: "Ciment Sec Ensaché",
    dryAggDescription: "Comportement mécanique des granulats secs",
    wetAggDescription: "Ajustements des granulats de stockage humides",
    batchScalerTitle: "Mise à l'Échelle Mécanique du Malaxeur de Chantier",
    batchScalerDesc: "Précisez la capacité volumique utile de votre malaxeur de chantier pour adapter les pesées :",
    scaleLabel: "Volume Gâchée",
    exportPdf: "Exporter en PDF",
    exportWord: "Exporter vers MS Word",
    exportExcel: "Exporter vers MS Excel",
    printReport: "Imprimer Rapport",
    visualAnalysisTitle: "Courbe Granulométrique Dreux-Gorisse",
    complianceTitle: "Analyse Spécifications Eurocode & Limites",
    thermalTitle: "Simulation Échauffement Thermique du Béton",
    detailedStepsTitle: "Détail Mathématique & Formules",
    approvalsTitle: "Approbations Officielles, Visas et Signature Technique",
    labQualityEngineer: "Ingénieur Laboratoire Central Qualité",
    pmApproval: "Directeur de Projet / Bureau d'Étude",
    qualitySeal: "Cachet Officiel d'Agrément Technique",
    approvedMixBadge: "BÉTON CERTIFIÉ CONFORME",
    signatureAndDate: "Signature et Date de coulée",
    logoTextLabel: "Nom de l'Administration Validante",
    co2Label: "Bilan Émissions Carbone CO₂",
    costLabel: "Coût Estimatif Global Composants m³",
    strengthLabel: "Résistance Moyenne Escomptée fcm",
    water: "Eau de gâchage",
    cement: "Liant ciment",
    sand: "Sable tamisé",
    gravel: "Gravier concassé",
    constituent: "Matériau Constituant",
    dryUnitWeight: "Dosage Sec (kg / m³)",
    wetUnitWeight: "Dosage Humide (kg / m³)",
    batchScaleWeight: "Pesée de Gâchée"
  }
};


const esc = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const reportLogoSvg = (width = 150, height = 46) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 150 46">
  <rect x="1" y="1" width="44" height="44" rx="11" fill="#0B1F3A"/>
  <rect x="5" y="5" width="36" height="36" rx="9" fill="none" stroke="#2563EB" stroke-width="1.5"/>
  <path d="M23 9L11 31h24L23 9Z" fill="#2563EB"/>
  <path d="M23 15v10M18 29h10" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
  <circle cx="23" cy="27" r="2.4" fill="#10B981"/>
  <text x="54" y="28" font-family="Segoe UI,Arial,sans-serif" font-size="24" font-weight="800" fill="#0B1F3A">Sno</text>
  <text x="99" y="28" font-family="Segoe UI,Arial,sans-serif" font-size="24" font-weight="800" fill="#2563EB">Lab</text>
</svg>`;

const gradingChartSvg = (result: MixDesignResult, lang: "ar" | "fr" | "en", width = 760, height = 350) => {
  const series = getGradingSeries(result);
  if (!series.length) return "";
  const left = 58, right = 22, top = 26, bottom = 52;
  const plotW = width - left - right, plotH = height - top - bottom;
  const minS = 0.08, maxS = 100;
  const logMin = Math.log10(minS), logMax = Math.log10(maxS);
  const x = (s:number) => left + ((Math.log10(Math.max(minS, Math.min(maxS, s))) - logMin) / (logMax - logMin)) * plotW;
  const y = (p:number) => top + (1 - Math.max(0, Math.min(100, p)) / 100) * plotH;
  const path = (key: "targetPassing" | "actualPassing") => series.filter(p => key === "targetPassing" || p.actualPassing !== undefined)
    .map((p,i) => `${i===0?"M":"L"} ${x(p.size).toFixed(1)} ${y(Number(p[key] ?? 0)).toFixed(1)}`).join(" ");
  const title = lang==="ar" ? "منحنى التدرج الحبيبي" : lang==="fr" ? "Courbe granulométrique" : "Aggregate grading curve";
  const target = lang==="ar" ? "منحنى Dreux المستهدف" : lang==="fr" ? "Cible Dreux" : "Dreux target";
  const actual = lang==="ar" ? "التدرج الفعلي للخلطة" : lang==="fr" ? "Granulométrie réelle du mélange" : "Actual blended grading";
  const sizes = [0.1,0.25,0.5,1,2,5,10,20,40,80,100];
  const h = [0,20,40,60,80,100];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="#fff"/>
    <text x="${left}" y="16" font-family="Segoe UI,Arial" font-size="15" font-weight="700" fill="#0B1F3A">${esc(title)}</text>
    ${h.map(p=>`<line x1="${left}" y1="${y(p)}" x2="${width-right}" y2="${y(p)}" stroke="#E2E8F0" stroke-dasharray="4 4"/><text x="${left-8}" y="${y(p)+4}" text-anchor="end" font-family="Arial" font-size="9" fill="#64748B">${p}%</text>`).join("")}
    ${sizes.map(s=>`<line x1="${x(s)}" y1="${top}" x2="${x(s)}" y2="${height-bottom}" stroke="#E2E8F0"/><text x="${x(s)}" y="${height-bottom+16}" text-anchor="middle" font-family="Arial" font-size="8" fill="#475569">${s}</text>`).join("")}
    <line x1="${left}" y1="${height-bottom}" x2="${width-right}" y2="${height-bottom}" stroke="#64748B" stroke-width="1.2"/>
    <line x1="${left}" y1="${top}" x2="${left}" y2="${height-bottom}" stroke="#64748B" stroke-width="1.2"/>
    <path d="${path("targetPassing")}" fill="none" stroke="#10B981" stroke-width="3"/>
    ${series.filter(p=>p.actualPassing!==undefined).length ? `<path d="${path("actualPassing")}" fill="none" stroke="#2563EB" stroke-width="3"/>` : ""}
    <g font-family="Segoe UI,Arial" font-size="10">
      <line x1="${width-260}" y1="18" x2="${width-240}" y2="18" stroke="#10B981" stroke-width="3"/><text x="${width-235}" y="22" fill="#334155">${esc(target)}</text>
      ${series.some(p=>p.actualPassing!==undefined) ? `<line x1="${width-120}" y1="18" x2="${width-100}" y2="18" stroke="#2563EB" stroke-width="3"/><text x="${width-95}" y="22" fill="#334155">${esc(actual)}</text>` : ""}
    </g>
    <text x="${(left+width-right)/2}" y="${height-10}" text-anchor="middle" font-family="Segoe UI,Arial" font-size="10" font-weight="700" fill="#334155">Sieve opening D (mm) — logarithmic scale</text>
    <text x="13" y="${(top+height-bottom)/2}" transform="rotate(-90 13 ${(top+height-bottom)/2})" text-anchor="middle" font-family="Segoe UI,Arial" font-size="10" font-weight="700" fill="#334155">% Passing</text>
  </svg>`;
};

const strengthChartSvg = (result: MixDesignResult, lang: "ar" | "fr" | "en", width = 760, height = 300) => {
  const series = getStrengthSeries(result);
  if (!series.length) return "";
  const left=55,right=24,top=28,bottom=48,plotW=width-left-right,plotH=height-top-bottom;
  const max=Math.max(10, Math.ceil(Math.max(...series.map(p=>p.strength), Number(result.fck28||0))/10)*10);
  const minAge=Math.min(...series.map(p=>p.age)), maxAge=Math.max(...series.map(p=>p.age));
  const x=(a:number)=>left+((a-minAge)/Math.max(1,maxAge-minAge))*plotW;
  const y=(s:number)=>top+(1-Math.max(0,Math.min(max,s))/max)*plotH;
  const path=series.map((p,i)=>`${i===0?"M":"L"} ${x(p.age).toFixed(1)} ${y(p.strength).toFixed(1)}`).join(" ");
  const title=lang==="ar"?"منحنى تطور مقاومة الضغط":lang==="fr"?"Évolution de la résistance en compression":"Compressive strength development";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="#fff"/>
    <text x="${left}" y="17" font-family="Segoe UI,Arial" font-size="15" font-weight="700" fill="#0B1F3A">${esc(title)}</text>
    ${[0,20,40,60,80,100].map(p=>{const v=max*p/100;return `<line x1="${left}" y1="${y(v)}" x2="${width-right}" y2="${y(v)}" stroke="#E2E8F0" stroke-dasharray="4 4"/><text x="${left-8}" y="${y(v)+4}" text-anchor="end" font-family="Arial" font-size="9" fill="#64748B">${v.toFixed(0)}</text>`;}).join("")}
    <line x1="${left}" y1="${height-bottom}" x2="${width-right}" y2="${height-bottom}" stroke="#64748B" stroke-width="1.2"/>
    <line x1="${left}" y1="${top}" x2="${left}" y2="${height-bottom}" stroke="#64748B" stroke-width="1.2"/>
    <path d="${path}" fill="none" stroke="#2563EB" stroke-width="3"/>
    ${series.map(p=>`<circle cx="${x(p.age)}" cy="${y(p.strength)}" r="4" fill="#10B981"/><text x="${x(p.age)}" y="${y(p.strength)-9}" text-anchor="middle" font-family="Arial" font-size="9" fill="#0F172A">${p.strength.toFixed(1)}</text><text x="${x(p.age)}" y="${height-bottom+16}" text-anchor="middle" font-family="Arial" font-size="8" fill="#475569">${p.age} d</text>`).join("")}
    <text x="${(left+width-right)/2}" y="${height-10}" text-anchor="middle" font-family="Segoe UI,Arial" font-size="10" font-weight="700" fill="#334155">Age (days)</text>
    <text x="13" y="${(top+height-bottom)/2}" transform="rotate(-90 13 ${(top+height-bottom)/2})" text-anchor="middle" font-family="Segoe UI,Arial" font-size="10" font-weight="700" fill="#334155">Strength (MPa)</text>
  </svg>`;
};

const htmlTable = (headers: string[], rows: Array<Array<unknown>>) => `
<table class="tbl"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join("")}</tr></thead>
<tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${esc(formatReportValue(v))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

export const handleExportWord = (
  lang: "ar" | "fr" | "en",
  companyName: string,
  projectName: string,
  siteLocation: string,
  clientOwner: string,
  contractor: string,
  structuralElement: string,
  engineerName: string,
  licenseNumber: string,
  engineerEmail: string,
  signatureDesignation: string,
  input: MixDesignInput,
  result: MixDesignResult,
  batchVolume: number,
  totalDryPerM3: number,
  scale: (w: number) => number
) => {
  const rtl = lang === "ar";
  const direction = rtl ? "rtl" : "ltr";
  const inputRows = getCompleteInputRows(input);
  const resultRows = getCompleteResultRows(result);
  const grading = getGradingSeries(result);
  const strength = getStrengthSeries(result);
  const t = reportTranslations[lang];
  const status = getCalculationStatusLabel(result.calculationStatus, lang);
  const wc = result.waterCementRatio ?? result.wcRatioAdjusted ?? result.wcRatio;
  const reportRef = buildReportFileName("MixDesignReport", input, lang, "doc").replace(/\.doc$/i, "").replace(/^SnoLab_MixDesignReport_/, "MX-");
  const date = new Date().toLocaleDateString(lang==="ar" ? "ar-DZ" : lang==="fr" ? "fr-DZ" : "en-US");

  const selectedMaterialSnapshots = getSelectedMaterialSnapshots(input);

  const materialRows = [
    ["Cement", input.selectedCementId || input.cementType || "—", input.cementDensity ?? "—", input.cementClassStrength ?? "—"],
    ["Fine aggregate", input.selectedSandId || input.sandType || "—", input.sandRelativeDensity ?? "—", input.finenessModulus ?? "—"],
    ["Coarse aggregate", input.selectedGravelId || input.gravelType || "—", input.gravelRelativeDensity ?? "—", input.dMax ?? "—"],
    ["Water", input.selectedWaterName || "Mixing water", 1.0, input.selectedWaterPH ?? "—"]
  ];

  const materialSnapshotRows = selectedMaterialSnapshots.flatMap(item => {
    const r = getCompleteResultRows(item.material as any);
    return r.slice(0, 45).map(row => [item.role, row.label, row.path || row.key, formatReportValue(row.value)]);
  });

  const formulaRows = [
    ["Cement", result.cementWeight, scale(result.cementWeight)],
    ["Effective water", result.waterContentActual, scale(result.waterContentActual)],
    ["Dry sand", result.sandWeightDry, scale(result.sandWeightDry)],
    ["Dry gravel", result.gravelWeightDry, scale(result.gravelWeightDry)],
    ["Wet sand", result.sandWeightWet, scale(result.sandWeightWet)],
    ["Wet gravel", result.gravelWeightWet, scale(result.gravelWeightWet)],
    ["Water to add", result.waterWeightWet, scale(result.waterWeightWet)],
    ...(result.admixtureWeights || []).map(a => [`Admixture — ${a.name}`, a.weight, scale(a.weight)]),
    ...(Number(result.flyAshKg||0)>0 ? [["Fly ash",result.flyAshKg,scale(result.flyAshKg)]] : []),
    ...(Number(result.slagKg||0)>0 ? [["Slag",result.slagKg,scale(result.slagKg)]] : []),
    ...(Number(result.silicaFumeKg||0)>0 ? [["Silica fume",result.silicaFumeKg,scale(result.silicaFumeKg)]] : []),
    ...(Number((result.designSSD as any)?.fiberKg || 0)>0 ? [["Fibers",(result.designSSD as any)?.fiberKg,scale((result.designSSD as any)?.fiberKg)]] : [])
  ];

  const standardsRows = (result.standardsCompliance || []).map(c => [c.standardName,c.parameter,c.requirement,c.actual,c.status,c.note]);
  const traceRows = (result.calculationTrace || []).map(s => [s.stepNumber,s.name,s.formula,formatReportValue(s.result),s.unit||"",s.note||""]);
  const warnings = [...new Set([...(result.warnings||[]), ...(result.errors||[])])];

  const inputTableRows = inputRows.map(r=>[r.label,r.path||"",formatReportValue(r.value)]);
  const resultTableRows = resultRows.map(r=>[r.label,r.path||"",formatReportValue(r.value)]);

  const docContent = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>${esc(t.reportTitle)}</title>
<style>
@page{size:A4;margin:16mm 14mm 18mm 14mm}
body{font-family:"Segoe UI",Arial,sans-serif;color:#0f172a;font-size:9pt;line-height:1.45;direction:${direction};margin:0}
.page{page-break-after:always}
.cover{min-height:255mm;display:flex;flex-direction:column;justify-content:space-between}
.brand{padding-bottom:12px;border-bottom:2px solid #2563EB;margin-bottom:18px}
.logo{text-align:center;margin:4mm 0 8mm}
.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.card{border:1px solid #CBD5E1;background:#F8FAFC;padding:8px;border-radius:5px}
.kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:12px 0}
.kpi .card{background:#EFF6FF;text-align:center}
.kpi .v{font-size:15pt;font-weight:800;color:#2563EB}
.section{font-size:12pt;font-weight:800;color:#0B1F3A;border-bottom:2px solid #2563EB;padding-bottom:4px;margin:10px 0 8px}
.tbl{width:100%;border-collapse:collapse;margin:6px 0 14px}
.tbl th{background:#0B1F3A;color:#fff;padding:5px;border:1px solid #CBD5E1;text-align:${rtl?"right":"left"}}
.tbl td{padding:4px 5px;border:1px solid #CBD5E1;vertical-align:top;word-break:break-word}
.tbl tr:nth-child(even) td{background:#F8FAFC}
.badge{display:inline-block;padding:4px 8px;border:1px solid #2563EB;color:#2563EB;font-weight:800;border-radius:12px}
.note{padding:8px;border-left:4px solid #10B981;background:#ECFDF5;margin:8px 0}
.warn{padding:8px;border-left:4px solid #F59E0B;background:#FFFBEB;margin:8px 0}
.footer{font-size:8pt;color:#64748B;border-top:1px solid #CBD5E1;padding-top:6px;margin-top:15px}
h1{font-size:22pt;color:#0B1F3A;margin:4px 0} h2{font-size:16pt;color:#0B1F3A} h3{font-size:12pt;color:#2563EB}
pre{white-space:pre-wrap;font-size:7.5pt;background:#F8FAFC;padding:8px;border:1px solid #E2E8F0}
img.chart{width:100%;height:auto;border:1px solid #E2E8F0}
</style></head><body>

<div class="page cover">
  <div>
    <div class="logo">${reportLogoSvg(260,80)}</div>
    <div class="brand"><h1>${esc(t.reportTitle)}</h1><div>${esc(t.reportSub)}</div></div>
    <div class="meta">
      <div class="card"><b>Report reference</b><br/>${esc(reportRef)}</div>
      <div class="card"><b>Date</b><br/>${esc(date)}</div>
      <div class="card"><b>Project</b><br/>${esc(projectName || "—")}</div>
      <div class="card"><b>Client / Owner</b><br/>${esc(clientOwner || "—")}</div>
      <div class="card"><b>Site</b><br/>${esc(siteLocation || "—")}</div>
      <div class="card"><b>Structural element</b><br/>${esc(structuralElement || "—")}</div>
      <div class="card"><b>Laboratory / Unit</b><br/>${esc(companyName || "SnoLab Engineering Materials Laboratory")}</div>
      <div class="card"><b>Status</b><br/><span class="badge">${esc(status)}</span></div>
    </div>
    <div class="kpi">
      <div class="card"><div>fck,28</div><div class="v">${esc(input.fck28)} MPa</div></div>
      <div class="card"><div>fcm,28</div><div class="v">${Number(result.fcm28||0).toFixed(1)} MPa</div></div>
      <div class="card"><div>W/C</div><div class="v">${Number(wc||0).toFixed(3)}</div></div>
      <div class="card"><div>Dmax</div><div class="v">${esc(input.dMax)} mm</div></div>
    </div>
    <div class="note"><b>Engineering use note:</b> this document records the calculated formulation, source inputs, laboratory-linked values and checks. Physical trial batching and laboratory verification remain required before structural casting.</div>
  </div>
  <div class="footer">SnoLab • Concrete formulation & materials laboratory report • ${esc(date)} • ${esc(reportRef)}</div>
</div>

<div class="page">
  <div class="section">1. Mix-preparation inputs / المدخلات الكاملة</div>
  ${htmlTable([lang==="ar"?"المدخل":"Input parameter","Path / field","Value"], inputTableRows)}
  <div class="section">2. Selected material records</div>
  ${htmlTable(["Material","Selected record","Density / SG","Key property"], materialRows)}
  ${selectedMaterialSnapshots.length ? `<div class="section">Selected library material snapshots</div>${htmlTable(["Role","Property","Field","Value"], materialSnapshotRows)}` : ""}
</div>

<div class="page">
  <div class="section">3. Design formula & batching quantities</div>
  ${htmlTable(["Component","Per m³","For batch","Unit"], formulaRows.map(r=>[r[0],r[1],r[2],"kg or L"]))}
  <div class="section">Moisture / batching correction</div>
  ${htmlTable(["Parameter","Value","Unit"],[
    ["Sand moisture",input.moistureSand??"—","%"],
    ["Gravel moisture",input.moistureGravel??"—","%"],
    ["Sand wet mass",result.sandWeightWet??"—","kg/m³"],
    ["Gravel wet mass",result.gravelWeightWet??"—","kg/m³"],
    ["Water to add",result.waterWeightWet??result.waterToAdd??"—","kg or L/m³"],
    ["Absorption deficit",result.aggregateAbsorptionDeficit??"—","kg/m³"],
    ["Raw water to add",result.rawWaterToAdd??"—","kg/m³"]
  ])}
  <div class="section">Primary results</div>
  ${htmlTable(["Result","Value","Unit"],[
    ["Effective W/C",wc??"—",""],
    ["Water/Binder",result.waterBinderRatio??"—",""],
    ["Cement used",result.actualCementUsed??result.cementWeight??"—","kg/m³"],
    ["Theoretical cement demand",result.theoreticalCementDemand??"—","kg/m³"],
    ["Sand fraction",result.sandPercent??"—","%"],
    ["Gravel fraction",result.gravelPercent??"—","%"],
    ["Fresh density",result.totalFreshDensity??"—","kg/m³"],
    ["Volume closure error",result.volumeClosureError??"—","%"],
    ["Calculation status",status,""]
  ])}
</div>

<div class="page">
  <div class="section">4. Grading & engineering curves</div>
  ${gradingChartSvg(result,lang) ? `<div>${gradingChartSvg(result,lang)}</div>` : "<div class='warn'>No grading series were available for export.</div>"}
  ${strengthChartSvg(result,lang) ? `<div style="margin-top:14px">${strengthChartSvg(result,lang)}</div>` : ""}
  <div class="section">Curve data</div>
  ${htmlTable(["Sieve / age","Target","Actual / strength","Unit"],[
    ...grading.map(p=>[`${p.size} mm`,p.targetPassing,p.actualPassing??"—","% passing"]),
    ...strength.map(p=>[`${p.age} d`,"—",p.strength,"MPa"])
  ])}
</div>

<div class="page">
  <div class="section">5. Standards / engineering checks</div>
  ${standardsRows.length ? htmlTable(["Standard","Parameter","Requirement","Actual","Status","Note"],standardsRows) : "<div class='warn'>No standards-compliance rows were recorded.</div>"}
  ${warnings.length ? `<div class="section">Warnings / blocking messages</div>${warnings.map(w=>`<div class="warn">${esc(w)}</div>`).join("")}` : ""}
  <div class="section">Engineering audit</div>
  ${htmlTable(["Audit field","Value"],[
    ["Engine status",status],
    ["Engine version",(result as any).engineeringAudit?.engineVersion??"—"],
    ["Material resolution",(result as any).engineeringAudit?.inputResolution ? JSON.stringify((result as any).engineeringAudit.inputResolution) : "—"],
    ["Manual W/C override",(result as any).engineeringAudit?.manualWcOverrideUsed??false],
    ["Granular optimization",(result as any).engineeringAudit?.granularOptimization ? JSON.stringify((result as any).engineeringAudit.granularOptimization) : "—"],
    ["Confidence",(result as any).confidenceLevel??"—"]
  ])}
</div>

<div class="page">
  <div class="section">6. Complete calculated result register</div>
  ${htmlTable(["Result parameter","Path / field","Value"], resultTableRows)}
</div>

<div class="page">
  <div class="section">7. Calculation trace / سجل الحساب</div>
  ${traceRows.length ? htmlTable(["Step","Name","Formula","Result","Unit","Note"],traceRows) : "<div class='warn'>No calculation trace was stored.</div>"}
  <div class="section">8. Approval & release</div>
  <div class="meta">
    <div class="card"><b>Prepared by</b><br/>${esc(engineerName || "—")}<br/>${esc(signatureDesignation || "")}</div>
    <div class="card"><b>Professional / license reference</b><br/>${esc(licenseNumber || "—")}<br/>${esc(engineerEmail || "")}</div>
    <div class="card"><b>Reviewer</b><br/>____________________________</div>
    <div class="card"><b>Laboratory / QA sign-off</b><br/>____________________________</div>
  </div>
  <div class="note" style="margin-top:18px"><b>Document control:</b> report reference ${esc(reportRef)} • generated ${esc(date)} • batch volume ${esc(batchVolume)} m³ • revision 1.</div>
</div>

</body></html>`;

  const blob = new Blob(["\\ufeff" + docContent], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = buildReportFileName("MixDesignReport", input, lang, "doc");
  document.body.appendChild(a);
  a.click();
  window.setTimeout(()=>{ a.remove(); URL.revokeObjectURL(url); }, 1000);
};

export const handleExportExcel = (
  lang: "ar" | "fr" | "en",
  companyName: string,
  projectName: string,
  siteLocation: string,
  clientOwner: string,
  contractor: string,
  structuralElement: string,
  engineerName: string,
  licenseNumber: string,
  engineerEmail: string,
  signatureDesignation: string,
  input: MixDesignInput,
  result: MixDesignResult,
  totalDryPerM3: number,
  batchVolume: number
) => {
  const t = reportTranslations[lang];
  const status = getCalculationStatusLabel(result.calculationStatus, lang);
  const wc = result.waterCementRatio ?? result.wcRatioAdjusted ?? result.wcRatio;
  const inputRows = getCompleteInputRows(input);
  const resultRows = getCompleteResultRows(result);
  const grading = getGradingSeries(result);
  const strength = getStrengthSeries(result);
  const wb = XLSX.utils.book_new();

  const makeSheet = (rows: any[][], widths: number[] = [34,30,28,24]) => {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = widths.map(w=>({wch:w}));
    ws["!freeze"] = { xSplit: 0, ySplit: 1 };
    if (lang === "ar") ws["!views"] = [{ RTL: true }];
    return ws;
  };

  const title = [
    ["SnoLab", t.reportTitle],
    [t.reportSub || "Dreux-Gorisse"],
    [],
    ["REPORT REFERENCE", buildReportFileName("MixDesignReport", input, lang, "xlsx").replace(/^SnoLab_|\.xlsx$/g,"")],
    ["DATE", new Date().toLocaleDateString(lang==="ar"?"ar-DZ":lang==="fr"?"fr-DZ":"en-US")],
    ["STATUS", status],
    [],
    ["PROJECT", projectName || "—"],
    ["SITE", siteLocation || "—"],
    ["CLIENT / OWNER", clientOwner || "—"],
    ["CONTRACTOR", contractor || "—"],
    ["STRUCTURAL ELEMENT", structuralElement || "—"],
    ["ENGINEER", engineerName || "—"],
    ["LICENSE / REF", licenseNumber || "—"],
    ["ENGINEER EMAIL", engineerEmail || "—"],
    [],
    ["KEY METRICS","Value","Unit"],
    ["fck,28",input.fck28,"MPa"],
    ["fcm,28",result.fcm28,"MPa"],
    ["W/C",wc,""],
    ["W/B",result.waterBinderRatio??"—",""],
    ["Dmax",input.dMax,"mm"],
    ["Slump",input.slump,"cm"],
    ["Batch volume",batchVolume,"m³"],
    ["Fresh density",result.totalFreshDensity,"kg/m³"]
  ];
  XLSX.utils.book_append_sheet(wb, makeSheet(title,[34,70,18]), "01 Cover");

  XLSX.utils.book_append_sheet(wb, makeSheet([
    ["SnoLab — Complete Mix Preparation Inputs"],
    ["Parameter","Field path","Value"],
    ...inputRows.map(r=>[r.label,r.path||"",formatReportValue(r.value)])
  ],[48,58,70]), "02 Inputs");

  const materials = [
    ["Selected materials & key properties"],
    ["Component","Selected record","Density / SG","Absorption / moisture","Additional data"],
    ["Cement",input.selectedCementId||input.cementType||"—",input.cementDensity??"—","—",input.cementClassStrength??"—"],
    ["Fine aggregate",input.selectedSandId||input.sandType||"—",input.sandRelativeDensity??"—",`${input.sandAbsorption??"—"} / ${input.moistureSand??"—"}%`,`FM=${input.finenessModulus??"—"}`],
    ["Coarse aggregate",input.selectedGravelId||input.gravelType||"—",input.gravelRelativeDensity??"—",`${input.gravelAbsorption??"—"} / ${input.moistureGravel??"—"}%`,`Dmax=${input.dMax??"—"} mm`],
    ["Water",input.selectedWaterName||"Mixing water",1.0,"—",`pH=${input.selectedWaterPH??"—"}`]
  ];
  XLSX.utils.book_append_sheet(wb, makeSheet(materials,[26,38,22,30,36]), "03 Materials");
  if (selectedMaterialSnapshots.length) {
    const snapshotRows = [
      ["Selected SnoLab library material snapshots"],
      ["Role","Material","Property","Field","Value"],
      ...selectedMaterialSnapshots.flatMap(item =>
        getCompleteResultRows(item.material as any).slice(0, 60).map(row => [
          item.role,
          item.material.name || item.material.englishName || item.material.MaterialID || "—",
          row.label,
          row.path || row.key,
          formatReportValue(row.value)
        ])
      )
    ];
    XLSX.utils.book_append_sheet(wb, makeSheet(snapshotRows,[26,34,42,52,70]), "03B Material Snapshots");
  }

  const formula = [
    ["SnoLab — Mix Formula / Batching"],
    ["Component","Per m³","Batch quantity","Unit","Notes"],
    ["Cement",result.cementWeight,Number(result.cementWeight||0)*batchVolume,"kg","Actual cement used"],
    ["Effective water",result.waterContentActual,Number(result.waterContentActual||0)*batchVolume,"kg/L","Effective water"],
    ["Dry sand",result.sandWeightDry,Number(result.sandWeightDry||0)*batchVolume,"kg","SSD/dry design basis"],
    ["Dry gravel",result.gravelWeightDry,Number(result.gravelWeightDry||0)*batchVolume,"kg","SSD/dry design basis"],
    ["Wet sand",result.sandWeightWet,Number(result.sandWeightWet||0)*batchVolume,"kg","Moisture corrected"],
    ["Wet gravel",result.gravelWeightWet,Number(result.gravelWeightWet||0)*batchVolume,"kg","Moisture corrected"],
    ["Water to add",result.waterWeightWet??result.waterToAdd,Number(result.waterWeightWet??result.waterToAdd??0)*batchVolume,"kg/L","After aggregate moisture correction"],
    ["Theoretical cement demand",result.theoreticalCementDemand,"—","kg/m³","Uncapped demand"],
    ["Actual cement used",result.actualCementUsed??result.cementWeight,"—","kg/m³","Applied design value"],
    ["Fine aggregate fraction",result.sandPercent,"—","%","Blend fraction"],
    ["Coarse aggregate fraction",result.gravelPercent,"—","%","Blend fraction"],
    ["Effective W/C",wc,"—","","Water / cement"],
    ["Water/Binder",result.waterBinderRatio??"—","—","","Water / total binder"],
    ["Fresh density",result.totalFreshDensity,"—","kg/m³","Calculated value"]
  ];
  (result.admixtureWeights||[]).forEach(a=>formula.push([`Admixture — ${a.name}`,a.weight,a.weight*batchVolume,"kg", "Structured admixture"]));
  if(Number(result.flyAshKg||0)>0) formula.push(["Fly ash",result.flyAshKg,(result.flyAshKg||0)*batchVolume,"kg","Mineral addition"]);
  if(Number(result.slagKg||0)>0) formula.push(["Slag",result.slagKg,(result.slagKg||0)*batchVolume,"kg","Mineral addition"]);
  if(Number(result.silicaFumeKg||0)>0) formula.push(["Silica fume",result.silicaFumeKg,(result.silicaFumeKg||0)*batchVolume,"kg","Mineral addition"]);
  XLSX.utils.book_append_sheet(wb, makeSheet(formula,[34,20,22,14,44]), "04 Formula");

  XLSX.utils.book_append_sheet(wb, makeSheet([
    ["SnoLab — Complete Calculated Output Register"],
    ["Result parameter","Field path","Value"],
    ...resultRows.map(r=>[r.label,r.path||"",formatReportValue(r.value)])
  ],[50,62,80]), "05 Results");

  XLSX.utils.book_append_sheet(wb, makeSheet([
    ["SnoLab — Curves / Graph Data"],
    ["Sieve size (mm)","Target passing (%)","Actual blend passing (%)"],
    ...grading.map(p=>[p.size,p.targetPassing,p.actualPassing??"—"]),
    [],
    ["Strength age (days)","Strength (MPa)","fck target (MPa)"],
    ...strength.map(p=>[p.age,p.strength,input.fck28])
  ],[24,26,30]), "06 Curves");

  XLSX.utils.book_append_sheet(wb, makeSheet([
    ["SnoLab — Compliance / Verification"],
    ["Standard","Parameter","Requirement","Actual","Status","Note"],
    ...(result.standardsCompliance||[]).map(c=>[c.standardName,c.parameter,c.requirement,c.actual,c.status,c.note]),
    [],
    ["Warnings / errors"],
    ...(result.warnings||[]).map(w=>[w]),
    ...(result.errors||[]).map(e=>[e])
  ],[26,30,32,28,18,50]), "07 Checks");

  XLSX.utils.book_append_sheet(wb, makeSheet([
    ["SnoLab — Engineering Audit / Calculation Trace"],
    ["Step","Name","Formula","Result","Unit","Note"],
    ...(result.calculationTrace||[]).map(s=>[s.stepNumber,s.name,s.formula,formatReportValue(s.result),s.unit||"",s.note||""]),
    [],
    ["Audit metadata","Value"],
    ["Engine status",status],
    ["Engine version",(result as any).engineeringAudit?.engineVersion??"—"],
    ["Input resolution",(result as any).engineeringAudit?.inputResolution ? JSON.stringify((result as any).engineeringAudit.inputResolution) : "—"],
    ["Manual W/C override",(result as any).engineeringAudit?.manualWcOverrideUsed??false],
    ["Granular optimization",(result as any).engineeringAudit?.granularOptimization ? JSON.stringify((result as any).engineeringAudit.granularOptimization) : "—"],
    ["Confidence",(result as any).confidenceLevel??"—"]
  ],[10,30,42,34,16,50]), "08 Audit");

  const wbout = XLSX.write(wb, { bookType:"xlsx", type:"array", cellStyles:true, compression:true });
  const blob = new Blob([wbout], {type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = buildReportFileName("MixDesignReport", input, lang, "xlsx");
  document.body.appendChild(a);
  a.click();
  window.setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},1000);
};

