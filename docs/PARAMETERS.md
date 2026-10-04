# Parameters, formalised and correlated

© 1993–2026 Abhishek Choudhary. All rights reserved. AyeAI.

Every parameter of the embodiment model, with its unit, its layer, the relation that ties it to others, and how it scales with the length scale \(s\) (a machine \(s\) times larger in every dimension). The governing rule is that a parameter is either chosen, derived from others by a stated relation, or measured; no number is promoted from heuristic to measurement. [Cat 3]

## The scale and the node

| Symbol | Meaning | Unit | Relation | Scales as |
|:--|:--|:--|:--|:--|
| \(s\) | length scale relative to the 175 cm reference | 1 | chosen | \(s\) |
| \(L\) | characteristic length | m | \(L = s L_0\) | \(s\) |
| \(m\) | mass | kg | \(m = \rho V\) | \(s^3\) under similarity |
| \(\tau_g\) | gravity torque at a joint | N m | \(m g L_{cg}\), \(L_{cg} \approx L/2\) | \(s^4\) |
| \(\tau_i\) | inertial torque | N m | \(\tfrac{1}{3} m L^2 \alpha\) | \(s^5\) at fixed \(\alpha\) |
| \(P\) | tolerance bound | µm | chosen per interface | sets the feasible processes |
| \(V\) | bus voltage | V | chosen: 12, 24, 48, 400 | steps with power class |
| \(E\) | specific energy or efficiency | Wh/kg or 1 | cell and drive data | |

## The actuator (Layer 0)

| Symbol | Meaning | Unit | Relation | Scales as |
|:--|:--|:--|:--|:--|
| \(N_{slots}, N_{poles}, p\) | slots, poles, pole pairs | 1 | chosen; \(p = N_{poles}/2\) | |
| \(N_{turns}, d_{wire}\) | turns per tooth, wire diameter | 1, mm | chosen; slot fill limits \(N_{turns} d_{wire}^2\) | |
| \(B_g\) | air-gap flux density | T | from magnet \(B_r\), gap and circuit; \(B_g < B_r\) | |
| \(K_t\) | torque constant | N m/A | \(\tfrac{3}{2} p \lambda_{pm}\) | |
| \(k_\omega\) | speed constant | rad/(s V) | \(1/K_e\), \(K_e = K_t\) | |
| \(\tau_{max}\) | continuous torque | N m | shear stress × rotor volume, thermally limited | \(s^3\) at fixed stress; about \(s^{2.5}\) when heat-limited |
| \(N_r\) | reduction ratio | 1 | chosen; about 6 for back-drivability | |
| \(\rho_\tau\) | torque per actuator mass | N m/kg | \(\tau_{max}/m_{act}\) | |

Because demand grows as \(s^4\) to \(s^5\) and capacity as \(s^{2.5}\) to \(s^3\), the right actuator class changes with scale: quasi-direct drive, then geared electric, then electro-hydrostatic or hydraulic. These switches are kinks in mass and in cost. [Cat 2/3]

## Morphology (Layer 1)

| Symbol | Meaning | Unit | Relation |
|:--|:--|:--|:--|
| \(N\) | number of limbs | 1 | \(N \ge 4\) |
| \(N_{seg}\) | segments per limb | 1 | few: jointed; many: continuum |
| \(r_{routing}\) | tendon offset from the neutral axis | m | scales as \(s\) |
| \(\Delta L_{tendon}\) | tendon stroke | m | pulley radius × motor angle |
| \(\kappa\) | segment curvature | 1/m | \(\Delta L_{tendon} / (r_{routing} h_{seg})\) |
| \(n_{DoF}\) | degrees of freedom | 1 | \(\sum_i n_i\) over joints; equals HAL_NUM_JOINTS |

## Nervous system, firmware and the HAL (Layers 2 to 4)

| Symbol | Meaning | Unit | Relation |
|:--|:--|:--|:--|
| \(f_{FOC}\) | current loop rate | Hz | 10 kHz |
| \(T\) | sample time | s | \(1/f_{FOC}\) |
| \(\omega_o\) | observer bandwidth | rad/s | \(\omega_o \ll \pi/T\); about 628 rad/s at 10 kHz |
| \(l_1, l_2, l_3\) | observer gains | 1, 1/s, N m | closed forms in HAL-AND-FIRMWARE.md |
| \(\tau_c, \tau_s, \dot{q}_s, f_v\) | friction | N m, N m, rad/s, N m s/rad | identified per joint |
| \(f_{imp}\) | impedance loop rate | Hz | 1 to 2 kHz; at least ten times below \(f_{FOC}\) |
| \(\mathbf{K}_{imp}, \mathbf{B}_{imp}, \mathbf{M}_{imp}\) | virtual stiffness, damping, inertia | per joint | low for humanoid mode; high for crane mode; \(\mathbf{B}_{imp}\) matched to the medium for swimming |
| \(t_{lat}\) | bus latency | s | under 1 ms |
| \(f_{HAL}\) | HAL exchange rate | Hz | 1 kHz upward |

## Environment (the universal schema)

| Symbol | Meaning | Unit | Selects |
|:--|:--|:--|:--|
| \(\rho\) | density of the medium | kg/m³ | ground, water, air, vacuum |
| \(\mu\) | dynamic viscosity | Pa s | drag regime |
| \(F_n, \mu_k\) | normal force, friction coefficient | N, 1 | traction on ground |
| \(C_d, A\) | drag coefficient, frontal area | 1, m² | \(F = \tfrac{1}{2}\rho v^2 C_d A\) |
| \(C_{mod}\) | actuator coupling | class | spool, hub, impeller or airfoil, flywheel |

## Cost (the process envelope)

For each component class \(k\) and process \(p\) with feasibility range \(F_p\):

\[ C^*(s) = \sum_k \min_{p\,:\,s \in F_p} \left( \rho_k V_k(s) \pi_k + e_p(s) + \frac{T_p}{n} + h_p(s)\, w + t_p(s) \right). \]

\(\pi_k\) is the material's price, \(e_p\) the process energy, \(T_p/n\) the tooling per unit, \(h_p w\) the labour and \(t_p\) the testing. Kinks appear where the cheapest feasible process changes. The notes' 1.2 kg precision wall and 150 kg crane wall must be reproduced by setting the process limits, not typed in. [Cat 3]

## The capability field

\(\mathbf{C} = [M, F, A, S, K, E, W, V, H, O]\) (materials, fabrication, actuation, sensing, compute, energy, winding, verification, human skill, organisation) scores what a community can make, and so fixes which processes are feasible for it: the capability field sets \(F_p\) in the cost envelope. [Cat 3]
