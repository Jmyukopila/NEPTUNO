// Puerto opencode de tools/hooks/handoff-reminder.js: si el proyecto tiene HANDOFF.md,
// inyecta el recordatorio de leerlo. Claude Code usa el evento SessionStart, que no existe
// para plugins de opencode (ver Hooks en @opencode-ai/plugin/dist/index.d.ts); el sustituto
// real es experimental.chat.system.transform (tipado y enviado en el paquete instalado),
// que se dispara por turno — se deduplica por sessionID para que actúe una sola vez, como
// un SessionStart. NOTA DE CONFIANZA: nombre "experimental", puede cambiar entre versiones
// de opencode; verificar en vivo tras actualizar opencode.
import fs from "node:fs";
import path from "node:path";

export const HandoffReminder = async ({ directory }) => {
  const seen = new Set();
  return {
    "experimental.chat.system.transform": async (input, output) => {
      if (!input.sessionID || seen.has(input.sessionID)) return;
      seen.add(input.sessionID);
      const handoff = path.join(directory, "HANDOFF.md");
      if (!fs.existsSync(handoff)) return;
      const mtime = fs.statSync(handoff).mtime.toISOString().slice(0, 10);
      output.system.push(
        `[plugin NEPTUNO] Existe HANDOFF.md (modificado ${mtime}). Si el usuario retoma un trabajo, léelo ANTES de hacer nada: contiene estado, decisiones tomadas y callejones ya explorados.`
      );
    },
  };
};
