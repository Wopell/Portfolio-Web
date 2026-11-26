import { Fragment, useEffect, useRef, type CSSProperties } from 'react';
import { ArrowUpRight } from 'lucide-react';
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

interface Item {
  code: string;
  name: string;
  level: number;
}

/* agrupados por nivel: 80 o más es dominio */
const SOFTWARE: { name: string; items: Item[]; next?: boolean }[] = [
  {
    name: 'Dominio',
    items: [
      { code: 'Ae', name: 'After Effects', level: 100 },
      { code: 'Ai', name: 'Illustrator', level: 100 },
      { code: 'Ps', name: 'Photoshop', level: 100 },
      { code: 'Bl', name: 'Blender', level: 90 },
      { code: 'IA', name: 'IA generativa', level: 90 },
      { code: 'Pr', name: 'Premiere Pro', level: 85 },
      { code: 'Wb', name: 'Diseño web', level: 85 },
      { code: 'Pt', name: 'Substance Painter', level: 80 },
    ],
  },
  {
    name: 'En aprendizaje',
    items: [
      { code: 'Dv', name: 'DaVinci Resolve', level: 60 },
      { code: 'Un', name: 'Unity', level: 40 },
      { code: 'Cf', name: 'ComfyUI', level: 40 },
      { code: 'Nk', name: 'Nuke', level: 20 },
    ],
  },
  {
    name: 'Lo próximo',
    next: true,
    items: [
      { code: 'UE', name: 'Unreal Engine 5', level: 0 },
      { code: 'Hd', name: 'Houdini', level: 0 },
    ],
  },
];

const SEGMENTS = 10;

const TECHNICAL = ['Motion graphics 2D', 'Modelado y escultura 3D', 'Dirección de arte con IA', 'Edición y diseño sonoro'];
const SOFT = ['Comunicador visual claro', 'Autodidacta y curioso', 'Proyectos de punta a punta', 'Cómodo en equipo y con clientes'];

/* intereses y hobbies, entre corchetes (del CV y de la versión anterior de la página) */
const TAGS = [
  'Animación 2.5D',
  'Hand painted',
  'Arte de videojuegos',
  '3D estilizado',
  'Arcane',
  'Fortiche',
  'League of Legends',
  'Videojuegos',
  'Vóley',
  'CrossFit',
  'Física',
  'Computadoras y máquinas',
];

const POLAROIDS = [
  { src: '/works/thumbs/salta-promo-0.webp', caption: 'Salta Cautiva · animación', alt: 'Fotograma de la promo animada de Salta Cautiva: una alpaca pintando un cuadro' },
  { src: '/works/thumbs/south-ia-0.webp', caption: 'South · Cargando IA', alt: 'Fotograma de «Cargando IA» para South: la palabra IA dentro de un anillo de luz' },
  { src: '/works/thumbs/postpro-0.webp', caption: 'DMN4CV · posproducción', alt: 'Fotograma del collage de los años 50 para DMN4CV: recortes en blanco y negro' },
];

const LOG = [
  {
    when: '2025 — hoy',
    title: 'XamWell',
    role: 'Cofundador · 3D & 2D artist',
    text: 'Modelado y escultura 3D (Blender, ZBrush) de piezas impresas; dirección de arte, identidad y desarrollo comercial del estudio.',
  },
  {
    when: '2023 — 2025',
    title: 'South',
    role: 'Animador · investigador y operador de IA',
    text: 'Flujos de nodos en ComfyUI y dirección de arte con IA (Kling, Seedance 2.0, Nano Banana Pro); motion 2D para Salta Cautiva, Banco Chat y Naldo Sedes.',
  },
  {
    when: '3 años',
    title: 'Freelance',
    role: 'Motion grapher y editor de video',
    text: 'Motion graphics, edición y diseño sonoro para General Motors, Johnnie Walker, Diageo, Guinness y Contagram, entre otras.',
  },
  {
    when: '2022 — 2025',
    title: 'Escuela Da Vinci',
    role: 'Diseño Multimedial',
    text: 'Cursada completa, tesis en desarrollo. Antes, la certificación en Diseño Digital y Producción Audiovisual (2022 — 2023).',
  },
];

const ACHIEVEMENTS = [
  { big: '2022', text: 'Gané la categoría Scaled de CrossFit en el box Orkos.' },
  { big: '2025', text: 'Cofundé XamWell, un estudio de impresión 3D.' },
  { big: '30', text: 'marcas en el portfolio, de Diageo a General Motors.' },
];

/* grupos que entran juntos (polaroids, hitos): escalonado corto y no uniforme */
const STAGGER = [0, 60, 110];

const CHANNELS = [
  { label: 'Email', href: 'mailto:tomy.wopell@gmail.com', detail: 'tomy.wopell@gmail.com', external: false },
  { label: 'Instagram', href: 'https://instagram.com/wopell', detail: '@wopell', external: true },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/tomy-powell', detail: 'tomy-powell', external: true },
  { label: 'Telegram', href: 'https://t.me/wopell', detail: '@wopell', external: true },
];

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
          <div className="ab__abilities">
            <div>
              <p className="ab__sub">Habilidades técnicas</p>
              <ul>
                {TECHNICAL.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="ab__sub">Habilidades blandas</p>
              <ul>
                {SOFT.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
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

        <div className="ab__inv" data-fill>
          <p className="ab__tag">[ Software ]</p>
          {SOFTWARE.map((g) => (
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
      </section>

      {/* ── 3. experiencia ── */}
      <section className="ab__hist" aria-labelledby="ab-hist">
        <div className="ab__polas">
          {POLAROIDS.map((p, i) => (
            <figure
              key={p.src}
              className={`ab__pola ab__pola--${i + 1}`}
              style={{ '--d': `${STAGGER[i] ?? 0}ms` } as CSSProperties}
              data-reveal
            >
              <img src={p.src} width={960} height={540} alt={p.alt} loading="lazy" decoding="async" />
              <figcaption>{`[ ${p.caption} ]`}</figcaption>
            </figure>
          ))}
        </div>
        <div className="ab__hist-body">
          <p className="ab__tag">[ Experiencia ]</p>
          <h3 id="ab-hist" className="ab__h">
            Dónde estuve
          </h3>
          <ol className="ab__log">
            {LOG.map((e) => (
              <li key={e.title} className="ab__log-item" data-reveal>
                <p className="ab__log-when">{e.when}</p>
                <p className="ab__log-title">{e.title}</p>
                <p className="ab__log-role">{e.role}</p>
                <p className="ab__log-text">{e.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

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
        <ul className="ab__tags" aria-label="Intereses y hobbies">
          {TAGS.map((t) => (
            <li key={t}>{`[ ${t} ]`}</li>
          ))}
        </ul>
      </section>

      {/* ── 5. logros ── */}
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
              <span className="ab__channel-detail">{c.detail}</span>
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
