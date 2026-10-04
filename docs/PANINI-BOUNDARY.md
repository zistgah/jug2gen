# PANINI boundary

Inspected references:

- PANINIphy v1.0 Physical IR schema requires `ir_id`, `version`, and `target`. Optional arrays include objects, components, materials, actuators, joints, constraints, and unresolved.
- PANINIq 0.3 JavaScript mirror exposes command tokens `COMMIT`, `PLAN`, and `IDLE` in `paniniq-js/isa.js`. The pipeline is a software simulation. It is not neuromorphic hardware.

V1.0 relationship:

```
J2G engineering model
  → physical requirement
  → PANINIphy Physical IR adapter (src/panini/adapter.js)
  → unresolved parts resolution
  → adapter verification checklist
```

```
sensor/event
  → PEDLER-like software state
  → COMMIT | PLAN | IDLE
  → actuator voltage command
```

Neither adapter is a physical realization. Both report `physicalValidation: S0`.
