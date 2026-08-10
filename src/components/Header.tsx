export type Page = 'designer' | 'explorer' | 'saved';

const tabLabels: Record<Page, string> = {
  designer: 'Designer',
  explorer: 'Flute Explorer',
  saved: 'Saved',
};

export function Header({
  page,
  setPage,
  designerDot,
}: {
  page: Page;
  setPage: (page: Page) => void;
  designerDot: boolean;
}) {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex h-[50px] items-center justify-between border-b-[3px] border-signal bg-navy px-4 text-white md:px-7">
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
        {(['designer', 'explorer', 'saved'] as const).map((item) => (
          <button
            className={`relative border-b-[3px] px-4 text-sm font-bold md:px-7 ${
              page === item
                ? 'border-white bg-white/5 text-white'
                : 'border-transparent text-slate-400'
            }`}
            key={item}
            onClick={() => setPage(item)}
          >
            {tabLabels[item]}
            {item === 'designer' && designerDot && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>
        ))}
      </nav>
      <span className="hidden font-mono text-[10px] tracking-wider text-emerald-300 lg:block">
        ● LIVE CALCULATION
      </span>
    </header>
  );
}
