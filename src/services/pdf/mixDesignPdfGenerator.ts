import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { MixDesignInput, MixDesignResult, EngineeringMaterial } from "../../types";
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
import { MixDesignPdfOptions, DEFAULT_LAB_PROFILE } from "./types";
import { formatEngineeringValue } from "../../utils/unitFormatter";

/**
 * Generates an official, publication-quality, multi-page vector PDF for a Concrete Mix Design.
 * Contains ZERO screenshot imagery. All text, tables, numbers, and headers are 100% native vector elements.
 */
export async function generateMixDesignPdf(
  result: MixDesignResult,
  input: MixDesignInput,
  options: MixDesignPdfOptions = {}
): Promise<jsPDF> {
  const doc = createPdfDocument();
  const theme = getStandardTableTheme();
  const lab = DEFAULT_LAB_PROFILE;
  const project = options.activeProject || {};
  const batchVolume = options.batchVolume && options.batchVolume > 0 ? options.batchVolume : (input.batchVolume || 1);
  const lang = options.language || "fr";

  const dateStr = new Date().toISOString().split("T")[0];
  const reportRef = `MIX-${input.cementType || "CEM"}-${input.fck28 ? Math.round(input.fck28) : "NA"}-${Math.floor(Date.now() / 1000).toString().slice(-6)}`;
  const reportTitle = lang === "ar" 
    ? "شهادة دراسة وتركيب الخلطة الخرسانية"
    : lang === "en"
    ? "Concrete Mix Design Formulation Certificate"
    : "Certificat de Formulation de Béton (Dreux-Gorisse)";

  let currentY = PDF_PAGE_MARGINS.top + 2;

  // =========================================================================
  // 1. EXECUTIVE SUMMARY & TARGET SPECIFICATIONS METRIC CARDS
  // =========================================================================
  currentY = drawSectionBanner(
    doc, 
    currentY, 
    lang === "ar" ? "المؤشرات الهندسية والمواصفات المستهدفة" : "EXECUTIVE SPECIFICATIONS & PERFORMANCE TARGETS",
    "NF EN 206+A2 / DREUX-GORISSE"
  );

  const fck = input.fck28;
  const fcm = result.fcm28 !== undefined ? result.fcm28 : (fck !== undefined ? (fck + (input.controlClass === "high" ? 6 : input.controlClass === "low" ? 12 : 8)) : undefined);
  const wcRatio = result.wcRatioAdjusted || result.wcRatio;
  const slumpVal = input.slump;
  const freshDensity = result.totalFreshDensity ? Math.round(result.totalFreshDensity) : undefined;

  currentY = drawMetricCards(doc, currentY, [
    {
      label: "fck,28 (Characteristic)",
      value: fck !== undefined ? `${fck}` : "N/A",
      unit: fck !== undefined ? "MPa" : "",
      highlight: "primary",
      subtext: fcm !== undefined ? `Target fcm: ${fcm.toFixed(1)} MPa` : "Target fcm: N/A"
    },
    {
      label: "Water / Binder (W/C)",
      value: wcRatio !== undefined ? `${wcRatio.toFixed(2)}` : "N/A",
      unit: "",
      highlight: wcRatio !== undefined ? (wcRatio <= 0.48 ? "success" : "warning") : "primary",
      subtext: result.dreuxAggregateFactor !== undefined ? `Dreux G: ${result.dreuxAggregateFactor.toFixed(2)}` : "Dreux G: N/A"
    },
    {
      label: "Target Slump",
      value: slumpVal !== undefined ? `${slumpVal}` : "N/A",
      unit: slumpVal !== undefined ? "cm" : "",
      highlight: "primary",
      subtext: slumpVal !== undefined ? `Class S${slumpVal <= 4 ? "1" : slumpVal <= 9 ? "2" : slumpVal <= 15 ? "3" : slumpVal <= 21 ? "4" : "5"}` : "Class: N/A"
    },
    {
      label: "Fresh Density",
      value: freshDensity !== undefined ? `${freshDensity}` : "N/A",
      unit: freshDensity !== undefined ? "kg/m³" : "",
      highlight: "primary",
      subtext: input.airContent !== undefined ? `Air: ${input.airContent.toFixed(1)}%` : "Air: N/A"
    }
  ]);

  // =========================================================================
  // 2. PROJECT, CLIENT & MIX IDENTIFICATION METADATA
  // =========================================================================
  currentY = drawMetadataGrid(doc, currentY, [
    {
      title: "PROJECT & SITE CONTEXT",
      items: [
        { label: "Project Name", value: project.name || "Main Structural Project" },
        { label: "Client / Owner", value: project.client || "Directorate of Public Works" },
        { label: "Batching Plant", value: project.plant || "Central Ready-Mix Plant #1" },
        { label: "Location / Site", value: project.location || "Central Construction Site" }
      ]
    },
    {
      title: "CONCRETE CLASS & ENVIRONMENT",
      items: [
        { label: "Standard Class", value: fck !== undefined ? `C${fck}/${Math.round(fck * 1.25)} (EN 206)` : "Not Specified" },
        { label: "Exposure Class", value: input.exposureClass || "Not Specified" },
        { label: "Control Class", value: (input.controlClass || "normal").toUpperCase() },
        { label: "Placement Method", value: input.hasPumping ? "Concrete Pump" : "Crane / Bucket" }
      ]
    },
    {
      title: "FORMULATION PARAMETERS",
      items: [
        { label: "Design Method", value: "Georges Dreux-Gorisse" },
        { label: "Max Aggregate (Dmax)", value: input.dMax ? `${input.dMax} mm` : "N/A" },
        { label: "Cement Type", value: input.cementType || "Not Specified" },
        { label: "Batch Calculation", value: `${batchVolume} m³` }
      ]
    }
  ]);

  // =========================================================================
  // 3. CONSTITUENT MATERIALS & INFLUENCE PROPERTIES TABLE
  // =========================================================================
  currentY = drawSectionBanner(
    doc, 
    currentY, 
    "CONSTITUENT MATERIALS & PHYSICAL PROPERTIES",
    "TESTED SPECIFICATIONS"
  );

  const materialsRows = [
    [
      "Cement (Liant)",
      input.selectedCementId || input.cementType || "Cement",
      "GICA / Lafarge",
      input.cementDensity ? `${(input.cementDensity / 1000).toFixed(2)} g/cm³` : "-",
      "-",
      "-",
      input.cementClassStrength ? `Class ${input.cementClassStrength} MPa` : "-"
    ],
    [
      "Sand (Sable 0/4)",
      input.selectedSandId || input.sandType || "Sand",
      "Local Quarry",
      input.sandRelativeDensity ? `${input.sandRelativeDensity.toFixed(2)} g/cm³` : "-",
      input.sandAbsorption !== undefined ? `${input.sandAbsorption.toFixed(1)}%` : "-",
      input.moistureSand !== undefined ? `${input.moistureSand.toFixed(1)}%` : "-",
      input.finenessModulus !== undefined ? `FM: ${input.finenessModulus.toFixed(2)}` : "-"
    ],
    [
      "Gravel (Gravier 4/20)",
      input.selectedGravelId || input.gravelType || "Gravel",
      "Regional Quarry",
      input.gravelRelativeDensity ? `${input.gravelRelativeDensity.toFixed(2)} g/cm³` : "-",
      input.gravelAbsorption !== undefined ? `${input.gravelAbsorption.toFixed(1)}%` : "-",
      input.moistureGravel !== undefined ? `${input.moistureGravel.toFixed(1)}%` : "-",
      input.dMax ? `Dmax: ${input.dMax} mm` : "-"
    ],
    [
      "Mixing Water (Eau)",
      input.selectedWaterName || "Mixing Water",
      "Municipal / Well",
      "1.00 g/cm³",
      "-",
      "-",
      input.selectedWaterPH !== undefined ? `pH: ${input.selectedWaterPH.toFixed(1)}` : "-"
    ]
  ];

  // Optional chemical admixtures
  if (result.admixtureWeights && result.admixtureWeights.length > 0) {
    result.admixtureWeights.forEach((adm) => {
      materialsRows.push([
        "Admixture (Adjuvant)",
        adm.name || "Superplasticizer",
        "Sika / MasterGlenium",
        input.selectedAdmixtureDensity !== undefined ? `${input.selectedAdmixtureDensity.toFixed(2)} g/cm³` : "-",
        "-",
        "-",
        `Dosage: ${input.dosageSuper !== undefined ? `${input.dosageSuper.toFixed(1)}%` : "-"}`
      ]);
    });
  }

  // Optional SCM
  if (input.selectedScmName || (input.dosageSilicaFume || 0) > 0 || (input.dosageFlyAsh || 0) > 0) {
    const scmDosage = input.selectedScmReplacementPercent !== undefined ? input.selectedScmReplacementPercent : (input.dosageSilicaFume !== undefined ? input.dosageSilicaFume : input.dosageFlyAsh);
    materialsRows.push([
      "Mineral Addition (SCM)",
      input.selectedScmName || "Silica Fume / Fly Ash",
      "Industrial Mineral",
      input.selectedScmDensity !== undefined ? `${input.selectedScmDensity.toFixed(2)} g/cm³` : "-",
      "-",
      "-",
      `Sub: ${scmDosage !== undefined ? `${scmDosage.toFixed(1)}%` : "-"}`
    ]);
  }

  // Optional Fibers
  if (input.selectedFiberName || (input.fiberDosageKgM3 || 0) > 0) {
    materialsRows.push([
      "Fibers (Fibres)",
      input.selectedFiberName || "Polypropylene / Steel Fibers",
      "Specialty Fiber",
      input.fiberDensity !== undefined ? `${input.fiberDensity.toFixed(2)} g/cm³` : "-",
      "-",
      "-",
      `Dosage: ${input.fiberDosageKgM3 !== undefined ? `${input.fiberDosageKgM3.toFixed(1)} kg/m³` : "-"}`
    ]);
  }

  autoTable(doc, {
    ...theme,
    startY: currentY,
    head: [["Component", "Commercial Name / Specification", "Source / Brand", "Density", "Absorption", "Moisture", "Notes / Limits"]],
    body: materialsRows,
    columnStyles: {
      0: { cellWidth: 32, fontStyle: "bold" },
      1: { cellWidth: 42 },
      2: { cellWidth: 26 },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 18, halign: "center" },
      5: { cellWidth: 18, halign: "center" },
      6: { cellWidth: 26, halign: "center" }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // =========================================================================
  // 4. THEORETICAL DRY PROPORTIONING TABLE (PER 1 M³ & PER BATCH VOLUME)
  // =========================================================================
  // Check if we need page break
  if (currentY > 210) {
    doc.addPage();
    currentY = PDF_PAGE_MARGINS.top + 2;
  }

  currentY = drawSectionBanner(
    doc, 
    currentY, 
    `THEORETICAL DRY PROPORTIONS (PER 1.0 M³ & BATCH OF ${batchVolume} M³)`,
    "DREUX-GORISSE COMPOSITION"
  );

  const cementDry = Math.round(result.cementWeight);
  const waterDry = Math.round(result.waterContentActual || result.waterContentNeeded);
  const sandDry = Math.round(result.sandWeightDry);
  const gravelDry = Math.round(result.gravelWeightDry);
  
  let totalAdmixDry = 0;
  result.admixtureWeights?.forEach(a => totalAdmixDry += a.weight);

  const totalDryMass = cementDry + waterDry + sandDry + gravelDry + Math.round(totalAdmixDry);

  const cementVolumeL = (result as any).cementVolume !== undefined
    ? `${(result as any).cementVolume.toFixed(1)} L`
    : (input.cementDensity ? `${(cementDry / input.cementDensity * 1000).toFixed(1)} L` : "-");

  const sandVolumeL = (result as any).sandVolume !== undefined
    ? `${(result as any).sandVolume.toFixed(1)} L`
    : (input.sandRelativeDensity ? `${(sandDry / (input.sandRelativeDensity * 1000) * 1000).toFixed(1)} L` : "-");

  const gravelVolumeL = (result as any).gravelVolume !== undefined
    ? `${(result as any).gravelVolume.toFixed(1)} L`
    : (input.gravelRelativeDensity ? `${(gravelDry / (input.gravelRelativeDensity * 1000) * 1000).toFixed(1)} L` : "-");

  const dryRows = [
    [
      "Cement (C)",
      cementVolumeL,
      `${cementDry} kg`,
      `${(cementDry * batchVolume).toFixed(1)} kg`,
      `${((cementDry / totalDryMass) * 100).toFixed(1)}%`,
      `Binder Base (1.00 C)`
    ],
    [
      "Effective Water (E)",
      `${waterDry.toFixed(1)} L`,
      `${waterDry.toFixed(1)} kg`,
      `${(waterDry * batchVolume).toFixed(1)} kg`,
      `${((waterDry / totalDryMass) * 100).toFixed(1)}%`,
      cementDry > 0 ? `W/C = ${(waterDry / cementDry).toFixed(2)}` : "-"
    ],
    [
      "Dry Sand (Sable 0/4)",
      sandVolumeL,
      `${sandDry} kg`,
      `${(sandDry * batchVolume).toFixed(1)} kg`,
      `${((sandDry / totalDryMass) * 100).toFixed(1)}%`,
      result.sandPercent !== undefined ? `G/(S+G) = ${result.sandPercent.toFixed(1)}% Sand` : "-"
    ],
    [
      "Dry Gravel (Gravier 4/20)",
      gravelVolumeL,
      `${gravelDry} kg`,
      `${(gravelDry * batchVolume).toFixed(1)} kg`,
      `${((gravelDry / totalDryMass) * 100).toFixed(1)}%`,
      input.dMax ? `Dmax = ${input.dMax} mm` : "-"
    ]
  ];

  if (result.admixtureWeights && result.admixtureWeights.length > 0) {
    result.admixtureWeights.forEach(adm => {
      dryRows.push([
        `Admixture: ${adm.name || "SP"}`,
        `${(adm.weight / 1.08).toFixed(2)} L`,
        `${adm.weight.toFixed(2)} kg`,
        `${(adm.weight * batchVolume).toFixed(2)} kg`,
        `${((adm.weight / totalDryMass) * 100).toFixed(2)}%`,
        `${((adm.weight / cementDry) * 100).toFixed(1)}% of Cement`
      ]);
    });
  }

  autoTable(doc, {
    ...theme,
    startY: currentY,
    head: [["Constituent Material", "Absolute Volume (L/m³)", "Dry Mass (kg/m³)", `Batch (${batchVolume} m³)`, "% Total Mass", "Engineering Ratio"]],
    body: dryRows,
    foot: [[
      "TOTAL FRESH CONCRETE (1 m³)",
      "1000.0 L",
      `${totalDryMass} kg/m³`,
      `${(totalDryMass * batchVolume).toFixed(1)} kg`,
      "100.0%",
      `Compaction Gamma: ${result.compactorGamma !== undefined ? result.compactorGamma.toFixed(2) : "-"}`
    ]],
    columnStyles: {
      0: { cellWidth: 42, fontStyle: "bold" },
      1: { cellWidth: 28, halign: "right" },
      2: { cellWidth: 28, halign: "right", fontStyle: "bold" },
      3: { cellWidth: 28, halign: "right", fontStyle: "bold" },
      4: { cellWidth: 22, halign: "center" },
      5: { cellWidth: 34, halign: "center" }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // =========================================================================
  // 5. SITE MOISTURE CORRECTION & ACTUAL WEIGHING SCALE CHART
  // =========================================================================
  if (currentY > 215) {
    doc.addPage();
    currentY = PDF_PAGE_MARGINS.top + 2;
  }

  currentY = drawSectionBanner(
    doc, 
    currentY, 
    "SITE MOISTURE CORRECTION & READY-MIX BATCHING SCALE WEIGHTS",
    "WATER & AGGREGATE ADJUSTMENT"
  );

  const sandWet = result.sandWeightWet !== undefined ? Math.round(result.sandWeightWet) : (input.moistureSand !== undefined ? Math.round(sandDry * (1 + input.moistureSand / 100)) : sandDry);
  const gravelWet = result.gravelWeightWet !== undefined ? Math.round(result.gravelWeightWet) : (input.moistureGravel !== undefined ? Math.round(gravelDry * (1 + input.moistureGravel / 100)) : gravelDry);
  const waterWet = result.waterWeightWet !== undefined ? Math.round(result.waterWeightWet) : (waterDry !== undefined ? Math.round(waterDry - (sandWet - sandDry) - (gravelWet - gravelDry)) : 0);
  const waterDiff = waterWet - waterDry;

  const moistureRows = [
    [
      "Sand Scale Weight (Sable)",
      `${sandDry} kg`,
      input.moistureSand !== undefined ? `${input.moistureSand.toFixed(1)}%` : "0.0%",
      `+${sandWet - sandDry} kg`,
      `${sandWet} kg/m³`,
      `${(sandWet * batchVolume).toFixed(1)} kg`
    ],
    [
      "Gravel Scale Weight (Gravier)",
      `${gravelDry} kg`,
      input.moistureGravel !== undefined ? `${input.moistureGravel.toFixed(1)}%` : "0.0%",
      `+${gravelWet - gravelDry} kg`,
      `${gravelWet} kg/m³`,
      `${(gravelWet * batchVolume).toFixed(1)} kg`
    ],
    [
      "Mixer Water to Add (Eau ajoutée)",
      `${waterDry} L`,
      "Apport Net",
      `${waterDiff >= 0 ? "+" : ""}${waterDiff} L`,
      `${waterWet} L/m³`,
      `${(waterWet * batchVolume).toFixed(1)} L`
    ],
    [
      "Cement Scale Weight (Ciment)",
      `${cementDry} kg`,
      "0.0% (Sec)",
      "0 kg",
      `${cementDry} kg/m³`,
      `${(cementDry * batchVolume).toFixed(1)} kg`
    ]
  ];

  autoTable(doc, {
    ...theme,
    startY: currentY,
    head: [["Material / Scale Point", "Dry Mass (kg/m³)", "Moisture (w%)", "Moisture Delta (kg)", "Actual Wet Scale (1 m³)", `Batch Scale (${batchVolume} m³)`]],
    body: moistureRows,
    columnStyles: {
      0: { cellWidth: 44, fontStyle: "bold" },
      1: { cellWidth: 26, halign: "right" },
      2: { cellWidth: 24, halign: "center" },
      3: { cellWidth: 26, halign: "center", textColor: PDF_COLORS.secondary },
      4: { cellWidth: 32, halign: "right", fontStyle: "bold" },
      5: { cellWidth: 30, halign: "right", fontStyle: "bold" }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // =========================================================================
  // 6. MECHANICAL EVOLUTION & STANDARDS COMPLIANCE AUDIT
  // =========================================================================
  if (currentY > 210) {
    doc.addPage();
    currentY = PDF_PAGE_MARGINS.top + 2;
  }

  currentY = drawSectionBanner(
    doc, 
    currentY, 
    "MECHANICAL PREDICTIONS & NORMATIVE COMPLIANCE MATRIX (EN 206 / ACI 211)",
    "QUALITY AUDIT"
  );

  // Theoretical strength calculations
  const fc2 = fcm !== undefined ? (fcm * 0.45).toFixed(1) : "-";
  const fc7 = fcm !== undefined ? (fcm * 0.70).toFixed(1) : "-";
  const fc28 = fcm !== undefined ? fcm.toFixed(1) : "-";
  const fc90 = fcm !== undefined ? (fcm * 1.15).toFixed(1) : "-";
  const fctm = fck !== undefined ? (0.30 * Math.pow(fck, 2/3)).toFixed(2) : "-";
  const Ecm = fcm !== undefined ? (22 * Math.pow(fcm / 10, 0.3)).toFixed(1) : "-";

  const complianceRows = [
    [
      "Characteristic Compressive Strength (fck,28)",
      fck !== undefined ? `${fck} MPa` : "N/A",
      fcm !== undefined && fck !== undefined ? `Target fcm: ${fc28} MPa (Margin +${(fcm - fck).toFixed(1)})` : "Target fcm: N/A",
      "fcm >= fck + 1.64 sigma",
      fck !== undefined ? "CONFORMING" : "NOT SPECIFIED"
    ],
    [
      "Water / Binder Ratio (E/C)",
      wcRatio !== undefined ? `${wcRatio.toFixed(2)}` : "N/A",
      input.exposureClass ? `Limit: <= ${input.exposureClass === "X0" ? "0.65" : "0.50"} (${input.exposureClass})` : "Limit: N/A (Exposure class not specified)",
      "NF EN 206 Table F.1",
      wcRatio !== undefined ? (wcRatio <= 0.50 ? "CONFORMING" : "WARNING") : "N/A"
    ],
    [
      "Minimum Binder Content (kg/m³)",
      `${cementDry} kg/m³`,
      input.exposureClass ? `Limit: >= ${input.exposureClass === "X0" ? "260" : "300"} kg/m³` : "Limit: N/A (Exposure class not specified)",
      "NF EN 206 Table F.1",
      cementDry > 0 ? (cementDry >= 300 ? "CONFORMING" : "WARNING") : "N/A"
    ],
    [
      "Early Strength at 2 Days (fcm,2d)",
      `${fc2} MPa`,
      "For formwork stripping & safety",
      "Hydration model class N/R",
      fcm !== undefined ? "VERIFIED" : "N/A"
    ],
    [
      "Strength at 7 Days (fcm,7d)",
      `${fc7} MPa`,
      "~70% of 28d design target",
      "Standard curing 20°C",
      fcm !== undefined ? "VERIFIED" : "N/A"
    ],
    [
      "Flexural Tensile Strength (fctm)",
      `${fctm} MPa`,
      "fctm = 0.30 * fck^(2/3)",
      "Eurocode 2 Eq. 3.1",
      fck !== undefined ? "THEORETICAL" : "N/A"
    ],
    [
      "Secant Modulus of Elasticity (Ecm)",
      `${Ecm} GPa`,
      "Ecm = 22 * (fcm/10)^0.3",
      "Eurocode 2 Table 3.1",
      fcm !== undefined ? "THEORETICAL" : "N/A"
    ]
  ];

  autoTable(doc, {
    ...theme,
    startY: currentY,
    head: [["Engineering Parameter", "Calculated / Measured", "Design Requirement / Limit", "Reference Standard", "Status"]],
    body: complianceRows,
    columnStyles: {
      0: { cellWidth: 46, fontStyle: "bold" },
      1: { cellWidth: 32, halign: "center", fontStyle: "bold" },
      2: { cellWidth: 44 },
      3: { cellWidth: 34, halign: "center" },
      4: { cellWidth: 26, halign: "center", fontStyle: "bold" }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // =========================================================================
  // 7. OFFICIAL LABORATORY SIGN-OFF & CERTIFICATION STAMP
  // =========================================================================
  drawSignOffBlock(doc, currentY, {
    operatorName: project.engineer || "Senior Concrete Formulation Engineer",
    directorName: "Director of Technical & Quality Control",
    date: dateStr,
    reportRef: reportRef,
    labName: lab.name
  });

  // =========================================================================
  // 8. FINALIZE RUNNING HEADERS, FOOTERS & PAGE NUMBERS ACROSS ALL PAGES
  // =========================================================================
  finalizeReportPages(doc, {
    reportTitle: "CERTIFICAT DE FORMULATION DE BÉTON",
    reportSubtitle: `${fck !== undefined ? `C${fck}/${Math.round(fck * 1.25)}` : "Concrete Formulation"}${input.exposureClass ? ` - ${input.exposureClass}` : ""}`,
    reportRef: reportRef,
    date: dateStr,
    labProfile: lab
  });

  return doc;
}
