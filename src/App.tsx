import { useLocation, Routes, Route } from 'react-router-dom';
import { useEffect, useLayoutEffect } from 'react';
import { MotionConfig } from 'motion/react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import WorksPage from './components/WorksPage';
import { WorksStateProvider } from './context/WorksStateContext';

function ScrollToTop() {
  const { pathname } = useLocation();
  // la app maneja su propio scroll: que el navegador no restaure posiciones
  // viejas al ir Atrás (en la intro eso re-disparaba la navegación a /works)
  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
  }, []);
  // antes del primer pintado de la página nueva (y antes de que la intro mida
  // el scroll): la navbar navega sin subir primero
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    // reduced-motion del sistema: motion saca transformaciones y deja fundidos
    <MotionConfig reducedMotion="user">
      <WorksStateProvider>
        <div className="selection:bg-white selection:text-black bg-black min-h-screen">
          <ScrollToTop />
          <Navbar />
          <Routes>
            <Route path="/" element={<Home activeTab="works" />} />
            <Route path="/about" element={<Home activeTab="about" />} />
            <Route path="/works" element={<WorksPage />} />
          </Routes>
        </div>
      </WorksStateProvider>
    </MotionConfig>
  );
}
