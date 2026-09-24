import { MixDesignInput } from "./types";

export type MixDesignRouteSupport = "active" | "planned";
export type MixDesignRouteMode = "direct" | "hybrid" | "specialized";

type ConcreteMixDesignRouteDefinition = {
  support: MixDesignRouteSupport;
  mode: MixDesignRouteMode;
  methodId?: string;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  reasonAr: string;
  reasonFr: string;
  reasonEn: string;
};

export interface ConcreteMixDesignRoute {
  concreteType: string;
  methodId: string;
  support: MixDesignRouteSupport;
  mode: MixDesignRouteMode;
  autoSelected: boolean;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  reasonAr: string;
  reasonFr: string;
  reasonEn: string;
}

const ROUTES: Record<string, ConcreteMixDesignRouteDefinition> = {
  NSC: {
    support: "active",
    mode: "direct",
    nameAr: "درو-غوريس",
    nameFr: "Dreux-Gorisse",
    nameEn: "Dreux-Gorisse",
    reasonAr: "الخرسانة العادية هي المجال الأساسي الحالي لمحرك درو-غوريس في SnoLab.",
    reasonFr: "Le béton de résistance ordinaire est le domaine principal actuel de Dreux-Gorisse dans SnoLab.",
    reasonEn: "Normal-strength concrete is the current primary domain of Dreux-Gorisse in SnoLab."
  },
  RC: {
    support: "active",
    mode: "hybrid",
    nameAr: "درو-غوريس + تحقق إنشائي",
    nameFr: "Dreux-Gorisse + vérifications structurelles",
    nameEn: "Dreux-Gorisse + structural checks",
    reasonAr: "يمكن استخدام درو-غوريس كأساس للخرسانة التقليدية المسلحة مع فحوصات إضافية.",
    reasonFr: "Dreux-Gorisse peut servir de base au béton armé courant avec des vérifications complémentaires.",
    reasonEn: "Dreux-Gorisse can be the base for conventional reinforced concrete with additional checks."
  },
  PUMPED: {
    support: "active",
    mode: "hybrid",
    nameAr: "درو-غوريس + تصحيحات الضخ",
    nameFr: "Dreux-Gorisse + corrections de pompage",
    nameEn: "Dreux-Gorisse + pumping corrections",
    reasonAr: "الضخ مدعوم كمسار هجين مع تصحيحات القابلية والضخ.",
    reasonFr: "Le pompage est pris en charge comme parcours hybride avec corrections de pompabilité.",
    reasonEn: "Pumped concrete is supported as a hybrid route with pumpability corrections."
  },
  MASS: {
    support: "active",
    mode: "hybrid",
    nameAr: "درو-غوريس + تحقق حراري/متانة",
    nameFr: "Dreux-Gorisse + vérifications thermiques/durabilité",
    nameEn: "Dreux-Gorisse + thermal/durability checks",
    reasonAr: "الخلطة الكتلية تستخدم حسابًا أساسياً مع فحوصات خاصة بالحرارة والمتانة.",
    reasonFr: "Le béton de masse utilise un dosage de base complété par des vérifications thermiques et de durabilité.",
    reasonEn: "Mass concrete uses a base proportioning route with thermal and durability checks."
  },
  MARINE: {
    support: "active",
    mode: "hybrid",
    nameAr: "درو-غوريس + تحقق المتانة البحرية",
    nameFr: "Dreux-Gorisse + vérifications de durabilité marine",
    nameEn: "Dreux-Gorisse + marine durability checks",
    reasonAr: "يمكن استخدام درو-غوريس كأساس مع ضبط المتانة ونسبة الماء إلى الرابط.",
    reasonFr: "Dreux-Gorisse peut être utilisé comme base avec des contrôles de durabilité et de rapport eau/liant.",
    reasonEn: "Dreux-Gorisse can be used as a base with durability and water-to-binder controls."
  },
  PRECAST: {
    support: "active",
    mode: "hybrid",
    nameAr: "درو-غوريس + تحقق الخرسانة المسبقة",
    nameFr: "Dreux-Gorisse + vérifications préfabrication",
    nameEn: "Dreux-Gorisse + precast checks",
    reasonAr: "يبدأ التصميم من درو-غوريس ثم تضاف متطلبات المقاومة المبكرة والتصنيع.",
    reasonFr: "Le dosage part de Dreux-Gorisse puis ajoute les exigences de résistance précoce et de fabrication.",
    reasonEn: "The design starts from Dreux-Gorisse and adds early-strength and manufacturing checks."
  },
  PRESTRESSED: {
    support: "active",
    mode: "hybrid",
    nameAr: "درو-غوريس + تحقق الخرسانة مسبقة الإجهاد",
    nameFr: "Dreux-Gorisse + vérifications précontrainte",
    nameEn: "Dreux-Gorisse + prestressed checks",
    reasonAr: "المسار الأساسي مدعوم مع فحوصات إضافية خاصة بالخرسانة مسبقة الإجهاد.",
    reasonFr: "Le parcours de base est pris en charge avec des contrôles spécifiques à la précontrainte.",
    reasonEn: "The base route is supported with checks specific to prestressed concrete."
  },
  HSC: {
    support: "planned",
    mode: "specialized",
    methodId: "hsc-hpc-specialized",
    nameAr: "محرك HSC متخصص",
    nameFr: "Méthode spécialisée HSC",
    nameEn: "Specialized HSC method",
    reasonAr: "لا ينبغي تقديم حساب HSC النهائي بواسطة معادلات درو-غوريس التقليدية وحدها.",
    reasonFr: "Le dosage final HSC ne doit pas être présenté comme un simple calcul Dreux-Gorisse.",
    reasonEn: "Final HSC design should not be presented as a plain Dreux-Gorisse calculation."
  },
  HPC: {
    support: "planned",
    mode: "specialized",
    methodId: "hsc-hpc-specialized",
    nameAr: "محرك HPC متخصص",
    nameFr: "Méthode spécialisée HPC",
    nameEn: "Specialized HPC method",
    reasonAr: "تحتاج HPC إلى نموذج خاص للمواد الرابطة والملدنات والمتانة.",
    reasonFr: "Le HPC nécessite un modèle spécifique des liants, adjuvants et performances de durabilité.",
    reasonEn: "HPC requires a dedicated binder, admixture, and durability model."
  },
  SCC: {
    support: "active",
    mode: "specialized",
    methodId: "scc-specialized",
    nameAr: "محرك SCC متخصص",
    nameFr: "Méthode spécialisée BAP/SCC",
    nameEn: "Specialized SCC method",
    reasonAr: "SCC تحتاج تصميمًا يعتمد على حجم العجينة والمسحوق واختبارات التدفق ومقاومة الانفصال.",
    reasonFr: "Le SCC nécessite un dosage basé sur la pâte/poudre, l'écoulement et la stabilité.",
    reasonEn: "SCC requires paste/powder, flow, and stability-based mix design."
  },
  LWC: {
    support: "planned",
    mode: "specialized",
    methodId: "lightweight-specialized",
    nameAr: "محرك الخرسانة خفيفة الوزن",
    nameFr: "Méthode spécialisée béton léger",
    nameEn: "Specialized lightweight method",
    reasonAr: "الركام الخفيف يتطلب حسابًا مستقلًا للامتصاص والترطيب المسبق والكثافة.",
    reasonFr: "Les granulats légers nécessitent un calcul spécifique d'absorption, pré-humidification et densité.",
    reasonEn: "Lightweight aggregates require dedicated absorption, pre-wetting, and density calculations."
  },
  HWC: {
    support: "planned",
    mode: "specialized",
    methodId: "heavyweight-specialized",
    nameAr: "محرك الخرسانة ثقيلة الوزن",
    nameFr: "Méthode spécialisée béton lourd",
    nameEn: "Specialized heavyweight method",
    reasonAr: "الركام الثقيل يتطلب توازنًا حجميًا وكثافة وترسيبًا خاصًا.",
    reasonFr: "Les granulats lourds nécessitent un bilan volumique, une densité et un contrôle de ségrégation spécifiques.",
    reasonEn: "Heavyweight aggregates require dedicated volumetric, density, and segregation controls."
  },
  RCC: {
    support: "planned",
    mode: "specialized",
    methodId: "rcc-specialized",
    nameAr: "محرك RCC متخصص",
    nameFr: "Méthode spécialisée BCR/RCC",
    nameEn: "Specialized RCC method",
    reasonAr: "RCC تعتمد على الرطوبة المثلى والدمك بالطاقة لا على نموذج الهبوط التقليدي.",
    reasonFr: "Le BCR/RCC dépend de l'humidité optimale et de l'énergie de compactage plutôt que de l'affaissement classique.",
    reasonEn: "RCC depends on optimum moisture and compaction energy rather than conventional slump design."
  },
  SHOTCRETE: {
    support: "planned",
    mode: "specialized",
    methodId: "shotcrete-specialized",
    nameAr: "محرك الخرسانة المقذوفة",
    nameFr: "Méthode spécialisée béton projeté",
    nameEn: "Specialized shotcrete method",
    reasonAr: "الخرسانة المقذوفة تحتاج حسابات خاصة للمسرّع والارتداد والألياف.",
    reasonFr: "Le béton projeté nécessite des contrôles spécifiques des accélérateurs, rebond et fibres.",
    reasonEn: "Shotcrete requires dedicated accelerator, rebound, and fiber controls."
  },
  GPC: {
    support: "planned",
    mode: "specialized",
    methodId: "geopolymer-specialized",
    nameAr: "محرك الخرسانة الجيوبوليمرية",
    nameFr: "Méthode spécialisée géopolymère",
    nameEn: "Specialized geopolymer method",
    reasonAr: "GPC لا تعتمد على نظام ترطيب الإسمنت البورتلاندي في نموذج درو-غوريس.",
    reasonFr: "Le GPC ne repose pas sur le système d'hydratation du ciment Portland de Dreux-Gorisse.",
    reasonEn: "GPC does not use the Portland-cement hydration basis of Dreux-Gorisse."
  },
  SHC: {
    support: "planned",
    mode: "specialized",
    methodId: "self-healing-specialized",
    nameAr: "محرك الخرسانة ذاتية المعالجة",
    nameFr: "Méthode spécialisée béton auto-réparant",
    nameEn: "Specialized self-healing method",
    reasonAr: "عامل المعالجة الذاتية يجب أن يدخل كعنصر تصميم مستقل مع تحقق التوافق والجرعة.",
    reasonFr: "L'agent auto-réparant doit être traité comme un constituant de conception indépendant avec contrôle de compatibilité et dosage.",
    reasonEn: "The self-healing agent must be treated as an independent design constituent with compatibility and dosage checks."
  },
  RAC: {
    support: "planned",
    mode: "specialized",
    methodId: "recycled-aggregate-specialized",
    nameAr: "محرك الركام المعاد تدويره",
    nameFr: "Méthode spécialisée granulats recyclés",
    nameEn: "Specialized recycled-aggregate method",
    reasonAr: "الركام المعاد يتطلب تعويضات امتصاص وترطيب وفحص جودة إضافي.",
    reasonFr: "Les granulats recyclés nécessitent des corrections spécifiques d'absorption, pré-humidification et qualité.",
    reasonEn: "Recycled aggregates require dedicated absorption, pre-wetting, and quality corrections."
  },
  PERVIOUS: {
    support: "active",
    mode: "specialized",
    methodId: "pervious-specialized",
    nameAr: "محرك الخرسانة المسامية",
    nameFr: "Méthode spécialisée béton drainant",
    nameEn: "Specialized pervious method",
    reasonAr: "الخرسانة المسامية تحتاج تصميمًا مستقلًا للمسامية والفراغات والنفاذية.",
    reasonFr: "Le béton drainant nécessite un dosage indépendant de la porosité, des vides et de la perméabilité.",
    reasonEn: "Pervious concrete requires dedicated porosity, void, and permeability design."
  },
  UHPC: {
    support: "planned",
    mode: "specialized",
    methodId: "uhpc-specialized",
    nameAr: "محرك UHPC/BFUP متخصص",
    nameFr: "Méthode spécialisée UHPC/BFUP",
    nameEn: "Specialized UHPC/BFUP method",
    reasonAr: "UHPC/BFUP تحتاج تصميمًا منفصلًا لهيكل الحبيبات الناعم جدًا والألياف والملدن.",
    reasonFr: "UHPC/BFUP nécessite un dosage séparé du squelette granulaire fin, des fibres et du superplastifiant.",
    reasonEn: "UHPC/BFUP requires a dedicated fine-powder skeleton, fiber, and superplasticizer design."
  },
  BFUP: {
    support: "planned",
    mode: "specialized",
    methodId: "uhpc-specialized",
    nameAr: "محرك UHPC/BFUP متخصص",
    nameFr: "Méthode spécialisée UHPC/BFUP",
    nameEn: "Specialized UHPC/BFUP method",
    reasonAr: "BFUP تحتاج تصميمًا منفصلًا لهيكل الحبيبات الدقيق جدًا والألياف.",
    reasonFr: "Le BFUP nécessite un dosage séparé du squelette fin et des fibres.",
    reasonEn: "BFUP requires a dedicated fine-powder and fiber design."
  },
  FRC: {
    support: "planned",
    mode: "specialized",
    methodId: "fiber-reinforced-specialized",
    nameAr: "محرك الخرسانة المسلحة بالألياف",
    nameFr: "Méthode spécialisée béton fibré",
    nameEn: "Specialized fiber-reinforced method",
    reasonAr: "تصميم FRC يجب أن يأخذ جرعة الألياف وتأثيرها على التشغيلية والمقاومة في مسار مستقل.",
    reasonFr: "Le FRC doit intégrer le dosage des fibres et leur effet sur l'ouvrabilité et les performances.",
    reasonEn: "FRC design must explicitly model fiber dosage and its effects on workability and performance."
  }
};

const DEFAULT_ROUTE = ROUTES.NSC;

function normalizeConcreteType(value: unknown): string {
  if (typeof value === "string") return value.trim().toUpperCase();
  if (value && typeof value === "object") {
    const candidate = value as Record<string, unknown>;
    return String(candidate.code || candidate.concreteType || "NSC").trim().toUpperCase();
  }
  return "NSC";
}

export function selectConcreteMixDesignRoute(
  input: Pick<MixDesignInput, "concreteType">,
  requestedMethodId?: string
): ConcreteMixDesignRoute {
  const concreteType = normalizeConcreteType(input?.concreteType);
  const base = ROUTES[concreteType] || DEFAULT_ROUTE;
  const explicit = Boolean(requestedMethodId && requestedMethodId !== "auto");

  return {
    concreteType,
    methodId: explicit ? String(requestedMethodId) : String((base as any).methodId || "dreux-gorisse"),
    support: base.support,
    mode: base.mode,
    autoSelected: !explicit,
    nameAr: base.nameAr,
    nameFr: base.nameFr,
    nameEn: base.nameEn,
    reasonAr: base.reasonAr,
    reasonFr: base.reasonFr,
    reasonEn: base.reasonEn
  };
}

export function getConcreteTypeRouteTable(): ConcreteMixDesignRoute[] {
  return Object.entries(ROUTES).map(([concreteType, route]) => ({
    concreteType,
    methodId: String((route as any).methodId || "dreux-gorisse"),
    support: route.support,
    mode: route.mode,
    autoSelected: true,
    nameAr: route.nameAr,
    nameFr: route.nameFr,
    nameEn: route.nameEn,
    reasonAr: route.reasonAr,
    reasonFr: route.reasonFr,
    reasonEn: route.reasonEn
  }));
}
