import React, { useCallback, useRef } from 'react';
import { HeroHeader } from './HeroHeader';
import { CategoryOverlay } from './CategoryOverlay';
import { ProjectModal } from './ProjectModal';
import { FolderErrorBoundary } from '../FolderErrorBoundary';
import { PlanetSection } from './PlanetSection';
import { WorksHub } from './WorksHub';
import { SplatFinale } from './SplatFinale';
import { CATEGORIES, CategoryData, ProjectItem, workToProject } from '../../data/projects';
import type { Work } from '../../data/display-works';
import './works-sections.css';
import './playful.css';

export type { CategoryData, ProjectItem };

/**
 * "Mis trabajos" page orchestrator.
 * Order: hero header (approved) → planet (approved, untouched) → hub «guía de
 * canales» (pantalla + carpetas + contacto + clientes) → finale (footer).
 */
export default function Works() {
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
  const [selectedProject, setSelectedProject] = React.useState<ProjectItem | null>(null);
  /* quien abrió el catálogo recupera el foco al cerrarlo (y la página no se mueve) */
  const openerRef = useRef<HTMLElement | null>(null);

  const openCategory = useCallback((catId: string) => {
    openerRef.current = document.activeElement as HTMLElement | null;
    setSelectedCategoryId(catId);
  }, []);

  const closeCategory = useCallback(() => {
    setSelectedCategoryId(null);
    const el = openerRef.current;
    window.setTimeout(() => el?.focus({ preventScroll: true }), 320);
  }, []);

  const selectedCategory = CATEGORIES.find((c) => c.id === selectedCategoryId) ?? null;

  const openWork = useCallback((w: Work) => setSelectedProject(workToProject(w)), []);

  return (
    <section id="works" className="w-full bg-transparent text-zinc-950 overflow-visible relative">

      {/* 1. Hero header (approved) */}
      <div className="relative w-full mb-0" style={{ zIndex: 'var(--z-title, 50)' }}><HeroHeader /></div>

      {/* 2. Halftone planet with orbiting labels wrapped in PlanetSection (Fase 2) */}
      <PlanetSection />

      {/* 3. Hub: pantalla + guía (carpetas, contacto, clientes) en una sola superficie */}
      <FolderErrorBoundary>
        <WorksHub categories={CATEGORIES} onOpenWork={openWork} onOpenCategory={openCategory} />
      </FolderErrorBoundary>

      {/* Imagen final + pie */}
      <SplatFinale />

      {/* Full-screen category catalog (stays mounted; GSAP handles visibility) */}
      <CategoryOverlay
        category={selectedCategory}
        onClose={closeCategory}
        onOpenProject={(project) => setSelectedProject(project)}
      />

      {/* Project lightbox */}
      <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
    </section>
  );
}
