/**
 * Static audit for numeric literals in the engineering source tree.
 * Unclassified literals fail the gate.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const allowPath = path.join(root, "verification/number-allowlist.json");
const allow = JSON.parse(fs.readFileSync(allowPath, "utf8"));
const allowed = new Set(allow.literals.map(String));

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name.endsWith(".js")) acc.push(full);
  }
  return acc;
}

const findings = [];
const unexplained = [];
for (const file of walk(path.join(root, "src"))) {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  lines.forEach((line, index) => {
    if (line.trim().startsWith("//") || line.trim().startsWith("*")) return;
    const matches = line.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi) || [];
    for (const token of matches) {
      const rel = path.relative(root, file);
      const record = { file: rel, line: index + 1, number: token, context: line.trim().slice(0, 120) };
      findings.push(record);
      if (!allowed.has(token) && !allowed.has(token.toLowerCase())) unexplained.push(record);
    }
  });
}

const outDir = path.join(root, "docs/generated");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "magic-numbers.json"), JSON.stringify({ findings, unexplained }, null, 2));
if (unexplained.length) {
  console.error(JSON.stringify({ ok: false, unexplained: unexplained.slice(0, 20), count: unexplained.length }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, literals: findings.length }, null, 2));
