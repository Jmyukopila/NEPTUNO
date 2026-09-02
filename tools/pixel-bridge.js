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
//   node tools/pixel-bridge.js servers
//   node tools/pixel-bridge.js inicio --session <id> --agente <n> --cwd <d> --encargo "..."
//   node tools/pixel-bridge.js fin    --session <id> --cwd <d> --estado ok
//   node tools/pixel-bridge.js emit SessionStart --session neptuno-agy --cwd .
'use strict';
const fs = require('fs');
const http = require('http');
const os = require('os');
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

async function despachoIniciado({ sesion, agente, cwd, encargo }) {
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

async function despachoTerminado({ sesion, cwd, estado }) {
  await emitir('PostToolUse', { session_id: sesion, cwd });
  // Un despacho que acabó mal deja al personaje reclamando atención en vez de irse callado:
  // es justo el caso en el que quieres mirar la pantalla.
  if (estado && estado !== 'ok') {
    await emitir('Notification', { session_id: sesion, cwd, notification_type: 'idle_prompt' });
  } else {
    await emitir('Stop', { session_id: sesion, cwd });
  }
  await emitir('SessionEnd', { session_id: sesion, cwd, reason: estado || 'ok' });
  return true;
}

module.exports = { emitir, servidores, despachoIniciado, despachoTerminado };

// --- CLI ---------------------------------------------------------------------
if (require.main === module) {
  (async () => {
    const [cmd, ...argv] = process.argv.slice(2);
    if (cmd === 'servers') {
      const s = servidores();
      if (!s.length) { console.log('Sin servidores de Pixel Agents vivos. Arranca uno con: pixel-agents --port 3100'); process.exit(1); }
      for (const e of s) console.log(`  puerto ${e.port}  pid ${e.pid}  token ${String(e.token).slice(0, 8)}…`);
      process.exit(0);
    }
    if (cmd === 'inicio' || cmd === 'fin') {
      const o = {};
      for (let i = 0; i < argv.length; i += 2) o[argv[i].replace(/^--/, '')] = argv[i + 1];
      if (cmd === 'inicio') await despachoIniciado({ sesion: o.session, agente: o.agente, cwd: o.cwd, encargo: o.encargo || '' });
      else await despachoTerminado({ sesion: o.session, cwd: o.cwd, estado: o.estado });
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
