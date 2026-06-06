export const initialStoryArtworkSrc = "/images/story-default-bg.png";

export type KioskArtworkStep = "login" | "attract" | "character" | "trait" | "place" | "events" | "loading" | "result";

export function getKioskArtworkSource({
  step,
  placeImageSrc,
  generatedImage
}: {
  step: KioskArtworkStep;
  placeImageSrc: string;
  generatedImage?: string;
}) {
  if (step === "result") {
    return generatedImage || placeImageSrc;
  }

  if (step === "character" || step === "trait") {
    return initialStoryArtworkSrc;
  }

  return placeImageSrc;
}
