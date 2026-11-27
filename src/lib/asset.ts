/**
 * asset.ts — rutas de /public con la base del sitio.
 * En GitHub Pages el sitio vive en una subcarpeta (/Portfolio-Web/), así que una ruta
 * escrita como «/works/x.webp» tiene que pasar por acá para no romperse. En desarrollo
 * y con dominio propio la base es «/» y la ruta queda igual.
 */
const BASE = import.meta.env.BASE_URL;

export const asset = (p: string) => (p.startsWith('/') && !p.startsWith('//') ? BASE + p.slice(1) : p);
