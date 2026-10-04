/**
 * 72-hour sovereignty paths and Genesis capability closure.
 * T_reproduce ≤ 72 h is a strategic criterion, not a law.
 * Possessing a CNC is not Genesis.
 */

import { PROJECT_HYPOTHESES } from "../core/provenance.js";

export const REPLACEMENT_PATHS = [
  {
    component: "roller chain",
    failure: "elongation or broken link",
    material: "motorcycle chain",
    tools: ["chain breaker", "spanner"],
    skills: ["mechanic"],
    hours: 2,
    local: true,
    evidence: "C4",
  },
  {
    component: "wiper motor",
    failure: "brush or thermal cutout",
    material: "salvaged automotive wiper motor",
    tools: ["spanner", "soldering iron"],
    skills: ["mechanic", "basic electrical"],
    hours: 6,
    local: true,
    evidence: "C4",
  },
  {
    component: "pillow block",
    failure: "seized bearing",
    material: "replacement bearing or carved bush",
    tools: ["puller", "press or hammer"],
    skills: ["mechanic"],
    hours: 4,
    local: true,
    evidence: "C4",
  },
  {
    component: "structural link",
    failure: "bent arm",
    material: "scrap steel section",
    tools: ["hacksaw", "welder", "square"],
    skills: ["welder"],
    hours: 16,
    local: true,
    evidence: "C4",
  },
  {
    component: "motor driver",
    failure: "MOSFET failure",
    material: "replacement MOSFET module",
    tools: ["soldering iron", "multimeter"],
    skills: ["electronics"],
    hours: 5,
    local: false,
    evidence: "C6",
  },
  {
    component: "encoder",
    failure: "lost counts",
    material: "salvaged position sensor or printed index",
    tools: ["soldering iron"],
    skills: ["electronics"],
    hours: 8,
    local: false,
    evidence: "C6",
  },
];

export function reproductionAssessment(paths = REPLACEMENT_PATHS, criterionHours = PROJECT_HYPOTHESES.reproduceHoursCriterion.value) {
  const rows = paths.map((path) => ({
    ...path,
    meetsCriterion: path.hours <= criterionHours,
    physicalValidation: "S0",
  }));
  const totalHours = rows.reduce((s, r) => s + r.hours, 0);
  return {
    criterionHours,
    criterionEvidence: "C5",
    rows,
    totalSequentialHours: totalHours,
    allWithinCriterion: rows.every((r) => r.meetsCriterion),
    note: "Hours are estimates for a proposed path, not measured reproduction trials.",
    physicalValidation: "S0",
  };
}

export const GENESIS_LADDER = [
  { id: "raw_material", name: "Raw material identified", closes: false },
  { id: "component", name: "Component can be fabricated", closes: false },
  { id: "machine", name: "Machine can be assembled", closes: false },
  { id: "machine_tool", name: "A machine tool used by the machine can itself be maintained", closes: false },
  { id: "capability", name: "Manufacturing capability is locally reproducible", closes: false },
  { id: "next_machine", name: "Capability produces the next machine", closes: true },
];

export function genesisAssessment(achievedIds) {
  const achieved = new Set(achievedIds);
  const ladder = GENESIS_LADDER.map((step) => ({
    ...step,
    achieved: achieved.has(step.id),
    evidence: "C4",
    physicalValidation: "S0",
  }));
  const hasCnc = achieved.has("has_cnc");
  return {
    ladder,
    closed: ladder.every((s) => s.achieved),
    hasCncIsGenesis: false,
    note: hasCnc
      ? "A CNC flag is present. Possession of a CNC is not classified as Genesis."
      : "Genesis requires evidence that the system can reproduce increasingly important means of production. V1.0 does not claim that closure.",
    implementation: "S3",
    physicalValidation: "S0",
  };
}
