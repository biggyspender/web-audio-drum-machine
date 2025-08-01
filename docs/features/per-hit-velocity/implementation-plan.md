# Per-Hit Velocity - Implementation Plan

## Tasks (<4h each)
1. Update pattern/sequence data model for velocity per hit
2. Refactor StepButton to accept velocity prop and cycle values on click
3. Implement CSS custom property for `.active` color intensity
4. Integrate velocity into playback engine for volume/dynamics
5. Update persistence logic for velocity (save/load)
6. Add/extend tests for UI, data, playback, and edge cases
7. Accessibility and mobile/touch support validation

## Dependencies
- Data model changes before UI/playback
- UI and CSS changes before playback integration
- Persistence after data model and UI
- Testing after implementation

## Test Strategy
- Unit tests: data model, UI cycling, playback scaling
- Integration tests: save/load, UI color mapping
- Edge case tests: missing velocity, rapid cycling, accessibility

## Milestones
- Data model & UI refactor complete
- CSS color mapping functional
- Playback engine integration
- Persistence working
- All tests pass

## Deployment/Rollback
- Deploy after all tests pass
- Rollback: revert to previous pattern/sequence and UI logic

## Next Steps
- Begin implementation
