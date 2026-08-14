/** Flutomat's fixed open-end correction: 0.30665 times the bore diameter. */
export const openEndCorrection = (boreDiameterMm: number) =>
  0.30665 * boreDiameterMm;

/** Flutomat's effective chimney height for an open tone hole. */
export const effectiveToneHoleHeight = (
  wallThicknessMm: number,
  holeDiameterMm: number,
) => wallThicknessMm + 0.75 * holeDiameterMm;

/** Flutomat's correction for a closed tone hole. */
export const closedHoleCorrection = (
  boreDiameterMm: number,
  holeDiameterMm: number,
  wallThicknessMm: number,
) => 0.25 * wallThicknessMm * (holeDiameterMm / boreDiameterMm) ** 2;

/**
 * Flutomat's active "alternative" embouchure equation. The adjusted diameter
 * is the physical opening after accounting for lip coverage.
 */
export function embouchureCorrection(
  boreDiameterMm: number,
  adjustedEmbouchureDiameterMm: number,
  wallThicknessMm: number,
) {
  const ratio = boreDiameterMm / adjustedEmbouchureDiameterMm;
  return (
    ratio ** 2 *
    (boreDiameterMm / 2 +
      wallThicknessMm +
      (0.6133 * adjustedEmbouchureDiameterMm) / 2)
  );
}

/** Flutomat's cutoff estimate for the open-hole approximation. */
export function toneHoleCutoff(
  speedMps: number,
  boreDiameterMm: number,
  holeDiameterMm: number,
  wallThicknessMm: number,
  spacingMm: number,
) {
  return (
    (0.5 * speedMps * 1000 * holeDiameterMm) /
    (Math.PI *
      boreDiameterMm *
      Math.sqrt(
        effectiveToneHoleHeight(wallThicknessMm, holeDiameterMm) *
          Math.max(spacingMm, 0.01),
      ))
  );
}
