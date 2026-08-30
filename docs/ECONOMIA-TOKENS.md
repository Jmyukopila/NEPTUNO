# Economía de tokens — gastar menos y rendir más

El contexto es el recurso más escaso: un contexto lleno de ruido degrada la calidad del modelo ANTES de agotarse. Estas reglas optimizan coste Y rendimiento a la vez. El comando `/optimize-tokens` las aplica sobre la sesión en curso.

## Jerarquía de coste de las operaciones

1. **Gratis**: no hacer la operación (¿ya está el dato en la conversación?).
2. **Acotado**: `graphify query "<pregunta>"` cuando el proyecto tiene `graphify-out/graph.json` — devuelve un subgrafo con presupuesto de tokens (`--budget`, 2000 por defecto) en vez de N archivos. Más barato que Grep porque no devuelve líneas de fuente: devuelve relaciones. Ver `docs/GRAPHIFY.md`.
3. **Barato**: Grep/Glob (devuelven líneas, no archivos).
4. **Medio**: Read con `offset`/`limit` de la sección exacta.
5. **Caro**: Read de archivos completos.
6. **Muy caro**: outputs de comandos sin filtrar, diffs completos de cambios grandes, exploración especulativa "por si acaso".

Regla: nunca pagues el nivel N si el N-1 responde la pregunta.

El nivel 2 no sustituye al 3-4 para editar: el grafo dice *dónde* y *cómo se relaciona*, nunca es evidencia suficiente para escribir un Edit. Su ganancia está en la fase de orientación, que es justo donde se dilapida el contexto.

## Tácticas por herramienta

- **Comandos**: filtra en origen. `git log --oneline -10` y no `git log`; `--stat` antes que el diff completo; `Select-Object -First 20` / `head -20` en outputs largos; `npm test -- --reporter=dot` si solo importa pasa/falla.
- **Subagentes como cortafuegos de contexto**: una búsqueda amplia hecha por el agente `scout` quema el contexto DEL SCOUT y te devuelve 20 líneas de conclusión. Hecha por ti, te mete 5000 líneas de dumps. Delega toda exploración de más de ~3 búsquedas. Si hay grafo, dilo en el prompt del subagente: un `scout` que grepea a ciegas gasta el contexto que graphify existe para no gastar.
- **Paralelismo**: llamadas independientes en la misma respuesta. No ahorra tokens pero ahorra turnos (y cada turno re-procesa contexto).
- **No re-leer**: un archivo ya leído y no modificado sigue en el contexto. Confía en él.

## Supervivencia a la compactación

En sesiones largas el contexto se compacta y los detalles se pierden. Defensa:
- Estado durable en archivos, no en la conversación: decisiones y hechos clave a `NOTES.md`/`HANDOFF.md` (comando `/handoff`).
- Tras un `/compact` o al notar contexto resumido: relee tu handoff antes de continuar.

## Prompt caching (para reducir coste de API)

- La caché se invalida al cambiar el PREFIJO del contexto: mantén estables CLAUDE.md y la configuración durante una sesión; no los edites entre turnos salvo necesidad.
- Sesiones con menos de 5 minutos entre turnos reutilizan caché; ráfagas de trabajo > goteo espaciado.

## Elegir el modelo por tarea (coste/rendimiento)

| Tarea | Modelo | Vía |
|---|---|---|
| Búsquedas, inventarios, greps masivos | Haiku | agente `scout` |
| Implementación con plan claro, verificación | Sonnet | agente `implementer` / `verifier` |
| Sesión de trabajo general | Sonnet | modelo principal |
| Diseño, trade-offs, revisión adversarial | Opus | agente `architect` / `critic` |

Anti-patrón: usar Opus para greps o Haiku para diseño. El modelo caro en la decisión, el barato en el volumen.

## Presupuesto de salida

- Respuestas al usuario: el resultado primero; detalle solo el que cambia lo que el lector hará después.
- Código: sin comentarios narrativos, sin bloques repetidos "antes/después" salvo que se pidan.
- Reportes de subagente: densos y con formato fijo (los agentes de este workspace ya lo imponen).
