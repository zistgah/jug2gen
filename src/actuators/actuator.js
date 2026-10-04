/**
 * Actuator models. Electrical power is not torque. Efficiency is an input, not a measurement.
 */

import { assertFinite, assertEfficiency, assertVoltage, EngineeringError } from "../core/errors.js";
import { registerEquation } from "../core/registry.js";

registerEquation({
  id: "M_POWER_001",
  name: "Mechanical rotational power",
  latex: "P_{mech} = \\tau \\omega",
  variables: { tau: "N*m", omega: "rad/s" },
  output: "W",
  implementation: "mechanicalPower",
  module: "actuators/actuator.js",
  evidence: "C3",
  status: "S5",
  assumptions: ["ω in rad/s, not rpm"],
  validity: "finite τ, ω",
});

registerEquation({
  id: "M_POWER_002",
  name: "Electrical power from efficiency",
  latex: "P_{elec} = P_{mech}/\\eta",
  variables: { eta: "1" },
  output: "W",
  implementation: "electricalPower",
  module: "actuators/actuator.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["0 < η ≤ 1", "η is a model parameter"],
  validity: "P_mech >= 0 for motor consumption convention used here",
});

registerEquation({
  id: "M_CURRENT_001",
  name: "DC-equivalent current",
  latex: "I = \\tau\\omega/(\\eta V)",
  output: "A",
  implementation: "motorCurrent",
  module: "actuators/actuator.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["DC-equivalent input", "not a full motor circuit"],
  validity: "V > 0, 0 < η ≤ 1",
});

registerEquation({
  id: "M_COPPER_001",
  name: "Resistive copper loss",
  latex: "P_{Cu} = I^2 R",
  output: "W",
  implementation: "copperLoss",
  module: "actuators/actuator.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["lumped winding resistance"],
  validity: "R >= 0",
});

export function mechanicalPower(tau, omega) {
  assertFinite("tau", tau);
  assertFinite("omega", omega);
  return tau * omega;
}

export function electricalPower(pMech, eta) {
  assertFinite("pMech", pMech);
  assertEfficiency(eta);
  return pMech / eta;
}

export function efficiency(pMech, pElec) {
  assertFinite("pMech", pMech);
  assertFinite("pElec", pElec);
  if (!(pElec > 0)) throw new EngineeringError("POWER", "P_elec must be > 0 to form efficiency");
  return pMech / pElec;
}

export function motorCurrent({ tau, omega, eta, voltage }) {
  assertVoltage(voltage);
  const pElec = electricalPower(mechanicalPower(tau, omega), eta);
  return pElec / voltage;
}

export function copperLoss(current, resistance) {
  assertFinite("current", current);
  assertFinite("resistance", resistance);
  if (resistance < 0) throw new EngineeringError("RESISTANCE", "R must be >= 0 ohm");
  return current * current * resistance;
}

export const ACTUATOR_CLASSES = {
  dc: { id: "dc", name: "DC-equivalent", implementation: "S3", physicalValidation: "S0" },
  bldc: { id: "bldc", name: "BLDC equivalent", implementation: "S2", physicalValidation: "S0", note: "Mapped to DC-equivalent torque/power. No commutation solver." },
  srm: { id: "srm", name: "Switched reluctance", implementation: "S2", physicalValidation: "S0", note: "Interface only. No phase-conduction solver in V1.0." },
  salvaged: { id: "salvaged", name: "Salvaged motor", implementation: "S3", physicalValidation: "S0", note: "Uses caller-supplied Kt, R, thermal limits. Not a catalogue fact." },
};

export function resolveActuator(kind, params) {
  if (!ACTUATOR_CLASSES[kind]) {
    throw new EngineeringError("ACTUATOR", `invalid actuator class ${kind}`);
  }
  const klass = ACTUATOR_CLASSES[kind];
  if (kind === "srm") {
    return { ...klass, supportedComputation: false, reason: "SRM phase model is an interface in V1.0" };
  }
  const tau = params.tau;
  const omega = params.omega;
  const eta = params.eta;
  const voltage = params.voltage;
  const pMech = mechanicalPower(tau, omega);
  const pElec = electricalPower(pMech, eta);
  const current = pElec / voltage;
  const loss = params.resistance !== undefined ? copperLoss(current, params.resistance) : null;
  return {
    ...klass,
    supportedComputation: true,
    pMech,
    pElec,
    current,
    copperLoss: loss,
    units: { pMech: "W", pElec: "W", current: "A" },
  };
}
