import { useEffect, useMemo, useState } from 'react';
import { calculateFlute } from '../acoustics/calculateFlute';
import { FluteDiagram } from '../components/FluteDiagram';
import {
  buttonClass,
  Field,
  inputClass,
  NumberInput,
  Section,
} from '../components/FormControls';
import { pipeId, pipePresets } from '../materials/pipePresets';
import { noteAtCents, noteFrequency, roots } from '../music/notes';
import { scaleById, scales } from '../music/scales';
import { DesignResults } from './DesignResults';
import { initialDesign, type DesignState } from './designState';

export function Designer() {
  const [design, setDesign] = useState<DesignState>(() => {
    const query = new URLSearchParams(window.location.search);
    const saved = localStorage.getItem('flute-builder-design');
    const base = saved
      ? { ...initialDesign, ...JSON.parse(saved) }
      : initialDesign;
    const rootName = query.get('root');
    const rootIndex = roots.findIndex(
      (root) => root.split('/')[0] === rootName,
    );
    return {
      ...base,
      root: rootIndex >= 0 ? rootIndex : base.root,
      octave: Number(query.get('octave')) || base.octave,
      scaleId: query.get('scale') || base.scaleId,
    };
  });

  const update = <Key extends keyof DesignState>(
    key: Key,
    value: DesignState[Key],
  ) => {
    setDesign((current) => ({ ...current, [key]: value }));
  };

  const scale = scaleById(design.scaleId);
  const boreMm = design.outsideDiameterMm - 2 * design.wallMm;
  const rootHz = noteFrequency(design.root, design.octave, design.a4);
  const effectiveChimneyMm = design.overrideChimney
    ? design.chimneyMm
    : design.wallMm + (design.lipPlate ? design.lipPlateMm : 0);

  const result = useMemo(
    () =>
      calculateFlute({
        fundamentalHz: rootHz,
        boreDiameterMm: boreMm,
        wallThicknessMm: design.wallMm,
        embouchureDiameterMm: design.embouchureMm,
        embouchureChimneyMm: effectiveChimneyMm,
        lipCoveragePercent: design.lipCoveragePercent,
        toneHoles: scale.cents.map((cents, index) => ({
          cents,
          diameterMm: design.holeDiameters[index] ?? 7,
        })),
        temperatureC: design.temperatureC,
        adjustSpeedForTemperature: design.adjustSpeedForTemperature,
        applyEndCorrection: design.applyEndCorrection,
        applyEmbouchureCorrection: design.applyEmbouchureCorrection,
        applyToneHoleCorrections: design.applyToneHoleCorrections,
        plugOffsetMm: design.plugOffsetMm,
        plugThicknessMm: design.plugThicknessMm,
        headMarginMm: design.headMarginMm,
        constructionRoundingMm: design.roundToMm,
      }),
    [boreMm, design, effectiveChimneyMm, rootHz, scale],
  );

  const noteLabels = scale.cents.map((cents) =>
    noteAtCents(design.root, design.octave, cents),
  );

  useEffect(() => {
    localStorage.setItem('flute-builder-design', JSON.stringify(design));
    const query = new URLSearchParams({
      root: roots[design.root].split('/')[0],
      octave: String(design.octave),
      scale: design.scaleId,
      pipe: pipePresets[design.pipeIndex]?.id ?? 'custom',
      emb: String(design.embouchureMm),
      holes: design.holeDiameters.slice(0, scale.cents.length).join(','),
    });
    window.history.replaceState(null, '', `?${query}`);
  }, [design, scale.cents.length]);

  const selectPipe = (pipeIndex: number) => {
    const pipe = pipePresets[pipeIndex];
    setDesign((current) => ({
      ...current,
      pipeIndex,
      outsideDiameterMm: pipe.odMm,
      wallMm: pipe.wallMm,
      plugOffsetMm: pipeId(pipe),
    }));
  };

  const setAllHoles = (diameterMm: number) => {
    update(
      'holeDiameters',
      design.holeDiameters.map(() => diameterMm),
    );
  };

  return (
    <main className="grid min-h-[calc(100vh-70px)] grid-cols-1 xl:grid-cols-[410px_minmax(700px,1fr)]">
      <aside className="border-r border-slate-300 bg-white xl:sticky xl:top-0 xl:h-[calc(100vh-70px)] xl:overflow-y-auto">
        <div className="flex justify-between border-b border-slate-200 p-5 font-mono text-[10px] tracking-wider">
          <span>DESIGN INPUTS</span>
          <span className="text-slate-400">Instant recalculation</span>
        </div>

        <Section number="01" title="Pitch & tuning">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Root">
              <select
                className={inputClass}
                value={design.root}
                onChange={(event) => update('root', Number(event.target.value))}
              >
                {roots.map((root, index) => (
                  <option key={root} value={index}>
                    {root}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Octave">
              <select
                className={inputClass}
                value={design.octave}
                onChange={(event) =>
                  update('octave', Number(event.target.value))
                }
              >
                {[2, 3, 4, 5, 6, 7].map((octave) => (
                  <option key={octave}>{octave}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Scale">
            <select
              className={inputClass}
              value={design.scaleId}
              onChange={(event) => update('scaleId', event.target.value)}
            >
              {scales.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Reference A4">
              <NumberInput
                value={design.a4}
                onChange={(value) => update('a4', value)}
                unit="Hz"
                step={1}
              />
            </Field>
            <Field label="Root frequency">
              <output className={inputClass}>{rootHz.toFixed(2)} Hz</output>
            </Field>
          </div>
        </Section>

        <Section number="02" title="Tube geometry">
          <Field label="Tube preset">
            <select
              className={inputClass}
              value={design.pipeIndex}
              onChange={(event) => selectPipe(Number(event.target.value))}
            >
              {pipePresets.map((pipe, index) => (
                <option key={pipe.id} value={index}>
                  {pipe.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Outside diameter">
              <NumberInput
                value={design.outsideDiameterMm}
                onChange={(value) => update('outsideDiameterMm', value)}
              />
            </Field>
            <Field label="Wall thickness">
              <NumberInput
                value={design.wallMm}
                onChange={(value) => update('wallMm', value)}
              />
            </Field>
          </div>
          <div className="flex justify-between bg-slate-100 p-3 font-mono text-[10px] text-slate-500">
            INTERNAL BORE{' '}
            <strong className="text-teal">{boreMm.toFixed(3)} mm</strong>
          </div>
          <p className="text-[10px] leading-4 text-slate-500">
            Pipe dimensions vary by manufacturer and tolerance. For best
            results, measure your actual pipe with calipers.
          </p>
        </Section>

        <Section number="03" title="Embouchure">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Opening diameter">
              <NumberInput
                value={design.embouchureMm}
                onChange={(value) => update('embouchureMm', value)}
              />
            </Field>
            <Field label="Effective chimney">
              <output className={inputClass}>
                {effectiveChimneyMm.toFixed(2)} mm
              </output>
            </Field>
          </div>
          <Field label="Lip coverage">
            <NumberInput
              value={design.lipCoveragePercent}
              onChange={(value) => update('lipCoveragePercent', value)}
              unit="%"
            />
          </Field>
          <label className="flex items-center gap-2 text-xs font-semibold">
            <input
              type="checkbox"
              checked={design.lipPlate}
              onChange={(event) => update('lipPlate', event.target.checked)}
            />
            Lip plate enabled
          </label>
          {design.lipPlate && (
            <Field label="Lip plate thickness">
              <NumberInput
                value={design.lipPlateMm}
                onChange={(value) => update('lipPlateMm', value)}
              />
            </Field>
          )}
          <label className="flex items-center gap-2 text-xs font-semibold">
            <input
              type="checkbox"
              checked={design.overrideChimney}
              onChange={(event) =>
                update('overrideChimney', event.target.checked)
              }
            />
            Override effective chimney
          </label>
          {design.overrideChimney && (
            <Field label="Effective chimney override">
              <NumberInput
                value={design.chimneyMm}
                onChange={(value) => update('chimneyMm', value)}
              />
            </Field>
          )}
        </Section>

        <Section number="04" title="Tone holes">
          <div className="flex items-center gap-1">
            <span className="mr-auto font-mono text-[9px]">SET ALL</span>
            {[6, 7, 8, 9].map((diameter) => (
              <button
                className={buttonClass}
                key={diameter}
                onClick={() => setAllHoles(diameter)}
              >
                {diameter} mm
              </button>
            ))}
          </div>
          {scale.cents.map((cents, index) => (
            <div
              className="grid grid-cols-[30px_1fr_90px_70px] items-center gap-2 border-t border-slate-200 py-2"
              key={`${cents}-${index}`}
            >
              <strong className="bg-navy p-2 text-center font-mono text-[10px] text-white">
                H{index + 1}
              </strong>
              <span>
                <b className="block text-xs">{noteLabels[index]}</b>
                <small className="block font-mono text-[9px] text-slate-500">
                  +{cents} cents
                </small>
              </span>
              <NumberInput
                value={design.holeDiameters[index]}
                onChange={(value) =>
                  update(
                    'holeDiameters',
                    design.holeDiameters.map((diameter, itemIndex) =>
                      itemIndex === index ? value : diameter,
                    ),
                  )
                }
              />
              <output className="text-right font-mono text-[10px]">
                {result.holes[index]?.fromFootMm.toFixed(1)} mm
              </output>
            </div>
          ))}
        </Section>

        <Section number="05" title="Construction & advanced">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Plug offset">
              <NumberInput
                value={design.plugOffsetMm}
                onChange={(value) => update('plugOffsetMm', value)}
              />
            </Field>
            <Field label="Plug thickness">
              <NumberInput
                value={design.plugThicknessMm}
                onChange={(value) => update('plugThicknessMm', value)}
              />
            </Field>
            <Field label="Head margin">
              <NumberInput
                value={design.headMarginMm}
                onChange={(value) => update('headMarginMm', value)}
              />
            </Field>
            <Field label="Round blank up to">
              <NumberInput
                value={design.roundToMm}
                onChange={(value) => update('roundToMm', value)}
              />
            </Field>
            <Field label="Temperature">
              <NumberInput
                value={design.temperatureC}
                onChange={(value) => update('temperatureC', value)}
                unit="°C"
              />
            </Field>
            <Field label="Acoustic model">
              <output className={inputClass}>Flutomat / Benade</output>
            </Field>
          </div>
          <div className="mt-3 grid gap-2 border border-slate-200 p-3 text-xs">
            {[
              [
                'adjustSpeedForTemperature',
                'Temperature-adjust speed (Flutomat uses fixed 345 m/s)',
              ],
              ['applyEndCorrection', 'Open-foot end correction'],
              ['applyEmbouchureCorrection', 'Embouchure correction'],
              ['applyToneHoleCorrections', 'Tone-hole corrections'],
            ].map(([key, label]) => (
              <label className="flex items-center gap-2" key={key}>
                <input
                  type="checkbox"
                  checked={Boolean(design[key as keyof DesignState])}
                  onChange={(event) =>
                    update(key as keyof DesignState, event.target.checked)
                  }
                />
                {label}
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Plug offset positions the plug face and also contributes to the
            stock estimate. Plug thickness, head margin, and blank rounding
            affect only the stock estimate. None of these settings move the
            embouchure or tone holes. The default model is a direct translation
            of Flutomat's Benade-equation solver; switches are provided for
            auditing its correction groups.
          </p>
        </Section>
      </aside>

      <article className="min-w-0 p-4 md:p-8">
        <div className="flex justify-between font-mono text-[10px] tracking-wider">
          <span>SCALED CONSTRUCTION VIEW</span>
          <span className="text-teal">CENTER MEASUREMENTS</span>
        </div>
        <FluteDiagram result={result} labels={noteLabels} />
        <DesignResults
          design={design}
          result={result}
          rootHz={rootHz}
          boreMm={boreMm}
          noteLabels={noteLabels}
        />
      </article>
    </main>
  );
}
