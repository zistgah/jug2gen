/**
 * Electrical resistance, voltage drop, battery energy estimate.
 * The battery model is approximate and is not a cell model.
 */

import { assertFinite, assertVoltage, EngineeringError } from "../core/errors.js";
import { registerEquation } from "../core/registry.js";
import { JToWh } from "../core/units.js";

registerEquation({
  id: "M_ELEC_001",
  name: "Conductor resistance",
  latex: "R = \\rho_e L / A",
  output: "ohm",
  implementation: "conductorResistance",
  module: "electrical/electrical.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["uniform conductor", "constant resistivity"],
  validity: "geometry available",
});

registerEquation({
  id: "M_ELEC_002",
  name: "Ohmic voltage drop",
  latex: "\\Delta V = I R",
  output: "V",
  implementation: "voltageDrop",
  module: "electrical/electrical.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["lumped resistance"],
  validity: "finite I, R",
});

registerEquation({
  id: "M_BATT_001",
  name: "Nominal battery energy",
  latex: "E = V_{nom} Q",
  output: "Wh",
  implementation: "batteryEnergy",
  module: "electrical/electrical.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["nominal voltage times ampere-hours", "not a dynamic cell model"],
  validity: "do not claim accurate battery behaviour",
});

export function conductorResistance(resistivity, length, area) {
  assertFinite("resistivity", resistivity);
  assertFinite("length", length);
  assertFinite("area", area);
  if (resistivity < 0 || !(length > 0) || !(area > 0)) {
    throw new EngineeringError("RESISTANCE", "require ρ >= 0, L > 0, A > 0");
  }
  return (resistivity * length) / area;
}

export function voltageDrop(current, resistance) {
  assertFinite("current", current);
  assertFinite("resistance", resistance);
  if (resistance < 0) throw new EngineeringError("RESISTANCE", "R must be >= 0");
  return current * resistance;
}

export function batteryEnergy({ voltage, ampereHours, eta = 1 }) {
  assertVoltage(voltage);
  assertFinite("ampereHours", ampereHours);
  assertFinite("eta", eta);
  if (ampereHours < 0) throw new EngineeringError("BATTERY", "Q must be >= 0 Ah");
  if (!(eta > 0) || eta > 1) throw new EngineeringError("EFFICIENCY_RANGE", "battery η must be in (0, 1]");
  const eWh = voltage * ampereHours;
  return {
    E_Wh: eWh,
    E_J: eWh * 3600,
    E_useful_Wh: eta * eWh,
    assumptions: "E ≈ V_nom Q. Not a Peukert, thermal, or ageing model.",
    physicalValidation: "S0",
    evidence: "C3",
  };
}

export function runtimeHours(usefulWh, loadW) {
  assertFinite("usefulWh", usefulWh);
  assertFinite("loadW", loadW);
  if (!(loadW > 0)) throw new EngineeringError("BATTERY", "P_load must be > 0 W");
  return {
    hours: usefulWh / loadW,
    note: "Constant-power estimate. Not a discharge curve.",
    physicalValidation: "S0",
  };
}

export { JToWh };
