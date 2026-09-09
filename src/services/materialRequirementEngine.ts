/**
 * SnoLab Material Requirement Engine
 * 
 * Determines mandatory, optional, and conditional material roles, property constraints,
 * and technical specifications based on:
 * Concrete Type + Mix Design Method + Project Requirements (Strength, Workability, Exposure, Dmax, Density).
 * 
 * Conforms to ACI 211.1-22, EN 206, EN 12620, NF P 18-404, and AFGC-UHPC recommendations.
 */

import { SupportedMaterialRole } from "./materialPropertySchema";
export type { SupportedMaterialRole };

export type RoleRequirementType = "mandatory" | "optional" | "conditional" | "forbidden";

export interface RoleConstraint {
  minStrengthClass?: number; // e.g. 42.5 for HSC, 52.5 for UHPC
  maxDmax?: number; // e.g. 16mm for SCC, 8mm for Shotcrete, 2mm for UHPC
  minDmax?: number; // e.g. 20mm for RCC
  targetDensityMin?: number; // for HWC e.g. 2800 kg/m³
  targetDensityMax?: number; // for LWC e.g. 1800 kg/m³
  preferredAdmixtureType?: "superplasticizer" | "plasticizer" | "accelerator" | "retarder" | "vma" | "air_entraining";
  minAdmixtureWaterReduction?: number; // % reduction
  preferredScmType?: "silica_fume" | "fly_ash" | "slag" | "metakaolin" | "limestone_filler";
  minScmSilicaContent?: number; // %
  preferredFiberType?: "steel" | "synthetic" | "glass" | "basalt";
  minFiberTensileStrength?: number; // MPa
  minSandEquivalent?: number; // % (e.g. >= 75 for HSC)
  maxAbsorption?: number; // %
  sulfateResistanceRequired?: boolean;
  lowHeatRequired?: boolean;
  alkaliActivatorRequired?: boolean;
  selfHealingAgentRequired?: boolean;
  recycledAggregateRequired?: boolean;
}

export interface MaterialRoleRequirement {
  role: SupportedMaterialRole;
  roleLabelAr: string;
  roleLabelEn: string;
  roleLabelFr: string;
  icon: string;
  requirementType: RoleRequirementType;
  isRequired: boolean; // true if mandatory or conditional (activated)
  reasonAr: string;
  reasonEn: string;
  reasonFr: string;
  constraints?: RoleConstraint;
  suggestedDosageRange?: {
    min: number;
    max: number;
    unit: string;
    basis: string; // e.g. "% of binder", "kg/m³", "% of volume"
  };
}

export interface ProjectRequirementsInput {
  concreteType?: string; // e.g. "NSC", "HSC", "HPC", "SCC", "FRC", "LWC", "HWC", "RCC", "SHOTCRETE", "GPC", "SHC", "RAC", "PERVIOUS", "UHPC", "BFUP"
  mixDesignMethod?: string; // e.g. "dreux", "aci", "eurocode", "bolomey", "faury", "aitcin", "baron_lesage"
  targetStrength?: number; // fck28 in MPa
  workability?: string; // e.g. "S1", "S2", "S3", "S4", "S5", "SF1", "SF2", "SF3", "slump_cm"
  slumpCm?: number;
  exposureClass?: string; // e.g. "X0", "XC1", "XC2", "XC3", "XC4", "XS1", "XS2", "XS3", "XF1", "XF2", "XF3", "XF4", "XA1", "XA2", "XA3"
  maxAggregateSize?: number; // Dmax in mm
  targetDensity?: number; // kg/m³
  hasPumping?: boolean;
  specialRequirements?: {
    highEarlyStrength?: boolean;
    lowHeatOfHydration?: boolean;
    freezeThawResistance?: boolean;
    sulfateResistance?: boolean;
    marineEnvironment?: boolean;
    abrasionResistance?: boolean;
    impermeability?: boolean;
    carbonReduction?: boolean;
  };
}

export interface MaterialRequirementPlan {
  concreteType: string;
  mixDesignMethod: string;
  targetStrength: number;
  exposureClass: string;
  maxAggregateSize: number;
  roles: MaterialRoleRequirement[];
  mandatoryRolesCount: number;
  optionalRolesCount: number;
  technicalSummaryAr: string;
  technicalSummaryEn: string;
  technicalSummaryFr: string;
}

/**
 * Evaluates project context and returns precise material role requirements and constraints.
 */
export function determineMaterialRequirements(inputs: ProjectRequirementsInput): MaterialRequirementPlan {
  const rawConcreteType = typeof inputs.concreteType === "string"
    ? inputs.concreteType
    : (inputs.concreteType as any)?.code || (inputs.concreteType as any)?.concreteType || "NSC";
  const concreteType = String(rawConcreteType || "NSC").toUpperCase();
  const method = String(inputs.mixDesignMethod || "dreux").toLowerCase();
  const fck = Number(inputs.targetStrength) || 25;
  const dMax = Number(inputs.maxAggregateSize) || 20;
  const exposure = (inputs.exposureClass || "X0").toUpperCase();
  const slump = Number(inputs.slumpCm) || 8;
  const isPumping = !!inputs.hasPumping;
  const special = inputs.specialRequirements || {};

  const roles: MaterialRoleRequirement[] = [];

  // ==========================================================================
  // 1. CEMENT / BINDER ROLE
  // ==========================================================================
  const isGpc = concreteType === "GPC";
  const isUhpcOrBfup = concreteType === "UHPC" || concreteType === "BFUP";
  const isHsc = concreteType === "HSC" || fck >= 50;
  const isHpc = concreteType === "HPC";
  const isSulfateAttack = exposure.startsWith("XA") || special.sulfateResistance || special.marineEnvironment || exposure.startsWith("XS");
  const isLowHeat = special.lowHeatOfHydration || concreteType === "RCC";

  let cementReqType: RoleRequirementType = isGpc ? "forbidden" : "mandatory";
  let cementConstraint: RoleConstraint = {};
  let cementReasonAr = "مطلوب لتشكيل المونة الإسمنتية وتفاعل الإماهة وتحقيق المقاومة المستهدفة.";
  let cementReasonEn = "Required to form the cement paste, trigger hydration, and achieve target compressive strength.";
  let cementReasonFr = "Requis pour former la pâte de ciment, déclencher l'hydratation et atteindre la résistance cible.";

  if (isGpc) {
    cementReasonAr = "الخرسانة الجيوبوليمرية (GPC) تعتمد على روابط جيومعدنية خالية من الأسمنت البورتلاندي التقليدي.";
    cementReasonEn = "Geopolymer concrete relies on alkali-activated aluminosilicate binders without ordinary Portland cement.";
    cementReasonFr = "Le béton géopolymère utilise des liants aluminosilicates activés par voie alcaline sans ciment Portland.";
  } else if (isUhpcOrBfup) {
    cementConstraint = { minStrengthClass: 52.5 };
    cementReasonAr = `يتطلب إسمنت نقي عالي المقاومة والفينيسيا (CEM I 52.5 R) لتحقيق تراص مجهري فائق ومقاومة تفوق ${Math.max(fck, 120)} MPa.`;
    cementReasonEn = `Requires high-purity, high-fineness cement (CEM I 52.5 R) for ultra-dense micro-packing and strength exceeding ${Math.max(fck, 120)} MPa.`;
    cementReasonFr = `Exige un ciment haute performance CEM I 52.5 R pour une compacité micrométrique maximale.`;
  } else if (isHsc || isHpc) {
    cementConstraint = { minStrengthClass: 42.5, sulfateResistanceRequired: isSulfateAttack };
    cementReasonAr = `يتطلب إسمنت عالي الرتبة (CEM I 42.5 R أو 52.5) لضمان متانة الهيكل الخرساني ومقاومة ضغط ${fck} MPa.`;
    cementReasonEn = `Requires high-class cement (CEM I 42.5 R or 52.5) to ensure dense matrix and compressive strength of ${fck} MPa.`;
    cementReasonFr = `Nécessite un ciment de classe 42.5 ou 52.5 pour assurer une matrice à haute performance.`;
  } else if (isSulfateAttack) {
    cementConstraint = { sulfateResistanceRequired: true };
    cementReasonAr = `يوصى بإسمنت مقاوم للكبريتات (CEM I-SR أو CEM III/B) لبيئة التعرض الكيميائي (${exposure}).`;
    cementReasonEn = `Sulfate-resistant cement (CEM I-SR or CEM III/B) recommended for exposure class (${exposure}).`;
    cementReasonFr = `Ciment résistant aux sulfates recommandé pour la classe d'exposition (${exposure}).`;
  } else if (isLowHeat) {
    cementConstraint = { lowHeatRequired: true };
    cementReasonAr = "يوصى بإسمنت منخفض حرارة الإماهة (LH) للخرسانات الكتلية أو المدحولة.";
    cementReasonEn = "Low-heat of hydration cement (LH) recommended for mass or roller-compacted concrete.";
    cementReasonFr = "Ciment à faible chaleur d'hydratation (LH) recommandé pour béton compacté au rouleau.";
  }

  roles.push({
    role: "cement",
    roleLabelAr: "الإسمنت البورتلاندي / المجلد",
    roleLabelEn: "Portland Cement / Binder",
    roleLabelFr: "Ciment Portland / Liant",
    icon: "🏗️",
    requirementType: cementReqType,
    isRequired: cementReqType === "mandatory",
    reasonAr: cementReasonAr,
    reasonEn: cementReasonEn,
    reasonFr: cementReasonFr,
    constraints: cementConstraint
  });

  // ==========================================================================
  // 2. FINE AGGREGATE (SAND) ROLE
  // ==========================================================================
  const isPervious = concreteType === "PERVIOUS";
  const isPaste = concreteType === "PASTE";
  let sandReqType: RoleRequirementType = isPaste ? "forbidden" : (isPervious ? "optional" : "mandatory");
  let sandConstraint: RoleConstraint = { maxDmax: isUhpcOrBfup ? 2.0 : (dMax <= 4 ? dMax : 5.0) };
  let sandReasonAr = "مطلوب لتأمين الهيكل الحبيبي الناعم وملء الفراغات بين الحصى وتوفير قابلية التشغيل.";
  let sandReasonEn = "Required to supply the fine granular skeleton, fill voids between gravel particles, and ensure workability.";
  let sandReasonFr = "Requis pour le squelette granulaire fin, le remplissage des vides et la maniabilité.";

  if (isUhpcOrBfup) {
    sandConstraint = { maxDmax: 1.0, minSandEquivalent: 85 };
    sandReasonAr = "يتطلب رمل سيليسي أو كوارتزي فائق النقاء والتدرج (0-1 مم) لضمان التراص المجهري النانوي.";
    sandReasonEn = "Requires extra-pure fine siliceous or quartz sand (0-1 mm) for sub-millimetric granular packing.";
    sandReasonFr = "Exige un sable siliceux fin ultra-pur (0-1 mm) pour un empilement micrométrique.";
  } else if (isPervious) {
    sandReasonAr = "الخرسانة النافذة (Pervious) تستبعد أو تقلل الرمل بشدة للحفاظ على المسامية المتصلة (15-25%).";
    sandReasonEn = "Pervious concrete strictly minimizes or omits fine sand to maintain interconnected void ratio (15-25%).";
    sandReasonFr = "Le béton drainant minimise ou exclut le sable fin pour préserver les vides interconnectés.";
  } else if (concreteType === "SCC") {
    sandConstraint = { maxDmax: 4.0, minSandEquivalent: 75 };
    sandReasonAr = "يتطلب رمل متدرج ناعم/متوسط لزيادة لزوجة المعجون ومنع انفصال الحبيبات أثناء الانسياب الحر.";
    sandReasonEn = "Requires balanced fine/medium sand to enhance paste viscosity and prevent segregation during flow.";
    sandReasonFr = "Nécessite un sable fin/moyen équilibré pour accroître la viscosité et éviter la ségrégation.";
  }

  roles.push({
    role: "sand",
    roleLabelAr: "الركام الناعم (الرمل)",
    roleLabelEn: "Fine Aggregate (Sand)",
    roleLabelFr: "Granulat fin (Sable)",
    icon: "🏖️",
    requirementType: sandReqType,
    isRequired: sandReqType === "mandatory",
    reasonAr: sandReasonAr,
    reasonEn: sandReasonEn,
    reasonFr: sandReasonFr,
    constraints: sandConstraint
  });

  // ==========================================================================
  // 3. COARSE AGGREGATE (GRAVEL) ROLE
  // ==========================================================================
  const isMortar = concreteType === "MORTAR" || concreteType === "GROUT" || concreteType === "PASTE" || dMax <= 4;
  const isLwc = concreteType === "LWC";
  const isHwc = concreteType === "HWC";
  const isRac = concreteType === "RAC";

  let gravelReqType: RoleRequirementType = "mandatory";
  if (isMortar || isUhpcOrBfup) {
    gravelReqType = isUhpcOrBfup ? "forbidden" : "forbidden";
  } else if (isLwc || isHwc) {
    gravelReqType = "forbidden"; // Replaced by Lightweight / Heavyweight aggregate
  }

  let gravelConstraint: RoleConstraint = { maxDmax: dMax };
  let gravelReasonAr = `مطلوب لتشكيل الهيكل العظمي الخشن للخرسانة ومقاومة الانكماش، بقطر أقصى Dmax = ${dMax} مم.`;
  let gravelReasonEn = `Required to form the coarse skeletal matrix and resist drying shrinkage (Dmax = ${dMax} mm).`;
  let gravelReasonFr = `Requis pour former le squelette granulaire grossier et limiter le retrait (Dmax = ${dMax} mm).`;

  if (concreteType === "SCC") {
    gravelConstraint = { maxDmax: 16 };
    gravelReasonAr = "الخرسانة ذاتية الدمك (SCC) تشترط ركام خشن بقطر أقصى Dmax <= 16 مم لمنع الانسداد بين قضبان التسليح.";
    gravelReasonEn = "SCC specifies coarse aggregate with Dmax <= 16 mm to avoid blocking around congested reinforcement.";
    gravelReasonFr = "Le BAP exige un gravillon de Dmax <= 16 mm pour prévenir le blocage entre les armatures.";
  } else if (concreteType === "SHOTCRETE") {
    gravelConstraint = { maxDmax: 12 };
    gravelReasonAr = "خرسانة الرش (Shotcrete) تشترط Dmax <= 12-16 مم لتقليل الارتداد وتفادي انسداد خراطيم الضخ.";
    gravelReasonEn = "Shotcrete requires Dmax <= 12-16 mm to minimize rebound and prevent nozzle pumping clogs.";
    gravelReasonFr = "Le béton projeté exige Dmax <= 12-16 mm pour réduire le rebond et éviter les bouchons de pompage.";
  } else if (isUhpcOrBfup) {
    gravelReasonAr = "الخرسانة فائقة الأداء (UHPC) تستبعد الركام الخشن العادي بالكامل وتعتمد على حبيبات ميكروية متراصة.";
    gravelReasonEn = "UHPC strictly excludes coarse aggregate to eliminate macro-interfacial transition zones.";
    gravelReasonFr = "Le BFUP exclut les gros granulats pour éliminer les zones de transition interfaciale fragiles.";
  } else if (isRac) {
    gravelConstraint = { recycledAggregateRequired: true };
    gravelReasonAr = "خرسانة الركام المعاد تدويره (RAC) تتطلب ركام خرساني مكسر من مخلفات الهدم مع فحص دقيق للامتصاص.";
    gravelReasonEn = "Recycled aggregate concrete (RAC) requires recycled crushed concrete with rigorous absorption checks.";
    gravelReasonFr = "Le béton de granulats recyclés (RAC) exige des gravillons de béton concassé recyclé.";
  }

  roles.push({
    role: "gravel",
    roleLabelAr: "الركام الخشن (الحصى)",
    roleLabelEn: "Coarse Aggregate (Gravel)",
    roleLabelFr: "Gros granulat (Gravillons)",
    icon: "🪨",
    requirementType: gravelReqType,
    isRequired: gravelReqType === "mandatory",
    reasonAr: gravelReasonAr,
    reasonEn: gravelReasonEn,
    reasonFr: gravelReasonFr,
    constraints: gravelConstraint
  });

  // ==========================================================================
  // 4. MIXING WATER ROLE
  // ==========================================================================
  roles.push({
    role: "water",
    roleLabelAr: "مياه الخلط",
    roleLabelEn: "Mixing Water",
    roleLabelFr: "Eau de gâchage",
    icon: "💧",
    requirementType: "mandatory",
    isRequired: true,
    reasonAr: "مطلوبة لتفاعل إماهة المجلد وتصحيح رطوبة وامتصاص الركام طبقا للمواصفة EN 1008.",
    reasonEn: "Required for binder hydration and aggregate moisture/absorption correction per EN 1008.",
    reasonFr: "Requise pour l'hydratation du liant et la correction d'humidité selon EN 1008."
  });

  // ==========================================================================
  // 5. CHEMICAL ADMIXTURES ROLE
  // ==========================================================================
  const isScc = concreteType === "SCC";
  const isShotcrete = concreteType === "SHOTCRETE";
  let admixReqType: RoleRequirementType = "optional";
  let admixConstraint: RoleConstraint = {};
  let admixReasonAr = "اختياري لتحسين التشغيلية وخفض استهلاك المياه أو تعديل زمن الشك.";
  let admixReasonEn = "Optional to improve workability, reduce water demand, or adjust setting time.";
  let admixReasonFr = "Optionnel pour améliorer l'ouvrabilité, réduire l'eau ou ajuster la prise.";

  if (isUhpcOrBfup || isScc || isHsc || isHpc || fck >= 40 || slump >= 16 || isPumping) {
    admixReqType = "mandatory";
    admixConstraint = {
      preferredAdmixtureType: "superplasticizer",
      minAdmixtureWaterReduction: isUhpcOrBfup ? 28 : (isScc ? 22 : 18)
    };
    admixReasonAr = isUhpcOrBfup
      ? "إلزامي: ملدن فائق بولي كربوكسيل (PCE) عالي التخفيض للماء (> 30%) لتحقيق السيولة بدون إضافة مياه زائدة."
      : isScc
      ? "إلزامي: ملدن فائق عالي المدى (PCE) لتحقيق السيولة الذاتية والتدفق الحر تحت الوزن الذاتي."
      : "إلزامي: ملدن فائق لتخفيض نسبة الماء للأسمنت (W/C) وضمان مقاومة الضغط والضخ العالية.";
    admixReasonEn = isUhpcOrBfup
      ? "Mandatory: High-range polycarboxylate ether (PCE) superplasticizer (>30% water reduction) for extreme packing."
      : isScc
      ? "Mandatory: High-range PCE superplasticizer to achieve self-consolidation and slump flow without vibration."
      : "Mandatory: Superplasticizer to reduce W/C ratio and ensure high compressive strength and pumpability.";
    admixReasonFr = isScc
      ? "Obligatoire : Superplastifiant PCE haut réducteur d'eau pour garantir l'autocompactage sans vibration."
      : "Obligatoire : Superplastifiant pour réduire le rapport E/C et assurer la haute résistance.";
  } else if (isShotcrete) {
    admixReqType = "mandatory";
    admixConstraint = { preferredAdmixtureType: "accelerator" };
    admixReasonAr = "إلزامي: مسرع شك فوري لتثبيت طبقات الخرسانة المرشوشة بالأسطح الرأسية والأسقف.";
    admixReasonEn = "Mandatory: Set accelerator to ensure immediate adhesion of sprayed concrete to vertical surfaces.";
    admixReasonFr = "Obligatoire : Accélérateur de prise pour garantir l'adhérence instantanée sur parois verticales.";
  } else if (exposure.startsWith("XF")) {
    admixReqType = "conditional";
    admixConstraint = { preferredAdmixtureType: "air_entraining" };
    admixReasonAr = `مشروط: حابس هواء (Air-Entraining) لحماية الخرسانة من دورات الانجماد والذوبان (${exposure}).`;
    admixReasonEn = `Conditional: Air-entraining agent to protect against freeze-thaw cycles (${exposure}).`;
    admixReasonFr = `Conditionnel : Entraîneur d'air pour la résistance aux cycles gel-dégel (${exposure}).`;
  }

  roles.push({
    role: "admixture",
    roleLabelAr: "الإضافات الكيميائية",
    roleLabelEn: "Chemical Admixtures",
    roleLabelFr: "Adjuvants chimiques",
    icon: "🧪",
    requirementType: admixReqType,
    isRequired: admixReqType === "mandatory",
    reasonAr: admixReasonAr,
    reasonEn: admixReasonEn,
    reasonFr: admixReasonFr,
    constraints: admixConstraint,
    suggestedDosageRange: {
      min: isUhpcOrBfup ? 1.5 : 0.8,
      max: isUhpcOrBfup ? 3.5 : 2.5,
      unit: "%",
      basis: "% من وزن المجلد"
    }
  });

  // ==========================================================================
  // 6. MINERAL ADDITIONS (SCM) ROLE
  // ==========================================================================
  let scmReqType: RoleRequirementType = "optional";
  let scmConstraint: RoleConstraint = {};
  let scmReasonAr = "اختياري لملء الفراغات المجهرية ورفع المتانة الكيميائية وخفض الانبعاثات الكربونية.";
  let scmReasonEn = "Optional to refine pore structure, enhance chemical durability, and reduce carbon footprint.";
  let scmReasonFr = "Optionnel pour densifier la microstructure et accroître la durabilité.";

  if (isUhpcOrBfup) {
    scmReqType = "mandatory";
    scmConstraint = { preferredScmType: "silica_fume", minScmSilicaContent: 90 };
    scmReasonAr = "إلزامي: غبار سيليكا فائق النعومة (Silica Fume >= 15%) لملء الفراغات النانوية وتفعيل التفاعل البوزولاني.";
    scmReasonEn = "Mandatory: Ultra-fine silica fume (>=15%) to fill nanometric voids and react with Ca(OH)2.";
    scmReasonFr = "Obligatoire : Fumée de silice ultra-fine pour densifier les nanopores et former du C-S-H secondaire.";
  } else if (isHpc || (isHsc && fck >= 80)) {
    scmReqType = "mandatory";
    scmConstraint = { preferredScmType: "silica_fume" };
    scmReasonAr = "إلزامي: إضافة بوزولانية نشطة (غبار سيليكا، رماد متطاير، أو خبث) لرفع الكثافة والكتامة.";
    scmReasonEn = "Mandatory: Active pozzolanic addition (silica fume, fly ash, or slag) for high density and durability.";
    scmReasonFr = "Obligatoire : Addition pouzzolanique active pour une durabilité et compacité maximales.";
  } else if (isHsc) {
    scmReqType = "conditional";
    scmConstraint = { preferredScmType: "silica_fume" };
    scmReasonAr = "يوصى بإضافة بوزولانية نشطة (غبار سيليكا أو رماد) لتعزيز المقاومة العالية وتراص البنية الإسمنتية.";
    scmReasonEn = "Recommended: Active pozzolanic addition (silica fume or fly ash) to enhance high strength and microstructure.";
    scmReasonFr = "Recommandé : Addition pouzzolanique active pour optimiser la compacité à haute résistance.";
  } else if (isGpc) {
    scmReqType = "mandatory";
    scmConstraint = { preferredScmType: "slag" };
    scmReasonAr = "إلزامي: خبث أفران أو رماد متطاير يشكل المادة الأولية الغنية بالألومينوسيليكات للتفاعل الجيوبوليمري.";
    scmReasonEn = "Mandatory: Slag or fly ash acts as the primary aluminosilicate precursor for the geopolymeric reaction.";
    scmReasonFr = "Obligatoire : Laitier ou cendres volantes comme précurseur aluminosilicate principal.";
  } else if (isScc) {
    scmReqType = "conditional";
    scmConstraint = { preferredScmType: "limestone_filler" };
    scmReasonAr = "مشروط: بودرة حجر جيري (Filler) أو رماد متطاير لزيادة محتوى البودرة وتأمين استقرار ولزوجة SCC.";
    scmReasonEn = "Conditional: Limestone filler or fly ash to boost powder content and maintain SCC viscosity.";
    scmReasonFr = "Conditionnel : Filler calcaire ou cendres volantes pour enrichir la fraction fine du BAP.";
  }

  roles.push({
    role: "scm",
    roleLabelAr: "الإضافات المعدنية (SCM / البودرة)",
    roleLabelEn: "Mineral Additions (SCM / Powder)",
    roleLabelFr: "Additions minérales (SCM)",
    icon: "🌋",
    requirementType: scmReqType,
    isRequired: scmReqType === "mandatory",
    reasonAr: scmReasonAr,
    reasonEn: scmReasonEn,
    reasonFr: scmReasonFr,
    constraints: scmConstraint,
    suggestedDosageRange: {
      min: isUhpcOrBfup ? 15 : (isGpc ? 50 : 5),
      max: isUhpcOrBfup ? 25 : (isGpc ? 85 : 30),
      unit: "%",
      basis: "% استبدال أو إضافة من المجلد"
    }
  });

  // ==========================================================================
  // 7. FIBER ROLE
  // ==========================================================================
  const isFrc = concreteType === "FRC";
  let fiberReqType: RoleRequirementType = (isFrc || isUhpcOrBfup) ? "mandatory" : "optional";
  let fiberConstraint: RoleConstraint = {};
  let fiberReasonAr = "اختياري لتقليل شروخ الانكماش اللدن ومقاومة الصدمات.";
  let fiberReasonEn = "Optional to control plastic shrinkage cracking and improve impact resistance.";
  let fiberReasonFr = "Optionnel pour limiter le retrait plastique et améliorer la ténacité.";

  if (isUhpcOrBfup) {
    fiberReqType = "mandatory";
    fiberConstraint = { preferredFiberType: "steel", minFiberTensileStrength: 2000 };
    fiberReasonAr = "إلزامي: ألياف فولاذية دقيقة عالية المقاومة (Tensile >= 2000 MPa) لتحقيق الدونة والتحمل الهيكلي الفائق.";
    fiberReasonEn = "Mandatory: Ultra-high tensile steel microfibers (>=2000 MPa) to provide ductile tensile behavior.";
    fiberReasonFr = "Obligatoire : Microfibres d'acier à très haute résistance (>=2000 MPa) pour la ductilité.";
  } else if (isFrc) {
    fiberReqType = "mandatory";
    fiberConstraint = { preferredFiberType: "steel", minFiberTensileStrength: 1000 };
    fiberReasonAr = "إلزامي: ألياف تسليح إنشائية لرفع مقاومة الشد المباشر ومقاومة الصدمات ومكافحة التصدع.";
    fiberReasonEn = "Mandatory: Structural reinforcing fibers to increase tensile load capacity and post-crack ductility.";
    fiberReasonFr = "Obligatoire : Fibres de renfort structurel pour accroître la résistance à la traction et ductilité.";
  }

  roles.push({
    role: "fiber",
    roleLabelAr: "ألياف التسليح الخرساني",
    roleLabelEn: "Reinforcing Fibers",
    roleLabelFr: "Fibres de renforcement",
    icon: "🧵",
    requirementType: fiberReqType,
    isRequired: fiberReqType === "mandatory",
    reasonAr: fiberReasonAr,
    reasonEn: fiberReasonEn,
    reasonFr: fiberReasonFr,
    constraints: fiberConstraint,
    suggestedDosageRange: {
      min: isUhpcOrBfup ? 80 : 25,
      max: isUhpcOrBfup ? 160 : 60,
      unit: "kg/m³",
      basis: "كيلوغرام لكل متر مكعب خرسانة"
    }
  });

  // ==========================================================================
  // 8. SPECIALIZED AGGREGATES & BINDERS
  // ==========================================================================
  if (isLwc) {
    roles.push({
      role: "lightweightAggregate",
      roleLabelAr: "الركام خفيف الوزن",
      roleLabelEn: "Lightweight Aggregate",
      roleLabelFr: "Granulat léger",
      icon: "🪶",
      requirementType: "mandatory",
      isRequired: true,
      reasonAr: "إلزامي: ركام خفيف مسامي (طين متمدد أو حجر خفاف) لخفض الكثافة إلى ما دون 1800-2000 كجم/م³.",
      reasonEn: "Mandatory: Porous lightweight aggregate (expanded clay, pumice) to target density < 1800-2000 kg/m³.",
      reasonFr: "Obligatoire : Granulat léger poreux pour obtenir une masse volumique < 2000 kg/m³.",
      constraints: { targetDensityMax: 1800 }
    });
  }

  if (isHwc) {
    roles.push({
      role: "heavyweightAggregate",
      roleLabelAr: "الركام ثقيل الوزن (درع إشعاعي)",
      roleLabelEn: "Heavyweight Aggregate",
      roleLabelFr: "Granulat lourd",
      icon: "🛡️",
      requirementType: "mandatory",
      isRequired: true,
      reasonAr: "إلزامي: ركام عالي الكثافة (باريت أو مغنيتيت) لتحقيق كثافة تفوق 3000-3500 كجم/م³ للوقاية الإشعاعية.",
      reasonEn: "Mandatory: High-density aggregate (barite, magnetite) to achieve density > 3000-3500 kg/m³ for radiation shielding.",
      reasonFr: "Obligatoire : Granulat lourd (barytine, magnétite) pour densité > 3000 kg/m³ contre les rayonnements.",
      constraints: { targetDensityMin: 3000 }
    });
  }

  if (isGpc || concreteType === "SHC") {
    roles.push({
      role: "specialBinder",
      roleLabelAr: isGpc ? "سائل التنشيط القلوي / المجلد الجيوبوليمري" : "عامل المعالجة الذاتية (Self-Healing)",
      roleLabelEn: isGpc ? "Alkali Activator / Geopolymer Binder" : "Self-Healing Agent",
      roleLabelFr: isGpc ? "Activateur alcalin / Liant géopolymère" : "Agent d'autocicatrisation",
      icon: "✨",
      requirementType: "mandatory",
      isRequired: true,
      reasonAr: isGpc 
        ? "إلزامي: محلول قلوي منشط (سيليكات الصوديوم / هيدروكسيد الصوديوم) لإطلاق تفاعل البلمرة الجيولوجية."
        : "إلزامي: إضافات بلورية تفاعلية أو كبسولات بكتيرية لمعالجة الشروخ الشعرية ذاتياً.",
      reasonEn: isGpc
        ? "Mandatory: Alkaline activator solution (sodium silicate / sodium hydroxide) to trigger geopolymerization."
        : "Mandatory: Crystalline catalytic admixture or bacterial capsules for autonomous microcrack healing.",
      reasonFr: isGpc
        ? "Obligatoire : Solution activatrice alcaline pour déclencher la polymérisation géopolymère."
        : "Obligatoire : Adjuvant cristallin ou bactéries pour l'autocicatrisation des microfissures.",
      constraints: {
        alkaliActivatorRequired: isGpc,
        selfHealingAgentRequired: concreteType === "SHC"
      }
    });
  }

  const mandatoryCount = roles.filter(r => r.requirementType === "mandatory").length;
  const optionalCount = roles.filter(r => r.requirementType === "optional" || r.requirementType === "conditional").length;

  const technicalSummaryAr = `يتطلب تصميم خلطة (${concreteType}) بطريقة (${method}) توفير ${mandatoryCount} مواد إلزامية مع تدقيق ${optionalCount} إضافات مشروطة.`;
  const technicalSummaryEn = `Mix design for (${concreteType}) via (${method}) requires ${mandatoryCount} mandatory constituents and evaluates ${optionalCount} optional additions.`;
  const technicalSummaryFr = `La formulation (${concreteType}) selon (${method}) exige ${mandatoryCount} constituants obligatoires et ${optionalCount} adjuvants optionnels.`;

  return {
    concreteType,
    mixDesignMethod: method,
    targetStrength: fck,
    exposureClass: exposure,
    maxAggregateSize: dMax,
    roles,
    mandatoryRolesCount: mandatoryCount,
    optionalRolesCount: optionalCount,
    technicalSummaryAr,
    technicalSummaryEn,
    technicalSummaryFr
  };
}
