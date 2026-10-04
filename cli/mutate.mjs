/**
 * Source-mutation gate for governing equations.
 * A mutant is killed when the independent oracle no longer matches.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const mutations = [
  {
    id: "inertia-factor",
    file: "src/physics/mechanics.js",
    from: "ROD_INERTIA_FACTOR * mass * length * length",
    to: "(1 / 2) * mass * length * length",
    check: (mod) => mod.momentOfInertiaRod(3, 2) !== (1 / 3) * 3 * 4,
  },
  {
    id: "gravity-product",
    file: "src/physics/mechanics.js",
    from: "mass * g * arm",
    to: "mass + g * arm",
    check: (mod) => mod.gravityTorque({ mass: 2, g: 3, Lcg: 4 }) !== 24,
  },
  {
    id: "friction-sign",
    file: "src/physics/mechanics.js",
    from: "return kF * (tauG + tauI);",
    to: "return kF * (tauG - tauI);",
    check: (mod) => mod.proportionalFriction(0.5, 10, 4) !== 7,
  },
  {
    id: "counterbalance-sign",
    file: "src/physics/mechanics.js",
    from: "return requiredTorque(parts) - tauCb;",
    to: "return requiredTorque(parts) + tauCb;",
    check: (mod) => mod.motorTorqueWithCounterbalance({ tauG: 5, tauI: 1, tauF: 0, tauExt: 0, tauCb: 2 }) !== 4,
  },
  {
    id: "scale-exponent",
    file: "src/physics/mechanics.js",
    from: "tauG: tauGRef * r ** 4",
    to: "tauG: tauGRef * r ** 3",
    check: (mod) => mod.scaleFromReference({ L: 2, Lref: 1, mRef: 1, tauGRef: 1, tauIRef: 1 }).tauG !== 16,
  },
  {
    id: "ratio-inverted",
    file: "src/transmission/transmission.js",
    from: "const R = teethOut / teethIn;",
    to: "const R = teethIn / teethOut;",
    check: (mod) => mod.stageReduction({ teethIn: 10, teethOut: 20, eta: 1 }).R !== 2,
  },
  {
    id: "efficiency-inverted",
    file: "src/actuators/actuator.js",
    from: "return pMech / eta;",
    to: "return pMech * eta;",
    check: (mod) => mod.electricalPower(10, 0.5) !== 20,
  },
  {
    id: "safety-inverted",
    file: "src/structures/structures.js",
    from: "return allowable / applied;",
    to: "return applied / allowable;",
    check: (mod) => mod.safetyFactor(200, 100) !== 2,
  },
  {
    id: "deflection-coefficient",
    file: "src/structures/structures.js",
    from: "return (force * length ** 3) / (3 * youngs * I);",
    to: "return (force * length ** 3) / (8 * youngs * I);",
    check: (mod) => mod.cantileverPointDeflection(3, 1, 1, 1) !== 1,
  },
  {
    id: "thermal-sign",
    file: "src/thermal/lumped.js",
    from: "const T = ambient + powerLoss * Rth;",
    to: "const T = ambient - powerLoss * Rth;",
    check: (mod) => mod.thermalSteady({ ambient: 300, powerLoss: 10, Rth: 2 }) !== 320,
  },
];

const results = [];
for (const mutation of mutations) {
  const target = path.join(root, mutation.file);
  const original = fs.readFileSync(target, "utf8");
  if (!original.includes(mutation.from)) {
    results.push({ id: mutation.id, killed: false, reason: "pattern-missing" });
    continue;
  }
  const mutant = path.join(path.dirname(target), `.mutant-${mutation.id}.mjs`);
  fs.writeFileSync(mutant, original.replace(mutation.from, mutation.to));
  try {
    const mod = await import(pathToFileURL(mutant).href);
    const killed = mutation.check(mod);
    results.push({ id: mutation.id, killed });
  } catch (error) {
    results.push({ id: mutation.id, killed: true, reason: error.code || error.name });
  } finally {
    fs.rmSync(mutant, { force: true });
  }
}

const killed = results.filter((row) => row.killed).length;
const score = killed / results.length;
const report = { score, killed, total: results.length, results, threshold: 1 };
const outDir = path.join(root, "docs/generated");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "mutation-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (score < 1) process.exit(1);
