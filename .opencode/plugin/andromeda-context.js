// Puerto opencode de tools/hooks/andromeda-context.js (misma lógica de búsqueda de nota;
// ver ese archivo para el detalle línea a línea). Usa experimental.chat.system.transform
// en vez de SessionStart (no existe para plugins de opencode — ver handoff-reminder.js para
// la nota de confianza) y `directory` del contexto del plugin en vez de `cwd` por stdin.
import fs from "node:fs";
import path from "node:path";

const VAULT = "C:\\ANDROMEDA\\01-Proyectos";
const MAX_CHARS = 2500; // tope duro: el contexto inyectado debe ser barato

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const normPath = (s) =>
  s.replace(/\\\\/g, "\\").replace(/\//g, "\\").replace(/\\+$/, "").toLowerCase();

export const AndromedaContext = async ({ directory }) => {
  const seen = new Set();
  return {
    "experimental.chat.system.transform": async (input, output) => {
      if (!input.sessionID || seen.has(input.sessionID)) return;
      seen.add(input.sessionID);
      if (!fs.existsSync(VAULT)) return;
      if (normPath(directory).startsWith(normPath("C:\\ANDROMEDA"))) return;

      const notes = fs
        .readdirSync(VAULT)
        .filter((f) => f.endsWith(".md"))
        .map((f) => {
          const full = path.join(VAULT, f);
          const text = fs.readFileSync(full, "utf8");
          const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
          const ruta = fm && fm[1].match(/^ruta:\s*"?(.+?)"?\s*$/m);
          return { file: full, name: f.slice(0, -3), text, ruta: ruta ? normPath(ruta[1]) : null };
        });

      // Candidatos: el directorio del proyecto y hasta 2 padres (proyectos en subcarpetas)
      const candidates = [directory];
      for (let p = directory, i = 0; i < 2; i++) {
        const parent = path.dirname(p);
        if (parent === p) break;
        candidates.push(parent);
        p = parent;
      }

      let hit = null;
      for (const c of candidates) {
        hit =
          notes.find((n) => n.ruta === normPath(c)) ||
          notes.find((n) => norm(n.name) === norm(path.basename(c)));
        if (hit) break;
      }
      if (!hit) return;

      let body = hit.text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim();
      if (body.length > MAX_CHARS) body = body.slice(0, MAX_CHARS) + "\n[... nota truncada]";
      const mtime = fs.statSync(hit.file).mtime.toISOString().slice(0, 10);
      output.system.push(
        `[plugin NEPTUNO·ANDROMEDA] Nota de contexto del proyecto (bóveda ANDROMEDA, "${hit.name}", actualizada ${mtime}) — úsala como mapa inicial y no re-derives lo que ya dice; si hay HANDOFF.md, ese manda sobre esta nota:\n\n${body}`
      );
    },
  };
};
