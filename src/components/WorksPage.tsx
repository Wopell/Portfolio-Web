import React, { useEffect } from 'react';
import Works from './works/Works';

export default function WorksPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full min-h-screen bg-[var(--color-paper)] paper-grid text-zinc-950 selection:bg-[#2f6f6b] selection:text-white relative overflow-x-clip">
      <Works />
    </div>
  );
}

