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
| Display | Instrument Serif 400 | 56–96px (máx. 6rem) | «MY WORKS», «PORTFOLIO» |
| Llamado a contacto | Inter 800, mayúsculas, tracking −0.03em | 44–84px | «Let’s work together» (placa de contacto) |
| Título de pieza en pantalla | Instrument Serif | 40–64px | Pieza elegida, título de la ficha |
| Título de pieza en grilla | Instrument Serif | 24–28px | Cada tarjeta |
| Etiqueta | Inter 600, mayúsculas, tracking 0.08em | 14px | Cliente, «Clientes», pie |
| Datos | Inter 500 | 15px | Tipo · duración |
| Botones y filtros | Inter 600 | 15–16px | «Ver proyecto», filtros, navbar |

- Instrument Serif nunca por debajo de 24px (solo existe en 400 y es de trazo fino).
- Nada por debajo de 14px. Tamaños en `rem` (respetan el tamaño de letra del navegador).
- Excepción congelada: la regla del hero (Inter).
- Fuera: JetBrains Mono, Caveat, Jost, Bodoni, Outfit, Silkscreen y cualquier otra.

## Color

| Rol | Hex | Dónde |
|---|---|---|
| Papel | `#f2efe6` | Fondo de todo el recorrido, marco de la intro |
| Tinta | `#191510` | Texto, cierre, filtro activo, botón principal |
| Blanco | `#ffffff` | Hero, resplandor de la intro |
| Acento único | `#2f6f6b` | Pieza activa, foco, hover del botón principal y de los círculos del planeta, selección |

## Layout

- `/`: intro de fotogramas en la máscara escalonada. En el recorte: «PORTFOLIO», tu nombre,
  la oferta y «Deslizá ↓». Una sola forma de entrar: el scroll (la navbar es navegación, no atajo).
  Al final, el resplandor blanco y /works en el mismo blanco.
- `/works`, de corrido sobre el mismo papel:
  1. Hero (congelado).
  2. Planeta: el globo de puntos está congelado (look y giro). Va más abajo, con aire arriba y
     abajo: ninguna órbita pasa por debajo del hero. Las órbitas no se dibujan enteras: detrás de
     cada objeto queda un rastro punteado largo sobre su elipse real (151° los círculos, 108° los
     objetos) que se desvanece; los puntos quedan fijos en la órbita, nunca tiemblan, y empiezan
     8 px fuera del borde del objeto (no se ve de dónde nacen aunque el objeto esté detrás y
     semitransparente). Delante del globo el rastro se ve encima; detrás, el disco lo tapa.
     Cuatro círculos de trabajos, como lentes (aro de papel, filete de tinta), cada uno con su
     plaquita en tinta con el nombre del filtro que abre (Animación · 3D · IA · Post); clic
     filtra la grilla. En las otras cuatro órbitas, objetos de tinta: dos lunas, un satélite y un
     planetoide con anillo. Cada 9–16 s un cometa cruza por detrás del globo.
  2b. Agujero negro (transición, CSS 3D real): un piso de papel cuadriculado en isométrico, que se
     funde con la página a lo lejos, con un pozo cuadrado sin ventanas (paredes en sombra y fondo
     negro). Encima se lee CREATIVE en una línea. Atado al scroll: las letras caen una por una
     dentro del pozo; la cámara gira hasta mirarlo de frente y entra en él (las paredes pasan en
     perspectiva) hasta que el fondo ocupa toda la pantalla; ese fondo es una losa con canto que
     bascula desde su borde de arriba hacia el fondo y debajo aparece la galería, que se aclara
     mientras la losa se va. Con reduced-motion, el piso quieto con el pozo y la palabra.
  3. Trabajos: filtros «Todo · Animación · 3D · IA · Post» y una galería masonry (3 columnas,
     2 en tablet, 1 en mobile) con cada pieza en su formato real (16:9 o 9:16). Cada tarjeta
     muestra el póster y un loop de 6 s sin audio exportado del video original
     (public/works/loops). Clic abre la ficha, que muestra el loop en su formato.
  4. Footer, debajo de los trabajos y antes de la placa: «Clientes» y una tira que se mueve sola
     con los 30 logos (Clients.tsx), de borde a borde, sobre papel liso entre dos filetes y con
     los bordes fundidos; con mouse se detiene mientras se la mira. Un solo gris (tinta al
     70 %), cada logo recortado a su contorno y pasado a tinta (public/logos/ink) con el mismo
     peso visual: misma superficie, corregida por la densidad de tinta. Los logos se cargan
     todos juntos cuando la tira se acerca a la pantalla. Sin hover: no son links. Debajo, la
     firma · el lugar · el año.
  5. Placa de contacto, al final de todo, que entra por transición atada al scroll: apenas
     asoma, el papel cuadriculado se desarma en sus propios cuadritos (los mismos de la
     cuadrícula de la página, alineados): cada uno pasa a tinta, después a un píxel grande con
     el color de la pieza y después a la pieza; primero los del centro, en desorden. Con la
     escena ya fija, cuando no queda papel, entra el bloque de contacto. En la placa pasan los
     loops horizontales de las piezas, uno tras otro, con su color, grano fino y viñeta suave;
     sin tubo curvo ni líneas de barrido (finaleGL.ts). El mouse arrastra la imagen como un
     líquido (donde arrastra fuerte, bloques y color separado); en el teléfono, el dedo hace lo
     mismo aunque la página scrollee. El scroll la ondula abajo y cada pieza entra en bloques
     que se resuelven.
     El bloque de contacto, en blanco y negro sobre un vidrio oscuro que desenfoca la pieza
     (los títulos de las piezas nunca compiten): «● Mis redes & contacto directo», «Let’s work
     together», un filete y una tarjeta blanca por canal (ícono en tinta, nombre y usuario):
     Instagram, Telegram, Email (más ancha, con botón para copiar el mail), Behance y LinkedIn.
     Cinco en fila en desktop; donde no entran, el mail primero y solo en su fila. Abajo de la
     placa, qué pieza está en pantalla. Es el único lugar de contacto (además de «Sobre mí»).
     Efecto del video tomado de una referencia; el contenido es solo propio.
- `/about`: póster (nombre en Inter 800 + 200, una frase, anillos de tinta como piso) y los datos
  del CV como anotaciones con barra negra en mucho espacio; aparecen al entrar en pantalla.
- Una sola vista de detalle: la ficha (modal). Sin catálogo, sin carpetas en caja.
- Sin eyebrows, sin numeraciones decorativas, sin notas a mano, sin estadísticas.

## Movimiento

- Momentos: el resplandor de la intro, el planeta, el agujero negro y la placa de contacto (el
  papel que se desarma en cuadritos). Además, solo la tira de clientes (70 s la vuelta en el
  teléfono, 90 s en pantallas grandes).
- El bloque de contacto entra cuando la placa llena la pantalla: opacidad y 16 px hacia arriba
  en 400–500 ms, con sus partes escalonadas 0 · 50 · 90 · 130 ms; vuelve a irse si se sube.
  Tarjetas: hover sube 2px, press 0.98; copiar el mail cambia el ícono por un tilde 1,8 s.
- Los loops de la galería corren solo en pantalla, sin audio; con reduced-motion queda el póster.
- Curvas (iguales en CSS y GSAP): entrar/salir `cubic-bezier(0.23, 1, 0.32, 1)` (`--arch-ease`,
  `EASE.ui`); moverse a la vista `cubic-bezier(0.77, 0, 0.175, 1)` (`EASE.move`); color `ease`.
  Nunca `ease-in` en la interfaz.
- Duraciones: press 160 ms; color 150–200 ms; ficha: entra en 300 ms, sale en 180 ms (si se
  cierra mientras entra, sale desde donde quedó); volver arriba < 300 ms; la navbar cambia de
  página al instante y su indicador se mueve en 250 ms; el loader de la intro se funde en 200 ms.
- Hover (solo mouse): la miniatura escala 1.03 en 240 ms; botones y tarjetas de contacto suben
  2px. Press: 0.97
  (miniatura 0.98).
- Al cambiar de filtro la grilla entra con 240 ms, escalonada 0 · 60 · 110 · 150 · 185 · 215 · 245 ·
  275 ms; nunca al cargar.
- En motion (v12) nada de atajos x/y/scale en lo que se anima mientras la página carga o cambia
  de ruta: strings de transform (WAAPI).
- `prefers-reduced-motion`: la intro no hace zoom (primer fotograma quieto en su marco, sin imán,
  sin parallax ni inercia): el scroll funde el texto y después el blanco, y /works arranca en ese
  blanco. En el resto, sin escalas ni desplazamientos; quedan los cambios de color y fundidos
  cortos. En el planeta: objetos quietos, sin estelas ni cometa, y los círculos no crecen. En el
  cierre (placa de contacto): sin transición ni escena fija; el póster de la primera pieza,
  quieto, con la viñeta hecha en CSS y el bloque a la vista. En el footer, la tira no se
  mueve: los 30 logos bajan a varias filas.
- Planeta: el hover de los círculos es solo con mouse (o foco de teclado); el círculo crece 1.2
  y su plaquita baja con él en 200 ms y se pinta con el acento en 150 ms.

## Nunca

- Corporativo, recargado, stock.
- Letra fina y chica: nada por debajo de 14px, serif nunca por debajo de 24px.
- Más de una forma de llegar al mismo lugar o de abrir lo mismo.
- Mostrar las mismas piezas en más de un lugar (además de la ficha).
- Cortes en el recorrido: cajas, tarjetas con márgenes, numeraciones de sección.
- Datos inventados presentados como reales.
- Scroll que arrastra al usuario o que navega solo más de una vez.
