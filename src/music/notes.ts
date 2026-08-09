export const roots = ['C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'] as const
const sharpNames = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']

export function noteFrequency(rootIndex: number, octave: number, a4 = 440) {
  const midi = (octave + 1) * 12 + rootIndex
  return a4 * 2 ** ((midi - 69) / 12)
}
export const intervalFrequency = (rootHz: number, cents: number) => rootHz * 2 ** (cents / 1200)
export function noteAtCents(rootIndex: number, octave: number, cents: number) {
  const midi = (octave + 1) * 12 + rootIndex + Math.round(cents / 100)
  return `${sharpNames[(midi % 12 + 12) % 12]}${Math.floor(midi / 12) - 1}`
}
