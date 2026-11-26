/**
 * about.ts — los datos de «Sobre mí» (todo real: el CV de Tomy y la versión anterior de
 * la página; los niveles de software son su propia evaluación, actualizada por él el
 * 26 nov 2026).
 *
 * En desarrollo, `?data=worst|empty|one` cambia estos datos por los de peor caso, con el
 * mismo selector de abajo al centro que /works (DevDataToggle). En producción siempre
 * son los reales.
 */
import { readDataMode, WORST_EMAIL } from './worst-case';

export interface SoftwareItem {
  code: string;
  name: string;
  level: number;
}

export interface SoftwareGroup {
  name: string;
  items: SoftwareItem[];
  /** lo próximo a aprender: casilla punteada, sin nivel */
  next?: boolean;
}

export interface Polaroid {
  src: string;
  caption: string;
  alt: string;
}

export interface LogEntry {
  when: string;
  title: string;
  role: string;
  text: string;
}

export interface Channel {
  label: string;
  href: string;
  detail: string;
  external: boolean;
}

export interface AboutData {
  software: SoftwareGroup[];
  technical: string[];
  soft: string[];
  tags: string[];
  polaroids: Polaroid[];
  log: LogEntry[];
  achievements: { big: string; text: string }[];
  channels: Channel[];
}

const DEMO: AboutData = {
  /* agrupados por nivel: 80 o más es dominio */
  software: [
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
  ],
  technical: ['Motion graphics 2D', 'Modelado y escultura 3D', 'Dirección de arte con IA', 'Edición y diseño sonoro'],
  soft: ['Comunicador visual claro', 'Autodidacta y curioso', 'Proyectos de punta a punta', 'Cómodo en equipo y con clientes'],
  /* intereses y hobbies, entre corchetes */
  tags: [
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
  ],
  polaroids: [
    { src: '/works/thumbs/salta-promo-0.webp', caption: 'Salta Cautiva · animación', alt: 'Fotograma de la promo animada de Salta Cautiva: una alpaca pintando un cuadro' },
    { src: '/works/thumbs/south-ia-0.webp', caption: 'South · Cargando IA', alt: 'Fotograma de «Cargando IA» para South: la palabra IA dentro de un anillo de luz' },
    { src: '/works/thumbs/postpro-0.webp', caption: 'DMN4CV · posproducción', alt: 'Fotograma del collage de los años 50 para DMN4CV: recortes en blanco y negro' },
  ],
  log: [
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
  ],
  achievements: [
    { big: '2022', text: 'Gané la categoría Scaled de CrossFit en el box Orkos.' },
    { big: '2025', text: 'Cofundé XamWell, un estudio de impresión 3D.' },
    { big: '30', text: 'marcas en el portfolio, de Diageo a General Motors.' },
  ],
  channels: [
    { label: 'Email', href: 'mailto:tomy.wopell@gmail.com', detail: 'tomy.wopell@gmail.com', external: false },
    { label: 'Instagram', href: 'https://instagram.com/wopell', detail: '@wopell', external: true },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/tomy-powell', detail: 'tomy-powell', external: true },
    { label: 'Telegram', href: 'https://t.me/wopell', detail: '@wopell', external: true },
  ],
};

/* Peor caso: lo que un dato real podría traer el día que se actualice la página. Una
   falla distinta por fila, como llegan los datos reales. */
const WORST: AboutData = {
  software: [
    {
      name: 'Dominio',
      items: [
        { code: 'Ae', name: 'Adobe After Effects', level: 100 },
        { code: 'Pt', name: 'Adobe Substance 3D Painter', level: 100 },
        { code: 'C4', name: 'Maxon Cinema 4D + Redshift', level: 95 },
        { code: 'Bl', name: 'Blender', level: 90 },
        { code: 'IA', name: 'Stable Diffusion, Midjourney y Flux', level: 85 },
      ],
    },
    {
      name: 'En aprendizaje',
      items: [
        { code: 'Td', name: 'TouchDesigner', level: 5 },
        { code: 'Hd', name: 'SideFX Houdini FX', level: 1 },
      ],
    },
    {
      name: 'Lo próximo',
      next: true,
      items: [{ code: 'UE', name: 'Unreal Engine 5.4 con MetaHuman', level: 0 }],
    },
  ],
  technical: ['Dirección de arte con IA generativa para campañas multiplataforma', 'Rotoscopía', 'Edición y diseño sonoro'],
  soft: ['Comunicador visual claro con clientes y equipos internacionales', 'Inglés'],
  tags: [
    'Computadoras y máquinas de fabricación aditiva',
    'Rotoscopía',
    'League of Legends: Wild Rift',
    'Đồ họa chuyển động',
    'アニメーション',
    'Animación 2.5D',
    'Hand painted',
    'Arte de videojuegos',
    '3D estilizado',
    'Arcane',
    'Fortiche',
    'Vóley',
    'CrossFit',
    'Física',
    'Fotografía analógica de 35 mm y revelado en casa',
    'Sintetizadores modulares',
  ],
  polaroids: [
    { src: '/works/thumbs/salta-promo-0.webp', caption: 'Northwind Industries Holdings · animación 2D para redes sociales', alt: 'Fotograma de una animación' },
    { src: '/works/thumbs/falta-este-archivo.webp', caption: 'J · 3D', alt: 'Fotograma que no existe' },
    { src: '/works/thumbs/postpro-0.webp', caption: "Seán O'Brien-Ó Súilleabháin & Asociados · posproducción", alt: 'Fotograma de un collage' },
  ],
  log: [
    {
      when: 'Ene 2023 — Ago 2025',
      title: 'Northwind Industries Holdings Latinoamérica',
      role: 'Director de arte, animador 2D/3D y operador de inteligencia artificial generativa',
      text: 'Flujos de nodos en ComfyUI para campañas de lanzamiento regionales, dirección de arte asistida por IA (Kling, Seedance 2.0, Nano Banana Pro), motion 2D para piezas de redes, coordinación con agencias de medios en cuatro países y entrega de más de 300 variantes por campaña.',
    },
    { when: '2025 — hoy', title: 'IO', role: '', text: '' },
    {
      when: '3 años',
      title: 'Đặng Thị Ngọc Hân & Asociados',
      role: 'Freelance',
      text: 'Motion graphics para bartholomew.fitzgerald@northwind-industries-holdings.example.com y otras cuentas.',
    },
  ],
  achievements: [
    { big: '1.284', text: 'piezas entregadas en 2025.' },
    { big: '12.500', text: 'seguidores en Instagram.' },
    { big: '1', text: 'estudio cofundado.' },
  ],
  channels: [
    { label: 'Email', href: `mailto:${WORST_EMAIL}`, detail: WORST_EMAIL, external: false },
    { label: 'Instagram', href: 'https://instagram.com/aleksandra.wisniewska.kowalczyk.studio', detail: '@aleksandra.wisniewska.kowalczyk.studio', external: true },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/aleksandra-wisniewska-kowalczyk-0b1a2c3d4', detail: 'aleksandra-wisniewska-kowalczyk-0b1a2c3d4', external: true },
    { label: 'Telegram', href: 'https://t.me/wopell', detail: '@wopell', external: true },
  ],
};

const EMPTY: AboutData = {
  software: [],
  technical: [],
  soft: [],
  tags: [],
  polaroids: [],
  log: [],
  achievements: [],
  channels: DEMO.channels,
};

const ONE: AboutData = {
  software: [{ ...DEMO.software[0], items: DEMO.software[0].items.slice(0, 1) }],
  technical: DEMO.technical.slice(0, 1),
  soft: DEMO.soft.slice(0, 1),
  tags: DEMO.tags.slice(0, 1),
  polaroids: DEMO.polaroids.slice(0, 1),
  log: DEMO.log.slice(0, 1),
  achievements: DEMO.achievements.slice(0, 1),
  channels: DEMO.channels.slice(0, 1),
};

const MODE = import.meta.env.DEV ? readDataMode() : null;

export const ABOUT: AboutData = MODE === 'worst' ? WORST : MODE === 'empty' ? EMPTY : MODE === 'one' ? ONE : DEMO;
