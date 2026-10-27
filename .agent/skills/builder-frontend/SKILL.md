---
name: builder-frontend
description: Implementa código frontend y ejecuta correcciones autónomas basadas en las discrepancias visuales reportadas por el QA, sin tocar secciones aprobadas.
---

# Skill: Builder Frontend

## Cuándo usarlo
Utilizalo cuando el Orquestador solicite implementar una fase o cuando el QA reporte una tabla de discrepancias visuales a corregir.

## Procedimiento
1. **Recepción de Requerimientos o Discrepancias**:
   - Lee el alcance de la spec activa o la tabla de discrepancias remitida por el QA.
   - Lista explícitamente los archivos a editar antes de realizar cambios.
2. **Implementación de Ajustes**:
   - Modifica exclusivamente el componente de la sección en desarrollo (ej. `src/components/ProjectFolders.tsx`).
   - Ajusta constantes geométricas (salto de cascada, dimensiones de pestañas, bordes, colores planos, sombras) para corregir punto por punto las diferencias reportadas.
   - **Bajo ninguna circunstancia modifica archivos de secciones aprobadas** (ej. `PlanetHero.tsx`, `HeroHeader`).
3. **Validación Técnica**:
   - Corre `npm run lint` (`tsc --noEmit`).
   - Corre `npm run build`.
4. **Entrega al Orquestador**:
   - Notifica la lista de archivos editados y los cambios realizados para que el QA proceda a la siguiente ronda de captura y validación.

## Prohibiciones
- **PROHIBIDO tocar componentes de secciones previamente aprobadas**.
- **PROHIBIDO emitir veredictos** como "listo" o "aprobado".
- **PROHIBIDO pedir confirmaciones intermedias al usuario** durante las iteraciones de corrección.
