/**
 * =========================================================================
 * PROYECTOS Y CATEGORÍAS (FUENTE ÚNICA DE VERDAD) - FASE 1
 * =========================================================================
 * Reutiliza imágenes locales reales y placeholders neutros explícitamente marcados.
 * Detección reactiva de archivos en /public/previews/work-N.(webp|png|jpg).
 * =========================================================================
 */

import { WORKS, type Work } from './display-works';

export interface ProjectItem {
  id: string;
  title: string;
  client: string;
  tag: string;
  year: string;
  image: string;
  description: string;
}

export interface CategoryData {
  id: string;
  title: string;
  number: string;
  subtitle: string;
  description: string;
  image: string;
  badgeColor: string;
  tabBg: string;
  tabText: string;
  projectNote: string;
  stampTag: string;
  projects: ProjectItem[];
}

// Escaneo reactivo de Vite para detectar archivos de usuario en /public/previews/
const userFiles = (import.meta as any).glob?.('/public/previews/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', {
  eager: true,
  query: '?url',
  import: 'default'
}) || {};

/**
 * Resuelve la preview de la categoría (1 a 4).
 * Si existe /public/previews/work-N.(webp|png|jpg), la usa prioritariamente.
 * Si no, usa el recurso local real correspondiente o el placeholder neutro.
 */
export function resolveCategoryPreview(index: number): string {
  const extensions = ['webp', 'png', 'jpg', 'jpeg', 'WEBP', 'PNG', 'JPG', 'JPEG'];
  for (const ext of extensions) {
    const globKey = `/public/previews/work-${index}.${ext}`;
    if (userFiles[globKey]) {
      return `/previews/work-${index}.${ext}`;
    }
  }

  // Fallbacks locales reales y placeholders neutros explícitos
  switch (index) {
    case 1:
      return '/previews/placeholder-neutral-1.svg';
    case 2:
      return '/previews/placeholder-neutral-2.svg';
    case 3:
      return '/previews/placeholder-neutral-3.svg';
    case 4:
      return '/ref/tomy_vintage_card.png';
    default:
      return `/previews/placeholder-neutral-${index}.svg`;
  }
}

/** Piezas reales (display-works) agrupadas por categoría. */
export function workToProject(w: Work): ProjectItem {
  const kind = w.kind === '3D' ? '3D' : w.kind.toLowerCase();
  return {
    id: w.id,
    title: w.title,
    client: w.client,
    tag: w.kind,
    year: `${w.format} · ${w.duration}`,
    image: w.image,
    description: w.client === 'Proyecto personal' ? `Pieza ${kind} personal.` : `Pieza de ${kind} para ${w.client}.`,
  };
}

const fromWorks = (categoryId: string): ProjectItem[] =>
  WORKS.filter((w) => w.categoryId === categoryId).map(workToProject);

export const CATEGORIES: CategoryData[] = [
  {
    id: 'category-animation',
    title: 'ANIMATION',
    number: '001',
    subtitle: 'Motion Graphics, 2D/3D Dynamics & Kinetic Typography',
    description: 'High-energy motion systems, kinetic branding, and fluid character animations.',
    image: resolveCategoryPreview(1),
    badgeColor: '#2563eb',
    tabBg: 'bg-[#2563eb]',
    tabText: 'text-white',
    projectNote: 'kinetic rhythm & variable axes',
    stampTag: 'BALANZ / KINETIC IDENTITY',
    projects: fromWorks('category-animation'),
  },
  {
    id: 'category-3d-art',
    title: '3D ART',
    number: '002',
    subtitle: 'CGI Environments, Hard Surface & Organic Sculpting',
    description: 'Architectural visualizations, procedural materials, and detailed character sculpts.',
    image: resolveCategoryPreview(2),
    badgeColor: '#facc15',
    tabBg: 'bg-[#facc15]',
    tabText: 'text-zinc-950 font-black',
    projectNote: 'brutalist monolith & octane render',
    stampTag: 'ARCHVIZ / VOLUMETRIC SANCTUM',
    projects: fromWorks('category-3d-art'),
  },
  {
    id: 'category-ia',
    title: 'IA',
    number: '003',
    subtitle: 'Generative Systems, Latent Workflows & Neural Art Direction',
    description: 'Experimental AI pipelines, ComfyUI latent synthesis, and neural motion choreography.',
    image: resolveCategoryPreview(3),
    badgeColor: '#818cf8',
    tabBg: 'bg-[#818cf8]',
    tabText: 'text-zinc-950 font-black',
    projectNote: 'latent space diffusion & neural mesh',
    stampTag: 'RUNWAY GEN-3 / LATENT INTERPOLATION',
    projects: fromWorks('category-ia'),
  },
  {
    id: 'category-post-production',
    title: 'POST PRODUCTION',
    number: '004',
    subtitle: 'Color Grading, High-End Compositing, Clean-up & VFX',
    description: 'Film color timing, matchmoving, CGI integration, and finishing for commercial campaigns.',
    image: resolveCategoryPreview(4),
    badgeColor: '#f87171',
    tabBg: 'bg-[#f87171]',
    tabText: 'text-zinc-950 font-black',
    projectNote: "that's me! post-production project",
    stampTag: 'VINTAGE / DIHKSPOOCEZEGG',
    projects: fromWorks('category-post-production'),
  },
];

// la portada de cada carpeta/catálogo es su primera pieza real
for (const c of CATEGORIES) {
  if (c.projects[0]) c.image = c.projects[0].image;
}
