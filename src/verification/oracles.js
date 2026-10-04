/**
 * Independent oracles. These expressions are not imports of the
 * production equation functions. Tests compare implementations to these.
 */

export const oracles = {
  gravity(mass, g, Lcg) {
    return mass * g * Lcg;
  },
  inertia(mass, length) {
    return (1 / 3) * mass * length * length;
  },
  inertial(I, alpha) {
    return I * alpha;
  },
  peak({ mass, length, alpha, g, kF }) {
    const Lcg = 0.5 * length;
    const I = (1 / 3) * mass * length * length;
    const tauG = mass * g * Lcg;
    const tauI = I * alpha;
    const tauF = kF * (tauG + tauI);
    return { Lcg, I, tauG, tauI, tauF, tau: tauG + tauI + tauF };
  },
  power(tau, omega) {
    return tau * omega;
  },
  electrical(pMech, eta) {
    return pMech / eta;
  },
  current(pElec, voltage) {
    return pElec / voltage;
  },
  copper(current, resistance) {
    return current * current * resistance;
  },
  ratio(teethOut, teethIn) {
    return teethOut / teethIn;
  },
  chain(tau, radius) {
    return tau / radius;
  },
  bending(moment, c, I) {
    return (moment * c) / I;
  },
  pointDeflection(force, length, youngs, I) {
    return (force * length ** 3) / (3 * youngs * I);
  },
  distributedDeflection(w, length, youngs, I) {
    return (w * length ** 4) / (8 * youngs * I);
  },
  vonMises(sigmaB, tauT) {
    return Math.sqrt(sigmaB * sigmaB + 3 * tauT * tauT);
  },
  safety(allowable, applied) {
    return allowable / applied;
  },
  thermalSteady(ambient, powerLoss, Rth) {
    return ambient + powerLoss * Rth;
  },
  thermalTransient({ ambient, powerLoss, Rth, Cth, T0, t }) {
    const Tss = ambient + powerLoss * Rth;
    return Tss + (T0 - Tss) * Math.exp(-t / (Rth * Cth));
  },
  expGrowth(t) {
    return Math.exp(t);
  },
  scaleMass(mRef, s) {
    return mRef * s ** 3;
  },
  scaleTauG(tauRef, s) {
    return tauRef * s ** 4;
  },
  scaleTauI(tauRef, s) {
    return tauRef * s ** 5;
  },
};
