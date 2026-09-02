---
description: Carga un mapa mental eficiente del repositorio al inicio de una sesión de trabajo, gastando el mínimo de tokens. Úsalo al empezar a trabajar en un proyecto o área nueva.
---

Argumentos recibidos (formato esperado: [área del repo (opcional)]): $ARGUMENTS

# Context Prime — mapa del terreno con mínimo coste

Construye el contexto esencial del proyecto (o del área indicada en los argumentos) SIN leer archivos enteros indiscriminadamente. Presupuesto objetivo: el mapa completo debe caber en ~40 líneas de notas.

## Proceso

0. **Nota ANDROMEDA primero** — si al inicio de sesión se inyectó la nota del proyecto (hook `andromeda-context`, prefijo `[hook NEPTUNO·ANDROMEDA]`), o existe `~/ANDROMEDA\01-Proyectos\<proyecto>.md`, pártela como base del mapa y ejecuta los pasos siguientes SOLO para lo que la nota no cubra o parezca desactualizado (contrasta su `ultima_modificacion` con el estado git). Si detectas que la nota miente sobre el estado real, corrígela (o anótalo para `/handoff`).
0.5. **El grafo, si existe** — si hay `graphify-out/graph.json` en el repo, este paso sustituye a la mitad de los siguientes por una fracción del coste:
   - `graphify god-nodes --top 10` → los hubs arquitectónicos: el esqueleto del proyecto en 10 líneas.
   - `graphify query "¿cuál es la arquitectura y los puntos de entrada?"` → subgrafo acotado.
   - `graphify-out/GRAPH_REPORT.md` solo si necesitas la panorámica en prosa; nunca antes de haber probado `query`.

   Con eso hecho, ejecuta los pasos 1-5 SOLO para lo que el grafo no cubra (comandos de build/test y estado git, que el grafo no conoce). Si NO hay grafo y el repo es grande y va a durar varias sesiones, propón construirlo: `graphify extract . --backend claude-cli` (ver `/home/jasen/.claude/docs/GRAPHIFY.md`).
1. **Estructura** — `Get-ChildItem` del raíz + Glob de los directorios de código principales (2 niveles). NO recursivo total.
2. **Identidad del proyecto** — Lee (si existen): `README.md` (primeras ~50 líneas), `package.json`/`pyproject.toml`/`Cargo.toml`/`*.csproj` (deps y scripts), `CLAUDE.md` del repo.
3. **Convenciones** — Abre UN archivo representativo del código principal y UNO de tests; anota estilo, framework de tests, patrones de import.
4. **Estado** — Si hay git: `git log --oneline -10` y `git status` para saber qué se está trabajando.
5. **Puntos de entrada** — Localiza el/los entry points (main, index, app) con Glob, sin leerlos enteros.

## Entrega

Resume en este formato (y NADA más — el valor está en la densidad):

```
## Mapa: <proyecto>
- Stack: <lenguaje, framework, gestor de paquetes, versión>
- Estructura: <3-6 líneas: qué vive dónde>
- Comandos: build=<cmd> test=<cmd> run=<cmd> lint=<cmd>
- Convenciones: <2-3 líneas: estilo, patrones, framework de tests>
- Estado actual: <rama, últimos commits relevantes, cambios sin commitear>
- Entry points: <rutas>
```

Si el repo tiene CLAUDE.md propio con esta información, no la re-derives: léelo y complementa solo lo que falte.

## Regla
Este mapa es para TI durante la sesión: mantenlo presente y no vuelvas a explorar lo ya mapeado. Si la sesión será larga, guarda el mapa en el scratchpad para recuperarlo tras una compactación.
