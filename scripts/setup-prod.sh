#!/usr/bin/env bash
# ============================================================
# setup-prod.sh — One-time VPS setup for PRODUCTION
# ============================================================
# Runs LiveKit Server + Redis + Caddy (TLS) via Docker Compose.
# Requires a domain with DNS A records pointing to this server.
#
# Usage:
#   1. Edit the variables below
#   2. ssh root@<VPS_IP> 'bash -s' < scripts/setup-prod.sh
# ============================================================
set -euo pipefail

# ╔══════════════════════════════════════════════════╗
# ║  EDIT THESE BEFORE RUNNING                       ║
# ╚══════════════════════════════════════════════════╝
DOMAIN="livekit.yourdomain.com"
TURN_DOMAIN="turn.yourdomain.com"

# Generate these: openssl rand -hex 16
LIVEKIT_API_KEY="devkey$(openssl rand -hex 4)"
LIVEKIT_API_SECRET="$(openssl rand -hex 32)"

INSTALL_DIR="/opt/livekit"

echo "=== LiveKit Production Setup ==="
echo "Domain:      $DOMAIN"
echo "TURN domain: $TURN_DOMAIN"
echo "Install dir: $INSTALL_DIR"
echo ""

# ── 1. Install Docker & Docker Compose if missing ──
if ! command -v docker &>/dev/null; then
    echo ">> Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable --now docker
fi

if ! docker compose version &>/dev/null; then
    echo ">> Installing Docker Compose plugin..."
    apt-get update && apt-get install -y docker-compose-plugin
fi

# ── 2. Open firewall ports ──
echo ">> Configuring firewall..."
if command -v ufw &>/dev/null; then
    ufw allow 80/tcp       # TLS issuance
    ufw allow 443/tcp      # HTTPS + TURN/TLS
    ufw allow 7881/tcp     # WebRTC over TCP
    ufw allow 3478/udp     # TURN/UDP
    ufw allow 50000:60000/udp  # WebRTC over UDP
    ufw --force enable
elif command -v firewall-cmd &>/dev/null; then
    firewall-cmd --zone public --permanent --add-port 80/tcp
    firewall-cmd --zone public --permanent --add-port 443/tcp
    firewall-cmd --zone public --permanent --add-port 7881/tcp
    firewall-cmd --zone public --permanent --add-port 3478/udp
    firewall-cmd --zone public --permanent --add-port 50000-60000/udp
    firewall-cmd --reload
fi

# ── 3. Create install directory ──
mkdir -p "$INSTALL_DIR"

# ── 4. Write LiveKit config ──
cat > "$INSTALL_DIR/livekit.yaml" <<EOF
port: 7880
rtc:
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: true
keys:
  ${LIVEKIT_API_KEY}: ${LIVEKIT_API_SECRET}
turn:
  enabled: true
  domain: ${TURN_DOMAIN}
  tls_port: 443
  udp_port: 3478
  external_tls: true
logging:
  level: info
EOF

# ── 5. Write Redis config ──
cat > "$INSTALL_DIR/redis.conf" <<EOF
bind 127.0.0.1
port 6379
protected-mode yes
EOF

# ── 6. Write Caddy config ──
cat > "$INSTALL_DIR/caddy.yaml" <<EOF
logging:
  logs:
    default:
      level: INFO
apps:
  tls:
    certificates:
      automate:
        - ${DOMAIN}
        - ${TURN_DOMAIN}
  layer4:
    servers:
      main:
        listen:
          - ":443"
        routes:
          - match:
              - tls:
                  sni:
                    - "${TURN_DOMAIN}"
            handle:
              - handler: tls
              - handler: proxy
                upstreams:
                  - dial:
                      - "localhost:5349"
          - match:
              - tls:
                  sni:
                    - "${DOMAIN}"
            handle:
              - handler: tls
              - handler: proxy
                upstreams:
                  - dial:
                      - "localhost:7880"
  http:
    servers:
      default:
        listen:
          - ":80"
        routes:
          - handle:
              - handler: static_response
                status_code: 200
                body: "OK"
EOF

# ── 7. Write Docker Compose ──
cat > "$INSTALL_DIR/docker-compose.yaml" <<EOF
version: "3.9"

services:
  livekit:
    image: livekit/livekit-server:latest
    restart: unless-stopped
    network_mode: host
    volumes:
      - ./livekit.yaml:/etc/livekit.yaml
    command: --config /etc/livekit.yaml

  caddy:
    image: livekit/caddyl4:latest
    restart: unless-stopped
    network_mode: host
    volumes:
      - ./caddy.yaml:/etc/caddy.yaml
      - caddy_data:/data
    command: run --config /etc/caddy.yaml --adapter yaml

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    network_mode: host
    volumes:
      - ./redis.conf:/etc/redis/redis.conf
    command: redis-server /etc/redis/redis.conf

volumes:
  caddy_data:
EOF

# ── 8. Create systemd service ──
cat > /etc/systemd/system/livekit-docker.service <<EOF
[Unit]
Description=LiveKit Server (Docker Compose)
Requires=docker.service
After=docker.service

[Service]
Type=simple
WorkingDirectory=${INSTALL_DIR}
ExecStart=/usr/bin/docker compose up
ExecStop=/usr/bin/docker compose down
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable livekit-docker

# ── 9. Start services ──
echo ">> Starting LiveKit production stack..."
systemctl start livekit-docker

echo ""
echo "=== DONE ==="
echo ""
echo "LiveKit Server: wss://${DOMAIN}"
echo ""
echo "API Key:    ${LIVEKIT_API_KEY}"
echo "API Secret: ${LIVEKIT_API_SECRET}"
echo ""
echo "SAVE THESE CREDENTIALS — update your .env.local:"
echo "  LIVEKIT_URL=wss://${DOMAIN}"
echo "  LIVEKIT_API_KEY=${LIVEKIT_API_KEY}"
echo "  LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET}"
echo ""
echo "Make sure DNS A records point to this server:"
echo "  ${DOMAIN}      ->  $(hostname -I | awk '{print $1}')"
echo "  ${TURN_DOMAIN}  ->  $(hostname -I | awk '{print $1}')"
echo ""
echo "Check status:  systemctl status livekit-docker"
echo "View logs:     cd ${INSTALL_DIR} && docker compose logs -f"
