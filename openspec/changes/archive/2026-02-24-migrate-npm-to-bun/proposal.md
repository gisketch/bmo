## Why

The frontend Docker build currently depends on npm/Node semantics and is failing during `tsc -b` in Docker; moving to Bun simplifies and speeds up installs/builds while standardizing on a single JS runtime/tool.

## What Changes

- Replace npm-based frontend workflows with Bun (`bun install`, `bun run build`) in local dev and Docker builds.
- Replace `npx`-based static serving with Bun equivalents (`bunx`) for production container entrypoints.
- Ensure build-time LiveKit token generation runs under Bun during the frontend image build.
- Remove npm lockfile usage for the frontend and standardize on Bun’s lockfile.
- **BREAKING**: Contributors must have Bun available for local frontend development.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `deployment`: web service build and static serving commands migrate from npm/npx + node to Bun/bunx; build-time token generation runs under Bun.

## Impact

- Frontend build pipeline: `frontend/Dockerfile`, `frontend/package.json` scripts, and root `docker-compose.yml` build args for web.
- Tooling: Bun becomes the required JS runtime/package manager for the frontend build.
- CI/CD + Docker: web image no longer needs npm; install/build steps and lockfiles change.