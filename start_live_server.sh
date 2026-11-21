#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${1:-8443}"
CERT_DIR="/tmp/aruco-3d-measure-ssl"
mkdir -p "$CERT_DIR"

# Lokale LAN-IP ermitteln (macOS + Linux)
IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")"
[[ -z "$IP" ]] && IP="127.0.0.1"

# Selbstsigniertes Zertifikat (einmalig in /tmp erzeugen)
if [[ ! -f "$CERT_DIR/cert.pem" || ! -f "$CERT_DIR/key.pem" ]]; then
  openssl req -x509 -newkey rsa:2048 -nodes \
    -keyout "$CERT_DIR/key.pem" \
    -out "$CERT_DIR/cert.pem" \
    -days 365 \
    -subj "/CN=$IP" \
    -addext "subjectAltName=IP:$IP,IP:127.0.0.1,DNS:localhost" \
    2>/dev/null
fi

echo "============================================================"
echo " ArUco 3D-Messwerkzeug (lokaler HTTPS-Server)"
echo " Öffne im Smartphone-Browser (im selben WLAN):"
echo ""
echo "   https://${IP}:${PORT}/"
echo ""
echo " Bei Zertifikatswarnung: 'Details anzeigen' -> 'Website besuchen'"
echo " Beenden mit Ctrl+C"
echo "============================================================"

cd "$DIR"
exec python3 - "$PORT" "$CERT_DIR/cert.pem" "$CERT_DIR/key.pem" <<'PY'
import http.server, ssl, sys

port = int(sys.argv[1])
cert, key = sys.argv[2], sys.argv[3]

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"[HTTPS] {self.address_string()} - {fmt % args}", flush=True)

httpd = http.server.ThreadingHTTPServer(("0.0.0.0", port), QuietHandler)
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ctx.load_cert_chain(certfile=cert, keyfile=key)
httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)
httpd.serve_forever()
PY
