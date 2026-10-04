# The abstraction layer and the joint firmware

© 1993–2026 Abhishek Choudhary. All rights reserved. AyeAI.

Corrected and completed from the October 2026 discussions. The derivations below were checked symbolically and numerically for this repository; the discussion text had lost its equations.

## The HAL state vector

The discussion fixed the layout at 18 joints: a 2-joint head, two 6-joint arms and two 2-joint legs. Two hip-pitch and knee-pitch joints per leg cannot balance a biped, which needs about six per leg, and the target configuration has more than fifty joints. So the joint count is a parameter generated from the body plan, not a constant. [Cat 3, correction]

```c
/* hal.h: generated for a body plan; HAL_NUM_JOINTS and HAL_CONTACT_POINTS come from the plan. */
#include <stdint.h>
#include <stdalign.h>
#ifndef HAL_NUM_JOINTS
#define HAL_NUM_JOINTS 18
#endif
#ifndef HAL_CONTACT_POINTS
#define HAL_CONTACT_POINTS 4
#endif
typedef struct { alignas(32) float pos[3], quat[4], lin_vel[3], ang_vel[3], lin_acc[3]; } hal_base_t;
typedef struct { alignas(32) float q[HAL_NUM_JOINTS], qd[HAL_NUM_JOINTS], qdd[HAL_NUM_JOINTS]; } hal_joints_t;
typedef struct { alignas(32) float est[HAL_NUM_JOINTS], cmd[HAL_NUM_JOINTS], raw[HAL_NUM_JOINTS]; } hal_torque_t;
typedef struct { alignas(32) float K[HAL_NUM_JOINTS], B[HAL_NUM_JOINTS], M[HAL_NUM_JOINTS]; } hal_impedance_t;
typedef struct { alignas(16) float force[3], cop[2]; uint16_t contact_mask, status; } hal_contact_t;
typedef struct {
    alignas(64) uint64_t timestamp_ns;
    uint32_t sequence;                 /* monotonic loop counter */
    hal_base_t base;
    hal_joints_t joints;
    hal_torque_t torque;
    hal_impedance_t impedance;
    hal_contact_t contacts[HAL_CONTACT_POINTS];
    uint32_t events;                   /* point-event word, below */
    uint32_t limit_mask[(HAL_NUM_JOINTS + 31) / 32]; /* one bit per joint, any joint count */
} hal_state_t;
```

The point-event word keeps faults, thermal throttling and emergency stop in bits 0 to 7, contact triggers in bits 8 to 15 and a heartbeat in bits 24 to 31. Joint-limit flags move to their own bitmap, because 18 bits cannot serve fifty joints. [Cat 4, correction]

**Exchange between the 10 kHz motor loop and the 1 kHz cognitive loop.** A double buffer with two volatile indices is not lock-free safe: `volatile` gives no ordering between cores. Use a sequence lock with C11 atomics. The writer increments the sequence to an odd value, writes the frame, and increments it again to an even value, with release ordering. The reader copies the frame and retries if the sequence was odd or changed, with acquire ordering. Alternatively use a triple buffer with an atomic swap. [Cat 2, correction]

## Field-oriented control and torque

\(\tau_m = K_t I_q\), with \(K_t = \tfrac{3}{2} p \lambda_{pm}\) for a permanent-magnet synchronous motor in amplitude-invariant dq form. Phase currents are sampled at 10 kHz. [Cat 2]

## The disturbance observer

**Plant.** Joint position \(q\), velocity \(\dot{q}\) and a lumped, slowly varying disturbance \(\tau_d\) (friction not modelled separately, Coriolis terms, external load), with inertia \(J\) and input \(u = \tau_m\):

\[ \dot{\mathbf{x}} = \begin{bmatrix} 0 & 1 & 0 \ 0 & 0 & -1/J \ 0 & 0 & 0 \end{bmatrix} \mathbf{x} + \begin{bmatrix} 0 \ 1/J \ 0 \end{bmatrix} u, \qquad y = \begin{bmatrix} 1 & 0 & 0 \end{bmatrix} \mathbf{x}, \qquad \mathbf{x} = \begin{bmatrix} q \ \dot{q} \ \tau_d \end{bmatrix}. \]

**Exact discretisation** at sample time \(T\). The state matrix is nilpotent, \(\mathbf{A}_c^3 = 0\), so the series stops after three terms:

\[ \mathbf{A}_d = \begin{bmatrix} 1 & T & -T^2/2J \ 0 & 1 & -T/J \ 0 & 0 & 1 \end{bmatrix}, \qquad \mathbf{B}_d = \begin{bmatrix} T^2/2J \ T/J \ 0 \end{bmatrix}. \]

**The observer, predict then correct.** Each cycle predicts \(\hat{\mathbf{x}}^-[k] = \mathbf{A}_d \hat{\mathbf{x}}[k-1] + \mathbf{B}_d u[k-1]\), samples the encoder, and corrects \(\hat{\mathbf{x}}[k] = \hat{\mathbf{x}}^-[k] + \mathbf{L}(y[k] - \hat{q}^-[k])\). Its error obeys \(\mathbf{e}[k] = (\mathbf{I} - \mathbf{L}\mathbf{C})\mathbf{A}_d\, \mathbf{e}[k-1]\).

**Gains.** For a critically damped observer of bandwidth \(\omega_o\), place all three poles at \(\lambda = e^{-\omega_o T}\) and write \(\alpha = 1 - \lambda\). Matching \(\det(z\mathbf{I} - (\mathbf{I} - \mathbf{L}\mathbf{C})\mathbf{A}_d) = (z - \lambda)^3\) gives

\[ l_1 = 1 - \lambda^3, \qquad l_2 = \frac{3\alpha^2 (2 - \alpha)}{2T}, \qquad l_3 = -\frac{J \alpha^3}{T^2}. \]

The negative \(l_3\) follows from the \(-1/J\) by which the disturbance enters. If the observer is written instead in prediction form, with error matrix \(\mathbf{A}_d - \mathbf{L}\mathbf{C}\), then \(l_1 = 3\alpha\), \(l_2 = (\lambda^3 + 3\lambda^2 - 9\lambda + 5)/2T\), and \(l_3\) is unchanged. The discussion described the first form but quoted the error matrix of the second; the gains must match the form the firmware runs. [Cat 2, derived and checked]

**Worked numbers.** At \(T = 100\ \mu\)s and \(\omega_o = 628\) rad/s, \(\lambda = 0.939131\) and \(\alpha = 0.060869\). Then \(l_1 = 0.171717\) and \(l_2 = 107.77\ \text{s}^{-1}\). With \(J = 0.01\ \text{kg m}^2\), \(l_3 = -225.5\ \text{N m}\). The eigenvalues of \((\mathbf{I} - \mathbf{L}\mathbf{C})\mathbf{A}_d\) were computed at these values and all three equal \(\lambda\). The HAL's \(\tau_{est}\) is the corrected disturbance state \(\hat{\tau}_d[k]\). [Cat 2]

## Friction, feed-forward

Coulomb, Stribeck and viscous friction, as one function of velocity:

\[ \tau_f(\dot{q}) = \left( \tau_c + (\tau_s - \tau_c)\, e^{-(\dot{q}/\dot{q}_s)^2} \right) \operatorname{sgn}(\dot{q}) + f_v \dot{q}, \qquad \tau_s > \tau_c. \]

Replace \(\operatorname{sgn}\) with \(\tanh(k \dot{q})\) so that encoder noise at standstill does not make the torque chatter. Feed the estimate forward from the observer's own velocity, \(\hat{\tau}_f[k-1] = \tau_f(\hat{\dot{q}}[k-1])\), and predict with \(u[k-1] - \hat{\tau}_f[k-1]\) in place of \(u[k-1]\). The correction step is unchanged. With friction removed, \(\hat{\tau}_d\) stays near zero in free motion and jumps on contact, so it reads as contact force alone. [Cat 2/3]

## Identifying the friction of each joint

1. **Remove gravity.** Drive at constant velocity, so that \(J\ddot{q} = 0\), and subtract the gravity model, \(\tau_f = K_t I_q - \tau_g(q)\), or test in an orientation where gravity torque is zero.
2. **Coulomb and viscous.** Sweep constant velocities well above \(\dot{q}_s\), for example 0.1, 0.5, 1.0 and 2.0 rad/s in both directions, averaging one second of 10 kHz data at each. The intercept of \(\tau_f\) against \(\dot{q}\) gives \(\tau_c\) and the slope gives \(f_v\).
3. **Breakaway.** Ramp torque slowly from zero with the other joints held, record the torque at first motion above the encoder noise, and average over several angles for cogging. This gives \(\tau_s\).
4. **Stribeck velocity.** Sweep very slow velocities, for example 0.001 to 0.1 rad/s.
5. **Fit.** Fit all of the data at once by non-linear least squares (Levenberg-Marquardt), and store the four values in the joint's parameter block in firmware. [Cat 2]
