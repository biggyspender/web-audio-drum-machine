# Implementation Plan - Dynamic Step Velocity

## Tasks (<4h each)
1. Update StepButton.tsx to calculate velocity from click Y position (0–255)
2. Update StepButton.tsx to emit velocity value via callback (e.g., onVelocityChange)
3. Update StepButton.module.css to visually represent velocity using --velocity-intensity
4. Add/Update tests for StepButton velocity logic and visual feedback
5. Validate accessibility (keyboard, screen reader)
6. Document changes in feature-tracker.md

## Dependencies
- StepButton.tsx and StepButton.module.css only

## Test Strategy
- Manual: Click at top, middle, bottom, verify velocity and visual
- Automated: Unit test velocity calculation and prop updates
- Accessibility: Keyboard and screen reader checks

## Deployment/Rollback
- Deploy: Merge and test in dev
- Rollback: Revert StepButton.tsx and StepButton.module.css changes

## Milestones
- StepButton logic complete
- Visual feedback complete
- Tests pass
- Docs updated

## Tooling Confirmed
- pnpm start, pnpm test, pnpm build

## Approval Needed
- Confirm plan, tasks, and test strategy
