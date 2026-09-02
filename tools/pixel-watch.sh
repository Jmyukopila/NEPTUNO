#!/usr/bin/env bash
# Vigila las conexiones de red de pixel-agents mientras corre.
#
# La auditoría estática dice que su bundle no tiene NINGUNA primitiva de red saliente
# (ni fetch, ni https.request, ni axios, ni WebSocket cliente, ni dns) y que la UI no
# carga recursos remotos. Esto lo comprueba en ejecución, que es la evidencia que vale.
#
# Uso:  bash tools/pixel-watch.sh        (Ctrl+C para parar)
set -uo pipefail

echo "Vigilando pixel-agents. Ctrl+C para parar."
echo "Una linea REMOTA = conexion fuera de tu maquina. No deberia aparecer ninguna."
echo

visto_pid=""
while true; do
  PIDS=$(pgrep -f "pixel-agents" 2>/dev/null | tr '\n' ',' | sed 's/,$//')
  if [ -z "$PIDS" ]; then
    [ -n "$visto_pid" ] && { echo "$(date +%H:%M:%S)  pixel-agents ya no corre."; visto_pid=""; }
    sleep 3; continue
  fi
  if [ "$PIDS" != "$visto_pid" ]; then
    echo "$(date +%H:%M:%S)  pixel-agents vivo (pid $PIDS)"
    echo "  --- escuchando en ---"
    ss -tlnp 2>/dev/null | grep -E "pid=(${PIDS//,/|})" | awk '{print "    "$4}' || echo "    (nada)"
    visto_pid="$PIDS"
  fi

  # Conexiones establecidas que NO sean a loopback: eso seria una fuga.
  REMOTAS=$(ss -tnp 2>/dev/null | grep -E "pid=(${PIDS//,/|})" \
            | awk '$5 !~ /^(127\.|\[::1\]|\[::ffff:127\.)/ {print $5}' | sort -u)
  if [ -n "$REMOTAS" ]; then
    echo "$(date +%H:%M:%S)  *** REMOTA *** $(echo "$REMOTAS" | tr '\n' ' ')"
  fi

  # Archivos que tiene abiertos bajo tu HOME, para ver QUE lee (transcripts incluidos).
  if [ "${VERBOSE:-0}" = "1" ]; then
    lsof -p "${PIDS%%,*}" 2>/dev/null | awk '/\/home\// {print "    lee: "$NF}' | sort -u | head -5
  fi
  sleep 4
done
