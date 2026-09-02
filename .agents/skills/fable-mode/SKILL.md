---
name: fable-mode
description: Activa el protocolo estricto de máximo rendimiento (planificación profunda, verificación de supuestos, autocrítica y verificación end-to-end) para la tarea que sigue. Úsalo cuando el usuario invoque /fable-mode o pida máxima calidad en una tarea difícil.
argument-hint: <tarea a ejecutar con protocolo estricto>
---

# Fable Mode — protocolo estricto

La tarea viene en los argumentos (si no, pregunta cuál es). Ejecútala bajo este protocolo SIN saltarte fases. Anuncia brevemente cada fase al entrar en ella.

## Fase 0 — Contrato
Reformula la tarea en 1–2 frases: qué se pide, qué cuenta como éxito verificable, qué queda fuera de alcance. Si algo ambiguo cambia el resultado, pregunta AHORA (única pregunta permitida; después trabajas autónomo).

## Fase 1 — Reconocimiento
Antes de opinar o planificar, mira el terreno real:
- Localiza los archivos implicados (Grep/Glob, o delega al agente `scout` si la búsqueda es amplia).
- Lee las secciones relevantes. Lista los **supuestos** que estás haciendo y verifica contra el código cada uno que sea barato de verificar (firmas de funciones, nombres de campos, versiones de librerías).
- Si el problema es de razonamiento complejo (algoritmos, concurrencia, diseño), usa el MCP `sequential-thinking` para razonar paso a paso antes de decidir.

## Fase 2 — Plan
Escribe el plan: pasos numerados, archivos que toca cada paso, y cómo se verificará cada paso. Riesgo principal del plan y plan B en una línea. Para cambios de arquitectura, considera delegar el diseño al agente `architect`.

## Fase 3 — Ejecución
- Un paso del plan a la vez. Tras cada edición sustancial, comprueba algo (compila, test, ejecución puntual) antes de seguir.
- Si la realidad contradice el plan, detente, ajusta el plan y dilo — no fuerces el plan muerto.
- Herramientas independientes en paralelo; nunca serialices llamadas que no dependen entre sí.

## Fase 4 — Verificación adversarial
- Ejecuta la verificación end-to-end del cambio completo (tests + ejercitar el flujo real, no solo typecheck).
- Ataca tu propio trabajo: ¿qué input lo rompe? ¿qué caso borde no cubrí? ¿qué archivo relacionado olvidé actualizar (tests, docs, imports, config)? Prueba al menos el caso hostil más probable.
- Si el cambio es grande, lanza el agente `critic` sobre el diff y corrige lo que confirme.

## Fase 5 — Entrega
Reporta: (1) qué se hizo, (2) evidencia de verificación (comandos ejecutados y su resultado real), (3) qué quedó explícitamente sin verificar o fuera de alcance, si hay algo. Sin adornos: honestidad total sobre el estado.

## Prohibiciones en este modo
- Declarar éxito sin output de verificación observado.
- Inventar firmas de API sin haberlas leído.
- "Debería funcionar", "en principio", "probablemente" en el reporte final.
- Dejar TODOs silenciosos: todo lo incompleto se declara.
