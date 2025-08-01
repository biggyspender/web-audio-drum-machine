# Per-Hit Velocity - Requirements

## Acceptance Criteria
1. Each drum hit stores a velocity value (0-127 or 0-1 float)
2. UI displays and allows editing velocity per hit
3. Playback reflects velocity (volume/dynamics)
4. Velocity persists across save/load
5. Edge cases: min/max velocity, rapid changes, default/missing values

## Boundaries
- Only drum hits get velocity
- UI must remain uncluttered and intuitive
- No change to non-hit events or global volume

## Dependencies
- Pattern/sequence data structure
- UI hit editing components
- Audio engine (volume scaling)


## Tooling Discovery
- Package manager: pnpm
- Dev: pnpm start
- Test: pnpm test
- Build: pnpm build


## UI Decision & Sketch


### UI Behavior
- Each hit cell cycles through preset velocity values [0, 128, 255] on click.
- The intensity of the `.active` color (not just redness) is scaled in proportion to the velocity value:
    - 0: No `.active` color (transparent or default)
    - 128: `.active` color at 50% intensity
    - 255: Full `.active` color
- This is achieved by mapping the velocity value (0-255) to a CSS custom property (e.g., `--velocity-intensity`) that controls the color's alpha or RGB value in the `.active` class.
- No sliders/knobs/popovers; direct, fast, and visually intuitive.


### Measurable Criteria
- Click cycles velocity: 1st click → 0, 2nd → 128, 3rd → 255, 4th → 0, etc.
- `.active` color intensity is scaled: 255 = full color, 128 = 50% color, 0 = no color.
- Velocity value is always visible via color intensity.
- No extra UI clutter; single interaction per hit.

### UI Sketch

```
[Kick] [Snare] [HiHat]
 ┌────┬───────┬───────┐
 │ ●  │   ●   │       │  ← Hit active (●)
 │RED │RED128 │       │  ← Cell color: RED=255, RED128=128, blank=0
 └────┴───────┴───────┘
Click cycles: blank → RED128 → RED → blank ...
```
