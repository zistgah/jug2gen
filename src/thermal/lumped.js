/**
 * Lumped thermal model. Transient Euler and steady-state analytical result.
 */

import { assertFinite, EngineeringError } from "../core/errors.js";
import { registerEquation } from "../core/registry.js";

registerEquation({
  id: "M_THERM_001",
  name: "Lumped thermal ODE",
  latex: "C_{th} dT/dt = P_{loss} - (T - T_{amb})/R_{th}",
  output: "K",
  implementation: "thermalTransient",
  module: "thermal/lumped.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["single thermal mass", "constant R_th and C_th", "Newton cooling"],
  validity: "C_th > 0, R_th > 0, dt small enough for Euler",
});

registerEquation({
  id: "M_THERM_002",
  name: "Steady temperature",
  latex: "T_{ss} = T_{amb} + P_{loss} R_{th}",
  output: "K",
  implementation: "thermalSteady",
  module: "thermal/lumped.js",
  evidence: "C3",
  status: "S5",
  assumptions: ["steady lumped balance"],
  validity: "R_th > 0",
});

export function thermalSteady({ ambient, powerLoss, Rth }) {
  assertFinite("ambient", ambient);
  assertFinite("powerLoss", powerLoss);
  assertFinite("Rth", Rth);
  if (!(Rth > 0)) throw new EngineeringError("THERMAL", "R_th must be > 0 K/W");
  const T = ambient + powerLoss * Rth;
  assertFinite("Tss", T);
  return T;
}

export function thermalAnalytical({ ambient, powerLoss, Rth, Cth, T0, t }) {
  const Tss = thermalSteady({ ambient, powerLoss, Rth });
  assertFinite("Cth", Cth);
  assertFinite("T0", T0);
  assertFinite("t", t);
  if (!(Cth > 0)) throw new EngineeringError("THERMAL", "C_th must be > 0 J/K");
  if (t < 0) throw new EngineeringError("TIMESTEP", "t must be >= 0");
  const tau = Rth * Cth;
  return Tss + (T0 - Tss) * Math.exp(-t / tau);
}

export function thermalTransient({ ambient, powerLoss, Rth, Cth, T0, dt, steps, limit = 1e6 }) {
  assertFinite("Cth", Cth);
  assertFinite("dt", dt);
  assertFinite("T0", T0);
  if (!(Cth > 0)) throw new EngineeringError("THERMAL", "C_th must be > 0 J/K");
  if (!(dt > 0)) throw new EngineeringError("TIMESTEP", "dt must be > 0");
  if (!(steps > 0)) throw new EngineeringError("TIMESTEP", "steps must be > 0");
  const Tss = thermalSteady({ ambient, powerLoss, Rth });
  let T = T0;
  const trace = [T];
  for (let i = 0; i < steps; i++) {
    const dT = (powerLoss - (T - ambient) / Rth) / Cth;
    T += dT * dt;
    if (!Number.isFinite(T) || T > limit || T < ambient - limit) {
      throw new EngineeringError("THERMAL_DIVERGENCE", "lumped thermal integration diverged", { step: i, T });
    }
    trace.push(T);
  }
  return { T, trace, Tss, dt, steps };
}
