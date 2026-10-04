/**
 * Canonical parametric node N = <L, m, τ, P, V, E>
 * Extended fields are internal. N remains the project abstraction.
 */

import { assertFinite, assertLength, assertMass, assertVoltage, assertEfficiency } from "./errors.js";
import { STANDARD_GRAVITY } from "./provenance.js";

export function canonicalNode(input) {
  const L = assertLength(input.L, "L");
  const m = assertMass(input.m);
  const tau = assertFinite("tau", input.tau);
  const P = assertFinite("P", input.P);
  if (P < 0) throw new Error("precision P must be >= 0 m");
  const V = assertVoltage(input.V);
  const E = input.E ?? { eta: 0.7, environment: "unspecified" };
  if (E.eta !== undefined) assertEfficiency(E.eta);
  return { L, m, tau, P, V, E };
}

export function extendNode(node, ext = {}) {
  return {
    ...canonicalNode(node),
    q: ext.q ?? 0,
    qd: ext.qd ?? 0,
    qdd: ext.qdd ?? 0,
    alpha: ext.alpha ?? 0,
    Lcg: ext.Lcg ?? 0.5 * node.L,
    rho: ext.rho ?? null,
    I: ext.I ?? null,
    eta: ext.eta ?? node.E?.eta ?? null,
    mu: ext.mu ?? null,
    b: ext.b ?? null,
    T: ext.T ?? null,
    duty: ext.duty ?? null,
    SF: ext.SF ?? null,
    material: ext.material ?? null,
    actuator: ext.actuator ?? null,
    transmission: ext.transmission ?? null,
    manufacturing: ext.manufacturing ?? null,
    g: ext.g ?? STANDARD_GRAVITY.value,
    scalingModel: ext.scalingModel ?? "geometric_similarity",
  };
}

export function defaultParameters(overrides = {}) {
  return {
    g: STANDARD_GRAVITY.value,
    lambda: 0.5,
    frictionModel: "proportional",
    frictionRatio: 0.04,
    viscousB: 0,
    coulomb: 0,
    alpha: 1,
    omega: 1,
    eta: 0.7,
    etaTransmission: 0.9,
    voltage: 12,
    precision: 1e-3,
    density: 7850,
    youngs: 200e9,
    yieldStrength: 250e6,
    safetyFactorMin: 2,
    regimeBoundariesKg: [1.2, 10, 150, 500],
    targetEnergyReduction: 0.7,
    ...overrides,
  };
}
