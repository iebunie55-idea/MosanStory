export type StoryMusicState = "paused" | "playing";

export function nextMusicState(current: StoryMusicState): StoryMusicState {
  return current === "playing" ? "paused" : "playing";
}
