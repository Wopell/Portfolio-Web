import React, { useCallback } from 'react';
import { HeroHeader } from './HeroHeader';
import { WorkTogetherCard } from './WorkTogetherCard';
import { BrandsStrip } from './BrandsStrip';
import { ProjectFolders } from './ProjectFolders';
import { CategoryOverlay } from './CategoryOverlay';
import { ProjectModal } from './ProjectModal';
import { FolderErrorBoundary } from '../FolderErrorBoundary';
import { PlanetHero } from '../PlanetHero';
import { InkParticles } from './InkParticles';
import { CATEGORIES, CategoryData, ProjectItem } from '../../data/projects';
import './works-sections.css';

export type { CategoryData, ProjectItem };

/**
 * "Mis trabajos" page orchestrator.
 * Order: hero header (approved) → planet (approved, untouched) → contact card
 * → selected-projects folder deck → commercial brands → footer.
 */
export default function Works() {
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
  const [selectedProject, setSelectedProject] = React.useState<ProjectItem | null>(null);

  const closeCategory = useCallback(() => {
    setSelectedCategoryId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const selectedCategory = CATEGORIES.find((c) => c.id === selectedCategoryId) ?? null;

  return (
    <section id="works" className="w-full bg-transparent text-zinc-950 pb-20 overflow-visible relative">
      {/* Ink particles over the paper field */}
      <InkParticles />

      {/* 1. Hero header (approved) */}
      <div
        className="relative pointer-events-none w-full max-w-[1100px] mx-auto px-3 sm:px-6 mb-6 sm:mb-12"
        style={{ zIndex: 'var(--z-title, 50)' }}
      >
        <HeroHeader />
      </div>

      {/* 2. Halftone planet with orbiting labels (approved, untouched) */}
      <div
        data-section="planet"
        className="relative w-full max-w-[1280px] mx-auto px-2 sm:px-4 overflow-visible"
        style={{ isolation: 'isolate', zIndex: 'var(--z-planet, 10)' }}
      >
        <PlanetHero />
      </div>

      <div className="w-full max-w-[860px] mx-auto px-3 sm:px-6">
        {/* 3. Contact card */}
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

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-black/15 flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-600 font-bold">
          <span>WOPELL // TOMY POWELL — PORTFOLIO CREATIVO</span>
          <span>BA — AR • WORLDWIDE</span>
        </footer>
      </div>

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
