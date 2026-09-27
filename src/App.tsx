import { motion, AnimatePresence } from 'motion/react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Grain from './components/Grain';
import Navbar from './components/Navbar';
import Home from './components/Home';
import About from './components/About';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const location = useLocation();

  return (
    <div className="selection:bg-white selection:text-black bg-black min-h-screen">
      <Grain />
      <ScrollToTop />
      <Navbar />
      
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route 
            path="/" 
            element={
              <motion.div
                key="home-page"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="bg-black min-h-screen"
              >
                <Home />
              </motion.div>
            } 
          />
          <Route 
            path="/about" 
            element={
              <motion.div
                key="about-page"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white min-h-screen"
              >
                <div className="pt-24">
                  <About />
                </div>
              </motion.div>
            } 
          />
        </Routes>
      </AnimatePresence>
    </div>
  );
}
