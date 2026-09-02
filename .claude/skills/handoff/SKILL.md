---
name: handoff
description: Genera una nota de traspaso con el estado exacto del trabajo para continuar en otra sesión (o tras /clear) sin perder contexto. Úsalo al final de sesiones largas o antes de limpiar el contexto.
---

# Handoff — traspaso de sesión sin pérdida

Escribe el estado del trabajo actual en `HANDOFF.md` en la raíz del workspace (sobrescribe el anterior si existe). La próxima sesión debe poder continuar leyendo SOLO ese archivo.

## Contenido obligatorio

```
# Handoff — <fecha> <hora>

## Objetivo en curso
<qué se está construyendo/arreglando y para qué, 2-3 frases>

## Estado
- HECHO: <lista de lo completado Y VERIFICADO>
- HECHO SIN VERIFICAR: <completado pero no probado, si hay>
- EN CURSO: <qué está a medias y exactamente en qué punto>
- PENDIENTE: <siguientes pasos en orden>

## Decisiones tomadas (y por qué)
<decisiones de diseño que la próxima sesión NO debe re-litigar, con su motivo en una línea>

## Hechos aprendidos con esfuerzo
<cosas no obvias descubiertas: APIs con comportamiento raro, gotchas del entorno,
comandos exactos que funcionan, causas raíz diagnosticadas>

## Archivos calientes
<rutas de los archivos centrales del trabajo, con una nota de qué hay en cada uno>

## Cómo verificar
<comando(s) exacto(s) para comprobar que el estado actual funciona>
```

## Sincronizar la bóveda ANDROMEDA (si existe `~/ANDROMEDA`)

Tras escribir `HANDOFF.md`, actualiza la nota del proyecto en `~/ANDROMEDA\01-Proyectos\<proyecto>.md` (créala con `Plantillas\Proyecto.md` si no existe, con `ruta:` apuntando a la raíz real del proyecto). Es lo que el hook `andromeda-context` inyectará en la próxima sesión de cualquier terminal, así que debe ser un **mapa denso, no un diario**:

- Frontmatter: `ultima_modificacion:` a hoy; `estado:` si cambió (activo/pausado/archivado).
- Cuerpo: descripción de una línea, stack y comandos clave (build/test/run), y una sección `## Estado` de 3-6 líneas con lo esencial del handoff (en curso + siguiente paso + gotcha principal). Máximo ~40 líneas totales: el hook trunca a 2.500 caracteres.
- El detalle fino vive en `HANDOFF.md`; la nota es el resumen estable. No dupliques el handoff entero.

## Refrescar el grafo de conocimiento (si existe `graphify-out/`)

Último paso del cierre, después de HANDOFF.md y de la nota ANDROMEDA. `graphify update` re-extrae por AST solo lo nuevo o cambiado: **no llama al LLM, coste cero, segundos**.

```powershell
graphify update <raíz del proyecto>
```

Así el código y el grafo terminan la sesión sincronizados, y la siguiente arranca consultando un grafo que refleja el estado real.

**Cuidado con lo que `update` NO hace** — dilo en vez de fingir que el grafo está al día:

- **`update` es AST puro: no lee markdown semánticamente.** En un corpus de solo documentación (la bóveda `~/ANDROMEDA`, o `docs/` de un repo) es literalmente un no-op: imprime `No code-graph topology changes detected` y no toca nada. Si la sesión añadió o reescribió **docs o notas**, el grafo se queda viejo hasta una pasada semántica: `graphify extract <ruta> --backend claude-cli --max-concurrency 2` (usa la suscripción, sin gasto nuevo — ver `docs/GRAPHIFY.md`).
- **Si `graphify` avisa de que el grafo encogería**, es la guarda anti-corrupción. Tras un refactor que borró código de verdad, `--force`; en cualquier otro caso, investiga antes de forzar.

`graphify check-update <ruta>` responde si hay re-extracción semántica pendiente, sin hacerla.

Al reportar el cierre, distingue: "grafo de código actualizado" (hiciste `update`) no es lo mismo que "grafo actualizado" (hiciste `extract`).

## Reglas

- Datos concretos, no vaguedades: "falta el caso de token expirado en `auth/session.ts:142`" y no "falta pulir auth".
- Incluye los callejones sin salida ya explorados para que nadie los repita.
- Convierte referencias relativas ("lo de ayer", "el bug de antes") en absolutas (fechas, rutas, mensajes de error literales).
- Tras escribirlo, confirma al usuario en una línea dónde quedó y qué contiene (y si la nota ANDROMEDA y el grafo quedaron sincronizados).
