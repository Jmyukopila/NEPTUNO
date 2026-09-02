// Genera la capa de compatibilidad opencode del ecosistema NEPTUNO a partir de la fuente
// canónica de Claude Code (.claude/skills/, .claude/agents/, .mcp.json) y la sincroniza
// también a nivel global (~/.config/opencode/), igual que tools/sync-global.js hace con
// ~/.claude/. Los archivos .claude/* siguen siendo la fuente de verdad; este script solo
// traduce formato. Uso: node tools/sync-opencode.js [--provider=anthropic|google|openai]
//
// Mapeos (ver docs/OPENCODE.md para el detalle y las notas de confianza):
//   .claude/skills/<n>/SKILL.md  -> .opencode/command/<n>.md
//   .claude/agents/<n>.md        -> .opencode/agent/<n>.md
//   .mcp.json (mcpServers)       -> opencode.json (mcp)
//   tools/hooks/*.js             -> tools/plugins/*.js (traducidos a mano, no generados)
//
// --provider elige a qué proveedor apuntan los 3 niveles haiku/sonnet/opus de los 14
// agentes (por defecto Anthropic, igual que Claude Code). Un agente subagente FIJA su
// modelo — verificado que ese pin gana sobre el --model de la sesión de opencode, así
// que cambiar de proveedor para toda la flota exige regenerar con este flag, no basta
// con `opencode run --model ...`. Ver docs/OPENCODE.md para el detalle y la evidencia.
const fs = require('fs');
const path = require('path');
const os = require('os');

const SRC = path.resolve(__dirname, '..');
const GLOBAL_CLAUDE = path.join(os.homedir(), '.claude');
const GLOBAL_OPENCODE = path.join(os.homedir(), '.config', 'opencode');
const DOCS_ABS_CLAUDE = path.join(GLOBAL_CLAUDE, 'docs') + path.sep;
const DOCS_RE = /`docs\/(PROMPTING|ECONOMIA-TOKENS|WORKFLOWS|DEBUGGING|FULLSTACK|DATA|ANDROID|REACT-NATIVE|CAPACITOR|DESKTOP|GITHUB|AUTOMATION|DESIGN|OPENCODE|GRAPHIFY|HIVEMIND)\.md`/g;
// La skill `graphify` es la única que carga archivos hermanos (`references/*.md`) en
// lugar de ser autocontenida. buildCommands() copia SOLO el cuerpo del SKILL.md a
// .opencode/command/graphify.md, así que esas rutas relativas quedarían colgando: se
// reescriben a la copia global de la skill, igual que DOCS_RE hace con `docs/*.md`.
const REFS_RE = /`references\/([\w-]+)\.md`/g;
const REFS_ABS_CLAUDE = path.join(GLOBAL_CLAUDE, 'skills', 'graphify', 'references') + path.sep;

// Tabla de niveles por proveedor (fast/barato "haiku", equilibrado "sonnet", razonamiento
// profundo "opus"). Solo "anthropic" y "google" están verificados con una llamada real en
// esta cuenta (`opencode run`, ver docs/OPENCODE.md §7); "openai" usa IDs reales del catálogo
// (`opencode models openai`) pero esta cuenta no tiene cuota ahí — sin probar en ejecución.
const PROVIDER_TABLES = {
  anthropic: {
    haiku: 'anthropic/claude-haiku-4-5-20251001',
    sonnet: 'anthropic/claude-sonnet-5',
    opus: 'anthropic/claude-opus-4-8',
    fable: 'anthropic/claude-fable-5',
  },
  google: {
    haiku: 'google/gemini-3-flash-preview',
    sonnet: 'google/gemini-2.5-pro',
    opus: 'google/gemini-3.1-pro-preview',
    fable: 'google/gemini-3.1-pro-preview',
  },
  openai: {
    haiku: 'openai/gpt-4.1-mini',
    sonnet: 'openai/gpt-4.1',
    opus: 'openai/o3',
    fable: 'openai/gpt-4.1',
  },
  // OpenCode Zen: la pasarela propia de opencode. Es el proveedor REAL de esta cuenta
  // (`opencode providers list` -> "OpenCode Zen"), y sus IDs llevan el prefijo `opencode/`,
  // no `anthropic/`: un agente fijado a `anthropic/...` no resuelve con esta credencial.
  zen: {
    haiku: 'opencode/claude-haiku-4-5',
    sonnet: 'opencode/claude-sonnet-5',
    opus: 'opencode/claude-opus-5',
    fable: 'opencode/claude-fable-5',
  },
  // Los modelos de pago de Zen fallan con "Insufficient balance" si el workspace no tiene
  // saldo (verificado). Esta tabla usa los gratuitos, que SÍ ejecutan: es lo que hace que
  // opencode sea utilizable hoy. Cuando haya saldo, regenera con --provider=zen.
  // Medido: `nemotron-3-ultra-free` se cuelga en cola (>117 s sin responder), mientras que
  // `nemotron-3.5-lightning-free` y `ling-3.0-flash-fin-free` contestan en 8 s con exit=0.
  // El gratuito "más potente" es aquí el menos utilizable: se prefiere el que responde.
  'zen-free': {
    haiku: 'opencode/nemotron-3.5-lightning-free',
    sonnet: 'opencode/nemotron-3.5-lightning-free',
    opus: 'opencode/ling-3.0-flash-fin-free',
    fable: 'opencode/ling-3.0-flash-fin-free',
  },
};
const PROVIDER = (process.argv.find((a) => a.startsWith('--provider=')) || '').split('=')[1] || 'anthropic';
if (!PROVIDER_TABLES[PROVIDER]) {
  console.error(`Proveedor desconocido: "${PROVIDER}". Opciones: ${Object.keys(PROVIDER_TABLES).join(', ')}`);
  process.exit(1);
}
const MODEL_MAP = PROVIDER_TABLES[PROVIDER];

// Herramientas Claude Code que implican poder mutar archivos / ejecutar shell / delegar tareas.
const EDIT_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit']);
const BASH_TOOLS = new Set(['Bash']);
const TASK_TOOLS = new Set(['Agent']);

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { fields: {}, body: text };
  const fields = {};
  for (const line of m[1].split(/\r?\n/)) {
    const fm = line.match(/^([\w-]+):\s?(.*)$/);
    if (fm) fields[fm[1]] = fm[2].trim();
  }
  return { fields, body: m[2] };
}

function yamlLine(key, value) {
  const needsQuotes = /^[:>|#&*!?%@`"'\[\]{},]|: /.test(value) || /^\s|\s$/.test(value);
  const v = needsQuotes ? JSON.stringify(value) : value;
  return `${key}: ${v}`;
}

// --- Skills (.claude/skills/<n>/SKILL.md) -> comandos (.opencode/command/<n>.md) ---
function buildCommands(outDir) {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const skillsDir = path.join(SRC, '.claude/skills');
  let n = 0;
  for (const name of fs.readdirSync(skillsDir)) {
    const skillFile = path.join(skillsDir, name, 'SKILL.md');
    if (!fs.existsSync(skillFile)) continue;
    const { fields, body } = parseFrontmatter(fs.readFileSync(skillFile, 'utf8'));
    const fm = [yamlLine('description', fields.description || '')];
    let outBody = body.replace(/^\r?\n/, '');
    if (fields['argument-hint']) {
      outBody = `Argumentos recibidos (formato esperado: ${fields['argument-hint']}): $ARGUMENTS\n\n${outBody}`;
    }
    const out = `---\n${fm.join('\n')}\n---\n\n${outBody}`;
    fs.writeFileSync(path.join(outDir, `${name}.md`), out, 'utf8');
    n++;
  }
  return n;
}

// --- Agentes (.claude/agents/<n>.md) -> agentes opencode (.opencode/agent/<n>.md) ---
function buildAgents(outDir) {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const agentsDir = path.join(SRC, '.claude/agents');
  let n = 0;
  for (const file of fs.readdirSync(agentsDir)) {
    if (!file.endsWith('.md')) continue;
    const { fields, body } = parseFrontmatter(fs.readFileSync(path.join(agentsDir, file), 'utf8'));
    const fm = [yamlLine('description', fields.description || ''), 'mode: subagent'];
    if (fields.model && MODEL_MAP[fields.model]) fm.push(yamlLine('model', MODEL_MAP[fields.model]));

    if (fields.tools) {
      const list = fields.tools.split(',').map((t) => t.trim());
      const perm = {};
      if (!list.some((t) => EDIT_TOOLS.has(t))) perm.edit = 'deny';
      if (!list.some((t) => BASH_TOOLS.has(t))) perm.bash = 'deny';
      if (!list.some((t) => TASK_TOOLS.has(t))) perm.task = 'deny';
      if (Object.keys(perm).length) {
        fm.push('permission:');
        for (const [k, v] of Object.entries(perm)) fm.push(`  ${k}: ${v}`);
      }
    }
    const out = `---\n${fm.join('\n')}\n---\n${body}`;
    fs.writeFileSync(path.join(outDir, file), out, 'utf8');
    n++;
  }
  return n;
}

function rewriteDocs(dir) {
  let rewritten = 0;
  const walk = (p) => {
    if (fs.statSync(p).isFile()) return p.endsWith('.md') ? [p] : [];
    return fs.readdirSync(p).flatMap((n) => walk(path.join(p, n)));
  };
  for (const f of walk(dir)) {
    const orig = fs.readFileSync(f, 'utf8');
    const out = orig
      .replace(DOCS_RE, (_, name) => '`' + DOCS_ABS_CLAUDE + name + '.md`')
      .replace(REFS_RE, (_, name) => '`' + REFS_ABS_CLAUDE + name + '.md`');
    if (out !== orig) { fs.writeFileSync(f, out, 'utf8'); rewritten++; }
  }
  return rewritten;
}

// --- .mcp.json (mcpServers) -> claves "mcp" de opencode.json, fusionadas por nombre ---
function mcpEntriesFromClaudeMcp(rewritePaths) {
  const mcpJson = JSON.parse(fs.readFileSync(path.join(SRC, '.mcp.json'), 'utf8'));
  const out = {};
  for (const [name, server] of Object.entries(mcpJson.mcpServers)) {
    let env = server.env || {};
    if (rewritePaths) {
      env = Object.fromEntries(
        Object.entries(env).map(([k, v]) => [k, typeof v === 'string' ? rewritePaths(v) : v])
      );
    }
    out[name] = { type: 'local', command: [server.command, ...server.args], environment: env, enabled: true };
  }
  return out;
}

function mergeMcpIntoConfig(configPath, mcpEntries) {
  const config = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
    : { $schema: 'https://opencode.ai/config.json' };
  config.mcp = { ...(config.mcp || {}), ...mcpEntries };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
}

// ============ Proyecto (la raíz del repo) ============
const nCommands = buildCommands(path.join(SRC, '.opencode/command'));
const nAgents = buildAgents(path.join(SRC, '.opencode/agent'));
fs.rmSync(path.join(SRC, '.opencode/plugin'), { recursive: true, force: true });
fs.cpSync(path.join(SRC, 'tools/plugins'), path.join(SRC, '.opencode/plugin'), { recursive: true });
const rewrittenProject = rewriteDocs(path.join(SRC, '.opencode'));
mergeMcpIntoConfig(path.join(SRC, 'opencode.json'), mcpEntriesFromClaudeMcp(null));

// ============ Global (~/.config/opencode) ============
for (const sub of ['command', 'agent', 'plugin']) {
  const dst = path.join(GLOBAL_OPENCODE, sub);
  fs.rmSync(dst, { recursive: true, force: true });
  fs.cpSync(path.join(SRC, '.opencode', sub), dst, { recursive: true });
}
const rewrittenGlobal = rewriteDocs(GLOBAL_OPENCODE);
// El servidor "memory" apunta al grafo de conocimiento; en global debe usar el grafo
// global (separado del de NEPTUNO), igual que ya hace el MCP memory de Claude Code.
const rewriteToGlobalGraph = (v) =>
  v.replace(/^~[\\/\\\\]/, os.homedir() + path.sep).replaceAll('C:\\NEPTUNO\\.claude\\knowledge-graph.json', path.join(GLOBAL_CLAUDE, 'knowledge-graph.json'));
mergeMcpIntoConfig(path.join(GLOBAL_OPENCODE, 'opencode.json'), mcpEntriesFromClaudeMcp(rewriteToGlobalGraph));

console.log(`Proveedor de modelos: ${PROVIDER} (haiku=${MODEL_MAP.haiku}, sonnet=${MODEL_MAP.sonnet}, opus=${MODEL_MAP.opus}).`);
console.log(`Proyecto: ${nCommands} comandos, ${nAgents} agentes, plugins copiados, mcp fusionado en opencode.json. Referencias reescritas: ${rewrittenProject}.`);
console.log(`Global: comandos/agentes/plugins espejados en ${GLOBAL_OPENCODE}, mcp fusionado (preserva servidores existentes). Referencias reescritas: ${rewrittenGlobal}.`);
