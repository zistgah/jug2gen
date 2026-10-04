/**
 * Geometry closure: dimensions → mass → load → size → mass, iterated to convergence.
 * CAD export is a fabrication representation, not a certified part.
 */

import { EngineeringError } from "../core/errors.js";
import { massFromGeometry, gravityTorque, momentOfInertiaRod } from "../physics/mechanics.js";
import { secondMomentRectangular, bendingStress, safetyFactor, cantileverDistributedDeflection, cantileverPayloadAt } from "../structures/structures.js";
import { material } from "../materials/registry.js";

export function closeRectangularLink({
  length,
  density,
  youngs,
  allowable,
  g,
  cgFraction = 0.5,
  aspect = 0.6,
  targetSF = 2,
  h0 = 0.02,
  payloadMass = 0,
  maxIter = 40,
  tol = 0.02,
}) {
  let lo = 1e-3;
  let hi = Math.max(length, lo * 2);
  const history = [];
  let best = null;
  for (let i = 0; i < maxIter; i++) {
    const h = (lo + hi) / 2;
    const b = aspect * h;
    const area = b * h;
    const mass = massFromGeometry({ density, area, length });
    const Lcg = cgFraction * length;
    const tauG = gravityTorque({ mass: mass + payloadMass, Lcg, g });
    const I = secondMomentRectangular(b, h);
    const c = h / 2;
    const selfWeight = mass * g;
    const payload = payloadMass * g;
    const sigma = bendingStress(tauG, c, I);
    const sf = safetyFactor(allowable, sigma);
    const delta =
      cantileverDistributedDeflection(selfWeight / length, length, youngs, I) +
      cantileverPayloadAt(payload, length, youngs, I, length);
    const residual = Math.abs(sf - targetSF);
    const tolerance = tol * targetSF;
    best = {
      h,
      b,
      mass,
      payloadMass,
      tauG,
      sigma,
      sf,
      delta,
      residual,
      tolerance,
      loadCase: "distributed-self-weight+tip-payload",
    };
    history.push(best);
    if (residual <= tolerance) {
      return {
        converged: true,
        iterations: i + 1,
        length,
        ...best,
        history,
        Irot: momentOfInertiaRod(mass, length),
        reason: "residual-within-tolerance",
      };
    }
    if (sf < targetSF) lo = h;
    else hi = h;
  }
  const residual = best ? Math.abs(best.sf - targetSF) : Infinity;
  const tolerance = tol * targetSF;
  return {
    converged: false,
    iterations: maxIter,
    length,
    ...best,
    residual,
    tolerance,
    reason: "max-iterations",
    history,
  };
}

export function closeFromMaterial(materialId, spec) {
  const mat = material(materialId);
  return closeRectangularLink({
    density: mat.rho,
    youngs: mat.E,
    allowable: mat.sigmaY / (spec.materialFactor ?? 1),
    ...spec,
  });
}

export function fabricationRepresentation(closed) {
  if (!closed || !Number.isFinite(closed.h)) {
    throw new EngineeringError("GEOMETRY", "invalid geometry for fabrication representation");
  }
  const lengthMm = closed.length ? closed.length * 1000 : null;
  return {
    units: "mm",
    section: {
      width: closed.b * 1000,
      height: closed.h * 1000,
    },
    length: lengthMm,
    massKg: closed.mass,
    note: "Nominal fabrication representation derived from the converged section. Not a certified CAD model and not a measurement.",
    evidence: "C4",
    physicalValidation: "S0",
    implementation: "S3",
  };
}
