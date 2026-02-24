/**
 * Generate a LiveKit JWT for the BMO frontend.
 *
 * Reads LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL from environment
 * or ../.env.local. Outputs a token for room "bmo-room", identity "bmo-user",
 * with a 30-day TTL.
 *
 * Usage (from project root):
 *   bun scripts/generate-token.mjs
 *
 * Usage (from frontend/):
 *   bun ../scripts/generate-token.mjs
 */

import { createRequire } from 'module';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve packages — check cwd first (Docker), then frontend/node_modules (local dev)
const frontendDir = resolve(__dirname, '..', 'frontend');
const requireBase = existsSync(join(frontendDir, 'node_modules'))
  ? resolve(frontendDir, 'package.json')
  : resolve(process.cwd(), 'package.json');
const require = createRequire(requireBase);
const { AccessToken } = require('livekit-server-sdk');

// Load env — Docker build passes vars directly; locally use .env.local
if (!process.env.LIVEKIT_API_KEY) {
  const dotenv = require('dotenv');
  dotenv.config({ path: resolve(__dirname, '..', '.env.local') });
}

const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL } = process.env;

if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  console.error('Missing LIVEKIT_API_KEY or LIVEKIT_API_SECRET');
  process.exit(1);
}

const ROOM_NAME = 'bmo-room';
const IDENTITY = 'bmo-user';
const TTL = '30d';

const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
  identity: IDENTITY,
  name: 'BMO User',
  ttl: TTL,
});

at.addGrant({ roomJoin: true, room: ROOM_NAME });

const token = await at.toJwt();

// If LIVEKIT_URL is set, output both for convenience
if (LIVEKIT_URL) {
  // When called with --env flag, output as env vars
  if (process.argv.includes('--env')) {
    console.log(`VITE_LIVEKIT_TOKEN=${token}`);
    console.log(`VITE_LIVEKIT_URL=${LIVEKIT_URL}`);
  } else {
    console.log(token);
  }
} else {
  console.log(token);
}
