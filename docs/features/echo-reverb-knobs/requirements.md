# Echo/Reverb Knobs - Requirements Specification

## Overview
Add UI knobs for controlling echo level and reverb level in the drum machine interface, providing real-time audio effect control during playback.

## 1. Acceptance Criteria

### AC1: Echo Level Knob Implementation
**Given** the drum machine UI is loaded  
**When** I interact with the echo level knob  
**Then** the echo effect level changes in real-time  
**And** the knob value ranges from 0.0 to 1.0  
**And** the default value is 0.2 (current pipeline default)  
**And** changes apply immediately during playback  

**Measurement:** Audio output analysis shows echo level corresponds to knob position within ±0.01 tolerance

### AC2: Reverb Level Knob Implementation  
**Given** the drum machine UI is loaded  
**When** I interact with the reverb level knob  
**Then** the reverb wet level changes in real-time  
**And** the knob value ranges from 0.0 to 1.0  
**And** the default value is 0.25 (current pipeline default)  
**And** changes apply immediately during playback  

**Measurement:** Audio output analysis shows reverb wet level corresponds to knob position within ±0.01 tolerance

### AC3: UI Layout Integration
**Given** the existing knobs container with BPM and Swing knobs  
**When** the echo/reverb knobs are added  
**Then** they appear in the same knobsContainer element  
**And** they follow the same visual styling as existing knobs  
**And** the layout remains responsive on mobile (vertical mode)  

**Measurement:** Visual regression test shows consistent knob styling and mobile layout preservation

### AC4: State Persistence  
**Given** I adjust echo level and reverb level values  
**When** I share or reload the page  
**Then** the echo/reverb values persist in the URL hash  
**And** the ShareableState interface includes echoLevel and reverbLevel fields  
**And** the binary encoding supports the new parameters  

**Measurement:** URL hash contains encoded echo/reverb values that decode correctly to same values within 0.01 precision

### AC5: Audio Pipeline Integration
**Given** the existing audio pipeline with effects chain  
**When** knob values change  
**Then** the corresponding AudioParam.value updates immediately  
**And** the effects chain echoLevel and reverbLevel AudioParams are controlled  
**And** no audio artifacts or glitches occur during parameter changes  

**Measurement:** AudioParam.value changes match knob values exactly with <16ms latency

### AC6: Real-time Performance
**Given** audio playback is active  
**When** I adjust echo/reverb knobs rapidly  
**Then** audio parameter changes occur smoothly without dropouts  
**And** UI remains responsive during audio parameter changes  
**And** no memory leaks occur during extended knob manipulation  

**Measurement:** Audio dropouts <0.1% during rapid knob changes, UI responsiveness <50ms, stable memory usage

### AC7: Accessibility Support
**Given** the knobs follow existing accessibility patterns  
**When** using keyboard navigation or screen readers  
**Then** echo/reverb knobs support same accessibility features as BPM/Swing knobs  
**And** proper ARIA labels and value descriptions are provided  

**Measurement:** Screen reader announces "Echo Level" and "Reverb Level" with current values, keyboard navigation works

## 2. Performance Metrics

### Audio Performance
- AudioParam value updates: <16ms latency
- Parameter change smoothness: No audible glitches or artifacts  
- Audio dropout tolerance: <0.1% during rapid knob manipulation
- Memory stability: No leaks during extended use

### UI Performance  
- Knob responsiveness: <50ms visual feedback
- Mobile layout preservation: No horizontal scrolling on 320px width
- Visual consistency: Identical styling to existing knobs

### Data Persistence
- URL encoding overhead: <100 bytes additional size
- Decode accuracy: ±0.01 precision for float values
- Backward compatibility: Existing URLs continue working

## 3. Functional Boundaries

### Included in Scope
- Echo level knob (0.0-1.0 range, controls echo.level AudioParam)
- Reverb level knob (0.0-1.0 range, controls reverb.wet AudioParam)  
- UI integration in existing knobsContainer
- URL hash persistence integration
- Real-time audio parameter control
- Accessibility features matching existing knobs

### Explicitly Excluded
- Echo delay time control (separate from level)
- Echo feedback control (separate from level)
- Reverb dry level control (only wet level requested)
- Additional effect controls beyond echo/reverb level
- Visual effect meters or level indicators
- Effect bypass/mute functionality

## 4. Dependencies

### Internal Dependencies
- `createOutputEffectsChain.ts` - provides echoLevel/reverbLevel AudioParams
- `createPersistentAudioPipeline.ts` - manages effects chain access
- `Knob.tsx` component - provides UI control interface
- `patternEncoding.ts` - handles URL state persistence
- `DrumMachine.tsx` - main UI integration point

### External Dependencies
- Web Audio API AudioParam interface
- React useState/useEffect hooks
- Existing debouncing utilities

### Breaking Change Risk
- None identified - extending existing interfaces only

## 5. Edge Cases

### Audio Edge Cases
- **Rapid parameter changes**: Knob manipulation at >10 changes/second
- **Extreme values**: Setting level to exact 0.0 or 1.0
- **Concurrent playback**: Parameter changes during active step playback
- **Audio context suspension**: Browser tab backgrounding during parameter changes

### UI Edge Cases  
- **Mobile viewport**: Very narrow screens (<350px)
- **Accessibility modes**: High contrast, large fonts, screen readers
- **Keyboard navigation**: Tab order and focus management
- **Precision input**: Text input field with invalid values

### Data Edge Cases
- **URL length limits**: Very long URLs with maximum pattern data
- **Encoding precision**: Float precision loss in binary encoding
- **Version compatibility**: Old URLs without echo/reverb parameters
- **Invalid data**: Malformed URL hash data

## 6. Resource Requirements

### Development Resources
- Frontend implementation: ~4 hours
- Audio integration testing: ~2 hours  
- URL persistence implementation: ~2 hours
- Testing and polish: ~2 hours
- **Total Estimate: ~10 hours**

### Testing Resources
- Unit tests for new knob components: ~1 hour
- Integration tests for audio parameter control: ~2 hours
- URL persistence tests: ~1 hour  
- Accessibility testing: ~1 hour
- **Total Testing: ~5 hours**

### Documentation Resources
- Code comments and documentation: ~1 hour
- User-facing documentation updates: ~30 minutes

## 7. Approval Checkpoints

### PM Approval Required For:
- ✅ Feature scope and acceptance criteria finalized
- Final UI layout and positioning decisions
- Performance targets and success metrics

### Security Approval Required For:
- ✅ No security implications identified (UI controls only, no new data exposure)

### QA Approval Required For:
- ✅ Test strategy covering all edge cases
- Acceptance criteria validation approach
- Performance measurement methodology  

### Architecture Approval Required For:
- ✅ Integration approach with existing audio pipeline
- State management approach for new parameters
- URL encoding extension strategy

### DevOps Approval Required For:
- ✅ No deployment considerations (frontend-only changes)

## Success Definition
Feature is complete when all 7 acceptance criteria pass validation, audio parameter control works seamlessly during playback, and new knobs integrate visually/functionally with existing UI without breaking changes.
