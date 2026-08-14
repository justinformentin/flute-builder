import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateFlute } from './calculateFlute.ts';
import {
  closedHoleCorrection,
  embouchureCorrection,
  openEndCorrection,
} from './corrections.ts';
import { flutomatSpeedOfSoundMps, speedOfSound } from './speedOfSound.ts';

const standardInput = {
  fundamentalHz: 587.3295358,
  boreDiameterMm: 15.798,
  wallThicknessMm: 2.769,
  embouchureDiameterMm: 10,
  embouchureChimneyMm: 2.769,
  toneHoles: [200, 400, 500, 700, 900, 1100].map((cents, index) => ({
    cents,
    diameterMm: [7.9, 9.5, 7.9, 7.9, 7.9, 9.5][index],
  })),
  temperatureC: 20,
  plugOffsetMm: 15.798,
  plugThicknessMm: 12,
  headMarginMm: 8,
  constructionRoundingMm: 5,
};

test('speed of sound uses temperature correction', () => {
  assert.equal(speedOfSound(20), 343.42);
});

test('correction terms match documented equations', () => {
  assert.ok(Math.abs(openEndCorrection(15.798) - 4.8445) < 0.001);
  assert.ok(Math.abs(closedHoleCorrection(15.798, 7.9, 2.769) - 0.173) < 0.001);
  assert.ok(Math.abs(embouchureCorrection(15.798, 10, 2.769) - 34.278) < 0.001);
});

test('D5 regression reproduces Flutomat measurements', () => {
  const result = calculateFlute(standardInput);
  assert.ok(Math.abs(result.soundingLengthMm - 253.5515) < 0.001);
  assert.deepEqual(
    result.holes.map((hole) => Number(hole.fromFootMm.toFixed(1))),
    [47, 72.1, 83.4, 112.8, 131.3, 146.3],
  );
  assert.equal(result.suggestedBlankMm, 290);
});

test('lip plate chimney changes acoustic dimensions', () => {
  const plain = calculateFlute(standardInput);
  const plated = calculateFlute({
    ...standardInput,
    embouchureChimneyMm: 4.37,
  });
  assert.notEqual(plain.soundingLengthMm, plated.soundingLengthMm);
  assert.ok(plated.embouchureCorrectionMm > plain.embouchureCorrectionMm);
});

test('lip coverage uses Flutomat adjusted embouchure diameter', () => {
  const uncovered = calculateFlute(standardInput);
  const covered = calculateFlute({
    ...standardInput,
    lipCoveragePercent: 17,
  });

  assert.ok(covered.embouchureCorrectionMm > uncovered.embouchureCorrectionMm);
  assert.ok(covered.soundingLengthMm < uncovered.soundingLengthMm);
  assert.ok(Math.abs(covered.soundingLengthMm - 240) < 0.1);
});

test('plug and blank dimensions do not change the acoustic layout', () => {
  const first = calculateFlute(standardInput);
  const second = calculateFlute({
    ...standardInput,
    plugOffsetMm: 35,
    plugThicknessMm: 20,
    headMarginMm: 15,
    constructionRoundingMm: 10,
  });

  assert.equal(second.soundingLengthMm, first.soundingLengthMm);
  assert.deepEqual(second.holes, first.holes);
  assert.notEqual(second.physicalLengthMm, first.physicalLengthMm);
  assert.notEqual(second.suggestedBlankMm, first.suggestedBlankMm);
});

test('temperature adjustment can be disabled independently', () => {
  const cold = calculateFlute({
    ...standardInput,
    temperatureC: 0,
    adjustSpeedForTemperature: true,
  });
  const fixed = calculateFlute({
    ...standardInput,
    temperatureC: 0,
    adjustSpeedForTemperature: false,
  });

  assert.equal(fixed.speedOfSoundMps, flutomatSpeedOfSoundMps);
  assert.notEqual(fixed.soundingLengthMm, cold.soundingLengthMm);
});

test('individual acoustic correction groups can be disabled', () => {
  const result = calculateFlute({
    ...standardInput,
    applyEndCorrection: false,
    applyEmbouchureCorrection: false,
    applyToneHoleCorrections: false,
  });
  const halfWaveMm =
    (result.speedOfSoundMps * 1000) /
    (2 * Math.round(standardInput.fundamentalHz));

  assert.equal(result.endCorrectionMm, 0);
  assert.equal(result.embouchureCorrectionMm, 0);
  assert.ok(Math.abs(result.soundingLengthMm - halfWaveMm) < 0.0001);
  result.holes.forEach((hole) => {
    const expected = (result.speedOfSoundMps * 1000) / (2 * hole.frequencyHz);
    assert.ok(Math.abs(hole.fromEmbouchureMm - expected) < 0.0001);
  });
});
