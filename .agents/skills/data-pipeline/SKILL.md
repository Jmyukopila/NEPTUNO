---
name: data-pipeline
description: Diseña y construye pipelines de datos (ETL/ELT) con idempotencia, validación en fronteras, cargas incrementales y observabilidad. Úsalo para crear o modificar procesos que muevan/transformen datos.
argument-hint: <pipeline a construir o modificar>
---

# Data Pipeline — ingeniería de datos que no despierta a nadie a las 3am

El pipeline viene en los argumentos. Las cuatro propiedades no negociables de cualquier pipeline que construyas: **idempotente, validado en fronteras, observable, reanudable**.

## Diseño (antes de código)

Responde por escrito:
1. **Contrato de entrada**: schema esperado de la fuente, qué garantiza y qué NO garantiza (¿llegan duplicados? ¿tarde? ¿mutan registros pasados?).
2. **Grano y clave**: qué es una fila en el destino y qué la identifica de forma única.
3. **Estrategia de carga**: full refresh vs incremental. Si incremental: ¿cuál es el watermark (updated_at, ID secuencial) y qué pasa con los registros que llegan tarde (late-arriving)?
4. **Idempotencia**: re-ejecutar el pipeline con los mismos inputs debe producir el MISMO estado, no filas duplicadas. Mecanismo concreto: upsert por clave / delete+insert de la partición / MERGE.
5. **Fallos parciales**: si muere a mitad, ¿qué queda? (transacción por lote / staging table + swap / particiones atómicas). Re-ejecutar tras un fallo debe ser siempre seguro.

## Implementación

- **Valida en las fronteras, no en el medio**: al ENTRAR (schema, tipos, nulos en campos críticos, filas fuera de rango) y al SALIR (conteos esperados, unicidad de clave, integridad referencial). Registros inválidos → a una zona de cuarentena/dead-letter con el motivo, NUNCA descartados en silencio.
- **Transformaciones puras** donde sea posible: funciones testeables sin la DB, separadas del I/O.
- **Convenciones del repo**: si hay dbt/Airflow/Dagster/Spark ya en uso, el pipeline nuevo usa el mismo framework y sus patrones, no uno nuevo.
- **Observabilidad mínima**: cada run registra filas leídas/escritas/cuarentenadas, duración, y watermark procesado. Un pipeline sin conteos es un pipeline en el que nadie confía.
- Timezone: todo timestamp interno en UTC; la conversión a local solo en presentación.

## Verificación (obligatoria)

1. Ejecuta con una muestra real (o sintética que cubra: duplicados, nulos, llegadas tardías, registros malformados).
2. **Test de idempotencia**: ejecútalo DOS veces seguidas → el destino debe quedar idéntico (mismo conteo, misma suma de control).
3. **Test de reanudación**: simula un fallo a mitad (mata el proceso o inyecta una excepción) → re-ejecuta → estado final correcto.
4. Cuadre: conteos origen vs destino + cuarentena, y una suma agregada de control (p.ej. SUM de un campo numérico) origen vs destino.
5. Reporta con las cifras de cada test.

## Regla
El código feliz de un pipeline es el 20% del trabajo. Si tu entrega no menciona qué pasa con duplicados, tardíos, malformados y re-ejecuciones, la entrega está incompleta.
