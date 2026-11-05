# PLAN — Round 3 · partículas · carpetas · marcas (para Antigravity)

> Contexto obligatorio: el pedido de round 2 **sí está implementado y en `main`** —
> partículas `ef31004` · carpetas `dddcd7e`+`3983966`+`3811c65` · marcas `5437bb8`+`8e2a835`.
> Capturas de hoy del estado real: `shots/qa/audit-d/` (desktop) y `shots/qa/audit/` (mobile 390×844).
> Si al abrir `http://127.0.0.1:5173/works` con **Ctrl+Shift+R** no ves ese estado, es un problema
> de vista/caché, no de código: parar y avisar al usuario antes de tocar nada.
>
> Este plan cierra la brecha entre lo implementado y las refs aprobadas. Lo marcado **[INFERIDO]**
> es reconstrucción del QA — si tu lectura del pedido original es otra, `dispute` con motivo.

## Ítem 1 — Partículas: look y movimiento "paper" según `senal_Particles_1920px.png`

**Ref dice:** glifos GRANDES y dispersos (~8–12 visibles en 1920), varios montados sobre
**chips cuadrados de papel blanco** (sticker recortado, borde nítido), grilla del papel bien visible;
el video muestra pasos secos tipo stop-motion (salto perceptible, no deriva continua).

**Hoy:** ~70 glifos chicos sin chips, grilla sutil, deriva suave + micro-pasos casi imperceptibles.

**Tareas (InkParticles.tsx):**
1. Tamaño de glifo ~2–2.5× y densidad 70 → 24–30 (desktop; proporcional en mobile).
2. Chip de papel blanco (~1.4× el glifo, sombra dura corta o borde fino) detrás de ~40% de los glifos, como la ref.
3. Amplificar el reloj escalonado: cada step debe notarse (salto de rotación ≥6° y offset ≥10px), manteniendo el repel del cursor y `prefers-reduced-motion`.
4. **[INFERIDO]** grilla del hero un punto más marcada, solo dentro del campo de partículas.

**Aceptación:** captura del hero cotejable con la ref en tamaño/densidad/chips; `npm run qa` en 0; rAF < 100 ms.

## Ítem 2 — Carpetas: cotejo 1:1 contra `senal_carpetas_1920px.png`

**Ref dice:** bandas de cuerpo **limpias** (color plano; la banda IA con textura de grida lavender),
sin cards de preview ni chips "× 4 PROYECTOS"; tab 001 azul marino oscuro; apertura de la 004 al cuerpo foto.

**Hoy:** bandas con previews de proyecto + "× 4 PROYECTOS"; 001 azul brillante `#3B5BDB`.

**Tareas (ProjectFolders.tsx):**
1. Cotejo pixel con `scripts/_zoom.mjs` (costuras, radios, alturas de banda, colores de tab) → listar TODAS las diferencias encontradas antes de codear.
2. Corregir las de geometría/color que no contradigan feedback explícito de round 2 (tab 001 navy, radios, alturas).
3. **[REQUIERE USUARIO]** las previews dentro de las bandas fueron pedido de round 2 pero la ref las muestra fuera — confirmar: ¿se quitan o se quedan? No decidir solo.

**Aceptación:** lista de diferencias + fixes de lo confirmado; captura folders desktop/mobile cotejada contra ref.

## Ítem 3 — Marcas: escala y espaciado según `senal_Clientes_1920px.png`

**Ref dice:** logos MUCHO más grandes (GEO ≈200 px de ancho, círculo footy ≈90 px), 3–4 visibles por
viewport con gaps enormes; banda reglada fina arriba/abajo.

**Hoy:** marquee con 30 logos a `h-14/78px`, 5–6 visibles, gaps de `px-8/12` — funciona pero se ve denso y chico.

**Tareas (BrandsStrip.tsx):**
1. Escalar logos ~1.6–2× (según ref) y gap proporcional; recalcular ancho de pista del marquee.
2. Velocidad lenta; evaluar paso seco (stop-motion) para consistir con el lenguaje "paper" — **[INFERIDO]**.
3. Mantener pausa al hover, boost por scroll y `prefers-reduced-motion`.

**Aceptación:** 3–4 logos grandes por viewport como la ref; marquee sin saltos; `npm run qa` en 0.

## Protocolo (AGENTS.md manda)

- Después de cada ítem: `npm run qa` · antes de declarar done: `npm run qa:full` + pasada visual vs refs.
- Al terminar cada ítem: `QA_ROLE=builder node scripts/qa-punch.mjs set <ID> fixed-pending-verify`.
- Dudas de intención → `dispute` con motivo; refs de `docs/referencias/aprobados/` ganan discusiones estéticas.
