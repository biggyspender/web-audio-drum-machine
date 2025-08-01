# History Management - Implementation Plan

## Overview

Detailed implementation plan for Wouter route-based pattern navigation with custom URL-safe encoding. Breaking down the 14-20 hour effort into specific tasks with clear deliverables and checkpoints.

## Implementation Strategy

### Development Approach
1. **Bottom-Up Development:** Start with encoding functions, then routing, then integration
2. **Incremental Integration:** Build and test each component separately before combining
3. **Progressive Testing:** Unit tests for each component, integration tests for full flow
4. **Performance Validation:** Monitor navigation timing and memory usage throughout

### Task Dependencies
```
Task 1 (Encoding) ──► Task 3 (PatternRoute) ──► Task 5 (Keyboard)
                                │                      │
Task 2 (Router) ────────────────┼──────────────────────┤
                                │                      │
Task 4 (DrumMachine) ───────────┴──► Task 6 (Testing) ─┘
```

## Task Breakdown

### Task 1: Custom URL-Safe Encoding Implementation
**Duration:** 2-3 hours | **Priority:** High | **Dependencies:** None

#### Files to Create/Modify
- `src/audio/urlSafeEncoding.ts` (new file)
- `src/audio/urlSafeEncoding.test.ts` (new file)

#### Specific Implementation
```typescript
// src/audio/urlSafeEncoding.ts
import { encodePatternToBase64, decodePatternFromBase64 } from './patternEncoding';
import type { ShareableState } from './types';

/**
 * Convert base64 pattern encoding to URL-safe format
 * Replaces: + → -, / → _, = → ~
 */
export function encodePatternToUrlSafe(pattern: ShareableState): string {
  const base64 = encodePatternToBase64(pattern);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_') 
    .replace(/=/g, '~');
}

/**
 * Convert URL-safe pattern back to ShareableState
 * Reverses: - → +, _ → /, ~ → =
 */
export function decodePatternFromUrlSafe(encoded: string): ShareableState | null {
  try {
    // Validate URL-safe character set
    if (!/^[A-Za-z0-9\-_~]*$/.test(encoded)) {
      return null;
    }
    
    // Convert back to base64
    const base64 = encoded
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .replace(/~/g, '=');
    
    return decodePatternFromBase64(base64);
  } catch (error) {
    console.warn('Invalid URL-safe pattern:', error);
    return null;
  }
}

/**
 * Validate that a string contains only URL-safe pattern characters
 */
export function isValidUrlSafePattern(encoded: string): boolean {
  return /^[A-Za-z0-9\-_~]+$/.test(encoded) && encoded.length > 0;
}
```

#### Test Cases
```typescript
// src/audio/urlSafeEncoding.test.ts
describe('URL-safe pattern encoding', () => {
  test('round-trip encoding preserves all pattern data');
  test('produces only URL-safe characters');
  test('handles invalid input gracefully');
  test('rejects malformed patterns');
  test('validates character set correctly');
});
```

#### Acceptance Criteria
- ✅ Round-trip encoding maintains pattern integrity
- ✅ Output contains only `A-Za-z0-9-_~` characters
- ✅ Invalid inputs return null gracefully
- ✅ All existing test patterns encode/decode correctly
- ✅ 100% test coverage on encoding functions

---

### Task 2: Router Configuration Extension
**Duration:** 1-2 hours | **Priority:** High | **Dependencies:** None

#### Files to Modify
- `src/App.tsx` (extend existing Router)

#### Specific Implementation
```typescript
// src/App.tsx - Add pattern route
import { Router, Route } from 'wouter';
import DrumMachine from './DrumMachine';
import About from './About';
import NotFound from './NotFound';
import PatternRoute from './components/PatternRoute'; // New component

function App() {
  return (
    <Router base={import.meta.env.BASE_URL}>
      <Route path="/" component={DrumMachine} />
      <Route path="/about" component={About} />
      <Route path="/pattern/:encodedPattern">
        {(params) => <PatternRoute encodedPattern={params.encodedPattern} />}
      </Route>
      <Route component={NotFound} />
    </Router>
  );
}
```

#### Validation Steps
- ✅ Existing routes (`/`, `/about`) continue to work
- ✅ New pattern route accepts parameters correctly
- ✅ Route conflicts resolved (pattern route doesn't interfere)
- ✅ BASE_URL configuration preserved
- ✅ NotFound route catches invalid patterns

---

### Task 3: Pattern Route Component Implementation
**Duration:** 3-4 hours | **Priority:** High | **Dependencies:** Task 1

#### Files to Create
- `src/components/PatternRoute.tsx` (new component)
- `src/components/PatternRoute.test.tsx` (new test file)

#### Specific Implementation
```typescript
// src/components/PatternRoute.tsx
import { useEffect, useState } from 'react';
import { navigate } from 'wouter';
import DrumMachine from '../DrumMachine';
import { decodePatternFromUrlSafe, encodePatternToUrlSafe } from '../audio/urlSafeEncoding';
import type { ShareableState } from '../audio/types';

interface PatternRouteProps {
  encodedPattern: string;
}

interface PatternRouteState {
  isValidPattern: boolean;
  decodedPattern: ShareableState | null;
  isLoading: boolean;
}

export default function PatternRoute({ encodedPattern }: PatternRouteProps) {
  const [state, setState] = useState<PatternRouteState>({
    isValidPattern: false,
    decodedPattern: null,
    isLoading: true
  });

  useEffect(() => {
    // Decode URL pattern
    const decoded = decodePatternFromUrlSafe(encodedPattern);
    
    if (decoded) {
      setState({
        isValidPattern: true,
        decodedPattern: decoded,
        isLoading: false
      });
    } else {
      // Invalid pattern - redirect to default
      console.warn('Invalid pattern in URL, redirecting to default');
      navigate('/', { replace: true });
    }
  }, [encodedPattern]);

  // Handle pattern changes with debounced navigation
  const handlePatternChange = useMemo(
    () => debounce((newPattern: ShareableState) => {
      const encoded = encodePatternToUrlSafe(newPattern);
      navigate(`/pattern/${encoded}`, { replace: false });
    }, 300),
    []
  );

  useEffect(() => {
    return () => {
      handlePatternChange.cancel();
    };
  }, [handlePatternChange]);

  if (state.isLoading) {
    return <div>Loading pattern...</div>;
  }

  if (!state.isValidPattern) {
    return <div>Invalid pattern, redirecting...</div>;
  }

  return (
    <DrumMachine 
      initialPattern={state.decodedPattern}
      onPatternChange={handlePatternChange}
    />
  );
}
```

#### Test Cases
```typescript
// src/components/PatternRoute.test.tsx
describe('PatternRoute component', () => {
  test('loads valid patterns correctly');
  test('redirects on invalid patterns');
  test('triggers navigation on pattern changes');
  test('debounces rapid pattern changes');
  test('cleans up debounced function on unmount');
});
```

#### Acceptance Criteria
- ✅ Valid patterns load and display correctly
- ✅ Invalid patterns redirect to `/` automatically
- ✅ Pattern changes trigger debounced navigation
- ✅ Component integrates with DrumMachine seamlessly
- ✅ Loading states handled appropriately

---

### Task 4: DrumMachine Integration & State Management
**Duration:** 2-3 hours | **Priority:** High | **Dependencies:** Task 3

#### Files to Modify
- `src/DrumMachine.tsx` (add new props, modify state management)

#### Specific Implementation
```typescript
// src/DrumMachine.tsx - Add new props interface
interface DrumMachineProps {
  initialPattern?: ShareableState;
  onPatternChange?: (pattern: ShareableState) => void;
}

export default function DrumMachine({ 
  initialPattern, 
  onPatternChange 
}: DrumMachineProps = {}) {
  // Initialize with provided pattern or default
  const [shareableState, setShareableState] = useState<ShareableState>(() => {
    return initialPattern || getDefaultShareableState();
  });

  // Existing state management for individual components...
  const [gridState, setGridState] = useState<GridState>(() => 
    initialPattern?.grid || getDefaultGridState()
  );
  const [bpm, setBpm] = useState<number>(() => 
    initialPattern?.bpm || 90
  );
  // ... other state initializations

  // Debounced pattern change handler for route navigation
  const debouncedPatternChange = useMemo(
    () => debounce((pattern: ShareableState) => {
      onPatternChange?.(pattern);
    }, 300),
    [onPatternChange]
  );

  // Coordinate route navigation with existing URL sync
  useEffect(() => {
    if (onPatternChange) {
      // Route mode - use provided callback
      debouncedPatternChange(shareableState);
    } else {
      // Standalone mode - maintain existing hash behavior
      syncPatternWithUrl(shareableState);
    }
  }, [shareableState, debouncedPatternChange, onPatternChange]);

  // Rest of existing DrumMachine implementation...
}
```

#### Integration Points
1. **State Initialization:** Use `initialPattern` if provided
2. **Pattern Change Handling:** Call `onPatternChange` when in route mode
3. **Backward Compatibility:** Maintain hash behavior in standalone mode
4. **Debouncing Coordination:** Align with existing 300ms debouncing

#### Acceptance Criteria
- ✅ Component works with and without new props
- ✅ Initial pattern loading works correctly
- ✅ Pattern changes trigger navigation in route mode
- ✅ Existing hash-based behavior preserved in standalone mode
- ✅ No breaking changes to existing functionality

---

### Task 5: Keyboard Shortcuts & Navigation Integration
**Duration:** 1-2 hours | **Priority:** Medium | **Dependencies:** Task 3, Task 4

#### Files to Create/Modify
- `src/hooks/usePatternHistory.ts` (new hook)
- `src/hooks/useKeyboardShortcuts.ts` (new hook)
- `src/components/PatternRoute.tsx` (integrate hooks)

#### Specific Implementation
```typescript
// src/hooks/usePatternHistory.ts
interface HistoryManager {
  history: string[];
  currentIndex: number;
  maxEntries: number;
}

export function usePatternHistory() {
  const [history, setHistory] = useState<HistoryManager>({
    history: [],
    currentIndex: -1,
    maxEntries: 100
  });

  const pushPattern = useCallback((encoded: string) => {
    // Implementation from technical spec...
  }, []);

  const undo = useCallback(() => {
    // Navigate to previous pattern
  }, []);

  const redo = useCallback(() => {
    // Navigate to next pattern
  }, []);

  return { pushPattern, undo, redo, canUndo, canRedo };
}

// src/hooks/useKeyboardShortcuts.ts
export function useKeyboardShortcuts() {
  const { undo, redo } = usePatternHistory();
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Implementation from technical spec...
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);
}
```

#### Integration Strategy
1. **History Management:** Track pattern URLs in memory
2. **Keyboard Events:** Global event listener with input field detection
3. **Navigation Control:** Use Wouter's `navigate()` for undo/redo
4. **Memory Management:** Prune history to 100 entries max

#### Acceptance Criteria
- ✅ Ctrl+Z/Cmd+Z triggers undo navigation
- ✅ Ctrl+Y/Cmd+Shift+Z triggers redo navigation
- ✅ Keyboard shortcuts work when drum machine has focus
- ✅ No conflicts with input field interactions
- ✅ History stack managed properly (max 100 entries)

---

### Task 6: Testing & Validation
**Duration:** 2-3 hours | **Priority:** High | **Dependencies:** All previous tasks

#### Test Files to Create
- `src/audio/urlSafeEncoding.test.ts` ✓ (created in Task 1)
- `src/components/PatternRoute.test.tsx` ✓ (created in Task 3)
- `src/hooks/usePatternHistory.test.ts` (new)
- `src/integration/historyNavigation.test.tsx` (new integration test)

#### Testing Strategy

##### Unit Tests
```typescript
// URL-safe encoding (Task 1)
- Round-trip integrity
- Character set validation
- Error handling

// Pattern Route component (Task 3)
- Valid pattern loading
- Invalid pattern handling
- Navigation triggering

// History hooks (Task 5)
- History stack management
- Undo/redo functionality
- Keyboard event handling
```

##### Integration Tests
```typescript
// src/integration/historyNavigation.test.tsx
describe('History Navigation Integration', () => {
  test('browser back/forward navigation works');
  test('pattern changes create new history entries');
  test('keyboard shortcuts navigate through history');
  test('invalid URLs redirect appropriately');
  test('shared URLs load correct patterns');
});
```

##### Manual Testing Checklist
- [ ] Browser back/forward buttons work
- [ ] URLs are clean and shareable
- [ ] Keyboard shortcuts respond correctly
- [ ] Rapid pattern changes are debounced
- [ ] Invalid URLs redirect gracefully
- [ ] Performance remains acceptable

#### Acceptance Criteria
- ✅ 95%+ test coverage on new code
- ✅ All integration tests pass
- ✅ Manual testing checklist completed
- ✅ No performance regressions detected
- ✅ Browser compatibility verified (Chrome, Firefox, Safari)

---

### Task 7: Documentation & Cleanup
**Duration:** 1 hour | **Priority:** Low | **Dependencies:** Task 6

#### Documentation Updates
- Update `README.md` with new URL format
- Add JSDoc comments to new functions
- Update any existing pattern sharing documentation

#### Code Cleanup
- Remove any unused imports
- Ensure consistent code style
- Add proper TypeScript types
- Final lint and format pass

#### Acceptance Criteria
- ✅ Documentation reflects new URL format
- ✅ Code passes all linting checks
- ✅ TypeScript compilation clean
- ✅ No console warnings in development

## Development Milestones

### Milestone 1: Core Encoding (Tasks 1-2)
**Target:** 3-5 hours | **Deliverables:**
- URL-safe encoding functions with tests
- Router configuration extended
- **Validation:** Encoding works, routes configured

### Milestone 2: Navigation Foundation (Tasks 3-4)
**Target:** 8-12 hours total | **Deliverables:**
- PatternRoute component functional
- DrumMachine integration complete
- **Validation:** Pattern URLs load correctly, navigation works

### Milestone 3: Full Feature (Tasks 5-6)
**Target:** 12-17 hours total | **Deliverables:**
- Keyboard shortcuts working
- Comprehensive test suite
- **Validation:** Complete feature working end-to-end

### Milestone 4: Production Ready (Task 7)
**Target:** 14-20 hours total | **Deliverables:**
- Documentation complete
- Code polished and clean
- **Validation:** Ready for deployment

## Risk Mitigation

### Technical Risks
1. **State Synchronization Issues**
   - **Mitigation:** Incremental testing at each integration point
   - **Fallback:** Revert to hash-based system if navigation loops occur

2. **Performance Impact**
   - **Mitigation:** Monitor navigation timing during development
   - **Threshold:** Navigation should complete within 200ms

3. **Browser Compatibility**
   - **Mitigation:** Test on Chrome, Firefox, Safari during development
   - **Fallback:** Feature detection for unsupported browsers

### Development Risks
1. **Scope Creep**
   - **Mitigation:** Strict adherence to defined acceptance criteria
   - **Process:** Any additional features require new requirements analysis

2. **Integration Complexity**
   - **Mitigation:** Build each component separately before integration
   - **Validation:** Component-level tests before integration tests

## Quality Gates

### Code Quality
- [ ] TypeScript compilation clean
- [ ] ESLint passes with no warnings
- [ ] Prettier formatting applied
- [ ] No console.error or console.warn in production builds

### Functionality
- [ ] All acceptance criteria met for each task
- [ ] Integration tests pass
- [ ] Manual testing checklist completed
- [ ] Performance benchmarks met

### Documentation
- [ ] JSDoc comments on all public functions
- [ ] README updated with new URL format
- [ ] Integration patterns documented
- [ ] Breaking changes clearly noted

## Deployment Strategy

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Performance validation complete
- [ ] Browser compatibility verified
- [ ] Documentation updated

### Deployment Plan
1. **Deploy to staging environment**
2. **Smoke test pattern URLs and navigation**
3. **Verify no regressions in existing functionality**
4. **Deploy to production**
5. **Monitor for any errors or performance issues**

### Rollback Plan
- Revert to previous commit if critical issues found
- Hash-based URLs will continue working in standalone mode
- No data loss risk (client-side only changes)

**Implementation Plan Status: COMPLETE - Ready for development**
