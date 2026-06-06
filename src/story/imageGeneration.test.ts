import { describe, expect, test } from "vitest";
import { imageGenerationFailureMessage } from "./imageGeneration";

describe("imageGenerationFailureMessage", () => {
  test("explains Gemini quota failures in classroom-friendly language", () => {
    expect(imageGenerationFailureMessage("image_quota_exceeded")).toContain("이미지 생성 한도");
  });

  test("keeps a helpful fallback for unknown image failures", () => {
    expect(imageGenerationFailureMessage("image_provider_failed")).toContain("잠시 뒤");
  });
});
