/**
 * Reference numerical corpus. Cases A–E are model cases, not measurements.
 * The analytical reference uses α = 1 rad/s² and optional k_f = 0.04.
 */

import { peakTorqueUniformRod } from "../physics/mechanics.js";
import { mechanicalPower, electricalPower } from "../actuators/actuator.js";
import { classifyRegime } from "../economics/cost.js";

export const ANALYTICAL_REFERENCE = {
  id: "CASE-REF",
  m: 50,
  L: 1,
  lambda: 0.5,
  alpha: 1,
  g: 9.80665,
  Lcg: 0.5,
  I: 50 / 3,
  tauG: 245.16625,
  tauI: 50 / 3,
  tauNoFriction: 245.16625 + 50 / 3,
  kF: 0.04,
  tauF: 0.04 * (245.16625 + 50 / 3),
  tauPeak: (1.04) * (245.16625 + 50 / 3),
  evidence: "C3",
  physicalValidation: "S0",
  note: "Exact analytical reference. Not a measurement. Not the unreproduced 612 N·m poster figure.",
};

export const REFERENCE_CASES = [
  { id: "A", m: 0.5, L: 0.1, alpha: 1, omega: 1, eta: 0.55, V: 12, evidence: "C6" },
  { id: "B", m: 5, L: 0.4, alpha: 1, omega: 1, eta: 0.62, V: 12, evidence: "C6" },
  { id: "C", m: 50, L: 1, alpha: 1, omega: 1, eta: 0.7, V: 12, evidence: "C6" },
  { id: "D", m: 150, L: 2, alpha: 1, omega: 0.5, eta: 0.72, V: 48, evidence: "C6" },
  { id: "E", m: 500, L: 4, alpha: 1, omega: 0.25, eta: 0.78, V: 400, evidence: "C6" },
];

export function evaluateCase(spec, frictionModel = "none") {
  const peak = peakTorqueUniformRod({
    mass: spec.m,
    length: spec.L,
    alpha: spec.alpha,
    g: 9.80665,
    cgFraction: 0.5,
    frictionModel,
    frictionRatio: 0.04,
  });
  const pMech = mechanicalPower(peak.tauPeak, spec.omega);
  const pElec = electricalPower(pMech, spec.eta);
  return {
    ...spec,
    ...peak,
    omega: spec.omega,
    pMech,
    pElec,
    regime: classifyRegime(spec.m).id,
    physicalValidation: "S0",
    note: "Model case. Not an empirical measurement.",
  };
}

export function referenceCorpus() {
  return {
    analytical: ANALYTICAL_REFERENCE,
    cases: REFERENCE_CASES.map((c) => ({
      none: evaluateCase(c, "none"),
      proportional: evaluateCase(c, "proportional"),
    })),
  };
}

export function auditPosterTorque(displayed = 612) {
  const ref = peakTorqueUniformRod({
    mass: 50,
    length: 1,
    alpha: 1,
    frictionModel: "proportional",
    frictionRatio: 0.04,
  });
  const fullArm = peakTorqueUniformRod({
    mass: 50,
    length: 1,
    alpha: 1,
    cgFraction: 1,
    frictionModel: "none",
  });
  const hypotheses = [
    { name: "canonical λ=1/2, α=1, k_f=0.04", tau: ref.tauPeak },
    { name: "canonical without friction", tau: ref.tauG + ref.tauI },
    { name: "Lcg = L, no friction, α=1", tau: fullArm.tauPeak },
    { name: "m g L * 1.25 with g=9.81", tau: 50 * 9.81 * 1 * 1.25 },
    { name: "existing UI preset α=1.2, k_f=0.04", tau: peakTorqueUniformRod({ mass: 50, length: 1, alpha: 1.2, frictionModel: "proportional", frictionRatio: 0.04 }).tauPeak },
  ];
  return {
    displayed,
    reproduced: hypotheses.some((h) => Math.abs(h.tau - displayed) < 0.5),
    hypotheses,
    conclusion: "612 N·m is not produced by the canonical uniform-rod equation at the reference parameters. It is flagged, not preserved as an engineering result.",
    evidence: "C6",
    physicalValidation: "S0",
  };
}
