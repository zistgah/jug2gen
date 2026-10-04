/**
 * Cost models. The additive model and the parametric model are not forced to agree.
 * Regime boundaries are configurable hypotheses (C6), not universal constants.
 */

import { assertFinite, assertMass, EngineeringError } from "../core/errors.js";
import { registerEquation } from "../core/registry.js";

registerEquation({
  id: "M_COST_001",
  name: "Additive cost",
  latex: "C = C_m + C_e + C_t + C_l + C_p + C_test + C_o + C_f",
  output: "currency",
  implementation: "additiveCost",
  module: "economics/cost.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["caller supplies each component", "currency is opaque"],
  validity: "components >= 0",
});

registerEquation({
  id: "M_COST_002",
  name: "Parametric node cost",
  latex: "C(m) = C_{infra}(m) + m p + C_{act}(\\tau) + C_{prec}(P)",
  output: "currency",
  implementation: "parametricCost",
  module: "economics/cost.js",
  evidence: "C4",
  status: "S4",
  assumptions: ["parametric, not a quote"],
  validity: "not identical to the additive model by construction",
});

registerEquation({
  id: "M_PARITY_001",
  name: "Material-parity limit",
  latex: "\\lim C_{machine} \\approx \\sum m_i p_i + E_{process}",
  output: "currency",
  implementation: "materialParity",
  module: "economics/cost.js",
  evidence: "C5",
  status: "S3",
  assumptions: ["limiting conceptual model", "not equal to raw-material cost today"],
  validity: "retain labour, tools, testing, yield, failure, energy, capital, precision, overhead",
});

const DEFAULT_BOUNDARIES = [1.2, 10, 150, 500];

export function additiveCost(parts) {
  const keys = ["material", "energy", "tools", "labour", "process", "testing", "overhead", "failure"];
  const out = {};
  let total = 0;
  for (const key of keys) {
    const value = parts[key] ?? 0;
    assertFinite(key, value);
    if (value < 0) throw new EngineeringError("COST", `${key} cost must be >= 0`);
    out[key] = value;
    total += value;
  }
  const mass = parts.mass;
  return {
    ...out,
    total,
    specific: mass ? total / mass : null,
    evidence: "C3",
    physicalValidation: "S0",
  };
}

export function parametricCost({ mass, pricePerKg, infrastructure, actuation, precision }) {
  assertMass(mass);
  for (const [name, value] of Object.entries({ pricePerKg, infrastructure, actuation, precision })) {
    assertFinite(name, value);
    if (value < 0) throw new EngineeringError("COST", `${name} must be >= 0`);
  }
  const material = mass * pricePerKg;
  const total = infrastructure + material + actuation + precision;
  return {
    material,
    infrastructure,
    actuation,
    precision,
    total,
    specific: mass > 0 ? total / mass : null,
    evidence: "C4",
    physicalValidation: "S0",
    note: "Parametric model. Not forced equal to additiveCost.",
  };
}

export function materialParity({ massesAndPrices, processEnergyCost, retained }) {
  let raw = 0;
  for (const row of massesAndPrices) {
    assertMass(row.mass);
    assertFinite("price", row.pricePerKg);
    raw += row.mass * row.pricePerKg;
  }
  assertFinite("processEnergyCost", processEnergyCost);
  const retainedCost = additiveCost(retained ?? {});
  return {
    rawMaterial: raw,
    processEnergy: processEnergyCost,
    limit: raw + processEnergyCost,
    retained: retainedCost.total,
    actual: raw + processEnergyCost + retainedCost.total,
    gapToLimit: retainedCost.total,
    note: "The limit is not the present machine cost. Retained terms are labour, tools, testing, yield, failure, capital, precision, overhead.",
    evidence: "C5",
    physicalValidation: "S0",
  };
}

export function classifyRegime(mass, boundaries = DEFAULT_BOUNDARIES) {
  assertMass(mass);
  if (!Array.isArray(boundaries) || boundaries.length !== 4) {
    throw new EngineeringError("REGIME", "regime boundaries must be four increasing masses in kg");
  }
  const [precisionWall, swarajLow, handlingWall, industrial] = boundaries;
  if (!(precisionWall < swarajLow && swarajLow < handlingWall && handlingWall < industrial)) {
    throw new EngineeringError("REGIME", "boundaries must be strictly increasing");
  }
  let id = "industrial";
  if (mass < precisionWall) id = "precision_wall";
  else if (mass < swarajLow) id = "bridge";
  else if (mass <= handlingWall) id = "swaraj";
  else if (mass <= industrial) id = "handling_wall";
  return {
    id,
    mass,
    boundaries,
    evidence: "C6",
    physicalValidation: "S0",
    note: "Boundaries are project hypotheses, including 1.2, 10, 150, 500 kg only as defaults.",
  };
}

export function marginalSpecificCost(points) {
  const slopes = [];
  for (let i = 1; i < points.length; i++) {
    const dm = points[i].m - points[i - 1].m;
    if (dm === 0) continue;
    slopes.push({
      m: points[i].m,
      slope: (points[i].c - points[i - 1].c) / dm,
    });
  }
  return slopes;
}
