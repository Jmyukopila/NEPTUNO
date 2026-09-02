#!/usr/bin/env node
// NEPTUNO · Avisa a Claude, al abrir sesión, de que la flota externa está apagada.
//
// Sin esto el bloqueo del despachador llega tarde: Claude planifica un reparto entre agentes,
// redacta los encargos y solo entonces choca con el error. El aviso lo evita antes de gastar
// nada.
//
// Solo habla cuando está APAGADA: si la flota está disponible, CLAUDE.md §9 ya lo dice y
// repetirlo cuesta contexto sin añadir información.
//
// Lee el estado a mano en vez de requerir tools/hivemind-estado.js a propósito: `sync-global.js`
// copia los hooks aplanados a ~/.claude/hooks/, donde una ruta relativa al repo no existiría.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

function apagada() {
  const env = process.env.NEPTUNO_HIVEMIND;
  if (env !== undefined && env !== '') return /^(0|no|off|false)$/i.test(env.trim());
  try {
    const c = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.neptuno', 'hivemind.json'), 'utf8'));
    return c.activo === false;
  } catch {
    return false;
  }
}

if (apagada()) {
  console.log(
    '[hook NEPTUNO·HIVEMIND] La flota externa está APAGADA: modo solo Claude. No delegues en ' +
    'opencode, antigravity ni devin, ni propongas repartir la tarea entre ellos — hazla tú en ' +
    'esta sesión. `hivemind.js run` y `session` fallarán a propósito si lo intentas. El usuario ' +
    'lo reactiva con `node tools/hivemind.js on`.'
  );
}
process.exit(0);
