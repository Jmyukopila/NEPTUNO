---
description: Protocolo riguroso para experimentos de machine learning - baseline primero, splits sin fuga de datos, métrica alineada al negocio y reproducibilidad. Úsalo para entrenar, evaluar o comparar modelos.
---

Argumentos recibidos (formato esperado: <experimento: qué predecir y con qué datos>): $ARGUMENTS

# ML Experiment — ciencia, no alquimia

El experimento viene en los argumentos. El orden del protocolo es innegociable: los pasos 1–3 se cierran ANTES de entrenar nada. El enemigo a batir es el data leakage: produce métricas espectaculares en desarrollo y modelos inútiles en producción.

## 1. Definición

- **Pregunta**: qué predice el modelo, para qué decisión de negocio, y qué información habrá disponible EN EL MOMENTO de la predicción (todo lo que no exista en ese momento es fuga).
- **Métrica primaria**: UNA, elegida por el coste real de los errores (¿duele más un falso positivo o un falso negativo?). Accuracy con clases desbalanceadas está prohibido como métrica primaria.
- **Criterio de éxito**: el umbral que haría que el modelo se use ("mejor que el baseline en X" / "recall ≥ Y con precisión ≥ Z").

## 2. Split ANTES de mirar

- Aparta el test set ANTES de cualquier análisis/feature engineering y no lo toques hasta la evaluación final (una sola vez).
- Datos temporales → split temporal SIEMPRE (entrenar en pasado, evaluar en futuro). Un split aleatorio en series temporales es fuga estructural.
- Entidades repetidas (mismo usuario/paciente en varias filas) → split por grupo, no por fila.
- Validación para iterar: k-fold o validación temporal sobre el train, nunca sobre el test.

## 3. Baseline primero

Antes de cualquier modelo: (a) baseline trivial (clase mayoritaria / media / persistencia "mañana = hoy"), (b) baseline simple (regresión logística/lineal con las features obvias). Todo modelo posterior se justifica SOLO por su mejora sobre estos. Un XGBoost que gana al azar pero no a la regresión logística es complejidad sin valor.

## 4. Features sin fuga

Por cada feature, la pregunta fiscal: **¿este valor existía, con este contenido, en el momento de la predicción?**
- Agregados calculados sobre TODO el dataset (medias, encodings de target) → calcularlos solo con train, dentro del pipeline/fold.
- Preprocesado (scaler, imputador, encoder) → fit SOLO en train, transform en val/test. En sklearn: `Pipeline`, y el fit dentro de cada fold del CV.
- Features sospechosamente buenas → investigar antes de celebrar (suelen ser el target disfrazado: "fecha_de_cancelación" prediciendo churn).

## 5. Entrenamiento y comparación

- Semillas fijadas; versiones de datos y librerías anotadas; cada run registrado (parámetros → métricas) aunque sea en un CSV.
- Cambia UNA cosa por experimento; si cambias tres, no sabes cuál actuó.
- Compara con la misma partición y la misma métrica; diferencias pequeñas → repite con varias semillas antes de declarar ganador.

## 6. Evaluación final y entrega

- Test set: una vez, al final. Reporta la métrica primaria + las secundarias.
- **Análisis de errores obligatorio**: mira 20-30 errores concretos del modelo — ¿hay un patrón? ¿un segmento donde falla sistemáticamente (por fecha, región, clase)? Esto vale más que una décima de métrica.
- Reporte: pregunta → datos y split (con el porqué) → baseline vs modelos (tabla) → métrica final en test → análisis de errores → limitaciones honestas → cómo reproducir (script + seed + versiones).

## Señales de alarma (si aparecen, para y busca la fuga)
- Métrica de validación "demasiado buena" (>0.95 AUC en un problema humano difícil).
- Val >> test, o test >> producción.
- Una feature domina el 90% de la importancia.
