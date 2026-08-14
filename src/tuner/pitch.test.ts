import assert from 'node:assert/strict';
import test from 'node:test';
import { adjustmentForPitch, centsBetween, detectPitch } from './pitch.ts';

test('reports cents relative to target', () => {
  assert.equal(Math.round(centsBetween(440, 440)), 0);
  assert.equal(Math.round(centsBetween(220, 440)), -1200);
});

test('detects a clean waveform', () => {
  const rate = 48000;
  const samples = Float32Array.from({ length: 4096 }, (_, index) =>
    Math.sin((2 * Math.PI * 440 * index) / rate),
  );
  assert.ok(Math.abs((detectPitch(samples, rate) ?? 0) - 440) < 1);
});

test('recommends the requested filing direction', () => {
  assert.equal(adjustmentForPitch(405, 440, 200).direction, 'embouchure');
  assert.equal(adjustmentForPitch(450, 440, 200).direction, 'foot');
});
