# Embodiment layers: from winding to abstraction

© 1993–2026 Abhishek Choudhary. All rights reserved. AyeAI.

Curated from the author's design discussions of October 2026 with Gemini, corrected where they were wrong or unsupported, and tagged with this repository's evidence classes (Cat 1 named by the author, Cat 2 established work pending check, Cat 3 synthesis, Cat 4 proposed design, Cat 5 claim that needs a test, Cat 6 illustrative number). Physical validation remains S0 throughout.

## The brief, as the author set it

Build a humanoid from scratch, from the winding of the motors up to the abstraction layers and no further. Locomotion on two or more legs; manipulation with one or more hands; hands human-like or cephalopod-like, with hands and feet able to double for each other, as a monkey grasps with its feet. All types of communication. A brain-computer interface built in. Parameterize everything, so that the same model derives a boat, a submarine, a spacecraft, an aircraft, a car, a truck, a bulldozer or a crane; industrial automation is a recursive process; and the scale continues down to the nanoscale, which the author calls molecular weaving. Retrieve the earlier work and correlate it; do not reconstruct it. [Cat 1]

## Layer 0: the actuator, from the winding

A quasi-direct-drive brushless motor, designed from its winding. Parameters: slots \(N_{slots}\), poles \(N_{poles} = 2p\), turns per tooth \(N_{turns}\), wire diameter \(d_{wire}\), stack length \(L_{stk}\), rotor radius \(r_r\), air-gap flux density \(B_g\) (set by the magnet's remanence \(B_r\), the air gap and the magnetic circuit, and always below \(B_r\)). [Cat 3]

- Torque constant: \(K_t \propto N_{turns} B_g L_{stk} r_r\); for a permanent-magnet synchronous motor in amplitude-invariant dq form, \(\tau = \tfrac{3}{2} p \lambda_{pm} I_q\), so \(K_t = \tfrac{3}{2} p \lambda_{pm}\). [Cat 2]
- Speed constant: in SI units the back-EMF constant equals the torque constant for an ideal machine, \(K_e = K_t\), and the speed constant is \(k_\omega = 1/K_e\) in rad/s per volt. The notes called this \(K_v\); that symbol is kept here for the virtual stiffness only (see Layer 3). [Cat 2, correction]
- Continuous current is limited by copper loss \(I^2 R\) against the heat the stator can shed, not by wire gauge alone. [Cat 2, correction]
- A low-ratio reduction (about 6:1, planetary) keeps the joint back-drivable for impacts. [Cat 3]
- Sovereignty: the winding, the stator stack and the drive are local; magnet blanks and magnet wire are strategic reserve; a switched-reluctance design replaces the magnets when they are unavailable. [Cat 1, from SOVEREIGNTY-AND-RAYMAN.md]

## Layer 1: morphology

Limbs \(\mathbf{L} = \{L_1, \ldots, L_N\}\), \(N \ge 4\), each a chain of \(N_{seg}\) segments. Few segments give a jointed simian limb; many give a continuum, cephalopod-like limb. Tendons of Dyneema or aramid run at radius \(r_{routing}\) from each segment's neutral axis and are pulled by Layer 0 motors housed in the torso. [Cat 4]

- Curvature, for a constant-curvature segment of length \(h_{seg}\): \(\kappa = \Delta L_{tendon} / (r_{routing}\, h_{seg})\). [Cat 2, under the constant-curvature assumption]
- Symmetric tension stiffens a limb into a strut for walking; asymmetric tension coils it to grasp. That is how a foot doubles as a hand. [Cat 4]
- Rigid joints and continuum limbs are the same graph with different edges. The full-size configuration in REALIZATION-175-75.md uses rigid joints in the legs and arms and tendon-driven fingers. [Cat 4]

## Layer 2: the nervous system and communication

Distributed controllers at every motor node, on a deterministic bus. [Cat 4]

| Subsystem | Parameters | Function |
|:--|:--|:--|
| Internal bus | bandwidth \(BW_{bus}\), latency \(t_{lat} < 1\) ms | CAN-FD or EtherCAT carrying joint states to central compute |
| Radio | \(f_{RF} \in\) {433 MHz, 2.4 GHz, 5 GHz, UWB} | telemetry, swarming, off-board compute |
| Optical | \(\lambda \in\) {850 nm, 940 nm} | LiDAR, optical flow, line-of-sight links |
| Acoustic | 20 Hz to 20 kHz; ultrasonic above 40 kHz | microphone arrays, ranging |

## Layer 3: firmware and dynamics

Field-oriented control on each node: the Clarke and Park transforms take phase currents \(I_a, I_b, I_c\) to \(I_d, I_q\); \(I_d\) is held at zero below base speed and \(I_q\) produces torque, which in a tendon limb is tendon tension. Virtual impedance makes the limb soft or stiff on command:

\[ \mathbf{M}_{imp} \ddot{\tilde{\mathbf{x}}} + \mathbf{B}_{imp} \dot{\tilde{\mathbf{x}}} + \mathbf{K}_{imp} \tilde{\mathbf{x}} = \mathbf{F}_{ext}, \qquad \tilde{\mathbf{x}} = \mathbf{x} - \mathbf{x}_{cmd}. \]

Lowering \(\mathbf{K}_{imp}\) turns a leg into a compliant grasping limb when external force is detected. The torque estimator, the friction model and the identification procedure are in HAL-AND-FIRMWARE.md. [Cat 2/3]

## Layer 4: the hardware abstraction layer

The boundary between the plant and any intelligence above it. It exposes one state vector, upward, and accepts one command vector, downward:

\[ \mathbf{S}_t = \langle \mathbf{q}, \dot{\mathbf{q}}, \boldsymbol{\tau}_{est}, \mathbf{E}_{tactile}, \mathbf{C}_{ext} \rangle, \qquad \mathbf{C}_t = \langle \boldsymbol{\tau}_{cmd}, \mathbf{K}_{imp}, \mathbf{B}_{imp} \rangle , \]

at 1 kHz to the cognitive layer and 10 kHz inside the motor nodes. The layout in C is in HAL-AND-FIRMWARE.md. [Cat 4]

## Layer 5: the brain-computer interface

A bidirectional interface above the HAL, in the author's sequence AyeCNSe, then AyeAI, then AyeAM. [Cat 1]

- Acquisition: ECoG or intracortical arrays into a neuromorphic front end; the 28 nm ASIC is a proposal drawing on the jugaad28 tape-out catalogue, not a fabricated chip. [Cat 4]
- Encoding: balanced ternary, \(\{-1, 0, +1\}\) for inhibitory, quiescent and excitatory channels. [Cat 1/4]
- Decoding: PEDLER (Indian patent application 3033/CHE/2011) treats spikes as point events and resolves intent through inclination fields rather than back-propagated weights; NI2A2 maps the resolved intent to impedance parameters. Microsecond decoding latency was asserted in the discussion and is a target to test, not a result. [Cat 1 for the systems; Cat 5 for the latency]
- Clinical use needs ethics approval, device regulation and clinical partners. [Cat 3]

## The universal machine schema

A machine is a directed graph \(\mathcal{G} = (\mathcal{N}, \mathcal{E})\) of energy-to-momentum converters acting against a medium. [Cat 3/4]

- The coupling of each actuator selects what it drives: a spool or capstan (tendons, winches), a hub (wheels, tracks), an impeller or airfoil (water, air), or a flywheel (attitude in vacuum).
- The medium, by density \(\rho\), viscosity \(\mu\) and normal force \(F_n\), selects the external forces: contact friction \(\mu_k F_n\) on ground; drag \(\tfrac{1}{2} \rho v^2 C_d A\) and buoyancy in fluids; momentum exchange and expulsion in vacuum.
- One dynamics, \(\mathbf{M}(\mathbf{q})\ddot{\mathbf{q}} + \mathbf{C}(\mathbf{q}, \dot{\mathbf{q}})\dot{\mathbf{q}} + \mathbf{G}(\mathbf{q}) = \boldsymbol{\tau} + \mathbf{J}_{env}^{T}(\mathbf{q}) \mathbf{F}_{env}\), covers all of them; the environment enters only through \(\mathbf{J}_{env}\) and \(\mathbf{F}_{env}\).
- Recursive automation: an assembly cell is itself a machine graph that arranges the nodes and edges of another, which then joins the network. [Cat 1/4]

## Layer -1: molecular weaving

The author's name for carrying the same graph down to atoms: nodes become atoms or molecular motifs, edges become bonds, and an actuator's output becomes the mechanosynthetic work \(F_{nano} \Delta x \ge E_a\) needed to cross a reaction barrier. This is a research direction. Atomically precise manufacturing has not been demonstrated at scale, and the mapping of ternary states to valence states is a metaphor, not chemistry. Nothing here should be read as a design. [Cat 4/6]

## What the discussion claimed that is not yet so

- PANINIq lowering to WebAssembly and on to the CAN-FD bus does not exist. PANINIq 0.3.0 is Python with a JavaScript mirror (paniniq-js); PANINIphy 1.0 is Python. [Cat 3, correction]
- No 28 nm neuromorphic chip has been made for this. [correction]
- Microsecond intent decoding is unmeasured. [Cat 5]
