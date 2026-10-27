---
name: verificar
description: Ejecuta únicamente la verificación de QA Visual sobre la especificación indicada sin alterar código.
---

# Comando: /verificar <spec>

## Uso
`/verificar <spec>` (ej. `/verificar carpetas`, `/verificar planeta`).

## Procedimiento
1. Invocar al skill `qa-visual`.
2. Ejecutar `node scripts/verify.mjs` enfocado en la sección correspondiente.
3. Comparar las capturas resultantes contra `docs/referencias/aprobados/` y emitir la tabla de criterios y veredicto.
4. Detenerse y mostrar la tabla de resultados al usuario.
