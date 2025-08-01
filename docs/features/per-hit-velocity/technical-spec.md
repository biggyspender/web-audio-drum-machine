# Per-Hit Velocity - Technical Specification

## Data Model
- Each hit in a pattern/sequence stores a velocity value (0, 128, 255)
- Update types/interfaces to include velocity (default 0 if missing)
- Ensure backward compatibility for patterns without velocity

## UI (StepButton)
- StepButton receives a `velocity` prop (0-255)
- On click, cycles velocity: 0 → 128 → 255 → 0 ...
- Sets CSS custom property `--velocity-intensity` for color scaling
- `.active` class uses `--velocity-intensity` to scale color (alpha or RGB)
- Velocity value is always visible via color intensity
- Accessibility: keyboard and screen reader support for cycling

## CSS
- `.active` class uses `--velocity-intensity` to scale color
- Example: `background-color: rgba(255,0,0,var(--velocity-intensity))` or similar
- Ensure color mapping is visually clear and accessible

## Playback Engine
- Uses velocity to scale hit volume/dynamics
- Velocity 255 = full volume, 128 = 50%, 0 = silent
- Integration with existing audio engine

## Persistence
- Velocity value saved/loaded with patterns
- Backward compatibility: missing velocity defaults to 0

## Edge Cases
- Missing velocity: default to 0
- Rapid cycling: UI updates without lag
- Accessibility: keyboard, screen reader
- Mobile/touch support

## Integration
- No change to non-hit events
- Maintain UI clarity and usability

## Next Steps
- Implementation planning
