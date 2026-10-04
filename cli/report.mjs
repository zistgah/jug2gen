import { mkdirSync, writeFileSync } from "node:fs";
import { bundle } from "../src/index.js";

const out = new URL("../docs/generated/", import.meta.url);
mkdirSync(out, { recursive: true });
const data = bundle();
writeFileSync(new URL("equation-registry.json", out), JSON.stringify(data.equations, null, 2));
writeFileSync(new URL("traceability.json", out), JSON.stringify(data.traceability, null, 2));
writeFileSync(new URL("claims.json", out), JSON.stringify(data.claims, null, 2));
writeFileSync(new URL("assumptions.json", out), JSON.stringify(data.assumptions, null, 2));
writeFileSync(new URL("dependency-graph.json", out), JSON.stringify(data.graph, null, 2));
writeFileSync(new URL("reference-corpus.json", out), JSON.stringify(data.corpus, null, 2));
writeFileSync(new URL("poster-audit.json", out), JSON.stringify(data.poster, null, 2));
writeFileSync(new URL("engineering-report.md", out), data.report);
writeFileSync(new URL("../V1.0-SPECIFICATION.md", out), data.specification);
writeFileSync(new URL("../../V1.0-AUDIT.md", out), data.audit);
writeFileSync(new URL("../../CHANGELOG-V1.0.md", out), data.changelog);
console.log("wrote docs/generated, V1.0-SPECIFICATION.md, V1.0-AUDIT.md, CHANGELOG-V1.0.md");
