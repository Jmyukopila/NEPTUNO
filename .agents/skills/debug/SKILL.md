---
name: debug
description: Protocolo riguroso de resolución de bugs - reproducción primero, hipótesis falsables, bisección del espacio de búsqueda, fix mínimo sobre la causa raíz y test de regresión. Úsalo ante cualquier bug no trivial, comportamiento inexplicable o "funciona en mi máquina".
argument-hint: <bug: síntoma observado y cómo reproducirlo si se sabe>
---

# Depuración sistemática

Resuelve el bug descrito en los argumentos (o el más reciente de la conversación). El entregable es: causa raíz demostrada + fix mínimo + test de regresión + verificación. Un fix sin causa raíz entendida es un parche, no una solución.

## Fase 1 — Reproducir (obligatoria, antes de leer código)

1. Extrae del reporte: comportamiento esperado, comportamiento observado, condiciones (input, entorno, frecuencia). Si falta algo crítico, pregunta UNA vez con preguntas concretas; no adivines.
2. Construye la reproducción mínima ejecutable: un comando, script en el scratchpad, o test que falla. Ejecútala y **observa el fallo con tus propios ojos**.
3. Si no reproduce: ese es ahora el problema. Varía sistemáticamente (versión, datos, orden, concurrencia, timezone/locale, estado previo). Reporta qué variaste. No pases a la fase 2 con un bug no reproducido salvo que el usuario lo acepte explícitamente.
4. Congela la reproducción: guárdala como script/test que podrás re-ejecutar tras cada hipótesis y tras el fix.

## Fase 2 — Localizar por bisección de hipótesis

Nunca leas código "a ver si veo algo". Trabaja por hipótesis falsables:

1. **Delimita el espacio**: ¿el dato ya llega mal o se corrompe aquí? ¿falla en la capa de entrada, lógica o salida? Corta el sistema por la mitad con una observación (log puntual, debugger, print del estado intermedio, `git bisect` si regresó con un cambio).
2. **Formula la hipótesis en una frase falsable**: "X devuelve Y cuando el input es Z". Diseña la observación más barata que la mate o la confirme. Ejecútala.
3. **Registra cada hipótesis descartada** (una línea: hipótesis → evidencia que la mató). Esto evita ciclos y es oro para el reporte.
4. Sospechosos habituales por orden de rentabilidad: el último cambio (`git log` de los archivos implicados), fronteras de tipos/encoding/null, estado compartido y orden de inicialización, condiciones off-by-one, async/await perdidos, cachés y config de entorno. La taxonomía completa indexada por síntoma está en `docs/DEBUGGING.md` §1 — empieza por la fila de tu síntoma.
5. **Debugging diferencial**: si existe un caso que funciona y otro que falla, diffea sistemáticamente lo que los separa (input, entorno, config, versión, camino de código) y elimina diferencias hasta aislar la culpable — suele ser más barato que razonar desde cero.
6. **Heisenbugs** (el fallo se esconde al observarlo → casi siempre timing/concurrencia): instrumenta con mínima perturbación (timestamps/contadores volcados al final, no prints síncronos) y reproduce estadísticamente: corre la repro N veces y mide frecuencia — "7/100 antes → 0/500 después" es evidencia; "no lo he vuelto a ver" no lo es.
7. Si tras 3 hipótesis muertas no hay progreso, para y cambia de estrategia: `git bisect run` con la repro congelada como script (encuentra el commit culpable solo, en log₂(n) pasos), instrumentación más agresiva (arsenal completo en `docs/DEBUGGING.md` §2), o el MCP `sequential-thinking` para replantear el modelo del sistema. No insistas en la misma línea.

## Fase 3 — Causa raíz, no síntoma

Antes de tocar código, responde por escrito:

- **Causa raíz**: el mecanismo exacto, con la evidencia que lo demuestra (no "probablemente").
- **Por qué ahora**: qué cambió o qué condición lo dispara.
- **Radio de explosión**: `grep` por el patrón/símbolo defectuoso — ¿existe el mismo bug en otros sitios? Repórtalos aunque el fix pedido sea uno.

Si el "fix" que tienes en mente no explica el 100% del comportamiento observado, la causa raíz es otra. Vuelve a la fase 2.

## Fase 4 — Fix y verificación

1. **Test primero**: escribe el test de regresión que falla por la causa raíz. Ejecútalo y confirma que falla por la razón correcta.
2. **Fix mínimo** sobre la causa raíz. Sin refactors oportunistas ni robustez especulativa.
3. Ejecuta: el test nuevo (pasa), la reproducción de la fase 1 (ya no falla), y los tests existentes del área tocada (no rompiste nada).
4. Para cambios no triviales, cierra con `/verify-work`.

## Reporte final

```
## Bug: <una frase>
- Causa raíz: <mecanismo> (evidencia: <comando → output>)
- Fix: <archivo:línea, qué cambió y por qué eso lo resuelve>
- Verificado: <repro antes → falla; repro después → pasa; tests del área → pasan>
- Hipótesis descartadas: <lista de una línea cada una>
- Riesgos residuales / mismo patrón en otros sitios: <o "ninguno detectado">
```

## Reglas

- Prohibido "arreglar" nada que no hayas visto fallar. Prohibido declarar resuelto lo que no hayas visto pasar.
- Un cambio de hipótesis a la vez: si tocas dos cosas y el bug desaparece, no sabes cuál fue.
- Instrumenta con un prefijo único greppable (p. ej. `DBG-<bug>:`) y deshaz toda la instrumentación antes de entregar — un grep por el prefijo confirma que no queda nada.
- Si el bug es de datos y no de código, dilo: el fix puede ser una migración/limpieza, no un parche en el código.
- Para bugs que requieren búsqueda amplia por el repo, delega la localización al agente `scout`; para una segunda opinión sobre la causa raíz, usa el agente `debugger`. Para cazar bugs latentes SIN síntoma previo (pre-release, código heredado), la skill es `/bug-hunt`.
