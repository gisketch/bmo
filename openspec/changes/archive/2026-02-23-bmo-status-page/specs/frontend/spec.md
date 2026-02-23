## MODIFIED Requirements

### Requirement: StartSelect buttons
The frontend SHALL render two thin horizontal blue (`#1156A3`) buttons side by side with 3D extrusion and shadow, using the same press animation pattern as DPad. The StartSelect component SHALL accept optional `onStartPress` and `onSelectPress` callback props that fire when the respective button's press animation completes (on mouse/touch up).

#### Scenario: Start button pressed
- **WHEN** the user clicks/touches the Start button (left button)
- **THEN** the button animates with the 3D press effect and the `onStartPress` callback fires on release

#### Scenario: Select button pressed
- **WHEN** the user clicks/touches the Select button (right button)
- **THEN** the button animates with the 3D press effect and the `onSelectPress` callback fires on release

## ADDED Requirements

### Requirement: Screen conditional rendering
The Screen component SHALL accept an `activePage` prop (`'face' | 'status'`) and conditionally render either the Face component or the StatusPage component. When `activePage` is `'face'`, the Face with its eye and mouth state props SHALL render. When `activePage` is `'status'`, the StatusPage with status data props SHALL render.

#### Scenario: Face page active
- **WHEN** `activePage` is `'face'`
- **THEN** the Screen renders the Face component with eye blinking and mouth animations

#### Scenario: Status page active
- **WHEN** `activePage` is `'status'`
- **THEN** the Screen renders the StatusPage component with service health metrics
