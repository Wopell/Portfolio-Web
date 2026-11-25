/**
 * worst-case.ts — datos de peor caso para probar /works (solo desarrollo).
 *
 * Se eligen con `?data=` en la URL (demo | worst | empty | one | many) y el
 * selector de abajo al centro (DevDataToggle). En producción no se usa:
 * display-works.ts solo lo consulta cuando import.meta.env.DEV es true.
 *
 * Cada valor es algo que un cliente real podría mandar, no texto al azar.
 */
import type { Work } from './display-works';

export type DataMode = 'demo' | 'worst' | 'empty' | 'one' | 'many';
export const DATA_MODES: { id: DataMode; label: string }[] = [
  { id: 'demo', label: 'Demo' },
  { id: 'worst', label: 'Peor caso' },
  { id: 'empty', label: 'Vacío' },
  { id: 'one', label: 'Una' },
  { id: 'many', label: '60 piezas' },
];

export const readDataMode = (): DataMode | null => {
  if (typeof window === 'undefined') return null;
  const m = new URLSearchParams(window.location.search).get('data');
  return DATA_MODES.some((d) => d.id === m) ? (m as DataMode) : null;
};

/* Una falla distinta por fila, como llegan los datos reales. Ninguna pieza es
   de IA: el filtro «IA» queda sin resultados. */
const WORST: Work[] = [
  {
    id: 'w-long',
    client: 'Aleksandra Wiśniewska-Kowalczyk Studio',
    title: 'Benachrichtigungseinstellungen und Datenschutzrichtlinien',
    kind: 'Animación',
    image: '/works/betterfly-0.webp',
    loop: '/works/loops/betterfly.mp4',
    ratio: '16/9',
    focusX: 0.4,
    format: '1920×1080',
    duration: '0:45',
    categoryId: 'category-animation',
  },
  {
    id: 'w-cjk',
    client: '王秀英工作室',
    title: '春节品牌动画全渠道发布',
    kind: '3D',
    image: '/works/arcane-0.webp',
    loop: '/works/loops/arcane.mp4',
    ratio: '9/16',
    focusX: 0.62,
    format: '1920×1080',
    duration: '2:10',
    categoryId: 'category-3d-art',
  },
  {
    id: 'w-short',
    client: 'J',
    title: 'Jo',
    kind: 'Post',
    image: '/works/postpro-0.webp',
    loop: '/works/loops/postpro.mp4',
    ratio: '16/9',
    format: '1080×1080',
    duration: '0:01',
    categoryId: 'category-post-production',
  },
  {
    id: 'w-rtl',
    client: 'نور الهدى عبد الرحمن',
    title: 'إطلاق العلامة التجارية — حملة رمضان',
    kind: 'Animación',
    image: '/works/salta-promo-0.webp',
    loop: '/works/loops/salta-promo.mp4',
    ratio: '16/9',
    focusX: 0.42,
    format: '1920×1080',
    duration: '0:30',
    categoryId: 'category-animation',
  },
  {
    id: 'w-missing',
    client: '',
    title: '',
    kind: 'Animación',
    image: '/works/falta-este-archivo.webp',
    loop: '',
    ratio: '16/9',
    format: '',
    duration: '',
    categoryId: 'category-animation',
  },
  {
    id: 'w-mixed',
    client: "Seán O'Brien-Ó Súilleabháin & Asociados Comunicación Integral",
    title: '👩🏽‍💻 Priya — Đặng Thị Ngọc Hân <script>alert(1)</script>',
    kind: 'Post',
    image: '/works/mela-b3-0.webp',
    loop: '',
    ratio: '16/9',
    focusX: 0.3,
    format: '7680×4320',
    duration: '1284:00:00',
    categoryId: 'category-post-production',
  },
  {
    id: 'w-file',
    client: 'Christopher Alexander Montgomery III',
    title: 'IMG_20250914_183022_HDR_portrait_edited_edited_FINAL_v12.mov',
    kind: 'Reel',
    image: '/works/reel-0.webp',
    loop: '/works/loops/reel.mp4',
    ratio: '16/9',
    focusX: 0.55,
    format: '3840×2160',
    duration: '12:47',
    categoryId: 'category-post-production',
  },
];

export const WORST_EMAIL = 'bartholomew.fitzgerald@northwind-industries-holdings.example.com';

/** devuelve las piezas del modo pedido (demo = las reales) */
export const worksFor = (mode: DataMode, demo: Work[]): Work[] => {
  switch (mode) {
    case 'worst':
      return WORST;
    case 'empty':
      return [];
    case 'one':
      return demo.slice(0, 1);
    case 'many':
      // tope realista de un portfolio: 60 piezas (no hay paginación)
      return Array.from({ length: 60 }, (_, i) => {
        const w = demo[i % demo.length];
        return { ...w, id: `${w.id}-${i}`, title: `${w.title} ${Math.floor(i / demo.length) + 1}` };
      });
    default:
      return demo;
  }
};
