/**
 * JUGAAD → GENESIS V1.0 public engine API.
 * Importing this module registers equations.
 */

export * from "./core/errors.js";
export * from "./core/units.js";
export * from "./core/provenance.js";
export * from "./core/registry.js";
export * from "./core/parameters.js";
export * from "./math/numerics.js";
export * from "./physics/mechanics.js";
export * from "./actuators/actuator.js";
export * from "./transmission/transmission.js";
export * from "./structures/structures.js";
export * from "./electrical/electrical.js";
export * from "./thermal/lumped.js";
export * from "./materials/registry.js";
export * from "./manufacturing/manufacturing.js";
export * from "./economics/cost.js";
export * from "./sovereignty/sovereignty.js";
export * from "./geometry/closure.js";
export * from "./panini/adapter.js";
export * from "./experiments/experiments.js";
export * from "./verification/cases.js";
export * from "./verification/traceability.js";
export * from "./verification/contracts.js";
export * from "./reports/report.js";

export const VERSION = "1.0.0";
export const NAME = "JUGAAD → GENESIS V1.0";
