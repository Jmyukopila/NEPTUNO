# AUTOMATION.md — Automatizaciones del ecosistema

Tres mecanismos, del más barato al más caro. Regla de oro: **automatiza con el mecanismo más tonto que funcione** — un hook (script, 0 tokens) antes que un loop del modelo (tokens en cada tick), y un loop antes que una sesión programada nueva (contexto frío).

## 1. Hooks — automatización a coste cero de tokens

Scripts que el harness ejecuta solo en eventos concretos (`settings.json` → `"hooks"`). No consumen contexto ni razonamiento: son la capa refleja del ecosistema. Los instalados (scripts en `~/github/Jmyukopila/NEPTUNO/tools/hooks/`):

| Hook | Evento | Qué hace |
|---|---|---|
| `protect-secrets.js` | PreToolUse (Edit\|Write) | Bloquea escrituras sobre `.env*`, keystores/`.jks`/`.pem`, `id_rsa`, `credentials.*`, `.npmrc`… El modelo recibe el motivo del bloqueo. |
| `handoff-reminder.js` | SessionStart | Si el proyecto tiene `HANDOFF.md`, inyecta el recordatorio de leerlo (§0 de CLAUDE.md) — el protocolo deja de depender de la memoria del modelo. |
| `andromeda-context.js` | SessionStart | Busca el proyecto actual en la bóveda `~/ANDROMEDA\01-Proyectos\` (por `ruta:` del frontmatter o por nombre, subiendo hasta 2 directorios) e inyecta el cuerpo de su nota (tope 2.500 chars) — mapa inicial del proyecto sin explorar en frío. El ciclo lo cierra `/handoff`, que actualiza la nota al terminar la sesión: la bóveda se mantiene viva sola. |

Anatomía (para añadir los tuyos): el hook recibe el evento como JSON por stdin; en PreToolUse, `exit 2` bloquea y el stderr le llega al modelo; en SessionStart, el stdout se añade al contexto. Usa Node para que funcione igual en PowerShell y Git Bash. Ideas que compensan: formatear al guardar (PostToolUse + prettier si el proyecto lo tiene), bloquear `git push --force` a main (PreToolUse sobre Bash), notificación de sistema al terminar (Stop).

Criterio: instala un hook cuando un olvido sea **recurrente y mecánico**. Un hook ruidoso (que salta en falsos positivos) es peor que ninguno.

## 2. Loops — vigilancia dentro de la sesión

`/loop [intervalo] <tarea o skill>` repite una tarea con el contexto de la sesión vivo. Sin intervalo, el modelo se auto-regula (más barato: espacia los ticks según lo que vigila).

Usos que compensan:
- **Babysitting de CI/PRs**: `/loop /pr-merge 42` → espera checks, mergea cuando esté verde.
- **Vigilar un build largo o un pipeline**: tick cada N min, avisa al terminar o al fallar.
- **Stack en review**: `/loop 30m /pr-stack status` durante una mañana de reviews.

Reglas de economía: cada tick debe ser **barato y filtrado** (`--json -q`, logs solo de fallos); si el tick no tiene nada que hacer, no debe tocar nada; y el loop se para cuando la condición se cumple, no se deja zombi.

## 3. Schedules — sesiones programadas (cron)

`/schedule` crea agentes cloud recurrentes que corren sin tu terminal abierta. Para trabajo periódico independiente de la sesión: triage matinal de issues nuevos, informe semanal de PRs abiertos, chequeo de dependencias. Cada run arranca con contexto frío → el prompt del schedule debe ser autocontenido (como un encargo a subagente). Un `HANDOFF.md` o archivo de estado que el schedule lee/escribe le da memoria entre runs.

## 4. Headless — Claude como comando de tus scripts

`claude -p "<prompt>"` ejecuta un prompt sin sesión interactiva; componible con cualquier cadena (CI, tareas de Windows, git hooks clásicos):

```powershell
git diff --staged | claude -p "Escribe el mensaje de commit para este diff, solo el mensaje"
claude -p "/apk-build" ; claude -p "/android-run verifica que arranca sin crash"
```

Con `--output-format json` el resultado es parseable. Es la pieza que convierte cualquier skill del ecosistema en un paso de pipeline.

## 5. Matriz de decisión

| Necesidad | Mecanismo |
|---|---|
| Guardarraíl o reflejo mecánico (bloquear, recordar, formatear) | Hook |
| Esperar/vigilar algo DENTRO del trabajo en curso | `/loop` (o `--watch`/background del propio comando, más barato aún) |
| Tarea periódica sin sesión abierta | `/schedule` |
| Claude como paso de un script/CI existente | `claude -p` headless |
| Trabajo paralelo puntual con contexto propio | Subagentes (`/parallel-split`, ver ECONOMIA-TOKENS.md) |

Anti-patrones: un loop para lo que haría un hook (paga tokens por reflejos); un schedule para lo que solo importa en sesión; polling agresivo (tick de 1 min para un CI de 10); automatizar sin condición de parada.
