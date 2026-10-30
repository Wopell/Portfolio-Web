import React, { useEffect } from 'react';
import Works from './works/Works';

export default function WorksPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full min-h-screen bg-[var(--color-paper)] paper-grid text-zinc-950 pt-16 md:pt-24 pb-16 selection:bg-amber-200 selection:text-zinc-950 relative overflow-x-clip">
      <Works />
    </div>
  );
}

