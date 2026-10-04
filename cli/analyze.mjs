import { referenceCorpus, auditPosterTorque, normalizedSensitivity, peakTorqueUniformRod } from "../src/index.js";

const corpus = referenceCorpus();
const poster = auditPosterTorque(612);
const sens = normalizedSensitivity(
  ({ m, L, alpha }) => peakTorqueUniformRod({ mass: m, length: L, alpha, frictionModel: "none" }).tauPeak,
  { m: 50, L: 1, alpha: 1 }
);
console.log(JSON.stringify({
  analytical: corpus.analytical,
  cases: corpus.cases.map((c) => ({
    id: c.none.id,
    tau: c.none.tauPeak,
    tauFriction: c.proportional.tauPeak,
    regime: c.none.regime,
    pElec: c.none.pElec,
  })),
  posterReproduced: poster.reproduced,
  sensitivity: sens.normalized,
  physicalValidation: "S0",
}, null, 2));
