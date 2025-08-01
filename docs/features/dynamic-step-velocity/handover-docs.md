# Handover Documentation - Dynamic Step Velocity

## Feature Summary
- StepButton now supports a discriminated union API:
  - `type: "velocity-button"` for dynamic velocity selection (0–255) via click position
  - `type: "button"` for generic button use (e.g., play/pause, stop)
- All usages updated to specify `type` and correct handler
- Visual feedback is mapped to velocity via CSS custom property

## Integration Points
- StepSequencer: uses `type="velocity-button"` and `onVelocityChange`
- StopButton, PlayPauseButton: use `type="button"` and `onClick`

## Usage Example
```tsx
<StepButton
  type="velocity-button"
  isActive={isActive}
  velocity={velocity}
  onVelocityChange={handleVelocityChange}
  ...otherProps
/>

<StepButton
  type="button"
  isActive={isActive}
  onClick={handleClick}
  ...otherProps
/>
```

## Monitoring & Maintenance
- No backend changes; UI only
- All usages are type-safe and explicit
- Future changes: add new union members if needed

## Rollback
- Revert changes in StepButton.tsx and all updated usages

## Recovery Info
- See feature-tracker.md for workflow and recovery steps

## Final Status
- Feature delivered successfully. All workflow stages complete.
