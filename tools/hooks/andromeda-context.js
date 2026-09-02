// Hook SessionStart: si el proyecto actual tiene nota en la bóveda ANDROMEDA
// (<bóveda>/01-Proyectos/*.md), inyecta su cuerpo como contexto inicial — un
// mapa del proyecto a coste casi cero que evita explorar en frío. Silencioso si
// no hay bóveda o no hay nota. La nota la mantiene viva la skill /handoff.
// La ruta de la bóveda sale de $ANDROMEDA_VAULT o de <home>/ANDROMEDA: sin rutas fijas
// de ninguna plataforma. El instalador la reescribe a la bóveda real de la máquina.
const fs = require('fs');
const path = require('path');
const os = require('os');

const VAULT = process.env.ANDROMEDA_VAULT || path.join(os.homedir(), 'ANDROMEDA', '01-Proyectos');
const MAX_CHARS = 2500; // tope duro: el contexto inyectado debe ser barato

const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const normPath = s => path.resolve(s).replace(/[\\/]+$/, '').toLowerCase();

let raw = '';
process.stdin.on('data', d => (raw += d));
process.stdin.on('end', () => {
  let cwd = process.cwd();
  try { cwd = JSON.parse(raw).cwd || cwd; } catch {}
  if (!fs.existsSync(VAULT)) process.exit(0);
  if (normPath(cwd).startsWith(normPath(path.dirname(VAULT)))) process.exit(0);

  const notes = fs.readdirSync(VAULT).filter(f => f.endsWith('.md')).map(f => {
    const full = path.join(VAULT, f);
    const text = fs.readFileSync(full, 'utf8');
    const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const ruta = fm && fm[1].match(/^ruta:\s*"?(.+?)"?\s*$/m);
    return { file: full, name: f.slice(0, -3), text, ruta: ruta ? normPath(ruta[1]) : null };
  });

  // Candidatos: el cwd y hasta 2 padres (sesiones abiertas en subcarpetas del proyecto)
  const candidates = [cwd];
  for (let p = cwd, i = 0; i < 2; i++) {
    const parent = path.dirname(p);
    if (parent === p) break;
    candidates.push(parent);
    p = parent;
  }

  let hit = null;
  for (const c of candidates) {
    hit =
      notes.find(n => n.ruta === normPath(c)) ||
      notes.find(n => norm(n.name) === norm(path.basename(c)));
    if (hit) break;
  }
  if (!hit) process.exit(0);

  let body = hit.text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim();
  if (body.length > MAX_CHARS) body = body.slice(0, MAX_CHARS) + '\n[... nota truncada]';
  const mtime = fs.statSync(hit.file).mtime.toISOString().slice(0, 10);
  process.stdout.write(
    `[hook NEPTUNO·ANDROMEDA] Nota de contexto del proyecto (bóveda ANDROMEDA, "${hit.name}", actualizada ${mtime}) — úsala como mapa inicial y no re-derives lo que ya dice; si hay HANDOFF.md, ese manda sobre esta nota:\n\n${body}`
  );
  process.exit(0);
});
