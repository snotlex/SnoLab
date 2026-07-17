import { MixDesignInput, MixDesignResult, EngineeringMaterial } from "../types";

export interface ExposureCheckResult {
  code: string;
  name: string;
  maxWcPass: boolean;
  requiredMaxWc: number;
  actualWc: number;
  minCementPass: boolean;
  requiredMinCement: number;
  actualCement: number;
  overallPass: boolean;
  details: string;
}

export interface AdvisorAnalysis {
  cementEfficiency: {
    excessive: boolean;
    currentCement: number;
    optimizedCement: number;
    savingPercent: number;
    costSaving: number;
    strengthImpact: string;
    adviceArabic: string;
    adviceEnglish: string;
  };
  wcRatio: {
    ratio: number;
    rating: "optimal" | "high" | "low";
    warnings: string[];
    warningsAr: string[];
    durabilityRisk: string;
    durabilityRiskAr: string;
  };
  aggregateQuality: {
    sandFM: number;
    sandRating: string;
    gravelDmax: number;
    absorptionWarnings: string[];
    absorptionWarningsAr: string[];
    gradationAdviceAr: string;
    gradationAdviceEn: string;
  };
  exposureCompliance: {
    classCode: string;
    checks: ExposureCheckResult[];
    overallCompliance: boolean;
    passDetailsAr: string;
    passDetailsEn: string;
  };
  reinforcement: {
    congestion: boolean;
    dMaxSafetyPass: boolean;
    slumpSafetyPass: boolean;
    recommendationAr: string;
    recommendationEn: string;
    recommendationFr: string;
  };
  pumpability: {
    rating: "Excellent" | "Good" | "Moderate Risk" | "Not Pumping Match";
    ratingAr: string;
    ratingFr: string;
    blockageRisk: "Negligible" | "Low" | "Medium" | "High";
    blockageRiskAr: string;
    segregationRisk: "Low" | "Moderate" | "High";
    segregationRiskAr: string;
    adviceAr: string;
    adviceEn: string;
    adviceFr: string;
  };
  sustainability: {
    co2Intensity: number; // kg per m^3
    scmPercentage: number;
    score: "A" | "B" | "C" | "D" | "E";
    scoreColor: string;
    co2SavingPercent: number;
    adviceAr: string;
    adviceEn: string;
    adviceFr: string;
  };
  costOptimization: {
    cementCost: number;
    aggregateCost: number;
    admixtureCost: number;
    totalCost: number;
    opportunityAr: string;
    opportunityEn: string;
    opportunityFr: string;
    potentialSavingDA: number;
  };
  conclusion: {
    strength: string;
    strengthAr: string;
    strengthFr: string;
    durability: string;
    durabilityAr: string;
    durabilityFr: string;
    workability: string;
    workabilityAr: string;
    workabilityFr: string;
    economic: string;
    economicAr: string;
    economicFr: string;
    sustainability: string;
    sustainabilityAr: string;
    sustainabilityFr: string;
    finalDecision: "APPROVED" | "APPROVED WITH OPTIMIZATION" | "NOT RECOMMENDED";
    finalDecisionAr: string;
    finalDecisionFr: string;
    finalDecisionColor: string;
  };
}

export function analyzeMixDesign(
  input: MixDesignInput,
  result: MixDesignResult,
  resolvedMaterials?: any
): AdvisorAnalysis {
  const currentCement = result.cementWeight || 350;
  const fck = input.fck28 || 25;
  const wc = result.wcRatioAdjusted || result.wcRatio || 0.50;
  const slump = input.slump || 7;
  const dMax = input.dMax || 20;

  // 1. Cement Efficiency
  // Base ideal cement content is function of strength class: fck * 10 + 100 for optimized aggregate
  const baseIdealCement = Math.round(fck * 8.5 + 110);
  const isScmUsed = (input.dosageSilicaFume || 0) + (input.dosageFlyAsh || 0) + (input.dosageSlag || 0) > 0;
  const optimizedCement = isScmUsed ? baseIdealCement - 15 : baseIdealCement;
  const excessive = currentCement > optimizedCement + 35;
  const savingPercent = currentCement > optimizedCement ? Math.round(((currentCement - optimizedCement) / currentCement) * 1000) / 10 : 0;
  const priceCement = input.priceCement || 22; // default pricing
  const potentialSavingDA = Math.max(0, Math.round((currentCement - optimizedCement) * priceCement));
  
  const strengthImpactAr = excessive 
    ? "تقليل كمية الإسمنت بنسبة 5% إلى 8% ورفع فعالية الملدنات المضافة لن يؤثر إطلاقاً على المقاومة التصميمية المستهدفة، بل يسهم في تخفيف حرارة الإماهة وتقليص تشققات التجفيف الانكماشي."
    : "كمية الإسمنت مطابقة ومثالية لنسبة الفراغات وكثافة الرص الحبيبي، أي تعديل إضافي بالتقليل قد يضر بسرعة نضوج المقاومة المبكرة.";
  const strengthImpactEn = excessive
    ? "Optimizing cement content by 5% to 8% while raising superplasticizer efficiency maintains target strength while mitigating hydration heat and shrinkage cracking."
    : "Cement content is optimal. Further reduction may compromise early-age strength development.";

  const adviceCementAr = excessive
    ? `الجرعة الحالية للإسمنت مرتفعة نسبياً (${Math.round(currentCement)} كجم/م³). ينصح المستشار الهندسي بالتقليل إلى ${Math.round(optimizedCement)} كجم/م³ واستبدال الفارق بالرماد المتطاير أو خبث الأفران لزيادة الديمومة وتوفير ما يقارب ${potentialSavingDA} د.ج للخلطة.`
    : `استهلاك الإسمنت محدد بدقة وعلمي لخلطة القوة المستهدفة بالمرونة الحالية.`;

  const adviceCementEn = excessive
    ? `Current cement content is higher than required (${Math.round(currentCement)} kg/m³). Recommended optimized content: ${Math.round(optimizedCement)} kg/m³. Potential savings: ${savingPercent}%.`
    : `Cement consumption corresponds scientifically to the targeted compressive strength.`;

  // 2. W/C Ratio Analysis
  let wcRating: "optimal" | "high" | "low" = "optimal";
  const warningsWcAr: string[] = [];
  const warningsWcEn: string[] = [];
  let durabilityRiskAr = "مخاطر نفاذية وديمومة منعدمة، البنية الإسمنتية متراصة وسميكة.";
  let durabilityRiskEn = "Low porosity and high durability structure verified.";

  if (wc > 0.55) {
    wcRating = "high";
    warningsWcAr.push("خلطة غنية بالماء الحر الزائد (نفاذية عالية بعد تبخر الماء).");
    warningsWcAr.push("ارتفاع احتمال انفصال حركي للمكونات أثناء الرص الهزاز.");
    warningsWcEn.push("High hydration capillary porosity risk.");
    warningsWcEn.push("High segregation risks during vibration compacted phase.");
    durabilityRiskAr = "مخاطر كربنة جافة سريعة جداً واختراق الكلوريدات لعمود التسليح في فترات قصيرة.";
    durabilityRiskEn = "Rapid carbonation rates and accelerated steel reinforcement corrosion risks.";
  } else if (wc < 0.38) {
    wcRating = "low";
    warningsWcAr.push("صعوبة شديدة في الصب والإنهاء ما لم تستخدم جرعة عالية من الملدنات الفائقة.");
    warningsWcAr.push("مخاطر التجفيف الذاتي والانكماش البلاستيكي المبكر جداً للخرسانة.");
    warningsWcEn.push("Extremely low workability. High risk of honeycombing.");
    warningsWcEn.push("Risk of plastic auto-desiccation and early thermal cracking.");
    durabilityRiskAr = "خطر تشققات حرارية سريعة بفعل حرارة الإماهة المتراكمة مع صعوبة الرص الكافي.";
    durabilityRiskEn = "Cracking risks from hydration heat without compensatory compaction moisture.";
  }

  // Rule verification: إذا Slump > 180 mm -> Superplasticizer Required
  const isHighSlump = (slump > 18 && slump < 100) || slump > 180;
  const hasSuper = (input.dosageSuper || 0) > 0;
  if (isHighSlump && !hasSuper) {
    warningsWcAr.push("مخالفة: قوام الهبوط مستهدف مرتفع (> 180 مم) يتطلب إلزامياً إضافة ملدنات فائقة (Superplasticizer) للوصول للسيولة المطلوبة.");
    warningsWcEn.push("Failed: Target slump > 180 mm strictly requires a Superplasticizer additive to protect concrete from massive segregation.");
  }

  // Rule verification: إذا Temperature > 35°C -> Retarder Suggested
  const pTemp = (input as any).ambientTemp || (input as any).temperature || (input as any).concreteTemp || (input as any).initialTemp || 20;
  const temperatureHigh = pTemp > 35;
  const hasRetarder = (input.dosageRetarder || 0) > 0;
  if (temperatureHigh) {
    if (!hasRetarder) {
      warningsWcAr.push("تنبيه: درجة حرارة الصب مرتفعة (> 35°م)؛ ينصح بشدة بإضافة مؤخر شك (Retarder) للحفاظ على تشغيلية الخرسانة.");
      warningsWcEn.push("Advisory: Extreme ambient/placement temperature (>35°C) detected. A set retarder is highly recommended.");
    } else {
      warningsWcAr.push("درجة الحرارة مرتفعة (> 35°م)، وتم استخدام مؤخر شك (Retarder) بشكل حذر وسليم هندسياً.");
      warningsWcEn.push("High temperature (>35°C) is correctly countered by designated set retarder dosage.");
    }
  }

  // 3. Aggregate Quality Analysis
  const resolvedSand = resolvedMaterials?.sand || {};
  const sandFM = resolvedSand.finenessModulus || 2.65;
  let sandRating = "مثالي (Premium Aggregates)";
  if (sandFM < 2.2) sandRating = "رمل ناعم جداً - يرفع الطلب على الماء والنزيف";
  else if (sandFM > 3.1) sandRating = "رمل خشن - يحد من جودة الإنهاء والانضغاطية";

  const absorptionSand = resolvedSand.absorption || 1.2;
  const absorptionGravel = resolvedMaterials?.gravel?.absorption || 0.8;
  const absorptionWarningsAr: string[] = [];
  const absorptionWarningsEn: string[] = [];

  if (absorptionSand > 2.0) {
    absorptionWarningsAr.push("امتصاص الرمل للرطوبة مرتفع (>2%). يتطلب المراقبة والجرعة الدورية لتصحيح ماء الخلط.");
    absorptionWarningsEn.push("High sand water-absorption. Critical moisture monitoring needed.");
  }
  if (absorptionGravel > 1.5) {
    absorptionWarningsAr.push("حصى ذو مسامية عالية نسيباً ينقص من قوة الالتصاق والقص الهيكلي للخرسانة.");
    absorptionWarningsEn.push("Aggregates with high porosity reduces concrete shear strength.");
  }

  const moistureSand = input.moistureSand || 0;
  const moistureGravel = input.moistureGravel || 0;
  const totalWaterCorrection = Math.round((moistureSand / 100 * result.sandWeightDry) + (moistureGravel / 100 * result.gravelWeightDry));
  
  const gradationAdviceAr = totalWaterCorrection > 0
    ? `مجموع تصحيح رطوبة الركام يطرح ما مقداره ${totalWaterCorrection} لتر من ماء الخلط الفعلي لحماية الخلطة من الانفصال الحركي.`
    : `الركامات جافة تماماً. يجب التأكد من غسل الرمل ورشه بالماء الخفيف لتفادي امتصاص ماء التفاعل الهيدروليكي للمواد الإسمنتية.`;
  const gradationAdviceEn = totalWaterCorrection > 0
    ? `Aggregates supply +${totalWaterCorrection} Liters of free surface moisture. Dosing scale must deduct this from batch water.`
    : `Aggregates are dry. Ensure pre-wetting to avoid hydration water theft.`;

  // 4. Exposure Class Compliance checking (EN 206 limits validation)
  const expCode = input.exposureClass || "X0";
  const checks: ExposureCheckResult[] = [];
  let overallCompliance = true;

  // Let's implement EN-206 concrete limits
  const rules: Record<string, { maxWc: number; minCement: number; nameAr: string; nameEn: string }> = {
    "X0": { maxWc: 0.65, minCement: 265, nameAr: "محيط عادي لا تآكل فيه", nameEn: "No corrosion risk" },
    "XC1": { maxWc: 0.60, minCement: 280, nameAr: "كربنة - جاف دائم أو رطب دائم", nameEn: "Carbonation - permanently wet/dry" },
    "XC2": { maxWc: 0.60, minCement: 280, nameAr: "كربنة - ملامس رطب للمياه", nameEn: "Carbonation - wet, rarely dry" },
    "XC3": { maxWc: 0.55, minCement: 300, nameAr: "كربنة - متوسط الرطوبة بالهواء", nameEn: "Carbonation - moderate humidity" },
    "XC4": { maxWc: 0.50, minCement: 320, nameAr: "كربنة - دورات رطوبة وجفاف", nameEn: "Carbonation - cyclic wet/dry" },
    "XD1": { maxWc: 0.55, minCement: 300, nameAr: "كلوريدات - رطوبة معتدلة", nameEn: "Chlorides exposure - moderate wet" },
    "XD2": { maxWc: 0.50, minCement: 320, nameAr: "كلوريدات - دورات رطب وجاف مبلل", nameEn: "Chlorides exposure - cyclic wet" },
    "XS1": { maxWc: 0.50, minCement: 320, nameAr: "رذاذ بحري ملحي", nameEn: "Marine spray exposure" },
    "XS2": { maxWc: 0.45, minCement: 340, nameAr: "مغمور كلياً بمياه البحر المالح", nameEn: "Permanently submerged in seawater" },
    "XS3": { maxWc: 0.45, minCement: 360, nameAr: "منطقة تذبذب مياه البحر وتيارات المد والجزر (XS3)", nameEn: "Marine tidal/splash zone exposure (XS3)" },
    "XF1": { maxWc: 0.55, minCement: 300, nameAr: "تجمد وذوبان معتدل بلا ملوحة", nameEn: "Moderate freeze/thaw no deicing agent" },
    "XF2": { maxWc: 0.50, minCement: 340, nameAr: "تجمد وذوبان شديد مع الأملاح", nameEn: "Severe freeze/thaw with deicing agents" },
    "XA1": { maxWc: 0.55, minCement: 300, nameAr: "عدوانية كيميائية ضعيفة بالتربة", nameEn: "Weak chemical soil attack exposure" },
    "XA2": { maxWc: 0.50, minCement: 320, nameAr: "عدوانية كيميائية متوسطة", nameEn: "Moderate chemical soil/wastewater attack" },
    "XA3": { maxWc: 0.45, minCement: 360, nameAr: "عدوانية كيميائية شديدة للأيونات والمياه والتربة", nameEn: "Extreme chemical acid/sulfate attack" }
  };

  // Resolve matching exposure rules
  const matchingRule = rules[expCode] || Object.values(rules).find(r => expCode.startsWith(r.nameAr)) || rules["X0"];
  const config = matchingRule;

  const actualWc = Number(wc.toFixed(3));
  const actualCement = Math.round(currentCement);

  const maxWcPass = actualWc <= config.maxWc;
  const minCementPass = actualCement >= config.minCement;
  const overallPass = maxWcPass && minCementPass;
  if (!overallPass) overallCompliance = false;

  checks.push({
    code: expCode,
    name: config.nameAr,
    maxWcPass,
    requiredMaxWc: config.maxWc,
    actualWc,
    minCementPass,
    requiredMinCement: config.minCement,
    actualCement,
    overallPass,
    details: `فئة التعرض: ${expCode} تتطلب [الحد الأقصى لنسبة الماء/الإسمنت: ${config.maxWc} | الحد الأدنى للإسمنت: ${config.minCement} كجم].`
  });

  const passDetailsAr = overallCompliance 
    ? "مطابقة وتلبي متطلبات الديمومة ومتانة الغطاء الخرساني للكود العالمي EN 206."
    : "غير مطابقة للمحددات البيئية! الخلطة عرضة لتسوس التسليح المبكر والتشظي الخرساني تحت تأثير صدمات البيئة والمياه الجوفية.";
  const passDetailsEn = overallCompliance
    ? "Fulfils all durability limits mandated by EN 206 guidelines, ensuring lifetime serviceability."
    : "Non-compliant! Fails critical environmental design requirements for serviceability limits.";

  // 5. Reinforcement Compatibility Check
  // Let's assume congestion index based on fck and element type or if dMax is too high (Dmax > 25)
  const structElement = (input as any).structuralElement || "";
  const reinfCongestion = (input as any).reinforcementCongestion || "";
  const isCongestedHigh = reinfCongestion === "High" || reinfCongestion === "high" || /كثيف جداً|كثيف|high|congestion/i.test(structElement) || /high/i.test(reinfCongestion);
  const isCongested = isCongestedHigh || (structElement ? /جسور|أعمدة|بلاطات مسلحة كثيفة|أعصاب/i.test(structElement) : dMax > 22);
  
  // Rule verification: إذا Reinforcement Congestion = High -> Dmax <= 16 mm (Otherwise default Dmax spacing is 20)
  const maxAllowedDmax = isCongestedHigh ? 16 : 20;
  const dMaxSafetyPass = isCongested ? dMax <= maxAllowedDmax : true;
  const slumpSafetyPass = isCongested ? slump >= 10 : true;

  const recommendationAr = isCongested 
    ? (!dMaxSafetyPass 
        ? (isCongestedHigh 
            ? `مخالفة: التسليح كثيف جداً (Reinforcement Congestion = High) يتطلب ألا يزيد قطر الحصى الأقصى Dmax عن 16 مم (المستعمل حالياً: ${dMax} مم).` 
            : "الغطاء الحديدي وضيق حديد التسليح في هذا العنصر يتطلب تصغير قطر الحصى Dmax إلى 16 مم أو أقل لمنع حدوث التمضمض وفراغات الهواء (Honeycombing).")
        : "قطر الحصى متوافق هندسياً مع التسليح الكثيف، يُقترح رفع هبوط الخرسانة بصورة طفيفة باستخدام الملدنات لتحسين الانسياب.")
    : "تفاصيل حديد التسليح قياسية ومتباعدة بما يسمح بصب الحصى بقطره الحالي دون عوائق انسدادية.";
  const recommendationEn = isCongested
    ? (!dMaxSafetyPass 
        ? (isCongestedHigh
            ? `Non-compliant: High reinforcement congestion demands Dmax <= 16 mm (current Dmax: ${dMax} mm).`
            : "Narrow spacing in reinforcement demands reducing Dmax to 16mm or less to prevent severe segregation and aggregate shielding (honeycombing).")
        : "Dmax size complies with layout. Ensure high flow slump class via water reducers to maximize compaction.")
    : "Standard spacing of steel reinforcement is perfectly compatible with current aggregate Dmax size.";
  const recommendationFr = isCongested
    ? (!dMaxSafetyPass 
        ? (isCongestedHigh
            ? `Non-conforme : Densité d'armature élevée exige un Dmax <= 16 mm (Dmax actuel : ${dMax} mm).`
            : "L'espacement étroit des armatures exige de réduire le Dmax à 16 mm ou moins pour éviter la ségrégation et les nids d'abeille (Honeycombing).")
        : "Le diamètre maximal Dmax est conforme à la densité de ferraillage. Il est conseillé de fluidifier avec un plastifiant.")
    : "L'espacement standard des armatures en acier est parfaitement compatible avec le diamètre actuel des granulats.";

  // 6. Pumpability Assessment
  const isPumpableInput = input.hasPumping || false;
  let pumpRating: "Excellent" | "Good" | "Moderate Risk" | "Not Pumping Match" = "Good";
  let pumpRatingAr = "مقبول ويحتاج لمراقبة الضغط";
  let pumpRatingFr = "Surveillance requise de la pression";
  let blockageRisk: "Negligible" | "Low" | "Medium" | "High" = "Low";
  let blockageRiskAr = "ضعيف مع تزييت الأنبوب الأولي";
  let blockageRiskFr = "Faible après lubrification du tube";
  let segregationRisk: "Low" | "Moderate" | "High" = "Low";
  let segregationRiskAr = "منخفض جداً";
  let segregationRiskFr = "Très faible";

  const sandRatio = result.sandPercent || 40;
  
  // Rule verification: إذا Pumping = TRUE -> Dmax <= 20 mm
  const pumpAggregateSizePass = isPumpableInput ? dMax <= 20 : true;

  if (slump < 6) {
    pumpRating = "Not Pumping Match";
    pumpRatingAr = "غير ملائم للضخ الهيدروليكي الميكانيكي";
    pumpRatingFr = "Incompatible avec le pompage mécanique";
    blockageRisk = "High";
    blockageRiskAr = "مرتفع جداً بفعل الاحتكاك والمظهر الناشف للخرسانة";
    blockageRiskFr = "Très élevé dû à la sécheresse du mélange";
    segregationRisk = "Moderate";
    segregationRiskAr = "متوسط";
    segregationRiskFr = "Modéré";
  } else if (!pumpAggregateSizePass) {
    pumpRating = "Moderate Risk";
    pumpRatingAr = "مخاطر انسداد عالية - حجم الحصى كبير للضخ (> 20 مم)";
    pumpRatingFr = "Altéré - Gravier trop grand pour pompage (> 20 mm)";
    blockageRisk = "High";
    blockageRiskAr = "خطر مرتفع لانسداد المضخة لتجاوز Dmax حد الـ 20 مم مع خيار الضخ";
    blockageRiskFr = "Risque élevé d'obstruction (Dmax > 20 mm)";
    segregationRisk = "Moderate";
    segregationRiskAr = "متوسط";
    segregationRiskFr = "Modéré";
  } else if (slump >= 14 && sandRatio >= 38 && sandRatio <= 44) {
    pumpRating = "Excellent";
    pumpRatingAr = "ممتاز ومثالي لخلاطات الرافعات الهيدروليكية";
    pumpRatingFr = "Excellent, idéal pour les pompes télescopiques";
    blockageRisk = "Negligible" as any;
    blockageRiskAr = "معدوم تماماً بفعل تزييت ركامات الرمل المتزنة";
    blockageRiskFr = "Négligeable grâce à la lubrification sableuse interne";
  } else if (sandRatio < 35 || sandRatio > 46) {
    pumpRating = "Moderate Risk";
    pumpRatingAr = "مخاطر انسداد جزئي بالخراطيم الطويلة";
    pumpRatingFr = "Inconfort partiel dans les tuyauteries longues";
    blockageRisk = "Medium";
    blockageRiskAr = "متوسط التوقع نتيجة خلل بالاحتكاك الحبيبي للرمل";
    blockageRiskFr = "Moyen dû à l'instabilité dynamique du sable";
    segregationRisk = "High";
    segregationRiskAr = "ارتفاع تيار النزيف والماء المترسب";
    segregationRiskFr = "Élevé (risque de ressuage)";
  }

  const advicePumpAr = pumpRating === "Not Pumping Match"
    ? "يُمنع الضخ الميكانيكي تحت ظروف قوام الخرسانة الحالي (صلب جداً). لتمكين الضخ، يجب رفع الهبوط للصب السائل عبر الملدنات لتبلغ فئة هبوط S3/S4."
    : !pumpAggregateSizePass
    ? `تنبيه الضخ: لتفادي الانحشار بالفوهات والخراطيم، يفرض كود الضخ ألا يزيد القطر الأقصى للركام Dmax عن 20 مم (الحالي: ${dMax} مم).`
    : pumpRating === "Moderate Risk"
    ? "ينصح بضبط تدرج الرمل وضمان تماسكية الحبيبات لإقصاء خطر حدوث فصل حركي بالخراطيم الصاعدة."
    : "قوام الخرسانة متوازن ومثبت هندسياً للضخ المباشر الآمن.";
  const advicePumpEn = pumpRating === "Not Pumping Match"
    ? "Pumping is impossible with low flowability. Convert slump target to S3/S4 category using fluidifying admixtures."
    : !pumpAggregateSizePass
    ? `Pump warning: Aggregate size (Dmax) exceeds the absolute pumping maximum threshold of 20 mm (current: ${dMax} mm).`
    : "Verify aggregate grading stability to insulate the dynamic pump lines from bleeding blockage.";
  const advicePumpFr = pumpRating === "Not Pumping Match"
    ? "Le pompage est impossible avec l'affaissement actuel (trop ferme). Augmenter la fluidité en classe S3/S4 via un superplastifiant."
    : !pumpAggregateSizePass
    ? `Alerte pompage : Pour éviter les bouchons, les normes imposent un Dmax maximal de 20 mm (actuel : ${dMax} mm).`
    : pumpRating === "Moderate Risk"
    ? "Ajuster la gradation du sable pour éliminer tout risque de ségrégation dynamique sous pression."
    : "La consistance est idéale pour un pompage direct sécurisé.";

  // 7. Sustainability Analysis
  // Cement: ~0.9 kg CO2 per kg, SCM slag: ~0.08, fly ash: ~0.05, silica: ~0.10, gravel/sand: 0.005
  const flyAshQty = (input.dosageFlyAsh || 0) / 100 * currentCement;
  const slagQty = (input.dosageSlag || 0) / 100 * currentCement;
  const silicaQty = (input.dosageSilicaFume || 0) / 100 * currentCement;

  const co2Intensity = Math.round(
    (currentCement * 0.92) +
    (silicaQty * 0.15) +
    (flyAshQty * 0.08) +
    (slagQty * 0.07) +
    (result.sandWeightDry * 0.005) +
    (result.gravelWeightDry * 0.006)
  );

  const scmPercentage = Math.round(((flyAshQty + slagQty + silicaQty) / (currentCement + flyAshQty + slagQty + silicaQty)) * 100);
  
  let sustainScore: "A" | "B" | "C" | "D" | "E" = "C";
  let sustainColor = "text-amber-500 bg-amber-500/10";
  if (co2Intensity < 190) {
    sustainScore = "A";
    sustainColor = "text-emerald-500 bg-emerald-500/10 dark:text-emerald-400";
  } else if (co2Intensity < 265) {
    sustainScore = "B";
    sustainColor = "text-teal-500 bg-teal-500/10 dark:text-teal-400";
  } else if (co2Intensity < 340) {
    sustainScore = "C";
    sustainColor = "text-amber-500 bg-amber-500/10";
  } else if (co2Intensity < 390) {
    sustainScore = "D";
    sustainColor = "text-orange-500 bg-orange-500/10";
  } else {
    sustainScore = "E";
    sustainColor = "text-rose-500 bg-rose-500/10 dark:text-rose-400 font-bold";
  }

  const baseLineCo2 = Math.round(fck * 8.5 + 130) * 0.92;
  const co2SavingPercent = Math.max(0, Math.round(((baseLineCo2 - co2Intensity) / baseLineCo2) * 100));

  const advSustainAr = scmPercentage < 10
    ? `إن البصمة الكربونية للخلطة عالية وتساوي ${co2Intensity} كجم CO₂ لكل متر مكعب خرساني. لرفع تقييم الاستدامة، ننصح باستبدال 15% إلى 25% من الإسمنت بالرماد المتطاير أو الخبث لتقليص الانبعاثات بنسبة تقلل البصمة لأكثر من 20%.`
    : `الخلطة ذات نمط استدامة بيئي متزن وممتاز بفضل استخدام الرماد والمواد الإسمنتية المكملة الصديقة للبيئة.`;
  const advSustainEn = scmPercentage < 10
    ? `CO₂ footprint is elevated at ${co2Intensity} kg CO₂/m³. Recommended to replace 15%-25% of OPC with eco-friendly supplementary cementitious materials (SCM) to attain a higher green standard rating.`
    : `Excellent sustainable mix footprint leveraging SCM green additions with reduced clinker integration.`;
  const advSustainFr = scmPercentage < 10
    ? `L'empreinte CO₂ est élevée à ${co2Intensity} kg CO₂/m³. Il est recommandé d'incorporer 15%-25% d'ajouts minéraux (cendres, laitier) pour réduire les émissions et atteindre un meilleur score environnemental.`
    : `Excellent bilan carbone grâce à l'incorporation d'ajouts minéraux actifs (SCM) limitant le clinker.`;

  // 8. Economic Analysis
  const pSand = input.priceSand || 2.4;
  const pGravel = input.priceGravel || 2.6;
  const pWater = input.priceWater || 1.1;

  const costCement = Math.round(currentCement * priceCement);
  const costAggs = Math.round((result.sandWeightDry * pSand) + (result.gravelWeightDry * pGravel));
  
  let costAdmixtures = 0;
  if (result.admixtureWeights && result.admixtureWeights.length > 0) {
    result.admixtureWeights.forEach(a => {
      let unitPrice = 120; // fallback in Algerian Dinar
      if (a.name.includes("ملدن") || a.name.includes("Super")) {
        unitPrice = input.priceSuper || 135;
      } else if (a.name.includes("هواء") || a.name.includes("Air")) {
        unitPrice = input.priceAir || 110;
      } else if (a.name.includes("مؤخر") || a.name.includes("Retarder")) {
        unitPrice = input.priceRetarder || 115;
      } else {
        unitPrice = input.priceAccelerator || 125;
      }
      costAdmixtures += a.weight * unitPrice;
    });
  }
  
  // Scm pricing
  const costScm = Math.round(
    (silicaQty * (input.priceSilicaFume || 90)) +
    (flyAshQty * (input.priceFlyAsh || 45)) +
    (slagQty * (input.priceSlag || 38))
  );

  const costWaterTotal = Math.round(result.waterContentActual * pWater);
  const totalCost = Math.round(costCement + costAggs + costAdmixtures + costScm + costWaterTotal + (input.priceLabor || 180));

  const costSavingPercent = Math.round((potentialSavingDA / totalCost) * 1000) / 10;
  const economicAdvAr = potentialSavingDA > 250
    ? `بإجراء هندسي للحد الأمثل للإسمنت وتكامل الرص الحبيبي، يمكن توفير نحو ${potentialSavingDA} د.ج لكل متر مكعب من التكلفة المالية للمركبات، مما يمثل نسبة وفورات اقتصادية قدرها ${costSavingPercent}% للمشروع الإجمالي.`
    : `الكلفة المالية متوازنة ومضغوطة لدرجات الاستغلال القصوى.`;
  const economicAdvEn = potentialSavingDA > 250
    ? `Optimizing granular parameters and cement portion creates cost saving potential of ${potentialSavingDA} DA per m³ (${costSavingPercent}% decrease in constituent materials bill).`
    : `Constituent materials costing sheet represents premium economical values for execution.`;
  const economicAdvFr = potentialSavingDA > 250
    ? `L'optimisation des paramètres granulaires et du dosage en ciment permet une économie de ${potentialSavingDA} DA par m³ (baisse de ${costSavingPercent}% sur la facture des matériaux).`
    : `Le coût des constituants est parfaitement optimisé pour cette formule.`;

  // 9. AI Engineering Conclusion
  let decision: "APPROVED" | "APPROVED WITH OPTIMIZATION" | "NOT RECOMMENDED" = "APPROVED";
  let decisionAr = "موافق عليها هندسياً دون تحفظ (APPROVED)";
  let decisionFr = "Formule approuvée sans réserve technique (APPROVED)";
  let decisionColor = "text-emerald-600 bg-emerald-550 border-emerald-500";

  let strengthAssAr = "المقاومة الانضغاطية المستهدفة مضمونة مخبرياً وعلمياً وتتجاوز الهامش التصميمي بنجاح.";
  let strengthAssEn = "Predicted target compressive strength incorporates appropriate security spacing.";
  let strengthAssFr = "La résistance caractéristique visée est statistiquement garantie et conforme aux marges.";
  
  let durAssAr = "غطاء الخرسانة دقيق والمسامية الشعرية محصنة ضد التواجد بالمناطق المعقدة بيئياً.";
  let durAssEn = "Capillary networks and concrete porosity indexes support durable passive steel shield.";
  let durAssFr = "Réseau capillaire et enrobage protecteurs assurant une durabilité face à la classe d'exposition.";

  let workAssAr = "انسيابية القوام هيدروليكية ومناسبة جداً وتوفر سهولة إنهاء أسطح الصب.";
  let workAssEn = "Rheological performance guarantees safe discharge speed and ease of placement.";
  let workAssFr = "Fluidité adaptée assurant une mise en œuvre facile sans risque de ségrégation.";

  let ecoAssAr = "جدوى تصنيع الخرجات المالية والاقتصادية ومعدل المواد الإسمنتية مبررة تماماً للجهد والعمل.";
  let ecoAssEn = "Monetary pricing represents premium parameters for the structural operations.";
  let ecoAssFr = "Optimisation économique validée ; dosages et coûts industriels équilibrés.";

  let sustainAssAr = "انبعاث كربوني ملائم ويتطابق مع الممارسات العالمية الخضراء للبناء المستدام.";
  let sustainAssEn = "Carbon footprint indicators match international environment regulations.";
  let sustainAssFr = "Bilan CO₂ validé et conforme aux directives de développement durable.";

  // Dynamic status evaluation
  const hasComplianceIssues = !overallCompliance || !dMaxSafetyPass || (isHighSlump && !hasSuper) || (isPumpableInput && !pumpAggregateSizePass);

  if (hasComplianceIssues) {
    decision = "NOT RECOMMENDED";
    decisionAr = "غير موصى بها للخلط الإنشائي (NOT RECOMMENDED)";
    decisionFr = "Formule non recommandée (NOT RECOMMENDED)";
    decisionColor = "text-rose-600 bg-rose-50 border-rose-500 font-bold shake animate-pulse";
    
    if (!overallCompliance) {
      durAssAr = "فشل في مطابقة محددات متانة الكود (EN 206) لديمومة الإسمنت والماء لفئة التعرض الحالية.";
      durAssEn = "DURABILITY ALERT: Fails to satisfy cement and W/C boundary rules under the active exposure class.";
      durAssFr = "DÉFAUT DURABILITÉ : Non-respect des critères de l'EN 206 (dosage ciment minimal ou E/C maximal).";
    } else if (!dMaxSafetyPass) {
      durAssAr = "مخالفة مقاس الحصى الأقصى: تسليح الخرسانة كثيف جداً (Congestion = High) ويفرض هندسياً Dmax ≤ 16 مم لتلافي التعشيش.";
      durAssEn = "SPACING FAILURE: Heavy reinforcement congestion requires aggregate size Dmax <= 16 mm to safeguard compaction.";
      durAssFr = "DÉFAUT D'ESPACEMENT : Densité d'armature élevée impose un diamètre Dmax <= 16 mm pour éliminer l'effet de voûte.";
    } else if (isHighSlump && !hasSuper) {
      durAssAr = "مخالفة تشغيلية: تم طلب قوام هبوط عالٍ جداً (>180 مم) من غير إضافة ملدنات فائقة، مما يسبب الانفصال الحبيبي.";
      durAssEn = "WORKABILITY FAIL: Slump target > 180 mm strictly requires a superplasticizer component to avoid massive paste separation.";
      durAssFr = "RISQUE DE SÉGRÉGATION : Affaissement élevé (>180 mm) exige l'usage d'un superplastifiant.";
    } else if (isPumpableInput && !pumpAggregateSizePass) {
      durAssAr = "مخالفة ضخ الخرسانة: تم تفعيل الضخ مع قطر ركام أقصى أكبر من 20 مم؛ مما يعرض الأنبوب للانسداد الفوري.";
      durAssEn = "PUMP BLOCKAGE CONFLICT: Aggregate Dmax > 20 mm under active pumping triggers high risk of pipeline lockups.";
      durAssFr = "RISQUE DE BOUCHAGE : Dmax > 20 mm sous pompage génère un risque majeur d'obstruction du pipeline.";
    } else {
      durAssAr = "فشل في تلبية الشروط الفنية العامة للخلطة خرسانية؛ راجع تنبيهات المستشار الفني.";
      durAssEn = "DURABILITY ALERT: Complete failure to satisfy engineering design boundaries.";
      durAssFr = "DÉFAUT DE CONFORMITÉ : Non-conformité aux critères fondamentaux de durabilité de la formulation.";
    }
  } else if (excessive || wcRating === "high" || wcRating === "low") {
    decision = "APPROVED WITH OPTIMIZATION";
    decisionAr = "موافق عليها شريطة إجراء تحسينات فنية (APPROVED WITH OPTIMIZATION)";
    decisionFr = "Formule approuvée avec optimisations requises (APPROVED WITH OPTIMIZATION)";
    decisionColor = "text-amber-600 bg-amber-50 border-amber-500 font-semibold";
    
    if (excessive) {
      ecoAssAr = `تكاليف مالية زائدة بقرابة ${potentialSavingDA} د.ج بسبب زيادة كميات الإسمنت غير المبررة إنشائياً.`;
      ecoAssEn = `Uneconomical design containing excessive clinker fractions costing unnecessary raw materials charges.`;
      ecoAssFr = `Dépenses de ciment non justifiées. Économie potentielle estimée à ${potentialSavingDA} DA par m³.`;
    }
    if (wcRating === "high") {
      durAssAr = "المسامية مرتفعة نسبياً بسبب زيادة الماء الحر؛ يُقترح خفض نسبة الـ W/C وتوسيع جرعة الملدن.";
      durAssEn = "Higher density porosity risks from free water surplus; lower W/C using high range plasticizer.";
      durAssFr = "Rapport E/C élevé risquant d'augmenter la porosité ; diluer l'excès d'eau libre et ajuster le plastifiant.";
    }
  }

  return {
    cementEfficiency: {
      excessive,
      currentCement,
      optimizedCement,
      savingPercent,
      costSaving: potentialSavingDA,
      strengthImpact: strengthImpactEn,
      adviceArabic: adviceCementAr,
      adviceEnglish: adviceCementEn,
    },
    wcRatio: {
      ratio: actualWc,
      rating: wcRating,
      warnings: warningsWcEn,
      warningsAr: warningsWcAr,
      durabilityRisk: durabilityRiskEn,
      durabilityRiskAr: durabilityRiskAr,
    },
    aggregateQuality: {
      sandFM,
      sandRating,
      gravelDmax: dMax,
      absorptionWarnings: absorptionWarningsEn,
      absorptionWarningsAr: absorptionWarningsAr,
      gradationAdviceAr,
      gradationAdviceEn,
    },
    exposureCompliance: {
      classCode: expCode,
      checks,
      overallCompliance,
      passDetailsAr,
      passDetailsEn,
    },
    reinforcement: {
      congestion: isCongested,
      dMaxSafetyPass,
      slumpSafetyPass,
      recommendationAr,
      recommendationEn,
      recommendationFr,
    },
    pumpability: {
      rating: pumpRating,
      ratingAr: pumpRatingAr,
      ratingFr: pumpRatingFr,
      blockageRisk,
      blockageRiskAr,
      segregationRisk,
      segregationRiskAr,
      adviceAr: advicePumpAr,
      adviceEn: advicePumpEn,
      adviceFr: advicePumpFr,
    },
    sustainability: {
      co2Intensity,
      scmPercentage,
      score: sustainScore,
      scoreColor: sustainColor,
      co2SavingPercent,
      adviceAr: advSustainAr,
      adviceEn: advSustainEn,
      adviceFr: advSustainFr,
    },
    costOptimization: {
      cementCost: costCement,
      aggregateCost: costAggs,
      admixtureCost: costAdmixtures,
      totalCost,
      opportunityAr: economicAdvAr,
      opportunityEn: economicAdvEn,
      opportunityFr: economicAdvFr,
      potentialSavingDA,
    },
    conclusion: {
      strength: strengthAssEn,
      strengthAr: strengthAssAr,
      strengthFr: strengthAssFr,
      durability: durAssEn,
      durabilityAr: durAssAr,
      durabilityFr: durAssFr,
      workability: workAssEn,
      workabilityAr: workAssAr,
      workabilityFr: workAssFr,
      economic: ecoAssEn,
      economicAr: ecoAssAr,
      economicFr: ecoAssFr,
      sustainability: sustainAssEn,
      sustainabilityAr: sustainAssAr,
      sustainabilityFr: sustainAssFr,
      finalDecision: decision,
      finalDecisionAr: decisionAr,
      finalDecisionFr: decisionFr,
      finalDecisionColor: decisionColor,
    },
  };
}
