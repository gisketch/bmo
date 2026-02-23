## Context

The BMO frontend layout and spacing have been iterated on across multiple changes. Some viewports and page switches can exhibit minor shifts or overflow issues that are better handled with small, targeted UX polish updates.

## Goals / Non-Goals

**Goals:**
- Improve layout consistency and responsiveness across Face and Status pages.
- Keep changes incremental, localized, and aligned with the existing design system.

**Non-Goals:**
- Large visual redesigns or new page flows.
- Introducing new theme tokens, colors, or typography.

## Decisions

- Prefer small Tailwind class adjustments and component-level layout tweaks over global CSS changes.
- Keep changes scoped to `frontend/src/components/bmo/` unless a shared primitive is clearly needed.
- Preserve current behavior unless it is explicitly inconsistent or causes overflow/clipping issues.
- For touch interactions, prevent duplicate activation caused by synthetic mouse events after touch by deduping touch vs mouse.
- Implement screen power transitions as layered DOM states (off layer + animated on layer) rather than changing colors mid-animation.
- Preload UI SFX on startup and play audio opportunistically (ignore autoplay restrictions until user gesture allows playback).

## Risks / Trade-offs

- **Risk**: Layout tweaks cause regressions on uncommon viewport sizes.
  - **Mitigation**: Validate against a small set of representative viewport dimensions and keep diffs minimal.
