export type Scale = { id: string; name: string; cents: number[] }

export const scales: Scale[] = [
  { id: 'major', name: 'Major / Ionian', cents: [200, 400, 500, 700, 900, 1100] },
  { id: 'minor', name: 'Natural Minor / Aeolian', cents: [200, 300, 500, 700, 800, 1000] },
  { id: 'dorian', name: 'Dorian', cents: [200, 300, 500, 700, 900, 1000] },
  { id: 'phrygian', name: 'Phrygian', cents: [100, 300, 500, 700, 800, 1000] },
  { id: 'lydian', name: 'Lydian', cents: [200, 400, 600, 700, 900, 1100] },
  { id: 'mixolydian', name: 'Mixolydian', cents: [200, 400, 500, 700, 900, 1000] },
  { id: 'locrian', name: 'Locrian', cents: [100, 300, 500, 600, 800, 1000] },
  { id: 'harmonic-minor', name: 'Harmonic Minor', cents: [200, 300, 500, 700, 800, 1100] },
  { id: 'melodic-minor', name: 'Melodic Minor ascending', cents: [200, 300, 500, 700, 900, 1100] },
  { id: 'major-pentatonic', name: 'Major Pentatonic', cents: [200, 400, 700, 900] },
  { id: 'minor-pentatonic', name: 'Minor Pentatonic', cents: [300, 500, 700, 1000] },
  { id: 'blues', name: 'Blues', cents: [300, 500, 600, 700, 1000] },
  { id: 'whole-tone', name: 'Whole Tone', cents: [200, 400, 600, 800, 1000] },
  { id: 'chromatic', name: 'Chromatic', cents: Array.from({ length: 11 }, (_, i) => (i + 1) * 100) },
]

export const scaleById = (id: string) => scales.find(s => s.id === id) ?? scales[0]
