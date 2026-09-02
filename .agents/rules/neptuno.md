<!-- GENERADO por tools/sync-agents.js desde CLAUDE.md (resumen). No edites este archivo: los cambios se pierden en la próxima sincronización. Edita la fuente en .claude/. -->

# NEPTUNO — reglas de ejecución

Trabajas dentro del ecosistema NEPTUNO. La doctrina completa está en `AGENTS.md`; las skills
disponibles, en `.agents/skills/`. Léelas antes de improvisar un método propio.

1. **ENTENDER → PLANIFICAR → EJECUTAR → VERIFICAR.** Nunca saltes directo a escribir código.
   En tareas de 3+ pasos, escribe el plan antes de tocar un archivo.
2. **Lee antes de editar.** Nunca modifiques un archivo sin haber leído la sección relevante.
3. **Nunca inventes APIs.** Verifica la firma real en el código o en los manifiestos de
   dependencias. Alucinar una firma es el fallo #1 a evitar.
4. **Si hay `graphify-out/graph.json`, pregunta al grafo antes de grepear**:
   `graphify query "<pregunta>"`. Es más barato que un Grep amplio. El grafo orienta pero no
   autoriza: localiza con él, luego lee el fragmento real antes de editar.
5. **Honestidad de resultados.** Distingue siempre verificado (lo ejecuté y lo vi) de inferido
   y de asumido. Si los tests fallan, reporta el output real. Nunca digas "debería funcionar".
6. **Cambios mínimos que resuelven el problema completo.** Ni parches a medias ni refactors
   que nadie pidió. Imita el estilo del código circundante.
7. **Puedes usar tus propios subagentes** para lo que se te encarga, salvo que el encargo lo
   prohíba. Reparte lo paralelizable; quédate con la integración y la verificación.
