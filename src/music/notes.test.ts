import assert from 'node:assert/strict';
import test from 'node:test';
import { intervalFrequency, noteAtCents, noteFrequency } from './notes.ts';
import { scaleById } from './scales.ts';

test('A4 reference frequency is adjustable', () => {
  assert.equal(noteFrequency(9, 4, 440), 440);
  assert.equal(noteFrequency(9, 4, 432), 432);
});

test('cents convert to frequency ratio', () => {
  assert.ok(Math.abs(intervalFrequency(440, 1200) - 880) < 1e-9);
  assert.ok(Math.abs(intervalFrequency(440, 700) - 659.255) < 0.001);
});

test('interval note labels cross octave boundaries', () => {
  assert.equal(noteAtCents(2, 4, 1100), 'C♯5');
});

test('major and natural minor presets have exact intervals', () => {
  assert.deepEqual(scaleById('major').cents, [200, 400, 500, 700, 900, 1100]);
  assert.deepEqual(scaleById('minor').cents, [200, 300, 500, 700, 800, 1000]);
});
