import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import React, { useRef, useEffect, useState, useMemo } from 'react';

const CATEGORIES = [
  "All",
  "Motion Graphics",
  "AI Graphics",
  "Video Editing",
  "3D Modeling",
  "VFX",
  "Unity",
  "Graphic Design",
  "Web Design",
  "Personal Projects",
  "Commercial Projects"
];

const PROJECTS = [
  {
    id: '01',
    title: 'CHAINSAW MAN',
    subtitle: '60FPS_INTERPOLATION',
    tags: ['Motion Graphics', 'Video Editing', 'Commercial Projects', 'VFX'],
    image: 'https://images.unsplash.com/photo-1634157703702-3c124b455499?q=80&w=1546&auto=format&fit=crop',
    span: 'md:col-span-8 md:row-span-2'
  },
  {
    id: '02',
    title: 'GEN_MAPS',
    subtitle: 'KEYFRAME_PRECISION',
    tags: ['AI Graphics', 'Web Design', 'Personal Projects', 'Graphic Design'],
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
    span: 'md:col-span-4 md:row-span-1'
  },
  {
    id: '03',
    title: 'KINETIC_TYPO',
    subtitle: 'EASE_IN_OUT_CUBIC',
    tags: ['Motion Graphics', 'Graphic Design', 'Commercial Projects', 'Video Editing'],
    image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2670&auto=format&fit=crop',
    span: 'md:col-span-4 md:row-span-2'
  },
  {
    id: '04',
    title: 'ARCH_SIM',
    subtitle: 'FRAME_BY_FRAME',
    tags: ['3D Modeling', 'VFX', 'Commercial Projects', 'Unity'],
    image: 'https://images.unsplash.com/photo-1449156001931-828320f719b5?q=80&w=2670&auto=format&fit=crop',
    span: 'md:col-span-4 md:row-span-1'
  },
  {
    id: '05',
    title: 'DARK_MATTER',
    subtitle: 'PARTICLE_PHYSICS',
    tags: ['VFX', 'Unity', 'Personal Projects', '3D Modeling'],
    image: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&w=2670&auto=format&fit=crop',
    span: 'md:col-span-4 md:row-span-1'
  },
  {
    id: '06',
    title: 'BINARY_SOUL',
    subtitle: 'VELOCITY_MAP',
    tags: ['Web Design', 'AI Graphics', 'Commercial Projects', 'Graphic Design'],
    image: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=2574&auto=format&fit=crop',
    span: 'md:col-span-8 md:row-span-1'
  },
  {
    id: '07',
    title: 'CYBER_PUNK',
    subtitle: 'NEON_DISTORTION',
    tags: ['Unity', 'VFX', 'Personal Projects', 'Video Editing'],
    image: 'https://images.unsplash.com/photo-1614728263952-84ea206f99b6?q=80&w=1454&auto=format&fit=crop',
    span: 'md:col-span-4 md:row-span-1'
  },
  {
    id: '08',
    title: 'PRISM_FLOW',
    subtitle: 'REFRACTION_ENGINE',
    tags: ['Motion Graphics', 'Web Design', 'Commercial Projects', 'AI Graphics'],
    image: 'https://images.unsplash.com/photo-1492691523567-6170c817538a?q=80&w=1470&auto=format&fit=crop',
    span: 'md:col-span-4 md:row-span-1'
  }
];

interface ProjectCardProps {
  project: typeof PROJECTS[0];
  index: number;
}

function ProjectCard({ project, index }: ProjectCardProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative border border-white/5 bg-black overflow-hidden flex flex-col h-full w-full`}
    >
        <div className={`relative w-full flex-1 overflow-hidden min-h-[300px]`}>
        {!isLoaded && (
          <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center overflow-hidden">
             <div className="w-4 h-4 border border-white/5 border-t-white/30 rounded-full animate-spin" />
          </div>
        )}
        <motion.img 
          src={project.image} 
          alt={project.title}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 1.2 }}
          className="w-full h-full object-cover grayscale brightness-[0.7] contrast-[1.1] transition-all duration-1000 group-hover:scale-105 group-hover:grayscale-0 group-hover:brightness-100"
          referrerPolicy="no-referrer"
        />
        
        <div className="absolute top-4 left-4 flex flex-col gap-1 z-20">
           <span className="font-sans text-[10px] italic tracking-widest text-white/40 group-hover:opacity-100 transition-opacity uppercase">
              {project.subtitle}
           </span>
        </div>
      </div>

      <div className="p-5 flex justify-between items-center bg-black border-t border-white/5 transition-all duration-700 ease-[0.22,1,0.36,1] group-hover:bg-white group-hover:text-black">
        <div className="flex flex-col">
          <h3 className="font-display font-black text-lg tracking-tighter uppercase leading-none mb-1">
            {project.title}
          </h3>
          <div className="flex gap-2">
            {project.tags.slice(0, 2).map(tag => (
              <span key={tag} className="font-serif italic text-[10px] opacity-40 group-hover:opacity-60 transition-opacity">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="relative overflow-hidden w-5 h-5 flex items-center justify-center">
            <ArrowUpRight size={18} strokeWidth={1} className="opacity-20 group-hover:text-black transition-all group-hover:translate-x-6 group-hover:-translate-y-6 duration-500" />
            <ArrowUpRight size={18} strokeWidth={1.5} className="absolute -translate-x-6 translate-y-6 group-hover:translate-x-0 group-hover:translate-y-0 text-black transition-all duration-500" />
        </div>
      </div>
    </motion.div>
  );
}

const BRANDS = [
  { name: "Amaze", logo: "/logos/Amaze.webp" },
  { name: "Balanz", logo: "/logos/Balanz.webp" },
  { name: "BID", logo: "/logos/Banco Interamericando de desarrollo.webp" },
  { name: "Banco Macro", logo: "/logos/Banco Macro.webp" },
  { name: "Betterfly", logo: "/logos/Betterfly.webp" },
  { name: "Buen Bit", logo: "/logos/Buen Bit.webp" },
  { name: "Chevrolet", logo: "/logos/Chevrolet.webp" },
  { name: "Contagram", logo: "/logos/Contagram.webp" },
  { name: "Cremolatti", logo: "/logos/Cremolatti.webp" },
  { name: "Diageo", logo: "/logos/Diageo.webp" },
  { name: "Elemento", logo: "/logos/Elemento.webp" },
  { name: "Footy", logo: "/logos/Footy.webp" },
  { name: "General Motors", logo: "/logos/General motors.webp" },
  { name: "Gillette", logo: "/logos/Gillette.webp" },
  { name: "Guinness", logo: "/logos/Guinness.webp" },
  { name: "Johnnie Walker", logo: "/logos/Johnnie Walker.webp" },
  { name: "Livian", logo: "/logos/Livian.webp" },
  { name: "L'Oreal", logo: "/logos/Loreal.webp" },
  { name: "Master Metrics", logo: "/logos/Master Metrics.webp" },
  { name: "Mayma", logo: "/logos/Mayma.webp" },
  { name: "Mugler", logo: "/logos/Mugler.webp" },
  { name: "Naldo", logo: "/logos/Naldo.webp" },
  { name: "Pascual Toso", logo: "/logos/Pascual Toso.webp" },
  { name: "Puma Energy", logo: "/logos/Puma.webp" },
  { name: "Salta Cautiva", logo: "/logos/Salta cautiva.webp" },
  { name: "Simplicity", logo: "/logos/Simplicity.webp" },
  { name: "Smirnoff", logo: "/logos/Smirnoff.webp" },
  { name: "Telecom", logo: "/logos/Telecom.webp" },
  { name: "Wegovy", logo: "/logos/Wegovy.webp" },
  { name: "Yoy", logo: "/logos/Yoy.webp" }
];

function BrandLogo({ brand }: { brand: typeof BRANDS[0] }) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  return (
    <div className="relative flex items-center justify-center min-w-[140px] md:min-w-[200px] h-16 md:h-32">
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="w-8 h-[1px] bg-white/10 animate-pulse" />
        </div>
      )}
      <img 
        src={brand.logo} 
        alt={brand.name} 
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        className={`h-16 md:h-32 w-auto object-contain grayscale opacity-80 brightness-200 group-hover:opacity-100 group-hover:grayscale-0 group-hover:scale-110 group-hover:brightness-[2.5] transition-all duration-700 ${isLoaded ? 'opacity-80' : 'opacity-0 scale-95'}`}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        style={{ display: hasError ? 'none' : 'block' }}
      />
      {(hasError || !isLoaded) && (
        <span className={`${hasError ? 'block' : 'hidden'} font-sans font-black text-[10px] tracking-[0.3em] text-white opacity-20 group-hover:opacity-100 transition-opacity uppercase text-center`}>
          {brand.name}
        </span>
      )}
    </div>
  );
}

function BrandMarquee() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"]
  });

  const xRange = useTransform(scrollYProgress, [0, 1], [100, -100]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const amount = direction === 'left' ? -400 : 400;
    scrollContainerRef.current.scrollBy({
      left: amount,
      behavior: 'smooth'
    });
  };

  return (
    <div ref={targetRef} className="relative w-full border-y border-white/5 bg-black group/marquee overflow-hidden mb-[-1px]">
      <div className="absolute inset-y-0 left-0 z-20 flex items-center px-4 pointer-events-none opacity-0 group-hover/marquee:opacity-100 transition-opacity duration-500">
        <button 
          onClick={() => scroll('left')}
          className="p-3 bg-black/80 border border-white/10 hover:bg-white hover:text-black transition-all duration-300 pointer-events-auto backdrop-blur-sm"
          aria-label="Scroll Left"
        >
          <ChevronLeft size={20} />
        </button>
      </div>
      
      <div className="absolute inset-y-0 right-0 z-20 flex items-center px-4 pointer-events-none opacity-0 group-hover/marquee:opacity-100 transition-opacity duration-500">
        <button 
          onClick={() => scroll('right')}
          className="p-3 bg-black/80 border border-white/10 hover:bg-white hover:text-black transition-all duration-300 pointer-events-auto backdrop-blur-sm"
          aria-label="Scroll Right"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

      <motion.div 
        style={{ x: xRange }} 
        className="py-4 md:py-6 overflow-x-auto scrollbar-hide no-scrollbar"
        ref={scrollContainerRef}
      >
        <div className="flex animate-marquee-slow whitespace-nowrap items-center w-max will-change-transform">
          {[...BRANDS, ...BRANDS, ...BRANDS].map((brand, i) => (
            <div key={i} className="flex items-center px-6 md:px-10 group transition-all duration-700">
              <BrandLogo brand={brand} />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default function Works() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const sectionRef = useRef<HTMLElement>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);

  const filteredProjects = useMemo(() => {
    return PROJECTS.filter(project => {
      const matchesFilter = activeFilter === "All" || project.tags.includes(activeFilter);
      const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, searchQuery]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <section id="works" ref={sectionRef} className="bg-black py-0 px-2 md:px-4">
      <motion.div 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="max-w-[1600px] mx-auto relative border-x border-white/5"
      >
        <motion.div variants={item} className="px-6 py-12 md:py-16 flex flex-col md:flex-row justify-between items-baseline gap-4 border-b border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.01)_0%,transparent_100%)]" />
          <div className="relative z-10 space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="font-sans font-black text-sm tracking-[0.2em] text-white/60 uppercase">Selected_Works_&_Projects</h2>
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-4">
             <div className="flex flex-col items-end">
                <span className="font-serif italic text-[10px] opacity-30 text-white tracking-widest uppercase">Archive</span>
             </div>
             <div className="w-[1px] h-8 bg-white/5" />
             <div className="text-[12px] font-black opacity-10 uppercase tracking-tighter">W//P.26</div>
          </div>
        </motion.div>
        
        <motion.div variants={item}>
          <BrandMarquee />
        </motion.div>

        {/* Filter Bar */}
        <motion.div 
          ref={filterBarRef}
          variants={item} 
          className="border-b border-white/5 py-8 px-6 flex flex-col gap-8 bg-black sticky top-0 md:relative z-40"
        >
          <div className="flex flex-col lg:flex-row justify-between items-center gap-12">
            <div className="relative w-full lg:flex-1 overflow-hidden group/filters">
                <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none opacity-0 md:group-hover/filters:opacity-100 transition-opacity" />
                <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none opacity-0 md:group-hover/filters:opacity-100 transition-opacity" />
                
                <div className="flex items-center gap-x-8 gap-y-4 overflow-x-auto no-scrollbar scroll-smooth pb-2 -mb-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveFilter(cat)}
                      className={`group/btn relative py-2 transition-all duration-500 shrink-0 ${
                        activeFilter === cat 
                        ? 'text-white' 
                        : 'text-white/20 hover:text-white/60'
                      }`}
                    >
                      <span className="relative z-10 font-sans text-[11px] tracking-[0.15em] uppercase font-black block">
                        <motion.span
                          initial={false}
                          animate={{ y: activeFilter === cat ? -1 : 0 }}
                          className="inline-block"
                        >
                          {cat}
                        </motion.span>
                      </span>
                      {activeFilter === cat && (
                        <motion.div 
                          layoutId="activeFilter"
                          className="absolute -bottom-1 left-0 right-0 h-[1.5px] bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                          transition={{ type: "spring", bounce: 0, duration: 0.8 }}
                        />
                      )}
                      <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-white/10 group-hover/btn:w-full transition-all duration-500" />
                    </button>
                  ))}
                </div>
            </div>

            <div className="flex items-center gap-6 w-full lg:w-auto">
               <div className="hidden sm:flex flex-col items-end">
                  <span className="font-mono text-[7px] opacity-10 tracking-[0.3em] uppercase">Results_Found</span>
                  <span className="font-mono text-[9px] opacity-40 text-white tracking-[0.1em] font-bold">
                    {filteredProjects.length.toString().padStart(2, '0')} / {PROJECTS.length.toString().padStart(2, '0')}
                  </span>
               </div>
               <div className="relative flex-1 lg:w-72 group">
                 <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" />
                 <input 
                   type="text"
                   placeholder="SEARCH_PROJECTS..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full bg-white/[0.03] border border-white/10 px-11 py-3 font-mono text-[10px] tracking-widest uppercase text-white placeholder:text-white/10 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all font-black"
                 />
                 {searchQuery && (
                   <button 
                     onClick={() => setSearchQuery("")}
                     className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                   >
                     <X size={14} />
                   </button>
                 )}
               </div>
            </div>
          </div>
        </motion.div>

        {/* Dynamic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-px border-b border-white/5 bg-white/5 min-h-[600px]">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, idx) => (
              <motion.div 
                key={project.id}
                layout
                variants={item} 
                className={`${project.span} h-full`}
              >
                <ProjectCard project={project} index={idx} />
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredProjects.length === 0 && (
            <div className="col-span-full h-[400px] flex flex-col items-center justify-center bg-black gap-4">
              <span className="font-mono text-[9px] tracking-[1em] text-white opacity-20 animate-pulse">NO_FILES_MATCH_QUERY</span>
              <button 
                onClick={() => { setActiveFilter("All"); setSearchQuery(""); }}
                className="px-6 py-2 border border-white/10 font-mono text-[8px] tracking-[0.5em] uppercase hover:bg-white hover:text-black transition-all"
              >
                Reset_Protocol
              </button>
            </div>
          )}

          {/* Technical Side-block - Minimal Version */}
          {filteredProjects.length > 0 && filteredProjects.length < 5 && (
            <motion.div variants={item} className="md:col-span-4 bg-black p-8 flex flex-col justify-center border-l border-white/5 group h-full">
               <div className="space-y-6">
                  <div className="w-12 h-[1px] bg-white/20" />
                  <p className="text-[11px] leading-relaxed uppercase tracking-widest font-black opacity-30 text-white max-w-[200px]">
                    Curating high-performance visual solutions through motion and design.
                  </p>
               </div>
            </motion.div>
          )}
        </div>

        {/* Industrial Footer - Simplified */}
        <motion.div variants={item} className="py-12 px-6 flex justify-between items-center opacity-10 text-[9px] tracking-[0.4em] font-black uppercase text-white">
           <span>Wopell // 2026</span>
           <span className="hidden md:block italic font-serif opacity-50 not-italic">Key frame addict</span>
           <span className="opacity-0">BA</span>
        </motion.div>
      </motion.div>
    </section>
  );
}

