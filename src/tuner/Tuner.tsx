import { useEffect, useMemo, useRef, useState } from 'react';
import { calculateFlute } from '../acoustics/calculateFlute';
import { buttonClass, inputClass } from '../components/FormControls';
import type { DesignState } from '../designer/designState';
import { noteAtCents, noteFrequency } from '../music/notes';
import { scaleById } from '../music/scales';
import { adjustmentForPitch, centsBetween, detectPitch } from './pitch';

type ListeningState = 'idle' | 'requesting' | 'listening' | 'error';

export function Tuner({ design }: { design: DesignState }) {
  const scale = scaleById(design.scaleId);
  const rootHz = noteFrequency(design.root, design.octave, design.a4);
  const boreMm = design.outsideDiameterMm - 2 * design.wallMm;
  const result = useMemo(
    () =>
      calculateFlute({
        fundamentalHz: rootHz,
        boreDiameterMm: boreMm,
        wallThicknessMm: design.wallMm,
        embouchureDiameterMm: design.embouchureMm,
        embouchureChimneyMm: design.overrideChimney
          ? design.chimneyMm
          : design.wallMm + (design.lipPlate ? design.lipPlateMm : 0),
        toneHoles: scale.cents.map((cents, index) => ({
          cents,
          diameterMm: design.holeDiameters[index] ?? 7,
        })),
        temperatureC: design.temperatureC,
        adjustSpeedForTemperature: design.adjustSpeedForTemperature,
        applyEndCorrection: design.applyEndCorrection,
        applyEmbouchureCorrection: design.applyEmbouchureCorrection,
        applyToneHoleCorrections: design.applyToneHoleCorrections,
      }),
    [boreMm, design, rootHz, scale.cents],
  );
  const notes = result.holes.map((hole, index) => ({
    ...hole,
    label: noteAtCents(design.root, design.octave, scale.cents[index]),
  }));
  const [selected, setSelected] = useState(0);
  const [measuredHz, setMeasuredHz] = useState<number | null>(null);
  const [status, setStatus] = useState<ListeningState>('idle');
  const [error, setError] = useState('');
  const cleanup = useRef<() => void>(() => undefined);
  const selectedNote = notes[Math.min(selected, notes.length - 1)];

  useEffect(() => () => cleanup.current(), []);
  useEffect(() => setMeasuredHz(null), [selected]);

  const start = async () => {
    cleanup.current();
    setStatus('requesting');
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      const context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 4096;
      context.createMediaStreamSource(stream).connect(analyser);
      const samples = new Float32Array(analyser.fftSize);
      let frame = 0;
      const tick = () => {
        analyser.getFloatTimeDomainData(samples);
        const pitch = detectPitch(
          samples,
          context.sampleRate,
          Math.max(70, selectedNote.frequencyHz / 2),
          selectedNote.frequencyHz * 2,
        );
        if (
          pitch &&
          Math.abs(centsBetween(pitch, selectedNote.frequencyHz)) < 1200
        ) {
          setMeasuredHz((previous) =>
            previous === null ? pitch : previous * 0.75 + pitch * 0.25,
          );
        }
        frame = requestAnimationFrame(tick);
      };
      cleanup.current = () => {
        cancelAnimationFrame(frame);
        stream.getTracks().forEach((track) => track.stop());
        void context.close();
      };
      setStatus('listening');
      tick();
    } catch (caught) {
      setStatus('error');
      setError(
        caught instanceof Error
          ? caught.message
          : 'Microphone access was not available.',
      );
    }
  };
  const stop = () => {
    cleanup.current();
    setStatus('idle');
  };
  const adjustment = measuredHz
    ? adjustmentForPitch(
        measuredHz,
        selectedNote.frequencyHz,
        selectedNote.fromEmbouchureMm,
      )
    : null;
  const cents = adjustment?.cents ?? 0;
  const inTune = Math.abs(cents) <= 5;

  return (
    <main className="mx-auto min-h-[calc(100vh-50px)] max-w-6xl px-5 py-10">
      <div className="mb-8 max-w-2xl">
        <span className="font-mono text-[10px] tracking-[0.2em] text-teal">
          LIVE WORKBENCH
        </span>
        <h1 className="mt-2 text-3xl font-extrabold">Tune your flute</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Choose a hole from your current design, allow microphone access, then
          sustain the note. The tuner averages your pitch and translates it into
          a careful filing direction.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <section className="border border-slate-200 bg-white p-5">
          <label className="mb-2 block font-mono text-[9px] tracking-wider text-slate-500">
            HOLE / TARGET NOTE
          </label>
          <select
            className={inputClass}
            value={selected}
            onChange={(event) => setSelected(Number(event.target.value))}
          >
            {notes.map((note, index) => (
              <option value={index} key={index}>
                Hole {index + 1} · {note.label} · {note.frequencyHz.toFixed(2)}{' '}
                Hz
              </option>
            ))}
          </select>
          <dl className="mt-6 space-y-4 border-t border-slate-200 pt-5 text-xs">
            <div className="flex justify-between">
              <dt className="text-slate-500">Current diameter</dt>
              <dd className="font-mono font-bold">
                {selectedNote.diameterMm.toFixed(1)} mm
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">From embouchure</dt>
              <dd className="font-mono font-bold">
                {selectedNote.fromEmbouchureMm.toFixed(1)} mm
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Reference A4</dt>
              <dd className="font-mono font-bold">{design.a4} Hz</dd>
            </div>
          </dl>
          <button
            className={`${buttonClass} mt-6 w-full bg-navy py-3 text-white`}
            onClick={status === 'listening' ? stop : start}
            disabled={status === 'requesting'}
          >
            {status === 'listening'
              ? 'STOP LISTENING'
              : status === 'requesting'
                ? 'REQUESTING MICROPHONE…'
                : 'ENABLE MICROPHONE'}
          </button>
          {error && (
            <p className="mt-3 border-l-4 border-red-500 bg-red-50 p-3 text-xs text-red-800">
              {error}
            </p>
          )}
        </section>
        <section className="overflow-hidden border border-slate-200 bg-navy text-white">
          <div className="p-7 text-center sm:p-10">
            <div className="font-mono text-xs tracking-widest text-slate-400">
              TARGET {selectedNote.label} ·{' '}
              {selectedNote.frequencyHz.toFixed(2)} HZ
            </div>
            <div className="relative mx-auto mt-10 h-28 max-w-2xl border-b border-slate-600">
              <div className="absolute bottom-0 left-1/2 h-full w-px bg-white/30" />
              <div
                className="absolute bottom-0 h-20 w-1 -translate-x-1/2 bg-signal transition-all duration-150"
                style={{
                  left: `${Math.max(4, Math.min(96, 50 + cents / 2))}%`,
                }}
              />
              <span className="absolute bottom-2 left-2 font-mono text-[9px] text-slate-400">
                FLAT
              </span>
              <span className="absolute bottom-2 right-2 font-mono text-[9px] text-slate-400">
                SHARP
              </span>
            </div>
            <div
              className={`mt-7 font-mono text-6xl font-medium ${inTune && measuredHz ? 'text-emerald-300' : 'text-white'}`}
            >
              {measuredHz ? `${cents > 0 ? '+' : ''}${cents.toFixed(1)}¢` : '—'}
            </div>
            <div className="mt-2 font-mono text-sm text-slate-400">
              {measuredHz
                ? `${measuredHz.toFixed(2)} Hz`
                : status === 'listening'
                  ? 'Play and sustain the selected note'
                  : 'Microphone is off'}
            </div>
          </div>
          <div className="border-t border-slate-700 bg-white p-6 text-ink sm:p-8">
            {!adjustment ? (
              <p className="text-center text-sm text-slate-500">
                A filing recommendation will appear after a stable pitch is
                detected.
              </p>
            ) : inTune ? (
              <p className="text-center font-bold text-emerald-700">
                In tune — no adjustment needed.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <span className="font-mono text-[9px] tracking-wider text-slate-500">
                    CAREFUL ADJUSTMENT
                  </span>
                  <p className="mt-1 text-lg font-bold">
                    Enlarge approximately {adjustment.enlargementMm.toFixed(2)}{' '}
                    mm toward the {adjustment.direction}.
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Remove material from that edge only, in very small steps,
                    then re-test. This estimate treats the one-sided enlargement
                    as a hole-center shift; bore, chimney, breath pressure, and
                    hole diameter also affect pitch.
                  </p>
                </div>
                <div
                  className={`px-5 py-3 font-mono text-xs font-bold ${cents < 0 ? 'bg-cyan-50 text-teal' : 'bg-orange-50 text-orange-700'}`}
                >
                  {cents < 0 ? 'FLAT → HEAD' : 'SHARP → FOOT'}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
      <p className="mt-5 text-[10px] leading-4 text-slate-500">
        Safety: drilling and filing are irreversible. Confirm the reading across
        several steady notes and remove less material than the estimate before
        measuring again.
      </p>
    </main>
  );
}
