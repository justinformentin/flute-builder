import {
  closedHoleCorrection,
  effectiveToneHoleHeight,
  embouchureCorrection,
  openEndCorrection,
  toneHoleCutoff,
} from './corrections.ts';
import { flutomatSpeedOfSoundMps, speedOfSound } from './speedOfSound.ts';
import type { FluteInput, FluteResult, Notice } from './types.ts';

/**
 * Flutomat's Benade-equation solver, translated from findLocations2().
 * Internal locations share Flutomat's undefined acoustic origin; public
 * measurements are converted to physical distances from the open foot.
 */
export function calculateFlute(input: FluteInput): FluteResult {
  // Flutomat rounds its MIDI-derived key pitch before calculating intervals.
  const fundamentalHz = Math.round(input.fundamentalHz);
  const speedMps =
    input.adjustSpeedForTemperature === true
      ? speedOfSound(input.temperatureC)
      : flutomatSpeedOfSoundMps;
  const applyEndCorrection = input.applyEndCorrection !== false;
  const applyEmbouchureCorrection = input.applyEmbouchureCorrection !== false;
  const applyToneHoleCorrections = input.applyToneHoleCorrections !== false;
  const endCorrectionMm = applyEndCorrection
    ? openEndCorrection(input.boreDiameterMm)
    : 0;
  const adjustedEmbouchureDiameterMm =
    input.embouchureDiameterMm *
    (1 - Math.min(99, Math.max(0, input.lipCoveragePercent ?? 0)) / 100);
  const embouchureCorrectionMm = applyEmbouchureCorrection
    ? embouchureCorrection(
        input.boreDiameterMm,
        adjustedEmbouchureDiameterMm,
        input.embouchureChimneyMm,
      )
    : 0;

  const targets = input.toneHoles.map((hole) => ({
    ...hole,
    frequencyHz: fundamentalHz * 2 ** (hole.cents / 1200),
  }));
  const closedCorrection = (index: number) =>
    applyToneHoleCorrections
      ? closedHoleCorrection(
          input.boreDiameterMm,
          targets[index].diameterMm,
          input.wallThicknessMm,
        )
      : 0;

  let endX = (speedMps * 1000 * 0.5) / fundamentalHz;
  endX -= endCorrectionMm;
  let closedHoleCorrectionMm = 0;
  targets.forEach((_, index) => {
    const correctionMm = closedCorrection(index);
    closedHoleCorrectionMm += correctionMm;
    endX -= correctionMm;
  });

  const acousticLocations: number[] = [];
  if (targets.length > 0) {
    let halfWave = (speedMps * 1000 * 0.5) / targets[0].frequencyHz;
    for (let index = 1; index < targets.length; index += 1) {
      halfWave -= closedCorrection(index);
    }

    if (applyToneHoleCorrections) {
      const areaRatio = (targets[0].diameterMm / input.boreDiameterMm) ** 2;
      const a = areaRatio;
      const b = -(endX + halfWave) * areaRatio;
      const c =
        endX * halfWave * areaRatio +
        effectiveToneHoleHeight(input.wallThicknessMm, targets[0].diameterMm) *
          (halfWave - endX);
      acousticLocations[0] = smallerQuadraticRoot(a, b, c);
    } else {
      acousticLocations[0] = halfWave;
    }

    for (let index = 1; index < targets.length; index += 1) {
      halfWave = (speedMps * 1000 * 0.5) / targets[index].frequencyHz;
      if (index < targets.length - 1) {
        for (
          let closedIndex = index;
          closedIndex < targets.length;
          closedIndex += 1
        ) {
          halfWave -= closedCorrection(closedIndex);
        }
      }

      if (applyToneHoleCorrections) {
        const holeCalculation =
          effectiveToneHoleHeight(
            input.wallThicknessMm,
            targets[index].diameterMm,
          ) *
          (input.boreDiameterMm / targets[index].diameterMm) ** 2;
        const a = 2;
        const b =
          -acousticLocations[index - 1] - 3 * halfWave + holeCalculation;
        const c =
          acousticLocations[index - 1] * (halfWave - holeCalculation) +
          halfWave ** 2;
        acousticLocations[index] = smallerQuadraticRoot(a, b, c);
      } else {
        acousticLocations[index] = halfWave;
      }
    }
  }

  const soundingLengthMm = endX - embouchureCorrectionMm;
  const holes = targets.map((hole, index) => {
    const fromFootMm = endX - acousticLocations[index];
    const previousFromFootMm =
      index > 0 ? endX - acousticLocations[index - 1] : undefined;
    const centerSpacingMm =
      previousFromFootMm === undefined
        ? undefined
        : fromFootMm - previousFromFootMm;
    const edgeSpacingMm =
      centerSpacingMm === undefined
        ? undefined
        : centerSpacingMm -
          (hole.diameterMm + targets[index - 1].diameterMm) / 2;
    const cutoffSpacingMm =
      index === 0
        ? fromFootMm
        : acousticLocations[index - 1] - acousticLocations[index];

    return {
      ...hole,
      fromFootMm,
      fromEmbouchureMm: soundingLengthMm - fromFootMm,
      centerSpacingMm,
      edgeSpacingMm,
      cutoffHz: toneHoleCutoff(
        speedMps,
        input.boreDiameterMm,
        hole.diameterMm,
        input.wallThicknessMm,
        cutoffSpacingMm,
      ),
    };
  });

  const notices = buildNotices(input, soundingLengthMm, holes);
  const plugOffsetMm = input.plugOffsetMm ?? input.boreDiameterMm;
  const plugThicknessMm = input.plugThicknessMm ?? 12;
  const headMarginMm = input.headMarginMm ?? 8;
  const physicalLengthMm =
    soundingLengthMm + plugOffsetMm + plugThicknessMm + headMarginMm;
  const roundingMm = input.constructionRoundingMm ?? 5;

  return {
    speedOfSoundMps: speedMps,
    soundingLengthMm,
    endCorrectionMm,
    closedHoleCorrectionMm,
    embouchureCorrectionMm,
    holes,
    plugOffsetMm,
    plugFaceMm: soundingLengthMm + plugOffsetMm,
    plugThicknessMm,
    headMarginMm,
    physicalLengthMm,
    suggestedBlankMm: Math.ceil(physicalLengthMm / roundingMm) * roundingMm,
    notices,
  };
}

function smallerQuadraticRoot(a: number, b: number, c: number) {
  return (-b - Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a);
}

function buildNotices(
  input: FluteInput,
  soundingLengthMm: number,
  holes: FluteResult['holes'],
) {
  const notices: Notice[] = [];
  const calculatedValues = [
    soundingLengthMm,
    ...holes.flatMap((hole) => [hole.fromFootMm, hole.cutoffHz]),
  ];
  if (!calculatedValues.every(Number.isFinite)) {
    notices.push({
      severity: 'error',
      message: 'The acoustic calculation is invalid; check all dimensions.',
    });
  }

  holes.forEach((hole, index) => {
    if (hole.diameterMm > input.boreDiameterMm * 0.9) {
      notices.push({
        severity: 'warning',
        message: `Hole ${index + 1} exceeds Flutomat's 90% bore limit.`,
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
        message: `Holes ${index} and ${index + 1} have only ${hole.edgeSpacingMm?.toFixed(1)} mm edge clearance (${hole.centerSpacingMm?.toFixed(1)} mm center-to-center).`,
      });
    }
    if (hole.cutoffHz < hole.frequencyHz) {
      notices.push({
        severity: 'warning',
        message: `Hole ${index + 1} target is above its estimated lattice cutoff.`,
      });
    }
  });
  return notices;
}
