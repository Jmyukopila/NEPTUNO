# OPENCODE.md — Compatibilidad con opencode

NEPTUNO nació para Claude Code, pero todo su contenido (skills, agentes, MCPs, hooks) se genera también en formato opencode, para que el mismo ecosistema funcione con `opencode` como runtime alternativo (y con cualquier proveedor/modelo que opencode soporte, no solo Anthropic). La fuente de verdad sigue siendo `.claude/` — `tools/sync-opencode.js` traduce, nunca al revés.

## 1. El mapa mental

```
.claude/skills/<n>/SKILL.md  ──sync-opencode.js──▶  .opencode/command/<n>.md
.claude/agents/<n>.md        ──sync-opencode.js──▶  .opencode/agent/<n>.md
.mcp.json (mcpServers)       ──sync-opencode.js──▶  opencode.json (mcp)
tools/hooks/*.js (Claude)    ──puerto a mano──▶     tools/plugins/*.js (opencode)
                                                     └─copiados tal cual──▶ .opencode/plugin/
CLAUDE.md                    ──sin traducir: opencode ya lo lee nativo (§5)
```

`node tools\sync-opencode.js` regenera `.opencode/command/`, `.opencode/agent/`, `.opencode/plugin/` y fusiona `mcp` en `opencode.json`, en el proyecto Y en `~/.config/opencode/` (mismo patrón que `tools/sync-global.js` con `~/.claude/`). Re-ejecutar siempre que cambie algo en `.claude/skills/`, `.claude/agents/`, `.mcp.json` o `tools/plugins/`.

**Convención de carpetas verificada empíricamente** (no solo por doc): opencode busca agentes/comandos/plugins en `.opencode/agent/`, `.opencode/command/`, `.opencode/plugin/` — **singular**, igual que las claves `agent`/`command`/`plugin`/`mcp` de `opencode.json`. Se confirmó creando un agente de prueba en un directorio temporal y comprobando con `opencode agent list`.

## 2. Skills → comandos

Frontmatter Claude Code (`name`, `description`, `argument-hint`) se traduce a frontmatter opencode (`description` solamente — el nombre del comando es el nombre de archivo). Si la skill tenía `argument-hint`, se inserta una línea `Argumentos recibidos (formato esperado: <hint>): $ARGUMENTS` al inicio del cuerpo — Claude Code añade los argumentos automáticamente a la invocación, opencode exige el placeholder `$ARGUMENTS` explícito en la plantilla o los argumentos no llegan al prompt.

## 3. Agentes → agentes

| Campo Claude Code | Campo opencode | Nota |
|---|---|---|
| `name` (frontmatter + nombre de archivo) | nombre de archivo | se descarta el campo, el nombre de archivo ya es el id |
| `description` | `description` | igual |
| — | `mode: subagent` | los 14 agentes NEPTUNO son subagentes (invocados por Task/Agent), nunca chat primario |
| `model: haiku\|sonnet\|opus` | `model: provider/model-id` | ver tabla de modelos abajo |
| `tools: A, B, C` (ausente = todas) | `permission: {edit, bash, task}` | ver heurística abajo |

### Modelos multi-proveedor: `--provider`

`sync-opencode.js` acepta `--provider=anthropic|google|openai` (por defecto `anthropic`) y con eso fija el `model:` de los 14 agentes a la tabla de ese proveedor:

| Nivel | `anthropic` (verificado con `opencode models anthropic`) | `google` (verificado con llamada real) | `openai` (IDs reales del catálogo, sin probar en ejecución) |
|---|---|---|---|
| `haiku` (rápido/barato — scout) | `anthropic/claude-haiku-4-5-20251001` | `google/gemini-3-flash-preview` | `openai/gpt-4.1-mini` |
| `sonnet` (equilibrado — la mayoría) | `anthropic/claude-sonnet-5` | `google/gemini-2.5-pro` | `openai/gpt-4.1` |
| `opus` (razonamiento profundo — architect/critic/debugger) | `anthropic/claude-opus-4-8` | `google/gemini-3.1-pro-preview` | `openai/o3` |
| `fable` (sin uso actual en NEPTUNO) | `anthropic/claude-fable-5` | `google/gemini-3.1-pro-preview` | `openai/gpt-4.1` |

**Por qué existe esto (no es capricho, es un hallazgo con evidencia)**: un agente `mode: subagent` con `model:` fijado GANA sobre el `--model` de la sesión de opencode — probado creando un agente de prueba con `model: anthropic/claude-haiku-4-5-20251001` y delegándole una tarea desde una sesión corriendo en `google/gemini-3-flash-preview`: en los logs (`--print-logs --log-level DEBUG`) el subagente intentó igual `providerID=anthropic modelID=claude-haiku-4-5-20251001` y falló con el mismo error de crédito — el `--model` de fuera no se propaga al subagente pinneado. Peor aún: el agente primario absorbió el fallo y devolvió una respuesta genérica ("ok.") sin exponer el error — un fallo silencioso a tener en cuenta si algún día un proveedor falla a mitad de sesión. Conclusión práctica: para que TODA la flota de agentes use otro proveedor hace falta regenerar con `--provider`, no basta con pasar `--model` al invocar opencode.

**Estado actual de esta cuenta** (2026-07-13): `anthropic` está sin saldo (`Your credit balance is too low`) y `openai` devuelve `Quota exceeded` — ambos verificados con llamadas reales que fallaron. `google` sí tiene crédito y respondió correctamente. Por eso la generación activa ahora mismo (`.opencode/agent/*.md`, proyecto y global) está en `--provider=google`, verificado con una prueba real de extremo a extremo: delegar en el agente `scout` (real, con su `permission.edit: deny` real) la búsqueda de un dato concreto en `tools/plugins/andromeda-context.js` — devolvió la línea y el hook exactos, correctos. Volver a `anthropic` en cuanto haya saldo: `node tools\sync-opencode.js` (sin flag).

Si un agente no fija `model` (no aplica hoy a ninguno de los 14; posible en agentes futuros), opencode usa el modelo por defecto de la sesión.

### Heurística tools → permission

opencode controla permisos por categoría (`edit`, `bash`, `task`, `read`, `glob`, `grep`, `list`, ...), no herramienta por herramienta. La traducción solo actúa sobre las tres categorías que varían entre los agentes NEPTUNO:

- Si el agente no declara `tools:` (Claude Code = "todas las herramientas") → no se genera `permission`, acceso completo.
- Si declara `tools:` y la lista **no** incluye `Edit`/`Write`/`NotebookEdit` → `permission.edit: deny`.
- Si la lista **no** incluye `Bash` → `permission.bash: deny`.
- Si la lista **no** incluye `Agent` → `permission.task: deny` (ninguno de los 14 agentes actuales delega en subagentes, así que esto aplica siempre que hay `tools:` explícito).

Es una traducción de intención (agentes de solo-lectura siguen siendo de solo-lectura), no una réplica 1:1 de la lista de herramientas — no existe una categoría de permiso por herramienta individual (Read vs Grep vs Glob) en opencode.

### Cómo invocar un agente `mode: subagent` — nota de uso real

`opencode run --agent <nombre>` **no** funciona para agentes `mode: subagent`: opencode avisa "agent X is a subagent, not a primary agent. Falling back to default agent" y silenciosamente ejecuta con el agente `build` (permisos completos) en su lugar — si no te fijas en el aviso, parece que el agente de solo-lectura permitió escribir un archivo, pero en realidad ni se usó. Los subagentes (los 14 de NEPTUNO son todos `mode: subagent`, igual que en Claude Code) solo se activan por delegación: un agente primario (`build`, `plan`, ...) los invoca con su herramienta de tareas (equivalente al `Agent`/`Task` de Claude Code), igual que en Claude Code un subagente no se abre como sesión de chat principal.

**Verificado end-to-end** (no solo config estática) en un proyecto de prueba desechable, con `google/gemini-3-flash-preview` (el modelo `anthropic/*` de esta cuenta no tiene crédito — ver §7): se creó un agente `readonlytest` con `permission: {edit: deny, bash: deny, task: deny}` y (a) invocarlo con `--agent readonlytest` cayó al agente `build` y SÍ escribió el archivo (confirma el comportamiento de "fallback" de arriba); (b) pedirle al agente `build` que delegara la misma tarea de escritura en el subagente `readonlytest` por su herramienta de tareas → el subagente respondió que no tiene permiso de escritura, y el archivo **no se creó** (confirmado listando el directorio). La traducción `tools:` ausente → `permission.edit: deny` funciona de verdad, no solo se parsea.

## 4. MCP

`.mcp.json` usa `command` (string) + `args` (array) por servidor; el esquema de opencode (`McpLocalConfig`, ver `https://opencode.ai/config.json`) exige **un solo array `command`** con el binario y los argumentos juntos, más `environment` (no `env`). `sync-opencode.js` hace `[server.command, ...server.args]`.

**Gotcha real encontrado y corregido**: la primera versión del script generaba `command`+`args` por separado (calcando la forma de `.mcp.json`) y opencode lo ignoraba en silencio — `opencode mcp list` solo mostraba los servidores remotos, los locales no aparecían ni como error. Se detectó comparando contra el JSON Schema publicado en `https://opencode.ai/config.json`, no adivinando. Verificado tras el fix: `opencode mcp list` muestra los 3 servidores (`sequential-thinking`, `memory`, `chrome-devtools`) como `connected`.

La fusión es aditiva por nombre de servidor: el `opencode.json` global ya tenía un MCP `Neon` propio del usuario (no relacionado con NEPTUNO) — el script lo preserva, solo añade/actualiza las claves que él mismo gestiona. El servidor `memory` usa un `knowledge-graph.json` distinto en cada nivel (proyecto: `C:\NEPTUNO\.claude\knowledge-graph.json`; global: `C:\Users\Usuario\.claude\knowledge-graph.json`), igual que ya hace el MCP `memory` de Claude Code.

## 5. CLAUDE.md — sin traducir, y no hace falta

opencode busca instrucciones de proyecto/globales en `AGENTS.md`, pero si no existe cae de vuelta a `CLAUDE.md` (proyecto) y a `~/.claude/CLAUDE.md` (global) — compatibilidad nativa documentada en `opencode.ai/docs/rules/`. Por eso la doctrina de NEPTUNO no se duplica: el mismo `CLAUDE.md` que usa Claude Code ya es leído por opencode sin ningún paso adicional. (Puede desactivarse con `OPENCODE_DISABLE_CLAUDE_CODE=1`, pero no hay motivo para hacerlo aquí.)

## 6. Hooks → plugins

opencode no tiene los 4 eventos de hooks de Claude Code (PreToolUse, SessionStart, etc.); tiene ~30 hooks de plugin distintos, tipados en `@opencode-ai/plugin` (paquete que el usuario ya tenía instalado en `~/.config/opencode/node_modules/`). Mapeo real usado (confirmado leyendo `dist/index.d.ts` del paquete instalado, no por memoria):

| Hook Claude Code | Hook opencode | Confianza |
|---|---|---|
| `PreToolUse` (Edit\|Write) → exit 2 bloquea | `tool.execute.before` → `throw new Error(...)` bloquea | **Alta** — API estable, firma verificada en el paquete instalado |
| `SessionStart` → stdout se añade al contexto | `experimental.chat.system.transform` → `output.system.push(...)`, deduplicado por `sessionID` (el hook no tiene un evento "una vez por sesión" propio; se simula con un `Set` en el cierre del plugin) | **Media** — hook real y tipado en el paquete instalado (no una alucinación), pero su nombre lleva el prefijo `experimental.` y puede cambiar entre versiones de opencode |

Los 3 plugins (`tools/plugins/protect-secrets.js`, `handoff-reminder.js`, `andromeda-context.js`) están escritos a mano (no generados) porque son puertos de lógica, no una traducción mecánica de frontmatter — cada uno documenta en su cabecera de qué hook Claude Code viene y por qué se eligió su equivalente.

**Verificado empíricamente**: con `opencode debug config` dentro de `C:\NEPTUNO`, los 6 archivos de plugin (3 del proyecto + 3 de la copia global) aparecen en la clave `"plugin"` de la configuración resuelta como URLs `file://` — opencode los descubre y los carga. Efecto secundario conocido (cosmético, no roto): al trabajar dentro de NEPTUNO se cargan AMBAS copias (proyecto y global) del mismo plugin; para `protect-secrets` es inofensivo (el segundo chequeo es redundante), para los 2 de contexto significa que el recordatorio se inyectaría duplicado. No se ha corregido porque opencode no ofrece hoy una forma de excluir la copia global cuando hay una de proyecto (a diferencia de MCP/agentes, que si son iguales por nombre simplemente se pisan).

**No verificado con una sesión real de opencode** (para no gastar tokens/llamadas del usuario sin que lo pida): que el texto inyectado por `experimental.chat.system.transform` efectivamente aparezca en el contexto que ve el modelo. La firma del hook y el mecanismo de carga sí están verificados; el comportamiento en tiempo de ejecución de un hook `experimental.*` es lo único que queda como inferido. Verificación sugerida (barata): abrir `opencode` dentro de un proyecto con `HANDOFF.md`, primer turno, preguntar algo trivial y comprobar si el modelo menciona el HANDOFF sin que se le haya dicho.

## 7. Re-sincronizar y verificar

```powershell
node tools\sync-opencode.js                    # regenera con el proveedor por defecto (anthropic)
node tools\sync-opencode.js --provider=google   # o cambia toda la flota a otro proveedor (§3)
node tools\sync-global.js        # sin relación con opencode; mantiene ~/.claude/ al día

opencode agent list               # deben aparecer los 14 agentes NEPTUNO como (subagent)
opencode mcp list                 # deben aparecer sequential-thinking, memory, chrome-devtools conectados (+ los que el usuario tenga propios, ej. Neon)
opencode debug config             # config resuelta completa: agentes, comandos, mcp y plugin
```

Todos los comandos anteriores se ejecutaron en esta máquina durante la construcción de esta capa (versión `opencode 1.17.18`) con resultado correcto — no son instrucciones sin probar.

### Verificación end-to-end real (invocaciones de verdad, no solo config)

Además de lo estático de arriba, se hicieron dos pruebas de ejecución real en un proyecto desechable (`opencode run`), con resultado observado:

1. **Comando + `$ARGUMENTS`**: comando de prueba con plantilla `Responde EXACTAMENTE con el texto "recibido: $ARGUMENTS"` → `opencode run --command pingtest "hola-mundo-123"` devolvió literalmente `recibido: hola-mundo-123`. Confirma que la sustitución de argumentos que genera `sync-opencode.js` para las 49 skills funciona de verdad, no solo que el archivo se carga.
2. **Agente subagente + `permission.edit: deny`**: ver §3 ("Cómo invocar un agente `mode: subagent`") — delegación real vía la herramienta de tareas del agente `build`, el subagente denegó la escritura y el archivo no se creó.

**Nota sobre el proveedor usado para probar**: la clave de Anthropic configurada en esta cuenta (`opencode providers list` la muestra activa) devolvió `Your credit balance is too low to access the Anthropic API` al intentar `opencode run` con un modelo `anthropic/*` — es un problema de saldo/facturación de la cuenta, no de esta capa de compatibilidad (la traducción de modelos, el mapeo de alias y los mismos comandos/agentes son independientes del proveedor). Se repitió la prueba con `google/gemini-3-flash-preview` (proveedor con crédito disponible en esta cuenta) para no bloquear la verificación por eso, y funcionó igual — lo cual además confirma en la práctica que el ecosistema es utilizable con "sus agentes y modelos" más allá de Anthropic, tal como se pidió. Para volver a usar los modelos `anthropic/*` (los que fijan por defecto los 14 agentes NEPTUNO) hace falta recargar saldo en la cuenta de Anthropic — no es algo que este ecosistema pueda arreglar.
