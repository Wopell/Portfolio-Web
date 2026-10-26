import { useLocation, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import WorksPage from './components/WorksPage';
import { WorksStateProvider } from './context/WorksStateContext';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
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
  );
}
