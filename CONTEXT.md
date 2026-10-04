# Context: Jugaad to Genesis

© 1993–2026 Abhishek Choudhary. All rights reserved. AyeAI.

**What it is.** A static, browser-based laboratory for the Jugaad-to-Genesis mechanical model, served by GitHub Pages from the repository root, with an executable engineering model in `src/`, a command line in `cli/` and tests in `tests/`.

**Status.** Version 1.0.0. Physical validation S0: every figure is a model result, not a measurement. The canonical analytical reference gives a peak torque of 272.3062333333 N·m at the reference parameters; the historical 612 N·m poster figure is not reproduced and is recorded in `V1.0-AUDIT.md`.

**Where it sits.** In the Zistgah projection of Humanesque. PANINIphy and PANINIq are adapter boundaries here (`docs/PANINI-BOUNDARY.md`), not realizations. The estate's guide is Rahnuma: https://zistgah.org/rahnuma/.

**How to run.** `python3 -m http.server 4173` for the laboratory; `npm test` and `npm run verify` for the model; `bash ops/verify.sh` for the gate.
