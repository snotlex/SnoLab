import * as XLSX from "xlsx";
import { 
  MaterialCoreRecord, 
  PropertyDefinition, 
  MaterialCategoryUnified 
} from "../types/materialCoreTypes";
import { PropertyService } from "./PropertyService";
import { MaterialTypeSchemaService } from "./MaterialTypeSchemaService";
import { MaterialService } from "./MaterialService";

/**
 * Standard Multi-Sheet Excel Workbook Export Service
 * Strictly adheres to Section 7 Standard Workbook Architecture:
 * README, Materials, Material Properties, Property Definitions, Material-Type Schema,
 * Test Definitions, Material-Test Mapping, Standards, Granulometry,
 * Cement, Aggregates, Mineral Additions, Admixtures, Fibers, Water, Soils, Bituminous, Masonry, Import Metadata.
 */
export class ExportService {
  /**
   * Builds and returns a complete XLSX Workbook containing all 18 standard sheets.
   */
  public static generateStandardWorkbook(materials: MaterialCoreRecord[]): XLSX.WorkBook {
    const wb = XLSX.utils.book_new();

    // 1. README Sheet
    const readmeData = [
      ["SnoLab Concrete Mix Design System - Standard Materials & Properties Workbook"],
      ["Version: 2.0 (Unified EMMS Architecture)"],
      ["Created: " + new Date().toISOString()],
      [""],
      ["SHEET OVERVIEW & ARCHITECTURE:"],
      ["1. Materials: Master table of materials (Fixed Material ID, Name, Category, Type, Source, Status)"],
      ["2. Material Properties: PRIMARY SINGLE SOURCE OF TRUTH (Material ID + Property ID = Value, Unit, Source, Status)"],
      ["3. Property Definitions: Master registry of all canonical property definitions"],
      ["4. Material-Type Schema: Requirements per material category"],
      ["5. Granulometry: Sieve curve measurements and % passing"],
      ["6. Category Sheets (Cement, Aggregates, etc.): Specialized views derived from Material Properties"],
      ["7. Standards & Tests: Testing references and mapped properties"],
      [""],
      ["STRICT RULES FOR IMPORT / ROUND-TRIP:"],
      ["- Material ID must be unique."],
      ["- Values of 0 are valid numeric measurements and will NOT be dropped."],
      ["- Do not delete Material Properties sheet as it is the master data source."]
    ];
    const wsReadme = XLSX.utils.aoa_to_sheet(readmeData);
    XLSX.utils.book_append_sheet(wb, wsReadme, "README");

    // 2. Materials Sheet
    const materialsRows = materials.map(m => ({
      "Material ID": m.id,
      "Name": m.name,
      "English Name": m.englishName || "",
      "Category": m.category,
      "Type": m.type,
      "Source": m.source,
      "Region": m.region || "",
      "Source Type": m.sourceType,
      "Status": m.status,
      "Data Source": m.dataSource,
      "Validation Status": m.validationStatus,
      "Created At": m.createdAt,
      "Updated At": m.updatedAt,
      "Notes": m.notes || ""
    }));
    const wsMaterials = XLSX.utils.json_to_sheet(materialsRows);
    XLSX.utils.book_append_sheet(wb, wsMaterials, "Materials");

    // 3. Material Properties Sheet (PRIMARY SOURCE OF TRUTH)
    const propertyRows: any[] = [];
    for (const m of materials) {
      for (const [propId, pVal] of Object.entries(m.properties)) {
        const def = PropertyService.getDefinition(propId);
        propertyRows.push({
          "Material ID": m.id,
          "Material Name": m.name,
          "Property ID": propId,
          "Property Name": def?.name || propId,
          "Property Name (Arabic)": def?.nameAr || "",
          "Value": pVal.isNotApplicable ? "NOT_APPLICABLE" : pVal.value,
          "Unit": pVal.unit,
          "Source": pVal.source,
          "Status": pVal.status,
          "Updated At": pVal.updatedAt,
          "Notes": pVal.notes || ""
        });
      }
    }
    const wsProperties = XLSX.utils.json_to_sheet(propertyRows);
    XLSX.utils.book_append_sheet(wb, wsProperties, "Material Properties");

    // 4. Property Definitions Sheet
    const definitionsRows = PropertyService.getAllDefinitions().map(d => ({
      "Property ID": d.id,
      "Code / Symbol": d.code,
      "Name": d.name,
      "Name (Arabic)": d.nameAr,
      "Name (French)": d.nameFr,
      "Data Type": d.dataType,
      "Canonical Unit": d.canonicalUnit,
      "Applicable Categories": d.applicableCategories.join(", "),
      "Category Group": d.categoryGroup,
      "Requirement Level": d.defaultRequirementLevel,
      "Associated Standard": d.associatedStandard || "",
      "Associated Lab Test": d.associatedLabTestId || "",
      "Min Allowed": d.validation?.min ?? "",
      "Max Allowed": d.validation?.max ?? "",
      "Warning Min": d.validation?.warningMin ?? "",
      "Warning Max": d.validation?.warningMax ?? "",
      "Description": d.descriptionAr || d.descriptionEn || ""
    }));
    const wsDefs = XLSX.utils.json_to_sheet(definitionsRows);
    XLSX.utils.book_append_sheet(wb, wsDefs, "Property Definitions");

    // 5. Material-Type Schema Sheet
    const schemaRows = MaterialTypeSchemaService.getAllSchemas().map(s => ({
      "Type Key": s.typeKey,
      "Category": s.category,
      "Label": s.labelAr,
      "Required Properties": s.requiredPropertyIds.join(", "),
      "Optional Properties": s.optionalPropertyIds.join(", "),
      "Applicable Tests": s.applicableTestIds.join(", ")
    }));
    const wsSchema = XLSX.utils.json_to_sheet(schemaRows);
    XLSX.utils.book_append_sheet(wb, wsSchema, "Material-Type Schema");

    // 6. Granulometry Sheet
    const granRows: any[] = [];
    for (const m of materials) {
      if (m.granulometry && m.granulometry.length > 0) {
        for (const pt of m.granulometry) {
          granRows.push({
            "Material ID": m.id,
            "Material Name": m.name,
            "Sieve (mm)": pt.sieve,
            "Mass Retained (g)": pt.massRetained ?? "",
            "% Retained": pt.percentRetained ?? "",
            "Cumulative % Retained": pt.cumulativeRetained ?? "",
            "% Passing": pt.passing
          });
        }
      }
    }
    const wsGran = XLSX.utils.json_to_sheet(granRows.length > 0 ? granRows : [{ "Material ID": "", "Sieve (mm)": "", "% Passing": "" }]);
    XLSX.utils.book_append_sheet(wb, wsGran, "Granulometry");

    // 7. Specialized Views: Cement
    const cementRows = materials.filter(m => m.category === "CEMENT").map(m => ({
      "Material ID": m.id,
      "Name": m.name,
      "Cement Class": m.properties["PROP-CEM-CLASS"]?.value || "",
      "Strength 28D (MPa)": m.properties["PROP-CEM-STRENGTH-28D"]?.value ?? "",
      "Specific Gravity (kg/m³)": m.properties["PROP-SPECIFIC-GRAVITY"]?.value ?? "",
      "Blaine (cm²/g)": m.properties["PROP-CEM-BLAINE"]?.value ?? "",
      "Initial Setting (min)": m.properties["PROP-CEM-INITIAL-SETTING"]?.value ?? "",
      "Final Setting (min)": m.properties["PROP-CEM-FINAL-SETTING"]?.value ?? "",
      "Soundness (mm)": m.properties["PROP-CEM-SOUNDNESS"]?.value ?? "",
      "SO3 (%)": m.properties["PROP-CEM-SO3"]?.value ?? "",
      "Source": m.source
    }));
    const wsCement = XLSX.utils.json_to_sheet(cementRows.length > 0 ? cementRows : [{ "Material ID": "" }]);
    XLSX.utils.book_append_sheet(wb, wsCement, "Cement");

    // 8. Specialized Views: Aggregates (Sand & Gravel)
    const aggRows = materials.filter(m => m.category === "SAND" || m.category === "GRAVEL" || m.category === "AGGREGATES").map(m => ({
      "Material ID": m.id,
      "Name": m.name,
      "Category": m.category,
      "Specific Gravity (kg/m³)": m.properties["PROP-SPECIFIC-GRAVITY"]?.value ?? "",
      "SSD Density (kg/m³)": m.properties["PROP-SSD-DENSITY"]?.value ?? "",
      "Bulk Density (kg/m³)": m.properties["PROP-BULK-DENSITY"]?.value ?? "",
      "Absorption (%)": m.properties["PROP-ABSORPTION"]?.value ?? "",
      "Moisture (%)": m.properties["PROP-MOISTURE"]?.value ?? "",
      "Fineness Modulus": m.properties["PROP-FM"]?.value ?? "",
      "Dmax (mm)": m.properties["PROP-DMAX"]?.value ?? "",
      "Sand Equivalent (%)": m.properties["PROP-SAND-EQUIVALENT"]?.value ?? "",
      "Los Angeles (%)": m.properties["PROP-LOS-ANGELES"]?.value ?? "",
      "Source": m.source
    }));
    const wsAgg = XLSX.utils.json_to_sheet(aggRows.length > 0 ? aggRows : [{ "Material ID": "" }]);
    XLSX.utils.book_append_sheet(wb, wsAgg, "Aggregates");

    // 9. Mineral Additions
    const scmRows = materials.filter(m => m.category === "MINERAL_ADDITIONS").map(m => ({
      "Material ID": m.id,
      "Name": m.name,
      "Type": m.type,
      "Specific Gravity (kg/m³)": m.properties["PROP-SPECIFIC-GRAVITY"]?.value ?? "",
      "Activity Index (%)": m.properties["PROP-SCM-ACTIVITY-INDEX"]?.value ?? "",
      "Max Replacement (%)": m.properties["PROP-SCM-MAX-REPLACEMENT"]?.value ?? "",
      "Source": m.source
    }));
    const wsSCM = XLSX.utils.json_to_sheet(scmRows.length > 0 ? scmRows : [{ "Material ID": "" }]);
    XLSX.utils.book_append_sheet(wb, wsSCM, "Mineral Additions");

    // 10. Admixtures
    const admRows = materials.filter(m => m.category === "ADMIXTURES").map(m => ({
      "Material ID": m.id,
      "Name": m.name,
      "Function": m.properties["PROP-ADM-TYPE"]?.value || "",
      "Dosage (%)": m.properties["PROP-ADM-DOSAGE"]?.value ?? "",
      "Water Reduction (%)": m.properties["PROP-ADM-WATER-REDUCTION"]?.value ?? "",
      "Density (g/cm³)": m.properties["PROP-ADM-DENSITY"]?.value ?? "",
      "Solid Content (%)": m.properties["PROP-ADM-SOLID-CONTENT"]?.value ?? "",
      "pH": m.properties["PROP-ADM-PH"]?.value ?? ""
    }));
    const wsAdm = XLSX.utils.json_to_sheet(admRows.length > 0 ? admRows : [{ "Material ID": "" }]);
    XLSX.utils.book_append_sheet(wb, wsAdm, "Admixtures");

    // 11. Fibers
    const fibRows = materials.filter(m => m.category === "FIBERS").map(m => ({
      "Material ID": m.id,
      "Name": m.name,
      "Fiber Type": m.properties["PROP-FIBER-TYPE"]?.value || "",
      "Length (mm)": m.properties["PROP-FIBER-LENGTH"]?.value ?? "",
      "Diameter (mm)": m.properties["PROP-FIBER-DIAMETER"]?.value ?? "",
      "Tensile Strength (MPa)": m.properties["PROP-FIBER-TENSILE"]?.value ?? ""
    }));
    const wsFib = XLSX.utils.json_to_sheet(fibRows.length > 0 ? fibRows : [{ "Material ID": "" }]);
    XLSX.utils.book_append_sheet(wb, wsFib, "Fibers");

    // 12. Water
    const watRows = materials.filter(m => m.category === "WATER").map(m => ({
      "Material ID": m.id,
      "Name": m.name,
      "pH": m.properties["PROP-WATER-PH"]?.value ?? "",
      "Chlorides (mg/L)": m.properties["PROP-WATER-CHLORIDES"]?.value ?? "",
      "Sulfates (mg/L)": m.properties["PROP-WATER-SULFATES"]?.value ?? ""
    }));
    const wsWat = XLSX.utils.json_to_sheet(watRows.length > 0 ? watRows : [{ "Material ID": "" }]);
    XLSX.utils.book_append_sheet(wb, wsWat, "Water");

    // 13. Soils
    const soilRows = materials.filter(m => m.category === "SOILS").map(m => ({
      "Material ID": m.id,
      "Name": m.name,
      "Moisture (%)": m.properties["PROP-MOISTURE"]?.value ?? "",
      "Specific Gravity": m.properties["PROP-SPECIFIC-GRAVITY"]?.value ?? ""
    }));
    const wsSoil = XLSX.utils.json_to_sheet(soilRows.length > 0 ? soilRows : [{ "Material ID": "" }]);
    XLSX.utils.book_append_sheet(wb, wsSoil, "Soils");

    // 14. Bituminous
    const bitRows = materials.filter(m => m.category === "BITUMINOUS").map(m => ({
      "Material ID": m.id,
      "Name": m.name,
      "Density": m.properties["PROP-SPECIFIC-GRAVITY"]?.value ?? ""
    }));
    const wsBit = XLSX.utils.json_to_sheet(bitRows.length > 0 ? bitRows : [{ "Material ID": "" }]);
    XLSX.utils.book_append_sheet(wb, wsBit, "Bituminous");

    // 15. Masonry
    const masRows = materials.filter(m => m.category === "MASONRY").map(m => ({
      "Material ID": m.id,
      "Name": m.name,
      "Absorption (%)": m.properties["PROP-ABSORPTION"]?.value ?? "",
      "Density": m.properties["PROP-SPECIFIC-GRAVITY"]?.value ?? ""
    }));
    const wsMas = XLSX.utils.json_to_sheet(masRows.length > 0 ? masRows : [{ "Material ID": "" }]);
    XLSX.utils.book_append_sheet(wb, wsMas, "Masonry");

    // 16. Test Definitions
    const testRows = [
      { "Test ID": "TEST-AGGR-SIEVE-ANALYSIS", "Test Name": "Sieve Analysis (Granulometry)", "Standard": "EN 933-1 / ASTM C136", "Outputs": "FM, Dmax, Dmin, Passing" },
      { "Test ID": "TEST-AGGR-DENSITY-ABSORPTION", "Test Name": "Specific Gravity & Absorption", "Standard": "EN 1097-6 / ASTM C128", "Outputs": "Specific Gravity, Absorption, SSD Density" },
      { "Test ID": "TEST-AGGR-SAND-EQUIVALENT", "Test Name": "Sand Equivalent Test", "Standard": "EN 933-8 / ASTM D2419", "Outputs": "Sand Equivalent %" },
      { "Test ID": "TEST-AGGR-LOS-ANGELES", "Test Name": "Los Angeles Abrasion", "Standard": "EN 1097-2 / ASTM C131", "Outputs": "Los Angeles Loss %" },
      { "Test ID": "TEST-CEM-COMPRESSIVE-STRENGTH", "Test Name": "Cement Compressive Strength", "Standard": "EN 196-1 / ASTM C109", "Outputs": "Strength 2d, 7d, 28d" }
    ];
    const wsTests = XLSX.utils.json_to_sheet(testRows);
    XLSX.utils.book_append_sheet(wb, wsTests, "Test Definitions");

    // 17. Standards
    const stdRows = [
      { "Standard Code": "EN 206+A2", "Title": "Concrete - Specification, performance, production and conformity", "Scope": "European Concrete Standard" },
      { "Standard Code": "NA 442 / EN 197-1", "Title": "Cement - Composition, specifications and conformity criteria", "Scope": "Algerian / European Cement Standard" },
      { "Standard Code": "EN 12620", "Title": "Aggregates for concrete", "Scope": "Aggregate Quality Specifications" },
      { "Standard Code": "EN 934-2", "Title": "Admixtures for concrete, mortar and grout", "Scope": "Chemical Admixtures" }
    ];
    const wsStds = XLSX.utils.json_to_sheet(stdRows);
    XLSX.utils.book_append_sheet(wb, wsStds, "Standards");

    // 18. Import Metadata Sheet
    const metaRows = [
      { "Key": "ExportTimestamp", "Value": new Date().toISOString() },
      { "Key": "SystemVersion", "Value": "2.0" },
      { "Key": "TotalMaterialsCount", "Value": materials.length },
      { "Key": "TotalPropertiesCount", "Value": propertyRows.length },
      { "Key": "Architecture", "Value": "UNIFIED_EMMS" }
    ];
    const wsMeta = XLSX.utils.json_to_sheet(metaRows);
    XLSX.utils.book_append_sheet(wb, wsMeta, "Import Metadata");

    return wb;
  }

  /**
   * Generates and downloads the Excel file in browser.
   */
  public static downloadStandardExcel(materials: MaterialCoreRecord[], fileName?: string): void {
    const wb = ExportService.generateStandardWorkbook(materials);
    const fname = fileName || `SnoLab_Materials_Standard_Library_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fname);
  }
}
