#!/usr/bin/env bash
# ops/verify.sh: the gate of Jugaad to Genesis. Runs its tests and verifier, and checks attribution and release metadata.
# © 1993–2026 Abhishek Choudhary. All rights reserved. AyeAI.
# SPDX-License-Identifier: GPL-3.0-or-later
set -uo pipefail
cd "$(dirname "$0")/.."
pass=0; fail=0
r() { if [ "$2" = ok ]; then printf '  PASS     %s  %s\n' "$1" "$3"; pass=$((pass+1)); else printf '  FAIL     %s  %s\n           %s\n' "$1" "$3" "$4"; fail=$((fail+1)); fi; }
echo "Jugaad to Genesis: contract verification"
if command -v npm >/dev/null 2>&1; then out="$(npm test 2>&1)"; rc=$?
elif command -v node >/dev/null 2>&1; then out="$(sh -c "$(node -p 'require("./package.json").scripts.test')" 2>&1)"; rc=$?
else out="node is not installed. Next: sudo apt install -y nodejs"; rc=127; fi
detail="$(printf '%s' "$out" | grep -m3 -E 'not ok|fail [1-9]|Error|not found' || true)"; [ -n "$detail" ] || detail="$(printf '%s' "$out" | tail -n 3)"
[ "$rc" -eq 0 ] && r J01 ok "the test suite passes" || r J01 no "the test suite passes" "$detail"
v="$(node cli/verify.mjs 2>&1)"
printf '%s' "$v" | grep -q '"ok": true' && printf '%s' "$v" | grep -q '"physicalValidation": "S0"' && r J02 ok "the verifier is ok and states physical validation S0" || r J02 no "the verifier is ok and states physical validation S0" "$(printf '%s' "$v" | tail -3)"
[ -s verification/number-allowlist.json ] && r J03 ok "the number allowlist is present" || r J03 no "the number allowlist is present" "verification/number-allowlist.json is missing"
bad=""
grep -q "affiliation: AyeAI" CITATION.cff || bad="$bad CITATION.cff"
python3 -c 'import json,sys; m=json.load(open("misty.json")); sys.exit(0 if all(c.get("affiliation")=="AyeAI" for c in m["creators"]) else 1)' || bad="$bad misty.json"
grep -rIl -i "independent researcher" --exclude-dir=vendor --exclude-dir=.git --exclude=verify.sh . >/dev/null 2>&1 && bad="$bad independent-researcher"
[ -z "$bad" ] && r J04 ok "the author is named with AyeAI as the only affiliation" || r J04 no "the author is named with AyeAI as the only affiliation" "check:$bad"
grep -q "© 1993–2026 Abhishek Choudhary. All rights reserved. AyeAI." README.md && r J05 ok "README.md carries the copyright line" || r J05 no "README.md carries the copyright line" "add it under the title"
m="$(python3 - <<'PY'
import json, re
p=json.load(open("package.json")); m=json.load(open("misty.json")); c=open("CITATION.cff",encoding="utf-8").read()
v=re.search(r"(?m)^version:\s*(\S+)", c).group(1); t=re.search(r'(?m)^title:\s*"?(.*?)"?$', c).group(1)
lic=re.search(r"(?m)^license:\s*(\S+)", c).group(1); L=open("LICENSE").read()
errs=[]
if not (p["version"]==m["version"]==v): errs.append(f"version: package {p['version']}, misty {m['version']}, CITATION {v}")
if t!=m["title"]: errs.append("title differs between CITATION.cff and misty.json")
D=open("LICENSE-docs").read()
if not (lic==m["license"]==p.get("license")=="GPL-3.0-or-later" and "GNU GENERAL PUBLIC LICENSE" in L[:200] and "Version 3" in L[:300]): errs.append("licence is not GPL-3.0-or-later everywhere")
if "Attribution-ShareAlike 4.0" not in D: errs.append("LICENSE-docs is not the CC BY-SA 4.0 legal code")
print("; ".join(errs))
PY
)"
[ -z "$m" ] && r J06 ok "CITATION.cff, misty.json and package.json agree" || r J06 no "CITATION.cff, misty.json and package.json agree" "$m"
grep -rIn -E "zenodo\.(X+|0+|PENDING)|DOI-PEND[I]NG|10\.5281/zenodo\.$" --exclude-dir=vendor --exclude-dir=.git --exclude=verify.sh . >/dev/null 2>&1 && r J07 no "no placeholder DOI" "a placeholder DOI is present" || r J07 ok "no placeholder DOI"
grep -q "S0" README.md && r J08 ok "README.md states physical validation S0" || r J08 no "README.md states physical validation S0" "state it"
echo "  $pass passed, $fail failed"
[ "$fail" -eq 0 ]
