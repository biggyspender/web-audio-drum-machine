# History Management - Requirements Analysis (REVISED)

## Architectural Approach: Wouter Route-Based Pattern Storage

**Key Insight:** Instead of storing patterns in hash fragments, use Wouter's standard routing with encoded patterns as URL path segments, providing cleaner URLs and better browser history integration.

**Strategy:** Convert pattern states into proper URL routes like `/pattern/[url-encoded-base64]`, enabling natural browser navigation while maintaining existing pattern encoding compatibility.

## Acceptance Criteria (Measurable & Testable)

### AC1: Wouter Route-Based Pattern Storage
**Requirement:** Use Wouter's standard routing with patterns as URL path segments
**Measurement:**
- Router configured with standard `useBrowserLocation` (not hash-based)
- Pattern changes create new routes like `/pattern/[url-encoded-base64]`
- Browser back/forward buttons navigate through pattern routes within 500ms
- Wouter's `useLocation` hook provides navigation control

### AC2: URL-Safe Pattern Encoding
**Requirement:** Use custom URL-safe encoding instead of base64 + URL escaping
**Measurement:**
- Base64 characters `+/=` replaced with URL-safe characters like `-_~`
- Direct URL-safe alphabet: `A-Za-z0-9-_~` (no escaping needed)
- Custom encoding produces shorter, cleaner URLs than `encodeURIComponent(base64)`
- Full round-trip encoding/decoding maintains pattern integrity
- URL segments remain valid without percent-encoding

### AC3: Clean Route Structure  
**Requirement:** Replace hash-based URLs with clean path-based routes using URL-safe encoding
**Measurement:**
- Current `#pattern=ABC123+/=` becomes `/pattern/ABC123-_~` (no escaping needed)
- Root route `/` shows default/empty pattern state
- Pattern routes `/pattern/:encodedPattern` handle all pattern states
- URLs remain shareable and bookmarkable with readable characters
- No percent-encoding or hash fragments needed

### AC4: Wouter Navigation Integration
**Requirement:** Use Wouter's navigation hooks with custom URL-safe encoding
**Measurement:**
- `useLocation()` hook triggers pattern state changes
- `navigate('/pattern/' + encodePatternToUrlSafe(pattern))` creates clean history entries
- Route parameters directly usable without URL decoding step
- Navigation state synchronizes with React component state

### AC5: Undo/Redo via Router Navigation
**Requirement:** Keyboard shortcuts trigger Wouter navigation for undo/redo
**Measurement:**
- Ctrl+Z (Cmd+Z on Mac) calls `navigate()` to previous pattern route within 100ms
- Ctrl+Y (Cmd+Shift+Z on Mac) calls `navigate()` to next pattern route within 100ms  
- Router history provides undo/redo availability state
- Works when drum machine has focus (not input fields)

### AC6: Pattern State Management
**Requirement:** Pattern state drives from route parameters with clean implementation
**Measurement:**
- Route changes automatically trigger pattern state updates
- `useParams()` or route patterns extract encoded pattern data
- State restoration uses Wouter's route matching
- Pattern changes debounced before creating new routes (300ms)
- Breaking change: Existing hash-based URLs will stop working

### AC7: Performance with Route-Based Storage
**Requirement:** Route-based pattern storage maintains existing performance characteristics
**Measurement:**
- Route changes trigger pattern updates <200ms
- Memory usage comparable to existing hash-based implementation
- No impact on audio performance during navigation
- URL encoding/decoding overhead <10ms per operation

## Edge Cases & Boundaries

### Router Configuration
- **Standard Routing:** `useBrowserLocation` (default) instead of hash routing
- **Base Path:** Coordinate with existing Vite base path configuration
- **Route Patterns:** `/pattern/:encodedPattern` for pattern parameter extraction
- **Fallback Routes:** Handle invalid or malformed pattern routes
- **URL Encoding:** Custom URL-safe encoding (no `encodeURIComponent` needed)

### Migration Scenarios  
- **Breaking Change:** Existing hash-based URLs (`#pattern=ABC123+/=`) will stop working
- **Route Conflicts:** Ensure `/pattern/*` doesn't conflict with existing `/about` route
- **Deep Linking:** Direct navigation to pattern routes works from external links
- **URL Validation:** Handle malformed or corrupted URL-encoded patterns
- **Clean Implementation:** No legacy code or transition complexity

### Integration Challenges
- **Debouncing Coordination:** Align Wouter navigation with existing 300ms URL debouncing
- **State Synchronization:** Ensure route changes properly update React state without loops
- **Custom Encoding Safety:** Ensure URL-safe alphabet handles all pattern data correctly
- **Audio Independence:** Route navigation should not affect audio pipeline state
- **Base Path Compatibility:** Work correctly with Vite's BASE_URL configuration

## Dependencies & Integration Points

### Wouter Dependencies
- **useBrowserLocation:** Standard browser location hook (default, no hash needed)
- **useLocation:** Navigation and current route access  
- **useParams/useRoute:** Pattern parameter extraction with URL decoding
- **Router Component:** Already configured in App.tsx - extend with pattern routes

### Existing System Integration
- **Pattern Encoding:** Reuse existing `encodePatternToBase64/decodePatternFromBase64`
- **URL-Safe Encoding Layer:** Add custom URL-safe encoding (replace base64url characters)
- **DrumMachine State:** Integrate route changes with existing state management
- **URL Debouncing:** Coordinate with existing debounced pattern synchronization
- **App Router:** Extend existing Wouter Router configuration in App.tsx

### Migration Requirements
- **URL Format:** New format `/pattern/ABC-_~` replaces `#pattern=ABC+/=`
- **Breaking Change:** Existing hash URLs will stop working (acceptable)
- **No Backward Compatibility:** Clean implementation without legacy code
- **Route Registration:** Add pattern routes to existing Wouter configuration
- **State Mapping:** Map URL-safe encoded route parameters to shareableState structure

## Technical Approach

### Router Configuration Extension
```typescript
// Extend existing App.tsx Router configuration
// No need for useHashLocation - use standard routing

<Router base={base}>
  <Route path="/" component={DrumMachine} />
  <Route path="/about" component={About} />
  <Route path="/pattern/:encodedPattern" component={PatternRoute} />
  <Route path="*" component={NotFound} />
</Router>
```

### Pattern Route Component
```typescript
// New component to handle pattern routes
const PatternRoute = () => {
  const { encodedPattern } = useParams();
  
  // Direct decode - no URL decoding needed
  const patternState = decodePatternFromUrlSafe(encodedPattern);
  
  // Apply pattern state to DrumMachine
  return <DrumMachine initialPattern={patternState} />;
};
```

### Custom URL-Safe Encoding Strategy
```typescript
// Custom encoding that produces URL-safe characters directly
function encodePatternToUrlSafe(pattern: ShareableState): string {
  // Step 1: Use existing base64 encoding
  const base64 = encodePatternToBase64(pattern);
  
  // Step 2: Convert base64 to URL-safe characters
  return base64
    .replace(/\+/g, '-')  // + → -
    .replace(/\//g, '_')  // / → _
    .replace(/=/g, '~');  // = → ~
}

function decodePatternFromUrlSafe(urlSafe: string): ShareableState | null {
  // Step 1: Convert back to standard base64
  const base64 = urlSafe
    .replace(/-/g, '+')   // - → +
    .replace(/_/g, '/')   // _ → /
    .replace(/~/g, '=');  // ~ → =
  
  // Step 2: Use existing base64 decoding
  return decodePatternFromBase64(base64);
}

// Replace direct hash manipulation with clean route navigation
const [location, navigate] = useLocation();

// Pattern to URL: ShareableState → base64 → URL-safe → route
const urlSafePattern = encodePatternToUrlSafe(shareableState);
navigate(`/pattern/${urlSafePattern}`);

// URL to Pattern: route → URL-safe → base64 → ShareableState  
const { encodedPattern } = useParams();
const pattern = decodePatternFromUrlSafe(encodedPattern);
```

### Legacy Hash Migration
```typescript
// No legacy migration - breaking change acceptable
// Existing hash URLs will no longer work
// Clean implementation without migration complexity
```

## Resource Estimates

### Development Effort (Revised)
- **Router Configuration:** 1-2 hours (extend existing Wouter setup)
- **Custom URL-Safe Encoding:** 2-3 hours (base64 character replacement functions)
- **Pattern Route Implementation:** 3-4 hours (new route component + state integration)
- **DrumMachine Integration:** 2-3 hours (add props for route-based usage)
- **Keyboard Shortcuts Integration:** 1-2 hours (use navigate() for undo/redo)
- **Testing & Edge Cases:** 2-3 hours (custom encoding, route testing)
- **Documentation:** 1 hour
- **Total:** 12-18 hours (reduced without legacy migration complexity)

### Technical Complexity (Simplified)
- **Standard Routing:** No hash routing complexity - uses default Wouter behavior
- **Clean URLs:** Custom encoding produces readable URLs like `/pattern/ABC123-_~`
- **No URL Escaping:** Direct URL-safe characters eliminate percent-encoding
- **Shorter URLs:** More efficient than base64 + `encodeURIComponent`
- **Better Readability:** URLs remain human-readable without escape codes
- **No Legacy Code:** Clean implementation without migration complexity

## Updated Approval Requirements

### Architecture Review ✅
**Router Integration:** Uses existing Wouter infrastructure consistently
**Pattern Compatibility:** Maintains existing pattern encoding with better navigation
**Performance:** Lower overhead than custom history implementation

### UX Review ✅
**Navigation Feel:** Natural browser back/forward via standard Wouter routing  
**URL Structure:** Clean `/pattern/ABC123-_~` format vs legacy `#pattern=ABC123+/=`
**Sharing Experience:** Readable URLs without percent-encoding or hash fragments
**URL Aesthetics:** Custom encoding produces visually clean, professional URLs

### Technical Review ✅
**Wouter Integration:** Leverages existing router with standard routing
**Custom Encoding:** Simple character replacement provides URL-safe encoding without escaping
**No Migration Complexity:** Clean implementation without legacy support burden
**State Management:** Cleaner separation between routing and audio state

**Requirements Status: REVISED AND COMPLETE - Ready for implementation planning**
