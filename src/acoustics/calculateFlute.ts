import {
  closedHoleCorrection,
  embouchureCorrection,
  openEndCorrection,
  openHoleCorrection,
  toneHoleCutoff,
} from './corrections.ts';
import { speedOfSound } from './speedOfSound.ts';
import type { FluteInput, FluteResult, Notice } from './types.ts';

/**
 * Pure corrected cylindrical-flute solver.
 *
 * Positions begin with the acoustic half wavelength for each target and are then
 * iterated because downstream closed holes and first-open-hole inertance affect
 * the effective length together. Physical plug and blank dimensions are kept
 * separate from the sounding-length calculation.
 */
export function calculateFlute(input: FluteInput): FluteResult {
  const speedMps = speedOfSound(input.temperatureC);
  const endCorrectionMm = openEndCorrection(input.boreDiameterMm);
  const embouchureCorrectionMm = embouchureCorrection(
    input.boreDiameterMm,
    input.embouchureDiameterMm,
    input.embouchureChimneyMm,
  );
  const rootAcousticLengthMm = (speedMps * 1000) / (2 * input.fundamentalHz);
  const soundingLengthMm =
    rootAcousticLengthMm - endCorrectionMm - embouchureCorrectionMm;

  const targets = input.toneHoles
    .map((hole, originalIndex) => ({
      ...hole,
      originalIndex,
      frequencyHz: input.fundamentalHz * 2 ** (hole.cents / 1200),
    }))
    .sort((first, second) => second.frequencyHz - first.frequencyHz);

  const placed: Array<(typeof targets)[number] & { fromFootMm: number }> = [];

  for (const hole of targets) {
    const wavelengthMm = (speedMps * 1000) / hole.frequencyHz;
    const targetLengthMm = wavelengthMm / 2 - embouchureCorrectionMm;
    const openCorrectionMm = openHoleCorrection(
      input.boreDiameterMm,
      hole.diameterMm,
      input.wallThicknessMm,
    );
    let fromEmbouchureMm = targetLengthMm - openCorrectionMm;

    for (let iteration = 0; iteration < 12; iteration += 1) {
      const closedCorrectionMm = placed.reduce(
        (total, downstreamHole) =>
          total +
          closedHoleCorrection(
            input.boreDiameterMm,
            downstreamHole.diameterMm,
            input.wallThicknessMm,
            wavelengthMm,
          ),
        0,
      );
      const nextPositionMm =
        targetLengthMm - openCorrectionMm - closedCorrectionMm;

      if (Math.abs(nextPositionMm - fromEmbouchureMm) < 0.0001) {
        break;
      }
      fromEmbouchureMm = (fromEmbouchureMm + nextPositionMm) / 2;
    }

    placed.push({
      ...hole,
      fromFootMm: soundingLengthMm - fromEmbouchureMm,
    });
  }

  const ordered = placed.sort(
    (first, second) => first.originalIndex - second.originalIndex,
  );
  const holes = ordered.map((hole, index) => {
    const previous = index > 0 ? ordered[index - 1] : undefined;
    const centerSpacingMm = previous
      ? hole.fromFootMm - previous.fromFootMm
      : undefined;
    const edgeSpacingMm =
      previous && centerSpacingMm !== undefined
        ? centerSpacingMm - (hole.diameterMm + previous.diameterMm) / 2
        : undefined;

    return {
      cents: hole.cents,
      diameterMm: hole.diameterMm,
      frequencyHz: hole.frequencyHz,
      fromFootMm: hole.fromFootMm,
      fromEmbouchureMm: soundingLengthMm - hole.fromFootMm,
      centerSpacingMm,
      edgeSpacingMm,
      cutoffHz: toneHoleCutoff(
        speedMps,
        input.boreDiameterMm,
        hole.diameterMm,
        input.wallThicknessMm,
        Math.abs(centerSpacingMm ?? hole.fromFootMm),
      ),
    };
  });

  const notices: Notice[] = [];
  const calculatedValues = [
    soundingLengthMm,
    ...holes.map((hole) => hole.fromFootMm),
  ];
  if (!calculatedValues.every(Number.isFinite)) {
    notices.push({
      severity: 'error',
      message: 'The acoustic calculation is invalid; check all dimensions.',
    });
  }

  holes.forEach((hole, index) => {
    if (hole.diameterMm > input.boreDiameterMm) {
      notices.push({
        severity: 'warning',
        message: `Hole ${index + 1} is larger than the bore.`,
      });
    }
    if (hole.fromFootMm < 0 || hole.fromFootMm > soundingLengthMm) {
      notices.push({
        severity: 'error',
        message: `Hole ${index + 1} lies outside the sounding tube.`,
      });
    }
    if ((hole.edgeSpacingMm ?? 99) < 0) {
      notices.push({
        severity: 'error',
        message: `Holes ${index} and ${index + 1} physically overlap.`,
      });
    } else if ((hole.edgeSpacingMm ?? 99) < 4) {
      notices.push({
        severity: 'warning',
        message: `Hole ${index + 1} has under 4 mm edge clearance.`,
      });
    }
    if (hole.cutoffHz < hole.frequencyHz) {
      notices.push({
        severity: 'warning',
        message: `Hole ${index + 1} target is above its estimated lattice cutoff.`,
      });
    }
  });

  const boreLengthRatio = soundingLengthMm / input.boreDiameterMm;
  if (boreLengthRatio > 45 || boreLengthRatio < 8) {
    notices.push({
      severity: 'information',
      message: 'The bore-to-length ratio is unusual for a transverse flute.',
    });
  }

  const plugOffsetMm = input.plugOffsetMm ?? input.boreDiameterMm;
  const plugThicknessMm = input.plugThicknessMm ?? 12;
  const headMarginMm = input.headMarginMm ?? 8;
  const physicalLengthMm =
    soundingLengthMm + plugOffsetMm + plugThicknessMm + headMarginMm;
  const roundingMm = input.constructionRoundingMm ?? 5;
  const suggestedBlankMm =
    Math.ceil(physicalLengthMm / roundingMm) * roundingMm;

  return {
    speedOfSoundMps: speedMps,
    soundingLengthMm,
    endCorrectionMm,
    embouchureCorrectionMm,
    holes,
    plugOffsetMm,
    plugFaceMm: soundingLengthMm + plugOffsetMm,
    plugThicknessMm,
    headMarginMm,
    physicalLengthMm,
    suggestedBlankMm,
    notices,
  };
}
