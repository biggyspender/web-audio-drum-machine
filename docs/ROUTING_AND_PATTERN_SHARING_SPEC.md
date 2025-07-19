# Drum Machine Routing & Pattern Sharing Specification

## 1. Routing
- Use a simple client-side router (Wouter).
- Two routes:
  - `/` (root): hosts the drum machine.
  - `/about`: static page (lorem ipsum content for now).

## 2. Pattern Sharing via URL
- Drum patterns are encoded into a short, non-human-readable string.
- The encoded pattern is stored in the URL hash fragment (e.g., `/#pattern=...`).
- No server communication for pattern sharing.
- On app load, the drum machine decodes the pattern from the hash fragment and restores the state.
- Any change to the drum pattern immediately updates the hash fragment in the URL.

## 3. Workflow
- The implementation will proceed in small, achievable steps.
- Each step must be completed and verified before moving to the next.
