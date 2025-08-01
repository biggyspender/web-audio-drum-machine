# Echo/Reverb Knobs - Technical Specification

## Architecture Overview

This feature extends the existing knob-based control pattern to include audio effects parameters. The implementation follows the established data flow: UI State → Audio Pipeline → AudioParam.value updates.

## Component Integration Map

```
DrumMachine.tsx (State Management)
├── echoLevel/reverbLevel useState hooks
├── ShareableState integration  
├── Audio pipeline parameter control
└── UI Knob components

PatternEncoding.ts (Persistence)
├── ShareableState interface extension
├── Binary encoding format update
└── Backward compatibility handling

CreateOutputEffectsChain.ts (Audio)
└── AudioParam exposure (existing - no changes)
```

## 1. UI State Management Implementation

### State Variables Addition
```typescript
// Add to DrumMachine.tsx after existing knob state
const [echoLevel, setEchoLevel] = useState<number>(0.2); // Match pipeline default
const [reverbLevel, setReverbLevel] = useState<number>(0.25); // Match pipeline default
```

### ShareableState Extension
```typescript
// Update shareableState useMemo
const shareableState = useMemo(
  () => ({
    bpm,
    swing,
    echoLevel,    // NEW
    reverbLevel,  // NEW
    kit: "default",
    grid: gridState,
  }),
  [gridState, bpm, swing, echoLevel, reverbLevel] // Add to dependency array
);
```

### URL Hash Initialization
```typescript
// Add to parsePatternHash effect
useEffect(() => {
  const parsed = parsePatternHash();
  if (parsed) {
    if (typeof parsed.bpm === "number") setBpm(parsed.bpm);
    if (typeof parsed.swing === "number") setSwing(parsed.swing);
    if (typeof parsed.echoLevel === "number") setEchoLevel(parsed.echoLevel);     // NEW
    if (typeof parsed.reverbLevel === "number") setReverbLevel(parsed.reverbLevel); // NEW
  }
}, []);
```

## 2. Audio Pipeline Integration

### AudioParam Access Pattern
```typescript
// Add effect parameter update logic in DrumMachine.tsx
useEffect(() => {
  const pipeline = pipelineRef.current;
  if (pipeline?.effectsChain) {
    pipeline.effectsChain.echoLevel.value = echoLevel;
  }
}, [echoLevel]);

useEffect(() => {
  const pipeline = pipelineRef.current;
  if (pipeline?.effectsChain) {
    pipeline.effectsChain.reverbLevel.value = reverbLevel;
  }
}, [reverbLevel]);
```

### Pipeline Interface Extension
```typescript
// Extend createPersistentAudioPipeline return type to expose effectsChain
return {
  // ...existing methods
  effectsChain: effectsChain, // NEW - expose for parameter access
  // OR create dedicated parameter control methods:
  setEchoLevel: (value: number) => {
    if (effectsChain) effectsChain.echoLevel.value = value;
  },
  setReverbLevel: (value: number) => {
    if (effectsChain) effectsChain.reverbLevel.value = value;
  }
};
```

## 3. UI Component Integration

### Knob Components Addition
```typescript
// Add to knobsContainer in DrumMachine.tsx after Swing knob
<Knob
  min={0}
  max={1}
  value={echoLevel}
  onChange={setEchoLevel}
  label="Echo"
  step={0.01}
  precision={2}
  size={24}
/>

<Knob
  min={0}
  max={1}
  value={reverbLevel}
  onChange={setReverbLevel}
  label="Reverb"
  step={0.01}
  precision={2}
  size={24}
/>
```

### CSS Considerations
No changes required - knobsContainer already handles multiple knobs with responsive layout.

## 4. URL Persistence Implementation

### ShareableState Interface Update
```typescript
// Update in patternEncoding.ts
interface ShareableState {
  bpm: number;
  swing: number;
  echoLevel: number;   // NEW
  reverbLevel: number; // NEW  
  kit: string;
  grid: Record<string, boolean[]>;
}
```

### Binary Encoding Extension
```typescript
// Extend encodePatternToBase64 function
export function encodePatternToBase64(pattern: ShareableState): string {
  try {
    // Existing BPM, swing, kit encoding...
    
    // NEW: Encode echo level (0-255 maps to 0.0-1.0)
    view.setUint8(offset++, Math.round(pattern.echoLevel * 255));
    
    // NEW: Encode reverb level (0-255 maps to 0.0-1.0)  
    view.setUint8(offset++, Math.round(pattern.reverbLevel * 255));
    
    // Existing grid encoding...
  }
}
```

### Binary Decoding Extension
```typescript
// Extend decodeBinaryPattern function
function decodeBinaryPattern(encoded: string): ShareableState | null {
  try {
    // Existing BPM, swing, kit decoding...
    
    // NEW: Check if we have effect parameters (backward compatibility)
    let echoLevel = 0.2;   // default
    let reverbLevel = 0.25; // default
    
    if (offset < buffer.byteLength) {
      echoLevel = view.getUint8(offset++) / 255;
    }
    if (offset < buffer.byteLength) {
      reverbLevel = view.getUint8(offset++) / 255;
    }
    
    // Update return object
    return { bpm, swing, echoLevel, reverbLevel, kit: kitName, grid };
  }
}
```

### Legacy Format Handling
```typescript
// Update decodeLegacyPattern for backward compatibility
function decodeLegacyPattern(encoded: string): ShareableState | null {
  try {
    const parsed = JSON.parse(json);
    return {
      bpm: parsed.bpm,
      swing: parsed.swing,
      echoLevel: parsed.echoLevel || 0.2,     // NEW with default
      reverbLevel: parsed.reverbLevel || 0.25, // NEW with default
      kit: parsed.kit || "default",
      grid: parsed.grid,
    };
  }
}
```

## 5. Data Flow Architecture

### State Update Flow
```
User Knob Interaction
    ↓
setEchoLevel/setReverbLevel
    ↓
useEffect triggers AudioParam update
    ↓  
shareableState useMemo recalculates
    ↓
syncPatternWithUrlDebounced called
    ↓
URL hash updated with new values
```

### Pipeline Initialization Flow
```
initializePipeline()
    ↓
createPersistentAudioPipeline()
    ↓
createOutputEffectsChain() 
    ↓
effectsChain.echoLevel/reverbLevel available
    ↓
UI state effects can update AudioParam.value
```

## 6. Edge Case Handling

### Pipeline Not Initialized
```typescript
// Safe AudioParam access pattern
const updateEchoLevel = (value: number) => {
  const pipeline = pipelineRef.current;
  if (pipeline?.effectsChain?.echoLevel) {
    pipeline.effectsChain.echoLevel.value = value;
  }
  // State update happens regardless for UI consistency
  setEchoLevel(value);
};
```

### URL Encoding Precision
- Use 8-bit precision (0-255) for 0.0-1.0 range = ~0.004 step precision
- Adequate for AudioParam control (requirement: ±0.01 tolerance)
- Test actual precision: `Math.round(0.123 * 255) / 255 = 0.1216` (within tolerance)

### Backward Compatibility
- New binary format includes effect parameters at end
- Decoder checks buffer length before reading effect parameters  
- Missing parameters default to current pipeline defaults (0.2, 0.25)
- Legacy JSON format gets default values

## 7. Performance Considerations

### State Update Frequency
- AudioParam updates: Every knob change (immediate)
- URL encoding: Debounced (300ms) - same as existing pattern
- No additional performance overhead beyond existing knob pattern

### Memory Impact
- Additional state: 2 × 8 bytes (negligible)
- URL encoding: +2 bytes per pattern (minimal)
- No persistent objects or event listeners beyond existing pattern

## 8. Security & Validation

### Input Validation
```typescript
// Knob component already handles min/max validation (0-1 range)
// Additional validation in URL decoding:
const echoLevel = Math.max(0, Math.min(1, view.getUint8(offset++) / 255));
```

### No Security Implications
- Audio parameters only affect client-side audio processing
- No server communication or data exposure
- Same security profile as existing BPM/Swing controls

## 9. Integration Contracts

### DrumMachine.tsx Changes
- Add 2 state variables with defaults matching pipeline
- Add 2 useEffect hooks for AudioParam updates
- Add 2 Knob components in existing knobsContainer
- Extend shareableState object and hash parsing

### PatternEncoding.ts Changes  
- Extend ShareableState interface with 2 number fields
- Update binary encoding to write 2 additional bytes
- Update binary decoding with backward-compatible parameter reading
- Update legacy JSON decoding with default value fallbacks

### No Changes Required
- CreateOutputEffectsChain.ts (AudioParams already exposed)
- Knob.tsx component (supports required props)
- CSS modules (existing container handles additional knobs)

## 10. Testing Integration Points

### Unit Test Targets
- AudioParam value assignment in pipeline integration
- URL encoding/decoding round-trip accuracy
- Default value handling for missing parameters
- ShareableState object construction

### Integration Test Targets  
- Real-time audio parameter changes during playback
- Pipeline initialization timing with parameter access
- Mobile responsive layout with additional knobs
- Backward compatibility with existing URL patterns

## Implementation Order

1. **PatternEncoding Extension** (1.5h) - Foundational data layer
2. **DrumMachine State Integration** (1.5h) - UI state management  
3. **Audio Pipeline Integration** (1.5h) - AudioParam control
4. **Testing & Validation** (2h) - Edge cases and integration
5. **Polish & Documentation** (0.5h) - Final cleanup

**Total: 6-7 hours implementation + 1-2 hours testing = 8 hours maximum**
