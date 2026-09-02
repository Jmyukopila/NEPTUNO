---
name: self-review
description: Autocrítica estructurada del diff actual antes de entregar - busca bugs, casos borde olvidados, duplicación y desviaciones del pedido original. Úsalo antes de dar por terminada una tarea o de hacer commit.
argument-hint: [alcance del diff (opcional)]
---

# Self-review — revisión adversarial del propio trabajo

Revisa el diff actual (working tree, o lo que indiquen los argumentos) como si fuera de otra persona y tu trabajo fuera encontrarle problemas. El sesgo por defecto del autor es la benevolencia: compénsalo siendo hostil.

## Checklist de ataque

Recorre el diff completo (`git diff` o los archivos editados en la sesión) contra cada punto:

1. **Fidelidad al pedido** — Relee la petición ORIGINAL del usuario, palabra por palabra. ¿El diff resuelve eso, o una versión conveniente de eso? ¿Falta alguna parte del pedido?
2. **Bugs de lógica** — Por cada condicional nuevo: ¿qué pasa con el caso contrario? Por cada bucle: ¿vacío, un elemento, el último? Por cada índice/slice: ¿off-by-one? Por cada operación async: ¿orden y errores?
3. **Casos borde de datos** — null/undefined/None, string vacío, 0, negativo, unicode, muy largo, duplicados.
4. **Errores silenciados** — ¿algún catch/except que traga errores? ¿algún valor de retorno de error ignorado?
5. **Consistencia** — ¿actualicé TODOS los puntos de uso (imports, tests, docs, config, tipos)? Grep por el símbolo viejo si renombré algo.
6. **Duplicación** — ¿escribí algo que ya existía en el repo? Grep por 2-3 términos clave de cada helper nuevo.
7. **Simplificación** — ¿hay código del diff que puede borrarse sin perder funcionalidad? ¿abstracciones para un solo caso de uso?
8. **Seguridad** (si aplica) — inputs sin validar que llegan a SQL/shell/HTML/paths; secretos hardcodeados; permisos.

## Entrega

```
## Self-review
- Hallazgos corregidos: <lista con archivo:línea, o "ninguno">
- Hallazgos NO corregidos (decisión consciente): <lista con motivo, o "ninguno">
- Confianza: <alta|media|baja> — <por qué en una frase>
```

Corrige los hallazgos claros directamente antes de reportar. Los dudosos, repórtalos sin corregir.

## Regla de oro
Si al recorrer el checklist no encontraste NADA en un diff de más de 50 líneas, sospecha de tu revisión, no de tu código: vuelve a pasar los puntos 1, 2 y 5 con más atención.
