import React, { useEffect, useRef, useState } from 'react';
import { Instagram, Send, Mail, Copy, Check } from 'lucide-react';
import { gsap, EASE, prefersReducedMotion } from '../../lib/gsap';

/**
 * "LET'S WORK TOGETHER" — contact strip card (approved reference layout).
 * Semantic list of social links; email tile is a copy-to-clipboard action.
 */
const SOCIALS = [
  {
    id: 'instagram',
    name: 'INSTAGRAM',
    handle: '@wopell',
    href: 'https://instagram.com/wopell',
    external: true,
    bg: '#d82d6b',
    dot: '#fb7185',
    icon: <Instagram size={20} />,
    iconChip: 'bg-white/20',
    text: 'text-white',
    sub: 'text-white/90',
  },
  {
    id: 'telegram',
    name: 'TELEGRAM',
    handle: '@wopell',
    href: 'https://t.me/wopell',
    external: true,
    bg: '#229ed9',
    dot: '#34d399',
    icon: <Send size={18} />,
    iconChip: 'bg-white/20',
    text: 'text-white',
    sub: 'text-white/90',
  },
  {
    id: 'email',
    name: 'EMAIL',
    handle: 'tomy.wopell@gmail.com',
    href: 'mailto:tomy.wopell@gmail.com',
    external: false,
    bg: '#f2b705',
    dot: '#34d399',
    icon: <Mail size={18} />,
    iconChip: 'bg-black/10',
    text: 'text-zinc-950',
    sub: 'text-zinc-900',
  },
  {
    id: 'behance',
    name: 'BEHANCE',
    handle: 'Tomy Powell',
    href: 'https://www.behance.net/wopell',
    external: true,
    bg: '#0fa8c8',
    dot: '#34d399',
    icon: <span className="font-display font-black text-[15px] leading-none">Bē</span>,
    iconChip: 'bg-white/25',
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

  /* magnetic hover: each tile leans towards the cursor, springs back */
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const tiles = gsap.utils.toArray<HTMLElement>('[data-social-tile]', rootRef.current);
    const cleanups: Array<() => void> = [];
    tiles.forEach((tile) => {
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
      tile.addEventListener('pointermove', move);
      tile.addEventListener('pointerleave', leave);
      cleanups.push(() => {
        tile.removeEventListener('pointermove', move);
        tile.removeEventListener('pointerleave', leave);
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

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 w-full">
          {SOCIALS.map((s) => (
            <li key={s.id}>
              <a
                data-social-tile
                href={s.href}
                {...(s.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 will-change-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                style={{ backgroundColor: s.bg }}
              >
                <span
                  className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: s.dot }}
                  aria-hidden="true"
                />
                <span className="flex items-center gap-3 min-w-0">
                  <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.iconChip} ${s.text}`}>
                    {s.icon}
                  </span>
                  <span className={`min-w-0 ${s.text}`}>
                    <span className="block font-display font-black text-[11px] uppercase tracking-wider">{s.name}</span>
                    <span className={`block font-mono text-[10px] truncate ${s.sub}`}>{s.handle}</span>
                  </span>
                </span>
                {s.id === 'email' ? (
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    title="Copiar email"
                    aria-label={copied ? 'Email copiado' : 'Copiar email al portapapeles'}
                    className="ml-2 p-1.5 rounded-lg bg-black/10 hover:bg-black hover:text-white transition-colors cursor-pointer shrink-0 text-zinc-950 focus-visible:outline-2 focus-visible:outline-white"
                  >
                    <span ref={copyIconRef} className="inline-flex">
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </span>
                  </button>
                ) : (
                  <span className="text-xs text-white/70 font-mono" aria-hidden="true">×</span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
