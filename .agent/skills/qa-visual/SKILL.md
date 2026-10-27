---
name: qa-visual
description: Ejecuta auto-inspección visual contra referencia.png, detecta discrepancias de diseño a 1920px y emite listas de corrección para el Builder sin molestar al usuario.
---

# Skill: QA Visual Autónomo

## Cuándo usarlo
Utilizalo para verificar el resultado visual tras una fase de construcción o al invocar `/verificar <spec>`.

## Procedimiento de Auto-Revisión
1. **Extracción y Carga de Referencia**:
   - Localiza la referencia maestra en `docs/referencias/referencia.png`, `referencia_1.png` o `docs/referencias/aprobados/referencia_<seccion>_1920px.png`.
   - Este recorte representa el estándar de verdad para la resolución de **1920px**.
2. **Captura en 1920px**:
   - Ejecuta `node scripts/verify.mjs --section <seccion> --widths 1920`.
   - Recupera la captura generada en `docs/reportes/<fecha>/section_<seccion>_1920px.png`.
3. **Análisis Comparativo y Detección de Desviaciones**:
   - Inspecciona la captura actual frente a la referencia prestando atención a:
     * **Morfología**: altura visible de las carpetas, escalonamiento de pestañas, bordes y esquinas redondeadas.
     * **Contornos**: continuidad y color exacto del trazo (ej. `#4A4036` de ~2px continuo en pestaña y cuerpo).
     * **Colores y texturas**: colores planos puros sin degradados ni barras superpuestas ajenas a la referencia.
     * **Tipografía**: posición exclusiva del texto en las pestañas, sin textos residuales en el cuerpo.
4. **Construcción de la Tabla de Discrepancias para el Builder**:
   - Si se detectan diferencias, formula una tabla procesable para el Builder:
     `Elemento | Estado Actual | Estado de Referencia | Acción Requerida`
   - El estado es `FALLA` y se envía al Orquestador para que el Builder ajuste el código de inmediato.
5. **Aprobación de 1920px y Expansión Responsive**:
   - Únicamente cuando 1920px coincide con la referencia de diseño:
     * Ejecuta `node scripts/verify.mjs --section <seccion> --widths 1440,768,390,360`.
     * Valida ausencia de scroll horizontal y consola limpia en todos los anchos.
     * Emite veredicto `APROBADO`.

## Prohibiciones
- **PROHIBIDO pedir referencias visuales o capturas base al usuario**: Toda referencia proviene de `docs/referencias/referencia.png` o `referencia_1.png`.
- **PROHIBIDO modificar código fuente** en `src/`.
- **PROHIBIDO emitir veredicto APROBADO si existen desviaciones visuales visibles en 1920px**.
