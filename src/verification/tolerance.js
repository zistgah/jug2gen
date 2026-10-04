/**
 * Central numerical comparison policy.
 * Equivalence is not byte identity.
 */

export const TOLERANCE = {
  algebraic: { absolute: 1e-12, relative: 1e-12 },
  floating: { absolute: 1e-9, relative: 1e-9 },
  integration: { absolute: 1e-6, relative: 1e-6 },
  geometry: { absolute: 1e-6, relative: 1e-4 },
  iterative: { absolute: 1e-4, relative: 2e-2 },
};

export function compare(actual, expected, policy = TOLERANCE.floating) {
  const absoluteError = Math.abs(actual - expected);
  const scale = Math.abs(expected);
  const relativeError = scale === 0 ? absoluteError : absoluteError / scale;
  const limit = policy.absolute + policy.relative * scale;
  return {
    actual,
    expected,
    absoluteError,
    relativeError,
    limit,
    pass: absoluteError <= limit,
  };
}

export function assertClose(actual, expected, policy = TOLERANCE.floating, message = "") {
  const result = compare(actual, expected, policy);
  if (!result.pass) {
    const err = new Error(
      `${message} not close: actual=${actual} expected=${expected} abs=${result.absoluteError} rel=${result.relativeError} limit=${result.limit}`
    );
    err.comparison = result;
    throw err;
  }
  return result;
}
