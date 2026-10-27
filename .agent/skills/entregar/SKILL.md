---
name: entregar
description: Prepara la entrega final del proyecto ejecutando compilación de producción, auditoría de /public/, checklist y verificación de integridad.
---

# Comando: /entregar

## Uso
`/entregar`

## Procedimiento
1. **Compilación de Producción**: Ejecutar `npm run build` y `npm run lint` para confirmar cero errores y cero advertencias.
2. **Inspección de /public/**: Verificar que no haya quedado ningún archivo temporal, script o reporte en la carpeta estática.
3. **Auditoría Global**: Ejecutar `node scripts/audit-structure.mjs` para garantizar ausencia de console.log y código muerto.
4. **Verificación de Documentación**: Validar que el README refleje las instrucciones operativas.
5. **Checklist Final**: Emitir un checklist con resultados reales medidos y solicitar el visto bueno final del usuario.
