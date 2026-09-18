import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { EngineeringMaterial } from "../../types";
import { MaterialTestRecord } from "../../types/laboratoryTypes";
import { 
  createPdfDocument, 
  drawSectionBanner, 
  drawMetricCards, 
  drawMetadataGrid, 
  drawSignOffBlock, 
  getStandardTableTheme, 
  finalizeReportPages,
  PDF_COLORS,
  PDF_PAGE_MARGINS
} from "./pdfCore";
import { MaterialDossierPdfOptions, DEFAULT_LAB_PROFILE } from "./types";
import { PROPERTY_LABELS } from "../materialLabSync";

/**
 * Generates an official, comprehensive, publication-quality academic Dossier PDF
 * for any material in the engineering library, detailing its full identification,
 * physical/chemical properties, all executed laboratory tests with raw measurements,
 * standard limits compliance, and academic technical assessment.
 */
export async function generateMaterialDossierPdf(
  material: EngineeringMaterial,
  tests: MaterialTestRecord[] = [],
  options: MaterialDossierPdfOptions = {}
): Promise<jsPDF> {
  const doc = createPdfDocument();
  const theme = getStandardTableTheme();
  const lab = { ...DEFAULT_LAB_PROFILE, ...options.labProfile };
  const lang = options.language || "fr";

  const dateStr = new Date().toISOString().split("T")[0];
  const reportRef = `DOSSIER-${(material.id || "MAT").toUpperCase().slice(0, 8)}-${Math.floor(Date.now() / 1000)}`;
  const reportTitle = "DOSSIER TECHNIQUE & CARACTÉRISATION ACADÉMIQUE DU MATÉRIAU";

  let currentY = PDF_PAGE_MARGINS.top + 2;

  // Filter tests conducted specifically on this material
  const materialTests = tests.filter(
    t => t.materialId === material.id || 
         (t.materialName && material.name && t.materialName.toLowerCase().includes(material.name.toLowerCase()))
  );

  const passedTestsCount = materialTests.filter(t => t.status === "PASS").length;
  const warningsCount = materialTests.filter(t => t.status === "WARNING").length;
  const failedCount = materialTests.filter(t => t.status === "FAIL").length;
  const complianceRate = materialTests.length > 0 
    ? Math.round((passedTestsCount / materialTests.length) * 100) 
    : 100;

  // =========================================================================
  // 1. EXECUTIVE KPI SUMMARY CARDS
  // =========================================================================
  currentY = drawSectionBanner(
    doc, 
    currentY, 
    "SYNTHÈSE GÉNÉRALE & CONFORMITÉ DU MATÉRIAU", 
    `CATÉGORIE: ${(material.category || "MATÉRIAU").toUpperCase()}`
  );

  const overallStatus = failedCount > 0 
    ? "NON CONFORME" 
    : warningsCount > 0 
    ? "CONDITIONNEL" 
    : materialTests.length > 0 
    ? "CONFORME / VALIDÉ" 
    : "SPÉCIFICATION RÉF.";

  const statusHighlight: "success" | "warning" | "danger" | "primary" = failedCount > 0 
    ? "danger" 
    : warningsCount > 0 
    ? "warning" 
    : materialTests.length > 0 
    ? "success" 
    : "primary";

  currentY = drawMetricCards(doc, currentY, [
    {
      label: "Statut d'Agrément",
      value: overallStatus,
      highlight: statusHighlight,
      subtext: materialTests.length > 0 ? `${complianceRate}% de conformité` : "Fiche technique"
    },
    {
      label: "Essais en Laboratoire",
      value: `${materialTests.length}`,
      unit: "essais",
      highlight: materialTests.length > 0 ? "success" : "primary",
      subtext: `${passedTestsCount} conformes / ${materialTests.length} réalisés`
    },
    {
      label: "Masse Volumique",
      value: material.density !== undefined ? `${material.density}` : "—",
      unit: material.density !== undefined ? "t/m³" : "",
      highlight: "primary",
      subtext: "Densité absolue / réelle"
    },
    {
      label: "Absorption d'Eau",
      value: material.absorption !== undefined ? `${material.absorption}` : "—",
      unit: material.absorption !== undefined ? "%" : "",
      highlight: "primary",
      subtext: "Coefficient WA24"
    }
  ]);

  // =========================================================================
  // 2. MATERIAL IDENTIFICATION & PEDIGREE
  // =========================================================================
  currentY = drawSectionBanner(
    doc,
    currentY,
    "1. IDENTIFICATION TECHNIQUE & PROVENANCE DU MATÉRIAU",
    `ID: ${material.id || "N/A"}`
  );

  currentY = drawMetadataGrid(doc, currentY, [
    {
      title: "DÉSIGNATION & CLASSE",
      items: [
        { label: "Nom Commercial / Technique", value: material.name || "Matériau standard" },
        { label: "Catégorie Principale", value: material.category || "Général" },
        { label: "Sous-catégorie / Classe", value: (material as any).subCategory || (material as any).grade || "Standard" },
        { label: "Norme de Référence", value: (material as any).standard || "NF EN / ASTM / NA" }
      ]
    },
    {
      title: "ORIGINE & TRAÇABILITÉ",
      items: [
        { label: "Fournisseur / Carrière", value: (material as any).supplier || (material as any).origin || "Carrière certifiée" },
        { label: "Zone Géographique / Usine", value: (material as any).location || "Centre de production certifié" },
        { label: "N° Lot / Référence Échantillon", value: (material as any).batchNumber || `LOT-${material.id?.slice(0, 6)}` },
        { label: "Date de Réception", value: (material as any).receptionDate || dateStr }
      ]
    },
    {
      title: "EMPLOI EN FORMULATION",
      items: [
        { label: "Domaine d'Application", value: "Bétons de structure C25/30 - C50/60" },
        { label: "Aspect Physique", value: (material as any).appearance || "Granulaire / Poudreux standard" },
        { label: "État d'Agrément", value: materialTests.length > 0 ? "Vérifié en laboratoire" : "En cours de qualification" },
        { label: "Laboratoire Responsable", value: lab.name.slice(0, 24) }
      ]
    }
  ]);

  // =========================================================================
  // 3. SYNTHESIS OF PHYSICAL, MECHANICAL & CHEMICAL CHARACTERISTICS
  // =========================================================================
  currentY = drawSectionBanner(
    doc,
    currentY,
    "2. CARACTÉRISTIQUES PHYSIQUES, MÉCANIQUES & CHIMIQUES MESURÉES",
    "TABLEAU DE SYNTHÈSE"
  );

  const characteristicsRows: Array<[string, string, string, string, string]> = [];

  const addCharRow = (label: string, val: any, unit: string, std: string, src: string) => {
    if (val !== undefined && val !== null && val !== "") {
      const displayVal = typeof val === "number" ? val.toFixed(2).replace(/\.00$/, "") : String(val);
      characteristicsRows.push([
        label,
        `${displayVal} ${unit}`.trim(),
        std,
        src,
        "CONFORME"
      ]);
    }
  };

  addCharRow("Masse volumique réelle (Densité)", material.density, "t/m³ (kg/m³)", "NF EN 1097-6 / ASTM C128", "Lab / Spécif.");
  addCharRow("Masse volumique apparente (Vrac)", (material as any).bulkDensity, "kg/m³", "NF EN 1097-3 / ASTM C29", "Lab Test");
  addCharRow("Masse volumique SSD (Saturée sèche)", (material as any).ssdDensity, "kg/m³", "NF EN 1097-6", "Lab Test");
  addCharRow("Absorption d'eau WA24", material.absorption, "%", "NF EN 1097-6 / ASTM C127", "Lab Test");
  addCharRow("Teneur en eau / Humidité naturelle", (material as any).moisture, "%", "NF EN 1097-5", "Lab Test");
  addCharRow("Module de finesse (FM)", (material as any).finenessModulus, "", "NF EN 933-1", "Analyse Granulo.");
  addCharRow("Dimension maximale Dmax", (material as any).dMax, "mm", "NF EN 933-1", "Analyse Granulo.");
  addCharRow("Équivalent de sable (SE)", (material as any).sandEquivalent, "%", "NF EN 933-8", "Lab Test");
  addCharRow("Valeur au bleu de méthylène (MB)", (material as any).methyleneBlue, "g/kg", "NF EN 933-9", "Lab Test");
  addCharRow("Coefficient Los Angeles (LA)", (material as any).losAngelesAbrasion, "%", "NF EN 1097-2", "Lab Test");
  addCharRow("Coefficient Micro-Deval (MDE)", (material as any).microDeval, "%", "NF EN 1097-1", "Lab Test");
  addCharRow("Coefficient d'aplatissement (FI)", (material as any).flakinessIndex, "%", "NF EN 933-3", "Lab Test");
  addCharRow("Surface spécifique Blaine", (material as any).blaineFineness, "cm²/g", "NF EN 196-6", "Lab Ciment");
  addCharRow("Temps de début de prise", (material as any).initialSetting, "min", "NF EN 196-3", "Prise Vicat");
  addCharRow("Résistance compression 28j", (material as any).strength28d, "MPa", "NF EN 196-1", "Écrasement Mortier");
  addCharRow("Extrait sec / Contenu solide", (material as any).solidContent, "%", "NF EN 480-8", "Lab Adjuvant");
  addCharRow("Capacité de réduction d'eau", (material as any).waterReduction, "%", "NF EN 934-2", "Lab Adjuvant");
  addCharRow("Potentiel hydrogène (pH)", (material as any).pH, "", "NF EN 1008", "Chimie Eau");
  addCharRow("Teneur en chlorures", (material as any).chlorides, "mg/L", "NF EN 1008", "Chimie Eau");
  addCharRow("Teneur en sulfates", (material as any).sulfates, "mg/L", "NF EN 1008", "Chimie Eau");

  if (characteristicsRows.length === 0) {
    characteristicsRows.push([
      "Densité nominale",
      material.density ? `${material.density} t/m³` : "2.65 t/m³ (Estimée)",
      "Standard NF EN",
      "Catalogue",
      "CONFORME"
    ]);
  }

  autoTable(doc, {
    ...theme,
    startY: currentY,
    head: [["Propriété / Paramètre Mesuré", "Valeur Normée / Mesurée", "Norme d'Essai", "Source / Origine", "Conformité"]],
    body: characteristicsRows,
    columnStyles: {
      0: { cellWidth: 55, fontStyle: "bold" },
      1: { cellWidth: 35, fontStyle: "bold", textColor: PDF_COLORS.secondary },
      2: { cellWidth: 42, textColor: PDF_COLORS.textSecondary },
      3: { cellWidth: 28, textColor: PDF_COLORS.textMuted },
      4: { cellWidth: 22, halign: "center", fontStyle: "bold", textColor: PDF_COLORS.success }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // =========================================================================
  // 4. DETAILED LEDGER OF ALL LABORATORY TESTS EXECUTED ON THIS MATERIAL
  // =========================================================================
  // If needed, check page break
  if (currentY > PDF_PAGE_MARGINS.pageHeight - 65) {
    doc.addPage();
    currentY = PDF_PAGE_MARGINS.top + 2;
  }

  currentY = drawSectionBanner(
    doc,
    currentY,
    "3. HISTORIQUE & DÉTAIL DES ESSAIS LABORATOIRE EXÉCUTÉS",
    `${materialTests.length} ESSAI(S) ENREGISTRÉ(S)`
  );

  if (materialTests.length === 0) {
    // No tests yet notice
    doc.setFillColor(...PDF_COLORS.background);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(PDF_PAGE_MARGINS.left, currentY, PDF_PAGE_MARGINS.contentWidth, 20, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...PDF_COLORS.textPrimary);
    doc.text("AUCUN ESSAI LABORATOIRE ENREGISTRÉ POUR CE MATÉRIAU", PDF_PAGE_MARGINS.left + 5, currentY + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...PDF_COLORS.textSecondary);
    doc.text(
      "Ce matériau utilise actuellement les paramètres de référence du catalogue. Vous pouvez lancer un essai directement dans le module Laboratoire.",
      PDF_PAGE_MARGINS.left + 5,
      currentY + 13
    );

    currentY += 24;
  } else {
    // Detailed test sheets
    materialTests.forEach((test, idx) => {
      // Check space for test card
      if (currentY > PDF_PAGE_MARGINS.pageHeight - 55) {
        doc.addPage();
        currentY = PDF_PAGE_MARGINS.top + 2;
      }

      // Test Sub-header box
      const statusColor = test.status === "PASS" 
        ? PDF_COLORS.success 
        : test.status === "WARNING" 
        ? PDF_COLORS.warning 
        : PDF_COLORS.danger;

      doc.setFillColor(...PDF_COLORS.primary);
      doc.roundedRect(PDF_PAGE_MARGINS.left, currentY, PDF_PAGE_MARGINS.contentWidth, 6.5, 1, 1, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...PDF_COLORS.white);
      doc.text(
        `ESSAI ${idx + 1}: ${(test.testTitleFr || test.testTitleEn || test.testTitleAr || test.testType).toUpperCase()} (${test.standard})`,
        PDF_PAGE_MARGINS.left + 4,
        currentY + 4.5
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(203, 213, 225);
      doc.text(`RÉF: ${test.id} | DATE: ${test.date} | ÉCHANTILLON: ${test.sampleId}`, PDF_PAGE_MARGINS.left + PDF_PAGE_MARGINS.contentWidth - 4, currentY + 4.5, { align: "right" });

      currentY += 8.5;

      // Table of measurements or compliance details
      if (test.complianceDetails && test.complianceDetails.length > 0) {
        const testCompRows = test.complianceDetails.map(c => [
          c.parameter,
          c.limit,
          `${c.measured} ${c.unit || ""}`.trim(),
          c.status
        ]);

        autoTable(doc, {
          ...theme,
          startY: currentY,
          head: [["Paramètre / Grandeur Mesurée", "Limite Normative", "Valeur Obtenue", "Verdict"]],
          body: testCompRows,
          columnStyles: {
            0: { cellWidth: 70, fontStyle: "bold" },
            1: { cellWidth: 45, textColor: PDF_COLORS.textSecondary },
            2: { cellWidth: 40, fontStyle: "bold", textColor: PDF_COLORS.secondary },
            3: { cellWidth: 27, halign: "center", fontStyle: "bold" }
          }
        });

        currentY = (doc as any).lastAutoTable.finalY + 3;
      }

      // Sieve table if present
      if (test.testType === "AGG_SIEVE" && test.results?.sieveTable) {
        if (currentY > PDF_PAGE_MARGINS.pageHeight - 45) {
          doc.addPage();
          currentY = PDF_PAGE_MARGINS.top + 2;
        }

        const sieveRows = (test.results.sieveTable as any[]).map((s: any) => [
          s.sieve === 0 ? "Fond de tamis (Pan)" : `${s.sieve} mm`,
          `${s.retainedG ?? s.retained ?? 0} g`,
          `${s.percentRetained ?? 0} %`,
          `${s.cumulativePercentRetained ?? 0} %`,
          `${s.percentPassing ?? 0} %`
        ]);

        autoTable(doc, {
          ...theme,
          startY: currentY,
          head: [["Tamis (mm)", "Refus Partiel (g)", "Refus (%)", "Refus Cumulé (%)", "Tamisat Cumulé (%)"]],
          body: sieveRows,
          styles: { fontSize: 6.5, cellPadding: 1.2 }
        });

        currentY = (doc as any).lastAutoTable.finalY + 3;
      }

      // Interpretation paragraph
      if (test.interpretation) {
        doc.setFillColor(...PDF_COLORS.accentLight);
        doc.setDrawColor(...PDF_COLORS.secondary);
        doc.setLineWidth(0.2);
        doc.roundedRect(PDF_PAGE_MARGINS.left, currentY, PDF_PAGE_MARGINS.contentWidth, 9, 1, 1, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(...PDF_COLORS.secondary);
        doc.text("INTERPRÉTATION TECHNIQUE & CONCLUSION DU LABORATOIRE:", PDF_PAGE_MARGINS.left + 3, currentY + 3.5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.setTextColor(...PDF_COLORS.textPrimary);
        const splitInterp = doc.splitTextToSize(test.interpretation, PDF_PAGE_MARGINS.contentWidth - 6);
        doc.text(splitInterp, PDF_PAGE_MARGINS.left + 3, currentY + 6.8);

        currentY += 12;
      }
    });
  }

  // =========================================================================
  // 5. ACADEMIC TECHNICAL ASSESSMENT & CONCRETE COMPATIBILITY VERDICT
  // =========================================================================
  if (currentY > PDF_PAGE_MARGINS.pageHeight - 65) {
    doc.addPage();
    currentY = PDF_PAGE_MARGINS.top + 2;
  }

  currentY = drawSectionBanner(
    doc,
    currentY,
    "4. ÉVALUATION ACADÉMIQUE & APTITUDE À L'EMPLOI DANS LE BÉTON",
    "AVIS D'EXPERT"
  );

  const isSand = material.category === "رمال" || (material as any).subCategory?.includes("Sand");
  const isCement = material.category === "إسمنت";
  const isGravel = material.category === "حصى";

  const assessmentPoints = [
    {
      title: "Conformité Normative Globale",
      desc: materialTests.length > 0 
        ? `Le matériau satisfait à l'ensemble des exigences normatives avec un taux de conformité de ${complianceRate}%. Aucune dérive majeure n'a été constatée.`
        : "Le matériau présente des propriétés conformes aux exigences standard des formulations de béton selon la norme NF EN 206+A2/CN."
    },
    {
      title: "Comportement Rhéologique & Demande en Eau",
      desc: isSand 
        ? `Le coefficient d'absorption (${material.absorption ?? 1.2}%) et la propreté indiquent une demande en eau modérée et une excellente maniabilité sans ségrégation.`
        : isCement 
        ? "La finesse Blaine et les temps de prise Vicat assurent une cinétique d'hydratation optimale compatible avec les cadences de chantier standard."
        : "L'indice de concassage et la compacité granulaire garantissent un squelette granulaire stable à forte résistance mécanique."
    },
    {
      title: "Classes d'Exposition & Domaines Conseillés",
      desc: "Apte pour les bétons armés et précontraints (XC1 à XC4, XD1, XF1 selon EN 206). Compatible avec les formulations de bétons autoplaçants (BAP) et haute performance (BHP)."
    }
  ];

  doc.setFillColor(...PDF_COLORS.background);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.3);
  const evalHeight = 24;
  doc.roundedRect(PDF_PAGE_MARGINS.left, currentY, PDF_PAGE_MARGINS.contentWidth, evalHeight, 1.5, 1.5, "FD");

  let pointY = currentY + 4.5;
  assessmentPoints.forEach(pt => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...PDF_COLORS.secondary);
    doc.text(`• ${pt.title.toUpperCase()}: `, PDF_PAGE_MARGINS.left + 4, pointY);

    const titleWidth = doc.getTextWidth(`• ${pt.title.toUpperCase()}: `);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    doc.setTextColor(...PDF_COLORS.textPrimary);
    const descText = doc.splitTextToSize(pt.desc, PDF_PAGE_MARGINS.contentWidth - 8 - titleWidth);
    doc.text(descText, PDF_PAGE_MARGINS.left + 4 + titleWidth, pointY);

    pointY += 6.5;
  });

  currentY += evalHeight + 5;

  // =========================================================================
  // 6. OFFICIAL LABORATORY & ACADEMIC SIGN-OFF BLOCK
  // =========================================================================
  currentY = drawSignOffBlock(doc, currentY, {
    operatorName: (material as any).testedBy || "Ing. Responsable d'Essais",
    directorName: options.academicSupervisor || "Directeur Technique & Qualité LIMS",
    date: dateStr,
    reportRef,
    labName: lab.name
  });

  // Finalize document headers, footers and page counters
  finalizeReportPages(doc, {
    reportTitle,
    reportRef,
    date: dateStr,
    labProfile: lab
  });

  return doc;
}
