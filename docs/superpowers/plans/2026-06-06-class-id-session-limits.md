# Class ID Session Limits Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reuse `mosan-001` through `mosan-030` across multiple classes while preventing duplicate use and runaway AI cost inside a single class session.

**Architecture:** Add an in-memory class access controller to `story-proxy` because every tablet already talks to that local service for AI generation. The app will request login from the proxy, store the approved class/session token locally, include that token with story/image calls, and expose a teacher reset action on the login screen.

**Tech Stack:** Next.js, React, TypeScript, Express, Node test runner, Vitest.

---

### Task 1: Class Access Domain Logic

**Files:**
- Create: `story-proxy/classAccess.js`
- Create: `story-proxy/classAccess.test.js`
- Modify: `story-proxy/package.json`

- [ ] **Step 1: Write failing tests**

Use Node's built-in test runner to prove that `mosan-001` through `mosan-030` are accepted, `mosan-031` is rejected, active IDs are blocked from other tablets, teacher reset clears usage, and one ID cannot consume more than one story, one cover image, or four print image generations per class session.

- [ ] **Step 2: Run RED**

Run: `cd story-proxy && npm test`
Expected: fail because `classAccess.js` does not exist.

- [ ] **Step 3: Implement class access**

Create a `createClassAccessStore()` factory with `login()`, `reset()`, and `consumeUsage()` methods, backed by an in-memory `Map`.

- [ ] **Step 4: Run GREEN**

Run: `cd story-proxy && npm test`
Expected: all proxy tests pass.

### Task 2: Proxy API Enforcement

**Files:**
- Modify: `story-proxy/server.js`
- Modify: `story-proxy/.env.example`

- [ ] **Step 1: Wire login and reset endpoints**

Add `POST /api/class-login` and `POST /api/class-reset`, using `CLASS_RESET_CODE` from env with a safe classroom default.

- [ ] **Step 2: Enforce usage on expensive endpoints**

For `POST /api/story`, require valid `classId` and `sessionToken`, then consume `story`. For `POST /api/image`, require valid `classId`, `sessionToken`, and mode `cover` or `print`, then consume the corresponding budget.

### Task 3: App Login And Teacher Reset UI

**Files:**
- Modify: `src/story/classSession.ts`
- Modify: `src/story/classSession.test.ts`
- Modify: `src/story/storyEngine.ts`
- Modify: `src/story/StoryKioskApp.tsx`

- [ ] **Step 1: Write failing client tests**

Add tests that only `mosan-001` through `mosan-030` pass local format validation.

- [ ] **Step 2: Run RED**

Run: `npm test -- src/story/classSession.test.ts`
Expected: fail because the new helper does not exist.

- [ ] **Step 3: Connect app login**

Generate/reuse a tablet session token, call `/api/class-login`, block rejected IDs, and pass class access info to story/image API calls.

- [ ] **Step 4: Add teacher reset**

Add a compact reset-code field and button on the login screen that calls `/api/class-reset` and clears local class session state.

### Task 4: Verification

**Files:**
- No new source files.

- [ ] **Step 1: Run automated checks**

Run: `npm test`, `cd story-proxy && npm test`, and `npm run build`.

- [ ] **Step 2: Browser check**

Open `http://localhost:3000/story`, verify `mosan-001` can enter once, duplicate tablet behavior is blocked by the proxy logic, and the reset button restores availability.
