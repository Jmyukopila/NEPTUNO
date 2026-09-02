'use strict';
// NEPTUNO · Estado del hivemind: si la flota externa está disponible o si se trabaja solo con
// Claude. Vive FUERA del repo (~/.neptuno) por dos razones: vale para todos los proyectos, y
// ninguna de las capas generadas por los sync lo puede pisar.
//
// La variable de entorno manda sobre el fichero, para apagarlo en una sola invocación sin tocar
// el estado guardado:  NEPTUNO_HIVEMIND=0 node tools/hivemind.js run ...
const fs = require('fs');
const os = require('os');
const path = require('path');

const ESTADO = path.join(os.homedir(), '.neptuno', 'hivemind.json');

function leer() {
  const env = process.env.NEPTUNO_HIVEMIND;
  if (env !== undefined && env !== '') {
    return { activo: !/^(0|no|off|false)$/i.test(env.trim()), origen: 'variable de entorno NEPTUNO_HIVEMIND' };
  }
  try {
    const c = JSON.parse(fs.readFileSync(ESTADO, 'utf8'));
    return { activo: c.activo !== false, origen: ESTADO };
  } catch {
    // Sin fichero, la flota está disponible: apagarla es una decisión explícita, no el default.
    return { activo: true, origen: 'por defecto (no hay fichero de estado)' };
  }
}

function escribir(activo) {
  fs.mkdirSync(path.dirname(ESTADO), { recursive: true });
  fs.writeFileSync(ESTADO, JSON.stringify({ activo: !!activo, cambiado: new Date().toISOString() }, null, 2) + '\n');
  return leer();
}

module.exports = { ESTADO, leer, escribir };
