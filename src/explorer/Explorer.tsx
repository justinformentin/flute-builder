import { useMemo, useState } from 'react';
import { calculateFlute } from '../acoustics/calculateFlute';
import type { FluteResult } from '../acoustics/types';
import {
  buttonClass,
  Field,
  inputClass,
  NumberInput,
} from '../components/FormControls';
import { initialDesign, type DesignState } from '../designer/designState';
import { pipeId, pipePresets } from '../materials/pipePresets';
import { noteFrequency, roots } from '../music/notes';
import { scaleById, scales } from '../music/scales';

interface ExplorerRow {
  root: number;
  octave: number;
  rootHz: number;
  result: FluteResult;
  leftoverMm: number;
}

export function Explorer({ onSelect }: { onSelect: (design: DesignState) => void }) {
  const [stockMm, setStockMm] = useState(600);
  const [pipeIndex, setPipeIndex] = useState(1);
  const [scaleId, setScaleId] = useState('major');
  const [minimumOctave, setMinimumOctave] = useState(3);
  const [maximumOctave, setMaximumOctave] = useState(5);
  const [fitsOnly, setFitsOnly] = useState(true);
  const [sort, setSort] = useState('lowest');
  const [kerfMm, setKerfMm] = useState(3);
  const [showPairs, setShowPairs] = useState(false);
  const pipe = pipePresets[pipeIndex];
  const boreMm = pipeId(pipe);
  const scale = scaleById(scaleId);

  const rows = useMemo(() => {
    const calculated: ExplorerRow[] = [];
    for (let octave = minimumOctave; octave <= maximumOctave; octave += 1) {
      for (let root = 0; root < 12; root += 1) {
        const rootHz = noteFrequency(root, octave);
        const result = calculateFlute({
          fundamentalHz: rootHz,
          boreDiameterMm: boreMm,
          wallThicknessMm: pipe.wallMm,
          embouchureDiameterMm: 10,
          embouchureChimneyMm: pipe.wallMm,
          toneHoles: scale.cents.map((cents) => ({ cents, diameterMm: 7 })),
          temperatureC: 20,
          plugOffsetMm: boreMm,
          plugThicknessMm: 12,
          headMarginMm: 8,
          constructionRoundingMm: 5,
        });
        calculated.push({
          root,
          octave,
          rootHz,
          result,
          leftoverMm: stockMm - result.suggestedBlankMm,
        });
      }
    }
    const filtered = fitsOnly
      ? calculated.filter((row) => row.leftoverMm >= 0)
      : calculated;
    return filtered.sort((a, b) =>
      sort === 'highest'
        ? b.rootHz - a.rootHz
        : sort === 'longest'
          ? b.result.suggestedBlankMm - a.result.suggestedBlankMm
          : sort === 'best-fit'
            ? Math.abs(a.leftoverMm) - Math.abs(b.leftoverMm)
            : a.rootHz - b.rootHz,
    );
  }, [
    boreMm,
    fitsOnly,
    maximumOctave,
    minimumOctave,
    pipe.wallMm,
    scale,
    sort,
    stockMm,
  ]);

  const octavePairs = rows.filter((lower) =>
    rows.some(
      (higher) =>
        higher.root === lower.root && higher.octave === lower.octave + 1,
    ),
  );
  const cutPairs = useMemo(() => {
    const pairs: Array<{
      first: ExplorerRow;
      second: ExplorerRow;
      waste: number;
    }> = [];
    rows.forEach((first, firstIndex) =>
      rows.slice(firstIndex).forEach((second) => {
        const used =
          first.result.suggestedBlankMm +
          second.result.suggestedBlankMm +
          kerfMm;
        if (used <= stockMm)
          pairs.push({ first, second, waste: stockMm - used });
      }),
    );
    return pairs.sort((a, b) => a.waste - b.waste).slice(0, 6);
  }, [kerfMm, rows, stockMm]);

  return (
    <main className="mx-auto max-w-[1500px] p-4 md:p-9">
      <p className="font-mono text-[10px] tracking-[0.2em] text-signal">
        FLUTE EXPLORER
      </p>
      <h1 className="my-2 text-3xl font-extrabold">
        What can you build from your tube?
      </h1>
      <p className="text-sm text-slate-600">
        Batch-calculate every chromatic root, compare octave pairs, and optimize
        cuts.
      </p>
      <div className="my-6 grid gap-4 border border-slate-200 bg-white p-5 md:grid-cols-3 lg:grid-cols-6">
        <Field label="Tube preset">
          <select
            className={inputClass}
            value={pipeIndex}
            onChange={(event) => setPipeIndex(Number(event.target.value))}
          >
            {pipePresets.map((item, index) => (
              <option value={index} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Stock length">
          <NumberInput value={stockMm} onChange={setStockMm} />
        </Field>
        <Field label="Scale">
          <select
            className={inputClass}
            value={scaleId}
            onChange={(event) => setScaleId(event.target.value)}
          >
            {scales.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Minimum octave">
          <NumberInput
            value={minimumOctave}
            onChange={setMinimumOctave}
            unit=""
            step={1}
          />
        </Field>
        <Field label="Maximum octave">
          <NumberInput
            value={maximumOctave}
            onChange={setMaximumOctave}
            unit=""
            step={1}
          />
        </Field>
        <Field label="Sort">
          <select
            className={inputClass}
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="lowest">Lowest pitch</option>
            <option value="highest">Highest pitch</option>
            <option value="longest">Longest flute</option>
            <option value="best-fit">Best stock fit</option>
          </select>
        </Field>
        <label className="flex items-center gap-2 text-xs font-semibold">
          <input
            type="checkbox"
            checked={fitsOnly}
            onChange={(event) => setFitsOnly(event.target.checked)}
          />{' '}
          Fits stock only
        </label>
        <button
          className={buttonClass}
          onClick={() => setShowPairs((current) => !current)}
        >
          {showPairs ? 'SHOW DESIGNS' : 'FIND OCTAVE PAIRS'}
        </button>
      </div>

      <div className="mb-4 bg-navy p-4 text-white">
        <strong className="font-mono text-2xl text-emerald-300">
          {rows.length}
        </strong>{' '}
        designs shown{' '}
        <span className="float-right hidden font-mono text-[10px] text-slate-400 md:block">
          {stockMm} mm stock · Ø7 mm holes · {scale.name}
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(showPairs ? octavePairs : rows).map((row) => (
          <ExplorerCard
            row={row}
            scaleName={scale.name}
            key={`${row.root}-${row.octave}`}
            pipeIndex={pipeIndex}
            scaleId={scaleId}
            onSelect={onSelect}
            pair={
              showPairs
                ? rows.find(
                    (higher) =>
                      higher.root === row.root &&
                      higher.octave === row.octave + 1,
                  )
                : undefined
            }
          />
        ))}
      </div>

      <section className="mt-8 border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="mr-auto">
            <h2 className="font-bold">Two-flute stock cut optimizer</h2>
            <p className="text-xs text-slate-500">
              Separate from acoustic calculations; includes one saw kerf between
              blanks.
            </p>
          </div>
          <Field label="Saw kerf">
            <NumberInput value={kerfMm} onChange={setKerfMm} />
          </Field>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {cutPairs.map((pair, index) => (
            <div className="bg-slate-100 p-4" key={index}>
              <b>
                {roots[pair.first.root].split('/')[0]}
                {pair.first.octave} + {roots[pair.second.root].split('/')[0]}
                {pair.second.octave}
              </b>
              <p className="font-mono text-xs">
                {pair.first.result.suggestedBlankMm} +{' '}
                {pair.second.result.suggestedBlankMm} + {kerfMm} mm
              </p>
              <strong className="text-teal">
                Waste: {pair.waste.toFixed(0)} mm
              </strong>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function ExplorerCard({
  row,
  scaleName,
  pipeIndex,
  scaleId,
  onSelect,
  pair,
}: {
  row: ExplorerRow;
  scaleName: string;
  pipeIndex: number;
  scaleId: string;
  onSelect: (design: DesignState) => void;
  pair?: ExplorerRow;
}) {
  const holePositions = row.result.holes.map((hole) => hole.fromFootMm);
  const spacings = row.result.holes
    .map((hole) => hole.centerSpacingMm)
    .filter((value): value is number => value !== undefined);
  return (
    <article
      className={`border border-t-[3px] bg-white p-4 ${row.leftoverMm >= 0 ? 'border-t-emerald-600' : 'border-t-slate-400 opacity-60'}`}
    >
      <span className="font-mono text-[8px] text-emerald-700">
        {row.leftoverMm >= 0 ? 'FITS STOCK' : 'TOO LONG'}
      </span>
      <h2 className="my-2 font-mono text-2xl font-bold">
        {roots[row.root].split('/')[0]}
        {row.octave}{' '}
        <small className="block font-sans text-[10px]">{scaleName}</small>
      </h2>
      <dl className="grid grid-cols-[1fr_auto] gap-2 font-mono text-[9px]">
        <dt className="text-slate-500">Frequency</dt>
        <dd>{row.rootHz.toFixed(2)} Hz</dd>
        <dt className="text-slate-500">Sounding length</dt>
        <dd>{row.result.soundingLengthMm.toFixed(1)} mm</dd>
        <dt className="text-slate-500">Suggested blank</dt>
        <dd>{row.result.suggestedBlankMm.toFixed(0)} mm</dd>
        <dt className="text-slate-500">Leftover / overrun</dt>
        <dd>{row.leftoverMm.toFixed(0)} mm</dd>
        <dt className="text-slate-500">Bore:length</dt>
        <dd>
          1:{(row.result.soundingLengthMm / pipeId(pipePresets[1])).toFixed(1)}
        </dd>
        <dt className="text-slate-500">Hole span</dt>
        <dd>
          {(Math.max(...holePositions) - Math.min(...holePositions)).toFixed(1)}{' '}
          mm
        </dd>
        <dt className="text-slate-500">Spacing range</dt>
        <dd>
          {Math.min(...spacings).toFixed(1)}–{Math.max(...spacings).toFixed(1)}{' '}
          mm
        </dd>
        {pair && (
          <>
            <dt className="text-slate-500">Octave partner</dt>
            <dd>
              {roots[pair.root].split('/')[0]}
              {pair.octave} · {(pair.rootHz / row.rootHz).toFixed(3)}×
            </dd>
          </>
        )}
      </dl>
      <button
        className="mt-3 w-full border border-navy bg-navy px-4 py-2 font-mono text-[10px] text-white hover:bg-navy/80"
        onClick={() => {
          const pipe = pipePresets[pipeIndex];
          onSelect({
            ...initialDesign,
            root: row.root,
            octave: row.octave,
            scaleId,
            pipeIndex,
            outsideDiameterMm: pipe.odMm,
            wallMm: pipe.wallMm,
            chimneyMm: pipe.wallMm,
            plugOffsetMm: pipeId(pipe),
          });
        }}
      >
        SELECT — open in Designer
      </button>
    </article>
  );
}
