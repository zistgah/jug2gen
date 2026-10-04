import {
  PRESETS,
  TAXONOMY,
  regimeOf,
  torqueModel,
  specificCost,
  totalCost,
  actuatorFor,
  chainStage,
  motorTorqueAt,
  liftEnergy,
  voltageClass,
  capabilityVector,
  STAGE_REF,
  BOM_TEMPLATE,
  bomTotal,
  closureStatement,
  sweepCost,
  format,
  similarityScale,
} from "./model.js";
import {
  buildLinkMesh,
  stlBinary,
  objText,
  scadText,
  dxfText,
  svgText,
  gcodeText,
  stepText,
  threeMf,
  parseSTL,
  parseOBJ,
  specJSON,
  FORMAT_GUIDE,
} from "./exchange.js";
import { mountChart, drawCost, drawTorque, drawScale, drawRadar } from "./charts.js";
import { createScene } from "./scene.js";
import {
  camSim,
  foundrySim,
  simulateArm,
  simulateJoint,
  simulateRay,
  structureSweep,
  windingSim,
} from "./simulate.js";
import {
  ALLOYS,
  CAPABILITY_MATRIX,
  CAST_VS_MACHINE,
  COMPUTE_STACK,
  CONVENTIONAL_ALWAYS,
  EVIDENCE,
  LOCAL_MUST,
  RAY,
  RESERVES,
  SAFE_IMPORT,
  SCRIPTS,
  STAGES,
  SUBSTITUTIONS,
  TERNARY,
  TIERS,
  closureScore,
  materialsPath,
  meltEnergy,
  programmeReport,
  windingModel,
} from "./programme.js";

const state = {
  L: 1,
  m: 50,
  alpha: 1.2,
  P: 1000,
  V: 12,
  eta: 0.7,
  counterbalance: 0.85,
  density: 7850,
  skill: 2,
  compute: 2,
  coupleMass: false,
  priceLabour: false,
  alloy: "aluminium",
  charge: 8,
  etaF: 0.25,
  slots: 12,
  turns: 40,
  awg: 18,
  amps: 8,
  path: 1,
  checks: {
    structure: true,
    actuator: true,
    drive: true,
    controller: true,
    verification: false,
    pack: false,
    handling: true,
    spares: false,
    tools: false,
  },
  bom: BOM_TEMPLATE.map((r) => ({ ...r })),
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

function readControls() {
  state.L = Number($("#L").value);
  state.alpha = Number($("#alpha").value);
  state.P = Number($("#P").value);
  state.V = Number($("#V").value);
  state.eta = Number($("#eta").value);
  state.counterbalance = Number($("#cb").value);
  state.density = Number($("#density").value);
  state.skill = Number($("#skill").value);
  state.compute = Number($("#compute").value);
  state.coupleMass = $("#couple").checked;
  state.m = state.coupleMass ? similarityScale(state.L, state.density) : Number($("#m").value);
  if (state.coupleMass) $("#m").value = state.m.toFixed(2);
}

function analyse() {
  const torque = torqueModel(state);
  const cost = specificCost(state.m, state.P);
  const energy = liftEnergy(state);
  const regime = regimeOf(state.m);
  const actuator = actuatorFor(state.m, torque.tauPeak);
  const chain = chainStage(18, torque.tauPeak);
  const volt = voltageClass(state.V);
  const caps = capabilityVector(state);
  return { torque, cost, energy, regime, actuator, chain, volt, caps, total: totalCost(state.m, state.P) };
}

function renderReadout(a) {
  $("#regimeName").textContent = a.regime.name;
  $("#regimeDetail").textContent = a.regime.detail;
  $("#closure").textContent = closureStatement(state.m);
  const chip = $("#regimeChip");
  chip.dataset.regime = a.regime.id;
  chip.textContent = a.regime.band;
  const rows = [
    ["Length", `${format(state.L, 2)} m`],
    ["Mass", `${format(state.m, 2)} kg`],
    ["Gravity torque", `${format(a.torque.tauG, 1)} N·m`],
    ["Inertial torque", `${format(a.torque.tauI, 1)} N·m`],
    ["Peak torque", `${format(a.torque.tauPeak, 1)} N·m`],
    ["Specific cost", `₹ ${format(a.cost.total, 0)} / kg`],
    ["Node cost", `₹ ${format(a.total, 0)}`],
    ["Actuator", a.actuator.name],
    ["Cost driver", a.actuator.driver],
    ["Chain ratio", `${format(a.chain.ratio, 1)} : 1 · ${a.chain.stages} stage`],
    ["Voltage class", a.volt.name],
    ["Lift energy saved", `${Math.round(a.energy.saved * 100)}% vs no strut`],
    ["Precision bound", `${format(state.P, 0)} µm`],
    ["Efficiency", `${Math.round(state.eta * 100)}%`],
  ];
  $("#readout").innerHTML = rows
    .map(([k, v]) => `<div class="kv"><span>${k}</span><strong>${v}</strong></div>`)
    .join("");
  $("#tauBig").textContent = format(a.torque.tauPeak, 1);
  $("#costBig").textContent = format(a.cost.total, 0);
  $("#saveBig").textContent = `${Math.round(a.energy.saved * 100)}%`;
  $("#scaleNote").textContent =
    "Gravity term scales as L⁴ and inertia as L⁵ only under geometric similarity (m ∝ L³) with comparable acceleration. Real machines break similarity on purpose.";
}

let paints = [];
let sceneApi = null;
let theta = 0.4;
let last = performance.now();

function redraw() {
  readControls();
  const a = analyse();
  renderReadout(a);
  renderBom();
  renderProgramme();
  paints.forEach((p) => p(a));
  $("#mLabel").textContent = `${Number(state.m).toFixed(1)} kg`;
  $("#LLabel").textContent = `${Number(state.L).toFixed(2)} m`;
  $("#cbLabel").textContent = `${Math.round(state.counterbalance * 100)}%`;
  return a;
}

function bindCharts() {
  const costPts = sweepCost();
  paints.push(
    mountChart($("#chartCost"), (ctx, w, h) => {
      const a = analyse();
      drawCost(ctx, w, h, costPts, { m: state.m, c: a.cost.total });
    })
  );
  paints.push(
    mountChart($("#chartTorque"), (ctx, w, h) => {
      const ptsOn = [];
      const ptsOff = [];
      const ptsG = [];
      for (let i = 0; i < 48; i++) {
        const deg = -20 + (90 * i) / 47;
        const th = (deg * Math.PI) / 180;
        const on = motorTorqueAt(th, state);
        const off = motorTorqueAt(th, { ...state, counterbalance: 0 });
        ptsOn.push({ y: Math.max(on.motor, 0) });
        ptsOff.push({ y: Math.max(off.motor, 0) });
        ptsG.push({ y: Math.abs(on.grav) });
      }
      drawTorque(ctx, w, h, [
        { name: "Gravity", color: "#8aa4c8", pts: ptsG },
        { name: "Motor, no strut", color: "#e07a5f", pts: ptsOff },
        { name: "Motor, compensated", color: "#7dcea0", pts: ptsOn },
      ]);
    })
  );
  paints.push(
    mountChart($("#chartScale"), (ctx, w, h) => {
      const rows = [
        { label: "0.5 kg", tau: torqueModel({ m: 0.5, L: 0.1, alpha: 8 }).tauPeak, color: "#e07a5f" },
        { label: "5 kg", tau: torqueModel({ m: 5, L: 0.4, alpha: 4 }).tauPeak, color: "#d4a574" },
        { label: "50 kg", tau: torqueModel({ m: 50, L: 1, alpha: 1.2 }).tauPeak, color: "#7dcea0" },
        { label: "150 kg", tau: torqueModel({ m: 150, L: 2, alpha: 0.6 }).tauPeak, color: "#e4c99a" },
        { label: "500 kg", tau: torqueModel({ m: 500, L: 4, alpha: 0.25 }).tauPeak, color: "#8aa4c8" },
      ];
      drawScale(ctx, w, h, rows);
    })
  );
  paints.push(
    mountChart($("#chartRadar"), (ctx, w, h) => {
      const caps = capabilityVector(state);
      drawRadar(
        ctx,
        w,
        h,
        caps.map((c) => c.key),
        [
          { scores: STAGE_REF.Jugaad, stroke: "rgba(224,122,95,0.9)", fill: "rgba(224,122,95,0.12)" },
          { scores: STAGE_REF.Swaraj, stroke: "rgba(125,206,160,0.9)", fill: "rgba(125,206,160,0.08)" },
          { scores: caps.map((c) => c.score), stroke: "#f0b429", fill: "rgba(240,180,41,0.18)" },
        ]
      );
    })
  );
}

function renderBom() {
  const body = $("#bomBody");
  body.innerHTML = state.bom
    .map(
      (r, i) => `<tr>
        <td>${r.cat}</td>
        <td>${r.item}</td>
        <td>${r.source}</td>
        <td>${r.salvage ? "Salvage" : "Purchase"}</td>
        <td><input data-bom="${i}" type="number" min="0" step="10" value="${r.cost}"></td>
      </tr>`
    )
    .join("");
  const tot = bomTotal(state.bom, state.priceLabour);
  $("#bomParts").textContent = `₹ ${format(tot.parts, 0)}`;
  $("#bomLabour").textContent = state.priceLabour ? `₹ ${format(tot.labour, 0)}` : "₹ 0 · sweat equity";
  $("#bomTotal").textContent = `₹ ${format(tot.total, 0)}`;
  $("#bomDelta").textContent =
    tot.total <= TAXONOMY.nodeTargetInr
      ? `${format(TAXONOMY.nodeTargetInr - tot.total, 0)} under the illustrative ₹4,000 target`
      : `${format(tot.total - TAXONOMY.nodeTargetInr, 0)} over the illustrative ₹4,000 target`;
}

function renderGuide() {
  $("#guide").innerHTML = FORMAT_GUIDE.map(
    (f) => `<article class="fmt"><header>${f.ext}</header><p>${f.use}</p><small>${f.tools}</small></article>`
  ).join("");
}

function renderRegimes() {
  const bands = [
    ["< 1.2 kg", "Servos / micro steppers", "Print, sheet, PCB", "Desktop tools", "precision"],
    ["1.2–10 kg", "Appliance / RC BLDC", "Plate, extrusion", "Bench tools", "bridge"],
    ["10–50 kg", "Wiper / scooter motors", "Welded mild steel", "Single-phase weld", "swaraj"],
    ["50–150 kg", "Starter / e-rickshaw", "Heavy section, cast", "Two-person lift limit", "swaraj"],
    ["> 150 kg", "3-phase / hydraulics", "I-beam, heavy cast", "Crane, three-phase", "crane"],
  ];
  $("#regimes").innerHTML = bands
    .map(
      ([m, a, s, d, id]) => `<article class="band" data-regime="${id}">
        <h3>${m}</h3>
        <p>${a}</p>
        <p>${s}</p>
        <small>${d}</small>
      </article>`
    )
    .join("");
}

function download(name, blob) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

function exportOf(kind) {
  const mesh = buildLinkMesh(state);
  const a = analyse();
  const stamp = "j2g-link";
  if (kind === "stl") download(`${stamp}.stl`, new Blob([stlBinary(mesh)], { type: "model/stl" }));
  if (kind === "obj") download(`${stamp}.obj`, new Blob([objText(mesh)], { type: "text/plain" }));
  if (kind === "scad") download(`${stamp}.scad`, new Blob([scadText(state, mesh)], { type: "text/plain" }));
  if (kind === "dxf") download(`${stamp}.dxf`, new Blob([dxfText(mesh)], { type: "application/dxf" }));
  if (kind === "svg") download(`${stamp}.svg`, new Blob([svgText(mesh)], { type: "image/svg+xml" }));
  if (kind === "gcode") download(`${stamp}.nc`, new Blob([gcodeText(mesh)], { type: "text/plain" }));
  if (kind === "step") download(`${stamp}.step`, new Blob([stepText(mesh)], { type: "model/step" }));
  if (kind === "3mf") download(`${stamp}.3mf`, new Blob([threeMf(mesh)], { type: "model/3mf" }));
  if (kind === "json") {
    download(
      "j2g-node.json",
      new Blob(
        [
          specJSON(state, {
            regime: a.regime.name,
            tauPeak: a.torque.tauPeak,
            specificCost: a.cost.total,
            actuator: a.actuator.name,
          }),
        ],
        { type: "application/json" }
      )
    );
  }
  if (kind === "csv") {
    const lines = ["category,item,source,salvage,cost_inr", ...state.bom.map((r) => `${r.cat},"${r.item}",${r.source},${r.salvage},${r.cost}`)];
    lines.push(`parameter,L_m,${state.L}`);
    lines.push(`parameter,m_kg,${state.m}`);
    lines.push(`parameter,tau_peak,${a.torque.tauPeak}`);
    download("j2g-bom.csv", new Blob([lines.join("\n")], { type: "text/csv" }));
  }
  if (kind === "md") {
    const md = report(a);
    download("j2g-analysis.md", new Blob([md], { type: "text/markdown" }));
  }
  if (kind === "programme") {
    const melt = meltEnergy(state.alloy, state.charge, state.etaF);
    const wind = windingModel(state);
    const closure = closureScore(state.checks);
    const md = programmeReport(state, {
      alloy: melt.alloy.name,
      kwh: melt.kwh,
      mmf: wind.mmf,
      computeName: COMPUTE_STACK[state.compute - 1].name,
      closure,
      rayRegime: regimeOf(RAY.massKg).name,
    });
    download("j2g-programme.md", new Blob([md], { type: "text/markdown" }));
  }
}

function report(a) {
  return `# Jugaad-to-Genesis node analysis

Classification: illustrative parameter study (Cat 4/6). Not a validated specification.

- Regime: ${a.regime.name} (${a.regime.band})
- L = ${state.L} m, m = ${state.m} kg, P = ${state.P} µm, V = ${state.V} V
- Peak torque: ${a.torque.tauPeak.toFixed(2)} N·m (gravity ${a.torque.tauG.toFixed(2)}, inertia ${a.torque.tauI.toFixed(2)})
- Specific cost model: ₹ ${a.cost.total.toFixed(0)} / kg
- Actuator class: ${a.actuator.name}
- Counterbalance energy reduction on sample lift: ${(a.energy.saved * 100).toFixed(0)}%
- ${closureStatement(state.m)}

Heuristic walls used by this laboratory: precision 1.2 kg, trough 10–150 kg, crane 150 kg.
`;
}

async function onImport(file) {
  const name = file.name.toLowerCase();
  const status = $("#importStatus");
  try {
    if (name.endsWith(".json")) {
      const data = JSON.parse(await file.text());
      const src = data.state || data;
      Object.assign(state, {
        L: Number(src.L ?? state.L),
        m: Number(src.m ?? state.m),
        alpha: Number(src.alpha ?? state.alpha),
        P: Number(src.P ?? state.P),
        V: Number(src.V ?? state.V),
        eta: Number(src.eta ?? state.eta),
        counterbalance: Number(src.counterbalance ?? state.counterbalance),
      });
      syncInputs();
      status.textContent = `Loaded node spec ${file.name}`;
      redraw();
      return;
    }
    let parsed;
    if (name.endsWith(".stl")) parsed = parseSTL(await file.arrayBuffer());
    else if (name.endsWith(".obj")) parsed = parseOBJ(await file.text());
    else throw new Error("Import JSON, STL, or OBJ");
    const THREE = await import("../vendor/three.module.js");
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(parsed.positions, 3));
    geo.computeVertexNormals();
    sceneApi.showImport(geo);
    status.textContent = `Previewing ${file.name} · ${parsed.count.toLocaleString("en-IN")} triangles`;
    document.querySelector('[data-panel="node"]').click();
  } catch (err) {
    status.textContent = err.message || "Import failed";
  }
}

function syncInputs() {
  $("#L").value = state.L;
  $("#m").value = state.m;
  $("#alpha").value = state.alpha;
  $("#P").value = state.P;
  $("#V").value = state.V;
  $("#eta").value = state.eta;
  $("#cb").value = state.counterbalance;
  $("#density").value = state.density;
  $("#skill").value = state.skill;
  $("#compute").value = state.compute;
}

function applyPreset(id) {
  const p = PRESETS.find((x) => x.id === id);
  if (!p) return;
  Object.assign(state, p);
  state.coupleMass = false;
  $("#couple").checked = false;
  syncInputs();
  redraw();
}

function drawSheet() {
  const c = $("#sheet");
  const ctx = c.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = c.getBoundingClientRect();
  c.width = rect.width * dpr;
  c.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const w = rect.width;
  const h = rect.height;
  ctx.fillStyle = "#e7e1d6";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#1c1915";
  ctx.lineWidth = 1.25;
  const L = state.L;
  const scale = Math.min((w - 80) / (L + 0.4), (h - 70) / 0.55);
  const x0 = 48;
  const y0 = h * 0.62;
  const beam = L * scale;
  ctx.strokeRect(x0, y0 - 18, 36, 36);
  ctx.beginPath();
  ctx.arc(x0 + 18, y0, 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeRect(x0 + 30, y0 - 8, beam, 16);
  ctx.strokeRect(x0 + 30 + beam, y0 - 14, 18, 28);
  ctx.fillStyle = "#1c1915";
  ctx.font = "12px IBM Plex Mono, monospace";
  ctx.fillText(`L = ${L.toFixed(2)} m`, x0 + 30, y0 - 18);
  ctx.fillText(`m = ${state.m.toFixed(1)} kg`, x0 + 30, y0 + 36);
  ctx.fillText("J2G-LINK · illustrative · mm shop drawing not to certified scale", 16, h - 16);
  ctx.strokeStyle = "#8a5a32";
  ctx.beginPath();
  ctx.moveTo(x0 + 30, y0 + 28);
  ctx.lineTo(x0 + 30 + beam, y0 + 28);
  ctx.stroke();
}

function renderProgramme() {
  state.alloy = $("#alloy").value;
  state.charge = Number($("#charge").value);
  state.etaF = Number($("#etaF").value);
  state.slots = Number($("#slots").value);
  state.turns = Number($("#turns").value);
  state.awg = Number($("#awg").value);
  state.amps = Number($("#amps").value);
  state.path = Number($("#path").value);
  $("#chargeLabel").textContent = state.charge;
  $("#etaFLabel").textContent = state.etaF.toFixed(2);
  $("#slotsLabel").textContent = state.slots;
  $("#turnsLabel").textContent = state.turns;
  $("#awgLabel").textContent = state.awg;
  $("#ampLabel").textContent = state.amps;
  $("#pathLabel").textContent = state.path;
  const melt = meltEnergy(state.alloy, state.charge, state.etaF);
  $("#foundryOut").innerHTML = [
    ["Alloy", melt.alloy.name],
    ["Pour", `${melt.alloy.pourC} °C`],
    ["Furnace", melt.alloy.furnace],
    ["Energy", `${melt.kwh.toFixed(2)} kWh`],
    ["In this box", melt.castableHere ? "Yes, with the stated furnace" : "No"],
  ]
    .map(([k, v]) => `<div class="kv"><span>${k}</span><strong>${v}</strong></div>`)
    .join("");
  const wind = windingModel(state);
  $("#windOut").innerHTML = [
    ["Mean copper", `${wind.length.toFixed(1)} m`],
    ["Resistance", `${wind.resistance.toFixed(2)} Ω`],
    ["MMF", `${wind.mmf.toFixed(0)} A-turns`],
    ["Copper loss", `${wind.copperLoss.toFixed(0)} W`],
    ["Fill heuristic", wind.fill.toFixed(2)],
  ]
    .map(([k, v]) => `<div class="kv"><span>${k}</span><strong>${v}</strong></div>`)
    .join("");
  const path = materialsPath(state.path);
  $("#pathOut").textContent = `${path.chain.join(" → ")}. Now: ${path.at}. ${path.blocked}`;
  const closure = closureScore(state.checks);
  $("#closureStage").textContent = `${closure.passed}/8 checks. Regime read: ${closure.stage}. Tool closure ${state.checks.tools ? "is" : "is not"} ticked, so Genesis is not claimed from a checklist alone.`;
  drawRay();
}

function drawRay() {
  const c = $("#rayView");
  if (!c) return;
  const ctx = c.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = c.getBoundingClientRect();
  const w = Math.max(rect.width, 320);
  const h = Math.max(rect.height, 280);
  c.width = w * dpr;
  c.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#10161c";
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w * 0.5, h * 0.55);
  ctx.fillStyle = "#c4b48a";
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.28);
  ctx.quadraticCurveTo(w * 0.42, -h * 0.05, 0, h * 0.22);
  ctx.quadraticCurveTo(-w * 0.42, -h * 0.05, 0, -h * 0.28);
  ctx.fill();
  ctx.fillStyle = "#8aa4c8";
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.ellipse(0, 20, 70, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#e7e1d6";
  ctx.font = "13px IBM Plex Mono, monospace";
  ctx.fillText(`Ray-Man planform · ${RAY.massKg} kg · ${RAY.payloadKg} kg payload · illustrative`, 16, 24);
  ctx.fillText(regimeOf(RAY.massKg).band, 16, 42);
}

const DOCS = [
  ["docs/ARCHITECTURE.md", "Architecture"],
  ["docs/PARAMETRIC-MODEL.md", "Parametric model"],
  ["docs/FOUNDRY-AND-WINDING.md", "Foundry and winding"],
  ["docs/COMPUTE-AND-LANGUAGE.md", "Compute and language"],
  ["docs/SOVEREIGNTY-AND-RAYMAN.md", "Sovereignty and Ray-Man"],
  ["docs/EVIDENCE-REGISTER.md", "Evidence"],
  ["docs/CAPABILITY-MATRIX.md", "Capability matrix"],
  ["docs/SIMULATIONS.md", "Simulations"],
  ["docs/PROVENANCE.md", "Provenance"],
];

function renderStaticProgramme() {
  $("#castTable").innerHTML = CAST_VS_MACHINE.map(([a, b]) => `<div class="kv"><span>${a}</span><strong>${b}</strong></div>`).join("");
  $("#stack").innerHTML = COMPUTE_STACK.map((s) => `<div class="kv"><span>${s.name}</span><strong>${s.keeps}</strong></div>`).join("");
  $("#conventional").textContent = "Always conventional: " + CONVENTIONAL_ALWAYS.join(", ") + ".";
  $("#script").innerHTML = Object.keys(SCRIPTS).map((k) => `<option>${k}</option>`).join("");
  $("#scriptOut").textContent = SCRIPTS.English;
  $("#ternary").innerHTML = TERNARY.map(([a, b]) => `<div class="kv"><span>${a}</span><strong>${b}</strong></div>`).join("");
  $("#tiers").innerHTML = `<table><thead><tr><th>Tier</th><th>Needs</th><th>Skills</th><th>Tools</th><th>Builds</th></tr></thead><tbody>${TIERS.map(
    (t) => `<tr><td>${t.tier}</td><td>${t.needs}</td><td>${t.skills}</td><td>${t.tools}</td><td>${t.builds}</td></tr>`
  ).join("")}</tbody></table>`;
  $("#checks").innerHTML = [
    ["structure", "Structure from local stock"],
    ["actuator", "Actuator wound or has a fallback"],
    ["drive", "Drive repairable locally"],
    ["controller", "Open controller fallback"],
    ["verification", "Verification script exists"],
    ["pack", "Second workshop can follow the pack"],
    ["handling", "Handling is local"],
    ["spares", "Spares inside the 72 h design threshold"],
    ["tools", "The tools that make the tools are local"],
  ]
    .map(
      ([k, label]) =>
        `<label class="checkrow"><input type="checkbox" data-check="${k}" ${state.checks[k] ? "checked" : ""}> ${label}</label>`
    )
    .join("");
  $("#lists").innerHTML = [
    ["Local", LOCAL_MUST],
    ["Import", SAFE_IMPORT],
    ["Reserve", RESERVES],
    ["Substitute", SUBSTITUTIONS.map((s) => s.join(" → "))],
  ]
    .map(([h, items]) => `<p><strong>${h}</strong><br>${items.join(" · ")}</p>`)
    .join("");
  $("#rayOut").innerHTML = [
    ["Mass", `${RAY.massKg} kg`],
    ["Payload", `${RAY.payloadKg} kg`],
    ["Estimate", `₹ ${RAY.costInr.toLocaleString("en-IN")}`],
    ["Environments", RAY.environments.join("; ")],
    ["Named as designed", RAY.designed.join("; ")],
    ["Still conceptual", RAY.conceptual.join("; ")],
    ["Reused", RAY.reused.join("; ")],
    ["Handling regime", regimeOf(RAY.massKg).name],
  ]
    .map(([k, v]) => `<div class="kv"><span>${k}</span><strong>${v}</strong></div>`)
    .join("");
  $("#evidence").innerHTML = `<table><thead><tr><th>Element</th><th>In the notes</th><th>Status here</th></tr></thead><tbody>${EVIDENCE.map(
    (r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`
  ).join("")}</tbody></table>`;
  const host = document.querySelector("#capability .split");
  if (host && !document.querySelector("#matrix")) {
    const card = document.createElement("div");
    card.className = "card";
    card.id = "matrix";
    card.innerHTML = `<h2>Stage questions</h2><p>${Object.values(STAGES).map((s) => `<strong>${s.name}.</strong> ${s.question} ${s.definition}`).join(" ")}</p><div class="table-wrap"><table><thead><tr><th>Dimension</th><th>Jugaad</th><th>Swaraj</th><th>Genesis</th></tr></thead><tbody>${CAPABILITY_MATRIX.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    host.appendChild(card);
  }
  $("#docList").innerHTML = DOCS.map(([href, name]) => `<button type="button" data-doc="${href}"><strong>${name}</strong><span>${href}</span></button>`).join("");
  $("#docList").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-doc]");
    if (btn) loadDoc(btn.dataset.doc);
  });
  loadDoc(DOCS[0][0]);
}

async function loadDoc(href) {
  const res = await fetch(href);
  const text = await res.text();
  $("#doc").innerHTML = markdown(text);
}

function markdown(src) {
  const lines = src.replace(/\r/g, "").split("\n");
  let html = "";
  let list = false;
  let table = false;
  const flushList = () => {
    if (list) {
      html += "</ul>";
      list = false;
    }
  };
  for (const line of lines) {
    if (line.startsWith("|")) {
      flushList();
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      if (cells.every((c) => /^[-: ]+$/.test(c))) continue;
      if (!table) {
        html += "<table>";
        table = true;
      }
      html += `<tr>${cells.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`;
      continue;
    }
    if (table) {
      html += "</table>";
      table = false;
    }
    if (line.startsWith("- ")) {
      if (!list) {
        html += "<ul>";
        list = true;
      }
      html += `<li>${inline(line.slice(2))}</li>`;
      continue;
    }
    flushList();
    if (line.startsWith("### ")) html += `<h3>${inline(line.slice(4))}</h3>`;
    else if (line.startsWith("## ")) html += `<h2>${inline(line.slice(3))}</h2>`;
    else if (line.startsWith("# ")) html += `<h1>${inline(line.slice(2))}</h1>`;
    else if (line.trim() === "") html += "";
    else html += `<p>${inline(line)}</p>`;
  }
  flushList();
  if (table) html += "</table>";
  return html;
}

function inline(text) {
  return text
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function plotSeries(canvas, series, xKey) {
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(rect.width, 320);
  const h = Math.max(rect.height, 180);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#10141b";
  ctx.fillRect(0, 0, w, h);
  const pad = 28;
  series.forEach((s) => {
    const xs = s.pts.map((p) => p[xKey]);
    const ys = s.pts.map((p) => p.y);
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    const y0 = Math.min(0, ...ys);
    const y1 = Math.max(...ys, 1);
    ctx.beginPath();
    s.pts.forEach((p, i) => {
      const x = pad + ((p[xKey] - x0) / (x1 - x0 || 1)) * (w - pad * 2);
      const y = h - pad - ((p.y - y0) / (y1 - y0 || 1)) * (h - pad * 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 1.8;
    ctx.stroke();
  });
}

function runWorkflow() {
  const actuator = $("#actuator").value;
  const misalignMm = Number($("#misalign").value);
  const shockK = Number($("#shockK").value);
  const lifterC = Number($("#lifterC").value);
  $("#misLabel").textContent = misalignMm.toFixed(1);
  $("#skLabel").textContent = shockK;
  $("#lcLabel").textContent = lifterC;
  const joint = simulateJoint(state, { actuator, misalignMm, shockK, lifterC, seconds: 8 });
  plotSeries($("#chartJoint"), [
    { color: "#f0b429", pts: joint.trace.map((p) => ({ t: p.t, y: p.theta })) },
    { color: "#7dcea0", pts: joint.trace.map((p) => ({ t: p.t, y: p.target })) },
    { color: "#e07a5f", pts: joint.trace.map((p) => ({ t: p.t, y: p.temp / 80 })) },
  ], "t");
  $("#jointOut").innerHTML = [
    ["Actuator", joint.act],
    ["Chain", `${joint.chain.stages} × ${joint.chain.ratio.toFixed(1)} η ${joint.chain.eta.toFixed(2)}`],
    ["Backlash", `${joint.chain.backlashDeg.toFixed(1)}°`],
    ["Peak temp", `${joint.peakTemp.toFixed(0)} °C`],
    ["Cutout", joint.cut ? "Tripped" : "Held"],
    ["Wear", joint.chain.worn ? "Past heuristic life" : `${Math.round(joint.chain.wearLife)} cycles`],
  ].map(([k, v]) => `<div class="kv"><span>${k}</span><strong>${v}</strong></div>`).join("");
  const struct = structureSweep(state);
  plotSeries($("#chartStruct"), [{ color: "#8aa4c8", pts: struct.map((r) => ({ t: r.m, y: r.sigma })) }], "t");
  $("#structOut").innerHTML = struct.map((r) => `<div class="kv"><span>${r.m} kg</span><strong>${r.sigma.toFixed(0)} MPa · brg ${r.bearing.toFixed(0)} N${r.yield ? " · over screen" : ""}</strong></div>`).join("");
  const wind = windingSim(state);
  plotSeries($("#chartWind"), [
    { color: "#d4a574", pts: wind.curve.map((p) => ({ t: p.rpm, y: p.torque })) },
    { color: "#e07a5f", pts: wind.trace.map((p) => ({ t: p.s * 10, y: p.temp / 20 })) },
  ], "t");
  $("#windSimOut").innerHTML = [["Fill", wind.fill.toFixed(2)], ["R", `${wind.R.toFixed(2)} Ω`], ["Loss", `${wind.loss.toFixed(0)} W`], ["End temp", `${wind.trace.at(-1).temp.toFixed(0)} °C`]].map(([k, v]) => `<div class="kv"><span>${k}</span><strong>${v}</strong></div>`).join("");
  const foundry = foundrySim({ alloy: state.alloy, mass: state.charge });
  const cam = camSim({ lengthMm: state.L * 1000 });
  plotSeries($("#chartCam"), [{ color: "#7dcea0", pts: cam.layers.map((l) => ({ t: l.i, y: l.extrude })) }], "t");
  $("#camOut").innerHTML = [
    ["Fill", `${foundry.fillS.toFixed(1)} s`],
    ["Solidification", `${foundry.solidS.toFixed(0)} s`],
    ["Shrink", `${foundry.shrinkMm.toFixed(2)} mm`],
    ["Cast tol.", `${foundry.tolMm.toFixed(2)} mm`],
    ["Refused", foundry.refused ? "Yes" : "No"],
    ["CAM time", `${cam.timeS.toFixed(0)} s · ${cam.passes} passes`],
    ["Print layers", `${cam.layers.length} · ${cam.printTime.toFixed(0)} s shown`],
  ].map(([k, v]) => `<div class="kv"><span>${k}</span><strong>${v}</strong></div>`).join("");
  const arm = simulateArm(state);
  plotSeries($("#chartArm"), [
    { color: "#f0b429", pts: arm.trace.map((p) => ({ t: p.t, y: p.x })) },
    { color: "#8aa4c8", pts: arm.trace.map((p) => ({ t: p.t, y: p.y })) },
  ], "t");
  const ray = simulateRay();
  plotSeries($("#chartRaySim"), [
    { color: "#d4a574", pts: ray.air.map((p) => ({ t: p.i, y: p.h })) },
    { color: "#7dcea0", pts: ray.surface.map((p) => ({ t: p.i, y: p.vs * 4 })) },
    { color: "#8aa4c8", pts: ray.sub.map((p) => ({ t: p.i, y: p.vu * 10 })) },
  ], "t");
  $("#raySimOut").innerHTML = [
    ["Air end", `${ray.air.at(-1).v.toFixed(1)} m/s · h ${ray.air.at(-1).h.toFixed(1)}`],
    ["Surface", `${ray.surface.at(-1).vs.toFixed(1)} m/s · Fr ${ray.surface.at(-1).fr.toFixed(2)}`],
    ["Subsurface", `${ray.sub.at(-1).vu.toFixed(2)} m/s`],
  ].map(([k, v]) => `<div class="kv"><span>${k}</span><strong>${v}</strong></div>`).join("");
  if (joint.trace.length) theta = joint.trace[joint.trace.length - 1].theta;
  $("#simStatus").textContent = "Run finished. Joint trace drives the last viewport angle. Structural screen is not a code check. Ray-Man is a point-mass regime model.";
}

function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const target = 0.35 + Math.sin(now / 1400) * 0.55;
  theta += (target - theta) * Math.min(1, dt * 2.2);
  if (sceneApi) sceneApi.update(state, theta);
  requestAnimationFrame(tick);
}

function initNav() {
  $$(".nav button").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".nav button").forEach((b) => b.classList.remove("on"));
      btn.classList.add("on");
      $$(".panel").forEach((p) => p.classList.toggle("on", p.id === btn.dataset.panel));
      if (btn.dataset.panel === "node") {
        sceneApi?.resize();
        drawSheet();
      }
      paints.forEach((p) => p());
      if (btn.dataset.panel === "workflow") runWorkflow();
      if (btn.dataset.panel === "notes") loadDoc(DOCS[0][0]);
    });
  });
}

async function main() {
  $("#year").textContent = "2026";
  renderGuide();
  renderRegimes();
  $("#presets").innerHTML = PRESETS.map(
    (p) => `<button type="button" data-preset="${p.id}"><strong>${p.name}</strong><span>${p.note}</span></button>`
  ).join("");
  $("#presets").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-preset]");
    if (btn) applyPreset(btn.dataset.preset);
  });
  document.body.addEventListener("input", (e) => {
    if (e.target.dataset.bom != null) {
      state.bom[Number(e.target.dataset.bom)].cost = Number(e.target.value);
      renderBom();
      return;
    }
    redraw();
    drawSheet();
  });
  $("#couple").addEventListener("change", () => redraw());
  $("#labour").addEventListener("change", (e) => {
    state.priceLabour = e.target.checked;
    renderBom();
  });
  $("#exports").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-export]");
    if (btn) exportOf(btn.dataset.export);
  });
  $("#clearImport").addEventListener("click", () => {
    sceneApi?.clearImport();
    $("#importStatus").textContent = "Parametric node restored";
  });
  const drop = $("#drop");
  drop.addEventListener("dragover", (e) => {
    e.preventDefault();
    drop.classList.add("hot");
  });
  drop.addEventListener("dragleave", () => drop.classList.remove("hot"));
  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    drop.classList.remove("hot");
    if (e.dataTransfer.files[0]) onImport(e.dataTransfer.files[0]);
  });
  $("#file").addEventListener("change", (e) => {
    if (e.target.files[0]) onImport(e.target.files[0]);
  });
  $("#script").addEventListener("change", (e) => {
    $("#scriptOut").textContent = SCRIPTS[e.target.value];
  });
  $("#checks").addEventListener("change", (e) => {
    const key = e.target.dataset.check;
    if (!key) return;
    state.checks[key] = e.target.checked;
    renderProgramme();
  });
  $("#runSim").addEventListener("click", () => runWorkflow());
  renderStaticProgramme();
  initNav();
  bindCharts();
  redraw();
  drawSheet();
  window.addEventListener("resize", () => {
    paints.forEach((p) => p());
    drawSheet();
    sceneApi?.resize();
  });
  try {
    sceneApi = await createScene($("#view"));
    sceneApi.update(state, theta);
  } catch (err) {
    $("#viewFallback").hidden = false;
    $("#viewFallback").textContent = "3D viewport unavailable. Charts and exchange still run. " + err.message;
  }
  requestAnimationFrame(tick);
}

main();
