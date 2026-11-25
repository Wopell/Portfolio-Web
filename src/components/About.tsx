import { useEffect, useRef, type CSSProperties } from 'react';
import './about.css';

/**
 * Sobre mí — póster + anotaciones.
 * Una pantalla casi vacía con el nombre (contraste de peso, como un afiche) y
 * después los datos del CV como anotaciones sueltas en mucho espacio: una
 * barra negra, un título corto y una línea gris. Nada de barras de skills.
 */

interface Note {
  title: string;
  meta?: string;
  text: string;
}

const NOTES: Note[] = [
  {
    title: 'XamWell',
    meta: 'Cofundador · 3D & 2D Artist · 2025 – hoy',
    text: 'Modelado y escultura 3D de piezas impresas; dirección de arte e identidad del estudio.',
  },
  {
    title: 'South',
    meta: 'Animador · IA · 2023 – 2025',
    text: 'Flujos en ComfyUI y motion 2D para Salta Cautiva, Banco Chat y Naldo Sedes.',
  },
  {
    title: 'Freelance',
    meta: 'Motion grapher y editor · 3 años',
    text: 'General Motors, Johnnie Walker, Diageo, Guinness y Contagram, entre otras.',
  },
  {
    title: 'Escuela Da Vinci',
    meta: 'Diseño Multimedial · 2022 – 2025',
    text: 'Cursada completa, tesis en desarrollo.',
  },
  {
    title: 'Herramientas',
    text: 'After Effects, Premiere Pro, Illustrator, Photoshop, Blender, Substance Painter y ComfyUI.',
  },
  {
    title: 'Lo que me mueve',
    text: 'Pintura a mano, 3D estilizado y arte de videojuegos. Arcane y Fortiche, siempre.',
  },
  {
    title: 'Idiomas',
    text: 'Español nativo · Inglés B1 · Japonés básico.',
  },
];

const LINKS = [
  { label: 'Instagram', href: 'https://instagram.com/wopell' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/tomy-powell' },
  { label: 'Telegram', href: 'https://t.me/wopell' },
];

/* las anotaciones aparecen al entrar en pantalla (una vez); sin JS por cuadro */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = root.querySelectorAll<HTMLElement>('[data-reveal]');
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }),
      { rootMargin: '0px 0px -12% 0px' }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}

export default function About() {
  const ref = useReveal();
  return (
    <section id="about" className="ab" aria-labelledby="about-title" ref={ref}>
      {/* ── póster ── */}
      <div className="ab__poster">
        <div className="ab__head" data-reveal>
          <h2 id="about-title" className="ab__name">
            <span className="ab__name-strong">Tomy</span>
            <span className="ab__name-light">Powell</span>
          </h2>
          <p className="ab__line">Motion graphics, 3D y dirección de arte con IA. Buenos Aires.</p>
        </div>
        {/* el piso: anillos negros sobre el papel (eco de las órbitas del planeta) */}
        <div className="ab__floor" aria-hidden="true" />
      </div>

      {/* ── anotaciones ── */}
      <div className="ab__notes">
        <p className="ab__intro" data-reveal>
          Diseñador multimedial. Tres años animando para agencias y marcas globales, de punta a punta.
        </p>
        <ul className="ab__list">
          {NOTES.map((n, i) => (
            <li key={n.title} className="ab__note" style={{ '--i': i } as CSSProperties} data-reveal>
              <p className="ab__note-title">
                <span className="ab__bar" aria-hidden="true" />
                {n.title}
              </p>
              {n.meta && <p className="ab__note-meta">{n.meta}</p>}
              <p className="ab__note-text">{n.text}</p>
            </li>
          ))}
          <li className="ab__note ab__note--contact" style={{ '--i': NOTES.length } as CSSProperties} data-reveal>
            <p className="ab__note-title">
              <span className="ab__plus" aria-hidden="true">+</span>
              Hablemos
            </p>
            <a className="ab__mail" href="mailto:tomy.wopell@gmail.com">
              tomy.wopell@gmail.com
            </a>
            <ul className="ab__links" aria-label="Redes">
              {LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </div>
    </section>
  );
}
