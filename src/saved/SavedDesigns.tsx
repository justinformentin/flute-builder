import { useState } from 'react';
import type { DesignState } from '../designer/designState';
import { roots } from '../music/notes';
import { scaleById } from '../music/scales';
import { deleteSavedDesign, getSavedDesigns, type SavedDesign } from './storage';

export function SavedDesigns({ onLoad }: { onLoad: (design: DesignState) => void }) {
  const [saved, setSaved] = useState<SavedDesign[]>(() => getSavedDesigns());
  const [loadedId, setLoadedId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setSaved(deleteSavedDesign(id));
    if (loadedId === id) setLoadedId(null);
  };

  const handleLoad = (s: SavedDesign) => {
    onLoad(s.design);
    setLoadedId(s.id);
  };

  return (
    <main className="min-h-[calc(100vh-50px)] p-4 md:p-8">
      <div className="mb-6 flex justify-between font-mono text-[10px] tracking-wider">
        <span>SAVED DESIGNS</span>
        <span className="text-slate-400">
          {saved.length} design{saved.length !== 1 ? 's' : ''}
        </span>
      </div>

      {saved.length === 0 ? (
        <div className="border border-dashed border-slate-300 p-12 text-center text-slate-400">
          <p className="font-mono text-sm">No saved designs yet.</p>
          <p className="mt-2 text-xs">
            Open the Designer tab, configure your flute, and click Save Design.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {saved.map((s) => {
            const scale = scaleById(s.design.scaleId);
            const rootName = roots[s.design.root] ?? '?';
            const bore = (s.design.outsideDiameterMm - 2 * s.design.wallMm).toFixed(1);
            const isLoaded = loadedId === s.id;

            return (
              <div
                key={s.id}
                className={`flex items-center gap-4 border bg-white p-4 ${
                  isLoaded ? 'border-teal' : 'border-slate-200'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-3">
                    <strong className="text-sm text-ink">{s.name}</strong>
                    {isLoaded && (
                      <span className="font-mono text-[9px] text-teal">
                        LOADED — click Designer tab to view
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 font-mono text-[10px] text-slate-500">
                    <span>
                      {rootName} {s.design.octave} · {scale.name}
                    </span>
                    <span>Bore {bore} mm</span>
                    <span>Emb {s.design.embouchureMm} mm</span>
                    <span className="text-slate-400">
                      {new Date(s.savedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="border border-navy bg-navy px-4 py-2 font-mono text-[10px] text-white hover:bg-navy/80"
                    onClick={() => handleLoad(s)}
                  >
                    Load
                  </button>
                  <button
                    className="border border-slate-300 px-3 py-2 font-mono text-[10px] text-slate-500 hover:border-red-400 hover:text-red-500"
                    onClick={() => handleDelete(s.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
