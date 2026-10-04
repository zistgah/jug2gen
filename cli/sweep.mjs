import { classifyRegime, parametricCost } from "../src/index.js";

const boundaries = [1.2, 10, 150, 500];
const rows = [];
for (let i = 0; i < 40; i++) {
  const m = Math.exp(Math.log(0.25) + (i / 39) * (Math.log(600) - Math.log(0.25)));
  const cost = parametricCost({
    mass: m,
    pricePerKg: 80,
    infrastructure: m < 150 ? 200 : 200 + 40 * (m - 150),
    actuation: 50 + 2 * m,
    precision: 5000 * Math.exp(-m / 2),
  });
  rows.push({ m, specific: cost.specific, regime: classifyRegime(m, boundaries).id });
}
console.log(JSON.stringify({
  note: "Parametric sweep. Boundaries are C6 hypotheses. Not a market quote.",
  evidence: "C6",
  physicalValidation: "S0",
  rows,
}, null, 2));
