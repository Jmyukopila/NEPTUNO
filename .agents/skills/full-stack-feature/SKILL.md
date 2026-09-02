---
name: full-stack-feature
description: Construye una feature completa de extremo a extremo (base de datos → API → frontend) con enfoque contract-first y verificación por capa. Úsalo para features que atraviesan el stack completo.
argument-hint: <feature end-to-end a construir>
---

# Full-Stack Feature — contract-first, capa por capa

La feature viene en los argumentos. Constrúyela atravesando el stack en este orden estricto. El error clásico que este protocolo evita: construir frontend y backend en paralelo sin contrato y descubrir el desajuste al final.

## Fase 1 — Contrato (ANTES de tocar código)

Define y escribe en un archivo (o en el sistema de tipos compartido si el repo lo tiene):
- **Endpoints**: método, ruta, request/response con ejemplos JSON reales rellenos.
- **Errores**: shape del error, códigos de estado por caso (validación, no autorizado, no encontrado, conflicto).
- **Modelo de datos**: tablas/colecciones nuevas o modificadas, con tipos y constraints.
- **Estados de UI**: loading, vacío, error, éxito — qué muestra cada uno.

Si el repo tiene tipos compartidos (TypeScript compartido, OpenAPI, GraphQL schema, protobuf), el contrato SE ESCRIBE AHÍ y ambos lados lo importan. Usa `/api-contract` para diseñar contratos complejos.

## Fase 2 — Datos

Schema/migración primero (usa `/db-migration` si modifica tablas existentes con datos). Verifica: aplica la migración en local y consulta la tabla resultante.

## Fase 3 — Backend

Implementa el endpoint contra el contrato exacto de la Fase 1:
- Validación de input en el borde (nunca confíes en el frontend).
- Todos los casos de error del contrato implementados, no solo el happy path.
- Autorización: ¿quién puede llamar esto? Verifícalo en el handler, no solo en la UI.
- Verifica: levanta el servidor y ejecuta una petición real por caso del contrato (`curl`/`Invoke-RestMethod`), incluidos los de error.

## Fase 4 — Frontend

Implementa contra el contrato (no contra "lo que devolvió el server en mi prueba"):
- Los 4 estados de UI de la Fase 1 implementados.
- Errores del backend mostrados al usuario de forma útil, no tragados.
- Verifica: build del frontend + ejercita el flujo (dev server; si hay Playwright/Cypress en el repo, un test e2e del happy path).

## Fase 5 — Integración

- Flujo completo real: UI → API → DB → respuesta → UI, con datos reales.
- Un caso hostil de punta a punta (input inválido desde la UI: ¿el error del backend llega bien presentado?).
- Reporta con evidencia por capa (comando/acción → resultado observado).

## Reglas
- Nunca avances de fase con la anterior sin verificar.
- Si la feature es grande, las fases 3 y 4 pueden ir a los agentes `backend` y `frontend` EN PARALELO — pero solo después de cerrar la Fase 1: el contrato es lo que hace la paralelización segura.
- Cambios de contrato a mitad de camino: se actualiza el contrato escrito PRIMERO, luego ambos lados.
