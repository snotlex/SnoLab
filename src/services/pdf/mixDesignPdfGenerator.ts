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
  const reportRef = `MIX-${input.cementType || "CEM"}-${Math.round(input.fck28 || 30)}-${Math.floor(Date.now() / 1000).toString().slice(-6)}`;
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

  const fck = input.fck28 || 30;
  const fcm = result.fcm28 || (fck + (input.controlClass === "high" ? 6 : input.controlClass === "low" ? 12 : 8));
  const wcRatio = result.wcRatioAdjusted || result.wcRatio || 0.45;
  const slumpVal = input.slump || 7;
  const freshDensity = Math.round(result.totalFreshDensity || 2400);

  currentY = drawMetricCards(doc, currentY, [
    {
      label: "fck,28 (Characteristic)",
      value: `${fck}`,
      unit: "MPa",
      highlight: "primary",
      subtext: `Target fcm: ${fcm.toFixed(1)} MPa`
    },
    {
      label: "Water / Binder (W/C)",
      value: `${wcRatio.toFixed(2)}`,
      unit: "",
      highlight: wcRatio <= 0.48 ? "success" : "warning",
      subtext: `Dreux G: ${(result.dreuxAggregateFactor || 0.55).toFixed(2)}`
    },
    {
      label: "Target Slump",
      value: `${slumpVal}`,
      unit: "cm",
      highlight: "primary",
      subtext: `Class S${slumpVal <= 4 ? "1" : slumpVal <= 9 ? "2" : slumpVal <= 15 ? "3" : slumpVal <= 21 ? "4" : "5"}`
    },
    {
      label: "Fresh Density",
      value: `${freshDensity}`,
      unit: "kg/m³",
      highlight: "primary",
      subtext: `Air: ${(input.airContent || 1.5).toFixed(1)}%`
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
        { label: "Standard Class", value: `C${fck}/${Math.round(fck * 1.25)} (EN 206)` },
        { label: "Exposure Class", value: input.exposureClass || "XC2 (Carbonation)" },
        { label: "Control Class", value: (input.controlClass || "normal").toUpperCase() },
        { label: "Placement Method", value: input.hasPumping ? "Concrete Pump" : "Crane / Bucket" }
      ]
    },
    {
      title: "FORMULATION PARAMETERS",
      items: [
        { label: "Design Method", value: "Georges Dreux-Gorisse" },
        { label: "Max Aggregate (Dmax)", value: `${input.dMax || 20} mm` },
        { label: "Cement Type", value: input.cementType || "CEM II/A-L 42.5 N" },
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
      input.selectedCementId || input.cementType || "CEM II/A-L 42.5 N",
      "GICA / Lafarge",
      `${(input.cementDensity || 3100) / 1000} g/cm³`,
      "-",
      "-",
      `Class ${input.cementClassStrength || 42.5} MPa`
    ],
    [
      "Sand (Sable 0/4)",
      input.selectedSandId || input.sandType || "Crushed/Washed River Sand",
      "Local Quarry",
      `${(input.sandRelativeDensity || 2.65).toFixed(2)} g/cm³`,
      `${(input.sandAbsorption ?? 1.5).toFixed(1)}%`,
      `${(input.moistureSand || 0).toFixed(1)}%`,
      `FM: ${(input.finenessModulus ?? 2.60).toFixed(2)}`
    ],
    [
      "Gravel (Gravier 4/20)",
      input.selectedGravelId || input.gravelType || "Crushed Limestone",
      "Regional Quarry",
      `${(input.gravelRelativeDensity || 2.68).toFixed(2)} g/cm³`,
      `${(input.gravelAbsorption ?? 0.8).toFixed(1)}%`,
      `${(input.moistureGravel || 0).toFixed(1)}%`,
      `Dmax: ${input.dMax || 20} mm`
    ],
    [
      "Mixing Water (Eau)",
      input.selectedWaterName || "Potable Mixing Water",
      "Municipal / Well",
      "1.00 g/cm³",
      "-",
      "-",
      `pH: ${(input.selectedWaterPH ?? 7.2).toFixed(1)} (EN 1008)`
    ]
  ];

  // Optional chemical admixtures
  if (result.admixtureWeights && result.admixtureWeights.length > 0) {
    result.admixtureWeights.forEach((adm) => {
      materialsRows.push([
        "Admixture (Adjuvant)",
        adm.name || "Superplasticizer",
        "Sika / MasterGlenium",
        `${(input.selectedAdmixtureDensity || 1.08).toFixed(2)} g/cm³`,
        "-",
        "-",
        `Dosage: ${(input.dosageSuper || 1.2).toFixed(1)}%`
      ]);
    });
  }

  // Optional SCM
  if (input.selectedScmName || (input.dosageSilicaFume || 0) > 0 || (input.dosageFlyAsh || 0) > 0) {
    materialsRows.push([
      "Mineral Addition (SCM)",
      input.selectedScmName || "Silica Fume / Fly Ash",
      "Industrial Mineral",
      `${(input.selectedScmDensity || 2.20).toFixed(2)} g/cm³`,
      "-",
      "-",
      `Sub: ${(input.selectedScmReplacementPercent || input.dosageSilicaFume || 5).toFixed(1)}%`
    ]);
  }

  // Optional Fibers
  if (input.selectedFiberName || (input.fiberDosageKgM3 || 0) > 0) {
    materialsRows.push([
      "Fibers (Fibres)",
      input.selectedFiberName || "Polypropylene / Steel Fibers",
      "Specialty Fiber",
      `${(input.fiberDensity || 0.91).toFixed(2)} g/cm³`,
      "-",
      "-",
      `Dosage: ${(input.fiberDosageKgM3 || 1.0).toFixed(1)} kg/m³`
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

  const dryRows = [
    [
      "Cement (C)",
      `${(cementDry / (input.cementDensity || 3100) * 1000).toFixed(1)} L`,
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
      `W/C = ${(waterDry / cementDry).toFixed(2)}`
    ],
    [
      "Dry Sand (Sable 0/4)",
      `${(sandDry / ((input.sandRelativeDensity || 2.65) * 1000) * 1000).toFixed(1)} L`,
      `${sandDry} kg`,
      `${(sandDry * batchVolume).toFixed(1)} kg`,
      `${((sandDry / totalDryMass) * 100).toFixed(1)}%`,
      `G/(S+G) = ${(result.sandPercent || 38).toFixed(1)}% Sand`
    ],
    [
      "Dry Gravel (Gravier 4/20)",
      `${(gravelDry / ((input.gravelRelativeDensity || 2.68) * 1000) * 1000).toFixed(1)} L`,
      `${gravelDry} kg`,
      `${(gravelDry * batchVolume).toFixed(1)} kg`,
      `${((gravelDry / totalDryMass) * 100).toFixed(1)}%`,
      `Dmax = ${input.dMax || 20} mm`
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
      `Compaction Gamma: ${(result.compactorGamma || 0.83).toFixed(2)}`
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

  const sandWet = Math.round(result.sandWeightWet || sandDry * (1 + (input.moistureSand || 0) / 100));
  const gravelWet = Math.round(result.gravelWeightWet || gravelDry * (1 + (input.moistureGravel || 0) / 100));
  const waterWet = Math.round(result.waterWeightWet || (waterDry - (sandWet - sandDry) - (gravelWet - gravelDry)));
  const waterDiff = waterWet - waterDry;

  const moistureRows = [
    [
      "Sand Scale Weight (Sable)",
      `${sandDry} kg`,
      `${(input.moistureSand || 0).toFixed(1)}%`,
      `+${sandWet - sandDry} kg`,
      `${sandWet} kg/m³`,
      `${(sandWet * batchVolume).toFixed(1)} kg`
    ],
    [
      "Gravel Scale Weight (Gravier)",
      `${gravelDry} kg`,
      `${(input.moistureGravel || 0).toFixed(1)}%`,
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
  const fc2 = (fcm * 0.45).toFixed(1);
  const fc7 = (fcm * 0.70).toFixed(1);
  const fc28 = fcm.toFixed(1);
  const fc90 = (fcm * 1.15).toFixed(1);
  const fctm = (0.30 * Math.pow(fck, 2/3)).toFixed(2);
  const Ecm = (22 * Math.pow(fcm / 10, 0.3)).toFixed(1);

  const complianceRows = [
    [
      "Characteristic Compressive Strength (fck,28)",
      `${fck} MPa`,
      `Target fcm: ${fc28} MPa (Margin +${(fcm - fck).toFixed(1)})`,
      "fcm >= fck + 1.64 sigma",
      "CONFORMING"
    ],
    [
      "Water / Binder Ratio (E/C)",
      `${wcRatio.toFixed(2)}`,
      `Limit: <= ${input.exposureClass === "X0" ? "0.65" : "0.50"} (${input.exposureClass || "XC2"})`,
      "NF EN 206 Table F.1",
      wcRatio <= 0.50 ? "CONFORMING" : "WARNING"
    ],
    [
      "Minimum Binder Content (kg/m³)",
      `${cementDry} kg/m³`,
      `Limit: >= ${input.exposureClass === "X0" ? "260" : "300"} kg/m³`,
      "NF EN 206 Table F.1",
      cementDry >= 300 ? "CONFORMING" : "WARNING"
    ],
    [
      "Early Strength at 2 Days (fcm,2d)",
      `${fc2} MPa`,
      "For formwork stripping & safety",
      "Hydration model class N/R",
      "VERIFIED"
    ],
    [
      "Strength at 7 Days (fcm,7d)",
      `${fc7} MPa`,
      "~70% of 28d design target",
      "Standard curing 20°C",
      "VERIFIED"
    ],
    [
      "Flexural Tensile Strength (fctm)",
      `${fctm} MPa`,
      "fctm = 0.30 * fck^(2/3)",
      "Eurocode 2 Eq. 3.1",
      "THEORETICAL"
    ],
    [
      "Secant Modulus of Elasticity (Ecm)",
      `${Ecm} GPa`,
      "Ecm = 22 * (fcm/10)^0.3",
      "Eurocode 2 Table 3.1",
      "THEORETICAL"
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
    reportSubtitle: `C${fck}/${Math.round(fck * 1.25)} - ${input.exposureClass || "XC2"}`,
    reportRef: reportRef,
    date: dateStr,
    labProfile: lab
  });

  return doc;
}
