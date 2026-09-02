#!/usr/bin/env node
// NEPTUNO · Puente a Pixel Agents — hace visible la flota externa en la oficina.
//
// Pixel Agents solo implementa un proveedor: Claude Code. Un encargo despachado a opencode,
// antigravity o devin no aparecería nunca. Pero su hook no hace nada mágico: descubre los
// servidores vivos en ~/.pixel-agents/servers/ y les hace POST del payload de hook tal cual.
//
//   POST http://127.0.0.1:<port>/api/hooks/claude
//   Authorization: Bearer <token del registro>
//   body: el evento de hook de Claude Code, verbatim
//
// Así que en vez de forkear un proyecto de 9k estrellas y mantener el fork, emitimos nosotros
// esos eventos por cada agente externo: cada uno recibe su propio session_id y por tanto su
// propio personaje. El servidor no distingue —ni necesita distinguir— quién los originó.
//
// Verificado leyendo `normalizeHookEvent` del bundle: exige `hook_event_name` y `session_id`
// como cadenas, y de ahí ramifica. Los eventos que usamos y lo que provocan:
//
//   SessionStart  (cwd, source)         -> aparece el personaje
//   PreToolUse    (tool_name, tool_input) -> teclea o lee, según la herramienta
//   PostToolUse                          -> termina la herramienta
//   Notification  (notification_type)    -> "idle_prompt" = bocadillo de "te espera"
//   Stop                                 -> fin de turno
//   SessionEnd    (reason)               -> se marcha
//
// REGLA DURA: esto es decoración. Si no hay servidor, si el POST falla o si el registro está
// corrupto, se calla y devuelve false. Un fallo de la interfaz NUNCA puede romper un despacho.
//
// POR QUÉ HAY SUBCOMANDOS `inicio` y `fin`: quien despacha usa `spawnSync`, que BLOQUEA el
// bucle de eventos de Node. Un POST asíncrono lanzado antes del spawn no llega a ejecutarse
// nunca, y el `process.exit()` del final lo mata antes de salir — verificado: cero eventos
// entregados con un servidor vivo escuchando. La solución es que el emisor sea un proceso
// hijo síncrono, así que estas dos entradas hacen cada fase completa en una sola invocación.
//
// Uso (CLI):
//   node tools/pixel-bridge.js preparar          (obligatorio ANTES de arrancar el servidor)
//   node tools/pixel-bridge.js url               (la URL con su token; rota en cada arranque)
//   node tools/pixel-bridge.js poblar            (sienta a los 3 ociosos, sin esperar un encargo)
//   node tools/pixel-bridge.js retirar [agente…] (los echa de la oficina; sin args, a los tres)
//   node tools/pixel-bridge.js servers
//   node tools/pixel-bridge.js inicio --session <id> --agente <n> --cwd <d> --encargo "..."
//   node tools/pixel-bridge.js fin    --session <id> --cwd <d> --estado ok
//   node tools/pixel-bridge.js emit SessionStart --session neptuno-agy --cwd .
'use strict';
const fs = require('fs');
const http = require('http');
const os = require('os');
const { spawn } = require('child_process');
const path = require('path');

const REGISTRY = path.join(os.homedir(), '.pixel-agents', 'servers');
const LEGACY = path.join(os.homedir(), '.pixel-agents', 'server.json');
const RUTA = '/api/hooks/claude';
const PROTOCOLO = 1;

const vivo = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };
const valido = (e) =>
  e && Number.isSafeInteger(e.port) && e.port > 0 && e.port < 65536 &&
  Number.isSafeInteger(e.pid) && e.pid > 0 && typeof e.token === 'string' && e.token.length > 0;

// Mismo descubrimiento que hace el hook oficial: registros vivos, y el server.json antiguo
// como respaldo. Un PID muerto se ignora — si no, cada despacho esperaría 2 s a un puerto
// que ya no escucha.
function servidores() {
  const encontrados = [];
  try {
    for (const f of fs.readdirSync(REGISTRY).filter((n) => n.endsWith('.json'))) {
      try {
        const e = JSON.parse(fs.readFileSync(path.join(REGISTRY, f), 'utf8'));
        if (valido(e) && e.protocol === PROTOCOLO && vivo(e.pid)) encontrados.push(e);
      } catch {}
    }
  } catch {}
  if (!encontrados.length) {
    try {
      const e = JSON.parse(fs.readFileSync(LEGACY, 'utf8'));
      if (valido(e) && vivo(e.pid)) encontrados.push(e);
    } catch {}
  }
  return encontrados;
}

function postear(servidor, cuerpo) {
  return new Promise((listo) => {
    try {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: servidor.port,
          path: RUTA,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(cuerpo),
            Authorization: `Bearer ${servidor.token}`,
          },
          timeout: 2000,
        },
        (res) => { res.resume(); listo(res.statusCode >= 200 && res.statusCode < 300); }
      );
      req.on('error', () => listo(false));
      req.on('timeout', () => { req.destroy(); listo(false); });
      req.end(cuerpo);
    } catch { listo(false); }
  });
}

// Emite un evento a todos los servidores vivos. Nunca lanza: devuelve a cuántos llegó.
async function emitir(evento, campos = {}) {
  const destinos = servidores();
  if (!destinos.length) return 0;
  const cuerpo = JSON.stringify({ hook_event_name: evento, ...campos });
  const r = await Promise.all(destinos.map((s) => postear(s, cuerpo)));
  return r.filter(Boolean).length;
}

// Ciclo de vida de un encargo a un agente externo, tal como lo ve la oficina.
const AGENTE_MODELO = { opencode: 'opencode', antigravity: 'antigravity (agy)', devin: 'devin' };

// Un session_id ESTABLE por agente, no uno por despacho: el personaje sobrevive al encargo y el
// siguiente lo reutiliza, en vez de acumular un escritorio muerto por cada `run`. El precio es
// que dos despachos simultaneos al mismo agente comparten personaje (el texto se alterna); en
// este flujo no pasa, porque quien despacha usa `spawnSync` y bloquea.
function sesionDe(agente) {
  return `neptuno-${String(agente || 'externo').replace(/[^\w.-]+/g, '-')}`;
}

// La oficina rotula al personaje con `basename(cwd)`. Si los tres agentes reportan el directorio
// real del repo, los tres salen llamandose igual; por eso cada uno reporta un escritorio propio
// bajo `.hivemind/oficina/<agente>`. Es una etiqueta, no una ruta que se lea: en la rama
// "hooks-only" del servidor `projectDir` no se toca el disco.
function escritorio(agente, cwd) {
  const raiz = path.resolve(cwd || process.cwd());
  const nombre = String(agente || 'externo').replace(/[^\w.-]+/g, '-');
  return path.join(raiz, '.hivemind', 'oficina', nombre);
}

async function despachoIniciado({ sesion, agente, cwd, encargo }) {
  cwd = escritorio(agente, cwd);
  await emitir('SessionStart', { session_id: sesion, cwd, source: `neptuno-hivemind:${agente}` });
  // La herramienta se llama como el agente para que el nombre salga en la oficina, y el
  // "comando" es el encargo recortado: es lo que hace que el personaje teclee.
  await emitir('PreToolUse', {
    session_id: sesion,
    cwd,
    tool_name: 'Bash',
    tool_input: { command: `${AGENTE_MODELO[agente] || agente}: ${String(encargo).replace(/\s+/g, ' ').slice(0, 120)}` },
  });
  return true;
}

// El servidor marca al personaje como "esperando" tras 5 s sin eventos (constante Pt del
// bundle). Un encargo a la flota dura minutos sin producir hooks, asi que sin latido el agente
// sale ocioso justo mientras trabaja. Cada latido cierra la herramienta anterior y abre otra:
// el servidor genera su propio toolId e ignora el que le mandes, asi que el PostToolUse previo
// es lo unico que evita que se acumulen filas de herramientas abiertas en la oficina.
const LATIDO_MS = 3000;
const LATIDO_TOPE_MS = 2 * 60 * 60 * 1000;

async function latir({ sesion, agente, cwd, encargo, padre }) {
  cwd = escritorio(agente, cwd);
  const etiqueta = AGENTE_MODELO[agente] || agente || 'externo';
  const resumen = String(encargo || '').replace(/\s+/g, ' ').slice(0, 90);
  const t0 = Date.now();
  while (Date.now() - t0 < LATIDO_TOPE_MS) {
    await new Promise((r) => setTimeout(r, LATIDO_MS));
    if (padre) { try { process.kill(padre, 0); } catch { return; } }
    if (!servidores().length) return;
    const segundos = Math.round((Date.now() - t0) / 1000);
    await emitir('PostToolUse', { session_id: sesion, cwd });
    await emitir('PreToolUse', {
      session_id: sesion,
      cwd,
      tool_name: 'Bash',
      tool_input: { command: `${etiqueta}: ${resumen} (${segundos}s)` },
    });
  }
}

// Arranca el latido en un proceso aparte y devuelve su pid. Va desacoplado porque el despacho
// bloquea el bucle de eventos con spawnSync: un temporizador en este proceso no correria.
function arrancarLatido({ sesion, agente, cwd, encargo }) {
  try {
    if (!servidores().length) return null;
    const args = [__filename, 'latido', '--session', sesion, '--agente', String(agente || ''),
      '--cwd', String(cwd || process.cwd()), '--encargo', String(encargo || ''),
      '--padre', String(process.pid)];
    const h = spawn(process.execPath, args, { detached: true, stdio: 'ignore' });
    h.unref();
    return h.pid;
  } catch { return null; }
}

function pararLatido(pid) {
  if (!pid) return;
  try { process.kill(pid, 'SIGTERM'); } catch {}
}

async function despachoTerminado({ sesion, agente, cwd, estado }) {
  cwd = escritorio(agente, cwd);
  await emitir('PostToolUse', { session_id: sesion, cwd });
  // Un despacho que acabó mal deja al personaje reclamando atención en vez de irse callado:
  // es justo el caso en el que quieres mirar la pantalla.
  if (estado && estado !== 'ok') {
    await emitir('Notification', { session_id: sesion, cwd, notification_type: 'idle_prompt' });
  } else {
    await emitir('Stop', { session_id: sesion, cwd });
  }
  // Aqui NO va SessionEnd a proposito: `onSessionEnd` del servidor hace `removeAgent` para todo
  // agente externo, y el personaje desaparece. Sin el se queda en su escritorio y a los 5 s pasa
  // a "esperando" — que es el ocioso que se quiere ver. Para echarlo de verdad: `retirar`.
  return true;
}

// Echa al personaje de la oficina. Unico camino que lo borra: `onSessionEnd` -> `removeAgent`.
async function retirar({ sesion, agente, cwd }) {
  await emitir('SessionEnd', { session_id: sesion, cwd: escritorio(agente, cwd), reason: 'ok' });
  return true;
}

// Sienta a los tres en su escritorio sin encargo, para que la oficina no este vacia hasta el
// primer despacho. Reusa el mismo session_id estable que usa el hivemind, asi que el siguiente
// encargo lo recoge el mismo personaje en vez de crear uno nuevo.
async function poblar(cwd) {
  for (const agente of Object.keys(AGENTE_MODELO)) {
    const d = escritorio(agente, cwd);
    await emitir('SessionStart', { session_id: sesionDe(agente), cwd: d, source: `neptuno-hivemind:${agente}` });
    await emitir('Stop', { session_id: sesionDe(agente), cwd: d });
  }
  return Object.keys(AGENTE_MODELO).length;
}

// Sin "Watch All Sessions" el servidor descarta toda sesion externa: adopta una sesion solo si
// ya hay un personaje con ese mismo projectDir. La flota nunca lo cumple (arranca en frio), asi
// que sin este interruptor los POST devuelven 200 y no aparece nadie. Es el mismo ajuste que el
// toggle de la interfaz, escrito en el fichero para que sobreviva a reinicios del servidor.
const CONFIG = path.join(os.homedir(), '.pixel-agents', 'config.json');

function preparar() {
  const c = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
  const antes = c.standalone?.watchAllSessions;
  if (c.standalone) c.standalone.watchAllSessions = true;
  if (c.vscode) c.vscode.watchAllSessions = true;
  fs.writeFileSync(CONFIG, JSON.stringify(c, null, 2));
  return { antes, ahora: true, reinicioNecesario: antes !== true && servidores().length > 0 };
}

module.exports = { emitir, servidores, escritorio, sesionDe, preparar, poblar, retirar, despachoIniciado, despachoTerminado, arrancarLatido, pararLatido };

// --- CLI ---------------------------------------------------------------------
if (require.main === module) {
  (async () => {
    const [cmd, ...argv] = process.argv.slice(2);
    if (cmd === 'preparar') {
      const r = preparar();
      console.log(`watchAllSessions: ${r.antes} -> ${r.ahora} (${CONFIG})`);
      if (r.reinicioNecesario) console.log('Hay un servidor vivo que arranco con el ajuste antiguo: reinicialo para que adopte a la flota.');
      process.exit(0);
    }
    if (cmd === 'servers') {
      const s = servidores();
      if (!s.length) { console.log('Sin servidores de Pixel Agents vivos. Arranca uno con: pixel-agents --port 3100'); process.exit(1); }
      for (const e of s) console.log(`  puerto ${e.port}  pid ${e.pid}  token ${String(e.token).slice(0, 8)}…`);
      process.exit(0);
    }
    if (cmd === 'poblar') {
      // Va como ExecStartPost del servicio, y ahi el servidor todavia no ha escrito su registro:
      // sin esta espera `poblar` no encontraria a nadie y se callaria (la regla dura del puente).
      for (let i = 0; i < 20 && !servidores().length; i++) await new Promise((r) => setTimeout(r, 500));
      const n = await poblar(process.cwd());
      console.log(`${n} agentes sentados en la oficina (ociosos, sin encargo)`);
      process.exit(0);
    }
    if (cmd === 'retirar') {
      const quienes = argv.length ? argv : Object.keys(AGENTE_MODELO);
      for (const a of quienes) await retirar({ sesion: sesionDe(a), agente: a, cwd: process.cwd() });
      console.log(`retirados: ${quienes.join(', ')}`);
      process.exit(0);
    }
    if (cmd === 'url') {
      const s = servidores();
      if (!s.length) { console.log('Sin servidores vivos. Arrancalo con: systemctl --user start pixel-agents'); process.exit(1); }
      for (const e of s) console.log(`http://127.0.0.1:${e.port}/?token=${e.token}`);
      process.exit(0);
    }
    if (cmd === 'inicio' || cmd === 'fin' || cmd === 'latido') {
      const o = {};
      for (let i = 0; i < argv.length; i += 2) o[argv[i].replace(/^--/, '')] = argv[i + 1];
      if (cmd === 'latido') {
        await latir({ sesion: o.session, agente: o.agente, cwd: o.cwd, encargo: o.encargo, padre: Number(o.padre) || 0 });
        process.exit(0);
      }
      if (cmd === 'inicio') await despachoIniciado({ sesion: o.session, agente: o.agente, cwd: o.cwd, encargo: o.encargo || '' });
      else await despachoTerminado({ sesion: o.session, agente: o.agente, cwd: o.cwd, estado: o.estado });
      process.exit(0);
    }
    if (cmd === 'emit') {
      const opt = {};
      for (let i = 1; i < argv.length + 1; i++) {
        if (argv[i - 1] === '--session') opt.session_id = argv[i];
        else if (argv[i - 1] === '--cwd') opt.cwd = path.resolve(argv[i]);
        else if (argv[i - 1] === '--tool') opt.tool_name = argv[i];
      }
      const n = await emitir(argv[0], opt);
      console.log(`evento ${argv[0]} entregado a ${n} servidor(es)`);
      process.exit(n ? 0 : 1);
    }
    console.log(fs.readFileSync(__filename, 'utf8').split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
    process.exit(cmd ? 2 : 0);
  })();
}
