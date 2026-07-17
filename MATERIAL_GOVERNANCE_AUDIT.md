# Material Density Governance Audit & Fallback Eliminator Report

This document outlines the strict material density governance policy enforced across the **SNO Lab Concrete Mix Design Calculator**. It validates the absolute removal of hidden default fallback values from the calculation, verification, and output pipelines, ensuring that only authentic, active user-entered material parameters are processed.

---

## 1. Concrete Density Target Metrics & Physical Constants

The values **3100**, **2600**, **2650**, and **2680** exist in the codebase under strict categories. Each occurrence has been audited and classified:

### A. Value: `3100` (Typical Portland Cement Density, kg/m³)
* **Permitted (Unit Tests):** Under `src/engine/__tests__/` and `src/__tests__/`, explicitly specified as input data for test suites to simulate standard Portland cement mixes.
* **Permitted (Field Guidelines):** Inside `src/types.ts` as a purely descriptive TypeScript comment (`// e.g. 3100 kg/m3`).
* **Permitted (Standard Concrete Classification Rules):** Inside `src/services/ConcreteValidator.ts` and `src/concreteTypes.ts` where high-density concrete rules are checked (`sandDens >= 3000 && gravelDens >= 3100`). This is a physical threshold comparison, not a fallback value.
* **Permitted (Interactive AI Assistant):** Inside `MaterialEngineeringDatabase.tsx` under the AI suggestion heuristic `handleAIAssistSuggest`, filling the input form with realistic suggestions upon explicit user request.
* **Permitted (Form Placeholders):** Inside `MaterialEngineeringDatabase.tsx` as a standard placeholder / initial value in the interactive "Add Material" form.
* **STRICTLY FORBIDDEN & REMOVED (Calculation Path):** Under `src/engine/dreuxGorisseCore.ts`, the previous fallback of `3100` for special binders when density was omitted has been completely removed. It now triggers `status: "blocked"` in the suitability gate.

### B. Value: `2600` (Typical Quartz Sand Density, kg/m³)
* **Permitted (Physical Verification Thresholds):** Under `src/engine/validation/mixValidation.ts` and `src/engine/densityChecks.ts`, checking fresh concrete density (e.g. `freshDensityKgM3 > 2600` or `densityVal > 2600`) to alert the user about unusual fresh concrete densities. This is an output validation rule, not a material property fallback.
* **Permitted (Unit Tests):** Used as inputs in test cases.
* **Permitted (Interactive AI Assistant):** Used under `handleAIAssistSuggest` for sand presets in the interactive database.
* **Permitted (Form Initial State):** Used under `handleAddNewClick` for setting initial values in the database management form.
* **STRICTLY FORBIDDEN & REMOVED (Material Serialization & Calculation):** Previously `Number(formState.density) || 2600` was used in JSON previews or copy outputs. This fallback has been completely replaced with `null` so that no fake densities are ever serialized or saved.

### C. Value: `2650` (Typical Normal-Weight Coarse Aggregate Density, kg/m³)
* **Permitted (Unit Tests):** Specified inside test suites as a baseline input density.
* **Permitted (AI Assistant Suggestion):** Suggested in `handleAIAssistSuggest` for normal basalt or limestone gravel.
* **STRICTLY FORBIDDEN & REMOVED (Suitability checks):** Previously inside `src/engine/suitabilityGate.ts`, lightweight and heavyweight concrete validation fell back to `2650` if the aggregate density was missing. This fallback has been completely eliminated. If coarse aggregate density is omitted, it now returns `blocked` with the reason `missing_material_property`.

### D. Value: `2680` (Typical Crushed Limestone/Gravel SSD Density, kg/m³)
* **Permitted (Unit Tests):** Under test files to verify SSD density calculations.
* **Permitted (AI Assistant Suggestion):** Used inside `handleAIAssistSuggest` as a suggested value for crushed aggregates.
* **STRICTLY FORBIDDEN (Hidden Fallbacks):** Never used as a fallback. If SSD density is missing, it is handled as undefined without arbitrary default substitution.

---

## 2. Definitive Governance Matrix

| File Path | Value | Role / Use Case | Status | Reason / Safety Guard |
| :--- | :---: | :--- | :---: | :--- |
| `src/engine/dreuxGorisseCore.ts` | 3100 | Special binder fallback | **ELIMINATED** | Removed `3100` fallback. If density is missing, calculations block and report error. |
| `src/engine/suitabilityGate.ts` | 2650 | Lightweight / Heavyweight check | **ELIMINATED** | Omission of gravel density now immediately returns `blocked` with `missing_material_property`. |
| `src/components/MaterialEngineeringDatabase.tsx` | 2600 | Live JSON save preview / copy | **ELIMINATED** | Replaced `|| 2600` fallback with `null` when density is empty or invalid. |
| `src/engine/validation/mixValidation.ts` | 2600 | Fresh concrete warning threshold | **PERMITTED** | Validates final fresh density is within normal range (2100 - 2600 kg/m³). |
| `src/engine/densityChecks.ts` | 2600 | Upper-bound alert threshold | **PERMITTED** | Alerts if fresh density exceeds typical standard concrete bounds. |
| `src/services/ConcreteValidator.ts` | 3100 | High-density aggregate category | **PERMITTED** | Logical comparison rule for heavy concrete classification. |

---

## 3. Strict Verification & Integrity Guarantees

1. **No User Material = No Calculation:** If the user hasn't selected their own active, approved materials, the suitability gate prevents computation.
2. **No Fallback Density:** If any primary material density is missing or invalid, the suitability gate blocks calculation and reports a diagnostic validation error (`missing_material_property`).
3. **No Preset / Seeded Materials in Calculation Selector:** All calculator dropdowns are strictly bound to `isApprovedAndActive(material)`, which blocks all seeded/preset/default materials. Only authentic user/project/lab materials can be selected.
