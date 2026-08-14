export function centsBetween(measuredHz: number, targetHz: number) {
  return 1200 * Math.log2(measuredHz / targetHz);
}

/** Autocorrelation pitch detector tuned for monophonic flute input. */
export function detectPitch(
  samples: Float32Array,
  sampleRate: number,
  minimumHz = 100,
  maximumHz = 2000,
) {
  let rms = 0;
  for (const sample of samples) rms += sample * sample;
  rms = Math.sqrt(rms / samples.length);
  if (rms < 0.01) return null;

  const minimumLag = Math.max(2, Math.floor(sampleRate / maximumHz));
  const maximumLag = Math.min(
    samples.length - 2,
    Math.ceil(sampleRate / minimumHz),
  );
  let bestLag = -1;
  let bestCorrelation = 0;
  const correlations = new Float32Array(maximumLag + 1);

  for (let lag = minimumLag; lag <= maximumLag; lag += 1) {
    let correlation = 0;
    let energyA = 0;
    let energyB = 0;
    for (let index = 0; index < samples.length - lag; index += 1) {
      const a = samples[index];
      const b = samples[index + lag];
      correlation += a * b;
      energyA += a * a;
      energyB += b * b;
    }
    correlations[lag] = correlation / Math.sqrt(energyA * energyB);
    if (
      correlations[lag] > bestCorrelation &&
      correlations[lag] >= correlations[lag - 1]
    ) {
      bestCorrelation = correlations[lag];
      bestLag = lag;
    }
  }
  if (bestLag < 0 || bestCorrelation < 0.75) return null;

  const left = correlations[bestLag - 1];
  const center = correlations[bestLag];
  const right = correlations[bestLag + 1];
  const denominator = left - 2 * center + right;
  const offset = denominator === 0 ? 0 : (0.5 * (left - right)) / denominator;
  return sampleRate / (bestLag + Math.max(-1, Math.min(1, offset)));
}

export function adjustmentForPitch(
  measuredHz: number,
  targetHz: number,
  fromEmbouchureMm: number,
) {
  const cents = centsBetween(measuredHz, targetHz);
  const centerShiftMm = Math.abs(
    fromEmbouchureMm * (1 - measuredHz / targetHz),
  );
  return {
    cents,
    direction: cents < 0 ? ('embouchure' as const) : ('foot' as const),
    enlargementMm: centerShiftMm * 2,
  };
}
