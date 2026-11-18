# DIRECTION — «Archivo» (revisión: un recorrido continuo)

Dirección visual de `/` y `/works` (wopell · Tomy Powell). Fuente de verdad para las próximas sesiones.
Revisada el 18 nov 2026 tras el pedido del cliente: letra más grande y con más peso, sin
redundancias, una sola forma de llegar a cada cosa, jerarquía clara y un recorrido continuo.
Menos es más: solo el texto, los botones y los filtros necesarios.

## Idea

Un archivo editorial sobre un mismo papel, sin cortes. El planeta es la entrada; después,
el trabajo grande y al alcance; al final, el contacto. El diseño se calla y las piezas ponen el color.

Público: marcas, agencias y emprendedores que contratan motion, 3D y post.
Acción principal: elegir una pieza → ver el proyecto → escribir.

## Tipografía (solo self-hosted, `public/fonts/`; sin Google Fonts)

| Rol | Fuente | Tamaño | Uso |
|---|---|---|---|
| Display | Instrument Serif 400 | 56–96px (máx. 6rem) | «MY WORKS», «PORTFOLIO», «Gracias por *mirar*» |
| Título de pieza en pantalla | Instrument Serif | 40–64px | Pieza elegida, título de la ficha |
| Título de pieza en grilla | Instrument Serif | 24–28px | Cada tarjeta |
| Etiqueta | Inter 600, mayúsculas, tracking 0.08em | 14px | Cliente, «Clientes», pie |
| Datos | Inter 500 | 15px | Tipo · duración |
| Botones y filtros | Inter 600 | 15–16px | «Ver proyecto», filtros, navbar |

- Instrument Serif nunca por debajo de 24px (solo existe en 400 y es de trazo fino).
- Nada por debajo de 14px. Tamaños en `rem` (respetan el tamaño de letra del navegador).
- Excepciones congeladas: la regla del hero (Inter) y las etiquetas del planeta (Inter).
- Fuera: JetBrains Mono, Caveat, Jost, Bodoni, Outfit, Silkscreen y cualquier otra.

## Color

| Rol | Hex | Dónde |
|---|---|---|
| Papel | `#f2efe6` | Fondo de todo el recorrido, marco de la intro |
| Tinta | `#191510` | Texto, monitor, cierre, filtro activo, botón principal |
| Blanco | `#ffffff` | Hero, resplandor de la intro |
| Acento único | `#2f6f6b` | Pieza activa, foco, hover del botón principal, selección |
| Marca puntual (congelada) | `#7A2E4D` | Pines del planeta |

## Layout

- `/`: intro de fotogramas en la máscara escalonada. En el recorte: «PORTFOLIO», tu nombre,
  la oferta y «Deslizá ↓». Una sola forma de entrar: el scroll (la navbar es navegación, no atajo).
  Al final, el resplandor blanco y /works en el mismo blanco.
- `/works`, de corrido sobre el mismo papel:
  1. Hero (congelado).
  2. Planeta (congelado en look y movimiento): sus 4 círculos filtran la grilla.
  3. Trabajos: monitor con la pieza elegida + su título grande + «Ver proyecto»;
     filtros «Todo · Animación · 3D · IA · Post»; grilla de 3 columnas (2 en tablet, 1 en mobile)
     con miniaturas grandes. Hover muestra la pieza en el monitor; clic abre la ficha.
  4. Clientes: una fila estática de 12 logos.
  5. Cierre a sangre: el papel se funde en la imagen; «Gracias por mirar», email y redes.
     Es el único lugar de contacto.
- Una sola vista de detalle: la ficha (modal). Sin catálogo, sin carpetas en caja.
- Sin eyebrows, sin numeraciones decorativas, sin notas a mano, sin estadísticas.

## Movimiento

- Momentos: el resplandor de la intro, el planeta y el encendido del monitor. Nada más.
- Sin autoplay. El monitor cambia cuando el usuario elige (hover, foco o filtro).
- Hover: la miniatura escala 1.03; botones suben 2px. Press: 0.98.
- `prefers-reduced-motion`: sin imán en la intro, sin transiciones; el monitor no anima ni
  redibuja si nada cambia.

## Nunca

- Corporativo, recargado, stock.
- Letra fina y chica: nada por debajo de 14px, serif nunca por debajo de 24px.
- Más de una forma de llegar al mismo lugar o de abrir lo mismo.
- Mostrar las mismas piezas en más de un lugar (además del monitor y la ficha).
- Cortes en el recorrido: cajas, tarjetas con márgenes, numeraciones de sección.
- Datos inventados presentados como reales.
- Scroll que arrastra al usuario o que navega solo más de una vez.
