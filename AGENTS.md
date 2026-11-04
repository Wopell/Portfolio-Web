# AGENTS.md — contrato del workspace

Este repo se construye con un **split de roles**: un builder (Antigravity) implementa, y opencode actúa como **QA independiente** que verifica y escribe el punch list. Este archivo es la fuente de verdad de las reglas; se lee al inicio de **cada** tarea, junto con `shots/qa/PUNCHLIST.md`.

## Roles

- **Builder (Antigravity)**: implementa features y fixes. Nunca edita `shots/qa/PUNCHLIST.md` a mano; solo lo opera vía `scripts/qa-punch.mjs` con `QA_ROLE=builder` (`set`, `dispute`).
- **QA (opencode)**: corre el gate, revisa capturas contra `docs/referencias/aprobados/`, escribe el punch list con `QA_ROLE=qa`. **No implementa** (escalación abajo). En opencode esto se enforcea además con el agente `qa` (edit/write deshabilitados).
- Ambos leen `AGENTS.md` + `PUNCHLIST.md` al iniciar toda tarea.
- Falso positivo del QA: el builder lo reporta al usuario en vez de "trabearlo" con workarounds.

## QA protocolo

Después de **cada** cambio de código: `npm run qa`. Antes de declarar una tarea terminada: `npm run qa:full` + pasada visual contra refs.

### Exit codes (y reacción esperada)

| code | significa | qué hacer |
|---|---|---|
| 0 | PASS | seguir |
| 1 | QA FAIL | leer `shots/qa/REPORT.md`, arreglar el código (builder) o anotar punch item (QA), re-correr |
| 2 | entorno caído | ejecutar el comando de restart que imprime el preflight (también queda en `REPORT.md`), re-correr |
| 3 | lock | otra corrida tiene `shots/qa/.lock`; esperar o borrar el lock si quedó huérfano |

`REPORT.md` se **sobreescribe** en cada corrida: es el estado actual. El histórico vive en el punch list y en los commits.

### Punch list (`shots/qa/PUNCHLIST.md`)

Se escribe SOLO vía CLI (escritura atómica; IDs QA-NNN nunca se reutilizan):

```bash
# QA (opencode)
QA_ROLE=qa node scripts/qa-punch.mjs add " ubicación · esperado vs obtenido · patch sugerido · severity(blocker|major|minor)"
# ítems largos: add --file <path>  (4 líneas: location / finding / patch / severity) o --stdin
QA_ROLE=qa node scripts/qa-punch.mjs close QA-001 wontfix "motivo"     # desde cualquier estado no terminal
QA_ROLE=qa node scripts/qa-punch.mjs verify QA-001                     # fixed-pending-verify → verified
QA_ROLE=qa node scripts/qa-punch.mjs bump QA-001                       # fixed-pending-verify → open, rounds+1
QA_ROLE=qa node scripts/qa-punch.mjs resolve QA-001 open               # disputed → open|wontfix|withdrawn, rounds intactos
# Builder (Antigravity)
QA_ROLE=builder node scripts/qa-punch.mjs set QA-001 fixed-pending-verify   # solo desde open
QA_ROLE=builder node scripts/qa-punch.mjs dispute QA-001 "motivo"           # solo desde open
```

- Si olvidás `QA_ROLE=...`, el CLI rechaza e imprime **el comando completo corregido**: copialo y seguí.
- Estados terminales (`verified`, `wontfix`, `withdrawn`) no admiten más acciones.
- `bump` solo vale desde `fixed-pending-verify`: una ronda cuenta cuando el builder respondió y falló la reverificación, no re-verificaciones sueltas.
- **Ronda** = punch list entregado → respuesta del builder → reverificación del QA. En **round 3** sin pasar, el QA escala: propone implementar el fix y espera aprobación explícita del usuario. Solo con ese visto el código lo toca quien corresponda.

## Definición de done

1. `npm run qa` en 0 y `npm run qa:full` en 0 (si tocó algo visual/interactivo).
2. Pasada visual de las capturas nuevas contra `docs/referencias/aprobados/` (las refs ganan cualquier discusión estética).
3. Sin imágenes rotas, sin errores de consola, sin overflow en 1920 y 390×844.
4. `PUNCHLIST.md` sin ítems `open` propios.

## Reglas duras de entorno

- **WSL**: NUNCA correr `npm install` / `npm i` desde WSL en este repo (poda los binarios nativos linux de las deps Windows y rompe builds). Si se borran, se restauran con `npm pack` + extracción manual de `sharp`, etc.
- Dev server en `http://127.0.0.1:5173/works`. Si está caído: el hint del preflight de `qa.mjs` (WSL: `(nohup node node_modules/vite/bin/vite.js --port 5173 --host 127.0.0.1 > /tmp/opencode/vite-dev.log 2>&1 &)`), o `npm run dev` en terminal propia (bloquea).
- Capturas mobile SIEMPRE con `--mobile --width 390 --height 844` (solo `--mobile` = 1920 con UA mobile).
- chrome-headless-shell vive en `~/.cache/hyperframes/chrome/` y arranca con `LD_LIBRARY_PATH` apuntando a `~/.cache/hyperframes/chrome/syslibs/...` (ya resuelto en `capture_sections.mjs`).
- No matar procesos Chrome que no hayas arrancado vos; los de captura son `cdp-capture-*` en `%TEMP%`.
- `/tmp` (WSL) puede limpiarse entre sesiones: no guardar ahí nada que importe.

## Pipeline de captura (`scripts/capture_sections.mjs`)

```bash
node scripts/capture_sections.mjs --out shots/x --shot "nombre:step;step" [--json shots/x.json]
```

- Shots custom SIEMPRE con `--shot "name:steps"` (el shot posicional se ignora silenciosamente).
- Steps: `scroll=<sel|y>` · `click=<sel>` · `hover=<sel>` · `wait=<ms>` · `eval=<js>` · `eval-file=<path>` · `full=1`.
- Con `;` dentro de un `eval` se rompe el parser → usar `eval-file`. Los eval-file async van como IIFE `(async () => {...})()`.
- Resultados de steps se ven con `--debug`; `--json <path>` deja shots+consola+excepciones en un archivo (lo consume `qa.mjs`).
- Defaults no esperan settle: en shots custom poner los `wait` explícitos.

## Convenciones de código

- Paleta: papel `#f2efe6`, tinta `#191510`, outline `#4A4036`. Fuentes: Archivo Black, Special Elite, JetBrains Mono.
- GSAP solo vía `src/lib/gsap.ts`. Componentes de works en `src/components/works/`, estilos compartidos en `works-sections.css`.
- Los componentes usan docstrings/`/* sección */` estilo repositorio; sin comentarios innecesarios.
- Commits: `type(scope): summary` (feat/fix/chore/docs). Push a `origin/main` solo cuando el usuario lo pide.
- `docs/referencias/aprobados/` es fuente de verdad visual; no editar esos archivos.
