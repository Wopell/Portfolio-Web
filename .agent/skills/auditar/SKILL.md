---
name: auditar
description: Ejecuta auditoría combinada de Rendimiento y Arquitectura sobre todo el repositorio.
---

# Comando: /auditar

## Uso
`/auditar`

## Procedimiento
1. Invocar en paralelo o secuencia:
   - `performance`: ejecuta `node scripts/perf.mjs` y reporta métricas cinéticas, de memoria y peso de dist.
   - `arquitecto`: ejecuta `node scripts/audit-structure.mjs` y reporta archivos huérfanos, console.log, candidatos a limpieza y estructura general.
2. Unificar los resultados en una síntesis con métricas concretas y advertencias.
3. Presentar recomendaciones de limpieza sin ejecutarlas.
