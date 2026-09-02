---
name: hivemind
description: Reparte una tarea entre las CLIs agénticas externas (opencode, antigravity/agy, devin) según en qué destaca cada una, redacta el encargo autocontenido, despacha sin quemar contexto y verifica el resultado antes de aceptarlo. Úsalo para trabajo grande, paralelizable, de volumen, o que necesite un sandbox real.
argument-hint: <tarea a repartir>
---

# Hivemind — tú decides y verificas; ellos ejecutan

La tarea viene en los argumentos. Eres la corteza: entiendes, decides quién ejecuta, encargas y
**verificas**. Doctrina completa, fichas de cada agente y estado de verificación: `docs/HIVEMIND.md`.

## Paso 0 — ¿esto se delega?

Antes de repartir nada, descarta. **No se delega**:

- El **criterio**: arquitectura, trade-offs, decidir el enfoque. Eso es tuyo (`architect`).
- La **verificación** de que algo funciona. Quien encarga no subcontrata la comprobación.
- Nada que necesite **navegador o pantalla**: ninguna CLI de la flota tiene Computer Use. Eso lo
  haces tú con el MCP `chrome-devtools`.
- Tareas de **menos de ~5 minutos**: el arranque en frío de un agente externo cuesta más.

Si tras este filtro no queda nada, dilo y hazlo tú. Delegar por delegar es más lento y más caro.

## Paso 1 — estado de la flota

```bash
node tools/hivemind.js doctor
```

Solo enrutas a quien salga **LISTO**. Si el destinatario natural está SIN LOGIN, di el comando de
login que hace falta y enruta al siguiente mejor, o hazlo tú — **nunca** despaches a ciegas
esperando que funcione.

## Paso 2 — enrutado por forma de tarea

| Forma | A quién | Por qué |
|---|---|---|
| Barrido amplio, inventario, "¿dónde está X?" en repo desconocido | **antigravity** | Contexto grande, rápido y barato en Flash |
| Volumen: N archivos, misma transformación mecánica | **antigravity** | Lo caro es el tamaño, no el razonamiento |
| Extraer datos estructurados de mucho texto | **antigravity** `--json-schema` | Salida validable por esquema |
| Refactor multi-archivo con el plan ya cerrado | **opencode** | Ya tiene la doctrina NEPTUNO y sus 14 agentes |
| Tarea larga y autónoma que debe dejar los tests en verde | **devin** | Itera solo hasta cerrar |
| Toca red, instala dependencias o puede romper la máquina | **devin** `--sandbox` | Único aislamiento de proceso real (bwrap+seccomp) |

Ante la duda entre dos, elige **el más barato que puede hacerlo** y sube solo si falla.

## Paso 3 — redactar el encargo

El agente externo **arranca en frío**: no ve tu conversación, tu plan ni tu contexto. Lo que no
esté en el encargo, no existe. Escríbelo con estas seis secciones, siempre:

```
OBJETIVO          una frase verificable
CONTEXTO          rutas concretas, versiones, patrón del repo a imitar. Nada de "ya sabes"
ALCANCE           qué archivos puede tocar — y explícitamente cuáles NO
CRITERIO DE SALIDA  un COMANDO EJECUTABLE y su salida esperada — nunca una descripción en prosa
FORMATO           qué devuelve: diff, informe, JSON con esquema
AUTONOMÍA         si puede usar sus propios subagentes y cuáles
```

El criterio de salida en prosa es la causa nº 1 de encargo fallido: un agente que *puede* responder
por inferencia lo hará, y acertará solo a veces. Medido en esta flota: el mismo encargo en prosa dio
una respuesta incorrecta que el agente reportó como éxito; reescrito como «ejecuta este comando y
reporta su salida», acertó en un tercio del tiempo. **Si no puedes escribir el criterio como un
comando, el encargo no está listo para delegarse.**

Sobre **AUTONOMÍA**: los tres tienen subagentes propios (opencode los 14 de NEPTUNO en
`.opencode/agent/`; antigravity vía `--agent`; devin sus agentes tipados `review` y `summarizer`).
Autorízalos explícitamente cuando la tarea sea divisible — se cohíben si no se lo dices — y prohíbelos
cuando la tarea sea pequeña y quieras un resultado determinista.

Encargos largos van a archivo, no a la línea de comandos:

```bash
node tools/hivemind.js run <agente> --prompt-file /tmp/encargo.md --timeout 900
```

## Paso 4 — despachar sin quemar contexto

```bash
node tools/hivemind.js run antigravity "<encargo>" --timeout 600
node tools/hivemind.js run devin --prompt-file encargo.md --yolo --timeout 1800
node tools/hivemind.js run opencode "<encargo>" --model anthropic/claude-sonnet-5
```

**Todo encargo que toque archivos o terminal va con `--yolo`.** Un agente headless no puede pedirte
permiso: sin `--yolo` auto-deniega, no hace nada y **sale con código 0**. El despachador lo detecta y
lo marca `HIVEMIND_STATUS=permisos`, pero el encargo lo tienes que repetir tú. Y como `--yolo`
auto-aprueba todo, es justo el encargo que necesita el ALCANCE más estrecho; si toca red o instala
dependencias, va a Devin con sandbox.

Lee siempre `HIVEMIND_STATUS`: `ok` · `permisos` · `sin-salida` · `timeout` · `error`. Solo `ok`
significa que hubo trabajo — y aun así lo verificas.

### Dos transportes: disparo o conversación

`run` es un disparo sin estado: cada encargo arranca en frío. **`session` abre una sesión con turnos**
en la que el agente recuerda lo anterior. **Los tres la soportan**, por dos protocolos distintos que
el comando unifica (ACP en devin y opencode, stream-json propio en antigravity):

```bash
node tools/hivemind.js session <agente> "<mensaje>" --turno "<seguimiento>" --turno "<otro>"
node tools/hivemind.js session capabilities antigravity   # qué herramientas tiene de verdad
```

Usa `session` cuando el trabajo sea iterativo de verdad: revisar y pedir corrección sobre lo mismo,
encadenar preguntas sobre un análisis caro, o cuando quieras que las lecturas y escrituras del agente
pasen por tu cliente. Para todo lo demás, `run` con un contrato bien escrito es más simple.

`--safe` **no es un sandbox**: solo gobierna lo que responde tu cliente cuando el agente pide permiso,
y opencode ejecuta sus herramientas sin pedirlo nunca. Para aislamiento real, `devin --sandbox`.

**Comprueba las capacidades antes de descartar a un agente.** `capabilities` lista lo que publica de
verdad: antigravity trae 57 herramientas con control de navegador completo y 4 de subagentes, así que
una tarea de navegador sí se le puede delegar — al más barato de los tres.

El log completo va a `.hivemind/runs/`; el comando solo devuelve la cola y `HIVEMIND_LOG=<ruta>`.
**No leas el log entero**: si necesitas detalle, `grep`/`sed -n` sobre el tramo que importa. Volcar
5.000 líneas al contexto anula la razón de haber delegado.

Para tareas grandes o varias en paralelo, despacha desde el agente `delegate` (Sonnet), que se come
el output en su propio contexto y te devuelve solo el veredicto.

## Paso 5 — verificar (no es opcional)

Un agente que reporta éxito **no es evidencia de éxito**. Antes de aceptar nada:

1. `git diff` — lee el cambio de verdad. ¿Tocó archivos fuera del ALCANCE? Revierte esa parte.
2. Ejecuta el CRITERIO DE SALIDA tú mismo y pega el output real.
3. Pásale `code-standards` o el agente `critic` si el diff es grande.

## Paso 6 — intervenir (el paso que la gente se salta)

**Lo normal no es aceptar ni rechazar: es coger el trabajo y acabarlo.** Un agente externo entrega
entre el 60% y el 90% de lo que hace falta, porque no tiene tu contexto. Ese resto es tuyo, y es
donde está la diferencia entre un resultado y un entregable.

| Salida | Cuándo |
|---|---|
| **Intervenir** ← lo habitual | la estructura está bien, fallan detalles: caso borde, convención del repo, test flojo, nombre malo |
| Aceptar tal cual | pasa el criterio y no hay nada que corregir. Sospechoso si pasa a menudo |
| Reencargar | el encargo estaba mal escrito **y** el trabajo es inservible |
| Descartar y hacerlo tú | el enfoque está mal de raíz, no los detalles |

**Reencargar suele ser el peor negocio**: arranca en frío, tira el 80% aprovechable y repite el fallo.
Si te descubres reencargando, casi siempre lo que querías era intervenir.

Qué revisar, porque los defectos del trabajo delegado son predecibles:

1. **Convenciones del repo ignoradas** — el defecto nº 1, y ningún test lo detecta.
2. **APIs plausibles que no existen**, o firmas de otra versión de la instalada.
3. **Tests que pasan sin probar nada** — rompe una línea a mano y mira si se enteran.
4. **Alcance desbordado** — revierte lo que no tocaba antes de mirar el resto.
5. **Casos borde ausentes** — el camino feliz va; el vacío, el nulo y el error de red, no.
6. **Prosa de modelo** en docs y commits → pásale `write-natural`.

Cómo intervenir sin estropearlo: lee entero antes de editar; conserva lo que funciona; arregla la
causa en los 6 sitios y no solo en el que viste; **vuelve a ejecutar el criterio después de tocar**; y
**di qué corregiste tú encima** — sin eso, delegar se vuelve opaco.

## Paralelizar

Reparte solo trozos **que no se pisen los mismos archivos**. Despacha en paralelo, y quédate con la
integración y la verificación — que es donde está el trabajo difícil: las fronteras entre trozos, las
decisiones que afectan a dos, la coherencia del conjunto. Nadie más va a hacer eso. Si dos trozos tocan el mismo
archivo, no son paralelos: son un conflicto de merge con pasos extra.

## Reglas

- Reporta siempre **quién hizo qué**. El usuario tiene derecho a saber que el diff lo escribió Gemini
  Flash y no tú.
- Nunca presentes como verificado algo que solo verificó el agente externo.
- Si un despacho falla por autenticación, entorno o timeout, dilo con el comando exacto que lo
  arregla. No lo escondas detrás de "hubo un problema".
