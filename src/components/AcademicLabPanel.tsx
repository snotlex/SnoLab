import React, { useState, useMemo } from "react";
import { 
  FlaskConical, 
  Search, 
  ExternalLink, 
  FileText, 
  GraduationCap, 
  Layers, 
  Sliders, 
  Compass, 
  Activity, 
  HardHat, 
  CheckCircle2, 
  Flame, 
  Sparkles, 
  Info,
  Calendar
} from "lucide-react";

interface TestItem {
  id: string;
  en: string;
  ar: string;
  fr: string;
  searchQuery?: string; // Optional custom search override
}

interface LabCategory {
  id: string;
  en: string;
  ar: string;
  fr: string;
  descriptionEn: string;
  descriptionAr: string;
  descriptionFr: string;
  colorClass: string;
  bgGradClass: string;
  borderClass: string;
  icon: React.ReactNode;
  tests: TestItem[];
}

interface AcademicLabPanelProps {
  language: "ar" | "fr" | "en";
  themeMode: "light" | "dark" | "system";
}

export const AcademicLabPanel: React.FC<AcademicLabPanelProps> = ({ language, themeMode }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const labsData = useMemo<LabCategory[]>(() => [
    {
      id: "concrete",
      en: "Concrete Laboratory",
      ar: "مخبر الخرسانة",
      fr: "Laboratoire de Béton",
      descriptionEn: "Testing of fresh, mechanical and non-destructive properties of structural concrete.",
      descriptionAr: "دراسة وتجريب الخواص الفيزيائية والميكانيكية للخرسانة اللدنة والمتصلبة والفحوصات اللاإتلافية.",
      descriptionFr: "Essais sur béton frais, durci, résistances mécaniques et auscultation non destructive.",
      colorClass: "text-emerald-500 border-emerald-500",
      bgGradClass: "from-emerald-500/10 to-teal-500/5",
      borderClass: "border-emerald-200 dark:border-emerald-800/40",
      icon: <Layers className="w-5 h-5" />,
      tests: [
        { id: "c1", en: "Slump Test", ar: "تجربة الهبوط (قمع أبرامز)", fr: "Essai d’affaissement (Cône d'Abrams)" },
        { id: "c2", en: "Compaction Factor Test", ar: "تجربة عامل الرص", fr: "Essai du facteur de compactage" },
        { id: "c3", en: "Vee Bee Test", ar: "تجربة في-بي الميكانيكية للتشغيلية", fr: "Essai de Consistance Vee-Bee" },
        { id: "c4", en: "Flow Table Test", ar: "اختبار طاولة الانسياب", fr: "Essai de table d'étalement" },
        { id: "c5", en: "Compression Test", ar: "اختبار مقاومة الضغط للخرسانة", fr: "Essai de compression sur béton" },
        { id: "c6", en: "Splitting Tensile Test", ar: "اختبار الانفصام بالشد غير المباشر", fr: "Essai de traction par fendage (Brésilien)" },
        { id: "c7", en: "Flexural Strength Test", ar: "اختبار قوة الانحناء للعوارض الخرسانية", fr: "Essai de résistance à la flexion" },
        { id: "c8", en: "Density Test", ar: "قياس خرسانة الكثافة والحجم", fr: "Essai de masse volumique du béton" },
        { id: "c9", en: "Air Content Test", ar: "اختبار محتوى الهواء المحبوس", fr: "Essai de teneur en air" },
        { id: "c10", en: "Water Absorption Test", ar: "اختبار امتصاص الخرسانة للماء", fr: "Essai d'absorption d'eau du béton" },
        { id: "c11", en: "Permeability Test", ar: "اختبار نفاذية الخرسانة تحت الضغط", fr: "Essai de perméabilité du béton" },
        { id: "c12", en: "Rebound Hammer Test", ar: "اختبار مطرقة شميدت الارتدادية", fr: "Essai d'auscultation au scléromètre (Schmidt)" },
        { id: "c13", en: "Ultrasonic Pulse Velocity Test", ar: "اختبار سرعة النبضات فوق الصوتية (UPV)", fr: "Essai d'auscultation sonique (Ultrasons)" },
        { id: "c14", en: "Carbonation Test", ar: "اختبار عمق الكربنة كيميائياً", fr: "Essai de carbonatation du béton" },
        { id: "c15", en: "Core Test", ar: "قالب اختبار استخراج اللب الخرساني", fr: "Essai de carottage sur béton" },
        { id: "c16", en: "Shrinkage Test", ar: "اختبار انكماش الخرسانة الطولي", fr: "Essai de retrait du béton" },
        { id: "c17", en: "Creep Test", ar: "اختبار زحف الخرسانة تحت الأحمال", fr: "Essai de fluage du béton" }
      ]
    },
    {
      id: "cement",
      en: "Cement Laboratory",
      ar: "مخبر الإسمنت",
      fr: "Laboratoire de Ciment",
      descriptionEn: "Chemical characterization, setting kinetics and mechanical standards for cement binders.",
      descriptionAr: "دراسة كفاءة التماسك، زمن الشك الكيميائي، النعومة والمقاومة البنيوية لعجينة الإسمنت.",
      descriptionFr: "Caractérisation chimique, temps de prise Vicat et essais mécaniques sur mortier normal.",
      colorClass: "text-amber-500 border-amber-505",
      bgGradClass: "from-amber-500/10 to-orange-500/5",
      borderClass: "border-amber-200 dark:border-amber-800/40",
      icon: <Flame className="w-5 h-5" />,
      tests: [
        { id: "cem1", en: "Fineness Test", ar: "اختبار نعومة الإسمنت (جهاز بلين)", fr: "Essai de finesse du ciment (Blaine)" },
        { id: "cem2", en: "Specific Gravity Test", ar: "اختبار الوزن النوعي للإسمنت", fr: "Essai de masse volumique du ciment" },
        { id: "cem3", en: "Standard Consistency Test", ar: "اختبار القوام القياسي للإسمنت (جهاز فيكات)", fr: "Essai de consistance normale de pâte (Vicat)" },
        { id: "cem4", en: "Initial Setting Time", ar: "زمن الشك الابتدائي للخلطة الإسمنتية", fr: "Temps de prise initial du ciment" },
        { id: "cem5", en: "Final Setting Time", ar: "زمن الشك النهائي للإسمنت", fr: "Temps de prise final du ciment" },
        { id: "cem6", en: "Soundness Test", ar: "اختبار ثبات وسلامة الإسمنت معملياً", fr: "Essai de stabilité du ciment" },
        { id: "cem7", en: "Le Chatelier Test", ar: "اختبار تمدد الإسمنت بجهاز لوشاتيليه", fr: "Essai d'expansion Le Chatelier" },
        { id: "cem8", en: "Compressive Strength Test", ar: "اختبار مقاومة الضغط لمونة الإسمنت القياسية", fr: "Essai de résistance à la compression du mortier" },
        { id: "cem9", en: "Tensile Strength Test", ar: "اختبار مقاومة الشد المباشر لملاط الإسمنت", fr: "Essai de traction sur mortier" },
        { id: "cem15", en: "Heat of Hydration Test", ar: "اختبار حرارة إماهة الإسمنت وتطوره الحراري", fr: "Essai de chaleur d'hydratation du ciment" }
      ]
    },
    {
      id: "aggregate",
      en: "Aggregates Laboratory",
      ar: "مخبر الركام",
      fr: "Laboratoire des Granulats",
      descriptionEn: "Sieve grading curves, physical density and mechanical fragmentation / wear resistance of stones.",
      descriptionAr: "ضبط وتحليل المنحنيات الحبيبية للرمل والحصى، وتحديد مقاومة الكشط والمكافئ الرملي.",
      descriptionFr: "Analyses granulométriques, équivalent de sable, forme et résistances Los Angeles / Micro-Deval.",
      colorClass: "text-blue-500 border-blue-500",
      bgGradClass: "from-blue-500/10 to-sky-500/5",
      borderClass: "border-blue-200 dark:border-blue-800/40",
      icon: <Sliders className="w-5 h-5" />,
      tests: [
        { id: "a1", en: "Sieve Analysis", ar: "اختبار التحليل المنخلي (الغربلة وتوزيع التدرج)", fr: "Analyse granulométrique par tamisage" },
        { id: "a2", en: "Fineness Modulus", ar: "حساب معامل نعومة الركام للتصميم الخرساني", fr: "Calcul du module de finesse" },
        { id: "a3", en: "Specific Gravity", ar: "الوزن النوعي والكثافة الحبيبية للركام", fr: "Masse volumique absolue et relative" },
        { id: "a4", en: "Water Absorption", ar: "اختبار امتصاص الركام للماء ونسب التشبع", fr: "Essai d'absorption d'eau des granulats" },
        { id: "a5", en: "Bulk Density", ar: "اختبار الوزن الحجمي الظاهري (المكدس)", fr: "Masse volumique apparente des granulats" },
        { id: "a6", en: "Voids Content", ar: "حساب نسبة الفراغات بين حبيبات الركام المتراصة", fr: "Détermination du pourcentage de vides" },
        { id: "a7", en: "Los Angeles Test", ar: "اختبار لوس أنجلوس للتآكل والاهتراء الميكانيكي", fr: "Essai Los Angeles (Résistance à la fragmentation)" },
        { id: "a8", en: "Aggregate Crushing Value", ar: "اختبار قيمة سحق الركام تحت أحمال المكبس (ACV)", fr: "Essai d'écrasement des granulats" },
        { id: "a9", en: "Aggregate Impact Value", ar: "اختبار الصدم الميكانيكي ومقاومة التكسير الكلي (AIV)", fr: "Essai de résistance aux chocs" },
        { id: "a10", en: "Flakiness Index", ar: "اختبار معامل تفلطح حبيبات الحصى المقاسة", fr: "Essai d’aplatissement des granulats" },
        { id: "a11", en: "Elongation Index", ar: "اختبار معامل استطالة حبيبات الركام الخشن", fr: "Essai d’allongement des granulats" },
        { id: "a12", en: "Shape Index", ar: "معامل جودة شكل الحصمة وهيكليتها الهندسي", fr: "Indice de forme des granulats" },
        { id: "a13", en: "Sand Equivalent Test", ar: "اختبار المكافئ الرملي ونقاء الرمل من الشوائب الطينية", fr: "Essai d'équivalent de sable (ES)" }
      ]
    },
    {
      id: "soil",
      en: "Soil Mechanics Laboratory",
      ar: "مخبر التربة",
      fr: "Laboratoire Sols (Géotechnique)",
      descriptionEn: "Atterberg plasticity, compaction energy, CBR bearing capacity and consolidated shear boundaries.",
      descriptionAr: "دراسة السلوك الهيدرو-ميكانيكي للتربة، حدود اللدونة والاتساق، ورص بروكتور وصمود التربة.",
      descriptionFr: "Essais Proctor, limites d'Atterberg, portance CBR, essais triaxiaux et œdométriques.",
      colorClass: "text-rose-500 border-rose-500",
      bgGradClass: "from-rose-500/10 to-amber-500/5",
      borderClass: "border-rose-200 dark:border-rose-800/40",
      icon: <Compass className="w-5 h-5" />,
      tests: [
        { id: "s1", en: "Water Content Test", ar: "اختبار تحديد المحتوى الرطوبي للتربة بالتجفيف", fr: "Teneur en eau d'un sol par étuvage" },
        { id: "s2", en: "Specific Gravity Test", ar: "اختبار الكثافة والوزن النوعي لجزيئات التربة", fr: "Essai de masse volumique des grains solides (Pycnomètre)" },
        { id: "s3", en: "Grain Size Analysis", ar: "التحليل الحبيبي الميكانيكي وتوزيع التربة بالغربلة", fr: "Analyse granulométrique des sols par tamisage" },
        { id: "s4", en: "Hydrometer Test", ar: "اختبار الهيدروميتر (التحليل بالترسيب الناعم للغضار)", fr: "Analyse granulométrique par sédimentation" },
        { id: "s5", en: "Atterberg Limits", ar: "اختبار حدود أتربرغ لدونة التربة وقوام المكافئ (كازاغراندي)", fr: "Limites d'Atterberg (Limite de liquidité et plasticité)" },
        { id: "s6", en: "Standard Proctor Test", ar: "اختبار بروكتور العادي لرص عينات التربة وحساب كثافتها الطردية", fr: "Essai Proctor Normal" },
        { id: "s7", en: "Modified Proctor Test", ar: "اختبار بروكتور المعدل للأحمال العيارية الكبيرة بالمطارات والطرق", fr: "Essai Proctor Modifié" },
        { id: "s8", en: "CBR Test", ar: "اختبار نسبة تحمل كاليفورنيا لطبقات السطح والردم (C.B.R)", fr: "Essai C.B.R (California Bearing Ratio)" },
        { id: "s9", en: "Direct Shear Test", ar: "اختبار القص المباشر لتحديد قوة التماسك وزاوية الاحتكاك (Casagrande)", fr: "Essai de cisaillement direct à la boîte" },
        { id: "s10", en: "Triaxial Test", ar: "اختبار الضغط ثلاثي المحاور للتربة تحت الضغوط الجانبية", fr: "Essai de compression triaxiale" },
        { id: "s11", en: "Permeability Test", ar: "اختبار ممانعة نفاذية التربة وتسرب المياه (أجهزة النفاذية وثابتة القوام)", fr: "Essai de perméabilité d'un sol (Darcy)" },
        { id: "s12", en: "Consolidation Test", ar: "اختبار التصلب والانضغاطية للتربة الناعمة بجهاز الأودوميتر", fr: "Essai d’œdomètre (Consolidation unilatérale)" },
        { id: "s13", en: "Plate Load Test", ar: "اختبار تحميل اللوح الميداني المباشر لتحديد قدرة تحمل الأساسات", fr: "Essai de plaque sur chantier" },
        { id: "s14", en: "Field Density Test", ar: "اختبار الكثافة الحقلية بالموقع بطريقتي مخروط الرمل أو القمع", fr: "Essai de densité in-situ (Cône de sable)" }
      ]
    },
    {
      id: "roads",
      en: "Highways Laboratory",
      ar: "مخبر الطرق",
      fr: "Laboratoire de Routes",
      descriptionEn: "Bitumen penetration, binder viscosity, Marshall asphalt stability and wheel-tracking design.",
      descriptionAr: "فحص وتصميم الخلطات الحلزونية البيتومينية، ثبات مارشال، ونفاذية ونقطة ليونة الإسفلت.",
      descriptionFr: "Essais sur bitume, pénétrabilité, point de ramollissement TBA et formulation enrobés Marshall.",
      colorClass: "text-red-500 border-red-500",
      bgGradClass: "from-red-500/10 to-rose-500/5",
      borderClass: "border-red-200 dark:border-red-800/40",
      icon: <HardHat className="w-5 h-5" />,
      tests: [
        { id: "r1", en: "Marshall Stability Test", ar: "اختبار مارشال لثبات وزحف المزيج الإسفلتي الساحلي الأسطواني", fr: "Essai de stabilité et fluage Marshall" },
        { id: "r2", en: "Bitumen Penetration Test", ar: "اختبار غرز ونفاذية البيتومين الإسفلتي باستخدام الإبرة العيارية", fr: "Essai de pénétration à l'aiguille du bitume" },
        { id: "r3", en: "Softening Point Test", ar: "اختبار نقطة الليونة للبيتومين (الحلقة والكرة TBA)", fr: "Essai de point de ramollissement bille et anneau (TBA)" },
        { id: "r4", en: "Ductility Test", ar: "اختبار ممطولية ومطاطية المواد البيتومينية وعقد الشد", fr: "Essai de ductilité des bitumes" },
        { id: "r5", en: "Viscosity Test", ar: "اختبار لزوجة وسيلان الإسفلت المسال والبيتومين بجهاز المفرغ", fr: "Essai de viscosité du bitume (Saybolt)" },
        { id: "r6", en: "Flash Point Test", ar: "اختبار تحديد نقطة الوميض للمنتجات البيتومينية البترولية الحرارية", fr: "Essai de point d’éclair (Cleveland)" },
        { id: "r7", en: "Fire Point Test", ar: "اختبار حدود نقطة الاحتراق للإسفلت وحمايته من الاشتعال الفعلي", fr: "Essai de point d’inflammation" },
        { id: "r8", en: "Asphalt Density Test", ar: "قياس الوزن النوعي والوزن الحجمي للخلائط الإسفلتية المدموكة موقعياً", fr: "Masse volumique des éprouvettes enrobées" },
        { id: "r9", en: "Bitumen Extraction Test", ar: "اختبار استخلاص وفصل محتوى الأسفلت من العينات البيتومينية المقلوعة", fr: "Essai d'extraction du bitume et teneur en liant" },
        { id: "r10", en: "Stripping Test", ar: "اختبار انفصال وتقشر الإسفلت بفعل الرطوبة وممانعة الالتصاق بالحصمة", fr: "Essai d'adhésivité globale bitume-granulat" },
        { id: "r11", en: "Wheel Tracking Test", ar: "اختبار تتبع العجلات ومقاومة التخدد الطولي للطرق المرنة بالخلطة", fr: "Essai d'orniérage des enrobés bitumineux" }
      ]
    },
    {
      id: "materials",
      en: "Engineering Materials Laboratory",
      ar: "مخبر المواد الهندسية",
      fr: "Laboratoire d'Essais des Matériaux",
      descriptionEn: "Charpy impact energy, Rockwell hardness, structural tension and steel mechanical failures.",
      descriptionAr: "فحوصات الخصائص الأساسية للمعادن والحديد، الشد المحوري، الصدم والصلادة الموضعية وتأثير الكلال.",
      descriptionFr: "Essais mécaniques universels de traction sur acier, dureté Brinell, flexion et résilience Charpy.",
      colorClass: "text-violet-500 border-violet-500",
      bgGradClass: "from-violet-500/10 to-indigo-500/5",
      borderClass: "border-violet-200 dark:border-violet-800/40",
      icon: <Activity className="w-5 h-5" />,
      tests: [
        { id: "m1", en: "Tensile Test", ar: "اختبار الشد الميكانيكي لحديد التسليح ومواد المعادن لتحديد حد الخضوع", fr: "Essai de traction mécanique de l'acier" },
        { id: "m2", en: "Compression Test", ar: "اختبار الضغط للأخشاب ومكعبات المعادن ومواد البناء الهندسية", fr: "Essai de compression des matériaux métalliques" },
        { id: "m3", en: "Hardness Test", ar: "اختبار هضم الصلادة للمواد (طرق برينل، فيكرز، أو روكويل ميكانيكياً)", fr: "Essai de dureté (Brinell, Vickers, Rockwell)" },
        { id: "m4", en: "Impact Test", ar: "اختبار متانة الصدم وصمود صب المواد ومميز العينات المحززة (Charpy)", fr: "Essai de résilience Charpy aux chocs" },
        { id: "m5", en: "Bending Test", ar: "اختبار الانحناء والانعطاف التراكمي للتسليح ومقاطع المقاومة", fr: "Essai de pliage mécanique" },
        { id: "m6", en: "Torsion Test", ar: "اختبار التواء عينات المحاور والقضبان لتحديد معامل الجساءة والامتطاد", fr: "Essai de torsion des matériaux" },
        { id: "m7", en: "Fatigue Test", ar: "اختبار الكلال ومستويات الصبر الميكانيكي تحت الحمولات الترددية العنيفة", fr: "Essai de fatigue mécanique" },
        { id: "m8", en: "Shear Test", ar: "اختبار ممانعة ومقاطع قوى القص المباشر للمعادن والمسامير العيارية", fr: "Essai de cisaillement transversal" },
        { id: "m9", en: "Weld Test", ar: "اختبار فحص جودة اللحام والعيوب الهيكلية غير مدمر باستخدام الموجات والصبغة", fr: "Essai non destructif et contrôle des soudures" }
      ]
    }
  ], [language]);

  // Handle opening Google Search
  const handleTestClick = (test: TestItem) => {
    // Generate clean Google Search URL based on active language
    const queryTerm = language === "ar" 
      ? `تجربة مخبرية ${test.ar}` 
      : language === "fr" 
        ? `TP ${test.fr}` 
        : `TP ${test.en}`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(queryTerm)}`;
    window.open(searchUrl, "_blank", "noopener,noreferrer");
  };

  // Live filter logic
  const filteredLabs = useMemo(() => {
    return labsData.map(lab => {
      // Filter tests within lab
      const matchedTests = lab.tests.filter(test => {
        const query = searchTerm.toLowerCase().trim();
        if (!query) return true;
        return (
          test.en.toLowerCase().includes(query) ||
          test.ar.toLowerCase().includes(query) ||
          test.fr.toLowerCase().includes(query)
        );
      });

      return {
        ...lab,
        tests: matchedTests
      };
    }).filter(lab => {
      // Handle category tab selection AND ensure it has tests matching the search
      const matchesCategory = selectedCategory === "all" || lab.id === selectedCategory;
      const matchesSearchCount = searchTerm.trim() === "" || lab.tests.length > 0;
      return matchesCategory && matchesSearchCount;
    });
  }, [labsData, searchTerm, selectedCategory]);

  // Aggregate stats
  const totalTestsCount = useMemo(() => {
    return labsData.reduce((acc, curr) => acc + curr.tests.length, 0);
  }, [labsData]);

  const matchedTestsCount = useMemo(() => {
    return filteredLabs.reduce((acc, curr) => acc + curr.tests.length, 0);
  }, [filteredLabs]);

  // Multi-lingual labels
  const uiTexts = {
    title: {
      ar: "مختبر الهندسة المدنية الأكاديمي",
      fr: "Laboratoire Académique de Génie Civil",
      en: "Civil Engineering Academic Lab"
    },
    subtitle: {
      ar: "فهرس أكاديمي شامل يضم أشهر التجارب المخبرية (TP) في الهندسة المدنية. اضغط على أي تجربة لفتح نتائج مراجع Google فورياً وفي تبويب مستقل.",
      fr: "Index académique complet regroupant les travaux pratiques (TP) les plus utilisés en génie civil. Cliquez sur un TP pour ouvrir instantanément ses ressources sur Google.",
      en: "A comprehensive academic index cataloging standard laboratory tests (TP) in civil engineering. Click on any test to open search results on Google in a new tab."
    },
    searchPlaceholder: {
      ar: "ابحث عن أي تجربة (مثال: Proctor, Slump, Sieve)...",
      fr: "Rechercher un TP (ex: Proctor, Affaissement, Tamisage)...",
      en: "Search any laboratory test (e.g. Proctor, Slump, Sieve)..."
    },
    showAll: {
      ar: "عرض جميع المخابر",
      fr: "Tous les laboratoires",
      en: "All Laboratories"
    },
    searchResultBadge: {
      ar: (count: number) => `تم العثور على ${count} تجربة مخبرية متطابقة`,
      fr: (count: number) => `${count} TP trouvé(s)`,
      en: (count: number) => `${count} laboratory experiment(s) matched`
    },
    totalCataloged: {
      ar: `المكتبة تضم ${totalTestsCount} تجربة ريادية وثقيلة للطلاب والباحثين`,
      fr: `Le catalogue comprend ${totalTestsCount} essais fondamentaux`,
      en: `The library archives ${totalTestsCount} fundamental civil engineering TPs`
    },
    tpHint: {
      ar: "فتح مراجع البحث",
      fr: "Rechercher TP",
      en: "Search TP"
    },
    academicGuidance: {
      ar: "إرشاد أكاديمي:",
      fr: "Guide Académique :",
      en: "Academic Guidance:"
    },
    guidanceText: {
      ar: "هذا الدليل الفهرسي مبني كلياً لمساعدة الطلبة والباحثين الجزائريين والعرب على التوجه المنهجي ومراجعة تقارير الأعمال التطبيقية معملياً. يتم توليد الكيانات البحثية بدقة متوالية لتفادي ضياع الوقت.",
      fr: "Cet index interactif est conçu pour assister les étudiants et ingénieurs dans la rédaction de leurs rapports de TP. Les requêtes de recherche ciblent spécifiquement la littérature académique officielle.",
      en: "This digital catalog accelerates student reports preparation and laboratory validation. Search queries are tailored with proper academic prefixes to retrieve technical guides, templates and standard calculations."
    }
  };

  return (
    <div className="space-y-6 text-right" style={{ direction: language === "ar" ? "rtl" : "ltr" }}>
      
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-violet-600/10 via-blue-600/5 to-transparent border border-violet-200/50 dark:border-violet-855/35 rounded-2xl p-6 shadow-sm relative overflow-hidden" id="academicLabHeader">
        <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full bg-violet-600/5 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-blue-500/5 blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border border-violet-200/50 dark:border-violet-800/40 ${language === "ar" ? "flex-row" : "flex-row-reverse"}`}>
              <GraduationCap className="w-4 h-4" />
              <span>{language === "ar" ? "البوابة الأكاديمية والبحثية للطلاب" : language === "fr" ? "Portail Académique & Recherche" : "Academic & Research Portal"}</span>
            </div>
            
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight font-sans tracking-tight">
              {uiTexts.title[language]}
            </h2>
            
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-sans font-medium">
              {uiTexts.subtitle[language]}
            </p>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 px-4 py-3.5 rounded-xl border border-slate-205 dark:border-slate-800/80 shrink-0 text-center shadow-xs">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-bold mb-0.5 uppercase tracking-wider font-sans">
              {language === "ar" ? "إجمالي التجارب النشطة" : language === "fr" ? "Total TPs Répertoriés" : "Total Cataloged TPs"}
            </span>
            <span className="text-3xl font-black text-violet-600 dark:text-violet-400 font-mono tracking-tight block">
              {totalTestsCount}
            </span>
            <span className="text-[9px] text-slate-500 font-semibold dark:text-slate-400 block mt-1">
              {language === "ar" ? "موزعة عبر 6 تخصصات فرعية" : language === "fr" ? "Sur 6 laboratoires" : "Across 6 divisions"}
            </span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR BLOCK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center" id="academicLabSearchBlock">
        
        {/* Search Input Box */}
        <div className="relative lg:col-span-4 w-full" style={{ direction: "rtl" }}>
          <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={uiTexts.searchPlaceholder[language]}
            className="w-full text-xs font-semibold pr-10 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 dark:focus:ring-violet-500/20 shadow-xs transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 left-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white text-[10px] font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Categories Tab selectors */}
        <div className="lg:col-span-8 flex flex-wrap gap-1.5 items-center lg:justify-start" style={{ direction: language === "ar" ? "rtl" : "ltr" }}>
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === "all"
                ? "bg-violet-600 text-white shadow-md shadow-violet-500/10"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850"
            }`}
          >
            {uiTexts.showAll[language]}
          </button>

          {labsData.map(lab => (
            <button
              key={lab.id}
              onClick={() => setSelectedCategory(lab.id)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === lab.id
                  ? "bg-violet-600 text-white shadow-md shadow-violet-500/10"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850"
              }`}
            >
              <span className={selectedCategory === lab.id ? "text-white" : "text-slate-400"}>
                {lab.id === "concrete" && <Layers className="w-3.5 h-3.5" />}
                {lab.id === "cement" && <Flame className="w-3.5 h-3.5" />}
                {lab.id === "aggregate" && <Sliders className="w-3.5 h-3.5" />}
                {lab.id === "soil" && <Compass className="w-3.5 h-3.5" />}
                {lab.id === "roads" && <HardHat className="w-3.5 h-3.5" />}
                {lab.id === "materials" && <Activity className="w-3.5 h-3.5" />}
              </span>
              <span>{lab[language]}</span>
            </button>
          ))}
        </div>

      </div>

      {/* MATCH COUNT STATUS BADGE */}
      {(searchTerm || selectedCategory !== "all") && (
        <div className="flex items-center gap-2 justify-start py-0.5 text-xs font-bold text-slate-500 leading-none">
          <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse"></span>
          <span>{uiTexts.searchResultBadge[language](matchedTestsCount)}</span>
          {searchTerm && (
            <span className="text-slate-400 font-sans font-normal text-[11px] bg-slate-100 dark:bg-slate-800/40 px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-slate-705">
              "{searchTerm}"
            </span>
          )}
        </div>
      )}

      {/* LABS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" id="academicLabCardsGrid">
        {filteredLabs.length > 0 ? (
          filteredLabs.map((lab) => (
            <div
              key={lab.id}
              className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xs overflow-hidden flex flex-col transition-all hover:shadow-lg hover:border-violet-500/30 group duration-300`}
            >
              {/* Card top gradient band depending on category */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${
                lab.id === "concrete" ? "from-emerald-400 to-teal-500" :
                lab.id === "cement" ? "from-amber-400 to-orange-500" :
                lab.id === "aggregate" ? "from-blue-400 to-sky-500" :
                lab.id === "soil" ? "from-rose-400 to-amber-500" :
                lab.id === "roads" ? "from-red-400 to-rose-500" :
                "from-violet-400 to-indigo-500"
              }`} />

              {/* Head compartment */}
              <div className="p-4 border-b border-rose-100/50 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/40">
                <div className={`flex items-center gap-2.5 justify-start ${language === "ar" ? "flex-row" : "flex-row-reverse"}`}>
                  <div className={`p-2 rounded-xl border shrink-0 bg-white dark:bg-slate-900 ${
                    lab.id === "concrete" ? "text-emerald-500 border-emerald-100 dark:border-emerald-950" :
                    lab.id === "cement" ? "text-amber-505 border-amber-100 dark:border-amber-950" :
                    lab.id === "aggregate" ? "text-blue-500 border-blue-100 dark:border-blue-950" :
                    lab.id === "soil" ? "text-rose-500 border-rose-100 dark:border-rose-950" :
                    lab.id === "roads" ? "text-red-500 border-red-100 dark:border-red-950" :
                    "text-violet-500 border-violet-100 dark:border-violet-950"
                  }`}>
                    {lab.icon}
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <h3 className="text-md font-black text-slate-800 dark:text-slate-100 group-hover:text-violet-500 transition-colors font-sans truncate">
                      {lab[language]}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold font-mono tracking-wider truncate">
                      {lab.en.toUpperCase()}
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed text-right">
                  {lab[`description${language.charAt(0).toUpperCase() + language.slice(1)}` as keyof LabCategory] as string}
                </p>
              </div>

              {/* TPs sublist */}
              <div className="p-2.5 flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-y-auto max-h-[350px]" style={{ direction: "rtl" }}>
                {lab.tests.length > 0 ? (
                  lab.tests.map((test) => (
                    <div
                      key={test.id}
                      onClick={() => handleTestClick(test)}
                      className="group/item flex items-center justify-between p-2.5 rounded-xl hover:bg-violet-50/40 dark:hover:bg-violet-950/10 cursor-pointer transition-all gap-3 text-right"
                    >
                      {/* Left side button (Search Google trigger) */}
                      <div className="shrink-0 flex items-center">
                        <span className="opacity-0 group-hover/item:opacity-100 transition-opacity text-[9.5px] font-black font-sans text-violet-600 dark:text-violet-400 ml-1.5 hidden sm:block">
                          {uiTexts.tpHint[language]}
                        </span>
                        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-400 group-hover/item:text-violet-500 group-hover/item:bg-violet-100/50 group-hover/item:border-violet-300 dark:group-hover/item:bg-violet-950/40 dark:group-hover/item:border-violet-800/40 transition-all shadow-xs">
                          <Search className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      {/* Right side test labels */}
                      <div className="flex-1 min-w-0 pr-1 text-right">
                        <h4 className="text-xs font-bold text-slate-750 dark:text-slate-205 group-hover/item:text-slate-950 dark:group-hover/item:text-white transition-colors truncate">
                          {test.en}
                        </h4>
                        
                        {/* Selected translation matching language view */}
                        {(language === "ar" || language === "fr") && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-450 truncate font-medium mt-0.5">
                            {language === "ar" ? test.ar : test.fr}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    {language === "ar" ? "لا توجد تجارب تطابق البحث" : language === "fr" ? "Aucun TP trouvé" : "No TPs match search"}
                  </div>
                )}
              </div>

              {/* Mini foot tracker stats */}
              <div className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-505 font-bold font-mono uppercase flex justify-between tracking-wider">
                <span>Total Experiments</span>
                <span className="text-slate-600 dark:text-violet-400 font-black">{lab.tests.length} TPs</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-12 text-center" id="academicLabEmptyState">
            <FlaskConical className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3 animate-bounce" />
            <h3 className="text-sm font-black text-slate-700 dark:text-slate-350">
              {language === "ar" ? "عذراً، لم نعثر على أي تجربة مطابقة" : language === "fr" ? "Désolé, aucun TP correspondant trouvé" : "Sorry, no laboratory tests matched your filters"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {language === "ar" ? "حاول تغيير كلمة البحث أو الضغط على زر تصفية جميع المخابر" : language === "fr" ? "Essayez d'ajuster vos termes de recherche ou de réinitialiser le filtre." : "Try adjusting your search terms or resetting the filter category."}
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
              className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-750 text-white font-bold rounded-xl text-xs transition-colors shrink-0"
            >
              {language === "ar" ? "إعادة تعيين البحث" : language === "fr" ? "Réinitialiser" : "Reset Filter Search"}
            </button>
          </div>
        )}
      </div>

      {/* FOOTER DIRECTORY COMPLEMENTARY ADVICE BOARD */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 flex gap-3.5 items-start text-right" id="academicLabFooterGuidance" style={{ direction: "rtl" }}>
        <div className="p-2.5 bg-violet-500/10 text-violet-500 dark:text-violet-405 border border-violet-200/40 dark:border-violet-850/40 rounded-xl shrink-0">
          <Info className="w-5 h-5 shrink-0" />
        </div>
        <div className="space-y-1 text-xs">
          <strong className="text-slate-800 dark:text-slate-205 font-black block">
            {uiTexts.academicGuidance[language]}
          </strong>
          <p className="text-slate-500 dark:text-slate-400 leading-normal text-[11px] font-medium font-sans">
            {uiTexts.guidanceText[language]}
          </p>
        </div>
      </div>

    </div>
  );
};
