import React, { useEffect, useRef, useState } from 'react';
import { Instagram, Send, Mail, Copy, Check } from 'lucide-react';
import { gsap, EASE, prefersReducedMotion } from '../../lib/gsap';

/**
 * "LET'S WORK TOGETHER" — contact strip card (approved reference layout).
 * Semantic list of social links; email tile is a copy-to-clipboard action.
 * Hover/focus expands the hovered tile (flexGrow) to reveal long handles,
 * per senal_Redes_1920px.png.
 */
const SOCIALS = [
  {
    id: 'instagram',
    name: 'INSTAGRAM',
    handle: '@wopell',
    href: 'https://instagram.com/wopell',
    external: true,
    bg: '#e22b5c',
    dot: '#2fbd6e',
    icon: <Instagram size={22} />,
    iconChip: { backgroundColor: '#ffd3e2', color: '#c31d55' },
    text: 'text-white',
    sub: 'text-white/90',
  },
  {
    id: 'telegram',
    name: 'TELEGRAM',
    handle: '@wopell',
    href: 'https://t.me/wopell',
    external: true,
    bg: '#3360df',
    dot: '#2fbd6e',
    icon: <Send size={20} />,
    iconChip: { backgroundColor: '#cfe0ff', color: '#2e57c9' },
    text: 'text-white',
    sub: 'text-white/90',
  },
  {
    id: 'email',
    name: 'EMAIL',
    handle: 'tomy.wopell@gmail.com',
    href: 'mailto:tomy.wopell@gmail.com',
    external: false,
    bg: '#edb71f',
    dot: '#2fbd6e',
    grow: 1.9,
    icon: <Mail size={20} />,
    iconChip: { backgroundColor: '#fff6dc', color: '#a57b08' },
    text: 'text-zinc-950',
    sub: 'text-zinc-900',
  },
  {
    id: 'behance',
    name: 'BEHANCE',
    handle: 'Tomy Powell',
    href: 'https://www.behance.net/wopell',
    external: true,
    bg: '#3561e1',
    dot: '#2fbd6e',
    icon: <span className="font-display font-black text-[17px] leading-none">Bē</span>,
    iconChip: { backgroundColor: '#d6e3ff', color: '#2e57c9' },
    text: 'text-white',
    sub: 'text-white/90',
  },
];

export const WorkTogetherCard: React.FC = () => {
  const rootRef = useRef<HTMLElement>(null);
  const copyIconRef = useRef<HTMLSpanElement>(null);
  const [copied, setCopied] = useState(false);
  const busyRef = useRef(false);

  /* entrance: card rises, buttons fan in with a playful tilt */
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-wt-card]', {
        y: 34,
        autoAlpha: 0,
        duration: 0.8,
        ease: EASE.settle,
        scrollTrigger: { trigger: rootRef.current, start: 'top 85%', once: true },
      });
      gsap.from('[data-social-tile]', {
        y: 18,
        autoAlpha: 0,
        rotation: (i) => (i % 2 === 0 ? -1.6 : 1.6),
        duration: 0.6,
        ease: EASE.outBack,
        stagger: 0.07,
        scrollTrigger: { trigger: rootRef.current, start: 'top 80%', once: true },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  /* magnetic hover: each tile leans towards the cursor, springs back;
     hover/focus expands the tile (flexGrow) so long handles get room */
  useEffect(() => {
    const tiles = gsap.utils.toArray<HTMLElement>('[data-social-tile]', rootRef.current);
    const cleanups: Array<() => void> = [];
    const reduced = prefersReducedMotion();
    tiles.forEach((tile) => {
      if (reduced) return;
      const qx = gsap.quickTo(tile, 'x', { duration: 0.4, ease: 'power3.out' });
      const qy = gsap.quickTo(tile, 'y', { duration: 0.4, ease: 'power3.out' });
      const qr = gsap.quickTo(tile, 'rotation', { duration: 0.5, ease: 'power3.out' });
      const move = (e: PointerEvent) => {
        const r = tile.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        qx(dx * 8);
        qy(dy * 5);
        qr(dx * 2.2);
      };
      const leave = () => {
        qx(0);
        qy(0);
        qr(0);
      };
      const grow = () => {
        const maxGrow = Number(tile.dataset.grow ?? '1.5');
        tiles.forEach((t) => gsap.to(t, { flexGrow: t === tile ? maxGrow : 0.96, duration: 0.45, ease: 'power2.out', overwrite: 'auto' }));
      };
      const shrink = () => {
        tiles.forEach((t) => gsap.to(t, { flexGrow: 1, duration: 0.45, ease: 'power2.out', overwrite: 'auto' }));
      };
      tile.addEventListener('pointermove', move);
      tile.addEventListener('pointerleave', leave);
      tile.addEventListener('pointerenter', grow);
      tile.addEventListener('focus', grow);
      tile.addEventListener('blur', shrink);
      cleanups.push(() => {
        tile.removeEventListener('pointermove', move);
        tile.removeEventListener('pointerleave', leave);
        tile.removeEventListener('pointerenter', grow);
        tile.removeEventListener('focus', grow);
        tile.removeEventListener('blur', shrink);
      });
    });
    return () => cleanups.forEach((fn) => fn());
  }, []);

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busyRef.current) return;
    busyRef.current = true;
    navigator.clipboard?.writeText('tomy.wopell@gmail.com').catch(() => {});
    setCopied(true);
    gsap.fromTo(copyIconRef.current, { scale: 0.6, rotation: -14 }, { scale: 1, rotation: 0, duration: 0.45, ease: EASE.outBack });
    setTimeout(() => {
      setCopied(false);
      busyRef.current = false;
    }, 1800);
  };

  return (
    <section
      ref={rootRef}
      id="work-together"
      data-section="work-together"
      aria-labelledby="work-together-title"
      className="w-full my-10 sm:my-14"
    >
      <div
        data-wt-card
        className="w-full bg-[#fbf9f4]/95 border border-black/20 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
      >
        <header className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/10 pb-3">
          <div>
            <p className="flex items-center gap-2 font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] font-bold text-zinc-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              MIS REDES &amp; CONTACTO DIRECTO
            </p>
            <h3
              id="work-together-title"
              className="font-display font-black text-2xl sm:text-3xl text-zinc-950 uppercase tracking-tight mt-1"
            >
              LET&rsquo;S WORK TOGETHER
            </h3>
          </div>
        </header>

        <ul className="flex flex-col sm:flex-row gap-3 sm:gap-3.5 w-full">
          {SOCIALS.map((s) => (
            <li key={s.id} className="contents">
              <a
                data-social-tile
                data-grow={s.grow ? String(s.grow) : undefined}
                href={s.href}
                {...(s.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className='group relative flex min-w-0 items-center justify-between p-4 sm:p-[18px] rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 will-change-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900'
                style={{ backgroundColor: s.bg, flexGrow: 1, flexBasis: 0 }}
              >
                <span
                  className="absolute -top-2 -right-2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: s.dot }}
                  aria-hidden="true"
                />
                <span className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={s.iconChip}
                  >
                    {s.icon}
                  </span>
                  <span className={`min-w-0 ${s.text}`}>
                    <span className="block font-display font-black text-[11px] uppercase tracking-wide">{s.name}</span>
                    <span className="flex items-baseline gap-2">
                      <span className={`block font-mono text-[10px] truncate ${s.sub}`}>{s.handle}</span>
                      <span
                        className={`shrink-0 font-mono text-[13px] leading-none opacity-80 ${s.sub}`}
                        aria-hidden="true"
                      >
                        ×
                      </span>
                    </span>
                  </span>
                </span>
                {s.id === 'email' && (
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    title="Copiar email"
                    aria-label={copied ? 'Email copiado' : 'Copiar email al portapapeles'}
                    className="ml-auto p-2 rounded-xl bg-black/25 hover:bg-black hover:text-white text-[#fff6dc] transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-white"
                  >
                    <span ref={copyIconRef} className="inline-flex">
                      {copied ? <Check size={15} /> : <Copy size={15} />}
                    </span>
                  </button>
                )}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
