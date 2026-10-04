# Compute and language

## Stack

Relay or MOSFET, then ESP32-class MCU, then RISC-V or FPGA, then PEDLER hardware. [Cat 1/2 for the names; Cat 4 for the sequence as a machine ladder]

What stays conventional even if PEDLER is present: gate drive, fuses, buck regulation, physical E-stop. [Cat 3/4]

PEDLER, in the supplied architecture, is the event path: sensor events, extraction, sparse state, decision, control, online adaptation, compilation toward an actuator command. Balanced ternary `{-1, 0, +1}` is mapped to reverse, idle, forward. [Cat 2/3]

Non-Turing, in that claim, means no global clock and no fetch-decode-execute bus as the working principle. It is not a synonym for "a different CPU". Latency and energy advantages stay validation targets. [Cat 2/5]

Flow used by the notes:

sensor events → PEDLER core → ternary logic → PANINI / PANINIq tree → register map → MOSFET / actuator. [Cat 2/4]

## Surface script

PANINIq is the specification layer in the notes: invariants, concurrency, a check before execution. Hindawi / Romenagri are surface projections. The AST does not change when the orthography changes. The laboratory demonstrates that split with one control sentence in several scripts. It does not ship a compiler. [Cat 2/3]

## Interfaces that let a workshop upgrade

Mechanical flange and shaft, 12/24 V bus, CAN or RS-485, a register map for velocity, position, current, temperature. Steel and chain can stay while the board changes. [Cat 4]
