import { describe, expect, test } from "vitest";
import { defaultMusicGenreId, getMusicGenre, musicGenres, nextMusicState } from "./storyMusic";

describe("nextMusicState", () => {
  test("starts paused and toggles to playing after student tap", () => {
    expect(nextMusicState("paused")).toBe("playing");
  });

  test("toggles playing back to paused", () => {
    expect(nextMusicState("playing")).toBe("paused");
  });
});

describe("musicGenres", () => {
  test("uses the six attached classroom music files", () => {
    expect(musicGenres.map((genre) => genre.audioSrc)).toEqual([
      "/images/Brave%20Little%20Quest.mp3",
      "/images/Clouds%20of%20Gold.mp3",
      "/images/Moonlit%20Acorn.mp3",
      "/images/Moonlit%20Cradle.mp3",
      "/images/Morning%20Sprout.mp3",
      "/images/Clouds%20of%20Gold1.mp3"
    ]);
  });

  test("uses Moonlit Cradle as the default reading-friendly track", () => {
    const genre = getMusicGenre(defaultMusicGenreId);

    expect(genre.label).toBe("달빛자장");
    expect(genre.audioSrc).toBe("/images/Moonlit%20Cradle.mp3");
  });

  test("keeps every track quiet enough for story reading", () => {
    for (const genre of musicGenres) {
      expect(genre.volume).toBeGreaterThan(0);
      expect(genre.volume).toBeLessThanOrEqual(0.55);
    }
  });
});
