import test from "node:test";
import assert from "node:assert/strict";
import { torqueModel } from "../js/model.js";
import {
  gravityTorque,
  momentOfInertiaRod,
  inertialTorque,
  frictionTorque,
  peakTorqueUniformRod,
  counterbalanceTorque,
  motorTorqueWithCounterbalance,
  workFromTorque,
  energyReduction,
  scaleFromReference,
  differentiateAngle,
  rigidBodyInterface,
  massFromSimilarity,
  massFromGeometry,
  EngineeringError,
  mechanicalPower,
  electricalPower,
  motorCurrent,
  copperLoss,
  stageReduction,
  requiredMotorTorque,
  multiStage,
  chainTension,
  backlash,
  bendingStress,
  secondMomentRectangular,
  secondMomentCircular,
  cantileverPointDeflection,
  torsionalShear,
  polarMomentSolid,
  vonMisesShaft,
  safetyFactor,
  thermalSteady,
  thermalTransient,
  additiveCost,
  parametricCost,
  materialParity,
  classifyRegime,
  propagateUncertainty,
  normalizedSensitivity,
  integrate,
  closeRectangularLink,
  partFeasibility,
  toPhysicalIR,
  verificationChecklist,
  eventToDecision,
  validateExperiment,
  calibrateAffine,
  ANALYTICAL_REFERENCE,
  evaluateCase,
  auditPosterTorque,
  listEquations,
  conductorResistance,
  batteryEnergy,
  runtimeHours,
  fatigueInterface,
  reproductionAssessment,
  genesisAssessment,
  quantity,
  addQ,
  rpmToRadS,
} from "../src/index.js";

test("TEST-GRAVITY-001 gravity torque", () => {
  const tau = gravityTorque({ mass: 50, length: 1, cgFraction: 0.5, g: 9.80665 });
  assert.equal(tau, 245.16625);
});

test("TEST-INERTIA-001 rod inertia", () => {
  assert.ok(Math.abs(momentOfInertiaRod(50, 1) - 50 / 3) < 1e-12);
});

test("TEST-INERTIA-002 inertial torque", () => {
  assert.equal(inertialTorque(50 / 3, 1), 50 / 3);
});

test("TEST-FRICTION-001 friction models", () => {
  assert.equal(frictionTorque({ model: "viscous", b: 2, omega: 3 }), 6);
  assert.equal(frictionTorque({ model: "coulomb", coulomb: 4, omega: -1 }), -4);
  assert.equal(frictionTorque({ model: "combined", b: 2, omega: 3, coulomb: 1 }), 7);
  assert.equal(frictionTorque({ model: "proportional", kF: 0.04, tauG: 100, tauI: 25 }), 5);
});

test("TEST-ANALYTICAL-001 exact reference", () => {
  const r = peakTorqueUniformRod({
    mass: 50,
    length: 1,
    alpha: 1,
    g: 9.80665,
    cgFraction: 0.5,
    frictionModel: "proportional",
    frictionRatio: 0.04,
  });
  assert.equal(r.Lcg, ANALYTICAL_REFERENCE.Lcg);
  assert.ok(Math.abs(r.I - ANALYTICAL_REFERENCE.I) < 1e-12);
  assert.ok(Math.abs(r.tauG - ANALYTICAL_REFERENCE.tauG) < 1e-9);
  assert.ok(Math.abs(r.tauI - ANALYTICAL_REFERENCE.tauI) < 1e-9);
  assert.ok(Math.abs(r.tauF - ANALYTICAL_REFERENCE.tauF) < 1e-9);
  assert.ok(Math.abs(r.tauPeak - ANALYTICAL_REFERENCE.tauPeak) < 1e-9);
  assert.ok(Math.abs(r.tauPeak - 272.3062333333333) < 1e-9);
});

test("UI torque path still matches engine", () => {
  const ui = torqueModel({ m: 50, L: 1, alpha: 1.2 });
  const eng = peakTorqueUniformRod({
    mass: 50,
    length: 1,
    alpha: 1.2,
    frictionModel: "proportional",
    frictionRatio: 0.04,
  });
  assert.ok(Math.abs(ui.tauPeak - eng.tauPeak) < 1e-9);
});

test("TEST-CB-001 counterbalance reduces actuator torque not energy by fiat", () => {
  const tauG = 100;
  const tauCb = counterbalanceTorque({ model: "fraction", fraction: 0.5, tauG });
  const motor = motorTorqueWithCounterbalance({ tauG, tauI: 10, tauF: 0, tauExt: 0, tauCb });
  assert.equal(tauCb, 50);
  assert.equal(motor, 60);
  const spring = counterbalanceTorque({ model: "spring", k: 100, x: 0.02, dPerp: 0.1 });
  assert.equal(spring, 0.2);
});

test("TEST-ENERGY-001 work and reduction", () => {
  const w0 = workFromTorque([{ tau: 10, dTheta: 0.1 }, { tau: 10, dTheta: 0.1 }]);
  const wcb = workFromTorque([{ tau: 4, dTheta: 0.1 }, { tau: 4, dTheta: 0.1 }]);
  assert.equal(w0, 2);
  const red = energyReduction(w0, wcb);
  assert.ok(Math.abs(red.ratio - 0.6) < 1e-12);
  assert.equal(red.physicalValidation, "S0");
});

test("TEST-SCALE-001 similarity exponents", () => {
  const s = scaleFromReference({ L: 2, Lref: 1, mRef: 10, tauGRef: 4, tauIRef: 8 });
  assert.equal(s.mass, 80);
  assert.equal(s.tauG, 64);
  assert.equal(s.tauI, 256);
  const custom = scaleFromReference({ L: 2, Lref: 1, mRef: 1, tauGRef: 1, tauIRef: 1, model: "custom_geometry" });
  assert.equal(custom.mass, null);
});

test("mass models", () => {
  assert.equal(massFromSimilarity({ density: 1000, volumeCoefficient: 0.5, length: 2 }), 4000);
  assert.equal(massFromGeometry({ density: 7850, area: 0.01, length: 1 }), 78.5);
});

test("TEST-POWER-001 power current copper", () => {
  assert.equal(mechanicalPower(10, 2), 20);
  assert.ok(Math.abs(electricalPower(20, 0.5) - 40) < 1e-12);
  assert.ok(Math.abs(motorCurrent({ tau: 10, omega: 2, eta: 0.5, voltage: 10 }) - 4) < 1e-12);
  assert.equal(copperLoss(2, 3), 12);
});

test("TEST-TRANS-001 transmission", () => {
  const stage = stageReduction({ teethIn: 10, teethOut: 30, eta: 0.9, tauIn: 2, omegaIn: 9 });
  assert.equal(stage.R, 3);
  assert.equal(stage.omegaOut, 3);
  assert.ok(Math.abs(stage.tauOut - 5.4) < 1e-12);
  assert.ok(Math.abs(requiredMotorTorque(5.4, 3, 0.9) - 2) < 1e-12);
  const multi = multiStage([
    { teethIn: 10, teethOut: 20, eta: 0.9 },
    { teethIn: 10, teethOut: 20, eta: 0.9 },
  ]);
  assert.equal(multi.R, 4);
  assert.ok(Math.abs(multi.eta - 0.81) < 1e-12);
});

test("TEST-CHAIN-001 chain and backlash", () => {
  assert.equal(chainTension(10, 0.05), 200);
  const b = backlash(Math.PI / 180);
  assert.ok(Math.abs(b.deg - 1) < 1e-12);
});

test("TEST-BEND-001 bending", () => {
  const I = secondMomentRectangular(0.02, 0.04);
  assert.ok(Math.abs(I - (0.02 * 0.04 ** 3) / 12) < 1e-15);
  assert.ok(Math.abs(bendingStress(100, 0.02, I) - (100 * 0.02) / I) < 1e-9);
  assert.ok(Math.abs(secondMomentCircular(0.02) - (Math.PI * 0.02 ** 4) / 64) < 1e-15);
});

test("TEST-DEFL-001 cantilever", () => {
  const d = cantileverPointDeflection(100, 1, 200e9, 1e-6);
  assert.ok(Math.abs(d - 100 / (3 * 200e9 * 1e-6)) < 1e-12);
});

test("TEST-VM-001 torsion and von Mises", () => {
  const J = polarMomentSolid(0.02);
  const tau = torsionalShear(10, 0.01, J);
  const vm = vonMisesShaft(100e6, tau);
  assert.ok(vm > 100e6);
  assert.equal(safetyFactor(200, 100), 2);
});

test("TEST-THERM-001 steady and transient", () => {
  const Tss = thermalSteady({ ambient: 300, powerLoss: 10, Rth: 2 });
  assert.equal(Tss, 320);
  const tr = thermalTransient({ ambient: 300, powerLoss: 10, Rth: 1, Cth: 5, T0: 300, dt: 0.05, steps: 400 });
  assert.ok(Math.abs(tr.T - tr.Tss) < 0.5);
  assert.throws(() => thermalTransient({ ambient: 300, powerLoss: 1e9, Rth: 1, Cth: 1e-9, T0: 300, dt: 10, steps: 5, limit: 1e4 }));
});

test("TEST-COST-001 cost and parity", () => {
  const add = additiveCost({ material: 10, energy: 1, tools: 2, labour: 3, process: 4, testing: 5, overhead: 6, failure: 7, mass: 2 });
  assert.equal(add.total, 38);
  assert.equal(add.specific, 19);
  const par = parametricCost({ mass: 2, pricePerKg: 10, infrastructure: 5, actuation: 4, precision: 1 });
  assert.equal(par.total, 30);
  assert.notEqual(add.total, par.total);
  const lim = materialParity({
    massesAndPrices: [{ mass: 2, pricePerKg: 10 }],
    processEnergyCost: 3,
    retained: { labour: 4, tools: 1 },
  });
  assert.equal(lim.limit, 23);
  assert.equal(lim.actual, 28);
});

test("TEST-REGIME-001 configurable regimes", () => {
  assert.equal(classifyRegime(0.5).id, "precision_wall");
  assert.equal(classifyRegime(50).id, "swaraj");
  assert.equal(classifyRegime(200).id, "handling_wall");
  assert.equal(classifyRegime(800).id, "industrial");
  assert.equal(classifyRegime(50, [0.2, 1, 40, 80]).id, "handling_wall");
  assert.equal(classifyRegime(90, [0.2, 1, 40, 80]).id, "industrial");
});

test("TEST-UNC-001 uncertainty and sensitivity", () => {
  const f = ({ m, L }) => m * 9.80665 * (0.5 * L);
  const u = propagateUncertainty(f, [
    { name: "m", value: 50, sigma: 0.5 },
    { name: "L", value: 1, sigma: 0.01 },
  ]);
  assert.ok(Math.abs(u.y - 245.16625) < 1e-9);
  assert.ok(u.sigma > 0);
  const s = normalizedSensitivity(f, { m: 50, L: 1 });
  assert.ok(Math.abs(s.normalized.m - 1) < 1e-6);
  assert.ok(Math.abs(s.normalized.L - 1) < 1e-6);
});

test("kinematics timestep and rk4", () => {
  const fine = differentiateAngle([0, 0.01, 0.04, 0.09], 0.1);
  const coarse = differentiateAngle([0, 0.04, 0.16], 0.2);
  assert.ok(fine.alpha.length >= 1);
  assert.ok(coarse.alpha.length >= 1);
  const sol = integrate(1, 0, 1, 0.01, (_t, y) => y, "rk4");
  assert.ok(Math.abs(sol.y - Math.E) / Math.E < 1e-4);
});

test("TEST-GEO-001 closure converges and mass increases section", () => {
  const closed = closeRectangularLink({
    length: 1,
    density: 7850,
    youngs: 200e9,
    allowable: 250e6,
    g: 9.80665,
    targetSF: 2,
  });
  assert.equal(closed.converged, true);
  assert.ok(closed.sf > 1.9 && closed.sf < 2.1);
  assert.ok(closed.mass > 0);
});

test("TEST-MFG-001 feasibility fails closed", () => {
  const ok = partFeasibility({ name: "link", materialId: "mild_steel", processId: "weld", toleranceM: 3e-3, massKg: 10, lengthM: 1 });
  assert.equal(ok.feasible, true);
  const bad = partFeasibility({ name: "link", materialId: "pla", processId: "weld", toleranceM: 1e-3, massKg: 1, lengthM: 0.2 });
  assert.equal(bad.feasible, false);
  assert.throws(() => partFeasibility({ name: "x", materialId: "mild_steel", processId: "teleport", toleranceM: 1, massKg: 1, lengthM: 1 }));
});

test("TEST-PANINI-001 physical IR", () => {
  const ir = toPhysicalIR({ L: 1, m: 50, tau: 272, P: 0.001, V: 12, E: { eta: 0.7 } });
  assert.equal(ir.version, "1.0");
  assert.ok(ir.digest);
  const check = verificationChecklist(ir);
  assert.ok(check.checks.every((c) => c.pass));
  assert.ok(ir.unresolved.length > 0);
});

test("TEST-PANINI-002 command boundary", () => {
  const hot = eventToDecision({ type: "commit", temperatureC: 90, limitC: 80, voltage: 12 });
  assert.equal(hot.command, "IDLE");
  const plan = eventToDecision({ type: "track", error: 0.2, voltage: 12 });
  assert.equal(plan.command, "PLAN");
  assert.equal(plan.physicalValidation, "S0");
});

test("TEST-CAL-001 experiment and calibration", () => {
  const doc = validateExperiment({
    id: "exp-1",
    quantity: "torque",
    unit: "N*m",
    evidence: "C6",
    samples: [{ t: 0, value: 1 }, { t: 1, value: 2 }],
  });
  assert.equal(doc.ok, true);
  const fit = calibrateAffine([{ x: 0, y: 1 }, { x: 1, y: 3 }, { x: 2, y: 5 }]);
  assert.ok(Math.abs(fit.a - 1) < 1e-9);
  assert.ok(Math.abs(fit.b - 2) < 1e-9);
  assert.equal(fit.physicalValidation, "S0");
});

test("invalid inputs fail explicitly", () => {
  assert.throws(() => gravityTorque({ mass: -1, length: 1 }), EngineeringError);
  assert.throws(() => gravityTorque({ mass: 1, length: 0 }), EngineeringError);
  assert.throws(() => electricalPower(1, 0), EngineeringError);
  assert.throws(() => electricalPower(1, 1.2), EngineeringError);
  assert.throws(() => motorCurrent({ tau: 1, omega: 1, eta: 0.5, voltage: 0 }), EngineeringError);
  assert.throws(() => safetyFactor(10, -1), EngineeringError);
  assert.equal(fatigueInterface().solver, false);
  assert.throws(() => fatigueInterface().evaluate(), EngineeringError);
  assert.throws(() => rigidBodyInterface().evaluateMultiBody(), EngineeringError);
});

test("consistency monotonicity", () => {
  const a = peakTorqueUniformRod({ mass: 10, length: 1, alpha: 1, frictionModel: "none" });
  const b = peakTorqueUniformRod({ mass: 12, length: 1, alpha: 1, frictionModel: "none" });
  assert.ok(b.tauG > a.tauG);
  const motor = requiredMotorTorque(10, 4, 0.8);
  assert.ok(motor < 10);
  assert.ok(electricalPower(10, 0.5) > electricalPower(10, 0.8));
});

test("reference cases and poster audit", () => {
  const c = evaluateCase({ id: "C", m: 50, L: 1, alpha: 1, omega: 1, eta: 0.7, V: 12 }, "none");
  assert.ok(c.pMech > 0);
  assert.equal(c.regime, "swaraj");
  assert.equal(c.physicalValidation, "S0");
  const audit = auditPosterTorque(612);
  assert.equal(audit.reproduced, false);
});

test("sovereignty and genesis limits", () => {
  const rep = reproductionAssessment();
  assert.equal(rep.criterionEvidence, "C5");
  assert.equal(rep.physicalValidation, "S0");
  const g = genesisAssessment(["has_cnc"]);
  assert.equal(g.closed, false);
  assert.equal(g.hasCncIsGenesis, false);
});

test("units do not mix silently", () => {
  const a = quantity(1, "m");
  const b = quantity(2, "mm");
  assert.throws(() => addQ(a, b));
  assert.ok(Math.abs(rpmToRadS(60) - 2 * Math.PI) < 1e-12);
});

test("equation registry is populated", () => {
  const ids = listEquations().map((e) => e.id);
  for (const id of ["M_GRAVITY_001", "M_DYN_002", "M_THERM_002", "M_COST_001", "M_UNCERTAINTY_001"]) {
    assert.ok(ids.includes(id), id);
  }
});

test("electrical battery remains approximate", () => {
  const e = batteryEnergy({ voltage: 12, ampereHours: 10, eta: 0.9 });
  assert.equal(e.E_Wh, 120);
  assert.equal(e.E_useful_Wh, 108);
  assert.equal(runtimeHours(108, 12).hours, 9);
  assert.ok(Math.abs(conductorResistance(1.68e-8, 2, 1e-6) - (1.68e-8 * 2) / 1e-6) < 1e-12);
});
