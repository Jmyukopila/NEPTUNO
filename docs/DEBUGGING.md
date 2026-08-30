# DEBUGGING.md — Arsenal de depuración

Base de conocimiento compartida por `/debug`, `/bug-hunt` y el agente `debugger`. Dos mitades: la taxonomía (dónde suelen vivir los bugs, indexada por síntoma) y las técnicas (cómo acorralarlos, en orden de coste).

## 1. Taxonomía de sospechosos por síntoma

Empieza por la fila que describe tu síntoma: reduce el espacio de búsqueda al 20% más probable antes del primer experimento.

| Síntoma | Sospechosos, en orden de frecuencia |
|---|---|
| **"Falla a veces"** (intermitente) | Race conditions y async sin await; orden de inicialización o de tests; caché con estado stale; estado mutable compartido (el mismo objeto/lista referenciado desde dos sitios); dependencia de la hora del reloj; agotamiento de recursos (pool de conexiones, file handles). |
| **"Funciona en mi máquina"** | Diferencia de entorno: versión de dependencia/runtime, variable de entorno ausente, locale/timezone, separadores de path (`\` vs `/`), line endings (CRLF/LF), case-sensitivity del filesystem, permisos, datos locales que no existen allá. |
| **"Falla solo con ciertos datos"** | Fronteras de datos: null/vacío/0/negativo; unicode y encoding (acentos, emoji, BOM); longitud exactamente en el límite; duplicados; precisión de floats (nunca dinero en float); ceros a la izquierda muertos en un cast a int; fechas límite (medianoche, fin de mes, 29-feb, cambio DST, epoch/1970). |
| **"Falla solo en producción"** | Volumen (N+1 que en dev son 3 queries y en prod 30.000; timeouts; memoria); concurrencia real (dos requests a la vez sobre el mismo recurso); config/infra distinta (proxy, TLS, réplicas de DB con lag); datos reales sucios que violan supuestos del código. |
| **"Empezó a fallar sin tocar nada"** | Siempre cambió ALGO: dependencia actualizada (lockfile, imagen base); certificado/token/clave expirado; servicio externo que cambió su contrato o límites; dato nuevo que pisa un supuesto; disco/cuota llenos; cambio de hora (DST) o de año. `git log` + logs de infra del día que empezó. |
| **"Resultados corridos / uno de más o de menos"** | Off-by-one: límites inclusivos vs exclusivos, índices 0/1, `<` vs `<=`, slices, paginación (offset), redondeo vs truncado, semana que empieza en lunes vs domingo. |
| **"El error aparece lejos de la causa"** | Corrupción silenciosa aguas arriba: valor inválido aceptado sin validar que explota 5 capas después; excepción tragada por un catch genérico que deja estado a medias; conversión implícita de tipos. Rastrea el DATO hacia atrás, no el stack hacia delante. |
| **"Mi fix no cambió nada"** | Estás ejecutando otro código: build stale, caché (bundler, `__pycache__`, CDN), otra copia instalada (`pip install` vs editable, `node_modules` duplicado), proceso viejo sin reiniciar, rama/entorno equivocado. Verifica con un cambio imposible de ignorar (un print `XXXX` en la primera línea) antes de seguir "arreglando". |

## 2. Técnicas, en orden de coste

1. **Leer el error completo.** El stack entero, no la primera línea; el `caused by` anidado; el código de salida real. La mitad de los bugs "difíciles" están escritos en la parte del error que nadie leyó.
2. **Repro mínima congelada.** Reducir hasta que quitar cualquier cosa haga desaparecer el fallo; guardarla como script/test re-ejecutable. Todo lo demás se mide contra ella.
3. **Bisección espacial.** Cortar el sistema por la mitad con una observación (¿el dato ya llega mal aquí?) y quedarte con la mitad culpable. Repetir. Tres cortes reducen el espacio 8×.
4. **Bisección temporal — `git bisect run`.** Si es una regresión: `git bisect start; git bisect bad; git bisect good <última-buena>; git bisect run <script-repro>` — el script sale 0 si pasa y 1 si falla, y git encuentra el commit culpable solo, en log₂(n) pasos. Es la técnica con mejor ratio resultado/esfuerzo cuando aplica.
5. **Debugging diferencial.** Si existe un caso que funciona y otro que falla: diffea TODO lo que los separa (input byte a byte, entorno con `env | sort` en ambos, config, versión, camino de código con un log en la bifurcación) y ve eliminando diferencias hasta que quede la culpable. Más barato que razonar desde cero.
6. **Instrumentación disciplinada.** Logs con un prefijo único greppable (p. ej. `DBG-<bug>:`) que registran valor Y tipo en las fronteras entre capas. Al final, `grep DBG-` confirma que retiraste todo. Nunca instrumentes dos hipótesis a la vez.
7. **Snapshot y diff de estado.** Volcar el estado intermedio completo a un archivo en el caso bueno y en el malo, y diffearlos. Encuentra corrupciones que un log puntual no muestra.
8. **Heisenbugs** (el bug se esconde al observarlo → casi siempre timing/concurrencia): instrumentación de mínima perturbación (timestamps y contadores en memoria volcados al final, no prints síncronos que serializan la ejecución) y **reproducción estadística**: corre la repro N veces y mide la frecuencia — "fallaba 7/100, tras el fix 0/500" es evidencia; "no lo he vuelto a ver" no lo es.
9. **Replantear el modelo.** Tras 3 hipótesis muertas, el error suele estar en tu modelo del sistema, no en la zona que miras: explica el bug en voz alta pieza por pieza (o con el MCP `sequential-thinking`), cuestionando cada "esto seguro que funciona".

## 3. Disciplina de evidencia

- **Una variable por experimento.** Si tocas dos cosas y el bug desaparece, no sabes cuál fue: no has aprendido nada re-utilizable.
- **Registra las hipótesis muertas** (hipótesis → evidencia que la mató, una línea). Evita ciclos y convierte la sesión en conocimiento.
- **La causa debe explicar el 100% del síntoma**: frecuencia, condiciones exactas, mensaje literal. Un candidato que explica el 80% es la causa equivocada (o una de dos causas).
- Etiqueta todo hallazgo: **verificado** (lo ejecuté y lo vi) / **inferido** (se deduce del código) / **asumido** (no comprobado).

## 4. Anti-patrones (si te sorprendes haciéndolos, para)

- **Shotgun debugging**: cambiar cosas "a ver si suena la flauta". Cada cambio sin hipótesis contamina el estado y destruye evidencia.
- **Curar el síntoma**: el `try/catch` que traga, el retry, el `sleep` que "arregla" una race — la esconden y la agravan. El sleep es el más traicionero: convierte un fallo determinista en uno intermitente en producción.
- **Declarar resuelto sin re-ejecutar la repro original.** El test nuevo puede pasar por razones equivocadas; la repro de la fase 1 es el juez.
- **Dejar instrumentación puesta** o tests debilitados "temporalmente". Grep por el prefijo antes de entregar.
- **Depurar sobre supuestos de memoria** ("esa función devuelve X") — léela. El supuesto no verificado es donde el bug se esconde precisamente porque nadie mira ahí.
