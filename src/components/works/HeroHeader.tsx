import React from 'react';

export const HeroHeader: React.FC = () => (
  <section aria-label="Hero" className="relative w-full overflow-hidden bg-white h-[85svh] sm:h-[100svh]">
    <div className="absolute inset-x-0 text-center" style={{ top: '35%', transform: 'translateY(-50%)' }}>
      <h1 className="uppercase leading-none m-0" style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontStyle: 'normal', fontSize: 'clamp(70px, 11vw, 230px)', letterSpacing: '0.01em' }}>My Works</h1>
      <p className="m-0" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontSize: 'clamp(16px, 3vw, 56px)', marginTop: '0.4em' }}>by wopell</p>
    </div>
    <div className="absolute left-1/2 flex items-center gap-4 whitespace-nowrap" style={{ top: '78%', width: '60%', transform: 'translateX(-50%)', fontFamily: 'Inter, sans-serif', fontSize: 'clamp(9px, 0.9vw, 14px)', letterSpacing: '0.08em' }}>
      <span>SELECTED PORTFOLIO</span>
      <span aria-hidden="true" className="flex-1 border-t border-black/60" />
      <span>2023 - 2026</span>
    </div>
  </section>
);
