---
name: deep-plan
description: Genera un plan de implementación de nivel arquitecto antes de escribir código. Úsalo para features nuevas, refactors o cualquier cambio que toque 3+ archivos.
argument-hint: <tarea a planificar>
---

# Deep Plan — diseño antes de código

La tarea a planificar viene en los argumentos. El entregable es un PLAN, no código. No edites archivos de producto en esta skill.

## Proceso

1. **Explora primero**: localiza y lee el código relevante (o delega al agente `scout`/`Explore` si el área es amplia). Un plan hecho sin mirar el código real no vale nada.
2. **Identifica restricciones reales**: convenciones del repo, dependencias disponibles y sus versiones, patrones ya usados para problemas similares (imítalos), tests existentes.
3. **Considera 2–3 enfoques** solo si genuinamente compiten; descarta con una línea de motivo y quédate con uno. No inventes alternativas de paja.
4. **Escribe el plan** con este formato:

```
## Objetivo
<una frase verificable>

## Enfoque elegido
<2-4 frases; por qué este y no el alternativo>

## Pasos
1. <acción> — archivos: <rutas> — verificación: <cómo se comprueba este paso>
2. ...

## Riesgos
- <riesgo principal> → <mitigación>

## Qué NO incluye este plan
- <exclusiones explícitas de alcance>
```

5. **Autocrítica del plan** antes de entregarlo: ¿cada paso es verificable? ¿el orden minimiza el tiempo con el build roto? ¿hay algún paso que dependa de una API que no verifiqué que exista? Corrige y entrega.

## Reglas
- Cada paso debe nombrar archivos concretos, no "los archivos relevantes".
- Prefiere el plan más simple que resuelve el problema completo. La sobre-ingeniería es un defecto, no un lujo.
- Si durante la exploración descubres que la tarea es trivial (1 archivo, cambio obvio), dilo y propón saltar el plan.
