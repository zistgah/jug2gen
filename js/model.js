/**
 * Jugaad-to-Genesis parametric mechanical model.
 * Governing torque is delegated to the V1.0 engine. Heuristic boundaries and
 * illustrative costs remain labelled assumptions, not a second physics core.
 */

import { peakTorqueUniformRod, rigidBodyInterface } from "../src/physics/mechanics.js";

export const TAXONOMY = {
  precisionWallKg: 1.2,
  troughLowKg: 10,
  craneWallKg: 150,
  nodeTargetInr: 4000,
  scrapSteelInrPerKg: 62,
  scrapCopperInrPerKg: 780,
};

export const PRESETS = [
  {
    id: "micro",
    name: "Precision wall",
    note: "Desktop / micro-actuator regime",
    L: 0.1,
    m: 0.5,
    alpha: 8,
    P: 50,
    V: 12,
    eta: 0.55,
    counterbalance: 0.05,
    density: 1800,
  },
  {
    id: "rc",
    name: "COTS bridge",
    note: "Geared RC / NEMA class",
    L: 0.4,
    m: 5,
    alpha: 4,
    P: 200,
    V: 12,
    eta: 0.62,
    counterbalance: 0.2,
    density: 2700,
  },
  {
    id: "swaraj",
    name: "Swaraj node",
    note: "Material-parity trough, ₹4,000 class target",
    L: 1.0,
    m: 50,
    alpha: 1.2,
    P: 1000,
    V: 12,
    eta: 0.7,
    counterbalance: 0.85,
    density: 7850,
  },
  {
    id: "kink",
    name: "Crane kink",
    note: "Human lifting limit",
    L: 2.0,
    m: 150,
    alpha: 0.6,
    P: 1500,
    V: 48,
    eta: 0.72,
    counterbalance: 0.7,
    density: 7850,
  },
  {
    id: "crane",
    name: "Infrastructure",
    note: "Three-phase / hydraulic regime",
    L: 4.0,
    m: 500,
    alpha: 0.25,
    P: 2000,
    V: 400,
    eta: 0.78,
    counterbalance: 0.55,
    density: 7850,
  },
];

export function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}

export function regimeOf(m) {
  if (m < TAXONOMY.precisionWallKg) {
    return {
      id: "precision",
      name: "Precision wall",
      band: "Miniaturisation kink",
      detail: "Actuation and tolerance decouple from mass. Salvage chains collapse; micro-COTS dominate.",
    };
  }
  if (m < TAXONOMY.troughLowKg) {
    return {
      id: "bridge",
      name: "Bridge band",
      band: "1.2–10 kg",
      detail: "Bench tools and appliance motors. Not yet scrap-parity; still COTS-sensitive.",
    };
  }
  if (m <= TAXONOMY.craneWallKg) {
    return {
      id: "swaraj",
      name: "Material-parity trough",
      band: "Swaraj zone",
      detail: "Hand tools, scrap steel, wiper or starter motors, chain reduction. Infrastructure cost approaches zero.",
    };
  }
  return {
    id: "crane",
    name: "Crane wall",
    band: "Scale-up kink",
    detail: "Two-person handling fails. Cranes, thick cable, and 3-phase or hydraulics become mandatory.",
  };
}

/** Peak torque. Authoritative calculation is the engine, not a UI copy. */
export function torqueModel({ m, L, alpha, frictionRatio = 0.04, g = 9.80665 }) {
  const r = peakTorqueUniformRod({
    mass: m,
    length: L,
    alpha,
    g,
    cgFraction: 0.5,
    frictionModel: "proportional",
    frictionRatio,
  });
  return { g: r.g, Lcg: r.Lcg, tauG: r.tauG, tauI: r.tauI, tauF: r.tauF, tauPeak: r.tauPeak };
}

export function similarityScale(L, density) {
  const Lref = 1;
  const mRef = density * 0.012 * Lref ** 3;
  return mRef * (L / Lref) ** 3;
}

/**
 * Illustrative specific cost (INR/kg). Piecewise infrastructure, not a market quote.
 * Precision term asymptotes as m → 0. Crane term steps above 150 kg.
 */
export function specificCost(m, P = 1000) {
  const scrap = 88;
  const precision = (14000 + P * 1.6) * Math.exp(-m / 0.42) / Math.max(m, 0.05);
  const actuation = 36 + 22 * Math.pow(Math.max(m, 0.2), 0.22);
  const hand = m < 150 ? 14 : 14 * Math.exp(-(m - 150) / 400);
  const crane =
    m <= 150
      ? 6 * Math.pow(m / 150, 2)
      : 210 + 160 * (1 - Math.exp(-(m - 150) / 90));
  const microPenalty = m < 1.2 ? 40 * (1.2 / Math.max(m, 0.08) - 1) : 0;
  return {
    scrap,
    precision,
    actuation,
    infrastructure: hand + crane + microPenalty,
    total: scrap + precision + actuation + hand + crane + microPenalty,
  };
}

export function totalCost(m, P) {
  return specificCost(m, P).total * m;
}

export function actuatorFor(m, tau) {
  if (m < 1.2 || tau < 1) {
    return {
      name: "NEMA 14 / micro DC gearmotor",
      driver: "Precision tooling",
      voltage: "5–12 V",
      duty: "Continuous, low torque",
    };
  }
  if (m < 10 || tau < 20) {
    return {
      name: "NEMA 23 / geared RC motor",
      driver: "COTS import prices",
      voltage: "12–24 V",
      duty: "Intermittent to continuous",
    };
  }
  if (m < 80 || tau < 250) {
    return {
      name: "Wiper motor + chain reduction",
      driver: "Scrap parity",
      voltage: "12 V",
      duty: "60–80% continuous, thermal cutout",
    };
  }
  if (m <= 180 || tau < 2000) {
    return {
      name: "Starter / e-rickshaw BLDC",
      driver: "Human lifting limit",
      voltage: "12–48 V",
      duty: "Starter: bursts. BLDC: longer duty",
    };
  }
  return {
    name: "3-phase AC gearmotor / hydraulics",
    driver: "Capital infrastructure",
    voltage: "400 V AC or hydraulic",
    duty: "Industrial continuous",
  };
}

export function chainStage(tauMotor, tauNeed) {
  const raw = tauNeed / Math.max(tauMotor, 0.05);
  const stages = raw <= 4.5 ? 1 : raw <= 18 ? 2 : 3;
  const ratio = Math.max(1, raw);
  return { ratio, stages, perStage: Math.pow(ratio, 1 / stages) };
}

/** Motor torque with passive counterbalance. Gravity and inertia come from the engine. */
export function motorTorqueAt(theta, state) {
  const { m, L, alpha, counterbalance, b = 0.08 } = state;
  const link = rigidBodyInterface().evaluateSingleLink(theta, 0.4, alpha, {
    mass: m,
    length: L,
    g: 9.80665,
    cgFraction: 1,
    frictionModel: "viscous",
    b,
  });
  const grav = link.G;
  const cb = counterbalance * grav;
  return {
    grav,
    cb,
    inertial: link.M * alpha,
    visc: link.F,
    motor: link.tauAct - cb,
  };
}

/** Energy to lift from -20° to 70° at constant α, with and without counterbalance. */
export function liftEnergy(state) {
  const steps = 80;
  const th0 = (-20 * Math.PI) / 180;
  const th1 = (70 * Math.PI) / 180;
  let eOn = 0;
  let eOff = 0;
  for (let i = 0; i < steps; i++) {
    const t = th0 + ((th1 - th0) * i) / steps;
    const dth = (th1 - th0) / steps;
    const on = motorTorqueAt(t, state);
    const off = motorTorqueAt(t, { ...state, counterbalance: 0 });
    eOn += Math.max(on.motor, 0) * dth;
    eOff += Math.max(off.motor, 0) * dth;
  }
  const saved = eOff > 0 ? (eOff - eOn) / eOff : 0;
  return { eOn, eOff, saved };
}

export function voltageClass(V) {
  if (V <= 12) return { name: "12 V automotive", note: "Wiper, starter, scavenged harness" };
  if (V <= 48) return { name: "48 V traction", note: "E-rickshaw class, thicker cable" };
  return { name: "400 V three-phase", note: "Industrial supply, not a roadside node" };
}

export function capabilityVector(state) {
  const r = regimeOf(state.m);
  const base = {
    precision: [22, 48, 18, 35],
    bridge: [40, 55, 42, 48],
    swaraj: [62, 70, 66, 58],
    crane: [48, 60, 74, 44],
  }[r.id];
  const skill = state.skill || 2;
  const compute = state.compute || 2;
  return [
    { key: "M", name: "Materials", score: clamp(base[0] + (state.m > 10 && state.m < 150 ? 8 : 0), 5, 96) },
    { key: "F", name: "Fabrication", score: clamp(base[1] - Math.log10(Math.max(state.P, 20)) * 4, 5, 96) },
    { key: "A", name: "Actuation", score: clamp(base[2] + state.counterbalance * 12, 5, 96) },
    { key: "S", name: "Sensing", score: clamp(28 + compute * 14, 5, 96) },
    { key: "K", name: "Compute", score: clamp(18 + compute * 18, 5, 96) },
    { key: "E", name: "Energy", score: clamp(30 + state.eta * 40, 5, 96) },
    { key: "W", name: "Winding", score: clamp(base[3] + skill * 6, 5, 96) },
    { key: "V", name: "Verification", score: clamp(20 + skill * 12 + (compute > 2 ? 10 : 0), 5, 96) },
    { key: "H", name: "Human skill", score: clamp(skill * 22, 5, 96) },
    { key: "O", name: "Organisation", score: clamp(15 + skill * 10 + (r.id === "swaraj" ? 12 : 0), 5, 96) },
  ];
}

export const STAGE_REF = {
  Jugaad: [38, 32, 40, 22, 18, 30, 24, 20, 28, 18],
  Swaraj: [62, 68, 64, 58, 55, 60, 66, 62, 58, 64],
  Genesis: [88, 90, 86, 84, 92, 80, 85, 90, 78, 82],
};

export const BOM_TEMPLATE = [
  { id: "steel", cat: "Structure", item: "Salvaged mild steel angle", source: "Scrap yard", salvage: true, cost: 450 },
  { id: "motor", cat: "Motors", item: "Automotive wiper motor", source: "Breaker yard", salvage: true, cost: 800 },
  { id: "chain", cat: "Transmission", item: "Motorcycle chain + sprockets", source: "Two-wheeler scrap", salvage: true, cost: 350 },
  { id: "bear", cat: "Bearings", item: "Reconditioned pillow block", source: "Bearing scrap", salvage: true, cost: 250 },
  { id: "fast", cat: "Fasteners", item: "Bolts, nuts, threaded rod", source: "Hardware", salvage: false, cost: 150 },
  { id: "mcu", cat: "Electronics", item: "ESP32 or recycled MCU", source: "New / used", salvage: false, cost: 450 },
  { id: "drv", cat: "Electronics", item: "MOSFET H-bridge", source: "Fabricated / buy", salvage: false, cost: 550 },
  { id: "wire", cat: "Wiring", item: "Automotive copper wire", source: "Scrap yard", salvage: true, cost: 150 },
  { id: "pwr", cat: "Power", item: "12 V battery or recycled SMPS", source: "Salvaged", salvage: true, cost: 500 },
  { id: "sens", cat: "Sensors", item: "Potentiometer / optical strip", source: "Recycled / buy", salvage: false, cost: 150 },
  { id: "tool", cat: "Tools", item: "Hand tools depreciation", source: "Workshop", salvage: true, cost: 200 },
];

export function bomTotal(rows, priceLabour) {
  const parts = rows.reduce((s, r) => s + Number(r.cost || 0), 0);
  const labour = priceLabour ? 1200 : 0;
  return { parts, labour, total: parts + labour };
}

export function closureStatement(m) {
  const r = regimeOf(m);
  if (r.id === "precision") {
    return "Local salvage does not close this node. Micro bearings, planar coils, and fine tolerances stay imported.";
  }
  if (r.id === "bridge") {
    return "Partial closure. Structure can be local; actuators and encoders are still mostly purchased COTS.";
  }
  if (r.id === "swaraj") {
    return "Critical path can sit inside a two-person workshop: scrap, weld, chain, wiper, ESP32. This is the proposed Swaraj trough.";
  }
  return "Handling and power leave the roadside shop. Closure needs a crane, thick feeders, and a capitalised bay.";
}

export function sweepCost(pMin = 0.25, pMax = 600, n = 160) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const m = Math.exp(Math.log(pMin) + t * (Math.log(pMax) - Math.log(pMin)));
    pts.push({ m, c: specificCost(m).total });
  }
  return pts;
}

export function format(n, d = 1) {
  if (!Number.isFinite(n)) return ", ";
  const a = Math.abs(n);
  if (a >= 1000) return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  if (a >= 100) return n.toFixed(0);
  if (a >= 10) return n.toFixed(d);
  return n.toFixed(Math.max(d, 2));
}
