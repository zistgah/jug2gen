/**
 * Canonical single-link mechanics.
 * M1–M14. The single-link analytical solution is the validated reference.
 * A multi-body interface is defined; a complete multi-body solver is not claimed.
 */

import {
  assertFinite,
  assertLength,
  assertMass,
  assertNonNegativeLength,
  EngineeringError,
  guardFinite,
} from "../core/errors.js";
import { STANDARD_GRAVITY } from "../core/provenance.js";
import { ROD_INERTIA_FACTOR } from "../core/constants.js";
import { registerEquation } from "../core/registry.js";
import { eulerStep } from "../math/numerics.js";

registerEquation({
  id: "M_GEOMETRY_001",
  name: "Centre-of-mass fraction",
  latex: "L_{cg} = \\lambda L",
  variables: { lambda: "1", L: "m" },
  output: "m",
  implementation: "centreOfMass",
  module: "physics/mechanics.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["0 < λ ≤ 1", "λ = 1/2 for a uniform rod"],
  validity: "L > 0",
});

registerEquation({
  id: "M_MASS_001",
  name: "Mass from geometric similarity",
  latex: "m = \\rho k_v L^3",
  variables: { rho: "kg/m^3", k_v: "1", L: "m" },
  output: "kg",
  implementation: "massFromSimilarity",
  module: "physics/mechanics.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["geometric similarity", "approximately constant density"],
  validity: "not a universal engineering law",
});

registerEquation({
  id: "M_MASS_002",
  name: "Mass from explicit geometry",
  latex: "m = \\rho V = \\rho A L",
  variables: { rho: "kg/m^3", area: "m^2", L: "m" },
  output: "kg",
  implementation: "massFromGeometry",
  module: "physics/mechanics.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["constant density", "prismatic member"],
  validity: "A > 0, L > 0",
});

registerEquation({
  id: "M_INERTIA_001",
  name: "Uniform rod inertia about one end",
  latex: "I = \\frac{1}{3} m L^2",
  variables: { m: "kg", L: "m" },
  output: "kg*m^2",
  implementation: "momentOfInertiaRod",
  module: "physics/mechanics.js",
  evidence: "C3",
  status: "S5",
  assumptions: ["uniform slender rod", "axis perpendicular to rod through one end"],
  validity: "m >= 0, L > 0",
});

registerEquation({
  id: "M_GRAVITY_001",
  name: "Gravity torque",
  latex: "\\tau_g = m g L_{cg}",
  variables: { m: "kg", g: "m/s^2", L_cg: "m" },
  output: "N*m",
  implementation: "gravityTorque",
  module: "physics/mechanics.js",
  evidence: "C3",
  status: "S5",
  assumptions: ["uniform gravitational field", "moment arm L_cg"],
  validity: "m >= 0, L > 0",
});

registerEquation({
  id: "M_INERTIAL_001",
  name: "Inertial torque",
  latex: "\\tau_I = I \\alpha",
  variables: { I: "kg*m^2", alpha: "rad/s^2" },
  output: "N*m",
  implementation: "inertialTorque",
  module: "physics/mechanics.js",
  evidence: "C3",
  status: "S5",
  assumptions: ["planar rotation", "radian dimensionless"],
  validity: "I >= 0",
});

registerEquation({
  id: "M_FRICTION_001",
  name: "Viscous plus Coulomb friction",
  latex: "\\tau_f = b\\omega + \\tau_C\\,\\mathrm{sign}(\\omega)",
  variables: { b: "N*m*s/rad", omega: "rad/s", tauC: "N*m" },
  output: "N*m",
  implementation: "frictionTorque",
  module: "physics/mechanics.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["selected friction model is explicit"],
  validity: "b >= 0, tauC >= 0",
});

registerEquation({
  id: "M_FRICTION_002",
  name: "Proportional friction model",
  latex: "\\tau_f = k_f(\\tau_g + \\tau_I)",
  variables: { k_f: "1" },
  output: "N*m",
  implementation: "proportionalFriction",
  module: "physics/mechanics.js",
  evidence: "C6",
  status: "S4",
  assumptions: ["k_f is an assumption, not a universal constant", "illustrative default 0.04"],
  validity: "only when this model is selected",
});

registerEquation({
  id: "M_DYN_001",
  name: "Single-link required torque",
  latex: "\\tau = \\tau_g + \\tau_I + \\tau_f + \\tau_{ext}",
  output: "N*m",
  implementation: "requiredTorque",
  module: "physics/mechanics.js",
  evidence: "C3",
  status: "S5",
  assumptions: ["simple additive single-link model"],
  validity: "single revolute joint",
});

registerEquation({
  id: "M_DYN_002",
  name: "Canonical peak torque with optional proportional friction",
  latex: "\\tau_{peak} = (1+k_f)\\left[mgL/2 + (1/3)m L^2 \\alpha\\right]",
  output: "N*m",
  implementation: "peakTorqueUniformRod",
  module: "physics/mechanics.js",
  evidence: "C3",
  status: "S5",
  assumptions: ["uniform rod", "λ = 1/2", "proportional friction only if selected"],
  validity: "reference analytical model",
});

registerEquation({
  id: "M_CB_001",
  name: "Counterbalanced motor torque",
  latex: "\\tau_{motor} = \\tau_g + \\tau_I + \\tau_f - \\tau_{cb} + \\tau_{ext}",
  output: "N*m",
  implementation: "motorTorqueWithCounterbalance",
  module: "physics/mechanics.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["counterbalance reduces actuator torque, not necessarily energy one-for-one"],
  validity: "single joint",
});

registerEquation({
  id: "M_ENERGY_001",
  name: "Numerical mechanical work",
  latex: "W \\approx \\sum \\tau_i \\Delta\\theta_i",
  output: "J",
  implementation: "workFromTorque",
  module: "physics/mechanics.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["piecewise constant torque on each step"],
  validity: "θ in radians",
});

registerEquation({
  id: "M_SCALE_001",
  name: "Geometric similarity scaling",
  latex: "m \\propto L^3,\\ \\tau_g \\propto L^4,\\ \\tau_I \\propto L^5",
  output: "mixed",
  implementation: "scaleFromReference",
  module: "physics/mechanics.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["geometric similarity", "constant density", "comparable angular acceleration for τ_I"],
  validity: "not valid for machines that break similarity",
});

registerEquation({
  id: "M_KIN_001",
  name: "Discrete angular kinematics",
  latex: "\\omega_i \\approx (\\theta_i-\\theta_{i-1})/\\Delta t,\\ \\alpha_i \\approx (\\omega_i-\\omega_{i-1})/\\Delta t",
  output: "rad/s, rad/s^2",
  implementation: "differentiateAngle",
  module: "physics/mechanics.js",
  evidence: "C3",
  status: "S4",
  assumptions: ["uniform timestep", "backward difference"],
  validity: "dt > 0",
});

export function centreOfMass(length, cgFraction = 0.5) {
  assertLength(length);
  assertFinite("cgFraction", cgFraction);
  if (!(cgFraction > 0) || cgFraction > 1) {
    throw new EngineeringError("CG_FRACTION", "λ must satisfy 0 < λ ≤ 1", { cgFraction });
  }
  return cgFraction * length;
}

export function massFromSimilarity({ density, volumeCoefficient, length }) {
  assertFinite("density", density);
  assertFinite("volumeCoefficient", volumeCoefficient);
  assertLength(length);
  if (density < 0 || volumeCoefficient < 0) {
    throw new EngineeringError("DENSITY", "density and k_v must be >= 0");
  }
  return density * volumeCoefficient * length ** 3;
}

export function massFromGeometry({ density, area, length, volume = null }) {
  assertFinite("density", density);
  if (density < 0) throw new EngineeringError("DENSITY", "density must be >= 0");
  if (volume !== null) {
    assertFinite("volume", volume);
    if (volume < 0) throw new EngineeringError("GEOMETRY", "volume must be >= 0");
    return density * volume;
  }
  assertFinite("area", area);
  assertLength(length);
  if (area < 0) throw new EngineeringError("GEOMETRY", "area must be >= 0");
  return density * area * length;
}

export function momentOfInertiaRod(mass, length) {
  assertMass(mass);
  assertLength(length);
  return guardFinite("inertia", ROD_INERTIA_FACTOR * mass * length * length, { mass, length });
}

export function gravityTorque({ mass, length, cgFraction = 0.5, g = STANDARD_GRAVITY.value, Lcg = null }) {
  assertMass(mass);
  assertFinite("g", g);
  if (g < 0) throw new EngineeringError("GRAVITY", "g must be >= 0", { g });
  const arm = Lcg === null ? centreOfMass(length, cgFraction) : assertNonNegativeLength(Lcg, "Lcg");
  return guardFinite("tauG", mass * g * arm, { mass, g, arm });
}

export function inertialTorque(inertia, alpha) {
  assertFinite("inertia", inertia);
  assertFinite("alpha", alpha);
  if (inertia < 0) throw new EngineeringError("INERTIA", "I must be >= 0");
  return guardFinite("tauI", inertia * alpha, { inertia, alpha });
}

export function sign(omega) {
  if (omega > 0) return 1;
  if (omega < 0) return -1;
  return 0;
}

export function frictionTorque({ model = "viscous", b = 0, omega = 0, coulomb = 0, kF = 0, tauG = 0, tauI = 0 }) {
  assertFinite("b", b);
  assertFinite("omega", omega);
  assertFinite("coulomb", coulomb);
  if (b < 0 || coulomb < 0) throw new EngineeringError("FRICTION", "b and τ_C must be >= 0");
  if (model === "none") return 0;
  if (model === "viscous") return b * omega;
  if (model === "coulomb") return coulomb * sign(omega);
  if (model === "combined") return b * omega + coulomb * sign(omega);
  if (model === "proportional") {
    assertFinite("kF", kF);
    if (kF < 0) throw new EngineeringError("FRICTION", "k_f must be >= 0");
    return kF * (tauG + tauI);
  }
  throw new EngineeringError("FRICTION_MODEL", `unsupported friction model ${model}`);
}

export function proportionalFriction(kF, tauG, tauI) {
  return frictionTorque({ model: "proportional", kF, tauG, tauI });
}

export function requiredTorque({ tauG, tauI, tauF = 0, tauExt = 0 }) {
  for (const [name, value] of Object.entries({ tauG, tauI, tauF, tauExt })) assertFinite(name, value);
  const tau = tauG + tauI + tauF + tauExt;
  return guardFinite("tau", tau, { tauG, tauI, tauF, tauExt });
}

export function peakTorqueUniformRod({
  mass,
  length,
  alpha,
  g = STANDARD_GRAVITY.value,
  cgFraction = 0.5,
  frictionModel = "none",
  frictionRatio = 0,
  b = 0,
  omega = 0,
  coulomb = 0,
  tauExt = 0,
}) {
  const Lcg = centreOfMass(length, cgFraction);
  const I = momentOfInertiaRod(mass, length);
  const tauG = gravityTorque({ mass, Lcg, g });
  const tauI = inertialTorque(I, alpha);
  const tauF = frictionTorque({
    model: frictionModel,
    b,
    omega,
    coulomb,
    kF: frictionRatio,
    tauG,
    tauI,
  });
  const tau = requiredTorque({ tauG, tauI, tauF, tauExt });
  return {
    g,
    Lcg,
    I,
    tauG,
    tauI,
    tauF,
    tauExt,
    tau,
    tauPeak: tau,
    frictionModel,
    frictionRatio: frictionModel === "proportional" ? frictionRatio : 0,
    evidence: frictionModel === "proportional" ? "C6" : "C3",
    physicalValidation: "S0",
  };
}

export function counterbalanceTorque({ model = "fraction", fraction = 0, tauG = 0, force = 0, dPerp = 0, k = 0, x = 0 }) {
  if (model === "fraction") {
    assertFinite("fraction", fraction);
    return fraction * tauG;
  }
  if (model === "force" || model === "strut") {
    assertFinite("force", force);
    assertFinite("dPerp", dPerp);
    return force * dPerp;
  }
  if (model === "spring") {
    assertFinite("k", k);
    assertFinite("x", x);
    assertFinite("dPerp", dPerp);
    return k * x * dPerp;
  }
  throw new EngineeringError("COUNTERBALANCE", `unsupported counterbalance model ${model}`);
}

export function motorTorqueWithCounterbalance(parts) {
  const tauCb = parts.tauCb ?? 0;
  return requiredTorque(parts) - tauCb;
}

export function workFromTorque(samples) {
  let w = 0;
  for (const sample of samples) {
    assertFinite("tau", sample.tau);
    assertFinite("dTheta", sample.dTheta);
    w += sample.tau * sample.dTheta;
  }
  assertFinite("work", w);
  return w;
}

export function energyReduction(work0, workCb) {
  assertFinite("work0", work0);
  assertFinite("workCb", workCb);
  if (work0 === 0) throw new EngineeringError("ENERGY", "W_0 must be non-zero to form a reduction ratio");
  const ratio = 1 - workCb / work0;
  return { ratio, percent: 100 * ratio, classification: "computational", physicalValidation: "S0" };
}

export function differentiateAngle(theta, dt) {
  if (theta.length < 3) throw new EngineeringError("KINEMATICS", "need at least 3 samples");
  assertFinite("dt", dt);
  if (!(dt > 0)) throw new EngineeringError("TIMESTEP", "dt must be > 0");
  const omega = [];
  const alpha = [];
  for (let i = 1; i < theta.length; i++) {
    omega.push((theta[i] - theta[i - 1]) / dt);
  }
  for (let i = 1; i < omega.length; i++) {
    alpha.push((omega[i] - omega[i - 1]) / dt);
  }
  return { omega, alpha, dt };
}

export const SCALING_MODELS = ["geometric_similarity", "custom_geometry", "empirical"];

export function scaleFromReference({ L, Lref, mRef, tauGRef, tauIRef, model = "geometric_similarity" }) {
  if (!SCALING_MODELS.includes(model)) {
    throw new EngineeringError("SCALING_MODEL", `unsupported scaling model ${model}`);
  }
  assertLength(L);
  assertLength(Lref, "Lref");
  const r = L / Lref;
  if (model !== "geometric_similarity") {
    return {
      model,
      ratio: r,
      mass: null,
      tauG: null,
      tauI: null,
      note: "Similarity exponents are not applied. Supply custom or empirical maps explicitly.",
    };
  }
  return {
    model,
    ratio: r,
    mass: mRef * r ** 3,
    tauG: tauGRef * r ** 4,
    tauI: tauIRef * r ** 5,
    exponents: { mass: 3, tauG: 4, tauI: 5 },
    assumptions: "geometric similarity, constant density, comparable α for inertial torque",
  };
}

/**
 * Rigid-body interface.
 * V1.0 implements and tests the single-link analytical solution.
 * Multi-body evaluation is an interface, not a claimed solver.
 */
export function rigidBodyInterface() {
  return {
    form: "M(q) qdd + C(q, qd) qd + G(q) + F(qd) + tau_ext = tau_actuator",
    singleLink: "implemented",
    multiBody: "interface-only",
    implementation: "S2",
    physicalValidation: "S0",
    evaluateSingleLink(q, qd, qdd, params) {
      const I = momentOfInertiaRod(params.mass, params.length);
      const tauG = params.mass * params.g * centreOfMass(params.length, params.cgFraction ?? 0.5) * Math.cos(q);
      const tauI = I * qdd;
      const tauF = frictionTorque({
        model: params.frictionModel ?? "combined",
        b: params.b ?? 0,
        omega: qd,
        coulomb: params.coulomb ?? 0,
      });
      const tauExt = params.tauExt ?? 0;
      const tauAct = tauI + tauG + tauF + tauExt;
      return { M: I, C: 0, G: tauG, F: tauF, tauExt, tauAct };
    },
    evaluateMultiBody() {
      throw new EngineeringError(
        "MULTIBODY_UNSUPPORTED",
        "A generalized multi-body interface is defined. A complete multi-body solver is not implemented in V1.0."
      );
    },
  };
}

export function simulateSingleLink({ theta0, omega0, dt, steps, torqueOf, inertia }) {
  assertFinite("dt", dt);
  if (!(dt > 0)) throw new EngineeringError("TIMESTEP", "dt must be > 0");
  let theta = theta0;
  let omega = omega0;
  const trace = [];
  for (let i = 0; i < steps; i++) {
    const tau = torqueOf(theta, omega, i * dt);
    const alpha = tau / inertia;
    omega = eulerStep(omega, alpha, dt);
    theta = eulerStep(theta, omega, dt);
    if (!Number.isFinite(theta) || !Number.isFinite(omega)) {
      throw new EngineeringError("DIVERGENCE", "single-link integration diverged", { step: i });
    }
    trace.push({ t: (i + 1) * dt, theta, omega, alpha, tau });
  }
  return trace;
}

export function assertEfficiencyLocal(eta) {
  return assertEfficiency(eta);
}
