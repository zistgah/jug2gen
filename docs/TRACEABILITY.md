# Traceability

Machine-readable copies are written by `npm run report` to `docs/generated/`.

| Requirement | Equation | Module | Test |
| --- | --- | --- | --- |
| REQ-DYN-001 Gravity torque | M_GRAVITY_001 | physics/mechanics.js | TEST-GRAVITY-001 |
| REQ-DYN-002 Rod inertia | M_INERTIA_001 | physics/mechanics.js | TEST-INERTIA-001 |
| REQ-DYN-005 Peak torque | M_DYN_002 | physics/mechanics.js | TEST-ANALYTICAL-001 |
| REQ-PWR-001 Power | M_POWER_001 | actuators/actuator.js | TEST-POWER-001 |
| REQ-TRN-001 Transmission | M_TRANS_001 | transmission/transmission.js | TEST-TRANS-001 |
| REQ-STR-001 Bending | M_BEND_001 | structures/structures.js | TEST-BEND-001 |
| REQ-THM-001 Thermal | M_THERM_002 | thermal/lumped.js | TEST-THERM-001 |
| REQ-CST-001 Cost | M_COST_001 | economics/cost.js | TEST-COST-001 |
| REQ-UNC-001 Uncertainty | M_UNCERTAINTY_001 | math/numerics.js | TEST-UNC-001 |
| REQ-PHY-001 PANINIphy | adapter | panini/adapter.js | TEST-PANINI-001 |
| REQ-Q-001 PANINIq | adapter | panini/adapter.js | TEST-PANINI-002 |

Evidence and implementation status are separate. Physical validation is S0.
