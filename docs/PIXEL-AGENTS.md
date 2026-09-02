# Pixel Agents — la interfaz visual del hivemind

[Pixel Agents](https://github.com/pixel-agents-hq/pixel-agents) (MIT) convierte cada agente de
Claude Code en un personaje pixel-art dentro de una oficina: caminan a su mesa, teclean cuando
editan archivos, leen cuando buscan, y levantan un bocadillo cuando están **bloqueados esperándote**.

Para NEPTUNO su valor no es decorativo: cuando repartes trabajo entre subagentes y la flota externa,
el cuello de botella deja de ser el trabajo y pasa a ser **saber quién está parado**. Eso es
exactamente lo que esta interfaz muestra de un vistazo.

## Arrancar

Servidor local, desde la carpeta cuyas sesiones quieras ver:

```bash
pixel-agents --port 3100          # instalado global con: npm install --global pixel-agents
```

Imprime una URL con `?token=`. **Trata esa URL como un secreto**: el token es una capacidad al
portador, no una prueba de estar en local — quien lo tenga puede aprobar la instalación del hook
desde cualquier sitio que alcance el servidor. Sin token se puede mirar la oficina, pero no tocar
los hooks. Por defecto escucha en `127.0.0.1`; `--host 0.0.0.0` lo expone a la red local.

También existe como extensión de VS Code, y las dos pueden convivir: cada servidor se registra en
`~/.pixel-agents/servers/` y el hook manda los eventos a todos los registros activos.

## La trampa que había que resolver antes de instalarlo

Pixel Agents funciona por **hooks**: copia su script a `~/.claude/pixel-agents-hook.js` y se engancha
a nueve eventos (`SessionStart`, `SessionEnd`, `Stop`, `PermissionRequest`, `Notification`,
`PreToolUse`, `PostToolUse`, `SubagentStop`, `UserPromptSubmit`) escribiendo en la clave `hooks` del
`~/.claude/settings.json`.

Y ahí chocaba de frente con NEPTUNO: **`tools/sync-global.js` reemplazaba esa clave entera** en cada
ejecución. El primer `node tools/sync-global.js` después de instalar la interfaz habría borrado sus
nueve hooks — en silencio, sin error, y con la oficina quedándose vacía sin explicación.

Arreglado de raíz, y para cualquier tercero, no solo para este: `sync-global.js` **fusiona** en vez de
reemplazar. Reescribe los hooks que gestiona NEPTUNO (los que apuntan a su carpeta de hooks o a
`graphify hook-guard`) y **conserva intacto todo lo demás**. Verificado simulando los nueve hooks de
pixel-agents y ejecutando el resync: sobreviven 9/9, los 5 de NEPTUNO siguen ahí, y una segunda
pasada no duplica nada.

Si algún día un hook ajeno desaparece tras un resync, el sospechoso es esa función `esDeNeptuno`:
está clasificando como propio algo que no lo es.

## Qué se ve y qué no

| | En la oficina |
|---|---|
| Sesiones de Claude Code | **sí** — una por terminal, cada una su personaje |
| Subagentes de NEPTUNO (`scout`, `critic`, `delegate`…) | **sí** — como personajes efímeros aparte |
| Teammates persistentes | sí, con su rol y su ciclo de vida |
| **La flota externa** (`opencode`, `agy`, `devin`) | **no** |

La última fila importa: hoy el único proveedor implementado es Claude Code, así que un encargo
despachado con `hivemind.js run` **no aparece**. Lo que sí verás es al agente `delegate` mientras lo
supervisa, porque ese sí es una sesión de Claude Code. Para el estado real de la flota sigue siendo
`node tools/hivemind.js doctor` y los logs de `.hivemind/runs/`.

No es un límite permanente: el proyecto define una interfaz `HookProvider` donde añadir una CLI nueva
es «un subdirectorio, no una reescritura», y lo señalan como el sitio donde más falta ayuda. Portar
la flota de NEPTUNO ahí es un candidato real, no una fantasía — pero es trabajo, y no está hecho.

## Notas de operación

- **Modo heurístico**: si los hooks no están disponibles, infiere el estado leyendo los transcripts
  JSONL de `~/.claude/projects/`. Funciona, pero con menos detalle y más retraso.
- **Ver sesiones de otros proyectos**: `Settings → Watch All Sessions`.
- `--no-terminal` desactiva el terminal embebido: mirar sin poder lanzar ni adjuntar agentes.
- No modifica Claude Code. Sus datos viven en `~/.pixel-agents/` y su hook en `~/.claude/`.
