import { describe, expect, test } from "vitest";
import { buildStoryPdfMetadata } from "./pdfMetadata";

describe("buildStoryPdfMetadata", () => {
  test("creates a stable child-friendly PDF title and filename", () => {
    expect(
      buildStoryPdfMetadata({
        classId: "mosan-001",
        characterName: "토끼 콩이",
        createdAt: new Date("2026-06-06T03:00:00.000Z")
      })
    ).toEqual({
      title: "토끼 콩이의 모산초 AI 동화책",
      schoolLabel: "모산초등학교 3~6학년 동화 만들기",
      filename: "mosan-001-story-2026-06-06.pdf"
    });
  });
});
