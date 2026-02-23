## ADDED Requirements

### Requirement: Screen CRT effect overlay
The frontend SHALL apply a CRT effect overlay to the BMO Screen area.

#### Scenario: Screen shows CRT styling
- **WHEN** the Screen component renders its active page (Face or StatusPage)
- **THEN** scanlines, vignette, and subtle flicker are visible over the screen content without blocking interaction

#### Scenario: Screen content has subtle warp
- **WHEN** the Screen component renders its active page (Face or StatusPage)
- **THEN** the rendered content subtly warps over time to mimic CRT geometry distortion
