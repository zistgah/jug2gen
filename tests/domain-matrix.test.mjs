import test from "node:test";
import assert from "node:assert/strict";
import {
  gravityTorque,
  momentOfInertiaRod,
  inertialTorque,
  proportionalFriction,
  peakTorqueUniformRod,
  mechanicalPower,
  electricalPower,
  motorCurrent,
  copperLoss,
  stageReduction,
  chainTension,
  requiredMotorTorque,
  cantileverPointDeflection,
  cantileverDistributedDeflection,
  combinedCantilever,
  safetyFactor,
  assessSafety,
  thermalSteady,
  thermalAnalytical,
  thermalTransient,
  additiveCost,
  parametricCost,
  materialParity,
  scaleFromReference,
  classifyRegime,
  counterbalanceTorque,
  motorTorqueWithCounterbalance,
  energyReduction,
  workFromTorque,
  EngineeringError,
  partFeasibility,
  reproductionAssessment,
  validateExperiment,
  calibrateAffine,
  toPhysicalIR,
  attachContracts,
  listEquations,
} from "../src/index.js";
import { oracles } from "../src/verification/oracles.js";
import { assertClose } from "../src/verification/tolerance.js";
import { mulberry32, logUniform, uniform } from "../src/verification/seeded.js";
import { DEFAULT_CASES, DEFAULT_SEED } from "../src/verification/contracts.js";

const CASES = DEFAULT_CASES;
const SEED = DEFAULT_SEED;

function fails(fn, canonical) {
  assert.throws(fn, (err) => {
    assert.equal(err.name, "EngineeringError");
    if (canonical) assert.equal(err.canonical, canonical);
    return true;
  });
}

test("contracts attach to the equation registry", () => {
  attachContracts();
  const gravity = listEquations().find((eq) => eq.id === "M_GRAVITY_001");
  assert.equal(gravity.verificationAttached, true);
  assert.equal(gravity.oracle, "m*g*Lcg");
  assert.equal(gravity.physicalValidation, "S0");
});

test("M_GRAVITY_001::REFERENCE independent oracle", () => {
  const actual = gravityTorque({ mass: 50, Lcg: 0.5, g: 9.80665 });
  assertClose(actual, oracles.gravity(50, 9.80665, 0.5), { absolute: 0, relative: 0 });
});

test("M_GRAVITY_001::BOUNDARY mass and Lcg", () => {
  assert.equal(gravityTorque({ mass: 0, Lcg: 0.5, g: 9.81 }), 0);
  assert.equal(gravityTorque({ mass: 2, Lcg: 0, g: 9.81 }), 0);
  fails(() => gravityTorque({ mass: -1e-9, Lcg: 1, g: 9.81 }), "INVALID_MASS");
  fails(() => gravityTorque({ mass: 1, Lcg: -1e-9, g: 9.81 }), "INVALID_LENGTH");
  fails(() => gravityTorque({ mass: Number.NaN, Lcg: 1, g: 9.81 }), "NON_FINITE");
  fails(() => gravityTorque({ mass: 1, Lcg: Number.POSITIVE_INFINITY, g: 9.81 }), "NON_FINITE");
});

test("M_GRAVITY_001::PROPERTY linear and metamorphic", () => {
  const rng = mulberry32(SEED);
  for (let i = 0; i < CASES; i++) {
    const mass = logUniform(rng, 1e-6, 1e5);
    const g = logUniform(rng, 1e-3, 30);
    const Lcg = logUniform(rng, 1e-6, 20);
    const tau = gravityTorque({ mass, g, Lcg });
    assertClose(tau, oracles.gravity(mass, g, Lcg));
    assert.ok(tau >= 0);
    assertClose(gravityTorque({ mass: 2 * mass, g, Lcg }), 2 * tau);
    assertClose(gravityTorque({ mass, g: 2 * g, Lcg }), 2 * tau);
    assertClose(gravityTorque({ mass, g, Lcg: 2 * Lcg }), 2 * tau);
  }
});

test("M_INERTIA_001::PROPERTY quadratic length", () => {
  const rng = mulberry32(SEED + 1);
  for (let i = 0; i < CASES; i++) {
    const mass = logUniform(rng, 1e-6, 1e4);
    const length = logUniform(rng, 1e-4, 10);
    const I = momentOfInertiaRod(mass, length);
    assertClose(I, oracles.inertia(mass, length));
    assertClose(momentOfInertiaRod(2 * mass, length), 2 * I);
    assertClose(momentOfInertiaRod(mass, 2 * length), 4 * I);
  }
  assert.equal(momentOfInertiaRod(0, 1), 0);
  fails(() => momentOfInertiaRod(1, 0), "INVALID_LENGTH");
  fails(() => momentOfInertiaRod(-1, 1), "INVALID_MASS");
});

test("M_INERTIAL_001::PROPERTY sign and linearity", () => {
  const rng = mulberry32(SEED + 2);
  for (let i = 0; i < CASES; i++) {
    const I = logUniform(rng, 1e-8, 1e3);
    const alpha = uniform(rng, -20, 20);
    const tau = inertialTorque(I, alpha);
    assertClose(tau, oracles.inertial(I, alpha));
    assert.equal(Math.sign(tau), Math.sign(alpha));
    assertClose(inertialTorque(2 * I, alpha), 2 * tau);
  }
  assert.equal(inertialTorque(3, 0), 0);
  fails(() => inertialTorque(-1, 1), "INVALID_GEOMETRY");
});

test("M_DYN_002::REFERENCE canonical peak is independent", () => {
  const actual = peakTorqueUniformRod({
    mass: 50,
    length: 1,
    alpha: 1,
    g: 9.80665,
    cgFraction: 0.5,
    frictionModel: "proportional",
    frictionRatio: 0.04,
  });
  const oracle = oracles.peak({ mass: 50, length: 1, alpha: 1, g: 9.80665, kF: 0.04 });
  assertClose(actual.tauPeak, oracle.tau);
  assertClose(actual.tauPeak, 272.306233333333);
});

test("M_POWER_001::PROPERTY", () => {
  const rng = mulberry32(SEED + 3);
  for (let i = 0; i < CASES; i++) {
    const tau = uniform(rng, -100, 100);
    const omega = uniform(rng, -40, 40);
    const P = mechanicalPower(tau, omega);
    assertClose(P, oracles.power(tau, omega));
    assert.equal(Math.sign(P), Math.sign(tau * omega));
    assertClose(mechanicalPower(2 * tau, omega), 2 * P);
  }
  assert.equal(mechanicalPower(0, 4), 0);
  assert.equal(mechanicalPower(4, 0), 0);
});

test("M_POWER_002::BOUNDARY efficiency", () => {
  assertClose(electricalPower(10, 1), 10);
  fails(() => electricalPower(10, 0), "INVALID_EFFICIENCY");
  fails(() => electricalPower(10, 1 + 1e-9), "INVALID_EFFICIENCY");
  fails(() => motorCurrent({ tau: 1, omega: 1, eta: 0.5, voltage: 0 }), "INVALID_VOLTAGE");
  assertClose(copperLoss(2, 3), oracles.copper(2, 3));
});

test("M_TRANS_001::BOUNDARY ratio", () => {
  const stage = stageReduction({ teethIn: 10, teethOut: 20, eta: 1, tauIn: 3, omegaIn: 8 });
  assert.equal(stage.R, 2);
  assert.equal(stage.omegaOut, 4);
  assert.equal(stage.tauOut, 6);
  const doubled = stageReduction({ teethIn: 10, teethOut: 40, eta: 1, tauIn: 3, omegaIn: 8 });
  assert.equal(doubled.tauOut, 2 * stage.tauOut);
  assert.equal(doubled.omegaOut, stage.omegaOut / 2);
  fails(() => stageReduction({ teethIn: 0, teethOut: 10, eta: 1 }), "INVALID_TRANSMISSION");
  fails(() => stageReduction({ teethIn: 1.5, teethOut: 10, eta: 1 }), "INVALID_TRANSMISSION");
  fails(() => requiredMotorTorque(10, 0, 0.9), "INVALID_TRANSMISSION");
  assertClose(chainTension(4, 0.2), oracles.chain(4, 0.2));
  fails(() => chainTension(4, 0), "INVALID_TRANSMISSION");
});

test("M_DEFL structural load cases stay distinct", () => {
  const point = cantileverPointDeflection(100, 1, 200e9, 1e-6);
  assertClose(point, oracles.pointDeflection(100, 1, 200e9, 1e-6));
  const distributed = cantileverDistributedDeflection(100, 1, 200e9, 1e-6);
  assertClose(distributed, oracles.distributedDeflection(100, 1, 200e9, 1e-6));
  assert.notEqual(point, distributed);
  const combined = combinedCantilever({
    weight: 100,
    payload: 20,
    payloadX: 1,
    length: 1,
    youngs: 200e9,
    I: 1e-6,
  });
  assert.equal(combined.loadCase, "self-weight+payload");
  assert.ok(combined.delta > distributed);
});

test("M_SF_001::BOUNDARY mathematical feasibility vs acceptance", () => {
  assertClose(safetyFactor(200, 100), 2);
  const at = assessSafety(200, 100, 2);
  const below = assessSafety(199, 100, 2);
  const above = assessSafety(201, 100, 2);
  assert.equal(at.pass, true);
  assert.equal(below.pass, false);
  assert.equal(above.pass, true);
});

test("M_THERM_002::BOUNDARY and monotonicity", () => {
  assertClose(thermalSteady({ ambient: 300, powerLoss: 10, Rth: 2 }), oracles.thermalSteady(300, 10, 2));
  assert.equal(thermalSteady({ ambient: 300, powerLoss: 0, Rth: 2 }), 300);
  fails(() => thermalSteady({ ambient: 300, powerLoss: 1, Rth: 0 }), "INVALID_THERMAL_PARAMETER");
  const cool = thermalSteady({ ambient: 300, powerLoss: 1, Rth: 2 });
  const hot = thermalSteady({ ambient: 300, powerLoss: 2, Rth: 2 });
  assert.ok(hot > cool);
});

test("M_COST_001::PROPERTY increasing a component cannot decrease total", () => {
  const rng = mulberry32(SEED + 4);
  for (let i = 0; i < CASES; i++) {
    const base = {
      material: uniform(rng, 0, 10),
      energy: uniform(rng, 0, 10),
      tools: uniform(rng, 0, 10),
      labour: uniform(rng, 0, 10),
      process: uniform(rng, 0, 10),
      testing: uniform(rng, 0, 10),
      overhead: uniform(rng, 0, 10),
      failure: uniform(rng, 0, 10),
      mass: 2,
    };
    const a = additiveCost(base);
    const b = additiveCost({ ...base, labour: base.labour + 1 });
    assert.ok(b.total >= a.total);
    assertClose(a.total, Object.values({
      material: base.material,
      energy: base.energy,
      tools: base.tools,
      labour: base.labour,
      process: base.process,
      testing: base.testing,
      overhead: base.overhead,
      failure: base.failure,
    }).reduce((s, v) => s + v, 0));
  }
  fails(() => additiveCost({ material: -1 }), "INVALID_BOUNDARY");
  const priced = parametricCost({ mass: 2, pricePerKg: 3, infrastructure: 1, actuation: 1, precision: 1 });
  const heavier = parametricCost({ mass: 3, pricePerKg: 3, infrastructure: 1, actuation: 1, precision: 1 });
  assert.ok(heavier.material > priced.material);
});

test("M_SCALE_001::PROPERTY similarity and custom mode", () => {
  const rng = mulberry32(SEED + 5);
  for (let i = 0; i < 200; i++) {
    const s = logUniform(rng, 0.2, 5);
    const scaled = scaleFromReference({ L: s, Lref: 1, mRef: 10, tauGRef: 4, tauIRef: 8 });
    assertClose(scaled.mass, oracles.scaleMass(10, s));
    assertClose(scaled.tauG, oracles.scaleTauG(4, s));
    assertClose(scaled.tauI, oracles.scaleTauI(8, s));
  }
  const custom = scaleFromReference({ L: 2, Lref: 1, mRef: 10, tauGRef: 4, tauIRef: 8, model: "custom_geometry" });
  assert.equal(custom.mass, null);
});

test("counterbalance and energy reduction are not clamped", () => {
  const equal = motorTorqueWithCounterbalance({ tauG: 10, tauI: 0, tauF: 0, tauExt: 0, tauCb: 10 });
  assert.equal(equal, 0);
  const reversed = motorTorqueWithCounterbalance({ tauG: 10, tauI: 0, tauF: 0, tauExt: 0, tauCb: 12 });
  assert.ok(reversed < 0);
  const worse = energyReduction(10, 12);
  assert.ok(worse.ratio < 0);
  const none = energyReduction(10, 0);
  assertClose(none.ratio, 1);
  assert.equal(counterbalanceTorque({ model: "fraction", fraction: 1, tauG: 7 }), 7);
});

test("regime and manufacturing and sovereignty boundaries", () => {
  const B = [1.2, 10, 150, 500];
  assert.equal(classifyRegime(1.2 - 1e-9, B).id, "precision_wall");
  assert.equal(classifyRegime(1.2, B).id, "bridge");
  assert.equal(classifyRegime(10, B).id, "swaraj");
  assert.equal(classifyRegime(150, B).id, "swaraj");
  assert.equal(classifyRegime(150 + 1e-9, B).id, "handling_wall");
  assert.equal(classifyRegime(500, B).id, "handling_wall");
  assert.equal(classifyRegime(500 + 1e-6, B).id, "industrial");
  const process = 1e-3;
  const tight = partFeasibility({ name: "a", materialId: "mild_steel", processId: "saw", toleranceM: process - 1e-6, massKg: 1, lengthM: 1 });
  const at = partFeasibility({ name: "a", materialId: "mild_steel", processId: "saw", toleranceM: process, massKg: 1, lengthM: 1 });
  const loose = partFeasibility({ name: "a", materialId: "mild_steel", processId: "saw", toleranceM: process + 1e-6, massKg: 1, lengthM: 1 });
  assert.equal(tight.feasible, false);
  assert.equal(at.feasible, true);
  assert.equal(loose.feasible, true);
  assert.equal(reproductionAssessment([{ hours: 72 }], 72).allWithinCriterion, true);
  assert.equal(reproductionAssessment([{ hours: 72.1 }], 72).allWithinCriterion, false);
});

test("experiment schema and affine calibration recover known parameters", () => {
  fails(() => validateExperiment({ id: "x" }), "INVALID_BOUNDARY");
  fails(() => validateExperiment({
    id: "x", quantity: "torque", unit: "N*m", evidence: "C6", samples: [{ t: 0, value: Number.NaN }],
  }), "INVALID_BOUNDARY");
  const pairs = [];
  for (let x = 0; x < 6; x++) pairs.push({ x, y: 1.5 + 2.25 * x });
  const fit = calibrateAffine(pairs);
  assertClose(fit.a, 1.5);
  assertClose(fit.b, 2.25);
});

test("PANINI adapter rejects invalid input and round-trips deterministically", () => {
  fails(() => toPhysicalIR({ L: 0, m: 1, tau: 1, P: 1, V: 12 }), "INVALID_BOUNDARY");
  const a = toPhysicalIR({ L: 1, m: 2, tau: 3, P: 0.001, V: 12 });
  const b = toPhysicalIR({ L: 1, m: 2, tau: 3, P: 0.001, V: 12 });
  assert.equal(a.digest, b.digest);
  assert.equal(a.physicalValidation, "S0");
});

test("material parity actual cost is not below the declared limit", () => {
  const parity = materialParity({
    massesAndPrices: [{ mass: 2, pricePerKg: 5 }],
    processEnergyCost: 3,
    retained: { labour: 4, tools: 1 },
  });
  assert.ok(parity.actual >= parity.limit);
});

test("work can be negative", () => {
  assert.equal(workFromTorque([{ tau: -2, dTheta: 0.5 }]), -1);
  assert.equal(workFromTorque([{ tau: 0, dTheta: 1 }]), 0);
});
