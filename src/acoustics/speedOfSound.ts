/** Cramer-style linear approximation for ordinary workshop temperatures. */
export const speedOfSound = (temperatureC: number) =>
  331.3 + 0.606 * temperatureC;
