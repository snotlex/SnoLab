import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Local engineering intelligence engine to handle API quota limits (429) or interruptions gracefully.
function generateLocalFallbackAnalysis(params: {
  fck28: number;
  fcm28: number;
  cementType: string;
  cementStrength: number;
  aggregateType: string;
  aggregateQuality: string;
  dMax: number;
  slump: number;
  waterContent: number;
  cementContent: number;
  sandWeight: number;
  gravelWeight: number;
  admixtures: any[];
  userMessage?: string;
}): string {
  const {
    fck28,
    fcm28,
    cementType,
    cementStrength,
    aggregateType,
    aggregateQuality,
    dMax,
    slump,
    waterContent,
    cementContent,
    sandWeight,
    gravelWeight,
    admixtures,
    userMessage
  } = params;

  const wcRatio = waterContent / (cementContent || 1);

  if (userMessage) {
    const query = userMessage.trim().toLowerCase();

    if (query.includes("كيف أزيد") || query.includes("قوة الخرسانة") || query.includes("زيادة القوة") || query.includes("زيادة قوة")) {
      return `⚠️ **تنبيه:** تم تفعيل كبسولة الإجابة الهندسية المحلية مؤقتاً لتخطي حدود API العامة.

لزيادة مقاومة الخرسانة (Compressive Strength) دون رفع عيار الإسمنت (Avoiding Cement Overuse)، يُنصح بالحلول والتقنيات الهندسية الفعالة التالية:

1. **تقليص نسبة الماء إلى الإسمنت (Lowering W/C Ratio):**
   الماء الزائد عن حاجة الإماهة الكيميائية يتبخر تاركاً مساماً مجهرية تضعف الهيكل الخرساني. كلما خفضت نسبة W/C (مثلاً من 0.50 إلى 0.42)، زادت قوة الخرسانة بشكل كبير.
   
2. **استخدام الملدنات الفائقة (HRWRA / Superplasticizers):**
   أهم أداة هندسية! تتيح لك تخفيض مياه الخلط بنسبة تصل إلى 20-30% مع المحافظة التامة على قابلية تشغيل وانسيابية الخرسانة (Slump)، مما يرفع المتانة والضغط دون تكلفتك إسمنتاً إضافياً.

3. **تحسين تدرج الركام للحصول على أقصى تراص (Optimizing Particle Packing):**
   تنسيق أحجام الرمل والحصى بحيث تملأ الحبيبات الأصغر الفراغات البينية بين الحبيبات الأكبر بدقة (وفق منحنى درو-غوريس). هذا يقلل حجم الفراغات الكلية التي يحتاج معجون الإسمنت لملئها، وبالتالي يرفع مستوى القوة الميكانيكية.

4. **إضافة مواد بوزولانية ناعمة جداً (Mineral Admixtures):**
   مثل غبار السيليكا (Silica Fume) أو الرماد المتطاير (Fly Ash). هذه المواد تتفاعل ثانوياً مع هيدروكسيد الكالسيوم الحر (الناتج غير المفيد من تفاعل الماء والإسمنت) لتشكيل سيليكات الكالسيوم المميّهة (C-S-H) التي تعطي الخرسانة صلابة إضافية خارقة وتملأ أدق المسامات.

5. **استخدام ركام مكسر صلب وزاوي (Crushed Aggregate):**
   استخدام الركام المكسر (Concassé) بدلاً من الحصى الأملس المستدير يزيد من التماسك والتشابك الميكانيكي (Mechanical Bond) بين حبيبات الركام ومعجون الإسمنت.`;
    }

    if (query.includes("الملدنات") || query.includes("w/c") || query.includes("نسبة الماء") || query.includes("الماء إلى الإسمنت")) {
      return `⚠️ **تنبيه:** تم تفعيل كبسولة الإجابة الهندسية المحلية مؤقتاً لتخطي حدود API العامة.

تأثير دمج الملدنات الفائقة (Superplasticizers/High Range Water Reducers) على نسبة الماء إلى الإسمنت (W/C Ratio) يعتبر ثورة في تكنولوجيا الخرسانة الحديثة، ويتلخص أثره هندسياً وميدانياً فيما يلي:

1. **تشتيت حبيبات الإسمنت (Cement Deflocculation):**
   عند إضافة الماء للإسمنت، تميل حبيبات الإسمنت للالتصاق والتكتل مشكلة فجوات تحتبس بداخلها مياه خلط غير مستفاد منها. تقوم جزيئات الملدن الفائق بالالتصاق بأسطح حبيبات الإسمنت وتعطيها شحنات كهربائية سالبة متشابهة، مما يؤدي إلى تنافرها وتشتيتها بالكامل وتحرير المياه المحتبسة لتليين الخلطة بشكل هائل.

2. **تحقيق نفس الانسيابية بماء أقل بنسبة 15% إلى 30%:**
   بفضل التشتيت الكفء، يمكنك تقليل كمية مياه الخلط الإجمالية بشكل كبير مع الإبقاء على نفس تماسك وقابلية تشغيل الخرسانة (Slump) المطلوب للصب والضخ.

3. **الفوائد الميكانيكية لتخفيض نسبة W/C:**
   عندما تثبت كمية الإسمنت وتخفض كمية الماء، تنخفض نسبة W/C تلقائياً. الملدنات الفائقة تمكنك من النزول بهذه النسبة إلى قيم منخفضة جداً (0.35 - 0.40)، مما يترجم مباشرة إلى:
   - ارتفاع هائل في متانة الخرسانة ومقاومة الضغط المبكرة والنهائية.
   - انخفاض نفاذية الخرسانة ومقاومتها لدخول الأملاح والكلوريدات المؤدية لصدأ حديد التسليح.
   - تقليل الانكماش الجاف والتشققات السطحية بالصبات الكبيرة.`;
    }

    if (query.includes("رطوبة الرمل") || query.includes("الرمل العالية") || query.includes("رطوبة") || query.includes("مياه الصب") || query.includes("الرمل")) {
      return `⚠️ **تنبيه:** تم تفعيل كبسولة الإجابة الهندسية المحلية مؤقتاً لتخطي حدود API العامة.

تعتبر رطوبة الرمل الموقعية (Sand Moisture / Humidité du sable) من أكثر المتغيرات حرجاً بمحطات التعبئة والمواقع، وعواقب إهمال رطوبة الرمل العالية تؤثر مباشرة على جودة الخرسانة كالتالي:

1. **الإخلال بنسب مياه الخلط الفعلية (Water-to-Cement Ratio Overrun):**
   الرمل يحمل كميات من المياه الحرة على أسطح حبيباته. إذا كانت رطوبة الرمل مثلاً 5%، فهذا يعني أن كل 800 كجم من الرمل تحتوي على 40 لتر من الماء الحر. إذا أضيف هذا الماء الحر دون تعديل كمية الماء المخططة بالخلاطة، سترتفع نسبة W/C الفعلية بشكل غير مراقب، مما يؤدي فوراً إلى تدني مقاومة الضغط بالخرسانة المتصلدة.

2. **زيادة سيولة وقوام الخرسانة المفرط (Segregation & Bleeding):**
   المياه الزائدة المضافة عبر رطوبة الرمل ستتسبب في زيادة الهبوط (Slump) بصورة غير مدروسة، مما يؤدي لضعف تماسك الخرسانة الرطبة وانفصال الركام الخشن عن العجينة الإسمنتية (Segregation) وظهور ظاهرة نزف الخرسانة وصعود الماء إلى السطح (Bleeding).

3. **أخطاء في موازين الوزن الجاف للرمل:**
   عند تعبئة ميزان الرمل بالورشة بوزن رطب، فإن جزءاً من الوزن المسجل يكون ماءً وليس رملاً حقيقياً. هذا يعني أن حجم حبيبات الرمل الجافة الفعلي في المتر المكعب سيكون أقل مما يفترض بالدراسة النظرية لطريقة درو، مما يسبب تراجعاً في النسبة الحجمية للرمل واختلال تماسك تدرج الركام.

**الإجراء الهندسي الوقائي الواجب اتباعه:**
- إجراء فحص سريع لرطوبة الرمل يومياً (بجهاز التجفيف أو الحرق الكحولي الموقعي).
- تطبيق **تصحيح الرطوبة (Moisture Correction)**:
  - رفع وزن الرمل المطلوب وزن بالخلاطة لتعويض وزن الماء المضاف.
  - خفض مياه الإضافة الصافية بالخلاطة بنفس مقدار وزن الماء الحر المتواجد بالرمل والحصى للوصول لنسبة W/C التصميمية بدقة تامة.`;
    }

    if (query.includes("طقس حار") || query.includes("درجة حرارة") || query.includes("38") || query.includes("35") || query.includes("الحار") || query.includes("الصيف")) {
      return `⚠️ **تنبيه:** تم تفعيل كبسولة الإجابة الهندسية المحلية مؤقتاً لتخطي حدود API العامة.

الصب في الطقس الحار (درجات حرارة تفوق 35°م إلى 38°م) يمثل تحدياً هندسياً كبيراً للخرسانة الرطبة، والتقييم الهندسي والوقائي لتركيبتك الحالية يتضمن النقاط الحيوية التالية:

1. **مخاطر الطقس الحار على الخرسانة الرطبة:**
   - **التبخر السريع للمياه:** يتسبب الجو الساخن والرياح في تبخر مياه الخلط بسرعة قبل إتمام تفاعل الإماهة مع الإسمنت، مما ينعكس بانخفاض قابلية التشغيل (Slump Loss) وتصلد مبكر فجائي يعوق صب وتسوية الخرسانة بالقولب.
   - **شقوق الانكماش البلاستيكي:** مع التبخر السريع للماء السطحي، ينكمش السطح بسرعة مشكلاً تشققات شعرية واسعة تشوه المظهر الخارجي وتضعف حماية حديد التسليح.
   - **تراجع المقاومة لآجل طويل:** بالرغم من تسارع تصلب الخرسانة بالحرارة وكسبها متانة مبكرة، إلا أنها تفقد جزءاً هاماً من مقاومتها النهائية عند عمر 28 يوماً بسبب عدم تكوين بنية متبلورة منتظمة للإماهة.

2. **التدابير الهندسية الهامة الواجب تفعيلها بالموقع لجعل الخلطة آمنة تماماً:**
   - **استخدام إضافات مؤخرة للشك (Set Retarders / Admixtures):** من الضروري دمج إضافات تؤخر بداية شك الإسمنت لضمان استهلاك أبطأ وأكثر سلاسة للماء وتسهيل العمل والدمك بفترات زمنية كافية.
   - **تبريد المكونات ورش الركام:** ينصح بطلاء وتظليل مخازن الركام ورشها بالمياه لتخفيض درجة حرارتها الكامنة، واستخدام مياه تبريد بالخلاطة (أو إضافة الثلج المجروش عوضاً عن جزء من مياه الصب لخفض حرارة المزيج لأقل من 32°م).
   - **الصب بالمساء أو الصباح الباكر:** تجنب الصب المطلق في ساعات الظهيرة الحارة واستغلال درجات الحرارة المنخفضة ليلاً.
   - **تغطية قوالب الصب وتفعيل المعالجة الفورية المباشرة (Curing):** تغطية الأسطح الخرسانية فور صبها بالنايلون أو الخيش والبدء بالرش المستمر بالمياه فور تصلب السطح ولمدة لا تقل عن 7 أيام للحفاظ التام على مياه التفاعل الكيميائي الداخلي.`;
    }

    return `⚠️ **ملاحظة:** تم تفعيل كبسولة الاتصال المحلية نظراً للضغط المؤقت على خوادم الذكاء الاصطناعي العامة.

لقد تلقيت استفسارك الموقر: "${userMessage}".
بصفتي خبيراً في هندسة المواد والخرسانة بطريقة درو-غوريس، إليك رؤية هندسية سريعة ومفيدة:

في تصميم الخلطات الخرسانية، احرص دائماً على مواءمة ما يلي:
1. **أهمية الهيكل الحبيبي للركام:** تداخل حبيبات الرمل الخشن (Sand) والحصى (Gravel) بنسب مدروسة يقلل الفراغات لدرجة دنيا ويوفر معجون إسمنت كافٍ للتغليف والتصلب الحركي.
2. **علاقة المقاومة بنسبة مياه الخلط:** إن متانة الخرسانة ومقاومتها للضغط fck والعديد من المؤشرات ترتبط عكسياً بكميات المياه الحرة الإضافية. حاول المحافظة على نسبة W/C قريبة من 0.45-0.50 مستخدماً الملدنات الفعالة لضمان حركة وضخ آمنين بالموقع.
3. **فحص الجودة الدائم:** قياس مقدار هبوط القمع (Slump Test) وفحص رطوبة الرمل يشكلان الركيزة الذهبية لحماية متانة الخلطة قبل صبها بالمضخة.

إذا كان لديك أي سؤال محدد حول نسب مكونات خلطتك الراهنة أو كيفية تعديل جرعات الملدنات، فلا تتردد في طرحه!`;
  }

  const isWcGood = wcRatio <= 0.55 && wcRatio >= 0.40;
  const isSlumpHigh = slump >= 8;
  const aggTypeText = aggregateType === 'roule' ? 'ركام الوديان المدور (Roulé)' : 'الركام الكلسي المكسر (Concassé)';

  return `⚠️ **تنبيه من النظام:** تم تفعيل وحدة التحليل الهندسي المحلي مؤقتاً لتخطي حدود API المجانية.

### 📊 التقرير الفني والمراجعة الشاملة للخلطة (حسب معيار Dreux-Gorisse)

أهلاً بك في التقرير التحليلي لطلب تركيبتك الخرسانية الحالية. بناءً على الحسابات الرياضية المعتمدة لطريقة درو-غوريس (Dreux-Gorisse) والمواصفات التي أدخلتها، إليك التقييم الهندسي الشامل والمكتمل:

#### 1. متطلبات المقاومة والمتانة (fck & fcm)
- **المقاومة المميزة المستهدفة (fck):** **${fck28} MPa** عند عمر 28 يوماً.
- **المقاومة المتوسطة المطلوبة بالورشة (fcm):** **${fcm28} MPa** (شاملاً معامل الضمان والرقابة بالموقع).
- **توافق الرتبة:** الإسمنت المستعمل من فئة **${cementStrength} MPa** (${cementType}) يعتبر متوافقاً تماماً ومناسباً لتركيب خرسانة إنشائية ممتازة تلبي المقاومة المميزة ${fck28} MPa بأمان تام.

#### 2. تحليل نسبة الماء إلى الإسمنت (W/C Ratio)
- **نسبة (W/C) الفعلية:** **${wcRatio.toFixed(2)}**.
- **التقييم التقني:** 
  ${wcRatio < 0.45 ? 
    "نسبة الماء منخفضة وجيدة جداً لضمان متانة عالية وتقليل النفاذية. يوصى باستخدام ملدنات فائقة لضمان سهولة الصب والتراص دون حدوث تعشيش ميكانيكي." :
    isWcGood ?
    "نسبة الماء مثالية ومتوازنة للغاية. تحقق هذه النسبة تناسباً ممتازاً بين متطلبات الإماهة الكيميائية للإسمنت وقابلية التشغيل وضمان عدم تبخر المياه الزائدة مسببة فجوات شعرية." :
    "نسبة الماء مرتفعة نسبياً (> 0.55). هذا قد يزيد من نفاذية الخرسانة المتصلدة ويقلل من مقاومتها النهائية وعمرها الخدمي. يُنتصح بشدة بتقليل كمية مياه الإضافة والتعويض بملدنات فائقة (Superplasticizers)."
  }

#### 3. القوام وقابلية التشغيل (Slump & Placement)
- **مقدار الهبوط المخروطي (Slump):** **${slump} سم**.
- **تصنيف القوام:** **S${slump <= 2 ? "1 (جاف)" : slump <= 5 ? "2 (شبه لدن)" : slump <= 9 ? "3 (لدن عياري)" : slump <= 15 ? "4 (سائل جزئياً)" : "5 (سائل جداً)"}**.
- **سهولة الصب والضخ:** 
  ${isSlumpHigh ? 
    "الخلطة تتمتع بقوام ممتاز يسهل الصب في الأعضاء الضيقة والمكتظة بحديد التسليح، وهو ملائم جداً لعمليات الضخ وحركة المعدات بالموقع دون خطر الانفصال الحبيبي." : 
    "الخلطة قوامها جاف إلى لدن عياري. يوصى بالدمك الجيد وبشكل مكثف باستخدام الهزازات الميكانيكية لضمان ملء الفراغات ومنع التعشيش في الزوايا الإنشائية."
  }

#### 4. تدرج حبيبات الركام وجزيئات الهيكل الجاف
- **أقصى قطر للركام (D_max):** **${dMax} ملم**.
- **شكل حبيبات الركام والمنشأ:** **${aggTypeText}**.
  - *تأثير الركام على معيار درو:* ${aggregateType === 'roule' ? "الركام المدور يسهل الحركة والتشغيل ويقلل من الحاجة للماء بنسبة ضئيلة، لكن تماسك جزيئاته الميكانيكي أقل مقارنة بالمكسر." : "الركام المكسر يوفر تماسكاً ميكانيكياً رائعاً (Mechanical Interlocking) يساهم في صلابة خرسانة الانحناء والضغط، ولكنه يتطلب زيادة طفيفة في كمية معجون الإسمنت والمياه لتعويض خشونة زواياه."}

#### 5. دور الإضافات والملدنات الكيميائية المعتمدة
- **الملاحظات الميدانية:** 
  ${admixtures && admixtures.length > 0 ? 
    admixtures.map((adm: any) => `⚠️ تم دمج **${adm.name}** بجرعة **${adm.dosage}%** كنسبة وزنية من وزن الإسمنت. هذا الإجراء الفعال يحسن بشكل ملحوظ قابلية التشغيل ويقلل نسبة W/C لتأكيد المتانة ومقاومة الكربنة والكلوريدات.`).join("\n") : 
    "لم يتم دمج أي إضافات ملدنة أو مخفضة للماء في هذه الخلطة اليدوية. من الموصى به هندسياً إدخال ملدن متطور بنسبة (0.8% - 1.5%) لتحسين الانسيابية وزيادة الكفاءة الإنشائية بموقع الصب والمحافظة على إسمنت أمثل."
  }

#### 6. توصيات هندسية هامة للموقع:
1. **الرطوبة التصحيحية للرمل:** يجب فحص مستمر لرطوبة الرمل الموقعية وتخفيض مياه الخلط بالخلاطة بمقدار المياه الحرة الموجودة بالرمل لتفادي زيادة سيولة الخرسانة وضعفها.
2. **المعالجة بالرش (Curing):** للحصول على المقاومة التصميمية المرجوة (${fck28} MPa)، يجب تغطية السطح بالخيش الرطب أو رش المياه بانتظام لمدة لا تقل عن 7 أيام متتالية لمنع التبخر السريع وحدوث شقوق الجفاف الانكماشية.`;
}

// API: Health / Status Check (Production Safety Inspection Checkpoint)
// Robust helper to perform Gemini generateContent calls with fallback models and retries
async function generateContentWithRetry(
  ai: any,
  params: {
    model: string;
    contents: any;
    config?: any;
  }
) {
  const primaryModel = params.model;
  // Determine suitable fallback models
  const fallbackModels: string[] = [];
  
  if (primaryModel.includes("image")) {
    if (primaryModel !== "gemini-3.1-flash-lite-image") {
      fallbackModels.push("gemini-3.1-flash-lite-image");
    }
    if (primaryModel !== "gemini-3.1-flash-image") {
      fallbackModels.push("gemini-3.1-flash-image");
    }
  } else {
    // Text models
    if (primaryModel !== "gemini-3.1-flash-lite") {
      fallbackModels.push("gemini-3.1-flash-lite");
    }
    if (primaryModel !== "gemini-3.5-flash" && !fallbackModels.includes("gemini-3.5-flash")) {
      fallbackModels.push("gemini-3.5-flash");
    }
    if (primaryModel !== "gemini-3.1-pro-preview" && !fallbackModels.includes("gemini-3.1-pro-preview")) {
      fallbackModels.push("gemini-3.1-pro-preview");
    }
    if (primaryModel !== "gemini-flash-latest" && !fallbackModels.includes("gemini-flash-latest")) {
      fallbackModels.push("gemini-flash-latest");
    }
  }

  const allModels = [primaryModel, ...fallbackModels];
  let lastError: any = null;

  for (const modelName of allModels) {
    // Retry up to 3 times per model for transient errors (e.g. 503 high demand or 429 rate limit)
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Create a copy of the config so we can modify it safely for fallbacks
        const activeConfig = params.config ? JSON.parse(JSON.stringify(params.config)) : {};
        
        // Safety: Strip thinkingConfig if the model is not known to support reasoning levels
        if (modelName !== "gemini-3.1-pro-preview" && modelName !== "gemini-3.5-flash" && activeConfig.thinkingConfig) {
          delete activeConfig.thinkingConfig;
        }

        console.log(`[Gemini API] Attempting generateContent with model: ${modelName} (Attempt ${attempt}/${maxAttempts})`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: params.contents,
          config: activeConfig
        });
        return response;
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini API] Attempt ${attempt}/${maxAttempts} failed for model ${modelName}:`, err?.message || err);
        
        if (attempt < maxAttempts) {
          // Backoff delay before retrying the same model (e.g. 400ms, then 800ms)
          const delay = attempt * 400;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    // Wait slightly before moving to the next model (e.g. 300ms)
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  throw lastError;
}

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "SNO Engineering AI",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// API: AI Concrete Advisor (مستشار الخرسانة الذكي)
// Lazy-initialized Gemini call to prevent startup crashes if GEMINI_API_KEY is missing.
app.post("/api/concrete-advisor", async (req, res) => {
  try {
    const { 
      fck28, 
      fcm28, 
      cementType, 
      cementStrength,
      aggregateType, 
      aggregateQuality,
      dMax, 
      slump, 
      waterContent, 
      cementContent,
      sandWeight,
      gravelWeight,
      admixtures,
      chatHistory,
      userMessage,
      attachments,
      selectedMethod,
      methodCategory,
      implementationStatus,
      isStandaloneCompleteMethod
    } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ 
        error: "GEMINI_API_KEY_MISSING",
        message: "Gemini API key is missing. Please configure it in the Secrets panel in AI Studio.\n(مفتاح الذكاء الاصطناعي غير متوفر في البيئة حالياً. يرجى تهيئته للتمتع بالدعم الاستشاري الذكي)."
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const systemInstruction = 
      "أنت خبير هندسة مواد وإنشاءات رائد ومتخصص في تصميم الخلطات الخرسانية بطريقة درو-غوريس (Dreux-Gorisse) والمواصفات المعتمدة (مثل معايير EN 206 والكود الجزائري).\n" +
      "تقدم تحليلاً تقنياً وهندسياً مفصلاً ودقيقاً للغاية باللغة العربية.\n" +
      "افحص كلاً من المدخلات المحسوبة للخلطة الحالية والمستندات أو الصور المرفقة إن وجدت:\n" +
      "- المقاومة المستهدفة والمقاومة المميزة fck/fcm عند عمر 28 يوماً.\n" +
      "- نسبة الماء إلى الإسمنت (W/C) والمقادير والموازين الذاتية لكل متر مكعب.\n" +
      "- نوع الإضافات الكيماوية والملدنات وجرعتها الفعالة.\n" +
      "- الصور المرفقة: قم بتحليلها هندسياً بدقة متناهية (مثل صور شروخ جدران أو ركائز، عيوب تعشيش الخرسانة، قوام الهبوط Slump Test في الميدان، تشظي الغطاء الخرساني وصدأ حديد التسليح، إلخ) وقدم التوصيات والحلول والتشخيص التقني الفوري لسبب العيب وطريقة معالجته وتطبيقه.\n" +
      "- المستندات المرفقة (مثل ملفات PDF لتقارير كسر مكعبات المختبر، مواصفات المشاريع التقنية، جداول كميات): افحص الأرقام المكتوبة، قارنها بالقيم التصميمية، ووضح مدى مطابقتها للمواصفات وصلاحية الهيكل للاستخدام الفني.\n" +
      "CRITICAL RULE ON DESIGN METHODOLOGIES:\n" +
      "- Do not present secondary or retired methods. Focus purely on Dreux-Gorisse standard parameters.\n" +
      "- ركز كلياً على معايير وقيم طريقة درو-غوريس لنسب الخلطات ولا تشتت المخرجات بذكر أو إدراج طرق موازية أخرى.\n" +
      "أجب بأسلوب خبير هندسي رصين يدعم الجودة في الموقع وقارن القيم مع الكودات ومقاييس البناء المتطورة.";

    const concreteRecipeDetails = `
=== تفاصيل خلطة الخرسانة (طريقة التصميم الحالية: ${selectedMethod || "Dreux-Gorisse"}) ===
المقاومة المميزة المطلوبة (fck at 28 days): ${fck28} MPa
المقاومة المتوسطة المستهدفة (fcm at 28 days): ${fcm28} MPa
الإسمنت المستخدم: نوع ${cementType} (مقاومة فئة ${cementStrength} MPa)
كمية الإسمنت المحسوبة: ${cementContent} kg/m³
كمية الماء المحسوبة: ${waterContent} L/m³
نسبة الماء إلى الإسمنت (W/C Ratio): ${(waterContent / (cementContent || 1)).toFixed(2)}
نوع الركام: ${aggregateType === 'roule' ? 'ركام مدور (حصى وديان/مستدير)' : 'ركام مكسر (صخور مستخرجة من الكسارة/زاوي)'}
جودة الركام: ${aggregateQuality}
القطر الأقصى لحبيبات الركام (D_max): ${dMax} mm
قوام الخرسانة المستهدف (Slump): ${slump} cm
كمية الرمل الجاف المحسوبة: ${sandWeight} kg/m³
كمية الحصى الجاف المحسوبة: ${gravelWeight} kg/m³
تصنيف المنهجية الحالي (Method Category): ${methodCategory || "complete-design"}
حالة التنفيذ الحالية (Implementation Status): ${implementationStatus || "complete"}
هل هي منهجية مستقلة كاملة؟ (Is Standalone): ${isStandaloneCompleteMethod !== false ? "Yes" : "No (Supporting/Partial)"}
الإضافات الكيميائية المستخدمة: 
${admixtures && admixtures.length > 0 ? admixtures.map((adm: any) => `- ${adm.name}: جرعة ${adm.dosage}% من وزن الإسمنت (نوع الأثر: ${adm.effect})`).join("\n") : "لا توجد إضافات مستخدمة"}
===================================================`;

    // Construct contents in @google/genai format
    const contents: any[] = [];

    // System instruction can be supplied in config.
    // We append the concrete mix context as the first part of the conversation, then history, then user's active query.
    let fullPrompt = `إليك تفاصيل الخلطة الخرسانية الحالية:\n${concreteRecipeDetails}\n\n`;
    if (userMessage) {
      fullPrompt += `الرسالة الحالية أو سؤال المستخدم: ${userMessage}`;
    } else {
      fullPrompt += `قم بتحليل هذه الخلطة وإعطاء نصائح تحسينية وشرح لطريقة تصميمها (مستخدماً منهجية درو غويريس)، ووضح دور الإضافات المستخدمة أو اقترح إضافات إذا كان هناك حاجة لتحسين القوام أو القوة دون زيادة الإسمنت.`;
    }

    if (attachments && attachments.length > 0) {
      fullPrompt += `\n\n[ملاحظة: لقد قام المستخدم بإرفاق مستند أو صورة مع هذه الرسالة للتحليل والمناقشة المباشرة. تفضل بدراسة البيانات المجمعة في المرفقات بدقة عالية]`;
    }

    // Prepare previous messages from history to maintain conversation state
    const messages: any[] = [];
    if (chatHistory && chatHistory.length > 0) {
      chatHistory.forEach((msg: any) => {
        // If message has previous attachments, we can keep them in the history if we wish, or just texts
        messages.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });
    }

    // Build the current multi-part user message
    const currentMessageParts: any[] = [{ text: fullPrompt }];

    // If attachments exist, append them to parts
    if (attachments && attachments.length > 0) {
      attachments.forEach((att: any) => {
        let base64Data = att.data;
        if (base64Data.includes(";base64,")) {
          base64Data = base64Data.split(";base64,")[1];
        }
        currentMessageParts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: base64Data
          }
        });
      });
    }

    // Add current prompt
    messages.push({
      role: 'user',
      parts: currentMessageParts
    });

    const response = await generateContentWithRetry(ai, {
      model: process.env.GEMINI_TEXT_MODEL || "gemini-3.1-pro-preview",
      contents: messages,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH
        }
      }
    });

    res.json({
      success: true,
      text: response.text
    });

  } catch (error: any) {
    // Gracefully handle Gemini quota limit (429) or other API blocks by using local expert fallback quietly.
    console.log("Local engineering advisory generator activated for request.");
    
    try {
      const fallbackText = generateLocalFallbackAnalysis({
        fck28: typeof req.body.fck28 === 'number' ? req.body.fck28 : 25,
        fcm28: typeof req.body.fcm28 === 'number' ? req.body.fcm28 : 29,
        cementType: req.body.cementType || "CEM I 42.5",
        cementStrength: typeof req.body.cementStrength === 'number' ? req.body.cementStrength : 42.5,
        aggregateType: req.body.aggregateType || "concasse",
        aggregateQuality: req.body.aggregateQuality || "normal",
        dMax: typeof req.body.dMax === 'number' ? req.body.dMax : 20,
        slump: typeof req.body.slump === 'number' ? req.body.slump : 7,
        waterContent: typeof req.body.waterContent === 'number' ? req.body.waterContent : 185,
        cementContent: typeof req.body.cementContent === 'number' ? req.body.cementContent : 350,
        sandWeight: typeof req.body.sandWeight === 'number' ? req.body.sandWeight : 750,
        gravelWeight: typeof req.body.gravelWeight === 'number' ? req.body.gravelWeight : 1100,
        admixtures: Array.isArray(req.body.admixtures) ? req.body.admixtures : [],
        userMessage: req.body.userMessage
      });

      res.json({
        success: true,
        text: fallbackText
      });
    } catch (fallbackError: any) {
      console.log("Local advisor fallback was unable to build text response.");
      res.status(500).json({ 
        success: false, 
        error: "حدث خطأ غير متوقع أثناء معالجة استشارة الذكاء الاصطناعي البديلة."
      });
    }
  }
});

function getConcreteTextureDescription(slump: number, aggregateType: string, waterContent: number, cementContent: number): string {
  const wc = waterContent / (cementContent || 1);
  const aggregateName = aggregateType === 'roule' ? "الحصى المستدير الأملس" : "الركام الكلسي المكسر ذو الزوايا";
  
  if (slump <= 2) {
    return `بنية خشنة جافة جداً (Dry / Non-plastic) تمثل الخرسانة المضغوطة ذات الهبوط القريب من الصفر. يظهر الخليط على شكل كتل صخرية داكنة متماسكة بشدة مغلفة بطبقة غبار إسمنتي مطفأ ومظهر شبه جاف خالٍ تماماً من أي لمعة مائية. الفراغات البينية بين حبات ${aggregateName} مرئية وتحتاج لرص ميكانيكي قوي وهز مكثف لملء الفراغات.`;
  }
  if (slump <= 5) {
    return `مظهر لدن متماسك خشن (Semi-dry) هبوطه خفيف للغاية. تظهر حبيبات الركام بوضوح ولكنها متداخلة بإحكام مع تغلغل المعجون الإسمنتي في الفجوات بدون فائض. اللمعان السطحي طفيف جداً، والخلطة تحتفظ بكيان ميكانيكي صلب، وهي مثالية للطرق والأرصفة ولا تتعرض للانفصال الحبيبي إطلاقاً.`;
  }
  if (slump <= 9) {
    return `قوام لدن مثالي متجانس (Optimal Plastic Mix) ذو لمعان كريمي متناسق. يظهر المعجون الإسمنتي الرمادي الغني مغلفاً بالكامل لجميع حبيبات الركام الجافة من ${aggregateName}. الخليط متوازن ميكانيكياً ولا يفرز مياه حرة، مع لزوجة ديناميكية تجعله مثالياً للمنشآت الإنشائية والأعمدة الاعتيادية، ويحقق صلابة رائعة وسهولة ممتازة في التسوية والتشغيل.`;
  }
  if (slump <= 15) {
    return `قوام انسيابي رطب عالي التشغيل (Fluid / Flowing Mix) ملائم للضخ بمضخات الموقع. السطح ذو بريق مائي واضح نتيجة ارتفاع نسبة الماء للإسمنت (${wc.toFixed(2)})، مع سيولة تجعل المعجون الإسمنتي يميل للانزلاق وتعبئة زوايا قالب الاختبار بسهولة. تظهر فقاعات هواء مجهرية وتتحرك الحصبيات بحرية نسبية مع تماسك لدن كافٍ إذا تم ضبط الملدنات وبودرة الحشو.`;
  }
  return `قوام سائل فائق التدفق (Self-Consociating Flow). الخليط ينهار تماماً مستوياً بشكل بركة رطبة لامعة ذات انعكاسات قوية للضوء. المعجون الإسمنتي الرمادي يحيط بالركام بكثافة مائعة مع هالة معزولة عند الأطراف نتيجة نزف المياه الطفيف. يتطلب هذا القوام ضبطاً فائقاً للمضافات الملدنة لضمان عدم ترسب الحصبيات الخشنة في القاع (Segregation).`;
}

function generateProceduralConcreteSVG(
  slump: number,
  aggregateType: string,
  waterContent: number,
  cementContent: number,
  airContent: number
): string {
  const wc = waterContent / (cementContent || 1);
  const isConcasse = aggregateType === "concasse";
  
  let pasteGradientStart = "#4B5563";
  let pasteGradientEnd = "#1F2937";
  let glossyOpacity = 0.05;
  
  if (slump <= 2) {
    pasteGradientStart = "#6B7280";
    pasteGradientEnd = "#374151";
    glossyOpacity = 0.02;
  } else if (slump <= 5) {
    pasteGradientStart = "#555E6D";
    pasteGradientEnd = "#2D3440";
    glossyOpacity = 0.08;
  } else if (slump <= 9) {
    pasteGradientStart = "#4B5563";
    pasteGradientEnd = "#1F2937";
    glossyOpacity = 0.16;
  } else if (slump <= 15) {
    pasteGradientStart = "#3B4452";
    pasteGradientEnd = "#151B26";
    glossyOpacity = 0.28;
  } else {
    pasteGradientStart = "#2F3745";
    pasteGradientEnd = "#0F131A";
    glossyOpacity = 0.45;
  }

  let stonesMarkup = "";
  let seed = 123;
  function random() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  const stoneCount = slump <= 5 ? 28 : slump <= 9 ? 22 : 16;
  
  for (let i = 0; i < stoneCount; i++) {
    const angle = random() * Math.PI * 2;
    const r = random() * 160;
    const cx = 250 + Math.cos(angle) * r;
    const cy = 250 + Math.sin(angle) * r;
    
    const stoneSize = 18 + random() * 32;
    
    const colors = ["#94A3B8", "#64748B", "#475569", "#78716C", "#A8A29E"];
    const baseColor = colors[Math.floor(random() * colors.length)];
    
    if (isConcasse) {
      const points: string[] = [];
      const vertices = 4 + Math.floor(random() * 3);
      for (let v = 0; v < vertices; v++) {
        const vAngle = (v / vertices) * Math.PI * 2 + (random() - 0.5) * 0.4;
        const vR = stoneSize * (0.6 + random() * 0.5);
        const px = cx + Math.cos(vAngle) * vR;
        const py = cy + Math.sin(vAngle) * vR;
        points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
      }
      
      stonesMarkup += `<polygon points="${points.join(" ")}" fill="${baseColor}" stroke="#1E293B" stroke-width="1.5" />`;
      const highlightPoints = points.slice(0, 3).map(p => {
        const [xStr, yStr] = p.split(",");
        const x = parseFloat(xStr);
        const y = parseFloat(yStr);
        return `${(cx + (x - cx) * 0.7).toFixed(1)},${(cy + (y - cy) * 0.7).toFixed(1)}`;
      });
      stonesMarkup += `<polygon points="${highlightPoints.join(" ")}" fill="#FFFFFF" opacity="0.12" />`;
    } else {
      const rx = stoneSize * (0.8 + random() * 0.4);
      const ry = stoneSize * (0.5 + random() * 0.3);
      const rotate = random() * 360;
      stonesMarkup += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" transform="rotate(${rotate.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})" fill="${baseColor}" stroke="#1E293B" stroke-width="1.5" />`;
      stonesMarkup += `<ellipse cx="${(cx - rx * 0.25).toFixed(1)}" cy="${(cy - ry * 0.25).toFixed(1)}" rx="${(rx * 0.4).toFixed(1)}" ry="${(ry * 0.3).toFixed(1)}" transform="rotate(${rotate.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})" fill="#FFFFFF" opacity="0.15" />`;
    }
  }

  let sandMarkup = "";
  for (let i = 0; i < 50; i++) {
    const angle = random() * Math.PI * 2;
    const r = random() * 180;
    const px = 250 + Math.cos(angle) * r;
    const py = 250 + Math.sin(angle) * r;
    const colors = ["#D97706", "#B45309", "#CA8A04", "#78716C"];
    const col = colors[Math.floor(random() * colors.length)];
    sandMarkup += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(1 + random() * 2.5).toFixed(1)}" fill="${col}" opacity="0.6" />`;
  }

  let bubblesMarkup = "";
  const actualBubbles = Math.round(airContent * 4) + 5;
  for (let i = 0; i < actualBubbles; i++) {
    const angle = random() * Math.PI * 2;
    const r = random() * 170;
    const px = 250 + Math.cos(angle) * r;
    const py = 250 + Math.sin(angle) * r;
    bubblesMarkup += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(2 + random() * 3).toFixed(1)}" fill="none" stroke="#FFFFFF" stroke-width="1.2" opacity="0.45" />`;
  }

  let waterBleedingMarkup = "";
  if (slump >= 15) {
    waterBleedingMarkup = `
      <circle cx="250" cy="250" r="194" fill="none" stroke="#60A5FA" stroke-width="4" opacity="0.3" />
      <circle cx="250" cy="250" r="192" fill="none" stroke="#FFFFFF" stroke-width="1" opacity="0.2" />
    `;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%" style="background-color: #0B1120; font-family: monospace;">
      <defs>
        <radialGradient id="paste-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${pasteGradientStart}" />
          <stop offset="100%" stop-color="${pasteGradientEnd}" />
        </radialGradient>
        <linearGradient id="gloss-sweep" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.0" />
          <stop offset="40%" stop-color="#FFFFFF" stop-opacity="${glossyOpacity}" />
          <stop offset="50%" stop-color="#FFFFFF" stop-opacity="${glossyOpacity * 1.5}" />
          <stop offset="60%" stop-color="#FFFFFF" stop-opacity="${glossyOpacity}" />
          <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.0" />
        </linearGradient>
        <clipPath id="circle-clip">
          <circle cx="250" cy="250" r="190" />
        </clipPath>
      </defs>

      <rect x="0" y="0" width="500" height="500" fill="#0F172A" rx="20" stroke="#334155" stroke-width="2" />
      <circle cx="250" cy="250" r="198" fill="none" stroke="#1E293B" stroke-width="8" opacity="0.7" />
      <circle cx="250" cy="250" r="192" fill="none" stroke="#475569" stroke-width="2" opacity="0.9" />

      <g clip-path="url(#circle-clip)">
        <rect x="50" y="50" width="400" height="400" fill="url(#paste-grad)" />
        ${sandMarkup}
        ${stonesMarkup}
        ${waterBleedingMarkup}
        ${bubblesMarkup}
        <rect x="50" y="50" width="400" height="400" fill="url(#gloss-sweep)" pointer-events="none" />
      </g>

      <rect x="50" y="22" width="400" height="24" fill="#1E293B" rx="4" />
      <text x="250" y="37" fill="#60A5FA" font-size="10" font-weight="950" letter-spacing="1.5" text-anchor="middle">CONCRETE.AI RHEOLOGY SPECTRUM</text>

      <g transform="translate(62, 452)">
        <rect x="0" y="0" width="376" height="34" fill="#0B1120" rx="4" stroke="#1E293B" stroke-width="1" />
        <text x="12" y="21" fill="#94A3B8" font-size="9" font-weight="700">SLUMP: <tspan fill="#60A5FA" font-weight="900">${Math.round(slump)} cm</tspan></text>
        <text x="120" y="21" fill="#94A3B8" font-size="9" font-weight="700">W/C: <tspan fill="#60A5FA" font-weight="900">${wc.toFixed(2)}</tspan></text>
        <text x="210" y="21" fill="#94A3B8" font-size="9" font-weight="700">TYPE: <tspan fill="#60A5FA" font-weight="900">${isConcasse ? "ANGULAR" : "ROUNDED"}</tspan></text>
        <text x="312" y="21" fill="#94A3B8" font-size="9" font-weight="700">AIR: <tspan fill="#38BDF8" font-weight="900">${airContent}%</tspan></text>
      </g>
    </svg>
  `;
}

// API: Image Generator / Visualizer
app.post("/api/concrete-visualize", async (req, res) => {
  try {
    const { 
      slump = 7, 
      waterContent = 185, 
      cementContent = 350, 
      aggregateType = "concasse",
      airContent = 2,
    } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    const aggregateDesc = aggregateType === 'roule' ? 'rounded alluvial gravel and river sand' : 'crushed angular limestone gravel and sharp quarry sand';
    
    let textureType = "cohesive and plastic";
    if (slump <= 2) {
      textureType = "extremely stiff, dry-paste, rocky and crumbly with no water sheen";
    } else if (slump <= 5) {
      textureType = "semi-dry, firm, compact rocky texture with low paste shine";
    } else if (slump >= 15) {
      textureType = "highly fluid, wet flowing liquid texture, glossy shiny cement slurry with water bleeding";
    }
    
    const prompt = `Extreme macro close-up photography of fresh wet concrete mix showing the raw matrix texture. Slump is ${slump} cm, containing ${cementContent} kg/m³ of cement and ${waterContent} L/m³ of water, with ${aggregateDesc}. The mix density is ${textureType}, showing grey cement paste coating aggregate stones. Scientific material specimen shot with elegant dramatic side lighting, high contrast, black-blue background, photo masterpiece, ultra-realistic, no labels, no text.`;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const response = await generateContentWithRetry(ai, {
          model: process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: prompt }]
          },
          config: {
            imageConfig: {
              aspectRatio: "1:1"
            }
          }
        });

        let base64Image = null;
        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData?.data) {
              base64Image = part.inlineData.data;
              break;
            }
          }
        }

        if (base64Image) {
          return res.json({
            success: true,
            isFallback: false,
            imageUrl: `data:image/png;base64,${base64Image}`,
            prompt: prompt,
            description: getConcreteTextureDescription(slump, aggregateType, waterContent, cementContent)
          });
        }
      } catch (err: any) {
        // Silently log fallback without exposing raw API quota/resource errors to console
        console.log("Image generation using local physical representation (No direct API access required).");
        
        const svgCode = generateProceduralConcreteSVG(slump, aggregateType, waterContent, cementContent, airContent);
        const base64Svg = Buffer.from(svgCode).toString('base64');

        return res.json({
          success: true,
          isFallback: true,
          isQuotaExceeded: true,
          imageUrl: `data:image/svg+xml;base64,${base64Svg}`,
          prompt: prompt,
          description: getConcreteTextureDescription(slump, aggregateType, waterContent, cementContent)
        });
      }
    }

    // High quality vector fallback when no API key is available
    const svgCode = generateProceduralConcreteSVG(slump, aggregateType, waterContent, cementContent, airContent);
    const base64Svg = Buffer.from(svgCode).toString('base64');

    return res.json({
      success: true,
      isFallback: true,
      isQuotaExceeded: false,
      imageUrl: `data:image/svg+xml;base64,${base64Svg}`,
      prompt: prompt,
      description: getConcreteTextureDescription(slump, aggregateType, waterContent, cementContent)
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Unknown error"
    });
  }
});

// Procedural high-contrast SVG texture generator representing Algerian material card profiles
function generateProceduralMaterialSVG(type: string, englishName: string, density: number): string {
  let seed = Math.abs(density) || 12345;
  function random() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  let elementsMarkup = "";

  if (type === "sand") {
    // Sand procedural generator
    let grainColor1 = "#EAB308"; // yellow / sand
    let grainColor2 = "#CA8A04"; // dark golden
    let grainColor3 = "#FACC15"; // bright yellow sand
    let grainSizeMin = 0.8;
    let grainSizeMax = 1.8;
    let particleCount = 450;

    if (englishName.toLowerCase().includes("fine")) {
      grainColor1 = "#F5F5F4"; // pure fine white silica
      grainColor2 = "#E7E5E4"; 
      grainColor3 = "#D6D3D1";
      grainSizeMin = 0.5;
      grainSizeMax = 1.1;
      particleCount = 700;
    } else if (englishName.toLowerCase().includes("coarse")) {
      grainColor1 = "#D97706"; // golden bronze
      grainColor2 = "#92400E";
      grainColor3 = "#F59E0B";
      grainSizeMin = 1.4;
      grainSizeMax = 2.6;
      particleCount = 350;
    } else if (englishName.toLowerCase().includes("crushed")) {
      grainColor1 = "#94A3B8"; // crushed limestone grey dust
      grainColor2 = "#64748B";
      grainColor3 = "#CBD5E1";
      grainSizeMin = 1.0;
      grainSizeMax = 2.0;
      particleCount = 500;
    }

    // Generate sand grains
    for (let i = 0; i < particleCount; i++) {
      const cx = 20 + random() * 460;
      const cy = 20 + random() * 340;
      const r = grainSizeMin + random() * (grainSizeMax - grainSizeMin);
      const cols = [grainColor1, grainColor2, grainColor3];
      const color = cols[Math.floor(random() * cols.length)];
      
      if (random() > 0.45) {
        elementsMarkup += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}" opacity="${(0.72 + random() * 0.28).toFixed(2)}" />`;
      } else {
        const size = r * 1.4;
        const p1 = `${cx.toFixed(1)},${(cy - size).toFixed(1)}`;
        const p2 = `${(cx - size).toFixed(1)},${(cy + size * 0.7).toFixed(1)}`;
        const p3 = `${(cx + size).toFixed(1)},${(cy + size * 0.7).toFixed(1)}`;
        elementsMarkup += `<polygon points="${p1} ${p2} ${p3}" fill="${color}" opacity="${(0.65 + random() * 0.35).toFixed(2)}" />`;
      }
    }
  } else {
    // Gravel/Aggregate procedural generator
    let stoneMinSize = 12;
    let stoneMaxSize = 24;
    let stoneCount = 18;
    let isAngular = true;
    let colors = ["#94A3B8", "#64748B", "#475569", "#78716C", "#A8A29E"];

    if (englishName.includes("3/8")) {
      stoneMinSize = 7;
      stoneMaxSize = 13;
      stoneCount = 48;
      colors = ["#475569", "#334155", "#64748B", "#1E293B", "#5C5854"];
    } else if (englishName.includes("8/15")) {
      stoneMinSize = 13;
      stoneMaxSize = 25;
      stoneCount = 30;
      colors = ["#A1A1AA", "#71717A", "#52525B", "#3F3F46", "#78716C"];
    } else if (englishName.includes("15/25")) {
      stoneMinSize = 25;
      stoneMaxSize = 42;
      stoneCount = 16;
      colors = ["#CBD5E1", "#94A3B8", "#64748B", "#475569", "#78716C"];
    } else if (englishName.includes("25/40")) {
      stoneMinSize = 42;
      stoneMaxSize = 70;
      stoneCount = 9;
      colors = ["#E2E8F0", "#94A3B8", "#475569", "#78716C", "#334155"];
    } else if (englishName.toLowerCase().includes("river")) {
      stoneMinSize = 16;
      stoneMaxSize = 35;
      stoneCount = 24;
      isAngular = false;
      colors = ["#C8B69E", "#9A8C73", "#7A7B7D", "#CD853F", "#A0522D", "#5C5854", "#D2B48C"];
    } else if (englishName.toLowerCase().includes("crushed")) {
      stoneMinSize = 20;
      stoneMaxSize = 36;
      stoneCount = 20;
      colors = ["#334155", "#1E293B", "#475569", "#0F172A", "#64748B"];
    }

    elementsMarkup += `<rect x="0" y="0" width="500" height="380" fill="#111827" opacity="0.15" />`;

    // Draw stone aggregates
    for (let i = 0; i < stoneCount; i++) {
      const cx = 40 + random() * 420;
      const cy = 40 + random() * 300;
      const size = stoneMinSize + random() * (stoneMaxSize - stoneMinSize);
      const baseColor = colors[Math.floor(random() * colors.length)];

      if (isAngular) {
        const points: string[] = [];
        const vertices = 4 + Math.floor(random() * 4);
        for (let v = 0; v < vertices; v++) {
          const vAngle = (v / vertices) * Math.PI * 2 + (random() - 0.5) * 0.35;
          const vR = size * (0.65 + random() * 0.45);
          const px = cx + Math.cos(vAngle) * vR;
          const py = cy + Math.sin(vAngle) * vR;
          points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
        }
        elementsMarkup += `<polygon points="${points.join(" ")}" fill="${baseColor}" stroke="#0F172A" stroke-width="1.8" />`;
        
        const highlightPoints = points.slice(0, 3).map(p => {
          const [xStr, yStr] = p.split(",");
          const x = parseFloat(xStr);
          const y = parseFloat(yStr);
          return `${(cx + (x - cx) * 0.72).toFixed(1)},${(cy + (y - cy) * 0.72).toFixed(1)}`;
        });
        elementsMarkup += `<polygon points="${highlightPoints.join(" ")}" fill="#FFFFFF" opacity="0.12" />`;
      } else {
        const rx = size * (0.85 + random() * 0.35);
        const ry = size * (0.55 + random() * 0.25);
        const rotate = random() * 360;
        elementsMarkup += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" transform="rotate(${rotate.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})" fill="${baseColor}" stroke="#0F172A" stroke-width="1.5" />`;
        elementsMarkup += `<ellipse cx="${(cx - rx * 0.22).toFixed(1)}" cy="${(cy - ry * 0.22).toFixed(1)}" rx="${(rx * 0.35).toFixed(1)}" ry="${(ry * 0.28).toFixed(1)}" transform="rotate(${rotate.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})" fill="#FFFFFF" opacity="0.18" />`;
      }
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 380" width="100%" height="100%" style="background-color: #0F172A;">
      <defs>
        <radialGradient id="grad-vign-mat" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stop-color="#000000" stop-opacity="0" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0.85" />
         radialGradient>
      </defs>
      
      <rect x="0" y="0" width="500" height="380" fill="#1E293B" />
      <g opacity="0.15">
        ${Array.from({ length: 10 }).map((_, idx) => `<line x1="${(idx + 1) * 50}" y1="0" x2="${(idx + 1) * 50}" y2="380" stroke="#94A3B8" stroke-width="1" />`).join("")}
        ${Array.from({ length: 8 }).map((_, idx) => `<line x1="0" y1="${(idx + 1) * 45}" x2="500" y2="${(idx + 1) * 45}" stroke="#94A3B8" stroke-width="1" />`).join("")}
      </g>
      
      ${elementsMarkup}
      
      <rect x="0" y="0" width="500" height="380" fill="url(#grad-vign-mat)" pointer-events="none" />
      <rect x="0" y="0" width="500" height="380" fill="none" stroke="#2563EB" stroke-width="4" opacity="0.3" rx="4" />
      
      <rect x="15" y="15" width="260" height="26" fill="#090D16" fill-opacity="0.8" rx="4" stroke="#334155" stroke-width="1" />
      <circle cx="28" cy="28" r="4" fill="#10B981" />
      <text x="40" y="31" fill="#94A3B8" font-size="8.5" font-family="monospace" font-weight="bold">${type.toUpperCase()} / PROFILE: ${englishName.toUpperCase()}</text>
    </svg>
  `;
}

// API: Material Texture Generator using AI (or high quality procedural fallbacks if quota is low)
app.post("/api/material-visualize", async (req, res) => {
  try {
    const { materialName, englishName, type, description, density } = req.body;
    
    // Construct a specific, context-aware prompt based on material details
    let ptPrompt = "";
    if (type === "sand") {
      ptPrompt = `Extreme macro close-up photography of raw construction material: ${englishName} (${materialName}). Pure dry grains of sand texture, showing fine mineral details, consistent grade, soft professional studio lighting, high resolution texture reference specimen, extremely detailed, photorealistic, no text, no labels.`;
      if (englishName.toLowerCase().includes("fine")) {
        ptPrompt += " Very fine uniform white-beige silica sand grains, extremely small, powder-like texture.";
      } else if (englishName.toLowerCase().includes("coarse")) {
        ptPrompt += " Coarse dry sand particles, mixed larger golden-bronze granulates, dry dust.";
      } else if (englishName.toLowerCase().includes("crushed")) {
        ptPrompt += " Crushed grey limestone rock dust sand, sharp tiny angular fragments.";
      } else {
        ptPrompt += " Balanced medium-grain river bed sand, warm gold-beige tones.";
      }
    } else {
      ptPrompt = `Extreme macro close-up photography of dry clean construction aggregate stone: ${englishName} (${materialName}). A high-quality pile of construction gravel stones, showing angular edges, stone grain details, professional material laboratory specimen reference, cinematic studio lighting, high resolution texture, photorealistic, no text, no labels.`;
      if (englishName.includes("5-10") || englishName.includes("3/8") || englishName.includes("5/10")) {
        ptPrompt += " Small pea gravel, fine uniform dark grey basalt pebbles of 5-10mm.";
      } else if (englishName.includes("8/15")) {
        ptPrompt += " Standard crushed limestone aggregate 8-15mm, light grey color, sharp angular crushed rock.";
      } else if (englishName.includes("15/25")) {
        ptPrompt += " Medium-large coarse aggregate stones 15-25mm, rough textured crushed limestone rocks.";
      } else if (englishName.includes("25/40")) {
        ptPrompt += " Very large massive aggregate gravel rocks 25-40mm, coarse rock faces, highly rugged textures.";
      } else if (englishName.toLowerCase().includes("river")) {
        ptPrompt += " Rounded water-worn natural river pebbles of beautiful mixed earthly colors, wet gleaming surface.";
      } else {
        ptPrompt += " Clean crushed basalt gravel aggregate, sharp dark charcoal angular rock faces.";
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        // Generate images using the nano banana series model (recommended for general/high quality image tasks)
        // Set aspect ratio to 4:3 or 1:1, here we prefer 4:3 for elegant landscape presentation matching cards
        const response = await generateContentWithRetry(ai, {
          model: process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: ptPrompt }]
          },
          config: {
            imageConfig: {
              aspectRatio: "4:3"
            }
          }
        });

        let base64Image = null;
        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData?.data) {
              base64Image = part.inlineData.data;
              break;
            }
          }
        }

        if (base64Image) {
          return res.json({
            success: true,
            isFallback: false,
            imageUrl: `data:image/png;base64,${base64Image}`,
            prompt: ptPrompt
          });
        }
      } catch (err: any) {
        console.log("Material helper: procedural fallback triggered silently to keep experience fast and stable.");
      }
    }

    // High quality procedural SVG fallbacks for every grade if API is overloaded or key missing!
    const svgCode = generateProceduralMaterialSVG(type, englishName, density);
    const base64Svg = Buffer.from(svgCode).toString('base64');

    return res.json({
      success: true,
      isFallback: true,
      imageUrl: `data:image/svg+xml;base64,${base64Svg}`,
      prompt: ptPrompt
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Unknown error"
    });
  }
});


// API: Language Audit Tool (Auto-Scan)
// Scans the codebase specifically for hardcoded, untranslated Arabic, French or English text in React/TSX files
import fs from "fs";

function scanDirectory(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!file.includes("node_modules") && !file.includes("dist") && !file.includes(".git")) {
        scanDirectory(filePath, fileList);
      }
    } else {
      if (file.endsWith(".tsx") || (file.endsWith(".ts") && !file.endsWith(".config.ts") && !file.endsWith("firebase.ts") && !file.endsWith("localization.tsx"))) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

// Helper for local material advisor fallback when Gemini is experiencing high demand (503/429)
function getLocalMaterialFallback(name: string, category: string, region: string) {
  const cat = (category || "").toUpperCase();
  const reg = region || "الجزائر";
  
  let description = `مادة ${name} عالية الجودة تم اختبارها في منطقة ${reg} وتطابق الممارسات الهندسية المعتمدة.`;
  let engineeringNotes = `توصية تقنية: يوصى بمراقبة تدرج الحبيبات والشوائب باستمرار لضمان تراص ميكانيكي مثالي للخرسانة المعتمدة.`;
  let recommendedUses = `تستخدم في الأعمال الإنشائية العامة، والقواعد المسلحة، والأعمدة والأسقف المصبوبة موقعياً.`;
  let concreteClasses = `ملائم لرتب الخرسانة القياسية C25/30 وC30/37 وC40/50.`;
  let warnings = `انتباه: قم بإجراء فحص رطوبة الرمل وتصحيح نسب مياه الخلط بالورشة لتفادي إضعاف مقاومة الضغط بالتبخر السريع.`;
  let density = 2600;
  let absorption = 1.2;
  let moisture = 0.5;
  let finenessModulus = null as number | null;
  let quality = `معتمد ومطابق للمواصفات الوطنية`;

  if (cat.includes("SAND") || cat.includes("رمل") || cat.includes("SABLE")) {
    description = `رمل من فئة ${name} ذو مصدر محلي بـ ${reg}، يتميز بتوزع حبيبي ممتاز ملائم لتعبئة فراغات الخرسانة.`;
    engineeringNotes = `تحليل كيميائي وميكانيكي: نسبة المواد الناعمة فائقة الدقة أقل من 3%، مما يعزز التماسك ومقاومة الانكماش الجاف. 98% سيليكا.`;
    recommendedUses = `أعمال الخرسانة الإنشائية عالية الجودة، وأعمدة وجسور المباني السكنية والتجارية، والملاط الإنشائي.`;
    concreteClasses = `C20/25, C25/30, C30/37`;
    warnings = `تنبيه: راقب نسبة الطين والمواد الناعمة بالرمل (Silt content) لتفادي زيادة كميات المياه المطلوبة بالخلطة ومخاطر التشقق السطحي.`;
    density = 2620;
    absorption = 1.5;
    moisture = 1.0;
    finenessModulus = 2.65;
    quality = `رمل مغسول وعياري مطابق`;
  } else if (cat.includes("GRAVEL") || cat.includes("حصى") || cat.includes("GRAVIER")) {
    description = `حصى مكسر صلب من منطقة ${reg} ذو زوايا حادة يحقق ارتباطاً ميكانيكياً مبهراً مع عجينة الإسمنت التفاعلية.`;
    engineeringNotes = `صلابة ميكانيكية فائقة: معامل لوس أنجلوس (Los Angeles) أقل من 20%، مما يدل على قدرته الفائقة على تحمل جهود الضغط والبري الموقعية.`;
    recommendedUses = `العناصر الخرسانية الحاملة للجهود، القواعد العميقة، وجسور بحور تسليح طويلة المدى.`;
    concreteClasses = `C25/30, C30/37, C40/50`;
    warnings = `تجنب استخدام الحصى الحاوي على مواد كبريتية أو شوائب غبارية غير مغسولة تؤخر التماسك.`;
    density = 2680;
    absorption = 0.8;
    moisture = 0.4;
    quality = `كلسي صلصال بصلابة ممتازة`;
  } else if (cat.includes("CEMENT") || cat.includes("إسمنت") || cat.includes("CIMENT")) {
    description = `إسمنت رمادي عالي الأداء من رتبة تماسك سريعة، مطحون بدقة متناهية لتحقيق فاعلية تماسك ممتازة بمشاريع الجزائر.`;
    engineeringNotes = `تحليل تفاعل المواد: حرارة إماهة متوسطة، يناسب صبات الأجواء الحارة عند الالتزام بالمعالجة المباشرة بالرش.`;
    recommendedUses = `المنشآت سريعة التجهيز، فك القوالب المعجل، والخرسانة المسلحة ذات المتطلبات الميكانيكية المبكرة العالية.`;
    concreteClasses = `C30/37, C40/50, C50/60`;
    warnings = `تنبيه الحماية: تجنب تخزينه بمواقع رطبة لتلافي حدوث كتل تصلد قبل الاستخدام بالخلاطة.`;
    density = 3100;
    absorption = 0;
    moisture = 0;
    quality = `إنشائي فائق CEM I 42.5R`;
  } else if (cat.includes("ADMIXTURE") || cat.includes("إضافة") || cat.includes("ADJUVANT")) {
    description = `إضافة ملدنة متطورة لتقليل نسب تعاطي ماء الفراغات بالخلطة ورفع كفاءة تسييل وقابلية ضخ الخرسانة.`;
    engineeringNotes = `توزيع كيميائي ومشتت شحنات: تعمل الإضافة على شحن حبيبات الإسمنت بالسالب لمنع تكتلها بالمسامات المجهرية.`;
    recommendedUses = `الخلطات فائقة الانسيابية ذات الهبوط الموقعي العالي مع المحافظة على نسبة W/C متدنية وآمنة.`;
    concreteClasses = `C30/37, C45/55, C60/75`;
    warnings = `يجب التقيد بالجرعات الموصى بها (بين 0.8% إلى 2.0% من وزن الإسمنت) لتفادي حدوث الانفصال الحبيبي أو تأخير غير مبرر للشك.`;
    density = 1050;
    absorption = 0;
    moisture = 0;
    quality = `ملدن فائق متطور (HRWRA)`;
  }

  return {
    description,
    engineeringNotes,
    recommendedUses,
    concreteClasses,
    warnings,
    density,
    absorption,
    moisture,
    finenessModulus,
    quality
  };
}

// API: Material Advisor Assistant utilizing server-side Gemini AI with schema validation
app.post("/api/material-advisor", async (req, res) => {
  const { name, category, region } = req.body;
  try {
    if (!name || !category) {
      return res.status(400).json({ success: false, error: "Missing name or category" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        success: false,
        isFallback: true,
        message: "No API key found. Using heuristic suggestions."
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `You are an expert Concrete Materials and Civil Engineer specializing in construction materials, aggregates, admixtures, and cements used in Algeria.
Analyze the following material candidate and suggest professional engineering values, description, and notes:
- Candidate Name: "${name}"
- Category: "${category}" (e.g. SAND, GRAVEL, CEMENT, ADMIXTURE, SCM, WATER, or other structural material)
- Geographic Region/Quarry: "${region || 'Algeria'}"

Generate details in Arabic language. If the category is sand, gravel, or cement, you can also suggest typical physical properties (like density, absorption, moisture, etc.).
Ensure values are extremely realistic for Algerian industry standards. Return a structured JSON response.`;

    const response = await generateContentWithRetry(ai, {
      model: process.env.GEMINI_FAST_MODEL || "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { 
              type: Type.STRING, 
              description: "A professional technical description of the material in Arabic (1-2 sentences)" 
            },
            engineeringNotes: { 
              type: Type.STRING, 
              description: "Specific engineer comments, chemical composition, or technical advice in Arabic" 
            },
            recommendedUses: { 
              type: Type.STRING, 
              description: "Recommended structural applications, e.g. columns, screed, precast, high-strength concrete in Arabic" 
            },
            concreteClasses: { 
              type: Type.STRING, 
              description: "Suitable Concrete classes, e.g. C25/30, C30/37, C40/50 in Arabic" 
            },
            warnings: { 
              type: Type.STRING, 
              description: "Critical safety warnings, dosage issues, impurities, or water-demand warnings in Arabic" 
            },
            density: { 
              type: Type.NUMBER, 
              description: "Suggested density in kg/m³ (typical sand: 2500-2700, gravel: 2600-2900, cement: 3000-3150)" 
            },
            absorption: { 
              type: Type.NUMBER, 
              description: "Suggested water absorption in % (typical: 0.2 to 2.5)" 
            },
            moisture: { 
              type: Type.NUMBER, 
              description: "Suggested default moisture content in % (typical: 0.1 to 2.0)" 
            },
            finenessModulus: { 
              type: Type.NUMBER, 
              description: "Suggested fineness modulus if Sand (typical: 1.5 to 3.5), otherwise null" 
            },
            quality: { 
              type: Type.STRING, 
              description: "Brief rating tag, e.g., 'جودة بركانية فائقة' or 'عياري مطابق للمواصفات'" 
            }
          },
          required: ["description", "engineeringNotes", "recommendedUses", "concreteClasses", "warnings"]
        }
      }
    });

    const text = response.text || "{}";
    const result = JSON.parse(text);

    return res.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.warn("AI Material Assistant warning (relicensing request to instant local heuristics):", error?.message || error);
    const fallbackData = getLocalMaterialFallback(name, category, region);
    return res.json({
      success: true,
      isFallback: true,
      data: fallbackData,
      message: "Model experiencing high demand, fell back to local structural heuristics successfully."
    });
  }
});

// --- SNO LAB EMAIL NOTIFICATION & RESILIENT QUEUE ENGINE ---

interface EmailJob {
  id: string;
  to: string;
  subject: string;
  html: string;
  emailType: string;
  userId?: string;
  userName?: string;
  attempts: number;
  maxAttempts: number;
  status: "pending" | "processing" | "sent" | "failed";
  error?: string;
  createdAt: Date;
  processedAt?: Date;
  resolve?: (result: any) => void;
}

class EmailQueueSystem {
  private queue: EmailJob[] = [];
  private isProcessing = false;
  private logs: any[] = []; // In-memory audit log ring buffer

  constructor() {
    this.startProcessor();
  }

  /**
   * Adds an email job to the queue. Returns a promise that resolves when the job is completed (sent or failed).
   */
  public addJob(jobData: Omit<EmailJob, "id" | "attempts" | "status" | "createdAt">): Promise<{ success: boolean; mode: string; attempts: number; error?: string; message?: string }> {
    return new Promise((resolve) => {
      const id = "job_" + Math.random().toString(36).substring(2, 15);
      const job: EmailJob = {
        ...jobData,
        id,
        attempts: 0,
        status: "pending",
        createdAt: new Date(),
        resolve: (res) => resolve(res),
      };
      this.queue.push(job);
      console.log(`[EmailQueue] Added job ${id} to ${job.to} (${job.emailType}). Current queue length: ${this.queue.length}`);
      this.triggerProcessing();
    });
  }

  private triggerProcessing() {
    if (!this.isProcessing) {
      this.processNext();
    }
  }

  private async processNext() {
    const nextJob = this.queue.find(j => j.status === "pending");
    if (!nextJob) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    nextJob.status = "processing";
    nextJob.attempts++;

    const smtpEmail = process.env.SMTP_EMAIL;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const isConfigured = !!smtpEmail && !!smtpPassword;
    const emailMode = isConfigured ? "real" : "simulation";

    console.log(`[EmailQueue] Processing job ${nextJob.id} to ${nextJob.to}. Attempt ${nextJob.attempts}/${nextJob.maxAttempts}...`);

    if (isConfigured) {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for 587 (STARTTLS)
        auth: {
          user: smtpEmail,
          pass: smtpPassword,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      try {
        const mailOptions = {
          from: `"SnoLab Team" <${smtpEmail}>`,
          to: nextJob.to,
          subject: nextJob.subject,
          html: nextJob.html,
        };

        await transporter.sendMail(mailOptions);
        
        nextJob.status = "sent";
        nextJob.processedAt = new Date();
        console.log(`[EmailQueue] Job ${nextJob.id} successfully delivered to ${nextJob.to}.`);
        this.logResult(nextJob, "sent");
        
        if (nextJob.resolve) {
          nextJob.resolve({
            success: true,
            mode: emailMode,
            attempts: nextJob.attempts,
            message: "Email successfully delivered via Gmail SMTP."
          });
        }
        
        // Remove from memory queue
        this.queue = this.queue.filter(j => j.id !== nextJob.id);
      } catch (err: any) {
        const errMsg = err.message || String(err);
        nextJob.error = errMsg;
        console.error(`[EmailQueue] Email delivery attempt ${nextJob.attempts} failed for ${nextJob.to}. Error: ${errMsg}`);
        this.logResult(nextJob, "failed_attempt");

        if (nextJob.attempts < nextJob.maxAttempts) {
          nextJob.status = "pending"; // Mark for retry
          // Retry automatically with a delay of 5 seconds
          setTimeout(() => this.processNext(), 5000);
          return;
        } else {
          nextJob.status = "failed";
          nextJob.processedAt = new Date();
          console.error(`[EmailQueue] Job ${nextJob.id} permanently failed after ${nextJob.attempts} attempts.`);
          this.logResult(nextJob, "failed_permanent");
          
          if (nextJob.resolve) {
            nextJob.resolve({
              success: false,
              mode: emailMode,
              attempts: nextJob.attempts,
              error: `Failed to deliver email via Gmail SMTP after ${nextJob.attempts} attempts. Last error: ${errMsg}`
            });
          }
          this.queue = this.queue.filter(j => j.id !== nextJob.id);
        }
      }
    } else {
      // Sandbox / Simulation Mode
      nextJob.status = "sent";
      nextJob.processedAt = new Date();
      
      console.log("----------------------------------------------------------------");
      console.log("✨ SNO LAB EMAIL NOTIFICATION ENGINE (SMTP GMAIL SIMULATION MODE)");
      console.log(`To: ${nextJob.to}`);
      console.log(`Subject: ${nextJob.subject}`);
      console.log(`From: SnoLab Team <${smtpEmail || "simulation@snolab.com"}> (simulated)`);
      console.log(`Email Type: ${nextJob.emailType}`);
      console.log(`User Name: ${nextJob.userName || "SNO Engineer"}`);
      console.log("----------------------------------------------------------------");
      
      this.logResult(nextJob, "simulated");
      
      if (nextJob.resolve) {
        nextJob.resolve({
          success: true,
          mode: "simulation",
          attempts: nextJob.attempts,
          message: "SMTP_EMAIL or SMTP_PASSWORD is not configured. Email logged & simulated successfully."
        });
      }
      this.queue = this.queue.filter(j => j.id !== nextJob.id);
    }

    // Process next job after a tiny cooldown gap
    setTimeout(() => this.processNext(), 150);
  }

  private logResult(job: EmailJob, resultType: string) {
    const logEntry = {
      jobId: job.id,
      userId: job.userId || "system",
      userName: job.userName || "System / Guest",
      email: job.to,
      emailType: job.emailType,
      subject: job.subject,
      timestamp: new Date().toISOString(),
      result: resultType,
      attempts: job.attempts,
      error: job.error,
    };
    this.logs.unshift(logEntry);
    if (this.logs.length > 2000) {
      this.logs.pop(); // Keep memory bounded
    }
  }

  public getLogs() {
    return this.logs;
  }

  public getQueueStatus() {
    return {
      isProcessing: this.isProcessing,
      pendingJobs: this.queue.filter(j => j.status === "pending").length,
      activeJobs: this.queue.filter(j => j.status === "processing").length,
      queueLength: this.queue.length,
    };
  }

  private startProcessor() {
    // Periodic check to guarantee background worker never gets stuck
    setInterval(() => {
      if (!this.isProcessing && this.queue.some(j => j.status === "pending")) {
        console.log("[EmailQueue] Auto-recovery: jobs pending but worker is idle. Triggering processing.");
        this.triggerProcessing();
      }
    }, 15000);
  }
}

export const emailQueue = new EmailQueueSystem();

// API: Send Account Activation Email Notification (Resilient Queue-based)
app.post("/api/admin/send-activation-email", async (req, res) => {
  const { userId, email, displayName } = req.body;

  if (!userId || !email) {
    return res.status(400).json({ success: false, error: "Missing required user parameters" });
  }

  // Generate HTML Email
  const currentYear = new Date().getFullYear();
  const userName = displayName || "SNO Engineer";
  
  // Dynamically derive platform login URL
  const loginUrl = process.env.NODE_ENV === "production"
    ? `https://${req.get("host")}/`
    : "http://localhost:3000/";

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🎉 Welcome to SnoLab — Your Account Has Been Successfully Activated</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    /* Responsive styles for email clients */
    @media only screen and (max-width: 600px) {
      .main-card {
        border-radius: 16px !important;
        margin: 10px !important;
      }
      .content-area {
        padding: 32px 20px !important;
      }
      .feature-col {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        padding: 6px 0 !important;
      }
      .cta-button {
        padding: 14px 28px !important;
        font-size: 15px !important;
        width: 100% !important;
        box-sizing: border-box !important;
        text-align: center !important;
      }
      .footer-table td {
        display: block !important;
        width: 100% !important;
        text-align: center !important;
        padding-right: 0 !important;
      }
      .footer-logo-td {
        margin-top: 20px !important;
        text-align: center !important;
      }
    }
    
    /* Hover effects for interactive clients */
    .cta-button:hover {
      background-color: #1e40af !important;
      background-image: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
      box-shadow: 0 6px 20px rgba(29, 78, 216, 0.45) !important;
      transform: translateY(-1px);
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table class="main-card" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 24px; box-shadow: 0 10px 30px rgba(0, 85, 255, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02); overflow: hidden; border: 1px solid #E2E8F0;">
          
          <!-- Header Area with Centered SnoLab Logo -->
          <tr>
            <td align="center" style="padding: 48px 40px; background: #061024 linear-gradient(135deg, #061024 0%, #0d2149 100%); text-align: center; border-radius: 24px 24px 0 0; position: relative; overflow: hidden;">
              <!-- Futuristic glowing lines in background -->
              <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.15; pointer-events: none;">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid-header" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#38BDF8" stroke-width="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid-header)" />
                </svg>
              </div>
              
              <!-- Logo Container -->
              <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto; text-align: center; position: relative; z-index: 2;">
                <tr>
                  <td align="center">
                    <!-- SVG Logo: Transparent, Original Colors, Width ~220px -->
                    <svg viewBox="0 0 420 120" width="220" height="63" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto;">
                      <defs>
                        <linearGradient id="lab-grad-mail-header" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#00C2FF" />
                          <stop offset="100%" stopColor="#0055FF" />
                        </linearGradient>
                        <linearGradient id="panel-grad-1-header" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#38BDF8" />
                          <stop offset="100%" stopColor="#0284C7" />
                        </linearGradient>
                        <linearGradient id="panel-grad-2-header" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#0EA5E9" />
                          <stop offset="100%" stopColor="#0369A1" />
                        </linearGradient>
                        <linearGradient id="cube-top-header" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#FFFFFF" />
                          <stop offset="100%" stopColor="#F8FAFC" />
                        </linearGradient>
                        <linearGradient id="cube-left-header" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#F1F5F9" />
                          <stop offset="100%" stopColor="#E2E8F0" />
                        </linearGradient>
                        <linearGradient id="cube-right-header" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#E2E8F0" />
                          <stop offset="100%" stopColor="#CBD5E1" />
                        </linearGradient>
                      </defs>
                      <!-- Text "SnoLab" -->
                      <text x="20" y="78" fontFamily="'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif" fontWeight="900" fontSize="58" letterSpacing="-0.03em">
                        <tspan fill="#FFFFFF">Sno</tspan>
                        <tspan fill="url(#lab-grad-mail-header)">Lab</tspan>
                      </text>
                      <!-- Hexagon Icon -->
                      <g id="hexagon-icon-header">
                        <path d="M 340,12 L 381.6,36 L 364.25,46 L 340,32 Z" fill="url(#panel-grad-1-header)" />
                        <path d="M 381.6,36 L 381.6,84 L 364.25,74 L 364.25,46 Z" fill="#0B1F3A" />
                        <circle cx="372" cy="52" r="1.8" fill="#FFFFFF" opacity="0.9" />
                        <circle cx="376" cy="60" r="1.3" fill="#FFFFFF" opacity="0.9" />
                        <circle cx="373" cy="68" r="2.2" fill="#FFFFFF" opacity="0.9" />
                        <circle cx="377" cy="74" r="1.5" fill="#FFFFFF" opacity="0.9" />
                        <path d="M 381.6,84 L 340,108 L 340,88 L 364.25,74 Z" fill="url(#panel-grad-2-header)" />
                        <path d="M 340,108 L 298.4,84 L 315.75,74 L 340,88 Z" fill="#0B1F3A" />
                        <circle cx="328" cy="85" r="1.8" fill="#FFFFFF" opacity="0.9" />
                        <circle cx="332" cy="93" r="1.3" fill="#FFFFFF" opacity="0.9" />
                        <circle cx="318" cy="81" r="2.2" fill="#FFFFFF" opacity="0.9" />
                        <path d="M 298.4,84 L 298.4,36 L 315.75,46 L 315.75,74 Z" fill="url(#panel-grad-1-header)" />
                        <path d="M 298.4,36 L 340,12 L 340,32 L 315.75,46 Z" fill="#0B1F3A" />
                        <circle cx="316" cy="33" r="1.8" fill="#FFFFFF" opacity="0.9" />
                        <circle cx="326" cy="31" r="1.3" fill="#FFFFFF" opacity="0.9" />
                        <circle cx="323" cy="38" r="2.2" fill="#FFFFFF" opacity="0.9" />
                        <polygon points="340,45 353,52.5 340,60 327,52.5" fill="url(#cube-top-header)" />
                        <polygon points="340,60 327,52.5 327,67.5 340,75" fill="url(#cube-left-header)" />
                        <polygon points="340,60 353,52.5 353,67.5 340,75" fill="url(#cube-right-header)" />
                      </g>
                    </svg>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 16px; font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 2.5px; color: #94A3B8; line-height: 1.4;">
                    ADVANCED CIVIL ENGINEERING & CONCRETE TECHNOLOGY PLATFORM
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body Area -->
          <tr>
            <td class="content-area" style="padding: 44px 44px 10px 44px;">
              
              <!-- Main Title -->
              <div style="margin: 0 0 24px 0; text-align: center;">
                <h1 style="margin: 0 0 12px 0; color: #0B1F3A; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 26px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.3;">
                  Your SnoLab Account<br/>Has Been Successfully Activated!
                </h1>
                <!-- Dynamic Horizontal Line Under Title -->
                <div style="width: 56px; height: 3px; background: linear-gradient(90deg, #38BDF8 0%, #0055FF 100%); margin: 0 auto; border-radius: 2px;"></div>
              </div>
              
              <!-- Greeting & Main Message -->
              <p style="margin: 0 0 16px 0; color: #0F172A; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 16px; line-height: 1.6; font-weight: 600;">
                Hello ${userName},
              </p>
              
              <p style="margin: 0 0 16px 0; color: #334155; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 15px; line-height: 1.6; font-weight: 400;">
                Welcome to <span style="color: #0055FF; font-weight: 600;">SnoLab</span>.
              </p>
              
              <p style="margin: 0 0 16px 0; color: #475569; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 15px; line-height: 1.6;">
                We are pleased to inform you that your account has been successfully reviewed and activated by the SnoLab Administration Team.
              </p>
              
              <p style="margin: 0 0 16px 0; color: #475569; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 15px; line-height: 1.6;">
                Your account is now fully active and ready to use.
              </p>
              
              <p style="margin: 0 0 16px 0; color: #475569; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 15px; line-height: 1.6;">
                You now have unrestricted access to SnoLab's engineering platform and all currently available professional tools.
              </p>
              
              <p style="margin: 0 0 32px 0; color: #475569; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 15px; line-height: 1.6;">
                We are delighted to welcome you to our engineering community and look forward to supporting your work through innovative concrete technology and advanced civil engineering solutions.
              </p>

              <!-- Feature Card Section -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F0F7FF; border-radius: 16px; border: 1px solid #E0F2FE; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <!-- Card Title with Logo Icon -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px;">
                      <tr>
                        <td align="center" style="font-family: 'Inter', -apple-system, sans-serif; font-size: 16px; font-weight: 800; color: #1E3A8A; text-align: center;">
                          <svg viewBox="280 0 140 120" width="22" height="19" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle; margin-right: 8px;">
                            <path d="M 340,12 L 381.6,36 L 364.25,46 L 340,32 Z" fill="#38BDF8" />
                            <path d="M 381.6,36 L 381.6,84 L 364.25,74 L 364.25,46 Z" fill="#0B1F3A" />
                            <path d="M 381.6,84 L 340,108 L 340,88 L 364.25,74 Z" fill="#0EA5E9" />
                            <path d="M 340,108 L 298.4,84 L 315.75,74 L 340,88 Z" fill="#0B1F3A" />
                            <path d="M 298.4,84 L 298.4,36 L 315.75,46 L 315.75,74 Z" fill="#38BDF8" />
                            <path d="M 298.4,36 L 340,12 L 340,32 L 315.75,46 Z" fill="#0B1F3A" />
                            <polygon points="340,45 353,52.5 340,60 327,52.5" fill="#FFFFFF" />
                            <polygon points="340,60 327,52.5 327,67.5 340,75" fill="#E2E8F0" />
                            <polygon points="340,60 353,52.5 353,67.5 340,75" fill="#CBD5E1" />
                          </svg>
                          You Can Now Access All Platform Features
                        </td>
                      </tr>
                    </table>
                    
                    <!-- 2-Column Features Grid -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <!-- Row 1 -->
                      <tr>
                        <!-- Concrete Mix Design -->
                        <td width="50%" class="feature-col" style="padding: 8px; vertical-align: top;">
                          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E0F2FE; padding: 12px; height: 76px;">
                            <tr>
                              <td width="36" style="vertical-align: middle;">
                                <table border="0" cellpadding="0" cellspacing="0" style="background-color: #EFF6FF; border-radius: 10px; width: 36px; height: 36px; text-align: center;">
                                  <tr>
                                    <td align="center" style="vertical-align: middle; padding: 6px;">
                                      <svg viewBox="0 0 24 24" width="20" height="20" stroke="#2563EB" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M6 18H18" />
                                        <path d="M12 2v4" />
                                        <path d="M3 8h18" />
                                        <path d="M4 8l2 10h12l2-10" />
                                      </svg>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <td style="padding-left: 10px; padding-right: 6px; vertical-align: middle; font-family: 'Inter', sans-serif;">
                                <div style="font-size: 13.5px; font-weight: 700; color: #1E3A8A; line-height: 1.2; margin-bottom: 2px;">Concrete Mix Design</div>
                                <div style="font-size: 11px; color: #64748B; line-height: 1.2;">Using the Dreux–Gorisse Method</div>
                              </td>
                              <td width="20" align="right" style="vertical-align: middle;">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                                  <circle cx="12" cy="12" r="10" fill="#DEF7EC" />
                                  <path d="M8 12l3 3 5-5" stroke="#03543F" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                              </td>
                            </tr>
                          </table>
                        </td>
                        
                        <!-- Project Management -->
                        <td width="50%" class="feature-col" style="padding: 8px; vertical-align: top;">
                          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E0F2FE; padding: 12px; height: 76px;">
                            <tr>
                              <td width="36" style="vertical-align: middle;">
                                <table border="0" cellpadding="0" cellspacing="0" style="background-color: #EFF6FF; border-radius: 10px; width: 36px; height: 36px; text-align: center;">
                                  <tr>
                                    <td align="center" style="vertical-align: middle; padding: 6px;">
                                      <svg viewBox="0 0 24 24" width="20" height="20" stroke="#2563EB" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                      </svg>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <td style="padding-left: 10px; padding-right: 6px; vertical-align: middle; font-family: 'Inter', sans-serif;">
                                <div style="font-size: 13.5px; font-weight: 700; color: #1E3A8A; line-height: 1.2; margin-bottom: 2px;">Project Management</div>
                                <div style="font-size: 11px; color: #64748B; line-height: 1.2;">Organize and monitor projects</div>
                              </td>
                              <td width="20" align="right" style="vertical-align: middle;">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                                  <circle cx="12" cy="12" r="10" fill="#DEF7EC" />
                                  <path d="M8 12l3 3 5-5" stroke="#03543F" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      <!-- Row 2 -->
                      <tr>
                        <!-- Laboratory Materials Database -->
                        <td width="50%" class="feature-col" style="padding: 8px; vertical-align: top;">
                          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E0F2FE; padding: 12px; height: 76px;">
                            <tr>
                              <td width="36" style="vertical-align: middle;">
                                <table border="0" cellpadding="0" cellspacing="0" style="background-color: #EFF6FF; border-radius: 10px; width: 36px; height: 36px; text-align: center;">
                                  <tr>
                                    <td align="center" style="vertical-align: middle; padding: 6px;">
                                      <svg viewBox="0 0 24 24" width="20" height="20" stroke="#2563EB" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M6 3h12" />
                                        <path d="M12 3v13" />
                                        <path d="M19 16l-3.3-6.6a1 1 0 0 0-.9-.4H9.2a1 1 0 0 0-.9.4L5 16c-.5 1 .3 2.2 1.5 2.2h11c1.2 0 2-1.2 1.5-2.2z" />
                                      </svg>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <td style="padding-left: 10px; padding-right: 6px; vertical-align: middle; font-family: 'Inter', sans-serif;">
                                <div style="font-size: 13.5px; font-weight: 700; color: #1E3A8A; line-height: 1.2; margin-bottom: 2px;">Materials Database</div>
                                <div style="font-size: 11px; color: #64748B; line-height: 1.2;">Manage and organize materials</div>
                              </td>
                              <td width="20" align="right" style="vertical-align: middle;">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                                  <circle cx="12" cy="12" r="10" fill="#DEF7EC" />
                                  <path d="M8 12l3 3 5-5" stroke="#03543F" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                              </td>
                            </tr>
                          </table>
                        </td>
                        
                        <!-- Saved Calculations -->
                        <td width="50%" class="feature-col" style="padding: 8px; vertical-align: top;">
                          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E0F2FE; padding: 12px; height: 76px;">
                            <tr>
                              <td width="36" style="vertical-align: middle;">
                                <table border="0" cellpadding="0" cellspacing="0" style="background-color: #EFF6FF; border-radius: 10px; width: 36px; height: 36px; text-align: center;">
                                  <tr>
                                    <td align="center" style="vertical-align: middle; padding: 6px;">
                                      <svg viewBox="0 0 24 24" width="20" height="20" stroke="#2563EB" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                      </svg>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <td style="padding-left: 10px; padding-right: 6px; vertical-align: middle; font-family: 'Inter', sans-serif;">
                                <div style="font-size: 13.5px; font-weight: 700; color: #1E3A8A; line-height: 1.2; margin-bottom: 2px;">Saved Calculations</div>
                                <div style="font-size: 11px; color: #64748B; line-height: 1.2;">Access previous work anytime</div>
                              </td>
                              <td width="20" align="right" style="vertical-align: middle;">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                                  <circle cx="12" cy="12" r="10" fill="#DEF7EC" />
                                  <path d="M8 12l3 3 5-5" stroke="#03543F" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      <!-- Row 3 -->
                      <tr>
                        <!-- Engineering Calculators -->
                        <td width="50%" class="feature-col" style="padding: 8px; vertical-align: top;">
                          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E0F2FE; padding: 12px; height: 76px;">
                            <tr>
                              <td width="36" style="vertical-align: middle;">
                                <table border="0" cellpadding="0" cellspacing="0" style="background-color: #EFF6FF; border-radius: 10px; width: 36px; height: 36px; text-align: center;">
                                  <tr>
                                    <td align="center" style="vertical-align: middle; padding: 6px;">
                                      <svg viewBox="0 0 24 24" width="20" height="20" stroke="#2563EB" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                                        <line x1="9" y1="22" x2="9" y2="16" />
                                        <line x1="8" y1="6" x2="16" y2="6" />
                                      </svg>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <td style="padding-left: 10px; padding-right: 6px; vertical-align: middle; font-family: 'Inter', sans-serif;">
                                <div style="font-size: 13.5px; font-weight: 700; color: #1E3A8A; line-height: 1.2; margin-bottom: 2px;">Engineering Calculators</div>
                                <div style="font-size: 11px; color: #64748B; line-height: 1.2;">Fast, accurate and reliable tools</div>
                              </td>
                              <td width="20" align="right" style="vertical-align: middle;">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                                  <circle cx="12" cy="12" r="10" fill="#DEF7EC" />
                                  <path d="M8 12l3 3 5-5" stroke="#03543F" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                              </td>
                            </tr>
                          </table>
                        </td>
                        
                        <!-- Future Premium Features -->
                        <td width="50%" class="feature-col" style="padding: 8px; vertical-align: top;">
                          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E0F2FE; padding: 12px; height: 76px;">
                            <tr>
                              <td width="36" style="vertical-align: middle;">
                                <table border="0" cellpadding="0" cellspacing="0" style="background-color: #EFF6FF; border-radius: 10px; width: 36px; height: 36px; text-align: center;">
                                  <tr>
                                    <td align="center" style="vertical-align: middle; padding: 6px;">
                                      <svg viewBox="0 0 24 24" width="20" height="20" stroke="#2563EB" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M4.5 16.5c-1.5 1.5-2.5 3.5-2.5 5.5C4 22 6 21 7.5 19.5" />
                                        <path d="M12 12l9-9-3 12-6 3-3-3" />
                                      </svg>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <td style="padding-left: 10px; padding-right: 6px; vertical-align: middle; font-family: 'Inter', sans-serif;">
                                <div style="font-size: 13.5px; font-weight: 700; color: #1E3A8A; line-height: 1.2; margin-bottom: 2px;">Future Premium Features</div>
                                <div style="font-size: 11px; color: #64748B; line-height: 1.2;">AI tools & upcoming innovations</div>
                              </td>
                              <td width="20" align="right" style="vertical-align: middle;">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                                  <circle cx="12" cy="12" r="10" fill="#DEF7EC" />
                                  <path d="M8 12l3 3 5-5" stroke="#03543F" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Status Card Section -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F0F6FF; border-radius: 16px; border: 1px solid #D6E4FF; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="32" style="vertical-align: top; padding-top: 2px;">
                          <!-- Blue Info Icon SVG -->
                          <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                            <circle cx="12" cy="12" r="10" fill="#2563EB" />
                            <line x1="12" y1="16" x2="12" y2="12" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
                            <circle cx="12" cy="8" r="1" fill="#FFFFFF" />
                          </svg>
                        </td>
                        <td style="padding-left: 12px; font-family: 'Inter', -apple-system, sans-serif;">
                          <div style="font-size: 15px; font-weight: 700; color: #1E40AF; margin-bottom: 4px;">
                            Your account is now active.
                          </div>
                          <div style="font-size: 13.5px; color: #1E3A8A; line-height: 1.5;">
                            You can sign in immediately and start using all available SnoLab engineering tools and services.
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Primary Action Button -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <a class="cta-button" href="${loginUrl}" target="_blank" style="display: inline-block; padding: 16px 40px; background-color: #2563EB; background-image: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #FFFFFF; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 15px rgba(29, 78, 216, 0.3); transition: all 0.28s ease; letter-spacing: -0.01em;">
                      Access SnoLab
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Backup Link Section -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
                <tr>
                  <td align="center" style="font-family: 'Inter', -apple-system, sans-serif; font-size: 12.5px; color: #64748B; line-height: 1.6; text-align: center;">
                    If the button doesn't work, copy and paste the following link into your browser:<br/>
                    <a href="${loginUrl}" style="color: #2563EB; text-decoration: none; font-weight: 600; word-break: break-all; display: inline-block; margin-top: 6px;">${loginUrl}</a>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; border-top: 1px solid #F1F5F9; padding-top: 24px;">
                <tr>
                  <td style="font-family: 'Inter', -apple-system, sans-serif; font-size: 12px; color: #94A3B8; line-height: 1.6; text-align: center;">
                    <span style="font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 1.2px; font-size: 10.5px; display: block; margin-bottom: 6px;">Security Notice</span>
                    If you did not create this account or believe this email was sent to you by mistake, please contact the <a href="mailto:senoussi.s.t@gmail.com" style="color: #64748B; text-decoration: underline; font-weight: 500;">SnoLab Administration Team</a> immediately.
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Area (Footer card text & Standalone 3D hexagon logo side-by-side) -->
          <tr>
            <td style="padding: 40px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0;">
              <table class="footer-table" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <!-- Left side: Team signature & metadata -->
                  <td style="vertical-align: bottom; font-family: 'Inter', -apple-system, sans-serif; padding-right: 15px;">
                    <p style="margin: 0 0 14px 0; font-size: 13.5px; color: #475569; line-height: 1.5; font-weight: 500;">
                      💙 Thank you for choosing SnoLab.<br/>
                      We are proud to have you as a member of our global engineering community.
                    </p>
                    <p style="margin: 0 0 4px 0; font-size: 13.5px; font-weight: 500; color: #64748B;">
                      Best regards,
                    </p>
                    <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 800; color: #2563EB; letter-spacing: -0.5px;">
                      The SnoLab Team
                    </p>
                    <p style="margin: 0 0 2px 0; font-size: 12.5px; font-weight: 600; color: #0F172A; letter-spacing: 0.1px;">
                      Advanced Civil Engineering & Concrete Technology Platform
                    </p>
                    <p style="margin: 0; font-size: 10px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px;">
                      Engineering &bull; Innovation &bull; Precision
                    </p>
                  </td>
                  
                  <!-- Right side: Standalone 3D Hexagon Logo in Bottom Right -->
                  <td class="footer-logo-td" width="90" style="vertical-align: bottom; text-align: right;">
                    <svg viewBox="280 0 140 120" width="80" height="68" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block;">
                      <defs>
                        <linearGradient id="panel-grad-1-b" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#38BDF8" />
                          <stop offset="100%" stopColor="#0284C7" />
                        </linearGradient>
                        <linearGradient id="panel-grad-2-b" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#0EA5E9" />
                          <stop offset="100%" stopColor="#0369A1" />
                        </linearGradient>
                        <linearGradient id="cube-top-b" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#FFFFFF" />
                          <stop offset="100%" stopColor="#F8FAFC" />
                        </linearGradient>
                        <linearGradient id="cube-left-b" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#F1F5F9" />
                          <stop offset="100%" stopColor="#E2E8F0" />
                        </linearGradient>
                        <linearGradient id="cube-right-b" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#E2E8F0" />
                          <stop offset="100%" stopColor="#CBD5E1" />
                        </linearGradient>
                      </defs>
                      <g id="hexagon-icon-b">
                        <path d="M 340,12 L 381.6,36 L 364.25,46 L 340,32 Z" fill="url(#panel-grad-1-b)" />
                        <path d="M 381.6,36 L 381.6,84 L 364.25,74 L 364.25,46 Z" fill="#0B1F3A" />
                        <circle cx="372" cy="52" r="1.8" fill="#FFFFFF" opacity="0.9" />
                        <circle cx="376" cy="60" r="1.3" fill="#FFFFFF" opacity="0.9" />
                        <circle cx="373" cy="68" r="2.2" fill="#FFFFFF" opacity="0.9" />
                        <circle cx="377" cy="74" r="1.5" fill="#FFFFFF" opacity="0.9" />
                        <path d="M 381.6,84 L 340,108 L 340,88 L 364.25,74 Z" fill="url(#panel-grad-2-b)" />
                        <path d="M 340,108 L 298.4,84 L 315.75,74 L 340,88 Z" fill="#0B1F3A" />
                        <circle cx="328" cy="85" r="1.8" fill="#FFFFFF" opacity="0.9" />
                        <circle cx="332" cy="93" r="1.3" fill="#FFFFFF" opacity="0.9" />
                        <circle cx="318" cy="81" r="2.2" fill="#FFFFFF" opacity="0.9" />
                        <path d="M 298.4,84 L 298.4,36 L 315.75,46 L 315.75,74 Z" fill="url(#panel-grad-1-b)" />
                        <path d="M 298.4,36 L 340,12 L 340,32 L 315.75,46 Z" fill="#0B1F3A" />
                        <circle cx="316" cy="33" r="1.8" fill="#FFFFFF" opacity="0.9" />
                        <circle cx="326" cy="31" r="1.3" fill="#FFFFFF" opacity="0.9" />
                        <circle cx="323" cy="38" r="2.2" fill="#FFFFFF" opacity="0.9" />
                        <polygon points="340,45 353,52.5 340,60 327,52.5" fill="url(#cube-top-b)" />
                        <polygon points="340,60 327,52.5 327,67.5 340,75" fill="url(#cube-left-b)" />
                        <polygon points="340,60 353,52.5 353,67.5 340,75" fill="url(#cube-right-b)" />
                      </g>
                    </svg>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Black Navigation & Copyright Bar -->
          <tr>
            <td style="background-color: #061024; padding: 24px; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td style="padding: 0 12px; font-family: 'Inter', -apple-system, sans-serif; font-size: 13px;">
                          <a href="${loginUrl}" target="_blank" style="color: #93C5FD; text-decoration: none; font-weight: 500;">
                            🌐 Website
                          </a>
                        </td>
                        <td style="color: #1E3A8A; font-size: 13px;">|</td>
                        <td style="padding: 0 12px; font-family: 'Inter', -apple-system, sans-serif; font-size: 13px;">
                          <a href="https://linkedin.com/" target="_blank" style="color: #93C5FD; text-decoration: none; font-weight: 500;">
                            💼 LinkedIn
                          </a>
                        </td>
                        <td style="color: #1E3A8A; font-size: 13px;">|</td>
                        <td style="padding: 0 12px; font-family: 'Inter', -apple-system, sans-serif; font-size: 13px;">
                          <a href="mailto:senoussi.s.t@gmail.com" style="color: #93C5FD; text-decoration: none; font-weight: 500;">
                            📧 Contact Us
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family: 'Inter', -apple-system, sans-serif; font-size: 11.5px; color: #64748B;">
                    &copy; ${currentYear} SnoLab. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Submit job to queue and wait for the final outcome (maintaining synchronous backward-compatibility)
  const result = await emailQueue.addJob({
    to: email,
    subject: "🎉 Welcome to SnoLab — Your Account Has Been Successfully Activated",
    html: htmlContent,
    emailType: "Account Activation",
    userId,
    userName,
    maxAttempts: 3 // Resilient 3 attempts for high durability
  });

  if (result.success) {
    return res.json(result);
  } else {
    return res.status(500).json(result);
  }
});

// API: General Resilient Email Sending Endpoint (supports all current and future email types without limits)
app.post("/api/admin/send-email", async (req, res) => {
  const { to, subject, html, emailType, userId, userName, maxAttempts } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ success: false, error: "Missing parameters 'to', 'subject', or 'html'" });
  }

  const result = await emailQueue.addJob({
    to,
    subject,
    html,
    emailType: emailType || "System Notification",
    userId,
    userName,
    maxAttempts: maxAttempts ? Number(maxAttempts) : 3
  });

  if (result.success) {
    return res.json(result);
  } else {
    return res.status(500).json(result);
  }
});

// API: Fetch Email Queue Status and Audit Logs
app.get("/api/admin/email-logs", (req, res) => {
  res.json({
    success: true,
    status: emailQueue.getQueueStatus(),
    logs: emailQueue.getLogs()
  });
});

// Setup Vite Dev server or Serve static files in production
async function run() {
  // Validate critical environments without blocking execution
  const isProd = process.env.NODE_ENV === "production";
  if (!process.env.GEMINI_API_KEY) {
    if (isProd) {
      console.warn("****************************************************************");
      console.warn("⚠️  PRODUCTION ALERT: GEMINI_API_KEY IS MISSING!");
      console.warn("SNO AI Engineering features will fallback to local calculations.");
      console.warn("Please declare the GEMINI_API_KEY environment variable.");
      console.warn("****************************************************************");
    } else {
      console.log("[SNO Startup Info] GEMINI_API_KEY environment variable is not defined - local rule fallback engines will process general queries.");
    }
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Concrete Server] running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

run();
