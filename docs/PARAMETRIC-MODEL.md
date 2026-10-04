# Parametric mechanical model

Classification: the equation is an engineering model [Cat 3/5]. The kink masses and the rupee curve are heuristics [Cat 6].

## State

`N = ⟨L, m, τ, P, V, E⟩`

- `L` characteristic length, m
- `m` mass, kg, similar families scale as `L³`
- `τ` dynamic torque, N·m
- `P` tolerance bound, µm
- `V` actuation voltage
- `E` specific energy or efficiency

## Joint

For a rotating base:

`τ_peak = m g L_cg + (1/3) m L² α_max + τ_friction`

with `L_cg ≈ L/2`.

Under geometric similarity, `m ∝ L³`, so gravity torque scales as `L⁴` and inertial torque as `L⁵` if acceleration is held comparable. Real machines break similarity with section, material, ratio, and counterbalance. [Cat 5]

## Passive term

`τ_motor(θ) = I θ̈ + m g L cos θ − τ_counterbalance(θ) + b θ̇`

If the strut cancels most of the gravity term, the motor pays for acceleration and friction. Any fixed percentage, including 70%, is a target until a named rig measures it. This laboratory integrates a sample lift instead. [Cat 5/6]

## Walls

| Mass | Name | What actually changes |
| --- | --- | --- |
| < 1.2 kg | Precision wall | Bearings, coils, and assembly dominate cost |
| 10–150 kg | Material-parity trough | Hand tools, scrap, wiper or starter, chain |
| > 150 kg | Crane wall | Lift, cable, weld penetration, three-phase or hydraulics |

Physics does not jump at 150 kg. The shop does. [Cat 3/6]

## Actuator map used by the lab

The lab recomputes torque from the joint equation. The class names follow the source table: micro gearmotor, NEMA 23 / RC, wiper plus chain, starter or e-rickshaw BLDC, three-phase or hydraulics. [Cat 4/6]

## ₹4,000 node

Illustrative bill, not a quote. Structure, wiper, motorcycle chain, pillow block, fasteners, ESP32-class board, MOSFET bridge, scrap copper, 12 V supply, a position sensor, tool depreciation. Labour is zero only under sweat equity. The machine is a 1–2 DOF utility axis, not a humanoid. [Cat 4/6]
