import { useState } from 'react';
import { Header, type Page } from './components/Header';
import { Designer } from './designer/Designer';
import { Explorer } from './explorer/Explorer';

export default function App() {
  const [page, setPage] = useState<Page>('designer');

  return (
    <>
      <Header page={page} setPage={setPage} />
      <div className="pt-[50px]">
        {page === 'designer' ? <Designer /> : <Explorer />}
      </div>
    </>
  );
}
