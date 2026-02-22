#!/usr/bin/env bash
# ============================================================
# setup-dev.sh — One-time VPS setup for DEVELOPMENT
# ============================================================
# Runs LiveKit Server in --dev mode (no TLS, no auth).
# Your local agent connects to ws://<VPS_IP>:7880
#
# Usage:  ssh root@<VPS_IP> 'bash -s' < scripts/setup-dev.sh
# ============================================================
set -euo pipefail

echo "=== LiveKit Dev Server Setup ==="

# ── 1. Install Docker if missing ──
if ! command -v docker &>/dev/null; then
    echo ">> Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable --now docker
else
    echo ">> Docker already installed."
fi

# ── 2. Open firewall ports ──
echo ">> Configuring firewall..."
if command -v ufw &>/dev/null; then
    ufw allow 7880/tcp   # LiveKit WebSocket
    ufw allow 7881/tcp   # WebRTC over TCP
    ufw allow 50000:60000/udp  # WebRTC over UDP
    ufw --force enable
    echo ">> UFW rules added."
elif command -v firewall-cmd &>/dev/null; then
    firewall-cmd --zone public --permanent --add-port 7880/tcp
    firewall-cmd --zone public --permanent --add-port 7881/tcp
    firewall-cmd --zone public --permanent --add-port 50000-60000/udp
    firewall-cmd --reload
    echo ">> firewalld rules added."
else
    echo ">> No firewall manager found. Make sure ports 7880, 7881, 50000-60000/udp are open."
fi

# ── 3. Stop any existing LiveKit container ──
docker rm -f livekit-dev 2>/dev/null || true

# ── 4. Start LiveKit Server in dev mode ──
# NOTE: Using --network host instead of -p port mapping.
# Docker's -p with 10,000 UDP ports creates individual iptables rules
# which can hang for 10+ minutes. Host networking avoids this entirely
# and is the recommended approach for LiveKit Server.
echo ">> Starting LiveKit Server (dev mode)..."
docker run -d \
    --name livekit-dev \
    --restart unless-stopped \
    --network host \
    livekit/livekit-server \
    --dev

echo ""
echo "=== DONE ==="
echo ""
echo "LiveKit dev server is running at: ws://$(hostname -I | awk '{print $1}'):7880"
echo ""
echo "On your LOCAL machine, set .env.local:"
echo "  LIVEKIT_URL=ws://$(hostname -I | awk '{print $1}'):7880"
echo "  (leave LIVEKIT_API_KEY and LIVEKIT_API_SECRET empty for dev mode)"
echo ""
echo "Then run your agent locally:"
echo "  uv run agent.py dev"
echo ""
echo "WARNING: Dev mode has NO authentication. Do not leave running unattended."
