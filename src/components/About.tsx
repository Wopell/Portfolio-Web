import { Fragment, useEffect, useRef, type CSSProperties } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ABOUT, type SoftwareItem } from '../data/about';
import './about.css';

/**
 * Sobre mí — revista con algo de pantalla de videojuego en lo visual (el personaje sobre
 * los anillos, las casillas de software) y palabras normales en los textos.
 * Cada pantalla tiene una sola cosa que manda:
 *  1. Portada: la foto y el nombre enorme.
 *  2. Alias (banda turquesa): Wopell, el personaje dibujado, y el software con su nivel.
 *  3. Experiencia: los trabajos como polaroids y los años en turquesa.
 *  4. Intereses (banda marrón): la meta, el loop de Arcane y los intereses entre corchetes.
 *  5. Logros.
 *  6. Contacto: los canales en letra enorme.
 * Todo es dato real de Tomy (CV y la versión anterior de esta página). Los niveles de
 * software son su propia evaluación (actualizada por él el 26 nov 2026).
 */

type Item = SoftwareItem;

/* los datos viven en data/about.ts (y en desarrollo, ?data=worst|empty|one los cambia) */
const { software: SOFTWARE, technical: TECHNICAL, soft: SOFT, tags: TAGS, polaroids: POLAROIDS, log: LOG, achievements: ACHIEVEMENTS, channels: CHANNELS } = ABOUT;

const SOFTWARE_GROUPS = SOFTWARE.filter((g) => g.items.length > 0);

const SEGMENTS = 10;

/* grupos que entran juntos (polaroids, hitos): escalonado corto y no uniforme */
const STAGGER = [0, 60, 110];

/* entradas al aparecer (una vez); el software llena sus barras */
function useReveal() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = root.querySelectorAll<HTMLElement>('[data-reveal], [data-fill]');
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }),
      { rootMargin: '0px 0px -10% 0px' }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}

function Slot({ item, index, next }: { item: Item; index: number; next?: boolean }) {
  const on = Math.round(item.level / (100 / SEGMENTS));
  return (
    <li className={`ab__slot${next ? ' is-next' : ''}`} style={{ '--i': index } as CSSProperties}>
      <span className="ab__slot-code" aria-hidden="true">
        {item.code}
      </span>
      <span className="ab__slot-lv">{next ? '' : item.level}</span>
      <span className="ab__slot-name">{item.name}</span>
      <span className="ab__slot-bar" aria-hidden="true">
        {Array.from({ length: SEGMENTS }, (_, k) => (
          <i key={k} className={k < on ? 'is-on' : undefined} style={{ '--k': k } as CSSProperties} />
        ))}
      </span>
    </li>
  );
}

/* el loop de Arcane: corre solo en pantalla y sin audio; con reduced-motion, el póster */
function ArcaneLoop() {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.25 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <figure className="ab__loop">
      <video
        ref={ref}
        src="/works/loops/arcane.mp4"
        poster="/works/arcane-0.webp"
        muted
        loop
        playsInline
        preload="none"
        aria-label="Loop del proyecto personal Arcane: una ciudad de noche bajo la luna"
      />
      <figcaption>[ Arcane · proyecto personal, Escuela Da Vinci ]</figcaption>
    </figure>
  );
}

export default function About() {
  const ref = useReveal();
  return (
    <section id="about" className="ab" aria-labelledby="about-title" ref={ref}>
      {/* ── 1. portada ── */}
      <header className="ab__cover">
        <figure className="ab__cover-photo">
          <img
            src="/about/portada.webp"
            width={1024}
            height={1024}
            alt="Tomy Powell en blanco y negro, sentado con la laptop frente a una persiana metálica, con un círculo amarillo detrás de la cabeza y la frase «This is me right now»"
            decoding="async"
          />
        </figure>
        <div className="ab__cover-text">
          <div className="ab__meta">
            <p>
              Artista multimedial
              <br />
              Motion · 3D · IA · Post
            </p>
            <p>
              Buenos Aires, AR
              <br />
              34.60° S · 58.38° O
            </p>
          </div>
          <h2 id="about-title" className="ab__title">
            <span>Tomy</span>
            <span>Powell</span>
          </h2>
          <div className="ab__intro">
            <p className="ab__tag">[ Sobre mí ]</p>
            <p className="ab__intro-text">
              Diseñador multimedial y motion grapher con 3 años de experiencia para agencias y marcas globales. Me
              especializo en motion graphics 2D, modelado y escultura 3D, y dirección de arte con flujos de IA.
              Curioso, autodidacta y cómodo llevando proyectos de punta a punta.
            </p>
          </div>
        </div>
      </header>

      {/* ── 2. alias y software (banda turquesa) ── */}
      <section className="ab__char" aria-labelledby="ab-char">
        <div className="ab__char-id">
          <p className="ab__tag">[ Alias ]</p>
          <h3 id="ab-char" className="ab__char-name">
            Wopell
          </h3>
          <p className="ab__char-class">Artista multimedial · cofundador de XamWell</p>
          <p className="ab__char-quote">«Me mueven la belleza, la física y la curiosidad.»</p>
          {(TECHNICAL.length > 0 || SOFT.length > 0) && (
            <div className="ab__abilities">
              {TECHNICAL.length > 0 && (
                <div>
                  <p className="ab__sub">Habilidades técnicas</p>
                  <ul>
                    {TECHNICAL.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {SOFT.length > 0 && (
                <div>
                  <p className="ab__sub">Habilidades blandas</p>
                  <ul>
                    {SOFT.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <figure className="ab__char-figure">
          <span className="ab__pad" aria-hidden="true" />
          <img
            src="/about/personaje.webp"
            width={749}
            height={1400}
            alt="Wopell, el personaje dibujado de Tomy: anteojos dorados, remera gris, mochila y pantalón negro"
            loading="lazy"
            decoding="async"
          />
        </figure>

        {SOFTWARE_GROUPS.length > 0 && (
        <div className="ab__inv" data-fill>
          <p className="ab__tag">[ Software ]</p>
          {SOFTWARE_GROUPS.map((g) => (
            <div key={g.name} className="ab__inv-group">
              <p className="ab__sub">{g.name}</p>
              <ul className="ab__slots">
                {g.items.map((it, i) => (
                  <Fragment key={it.name}>
                    <Slot item={it} index={i} next={g.next} />
                  </Fragment>
                ))}
              </ul>
            </div>
          ))}
          <p className="ab__note">Niveles de 0 a 100, según mi propia evaluación.</p>
        </div>
        )}
      </section>

      {/* ── 3. experiencia ── */}
      {(LOG.length > 0 || POLAROIDS.length > 0) && (
      <section className="ab__hist" aria-labelledby="ab-hist">
        {POLAROIDS.length > 0 && (
          <div className="ab__polas" data-count={Math.min(POLAROIDS.length, 3)}>
            {POLAROIDS.slice(0, 3).map((p, i) => (
              <figure
                key={p.src}
                className={`ab__pola ab__pola--${i + 1}`}
                style={{ '--d': `${STAGGER[i] ?? 0}ms` } as CSSProperties}
                data-reveal
              >
                <span className="ab__pola-frame">
                  <img
                    src={p.src}
                    width={960}
                    height={540}
                    alt={p.alt}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => e.currentTarget.parentElement?.classList.add('is-missing')}
                  />
                </span>
                {/* una línea: las polaroids se enciman; el texto completo queda en el title */}
                <figcaption title={p.caption}>{`[ ${p.caption} ]`}</figcaption>
              </figure>
            ))}
          </div>
        )}
        <div className="ab__hist-body">
          <p className="ab__tag">[ Experiencia ]</p>
          <h3 id="ab-hist" className="ab__h">
            Dónde estuve
          </h3>
          <ol className="ab__log">
            {LOG.map((e) => (
              <li key={`${e.when}-${e.title}`} className="ab__log-item" data-reveal>
                {e.when && <p className="ab__log-when">{e.when}</p>}
                <p className="ab__log-title">{e.title}</p>
                {e.role && <p className="ab__log-role">{e.role}</p>}
                {e.text && <p className="ab__log-text">{e.text}</p>}
              </li>
            ))}
          </ol>
        </div>
      </section>
      )}

      {/* ── 4. intereses (banda marrón) ── */}
      <section className="ab__quest" aria-labelledby="ab-quest">
        <div className="ab__quest-copy">
          <p className="ab__tag">[ Intereses ]</p>
          <h3 id="ab-quest" className="ab__quest-text" data-reveal>
            Mi meta: trabajar algún día en estudios como Fortiche, llevando el motion estilizado y la pintura a mano al
            digital.
          </h3>
        </div>
        <ArcaneLoop />
        {TAGS.length > 0 && (
          <ul className="ab__tags" aria-label="Intereses y hobbies">
            {TAGS.map((t) => (
              <li key={t}>{`[ ${t} ]`}</li>
            ))}
          </ul>
        )}
      </section>

      {/* ── 5. logros ── */}
      {ACHIEVEMENTS.length > 0 && (
      <section className="ab__extras" aria-labelledby="ab-logros">
        <p className="ab__tag">[ Logros ]</p>
        <h3 id="ab-logros" className="ab__h">
          Hitos
        </h3>
        <ul className="ab__achv">
          {ACHIEVEMENTS.map((a, i) => (
            <li key={a.big} style={{ '--d': `${STAGGER[i] ?? 0}ms` } as CSSProperties} data-reveal>
              <span className="ab__achv-big">{a.big}</span>
              <span className="ab__achv-text">{a.text}</span>
            </li>
          ))}
        </ul>
      </section>
      )}

      {/* ── 6. contacto ── */}
      <section className="ab__contact" aria-labelledby="ab-contact">
        <h3 id="ab-contact" className="ab__tag">
          [ Hablemos ]
        </h3>
        <ul className="ab__channels">
          {CHANNELS.map((c) => (
            <li key={c.label}>
              <a
                href={c.href}
                {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="ab__channel"
              >
                <span className="ab__channel-label">{c.label}</span>
                <ArrowUpRight className="ab__channel-arrow" aria-hidden="true" strokeWidth={2.5} />
              </a>
              <span className="ab__channel-detail" title={c.detail}>
                {c.detail}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* el piso de tinta cierra la página */}
      <div className="ab__end" aria-hidden="true">
        <div className="ab__floor" />
      </div>
    </section>
  );
}
