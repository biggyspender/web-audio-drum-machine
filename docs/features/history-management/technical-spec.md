# History Management - Technical Specification

## Overview

Transform the drum machine's existing hash-based pattern sharing into full browser history management using Wouter routing with custom URL-safe encoding. Enable browser back/forward navigation through pattern changes while maintaining clean, shareable URLs.

## Architecture

### System Integration
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   App.tsx       │    │  PatternRoute   │    │ DrumMachine.tsx │
│  (Wouter Router)│◄──►│   Component     │◄──►│   (State Mgmt)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Route Config    │    │ URL-Safe        │    │ Pattern State   │
│ /pattern/:id    │    │ Encoding        │    │ Synchronization │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow
1. **Pattern Changes** → Debounced navigation to `/pattern/{encoded}`
2. **Browser Navigation** → Route parameter extraction → Pattern restoration
3. **Keyboard Shortcuts** → Undo/redo via Wouter navigation

## Custom URL-Safe Encoding

### Encoding Strategy
Transform existing base64 pattern encoding to be URL-safe without escape sequences:

```typescript
// Character Mapping
const URL_SAFE_MAPPING = {
  encode: { '+': '-', '/': '_', '=': '~' },
  decode: { '-': '+', '_': '/', '~': '=' }
};

// Implementation
function encodePatternToUrlSafe(pattern: ShareableState): string {
  const base64 = encodePatternToBase64(pattern);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_') 
    .replace(/=/g, '~');
}

function decodePatternFromUrlSafe(encoded: string): ShareableState | null {
  try {
    const base64 = encoded
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .replace(/~/g, '=');
    return decodePatternFromBase64(base64);
  } catch (error) {
    console.warn('Invalid pattern URL:', error);
    return null;
  }
}
```

### URL Format
- **Clean URLs:** `/pattern/ABC123-_~DEF456`
- **Invalid Patterns:** Graceful fallback to default pattern

## Router Configuration

### App.tsx Extensions
```typescript
import { Router, Route } from 'wouter';
import PatternRoute from './components/PatternRoute';

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

### Route Component Contract
```typescript
interface PatternRouteProps {
  encodedPattern: string;
}

interface PatternRouteState {
  isValidPattern: boolean;
  decodedPattern: ShareableState | null;
}
```

## Pattern Route Component

### Implementation Specification
```typescript
import { useEffect, useState } from 'react';
import { useLocation, navigate } from 'wouter';
import DrumMachine from '../DrumMachine';
import { decodePatternFromUrlSafe, encodePatternToUrlSafe } from '../audio/patternEncoding';

function PatternRoute({ encodedPattern }: PatternRouteProps) {
  const [patternState, setPatternState] = useState<PatternRouteState>({
    isValidPattern: false,
    decodedPattern: null
  });

  useEffect(() => {
    // Decode URL pattern
    const decoded = decodePatternFromUrlSafe(encodedPattern);
    
    if (decoded) {
      setPatternState({
        isValidPattern: true,
        decodedPattern: decoded
      });
    } else {
      // Invalid pattern - redirect to default
      console.warn('Invalid pattern in URL, redirecting to default');
      navigate('/');
    }
  }, [encodedPattern]);

  if (!patternState.isValidPattern) {
    return <div>Loading pattern...</div>;
  }

  return (
    <DrumMachine 
      initialPattern={patternState.decodedPattern}
      onPatternChange={(newPattern) => {
        // Debounced navigation to new pattern URL
        const encoded = encodePatternToUrlSafe(newPattern);
        navigate(`/pattern/${encoded}`, { replace: false });
      }}
    />
  );
}
```

## DrumMachine Integration

### State Management Updates
```typescript
interface DrumMachineProps {
  initialPattern?: ShareableState;
  onPatternChange?: (pattern: ShareableState) => void;
}

// Replace existing syncPatternWithUrl with route-based navigation
function DrumMachine({ initialPattern, onPatternChange }: DrumMachineProps) {
  // Initialize with provided pattern or default
  const [shareableState, setShareableState] = useState<ShareableState>(() => {
    return initialPattern || getDefaultShareableState();
  });

  // Debounced pattern change handler
  const debouncedPatternChange = useMemo(
    () => debounce((pattern: ShareableState) => {
      onPatternChange?.(pattern);
    }, 300),
    [onPatternChange]
  );

  // Replace existing URL sync with route navigation
  useEffect(() => {
    if (onPatternChange) {
      debouncedPatternChange(shareableState);
    } else {
      // Standalone mode - maintain existing hash-based behavior
      syncPatternWithUrl(shareableState);
    }
  }, [shareableState, debouncedPatternChange, onPatternChange]);

  // Rest of existing DrumMachine implementation...
}
```

## Keyboard Shortcuts Integration

### Undo/Redo Implementation
```typescript
interface HistoryManager {
  history: string[]; // Array of encoded patterns
  currentIndex: number;
  maxEntries: number;
}

function usePatternHistory() {
  const [history, setHistory] = useState<HistoryManager>({
    history: [],
    currentIndex: -1,
    maxEntries: 100
  });

  const pushPattern = useCallback((encoded: string) => {
    setHistory(prev => {
      const newHistory = prev.history.slice(0, prev.currentIndex + 1);
      newHistory.push(encoded);
      
      // Prune if exceeds max entries
      if (newHistory.length > prev.maxEntries) {
        newHistory.shift();
        return {
          ...prev,
          history: newHistory,
          currentIndex: newHistory.length - 1
        };
      }
      
      return {
        ...prev,
        history: newHistory,
        currentIndex: newHistory.length - 1
      };
    });
  }, []);

  const canUndo = history.currentIndex > 0;
  const canRedo = history.currentIndex < history.history.length - 1;

  const undo = useCallback(() => {
    if (canUndo) {
      const newIndex = history.currentIndex - 1;
      const targetPattern = history.history[newIndex];
      navigate(`/pattern/${targetPattern}`);
      setHistory(prev => ({ ...prev, currentIndex: newIndex }));
    }
  }, [canUndo, history]);

  const redo = useCallback(() => {
    if (canRedo) {
      const newIndex = history.currentIndex + 1;
      const targetPattern = history.history[newIndex];
      navigate(`/pattern/${targetPattern}`);
      setHistory(prev => ({ ...prev, currentIndex: newIndex }));
    }
  }, [canRedo, history]);

  return { pushPattern, undo, redo, canUndo, canRedo };
}
```

### Keyboard Event Handler
```typescript
function useKeyboardShortcuts() {
  const { undo, redo, canUndo, canRedo } = usePatternHistory();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Avoid conflicts with input fields
      if (event.target instanceof HTMLInputElement) {
        return;
      }

      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      
      if (isCtrlOrCmd && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if (isCtrlOrCmd && (
        (event.key === 'y') || 
        (event.key === 'z' && event.shiftKey)
      )) {
        event.preventDefault();
        redo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return { canUndo, canRedo };
}
```

## Performance Optimization

### Debouncing Strategy
```typescript
// Coordinate with existing 300ms debouncing
const NAVIGATION_DEBOUNCE_MS = 300;

// Prevent rapid navigation during pattern editing
const debouncedNavigate = useMemo(
  () => debounce((pattern: string) => {
    navigate(`/pattern/${pattern}`, { replace: false });
  }, NAVIGATION_DEBOUNCE_MS),
  []
);
```

### Memory Management
```typescript
// History pruning to prevent memory leaks
const MAX_HISTORY_ENTRIES = 100;

// Cleanup on component unmount
useEffect(() => {
  return () => {
    debouncedNavigate.cancel();
  };
}, [debouncedNavigate]);
```

## Error Handling

### Invalid Pattern URLs
```typescript
function validatePatternUrl(encoded: string): boolean {
  // Check URL-safe character set
  const urlSafePattern = /^[A-Za-z0-9\-_~]+$/;
  if (!urlSafePattern.test(encoded)) {
    return false;
  }
  
  // Attempt decode validation
  try {
    const decoded = decodePatternFromUrlSafe(encoded);
    return decoded !== null;
  } catch {
    return false;
  }
}

function PatternRoute({ encodedPattern }: PatternRouteProps) {
  const isValid = validatePatternUrl(encodedPattern);
  
  if (!isValid) {
    // Redirect to default pattern
    useEffect(() => {
      navigate('/', { replace: true });
    }, []);
    
    return <div>Invalid pattern, redirecting...</div>;
  }
  
  // Continue with valid pattern...
}
```

### Browser Navigation Edge Cases
```typescript
// Handle external navigation to pattern URLs
useEffect(() => {
  const handlePopState = (event: PopStateEvent) => {
    // Wouter handles this automatically, but we can add custom logic
    console.log('Browser navigation detected');
  };
  
  window.addEventListener('popstate', handlePopState);
  return () => window.removeEventListener('popstate', handlePopState);
}, []);
```

## Testing Strategy

### Unit Tests
```typescript
// URL-safe encoding tests
describe('URL-safe encoding', () => {
  test('round-trip encoding preserves pattern data', () => {
    const pattern = createTestPattern();
    const encoded = encodePatternToUrlSafe(pattern);
    const decoded = decodePatternFromUrlSafe(encoded);
    expect(decoded).toEqual(pattern);
  });
  
  test('URL-safe characters only', () => {
    const pattern = createTestPattern();
    const encoded = encodePatternToUrlSafe(pattern);
    expect(encoded).toMatch(/^[A-Za-z0-9\-_~]+$/);
  });
  
  test('invalid patterns return null', () => {
    expect(decodePatternFromUrlSafe('invalid!!!')).toBeNull();
  });
});
```

### Integration Tests
```typescript
// Route navigation tests
describe('Pattern routing', () => {
  test('navigating to pattern URL loads correct state', async () => {
    const pattern = createTestPattern();
    const encoded = encodePatternToUrlSafe(pattern);
    
    render(<App />, { wrapper: MemoryRouter, initialEntries: [`/pattern/${encoded}`] });
    
    await waitFor(() => {
      expect(screen.getByTestId('drum-machine')).toBeInTheDocument();
      // Verify pattern state matches
    });
  });
  
  test('invalid pattern URLs redirect to default', () => {
    // Test implementation...
  });
});
```

## Security Considerations

### Input Validation
- URL pattern parameters validated before decoding
- Malformed patterns gracefully rejected
- No code injection vectors through pattern data

### Data Sanitization
- Pattern encoding is binary-safe
- No user-controllable string injection
- URL-safe character set prevents encoding attacks

## Migration Strategy

### Single Phase Deployment
1. Deploy route-based system as complete replacement
2. Existing hash URLs will break (acceptable per requirements)
3. Users will need to create new pattern URLs
4. Clean implementation without legacy code burden

## API Contracts

### Public Interfaces
```typescript
// URL encoding functions
export function encodePatternToUrlSafe(pattern: ShareableState): string;
export function decodePatternFromUrlSafe(encoded: string): ShareableState | null;

// Route component
export interface PatternRouteProps {
  encodedPattern: string;
}

// DrumMachine integration
export interface DrumMachineProps {
  initialPattern?: ShareableState;
  onPatternChange?: (pattern: ShareableState) => void;
}

// History management
export interface HistoryManager {
  pushPattern(encoded: string): void;
  undo(): void;
  redo(): void;
  canUndo: boolean;
  canRedo: boolean;
}
```

### Internal Contracts
```typescript
// Pattern validation
function validatePatternUrl(encoded: string): boolean;

// Debounced navigation
function createDebouncedNavigate(delay: number): (pattern: string) => void;
```

## Multi-Role Approval Checklist

### PM Validation ✓
- **User Problem:** Browser back/forward navigation through pattern changes
- **Solution:** Clean route-based URLs with Wouter integration
- **Value:** Enhanced user experience with shareable, navigable patterns

### Security Review ✓
- **Input Validation:** URL patterns validated before processing
- **Injection Prevention:** Binary encoding prevents code injection
- **Data Protection:** No sensitive data exposed in URLs

### QA Testing Requirements ✓
- **Acceptance Criteria:** Browser navigation works, URLs are clean
- **Edge Cases:** Invalid patterns, keyboard shortcuts, rapid navigation
- **Test Coverage:** Unit tests for encoding, integration tests for routing

### Architecture Review ✓
- **Integration:** Clean extension of existing Wouter router
- **Dependencies:** Minimal - leverages existing base64 encoding system
- **Maintainability:** Clear separation of concerns, standard React patterns

### DevOps Considerations ✓
- **Deployment:** No infrastructure changes required
- **Monitoring:** Standard client-side error logging sufficient
- **Rollback:** Can revert to hash-based system if needed
- **Performance:** Minimal impact - leverages existing debouncing

**Technical Specification Status: COMPLETE - Ready for implementation planning**