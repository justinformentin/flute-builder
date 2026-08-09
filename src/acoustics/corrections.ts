/** Unflanged circular pipe radiation correction (0.6133 × radius). */
export const openEndCorrection = (boreDiameterMm: number) =>
  (0.6133 * boreDiameterMm) / 2;

/** Equivalent bore length of a side opening, including its chimney and radiation mass. */
export function openHoleCorrection(
  boreMm: number,
  holeMm: number,
  chimneyMm: number,
) {
  return (boreMm / holeMm) ** 2 * (chimneyMm + (0.75 * holeMm) / 2);
}

/** Closed side branches add compliance. This corrected form uses each hole's own area. */
export function closedHoleCorrection(
  boreMm: number,
  holeMm: number,
  chimneyMm: number,
  wavelengthMm: number,
) {
  const branch = chimneyMm + (0.75 * holeMm) / 2;
  return (
    (holeMm / boreMm) ** 2 * branch * (1 + branch / Math.max(wavelengthMm, 1))
  );
}

export function embouchureCorrection(
  boreMm: number,
  embouchureMm: number,
  chimneyMm: number,
) {
  return (boreMm / embouchureMm) ** 2 * (chimneyMm + (0.75 * embouchureMm) / 2);
}

/** First lattice cutoff estimate for a tone hole at spacing s. */
export function toneHoleCutoff(
  speedMps: number,
  boreMm: number,
  holeMm: number,
  chimneyMm: number,
  spacingMm: number,
) {
  const te = chimneyMm + (0.75 * holeMm) / 2;
  return (
    (((speedMps * 1000) / (2 * Math.PI)) * holeMm) /
    boreMm /
    Math.sqrt(Math.max(te * spacingMm, 0.01))
  );
}
