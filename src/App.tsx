import { useEffect, useMemo, useState } from 'react'
import { calculateFlute } from './acoustics/calculateFlute'
import type { FluteResult } from './acoustics/types'
import { FluteDiagram } from './components/FluteDiagram'
import { pipeId, pipePresets } from './materials/pipePresets'
import { noteAtCents, noteFrequency, roots } from './music/notes'
import { scaleById, scales } from './music/scales'

const inputClass =
  'mt-1 h-9 w-full border border-slate-300 bg-white px-2 font-mono text-xs text-ink outline-none focus:border-teal focus:ring-1 focus:ring-teal'
const buttonClass =
  'border border-slate-300 bg-white px-3 py-2 font-mono text-[10px] font-medium hover:border-teal hover:text-teal'

interface DesignState {
  root: number
  octave: number
  scaleId: string
  a4: number
  pipeIndex: number
  outsideDiameterMm: number
  wallMm: number
  embouchureMm: number
  lipPlate: boolean
  lipPlateMm: number
  overrideChimney: boolean
  chimneyMm: number
  holeDiameters: number[]
  temperatureC: number
  plugOffsetMm: number
  plugThicknessMm: number
  headMarginMm: number
  roundToMm: number
}

const initialDesign: DesignState = {
  root: 2,
  octave: 4,
  scaleId: 'major',
  a4: 440,
  pipeIndex: 1,
  outsideDiameterMm: pipePresets[1].odMm,
  wallMm: pipePresets[1].wallMm,
  embouchureMm: 10,
  lipPlate: false,
  lipPlateMm: 1.5,
  overrideChimney: false,
  chimneyMm: pipePresets[1].wallMm,
  holeDiameters: Array(11).fill(7),
  temperatureC: 20,
  plugOffsetMm: pipeId(pipePresets[1]),
  plugThicknessMm: 12,
  headMarginMm: 8,
  roundToMm: 5,
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block font-mono text-[9px] font-medium uppercase tracking-wider text-slate-600">
      {label}
      {children}
    </label>
  )
}

function NumberInput({
  value,
  onChange,
  unit = 'mm',
  step = 0.1,
}: {
  value: number
  onChange: (value: number) => void
  unit?: string
  step?: number
}) {
  return (
    <span className="mt-1 flex">
      <input
        className={`${inputClass} mt-0 min-w-0`}
        type="number"
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="flex items-center border border-l-0 border-slate-300 bg-slate-100 px-2 font-mono text-[10px]">
        {unit}
      </span>
    </span>
  )
}

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-slate-200 p-5">
      <h2 className="mb-4 font-mono text-[10px] font-medium text-signal">
        {number} <span className="ml-2 font-sans text-sm font-extrabold text-ink">{title}</span>
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function Header({ page, setPage }: { page: 'designer' | 'explorer'; setPage: (page: 'designer' | 'explorer') => void }) {
  return (
    <header className="flex h-[70px] items-center justify-between border-b-[3px] border-signal bg-navy px-4 text-white md:px-7">
      <div className="flex items-center gap-3">
        <span className="border border-slate-500 p-2 font-mono">FB</span>
        <div>
          <strong className="block">Flute Builder</strong>
          <small className="hidden font-mono text-[9px] tracking-[0.18em] text-slate-400 sm:block">
            CYLINDRICAL ACOUSTIC WORKBENCH
          </small>
        </div>
      </div>
      <nav className="flex h-full">
        {(['designer', 'explorer'] as const).map((item) => (
          <button
            className={`border-b-[3px] px-4 text-sm font-bold capitalize md:px-7 ${
              page === item ? 'border-white bg-white/5 text-white' : 'border-transparent text-slate-400'
            }`}
            key={item}
            onClick={() => setPage(item)}
          >
            {item === 'explorer' ? 'Flute Explorer' : 'Designer'}
          </button>
        ))}
      </nav>
      <span className="hidden font-mono text-[10px] tracking-wider text-emerald-300 lg:block">● LIVE CALCULATION</span>
    </header>
  )
}

function Designer() {
  const [design, setDesign] = useState<DesignState>(() => {
    const query = new URLSearchParams(window.location.search)
    const saved = localStorage.getItem('flute-builder-design')
    const base = saved ? { ...initialDesign, ...JSON.parse(saved) } : initialDesign
    const rootName = query.get('root')
    const rootIndex = roots.findIndex((root) => root.split('/')[0] === rootName)
    return {
      ...base,
      root: rootIndex >= 0 ? rootIndex : base.root,
      octave: Number(query.get('octave')) || base.octave,
      scaleId: query.get('scale') || base.scaleId,
    }
  })

  const update = <Key extends keyof DesignState>(key: Key, value: DesignState[Key]) => {
    setDesign((current) => ({ ...current, [key]: value }))
  }

  const scale = scaleById(design.scaleId)
  const boreMm = design.outsideDiameterMm - 2 * design.wallMm
  const rootHz = noteFrequency(design.root, design.octave, design.a4)
  const effectiveChimneyMm = design.overrideChimney
    ? design.chimneyMm
    : design.wallMm + (design.lipPlate ? design.lipPlateMm : 0)

  const result = useMemo(
    () =>
      calculateFlute({
        fundamentalHz: rootHz,
        boreDiameterMm: boreMm,
        wallThicknessMm: design.wallMm,
        embouchureDiameterMm: design.embouchureMm,
        embouchureChimneyMm: effectiveChimneyMm,
        toneHoles: scale.cents.map((cents, index) => ({
          cents,
          diameterMm: design.holeDiameters[index] ?? 7,
        })),
        temperatureC: design.temperatureC,
        plugOffsetMm: design.plugOffsetMm,
        plugThicknessMm: design.plugThicknessMm,
        headMarginMm: design.headMarginMm,
        constructionRoundingMm: design.roundToMm,
      }),
    [boreMm, design, effectiveChimneyMm, rootHz, scale],
  )

  const noteLabels = scale.cents.map((cents) => noteAtCents(design.root, design.octave, cents))

  useEffect(() => {
    localStorage.setItem('flute-builder-design', JSON.stringify(design))
    const query = new URLSearchParams({
      root: roots[design.root].split('/')[0],
      octave: String(design.octave),
      scale: design.scaleId,
      pipe: pipePresets[design.pipeIndex]?.id ?? 'custom',
      emb: String(design.embouchureMm),
      holes: design.holeDiameters.slice(0, scale.cents.length).join(','),
    })
    window.history.replaceState(null, '', `?${query}`)
  }, [design, scale.cents.length])

  const selectPipe = (pipeIndex: number) => {
    const pipe = pipePresets[pipeIndex]
    setDesign((current) => ({
      ...current,
      pipeIndex,
      outsideDiameterMm: pipe.odMm,
      wallMm: pipe.wallMm,
      plugOffsetMm: pipeId(pipe),
    }))
  }

  const setAllHoles = (diameterMm: number) => {
    update('holeDiameters', design.holeDiameters.map(() => diameterMm))
  }

  return (
    <main className="grid min-h-[calc(100vh-70px)] grid-cols-1 xl:grid-cols-[410px_minmax(700px,1fr)]">
      <aside className="border-r border-slate-300 bg-white">
        <div className="flex justify-between border-b border-slate-200 p-5 font-mono text-[10px] tracking-wider">
          <span>DESIGN INPUTS</span>
          <span className="text-slate-400">Instant recalculation</span>
        </div>

        <Section number="01" title="Pitch & tuning">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Root">
              <select className={inputClass} value={design.root} onChange={(event) => update('root', Number(event.target.value))}>
                {roots.map((root, index) => <option key={root} value={index}>{root}</option>)}
              </select>
            </Field>
            <Field label="Octave">
              <select className={inputClass} value={design.octave} onChange={(event) => update('octave', Number(event.target.value))}>
                {[2, 3, 4, 5, 6, 7].map((octave) => <option key={octave}>{octave}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Scale">
            <select className={inputClass} value={design.scaleId} onChange={(event) => update('scaleId', event.target.value)}>
              {scales.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Reference A4"><NumberInput value={design.a4} onChange={(value) => update('a4', value)} unit="Hz" step={1} /></Field>
            <Field label="Root frequency"><output className={inputClass}>{rootHz.toFixed(2)} Hz</output></Field>
          </div>
        </Section>

        <Section number="02" title="Tube geometry">
          <Field label="Tube preset">
            <select className={inputClass} value={design.pipeIndex} onChange={(event) => selectPipe(Number(event.target.value))}>
              {pipePresets.map((pipe, index) => <option key={pipe.id} value={index}>{pipe.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Outside diameter"><NumberInput value={design.outsideDiameterMm} onChange={(value) => update('outsideDiameterMm', value)} /></Field>
            <Field label="Wall thickness"><NumberInput value={design.wallMm} onChange={(value) => update('wallMm', value)} /></Field>
          </div>
          <div className="flex justify-between bg-slate-100 p-3 font-mono text-[10px] text-slate-500">
            INTERNAL BORE <strong className="text-teal">{boreMm.toFixed(3)} mm</strong>
          </div>
          <p className="text-[10px] leading-4 text-slate-500">Pipe dimensions vary by manufacturer and tolerance. For best results, measure your actual pipe with calipers.</p>
        </Section>

        <Section number="03" title="Embouchure">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Opening diameter"><NumberInput value={design.embouchureMm} onChange={(value) => update('embouchureMm', value)} /></Field>
            <Field label="Effective chimney"><output className={inputClass}>{effectiveChimneyMm.toFixed(2)} mm</output></Field>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold">
            <input type="checkbox" checked={design.lipPlate} onChange={(event) => update('lipPlate', event.target.checked)} />
            Lip plate enabled
          </label>
          {design.lipPlate && <Field label="Lip plate thickness"><NumberInput value={design.lipPlateMm} onChange={(value) => update('lipPlateMm', value)} /></Field>}
          <label className="flex items-center gap-2 text-xs font-semibold">
            <input type="checkbox" checked={design.overrideChimney} onChange={(event) => update('overrideChimney', event.target.checked)} />
            Override effective chimney
          </label>
          {design.overrideChimney && <Field label="Effective chimney override"><NumberInput value={design.chimneyMm} onChange={(value) => update('chimneyMm', value)} /></Field>}
        </Section>

        <Section number="04" title="Tone holes">
          <div className="flex items-center gap-1">
            <span className="mr-auto font-mono text-[9px]">SET ALL</span>
            {[6, 7, 8, 9].map((diameter) => <button className={buttonClass} key={diameter} onClick={() => setAllHoles(diameter)}>{diameter} mm</button>)}
          </div>
          {scale.cents.map((cents, index) => (
            <div className="grid grid-cols-[30px_1fr_90px_70px] items-center gap-2 border-t border-slate-200 py-2" key={`${cents}-${index}`}>
              <strong className="bg-navy p-2 text-center font-mono text-[10px] text-white">H{index + 1}</strong>
              <span><b className="block text-xs">{noteLabels[index]}</b><small className="block font-mono text-[9px] text-slate-500">+{cents} cents</small></span>
              <NumberInput value={design.holeDiameters[index]} onChange={(value) => update('holeDiameters', design.holeDiameters.map((diameter, itemIndex) => itemIndex === index ? value : diameter))} />
              <output className="text-right font-mono text-[10px]">{result.holes[index]?.fromFootMm.toFixed(1)} mm</output>
            </div>
          ))}
        </Section>

        <Section number="05" title="Construction & advanced">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Plug offset"><NumberInput value={design.plugOffsetMm} onChange={(value) => update('plugOffsetMm', value)} /></Field>
            <Field label="Plug thickness"><NumberInput value={design.plugThicknessMm} onChange={(value) => update('plugThicknessMm', value)} /></Field>
            <Field label="Head margin"><NumberInput value={design.headMarginMm} onChange={(value) => update('headMarginMm', value)} /></Field>
            <Field label="Round blank up to"><NumberInput value={design.roundToMm} onChange={(value) => update('roundToMm', value)} /></Field>
            <Field label="Temperature"><NumberInput value={design.temperatureC} onChange={(value) => update('temperatureC', value)} unit="°C" /></Field>
            <Field label="Acoustic model"><output className={inputClass}>Corrected Flutomat</output></Field>
          </div>
        </Section>
      </aside>

      <article className="min-w-0 p-4 md:p-8">
        <div className="flex justify-between font-mono text-[10px] tracking-wider"><span>SCALED CONSTRUCTION VIEW</span><span className="text-teal">CENTER MEASUREMENTS</span></div>
        <FluteDiagram result={result} labels={noteLabels} />
        <Summary design={design} result={result} rootHz={rootHz} boreMm={boreMm} />
        <MeasurementTable design={design} result={result} noteLabels={noteLabels} />
      </article>
    </main>
  )
}

function Summary({ design, result, rootHz, boreMm }: { design: DesignState; result: FluteResult; rootHz: number; boreMm: number }) {
  const items = [
    ['ROOT', `${roots[design.root].split('/')[0]}${design.octave}`, `${rootHz.toFixed(2)} Hz`],
    ['BORE', `${boreMm.toFixed(2)} mm`, 'internal diameter'],
    ['SOUNDING LENGTH', `${result.soundingLengthMm.toFixed(1)} mm`, 'foot → embouchure center'],
    ['SUGGESTED BLANK', `${result.suggestedBlankMm.toFixed(0)} mm`, 'construction estimate'],
  ]
  return (
    <div className="my-5 grid grid-cols-2 bg-navy text-white lg:grid-cols-4">
      {items.map(([label, value, detail], index) => (
        <div className="border-r border-slate-600 p-5" key={label}>
          <small className="block font-mono text-[9px] text-slate-400">{label}</small>
          <strong className={`my-2 block font-mono text-xl ${index === 2 ? 'text-orange-300' : ''}`}>{value}</strong>
          <span className="text-[10px] text-slate-400">{detail}</span>
        </div>
      ))}
    </div>
  )
}

function MeasurementTable({ design, result, noteLabels }: { design: DesignState; result: FluteResult; noteLabels: string[] }) {
  const exportPayload = { inputs: design, outputs: result }
  const csv = ['Feature,Note,Frequency Hz,Cents,Diameter mm,From foot center mm,From embouchure center mm,Center spacing mm,Edge spacing mm,Cutoff Hz', ...result.holes.map((hole, index) => [`Hole ${index + 1}`, noteLabels[index], hole.frequencyHz, hole.cents, hole.diameterMm, hole.fromFootMm, hole.fromEmbouchureMm, hole.centerSpacingMm ?? '', hole.edgeSpacingMm ?? '', hole.cutoffHz].join(','))].join('\n')
  return (
    <>
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <div className="mr-auto"><h2 className="font-bold">Construction measurements</h2><p className="text-xs text-slate-500">All positions refer to opening centers, never hole edges.</p></div>
        <button className={`${buttonClass} no-print`} onClick={() => navigator.clipboard.writeText(csv)}>COPY CSV</button>
        <button className={`${buttonClass} no-print`} onClick={() => download('flute-design.csv', csv, 'text/csv')}>CSV</button>
        <button className={`${buttonClass} no-print`} onClick={() => download('flute-design.json', JSON.stringify(exportPayload, null, 2), 'application/json')}>JSON</button>
        <button className={`${buttonClass} no-print`} onClick={() => window.print()}>PRINT</button>
      </div>
      <div className="overflow-x-auto border border-slate-200 bg-white">
        <table className="w-full min-w-[850px] border-collapse font-mono text-[11px]">
          <thead className="bg-slate-100 text-left text-[8px] tracking-wider text-slate-600"><tr>{['FEATURE', 'NOTE / TARGET', 'DIAMETER', 'FROM FOOT (CENTER)', 'FROM EMBOUCHURE', 'CENTER SPACING', 'EDGE CLEARANCE', 'CUTOFF'].map((heading) => <th className="p-3" key={heading}>{heading}</th>)}</tr></thead>
          <tbody>{result.holes.map((hole, index) => <tr className="border-t border-slate-200" key={index}><td className="p-3">Hole {index + 1}</td><td className="p-3"><button className="font-bold text-teal" onClick={() => playTone(hole.frequencyHz)}>{noteLabels[index]} ↗</button><small className="block text-[8px] text-slate-500">+{hole.cents} cents · {hole.frequencyHz.toFixed(2)} Hz</small></td><td className="p-3">{hole.diameterMm.toFixed(1)} mm</td><td className="p-3 font-bold">{hole.fromFootMm.toFixed(1)} mm</td><td className="p-3">{hole.fromEmbouchureMm.toFixed(1)} mm</td><td className="p-3">{hole.centerSpacingMm?.toFixed(1) ?? '—'} mm</td><td className="p-3">{hole.edgeSpacingMm?.toFixed(1) ?? '—'} mm</td><td className="p-3">{hole.cutoffHz.toFixed(0)} Hz</td></tr>)}</tbody>
        </table>
      </div>
      {result.notices.length > 0 && <div className="mt-4 space-y-2">{result.notices.map((notice, index) => <p className={`border-l-4 p-3 text-xs ${notice.severity === 'error' ? 'border-red-600 bg-red-50' : notice.severity === 'warning' ? 'border-amber-500 bg-amber-50' : 'border-teal bg-cyan-50'}`} key={index}><b className="mr-2 font-mono text-[9px] uppercase">{notice.severity}</b>{notice.message}</p>)}</div>}
    </>
  )
}

interface ExplorerRow { root: number; octave: number; rootHz: number; result: FluteResult; leftoverMm: number }

function Explorer() {
  const [stockMm, setStockMm] = useState(600)
  const [pipeIndex, setPipeIndex] = useState(1)
  const [scaleId, setScaleId] = useState('major')
  const [minimumOctave, setMinimumOctave] = useState(3)
  const [maximumOctave, setMaximumOctave] = useState(5)
  const [fitsOnly, setFitsOnly] = useState(true)
  const [sort, setSort] = useState('lowest')
  const [kerfMm, setKerfMm] = useState(3)
  const [showPairs, setShowPairs] = useState(false)
  const pipe = pipePresets[pipeIndex]
  const boreMm = pipeId(pipe)
  const scale = scaleById(scaleId)

  const rows = useMemo(() => {
    const calculated: ExplorerRow[] = []
    for (let octave = minimumOctave; octave <= maximumOctave; octave += 1) {
      for (let root = 0; root < 12; root += 1) {
        const rootHz = noteFrequency(root, octave)
        const result = calculateFlute({ fundamentalHz: rootHz, boreDiameterMm: boreMm, wallThicknessMm: pipe.wallMm, embouchureDiameterMm: 10, embouchureChimneyMm: pipe.wallMm, toneHoles: scale.cents.map((cents) => ({ cents, diameterMm: 7 })), temperatureC: 20, plugOffsetMm: boreMm, plugThicknessMm: 12, headMarginMm: 8, constructionRoundingMm: 5 })
        calculated.push({ root, octave, rootHz, result, leftoverMm: stockMm - result.suggestedBlankMm })
      }
    }
    const filtered = fitsOnly ? calculated.filter((row) => row.leftoverMm >= 0) : calculated
    return filtered.sort((a, b) => sort === 'highest' ? b.rootHz - a.rootHz : sort === 'longest' ? b.result.suggestedBlankMm - a.result.suggestedBlankMm : sort === 'best-fit' ? Math.abs(a.leftoverMm) - Math.abs(b.leftoverMm) : a.rootHz - b.rootHz)
  }, [boreMm, fitsOnly, maximumOctave, minimumOctave, pipe.wallMm, scale, sort, stockMm])

  const octavePairs = rows.filter((lower) => rows.some((higher) => higher.root === lower.root && higher.octave === lower.octave + 1))
  const cutPairs = useMemo(() => {
    const pairs: Array<{ first: ExplorerRow; second: ExplorerRow; waste: number }> = []
    rows.forEach((first, firstIndex) => rows.slice(firstIndex).forEach((second) => {
      const used = first.result.suggestedBlankMm + second.result.suggestedBlankMm + kerfMm
      if (used <= stockMm) pairs.push({ first, second, waste: stockMm - used })
    }))
    return pairs.sort((a, b) => a.waste - b.waste).slice(0, 6)
  }, [kerfMm, rows, stockMm])

  return (
    <main className="mx-auto max-w-[1500px] p-4 md:p-9">
      <p className="font-mono text-[10px] tracking-[0.2em] text-signal">FLUTE EXPLORER</p>
      <h1 className="my-2 text-3xl font-extrabold">What can you build from your tube?</h1>
      <p className="text-sm text-slate-600">Batch-calculate every chromatic root, compare octave pairs, and optimize cuts.</p>
      <div className="my-6 grid gap-4 border border-slate-200 bg-white p-5 md:grid-cols-3 lg:grid-cols-6">
        <Field label="Tube preset"><select className={inputClass} value={pipeIndex} onChange={(event) => setPipeIndex(Number(event.target.value))}>{pipePresets.map((item, index) => <option value={index} key={item.id}>{item.name}</option>)}</select></Field>
        <Field label="Stock length"><NumberInput value={stockMm} onChange={setStockMm} /></Field>
        <Field label="Scale"><select className={inputClass} value={scaleId} onChange={(event) => setScaleId(event.target.value)}>{scales.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></Field>
        <Field label="Minimum octave"><NumberInput value={minimumOctave} onChange={setMinimumOctave} unit="" step={1} /></Field>
        <Field label="Maximum octave"><NumberInput value={maximumOctave} onChange={setMaximumOctave} unit="" step={1} /></Field>
        <Field label="Sort"><select className={inputClass} value={sort} onChange={(event) => setSort(event.target.value)}><option value="lowest">Lowest pitch</option><option value="highest">Highest pitch</option><option value="longest">Longest flute</option><option value="best-fit">Best stock fit</option></select></Field>
        <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={fitsOnly} onChange={(event) => setFitsOnly(event.target.checked)} /> Fits stock only</label>
        <button className={buttonClass} onClick={() => setShowPairs((current) => !current)}>{showPairs ? 'SHOW DESIGNS' : 'FIND OCTAVE PAIRS'}</button>
      </div>

      <div className="mb-4 bg-navy p-4 text-white"><strong className="font-mono text-2xl text-emerald-300">{rows.length}</strong> designs shown <span className="float-right hidden font-mono text-[10px] text-slate-400 md:block">{stockMm} mm stock · Ø7 mm holes · {scale.name}</span></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{(showPairs ? octavePairs : rows).map((row) => <ExplorerCard row={row} scaleName={scale.name} key={`${row.root}-${row.octave}`} pair={showPairs ? rows.find((higher) => higher.root === row.root && higher.octave === row.octave + 1) : undefined} />)}</div>

      <section className="mt-8 border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-4"><div className="mr-auto"><h2 className="font-bold">Two-flute stock cut optimizer</h2><p className="text-xs text-slate-500">Separate from acoustic calculations; includes one saw kerf between blanks.</p></div><Field label="Saw kerf"><NumberInput value={kerfMm} onChange={setKerfMm} /></Field></div>
        <div className="mt-4 grid gap-2 md:grid-cols-3">{cutPairs.map((pair, index) => <div className="bg-slate-100 p-4" key={index}><b>{roots[pair.first.root].split('/')[0]}{pair.first.octave} + {roots[pair.second.root].split('/')[0]}{pair.second.octave}</b><p className="font-mono text-xs">{pair.first.result.suggestedBlankMm} + {pair.second.result.suggestedBlankMm} + {kerfMm} mm</p><strong className="text-teal">Waste: {pair.waste.toFixed(0)} mm</strong></div>)}</div>
      </section>
    </main>
  )
}

function ExplorerCard({ row, scaleName, pair }: { row: ExplorerRow; scaleName: string; pair?: ExplorerRow }) {
  const holePositions = row.result.holes.map((hole) => hole.fromFootMm)
  const spacings = row.result.holes.map((hole) => hole.centerSpacingMm).filter((value): value is number => value !== undefined)
  return (
    <article className={`border border-t-[3px] bg-white p-4 ${row.leftoverMm >= 0 ? 'border-t-emerald-600' : 'border-t-slate-400 opacity-60'}`}>
      <span className="font-mono text-[8px] text-emerald-700">{row.leftoverMm >= 0 ? 'FITS STOCK' : 'TOO LONG'}</span>
      <h2 className="my-2 font-mono text-2xl font-bold">{roots[row.root].split('/')[0]}{row.octave} <small className="block font-sans text-[10px]">{scaleName}</small></h2>
      <dl className="grid grid-cols-[1fr_auto] gap-2 font-mono text-[9px]"><dt className="text-slate-500">Frequency</dt><dd>{row.rootHz.toFixed(2)} Hz</dd><dt className="text-slate-500">Sounding length</dt><dd>{row.result.soundingLengthMm.toFixed(1)} mm</dd><dt className="text-slate-500">Suggested blank</dt><dd>{row.result.suggestedBlankMm.toFixed(0)} mm</dd><dt className="text-slate-500">Leftover / overrun</dt><dd>{row.leftoverMm.toFixed(0)} mm</dd><dt className="text-slate-500">Bore:length</dt><dd>1:{(row.result.soundingLengthMm / pipeId(pipePresets[1])).toFixed(1)}</dd><dt className="text-slate-500">Hole span</dt><dd>{(Math.max(...holePositions) - Math.min(...holePositions)).toFixed(1)} mm</dd><dt className="text-slate-500">Spacing range</dt><dd>{Math.min(...spacings).toFixed(1)}–{Math.max(...spacings).toFixed(1)} mm</dd>{pair && <><dt className="text-slate-500">Octave partner</dt><dd>{roots[pair.root].split('/')[0]}{pair.octave} · {(pair.rootHz / row.rootHz).toFixed(3)}×</dd></>}</dl>
    </article>
  )
}

function playTone(frequencyHz: number) {
  const context = new AudioContext()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'triangle'
  oscillator.frequency.value = frequencyHz
  gain.gain.setValueAtTime(0.12, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.65)
  oscillator.connect(gain).connect(context.destination)
  oscillator.start()
  oscillator.stop(context.currentTime + 0.7)
}

function download(filename: string, contents: string, type: string) {
  const anchor = document.createElement('a')
  anchor.href = URL.createObjectURL(new Blob([contents], { type }))
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(anchor.href)
}

export default function App() {
  const [page, setPage] = useState<'designer' | 'explorer'>('designer')
  return <><Header page={page} setPage={setPage} />{page === 'designer' ? <Designer /> : <Explorer />}</>
}
