/**
 * =========================================================================
 * PROYECTOS Y CATEGORÍAS (FUENTE ÚNICA DE VERDAD) - FASE 1
 * =========================================================================
 * Reutiliza imágenes locales reales y placeholders neutros explícitamente marcados.
 * Detección reactiva de archivos en /public/previews/work-N.(webp|png|jpg).
 * =========================================================================
 */

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
    projects: [
      {
        id: 'anim-01',
        title: 'Kinetic Identity Reel',
        client: 'Balanz',
        tag: 'Motion Design',
        year: '2026',
        image: resolveCategoryPreview(1),
        description: 'Dynamic typographic branding exploring kinetic rhythm, variable axes, and responsive animation loops.',
      },
      {
        id: 'anim-02',
        title: 'Fluid Chroma Dynamics',
        client: 'Amaze',
        tag: 'Liquid Motion',
        year: '2026',
        image: resolveCategoryPreview(1),
        description: 'High-viscosity chromatic liquid simulations rendered with raytraced caustic dispersion.',
      },
      {
        id: 'anim-03',
        title: 'Stylized Action Fight Test',
        client: 'Fortiche Study',
        tag: 'Character 3D',
        year: '2025',
        image: resolveCategoryPreview(1),
        description: 'Stepped keyframe animation study mimicking painterly anime and 2.5D animation styles.',
      },
      {
        id: 'anim-04',
        title: '4K Broadcast Package',
        client: 'Telecom',
        tag: 'On-Air Identity',
        year: '2025',
        image: resolveCategoryPreview(1),
        description: 'Comprehensive network rebrand featuring procedural transitions and reactive bumpers.',
      },
    ],
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
    projects: [
      {
        id: '3d-01',
        title: 'Brutalist Monolith Sanctum',
        client: 'Archviz',
        tag: 'Octane Render',
        year: '2026',
        image: resolveCategoryPreview(2),
        description: 'Towering cast-concrete brutalist architecture with cinematic volumetric haze and raw sunlight beams.',
      },
      {
        id: '3d-02',
        title: 'Celestial Fragrance Bottle',
        client: 'Mugler',
        tag: 'Product CGI',
        year: '2026',
        image: resolveCategoryPreview(2),
        description: 'Luxury perfume flacon featuring multi-layer dielectric glass dispersion and micro-facet metal cap.',
      },
      {
        id: '3d-03',
        title: 'Cybernetic Skull Anatomy',
        client: 'Personal R&D',
        tag: 'Hard Surface',
        year: '2025',
        image: resolveCategoryPreview(2),
        description: 'Intricate mechanical cyber-skull integrating hydraulic micro-pistons, titanium plating, and exposed fiber optics.',
      },
      {
        id: '3d-04',
        title: 'Kinetic Automotive Aero Sculpt',
        client: 'Chevrolet',
        tag: 'Automotive CGI',
        year: '2024',
        image: resolveCategoryPreview(2),
        description: 'Aerodynamic wind-tunnel visualization with colorful particle streamlines tracing high-speed carbon curves.',
      },
    ],
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
    projects: [
      {
        id: 'ia-01',
        title: 'Latent Space Diffusion Reel',
        client: 'Runway Gen-3',
        tag: 'AI Motion',
        year: '2026',
        image: resolveCategoryPreview(3),
        description: 'Continuous latent space interpolation blending surreal biological structures with cybernetic forms.',
      },
      {
        id: 'ia-02',
        title: 'Holographic UI & Neuro-Mesh',
        client: 'Betterfly',
        tag: 'Neural UI',
        year: '2026',
        image: resolveCategoryPreview(3),
        description: 'AI-assisted procedural UI generated through custom fine-tuned LoRAs and vector workflows.',
      },
      {
        id: 'ia-03',
        title: 'Neural Architecture Synthesis',
        client: 'Concept Study',
        tag: 'Generative Arch',
        year: '2025',
        image: resolveCategoryPreview(3),
        description: 'Exploring non-Euclidean parametric structures via iterative diffusion model prompting.',
      },
      {
        id: 'ia-04',
        title: 'Synthetic Fashion Editorial',
        client: 'Mayma',
        tag: 'Virtual Model',
        year: '2025',
        image: resolveCategoryPreview(3),
        description: 'Hyper-realistic digital models and procedural haute couture garments synthesized at 8K resolution.',
      },
    ],
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
    projects: [
      {
        id: 'post-01',
        title: 'Commercial Film Color Grade',
        client: 'Chevrolet',
        tag: 'DaVinci Resolve',
        year: '2026',
        image: resolveCategoryPreview(4),
        description: 'Rich contrast, warm cinematic skin tones, and calibrated highlight roll-off in ACES color space.',
      },
      {
        id: 'post-02',
        title: 'Dark Matter CGI Compositing',
        client: 'Diageo',
        tag: 'Nuke / Multi-Pass',
        year: '2026',
        image: resolveCategoryPreview(4),
        description: 'Multi-pass EXR compositing uniting deep passes, ambient caustics, and live-action bottle plates.',
      },
      {
        id: 'post-03',
        title: 'Broadcast Finishing Suite',
        client: 'Johnnie Walker',
        tag: 'Mastering',
        year: '2025',
        image: resolveCategoryPreview(4),
        description: 'High-profile commercial mastering for global TV networks with strict broadcast delivery standards.',
      },
      {
        id: 'post-04',
        title: 'Analog 35mm Bloom & Grain',
        client: 'Smirnoff',
        tag: 'Film Emulation',
        year: '2025',
        image: resolveCategoryPreview(4),
        description: 'Authentic 35mm film halation, organic grain scan overlays, and vintage optical softness.',
      },
    ],
  },
];
