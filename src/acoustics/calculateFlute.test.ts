import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateFlute } from './calculateFlute.ts';
import {
  embouchureCorrection,
  openEndCorrection,
  openHoleCorrection,
} from './corrections.ts';
import { speedOfSound } from './speedOfSound.ts';

const standardInput = {
  fundamentalHz: 293.6647679,
  boreDiameterMm: 20.93,
  wallThicknessMm: 2.87,
  embouchureDiameterMm: 10,
  embouchureChimneyMm: 2.87,
  toneHoles: [200, 400, 500, 700, 900, 1100].map((cents) => ({
    cents,
    diameterMm: 7,
  })),
  temperatureC: 20,
  plugOffsetMm: 20.93,
  plugThicknessMm: 12,
  headMarginMm: 8,
  constructionRoundingMm: 5,
};

test('speed of sound uses temperature correction', () => {
  assert.equal(speedOfSound(20), 343.42);
});

test('correction terms match documented equations', () => {
  assert.ok(Math.abs(openEndCorrection(20.93) - 6.418) < 0.001);
  assert.ok(Math.abs(openHoleCorrection(20.93, 7, 2.87) - 49.126) < 0.01);
  assert.ok(Math.abs(embouchureCorrection(20.93, 10, 2.87) - 29.0) < 0.01);
});

test('entire corrected flute regression produces stable measurements', () => {
  const result = calculateFlute(standardInput);
  assert.ok(Math.abs(result.soundingLengthMm - 549.296) < 0.05);
  assert.deepEqual(
    result.holes.map((hole) => Number(hole.fromFootMm.toFixed(2))),
    [109.59, 165.81, 191.24, 238.41, 280.37, 317.68],
  );
  assert.equal(result.suggestedBlankMm, 595);
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
  const cold = calculateFlute({ ...standardInput, temperatureC: 0 });
  const fixed = calculateFlute({
    ...standardInput,
    temperatureC: 0,
    adjustSpeedForTemperature: false,
  });

  assert.equal(fixed.speedOfSoundMps, speedOfSound(20));
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
    (result.speedOfSoundMps * 1000) / (2 * standardInput.fundamentalHz);

  assert.equal(result.endCorrectionMm, 0);
  assert.equal(result.embouchureCorrectionMm, 0);
  assert.ok(Math.abs(result.soundingLengthMm - halfWaveMm) < 0.0001);
  result.holes.forEach((hole) => {
    const expected = (result.speedOfSoundMps * 1000) / (2 * hole.frequencyHz);
    assert.ok(Math.abs(hole.fromEmbouchureMm - expected) < 0.0001);
  });
});
