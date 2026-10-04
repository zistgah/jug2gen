import test from "node:test";
import assert from "node:assert/strict";
import {
  peakTorqueUniformRod,
  mechanicalPower,
  electricalPower,
  thermalSteady,
  copperLoss,
  motorCurrent,
  closeRectangularLink,
} from "../src/index.js";

test("upstream mass change propagates and restores", () => {
  const base = { length: 1, alpha: 1, g: 9.81, frictionModel: "none", omega: 1, eta: 0.7, voltage: 12, R: 0.2 };
  const a = peakTorqueUniformRod({ ...base, mass: 10 });
  const b = peakTorqueUniformRod({ ...base, mass: 12 });
  assert.ok(b.I > a.I);
  assert.ok(b.tauG > a.tauG);
  assert.ok(b.tauI > a.tauI);
  assert.ok(b.tauPeak > a.tauPeak);
  const pa = mechanicalPower(a.tauPeak, base.omega);
  const pb = mechanicalPower(b.tauPeak, base.omega);
  assert.ok(pb > pa);
  const ea = electricalPower(pa, base.eta);
  const eb = electricalPower(pb, base.eta);
  assert.ok(eb > ea);
  const ia = motorCurrent({ tau: a.tauPeak, omega: base.omega, eta: base.eta, voltage: base.voltage });
  const ib = motorCurrent({ tau: b.tauPeak, omega: base.omega, eta: base.eta, voltage: base.voltage });
  assert.ok(ib > ia);
  assert.ok(copperLoss(ib, base.R) > copperLoss(ia, base.R));
  assert.ok(thermalSteady({ ambient: 300, powerLoss: copperLoss(ib, base.R), Rth: 1 }) >
    thermalSteady({ ambient: 300, powerLoss: copperLoss(ia, base.R), Rth: 1 }));
  const restored = peakTorqueUniformRod({ ...base, mass: 10 });
  assert.equal(restored.tauPeak, a.tauPeak);
});

test("geometry closure exposes residual and does not claim convergence at the iteration cap", () => {
  const closed = closeRectangularLink({
    length: 0.4,
    density: 7850,
    youngs: 200e9,
    allowable: 250e6,
    g: 9.81,
    targetSF: 2,
    maxIter: 2,
    tol: 1e-12,
  });
  assert.equal(closed.converged, false);
  assert.equal(closed.reason, "max-iterations");
  assert.ok(Number.isFinite(closed.residual));
});

test("actuator equality is mathematical feasibility, margin is acceptance", () => {
  const required = 100;
  const available = 100;
  const margin = 1.2;
  assert.equal(available >= required, true);
  assert.equal(available >= margin * required, false);
  assert.equal(120 >= margin * required, true);
});
