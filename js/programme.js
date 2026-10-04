/**
 * Programme layer from the Jugaad-to-Genesis source notes.
 * Tables and thresholds are classified. Nothing here is a certified process spec.
 */

export const STAGES = {
  jugaad: {
    name: "Jugaad",
    question: "Can we make it work?",
    definition: "Functional actuation from scavenged parts, without guaranteed repeatability.",
  },
  swaraj: {
    name: "Swaraj",
    question: "Can we make it again?",
    definition: "Deterministic local reproducibility, repair, and inspectability.",
  },
  genesis: {
    name: "Genesis",
    question: "Can we make the means by which we make it?",
    definition: "Closure of the production system that produces the machine.",
  },
};

export const CAPABILITY_MATRIX = [
  ["Materials", "Salvaged scrap steel and tube", "Recast Al/brass, standardised alloys", "Ti-6Al-4V, carbon-PEEK, functional materials"],
  ["Fabrication", "Angle grinder, hand weld, ±1–5 mm", "Foundry-in-a-Box, 3-axis CNC, ±0.05 mm target", "Closed-loop micromachining, ±1 µm target"],
  ["Actuation", "Wiper, starter, chain", "Hand-wound BLDC, planetary sets", "Direct-drive, high torque density"],
  ["Sensing", "Limit switch, shunt", "Encoder, IMU, Hall", "Event arrays, multimodal"],
  ["Compute", "Relay, MOSFET, Arduino-class", "ESP32 / RISC-V", "PEDLER event core, balanced ternary"],
  ["Energy", "Lead-acid, grid", "LiFePO4 modules, solar rig", "Solid-state / hybrid, conceptual"],
  ["Winding", "Scrap coils, uncalibrated", "Hand-wound slot stators", "Automated core and strip winding"],
  ["Verification", "Eye, multimeter", "Strobe, load balance", "Self-test, acoustic, formal checks"],
  ["Human skill", "Mistry / mechanic", "Winder and integrator", "System architect"],
  ["Organisation", "One workshop", "Regional cooperative", "Federated nodes"],
];

export const ALLOYS = {
  aluminium: { name: "Aluminium", meltC: 660, pourC: 740, cp: 900, latent: 397000, density: 2700, furnace: "waste-oil or small induction", castable: true },
  brass: { name: "Brass", meltC: 930, pourC: 1020, cp: 380, latent: 168000, density: 8500, furnace: "forced-draft or induction", castable: true },
  bronze: { name: "Bronze", meltC: 950, pourC: 1050, cp: 435, latent: 200000, density: 8800, furnace: "induction preferred", castable: true },
  steel: { name: "Mild steel", meltC: 1500, pourC: 1580, cp: 500, latent: 270000, density: 7850, furnace: "not a roadside waste-oil box", castable: false },
  ti64: { name: "Ti-6Al-4V", meltC: 1660, pourC: 1720, cp: 526, latent: 390000, density: 4430, furnace: "vacuum arc remelt", castable: false },
};

export function meltEnergy(alloyKey, massKg, furnaceEta = 0.25) {
  const a = ALLOYS[alloyKey];
  const dT = a.pourC - 25;
  const joules = massKg * (a.cp * dT + a.latent);
  const kwh = joules / 3.6e6 / furnaceEta;
  return { alloy: a, joules, kwh, castableHere: a.castable };
}

export const CAST_VS_MACHINE = [
  ["Housings, brackets, sprocket blanks", "Cast, then face"],
  ["Bearing seats, shaft fits", "Machine after cast"],
  ["Gear teeth at Swaraj tolerance", "Machine or buy; do not rely on as-cast"],
  ["Structural angle, tube chassis", "Cut and weld, not cast"],
  ["Magnet wire, races, NdFeB, silicon", "Virgin or strategic reserve"],
];

export function windingModel({ slots = 12, turns = 40, awg = 18, current = 8, poles = 8 }) {
  const ohmsPerM = { 16: 0.0132, 18: 0.021, 20: 0.0333, 22: 0.053 }[awg] || 0.021;
  const meanTurnM = 0.18;
  const length = slots * turns * meanTurnM;
  const resistance = length * ohmsPerM;
  const mmf = turns * current;
  const copperLoss = current * current * resistance;
  const fill = Math.min(0.72, (turns * (awg <= 18 ? 1.0 : 0.7)) / (slots * 12));
  return { slots, turns, awg, current, poles, length, resistance, mmf, copperLoss, fill };
}

export const COMPUTE_STACK = [
  { id: 1, name: "Relay / MOSFET", keeps: "Direct switching", loses: "No loop, no log" },
  { id: 2, name: "ESP32 / MCU", keeps: "PWM, PID, CAN or UART", loses: "Clocked sample pipeline" },
  { id: 3, name: "RISC-V / FPGA", keeps: "Parallel loops, open ISA", loses: "Still a fetch path unless offloaded" },
  { id: 4, name: "PEDLER hardware", keeps: "Event-driven ternary path", loses: "Does not replace gate drive or E-stop" },
];

export const CONVENTIONAL_ALWAYS = [
  "MOSFET / IGBT gate drive",
  "Fuses and over-current",
  "12 V → 5 V → 3.3 V regulation",
  "Physical E-stop",
];

export const TERNARY = [
  ["−1", "Reverse"],
  ["0", "Brake / idle"],
  ["+1", "Forward"],
];

export const SCRIPTS = {
  English: "if (speed > 50) stop()",
  Romenagri: "yadi (chaal > 50) to rokie()",
  Devanagari: "यदि (चाल > ५०) तो रोकिए()",
  Bangla: "যদি (গতি > ৫০) তবে থামান()",
  Telugu: "ఒకవేళ (వేగం > ౫౦) అయితే ఆపు()",
  Urdu: "اگر (رفتار > ۵۰) تو روکیں()",
};

export const TIERS = [
  { tier: "1 Mistry", needs: "Literacy, trade time", skills: "Cut, weld, wire a motor", tools: "Grinder, arc, calipers", builds: "Single-axis tool" },
  { tier: "2 Winder", needs: "Tier 1 artefact", skills: "Wind, mould, solder", tools: "Winding rig, LCR, sand flask", builds: "Multi-axis gantry, hand-wound motor" },
  { tier: "3 Integrator", needs: "Tier 2, basic maths", skills: "PANINI loops, sensor fusion", tools: "Scope, logic analyser", builds: "Closed-loop mobile or arm" },
  { tier: "4 Researcher", needs: "Tier 3, theory", skills: "PEDLER, materials, architecture", tools: "Bench, spectral where available", builds: "Multi-domain embodiment" },
];

export const LOCAL_MUST = ["Frames", "Basic SRM/BLDC", "Basic drives", "Structural castings", "Low-level firmware"];
export const SAFE_IMPORT = ["Resistors, capacitors", "Fasteners", "Generic bearings", "Unworked stock"];
export const RESERVES = ["Magnet wire", "Copper stock", "Magnet blanks", "MOSFET/IGBT", "Microcontrollers"];
export const SUBSTITUTIONS = [
  ["NdFeB BLDC", "Switched reluctance, no rare earth"],
  ["Proprietary MCU", "Open RISC-V"],
  ["Imported servo", "Wiper + chain, then hand-wound"],
];

export const RAY = {
  massKg: 85,
  payloadKg: 25,
  costInr: 8500000,
  environments: ["Aerial gliding and powered flight", "Surface skim", "Subsurface undulation"],
  designed: ["Wing kinematics concept", "PEDLER loop concept", "PANINI flight-stack concept"],
  conceptual: ["Long-range hybrid power", "Hadal seal transitions"],
  reused: ["Winding standard", "CAN / RS-485", "Event-logic shape"],
};

export const EVIDENCE = [
  ["PEDLER", "Named in supplied architecture", "Established as user work only if externally documented"],
  ["PANINI / PANINIq", "Named in supplied architecture", "Same caveat"],
  ["Hindawi / Romenagri", "Named", "Implementation status not re-verified here"],
  ["GramSheel, VIKRAM, Humanesque", "Named framing", "Topology is a synthesis"],
  ["Flying Ray-Man", "Named concept", "Performance numbers are estimates"],
  ["₹4,000 node", "Illustrative BOM target", "Not a demonstrated quote"],
  ["₹85L+ Ray-Man", "Prototype estimate", "Not a bid"],
  ["1.2 kg / 150 kg", "Heuristic walls", "Not physical constants"],
  ["70% energy cut", "Earlier claim", "Replaced by the lift integral in this lab"],
  ["Foundry-in-a-Box", "Proposed process", "Needs a shop trial"],
  ["72-hour deterrent", "Design threshold", "Not a law"],
  ["±0.1 mm / ±5 µm / ±1 µm", "Stage targets", "Unverified"],
];

export function closureScore(input) {
  const checks = [
    ["Structure from scrap or local stock", input.structure],
    ["Actuator wound or salvaged with a fallback", input.actuator],
    ["Drive electronics repairable", input.drive],
    ["Controller has an open fallback", input.controller],
    ["Verification script exists", input.verification],
    ["Second workshop can rebuild from the pack", input.pack],
    ["Lifting stays inside two people, or a crane is local", input.handling],
    ["Critical spares inside 72 h design threshold", input.spares],
  ];
  const passed = checks.filter((c) => c[1]).length;
  let stage = "Jugaad";
  if (passed >= 6) stage = "Swaraj";
  if (passed === 8 && input.tools) stage = "Genesis-facing";
  return { checks, passed, stage };
}

export function materialsPath(step) {
  const chain = ["Sand-cast Al", "Billet Al, CNC", "Carbon-PEEK layup", "Titanium via vacuum arc"];
  return { chain, at: chain[Math.min(3, step)], blocked: step >= 3 ? "Titanium sponge and vacuum practice stay strategic, not roadside." : "Earlier steps can live in a regional shop if the furnace and mill exist." };
}

export function programmeReport(state, extra) {
  return [
    "# Jugaad-to-Genesis programme note",
    "",
    "Curated from the supplied notes. Cat 4–6 items are not measurements.",
    "",
    `- Node: L=${state.L} m, m=${state.m} kg`,
    `- Foundry alloy: ${extra.alloy}`,
    `- Melt energy estimate: ${extra.kwh.toFixed(2)} kWh at stated furnace efficiency`,
    `- Winding MMF: ${extra.mmf.toFixed(0)} A-turns`,
    `- Compute tier: ${extra.computeName}`,
    `- Closure: ${extra.closure.passed}/8 → ${extra.closure.stage}`,
    `- Ray-Man mass sits ${extra.rayRegime}`,
    "",
    "See docs/ for the curated source.",
  ].join("\n");
}
