/**
 * Manufacturing feasibility is a computed result from geometry, material, and process.
 * Unsupported processes fail explicitly.
 */

import { EngineeringError } from "../core/errors.js";
import { material } from "../materials/registry.js";

export const PROCESSES = {
  saw: { id: "saw", toleranceM: 1e-3, tools: ["hacksaw", "angle grinder"], skill: "basic" },
  weld: { id: "weld", toleranceM: 2e-3, tools: ["welder", "clamps"], skill: "welder" },
  machine: { id: "machine", toleranceM: 5e-5, tools: ["lathe or mill"], skill: "machinist" },
  drill: { id: "drill", toleranceM: 2e-4, tools: ["drill"], skill: "basic" },
  cast: { id: "cast", toleranceM: 1.5e-3, tools: ["furnace", "pattern", "flask"], skill: "foundry" },
  print: { id: "print", toleranceM: 2e-4, tools: ["FDM printer"], skill: "operator" },
  wind: { id: "wind", toleranceM: 5e-4, tools: ["winder", "coil form"], skill: "winder" },
  draw: { id: "draw", toleranceM: 1e-4, tools: ["draw bench"], skill: "specialist" },
  solder: { id: "solder", toleranceM: 1e-3, tools: ["iron"], skill: "basic" },
};

export function processById(id) {
  const p = PROCESSES[id];
  if (!p) throw new EngineeringError("PROCESS", `unsupported manufacturing process ${id}`);
  return p;
}

export function partFeasibility({
  name,
  materialId,
  processId,
  toleranceM,
  massKg,
  lengthM,
  handlingLimitKg = 25,
}) {
  const mat = material(materialId);
  const proc = processById(processId);
  if (!mat.processes.includes(processId)) {
    return {
      feasible: false,
      reasons: [`${mat.id} is not registered for process ${processId}`],
      material: mat.id,
      process: proc.id,
      evidence: "C4",
      physicalValidation: "S0",
    };
  }
  const reasons = [];
  if (toleranceM < proc.toleranceM) {
    reasons.push(`tolerance ${toleranceM} m is tighter than ${proc.id} capability ${proc.toleranceM} m`);
  }
  if (massKg > handlingLimitKg) {
    reasons.push(`mass ${massKg} kg exceeds configured manual handling limit ${handlingLimitKg} kg`);
  }
  if (!(lengthM > 0)) reasons.push("length must be > 0");
  return {
    name,
    feasible: reasons.length === 0,
    reasons,
    material: mat.id,
    process: proc.id,
    tools: proc.tools,
    skill: proc.skill,
    massKg,
    toleranceM,
    evidence: "C4",
    physicalValidation: "S0",
    implementation: "S4",
  };
}
