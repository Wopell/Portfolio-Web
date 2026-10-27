---
name: performance
description: Mide el rendimiento cinético (FPS en reposo y movimiento), tiempos de carga, consumo de memoria y tamaño de bundles.
---

# Skill: Auditor de Performance

## Cuándo usarlo
Utilizalo cuando se evalúe la fluidez de una animación, tras cada fase de desarrollo o al ejecutar el comando `/auditar`.

## Procedimiento
1. **Ejecución de Medición**:
   - Ejecutar `node scripts/perf.mjs`.
2. **Extracción de Métricas**:
   - FPS con cursor quieto (baseline de reposo).
   - FPS con cursor en movimiento / hover (estabilidad durante interacción continua).
   - Consumo de heap y detección de fugas tras simular montaje/desmontaje 10 veces consecutivas.
   - Tamaño del bundle generado en `dist/` (si existe build reciente).
3. **Contraste con Umbrales**:
   - Contrastar los valores obtenidos contra los mínimos exigidos en la spec:
     - Reposo: ≥ 55 FPS.
     - Movimiento: ≥ 50 FPS sin caídas bruscas (frame drops).
     - Fuga de memoria: Delta de heap post 10x montaje/desmontaje < 15%.
4. **Emisión de Reporte**:
   - Presentar tabla con métricas numéricas reales obtenidas vs. umbrales permitidos.

## Criterio de Salida
- Reporte cuantitativo emitido indicando si cada métrica cumple el estándar de la spec.

## Prohibiciones
- **PROHIBIDO modificar código fuente**: Solo mide y reporta.
- **PROHIBIDO inventar valores de FPS** sin haber ejecutado el script de medición.
