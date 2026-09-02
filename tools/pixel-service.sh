#!/usr/bin/env bash
# NEPTUNO · Instala Pixel Agents como servicio de usuario de systemd.
#
# POR QUE UN INSTALADOR Y NO UNA UNIDAD COMMITEADA: systemd exige rutas absolutas en
# ExecStart, y el binario vive bajo la version de nvm en curso
# (~/.nvm/versions/node/vXX/lib/node_modules/pixel-agents). Una unidad fija se rompe en
# cuanto cambias de version de Node; esta se regenera con las rutas reales del momento.
# Tras un `nvm install`, vuelve a lanzar `instalar`.
#
# EL TOKEN ROTA EN CADA ARRANQUE y no se puede fijar: `pixel-agents` solo acepta --port y
# --host, y su bundle no lee ninguna variable de entorno de token (verificado sobre el
# bundle: solo usa PIXEL_AGENTS_DEBUG y PIXEL_AGENTS_DEBUG_LOG). Asi que la URL se relee
# despues de cada reinicio con `node tools/pixel-bridge.js url`.
#
# Uso:
#   bash tools/pixel-service.sh instalar [puerto]   (por defecto 3100)
#   bash tools/pixel-service.sh desinstalar
#
# Despues:  systemctl --user {status,restart,stop} pixel-agents
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNIDAD="$HOME/.config/systemd/user/pixel-agents.service"

resolver_node() {
  local n
  n="$(command -v node || true)"
  [ -n "$n" ] && { readlink -f "$n"; return; }
  n="$(ls -d "$HOME"/.nvm/versions/node/*/bin/node 2>/dev/null | sort -V | tail -1 || true)"
  [ -n "$n" ] || { echo "No encuentro node." >&2; exit 1; }
  echo "$n"
}

instalar() {
  local puerto="${1:-3100}"
  local NODE CLI
  NODE="$(resolver_node)"
  CLI="$(dirname "$NODE")/../lib/node_modules/pixel-agents/dist/cli.js"
  CLI="$(readlink -f "$CLI")"
  [ -f "$CLI" ] || { echo "No encuentro pixel-agents. Instalalo con: npm i -g pixel-agents" >&2; exit 1; }

  # El servidor lee watchAllSessions AL ARRANCAR: sin esto descarta los eventos de la flota
  # devolviendo 200 igual, y el fallo parece un exito. Va como ExecStartPre, no como paso
  # manual, para que no se pueda olvidar en un reinicio automatico.
  mkdir -p "$(dirname "$UNIDAD")"
  cat > "$UNIDAD" <<UNIT
[Unit]
Description=Pixel Agents - oficina pixel-art de las sesiones de Claude Code (NEPTUNO)
Documentation=file://$RAIZ/docs/PIXEL-AGENTS.md
After=default.target

[Service]
Type=simple
ExecStartPre=$NODE $RAIZ/tools/pixel-bridge.js preparar
ExecStart=$NODE $CLI --port $puerto --host 127.0.0.1
Restart=always
RestartSec=2

# Sin IPAddressAllow/Deny: en una unidad de USUARIO systemd los acepta y 'systemctl show'
# los muestra, pero NO los aplica (el cortafuegos por cgroup lo instala el gestor del
# sistema). Comprobado lanzando una unidad transitoria con esas mismas propiedades: la
# conexion saliente se establecio igual. Dejarlos seria un cortafuegos decorativo.
# La garantia de privacidad sigue siendo la auditada: bundle sin primitivas de red saliente
# + comprobacion en ejecucion con 'bash tools/pixel-watch.sh'.
#
# Tampoco PrivateDevices/ProtectKernel*: implican soltar capabilities y el gestor de usuario
# no puede, la unidad falla con 218/CAPABILITIES. Lo que si funciona sin privilegios:
NoNewPrivileges=yes
RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6

[Install]
WantedBy=default.target
UNIT

  # Una unidad de 0 bytes systemd la considera *enmascarada*, y `enable --now` se queda
  # colgado sin decir por que. Pasa si el heredoc de arriba aborta a medias.
  [ -s "$UNIDAD" ] || { echo "La unidad quedo vacia: no la instalo." >&2; rm -f "$UNIDAD"; exit 1; }

  # Sin linger, el gestor de usuario muere al cerrar la ultima sesion y el servicio con el.
  loginctl enable-linger "$USER" 2>/dev/null || echo "AVISO: no pude activar linger; el servicio no arrancara solo tras un reinicio hasta que inicies sesion."

  systemctl --user daemon-reload
  systemctl --user enable --now pixel-agents

  echo "Unidad: $UNIDAD"
  systemctl --user --no-pager --lines=0 status pixel-agents || true
}

desinstalar() {
  systemctl --user disable --now pixel-agents 2>/dev/null || true
  rm -f "$UNIDAD"
  systemctl --user daemon-reload
  echo "Servicio eliminado. (linger sigue activo: loginctl disable-linger $USER)"
}

case "${1:-}" in
  instalar) shift; instalar "${1:-3100}" ;;
  desinstalar) desinstalar ;;
  *) sed -n '2,20p' "${BASH_SOURCE[0]}" | sed 's|^# \?||'; exit 2 ;;
esac
