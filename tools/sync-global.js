// Sincroniza el ecosistema NEPTUNO (copia maestra) hacia <home>/.claude/ (copia global).
// Uso: node tools/sync-global.js
// Rutas derivadas del propio script y de os.homedir(): funciona igual en Windows y Linux.
// Copia skills/, agents/, docs/ y CLAUDE.md, y reescribe en las copias las referencias
// `docs/X.md` (relativas al workspace) a rutas absolutas globales, más la frase de intro.
const fs = require('fs');
const path = require('path');
const os = require('os');

const SRC = path.resolve(__dirname, '..');
const DST = path.join(os.homedir(), '.claude');
const DOCS_ABS = path.join(DST, 'docs') + path.sep;
const DOCS_RE = /`docs\/(PROMPTING|ECONOMIA-TOKENS|WORKFLOWS|DEBUGGING|FULLSTACK|DATA|ANDROID|REACT-NATIVE|CAPACITOR|DESKTOP|GITHUB|AUTOMATION|DESIGN|OPENCODE|GRAPHIFY|HIVEMIND)\.md`/g;

const pairs = [
  [path.join(SRC, '.claude/skills'), path.join(DST, 'skills')],
  [path.join(SRC, '.claude/agents'), path.join(DST, 'agents')],
  [path.join(SRC, 'docs'), path.join(DST, 'docs')],
  [path.join(SRC, 'tools/hooks'), path.join(DST, 'hooks')],
  [path.join(SRC, 'CLAUDE.md'), path.join(DST, 'CLAUDE.md')],
];

for (const [src, dst] of pairs) {
  fs.rmSync(dst, { recursive: true, force: true });
  fs.cpSync(src, dst, { recursive: true });
}

function walk(p) {
  if (fs.statSync(p).isFile()) return p.endsWith('.md') ? [p] : [];
  return fs.readdirSync(p).flatMap(n => walk(path.join(p, n)));
}

let rewritten = 0;
for (const f of pairs.flatMap(([, dst]) => walk(dst))) {
  const orig = fs.readFileSync(f, 'utf8');
  let out = orig.replace(DOCS_RE, (_, name) => '`' + DOCS_ABS + name + '.md`');
  if (path.basename(f) === 'CLAUDE.md' && path.dirname(f).replace(/\\/g, '/') === DST) {
    out = out
      .replace(
        'Este workspace está diseñado para que cualquier modelo (Haiku, Sonnet, Opus) trabaje',
        `Esta configuración global (copia del ecosistema maestro en ${SRC}) hace que cualquier modelo (Haiku, Sonnet, Opus) trabaje, en cualquier proyecto,`
      )
      .replace('son el contrato de calidad de este proyecto.', 'son el contrato de calidad de todas tus sesiones.');
  }
  if (out !== orig) { fs.writeFileSync(f, out, 'utf8'); rewritten++; }
}

// Fusiona SOLO la clave "hooks" del settings.json maestro en el global (el resto del
// settings global — prefs de UI, permisos — no se toca). Las rutas de los hooks se
// reescriben a la copia global para que ~/.claude sea autocontenido.
const masterSettings = JSON.parse(fs.readFileSync(path.join(SRC, '.claude/settings.json'), 'utf8'));
const globalSettingsPath = path.join(DST, 'settings.json');
const globalSettings = fs.existsSync(globalSettingsPath)
  ? JSON.parse(fs.readFileSync(globalSettingsPath, 'utf8'))
  : {};
// El master apunta a $CLAUDE_PROJECT_DIR/tools/hooks/ (correcto para un settings de
// PROYECTO). En el global esa variable apuntaría al proyecto en el que estés, que no
// tiene tools/hooks/: aquí se fija a la copia global, que sí es autocontenida.
const globalHooksDir = path.join(DST, 'hooks').split(path.sep).join('/');
globalSettings.hooks = JSON.parse(
  JSON.stringify(masterSettings.hooks).replaceAll('$CLAUDE_PROJECT_DIR/tools/hooks/', globalHooksDir + '/')
);
fs.writeFileSync(globalSettingsPath, JSON.stringify(globalSettings, null, 2) + '\n', 'utf8');

const count = d => fs.readdirSync(path.join(DST, d)).length;
console.log(`Sincronizado: ${count('skills')} skills, ${count('agents')} agentes, ${count('docs')} docs, ${count('hooks')} hooks, CLAUDE.md global.`);
console.log(`Archivos con referencias reescritas: ${rewritten}. Hooks fusionados en settings.json global.`);
