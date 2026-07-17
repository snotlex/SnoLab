import React from "react";
import { motion } from "motion/react";
import { MixDesignInput, MixDesignResult } from "../engine/types";
import { CONCRETE_TYPE_CONFIGS } from "../concreteTypes";
import { 
  Activity, 
  Scale, 
  Droplet, 
  Layers, 
  TrendingUp, 
  CheckCircle2, 
  HelpCircle,
  AlertTriangle,
  Beaker,
  Info,
  BookOpen
} from "lucide-react";

interface LogicalResultsSummaryProps {
  inputs: MixDesignInput;
  results: MixDesignResult;
  language: "ar" | "fr" | "en";
  materialsDatabase?: any[];
  setActiveSidebarTab?: (tab: string) => void;
}

export const LogicalResultsSummary: React.FC<LogicalResultsSummaryProps> = ({
  inputs,
  results,
  language,
  materialsDatabase,
  setActiveSidebarTab
}) => {
  const isRtl = language === "ar";
  const isAr = language === "ar";
  const isFr = language === "fr";
  const isEn = language === "en";
  const batchVol = inputs.batchVolume !== undefined ? inputs.batchVolume : 1;

  const concreteCode = (inputs.concreteType || "NSC").toUpperCase();
  const activeConfig = CONCRETE_TYPE_CONFIGS[concreteCode];

  // Compile list of dynamic engineering errors due to missing data/properties
  const engineeringErrors: Array<{
    id: string;
    message: string;
    recommendation: string;
    actionType?: "add" | "edit";
    materialId?: string;
  }> = [];

  const materialsList = materialsDatabase || [];

  if (activeConfig) {
    // Validate Sand Aggregate (الرمل)
    if (!inputs.selectedSandId) {
      engineeringErrors.push({
        id: "missing_sand",
        message: isAr ? "مادة الركام الناعم (الرمل) المطلوبة غير موجودة في مستودع المواد." : "Required sand aggregate material was not found in the Material Repository.",
        recommendation: isAr ? "يرجى إضافة هذه المادة وإكمال كافة خواصها الهندسية المطلوبة قبل الاستمرار." : "Please add this material and complete all required engineering properties before continuing.",
        actionType: "add"
      });
    } else {
      const sand = materialsList.find(m => m.id === inputs.selectedSandId);
      if (!sand) {
        engineeringErrors.push({
          id: "missing_sand_not_found",
          message: isAr ? "مادة الركام الناعم (الرمل) المطلوبة غير موجودة في مستودع المواد." : "Required sand aggregate material was not found in the Material Repository.",
          recommendation: isAr ? "يرجى إضافة هذه المادة وإكمال كافة خواصها الهندسية المطلوبة قبل الاستمرار." : "Please add this material and complete all required engineering properties before continuing.",
          actionType: "add"
        });
      } else {
        const isApp = sand.ApprovalStatus === "Validated" || sand.ApprovalStatus === "Approved" || sand.ApprovalStatus === "Certified" || sand.ApprovalStatus?.toLowerCase() === "approved";
        if (!isApp) {
          engineeringErrors.push({
            id: `unvalidated_sand_${sand.id}`,
            message: isAr ? `حالة اعتماد الرمل "${sand.name}" غير صالحة للخلطة (الحالة الحالية: Draft/مسودة).` : `This material "${sand.name}" cannot be used until its status is set to Validated.`,
            recommendation: isAr ? "لا يمكن استخدام هذه المادة في الحسابات حتى يتم إكمال كافة البيانات الإلزامية وتعديل حالة الاعتماد إلى 'معتمد' (Validated) في مستودع المواد." : "This material cannot be used until all mandatory engineering properties have been completed and its status is set to Validated.",
            actionType: "edit",
            materialId: sand.id
          });
        }

        // Check individual properties for Sand
        const density = sand.ssdDensity || sand.density || sand.relativeDensity || sand.specificGravity;
        if (!density || density <= 0) {
          engineeringErrors.push({
            id: `missing_sand_density_${sand.id}`,
            message: isAr ? `الخصائص الناقصة للرمل "${sand.name}": الوزن النوعي / الكثافة المطلقة (SSD Density)` : `This material "${sand.name}" cannot be used until SSD Density is completed.`,
            recommendation: isAr ? "لا يمكن استخدام هذه المادة في الحسابات حتى يتم تعبئة الوزن النوعي / الكثافة المطلقة (SSD Density) في مستودع المواد." : "This material cannot be used until SSD Density is completed.",
            actionType: "edit",
            materialId: sand.id
          });
        }
        if (!sand.bulkDensity || sand.bulkDensity <= 0) {
          engineeringErrors.push({
            id: `missing_sand_bulk_density_${sand.id}`,
            message: isAr ? `الخصائص الناقصة للرمل "${sand.name}": الكثافة الظاهرية (Bulk Density)` : `This material "${sand.name}" cannot be used until Bulk Density is completed.`,
            recommendation: isAr ? "لا يمكن استخدام هذه المادة في الحسابات حتى يتم تعبئة الكثافة الظاهرية (Bulk Density) في مستودع المواد." : "This material cannot be used until Bulk Density is completed.",
            actionType: "edit",
            materialId: sand.id
          });
        }
        if (sand.absorption === undefined || sand.absorption < 0) {
          engineeringErrors.push({
            id: `missing_sand_absorption_${sand.id}`,
            message: isAr ? `الخصائص الناقصة للرمل "${sand.name}": معامل امتصاص الماء (Water Absorption)` : `This material "${sand.name}" cannot be used until Water Absorption is completed.`,
            recommendation: isAr ? "لا يمكن استخدام هذه المادة في الحسابات حتى يتم تعبئة معامل امتصاص الماء (Water Absorption) في مستودع المواد." : "This material cannot be used until Water Absorption is completed.",
            actionType: "edit",
            materialId: sand.id
          });
        }
        if (!sand.finenessModulus || sand.finenessModulus <= 0) {
          engineeringErrors.push({
            id: `missing_sand_fineness_${sand.id}`,
            message: isAr ? `الخصائص الناقصة للرمل "${sand.name}": معامل النعومة (Fineness Modulus)` : `This material "${sand.name}" cannot be used until Fineness Modulus is completed.`,
            recommendation: isAr ? "لا يمكن استخدام هذه المادة في الحسابات حتى يتم تعبئة معامل النعومة (Fineness Modulus) في مستودع المواد." : "This material cannot be used until Fineness Modulus is completed.",
            actionType: "edit",
            materialId: sand.id
          });
        }
        if (!sand.SandEquivalent || sand.SandEquivalent <= 0) {
          engineeringErrors.push({
            id: `missing_sand_equivalent_${sand.id}`,
            message: isAr ? `الخصائص الناقصة للرمل "${sand.name}": المكافئ الرملي (Sand Equivalent)` : `This material "${sand.name}" cannot be used until Sand Equivalent is completed.`,
            recommendation: isAr ? "لا يمكن استخدام هذه المادة في الحسابات حتى يتم تعبئة المكافئ الرملي (Sand Equivalent) في مستودع المواد." : "This material cannot be used until Sand Equivalent is completed.",
            actionType: "edit",
            materialId: sand.id
          });
        }
        if (!sand.gradationData || !Array.isArray(sand.gradationData) || sand.gradationData.length === 0) {
          engineeringErrors.push({
            id: `missing_sand_gradation_${sand.id}`,
            message: isAr ? `الخصائص الناقصة للرمل "${sand.name}": منحنى التوزيع الحبيبي (Particle Size Distribution)` : `This material "${sand.name}" cannot be used until Particle Size Distribution is completed.`,
            recommendation: isAr ? "لا يمكن استخدام هذه المادة في الحسابات حتى يتم تعبئة التوزيع الحبيبي (منحنى الغربلة) في مستودع المواد." : "This material cannot be used until Particle Size Distribution is completed.",
            actionType: "edit",
            materialId: sand.id
          });
        }
      }
    }

    // Validate Gravel Aggregate (الحصى)
    if (!inputs.selectedGravelId) {
      engineeringErrors.push({
        id: "missing_gravel",
        message: isAr ? "مادة الركام الخشن (الحصى) المطلوبة غير موجودة في مستودع المواد." : "Required gravel aggregate material was not found in the Material Repository.",
        recommendation: isAr ? "يرجى إضافة هذه المادة وإكمال كافة خواصها الهندسية المطلوبة قبل الاستمرار." : "Please add this material and complete all required engineering properties before continuing.",
        actionType: "add"
      });
    } else {
      const gravel = materialsList.find(m => m.id === inputs.selectedGravelId);
      if (!gravel) {
        engineeringErrors.push({
          id: "missing_gravel_not_found",
          message: isAr ? "مادة الركام الخشن (الحصى) المطلوبة غير موجودة في مستودع المواد." : "Required gravel aggregate material was not found in the Material Repository.",
          recommendation: isAr ? "يرجى إضافة هذه المادة وإكمال كافة خواصها الهندسية المطلوبة قبل الاستمرار." : "Please add this material and complete all required engineering properties before continuing.",
          actionType: "add"
        });
      } else {
        const isApp = gravel.ApprovalStatus === "Validated" || gravel.ApprovalStatus === "Approved" || gravel.ApprovalStatus === "Certified" || gravel.ApprovalStatus?.toLowerCase() === "approved";
        if (!isApp) {
          engineeringErrors.push({
            id: `unvalidated_gravel_${gravel.id}`,
            message: isAr ? `حالة اعتماد الحصى "${gravel.name}" غير صالحة للخلطة (الحالة الحالية: Draft/مسودة).` : `This material "${gravel.name}" cannot be used until its status is set to Validated.`,
            recommendation: isAr ? "لا يمكن استخدام هذه المادة في الحسابات حتى يتم إكمال كافة البيانات الإلزامية وتعديل حالة الاعتماد إلى 'معتمد' (Validated) في مستودع المواد." : "This material cannot be used until all mandatory engineering properties have been completed and its status is set to Validated.",
            actionType: "edit",
            materialId: gravel.id
          });
        }

        // Check individual properties for Gravel
        const density = gravel.ssdDensity || gravel.density || gravel.relativeDensity || gravel.specificGravity;
        if (!density || density <= 0) {
          engineeringErrors.push({
            id: `missing_gravel_density_${gravel.id}`,
            message: isAr ? `الخصائص الناقصة للحصى "${gravel.name}": الوزن النوعي / الكثافة المطلقة (SSD Density)` : `This material "${gravel.name}" cannot be used until SSD Density is completed.`,
            recommendation: isAr ? "لا يمكن استخدام هذه المادة في الحسابات حتى يتم تعبئة الوزن النوعي / الكثافة المطلقة (SSD Density) في مستودع المواد." : "This material cannot be used until SSD Density is completed.",
            actionType: "edit",
            materialId: gravel.id
          });
        }
        if (!gravel.bulkDensity || gravel.bulkDensity <= 0) {
          engineeringErrors.push({
            id: `missing_gravel_bulk_density_${gravel.id}`,
            message: isAr ? `الخصائص الناقصة للحصى "${gravel.name}": الكثافة الظاهرية (Bulk Density)` : `This material "${gravel.name}" cannot be used until Bulk Density is completed.`,
            recommendation: isAr ? "لا يمكن استخدام هذه المادة في الحسابات حتى يتم تعبئة الكثافة الظاهرية (Bulk Density) في مستودع المواد." : "This material cannot be used until Bulk Density is completed.",
            actionType: "edit",
            materialId: gravel.id
          });
        }
        if (gravel.absorption === undefined || gravel.absorption < 0) {
          engineeringErrors.push({
            id: `missing_gravel_absorption_${gravel.id}`,
            message: isAr ? `الخصائص الناقصة للحصى "${gravel.name}": معامل امتصاص الماء (Water Absorption)` : `This material "${gravel.name}" cannot be used until Water Absorption is completed.`,
            recommendation: isAr ? "لا يمكن استخدام هذه المادة في الحسابات حتى يتم تعبئة معامل امتصاص الماء (Water Absorption) في مستودع المواد." : "This material cannot be used until Water Absorption is completed.",
            actionType: "edit",
            materialId: gravel.id
          });
        }
        if (!gravel.dMax || gravel.dMax <= 0) {
          engineeringErrors.push({
            id: `missing_gravel_dmax_${gravel.id}`,
            message: isAr ? `الخصائص الناقصة للحصى "${gravel.name}": الحجم الأقصى للركام (Dmax)` : `This material "${gravel.name}" cannot be used until Dmax is completed.`,
            recommendation: isAr ? "لا يمكن استخدام هذه المادة في الحسابات حتى يتم تعبئة حجم الحبيبات الأقصى (Dmax) في مستودع المواد." : "This material cannot be used until Dmax is completed.",
            actionType: "edit",
            materialId: gravel.id
          });
        }
        if (!gravel.LosAngeles || gravel.LosAngeles <= 0) {
          engineeringErrors.push({
            id: `missing_gravel_la_${gravel.id}`,
            message: isAr ? `الخصائص الناقصة للحصى "${gravel.name}": اختبار لوس أنجلوس (Los Angeles Abrasion)` : `This material "${gravel.name}" cannot be used until Los Angeles Abrasion is completed.`,
            recommendation: isAr ? "لا يمكن استخدام هذه المادة في الحسابات حتى يتم تعبئة معامل تآكل لوس أنجلوس (Los Angeles Abrasion) في مستودع المواد." : "This material cannot be used until Los Angeles Abrasion is completed.",
            actionType: "edit",
            materialId: gravel.id
          });
        }
        if (!gravel.gradationData || !Array.isArray(gravel.gradationData) || gravel.gradationData.length === 0) {
          engineeringErrors.push({
            id: `missing_gravel_gradation_${gravel.id}`,
            message: isAr ? `الخصائص الناقصة للحصى "${gravel.name}": منحنى التوزيع الحبيبي (Particle Size Distribution)` : `This material "${gravel.name}" cannot be used until Particle Size Distribution is completed.`,
            recommendation: isAr ? "لا يمكن استخدام هذه المادة في الحسابات حتى يتم تعبئة التوزيع الحبيبي (منحنى الغربلة) في مستودع المواد." : "This material cannot be used until Particle Size Distribution is completed.",
            actionType: "edit",
            materialId: gravel.id
          });
        }
      }
    }

    // Validate Cement (الإسمنت)
    if (!inputs.selectedCementId) {
      engineeringErrors.push({
        id: "missing_cement",
        message: isAr ? "لم يتم اختيار مادة إسمنتية معتمدة من المشروع." : "No approved cement material is selected.",
        recommendation: isAr ? "يرجى الذهاب إلى قسم المواد واختيار مادة إسمنتية معتمدة ومفعلة لمزيج الخرسانة." : "Please select an approved cement.",
        actionType: "add"
      });
    } else {
      const cement = materialsList.find(m => m.id === inputs.selectedCementId);
      if (!cement) {
        engineeringErrors.push({
          id: "missing_cement_not_found",
          message: isAr ? "مادة الإسمنت المحددة غير موجودة في مستودع المواد." : "Selected cement material was not found in the Material Repository.",
          recommendation: isAr ? "يرجى إضافة هذه المادة وإكمال كافة خواصها الهندسية المطلوبة قبل الاستمرار." : "Please add this material and complete all required engineering properties before continuing.",
          actionType: "add"
        });
      }
    }

    // Validate Water (الماء)
    if (!inputs.selectedWaterId) {
      engineeringErrors.push({
        id: "missing_water",
        message: isAr ? "لم يتم اختيار مياه خلط معتمدة للمشروع." : "No mixing water is selected.",
        recommendation: isAr ? "يرجى اختيار مياه خلط نشطة من مستودع المواد." : "Please select the active mixing water.",
        actionType: "add"
      });
    } else {
      const water = materialsList.find(m => m.id === inputs.selectedWaterId);
      if (!water) {
        engineeringErrors.push({
          id: "missing_water_not_found",
          message: isAr ? "مادة مياه الخلط المحددة غير موجودة في مستودع المواد." : "Selected mixing water was not found in the Material Repository.",
          recommendation: isAr ? "يرجى إضافة مياه خلط معتمدة في مستودع المواد للمتابعة." : "Please add mixing water in the repository to continue.",
          actionType: "add"
        });
      }
    }

    // 3. Check for missing required properties on selected materials
    activeConfig.requiredProperties.forEach(prop => {
      if (prop === "density") {
        // Cement density
        if (inputs.selectedCementId) {
          const mat = materialsList.find(m => m.id === inputs.selectedCementId);
          const dens = mat ? (mat.density || inputs.cementDensity) : inputs.cementDensity;
          if (!dens || dens <= 0) {
            engineeringErrors.push({
              id: "missing_cement_density",
              message: isAr ? "الكثافة المطلقة للإسمنت غير معرفة أو صفرية في خواص المادة." : "Absolute cement density is undefined or zero in material properties.",
              recommendation: isAr ? "يرجى تعديل الكثافة المطلقة للإسمنت في مستودع المواد أو تعطيل الخيار التلقائي لتحديدها يدوياً." : "Please define the cement density in materials library or set it manually.",
              actionType: "edit",
              materialId: inputs.selectedCementId
            });
          }
        }
        // Sand density
        if (inputs.selectedSandId) {
          const mat = materialsList.find(m => m.id === inputs.selectedSandId);
          const dens = mat ? (mat.density || mat.relativeDensity) : inputs.sandRelativeDensity;
          if (!dens || dens <= 0) {
            engineeringErrors.push({
              id: "missing_sand_density",
              message: isAr ? "الكثافة النوعية للرمال غير معرفة أو صفرية في خواص المادة." : "Sand density is undefined or zero in material properties.",
              recommendation: isAr ? "يرجى تعديل الكثافة النوعية للرمل في مستودع المواد أو إدخالها يدوياً." : "Please define sand relative density in materials library or set it manually.",
              actionType: "edit",
              materialId: inputs.selectedSandId
            });
          }
        }
        // Gravel density
        if (inputs.selectedGravelId) {
          const mat = materialsList.find(m => m.id === inputs.selectedGravelId);
          const dens = mat ? (mat.density || mat.relativeDensity) : inputs.gravelRelativeDensity;
          if (!dens || dens <= 0) {
            engineeringErrors.push({
              id: "missing_gravel_density",
              message: isAr ? "الكثافة النوعية للركام الخشن غير معرفة أو صفرية في خواص المادة." : "Gravel density is undefined or zero in material properties.",
              recommendation: isAr ? "يرجى تعديل الكثافة النوعية للبحص في مستودع المواد أو إدخالها يدوياً." : "Please define gravel relative density in materials library or set it manually.",
              actionType: "edit",
              materialId: inputs.selectedGravelId
            });
          }
        }
      }

      if (prop === "absorption") {
        if (inputs.selectedSandId) {
          const mat = materialsList.find(m => m.id === inputs.selectedSandId);
          const abs = mat ? mat.absorption : inputs.sandAbsorption;
          if (abs === undefined || abs < 0) {
            engineeringErrors.push({
              id: "missing_sand_absorption",
              message: isAr ? "معامل الامتصاص للرمل غير معرف في خواص المادة." : "Sand absorption coefficient is undefined in material properties.",
              recommendation: isAr ? "يرجى فتح تفاصيل مادة الرمل في المستودع وضبط قيمة امتصاص الماء (النسبة المئوية)." : "Please define water absorption percentage for sand in the materials repository.",
              actionType: "edit",
              materialId: inputs.selectedSandId
            });
          }
        }
        if (inputs.selectedGravelId) {
          const mat = materialsList.find(m => m.id === inputs.selectedGravelId);
          const abs = mat ? mat.absorption : inputs.gravelAbsorption;
          if (abs === undefined || abs < 0) {
            engineeringErrors.push({
              id: "missing_gravel_absorption",
              message: isAr ? "معامل الامتصاص للركام الخشن غير معرف في خواص المادة." : "Gravel absorption coefficient is undefined in material properties.",
              recommendation: isAr ? "يرجى فتح تفاصيل مادة البحص في المستودع وضبط قيمة امتصاص الماء (النسبة المئوية)." : "Please define water absorption percentage for gravel in the materials repository.",
              actionType: "edit",
              materialId: inputs.selectedGravelId
            });
          }
        }
      }

      if (prop === "moisture") {
        if (inputs.selectedSandId) {
          const mat = materialsList.find(m => m.id === inputs.selectedSandId);
          const moist = mat ? mat.moisture : inputs.sandMoisture;
          if (moist === undefined || moist < 0) {
            engineeringErrors.push({
              id: "missing_sand_moisture",
              message: isAr ? "محتوى الرطوبة السطحية للرمل غير معرف." : "Sand moisture content is undefined.",
              recommendation: isAr ? "يرجى تحديد نسبة الرطوبة للرمل لإتمام عمليات التصحيح المائي." : "Please specify sand moisture percentage for correct water dosage adjustments.",
              actionType: "edit",
              materialId: inputs.selectedSandId
            });
          }
        }
        if (inputs.selectedGravelId) {
          const mat = materialsList.find(m => m.id === inputs.selectedGravelId);
          const moist = mat ? mat.moisture : inputs.gravelMoisture;
          if (moist === undefined || moist < 0) {
            engineeringErrors.push({
              id: "missing_gravel_moisture",
              message: isAr ? "محتوى الرطوبة السطحية للحصى غير معرف." : "Gravel moisture content is undefined.",
              recommendation: isAr ? "يرجى تحديد نسبة الرطوبة للبحص في مدخلات الموقع." : "Please specify gravel moisture percentage for site water dosage adjustments.",
              actionType: "edit",
              materialId: inputs.selectedGravelId
            });
          }
        }
      }

      if (prop === "strengthClass") {
        if (inputs.selectedCementId) {
          const mat = materialsList.find(m => m.id === inputs.selectedCementId);
          const strClass = mat ? parseFloat(mat.strengthClass || "0") : 0;
          if (!strClass || strClass <= 0) {
            engineeringErrors.push({
              id: "missing_cement_strength",
              message: isAr ? "رتبة مقاومة الإسمنت (Strength Class) غير محددة." : "Cement strength class is undefined.",
              recommendation: isAr ? "خرسانة التصنيف المتقدم تتطلب تحديد رتبة مقاومة الإسمنت (مثال: 42.5 أو 52.5) لتخمين الفعالية." : "Advanced concrete types require specifying the cement strength class (e.g. 42.5 or 52.5) in its properties.",
              actionType: "edit",
              materialId: inputs.selectedCementId
            });
          }
        }
      }
    });

    // 4. Custom validation errors
    if (activeConfig.getCustomValidationErrors) {
      const customErrs = activeConfig.getCustomValidationErrors(inputs, materialsList);
      customErrs.forEach(err => {
        engineeringErrors.push({
          id: err.id,
          message: err.message,
          recommendation: err.recommendation
        });
      });
    }
  }

  // General checks (slump, strength range, aggregates, densities)
  if (!inputs.selectedSandId && !inputs.selectedGravelId) {
    engineeringErrors.push({
      id: "no_aggregate_specified",
      message: isAr ? "لا يوجد ركام محدد للخلطة (الرمل أو الحصى)." : "No aggregate (sand or gravel) is specified for the mix design.",
      recommendation: isAr ? "يرجى تحديد الركام الناعم والركام الخشن من مستودع المواد لتشكيل الهيكل الصلب للخرسانة." : "Please select sand and gravel from the material library to form the structural matrix."
    });
  }

  if (!inputs.cementDensity || inputs.cementDensity <= 0) {
    engineeringErrors.push({
      id: "missing_general_cement_density",
      message: isAr ? "كثافة الإسمنت المطلقة غير معرفة أو صفرية." : "Cement absolute density is undefined or zero.",
      recommendation: isAr ? "يرجى التحقق من كثافة الإسمنت في مستودع المواد أو إدخال قيمة صالحة (مثال: 3.10)." : "Please specify a valid cement density in properties (e.g. 3.10 g/cm³)."
    });
  }

  if (!inputs.sandRelativeDensity || inputs.sandRelativeDensity <= 0) {
    engineeringErrors.push({
      id: "missing_general_sand_density",
      message: isAr ? "كثافة الركام الناعم (الرمل) غير معرفة أو مساوية للصفر." : "Sand relative density is undefined or zero.",
      recommendation: isAr ? "يرجى تحديد الكثافة النوعية للرمل (الافتراضية: 2.65) لتصحيح حجم الفراغات." : "Please define a valid relative density for sand (default: 2.65)."
    });
  }

  if (!inputs.gravelRelativeDensity || inputs.gravelRelativeDensity <= 0) {
    engineeringErrors.push({
      id: "missing_general_gravel_density",
      message: isAr ? "كثافة الركام الخشن (الحصى) غير معرفة أو مساوية للصفر." : "Gravel relative density is undefined or zero.",
      recommendation: isAr ? "يرجى تحديد الكثافة النوعية للحصى (الافتراضية: 2.68) لتسهيل حسابات درو-غوريس الحجمية." : "Please define a valid relative density for gravel (default: 2.68)."
    });
  }

  if (!inputs.fck28 || inputs.fck28 <= 0) {
    engineeringErrors.push({
      id: "invalid_fck28",
      message: isAr
        ? "مقاومة الضغط المميزة المطلوبة (fck28) غير معرفة أو صفرية."
        : isFr
        ? "La résistance caractéristique fck28 est indéfinie ou nulle."
        : "Required characteristic compressive strength (fck28) is undefined or zero.",
      recommendation: isAr
        ? "يرجى إدخال قيمة صالحة لمقاومة الضغط المستهدفة (النطاق الهندسي: 5 - 150 ميجاباسكال)."
        : isFr
        ? "Saisissez une valeur de fck28 valide (entre 5 et 150 MPa) pour le dimensionnement de la structure."
        : "Please specify a valid fck28 value (between 5 and 150 MPa) for proper mix design strength mapping."
    });
  }

  if (inputs.slump === undefined || inputs.slump < 0) {
    engineeringErrors.push({
      id: "invalid_slump",
      message: isAr
        ? "قيمة الهبوط Slump غير صالحة أو غائبة."
        : isFr
        ? "La valeur de l'affaissement (Slump) est invalide ou manquante."
        : "Targeted slump value is invalid or missing.",
      recommendation: isAr
        ? "يرجى تحديد قيمة الهبوط المستهدفة (بين 0 و 40 سم) لمطابقة مواصفات قمع أبراهام وقابلية تشغيل الخرسانة."
        : isFr
        ? "Saisissez un affaissement cible (entre 0 et 40 cm) correspondant à la maniabilité requise."
        : "Please enter a targeted slump (between 0 and 40 cm) mapping to your required site workability."
    });
  }

  // Check 9: Empty results weights (if inputs are provided but calculation output is blank/zero)
  const isResultZeroOrBlank = 
    !results.cementWeight || results.cementWeight <= 0 ||
    !results.sandWeightDry || results.sandWeightDry <= 0 ||
    !results.gravelWeightDry || results.gravelWeightDry <= 0 ||
    !results.waterContentActual || results.waterContentActual <= 0;

  if (isResultZeroOrBlank && engineeringErrors.length === 0) {
    engineeringErrors.push({
      id: "zero_calculation_outputs",
      message: isAr
        ? "مخرجات الحساب صفرية أو غير مكتملة."
        : isFr
        ? "Résultats de calcul nuls ou incomplets."
        : "Calculation outputs are zero or incomplete.",
      recommendation: isAr
        ? "يرجى التحقق من توافق معاملات التدرج الحبيبي، وحجم الركام الأقصى Dmax، لتمكين محرك Dreux-Gorisse من معالجة الصيغة وتحديد أوزان الخلطة الجافة."
        : isFr
        ? "Veuillez vérifier la compatibilité du Dmax et des granulats pour permettre la résolution de l'équation Dreux-Gorisse."
        : "Check Dmax and aggregate grain properties compatibility to allow the Dreux-Gorisse engine to resolve weights."
    });
  }

  // If there are engineering errors, display the gorgeous diagnostic panel instead of zero results
  if (engineeringErrors.length > 0) {
    return (
      <div className="bg-rose-50/40 dark:bg-rose-950/10 rounded-2xl border border-rose-200/80 dark:border-rose-900/40 p-5 md:p-6 shadow-sm space-y-6">
        {/* Header */}
        <div className={`flex items-start gap-4 ${isRtl ? "text-right flex-row-reverse" : "text-left flex-row"}`}>
          <span className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </span>
          <div className="space-y-1">
            <h3 className="text-base md:text-lg font-black text-rose-850 dark:text-rose-100">
              {isRtl 
                ? "⚙️ لوحة التشخيص والعيوب الهندسية (نقص بيانات الحساب)" 
                : "⚙️ Engineering Diagnostics (Incomplete Calculation Data)"}
            </h3>
            <p className="text-xs text-slate-550 leading-relaxed font-sans">
              {isRtl 
                ? "للحفاظ على الدقة والمصداقية الهندسية للنتائج وتجنب عرض أوزان افتراضية أو صفرية غير مطابقة للواقع، قام المحرك برصد النواقص التالية:" 
                : "To ensure engineering accuracy and prevent zero/blank formulation weights, the core engine has flagged the following data gaps:"}
            </p>
          </div>
        </div>

        {/* Dynamic Errors List */}
        <div className="space-y-3 pt-2">
          {engineeringErrors.map((err, idx) => (
            <div 
              key={err.id} 
              className={`p-4 rounded-xl border bg-white dark:bg-[#1E293B]/40 transition-all hover:shadow-sm flex gap-3 ${
                isRtl 
                  ? "border-slate-100 dark:border-slate-800/80 text-right flex-row-reverse" 
                  : "border-slate-100 dark:border-slate-800/80 text-left flex-row"
              }`}
            >
              <span className="text-xs font-black text-rose-500 bg-rose-500/5 px-2 py-1 h-fit rounded-full tracking-wide shrink-0 font-sans">
                {isRtl ? "نقص بيانات" : "GAP"} #{idx + 1}
              </span>
              <div className="space-y-1 flex-1">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                  {err.message}
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-sans mb-1.5">
                  💡 <span className="font-medium text-slate-600 dark:text-slate-400">{isRtl ? "التوصية الفنية:" : "Technical Recommendation:"}</span> {err.recommendation}
                </p>
                {err.actionType === "add" && (
                  <button
                    id={`add-material-btn-${err.id}`}
                    onClick={() => {
                      const targetTab = "materials_library";

                      const switchEvent = new CustomEvent("switch-sidebar-tab", { detail: { tab: targetTab } });
                      window.dispatchEvent(switchEvent);
                      setTimeout(() => {
                        const triggerAdd = new CustomEvent("trigger-add-material");
                        window.dispatchEvent(triggerAdd);
                      }, 100);
                    }}
                    className="mt-1.5 inline-flex items-center gap-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-medium transition-colors"
                  >
                    ➕ {isRtl ? "إضافة مادة جديدة في المستودع" : "Add New Material in Repository"}
                  </button>
                )}
                {err.actionType === "edit" && err.materialId && (
                  <button
                    id={`edit-material-btn-${err.materialId}`}
                    onClick={() => {
                      const targetTab = "materials_library";

                      const switchEvent = new CustomEvent("switch-sidebar-tab", { detail: { tab: targetTab } });
                      window.dispatchEvent(switchEvent);
                      setTimeout(() => {
                        const triggerEdit = new CustomEvent("trigger-edit-material", { detail: { materialId: err.materialId } });
                        window.dispatchEvent(triggerEdit);
                      }, 100);
                    }}
                    className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm cursor-pointer hover:shadow active:scale-95"
                  >
                    ⚙️ {isRtl ? "ضبط الآن" : "Adjust Now"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick action alert footer */}
        <div className={`text-xs text-amber-650 dark:text-amber-400 bg-amber-500/5 p-3.5 rounded-xl border border-amber-500/10 font-sans flex items-center gap-2.5 ${isRtl ? "flex-row-reverse text-right" : "flex-row text-left"}`}>
          <Info className="w-4 h-4 shrink-0 text-amber-500" />
          <span>
            {isRtl 
              ? "يرجى ملء وتعديل المتغيرات الفنية أعلاه واختيار المواد المفعلة من مستودع المواد ليقوم المحرك بتعديل وحساب الأوزان تلقائياً." 
              : "Please complete the parameters above or activate project materials in the database to trigger live formulation weights."}
          </span>
        </div>
      </div>
    );
  }

  // Localized string dictionary
  const t = {
    title: {
      ar: "📊 الملخص الهندسي المتكامل وصيغة الخلطة النهائية",
      fr: "📊 Résumé Technique et Formulation Finale du Béton",
      en: "📊 Engineering Summary & Final Formulation Blueprint"
    },
    subtitle: {
      ar: "النتائج والمخرجات الحسابية مرتبة وفقاً للترتيب المنطقي السليم لخطوات التنفيذ المخبري والحقلي",
      fr: "Résultats ordonnés selon la séquence logique d'exécution en laboratoire et sur chantier",
      en: "Calculated outputs structured according to the standard laboratory and site batching sequence"
    },
    step: {
      ar: "الخطوة",
      fr: "Étape",
      en: "Step"
    },
    m3Unit: {
      ar: "لكل 1 م³ (جاف)",
      fr: "par 1 m³ (Sec)",
      en: "per 1 m³ (Dry)"
    },
    batchUnit: {
      ar: `الدفعة الكلية (${batchVol} م³)`,
      fr: `Gâchée Totale (${batchVol} m³)`,
      en: `Total Batch (${batchVol} m³)`
    },
    targetStrength: {
      ar: "المقاومة المستهدفة (Target Strength)",
      fr: "Résistance Cible (fcm28)",
      en: "Target Strength (fcm28)"
    },
    strengthDesc: {
      ar: "المقاومة المستهدفة في المختبر بعد 28 يوماً، مضافاً إليها هامش الأمان للموقع.",
      fr: "Résistance requise en laboratoire à 28 jours, incluant la marge de sécurité du chantier.",
      en: "Required laboratory compressive strength at 28 days, including site safety margin."
    },
    wcRatio: {
      ar: "نسبة الماء إلى المواد الرابطة (W/B Ratio)",
      fr: "Rapport Eau/Liant Actuel (E/L)",
      en: "Effective Water/Binder Ratio (W/B)"
    },
    wcDesc: {
      ar: "المعيار الأساسي لمتانة الخرسانة ومقاومتها للنفاذية وفقاً لظروف التعرض المحيطة.",
      fr: "Critère majeur pour la durabilité et l'imperméabilité selon la classe d'exposition.",
      en: "Key criteria governing concrete durability and permeability based on exposure classes."
    },
    binders: {
      ar: "المواد الرابطة والأسمنت (Cementitious Binders)",
      fr: "Liants et Constituants Cimentaires",
      en: "Cementitious Binders & Active Cement"
    },
    bindersDesc: {
      ar: "الأوزان الجافة للمواد الإسمنتية الفعالة والإضافات المعدنية النشطة لكل وحدة حجم.",
      fr: "Masses sèches des liants actifs et additions minérales par unité de volume.",
      en: "Dry mass of active binders and mineral additions per unit volume."
    },
    aggregates: {
      ar: "الركام والخلطة الحبيبية (Aggregates & Granulometry)",
      fr: "Squelette Granulaire (Sable & Gravier)",
      en: "Granular Skeleton (Sand & Gravel)"
    },
    aggregatesDesc: {
      ar: "أوزان الرمل والحصى في حالتها الجافة التامة قبل تصحيح الرطوبة والامتصاص.",
      fr: "Masses des granulats à l'état sec absolu avant corrections de teneur en eau.",
      en: "Absolute dry state aggregate masses before moisture and absorption corrections."
    },
    waterAndAdmixtures: {
      ar: "مياه الخلط والإضافات الكيميائية (Mixing Water & Chemistry)",
      fr: "Eau Interne & Adjuvants Chimiques",
      en: "Internal Water & Chemical Admixtures"
    },
    waterDesc: {
      ar: "مياه الخلط الفعالة والإضافات الكيميائية السائلة كالملدنات الفائقة لتأمين الهبوط المطلوب.",
      fr: "Eau de gâchée active et adjuvants liquides requis pour l'affaissement ciblé.",
      en: "Active mixing water and liquid chemical admixtures to guarantee targeted workability."
    },
    corrections: {
      ar: "التصحيح الحقلي لنسب الرطوبة والامتصاص (Moisture Adjustment)",
      fr: "Correction de Gâchée (Humidité & Absorption)",
      en: "Field Correction (Moisture & Absorption)"
    },
    correctionsDesc: {
      ar: "الأوزان الفعلية المطلوب وزنها في الموقع بعد إضافة رطوبة الركام وخصم امتصاص الركام من الماء.",
      fr: "Masses réelles à peser sur le chantier après ajustement de l'eau absorbée et libre.",
      en: "Actual batching weights to weigh on site adjusting for aggregate water content."
    },
    yieldAndDensity: {
      ar: "الإنتاجية والكثافة الإجمالية (Yield & Fresh Density)",
      fr: "Rendement de Gâchée & Densité Fraîche",
      en: "Batch Yield & Fresh Concrete Density"
    },
    yieldDesc: {
      ar: "التحقق من الحجم المطلق الكلي (1000 لتر) ومؤشرات الإنتاجية والكثافة الرطبة للخرسانة الطازجة.",
      fr: "Vérification du volume absolu (1000 L) et indicateurs de densité fraîche attendue.",
      en: "Verification of standard absolute volume (1000 L) and fresh wet density indicator."
    },
    cementName: { ar: "إسمنت", fr: "Ciment", en: "Cement" },
    silicaFumeName: { ar: "غبار السيليكا (Silica Fume)", fr: "Fumée de Silice", en: "Silica Fume" },
    flyAshName: { ar: "الرماد المتطاير (Fly Ash)", fr: "Cendres Volantes", en: "Fly Ash" },
    slagName: { ar: "خبث الأفران (Slag)", fr: "Laitier de Haut Fourneau", en: "Slag" },
    sandName: { ar: "الرمل الجاف", fr: "Sable Sec", en: "Dry Sand" },
    gravelName: { ar: "الحصى الجاف", fr: "Gravier Sec", en: "Dry Gravel" },
    sandWetName: { ar: "الرمل الرطب الفعلي", fr: "Sable Humide Réel", en: "Actual Wet Sand" },
    gravelWetName: { ar: "الحصى الرطب الفعلي", fr: "Gravier Humide Réel", en: "Actual Wet Gravel" },
    waterNeededName: { ar: "المياه التصميمية الفعالة", fr: "Eau Efficace de Calcul", en: "Effective Design Water" },
    waterToAddName: { ar: "مياه الخلط الصافية المضافة", fr: "Eau Nette à Ajouter", en: "Net Water to Add" },
    totalBinders: { ar: "مجموع المواد الرابطة", fr: "Total des Liants", en: "Total Cementitious" },
    totalAggregate: { ar: "مجموع الركام الجاف", fr: "Total Granulats Secs", en: "Total Dry Aggregates" },
    totalBatchWeight: { ar: "الوزن الكلي للخلطة الرطبة", fr: "Masse Totale du Béton Frais", en: "Total Fresh Concrete Mass" },
    densityTitle: { ar: "الكثافة الرطبة المتوقعة", fr: "Densité du Béton Frais", en: "Fresh Concrete Density" },
    volumeTitle: { ar: "الحجم المطلق المحقق", fr: "Volume Absolu Cumulé", en: "Total Absolute Volume" },
    volOk: { ar: "مطابق (1000 لتر ± 1%)", fr: "Conforme (1000 L ± 1%)", en: "Compliant (1000 L ± 1%)" },
    fcmValueDesc: { ar: "ميجاباسكال (MPa)", fr: "MPa", en: "MPa" },
    slumpValueDesc: { ar: "سم (cm) هبوط", fr: "cm d'affaissement", en: "cm slump" },
    absorptionCorrectionApplied: {
      ar: "💡 تم احتساب امتصاص الركام ورطوبته تلقائياً لضبط مياه الخلط لتفادي زيادة سيولة الخرسانة.",
      fr: "💡 Corrections d'absorption et d'humidité appliquées pour un maintien de la maniabilité.",
      en: "💡 Dynamic aggregate absorption and moisture corrections applied to secure workability."
    }
  };

  const currentLang = language;
  const [activeTrace, setActiveTrace] = React.useState<number | null>(null);
  
  // Safe helper to extract values
  const cement = Math.round(results.cementWeight || 350);
  const silica = inputs.dosageSilicaFume && inputs.dosageSilicaFume > 0 
    ? Math.round(cement * (inputs.dosageSilicaFume / 100)) 
    : 0;
  const flyAsh = inputs.dosageFlyAsh && inputs.dosageFlyAsh > 0 
    ? Math.round(cement * (inputs.dosageFlyAsh / 100)) 
    : 0;
  const slag = inputs.dosageSlag && inputs.dosageSlag > 0 
    ? Math.round(cement * (inputs.dosageSlag / 100)) 
    : 0;
  
  const totalBind = cement + silica + flyAsh + slag;

  const sandDry = Math.round(results.sandWeightDry || 800);
  const gravelDry = Math.round(results.gravelWeightDry || 1100);
  const totalAggDry = sandDry + gravelDry;

  const sandWet = Math.round(results.sandWeightWet || sandDry);
  const gravelWet = Math.round(results.gravelWeightWet || gravelDry);

  const waterDesign = Math.round(results.waterContentActual || 175);
  const waterToAdd = Math.round(results.waterWeightWet !== undefined ? results.waterWeightWet : waterDesign);

  const freshDensity = Math.round(results.totalFreshDensity || (cement + totalAggDry + waterDesign));
  const absVolL = results.absoluteVolumeCheck?.totalAbsVolumeL || 1000;

  const renderTraceDetails = (stepNum: number) => {
    if (activeTrace !== stepNum) return null;

    let title = "";
    let formula = "";
    let tableChart = "";
    let propertiesUsed = "";
    let inputValues = "";
    let intermediates = "";
    let explanation = "";
    let reference = "";
    let knowledgeBaseSection = ""; // for linking to active tabs inside knowledge center

    if (stepNum === 1) {
      title = isAr ? "المعادلة والتحقق الرياضي: المقاومة ونسبة الماء" : "Mathematical Trace: Target Strength & W/C Ratio";
      formula = `f_cm28 = f_ck28 + 8 \\text{ MPa} \\quad \\text{and} \\quad C/W = \\frac{f_{cm28}}{A \\cdot f_{ce}} + 0.5`;
      tableChart = isAr 
        ? "جدول معاملات بولومي (A) بناءً على جودة الركام ونوع الإسمنت." 
        : "Bolomey Aggregate Quality Coefficient Table (A & A').";
      propertiesUsed = isAr
        ? `رتبة قوة الإسمنت (f_ce): ${inputs.cementStrength || 42.5} MPa، جودة الركام: ${inputs.aggregateQuality || "Standard"}`
        : `Cement Strength Class (f_ce): ${inputs.cementStrength || 42.5} MPa, Aggregate Quality: ${inputs.aggregateQuality || "Standard"}`;
      inputValues = isAr
        ? `المقاومة المحددة (f_ck28): ${inputs.fck28} MPa`
        : `Characteristic Strength (fck28): ${inputs.fck28} MPa`;
      intermediates = isAr
        ? `1. المقاومة المستهدفة (f_cm28) = ${results.fcm28 ? results.fcm28.toFixed(1) : (inputs.fck28 + 8).toFixed(1)} MPa\n2. النسبة النظرية (C/W) = ${results.cwRatio ? results.cwRatio.toFixed(2) : (results.wcRatio ? (1 / results.wcRatio).toFixed(2) : "2.10")}\n3. نسبة الماء/الإسمنت الفعلية (W/C) = ${(results.wcRatioAdjusted || results.wcRatio || 0.45).toFixed(2)}`
        : `1. Target Mean Strength (f_cm28) = ${results.fcm28 ? results.fcm28.toFixed(1) : (inputs.fck28 + 8).toFixed(1)} MPa\n2. Bolomey C/W Ratio = ${results.cwRatio ? results.cwRatio.toFixed(2) : (results.wcRatio ? (1 / results.wcRatio).toFixed(2) : "2.10")}\n3. Final W/C Ratio = ${(results.wcRatioAdjusted || results.wcRatio || 0.45).toFixed(2)}`;
      explanation = isAr
        ? "تحدد نسبة الماء إلى الإسمنت المسامية المجهرية للخرسانة المتصلدة. تؤخذ المقاومة المستهدفة كمتوسط حسابي يضمن هامش أمان إحصائي (عادةً 8 ميجاباسكال) لتجاوز تقلبات جودة المواد وموقع العمل."
        : "The water-cement ratio dictates the porosity of the hardened cement paste. The target compressive strength is designed with a statistical safety margin (usually +8 MPa) to ensure less than 5% probability of falling below f_ck28.";
      reference = "Georges Dreux & Jean Gorisse, 'Composition des Bétons: Méthode Dreux-Gorisse', Eyrolles (p. 45-52).";
      knowledgeBaseSection = "equations";
    } else if (stepNum === 2) {
      title = isAr ? "المعادلة والتحقق الرياضي: كمية الرابط" : "Mathematical Trace: Binder (Cement) Content";
      formula = `C = \\frac{W}{W/C} \\quad \\text{and} \\quad C_{min} = 375 \\cdot \\sqrt[5]{D_{max}} \\quad \\text{(Dreux durability formula)}`;
      tableChart = isAr 
        ? "جدول الحد الأدنى لمحتوى الإسمنت حسب فئات التعرض البيئي (NF EN 206-1)." 
        : "NF EN 206-1 Minimum Cement Requirements by Environmental Exposure Class.";
      propertiesUsed = isAr
        ? `القطر الأقصى للركام (D_max): ${inputs.dMax} ملم، فئة التعرض: ${inputs.exposureClass || "X0"}`
        : `Max Aggregate Size (D_max): ${inputs.dMax} mm, Exposure Class: ${inputs.exposureClass || "X0"}`;
      inputValues = isAr
        ? `الهبوط المستهدف: ${inputs.targetSlump || 7} سم، محتوى المواد البوزولانية المضافة: ${inputs.dosageSilicaFume || 0}% غبار السيليكا`
        : `Target Slump: ${inputs.targetSlump || 7} cm, Pozzolanic Additions: ${inputs.dosageSilicaFume || 0}% Silica Fume`;
      intermediates = isAr
        ? `1. محتوى الإسمنت الأولي (C_raw) = ${Math.round(results.cementWeight || 350)} kg/m³\n2. الحد الأدنى للمتانة (C_min) = ${Math.round(375 * Math.pow(inputs.dMax || 20, 0.2))} kg/m³\n3. محتوى الرابط الكلي المعتمد = ${totalBind} kg/m³`
        : `1. Calculated Raw Cement = ${Math.round(results.cementWeight || 350)} kg/m³\n2. Durability Minimum (C_min) = ${Math.round(375 * Math.pow(inputs.dMax || 20, 0.2))} kg/m³\n3. Approved Total Binder = ${totalBind} kg/m³`;
      explanation = isAr
        ? "يتطلب الركام الأكبر مساحة سطحية أقل للترطيب، وبالتالي يحتاج كمية إسمنت أقل لملء الفراغات وتوفير نفس المقاومة. تُطبق شروط الحد الأدنى للإسمنت لحماية حديد التسليح من الكربنة واختراق الكلوريدات."
        : "Larger aggregate particles have smaller specific surface areas, reducing the volume of cement paste needed to coat them. Durability limits (C_min) protect reinforcement from carbonation and aggressive environmental ions.";
      reference = "French National Standard NF EN 206-1 & Dreux-Gorisse Method Manual, Chapter V.";
      knowledgeBaseSection = "lookupTables";
    } else if (stepNum === 3) {
      title = isAr ? "المعادلة والتحقق الرياضي: الهيكل الحبيبي ونسب الركام" : "Mathematical Trace: Granular Skeleton & Aggregates";
      formula = `\\Sigma V_{absolute} = \\frac{C}{d_c} + \\frac{W}{1000} + \\frac{Sand}{d_s} + \\frac{Gravel}{d_g} + V_{air} = 1000 \\text{ L}`;
      tableChart = isAr 
        ? "منحنى التدرج المرجعي لدروكس-غوريس ونقاط الانعطاف الحبيبية (S)." 
        : "Dreux-Gorisse Reference Grading Envelope Chart & S-curve Intersection (S).";
      propertiesUsed = isAr
        ? `الوزن النوعي للرمل: ${inputs.selectedSandId ? "من مستودع المواد" : "2.65"}، الوزن النوعي للحصى: ${inputs.selectedGravelId ? "من مستودع المواد" : "2.68"}`
        : `Sand Specific Gravity: ${inputs.selectedSandId ? "From material database" : "2.65"}, Gravel Specific Gravity: ${inputs.selectedGravelId ? "From material database" : "2.68"}`;
      inputValues = isAr
        ? `قيمة معامل التدرج (K): ${results.kValue ? results.kValue.toFixed(2) : "0.0"}، حجم الهواء المقدر: ${results.airVolumeEstimate || 10} لتر`
        : `Grading Shift coefficient (K): ${results.kValue ? results.kValue.toFixed(2) : "0.0"}, Estimated Air Voids: ${results.airVolumeEstimate || 10} L`;
      intermediates = isAr
        ? `1. نسبة الرمل الحجمية = ${Math.round(results.sandPercent || 40)}%\n2. وزن الرمل الجاف الكلي = ${sandDry} kg/m³\n3. وزن الحصى الجاف الكلي = ${gravelDry} kg/m³`
        : `1. Sand Volumetric Ratio = ${Math.round(results.sandPercent || 40)}%\n2. Dry Sand Weight = ${sandDry} kg/m³\n3. Dry Gravel Weight = ${gravelDry} kg/m³`;
      explanation = isAr
        ? "تضمن معادلة الحجم المطلق خلو الخلطة من الفراغات الهوائية غير المقدرة، حيث تتكامل حجوم الرمل والحصى والإسمنت والماء والإضافات لتشكل بالضبط 1 متر مكعب (1000 لتر)."
        : "The absolute volume equation ensures the mix has zero voids by matching the total volume of constituent materials exactly to 1 cubic meter (1000 liters) including estimated air voids.";
      reference = "Georges Dreux, 'Guide Pratique du Béton', Eyrolles (Chapter VII: Granulometric curves).";
      knowledgeBaseSection = "charts";
    } else if (stepNum === 4) {
      title = isAr ? "المعادلة والتحقق الرياضي: مياه الخلط والإضافات" : "Mathematical Trace: Mixing Water & Admixtures";
      formula = `W = W_0 \\times (1 - \\text{Water Reduction Ratio})`;
      tableChart = isAr 
        ? "جدول مياه الخلط الافتراضية بدلالة القطر الأقصى (D_max) والهبوط المطلق." 
        : "Georges Dreux Lookup Table for Mixing Water vs. Slump and Dmax.";
      propertiesUsed = isAr
        ? `معدل خفض المياه للملدن الفائق: ${inputs.dosageAdmixture ? "مستخلص من مواصفات الملدن الفائق المختار" : "0%"}`
        : `Superplasticizer Water Reduction: ${inputs.dosageAdmixture ? "Extracted from selected admixture properties" : "0%"}`;
      inputValues = isAr
        ? `شكل الركام: ${inputs.gravelShape || "Crushed"}، غبار السيليكا المضاف: ${inputs.dosageSilicaFume || 0}%`
        : `Aggregate shape: ${inputs.gravelShape || "Crushed"}, Silica Fume addition: ${inputs.dosageSilicaFume || 0}%`;
      intermediates = isAr
        ? `1. كمية المياه الأساسية (W0) = ${results.waterBeforeAdmixtures || results.waterContentActual || 180} L/m³\n2. كمية المياه الصافية المطلوبة (W) = ${waterDesign} L/m³\n3. وزن المضافات الكيميائية للخلطة = ${(results.admixtureWeights && results.admixtureWeights[0] ? results.admixtureWeights[0].weight.toFixed(2) : "0.00")} kg/m³`
        : `1. Base Water Requirement (W0) = ${results.waterBeforeAdmixtures || results.waterContentActual || 180} L/m³\n2. Net Water Required (W) = ${waterDesign} L/m³\n3. Chemical Admixture Dosage = ${(results.admixtureWeights && results.admixtureWeights[0] ? results.admixtureWeights[0].weight.toFixed(2) : "0.00")} kg/m³`;
      explanation = isAr
        ? "يتم تحديد الاحتياج الأساسي للماء بناءً على قابلية التشغيل المطلوبة (الهبوط). وتسمح الملدنات الفائقة بتقليص كمية الماء الحر بنسبة كبيرة مع الحفاظ على القابلية للحركة، مما يساهم في رفع كثافة ومقاومة الخرسانة."
        : "Base water demand is determined by workability (slump). Superplasticizers enable substantial reductions in free mixing water while maintaining flowable workability, resulting in a significantly denser microstructure.";
      reference = "Dreux-Gorisse Handbook, Section IV: Admixtures & Water Reduction guidelines.";
      knowledgeBaseSection = "equations";
    } else if (stepNum === 5) {
      title = isAr ? "المعادلة والتحقق الرياضي: تصحيحات الرطوبة والامتصاص" : "Mathematical Trace: Aggregate Moisture Corrections";
      formula = `Agg_{wet} = Agg_{dry} \\cdot (1 + \\frac{\\omega}{100}) \\quad \\text{and} \\quad W_{added} = W_{design} - \\sum Agg_{dry} \\cdot \\left(\\frac{\\omega - Ab}{105}\\right)`;
      tableChart = isAr 
        ? "مصفوفة تصحيح نسب الخلط الموقعي بناءً على رطوبة الركام وامتصاصه." 
        : "Field Correction Matrix for moisture calibration of aggregates.";
      propertiesUsed = isAr
        ? `امتصاص الرمل للامتصاص (Ab): ${inputs.sandAbsorption || 0}%، امتصاص الحصى (Ab): ${inputs.gravelAbsorption || 0}%`
        : `Sand absorption coefficient (Ab): ${inputs.sandAbsorption || 0}%, Gravel absorption coefficient (Ab): ${inputs.gravelAbsorption || 0}%`;
      inputValues = isAr
        ? `رطوبة الرمل (w): ${inputs.sandMoisture || 0}%، رطوبة الحصى (w): ${inputs.gravelMoisture || 0}%`
        : `Sand field moisture (w): ${inputs.sandMoisture || 0}%, Gravel field moisture (w): ${inputs.gravelMoisture || 0}%`;
      intermediates = isAr
        ? `1. تصحيح وزن الرمل = ${Math.round(sandWet - sandDry)} kg/m³\n2. تصحيح وزن الحصى = ${Math.round(gravelWet - gravelDry)} kg/m³\n3. مياه الخلط الصافية للإضافة بالموقع = ${waterToAdd} L/m³ (فرق قدره ${waterToAdd - waterDesign} لتر عن خيار الجاف)`
        : `1. Sand Weight Adjustment = ${Math.round(sandWet - sandDry)} kg/m³\n2. Gravel Weight Adjustment = ${Math.round(gravelWet - gravelDry)} kg/m³\n3. Net Field Batching Water = ${waterToAdd} L/m³ (Difference of ${waterToAdd - waterDesign} Liters vs. dry mix design)`;
      explanation = isAr
        ? "إذا تجاوزت رطوبة الركام نسبة الامتصاص، يتوفر ماء حر زائد يضعف الخلطة ويجب حذفه من مياه الخلط. أما إذا كانت رطوبة الركام أقل من الامتصاص، فسيمتص الركام جزءاً من مياه الخلط ويجب تعويضه لضمان الهبوط المطلوب."
        : "Free water on aggregate surfaces dilutes cement paste and must be deducted from the mixing water. Conversely, aggregate dryer than its absorption limit sucks water from the paste, requiring additional compensating water.";
      reference = "ASTM C127 & C128 Standard Specifications for Coarse and Fine Aggregate Density/Absorption.";
      knowledgeBaseSection = "lookupTables";
    }

    return (
      <motion.div 
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="mt-3 bg-slate-900 text-slate-100 rounded-xl p-4 border border-blue-500/30 space-y-4 font-sans text-xs shadow-inner"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-row-reverse">
          <h5 className="font-black text-blue-400 flex items-center gap-1.5 flex-row-reverse">
            <Info size={14} />
            <span>{title}</span>
          </h5>
          <span className="text-[9px] font-mono bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full select-none">
            {isAr ? "دليل التحقق العلمي" : "ENGINEERING TRACE"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 col-span-1">
            <div>
              <span className="text-slate-400 block font-bold mb-1">{isAr ? "📚 المعادلة الهندسية المستخدمة :" : "📚 Engineering Formula Used:"}</span>
              <div className="bg-slate-950 p-2.5 rounded font-mono text-blue-300 overflow-x-auto text-[11px] select-all border border-slate-800">
                {formula}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block font-bold mb-1">{isAr ? "📊 الجداول أو المخططات المستخدمة :" : "📊 Tables / Charts Reference:"}</span>
              <p className="text-slate-300 font-sans">{tableChart}</p>
            </div>

            <div>
              <span className="text-slate-400 block font-bold mb-1">{isAr ? "🏗️ خصائص المواد المستخدمة :" : "🏗️ Material Properties Used:"}</span>
              <p className="text-slate-300 font-sans">{propertiesUsed}</p>
            </div>

            <div>
              <span className="text-slate-400 block font-bold mb-1">{isAr ? "📝 قيم المدخلات الحالية :" : "📝 Current Input Values:"}</span>
              <p className="text-slate-300 font-sans">{inputValues}</p>
            </div>
          </div>

          <div className="space-y-3 col-span-1">
            <div>
              <span className="text-slate-400 block font-bold mb-1">{isAr ? "⚙️ الحسابات الوسيطة والخطوات :" : "⚙️ Step-by-Step Intermediates:"}</span>
              <pre className="bg-slate-950 p-2.5 rounded font-mono text-emerald-400 text-[11px] whitespace-pre-wrap select-all border border-slate-800">
                {intermediates}
              </pre>
            </div>

            <div>
              <span className="text-slate-400 block font-bold mb-1">{isAr ? "ℹ️ التفسير الهندسي والقابلية للتنفيذ :" : "ℹ️ Engineering & Durability Explanation:"}</span>
              <p className="text-slate-300 font-sans leading-relaxed">{explanation}</p>
            </div>

            <div>
              <span className="text-slate-400 block font-bold mb-1">{isAr ? "📖 المرجع العلمي الموثق :" : "📖 Scientific Source Reference:"}</span>
              <p className="text-slate-300 font-mono text-[10px] opacity-80">{reference}</p>
            </div>
          </div>
        </div>

        {setActiveSidebarTab && (
          <div className="flex justify-end pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                setActiveSidebarTab("methodology");
                // Emit custom event to let the Knowledge Center know which section to highlight
                const event = new CustomEvent("highlight-knowledge-section", {
                  detail: { section: knowledgeBaseSection }
                });
                window.dispatchEvent(event);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg transition-all text-[11px] cursor-pointer"
            >
              <BookOpen size={12} />
              <span>{isAr ? "فتح هذا الجزء في مركز المعرفة الهندسي ↗" : "View in Knowledge Center ↗"}</span>
            </button>
          </div>
        )}
      </motion.div>
    );
  };

  // Render a step item in the logical flow
  return (
    <div className="bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 md:p-6 shadow-sm space-y-6">
      
      {/* Header */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-5 ${isRtl ? "text-right" : "text-left"}`}>
        <div className="space-y-1">
          <h3 className="text-base md:text-lg font-black text-slate-850 dark:text-slate-100 flex items-center gap-2 justify-start flex-row-reverse md:flex-row">
            <span className="p-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
              <Activity className="w-5 h-5" />
            </span>
            <span>{t.title[currentLang]}</span>
          </h3>
          <p className="text-xs text-slate-550 leading-relaxed max-w-2xl font-sans">
            {t.subtitle[currentLang]}
          </p>
        </div>
        <div className="flex items-center gap-1.5 self-start md:self-center bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-full text-xs font-black">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span>{isRtl ? `حجم الدفعة المحدد: ${batchVol} م³` : `Batch Volume: ${batchVol} m³`}</span>
        </div>
      </div>

      {/* Grid of Logical Outputs */}
      <div className={`grid grid-cols-1 gap-6 ${isRtl ? "direction-rtl text-right" : "direction-ltr text-left"}`}>
        
        {/* Step 1: Target Strength and Water Ratio */}
        <div className="bg-white dark:bg-[#1E293B]/60 rounded-xl border border-slate-100 dark:border-slate-800/60 p-4 space-y-3.5 transition-all hover:shadow-md">
          <div className="flex items-start justify-between flex-row-reverse">
            <div className="flex items-center gap-2 flex-row-reverse">
              <span className="text-[11px] font-black text-rose-500 dark:text-rose-400 bg-rose-500/5 px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0">
                {t.step[currentLang]} 1
              </span>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                {t.targetStrength[currentLang]} &amp; {t.wcRatio[currentLang]}
              </h4>
            </div>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
            {t.strengthDesc[currentLang]}
          </p>
          <div className="grid grid-cols-2 gap-4 pt-1.5">
            <div className="bg-rose-500/5 p-3 rounded-lg border border-rose-500/10 text-center">
              <span className="text-[10px] text-slate-500 block font-sans mb-1">{isRtl ? "المقاومة fcm28" : "fcm28 Target"}</span>
              <span className="text-lg md:text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
                {results.fcm28 ? results.fcm28.toFixed(1) : (inputs.fck28 + 8).toFixed(1)}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5 font-sans">{t.fcmValueDesc[currentLang]}</span>
            </div>
            <div className="bg-blue-500/5 p-3 rounded-lg border border-blue-500/10 text-center">
              <span className="text-[10px] text-slate-500 block font-sans mb-1">{isRtl ? "نسبة الماء/الرابط الكلية" : "W/B Total Ratio"}</span>
              <span className="text-lg md:text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {(results.wcRatioAdjusted || results.wcRatio || 0.45).toFixed(2)}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5 font-sans">E/C {isRtl ? "الفعلي" : "Effective"}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-50 dark:border-slate-800/40 flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-sans">
              {isRtl ? "التحقق من القوانين والمعادلات العلمية" : "Verify scientific equations and rules"}
            </span>
            <button 
              onClick={() => setActiveTrace(activeTrace === 1 ? null : 1)}
              className="flex items-center gap-1 text-[11px] font-black text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              🔍 {activeTrace === 1 ? (isRtl ? "إغلاق" : "Close") : (isRtl ? "تتبع الحسابات" : "Trace Calculations")}
            </button>
          </div>
          {renderTraceDetails(1)}
        </div>

        {/* Step 2: Binders (Cementitious Materials) */}
        <div className="bg-white dark:bg-[#1E293B]/60 rounded-xl border border-slate-100 dark:border-slate-800/60 p-4 space-y-3.5 transition-all hover:shadow-md">
          <div className="flex items-start justify-between flex-row-reverse">
            <div className="flex items-center gap-2 flex-row-reverse">
              <span className="text-[11px] font-black text-amber-500 dark:text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0">
                {t.step[currentLang]} 2
              </span>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                {t.binders[currentLang]}
              </h4>
            </div>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
            {t.bindersDesc[currentLang]}
          </p>

          <div className="overflow-hidden border border-slate-100 dark:border-slate-800/80 rounded-lg">
            <table className="w-full text-xs text-right font-sans">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800/60">
                <tr>
                  <th className="p-2.5 text-right font-black">{isRtl ? "المادة" : "Component"}</th>
                  <th className="p-2.5 text-center font-black">{t.m3Unit[currentLang]}</th>
                  <th className="p-2.5 text-left font-black">{t.batchUnit[currentLang]}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                <tr>
                  <td className="p-2.5 font-black text-slate-700 dark:text-slate-300">{t.cementName[currentLang]}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200">{cement} kg/m³</td>
                  <td className="p-2.5 text-left font-mono font-black text-blue-600 dark:text-blue-400">{Math.round(cement * batchVol).toLocaleString()} kg</td>
                </tr>
                {silica > 0 && (
                  <tr>
                    <td className="p-2.5 text-slate-700 dark:text-slate-300">{t.silicaFumeName[currentLang]}</td>
                    <td className="p-2.5 text-center font-mono text-slate-600 dark:text-slate-400">{silica} kg/m³</td>
                    <td className="p-2.5 text-left font-mono font-bold text-slate-700 dark:text-slate-300">{Math.round(silica * batchVol).toLocaleString()} kg</td>
                  </tr>
                )}
                {flyAsh > 0 && (
                  <tr>
                    <td className="p-2.5 text-slate-700 dark:text-slate-300">{t.flyAshName[currentLang]}</td>
                    <td className="p-2.5 text-center font-mono text-slate-600 dark:text-slate-400">{flyAsh} kg/m³</td>
                    <td className="p-2.5 text-left font-mono font-bold text-slate-700 dark:text-slate-300">{Math.round(flyAsh * batchVol).toLocaleString()} kg</td>
                  </tr>
                )}
                {slag > 0 && (
                  <tr>
                    <td className="p-2.5 text-slate-700 dark:text-slate-300">{t.slagName[currentLang]}</td>
                    <td className="p-2.5 text-center font-mono text-slate-600 dark:text-slate-400">{slag} kg/m³</td>
                    <td className="p-2.5 text-left font-mono font-bold text-slate-700 dark:text-slate-300">{Math.round(slag * batchVol).toLocaleString()} kg</td>
                  </tr>
                )}
                <tr className="bg-slate-50/50 dark:bg-slate-800/20 font-black">
                  <td className="p-2.5 text-slate-850 dark:text-slate-100">{t.totalBinders[currentLang]}</td>
                  <td className="p-2.5 text-center font-mono text-slate-850 dark:text-slate-100">{totalBind} kg/m³</td>
                  <td className="p-2.5 text-left font-mono text-blue-600 dark:text-blue-400">{Math.round(totalBind * batchVol).toLocaleString()} kg</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-slate-50 dark:border-slate-800/40 flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-sans">
              {isRtl ? "التحقق من القوانين والمعادلات العلمية" : "Verify scientific equations and rules"}
            </span>
            <button 
              onClick={() => setActiveTrace(activeTrace === 2 ? null : 2)}
              className="flex items-center gap-1 text-[11px] font-black text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              🔍 {activeTrace === 2 ? (isRtl ? "إغلاق" : "Close") : (isRtl ? "تتبع الحسابات" : "Trace Calculations")}
            </button>
          </div>
          {renderTraceDetails(2)}
        </div>

        {/* Step 3: Granular Skeleton (Aggregates) */}
        <div className="bg-white dark:bg-[#1E293B]/60 rounded-xl border border-slate-100 dark:border-slate-800/60 p-4 space-y-3.5 transition-all hover:shadow-md">
          <div className="flex items-start justify-between flex-row-reverse">
            <div className="flex items-center gap-2 flex-row-reverse">
              <span className="text-[11px] font-black text-sky-500 dark:text-sky-400 bg-sky-500/5 px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0">
                {t.step[currentLang]} 3
              </span>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                {t.aggregates[currentLang]}
              </h4>
            </div>
            <Scale className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
            {t.aggregatesDesc[currentLang]}
          </p>

          <div className="overflow-hidden border border-slate-100 dark:border-slate-800/80 rounded-lg">
            <table className="w-full text-xs text-right font-sans">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800/60">
                <tr>
                  <th className="p-2.5 text-right font-black">{isRtl ? "الركام الجاف" : "Dry Aggregate"}</th>
                  <th className="p-2.5 text-center font-black">{isRtl ? "النسبة" : "Ratio"}</th>
                  <th className="p-2.5 text-center font-black">{t.m3Unit[currentLang]}</th>
                  <th className="p-2.5 text-left font-black">{t.batchUnit[currentLang]}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                <tr>
                  <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">{t.sandName[currentLang]}</td>
                  <td className="p-2.5 text-center font-mono text-amber-600 dark:text-amber-400 font-bold">{Math.round(results.sandPercent || 40)}%</td>
                  <td className="p-2.5 text-center font-mono text-slate-800 dark:text-slate-200">{sandDry} kg/m³</td>
                  <td className="p-2.5 text-left font-mono font-bold text-slate-700 dark:text-slate-300">{Math.round(sandDry * batchVol).toLocaleString()} kg</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">{t.gravelName[currentLang]}</td>
                  <td className="p-2.5 text-center font-mono text-sky-600 dark:text-sky-400 font-bold">{Math.round(results.gravelPercent || 60)}%</td>
                  <td className="p-2.5 text-center font-mono text-slate-800 dark:text-slate-200">{gravelDry} kg/m³</td>
                  <td className="p-2.5 text-left font-mono font-bold text-slate-700 dark:text-slate-300">{Math.round(gravelDry * batchVol).toLocaleString()} kg</td>
                </tr>
                <tr className="bg-slate-50/50 dark:bg-slate-800/20 font-black">
                  <td className="p-2.5 text-slate-850 dark:text-slate-100" colSpan={2}>{t.totalAggregate[currentLang]}</td>
                  <td className="p-2.5 text-center font-mono text-slate-850 dark:text-slate-100">{totalAggDry} kg/m³</td>
                  <td className="p-2.5 text-left font-mono text-blue-600 dark:text-blue-400">{Math.round(totalAggDry * batchVol).toLocaleString()} kg</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-slate-50 dark:border-slate-800/40 flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-sans">
              {isRtl ? "التحقق من القوانين والمعادلات العلمية" : "Verify scientific equations and rules"}
            </span>
            <button 
              onClick={() => setActiveTrace(activeTrace === 3 ? null : 3)}
              className="flex items-center gap-1 text-[11px] font-black text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              🔍 {activeTrace === 3 ? (isRtl ? "إغلاق" : "Close") : (isRtl ? "تتبع الحسابات" : "Trace Calculations")}
            </button>
          </div>
          {renderTraceDetails(3)}
        </div>

        {/* Step 4: Water and Admixtures */}
        <div className="bg-white dark:bg-[#1E293B]/60 rounded-xl border border-slate-100 dark:border-slate-800/60 p-4 space-y-3.5 transition-all hover:shadow-md">
          <div className="flex items-start justify-between flex-row-reverse">
            <div className="flex items-center gap-2 flex-row-reverse">
              <span className="text-[11px] font-black text-blue-500 dark:text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0">
                {t.step[currentLang]} 4
              </span>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                {t.waterAndAdmixtures[currentLang]}
              </h4>
            </div>
            <Droplet className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
            {t.waterDesc[currentLang]}
          </p>

          <div className="overflow-hidden border border-slate-100 dark:border-slate-800/80 rounded-lg">
            <table className="w-full text-xs text-right font-sans">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800/60">
                <tr>
                  <th className="p-2.5 text-right font-black">{isRtl ? "المادة السائلة" : "Liquid Component"}</th>
                  <th className="p-2.5 text-center font-black">{t.m3Unit[currentLang]}</th>
                  <th className="p-2.5 text-left font-black">{t.batchUnit[currentLang]}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                <tr>
                  <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">{t.waterNeededName[currentLang]}</td>
                  <td className="p-2.5 text-center font-mono text-slate-800 dark:text-slate-200">{waterDesign} L/m³</td>
                  <td className="p-2.5 text-left font-mono font-bold text-slate-700 dark:text-slate-300">{Math.round(waterDesign * batchVol).toLocaleString()} L</td>
                </tr>
                {results.admixtureWeights && results.admixtureWeights.map((admix, index) => (
                  <tr key={index}>
                    <td className="p-2.5 text-slate-700 dark:text-slate-300 font-bold">
                      💧 {isRtl ? `إضافة: ${admix.name}` : `Admixture: ${admix.name}`}
                    </td>
                    <td className="p-2.5 text-center font-mono text-slate-800 dark:text-slate-200">{admix.weight.toFixed(2)} kg/m³</td>
                    <td className="p-2.5 text-left font-mono font-black text-indigo-600 dark:text-indigo-400">{(admix.weight * batchVol).toFixed(2)} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-slate-50 dark:border-slate-800/40 flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-sans">
              {isRtl ? "التحقق من القوانين والمعادلات العلمية" : "Verify scientific equations and rules"}
            </span>
            <button 
              onClick={() => setActiveTrace(activeTrace === 4 ? null : 4)}
              className="flex items-center gap-1 text-[11px] font-black text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              🔍 {activeTrace === 4 ? (isRtl ? "إغلاق" : "Close") : (isRtl ? "تتبع الحسابات" : "Trace Calculations")}
            </button>
          </div>
          {renderTraceDetails(4)}
        </div>

        {/* Step 5: Moisture Corrections for Wet Aggregates */}
        <div className="bg-gradient-to-br from-blue-500/5 to-amber-500/5 dark:from-blue-950/20 dark:to-amber-950/20 rounded-xl border border-blue-500/10 dark:border-blue-900/40 p-4 space-y-3.5 transition-all hover:shadow-md">
          <div className="flex items-start justify-between flex-row-reverse">
            <div className="flex items-center gap-2 flex-row-reverse">
              <span className="text-[11px] font-black text-purple-500 dark:text-purple-400 bg-purple-500/5 px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0">
                {t.step[currentLang]} 5
              </span>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1 flex-row-reverse">
                <span>{t.corrections[currentLang]}</span>
                <span className="text-[10px] text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded leading-none shrink-0 font-sans">
                  {isRtl ? "مهم للموقع" : "Site Ready"}
                </span>
              </h4>
            </div>
            <Beaker className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
            {t.correctionsDesc[currentLang]}
          </p>

          <div className="overflow-hidden border border-slate-100 dark:border-slate-800/80 rounded-lg bg-white/70 dark:bg-slate-900/70">
            <table className="w-full text-xs text-right font-sans">
              <thead className="bg-slate-100/50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800/60">
                <tr>
                  <th className="p-2.5 text-right font-black">{isRtl ? "المادة الفعلية للوزن" : "Component to Weigh"}</th>
                  <th className="p-2.5 text-center font-black">{t.m3Unit[currentLang]}</th>
                  <th className="p-2.5 text-left font-black">{t.batchUnit[currentLang]}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                <tr>
                  <td className="p-2.5 font-bold text-amber-700 dark:text-amber-400">{t.sandWetName[currentLang]}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200">{sandWet} kg/m³</td>
                  <td className="p-2.5 text-left font-mono font-black text-amber-600 dark:text-amber-400">{Math.round(sandWet * batchVol).toLocaleString()} kg</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-sky-700 dark:text-sky-400">{t.gravelWetName[currentLang]}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200">{gravelWet} kg/m³</td>
                  <td className="p-2.5 text-left font-mono font-black text-sky-600 dark:text-sky-400">{Math.round(gravelWet * batchVol).toLocaleString()} kg</td>
                </tr>
                <tr className="bg-blue-500/5 dark:bg-blue-950/20">
                  <td className="p-2.5 font-extrabold text-blue-700 dark:text-blue-400">{t.waterToAddName[currentLang]}</td>
                  <td className="p-2.5 text-center font-mono font-black text-slate-900 dark:text-slate-100">{waterToAdd} L/m³</td>
                  <td className="p-2.5 text-left font-mono font-black text-blue-600 dark:text-blue-400">{Math.round(waterToAdd * batchVol).toLocaleString()} L</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="text-[10px] text-amber-650 dark:text-amber-400 bg-amber-500/5 p-2 rounded border border-amber-500/10 font-sans">
            {t.absorptionCorrectionApplied[currentLang]}
          </div>

          <div className="pt-2 border-t border-slate-50 dark:border-slate-800/40 flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-sans">
              {isRtl ? "التحقق من القوانين والمعادلات العلمية" : "Verify scientific equations and rules"}
            </span>
            <button 
              onClick={() => setActiveTrace(activeTrace === 5 ? null : 5)}
              className="flex items-center gap-1 text-[11px] font-black text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              🔍 {activeTrace === 5 ? (isRtl ? "إغلاق" : "Close") : (isRtl ? "تتبع الحسابات" : "Trace Calculations")}
            </button>
          </div>
          {renderTraceDetails(5)}
        </div>

        {/* Step 6: Yield and Density verification */}
        <div className="bg-slate-800 text-white rounded-xl p-4 md:p-5 space-y-4">
          <div className="flex items-start justify-between flex-row-reverse">
            <div className="flex items-center gap-2 flex-row-reverse">
              <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0">
                {t.step[currentLang]} 6
              </span>
              <h4 className="text-xs font-black text-slate-100">
                {t.yieldAndDensity[currentLang]}
              </h4>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          </div>
          <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
            {t.yieldDesc[currentLang]}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-650 text-center">
              <span className="text-[10px] text-slate-350 block font-sans mb-1">{t.densityTitle[currentLang]}</span>
              <span className="text-base font-black text-white font-mono">{freshDensity} kg/m³</span>
            </div>
            <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-650 text-center">
              <span className="text-[10px] text-slate-350 block font-sans mb-1">{t.volumeTitle[currentLang]}</span>
              <span className="text-base font-black text-white font-mono">{absVolL.toFixed(1)} L</span>
            </div>
            <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-650 text-center flex flex-col justify-center items-center">
              <span className="text-[10px] text-slate-350 block font-sans mb-1">{isRtl ? "حالة المطابقة الحجمية" : "Volumetric Compliance"}</span>
              <span className="text-xs font-black text-emerald-400">{t.volOk[currentLang]}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
