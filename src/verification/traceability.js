/**
 * Requirement → equation → module → test traceability.
 * No important requirement is left as orphaned prose.
 */

export const TRACEABILITY = [
  ["REQ-DYN-001", "Gravity torque", "M_GRAVITY_001", "physics/mechanics.js", "TEST-GRAVITY-001"],
  ["REQ-DYN-002", "Rod inertia", "M_INERTIA_001", "physics/mechanics.js", "TEST-INERTIA-001"],
  ["REQ-DYN-003", "Inertial torque", "M_INERTIAL_001", "physics/mechanics.js", "TEST-INERTIA-002"],
  ["REQ-DYN-004", "Friction models", "M_FRICTION_001", "physics/mechanics.js", "TEST-FRICTION-001"],
  ["REQ-DYN-005", "Peak torque reference", "M_DYN_002", "physics/mechanics.js", "TEST-ANALYTICAL-001"],
  ["REQ-DYN-006", "Counterbalance", "M_CB_001", "physics/mechanics.js", "TEST-CB-001"],
  ["REQ-ENE-001", "Work and energy reduction", "M_ENERGY_001", "physics/mechanics.js", "TEST-ENERGY-001"],
  ["REQ-SCALE-001", "Similarity scaling", "M_SCALE_001", "physics/mechanics.js", "TEST-SCALE-001"],
  ["REQ-PWR-001", "Mechanical and electrical power", "M_POWER_001", "actuators/actuator.js", "TEST-POWER-001"],
  ["REQ-TRN-001", "Transmission ratio", "M_TRANS_001", "transmission/transmission.js", "TEST-TRANS-001"],
  ["REQ-TRN-002", "Chain tension", "M_CHAIN_001", "transmission/transmission.js", "TEST-CHAIN-001"],
  ["REQ-STR-001", "Bending stress", "M_BEND_001", "structures/structures.js", "TEST-BEND-001"],
  ["REQ-STR-002", "Deflection", "M_DEFL_001", "structures/structures.js", "TEST-DEFL-001"],
  ["REQ-STR-003", "Torsion and von Mises", "M_VM_001", "structures/structures.js", "TEST-VM-001"],
  ["REQ-THM-001", "Thermal steady and transient", "M_THERM_002", "thermal/lumped.js", "TEST-THERM-001"],
  ["REQ-CST-001", "Additive and parametric cost", "M_COST_001", "economics/cost.js", "TEST-COST-001"],
  ["REQ-UNC-001", "Uncertainty and sensitivity", "M_UNCERTAINTY_001", "math/numerics.js", "TEST-UNC-001"],
  ["REQ-REG-001", "Regime classification", "M_PARITY_001", "economics/cost.js", "TEST-REGIME-001"],
  ["REQ-GEO-001", "Geometry closure", "M_MASS_002", "geometry/closure.js", "TEST-GEO-001"],
  ["REQ-MFG-001", "Manufacturing feasibility", "M_MASS_002", "manufacturing/manufacturing.js", "TEST-MFG-001"],
  ["REQ-PHY-001", "PANINIphy adapter", ", ", "panini/adapter.js", "TEST-PANINI-001"],
  ["REQ-Q-001", "PANINIq control boundary", ", ", "panini/adapter.js", "TEST-PANINI-002"],
  ["REQ-EXP-001", "Experiment schema and calibration", ", ", "experiments/experiments.js", "TEST-CAL-001"],
];

export const CLAIMS = [
  { id: "TORQUE.GRAVITY", evidence: "C3", implementation: "S5", physicalValidation: "S0", text: "τ_g = m g L_cg for the canonical node." },
  { id: "TORQUE.PEAK", evidence: "C3", implementation: "S5", physicalValidation: "S0", text: "Uniform-rod peak torque is an analytical model result, not a measurement." },
  { id: "ENERGY.REDUCTION.70", evidence: "C5", implementation: "S1", physicalValidation: "S0", text: "70% energy reduction is a project target, not a fact." },
  { id: "REGIME.BOUNDARIES", evidence: "C6", implementation: "S4", physicalValidation: "S0", text: "1.2/10/150/500 kg boundaries are configurable hypotheses." },
  { id: "FRICTION.004", evidence: "C6", implementation: "S4", physicalValidation: "S0", text: "k_f = 0.04 is an illustrative selectable assumption." },
  { id: "POSTER.612", evidence: "C6", implementation: "S0", physicalValidation: "S0", text: "612 N·m is not reproduced by the canonical equation and is not an engineering result." },
  { id: "PARITY.LIMIT", evidence: "C5", implementation: "S3", physicalValidation: "S0", text: "Material parity is a limiting model, not present machine cost." },
  { id: "SOVEREIGNTY.72H", evidence: "C5", implementation: "S3", physicalValidation: "S0", text: "72 h reproduction is a strategic criterion, not a law." },
  { id: "GENESIS.CNC", evidence: "C3", implementation: "S3", physicalValidation: "S0", text: "Having a CNC is not Genesis." },
  { id: "PANINI.REALIZATION", evidence: "C4", implementation: "S3", physicalValidation: "S0", text: "PANINIphy IR and PANINIq tokens are adapter boundaries, not physical realization." },
];

export const ASSUMPTIONS = [
  { id: "A-G", text: "g defaults to 9.80665 m/s² and is configurable.", evidence: "C3" },
  { id: "A-LAMBDA", text: "Uniform rod uses λ = 1/2.", evidence: "C3" },
  { id: "A-SIM", text: "L³/L⁴/L⁵ scaling applies only under geometric similarity.", evidence: "C3" },
  { id: "A-KF", text: "Proportional friction is opt-in.", evidence: "C6" },
  { id: "A-CB", text: "Counterbalance torque reduction is not automatically energy reduction.", evidence: "C3" },
  { id: "A-BATT", text: "Battery energy E = V Q is not a cell model.", evidence: "C3" },
  { id: "A-FATIGUE", text: "No fatigue curve is invented.", evidence: "C3" },
  { id: "A-MB", text: "Multi-body dynamics is an interface, not a solver.", evidence: "C3" },
  { id: "A-REGIME", text: "Regime walls are shop hypotheses, not physics discontinuities.", evidence: "C6" },
];

export function dependencyGraph() {
  return {
    nodes: [
      "requirements", "parameters", "geometry", "mass", "inertia", "loads", "torque",
      "actuator", "transmission", "structure", "electrical", "thermal", "material",
      "manufacturing", "cost", "verification", "fabrication", "measurement", "calibration", "reproduction",
    ],
    edges: [
      ["requirements", "parameters"],
      ["parameters", "geometry"],
      ["geometry", "mass"],
      ["mass", "inertia"],
      ["mass", "loads"],
      ["inertia", "torque"],
      ["loads", "torque"],
      ["torque", "actuator"],
      ["actuator", "transmission"],
      ["torque", "structure"],
      ["structure", "geometry"],
      ["actuator", "electrical"],
      ["electrical", "thermal"],
      ["material", "manufacturing"],
      ["geometry", "manufacturing"],
      ["manufacturing", "cost"],
      ["torque", "verification"],
      ["geometry", "fabrication"],
      ["fabrication", "measurement"],
      ["measurement", "calibration"],
      ["calibration", "reproduction"],
    ],
  };
}
