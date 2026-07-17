import { MixDesignInput, EngineeringMaterial } from "../types";

// Advanced Material Snapshot Resolution & Tracing Engine (SNO EMMS Engine)
export interface ResolvedMaterials {
  cement: EngineeringMaterial;
  sand: EngineeringMaterial;
  gravel: EngineeringMaterial;
  admixture: EngineeringMaterial | null;
  scm: EngineeringMaterial | null;
  water: EngineeringMaterial;
}

export const resolveMaterials = (
  input: MixDesignInput,
  projectSnapshots?: Record<string, EngineeringMaterial>,
  liveDatabase: EngineeringMaterial[] = []
): ResolvedMaterials => {
  // Use project snapshots if stored at calculation time, else match strictly by selected IDs
  const cementSnap = projectSnapshots?.cement || projectSnapshots?.cementitious;
  const sandSnap = projectSnapshots?.sand;
  const gravelSnap = projectSnapshots?.gravel;
  const admixtureSnap = projectSnapshots?.admixture;
  const scmSnap = projectSnapshots?.scm;
  const waterSnap = projectSnapshots?.water;

  // Strict lookup only - no preset fallbacks
  const resolvedCement = cementSnap || (input.selectedCementId ? liveDatabase.find(m => m.id === input.selectedCementId) : null) || null;
  const resolvedSand = sandSnap || (input.selectedSandId ? liveDatabase.find(m => m.id === input.selectedSandId) : null) || null;
  const resolvedGravel = gravelSnap || (input.selectedGravelId ? liveDatabase.find(m => m.id === input.selectedGravelId) : null) || null;
  const resolvedWater = waterSnap || (input.selectedWaterId ? liveDatabase.find(m => m.id === input.selectedWaterId) : null) || null;

  let resolvedAdmixture: EngineeringMaterial | null = admixtureSnap || null;
  if (!resolvedAdmixture && input.selectedAdmixtureId) {
    resolvedAdmixture = liveDatabase.find(m => m.id === input.selectedAdmixtureId) || null;
  }

  let resolvedScm: EngineeringMaterial | null = scmSnap || null;
  if (!resolvedScm && input.selectedScmId) {
    resolvedScm = liveDatabase.find(m => m.id === input.selectedScmId) || null;
  }

  return {
    cement: resolvedCement as EngineeringMaterial,
    sand: resolvedSand as EngineeringMaterial,
    gravel: resolvedGravel as EngineeringMaterial,
    admixture: resolvedAdmixture,
    scm: resolvedScm,
    water: resolvedWater as EngineeringMaterial
  };
};
