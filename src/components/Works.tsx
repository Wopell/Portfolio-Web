import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ArrowUpRight, 
  X,
  Instagram,
  Send,
  Mail,
  Copy,
  Check,
  Palette
} from 'lucide-react';
import { PlanetHero } from './PlanetHero';
import { ProjectFolders } from './ProjectFolders';
import { FolderErrorBoundary } from './FolderErrorBoundary';
import { CATEGORIES, CategoryData, ProjectItem } from '../data/projects';

export type { CategoryData, ProjectItem };

const BRANDS = [
  { name: "Diageo", logo: "/logos/Black/Diageo.webp" },
  { name: "Elemento", logo: "/logos/Black/Elemento.webp" },
  { name: "Footy", logo: "/logos/Black/Footy.webp" },
  { name: "Chevrolet", logo: "/logos/Black/Chevrolet.webp" },
  { name: "L'Oreal", logo: "/logos/Black/Loreal.webp" },
  { name: "Guinness", logo: "/logos/Black/Guinness.webp" },
  { name: "Johnnie Walker", logo: "/logos/Black/Johnnie Walker.webp" },
  { name: "Puma Energy", logo: "/logos/Black/Puma.webp" },
  { name: "Wegovy", logo: "/logos/Black/Wegovy.webp" },
  { name: "Telecom", logo: "/logos/Black/Telecom.webp" },
  { name: "Amaze", logo: "/logos/Black/Amaze.webp" },
  { name: "Smirnoff", logo: "/logos/Black/Smirnoff.webp" },
  { name: "Balanz", logo: "/logos/Black/Balanz.webp" },
  { name: "Banco Macro", logo: "/logos/Black/Banco Macro.webp" },
];

interface ProjectSquareCardProps {
  key?: React.Key;
  project: ProjectItem;
  onClick: () => void;
}

function ProjectSquareCard({ project, onClick }: ProjectSquareCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className="group relative aspect-square rounded-2xl md:rounded-3xl overflow-hidden bg-zinc-900 border border-black/10 shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.2)] transition-all duration-500 cursor-pointer select-none"
    >
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {!isLoaded && (
          <div className="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
          </div>
        )}
        <img
          src={project.image}
          alt={project.title}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          className="w-full h-full object-cover scale-100 group-hover:scale-108 transition-transform duration-700 ease-out"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/35 group-hover:from-black/75 transition-colors duration-500" />
      </div>

      <div className="absolute top-3 left-3 right-3 md:top-4 md:left-4 md:right-4 z-20 flex items-center justify-between pointer-events-none">
        <span className="glass-pill-badge px-3 py-1 rounded-full text-[10px] md:text-xs font-mono font-semibold tracking-wider text-white drop-shadow-sm">
          {project.client}
        </span>
        <div className="glass-pill-badge w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110 shadow-lg">
          <ArrowUpRight size={14} />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-3.5 md:p-5 z-20 flex flex-col justify-end pointer-events-none">
        <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-zinc-300 font-medium">
          {project.tag} • {project.year}
        </span>
        <h3 className="mt-1 text-xs sm:text-sm md:text-base font-sans font-bold tracking-tight text-white leading-snug drop-shadow-md">
          {project.title}
        </h3>
      </div>
    </motion.div>
  );
}

function ProjectModal({
  project,
  onClose,
}: {
  project: ProjectItem | null;
  onClose: () => void;
}) {
  if (!project) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/85 backdrop-blur-xl"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-4xl w-full bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/60 text-white hover:bg-white hover:text-black transition-all shadow-md cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>

          <div className="w-full h-[45vh] md:h-[55vh] relative overflow-hidden bg-black" data-flip-target="project-image-container">
            <img
              src={project.image}
              alt={project.title}
              data-flip-target="project-image"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
          </div>

          <div className="p-6 md:p-8 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-2 font-mono text-xs text-zinc-400 uppercase tracking-widest">
              <span>{project.client}</span>
              <span>•</span>
              <span>{project.tag}</span>
              <span>•</span>
              <span>{project.year}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-black tracking-tight text-white mb-3">
              {project.title}
            </h2>
            <p className="text-zinc-300 font-sans text-sm md:text-base leading-relaxed max-w-2xl">
              {project.description}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* =========================================================================
   1. HERO HEADER (Exact pixel font, marker font & navigation pill)
   ========================================================================= */
function HeroHeader() {
  return (
    <div
      id="hero-header-container"
      className="relative pointer-events-none w-full pt-4 pb-2 flex flex-col items-center justify-center text-center select-none"
      style={{ zIndex: 'var(--z-title, 50)' }}
    >
      {/* Decorative Blueprint Crosses (+) */}
      <div className="absolute -left-3 sm:left-2 top-0 text-zinc-400 font-mono text-xl pointer-events-none opacity-60">
        +
      </div>
      <div className="absolute -right-3 sm:right-2 top-0 text-zinc-400 font-mono text-xl pointer-events-none opacity-60">
        +
      </div>

      {/* Top curved annotation: TURNING IDEAS INTO VISUALS. ↴ */}
      <div className="flex items-center gap-2 mb-1.5 text-zinc-900">
        <span className="font-mono text-xs sm:text-sm font-black tracking-widest uppercase">
          TURNING IDEAS INTO VISUALS.
        </span>
        <svg
          className="w-5 h-5 text-zinc-900 -rotate-12 translate-y-0.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
        >
          <path d="M4 4 C10 4, 18 10, 18 18" strokeLinecap="round" />
          <path d="M13 14 L18 19 L22 14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Main Titles: Chunky Pixel Font & Raw Marker Brush Script */}
      <div className="relative flex flex-col items-center">
        {/* Floating sparkles around typography */}
        <span className="absolute -top-3 -left-5 sm:-left-10 text-zinc-800 text-lg sm:text-2xl animate-pulse">
          ✦
        </span>
        <span className="absolute top-1 -right-3 sm:-right-8 text-zinc-800 text-base sm:text-xl">
          *
        </span>
        <span className="absolute -bottom-1 -left-4 text-zinc-700 text-xs sm:text-sm">
          *
        </span>

        {/* 1. TOMY POWELL'S (Solid 8-bit chunky pixel blocks directly matching reference) */}
        <h1 className="font-pixel text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight uppercase text-zinc-950 leading-tight drop-shadow-sm select-none">
          TOMY POWELL'S
        </h1>

        {/* 2. *PORTFOLIO* (Distressed dry-brush marker with asterisks) */}
        <div className="mt-1 flex items-center justify-center gap-1 sm:gap-2">
          <span className="font-marker text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-zinc-950 rotate-[-1deg] select-none tracking-wider">
            *PORTFOLIO*
          </span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   2. "LET'S WORK TOGETHER" (4 CARDS WITH STATUS DOTS & EXACT PALETTE)
   ========================================================================= */
function LetsWorkTogetherSection() {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText('tomy.wopell@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2200);
  };

  return (
    <div className="w-full my-10 sm:my-14 bg-[#fbf9f4]/95 border border-black/20 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
      {/* Header with green status dot */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/10 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] font-bold text-zinc-600">
              MIS REDES &amp; CONTACTO DIRECTO
            </span>
          </div>
          <h3 className="font-display font-black text-2xl sm:text-3xl text-zinc-950 uppercase tracking-tight mt-1">
            LET’S WORK TOGETHER
          </h3>
        </div>
      </div>

      {/* 4 Cards matching reference mockup exactly */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 w-full">
        {/* Card 1: Instagram (Hot Pink) */}
        <a
          href="https://instagram.com/wopell"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#d82d6b] text-white shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
        >
          {/* Top-Right Badge Dot */}
          <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-rose-400 border-2 border-white shadow-sm" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Instagram size={20} className="text-white" />
            </div>
            <div>
              <p className="font-display font-black text-[11px] uppercase tracking-wider">INSTAGRAM</p>
              <p className="font-mono text-[10px] text-white/90">@wopell</p>
            </div>
          </div>
          <span className="text-xs text-white/70 font-mono">×</span>
        </a>

        {/* Card 2: Telegram (Cyan-Blue) */}
        <a
          href="https://t.me/wopell"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#229ed9] text-white shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
        >
          {/* Top-Right Badge Dot */}
          <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Send size={18} className="text-white" />
            </div>
            <div>
              <p className="font-display font-black text-[11px] uppercase tracking-wider">TELEGRAM</p>
              <p className="font-mono text-[10px] text-white/90">@wopell</p>
            </div>
          </div>
          <span className="text-xs text-white/70 font-mono">×</span>
        </a>

        {/* Card 3: Email (Warm Amber Yellow) */}
        <div className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#f59e0b] text-zinc-950 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
          {/* Top-Right Badge Dot */}
          <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
          <a
            href="mailto:tomy.wopell@gmail.com"
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            <div className="w-9 h-9 rounded-lg bg-black/10 flex items-center justify-center shrink-0">
              <Mail size={18} className="text-zinc-950" />
            </div>
            <div className="truncate">
              <p className="font-display font-black text-[11px] uppercase tracking-wider">EMAIL</p>
              <p className="font-mono text-[10px] text-zinc-900 font-semibold truncate">tomy.wopell@gmail.com</p>
            </div>
          </a>
          <button
            onClick={handleCopyEmail}
            title="Copiar email"
            className="ml-2 p-1.5 rounded-lg bg-black/10 hover:bg-black hover:text-white transition-all cursor-pointer shrink-0"
          >
            {copiedEmail ? <Check size={14} className="text-emerald-800" /> : <Copy size={14} />}
          </button>
        </div>

        {/* Card 4: Behance (Royal Blue) */}
        <a
          href="https://www.behance.net/wopell"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#0057ff] text-white shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
        >
          {/* Top-Right Badge Dot */}
          <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Palette size={18} className="text-white" />
            </div>
            <div>
              <p className="font-display font-black text-[11px] uppercase tracking-wider">BEHANCE</p>
              <p className="font-mono text-[10px] text-white/90">Tomy Powell</p>
            </div>
          </div>
          <span className="text-xs text-white/70 font-mono">×</span>
        </a>
      </div>
    </div>
  );
}

/* =========================================================================
   3. "MARCAS & CLIENTES COMERCIALES" (EXACT GRAPH-BORDERED 3-COL TABLE)
   ========================================================================= */
function CommercialBrandsSection() {
  const topRowBrands = BRANDS.slice(0, 3); // Diageo (:GEO), Elemento, Footy (matching reference 3-column box)
  const extendedBrands = BRANDS.slice(3);

  return (
    <div className="w-full mt-16 sm:mt-24 mb-10">
      {/* Subheader */}
      <div className="mb-3">
        <span className="font-mono text-xs uppercase tracking-[0.25em] text-zinc-800 font-bold">
          MARCAS &amp; CLIENTES COMERCIALES
        </span>
      </div>

      {/* 1. Primary 3-Column Table Box Directly on Graph Paper (Matching Reference) */}
      <div className="w-full bg-[#fffdfa]/60 border border-black/30 rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-3 divide-x divide-black/30">
          {topRowBrands.map((brand, i) => (
            <div
              key={i}
              className="flex items-center justify-center p-4 sm:p-7 min-h-[85px] sm:min-h-[110px] hover:bg-black/5 transition-colors"
            >
              <img
                src={brand.logo}
                alt={brand.name}
                className="h-8 sm:h-11 w-auto max-w-[130px] object-contain brightness-0 opacity-90 transition-transform duration-300 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 2. Secondary Row with Extended Brands along the Graph Lines */}
      <div className="mt-3.5 pt-3.5 border-t border-black/15 overflow-hidden">
        <div className="flex animate-marquee-slow whitespace-nowrap items-center w-max">
          {[...extendedBrands, ...extendedBrands].map((brand, i) => (
            <div key={i} className="flex items-center px-5 sm:px-7">
              <img
                src={brand.logo}
                alt={brand.name}
                className="h-6 sm:h-7 w-auto max-w-[100px] object-contain brightness-0 opacity-60 hover:opacity-100 transition-all duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   4. MAIN WORKS COMPONENT (CON PROJECT FOLDERS Y OVERLAY DE CATEGORÍA)
   ========================================================================= */
export default function Works() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedProject) {
          setSelectedProject(null);
        } else if (selectedCategoryId) {
          setSelectedCategoryId(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCategoryId, selectedProject]);

  const selectedCategory = CATEGORIES.find((c) => c.id === selectedCategoryId);

  return (
    <section id="works" className="w-full bg-transparent text-zinc-950 pb-20 overflow-visible relative">
      {/* 1. Hero Header (Stacking context var(--z-title) pointer-events-none garantizado por encima de órbitas) */}
      <div
        className="relative pointer-events-none w-full max-w-[860px] mx-auto px-3 sm:px-6"
        style={{ zIndex: 'var(--z-title, 50)' }}
      >
        <HeroHeader />
      </div>

      {/* 2. Halftone 3D Earth with Orbiting Labels (Aislado en stacking context var(--z-planet)) */}
      <div
        className="relative w-full max-w-[1280px] mx-auto px-2 sm:px-4 overflow-visible"
        style={{ isolation: 'isolate', zIndex: 'var(--z-planet, 10)' }}
      >
        <PlanetHero />
      </div>

      <div className="w-full max-w-[860px] mx-auto px-3 sm:px-6">
        {/* 3. "LET'S WORK TOGETHER" (Instagram, Telegram, Email, Behance) */}
        <LetsWorkTogetherSection />

        {/* 4. "SELECTED PROJECTS" (Carpetas 3D con Error Boundary de aislamiento) */}
        <FolderErrorBoundary>
          <ProjectFolders
            categories={CATEGORIES}
            isCategoryOpen={selectedCategoryId !== null}
            activeCategoryId={selectedCategoryId}
            onOpenProject={(catId, projId) => {
              setSelectedCategoryId(catId);
              if (projId) {
                const cat = CATEGORIES.find((c) => c.id === catId);
                const proj = cat?.projects.find((p) => p.id === projId);
                if (proj) {
                  setSelectedProject(proj);
                }
              }
            }}
          />
        </FolderErrorBoundary>

        {/* 5. "MARCAS & CLIENTES COMERCIALES" (3-Column Table on Graph Paper) */}
        <CommercialBrandsSection />

        {/* Minimal Bottom Footer */}
        <div className="mt-12 pt-6 border-t border-black/15 flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-600 font-bold">
          <span>WOPELL // TOMY POWELL — PORTFOLIO CREATIVO</span>
          <span>BA — AR • WORLDWIDE</span>
        </div>
      </div>

      {/* OVERLAY FIJO: Catálogo Detallado de Categoría (Permite que ProjectFolders siga montado) */}
      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 overflow-y-auto bg-[#f5f2eb] paper-grid text-zinc-950"
            style={{ zIndex: 'var(--z-category-overlay, 70)' }}
          >
            {/* Sleek Category Hero */}
            <div className="relative w-full h-[65vh] md:h-[75vh] overflow-hidden flex items-end p-6 sm:p-10 md:p-16">
              <div className="fixed top-20 left-4 sm:left-6 md:top-24 md:left-8 z-50">
                <button
                  onClick={() => {
                    setSelectedCategoryId(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2.5 rounded-full bg-black/80 backdrop-blur-md flex items-center gap-2.5 text-xs font-mono font-bold tracking-widest uppercase text-white hover:bg-white hover:text-black transition-all duration-300 shadow-2xl cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span>Categorías</span>
                </button>
              </div>

              <img
                src={selectedCategory.image}
                alt={selectedCategory.title}
                className="absolute inset-0 w-full h-full object-cover scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />

              <div className="relative z-10 max-w-4xl">
                <span className="font-mono text-xs uppercase tracking-[0.3em] text-white/70 font-semibold block mb-2">
                  Categoría Seleccionada // {selectedCategory.number}
                </span>
                <h1 className="text-5xl sm:text-6xl md:text-8xl font-display font-black text-white tracking-tight uppercase">
                  {selectedCategory.title}
                </h1>
                <p className="text-white/80 font-sans text-sm sm:text-base md:text-lg max-w-2xl mt-3">
                  {selectedCategory.subtitle}
                </p>
              </div>
            </div>

            {/* Projects Grid below Hero */}
            <section className="w-full py-14 md:py-20">
              <div className="max-w-[1720px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
                <div className="mb-10 md:mb-14 flex flex-col md:flex-row md:items-end justify-between border-b border-black/10 pb-6 gap-4">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-zinc-600 font-bold">
                      Catálogo Seleccionado // {selectedCategory.title}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-zinc-950 mt-1">
                      {selectedCategory.subtitle}
                    </h2>
                    <p className="text-zinc-600 font-sans text-sm mt-1 max-w-xl">
                      {selectedCategory.description}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-zinc-600 uppercase tracking-widest font-semibold">
                    {selectedCategory.projects.length} Proyectos
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {selectedCategory.projects.map((project) => (
                    <ProjectSquareCard
                      key={project.id}
                      project={project}
                      onClick={() => setSelectedProject(project)}
                    />
                  ))}
                </div>

                <div className="mt-20 pt-10 border-t border-black/10 flex flex-col sm:flex-row justify-between items-center gap-6">
                  <button
                    onClick={() => {
                      setSelectedCategoryId(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-6 py-3 rounded-full bg-zinc-900 text-white hover:bg-black font-mono text-xs uppercase tracking-widest font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <ArrowLeft size={16} />
                    <span>Volver al menú de categorías</span>
                  </button>

                  <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-600 font-bold">
                    <span>Wopell // {selectedCategory.title}</span>
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Lightbox Modal */}
      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </section>
  );
}
