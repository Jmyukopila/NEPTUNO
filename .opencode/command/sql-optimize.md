---
description: Diagnostica y optimiza queries SQL lentas con EXPLAIN, índices y reescritura, midiendo antes y después. Úsalo ante queries lentas, timeouts de base de datos o revisión de rendimiento de acceso a datos.
---

Argumentos recibidos (formato esperado: <query lenta o síntoma de rendimiento>): $ARGUMENTS

# SQL Optimize — medir, no adivinar

La query (o el síntoma) viene en los argumentos. Regla cero: ninguna optimización sin un `EXPLAIN` antes y una medición después. La intuición sobre rendimiento de SQL falla más que acierta.

## Proceso

1. **Reproduce y mide el estado actual**:
   - Ejecuta la query con datos realistas (una query rápida sobre 100 filas de dev no dice nada sobre 10M en prod).
   - `EXPLAIN ANALYZE` (Postgres) / `EXPLAIN` + tiempos (MySQL) / plan equivalente del motor. Guarda el plan ANTES.
   - Si el repo usa Neon y el MCP de Neon está disponible, usa sus herramientas de `explain_sql_statement` y `list_slow_queries`.

2. **Lee el plan buscando los sospechosos habituales** (en orden de frecuencia):
   - **Seq Scan sobre tabla grande** con filtro selectivo → falta índice sobre la(s) columna(s) del WHERE/JOIN.
   - **Índice existente que no se usa** → función sobre la columna (`WHERE lower(email)=...`, `WHERE fecha::date=...`), cast implícito (columna varchar comparada con int), o `LIKE '%...'` con comodín inicial.
   - **Filas estimadas vs reales desviadas 100×** → estadísticas viejas (`ANALYZE la_tabla`) antes de tocar nada más.
   - **Nested Loop sobre millones de filas** → suele ser lo anterior (mal estimado) o falta índice en el lado interno del join.
   - **Sort/Hash spilling a disco** → work_mem, o reducir el conjunto antes de ordenar.
   - **N+1** desde la aplicación: la query es rápida pero se ejecuta 500 veces → arreglar en el código (JOIN/IN/dataloader), no en SQL.

3. **Aplica UNA mejora a la vez**, en este orden de coste/beneficio:
   1. `ANALYZE`/estadísticas (gratis).
   2. Reescribir para hacer la query "sargable" (quitar funciones del lado de la columna, eliminar `SELECT *`, filtrar antes de agregar, `EXISTS` en vez de `IN (subquery)` gigante, paginación por keyset en vez de `OFFSET` profundo).
   3. Índice nuevo: sobre las columnas del filtro (las de igualdad primero, rango después); compuesto si el patrón lo repite; parcial si el filtro es siempre el mismo subconjunto; covering (INCLUDE) si evita ir a la tabla. En producción: `CREATE INDEX CONCURRENTLY`.
   4. Cambios estructurales (materialized view, desnormalización, particionado) — solo con evidencia de que 1–3 no bastan, y como propuesta al usuario, no de oficio.

4. **Mide después**: mismo `EXPLAIN ANALYZE`, misma data. Reporta plan y tiempo antes → después.

## Advertencias
- Cada índice acelera lecturas y grava TODAS las escrituras de la tabla: justifica cada uno, y busca índices existentes redundantes que el nuevo deje obsoletos.
- No optimices queries que corren una vez al día en batch; optimiza las del camino caliente. Pide/mide frecuencia antes de invertir.
- Cambiar la query puede cambiar su semántica (JOIN que duplica filas, NULL en NOT IN). Verifica que el resultado sigue siendo EL MISMO: mismo conteo y checksum sobre una muestra.

## Formato de entrega
```
Query: <qué hace, frecuencia>
Antes: <tiempo, plan resumido en 2-3 líneas>
Cambio: <qué se hizo y por qué el plan lo pedía>
Después: <tiempo, plan> → mejora: <N×>
Riesgos: <coste en escrituras, cambios de semántica verificados>
```
