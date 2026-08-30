# Doctrina de Datos — análisis, ciencia e ingeniería

Reglas que los agentes `data-engineer` y `data-scientist` ya llevan incorporadas; referencia común para todo trabajo con datos en este workspace.

## Principios transversales (las 5 leyes)

1. **Mira el dato real antes de escribir código.** Muestra + conteos + nulos de la fuente. El schema imaginado siempre miente en algo.
2. **Toda afirmación con su cifra.** "Hay muchos nulos" prohibido; "34% de nulos en email (12.403/36.480)" aceptable. La cifra lleva al lado su query/código.
3. **El grano es sagrado.** Toda tabla/dataset declara qué es una fila y qué la identifica. Verificar la unicidad de la clave asumida es el check que más bugs caza (y el JOIN sin verificar cardinalidad, el que más crea).
4. **Nada se descarta en silencio.** Filas inválidas → cuarentena con motivo. Outliers → decisión documentada, no limpieza refleja ("el dato incómodo" no es "el dato erróneo").
5. **Reproducible o no existe.** Script/notebook que corre de arriba a abajo, semillas fijadas, fuente referenciada con ruta y fecha.

## Análisis (comandos: `/eda`, `/data-quality`)

- EDA describe, no limpia: las decisiones de limpieza vienen después y quedan escritas.
- Sesgo de selección primero: ¿qué población cubre este dato y cuál NO? Invalida más conclusiones que cualquier bug.
- Escepticismo de serie temporal: ¿cambió la definición del dato a mitad de historia? Los "cambios de régimen" suelen ser cambios de instrumentación, no de realidad.
- Comparar 20 cortes y reportar el más llamativo es p-hacking. Las diferencias pequeñas necesitan incertidumbre (bootstrap, varias semillas) antes de declararse reales.

## Ciencia / ML (comando: `/ml-experiment`)

- Orden innegociable: pregunta y métrica → split → baseline → features → modelos. El test set se aparta antes de explorar y se usa UNA vez.
- Anti-leakage como reflejo: split temporal para datos temporales, por grupo para entidades repetidas, todo preprocesado fit solo en train (Pipeline + fit dentro del fold).
- Métrica primaria única elegida por el coste real de los errores; accuracy con clases desbalanceadas, prohibida como primaria.
- Métrica demasiado buena = bug hasta demostrar lo contrario. Feature que domina el 90% de importancia = target disfrazado hasta demostrar lo contrario.
- Análisis de errores obligatorio: 20-30 fallos concretos del modelo enseñan más que una décima de AUC.

## Ingeniería (comandos: `/data-pipeline`, `/db-migration`, `/sql-optimize`)

- Las 4 propiedades de todo pipeline: **idempotente** (re-ejecutar = mismo estado), **validado en fronteras** (schema al entrar, cuadres al salir), **observable** (conteos por run), **reanudable** (fallo a mitad → re-ejecutar es seguro).
- Test de idempotencia obligatorio: dos ejecuciones seguidas → destino idéntico (conteo + checksum).
- Cargas incrementales: watermark explícito + estrategia para llegadas tardías.
- UTC en todo timestamp interno. IDs con posibles ceros a la izquierda = texto.
- SQL de rendimiento: EXPLAIN antes, una mejora a la vez, medir después. La intuición no cuenta como medición.

## Elección de agente/comando

| Necesidad | Herramienta |
|---|---|
| "¿Qué hay en este dataset?" | `/eda` o agente `data-scientist` |
| "¿Puedo fiarme de esta tabla?" | `/data-quality` |
| "Mueve/transforma estos datos" | `/data-pipeline` o agente `data-engineer` |
| "Predice X" | `/ml-experiment` o agente `data-scientist` |
| "Esta query tarda 30s" | `/sql-optimize` |
| "Cambia el esquema" | `/db-migration` |
| Responder una pregunta de negocio con datos | agente `data-scientist` |

## MCPs útiles para datos

- **Neon MCP** (si está conectado): `run_sql`, `explain_sql_statement`, `list_slow_queries`, branching de DB para probar migraciones sin riesgo.
- **sequential-thinking**: para razonar diseños de pipeline o diagnósticos de leakage complejos paso a paso.
- Opcionales a añadir en `.mcp.json` según el stack: servidor MCP de Postgres/SQLite propio del proyecto.
