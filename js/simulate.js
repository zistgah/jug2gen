/**
 * Time-stepped mechanical analyses for the Jugaad-to-Genesis lab.
 * Models are engineering estimates [Cat 4/5], not certified simulations.
 */

export const ACTUATORS = {
  wiper: { name: "Wiper", V: 12, stallNm: 18, freeRpm: 60, cutC: 115, duty: 0.7, burstS: 1e9, thermalC: 220, hLoss: 1.4 },
  starter: { name: "Starter", V: 12, stallNm: 12, freeRpm: 2600, cutC: 150, duty: 0.04, burstS: 30, thermalC: 70, hLoss: 0.35 },
  window: { name: "Window lift", V: 12, stallNm: 8, freeRpm: 80, cutC: 105, duty: 0.15, burstS: 20, thermalC: 90, hLoss: 0.45 },
  rickshaw: { name: "E-rickshaw BLDC", V: 48, stallNm: 45, freeRpm: 420, cutC: 125, duty: 0.85, burstS: 1e9, thermalC: 480, hLoss: 3.2 },
};

export function motorConstants(act) {
  const wFree = (act.freeRpm * 2 * Math.PI) / 60;
  const Ke = act.V / wFree;
  const Kt = Ke;
  const R = (act.V * Kt) / act.stallNm;
  return { Ke, Kt, R, wFree };
}

export function chainModel({ tauNeed, sprocketR = 0.04, misalignMm = 0.6, cycles = 2e5 }) {
  const perStage = 3.5;
  const stages = Math.max(1, Math.ceil(Math.log(Math.max(tauNeed / 18, 1)) / Math.log(perStage)));
  const ratio = Math.min(perStage ** stages, Math.max(tauNeed / 8, 1));
  const eta = 0.93 ** stages * (1 - Math.min(0.12, misalignMm / 40));
  const backlashDeg = 0.6 * stages + misalignMm * 0.15;
  const tension = tauNeed / Math.max(sprocketR * ratio, 0.01);
  const wearLife = 8e5 / (1 + tension / 800) / (1 + misalignMm);
  return { stages, ratio, eta, backlashDeg, tension, wearLife, cycles, worn: cycles > wearLife };
}

export function passiveAt(theta, omega, state) {
  const grav = state.m * 9.80665 * state.L * Math.cos(theta);
  const strut = state.strut * grav * Math.cos(theta * 0.15);
  const shock = state.shockK * (0.15 - 0.1 * Math.sin(theta)) - state.shockC * omega;
  const lifter = omega < 0 ? state.lifterC * omega : 0.15 * state.lifterC * omega;
  return { grav, strut, shock, lifter, net: grav - strut - shock - lifter };
}

export function simulateJoint(state, opts = {}) {
  const act = ACTUATORS[opts.actuator || "wiper"];
  const { Ke, Kt, R } = motorConstants(act);
  const chain = chainModel({ tauNeed: state.m * 9.81 * state.L * 0.5, misalignMm: opts.misalignMm ?? 0.6 });
  const I = (1 / 3) * state.m * state.L * state.L;
  const backlash = (chain.backlashDeg * Math.PI) / 180;
  let theta = -0.3;
  let omega = 0;
  let temp = 35;
  let onTime = 0;
  const dt = 0.002;
  const steps = Math.floor((opts.seconds || 8) / dt);
  const trace = [];
  let cut = false;
  for (let n = 0; n < steps; n++) {
    const t = n * dt;
    const target = 0.4 * Math.sin(t * 0.7);
    const err = target - theta;
    let vCmd = Math.max(-act.V, Math.min(act.V, err * 40 - omega * 2));
    if (temp > act.cutC || onTime > act.burstS) {
      vCmd = 0;
      cut = true;
    }
    const iMot = (vCmd - Ke * omega * chain.ratio) / R;
    const tauMot = Kt * iMot * chain.eta * chain.ratio;
    const dead = Math.abs(err) < backlash * 0.5 && Math.abs(omega) < 0.05;
    const tauOut = dead ? 0 : tauMot;
    const pass = passiveAt(theta, omega, {
      m: state.m,
      L: state.L,
      strut: state.counterbalance ?? 0.8,
      shockK: opts.shockK ?? 40,
      shockC: opts.shockC ?? 8,
      lifterC: opts.lifterC ?? 6,
    });
    const alpha = (tauOut - pass.net - 0.4 * omega) / Math.max(I, 1e-4);
    omega += alpha * dt;
    theta += omega * dt;
    const heat = iMot * iMot * R - act.hLoss * (temp - 30);
    temp += (heat / act.thermalC) * dt;
    if (Math.abs(vCmd) > 1) onTime += dt;
    else onTime = Math.max(0, onTime - dt);
    if (n % 40 === 0) trace.push({ t, theta, omega, tau: tauOut, temp, i: iMot, target });
  }
  return { act: act.name, chain, trace, cut, peakTemp: Math.max(...trace.map((p) => p.temp)), peakTau: Math.max(...trace.map((p) => Math.abs(p.tau))) };
}

export function structureSweep(state) {
  const rows = [0.5, 5, 50, 150, 500].map((m) => {
    const L = state.coupleMass ? state.L * Math.cbrt(m / Math.max(state.m, 0.2)) : [0.1, 0.4, 1, 2, 4][[0.5, 5, 50, 150, 500].indexOf(m)];
    const section = 0.008 + Math.cbrt(m) * 0.006;
    const Isec = (section * (section * 0.72) ** 3) / 12;
    const M = m * 9.80665 * L * 0.5;
    const sigma = (M * (section * 0.36)) / Math.max(Isec, 1e-9) / 1e6;
    const bearing = m * 9.80665 * 0.55;
    const allow = 250;
    return { m, L, M, sigma, bearing, yield: sigma > allow };
  });
  return rows;
}

export function foundrySim({ alloy = "aluminium", mass = 8, headM = 0.12, gateMm = 18 }) {
  const table = {
    aluminium: { rho: 2700, shrink: 0.013, Cm: 2.4, pour: 740 },
    brass: { rho: 8500, shrink: 0.016, Cm: 3.1, pour: 1020 },
    bronze: { rho: 8800, shrink: 0.015, Cm: 3.4, pour: 1050 },
    steel: { rho: 7850, shrink: 0.02, Cm: 4.5, pour: 1580 },
    ti64: { rho: 4430, shrink: 0.016, Cm: 5, pour: 1720 },
  }[alloy];
  const volume = mass / table.rho;
  const side = Math.cbrt(volume);
  const area = 6 * side * side;
  const gate = Math.PI * (gateMm / 2000) ** 2;
  const v = 0.7 * Math.sqrt(2 * 9.80665 * headM);
  const fillS = volume / Math.max(gate * v, 1e-8);
  const modulus = volume / area;
  const solidS = table.Cm * (modulus * 100) ** 2;
  const shrinkMm = side * 1000 * table.shrink;
  const tolMm = 0.4 + shrinkMm * 0.25 + (fillS > 8 ? 0.3 : 0);
  return { ...table, volume, fillS, solidS, shrinkMm, tolMm, refused: alloy === "steel" || alloy === "ti64" };
}

export function windingSim({ slots = 12, turns = 40, awg = 18, current = 8, rpm = 300, Lstack = 0.04 }) {
  const d = { 16: 1.29, 18: 1.02, 20: 0.81, 22: 0.64 }[awg] || 1.02;
  const slotW = 8;
  const slotD = 12;
  const copperArea = slots * turns * Math.PI * (d / 2) ** 2;
  const slotArea = slots * slotW * slotD;
  const fill = copperArea / slotArea;
  const ohmsPerM = { 16: 0.0132, 18: 0.021, 20: 0.0333, 22: 0.053 }[awg] || 0.021;
  const length = slots * turns * 2 * (Lstack + 0.04);
  const R = length * ohmsPerM;
  const Ke = 0.015 * turns * slots / 12;
  const curve = [];
  for (let r = 0; r <= 1200; r += 60) {
    const w = (r * 2 * Math.PI) / 60;
    const i = Math.max(0, (12 - Ke * w) / R);
    curve.push({ rpm: r, torque: Ke * i, i });
  }
  const iOp = current;
  const loss = iOp * iOp * R;
  let temp = 35;
  const trace = [];
  for (let s = 0; s <= 120; s += 2) {
    temp += ((loss - 0.8 * (temp - 30)) / 200) * 2;
    trace.push({ s, temp });
  }
  return { fill, R, Ke, length, curve, trace, loss, rpm };
}

export function camSim({ lengthMm = 180, toolMm = 6, doc = 2, woc = 4, feed = 180, stock = 12 }) {
  const passes = Math.ceil(stock / doc) * Math.ceil(lengthMm / woc);
  const pathMm = passes * lengthMm * 1.15;
  const timeS = (pathMm / feed) * 60;
  const mrr = (doc * woc * feed) / 1000;
  const kc = 1800;
  const vc = 80;
  const force = (kc * doc * woc * (feed / (vc * 1000))) * 0.15;
  const layers = [];
  const layerH = 0.2;
  const nLayer = Math.ceil(stock / layerH);
  for (let i = 0; i < Math.min(nLayer, 40); i++) {
    const perim = 2 * (lengthMm + lengthMm * 0.6) * (1 - i / (nLayer * 8));
    const extrude = perim * 0.45 * layerH;
    layers.push({ i, perim, extrude, t: perim / 40 });
  }
  return { passes, pathMm, timeS, mrr, force, layers, printTime: layers.reduce((s, l) => s + l.t, 0) };
}

export function simulateArm(state) {
  const L1 = state.L * 0.55;
  const L2 = state.L * 0.45;
  const m1 = state.m * 0.55;
  const m2 = state.m * 0.45;
  let q1 = 0.4;
  let q2 = -0.6;
  let w1 = 0;
  let w2 = 0;
  const dt = 0.004;
  const trace = [];
  for (let n = 0; n < 1500; n++) {
    const t = n * dt;
    const g1 = (m1 * L1 * 0.5 + m2 * L1) * 9.81 * Math.cos(q1) + m2 * 9.81 * L2 * 0.5 * Math.cos(q1 + q2);
    const g2 = m2 * 9.81 * L2 * 0.5 * Math.cos(q1 + q2);
    const target1 = 0.5 * Math.sin(t * 0.6);
    const target2 = -0.4 * Math.cos(t * 0.5);
    const tau1 = 80 * (target1 - q1) - 12 * w1 + g1 * (1 - state.counterbalance);
    const tau2 = 40 * (target2 - q2) - 6 * w2 + g2 * (1 - state.counterbalance);
    const I1 = (1 / 3) * m1 * L1 * L1 + m2 * L1 * L1;
    const I2 = (1 / 3) * m2 * L2 * L2;
    w1 += (tau1 / I1) * dt;
    w2 += (tau2 / I2) * dt;
    q1 += w1 * dt;
    q2 += w2 * dt;
    if (n % 20 === 0) trace.push({ t, q1, q2, tau1, tau2, x: L1 * Math.cos(q1) + L2 * Math.cos(q1 + q2), y: L1 * Math.sin(q1) + L2 * Math.sin(q1 + q2) });
  }
  return { L1, L2, trace };
}

export function simulateRay() {
  const mass = 85;
  const S = 1.6;
  const rhoA = 1.2;
  const rhoW = 1025;
  let v = 18;
  let h = 40;
  const air = [];
  for (let i = 0; i < 80; i++) {
    const cl = 0.7;
    const cd = 0.08 + 0.04 * cl * cl;
    const lift = 0.5 * rhoA * v * v * S * cl;
    const drag = 0.5 * rhoA * v * v * S * cd;
    const acc = (lift * 0.15 - drag) / mass;
    v = Math.max(8, v + acc * 0.2);
    h += (v * 0.04 - (mass * 9.81 - lift) / mass) * 0.15;
    air.push({ i, v, h: Math.max(0, h), lift, drag });
  }
  let vs = 6;
  const surface = [];
  for (let i = 0; i < 60; i++) {
    const fr = vs / Math.sqrt(9.81 * 1.8);
    const drag = 0.5 * rhoW * vs * vs * 0.08 * (1 + fr * fr);
    vs = Math.max(1, vs + ((400 - drag) / mass) * 0.15);
    surface.push({ i, vs, fr, drag });
  }
  let vu = 1.2;
  const sub = [];
  for (let i = 0; i < 60; i++) {
    const freq = 0.8;
    const amp = 0.18;
    const thrust = 18 * rhoW * amp * amp * freq * freq;
    const drag = 0.5 * rhoW * vu * vu * 0.15;
    vu = Math.max(0.2, vu + ((thrust - drag) / mass) * 0.2);
    sub.push({ i, vu, thrust, drag });
  }
  return { air, surface, sub };
}
