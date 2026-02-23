## 1. Backend — Agent Status Infrastructure

- [x] 1.1 Add `httpx` dependency to `pyproject.toml`
- [x] 1.2 Implement Fish Audio balance fetcher (`GET /wallet/self/api-credit`)
- [x] 1.3 Implement DeepGram balance fetcher with project ID caching (`GET /v1/projects` then `/balances`)
- [x] 1.4 Implement LLM request counter with daily reset (midnight GMT+8)
- [x] 1.5 Register `getStatus` RPC method on the agent that returns JSON with `tts_balance`, `stt_balance`, `llm_requests_today`

## 2. Frontend — Dependencies & Font

- [x] 2.1 Install `geist` npm package in frontend
- [x] 2.2 Import Geist Mono CSS in the app entry point

## 3. Frontend — Page Toggle System

- [x] 3.1 Add `BmoPage` type (`'face' | 'status'`) to `types/bmo.ts`
- [x] 3.2 Add `activePage` state to `BmoLayout` in `App.tsx` with toggle handler
- [x] 3.3 Modify `StartSelect` to accept and fire `onStartPress` / `onSelectPress` callbacks
- [x] 3.4 Modify `Screen` to accept `activePage` prop and conditionally render Face or StatusPage

## 4. Frontend — Status Page Component & Data Hook

- [x] 4.1 Create `useStatusData` hook — fetches status via LiveKit RPC, polls every 30s when active
- [x] 4.2 Create `StatusPage` component — renders monospaced status text with ASCII progress bars
- [x] 4.3 Wire StatusPage into Screen and pass status data from BmoLayout
