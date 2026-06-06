export type ImageGenerationResult =
  | {
      imageDataUrl: string;
      prompt: string;
    }
  | {
      error: string;
      message: string;
    };

export function imageGenerationFailureMessage(error?: string) {
  if (error === "image_quota_exceeded") {
    return "이미지 생성 한도가 잠시 초과되었어요. 글 동화는 저장할 수 있고, 조금 뒤 그림을 다시 만들 수 있어요.";
  }

  if (error === "class_access_denied" || error === "usage_limit") {
    return "이 아이디로 사용할 수 있는 그림 생성 횟수를 모두 사용했어요. 선생님께 알려 주세요.";
  }

  if (error === "rate_limited") {
    return "요청이 잠시 많아요. 잠시 뒤 다시 눌러 주세요.";
  }

  return "이미지를 만들지 못했어요. 잠시 뒤 다시 시도해 주세요.";
}

export function isGeneratedSceneImage(result: ImageGenerationResult | null): result is Extract<ImageGenerationResult, { imageDataUrl: string }> {
  return Boolean(result && "imageDataUrl" in result);
}
