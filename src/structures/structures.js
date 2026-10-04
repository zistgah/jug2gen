/**
 * Structural sections, bending, deflection, torsion, von Mises, safety factor.
 * Equations are not applied outside their stated boundary conditions.
 */

import { assertFinite, assertLength, EngineeringError } from "../core/errors.js";
import { registerEquation } from "../core/registry.js";

registerEquation({
  id: "M_SECTION_001",
  name: "Rectangular second moment",
  latex: "I = b h^3 / 12",
  output: "m^4",
  implementation: "secondMomentRectangular",
  module: "structures/structures.js",
  evidence: "C3",
  status: "S5",
  assumptions: ["axis through centroid, parallel to width"],
  validity: "b > 0, h > 0",
});

registerEquation({
  id: "M_SECTION_002",
  name: "Solid circular second moment",
  latex: "I = \\pi d^4 / 64",
  output: "m^4",
  implementation: "secondMomentCircular",
  module: "structures/structures.js",
  evidence: "C3",
  status: "S5",
  assumptions: ["solid circular section"],
  validity: "d > 0",
});

registerEquation({
  id: "M_BEND_001",
  name: "Elastic bending stress",
  latex: "\\sigma = M c / I",
  output: "Pa",
  implementation: "bendingStress",
  module: "structures/structures.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["Euler-Bernoulli", "elastic", "plane sections"],
  validity: "I > 0",
});

registerEquation({
  id: "M_DEFL_001",
  name: "Cantilever end-point deflection",
  latex: "\\delta = F L^3 / (3 E I)",
  output: "m",
  implementation: "cantileverPointDeflection",
  module: "structures/structures.js",
  evidence: "C3",
  status: "S5",
  assumptions: ["cantilever", "point load at free end", "small deflection", "constant EI"],
  validity: "do not use for other boundary conditions",
});

registerEquation({
  id: "M_DEFL_002",
  name: "Cantilever uniform-load deflection",
  latex: "\\delta = w L^4 / (8 E I)",
  output: "m",
  implementation: "cantileverDistributedDeflection",
  module: "structures/structures.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["cantilever", "uniform load w force per length", "small deflection"],
  validity: "stated boundary condition only",
});

registerEquation({
  id: "M_TORSION_001",
  name: "Torsional shear",
  latex: "\\tau = T r / J",
  output: "Pa",
  implementation: "torsionalShear",
  module: "structures/structures.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["circular shaft", "elastic"],
  validity: "J > 0",
});

registerEquation({
  id: "M_VM_001",
  name: "Shaft von Mises equivalent",
  latex: "\\sigma_{vm} = \\sqrt{\\sigma_b^2 + 3\\tau_t^2}",
  output: "Pa",
  implementation: "vonMisesShaft",
  module: "structures/structures.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["plane stress combination of bending and torsion"],
  validity: "elastic assessment",
});

registerEquation({
  id: "M_SF_001",
  name: "Factor of safety",
  latex: "SF = allowable / applied",
  output: "1",
  implementation: "safetyFactor",
  module: "structures/structures.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["caller selects the failure quantity", "minimum SF is configurable"],
  validity: "applied > 0",
});

function positive(name, value) {
  assertFinite(name, value);
  if (!(value > 0)) throw new EngineeringError("GEOMETRY", `${name} must be > 0`);
  return value;
}

export function secondMomentRectangular(b, h) {
  positive("b", b);
  positive("h", h);
  return (b * h ** 3) / 12;
}

export function secondMomentCircular(d) {
  positive("d", d);
  return (Math.PI * d ** 4) / 64;
}

export function polarMomentSolid(d) {
  positive("d", d);
  return (Math.PI * d ** 4) / 32;
}

export function polarMomentHollow(outer, inner) {
  positive("D", outer);
  positive("d", inner);
  if (!(inner < outer)) throw new EngineeringError("GEOMETRY", "hollow shaft requires d < D");
  return (Math.PI * (outer ** 4 - inner ** 4)) / 32;
}

export function bendingStress(moment, c, I) {
  assertFinite("moment", moment);
  positive("c", c);
  positive("I", I);
  return (moment * c) / I;
}

export function cantileverPointDeflection(force, length, youngs, I) {
  assertFinite("force", force);
  assertLength(length);
  positive("E", youngs);
  positive("I", I);
  return (force * length ** 3) / (3 * youngs * I);
}

export function cantileverDistributedDeflection(w, length, youngs, I) {
  assertFinite("w", w);
  assertLength(length);
  positive("E", youngs);
  positive("I", I);
  return (w * length ** 4) / (8 * youngs * I);
}

export function torsionalShear(torque, radius, J) {
  assertFinite("torque", torque);
  positive("r", radius);
  positive("J", J);
  return (torque * radius) / J;
}

export function vonMisesShaft(sigmaB, tauT) {
  assertFinite("sigmaB", sigmaB);
  assertFinite("tauT", tauT);
  return Math.sqrt(sigmaB ** 2 + 3 * tauT ** 2);
}

export function safetyFactor(allowable, applied) {
  assertFinite("allowable", allowable);
  assertFinite("applied", applied);
  if (applied < 0) throw new EngineeringError("SAFETY_FACTOR_NEGATIVE", "applied quantity must be >= 0");
  if (!(applied > 0)) throw new EngineeringError("SAFETY", "applied quantity must be > 0 to form SF");
  if (allowable < 0) throw new EngineeringError("SAFETY_FACTOR_NEGATIVE", "allowable must be >= 0");
  return allowable / applied;
}

export function cantileverPayloadAt(force, length, youngs, I, x) {
  assertFinite("force", force);
  assertLength(length);
  positive("E", youngs);
  positive("I", I);
  assertFinite("x", x);
  if (x < 0 || x > length) throw new EngineeringError("GEOMETRY", "payload station must lie on the beam");
  const a = x;
  return (force * a * a * (3 * length - a)) / (6 * youngs * I);
}

export function rootMomentSelfWeight(weight, length) {
  assertFinite("weight", weight);
  assertLength(length);
  return (weight * length) / 2;
}

export function rootMomentPointLoad(force, x) {
  assertFinite("force", force);
  assertFinite("x", x);
  if (x < 0) throw new EngineeringError("GEOMETRY", "load station must be >= 0");
  return force * x;
}

export function combinedCantilever({
  weight = 0,
  payload = 0,
  payloadX,
  length,
  youngs,
  I,
}) {
  const x = payloadX ?? length;
  const moment = rootMomentSelfWeight(weight, length) + rootMomentPointLoad(payload, x);
  const delta =
    cantileverDistributedDeflection(weight / length, length, youngs, I) +
    cantileverPayloadAt(payload, length, youngs, I, x);
  return {
    loadCase: "self-weight+payload",
    moment,
    delta,
    note: "Self-weight uses the uniform-load root moment and wL^4/8EI. Payload uses the point-load station. These are not interchangeable with an end-point-only model.",
  };
}

export function assessSafety(allowable, applied, minimum) {
  const sf = safetyFactor(allowable, applied);
  assertFinite("minimumSF", minimum);
  if (minimum < 0) throw new EngineeringError("SAFETY_FACTOR_NEGATIVE", "minimum SF must be >= 0");
  return { sf, minimum, pass: sf >= minimum, evidence: "C3", physicalValidation: "S0" };
}
