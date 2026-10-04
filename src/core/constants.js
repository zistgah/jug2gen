/**
 * Classified numeric constants. Production equations import these
 * instead of scattering equivalent literals.
 *
 * Classes:
 *   mathematical, identity of a formula
 *   physical    , conventional physical standard
 *   assumption  , configurable project assumption
 *   hypothesis  , regime/threshold hypothesis
 *   fixture     , reference test input, not a law
 *   derived     , result of an independent formula
 */

export const ROD_INERTIA_FACTOR = 1 / 3;

export const NUMBER_CLASSES = {
  "1/3": {
    value: 1 / 3,
    class: "mathematical",
    where: "I = (1/3) m L^2 for a uniform rod about one end",
  },
  "9.80665": {
    value: 9.80665,
    class: "physical",
    where: "conventional standard gravity",
  },
  "0.04": {
    value: 0.04,
    class: "assumption",
    where: "illustrative proportional friction k_f",
  },
  "0.5": {
    value: 0.5,
    class: "mathematical",
    where: "uniform-rod centre-of-mass fraction λ = 1/2",
  },
  "1.2": { value: 1.2, class: "hypothesis", where: "precision-wall regime boundary, kg" },
  "10": { value: 10, class: "hypothesis", where: "Swaraj-entry regime boundary, kg" },
  "150": { value: 150, class: "hypothesis", where: "handling-wall regime boundary, kg" },
  "500": { value: 500, class: "hypothesis", where: "industrial marker, kg" },
  "72": { value: 72, class: "hypothesis", where: "reproduction-time criterion, h" },
  "50": { value: 50, class: "fixture", where: "canonical reference mass, kg" },
  "272.306233333333": {
    value: 272.306233333333,
    class: "derived",
    where: "canonical peak torque at the reference fixture",
  },
};
