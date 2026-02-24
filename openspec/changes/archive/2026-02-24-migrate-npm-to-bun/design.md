## Context

The web image builds a Vite SPA inside Docker, generating a LiveKit token at build time and baking it into the bundle. The current build path uses Node + npm and fails during TypeScript compilation in the container.

## Goals / Non-Goals

**Goals:**
- Replace npm/npx usage in the frontend toolchain with Bun (`bun`, `bunx`) for install, build, and running the token generation script.
- Keep the runtime behavior the same: the served frontend bundle contains `VITE_LIVEKIT_TOKEN` and `VITE_LIVEKIT_URL` baked at build time.
- Make Docker builds deterministic via Bun lockfile + frozen installs.

**Non-Goals:**
- Changing any user-facing frontend behavior, UI, or LiveKit connection flows.
- Refactoring the Python agent build/runtime.

## Decisions

- Use `oven/bun` as the build/runtime base image for the web container to avoid installing Node/npm.
  - Alternative: install Bun into a Node image. Rejected to keep the web image single-runtime and smaller.
- Execute `scripts/generate-token.mjs` via `bun` during the Docker build.
  - Alternative: keep Node for this one script. Rejected to fully remove Node/npm from the web image.
- Use `bunx` for CLI tooling that was previously invoked via `npx`.

## Risks / Trade-offs

- [Bun + TypeScript config differences] → Ensure `tsconfig` and React types are configured so `tsc -b` works in a clean container.
- [Lockfile transition] → Commit `bun.lock` and remove reliance on `package-lock.json` to avoid mixed installers.

## Migration Plan

1. Update `frontend/` to use Bun for install/build and add/commit `bun.lock`.
2. Update `frontend/Dockerfile` to use Bun for token generation and `bun run build`.
3. Update `docker-compose.yml` and any docs/scripts that invoke npm/npx.
4. Verify `bun run build` succeeds locally and via `docker compose build web`.
5. Rollback: revert Dockerfile + compose changes and restore npm install/build if needed.

## Open Questions

- None.
