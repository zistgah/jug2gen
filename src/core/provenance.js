/**
 * Evidence taxonomy (C1–C6) and implementation status (S0–S6).
 * These axes are independent. A computational result is never a measurement.
 */

export const EVIDENCE = {
  C1: "directly specified by project owner",
  C2: "previously established project implementation/work",
  C3: "mathematical/engineering synthesis",
  C4: "proposed design",
  C5: "engineering claim requiring physical validation",
  C6: "illustrative / heuristic / example number",
};

export const IMPLEMENTATION = {
  S0: "not specified",
  S1: "specified",
  S2: "interface defined",
  S3: "implemented",
  S4: "computationally tested",
  S5: "numerically/analytically validated",
  S6: "physically validated",
};

export function claim(id, evidence, implementation, physicalValidation = "S0", note = "") {
  if (!EVIDENCE[evidence]) throw new Error(`unknown evidence ${evidence}`);
  if (!IMPLEMENTATION[implementation]) throw new Error(`unknown implementation ${implementation}`);
  if (!IMPLEMENTATION[physicalValidation]) throw new Error(`unknown physical status ${physicalValidation}`);
  return { id, evidence, implementation, physicalValidation, note };
}

/** Standard gravity. Configurable. Provenance: conventional standard gravity. */
export const STANDARD_GRAVITY = {
  id: "CONST.G",
  value: 9.80665,
  unit: "m/s^2",
  evidence: "C3",
  implementation: "S4",
  physicalValidation: "S0",
  provenance: "Conventional standard gravity, 9.80665 m/s^2 (not a local measurement).",
};

export const PROJECT_HYPOTHESES = {
  targetEnergyReduction: {
    value: 0.7,
    evidence: "C5",
    implementation: "S1",
    physicalValidation: "S0",
    note: "Project-level 70% energy-reduction target. Not a measured fact.",
  },
  regimeBoundariesKg: {
    value: [1.2, 10, 150, 500],
    evidence: "C6",
    implementation: "S4",
    physicalValidation: "S0",
    note: "Configurable hypotheses: precision wall, Swaraj entry, handling wall, industrial marker. Not universal constants.",
  },
  frictionRatioIllustrative: {
    value: 0.04,
    evidence: "C6",
    implementation: "S4",
    physicalValidation: "S0",
    note: "Illustrative proportional friction. Not a physical universal.",
  },
  reproduceHoursCriterion: {
    value: 72,
    evidence: "C5",
    implementation: "S1",
    physicalValidation: "S0",
    note: "Strategic reproducibility criterion. Not an engineering law.",
  },
};
