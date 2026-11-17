# DIRECTION — «Archivo»

Dirección visual de /works (wopell · Tomy Powell). Fuente de verdad para las próximas sesiones.
Elegida por Claude con libertad creativa total (pedido del usuario, 17 nov 2026).

## Idea

Un archivo editorial ordenado: papel, tinta y una sola voz serif. El diseño se calla y el
trabajo pone el color. El planeta halftone es el único gran momento; el resto es precisión.

Público: marcas, agencias y emprendedores que contratan diseño y quieren ver trabajo real
antes de escribir. Acción principal: abrir una carpeta → ver el proyecto → escribir.

## Tipografía (solo self-hosted, `public/fonts/`)

| Rol | Fuente | Uso |
|---|---|---|
| Display | Instrument Serif regular | Títulos de sección, en mayúsculas o en caja normal, tamaño grande |
| Acento | Instrument Serif italic | Una palabra o frase por título («by wopell», «together») |
| Sistema | JetBrains Mono 500/700 | Etiquetas, pestañas `001 // EDITORIAL`, metadatos, botones, footer |

- Nada más. Archivo Black, Bodoni, Jost, Outfit, Special Elite, Caveat, Silkscreen,
  Press Start, Permanent Marker y Playfair quedan fuera de /works.
- Las etiquetas del planeta siguen en Inter hasta migrarlas (deuda).
- Mono siempre en mayúsculas, tracking 0.14–0.22em, 10–12px. Serif nunca en negrita.

## Color

| Rol | Hex |
|---|---|
| Papel | `#f2efe6` |
| Blanco (hero) | `#ffffff` |
| Ficha (superficie elevada) | `#fbfaf6` |
| Tinta | `#191510` |
| Contorno / líneas | `#4A4036` |
| Tinta suave (texto secundario) | `#6b6257` |
| Acento único (foco, estado activo, aro de satélites) | `#2F6F6B` |
| Marca puntual (pines del planeta) | `#7A2E4D` |

- Sin violeta ni lavanda en el diseño propio.
- Sin degradados de color: solo papel, tinta y contorno. El color viene de las piezas.
- El satélite periwinkle del planeta (`#8C8CF0`) pasa a cobalto o a la imagen del trabajo
  cuando se toque esa parte.

## Layout

- Orden: Hero (blanco) → Planeta (papel) → Contacto → Carpetas → Marcas → Footer.
- Eje centrado. Contenido 860–1120px; márgenes laterales iguales; 16px de gutter en 390.
- Líneas finas de 1px `#4A4036` como estructura (la regla «SELECTED PORTFOLIO ——— 2023-2027»
  del hero es el patrón: etiqueta mono · línea · dato mono).
- Cada sección abre con su encabezado de archivo: `0N — NOMBRE` en mono a la izquierda,
  línea, dato a la derecha; y un título serif grande debajo.
- Contacto = ficha de archivo: contorno de tinta, título serif, canales como filas con
  etiqueta mono, dato serif y flecha.
- Carpetas = cascada solo contorno, pestaña con texto (sin barra de color), cuerpo papel.
- Marcas = logos en tinta sobre papel, en loop.
- Sin fotos de stock ni imágenes remotas. Solo trabajo real (o placeholders neutros marcados).

## Movimiento

- El planeta es el momento: no se compite con él.
- Hover: subrayado que se dibuja (240ms), flecha que avanza 4px, ficha que sube 2px,
  zoom 1.02 en previews. Press: escala 0.98.
- Carpetas: hover 3D (rotateX leve + pull) con compactación de las demás; la preview
  rota cada 10 s; click = vuelo FLIP al modal; cerrar = vuelve a su carpeta.
- Entradas: una sola vez por sección, 500–700ms, ease `cubic-bezier(.2,.7,.1,1)`.
  Nada aparece tarjeta por tarjeta con el scroll.
- `prefers-reduced-motion`: todo quieto, nada oculto.

## Diales (1–10)

| Dial | Valor | Lectura |
|---|---|---|
| Variedad de diseño | 4 | Sistema estable; la sorpresa la pone el planeta |
| Intensidad de movimiento | 5 | Momento fuerte en planeta y carpetas, el resto solo hover |
| Densidad visual | 3 | Mucho aire, poco texto, una idea por pantalla |

## Nunca

- Corporativo, barato, recargado, stock/Unsplash.
- Chips de colores saturados, stickers, cinta o notas manuscritas en /works.
- Más de dos familias tipográficas nuevas.
- Datos inventados (clientes, cifras, testimonios) presentados como reales.
