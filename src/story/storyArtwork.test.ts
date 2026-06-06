import { describe, expect, test } from "vitest";
import { getKioskArtworkSource, initialStoryArtworkSrc } from "./storyArtwork";

describe("getKioskArtworkSource", () => {
  test("keeps initial artwork before students choose the story background", () => {
    expect(getKioskArtworkSource({ step: "character", placeImageSrc: "/images/places/sea.png" })).toBe(initialStoryArtworkSrc);
    expect(getKioskArtworkSource({ step: "trait", placeImageSrc: "/images/places/sea.png" })).toBe(initialStoryArtworkSrc);
  });

  test("uses selected place artwork from the background step onward", () => {
    expect(getKioskArtworkSource({ step: "place", placeImageSrc: "/images/places/sea.png" })).toBe("/images/places/sea.png");
    expect(getKioskArtworkSource({ step: "events", placeImageSrc: "/images/places/sea.png" })).toBe("/images/places/sea.png");
  });

  test("uses generated images on the result screen before falling back to place artwork", () => {
    expect(
      getKioskArtworkSource({
        step: "result",
        placeImageSrc: "/images/places/sea.png",
        generatedImage: "data:image/png;base64,abc"
      })
    ).toBe("data:image/png;base64,abc");
    expect(getKioskArtworkSource({ step: "result", placeImageSrc: "/images/places/sea.png" })).toBe("/images/places/sea.png");
  });
});
