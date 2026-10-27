---
name: fase
description: Ejecuta una fase completa de forma 100% autónoma. Toma referencia.png a 1920px, itera Builder y QA hasta paridad visual, y entrega al usuario únicamente cuando está terminado.
---

# Comando: /fase <spec> <número>

## Uso
`/fase <spec> <número>` (ej. `/fase carpetas 1`, `/fase carpetas 2`).

## Procedimiento Autónomo
1. **Inicio y Alcance**: El Orquestador lee `docs/specs/<spec>.md` y extrae el recorte relevante de `docs/referencias/referencia.png` como referencia de 1920px.
2. **Ciclo Autónomo de Construcción y Auto-Revisión**:
   - Builder implementa los cambios.
   - QA captura a 1920px y compara contra la referencia.
   - Si QA detecta diferencias visuales (morfología, contorno, colores, escalonamiento), emite la tabla de correcciones.
   - Builder ajusta el código y recompila.
   - Este bucle corre de forma autónoma hasta que 1920px es idéntico a la referencia (máximo 3 ciclos).
3. **Expansión Responsive y Verificación Técnica**:
   - Una vez aprobado 1920px, QA valida 1440px, 768px, 390px y 360px.
   - Performance y Arquitecto ejecutan sus chequeos.
4. **Entrega Final**:
   - Solo cuando el ciclo está completo y validado, el sistema crea el commit en git, documenta la retrospectiva en `docs/lecciones.md` y presenta al usuario la tabla final y las capturas para su revisión final.
