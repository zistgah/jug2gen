/**
 * Engineering report generator. Separates model, computation, numerical check, prediction, and physical validation.
 */

import { listEquations } from "../core/registry.js";
import { TRACEABILITY, CLAIMS, ASSUMPTIONS, dependencyGraph } from "../verification/traceability.js";
import { referenceCorpus, auditPosterTorque } from "../verification/cases.js";
import { reproductionAssessment, genesisAssessment } from "../sovereignty/sovereignty.js";

export function engineeringReport(analysis) {
  const lines = [];
  lines.push("# JUGAAD → GENESIS V1.0 engineering report");
  lines.push("");
  lines.push("This report separates theoretical model, computational implementation, numerical verification, engineering prediction, and physical validation.");
  lines.push("");
  lines.push("## Theoretical model");
  lines.push("");
  lines.push("Canonical node N = <L, m, τ, P, V, E>. Single-link torque τ = τ_g + τ_I + τ_f + τ_ext, with τ_g = m g λ L and I = m L² / 3 for a uniform rod.");
  lines.push("");
  lines.push("## Computational implementation");
  lines.push("");
  lines.push(`Equations registered: ${listEquations().length}.`);
  lines.push("");
  lines.push("## Numerical verification");
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(analysis.analytical, null, 2));
  lines.push("```");
  lines.push("");
  lines.push("## Engineering prediction");
  lines.push("");
  lines.push("Reference cases A–E are model predictions. They are not measurements.");
  lines.push("");
  lines.push("## Physical validation");
  lines.push("");
  lines.push("No physical validation is claimed. Every physicalValidation field in this release is S0 unless a future campaign attaches measurements.");
  lines.push("");
  lines.push("## Poster torque audit");
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(analysis.poster, null, 2));
  lines.push("```");
  return lines.join("\n");
}

export function specificationDocument() {
  return `# JUGAAD → SWARAJ → GENESIS V1.0 specification

Status: computational engineering laboratory. Not a physical validation report.

## 1. Theoretical model

The fundamental object is a parametric technological node

N = ⟨L, m, τ, P, V, E⟩

with L in m, m in kg, τ in N·m, P in m, V in V, and E an energy/efficiency/environment descriptor.

The single-link spine is

geometry → mass → inertia → loads → torque → actuator → transmission → structure → electrical → thermal → manufacturing → cost → verification.

Similarity scaling m ∝ L³, τ_g ∝ L⁴, τ_I ∝ L⁵ is valid only inside the geometric_similarity model.

## 2. Computational implementation

JavaScript ESM modules under src/ implement the equations in the registry. The existing laboratory UI in js/ is preserved. g is configurable and defaults to 9.80665 m/s². Units are SI in the engine. Display conversions are explicit.

## 3. Numerical verification

The analytical reference m = 50 kg, L = 1 m, λ = 0.5, α = 1 rad/s², g = 9.80665 m/s² is tested against the closed form. Invalid inputs throw EngineeringError. They do not return NaN.

## 4. Engineering prediction

Cases A–E, regime bands, cost models, and the 72 h reproduction paths are predictions or hypotheses. Evidence tags are C3–C6 as recorded in the claim register.

## 5. Physical validation

None in V1.0. A software representation is not a measurement. A PANINIphy IR document is not a built machine. A PANINIq command token is not a neuromorphic device. Genesis is not claimed.

## Unsupported in V1.0

- complete multi-body solver
- fatigue life solver
- SRM phase solver
- physical calibration campaign
- certified CAD
- PANINIphy parts resolution execution
`;
}

export function auditDocument(poster) {
  return `# V1.0 audit

## Existing laboratory

Existing tests in tests/model.test.mjs were run before modification and passed. The UI torque path in js/model.js is unchanged: τ = m g L/2 + (1/3) m L² α + k_f (τ_g + τ_I) with k_f = 0.04 and g = 9.80665. For the Swaraj preset α = 1.2 this remains about 275.8 N·m.

## 612 N·m figure

${poster.conclusion}

Hypotheses examined are stored by \`auditPosterTorque\`. None is promoted to a fact. The canonical model is the reproducible one.

## Evidence

No C6 number was promoted to a measurement. Regime boundaries remain configurable. The 70% energy target remains C5/C6. The 72 h criterion remains C5.

## Integration

PANINIphy: adapter emits Physical IR with required ir_id, version, target, and an explicit unresolved list. The upstream solver is not invoked.

PANINIq: sensor event maps to COMMIT / PLAN / IDLE, the command vocabulary of paniniq-js. This is a software boundary.

## Acceptance

See CHANGELOG-V1.0.md. Physical validation remains S0 throughout.
`;
}

export function changelog() {
  return `# CHANGELOG, V1.0

## Added

- Executable SI mechanics, transmission, structure, electrical, thermal, cost, uncertainty, and sensitivity modules.
- Equation registry, claim register, assumption register, traceability matrix, dependency graph.
- Analytical reference case and model cases A–E.
- Geometry closure iteration and fabrication representation.
- Manufacturing feasibility check.
- PANINIphy Physical IR adapter and PANINIq command boundary.
- Experiment schema and affine calibration interface.
- npm scripts: test, verify, analyze, report, sweep, geometry.

## Preserved

- Existing js/ laboratory, samples, and tests/model.test.mjs numerical behaviour.

## Not claimed

- Physical validation.
- Multi-body solver.
- Fatigue solver.
- Genesis closure.
- Reproduction within 72 h as a demonstrated fact.
`;
}

export function bundle() {
  const corpus = referenceCorpus();
  const poster = auditPosterTorque(612);
  return {
    equations: listEquations(),
    traceability: TRACEABILITY,
    claims: CLAIMS,
    assumptions: ASSUMPTIONS,
    graph: dependencyGraph(),
    corpus,
    poster,
    sovereignty: reproductionAssessment(),
    genesis: genesisAssessment(["raw_material", "component"]),
    report: engineeringReport({ analytical: corpus.analytical, poster }),
    specification: specificationDocument(),
    audit: auditDocument(poster),
    changelog: changelog(),
  };
}
