import React, { createContext, useContext, useState, useEffect } from "react";
import arData from "../locales/ar.json";
import frData from "../locales/fr.json";
import enData from "../locales/en.json";

export type Language = "ar" | "fr" | "en";

export interface TranslationDict {
  [key: string]: {
    ar: string;
    fr: string;
    en: string;
  };
}

// Statically defined technical terms (merged dynamically with JSON locales)
export const TECHNICAL_DICTIONARY: TranslationDict = {
  // Navigation & Sidebars
  "app_title": {
    ar: "المنصة الذكية لتصميم الخرسانة | طريقة درو-غوريس",
    fr: "Plateforme Spécialisée de Formulation du Béton | Méthode Dreux-Gorisse",
    en: "Smart Concrete Mix Design Platform | Dreux-Gorisse Method"
  },
  "dashboard": {
    ar: "لوحة التحليل",
    fr: "Tableau de Bord",
    en: "Analysis Dashboard"
  },
  "calculator": {
    ar: "حاسبة الخلطة",
    fr: "Calculateur",
    en: "Mix Calculator"
  },
  "database": {
    ar: "المكتبة والخلطات",
    fr: "Base de Données",
    en: "Recipes & History"
  },
  "cost": {
    ar: "الكلفة ومواد العمل",
    fr: "Prix & Matériaux",
    en: "Costs & Pricing"
  },
  "reports": {
    ar: "التقرير والمخرجات",
    fr: "Rapports d'Essai",
    en: "Engineering Reports"
  },
  "settings": {
    ar: "الإعدادات والكودات",
    fr: "Paramètres & Codes",
    en: "Settings & Codes"
  },

  // Language section
  "language_selection": {
    ar: "لغة العرض والواجهة (Language Selection):",
    fr: "Sélection de la langue de l'interface :",
    en: "Application Interface Language:"
  },
  "lang_ar": {
    ar: "العربية (Arabic)",
    fr: "Arabe (العربية)",
    en: "Arabic (العربية)"
  },
  "lang_fr": {
    ar: "الفرنسية (French)",
    fr: "Français (French)",
    en: "French (Français)"
  },
  "lang_en": {
    ar: "الإنجليزية (English)",
    fr: "Anglais (English)",
    en: "English"
  },

  // Main UI Actions
  "reset": {
    ar: "إعادة ضبط",
    fr: "Réinitialiser",
    en: "Reset to Default"
  },
  "save_mix": {
    ar: "حفظ الخلطة الحالية",
    fr: "Sauvegarder le mélange",
    en: "Save Current Mix"
  },
  "save_success": {
    ar: "تم حفظ الخلطة بنجاح في سجل الخلطات المحلي!",
    fr: "Formulation sauvegardée avec succès dans l'historique local !",
    en: "Mix formulation successfully saved to local database!"
  },
  "export_pdf": {
    ar: "تصدير تقرير PDF",
    fr: "Exporter en PDF",
    en: "Export PDF Report"
  },
  "print": {
    ar: "طباعة التقرير",
    fr: "Imprimer le rapport",
    en: "Print Report"
  },

  // Core properties (Left pane inputs)
  "core_design_inputs": {
    ar: "المدخلات الأساسية للخلطة الخرسانية",
    fr: "Paramètres fondamentaux de formulation",
    en: "Core Mix Formulation Parameters"
  },
  "fck28_label": {
    ar: "المقاومة المميزة المطلوبة بعد 28 يوماً (fck28):",
    fr: "Résistance caractéristique spécifiée à 28 jours (fc28) :",
    en: "Specified Characteristic Compressive Strength (fck28):"
  },
  "concrete_type_label": {
    ar: "نوع تطبيق الخرسانة المحدد (Concrete Type):",
    fr: "Type d'application du béton spécifié :",
    en: "Design Concrete Application Type:"
  },
  "slump_label": {
    ar: "الهبوط المستهدف بقمع أبرامز (Slump Class):",
    fr: "Affaissement ciblé au cône d'Abrams (Slump) :",
    en: "Target Slump Consistency (Abrams Cone):"
  },
  "dmax_label": {
    ar: "القطر الأقصى للركام D_max المتاح بالموقع (Dmax):",
    fr: "Dimension maximale des granulats D_max (Dmax) :",
    en: "Maximum Aggregate Grain Size D_max (Dmax):"
  },
  "aggregate_type_label": {
    ar: "شكل الركام (طبيعي وديان أم مكسر محاجر):",
    fr: "Forme des granulats (Roulé ou Concassé) :",
    en: "Aggregate Shape & Form (Rounded or Crushed):"
  },
  "aggregate_quality_label": {
    ar: "فئة جودة الركام ونقائه من الأتربة الطينية:",
    fr: "Qualité et propreté des granulats (Argile/Fins) :",
    en: "Aggregate Quality & Cleanness Class:"
  },
  "control_class_label": {
    ar: "فئة التحكم بجودة خلط الإسمنت (Control Class):",
    fr: "Niveau de contrôle qualité sur chantier :",
    en: "Quality Control Level (Standard Deviation):"
  },
  "cement_type_label": {
    ar: "نوع الإسمنت البورتلاندي الفعلي بالخلاطة:",
    fr: "Type de ciment Portland utilisé :",
    en: "Portland Cement Class / Type:"
  },
  "cement_strength_label": {
    ar: "رتبة مقاومة الإسمنت الاسمية للمصنع (MPa):",
    fr: "Classe de résistance nominale de l'usine (MPa) :",
    en: "Nominal Gas-Phase Cement Strength Class (MPa):"
  },
  "pumping_label": {
    ar: "هل سيتم صب الخرسانة بالضخ (Pumping Required):",
    fr: "Béton destiné au pompage (Coulage sous pression) :",
    en: "Are concrete pump/chutes utilized (Pumping Rate):"
  },

  // Concrete Types translations
  "type_NSC": {
    ar: "الخرسانة عادية المقاومة (NSC) - عادية",
    fr: "Béton de Résistance Courante (B.C / NSC)",
    en: "Normal Strength Concrete (NSC) - Standard"
  },
  "type_HSC": {
    ar: "الخرسانة عالية المقاومة (HSC) - مقاومة فائقة",
    fr: "Béton Haute Résistance (B.H.R / HSC)",
    en: "High Strength Concrete (HSC) - Ultra Strength"
  },
  "type_HPC": {
    ar: "الخرسانة عالية الأداء (HPC / BHP) - متانة كيميائية",
    fr: "Béton à Hautes Performances (B.H.P / HPC)",
    en: "High Performance Durability Concrete (HPC)"
  },
  "type_SCC": {
    ar: "الخرسانة ذاتية الرص (SCC / BAP) - سيولة حركية",
    fr: "Béton Autoplaçant (B.A.P / SCC)",
    en: "Self-Consolidating Fluids Concrete (SCC)"
  },
  "type_FRC": {
    ar: "الخرسانة المسلحة بالألياف (FRC) - مقاومة تساقط",
    fr: "Béton Armé de Fibres (B.A.F / FRC)",
    en: "Fiber-Reinforced Structural Concrete (FRC)"
  },
  "type_LWC": {
    ar: "الخرسانة خفيفة الوزن (LWC) - عازلة ومخففة",
    fr: "Béton Léger Thermo-Isolant (B.L)",
    en: "Lightweight Structure Concrete (LWC)"
  },
  "type_HWC": {
    ar: "الخرسانة ثقيلة الوزن (HWC) - حماية إشعاعية",
    fr: "Béton Lourd Anti-Radiations (B.Lo)",
    en: "Heavyweight Radiation-Shield Concrete (HWC)"
  },
  "type_RCC": {
    ar: "الخرسانة المدحولة (RCC) - جافة للسدود والطرق",
    fr: "Béton Compacté au Rouleau (B.C.R / RCC)",
    en: "Roller-Compacted Dry Concrete (RCC)"
  },
  "type_SHOTCRETE": {
    ar: "الخرسانة المقذوبة (Shotcrete) - صب هيدروليكي فوري",
    fr: "Béton Projeté (Shotcrete / Voile mince)",
    en: "Sprayed Hydraulic Shotcrete (Shotcrete)"
  },
  "type_GPC": {
    ar: "الخرسانة الجيوبوليمرية الخضراء (GPC) - صديقة للبيئة بدون إسمنت",
    fr: "Béton Géopolymère Bas Carbone (B.G / Eco)",
    en: "Eco Geopolymer Cementless Concrete (GPC)"
  },
  "type_SHC": {
    ar: "الخرسانة ذاتية المعالجة (SHC) - كبسولات إغلاق الشقوق تلقائياً",
    fr: "Béton Auto-Cicatrisant (B.A.C / Self-Healing)",
    en: "Intelligent Self-Healing Bio Concrete (SHC)"
  },
  "type_RAC": {
    ar: "خرسانة الركام المعاد تدويره (RAC) - اقتصاد بيئي دائري",
    fr: "Béton de Granulats Recyclés (B.G.R / Green)",
    en: "Recycled Aggregate Eco Concrete (RAC)"
  },
  "type_PERVIOUS": {
    ar: "الخرسانة النفاذة للمياه (Pervious) - مسامية تامة لتصريف المطر",
    fr: "Béton Drainant Perméable (B.D / Water)",
    en: "Highly Pervious Drainage Concrete (Pervious)"
  },
  "type_UHPC": {
    ar: "الخرسانة فائقة الأداء (UHPC) - تصميم متقدم مستقل",
    fr: "Béton Fibré Ultra Haute Performance (B.F.U.H.P)",
    en: "Ultra-High Performance Concrete (UHPC)"
  },
  "type_BFUP": {
    ar: "الخرسانة الليفية فائقة الأداء (BFUP) - كربون مطيلي دقيق",
    fr: "Béton Fibré Ultra Performance (B.F.U.P)",
    en: "Ultra-High Performance Fibre Concrete (BFUP)"
  },

  // Methods
  "method_dreux": {
    ar: "طريقة درو-غوريس الفرنسية (Dreux-Gorisse)",
    fr: "Méthode Dreux-Gorisse (Française/Algérienne)",
    en: "Dreux-Gorisse French/Algerian Standard Method"
  },

  // Output list & headers
  "final_proportions": {
    ar: "الجرعات والكميات النهائية لكل 1 متر مكعب",
    fr: "Dosages et masses finales pour 1 m³",
    en: "Final Scale Proportions & Weights per 1 m³"
  },
  "dry_state": {
    ar: "حسب الحالة الجافة (Dry State)",
    fr: "État sec de laboratoire (Dry state)",
    en: "Dry Aggregate Laboratory Weights"
  },
  "wet_state": {
    ar: "حسب رطوبة الموقع الفعلية (Wet Scale State)",
    fr: "État humide ajusté au chantier (Balances)",
    en: "Wet Aggregate Site Scale Weights (Moist Adjusted)"
  },
  "cement": {
    ar: "الإسمنت",
    fr: "Ciment",
    en: "Portland Cement"
  },
  "water": {
    ar: "الماء الصافي",
    fr: "Eau efficace",
    en: "Mixing Water"
  },
  "sand": {
    ar: "الرمل",
    fr: "Sables (0/5)",
    en: "Fine Sand"
  },
  "gravel": {
    ar: "الحصى",
    fr: "Gravillons (5/D)",
    en: "Coarse Gravel"
  },
  "admixtures_total": {
    ar: "الإضافات الكيميائية والمعدنية",
    fr: "Adjuvants & Additions",
    en: "Admixtures & Minerals"
  },
  "wc_ratio_label": {
    ar: "نسبة الماء إلى الإسمنت (W/C Ratio):",
    fr: "Rapport Eau/Ciment (Rapport E/C) :",
    en: "Water/Cement Ratio (W/C Factor):"
  },
  "total_density_label": {
    ar: "الكثافة الحجمية الرطبة التقريبية للخرسانة:",
    fr: "Masse volumique fraîche calculée :",
    en: "Calculated Fresh Concrete Density:"
  },
  "total_mix_cost": {
    ar: "التكلفة الكلية المقدرة للخلطة:",
    fr: "Coût de revient estimé du béton :",
    en: "Estimated Total Mix Material Cost:"
  },

  // Units Pricing Sidebar/Tab
  "material_pricing_header": {
    ar: "إعدادات كلفة المواد وهيكل التسعير الإقليمي",
    fr: "Tarification des matériaux et structures de prix",
    en: "Material Unit Cost Settings & Regional Pricing"
  },
  "price_cement_label": {
    ar: "سعر طن أو كجم الإسمنت البورتلاندي الخالي:",
    fr: "Prix du Ciment Portland simple (par kg) :",
    en: "Cost of Portland Cement (per kg):"
  },
  "price_sand_label": {
    ar: "سعر طن أو كجم الرمل الناعم المغسول:",
    fr: "Prix du Sable fin criblé (par kg) :",
    en: "Cost of Fine Clean Sand (per kg):"
  },
  "price_gravel_label": {
    ar: "سعر طن أو كجم الركام الخشن المكسر:",
    fr: "Prix du Gravier concassé (par kg) :",
    en: "Cost of Coarse Crushed Gravel (per kg):"
  },
  "price_water_label": {
    ar: "كلفة لتر أو متر مكعب الماء المجهز:",
    fr: "Coût de l'Eau industrielle (par Litre) :",
    en: "Cost of Supply Water (per Litre):"
  },

  // General Status & Stats items
  "active_recipe": {
    ar: "التركيبة الحالية النشطة:",
    fr: "Formulation courante active :",
    en: "Currently Active Design Formula:"
  },
  "metric_units": {
    ar: "النظام المتري",
    fr: "Unités Métriques",
    en: "Metric System"
  },
  "step1_header": {
    ar: "متطلبات ومحددات المشروع (Project Specifications & Targets)",
    fr: "1. Spécifications et Objectifs du Projet",
    en: "1. Project Specifications & Targets"
  },
  "essential_step": {
    ar: "خطوة أساسية",
    fr: "Étape Essentielle",
    en: "Essential Step"
  },
  "c10_normal": {
    ar: "C10 (عادية)",
    fr: "C10 (Courante)",
    en: "C10 (Standard)"
  },
  "c25_structures": {
    ar: "C25 (هياكل)",
    fr: "C25 (Structures)",
    en: "C25 (Structural Structures)"
  },
  "c40_label": {
    ar: "C40",
    fr: "C40",
    en: "C40"
  },
  "c60_high_strength": {
    ar: "C60 (عالية جداً)",
    fr: "C60 (Très haute résistance)",
    en: "C60 (Ultra-High Strength)"
  },
  "selected_method_label": {
    ar: "طريقة التصميم المعتمدة (Selected Method):",
    fr: "Méthode de formulation sélectionnée :",
    en: "Selected Formulation Method:"
  },
  "selected_method_desc": {
    ar: "تم قفل وتوحيد نظام الحساب تلقائياً بالاعتماد الكامل والدائم على طريقة درو-غوريس الفرنسية المعتمدة (Dreux-Gorisse) لضمان أفضل تراص حبيبي عظمى ودقة الكثافة الرصية والتشغيلية بالموقع.",
    fr: "Le système de calcul est verrouillé sur la méthode française Dreux-Gorisse pour assurer une compacité granulaire optimale et une précision de densité.",
    en: "The calculation system is automatically locked to the standard French Dreux-Gorisse method to ensure optimal granular packing and density precision."
  },
  "dmax_dropdown_label": {
    ar: "أكبر قطر اسمي للركام (D_max size):",
    fr: "Taille maximale des gravillons D_max :",
    en: "Maximum Aggregate Grain Size D_max:"
  },
  "dmax_8": {
    ar: "8 مم (شديد النعومة)",
    fr: "8 mm (Trés fin)",
    en: "8 mm (Very Fine)"
  },
  "dmax_20": {
    ar: "20 مم (عياري مستخدم بكثرة)",
    fr: "20 mm (Standard courant)",
    en: "20 mm (Highly Standard)"
  },
  "dmax_40": {
    ar: "40 مم (كتل خرسانية ضخمة)",
    fr: "40 mm (Gros blocs/Massif)",
    en: "40 mm (Massive Blocks)"
  },
  "qc_high": {
    ar: "مصنعية ممتازة ومثالية (σ = 4 MPa)",
    fr: "Contrôle excellent/idéal (σ = 4 MPa)",
    en: "Excellent/Ideal Site QC (σ = 4 MPa)"
  },
  "qc_normal": {
    ar: "رقابة عيارية موقعية (σ = 6 MPa)",
    fr: "Contrôle standard/moyen (σ = 6 MPa)",
    en: "Standard Site QC (σ = 6 MPa)"
  },
  "qc_low": {
    ar: "صب بلدي عادي (σ = 8 MPa)",
    fr: "Contrôle faible/artisanal (σ = 8 MPa)",
    en: "Low/No Site QC (σ = 8 MPa)"
  },
  "pumping_title": {
    ar: "تحسين الخلطة لصب الروافع والمضخات الهيدروليكية (Pumpable Concrete):",
    fr: "Optimisation pour coulage par pompage (Béton Pompable) :",
    en: "Optimize mix for hydraulic pumping (Pumpable Concrete):"
  },
  "pumping_desc": {
    ar: "تعديل التدرج لتفادي التراكم والانسداد بالأنابيب",
    fr: "Ajustement granulaire pour éviter les blocages de tuyaux",
    en: "Adjust grading curves to avoid blockage and piping risks"
  },
  "step2_header": {
    ar: "التوصيات الهندسية المقترحة للصب (Suggested Engineering Recommendations)",
    fr: "2. Recommandations Techniques de Formulation",
    en: "2. Recommended Engineering Specifications"
  },
  "auto_card_generation": {
    ar: "توليد تلقائي للبطاقة",
    fr: "Génération Automatique",
    en: "Auto-Generated Card"
  },
  "step3_header": {
    ar: "اختيار المواد المستخدمة في الورشة (Materials Used Selection)",
    fr: "2. Sélection des Constituants Matériaux",
    en: "2. Site Materials & Constituents Selection"
  },
  "ready_for_matching": {
    ar: "جاهز للمطابقة",
    fr: "Prêt pour Validation",
    en: "Ready for Matching"
  },
  "cement_calibration": {
    ar: "إسمنت المعايرة:",
    fr: "Ciment calibré :",
    en: "Calibrated Cement:"
  },
  "cement_type_available": {
    ar: "نوع ومعايرة الإسمنت المتاح:",
    fr: "Type de ciment disponible :",
    en: "Available Cement Type:"
  },
  "cement_class_strength_label": {
    ar: "رتبة مقاومة صنف الإسمنت:",
    fr: "Classe de résistance du ciment :",
    en: "Cement Strength Class:"
  },
  "cem_32": {
    ar: "CEM 32.5 (منخفض الأشغال العامة)",
    fr: "CEM 32.5 (Basses résistances)",
    en: "CEM 32.5 (Low Strength/Civil works)"
  },
  "cem_42": {
    ar: "CEM 42.5 (عياري عادي للهياكل)",
    fr: "CEM 42.5 (Standard structures)",
    en: "CEM 42.5 (Standard Structural)"
  },
  "cem_52": {
    ar: "CEM 52.5 (فائق مقاوم للأبراج والشد السريع)",
    fr: "CEM 52.5 (Haute performance/Prise rapide)",
    en: "CEM 52.5 (High Performance/Rapid early)"
  },
  "sand_calibration": {
    ar: "الرمل الركام الدقيق:",
    fr: "Sable & Granulats fins :",
    en: "Fine Aggregates (Sands):"
  },
  "sand_types_available": {
    ar: "أصناف وجزيئات الرمل الركامي:",
    fr: "Classes et granulométrie du sable :",
    en: "Sand Grading Categories:"
  },
  "sand_influence_tip": {
    ar: "* يؤثر تباين الرمل (ناعم للأعمال أو خشن) في الهيكل بتغيير المساحة السطحية وتدقيق مياه المعايرة المطلوبة للتشغيلية.",
    fr: "* La finesse du sable (très fin ou grossier) modifie la surface spécifique et influe sur la demande en eau efficace.",
    en: "* Sand fineness (fine vs coarse) alters specific surface area and dictates water demand for optimal workability."
  },
  "gravel_calibration": {
    ar: "الحصمة والركام الخشن:",
    fr: "Gravillons & Gros granulats :",
    en: "Coarse Aggregates (Gravels):"
  },
  "gravel_types_available": {
    ar: "أصناف الركام المتطابق:",
    fr: "Classes de gravillons disponibles :",
    en: "Gravel Grading Categories:"
  },
  "grain_shape": {
    ar: "شكل الحبيبة:",
    fr: "Forme du grain :",
    en: "Grain Shape:"
  },
  "grain_shape_rounded": {
    ar: "مستديرة أملس",
    fr: "Roulé / Arrondi",
    en: "Rounded / Alluvial"
  },
  "grain_shape_crushed": {
    ar: "مكسر مقالع حاد",
    fr: "Concassé / Angulaire",
    en: "Crushed / Quarry"
  },
  "grading_quality": {
    ar: "جودة التدرج:",
    fr: "Qualité d'empilement :",
    en: "Grading Quality:"
  },
  "grading_excellent": {
    ar: "نقي تدرج تام",
    fr: "Excellente et complète",
    en: "Excellent / Well-graded"
  },
  "grading_standard": {
    ar: "عياري مطابق",
    fr: "Standard conforme",
    en: "Standard compliant"
  },
  "grading_poor": {
    ar: "متوسط ضعيف",
    fr: "Faible / Mal calibré",
    en: "Poor / Gap-graded"
  },
  "suggested_additives": {
    ar: "الإضافات المقترحة:",
    fr: "Adjuvants suggérés :",
    en: "Suggested Admixtures:"
  },
  "active_chemical_additives": {
    ar: "💡 المضافات النشطة كيميائياً:",
    fr: "💡 Adjuvants chimiques actifs :",
    en: "💡 Active Chemical Admixtures:"
  },
  "adjust_dosages_tip": {
    ar: "يمكنك تعديل نسب جرعات الإضافات بدقة متكاملة بالخطوة الأخيرة (6).",
    fr: "Vous pouvez ajuster finement les dosages des adjuvants à l'étape finale (6).",
    en: "You can finely customize active dosages of all modifiers in the final step (6)."
  },
  "step4_header": {
    ar: "خصائص المواد المستخدمة وتأثيرها (Engineering Materials Properties Dashboard)",
    fr: "3. Propriétés Techniques des Constituants",
    en: "3. Constituent Material Properties Dashboard"
  },
  "smart_auto_generation": {
    ar: "توليد تلقائي ذكي",
    fr: "Génération Auto",
    en: "Intelligent Auto-Generation"
  },
  "expert_manual_input": {
    ar: "إدخال يدوي للخبير",
    fr: "Saisie Manuelle (Expert)",
    en: "Expert Manual Entry"
  },
  "step4_desc": {
    ar: "تتغير خصائص هذا القسم (الكثافة، معامل الامتصاص، التوصيات الإنشائية، الاستخدامات المقترحة للتطبيق) تلقائياً بناءً على أصناف المواد المعتمدة بالخطوة (2).",
    fr: "Les propriétés de cette section (masses volumiques, absorption, préconisations d'usage) sont synchronisées avec les choix de l'étape (2).",
    en: "Section properties (densities, water absorption, engineering tips) update automatically based on constituents selected in Step (2)."
  },
  "expert_density_overrides": {
    ar: "تعديلات يدوية متقدمة لكثافة المواد بالصب (Expert Density Overrides):",
    fr: "Ajustements manuels avancés des masses volumiques :",
    en: "Expert Manual Material Density Overrides:"
  },
  "expert_mode_active": {
    ar: "وضع الخبير نشط",
    fr: "Mode Expert Actif",
    en: "Expert Mode Active"
  },
  "cement_abs_density": {
    ar: "كثافة الإسمنت المطلقة:",
    fr: "Masse volumique absolue du ciment :",
    en: "Absolute Cement Density:"
  },
  "sand_abs_density": {
    ar: "كثافة الرمل المطلقة:",
    fr: "Masse volumique absolue du sable :",
    en: "Absolute Sand Density:"
  },
  "gravel_abs_density": {
    ar: "كثافة الحصى المطلقة:",
    fr: "Masse volumique absolue du gravier :",
    en: "Absolute Gravel Density:"
  },
  "step5_header": {
    ar: "رطوبة الركامات الموقعية بالورشة (Site Moisture & Actual Field Corrections)",
    fr: "4. Corrections de Teneur en Eau & Humidité Chantier",
    en: "4. Site Constituents Moisture Corrections"
  },
  "scale_weights_calibration": {
    ar: "معايرة أوزان القبان",
    fr: "Calibrage des Balances",
    en: "Scale Weights Calibration"
  },
  "step5_desc": {
    ar: "تحتوي الركامات المخزنة في الهواء الطلق بالورشة على رطوبة مجهرية تؤثر بشكل حاد على أوزان الصب والمياه. يقوم النظام بخصم الميارة الزائدة بالركام وإعادة معايرة المياه بالخام.",
    fr: "L'humidité du sable et gravier stockés influe fortement sur l'eau efficace. Le système ajuste la quantité d'eau ajoutée et corrige les masses de pesage.",
    en: "Stored site aggregates carry moisture that impacts target water. The system automatically discounts excess moisture and re-calibrates batch weights."
  },
  "sand_moisture_label": {
    ar: "رطوبة الرمل الصافية (Sand Moisture):",
    fr: "Humidité superficielle du sable :",
    en: "Sand Surface Moisture Content:"
  },
  "sand_moisture_range": {
    ar: "تدرج بين 0% رمل تام الجفاف إلى 8% رمل شديد البلل بالأمطار",
    fr: "Sable totalement sec (0%) jusqu'à très humide après pluie (8%)",
    en: "Spans 0% (fully dry sand) to 8% (highly saturated sand after heavy rain)"
  },
  "gravel_moisture_label": {
    ar: "رطوبة الحصى والركام الخشن (Gravel Moisture):",
    fr: "Humidité superficielle du gravier :",
    en: "Gravel Surface Moisture Content:"
  },
  "gravel_moisture_range": {
    ar: "تتراوح رطوبة الحصى الصخرية العادية بالساحة بين 0% إلى 4% كحد أقصى مسموح",
    fr: "L'humidité du gravier varie de 0% à un maximum conseillé de 4%",
    en: "Gravel moisture typically ranges from 0% to a maximum allowed 4%"
  },
  "sand_absorption_label": {
    ar: "امتصاص الرمل للماء (Sand Absorption):",
    fr: "Absorption d'eau du sable :",
    en: "Sand Water Absorption:"
  },
  "sand_absorption_range": {
    ar: "النسبة المئوية لامتصاص حبات الرمل للمياه وتتراوح عادة بين 0% إلى 4%",
    fr: "Pourcentage d'eau absorbée par le sable (typiquement 0% à 4%)",
    en: "Percentage of water absorbed by sand particles (typically 0% to 4%)"
  },
  "gravel_absorption_label": {
    ar: "امتصاص الحصى للماء (Gravel Absorption):",
    fr: "Absorption d'eau du gravier :",
    en: "Gravel Water Absorption:"
  },
  "gravel_absorption_range": {
    ar: "النسبة المئوية لامتصاص الحصى للمياه وتتراوح عادة بين 0% إلى 3%",
    fr: "Pourcentage d'eau absorbée par le gravier (typiquement 0% à 3%)",
    en: "Percentage of water absorbed by gravel particles (typically 0% to 3%)"
  },
  "step6_header": {
    ar: "معاملات موازنة التصميم الهيدرولوجي (Automatic Engineering Coefficients)",
    fr: "5. Coefficients d'Ajustement Méthodologiques",
    en: "5. Design Method Adjustments & Coefficients"
  },
  "auto_coefficients_active": {
    ar: "معاملات تلقائية نشطة",
    fr: "Coefficients Actifs",
    en: "Auto Coefficients Active"
  },
  "manual_expert_tuning": {
    ar: "تعديل تجريبي يدوي",
    fr: "Réglage Expert Manuel",
    en: "Manual Expert Tuning"
  },
  "step6_desc": {
    ar: "التكامل الهيدرولوجي الذكي نشط: يقوم النظام بحساب وتطبيق معاملات التصميم التالية تلقائياً بناءً على طريقة الحساب المعتمدة ونوع الخرسانة لضمان المطابقة الهندسية دون حشو يدوي.",
    fr: "Ajustement intelligent actif : les coefficients ci-dessous sont calculés automatiquement selon la méthode sélectionnée pour garantir la conformité.",
    en: "Intelligent engineering integrations: the system auto-calculates and applies these constants to enforce standards compliance without manual guessworks."
  },
  "wc_ratio_coef": {
    ar: "نسبة مياه الخلط للاسمنت (W/C Ratio):",
    fr: "Rapport Eau/Ciment (E/C) :",
    en: "Water/Cement Ratio (W/C Ratio):"
  },
  "packing_factor_coef": {
    ar: "معامل رص الخرسانة (Packing Index γ):",
    fr: "Coefficient de compacité (Indice de serrage γ) :",
    en: "Concrete Packing Index (Compacting Coefficient γ):"
  },
  "step7_header": {
    ar: "إضافات كيميائية ومعدنية ومحسنات تماسك الخلطة (Mineral & Chemical Admixtures)",
    fr: "6. Adjuvants Chimiques et Additions Minérales",
    en: "6. Mineral, Chemical Admixtures & Modifiers"
  },
  "independent_chem_lab": {
    ar: "معمل كيميائي مستقل",
    fr: "Laboratoire Chimique",
    en: "Active Chemistry Modifiers"
  },
  "step7_desc": {
    ar: "تسمح الإضافات بتفوق أداء الخرسانة بتقليل ماء صب الخلاط مع زيادة السيولة ومنع الانفصال الحبيبي تدريجياً. التعديل في النسب التالية سيبسط ويعدل أوزان الإسمنت آلياً.",
    fr: "Les adjuvants optimisent le béton en réduisant l'eau de gâchage, augmentant l'affaissement et limitant la ségrégation.",
    en: "Active additions enhance hydration efficiency, decreasing water demand while increasing flowability. Adjusting sliders alters water and cement demand automatically."
  },
  "superplasticizer_label": {
    ar: "ملدن رئيسي فائق (Superplasticizer):",
    fr: "Superplastifiant (Dosage massique) :",
    en: "High-Range Superplasticizer (SP Dosage):"
  },
  "superplasticizer_desc": {
    ar: "يقلل ماء الخلط الفعلي لما يصل لغاية -33٪ للرتب العالية",
    fr: "Réduit l'eau efficace de gâchage jusqu'à -33% pour bétons spéciaux",
    en: "Permits a massive water reduction of up to -33% in specialized high-grade mixes"
  },
  "silica_fume_label": {
    ar: "غبار السيليكا الميكروية (Silica Fume):",
    fr: "Fumée de silice (Dosage massique) :",
    en: "Micro-Silica Fume (SF Dosage):"
  },
  "silica_fume_desc": {
    ar: "يضاعف متانة الهيكل ومقاومة النفاذية للكلوريدات الكيماوية",
    fr: "Améliore grandement la durabilité et la résistance aux agents agressifs",
    en: "Multiplies chemical durability and seals voids against aggressive chloride ingress"
  },
  "fly_ash_label": {
    ar: "الرماد المتطاير الكروي الحجمي (Fly Ash):",
    fr: "Cendres volantes (Dosage massique) :",
    en: "Spherical Pulverized Fly Ash (FA Dosage):"
  },
  "fly_ash_desc": {
    ar: "يخفض وبقوة حرارة التفاعل الكهروكيميائي للإسمنت بالهياكل الضخمة",
    fr: "Réduit fortement la chaleur d'hydratation lors de coulage massif",
    en: "Strongly dampens early hydration heat development during mass concrete pours"
  },
  
  // Unified Materials Database Translations
  "unified_materials_database": {
    ar: "المصدر الموحد والمحيط الهندسي للمواد والركام الإنشائي",
    fr: "Base de données unifiée des matériaux et granulats",
    en: "Unified Construction Materials & Aggregates Database"
  },
  "unified_materials_desc": {
    ar: "قاعدة بيانات مركزية مطورة لرصد ومزامنة ركامات ومكونات المواد والتحضيرات الإنشائية. تتم مزامنة الكثافة، الامتصاص، والمعاميل الهندسية تلقائياً دون تكرار.",
    fr: "Base centrale pour suivre et synchroniser les granulats et constituants. Densité, absorption et coefficients sont synchronisés sans doublon.",
    en: "Centralized database for tracing and synchronizing aggregates and components. Density, absorption, and coefficients update automatically."
  },
  "add_and_guess_material_ai": {
    ar: "إضافة وتخمين مادة بالـ AI",
    fr: "Ajouter et estimer avec l'IA",
    en: "Add & Estimate Material with AI"
  },
  "search_materials_placeholder": {
    ar: "البحث باسم المادة، المنطقة، أو المواصفات...",
    fr: "Rechercher par nom, région ou spécification...",
    en: "Search by material name, provenance, or spec..."
  },
  "all_technical_grades": {
    ar: "كل الرتب الفنية",
    fr: "Toutes les qualités",
    en: "All Quality Grades"
  },
  "premium_quality_grade": {
    ar: "جودة فائقة وممتازة (Premium)",
    fr: "Haute qualité & Premium",
    en: "Premium Quality Grade"
  },
  "standard_quality_grade": {
    ar: "رتبة قياسية نموذجية (Standard)",
    fr: "Qualité standard conforme",
    en: "Standard Quality Grade"
  },
  "eco_quality_grade": {
    ar: "بيئية وبديلة (Eco-Friendly / SCM)",
    fr: "Écologique & SCM",
    en: "Eco-Friendly & SCM"
  },
  "all_geographic_regions": {
    ar: "كل الأقاليم الجغرافية",
    fr: "Toutes les régions",
    en: "All Geographic Regions"
  },
  "filtered_materials_count": {
    ar: "عدد المواد بعد الترشيح: ",
    fr: "Matériaux après filtrage : ",
    en: "Filtered materials count: "
  },
  "materials_count_unit": {
    ar: " مادة",
    fr: " matériaux",
    en: " materials"
  },
  "show_favorites_only": {
    ar: "عرض المفضلة فقط",
    fr: "Favoris uniquement",
    en: "Show Favorites Only"
  },
  "active_in_mix": {
    ar: "نشط بالخلطة",
    fr: "Actif dans le mélange",
    en: "Active in Mix"
  },
  "no_matching_results": {
    ar: "لم يتم العثور على أي نتائج مطابقة للبحث!",
    fr: "Aucun résultat trouvé !",
    en: "No matching results found!"
  },
  "adjust_search_criteria": {
    ar: "يرجى تعديل معايير البحث والترشيح أو إضافة مادة جديدة من الزر بالأعلى.",
    fr: "Veuillez modifier vos critères ou ajouter un nouveau matériau.",
    en: "Please modify your search criteria or add a new material above."
  },
  "material_density": {
    ar: "كثافة",
    fr: "Densité",
    en: "Density"
  },
  "technical_passport": {
    ar: "البطاقة الفنية وجواز المعايرة والاعتماد (Technical Passport)",
    fr: "Passeport technique et homologation",
    en: "Technical Passport & Compliance"
  },
  "unique_material_id": {
    ar: "المعرف الفريد للمادة:",
    fr: "ID unique du matériau :",
    en: "Unique Material ID:"
  },
  "current_material_version": {
    ar: "إصدار المادة الحالي:",
    fr: "Version actuelle :",
    en: "Current Material Version:"
  },
  "certified_supplier": {
    ar: "الجهة الموردة المعتمدة:",
    fr: "Fournisseur agréé :",
    en: "Certified Approved Supplier:"
  },
  "original_geological_quarry": {
    ar: "المقلع الجيولوجي الأصلي:",
    fr: "Carrière d'origine :",
    en: "Original Geological Quarry:"
  },
  "geographic_provenance": {
    ar: "الإقليم أو الموقع الجغرافي:",
    fr: "Provenance géographique :",
    en: "Geographical Region:"
  },
  "certified_laboratory": {
    ar: "المخبر الجيولوجي المصدق:",
    fr: "Laboratoire de certification :",
    en: "Certified Laboratory:"
  },
  "reference_standard": {
    ar: "المواصفة المعيارية المرجعية:",
    fr: "Norme de référence :",
    en: "Reference Standard:"
  },
  "certification_number": {
    ar: "رقم شهادة الفحص المعتمد:",
    fr: "N° de certification :",
    en: "Certification/QA Certificate Number:"
  },
  "technical_approval_date": {
    ar: "تاريخ الاعتماد والموافقة الفنية:",
    fr: "Date d'homologation technique :",
    en: "Technical Approval Date:"
  },
  "approval_workflow_status": {
    ar: "جودة واعتماد مسار العمل (Approval Workflow):",
    fr: "Statut du flux d'approbation :",
    en: "Approval Workflow Status:"
  },
  "status_approved": {
    ar: "معتمد للصب الهندسي (Approved)",
    fr: "Agréé pour coulage (Approved)",
    en: "Certified for Engineering (Approved)"
  },
  "status_validated": {
    ar: "🟢 معتمدة (Validated)",
    fr: "🟢 Validée",
    en: "🟢 Validated"
  },
  "status_incomplete": {
    ar: "🟡 غير مكتملة (Incomplete)",
    fr: "🟡 Incomplète",
    en: "🟡 Incomplete"
  },
  "status_not_verified": {
    ar: "🔴 غير مراجعة (Not Verified)",
    fr: "🔴 Non vérifiée",
    en: "🔴 Not Verified"
  },
  "status_under_review": {
    ar: "قيد المراجعة الفنية (Under Review)",
    fr: "En cours de révision technique (Under Review)",
    en: "Under Technical Review"
  },
  "status_archived": {
    ar: "مؤرشف مستبعد (Archived)",
    fr: "Archivé (Archived)",
    en: "Archived"
  },
  "status_rejected": {
    ar: "مستبعد وغير مطابق (Rejected)",
    fr: "Rejeté / Non conforme (Rejected)",
    en: "Rejected / Non-compliant"
  },
  "status_draft": {
    ar: "🔵 مسودة (Draft)",
    fr: "🔵 Brouillon (Draft)",
    en: "🔵 Draft"
  },
  "geological_purity_certificates": {
    ar: "الشهادات ونقاوة المركب الجيولوجية",
    fr: "Certificats et pureté géologique",
    en: "Geological Purity & Certificates"
  },
  "suitable_engineering_applications": {
    ar: "التواصل والتطبيقات الإنشائية المناسبة",
    fr: "Applications structurelles adaptées",
    en: "Suitable Construction Applications"
  },
  "generate_texture_ai": {
    ar: "توليد قوام بالـ AI",
    fr: "Générer texture avec l'IA",
    en: "Generate Texture with AI"
  },
  "approved_active_in_mix": {
    ar: "معتمد نشط بالخلطة",
    fr: "Validé comme constituant actif",
    en: "Approved & Active in Mix"
  },
  "apply_as_standard_sand": {
    ar: "اعتماد كرمل عياري",
    fr: "Valider comme sable standard",
    en: "Apply as Standard Sand"
  },
  "apply_as_standard_gravel": {
    ar: "اعتماد كحصى عياري",
    fr: "Valider comme gravier standard",
    en: "Apply as Standard Gravel"
  },
  "apply_as_mix_cement": {
    ar: "اعتماد كإسمنت الخلط",
    fr: "Valider comme ciment de gâchée",
    en: "Apply as Mix Cement"
  },
  "apply_as_chemical_admixture": {
    ar: "اعتماد كإضافة كيميائية",
    fr: "Valider comme adjuvant chimique",
    en: "Apply as Chemical Admixture"
  },
  "apply_as_mineral_addition": {
    ar: "اعتماد كإضافة معدنية (SCM)",
    fr: "Valider comme addition minérale",
    en: "Apply as Mineral Addition (SCM)"
  },
  "apply_as_mixing_water": {
    ar: "اعتماد كمياه الخلط",
    fr: "Valider comme eau de gâchée",
    en: "Apply as Mixing Water"
  },
  "apply_as_light_aggregate": {
    ar: "اعتماد كركام خفيف الوزن",
    fr: "Valider comme granulat léger",
    en: "Apply as Lightweight Aggregate"
  },
  "apply_as_heavy_aggregate": {
    ar: "اعتماد كركام ثقيل الوزن",
    fr: "Valider comme granulat lourd",
    en: "Apply as Heavyweight Aggregate"
  },
  "apply_as_fiber_reinforcement": {
    ar: "اعتماد كألياف تسليح",
    fr: "Valider comme fibres de renforcement",
    en: "Apply as Fiber Reinforcement"
  },
  "apply_as_air_entrainer": {
    ar: "اعتماد كمعدل محتوى الهواء",
    fr: "Valider comme entraîneur d'air",
    en: "Apply as Air Entraining Admixture"
  },
  "apply_as_special_binder": {
    ar: "اعتماد كرابط إسمنتي خاص",
    fr: "Valider comme liant spécial",
    en: "Apply as Special Binder"
  },
  "apply_material_to_mix": {
    ar: "اعتماد المادة بالخلطة",
    fr: "Valider le matériau dans le mélange",
    en: "Apply Material to Mix"
  },
  "please_select_material_details": {
    ar: "يرجى اختيار مادة من الكتالوج لعرض مواصفاتها الكيميائية وتفاصيلها الهندسية!",
    fr: "Veuillez sélectionner un matériau du catalogue pour voir ses détails techniques.",
    en: "Please select a material from the catalog to display its chemical specs and engineering details!"
  },
  "confirm_permanent_deletion": {
    ar: "تأكيد الحذف النهائي للمادة",
    fr: "CONFIRMER LA SUPPRESSION DÉFINITIVE",
    en: "CONFIRM PERMANENT DELETION"
  },
  "delete_material_permanently": {
    ar: "حذف المادة نهائياً: ",
    fr: "Supprimer définitivement le matériau : ",
    en: "Delete material permanently: "
  },
  "delete_material_warning": {
    ar: "سيتم إزالة هذه المادة الإنشائية بالكامل وبصفة نهائية من كتالوج المواد ومستودع البيانات. لا يمكن التراجع عن هذا الإجراء بعد التأكيد.",
    fr: "Ce matériau de construction sera définitivement retiré du catalogue et du dépôt de données. Cette action est irréversible.",
    en: "This construction material will be completely and permanently removed from the materials catalog and database. This action cannot be undone."
  },
  "cancel_action": {
    ar: "إلغاء الأمر",
    fr: "Annuler",
    en: "Cancel"
  },
  "confirm_delete_button": {
    ar: "نعم، احذف نهائياً",
    fr: "Oui, supprimer définitivement",
    en: "Yes, Delete Permanently"
  },
  "ai_material_advisor_title": {
    ar: "مساعد SNO AI الاستشاري للمواد",
    fr: "Conseiller SNO IA pour matériaux",
    en: "SNO AI Materials Advisor"
  },
  "dynamic_advisor_subtitle": {
    ar: "مستشار ديناميكي",
    fr: "Conseiller Dynamique",
    en: "Dynamic Advisor"
  },
  "no_diagnostic_warnings": {
    ar: "✅ نتائج الفحص المخبري للمادة سليمة تماماً ومطابقة ضمن حدود المواصفات الفنية المعتمدة للجمهورية الجزائرية.",
    fr: "✅ Résultats d'analyses de laboratoire entièrement conformes aux spécifications techniques algériennes.",
    en: "✅ Lab diagnostic results are fully compliant with approved Algerian technical standards."
  },
  "compatibility_matrix_title": {
    ar: "مصفوفة التوافق التبادلي للمواد",
    fr: "Matrice de compatibilité réciproque",
    en: "Cross-Material Compatibility Matrix"
  },
  "full_compatibility_label": {
    ar: "متوافق بالكامل",
    fr: "Compatibilité Totale",
    en: "Fully Compatible"
  },
  "with_local_cement": {
    ar: "مع الإسمنت المحلي الشلف (MAT-CEM-30001):",
    fr: "Avec le ciment local de Chlef (MAT-CEM-30001) :",
    en: "With local Chlef cement (MAT-CEM-30001):"
  },
  "full_compatibility_desc": {
    ar: "توافق كيميائي يضمن تجانس الترابط الإنشائي ومعدلات تبلور مثالية لبلورات غليكول الكالسيوم دون ترشيح أو نضح سطحي.",
    fr: "La compatibilité chimique assure l'homogénéité de la liaison structurelle et des taux d'hydratation optimaux sans ressuage.",
    en: "Chemical compatibility ensures structural bond homogeneity and optimal hydration rates without bleeding."
  },
  "suitability_warning_label": {
    ar: "تنبيه ملاءمة",
    fr: "Alerte de compatibilité",
    en: "Compatibility Warning"
  },
  "with_superplasticizers": {
    ar: "مع الملدنات الفائقة (MAT-ADM-50001):",
    fr: "Avec les superplastifiants (MAT-ADM-50001) :",
    en: "With superplasticizers (MAT-ADM-50001):"
  },
  "suitability_warning_desc": {
    ar: "يتطلب ضبط نسب الماء للتأكد من عدم حدوث سيولة تسرب زائدة قد تسبب تجوف الركام في القوالب.",
    fr: "Nécessite d'ajuster les ratios d'eau pour éviter une fluidité excessive pouvant provoquer la ségrégation des granulats.",
    en: "Requires adjusting water ratios to avoid excessive fluidity that could cause aggregate segregation."
  },
  "engineering_audit_trail_title": {
    ar: "تتبع التعديلات والمسار الهندسي للأثـر (Engineering Audit Trail)",
    fr: "Tracé d'audit et historique d'ingénierie",
    en: "Engineering Audit Trail & Changes Tracker"
  },
  "total_material_version": {
    ar: "إصدار المادة الكلي: v",
    fr: "Version globale du matériau : v",
    en: "Total Material Version: v"
  },
  "first_registered_date": {
    ar: "تاريخ الإدراج الأول: ",
    fr: "Date d'enregistrement initiale : ",
    en: "First Registration Date: "
  },
  "first_registered_desc": {
    ar: "تسجيل المادة بالبرنامج مع الفحوصات المخبرية الجافة الأولية.",
    fr: "Enregistrement du matériau avec les premiers tests en laboratoire à sec.",
    en: "Initial material registration along with dry laboratory testing."
  },
  "by_author": {
    ar: "بواسطة: ",
    fr: "par : ",
    en: "by: "
  },
  "quarry_owner_label": {
    ar: "جهة التوريد/المالك: ",
    fr: "Fournisseur / Propriétaire : ",
    en: "Supplier / Owner: "
  },
  "registered_by_label": {
    ar: "سجلت بواسطة: ",
    fr: "Enregistré par : ",
    en: "Registered by: "
  },
  "central_system_sno_ai": {
    ar: "النظام المركزي لـ SNO AI",
    fr: "Système Central SNO IA",
    en: "SNO AI Central System"
  },
  "date_added_label": {
    ar: "تاريخ الإدراج: ",
    fr: "Date d'ajout : ",
    en: "Date Added: "
  },
  "updated_active_label": {
    ar: "تنشيط وتحديث: ",
    fr: "Dernière mise à jour : ",
    en: "Last Updated/Active: "
  },
  "geological_purity_title": {
    ar: "الشهادات ونقاوة المركب الجيولوجية",
    fr: "Certificats et pureté géologique",
    en: "Geological Purity & Certificates"
  },
  "suitable_applications_title": {
    ar: "التواصل والتطبيقات الإنشائية المناسبة",
    fr: "Applications structurelles adaptées",
    en: "Suitable Construction Applications"
  },

  // Categories mapping
  "cat_all": {
    ar: "الكل",
    fr: "Tous",
    en: "All"
  },
  "cat_cement": {
    ar: "إسمنت",
    fr: "Ciment",
    en: "Cement"
  },
  "cat_water": {
    ar: "ماء",
    fr: "Eau",
    en: "Water"
  },
  "cat_sand": {
    ar: "رمال",
    fr: "Sable",
    en: "Sand"
  },
  "cat_gravel": {
    ar: "حصى",
    fr: "Gravier",
    en: "Gravel"
  },
  "cat_light_gravel": {
    ar: "ركام خفيف",
    fr: "Granulat Léger",
    en: "Lightweight Aggregate"
  },
  "cat_heavy_gravel": {
    ar: "ركام ثقيل",
    fr: "Granulat Lourd",
    en: "Heavyweight Aggregate"
  },
  "cat_admixture": {
    ar: "إضافات كيميائية",
    fr: "Adjuvants Chimiques",
    en: "Chemical Admixtures"
  },
  "cat_scm": {
    ar: "إضافات معدنية",
    fr: "Additions Minérales",
    en: "Mineral Additions (SCM)"
  },
  "cat_fibers": {
    ar: "ألياف",
    fr: "Fibres",
    en: "Fibers"
  },
  "cat_air": {
    ar: "محتوى الهواء",
    fr: "Entraîneur d'Air",
    en: "Air Entrainment"
  },
  "cat_special": {
    ar: "مجلدات خاصة",
    fr: "Liants Spéciaux",
    en: "Special Binders"
  },
  "cat_filler": {
    ar: "مواد مالئة",
    fr: "Charges / Fillers",
    en: "Fillers / Powders"
  }
};

// Compile all translations by combining the hardcoded dictionary with loaded JSON profiles.
const fullDictionary: TranslationDict = {};

// We initialize fullDictionary with all keys from standard files
const allKeys = new Set([
  ...Object.keys(TECHNICAL_DICTIONARY),
  ...Object.keys(arData),
  ...Object.keys(frData),
  ...Object.keys(enData)
]);

for (const key of allKeys) {
  fullDictionary[key] = {
    ar: (arData as any)[key] || TECHNICAL_DICTIONARY[key]?.ar || "",
    fr: (frData as any)[key] || TECHNICAL_DICTIONARY[key]?.fr || "",
    en: (enData as any)[key] || TECHNICAL_DICTIONARY[key]?.en || ""
  };
}

// Track requested translation audits at runtime (Language Audit Tool data source)
interface UntranslatedLog {
  key: string;
  count: number;
}
export const UNTRANSLATED_KEYS: UntranslatedLog[] = [];

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRtl: boolean;
  dir: "rtl" | "ltr";
  getAuditReport: () => Array<{ key: string; ar: string; fr: string; en: string; status: "Complete" | "Missing Translation" }>;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("app_lang");
    return (saved as Language) || "ar";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app_lang", lang);
  };

  const isRtl = language === "ar";
  const dir = isRtl ? "rtl" : "ltr";

  useEffect(() => {
    // Synchronize HTML metadata
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language, dir]);

  const t = (key: string): string => {
    if (!key) return "";
    const translation = fullDictionary[key];
    if (!translation) {
      console.warn(`[I18N Missing] Key "${key}" does not exist in the translation dictionary.`);
      const existing = UNTRANSLATED_KEYS.find(u => u.key === key);
      if (existing) {
        existing.count += 1;
      } else {
        UNTRANSLATED_KEYS.push({ key, count: 1 });
      }
      return key;
    }

    const val = translation[language];
    if (val && val !== "") {
      return val;
    }

    // Key exists but is not translated under the requested language.
    // Dynamic Safe fallback: en -> ar -> key
    console.warn(`[I18N Fallback] Translation missing for key "${key}" in language "${language}". Falling back to English/Arabic.`);
    return translation["en"] || translation["ar"] || key;
  };

  const getAuditReport = () => {
    return Object.keys(fullDictionary).map(key => {
      const val = fullDictionary[key];
      const hasAr = !!val.ar;
      const hasFr = !!val.fr;
      const hasEn = !!val.en;
      const complete = hasAr && hasFr && hasEn;
      return {
        key,
        ar: val.ar || key,
        fr: val.fr || key,
        en: val.en || key,
        status: complete ? ("Complete" as const) : ("Missing Translation" as const)
      };
    });
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl, dir, getAuditReport }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export function getLocalizedValue(obj: any, language: Language): string {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  if (obj[language]) return obj[language];
  return obj["en"] || obj["ar"] || obj["fr"] || "";
}

