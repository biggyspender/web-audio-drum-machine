# Echo/Reverb Knobs - Implementation Plan

## Task Breakdown (All Tasks <4h)

### Task 1: Pattern Encoding Foundation (2h)
**Description:** Extend URL persistence layer to support echo/reverb parameters
**Files:** `src/components/sequencer/patternEncoding.ts`
**Dependencies:** None
**Testing:** Unit tests for encoding/decoding accuracy

**Subtasks:**
- [ ] Update ShareableState interface with echoLevel/reverbLevel fields (15m)
- [ ] Extend encodePatternToBase64 to write 2 additional bytes for effect levels (30m)  
- [ ] Update decodeBinaryPattern with backward-compatible parameter reading (45m)
- [ ] Update decodeLegacyPattern with default value fallbacks (15m)
- [ ] Create unit tests for round-trip encoding accuracy (15m)

**Success Criteria:**
- New ShareableState interface compiles without errors
- Encoding/decoding maintains ±0.004 precision for 0.0-1.0 values
- Backward compatibility: existing URLs decode without effects parameters
- Forward compatibility: new URLs include effects in binary format

### Task 2: DrumMachine State Integration (2h)
**Description:** Add echo/reverb state management to main UI component
**Files:** `src/DrumMachine.tsx`
**Dependencies:** Task 1 (ShareableState interface)
**Testing:** State management and shareableState integration

**Subtasks:**
- [ ] Add echoLevel/reverbLevel useState hooks with default values (15m)
- [ ] Extend shareableState useMemo to include new parameters (15m)
- [ ] Add effect parameters to parsePatternHash initialization logic (30m)
- [ ] Add echo/reverb Knob components to knobsContainer (30m)
- [ ] Verify mobile responsive layout with additional knobs (15m)
- [ ] Test URL hash persistence integration (15m)

**Success Criteria:**
- Echo/reverb knobs appear in UI with correct default values (0.2, 0.25)
- Knob changes update state and trigger URL hash updates
- Mobile layout remains responsive with 4 knobs total
- Page reload preserves echo/reverb values from URL

### Task 3: Audio Pipeline Parameter Control (2h)
**Description:** Connect UI state changes to AudioParam.value updates  
**Files:** `src/DrumMachine.tsx`, `src/audio/createPersistentAudioPipeline.ts`
**Dependencies:** Task 2 (UI state management)
**Testing:** Real-time audio parameter control validation

**Subtasks:**
- [ ] Add useEffect hooks for echoLevel→AudioParam.value updates (30m)
- [ ] Add useEffect hooks for reverbLevel→AudioParam.value updates (30m)
- [ ] Handle pipeline initialization timing with null checking (30m)
- [ ] Test AudioParam updates during active playback (15m)
- [ ] Verify no audio artifacts during parameter changes (15m)

**Success Criteria:**
- Knob changes immediately update corresponding AudioParam.value
- Audio effects respond in real-time during playback (<16ms latency)
- No audio dropouts or glitches during rapid knob manipulation
- Safe handling when pipeline not yet initialized

### Task 4: Integration Testing & Validation (1.5h)
**Description:** Comprehensive testing of all integration points
**Files:** Test files, manual validation
**Dependencies:** Tasks 1-3 (complete implementation)
**Testing:** End-to-end functionality validation

**Subtasks:**
- [ ] Create unit tests for DrumMachine state integration (30m)
- [ ] Test URL encoding precision with various effect values (15m)
- [ ] Validate backward compatibility with existing saved patterns (15m)
- [ ] Test mobile responsive layout across viewport sizes (15m)
- [ ] Verify accessibility features (keyboard nav, screen readers) (15m)

**Success Criteria:**
- All 7 acceptance criteria from requirements pass validation
- URL encoding/decoding precision within ±0.01 tolerance
- No regressions in existing functionality
- Mobile layout preserves usability

### Task 5: Documentation & Polish (30m)
**Description:** Final cleanup and documentation  
**Files:** Code comments, README updates
**Dependencies:** Task 4 (testing complete)
**Testing:** Code review readiness

**Subtasks:**
- [ ] Add code comments for new integration points (15m)
- [ ] Update any relevant documentation (15m)

**Success Criteria:**
- Code is review-ready with appropriate comments
- Implementation matches technical specification

## Dependency Graph

```
Task 1 (Pattern Encoding) 
    ↓
Task 2 (UI State) 
    ↓  
Task 3 (Audio Integration)
    ↓
Task 4 (Testing)
    ↓
Task 5 (Polish)
```

**Critical Path:** Tasks must be completed sequentially due to interface dependencies.

## Risk Mitigation Plan

### Technical Risks
**Risk:** AudioParam access timing issues  
**Mitigation:** Use established null-checking pattern from existing pipeline code  
**Fallback:** Defer AudioParam updates until pipeline initialization confirmed

**Risk:** URL encoding precision loss  
**Mitigation:** Test encoding accuracy early in Task 1  
**Fallback:** Increase precision or use different encoding approach if needed

**Risk:** Mobile layout issues with 4 knobs  
**Mitigation:** Test responsive behavior immediately after Task 2  
**Fallback:** Adjust knob sizing or container layout if needed

### Schedule Risks
**Risk:** Task overrun due to unexpected complexity  
**Mitigation:** Keep task scope tight, defer non-essential polish  
**Fallback:** Implement core functionality first, add enhancements in follow-up

## Testing Strategy

### Unit Testing Approach
- **Pattern Encoding**: Round-trip accuracy tests with various values
- **State Management**: React state update and persistence testing  
- **Audio Integration**: AudioParam value assignment validation

### Integration Testing Approach  
- **End-to-End**: Full user workflow from knob interaction to audio output
- **Edge Cases**: Pipeline timing, mobile layout, backward compatibility
- **Performance**: Audio latency and UI responsiveness validation

### Manual Testing Checklist
- [ ] Echo knob affects audio echo level audibly
- [ ] Reverb knob affects audio reverb level audibly  
- [ ] Knobs work during active playback without artifacts
- [ ] URL sharing preserves echo/reverb settings
- [ ] Mobile layout remains usable with 4 knobs
- [ ] Keyboard navigation works for all knobs
- [ ] Screen reader announces effect levels correctly

## Deployment Strategy

### Development Environment
- No special deployment considerations - frontend-only changes
- Standard build process handles TypeScript compilation
- No database migrations or server-side changes

### Testing Environment  
- Test on multiple browsers (Chrome, Firefox, Safari)
- Test on mobile devices/simulators for responsive layout
- Test with screen readers for accessibility validation

### Production Readiness Checklist
- [ ] All unit tests pass
- [ ] Integration tests validate requirements  
- [ ] No TypeScript compilation errors
- [ ] Mobile responsive layout verified
- [ ] Accessibility features tested
- [ ] No performance regressions identified
- [ ] Backward compatibility with existing URLs confirmed

## Success Metrics

### Functional Success
- ✅ Echo level knob controls echo.level AudioParam (0.0-1.0)
- ✅ Reverb level knob controls reverb.wet AudioParam (0.0-1.0)
- ✅ Real-time audio parameter control during playback
- ✅ URL persistence maintains settings across browser sessions

### Performance Success  
- ✅ AudioParam updates <16ms latency
- ✅ UI responsiveness <50ms for knob interactions  
- ✅ No audio dropouts during parameter changes
- ✅ Mobile layout usability preserved

### Quality Success
- ✅ Zero regressions in existing functionality
- ✅ Accessibility parity with existing knobs
- ✅ Code follows established project patterns
- ✅ Implementation matches technical specification

## Timeline Estimate

**Sequential Implementation:** 8 hours total
- Day 1: Tasks 1-3 (core implementation) - 6 hours
- Day 1: Task 4-5 (testing & polish) - 2 hours

**Parallel Optimization:** 6 hours total  
- Tasks 1-2 can overlap partially once interfaces defined
- Task 4 testing can begin as Task 3 completes

**Buffer Time:** +2 hours for unexpected issues = 10 hours maximum

**Delivery Target:** Same-day completion feasible, 1 development day guaranteed
