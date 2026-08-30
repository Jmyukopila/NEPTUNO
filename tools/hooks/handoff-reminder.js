// Hook SessionStart: si el directorio del proyecto tiene HANDOFF.md, inyecta el recordatorio
// de leerlo (CLAUDE.md §0). stdout se añade al contexto de la sesión. Silencioso si no existe.
const fs = require('fs');
const path = require('path');

let raw = '';
process.stdin.on('data', d => (raw += d));
process.stdin.on('end', () => {
  let cwd = process.cwd();
  try { cwd = JSON.parse(raw).cwd || cwd; } catch {}
  const handoff = path.join(cwd, 'HANDOFF.md');
  if (fs.existsSync(handoff)) {
    const mtime = fs.statSync(handoff).mtime.toISOString().slice(0, 10);
    process.stdout.write(
      `[hook NEPTUNO] Existe HANDOFF.md (modificado ${mtime}). Si el usuario retoma un trabajo, léelo ANTES de hacer nada (CLAUDE.md §0): contiene estado, decisiones tomadas y callejones ya explorados.`
    );
  }
  process.exit(0);
});
