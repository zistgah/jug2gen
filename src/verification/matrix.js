/**
 * Build the boundary / property / failure matrix from contracts.
 * Golden values come from oracles.js, not from saved production output.
 */

import { CONTRACTS, DEFAULT_CASES, DEFAULT_SEED } from "./contracts.js";
import { mulberry32, logUniform } from "./seeded.js";

export function buildMatrix({ cases = DEFAULT_CASES, seed = DEFAULT_SEED } = {}) {
  const rng = mulberry32(seed);
  const rows = [];
  for (const contract of CONTRACTS) {
    rows.push({
      id: `${contract.id}::REFERENCE`,
      equation: contract.id,
      kind: "reference",
      oracle: contract.oracle,
      cases: 1,
    });
    rows.push({
      id: `${contract.id}::BOUNDARY::LOWER`,
      equation: contract.id,
      kind: "boundary",
      rule: contract.boundaryRules,
      cases: 1,
    });
    rows.push({
      id: `${contract.id}::BOUNDARY::BELOW`,
      equation: contract.id,
      kind: "failure",
      cases: 1,
    });
    rows.push({
      id: `${contract.id}::BOUNDARY::ABOVE`,
      equation: contract.id,
      kind: "failure",
      cases: 1,
    });
    rows.push({
      id: `${contract.id}::PROPERTY`,
      equation: contract.id,
      kind: "property",
      seed,
      cases,
    });
    rows.push({
      id: `${contract.id}::NUMERICAL`,
      equation: contract.id,
      kind: "numerical",
      cases: 6,
    });
  }
  const sample = [];
  for (let i = 0; i < 8; i++) sample.push(logUniform(rng, 1e-3, 1e3));
  return {
    seed,
    casesPerProperty: cases,
    generatedAt: new Date().toISOString(),
    rows,
    counts: {
      equations: CONTRACTS.length,
      rows: rows.length,
      propertyCases: CONTRACTS.length * cases,
      sampleScales: sample,
    },
  };
}
