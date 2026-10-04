import { closeFromMaterial, fabricationRepresentation } from "../src/index.js";

const closed = closeFromMaterial("mild_steel", { length: 1, g: 9.80665, targetSF: 2, payloadMass: 20, h0: 0.04 });
const fab = fabricationRepresentation(closed);
console.log(JSON.stringify({
  converged: closed.converged,
  iterations: closed.iterations,
  massKg: closed.mass,
  heightM: closed.h,
  safetyFactor: closed.sf,
  fabrication: fab,
  physicalValidation: "S0",
}, null, 2));
