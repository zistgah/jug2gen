import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const node = process.execPath;

function run(args) {
  const result = spawnSync(node, args, { cwd: root, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

const steps = [];
function gate(name, args) {
  const result = run(args);
  steps.push({ name, status: result.status });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    console.error(`verify:full failed at ${name}`);
    process.exit(result.status || 1);
  }
}

gate("matrix", ["cli/generate-matrix.mjs"]);
gate("magic-audit", ["cli/magic-audit.mjs"]);
gate("unit", ["tests/model.test.mjs"]);
gate("engine", ["--test", "tests/engine.test.mjs", "tests/domain-matrix.test.mjs", "tests/numerical-convergence.test.mjs", "tests/dependency-graph.test.mjs"]);
gate("mutation", ["cli/mutate.mjs"]);
gate("coverage", ["--test", "--experimental-test-coverage", "--test-reporter=spec", "tests/engine.test.mjs", "tests/domain-matrix.test.mjs", "tests/numerical-convergence.test.mjs", "tests/dependency-graph.test.mjs"]);

const mutation = JSON.parse(fs.readFileSync(path.join(root, "docs/generated/mutation-report.json"), "utf8"));
const matrix = JSON.parse(fs.readFileSync(path.join(root, "docs/generated/test-matrix.json"), "utf8"));
const report = {
  pass: "V1.0-mathematical-closure",
  physicalValidation: "S0",
  mathematicalModel: "S5",
  softwareImplementation: "S4",
  seed: matrix.seed,
  propertyCasesPerFamily: matrix.casesPerProperty,
  matrixRows: matrix.rows.length,
  mutationScore: mutation.score,
  failedMutants: mutation.results.filter((row) => !row.killed),
  claims: [
    "The J2G mathematical core is parameterized rather than hard-coded to the reference cases.",
    "The governing analytical equations are executable and independently tested.",
    "The mathematical core is tested across declared domains, boundaries and failure conditions.",
    "The software model is computationally verified.",
  ],
  notClaimed: ["physically validated", "Genesis achieved"],
  steps,
};
fs.writeFileSync(path.join(root, "docs/generated/verification-report.json"), JSON.stringify(report, null, 2));
fs.writeFileSync(path.join(root, "docs/generated/verification-report.md"), [
  "# V1.0 mathematical closure",
  "",
  "Physical validation remains S0. This report is computational verification only.",
  "",
  `- Seed: ${report.seed}`,
  `- Property cases per family: ${report.propertyCasesPerFamily}`,
  `- Matrix rows: ${report.matrixRows}`,
  `- Mutation score: ${report.mutationScore}`,
  `- Failed mutants: ${report.failedMutants.length}`,
  "",
  "## Claims that this gate supports",
  "",
  ...report.claims.map((claim) => `- ${claim}`),
  "",
  "## Claims this gate does not support",
  "",
  ...report.notClaimed.map((claim) => `- ${claim}`),
  "",
].join("\n"));
console.log(JSON.stringify({ ok: true, mutationScore: report.mutationScore }, null, 2));
