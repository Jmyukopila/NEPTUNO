# Flujos de trabajo — recetas end-to-end

Cómo combinar los comandos y agentes del ecosistema según el tipo de trabajo. Cada flujo está calibrado para que un modelo no-Fable produzca resultado de nivel Fable.

## Flujo 1 — Feature nueva (mediana/grande)

```
/context-prime                  ← si es la primera sesión en el repo
/deep-plan <descripción>        ← plan con archivos y verificaciones
   (revisar/ajustar el plan)
/fable-mode implementa el plan  ← ejecución bajo protocolo estricto
/verify-work                    ← veredicto end-to-end con evidencia
/self-review                    ← caza de bugs antes de entregar
```

Variante con subagentes (feature divisible): `/deep-plan` → `/parallel-split` → `/verify-work` sobre el conjunto.

## Flujo 2 — Bugfix

```
/debug <bug>        ← protocolo completo: repro → hipótesis falsables → causa raíz → fix + test → verificación
/bug-hunt <área>    ← caza proactiva SIN síntoma previo (pre-release, código heredado); cada CONFIRMADO entra a /debug con la repro ya hecha
```

Para bugs difíciles o cuando el fix directo no funcionó: lanzar el agente `debugger` (Opus, contexto propio) con el síntoma y la repro; usar el MCP `sequential-thinking` para razonar hipótesis sistemáticamente. Para localización amplia previa, agente `scout`. La taxonomía de sospechosos por síntoma y el arsenal de técnicas (bisección, debugging diferencial, heisenbugs) están en `docs/DEBUGGING.md`.

## Flujo 3 — Refactor

```
1. /context-prime del área si no se conoce.
2. Verificar red de seguridad: ¿hay tests del área? Si no, escribirlos ANTES (capturan el comportamiento actual).
3. /deep-plan del refactor (pasos pequeños, build verde entre pasos).
4. Ejecutar paso a paso; tests tras cada paso.
5. Agente critic sobre el diff final (los refactors rompen usos colaterales: es su especialidad).
```

## Flujo 4 — Revisión de código ajeno

```
Agente critic con el diff/PR como encargo → triage de hallazgos → /verify-work de los BLOQUEA.
```

## Flujo 5 — Sesión larga / multi-día

```
Inicio:    leer HANDOFF.md si existe → /context-prime de lo que falte.
Durante:   decisiones y hechos costosos → NOTES.md al momento (no confiar en el contexto).
Al ~70% de contexto: /optimize-tokens → considerar /compact.
Final:     /handoff
```

## Flujo 6 — Tarea con prompt vago del usuario

```
/optimize-prompt <el pedido>  → confirmar el prompt optimizado con el usuario → ejecutar el flujo que corresponda.
```

## Flujo 7 — Feature full stack

```
/api-contract <feature>            ← contrato cerrado ANTES de código
/db-migration <cambios de schema>  ← si toca tablas existentes
/full-stack-feature <feature>      ← ejecución por capas con verificación
   (o /parallel-split con agentes backend + frontend, contrato ya fijado)
/verify-work                       ← integración UI→API→DB→UI
```

Doctrina por capa: `docs/FULLSTACK.md`.

## Flujo 8 — Trabajo con datos

```
Dataset nuevo:        /eda → /data-quality → decidir con evidencia
Pipeline:             /data-pipeline (diseño+build+test de idempotencia)
Modelo predictivo:    /eda → /ml-experiment (baseline y split primero)
Query lenta:          /sql-optimize (EXPLAIN antes, medir después)
Pregunta de negocio:  agente data-scientist con la pregunta exacta
```

Doctrina completa: `docs/DATA.md`.

## Matriz de decisión rápida

| Situación | Herramienta |
|---|---|
| "¿Dónde está X en el código?" | agente `scout` |
| "¿Cómo debería estructurar X?" | agente `architect` o `/deep-plan` |
| "Implementa esto" (plan claro) | agente `implementer` o directo |
| "Implementa esto" (difícil/crítico) | `/fable-mode` |
| "¿Funciona de verdad?" | `/verify-work` o agente `verifier` |
| "¿Está listo para entregar?" | `/self-review` + agente `critic` |
| Sesión pesada de contexto | `/optimize-tokens` |
| Fin de sesión con trabajo abierto | `/handoff` |

## Hooks opcionales (automatización del harness)

Para automatizar disciplina sin depender de que el modelo se acuerde, se pueden añadir hooks a `.claude/settings.json`. Ejemplo — recordatorio de verificación al parar:

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "test -n \"$(git -C \"$CLAUDE_PROJECT_DIR\" status --porcelain 2>/dev/null)\" && echo 'Hay cambios sin commitear: ¿se ejecutó /verify-work y /self-review?'"
          }
        ]
      }
    ]
  }
}
```

Añadir hooks solo cuando un olvido recurrente lo justifique: cada hook mete ruido en cada parada.
