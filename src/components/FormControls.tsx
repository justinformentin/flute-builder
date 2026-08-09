import type { ReactNode } from 'react'

export const inputClass =
  'mt-1 h-9 w-full border border-slate-300 bg-white px-2 font-mono text-xs text-ink outline-none focus:border-teal focus:ring-1 focus:ring-teal'

export const buttonClass =
  'border border-slate-300 bg-white px-3 py-2 font-mono text-[10px] font-medium hover:border-teal hover:text-teal'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block font-mono text-[9px] font-medium uppercase tracking-wider text-slate-600">
      {label}
      {children}
    </label>
  )
}

export function NumberInput({
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

export function Section({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <section className="border-b border-slate-200 p-5">
      <h2 className="mb-4 font-mono text-[10px] font-medium text-signal">
        {number} <span className="ml-2 font-sans text-sm font-extrabold text-ink">{title}</span>
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}
