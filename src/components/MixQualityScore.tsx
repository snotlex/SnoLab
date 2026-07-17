import React, { useState, useMemo } from "react";
import { CheckCircle2, AlertTriangle, HelpCircle, ChevronDown, ChevronUp, Award, Droplet, Layers, ShieldCheck, Sparkles, Database, Code, Cpu } from "lucide-react";
import { useLanguage } from "../services/localization";

interface MixQualityScoreProps {
  wcRatio: number;
  fck28: number;
  controlClass: "high" | "normal" | "low";
  aggregateQuality: "excellent" | "standard" | "poor";
  hasPumping: boolean;
  admixturesCount: number;
  exposureClass?: string;
  sandAbsorption?: number;
  gravelAbsorption?: number;
  sandFineness?: number;
  admixtureRatio?: number;
  codeCompliance?: boolean;
  finalDensity?: number;
}

export const MixQualityScore: React.FC<MixQualityScoreProps> = ({
  wcRatio,
  fck28,
  controlClass,
  aggregateQuality,
  hasPumping,
  admixturesCount,
  exposureClass = "X0",
  sandAbsorption = 1.5,
  gravelAbsorption = 0.8,
  sandFineness = 2.6,
  admixtureRatio = 0,
  codeCompliance = true,
  finalDensity = 2400
}) => {
  const { language } = useLanguage();
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Compute a highly dynamic score (0 - 100) based on actual engineering inputs and ratios
  const breakdownData = useMemo(() => {
    const items = [];
    let score = 50; // starts at 50, computed dynamically based on 10 engineering checkpoints

    const safeWcRatio = typeof wcRatio === "number" && !isNaN(wcRatio) ? wcRatio : 0.45;

    // 1. Water to Cement Ratio (W/C) - Impact: max 15 points
    let wcPoints = 0;
    if (safeWcRatio >= 0.40 && safeWcRatio <= 0.48) {
      wcPoints = 15;
      items.push({
        id: "wc",
        nameAr: "نسبة الماء إلى الإسمنت (W/C) - مثالية",
        nameEn: "Ideal Water-Cement Ratio",
        nameFr: "Rapport Eau-Ciment Idéal (E/C)",
        status: "success",
        points: "+15",
        descAr: `النسبة الحالية (${safeWcRatio.toFixed(2)}) مثالية لضمان قوة ميكانيكية وتفادي النفاذية الشعرية الزائدة.`,
        descEn: `Your ratio (${safeWcRatio.toFixed(2)}) offers exceptional compaction potential with low capillary porosity.`,
        descFr: `Votre rapport (${safeWcRatio.toFixed(2)}) offre un potentiel de compactage exceptionnel avec une faible porosité capillaire.`,
        icon: <Droplet className="w-4 h-4 text-emerald-500" />
      });
    } else if (safeWcRatio > 0.48 && safeWcRatio <= 0.55) {
      wcPoints = 8;
      items.push({
        id: "wc",
        nameAr: "نسبة الماء إلى الإسمنت (W/C) - مقبولة",
        nameEn: "Moderate Water-Cement Ratio",
        nameFr: "Rapport Eau-Ciment Acceptable",
        status: "normal",
        points: "+8",
        descAr: `النسبة (${safeWcRatio.toFixed(2)}) كافية للتشغيلية القياسية لكنها تزيد المسامية المجهرية بشكل طفيف.`,
        descEn: `Ratio (${safeWcRatio.toFixed(2)}) provides standard workability but may marginally increase open pores.`,
        descFr: `Le rapport (${safeWcRatio.toFixed(2)}) offre une maniabilité standard mais peut augmenter légèrement les pores ouverts.`,
        icon: <Droplet className="w-4 h-4 text-blue-500" />
      });
    } else {
      wcPoints = -5;
      items.push({
        id: "wc",
        nameAr: "نسبة الـ W/C خارج المدى الهندسي الموصى به",
        nameEn: "Sub-optimal W/C Ratio",
        nameFr: "Rapport E/C Hors Limites",
        status: "danger",
        points: "-5",
        descAr: `النسبة (${safeWcRatio.toFixed(2)}) مرتفعة أو منخفضة بشكل حرج، مما يهدد بمشاكل في المقاومة أو جفاف شديد وصعوبة في الدمك.`,
        descEn: `Critical ratio (${safeWcRatio.toFixed(2)}) poses risks of either excessive bleeding/segregation or severe compaction resistance.`,
        descFr: `Le rapport critique (${safeWcRatio.toFixed(2)}) présente des risques de ressuage/ségrégation excessifs ou de forte résistance au compactage.`,
        icon: <Droplet className="w-4 h-4 text-rose-500" />
      });
    }
    score += wcPoints;

    // 2. Concrete Compressive Strength Limit (fck28) & Control Class - Impact: max 10 points
    let strengthPoints = 0;
    if (fck28 >= 40 && controlClass === "high") {
      strengthPoints = 10;
      items.push({
        id: "strength",
        nameAr: "درجة تحكم عالية مع مقاومة مستهدفة ممتازة",
        nameEn: "High Class Strength & Site Control",
        nameFr: "Haute Résistance et Contrôle Strict",
        status: "success",
        points: "+10",
        descAr: `المقاومة (${fck28} MPa) مدعومة برقابة وضبط مخبري عالي لضمان ثبات جودة العناصر ولتقييد الانحراف المعياري.`,
        descEn: `Target strength (${fck28} MPa) is reinforced by strict high site inspection to restrict standard deviation.`,
        descFr: `La résistance cible (${fck28} MPa) est renforcée par un contrôle strict sur chantier pour limiter l'écart-type.`,
        icon: <Award className="w-4 h-4 text-emerald-500" />
      });
    } else if (fck28 >= 25) {
      strengthPoints = 6;
      items.push({
        id: "strength",
        nameAr: "خرسانة هيكلية عادية ومطابقة",
        nameEn: "Standard Structural Strength Option",
        nameFr: "Résistance Structurelle Standard",
        status: "success",
        points: "+6",
        descAr: `المقاومة المطلوبة تقع في النطاق الإنشائي الشائع (${fck28} MPa)، مع درجة تحكم معملية عادية.`,
        descEn: `Standard structural design target (${fck28} MPa) managed with normal inspection criteria.`,
        descFr: `Cible de conception structurelle standard (${fck28} MPa) gérée avec des critères de contrôle normaux.`,
        icon: <Award className="w-4 h-4 text-blue-500" />
      });
    } else {
      strengthPoints = 2;
      items.push({
        id: "strength",
        nameAr: "مقاومة مستهدفة منخفضة ودرجة رقابة عادية",
        nameEn: "Low Concrete Resistance Limit",
        nameFr: "Résistance de Béton Faible",
        status: "warning",
        points: "+2",
        descAr: `مستوى مقاومة منخفض (${fck28} MPa) أو تحكم ميداني ضعيف يزيد تباين النتائج ومخاطر الفشل موقعياً.`,
        descEn: `Supervision of mix design is standard to low, which might result in higher deviation coefficient.`,
        descFr: `La supervision de la formulation est moyenne à faible, ce qui peut entraîner un coefficient d'écart plus élevé.`,
        icon: <Award className="w-4 h-4 text-amber-500" />
      });
    }
    score += strengthPoints;

    // 3. Exposure Class compatibility check - Impact: max 10 points
    let expPoints = 0;
    const isAggressiveExp = ["XD1", "XD2", "XD3", "XS1", "XS2", "XS3", "XA1", "XA2", "XA3"].includes(exposureClass);
    if (isAggressiveExp && safeWcRatio <= 0.45) {
      expPoints = 10;
      items.push({
        id: "exposure",
        nameAr: "مقاومة ممتازة لبيئات التعرق والكلوريدات",
        nameEn: "High Durability on Extreme Exposures",
        nameFr: "Haute Durabilité aux Expositions Extrêmes",
        status: "success",
        points: "+10",
        descAr: `فئة التعرض (${exposureClass}) تفرض شروط متانة قصوى. نسبة الماء المخفضة تحمي التسليح من الاختراق الصدأي.`,
        descEn: `Severe conditions (${exposureClass}) handled perfectly with safe micro-pores and tight water-to-cement ratio controls.`,
        descFr: `Conditions sévères (${exposureClass}) gérées parfaitement avec des micro-pores réduits et un rapport E/C contrôlé.`,
        icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />
      });
    } else if (!isAggressiveExp) {
      expPoints = 8;
      items.push({
        id: "exposure",
        nameAr: "بيئة صب عادية وتأكل كربوني منخفض X0/XC",
        nameEn: "Standard Environmental Exposure Match",
        nameFr: "Exposition Environnementale Standard",
        status: "success",
        points: "+8",
        descAr: `الخرسانة معرضة لشروط عادية أو معتدلة الرطوبة (${exposureClass}). نسبة الهيدرات تلبي حدود متانة الكود بشكل مريح.`,
        descEn: `Moderate environmental constraints (${exposureClass}). The active parameters are well within standard EN 206 criteria.`,
        descFr: `Contraintes environnementales modérées (${exposureClass}). Les paramètres actifs sont conformes à la norme EN 206.`,
        icon: <ShieldCheck className="w-4 h-4 text-blue-500" />
      });
    } else {
      expPoints = -3;
      items.push({
        id: "exposure",
        nameAr: "خطر تملح ودخول رطوبة على الخرسانة المسلحة",
        nameEn: "Permeability Risk under Extreme Elements",
        nameFr: "Risque de Perméabilité sous Climat Sévère",
        status: "danger",
        points: "-3",
        descAr: `شروط صعبة (${exposureClass}) مع نسبة ماء عالية (${safeWcRatio.toFixed(2)}). خطر انتشار تغلغل الكلوريدات بمرور السنين.`,
        descEn: `Highly aggressive class (${exposureClass}) but moisture volume is too loose for long-term passivation limits.`,
        descFr: `Classe très agressive (${exposureClass}) mais le volume d'eau libre est trop élevé pour une durabilité à long terme.`,
        icon: <ShieldCheck className="w-4 h-4 text-rose-500" />
      });
    }
    score += expPoints;

    // 4. Aggregate Quality - Impact: max 10 points
    let aggPoints = 0;
    if (aggregateQuality === "excellent") {
      aggPoints = 10;
      items.push({
        id: "agg-quality",
        nameAr: "جودة الركام الكلي ممتازة ونقية",
        nameEn: "High Aggregate Hardness & Shape",
        nameFr: "Haute Dureté & Forme des Granulats",
        status: "success",
        points: "+10",
        descAr: "الركام نقي من الشوائب ومستدير إلى زاوي مع تبلور مثالي يدعم الترابط الفيزيائي والتماسك مع المونة.",
        descEn: "Pure basalt or crushed limestone with extremely low silt fractions, reinforcing bond envelope.",
        descFr: "Basalte pur ou calcaire broyé avec des fractions de sédiments extrêmement faibles, renforçant l'adhérence.",
        icon: <Layers className="w-4 h-4 text-emerald-500" />
      });
    } else if (aggregateQuality === "standard") {
      aggPoints = 6;
      items.push({
        id: "agg-quality",
        nameAr: "جودة ركام قياسية ومعتمدة",
        nameEn: "Standard Multi-sized Aggregates",
        nameFr: "Granulats Standard Homologués",
        status: "success",
        points: "+6",
        descAr: "الركام يطابق المواثيق المعيارية ويوصف بخصائص مرنة ملائمة للصبات التقليدية والمشاريع الاعتيادية.",
        descEn: "Standard commercial aggregate supply conforming to structural mechanical safety regulations.",
        descFr: "Fourniture standard de granulats conforme aux réglementations de sécurité structurelle.",
        icon: <Layers className="w-4 h-4 text-blue-500" />
      });
    } else {
      aggPoints = -4;
      items.push({
        id: "agg-quality",
        nameAr: "جودة ركام منخفضة ومقلقة لمتانة الطلاء",
        nameEn: "Poor Aggregate Silt & Flakiness Index",
        nameFr: "Qualité Faible des Granulats",
        status: "danger",
        points: "-4",
        descAr: "يلاحظ تواجد ناعم زائد أو حبيبات مفلطحة مستطيلة تقلل من تماسك الخرسانة وصمودها مع قوى الضغط.",
        descEn: "High risk of excessive wear, poor particle matrix packing or excessive dust absorbing water dynamically.",
        descFr: "Risque élevé d'usure, de mauvais compactage ou d'absorption d'eau excessive par les poussières.",
        icon: <Layers className="w-4 h-4 text-rose-500" />
      });
    }
    score += aggPoints;

    // 5. Sand Absorption Rate - Impact: max 8 points
    let sandAbsPoints = 0;
    if (sandAbsorption <= 1.2) {
      sandAbsPoints = 8;
      items.push({
        id: "sand-absorption",
        nameAr: "معدل امتصاص رمل منخفض (مثالي)",
        nameEn: "Optimal Low Sand Absorption",
        nameFr: "Faible Absorption du Sable (Idéal)",
        status: "success",
        points: "+8",
        descAr: `امتصاص الرمل (${sandAbsorption}٪) منخفض جداً، ما يمنع سحب وامتصاص مياه الخلط الحرة بالخلاطة الميدانية.`,
        descEn: `Aggregates' absorption rate of sand (${sandAbsorption}%) is minimal, preserving hydration water without moisture loss.`,
        descFr: `Le taux d'absorption du sable (${sandAbsorption}%) est minimal, préservant l'eau d'hydratation.`,
        icon: <Database className="w-4 h-4 text-emerald-500" />
      });
    } else if (sandAbsorption <= 2.2) {
      sandAbsPoints = 5;
      items.push({
        id: "sand-absorption",
        nameAr: "امتصاص رمل متوسط ومسيطر عليه",
        nameEn: "Acceptable Sand Absorption Value",
        nameFr: "Absorption du Sable Acceptable",
        status: "normal",
        points: "+5",
        descAr: `امتصاص الرمل (${sandAbsorption}٪) يقع في المعايير المقبولة. يتطلب تتبع كميات رطوبة دائم بالمقالع.`,
        descEn: `Fine aggregates absolute absorption (${sandAbsorption}%) is standard, needing standard batch adjustment procedures.`,
        descFr: `L'absorption absolue des granulats fins (${sandAbsorption}%) est standard, nécessitant des procédures de correction d'humidité.`,
        icon: <Database className="w-4 h-4 text-blue-500" />
      });
    } else {
      sandAbsPoints = 1;
      items.push({
        id: "sand-absorption",
        nameAr: "امتصاص رمل مرتفع يزيد من عطش المواد",
        nameEn: "High Sand Absorption Rate",
        nameFr: "Absorption Élevée du Sable",
        status: "warning",
        points: "+1",
        descAr: `امتصاص الرمل مرتفع (${sandAbsorption}٪). قد ينعش سحب أو تبخر المياه ويقلل الهبوط المتوقع موقعياً بشكل متسارع.`,
        descEn: `Porosity absorption (${sandAbsorption}%) is elevated, potentially demanding early slump mitigation or higher dosages.`,
        descFr: `L'absorption du sable (${sandAbsorption}%) est élevée, demandant une attention particulière sur la perte d'affaissement.`,
        icon: <Database className="w-4 h-4 text-rose-500" />
      });
    }
    score += sandAbsPoints;

    // 6. Gravel Absorption Rate - Impact: max 7 points
    let gravelAbsPoints = 0;
    if (gravelAbsorption <= 0.8) {
      gravelAbsPoints = 7;
      items.push({
        id: "gravel-absorption",
        nameAr: "امتصاص ركام منخفض وثابت الأبعاد",
        nameEn: "Low Porous Gravel Absorption",
        nameFr: "Faible Absorption du Gravier",
        status: "success",
        points: "+7",
        descAr: `امتصاص الحصى (${gravelAbsorption}٪) منخفض وممتاز. يمنح الخرسانة تجانساً حجرياً ومقاومة جيدة لدورات الصقيع.`,
        descEn: `Coarse aggregates are dense with minimal open pore absorption (${gravelAbsorption}%), which limits fluid ingress.`,
        descFr: `Les granulats grossiers sont denses avec une absorption minimale (${gravelAbsorption}%), limitant la pénétration de fluide.`,
        icon: <Database className="w-4 h-4 text-emerald-500" />
      });
    } else if (gravelAbsorption <= 1.5) {
      gravelAbsPoints = 4;
      items.push({
        id: "gravel-absorption",
        nameAr: "امتصاص حصى متوسط (قياسي)",
        nameEn: "Acceptable Coarse Aggregate Absorption",
        nameFr: "Absorption Gravier Standard",
        status: "normal",
        points: "+4",
        descAr: `القيمة (${gravelAbsorption}٪) نموذجية ولا تؤثر سلباً على تفاعلات الإسمنت العادية في الظروف القياسية.`,
        descEn: `Typical quartz or granite gravel with normal water storage constraints (${gravelAbsorption}%).`,
        descFr: `Gravier de quartz ou granit typique avec des contraintes d'absorption normales (${gravelAbsorption}%).`,
        icon: <Database className="w-4 h-4 text-blue-500" />
      });
    } else {
      gravelAbsPoints = 0;
      items.push({
        id: "gravel-absorption",
        nameAr: "حصى مسامي عالي الامتصاص",
        nameEn: "Highly Absorbent Porous Aggregates",
        nameFr: "Gravier Poreux Très Absorbant",
        status: "warning",
        points: "+0",
        descAr: `الركام مسامي ويمتص الماء بشدة (${gravelAbsorption}٪)، مما قد يسبب هبوطاً مفاجئاً بعد خلط الخرسانة بمدة قصيرة.`,
        descEn: `Excessive porous structures. Highly recommend pre-damping the stockpile before batching.`,
        descFr: `Structures hautement poreuses. Il est fortement conseillé de pré-humidifier le stock avant gâchée.`,
        icon: <Database className="w-4 h-4 text-amber-500" />
      });
    }
    score += gravelAbsPoints;

    // 7. Grading / Fineness Modulus of Sand - Impact: max 10 points
    let fmPoints = 0;
    if (sandFineness >= 2.4 && sandFineness <= 2.9) {
      fmPoints = 10;
      items.push({
        id: "sand-fineness",
        nameAr: "تدرج ومعامل رمل مثالي جداً للرص ومقاومة الفصل",
        nameEn: "Excellent Sand Fineness Modulus Range",
        nameFr: "Module de Finesse du Sable Idéal",
        status: "success",
        points: "+10",
        descAr: `قيمة معامل النعومة (${sandFineness}) ممتازة وتضمن تعبئة الفجوات وتسهل التدفق داخل الخلاطة ومضخات الخرطوم.`,
        descEn: `Sand fineness modulus (${sandFineness}) provides high compaction dense paste while preserving excellent rheology.`,
        descFr: `Le module de finesse (${sandFineness}) permet un compactage élevé tout en maintenant une excellente rhéologie.`,
        icon: <Code className="w-4 h-4 text-emerald-500" />
      });
    } else {
      fmPoints = 5;
      items.push({
        id: "sand-fineness",
        nameAr: "رمل ناعم جداً أو خشن يغير من طلب الملتكس",
        nameEn: "Sub-optimal Sieve Grading Balance",
        nameFr: "Granulométrie du Sable Non-Optimale",
        status: "warning",
        points: "+5",
        descAr: `معامل النعومة (${sandFineness}) يقع خارج المدى المثالي، مما قد يتطلب تعديل طفيف لنسب الرزم أو الإضافات.`,
        descEn: `Aggregates' fineness is outside standard 2.4 - 2.9 limits, requiring careful adjustments to ensure homogeneity.`,
        descFr: `La finesse du sable est en dehors des limites standard de 2.4 - 2.9, exigeant des corrections minimes.`,
        icon: <Code className="w-4 h-4 text-amber-500" />
      });
    }
    score += fmPoints;

    // 8. Chemical Admixture Ratio Optimization - Impact: max 10 points
    let admRatioPoints = 0;
    if (admixturesCount > 0 && admixtureRatio >= 0.8 && admixtureRatio <= 2.0) {
      admRatioPoints = 10;
      items.push({
        id: "admixture-opt",
        nameAr: "توظيف عيار ملدن فائق ذكي ومطهر للخرسانة",
        nameEn: "Highly Optimized Admixture Treatment",
        nameFr: "Traitement Adjuvant Fortement Optimisé",
        status: "success",
        points: "+10",
        descAr: `الملدن الفائق (${admixtureRatio}٪) يساهم في فك تجمعات الرابط وتقليل استهلاك الماء مع تمديد التشغيلية السريعة.`,
        descEn: `Dynamic plasticizer dosage (${admixtureRatio}%) achieves critical hydration activity with low absolute water targets.`,
        descFr: `L'adjuvant dynamique (${admixtureRatio}%) permet une excellente hydratation avec un volume d'eau réduit.`,
        icon: <Sparkles className="w-4 h-4 text-violet-500" />
      });
    } else if (admixturesCount > 0) {
      admRatioPoints = 7;
      items.push({
        id: "admixture-opt",
        nameAr: "نظام إضافات نشط بمجرى الخلط",
        nameEn: "Active Admixture Processing",
        nameFr: "Ajout Actif d'Adjuvant",
        status: "success",
        points: "+7",
        descAr: `المضافات الكيماوية نشطة بالخلطة وتمنح لزوجة مرضية تدعم حركة التدفق والكبس السليم.`,
        descEn: `Admixtures are active. Provides good performance, standard slump retention under hot summer seasons.`,
        descFr: `Adjuvants actifs, offrant une maniabilité correcte pour les coulage d'été par temps chaud.`,
        icon: <Sparkles className="w-4 h-4 text-blue-500" />
      });
    } else {
      admRatioPoints = 2;
      items.push({
        id: "admixture-opt",
        nameAr: "غياب المضافات يحث على استخدام مكثف للمياه",
        nameEn: "Conventional Non-Admixture Mix Design",
        nameFr: "Formulation Classique sans Adjuvant",
        status: "normal",
        points: "+2",
        descAr: "لا تستخدم الخلطة أي ملدنات سائلة. يتطلب رصاً ميكانيكياً مكثفاً للغاية لتجنب التسوس وتأمين الفوهات.",
        descEn: "Traditional concrete mix with no dispersing chemical additives. Harder compaction required.",
        descFr: "Mélange traditionnel sans fluidifiant chimique. Un compactage plus intense est exigé.",
        icon: <Sparkles className="w-4 h-4 text-slate-400" />
      });
    }
    score += admRatioPoints;

    // 9. Standard Code Compliance Check - Impact: max 10 points
    let compPoints = 0;
    if (codeCompliance) {
      compPoints = 10;
      items.push({
        id: "code-compliance",
        nameAr: "مطابقة كاملة للأكواد والمواصفات المعيارية",
        nameEn: "Fully Compliant with Structural Codes",
        nameFr: "Entièrement Conforme aux Codes",
        status: "success",
        points: "+10",
        descAr: "التصميم يطابق اشتراطات الأكواد الإنشائية المعتمدة (EN 206) تماماً ولا يحمل تجاوزات أمان خطيرة.",
        descEn: "The structural recipe parameters comply entirely with EN 206 safety factor regulations.",
        descFr: "Les paramètres de la recette sont entièrement conformes aux critères de sécurité de la norme EN 206.",
        icon: <Cpu className="w-4 h-4 text-emerald-500" />
      });
    } else {
      compPoints = 2;
      items.push({
        id: "code-compliance",
        nameAr: "تجاوزات طفيفة ببعض متطلبات الكود المحدبة",
        nameEn: "Marginal Compliance Warning Limits",
        nameFr: "Conformité Marginale",
        status: "warning",
        points: "+2",
        descAr: "تم رصد بعض النقاط الخارجة عن حدود متطلبات الكود الموصى بها كحدود المقاومة الصغرى أو نسب المقايسة الحريصة.",
        descEn: "Some calculated parameter margins deviate slightly from primary structural code requirements.",
        descFr: "Certains paramètres s'écartent légèrement des recommandations primaires de la norme.",
        icon: <Cpu className="w-4 h-4 text-rose-500" />
      });
    }
    score += compPoints;

    // 10. Density & Compactness - Impact: max 10 points
    let densityPoints = 0;
    if (finalDensity >= 2380) {
      densityPoints = 10;
      items.push({
        id: "compact-density",
        nameAr: "كثافة ممتازة وتراص متكامل الحبيبات",
        nameEn: "Excellent Absolute Compact Density",
        status: "success",
        points: "+10",
        descAr: `الكثافة الطازجة المحتسبة (${finalDensity.toFixed(0)} kg/m³) تسجل توزيعاً متراصاً متماسك القوام ومقاوم لدخول الرطوبة.`,
        descEn: `Calculated compact density (${finalDensity.toFixed(0)} kg/m³) promises extremely low micro-voids fraction.`,
        icon: <Layers className="w-4 h-4 text-emerald-500" />
      });
    } else if (finalDensity >= 2300) {
      densityPoints = 7;
      items.push({
        id: "compact-density",
        nameAr: "خرسانة عادية متراصة نموذجياً",
        nameEn: "Standard Bulk Fresh Density",
        status: "success",
        points: "+7",
        descAr: `التصميم يسجل توزيع ممتلئ عريض الكثافة للخرسانة (${finalDensity.toFixed(0)} kg/m³) يلائم المتطلبات الكلاسيكية بموضوعية.`,
        descEn: `Computed target fresh mass (${finalDensity.toFixed(0)} kg/m³) aligns perfectly with average stone concrete sizes.`,
        icon: <Layers className="w-4 h-4 text-blue-500" />
      });
    } else {
      densityPoints = 3;
      items.push({
        id: "compact-density",
        nameAr: "كثافة تقريبية منخفضة قد تشير لارتفاع حجم الفجوات",
        nameEn: "Low Weight Compactness Indicator",
        status: "warning",
        points: "+3",
        descAr: `الكثافة المنخفضة للخرسانة (${finalDensity.toFixed(0)} kg/m³) قد تدعو للشك بسلامة رص الهيكل الحبيبي وتوزيع الفراغات المعتمد وتحث على المراجعة.`,
        descEn: `Mix mass (${finalDensity.toFixed(0)} kg/m³) is relatively light, indicating higher porous phase or lightweight aggregate.`,
        icon: <Layers className="w-4 h-4 text-amber-500" />
      });
    }
    score += densityPoints;

    const finalScore = Math.max(10, Math.min(100, score));
    return { score: finalScore, items };
  }, [
    wcRatio,
    fck28,
    controlClass,
    aggregateQuality,
    hasPumping,
    admixturesCount,
    exposureClass,
    sandAbsorption,
    gravelAbsorption,
    sandFineness,
    admixtureRatio,
    codeCompliance,
    finalDensity
  ]);

  const score = breakdownData.score;

  // Rating label with associated styling
  const ratingLabel = useMemo(() => {
    if (score >= 90) return {
      text: language === "ar" ? "درجة ممتازة الأداء (Optimized Masterpiece)" : language === "fr" ? "Performance Excellente (Optimisée)" : "Optimized Masterpiece Performance Grade",
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    };
    if (score >= 80) return {
      text: language === "ar" ? "خلطة متوازنة وقوية (Robust Design)" : language === "fr" ? "Conception Robuste (Équilibrée)" : "Robust Mix Design (Balanced)",
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20"
    };
    if (score >= 65) return {
      text: language === "ar" ? "خرسانة عادية مقبولة (Acceptable Grade)" : language === "fr" ? "Qualité Acceptable (Standard)" : "Acceptable Utility Grade (Standard)",
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20"
    };
    return {
      text: language === "ar" ? "أداء حرج يحتاج لمعالجة (Sub-Critical Standard)" : language === "fr" ? "Performance Sous-Critique" : "Sub-Critical Utility Grade (Requires Attention)",
      color: "text-rose-500 bg-rose-500/10 border-rose-500/20"
    };
  }, [score, language]);

  // SVG parameters
  const strokeWidth = 8;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative overflow-hidden transition-all duration-300 hover:shadow-md text-right flex flex-col h-full" id="mix-quality-card">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
        <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">
          📊 Mix Quality Audit Index
        </span>
        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/40">
          EN 206 Assess
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
        {/* SVG Circle */}
        <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="rgba(100, 116, 139, 0.1)"
              strokeWidth={strokeWidth}
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke={score >= 90 ? "#10B981" : score >= 80 ? "#3B82F6" : score >= 65 ? "#F59E0B" : "#EF4444"}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out animate-pulse"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white leading-none">
              {score}
            </span>
            <span className="text-[9.5px] text-slate-400 font-bold mt-1 font-mono uppercase">POINTS</span>
          </div>
        </div>

        {/* Text and Diagnostic badge */}
        <div className="space-y-2 text-right flex-1 w-full">
          <div className={`inline-block text-xs font-black px-3 py-1.5 rounded-xl border ${ratingLabel.color} w-full text-center leading-none`}>
            {ratingLabel.text}
          </div>
          
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            {language === "ar"
              ? "مؤشر تحليلي ذكي يدمج بين نسبة الماء/الإسمنت وعيار الحصمة المتدرجة وقوة الفحص لتقييم متانة وجودة الخلطة من 100 نقطة."
              : language === "fr"
              ? "Indice d'audit intelligent qui intègre le rapport E/C, la granulométrie des granulats et la résistance pour évaluer la durabilité du mélange sur 100 points."
              : "An intelligent audit index integrating W/C ratio, aggregate grading, and test strength to assess overall durability on a 100-point scale."}
          </p>
        </div>
      </div>

      {/* Accordion detail toggle for structural breakdown */}
      <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3">
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="flex items-center justify-between w-full py-1 text-xs font-black text-slate-700 dark:text-slate-300 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <span>
            {showBreakdown
              ? (language === "ar" ? "إخفاء التفاسير التفصيلية لنقاط الجودة" : language === "fr" ? "Masquer le détail complet des points" : "Hide detailed quality points breakdown")
              : (language === "ar" ? "عرض تفصيل أسباب التقييم وهندسة النقاط (+/-)" : language === "fr" ? "Afficher le détail de l'évaluation (+/-)" : "Show detailed quality audit breakdown (+/-)")}
          </span>
          {showBreakdown ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {showBreakdown && (
          <div className="mt-3 space-y-2.5 max-h-[280px] overflow-y-auto pr-1" style={{ direction: language === "ar" ? "rtl" : "ltr" }}>
            {breakdownData.items.map((item, idx) => (
              <div 
                key={idx}
                className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-right flex gap-2.5 items-start"
              >
                <div className="p-1.5 bg-white dark:bg-slate-900 rounded-lg shrink-0 border border-slate-200/50 dark:border-slate-805">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-black text-slate-850 dark:text-slate-100">
                      {language === "ar" ? item.nameAr : language === "fr" ? (item.nameFr || item.nameEn) : item.nameEn}
                    </span>
                    <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                      item.points.startsWith("+") 
                        ? "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400" 
                        : "text-rose-600 bg-rose-500/10 dark:text-rose-400"
                    }`}>
                      {item.points}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                    {language === "ar" ? item.descAr : language === "fr" ? (item.descFr || item.descEn) : item.descEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
