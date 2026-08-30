# Guía de prompting — patrones que suben el rendimiento de cualquier modelo

Patrones probados para sacar rendimiento de nivel superior de Haiku/Sonnet/Opus. El comando `/optimize-prompt` los aplica automáticamente; esta guía es para escribir buenos prompts a mano.

## Los 7 componentes de un prompt de alto rendimiento

1. **Objetivo verificable** — "Haz X de modo que Y sea comprobable". Malo: "mejora el login". Bueno: "el login debe rechazar contraseñas <8 chars y mostrar el error del backend; verifica con `npm test -- auth`".
2. **Contexto suficiente** — Todo lo que el modelo no puede adivinar: stack y versiones, restricciones del negocio, qué se intentó ya y falló.
3. **Restricciones explícitas** — Qué NO hacer pesa tanto como qué hacer: "no toques la API pública", "sin dependencias nuevas", "máximo 50 líneas".
4. **Proceso** (para tareas complejas) — Pedir el razonamiento ANTES de la respuesta multiplica la calidad en modelos pequeños: "primero lista los casos borde, luego implementa".
5. **Formato de salida** — Estructura exacta: schema JSON, formato de tabla, plantilla de reporte. Con ejemplo relleno si es inusual.
6. **Criterio de éxito** — Cómo se sabrá que está bien: comando que debe pasar, comportamiento observable.
7. **Ejemplos (few-shot)** — 1–3 pares entrada→salida para clasificación, extracción o formatos raros. El ejemplo enseña más que tres párrafos de descripción.

## Patrones por tipo de tarea

### Implementación
```
Implementa <qué> en <archivos>.
Contexto: <stack, convención relevante>.
Restricciones: <qué no tocar, límites>.
Al terminar: ejecuta <comando de verificación> y reporta el output real.
Si algo del plan choca con el código existente, adapta y decláralo.
```

### Debugging
```
Bug: <síntoma exacto, mensaje de error literal, cómo reproducir>.
Esperado: <comportamiento correcto>.
Ya descartado: <hipótesis probadas>.
Proceso: reproduce primero, forma hipótesis, verifica cada una contra el código
ANTES de proponer el fix. No arregles el síntoma: encuentra la causa raíz.
```

### Análisis / revisión
```
Analiza <qué> buscando <criterios concretos>.
Por cada hallazgo: ruta:línea + evidencia + escenario de fallo concreto.
Si no hay hallazgos verificables, dilo — no inventes problemas.
```

### Extracción / clasificación (donde brilla el few-shot)
```
Clasifica cada <item> como <categorías>.
Ejemplos:
- "<input 1>" → <output 1>
- "<input 2>" → <output 2>
Output: JSON con schema {"item": str, "categoria": str, "confianza": "alta|media|baja"}.
Si un item no encaja en ninguna categoría, usa "otra" — no fuerces.
```

## Técnicas anti-fallo

| Fallo típico | Antídoto en el prompt |
|---|---|
| Alucinación de APIs | "Verifica cada firma en el código antes de usarla; no cites nada de memoria" |
| Declarar éxito sin probar | "Reporta el output real del comando de verificación; 'debería funcionar' no es aceptable" |
| Respuesta a medias en tareas largas | Dividir en pasos numerados con entregable por paso |
| Inventar datos que no están en el contexto | "Si no está en el contexto, responde 'no disponible'" |
| Perder instrucciones en prompts largos | Datos arriba, instrucciones abajo; lo crítico repetido al final |
| Formato inconsistente | Schema exacto + un ejemplo relleno |
| Sobre-ingeniería | "Solución mínima que resuelve el problema completo; sin abstracciones especulativas" |

## Ajustes por modelo

- **Haiku**: prompts más explícitos y con proceso paso a paso; few-shot casi siempre ayuda; pide verificación tras CADA paso, no al final.
- **Sonnet**: el mejor equilibrio; el punto clave es exigir verificación end-to-end explícita en el prompt.
- **Opus**: puedes dar objetivos más abiertos; el punto clave es acotar (límites de alcance y longitud) para evitar sobre-elaboración.

## Estructura con XML para prompts mixtos

Cuando el prompt mezcla datos + instrucciones + ejemplos, sepáralos:

```
<contexto>...</contexto>
<datos>...</datos>
<instrucciones>...</instrucciones>
```

El modelo distingue así qué es material de trabajo y qué son órdenes — crítico cuando los datos contienen texto que parece una instrucción.
