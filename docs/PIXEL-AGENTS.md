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
node tools/pixel-bridge.js preparar   # una vez: enciende "Watch All Sessions" (ver abajo)
pixel-agents --port 3100              # instalado global con: npm install --global pixel-agents
```

`preparar` es obligatorio la primera vez y hay que hacerlo **antes** de arrancar el servidor: el
ajuste se lee al arrancar. Sin él la flota externa no aparece nunca, por la razón que explica la
sección del puente. Es idempotente y es el mismo interruptor que `Settings → Watch All Sessions`.

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

## Qué se ve

| | En la oficina |
|---|---|
| Sesiones de Claude Code | sí — una por terminal, cada una su personaje |
| Subagentes de NEPTUNO (`scout`, `critic`, `delegate`…) | sí — como personajes efímeros aparte |
| Teammates persistentes | sí, con su rol y su ciclo de vida |
| **La flota externa** (`opencode`, `agy`, `devin`) | **sí, vía `tools/pixel-bridge.js`** |

## El puente: cómo se ve la flota sin forkear nada

Pixel Agents solo implementa un proveedor, Claude Code, así que un `hivemind.js run` no aparecería
nunca. La salida obvia era forkear un proyecto de 9.000 estrellas y mantener el fork. No hizo falta.

Su hook no hace nada mágico: descubre los servidores vivos en `~/.pixel-agents/servers/` y les hace
POST del payload de hook **tal cual**.

```
POST http://127.0.0.1:<puerto>/api/hooks/claude
Authorization: Bearer <token del registro>
body: el evento de hook de Claude Code, verbatim
```

Así que `tools/pixel-bridge.js` emite esos mismos eventos por cada agente externo, con su propio
`session_id` — y por tanto su propio personaje. El servidor no distingue quién los originó, ni
necesita distinguirlo. Cero cambios en pixel-agents, cero fork que mantener.

El mapeo sale de leer `normalizeHookEvent` en su bundle, que exige `hook_event_name` y `session_id`
como cadenas y de ahí ramifica:

| Evento emitido | Cuándo | Qué se ve |
|---|---|---|
| `SessionStart` (`cwd`, `source`) | al despachar | **nada todavía**: deja la sesión *pendiente* |
| `PreToolUse` (`tool_name`, `tool_input`) | acto seguido | **confirma la pendiente y aparece** el personaje, tecleando |
| `PostToolUse` + `PreToolUse` | cada 3 s mientras dura | sigue tecleando, con los segundos transcurridos |
| `PostToolUse` | al terminar | acaba la herramienta |
| `Stop` | si salió `ok` | fin de turno, se queda tranquilo |
| `Notification` (`idle_prompt`) | si salió mal | **bocadillo: te está reclamando** |
| `SessionEnd` (`reason`) | siempre | se marcha, con el estado como motivo |

Esa penúltima fila es el punto: un despacho que falló por permisos, timeout o error **levanta la mano
en la oficina** en vez de irse callado. Es exactamente cuando quieres mirar la pantalla.

Funciona en los dos transportes: `hivemind.js run` y `hivemind.js session`. `doctor` dice si hay
servidor escuchando.

### Las tres condiciones que no son obvias

Nada de esto sale del README de pixel-agents; sale de leer su bundle y de comprobarlo contra el
servidor de verdad. Las tres se descubrieron fallando.

**1. `SessionStart` no crea a nadie.** Solo guarda la sesión como *pendiente*. Es el evento
siguiente el que llama a `confirmPending` y crea el personaje. Un puente que emitiera únicamente
`SessionStart` recibiría `200 ok` y no vería aparecer a nadie.

**2. Sin "Watch All Sessions" la sesión pendiente se descarta.** Al confirmar, el servidor adopta la
sesión solo si `isTrackedProject(dir)` — es decir, si ya existe un personaje con ese mismo
`projectDir` — **o** si el ajuste está encendido. Un agente de la flota arranca en frío y nunca
cumple lo primero, así que sin el interruptor el servidor registra
`external session ... not adopted (project untracked, Watch All Sessions off)` y devuelve `200`
igualmente. Ese `200` es lo que hace que el fallo parezca un éxito. De ahí `preparar`.

**3. Sin `transcript_path` es mejor, no peor.** Si el evento no trae transcript, el servidor toma la
rama *hooks-only*: crea un agente externo a partir del `cwd` a secas, sin tocar el disco ni esperar
un JSONL que la flota no tiene. Por eso el puente **no** manda `transcript_path`, y por eso no hace
falta inventar transcripts falsos en `~/.claude/projects/`.

### El nombre y el latido

La oficina rotula al personaje con `basename(cwd)`. Si los tres agentes reportaran el directorio real
del repo, los tres saldrían llamándose `NEPTUNO`; por eso cada uno reporta un escritorio propio bajo
`.hivemind/oficina/<agente>` y sale como `opencode`, `antigravity` o `devin`. Es una etiqueta: en la
rama *hooks-only* ese `projectDir` no se lee del disco.

El servidor marca al personaje como *esperando* tras **5 segundos** sin eventos. Un encargo a la
flota dura minutos sin producir ni un hook, así que sin más el agente saldría ocioso justo mientras
trabaja. El puente lanza un **latido** en un proceso aparte (`pixel-bridge.js latido`, `detached`)
que cada 3 s cierra la herramienta anterior y abre otra con los segundos transcurridos. Va en otro
proceso por la misma razón de siempre: el despacho bloquea el bucle de eventos. El hijo se apaga solo
si el padre muere de golpe, así que un `SIGKILL` del tope duro no deja personajes fantasma.

### Cómo se comprueba que funciona

No sirve un doble de pruebas escrito por uno mismo: acepta cualquier cosa y solo demuestra que el
puente cumple el contrato HTTP, no que aparezca nadie. Hay que leer el estado real del servidor por
WebSocket, que es lo mismo que ve el navegador:

```
ws://127.0.0.1:<puerto>/ws?token=<token del registro>
{"type":"webviewReady"}   ->   existingAgents / agentCreated / agentStatus / agentToolStart
```

`agentCreated` con `isExternal` y `folderName`, y `agentStatus` en `active`, son la evidencia. El
log del servidor lo dice también en claro: `Hook: Agent N - detected hooks-only external session`.

### La trampa que costó encontrar

La primera versión emitía por HTTP asíncrono desde `hivemind.js` y entregaba **cero eventos** con un
servidor vivo escuchando. Causa: `spawnSync` **bloquea el bucle de eventos de Node**, así que el POST
lanzado antes del despacho no llega a ejecutarse nunca, y el `process.exit()` del final lo mata antes
de salir. Por eso el puente se invoca como **proceso hijo síncrono** (`inicio` / `fin`, una fase por
invocación) en vez de como una promesa suelta. Si alguna vez añades emisiones nuevas, ten esto
presente: cualquier `await` alrededor de un `spawnSync` es una promesa que no se va a cumplir.

Y una regla dura: **esto es decoración**. Si no hay servidor, si el POST falla o si el registro está
corrupto, el puente se calla y devuelve. Se salta incluso el spawn cuando no hay ningún servidor
vivo, para no pagar un proceso por nada. Un fallo de la interfaz nunca puede tumbar un despacho.

## Notas de operación

- **Modo heurístico**: si los hooks no están disponibles, infiere el estado leyendo los transcripts
  JSONL de `~/.claude/projects/`. Funciona, pero con menos detalle y más retraso.
- **Watch All Sessions**: además de ser obligatorio para la flota, hace que la oficina adopte
  sesiones de Claude Code de **cualquier** proyecto de la máquina, no solo de este. Es local: el
  servidor lee transcripts, no los manda a ningún sitio (ver la nota de privacidad).
- `--no-terminal` desactiva el terminal embebido: mirar sin poder lanzar ni adjuntar agentes.
- No modifica Claude Code. Sus datos viven en `~/.pixel-agents/` y su hook en `~/.claude/`.

## Privacidad: qué se comprobó y cómo repetirlo

La interfaz ve los transcripts de Claude Code, así que la pregunta "¿esto manda mi código a algún
sitio?" hay que responderla con evidencia, no con confianza. Lo comprobado, en el paquete instalado
(`pixel-agents` 1.4.1) y contra el servidor corriendo:

- **Estático**: la única URL del bundle es `http://localhost`. Cero primitivas de salida a red —
  ni `fetch`, ni `https.request`, ni `axios`/`undici`, ni cliente WebSocket, ni `dns.`. Los hosts
  son `127.0.0.1` o caen a él por defecto. Sin telemetría, sin analítica, sin recursos remotos en
  la interfaz. Las dependencias son Fastify y tres plugins suyos.
- **En ejecución**: escucha **solo** en `127.0.0.1:<puerto>`; las únicas conexiones son
  loopback→loopback (el navegador). Cero conexiones remotas, antes y después de despachar.

Repetirlo cuesta un comando, y conviene hacerlo tras cada actualización del paquete:

```bash
PID=$(grep -ho '"pid"[: ]*[0-9]*' ~/.pixel-agents/servers/*.json | grep -o '[0-9]*')
ss -tnp | grep "pid=$PID" | grep -vE '127\.0\.0\.1|\[::1\]'   # vacío = ninguna conexión remota
```

`tools/pixel-watch.sh` deja esa vigilancia corriendo y avisa de cualquier conexión no-loopback.

Dos cosas que sí salen de la máquina, y no son de pixel-agents: **los encargos que despachas a la
flota** viajan a los proveedores de `opencode`, `agy` y `devin`. Por eso los encargos del hivemind
prohíben explícitamente volcar el contenido de los transcripts, que son conversaciones privadas.

Y el token: la URL con `?token=` es una **capacidad al portador**. El servidor solo escucha en
loopback, así que su alcance desde fuera es nulo, pero quien lo tenga y alcance el puerto puede
aprobar la instalación del hook. Se rota reiniciando el servidor.
