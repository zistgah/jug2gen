# JUGAAD → GENESIS V1.0 engineering report

This report separates theoretical model, computational implementation, numerical verification, engineering prediction, and physical validation.

## Theoretical model

Canonical node N = <L, m, τ, P, V, E>. Single-link torque τ = τ_g + τ_I + τ_f + τ_ext, with τ_g = m g λ L and I = m L² / 3 for a uniform rod.

## Computational implementation

Equations registered: 42.

## Numerical verification

```json
{
  "id": "CASE-REF",
  "m": 50,
  "L": 1,
  "lambda": 0.5,
  "alpha": 1,
  "g": 9.80665,
  "Lcg": 0.5,
  "I": 16.666666666666668,
  "tauG": 245.16625,
  "tauI": 16.666666666666668,
  "tauNoFriction": 261.8329166666667,
  "kF": 0.04,
  "tauF": 10.473316666666667,
  "tauPeak": 272.30623333333335,
  "evidence": "C3",
  "physicalValidation": "S0",
  "note": "Exact analytical reference. Not a measurement. Not the unreproduced 612 N·m poster figure."
}
```

## Engineering prediction

Reference cases A–E are model predictions. They are not measurements.

## Physical validation

No physical validation is claimed. Every physicalValidation field in this release is S0 unless a future campaign attaches measurements.

## Poster torque audit

```json
{
  "displayed": 612,
  "reproduced": false,
  "hypotheses": [
    {
      "name": "canonical λ=1/2, α=1, k_f=0.04",
      "tau": 272.30623333333335
    },
    {
      "name": "canonical without friction",
      "tau": 261.8329166666667
    },
    {
      "name": "Lcg = L, no friction, α=1",
      "tau": 506.99916666666667
    },
    {
      "name": "m g L * 1.25 with g=9.81",
      "tau": 613.125
    },
    {
      "name": "existing UI preset α=1.2, k_f=0.04",
      "tau": 275.7729
    }
  ],
  "conclusion": "612 N·m is not produced by the canonical uniform-rod equation at the reference parameters. It is flagged, not preserved as an engineering result.",
  "evidence": "C6",
  "physicalValidation": "S0"
}
```