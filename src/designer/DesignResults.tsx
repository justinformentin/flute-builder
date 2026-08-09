import type { FluteResult } from '../acoustics/types';
import { buttonClass } from '../components/FormControls';
import { roots } from '../music/notes';
import type { DesignState } from './designState';

function Summary({
  design,
  result,
  rootHz,
  boreMm,
}: {
  design: DesignState;
  result: FluteResult;
  rootHz: number;
  boreMm: number;
}) {
  const acousticHalfWaveMm =
    (result.speedOfSoundMps * 1000) / (2 * rootHz);
  const items = [
    [
      'ROOT',
      `${roots[design.root].split('/')[0]}${design.octave}`,
      `${rootHz.toFixed(2)} Hz`,
    ],
    ['BORE', `${boreMm.toFixed(2)} mm`, 'internal diameter'],
    [
      'SOUNDING LENGTH',
      `${result.soundingLengthMm.toFixed(1)} mm`,
      'foot → embouchure center',
    ],
    [
      'SUGGESTED BLANK',
      `${result.suggestedBlankMm.toFixed(0)} mm`,
      'construction estimate',
    ],
  ];
  return (
    <>
      <div className="my-5 mb-0 grid grid-cols-2 bg-navy text-white lg:grid-cols-4">
        {items.map(([label, value, detail], index) => (
          <div className="border-r border-slate-600 p-5" key={label}>
            <small className="block font-mono text-[9px] text-slate-400">
              {label}
            </small>
            <strong
              className={`my-2 block font-mono text-xl ${index === 2 ? 'text-orange-300' : ''}`}
            >
              {value}
            </strong>
            <span className="text-[10px] text-slate-400">{detail}</span>
          </div>
        ))}
      </div>
      <div className="mb-5 grid gap-px bg-slate-300 font-mono text-[10px] sm:grid-cols-3">
        <div className="bg-slate-100 p-3">
          <b className="block text-slate-500">ACOUSTIC HALF-WAVE</b>
          {acousticHalfWaveMm.toFixed(1)} mm
        </div>
        <div className="bg-slate-100 p-3">
          <b className="block text-slate-500">OPEN-FOOT CORRECTION</b>
          − {result.endCorrectionMm.toFixed(1)} mm
        </div>
        <div className="bg-slate-100 p-3">
          <b className="block text-slate-500">EMBOUCHURE CORRECTION</b>
          − {result.embouchureCorrectionMm.toFixed(1)} mm
        </div>
      </div>
    </>
  );
}

function MeasurementTable({
  design,
  result,
  noteLabels,
}: {
  design: DesignState;
  result: FluteResult;
  noteLabels: string[];
}) {
  const exportPayload = { inputs: design, outputs: result };
  const csv = [
    'Feature,Note,Frequency Hz,Cents,Diameter mm,From foot center mm,From embouchure center mm,Center spacing mm,Edge spacing mm,Cutoff Hz',
    ...result.holes.map((hole, index) =>
      [
        `Hole ${index + 1}`,
        noteLabels[index],
        hole.frequencyHz,
        hole.cents,
        hole.diameterMm,
        hole.fromFootMm,
        hole.fromEmbouchureMm,
        hole.centerSpacingMm ?? '',
        hole.edgeSpacingMm ?? '',
        hole.cutoffHz,
      ].join(','),
    ),
  ].join('\n');
  return (
    <>
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <div className="mr-auto">
          <h2 className="font-bold">Construction measurements</h2>
          <p className="text-xs text-slate-500">
            All positions refer to opening centers, never hole edges.
          </p>
        </div>
        <button
          className={`${buttonClass} no-print`}
          onClick={() => navigator.clipboard.writeText(csv)}
        >
          COPY CSV
        </button>
        <button
          className={`${buttonClass} no-print`}
          onClick={() => download('flute-design.csv', csv, 'text/csv')}
        >
          CSV
        </button>
        <button
          className={`${buttonClass} no-print`}
          onClick={() =>
            download(
              'flute-design.json',
              JSON.stringify(exportPayload, null, 2),
              'application/json',
            )
          }
        >
          JSON
        </button>
        <button
          className={`${buttonClass} no-print`}
          onClick={() => window.print()}
        >
          PRINT
        </button>
      </div>
      <div className="overflow-x-auto border border-slate-200 bg-white">
        <table className="w-full min-w-[850px] border-collapse font-mono text-[11px]">
          <thead className="bg-slate-100 text-left text-[8px] tracking-wider text-slate-600">
            <tr>
              {[
                'FEATURE',
                'NOTE / TARGET',
                'DIAMETER',
                'FROM FOOT (CENTER)',
                'FROM EMBOUCHURE',
                'CENTER SPACING',
                'EDGE CLEARANCE',
                'CUTOFF',
              ].map((heading) => (
                <th className="p-3" key={heading}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.holes.map((hole, index) => (
              <tr className="border-t border-slate-200" key={index}>
                <td className="p-3">Hole {index + 1}</td>
                <td className="p-3">
                  <button
                    className="font-bold text-teal"
                    onClick={() => playTone(hole.frequencyHz)}
                  >
                    {noteLabels[index]} ↗
                  </button>
                  <small className="block text-[8px] text-slate-500">
                    +{hole.cents} cents · {hole.frequencyHz.toFixed(2)} Hz
                  </small>
                </td>
                <td className="p-3">{hole.diameterMm.toFixed(1)} mm</td>
                <td className="p-3 font-bold">
                  {hole.fromFootMm.toFixed(1)} mm
                </td>
                <td className="p-3">{hole.fromEmbouchureMm.toFixed(1)} mm</td>
                <td className="p-3">
                  {hole.centerSpacingMm?.toFixed(1) ?? '—'} mm
                </td>
                <td className="p-3">
                  {hole.edgeSpacingMm?.toFixed(1) ?? '—'} mm
                </td>
                <td className="p-3">{hole.cutoffHz.toFixed(0)} Hz</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {result.notices.length > 0 && (
        <div className="mt-4 space-y-2">
          {result.notices.map((notice, index) => (
            <p
              className={`border-l-4 p-3 text-xs ${notice.severity === 'error' ? 'border-red-600 bg-red-50' : notice.severity === 'warning' ? 'border-amber-500 bg-amber-50' : 'border-teal bg-cyan-50'}`}
              key={index}
            >
              <b className="mr-2 font-mono text-[9px] uppercase">
                {notice.severity}
              </b>
              {notice.message}
            </p>
          ))}
        </div>
      )}
    </>
  );
}
function playTone(frequencyHz: number) {
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.value = frequencyHz;
  gain.gain.setValueAtTime(0.12, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.65);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.7);
}

function download(filename: string, contents: string, type: string) {
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(new Blob([contents], { type }));
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

export function DesignResults({
  design,
  result,
  rootHz,
  boreMm,
  noteLabels,
}: {
  design: DesignState;
  result: FluteResult;
  rootHz: number;
  boreMm: number;
  noteLabels: string[];
}) {
  return (
    <>
      <Summary
        design={design}
        result={result}
        rootHz={rootHz}
        boreMm={boreMm}
      />
      <MeasurementTable
        design={design}
        result={result}
        noteLabels={noteLabels}
      />
    </>
  );
}
