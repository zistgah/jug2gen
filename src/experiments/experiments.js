/**
 * Experimental-data schema and calibration interface.
 * Calibration without measurements does not become physical validation.
 */

import { EngineeringError } from "../core/errors.js";

export const EXPERIMENT_SCHEMA = {
  $id: "j2g-experiment-v1",
  required: ["id", "quantity", "unit", "samples", "evidence"],
  sampleRequired: ["t", "value"],
  note: "Schema for future measurements. An empty corpus is not validation.",
};

export function validateExperiment(doc) {
  const missing = EXPERIMENT_SCHEMA.required.filter((k) => doc[k] === undefined);
  if (missing.length) {
    throw new EngineeringError("EXPERIMENT", `experiment missing ${missing.join(",")}`);
  }
  if (!Array.isArray(doc.samples) || doc.samples.length === 0) {
    throw new EngineeringError("EXPERIMENT", "experiment requires samples");
  }
  for (const sample of doc.samples) {
    if (!Number.isFinite(sample.t) || !Number.isFinite(sample.value)) {
      throw new EngineeringError("EXPERIMENT", "sample t and value must be finite");
    }
  }
  return { ok: true, n: doc.samples.length, physicalValidation: doc.evidence === "C1" ? "S1" : "S0" };
}

/**
 * Affine calibration y ≈ a + b x against supplied pairs.
 * Result remains computational unless the caller attaches a physical campaign id.
 */
export function calibrateAffine(pairs) {
  if (!Array.isArray(pairs) || pairs.length < 2) {
    throw new EngineeringError("CALIBRATION", "need at least two measured pairs");
  }
  let n = 0;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  for (const pair of pairs) {
    if (!Number.isFinite(pair.x) || !Number.isFinite(pair.y)) {
      throw new EngineeringError("CALIBRATION", "pair values must be finite");
    }
    n += 1;
    sx += pair.x;
    sy += pair.y;
    sxx += pair.x * pair.x;
    sxy += pair.x * pair.y;
  }
  const den = n * sxx - sx * sx;
  if (den === 0) throw new EngineeringError("CALIBRATION", "x values are degenerate");
  const b = (n * sxy - sx * sy) / den;
  const a = (sy - b * sx) / n;
  let rss = 0;
  for (const pair of pairs) rss += (pair.y - (a + b * pair.x)) ** 2;
  return {
    a,
    b,
    rss,
    n,
    implementation: "S4",
    physicalValidation: "S0",
    note: "Fit to supplied pairs. Not a physical validation of the machine.",
  };
}
