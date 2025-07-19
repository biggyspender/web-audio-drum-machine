# Drum Machine Routing & Pattern Sharing: Phased Implementation Plan

This document outlines a step-by-step, testable workflow for implementing routing and pattern sharing in the drum machine app. Each phase is self-contained and should be verified before proceeding to the next.

---

## Phase 1: Add Client-Side Routing

**Goal:** Introduce Wouter and basic navigation between the root (drum machine) and /about pages.

**Steps:**
1. Install Wouter as a dependency.
2. Refactor the app to use Wouter for routing.
3. Implement two routes:
   - `/` (root): displays the drum machine UI (existing functionality).
   - `/about`: displays a static page with lorem ipsum text.
4. Add navigation links between the two pages.

**Test:**
- Navigating to `/` shows the drum machine.
- Navigating to `/about` shows the about page.
- Navigation links work as expected.

---

## Phase 2: Encode Drum Pattern in URL Hash Fragment

**Goal:** Enable encoding of the current drum pattern as a short, non-human-readable string in the URL hash fragment.

**Steps:**
1. Design a compact encoding scheme for the drum pattern (e.g., base64, custom binary encoding).
2. Implement a function to encode the current drum pattern to a string.
3. Update the URL hash fragment (e.g., `#pattern=...`) whenever the drum pattern changes.

**Test:**
- Making changes to the drum pattern updates the hash fragment in the URL.
- The hash fragment string is short and non-human-readable.

---

## Phase 3: Decode Drum Pattern from URL Hash Fragment

**Goal:** Restore the drum pattern from the hash fragment on app load or navigation.

**Steps:**
1. Implement a function to decode the pattern string from the hash fragment.
2. On app load, check for a pattern in the hash fragment and restore the drum pattern if present.
3. Handle invalid or missing pattern strings gracefully (fallback to default pattern).

**Test:**
- Loading a URL with a valid pattern in the hash fragment restores the correct drum pattern.
- Loading a URL with an invalid or missing pattern falls back to the default pattern.

---

## Phase 4: Synchronize Pattern State and URL Hash

**Goal:** Ensure that the drum pattern and URL hash fragment remain in sync at all times.

**Steps:**
1. Set up listeners so that changes to the drum pattern update the hash fragment.
2. Set up listeners so that changes to the hash fragment (e.g., user pastes a new URL) update the drum pattern.
3. Prevent infinite update loops (e.g., by checking for actual changes before updating).

**Test:**
- Editing the drum pattern updates the URL hash.
- Manually editing the URL hash updates the drum pattern.
- No infinite loops or redundant updates occur.

---

Each phase should be fully tested and confirmed before moving to the next. This ensures a safe, incremental implementation process.
