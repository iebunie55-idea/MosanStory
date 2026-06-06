function parseProviderHttpError(error) {
  const message = error instanceof Error ? error.message : String(error || "");
  const match = message.match(/^Provider HTTP (\d+):\s*([\s\S]*)$/);
  if (!match) {
    return { status: 0, providerMessage: "" };
  }

  const status = Number(match[1]);
  const payload = match[2] || "";
  try {
    const parsed = JSON.parse(payload);
    return {
      status,
      providerMessage: String(parsed?.error?.message || parsed?.message || "")
    };
  } catch {
    return { status, providerMessage: payload };
  }
}

export function toProviderErrorResponse(error, fallbackError = "provider_failed") {
  const { status, providerMessage } = parseProviderHttpError(error);
  const lowerMessage = providerMessage.toLowerCase();

  if (status === 429 || lowerMessage.includes("quota") || lowerMessage.includes("rate limit")) {
    return {
      statusCode: 429,
      body: {
        error: "image_quota_exceeded",
        message: "이미지 생성 한도가 잠시 초과되었어요. 조금 뒤 다시 시도하거나 선생님께 알려 주세요.",
        providerStatus: status || 429,
        retryAfterSeconds: 60
      }
    };
  }

  return {
    statusCode: 502,
    body: {
      error: fallbackError,
      message: "이미지를 만들지 못했어요. 잠시 뒤 다시 시도해 주세요.",
      providerStatus: status || undefined
    }
  };
}
