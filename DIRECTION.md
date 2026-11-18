# DIRECTION — «Archivo» (revisión: guía de canales)

Dirección visual de `/` y `/works` (wopell · Tomy Powell). Fuente de verdad para las próximas sesiones.
Primera versión: 17 nov 2026. Revisada el mismo día tras la crítica: paleta restringida, intro
que termina en blanco, hub «guía de canales» y tipografía recortada a dos familias.

## Idea

Un archivo editorial que también es una sala de proyección: papel, tinta y una sola voz serif.
El diseño se calla y el trabajo pone el color. El planeta halftone es el gran momento de entrada;
después, una sola superficie donde está todo al alcance, como el menú de una consola.

Público: marcas, agencias y emprendedores que contratan motion, 3D y post y quieren ver trabajo
real antes de escribir. Acción principal: elegir una pieza → ver la ficha → escribir.

## Tipografía (solo self-hosted, `public/fonts/`; sin Google Fonts)

| Rol | Fuente | Tamaño | Uso |
|---|---|---|---|
| Display | Instrument Serif regular | máx. 96px (6rem); 44–84px en títulos de sección | «MY WORKS», «PORTFOLIO», «Now playing», «Gracias por mirar», título del catálogo |
| Acento | Instrument Serif italic | — | Una palabra por título, no en todos |
| Título de pieza | Instrument Serif | 36–64px en la ficha; 19px en la guía; 18–24px en tarjetas | Nombres de piezas y textos descriptivos cortos |
| Sistema | JetBrains Mono 500/600 | etiquetas 11px · metadatos 12px | Etiquetas, pestañas `001 // ANIMATION`, HUD, botones, navbar, números |
| Nota | Caveat 600 | 26–28px | Una sola nota a mano por página (hoy: «también con las flechas») |

- Nada más. Fuera de `/` y `/works`: Jost, Bodoni, Outfit, Inter, Archivo Black, Silkscreen,
  Special Elite, Press Start, Permanent Marker, Playfair.
- Excepciones congeladas: la regla del hero («SELECTED PORTFOLIO ——— …») y las etiquetas
  del planeta siguen en Inter.
- Mono siempre en mayúsculas, tracking 0.12–0.16em, nunca por debajo de 11px. Serif nunca en negrita.

## Color

| Rol | Hex | Dónde |
|---|---|---|
| Papel | `#f2efe6` | Fondo, texto sobre tinta, carpetas del fondo |
| Tinta | `#191510` | Texto, líneas y texto suave (con opacidad), monitor, cierre, catálogo, modal |
| Blanco | `#ffffff` | Superficies elevadas: hero, cuerpo de carpetas, celdas de contacto, cinta de clientes |
| Acento único | `#2f6f6b` | Lo activo o en marcha: progreso, «● REC», pestaña de la carpeta activa, celda en pantalla, foco, selección |
| Marca puntual (congelada) | `#7A2E4D` | Pines del planeta |

- Sin neón ni pasteles. Sin degradados de color: el color viene de las piezas.
- Profundidad con papel oscurecido por tinta (4 / 8 / 12 %), no con tonos nuevos.

## Layout

- `/`: intro de fotogramas dentro de la máscara escalonada (2,6 pantallas). La cámara entra en
  la barra blanca de censura, un resplandor blanco cubre la pantalla y `/works` arranca en ese
  mismo blanco. Navega una sola vez; «Ver trabajos» y «Mis trabajos» son atajos reales.
- `/works`: Hero (blanco) → Planeta (papel) → **Hub «Guía de canales»** → Cierre.
- Hub: arriba, monitor (splats) + ficha de la pieza; abajo, la guía: las carpetas tendidas como
  filas con sus piezas (la pestaña abre el catálogo con FLIP), canal 099 Contacto y canal 100
  Clientes. Mobile: cada carpeta se desliza de costado.
- Eje centrado, contenido hasta 1520px, gutter 16px en 390 y 40px desde 640.
- Sin eyebrows ni numeración `0N —` sobre los títulos; la numeración solo existe donde es un
  canal (001–004, 099, 100).
- Sin fotos de stock ni imágenes remotas. Solo trabajo real.

## Movimiento

- El planeta y el encendido del monitor son los momentos; el resto es respuesta a la mano.
- Hover: la celda se tiñe y la miniatura escala 1.03; la pestaña sube 3px. Press: 0.97–0.98.
- Guía: hover previsualiza en pantalla, clic abre la ficha, flechas mueven la selección.
- Autoplay de 7 s con barra de progreso; se pausa con hover, con foco adentro y con «Pausa».
- Catálogo: vuelo FLIP de la imagen; al cerrar, la página no se mueve y el foco vuelve.
- `prefers-reduced-motion`: sin imán en la intro, sin autoplay, sin transiciones; nada oculto.

## Diales (1–10)

| Dial | Valor | Lectura |
|---|---|---|
| Variedad de diseño | 4 | Sistema estable; la sorpresa la ponen el planeta y la pantalla |
| Intensidad de movimiento | 5 | Dos momentos fuertes, el resto responde a la mano |
| Densidad visual | 5 | Todo al alcance en ~1,5 pantallas, sin amontonar |

## Nunca

- Corporativo, barato, recargado, stock/Unsplash.
- Neón, pasteles, chips de colores saturados, stickers con sombra dura.
- Más de una nota a mano por página.
- Más de dos familias tipográficas (más Caveat para esa única nota).
- Datos inventados (clientes, cifras, testimonios) presentados como reales.
- Scroll que arrastra al usuario o que navega solo más de una vez.
