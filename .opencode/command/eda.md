---
description: Análisis exploratorio de datos (EDA) riguroso sobre un dataset - perfil, calidad, distribuciones, relaciones y hallazgos con evidencia. Úsalo al recibir datos nuevos o antes de modelar/construir pipelines sobre ellos.
---

Argumentos recibidos (formato esperado: <ruta del archivo o tabla del dataset>): $ARGUMENTS

# EDA — análisis exploratorio con rigor

El dataset viene en los argumentos (ruta a archivo, tabla SQL, o descripción de dónde está). El entregable: un script/notebook reproducible + un reporte de hallazgos donde CADA afirmación lleva su número.

## Proceso

1. **Carga defensiva**:
   - Inspecciona el archivo crudo ANTES de parsearlo (primeras líneas, encoding, separador, tamaño). Un `read_csv` a ciegas produce datos silenciosamente corruptos.
   - Carga con tipos explícitos donde importe (IDs como string —los ceros a la izquierda mueren como int—, fechas parseadas con formato declarado).
   - Reporta: filas × columnas, memoria, y si hubo filas descartadas/malformadas.

2. **Perfil por columna** (tabla, no prosa):
   - Tipo real vs tipo esperado, % nulos, cardinalidad, top-5 valores con frecuencia.
   - Numéricas: min/p25/mediana/p75/max, media, % ceros, % negativos.
   - Fechas: rango, huecos, timezone, ¿futuras? ¿1970/1900 (epoch-basura)?
   - Texto: longitudes, espacios colgantes, mayúsculas inconsistentes, valores-centinela ("N/A", "-", "unknown", "999").

3. **Integridad**:
   - ¿Qué identifica una fila? Verifica la unicidad de la clave candidata (el "ID único" duplicado es el hallazgo más común del EDA).
   - Duplicados exactos y casi-duplicados.
   - Relaciones entre tablas si hay varias: claves huérfanas, cardinalidades reales vs asumidas.

4. **Distribuciones y relaciones**:
   - Distribución de las variables clave (asimetría, outliers CON criterio explícito, multimodalidad).
   - Correlaciones/asociaciones entre las variables que importan para la pregunta de negocio, no la matriz completa por decorar.
   - Serie temporal si hay fechas: tendencia, estacionalidad, huecos, y cambios de régimen (¿cambió la definición del dato a mitad de historia?).

5. **Reporte** en este formato:

```
## EDA: <dataset>
- Forma: <filas × cols, período cubierto, grano real de una fila>
- Hallazgos críticos (afectan cualquier uso de estos datos):
  1. <hallazgo> — evidencia: <número/tabla exacta>
- Calidad: <resumen de nulos/duplicados/inconsistencias con cifras>
- Sorpresas: <lo que contradice lo que se asumía del dato>
- Preguntas abiertas: <lo que solo el dueño del dato puede responder>
- Reproducir: <ruta del script + cómo ejecutarlo>
```

## Reglas
- Cada afirmación con su cifra: "hay muchos nulos" está prohibido; "34% de nulos en `email` (12.403/36.480)" es lo aceptable.
- Distingue "el dato es raro" (posible error de captura) de "el dato es incómodo" (real pero inesperado) — no limpies lo segundo.
- NO imputes, elimines outliers ni "limpies" nada en esta fase: el EDA describe; las decisiones de limpieza se toman después y quedan documentadas.
- Gráficos solo si revelan algo que la tabla no muestra (distribución multimodal, cambio de régimen). Si generas gráficos, lee primero la skill `dataviz` si está disponible.
