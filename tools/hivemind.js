#!/usr/bin/env node
// NEPTUNO · Hivemind — despachador único hacia las CLIs agénticas externas.
//
// Claude Code es el hivemind: entiende la tarea, decide quién la ejecuta mejor y despacha
// por aquí. Este script NO decide nada; solo normaliza la invocación de cada CLI, aísla su
// salida en un archivo (para no quemar el contexto de la sesión con logs) y devuelve un
// resumen corto con la ruta completa.
//
// Uso:
//   node tools/hivemind.js on | off | status             -> enciende/apaga la flota externa
//   node tools/hivemind.js doctor                       -> quién está instalado y autenticado
//   node tools/hivemind.js roster                        -> tabla de enrutado (resumen de docs/HIVEMIND.md)
//   node tools/hivemind.js run <agente> "<prompt>" [opciones]     -> disparo, sin estado
//   node tools/hivemind.js session <agente> "<msg>" [--turno "..."]  -> sesión con turnos (los tres)
//
// Agentes: opencode | antigravity (alias: agy, gemini) | devin
// Opciones de run:
//   --cwd <dir>        directorio de trabajo del agente (default: cwd actual)
//   --model <id>       modelo concreto; si se omite, el default del agente
//   --timeout <seg>    default 900
//   --out <archivo>    dónde escribir el log (default: .hivemind/runs/<ts>-<agente>.log)
//   --safe             NO auto-aprueba: el agente pedirá permiso y, headless, se auto-denegará
//   --yolo             (obsoleto, ya es el default) auto-aprueba permisos en el agente destino
//   --prompt-file <f>  lee el prompt de un archivo en vez de argv (mejor para prompts largos)
//   --quiet            no imprime la cola del log, solo la ruta
//
// Salida: siempre imprime `HIVEMIND_LOG=<ruta>` y sale con el código del agente.
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const estadoHivemind = require('./hivemind-estado.js');

const ROOT = path.resolve(__dirname, '..');

// Puente opcional a la interfaz visual: si hay un servidor de Pixel Agents vivo, cada
// despacho aparece como un personaje en la oficina. Es decoración y se comporta como tal —
// si el módulo falta o falla, el despacho sigue igual. Ver docs/PIXEL-AGENTS.md.
let puente = null;
try { puente = require('./pixel-bridge.js'); } catch {}
// Se emite en un proceso hijo SÍNCRONO a propósito: `spawnSync` bloquea el bucle de eventos,
// así que un POST asíncrono desde aquí no llegaría a salir nunca. Se salta del todo si no hay
// servidor, para no pagar un spawn por nada. Nunca lanza: la interfaz es decoración.
function avisar(fase, datos) {
  try {
    if (!puente || !puente.servidores().length) return;
    const args = [path.join(__dirname, 'pixel-bridge.js'), fase];
    for (const [k, v] of Object.entries(datos)) if (v != null) args.push(`--${k}`, String(v));
    spawnSync(process.execPath, args, { timeout: 5000, stdio: 'ignore' });
  } catch {}
}

// Un terminal lanzado desde un snap (VS Code, por ejemplo) exporta un XDG_DATA_HOME que
// apunta DENTRO del sandbox del snap (~/snap/<app>/<rev>/.local/share). Las CLIs de la flota
// guardan ahí sus credenciales, así que desde esa sesión no ven el login que hiciste en un
// terminal normal y reportan "not logged in" aunque el auth.json exista en ~/.local/share.
// Se corrige el entorno de TODO lo que lance este script, sondas incluidas.
function sanearEntorno() {
  const env = { ...process.env };
  const home = os.homedir();
  const enSnap = (v) => typeof v === 'string' && /(^|\/)snap\//.test(v);
  if (enSnap(env.XDG_DATA_HOME)) env.XDG_DATA_HOME = path.join(home, '.local', 'share');
  if (enSnap(env.XDG_CONFIG_HOME)) env.XDG_CONFIG_HOME = path.join(home, '.config');
  if (enSnap(env.XDG_CACHE_HOME)) env.XDG_CACHE_HOME = path.join(home, '.cache');
  if (enSnap(env.XDG_STATE_HOME)) env.XDG_STATE_HOME = path.join(home, '.local', 'state');
  return env;
}
const ENV = sanearEntorno();
const SNAP_CORREGIDO = ENV.XDG_DATA_HOME !== process.env.XDG_DATA_HOME;

// --- Roster -----------------------------------------------------------------
// `probe` es un comando barato que distingue "instalado" de "instalado y autenticado".
// Mantener esta tabla en sync con docs/HIVEMIND.md, que es la versión larga y razonada.
const AGENTS = {
  opencode: {
    bin: 'opencode',
    aliases: [],
    fuerte: 'Refactors multi-archivo, tareas largas de código, control fino de modelo/proveedor',
    debil: 'Sin navegador ni visión; verboso en el terminal',
    // `opencode run` mira si stdout es un TTY. Si no lo es, bloquea la salida en buffer y NO
    // termina el proceso: el trabajo se hace pero el despacho se cuelga hasta el tope duro.
    // Bajo pseudo-terminal sale con exit=0 en 30s y emite los eventos completos. Verificado.
    pty: true,
    // Los eventos JSON traen el texto en partes `text`; el resto es ruido de protocolo.
    extraer: (raw) => raw.split('\n').flatMap((l) => {
      try { const d = JSON.parse(l.trim()); return d.type === 'text' && d.part?.text ? [d.part.text] : []; }
      catch { return []; }
    }).join('').trim(),
    // `opencode models` responde 0 aunque no haya login (solo lista los modelos libres),
    // así que la sonda mira las credenciales: es lo único que distingue listo de no listo.
    probe: ['providers', 'list'],
    build: (o) => {
      const a = ['run', '--format', 'json'];
      if (!o.safe) a.push('--auto');
      // Sin modelo explícito, opencode elige uno que puede estar encolado indefinidamente.
      // Se fija un gratuito medido como rápido; --model lo sobreescribe.
      a.push('--model', o.model || 'opencode/nemotron-3.5-lightning-free');
      if (o.agent) a.push('--agent', o.agent);
      return a;
    },
  },
  antigravity: {
    bin: 'agy',
    aliases: ['agy', 'gemini'],
    fuerte: 'Contexto enorme, exploración de repos desconocidos, multimodal, barato y rápido (Flash)',
    debil: 'Menos disciplinado siguiendo protocolos largos; conviene darle criterios de salida explícitos',
    probe: ['models'],
    // Antigravity ejecuta los comandos de terminal en su propio scratch
    // (~/.gemini/antigravity-cli/brain/<uuid>), NO en el cwd del encargo: una ruta relativa
    // falla en silencio y `wc -l` devuelve 0, que parece una respuesta. Verificado con un
    // encargo que imprimió su `pwd`. Por eso el prompt lleva el directorio absoluto delante.
    preambulo: (cwd) =>
      `DIRECTORIO DE TRABAJO: ${cwd}\n` +
      `Tus comandos de terminal NO arrancan ahí. Antes de cualquier ruta relativa haz ` +
      `\`cd '${cwd}'\` en el mismo comando, o usa rutas absolutas bajo ese directorio. ` +
      `Si un comando devuelve vacío o 0, comprueba primero que no estás en otro directorio.\n\n`,
    build: (o) => {
      const a = [];
      if (o.model) a.push('--model', o.model);
      if (o.yolo) a.push('--dangerously-skip-permissions');
      for (const d of [o.cwd, ...o.addDir]) a.push('--add-dir', d);
      a.push('--print', o.prompt);
      return a;
    },
  },
  devin: {
    bin: 'devin',
    aliases: [],
    fuerte: 'Trabajo autónomo de larga duración, sandbox en la nube, ejecución con verificación propia',
    debil: 'Requiere login y consume créditos; el arranque en frío es lento para tareas pequeñas',
    probe: ['models', 'list'],
    build: (o) => {
      const a = [];
      if (o.model) a.push('--model', o.model);
      a.push('--permission-mode', o.yolo ? 'dangerous' : 'accept-edits');
      a.push('--respect-workspace-trust', 'false');
      a.push('--print', o.prompt);
      return a;
    },
  },
};

function resolveAgent(name) {
  const key = String(name || '').toLowerCase();
  if (AGENTS[key]) return [key, AGENTS[key]];
  for (const [k, v] of Object.entries(AGENTS)) if (v.aliases.includes(key)) return [k, v];
  return [null, null];
}

function which(bin) {
  const r = spawnSync('command', ['-v', bin], { shell: true, encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim().split('\n')[0] : null;
}

// --- doctor -----------------------------------------------------------------
function doctor() {
  console.log('NEPTUNO Hivemind — estado de la flota\n');
  const sw = estadoHivemind.leer();
  if (!sw.activo) console.log('  [interruptor] APAGADA: `run` y `session` no despacharán. Enciende con `hivemind.js on`.\n');
  if (SNAP_CORREGIDO) console.log(`  [entorno] XDG_DATA_HOME apuntaba a un sandbox de snap; corregido a ${ENV.XDG_DATA_HOME}\n`);
  let ready = 0;
  for (const [name, a] of Object.entries(AGENTS)) {
    const p = which(a.bin);
    if (!p) {
      console.log(`  ${name.padEnd(12)} NO INSTALADO   (binario "${a.bin}" no está en PATH)`);
      continue;
    }
    const r = spawnSync(a.bin, a.probe, { encoding: 'utf8', timeout: 60000, env: ENV });
    const out = `${r.stdout || ''}${r.stderr || ''}`;
    const noAuth = /not logged in|no autenticado|auth login|unauthorized|401|\b0 credentials\b/i.test(out);
    const ok = r.status === 0 && !noAuth;
    if (ok) ready++;
    console.log(`  ${name.padEnd(12)} ${ok ? 'LISTO       ' : 'SIN LOGIN   '} ${p}`);
    if (!ok) {
      const hint = { devin: 'devin auth login', opencode: 'opencode providers login', antigravity: 'agy (login interactivo)' }[name];
      console.log(`  ${''.padEnd(12)}   -> ${hint}${noAuth ? '' : `  [probe salió ${r.status}]`}`);
    }
  }
  console.log(`\n  ${ready}/${Object.keys(AGENTS).length} agentes externos listos. Detalle de enrutado: docs/HIVEMIND.md`);
  const oficina = puente ? puente.servidores() : [];
  console.log(oficina.length
    ? `  Interfaz: ${oficina.length} servidor(es) de Pixel Agents vivos — los despachos se verán en la oficina.`
    : `  Interfaz: sin servidor de Pixel Agents (opcional). Arranca uno con: pixel-agents --port 3100`);
  return ready > 0 ? 0 : 1;
}

// --- roster -----------------------------------------------------------------
function roster() {
  console.log('Enrutado rápido (razonamiento completo en docs/HIVEMIND.md):\n');
  for (const [name, a] of Object.entries(AGENTS)) {
    console.log(`  ${name}`);
    console.log(`    fuerte: ${a.fuerte}`);
    console.log(`    débil : ${a.debil}\n`);
  }
  return 0;
}

// --- run --------------------------------------------------------------------
function run(argv) {
  const [name, agent] = resolveAgent(argv[0]);
  if (!agent) {
    console.error(`Agente desconocido: "${argv[0]}". Opciones: ${Object.keys(AGENTS).join(', ')}`);
    return 2;
  }
  const rest = argv.slice(1);
  // `yolo` viene ENCENDIDO: quien despacha es el jefe, y un agente headless no puede pedir
  // permiso a nadie — sin auto-aprobación se auto-deniega, no hace nada y sale con 0, que es
  // el fallo silencioso mas caro de esta flota. `--safe` restaura el comportamiento cauto.
  // El precio, que no se puede maquillar: aprobado todo, el ALCANCE del encargo es la unica
  // frontera. Para trabajo que toque red o instale cosas, `devin --sandbox`.
  const opt = { cwd: process.cwd(), model: null, timeout: 900, out: null, yolo: true, quiet: false, addDir: [], agent: null, safe: false };
  const positional = [];
  for (let i = 0; i < rest.length; i++) {
    const t = rest[i];
    if (t === '--cwd') opt.cwd = path.resolve(rest[++i]);
    else if (t === '--model') opt.model = rest[++i];
    else if (t === '--timeout') opt.timeout = Number(rest[++i]);
    else if (t === '--out') opt.out = rest[++i];
    else if (t === '--add-dir') opt.addDir.push(path.resolve(rest[++i]));
    else if (t === '--prompt-file') positional.push(fs.readFileSync(rest[++i], 'utf8'));
    else if (t === '--yolo') opt.yolo = true;
    else if (t === '--safe') { opt.safe = true; opt.yolo = false; }
    else if (t === '--agent') opt.agent = rest[++i];
    else if (t === '--quiet') opt.quiet = true;
    else positional.push(t);
  }
  opt.prompt = positional.join(' ').trim();
  if (!opt.prompt) {
    console.error('Falta el prompt. Usa: run <agente> "<prompt>"  o  --prompt-file <archivo>');
    return 2;
  }
  const bin = which(agent.bin);
  if (!bin) {
    console.error(`"${agent.bin}" no está instalado. Ejecuta: node tools/hivemind.js doctor`);
    return 127;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logPath = path.resolve(opt.out || path.join(ROOT, '.hivemind', 'runs', `${stamp}-${name}.log`));
  fs.mkdirSync(path.dirname(logPath), { recursive: true });

  // Se guarda el encargo del usuario ANTES del preámbulo: la oficina debe mostrar lo que se
  // pidió, no la fontanería que le añadimos por debajo.
  const encargoOriginal = opt.prompt;
  if (agent.preambulo) opt.prompt = agent.preambulo(opt.cwd) + opt.prompt;
  let args = agent.build(opt);
  let cmd = bin;
  const temporales = [];

  if (agent.pty) {
    // El prompt NO se interpola en la línea de `script -c`: se escribe a un archivo y el
    // envoltorio lo lee entrecomillado. Así un encargo con comillas, $ o ; no puede
    // convertirse en comandos de shell.
    if (!which('script')) {
      console.error(`"${name}" necesita un pseudo-terminal y "script" (paquete util-linux) no está instalado.`);
      return 127;
    }
    const base = path.join(path.dirname(logPath), `.${stamp}-${name}`);
    const promptFile = `${base}.prompt`;
    const wrapper = `${base}.sh`;
    fs.writeFileSync(promptFile, opt.prompt);
    fs.writeFileSync(
      wrapper,
      `#!/bin/sh\nexec ${bin} ${args.map((a) => `'${String(a).replace(/'/g, `'\\''`)}'`).join(' ')} "$(cat '${promptFile}')"\n`,
      { mode: 0o700 }
    );
    temporales.push(promptFile, wrapper);
    cmd = 'script';
    args = ['-qec', wrapper, '/dev/null'];
  }
  const header =
    `# hivemind run\n# agente : ${name} (${bin})\n# cwd    : ${opt.cwd}\n# modelo : ${opt.model || '(default del agente)'}\n` +
    `# inicio : ${new Date().toISOString()}\n# prompt :\n${opt.prompt.split('\n').map((l) => '#   ' + l).join('\n')}\n${'-'.repeat(72)}\n`;
  fs.writeFileSync(logPath, header);

  // El aviso de inicio va antes del spawn para que el personaje aparezca mientras trabaja,
  // no al terminar.
  // Estable por agente (lo decide el puente): el personaje se queda ocioso al acabar y el
  // siguiente encargo lo reutiliza, en vez de dejar un escritorio muerto por cada despacho.
  const sesionUI = (puente && puente.sesionDe) ? puente.sesionDe(name) : `neptuno-${name}-${stamp}`;
  avisar('inicio', { session: sesionUI, agente: name, cwd: opt.cwd, encargo: encargoOriginal });
  // Sin latido el personaje se marca ocioso a los 5 s y pasa el resto del encargo aparentando
  // que no hace nada. El hijo se mata solo si este proceso muere de golpe (SIGKILL del tope).
  let latido = null;
  try {
    if (puente && puente.arrancarLatido) {
      latido = puente.arrancarLatido({ sesion: sesionUI, agente: name, cwd: opt.cwd, encargo: encargoOriginal });
    }
  } catch {}

  const t0 = Date.now();
  const r = spawnSync(cmd, args, {
    cwd: opt.cwd,
    encoding: 'utf8',
    timeout: opt.timeout * 1000,
    // SIGTERM por defecto no basta: verificado con `agy`, que lo ignoró y siguió 2.889 s
    // con --timeout 260. Un agente colgado sin tope duro bloquea el despacho entero.
    killSignal: 'SIGKILL',
    maxBuffer: 64 * 1024 * 1024,
    env: { ...ENV, NEPTUNO_HIVEMIND: name },
  });
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  for (const f of temporales) { try { fs.unlinkSync(f); } catch {} }
  const crudo = `${r.stdout || ''}${r.stderr ? `\n--- stderr ---\n${r.stderr}` : ''}`;
  // Con salida en eventos JSON, el cuerpo útil es solo el texto del agente: el resto es
  // protocolo y no debe llegar ni al informe ni al juicio de "produjo algo".
  const extraido = agent.extraer ? agent.extraer(crudo) : '';
  const body = extraido || crudo;
  const timedOut = (r.error && r.error.code === 'ETIMEDOUT') || r.signal === 'SIGKILL';
  // Un agente headless no puede pedir permiso por definición: si el encargo necesita una
  // herramienta y no se pasó --yolo, la CLI auto-deniega, no produce nada y SALE CON 0.
  // Sin esto un encargo que no hizo nada se reportaría como "ok" — verificado con `agy`.
  const denied = /required the "command" permission|cannot prompt for|auto-denied|permission denied by user/i.test(body);
  const vacio = body.trim().length === 0;
  fs.appendFileSync(
    logPath,
    `${crudo}\n${'-'.repeat(72)}\n${extraido ? `# respuesta extraída:\n${extraido}\n${'-'.repeat(72)}\n` : ''}# fin: ${secs}s, exit=${r.status}${timedOut ? ' (TIMEOUT)' : ''}\n`
  );

  if (!opt.quiet) {
    const tail = body.trim().split('\n');
    console.log(tail.length > 40 ? ['[...]', ...tail.slice(-40)].join('\n') : tail.join('\n'));
  }
  // `opencode run` produce la respuesta y NO sale: el tope duro lo mata con el trabajo ya
  // hecho. Un timeout con salida sustancial no es lo mismo que un timeout sin nada, y
  // confundirlos hace descartar trabajo válido.
  const estadoUI = timedOut ? 'timeout' : denied ? 'permisos' : vacio ? 'sin-salida' : r.status === 0 ? 'ok' : 'error';
  try { if (puente && puente.pararLatido) puente.pararLatido(latido); } catch {}
  avisar('fin', { session: sesionUI, agente: name, cwd: opt.cwd, estado: estadoUI });

  const estado = timedOut
    ? (body.trim().length > 40 ? 'timeout-con-salida' : 'timeout')
    : denied ? 'permisos' : vacio ? 'sin-salida' : r.status === 0 ? 'ok' : 'error';
  console.log(`\nHIVEMIND_LOG=${logPath}`);
  console.log(`HIVEMIND_STATUS=${estado} agente=${name} duracion=${secs}s exit=${r.status}`);
  if (estado === 'timeout') console.log(`Timeout a los ${opt.timeout}s sin salida. Sube --timeout o parte la tarea en trozos más pequeños.`);
  if (estado === 'timeout-con-salida') console.log(`El agente produjo respuesta pero no terminó el proceso (típico de \`opencode run\`): el trabajo está en el log, revísalo antes de reintentar.`);
  if (denied) console.log(`El agente auto-denegó una herramienta: en modo headless no puede pedirte permiso. Solo pasa si lanzaste con --safe: repite sin él, o acota el encargo a algo que no necesite herramientas.`);
  if (vacio && !timedOut) console.log(`El agente no produjo salida. Revisa el encargo: puede que no haya entendido qué devolver.`);
  if (estado !== 'ok') return timedOut ? 124 : r.status || 1;
  return 0;
}

// --- interruptor -------------------------------------------------------------
// Bloqueo DURO, no un aviso: apagada la flota, `run` y `session` no llaman a ninguna CLI
// externa. El hook de SessionStart se lo dice ademas a Claude, para que no planifique un
// reparto que iba a fallar. Los dos leen el mismo estado.
function exigirEncendido() {
  const e = estadoHivemind.leer();
  if (e.activo) return true;
  console.error('La flota externa está APAGADA (modo solo Claude). No se ha despachado nada.');
  console.error(`Origen del estado: ${e.origen}`);
  console.error('Enciéndela con:  node tools/hivemind.js on');
  return false;
}

function interruptor(valor) {
  const e = estadoHivemind.escribir(valor);
  console.log(`Flota externa: ${e.activo ? 'ENCENDIDA' : 'APAGADA (solo Claude)'}`);
  console.log(`Estado en: ${estadoHivemind.ESTADO}`);
  if (!e.activo) console.log('Las sesiones nuevas de Claude lo verán al arrancar; en esta, díselo tú.');
  return 0;
}

function status() {
  const e = estadoHivemind.leer();
  console.log(`Flota externa: ${e.activo ? 'ENCENDIDA' : 'APAGADA (solo Claude)'}`);
  console.log(`Origen: ${e.origen}`);
  return 0;
}

// --- main -------------------------------------------------------------------
const [cmd, ...argv] = process.argv.slice(2);
// ACP vive en tools/acp.js (sesión con turnos); aquí solo se enruta para que el hivemind
// tenga una sola puerta de entrada. Ver docs/HIVEMIND.md §1 para cuándo usar cada transporte.
function acp(argv) {
  const r = spawnSync(process.execPath, [path.join(__dirname, 'session.js'), ...argv], { stdio: 'inherit', env: ENV });
  return r.status === null ? 1 : r.status;
}
// `acp` se mantiene como alias de `session`: los dos protocolos viven detrás de la misma
// interfaz, pero llamar "acp" a la sesión de antigravity seria mentir sobre el protocolo.
const commands = {
  doctor, roster, status,
  on: () => interruptor(true),
  off: () => interruptor(false),
  run: () => (exigirEncendido() ? run(argv) : 3),
  session: () => (exigirEncendido() ? acp(argv) : 3),
  acp: () => (exigirEncendido() ? acp(argv) : 3),
};
if (!cmd || !commands[cmd]) {
  console.log(fs.readFileSync(__filename, 'utf8').split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
  process.exit(cmd ? 2 : 0);
}
process.exit(commands[cmd]());
