import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home as HomeIcon } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { useWorksState } from '../context/WorksStateContext';

gsap.registerPlugin(ScrollToPlugin);

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isWorksActive, setIsWorksActive } = useWorksState();
  
  const isWorksPage = location.pathname === '/works' || (isWorksActive && location.pathname !== '/about');
  const isAbout = location.pathname === '/about';

  const handleTabSwitch = (targetPath: string) => {
    const currentScroll = window.scrollY;

    if (location.pathname === targetPath) {
      if (currentScroll > 10) {
        const scrollDistanceFactor = Math.min(1, currentScroll / (window.innerHeight * 2));
        const scrollDuration = Math.max(0.15, 0.6 * scrollDistanceFactor);
        gsap.to(window, { 
          scrollTo: 0, 
          duration: scrollDuration, 
          ease: "power2.out",
          overwrite: "auto"
        });
      }
      return;
    }

    // If scroll is already at 0, navigate immediately without any waiting time
    if (currentScroll <= 10) {
      window.scrollTo(0, 0);
      navigate(targetPath);
      return;
    }

    // Block user scroll input during transition to prevent over-scroll
    const preventScroll = (e: Event) => {
      e.preventDefault();
    };
    const preventKeyScroll = (e: KeyboardEvent) => {
      const keys = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Space", " "];
      if (keys.includes(e.key)) {
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });
    window.addEventListener("keydown", preventKeyScroll, { passive: false });

    const unlockScroll = () => {
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
      window.removeEventListener("keydown", preventKeyScroll);
    };

    // Calculate duration proportionally to the scroll distance:
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const scrollPercent = currentScroll / maxScroll;

    const scrollDistanceFactor = Math.min(1, currentScroll / (window.innerHeight * 2));
    const dynamicScrollDuration = Math.max(0.15, 0.6 * scrollDistanceFactor);

    // If scroll does not exceed 12%, hold time resting at 0 is halved (0.2s instead of 0.4s)
    const holdDuration = scrollPercent <= 0.12 ? 0.2 : 0.4;

    gsap.to(window, {
      scrollTo: 0,
      duration: dynamicScrollDuration,
      ease: "power2.out",
      overwrite: "auto",
      onComplete: () => {
        gsap.delayedCall(holdDuration, () => {
          window.scrollTo(0, 0);
          unlockScroll();
          navigate(targetPath);
        });
      }
    });
  };

  const handleHomeClick = () => {
    setIsWorksActive(false);
    handleTabSwitch('/');
  };

  const showHomeButton = isWorksActive;

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
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
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={handleHomeClick}
            className="flex items-center justify-center w-11 h-11 rounded-full border border-black/10 bg-white/95 hover:bg-zinc-950 hover:text-white text-zinc-900 shadow-sm backdrop-blur-md transition-all duration-300 group cursor-pointer"
            title="Volver al inicio"
            aria-label="Volver al inicio"
          >
            <HomeIcon size={16} className="transition-transform duration-300 group-hover:scale-110" />
          </motion.button>
        )}
      </AnimatePresence>

      <div className={`relative grid grid-cols-2 p-1.5 rounded-full border transition-all duration-700 ease-[0.22,1,0.36,1] w-[320px] md:w-[350px] ${
        isAbout 
        ? 'bg-white/95 border-black/10 shadow-lg' 
        : isWorksPage
          ? 'bg-white/95 border-black/10 shadow-sm backdrop-blur-md'
          : 'bg-[#FBFAF6] border-black/15 shadow-sm backdrop-blur-md'
      }`}>
        {/* Sliding Background */}
        <motion.div
          initial={false}
          animate={{
            x: isAbout ? 0 : '100%',
          }}
          transition={{ type: "spring", stiffness: 450, damping: 35 }}
          className="absolute inset-y-1.5 left-1.5 w-[calc(50%-6px)] rounded-full z-0"
          style={{ 
            backgroundColor: '#111111',
            boxShadow: '0 4px 12px rgba(0,0,0,0.18)'
          }}
        />

        <button 
          onClick={() => handleTabSwitch('/about')}
          className={`relative z-10 py-2.5 transition-colors duration-500 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center cursor-pointer ${
            isAbout 
              ? 'text-white' 
              : 'text-zinc-700 hover:text-zinc-950'
          }`}
        >
          Sobre mi
        </button>
        <button 
          onClick={() => handleTabSwitch(isWorksActive ? '/works' : '/')}
          className={`relative z-10 py-2.5 transition-colors duration-500 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center cursor-pointer ${
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
