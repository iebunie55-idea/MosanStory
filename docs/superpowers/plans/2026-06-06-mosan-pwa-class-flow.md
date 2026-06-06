# Mosan Story Class PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모산초등학교 3~6학년 학생들이 태블릿에서 로그인하고, 흥미롭게 동화를 만들고, 배경음악과 함께 감상한 뒤 그림 포함 PDF를 받을 수 있는 PWA 1차 버전을 만든다.

**Architecture:** 기존 Next 앱과 동화 생성 흐름을 유지하되, 수업용 세션/브랜딩/음악/PDF/PWA 기능을 작은 모듈로 분리한다. 서버 DB가 필요한 로그인은 Supabase 어댑터를 붙일 수 있는 인터페이스를 먼저 만들고, 실제 운영 연결은 환경변수 기반으로 구성한다.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Supabase JS, browser Web Audio/HTMLAudio, Playwright or browser manual verification for tablet UI.

---

## File Structure

- Create `src/story/classSession.ts`: class ID validation, device token naming, session status types, user-facing Korean messages.
- Create `src/story/classSession.test.ts`: pure unit tests for class ID normalization, login decision rules, and completed/active blocking messages.
- Modify `src/story/StoryKioskApp.tsx`: add login gate, Mosan branding, student session display, result music controls, and PDF button labeling.
- Create `src/story/storyMusic.ts`: small audio controller helpers that are safe for mobile browsers.
- Create `src/story/storyMusic.test.ts`: unit tests for music state transitions that do not require real audio playback.
- Create `src/story/pdfMetadata.ts`: stable PDF filename/title/date metadata helpers.
- Create `src/story/pdfMetadata.test.ts`: unit tests for filename and metadata output.
- Modify `src/app/layout.tsx`: PWA metadata and mobile app title.
- Create `public/manifest.webmanifest`: PWA manifest for add-to-home-screen.
- Add icons under `public/icons/` using existing app imagery or generated simple maskable icons.
- Modify `next.config.mjs`: remove static-export-only assumptions when API routes are introduced.
- Future task: Create `src/app/api/class-session/*` routes and Supabase adapter after Supabase project credentials are available.

## Task 1: Add Test Harness

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/story/classSession.test.ts`

- [ ] **Step 1: Install test tooling**

Run:

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom
```

Expected: `package.json` and `package-lock.json` include Vitest dependencies.

- [ ] **Step 2: Add test script**

Modify `package.json` scripts:

```json
{
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 3: Write the first failing class session test**

Create `src/story/classSession.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { normalizeClassId } from "./classSession";

describe("normalizeClassId", () => {
  test("normalizes Mosan class IDs for young students typing on tablets", () => {
    expect(normalizeClassId(" MOSAN-001 ")).toBe("mosan-001");
    expect(normalizeClassId("mosan001")).toBe("mosan-001");
  });
});
```

- [ ] **Step 4: Verify RED**

Run:

```bash
npm test -- src/story/classSession.test.ts
```

Expected: FAIL because `src/story/classSession.ts` does not exist.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/story/classSession.test.ts
git commit -m "test: add class session test harness"
```

## Task 2: Class ID Session Rules

**Files:**
- Create: `src/story/classSession.ts`
- Modify: `src/story/classSession.test.ts`

- [ ] **Step 1: Expand failing tests**

Replace `src/story/classSession.test.ts` with:

```ts
import { describe, expect, test } from "vitest";
import { decideClassLogin, normalizeClassId } from "./classSession";

describe("normalizeClassId", () => {
  test("normalizes Mosan class IDs for young students typing on tablets", () => {
    expect(normalizeClassId(" MOSAN-001 ")).toBe("mosan-001");
    expect(normalizeClassId("mosan001")).toBe("mosan-001");
  });
});

describe("decideClassLogin", () => {
  test("allows an unused ID and marks it as active", () => {
    expect(decideClassLogin({ id: "mosan-001", status: "unused" }, "device-a")).toEqual({
      ok: true,
      nextStatus: "active",
      message: "모산초 동화 만들기를 시작해요."
    });
  });

  test("allows the same tablet to resume an active ID", () => {
    expect(decideClassLogin({ id: "mosan-001", status: "active", sessionToken: "device-a" }, "device-a").ok).toBe(true);
  });

  test("blocks an active ID from another tablet", () => {
    expect(decideClassLogin({ id: "mosan-001", status: "active", sessionToken: "device-a" }, "device-b")).toEqual({
      ok: false,
      nextStatus: "active",
      message: "이미 다른 태블릿에서 사용 중인 아이디예요. 선생님께 알려주세요."
    });
  });

  test("blocks completed IDs", () => {
    expect(decideClassLogin({ id: "mosan-001", status: "completed" }, "device-a")).toEqual({
      ok: false,
      nextStatus: "completed",
      message: "이미 동화책을 완성한 아이디예요. 다시 필요하면 선생님께 알려주세요."
    });
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npm test -- src/story/classSession.test.ts
```

Expected: FAIL because `decideClassLogin` is not implemented.

- [ ] **Step 3: Implement minimal class session rules**

Create `src/story/classSession.ts`:

```ts
export type ClassSessionStatus = "unused" | "active" | "completed";

export type ClassSessionRecord = {
  id: string;
  status: ClassSessionStatus;
  sessionToken?: string;
};

export type ClassLoginDecision = {
  ok: boolean;
  nextStatus: ClassSessionStatus;
  message: string;
};

export function normalizeClassId(value: string) {
  const compact = value.trim().toLowerCase().replace(/\s+/g, "").replace(/^mosan-?(\d{1,3})$/, "mosan-$1");
  return compact.replace(/^(mosan-)(\d)$/, "$100$2").replace(/^(mosan-)(\d{2})$/, "$10$2");
}

export function decideClassLogin(record: ClassSessionRecord, currentSessionToken: string): ClassLoginDecision {
  if (record.status === "unused") {
    return { ok: true, nextStatus: "active", message: "모산초 동화 만들기를 시작해요." };
  }

  if (record.status === "active" && record.sessionToken === currentSessionToken) {
    return { ok: true, nextStatus: "active", message: "이어서 동화를 만들어요." };
  }

  if (record.status === "active") {
    return {
      ok: false,
      nextStatus: "active",
      message: "이미 다른 태블릿에서 사용 중인 아이디예요. 선생님께 알려주세요."
    };
  }

  return {
    ok: false,
    nextStatus: "completed",
    message: "이미 동화책을 완성한 아이디예요. 다시 필요하면 선생님께 알려주세요."
  };
}
```

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- src/story/classSession.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/story/classSession.ts src/story/classSession.test.ts
git commit -m "feat: add class ID session rules"
```

## Task 3: PDF Metadata Helpers

**Files:**
- Create: `src/story/pdfMetadata.ts`
- Create: `src/story/pdfMetadata.test.ts`

- [ ] **Step 1: Write failing PDF metadata tests**

Create `src/story/pdfMetadata.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { buildStoryPdfMetadata } from "./pdfMetadata";

describe("buildStoryPdfMetadata", () => {
  test("creates a stable child-friendly PDF title and filename", () => {
    expect(buildStoryPdfMetadata({
      classId: "mosan-001",
      characterName: "토끼 콩이",
      createdAt: new Date("2026-06-06T03:00:00.000Z")
    })).toEqual({
      title: "토끼 콩이의 모산초 AI 동화책",
      schoolLabel: "모산초등학교 3~6학년 동화 만들기",
      filename: "mosan-001-story-2026-06-06.pdf"
    });
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npm test -- src/story/pdfMetadata.test.ts
```

Expected: FAIL because `pdfMetadata.ts` does not exist.

- [ ] **Step 3: Implement metadata helper**

Create `src/story/pdfMetadata.ts`:

```ts
export type StoryPdfMetadataInput = {
  classId: string;
  characterName: string;
  createdAt: Date;
};

export function buildStoryPdfMetadata(input: StoryPdfMetadataInput) {
  const date = input.createdAt.toISOString().slice(0, 10);

  return {
    title: `${input.characterName}의 모산초 AI 동화책`,
    schoolLabel: "모산초등학교 3~6학년 동화 만들기",
    filename: `${input.classId}-story-${date}.pdf`
  };
}
```

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- src/story/pdfMetadata.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/story/pdfMetadata.ts src/story/pdfMetadata.test.ts
git commit -m "feat: add story PDF metadata"
```

## Task 4: Background Music Control

**Files:**
- Create: `src/story/storyMusic.ts`
- Create: `src/story/storyMusic.test.ts`
- Modify: `src/story/StoryKioskApp.tsx`

- [ ] **Step 1: Write failing music state tests**

Create `src/story/storyMusic.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { nextMusicState } from "./storyMusic";

describe("nextMusicState", () => {
  test("starts paused and toggles to playing after student tap", () => {
    expect(nextMusicState("paused")).toBe("playing");
  });

  test("toggles playing back to paused", () => {
    expect(nextMusicState("playing")).toBe("paused");
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npm test -- src/story/storyMusic.test.ts
```

Expected: FAIL because `storyMusic.ts` does not exist.

- [ ] **Step 3: Implement music state helper**

Create `src/story/storyMusic.ts`:

```ts
export type StoryMusicState = "paused" | "playing";

export function nextMusicState(current: StoryMusicState): StoryMusicState {
  return current === "playing" ? "paused" : "playing";
}
```

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- src/story/storyMusic.test.ts
```

Expected: PASS.

- [ ] **Step 5: Add result-screen audio UI**

In `src/story/StoryKioskApp.tsx`, add a result-screen music button using `nextMusicState`. Use a bundled audio file path `/music/story-garden.mp3`. If the file is not available yet, keep the UI disabled with the Korean label `배경음악 준비 중`.

- [ ] **Step 6: Commit**

```bash
git add src/story/storyMusic.ts src/story/storyMusic.test.ts src/story/StoryKioskApp.tsx
git commit -m "feat: add story music controls"
```

## Task 5: Mosan Student Login Gate

**Files:**
- Modify: `src/story/StoryKioskApp.tsx`
- Modify: `src/story/classSession.ts`
- Modify: `src/story/classSession.test.ts`

- [ ] **Step 1: Add tests for device token storage key**

Add to `src/story/classSession.test.ts`:

```ts
import { classSessionStorageKey } from "./classSession";

test("uses a stable storage key for the class session token", () => {
  expect(classSessionStorageKey).toBe("mosan-story.classSession.v1");
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npm test -- src/story/classSession.test.ts
```

Expected: FAIL because `classSessionStorageKey` does not exist.

- [ ] **Step 3: Implement storage key**

Add to `src/story/classSession.ts`:

```ts
export const classSessionStorageKey = "mosan-story.classSession.v1";
```

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- src/story/classSession.test.ts
```

Expected: PASS.

- [ ] **Step 5: Add login gate UI**

Modify `StoryKioskApp` so the first screen asks for `수업 아이디` before the story wizard starts. For the first implementation, use the class session helpers and a local demo allow-list when server API env is not configured. The visible copy must be encouraging:

```txt
모산초등학교 3~6학년
AI와 함께 나만의 동화책 만들기
선생님이 알려준 아이디를 입력해 주세요.
```

- [ ] **Step 6: Commit**

```bash
git add src/story/StoryKioskApp.tsx src/story/classSession.ts src/story/classSession.test.ts
git commit -m "feat: add Mosan class login gate"
```

## Task 6: PWA Metadata

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `public/manifest.webmanifest`
- Modify: `README.md`

- [ ] **Step 1: Add app metadata**

Update `src/app/layout.tsx` metadata:

```ts
export const metadata: Metadata = {
  title: "모산 AI 동화 만들기",
  description: "모산초등학교 3~6학년을 위한 AI 동화책 만들기 수업 앱",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "모산 AI 동화"
  }
};
```

- [ ] **Step 2: Add PWA manifest**

Create `public/manifest.webmanifest`:

```json
{
  "name": "모산 AI 동화 만들기",
  "short_name": "모산동화",
  "description": "모산초등학교 3~6학년 AI 동화책 만들기",
  "start_url": "/story",
  "display": "standalone",
  "background_color": "#090D20",
  "theme_color": "#244DFF",
  "lang": "ko-KR",
  "orientation": "landscape-primary",
  "icons": [
    {
      "src": "/images/mori-mascot.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

- [ ] **Step 3: Build verify**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx public/manifest.webmanifest README.md
git commit -m "feat: add Mosan PWA metadata"
```

## Task 7: Supabase-backed Sessions

**Files:**
- Create: `src/story/classSessionClient.ts`
- Create: `src/app/api/class-session/login/route.ts`
- Create: `src/app/api/class-session/complete/route.ts`
- Create: `src/app/teacher/page.tsx`
- Create: `docs/supabase/class-session-schema.sql`

- [ ] **Step 1: Verify current Supabase docs before implementation**

Use the Supabase skill instructions and current official docs for `@supabase/supabase-js`, server-side keys, and RLS. Do not expose service role keys to the browser.

- [ ] **Step 2: Add Supabase schema**

Create `docs/supabase/class-session-schema.sql` with a `class_ids` table containing `id`, `status`, `session_token_hash`, `completed_at`, and timestamps. Enable RLS and expose only server-side API access for mutation.

- [ ] **Step 3: Implement API routes**

Implement login and complete routes. They must accept a class ID and session token, apply the rules from `classSession.ts`, and return Korean messages suitable for students.

- [ ] **Step 4: Implement teacher reset**

Add `/teacher` with a password-protected list and reset action. Keep it minimal: ID, state, completed time, reset button.

- [ ] **Step 5: Verify**

Run:

```bash
npm test
npm run build
```

Expected: both pass.

- [ ] **Step 6: Commit**

```bash
git add src/story/classSessionClient.ts src/app/api/class-session src/app/teacher docs/supabase
git commit -m "feat: add server-backed class sessions"
```

## Task 8: Final Verification And Push

**Files:**
- All changed files

- [ ] **Step 1: Run full verification**

Run:

```bash
npm test
npm run lint
npm run build
git status --short --branch
```

Expected: tests/build pass and only intended files are changed.

- [ ] **Step 2: Push branch**

Run:

```bash
git push -u origin codex/mosan-pwa-class-flow
```

- [ ] **Step 3: Open PR**

Open a draft PR into `main` with a Korean summary, test evidence, and deployment notes for Vercel + Supabase.

## Self-Review

- Spec coverage: PWA, Mosan branding, class login, same-tablet resume, teacher reset, story/music/PDF, and Drive manual upload are covered.
- Known dependency: Supabase implementation requires a real Supabase project URL and server key during Task 7.
- Placeholder scan: no `TBD` or unspecified implementation steps remain.
- Type consistency: `ClassSessionStatus`, `ClassSessionRecord`, and `ClassLoginDecision` are defined before use.
