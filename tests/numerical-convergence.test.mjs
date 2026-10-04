import test from "node:test";
import assert from "node:assert/strict";
import { integrate, eulerStep, rk4Step } from "../src/math/numerics.js";
import { thermalTransient, thermalAnalytical, differentiateAngle } from "../src/index.js";
import { oracles } from "../src/verification/oracles.js";
import { assertClose } from "../src/verification/tolerance.js";

function order(errors) {
  return Math.log(errors[0] / errors[1]) / Math.log(2);
}

test("M_INTEGRATION_002::NUMERICAL RK4 converges near fourth order", () => {
  const errors = [];
  for (const dt of [0.05, 0.025]) {
    const sol = integrate(1, 0, 1, dt, (_t, y) => y, "rk4");
    errors.push(Math.abs(sol.y - oracles.expGrowth(1)));
  }
  const observed = order(errors);
  assert.ok(observed > 3.5, `observed order ${observed}`);
  assertClose(integrate(1, 0, 1, 0.01, (_t, y) => y, "rk4").y, Math.E, { absolute: 1e-8, relative: 1e-8 });
});

test("M_INTEGRATION_001::NUMERICAL Euler converges near first order", () => {
  const errors = [];
  for (const dt of [0.01, 0.005]) {
    const sol = integrate(1, 0, 1, dt, (_t, y) => y, "euler");
    errors.push(Math.abs(sol.y - oracles.expGrowth(1)));
  }
  const observed = order(errors);
  assert.ok(observed > 0.8 && observed < 1.3, `observed order ${observed}`);
  assert.equal(eulerStep(1, 2, 0.5), 2);
  assert.throws(() => rk4Step(1, 0, 0, () => 1));
});

test("M_THERM_001::NUMERICAL transient matches analytical solution", () => {
  const spec = { ambient: 300, powerLoss: 20, Rth: 0.5, Cth: 40, T0: 290 };
  const dt = 0.05;
  const steps = 200;
  const numerical = thermalTransient({ ...spec, dt, steps });
  const analytical = thermalAnalytical({ ...spec, t: dt * steps });
  assertClose(numerical.T, analytical, { absolute: 0.05, relative: 1e-3 });
  assertClose(numerical.Tss, oracles.thermalSteady(spec.ambient, spec.powerLoss, spec.Rth));
  const coarse = thermalTransient({ ...spec, dt: 0.2, steps: 50 });
  const fine = thermalTransient({ ...spec, dt: 0.05, steps: 200 });
  const exact = thermalAnalytical({ ...spec, t: 10 });
  assert.ok(Math.abs(fine.T - exact) < Math.abs(coarse.T - exact));
});

test("differentiation converges on a polynomial trajectory", () => {
  function sample(dt) {
    const theta = [];
    for (let i = 0; i < 8; i++) theta.push(0.5 * (i * dt) ** 2);
    return differentiateAngle(theta, dt);
  }
  const fine = sample(0.01);
  const coarse = sample(0.02);
  const fineErr = Math.abs(fine.alpha[fine.alpha.length - 1] - 1);
  const coarseErr = Math.abs(coarse.alpha[coarse.alpha.length - 1] - 1);
  assert.ok(fineErr <= coarseErr + 1e-12);
});

test("constant derivative Euler matches the analytical line", () => {
  const sol = integrate(0, 0, 2, 0.1, () => 3, "euler");
  assertClose(sol.y, 6, { absolute: 1e-12, relative: 0 });
});
