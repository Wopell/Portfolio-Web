# Regla 00: Arquitectura y Restricciones del Proyecto

1. **Stack tecnológico**: Vite + React 19 + TypeScript + Tailwind CSS 4 + Lucide Icons + GSAP / Motion.
2. **Jerarquía visual y z-index**: El orden de apilamiento debe gobernarse mediante variables CSS o clases coordinadas. El `<Navbar>` debe permanecer siempre por encima de cualquier capa interactiva o modal.
3. **Accesibilidad y movimiento**: Toda animación o efecto cinético debe contemplar `prefers-reduced-motion` desde el inicio (degradando a transiciones inmediatas o estados estáticos).
4. **Aislamiento de componentes**: Componentes críticos como `PlanetHero` y `ProjectFolders` deben mantenerse desacoplados y auto-contenidos, evitando efectos secundarios globales.
5. **Alcance de edición**: Queda prohibido editar secciones o archivos de `src/` ajenos a la spec activa.
6. **Inviolabilidad de reglas**: La regla `01-evidencia.md` es de solo lectura para todos los agentes; ningún agente puede sobreescribir o relajar sus cláusulas.
