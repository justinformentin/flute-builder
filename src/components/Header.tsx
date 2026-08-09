export type Page = 'designer' | 'explorer';

export function Header({
  page,
  setPage,
}: {
  page: Page;
  setPage: (page: Page) => void;
}) {
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
              page === item
                ? 'border-white bg-white/5 text-white'
                : 'border-transparent text-slate-400'
            }`}
            key={item}
            onClick={() => setPage(item)}
          >
            {item === 'explorer' ? 'Flute Explorer' : 'Designer'}
          </button>
        ))}
      </nav>
      <span className="hidden font-mono text-[10px] tracking-wider text-emerald-300 lg:block">
        ● LIVE CALCULATION
      </span>
    </header>
  );
}
