/**
 * Machine-readable equation registry.
 * Every implemented equation is recorded with id, definition, units, assumptions, status.
 */

const equations = [];

export function registerEquation(eq) {
  const required = ["id", "name", "latex", "output", "implementation", "evidence", "status"];
  for (const key of required) {
    if (!eq[key]) throw new Error(`equation missing ${key}`);
  }
  const existing = equations.find((e) => e.id === eq.id);
  if (existing) return existing;
  const record = {
    assumptions: [],
    validity: "",
    variables: {},
    module: "",
    physicalValidation: "S0",
    ...eq,
  };
  equations.push(record);
  return record;
}

export function listEquations() {
  return equations.slice();
}

export function equationById(id) {
  const eq = equations.find((e) => e.id === id);
  if (!eq) throw new Error(`unknown equation ${id}`);
  return eq;
}

export function attachVerification(id, meta) {
  const eq = equationById(id);
  Object.assign(eq, meta);
  eq.verificationAttached = true;
  return eq;
}

export function resetRegistry() {
  equations.length = 0;
}
