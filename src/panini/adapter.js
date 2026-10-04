/**
 * PANINIphy adapter boundary and PANINIq control boundary.
 *
 * PANINIphy v1.0 Physical IR requires ir_id, version, target.
 * This adapter emits that IR. It does not claim the PANINIphy solver consumes the full J2G model.
 *
 * PANINIq 0.3 exposes a software pipeline and command tokens COMMIT / PLAN / IDLE.
 * Mapping a sensor event to those tokens is a computational-control boundary.
 * It is not a physical neuromorphic realization.
 */

import { EngineeringError } from "../core/errors.js";

function digestOf(value) {
  const text = JSON.stringify(value);
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function toPhysicalIR(node, extras = {}) {
  if (!node || !(node.L > 0)) throw new EngineeringError("PANINI", "node length required for Physical IR");
  const ir = {
    ir_id: extras.ir_id || `j2g-${node.m}kg-${node.L}m`,
    version: "1.0",
    target: "j2g-parametric-node",
    objects: [
      { id: "link", type: "rigid_link", length_m: node.L, mass_kg: node.m },
    ],
    components: extras.components || [{ id: "joint-1", type: "revolute" }],
    materials: extras.materials || [],
    interfaces: [{ id: "actuator-command", type: "torque" }],
    constraints: [
      { id: "torque", quantity: "N*m", value: node.tau },
      { id: "precision", quantity: "m", value: node.P },
    ],
    processes: extras.processes || [],
    actuators: extras.actuators || [{ id: "actuator", voltage_V: node.V }],
    sensors: extras.sensors || [{ id: "angle", quantity: "rad" }],
    joints: [{ id: "j1", type: "revolute", parent: "base", child: "link" }],
    package: null,
    unresolved: [
      "PANINIphy parts resolver is not invoked",
      "no physical verification artifact",
      "multi-body dynamics not closed",
    ],
    evidence: "C4",
    implementation: "S3",
    physicalValidation: "S0",
  };
  const digest = digestOf({ ...ir, digest: undefined });
  ir.digest = digest;
  return ir;
}

export function verificationChecklist(ir) {
  return {
    ir_id: ir.ir_id,
    checks: [
      { id: "schema-required", pass: Boolean(ir.ir_id && ir.version && ir.target) },
      { id: "torque-constraint", pass: ir.constraints.some((c) => c.id === "torque") },
      { id: "unresolved-explicit", pass: ir.unresolved.length > 0 },
    ],
    note: "Adapter verification only. Not a PANINIphy execution run.",
    physicalValidation: "S0",
  };
}

export function eventToDecision(event) {
  if (!event || typeof event.type !== "string") {
    throw new EngineeringError("PANINIQ", "sensor event requires a type");
  }
  const state = {
    mode: "pedler-boundary",
    thermal: event.temperatureC ?? null,
    error: event.error ?? 0,
    note: "PEDLER-like software state. Not a physical substrate.",
  };
  let command = "IDLE";
  if (event.type === "track" && Math.abs(state.error) > (event.deadband ?? 0.02)) command = "PLAN";
  if (event.type === "commit" && (event.temperatureC ?? 0) < (event.limitC ?? 80)) command = "COMMIT";
  if ((event.temperatureC ?? 0) >= (event.limitC ?? 80)) command = "IDLE";
  const actuator = {
    enable: command !== "IDLE",
    voltage: command === "IDLE" ? 0 : event.voltage ?? 0,
    command,
  };
  return {
    event,
    state,
    command,
    actuator,
    paniniqTokens: ["COMMIT", "PLAN", "IDLE"],
    implementation: "S3",
    physicalValidation: "S0",
    claim: "Software control boundary only. Not a neuromorphic or quantum hardware realization.",
  };
}
