/**
 * works.ts — piezas reales del Display (fotogramas sacados de los videos en
 * «Mis trabajos/motion»). Formato y duración son los del archivo original.
 * Para sumar una pieza: exportá un fotograma a /public/works/<id>.webp y
 * agregá una entrada acá.
 */

export type WorkKind = 'Animación' | '3D' | 'IA' | 'Post' | 'Reel';

export interface Work {
  id: string;
  client: string;
  title: string;
  kind: WorkKind;
  /** fotograma principal (16:9) */
  image: string;
  /** encuadre en mobile: punto focal horizontal 0..1 */
  focusX?: number;
  format: string;
  duration: string;
  /** categoría del archivo (CATEGORIES) a la que pertenece */
  categoryId: string;
}

export const WORKS: Work[] = [
  {
    id: 'arcane',
    client: 'Proyecto personal',
    title: 'Arcane',
    kind: '3D',
    image: '/works/arcane-0.webp',
    focusX: 0.62,
    format: '1920×1080',
    duration: '1:32',
    categoryId: 'category-3d-art',
  },
  {
    id: 'salta-promo',
    client: 'Salta Cautiva',
    title: 'Promo Cautivaaante',
    kind: 'Animación',
    image: '/works/salta-promo-0.webp',
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
    focusX: 0.5,
    format: '1920×1080',
    duration: '0:56',
    categoryId: 'category-post-production',
  },
  {
    id: 'banco-macro',
    client: 'Banco Macro',
    title: 'BancoChat',
    kind: 'Animación',
    image: '/works/banco-macro-0.webp',
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
    focusX: 0.5,
    format: '1920×1080',
    duration: '0:05',
    categoryId: 'category-ia',
  },
];

/** imagen de cierre de la página (la «imagen final») */
export const FINALE_IMAGE = '/works/arcane-1.webp';
