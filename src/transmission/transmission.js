/**
 * Transmission: gears, chain tension, multi-stage ratio, backlash.
 * Backlash range is a parameter, never a hard-coded fact.
 */

import { assertFinite, assertEfficiency, EngineeringError } from "../core/errors.js";
import { radToDeg } from "../core/units.js";
import { registerEquation } from "../core/registry.js";

registerEquation({
  id: "M_TRANS_001",
  name: "Gear or chain reduction",
  latex: "R = N_{out}/N_{in},\\ \\omega_{out}=\\omega_{in}/R,\\ \\tau_{out}=\\tau_{in} R \\eta_t",
  output: "1, rad/s, N*m",
  implementation: "stageReduction",
  module: "transmission/transmission.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["ideal tooth-count ratio", "constant stage efficiency"],
  validity: "N_in > 0, N_out > 0, 0 < η ≤ 1",
});

registerEquation({
  id: "M_TRANS_002",
  name: "Required motor torque",
  latex: "\\tau_{motor} = \\tau_{out}/(R \\eta_t)",
  output: "N*m",
  implementation: "requiredMotorTorque",
  module: "transmission/transmission.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["no inertia of transmission"],
  validity: "R > 0, 0 < η ≤ 1",
});

registerEquation({
  id: "M_CHAIN_001",
  name: "Chain or belt tension",
  latex: "F = \\tau / r",
  variables: { tau: "N*m", r: "m" },
  output: "N",
  implementation: "chainTension",
  module: "transmission/transmission.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["effective sprocket radius", "quasi-static"],
  validity: "r > 0",
});

registerEquation({
  id: "M_BACKLASH_001",
  name: "Backlash unit conversion",
  latex: "\\beta_{deg} = \\beta_{rad}\\,180/\\pi",
  output: "deg",
  implementation: "backlash",
  module: "transmission/transmission.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["backlash is a configurable parameter"],
  validity: "β >= 0",
});

export function stageReduction({ teethIn, teethOut, eta = 1, tauIn = null, omegaIn = null }) {
  assertFinite("teethIn", teethIn);
  assertFinite("teethOut", teethOut);
  assertEfficiency(eta);
  if (!Number.isInteger(teethIn) || !Number.isInteger(teethOut) || !(teethIn > 0) || !(teethOut > 0)) {
    throw new EngineeringError("TRANSMISSION", "tooth counts must be positive integers");
  }
  const R = teethOut / teethIn;
  const out = { R, eta, omegaOut: null, tauOut: null };
  if (omegaIn !== null) {
    assertFinite("omegaIn", omegaIn);
    out.omegaOut = omegaIn / R;
  }
  if (tauIn !== null) {
    assertFinite("tauIn", tauIn);
    out.tauOut = tauIn * R * eta;
  }
  return out;
}

export function requiredMotorTorque(tauOut, R, eta) {
  assertFinite("tauOut", tauOut);
  assertFinite("R", R);
  assertEfficiency(eta);
  if (!(R > 0)) throw new EngineeringError("TRANSMISSION", "R must be > 0");
  return tauOut / (R * eta);
}

export function multiStage(stages) {
  if (!Array.isArray(stages) || stages.length === 0) {
    throw new EngineeringError("TRANSMISSION", "at least one stage is required");
  }
  let R = 1;
  let eta = 1;
  for (const stage of stages) {
    const one = stageReduction(stage);
    R *= one.R;
    eta *= one.eta;
  }
  return {
    R,
    eta,
    tauOut: (tauIn) => tauIn * R * eta,
    omegaOut: (omegaIn) => omegaIn / R,
    tauMotor: (tauOut) => requiredMotorTorque(tauOut, R, eta),
  };
}

export function chainTension(tau, radius) {
  assertFinite("tau", tau);
  assertFinite("radius", radius);
  if (!(radius > 0)) throw new EngineeringError("TRANSMISSION", "sprocket radius must be > 0 m");
  return tau / radius;
}

export function backlash(betaRad) {
  assertFinite("betaRad", betaRad);
  if (betaRad < 0) throw new EngineeringError("BACKLASH", "backlash must be >= 0 rad");
  return { rad: betaRad, deg: radToDeg(betaRad), evidence: "C4", note: "configured parameter, not a measured range" };
}
