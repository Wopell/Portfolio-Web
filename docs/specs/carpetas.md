# Especificación Técnica: Selected Projects (Carpetas Interactivas)

Documento normativo de requerimientos y criterios de aceptación objetivos para el componente `ProjectFolders` (`src/components/ProjectFolders.tsx`).

---

## Parámetros Globales de Calidad (Aplican a Todas las Fases)
* **Assets e imágenes**: Prohibido el uso de Unsplash, stock comercial o URLs remotas. Todos los recursos deben ser locales (`public/`). En las categorías 001 a 003 se usan placeholders neutros sin texto visible hasta que se incorporen las piezas reales del autor.
* **Consola**: 0 errores y 0 warnings durante navegación, hover, teclado y apertura/cierre.
* **Scroll**: 0 scroll horizontal en todos los anchos (`1920px`, `1440px`, `768px`, `360px`).
* **Accesibilidad**: Soporte obligatorio de `@media (prefers-reduced-motion: reduce)` (elimina rotaciones 3D).
* **Z-Index**: `<Navbar>` siempre por encima de cualquier capa interactiva o modal.
* **Aislamiento**: El componente debe estar envuelto y protegido por `FolderErrorBoundary`.

---

## Fase 1: Estado en Reposo (Aprobada)
* **Arquitectura de dos capas**:
  * **Capa 1 (Fondo)**: Carpeta completa de color plano (`#3B5BDB`, `#F5C518`, `#8C8CF0`, `#F26B6B`) con pestaña y contorno exterior continuo `#4A4036` de ~2px.
  * **Capa 2 (Frente)**: Máscara del proyecto con esquinas redondeadas, montada sobre el cuerpo a `top: 34px`, cubriendo todo el cuerpo y exponiendo únicamente la etiqueta.
* **Aspecto estricto**:
  * **Texto solo en las pestañas** (ej. `001 // ANIMATION`).
  * **Sin barras de color sobre el cuerpo**: el cuerpo visible es la propia preview del trabajo.
  * **Outline continuo**: contorno oscuro fino (`#4A4036`, ~2px) que recorre cuerpo, esquinas redondeadas y pestaña como una sola forma continua.
* **Cascada compacta**: Paso vertical entre carpetas `stepYPx: 34px`.
* **Carpeta 004**: Muestra `/ref/tomy_vintage_card.png` a ancho completo sin letterbox ni estiramiento (la altura visible se adapta a la proporción real del asset).
* **Control de fase**: `enableInteraction: false`.
* **Criterios Medibles**:
  * Diff de píxeles: `≤ 1.5%` frente a captura aprobada recortada (señal informativa mientras no exista `?freeze=1`).
  * Consola: 0 errores.
  * Scroll horizontal: Ausente.
  * *Fidelidad visual artesanal*: [REVISIÓN HUMANA].

---

## Fase 2: Hover 3D con Elevación y Compactación
* **Comportamiento Cinético**:
  * Activación de bandera: `enableInteraction: true`.
  * **Carpeta bajo el cursor**: se levanta con rotación 3D sobre el eje horizontal inferior (`rotateX` entre -10° y -18°), mostrando su preview grande.
  * **Otras carpetas se compactan**: las carpetas ubicadas arriba suben; las carpetas ubicadas abajo bajan.
  * **Hover estable sin parpadeos**: umbral de intención de ~80 ms para evitar activaciones erráticas o rebotes de cursor entre bordes.
  * **Equivalencia de teclado**: Navegación con `Tab` equivale al hover (eleva la carpeta con foco).
  * **Soporte táctil (Touch)**: Primer tap asoma la carpeta y compacta las demás; segundo tap ejecuta la apertura.
  * **Reduced Motion**: Con `prefers-reduced-motion: reduce`, se anula la rotación 3D (`rotateX = 0°`), manteniendo la elevación o realce visual plano.
* **Criterios Medibles**:
  * Transformación computada en DOM: detecta `rotateX` entre -10° y -18° y traslación Y al simular hover o foco en Playwright.
  * Estabilidad de framerate: retiene ≥ 85% de la línea base del entorno durante movimiento.
  * Consola: 0 errores.
  * *Calidad plástica del movimiento*: [REVISIÓN HUMANA].

---

## Fase 3: Rotación Cíclica de Previews (10 segundos)
* **Comportamiento**:
  * **Rotación exclusiva**: Solo la carpeta asomada rota su preview cada 10 segundos entre los trabajos de su categoría.
  * **Pausa**: El temporizador se pausa inmediatamente al salir el cursor de la carpeta.
  * **Precarga**: Precarga en segundo plano de la imagen siguiente para garantizar transiciones instantáneas.
  * **Indicador numérico**: Rótulo visual de paginación (ej. `02 / 05`).
  * **Correspondencia unívoca**: El trabajo visible en el preview al momento de hacer click es exactamente el que se abre.
* **Criterios Medibles**:
  * Cambio de atributo `src` verificado tras 10.5 segundos en la carpeta activa.
  * Presencia del indicador de conteo en el DOM.
  * Cero fugas de temporizadores (intervalos destruidos al desmontar).
  * *Fluidez del cross-fade*: [REVISIÓN HUMANA].

---

## Fase 4: Apertura y Vuelo a Pantalla Completa
* **Comportamiento**:
  * **Salida de las demás carpetas fuera del viewport**:
    * Si se abre la **primera carpeta**: todas las demás bajan.
    * Si se abre una carpeta **intermedia**: las de arriba suben y las de abajo bajan.
    * Si se abre la **última carpeta**: todas las demás suben.
  * **Vuelo de la tarjeta (FLIP)**: La preview vuela fluidamente hasta el componente `ProjectModal` con ese trabajo.
  * **Catálogo de categoría**: El catálogo completo de proyectos de la categoría queda posicionado detrás.
  * **Bloqueo y accesibilidad**:
    * Scroll de página bloqueado (`overflow: hidden` en body).
    * Foco de accesibilidad atrapado dentro del modal (`focus trap`).
  * **Sincronización URL**: Actualización del hash en la barra de direcciones: `#selected-projects/<slug>/<id>`.
* **Criterios Medibles**:
  * Animación de salida de carpetas no seleccionadas verificada por coordenadas fuera de pantalla.
  * `document.body.style.overflow === 'hidden'`.
  * URL hash sincronizado con el ID del trabajo activo.
  * Stacking context: `<Navbar>` permanece por encima del modal.
  * *Percepción de vuelo cinemático*: [REVISIÓN HUMANA].

---

## Fase 5: Cierre y Archivado
* **Comportamiento**:
  * **Retorno y archivo**: La tarjeta vuelve hacia la carpeta y se archiva deslizándose suavemente detrás del bolsillo, con un leve rebote elástico.
  * **Reacomodación**: Las demás carpetas retornan fluidamente a su disposición en cascada en reposo.
  * **Foco y scroll**: Devuelve el foco del teclado al elemento disparador y restaura el scroll de la página en la posición exacta previa.
  * **Disparadores**: Click en el botón de cerrar (`X`) o pulsación de la tecla `Escape`.
  * **Latencia de respuesta**: Inicio de la animación en `< 300 ms` desde el evento.
* **Criterios Medibles**:
  * Tecla `Escape` desmonta el modal en `< 300 ms`.
  * Scroll vertical restaurado en la posición original.
  * Foco retornado al elemento correspondiente.
  * *Naturalidad del rebote elástico al guardar*: [REVISIÓN HUMANA].

---

## Fase 6: Pulido Final, Hardening y Rendimiento
* **Comportamiento**:
  * Adaptabilidad responsive continua de **1920px a 360px** de ancho.
  * Navegación completa por teclado (`Tab`, `Shift+Tab`, `Enter`, `Escape`) con foco visible de alto contraste.
  * Compilación de producción (`npm run build` y `npm run lint`) limpia, sin errores ni advertencias.
  * Prueba de estrés de memoria: abrir y cerrar el modal **20 veces consecutivas** sin fugas de memoria (delta de Heap < 15%).
* **Criterios Medibles**:
  * Ejecución de suite de verificación en 1920, 1440, 768 y 360px con 0 fallas.
  * Delta de Heap post 20x aperturas/cierres < 15%.
  * Salida de `npm run build` con código de salida 0.
  * *Veredicto final del usuario*: [REVISIÓN HUMANA].
