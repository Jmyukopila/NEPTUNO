# Graph Report - NEPTUNO  (2026-08-25)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 296 nodes · 416 edges · 40 communities (17 shown, 23 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.81)
- Token cost: 53,022 input · 616 output

## Community Hubs (Navigation)
- Core Execution Doctrine
- Token Economy & Knowledge Graph Docs
- End-to-End Workflow Recipes
- Full-Stack Design & Planning
- Opencode Sync Script
- Graphify Extraction Reference
- Mobile & Desktop Build Doctrine
- Session Hooks & Opencode Layer
- Mobile Build Skills & Agents
- Frontend Visual Design Skills
- Debugging & Architecture Agents
- Backend/Frontend Feature Agents
- MCP Server Config
- Desktop App Skills
- Andromeda Context Plugin
- Environment Doctor Skills
- Secret Protection Hook
- Android & Capacitor Agents
- Adversarial Review Agent
- Data Pipeline Engineering
- Data Science & EDA
- Refactor & Test Skills
- Data Engineer Agent
- Data Scientist Agent
- Desktop Agent
- React Native Agent
- Implementer Agent
- Verifier Agent
- Data Quality Skill
- Figma-to-Code Skill
- Desktop Doctor Skill
- Desktop Release Skill
- Desktop Run Skill
- Expo Release Skill
- Expo Run Skill
- Figma-to-Code Skill Doc
- Motion Design Skill
- Prompt Optimization Skill
- Responsive Grid Skill

## God Nodes (most connected - your core abstractions)
1. `NEPTUNO — Protocolo de ejecución de alto rendimiento (CLAUDE.md)` - 26 edges
2. `GRAPHIFY.md — grafo de conocimiento como capa 0 de recuperación` - 20 edges
3. `HANDOFF.md — nota de traspaso del ecosistema` - 19 edges
4. `graphify skill` - 14 edges
5. `README — Manual del ecosistema NEPTUNO` - 13 edges
6. `WORKFLOWS.md — Recetas end-to-end` - 11 edges
7. `ECONOMIA-TOKENS.md — Economía de tokens` - 11 edges
8. `Skill: /android-doctor` - 8 edges
9. `Skill: /android-run` - 8 edges
10. `DESIGN.md — Doctrina de diseño y frontend` - 8 edges

## Surprising Connections (you probably didn't know these)
- `optimize-tokens skill` --semantically_similar_to--> `Regla de tokens: JSON filtrado (--json … -q)`  [INFERRED] [semantically similar]
  .claude/skills/optimize-tokens/SKILL.md → docs/GITHUB.md
- `graphify reference: commit hook and CLAUDE.md integration` --semantically_similar_to--> `Hooks — automatización a coste cero de tokens`  [INFERRED] [semantically similar]
  .claude/skills/graphify/references/hooks.md → docs/AUTOMATION.md
- `Skill: /context-prime` --references--> `HANDOFF.md — nota de traspaso del ecosistema`  [AMBIGUOUS]
  .claude/skills/context-prime/SKILL.md → HANDOFF.md
- `Bisección espacial y temporal (git bisect run)` --semantically_similar_to--> `ml-experiment skill`  [INFERRED] [semantically similar]
  docs/DEBUGGING.md → .claude/skills/ml-experiment/SKILL.md
- `pr-stack skill` --implements--> `Técnica de stacked PRs con git puro`  [INFERRED]
  .claude/skills/pr-stack/SKILL.md → docs/GITHUB.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Flujo de caza y resolución de bugs con evidencia** — claude_skills_bug_hunt_skill, claude_skills_debug_skill, claude_agents_debugger, claude_agents_critic, claude_agents_scout [EXTRACTED 0.85]
- **graphify como capa 0 de recuperación: doctrina, hook, agente y skills enganchados** — docs_graphify, docs_economia_tokens_jerarquia_coste, docs_graphify_hook_pretooluse, agent_scout, skill_context_prime, skill_verify_work, claude_reglas_lectura [EXTRACTED 0.85]
- **Pipeline de dirección de arte contra el 'look de IA'** — claude_skills_frontend_design_skill, claude_skills_editorial_layout_skill, claude_skills_figma_to_code_skill, claude_skills_a11y_review_skill, claude_agents_frontend [EXTRACTED 0.85]
- **Cadena típica de subagentes: scout → architect → backend/frontend → verifier → critic** — agent_scout, agent_architect, agent_backend, agent_frontend, agent_verifier, agent_critic, readme_paralelismo_subagentes [EXTRACTED 0.90]
- **Ciclo cerrado de memoria entre sesiones (handoff ↔ bóveda ↔ grafo)** — claude_skills_handoff_handoff, handoff, tools_hooks_handoff_reminder, tools_hooks_andromeda_context, andromeda_vault, docs_graphify, claude_neptuno_doctrine [EXTRACTED 0.90]
- **Cadena de diseño: dirección → tema → retícula → movimiento** — docs_design_design, docs_design_direction_before_execution, _claude_skills_theme_factory_skill_theme_factory, _claude_skills_responsive_grid_skill_responsive_grid, _claude_skills_motion_design_skill_motion_design, _claude_skills_generative_art_skill_generative_art [EXTRACTED 0.90]
- **Ciclo de vida de un PR con gh (crear → apilar → mergear → liberar)** — docs_github_github, _claude_skills_pr_skill_pr, _claude_skills_pr_stack_skill_pr_stack, _claude_skills_pr_merge_skill_pr_merge, _claude_skills_release_skill_release [EXTRACTED 0.95]
- **Graphify build pipeline (detect → extract → build → cluster → export)** — _claude_skills_graphify_skill_graphify, _claude_skills_graphify_skill_ast_extraction, _claude_skills_graphify_skill_semantic_extraction, _claude_skills_graphify_references_extraction_spec_extraction_spec, _claude_skills_graphify_skill_semantic_cache, _claude_skills_graphify_skill_shrink_guard, _claude_skills_graphify_skill_graph_health_check, _claude_skills_graphify_references_update_update [EXTRACTED 0.95]

## Communities (40 total, 23 thin omitted)

### Community 0 - "Core Execution Doctrine"
Cohesion: 0.06
Nodes (37): Agente debugger (Opus), Ajuste por modelo (Haiku / Sonnet / Opus), Honestidad de resultados (verificado vs inferido vs asumido), NEPTUNO — Protocolo de ejecución de alto rendimiento (CLAUDE.md), ANDROID.md — Doctrina Android por terminal, AUTOMATION.md — Automatizaciones del ecosistema, Headless — claude -p como paso de script, Loops — vigilancia dentro de la sesión (+29 more)

### Community 1 - "Token Economy & Knowledge Graph Docs"
Cohesion: 0.07
Nodes (46): Agente implementer (Sonnet), Agente scout (Haiku), Agente verifier (Sonnet), Bóveda ANDROMEDA (C:\ANDROMEDA), Reglas de lectura antes de escribir, Skill: /context-prime, Skill /handoff, Paso: refrescar el grafo con graphify update (+38 more)

### Community 2 - "End-to-End Workflow Recipes"
Cohesion: 0.12
Nodes (25): Prevención de data leakage, ml-experiment skill, optimize-prompt skill, optimize-tokens skill, Subtareas independientes y con archivos disjuntos, parallel-split skill, Tests de caracterización previos al refactor, refactor skill (+17 more)

### Community 3 - "Full-Stack Design & Planning"
Cohesion: 0.11
Nodes (19): Agente architect (Opus), Agente backend (Sonnet), Agente frontend (Sonnet), Ciclo ENTENDER → PLANIFICAR → EJECUTAR → VERIFICAR, DESIGN.md — Doctrina de diseño, FULLSTACK.md — Doctrina full stack por capa, Bucle de realimentación (save-result / reflect), MCP chrome-devtools (+11 more)

### Community 4 - "Opencode Sync Script"
Cohesion: 0.13
Nodes (14): BASH_TOOLS, buildAgents(), buildCommands(), EDIT_TOOLS, fs, nAgents, nCommands, parseFrontmatter() (+6 more)

### Community 5 - "Graphify Extraction Reference"
Cohesion: 0.15
Nodes (20): graphify reference: add URL and watch folder, graphify reference: extra exports and benchmark, Confidence rubric (EXTRACTED/INFERRED/AMBIGUOUS), graphify reference: extraction subagent prompt, Node ID format rule, Verbatim source_file rule, graphify reference: GitHub clone and cross-repo merge, graphify reference: commit hook and CLAUDE.md integration (+12 more)

### Community 6 - "Mobile & Desktop Build Doctrine"
Cohesion: 0.21
Nodes (17): Graphify honesty rules, pr-merge skill, pr skill, pr-stack skill, release skill, Veredicto VERIFICADO | PARCIAL | FALLA, ANDROID.md — Doctrina Android por terminal, Tríada JDK ↔ Gradle ↔ AGP (+9 more)

### Community 7 - "Session Hooks & Opencode Layer"
Cohesion: 0.13
Nodes (12): Compatibilidad opencode (§9 de la doctrina), Hooks — automatización a coste cero de tokens, El hook no se portó a plugin de opencode, OPENCODE.md — Compatibilidad con opencode, El model pinneado en un subagente gana sobre --model de sesión, Skill /context-prime, fs, path (+4 more)

### Community 8 - "Mobile Build Skills & Agents"
Cohesion: 0.34
Nodes (15): Agent: android, Agent: capacitor, Agent: react-native, Skill: /android-doctor, Skill: /android-run, Skill: /apk-build, Skill: /apk-release, Skill: /capacitor-build (+7 more)

### Community 9 - "Frontend Visual Design Skills"
Cohesion: 0.31
Nodes (10): Familias de algoritmos generativos, generative-art skill, motion-design skill, Escalado continuo con clamp() y container queries, responsive-grid skill, Catálogo de 5 temas curados, theme-factory skill, DESIGN.md — Doctrina de diseño y frontend (+2 more)

### Community 11 - "Debugging & Architecture Agents"
Cohesion: 0.32
Nodes (8): Agent: architect, Agent: critic, Agent: debugger, Agent: scout, Skill: /bug-hunt, Skill: /debug, Skill: /deep-plan, Skill: /fable-mode

### Community 12 - "Backend/Frontend Feature Agents"
Cohesion: 0.36
Nodes (8): Agent: backend, Agent: frontend, Skill: /a11y-review, Skill: /api-contract, Skill: /db-migration, Skill: /editorial-layout, Skill: /frontend-design, Skill: /full-stack-feature

### Community 13 - "MCP Server Config"
Cohesion: 0.32
Nodes (7): MEMORY_FILE_PATH, cmd, chrome-devtools, memory, sequential-thinking, @modelcontextprotocol/server-memory, @modelcontextprotocol/server-sequential-thinking

### Community 14 - "Desktop App Skills"
Cohesion: 0.90
Nodes (5): Agent: desktop, Skill: /desktop-build, Skill: /desktop-doctor, Skill: /desktop-release, Skill: /desktop-run

### Community 15 - "Andromeda Context Plugin"
Cohesion: 0.83
Nodes (3): AndromedaContext(), norm(), normPath()

### Community 16 - "Environment Doctor Skills"
Cohesion: 0.67
Nodes (3): Skill /android-doctor, Skill /capacitor-doctor, Skill /expo-doctor

## Ambiguous Edges - Review These
- `Skill: /context-prime` → `HANDOFF.md — nota de traspaso del ecosistema`  [AMBIGUOUS]
  .claude/skills/context-prime/SKILL.md · relation: references

## Knowledge Gaps
- **100 isolated node(s):** `fs`, `globalSettingsPath`, `masterSettings`, `pairs`, `path` (+95 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Skill: /context-prime` and `HANDOFF.md — nota de traspaso del ecosistema`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `Hooks — automatización a coste cero de tokens` connect `Session Hooks & Opencode Layer` to `Core Execution Doctrine`, `Graphify Extraction Reference`?**
  _High betweenness centrality (0.243) - this node is a cross-community bridge._
- **Why does `graphify skill` connect `Graphify Extraction Reference` to `Mobile & Desktop Build Doctrine`?**
  _High betweenness centrality (0.239) - this node is a cross-community bridge._
- **Why does `graphify reference: commit hook and CLAUDE.md integration` connect `Graphify Extraction Reference` to `Session Hooks & Opencode Layer`?**
  _High betweenness centrality (0.231) - this node is a cross-community bridge._
- **What connects `fs`, `globalSettingsPath`, `masterSettings` to the rest of the system?**
  _100 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core Execution Doctrine` be split into smaller, more focused modules?**
  _Cohesion score 0.06006006006006006 - nodes in this community are weakly interconnected._
- **Should `Token Economy & Knowledge Graph Docs` be split into smaller, more focused modules?**
  _Cohesion score 0.06547619047619048 - nodes in this community are weakly interconnected._