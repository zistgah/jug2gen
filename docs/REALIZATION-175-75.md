# The human-sized realization: 175 cm, 75 kg

© 1993–2026 Abhishek Choudhary. All rights reserved. AyeAI.

The configuration that generates an average human-sized machine for the human work cell, exceeding human performance in sensing, manipulation, communication, speed, power, precision and accuracy. Every performance figure is a target to be tested, Cat 5; every cost is illustrative, Cat 6. The machine-readable form is `samples/humanoid-175-75.json`.

## Body plan: 75 degrees of freedom

| Group | Joints | Actuation |
|:--|--:|:--|
| Head and neck | 2 | quasi-direct drive |
| Torso | 3 | quasi-direct drive with strain-wave gearing |
| Arms, 2 × 7 (shoulder 3, elbow 1, wrist 3) | 14 | quasi-direct drive with strain-wave gearing |
| Hands, 2 × 22 | 44 | tendon-driven, miniature linear actuators in the forearm |
| Legs, 2 × 6 (hip 3, knee 1, ankle 2) | 12 | electro-hydrostatic actuators |

**Correction.** The discussion gave 24 hand joints in all, 12 per hand. That, with a 7-joint arm, makes 19 per side, short of the roughly 27 of a human hand and wrist. It cannot exceed human dexterity by any count. With 22 per hand, each side has 29. Joint count is necessary but not sufficient: tactile sensing and control decide the rest. [Cat 3]

## Sensing, communication, compute, power

- **Vision and depth:** foveated RGB and infrared cameras fused with solid-state LiDAR, building millimetre-level spatial meshes at 120 Hz.
- **Touch:** optical elastomer or piezoresistive arrays on palms and fingertips, above 50 tactels per cm², resolving micro-slip and sub-gram force changes.
- **Proprioception:** absolute magnetic encoders at every joint and six-axis force-torque sensors at wrists and ankles, all at 2 kHz.
- **Communication:** EtherCAT inside the body, under 1 ms; radio at 433 MHz, 2.4 GHz, 5 GHz and UWB; infrared optical links; acoustic arrays and ultrasonic ranging.
- **Compute:** a controller at every joint node; one central module for perception, cognition and the brain-computer interface. Its cognitive software is PEDLER and NI2A2, with PANINIphy as the realization interface.
- **Power:** a torso battery of about 2.8 kWh. The discussion's 350 Wh/kg solid-state cells are a target; at today's roughly 250 Wh/kg, the pack is about 11 kg, which the margin below absorbs.

## Mass budget

| Subsystem | kg |
|:--|--:|
| Structure: titanium joints, carbon-fibre links | 15.0 |
| Leg actuators, 12 electro-hydrostatic | 14.4 |
| Torso, arm and neck actuators, 19 | 11.4 |
| Hands: 44 actuators, tendons, structure | 3.8 |
| Battery at 350 Wh/kg | 8.0 |
| Power electronics and battery management | 2.0 |
| Compute | 2.5 |
| Sensors | 3.0 |
| Harness | 3.0 |
| Skin, covers and cooling | 4.8 |
| Margin, which also covers a 250 Wh/kg battery | 7.1 |
| **Total** | **75.0** |

## Performance against the human baseline

| Measure | Human | Target |
|:--|:--|:--|
| Joints per arm and hand | about 27 | 29 |
| Repeatability | 1 to 2 mm, varies with fatigue | under 0.05 mm |
| Actuator power density | roughly 50 to 200 W/kg for muscle at peak, by source | above 250 W/kg |
| Sensor-to-controller latency | spinal reflex 30 to 50 ms; voluntary reaction 150 to 250 ms | under 5 ms |
| Signal speed | myelinated nerve, up to about 120 m/s | electrical bus, of the order of \(10^8\) m/s |
| Control bandwidth | a few hertz for voluntary movement | above 1 kHz impedance control |
| Lift for the work cell | about 20 to 25 kg as a recommended limit | above 50 kg |

**Correction.** The discussion gave 100 to 250 ms for reflex latency. That is the range of a voluntary reaction; a spinal reflex is about 30 to 50 ms. [Cat 2]

## Cost

| Basis | Figure | Source |
|:--|:--|:--|
| Raw materials at commodity prices | about ,400, roughly ₹2 lakh: metals 40 kg, copper 12 kg, polymers and composites 16 kg, battery actives, silicon and glass 7 kg | the discussion, Cat 6; the masses sum to 75 kg |
| One-off prototype, bill of materials only, before engineering and R&D labour | 25,000 to 25,000, plus about ,000 to 0,000 for 20 more hand actuators | the discussion, Cat 6 |

The gap between the two figures is processing: machining titanium to 0.01 mm, winding, autoclave curing and chips. The sovereign path closes that gap where the capability field allows:
- **Local:** motors wound in-house, castings and drives.
- **Strategic reserve:** magnets, cells and power semiconductors.
- **Old designs:** strain-wave and cycloidal gearing have expired base patents, subject to a freedom-to-operate check.
