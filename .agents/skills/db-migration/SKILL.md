---
name: db-migration
description: Diseña y ejecuta cambios de esquema de base de datos de forma segura (compatibilidad hacia atrás, patrón expand-contract, plan de rollback). Úsalo para cualquier ALTER/CREATE/DROP sobre tablas con datos o en producción.
argument-hint: <cambio de esquema a realizar>
---

# DB Migration — cambios de esquema sin romper nada

El cambio de esquema viene en los argumentos. Regla cero: una migración sobre datos reales es de las pocas operaciones difíciles de deshacer que ejecutarás — se diseña con paranoia proporcional.

## Proceso

1. **Reconocimiento**:
   - Esquema actual REAL de las tablas afectadas (léelo de las migraciones existentes o de la DB, no de memoria).
   - ¿Quién lee/escribe estas columnas? Grep por la tabla/columna en el código: cada uso es un punto de rotura.
   - ¿Cuántas filas tiene la tabla? (cambia la estrategia: un `ALTER` que bloquea una tabla de 100M de filas es un incidente).
   - Herramienta de migraciones del repo (Prisma, Alembic, Flyway, Rails, SQL a mano) — usa la del repo.

2. **Clasifica el cambio**:
   - **Seguro** (aditivo): añadir tabla, añadir columna nullable/con default*, añadir índice (CONCURRENTLY en Postgres). → migración directa.
   - **Peligroso** (destructivo/incompatible): renombrar, cambiar tipo, NOT NULL sobre columna existente, borrar columna/tabla. → patrón **expand-contract** obligatorio:
     1. *Expand*: añade lo nuevo sin tocar lo viejo (nueva columna/tabla).
     2. *Migrate*: código escribe en ambos, backfill de datos viejos por lotes.
     3. *Switch*: código lee de lo nuevo. Verifica paridad antes.
     4. *Contract*: borra lo viejo SOLO en una migración posterior, días después, cuando nada lo usa.

3. **Escribe la migración** con:
   - `up` y `down` (si el `down` es imposible —drop de datos—, decláralo y exige backup previo).
   - Backfills por lotes (`LIMIT` + loop), nunca un UPDATE de tabla completa en una transacción.
   - Índices nuevos: CONCURRENTLY/ONLINE si el motor lo soporta.

4. **Verifica en local**: aplica → inspecciona el esquema resultante → ejecuta el `down` → re-aplica. Corre los tests que tocan esas tablas. Si hay datos de prueba, verifica que el backfill los transforma bien.

5. **Entrega**: la migración + clasificación (seguro/peligroso) + plan de despliegue (¿requiere orden código-primero o migración-primero?) + cómo revertir.

## Prohibiciones
- Migración y cambio de código incompatibles desplegados "a la vez" (nunca es a la vez: siempre hay una ventana con versión mixta — el esquema debe funcionar con el código viejo Y el nuevo).
- `DROP` de columna/tabla en la misma migración que deja de usarla.
- Cambios de tipo in-place sobre tablas grandes.

*Nota: en Postgres <11 y MySQL, añadir columna con DEFAULT reescribe la tabla — verifica la versión del motor.
