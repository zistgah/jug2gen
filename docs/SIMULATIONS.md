# Simulation models

These are numerical models in the laboratory, classified Cat 4/5. They are not shop trials, FEA sign-off, or flight tests.

## Joint

Semi-implicit Euler on a single link. Actuator maps follow the source table: wiper, starter, window lift, e-rickshaw BLDC. Stall torque and free speed set `Ke = Kt` and winding resistance. Chain stages multiply torque, compound efficiency near 0.93 per stage, and add backlash as a deadzone. Temperature integrates `I²R` against a lumped loss. Cutout or burst limit forces voltage to zero.

Passive terms are separate: gas-strut fraction of `mgL cos θ`, shock spring-damper, hydraulic lifter with higher damping on the down stroke.

## Structure

Cantilever root moment `m g L / 2`, box-section second moment from a mass-scaled section, bending stress, radial bearing load. A 250 MPa mild-steel screen marks yield. It is a screen, not a code check.

## Foundry

Fill time from a gated Bernoulli discharge. Solidification time from Chvorinov, `t = Cm (V/A)²`. Linear shrink and a tolerance stack. Steel and Ti-6Al-4V still return numbers and a refusal flag.

## Winding

Slot fill from wire area, back-EMF constant, torque-speed from a 12 V bus, lumped thermal rise.

## CAM and print

Pocket passes, path length, MRR, a specific-force estimate, and a layer loop with extrusion volume and time. G-code export remains a contour, not this engagement model.

## Arm

Two-link planar arm, gravity terms, independent joint integrators, optional counterbalance fraction. Coupling is only through the gravity expression, not a full mass matrix.

## Ray-Man

Point-mass air step with lift and drag, surface step with Froude-scaled drag, subsurface step with undulatory thrust against quadratic drag. Mass and payload stay at the supplied 85 kg and 25 kg assumptions.
