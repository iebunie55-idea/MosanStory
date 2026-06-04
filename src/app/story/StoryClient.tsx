"use client";

import dynamic from "next/dynamic";

export const StoryClient = dynamic(
  () => import("@/story/StoryKioskApp").then((mod) => mod.StoryKioskApp),
  {
    ssr: false,
    loading: () => (
      <main className="story-shell">
        <section className="start-hero" aria-label="동화 만들기 준비 중">
          <h1>동화 만들기</h1>
        </section>
      </main>
    )
  }
);
