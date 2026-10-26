/**
 * =========================================================================
 * REEMPLAZO AUTOMÁTICO DE PREVIEWS (PLANET HERO - FASE 4)
 * =========================================================================
 * Para reemplazar las previews por tus trabajos reales:
 * Simplemente suelta tus archivos cuadrados (~400x400 px) en la carpeta:
 *   /public/previews/
 * nombrados con cualquiera de estas extensiones compatibles:
 *   - /public/previews/work-1.(jpg | png | webp)  -> 001 Animation
 *   - /public/previews/work-2.(jpg | png | webp)  -> 002 3D Art
 *   - /public/previews/work-3.(jpg | png | webp)  -> 003 IA
 *   - /public/previews/work-4.(jpg | png | webp)  -> 004 Post Production
 *
 * El sistema detecta automáticamente si tu archivo existe en /public/previews/.
 * Si existe, usa tu imagen directamente. Si no existe, muestra el placeholder
 * vectorial de alta legibilidad con el color de acento de su pestaña y su glifo.
 * =========================================================================
 */

// Escaneo reactivo de Vite para detectar archivos de usuario en /public/previews/
const userFiles = import.meta.glob('/public/previews/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', {
  eager: true,
  query: '?url',
  import: 'default'
});

/**
 * Resuelve automáticamente la URL de la preview para el círculo `index` (1 a 4).
 * Si existe work-N.(jpg|png|webp), la retorna; de lo contrario, retorna el placeholder SVG.
 */
export function resolveWorkSrc(index) {
  const extensions = ['webp', 'png', 'jpg', 'jpeg', 'WEBP', 'PNG', 'JPG', 'JPEG'];
  for (const ext of extensions) {
    const globKey = `/public/previews/work-${index}.${ext}`;
    if (userFiles[globKey]) {
      return `/previews/work-${index}.${ext}`;
    }
  }
  return `/previews/placeholder-${index}.svg`;
}

export const WORKS = [
  {
    id: 'work-1',
    categoryNumber: '001',
    title: '001 Animation',
    src: resolveWorkSrc(1),
    placeholder: '/previews/placeholder-1.svg',
    url: '#selected-projects',
  },
  {
    id: 'work-2',
    categoryNumber: '002',
    title: '002 3D Art',
    src: resolveWorkSrc(2),
    placeholder: '/previews/placeholder-2.svg',
    url: '#selected-projects',
  },
  {
    id: 'work-3',
    categoryNumber: '003',
    title: '003 IA',
    src: resolveWorkSrc(3),
    placeholder: '/previews/placeholder-3.svg',
    url: '#selected-projects',
  },
  {
    id: 'work-4',
    categoryNumber: '004',
    title: '004 Post Production',
    src: resolveWorkSrc(4),
    placeholder: '/previews/placeholder-4.svg',
    url: '#selected-projects',
  },
];
