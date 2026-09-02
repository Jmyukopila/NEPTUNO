---
description: Caza proactiva de bugs latentes en un área del código SIN necesitar un síntoma previo - barrido adversarial priorizado donde cada hallazgo lleva escenario de fallo concreto y, si es de alto impacto, reproducción ejecutada. Úsalo antes de un release, al heredar código desconocido, o cuando algo "huele mal" sin síntoma claro.
---

Argumentos recibidos (formato esperado: <área/módulo a barrer> [foco opcional: concurrencia, datos, errores, seguridad]): $ARGUMENTS

# Bug Hunt — encontrar los bugs antes que los usuarios

El área viene en los argumentos. Posición en el ecosistema: `/debug` necesita un síntoma; `/self-review` y `critic` revisan un diff; esta skill barre código **existente** buscando bugs que aún no han explotado. El entregable es un reporte priorizado donde cada hallazgo tiene escenario de fallo — y los graves, reproducción ejecutada.

## Fase 1 — Priorizar la superficie (nunca barras todo por igual)

Ordena las zonas del área por densidad esperada de bugs:
1. **Código cambiado recientemente**: `git log --oneline -20 -- <área>` — los bugs viven donde se acaba de tocar.
2. **Fronteras de I/O**: parsing de input externo, serialización/deserialización, llamadas a red/DB/filesystem — donde el mundo real contradice los supuestos.
3. **Manejo de errores**: caminos de fallo (casi nunca testeados), cleanup tras error, transacciones a medias.
4. **Concurrencia y estado compartido**: async, objetos mutables compartidos, orden de inicialización.
5. **Aritmética de límites**: índices, paginación, fechas, dinero, redondeos.

Si el usuario indicó un foco en los argumentos, ese foco va primero. Para localizar las zonas en áreas grandes, delega el inventario al agente `scout`.

## Fase 2 — Barrido adversarial

Recorre cada zona priorizada con la taxonomía de `/home/jasen/.claude/docs/DEBUGGING.md` §1 como checklist de ataque, apoyada en greps dirigidos (adapta al stack):
- Errores tragados: `catch`/`except` vacíos o que solo loguean y siguen; valores de retorno de error ignorados.
- Deuda confesa: `TODO|FIXME|HACK|XXX|workaround`.
- Datos: floats en dinero, `datetime.now()`/`new Date()` sin timezone en lógica de negocio, casts que matan ceros a la izquierda, comparaciones de strings con números.
- Concurrencia: llamadas async sin await, estado de módulo mutable, lazy-init sin lock.
- Inyección: SQL/shell/HTML/paths construidos por concatenación con input externo.
- No determinismo en tests: aleatoriedad sin seed, dependencia de la hora o del orden.

**Filtro innegociable**: por cada candidato, construye el escenario de fallo concreto — "con input X en estado Y, pasa Z". Si no puedes construirlo, no es un hallazgo: descártalo. Cero nitpicks de estilo.

## Fase 3 — Confirmar

- Hallazgos de severidad alta: **confirma con reproducción ejecutable** (script en el scratchpad o test mínimo que demuestra el fallo) siempre que el coste sea razonable. Un bug confirmado vale diez sospechas.
- Etiqueta cada hallazgo: **CONFIRMADO** (repro ejecutada, output observado) o **PLAUSIBLE** (escenario sólido, sin ejecutar — di por qué no se ejecutó).

## Fase 4 — Entrega (y ruta de solución)

```
## Bug hunt: <área> — <fecha>
Superficie barrida: <zonas> · Foco: <si hubo>

1. [CRÍTICO|ALTO|MEDIO] ruta:línea — defecto en una frase. [CONFIRMADO|PLAUSIBLE]
   Escenario: <input/estado concreto → resultado incorrecto>
   Repro: <ruta del script/test, si se ejecutó>

Zonas barridas sin hallazgos: <lista — también es información>
```

Los fixes NO se hacen en esta skill: cada CONFIRMADO entra a `/debug` con la repro ya hecha (la fase 1 de ese protocolo queda regalada), empezando por los críticos. Si el usuario pide arreglar, esa es la ruta.

## Reglas
- Severidad por impacto real (corrupción de datos > crash > resultado incorrecto > degradación), no por elegancia del hallazgo.
- Si un hallazgo es explotable como vulnerabilidad, márcalo además como **SEGURIDAD** y sugiérele al usuario `/security-review` para el barrido completo de ese ángulo.
- Para áreas grandes, paraleliza: 2–4 agentes `critic` (uno por módulo, cada uno con esta checklist y la instrucción de reportar solo hallazgos con escenario); tú integras, deduplicas y ejecutas las repros de confirmación.
- Reporta también lo que NO encontraste: las zonas barridas limpias delimitan dónde confiar.
