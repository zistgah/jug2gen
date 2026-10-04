/**
 * Material registry.
 * Properties are handbook-typical values for computation, not certified lot data.
 * Missing fatigue curves are not invented.
 */

import { EngineeringError } from "../core/errors.js";

export const MATERIALS = {
  mild_steel: {
    id: "mild_steel",
    name: "Mild steel (typical structural)",
    rho: 7850,
    E: 200e9,
    nu: 0.29,
    sigmaY: 250e6,
    sigmaU: 400e6,
    k: 50,
    cp: 486,
    thermalLimitC: 400,
    processes: ["saw", "weld", "machine", "drill"],
    fatigue: null,
    evidence: "C3",
    provenance: "Order-of-magnitude handbook values for low-carbon steel. Not a specific grade certificate.",
    physicalValidation: "S0",
  },
  al_6061: {
    id: "al_6061",
    name: "Aluminium 6061-T6 typical",
    rho: 2700,
    E: 68.9e9,
    nu: 0.33,
    sigmaY: 276e6,
    sigmaU: 310e6,
    k: 167,
    cp: 896,
    thermalLimitC: 150,
    processes: ["saw", "machine", "drill"],
    fatigue: null,
    evidence: "C3",
    provenance: "Typical published 6061-T6 room-temperature values. Not a mill certificate.",
    physicalValidation: "S0",
  },
  copper: {
    id: "copper",
    name: "Copper conductor typical",
    rho: 8960,
    E: 110e9,
    nu: 0.34,
    sigmaY: 70e6,
    sigmaU: 220e6,
    k: 401,
    cp: 385,
    electricalResistivity: 1.68e-8,
    thermalLimitC: 150,
    processes: ["draw", "wind", "solder"],
    fatigue: null,
    evidence: "C3",
    provenance: "Typical annealed-copper electrical and thermal values. Yield varies strongly with temper.",
    physicalValidation: "S0",
  },
  pla: {
    id: "pla",
    name: "PLA printed typical",
    rho: 1240,
    E: 3.5e9,
    nu: 0.36,
    sigmaY: 50e6,
    sigmaU: 55e6,
    k: 0.13,
    cp: 1800,
    thermalLimitC: 55,
    processes: ["print"],
    fatigue: null,
    evidence: "C6",
    provenance: "Illustrative printed-PLA values. Anisotropic; not a design allowable.",
    physicalValidation: "S0",
  },
};

export function material(id) {
  const m = MATERIALS[id];
  if (!m) throw new EngineeringError("MATERIAL", `invalid material ${id}`);
  return m;
}

export function fatigueInterface() {
  return {
    id: "M_FATIGUE_001",
    form: "S-N: sigma_a versus N_f, optional mean-stress correction",
    implementation: "S2",
    physicalValidation: "S0",
    solver: false,
    note: "Interface only. No S-N data are invented. A future solver may accept a supplied curve.",
    evaluate() {
      throw new EngineeringError("FATIGUE_UNSUPPORTED", "V1.0 defines the fatigue interface and does not implement a fatigue solver.");
    },
  };
}
