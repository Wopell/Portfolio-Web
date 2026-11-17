import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../../lib/gsap';
import { WORKS, Work } from '../../data/display-works';
import { CategoryData } from '../../data/projects';
import { SplatCanvas } from './SplatCanvas';
import { FolderTab, folderTabWidth } from './FolderTab';
import './display.css';
import './hub.css';

/**
 * Hub «Guía de canales» — una sola superficie para mirar, elegir y escribir.
 *  - Arriba: el monitor con la pieza en pantalla (splats) y su ficha.
 *  - Abajo: la guía. Cada carpeta es una fila tendida con sus piezas; su
 *    pestaña abre el catálogo (FLIP). Contacto y clientes son los canales 099
 *    y 100 de la misma guía.
 *  - Mouse: hover previsualiza, clic abre la ficha. Teclado: flechas mueven la
 *    selección (la pantalla la sigue), Enter abre.
 *  - Autoplay cada 7 s; pausa con hover, con foco adentro o con el botón.
 */

const HOLD_MS = 7000;
const EMAIL = 'tomy.wopell@gmail.com';
const pad = (n: number, l = 2) => String(n).padStart(l, '0');

const CLIENTS = [
  ['Diageo', 'Diageo'],
  ['Elemento', 'Elemento'],
  ['Footy', 'Footy'],
  ['Chevrolet', 'Chevrolet'],
  ['Loreal', "L'Oréal"],
  ['Guinness', 'Guinness'],
  ['Johnnie Walker', 'Johnnie Walker'],
  ['Puma', 'Puma Energy'],
  ['Wegovy', 'Wegovy'],
  ['Telecom', 'Telecom'],
  ['Amaze', 'Amaze'],
  ['Smirnoff', 'Smirnoff'],
  ['Balanz', 'Balanz'],
  ['Banco Macro', 'Banco Macro'],
  ['Betterfly', 'Betterfly'],
  ['Buen Bit', 'Buen Bit'],
  ['Contagram', 'Contagram'],
  ['Cremolatti', 'Cremolatti'],
  ['Gillette', 'Gillette'],
  ['General motors', 'General Motors'],
  ['Master Metrics', 'Master Metrics'],
  ['Mayma', 'Mayma'],
  ['Mugler', 'Mugler'],
  ['Naldo', 'Naldo'],
  ['Pascual Toso', 'Pascual Toso'],
  ['Salta cautiva', 'Salta Cautiva'],
  ['Simplicity', 'Simplicity'],
  ['Livian', 'Livian'],
  ['Yoy', 'Yoy'],
  ['Banco Interamericando de desarrollo', 'Banco Interamericano de Desarrollo'],
].map(([file, name]) => ({ file, name, logo: `/logos/Black/${file}.webp` }));

const CONTACT = [
  { id: 'email', label: 'Email', value: EMAIL, href: `mailto:${EMAIL}`, external: false },
  { id: 'copy', label: 'Portapapeles', value: 'Copiar email', href: '', external: false },
  { id: 'instagram', label: 'Instagram', value: '@wopell', href: 'https://instagram.com/wopell', external: true },
  { id: 'telegram', label: 'Telegram', value: '@wopell', href: 'https://t.me/wopell', external: true },
  { id: 'behance', label: 'Behance', value: 'Tomy Powell', href: 'https://www.behance.net/wopell', external: true },
];

interface WorksHubProps {
  categories: CategoryData[];
  onOpenWork: (work: Work) => void;
  onOpenCategory: (categoryId: string) => void;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const WorksHub: React.FC<WorksHubProps> = ({ categories, onOpenWork, onOpenCategory }) => {
  /* filas de la guía (una por carpeta) y orden de canales */
  const rows = useMemo(
    () => categories.map((cat) => ({ cat, works: WORKS.filter((w) => w.categoryId === cat.id) })).filter((r) => r.works.length),
    [categories]
  );
  const flat = useMemo(() => rows.flatMap((r) => r.works), [rows]);
  const sources = useMemo(() => flat.map((w) => ({ src: w.image, focusX: w.focusX })), [flat]);
  const n = flat.length;

  const sectionRef = useRef<HTMLElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const guideRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const assembleRef = useRef(prefersReducedMotion() ? 1 : 0);

  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [powered, setPowered] = useState(false);
  const [copied, setCopied] = useState(false);
  const hoverTimer = useRef(0);
  const flyingRef = useRef(false);

  const work = flat[index];
  const next = n > 1 ? flat[(index + 1) % n] : null;
  const rowOf = (w: Work) => rows.findIndex((r) => r.cat.id === w.categoryId);
  const activeRow = rowOf(work);
  const reduced = prefersReducedMotion();
  const playing = powered && inView && !hovering && !focusWithin && !userPaused && !reduced;

  const select = useCallback((i: number) => setIndex(((i % n) + n) % n), [n]);

  /* autoplay */
  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => select(index + 1), HOLD_MS);
    return () => window.clearTimeout(t);
  }, [playing, index, select]);

  /* vista + encendido del monitor (una vez) */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const powerTl = useRef<gsap.core.Timeline | null>(null);
  useEffect(() => () => void powerTl.current?.kill(), []);
  useEffect(() => {
    if (!inView || powerTl.current || powered) return;
    setPowered(true);
    if (reduced) {
      assembleRef.current = 1;
      return;
    }
    powerTl.current = gsap
      .timeline()
      .fromTo(
        screenRef.current,
        { clipPath: 'inset(49.6% 0% 49.6% 0% round 14px)', filter: 'brightness(3)' },
        {
          clipPath: 'inset(0% 0% 0% 0% round 14px)',
          filter: 'brightness(1)',
          duration: 0.7,
          ease: 'expo.out',
          clearProps: 'clipPath,filter',
        }
      )
      .to(assembleRef, { current: 1, duration: 2.4, ease: 'power2.out' }, 0.15);
  }, [inView, powered, reduced]);

  /* cinta de clientes: loop lento; el scroll la acelera un rato, hover la frena */
  useEffect(() => {
    const track = trackRef.current;
    if (!track || reduced) return;
    const loop = gsap.to(track, { xPercent: -50, ease: 'none', duration: 60, repeat: -1, paused: true });
    const vis = ScrollTrigger.create({
      trigger: track,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
    });
    const strip = track.parentElement;
    const slow = () => gsap.to(loop, { timeScale: 0, duration: 0.4, overwrite: true });
    const go = () => gsap.to(loop, { timeScale: 1, duration: 0.6, overwrite: true });
    strip?.addEventListener('pointerenter', slow);
    strip?.addEventListener('pointerleave', go);
    return () => {
      vis.kill();
      loop.kill();
      strip?.removeEventListener('pointerenter', slow);
      strip?.removeEventListener('pointerleave', go);
    };
  }, [reduced]);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(t);
  }, [copied]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  };

  /* FLIP: la imagen vuela de la guía (o de la pantalla) al encabezado del catálogo */
  const openCategory = useCallback(
    (cat: CategoryData, source: HTMLElement | null) => {
      if (flyingRef.current) return;
      if (!source || reduced) {
        onOpenCategory(cat.id);
        return;
      }
      flyingRef.current = true;
      const r = source.getBoundingClientRect();
      const clone = document.createElement('img');
      clone.src = cat.image;
      clone.alt = '';
      Object.assign(clone.style, {
        position: 'fixed',
        left: `${r.left}px`,
        top: `${r.top}px`,
        width: `${r.width}px`,
        height: `${r.height}px`,
        objectFit: 'cover',
        borderRadius: '6px',
        zIndex: '120',
        pointerEvents: 'none',
        boxShadow: '0 30px 60px rgba(25,21,16,0.25)',
      } as CSSStyleDeclaration);
      document.body.appendChild(clone);
      const targetH = window.innerHeight * (window.innerWidth >= 768 ? 0.75 : 0.65);
      gsap
        .timeline({
          onComplete: () => {
            gsap.to(clone, {
              autoAlpha: 0,
              duration: 0.35,
              delay: 0.25,
              onComplete: () => {
                clone.remove();
                flyingRef.current = false;
              },
            });
          },
        })
        .to(clone, {
          left: 0,
          top: 0,
          width: window.innerWidth,
          height: targetH,
          borderRadius: 0,
          boxShadow: '0 0 0 rgba(0,0,0,0)',
          duration: 0.75,
          ease: 'power3.inOut',
        })
        .add(() => onOpenCategory(cat.id), 0.55);
    },
    [onOpenCategory, reduced]
  );

  /* ── navegación con flechas (tabindex itinerante) ──────────────────────
     grilla: filas de carpetas [pestaña, pieza…] + fila de contacto [—, canal…] */
  const grid = useMemo(() => {
    const g: (string | null)[][] = rows.map((r) => [`tab:${r.cat.id}`, ...r.works.map((w) => `work:${w.id}`)]);
    g.push([null, ...CONTACT.map((c) => `contact:${c.id}`)]);
    return g;
  }, [rows]);
  const navEls = useRef(new Map<string, HTMLElement>());
  const posOf = (key: string): [number, number] => {
    for (let r = 0; r < grid.length; r++) {
      const c = grid[r].indexOf(key);
      if (c >= 0) return [r, c];
    }
    return [0, 1];
  };
  const [active, setActive] = useState<string>(() => `work:${flat[0]?.id}`);

  // si la selección cambia sola (autoplay) y el foco no está en la guía, el
  // punto de entrada con Tab la sigue
  useEffect(() => {
    if (!focusWithin && work) setActive(`work:${work.id}`);
  }, [index, focusWithin, work]);

  const focusKey = (key: string | null) => {
    if (!key) return;
    setActive(key);
    navEls.current.get(key)?.focus();
  };

  const onGuideKey = (e: React.KeyboardEvent) => {
    const [r, c] = posOf(active);
    const row = grid[r];
    let target: string | null = null;
    const pick = (rr: number, cc: number) => {
      const line = grid[rr];
      let col = Math.min(cc, line.length - 1);
      while (col < line.length && !line[col]) col++;
      return line[col] ?? null;
    };
    switch (e.key) {
      case 'ArrowRight':
        target = row[c + 1] ?? null;
        break;
      case 'ArrowLeft':
        target = c - 1 >= 0 ? row[c - 1] : null;
        break;
      case 'ArrowDown':
        target = r + 1 < grid.length ? pick(r + 1, c) : null;
        break;
      case 'ArrowUp':
        target = r - 1 >= 0 ? pick(r - 1, c) : null;
        break;
      case 'Home':
        target = pick(r, 0);
        break;
      case 'End':
        target = row[row.length - 1];
        break;
      default:
        return;
    }
    e.preventDefault();
    focusKey(target);
  };

  const navProps = (key: string) => ({
    ref: (el: HTMLElement | null) => {
      if (el) navEls.current.set(key, el);
      else navEls.current.delete(key);
    },
    tabIndex: active === key ? 0 : -1,
    onFocus: () => setActive(key),
  });

  const preview = (i: number) => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => select(i), 90);
  };

  const onWorkClick = (i: number) => {
    if (i === index) onOpenWork(flat[i]);
    else select(i);
  };

  const workCat = rows[activeRow]?.cat;

  return (
    <section
      ref={sectionRef}
      id="selected-projects"
      data-section="hub"
      aria-labelledby="hub-title"
      className="hub"
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusWithin(false);
      }}
    >
      <div className="hub__inner">
        <header className="hub__head">
          <h2 id="hub-title" className="hub__title">
            Now <em>playing</em>
          </h2>
          <p className="hub__meta">
            {plural(rows.length, 'carpeta', 'carpetas')} · {plural(n, 'pieza', 'piezas')} · {CLIENTS.length} clientes
          </p>
        </header>

        {/* ── Monitor + ficha ── */}
        <div className="hub__top">
          <div
            ref={screenRef}
            className="disp__screen hub__screen"
            onPointerEnter={() => setHovering(true)}
            onPointerLeave={() => setHovering(false)}
          >
            <SplatCanvas
              sources={sources}
              index={index}
              assembleRef={assembleRef}
              className="disp__canvas"
              alt={`${work.client} — ${work.title}`}
            />
            <span aria-hidden="true" className="disp__scan" />
            <span aria-hidden="true" className="disp__vignette" />
            <button
              type="button"
              className="disp__open"
              onClick={() => onOpenWork(work)}
              aria-label={`Ver ficha: ${work.client} — ${work.title}`}
            />
            <div className="disp__hud disp__hud--tl" aria-hidden="true">
              <span className="disp__rec">● REC</span>
              <span>
                CH {pad(index + 1)} / {pad(n)}
              </span>
            </div>
            <span
              key={`${index}-${playing}`}
              aria-hidden="true"
              className={`disp__progress ${playing ? '' : 'is-paused'}`}
              style={{ animationDuration: `${HOLD_MS}ms` }}
            />
          </div>

          <div className="hub__ficha">
            <p className="hub__now">
              <span className="hub__dot" aria-hidden="true" />
              En pantalla · {work.kind}
            </p>
            <p className="hub__client">{work.client}</p>
            <p key={work.id} className="hub__worktitle">
              {work.title}
            </p>
            <p className="hub__specs">
              {work.format} · {work.duration}
            </p>
            <div className="hub__actions">
              <button type="button" className="arch-btn arch-btn--solid" onClick={() => onOpenWork(work)}>
                Ver ficha <span aria-hidden="true">↗</span>
              </button>
              {workCat && (
                <button
                  type="button"
                  className="arch-btn"
                  onClick={() => openCategory(workCat, screenRef.current)}
                  aria-haspopup="dialog"
                >
                  Abrir {workCat.title.toLowerCase()} <span aria-hidden="true">↗</span>
                </button>
              )}
            </div>
            {next && (
              <button type="button" className="hub__next" onClick={() => select(index + 1)}>
                <span className="hub__next-label">A continuación · CH {pad(((index + 1) % n) + 1)}</span>
                <span className="hub__next-row">
                  <img src={next.image} alt="" loading="lazy" draggable={false} className="hub-cell__thumb" />
                  <span className="hub-cell__text">
                    <span className="hub-cell__client">{next.client}</span>
                    <span className="hub-cell__title">{next.title}</span>
                  </span>
                </span>
              </button>
            )}
            <div className="hub__controls">
              <button type="button" className="hub__ctl" onClick={() => select(index - 1)} aria-label="Pieza anterior">
                ←
              </button>
              <button
                type="button"
                className="hub__ctl hub__ctl--wide"
                onClick={() => setUserPaused((p) => !p)}
                aria-pressed={userPaused}
              >
                {userPaused ? 'Reproducir' : 'Pausa'}
              </button>
              <button type="button" className="hub__ctl" onClick={() => select(index + 1)} aria-label="Pieza siguiente">
                →
              </button>
            </div>
          </div>
        </div>

        {/* ── Guía ── */}
        <p className="hand hub__hint" aria-hidden="true">
          también con las flechas ← ↑ ↓ →
        </p>
        <div
          ref={guideRef}
          className="hub__guide"
          role="group"
          aria-label="Guía de canales: carpetas, contacto y clientes"
          onKeyDown={onGuideKey}
          onPointerEnter={() => setHovering(true)}
          onPointerLeave={() => {
            window.clearTimeout(hoverTimer.current);
            setHovering(false);
          }}
        >
          {rows.map(({ cat, works }, r) => {
            const label = `${cat.number} // ${cat.title}`;
            const isActive = r === activeRow;
            return (
              <div key={cat.id} className={`hub-folder ${isActive ? 'is-active' : ''}`}>
                <button
                  type="button"
                  className="hub-folder__tab"
                  aria-haspopup="dialog"
                  aria-label={`Abrir carpeta ${label}, ${plural(works.length, 'pieza', 'piezas')}`}
                  onClick={(e) => {
                    const src = e.currentTarget.parentElement?.querySelector('[data-flip-src]') as HTMLElement | null;
                    openCategory(cat, src);
                  }}
                  {...navProps(`tab:${cat.id}`)}
                >
                  <FolderTab label={label} height={34} fill={isActive ? '#2f6f6b' : '#ffffff'} ink={isActive ? '#ffffff' : '#191510'} />
                  <span className="hub-folder__open" aria-hidden="true">
                    <span className="hub-folder__count">{plural(works.length, 'pieza', 'piezas')} · </span>abrir ↗
                  </span>
                </button>
                <div className="hub-folder__body" style={{ ['--tab-end' as string]: `${folderTabWidth(label)}px` }}>
                  <ul className="hub-cells">
                    {works.map((w, k) => {
                      const i = flat.indexOf(w);
                      const on = i === index;
                      return (
                        <li key={w.id}>
                          <button
                            type="button"
                            className={`hub-cell ${on ? 'is-on' : ''}`}
                            aria-current={on ? 'true' : undefined}
                            aria-label={`${w.client} — ${w.title}${on ? ' (en pantalla; Enter para ver la ficha)' : ''}`}
                            onPointerEnter={(e) => e.pointerType === 'mouse' && preview(i)}
                            onClick={() => onWorkClick(i)}
                            {...navProps(`work:${w.id}`)}
                            onFocus={() => {
                              setActive(`work:${w.id}`);
                              if (!on) select(i);
                            }}
                          >
                            <span className="hub-cell__media">
                              <img
                                src={w.image}
                                alt=""
                                loading="lazy"
                                draggable={false}
                                className="hub-cell__thumb"
                                {...(k === 0 ? { 'data-flip-src': true } : {})}
                              />
                              <span className="hub-cell__ch" aria-hidden="true">
                                {pad(i + 1)}
                              </span>
                            </span>
                            <span className="hub-cell__text">
                              <span className="hub-cell__client">{w.client}</span>
                              <span className="hub-cell__title">{w.title}</span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            );
          })}

          {/* canal 099: contacto */}
          <div className="hub-row">
            <p className="hub-row__label">099 // Contacto</p>
            <ul className="hub-cells hub-cells--contact">
              {CONTACT.map((c) => (
                <li key={c.id} className={c.id === 'email' ? 'is-wide' : ''}>
                  {c.id === 'copy' ? (
                    <button
                      type="button"
                      className="hub-cell hub-cell--text"
                      onClick={copyEmail}
                      aria-live="polite"
                      {...navProps(`contact:${c.id}`)}
                    >
                      <span className="hub-cell__client">{c.label}</span>
                      <span className="hub-cell__title">{copied ? '¡Copiado! ✓' : c.value}</span>
                    </button>
                  ) : (
                    <a
                      href={c.href}
                      className="hub-cell hub-cell--text"
                      {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      {...navProps(`contact:${c.id}`)}
                    >
                      {c.id === 'email' && (
                        <img src="/works/tomy-card.webp" alt="" className="hub-cell__thumb" loading="lazy" draggable={false} />
                      )}
                      <span className="hub-cell__text">
                        <span className="hub-cell__client">
                          {c.label} {c.external ? '↗' : '→'}
                        </span>
                        <span className="hub-cell__title">{c.value}</span>
                      </span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* canal 100: clientes */}
          <div className="hub-row hub-row--clients">
            <p className="hub-row__label">100 // Clientes · {CLIENTS.length}</p>
            <div className={`hub-clients ${reduced ? 'is-static' : ''}`}>
              <div ref={trackRef} className="hub-clients__track">
                {(reduced ? CLIENTS : [...CLIENTS, ...CLIENTS]).map((c, i) => (
                  <img
                    key={`${c.file}-${i}`}
                    src={c.logo}
                    alt={i < CLIENTS.length ? c.name : ''}
                    aria-hidden={i >= CLIENTS.length ? true : undefined}
                    loading="lazy"
                    draggable={false}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
