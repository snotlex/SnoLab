# مرجع تصميم تفعيل Atterberg وCBR في SnoLab

تاريخ المراجعة: 23 أكتوبر 2026. هذه المذكرة توثق نطاق المصادر العامة التي جرى التحقق منها لتوجيه محرك تشخيصي؛ وهي لا تستبدل نصوص المعايير الكاملة أو اعتماد المختبر.

## Atterberg: اختيار المرجع والإجراء

صفحة ASTM الحالية تعرض ASTM D4318-26 بصفته Active. نطاقه المنشور يغطي حد السيولة وحد اللدونة ودليل اللدونة. ويعرض للسيولة طريقة متعددة النقاط وطريقة نقطة واحدة، ويترك اختيار الطريقة للجهة الطالبة؛ وعند عدم تحديدها تكون المتعددة النقاط. كما يذكر أن PI مشتق من LL وPL، وأن الاختبار يخص الجزء المار من منخل 425 µm، مع بدائل لتحضير العينة [1]. لذلك لا يصح وصف التنفيذ كاختبار D4318 كامل إذا كان التطبيق يحسب من بيانات القياس فقط ولا يوثق التحضير والأجهزة والتحقق.

كان اسم NF P94-051 الظاهر في مخطط خصائص SnoLab ملغيًا، وتشير AFNOR إلى أنه استُبدل بـNF EN ISO 17892-12، إصدار يوليو 2018 والحالي في صفحتها. يغطي البديل تحديد حدّي السيولة واللدونة للتربة المعاد تشكيلها [2] [3]. لا ينبغي أن يبقى الوصف البرمجي العام `NF P94-051 / ASTM D4318` بلا إصدار؛ التطبيق لا يملك حاليًا ملف معيار/طريقة مسجلًا لهذين الاختبارين.

من جهة الكود، يوجد تعريف مخطط `GT_ATTERBERG`، كما توجد حقول مادة LL وPL وPI، لكن هذه الحقول بيانات نموذجية/افتراضية وليست خرجًا من تشغيل. الحساب الممكن للمحرك التشخيصي هو توثيق قراءات LL متعددة النقاط وقراءات PL المتكررة، ثم اشتقاق LL عند نقطة المنهج المختار، ومتوسط PL، وPI = LL − PL. يجب حفظ القياسات الأولية والمنهج وعينة التحضير، والإبقاء على الحالة Draft/NEEDS_REVIEW، دون تصنيف تربة أو إصدار قبول.

## CBR: اختيار المرجع والإجراء

ASTM D1883-21 معروض لدى ASTM بصفته Active ويغطي CBR للعينات المضغوطة مخبريًا. يبين نطاق ASTM أن حجم الحبيبات الأكبر من 19 mm قد يتطلب تعديلًا للتدرج، وأن اختيار ماء الدمك والكثافة الجافة مرتبطان بمتطلبات العميل ونتيجة اختبار الدمك، وأن العينات تُنقع قبل الاختراق ما لم يحدد العميل خلاف ذلك أو يثبت عدم تأثير النقع [4]. كما تعرض AFNOR NF P94-078 (إصدار مايو 1997) بصفته Current، ويذكر نطاقه CBR بعد النقع وCBR الفوري ومؤشر التحمل الفوري؛ لذا فالمرجع الفرنسي الموجود في الخصائص ليس ملغيًا في الصفحة التي فُحصت [5].

يعرّف دليل FHWA العام CBR كمؤشر تجريبي لمقاومة الاختراق ويؤكد حساسيته لحالة العينة والماء والكثافة؛ لذلك يجب توثيق ظروف التحضير والنقع وعدم التعامل معه كخاصية أساسية مستقلة أو قرار تصميم [6]. وتعرض قائمة تقييم فني منشورة لاختبار AASHTO T 193-13 النسب عند 2.54 و5.08 mm إلى الإجهادات المرجعية 1000 و1500 psi، مع إعادة الاختبار إذا تجاوزت نسبة 5.08 mm نسبة 2.54 mm [7]. هذه تفاصيل مرجع AASHTO المحدد، وليست إثباتًا بأن كل إصدار/طريقة ASTM أو NF مطابق حرفيًا؛ يجب أن يبقى الإجراء التشغيلي Draft حتى يثبت المختبر إعدادات طريقته. لا يجوز تعميم مدة نقع واحدة على كل ملفات SnoLab.

توصية التنفيذ هي تسجيل بيانات حمل/اختراق مصححة عند النقطتين المرجعيتين، مساحة المكبس أو إعداد الإجهاد المرجعي، حالة النقع ومدته، قراءة الانتفاخ وارتفاع العينة، وماء الدمك والكثافة وطريقة الدمك/ملفها. يعرض المحرك نسبتي CBR والانتفاخ منفصلة، ولا يختار قيمة وحيدة تلقائيًا عند تعارض القيم أو الحاجة إلى إعادة الاختبار. ولا يحدث مزامنة إلى `cbrValue` ولا PASS/FAIL من دون ملف معيار وقبول مشروع نشط ومراجع.

## وضع البيانات والتكامل في SnoLab

لا يحتوي المحرك الحالي على تعريف أو حساب أو واجهة أو اختبار خاص بـAtterberg أو CBR. القيم المزروعة التي تعرض LL=22 وPL=16 وPI=6 وCBR=45 تحمل `sourceType: typical` و`status: default_reference`، فلا تستخدم fixtures مرجعية للتحقق من الحساب ولا تحول إلى نتائج مخبرية. يمكن إعادة استخدام دورة GeoTech الحالية لحفظ `rawData` و`calculationTrace` و`calculationDetails` في جلسة وتقرير JSON، مع حواجز المجال التي تمنع الاعتماد والمزامنة غير المصرح بها.

## References

[1]: https://www.astm.org/d4318-26.html "ASTM D4318-26 Standard Test Methods for Liquid Limit Plastic Limit and Plasticity Index of Soils"
[2]: https://www.boutique.afnor.org/en-gb/standard/nf-p94051/soil-inverstigation-and-testing-determination-of-atterbergs-limits-liquid-l/fa020765/11080 "AFNOR NF P94-051 Cancelled Standard"
[3]: https://www.boutique.afnor.org/en-gb/standard/nf-en-iso-1789212/geotechnical-investigation-and-testing-laboratory-testing-of-soil-part-12-d/fa187930/84021 "AFNOR NF EN ISO 17892-12 Current Standard"
[4]: https://www.astm.org/d1883-21.html "ASTM D1883-21 Standard Test Method for California Bearing Ratio of Laboratory-Compacted Soils"
[5]: https://www.boutique.afnor.org/en-gb/standard/nf-p94078/soils-investigation-and-tests-cbr-after-immersion-immediate-cbr-immediate-b/fa042054/11055 "AFNOR NF P94-078 Current Standard"
[6]: https://www.fhwa.dot.gov/engineering/geotech/pubs/05037/05b.cfm "FHWA Geotechnical Aspects of Pavements Reference Manual CBR"
[7]: https://www.nicet.org/nicetorg/assets/file/public/performance_examination_checklists/soils/aashto_t_193-13.pdf "NICET Performance Examination Checklist for AASHTO T 193-13"


## تفاصيل حساب LL وPI ونتيجة NP من إجراءات منشورة

إجراء California Test 204 يصف منحنى السيولة كخط شبه لوغاريتمي يربط محتوى الماء بعدد الضربات، ويأخذ LL عند تقاطع المنحنى مع 25 ضربة. كما يطلب ثلاث نقاط أو أكثر ضمن نطاقات ضربات متداخلة في طريقته، ويربط محتوى الماء بكتلة الماء على كتلة التربة الجافة [8]. وتؤكد نسخة WSDOT المنشورة في يناير 2026 أن طريقة A متعددة النقاط ترسم ثلاثة نقاط أو أكثر على المحور اللوغاريتمي لعدد الضربات، ثم تستخرج محتوى الماء عند 25 ضربة؛ إلا أن WSDOT يعلن أنه لا يعترف بهذه الطريقة ضمن إجراءه المحلي ويستخدم طريقة B، ما يؤكد ضرورة حفظ اختيار الطريقة بالمختبر لا تعميمها [9].

دليل NYSDOT المنشور يذكر متوسط نتيجتي PL، ويحسب PI = LL − PL؛ كما يوصي بالإبلاغ عن NP إذا تعذر تحديد LL أو PL أو كان PL مساويًا أو أكبر من LL [10]. هذا مصدر إجرائي لجهة محددة، لذا يدعم مسارًا تشخيصيًا مع توثيق حالة القياس، ولا يمنحنا وحده ادعاء امتثال معياري عام.

[8]: https://dot.ca.gov/-/media/dot-media/programs/engineering/documents/californiatestmethods-ctm/ctm-204-a11y.pdf "California Test 204 Liquid Limit Plastic Limit and Plasticity Index"
[9]: https://wsdot.wa.gov/publications/manuals/fulltext/M46-01/t89.pdf "WSDOT Materials Manual AASHTO T 89 Determining the Liquid Limit of Soils"
[10]: https://www.dot.ny.gov/divisions/engineering/technical-services/technical-services-repository/GTM-7b.pdf "NYSDOT Geotechnical Test Method for Liquid and Plastic Limits"
