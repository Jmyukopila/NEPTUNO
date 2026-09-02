#!/usr/bin/env node
// NEPTUNO · Clientes de sesión — el transporte conversacional del hivemind.
//
// El despacho por CLI (tools/hivemind.js run) es un disparo: un encargo, una respuesta, sin
// estado. ACP es lo otro: una sesión con turnos, en la que el agente puede pedir permiso o
// leer archivos a través de NOSOTROS y podemos encadenar preguntas sin que arranque en frío.
//
// Los tres agentes soportan sesión, pero por DOS protocolos distintos, y aquí se unifican
// tras una sola interfaz:
//
//   devin, opencode -> ACP (Agent Client Protocol): JSON-RPC 2.0 delimitado por saltos de
//                      línea sobre stdio. Los dos responden `protocolVersion: 1`.
//   antigravity     -> stream-json propio: NDJSON, un turno por línea, con la forma
//                      {"event":"user","message":{"role":"user","content":"..."}}.
//                      NO es ACP y no conviene llamarlo así.
//
// Uso:
//   node tools/session.js <agente> "<mensaje>" [--turno "<seguimiento>"]... [opciones]
//   node tools/session.js <agente> --prompt-file <archivo> [opciones]
//   node tools/session.js capabilities <agente>       -> qué soporta ese agente
//
// Opciones: --cwd <dir>  --timeout <seg>  --out <log>  --safe  --quiet
//
// AVISO sobre --safe: NO es un sandbox. Solo controla lo que responde ESTE cliente cuando el
// agente pide permiso (`session/request_permission`) y bloquea las escrituras que nos pida por
// `fs/write_text_file`. Un agente que ejecuta sus herramientas sin preguntar —verificado:
// opencode lanza `tool_call` sin pedir permiso nunca— no queda contenido por este flag. Si
// necesitas aislamiento real, usa `devin --sandbox` por la vía CLI.
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.resolve(__dirname, '..');
const AGENTES = {
  devin: { transporte: 'acp', bin: 'devin', args: ['acp'] },
  opencode: { transporte: 'acp', bin: 'opencode', args: ['acp'] },
  // `--print` se come SIEMPRE el argumento siguiente, así que en modo stream hay que
  // pasarlo como `--print=` (valor vacío) y dejarlo al final. Verificado a base de errores.
  antigravity: {
    transporte: 'stream-json',
    bin: 'agy',
    args: ['--input-format', 'stream-json', '--output-format', 'stream-json', '--print='],
    argsInseguros: ['--dangerously-skip-permissions'],
    aliases: ['agy', 'gemini'],
  },
};

function resolverAgente(nombre) {
  const k = String(nombre || '').toLowerCase();
  if (AGENTES[k]) return k;
  for (const [n, a] of Object.entries(AGENTES)) if ((a.aliases || []).includes(k)) return n;
  return null;
}

// Mismo saneado que hivemind.js: un terminal dentro de un snap apunta las variables XDG a su
// sandbox y las CLIs no encuentran sus credenciales. Ver docs/HIVEMIND.md.
function entorno() {
  const env = { ...process.env };
  const home = os.homedir();
  const enSnap = (v) => typeof v === 'string' && /(^|\/)snap\//.test(v);
  if (enSnap(env.XDG_DATA_HOME)) env.XDG_DATA_HOME = path.join(home, '.local', 'share');
  if (enSnap(env.XDG_CONFIG_HOME)) env.XDG_CONFIG_HOME = path.join(home, '.config');
  if (enSnap(env.XDG_CACHE_HOME)) env.XDG_CACHE_HOME = path.join(home, '.cache');
  return env;
}

class ClienteACP {
  constructor(agente, opciones = {}) {
    const def = AGENTES[agente];
    if (!def) throw new Error(`Agente ACP desconocido: "${agente}". Opciones: ${Object.keys(AGENTES).join(', ')}`);
    this.nombre = agente;
    this.cwd = opciones.cwd || process.cwd();
    this.safe = !!opciones.safe;
    this.onEvento = opciones.onEvento || (() => {});
    this.proc = spawn(def.bin, def.args, { stdio: ['pipe', 'pipe', 'pipe'], env: entorno(), cwd: this.cwd });
    this.siguienteId = 1;
    this.pendientes = new Map();
    this.buffer = '';
    this.stderr = '';
    this.texto = [];
    this.pensamiento = [];
    this.proc.stdout.on('data', (d) => this._entrada(d));
    this.proc.stderr.on('data', (d) => { this.stderr += d; });
    this.proc.on('exit', (code) => {
      for (const { rechazar } of this.pendientes.values()) rechazar(new Error(`el agente ACP terminó (code=${code})`));
      this.pendientes.clear();
    });
  }

  _entrada(chunk) {
    this.buffer += chunk;
    let i;
    while ((i = this.buffer.indexOf('\n')) >= 0) {
      const linea = this.buffer.slice(0, i).trim();
      this.buffer = this.buffer.slice(i + 1);
      if (!linea) continue;
      let m;
      try { m = JSON.parse(linea); } catch { continue; }
      this._mensaje(m);
    }
  }

  _mensaje(m) {
    // Respuesta a algo que pedimos nosotros.
    if (m.id !== undefined && (m.result !== undefined || m.error !== undefined)) {
      const p = this.pendientes.get(m.id);
      if (!p) return;
      this.pendientes.delete(m.id);
      return m.error ? p.rechazar(new Error(`${m.error.message}: ${JSON.stringify(m.error.data || {})}`)) : p.resolver(m.result);
    }
    // Petición DEL agente hacia nosotros: en ACP el cliente es quien concede permisos y
    // quien toca el disco. Si no respondemos, el agente se queda esperando para siempre.
    if (m.id !== undefined && m.method) return this._peticion(m);
    // Notificación: el progreso del turno llega por aquí.
    if (m.method === 'session/update') this._actualizacion(m.params);
    this.onEvento(m);
  }

  _peticion(m) {
    const responder = (result) => this.proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: m.id, result }) + '\n');
    try {
      if (m.method === 'session/request_permission') {
        this.pidioPermiso = true;
        // Sin humano en el bucle, "preguntar" equivale a colgarse. Se elige una opción real
        // de las que ofrece el agente: permitir siempre, o rechazar si se pidió --safe.
        const ops = m.params?.options || [];
        const buscar = (...ids) => ops.find((o) => ids.includes(o.kind) || ids.includes(o.optionId));
        const elegida = this.safe
          ? buscar('reject_always', 'reject_once') || ops[ops.length - 1]
          : buscar('allow_always', 'allow_once') || ops[0];
        return responder({ outcome: { outcome: 'selected', optionId: elegida?.optionId } });
      }
      if (m.method === 'fs/read_text_file') {
        const p = m.params.path;
        let contenido = fs.readFileSync(p, 'utf8');
        if (m.params.line != null || m.params.limit != null) {
          const ls = contenido.split('\n');
          const desde = Math.max(0, (m.params.line || 1) - 1);
          contenido = ls.slice(desde, m.params.limit ? desde + m.params.limit : undefined).join('\n');
        }
        return responder({ content: contenido });
      }
      if (m.method === 'fs/write_text_file') {
        if (this.safe) throw new Error('escritura denegada por --safe');
        fs.mkdirSync(path.dirname(m.params.path), { recursive: true });
        fs.writeFileSync(m.params.path, m.params.content, 'utf8');
        return responder(null);
      }
      return responder(null); // método desconocido: responder algo es mejor que colgar al agente
    } catch (e) {
      this.proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: m.id, error: { code: -32000, message: String(e.message) } }) + '\n');
    }
  }

  _actualizacion(p) {
    const u = p?.update || p;
    const t = u?.sessionUpdate || u?.type;
    // El canal bueno es `agent_message_chunk`. Pero en un turno de puro razonamiento, sin
    // herramientas, Devin deja la respuesta en `agent_thought_chunk` y cierra: verificado con
    // un turno que calculó 112 y lo emitió solo por ahí. Se guarda aparte y solo se usa como
    // respaldo si el canal de mensaje quedó vacío — mezclarlos metería el razonamiento entero.
    if (t === 'agent_message_chunk' && u.content?.text) this.texto.push(u.content.text);
    else if (t === 'agent_thought_chunk' && u.content?.text) this.pensamiento.push(u.content.text);
    this.onEvento({ tipo: t, update: u });
  }

  peticion(method, params) {
    const id = this.siguienteId++;
    return new Promise((resolver, rechazar) => {
      this.pendientes.set(id, { resolver, rechazar });
      this.proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });
  }

  async iniciar() {
    this.capacidades = await this.peticion('initialize', {
      protocolVersion: 1,
      clientCapabilities: { fs: { readTextFile: true, writeTextFile: true }, terminal: false },
    });
    const s = await this.peticion('session/new', { cwd: this.cwd, mcpServers: [] });
    this.sessionId = s.sessionId;
    return this.capacidades;
  }

  async turno(texto) {
    this.texto = [];
    this.pensamiento = [];
    const r = await this.peticion('session/prompt', {
      sessionId: this.sessionId,
      prompt: [{ type: 'text', text: texto }],
    });
    const mensaje = this.texto.join('').trim();
    const respaldo = this.pensamiento.join('').trim();
    return {
      respuesta: mensaje || respaldo,
      desdePensamiento: !mensaje && !!respaldo,
      stopReason: r?.stopReason,
    };
  }

  cerrar() { try { this.proc.kill('SIGKILL'); } catch {} }
}

// --- Transporte stream-json (Antigravity) ------------------------------------
// Mucho más simple que ACP: no hay handshake ni sesión que abrir. Se escribe un turno por
// línea y el agente responde con un evento `result` que trae el `conversation_id`, así que
// la continuidad la lleva él. Tampoco nos pide permisos ni acceso a disco: por eso
// `--safe` aquí no puede denegar nada y se traduce en no pasar el flag de auto-aprobación.
class ClienteStream {
  constructor(agente, opciones = {}) {
    const def = AGENTES[agente];
    this.nombre = agente;
    this.cwd = opciones.cwd || process.cwd();
    this.safe = !!opciones.safe;
    this.onEvento = opciones.onEvento || (() => {});
    const args = [...(this.safe ? [] : def.argsInseguros || []), '--add-dir', this.cwd, ...def.args];
    this.proc = spawn(def.bin, args, { stdio: ['pipe', 'pipe', 'pipe'], env: entorno(), cwd: this.cwd });
    this.buffer = '';
    this.stderr = '';
    this.esperando = null;
    this.proc.stdout.on('data', (d) => this._entrada(d));
    this.proc.stderr.on('data', (d) => { this.stderr += d; });
    this.proc.on('exit', (c) => { if (this.esperando) this.esperando.rechazar(new Error(`el agente terminó (code=${c})`)); });
  }

  _entrada(chunk) {
    this.buffer += chunk;
    let i;
    while ((i = this.buffer.indexOf('\n')) >= 0) {
      const linea = this.buffer.slice(0, i).trim();
      this.buffer = this.buffer.slice(i + 1);
      if (!linea.startsWith('{')) continue;
      let m;
      try { m = JSON.parse(linea); } catch { continue; }
      this.onEvento(m);
      if (m.event === 'init') { this.sessionId = m.conversation_id; this.herramientas = m.init?.tools || []; }
      if (m.event === 'result' && this.esperando) {
        const p = this.esperando;
        this.esperando = null;
        this.sessionId = m.result?.conversation_id || this.sessionId;
        p.resolver({ respuesta: (m.result?.response || '').trim(), stopReason: m.result?.status, error: m.result?.error });
      }
    }
  }

  async iniciar() {
    // No hay handshake que negociar: el agente publica un evento `init` al arrancar, con el
    // conversation_id y su catálogo de herramientas. Se espera a ese evento para poder
    // reportar la sesión igual que hace el transporte ACP.
    await new Promise((listo) => {
      if (this.sessionId) return listo();
      const t = setTimeout(listo, 30000);
      const previo = this.onEvento;
      this.onEvento = (m) => {
        previo(m);
        if (m.event === 'init') { clearTimeout(t); this.onEvento = previo; listo(); }
      };
    });
    this.capacidades = {
      transporte: 'stream-json',
      herramientas: this.herramientas ? this.herramientas.length : undefined,
      navegador: this.herramientas ? this.herramientas.some((t) => t.startsWith('browser_')) : undefined,
      subagentes: this.herramientas ? this.herramientas.filter((t) => t.includes('subagent')) : undefined,
    };
    return this.capacidades;
  }

  turno(texto) {
    return new Promise((resolver, rechazar) => {
      this.esperando = { resolver, rechazar };
      this.proc.stdin.write(JSON.stringify({ event: 'user', message: { role: 'user', content: texto } }) + '\n');
    });
  }

  cerrar() { try { this.proc.stdin.end(); this.proc.kill('SIGKILL'); } catch {} }
}

function crearCliente(agente, opciones) {
  const n = resolverAgente(agente);
  if (!n) throw new Error(`Agente desconocido: "${agente}". Opciones: ${Object.keys(AGENTES).join(', ')}`);
  return AGENTES[n].transporte === 'acp' ? new ClienteACP(n, opciones) : new ClienteStream(n, opciones);
}

module.exports = { ClienteACP, ClienteStream, crearCliente, resolverAgente, AGENTES };

// --- CLI ---------------------------------------------------------------------
if (require.main === module) {
  (async () => {
    const argv = process.argv.slice(2);
    if (!argv.length) {
      console.log(fs.readFileSync(__filename, 'utf8').split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
      process.exit(0);
    }
    if (argv[0] === 'capabilities') {
      if (!resolverAgente(argv[1])) {
        console.error(`Agente desconocido: "${argv[1] || ''}". Opciones: ${Object.keys(AGENTES).join(', ')}`);
        process.exit(2);
      }
      const c = crearCliente(argv[1], {});
      const t = setTimeout(() => { console.error('Timeout en el handshake ACP.'); c.cerrar(); process.exit(124); }, 60000);
      const caps = await c.iniciar();
      clearTimeout(t);
      console.log(JSON.stringify({ agente: resolverAgente(argv[1]), transporte: AGENTES[resolverAgente(argv[1])].transporte, sessionId: c.sessionId, ...caps }, null, 2));
      c.cerrar();
      process.exit(0);
    }

    const agente = resolverAgente(argv[0]);
    if (!agente) {
      console.error(`Agente desconocido: "${argv[0]}". Opciones: ${Object.keys(AGENTES).join(', ')}.`);
      process.exit(2);
    }
    const opt = { cwd: process.cwd(), timeout: 900, out: null, safe: false, quiet: false };
    const turnos = [];
    for (let i = 1; i < argv.length; i++) {
      const t = argv[i];
      if (t === '--cwd') opt.cwd = path.resolve(argv[++i]);
      else if (t === '--timeout') opt.timeout = Number(argv[++i]);
      else if (t === '--out') opt.out = argv[++i];
      else if (t === '--turno') turnos.push(argv[++i]);
      else if (t === '--prompt-file') turnos.push(fs.readFileSync(argv[++i], 'utf8'));
      else if (t === '--safe') opt.safe = true;
      else if (t === '--quiet') opt.quiet = true;
      else turnos.push(t);
    }
    if (!turnos.length) { console.error('Falta el mensaje. Usa: acp.js <agente> "<mensaje>"'); process.exit(2); }

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const transporte = AGENTES[agente].transporte;
    const logPath = path.resolve(opt.out || path.join(ROOT, '.hivemind', 'runs', `${stamp}-${agente}-${transporte}.log`));
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    const log = (s) => fs.appendFileSync(logPath, s);
    log(`# sesión ${agente} (${transporte}) | cwd ${opt.cwd} | ${new Date().toISOString()}\n${'-'.repeat(72)}\n`);

    const cliente = crearCliente(agente, { cwd: opt.cwd, safe: opt.safe, onEvento: (e) => log(JSON.stringify(e) + '\n') });
    const t0 = Date.now();
    const guardia = setTimeout(() => {
      log(`\n# TIMEOUT a los ${opt.timeout}s\n`);
      console.log(`\nSESION_LOG=${logPath}\nSESION_STATUS=timeout agente=${agente} transporte=${transporte}`);
      cliente.cerrar();
      process.exit(124);
    }, opt.timeout * 1000);

    try {
      await cliente.iniciar();
      const salidas = [];
      for (const [n, texto] of turnos.entries()) {
        const { respuesta, stopReason, desdePensamiento } = await cliente.turno(texto);
        salidas.push(respuesta);
        log(`\n${'-'.repeat(72)}\n# turno ${n + 1} (stopReason=${stopReason}${desdePensamiento ? ', del canal de razonamiento' : ''}):\n${respuesta}\n`);
        if (!opt.quiet) console.log(turnos.length > 1 ? `--- turno ${n + 1} ---\n${respuesta}` : respuesta);
      }
      clearTimeout(guardia);
      const secs = ((Date.now() - t0) / 1000).toFixed(1);
      log(`\n# fin: ${secs}s, ${turnos.length} turno(s)\n`);
      console.log(`\nSESION_LOG=${logPath}`);
      console.log(`SESION_STATUS=${salidas.some((s) => s) ? 'ok' : 'sin-salida'} agente=${agente} transporte=${transporte} sesion=${cliente.sessionId} turnos=${turnos.length} duracion=${secs}s`);
      if (opt.safe && transporte === 'acp' && !cliente.pidioPermiso) {
        console.log(`Aviso: --safe no denegó nada porque el agente no pidió permiso en ningún momento. No lo tomes por aislamiento.`);
      }
      cliente.cerrar();
      process.exit(salidas.some((s) => s) ? 0 : 1);
    } catch (e) {
      clearTimeout(guardia);
      log(`\n# ERROR: ${e.message}\n${cliente.stderr.slice(-2000)}\n`);
      console.error(`Error de sesión (${agente}/${transporte}): ${e.message}`);
      console.log(`SESION_LOG=${logPath}\nSESION_STATUS=error agente=${agente} transporte=${transporte}`);
      cliente.cerrar();
      process.exit(1);
    }
  })();
}
