import React, { useCallback } from 'react';
import { HeroHeader } from './HeroHeader';
import { WorkTogetherCard } from './WorkTogetherCard';
import { BrandsStrip } from './BrandsStrip';
import { ProjectFolders } from './ProjectFolders';
import { CategoryOverlay } from './CategoryOverlay';
import { ProjectModal } from './ProjectModal';
import { FolderErrorBoundary } from '../FolderErrorBoundary';
import { PlanetSection } from './PlanetSection';
import { WorksDisplay } from './WorksDisplay';
import { SplatFinale } from './SplatFinale';
import { CATEGORIES, CategoryData, ProjectItem, workToProject } from '../../data/projects';
import type { Work } from '../../data/display-works';
import './works-sections.css';
import './playful.css';

export type { CategoryData, ProjectItem };

/**
 * "Mis trabajos" page orchestrator.
 * Order: hero header (approved) → planet (approved, untouched) → display
 * (splats) → contact card → folder deck → brands tape → finale (footer).
 */
export default function Works() {
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
  const [selectedProject, setSelectedProject] = React.useState<ProjectItem | null>(null);

  const closeCategory = useCallback(() => {
    setSelectedCategoryId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const selectedCategory = CATEGORIES.find((c) => c.id === selectedCategoryId) ?? null;

  const openWork = useCallback((w: Work) => setSelectedProject(workToProject(w)), []);

  return (
    <section id="works" className="w-full bg-transparent text-zinc-950 overflow-visible relative">

      {/* 1. Hero header (approved) */}
      <div className="relative w-full mb-0" style={{ zIndex: 'var(--z-title, 50)' }}><HeroHeader /></div>

      {/* 2. Halftone planet with orbiting labels wrapped in PlanetSection (Fase 2) */}
      <PlanetSection />

      {/* 3. Display: piezas reales como splats */}
      <WorksDisplay onOpenWork={openWork} />

      {/* 4. Contact card */}
      <WorkTogetherCard />

      {/* 4. Selected projects folder deck (isolated so it can never blank the page) */}
      <FolderErrorBoundary>
        <ProjectFolders
          categories={CATEGORIES}
          onOpenCategory={(catId) => setSelectedCategoryId(catId)}
        />
      </FolderErrorBoundary>

      {/* 5. Commercial brands */}
      <BrandsStrip />

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
