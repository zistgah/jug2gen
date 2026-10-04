/**
 * Deterministic numerical integration, finite differences, uncertainty, sensitivity.
 * An unstable step is rejected, not reported as an engineering result.
 */

import { assertFinite, EngineeringError } from "../core/errors.js";
import { registerEquation } from "../core/registry.js";

registerEquation({
  id: "M_INTEGRATION_001",
  name: "Explicit Euler step",
  latex: "y_{n+1} = y_n + f(t_n, y_n)\\,\\Delta t",
  output: "same as y",
  implementation: "eulerStep",
  module: "math/numerics.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["sufficiently small timestep", "Lipschitz f"],
  validity: "dt > 0",
});

registerEquation({
  id: "M_INTEGRATION_002",
  name: "Classical RK4 step",
  latex: "y_{n+1} = y_n + (k_1+2k_2+2k_3+k_4)/6",
  output: "same as y",
  implementation: "rk4Step",
  module: "math/numerics.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["sufficiently smooth f"],
  validity: "dt > 0",
});

registerEquation({
  id: "M_UNCERTAINTY_001",
  name: "First-order uncertainty propagation",
  latex: "\\sigma_y^2 \\approx \\sum_i (\\partial f/\\partial x_i)^2 \\sigma_i^2",
  output: "same as y",
  implementation: "propagateUncertainty",
  module: "math/numerics.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["small independent uncertainties", "locally linear f"],
  validity: "finite inputs",
});

registerEquation({
  id: "M_SENSITIVITY_001",
  name: "Normalized sensitivity",
  latex: "S_i^* = (x_i/y)(\\partial y/\\partial x_i)",
  output: "1",
  implementation: "normalizedSensitivity",
  module: "math/numerics.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["finite difference step small vs curvature"],
  validity: "y ≠ 0",
});

export function eulerStep(y, dydt, dt) {
  assertFinite("y", y);
  assertFinite("dydt", dydt);
  assertFinite("dt", dt);
  if (!(dt > 0)) throw new EngineeringError("TIMESTEP", "dt must be > 0");
  const next = y + dydt * dt;
  assertFinite("euler", next);
  return next;
}

export function rk4Step(y, t, dt, f) {
  assertFinite("dt", dt);
  if (!(dt > 0)) throw new EngineeringError("TIMESTEP", "dt must be > 0");
  const k1 = f(t, y);
  const k2 = f(t + dt / 2, y + (dt * k1) / 2);
  const k3 = f(t + dt / 2, y + (dt * k2) / 2);
  const k4 = f(t + dt, y + dt * k3);
  const next = y + (dt * (k1 + 2 * k2 + 2 * k3 + k4)) / 6;
  assertFinite("rk4", next);
  return next;
}

export function integrate(y0, t0, t1, dt, f, method = "rk4") {
  if (!(t1 >= t0)) throw new EngineeringError("TIMESTEP", "t1 must be >= t0");
  const steps = Math.max(1, Math.round((t1 - t0) / dt));
  const h = (t1 - t0) / steps;
  let y = y0;
  let t = t0;
  const trace = [{ t, y }];
  for (let i = 0; i < steps; i++) {
    if (method === "euler") y = eulerStep(y, f(t, y), h);
    else y = rk4Step(y, t, h, f);
    t += h;
    trace.push({ t, y });
  }
  return { y, trace, steps, dt: h };
}

export function centralDifference(f, x, h) {
  const step = h ?? Math.max(Math.abs(x) * 1e-6, 1e-9);
  return (f(x + step) - f(x - step)) / (2 * step);
}

export function partials(f, values, absStep) {
  const names = Object.keys(values);
  const out = {};
  for (const name of names) {
    const h = absStep?.[name] ?? Math.max(Math.abs(values[name]) * 1e-6, 1e-9);
    const up = { ...values, [name]: values[name] + h };
    const dn = { ...values, [name]: values[name] - h };
    out[name] = (f(up) - f(dn)) / (2 * h);
  }
  return out;
}

/**
 * Independent first-order propagation.
 * inputs: [{ name, value, sigma }]
 * f receives a plain object of values and returns a finite number.
 */
export function propagateUncertainty(f, inputs) {
  const values = {};
  for (const inp of inputs) {
    assertFinite(inp.name, inp.value);
    assertFinite(inp.name + ".sigma", inp.sigma);
    if (inp.sigma < 0) throw new EngineeringError("UNCERTAINTY", "sigma must be >= 0");
    values[inp.name] = inp.value;
  }
  const y = assertFinite("y", f(values));
  const grad = partials(f, values);
  let variance = 0;
  const terms = {};
  for (const inp of inputs) {
    const contrib = grad[inp.name] ** 2 * inp.sigma ** 2;
    terms[inp.name] = { partial: grad[inp.name], variance: contrib };
    variance += contrib;
  }
  return { y, sigma: Math.sqrt(variance), variance, terms, method: "independent-first-order" };
}

/**
 * Correlated extension σ_y² ≈ J Σ Jᵀ.
 * covariance is a nested object covariance[i][j].
 */
export function propagateCorrelated(f, inputs, covariance) {
  const base = propagateUncertainty(f, inputs.map((i) => ({ ...i, sigma: i.sigma ?? 0 })));
  const names = inputs.map((i) => i.name);
  let variance = 0;
  for (const i of names) {
    for (const j of names) {
      const cij = covariance?.[i]?.[j] ?? 0;
      variance += base.terms[i].partial * cij * base.terms[j].partial;
    }
  }
  if (variance < 0 && variance > -1e-12) variance = 0;
  if (variance < 0) throw new EngineeringError("UNCERTAINTY", "covariance produced negative variance");
  return { ...base, variance, sigma: Math.sqrt(variance), method: "jacobian-covariance" };
}

export function absoluteSensitivity(f, values) {
  return partials(f, values);
}

export function normalizedSensitivity(f, values) {
  const y = f(values);
  if (!(y !== 0) || !Number.isFinite(y)) {
    throw new EngineeringError("SENSITIVITY", "normalized sensitivity requires finite non-zero y");
  }
  const grad = partials(f, values);
  const out = {};
  for (const name of Object.keys(values)) {
    out[name] = (values[name] / y) * grad[name];
  }
  return { y, absolute: grad, normalized: out };
}

export function dominantParameter(normalized) {
  let best = null;
  let mag = -1;
  for (const [name, value] of Object.entries(normalized)) {
    const a = Math.abs(value);
    if (a > mag) {
      mag = a;
      best = name;
    }
  }
  return { name: best, magnitude: mag };
}
