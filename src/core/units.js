/**
 * Project-wide unit convention.
 * SI base for computation. Display conversions are explicit.
 * Never silently mix mm/m, g/kg, rpm/rad/s, W/kW, J/Wh, N/kgf, N·mm/N·m.
 */

export const SI = {
  length: "m",
  mass: "kg",
  time: "s",
  force: "N",
  torque: "N*m",
  angle: "rad",
  angularVelocity: "rad/s",
  angularAcceleration: "rad/s^2",
  power: "W",
  energy: "J",
  voltage: "V",
  current: "A",
  resistance: "ohm",
  temperature: "K",
  stress: "Pa",
  density: "kg/m^3",
  inertia: "kg*m^2",
};

export const CONVERSIONS = {
  mm_to_m: 1e-3,
  g_to_kg: 1e-3,
  rpm_to_rad_s: Math.PI / 30,
  deg_to_rad: Math.PI / 180,
  kW_to_W: 1e3,
  Wh_to_J: 3600,
  kgf_to_N: 9.80665,
  Nmm_to_Nm: 1e-3,
  C_to_K: 273.15,
};

export function mmToM(mm) {
  return mm * CONVERSIONS.mm_to_m;
}

export function gToKg(g) {
  return g * CONVERSIONS.g_to_kg;
}

export function rpmToRadS(rpm) {
  return rpm * CONVERSIONS.rpm_to_rad_s;
}

export function radSToRpm(omega) {
  return omega / CONVERSIONS.rpm_to_rad_s;
}

export function degToRad(deg) {
  return deg * CONVERSIONS.deg_to_rad;
}

export function radToDeg(rad) {
  return rad / CONVERSIONS.deg_to_rad;
}

export function kWToW(kW) {
  return kW * CONVERSIONS.kW_to_W;
}

export function WhToJ(Wh) {
  return Wh * CONVERSIONS.Wh_to_J;
}

export function JToWh(J) {
  return J / CONVERSIONS.Wh_to_J;
}

export function kgfToN(kgf) {
  return kgf * CONVERSIONS.kgf_to_N;
}

export function NmmToNm(Nmm) {
  return Nmm * CONVERSIONS.Nmm_to_Nm;
}

export function celsiusToKelvin(C) {
  return C + CONVERSIONS.C_to_K;
}

/**
 * Quantity is a value plus an explicit unit tag.
 * Arithmetic refuses incompatible units. It does not auto-convert.
 */
export function quantity(value, unit, meta = {}) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`quantity ${meta.name || ""} is not finite`);
  }
  return { value, unit, ...meta };
}

export function sameUnit(a, b) {
  if (a.unit !== b.unit) {
    throw new Error(`unit mismatch: ${a.unit} vs ${b.unit}`);
  }
  return true;
}

export function addQ(a, b) {
  sameUnit(a, b);
  return quantity(a.value + b.value, a.unit);
}

export function scaleQ(q, k) {
  return quantity(q.value * k, q.unit);
}
