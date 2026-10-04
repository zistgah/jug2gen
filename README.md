# Jugaad to Genesis

DOI: [10.5281/zenodo.23139760](https://doi.org/10.5281/zenodo.23139760)

© 1993–2026 Abhishek Choudhary. All rights reserved. AyeAI.

Parametric simulation and exchange laboratory for the Jugaad-to-Genesis mechanical model.

The site is static. It is meant to be served by GitHub Pages from the repository root. No build step.

## Programme coverage

The notes in `docs/` are the curated source. The lab panels cover the node, cost landscape, torque, capability field, regimes, ₹4,000 bill, CAD/CNC/print exchange, foundry energy, winding MMF, compute stack and script projection, guild tiers, sovereignty checklist, Ray-Man assumptions, and the evidence register.

The Workflow panel runs the time-stepped models in `js/simulate.js`: joint and actuator thermal cutout, chain backlash and wear, strut/shock/lifter, structural screen, foundry fill and Chvorinov solidification, winding torque-speed, CAM engagement and print layers, two-link arm, and Ray-Man air/surface/subsurface steps. See `docs/SIMULATIONS.md`. These are Cat 4/5 models, not certified analyses.

## Curated notes

- `docs/ARCHITECTURE.md`
- `docs/PARAMETRIC-MODEL.md`
- `docs/FOUNDRY-AND-WINDING.md`
- `docs/COMPUTE-AND-LANGUAGE.md`
- `docs/SOVEREIGNTY-AND-RAYMAN.md`
- `docs/EVIDENCE-REGISTER.md`
- `docs/PROVENANCE.md`
- `docs/EMBODIMENT-LAYERS.md`
- `docs/PARAMETERS.md`
- `docs/HAL-AND-FIRMWARE.md`
- `docs/REALIZATION-175-75.md`
- `docs/GROK-WORK-PACKAGES.md`

## Provenance

This laboratory implements a synthesis of the supplied Jugaad-to-Genesis notes. It does not promote heuristic numbers into measurements.

Treated as illustrative or proposed inside the app:

- 1.2 kg precision wall
- 10–150 kg trough
- 150 kg crane wall
- ₹4,000 node target
- specific-cost curve
- actuator class boundaries

Torque uses the supplied joint equation. `L⁴` / `L⁵` scaling is shown only as a similarity consequence, not a law for every machine.

## GitHub Pages

1. Push this directory to the default branch.
2. Settings → Pages → Build and deployment → GitHub Actions.

The workflow in `.github/workflows/pages.yml` publishes the repository root.

Branch hosting also works: Pages → Deploy from branch → `/ (root)`, with `.nojekyll` present so Jekyll does not swallow assets.

## Local preview

Modules and the 3D viewport need HTTP, not `file://`.

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.

The viewport uses a vendored Three.js build in `vendor/`. Charts, the bill of materials, and file export do not need it.

## Exchange notes

| File | Intended tool |
| --- | --- |
| `.stl` `.3mf` | Cura, PrusaSlicer, Bambu Studio, OrcaSlicer |
| `.obj` | Blender, MeshLab |
| `.scad` | OpenSCAD |
| `.dxf` `.svg` | LibreCAD, LightBurn, laser / 2D CAM |
| `.nc` | GRBL / LinuxCNC, illustrative contour only |
| `.step` | Nominal blocks for CAD kernels, best effort |
| `.json` | Round-trip of this laboratory |

G-code is not a verified post. Check tool diameter, stock, and offsets before cutting.

## Layout

```
index.html
css/app.css
js/model.js
js/charts.js
js/scene.js
js/exchange.js
js/app.js
samples/swaraj-node.json
src/                 V1.0 executable engineering model
cli/
tests/engine.test.mjs
```

## V1.0 engine

The laboratory UI is unchanged. The mathematical spine lives in `src/` and is not a dashboard.

```bash
npm test
npm run verify
npm run verify:full
npm run test:generate
npm run test:property
npm run test:boundary
npm run test:numerical
npm run test:mutation
npm run test:coverage
npm run analyze
npm run report
npm run sweep
npm run geometry
```

`npm run verify:full` writes `docs/generated/verification-report.md`, the test matrix, equation coverage, and the mutation report. A passing gate is computational verification of the parameterized model. It is not physical validation and it is not Genesis.

Canonical analytical reference, with g = 9.80665 m/s², m = 50 kg, L = 1 m, λ = 1/2, α = 1 rad/s² and illustrative k_f = 0.04:

τ_peak = 272.3062333333 N·m

That is a model result, not a measurement. The historical 612 N·m poster figure is not reproduced. See `V1.0-AUDIT.md` and `docs/V1.0-SPECIFICATION.md`.

Physical validation status for this release is S0. PANINIphy and PANINIq are adapter boundaries (`docs/PANINI-BOUNDARY.md`), not realizations.

## Citation and status

Cite this laboratory with `CITATION.cff`. Its physical validation status is S0: every figure it produces is a model result, not a measurement. The gate, `bash ops/verify.sh`, runs the test suite and the verifier and checks the attribution and the release metadata; `CONTRACT.md` lists what it checks and `CONTEXT.md` says where the laboratory sits in the estate.

## Licence

The code is licensed under the GNU General Public License, version 3 or later (`LICENSE`); the text and figures under Creative Commons Attribution-ShareAlike 4.0 (`LICENSE-docs`).
