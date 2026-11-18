/**
 * projects.ts — forma de la ficha (modal) de cada pieza.
 * Las piezas reales viven en display-works.ts; acá solo se adaptan a la ficha.
 */

import type { Work } from './display-works';

export interface ProjectItem {
  id: string;
  title: string;
  client: string;
  tag: string;
  /** formato · duración del archivo original */
  year: string;
  image: string;
  /** heredado: solo lo usan componentes viejos sin uso (AsciiWorld) */
  description?: string;
}

/** heredado: tipo de los componentes viejos sin uso (src/components/ProjectFolders.tsx) */
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

export function workToProject(w: Work): ProjectItem {
  return {
    id: w.id,
    title: w.title,
    client: w.client,
    tag: w.kind,
    year: `${w.format} · ${w.duration}`,
    image: w.image,
  };
}
