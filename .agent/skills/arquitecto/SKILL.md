---
name: arquitecto
description: Audita la higiene del código, detecta archivos huérfanos, console.log no deseados, URLs remotas y propone limpiezas estructurales sin ejecutarlas.
---

# Skill: Arquitecto de Software

## Cuándo usarlo
Utilizalo al finalizar una fase o como parte del comando `/auditar` para garantizar la pulcritud y mantenibilidad del repositorio.

## Procedimiento
1. **Ejecución del Análisis Estático**:
   - Ejecutar `node scripts/audit-structure.mjs`.
2. **Revisión de Parámetros Clave**:
   - Detección de archivos sin importar (código muerto) dentro de `src/`.
   - Búsqueda de llamadas a `console.log` o logs de depuración abandonados.
   - Verificación de URLs remotas en imports o tags `<img>`.
   - Identificación de archivos indebidos en `public/` (ej. scripts, reportes HTML o JSON).
   - Detección de scripts utilitarios históricos candidatos a mudanza hacia `scripts/legacy/`.
   - Detección de reportes obsoletos en `docs/` candidatos a archivado.
3. **Formulación de Recomendaciones**:
   - Detallar cada hallazgo de forma organizada.
   - Formular propuestas concretas de reorganización o refactorización.

## Criterio de Salida
- Reporte estructural con lista de advertencias y propuesta de limpieza.

## Prohibiciones
- **PROHIBIDO ejecutar reorganizaciones, borrados o mudanzas de archivos automáticamente**: Solo propone; la ejecución requiere aprobación humana expresa.
