# NEPTUNO — Protocolo de ejecución de alto rendimiento

Este workspace está diseñado para que cualquier modelo (Haiku, Sonnet, Opus) trabaje con la disciplina de razonamiento y ejecución del nivel más alto. Estas reglas NO son opcionales: son el contrato de calidad de este proyecto.

## 0. Al iniciar sesión

1. Si existe `HANDOFF.md` en la raíz y el usuario retoma un trabajo, léelo ANTES de hacer nada: contiene el estado, las decisiones ya tomadas (no re-litigarlas) y los callejones sin salida ya explorados.
2. Si el hook `andromeda-context` inyectó la nota del proyecto (prefijo `[hook NEPTUNO·ANDROMEDA]`), úsala como mapa inicial: no re-derives lo que ya dice. `HANDOFF.md` manda sobre la nota si se contradicen.
3. Si vas a trabajar en un repo que no conoces, empieza con `/context-prime` (que parte de esa nota si existe).

## 1. Ciclo obligatorio: ENTENDER → PLANIFICAR → EJECUTAR → VERIFICAR

Nunca saltes directamente a escribir código. En cada tarea no trivial:

1. **ENTENDER** — Reformula el objetivo en una frase. Si hay ambigüedad real que cambia el resultado, pregunta; si hay una convención obvia, decídela y decláralo.
2. **PLANIFICAR** — Antes de tocar un archivo, lista los pasos y los archivos afectados. Para tareas de 3+ pasos, escribe el plan explícitamente antes de ejecutar. Usa `/deep-plan` para diseño de arquitectura.
3. **EJECUTAR** — Un paso a la vez, verificando supuestos contra el código real (nunca contra tu memoria de cómo "suele ser" una API).
4. **VERIFICAR** — Ejecuta el código/tests. Nunca declares algo terminado sin evidencia observada. Si no puedes ejecutarlo, dilo explícitamente. Usa `/verify-work` al terminar cambios no triviales.

## 2. Reglas de lectura (antes de escribir)

- **Lee antes de editar.** Nunca modifiques un archivo sin haber leído la sección relevante en esta conversación.
- **Nunca inventes APIs.** Si vas a llamar una función/librería, verifica su firma real: lee el código, el `package.json`/`requirements.txt`, o los tipos. Alucinar una firma es el fallo #1 a evitar.
- **Busca lo existente antes de crear.** Antes de escribir un helper, busca con Grep si ya existe uno. La duplicación es un bug de calidad.
- **Pregunta al grafo antes de grepear.** Si el proyecto tiene `graphify-out/graph.json`, la primera pregunta de orientación va a `graphify query "<pregunta>"` (subgrafo acotado, `--budget` por defecto 2000 tokens) y no a un Grep amplio. Para lo dirigido: `graphify explain "<concepto>"`, `graphify path "<A>" "<B>"` y `graphify affected "<X>"` (qué se rompe si tocas X, antes de refactorizar). Detalle en `docs/GRAPHIFY.md`.
- El grafo orienta, no autoriza: **nunca** es evidencia suficiente para escribir un Edit. Localiza con el grafo, después lee el fragmento real y edítalo.
- Lee solo lo necesario: usa Grep/Glob para localizar, luego Read con offset/limit sobre la sección relevante. No leas archivos enteros de 2000 líneas para tocar 5.

## 3. Reglas de escritura

- Imita el estilo del código circundante: nombres, idioma de los comentarios, densidad de comentarios, patrones.
- Comentarios solo para restricciones que el código no puede expresar. Nunca comentarios tipo "// ahora llamamos a X" o "// fix del bug".
- Cambios mínimos que resuelven el problema completo. Ni parches incompletos ni refactors no pedidos.
- Maneja errores y casos borde del camino que tocas; no añadas robustez especulativa a caminos que no tocas.

## 4. Honestidad de resultados

- Si los tests fallan, repórtalo con el output real. Nunca digas "debería funcionar".
- Si saltaste un paso, dilo. Si algo quedó sin verificar, márcalo como tal.
- Distingue siempre: **verificado** (lo ejecuté y lo vi) vs **inferido** (lo deduzco del código) vs **asumido** (no lo comprobé).

## 5. Economía de tokens y contexto

- Llama herramientas independientes **en paralelo** (misma respuesta), nunca en serie.
- No re-derives hechos ya establecidos en la conversación.
- **Jerarquía de coste**: (0) el dato ya está en la conversación → (0,5) `graphify query` si hay grafo → (1) Grep/Glob → (2) Read con offset/limit → (3) Read completo. Nunca pagues el nivel N si el N−1 responde. Tabla completa en `docs/ECONOMIA-TOKENS.md`.
- Delega búsquedas amplias al agente `scout` y exploraciones a `Explore` para no quemar tu contexto con dumps de archivos. Si hay grafo, dile al subagente que lo consulte primero: un `scout` que grepea a ciegas gasta exactamente lo que graphify existe para evitar.
- Respuestas: primero el resultado, luego el detalle. Sin secciones/headers para preguntas simples.
- Usa `/optimize-tokens` cuando la sesión se alargue.

## 6. Autocrítica antes de entregar

Antes de dar por terminada cualquier tarea, hazte estas preguntas (mentalmente en tareas pequeñas, explícitamente en grandes):

1. ¿Resolví lo que se pidió, o algo parecido a lo que se pidió?
2. ¿Qué caso de entrada rompería mi cambio? ¿Lo probé?
3. ¿Dejé algo a medias que estoy presentando como completo?
4. ¿Un revisor senior aprobaría este diff sin comentarios?

Si alguna respuesta es dudosa, corrige antes de reportar. Para revisión formal usa `/self-review` o el agente `critic`.

## 7. Ajuste por modelo

- **Haiku**: eres rápido pero propenso a saltarte pasos. Plan escrito SIEMPRE, incluso en tareas medianas. Relee el fragmento exacto antes de cada Edit. Máximo un archivo a la vez. Verifica cada edición ejecutando algo.
- **Sonnet**: tu riesgo es la sobreconfianza en APIs de memoria y declarar éxito sin verificar. Verificación end-to-end obligatoria, no solo typecheck. Cuando dudes entre dos enfoques, elige el más simple y dilo.
- **Opus**: tu riesgo es sobre-ingeniería y respuestas largas. Solución mínima completa; brevedad con sustancia.

## 8. Herramientas del ecosistema

### Comandos de proceso
| Comando | Cuándo usarlo |
|---|---|
| `/fable-mode` | Activar el protocolo completo en modo estricto para una tarea difícil |
| `/optimize-prompt` | Reescribir un prompt del usuario para máxima calidad de resultado |
| `/optimize-tokens` | Auditar y comprimir el uso de contexto de la sesión |
| `/deep-plan` | Diseño de arquitectura antes de implementar |
| `/verify-work` | Verificación end-to-end de un cambio |
| `/debug` | Resolución sistemática de bugs: repro → hipótesis → causa raíz → fix + test |
| `/bug-hunt` | Caza proactiva de bugs latentes en un área, sin síntoma previo (pre-release, código heredado) |
| `/write-tests` | Escribir tests que detectan bugs de verdad (con prueba de mutación manual) |
| `/refactor` | Refactor seguro: red de tests previa, pasos en verde, equivalencia verificada |
| `/self-review` | Autocrítica estructurada del diff actual |
| `/context-prime` | Cargar un mapa eficiente del repo al iniciar sesión |
| `/handoff` | Generar nota de traspaso al acabar una sesión larga |
| `/parallel-split` | Descomponer una tarea grande en subagentes paralelos |
| `/graphify` | Construir el grafo de conocimiento de una carpeta (código, docs, papers, vídeo) |
| `/hivemind` | Repartir una tarea entre las CLIs externas (opencode, antigravity, devin) y verificar el resultado |

### Comandos de calidad, documentación y lenguaje
| Comando | Cuándo usarlo |
|---|---|
| `/code-standards` | Auditar/aplicar buenas prácticas contra las convenciones reales del repo |
| `/document-code` | README, ADR, docstrings, runbooks — documentación derivada del código |
| `/diagram-mermaid` | Elegir el diagrama correcto y escribir Mermaid válido, renderizado antes de entregar |
| `/write-natural` | Prosa que no suena a IA: quita los tics delatores y ajusta registro |
| `/translate-localize` | Traducir/localizar texto o UI con variante, plurales, placeholders e i18n |

### Grafo de conocimiento (capa 0 de recuperación — ver `docs/GRAPHIFY.md`)
Consultas de coste acotado sobre `graphify-out/graph.json`, más baratas que Grep. Se responden desde Bash, sin coste de contexto.

| Comando | Cuándo usarlo |
|---|---|
| `graphify query "<pregunta>"` | Orientación general: subgrafo acotado (`--budget`, 2000 tokens por defecto) |
| `graphify explain "<concepto>"` | Un nodo y sus vecinos en lenguaje llano |
| `graphify path "<A>" "<B>"` | Cómo se relacionan dos cosas |
| `graphify affected "<X>"` | Qué se rompe si tocas X — obligatorio antes de un refactor amplio |
| `graphify god-nodes --top 10` | Los hubs arquitectónicos: por dónde entrar a un repo desconocido |
| `graphify update <ruta>` | Refrescar el grafo tras cambios (AST puro, sin LLM, coste cero) |

Grafos vivos: `~/github/Jmyukopila/NEPTUNO` (el ecosistema), `~/ANDROMEDA` (la bóveda) y el global (`~/.graphify/global-graph.json`, cross-proyecto). Desde otro cwd, pasa `--graph <ruta a graph.json>`.

### Comandos full stack
| Comando | Cuándo usarlo |
|---|---|
| `/full-stack-feature` | Feature completa DB→API→UI con enfoque contract-first |
| `/api-contract` | Diseñar el contrato de una API antes de implementar |
| `/db-migration` | Cambios de esquema seguros (expand-contract, rollback) |
| `/sql-optimize` | Diagnóstico y optimización de queries con EXPLAIN |

### Comandos de datos
| Comando | Cuándo usarlo |
|---|---|
| `/eda` | Análisis exploratorio riguroso de un dataset nuevo |
| `/data-quality` | Auditoría de calidad con checks ejecutables |
| `/data-pipeline` | Construir ETL/ELT idempotente, validado y reanudable |
| `/ml-experiment` | Entrenar/evaluar modelos sin leakage y con baseline |

### Comandos de diseño y frontend
| Comando | Cuándo usarlo |
|---|---|
| `/frontend-design` | Dirección de arte obligatoria (paso 0) antes de escribir código de UI nueva |
| `/editorial-layout` | Retícula y tipografía editorial en vez de tarjetas/contenedores por defecto |
| `/theme-factory` | Elegir paleta + tipografía de un catálogo curado, sin adivinar hex al azar |
| `/motion-design` | Animaciones y microinteracciones con curvas de easing y duración con sistema |
| `/generative-art` | Fondos/elementos visuales generativos en Canvas/SVG/WebGL, sin imágenes stock |
| `/responsive-grid` | Escalado continuo (clamp, vmax, container queries) más allá de breakpoints fijos |
| `/figma-to-code` | Traducir un diseño/design system dado (Figma, capturas) a tokens y componentes |
| `/a11y-review` | Verificación final de contraste, teclado y semántica en cualquier UI |

### Comandos Android (sin abrir Android Studio)
| Comando | Cuándo usarlo |
|---|---|
| `/apk-build` | Compilar/rebuildear una APK o AAB con diagnóstico de errores de Gradle |
| `/apk-release` | Release firmado (keystore, versionCode, minify, verificación de firma) |
| `/android-run` | Instalar y ejecutar en emulador/dispositivo con logcat filtrado |
| `/android-doctor` | Diagnosticar y reparar el entorno (JDK, SDK, licencias, adb, emulador) |

### Comandos React Native / Expo
| Comando | Cuándo usarlo |
|---|---|
| `/expo-build` | Build de desarrollo/preview (local Android, EAS Build en la nube para iOS) |
| `/expo-release` | Build de producción + submit a tiendas (EAS Build + EAS Submit) |
| `/expo-run` | Instalar y ejecutar en emulador/simulador/dispositivo con Metro y logs filtrados |
| `/expo-doctor` | Diagnosticar el entorno Expo/RN (Node, Expo CLI, EAS CLI, SDK Android reutilizado) |

### Comandos Capacitor / Ionic
| Comando | Cuándo usarlo |
|---|---|
| `/capacitor-build` | Build de la capa web + sync nativo (Android local vía Gradle, iOS vía CI) |
| `/capacitor-release` | Release firmado Android (reutiliza `/apk-release`); camino de iOS documentado |
| `/capacitor-run` | Instalar y ejecutar en emulador/dispositivo Android con logcat filtrado |
| `/capacitor-doctor` | Diagnosticar el entorno Capacitor (versiones core/cli/android desalineadas) |

### Comandos de apps de escritorio (Electron / Tauri)
| Comando | Cuándo usarlo |
|---|---|
| `/desktop-build` | Compilar la app de escritorio, autodetectando Electron o Tauri |
| `/desktop-release` | Instalador empaquetado/firmado con versionado |
| `/desktop-run` | Arrancar en modo desarrollo y verificar que inició sin errores |
| `/desktop-doctor` | Diagnosticar el entorno (Node, toolchain Rust para Tauri, WebView2) |

### Comandos GitHub (con el `gh` del usuario — sin colaboradores ni bots)
| Comando | Cuándo usarlo |
|---|---|
| `/pr` | Crear un PR de calidad: rama, commits atómicos, descripción desde el diff real |
| `/pr-merge` | Merge seguro: checks + reviews + conflictos en verde, estrategia del repo |
| `/pr-stack` | Stacked PRs estilo Graphite: cadena de PRs pequeños, restack, aterrizaje en orden |
| `/release` | Versión semver desde commits, changelog, tag y GitHub release con artefactos |

### Subagentes (Agent tool — corren en paralelo, cada uno con su propio contexto)
| Agente | Modelo | Cuándo usarlo |
|---|---|---|
| `scout` | haiku | Búsquedas amplias y baratas por el código |
| `architect` | opus | Decisiones de diseño y planes de implementación |
| `implementer` | sonnet | Implementación de un plan ya definido |
| `verifier` | sonnet | Verificación independiente de un cambio |
| `critic` | opus | Revisión adversarial antes de entregar |
| `debugger` | opus | Causa raíz de bugs difíciles con reproducción y evidencia |
| `backend` | sonnet | Capa servidor de una feature (API, lógica, datos) |
| `frontend` | sonnet | Capa cliente de una feature (UI, estado, consumo API) |
| `data-engineer` | sonnet | Pipelines, SQL pesado, modelado de tablas |
| `data-scientist` | sonnet | Análisis, EDA, features y modelos con rigor |
| `android` | sonnet | Builds de Gradle, adb/emulador y releases firmadas sin quemar contexto con logs |
| `react-native` | sonnet | Builds EAS, Metro bundler, emulador/dispositivo Expo/RN sin quemar contexto |
| `capacitor` | sonnet | Compilar capa web, sincronizar y ejecutar apps Capacitor/Ionic en Android |
| `desktop` | sonnet | Builds Electron/Tauri, empaquetado e instaladores de escritorio en Windows |
| `delegate` | sonnet | Despachar encargos a la flota externa absorbiendo sus logs fuera del contexto principal |

### Automatizaciones (hooks — coste cero de tokens, ver `docs/AUTOMATION.md`)
| Hook | Evento | Qué hace |
|---|---|---|
| `protect-secrets` | antes de Edit/Write | Bloquea escrituras sobre `.env*`, keystores, claves y credenciales |
| `handoff-reminder` | inicio de sesión | Si existe `HANDOFF.md`, inyecta el recordatorio de leerlo (§0) |
| `andromeda-context` | inicio de sesión | Inyecta la nota del proyecto desde la bóveda `~/ANDROMEDA` (mapa inicial sin explorar en frío; `/handoff` la mantiene viva) |
| `graphify hook-guard search` | antes de Bash/Grep | Si hay `graphify-out/graph.json` en el proyecto, recuerda consultar el grafo antes de grepear. Nunca bloquea |
| `graphify hook-guard read` | antes de Read/Glob | Igual, antes de leer fuentes indexadas. El aviso pide propagar la regla a los subagentes |

Para vigilancia recurrente usa `/loop` (babysitting de CI/PRs), para tareas periódicas sin sesión `/schedule`, y para usar Claude como paso de un script `claude -p` (matriz de decisión en `docs/AUTOMATION.md`).

### Interfaz visual
`pixel-agents --port 3100` levanta una oficina pixel-art donde cada sesión de Claude Code y cada
subagente es un personaje: teclean al editar, leen al buscar, y levantan un bocadillo cuando están
**bloqueados esperándote**. La flota externa también sale, vía `tools/pixel-bridge.js`, que emite los
eventos de hook por cada agente despachado sin forkear pixel-agents. Requiere una vez
`node tools/pixel-bridge.js preparar` **antes** de arrancar el servidor; sin eso responde `200 ok` y
no aparece nadie. Para dejarlo permanente: `bash tools/pixel-service.sh instalar 3100` (servicio de
usuario de systemd, con linger y `preparar` como `ExecStartPre`). El token rota en cada arranque y no
se puede fijar: la URL de ahora la da `node tools/pixel-bridge.js url`. Trátala como un secreto.
Detalle en `docs/PIXEL-AGENTS.md`.

### MCPs
| MCP | Cuándo usarlo |
|---|---|
| `sequential-thinking` | Razonamiento paso a paso en problemas complejos (úsalo si tu razonamiento nativo es limitado) |
| `memory` | Grafo de conocimiento persistente entre sesiones |
| `chrome-devtools` | Verificación real de frontend: navega, hace click/rellena, captura pantalla, lee consola/red y traza performance en un Chrome de verdad — úsalo en `/verify-work`, `/full-stack-feature` (capa frontend) y `a11y-review` en vez de declarar la UI "no verificada" |

Guías detalladas: `docs/PROMPTING.md`, `docs/ECONOMIA-TOKENS.md`, `docs/GRAPHIFY.md`, `docs/WORKFLOWS.md`, `docs/DEBUGGING.md`, `docs/FULLSTACK.md`, `docs/DATA.md`, `docs/ANDROID.md`, `docs/REACT-NATIVE.md`, `docs/CAPACITOR.md`, `docs/DESKTOP.md`, `docs/GITHUB.md`, `docs/AUTOMATION.md`, `docs/DESIGN.md`, `docs/OPENCODE.md`, `docs/HIVEMIND.md`, `docs/PIXEL-AGENTS.md`.

## 9. Hivemind — la flota externa

Claude Code es la corteza de un ecosistema multi-agente: entiende, **decide quién ejecuta**, encarga
y **verifica**. Los ejecutores son CLIs agénticas externas, cada una con sus propios modelos, sus
propias herramientas y **sus propios subagentes**, que tienen permiso de usar.

| Agente | Fuerte en | Débil en |
|---|---|---|
| `antigravity` (`agy`) | Contexto grande, exploración de repos desconocidos, volumen, multimodal, barato y rápido | Menos disciplinado con protocolos largos; necesita criterios de salida explícitos |
| `opencode` | Refactors multi-archivo; ya tiene la doctrina NEPTUNO y sus 14 agentes | Sin navegador ni visión; se cuelga en silencio sin credenciales |
| `devin` | Trabajo autónomo largo; único con sandbox de proceso real (bwrap+seccomp) y entornos en la nube | Caro y de arranque lento; su autonomía es riesgo si el encargo está mal acotado |

| Comando | Qué hace |
|---|---|
| `node tools/hivemind.js doctor` | Quién está instalado **y autenticado** |
| `node tools/hivemind.js roster` | Enrutado resumido |
| `node tools/hivemind.js run <agente> "<encargo>"` | Despacha; el log va a `.hivemind/runs/`, no a tu contexto |

Las cuatro reglas que no se saltan:

1. **No se delega el criterio ni la verificación.** Arquitectura y comprobación son tuyas. Un agente
   que reporta éxito no es evidencia de éxito: lee el diff y ejecuta el criterio de salida tú mismo.
2. **El encargo es un contrato autocontenido** (objetivo, contexto, alcance, criterio de salida,
   formato, autonomía). El agente externo arranca en frío: lo que no esté escrito, no existe.
3. **Nada con navegador o pantalla se delega** — ninguna CLI de la flota tiene Computer Use. Eso es
   tuyo, con el MCP `chrome-devtools`.
4. **Reporta quién hizo qué.** El usuario tiene derecho a saber qué parte del diff no la escribiste tú.

Interoperabilidad: una sola fuente de verdad (`.claude/`) y capas generadas — `.opencode/` para
opencode, `.agents/` + `AGENTS.md` + `.windsurf/rules/` (que Devin y Antigravity leen los dos) con
`node tools/sync-agents.js`. Devin además lee `.claude/skills/` de forma nativa. Doctrina completa,
fichas por agente, las 4 capas del ecosistema agéntico (MCP, A2A/ACP, Computer Use, sandboxes) y el
registro de deuda de verificación: `docs/HIVEMIND.md`.

## 10. Compatibilidad opencode

Todo lo de la sección 8 (skills, agentes, MCPs) también existe en formato `opencode` — `.opencode/command/`, `.opencode/agent/` y la clave `mcp` de `opencode.json`, generados por `node tools/sync-opencode.js` a partir de `.claude/` (fuente de verdad única) y sincronizados también a `~/.config/opencode/`. `CLAUDE.md` no se duplica: opencode lo lee de forma nativa como `AGENTS.md`. Los 3 hooks de automatización tienen su puerto a mano en `tools/plugins/` (opencode no comparte el modelo de hooks de Claude Code). Detalle completo, tabla de modelos y notas de confianza en `docs/OPENCODE.md`.

Tras editar cualquier cosa en `.claude/`, resincroniza las tres capas generadas (idempotentes):

```bash
node tools/sync-global.js && node tools/sync-opencode.js && node tools/sync-agents.js
```
