import { describe, expect, test } from "vitest";
import { nextMusicState } from "./storyMusic";

describe("nextMusicState", () => {
  test("starts paused and toggles to playing after student tap", () => {
    expect(nextMusicState("paused")).toBe("playing");
  });

  test("toggles playing back to paused", () => {
    expect(nextMusicState("playing")).toBe("paused");
  });
});
