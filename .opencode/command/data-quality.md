---
description: Audita la calidad de un dataset o tabla con checks concretos y ejecutables (completitud, unicidad, validez, consistencia, frescura) y deja los checks instalados como tests. Úsalo ante sospechas de datos malos o antes de confiar en una fuente nueva.
---

Argumentos recibidos (formato esperado: <dataset/tabla a auditar> [uso previsto]): $ARGUMENTS

# Data Quality — auditoría con checks ejecutables

El dataset/tabla viene en los argumentos. El entregable son dos cosas: (1) el reporte de estado actual con cifras, y (2) los checks escritos como código re-ejecutable (tests de dbt, Great Expectations, pandera, o asserts SQL/Python según el stack del repo) para que la auditoría no sea de un solo uso.

## Las 6 dimensiones (ejecuta checks de cada una)

1. **Completitud** — % nulos por columna crítica; filas totalmente vacías; ¿faltan períodos enteros? (conteo por día/mes: los huecos delatan cargas fallidas).
2. **Unicidad** — la clave declarada, ¿es única DE VERDAD? Duplicados exactos; casi-duplicados (misma entidad, distinta grafía).
3. **Validez** — tipos correctos; rangos (edades negativas, fechas futuras, precios en 0); formatos (emails, teléfonos, códigos postales); valores fuera del dominio permitido en categóricas; centinelas disfrazados ("N/A", "-", 999, 1900-01-01).
4. **Consistencia** — reglas entre columnas (fecha_fin ≥ fecha_inicio; total = suma de partes; estado coherente con fechas); entre tablas (claves huérfanas, agregados que no cuadran con el detalle).
5. **Frescura** — ¿cuándo llegó el último dato? ¿la fuente actualiza con la cadencia esperada? ¿hay registros "del futuro"?
6. **Volumen** — conteo actual vs histórico: caídas o picos súbitos de volumen son el síntoma nº1 de una carga rota aguas arriba.

## Formato del reporte

```
## Calidad: <dataset> — <fecha>
Veredicto: APTO | APTO CON RESERVAS | NO APTO para <el uso previsto>

| # | Dimensión | Check | Resultado | Severidad |
|---|-----------|-------|-----------|-----------|
| 1 | Unicidad  | pk única en orders | FALLA: 1.204 duplicados (0,8%) | BLOQUEA |

- Causa probable de cada FALLA (si el dato permite inferirla).
- Checks instalados en: <ruta del archivo de tests>
- Cómo re-ejecutar: <comando>
```

## Reglas
- Cada check con su cifra exacta y su query/código; nada de impresiones.
- La severidad depende del USO: 3% de nulos en `email` bloquea una campaña de mailing y es irrelevante para un forecast de ventas. Pregunta o declara el uso asumido.
- No arregles los datos en esta skill: la auditoría diagnostica. La corrección es una decisión aparte (y aguas arriba siempre que se pueda — limpiar en destino perpetúa el problema).
