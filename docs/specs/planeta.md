# Especificación Técnica: PlanetHero (Tierra Halftone 3D & Órbitas)

Documento normativo de requerimientos y criterios de aceptación objetivos para el componente `PlanetHero` (`src/components/PlanetHero.tsx`). Refleja con precisión lo construido y aprobado en el proyecto.

---

## Parámetros del Sistema y Criterios Medibles

### 1. Renderizado y Geometría de la Esfera Terrestre
* **Motor gráfico principal**: WebGL2 nativo (con soporte de shaders de semitono y partículas).
* **Fallback**: Canvas 2D automático si no hay WebGL2 o si se fuerza por URL con `?renderer=2d`.
* **Densidad de puntos**:
  * Desktop: 18.000 puntos (piso mínimo protegido de 12.000 puntos ante caída de FPS).
  * Mobile: entre 9.000 y 14.000 puntos según ancho de pantalla (piso mínimo protegido de 9.000 puntos).
* **Giro terrestre**: Rotación axial continua de **oeste a este** (~40 segundos por vuelta completa en reposo).
* **Iluminación**: Dirección de luz fija normalizada `[-0.6, -0.7, 0.5]` (arriba-izquierda-frente) que esculpe el volumen de la esfera.

### 2. Órbitas, Elementos Flotantes y Oclusión
* **Elementos orbitales**:
  * **4 etiquetas de especialidad**: `Editorial Design`, `Social Media`, `Branding` y `Event Graphics` (tarjetas rectangulares de textura tipo papel con pin granate superior).
  * **4 círculos de categorías**: representan `001 ANIMATION`, `002 3D ART`, `003 IA` y `004 POST PRODUCTION` con previews de trabajos y borde teal (`#2F6F6B`).
* **Interacción y Accesibilidad en Círculos**:
  * Implementados como enlaces o botones (`<a>` / `<button>`) con atributo `aria-label="Ver trabajo: {título}"`.
  * Sin imágenes de Unsplash, stock ni URLs remotas; usan placeholders neutros locales hasta contar con piezas reales.
  * **Oclusión y bloqueo de click**: cuando orbitan por detrás de la esfera (`z < -0.2`), se desactivan interacciones (`pointer-events: none`), evitando clicks involuntarios a través del disco.
* **Oclusión 3D real (Detrás / Delante)**:
  * Cuando un elemento orbita detrás de la esfera terrestre, queda atenuado, desenfocado y ocluido visualmente por el disco crema (`#f5f2eb`).
  * Al pasar al hemisferio frontal, se escala suavemente y se muestra nítido, interactivo y opaco por delante.
* **Jerarquía de capas (Stacking Context)**:
  * El `<Navbar>` y el título del Hero (`<HeroHeader>`) se posicionan siempre **por encima** de la Tierra y sus órbitas (`var(--z-title, 50)`).

### 3. Física Reactiva del Cursor e Interacción
* **Arrastre (Drag) e Inercia**:
  * Al hacer click y arrastrar sobre la esfera, rota libremente siguiendo el desplazamiento del puntero.
  * Al soltar el arrastre, desacelera suavemente con inercia física amortiguada (`damping: 0.95`).
* **Parallax**:
  * Desplazamiento opuesto sutil en respuesta a la posición del cursor (inclinación de hasta 10°).
* **Imán en reposo y Ondas Cinéticas**:
  * Cuando el cursor se detiene, se activa un imán estático sutil que atrae los puntos cercanos.
  * En movimiento, genera ondas expansivas con rizado fractal y límite de deformación estricto (`warpMax: 10.0 px`).

### 4. Responsividad, Touch y Accesibilidad
* **Interacción Touch en Móviles**:
  * Los gestos táctiles sobre el planeta interactúan con la esfera **sin bloquear el scroll vertical nativo** de la página (`touch-action: pan-y`).
* **Accesibilidad (`prefers-reduced-motion`)**:
  * Si el usuario tiene activa la preferencia de movimiento reducido en el sistema operativo, se anulan el giro axial continuo y los efectos de inercia, manteniendo el planeta en orientación fija legible.

---

## Matriz de Verificación Objetiva

| Requerimiento | Método de Medición | Umbral de Aceptación |
| :--- | :--- | :--- |
| **Contexto Gráfico** | Inspección DOM / Script Playwright | `canvas.getContext('webgl2')` activo (o 2D con `?renderer=2d`) |
| **Giro Oeste a Este** | Telemetría / Inspec. rotación longitudinal | Incremento positivo de longitud axial (~40s / vuelta) |
| **Piso de Puntos** | Conteo de vértices en memoria de shader | ≥ 12.000 desktop / ≥ 9.000 mobile |
| **Oclusión Órbitas** | Inspección de capas y transform | z-index y filtros CSS oscilan entre plano frontal y posterior |
| **Stacking Superior** | Inspec. z-index computado | `nav` y `HeroHeader` > canvas del planeta |
| **Touch Scroll** | Inspección de estilos CSS en contenedor | Propiedad `touch-action: pan-y` activa |
| **Reduced Motion** | Emulación `prefers-reduced-motion` | Delta de rotación por frame = 0 |
| **Consola** | Captura de eventos `page.on('console')` | 0 errores y 0 warnings de WebGL |
| **Scroll Horizontal** | Medición de ancho scroll vs. ventana | Ausente (`scrollWidth <= clientWidth + 1`) |
| **Diff de Píxeles** | Comparación pixelmatch por recorte | Aplica solo con modo determinista `?freeze=1`. Mientras no exista, el diff actúa exclusivamente como señal informativa |
| **Sensación Táctil / Fricción** | Evaluación interactiva directa | [REVISIÓN HUMANA] |
