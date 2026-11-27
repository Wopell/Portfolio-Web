/**
 * works.ts — piezas reales del Display (fotogramas sacados de los videos en
 * «Mis trabajos/motion»). Formato y duración son los del archivo original.
 * Para sumar una pieza: exportá un fotograma a /public/works/<id>.webp y
 * agregá una entrada acá.
 *
 * Los videos del canal de YouTube entran solos: scripts/sync-youtube.mjs los guarda en
 * youtube-works.json y se suman después de estas piezas. Si un video del canal ya está
 * acá, poné su `youtubeId` en la entrada: no se repite y la ficha lo reproduce.
 */

import { asset } from '../lib/asset';
import { readDataMode, worksFor, WORST_EMAIL } from './worst-case';
import YOUTUBE from './youtube-works.json';

export type WorkKind = 'Animación' | '3D' | 'IA' | 'Post' | 'Reel' | 'Video';

export interface Work {
  id: string;
  client: string;
  title: string;
  kind: WorkKind;
  /** fotograma principal (póster) */
  image: string;
  /** loop corto sin audio (public/works/loops), exportado del video original */
  loop: string;
  /** proporción del video: horizontal, vertical o cuadrado */
  ratio: '16/9' | '9/16' | '1/1';
  /** encuadre en mobile: punto focal horizontal 0..1 */
  focusX?: number;
  format: string;
  duration: string;
  /** categoría del archivo (CATEGORIES) a la que pertenece; vacía = solo en «Todo» */
  categoryId: string;
  /** el mismo video en YouTube: la ficha lo puede reproducir */
  youtubeId?: string;
  /** dónde verlo completo */
  url?: string;
}

const DEMO_WORKS: Work[] = [
  {
    id: 'arcane',
    client: 'Proyecto personal',
    title: 'Arcane',
    kind: '3D',
    image: '/works/arcane-0.webp',
    loop: '/works/loops/arcane.mp4',
    ratio: '16/9',
    focusX: 0.62,
    format: '1920×1080',
    duration: '1:32',
    categoryId: 'category-3d-art',
    youtubeId: 'PCSUEZ2ZALM', // «Parallax practice» en el canal
  },
  {
    id: 'salta-promo',
    client: 'Salta Cautiva',
    title: 'Promo Cautivaaante',
    kind: 'Animación',
    image: '/works/salta-promo-0.webp',
    loop: '/works/loops/salta-promo.mp4',
    ratio: '16/9',
    focusX: 0.42,
    format: '1920×1080',
    duration: '0:15',
    categoryId: 'category-animation',
  },
  {
    id: 'betterfly',
    client: 'Betterfly',
    title: 'Kickoff 25',
    kind: 'Animación',
    image: '/works/betterfly-0.webp',
    loop: '/works/loops/betterfly.mp4',
    ratio: '16/9',
    focusX: 0.4,
    format: '1920×1080',
    duration: '1:26',
    categoryId: 'category-animation',
  },
  {
    id: 'mela-b3',
    client: 'La Roche-Posay',
    title: 'Mela B3 Serum',
    kind: 'Post',
    image: '/works/mela-b3-0.webp',
    loop: '/works/loops/mela-b3.mp4',
    ratio: '16/9',
    focusX: 0.3,
    format: '1920×1080',
    duration: '3:51',
    categoryId: 'category-post-production',
  },
  {
    id: 'buen-dolar',
    client: 'Buen Dólar',
    title: 'Invertí en propósitos',
    kind: 'Animación',
    image: '/works/buen-dolar-0.webp',
    loop: '/works/loops/buen-dolar.mp4',
    ratio: '16/9',
    focusX: 0.62,
    format: '1920×1080',
    duration: '0:56',
    categoryId: 'category-animation',
  },
  {
    id: 'salta-negra',
    client: 'Salta Cautiva',
    title: 'Negra — Pre-roll',
    kind: 'Animación',
    image: '/works/salta-negra-0.webp',
    loop: '/works/loops/salta-negra.mp4',
    ratio: '16/9',
    focusX: 0.7,
    format: '1920×1080',
    duration: '0:20',
    categoryId: 'category-animation',
  },
  {
    id: 'reel',
    client: 'Wopell',
    title: 'Demo Reel — Reset',
    kind: 'Reel',
    image: '/works/reel-0.webp',
    loop: '/works/loops/reel.mp4',
    ratio: '16/9',
    focusX: 0.55,
    format: '1920×1080',
    duration: '1:01',
    categoryId: 'category-post-production',
  },
  {
    id: 'master-metrics',
    client: 'Master Metrics',
    title: 'Lanzamiento',
    kind: 'Animación',
    image: '/works/master-metrics-0.webp',
    loop: '/works/loops/master-metrics.mp4',
    ratio: '16/9',
    focusX: 0.5,
    format: '1920×1080',
    duration: '0:40',
    categoryId: 'category-animation',
  },
  {
    id: 'postpro',
    client: 'DMN4CV',
    title: 'Collage 50s',
    kind: 'Post',
    image: '/works/postpro-0.webp',
    loop: '/works/loops/postpro.mp4',
    ratio: '16/9',
    focusX: 0.5,
    format: '1920×1080',
    duration: '0:56',
    categoryId: 'category-post-production',
    youtubeId: '-SEsXhdf4zc', // «TP2 PostPro» en el canal
  },
  {
    id: 'banco-macro',
    client: 'Banco Macro',
    title: 'BancoChat',
    kind: 'Animación',
    image: '/works/banco-macro-0.webp',
    loop: '/works/loops/banco-macro.mp4',
    ratio: '16/9',
    focusX: 0.5,
    format: '1920×1080',
    duration: '1:06',
    categoryId: 'category-animation',
  },
  {
    id: 'south-ia',
    client: 'South',
    title: 'Cargando IA',
    kind: 'IA',
    image: '/works/south-ia-0.webp',
    loop: '/works/loops/south-ia.mp4',
    ratio: '16/9',
    focusX: 0.5,
    format: '1920×1080',
    duration: '0:05',
    categoryId: 'category-ia',
  },
  /* verticales (1080×1920) de Salta Cautiva: título y tipo sacados del nombre de
     archivo del video; confirmar con Tomy */
  {
    id: 'negra-organico',
    client: 'Salta Cautiva',
    title: 'Negra — Orgánico',
    kind: 'Animación',
    image: '/works/negra-organico-0.webp',
    loop: '/works/loops/negra-organico.mp4',
    ratio: '9/16',
    format: '1080×1920',
    duration: '0:15',
    categoryId: 'category-animation',
  },
  {
    id: 'ipa-ilustrado',
    client: 'Salta Cautiva',
    title: 'IPA ilustrado',
    kind: 'Animación',
    image: '/works/ipa-ilustrado-0.webp',
    loop: '/works/loops/ipa-ilustrado.mp4',
    ratio: '9/16',
    format: '1080×1920',
    duration: '0:15',
    categoryId: 'category-animation',
  },
  {
    id: 'relaunch-credenciales',
    client: 'Salta Cautiva',
    title: 'Relaunch credenciales',
    kind: 'Animación',
    image: '/works/relaunch-credenciales-0.webp',
    loop: '/works/loops/relaunch-credenciales.mp4',
    ratio: '9/16',
    format: '1080×1920',
    duration: '0:20',
    categoryId: 'category-animation',
  },
];

/* En desarrollo, `?data=worst|empty|one|many` cambia las piezas por datos de peor
   caso (worst-case.ts). En producción siempre son las reales. */
const DEV_MODE = import.meta.env.DEV ? readDataMode() : null;

/* los del canal que no están arriba, del más nuevo al más viejo */
const fromYoutube = (YOUTUBE as Work[]).filter((y) => !DEMO_WORKS.some((w) => w.youtubeId === y.youtubeId));
const REAL_WORKS: Work[] = [
  ...DEMO_WORKS.map((w) => (w.youtubeId ? { ...w, url: `https://www.youtube.com/watch?v=${w.youtubeId}` } : w)),
  ...fromYoutube,
].map((w) => ({ ...w, image: asset(w.image), loop: w.loop && asset(w.loop) }));

export const WORKS: Work[] = DEV_MODE ? worksFor(DEV_MODE, REAL_WORKS) : REAL_WORKS;

/** mail de contacto del cierre */
export const CONTACT_EMAIL = DEV_MODE === 'worst' ? WORST_EMAIL : 'tomy.wopell@gmail.com';

/**
 * Filtros de la grilla. `planet` es el número de categoría de cada círculo del
 * planeta: al hacer clic en uno, la grilla se filtra por esa categoría.
 */
export const FILTERS = [
  { id: 'all', label: 'Todo' },
  { id: 'category-animation', label: 'Animación', planet: '001' },
  { id: 'category-3d-art', label: '3D', planet: '002' },
  { id: 'category-ia', label: 'IA', planet: '003' },
  { id: 'category-post-production', label: 'Post', planet: '004' },
] as const;

export type FilterId = (typeof FILTERS)[number]['id'];

/** evento que emite el planeta para filtrar la grilla (detail = número de categoría) */
export const FILTER_EVENT = 'works:filter';
