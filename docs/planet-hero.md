# Documentación Técnica: PlanetHero (Fase 6)

Guía completa para desarrolladores y editores sobre la arquitectura, configuración, reemplazo de contenidos y depuración del componente `PlanetHero`.

---

## 1. Estructura de Archivos

```
portfolio-creativo/
├── public/
│   ├── previews/                  # Carpeta de previews de proyectos (001 a 004)
│   │   ├── placeholder-1.svg      # Placeholder vectorial Animation (Azul)
│   │   ├── placeholder-2.svg      # Placeholder vectorial 3D Art (Amarillo)
│   │   ├── placeholder-3.svg      # Placeholder vectorial IA (Lila)
│   │   ├── placeholder-4.svg      # Placeholder vectorial Post Production (Coral)
│   │   └── work-N.(jpg|png|webp)  # Archivos reales soltados por el usuario
│   ├── earth-mask-2048.png        # Máscara equirrectangular de alta resolución
│   └── background.png             # Trama de fondo cuadriculada
├── src/
│   ├── components/
│   │   └── PlanetHero.tsx         # Componente principal WebGL2 + Órbitas DOM
│   └── data/
│       └── works.js               # Fuente de datos de los 4 trabajos en órbita
└── docs/
    ├── planet-hero.md             # Esta documentación
    ├── fase5b_parametros_fisica.csv   # Especificación de física en CSV
    ├── fase5b_parametros_fisica.json  # Especificación de física en JSON
    └── ReactiveHalftone.tsx       # Fuente original de referencia de la física
```

---

## 2. Cómo Reemplazar las Previews

Para reemplazar los placeholders por imágenes reales de tus trabajos:
1. Prepara 4 imágenes cuadradas (resolución recomendada: **400x400 px** o similar).
2. Guarda los archivos directamente en la carpeta `/public/previews/` con los nombres exactos:
   - `work-1.jpg` (o `.png`, `.webp`) → **001 Animation**
   - `work-2.jpg` (o `.png`, `.webp`) → **002 3D Art**
   - `work-3.jpg` (o `.png`, `.webp`) → **003 IA**
   - `work-4.jpg` (o `.png`, `.webp`) → **004 Post Production**
3. El sistema Vite escanea automáticamente la carpeta en tiempo real (`import.meta.glob`). Si tu archivo existe, se mostrará de inmediato en su círculo; si lo eliminas, volverá al placeholder estilizado con su glifo y color de acento.

---

## 3. Cómo Cambiar los Enlaces de Navegación

Edita el archivo [`src/data/works.js`](file:///f:/Wopell/Mis%20trabajos/Pagina%20web/Portfolio_AntiGravity/portfolio-creativo/src/data/works.js).
Cada trabajo contiene un campo `url`:
```javascript
export const WORKS = [
  {
    id: 'work-1',
    categoryNumber: '001',
    title: '001 Animation',
    src: resolveWorkSrc(1),
    placeholder: '/previews/placeholder-1.svg',
    url: '#selected-projects', // Enlace de destino
  },
  // ...
];
```
- **Sin enlace** (`url: ''`): Se renderiza como un `<button>` accesible sin navegación, conservando el hover, oclusión y tooltip.
- **Scroll suave interno** (`url: '#selected-projects'` o cualquier `#id`): Hace scroll suave a esa sección dentro de la misma pestaña.
- **Enlace externo** (`url: 'https://...'`): Se renderiza como un `<a target="_blank" rel="noopener noreferrer">`.

---

## 4. Cómo Ajustar la Velocidad y la Física del Cursor

Todos los parámetros están centralizados al inicio de [`src/components/PlanetHero.tsx`](file:///f:/Wopell/Mis%20trabajos/Pagina%20web/Portfolio_AntiGravity/portfolio-creativo/src/components/PlanetHero.tsx) en el objeto `CONFIG.cursorFx`:

```typescript
cursorFx: {
  // Ajuste de atracción en reposo (Imán)
  staticRadius: 65.0,    // Radio de influencia en px (recomendado: 50 - 85)
  pullStrength: 7.5,     // Fuerza máxima de atracción en px (recomendado: 4.0 - 12.0)
  staticSwell: 0.06,     // Crecimiento sutil de los puntos bajo el cursor (+6%)

  // Ajuste de ondas en movimiento
  waveSpeed: 110.0,      // Velocidad base de expansión (80 - 160 px/s)
  waveSpeedMax: 380.0,   // Velocidad máxima al deslizar rápido (250 - 500 px/s)
  warpMax: 10.0,         // Límite máximo de deformación en pantalla (10 px aprobado, escalado por R/350)
  radiusOffsetMax: 22.5, // Amplitud del rizado orgánico fractal fBm (15 - 35 px)
  swellMax: 0.10,        // Crecimiento máximo de los puntos en la cresta (+10%)
}
```

---

## 5. Modos de Depuración y Diagnóstico en URL

Agrega parámetros de consulta a la URL en tu navegador:
- `?debug=1`: Activa el panel HUD en pantalla con lectura de **FPS en tiempo real**, renderizador activo (WebGL2 o Canvas 2D), cantidad de puntos activos, radio y conteo de segmentos de ondas. También muestra el círculo discontinuo teal de influencia del cursor.
- `?freeze=1`: Congela el tiempo global para inspección estática o capturas deterministas.
- `?cursor=X,Y`: Posiciona el cursor en coordenadas específicas (ejemplo `?cursor=0.1,0.06` para África).
- `?wave=1`: Simula un trazo activo de ondas para verificar la refracción y rizado orgánico.
- `?canvas2d=1` (o `?webgl=0`): Fuerza el fallback automático a Canvas 2D para comprobar el funcionamiento en navegadores sin soporte WebGL2.
