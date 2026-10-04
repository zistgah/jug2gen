/**
 * Explicit engineering failures. Never return NaN for a contract violation.
 * Evidence and implementation status are never collapsed into one field.
 */

const CANONICAL = {
  MASS_NEGATIVE: "INVALID_MASS",
  LENGTH_NON_POSITIVE: "INVALID_LENGTH",
  EFFICIENCY_RANGE: "INVALID_EFFICIENCY",
  VOLTAGE_NON_POSITIVE: "INVALID_VOLTAGE",
  SAFETY_FACTOR_NEGATIVE: "INVALID_BOUNDARY",
  SAFETY: "INVALID_BOUNDARY",
  GEOMETRY: "INVALID_GEOMETRY",
  DENSITY: "INVALID_MATERIAL",
  INERTIA: "INVALID_GEOMETRY",
  FRICTION: "INVALID_BOUNDARY",
  FRICTION_MODEL: "INVALID_BOUNDARY",
  CG_FRACTION: "INVALID_GEOMETRY",
  THERMAL: "INVALID_THERMAL_PARAMETER",
  THERMAL_DIVERGENCE: "INVALID_THERMAL_PARAMETER",
  TRANSMISSION: "INVALID_TRANSMISSION",
  BACKLASH: "INVALID_TRANSMISSION",
  RESISTANCE: "INVALID_MATERIAL",
  ACTUATOR: "INVALID_ACTUATOR",
  POWER: "INVALID_BOUNDARY",
  BATTERY: "INVALID_BOUNDARY",
  COST: "INVALID_BOUNDARY",
  REGIME: "INVALID_BOUNDARY",
  OVERFLOW: "OVERFLOW",
  NON_FINITE: "NON_FINITE",
  TIMESTEP: "INVALID_BOUNDARY",
  ENERGY: "INVALID_BOUNDARY",
  COUNTERBALANCE: "INVALID_BOUNDARY",
  SCALING_MODEL: "INVALID_GEOMETRY",
  MULTIBODY_UNSUPPORTED: "INVALID_BOUNDARY",
  PROCESS: "INVALID_BOUNDARY",
  PANINI: "INVALID_BOUNDARY",
  EXPERIMENT: "INVALID_BOUNDARY",
  CALIBRATION: "INVALID_BOUNDARY",
  UNCERTAINTY: "INVALID_BOUNDARY",
  SENSITIVITY: "INVALID_BOUNDARY",
  KINEMATICS: "INVALID_BOUNDARY",
  GRAVITY: "INVALID_BOUNDARY",
};

export class EngineeringError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "EngineeringError";
    this.code = code;
    this.canonical = CANONICAL[code] || code;
    this.details = details;
  }
}

export function assertFinite(name, value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new EngineeringError(
      "NON_FINITE",
      `${name} must be a finite number, received ${String(value)}`,
      { name, value }
    );
  }
  return value;
}

export function guardFinite(name, value, details = {}) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new EngineeringError(
      "OVERFLOW",
      `${name} is not a finite engineering result (overflow, underflow, or NaN)`,
      { name, value, ...details }
    );
  }
  return value;
}

export function assertMass(mass) {
  assertFinite("mass", mass);
  if (mass < 0) {
    throw new EngineeringError("MASS_NEGATIVE", "mass must be >= 0 kg", { mass });
  }
  return mass;
}

export function assertLength(length, name = "length") {
  assertFinite(name, length);
  if (!(length > 0)) {
    throw new EngineeringError("LENGTH_NON_POSITIVE", `${name} must be > 0 m`, { length });
  }
  return length;
}

export function assertNonNegativeLength(length, name = "length") {
  assertFinite(name, length);
  if (length < 0) {
    throw new EngineeringError("LENGTH_NON_POSITIVE", `${name} must be >= 0 m`, { length });
  }
  return length;
}

export function assertEfficiency(eta, name = "efficiency") {
  assertFinite(name, eta);
  if (!(eta > 0) || eta > 1) {
    throw new EngineeringError(
      "EFFICIENCY_RANGE",
      `${name} must satisfy 0 < η ≤ 1`,
      { eta }
    );
  }
  return eta;
}

export function assertVoltage(voltage) {
  assertFinite("voltage", voltage);
  if (!(voltage > 0)) {
    throw new EngineeringError("VOLTAGE_NON_POSITIVE", "voltage must be > 0 V", { voltage });
  }
  return voltage;
}

export function assertSafetyFactor(sf) {
  assertFinite("safetyFactor", sf);
  if (sf < 0) {
    throw new EngineeringError("SAFETY_FACTOR_NEGATIVE", "safety factor must be >= 0", { sf });
  }
  return sf;
}

export function assertUnit(actual, expected, quantity) {
  if (actual !== expected) {
    throw new EngineeringError(
      "UNIT_MISMATCH",
      `${quantity} unit ${actual} is incompatible with ${expected}`,
      { actual, expected, quantity }
    );
  }
  return true;
}

