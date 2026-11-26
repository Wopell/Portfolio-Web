import React, { useCallback } from 'react';
import { HeroHeader } from './HeroHeader';
import { ProjectModal } from './ProjectModal';
import { FolderErrorBoundary } from '../FolderErrorBoundary';
import { PlanetSection } from './PlanetSection';
import { WorksHub } from './WorksHub';
import { BlackHole } from './BlackHole';
import { Finale } from './Finale';
import { Footer } from './Footer';
import { ProjectItem, workToProject } from '../../data/projects';
import type { Work } from '../../data/display-works';
import './works-sections.css';

export type { ProjectItem };

/**
 * "Mis trabajos": un recorrido continuo sobre el mismo papel.
 * Hero (aprobado) → planeta (aprobado; sus círculos filtran) → trabajos
 * → agujero negro (transición) → trabajos (filtros + galería) → footer (tira
 * con los 30 clientes y firma) → placa de contacto, que entra por transición.
 */
export default function Works() {
  const [selectedProject, setSelectedProject] = React.useState<ProjectItem | null>(null);
  const openWork = useCallback((w: Work) => setSelectedProject(workToProject(w)), []);

  return (
    <main id="works" className="w-full bg-transparent text-zinc-950 overflow-visible relative">
      {/* 1. Hero (aprobado) */}
      <div className="relative w-full mb-0" style={{ zIndex: 'var(--z-title, 50)' }}>
        <HeroHeader />
      </div>

      {/* 2. Planeta (aprobado) */}
      <PlanetSection />

      {/* 2b. Transición: el agujero negro se traga CREATIVE y las etiquetas del planeta */}
      <BlackHole />

      {/* 3. Trabajos */}
      <FolderErrorBoundary>
        <WorksHub onOpenWork={openWork} />
      </FolderErrorBoundary>

      {/* 4. Footer: la tira con los 30 clientes y la firma */}
      <Footer />

      {/* 5. Placa de contacto (entra por transición), al final */}
      <Finale />

      {/* Ficha de cada pieza */}
      <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
    </main>
  );
}
