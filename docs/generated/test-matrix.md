# Generated test matrix

Seed 20261004. Property cases per equation family: 1000.

| Equation | Kind | Cases | Oracle |
| --- | --- | --- | --- |
| M_GRAVITY_001::REFERENCE | reference | 1 | m*g*Lcg |
| M_GRAVITY_001::BOUNDARY::LOWER | boundary | 1 | m*g*Lcg |
| M_GRAVITY_001::BOUNDARY::BELOW | failure | 1 | m*g*Lcg |
| M_GRAVITY_001::BOUNDARY::ABOVE | failure | 1 | m*g*Lcg |
| M_GRAVITY_001::PROPERTY | property | 1000 | m*g*Lcg |
| M_GRAVITY_001::NUMERICAL | numerical | 6 | m*g*Lcg |
| M_INERTIA_001::REFERENCE | reference | 1 | (1/3)*m*L*L |
| M_INERTIA_001::BOUNDARY::LOWER | boundary | 1 | (1/3)*m*L*L |
| M_INERTIA_001::BOUNDARY::BELOW | failure | 1 | (1/3)*m*L*L |
| M_INERTIA_001::BOUNDARY::ABOVE | failure | 1 | (1/3)*m*L*L |
| M_INERTIA_001::PROPERTY | property | 1000 | (1/3)*m*L*L |
| M_INERTIA_001::NUMERICAL | numerical | 6 | (1/3)*m*L*L |
| M_INERTIAL_001::REFERENCE | reference | 1 | I*alpha |
| M_INERTIAL_001::BOUNDARY::LOWER | boundary | 1 | I*alpha |
| M_INERTIAL_001::BOUNDARY::BELOW | failure | 1 | I*alpha |
| M_INERTIAL_001::BOUNDARY::ABOVE | failure | 1 | I*alpha |
| M_INERTIAL_001::PROPERTY | property | 1000 | I*alpha |
| M_INERTIAL_001::NUMERICAL | numerical | 6 | I*alpha |
| M_FRICTION_002::REFERENCE | reference | 1 | kF*(tauG+tauI) |
| M_FRICTION_002::BOUNDARY::LOWER | boundary | 1 | kF*(tauG+tauI) |
| M_FRICTION_002::BOUNDARY::BELOW | failure | 1 | kF*(tauG+tauI) |
| M_FRICTION_002::BOUNDARY::ABOVE | failure | 1 | kF*(tauG+tauI) |
| M_FRICTION_002::PROPERTY | property | 1000 | kF*(tauG+tauI) |
| M_FRICTION_002::NUMERICAL | numerical | 6 | kF*(tauG+tauI) |
| M_DYN_002::REFERENCE | reference | 1 | tauG+tauI+kF*(tauG+tauI) |
| M_DYN_002::BOUNDARY::LOWER | boundary | 1 | tauG+tauI+kF*(tauG+tauI) |
| M_DYN_002::BOUNDARY::BELOW | failure | 1 | tauG+tauI+kF*(tauG+tauI) |
| M_DYN_002::BOUNDARY::ABOVE | failure | 1 | tauG+tauI+kF*(tauG+tauI) |
| M_DYN_002::PROPERTY | property | 1000 | tauG+tauI+kF*(tauG+tauI) |
| M_DYN_002::NUMERICAL | numerical | 6 | tauG+tauI+kF*(tauG+tauI) |
| M_POWER_001::REFERENCE | reference | 1 | tau*omega |
| M_POWER_001::BOUNDARY::LOWER | boundary | 1 | tau*omega |
| M_POWER_001::BOUNDARY::BELOW | failure | 1 | tau*omega |
| M_POWER_001::BOUNDARY::ABOVE | failure | 1 | tau*omega |
| M_POWER_001::PROPERTY | property | 1000 | tau*omega |
| M_POWER_001::NUMERICAL | numerical | 6 | tau*omega |
| M_POWER_002::REFERENCE | reference | 1 | Pmech/eta |
| M_POWER_002::BOUNDARY::LOWER | boundary | 1 | Pmech/eta |
| M_POWER_002::BOUNDARY::BELOW | failure | 1 | Pmech/eta |
| M_POWER_002::BOUNDARY::ABOVE | failure | 1 | Pmech/eta |
| M_POWER_002::PROPERTY | property | 1000 | Pmech/eta |
| M_POWER_002::NUMERICAL | numerical | 6 | Pmech/eta |
| M_TRANS_001::REFERENCE | reference | 1 | Nout/Nin |
| M_TRANS_001::BOUNDARY::LOWER | boundary | 1 | Nout/Nin |
| M_TRANS_001::BOUNDARY::BELOW | failure | 1 | Nout/Nin |
| M_TRANS_001::BOUNDARY::ABOVE | failure | 1 | Nout/Nin |
| M_TRANS_001::PROPERTY | property | 1000 | Nout/Nin |
| M_TRANS_001::NUMERICAL | numerical | 6 | Nout/Nin |
| M_CHAIN_001::REFERENCE | reference | 1 | tau/r |
| M_CHAIN_001::BOUNDARY::LOWER | boundary | 1 | tau/r |
| M_CHAIN_001::BOUNDARY::BELOW | failure | 1 | tau/r |
| M_CHAIN_001::BOUNDARY::ABOVE | failure | 1 | tau/r |
| M_CHAIN_001::PROPERTY | property | 1000 | tau/r |
| M_CHAIN_001::NUMERICAL | numerical | 6 | tau/r |
| M_DEFL_001::REFERENCE | reference | 1 | F*L^3/(3*E*I) |
| M_DEFL_001::BOUNDARY::LOWER | boundary | 1 | F*L^3/(3*E*I) |
| M_DEFL_001::BOUNDARY::BELOW | failure | 1 | F*L^3/(3*E*I) |
| M_DEFL_001::BOUNDARY::ABOVE | failure | 1 | F*L^3/(3*E*I) |
| M_DEFL_001::PROPERTY | property | 1000 | F*L^3/(3*E*I) |
| M_DEFL_001::NUMERICAL | numerical | 6 | F*L^3/(3*E*I) |
| M_DEFL_002::REFERENCE | reference | 1 | w*L^4/(8*E*I) |
| M_DEFL_002::BOUNDARY::LOWER | boundary | 1 | w*L^4/(8*E*I) |
| M_DEFL_002::BOUNDARY::BELOW | failure | 1 | w*L^4/(8*E*I) |
| M_DEFL_002::BOUNDARY::ABOVE | failure | 1 | w*L^4/(8*E*I) |
| M_DEFL_002::PROPERTY | property | 1000 | w*L^4/(8*E*I) |
| M_DEFL_002::NUMERICAL | numerical | 6 | w*L^4/(8*E*I) |
| M_SF_001::REFERENCE | reference | 1 | allowable/applied |
| M_SF_001::BOUNDARY::LOWER | boundary | 1 | allowable/applied |
| M_SF_001::BOUNDARY::BELOW | failure | 1 | allowable/applied |
| M_SF_001::BOUNDARY::ABOVE | failure | 1 | allowable/applied |
| M_SF_001::PROPERTY | property | 1000 | allowable/applied |
| M_SF_001::NUMERICAL | numerical | 6 | allowable/applied |
| M_THERM_002::REFERENCE | reference | 1 | Ta+Ploss*Rth |
| M_THERM_002::BOUNDARY::LOWER | boundary | 1 | Ta+Ploss*Rth |
| M_THERM_002::BOUNDARY::BELOW | failure | 1 | Ta+Ploss*Rth |
| M_THERM_002::BOUNDARY::ABOVE | failure | 1 | Ta+Ploss*Rth |
| M_THERM_002::PROPERTY | property | 1000 | Ta+Ploss*Rth |
| M_THERM_002::NUMERICAL | numerical | 6 | Ta+Ploss*Rth |
| M_THERM_001::REFERENCE | reference | 1 | Ta+Ploss*Rth+(T0-Tss)*exp(-t/(Rth*Cth)) |
| M_THERM_001::BOUNDARY::LOWER | boundary | 1 | Ta+Ploss*Rth+(T0-Tss)*exp(-t/(Rth*Cth)) |
| M_THERM_001::BOUNDARY::BELOW | failure | 1 | Ta+Ploss*Rth+(T0-Tss)*exp(-t/(Rth*Cth)) |
| M_THERM_001::BOUNDARY::ABOVE | failure | 1 | Ta+Ploss*Rth+(T0-Tss)*exp(-t/(Rth*Cth)) |
| M_THERM_001::PROPERTY | property | 1000 | Ta+Ploss*Rth+(T0-Tss)*exp(-t/(Rth*Cth)) |
| M_THERM_001::NUMERICAL | numerical | 6 | Ta+Ploss*Rth+(T0-Tss)*exp(-t/(Rth*Cth)) |
| M_COST_001::REFERENCE | reference | 1 | sum of components |
| M_COST_001::BOUNDARY::LOWER | boundary | 1 | sum of components |
| M_COST_001::BOUNDARY::BELOW | failure | 1 | sum of components |
| M_COST_001::BOUNDARY::ABOVE | failure | 1 | sum of components |
| M_COST_001::PROPERTY | property | 1000 | sum of components |
| M_COST_001::NUMERICAL | numerical | 6 | sum of components |
| M_SCALE_001::REFERENCE | reference | 1 | m*s^3, tauG*s^4, tauI*s^5 |
| M_SCALE_001::BOUNDARY::LOWER | boundary | 1 | m*s^3, tauG*s^4, tauI*s^5 |
| M_SCALE_001::BOUNDARY::BELOW | failure | 1 | m*s^3, tauG*s^4, tauI*s^5 |
| M_SCALE_001::BOUNDARY::ABOVE | failure | 1 | m*s^3, tauG*s^4, tauI*s^5 |
| M_SCALE_001::PROPERTY | property | 1000 | m*s^3, tauG*s^4, tauI*s^5 |
| M_SCALE_001::NUMERICAL | numerical | 6 | m*s^3, tauG*s^4, tauI*s^5 |
| M_INTEGRATION_001::REFERENCE | reference | 1 | exp(t) |
| M_INTEGRATION_001::BOUNDARY::LOWER | boundary | 1 | exp(t) |
| M_INTEGRATION_001::BOUNDARY::BELOW | failure | 1 | exp(t) |
| M_INTEGRATION_001::BOUNDARY::ABOVE | failure | 1 | exp(t) |
| M_INTEGRATION_001::PROPERTY | property | 1000 | exp(t) |
| M_INTEGRATION_001::NUMERICAL | numerical | 6 | exp(t) |
| M_INTEGRATION_002::REFERENCE | reference | 1 | exp(t) |
| M_INTEGRATION_002::BOUNDARY::LOWER | boundary | 1 | exp(t) |
| M_INTEGRATION_002::BOUNDARY::BELOW | failure | 1 | exp(t) |
| M_INTEGRATION_002::BOUNDARY::ABOVE | failure | 1 | exp(t) |
| M_INTEGRATION_002::PROPERTY | property | 1000 | exp(t) |
| M_INTEGRATION_002::NUMERICAL | numerical | 6 | exp(t) |

Physical validation of every row remains S0. These are computational checks.