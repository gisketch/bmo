## ADDED Requirements

### Requirement: Web service build and serving use Bun
The project SHALL build the Vite frontend using Bun during the web Docker image build, and the resulting static files SHALL be served without requiring npm.

#### Scenario: Web image builds static bundle
- **WHEN** the web Docker image is built with `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, and `LIVEKIT_URL`
- **THEN** the image build runs `bun install` and `bun run build` successfully and produces a `dist/` directory

#### Scenario: Web image serves static bundle
- **WHEN** the web container starts
- **THEN** it serves the contents of `dist/` via Bun on the configured port (e.g., `bun serve.ts` or `bunx serve -s dist`)

### Requirement: Build-time token generation runs under Bun
The project SHALL invoke the token generation script (`scripts/generate-token.mjs`) using Bun during the frontend Docker build to produce the `VITE_LIVEKIT_TOKEN` environment variable baked into the bundle.

#### Scenario: Build-time token is generated
- **WHEN** the web Docker image build runs the token generation step
- **THEN** the step executes `generate-token.mjs` via `bun` with `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` provided and exports `VITE_LIVEKIT_TOKEN` for the Vite build
