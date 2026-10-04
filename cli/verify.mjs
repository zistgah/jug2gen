import { peakTorqueUniformRod, ANALYTICAL_REFERENCE, listEquations } from "../src/index.js";
import { torqueModel } from "../js/model.js";

const ref = peakTorqueUniformRod({
  mass: 50,
  length: 1,
  alpha: 1,
  frictionModel: "proportional",
  frictionRatio: 0.04,
});
const err = Math.abs(ref.tauPeak - ANALYTICAL_REFERENCE.tauPeak);
if (err > 1e-9) {
  console.error("analytical mismatch", ref.tauPeak, ANALYTICAL_REFERENCE.tauPeak);
  process.exit(1);
}
const ui = torqueModel({ m: 50, L: 1, alpha: 1.2 });
if (Math.abs(ui.tauPeak - 275.7729) > 0.01) {
  console.error("UI path drifted", ui.tauPeak);
  process.exit(1);
}
console.log(JSON.stringify({
  ok: true,
  equations: listEquations().length,
  analyticalTauPeak: ref.tauPeak,
  uiPresetTauPeak: ui.tauPeak,
  physicalValidation: "S0",
}, null, 2));
