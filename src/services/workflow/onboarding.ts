export type OnboardingRole = "design-engineer" | "lab-quality";

export interface OnboardingPathDefinition {
  role: OnboardingRole;
  title: { ar: string; fr: string; en: string };
  description: { ar: string; fr: string; en: string };
  minimumInputs: { ar: string[]; fr: string[]; en: string[] };
  expectedOutputs: { ar: string[]; fr: string[]; en: string[] };
  boundaries: { ar: string[]; fr: string[]; en: string[] };
}

export const ONBOARDING_PATHS: OnboardingPathDefinition[] = [
  {
    role: "design-engineer",
    title: { ar: "مهندس تصميم", fr: "Ingénieur de formulation", en: "Design Engineer" },
    description: { ar: "أنشئ متطلبات المشروع، تحقق من المواد، ثم صمّم خلطة قابلة للمراجعة.", fr: "Définissez le projet, vérifiez les matériaux, puis formulez un mélange révisable.", en: "Set project requirements, verify materials, then create a reviewable mix design." },
    minimumInputs: { ar: ["اسم المشروع والعميل", "المقاومة والهبوط", "مواد معتمدة أو قابلة للتحقق"], fr: ["Projet et client", "Résistance et affaissement", "Matériaux approuvés ou vérifiables"], en: ["Project and client", "Strength and slump", "Approved or verifiable materials"] },
    expectedOutputs: { ar: ["جرعات الخلطة لكل m³", "سجل الحسابات والتحقق", "تقرير أولي للمراجعة"], fr: ["Dosages par m³", "Trace de calcul et vérification", "Rapport préliminaire"], en: ["Dosage per m³", "Calculation and verification trace", "Preliminary review report"] },
    boundaries: { ar: ["لا يوجد إصدار نهائي دون بوابات التحقق", "الخلطة التجريبية والمراجعة المعملية مطلوبة قبل التنفيذ"], fr: ["Aucune émission finale sans contrôles", "Une gâchée d'essai et une revue labo sont requises"], en: ["No final release without verification gates", "Trial mix and lab review are required before execution"] }
  },
  {
    role: "lab-quality",
    title: { ar: "فني مختبر / جودة", fr: "Technicien laboratoire / qualité", en: "Lab / Quality Technician" },
    description: { ar: "أنشئ جلسة فحص، وثّق سلسلة الحيازة، وسجّل النتائج والأدلة دون تعديل المواد مباشرة.", fr: "Créez une session, tracez la chaîne de garde et enregistrez les preuves sans modifier directement les matériaux.", en: "Create a test session, record custody and evidence, without directly changing material data." },
    minimumInputs: { ar: ["عينة ومصدرها", "المعيار والجهاز والمعايرة", "قراءات أصلية وتكرارات"], fr: ["Échantillon et provenance", "Norme, appareil et étalonnage", "Lectures brutes et répétitions"], en: ["Sample and provenance", "Standard, equipment and calibration", "Raw readings and replicates"] },
    expectedOutputs: { ar: ["نتيجة اختبار قابلة للتتبع", "سجل تدقيق وسلسلة حيازة", "اقتراح تحديث يحتاج اعتماداً"], fr: ["Résultat traçable", "Audit et chaîne de garde", "Proposition nécessitant approbation"], en: ["Traceable test result", "Audit and custody chain", "Proposal requiring approval"] },
    boundaries: { ar: ["النتيجة غير المتحققة لا تعتمد", "لا تتحول اقتراحات المواد إلى قيم حسابية دون دليل ومراجعة"], fr: ["Un résultat non vérifié ne peut être approuvé", "Les propositions exigent preuves et revue"], en: ["Unverified results cannot be approved", "Material proposals require evidence and review"] }
  }
];

export function getOnboardingPath(role: OnboardingRole): OnboardingPathDefinition {
  return ONBOARDING_PATHS.find(path => path.role === role) || ONBOARDING_PATHS[0];
}
