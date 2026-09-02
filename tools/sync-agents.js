#!/usr/bin/env node
// Genera la capa `.agents/` — el dialecto común que leen Devin y Antigravity — a partir de
// la fuente canónica de Claude Code (.claude/skills/, .claude/agents/, CLAUDE.md).
// Uso: node tools/sync-agents.js [--global]
//
// Por qué existe: los tres destinos leen convenciones distintas, pero `.agents/` es el
// único directorio que Devin Y Antigravity descubren los dos (verificado con
// `devin skills paths` y con las rutas embebidas en el binario de `agy`).
//
//   .claude/skills/<n>/SKILL.md -> .agents/skills/<n>/SKILL.md   (formato idéntico, copia literal)
//   .claude/agents/<n>.md       -> .agents/agents/<n>.md         (formato NO verificado, ver docs)
//   CLAUDE.md                   -> AGENTS.md                     (doctrina, marcada como generada)
//   CLAUDE.md §doctrina         -> .agents/rules/neptuno.md      (regla always-on)
//                               -> .windsurf/rules/neptuno.md    (always-on de Devin)
//
// --global replica skills y agentes también en ~/.agents/, que Devin lista como ruta de
// usuario. Antigravity no documenta un equivalente global: no se asume que lo lea.
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const SRC = path.resolve(__dirname, '..');
const GLOBAL = process.argv.includes('--global');

const BANNER = (origen) =>
  `<!-- GENERADO por tools/sync-agents.js desde ${origen}. No edites este archivo: ` +
  `los cambios se pierden en la próxima sincronización. Edita la fuente en .claude/. -->\n\n`;

function copyTree(src, dst) {
  fs.rmSync(dst, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.cpSync(src, dst, { recursive: true });
  return fs.readdirSync(dst).length;
}

// --- skills y agentes -------------------------------------------------------
const nSkills = copyTree(path.join(SRC, '.claude/skills'), path.join(SRC, '.agents/skills'));
const nAgents = copyTree(path.join(SRC, '.claude/agents'), path.join(SRC, '.agents/agents'));

// --- AGENTS.md --------------------------------------------------------------
// Antigravity lee AGENTS.md; opencode también lo trata como su archivo de proyecto. Se
// genera desde CLAUDE.md para que no haya dos doctrinas que puedan divergir.
const doctrina = fs.readFileSync(path.join(SRC, 'CLAUDE.md'), 'utf8');
fs.writeFileSync(path.join(SRC, 'AGENTS.md'), BANNER('CLAUDE.md') + doctrina, 'utf8');

// --- reglas always-on -------------------------------------------------------
// Un archivo de reglas se inyecta en CADA turno: tiene que ser corto o envenena el contexto
// de todas las sesiones. Aquí va el mínimo irreductible + el puntero a la doctrina larga.
const REGLA = `${BANNER('CLAUDE.md (resumen)')}# NEPTUNO — reglas de ejecución

Trabajas dentro del ecosistema NEPTUNO. La doctrina completa está en \`AGENTS.md\`; las skills
disponibles, en \`.agents/skills/\`. Léelas antes de improvisar un método propio.

1. **ENTENDER → PLANIFICAR → EJECUTAR → VERIFICAR.** Nunca saltes directo a escribir código.
   En tareas de 3+ pasos, escribe el plan antes de tocar un archivo.
2. **Lee antes de editar.** Nunca modifiques un archivo sin haber leído la sección relevante.
3. **Nunca inventes APIs.** Verifica la firma real en el código o en los manifiestos de
   dependencias. Alucinar una firma es el fallo #1 a evitar.
4. **Si hay \`graphify-out/graph.json\`, pregunta al grafo antes de grepear**:
   \`graphify query "<pregunta>"\`. Es más barato que un Grep amplio. El grafo orienta pero no
   autoriza: localiza con él, luego lee el fragmento real antes de editar.
5. **Honestidad de resultados.** Distingue siempre verificado (lo ejecuté y lo vi) de inferido
   y de asumido. Si los tests fallan, reporta el output real. Nunca digas "debería funcionar".
6. **Cambios mínimos que resuelven el problema completo.** Ni parches a medias ni refactors
   que nadie pidió. Imita el estilo del código circundante.
7. **Puedes usar tus propios subagentes** para lo que se te encarga, salvo que el encargo lo
   prohíba. Reparte lo paralelizable; quédate con la integración y la verificación.
`;
// Windsurf (el dialecto de reglas que lee Devin) decide la activación por frontmatter:
// sin `trigger: always_on` la regla queda registrada como "manual" y no se inyecta nunca.
// Verificado con `devin rules list`.
const WINDSURF_FM = '---\ntrigger: always_on\n---\n\n';
fs.mkdirSync(path.join(SRC, '.agents/rules'), { recursive: true });
fs.writeFileSync(path.join(SRC, '.agents/rules/neptuno.md'), REGLA, 'utf8');
fs.mkdirSync(path.join(SRC, '.windsurf/rules'), { recursive: true });
fs.writeFileSync(path.join(SRC, '.windsurf/rules/neptuno.md'), WINDSURF_FM + REGLA, 'utf8');

console.log(`Proyecto: ${nSkills} skills y ${nAgents} agentes en .agents/, AGENTS.md y 2 archivos de reglas (.agents/rules, .windsurf/rules).`);

// --- capa global ------------------------------------------------------------
if (GLOBAL) {
  const g = path.join(os.homedir(), '.agents');
  copyTree(path.join(SRC, '.claude/skills'), path.join(g, 'skills'));
  copyTree(path.join(SRC, '.claude/agents'), path.join(g, 'agents'));
  fs.mkdirSync(path.join(g, 'rules'), { recursive: true });
  fs.writeFileSync(path.join(g, 'rules', 'neptuno.md'), REGLA, 'utf8');
  console.log(`Global: skills, agentes y reglas espejados en ${g} (Devin los lista como rutas de usuario).`);
}
