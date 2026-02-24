## ADDED Requirements

### Requirement: SPA routing
The frontend SHALL detect the URL path on mount. When the path is `/memories`, the app SHALL render the MemoriesPage component instead of the standard BMO layout.

#### Scenario: Root path shows BMO face
- **WHEN** user navigates to `/`
- **THEN** the BMO face layout renders as before

#### Scenario: Memories path shows memories page
- **WHEN** user navigates to `/memories`
- **THEN** the MemoriesPage component renders
