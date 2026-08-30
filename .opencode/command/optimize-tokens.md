---
description: Audita y reduce el consumo de tokens/contexto de la sesión o de un prompt. Úsalo cuando la sesión se alargue, antes de una compactación, o cuando el usuario pida ahorrar tokens o reducir costes.
---

Argumentos recibidos (formato esperado: [texto/prompt a comprimir (opcional: sin argumento audita la sesión)]): $ARGUMENTS

# Optimizador de tokens

Objetivo: máxima señal por token, tanto en lo que entra al contexto como en lo que sale.

## Si el usuario pasó un texto/prompt como argumento

Comprímelo sin perder información operativa:
1. Elimina cortesías, repeticiones, meta-comentarios y contexto que el modelo ya tiene.
2. Convierte prosa en estructura (listas, tablas) solo si acorta.
3. Sustituye ejemplos redundantes por el mejor ejemplo único.
4. Reporta: tokens aproximados antes/después (≈4 caracteres/token en inglés y ≈3.5 en español) y qué se eliminó.

## Si se invoca sin argumento (auditoría de sesión)

Analiza la conversación actual y aplica/recomienda:

1. **Diagnóstico** — Identifica los mayores consumidores del contexto actual: archivos completos leídos innecesariamente, outputs largos de comandos, búsquedas repetidas, contenido ya obsoleto.
2. **Acciones inmediatas**:
   - Escribe en `NOTES.md` (o el scratchpad) un resumen de estado con las decisiones y hechos clave establecidos, para sobrevivir a una compactación con `/compact`.
   - Recomienda `/compact` si el contexto supera ~60% y hay material muerto.
3. **Reglas hacia adelante** (recuérdatelas y aplícalas el resto de la sesión):
   - Grep/Glob para localizar; Read con `offset`/`limit` para leer solo la sección relevante.
   - Delegar búsquedas amplias al agente `scout` o `Explore`: el subagente quema su propio contexto, no el tuyo, y devuelve solo la conclusión.
   - Comandos con output largo: filtrar en origen (`| Select-Object -First 20`, `git log --oneline -10`, `--stat` en vez de diff completo).
   - No re-leer archivos ya leídos que no han cambiado.
   - Respuestas al usuario: resultado primero, sin repetir lo que él ya sabe.
4. **Reporte final**: qué encontraste, qué hiciste y el ahorro estimado, en 5 líneas o menos.

## Principios de coste (para recomendar al usuario)

- Prompt caching: mantener estable el prefijo del contexto (CLAUDE.md, system prompts) — cada cambio invalida la caché.
- Tareas mecánicas y de búsqueda → Haiku (agente `scout`); diseño → Opus solo cuando el problema lo exige; el resto → Sonnet.
- Batch de preguntas relacionadas en un solo turno en vez de una por turno.
