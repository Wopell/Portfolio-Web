import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home as HomeIcon } from 'lucide-react';
import { gsap, EASE, prefersReducedMotion } from '../lib/gsap';
import { useWorksState } from '../context/WorksStateContext';

/* mismas curvas que --arch-ease / EASE.ui y EASE.move, para motion */
const UI_OUT = [0.23, 1, 0.32, 1] as const;
const UI_IN_OUT = [0.77, 0, 0.175, 1] as const;

/* motion 12: los atajos x/y/scale corren en el hilo principal y la navbar se
   anima justo cuando la página está ocupada (carga, cambio de ruta). Con un
   string de transform motion usa WAAPI y va por el compositor. Como
   reducedMotion="user" no cubre strings de transform, se resuelve a mano. */

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isWorksActive, setIsWorksActive } = useWorksState();
  
  const isWorksPage = location.pathname === '/works' || (isWorksActive && location.pathname !== '/about');
  const isAbout = location.pathname === '/about';
  const reduce = useReducedMotion();

  const handleTabSwitch = (targetPath: string) => {
    const y = window.scrollY;

    // misma pestaña: volver arriba. Corto (< 300 ms), ease-in-out porque es la
    // página moviéndose a la vista, y sin bloquear nada: si el usuario mueve la
    // rueda, autoKill corta el tween y manda él.
    if (location.pathname === targetPath) {
      if (y <= 10) return;
      if (prefersReducedMotion()) {
        window.scrollTo(0, 0);
        return;
      }
      gsap.to(window, {
        scrollTo: { y: 0, autoKill: true },
        duration: Math.min(0.28, 0.16 + y / 20000),
        ease: EASE.move,
        overwrite: 'auto',
      });
      return;
    }

    // otra página: se navega ya, sin subir primero ni esperar. ScrollToTop
    // (App) deja la página nueva arriba antes del primer pintado.
    gsap.killTweensOf(window);
    navigate(targetPath);
  };

  const handleHomeClick = () => {
    setIsWorksActive(false);
    handleTabSwitch('/');
  };

  const showHomeButton = isWorksActive;

  // «Mis trabajos» desde la intro o desde /works va a /works (antes, en `/` no
  // hacía nada y con carga directa de /works te devolvía a la intro).
  const worksTarget =
    location.pathname === '/' || location.pathname === '/works' || isWorksActive ? '/works' : '/';
  const handleWorksClick = () => {
    if (worksTarget === '/works') setIsWorksActive(true);
    handleTabSwitch(worksTarget);
  };

  return (
    <motion.nav
      initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateY(-8px)' }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, transform: 'translateY(0px)' }}
      transition={{ duration: 0.25, ease: UI_OUT }}
      className="fixed top-5 md:top-7 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-2.5"
      style={{
        zIndex: 'var(--z-nav, 100)',
        isolation: 'isolate',
      }}
    >
      {/* Home Button ("Casita") to return to landing scrollytelling */}
      <AnimatePresence>
        {showHomeButton && (
          <motion.button
            key="home-btn"
            initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.9)' }}
            animate={{ opacity: 1, ...(reduce ? {} : { transform: 'scale(1)' }), transition: { duration: 0.2, ease: UI_OUT } }}
            exit={{ opacity: 0, ...(reduce ? {} : { transform: 'scale(0.9)' }), transition: { duration: 0.15, ease: UI_OUT } }}
            whileTap={reduce ? undefined : { transform: 'scale(0.97)', transition: { duration: 0.16, ease: UI_OUT } }}
            onClick={handleHomeClick}
            /* solo colores en CSS: el transform lo maneja motion (transition-all
               peleaba con sus estilos inline cuadro a cuadro) */
            className="flex items-center justify-center w-11 h-11 rounded-full border border-black/10 bg-white/95 hover:bg-zinc-950 hover:text-white text-zinc-900 shadow-sm backdrop-blur-md transition-colors duration-200 ease-[ease] cursor-pointer"
            title="Volver al inicio"
            aria-label="Volver al inicio"
          >
            {/* sin zoom del ícono en hover: el cambio de color ya alcanza */}
            <HomeIcon size={16} />
          </motion.button>
        )}
      </AnimatePresence>

      <div className={`relative grid grid-cols-2 p-1.5 rounded-full border transition-[background-color,border-color,box-shadow] duration-200 ease-[ease] w-[320px] md:w-[350px] ${
        isAbout 
        ? 'bg-white/95 border-black/10 shadow-lg' 
        : isWorksPage
          ? 'bg-white/95 border-black/10 shadow-sm backdrop-blur-md'
          : 'bg-white/95 border-black/15 shadow-sm backdrop-blur-md'
      }`}>
        {/* Sliding Background */}
        <motion.div
          initial={false}
          animate={{ transform: isAbout ? 'translateX(0%)' : 'translateX(100%)' }}
          // se mueve de una pestaña a la otra a la vista: ease-in-out, < 300 ms;
          // motion arranca desde donde esté si se interrumpe. Reduced: salta.
          transition={reduce ? { duration: 0 } : { duration: 0.25, ease: UI_IN_OUT }}
          className="absolute inset-y-1.5 left-1.5 w-[calc(50%-6px)] rounded-full z-0"
          style={{ 
            backgroundColor: '#191510',
            boxShadow: '0 4px 12px rgba(0,0,0,0.18)'
          }}
        />

        <button
          onClick={() => handleTabSwitch('/about')}
          aria-current={isAbout ? 'page' : undefined}
          className={`relative z-10 min-h-[44px] py-2.5 transition-colors duration-200 ease-[ease] font-sans text-[0.875rem] font-semibold uppercase tracking-[0.08em] flex items-center justify-center cursor-pointer ${
            isAbout 
              ? 'text-white' 
              : 'text-zinc-700 hover:text-zinc-950'
          }`}
        >
          Sobre mí
        </button>
        <button 
          onClick={handleWorksClick}
          aria-current={location.pathname === '/works' ? 'page' : undefined}
          className={`relative z-10 min-h-[44px] py-2.5 transition-colors duration-200 ease-[ease] font-sans text-[0.875rem] font-semibold uppercase tracking-[0.08em] flex items-center justify-center cursor-pointer ${
            !isAbout 
              ? 'text-white'
              : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          Mis trabajos
        </button>
      </div>
    </motion.nav>
  );
}
