import { describe, expect, it } from "vitest";
import { deriveFinenessModulusFromGradation } from "../dreuxInputResolver";

const passing = [95, 80, 65, 40, 15, 2];
const referenceSieves = [0.16, 0.315, 0.63, 1.25, 2.5, 5.0];

function gradation(count = referenceSieves.length) {
  return referenceSieves.slice(0, count).map((sieveSize, index) => ({
    sieveSize,
    percentPassing: passing[index]
  }));
}

describe("Dreux fineness modulus derivation", () => {
  it("derives FM from all six reference sieves", () => {
    const result = deriveFinenessModulusFromGradation(gradation());

    expect(result).not.toBeNull();
    expect(result?.finenessModulus).toBeCloseTo(3.03, 2);
  });

  it("refuses to derive FM when any reference sieve is missing", () => {
    expect(deriveFinenessModulusFromGradation(gradation(5))).toBeNull();
    expect(deriveFinenessModulusFromGradation(gradation(4))).toBeNull();
  });
});
