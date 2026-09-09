import json, os

schemas_dict = {
  "cement": [
    ("cementClass", "PROP_CEM_CLASS", "نوع ورتبة الإسمنت القياسية", "Type et Classe de Ciment", "Cement Type & Class", "", "select", "composition", "EN 197-1 / ASTM C150", "CEM I 42.5", [
      ("CEM I 42.5", "CEM I 42.5 (بورتلاندي عادي)", "CEM I 42.5", "CEM I 42.5"),
      ("CEM I 52.5", "CEM I 52.5 (عالي المقاومة المبكرة)", "CEM I 52.5", "CEM I 52.5"),
      ("CEM II/A 42.5", "CEM II/A 42.5 (مركب نوع A)", "CEM II/A 42.5", "CEM II/A 42.5"),
      ("CEM II/B 32.5", "CEM II/B 32.5 (مركب نوع B)", "CEM II/B 32.5", "CEM II/B 32.5"),
      ("CEM III 42.5", "CEM III 42.5 (خبث أفران)", "CEM III 42.5", "CEM III 42.5"),
      ("CEM IV 32.5", "CEM IV 32.5 (بوزولاني)", "CEM IV 32.5", "CEM IV 32.5"),
      ("CEM V 32.5", "CEM V 32.5 (مركب)", "CEM V 32.5", "CEM V 32.5"),
      ("White CEM I 52.5", "White CEM I 52.5 (أبيض فائق البياض)", "White CEM I 52.5", "White CEM I 52.5")
    ]),
    ("strengthClass", "PROP_CEM_STRENGTH_28D", "فئة المقاومة القياسية (28 يوم)", "Classe de Résistance (28j)", "Strength Class (28-day)", "MPa", "number", "mechanical", "EN 196-1 / ASTM C109", 42.5, (20, 80)),
    ("density", "PROP_CEM_DENSITY", "الكثافة المطلقة للإسمنت", "Masse Volumique Réelle du Ciment", "Absolute Density of Cement", "kg/m³", "number", "physical", "EN 196-6 / ASTM C188", 3100, (2800, 3300)),
    ("specificGravity", "PROP_CEM_SPECIFIC_GRAVITY", "الوزن النوعي النسبي للإسمنت", "Densité Relative du Ciment", "Specific Gravity of Cement", "", "number", "physical", "EN 196-6 / ASTM C188", 3.10, (2.8, 3.3)),
    ("bulkDensity", "PROP_CEM_BULK_DENSITY", "الكثافة الظاهرية (الصب الحر)", "Masse Volumique Apparente", "Bulk Density (Loose)", "kg/m³", "number", "physical", "EN 1097-3", 1150, (800, 1500)),
    ("blaineFineness", "PROP_CEM_BLAINE", "النعومة النوعية (سطح بلين)", "Surface Spécifique Blaine (SSB)", "Blaine Specific Surface Area", "cm²/g", "number", "physical", "EN 196-6 / ASTM C204", 3450, (2500, 6500)),
    ("standardConsistency", "PROP_CEM_CONSISTENCY", "القوام القياسي للخلط (فيكات)", "Consistance Normalisée (Vicat)", "Standard Consistency (Water %)", "%", "number", "hydration", "EN 196-3 / ASTM C187", 26.5, (20, 40)),
    ("initialSetting", "PROP_CEM_INIT_SETTING", "زمن بداية الشك (فيكات)", "Début de Prise (Vicat)", "Initial Setting Time", "min", "number", "hydration", "EN 196-3 / ASTM C191", 135, (45, 360)),
    ("finalSetting", "PROP_CEM_FINAL_SETTING", "زمن نهاية الشك", "Fin de Prise", "Final Setting Time", "min", "number", "hydration", "EN 196-3 / ASTM C191", 210, (90, 480)),
    ("soundness", "PROP_CEM_SOUNDNESS", "ثبات الحجم والانتفاخ (لو شاتولييه)", "Stabilité / Expansion (Le Chatelier)", "Soundness / Expansion", "mm", "number", "durability", "EN 196-3", 1.2, (0, 10)),
    ("strength2d", "PROP_CEM_STRENGTH_2D", "مقاومة الضغط بعد يومين", "Résistance à la Compression (2j)", "Compressive Strength (2-day)", "MPa", "number", "mechanical", "EN 196-1 / ASTM C109", 21.5, (10, 45)),
    ("strength7d", "PROP_CEM_STRENGTH_7D", "مقاومة الضغط بعد 7 أيام", "Résistance à la Compression (7j)", "Compressive Strength (7-day)", "MPa", "number", "mechanical", "EN 196-1 / ASTM C109", 33.0, (18, 60)),
    ("strength28d", "PROP_CEM_STRENGTH_28D_TEST", "مقاومة الضغط بعد 28 يوم", "Résistance à la Compression (28j)", "Compressive Strength (28-day)", "MPa", "number", "mechanical", "EN 196-1 / ASTM C109", 48.5, (30, 80)),
    ("heatOfHydration", "PROP_CEM_HEAT_HYDRATION", "حرارة الإماهة (7 أيام)", "Chaleur d'Hydratation (7j)", "Heat of Hydration (7-day)", "J/g", "number", "hydration", "EN 196-8 / EN 196-9", 290, (180, 450)),
    ("lossOnIgnition", "PROP_CEM_LOI", "الفاقد في الحرق (LOI)", "Perte au Feu (PAF)", "Loss on Ignition (LOI)", "%", "number", "chemical", "EN 196-2 / ASTM C114", 1.8, (0.1, 7.0)),
    ("insolubleResidue", "PROP_CEM_INSOLUBLE", "الراسب غير القابل للذوبان", "Résidu Insoluble", "Insoluble Residue", "%", "number", "chemical", "EN 196-2 / ASTM C114", 0.6, (0.1, 5.0)),
    ("sulfateContent", "PROP_CEM_SO3", "محتوى الكبريتات (SO3)", "Teneur en Sulfates (SO3)", "Sulfate Content (SO3)", "%", "number", "chemical", "EN 196-2 / ASTM C114", 2.7, (0.5, 4.5)),
    ("chlorideContent", "PROP_CEM_CHLORIDE", "محتوى الكلوريدات (Cl-)", "Teneur en Chlorures (Cl-)", "Chloride Content (Cl-)", "%", "number", "chemical", "EN 196-2 / ASTM C114", 0.02, (0, 0.10)),
    ("alkaliEquivalent", "PROP_CEM_ALKALI", "مكافئ القلويات (Na2O eq)", "Équivalent Alcalin (Na2O eq)", "Equivalent Alkali (Na2O eq)", "%", "number", "chemical", "EN 196-2 / ASTM C114", 0.65, (0.1, 1.5))
  ],
  "sand": [
    ("density", "PROP_SND_DENSITY", "الكثافة المطلقة للرمل (جاف)", "Masse Volumique Réelle du Sable", "Absolute Density of Sand", "kg/m³", "number", "physical", "EN 1097-6 / ASTM C128", 2620, (2300, 2900)),
    ("ssdDensity", "PROP_SND_SSD_DENSITY", "كثافة الرمل المشبع جاف السطح (SSD)", "Masse Volumique SSD", "SSD Density of Sand", "kg/m³", "number", "physical", "EN 1097-6 / ASTM C128", 2650, (2350, 2950)),
    ("specificGravity", "PROP_SND_SPECIFIC_GRAVITY", "الوزن النوعي النسبي للرمل", "Densité Relative du Sable", "Specific Gravity of Sand", "", "number", "physical", "EN 1097-6 / ASTM C128", 2.62, (2.3, 2.9)),
    ("bulkDensity", "PROP_SND_BULK_DENSITY", "الكثافة الظاهرية للرمل (الصب الحر)", "Masse Volumique Apparente", "Bulk Density (Loose)", "kg/m³", "number", "physical", "EN 1097-3 / ASTM C29", 1540, (1200, 1900)),
    ("absorption", "PROP_SND_ABSORPTION", "معامل امتصاص الماء للرمل (WA24)", "Absorption d'Eau (WA24)", "Water Absorption (WA24)", "%", "number", "physical", "EN 1097-6 / ASTM C128", 1.4, (0.1, 6.0)),
    ("moisture", "PROP_SND_MOISTURE", "الرطوبة الطبيعية الحالية بالموقع", "Teneur en Eau Actuelle", "Current Moisture Content", "%", "number", "physical", "EN 1097-5 / ASTM C566", 2.5, (0, 12.0)),
    ("finenessModulus", "PROP_SND_FM", "معامل النعومة الحبيبي (FM)", "Module de Finesse (FM)", "Fineness Modulus (FM)", "", "number", "granulometric", "EN 933-1 / ASTM C136", 2.60, (1.6, 3.6)),
    ("dMax", "PROP_SND_DMAX", "القطر الأقصى لحبيبات الرمل (Dmax)", "Dimension Maximale (Dmax)", "Maximum Particle Size (Dmax)", "mm", "number", "granulometric", "EN 933-1 / ASTM C136", 4.0, (0.5, 5.0)),
    ("dMin", "PROP_SND_DMIN", "القطر الأدنى لحبيبات الرمل (dmin)", "Dimension Minimale (dmin)", "Minimum Particle Size (dmin)", "mm", "number", "granulometric", "EN 933-1 / ASTM C136", 0.063, (0.063, 2.0)),
    ("sandEquivalent", "PROP_SND_SE", "المكافئ الرملي (SE)", "Équivalent de Sable (ES)", "Sand Equivalent (SE)", "%", "number", "granulometric", "EN 933-8 / ASTM D2419", 80, (50, 100)),
    ("methyleneBlue", "PROP_SND_MB", "قيمة أزرق الميثيلين (MB)", "Valeur au Bleu de Méthylène (MB)", "Methylene Blue Value (MB)", "g/kg", "number", "granulometric", "EN 933-9", 0.8, (0.1, 5.0)),
    ("finesContent", "PROP_SND_FINES", "نسبة النواعم الأقل من 0.063 مم", "Passant à 0.063 mm (Fines)", "Fines Content (<0.063mm)", "%", "number", "granulometric", "EN 933-1 / ASTM C117", 3.2, (0, 15.0)),
    ("clayContent", "PROP_SND_CLAY", "نسبة الكتل الطينية والحبيبات الهشة", "Teneur en Argile / Fripables", "Clay Lumps & Friable Particles", "%", "number", "granulometric", "EN 933-1 / ASTM C142", 1.2, (0, 6.0)),
    ("foisonnement", "PROP_SND_FOISONNEMENT", "معامل انتفاخ الرمل بالرطوبة (Foisonnement)", "Coefficient de Foisonnement", "Bulking Factor", "%", "number", "physical", "NF P18-558", 18, (0, 35.0)),
    ("organicImpurities", "PROP_SND_ORGANIC", "الشوائب العضوية (لوحة الألوان القياسية)", "Impuretés Organiques (Couleur)", "Organic Impurities (Plate)", "", "text", "chemical", "ASTM C40 / EN 1744-1", "سليم - مطابق (ASTM C40 Plate 1)", None),
    ("chlorideContent", "PROP_SND_CHLORIDE", "محتوى أيونات الكلوريد الذائبة بالماء", "Teneur en Chlorures Solubles", "Water-Soluble Chloride Content", "%", "number", "chemical", "EN 1744-1 / ASTM C1152", 0.01, (0, 0.10)),
    ("sulfateContent", "PROP_SND_SULFATE", "محتوى الكبريتات الذائبة بالحامض (SO3)", "Teneur en Sulfates (SO3)", "Acid-Soluble Sulfate Content", "%", "number", "chemical", "EN 1744-1 / ASTM C1580", 0.12, (0, 1.0)),
    ("particleShape", "PROP_SND_SHAPE", "شكل وهيئة الحبيبات الرملية", "Forme des Grains", "Particle Shape", "", "select", "granulometric", "EN 933-4", "طبيعي", [
      ("طبيعي", "طبيعي (مستدير)", "Naturel", "Natural Rounded"),
      ("مكسر", "مكسر (كسارة زاوي)", "Concassé", "Crushed Angular"),
      ("شبه مكسر", "شبه مكسر (مختلط)", "Semi-concassé", "Semi-crushed")
    ])
  ],
  "gravel": [
    ("dMax", "PROP_GRA_DMAX", "القطر الحبيبي الأقصى (Dmax)", "Dimension Maximale (Dmax)", "Maximum Aggregate Size (Dmax)", "mm", "number", "granulometric", "EN 933-1 / ASTM C136", 20.0, (4, 50)),
    ("dMin", "PROP_GRA_DMIN", "القطر الحبيبي الأدنى (dmin)", "Dimension Minimale (dmin)", "Minimum Aggregate Size (dmin)", "mm", "number", "granulometric", "EN 933-1 / ASTM C136", 5.0, (2, 25)),
    ("nominalSize", "PROP_GRA_NOMINAL", "التسمية الحبيبية القياسية للكسر", "Fraction Granulométrique Nominale", "Nominal Grading Fraction", "", "text", "granulometric", "EN 12620 / ASTM C33", "5/20 mm", None),
    ("density", "PROP_GRA_DENSITY", "الكثافة المطلقة للحصى (جاف)", "Masse Volumique Réelle du Gravillon", "Absolute Density of Gravel", "kg/m³", "number", "physical", "EN 1097-6 / ASTM C127", 2680, (2300, 3100)),
    ("ssdDensity", "PROP_GRA_SSD_DENSITY", "كثافة الحصى المشبع جاف السطح (SSD)", "Masse Volumique SSD", "SSD Density of Gravel", "kg/m³", "number", "physical", "EN 1097-6 / ASTM C127", 2710, (2350, 3150)),
    ("specificGravity", "PROP_GRA_SPECIFIC_GRAVITY", "الوزن النوعي النسبي للحصى", "Densité Relative du Gravillon", "Specific Gravity of Gravel", "", "number", "physical", "EN 1097-6 / ASTM C127", 2.68, (2.3, 3.1)),
    ("bulkDensity", "PROP_GRA_BULK_DENSITY", "الكثافة الظاهرية للحصى (الصب الحر)", "Masse Volumique Apparente", "Bulk Density (Loose)", "kg/m³", "number", "physical", "EN 1097-3 / ASTM C29", 1480, (1200, 1900)),
    ("absorption", "PROP_GRA_ABSORPTION", "معامل امتصاص الماء للحصى (WA24)", "Absorption d'Eau (WA24)", "Water Absorption (WA24)", "%", "number", "physical", "EN 1097-6 / ASTM C127", 1.1, (0.1, 5.0)),
    ("moisture", "PROP_GRA_MOISTURE", "الرطوبة الطبيعية الحالية بالموقع", "Teneur en Eau Actuelle", "Current Moisture Content", "%", "number", "physical", "EN 1097-5 / ASTM C566", 1.0, (0, 6.0)),
    ("particleShape", "PROP_GRA_SHAPE", "شكل الحبيبات الحصوية السائد", "Forme des Granulats", "Aggregate Particle Shape", "", "select", "granulometric", "EN 933-4", "مكسر", [
      ("مكسر", "مكسر زاوي (كسارة)", "Concassé angulaire", "Crushed Angular"),
      ("مستدير", "مستدير أملس (وادي)", "Roulé", "Alluvial Rounded"),
      ("شبه زاوي", "شبه زاوي (مختلط)", "Semi-angulaire", "Sub-angular")
    ]),
    ("losAngelesAbrasion", "PROP_GRA_LA", "معامل لوس أنجلوس للتآكل والصدم (LA)", "Coefficient Los Angeles (LA)", "Los Angeles Abrasion Value (LA)", "%", "number", "mechanical", "EN 1097-2 / ASTM C131", 22, (8, 50)),
    ("microDeval", "PROP_GRA_MDE", "معامل ميكرو-ديفال الرطب للتآكل الاحتكاكي", "Coefficient Micro-Deval Humide (MDE)", "Micro-Deval Abrasion Value (MDE)", "%", "number", "mechanical", "EN 1097-1", 16, (5, 40)),
    ("flakinessIndex", "PROP_GRA_FI", "معامل التفرطح والتسطح الحبيبي (FI)", "Indice de Forme / Aplatissement (FI)", "Flakiness Index (FI)", "%", "number", "granulometric", "EN 933-3", 12, (2, 40)),
    ("elongationIndex", "PROP_GRA_EI", "معامل الاستطالة الحبيبية (EI)", "Indice d'Élongation (EI)", "Elongation Index (EI)", "%", "number", "granulometric", "EN 933-4", 14, (2, 40)),
    ("crushingValue", "PROP_GRA_ACV", "قيمة تهشم وسحق الركام (ACV)", "Valeur de Concassage (ACV)", "Aggregate Crushing Value (ACV)", "%", "number", "mechanical", "BS 812-110", 18, (8, 35)),
    ("finesContent", "PROP_GRA_FINES", "نسبة النواعم العابرة لمنخل 0.063 مم", "Passant au Tamis 0.063 mm (Fines)", "Fines Content (<0.063mm)", "%", "number", "granulometric", "EN 933-1 / ASTM C117", 0.8, (0, 4.0)),
    ("chlorideContent", "PROP_GRA_CHLORIDE", "محتوى الكلوريدات الذائبة بالماء", "Teneur en Chlorures Solubles", "Chloride Content", "%", "number", "chemical", "EN 1744-1 / ASTM C1152", 0.008, (0, 0.06)),
    ("sulfateContent", "PROP_GRA_SULFATE", "محتوى الكبريتات الكلي (SO3)", "Teneur en Sulfates (SO3)", "Sulfate Content (SO3)", "%", "number", "chemical", "EN 1744-1 / ASTM C1580", 0.08, (0, 0.6))
  ],
  "water": [
    ("density", "PROP_WAT_DENSITY", "كثافة ماء الخلط القياسية", "Masse Volumique de l'Eau", "Density of Water", "kg/m³", "number", "physical", "EN 1008", 1000, (990, 1010)),
    ("temperature", "PROP_WAT_TEMP", "درجة حرارة مياه الخلط", "Température de l'Eau", "Water Temperature", "°C", "number", "physical", "EN 1008", 20, (5, 40)),
    ("ph", "PROP_WAT_PH", "درجة الحموضة / القلوية (pH)", "Potentiel d'Hydrogène (pH)", "pH Level", "", "number", "chemical", "EN 1008 / ISO 10523", 7.2, (5.0, 9.0)),
    ("chlorides", "PROP_WAT_CHLORIDES", "تركيز أيونات الكلوريد (Cl-)", "Teneur en Chlorures (Cl-)", "Chloride Ion Concentration", "mg/L", "number", "chemical", "EN 1008 / EN 196-21", 120, (0, 1500)),
    ("sulfates", "PROP_WAT_SULFATES", "تركيز أيونات الكبريتات (SO4 2-)", "Teneur en Sulfates (SO4 2-)", "Sulfate Ion Concentration", "mg/L", "number", "chemical", "EN 1008 / EN 196-2", 180, (0, 2500)),
    ("totalDissolvedSolids", "PROP_WAT_TDS", "مجموع الأملاح الذائبة الكلية (TDS)", "Matières Dissoutes Totales (TDS)", "Total Dissolved Solids (TDS)", "mg/L", "number", "chemical", "EN 1008", 450, (0, 4000)),
    ("suspendedSolids", "PROP_WAT_SS", "المواد العالقة الصلبة", "Matières en Suspension", "Suspended Solids", "mg/L", "number", "physical", "EN 1008", 25, (0, 3000)),
    ("organicMatter", "PROP_WAT_ORGANIC", "المواد العضوية القابلة للأكسدة", "Matières Organiques", "Organic Matter Content", "mg/L", "number", "chemical", "EN 1008", 15, (0, 300))
  ],
  "admixture": [
    ("admixtureType", "PROP_ADM_TYPE", "نوع ووظيفة الإضافة الكيميائية", "Fonction Principale de l'Adjuvant", "Admixture Function Type", "", "select", "composition", "EN 934-2 / ASTM C494", "superplasticizer", [
      ("superplasticizer", "ملدن متفوق عالي الفعالية (Superplasticizer)", "Superplastifiant", "Superplasticizer"),
      ("plasticizer", "ملدن قياسي مخفض للماء (Plasticizer)", "Plastifiant", "Plasticizer"),
      ("retarder", "مؤخر زمن الشك (Retarder)", "Retardateur", "Retarder"),
      ("accelerator", "مسرع زمن الشك والتصلد (Accelerator)", "Accélérateur", "Accelerator"),
      ("air_entraining", "مهوي ومحبس هواء مجهري (Air-Entraining)", "Entraîneur d'air", "Air-Entraining")
    ]),
    ("recommendedDosage", "PROP_ADM_DOSAGE", "الجرعة الموصى بها كنسبة مئوية من وزن الإسمنت", "Dosage Recommandé (% Ciment)", "Recommended Dosage (% Binder)", "%", "number", "composition", "EN 934-2", 1.2, (0.1, 6.0)),
    ("waterReduction", "PROP_ADM_WATER_REDUCTION", "نسبة تخفيض ماء الخلط الفعالة", "Pouvoir Réducteur d'Eau", "Water Reduction Capability", "%", "number", "rheology", "EN 934-2", 22, (3, 45)),
    ("density", "PROP_ADM_DENSITY", "كثافة محلول الإضافة الكيميائية", "Masse Volumique du Produit", "Liquid Admixture Density", "kg/m³", "number", "physical", "EN 934-2 / ISO 758", 1080, (950, 1400)),
    ("solidContent", "PROP_ADM_SOLID_CONTENT", "نسبة المادة الصلبة الفعالة (Extrait Sec)", "Extrait Sec / Matière Sèche", "Dry Solid Content", "%", "number", "composition", "EN 480-8", 32, (10, 65)),
    ("settingTimeImpact", "PROP_ADM_SETTING_IMPACT", "تأثير الإضافة على زمن الشك الابتدائي", "Effet sur le Temps de Prise", "Setting Time Delta", "min", "number", "hydration", "EN 480-2", 30, (-240, 480)),
    ("airPercentage", "PROP_ADM_AIR_CONTENT", "كمية الهواء المحبوس الإضافي المتولد", "Air Occlus Entraîné", "Additional Air Entrained", "%", "number", "rheology", "EN 480-7", 1.5, (0, 10)),
    ("ph", "PROP_ADM_PH", "درجة الحموضة / القلوية للإضافة (pH)", "Valeur du pH", "Admixture pH Value", "", "number", "chemical", "ISO 4316", 6.5, (3.0, 10.0)),
    ("chlorideContent", "PROP_ADM_CHLORIDE", "محتوى الكلوريدات الكلي في الإضافة", "Teneur en Chlorures", "Total Chloride Content", "%", "number", "chemical", "EN 480-10", 0.01, (0, 0.2)),
    ("alkaliContent", "PROP_ADM_ALKALI", "محتوى مكافئ القلويات (Na2O eq)", "Teneur en Alcalins (Na2O eq)", "Alkali Content (Na2O eq)", "%", "number", "chemical", "EN 480-12", 1.2, (0, 6.0))
  ],
  "scm": [
    ("density", "PROP_SCM_DENSITY", "الكثافة المطلقة للإضافة المعدنية", "Masse Volumique Réelle", "Absolute Density of SCM", "kg/m³", "number", "physical", "EN 196-6 / ASTM C188", 2300, (2000, 3200)),
    ("bulkDensity", "PROP_SCM_BULK_DENSITY", "الكثافة الظاهرية المعبأة بالحرية", "Masse Volumique Apparente", "Bulk Density (Loose)", "kg/m³", "number", "physical", "EN 1097-3", 650, (200, 1300)),
    ("blaineFineness", "PROP_SCM_BLAINE", "النعومة النوعية السطحية (بلين أو BET)", "Surface Spécifique (Blaine / BET)", "Specific Surface Area", "cm²/g", "number", "physical", "EN 196-6 / ASTM C204", 4200, (2500, 30000)),
    ("pozzolanicIndex", "PROP_SCM_ACTIVITY", "معامل الفعالية البوزولانية (28 يوم)", "Indice d'Activité Pouzzolanique (IAP)", "Pozzolanic Activity Index (28d)", "%", "number", "mechanical", "EN 450-1 / ASTM C311", 95, (60, 150)),
    ("waterDemandFactor", "PROP_SCM_WATER_DEMAND", "معامل طلب واستهلاك الماء النسبي", "Facteur de Demande en Eau", "Water Demand Factor", "", "number", "rheology", "EN 450-1", 1.02, (0.8, 1.3)),
    ("silicaContent", "PROP_SCM_SIO2", "محتوى السيليكا الفعالة (SiO2)", "Teneur en Silice Réactive (SiO2)", "Reactive Silica Content (SiO2)", "%", "number", "chemical", "EN 196-2 / ASTM C311", 55.0, (15, 99)),
    ("calciumOxide", "PROP_SCM_CAO", "محتوى أكسيد الكالسيوم (CaO)", "Teneur en Chaux (CaO)", "Calcium Oxide Content (CaO)", "%", "number", "chemical", "EN 196-2 / ASTM C311", 12.0, (0.2, 50)),
    ("lossOnIgnition", "PROP_SCM_LOI", "الفاقد في الحرق (LOI)", "Perte au Feu (PAF)", "Loss on Ignition (LOI)", "%", "number", "chemical", "EN 196-2 / ASTM C311", 2.5, (0.1, 12)),
    ("maxReplacementPercent", "PROP_SCM_MAX_REPLACE", "الحد الأقصى الموصى به للاستبدال الوزني", "Taux de Substitution Maximal", "Maximum Replacement Ratio", "%", "number", "composition", "EN 206 / ACI 211", 25, (5, 80)),
    ("chlorideContent", "PROP_SCM_CHLORIDE", "محتوى الكلوريدات الإجمالي", "Teneur en Chlorures", "Chloride Content", "%", "number", "chemical", "EN 196-2", 0.01, (0, 0.15))
  ],
  "filler": [
    ("density", "PROP_FIL_DENSITY", "الكثافة المطلقة للمادة المالئة", "Masse Volumique Réelle du Filler", "Absolute Density of Filler", "kg/m³", "number", "physical", "EN 1097-6", 2700, (2400, 2900)),
    ("bulkDensity", "PROP_FIL_BULK_DENSITY", "الكثافة الظاهرية للمسحوق الجاف", "Masse Volumique Apparente", "Bulk Density (Loose)", "kg/m³", "number", "physical", "EN 1097-3", 950, (700, 1300)),
    ("blaineFineness", "PROP_FIL_BLAINE", "النعومة النوعية السطحية (بلين)", "Surface Spécifique Blaine", "Blaine Specific Surface", "cm²/g", "number", "physical", "EN 196-6", 5200, (3000, 8000)),
    ("finesUnder63um", "PROP_FIL_FINES", "نسبة النواعم العابرة لمنخل 0.063 مم", "Passant à 0.063 mm (%)", "Passing 0.063 mm Sieve", "%", "number", "granulometric", "EN 933-10", 92, (75, 100)),
    ("calciumCarbonate", "PROP_FIL_CACO3", "محتوى كربونات الكالسيوم النقي (CaCO3)", "Teneur en Carbonate de Calcium", "Calcium Carbonate Content", "%", "number", "chemical", "EN 196-2", 96.5, (60, 100)),
    ("methyleneBlue", "PROP_FIL_MB", "قيمة امتصاص أزرق الميثيلين للمسحوق", "Valeur au Bleu de Méthylène (MB)", "Methylene Blue Value", "g/kg", "number", "granulometric", "EN 933-9", 0.6, (0.1, 3.0))
  ],
  "fiber": [
    ("fiberType", "PROP_FBR_TYPE", "نوع المادة الخام للألياف", "Nature et Type de Fibres", "Fiber Material Type", "", "select", "composition", "EN 14889", "steel_hooked", [
      ("steel_hooked", "ألياف فولاذية معقوفة الأطراف (Steel Hooked)", "Acier à crochets", "Steel Hooked"),
      ("synthetic_macro", "ألياف اصطناعية هيكلية كبرى (Macro-Synthetic)", "Macro-synthétique", "Macro-Synthetic"),
      ("synthetic_micro", "ألياف دقيقة مانعة للتشقق (Micro-Synthetic)", "Micro-synthétique", "Micro-Synthetic"),
      ("glass", "ألياف زجاجية مقاومة للقلويات (Glass AR)", "Fibre de verre AR", "Alkali-Resistant Glass")
    ]),
    ("density", "PROP_FBR_DENSITY", "الكثافة الحجمية لمادة الألياف", "Masse Volumique du Matériau", "Fiber Material Density", "kg/m³", "number", "physical", "ISO 1183 / ASTM A820", 7850, (800, 8200)),
    ("fiberLength", "PROP_FBR_LENGTH", "طول الليف المفرد القياسي (Lf)", "Longueur Nominale des Fibres (Lf)", "Nominal Fiber Length (Lf)", "mm", "number", "physical", "EN 14889", 35.0, (5, 75)),
    ("fiberDiameter", "PROP_FBR_DIAMETER", "القطر الاسمي أو المكافئ لليف (df)", "Diamètre Équivalent (df)", "Equivalent Fiber Diameter (df)", "mm", "number", "physical", "EN 14889", 0.75, (0.01, 1.5)),
    ("aspectRatio", "PROP_FBR_ASPECT_RATIO", "نسبة النحافة الهندسية (Lf/df)", "Élancement Géométrique (Lf/df)", "Aspect Ratio (Lf/df)", "", "number", "physical", "EN 14889", 46.7, (25, 120)),
    ("tensileStrength", "PROP_FBR_TENSILE", "مقاومة الشد المحورية للألياف", "Résistance à la Traction des Fibres", "Tensile Strength of Fibers", "MPa", "number", "mechanical", "EN 14889 / ASTM A820", 1150, (250, 3000)),
    ("elasticModulus", "PROP_FBR_MODULUS", "معامل المرونة الطولي (يانغ)", "Module d'Élasticité (Young)", "Modulus of Elasticity", "GPa", "number", "mechanical", "EN 14889", 200, (2, 230))
  ],
  "lightweightAggregate": [
    ("dMax", "PROP_LWA_DMAX", "القطر الحبيبي الأقصى (Dmax)", "Dimension Maximale (Dmax)", "Maximum Aggregate Size", "mm", "number", "granulometric", "EN 933-1", 10.0, (3, 25)),
    ("density", "PROP_LWA_DENSITY", "الكثافة المطلقة لحبيبات الركام الخفيف", "Masse Volumique Réelle des Grains", "Particle Density", "kg/m³", "number", "physical", "EN 1097-6", 950, (500, 1900)),
    ("bulkDensity", "PROP_LWA_BULK_DENSITY", "الكثافة الظاهرية المعبأة (الحر)", "Masse Volumique en Vrac", "Loose Bulk Density", "kg/m³", "number", "physical", "EN 1097-3", 480, (250, 1000)),
    ("absorption", "PROP_LWA_ABSORPTION", "معامل امتصاص الماء للركام الخفيف", "Absorption d'Eau (WA24)", "Water Absorption (WA24)", "%", "number", "physical", "EN 1097-6", 14.5, (4, 35)),
    ("crushingResistance", "PROP_LWA_CRUSHING", "مقاومة سحق الحبيبات في الأسطوانة", "Résistance à l'Écrasement en Cylindre", "Crushing Resistance in Cylinder", "MPa", "number", "mechanical", "EN 13055-1", 4.2, (1.0, 15))
  ],
  "heavyweightAggregate": [
    ("dMax", "PROP_HWA_DMAX", "القطر الحبيبي الأقصى للركام الثقيل", "Dimension Maximale (Dmax)", "Maximum Aggregate Size", "mm", "number", "granulometric", "EN 933-1", 16.0, (6, 35)),
    ("density", "PROP_HWA_DENSITY", "الكثافة المطلقة الفائقة للركام الثقيل", "Masse Volumique Réelle Élevée", "High Absolute Density", "kg/m³", "number", "physical", "EN 1097-6", 4300, (3600, 5500)),
    ("bulkDensity", "PROP_HWA_BULK_DENSITY", "الكثافة الظاهرية للصب الحر", "Masse Volumique Apparente", "Bulk Density (Loose)", "kg/m³", "number", "physical", "EN 1097-3", 2650, (2000, 3500)),
    ("absorption", "PROP_HWA_ABSORPTION", "معامل امتصاص الماء للركام الثقيل", "Absorption d'Eau (WA24)", "Water Absorption (WA24)", "%", "number", "physical", "EN 1097-6", 0.45, (0.05, 2.5)),
    ("bariumSulfate", "PROP_HWA_BASO4", "محتوى كبريتات الباريوم (BaSO4)", "Teneur en Sulfate de Baryum", "Barium Sulfate Content", "%", "number", "chemical", "ASTM C637", 92.0, (50, 99))
  ],
  "recycledAggregate": [
    ("dMax", "PROP_RCA_DMAX", "القطر الحبيبي الأقصى للركام المعاد تدويره", "Dimension Maximale (Dmax)", "Maximum Particle Size", "mm", "number", "granulometric", "EN 933-1", 20.0, (6, 30)),
    ("density", "PROP_RCA_DENSITY", "الكثافة المطلقة لحبيبات الركام المعاد", "Masse Volumique Réelle", "Absolute Particle Density", "kg/m³", "number", "physical", "EN 1097-6", 2410, (2100, 2700)),
    ("bulkDensity", "PROP_RCA_BULK_DENSITY", "الكثافة الظاهرية في الحالة السائبة", "Masse Volumique Apparente", "Loose Bulk Density", "kg/m³", "number", "physical", "EN 1097-3", 1320, (1100, 1600)),
    ("absorption", "PROP_RCA_ABSORPTION", "معامل امتصاص الماء المرتفع (WA24)", "Absorption d'Eau Élevée (WA24)", "High Water Absorption (WA24)", "%", "number", "physical", "EN 1097-6", 5.8, (2.5, 12)),
    ("losAngelesAbrasion", "PROP_RCA_LA", "معامل لوس أنجلوس للتآكل (LA)", "Coefficient Los Angeles (LA)", "Los Angeles Abrasion Value", "%", "number", "mechanical", "EN 1097-2", 34, (20, 50)),
    ("masonryContent", "PROP_RCA_MASONRY", "نسبة بقايا الطوب والبناء (Rb)", "Teneur en Éléments de Maçonnerie (Rb)", "Masonry Debris Content (Rb)", "%", "number", "composition", "EN 933-11", 3.5, (0, 20)),
    ("finesContent", "PROP_RCA_FINES", "نسبة النواعم العابرة لمنخل 0.063 مم", "Passant à 0.063 mm (Fines)", "Fines Content (<0.063mm)", "%", "number", "granulometric", "EN 933-1", 1.8, (0, 5.0))
  ],
  "specialBinder": [
    ("density", "PROP_GEO_DENSITY", "الكثافة المطلقة للرابط الخاص", "Masse Volumique du Liant Spécial", "Absolute Density of Binder", "kg/m³", "number", "physical", "EN 196-6", 2850, (2500, 3400)),
    ("strengthClass", "PROP_GEO_STRENGTH", "فئة المقاومة القياسية (28 يوم)", "Classe de Résistance (28j)", "Strength Class (28-day)", "MPa", "number", "mechanical", "EN 196-1", 45.0, (20, 90)),
    ("alkalineRatio", "PROP_GEO_RATIO", "النسبة القلوية المولية (Na/Al)", "Rapport Molaire Alcalin (Na/Al)", "Alkaline Molar Ratio", "", "number", "chemical", "Chemical formulation", 0.42, (0.1, 1.0)),
    ("silicaModulus", "PROP_GEO_MODULUS", "معامل السيليكا المنشطة (SiO2/Al2O3)", "Module Silicique (SiO2/Al2O3)", "Silica Activation Modulus", "", "number", "chemical", "Chemical formulation", 1.35, (0.5, 2.5))
  ],
  "airContent": [
    ("airPercentage", "PROP_AIR_PERCENT", "نسبة الهواء المحبوس الكلية المستهدفة", "Teneur en Air Occlus Cible", "Target Air Content Ratio", "%", "number", "rheology", "EN 12350-7 / ASTM C231", 4.5, (1.0, 12)),
    ("spacingFactor", "PROP_AIR_SPACING", "عامل تباعد الفراغات الهوائية (L)", "Facteur d'Espacement des Bulles (L)", "Air Void Spacing Factor (L)", "µm", "number", "durability", "EN 480-11 / ASTM C457", 175, (80, 300)),
    ("specificSurfaceAir", "PROP_AIR_SURFACE", "المساحة السطحية النوعية للفراغات", "Surface Spécifique du Réseau d'Air", "Specific Surface of Air Voids", "mm²/mm³", "number", "durability", "EN 480-11", 32, (15, 50))
  ],
  "soil": [
    ("soilClassification", "PROP_SOL_CLASS", "التصنيف الجيوتقني القياسي للتربة", "Classification Géotechnique", "Geotechnical Soil Classification", "", "text", "composition", "AASHTO M 145 / ASTM D2487", "AASHTO A-1-a / USCS GW-SW", None),
    ("maxDryDensity", "PROP_SOL_MDD", "الكثافة الجافة العظمى (بروكتور المعدل)", "Densité Sèche Maximale (OPM)", "Maximum Dry Density (MDD)", "kg/m³", "number", "physical", "NF P94-093 / ASTM D698", 2120, (1500, 2400)),
    ("optimumMoisture", "PROP_SOL_OMC", "نسبة الرطوبة المثلى للدمك (w_opt)", "Teneur en Eau Optimale (w_opt)", "Optimum Moisture Content (OMC)", "%", "number", "physical", "NF P94-093 / ASTM D698", 8.5, (4, 25)),
    ("liquidLimit", "PROP_SOL_LL", "حد السيولة للتربة (حدود أتربرغ)", "Limite de Liquidité (WL)", "Liquid Limit (LL)", "%", "number", "physical", "NF P94-051 / ASTM D4318", 22.0, (10, 80)),
    ("plasticLimit", "PROP_SOL_PL", "حد اللدونة للتربة (حدود أتربرغ)", "Limite de Plasticité (WP)", "Plastic Limit (PL)", "%", "number", "physical", "NF P94-051 / ASTM D4318", 16.0, (8, 45)),
    ("plasticityIndex", "PROP_SOL_PI", "دليل اللدونة (IP = WL - WP)", "Indice de Plasticité (IP)", "Plasticity Index (PI)", "%", "number", "physical", "NF P94-051 / ASTM D4318", 6.0, (0, 50)),
    ("cbrValue", "PROP_SOL_CBR", "معامل التحمل الكاليفورني الفوري / بعد الغمر", "Indice Portant CBR (Imbibé 4j)", "California Bearing Ratio (CBR)", "%", "number", "mechanical", "NF P94-078 / ASTM D1883", 45, (2, 90)),
    ("permeability", "PROP_SOL_K", "معامل النفاذية الهيدروليكية (k)", "Coefficient de Perméabilité (k)", "Hydraulic Permeability (k)", "m/s", "number", "physical", "NF P94-057", 0.00025, (0.0000000001, 0.01))
  ],
  "bituminous": [
    ("bitumenGrade", "PROP_BIT_GRADE", "فئة ورتبة قوام البيتومين النقي", "Classe de Pénétrabilité du Bitume", "Bitumen Penetration Grade", "", "select", "composition", "EN 12591", "40/50", [
      ("35/50", "35/50 (صلد للطبقات الثقيلة)", "35/50", "35/50 Hard"),
      ("40/50", "40/50 (العيار القياسي للخلطات)", "40/50", "40/50 Standard"),
      ("50/70", "50/70 (شبه صلد)", "50/70", "50/70 Semi-hard"),
      ("70/100", "70/100 (لين للمناطق الباردة)", "70/100", "70/100 Soft"),
      ("PmB 45/80-65", "PmB 45/80-65 (معدل بالبوليمر عالي الأداء)", "PmB 45/80-65", "PmB 45/80-65")
    ]),
    ("penetration", "PROP_BIT_PEN", "معامل الاختراق بالإبرة عند 25°م", "Pénétrabilité à l'Aiguille à 25°C", "Needle Penetration at 25°C", "0.1mm", "number", "physical", "EN 1426 / ASTM D5", 45, (15, 120)),
    ("softeningPoint", "PROP_BIT_TBA", "نقطة الليونة والرخاوة (الكرة والحلقة TBA)", "Point de Ramollissement (Bille et Anneau)", "Softening Point (Ring & Ball)", "°C", "number", "physical", "EN 1427 / ASTM D36", 52.0, (35, 90)),
    ("density", "PROP_BIT_DENSITY", "الكثافة النسبية للبيتومين عند 25°م", "Masse Volumique à 25°C", "Density of Bitumen at 25°C", "kg/m³", "number", "physical", "EN ISO 3838", 1025, (980, 1100)),
    ("flashPoint", "PROP_BIT_FLASH", "درجة حرارة نقطة الوميض والاشتعال", "Point d'Éclair (Vase Ouvert)", "Flash Point (Cleveland)", "°C", "number", "durability", "EN ISO 2592 / ASTM D92", 295, (200, 380))
  ],
  "masonry": [
    ("masonryType", "PROP_MAS_TYPE", "نوع وتصنيف وحدة البناء القياسية", "Type d'Élément de Maçonnerie", "Masonry Unit Type", "", "select", "composition", "EN 771", "hollow_concrete_block", [
      ("hollow_concrete_block", "كتل خرسانية مجوفة (بلوك 20x20x40)", "Bloc de béton creux", "Hollow Concrete Block"),
      ("perforated_clay_brick", "طوب أحمر طيني مثقب (آجر)", "Brique de terre cuite perforée", "Perforated Clay Brick"),
      ("solid_brick", "طوب مصمت عالي الكثافة", "Brique pleine", "Solid Brick"),
      ("masonry_mortar_m10", "ملاط بناء جاهز رتبة M10", "Mortier de maçonnerie M10", "Masonry Mortar M10")
    ]),
    ("density", "PROP_MAS_DENSITY", "الكثافة الظاهرية الجافة للوحدة الكلية", "Masse Volumique Apparente Nette", "Gross Dry Unit Density", "kg/m³", "number", "physical", "EN 772-13", 1250, (500, 2600)),
    ("compressiveStrength", "PROP_MAS_STRENGTH", "مقاومة الضغط الاسمية المعيارية (fb)", "Résistance à la Compression Normalisée (fb)", "Compressive Strength (fb)", "MPa", "number", "mechanical", "EN 772-1 / ASTM C140", 10.5, (2.0, 50.0)),
    ("waterAbsorption", "PROP_MAS_ABSORPTION", "معامل امتصاص الماء الشعيري", "Absorption d'Eau par Capillarité", "Water Absorption", "%", "number", "physical", "EN 772-21", 11.0, (2.0, 30.0)),
    ("thermalConductivity", "PROP_MAS_LAMBDA", "معامل التوصيل الحراري المكافئ (λ)", "Conductivité Thermique (λ)", "Thermal Conductivity (λ)", "W/m·K", "number", "physical", "EN 1745", 0.65, (0.10, 1.50))
  ],
  "other": []
}

with open("scripts/schemas_dict.json", "w", encoding="utf-8") as f:
    json.dump(schemas_dict, f, ensure_ascii=False, indent=2)

print("Saved schemas_dict.json successfully")
