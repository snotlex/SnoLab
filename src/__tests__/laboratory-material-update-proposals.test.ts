import { describe, expect, it } from "vitest";
import { calculateSieveAnalysis } from "../services/aggregateSieveAnalysis";
import {
  acceptMaterialUpdateProposal,
  createSieveMaterialUpdateProposals,
  rejectMaterialUpdateProposal
} from "../services/laboratoryMaterialUpdateProposals";
import type { EngineeringMaterial } from "../types";

const material = {
  id: "sand-1",
  name: "Test sand",
  category: "رمال",
  finenessModulus: 2.4,
  dMax: 2,
  finesContent: 4
} as EngineeringMaterial;

const result = calculateSieveAnalysis({
  totalSampleMassG: 1000,
  finesSieveMm: 0.063,
  massBalanceToleranceG: 1,
  sieves: [
    { sieveMm: 4, retainedMassG: 20 },
    { sieveMm: 2, retainedMassG: 130 },
    { sieveMm: 1, retainedMassG: 210 },
    { sieveMm: 0.5, retainedMassG: 290 },
    { sieveMm: 0.25, retainedMassG: 220 },
    { sieveMm: 0.125, retainedMassG: 90 },
    { sieveMm: 0.063, retainedMassG: 30 },
    { sieveMm: 0, retainedMassG: 10 }
  ]
});

describe("Laboratory material update proposals", () => {
  it("creates pending proposals without mutating the source material", () => {
    const proposals = createSieveMaterialUpdateProposals({
      material,
      testRunId: "TEST-SIEVE-1",
      result,
      proposedAt: "2026-09-19T00:00:00.000Z"
    });
    expect(proposals.length).toBe(4);
    expect(proposals.every(proposal => proposal.status === "Pending")).toBe(true);
    expect(proposals.find(proposal => proposal.propertyKey === "finenessModulus")).toMatchObject({ oldValue: 2.4, newValue: 3.01 });
    expect(material.finenessModulus).toBe(2.4);
  });

  it("does not create proposals from an invalid mass balance", () => {
    const invalid = calculateSieveAnalysis({
      totalSampleMassG: 1100,
      finesSieveMm: 0.063,
      massBalanceToleranceG: 1,
      sieves: [
        { sieveMm: 4, retainedMassG: 20 },
        { sieveMm: 2, retainedMassG: 130 },
        { sieveMm: 1, retainedMassG: 210 },
        { sieveMm: 0.5, retainedMassG: 290 },
        { sieveMm: 0.25, retainedMassG: 220 },
        { sieveMm: 0.125, retainedMassG: 90 },
        { sieveMm: 0.063, retainedMassG: 30 },
        { sieveMm: 0, retainedMassG: 10 }
      ]
    });
    expect(createSieveMaterialUpdateProposals({ material, testRunId: "TEST-SIEVE-2", result: invalid })).toEqual([]);
  });

  it("accepts one proposal as a new immutable material version in memory", () => {
    const proposal = createSieveMaterialUpdateProposals({ material, testRunId: "TEST-SIEVE-3", result })[0];
    const decision = acceptMaterialUpdateProposal(material, proposal, "reviewer", "approved after worksheet check", "2026-09-19T01:00:00.000Z");
    expect(decision.proposal.status).toBe("Accepted");
    expect(decision.material.finenessModulus).toBe(3.01);
    expect(material.finenessModulus).toBe(2.4);
  });

  it("requires a reason when rejecting a proposal", () => {
    const proposal = createSieveMaterialUpdateProposals({ material, testRunId: "TEST-SIEVE-4", result })[0];
    expect(() => rejectMaterialUpdateProposal(proposal, "reviewer", " ")).toThrow("rejection reason");
    const rejected = rejectMaterialUpdateProposal(proposal, "reviewer", "mass certificate missing");
    expect(rejected.status).toBe("Rejected");
    expect(rejected.reason).toBe("mass certificate missing");
  });
});
