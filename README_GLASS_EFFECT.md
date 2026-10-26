# Glassmorphism Parallax Typography System (Ultra-Low Performance Cost)

Sistema de tipografía gigante estilo **vidrio esmerilado (glassmorphism)** con efecto de **parallax sincronizado**, responsivo y optimizado para mantener **60-120 FPS fluidos** sin coste de cálculo de blur en tiempo de ejecución.

---

## 🏗️ Arquitectura y Rendimiento

El sistema **NO utiliza `backdrop-filter: blur()` como solución principal** (lo que normalmente sobrecarga la GPU y colapsa los FPS en scrolls móviles y desktop). En su lugar, utiliza una **arquitectura de doble capa sincronizada por hardware**:

1. **Capa Nítida:** La imagen de fondo en alta resolución original (`object-fit: cover`).
2. **Capa de Vidrio:** Una versión ultra-ligera y **pre-desenfocada** (ancho 48px, WebP, calidad 60, blur 2) escalada por GPU al tamaño de la tarjeta. Sobre ella se superpone un velo de degradado blanco translúcido (`rgba(255,255,255,0.5)` a `rgba(255,255,255,0.12)`).
3. **Máscara SVG Dinámica:** Se mide con Canvas 2D el ancho y la altura requerida para que el texto ocupe el ~92% del ancho de la tarjeta con la línea base cortándose sutilmente en el borde inferior. Se genera un Blob URL con la máscara y se aplica mediante `mask-image: var(--mask)`.
4. **Parallax Sincronizado Nativo:**
   - En navegadores modernos (Chrome, Edge 115+): Se utilizan **CSS Scroll-Driven Animations** (`view-timeline` y `animation-timeline: --card-scroll`) que mueven ambas capas (`translate3d(0, -8%, 0)` a `8%`) exclusivamente en el hilo del Compositor del navegador.
   - En navegadores sin soporte: Fallback pasivo con `IntersectionObserver` y `requestAnimationFrame` que actualiza `--p`.
   - Como ambas capas comparten el mismo movimiento exacto, la refracción y el blur parecen ocurrir en vivo en cada subpíxel, pero **el coste de cálculo de blur en GPU es CERO**.

---

## 🚀 Cómo ejecutar el generador de pre-desenfoque (`make-blur`)

El script utiliza `sharp` para procesar cualquier carpeta de imágenes y generar automáticamente las versiones `-blur.webp` (de apenas ~200 bytes cada una):

```bash
# Procesa la carpeta public/landscapes por defecto y actualiza src/data/blur-manifest.json
npm run make-blur
```

O para procesar cualquier otra carpeta personalizada:
```bash
node scripts/make-blur.mjs ./public/mis-imagenes
```

---

## 🎴 Cómo añadir una tarjeta nueva

Importa el componente `GlassTitleCard` y pásale las propiedades requeridas:

```tsx
import { GlassTitleCard } from './components/GlassTitleCard';

<GlassTitleCard
  title="June"
  image="/landscapes/june.webp"
  blurImage="/landscapes/june-blur.webp"
  badge="34 reports"
  subtitle="Arctic Expedition // 2026"
  fontFamily="Outfit, sans-serif" // Opcional
/>
```

### Pasos recomendados:
1. Coloca tu imagen de fondo en `public/landscapes/june.webp`.
2. Ejecuta `npm run make-blur` (generará automáticamente `public/landscapes/june-blur.webp`).
3. Añade la tarjeta a tu array de datos.

---

## 🔤 Cómo cambiar la fuente tipográfica

Puedes cambiar la fuente a nivel global o por tarjeta:

### Opción 1: Por tarjeta mediante la prop `fontFamily`
```tsx
<GlassTitleCard
  title="April"
  image="/landscapes/april.webp"
  blurImage="/landscapes/april-blur.webp"
  fontFamily="'Playfair Display', serif" // o 'Inter', 'Jost', 'Bodoni Moda'
/>
```

### Opción 2: A nivel global en el componente
En `src/components/GlassTitleCard.tsx`, modifica el valor por defecto:
```ts
fontFamily = 'Outfit, Inter, sans-serif'
```

El componente espera automáticamente a `document.fonts.ready` antes de renderizar la máscara para garantizar que la fuente personalizada esté completamente cargada.

---

## ⚡ Modo Ligero forzado (`fx-lite`)

Para forzar el modo de máxima compatibilidad o comprobar la diferencia de rendimiento, puedes añadir la clase `fx-lite` en la etiqueta `<html>`:

```html
<html class="fx-lite">
```

En la barra superior de la sección de trabajos se incluye un botón interactivo para alternar entre el modo automático y el modo `fx-lite` en tiempo real.
