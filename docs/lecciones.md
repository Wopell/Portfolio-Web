# Bitácora de Lecciones y Registro de Decisiones

Este documento registra los hallazgos, bloqueos técnicos, causas raíz y propuestas de mejora del sistema de desarrollo del portfolio.

---

## Lección 01: Formato y Alcance de las Referencias Visuales a 1920px
* **Fecha**: 2026-10-26
* **Componente**: `ProjectFolders` / `Selected Projects`
* **Error detectado**: El subagente generó un recorte ajustado únicamente a los límites del trazo vectorial de las carpetas (`997 x 773 px`), omitiendo el contexto espacial del canvas de 1920px (título, márgenes laterales, retícula del fondo y alineación global).
* **Causa raíz**: Asumir que "recortar la sección" significaba aislar solo los elementos SVG/DOM de las carpetas, en lugar de tomar el frame completo de la ventana a 1920px de ancho (`1920 x 800 px`).
* **Regla aprendida**: Las referencias aprobadas a 1920px deben mantener el **ancho completo del viewport (1920px)** y la altura real de la sección (`800px`), permitiendo comparar no solo los vectores interiores sino el ancho relativo del contenedor (~1260px), márgenes laterales centrados (~330px a cada lado) y espaciado vertical respecto al título de sección.
* **Archivos archivados**: El recorte erróneo se trasladó a `docs/referencias/desaprobados/referencia_carpetas_1920px.png`. La referencia correcta del usuario se consolidó en `docs/referencias/aprobados/referencia_carpetas_1920px.png` (`1920 x 800 px`).

---

## Lección 02: Gestión de Memoria y Ciclos de Vida en Modales FLIP (Fases 3 a 6)
* **Fecha**: 2026-10-27
* **Componente**: `ProjectFolders` / `ProjectModal` / `Works`
* **Hallazgo**: Durante la prueba de estrés de 20 ciclos consecutivos de apertura y cierre del modal, el delta de memoria inicial fue del 25.4% debido a tres factores acumulativos:
  1. `<AnimatePresence>` interno dentro del modal que retornaba `null` inmediatamente al limpiar el estado, impidiendo la ejecución limpia de callbacks de salida en Motion.
  2. `window.location.hash` acumulaba 40 entradas de historial en la sesión del navegador.
  3. Preload de imágenes instanciaba `new Image()` en cada cambio de índice sin verificar si ya existía en caché.
* **Solución aplicada**:
  1. Se movió `<AnimatePresence>` al padre (`Works.tsx`) envolviendo `{selectedProject && <ProjectModal ... />}`, garantizando unmount limpio de listeners y nodos DOM.
  2. Se sustituyó la asignación directa de hash por `window.history.replaceState`, manteniendo la URL sincronizada sin saturar el historial.
  3. Se incorporó `preloadedUrls.current` (Set) en `ProjectFolders.tsx` para asegurar que cada preview se precargue una única vez.
* **Resultado**: El delta de memoria tras 20 ciclos de apertura y cierre se redujo a **7.88%** (< 15% requerido por spec), con 0 errores de consola y restauración instantánea de foco y scroll.

---

## Tareas Pendientes de Aprobación Humana

* **[FLAG GLOBAL ?freeze=1]**: Implementar en `src/` un parámetro query string `?freeze=1` que pause shaders WebGL (PlanetHero, AsciiWorld), rAF loops y transiciones CSS para pruebas de regresión visual 100% deterministas entre renders.
  * **Estado**: Propuesto como tarea futura. **Requiere aprobación explícita del usuario antes de tocar `src/`**.
  * **Mitigación actual en scripts**: Los scripts (`verify.mjs`, `perf.mjs`) usan recorte por selector CSS (`--selector`), detección de `networkidle` y espera de estabilización rAF sin tocar `src/`.
