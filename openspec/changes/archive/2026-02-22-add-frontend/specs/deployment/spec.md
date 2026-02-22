## MODIFIED Requirements

### Requirement: Firewall Ports
The VPS firewall SHALL expose the following ports. Port 7880 MUST also accept connections from the frontend's browser for WebSocket signaling. The actual VPS host URL is configured via `LIVEKIT_URL` in `.env.local` and SHALL NOT be hardcoded in source files.

| Port | Protocol | Purpose |
|------|----------|---------|
| 80 | TCP | TLS certificate issuance |
| 443 | TCP | HTTPS + TURN/TLS |
| 7880 | TCP | LiveKit WebSocket (dev — browser + agent) |
| 7881 | TCP | WebRTC over TCP |
| 3478 | UDP | TURN/UDP |
| 50000-60000 | UDP | WebRTC media |
