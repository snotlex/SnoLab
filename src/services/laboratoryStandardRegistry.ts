import type { RegisteredStandard } from "./laboratoryRegistry";

/**
 * Seeded local registry entries. They are explicit revisions, not free-text
 * labels; laboratories can replace or extend this list from their controlled
 * registry without changing the session contract.
 */
export const LABORATORY_STANDARD_REGISTRY: RegisteredStandard[] = [
  { id: "STD-EN933-1-2012", organization: "EN", code: "EN 933-1", version: "2012", status: "Active", source: "SnoLab controlled local registry", acceptanceRule: "laboratory-approved-range", acceptanceCriteriaConfigured: true, units: ["%"], coveredTestIds: ["AGG_SIEVE"], title: "Tests for geometrical properties of aggregates — Part 1" },
  { id: "STD-EN1097-3-1998", organization: "EN", code: "EN 1097-3", version: "1998", status: "Active", source: "SnoLab controlled local registry", acceptanceRule: "laboratory-approved-range", acceptanceCriteriaConfigured: true, units: ["kg/m³"], coveredTestIds: ["AGG_BULK_DENSITY"], title: "Tests for mechanical and physical properties of aggregates — Part 3" },
  { id: "STD-EN1097-6-2022", organization: "EN", code: "EN 1097-6", version: "2022", status: "Active", source: "SnoLab controlled local registry", acceptanceRule: "laboratory-approved-range", acceptanceCriteriaConfigured: true, units: ["g/cm³", "%"], coveredTestIds: ["AGG_SPECIFIC_GRAVITY"], title: "Particle density and water absorption" },
  { id: "STD-EN1097-5-2008", organization: "EN", code: "EN 1097-5", version: "2008", status: "Active", source: "SnoLab controlled local registry", acceptanceRule: "laboratory-approved-range", acceptanceCriteriaConfigured: true, units: ["%"], coveredTestIds: ["AGG_MOISTURE_CONTENT"], title: "Determination of water content by drying" },
];

export function standardsForTest(testId: string, registry = LABORATORY_STANDARD_REGISTRY): RegisteredStandard[] {
  return registry.filter(standard => standard.coveredTestIds?.includes(testId));
}
