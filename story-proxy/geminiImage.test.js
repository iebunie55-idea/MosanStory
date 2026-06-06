import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildGeminiImageRequest, extractGeminiImageResult } from "./geminiImage.js";

describe("buildGeminiImageRequest", () => {
  it("uses the current Gemini image REST endpoint and API key header", () => {
    const request = buildGeminiImageRequest({
      model: "gemini-2.5-flash-image",
      key: "test-key",
      prompt: "Draw a friendly storybook rabbit."
    });

    assert.equal(
      request.url,
      "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-image:generateContent"
    );
    assert.equal(request.options.method, "POST");
    assert.equal(request.options.headers["Content-Type"], "application/json");
    assert.equal(request.options.headers["x-goog-api-key"], "test-key");
    assert.equal(request.url.includes("test-key"), false);

    const body = JSON.parse(request.options.body);
    assert.deepEqual(body.generationConfig.responseModalities, ["Image"]);
    assert.equal(body.contents[0].parts[0].text, "Draw a friendly storybook rabbit.");
  });
});

describe("extractGeminiImageResult", () => {
  it("extracts image data from Gemini image parts", () => {
    assert.deepEqual(
      extractGeminiImageResult({
        candidates: [
          {
            content: {
              parts: [
                { text: "Here is an image." },
                { inlineData: { mimeType: "image/png", data: "abc123" } }
              ]
            }
          }
        ]
      }),
      { b64: "abc123", mimeType: "image/png" }
    );
  });

  it("also supports snake_case image fields from REST responses", () => {
    assert.deepEqual(
      extractGeminiImageResult({
        candidates: [
          {
            content: {
              parts: [
                { inline_data: { mime_type: "image/jpeg", data: "def456" } }
              ]
            }
          }
        ]
      }),
      { b64: "def456", mimeType: "image/jpeg" }
    );
  });
});
