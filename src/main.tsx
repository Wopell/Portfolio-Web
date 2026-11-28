import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

/* GitHub Pages abre /works y /about con barra al final (también son carpetas de public/):
   se quita antes de arrancar, porque las rutas se comparan sin barra */
{
  const { pathname, search, hash } = window.location;
  if (pathname.length > import.meta.env.BASE_URL.length && pathname.endsWith('/')) {
    window.history.replaceState(null, '', pathname.replace(/\/+$/, '') + search + hash);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* en GitHub Pages el sitio vive en una subcarpeta: las rutas cuelgan de ella */}
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
