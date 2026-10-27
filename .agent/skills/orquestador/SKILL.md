---
name: orquestador
description: Orquesta el ciclo autónomo de desarrollo y corrección multi-agente sin intermediación del usuario. Compara contra referencia.png a 1920px, delega ajustes al Builder y entrega la fase terminada.
---

# Skill: Orquestador de Fase Autónomo

## Cuándo usarlo
Utilizalo cuando se inicie una fase de trabajo (con `/fase <spec> <número>`) para ejecutar el ciclo completo de construcción, auditoría y corrección sin interrumpir al usuario.

## Procedimiento Autónomo
1. **Lectura de Spec y Referencia**:
   - Lee `docs/specs/<spec>.md` para la fase solicitada.
   - Identifica el recorte de diseño maestro en `docs/referencias/referencia.png` (o `referencia_1.png`).
2. **Ciclo Primario en 1920px (Desktop First)**:
   - Invoca a `builder-frontend` para implementar los cambios de la fase en `src/`.
   - Una vez que `npm run build` y `npm run lint` pasen:
   - Invoca a `qa-visual` para capturar a **1920px** y comparar exhaustivamente contra el recorte de referencia:
     - Discrepancias de posición, espaciado, cascada, colores, tipografía y bordes.
3. **Bucle Autónomo de Autocorrección (Máximo 3 ciclos)**:
   - Si `qa-visual` encuentra diferencias:
     - El Orquestador toma la tabla de discrepancias y se la entrega directamente a `builder-frontend`.
     - `builder-frontend` aplica los ajustes necesarios en el código.
     - Se repite la verificación visual.
     - **NO se interrumpe al usuario durante estas iteraciones**.
   - Si tras 3 ciclos persisten diferencias críticas, se detiene el bucle y se emite un reporte de bloqueo puntual.
4. **Validación Responsive y de Rendimiento**:
   - Una vez que **1920px queda aprobado**:
   - Se ejecutan las pruebas responsive en 1440px, 768px, 390px y 360px.
   - Se invoca a `performance` (`perf.mjs`) y `arquitecto` (`audit-structure.mjs`).
5. **Cierre de Fase y Entrega**:
   - Si todos los criterios pasan:
     - Registra la lección aprendida con `/retro`.
     - Guarda evidencias finales en `docs/reportes/<fecha>/`.
     - Ejecuta git commit.
     - Entrega la tabla final y capturas adjuntas al usuario para su revisión final.

## Prohibiciones
- **PROHIBIDO pedir capturas o confirmaciones intermedias al usuario** antes de agotar el ciclo autónomo.
- **PROHIBIDO modificar componentes de secciones aprobadas** (ej. `PlanetHero`).
- **PROHIBIDO escribir código directamente**: solo coordina y transfiere discrepancias.
