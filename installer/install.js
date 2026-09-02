#!/usr/bin/env node
'use strict';
// Instalador del ecosistema NEPTUNO para terceros (Windows/Linux).
// Copia skills/agentes/docs/CLAUDE.md a ~/.claude, registra los MCPs elegidos,
// crea una bóveda de notas propia y opcionalmente instala Obsidian y graphify.
// Sin dependencias externas: solo Node.js.
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const HOME = os.homedir();
const IS_WIN = process.platform === 'win32';
const CLAUDE_DIR = path.join(HOME, '.claude');
const DEFAULT_VAULT = path.join(HOME, 'ANDROMEDA');

// ---------------------------------------------------------------- utilidades
function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { stdio: 'pipe', encoding: 'utf8', shell: IS_WIN, ...opts });
}
function commandExists(cmd) {
  const r = run(IS_WIN ? 'where' : 'which', [cmd]);
  return r.status === 0;
}
function nativePath(p) {
  return IS_WIN ? p.replace(/\//g, '\\') : p;
}
function progressBar(current, total, label) {
  const width = 30;
  const filled = Math.round((width * current) / total);
  const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
  const pct = Math.round((100 * current) / total);
  const line = `\r[${bar}] ${pct}% ${label}`;
  process.stdout.write(line.padEnd(95));
  if (current === total) process.stdout.write('\n');
}

// ---------------------------------------------------------------- prompts
function textPrompt(question, def) {
  return new Promise(resolve => {
    if (!process.stdin.isTTY) return resolve(def);
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`${question} [${def}]: `, answer => {
      rl.close();
      resolve(answer.trim() || def);
    });
  });
}

function checkboxPrompt(title, items) {
  return new Promise(resolve => {
    if (!process.stdin.isTTY) {
      console.log(`${title}\n(entrada no interactiva: se usan los valores por defecto)`);
      return resolve(items.filter(it => it.default).map(it => it.id));
    }
    let idx = 0;
    const state = items.map(it => ({ ...it, checked: !!it.default }));
    const render = () => {
      console.clear();
      console.log(title + '\n');
      state.forEach((it, i) => {
        const cursor = i === idx ? '>' : ' ';
        const box = it.checked ? '[x]' : '[ ]';
        const lockNote = it.locked ? ' (obligatorio)' : '';
        console.log(`${cursor} ${box} ${it.label}${lockNote}`);
        if (it.desc) console.log(`      ${it.desc}`);
      });
      console.log('\n↑/↓ mover · espacio marcar/desmarcar · enter confirmar · q cancelar');
    };
    const cleanup = () => {
      process.stdin.removeListener('keypress', onKey);
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
    };
    const onKey = (str, key) => {
      if (key.name === 'up') idx = (idx - 1 + state.length) % state.length;
      else if (key.name === 'down') idx = (idx + 1) % state.length;
      else if (key.name === 'space') { if (!state[idx].locked) state[idx].checked = !state[idx].checked; }
      else if (key.name === 'return') {
        cleanup();
        resolve(state.filter(s => s.checked).map(s => s.id));
        return;
      } else if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
        cleanup();
        console.log('\nCancelado.');
        process.exit(1);
      }
      render();
    };
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.on('keypress', onKey);
    render();
  });
}

// ---------------------------------------------------------------- pasos
function writeClaudeMd(vaultPath) {
  const dst = path.join(CLAUDE_DIR, 'CLAUDE.md');
  let out = fs.readFileSync(path.join(REPO_ROOT, 'CLAUDE.md'), 'utf8');
  out = out
    .replace(
      'Este workspace está diseñado para que cualquier modelo (Haiku, Sonnet, Opus) trabaje',
      `Esta configuración global (copia del ecosistema maestro en ${nativePath(REPO_ROOT)}) hace que cualquier modelo (Haiku, Sonnet, Opus) trabaje, en cualquier proyecto,`
    )
    .replace('son el contrato de calidad de este proyecto.', 'son el contrato de calidad de todas tus sesiones.')
    .split('~/ANDROMEDA').join(vaultPath.replace(/\\/g, '/'))
    .split('C:\\ANDROMEDA').join(nativePath(vaultPath))
    .split('C:/ANDROMEDA').join(vaultPath.replace(/\\/g, '/'));
  fs.writeFileSync(dst, out, 'utf8');
}

function copyCore(vaultPath) {
  const pairs = [
    [path.join(REPO_ROOT, '.claude/skills'), path.join(CLAUDE_DIR, 'skills')],
    [path.join(REPO_ROOT, '.claude/agents'), path.join(CLAUDE_DIR, 'agents')],
    [path.join(REPO_ROOT, 'docs'), path.join(CLAUDE_DIR, 'docs')],
    [path.join(REPO_ROOT, 'tools/hooks'), path.join(CLAUDE_DIR, 'hooks')],
  ];
  for (const [src, dst] of pairs) {
    fs.rmSync(dst, { recursive: true, force: true });
    fs.cpSync(src, dst, { recursive: true });
  }
  writeClaudeMd(vaultPath);

  // Reescribe referencias `docs/X.md` a la ruta absoluta de esta máquina, y
  // cualquier mención de la bóveda de ejemplo a la bóveda real del usuario.
  const DOCS_ABS = path.join(CLAUDE_DIR, 'docs') + path.sep;
  const DOCS_RE = /`docs\/(PROMPTING|ECONOMIA-TOKENS|WORKFLOWS|DEBUGGING|FULLSTACK|DATA|ANDROID|REACT-NATIVE|CAPACITOR|DESKTOP|GITHUB|AUTOMATION|DESIGN|OPENCODE|GRAPHIFY|HIVEMIND)\.md`/g;
  const walk = p => (fs.statSync(p).isFile() ? (p.endsWith('.md') ? [p] : []) : fs.readdirSync(p).flatMap(n => walk(path.join(p, n))));
  const mdFiles = [path.join(CLAUDE_DIR, 'skills'), path.join(CLAUDE_DIR, 'agents'), path.join(CLAUDE_DIR, 'docs')].flatMap(walk);
  for (const f of mdFiles) {
    let out = fs.readFileSync(f, 'utf8');
    out = out.replace(DOCS_RE, (_, name) => '`' + DOCS_ABS + name + '.md`');
    const rewritten = out
      .split('~/ANDROMEDA').join(vaultPath.replace(/\\/g, '/'))
      .split('C:\\ANDROMEDA').join(nativePath(vaultPath))
      .split('C:/ANDROMEDA').join(vaultPath.replace(/\\/g, '/'));
    if (rewritten !== fs.readFileSync(f, 'utf8')) fs.writeFileSync(f, rewritten, 'utf8');
  }

  // Personaliza el hook de contexto de proyecto con la bóveda elegida.
  const hookFile = path.join(CLAUDE_DIR, 'hooks', 'andromeda-context.js');
  let hookSrc = fs.readFileSync(hookFile, 'utf8');
  hookSrc = hookSrc.replace(/const VAULT = .*?;\n/, `const VAULT = process.env.ANDROMEDA_VAULT || ${JSON.stringify(path.join(vaultPath, '01-Proyectos'))};\n`);
  fs.writeFileSync(hookFile, hookSrc, 'utf8');

  return { ok: true };
}

function writeSettings({ vault, graphify }) {
  const H = p => path.join(CLAUDE_DIR, 'hooks', p).replace(/\\/g, '/');
  const preToolUse = [
    { matcher: 'Edit|Write', hooks: [{ type: 'command', command: `node "${H('protect-secrets.js')}"` }] },
  ];
  if (graphify) {
    preToolUse.push(
      { matcher: 'Bash|Grep', hooks: [{ type: 'command', command: 'graphify hook-guard search' }] },
      { matcher: 'Read|Glob', hooks: [{ type: 'command', command: 'graphify hook-guard read' }] }
    );
  }
  const sessionStartHooks = [{ type: 'command', command: `node "${H('handoff-reminder.js')}"` }];
  if (vault) sessionStartHooks.push({ type: 'command', command: `node "${H('andromeda-context.js')}"` });

  let master = {};
  try { master = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.claude/settings.json'), 'utf8')); } catch {}
  const settingsPath = path.join(CLAUDE_DIR, 'settings.json');
  let existing = {};
  try { existing = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); } catch {}
  existing.permissions = existing.permissions || master.permissions || { allow: [], deny: [] };
  existing.enableAllProjectMcpServers = true;
  existing.hooks = { PreToolUse: preToolUse, SessionStart: [{ hooks: sessionStartHooks }] };
  fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2) + '\n', 'utf8');
  return { ok: true };
}

function createVault(vaultPath) {
  const proyectos = path.join(vaultPath, '01-Proyectos');
  const plantillas = path.join(vaultPath, 'Plantillas');
  fs.mkdirSync(proyectos, { recursive: true });
  fs.mkdirSync(plantillas, { recursive: true });
  const templateFile = path.join(plantillas, 'Proyecto.md');
  if (!fs.existsSync(templateFile)) {
    fs.writeFileSync(
      templateFile,
      '---\nruta: ""\n---\n\n# Resumen\n\n(Mapa denso del proyecto: qué es, decisiones tomadas, estado actual. No un diario.)\n',
      'utf8'
    );
  }
  return { ok: true };
}

function registerMcpServers(opts) {
  const configPath = path.join(HOME, '.claude.json');
  let data = {};
  if (fs.existsSync(configPath)) {
    data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    fs.copyFileSync(configPath, configPath + '.bak');
  }
  data.mcpServers = data.mcpServers || {};
  const npx = (...args) => (IS_WIN ? { command: 'cmd', args: ['/c', 'npx', '-y', ...args] } : { command: 'npx', args: ['-y', ...args] });

  if (opts.sequential) data.mcpServers['sequential-thinking'] = npx('@modelcontextprotocol/server-sequential-thinking');
  if (opts.memory) {
    data.mcpServers['memory'] = {
      ...npx('@modelcontextprotocol/server-memory'),
      env: { MEMORY_FILE_PATH: path.join(CLAUDE_DIR, 'knowledge-graph.json') },
    };
  }
  if (opts.chrome) {
    data.mcpServers['chrome-devtools'] = npx(
      'chrome-devtools-mcp@latest', '--isolated', '--viewport=1280x800', '--screenshotFormat=webp', '--screenshotQuality=80', '--screenshotMaxWidth=1280'
    );
  }
  if (opts.obsidianVault) {
    data.mcpServers['obsidian-vault'] = { type: 'stdio', ...npx('@modelcontextprotocol/server-filesystem', opts.obsidianVault), env: {} };
  }
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf8');
  return { ok: true, msg: fs.existsSync(configPath + '.bak') ? 'copia de respaldo en .claude.json.bak' : undefined };
}

function installObsidianApp() {
  if (IS_WIN) {
    if (!commandExists('winget')) return { ok: false, msg: 'winget no disponible; instala manualmente desde https://obsidian.md/download' };
    const r = run('winget', ['install', '-e', '--id', 'Obsidian.Obsidian', '--silent', '--accept-package-agreements', '--accept-source-agreements']);
    return r.status === 0 ? { ok: true } : { ok: false, msg: 'winget falló: ' + (r.stderr || '').slice(0, 200) };
  }
  if (commandExists('snap')) {
    const r = run('snap', ['install', 'obsidian', '--classic']);
    if (r.status === 0) return { ok: true };
  }
  if (commandExists('flatpak')) {
    const r = run('flatpak', ['install', '-y', 'flathub', 'md.obsidian.Obsidian']);
    if (r.status === 0) return { ok: true };
  }
  return { ok: false, msg: 'sin winget/snap/flatpak disponible (o requieren sudo); instala manualmente desde https://obsidian.md/download' };
}

function installGraphify() {
  const pip = commandExists('pip3') ? 'pip3' : commandExists('pip') ? 'pip' : null;
  if (!pip) return { ok: false, msg: 'no se encontró pip/pip3; instala Python primero' };
  const r1 = run(pip, ['install', '--user', 'graphifyy']);
  if (r1.status !== 0) return { ok: false, msg: 'pip install falló: ' + (r1.stderr || '').slice(0, 200) };
  if (!commandExists('graphify')) {
    return { ok: false, msg: 'graphify se instaló pero no está en PATH; añade el directorio Scripts/bin de tu Python al PATH y vuelve a correr "graphify install --platform ' + (IS_WIN ? 'windows' : 'linux') + '"' };
  }
  const r2 = run('graphify', ['install', '--platform', IS_WIN ? 'windows' : 'linux'], { env: { ...process.env, CLAUDE_CONFIG_DIR: CLAUDE_DIR } });
  // graphify install sobreescribe CLAUDE.md con un stub espurio: se restaura la versión real.
  try { writeClaudeMd(lastVaultPath); } catch {}
  return r2.status === 0 ? { ok: true } : { ok: false, msg: 'graphify install --platform falló, revisa docs/GRAPHIFY.md: ' + (r2.stderr || '').slice(0, 200) };
}

// ---------------------------------------------------------------- main
let lastVaultPath = DEFAULT_VAULT;

async function main() {
  console.log('=== Instalador del ecosistema NEPTUNO ===\n');
  console.log(`Origen:  ${REPO_ROOT}`);
  console.log(`Destino: ${CLAUDE_DIR}\n`);

  const vaultPath = await textPrompt('Ruta para tu bóveda de notas (nueva, vacía)', DEFAULT_VAULT);
  lastVaultPath = vaultPath;

  const items = [
    { id: 'core', label: 'Núcleo NEPTUNO (skills, agentes, docs, CLAUDE.md, hooks básicos)', default: true, locked: true },
    { id: 'mcp-sequential', label: 'MCP sequential-thinking (razonamiento paso a paso)', default: true },
    { id: 'mcp-memory', label: 'MCP memory (grafo de conocimiento entre sesiones)', default: true },
    { id: 'mcp-chrome', label: 'MCP chrome-devtools (verificación real de frontend)', default: false },
    { id: 'vault', label: 'Bóveda de notas + hook de contexto de proyecto', default: true },
    { id: 'obsidian-app', label: 'Instalar la app de escritorio Obsidian', default: true },
    { id: 'graphify', label: 'graphify (grafo de conocimiento del código, requiere Python)', default: false },
  ];
  const selected = await checkboxPrompt('Elige qué instalar y configurar:', items);
  const has = id => selected.includes(id);

  const steps = [
    { label: 'Copiando skills, agentes, docs y CLAUDE.md', fn: () => copyCore(vaultPath) },
    { label: 'Escribiendo settings.json (hooks y permisos)', fn: () => writeSettings({ vault: has('vault'), graphify: has('graphify') }) },
  ];
  if (has('vault')) steps.push({ label: 'Creando bóveda de notas', fn: () => createVault(vaultPath) });
  if (has('mcp-sequential') || has('mcp-memory') || has('mcp-chrome') || has('vault')) {
    steps.push({
      label: 'Registrando servidores MCP',
      fn: () => registerMcpServers({
        sequential: has('mcp-sequential'), memory: has('mcp-memory'), chrome: has('mcp-chrome'),
        obsidianVault: has('vault') ? vaultPath : null,
      }),
    });
  }
  if (has('obsidian-app')) steps.push({ label: 'Instalando Obsidian (app de escritorio)', fn: installObsidianApp });
  if (has('graphify')) steps.push({ label: 'Instalando graphify (pip)', fn: installGraphify });

  console.log('\nInstalando...\n');
  const results = [];
  for (let i = 0; i < steps.length; i++) {
    progressBar(i, steps.length, steps[i].label);
    let res;
    try { res = steps[i].fn(); } catch (e) { res = { ok: false, msg: e.message }; }
    results.push({ label: steps[i].label, ...(res || { ok: true }) });
    progressBar(i + 1, steps.length, steps[i].label);
  }

  console.log('\n=== Resumen ===');
  for (const r of results) console.log(`${r.ok ? '✔' : '✘'} ${r.label}${r.msg ? ' — ' + r.msg : ''}`);
  console.log('\nListo. Abre una terminal nueva y ejecuta "claude" en cualquier proyecto.');
  if (has('vault')) console.log(`Tu bóveda de notas: ${vaultPath}`);
}

main();
