# Regla 01: Protocolo de Evidencia, Referencias y Autonomía Multi-Agente

> **AVISO DE SOLO LECTURA**: Esta regla es obligatoria para todos los agentes y de solo lectura. Solo el usuario humano puede modificarla.

1. **Separación de roles y veredicto**: El agente que construye (Builder) nunca declara un trabajo como "aprobado". Solo reporta mediciones objetivas. El QA (`qa-visual`) evalúa contra la referencia visual y emite el veredicto.
2. **Usuario fuera del loop de intermediación**: El usuario no debe proveer capturas de línea base. El QA toma automáticamente de `docs/referencias/referencia.png` (o `referencia_1.png`) el recorte correspondiente a la sección para usarlo como referencia visual de 1920px.
3. **Estrategia Desktop First (1920px)**: Se trabaja y pule primero la resolución **1920px** hasta alcanzar paridad estética y estructural con la referencia. Las demás resoluciones responsive (1440px, 768px, 390px, 360px) se trabajan y auditan una vez que 1920px ha sido validado.
4. **Secciones aprobadas intocables**: Las secciones ya aprobadas (como `PlanetHero`) quedan estrictamente congeladas. Ningún agente puede modificar archivos o componentes de secciones aprobadas a menos que el usuario lo solicite expresamente.
5. **Auto-revisión y corrección autónoma**: El QA compara la captura actual contra la referencia visual, detecta discrepancias cuantitativas y morfológicas (colores, márgenes, contornos, cascadas, proporciones) y las traslada al Builder. Los agentes iteran entre sí de forma autónoma (hasta 3 ciclos de corrección) sin pedir confirmaciones intermedias al usuario.
6. **Umbral de consulta humana**: Solo se recurre al usuario si:
   - Se requiere un asset externo o archivo de mayor resolución que no pueda extraerse de la referencia de diseño.
   - Se alcanzan 3 ciclos fallidos consecutivos y se detecta un bloqueo irresoluble.
7. **Ubicación de evidencias**: Todo reporte debe incluir capturas alojadas exclusivamente en `docs/reportes/<fecha>/` referenciadas con rutas relativas al repositorio. Queda estrictamente prohibido enlazar a rutas fuera del repo.
8. **Sin stock ni URLs remotas**: Prohibido el uso de imágenes remotas (Unsplash, stock online). Todo asset debe residir en `public/`.
9. **Criterio de salida técnico**: Una tarea concluye técnicamente solo si `npm run build` y `npm run lint` finalizan con código 0 y la consola del navegador corre con 0 errores.
10. **Formato conciso de entrega**: Al finalizar la fase, presentar la tabla de criterios medibles + capturas adjuntas, sin informes extensos innecesarios.
