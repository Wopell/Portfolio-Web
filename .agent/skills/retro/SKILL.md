---
name: retro
description: Documenta retrospectivas tras fallas o cierres de fase, registrando causas raíz en docs/lecciones.md y proponiendo reglas dinámicas.
---

# Skill: Retrospectiva y Aprendizaje

## Cuándo usarlo
Utilizalo al finalizar satisfactoriamente una fase, ante un bloqueo técnico de 3 ciclos, o cuando el usuario invoque el comando `/retro`.

## Procedimiento
1. **Recolección de Incidentes**:
   - Analizar las iteraciones previas del ciclo de trabajo: qué falló, en qué paso y por qué razón.
2. **Registro en Bitácora**:
   - Agregar una entrada estructurada en `docs/lecciones.md` con:
     - Fecha y Fase.
     - Síntoma observado.
     - Causa raíz técnica.
     - Solución o mitigación adoptada.
3. **Propuesta de Regla Dinámica**:
   - Si el incidente evidencia un patrón recurrente prevenible, formular un diff propuesto para `.agent/rules/02-lecciones.md`.
4. **Detención**:
   - Presentar la propuesta en el chat al usuario.

## Criterio de Salida
- Registro persistido en `docs/lecciones.md`.
- Diff presentado en el chat para decisión humana.

## Prohibiciones
- **PROHIBIDO aplicar el diff sobre `.agent/rules/02-lecciones.md`** sin la autorización explícita del usuario.
