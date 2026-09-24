# تقرير التدقيق الهندسي والرياضي لمختبر SnoLab

**الإصدار:** 2026-09-24

## الخلاصة التنفيذية

أُجري هذا التدقيق على طبقة الاختبارات المحكومة في `src/services/laboratoryTestDefinitions.ts` وعلى محرك التنفيذ `laboratoryTestEngine.ts`. تمت إضافة تحقق مستقل قابل لإعادة الاستخدام، وفحص لعقد المدخلات، وفحص للتتبّع الحسابي، ومقارنة بالتحويلات الصريحة للوحدات. كما أصبحت كل نتيجة تنفيذ محكومة تحمل حالة تدقيق مستقلة.

النتيجة المهمة هي أن وجود معادلة أو اختبار وحدة لا يكفي لإعلان التجربة **VERIFIED**. التجربة لا تصبح مكتملة إلا بعد تسجيل دالة إعادة حساب مستقلة، وربطها بالوحدة الصحيحة، وإثبات أن خطوات الحساب قابلة للتتبع. لذلك تظهر الاختبارات الحالية التي لا تملك محققًا مستقلًا بالحالة **NEEDS_REVIEW**. هذا سلوك مقصود يمنع تحويل نتيجة صحيحة ظاهريًا إلى نتيجة معتمدة دون دليل تحقق ثانٍ.

> لا توجد في هذه الدفعة أي معادلة قائمة تم تبسيطها أو استبدالها. التعديل أضاف بوابة تدقيق، ولم يغيّر مخرجات المحركات الحالية.

## ما تم تطبيقه

أصبح محرك التحقق يدعم مقارنة النتيجة الأساسية بنتيجة مستقلة مع فرق مطلق ونسبة فرق. ويمنع التحقق القيم غير المنتهية، كما يميز بين عدم اكتمال البيانات، واختلاف النتائج، وغياب المحقق المستقل.

أضيفت تحويلات صريحة للكتلة والطول والحجم والضغط والكثافة. وتشمل التحويلات `g/kg` و`mm/cm/m` و`L/m³/cm³` و`Pa/kPa/MPa` و`g/cm³/kg/m³`. لا تقبل دالة التحويل قيمة غير منتهية.

أضيف فحص عقد التعريف لكل تجربة. يتحقق الفحص من وجود رقم المعيار، ومن المدخلات المطلوبة، ومن كون المدخلات الرقمية منتهية، ومن الحدود الدنيا والعليا المعلنة. كما يفحص وجود التتبّع الحسابي، وصيغة المعادلة، والتعويض العددي، والنتيجة، ووحدة الخطوة.

أضيفت إلى سجل الاختبار الحقول `verificationStatus` و`verificationIssues`. وتبقى حالة الاعتماد الحالية منفصلة عن حالة التدقيق؛ فالاختبار قد يكون `Calculated` أو `Warning` من ناحية التنفيذ، ولكنه `NEEDS_REVIEW` من ناحية الإثبات المستقل.

## مصفوفة حالة الاختبارات المحكومة

| Test | Formula Verified | Units Verified | Engineering Validation | Automated Test | Graph | Standard | Status |
|---|---|---|---|---|---|---|---|
| Sieve analysis | Partial; trace exists | Partial | Yes | Yes | Legacy granulometric path only | EN 933-1 / configured | NEEDS_REVIEW |
| Aggregate specific gravity | Partial; trace exists | Partial | Yes | Yes | No governed chart contract | EN 1097-6 / configured | NEEDS_REVIEW |
| Aggregate bulk density | Partial; trace exists | Partial | Yes | Yes | No governed chart contract | EN 1097-3 / configured | NEEDS_REVIEW |
| Aggregate moisture | Partial; trace exists | Partial | Yes | Yes | No governed chart contract | EN 1097-5 / configured | NEEDS_REVIEW |
| Sand equivalent | Partial; trace exists | Partial | Yes | Yes | No | EN 933-8 / configured | NEEDS_REVIEW |
| Sand bulking | Partial; trace exists | Partial | Yes | Yes | Chart exists in legacy execution path | Configured | NEEDS_REVIEW |
| Los Angeles | Partial; trace exists | Partial | Yes | Yes | No | EN 1097-2 / configured | NEEDS_REVIEW |
| Micro-Deval | Partial; trace exists | Partial | Yes | Yes | No | EN 1097-1 / configured | NEEDS_REVIEW |
| Flakiness index | Partial; trace exists | Partial | Yes | Yes | No | EN 933-3 / configured | NEEDS_REVIEW |
| Methylene blue | Partial; trace exists | Partial | Yes | Yes | No | EN 933-9 / configured | NEEDS_REVIEW |
| Cement specific gravity | Partial; trace exists | Partial | Yes | Yes | No | EN 196-6 / configured | NEEDS_REVIEW |
| Blaine fineness | Partial; trace exists | Partial | Yes | Yes | No | EN 196-6 / configured | NEEDS_REVIEW |
| Cement setting time | Partial; trace exists | Partial | Yes | Yes | Time-series trace exists | EN 196-3 / configured | NEEDS_REVIEW |
| Cement soundness | Partial; trace exists | Partial | Yes | Yes | No | EN 196-3 / configured | NEEDS_REVIEW |
| Cement mortar strength | Partial; trace exists | Partial | Yes | Yes | Age-series chart not yet governed | EN 196-1 / configured | NEEDS_REVIEW |
| Cement normal consistency | Partial; trace exists | Partial | Yes | Yes | No | EN 196-3 / configured | NEEDS_REVIEW |
| Aggregate crushing value | Partial; trace exists | Partial | Yes | Yes | No | EN 1097-2 / configured | NEEDS_REVIEW |
| Cement chemical composition | Partial; trace exists | Partial | Yes | Yes | No | EN 196-2 / configured | NEEDS_REVIEW |
| Water pH | Partial; trace exists | Partial | Yes | Yes | No | EN 1008 / configured | NEEDS_REVIEW |
| Aggregate impact value | Partial; trace exists | Partial | Yes | Yes | No | EN 1097-2 / configured | NEEDS_REVIEW |
| Cement heat of hydration | Partial; trace exists | Partial | Yes | Yes | Time-series chart not yet governed | EN 196-8/9 / configured | NEEDS_REVIEW |
| Aggregate elongation index | Partial; trace exists | Partial | Yes | Yes | No | EN 933-3 / configured | NEEDS_REVIEW |
| Cement false set | Partial; trace exists | Partial | Yes | Yes | No | EN 196-3 / configured | NEEDS_REVIEW |
| Aggregate clay lumps | Partial; trace exists | Partial | Yes | Yes | No | Configured | NEEDS_REVIEW |
| Cement alkali equivalent | Partial; trace exists | Partial | Yes | Yes | No | EN 196-2 / configured | NEEDS_REVIEW |

## تفسير الحالة

الحالة **NEEDS_REVIEW** لا تعني أن المعادلة خاطئة. تعني أن النظام لا يملك بعد، لكل تعريف، محركًا ثانيًا مستقلًا ومسجلًا داخل العقد البرمجي. كما تعني أن ربط الرسوم البيانية ليس موحدًا بعد عبر محرك الاختبارات المحكومة. هذه التفرقة ضرورية لأن اعتماد نتيجة دون إعادة حساب مستقل أو دون ربط الرسم بالمدخلات يخالف هدف التدقيق المطلوب.

المعايير التي تحمل حالة `Draft` أو عبارة `configured` لا تُعامل كحدود قبول نهائية. لا توجد في هذه الدفعة حدود قبول مخترعة. أي مقارنة PASS/FAIL تحتاج إلى معيار نشط وإصدار وطريقة تطبيق ونوع مادة واضح.

## اختبارات التحقق المنفذة

نجحت اختبارات التحقق المستقل والتكامل والاختبارات المحكومة المستهدفة في **23 ملف اختبار و89 اختبارًا** بعد إدماج حالة التدقيق في محرك التنفيذ، ونجح `npm run lint`. أما regression النهائي فنجح في **69 ملف اختبار و472 اختبارًا**، كما نجح `npm run build`.

## خطة الإكمال المطلوبة للوصول إلى VERIFIED

ينبغي تسجيل دالة `independentCalculate` لكل تعريف، على أن تستخدم صيغة مستقلة عن مسار المحرك الأساسي، ثم إضافة حالات حدية للفراغ والقيم الصفرية والسالبة والمدخلات الناقصة والوحدات غير المتوافقة والقياسات المكررة وغير الكافية. بعد ذلك ينبغي إضافة عقد رسوم بيانية للتجارب ذات المعنى العلمي، مثل منحنى التدرج، ومنحنى الانتفاخ أو الدمك، وتطور المقاومة مع العمر، والاختراق أو الحرارة مع الزمن. يجب أن يعتمد كل رسم على `rawData` ونتائج الحساب نفسها، لا على قيم ثابتة.

بعد اكتمال ذلك يمكن تحديث الحالة من **NEEDS_REVIEW** إلى **VERIFIED** تجربةً بعد تجربة. أما التجارب التي لا تملك بيانات المستخدم الكافية أو معيارًا نشطًا مناسبًا فيجب أن تبقى **INCOMPLETE** أو **NEEDS_REVIEW**.

## الملفات ذات الصلة

- `src/services/laboratoryVerification.ts`: محرك المقارنة المستقلة وفحص الوحدات والتتبّع.
- `src/services/laboratoryTestEngine.ts`: إدماج حالة التدقيق في سجل النتيجة.
- `src/types/laboratoryDomain.ts`: أنواع حالة التدقيق وربط المحقق المستقل.
- `src/__tests__/laboratory-verification.test.ts`: اختبارات المحرك الجديد والتكامل.

## References

[1]: https://github.com/snotlex/SnoLab "SnoLab source repository"
[2]: https://www.en-standard.eu/ "European standards catalogue reference"
