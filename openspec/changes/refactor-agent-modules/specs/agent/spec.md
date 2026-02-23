## MODIFIED Requirements

### Requirement: Agent code is organized into focused modules
The agent codebase SHALL be organized as a `bmo/` Python package with separate modules for configuration, status tracking, external services, prompt composition, the assistant class, and room lifecycle management. The top-level `agent.py` SHALL remain the process entrypoint and SHALL import from these modules.

#### Scenario: Module structure
- **WHEN** the developer inspects the project
- **THEN** the following modules exist: `bmo/config.py`, `bmo/status.py`, `bmo/services.py`, `bmo/prompt.py`, `bmo/assistant.py`, `bmo/room.py`, and `bmo/__init__.py`

#### Scenario: Entrypoint remains agent.py
- **WHEN** the process is started via `python agent.py`
- **THEN** the agent starts identically to the pre-refactor behavior with no configuration changes required

#### Scenario: No circular imports
- **WHEN** the agent starts
- **THEN** all modules load without circular import errors following the dependency flow: config ← status/services/prompt ← assistant ← agent.py/room
