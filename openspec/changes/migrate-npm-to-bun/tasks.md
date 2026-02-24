## 1. Frontend Bun migration

- [x] 1.1 Update `frontend/package.json` scripts to use Bun (`bun run ...`) where appropriate
- [x] 1.2 Add/commit Bun lockfile for `frontend/` and stop relying on npm lockfile in builds

## 2. Docker + Compose updates

- [x] 2.1 Update `frontend/Dockerfile` to build and serve using Bun (`oven/bun`, `bun install`, `bun run build`, `bunx serve`)
- [x] 2.2 Update `docker-compose.yml` (and any related docs/scripts) to reflect the Bun-based web build

## 3. Fix container TypeScript build

- [x] 3.1 Fix `frontend/src/components/bmo/Eye.tsx` to avoid `JSX` namespace typing that fails under clean container builds
- [x] 3.2 Verify `bun run build` succeeds and `docker compose build web` completes
