#!/usr/bin/env bash
# NEPTUNO · Abre la oficina como una aplicacion, no como una pestaña.
#
# Chrome en modo --app da una ventana sin barra de URL ni pestañas: el resultado visible es el
# de una app de escritorio. NO es una PWA: el paquete pixel-agents no sirve manifest ni service
# worker, asi que Chrome no ofrece "Instalar". Para eso habria que parchear su index.html en
# node_modules (se pierde en cada npm update -g) o levantar un proxy que reescriba el HTML y
# haga de puente del WebSocket. Esto da lo mismo sin ninguna de las dos deudas.
#
# Y resuelve de paso el problema de la URL caducada: el token rota en cada arranque del
# servidor, asi que aqui se relee del registro en cada lanzamiento en vez de quedar congelado
# en un acceso directo.
#
# Uso:
#   bash tools/pixel-app.sh abrir              (levanta el servicio si hace falta y abre)
#   bash tools/pixel-app.sh instalar-lanzador  (entrada en el menu de aplicaciones, con icono)
#   bash tools/pixel-app.sh desinstalar-lanzador
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ESCRITORIO="$HOME/.local/share/applications/neptuno-pixel-agents.desktop"

navegador() {
  for b in google-chrome google-chrome-stable chromium chromium-browser brave-browser microsoft-edge; do
    command -v "$b" >/dev/null && { command -v "$b"; return; }
  done
  echo "Necesito un navegador basado en Chromium para el modo --app (Firefox no lo tiene)." >&2
  exit 1
}

url() {
  # El servicio puede estar parado: se arranca y se espera a que escriba su registro.
  if ! node "$RAIZ/tools/pixel-bridge.js" url 2>/dev/null | grep -q .; then
    systemctl --user start pixel-agents 2>/dev/null || true
    for _ in $(seq 1 20); do
      node "$RAIZ/tools/pixel-bridge.js" url 2>/dev/null | grep -q . && break
      sleep 0.5
    done
  fi
  node "$RAIZ/tools/pixel-bridge.js" url 2>/dev/null | head -1
}

abrir() {
  local u
  u="$(url)"
  [ -n "$u" ] || { echo "No hay servidor de Pixel Agents vivo y no he podido arrancarlo." >&2; exit 1; }
  # Sin comillas en el usuario final: la URL lleva el token, que es una capacidad al portador.
  nohup "$(navegador)" --app="$u" --window-size=1280,860 >/dev/null 2>&1 &
  echo "Oficina abierta en ventana de aplicacion."
}

instalar_lanzador() {
  local icono_src="$1" dir_icono="$HOME/.local/share/icons/hicolor/256x256/apps"
  mkdir -p "$dir_icono" "$(dirname "$ESCRITORIO")"
  cp "$icono_src" "$dir_icono/neptuno-pixel-agents.png"
  cat > "$ESCRITORIO" <<'ENTRY'
[Desktop Entry]
Type=Application
Name=Oficina NEPTUNO
GenericName=Pixel Agents
Comment=La oficina pixel-art de las sesiones de Claude Code y la flota externa
Exec=bash __RAIZ__/tools/pixel-app.sh abrir
Icon=neptuno-pixel-agents
Terminal=false
Categories=Development;
StartupNotify=true
ENTRY
  sed -i "s|__RAIZ__|$RAIZ|" "$ESCRITORIO"
  chmod +x "$ESCRITORIO"
  update-desktop-database "$(dirname "$ESCRITORIO")" 2>/dev/null || true
  gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" 2>/dev/null || true
  echo "Lanzador instalado: $ESCRITORIO"
}

case "${1:-}" in
  abrir) abrir ;;
  instalar-lanzador) instalar_lanzador "${2:-$RAIZ/tools/assets/pixel-agents-icon.png}" ;;
  desinstalar-lanzador)
    rm -f "$ESCRITORIO" "$HOME/.local/share/icons/hicolor/256x256/apps/neptuno-pixel-agents.png"
    update-desktop-database "$(dirname "$ESCRITORIO")" 2>/dev/null || true
    echo "Lanzador eliminado." ;;
  *) sed -n '2,18p' "${BASH_SOURCE[0]}" | sed 's|^# \?||'; exit 2 ;;
esac
