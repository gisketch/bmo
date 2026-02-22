import express from 'express';
import cors from 'cors';
import { AccessToken, RoomConfiguration } from 'livekit-server-sdk';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env — in Docker the vars come from environment; locally from ../.env.local
if (!process.env.LIVEKIT_URL) {
  dotenv.config({ path: resolve(__dirname, '..', '.env.local') });
}

const {
  LIVEKIT_URL,
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET,
} = process.env;

if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  console.error('Missing required env vars: LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET');
  console.error('Set them via environment or ../.env.local');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In production, serve the built Vite frontend as static files
const distPath = resolve(__dirname, 'dist');
const servingStatic = existsSync(distPath);
if (servingStatic) {
  app.use(express.static(distPath));
}

app.post('/getToken', async (req, res) => {
  const body = req.body || {};
  console.log('Token request body:', JSON.stringify(body, null, 2));

  const roomName = body.room_name || `room-${Date.now()}`;
  const participantIdentity = body.participant_identity || `user-${Math.random().toString(36).slice(2, 8)}`;
  const participantName = body.participant_name || 'User';

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantIdentity,
    name: participantName,
    metadata: body.participant_metadata || '',
    attributes: body.participant_attributes || {},
    ttl: '10m',
  });

  at.addGrant({ roomJoin: true, room: roomName });

  if (body.room_config) {
    // Client SDK sends snake_case but RoomConfiguration expects camelCase
    const config = { ...body.room_config };
    if (config.agents) {
      config.agents = config.agents.map(a => ({
        agentName: a.agent_name || a.agentName || '',
        metadata: a.metadata || '',
      }));
    }
    at.roomConfig = new RoomConfiguration(config);
  }

  const participantToken = await at.toJwt();

  res.status(201).json({
    server_url: LIVEKIT_URL,
    participant_token: participantToken,
  });
});

// SPA fallback — serve index.html for any non-API route
if (servingStatic) {
  app.get('*', (_req, res) => {
    res.sendFile(resolve(distPath, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Token server running on port ${port}`);
  if (servingStatic) console.log('Serving frontend from', distPath);
  console.log(`LiveKit URL: ${LIVEKIT_URL}`);
});
