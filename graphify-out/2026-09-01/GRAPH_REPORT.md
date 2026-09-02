# Graph Report - NEPTUNO  (2026-09-01)

## Corpus Check
- 111 files · ~89,514 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 782 nodes · 950 edges · 66 communities (61 shown, 3 thin omitted)
- Extraction: 85% EXTRACTED · 15% INFERRED · 0% AMBIGUOUS · INFERRED: 138 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `51588651`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Skill /graphify
- Doctrina Full Stack por capa
- build_merge
- Doctrina Expo/React Native por terminal
- Skill debug: depuración sistemática
- Compatibilidad con opencode
- Skill /expo-build
- Skill /editorial-layout
- install.js
- Test safety net before touching anything
- sync-opencode.js
- Skill /fable-mode — protocolo estricto
- tools/sync-opencode.js
- motion-design skill
- Honestidad de resultados: verificado / inferido / asumido
- graphify como capa 0 de recuperacion
- Skill android-run: ejecutar y observar una app Android
- Modelo orquestador y subagentes
- pr skill (create a Pull Request)
- Agente data-scientist (Sonnet)
- Skill a11y-review
- Skill apk-build: build de APK/AAB sin Android Studio
- Skill capacitor-build: build web + sync nativo Capacitor
- Agent assignment by task kind
- pr-merge skill
- Agente frontend (Sonnet)
- Constrained query expansion
- Agente debugger (Opus)
- memory
- sync-global.js
- Hivemind — Claude como corteza de un ecosistema multi-agente
- Skill apk-release: release Android firmado
- Skill desktop-doctor: doctor del entorno de escritorio
- self-review skill
- release skill
- Nunca inventes APIs
- graphify — grafo de conocimiento como capa 0 de recuperación
- Skill android-doctor: doctor del entorno Android
- Logcat filtrado por PID (regla de tokens)
- hooks/andromeda-context.js
- Optimized prompt structure
- plugins/andromeda-context.js
- hooks/handoff-reminder.js
- plugins/protect-secrets.js
- hooks/protect-secrets.js
- hivemind.js
- Jerarquia de coste de recuperacion
- Hivemind — tú decides y verificas; ellos ejecutan
- sync-agents.js
- Diagram Mermaid — el diagrama correcto, sintaxis verificada
- Code Standards — buenas prácticas medibles, no opiniones
- Translate & Localize — traducir la intención, no las palabras
- Write Natural — prosa que no delata al modelo
- ANDROID.md — Doctrina Android por terminal
- Doctrina de Datos — análisis, ciencia e ingeniería
- Document Code — documentación derivada del código, no del deseo
- AUTOMATION.md — Automatizaciones del ecosistema
- CAPACITOR.md — Doctrina Capacitor/Ionic por terminal
- DEBUGGING.md — Arsenal de depuración
- Doctrina de Diseño y Frontend — originalidad con sistema
- Doctrina de apps de escritorio (Electron / Tauri)
- Theme Factory — temas curados, no hex al azar
- Verificación end-to-end
- Write Tests — tests que fallan cuando deben

## God Nodes (most connected - your core abstractions)
1. `Skill /graphify` - 21 edges
2. `graphify — grafo de conocimiento como capa 0 de recuperación` - 13 edges
3. `Especificación del prompt de extracción` - 12 edges
4. `main()` - 10 edges
5. `Hivemind — tú decides y verificas; ellos ejecutan` - 10 edges
6. `Skill /expo-build` - 10 edges
7. `Diagram Mermaid — el diagrama correcto, sintaxis verificada` - 9 edges
8. `Skill android-run: ejecutar y observar una app Android` - 9 edges
9. `Skill apk-build: build de APK/AAB sin Android Studio` - 9 edges
10. `Skill android-doctor: doctor del entorno Android` - 9 edges

## Surprising Connections (you probably didn't know these)
- `MCP memory (grafo de conocimiento persistente)` --semantically_similar_to--> `graphify como capa 0 de recuperacion`  [INFERRED] [semantically similar]
  README.md → CLAUDE.md
- `Mirar los datos reales antes de escribir codigo` --semantically_similar_to--> `Nunca inventes APIs`  [INFERRED] [semantically similar]
  .claude/agents/data-engineer.md → CLAUDE.md
- `Detectar el framework antes de asumir comandos` --semantically_similar_to--> `Nunca inventes APIs`  [INFERRED] [semantically similar]
  .claude/agents/desktop.md → CLAUDE.md
- `Sync antes que nada (npx cap sync)` --semantically_similar_to--> `.claude/ como unica fuente de verdad`  [INFERRED] [semantically similar]
  .claude/agents/capacitor.md → README.md
- `Agente data-scientist (Sonnet)` --references--> `MCP sequential-thinking`  [INFERRED]
  .claude/agents/data-scientist.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Cadena de calidad: scout -> architect -> implementer -> verifier -> critic** — _claude_agents_scout_scout, _claude_agents_architect_architect, _claude_agents_implementer_implementer, _claude_agents_verifier_verifier, _claude_agents_critic_critic, readme_modelo_orquestador_y_subagentes [EXTRACTED 1.00]
- **Cascada de dirección de arte antes del código de UI** — _claude_skills_frontend_design_skill_frontend_design, _claude_skills_editorial_layout_skill_editorial_layout, _claude_skills_generative_art_skill_generative_art, _claude_skills_figma_to_code_skill_figma_to_code, _claude_skills_frontend_design_skill_design_direction [EXTRACTED 1.00]
- **Cadena de herramientas Expo/React Native** — _claude_skills_expo_build_skill_expo_build, _claude_skills_expo_doctor_skill_expo_doctor, _claude_skills_expo_release_skill_expo_release, _claude_skills_expo_run_skill_expo_run, _claude_skills_expo_build_skill_ios_windows_limitation [EXTRACTED 1.00]
- **Flujo Android completo sin Android Studio: doctor, build, run, release** — _claude_skills_android_doctor_skill_android_doctor, _claude_skills_apk_build_skill_apk_build, _claude_skills_android_run_skill_android_run, _claude_skills_apk_release_skill_apk_release [EXTRACTED 1.00]
- **Pipeline de extracción de graphify (AST + semántico + caché + merge)** — _claude_skills_graphify_skill_ast_structural_extraction, _claude_skills_graphify_skill_semantic_extraction, _claude_skills_graphify_skill_chunking_strategy, _claude_skills_graphify_skill_extraction_cache, _claude_skills_graphify_skill_merge_ast_semantic, _claude_skills_graphify_references_extraction_spec_extraction_spec, _claude_skills_graphify_references_extraction_spec_node_id_format [EXTRACTED 1.00]
- **graphify incremental re-extraction pipeline** — _claude_skills_graphify_references_update_detect_incremental, _claude_skills_graphify_references_update_build_merge, _claude_skills_graphify_references_update_replace_on_reextract, _claude_skills_graphify_references_update_manifest_stamping, _claude_skills_graphify_references_update_code_only_fast_path, _claude_skills_graphify_references_update_video_to_document_rewrite, _claude_skills_graphify_references_hooks_post_commit_hook [EXTRACTED 1.00]
- **Self-improving query loop: expansion, traversal, saved outcome, reflection** — _claude_skills_graphify_references_query_constrained_query_expansion, _claude_skills_graphify_references_query_vocab_extraction, _claude_skills_graphify_references_query_bfs_traversal, _claude_skills_graphify_references_query_token_budget_output, _claude_skills_graphify_references_query_save_result_feedback_loop, _claude_skills_graphify_references_query_work_memory_outcomes, _claude_skills_graphify_references_query_graphify_reflect_lessons [EXTRACTED 1.00]
- **Doctrina de la evidencia observada (nada se declara hecho sin verlo)** — claude_honestidad_de_resultados, claude_ciclo_entender_planificar_ejecutar_verificar, _claude_agents_verifier_ejercita_el_flujo_real, _claude_agents_implementer_verificar_tras_cada_edicion, _claude_agents_debugger_reproduce_primero, _claude_agents_android_evidencia_de_artefacto, _claude_agents_data_scientist_reproducibilidad [INFERRED 0.85]
- **Patrón compartido de skills doctor de entorno (chequeos en orden de dependencia + tabla de veredictos)** — _claude_skills_android_doctor_skill_android_doctor, _claude_skills_capacitor_doctor_skill_capacitor_doctor, _claude_skills_desktop_doctor_skill_desktop_doctor [INFERRED 0.85]
- **Principio transversal: nada se declara hecho sin evidencia observada** — _claude_skills_android_run_skill_verificacion_por_observacion, _claude_skills_apk_build_skill_verificacion_timestamp_artefacto, _claude_skills_debug_skill_reproduccion_primero, _claude_skills_bug_hunt_skill_confirmado_vs_plausible, _claude_skills_data_pipeline_skill_observabilidad_de_run [INFERRED 0.85]
- **Agentes de build que existen para filtrar output en origen** — _claude_agents_android_android, _claude_agents_react_native_react_native, _claude_agents_capacitor_capacitor, _claude_agents_desktop_desktop, _claude_agents_android_output_filtrado_en_origen, _claude_agents_android_evidencia_de_artefacto [INFERRED 0.95]
- **GitHub PR lifecycle: create, stack, merge, release** — _claude_skills_pr_skill_pr_skill, _claude_skills_pr_stack_skill_pr_stack_skill, _claude_skills_pr_merge_skill_pr_merge_skill, _claude_skills_release_skill_release_skill, _claude_skills_pr_stack_skill_restack_update_refs, _claude_skills_pr_merge_skill_three_green_lights, _claude_skills_release_skill_semver_from_commits [INFERRED 0.95]

## Communities (66 total, 3 thin omitted)

### Community 0 - "Skill /graphify"
Cohesion: 0.06
Nodes (53): Perfil por columna, Carga defensiva del dataset, El EDA describe, no limpia, Distribuciones y relaciones, Skill /eda — análisis exploratorio, Regla de evidencia numérica, Integridad y clave candidata, Referencia: /graphify add y --watch (+45 more)

### Community 1 - "Doctrina Full Stack por capa"
Cohesion: 0.06
Nodes (37): Supervivencia a la compactación, Jerarquía de coste de las operaciones, Economía de tokens, Elegir el modelo por tarea, Presupuesto de salida, Prompt caching, Subagentes como cortafuegos de contexto, Principio rector contract-first (+29 more)

### Community 2 - "build_merge"
Cohesion: 0.06
Nodes (47): graphify Commit Hook and CLAUDE.md Integration Reference, Doc and image changes ignored by the hook, Changed-file detection via git diff HEAD~1, graphify claude install, graphify hook install, Append to an existing post-commit hook, Native CLAUDE.md integration, graphify post-commit hook (+39 more)

### Community 3 - "Doctrina Expo/React Native por terminal"
Cohesion: 0.29
Nodes (7): Continuous Native Generation (CNG), EAS Build y perfiles de `eas.json`, iOS siempre por EAS Build en la nube, Doctrina Expo/React Native por terminal, `runtimeVersion` como contrato binario ↔ OTA, Matriz Expo SDK ↔ React Native ↔ Node, Versionado para tiendas

### Community 4 - "Skill debug: depuración sistemática"
Cohesion: 0.05
Nodes (42): Skill api-contract: la interfaz antes que la implementación, Diseño contract-first del API, El contrato expone el dominio, no las tablas, Ejemplos rellenos con datos realistas, Evolución sin romper clientes existentes, Shape único de error en toda la API, Barrido adversarial con taxonomía de defectos, Skill bug-hunt: caza proactiva de bugs latentes (+34 more)

### Community 5 - "Compatibilidad con opencode"
Cohesion: 0.25
Nodes (9): `CLAUDE.md` leído nativamente por opencode, Carga duplicada de plugins proyecto+global, Hooks de Claude Code → plugins de opencode, Esquema `command` como array único en opencode, Compatibilidad con opencode, Un `model:` fijado en un subagente gana sobre el `--model` de sesión, Fallback silencioso de `--agent` con subagentes, `sync-opencode.js` como traductor unidireccional (+1 more)

### Community 6 - "Skill /expo-build"
Cohesion: 0.08
Nodes (36): Firma de código en Windows, Skill /desktop-release, Verificación del instalador generado, Secretos de firma fuera del repo, Bump de versión Electron/Tauri, Captura de logs a archivo en background, Skill /desktop-run, Autodetección Electron vs Tauri (+28 more)

### Community 7 - "Skill /editorial-layout"
Cohesion: 0.10
Nodes (29): Anti-patrón de la tarjeta por costumbre, Paleta contenida, Skill /editorial-layout, Retícula antes del contenido, Contraste tipográfico como jerarquía, Escala tipográfica estricta, Ritmo vertical sistemático, El espacio en blanco es contenido (+21 more)

### Community 8 - "install.js"
Cohesion: 0.15
Nodes (23): checkboxPrompt(), CLAUDE_DIR, commandExists(), copyCore(), createVault(), DEFAULT_VAULT, fs, HOME (+15 more)

### Community 9 - "Test safety net before touching anything"
Cohesion: 0.15
Nodes (20): Baseline first, Data leakage, Mandatory error analysis, Leak-free feature construction, ml-experiment skill, Single primary metric chosen by error cost, Split before looking at the data, Animate only transform and opacity (+12 more)

### Community 10 - "sync-opencode.js"
Cohesion: 0.10
Nodes (18): BASH_TOOLS, buildAgents(), buildCommands(), EDIT_TOOLS, fs, GLOBAL_CLAUDE, GLOBAL_OPENCODE, nAgents (+10 more)

### Community 11 - "Skill /fable-mode — protocolo estricto"
Cohesion: 0.23
Nodes (16): Skill /fable-mode — protocolo estricto, Prohibiciones del modo, Fase 4 — Verificación adversarial, Fase 0 — Contrato, Fase 5 — Entrega, Fase 3 — Ejecución, Fase 2 — Plan, Fase 1 — Reconocimiento (+8 more)

### Community 12 - "tools/sync-opencode.js"
Cohesion: 0.23
Nodes (13): Sync antes que nada (npx cap sync), Compatibilidad opencode, CLAUDE_CONFIG_DIR en la instalacion de graphify, Filtro de archivos sensibles de graphify, _generic_keyword_hit, Gotcha: opencode exige command como un solo array, _is_prose_note (detect.py:207), Carpetas de opencode en singular (+5 more)

### Community 13 - "motion-design skill"
Cohesion: 0.22
Nodes (13): Declared duration scale, Easing curve set (entry, exit, loop), motion-design skill, Motion with semantic intent, prefers-reduced-motion fallback, Proportional stagger delay, Breakpoints reserved for structural change, clamp() for fluid typography and spacing (+5 more)

### Community 14 - "Honestidad de resultados: verificado / inferido / asumido"
Cohesion: 0.24
Nodes (12): Agente android (Sonnet), Fallo de entorno vs fallo de codigo, Evidencia de artefacto (android), Output filtrado en origen (android), Agente capacitor (Sonnet), iOS fuera de alcance en Windows (Capacitor), Agente desktop (Sonnet), Firma de codigo como paso opcional y explicito (+4 more)

### Community 15 - "graphify como capa 0 de recuperacion"
Cohesion: 0.20
Nodes (12): El grafo orienta, no autoriza, graphify como capa 0 de recuperacion, Hooks de automatizacion a coste cero de tokens, Backend claude-cli de graphify, Hook de graphify en modo nudge (no --strict), El paquete pip se llama graphifyy (dos ies), Boveda ANDROMEDA, Hook andromeda-context (+4 more)

### Community 16 - "Skill android-run: ejecutar y observar una app Android"
Cohesion: 0.20
Nodes (11): Skill android-run: ejecutar y observar una app Android, Arranque con monkey -p sin conocer la MainActivity, Captura de pantalla vía adb exec-out screencap, Sin logs observados no hay verificación, Ionic Appflow en wind-down: no recomendarlo, Bump de versión en package.json y build.gradle, Skill capacitor-release: release Capacitor firmado, iOS solo vía CI en la nube (Actions macOS, Codemagic) (+3 more)

### Community 17 - "Modelo orquestador y subagentes"
Cohesion: 0.20
Nodes (10): Agente architect (Opus), Caza activa de la sobre-ingenieria, Ajuste de doctrina por modelo, Protocolo NEPTUNO de alto rendimiento, El model: del subagente gana sobre el --model de la sesion, Economia de modelos por rol, Ecosistema NEPTUNO, MCP sequential-thinking (+2 more)

### Community 18 - "pr skill (create a Pull Request)"
Cohesion: 0.22
Nodes (10): Forward-looking token rules, Atomic commits, files added by name, gh --json/-q token rule, gh CLI under the user session, Never open a PR from the default branch, pr skill (create a Pull Request), Each layer leaves the repo working, pr-stack skill (stacked PRs) (+2 more)

### Community 19 - "Agente data-scientist (Sonnet)"
Cohesion: 0.25
Nodes (9): Validar en el borde y autorizar en el handler, Agente data-engineer (Sonnet), Grano explicito y cardinalidad de los JOIN, Idempotencia por diseno, Mirar los datos reales antes de escribir codigo, Anti-leakage como reflejo, Baseline primero, Agente data-scientist (Sonnet) (+1 more)

### Community 20 - "Skill a11y-review"
Cohesion: 0.33
Nodes (9): Agente critic (Opus), Ejercita el flujo real (un typecheck verde no es verificacion), Agente verifier (Sonnet), Skill a11y-review, Contraste de color WCAG, Navegacion por teclado y gestion del foco, Proceso de auditoria de accesibilidad, Autocritica antes de entregar (+1 more)

### Community 21 - "Skill apk-build: build de APK/AAB sin Android Studio"
Cohesion: 0.28
Nodes (9): Skill apk-build: build de APK/AAB sin Android Studio, Diagnóstico por el Caused by más profundo, Compilar con el wrapper de Gradle, nunca con gradle global, Regla de tokens: output de Gradle a archivo y filtrado, Verificación del artefacto por timestamp fresco, Skill desktop-build: build Electron/Tauri para Windows, Detección del framework por archivos reales, Regla de tokens: logs de build a archivo y filtrados (+1 more)

### Community 22 - "Skill capacitor-build: build web + sync nativo Capacitor"
Cohesion: 0.25
Nodes (9): npx cap sync: copy de assets + update de plugins nativos, Skill capacitor-build: build web + sync nativo Capacitor, Delegar el compile nativo en vez de duplicar Gradle, iOS no compilable desde Windows, webDir del config vs carpeta real del build web, npx cap doctor como chequeo oficial, Skill capacitor-doctor: doctor del entorno Capacitor, Desalineación de versiones @capacitor/cli, core y android (+1 more)

### Community 23 - "Agent assignment by task kind"
Cohesion: 0.25
Nodes (9): Delegate broad searches to a subagent, Agent assignment by task kind, Cold-start subagent prompt, Coordination cost rule, Critical integration of results, Independent, non-overlapping decomposition, parallel-split skill, No functional changes smuggled in (+1 more)

### Community 24 - "pr-merge skill"
Cohesion: 0.25
Nodes (9): Conflict resolution by rebase onto base, Merge strategy taken from the repo, Never use --admin on your own initiative, Post-merge stack warning, pr-merge skill, Three green lights before merge, Land the stack bottom-up with retargeting, restack with git rebase --update-refs (+1 more)

### Community 25 - "Agente frontend (Sonnet)"
Cohesion: 0.29
Nodes (8): Agente backend (Sonnet), El contrato manda (backend), Accesibilidad minima no negociable (frontend), El contrato manda (frontend), Agente frontend (Sonnet), Los 4 estados: loading, vacio, error, exito, HTML semantico primero, ARIA como ultimo recurso, Reglas del paralelismo de agentes

### Community 26 - "Constrained query expansion"
Cohesion: 0.32
Nodes (8): Answer only from what the graph contains, Auditable printed token expansion, BFS traversal mode, Constrained query expansion, DFS traversal mode, Token-budget aware ranked output, Node-label vocabulary extraction (.vocab.txt), Prompt techniques by failure mode

### Community 27 - "Agente debugger (Opus)"
Cohesion: 0.29
Nodes (7): Filtro del escenario de fallo concreto, Escepticismo estadistico, La causa debe explicar el 100% del sintoma, Agente debugger (Opus), Biseccion con hipotesis falsables, Medir el radio de explosion del patron defectuoso, Reproduce primero

### Community 28 - "memory"
Cohesion: 0.32
Nodes (7): MEMORY_FILE_PATH, npx, chrome-devtools, memory, sequential-thinking, @modelcontextprotocol/server-memory, @modelcontextprotocol/server-sequential-thinking

### Community 29 - "sync-global.js"
Cohesion: 0.17
Nodes (9): DST, fs, globalHooksDir, globalSettingsPath, masterSettings, os, pairs, path (+1 more)

### Community 30 - "Hivemind — Claude como corteza de un ecosistema multi-agente"
Cohesion: 0.07
Nodes (26): 1. Las cuatro capas del ecosistema agéntico, 2. La flota, 3. Tabla de enrutado, 4 bis. Intervenir: el trabajo del jefe no acaba en el encargo, 4. Protocolo de despacho, 5. Interoperabilidad: una doctrina, cuatro lectores, 6. Límites honestos, antigravity (`agy`) (+18 more)

### Community 31 - "Skill apk-release: release Android firmado"
Cohesion: 0.29
Nodes (7): Skill apk-release: release Android firmado, versionCode estrictamente creciente por subida, Credenciales de firma fuera de archivos versionados, Configuración de keystore y signingConfigs, Riesgo de minify/ProGuard sobre reflexión, Verificación de firma con apksigner, Síntoma WebView en blanco con proceso vivo

### Community 32 - "Skill desktop-doctor: doctor del entorno de escritorio"
Cohesion: 0.29
Nodes (7): electron-rebuild ante mismatch de NODE_MODULE_VERSION, ABI de módulos nativos vs versión de Electron, Skill desktop-doctor: doctor del entorno de escritorio, Toolchain Rust x86_64-pc-windows-msvc, signtool y certificados para firma de código, Visual Studio C++ Build Tools y linker MSVC, WebView2 Runtime como requisito de Tauri

### Community 33 - "self-review skill"
Cohesion: 0.29
Nodes (7): Leakage alarm signals, Consistency grep after renames, Logic and data edge-case checklist, Fidelity to the original request, Golden rule: suspect the review, not the code, Hostile review stance, self-review skill

### Community 34 - "release skill"
Cohesion: 0.33
Nodes (7): Description written from the real diff, Honest "how it was tested" section, Changelog traceable to commits and PRs, release skill, Semver deduced from commits, Signed release artifacts, Version synchronized in the code

### Community 35 - "Nunca inventes APIs"
Cohesion: 0.40
Nodes (6): Detectar el framework antes de asumir comandos, Patrones del repo primero, Agente implementer (Sonnet), Verificar algo tras cada edicion sustancial, Lee antes de editar, Nunca inventes APIs

### Community 36 - "graphify — grafo de conocimiento como capa 0 de recuperación"
Cohesion: 0.11
Nodes (17): 10. Comandos de consulta, 11. El filtro de sensibles y por qué la doc se llama `ECONOMIA-TOKENS.md`, 12. Cómo verificar, 1. Jerarquía de coste, revisada, 2. Instalación en esta máquina (estado real), 3. Backend de LLM: `claude-cli`, 4. Los tres grafos, 5. El hook PreToolUse (Claude Code) (+9 more)

### Community 37 - "Skill android-doctor: doctor del entorno Android"
Cohesion: 0.29
Nodes (7): Skill android-doctor: doctor del entorno Android, ANDROID_HOME / ANDROID_SDK_ROOT, JAVA_HOME apuntando al JBR de Android Studio, Aceptación de licencias del SDK Android, Tríada Gradle-AGP-JDK, Verificar cada fix re-ejecutando el chequeo fallido, Causa raíz demostrada, no síntoma

### Community 38 - "Logcat filtrado por PID (regla de tokens)"
Cohesion: 0.40
Nodes (5): Logcat filtrado por PID (regla de tokens), Skill context-prime: mapa del repo con mínimo coste, Consultar el grafo graphify antes de explorar, Nota ANDROMEDA del proyecto como base del mapa, Presupuesto de ~40 líneas: densidad sobre volumen

### Community 39 - "hooks/andromeda-context.js"
Cohesion: 0.33
Nodes (3): fs, os, path

### Community 40 - "Optimized prompt structure"
Cohesion: 0.67
Nodes (4): optimize-prompt skill, Prompt diagnosis (what is missing, what is filler), Optimized prompt structure, Self-sufficient prompt rule

### Community 41 - "plugins/andromeda-context.js"
Cohesion: 0.83
Nodes (3): AndromedaContext(), norm(), normPath()

### Community 46 - "hivemind.js"
Cohesion: 0.15
Nodes (13): AGENTS, [cmd, ...argv], commands, doctor(), ENV, fs, os, path (+5 more)

### Community 47 - "Jerarquia de coste de recuperacion"
Cohesion: 0.50
Nodes (5): Paso 0 de scout: el grafo antes que el grep, Agente scout (Haiku), Jerarquia de coste de recuperacion, Subagentes como cortafuegos de contexto, MCP graphify-mcp deliberadamente no registrado

### Community 48 - "Hivemind — tú decides y verificas; ellos ejecutan"
Cohesion: 0.18
Nodes (10): Hivemind — tú decides y verificas; ellos ejecutan, Paralelizar, Paso 0 — ¿esto se delega?, Paso 1 — estado de la flota, Paso 2 — enrutado por forma de tarea, Paso 3 — redactar el encargo, Paso 4 — despachar sin quemar contexto, Paso 5 — verificar (no es opcional) (+2 more)

### Community 49 - "sync-agents.js"
Cohesion: 0.18
Nodes (8): doctrina, fs, GLOBAL, nAgents, nSkills, os, path, SRC

### Community 51 - "Diagram Mermaid — el diagrama correcto, sintaxis verificada"
Cohesion: 0.20
Nodes (9): Diagram Mermaid — el diagrama correcto, sintaxis verificada, Dónde va el diagrama, Elección del tipo, Formato de entrega, Paso 0 — ¿merece un diagrama?, Reglas, Reglas de legibilidad (las que separan un diagrama útil de una maraña), Trampas de sintaxis que rompen el render (+1 more)

### Community 65 - "Code Standards — buenas prácticas medibles, no opiniones"
Cohesion: 0.25
Nodes (7): Code Standards — buenas prácticas medibles, no opiniones, Formato de entrega, Lo que NO es una falta, Los 8 controles (en orden de impacto), Proceso, Regla cero: el repo manda sobre el manual, Reglas

### Community 66 - "Translate & Localize — traducir la intención, no las palabras"
Cohesion: 0.25
Nodes (7): Localización de UI, Paso 0 — clasifica el texto antes de traducir, Proceso, Reglas, Reglas duras, Revisar una traducción existente, Translate & Localize — traducir la intención, no las palabras

### Community 67 - "Write Natural — prosa que no delata al modelo"
Cohesion: 0.25
Nodes (7): Ajuste por canal, Lo que sí hace la prosa humana, Los 12 tics que delatan a una IA (elimínalos siempre), Proceso, Reglas, Si el texto es en español, Write Natural — prosa que no delata al modelo

### Community 68 - "ANDROID.md — Doctrina Android por terminal"
Cohesion: 0.25
Nodes (7): 1. El mapa mental mínimo, 2. La tríada JDK ↔ Gradle ↔ AGP, 3. Diagnóstico de builds: sospechosos por síntoma, 4. Firma y releases, 5. adb: observar es verificar, 6. División del trabajo, ANDROID.md — Doctrina Android por terminal

### Community 69 - "Doctrina de Datos — análisis, ciencia e ingeniería"
Cohesion: 0.25
Nodes (7): Análisis (comandos: `/eda`, `/data-quality`), Ciencia / ML (comando: `/ml-experiment`), Doctrina de Datos — análisis, ciencia e ingeniería, Elección de agente/comando, Ingeniería (comandos: `/data-pipeline`, `/db-migration`, `/sql-optimize`), MCPs útiles para datos, Principios transversales (las 5 leyes)

### Community 74 - "Document Code — documentación derivada del código, no del deseo"
Cohesion: 0.29
Nodes (6): Document Code — documentación derivada del código, no del deseo, Los 5 formatos y cuándo usar cada uno, Plantillas, Proceso, Qué NO documentar, Reglas

### Community 75 - "AUTOMATION.md — Automatizaciones del ecosistema"
Cohesion: 0.29
Nodes (6): 1. Hooks — automatización a coste cero de tokens, 2. Loops — vigilancia dentro de la sesión, 3. Schedules — sesiones programadas (cron), 4. Headless — Claude como comando de tus scripts, 5. Matriz de decisión, AUTOMATION.md — Automatizaciones del ecosistema

### Community 76 - "CAPACITOR.md — Doctrina Capacitor/Ionic por terminal"
Cohesion: 0.29
Nodes (6): 1. El mapa mental mínimo, 2. Compatibilidad de versiones (Capacitor 8.x, vigente — verificado), 3. Diagnóstico: síntoma → causa → fix, 4. Release, 5. División del trabajo, CAPACITOR.md — Doctrina Capacitor/Ionic por terminal

### Community 85 - "DEBUGGING.md — Arsenal de depuración"
Cohesion: 0.33
Nodes (5): 1. Taxonomía de sospechosos por síntoma, 2. Técnicas, en orden de coste, 3. Disciplina de evidencia, 4. Anti-patrones (si te sorprendes haciéndolos, para), DEBUGGING.md — Arsenal de depuración

### Community 86 - "Doctrina de Diseño y Frontend — originalidad con sistema"
Cohesion: 0.33
Nodes (5): Cuándo NO aplican estas skills, Doctrina de Diseño y Frontend — originalidad con sistema, El principio rector: dirección antes que ejecución, Orden de trabajo recomendado, Reglas transversales

### Community 87 - "Doctrina de apps de escritorio (Electron / Tauri)"
Cohesion: 0.33
Nodes (6): Doctrina de apps de escritorio (Electron / Tauri), Electron vs Tauri, Verificación del instalador, Desajuste de ABI de Node en módulos nativos, Regla de tokens para logs de Rust/bundler, Firma de código en Windows

### Community 108 - "Theme Factory — temas curados, no hex al azar"
Cohesion: 0.40
Nodes (4): Catálogo de temas, Proceso, Regla, Theme Factory — temas curados, no hex al azar

### Community 124 - "Verificación end-to-end"
Cohesion: 0.50
Nodes (3): Proceso, Reglas, Verificación end-to-end

### Community 125 - "Write Tests — tests que fallan cuando deben"
Cohesion: 0.50
Nodes (3): Proceso, Reglas, Write Tests — tests que fallan cuando deben

## Ambiguous Edges - Review These
- `Forward-looking token rules` → `Duplication check before accepting new helpers`  [AMBIGUOUS]
  .claude/skills/self-review/SKILL.md · relation: conceptually_related_to
- `Selective manifest stamping` → `HANDOFF.md session handoff note`  [AMBIGUOUS]
  .claude/skills/graphify/references/update.md · relation: semantically_similar_to

## Knowledge Gaps
- **182 isolated node(s):** `@modelcontextprotocol/server-sequential-thinking`, `@modelcontextprotocol/server-memory`, `MEMORY_FILE_PATH`, `fs`, `path` (+177 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 363 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Forward-looking token rules` and `Duplication check before accepting new helpers`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Selective manifest stamping` and `HANDOFF.md session handoff note`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **Why does `Skill android-doctor: doctor del entorno Android` connect `Skill android-doctor: doctor del entorno Android` to `Skill desktop-doctor: doctor del entorno de escritorio`, `Skill android-run: ejecutar y observar una app Android`, `Skill apk-build: build de APK/AAB sin Android Studio`, `Skill capacitor-build: build web + sync nativo Capacitor`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `Skill debug: depuración sistemática` connect `Skill debug: depuración sistemática` to `Skill android-doctor: doctor del entorno Android`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `Forward-looking token rules` connect `pr skill (create a Pull Request)` to `Constrained query expansion`, `build_merge`, `Agent assignment by task kind`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `main()` (e.g. with `installGraphify()` and `installObsidianApp()`) actually correct?**
  _`main()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@modelcontextprotocol/server-sequential-thinking`, `@modelcontextprotocol/server-memory`, `MEMORY_FILE_PATH` to the rest of the system?**
  _182 weakly-connected nodes found - possible documentation gaps or missing edges._