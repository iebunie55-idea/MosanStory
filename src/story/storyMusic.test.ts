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
  test("recommends five classroom-friendly genres", () => {
    expect(musicGenres.map((genre) => genre.label)).toEqual(["모험", "신비", "평온", "명랑", "감동"]);
  });

  test("uses calm music as the default reading-friendly genre", () => {
    const genre = getMusicGenre(defaultMusicGenreId);

    expect(genre.label).toBe("평온");
    expect(genre.notes.length).toBeGreaterThanOrEqual(4);
    expect(genre.intervalMs).toBeGreaterThan(700);
  });
});
