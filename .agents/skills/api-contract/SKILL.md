---
name: api-contract
description: Diseña o revisa el contrato de una API (endpoints, payloads, errores, versionado) antes de implementarla. Úsalo al crear endpoints nuevos o cuando frontend y backend deban acordar una interfaz.
argument-hint: <endpoints o feature cuya API diseñar>
---

# API Contract — la interfaz antes que la implementación

Diseña el contrato para lo que indiquen los argumentos. El entregable es el contrato escrito (en el formato que use el repo: OpenAPI, tipos TS compartidos, GraphQL schema, o markdown si no hay ninguno), no la implementación.

## Proceso

1. **Mira lo existente**: convenciones de la API actual del repo (nombres de rutas, shape de errores, paginación, auth). El contrato nuevo debe parecer hermano de los existentes, no de otro proyecto.
2. **Diseña cada endpoint** con la tabla completa:

```
### <MÉTODO> /ruta/:param
Auth: <quién puede — rol/scope>
Request: <schema + ejemplo JSON RELLENO con datos realistas>
Response 200/201: <schema + ejemplo relleno>
Errores:
  400 <cuándo exactamente> → { shape del error }
  401/403 <cuándo>
  404 <cuándo>
  409/422 <cuándo, si aplica>
Paginación/orden/filtros: <si es lista>
Idempotencia: <qué pasa si llega dos veces>
```

3. **Checklist de diseño** — recorre cada punto:
   - Nombres: sustantivos en plural para colecciones, consistentes con el resto de la API.
   - ¿Qué campo identifica el recurso y es estable en el tiempo?
   - Errores con shape ÚNICO en toda la API (código machine-readable + mensaje humano + detalles por campo en validación).
   - Fechas en ISO 8601 UTC; dinero en enteros de unidad mínima o decimal-string, nunca float.
   - Campos que pueden ser null declarados explícitamente; nada de "a veces viene, a veces no".
   - ¿Qué pasa con listas vacías, recursos borrados, y peticiones repetidas?
   - Evolución: ¿añadir un campo mañana rompe a los clientes de hoy? (los clientes deben ignorar campos desconocidos).
   - Nada del modelo interno filtrado: el contrato expone el dominio, no las tablas.

4. **Entrega**: el contrato + 3-5 líneas de decisiones tomadas y por qué (para que el implementador no las re-litige).

## Regla
Ejemplos SIEMPRE rellenos con datos realistas ("María García", fechas reales, IDs con formato real) — los ejemplos con "string" y "foo" esconden errores de diseño que los datos reales delatan.
