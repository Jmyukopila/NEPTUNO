---
name: parallel-split
description: Descompone una tarea grande en subtareas independientes y las ejecuta con subagentes en paralelo, integrando y verificando los resultados. Úsalo para tareas grandes y divisibles cuando el usuario pida paralelizar.
argument-hint: <tarea grande a dividir en subagentes>
---

# Parallel Split — divide, delega, integra

La tarea viene en los argumentos. Ejecútala descomponiéndola en subagentes paralelos SOLO si la división real existe; si las partes dependen entre sí en cadena, dilo y ejecuta secuencialmente tú mismo.

## Proceso

1. **Descompón** — Divide en 2–4 subtareas con estas propiedades:
   - Independientes: ninguna necesita el output de otra.
   - Sin solapamiento de archivos: dos agentes editando el mismo archivo = conflicto garantizado. Si dos subtareas tocan el mismo archivo, fusiónalas.
   - Autocontenidas: descriptibles sin referencia a las otras.

2. **Asigna el agente adecuado a cada una**:
   - Búsqueda/lectura/inventario → `scout` (haiku, barato)
   - Diseño/decisión → `architect` (opus)
   - Implementación con plan claro → `implementer` (sonnet)
   - Verificación → `verifier` (sonnet)

3. **Redacta cada prompt de subagente** como un encargo completo (el subagente empieza EN FRÍO, sin esta conversación):
   - Contexto: qué proyecto es, qué se está haciendo globalmente.
   - Encargo exacto con archivos concretos y criterio de éxito verificable.
   - Restricciones: qué archivos NO tocar, convenciones a seguir.
   - Formato del reporte que debe devolver.

4. **Lanza** todos los Agent en una sola respuesta (paralelo real). Usa `run_in_background: false` solo si necesitas el resultado para continuar.

5. **Integra** — Al recibir los resultados: léelos críticamente (los subagentes exageran su éxito), resuelve fricciones entre las partes, y ejecuta una verificación de conjunto (build + tests del total, no de cada parte por separado).

6. **Reporta** al usuario: qué hizo cada subagente, resultado de la verificación integrada, y qué quedó pendiente.

## Regla
El coste de coordinar debe ser menor que el beneficio: para tareas de <15 minutos de trabajo directo, hazla tú sin subagentes.
