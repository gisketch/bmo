# BMO Status Domain Spec

## Overview
Status page feature for BMO that displays service health metrics on the BMO screen. Uses Geist Mono font for a terminal-aesthetic monospaced display, with ASCII progress bars for balance visualization.

## Requirements

### Requirement: Status page displays service health metrics
The StatusPage component SHALL render a monospaced text panel using Geist Mono font on the BMO screen, showing agent connectivity status, TTS (Fish Audio) balance, STT (DeepGram) balance, and LLM (Gemini) daily request count.

#### Scenario: Status page renders with live data
- **WHEN** the status page is active and status data has been fetched
- **THEN** the screen displays four lines: agent status (Connected/Disconnected/Error), TTS balance with ASCII progress bar and dollar amount, STT balance with ASCII progress bar and dollar amount, and LLM request count for today

#### Scenario: Status page renders while fetching
- **WHEN** the status page is active but data has not yet been received
- **THEN** each service line SHALL display "..." as a loading indicator

#### Scenario: Service fetch fails
- **WHEN** a balance fetch fails for any service
- **THEN** that service line SHALL display "N/A" instead of a balance value

### Requirement: ASCII progress bar for balance display
The status page SHALL render balance values with an ASCII progress bar using filled (`|`) and empty (` `) characters inside square brackets, followed by the dollar amount. The bar width SHALL be 10 characters. The fill level SHALL represent the balance as a proportion of a configurable max value.

#### Scenario: Balance at 50% of max
- **WHEN** TTS balance is $2.50 and max is $5.00
- **THEN** the display shows `[|||||     ] $2.50`

#### Scenario: Balance at 0
- **WHEN** a service balance is $0.00
- **THEN** the display shows `[          ] $0.00`

#### Scenario: Balance exceeds max
- **WHEN** a service balance exceeds the configured max
- **THEN** the bar shows fully filled `[||||||||||]` and displays the actual dollar amount

### Requirement: Page toggle system
The BmoLayout SHALL maintain an `activePage` state that toggles between `face` and `status` when the Start button is pressed. The Screen component SHALL conditionally render either the Face component or the StatusPage component based on the active page.

#### Scenario: Default page is face
- **WHEN** the app loads
- **THEN** the Screen displays the Face component (eyes and mouth)

#### Scenario: Toggle to status page
- **WHEN** the user presses the Start button while on the face page
- **THEN** the Screen switches to display the StatusPage component

#### Scenario: Toggle back to face
- **WHEN** the user presses the Start button while on the status page
- **THEN** the Screen switches back to display the Face component

### Requirement: Status data fetching via LiveKit RPC
The frontend SHALL use LiveKit's `performRpc` to request status data from the agent. The hook SHALL poll every 30 seconds while the status page is active and stop polling when the face page is shown.

#### Scenario: Status page becomes active
- **WHEN** the user toggles to the status page
- **THEN** the frontend immediately sends an RPC request to the agent for status data and begins polling every 30 seconds

#### Scenario: Status page becomes inactive
- **WHEN** the user toggles to the face page
- **THEN** the frontend stops polling for status data

#### Scenario: RPC response received
- **WHEN** the agent responds to the RPC request
- **THEN** the hook parses the JSON response and updates the status data state

### Requirement: Agent exposes status RPC method
The agent SHALL register an RPC method `getStatus` that fetches Fish Audio credit balance, DeepGram project balance, and returns the current LLM request count. The agent SHALL track LLM requests with an in-memory counter that resets at midnight GMT+8.

#### Scenario: RPC getStatus called
- **WHEN** the frontend calls the `getStatus` RPC method
- **THEN** the agent fetches current balances from Fish Audio and DeepGram APIs and returns a JSON response with `tts_balance`, `stt_balance`, `llm_requests_today`, and `agent_status`

#### Scenario: External API fails
- **WHEN** a balance API request fails (timeout, auth error, network)
- **THEN** the agent returns `null` for that service's balance field and the other fields remain unaffected

#### Scenario: LLM counter resets daily
- **WHEN** the current time passes midnight GMT+8
- **THEN** the LLM request counter resets to 0

### Requirement: Geist Mono font for status display
The StatusPage component SHALL use the Geist Mono font family for all text rendering, providing a terminal-aesthetic monospaced display.

#### Scenario: Font renders correctly
- **WHEN** the StatusPage is displayed
- **THEN** all text uses the Geist Mono monospace font
