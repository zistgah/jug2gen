# Work packages for the next build

© 1993–2026 Abhishek Choudhary. All rights reserved. AyeAI.

Version 1.0 is a laboratory of the notes: one node, typed-in kinks, named components, subsystem simulations and JavaScript only. The next build is an embodiment family generated from one parameter set. Its specification is EMBODIMENT-LAYERS.md, PARAMETERS.md, HAL-AND-FIRMWARE.md and REALIZATION-175-75.md. Each package below is accepted only by its tests, run in the repository's gate. A result that passes only because a number was typed in is a failure.

**Roles.** Grok implements. ChatGPT and Gemini derive each package's requirements from the notes. Claude writes the contracts and checks the evidence on each pull request. The author merges and mints.

| Package | Delivers | Accepted when |
|:--|:--|:--|
| WP1 | The core in C11: body-plan graph, parameters with units, the IR | Schema validates; golden graphs round-trip byte for byte; units are checked at compile time or load time |
| WP2 | The process-regime cost engine (PARAMETERS.md, cost envelope) | Kinks appear at computed switching points; the notes' process limits reproduce 1.2 kg and 150 kg; each section between kinks is monotonic |
| WP3 | Motor and drive design from the winding (EMBODIMENT-LAYERS.md, Layer 0) | Textbook sizing cases fall within stated tolerances; \(K_t = \tfrac{3}{2} p \lambda_{pm}\) is consistent with the winding; the thermal limit binds where it should |
| WP4 | Body-plan generators: humanoid, legged, tracked, multirotor, hull, spacecraft bus, tri-phibious, from the universal schema | `samples/humanoid-175-75.json` generates 75 joints and a mass budget closing at 75.0 kg; every plan yields a valid graph |
| WP5 | Joint firmware in C: field-oriented control, the observer, friction, impedance (HAL-AND-FIRMWARE.md) | The observer's three eigenvalues equal \(\lambda\) at the worked numbers; friction identification recovers known parameters from synthetic data within 2 per cent; impedance tracks a step without overshoot at critical damping |
| WP6 | The HAL in C, generated for any joint count, with the sequence-locked exchange | Builds for 18 and for 75 joints; a two-thread stress test shows no torn frame in \(10^8\) exchanges |
| WP7 | Geometry in C and C++: implicit surfaces, point clouds, meshes, exports | Meshes are watertight; volume × density matches each part's mass in the budget |
| WP8 | Whole-machine simulation: articulated bodies, contact, actuator heat, media | Analytic cases pass, including 272.3062333333 N m; energy drift stays within bounds; buoyancy and drag match closed forms |
| WP9 | Bindings: WebAssembly with JavaScript, and Python, from one interface description | The same golden vectors pass in C, WebAssembly and Python |
| WP10 | The PANINIphy round trip, and the laboratory on the WebAssembly core | PANINIphy 1.0 compiles the IR with no unresolved designed part; every laboratory panel draws from the core |

**The standing brief, given with each package:**

> You are implementing WP-n of zistgah/jug2gen. Read CONTRACT.md, CONTEXT.md, the package's issue and the four specification notes first. Write the core in C11 behind a C interface; use C++17 only where a named library needs it. Do not change the laboratory's interface before WP10. Keep each number's evidence class; never turn a heuristic into a measurement. The package is done only when its acceptance tests pass by execution in the gate. Paste the gate's output into the pull request.

**Bindings today:**
- PANINIq 0.3.0 is Python, with a JavaScript mirror, paniniq-js.
- PANINIphy 1.0 is Python.
- Neither has a C core or WebAssembly.

WP9 builds that layer for the embodiment core. The same pattern can later serve PANINIq and PANINIphy.
