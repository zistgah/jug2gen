# V1.0 mathematical closure

Physical validation remains S0. This report is computational verification only. Genesis is not claimed.

## Equations and domains

Governing analytical equations stay parameterized. The contract list in `src/verification/contracts.js` declares domain, boundary rules, invariants, and an independent oracle for gravity torque, rod inertia, inertial torque, proportional friction, peak torque, mechanical and electrical power, transmission ratio, chain tension, both cantilever load cases, safety factor, thermal steady and transient models, additive cost, geometric similarity, Euler, and RK4.

## Generated tests

- Seed: 20261004
- Default property cases per family: 1000 (`J2G_PROPERTY_CASES` overrides it)
- Matrix rows: 108
- Property evaluations recorded by the generator: 18000
- Reference corpus A–E is unchanged and is not treated as a measurement set
- Canonical reference remains 272.306233333333 N·m
- 612 N·m remains unreproduced by the canonical model

## Numerical policy

Comparison is `abs(a-b) <= absolute + relative * abs(reference)`. Algebraic identities use a tighter policy than integration. Random tests use a seeded generator. `Math.random()` is not used for verification.

## Convergence

RK4 on `dy/dt = y` is checked for near fourth-order convergence. Euler is checked for near first-order convergence. The lumped thermal transient is checked against the closed form `T(t) = T_a + P R + (T_0 - T_ss) exp(-t/(R C))`.

## Mutation

Ten governing-equation mutants are killed: inertia factor, gravity product, friction sign, counterbalance sign, scaling exponent, transmission ratio, efficiency, safety factor, deflection coefficient, and thermal sign. Score: 1.

## Coverage meaning

Line coverage is necessary and not sufficient. Equation coverage requires an independent oracle, a boundary case, a failure case, and a property case. See `docs/generated/equation-coverage.json`.

## Known limitations

- Multi-body dynamics remains an interface.
- CAD export is a fabrication representation, not a certified kernel round-trip.
- PANINIphy and PANINIq remain adapter boundaries.
- Regime boundaries and `k_f = 0.04` remain hypotheses and illustrative assumptions.
- No physical measurement campaign is included.

## Status

- Mathematical model: S5 for the independently checked analytical equations
- Software implementation: S4/S5 on the tested core
- Physical validation: S0
