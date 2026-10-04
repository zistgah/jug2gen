# Contract: Jugaad to Genesis

© 1993–2026 Abhishek Choudhary. All rights reserved. AyeAI.

`bash ops/verify.sh` checks every clause below; the release is sealed, pushed and minted only when all pass.

- J01 The test suite passes: the `test` script of `package.json`, run with npm or, where npm is absent, with Node directly.
- J02 The verifier reports `ok` over every equation and states physical validation S0: `node cli/verify.mjs`.
- J03 No heuristic number is promoted to a measurement: the verifier's allowlist in `verification/number-allowlist.json` stays the authority.
- J04 The author is Abhishek Choudhary, affiliation AyeAI only, in `CITATION.cff` and `misty.json`.
- J05 `README.md` carries the copyright line.
- J06 `CITATION.cff`, `misty.json` and `package.json` agree on title and version; the licence is GPL-3.0-or-later in `CITATION.cff`, `misty.json`, `package.json` and `LICENSE`, and `LICENSE-docs` is the CC BY-SA 4.0 legal code.
- J07 No placeholder DOI appears anywhere.
- J08 The physical validation status, S0, is stated in `README.md`.
