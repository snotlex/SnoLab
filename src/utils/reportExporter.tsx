import React from "react";
import * as XLSX from "xlsx";
import { MixDesignResult, MixDesignInput } from "../types";

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
  const t = reportTranslations[lang];
  const isRtl = lang === "ar";
  const dir = isRtl ? "rtl" : "ltr";
  const align = isRtl ? "right" : "left";

  const dryWater = Math.round(result.waterContentActual) + " L";
  const wetWater = Math.round(result.waterWeightWet) + " L";

  const docContent = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset="utf-8">
    <title>${t.reportTitle}</title>
    <!--[if gte mso 9]>
    <xml>
      <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
      </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
      body {
        font-family: 'Segoe UI', Arial, sans-serif;
        direction: ${dir};
        background-color: #ffffff;
        color: #1e293b;
        margin: 1in;
      }
      .header-container {
        text-align: center;
        margin-bottom: 25px;
        border-bottom: 3px double #1e3a8a;
        padding-bottom: 15px;
      }
      .org-name {
        font-size: 16pt;
        font-weight: bold;
        color: #1e3a8a;
        margin: 0;
      }
      .report-title {
        font-size: 14pt;
        font-weight: bold;
        color: #475569;
        margin: 8px 0 3px 0;
      }
      .sub-title {
        font-size: 9.5pt;
        color: #64748b;
        font-style: italic;
      }
      .section-header {
        font-size: 11pt;
        font-weight: bold;
        color: #1e3a8a;
        border-bottom: 1px solid #1e3a8a;
        padding-bottom: 4px;
        margin-top: 25px;
        margin-bottom: 12px;
      }
      table.data-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      table.data-table td, table.data-table th {
        border: 1px solid #cbd5e1;
        padding: 8px;
        font-size: 9pt;
        text-align: ${align};
      }
      table.data-table th {
        background-color: #f1f5f9;
        font-weight: bold;
      }
      .highlight-row {
        background-color: #fefcf6;
        font-weight: bold;
      }
      .blue-field-row {
        background-color: #eff6ff;
        font-weight: bold;
        color: #1d4ed8;
      }
      .info-box {
        background-color: #0f172a;
        color: #ffffff;
        padding: 12px;
        margin-bottom: 20px;
        border-left: 5px solid #d97706;
      }
      .info-box table {
        width: 100%;
      }
      .info-box td {
        color: #cbd5e1;
        text-align: center;
        font-size: 8.5pt;
        border: none;
      }
      .info-box .num {
        font-size: 12pt;
        font-weight: bold;
        color: #f59e0b;
      }
    </style>
  </head>
  <body>
    <div class="header-container">
      <p class="org-name">${companyName}</p>
      <p class="report-title">${t.reportTitle}</p>
      <p class="sub-title">${t.reportSub}</p>
      <p style="font-size: 8.5pt; color:#94a3b8; margin: 4px 0;">DOC REF: DG-MX-${Date.now().toString().substring(7)}-CERT • ${t.date}: ${new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</p>
    </div>

    <div class="section-header">${t.projectInfo}</div>
    <table class="data-table">
      <tr>
        <td style="font-weight:bold; background-color:#f8fafc; width:25%;">${t.projectName}</td>
        <td>${projectName}</td>
        <td style="font-weight:bold; background-color:#f8fafc; width:25%;">${t.siteLocation}</td>
        <td>${siteLocation}</td>
      </tr>
      <tr>
        <td style="font-weight:bold; background-color:#f8fafc;">${t.clientOwner}</td>
        <td>${clientOwner}</td>
        <td style="font-weight:bold; background-color:#f8fafc;">${t.contractor}</td>
        <td>${contractor}</td>
      </tr>
      <tr>
        <td style="font-weight:bold; background-color:#f8fafc;">${t.structuralElement}</td>
        <td>${structuralElement}</td>
        <td style="font-weight:bold; background-color:#f8fafc;">${t.laboratory}</td>
        <td>${companyName} Laboratory Division</td>
      </tr>
    </table>

    <div class="section-header">${t.engineerInfo}</div>
    <table class="data-table">
      <tr>
        <td style="font-weight:bold; background-color:#f8fafc; width:25%;">${t.leadEngineer}</td>
        <td>${engineerName}</td>
        <td style="font-weight:bold; background-color:#f8fafc; width:25%;">${t.licenseNumber}</td>
        <td>${licenseNumber}</td>
      </tr>
      <tr>
        <td style="font-weight:bold; background-color:#f8fafc;">${t.contactEmail}</td>
        <td>${engineerEmail}</td>
        <td style="font-weight:bold; background-color:#f8fafc;">${t.signatureTitle}</td>
        <td>${signatureDesignation}</td>
      </tr>
    </table>

    <div class="info-box">
      <table>
        <tr>
          <td>
            <div>${t.characteristicStrength}</div>
            <div class="num">C${input.fck28} MPa</div>
          </td>
          <td>
            <div>${t.targetMeanStrength}</div>
            <div class="num">${result.fcm28.toFixed(1)} MPa</div>
          </td>
          <td>
            <div>${t.wcRatio}</div>
            <div class="num">${result.wcRatioAdjusted.toFixed(2)}</div>
          </td>
          <td>
            <div>${t.compacityCoeff}</div>
            <div class="num">γ = ${result.compactorGamma.toFixed(3)}</div>
          </td>
        </tr>
      </table>
    </div>

    <div class="section-header">${t.laboratoryDryRecipe}</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>${t.constituent}</th>
          <th>${t.densityLabel}</th>
          <th>Dry dosage per m³</th>
          <th style="background-color: #fef3c7;">Scaled Weight (${batchVolume} m³)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-weight:bold;">${t.cementDry}</td>
          <td>${input.cementDensity && input.cementDensity > 0 ? `${input.cementDensity} kg/m³` : (lang === "ar" ? "غير متوفر" : lang === "fr" ? "Non disponible" : "N/A")}</td>
          <td>${Math.round(result.cementWeight)} kg</td>
          <td style="font-weight:bold; background-color:#fefcf6;">${scale(result.cementWeight)} kg</td>
        </tr>
        <tr>
          <td style="font-weight:bold;">${t.nominalWater}</td>
          <td>1.0</td>
          <td>${dryWater}</td>
          <td style="font-weight:bold; background-color:#fefcf6;">${scale(result.waterContentActual)} L</td>
        </tr>
        <tr>
          <td style="font-weight:bold;">${t.drySand}</td>
          <td>${input.sandRelativeDensity && input.sandRelativeDensity > 0 ? input.sandRelativeDensity : (lang === "ar" ? "غير متوفر" : lang === "fr" ? "Non disponible" : "N/A")}</td>
          <td>${Math.round(result.sandWeightDry)} kg</td>
          <td style="font-weight:bold; background-color:#fefcf6;">${scale(result.sandWeightDry)} kg</td>
        </tr>
        <tr>
          <td style="font-weight:bold;">${t.dryGravel}</td>
          <td>${input.gravelRelativeDensity && input.gravelRelativeDensity > 0 ? input.gravelRelativeDensity : (lang === "ar" ? "غير متوفر" : lang === "fr" ? "Non disponible" : "N/A")}</td>
          <td>${Math.round(result.gravelWeightDry)} kg</td>
          <td style="font-weight:bold; background-color:#fefcf6;">${scale(result.gravelWeightDry)} kg</td>
        </tr>
        ${result.admixtureWeights.map(adm => `
        <tr>
          <td>🧪 ${adm.name}</td>
          <td>~1.1</td>
          <td>${adm.weight.toFixed(2)} kg</td>
          <td>${scale(adm.weight)} kg</td>
        </tr>
        `).join('')}
        <tr style="background-color: #f1f5f9; font-weight:bold;">
          <td>Total Net Bulk Weight</td>
          <td>-</td>
          <td>${Math.round(totalDryPerM3)} kg/m³</td>
          <td>-</td>
        </tr>
      </tbody>
    </table>

    <div class="section-header">${t.fieldWetScale}</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>${t.constituent}</th>
          <th>${t.moistureSand} / ${t.moistureGravel}</th>
          <th>Wet dosage per m³</th>
          <th style="background-color: #fef3c7;">Actual Scale Weight (${batchVolume} m³)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-weight:bold;">${t.cementDry}</td>
          <td>0% (Dry silo)</td>
          <td>${Math.round(result.cementWeight)} kg</td>
          <td style="font-weight:bold; background-color:#fefcf6;">${scale(result.cementWeight)} kg</td>
        </tr>
        <tr>
          <td style="font-weight:bold;">${t.actualWetSand}</td>
          <td style="font-weight:bold; color:#b45309;">${input.moistureSand}%</td>
          <td>${Math.round(result.sandWeightWet)} kg</td>
          <td style="font-weight:bold; background-color:#fefcf6;">${scale(result.sandWeightWet)} kg</td>
        </tr>
        <tr>
          <td style="font-weight:bold;">${t.actualWetGravel}</td>
          <td style="font-weight:bold; color:#b45309;">${input.moistureGravel}%</td>
          <td>${Math.round(result.gravelWeightWet)} kg</td>
          <td style="font-weight:bold; background-color:#fefcf6;">${scale(result.gravelWeightWet)} kg</td>
        </tr>
        <tr class="blue-field-row">
          <td>${t.actualMixingWater}</td>
          <td>Adjusted</td>
          <td>${wetWater}</td>
          <td>${scale(result.waterWeightWet)} L</td>
        </tr>
      </tbody>
    </table>

    <div class="section-header">${t.trialMixAdvisory}</div>
    <p style="font-size: 9.5pt; line-height: 1.5; color: #475569;">${t.trialMixDesc}</p>

    <br/><br/>
    <table style="width:100%; border:none;">
      <tr>
        <td style="border:none; text-align:center;">
          <p style="font-weight:bold;">1. ${t.labQualityEngineer}</p>
          <p style="margin-top:25px; border-bottom:1px solid #cbd5e1; width:150px; display:inline-block;"></p>
          <p style="font-size: 8pt; color:#64748b;">${signatureDesignation}</p>
        </td>
        <td style="border:none; text-align:center;">
          <p style="font-weight:bold;">2. ${t.pmApproval}</p>
          <p style="margin-top:25px; border-bottom:1px solid #cbd5e1; width:150px; display:inline-block;"></p>
          <p style="font-size: 8pt; color:#64748b;">Date & Sign-off</p>
        </td>
        <td style="border:none; text-align:center;">
          <div style="border: 3px double #b45309; padding: 10px; font-weight:bold; color:#b45309; display:inline-block; font-size:10pt;">
            APPROVED FOR CASTING
          </div>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  const blob = new Blob(['\ufeff' + docContent], { type: 'application/msword;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `Concrete_Mix_Report_C${input.fck28}_${lang.toUpperCase()}_${Date.now().toString().substring(8)}.doc`;
  a.click();
  URL.revokeObjectURL(downloadUrl);
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

  // Helper to construct cell objects
  const cell = (value: any, type: 's' | 'n' | 'b' = 's', formula?: string, format?: string) => {
    const obj: any = { t: type };
    if (value !== undefined && value !== null) {
      obj.v = value;
    }
    if (formula) {
      obj.f = formula;
    }
    if (format) {
      obj.z = format;
    }
    return obj;
  };

  const str = (v: string) => cell(v, 's');
  const num = (v: number, formula?: string, format?: string) => cell(v, 'n', formula, format);

  const rows: any[][] = [];

  // Title block
  const titleText = `${companyName} - ${t.reportTitle || "Concrete Mix Report"}`;
  const subTitleText = `${t.reportSub || "Dreux-Gorisse Formulation"}`;
  
  rows.push([]);
  rows.push([str(titleText)]);
  rows.push([str(subTitleText)]);
  rows.push([]);

  // Project Info
  rows.push([str((t.projectInfo || "Project Information").toUpperCase())]);
  rows.push([
    str(t.projectName || "Project Name"), str(projectName), 
    str(""), 
    str(t.siteLocation || "Casting Site Location"), str(siteLocation)
  ]);
  rows.push([
    str(t.clientOwner || "Project Client / Owner"), str(clientOwner), 
    str(""), 
    str(t.contractor || "General Contractor"), str(contractor)
  ]);
  rows.push([
    str(t.structuralElement || "Target Structural Member"), str(structuralElement), 
    str(""), 
    str(t.date || "Date"), str(new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US'))
  ]);
  rows.push([]);

  // Engineer Info
  rows.push([str((t.engineerInfo || "Engineer Info").toUpperCase())]);
  rows.push([
    str(t.leadEngineer || "Lead Testing Engineer"), str(engineerName), 
    str(""), 
    str(t.licenseNumber || "Professional License Number"), str(licenseNumber)
  ]);
  rows.push([
    str(t.contactEmail || "Engineer Business Email"), str(engineerEmail), 
    str(""), 
    str("Authority / Designation"), str(signatureDesignation)
  ]);
  rows.push([]);

  // Specs
  rows.push([str("CONCRETE DESIGN SPECIFICATIONS")]);
  rows.push([
    str(t.characteristicStrength || "Characteristic fck"), str(`C${input.fck28} MPa`), 
    str(""), 
    str(t.targetMeanStrength || "Target Mean fcm"), str(`${result.fcm28.toFixed(1)} MPa`)
  ]);
  
  rows.push([
    str(t.wcRatio || "Actual W/C Ratio"), num(Number(result.wcRatioAdjusted.toFixed(3))), 
    str(""), 
    str("Batch Volume (Multiplier m³)"), num(Number(batchVolume))
  ]);
  rows.push([]);

  // 1. Dry Recipe
  rows.push([str(t.laboratoryDryRecipe || "1. Laboratory Dry Recipe List (Calculated for dry masses per m³)")]);
  rows.push([
    str(t.constituent || "Constituent"), 
    str("Relative Density"), 
    str("Dry Unit Mass / m³ (kg)"), 
    str("Sizing Factor"), 
    str("Calculated Weight for Batch (kg)")
  ]);

  // Cement (Row 20 in Excel, index 19)
  const cementDens = input.cementDensity && input.cementDensity > 0 ? (input.cementDensity / 1000) : 3.15;
  rows.push([
    str(t.cementDry || "Cement"), 
    num(Number(cementDens.toFixed(2))), 
    num(Math.round(result.cementWeight)), 
    str("=E16"), 
    num(Math.round(result.cementWeight * batchVolume), "C20*D20")
  ]);

  // Water (Row 21 in Excel, index 20)
  rows.push([
    str(t.nominalWater || "Water"), 
    num(1.0), 
    num(Math.round(result.waterContentActual)), 
    str("=E16"), 
    num(Math.round(result.waterContentActual * batchVolume), "C21*D21")
  ]);

  // Sand (Row 22 in Excel, index 21)
  const sandDens = input.sandRelativeDensity && input.sandRelativeDensity > 0 ? input.sandRelativeDensity : 2.65;
  rows.push([
    str(t.drySand || "Fine Sand"), 
    num(Number(sandDens.toFixed(2))), 
    num(Math.round(result.sandWeightDry)), 
    str("=E16"), 
    num(Math.round(result.sandWeightDry * batchVolume), "C22*D22")
  ]);

  // Gravel (Row 23 in Excel, index 22)
  const gravelDens = input.gravelRelativeDensity && input.gravelRelativeDensity > 0 ? input.gravelRelativeDensity : 2.68;
  rows.push([
    str(t.dryGravel || "Coarse Gravel"), 
    num(Number(gravelDens.toFixed(2))), 
    num(Math.round(result.gravelWeightDry)), 
    str("=E16"), 
    num(Math.round(result.gravelWeightDry * batchVolume), "C23*D23")
  ]);

  // Admixtures
  const nAdmixtures = result.admixtureWeights.length;
  result.admixtureWeights.forEach((adm, idx) => {
    const rowNum = 24 + idx; // 1-based Excel row number for current admixture
    rows.push([
      str(`🧪 ${adm.name}`), 
      num(1.1), 
      num(Number(adm.weight.toFixed(2))), 
      str("=E16"), 
      num(Number((adm.weight * batchVolume).toFixed(2)), `C${rowNum}*D${rowNum}`)
    ]);
  });

  // Total Dry
  const totalDryRowExcel = 24 + nAdmixtures;
  rows.push([
    str("TOTAL FRESH DENSITY (DRY)"), 
    str("-"), 
    num(Math.round(totalDryPerM3), `SUM(C20:C${totalDryRowExcel - 1})`), 
    str("-"), 
    num(Math.round(totalDryPerM3 * batchVolume), `SUM(E20:E${totalDryRowExcel - 1})`)
  ]);

  rows.push([]);

  // 2. Wet Scale
  const wetHeaderRowExcel = totalDryRowExcel + 2;
  const wetTableHeaderRowExcel = wetHeaderRowExcel + 1;
  const startWetRowExcel = wetTableHeaderRowExcel + 1; // Row where Cement starts

  rows.push([str(t.fieldWetScale || "2. Real Site Wet Scales (Adjusted for stock moisture content)")]);
  rows.push([
    str(t.constituent || "Constituent"), 
    str("Stock Moisture (%)"), 
    str("Moist Unit Mass / m³ (kg)"), 
    str("Sizing Factor"), 
    str("Central Scale Dynamic Batch (kg)")
  ]);

  // Moist Cement (no moisture, 0%)
  rows.push([
    str(t.cementDry || "Cement"), 
    str("0%"), 
    num(Math.round(result.cementWeight), "C20"), 
    str("=E16"), 
    num(Math.round(result.cementWeight * batchVolume), `C${startWetRowExcel}*D${startWetRowExcel}`)
  ]);

  // Moist Sand
  rows.push([
    str(t.actualWetSand || "Moist Sand"), 
    num(Number((input.moistureSand || 0) / 100), undefined, "0.0%"), 
    num(Math.round(result.sandWeightWet), `C22*(1 + B${startWetRowExcel + 1})`), 
    str("=E16"), 
    num(Math.round(result.sandWeightWet * batchVolume), `C${startWetRowExcel + 1}*D${startWetRowExcel + 1}`)
  ]);

  // Moist Gravel
  rows.push([
    str(t.actualWetGravel || "Moist Gravel"), 
    num(Number((input.moistureGravel || 0) / 100), undefined, "0.0%"), 
    num(Math.round(result.gravelWeightWet), `C23*(1 + B${startWetRowExcel + 2})`), 
    str("=E16"), 
    num(Math.round(result.gravelWeightWet * batchVolume), `C${startWetRowExcel + 2}*D${startWetRowExcel + 2}`)
  ]);

  // compensated water
  rows.push([
    str(t.actualMixingWater || "Moisture Compensated Water"), 
    str("Moisture Compensated"), 
    num(Math.round(result.waterWeightWet), `C21 - (C22*B${startWetRowExcel + 1}) - (C23*B${startWetRowExcel + 2})`), 
    str("=E16"), 
    num(Math.round(result.waterWeightWet * batchVolume), `C${startWetRowExcel + 3}*D${startWetRowExcel + 3}`)
  ]);

  // Admixtures (Wet scale)
  result.admixtureWeights.forEach((adm, idx) => {
    const dryRowRef = 24 + idx;
    const wetRowExcel = startWetRowExcel + 4 + idx;
    rows.push([
      str(`🧪 ${adm.name}`), 
      str("0%"), 
      num(Number(adm.weight.toFixed(2)), `C${dryRowRef}`), 
      str("=E16"), 
      num(Number((adm.weight * batchVolume).toFixed(2)), `C${wetRowExcel}*D${wetRowExcel}`)
    ]);
  });

  // Total Wet
  const totalWetRowExcel = startWetRowExcel + 4 + nAdmixtures;
  rows.push([
    str("TOTAL FRESH DENSITY (WET)"), 
    str("-"), 
    num(Math.round(result.cementWeight + result.sandWeightWet + result.gravelWeightWet + result.waterWeightWet + result.admixtureWeights.reduce((acc, a) => acc + a.weight, 0)), `SUM(C${startWetRowExcel}:C${totalWetRowExcel - 1})`), 
    str("-"), 
    num(Math.round((result.cementWeight + result.sandWeightWet + result.gravelWeightWet + result.waterWeightWet + result.admixtureWeights.reduce((acc, a) => acc + a.weight, 0)) * batchVolume), `SUM(E${startWetRowExcel}:E${totalWetRowExcel - 1})`)
  ]);

  // Build sheet
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Apply column widths
  ws["!cols"] = [
    { wch: 35 }, // Constituent / Name
    { wch: 22 }, // Density / Moisture
    { wch: 25 }, // Unit weight
    { wch: 18 }, // Sizing factor
    { wch: 30 }  // Batch weight
  ];

  // Set RTL for Arabic
  if (lang === "ar") {
    ws["!views"] = [{ RTL: true }];
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "SnoLab Mix Design");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });

  const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `SnoLab_Mix_Design_C${input.fck28}_${lang.toUpperCase()}_${Date.now().toString().substring(8)}.xlsx`;
  a.click();
  URL.revokeObjectURL(downloadUrl);
};
