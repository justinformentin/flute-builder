import { useState } from 'react';
import { Header, type Page } from './components/Header';
import { Designer } from './designer/Designer';
import { initialDesign, type DesignState } from './designer/designState';
import { Explorer } from './explorer/Explorer';
import { roots } from './music/notes';
import { SavedDesigns } from './saved/SavedDesigns';

export default function App() {
  const [page, setPage] = useState<Page>('designer');
  const [designerDot, setDesignerDot] = useState(false);

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

  const handleSetPage = (newPage: Page) => {
    if (newPage === 'designer') setDesignerDot(false);
    setPage(newPage);
  };

  const handleLoad = (loadedDesign: DesignState) => {
    setDesign(loadedDesign);
    setDesignerDot(true);
  };

  return (
    <>
      <Header page={page} setPage={handleSetPage} designerDot={designerDot} />
      <div className="pt-[50px]">
        {page === 'designer' ? (
          <Designer design={design} setDesign={setDesign} />
        ) : page === 'explorer' ? (
          <Explorer onSelect={(d) => { handleLoad(d); handleSetPage('designer'); }} />
        ) : (
          <SavedDesigns onLoad={handleLoad} />
        )}
      </div>
    </>
  );
}
