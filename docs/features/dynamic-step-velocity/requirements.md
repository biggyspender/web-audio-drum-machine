# Requirements - Dynamic Step Velocity

## Acceptance Criteria
- Clicking anywhere on a StepButton sets its velocity based on the vertical position of the click (0 = bottom, 255 = top).
- Velocity is visually represented in the button using the CSS variable `--velocity-intensity` (mapped 0–1).
- UI updates immediately to reflect the new velocity value.
- No fixed velocity array; any integer value 0–255 is possible.
- StepButton remains accessible (keyboard, screen reader labels).
- Only StepButton.tsx is modified for this stage.

## Metrics
- Velocity value set matches click Y position (±2 units tolerance).
- UI visual intensity matches velocity (0 = dimmest, 255 = brightest).
- 100% of clicks result in correct velocity assignment and visual update.

## Boundaries
- Only StepButton.tsx and its CSS are in scope.
- No changes to backend, state management, or other components.

## Dependencies
- StepButton.tsx and StepButton.module.css must support CSS custom properties.
- No external libraries required.

## Edge Cases
- Click at exact top = velocity 255
- Click at exact bottom = velocity 0
- Click outside button = no change
- Rapid clicks: UI updates without lag
- Keyboard activation: velocity remains unchanged (default or last value)

## Tooling Discovery
- Package manager: pnpm (pnpm-lock.yaml verified)
- Dev: pnpm start
- Test: pnpm test
- Build: pnpm build

## Approval Needed
- Confirm requirements and metrics
- Confirm boundaries and edge cases
- Confirm tooling commands
