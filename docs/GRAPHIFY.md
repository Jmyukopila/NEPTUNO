# graphify — grafo de conocimiento como capa 0 de recuperación

`graphify` convierte una carpeta (código, docs, papers, imágenes, vídeo) en un grafo de conocimiento persistente y consultable. En NEPTUNO no es "una herramienta más": ocupa el escalón que faltaba en la jerarquía de coste de `docs/ECONOMIA-TOKENS.md` — **responder sin leer**.

La ganancia no es que graphify sea barato de construir (la primera pasada cuesta una llamada de LLM por chunk). Es que, una vez construido, `graphify query "<pregunta>"` devuelve un **subgrafo acotado y con presupuesto de tokens** en vez de 40 archivos completos, y ese coste no vuelve a pagarse: `graphify update` es AST puro, sin LLM.

---

## 1. Jerarquía de coste, revisada

`docs/ECONOMIA-TOKENS.md` define 5 niveles (gratis → muy caro). graphify inserta un nivel nuevo por debajo de Grep:

| Nivel | Operación | Coste |
|---|---|---|
| 0 | El dato ya está en la conversación | gratis |
| **0.5** | **`graphify query` / `explain` / `path` / `affected`** | **acotado por `--budget` (2000 tokens por defecto)** |
| 1 | Grep/Glob | barato |
| 2 | Read con `offset`/`limit` | medio |
| 3 | Read de archivo completo | caro |
| 4 | Outputs sin filtrar, exploración especulativa | muy caro |

Regla operativa: **si existe `graphify-out/graph.json` en el proyecto, la primera pregunta de orientación va al grafo, no a Grep.** Grep sigue siendo la herramienta correcta para localizar una línea exacta que ya sabes que quieres tocar.

Lo que graphify NO sustituye: leer el fragmento exacto antes de editarlo (§2 de `CLAUDE.md` sigue mandando). El grafo te dice *dónde mirar y cómo se relaciona*; nunca es evidencia suficiente para escribir un Edit.

---

## 2. Instalación en esta máquina (estado real)

| Pieza | Ubicación | Notas |
|---|---|---|
| Paquete | `graphifyy` 0.9.50 (Python 3.11 de Microsoft Store) | el módulo se llama `graphify`, el paquete `graphifyy` |
| Binarios | `…\Python311\Scripts\graphify.exe`, `graphify-mcp.exe` | ese `Scripts` se añadió al PATH de usuario |
| Skill | `.claude/skills/graphify/` (SKILL.md + `references/`) | instalada con `--platform windows` (variante PowerShell) |
| Hook | `.claude/settings.json` → `PreToolUse` | ver §5 |
| Ignores | `C:\NEPTUNO\.graphifyignore`, `C:\ANDROMEDA\.graphifyignore` | ver §4 |

Reinstalar la skill tras actualizar el paquete (**siempre con `CLAUDE_CONFIG_DIR`**, ver §6):

```powershell
$env:CLAUDE_CONFIG_DIR = "C:\NEPTUNO\.claude"
graphify install --platform windows
Remove-Item C:\NEPTUNO\.claude\CLAUDE.md -Force   # el instalador crea este archivo espurio
node C:\NEPTUNO\tools\sync-global.js
node C:\NEPTUNO\tools\sync-opencode.js
```

### Extras opcionales no instalados

| Extra | Da | Instalar |
|---|---|---|
| `leiden` | clustering Leiden (comunidades mejores que el fallback) | `pip install "graphifyy[leiden]"` |
| `pdf` | ingesta de PDFs (papers) | `pip install "graphifyy[pdf]"` |
| `mcp` | servidor `graphify-mcp` (10 herramientas) | `pip install "graphifyy[mcp]"` |
| `neo4j` / `falkordb` | push a base de datos de grafos | — |

`watch` (watchdog), `svg` (matplotlib), `networkx` y los `tree-sitter` ya están presentes.

**Sobre el MCP**: se decidió NO registrarlo. Sus 10 herramientas se cargarían en el contexto de cada sesión (~1–1,5k tokens) para hacer lo mismo que el CLI hace desde Bash a coste de contexto cero. En un ecosistema cuyo objetivo declarado es el ahorro de tokens, el CLI gana. Queda como opción si algún día se quiere acceso al grafo desde un runtime sin shell.

---

## 3. Backend de LLM: `claude-cli`

La pasada semántica (la que lee markdown, docs y papers) necesita un LLM. En esta máquina **no hay ninguna API key** en el entorno, y el HANDOFF documenta que la clave de Anthropic de esta cuenta devuelve `credit balance too low`.

Backend elegido: **`claude-cli`** — enruta por el binario `claude` local (`~/.local/bin/claude`) con `-p --output-format json`, autenticando con la suscripción de Claude Code ya pagada. graphify lo contabiliza a coste `$0.0000` porque no hay gasto pay-as-you-go: se factura al plan.

```powershell
graphify extract <ruta> --backend claude-cli --max-concurrency 2
```

`--max-concurrency 2` en vez del 4 por defecto: cada chunk lanza un proceso `claude` completo. Para el etiquetado de comunidades graphify ya fuerza concurrencia 1 en este backend.

**Fallback de coste literalmente cero**: Ollama está instalado en la máquina. `--backend ollama` no consume cuota de ningún plan, a cambio de una extracción de entidades notablemente peor. Útil si alguna vez hay que reconstruir todo desde cero sin tocar el plan.

---

## 4. Los tres grafos

| Grafo | Ruta | Contenido |
|---|---|---|
| NEPTUNO | `C:\NEPTUNO\graphify-out\graph.json` | skills, agentes, docs, hooks, sincronizadores |
| ANDROMEDA | `C:\ANDROMEDA\graphify-out\graph.json` | las notas de proyecto de la bóveda |
| Global | `~\.graphify\global-graph.json` | unión de los anteriores, consultable cross-proyecto |

`graphify` busca `graphify-out/graph.json` **relativo al cwd**. Desde otro directorio hay que pasar `--graph`:

```powershell
graphify query "¿qué skill cubre releases firmadas?" --graph C:\NEPTUNO\graphify-out\graph.json
graphify query "¿qué proyectos usan Expo?"          --graph $HOME\.graphify\global-graph.json
```

### Los dos ignores son obligatorios, no cosméticos

- `C:\NEPTUNO\.graphifyignore` excluye **`.opencode/`**: es una copia generada de `.claude/` (`tools/sync-opencode.js`). Indexar ambas duplicaría cada skill y cada agente como nodos gemelos y envenenaría la detección de comunidades.
- `C:\ANDROMEDA\.graphifyignore` excluye **`04-Recursos/Grafo/`**: es el export Obsidian del propio grafo. Sin esa línea, cada reconstrucción de la bóveda ingiere su salida anterior y el grafo se realimenta consigo mismo.

---

## 5. El hook PreToolUse (Claude Code)

Dos entradas en `.claude/settings.json`, ambas invocando el `.exe` por ruta absoluta (parsea igual bajo sh, cmd.exe y PowerShell):

| Matcher | Comando | Efecto |
|---|---|---|
| `Bash\|Grep` | `graphify.exe hook-guard search` | inyecta el aviso de usar `graphify query` antes de grepear |
| `Read\|Glob` | `graphify.exe hook-guard read` | inyecta el aviso antes de leer fuentes indexadas |

Modo **nudge suave** (no `--strict`): inyecta contexto, nunca bloquea. Comportamiento verificado por stdin en los cuatro casos:

| Caso | Resultado |
|---|---|
| Grep con grafo en el cwd | emite el aviso, exit 0 |
| Read de archivo indexado y fresco | emite el aviso, exit 0 |
| Read de archivo fuera del proyecto | silencio, exit 0 |
| Cualquiera sin `graph.json` en el cwd | silencio, exit 0 |

Falla abierto ante cualquier error (JSON inválido incluido): un fallo del hook nunca bloquea una llamada legítima.

El aviso del guard de lectura **incluye explícitamente a los subagentes** ("include it in every subagent prompt involving code exploration"), lo que encaja con el modelo de delegación de NEPTUNO: un `scout` que grepea a ciegas es exactamente el gasto que graphify elimina.

**Gotcha al probarlo**: `printf`/`echo` de Git Bash colapsan `\\` → `\`, produciendo JSON inválido y un hook que calla (fallo abierto) aunque funcione. Escribe el JSON con Python o un heredoc, nunca con `printf`.

Para endurecerlo puntualmente sin reinstalar: `GRAPHIFY_HOOK_STRICT=1` deniega la primera lectura cruda por sesión.

---

## 6. Dos trampas de sincronización (importantes)

Ambas nacen de que `.claude/` es la única fuente de verdad y los sincronizadores **borran el destino antes de copiar**:

1. **`sync-global.js` hace `fs.rmSync` sobre `~/.claude/skills`.** Una skill instalada directamente ahí (que es lo que `graphify install --platform claude` hace por defecto) desaparece en el siguiente sync. Por eso la instalación va con `CLAUDE_CONFIG_DIR=C:\NEPTUNO\.claude`.
2. **`sync-global.js` sobrescribe la clave `hooks` del settings global** con la del maestro. Un hook escrito a mano en `~/.claude/settings.json` se pierde igual. Por eso las entradas de graphify viven en `C:\NEPTUNO\.claude\settings.json`.

Efecto colateral útil: la ruta absoluta del `.exe` no contiene el prefijo `C:/NEPTUNO/tools/hooks/` que `sync-global.js` reescribe, así que viaja intacta al settings global.

---

## 7. Compatibilidad con opencode

| Pieza | Cómo llega a opencode |
|---|---|
| Doctrina (§2 y §5 de `CLAUDE.md`) | **nativa** — opencode lee `CLAUDE.md`/`~/.claude/CLAUDE.md` como fallback de `AGENTS.md` |
| Skill `/graphify` | `tools/sync-opencode.js` → `.opencode/command/graphify.md` |
| Los grafos | artefacto neutro: mismo `graph.json`, mismo CLI, mismo resultado |
| Hook PreToolUse | **no portado** — ver abajo |

`sync-opencode.js` copia solo el *cuerpo* de cada `SKILL.md`. La skill de graphify es la única del catálogo que carga archivos hermanos (`references/*.md`), así que se añadió `REFS_RE` al script: reescribe `` `references/X.md` `` a la ruta absoluta de la copia global, igual que `DOCS_RE` ya hacía con `` `docs/X.md` ``.

**El hook no se portó a plugin de opencode, y es una decisión, no un olvido.** `tool.execute.before` solo puede *bloquear* lanzando un `Error`; no puede inyectar contexto. Portarlo obligaría a elegir entre el modo estricto (bloqueante, que el usuario descartó) o duplicar la doctrina en un `experimental.chat.system.transform` que ya está cubierta de forma nativa por `CLAUDE.md`. En opencode el ahorro es doctrinal; en Claude Code es doctrinal **y** reforzado por hook.

---

## 8. Mantenimiento

`graphify update <ruta>` re-extrae por AST los archivos nuevos o cambiados. **No llama al LLM**: coste cero, segundos. Está integrado en `/handoff`, como último paso del cierre de sesión.

### `update` es AST puro — y eso importa más de lo que parece aquí

Verificado ejecutándolo sobre la bóveda:

```
> graphify update C:\ANDROMEDA
Re-extracting code files in C:\ANDROMEDA (no LLM needed)...
[graphify watch] No code-graph topology changes detected; outputs left untouched.
```

ANDROMEDA tiene **0 archivos de código y 26 de markdown**: `update` ahí es literalmente un no-op. Y NEPTUNO es 88 docs frente a 10 archivos de código, así que `update` solo cubre una décima parte del corpus.

Consecuencia práctica, y hay que ser honesto al reportarla: en estos dos repos **el ciclo barato de mantenimiento casi no aplica**. Refrescar el grafo tras escribir docs o notas exige la pasada semántica completa:

```powershell
graphify extract <ruta> --backend claude-cli --max-concurrency 2
```

Eso no cuesta dinero nuevo (§3), pero sí consume cuota del plan y tarda minutos, no segundos. No es algo que se lance en cada cierre de sesión: hazlo cuando se hayan acumulado cambios de documentación que valga la pena indexar.

`graphify check-update <ruta>` informa si hay una re-extracción semántica pendiente, sin hacerla. La otra excepción: si graphify avisa de que el grafo encogería, es la guarda anti-corrupción — `--force` solo tras un borrado real de código.

### El tamaño del chunk decide cuánto se extrae de cada archivo

Efecto medido, y conviene tenerlo presente porque sesga las respuestas:

| Pasada | Archivos por chunk | Nodos resultantes |
|---|---|---|
| Construcción inicial | 88 docs en 2 chunks (~44 c/u) | 181 |
| Re-extracción incremental | 7 docs en 1 chunk | 296 |

Los mismos archivos, extraídos con menos compañía en el chunk, producen **muchos más nodos**: el presupuesto de `--token-budget` (60 000 por chunk) se reparte entre los archivos que caigan dentro. Tras la pasada incremental, 6 archivos re-extraídos concentraban 120 de 296 nodos (`README.md` solo, 81), mientras los 91 docs no tocados se quedaban en ~2 nodos cada uno.

Consecuencia: **el grafo es más denso donde se ha tocado recientemente**, lo que inclina `query` hacia lo último editado. No es corrupción — el benchmark mejoró de 4,1x a 10,6x con la densidad — pero sí es desigual.

Para un grafo homogéneo, una reconstrucción completa con chunks más pequeños:

```powershell
graphify extract C:\NEPTUNO --backend claude-cli --force --token-budget 15000 --max-concurrency 2
```

Más llamadas al LLM (sigue sin coste monetario, §3) a cambio de que todos los archivos reciban atención comparable. Es una decisión de una vez, no de cada cierre de sesión.

---

## 9. Bucle de realimentación (acierto, no solo coste)

graphify guarda las respuestas que da y aprende de cuáles sirvieron:

```powershell
graphify save-result --question "..." --answer "..." --nodes A B --outcome useful
graphify save-result --question "..." --outcome corrected --correction "lo correcto era ..."
graphify reflect --graph C:\NEPTUNO\graphify-out\graph.json
```

`reflect` agrega esas señales en `graphify-out/reflections/LESSONS.md` de forma **determinista** (sin LLM), con vida media de 30 días y exigiendo corroboración de 2 resultados distintos antes de preferir un nodo. Nodos que ya no existen en el grafo se descartan.

Esto es la pieza que ataca el *acierto* y no solo el gasto: `--outcome dead_end` y `--outcome corrected` convierten un callejón sin salida de hoy en una advertencia escrita para la sesión de dentro de un mes. Está enganchado en `/verify-work`.

---

## 10. Comandos de consulta

| Comando | Cuándo |
|---|---|
| `graphify query "<pregunta>"` | orientación general; recorrido BFS acotado por `--budget` |
| `graphify explain "<concepto>"` | un nodo y sus vecinos, en lenguaje llano |
| `graphify path "<A>" "<B>"` | cómo se relacionan dos cosas |
| `graphify affected "<X>"` | qué se rompe si tocas X (recorrido inverso) — antes de un refactor |
| `graphify god-nodes --top 10` | los hubs arquitectónicos: por dónde empezar en un repo desconocido |
| `graphify benchmark` | reducción de tokens medida frente a leer el corpus entero |

Salidas navegables para humanos: `graphify-out/GRAPH_REPORT.md` (arquitectura en prosa), `graph.html` (visualización interactiva) y el export Obsidian en `C:\ANDROMEDA\04-Recursos\Grafo\`.

---

## 11. El filtro de sensibles y por qué la doc se llama `ECONOMIA-TOKENS.md`

El filtro de archivos sensibles de graphify (`detect._is_sensitive`) tiene una etapa 3 que descarta archivos por **palabras clave de credenciales en el nombre**. La regla exacta, leída del código (`detect.py:207`, `_is_prose_note`), no es la que sugiere el mensaje de aviso:

> un `.md` queda exento **salvo que su *stem* sea exactamente** una palabra clave (`fullmatch`): `token`, `tokens`, `secrets`, `passwords`…

Es decir: lo que salva a un documento es que su nombre **no sea solo la palabra clave**. Da igual dónde caiga la palabra dentro del nombre.

Esta doc se llamaba `TOKENS.md` y por eso el grafo la descartaba en silencio:

```
[graphify extract] 1 file(s) skipped as potentially sensitive
(rename or move if wrongly flagged): TOKENS.md
```

Falso positivo por el **nombre**, no por el contenido, y sin variable de entorno ni allowlist: graphify solo ofrece "rename or move". Se renombró a `ECONOMIA-TOKENS.md`, comprobado contra el código antes de mover nada:

| Nombre | `_is_sensitive` | `_generic_keyword_hit` | `_is_prose_note` |
|---|---|---|---|
| `TOKENS.md` | **True** (descartado) | True | False |
| `ECONOMIA-TOKENS.md` | False | True | **True** |
| `TOKENS-ECONOMIA.md` | False | True | True |
| `COSTE-TOKENS.md` | False | True | True |

Nótese que `_generic_keyword_hit` sigue siendo `True` en todos: **no es esa función la que decide**, sino la exención de nota-en-prosa que viene después. Un análisis basado solo en el nombre de la función habría concluido que poner "tokens" al final del nombre lo condena — y es falso.

**Si añades un doc nuevo al ecosistema**, evita que su nombre completo sea una sola palabra clave. `SECRETS.md` o `PASSWORDS.md` desaparecerían del grafo sin que nada falle de forma visible; `GESTION-SECRETS.md` no.

Verificar que no hay descartes silenciosos tras cualquier reconstrucción: la línea `skipped as potentially sensitive` **no debe aparecer** en el output de `graphify extract`.

---

## 12. Cómo verificar

```powershell
graphify --version                                          # → graphify 0.9.50
graphify god-nodes --graph C:\NEPTUNO\graphify-out\graph.json --top 5
graphify query "¿qué agente usa modelo opus?" --graph C:\NEPTUNO\graphify-out\graph.json
graphify global list                                        # → los repos del grafo global

# El hook (JSON con Python, NUNCA con printf — ver §5)
python -c "import json;json.dump({'tool_name':'Grep','tool_input':{'pattern':'x'}},open('t.json','w'))"
cd C:\NEPTUNO; graphify hook-guard search < t.json          # → debe emitir el aviso
```
