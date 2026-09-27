import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const activeTab = location.pathname === '/about' ? 'about' : 'works';
  const isAbout = activeTab === 'about';

  const handleWorksClick = () => {
    if (location.pathname === '/') {
      const targetScroll = window.innerHeight * 5;
      gsap.to(window, { scrollTo: targetScroll, duration: 1.5, ease: "power3.inOut" });
    } else {
      navigate('/');
    }
  };

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
    >
      <div className={`relative grid grid-cols-2 p-1.5 rounded-full border transition-all duration-700 ease-[0.22,1,0.36,1] w-[360px] ${
        isAbout 
        ? 'bg-white/90 border-black/5 shadow-xl' 
        : 'bg-black/40 border-white/10 backdrop-blur-3xl'
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
            backgroundColor: isAbout ? 'black' : 'white',
            boxShadow: isAbout ? '0 4px 12px rgba(0,0,0,0.1)' : '0 4px 12px rgba(255,255,255,0.1)'
          }}
        />

        <button 
          onClick={() => navigate('/about')}
          className={`relative z-10 py-3 transition-colors duration-500 text-[10px] font-bold uppercase tracking-[0.2em] pl-[0.2em] flex items-center justify-center ${
            isAbout ? 'text-white' : 'text-white/40 hover:text-white'
          }`}
        >
          Sobre mi
        </button>
        <button 
          onClick={handleWorksClick}
          className={`relative z-10 py-3 transition-colors duration-500 text-[10px] font-bold uppercase tracking-[0.2em] pl-[0.2em] flex items-center justify-center ${
            !isAbout ? 'text-black' : 'text-black/40 hover:text-black'
          }`}
        >
          Mis trabajos
        </button>
      </div>
    </motion.nav>
  );
}
