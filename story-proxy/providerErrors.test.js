import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toProviderErrorResponse } from "./providerErrors.js";

describe("toProviderErrorResponse", () => {
  it("classifies Gemini quota errors without exposing provider internals", () => {
    const response = toProviderErrorResponse(
      new Error(
        'Provider HTTP 429: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details."}}'
      ),
      "image_provider_failed"
    );

    assert.equal(response.statusCode, 429);
    assert.equal(response.body.error, "image_quota_exceeded");
    assert.match(response.body.message, /이미지 생성 한도/);
    assert.equal(JSON.stringify(response.body).includes("You exceeded"), false);
  });
});
