#!/usr/bin/env node
// NEPTUNO · Cliente ACP (Agent Client Protocol) — el transporte conversacional del hivemind.
//
// El despacho por CLI (tools/hivemind.js run) es un disparo: un encargo, una respuesta, sin
// estado. ACP es lo otro: una sesión con turnos, en la que el agente puede pedir permiso o
// leer archivos a través de NOSOTROS y podemos encadenar preguntas sin que arranque en frío.
//
// JSON-RPC 2.0 delimitado por saltos de línea sobre stdio. Verificado contra `devin acp` y
// `opencode acp`: los dos responden `protocolVersion: 1`. Antigravity no expone ACP.
//
// Uso:
//   node tools/acp.js <agente> "<mensaje>" [--turno "<seguimiento>"]... [opciones]
//   node tools/acp.js <agente> --prompt-file <archivo> [opciones]
//   node tools/acp.js capabilities <agente>       -> qué soporta ese agente
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
  devin: { bin: 'devin', args: ['acp'] },
  opencode: { bin: 'opencode', args: ['acp'] },
};

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
    if (t === 'agent_message_chunk' && u.content?.text) this.texto.push(u.content.text);
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
    const r = await this.peticion('session/prompt', {
      sessionId: this.sessionId,
      prompt: [{ type: 'text', text: texto }],
    });
    return { respuesta: this.texto.join('').trim(), stopReason: r?.stopReason };
  }

  cerrar() { try { this.proc.kill('SIGKILL'); } catch {} }
}

module.exports = { ClienteACP, AGENTES };

// --- CLI ---------------------------------------------------------------------
if (require.main === module) {
  (async () => {
    const argv = process.argv.slice(2);
    if (!argv.length) {
      console.log(fs.readFileSync(__filename, 'utf8').split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
      process.exit(0);
    }
    if (argv[0] === 'capabilities') {
      if (!AGENTES[argv[1]]) {
        console.error(`Agente ACP desconocido: "${argv[1] || ''}". Opciones: ${Object.keys(AGENTES).join(', ')}`);
        process.exit(2);
      }
      const c = new ClienteACP(argv[1], {});
      const t = setTimeout(() => { console.error('Timeout en el handshake ACP.'); c.cerrar(); process.exit(124); }, 60000);
      const caps = await c.iniciar();
      clearTimeout(t);
      console.log(JSON.stringify({ agente: argv[1], sessionId: c.sessionId, ...caps }, null, 2));
      c.cerrar();
      process.exit(0);
    }

    const agente = argv[0];
    if (!AGENTES[agente]) {
      console.error(`Agente ACP desconocido: "${agente}". Opciones: ${Object.keys(AGENTES).join(', ')}.`);
      console.error(`Antigravity no expone ACP: para ese agente usa \`node tools/hivemind.js run antigravity\`.`);
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
    const logPath = path.resolve(opt.out || path.join(ROOT, '.hivemind', 'runs', `${stamp}-${agente}-acp.log`));
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    const log = (s) => fs.appendFileSync(logPath, s);
    log(`# acp ${agente} | cwd ${opt.cwd} | ${new Date().toISOString()}\n${'-'.repeat(72)}\n`);

    const cliente = new ClienteACP(agente, { cwd: opt.cwd, safe: opt.safe, onEvento: (e) => log(JSON.stringify(e) + '\n') });
    const t0 = Date.now();
    const guardia = setTimeout(() => {
      log(`\n# TIMEOUT a los ${opt.timeout}s\n`);
      console.log(`\nACP_LOG=${logPath}\nACP_STATUS=timeout agente=${agente}`);
      cliente.cerrar();
      process.exit(124);
    }, opt.timeout * 1000);

    try {
      await cliente.iniciar();
      const salidas = [];
      for (const [n, texto] of turnos.entries()) {
        const { respuesta, stopReason } = await cliente.turno(texto);
        salidas.push(respuesta);
        log(`\n${'-'.repeat(72)}\n# turno ${n + 1} (stopReason=${stopReason}):\n${respuesta}\n`);
        if (!opt.quiet) console.log(turnos.length > 1 ? `--- turno ${n + 1} ---\n${respuesta}` : respuesta);
      }
      clearTimeout(guardia);
      const secs = ((Date.now() - t0) / 1000).toFixed(1);
      log(`\n# fin: ${secs}s, ${turnos.length} turno(s)\n`);
      console.log(`\nACP_LOG=${logPath}`);
      console.log(`ACP_STATUS=${salidas.some((s) => s) ? 'ok' : 'sin-salida'} agente=${agente} sesion=${cliente.sessionId} turnos=${turnos.length} duracion=${secs}s`);
      if (opt.safe && !cliente.pidioPermiso) {
        console.log(`Aviso: --safe no denegó nada porque el agente no pidió permiso en ningún momento. No lo tomes por aislamiento.`);
      }
      cliente.cerrar();
      process.exit(salidas.some((s) => s) ? 0 : 1);
    } catch (e) {
      clearTimeout(guardia);
      log(`\n# ERROR: ${e.message}\n${cliente.stderr.slice(-2000)}\n`);
      console.error(`Error ACP (${agente}): ${e.message}`);
      console.log(`ACP_LOG=${logPath}\nACP_STATUS=error agente=${agente}`);
      cliente.cerrar();
      process.exit(1);
    }
  })();
}
