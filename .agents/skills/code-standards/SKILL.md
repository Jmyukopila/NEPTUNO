---
name: code-standards
description: Aplica y audita buenas prácticas de código concretas y verificables (nombres, tamaño de unidades, manejo de errores, dependencias, capas, tests) contra las convenciones REALES del repo, no contra un ideal genérico. Úsalo antes de un commit importante, al incorporar código heredado o cuando el usuario pida "aplicar buenas prácticas".
argument-hint: <archivo, carpeta o "diff actual">
---

# Code Standards — buenas prácticas medibles, no opiniones

El objetivo viene en los argumentos (por defecto: el diff actual). Entregas una lista corta de **cambios concretos ya aplicados o propuestos con su línea**, nunca un ensayo sobre calidad.

## Regla cero: el repo manda sobre el manual

Antes de proponer nada, deriva el estándar real:

1. `graphify query "convenciones y patrones de <área>"` si hay grafo; si no, lee 2–3 archivos vecinos del mismo tipo.
2. Lee el linter/formatter existente (`.eslintrc*`, `ruff.toml`, `.editorconfig`, `pyproject.toml`, `checkstyle.xml`). **Si el repo ya tiene una regla, esa gana.** Nunca impongas tu preferencia sobre una configuración explícita.
3. Si el repo NO tiene regla para algo, usa el default de este documento y decláralo como decisión nueva.

Una "mejora" que rompe la homogeneidad del repo es un empeoramiento.

## Los 8 controles (en orden de impacto)

1. **Nombres que dicen la verdad.** `getUser()` que además escribe en caché miente. Renombra o divide. Prohibido: `data`, `info`, `handle`, `process`, `manager`, `utils` como nombre único de una unidad con responsabilidad concreta.
2. **Una unidad, una razón de cambio.** Si no puedes describir qué hace una función sin decir "y", divídela. Umbral operativo, no dogma: >50 líneas o >3 niveles de anidación es señal de revisión, no falta automática.
3. **Errores: fallar temprano y con contexto.** Nunca `catch` vacío, nunca `except: pass`, nunca tragar el error para devolver `null`. Todo error propagado incluye QUÉ se intentaba y CON QUÉ entrada. Un `catch` que solo re-lanza sin añadir contexto es ruido: quítalo.
4. **Fronteras validadas.** Todo dato que entra del exterior (HTTP, archivo, env, stdin, DB ajena) se valida en la frontera, una vez, y a partir de ahí el tipo ya garantiza la forma. Validar en cada uso es duplicación; no validar es un bug de seguridad.
5. **Sin estado global mutable escondido.** Singletons con estado, variables de módulo mutables y caches implícitas: hazlos explícitos como parámetro o dependencia inyectada, o justifícalos en un comentario.
6. **Dependencias: dirección única.** El dominio no importa infraestructura. Detecta ciclos de import; si hay uno, es un defecto, no un estilo.
7. **Comentarios solo para lo que el código no puede decir.** Borra los que narran (`// incrementamos i`). Conserva y añade los que explican POR QUÉ (una restricción externa, un bug de una librería, una decisión de negocio contraintuitiva).
8. **Números y strings mágicos.** Un literal que aparece 2+ veces o cuyo significado no es evidente en el sitio se nombra como constante. Un literal usado una vez y obvio (`0`, `1`, `""`) se deja.

## Lo que NO es una falta

No conviertas esto en un refactor. Reporta pero **no cambies** salvo que el usuario lo pida:
- Código que ya funciona, no se toca en este diff y no tiene bug.
- Estilo que difiere del tuyo pero es consistente en el repo.
- Falta de abstracción con un solo caso de uso: **duplicar dos veces es correcto**; abstraer en el primer duplicado es sobre-ingeniería.
- Cobertura de tests baja en código que no tocas.

## Proceso

1. Delimita el alcance (diff, archivo o carpeta). Si es amplio, delega el inventario al agente `scout`.
2. Recorre los 8 controles sobre ese alcance. Anota `archivo:línea` + control violado + arreglo concreto.
3. Ordena por impacto real: primero lo que puede causar un bug (3, 4, 5, 6), después legibilidad (1, 2, 7, 8).
4. Aplica los arreglos de bajo riesgo. Los que cambian comportamiento o la firma pública **no** se aplican sin decirlo: propónlos y espera.
5. Ejecuta lint y tests. Si no hay tests en lo que tocaste, dilo explícitamente en el informe.

## Formato de entrega

```
## Aplicado
- `src/api/user.ts:34` — [4 fronteras] Payload sin validar → añadido esquema en el handler.

## Propuesto (cambia comportamiento — no aplicado)
- `src/db/pool.ts:12` — [5 estado global] Pool como módulo mutable → inyectar. Riesgo: toca 6 llamadas.

## Verificación
- `npm run lint`: <output real>
- `npm test`: <output real, o "sin tests para esta área">
```

## Reglas

- Ninguna entrada del informe sin `archivo:línea`. Una crítica sin ubicación no es accionable.
- Si tras el barrido no hay nada que valga la pena, dilo en una línea. Inventar hallazgos para justificar la pasada es el peor resultado posible.
- No cambies formato/estilo en líneas que no tocas por otro motivo: ensucia el diff y esconde los cambios reales.
