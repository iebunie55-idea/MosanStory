# Initial Artwork And Music Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep early story setup screens on the initial artwork and replace the current thin single-note music with softer classroom-friendly generated background music.

**Architecture:** Add a small pure artwork helper so the kiosk UI can choose the left-panel image by step without embedding that decision in JSX. Expand the music genre data to include soft chords plus a sparse melody, then update the existing Web Audio player to schedule both layers.

**Tech Stack:** Next.js, React, TypeScript, Vitest, Web Audio API.

---

### Task 1: Initial Artwork Selection

**Files:**
- Create: `src/story/storyArtwork.ts`
- Test: `src/story/storyArtwork.test.ts`
- Modify: `src/story/StoryKioskApp.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, test } from "vitest";
import { getKioskArtworkSource, initialStoryArtworkSrc } from "./storyArtwork";

describe("getKioskArtworkSource", () => {
  test("keeps initial artwork before students choose the story background", () => {
    expect(getKioskArtworkSource({ step: "character", placeImageSrc: "/images/places/sea.png" })).toBe(initialStoryArtworkSrc);
    expect(getKioskArtworkSource({ step: "trait", placeImageSrc: "/images/places/sea.png" })).toBe(initialStoryArtworkSrc);
  });

  test("uses selected place artwork from the background step onward", () => {
    expect(getKioskArtworkSource({ step: "place", placeImageSrc: "/images/places/sea.png" })).toBe("/images/places/sea.png");
    expect(getKioskArtworkSource({ step: "event", placeImageSrc: "/images/places/sea.png" })).toBe("/images/places/sea.png");
  });

  test("uses generated images on the result screen before falling back to place artwork", () => {
    expect(getKioskArtworkSource({ step: "result", placeImageSrc: "/images/places/sea.png", generatedImage: "data:image/png;base64,abc" })).toBe("data:image/png;base64,abc");
    expect(getKioskArtworkSource({ step: "result", placeImageSrc: "/images/places/sea.png" })).toBe("/images/places/sea.png");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/story/storyArtwork.test.ts`
Expected: FAIL because `src/story/storyArtwork.ts` does not exist yet.

- [ ] **Step 3: Implement helper and wire it into the kiosk**

Create `src/story/storyArtwork.ts` with `initialStoryArtworkSrc = "/images/story-default-bg.png"` and `getKioskArtworkSource()`. Update `KioskArtwork` to receive an `imageSrc`, and pass the helper result from `StoryKioskApp`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/story/storyArtwork.test.ts`
Expected: PASS.

### Task 2: Softer Generated Background Music

**Files:**
- Modify: `src/story/storyMusic.ts`
- Test: `src/story/storyMusic.test.ts`
- Modify: `src/story/StoryKioskApp.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
test("uses layered chords and melody notes for softer generated background music", () => {
  for (const genre of musicGenres) {
    expect(genre.chords.length).toBeGreaterThanOrEqual(2);
    expect(genre.melody.length).toBeGreaterThanOrEqual(4);
    expect(genre.masterGain).toBeLessThanOrEqual(0.045);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/story/storyMusic.test.ts`
Expected: FAIL because current genres only expose `notes`.

- [ ] **Step 3: Update music model and player**

Replace per-genre `notes` with `chords`, `melody`, `chordDuration`, `melodyGain`, `padGain`, and `masterGain`. Update the Web Audio playback to schedule a soft chord pad and a sparse melody note each interval.

- [ ] **Step 4: Run tests and build**

Run: `npm test`, then `npm run build`.
Expected: all tests pass and production build succeeds.

### Task 3: Browser Verification

**Files:**
- No additional source files.

- [ ] **Step 1: Start local servers**

Run app server: `npm run dev`.
Run proxy server if needed: `cd story-proxy && npm start`.

- [ ] **Step 2: Verify setup screen artwork**

Open `http://localhost:3000/story`, enter `mosan-001`, begin the story flow, and confirm the 1단계 left image uses `/images/story-default-bg.png` even if a previous place selection was sea or forest.

- [ ] **Step 3: Verify result screen still uses generated/selected imagery**

Create a story and confirm result screen uses generated image when available, otherwise the selected place image.
